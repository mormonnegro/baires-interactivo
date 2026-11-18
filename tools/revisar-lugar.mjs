// La revisión de un lugar hecho a mano (src/lugares/): una lista de controles que pasan o fallan —cada uno dice cómo
// arreglarlo— y una hoja con el lugar en cada año, para mirarla de un vistazo. Es lo que corre quien aporta un lugar
// antes de mandarlo, y lo que mira quien lo acepta. La guía está en .claude/skills/agregar-lugar/ y en CONTRIBUIR.md.
//
//   node tools/revisar-lugar.mjs <clave>      (o: npm run revisar -- <clave>)
//     <clave>            el nombre del archivo del lugar, sin «.js» (teatro-colon), o el de la lista LUGARES de src/hitos.js (teatroColon)
//     --cambiados        en vez de una clave: todos los lugares cuyo archivo cambió respecto de la rama base
//     --base <rama>      contra qué se compara (por omisión origin/main, o main)
//     --sin-navegador    solo los controles que no necesitan navegador (es lo que corre GitHub en cada pedido)
//     --sin-red          no pide la foto aérea de 1940 (la hoja sale sin ese recuadro)
//     --sin-compilar     no corre la compilación (`vite build`)
//     --puerto 5477      el puerto del servidor propio que levanta para las capturas
//     --del-autor        el pedido es del autor del visor, que sí puede tocar el generador y la configuración: eso pasa a ser un aviso
//     --chrome           solo dice qué navegador usaría (para pasárselo a tools/shot.mjs en la variable CHROME)
//
// Deja revision/<clave>.jpg (la hoja) y revision/<clave>.md (el resumen, para pegar en el pedido), con el nombre del archivo. La carpeta
// revision/ no va al repositorio. Sale con código 1 si algún control falla.
//
// No necesita nada que no esté en el repositorio (ni el escaneo del plano ni tmp/). El navegador es Chrome for Testing
// sin ventana: el de la variable CHROME o el que haya bajado playwright (`npx playwright-core install chromium`);
// nunca el navegador de uso diario. Si no hay, hace igual los controles que no lo necesitan y lo dice.
//
// Qué controla sin navegador: arma todos los lugares acá mismo (src/hitos.js corre en Node) y mide el que se pide
// —cuántos puntos pesa, en qué etapas existe, dónde cae—; lo compara con lo que el lugar declara de sí mismo
// (`export const LUGAR = {…}` en su archivo: src/lugares/LEEME.md); mira sus marcas, sus fichas y sus fotos; arma
// también la rama base y verifica que fuera del lugar no haya cambiado ni un punto; y lista los archivos que toca.
import { createServer, build } from 'vite';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';
import { aPlano, aMetros, grados } from './geo.mjs';
import { PLANO } from './plano.mjs';

// ------------------------------------------------------------------------------------------------- lo que se exige
/** Cuántos puntos de geometría puede sumar un lugar nuevo, según lo que declare ser (`clase`). El visor anda justo de
 *  memoria en los teléfonos: todos los lugares hechos a mano juntos son unos 2,3 millones de puntos. Un edificio suelto
 *  de los que hay pesa entre 6 y 22 mil; una plaza con todas sus épocas, entre 70 y 115 mil. */
