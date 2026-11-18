// Lo de hoy, puesto sobre el plano de 1867 (la georreferencia está en tools/geo.mjs y tools/calce.mjs):
//   public/datos/hoy.json        los lugares actuales (el Obelisco, el Congreso…), con su lugar en el plano
//   public/plano/hoy-cerca.webp  el mapa actual en líneas: todas las calles, las vías y la costa (8192 de ancho, un canal)
//   public/plano/hoy-lejos.webp  para ver el pliego entero (2048): R avenidas, vías y costa · G tierra ganada al río
//                                (lo que en 1867 era río y hoy no) · B el agua de hoy
// Calles, vías y agua: © los colaboradores de OpenStreetMap (ODbL), bajados con tools/osm.mjs a fuentes/osm/.
//   node tools/hoy.mjs [--ver]   (--ver: tmp/hoy-*.jpg, el resultado encima del plano, para mirar)
import sharp from 'sharp';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { PLANO, AGUA, SECO, RIACHUELO, MALDONADO, ARROYOS } from './plano.mjs';
import { aPlano, esFino, REFERENCIAS, USADAS, errorRef, aPlanoM } from './geo.mjs';

// [nombre, latitud, longitud, nivel (1: se ve de lejos), nota]
const HOY = [
  ['Obelisco', -34.60376, -58.38162, 1, 'Desde 1936. Acá estaba la iglesia de San Nicolás.'],
  ['Congreso', -34.60986389, -58.39269167, 1, 'Desde 1906.'],
  ['Puerto Madero', -34.607939, -58.364911, 1, 'El Puente de la Mujer.'],
  ['Estación Retiro', -34.59106, -58.37492, 1, 'Desde 1915, sobre relleno. La estación de 1867 estaba tierra adentro, al pie de la barranca.'],
  ['La Bombonera', -34.63565, -58.36465, 1, 'Desde 1940.'],
  ['Plaza Italia', -34.58137222, -58.42096667, 1, ''],
  ['Abasto', -34.60365, -58.41075, 1, ''],
  ['Aeroparque', -34.55888889, -58.41638889, 1, 'Desde 1947.'],
  ['Estadio Monumental', -34.54527778, -58.44972222, 1, 'Desde 1938.'],
  ['Facultad de Derecho', -34.5825, -58.39191667, 1, ''],
  ['Parque Lezama', -34.62666667, -58.36944444, 1, ''],
  ['Reserva Ecológica', -34.60388889, -58.3525, 1, ''],
  ['Parque Centenario', -34.60638889, -58.43555556, 1, ''],
  ['Teatro Colón de hoy', -34.60107, -58.38306, 2, 'De 1908. Ocupa el lugar de la Estación del Parque.'],
  ['Avenida de Mayo', -34.60895, -58.3787, 2, 'Todavía no existe: se abrió en 1894, por el medio de las manzanas. Acá, el Café Tortoni.'],
  ['Casa Rosada', -34.60805556, -58.37027778, 2, 'Sobre lo que quedaba del Fuerte.'],
  ['Luna Park', -34.60226944, -58.36867222, 2, 'Desde 1932.'],
  ['Torre Monumental', -34.59222, -58.37389, 2, 'La Torre de los Ingleses, de 1916.'],
  ['Biblioteca Nacional', -34.58444444, -58.39805556, 2, ''],
  ['Planetario', -34.56972222, -58.41166667, 2, ''],
  ['Caminito', -34.6393, -58.3628, 2, ''],
  ['Palacio de Aguas Corrientes', -34.60055556, -58.395, 2, 'Desde 1894.'],  // más referencias (coordenadas de Wikipedia en español)
  ['Galerías Pacífico', -34.59912, -58.374793, 2, ''],
  ['Palacio Barolo', -34.60955556, -58.38586111, 2, 'De 1923, sobre la Avenida de Mayo.'],
  ['Palacio Libertad', -34.6033, -58.3694, 2, 'El viejo Correo Central, de 1928.'],
  ['Plaza Dorrego', -34.62047222, -58.37177778, 2, 'En San Telmo.'],
  ['Estación Constitución', -34.62777778, -58.38130556, 2, ''],
  ['Estación Once', -34.60861111, -58.40888889, 2, ''],
  ['Facultad de Medicina', -34.59822222, -58.39836111, 2, ''],
  ['Usina del Arte', -34.628775, -58.3571, 2, ''],
  ['Puente Transbordador', -34.63847222, -58.35625, 2, 'De 1914, sobre el Riachuelo.'],
  ['Museo de Bellas Artes', -34.583986, -58.39297, 2, ''],
  ['MALBA', -34.577111, -58.403593, 2, ''],
  ['Jardín Japonés', -34.57533333, -58.40938889, 2, ''],
  ['Rosedal', -34.570633, -58.417287, 2, ''],
  ['Parque Las Heras', -34.58388901, -58.4086113, 2, 'Acá estuvo la Penitenciaría Nacional, de 1877 a 1962.'],
  ['Palermo Soho', -34.58709, -58.42817, 2, ''],
  ['Hospital Italiano', -34.6065833, -58.425, 2, ''],
  ['Parque de los Patricios', -34.63861111, -58.40925, 2, ''],
  ['Cancha de Huracán', -34.643494, -58.396511, 2, ''],
  ['Terminal de Ómnibus', -34.587222, -58.374444, 2, ''],
  ['Hotel de Inmigrantes', -34.584889, -58.372753, 2, 'De 1911.'],
  ['Hipódromo de Palermo', -34.5661, -58.4266, 2, ''],
  ['Puente Pueyrredón', -34.65677778, -58.37358333, 2, ''],
  ['Cancha de Racing', -34.6675, -58.368611, 2, ''],
  ['Cancha de Independiente', -34.670267, -58.370969, 2, ''],
  ['Edificio Kavanagh', -34.59541667, -58.37466667, 3, 'De 1936, frente a la Plaza San Martín.'],
  ['Teatro San Martín', -34.6044, -58.3886, 3, ''],
  ['Teatro Cervantes', -34.59888889, -58.38380556, 3, ''],
  ['Facultad de Ingeniería', -34.61763889, -58.36805556, 3, 'Sobre Paseo Colón.'],
  ['Floralis Genérica', -34.583019, -58.393263, 3, ''],
  ['Monumento de los Españoles', -34.574977, -58.415406, 3, ''],
  ['Jardín Botánico', -34.58246944, -58.41859722, 3, ''],
  ['La Rural', -34.57861111, -58.42086111, 3, ''],
  ['Las Violetas', -34.61116667, -58.42086111, 3, 'La confitería de Rivadavia y Medrano.'],
  ['Hospital Garrahan', -34.629945, -58.39187889, 3, ''],
];
console.log(esFino ? 'georreferencia: ajuste fino (tools/geo.json)' : 'georreferencia: solo las referencias (falta correr tools/calce.mjs)');
for (const r of REFERENCIAS) console.log(`${USADAS.includes(r) ? ' ' : '×'} ${r[0].padEnd(38)} ${errorRef(r, aPlanoM).toFixed(0).padStart(4)} m`);

