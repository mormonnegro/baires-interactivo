// Los edificios con nombre que se levantaron después de 1867 (los modela src/hitos.js): dónde están y cuánto miden.
// La planta de cada uno sale de OpenStreetMap (© sus colaboradores, ODbL), pasada al marco del plano de 1867.
//   node tools/edificios.mjs   → fuentes/osm/edificios.json, -2 y -3 (lo bajado, en tres tandas) y src/edificios.js (centro, rumbo, largo y ancho)
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { aPlano } from './geo.mjs';
import { PLANO } from './plano.mjs';

// clave, nombre, año en que se terminó (o se habilitó) y qué elementos del mapa lo forman (por número o por nombre)
const LISTA = [
  ['constitucion', 'Estación Constitución', 1887, ['way/187136691', 'way/461008067', 'way/533010875']],
  ['congreso', 'Congreso de la Nación', 1906, ['relation/2468981']],
  ['rosada', 'Casa Rosada', 1898, ['relation/2337969']],
  ['colon', 'Teatro Colón', 1908, /^Teatro Colón$/],
  ['retiro', 'Estación Retiro', 1915, ['way/147948780', 'way/301018499']],
  // (el mapa no lo trae con ese nombre: ocupa la manzana entera, y se la arma con las esquinas de sus cuatro calles)
  ['tribunales', 'Palacio de Tribunales', 1910, { calles: ['Talcahuano', 'Lavalle', 'Uruguay', 'Tucumán'], cerca: [-34.6018, -58.3852], vereda: 9 }],
  ['aguas', 'Palacio de Aguas Corrientes', 1894, ['relation/1376292']],
  ['once', 'Estación Once', 1898, ['way/149775784']],
  ['barolo', 'Palacio Barolo', 1923, /^Palacio Barolo$/],
  ['kavanagh', 'Edificio Kavanagh', 1936, /^Edificio Kavanagh$/],
  ['correo', 'Correo Central', 1928, ['way/17444532']],
  // los de la Diagonal Norte (los modela src/lugares/diagonal-norte.js). En el cruce con Florida, uno por esquina: el
  // Banco de Boston (Florida 99), La Equitativa del Plata (Diagonal 550), el Miguel Bencich (Diagonal 616) y, del otro
  // lado de la plazoleta, el Bencich de las dos cúpulas (Diagonal 615). En la punta contra la Plaza de Mayo, el Banco
  // Argentino Uruguayo (Diagonal 501), y en la manzana triangular de Maipú y Perón, La Continental (Diagonal 725).
  // (Años y direcciones, de Wikipedia en español; el mapa solo trae con nombre el Boston, el Bencich y —como
  // «Secretaría de Gabinete»— el Argentino Uruguayo: los otros tres se eligieron por su lugar y su planta.)
  ['boston', 'Banco de Boston', 1924, ['relation/9254658']],
  ['equitativa', 'La Equitativa del Plata', 1929, ['way/288588309']],
  ['bencich', 'Edificio Bencich', 1927, ['way/666813505']],
  ['miguelBencich', 'Edificio Miguel Bencich', 1927, ['way/666023955']],
  ['argentinoUruguayo', 'Banco Argentino Uruguayo', 1928, ['relation/9254659']],
  ['continental', 'La Continental', 1931, ['way/476423042']],
  // --- las tandas que siguen: cada una agrega acá sus renglones (y sus puntos en TANDAS, más abajo) ---
  // (tanda «centro»: la Avenida de Mayo y el centro, src/lugares/avenida-de-mayo.js)
  // La Prensa (Avenida de Mayo 575) y el Palacio Municipal (Avenida de Mayo y Bolívar) van de la avenida a Rivadavia;
  // el mapa los trae con nombre, igual que al Molino (Rivadavia y Callao). A la Galería Güemes (Florida 165, hasta San
  // Martín 170) y a Gath & Chaves (la esquina sudoeste de Florida y Perón) los trae partidos y sin nombre: se
  // eligieron por su lugar y su planta —el patio de ocho lados es el del gran hall de la tienda—, y como la planta
  // solo guarda los tres contornos más grandes, cada uno va en dos renglones para que el suelo se despeje entero.
  ['prensa', 'Edificio La Prensa', 1898, ['way/288804117']],
  ['municipal', 'Palacio Municipal', 1893, ['way/23633883']],
  ['molino', 'Confitería del Molino', 1916, ['way/708071953']],
  ['guemes', 'Galería Güemes', 1915, ['way/1483935230', 'way/666018250', 'way/1483935246', 'way/1483935245']],
  ['guemesFondo', 'Galería Güemes (el cuerpo de San Martín)', 1915, ['way/1483935244', 'relation/9272804']],
  ['gath', 'Gath & Chaves', 1914, ['relation/9272753', 'way/476423041', 'way/666813518']],
  ['gathAla', 'Gath & Chaves (la tira sobre Cangallo)', 1914, ['way/666813517']],
  // (tanda «retiro»: Retiro y la Plaza San Martín, src/lugares/retiro.js)
  // El Plaza Hotel (Florida 1005: la cuadra en diagonal de Florida, frente a la plaza), el Palacio Paz (Santa Fe 750, de
  // Maipú hacia Esmeralda: el mapa trae aparte, y no van acá, el pabellón de deportes de 1941 y lo de la esquina de
  // Esmeralda) y el Palacio San Martín (Arenales 761), los tres con nombre en el mapa. La Torre de los Ingleses y el
  // Pabellón Argentino no llevan planta: van por su punto del plano en src/lugares/retiro.js.
  ['plazaHotel', 'Plaza Hotel', 1909, ['way/670380262']],
  ['palacioPaz', 'Palacio Paz', 1914, ['relation/9327492']],
  ['palacioSanMartin', 'Palacio San Martín', 1909, ['relation/20146398']],
  // (tanda «modernos»: los de los años treinta y La Boca, src/lugares/modernos.js)
  // El Comega (Corrientes 222, esquina Alem), el Safico (Corrientes 456), el Luna Park (la manzana de Corrientes,
  // Bouchard, Lavalle y Madero) y el Abasto (Corrientes 3247) están en el mapa con su nombre; Obras Públicas figura
  // como «Ministerios de Salud y Desarrollo Social» (9 de Julio 1925) y la Bombonera (Brandsen 805), sin nombre: la
  // herradura de las tribunas y, aparte, el lado de los palcos. La planta del Abasto es la del shopping de hoy, que
  // llega hasta Lavalle: el mercado de 1934 ocupa la mitad que da a Corrientes.
  ['comega', 'Edificio Comega', 1933, ['way/195959420']],
  ['safico', 'Edificio Safico', 1934, ['way/476182422']],
  ['obrasPublicas', 'Ministerio de Obras Públicas', 1936, ['way/23633890']],
  ['lunaPark', 'Luna Park', 1932, ['way/30755463']],
  ['abasto', 'Mercado de Abasto', 1934, ['way/303890025']],
  ['bombonera', 'Estadio de Boca Juniors', 1940, ['way/369948707', 'way/503647155']],
  // (tanda «viejos»: si alguno de los de 1867 necesita su planta de hoy, src/lugares/viejos-1867.js)
  // (tanda «obelisco»: lo que rodeaba a la Plaza de la República hacia 1940, src/lugares/obelisco-1940.js)
  // El Gran Rex (Corrientes 857) y el Broadway (Corrientes 1155) están en el mapa con su nombre. Los demás, sin él, se
  // eligieron por su lugar y su planta, mirándolos contra la foto aérea de 1940: el Ópera (Corrientes 860: la sala
  // justo enfrente del Gran Rex), el Tabarís (Corrientes 829: el segundo lote al este del Gran Rex, por la numeración),
  // el Trust Joyero Relojero (la esquina sudeste de Corrientes y Carlos Pellegrini) con su vecino de la punta de la
  // Diagonal Norte, el edificio Díaz (Sarmiento 1113: el segundo lote desde Cerrito, 63 m de fondo y unos 1000 m² por
  // piso, como dice su artículo), la casa de al lado —la esquina de Sarmiento y Cerrito, que llevaba la otra torre de
  // letras de la mueblería—, los tres lotes de Cerrito al 300 que quedan entre esa y la de Corrientes, y la casa de la esquina sudoeste de Corrientes y Cerrito. Años, de Wikipedia en
  // español; a los que no tienen fecha escrita se les pone la de la foto más vieja en que ya se los ve enteros.
  ['trust', 'El Trust Joyero Relojero', 1925, ['relation/18217094']],
  ['trustVecino', 'Diagonal Norte y Carlos Pellegrini', 1937, ['way/1328627973']],
  ['diaz', 'Edificio Díaz', 1927, ['way/675937167']],
  ['diazEsquina', 'Sarmiento y Cerrito', 1937, ['way/1329134227']],
  ['cerrito300', 'Cerrito al 300', 1937, ['way/1329134228', 'way/1329134229', 'way/1329134230']],
  ['granRex', 'Cine Gran Rex', 1937, ['way/476390086']],
  ['opera', 'Cine Teatro Ópera', 1936, ['way/150859384']],
  ['tabaris', 'Tabarís', 1937, ['way/669616797']],
  ['broadway', 'Teatro Broadway', 1930, ['way/1330706724']],
  ['esquinaCerrito', 'Corrientes y Cerrito', 1936, ['way/1329134231']],
];
// (dónde se buscó: alrededor de cada uno, y por nombre los que el mapa tiene como relación)
const DONDE = [[-34.6276, -58.3807], [-34.6098, -58.3926], [-34.6081, -58.3703], [-34.6011, -58.3831], [-34.5916, -58.3744], [-34.6018, -58.3852], [-34.6002, -58.3945], [-34.6090, -58.4076], [-34.6096, -58.3859], [-34.5955, -58.3746], [-34.6035, -58.3695]];
const archivo = 'fuentes/osm/edificios.json';
const pedir = async (q, a) => {
  if (existsSync(a)) return;
  const SERVIDORES = ['https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(SERVIDORES[i % SERVIDORES.length], { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'mapas-historicos/1.0 (visor de planos antiguos)' }, body: 'data=' + encodeURIComponent(q), signal: AbortSignal.timeout(120000) });
      const t = await r.text(); if (!r.ok) throw new Error(r.status + ' ' + t.slice(0, 100)); JSON.parse(t); writeFileSync(a, t); break;
    } catch (e) { console.log('  falló (' + e.message + ')'); if (i >= 5) throw e; await new Promise((s) => setTimeout(s, 5000 * (i + 1))); }
  }
};
await pedir(`[out:json][timeout:120];(${DONDE.map(([la, lo]) => `wr(around:160,${la},${lo})[building];wr(around:160,${la},${lo})[railway=station];`).join('')});out tags geom;`, archivo);
// (los que el mapa tiene como relación: hay que pedirlos enteros, con sus miembros)
await pedir(`[out:json][timeout:120];relation(id:${LISTA.flatMap(([, , , q]) => (Array.isArray(q) ? q : [])).filter((q) => q.startsWith('relation/')).map((q) => q.slice(9)).join(',')});out geom;`, 'fuentes/osm/edificios-2.json');
// (la tercera tanda: los de la Diagonal Norte, de San Martín a Suipacha. Todo lo edificado a 130 m de cada esquina,
// enteros —con sus etiquetas y sus miembros—, para elegir de ahí por número)
const DIAGONAL = [[-34.6080, -58.3736], [-34.6072, -58.3751], [-34.6064, -58.3766], [-34.6056, -58.3780], [-34.6048, -58.3795]];
await pedir(`[out:json][timeout:120];(${DIAGONAL.map(([la, lo]) => `wr(around:130,${la},${lo})[building];`).join('')});out geom;`, 'fuentes/osm/edificios-3.json');
// (las tandas que siguen: todo lo edificado a 130 m de cada punto [lat, lon], entero, para elegir de ahí por número.
// Cada tanda baja a su archivo, fuentes/osm/edificios-<tanda>.json, una sola vez: si se le agregan puntos, hay que
// borrar ese archivo para que lo vuelva a pedir.)
const TANDAS = {
  // (La Prensa y el Palacio Municipal, sobre la Avenida de Mayo; el Molino, en Callao y Rivadavia; la Galería Güemes y Gath & Chaves, sobre Florida)
  centro: [[-34.6081, -58.3744], [-34.6081, -58.3737], [-34.6090, -58.3922], [-34.6064, -58.3750], [-34.6062, -58.3740], [-34.6057, -58.3754]],
  retiro: [[-34.59605, -58.37505], [-34.5960, -58.3777], [-34.5955, -58.3784], [-34.5938, -58.3781], [-34.5932, -58.3784], [-34.59233, -58.37411]],
  modernos: [[-34.6034, -58.3708], [-34.6034, -58.3728], [-34.6124, -58.3812], [-34.6023, -58.3687], [-34.6037, -58.4107], [-34.6029, -58.4107], [-34.6356, -58.3648], [-34.6349, -58.3648], [-34.6383, -58.3562]], // el Comega, el Safico, Obras Públicas, el Luna Park, el Abasto, la Bombonera y el Transbordador
  viejos: [],
  // (el Obelisco, src/lugares/obelisco-1940.js: el Trust Joyero, el edificio Díaz, el Broadway, el Gran Rex y el Ópera, y la punta de la Diagonal Norte en Esmeralda)
  obelisco: [[-34.6035, -58.3789], [-34.6039, -58.3808], [-34.6036, -58.3831], [-34.6047, -58.3826], [-34.6030, -58.3826], [-34.6030, -58.3805], [-34.6049, -58.3803], [-34.6056, -58.3786], [-34.6061, -58.3778]],
};
for (const [t, P] of Object.entries(TANDAS)) if (P.length) await pedir(`[out:json][timeout:120];(${P.map(([la, lo]) => `wr(around:130,${la},${lo})[building];`).join('')});out geom;`, `fuentes/osm/edificios-${t}.json`);
const els = ['', '-2', '-3', ...Object.keys(TANDAS).map((t) => `-${t}`)].flatMap((n) => (existsSync(`fuentes/osm/edificios${n}.json`) ? JSON.parse(readFileSync(`fuentes/osm/edificios${n}.json`, 'utf8')).elements : [])), M = PLANO.metro;
const anillos = (e) => (e.type === 'way' ? [e.geometry] : (e.members ?? []).filter((m) => m.role !== 'inner' && m.geometry).map((m) => m.geometry)).filter(Boolean).map((g) => g.map((p) => aPlano(p.lat, p.lon)));
const area = (P) => { let a = 0; for (let i = 0; i < P.length; i++) { const [x0, y0] = P[i], [x1, y1] = P[(i + 1) % P.length]; a += x0 * y1 - x1 * y0; } return Math.abs(a) / 2; };
const out = {};
// la esquina de dos calles de hoy más cercana a un punto (las calles, de tools/osm.mjs)
const calles = ['calles', 'avenidas'].flatMap((f) => JSON.parse(readFileSync(`fuentes/osm/${f}.json`, 'utf8')).elements);
const tramos = (n) => calles.filter((e) => e.tags?.name === n && e.geometry).map((e) => e.geometry.map((g) => aPlano(g.lat, g.lon)));
const esquina = (a, b, [cx, cy]) => {
  let mejor = null;
  for (const A of tramos(a)) for (const B of tramos(b)) for (let i = 0; i < A.length - 1; i++) for (let j = 0; j < B.length - 1; j++) {
    const [x1, y1] = A[i], [x2, y2] = A[i + 1], [x3, y3] = B[j], [x4, y4] = B[j + 1], d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3); if (Math.abs(d) < 1e-9) continue;
    const t = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d, u = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d, m = 12 / Math.hypot(x2 - x1, y2 - y1), n = 12 / Math.hypot(x4 - x3, y4 - y3);
    if (t < -m || t > 1 + m || u < -n || u > 1 + n) continue;
    const p = [x1 + t * (x2 - x1), y1 + t * (y2 - y1)], r = Math.hypot(p[0] - cx, p[1] - cy); if (!mejor || r < mejor.r) mejor = { p, r };
  }
  if (!mejor) throw new Error(`no se cruzan ${a} y ${b}`); return mejor.p;
};
const manzana = ({ calles: c, cerca, vereda }) => {
  const o = aPlano(...cerca), P = c.map((n, i) => esquina(n, c[(i + 1) % c.length], o)), mx = P.reduce((t, p) => t + p[0], 0) / 4, my = P.reduce((t, p) => t + p[1], 0) / 4;
  return P.map(([x, y]) => { const d = Math.hypot(x - mx, y - my), k = (vereda * Math.SQRT2) / M / d; return [x + (mx - x) * k, y + (my - y) * k]; });
};
const caja = (R) => {
  // el rectángulo más chico que encierra esos contornos, probando el rumbo de cada lado
  const pts = R.flat(); let mejor = null;
  for (const P of R) for (let i = 0; i < P.length - 1; i++) {
    const dx = P[i + 1][0] - P[i][0], dy = P[i + 1][1] - P[i][1], L = Math.hypot(dx, dy); if (L < 6) continue;
    const ux = dx / L, uy = dy / L; let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
    for (const [x, y] of pts) { const a = x * ux + y * uy, b = -x * uy + y * ux; a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b); }
    const ar = (a1 - a0) * (b1 - b0); if (!mejor || ar < mejor.ar) mejor = { ar, ux, uy, a0, a1, b0, b1 };
  }
  let { ux, uy, a0, a1, b0, b1 } = mejor; let largo = (a1 - a0) * M, ancho = (b1 - b0) * M; const ma = (a0 + a1) / 2, mb = (b0 + b1) / 2;
  const x = ma * ux - mb * uy, y = ma * uy + mb * ux, r1 = (v) => Math.round(v * 10) / 10;
  if (ancho > largo) { [largo, ancho] = [ancho, largo]; [ux, uy] = [-uy, ux]; }
  // (el rumbo, siempre hacia el norte del plano: +x)
  if (ux < 0 || (Math.abs(ux) < 1e-6 && uy < 0)) { ux = -ux; uy = -uy; }
  return { x: Math.round(x), y: Math.round(y), ux: Math.round(ux * 1e4) / 1e4, uy: Math.round(uy * 1e4) / 1e4, largo: r1(largo), ancho: r1(ancho) };
};
for (const [clave, nombre, año, que] of LISTA) {
  if (!Array.isArray(que) && !(que instanceof RegExp)) { const P = manzana(que), R = [[...P, P[0]]], c = caja(R); out[clave] = { nombre, año, ...c, planta: [P.map(([px, py]) => [Math.round(px), Math.round(py)])] }; console.log('✓', nombre.padEnd(30), `[${c.x}, ${c.y}]`, `${c.largo} × ${c.ancho} m`, `rumbo ${(Math.atan2(c.uy, c.ux) * 180 / Math.PI).toFixed(0)}° (la manzana)`); continue; }
  const visto = new Set(), cand = els.filter((e) => { const id = e.type + '/' + e.id; if (visto.has(id) || !(Array.isArray(que) ? que.includes(id) : que.test(e.tags?.name ?? ''))) return false; if (!anillos(e).length) return false; visto.add(id); return true; });
  if (!cand.length) { console.log('×', nombre); continue; }
  const R = cand.flatMap(anillos), c = caja(R);
  out[clave] = { nombre, año, ...c, partes: cand.length > 1 ? cand.map((e) => caja(anillos(e))) : undefined, planta: R.sort((a, b) => area(b) - area(a)).slice(0, 3).map((P) => P.map(([px, py]) => [Math.round(px), Math.round(py)])) };
  console.log('✓', nombre.padEnd(30), `[${c.x}, ${c.y}]`, `${c.largo} × ${c.ancho} m`, `rumbo ${(Math.atan2(c.uy, c.ux) * 180 / Math.PI).toFixed(0)}°`, `relleno ${(R.reduce((t, P) => t + area(P), 0) * M * M / (c.largo * c.ancho) * 100).toFixed(0)} %`, cand.length > 1 ? '· partes: ' + out[clave].partes.map((p) => `[${p.x}, ${p.y}] ${p.largo}×${p.ancho}`).join(' · ') : '');
}
writeFileSync('src/edificios.js', `// Dónde están y cuánto miden los edificios con nombre posteriores a 1867 (lo arma tools/edificios.mjs: no tocar a mano).\n// x, y: el centro, en píxeles del plano de 1867 · ux, uy: el rumbo del lado largo · largo, ancho: metros · partes: lo\n// mismo de cada cuerpo, si son varios · planta: los contornos, en píxeles del plano. Las plantas son de OpenStreetMap (© sus colaboradores, ODbL).\nexport const EDIFICIOS = ${JSON.stringify(out).replace(/"(\w+)":/g, '$1:').replace(/},(\w+):\{nombre/g, '},\n  $1: { nombre').replace(/^\{/, '{\n  ').replace(/\}$/, ',\n}')};\n`);