export const CUPO = { edificio: 25000, conjunto: 90000 };
/** A cuántos metros del lugar puede caer, como mucho, la dirección que declara. */
const CERCA = 90;
/** Entre la esquina y las coordenadas que declara (dos fuentes distintas) no puede haber más que esto. */
const ACUERDO = 200;
/** La ficha: cuántas letras, como mucho, la línea de arriba (`era`), y entre cuántas el texto entero. */
const FICHA = { era: 130, min: 150, max: 1100, parrafos: 4 };
const LICENCIAS = /public domain|dominio p[úu]blico|\bPD\b|CC0|CC[ -]BY(?:[ -]SA)?(?![ -]N)/i;
// Lo que un aporte de lugar toca normalmente, y lo que no tiene que tocar nunca.
const ESPERADOS = [/^src\/lugares\//, /^src\/(hitos|marcas|fichas)\.js$/, /^src\/fotos\.json$/, /^fuentes\/fotos\//, /^public\/fotos\//, /^PENDIENTES\.md$/];
const VEDADOS = [
  [/^tools\/(crece|alturas)\.mjs$/, 'el generador de la ciudad'], [/^public\/(datos|plano)\//, 'los datos generados'],
  [/^src\/tinta\.js$/, 'cómo se dibuja todo'], [/^src\/(barrios|edificios|palermo|playas-retiro|plaza-colon)\.js$/, 'los solares y las plantas que usa el generador'],
  [/^tools\/revisar-(lugar|commits)\.mjs$/, 'las herramientas de revisión'], [/^\.github\//, 'la configuración de GitHub'], [/^((CLAUDE|COORDINAR|CONTRIBUIR)\.md|\.claude\/)/, 'las reglas del repositorio'],
  [/^(package(-lock)?\.json|wrangler\.jsonc|vite\.config\.mjs)$/, 'la configuración del proyecto'],
];

// ------------------------------------------------------------------------------------------------------- los avisos
const a = process.argv.slice(2), op = (n, d = null) => { const i = a.indexOf('--' + n); return i < 0 ? d : a[i + 1]; }, si = (n) => a.includes('--' + n);
const CON_VALOR = ['base', 'puerto'], claves0 = a.filter((x, i) => !x.startsWith('--') && !CON_VALOR.includes(a[i - 1]?.slice(2)));
const git = (...args) => { try { return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 28 }).trimEnd(); } catch { return null; } };
const m0 = (n) => Math.round(n).toLocaleString('es-AR');
const lee = (f) => JSON.parse(readFileSync(f, 'utf8'));

if (si('chrome')) { console.log(chrome() ?? 'No hay Chrome for Testing: definí CHROME o bajalo con `npx playwright-core install chromium`.'); process.exit(0); } // (para pasárselo a tools/shot.mjs: export CHROME="$(node tools/revisar-lugar.mjs --chrome)")
if (!claves0.length && !si('cambiados')) {
  console.log('uso: node tools/revisar-lugar.mjs <clave del lugar> [--base main] [--sin-navegador] [--sin-red] [--sin-compilar] [--puerto 5477]\n     node tools/revisar-lugar.mjs --cambiados [--sin-navegador]   (los lugares que cambian respecto de la rama base)\n\nLas claves están en la lista LUGARES de src/hitos.js.');
  process.exit(2);
}

// ---------------------------------------------------------------------------------------- los años y el repositorio
const AÑOS = [1867, ...lee('public/datos/crece.json').epocas.map((e) => e.año)], ULTIMA = AÑOS.length - 1;
/** La etapa de un año: la primera que ya lo encuentra hecho; −1 si es posterior a la última. */
const etapaDe = (año) => (año <= AÑOS[0] ? 0 : AÑOS.findIndex((x) => x >= año));
// (sin `--base`, de origin/main y main se toma la que tenga el punto de partida más cercano: una de las dos puede estar vieja)
const BASE = (() => {
  const pedida = op('base'); let mejor = null;
  for (const r of pedida ? [pedida] : ['origin/main', 'main']) {
    const b = git('merge-base', 'HEAD', r); if (!b) continue;
    const lejos = +(git('rev-list', '--count', `${b}..HEAD`) ?? 1e9);
    if (!mejor || lejos < mejor.lejos) mejor = { rama: r, commit: b, lejos };
  }
  return mejor;
})();
/** Los archivos que cambian respecto de la base (con lo que todavía no se commiteó y lo nuevo sin agregar). */
const TOCADOS = BASE ? [...new Set([...(git('diff', '--name-only', BASE.commit) ?? '').split('\n'), ...(git('ls-files', '--others', '--exclude-standard') ?? '').split('\n')].filter(Boolean))].sort() : null;

/** Qué lugares hay: de src/hitos.js, la clave de cada uno, su archivo y el orden en que se arman. */
function registro(texto) {
  const archivo = {}; for (const m of texto.matchAll(/^import (\w+) from '\.\/lugares\/([\w.-]+)\.js';/gm)) archivo[m[1]] = m[2];
  const lista = /const LUGARES = \{([^}]*)\}/.exec(texto)?.[1].split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  return { archivo, lista };
}
const REG = registro(readFileSync('src/hitos.js', 'utf8'));
const claveDe = (x) => (REG.lista.includes(x) ? x : Object.keys(REG.archivo).find((k) => REG.archivo[k] === x.replace(/\.js$/, '').replace(/^src\/lugares\//, '')) ?? x);
/** Con qué nombre salen la hoja y el resumen: el del archivo del lugar (teatro-colon), que es también el de su rama. */
const archivoDe = (k) => REG.archivo[k] ?? k;
let CLAVES = claves0.map(claveDe);
if (si('cambiados')) {
  if (!TOCADOS) { console.log('No encuentro la rama base (probá --base <rama>): no sé qué lugares cambiaron.'); process.exit(2); }
  const arch = TOCADOS.map((f) => /^src\/lugares\/([\w.-]+)\.js$/.exec(f)?.[1]).filter(Boolean);
  CLAVES = [...new Set([...CLAVES, ...Object.keys(REG.archivo).filter((k) => arch.includes(REG.archivo[k]) && REG.lista.includes(k))])];
  const sueltos = arch.filter((f) => !Object.values(REG.archivo).includes(f) && existsSync(`src/lugares/${f}.js`) && /export default/.test(readFileSync(`src/lugares/${f}.js`, 'utf8')));
  if (sueltos.length) { console.log(`FALLA  Hay archivos nuevos en src/lugares/ que no están registrados en src/hitos.js: ${sueltos.join(', ')}.\n       Cómo se arregla: sumá el import y el nombre al final de la lista LUGARES.`); process.exitCode = 1; }
  if (!CLAVES.length) { console.log(`Ningún lugar de src/lugares/ cambia respecto de ${BASE.rama}: no hay nada que revisar.`); process.exit(process.exitCode ?? 0); }
}

// ------------------------------------------------------------------------------------- armar los lugares, sin navegador
/** Arma todo lo de src/hitos.js con los archivos de `raiz` (este repositorio, o una copia de la rama base) y devuelve
 *  las mallas tal como quedan, más las marcas, las fichas y lo que cada lugar declara. */
async function armar(raiz, claves) {
  const v = await createServer({ configFile: false, root: raiz, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true, hmr: false, watch: null, ws: false }, optimizeDeps: { noDiscovery: true, include: [] }, define: { __V__: '"0"' } });
  try {
    const THREE = await v.ssrLoadModule('three'), H = await v.ssrLoadModule('/src/hitos.js');
    const meta = lee('public/datos/ciudad.json'), b = readFileSync('public/datos/manzanas.bin'), mz = new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
    const avisos = [], warn = console.warn, error = console.error; console.warn = console.error = (...x) => avisos.push(x.map((e) => (e instanceof Error ? e.stack.split('\n').slice(0, 3).join(' ') : String(e))).join(' '));
    let h; try { h = H.createHitos({ meta, mz }, { make: () => new THREE.MeshBasicMaterial(), depth: () => new THREE.MeshBasicMaterial() }); } finally { console.warn = warn; console.error = error; }
    const raso = h.mesh.children.find((c) => !c.userData.trozo), at = (g) => Object.fromEntries(Object.entries(g.attributes).map(([k, x]) => [k, { array: x.array, n: x.itemSize }]));
    const M = await v.ssrLoadModule('/src/marcas.js'), F = await v.ssrLoadModule('/src/fichas.js'), decl = {};
    for (const k of claves) { const arch = registro(readFileSync(join(raiz, 'src/hitos.js'), 'utf8')).archivo[k]; if (arch) try { decl[k] = (await v.ssrLoadModule(`/src/lugares/${arch}.js`)).LUGAR ?? null; } catch { decl[k] = null; } }
    return { puntos: h.puntos ?? {}, tramos: H.TRAMOS ? { ...H.TRAMOS } : null, malla: at(h.mesh.geometry), raso: raso ? at(raso.geometry) : null, arboles: h.arboles, avisos, marcas: M.LUGARES, fichas: F.FICHAS, fotos: F.FOTOS, decl };
  } finally { await v.close(); }
}
/** Lo que se mide de un lugar en las mallas: la caja que ocupa (en metros del mundo), el alto y qué hay en cada etapa. */
function medir(A, clave) {
  const t = A.tramos?.[clave]; if (!t) return null;
  const caja = [Infinity, Infinity, -Infinity, -Infinity], codigos = new Map(); let alto = 0, n = 0;
  for (const [g, i0, i1] of [[A.malla, t[0], t[3]], [A.raso, t[1], t[4]]]) {
    if (!g) continue; const p = g.position.array, I = g.aInfo.array;
    for (let i = i0; i < i1; i++) { const x = p[i * 3], y = p[i * 3 + 1], z = p[i * 3 + 2], c = Math.floor(I[i * 4 + 3] / 20000); if (x < caja[0]) caja[0] = x; if (z < caja[1]) caja[1] = z; if (x > caja[2]) caja[2] = x; if (z > caja[3]) caja[3] = z; if (y > alto) alto = y; codigos.set(c, (codigos.get(c) ?? 0) + 1); n++; }
  }
  const arboles = A.arboles.slice(t[2], t[5]); // (en la lista de árboles van [x, z, radio, desde, hasta])
  for (const [x, z, r, d = 0, h = 0] of arboles) { if (x - r < caja[0]) caja[0] = x - r; if (z - r < caja[1]) caja[1] = z - r; if (x + r > caja[2]) caja[2] = x + r; if (z + r > caja[3]) caja[3] = z + r; const c = d + 8 * h; codigos.set(c, (codigos.get(c) ?? 0) + 1); }
  // por etapa: cuántos puntos hay en pie y una firma de qué piezas son (si cambia la firma, el lugar cambió)
  const etapas = []; for (let e = 0; e <= ULTIMA; e++) { const vivos = [...codigos].filter(([c]) => (c % 8) <= e && (!(c >> 3) || e < (c >> 3))).sort((x, y) => x[0] - y[0]); etapas.push({ n: vivos.reduce((s, [, k]) => s + k, 0), firma: vivos.map(([c]) => c).join(',') }); }
  return { n, caja, alto, codigos: [...codigos.keys()].sort((x, y) => x - y), etapas, arboles: arboles.length };
}
const dentro = (c, x, z, margen = 0) => x >= c[0] - margen && x <= c[2] + margen && z >= c[1] - margen && z <= c[3] + margen;
const aCaja = (c, x, z) => Math.hypot(Math.max(c[0] - x, 0, x - c[2]), Math.max(c[1] - z, 0, z - c[3]));
/** Una huella de todo lo que queda fuera de unas cajas: si dos armados dan la misma, fuera de ahí no cambió nada. */
function huellaFuera(A, cajas) {
  const h = createHash('sha1'); let cuenta = 0; const primeros = [];
  for (const g of [A.malla, A.raso]) {
    if (!g) continue; const p = g.position.array, n = p.length / 3, nombres = Object.keys(g).sort();
    for (let i = 0; i < n; i++) {
      if (cajas.some((c) => dentro(c, p[i * 3], p[i * 3 + 2], 2))) continue;
      for (const k of nombres) { const { array, n: t } = g[k]; h.update(new Uint8Array(array.buffer, array.byteOffset + i * t * array.BYTES_PER_ELEMENT, t * array.BYTES_PER_ELEMENT)); }
      cuenta++;
    }
  }
  const arboles = A.arboles.filter(([x, z]) => !cajas.some((c) => dentro(c, x, z, 2))); h.update(JSON.stringify(arboles));
  return { huella: h.digest('hex'), cuenta, arboles: arboles.length, primeros };
}
/** Dónde está la primera diferencia entre dos armados, fuera de las cajas (para decir cerca de qué). */
function primeraDiferencia(A, B, cajas) {
  for (const k of ['malla', 'raso']) {
    const ga = A[k], gb = B[k]; if (!ga || !gb) continue; const pa = ga.position.array, pb = gb.position.array, Ia = ga.aInfo.array, Ib = gb.aInfo.array; let i = 0, j = 0;
    const salta = (p, q) => cajas.some((c) => dentro(c, p[q * 3], p[q * 3 + 2], 2));
    for (;;) {
      while (i < pa.length / 3 && salta(pa, i)) i++; while (j < pb.length / 3 && salta(pb, j)) j++;
      const fa = i >= pa.length / 3, fb = j >= pb.length / 3; if (fa && fb) break;
      if (fa || fb) return fa ? [pb[j * 3], pb[j * 3 + 2], 'falta'] : [pa[i * 3], pa[i * 3 + 2], 'sobra'];
      if (pa[i * 3] !== pb[j * 3] || pa[i * 3 + 1] !== pb[j * 3 + 1] || pa[i * 3 + 2] !== pb[j * 3 + 2]) return [pa[i * 3], pa[i * 3 + 2], 'forma'];
      if (Ia[i * 4] !== Ib[j * 4] || Ia[i * 4 + 1] !== Ib[j * 4 + 1] || Ia[i * 4 + 3] !== Ib[j * 4 + 3]) return [pa[i * 3], pa[i * 3 + 2], Ia[i * 4] !== Ib[j * 4] ? 'color' : 'etapa'];
      i++; j++;
    }
  }
  return null;
}

// ------------------------------------------------------------------------------------------------ las esquinas de hoy
let CALLES = null;
/** El cruce de dos calles de hoy (los nombres de `node tools/esquina.mjs --calle …`), en píxeles del plano: todos los que haya. */
function cruces(nA, nB) {
  if (!CALLES) { CALLES = new Map(); for (const f of ['calles', 'avenidas']) for (const e of lee(`fuentes/osm/${f}.json`).elements) { const n = e.tags?.name; if (!n || !e.geometry) continue; if (!CALLES.has(n)) CALLES.set(n, []); CALLES.get(n).push(e.geometry.map((g) => aPlano(g.lat, g.lon))); } }
  const A = CALLES.get(nA), B = CALLES.get(nB); if (!A || !B) return { falta: !A ? nA : nB };
  const hallados = [];
  for (const ta of A) for (const tb of B) for (let p = 0; p + 1 < ta.length; p++) for (let q = 0; q + 1 < tb.length; q++) {
    const [x1, y1] = ta[p], [x2, y2] = ta[p + 1], [x3, y3] = tb[q], [x4, y4] = tb[q + 1], den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4); if (Math.abs(den) < 1e-9) continue;
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den, u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den, la = Math.hypot(x2 - x1, y2 - y1), lb = Math.hypot(x4 - x3, y4 - y3);
    if (t >= -8 / la && t <= 1 + 8 / la && u >= -8 / lb && u <= 1 + 8 / lb) { const P = [x1 + t * (x2 - x1), y1 + t * (y2 - y1)]; if (!hallados.some((h) => Math.hypot(h[0] - P[0], h[1] - P[1]) < 30)) hallados.push(P); }
  }
  return { hallados };
}
const mundo = ([px, py]) => [(px - PLANO.plaza[0]) * PLANO.metro, (py - PLANO.plaza[1]) * PLANO.metro];
const plano = ([x, z]) => [Math.round(x / PLANO.metro + PLANO.plaza[0]), Math.round(z / PLANO.metro + PLANO.plaza[1])];

// ------------------------------------------------------------------------------------------------------ los controles
/** Todos los controles de un lugar que no necesitan navegador. Devuelve la lista y lo medido. */
function controlar(clave, AQUI, ALLA) {
  const C = [], ok = (que, dato = '') => C.push({ e: 'ok', que, dato }), falla = (que, dato, arreglo) => C.push({ e: 'falla', que, dato, arreglo }), aviso = (que, dato, arreglo = '') => C.push({ e: 'aviso', que, dato, arreglo });
  const arch = REG.archivo[clave], ruta = arch && `src/lugares/${arch}.js`;
  // --- existe, está registrado, se arma
  if (!arch || !existsSync(ruta)) { falla('El lugar existe', `no hay ningún lugar «${clave}» en src/hitos.js`, 'La clave es el nombre con que se lo importa en src/hitos.js (`import miLugar from \'./lugares/mi-lugar.js\'`). Las que hay: ' + REG.lista.join(', ') + '.'); return { C }; }
  if (!REG.lista.includes(clave)) { falla('Está registrado', `${ruta} se importa en src/hitos.js pero «${clave}» no está en la lista LUGARES`, 'Sumalo al final de `const LUGARES = { … }`, en src/hitos.js.'); return { C }; }
  ok('El lugar existe y está registrado', `${ruta}, «${clave}» en LUGARES`);
  const nuevo = !!ALLA && !(clave in ALLA.puntos), cambia = nuevo || !TOCADOS || TOCADOS.includes(ruta);
  const rotos = AQUI.avisos.filter((x) => x.includes(`el lugar ${clave} `)), otros = AQUI.avisos.filter((x) => !x.includes(`el lugar ${clave} `));
  const M = medir(AQUI, clave);
  if (rotos.length) falla('Se arma sin errores', rotos[0].slice(0, 400), 'El archivo del lugar tira ese error al construirse: corregilo (las piezas y sus argumentos están en src/lugares/LEEME.md).');
  else if (!M || !M.n && !M.arboles) falla('Se arma sin errores', 'el lugar no pone ninguna pieza', 'La función que exporta el archivo (`export default function (c) { … }`) tiene que construir algo con `c.lugar(…)` o `c.obra(…)`.');
  else if (otros.length) aviso('Se arma sin errores', `el lugar se arma bien, pero al armar todo hay ${otros.length} advertencia(s) de otro lado: ${otros[0].slice(0, 200)}`);
  else ok('Se arma sin errores ni advertencias', `${m0(M.n)} puntos${M.arboles ? ` y ${M.arboles} árboles` : ''}, hasta ${M.alto.toFixed(0)} m de alto`);
  if (!M) return { C };
  const D = AQUI.decl[clave];

  // --- lo que declara
  if (!D) {
    (nuevo ? falla : aviso)('Declara qué es', `${ruta} no exporta \`LUGAR\``, 'Agregá `export const LUGAR = { nombre, clase, desde, esquina o coordenadas, marcas, fuentes, supuestos }` (el formato está en src/lugares/LEEME.md). Los lugares viejos pueden no tenerlo: sin eso no se controlan la dirección, los años ni las marcas.');
  } else {
    const faltan = ['nombre', 'clase', 'desde', 'marcas', 'fuentes', 'supuestos'].filter((k) => D[k] == null).concat(D.esquina || D.coordenadas ? [] : ['esquina o coordenadas']);
    if (faltan.length) falla('Declara qué es', `a \`LUGAR\` le falta: ${faltan.join(', ')}`, 'Completá esos campos en `export const LUGAR = { … }` (src/lugares/LEEME.md dice qué va en cada uno).'); else ok('Declara qué es', `«${D.nombre}», ${D.clase}`);
  }

  // --- las etapas
  const malas = M.codigos.filter((c) => (c % 8) > ULTIMA || ((c >> 3) && ((c >> 3) <= (c % 8) || (c >> 3) > ULTIMA)));
  const viva = M.etapas.map((x) => x.n > 0), primera = viva.indexOf(true), sale = primera < 0 ? -1 : viva.indexOf(false, primera);
  const tramo = primera < 0 ? 'nunca' : `desde ${AÑOS[primera]}${sale > 0 ? ` hasta que llega ${AÑOS[sale]}` : ''}`;
  if (malas.length) falla('Las etapas son válidas', `hay piezas con una etapa que no existe o que se van antes de aparecer (${malas.map((c) => `desde ${c % 8}, hasta ${c >> 3}`).join(' · ')}); las etapas van de 0 (${AÑOS[0]}) a ${ULTIMA} (${AÑOS[ULTIMA]})`, 'Revisá los `c.epoca(desde, hasta)`: `hasta` tiene que ser mayor que `desde` (o 0, para siempre). Usá `c.etapaDe(año)` en vez de números sueltos.');
  else if (primera < 0) falla('Las etapas son válidas', 'el lugar no aparece en ninguna etapa', 'Revisá los `c.epoca(desde, hasta)`.');
  else if (D?.desde != null) {
    const d = etapaDe(D.desde), o = D.obra != null ? etapaDe(D.obra) : d, h = D.hasta ? etapaDe(D.hasta) : 0;
    if (d < 0) falla('Las etapas coinciden con los años', `dice que es de ${D.desde}, y la línea de tiempo termina en ${AÑOS[ULTIMA]}`, 'Ese lugar todavía no entra en el visor. (Ojo: `c.etapaDe()` de un año posterior al último da 0, o sea «desde 1867».)');
    else if (D.hasta && h >= 0 && h <= d) falla('Las etapas coinciden con los años', `nace en ${D.desde} y se va en ${D.hasta}: entre dos planos seguidos (${AÑOS[Math.max(0, d - 1)]} y ${AÑOS[d]})`, 'Un lugar que nace y se va entre dos etapas no llega a verse en ninguna: no entra en el visor. Anotalo en PENDIENTES.md.');
    else if (primera !== d && primera !== o) falla('Las etapas coinciden con los años', `dice que es de ${D.desde}${D.obra ? ` (en obra desde ${D.obra})` : ''}, o sea que tendría que aparecer en ${AÑOS[Math.min(d, o)]}, y aparece en ${AÑOS[primera]}`, 'Usá `c.epoca(c.etapaDe(año))` con el año en que quedó hecho, o corregí `desde` en `LUGAR` si el año estaba mal.');
    else if (D.hasta && h > 0 && sale !== h) falla('Las etapas coinciden con los años', `dice que se va en ${D.hasta}, o sea que no tendría que estar en ${AÑOS[h]}, y ${sale < 0 ? 'no se va nunca' : `se va en ${AÑOS[sale]}`}`, 'Cerrá la época: `c.epoca(c.etapaDe(desde), c.etapaDe(hasta))`.');
    else if (!D.hasta && sale > 0) falla('Las etapas coinciden con los años', `se va en ${AÑOS[sale]} y \`LUGAR\` no dice cuándo se demolió`, 'Agregá `hasta: <año>` en `LUGAR` (con su fuente), o sacá el segundo número de `c.epoca()`.');
    else ok('Las etapas coinciden con los años', `${tramo}${D.hasta && h < 0 ? ` (se fue en ${D.hasta}, después del último plano)` : ''}`);
  } else ok('Las etapas son válidas', tramo);

  // --- el cupo de puntos
  const total = Object.values(AQUI.puntos).reduce((s, n) => s + n, 0), pct = ((AQUI.puntos[clave] / total) * 100).toFixed(1), peso = `${m0(AQUI.puntos[clave])} puntos (el ${pct} % de todos los lugares hechos a mano)`;
  const cupo = CUPO[D?.clase];
  if (D && !cupo && D.clase != null) falla('Entra en el cupo de puntos', `\`clase: '${D.clase}'\` no es ninguna de las que hay`, `Poné \`clase: 'edificio'\` (un edificio o un monumento suelto: hasta ${m0(CUPO.edificio)} puntos) o \`'conjunto'\` (una plaza, un parque, un estadio, varias cosas: hasta ${m0(CUPO.conjunto)}).`);
  else if (cupo && AQUI.puntos[clave] > cupo) (cambia ? falla : aviso)('Entra en el cupo de puntos', `${peso}; el cupo de un ${D.clase} es ${m0(cupo)}`, 'Sacá detalle que de arriba no se ve: menos lados en los cilindros (6 u 8 alcanzan), menos vanos, cornisas de una sola pieza, nada de interiores. Lo que más pesa son las cúpulas, los `T.tapete` grandes y las piezas repetidas en un `for`.');
  else if (cupo) ok('Entra en el cupo de puntos', `${peso}; el cupo de un ${D.clase} es ${m0(cupo)}`);
  else aviso('Entra en el cupo de puntos', `${peso}; sin \`clase\` declarada no hay cupo con qué comparar`);

  // --- la dirección
  const centro = [(M.caja[0] + M.caja[2]) / 2, (M.caja[1] + M.caja[3]) / 2]; let puntoDeclarado = null;
  if (D && (D.esquina || D.coordenadas)) {
    const pts = [], errores = [];
    if (D.esquina) { const r = cruces(...D.esquina); if (r.falta) errores.push(`no hay ninguna calle «${r.falta}» en el mapa de hoy`); else if (!r.hallados.length) errores.push(`«${D.esquina[0]}» y «${D.esquina[1]}» no se cruzan`); else pts.push(['la esquina', r.hallados.map(mundo).sort((p, q) => aCaja(M.caja, ...p) - aCaja(M.caja, ...q))[0]]); }
    if (D.coordenadas) { const [lat, lon] = D.coordenadas; if (!(lat < -34 && lat > -35 && lon < -58 && lon > -59)) errores.push(`las coordenadas [${D.coordenadas}] no caen en Buenos Aires (van [latitud, longitud], las dos negativas)`); else pts.push(['las coordenadas', mundo(aPlano(lat, lon))]); }
    const lejos = pts.map(([n, p]) => [n, aCaja(M.caja, ...p)]), peor = lejos.sort((p, q) => q[1] - p[1])[0];
    puntoDeclarado = pts[0]?.[1] ?? null;
    if (errores.length) falla('Está donde dice su dirección', errores.join('; '), 'Los nombres de calle son los de `node tools/esquina.mjs --calle <parte del nombre>`; las coordenadas, [latitud, longitud] de hoy.');
    else if (peor[1] > CERCA) falla('Está donde dice su dirección', `${peor[0]} que declara ${peor === lejos[0] && lejos.length > 1 ? '' : ''}queda${lejos.length > 1 ? 'n' : ''} a ${lejos.map(([n, d]) => `${m0(d)} m (${n})`).join(' y ')} del lugar; tiene que ser menos de ${CERCA}`, `O el lugar está mal puesto o la dirección está mal: no elijas una al azar. Volvé a ubicarlo con dos fuentes que no dependan una de la otra (\`node tools/esquina.mjs "Calle" "Otra"\` y \`--punto lat lon\`) y miralo en la hoja contra la foto aérea. El centro de lo construido hoy cae en [${plano(centro)}] del plano.`);
    else if (pts.length === 2 && Math.hypot(pts[0][1][0] - pts[1][1][0], pts[0][1][1] - pts[1][1][1]) > ACUERDO) falla('Está donde dice su dirección', `la esquina y las coordenadas que declara están a ${m0(Math.hypot(pts[0][1][0] - pts[1][1][0], pts[0][1][1] - pts[1][1][1]))} m una de la otra`, 'Una de las dos está mal: son dos fuentes del mismo lugar y tienen que coincidir.');
    else { (pts.length < 2 && nuevo ? aviso : ok)('Está donde dice su dirección', lejos.map(([n, d]) => `${n}: a ${m0(d)} m`).join(' · ') + (pts.length < 2 ? ' (una sola fuente: mejor declarar la esquina y también las coordenadas)' : ''), pts.length < 2 ? 'Sumá la otra en `LUGAR`: así quedan dos fuentes independientes de dónde está.' : ''); }
  }

  // --- las marcas y las fichas
  // (las suyas: las que llevan ese nombre y están cerca. Hay nombres repetidos lejos: los dos Teatro Colón)
  const deNombre = D?.marcas ? AQUI.marcas.filter((x) => D.marcas.includes(x[0])) : [], aMarca = (x) => aCaja(M.caja, ...mundo([x[1], x[2]]));
  const marcas = deNombre.filter((x) => aMarca(x) <= 150 || !deNombre.some((y) => y[0] === x[0] && aMarca(y) <= 150));
  if (D?.marcas) {
    const sinMarca = D.marcas.filter((n) => !marcas.some((x) => x[0] === n)), claveFicha = (x) => x[6]?.ficha ?? x[0], sinFicha = [...new Set(marcas.filter((x) => !AQUI.fichas[claveFicha(x)]).map(claveFicha))];
    if (!D.marcas.length) falla('Tiene marca', '`LUGAR.marcas` está vacío', 'Todo lugar lleva al menos una marca en src/marcas.js (la etiqueta que se toca) y su nombre va en `LUGAR.marcas`.');
    else if (sinMarca.length) falla('Tiene marca', `no hay ninguna marca que se llame ${sinMarca.map((n) => `«${n}»`).join(', ')} en src/marcas.js`, 'Agregala a la lista `LUGARES` de src/marcas.js: `[nombre, x, y del plano, alto en metros, nivel, nota corta, { desde, hasta, radio }]`. El nombre tiene que ser idéntico al de `LUGAR.marcas`.');
    else {
      const lejos = marcas.map((x) => [x, aCaja(M.caja, ...mundo([x[1], x[2]]))]).filter(([, d]) => d > 60);
      const fuera = marcas.filter((x) => { const d = x[6]?.desde ?? 0, h = x[6]?.hasta ?? 0; return d > ULTIMA || (h && (h <= d || h > ULTIMA)); });
      const huerfanas = marcas.filter((x) => { const d = x[6]?.desde ?? 0, h = x[6]?.hasta || ULTIMA + 1; for (let e = d; e < h && e <= ULTIMA; e++) if (!viva[e]) return true; return false; });
      if (fuera.length) falla('Tiene marca', `la marca «${fuera[0][0]}» tiene una época que no existe (${JSON.stringify(fuera[0][6])})`, `En las marcas, \`desde\` y \`hasta\` son números de etapa, de 0 (${AÑOS[0]}) a ${ULTIMA} (${AÑOS[ULTIMA]}).`);
      else if (lejos.length) falla('Tiene marca', `la marca «${lejos[0][0][0]}» está a ${m0(lejos[0][1])} m del lugar`, `La marca va sobre lo más alto del lugar, en píxeles del plano. El centro de lo construido cae en [${plano(centro)}].`);
      else if (huerfanas.length) falla('Tiene marca', `la marca «${huerfanas[0][0]}» vale en etapas en que el lugar no tiene nada construido (el lugar existe ${tramo})`, 'Poné en la marca el mismo `desde` y `hasta` (en etapas) que en `c.epoca()`.');
      else ok('Tiene marca', `${marcas.length} en src/marcas.js: ${[...new Set(marcas.map((x) => x[0]))].map((n) => `«${n}»`).join(', ')}`);
      if (marcas.some((x) => (x[5] ?? '').length > 170)) aviso('La nota de la marca es corta', `la de «${marcas.find((x) => (x[5] ?? '').length > 170)[0]}» pasa de 170 letras`, 'La nota es una sola oración: lo demás va en la ficha.');
    }
    if (marcas.length && sinFicha.length) falla('Tiene ficha', `no hay ficha para ${sinFicha.map((n) => `«${n}»`).join(', ')} en src/fichas.js`, 'Agregá la entrada en `FICHAS` (src/fichas.js) con la misma clave que el nombre de la marca (o la que la marca diga en `ficha:`): `{ era, texto: [párrafos], hoyEs, fotos, por }`.');
    else if (marcas.length) {
      const claves = [...new Set(marcas.map(claveFicha))], fichas = claves.map((k) => [k, AQUI.fichas[k]]); ok('Tiene ficha', claves.map((k) => `«${k}»`).join(', '));
      const largo = (f) => f.texto.join(' ').length, malas = [];
      for (const [k, f] of fichas) {
        if (!f.era && !f.eras) malas.push(`a «${k}» le falta \`era\` (la línea de arriba: qué es y de cuándo)`); else if ((f.era ?? '').length > FICHA.era) malas.push(`la \`era\` de «${k}» tiene ${f.era.length} letras (hasta ${FICHA.era})`);
        if (!Array.isArray(f.texto) || !f.texto.length) malas.push(`a «${k}» le falta \`texto\``); else if (largo(f) < FICHA.min || largo(f) > FICHA.max || f.texto.length > FICHA.parrafos) malas.push(`el texto de «${k}» tiene ${largo(f)} letras en ${f.texto.length} párrafo(s) (va entre ${FICHA.min} y ${FICHA.max}, en ${FICHA.parrafos} párrafos como mucho)`);
        if (f.por != null && ![f.por].flat().every((u) => /^@[A-Za-z0-9][A-Za-z0-9-]{0,38}$/.test(u))) malas.push(`el \`por\` de «${k}» no es un usuario de GitHub («@usuario»)`);
      }
      if (malas.length) falla('La ficha tiene el largo esperado', malas.join('; '), 'Una ficha son dos o tres párrafos cortos: qué era y de cuándo, qué pasó después, y al final qué es supuesto. Mirá las de «El Gasómetro» o «Cancha de Huracán» en src/fichas.js.');
      else ok('La ficha tiene el largo esperado', fichas.map(([k, f]) => `«${k}»: ${largo(f)} letras en ${f.texto.length} párrafo(s)`).join(' · '));
      if (nuevo && !fichas.some(([, f]) => f.por)) aviso('La ficha dice quién lo maquetó', 'ninguna ficha del lugar tiene `por`', 'Si no sos el autor del visor, poné `por: \'@tu-usuario-de-GitHub\'` en la ficha: es el crédito que se muestra.');
      // las fuentes y los supuestos
      if (!Array.isArray(D.fuentes) || !D.fuentes.length) falla('Tiene fuentes', '`LUGAR.fuentes` está vacío', 'Cada dato (años, autores, dirección, forma) sale de algún lado: listá en `LUGAR.fuentes` de dónde, con la dirección de la página y qué se tomó de ahí. Lo que no tenga fuente va en `supuestos`.');
      else if (D.fuentes.length < 2) aviso('Tiene fuentes', `una sola: ${D.fuentes[0]}`, 'Con una sola fuente no hay cómo cruzar los años: buscá una segunda (otro artículo, el pie de una foto fechada, un plano de época).');
      else ok('Tiene fuentes', `${D.fuentes.length} en \`LUGAR.fuentes\``);
      if (Array.isArray(D.supuestos)) {
        const todo = fichas.map(([, f]) => f.texto.join(' ')).join(' ');
        if (!D.supuestos.length) aviso('Dice qué es supuesto', '`LUGAR.supuestos` está vacío', '¿De verdad nada es supuesto? Casi siempre lo son las medidas, las alturas y lo que la foto no muestra.');
        else if (!/supuest|a ojo|no se sabe|no se conoce|no hay (foto|plano|imagen)|conjetur|no consta|probable/i.test(todo)) aviso('Dice qué es supuesto', `declara ${D.supuestos.length} supuesto(s) y la ficha no dice ninguno`, 'El último párrafo de la ficha tiene que decirlo con todas las letras («las medidas de la tribuna son supuestos»).');
        else ok('Dice qué es supuesto', `${D.supuestos.length} en \`LUGAR.supuestos\`, y la ficha lo dice`);
      }
      // las fotos
      const fotos = [...new Set(fichas.flatMap(([, f]) => f.fotos ?? []))], peros = [];
      for (const k of fotos) {
        const j = existsSync(`fuentes/fotos/${k}.json`) ? lee(`fuentes/fotos/${k}.json`) : null;
        if (!j) { peros.push(`a «${k}» le falta su procedencia (fuentes/fotos/${k}.json)`); continue; }
        if (!j.url || !j.licencia || !j.autor || !j.titulo) peros.push(`a fuentes/fotos/${k}.json le falta ${['url', 'licencia', 'autor', 'titulo'].filter((c) => !j[c]).join(', ')}`);
        else if (!LICENCIAS.test(j.licencia)) peros.push(`la licencia de «${k}» («${j.licencia}») no es dominio público ni una licencia libre`);
        if (!['jpg', 'png'].some((e) => existsSync(`fuentes/fotos/${k}.${e}`))) peros.push(`falta la imagen fuentes/fotos/${k}.jpg`);
        if (!existsSync(`public/fotos/${k}.webp`) || !existsSync(`public/fotos/m/${k}.webp`)) peros.push(`«${k}» no está en public/fotos (falta correr \`node tools/fotos.mjs\`)`);
        else if (!AQUI.fotos[k]) peros.push(`«${k}» no tiene pie en \`PIES\` (src/fichas.js) o no está en src/fotos.json`);
      }
      if (peros.length) falla('Cada foto tiene su procedencia y su licencia', peros.join('; '), 'Cada foto va en fuentes/fotos/<nombre>.jpg con su <nombre>.json al lado (`titulo`, `autor`, `fecha`, `licencia`, `url` de la página de donde salió); después `node tools/fotos.mjs` y el pie en `PIES` (src/fichas.js). Solo dominio público o licencia libre.');
      else if (!fotos.length) aviso('Cada foto tiene su procedencia y su licencia', 'la ficha no tiene ninguna foto', 'Si no hay una foto de época de dominio público, está bien: anotalo en PENDIENTES.md («fotos que faltan»).');
      else ok('Cada foto tiene su procedencia y su licencia', fotos.join(', '));
    }
  }

  // --- nada cambia fuera de su entorno
  if (ALLA) {
    const cajas = [M.caja]; const Mb = medir(ALLA, clave); if (Mb) cajas.push(Mb.caja);
    {
      const ha = huellaFuera(AQUI, cajas), hb = huellaFuera(ALLA, cajas);
      if (ha.huella === hb.huella) ok('No cambia nada fuera de su entorno', `los otros ${m0(ha.cuenta)} puntos y ${m0(ha.arboles)} árboles de los lugares hechos a mano son idénticos a los de ${BASE.rama}`);
      else {
        const d = primeraDiferencia(AQUI, ALLA, cajas), cerca = d && AQUI.marcas.map((x) => [x[0], Math.hypot(...mundo([x[1], x[2]]).map((v, i) => v - d[i]))]).sort((p, q) => p[1] - q[1])[0];
        const que = { color: 'cambiaron los colores', etapa: 'cambió la etapa de alguna pieza', forma: 'cambió la forma', falta: 'falta algo que estaba', sobra: 'hay piezas nuevas' }[d?.[2]] ?? 'cambiaron los árboles';
        falla('No cambia nada fuera de su entorno', `fuera del lugar ${que}${cerca ? `, cerca de «${cerca[0]}» ([${plano(d)}] del plano)` : ''}`, d?.[2] === 'color' ? 'Cada pieza que se agrega corre la tirada de colores de las que vienen después: el lugar nuevo tiene que ir ÚLTIMO en la lista LUGARES de src/hitos.js.' : 'Un aporte de lugar no toca los otros lugares. Si la diferencia es tuya, deshacela; si tu lugar tiene piezas lejos del resto (y por eso su caja es enorme), está bien que no cambie nada ahí afuera.');
      }
    }
    const idem = (x) => JSON.stringify(x), marcasB = new Set(AQUI.marcas.map(idem)), mPerdidas = ALLA.marcas.filter((x) => !marcasB.has(idem(x)) && !D?.marcas?.includes(x[0])).map((x) => x[0]);
    const fPropias = new Set(marcas.map((x) => x[6]?.ficha ?? x[0])), fCambiadas = Object.keys(ALLA.fichas).filter((k) => !fPropias.has(k) && idem(ALLA.fichas[k]) !== idem(AQUI.fichas[k]));
    if (mPerdidas.length || fCambiadas.length) aviso('No cambia marcas ni fichas ajenas', [mPerdidas.length ? `marcas que cambian o se van: ${[...new Set(mPerdidas)].join(', ')}` : '', fCambiadas.length ? `fichas que cambian: ${fCambiadas.join(', ')}` : ''].filter(Boolean).join(' · '), 'Si es a propósito (una marca vecina que hay que cortar en el año en que llega tu lugar, por ejemplo), contalo en el pedido.');
    else ok('No cambia marcas ni fichas ajenas');
  } else aviso('No cambia nada fuera de su entorno', 'no encontré la rama base para comparar', 'Corré con `--base <rama>` (la rama de la que saliste, por lo común main).');

  // --- los archivos que toca
  if (TOCADOS && cambia) {
    const vedados = TOCADOS.map((f) => [f, VEDADOS.find(([re]) => re.test(f))?.[1]]).filter(([, q]) => q), raros = TOCADOS.filter((f) => !ESPERADOS.some((re) => re.test(f)) && !VEDADOS.some(([re]) => re.test(f)));
    if (vedados.length) (si('del-autor') ? aviso : falla)('Toca solo lo suyo', `el aporte cambia ${vedados.map(([f, q]) => `${f} (${q})`).join(', ')}`, 'Un aporte de lugar no toca nada de eso. Deshacé esos cambios (`git checkout ' + (BASE?.rama ?? 'main') + ' -- <archivo>`); si tu lugar necesita que se despeje un solar o cambie una calle, pedilo en el pedido: lo hace el dueño.');
    else if (raros.length) aviso('Toca solo lo suyo', `además de lo esperado, cambia: ${raros.join(', ')}`, 'Puede estar bien; contá por qué en el pedido.');
    else ok('Toca solo lo suyo', `${TOCADOS.length} archivo(s), todos de los esperados`);
    const dh = (git('diff', '-U0', BASE.commit, '--', 'src/hitos.js') ?? '').split('\n').filter((l) => /^[+-][^+-]/.test(l)), ajenas = dh.filter((l) => !/^[+-]import \w+ from '\.\/lugares\/|^[+-]const LUGARES = /.test(l));
    if (ajenas.length) aviso('En src/hitos.js solo se registra', `hay ${ajenas.length} línea(s) cambiadas además del import y la lista LUGARES`, 'Las piezas nuevas que hagan falta van en el archivo del lugar, no en src/hitos.js.');
    const privados = []; for (const f of TOCADOS) { if (!existsSync(f) || /\.(jpg|jpeg|png|webp|pak|bin)$/i.test(f) || f === 'tools/revisar-lugar.mjs') continue; const t = readFileSync(f, 'utf8'); if (/\/Users\/[A-Za-z0-9._-]+\/|\/home\/[A-Za-z0-9._-]+\/|[A-Z]:\\Users\\[A-Za-z0-9]/.test(t)) privados.push(f); }
    if (privados.length) falla('No deja rutas de la máquina', `hay rutas de una carpeta personal en ${privados.join(', ')}`, 'Sacá esas rutas (las de tu máquina no le sirven a nadie más y dicen tu nombre de usuario): usá rutas relativas al repositorio.');
  }
  return { C, M, D, marcas, centro, puntoDeclarado, nuevo, tramo };
}

// ------------------------------------------------------------------------------------------------------- el navegador
function chrome() {
  if (process.env.CHROME) return existsSync(process.env.CHROME) ? process.env.CHROME : null;
  const raiz = { darwin: join(homedir(), 'Library/Caches/ms-playwright'), win32: join(process.env.LOCALAPPDATA ?? '', 'ms-playwright') }[platform()] ?? join(homedir(), '.cache/ms-playwright');
  if (!existsSync(raiz)) return null;
  const adentro = { darwin: ['chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', 'chrome-mac/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium'], win32: ['chrome-win/chrome.exe', 'chrome-win64/chrome.exe'] }[platform()] ?? ['chrome-linux/chrome', 'chrome-linux64/chrome'];
  for (const d of readdirSync(raiz).filter((x) => /^chromium-\d+$/.test(x)).sort((p, q) => +q.split('-')[1] - +p.split('-')[1])) for (const r of adentro) if (existsSync(join(raiz, d, r))) return join(raiz, d, r);
  return null;
}
/** La foto aérea de 1940 del mapa de la Ciudad, en el marco del plano (arriba el oeste), centrada en un punto del mundo:
 *  un cuadrado de `lado` metros en `N` píxeles. Las teselas se piden de a una, despacio, como en fuentes/1965/aerea.mjs. */
async function aerea(sharp, [cx, cz], lado, N) {
  const AGENTE = 'mapas-historicos/1.0 (visor de planos antiguos)', PAUSA = 2600, zoom = 18, guarda = 'revision/.teselas'; mkdirSync(guarda, { recursive: true });
  const BASE_T = 'https://servicios.usig.buenosaires.gob.ar/mapcache/tms/1.0.0/fotografias_aereas_1940_caba_3857@GoogleMapsCompatible';
  const mx = (lon) => ((lon + 180) / 360) * 256 * 2 ** zoom, my = (lat) => ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * 256 * 2 ** zoom;
  const [p0x, p0y] = plano([cx, cz]), aGrados = (px, py) => grados(...aMetros(px, py));
  const esquinas = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => aGrados(p0x + (sx * lado) / 2 / PLANO.metro, p0y + (sy * lado) / 2 / PLANO.metro)), xs = esquinas.map(([, lo]) => mx(lo)), ys = esquinas.map(([la]) => my(la));
  const x0 = Math.floor(Math.min(...xs) / 256), x1 = Math.floor(Math.max(...xs) / 256), y0 = Math.floor(Math.min(...ys) / 256), y1 = Math.floor(Math.max(...ys) / 256), nx = x1 - x0 + 1, ny = y1 - y0 + 1;
  if (nx * ny > 36) return null; // (no es para bajar la ciudad)
  const W = nx * 256, H = ny * 256, mosaico = Buffer.alloc(W * H * 3, 128), espera = (ms) => new Promise((r) => setTimeout(r, ms)); let pedidas = 0, hay = 0;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const f = `${guarda}/1940-${zoom}-${tx}-${ty}.raw`; let t = existsSync(f) ? readFileSync(f) : null;
    for (let intento = 0; !t && intento < 3; intento++) {
      if (pedidas++) await espera(PAUSA * (intento + 1)); // (el servidor falla de a ratos: otra vez, más despacio)
      try {
        const r = await fetch(`${BASE_T}/${zoom}/${tx}/${2 ** zoom - 1 - ty}.png`, { headers: { 'User-Agent': AGENTE }, signal: AbortSignal.timeout(20000) });
        if (r.status === 429) return null;
        if (!r.ok || !/image/.test(r.headers.get('content-type') ?? '')) { if (r.status === 404) break; continue; }
        t = await sharp(Buffer.from(await r.arrayBuffer())).removeAlpha().resize(256, 256).raw().toBuffer(); if (t.length === 256 * 256 * 3) writeFileSync(f, t); else t = null;
      } catch (e) { if (process.env.DEPURAR) console.log(e); if (!hay && pedidas >= 3) return null; } // (sin red: no se insiste)
    }
    if (t?.length === 256 * 256 * 3) { hay++; for (let y = 0; y < 256; y++) t.copy(mosaico, (((ty - y0) * 256 + y) * W + (tx - x0) * 256) * 3, y * 768, y * 768 + 768); }
  }
  if (!hay) return null;
  const tomar = (X, Y, c) => { const i = Math.max(0, Math.min(W - 2, Math.floor(X))), j = Math.max(0, Math.min(H - 2, Math.floor(Y))), u = Math.min(1, Math.max(0, X - i)), v = Math.min(1, Math.max(0, Y - j)), q = (j * W + i) * 3 + c; return mosaico[q] * (1 - u) * (1 - v) + mosaico[q + 3] * u * (1 - v) + mosaico[q + W * 3] * (1 - u) * v + mosaico[q + W * 3 + 3] * u * v; };
  const out = Buffer.alloc(N * N * 3), k = lado / N / PLANO.metro;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const [la, lo] = aGrados(p0x + (x - N / 2) * k, p0y + (y - N / 2) * k); for (let c = 0; c < 3; c++) out[(y * N + x) * 3 + c] = tomar(mx(lo) - x0 * 256, my(la) - y0 * 256, c); }
  return sharp(out, { raw: { width: N, height: N, channels: 3 } }).png().toBuffer();
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const LETRA = 'Helvetica, Arial, sans-serif';