const ver = process.argv.includes('--ver');
const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
/** Rellena (par-impar) lo que encierran unas líneas que, juntas, cierran. `k`: de la unidad de las líneas a píxeles. */
function rellenar(w, h, lineas, k, out = new Uint8Array(w * h)) {
  const filas = Array.from({ length: h }, () => []);
  for (const l of lineas) for (let i = 1; i < l.length; i++) {
    const ax = l[i - 1][0] * k, ay = l[i - 1][1] * k - 0.5, bx = l[i][0] * k, by = l[i][1] * k - 0.5;
    if (ay === by) continue;
    const y0 = Math.max(0, Math.ceil(Math.min(ay, by))), y1 = Math.min(h - 1, Math.ceil(Math.max(ay, by)) - 1);
    for (let y = y0; y <= y1; y++) filas[y].push(ax + ((y - ay) / (by - ay)) * (bx - ax));
  }
  for (let y = 0; y < h; y++) {
    const xs = filas[y].sort((a, b) => a - b);
    for (let s = 0; s + 1 < xs.length; s += 2) { const x0 = Math.max(0, Math.round(xs[s])), x1 = Math.min(w, Math.round(xs[s + 1])); if (x1 > x0) out.fill(1, y * w + x0, y * w + x1); }
  }
  return out;
}
const cerrar = (l) => [...l, l[0]];