/** Las capturas del lugar y la hoja. `nav`: { page } ya con el visor cargado. Devuelve lo que salió por la consola. */
async function hoja(clave, R, nav, sharp) {
  const { M, D, marcas } = R, { page } = nav;
  // qué etapas se muestran: la anterior a que aparezca, cada una en que cambia y aquella en que se va
  const filas = []; for (let e = 0; e <= ULTIMA; e++) { const antes = e ? M.etapas[e - 1] : { n: 0, firma: '' }, x = M.etapas[e]; if (x.firma === antes.firma) continue; if (!filas.length && e > 0) filas.push([e - 1, 'todavía no']); filas.push([e, !x.n ? 'ya no está' : !antes.n ? (e ? 'aparece' : 'desde el plano') : 'cambia']); }
  while (filas.length > 7) filas.splice(1, 1);
  // el encuadre: lo que ocupa el lugar y un poco más. El visor no se acerca a menos de 170 m: lo chico se recorta.
  const [x0, z0, x1, z1] = M.caja, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, radio = Math.max(Math.hypot(x1 - x0, z1 - z0) / 2, M.alto * 0.7, 22), ancho = radio * 2.9;
  const T15 = Math.tan((15 * Math.PI) / 180), AN = 880, AL = 660, CUAD = 660;
  const toma = async (año, ver, w, h, campo) => { // `campo`: cuántos metros tiene que abarcar el alto de la imagen
    const dist = Math.max(170, campo / 2 / T15), k = Math.min(1, campo / 2 / T15 / dist); // (k < 1: se recorta el centro)
    await page.evaluate(async ({ ver, año }) => { lab.ver(ver); lab.frente(9500); lab.epocas.elegir(año); await lab.finas(); lab.step(0, 2); }, { ver: { x: cx, z: cz, dist, ...ver }, año });
    await page.waitForTimeout(500);
    const png = await page.screenshot({ type: 'png' });
    // (la ventana no cambia de tamaño —el visor, en modo captura, no se repinta bien al cambiarla—: la vista cuadrada es el centro de la apaisada)
    const W2 = AN * 2, H2 = AL * 2, rw = Math.round(w * 2 * k), rh = Math.round(h * 2 * k);
    return sharp(png).extract({ left: Math.round((W2 - rw) / 2), top: Math.round((H2 - rh) / 2), width: rw, height: rh }).resize(w, h).png().toBuffer();
  };
  const color = async (v) => { if (await page.evaluate(() => document.getElementById('color').classList.contains('on')) !== v) { await page.evaluate(() => document.getElementById('color').click()); await page.evaluate(() => lab.finas()); } };
  const yaw = D?.mirar ?? -0.6, tomas = [];
  for (const [e, que] of filas) {
    await color(true);
    const obl = await toma(AÑOS[e], { yaw, pitch: 0.62 }, AN, AL, ancho * 0.8), cen = await toma(AÑOS[e], { yaw: 0, pitch: Math.PI / 2 }, CUAD, CUAD, ancho);
    await color(false);
    const tin = await toma(AÑOS[e], { yaw: yaw + 1.5, pitch: 0.5 }, AN, AL, ancho * 0.8);
    tomas.push({ e, que, obl, cen, tin }); console.log(`        ${AÑOS[e]} (${que}): tres vistas`);
  }
  // al costado: la foto aérea de 1940, en el mismo encuadre que la vista de arriba, y las fotos de época de la ficha
  const lado = []; let conAerea = false;
  const recuadro = (N) => { const s = N / ancho, r = (x, z) => [(x - cx) * s + N / 2, (z - cz) * s + N / 2], [ax, az] = r(x0, z0), [bx, bz] = r(x1, z1); let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${N}" height="${N}"><rect x="${ax}" y="${az}" width="${bx - ax}" height="${bz - az}" fill="none" stroke="#e02020" stroke-width="2.5" stroke-dasharray="9 5"/>`; if (R.puntoDeclarado) { const [px, pz] = r(...R.puntoDeclarado); svg += `<path d="M${px - 11} ${pz}H${px + 11}M${px} ${pz - 11}V${pz + 11}" stroke="#1060e0" stroke-width="3"/><circle cx="${px}" cy="${pz}" r="7" fill="none" stroke="#1060e0" stroke-width="2"/>`; } return Buffer.from(svg + '</svg>'); };
  if (!si('sin-red')) {
    const f = await aerea(sharp, [cx, cz], ancho, CUAD).catch((e) => { if (process.env.DEPURAR) console.log(e); return null; });
    if (f) { conAerea = true; lado.push({ img: await sharp(f).composite([{ input: recuadro(CUAD) }]).png().toBuffer(), w: CUAD, h: CUAD, pie: 'Foto aérea de 1940 (mapa de la Ciudad de Buenos Aires), en el mismo encuadre que la vista de arriba. En rojo, lo que ocupa el lugar; en azul, la dirección que declara. Los nombres de calle son los de hoy.' }); }
    else console.log('        sin la foto aérea de 1940 (no hubo respuesta del mapa de la Ciudad): la hoja sale sin ese recuadro');
  }
  const fichas = [...new Set((marcas ?? []).map((x) => x[6]?.ficha ?? x[0]))].map((k) => nav.fichas[k]).filter(Boolean);
  for (const k of [...new Set(fichas.flatMap((f) => f.fotos ?? []))].slice(0, 3)) { const f = `public/fotos/m/${k}.webp`; if (!existsSync(f)) continue; const img = sharp(f).resize({ width: CUAD, height: 520, fit: 'inside' }), b = await img.png().toBuffer(), m = await sharp(b).metadata(), p = nav.fotos[k]; lado.push({ img: b, w: m.width, h: m.height, pie: p ? `Foto de la ficha: ${p.que} ${[p.autor, p.fecha].filter(Boolean).join(', ')}.` : `Foto de la ficha (${k}).` }); }
  if (!lado.some((x) => x.pie.startsWith('Foto de la ficha'))) lado.push({ img: null, w: CUAD, h: 70, pie: 'La ficha no tiene foto de época.' });

  // la hoja
  const MAR = 28, SEP = 14, ROT = 150, CAB = 150, PIE = 40, Wg = ROT + AN + SEP + CUAD + SEP + AN, Hf = AL + SEP;
  const renglones = (t, n) => { const out = []; let l = ''; for (const p of t.split(' ')) { if ((l + ' ' + p).length > n) { out.push(l); l = p; } else l = l ? l + ' ' + p : p; } if (l) out.push(l); return out; };
  let yl = CAB + 34; for (const x of lado) { x.y = yl; x.r = renglones(x.pie, 92); yl += x.h + 20 + x.r.length * 19 + 22; }
  const W = MAR * 2 + Wg + SEP * 2 + CUAD, H = Math.max(CAB + 34 + filas.length * Hf, yl) + PIE + MAR;
  const fallas = R.C.filter((c) => c.e === 'falla').length, avisos = R.C.filter((c) => c.e === 'aviso').length, bien = R.C.filter((c) => c.e === 'ok').length;
  const xo = MAR + ROT, xc = xo + AN + SEP, xt = xc + CUAD + SEP, xl = MAR + Wg + SEP * 2;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="${LETRA}"><rect width="${W}" height="${H}" fill="#f4efe4"/>`;
  svg += `<text x="${MAR}" y="64" font-size="46" font-weight="bold" fill="#2a221b">${esc(D?.nombre ?? clave)}</text><text x="${MAR}" y="100" font-size="22" fill="#2a221b">${esc(`${clave} · src/lugares/${REG.archivo[clave]}.js · ${m0(M.n)} puntos · ${R.tramo}${D?.clase ? ` · ${D.clase}` : ''}`)}</text>`;
  svg += `<text x="${MAR}" y="134" font-size="22" font-weight="bold" fill="${fallas ? '#b01818' : '#1c6b2a'}">${esc(`${bien} controles bien${fallas ? `, ${fallas} con falla` : ''}${avisos ? `, ${avisos} aviso(s)` : ''}${fallas ? ': ' + R.C.filter((c) => c.e === 'falla').map((c) => c.que).join(' · ') : ''}`.slice(0, 190))}</text>`;
  for (const [t, x] of [['De costado, en color', xo], ['De arriba, en color (arriba es el oeste, como en el plano)', xc], ['Desde otro lado, en tinta', xt], ['Para comparar', xl]]) svg += `<text x="${x}" y="${CAB + 22}" font-size="19" fill="#2a221b" opacity=".75">${esc(t)}</text>`;
  const capas = [];
  tomas.forEach((t, i) => {
    const y = CAB + 34 + i * Hf; svg += `<text x="${MAR}" y="${y + 52}" font-size="50" font-weight="bold" fill="#2a221b">${AÑOS[t.e]}</text><text x="${MAR}" y="${y + 84}" font-size="20" fill="${t.que === 'todavía no' || t.que === 'ya no está' ? '#8a6a1a' : '#2a221b'}">${esc(t.que)}</text><text x="${MAR}" y="${y + 110}" font-size="16" fill="#2a221b" opacity=".6">etapa ${t.e}</text>`;
    capas.push({ input: t.obl, left: xo, top: y }, { input: t.cen, left: xc, top: y }, { input: t.tin, left: xt, top: y });
    capas.push({ input: recuadro(CUAD), left: xc, top: y });
  });
  for (const x of lado) { if (x.img) capas.push({ input: x.img, left: xl, top: x.y }); x.r.forEach((l, i) => { svg += `<text x="${xl}" y="${x.y + x.h + 24 + i * 19}" font-size="15.5" fill="#2a221b">${esc(l)}</text>`; }); }
  svg += `<text x="${MAR}" y="${H - MAR}" font-size="15" fill="#2a221b" opacity=".6">${esc(`Hoja de revisión de tools/revisar-lugar.mjs · contra ${BASE ? BASE.rama : 'ninguna rama'} · el recuadro rojo es lo que ocupa el lugar${conAerea ? '' : ' · sin la foto aérea de 1940'}`)}</text></svg>`;
  mkdirSync('revision', { recursive: true });
  await sharp(Buffer.from(svg)).composite(capas).jpeg({ quality: 84 }).toFile(`revision/${archivoDe(clave)}.jpg`);
  return { filas: filas.map(([e, q]) => `${AÑOS[e]} (${q})`), conAerea };
}

/** El resumen en texto, para pegar en el pedido. */
function resumen(clave, R, extra) {
  const S = { ok: '✅', falla: '❌', aviso: '⚠️' }, D = R.D, fallas = R.C.filter((c) => c.e === 'falla');
  let t = `## Revisión de \`${clave}\`${D?.nombre ? ` — ${D.nombre}` : ''}\n\n`;
  t += fallas.length ? `**${fallas.length} control(es) con falla.** No está listo para mandar.\n\n` : `**Todos los controles pasan**${R.C.some((c) => c.e === 'aviso') ? ' (hay avisos para mirar)' : ''}.\n\n`;
  t += '| | Control | Resultado |\n|---|---|---|\n' + R.C.map((c) => `| ${S[c.e]} | ${c.que} | ${(c.dato || '').replace(/\|/g, '\\|').replace(/\n/g, ' ')} |`).join('\n') + '\n';
  const arreglos = R.C.filter((c) => c.e !== 'ok' && c.arreglo); if (arreglos.length) t += '\n### Cómo se arregla\n\n' + arreglos.map((c) => `- **${c.que}.** ${c.arreglo}`).join('\n') + '\n';
  if (R.M) t += `\n### Lo medido\n\n- Puntos de geometría: ${m0(R.M.n)}${R.M.arboles ? `, y ${R.M.arboles} árboles` : ''}. Alto máximo: ${R.M.alto.toFixed(0)} m.\n- Existe ${R.tramo}. Por etapa: ${R.M.etapas.map((x, e) => `${AÑOS[e]}: ${x.n ? m0(x.n) : '—'}`).join(' · ')}.\n- Ocupa de [${plano([R.M.caja[0], R.M.caja[1]])}] a [${plano([R.M.caja[2], R.M.caja[3]])}] del plano (${m0(R.M.caja[2] - R.M.caja[0])} × ${m0(R.M.caja[3] - R.M.caja[1])} m).\n`;
  if (D?.fuentes?.length) t += '\n### Fuentes que declara\n\n' + D.fuentes.map((f) => `- ${f}`).join('\n') + '\n';
  if (D?.supuestos?.length) t += '\n### Lo que declara como supuesto\n\n' + D.supuestos.map((f) => `- ${f}`).join('\n') + '\n';
  if (D?.solar) t += `\n### Pide que se despeje un solar\n\n${D.solar}\n`;
  if (extra.hoja) t += `\n### La hoja\n\n\`revision/${archivoDe(clave)}.jpg\` (arrastrala al pedido): ${extra.hoja.filas.join(', ')}${extra.hoja.conAerea ? ', con la foto aérea de 1940' : ', sin la foto aérea de 1940'}.\n`;
  else t += `\n_Sin hoja de imágenes: ${extra.porQue}._\n`;
  if (TOCADOS && R.nuevo !== undefined) t += `\n<details><summary>Archivos que cambian respecto de ${BASE.rama} (${TOCADOS.length})</summary>\n\n${TOCADOS.map((f) => `- \`${f}\``).join('\n')}\n\n</details>\n`;
  return t;
}

// ---------------------------------------------------------------------------------------------------------- a correr
console.log(`Revisando ${CLAVES.join(', ')}${BASE ? ` contra ${BASE.rama} (${BASE.commit.slice(0, 7)})` : ' (sin rama base)'} · etapas: ${AÑOS.join(', ')}`);
// (si la base no tiene ni esta herramienta, es anterior al punto de partida: todo lo que cambió desde entonces va a figurar como del aporte)
if (BASE && !si('del-autor') && TOCADOS.includes('tools/revisar-lugar.mjs')) console.log(`Ojo: ${BASE.rama} es más vieja que la rama de la que saliste, y lo que cambió desde entonces va a figurar como tuyo. Traé lo último (git fetch origin) o pasá --base <la rama de la que saliste>.`);
const AQUI = await armar(process.cwd(), CLAVES);
let ALLA = null, copia = null;
if (BASE) {
  copia = `revision/.base-${process.pid}`; mkdirSync(copia, { recursive: true });
  try { execFileSync('sh', ['-c', `git archive ${BASE.commit} src | tar -x -C "${copia}"`], { stdio: 'ignore' }); ALLA = await armar(join(process.cwd(), copia), CLAVES); } catch (e) { console.log('  (no se pudo armar la rama base para comparar: ' + String(e.message).split('\n')[0] + ')'); }
  rmSync(copia, { recursive: true, force: true });
}
const RES = {}; for (const k of CLAVES) RES[k] = controlar(k, AQUI, ALLA);

// la compilación (una vez, para todos)
let compila = null;
if (!si('sin-compilar')) {
  const sale = `revision/.dist-${process.pid}`, t0 = Date.now(), log = console.log, warn = console.warn; console.log = console.warn = () => {};
  try { await build({ logLevel: 'silent', build: { outDir: sale, emptyOutDir: true } }); compila = { e: 'ok', que: 'Compila', dato: `\`vite build\`, en ${((Date.now() - t0) / 1000).toFixed(0)} s` }; }
  catch (e) { compila = { e: 'falla', que: 'Compila', dato: String(e.message).split('\n').slice(0, 3).join(' ').slice(0, 400), arreglo: 'Corré `npx vite build` y corregí lo que diga: casi siempre es un error de sintaxis o un import que no existe.' }; }
  console.log = log; console.warn = warn; rmSync(sale, { recursive: true, force: true });
  for (const k of CLAVES) RES[k].C.push(compila);
}