// ------------------------------------------------------------------------------------------------ el río de 1867
// El polígono marcado a mano corre mar adentro, a 50 o 150 m de la orilla. De ahí a la costa el plano dibuja primero
// olas sueltas (para el paso 1, papel) y, contra la orilla, olas apretadas: una franja de tinta que termina en tierra.
// Así que desde el polígono se avanza por el papel hasta dar con esa franja, y por la franja hasta donde se acaba
// (nunca de la tinta de vuelta al papel: eso ya es la playa; y nunca por lo edificado).
const { data: cls, info } = await sharp('tmp/clases.png').extractChannel(0).raw().toBuffer({ resolveWithObject: true });
const cw = info.width, ch = info.height;
const rio67 = rellenar(cw, ch, [cerrar(AGUA)], 0.5);
{
  const paso = (m, veces, hacia) => { // crecer (o encoger) de a un píxel
    for (let v = 0; v < veces; v++) { const o = m.slice(); for (let y = 1; y < ch - 1; y++) for (let x = 1; x < cw - 1; x++) { const q = y * cw + x; if (m[q] !== hacia && (m[q - 1] === hacia || m[q + 1] === hacia || m[q - cw] === hacia || m[q + cw] === hacia)) o[q] = hacia; } m.set(o); }
  };
  const [fx0, fy0, fx1, fy1] = PLANO.interior.map((v) => v / 2);
  paso(rio67, 45, 0); // (el polígono a veces pisa la orilla: se arranca 60 m más adentro del río)
  const libre = (q) => { const x = q % cw, y = (q / cw) | 0; return x > fx0 && x < fx1 && y > fy0 && y < fy1 && !rio67[q]; };
  // rayado simple u otra tinta: así lee el paso 1 las olas apretadas (y lo que queda a 4 m de ellas: el papel entre ola y ola)
  const tin = new Uint8Array(cw * ch); for (let q = 0; q < cw * ch; q++) tin[q] = cls[q] === 2 || cls[q] === 4 ? 1 : 0;
  { const m = tin; for (let v = 0; v < 3; v++) { const o = m.slice(); for (let y = 1; y < ch - 1; y++) for (let x = 1; x < cw - 1; x++) { const q = y * cw + x; if (!m[q] && cls[q] === 0 && (m[q - 1] || m[q + 1] || m[q - cw] || m[q + cw])) o[q] = 1; } m.set(o); } }
  const tinta = (q) => tin[q] === 1;
  // por el papel se avanza "a lo ancho": solo donde hay 5 m de papel limpio alrededor. Así no se cuela por un corte en
  // la línea de la orilla ni entre los puntos de un bañado.
  const ancho = new Uint8Array(cw * ch); for (let q = 0; q < cw * ch; q++) ancho[q] = cls[q] === 0 || rio67[q] ? 1 : 0;
  for (let v = 0; v < 4; v++) { const o = ancho.slice(); for (let y = 1; y < ch - 1; y++) for (let x = 1; x < cw - 1; x++) { const q = y * cw + x; if (ancho[q] && !(ancho[q - 1] && ancho[q + 1] && ancho[q - cw] && ancho[q + cw] && ancho[q - cw - 1] && ancho[q - cw + 1] && ancho[q + cw - 1] && ancho[q + cw + 1])) o[q] = 0; } ancho.set(o); }
  const frente = () => { const f = []; for (let y = 1; y < ch - 1; y++) for (let x = 1; x < cw - 1; x++) { const q = y * cw + x; if (rio67[q] && !(rio67[q - 1] && rio67[q + 1] && rio67[q - cw] && rio67[q + cw])) f.push(q); } return f; };
  let borde = frente();
  for (let d = 0; d < Math.round(380 / 1.35) && borde.length; d++) {
    const sig = [];
    for (const q of borde) for (const n of [q - 1, q + 1, q - cw, q + cw]) if (ancho[n] && libre(n)) { rio67[n] = 1; sig.push(n); }
    borde = sig;
  }
  paso(rio67, 5, 1); // (lo que el avance a lo ancho dejó sin tocar: hasta la tinta)
  borde = frente();
  for (let d = 0; d < Math.round(95 / 1.35) && borde.length; d++) {
    const sig = [];
    for (const q of borde) for (const n of [q - 1, q + 1, q - cw, q + cw]) if (libre(n) && tinta(n)) { rio67[n] = 1; sig.push(n); }
    borde = sig;
  }
  paso(rio67, 3, 1); paso(rio67, 3, 0); // los huecos de papel entre ola y ola
  paso(rio67, 4, 0); paso(rio67, 4, 1); // y fuera lo que se coló por una línea (una costura del pliego, un cerco)
  const seco = SECO.map((p) => rellenar(cw, ch, [cerrar(p)], 0.5));
  for (let q = 0; q < cw * ch; q++) if (cls[q] === 1 || seco.some((s) => s[q])) rio67[q] = 0;
  // lo que quedó suelto en medio del agua y es chico (las letras del título, la rosa de los vientos, un muelle) es río
  const visto = new Uint8Array(cw * ch), pila = new Int32Array(cw * ch);
  for (let q0 = 0; q0 < cw * ch; q0++) {
    if (rio67[q0] || visto[q0]) continue;
    let n = 0, i = 0; pila[n++] = q0; visto[q0] = 1;
    while (i < n) { const q = pila[i++], x = q % cw; for (const v of [x > 0 ? q - 1 : -1, x < cw - 1 ? q + 1 : -1, q - cw, q + cw]) if (v >= 0 && v < cw * ch && !rio67[v] && !visto[v]) { visto[v] = 1; pila[n++] = v; } }
    if (n < 6000) for (let k = 0; k < n; k++) rio67[pila[k]] = 1;
  }
}