// el navegador: la consola del visor de verdad y la hoja
let nav = null, porQue = 'se corrió con --sin-navegador';
const conHoja = CLAVES.filter((k) => RES[k].M && (RES[k].M.n || RES[k].M.arboles));
if (!si('sin-navegador') && conHoja.length) {
  const exe = chrome(); let server = null, browser = null;
  if (!exe) { porQue = 'no encontré Chrome for Testing (definí CHROME, o bajalo con `npx playwright-core install chromium`)'; for (const k of CLAVES) RES[k].C.push({ e: 'aviso', que: 'Se ve bien en el visor', dato: porQue, arreglo: 'Sin navegador no hay hoja ni se prueba el visor de verdad: instalalo y volvé a correr.' }); }
  else try {
    const { chromium } = await import('playwright-core'), { default: sharp } = await import('sharp');
    const PUERTO = +op('puerto', 5477); if ([5430, 5440, 5441, 5456].includes(PUERTO)) throw new Error(`el puerto ${PUERTO} es de otra cosa: elegí otro`);
    server = await createServer({ server: { port: PUERTO, strictPort: true }, logLevel: 'silent' }); await server.listen();
    browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--ignore-gpu-blocklist', '--enable-gpu', ...(platform() === 'darwin' ? ['--use-angle=metal'] : [])] });
    const page = await browser.newPage({ viewport: { width: 880, height: 660 }, deviceScaleFactor: 2 }), consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(`[${m.type()}] ${m.text().slice(0, 300)}`); }); page.on('pageerror', (e) => consola.push(`[error] ${e.message.slice(0, 300)}`));
    await page.goto(`http://localhost:${PUERTO}/?capture`); await page.waitForFunction(() => window.lab?.ready && window.lab.hitos, null, { timeout: 180000 });
    // (sin carteles: en la hoja se mira el modelo. Las marcas ya las controla la lista)
    await page.addStyleTag({ content: 'body > *:not(canvas) { visibility: hidden !important; } canvas { visibility: visible !important; }' });
    const enVisor = await page.evaluate(() => ({ puntos: lab.hitos.puntos ?? null }));
    nav = { page, fichas: AQUI.fichas, fotos: AQUI.fotos };
    for (const k of conHoja) {
      console.log(`  ${k}: capturas`);
      const antes = consola.length, h = await hoja(k, RES[k], nav, sharp), nuevos = consola.slice(antes), todos = [...new Set(consola)];
      RES[k].hoja = h;
      const propios = todos.filter((x) => x.includes(`el lugar ${k} `));
      if (propios.length) RES[k].C.push({ e: 'falla', que: 'Se ve bien en el visor', dato: propios[0], arreglo: 'El lugar falla al armarse en el navegador: abrí el visor (`npx vite`) y mirá la consola.' });
      else if (enVisor.puntos && enVisor.puntos[k] !== AQUI.puntos[k]) RES[k].C.push({ e: 'falla', que: 'Se ve bien en el visor', dato: `en el navegador el lugar pone ${m0(enVisor.puntos[k] ?? 0)} puntos y acá ${m0(AQUI.puntos[k])}`, arreglo: 'El lugar no se arma igual en el navegador: ¿usa algo que solo existe en Node, o el azar (`Math.random`)? Tiene que salir siempre igual.' });
      else if (todos.length) RES[k].C.push({ e: 'aviso', que: 'Se ve bien en el visor', dato: `el visor carga y el lugar se arma, pero la consola dice: ${todos.slice(0, 2).join(' · ')}`, arreglo: nuevos.length ? 'Si eso aparece también en la rama base, no es tuyo.' : '' });
      else RES[k].C.push({ e: 'ok', que: 'Se ve bien en el visor', dato: `carga sin errores ni advertencias en la consola; ${h.filas.length} etapas en la hoja` });
    }
  } catch (e) { porQue = `el navegador no anduvo (${String(e.message).split('\n')[0].slice(0, 200)})`; for (const k of CLAVES) if (!RES[k].hoja) RES[k].C.push({ e: 'aviso', que: 'Se ve bien en el visor', dato: porQue, arreglo: 'Probá de nuevo; si el puerto está ocupado, `--puerto <otro>`.' }); }
  finally { await browser?.close().catch(() => {}); await server?.close().catch(() => {}); }
}

// el informe
mkdirSync('revision', { recursive: true });
let mal = 0;
for (const k of CLAVES) {
  const R = RES[k]; console.log(`\n${k}${R.D?.nombre ? ` — ${R.D.nombre}` : ''}`);
  for (const c of R.C) { console.log(`  ${{ ok: 'ok    ', falla: 'FALLA ', aviso: 'aviso ' }[c.e]} ${c.que}${c.dato ? ': ' + c.dato : ''}`); if (c.e !== 'ok' && c.arreglo) console.log(`         → ${c.arreglo}`); }
  const f = R.C.filter((c) => c.e === 'falla').length; mal += f;
  writeFileSync(`revision/${archivoDe(k)}.md`, resumen(k, R, { hoja: R.hoja, porQue }));
  console.log(`  ${f ? `${f} control(es) con FALLA` : 'todo bien'} · revision/${archivoDe(k)}.md${R.hoja ? ` · revision/${archivoDe(k)}.jpg` : ` (sin hoja: ${porQue})`}`);
}
process.exit(mal || process.exitCode ? 1 : 0);