// un cauce marcado a mano (tools/plano.mjs): el eje, suavizado y engordado a su ancho
function cauce(tramos) {
  for (const { ancho, eje } of tramos) {
    let p = eje.map(([x, y]) => [x / 2, y / 2]);
    for (let v = 0; v < 2; v++) { const o = [p[0]]; for (let i = 0; i + 1 < p.length; i++) { const [ax, ay] = p[i], [bx, by] = p[i + 1]; o.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]); } o.push(p[p.length - 1]); p = o; }
    const r = ancho / 4;
    for (let i = 0; i + 1 < p.length; i++) { const [ax, ay] = p[i], [bx, by] = p[i + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay))); for (let k = 0; k <= n; k++) { const cx = ax + ((bx - ax) * k) / n, cy = ay + ((by - ay) * k) / n; for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(ch - 1, cy + r); y++) for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(cw - 1, cx + r); x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) rio67[y * cw + x] = 1; } }
  }
}
cauce(RIACHUELO);

if (process.argv.includes('--suelo')) {
  // el suelo para el modo en color (src/tinta.js): R el río de 1867 · G patios y fondos · B lo edificado
  // (el arroyo Maldonado entra solo acá: es agua para pintar, para el relieve y para no edificarle encima, pero no
  // cuenta entre lo que se le ganó al río en «lo de hoy»)
  cauce(MALDONADO);
  for (const a of ARROYOS) cauce(a.tramos); // (y el Manso y el Maciel, lo mismo)
  const rgb = Buffer.alloc(cw * ch * 3);
  for (let q = 0; q < cw * ch; q++) { rgb[q * 3] = rio67[q] ? 255 : 0; rgb[q * 3 + 1] = cls[q] === 2 ? 255 : 0; rgb[q * 3 + 2] = cls[q] === 1 || cls[q] === 3 ? 255 : 0; }
  for (const [n, a] of [['suelo', 4096], ['suelo-2k', 2048]]) await sharp(rgb, { raw: { width: cw, height: ch, channels: 3 }, limitInputPixels: false }).resize({ width: a }).webp({ quality: 72, effort: 6 }).toFile(`public/plano/${n}.webp`);
  console.log('public/plano/suelo.webp y suelo-2k.webp'); process.exit(0);
}
if (process.argv.includes('--rio')) {
  // (para mirar) el río de 1867 en azul sobre el plano, a media resolución, en tres recortes de la costa
  const pl = await sharp('fuentes/plano-1867.jpg', { limitInputPixels: false }).resize(cw, ch).removeAlpha().raw().toBuffer();
  for (let q = 0; q < cw * ch; q++) if (rio67[q]) { pl[q * 3] *= 0.55; pl[q * 3 + 1] *= 0.75; }
  const im = sharp(pl, { raw: { width: cw, height: ch, channels: 3 } });
  for (const [n, x, y, w, h] of [['sur', 2400, 4500, 2400, 1700], ['centro', 4300, 4300, 2400, 1500], ['norte', 6400, 2000, 2700, 2900]]) await im.clone().extract({ left: x, top: y, width: w, height: h }).jpeg({ quality: 80 }).toFile(`tmp/rio-${n}.jpg`);
}

// ------------------------------------------------------------------------------------------------ lo de OpenStreetMap
const falta = ['avenidas', 'calles', 'vias', 'agua', 'lagos'].filter((f) => !existsSync(`fuentes/osm/${f}.json`));
const lee = (f) => JSON.parse(readFileSync(`fuentes/osm/${f}.json`, 'utf8')).elements;
const W = 8192, S = W / PLANO.ancho, H = Math.round(PLANO.alto * S), KM = S / PLANO.metro; // KM: texels por metro
const W2 = 2048, S2 = W2 / PLANO.ancho, H2 = Math.round(PLANO.alto * S2);
const P = (g) => aPlano(g.lat, g.lon);
const adentro = (l) => l.some(([x, y]) => x > -300 && y > -300 && x < PLANO.ancho + 300 && y < PLANO.alto + 300);
if (falta.length) console.log('sin el mapa de hoy: falta bajar', falta.join(', '), '(node tools/osm.mjs)');
else {
  const CLASE = { motorway: 'autopista', trunk: 'autopista', primary: 'primaria', secondary: 'secundaria', tertiary: 'terciaria' };
  const L = { autopista: [], primaria: [], secundaria: [], terciaria: [], calle: [], via: [], desvio: [], costa: [] };
  for (const f of ['avenidas', 'calles']) for (const el of lee(f)) {
    if (el.type !== 'way' || !el.geometry || el.tags.area === 'yes') continue;
    const l = el.geometry.map(P); if (adentro(l)) L[CLASE[el.tags.highway] ?? 'calle'].push(l);
  }
  for (const el of lee('vias')) {
    if (el.type !== 'way' || !el.geometry || el.tags.tunnel === 'yes') continue;
    const l = el.geometry.map(P); if (adentro(l)) L[el.tags.service ? 'desvio' : 'via'].push(l);
  }
  // el agua de hoy: el río, los diques, las dársenas, el Riachuelo, los lagos
  const hoy = new Uint8Array(W * H), bordes = [];
  const cuerpos = [...lee('lagos').map((r) => r.members.filter((m) => m.geometry).map((m) => m.geometry.map(P))), ...lee('agua').filter((e) => e.tags.natural === 'water' && e.geometry).map((e) => [e.geometry.map(P)])];
  for (const lineas of cuerpos) {
    const m = rellenar(W, H, lineas, S); let n = 0;
    for (let q = 0; q < W * H; q++) if (m[q]) { hoy[q] = 1; n++; }
    if (n * (1 / KM) ** 2 > 2500) bordes.push(...lineas); // (un estanque de plaza no es costa)
  }
  // la costa: los bordes de esos cuerpos que tienen agua de un solo lado (donde un dique se toca con otro no hay orilla)
  const mojado = (x, y) => { x = Math.round(x); y = Math.round(y); return x >= 0 && y >= 0 && x < W && y < H ? hoy[y * W + x] : -1; };
  for (const l of bordes) {
    let tramo = null;
    for (let i = 1; i < l.length; i++) {
      const ax = l[i - 1][0] * S, ay = l[i - 1][1] * S, bx = l[i][0] * S, by = l[i][1] * S, d = Math.hypot(bx - ax, by - ay); if (d < 1e-6) continue;
      const n = Math.max(1, Math.ceil(d / 6)), nx = ((by - ay) / d) * 2.4, ny = (-(bx - ax) / d) * 2.4;
      for (let s = 0; s < n; s++) {
        const p = [ax + ((bx - ax) * s) / n, ay + ((by - ay) * s) / n], q = [ax + ((bx - ax) * (s + 1)) / n, ay + ((by - ay) * (s + 1)) / n], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
        const a = mojado(mx + nx, my + ny), b = mojado(mx - nx, my - ny);
        if (a >= 0 && b >= 0 && a !== b) { if (!tramo) L.costa.push((tramo = [[p[0] / S, p[1] / S]])); tramo.push([q[0] / S, q[1] / S]); } else tramo = null;
      }
    }
  }
  for (const [k, v] of Object.entries(L)) console.log(k.padEnd(11), v.length, 'líneas');

  // la tierra ganada al río: río en 1867, tierra hoy (dentro de la guarda)
  const ganada = new Uint8Array(W * H), [mx0, my0, mx1, my1] = PLANO.interior;
  let nG = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const px = (x + 0.5) / S, py = (y + 0.5) / S;
    if (px < mx0 || py < my0 || px > mx1 || py > my1) continue;
    if (rio67[Math.min(ch - 1, py >> 1) * cw + Math.min(cw - 1, px >> 1)] && !hoy[y * W + x]) { ganada[y * W + x] = 255; nG++; }
  }
  console.log('tierra ganada al río dentro del plano:', ((nG / KM / KM) / 1e6).toFixed(2), 'km²');

  // --- las dos láminas ---
  const d = (ls, s) => ls.map((l) => 'M' + l.map(([x, y]) => `${(x * s).toFixed(1)} ${(y * s).toFixed(1)}`).join('L')).join('');
  const svg = (w, h, capas) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#000"/><clipPath id="m"><rect x="${(mx0 * w / PLANO.ancho).toFixed(1)}" y="${(my0 * w / PLANO.ancho).toFixed(1)}" width="${((mx1 - mx0) * w / PLANO.ancho).toFixed(1)}" height="${((my1 - my0) * w / PLANO.ancho).toFixed(1)}"/></clipPath><g clip-path="url(#m)" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">${capas.map(([ls, s, ancho, extra = '']) => `<path d="${d(ls, s)}" stroke-width="${ancho.toFixed(2)}" ${extra}/>`).join('')}</g></svg>`);
  const dibujar = (w, h, capas) => sharp(svg(w, h, capas), { unlimited: true, limitInputPixels: false }).extractChannel(0).raw().toBuffer();
  mkdirSync('public/plano', { recursive: true });
  // de cerca: anchos en metros (las vías, con sus durmientes)
  const cerca = await dibujar(W, H, [
    [L.calle, S, 2.1 * KM], [L.terciaria, S, 2.4 * KM], [L.secundaria, S, 2.9 * KM], [L.primaria, S, 3.5 * KM], [L.autopista, S, 4.1 * KM],
    [L.desvio, S, 1.8 * KM], [L.via, S, 2.0 * KM], [L.via, S, 6.5 * KM, `stroke-linecap="butt" stroke-dasharray="${(1.8 * KM).toFixed(2)} ${(11 * KM).toFixed(2)}"`],
    [L.costa, S, 3.8 * KM],
  ]);
  await sharp(cerca, { raw: { width: W, height: H, channels: 1 } }).webp({ quality: 72, effort: 6 }).toFile('public/plano/hoy-cerca.webp');
  // de lejos: anchos en píxeles de la lámina (1 = unos 6 m)
  const r = await dibujar(W2, H2, [[L.secundaria, S2, 0.8, 'stroke="#ccc"'], [L.primaria, S2, 1.3], [L.autopista, S2, 1.6], [L.via, S2, 1.0], [L.costa, S2, 2.1]]);
  const chica = (m) => sharp(m, { raw: { width: W, height: H, channels: 1 } }).resize(W2, H2, { kernel: 'cubic' }).toColourspace('b-w').raw().toBuffer({ resolveWithObject: true }).then(({ data, info }) => { if (info.channels !== 1) throw new Error('canales'); return data; });
  const g = await chica(ganada), b = await chica(Buffer.from(hoy.map((v) => v * 255)));
  const rgb = Buffer.alloc(W2 * H2 * 3); for (let i = 0; i < W2 * H2; i++) { rgb[i * 3] = r[i]; rgb[i * 3 + 1] = g[i]; rgb[i * 3 + 2] = b[i]; }
  await sharp(rgb, { raw: { width: W2, height: H2, channels: 3 } }).webp({ lossless: true, effort: 6 }).toFile('public/plano/hoy-lejos.webp');
  for (const f of ['hoy-cerca', 'hoy-lejos']) console.log(f, (statSync(`public/plano/${f}.webp`).size / 1e6).toFixed(2), 'MB');

  if (ver) {
    // encima del plano, para mirar: entero y algunos recortes al tamaño de la lámina de cerca
    const plano = await sharp('fuentes/plano-1867.jpg', { limitInputPixels: false }).resize(W, H).raw().toBuffer({ resolveWithObject: true });
    const c = plano.info.channels, img = plano.data;
    for (let i = 0; i < W * H; i++) {
      const a = cerca[i] / 255, gg = ganada[i] ? 0.25 : 0;
      img[i * c] = img[i * c] * (1 - a) * (1 - gg) + 200 * a + 200 * gg * (1 - a); img[i * c + 1] *= (1 - a) * (1 - gg * 0.6); img[i * c + 2] *= (1 - a) * (1 - gg * 0.6);
    }
    const todo = sharp(img, { raw: { width: W, height: H, channels: c } });
    await todo.clone().resize(2400).jpeg({ quality: 82 }).toFile('tmp/hoy-todo.jpg');
    for (const [n, x, y] of [['centro', 10335, 9485], ['obelisco', 11216, 8411], ['retiro', 12950, 9400], ['constitucion', 7700, 8300], ['once', 10512, 5200], ['recoleta', 13900, 7300], ['boca', 6000, 11000], ['madero', 10300, 10500]])
      await todo.clone().extract({ left: Math.max(0, Math.round(x * S - 800)), top: Math.max(0, Math.round(y * S - 550)), width: 1600, height: 1100 }).jpeg({ quality: 85 }).toFile(`tmp/hoy-${n}.jpg`);
  }
}

// ------------------------------------------------------------------------------------------------ los lugares
const [mx0, my0, mx1, my1] = PLANO.marco, out = [];
const eraRio = (x, y) => rio67[Math.min(ch - 1, y >> 1) * cw + Math.min(cw - 1, x >> 1)] === 1;
for (const [nombre, lat, lon, nivel, nota] of HOY) {
  const [x, y] = aPlano(lat, lon).map(Math.round);
  if (x < mx0 + 60 || y < my0 + 60 || x > mx1 - 60 || y > my1 - 60) { console.log('fuera del plano:', nombre, x, y); continue; }
  const rio = eraRio(x, y);
  out.push({ nombre, x, y, nivel, rio, nota: [nota, rio ? 'En 1867, esto era río.' : ''].filter(Boolean).join(' ') });
  console.log(nombre.padEnd(30), x, y, rio ? '(río)' : '');
}
mkdirSync('public/datos', { recursive: true });
writeFileSync('public/datos/hoy.json', JSON.stringify(out));
