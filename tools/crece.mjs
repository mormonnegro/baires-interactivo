// La ciudad que cambia: lo que no está en el plano de 1867 y sí en los que siguen (1888, 1895, 1905, 1910, 1921 y
// 1940), para la línea de tiempo del visor (src/epocas.js). No se dibuja ningún plano nuevo: se levantan y se tiran
// casas, con la misma receta y el mismo formato que las de 1867 (tools/2-ciudad.mjs), y cada una trae anotado desde
// qué etapa existe y, si se va, en cuál.
//   - las manzanas nuevas salen de las calles de hoy (fuentes/osm, ya en el marco de 1867): lo que queda entre calle y calle;
//   - qué estaba edificado en cada año lo dicen los planos de época ya calzados (tools/epocas.mjs los deja en
//     fuentes/planos/epoca-<año>.webp): el relleno rosado, o el rayado cruzado en el de 1895;
//   - las casas van sobre el frente de cada manzana, repartidas en lotes de 10 varas y sus múltiplos, sin pisar nada
//     de lo que el plano de 1867 ya trae edificado;
//   - las obras (OBRAS, más abajo): las avenidas que se abrieron tirando manzanas —la de Mayo, las diagonales, la 9 de
//     Julio, el ensanche de Corrientes— y la plaza del Congreso. Lo que queda en la traza se va en su etapa, a los
//     vecinos les queda la medianera a la vista y sobre la línea nueva se levantan los edificios de la avenida;
//   - los pisos de cada casa y lo que se renueva (una casa que se reemplaza por un edificio más alto en el mismo
//     lote) salen de los censos, zona por zona y etapa por etapa: tools/alturas.mjs;
//   - el suelo: dos láminas con «desde cuándo». public/plano/crece.webp: R lo urbanizado y la tierra ganada al río,
//     G los fondos de las manzanas nuevas, B lo edificado. public/plano/despeje.webp: R lo que se despejó (calle o
//     plaza donde había manzana), G el verde de las plazas y los parques nuevos. El valor baja con las etapas (1 para
//     la primera, 1/N para la última, 0 para lo que nunca): un umbral que baja con los años va destapando cada cosa.
//   node tools/crece.mjs [--ver]   →   public/datos/crece.pak, public/datos/crece.json, public/plano/crece.webp,
//                                      despeje.webp y sus -2k; con --ver, tmp/crece-ver.jpg (cada casa pintada según
//                                      su etapa), tmp/crece-obras.jpg y tmp/crece-costa.jpg.
import sharp from 'sharp';
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { PLANO, MALDONADO, ARROYOS } from './plano.mjs';
import { aPlano } from './geo.mjs';
import { EDIFICIOS } from '../src/edificios.js';
import { LINEAS } from '../src/vias.js';
import { ZONA_PLAYAS, AVENIDAS, TIERRA_NORTE, RIO_NORTE, PARQUES_NORTE } from '../src/playas-retiro.js';
import { PARQUES_PALERMO, LAGOS_PALERMO, AVENIDAS_PALERMO, BALDIOS_PALERMO } from '../src/palermo.js';
import { SITIOS } from '../src/barrios.js';
import { ZONA_COLON, CALZADAS_COLON, EXPLANADAS_COLON } from '../src/plaza-colon.js';
import { zonaDe, zonaDeManzana, tiron, pisosDe, claseDe, repartir, cuadro, E_SANTA_FE } from './alturas.mjs';

const ver = process.argv.includes('--ver');
const t0 = Date.now(), lap = (s) => console.log(`${((Date.now() - t0) / 1000).toFixed(1)}s  ${s}`);
const rng = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const AÑOS = JSON.parse(readFileSync('fuentes/planos/indice.json', 'utf8')); // [{ año, plano, titulo, autor, … }], de tools/epocas.mjs
const N = AÑOS.length; // las etapas que siguen a 1867: la etapa e (1…N) es la del plano AÑOS[e - 1]
const etapaDe = (año) => { const e = AÑOS.findIndex((a) => a.año === año) + 1; if (!e) throw new Error(`falta el plano de ${año} (tools/epocas.mjs)`); return e; };
const E95 = etapaDe(1895), E05 = etapaDe(1905), E10 = etapaDe(1910), E21 = etapaDe(1921), E40 = etapaDe(1940);
// (para el pie de la línea de tiempo: de dónde sale lo nuevo y qué obras trae cada etapa)
const CORTO = {
  1888: 'plano de Latzina (1888)', 1895: 'plano topográfico de la Municipalidad (1895)', 1905: 'plano de Pablo Ludwig (1905)',
  1910: 'plano de Pablo Ludwig para la Exposición de 1910', 1921: 'plano de Cannizzaro, de la Oficina Cartográfica Ludwig (1921)', 1940: 'plano Peuser de 1936 y las obras hechas hasta 1940',
};
const OBRAS_DE = {
  1895: 'Se abrió la Avenida de Mayo y el puerto le ganó tierra al río.', 1910: 'La plaza del Congreso, para el Centenario.',
  1921: 'Arrancan las dos diagonales, se ensancha la primera cuadra de Santa Fe y se rellena el Puerto Nuevo.', 1940: 'La 9 de Julio y el Obelisco, la Diagonal Norte hasta Lavalle, Corrientes y Santa Fe ensanchadas, el Puerto Nuevo y la Costanera.',
};
const lee = (f) => JSON.parse(readFileSync(`fuentes/osm/${f}.json`, 'utf8')).elements;

// ------------------------------------------------------------------------------------------- lo que ya hay en 1867
const EDIF = 1, MACIZO = 3;
const { data: cls, info } = await sharp('tmp/clases.png').extractChannel(0).raw().toBuffer({ resolveWithObject: true });
const w = info.width, h = info.height, MPP = PLANO.metro * 2; // (la misma grilla que tools/2-ciudad.mjs: 1,35 m)
const mz67 = new Float32Array(readFileSync('public/datos/manzanas.bin').buffer.slice(0)), te67 = new Uint16Array(readFileSync('public/datos/techos.bin').buffer.slice(0)), mu67 = new Uint16Array(readFileSync('public/datos/muros.bin').buffer.slice(0));
const centro = [PLANO.plaza[0] / 2, PLANO.plaza[1] / 2];
// El centro de los edificios altos del siglo XX no es la plaza: es la «city», al norte y al oeste (Florida, Corrientes,
// la Diagonal Norte, hasta el Obelisco). `city(x, y)` va de 1 (adentro: unas ocho cuadras alrededor de Corrientes y
// Esmeralda, con la Plaza de Mayo y Tribunales en el borde) a 0 lejos; hacia el sur (San Telmo) cae más rápido.
const CITY = [11100 / 2, 8900 / 2];
const city = (x, y) => { const d = Math.hypot(x - CITY[0], y - CITY[1]) * MPP, k = d < 750 ? 1 : Math.exp(-(d - 750) / 620); return (x - centro[0]) * MPP < -330 ? k * 0.55 : k; };
// ocupado: lo edificado que dibuja el plano y lo que el visor ya levanta (sus techos), más un píxel de aire
let ocup = new Uint8Array(w * h);
for (let k = 0; k < w * h; k++) if (cls[k] === EDIF || cls[k] === MACIZO) ocup[k] = 1;
for (let i = 0; i < te67.length; i += 8) {
  const b = te67[i] * 10, P = (u, v) => { const s = u / mz67[b + 8], t = v / mz67[b + 9]; return [((1 - s) * (1 - t) * mz67[b] + s * (1 - t) * mz67[b + 2] + s * t * mz67[b + 4] + (1 - s) * t * mz67[b + 6]) / 2, ((1 - s) * (1 - t) * mz67[b + 1] + s * (1 - t) * mz67[b + 3] + s * t * mz67[b + 5] + (1 - s) * t * mz67[b + 7]) / 2]; };
  const A = P(te67[i + 1], te67[i + 2]), B = P(te67[i + 3], te67[i + 2]), D = P(te67[i + 1], te67[i + 4]), nu = Math.max(1, Math.ceil(Math.hypot(B[0] - A[0], B[1] - A[1]) * 1.5)), nv = Math.max(1, Math.ceil(Math.hypot(D[0] - A[0], D[1] - A[1]) * 1.5));
  for (let b2 = 0; b2 <= nv; b2++) for (let a = 0; a <= nu; a++) { const x = Math.floor(A[0] + ((B[0] - A[0]) * a) / nu + ((D[0] - A[0]) * b2) / nv), y = Math.floor(A[1] + ((B[1] - A[1]) * a) / nu + ((D[1] - A[1]) * b2) / nv); if (x >= 0 && y >= 0 && x < w && y < h) ocup[y * w + x] = 1; }
}
const dilate = (m) => { const o = new Uint8Array(w * h); for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const k = y * w + x; o[k] = m[k] | m[k - 1] | m[k + 1] | m[k - w] | m[k + w] | m[k - w - 1] | m[k - w + 1] | m[k + w - 1] | m[k + w + 1]; } return o; };
ocup = dilate(ocup);
// las calles de 1867: una franja de 14 m alrededor de cada manzana del plano. Las calles de hoy no caen justo encima
// (se ensancharon, y el calce tiene sus metros de error): sin esto aparecerían casas finitas delante de las fachadas.
const calle67 = new Uint8Array(w * h), dentro = new Uint8Array(w * h); // (dentro: el interior de las manzanas de 1867)
/** pinta un polígono en una grilla (v: el valor; menor: si ya hay algo, queda el menor de los dos) */
const llenar = (m, Q, v = 1, menor = false) => { const x0 = Math.max(0, Math.floor(Math.min(...Q.map((p) => p[0])))), x1 = Math.min(w - 1, Math.ceil(Math.max(...Q.map((p) => p[0])))), y0 = Math.max(0, Math.floor(Math.min(...Q.map((p) => p[1])))), y1 = Math.min(h - 1, Math.ceil(Math.max(...Q.map((p) => p[1])))); for (let y = y0; y <= y1; y++) { const xs = []; for (let i = 0, j = Q.length - 1; i < Q.length; j = i++) { const [xi, yi] = Q[i], [xj, yj] = Q[j]; if ((yi > y + 0.5) !== (yj > y + 0.5)) xs.push(((xj - xi) * (y + 0.5 - yi)) / (yj - yi) + xi); } xs.sort((a, b) => a - b); for (let t = 0; t + 1 < xs.length; t += 2) for (let x = Math.max(x0, Math.ceil(xs[t] - 0.5)); x <= Math.min(x1, Math.floor(xs[t + 1] - 0.5)); x++) { const k = y * w + x; m[k] = menor && m[k] ? Math.min(m[k], v) : v; } } };
{
  for (let b = 0; b * 10 < mz67.length; b++) {
    const o = b * 10; if (mz67[o + 8] < 45 || mz67[o + 9] < 45) continue; // (las construcciones sueltas no tienen calle)
    const Q = [0, 1, 2, 3].map((i) => [mz67[o + i * 2] / 2, mz67[o + i * 2 + 1] / 2]), cx = (Q[0][0] + Q[1][0] + Q[2][0] + Q[3][0]) / 4, cy = (Q[0][1] + Q[1][1] + Q[2][1] + Q[3][1]) / 4;
    llenar(calle67, Q.map(([x, y]) => { const d = Math.hypot(x - cx, y - cy) || 1, k = (14 / MPP) * Math.SQRT2 / d; return [x + (x - cx) * k, y + (y - cy) * k]; }));
    llenar(dentro, Q);
  }
  for (let k = 0; k < w * h; k++) if (dentro[k]) calle67[k] = 0;
}
// el suelo de 1867 (R río, G patio, B edificado), a la grilla
const suelo67 = await sharp('public/plano/suelo.webp').resize(w, h, { fit: 'fill', kernel: 'nearest' }).raw().toBuffer();
const agua = new Uint8Array(w * h), patio67 = new Uint8Array(w * h); for (let k = 0; k < w * h; k++) { agua[k] = suelo67[k * 3] > 127 ? 1 : 0; patio67[k] = suelo67[k * 3 + 1] > 127 ? 1 : 0; }
lap('lo de 1867');

// ------------------------------------------------------------------------------------- las calles y las vías de hoy
const sello = (m, x, y, r) => { const r2 = r * r, x0 = Math.max(0, Math.floor(x - r)), x1 = Math.min(w - 1, Math.ceil(x + r)), y0 = Math.max(0, Math.floor(y - r)), y1 = Math.min(h - 1, Math.ceil(y + r)); for (let b = y0; b <= y1; b++) for (let a = x0; a <= x1; a++) if ((a + 0.5 - x) ** 2 + (b + 0.5 - y) ** 2 <= r2) m[b * w + a] = 1; };
const linea = (m, e, r) => {
  const p = e.geometry.map((g) => aPlano(g.lat, g.lon).map((v) => v / 2));
  for (let i = 0; i + 1 < p.length; i++) { const [ax, ay] = p[i], [bx, by] = p[i + 1]; if (Math.max(ax, bx) < -50 || Math.max(ay, by) < -50 || Math.min(ax, bx) > w + 50 || Math.min(ay, by) > h + 50) continue; const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / Math.max(1, r * 0.4))); for (let k = 0; k <= n; k++) sello(m, ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n, r); }
};
// medio ancho de cada clase de calle, en metros, de línea de edificación a línea de edificación (las autopistas pasan
// por arriba y no cortan manzanas)
const MEDIO = { residential: 6.5, unclassified: 6.5, living_street: 5, pedestrian: 5.5, tertiary: 7.5, secondary: 9, primary: 11, trunk: 11 };
const calle = new Uint8Array(w * h), via = new Uint8Array(w * h);
// (el puerto: las calles de hoy de Puerto Madero —el barrio del lado del río es de los años 90— no van. Quedan las que
// ya eran calle del puerto: la de los depósitos, los cruces por los puentes entre dique y dique y la Costanera Sur,
// que es de 1918 y por eso recién se pinta desde 1921)
const EN_PUERTO = /^(Avenida Alicia Moreau de Justo|Azucena Villaflor|Macacha Güemes|Cecilia Grierson|Rosario Vera Peñaloza|Boulevard Rosario Vera Peñaloza|Avenida España|Avenida Elvira Rawson de Dellepiane)$/;
const COSTANERA = /^(Avenida de los Italianos|Avenida Intendente Hernán M\. Giralt|Avenida Costanera Doctor Tristán Achával Rodríguez|Avenida Calabria)$/;
// (el Puerto Nuevo: el frente de sus muelles y la zona, en píxeles del plano; más abajo, donde se gana la tierra, se explica)
const PN_1921 = 15973, PN_HECHO_1921 = 14850; // (en 1921 hay tierra hasta ese x del plano, el borde de la futura dársena E; y muelles terminados hasta el tercer espigón)
const LAGUNA_PN = [[15600, 8300], [15900, 8250], [15900, 8830], [15600, 8830]]; // (agua sin rellenar detrás de las cabeceras, en la aérea de antes de 1930 y en la carta de 1935)
const FRENTE_PN = [[13252, 10367], [13327, 10742], [13452, 11486], [13490, 11524], [13640, 11520], [13847, 11524], [14146, 11517], [14348, 11323], [14648, 11318], [14849, 10844], [14923, 10843], [15199, 10508], [15417, 10152], [15489, 10153], [15984, 9550], [16200, 9195], [16277, 9193], [16593, 8833]];
const ADENTRO_PN = [[13700, 10330], [14300, 9900], [14800, 9400], [15400, 8600], [15900, 7800]]; // (tierra adentro: por acá ya es el relleno de Retiro)
const TIERRA_PN = [...FRENTE_PN, [16593, 8300], [16100, 7800], ...ADENTRO_PN.slice().reverse()];
const ZONA_PN = [FRENTE_PN[0], ...ADENTRO_PN, [PLANO.ancho, 7800], [PLANO.ancho, PLANO.alto], [13494, PLANO.alto], FRENTE_PN[2], FRENTE_PN[1]];
// (y el Antepuerto Norte, entre la escollera de la Dársena Norte y el primer espigón: agua)
const ANTEPUERTO = [[12524, 10794], [13115, 10533], [13152, 10451], [13205, 10369], [13252, 10367], [13327, 10742], [13452, 11486], [13490, 11524], [13494, 11958], [12846, 12026], [12358, 12152], [12360, 11771], [12361, 11326], [12338, 10851], [12359, 10838]];
const enPN = (x, y) => { let c = false; for (let i = 0, j = TIERRA_PN.length - 1; i < TIERRA_PN.length; j = i++) { const [xi, yi] = TIERRA_PN[i], [xj, yj] = TIERRA_PN[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const enPuerto = (e) => { let n = 0; for (const g of e.geometry) { const [x, y] = aPlano(g.lat, g.lon); if ((y > 10370 && x > 7400 && x < 13100) || enPN(x, y)) n++; } return n * 2 > e.geometry.length; };
const costanera = new Uint8Array(w * h);
// (las playas de Retiro, el Puerto Nuevo y la Costanera Norte —src/playas-retiro.js—: toda esa tierra es relleno de
// 1921 y 1940, y las calles que hoy tiene encima —la Villa 31, los accesos a la autopista, la Costanera de ahora— no
// son de entonces: en la lámina de las calles no se pintan (zonaP). Para todo lo demás —dónde se levantan casas, qué
// se despeja— las calles de hoy siguen contando igual que antes. Las avenidas que sí estaban se pintan aparte, a
// mano, cada una desde su etapa: avMano)
const zonaP = new Uint8Array(w * h); llenar(zonaP, ZONA_PLAYAS.map(([x, y]) => [x / 2, y / 2]));
// (los parques de Palermo —src/palermo.js—: adentro de sus contornos no se levantan casas en ninguna etapa ni se
// pintan las calles de hoy; las avenidas del parque, los lagos y los senderos los arma src/lugares/palermo.js)
const zonaPal = new Uint8Array(w * h); for (const [, , P] of PARQUES_PALERMO) llenar(zonaPal, P.map(([x, y]) => [x / 2, y / 2]));
const baldioPal = new Uint8Array(w * h); for (const P of BALDIOS_PALERMO) llenar(baldioPal, P.map(([x, y]) => [x / 2, y / 2]));
const avMano = new Uint8Array(w * h);
{ const m = new Uint8Array(w * h);
  for (const et of [E40, E21]) { m.fill(0);
    for (const [, e, medio, pts] of AVENIDAS) { if (e !== et) continue; for (let i = 0; i + 1 < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 4)); for (let j = 0; j <= n; j++) sello(m, (ax + ((bx - ax) * j) / n) / 2, (ay + ((by - ay) * j) / n) / 2, medio / MPP); } }
    for (let k = 0; k < w * h; k++) if (m[k]) avMano[k] = et;
  } }
// (la Plaza Colón y el Parque Colón, detrás de la Casa de Gobierno —src/plaza-colon.js—: ahí las calles de hoy no son
// las de entonces. Adentro de la zona la lámina de las calles no pinta las de hoy ni la franja de las manzanas de
// 1867; van las calzadas calcadas de los planos de época y de la foto aérea de 1940, cada una desde su etapa
// (calzC) y con el asfalto desde la suya (lisaC). Para todo lo demás las calles de hoy siguen contando igual.)
const zonaC = new Uint8Array(w * h); llenar(zonaC, ZONA_COLON.map(([x, y]) => [x / 2, y / 2]));
const calzC = new Uint8Array(w * h), lisaC = new Uint8Array(w * h);
{ const m = new Uint8Array(w * h), pone = (e, l) => { for (let k = 0; k < w * h; k++) if (m[k] && (!calzC[k] || e < calzC[k])) { calzC[k] = e; lisaC[k] = l; } m.fill(0); };
  for (const [, e, l, pts] of CALZADAS_COLON) { for (let i = 0; i + 1 < pts.length; i++) { const [ax, ay, ar] = pts[i], [bx, by, br] = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 3)); for (let j = 0; j <= n; j++) sello(m, (ax + ((bx - ax) * j) / n) / 2, (ay + ((by - ay) * j) / n) / 2, (ar + ((br - ar) * j) / n) / MPP); } pone(e, l); }
  for (const [, e, l, Q] of EXPLANADAS_COLON) { llenar(m, Q.map(([x, y]) => [x / 2, y / 2])); pone(e, l); } }
for (const f of ['calles', 'avenidas']) for (const e of lee(f)) {
  const m = MEDIO[e.tags?.highway]; if (!m || !e.geometry) continue;
  const n = e.tags?.name ?? '';
  if (COSTANERA.test(n)) linea(costanera, e, m / MPP); else if (enPuerto(e) && !EN_PUERTO.test(n)) continue;
  linea(calle, e, m / MPP);
}
for (const e of lee('vias')) if (e.geometry && !e.tags?.tunnel) linea(via, e, 13 / MPP);
// (y las vías de entonces, que no siempre corren por donde las de hoy —src/vias.js—: tampoco ahí se inventan casas)
for (const L of LINEAS) if (!L.enCalle) for (let i = 0; i + 1 < L.pts.length; i++) { const [ax, ay] = L.pts[i], [bx, by] = L.pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 6)); for (let k = 0; k <= n; k++) sello(via, (ax + ((bx - ax) * k) / n) / 2, (ay + ((by - ay) * k) / n) / 2, 10 / MPP); }
lap('calles y vías');

// ------------------------------------------------------------------------------------------------------- las obras
// Las avenidas y plazas que se abrieron tirando manzanas. La traza sale de las calles de hoy (que son esas mismas
// avenidas); las fechas, de la historia de cada obra:
//   Avenida de Mayo: inaugurada en 1894, de Bolívar a Luis Sáenz Peña, 30 m de ancho, por el medio de las manzanas;
//     los planos de 1895 y 1905 la dibujan abierta hasta Entre Ríos–Callao.
//   Plaza del Congreso: terminada en enero de 1910 (las manzanas entre Rivadavia e Yrigoyen, de Sáenz Peña a Entre Ríos).
//   Diagonal Norte: empezada en 1913; hacia 1916 llegaba a Maipú, en 1931 a Suipacha y en 1936 a la 9 de Julio (el
//     último tramo, hasta la plaza Lavalle, se dio por terminado en 1943, pero en la foto aérea de 1940 ya está
//     abierto: entra en 1940). Diagonal Sur: hacia 1916 llegaba a Chacabuco;
//     quedó trunca en Belgrano y Piedras (acá, toda en 1940: su última cuadra se edificó después).
//   Corrientes: ensanchada entre 1931 y 1936, de Alem a Callao, tirando la vereda norte.
//   9 de Julio: el primer tramo, de Bartolomé Mitre a Tucumán, se inauguró el 12 de octubre de 1937 (las manzanas
//     enteras entre Cerrito y Carlos Pellegrini); el Obelisco es de 1936.
const nombradas = new Map();
for (const f of ['calles', 'avenidas']) for (const e of lee(f)) { const n = e.tags?.name; if (!n || !e.geometry) continue; if (!nombradas.has(n)) nombradas.set(n, []); nombradas.get(n).push(e.geometry.map((g) => aPlano(g.lat, g.lon).map((v) => v / 2))); }
const tramos = (nombres) => [].concat(nombres).flatMap((n) => nombradas.get(n) ?? []);
const dAl = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
/** Dónde se cruzan dos calles (si se cruzan más de una vez, el cruce más cercano a `cerca`). */
function cruce(a, b, cerca = centro) {
  let mejor = null, d0 = Infinity;
  const ver = (p) => { const d = dAl(p, cerca); if (d < d0) { d0 = d; mejor = p; } };
  for (const A of tramos(a)) for (const B of tramos(b)) for (let i = 0; i + 1 < A.length; i++) for (let j = 0; j + 1 < B.length; j++) {
    const [x1, y1] = A[i], [x2, y2] = A[i + 1], [x3, y3] = B[j], [x4, y4] = B[j + 1], den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(den) < 1e-9) continue;
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den, u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den, la = dAl(A[i], A[i + 1]), lb = dAl(B[j], B[j + 1]);
    if (t >= -4 / la && t <= 1 + 4 / la && u >= -4 / lb && u <= 1 + 4 / lb) ver([x1 + t * (x2 - x1), y1 + t * (y2 - y1)]); // (con 4 celdas de gracia: las esquinas no siempre comparten punto)
  }
  if (!mejor) throw new Error(`no se cruzan: ${a} y ${b}`);
  return mejor;
}
/** El punto de una calle más cercano (o más lejano) a otro. */
const extremo = (nombre, de, lejos = false) => { let m = null, d0 = lejos ? -1 : Infinity; for (const A of tramos(nombre)) for (const p of A) { const d = dAl(p, de); if (lejos ? d > d0 : d < d0) { d0 = d; m = p; } } return m; };
const M = (metros) => metros / MPP; // (de metros a celdas de la grilla)

const banda = new Uint8Array(w * h), verde = new Uint8Array(w * h); // desde qué etapa es calle o plaza · si es verde
const calzada = new Uint8Array(w * h), VEREDA = 5; // la calzada empedrada de las avenidas nuevas (etapa) · el ancho de cada vereda, en metros
const solar = new Uint8Array(w * h); // el lugar de los edificios con nombre que vienen después (etapa)
// Las obras «tardías» (la opción `tarde` de avenida() y plaza(), y los edificios de TARDE): no cambian nada de las
// etapas anteriores a la suya. Lo que la regla general deja sin edificar para siempre junto a una obra —las casas
// inventadas a menos de 7 m de la traza, el edificio que reemplaza a una casa de 1867 que está en el solar— acá se
// levanta como si la obra no existiera y se va recién en la etapa de la obra. Su traza se anota aparte y entra en
// `banda` al final, cuando ya están todas las demás: así `tardia` queda con las celdas que son solo de ellas.
// Con su calzada, lo mismo (`empedrar`): donde ya había una calle, el pavimento de las etapas anteriores no cambia.
const tardia = new Uint8Array(w * h), calzadaT = new Uint8Array(w * h), TARDIAS = [];
const despejar = (Q, e, tarde) => (tarde ? TARDIAS.push({ Q, e }) : llenar(banda, Q, e, true));
const empedrar = (Q, e, tarde) => (tarde ? TARDIAS.push({ Q, e, cz: true }) : llenar(calzada, Q, e, true));
const OBRAS = [], FRENTES_DE = []; // lo que se abre · las líneas nuevas sobre las que se edifica
/** (con `libre`, sobre la línea nueva se edifica también donde el plano de 1867 traía quinta, baldío o calle ancha)
 * Una avenida de A a B: se despeja `izq` metros a la izquierda del eje y `der` a la derecha (mirando de A a B), y
 *  sobre cada línea nueva (frentes: 'izq', 'der') se levantan edificios de `pisos` pisos y hasta `fondo` metros. */
function avenida(nombre, A, B, { e, izq, der = izq, frentes = ['izq', 'der'], fondo = 16, pisos, alto = 0, tarde = false, libre = false }) {
  const L = dAl(A, B), ux = (B[0] - A[0]) / L, uy = (B[1] - A[1]) / L, nx = uy, ny = -ux; // (n: a la izquierda, con la y hacia abajo)
  const pt = (t, d) => [A[0] + ux * t + nx * d, A[1] + uy * t + ny * d];
  despejar([pt(0, M(izq)), pt(L, M(izq)), pt(L, -M(der)), pt(0, -M(der))], e, tarde);
  empedrar([pt(0, M(izq - VEREDA)), pt(L, M(izq - VEREDA)), pt(L, -M(der - VEREDA)), pt(0, -M(der - VEREDA))], e, tarde); // (el empedrado: la traza menos las veredas)
  OBRAS.push({ nombre, e, P: [pt(0, M(izq)), pt(L, M(izq)), pt(L, -M(der)), pt(0, -M(der))] });
  for (const f of frentes) { const s = f === 'izq' ? 1 : -1, d0 = s * M(f === 'izq' ? izq : der), d1 = d0 + s * M(fondo + 3); FRENTES_DE.push({ nombre, e, Q: [pt(0, d0), pt(L, d0), pt(L, d1), pt(0, d1)], fondo, pisos, alto, tarde, libre }); }
}
/** Una plaza (o una avenida de manzanas enteras): todo lo de adentro se va. */
function plaza(nombre, P, { e, pasto = true, borde = 0, calles = false, tarde = false }) {
  const cx = P.reduce((t, p) => t + p[0], 0) / P.length, cy = P.reduce((t, p) => t + p[1], 0) / P.length;
  const Q = P.map(([x, y]) => { const d = Math.hypot(x - cx, y - cy) || 1, k = M(borde) / d; return [x + (cx - x) * k, y + (cy - y) * k]; }); // (unos metros adentro: la vereda de enfrente no se toca)
  despejar(Q, e, tarde); OBRAS.push({ nombre, e, P: Q });
  if (calles) empedrar(Q, e, tarde); // (una avenida de manzanas enteras: todo lo que no sea cantero es calzada)
  if (pasto) llenar(verde, P.map(([x, y]) => { const d = Math.hypot(x - cx, y - cy) || 1, k = M(borde + 9) / d; return [x + (cx - x) * k, y + (cy - y) * k]; }));
}
{
  const MAYO = 'Avenida de Mayo', DN = 'Avenida Presidente Roque Sáenz Peña', DS = 'Avenida Presidente Julio A. Roca', CTES = 'Avenida Corrientes';
  const RIV = ['Avenida Rivadavia', 'Rivadavia'], YRI = ['Hipólito Yrigoyen', 'Avenida Hipólito Yrigoyen'];
  // la Avenida de Mayo
  // (El eje es una recta. La traza de hoy dobla al llegar a Bolívar, para entrar a la plaza, y en la otra punta para
  // empalmar con Rivadavia: se toma la recta de Perú a San José y se la alarga hasta las dos puntas. Con los cruces
  // de las puntas, la avenida quedaba torcida: 5 m al norte en Perú, encima de los frentes de hoy.)
  { const p = cruce(MAYO, 'Perú'), q = cruce(MAYO, 'San José'), en = ([, y]) => [p[0] + ((y - p[1]) * (q[0] - p[0])) / (q[1] - p[1]), y];
    const A = en(cruce(MAYO, 'Bolívar')), B = en(cruce(MAYO, 'Presidente Luis Sáenz Peña'));
    console.log(`  Avenida de Mayo: de [${A.map((v) => Math.round(v * 2))}] a [${B.map((v) => Math.round(v * 2))}] del plano`);
    avenida(MAYO, A, B, { e: E95, izq: 15, fondo: 17, pisos: [4, 6] });
    // (Los planos de 1895 y de 1905 la traen abierta hasta Entre Ríos–Callao: cruza la plaza Lorea y parte en dos las
    // tres manzanas que siguen. Ese tramo dura hasta 1910, cuando todo eso se vuelve la plaza del Congreso. Sobre la
    // plaza Lorea no se edifica; en las mitades de manzana, casas más bajas que las del resto de la avenida: supuesto.)
    const C = en(cruce(RIV, 'Virrey Cevallos', B)), D = en(cruce(RIV, ['Avenida Callao', 'Avenida Entre Ríos'], B));
    console.log(`  Avenida de Mayo, el tramo hasta Callao: de [${B.map((v) => Math.round(v * 2))}] a [${D.map((v) => Math.round(v * 2))}] del plano`);
    avenida(MAYO, B, C, { e: E95, izq: 15, frentes: [] });
    avenida(MAYO, C, D, { e: E95, izq: 15, fondo: 12, pisos: [2, 4] }); }
  // la plaza del Congreso
  { const O = cruce(RIV, ['Avenida Callao', 'Avenida Entre Ríos'], cruce(MAYO, 'Presidente Luis Sáenz Peña')), E = 'Presidente Luis Sáenz Peña', W = ['Avenida Callao', 'Avenida Entre Ríos'];
    // (sin césped pintado: los canteros, los senderos y el monumento los pone src/lugares/plaza-congreso.js)
    plaza('Plaza del Congreso', [cruce(RIV, W, O), cruce(RIV, E, O), cruce(YRI, E, O), cruce(YRI, W, O)], { e: E10, borde: 1.5, pasto: false });
    // (y la vieja plaza Lorea, que quedó adentro: los árboles que le dibuja el plano de 1867 caen en las calzadas nuevas.
    // En píxeles de la grilla: va de [10255, 7440] a [10425, 7560] del plano.)
    plaza('Plaza Lorea', [[5127.5, 3720], [5212.5, 3720], [5212.5, 3780], [5127.5, 3780]], { e: E10, pasto: false }); }
  // la Plaza de Mayo: en 1884 se tiró la Recova y las dos plazas quedaron en una, con otro trazado. Desde 1888 se va el
  // dibujo de 1867 (y sus árboles): lo de cada época lo pone src/lugares/plaza-de-mayo.js
  // (En píxeles de la grilla: el rectángulo va de [10268, 9402] a [10420, 9736] del plano, de cordón a cordón.)
  plaza('Plaza de Mayo', [[5134, 4701], [5210, 4701], [5210, 4868], [5134, 4868]], { e: etapaDe(1888), pasto: false });
  // Las plazas que ya estaban en 1867 y cambiaron de trazado (src/lugares/plaza-lavalle.js, plaza-once.js,
  // plaza-san-martin.js y plaza-constitucion.js): desde su etapa se va el dibujo de 1867 —los árboles, las letras, la
  // vía, lo que hubiera edificado adentro— y ahí no se inventan casas. El suelo, los canteros y las calzadas los pone
  // cada lugar. (Acá, en píxeles del plano: `px` los pasa a la grilla.)
  // Los estadios, los hospitales, la cárcel y los edificios sueltos de los barrios (src/barrios.js y
  // src/lugares/barrios.js): cada solar se despeja desde su etapa. Los que llegan tarde a una manzana ya edificada van
  // como obra tardía; los parques, de verde.
  for (const S of Object.values(SITIOS)) plaza(S.nombre, S.P.map(([x, y]) => [x / 2, y / 2]), { e: S.e, pasto: !!S.pasto, borde: S.m, tarde: S.e >= 2 && !S.pasto });
  { const px = (P) => P.map(([x, y]) => [x / 2, y / 2]), E88 = etapaDe(1888);
    // la Plaza Lavalle: las dos manzanas viejas, de eje a eje de calle (Lavalle, Talcahuano, Viamonte, Libertad); la
    // planta del Palacio Miró (de 1868: lo que el plano dibuja ahí en 1867 queda en 1867) y el frente del Parque de
    // Artillería sobre Talcahuano; y en 1940, la manzana del palacio, sumada a la plaza en 1937
    plaza('Plaza Lavalle', px([[11411, 7902], [11759, 7909], [11756, 8091], [11407, 8085]]), { e: E88, pasto: false });
    plaza('Palacio Miró', px([[11789, 8022], [11869, 8023], [11867, 8093], [11787, 8092]]), { e: E88, pasto: false });
    plaza('Parque de Artillería, el frente', px([[11416, 7874], [11582, 7877], [11582, 7898], [11416, 7895]]), { e: E88, pasto: false });
    plaza('Plaza Lavalle, la manzana del Miró', px([[11760, 7907], [11962, 7911], [11959, 8095], [11756, 8091]]), { e: E40, pasto: false });
    // (la punta de Corrientes, Cerrito y la Diagonal Norte: en la foto aérea de 1940 es una playa de estacionamiento con
    // un galpón bajo contra el Teatro Broadway, src/lugares/obelisco-1940.js)
    plaza('Playa de estacionamiento de Corrientes y Cerrito', px([[11221, 8185], [11221, 8283], [11235, 8283], [11289, 8209], [11272, 8209], [11272, 8185]]), { e: E40, pasto: false, tarde: true });
    // la Plaza 11 de Septiembre (el Once): el descampado entero del mercado de carretas, de frente a frente
    plaza('Plaza 11 de Septiembre', px([[10404, 4647], [10631, 4643], [10638, 5048], [10411, 5052]]), { e: E88, pasto: false });
    // (Constitución: todo el hueco del mercado, de línea de edificación a línea de edificación; lo de cada época, src/lugares/plaza-constitucion.js)
    plaza('Plaza Constitución', px([[7240, 7998], [7788, 7998], [7788, 8238], [7708, 8252], [7640, 8270], [7475, 8312], [7240, 8376]]), { e: E88, pasto: false });
    // (San Martín: la lonja del plano de 1867 desde 1888 —adentro no hay calles—; en 1940, la punta alargada hasta Esmeralda
    // y la barranca, donde estuvieron los Cuarteles y el Pabellón Argentino. Lo de cada época, src/lugares/plaza-san-martin.js)
    plaza('Plaza San Martín', px([[12355, 9165], [12380, 9140], [12432, 9091], [12474, 9054], [12528, 9006], [12550, 8984], [12565, 8970], [12585, 8959], [12600, 8955], [12620, 8956], [12639, 8965], [12655, 8980], [12662, 9000], [12661, 9020], [12652, 9040], [12635, 9060], [12574, 9137], [12558, 9163], [12503, 9233], [12480, 9260], [12470, 9272], [12450, 9283], [12425, 9283], [12405, 9281], [12380, 9267], [12366, 9255], [12355, 9230], [12351, 9210], [12350, 9185]]), { e: E88, pasto: false });
    plaza('Plaza San Martín, la punta de Esmeralda', px([[12550, 8984], [12554, 8971], [12554, 8907], [12690, 8918], [12675, 9022], [12652, 9040]]), { e: E40, pasto: false });
    plaza('Plaza San Martín, la barranca', px([[12450, 9283], [12470, 9272], [12480, 9260], [12503, 9233], [12558, 9163], [12574, 9137], [12594, 9141], [12628, 9170], [12704, 9240], [12754, 9287], [12760, 9312], [12742, 9354], [12731, 9376], [12710, 9401], [12686, 9403], [12659, 9410], [12617, 9414], [12571, 9409], [12531, 9406], [12463, 9347], [12431, 9315], [12425, 9283]]), { e: E40, pasto: false });
  }
  // las diagonales: el primer tramo en 1921, el resto en 1940
  { const a = extremo(DN, centro), m = cruce(DN, 'Maipú'), b = cruce(DN, 'Carlos Pellegrini');
    avenida(DN, a, m, { e: E21, izq: 16.5, fondo: 16, pisos: [9, 9], alto: 33 }); avenida(DN, m, b, { e: E40, izq: 16.5, fondo: 16, pisos: [9, 9], alto: 33 });
    // (La última cuadra, de Cerrito a Lavalle y Libertad —la esquina de la Plaza Lavalle—: en la foto aérea de 1940 ya
    // está abierta de línea a línea, y el plano Peuser de 1936 la dibuja. Del lado nordeste hay una fila de edificios
    // altos (los frentes nuevos, genéricos, a los 33 m del reglamento); del sudoeste, los baldíos de la demolición:
    // ahí no se edifica. Es una obra tardía: hasta 1921 la manzana sigue como estaba. El rectángulo va del eje de
    // Cerrito a donde la línea nordeste toca la de Lavalle (a 178,6 y 367,4 píxeles del plano desde Carlos
    // Pellegrini); la boca, hasta la esquina de Libertad, es el cuadrilátero que sigue, en píxeles del plano.)
    { const f = cruce(DN, 'Lavalle'), L = dAl(b, f), en = (t) => [b[0] + ((f[0] - b[0]) * t) / L, b[1] + ((f[1] - b[1]) * t) / L];
      avenida(DN, en(178.6 / 2), en(367.4 / 2), { e: E40, izq: 16.5, frentes: ['der'], fondo: 16, pisos: [9, 9], alto: 33, tarde: true });
      plaza('Diagonal Norte, la boca de Lavalle y Libertad', [[11387, 8158], [11387, 8107], [11364, 8107], [11347.6, 8129.3]].map(([x, y]) => [x / 2, y / 2]), { e: E40, calles: true, pasto: false, tarde: true }); } }
  { const a = extremo(DS, centro), m = cruce(DS, 'Chacabuco'), b = extremo(DS, centro, true);
    avenida(DS, a, m, { e: E21, izq: 15, fondo: 16, pisos: [7, 9] }); avenida(DS, m, b, { e: E40, izq: 15, fondo: 16, pisos: [7, 9] }); }
  // Corrientes: la línea sur queda donde estaba (a 13 m del eje de hoy) y se corre la norte
  { const a = cruce(CTES, 'Avenida Leandro N. Alem'), b = cruce(CTES, 'Avenida Callao');
    const norteIzq = (b[1] - a[1]) > 0; // (el norte es +x: mirando de a hacia b, queda a la izquierda si se avanza hacia +y)
    avenida(CTES, a, b, norteIzq ? { e: E40, izq: 14, der: 9.5, frentes: ['izq'], fondo: 15, pisos: [5, 9] } : { e: E40, izq: 9.5, der: 14, frentes: ['der'], fondo: 15, pisos: [5, 9] }); }
  // Santa Fe, de Esmeralda a Callao: la ordenanza de 1904 corrió la línea del lado norte a 26 m. El tramo de Esmeralda a
  // Libertad se hizo en 1913; el resto, en la década de 1930.
  { const SF = 'Avenida Santa Fe', a = cruce(SF, 'Esmeralda'), m = cruce(SF, 'Libertad'), b = cruce(SF, 'Avenida Callao'), norteIzq = (b[1] - a[1]) > 0;
    const tramo = (p, q, e, pisos) => avenida(SF, p, q, norteIzq ? { e, izq: 14, der: 9.5, frentes: ['izq'], fondo: 15, pisos } : { e, izq: 9.5, der: 14, frentes: ['der'], fondo: 15, pisos });
    tramo(a, m, E21, [4, 7]); tramo(m, b, E40, [5, 9]); }
  // Callao, de Rivadavia a Córdoba (más al norte está la plaza Rodríguez Peña, que es de 1894): el plano de 1867 la trae ancha solo a trechos (y angosta al norte de Lavalle), con
  // casas que se meten en lo que después fue la avenida. Se despeja a su ancho de hoy (26 m), cuadra por cuadra porque
  // dobla apenas, y sobre la línea nueva se edifica. Supuesto: la fecha (acá, para 1888) y las casas del frente nuevo.
  { const CA = 'Avenida Callao', K = [cruce(CA, RIV), ...['Bartolomé Mitre', 'Sarmiento', CTES, 'Lavalle', 'Tucumán', 'Avenida Córdoba'].map((c) => cruce(CA, c))];
    for (let i = 0; i + 1 < K.length; i++) avenida(CA, K[i], K[i + 1], { e: etapaDe(1888), izq: 13, fondo: 14, pisos: [1, 3], libre: true }); }
  // la Recova Vieja, demolida en 1884: el edificio es de src/hitos.js (que lo saca en esa etapa); acá se limpia su
  // dibujo del suelo. (En píxeles de la grilla: está en [10336, 9594] del plano y mide unos 122 × 24 m.)
  plaza('Recova Vieja', [[5121, 4786], [5215, 4786], [5215, 4808], [5121, 4808]], { e: etapaDe(1888), pasto: false });
  // la Casa Rosada perdió en 1938 los 17 m del lado sur, para ensanchar Hipólito Yrigoyen (src/lugares/casa-rosada.js):
  // esa franja pasa a ser calle. (En píxeles de la grilla: va de [10262, 9767] a [10277, 9887] del plano.)
  // la Aduana Nueva (el medio círculo de Taylor, src/hitos.js) se demolió para hacer el puerto: en 1895 ya no está, y
  // con ella se van las casas que el visor levanta en su manzana —los depósitos de la orilla, a su lado— y las dos
  // casillas de atrás de la Casa de Gobierno: ahí va la Plaza Colón. (En píxeles de la grilla: la manzana va de
  // [10054, 9894] a [10479, 10065] del plano.)
  plaza('Aduana Nueva y los depósitos de la orilla', [[10050, 9896], [10485, 9896], [10485, 10070], [10050, 10070]].map(([x, y]) => [x / 2, y / 2]), { e: E95, pasto: false });
  // el Retiro (src/lugares/retiro.js). El Pabellón Argentino, de 1894 a 1933, sobre los Cuarteles: el rectángulo de la
  // nave y el anexo de la punta de Maipú, que en 1940 ya es parte de la plaza San Martín. Y la plaza de la Torre de
  // los Ingleses (la Británica), donde estuvo la fábrica de gas hasta 1912.
  { const rect = ([cx, cy], [ux, uy], a0, a1, b) => [[a0, -b], [a1, -b], [a1, b], [a0, b]].map(([i, j]) => [(cx + (ux * i - uy * j) / PLANO.metro) / 2, (cy + (uy * i + ux * j) / PLANO.metro) / 2]);
    plaza('Pabellón Argentino', rect([12571, 9256], [0.578, -0.816], -44, 67, 21), { e: E95, pasto: false }); // (sin césped: la plaza San Martín es toda de tierra, como en el plano)
    // (La Británica: todo el hueco, del frente de la estación Retiro al fondo de los galpones del puerto y de las casas
    // de enfrente de Leandro N. Alem a la calle que baja al puerto, y el costado de la estación, donde quedaba el
    // letrero de la «Batería». El rectángulo va corrido 13 m hacia Alem y frena en la calzada, a 14 m de la hilera de
    // casas nuevas del pie de la barranca: las casas inventadas que quedan a menos de 7 m de una obra no se edifican
    // en ninguna época, y esas tienen que seguir. Sin césped: el suelo, los canteros, las calzadas y los galpones de
    // cada época los pone src/lugares/plaza-britanica.js)
    plaza('Plaza Británica', rect([12946.9, 9559.1], [0.62, -0.7846], -152, 112, 125), { e: E21, pasto: false });
    plaza('Retiro, el costado de la estación', rect([12864.9, 9494.3], [0.62, -0.7846], 112, 235, 31.5), { e: E21, pasto: false });
    // (y el pie del Puente Transbordador, src/lugares/modernos.js: las dos orillas, sin tocar el Riachuelo)
    plaza('Puente Transbordador, la orilla de La Boca', rect([5247, 11329], [-0.642, 0.767], -64, -26, 15), { e: E21, pasto: false });
    plaza('Puente Transbordador, la orilla de la Isla Maciel', rect([5247, 11329], [-0.642, 0.767], 26, 54, 15), { e: E21, pasto: false }); }
  plaza('Casa Rosada, el lado sur', [[5131, 4883.5], [5138.5, 4883.5], [5138.5, 4943.5], [5131, 4943.5]], { e: E40, calles: true, pasto: false });
  // los edificios con nombre que se levantan después (los modela src/hitos.js, con las plantas de src/edificios.js): en
  // su etapa se va lo que había en el lugar, y ahí no se inventan casas
  // (los de la Plaza de la República de 1940, src/lugares/obelisco-1940.js, son obras tardías: hasta 1921 esos solares
  // siguen como estaban)
  const TARDE = new Set(['trust', 'trustVecino', 'diaz', 'diazEsquina', 'cerrito300', 'granRex', 'opera', 'tabaris', 'broadway', 'esquinaCerrito']);
  for (const [clave, ed] of Object.entries(EDIFICIOS)) { const e = AÑOS.findIndex((a) => a.año >= ed.año) + 1; if (!e) continue; for (const P of ed.planta) { despejar(P.map(([x, y]) => [x / 2, y / 2]), e, TARDE.has(clave)); llenar(solar, P.map(([x, y]) => [x / 2, y / 2]), e, true); } OBRAS.push({ nombre: ed.nombre, e, P: ed.planta[0].map(([x, y]) => [x / 2, y / 2]) }); }
  // las vías que se tienden después de 1867 (src/vias.js): en su etapa se va lo que había en la traza, árboles incluidos
  for (const L of LINEAS) { if (!L.desde || L.enCalle || L.yaEstaba) continue; const r = M(L.doble ? 8 : 6); for (let i = 0; i + 1 < L.pts.length; i++) { const [ax, ay] = L.pts[i], [bx, by] = L.pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 4)); for (let k = 0; k <= n; k++) { const x = (ax + ((bx - ax) * k) / n) / 2, y = (ay + ((by - ay) * k) / n) / 2; for (let q = Math.max(0, Math.floor(y - r)); q <= Math.min(h - 1, Math.ceil(y + r)); q++) for (let p = Math.max(0, Math.floor(x - r)); p <= Math.min(w - 1, Math.ceil(x + r)); p++) if ((p + 0.5 - x) ** 2 + (q + 0.5 - y) ** 2 <= r * r) { const o = q * w + p; banda[o] = banda[o] ? Math.min(banda[o], L.desde) : L.desde; } } } }
  // la 9 de Julio: las manzanas enteras entre Cerrito y Carlos Pellegrini, de Bartolomé Mitre a Tucumán
  { const O = cruce(DN, 'Carlos Pellegrini');
    plaza('Avenida 9 de Julio', [cruce('Cerrito', 'Bartolomé Mitre', O), cruce('Carlos Pellegrini', 'Bartolomé Mitre', O), cruce('Carlos Pellegrini', 'Tucumán', O), cruce('Cerrito', 'Tucumán', O)], { e: E40, borde: 4, calles: true, pasto: false }); // (los canteros: src/lugares/nueve-de-julio.js)
    // (el Obelisco, en Corrientes y el medio de la avenida: src/hitos.js lo tiene anotado en píxeles del plano)
    if (ver) {
      const c = [cruce('Cerrito', 'Bartolomé Mitre', O), cruce('Carlos Pellegrini', 'Bartolomé Mitre', O), cruce('Carlos Pellegrini', 'Tucumán', O), cruce('Cerrito', 'Tucumán', O)];
      const a = [(c[0][0] + c[1][0]) / 2, (c[0][1] + c[1][1]) / 2], b = [(c[2][0] + c[3][0]) / 2, (c[2][1] + c[3][1]) / 2], p = cruce(CTES, 'Avenida Leandro N. Alem'), q = cruce(CTES, 'Avenida Callao');
      const d1 = [b[0] - a[0], b[1] - a[1]], d2 = [q[0] - p[0], q[1] - p[1]], t = ((p[0] - a[0]) * d2[1] - (p[1] - a[1]) * d2[0]) / (d1[0] * d2[1] - d1[1] * d2[0]);
      console.log(`     el Obelisco: [${Math.round((a[0] + d1[0] * t) * 2)}, ${Math.round((a[1] + d1[1] * t) * 2)}] del plano`);
    } }
}
// (las obras tardías: su traza entra en `banda` ahora, y en `tardia` quedan las celdas que ninguna otra obra despeja)
for (const { Q, e, cz } of TARDIAS) llenar(cz ? calzadaT : tardia, Q, e, true);
for (let k = 0; k < w * h; k++) if (tardia[k]) { if (banda[k]) tardia[k] = 0; else banda[k] = tardia[k]; }
for (let k = 0; k < w * h; k++) if (calzadaT[k]) { if (calzada[k]) calzadaT[k] = 0; else calzada[k] = calzadaT[k]; }
lap(`obras: ${OBRAS.map((o) => `${o.nombre} (${AÑOS[o.e - 1].año})`).join(' · ')}`);
if (ver) {
  // (para mirar: las trazas sobre lo de 1867, en el centro)
  const x0 = Math.floor(centro[0] - 2300 / MPP), y0 = Math.floor(centro[1] - 2300 / MPP), an = Math.floor(2900 / MPP), al = Math.floor(2600 / MPP), o = Buffer.alloc(an * al * 3);
  for (let y = 0; y < al; y++) for (let x = 0; x < an; x++) { const k = (y0 + y) * w + x0 + x, q = (y * an + x) * 3, b = banda[k], g = ocup[k] ? 105 : calle[k] ? 225 : 190, c = b ? [[0, 0, 0], [230, 60, 40], [240, 160, 30], [200, 200, 40], [60, 170, 80], [50, 120, 230], [170, 70, 200]][Math.min(6, b)] : null; for (let t = 0; t < 3; t++) o[q + t] = c ? c[t] * 0.6 + g * 0.4 : g; if (verde[k]) o[q + 1] = Math.min(255, o[q + 1] + 50); }
  mkdirSync('tmp', { recursive: true }); await sharp(o, { raw: { width: an, height: al, channels: 3 } }).jpeg({ quality: 84 }).toFile('tmp/crece-obras.jpg');
}
if (process.env.CORTAR === 'obras') process.exit(0);

// ------------------------------------------------------------------------------------------------------ las manzanas
const [ix0, iy0, ix1, iy1] = PLANO.marco.map((v) => v / 2);
const libre = new Uint8Array(w * h);
for (let y = Math.ceil(iy0) + 2; y < iy1 - 2; y++) for (let x = Math.ceil(ix0) + 2; x < ix1 - 2; x++) { const k = y * w + x; libre[k] = calle[k] || via[k] || agua[k] ? 0 : 1; }
const label = new Int32Array(w * h).fill(-1), comps = [];
{
  const q = new Int32Array(w * h);
  for (let s = 0; s < w * h; s++) {
    if (!libre[s] || label[s] >= 0) continue;
    const id = comps.length; let head = 0, tail = 0; q[tail++] = s; label[s] = id;
    const c = { id, n: 0, x0: w, y0: h, x1: 0, y1: 0, sx: 0, sy: 0, start: s };
    while (head < tail) {
      const k = q[head++], x = k % w, y = (k / w) | 0;
      c.n++; c.sx += x; c.sy += y; if (x < c.x0) c.x0 = x; if (x > c.x1) c.x1 = x; if (y < c.y0) c.y0 = y; if (y > c.y1) c.y1 = y;
      if (libre[k - 1] && label[k - 1] < 0) { label[k - 1] = id; q[tail++] = k - 1; }
      if (libre[k + 1] && label[k + 1] < 0) { label[k + 1] = id; q[tail++] = k + 1; }
      if (libre[k - w] && label[k - w] < 0) { label[k - w] = id; q[tail++] = k - w; }
      if (libre[k + w] && label[k + w] < 0) { label[k + w] = id; q[tail++] = k + w; }
    }
    comps.push(c);
  }
}
lap(`${comps.length} manchas entre calles`);

// (lo que sigue es lo de tools/2-ciudad.mjs para ajustar cuatro lados a una mancha; allá vive junto con el resto)
const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const hull = (pts) => {
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  lo.pop(); up.pop(); return lo.concat(up);
};
function borde(c) { const out = []; for (let y = c.y0; y <= c.y1; y++) for (let x = c.x0; x <= c.x1; x++) { const k = y * w + x; if (label[k] !== c.id) continue; if (label[k - 1] !== c.id || label[k + 1] !== c.id || label[k - w] !== c.id || label[k + w] !== c.id) out.push([x, y]); } return out; }
function cuatroLados(c) {
  const B = borde(c);
  let H = hull(B.map((p) => [p[0], p[1]]));
  if (H.length < 4) return null;
  const tri = (a, b, d) => Math.abs((b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]));
  H = H.slice();
  while (H.length > 4) { let best = 0, bv = Infinity; for (let i = 0; i < H.length; i++) { const v = tri(H[(i + H.length - 1) % H.length], H[i], H[(i + 1) % H.length]); if (v < bv) { bv = v; best = i; } } H.splice(best, 1); }
  const lines = [];
  for (let i = 0; i < 4; i++) {
    const a = H[i], b = H[(i + 1) % 4], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    let n = 0, mx = 0, my = 0; const P = [];
    for (const p of B) { const t = ((p[0] - a[0]) * ux + (p[1] - a[1]) * uy) / L, d = Math.abs((p[0] - a[0]) * uy - (p[1] - a[1]) * ux); if (t > 0.1 && t < 0.9 && d < 3.2) { P.push(p); mx += p[0]; my += p[1]; n++; } }
    if (n < 6) { lines.push({ px: a[0], py: a[1], ux, uy }); continue; }
    mx /= n; my /= n; let sxx = 0, sxy = 0, syy = 0;
    for (const p of P) { const X = p[0] - mx, Y = p[1] - my; sxx += X * X; sxy += X * Y; syy += Y * Y; }
    const th = 0.5 * Math.atan2(2 * sxy, sxx - syy); let vx = Math.cos(th), vy = Math.sin(th);
    if (vx * ux + vy * uy < 0) { vx = -vx; vy = -vy; }
    lines.push({ px: mx, py: my, ux: vx, uy: vy });
  }
  const cx = c.sx / c.n, cy = c.sy / c.n;
  for (const l of lines) { let nx = l.uy, ny = -l.ux; if ((l.px - cx) * nx + (l.py - cy) * ny < 0) { nx = -nx; ny = -ny; } l.px += nx * 0.5 + 0.5; l.py += ny * 0.5 + 0.5; }
  const Q = [];
  for (let i = 0; i < 4; i++) { const a = lines[(i + 3) % 4], b = lines[i], det = a.ux * b.uy - a.uy * b.ux; if (Math.abs(det) < 1e-6) return null; const t = ((b.px - a.px) * b.uy - (b.py - a.py) * b.ux) / det; Q.push([a.px + a.ux * t, a.py + a.uy * t]); }
  let inter = 0, qa = 0;
  const x0 = Math.max(0, Math.floor(Math.min(...Q.map((p) => p[0])))), x1 = Math.min(w - 1, Math.ceil(Math.max(...Q.map((p) => p[0])))), y0 = Math.max(0, Math.floor(Math.min(...Q.map((p) => p[1])))), y1 = Math.min(h - 1, Math.ceil(Math.max(...Q.map((p) => p[1]))));
  if ((x1 - x0) * (y1 - y0) > c.n * 6) return null;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inPoly(Q, x + 0.5, y + 0.5)) { qa++; if (label[y * w + x] === c.id) inter++; }
  const iou = inter / (qa + c.n - inter);
  let area = 0; for (let i = 0; i < 4; i++) { const a = Q[i], b = Q[(i + 1) % 4]; area += a[0] * b[1] - a[1] * b[0]; }
  if (area < 0) Q.reverse();
  let s = 0; for (let i = 1; i < 4; i++) if (Q[i][0] + Q[i][1] < Q[s][0] + Q[s][1]) s = i;
  return { Q: [0, 1, 2, 3].map((i) => Q[(s + i) % 4]), iou };
}
function rectangulo(c) {
  const m = (x, y) => (label[y * w + x] === c.id ? 1 : 0);
  let sc = 0, ss = 0; const B = borde(c);
  for (const [x, y] of B) { if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) continue; const gx = m(x + 1, y - 1) + 2 * m(x + 1, y) + m(x + 1, y + 1) - m(x - 1, y - 1) - 2 * m(x - 1, y) - m(x - 1, y + 1), gy = m(x - 1, y + 1) + 2 * m(x, y + 1) + m(x + 1, y + 1) - m(x - 1, y - 1) - 2 * m(x, y - 1) - m(x + 1, y - 1); if (!gx && !gy) continue; const f = Math.atan2(gy, gx) * 4; sc += Math.cos(f); ss += Math.sin(f); }
  const th = Math.atan2(ss, sc) / 4, ux = Math.cos(th), uy = Math.sin(th);
  let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
  for (const p of B) { const u = p[0] * ux + p[1] * uy, v = -p[0] * uy + p[1] * ux; if (u < u0) u0 = u; if (u > u1) u1 = u; if (v < v0) v0 = v; if (v > v1) v1 = v; }
  u0 -= 0.5; v0 -= 0.5; u1 += 1; v1 += 1;
  const P = (u, v) => [u * ux - v * uy + 0.5, u * uy + v * ux + 0.5], Q = [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];
  let s = 0; for (let i = 1; i < 4; i++) if (Q[i][0] + Q[i][1] < Q[s][0] + Q[s][1]) s = i;
  return [0, 1, 2, 3].map((i) => Q[(s + i) % 4]);
}

// --------------------------------------------------------------------------- qué estaba edificado, según cada plano
// De cada plano calzado sale un campo «cuánto de edificado hay alrededor de este punto» (0…255), ya desenfocado: el
// calce de 1888 y de 1905 tiene decenas de metros de error, así que se mira por zonas y no casa por casa.
const TW = 4096, TH = (await sharp('public/plano/suelo.webp').metadata()).height; // (la lámina nueva, del tamaño de la del suelo)
const SEÑAS = {
  1888: { de: (r, g, b) => Math.max(0, Math.min(255, (r - (g + b) / 2 - 12) * 5)), radio: 34, umbral: 96 },   // el punteado rosado
  1895: { de: (r, g, b) => Math.max(0, Math.min(255, (205 - (r * 0.3 + g * 0.5 + b * 0.2)) * 2.4)), radio: 13, umbral: 118 }, // el rayado cruzado y el negro
  1905: { de: (r, g, b) => (g - b < 62 ? Math.max(0, Math.min(255, (r - g - 30) * 5)) : 0), radio: 26, umbral: 90 }, // el rosa (no el naranja de las estaciones)
  1910: { de: (r, g, b) => (g - b < 62 ? Math.max(0, Math.min(255, (r - g - 30) * 5)) : 0), radio: 26, umbral: 90 }, // (el mismo dibujo que el de 1905)
  1921: { de: (r, g, b) => (g - b < 62 ? Math.max(0, Math.min(255, (r - g - 30) * 5)) : 0), radio: 16, umbral: 90 },
  // el de Peuser raya las manzanas edificadas de rosa y deja amarillos los baldíos; fuera de la Capital no dibuja nada
  // (papel: ahí no dice ni que sí ni que no)
  1940: { de: (r, g, b) => (g - b < 75 ? Math.max(0, Math.min(255, (r - g - 15) * 22)) : 0), radio: 18, umbral: 90, papel: (r, g, b) => r > 205 && g > 195 && b > 150 && r - b < 75 && Math.abs(r - g) < 26,
    // (y pinta de verde las plazas y los parques: ahí no se edifica en ninguna etapa)
    parque: (r, g, b) => r - g < 7 && g - b > 48 && g > 120 },
};
const campos = [];
for (const { año } of AÑOS) {
  const { data, info: fi } = await sharp(`fuentes/planos/epoca-${año}.webp`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (fi.width !== TW) throw new Error(`epoca-${año}.webp: se esperaba de ${TW} de ancho`);
  const S = SEÑAS[año], m = Buffer.alloc(fi.width * fi.height);
  for (let q = 0; q < m.length; q++) m[q] = data[q * 4 + 3] > 128 ? S.de(data[q * 4], data[q * 4 + 1], data[q * 4 + 2]) : 0;
  const sigma = S.radio / (PLANO.ancho * PLANO.metro / TW) / 2;
  const f = await sharp(m, { raw: { width: fi.width, height: fi.height, channels: 1 } }).blur(Math.max(0.5, sigma)).extractChannel(0).raw().toBuffer();
  // hasta dónde llega el plano: donde tiene imagen y, si lo pide (papel), donde hay algo dibujado alrededor
  const c = Buffer.alloc(fi.width * fi.height);
  for (let q = 0; q < c.length; q++) c[q] = data[q * 4 + 3] > 128 && !(S.papel && S.papel(data[q * 4], data[q * 4 + 1], data[q * 4 + 2])) ? 255 : 0;
  const cub = S.papel ? await sharp(c, { raw: { width: fi.width, height: fi.height, channels: 1 } }).blur(70 / (PLANO.ancho * PLANO.metro / TW) / 2).extractChannel(0).raw().toBuffer() : c;
  let par = null;
  if (S.parque) { const v = Buffer.alloc(fi.width * fi.height); for (let q = 0; q < v.length; q++) v[q] = data[q * 4 + 3] > 128 && S.parque(data[q * 4], data[q * 4 + 1], data[q * 4 + 2]) ? 255 : 0; par = await sharp(v, { raw: { width: fi.width, height: fi.height, channels: 1 } }).blur(8 / (PLANO.ancho * PLANO.metro / TW) / 2 + 0.6).extractChannel(0).raw().toBuffer(); }
  campos.push({ año, f, cub, par, tope: S.papel ? 70 : 128, fw: fi.width, fh: fi.height, umbral: S.umbral });
  if (ver) { await sharp(f, { raw: { width: fi.width, height: fi.height, channels: 1 } }).resize(2048).jpeg({ quality: 80 }).toFile(`tmp/crece-campo-${año}.jpg`); if (S.papel) await sharp(cub, { raw: { width: fi.width, height: fi.height, channels: 1 } }).resize(2048).jpeg({ quality: 80 }).toFile(`tmp/crece-cubre-${año}.jpg`); }
}
/** el campo del plano e en un punto de la grilla (x, y en píxeles de clases) */
const enCampo = (c, x, y) => Math.min(c.fh - 1, Math.max(0, Math.round((y * 2 / PLANO.alto) * c.fh))) * c.fw + Math.min(c.fw - 1, Math.max(0, Math.round((x * 2 / PLANO.ancho) * c.fw)));
const señal = (e, x, y) => campos[e].f[enCampo(campos[e], x, y)];
/** ¿el plano e dice algo de ese punto? */
const cubre = (e, x, y) => campos[e].cub[enCampo(campos[e], x, y)] > campos[e].tope;
/** ¿algún plano lo pinta como plaza o parque? */
const enParque = (x, y) => zonaPal[Math.min(h - 1, Math.max(0, Math.round(y))) * w + Math.min(w - 1, Math.max(0, Math.round(x)))] > 0 || campos.some((c) => c.par && c.par[enCampo(c, x, y)] > 120);
lap('los planos de época');

// ------------------------------------------------------------------------------------------- la malla, con sus tiempos
// Cada celda de una manzana puede tener hasta dos cuerpos a lo largo de los años (v0 y después v1: la casa de 1867 y
// el edificio que la reemplaza). Cada cuerpo: { h, seed, floors, n (la etapa en que nace; 0: es de 1867), m (la etapa
// en que se va; 0: nunca), fija (ya está en la malla de 1867: no se vuelve a dibujar) }.
const manzanas = [], techos = [], muros = [];
const fin = (o) => o.m || 99;
// Los pisos salen de los censos, zona por zona y etapa por etapa (tools/alturas.mjs). Para repartirlos hay que saber
// antes cuántas casas hay en cada zona y en cada etapa: las casas nuevas, las de 1867 y los frentes de las avenidas se
// recorren dos veces, la primera de ensayo (se arman los lotes y se anotan en `censo`; no se guarda nada) y la segunda
// de verdad, con el plan de cada lote ya hecho: con cuántos pisos nace y, si se lo renueva, cuándo y a cuántos.
let ENSAYO = false;
const censo = [], planDe = new Map(), nRenovadas = AÑOS.map(() => 0);
/** El edificio que reemplaza a una casa en la etapa e: los pisos de su clase y el alto (los de antes de 1921 y pocos pisos, con techos altos). */
const edificio = (e, clase, z, n, r, R) => {
  const g = tiron(n, r, e), floors = pisosDe(clase, e, z, g, R(), R());
  let alto = floors * (floors > 3 || e >= E21 ? 3.3 + R() * 0.5 : 3.9 + R() * 1.3) + 1.2 + R();
  if (e === E40 && clase === 5 && g > 0.6 && R() < 0.06) alto = 38 + R() * 16; // (alguna torre: el Comega, el Safico, el Kavanagh son de esos años)
  return { floors, h: Math.round(alto * 10) };
};
/** Los techos de los cuerpos nuevos de una capa: rectángulos, como en 1867. */
function techar(id, nu, nv, lots, own) {
  const done = new Uint8Array(nu * nv);
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const k = j * nu + i, L = own[k]; if (L < 0 || done[k] || lots[L].fija) continue;
    let i1 = i; while (i1 + 1 < nu && own[j * nu + i1 + 1] === L && !done[j * nu + i1 + 1]) i1++;
    let j1 = j; outer: while (j1 + 1 < nv) { for (let t = i; t <= i1; t++) if (own[(j1 + 1) * nu + t] !== L || done[(j1 + 1) * nu + t]) break outer; j1++; }
    for (let b = j; b <= j1; b++) for (let a = i; a <= i1; a++) done[b * nu + a] = 1;
    techos.push(id, i, j, i1 + 1, j1 + 1, lots[L].h, lots[L].seed, lots[L].floors | (lots[L].n << 8) | (lots[L].m << 12));
  }
}
/** Los muros. De un cuerpo nuevo: donde el vecino es más bajo, no hay vecino o el vecino no dura lo que él (entonces
 *  va entero: lo que tape el vecino queda adentro). De uno de 1867: lo que le queda a la vista cuando se le va el
 *  vecino (la medianera), que nace en esa etapa. `capas`: los cuerpos que tuvo cada celda, uno tras otro (la casa y los
 *  que la reemplazaron). `vacio(i, j)`: a qué da una celda sin nada (0 calle, 1 patio, 2 otro edificio). */
function murar(id, nu, nv, lots, capas, vacio) {
  const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]], en = (i, j) => i >= 0 && j >= 0 && i < nu && j < nv;
  for (const capa of capas) for (let dir = 0; dir < 4; dir++) {
    const [di, dj] = DIRS[dir], horiz = dj !== 0, La = horiz ? nu : nv, Lc = horiz ? nv : nu;
    for (let cc = 0; cc < Lc; cc++) {
      let run = null;
      const flush = () => { if (run) { const o = lots[run.L]; muros.push(id, dir | (run.kind << 2) | (o.floors << 4) | (run.n << 8) | (o.m << 12), dir === 0 ? cc : dir === 2 ? cc + 1 : dir === 1 ? cc + 1 : cc, run.a0, run.a1, run.y0, run.y1, o.seed); run = null; } };
      for (let a = 0; a < La; a++) {
        const i = horiz ? a : cc, j = horiz ? cc : a, L = capa[j * nu + i];
        if (L < 0) { flush(); continue; }
        const o = lots[L], ni = i + di, nj = j + dj, V = []; // (V: los vecinos de esa celda, a lo largo de los años)
        if (en(ni, nj)) for (const cp of capas) { const q = cp[nj * nu + ni]; if (q >= 0) V.push(lots[q]); }
        if (V.includes(o)) { flush(); continue; }
        let y0, y1 = o.h, kind, n = o.n;
        if (!o.fija) {
          let fijo = null, alguno = false, hermano = false;
          for (const v of V) { if (v.n < fin(o) && fin(v) > o.n) alguno = true; if (v.n <= o.n && fin(v) >= fin(o)) fijo = v; if (o.casa && v.casa === o.casa) hermano = true; }
          // (sobre el cuerpo más bajo de su misma casa —el retiro de los pisos altos— la pared es un frente, con sus ventanas)
          y0 = fijo ? fijo.h : 0; kind = hermano ? 0 : alguno ? 2 : vacio(ni, nj, o);
        } else {
          // (la malla de 1867 ya trae el tramo que asoma sobre el vecino de entonces; falta lo de abajo, desde que se va)
          const sv = V.find((v) => v.fija);
          if (!sv || !sv.m || sv.m >= fin(o)) { flush(); continue; }
          const B = V.find((v) => !v.fija && v.n <= sv.m && fin(v) > sv.m);
          y0 = B ? B.h : 0; y1 = o.h > sv.h + 3 ? sv.h : o.h; kind = 2; n = sv.m;
        }
        if (y1 <= y0 + 3) { flush(); continue; }
        if (run && run.L === L && run.y0 === y0 && run.y1 === y1 && run.kind === kind && run.n === n) run.a1 = a + 1; else { flush(); run = { L, a0: a, a1: a + 1, y0, y1, kind, n }; }
      }
      flush();
    }
  }
}

/** Las siluetas: que un edificio no sea siempre el prisma entero de su lote. Se trabaja sobre una copia de las capas
 *  (lo demás —qué queda ocupado, el censo— sigue contando el lote entero) y solo en los cuerpos nuevos:
 *    - la casa baja (uno o dos pisos) de frente ancho, a veces con su patio al costado desde la mitad hacia el fondo:
 *      la planta en L de la casa chorizo;
 *    - el edificio de tres pisos o más, con un patio de aire y luz sobre una medianera (planta en C), o sin una de
 *      las esquinas del fondo (en L), o con una entrada en el medio del contrafrente (en U);
 *    - el de cinco pisos o más, entre medianeras, con los últimos pisos retirados dos o tres metros de la línea: el
 *      escalonado de los años treinta (más raro antes). El cuerpo del frente es un lote aparte, más bajo, con la
 *      misma semilla (`casa` los une: murar() les da pared con ventanas entre sí). Los pisos del censo no cambian:
 *      el cuerpo de atrás conserva los suyos, y el de adelante no baja de cuatro (así el visor les da el mismo estilo).
 *  Las esquinas (lotes con dos frentes) no se retiran: llevan la ochava, que arma el visor (src/ciudad.js).
 *  Cuál lote lleva qué es un sorteo propio (no toca el de las casas ni el de los pisos): todo esto es supuesto.
 *  Devuelve las capas nuevas y `vacio`, que además sabe que un hueco es un patio. */
function siluetas(nu, nv, lots, capas, vacio, sem) {
  const NC = nu * nv, hueco = new Uint8Array(NC), out = capas.map((c) => c.slice());
  const hay = (i, j) => { if (i < 0 || j < 0 || i >= nu || j >= nv) return false; const q = j * nu + i; for (const c of capas) if (c[q] >= 0) return true; return false; };
  for (const capa of out) {
    const cajas = new Map();
    for (let q = 0; q < NC; q++) { const L = capa[q]; if (L < 0 || lots[L].fija) continue; const i = q % nu, j = (q / nu) | 0; let c = cajas.get(L); if (!c) cajas.set(L, (c = { i0: i, i1: i, j0: j, j1: j, n: 0 })); c.i0 = Math.min(c.i0, i); c.i1 = Math.max(c.i1, i); c.j0 = Math.min(c.j0, j); c.j1 = Math.max(c.j1, j); c.n++; }
    for (const [L, c] of cajas) {
      const o = lots[L], an = c.i1 - c.i0 + 1, al = c.j1 - c.j0 + 1;
      if (c.n < an * al * 0.9) continue; // (solo los lotes limpios: un rectángulo)
      // a qué da cada lado (0: −v · 1: +u · 2: +v · 3: −u, como los muros): es frente si casi todo da a la calle
      const da = [0, 0, 0, 0], libre = (i, j) => !hay(i, j) && vacio(i, j, o) === 0;
      for (let i = c.i0; i <= c.i1; i++) { if (capa[c.j0 * nu + i] === L && libre(i, c.j0 - 1)) da[0]++; if (capa[c.j1 * nu + i] === L && libre(i, c.j1 + 1)) da[2]++; }
      for (let j = c.j0; j <= c.j1; j++) { if (capa[j * nu + c.i0] === L && libre(c.i0 - 1, j)) da[3]++; if (capa[j * nu + c.i1] === L && libre(c.i1 + 1, j)) da[1]++; }
      const largo = [an, al, an, al], calleEn = da.map((n, s) => n >= largo[s] * 0.6), nCalles = calleEn.filter(Boolean).length;
      if (!nCalles || nCalles > 2 || (nCalles === 2 && ((calleEn[0] && calleEn[2]) || (calleEn[1] && calleEn[3])))) continue;
      // el frente (si es esquina, el lado más corto) y, desde él, las celdas: t a lo largo del frente, d hacia el fondo
      let f = -1; for (let s = 0; s < 4; s++) if (calleEn[s] && (f < 0 || largo[s] < largo[f])) f = s;
      const otro = nCalles === 2 ? calleEn.findIndex((v, s) => v && s !== f) : -1;
      const Wf = largo[f], Dp = largo[(f + 1) % 4];
      const celda = (t, d) => (f === 0 ? (c.j0 + d) * nu + c.i0 + t : f === 2 ? (c.j1 - d) * nu + c.i0 + t : f === 3 ? (c.j0 + t) * nu + c.i0 + d : (c.j0 + t) * nu + c.i1 - d);
      const R = rng(o.seed * 977 + sem * 31 + o.n * 7 + 3), r = R();
      // (el hueco va sobre una medianera: en la esquina, del lado que no da a la otra calle)
      const lat = otro === (f % 2 === 0 ? 3 : 0) ? 1 : otro === (f % 2 === 0 ? 1 : 2) ? 0 : R() < 0.5 ? 0 : 1;
      const quita = (ta, tb, da0, db) => { for (let t = Math.max(0, ta); t < Math.min(Wf, tb); t++) for (let d = Math.max(0, da0); d < Math.min(Dp, db); d++) { const q = celda(t, d); if (capa[q] === L) { capa[q] = -1; hueco[q] = 1; } } };
      const alCostado = (pw, d0, d1) => (lat ? quita(Wf - pw, Wf, d0, d1) : quita(0, pw, d0, d1));
      if (Wf >= 8 && Dp >= 12) {
        if (o.floors <= 2) { if (r < 0.5) alCostado(Wf >= 11 && R() < 0.5 ? 4 : 3, Math.round(Dp * (0.3 + 0.2 * R())), Dp); }
        else if (r < 0.38) { const d0 = Math.round(Dp * (0.35 + 0.15 * R())), d1 = Math.min(Dp - 3, d0 + Math.max(4, Math.round(Dp * (0.22 + 0.13 * R())))); if (d1 - d0 >= 3) alCostado(Wf >= 12 ? 4 : 3, d0, d1); }
        else if (r < 0.62) alCostado(Math.round(Wf * (0.35 + 0.15 * R())), Dp - Math.round(Dp * (0.28 + 0.14 * R())), Dp);
        else if (r < 0.78 && Wf >= 11) { const pw = Math.max(3, Math.round(Wf * 0.34)), ta = Math.floor((Wf - pw) / 2); quita(ta, ta + pw, Dp - Math.round(Dp * (0.26 + 0.12 * R())), Dp); }
      }
      if (nCalles === 1 && o.floors >= 5 && Wf >= 7 && Dp >= 10 && R() < (o.n >= E40 ? 0.6 : o.n >= E21 ? 0.3 : 0.15)) {
        const ret = R() < 0.4 ? 3 : 2, k = o.floors >= 7 && R() < 0.5 ? 2 : 1, Lb = lots.length;
        o.casa = o; lots.push({ ...o, h: Math.round((o.h * (o.floors - k)) / o.floors), floors: o.floors - k, e: 0, plan: null, casa: o });
        for (let t = 0; t < Wf; t++) for (let d = 0; d < ret; d++) { const q = celda(t, d); if (capa[q] === L) capa[q] = Lb; }
      }
    }
  }
  return { capas: out, vacio: (i, j, o) => (i >= 0 && j >= 0 && i < nu && j < nv && hueco[j * nu + i] ? 1 : vacio(i, j, o)) };
}

// -------------------------------------------------------------------------------------------------------- una manzana
// (ocupa: dónde hay algo nuevo que queda en pie —para no edificarle encima los frentes de las avenidas—)
const ocupa = new Uint8Array(w * h);
const cuenta = AÑOS.map(() => 0);
const debug = ver ? new Uint8Array(w * h * 3) : null;
const FRENTES = [8, 9, 9, 9, 9, 10, 11, 13, 13, 17, 17, 22, 26];
// la lámina del suelo (a TW de ancho): desde cuándo hay patio (G) y edificio (B) en cada punto; 0 = nunca
const lamG = new Uint8Array(TW * TH), lamB = new Uint8Array(TW * TH);
// (junto: la traza de las obras y unos 7 m a cada lado, con la etapa más temprana)
// (juntoF: lo mismo sin las obras tardías —lo que frena a un lote para siempre—; SE_VAN: las celdas de las casas
// inventadas que se van con una obra tardía, de a pares celda, etapa)
const junto = new Uint8Array(w * h), juntoF = new Uint8Array(w * h), SE_VAN = [];
for (let y = 5; y < h - 5; y++) for (let x = 5; x < w - 5; x++) { const e = banda[y * w + x]; if (!e) continue; const f = !tardia[y * w + x]; for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) { const k = (y + j) * w + x + i; if (!junto[k] || junto[k] > e) junto[k] = e; if (f) juntoF[k] = 1; } }
const CODIGO = AÑOS.map((a, i) => Math.round((255 * (N - i)) / N)); // la etapa e vale CODIGO[e - 1]: 255 la primera, 255/N la última

function manzana(c, Q) {
  const R = rng(c.start * 7 + 13);
  const len = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const nu = Math.max(2, Math.round((len(Q[0], Q[1]) + len(Q[3], Q[2])) / 2 * MPP)), nv = Math.max(2, Math.round((len(Q[0], Q[3]) + len(Q[1], Q[2])) / 2 * MPP));
  if (nu > 1200 || nv > 1200 || nu < 14 || nv < 14) return;
  const at = (i, j) => { const s = (i + 0.5) / nu, t = (j + 0.5) / nv; return [(1 - s) * (1 - t) * Q[0][0] + s * (1 - t) * Q[1][0] + s * t * Q[2][0] + (1 - s) * t * Q[3][0], (1 - s) * (1 - t) * Q[0][1] + s * (1 - t) * Q[1][1] + s * t * Q[2][1] + (1 - s) * t * Q[3][1]]; };
  // de cada celda: si es de la manzana (blk) y si se puede edificar (lib: de la manzana o pegada a su borde, y sin nada de 1867)
  const NC = nu * nv, blk = new Uint8Array(NC), lib = new Uint8Array(NC), vieja = new Uint8Array(NC), kk = new Int32Array(NC);
  let nLib = 0;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const [x, y] = at(i, j), k = Math.min(h - 1, Math.max(0, Math.floor(y))) * w + Math.min(w - 1, Math.max(0, Math.floor(x))), q = j * nu + i;
    kk[q] = k; blk[q] = label[k] === c.id ? 1 : 0; lib[q] = !ocup[k] && !agua[k] && !via[k] && !calle67[k] && (blk[q] || (calle[k] && label[k] < 0)) ? 1 : 0; vieja[q] = calle67[k]; nLib += lib[q] & blk[q];
  }
  if (nLib < 90) return;
  const mx = c.sx / c.n, my = c.sy / c.n, dist = Math.hypot(mx - centro[0], my - centro[1]) * MPP;
  // (la zona, y la que le toca desde 1921, cuando el centro y el anillo llegan hasta Santa Fe: tools/alturas.mjs)
  const zona = zonaDeManzana((mx - centro[0]) * MPP, (my - centro[1]) * MPP), zona5 = zonaDeManzana((mx - centro[0]) * MPP, (my - centro[1]) * MPP, E_SANTA_FE), zonaEn = (e) => (e >= E_SANTA_FE ? zona5 : zona);
  const own = new Int32Array(NC).fill(-1), lots = [];
  const sides = [0, 1, 2, 3].map((s) => {
    const La = s % 2 === 0 ? nu : nv, Ld = s % 2 === 0 ? nv : nu, E = new Int16Array(La), D = new Int16Array(La);
    const cell = (a, d) => (s === 0 ? d * nu + a : s === 2 ? (nv - 1 - d) * nu + a : s === 1 ? a * nu + (nu - 1 - d) : a * nu + d);
    // dónde empieza la manzana vista desde esta calle (el borde, alisado: sin eso las fachadas salen en serrucho)…
    for (let a = 0; a < La; a++) { let e = 0; while (e < Ld && !blk[cell(a, e)]) e++; E[a] = e > Ld * 0.4 ? -1 : e; }
    const E0 = E.slice(); for (let a = 0; a < La; a++) { if (E0[a] < 0) continue; const v = []; for (let t = Math.max(0, a - 5); t <= Math.min(La - 1, a + 5); t++) if (E0[t] >= 0) v.push(E0[t]); v.sort((x, y) => x - y); E[a] = v[v.length >> 1]; }
    // …y cuánto fondo libre hay desde ahí (hasta lo primero de 1867, o hasta que se acaba la manzana)
    // (si la manzana de hoy asoma sobre una calle de 1867, la casa arranca donde termina esa calle)
    for (let a = 0; a < La; a++) { if (E[a] < 0) { D[a] = 0; continue; } let e = E[a]; while (e < Math.min(Ld, E[a] + 11) && vieja[cell(a, e)]) e++; E[a] = e; let d = e; while (d < Ld && lib[cell(a, d)] && (blk[cell(a, d)] || d < e + 3)) d++; D[a] = d - e; }
    return { La, Ld, E, D, cell, cap: Ld < 36 ? Math.ceil(Ld / 2) : Math.floor(Ld * 0.42) };
  });
  for (const si of R() < 0.5 ? [0, 2, 1, 3] : [1, 3, 0, 2]) {
    const S = sides[si]; let a = 0;
    while (a < S.La) {
      if (S.D[a] < 7) { a++; continue; }
      let b = a + 1; while (b < S.La && S.D[b] >= 7) b++;
      let p = a;
      while (p < b) {
        let q = Math.min(b, p + FRENTES[Math.floor(R() * FRENTES.length)]);
        for (let t = p + 5; t < q; t++) if (Math.abs(Math.min(S.D[t], S.cap) - Math.min(S.D[t - 1], S.cap)) >= 4) { q = t; break; }
        if (b - q < 6) q = b;
        if (q - p >= 5) {
          const ds = []; for (let t = p; t < q; t++) ds.push(Math.min(S.D[t], S.cap)); ds.sort((x, y) => x - y);
          const depth = Math.min(ds[ds.length >> 1], Math.round(10 + R() * 14)), L = lots.length;
          lots.push({ n: 0, sx: 0, sy: 0, seed: 1 + Math.floor(R() * 65000), r: R(), r2: R(), r3: R(), e: 0, m: 0, nb: 0, nj: 0, np: 0, eb: 99, nf: 0, et: 99 });
          for (let t = p; t < q; t++) for (let d = S.E[t]; d < Math.min(S.Ld, S.E[t] + depth); d++) { const k = S.cell(t, d); if (!lib[k]) break; if (own[k] < 0) { own[k] = L; const o = lots[L]; o.n++; o.sx += kk[k] % w; o.sy += (kk[k] / w) | 0; if (banda[kk[k]]) o.nb++; if (patio67[kk[k]]) o.np++; if (junto[kk[k]]) { o.nj++; o.eb = Math.min(o.eb, junto[kk[k]]); if (juntoF[kk[k]]) o.nf++; else o.et = Math.min(o.et, junto[kk[k]]); } } }
        }
        p = q;
      }
      a = b;
    }
  }
  // cada lote: desde qué plano está. Hace falta que lo diga ese plano y, si no es el último, alguno de los que siguen
  // (una mancha de tinta en un plano solo no levanta una casa).
  let hay = 0;
  for (let li = 0; li < lots.length; li++) {
    const o = lots[li]; if (o.n < 30) continue;
    const x = o.sx / o.n, y = o.sy / o.n, s = campos.map((cm, e) => señal(e, x, y) / cm.umbral), flojo = 0.82 + 0.36 * o.r;
    // (ni en las plazas: donde algún plano las pinta de verde y, en el casco de 1867 —donde toda manzana era casa o
    // fondo—, en lo que no era fondo de nadie)
    if (enParque(x, y) || (Math.hypot(x - centro[0], y - centro[1]) < M(1600) && o.np < o.n * 0.5)) continue;
    const p = s.map((v) => v > flojo);
    for (let e = 0; e < N && !o.e; e++) {
      if (!p[e]) continue;
      // (lo confirma alguno de los dos planos que siguen y llegan hasta ahí, o el anterior casi lo decía; si no sigue ninguno, vale)
      let conf = e > 0 && s[e - 1] > 0.6, siguen = 0;
      for (let f = e + 1; f < N && siguen < 2; f++) { if (!cubre(f, x, y)) continue; siguen++; if (p[f] || s[f] > 0.55) conf = true; }
      if (conf || !siguen) o.e = e + 1;
    }
    // lo que queda en la traza de una obra: si la obra es anterior, no se edifica; si es posterior, se va con ella
    // (lo que queda en la traza de una obra o pegado a ella no se edifica acá: la manzana de hoy ya viene cortada por
    // la avenida, y antes de abrirla ese fondo era otra cosa. Los frentes de la avenida se arman después, en su etapa.)
    // (salvo que solo lo toque una obra tardía: entonces se edifica igual, y se va en la etapa de esa obra)
    if (o.e && o.nj >= Math.max(3, o.n * 0.04)) { if (o.nf >= Math.max(3, o.n * 0.04) || o.e >= o.et) o.e = 0; else o.m = o.et; }
    if (!o.e) continue;
    // los pisos: los del plan que le tocó en el reparto (nace con los de su clase; lo que se renueva va más abajo)
    hay++; o.n0 = o.n; o.ln = (x - centro[0]) * MPP; o.lr = (y - centro[1]) * MPP; o.fin = o.m;
    if (ENSAYO) { censo.push({ clave: c.start * 4096 + li, z: zona, z5: zona5, n: o.ln, r: o.lr, sem: o.seed * 131 + c.start, nace: o.e, muere: o.m, clase: 0, fijo: false }); continue; }
    o.plan = planDe.get(c.start * 4096 + li) ?? [[o.e, 1]];
    o.floors = pisosDe(o.plan[0][1], o.e, zonaEn(o.e), tiron(o.ln, o.lr, o.e), o.r2, o.r3); o.h = Math.round((o.floors * (o.floors > 3 ? 3.4 + o.r * 0.5 : 3.9 + o.r3 * 1.5) + 0.6 + o.r * 0.7) * 10); o.n = o.e;
  }
  for (let k = 0; k < NC; k++) if (own[k] >= 0 && !lots[own[k]].e) own[k] = -1;
  if (ENSAYO) { for (let k = 0; k < NC; k++) if (own[k] >= 0 && !lots[own[k]].m) ocupa[kk[k]] = 1; return; }
  if (!hay) return;
  const id = manzanas.length;
  if (id > 65535) throw new Error('demasiadas manzanas para 16 bits');

  // --- la malla, igual que en 1867; un vecino que todavía no existe (o que se va) no tapa la medianera ---
  // lo que se renueva: en el mismo lote, un edificio más alto en lugar de la casa (hasta dos veces en setenta años;
  // si al lote se lo lleva una obra tardía, el último cuerpo se va con ella)
  const capas = [own], sigue = new Map();
  for (let li = 0, n0 = lots.length; li < n0; li++) {
    const o = lots[li]; if (!o.e || o.plan.length < 2) continue;
    const Rr = rng(o.seed * 31 + c.start * 7 + 5), mios = []; let antes = o;
    for (let t = 1; t < o.plan.length; t++) {
      const [e, clase] = o.plan[t]; if (o.fin && e >= o.fin) break;
      const ed = edificio(e, clase, zonaEn(e), o.ln, o.lr, Rr);
      antes.m = e; nRenovadas[e - 1]++; mios.push(lots.length); if (!capas[t]) capas[t] = new Int32Array(NC).fill(-1);
      antes = { h: Math.max(ed.h, antes.h + 25), seed: 1 + Math.floor(Rr() * 65000), floors: ed.floors, n: e, m: o.fin, e: 0 }; lots.push(antes);
    }
    if (mios.length) sigue.set(li, mios);
  }
  if (sigue.size) for (let k = 0; k < NC; k++) { const m = sigue.get(own[k]); if (m) for (let t = 0; t < m.length; t++) capas[t + 1][k] = m[t]; }
  const sil = siluetas(nu, nv, lots, capas, (i, j) => (i < 0 || j < 0 || i >= nu || j >= nv || !blk[j * nu + i] ? 0 : 1), c.start);
  for (const cp of sil.capas) techar(id, nu, nv, lots, cp);
  murar(id, nu, nv, lots, sil.capas, sil.vacio);
  for (let k = 0; k < NC; k++) if (own[k] >= 0) { if (!lots[own[k]].fin) ocupa[kk[k]] = 1; else SE_VAN.push(kk[k], lots[own[k]].fin); }
  manzanas.push({ Q, nu, nv });
  for (const o of lots) if (o.e) cuenta[o.e - 1]++;

  // --- el suelo: lo edificado, y los fondos (cada punto del fondo aparece con la casa que le queda más cerca) ---
  const de = new Uint8Array(NC), cola = [];
  for (let k = 0; k < NC; k++) if (own[k] >= 0) { de[k] = lots[own[k]].e; cola.push(k); }
  const paso = new Uint8Array(NC);
  for (let hd = 0; hd < cola.length; hd++) { const k = cola[hd], i = k % nu, j = (k / nu) | 0; if (paso[k] >= 46) continue; for (const n of [i > 0 ? k - 1 : -1, i < nu - 1 ? k + 1 : -1, j > 0 ? k - nu : -1, j < nv - 1 ? k + nu : -1]) if (n >= 0 && !de[n] && blk[n] && !ocup[kk[n]]) { de[n] = de[k]; paso[n] = paso[k] + 1; cola.push(n); } }
  for (let k = 0; k < NC; k++) {
    if (!de[k]) continue;
    const x = kk[k] % w, y = (kk[k] / w) | 0, t = Math.min(TH - 1, Math.floor((y * 2 / PLANO.alto) * TH)) * TW + Math.min(TW - 1, Math.floor((x * 2 / PLANO.ancho) * TW)), v = CODIGO[de[k] - 1], lam = own[k] >= 0 && sil.capas[0][k] >= 0 ? lamB : lamG; // (los patios de aire y luz son fondo)
    if (v > lam[t]) lam[t] = v;
    if (debug && own[k] >= 0) { const o = lots[own[k]], col = [[225, 70, 50], [240, 150, 40], [235, 215, 60], [70, 185, 90], [60, 130, 235], [185, 90, 215]][o.e - 1], f = 0.75 + 0.25 * ((o.seed % 97) / 97); debug[kk[k] * 3] = col[0] * f; debug[kk[k] * 3 + 1] = col[1] * f; debug[kk[k] * 3 + 2] = col[2] * f; }
  }
}

let nCuatro = 0, nRaras = 0;
function nuevas() {
  nCuatro = nRaras = 0;
  for (const c of comps) {
    const area = c.n * MPP * MPP;
    if (area < 1100 || area > 700000) continue;
    const f = cuatroLados(c);
    if (f && f.iou >= 0.84) { manzana(c, f.Q); nCuatro++; } else { const Q = rectangulo(c); if (Q) { manzana(c, Q); nRaras++; } }
  }
}

// ------------------------------------------------------------------------------------- lo de 1867 que cambia
// Manzana por manzana de 1867: las casas que quedan en la traza de una obra se van en esa etapa (y a las vecinas les
// nace la medianera que quedó a la vista), y en el centro una parte de las casas del frente se reemplaza, etapa por
// etapa, por un edificio más alto en el mismo lote.
const nMz67 = mz67.length / 10, techosDe = Array.from({ length: nMz67 }, () => []), murosDe = Array.from({ length: nMz67 }, () => []);
for (let i = 0; i < te67.length; i += 8) techosDe[te67[i]].push(i);
for (let i = 0; i < mu67.length; i += 8) murosDe[mu67[i]].push(i);
const muereT = new Map(), muereM = new Map(); // registro de techos.bin / muros.bin → etapa en que se va
const muerto = new Uint8Array(w * h);         // lo que queda libre al irse una casa: desde qué etapa
const lote67 = new Uint8Array(w * h), vivo = new Uint8Array(w * h); // dónde hay una casa de 1867 · dónde queda algo en pie (ella o su reemplazo)
// (vivoS, muertoS: lo mismo, en el ensayo —sin las renovaciones—, para saber cuántos frentes de avenida va a haber)
const vivoS = new Uint8Array(w * h), muertoS = new Uint8Array(w * h);
// Qué parte del patio de 1867 está edificada en cada etapa (1888 … 1940), por zona (las de tools/alturas.mjs: 0 centro
// —y la «city»—, 1 anillo, 2 norte cercano, 4 sur cercano, 6 oeste; en las demás no se toca).
const FONDOS = { 0: [0.15, 0.25, 0.4, 0.5, 0.6, 0.85], 1: [0.1, 0.18, 0.3, 0.4, 0.5, 0.8], 2: [0.1, 0.18, 0.3, 0.4, 0.5, 0.8], 4: [0.05, 0.09, 0.15, 0.2, 0.25, 0.4], 6: [0.05, 0.09, 0.15, 0.2, 0.25, 0.4] };
const nFondos = [0, 0, 0, 0, 0, 0]; let nFondosAltos = 0;
// Los fondos que se van con el frente (más abajo, en viejas()). P_FONDO67: la suerte de que un fondo que comparte
// pared con un edificio alto y nuevo se vaya con él = P_FONDO67[0] + P_FONDO67[1] × (la parte del frente de la manzana
// que ya es de cuatro pisos o más). ABSORBE: de los que se van, qué parte queda dentro del edificio (el resto, patio).
// Son supuestos. `pulmon`: dónde se demolió uno de 1867 sin edificar. nFondos67[qué][zona][1921 · 1940], con qué =
// 0 de 1867 absorbido · 1 de 1867 demolido · 2 fondo nuevo que nace alto · 3 fondo nuevo rehecho · 4 fondo nuevo demolido · 5 rehecho sin compartir pared.
// CERCA67, SUELTO67: el que no comparte pared con ninguno pero tiene un edificio alto a menos de CERCA67 m se rehace
// como él, con SUELTO67 de la suerte de los otros.
// LARGO67, HONDO67: de un cuerpo de más de LARGO67 m² el edificio absorbe solo lo que tiene a menos de HONDO67 m.
const P_FONDO67 = [0.25, 1.5], ABSORBE = 0.85, LARGO67 = 450, HONDO67 = 28, CERCA67 = 60, SUELTO67 = 0.6, VUELTAS67 = 8, pulmon = new Uint8Array(w * h), nFondos67 = [0, 1, 2, 3, 4, 5].map(() => [[0, 0], [0, 0]]);
let nSeVan = 0; const enCity = { casas: 0, chicas: 0, otras: 0, sinCaja: 0, celdas: 0, celdasNuevas: 0, nuevas: 0 };
function viejas() {
nSeVan = 0; for (const k in enCity) enCity[k] = 0; nFondos.fill(0); nFondosAltos = 0;
for (let b = 0; b < nMz67; b++) {
  if (!techosDe[b].length) continue;
  const o = b * 10, nu = mz67[o + 8], nv = mz67[o + 9], Q = [0, 1, 2, 3].map((i) => [mz67[o + i * 2] / 2, mz67[o + i * 2 + 1] / 2]), Nc = nu * nv;
  const cx = (Q[0][0] + Q[1][0] + Q[2][0] + Q[3][0]) / 4, cy = (Q[0][1] + Q[1][1] + Q[2][1] + Q[3][1]) / 4, bn = (cx - centro[0]) * MPP, br = (cy - centro[1]) * MPP, zona = zonaDeManzana(bn, br), zona5 = zonaDeManzana(bn, br, E_SANTA_FE), zonaEn = (e) => (e >= E_SANTA_FE ? zona5 : zona);
  const at = (i, j) => { const s = (i + 0.5) / nu, t = (j + 0.5) / nv; return [(1 - s) * (1 - t) * Q[0][0] + s * (1 - t) * Q[1][0] + s * t * Q[2][0] + (1 - s) * t * Q[3][0], (1 - s) * (1 - t) * Q[0][1] + s * (1 - t) * Q[1][1] + s * t * Q[2][1] + (1 - s) * t * Q[3][1]]; };
  const kDe = (i, j) => { const [x, y] = at(i, j); return Math.min(h - 1, Math.max(0, Math.floor(y))) * w + Math.min(w - 1, Math.max(0, Math.floor(x))); };
  const v0 = new Int32Array(Nc).fill(-1), lots = [], porSemilla = new Map();
  for (const t of techosDe[b]) {
    const seed = te67[t + 6]; let L = porSemilla.get(seed);
    if (L === undefined) { L = lots.length; porSemilla.set(seed, L); lots.push({ h: te67[t + 5], seed, floors: te67[t + 7] & 15, kind: (te67[t + 7] >> 4) & 15, n: 0, m: 0, fija: true, celdas: 0, nb: 0, eb: 99, nf: 0, et: 99, rects: [] }); }
    lots[L].rects.push(t);
    for (let j = te67[t + 2]; j < te67[t + 4]; j++) for (let i = te67[t + 1]; i < te67[t + 3]; i++) { v0[j * nu + i] = L; const lo = lots[L], kb = kDe(i, j), e = banda[kb]; lo.celdas++; if (e) { lo.nb++; lo.eb = Math.min(lo.eb, e); if (tardia[kb]) lo.et = Math.min(lo.et, e); else lo.nf++; } }
  }
  // (lo de 1867 que queda adentro de los parques de Palermo —el caserón de Rosas, demolido el 3 de febrero de 1899, y
  // los ranchos de alrededor— se va en 1905, como lo que toca una obra tardía)
  if ([[0, 0], [30, 0], [-30, 0], [0, 30], [0, -30], [22, 22], [-22, 22], [22, -22], [-22, -22]].some(([a, b]) => zonaPal[Math.min(h - 1, Math.max(0, Math.floor(cy + b))) * w + Math.min(w - 1, Math.max(0, Math.floor(cx + a)))]) && Math.hypot(cx - 8125, cy - 2110) < 900 && Math.hypot(cx - centro[0], cy - centro[1]) > M(1600)) for (const lo of lots) { lo.nb = lo.celdas; lo.nf = 0; lo.eb = Math.min(lo.eb, E05); lo.et = Math.min(lo.et, E05); }
  const n67 = lots.length, v1 = new Int32Array(Nc).fill(-1), v2 = new Int32Array(Nc).fill(-1); let cambia = false, dos = false;
  /** El rectángulo más grande que entra en un lote de 1867 ([i0, j0, i1, j1]), o null si es muy chico o cubre menos del 40 % del lote. */
  const cajaDe = (L) => {
    const lo = lots[L]; let caja = null;
    let i0 = nu, i1 = -1, j0 = nv, j1 = -1; for (const t of lo.rects) { i0 = Math.min(i0, te67[t + 1]); i1 = Math.max(i1, te67[t + 3]); j0 = Math.min(j0, te67[t + 2]); j1 = Math.max(j1, te67[t + 4]); }
    const an = i1 - i0, alt = new Int32Array(an); let mejor = 0;
    for (let j = j0; j < j1; j++) {
      for (let i = 0; i < an; i++) alt[i] = v0[j * nu + i0 + i] === L ? alt[i] + 1 : 0;
      for (let i = 0; i < an; i++) { if (!alt[i]) continue; let m = alt[i]; for (let k = i; k < an && alt[k]; k++) { m = Math.min(m, alt[k]); const ar = m * (k - i + 1); if (ar > mejor && m >= 5 && k - i + 1 >= 5) { mejor = ar; caja = [i0 + i, j - m + 1, i0 + k + 1, j + 1]; } } }
    }
    return mejor < 30 || mejor < lo.celdas * 0.4 ? null : caja;
  };
  for (let L = 0; L < n67; L++) {
    const lo = lots[L], frente = lo.kind !== 1;
    // (para el censo cuentan las casas a la calle y las construcciones sueltas, no los cuerpos del corazón de la manzana)
    // (tarde: solo la toca una obra tardía. Se renueva como siempre, y la casa o su reemplazo se van en la etapa de la obra)
    const umbral = Math.max(3, lo.celdas * 0.04), tarde = lo.nb >= umbral && lo.nf < umbral, fin0 = tarde ? lo.et : 0;
    const alCenso = () => { if (ENSAYO && frente) censo.push({ clave: null, z: zona, z5: zona5, n: bn, r: br, sem: lo.seed * 131 + b, nace: 0, muere: lo.m, clase: claseDe(lo.floors), fijo: true }); };
    if (lo.nb >= umbral) { lo.m = tarde ? lo.et : lo.eb; cambia = true; nSeVan++; if (!tarde) { alCenso(); continue; } }
    const adentro = city(cx, cy) > 0.5; if (adentro) { enCity.casas++; enCity.celdas += lo.celdas; if (lo.kind !== 0) enCity.otras++; if (lo.celdas < 32 || lo.celdas > 900) enCity.chicas++; }
    // (lo que no da a la calle —los cuerpos del corazón de la manzana— solo se renueva en la city, de 1921 en adelante:
    // ahí las manzanas se llenaron hasta el fondo; las construcciones sueltas y los lotes muy chicos o muy grandes quedan como están)
    const fondo = lo.kind === 1;
    if (lo.kind === 2 || (fondo && !(city(cx, cy) > 0.3)) || lo.celdas < 32 || lo.celdas > 1800) { alCenso(); continue; }
    const R = rng(lo.seed * 31 + b * 7 + 5);
    // (el edificio nuevo ocupa el rectángulo más grande que entra en el lote: las casas de 1867 tienen el borde que les
    // dio el rayado del plano, con salientes de un metro que en un edificio de ocho pisos serían agujas)
    const caja = cajaDe(L);
    if (!caja) { if (adentro) enCity.sinCaja++; alCenso(); continue; }
    // el cuerpo nuevo, sobre la caja, en lugar del que estaba
    const levanta = (antes, e, floors, alto, capa) => {
      antes.m = e; cambia = true; nRenovadas[e - 1]++; if (adentro) { enCity.nuevas++; enCity.celdasNuevas += (caja[2] - caja[0]) * (caja[3] - caja[1]); }
      const nuevo = { h: Math.max(alto, antes.h + 25), seed: 1 + Math.floor(R() * 65000), floors, n: e, m: fin0 }, L1 = lots.length; lots.push(nuevo);
      for (let j = caja[1]; j < caja[3]; j++) for (let i = caja[0]; i < caja[2]; i++) capa[j * nu + i] = L1;
      return nuevo;
    };
    if (fondo) {
      // (en la city, entre 1921 y 1940 casi no queda casa baja: las fotos del Obelisco recién inaugurado muestran
      // cuadras enteras de ocho a diez pisos, con alguna casa vieja en el medio)
      for (let e = E21; e <= N; e++) {
        const kc = city(cx, cy); if (R() >= kc * (e === E40 ? 0.66 : 0.07)) continue; // (entre 1914 y 1921 se edificó poco: la guerra)
        if (tarde && e >= lo.et) break; // (le tocaba renovarse cuando ya está la obra: no se renueva)
        const floors = 3 + Math.floor(R() * 4.99 * kc), alto = Math.round((floors * (3.3 + R() * 0.5) + 1.2 + R()) * 10);
        if (ENSAYO) censo.push({ clave: null, z: zona, z5: zona5, n: bn, r: br, sem: lo.seed * 131 + b + 7, nace: e, muere: fin0, clase: claseDe(floors), fijo: true }); else levanta(lo, e, floors, alto, v1);
        break;
      }
      continue;
    }
    // la casa a la calle: lo que diga su plan (a lo sumo dos renovaciones, cada una a más pisos)
    if (ENSAYO) { censo.push({ clave: -(b * 4096 + L + 1), z: zona, z5: zona5, n: bn, r: br, sem: lo.seed * 131 + b, nace: 0, muere: fin0, clase: claseDe(lo.floors), fijo: false }); continue; }
    let antes = lo, t = 0;
    for (const [e, clase] of planDe.get(-(b * 4096 + L + 1)) ?? []) { if (tarde && e >= lo.et) break; const ed = edificio(e, clase, zonaEn(e), bn, br, R); antes = levanta(antes, e, ed.floors, ed.h, t++ ? v2 : v1); if (t > 1) dos = true; }
  }
  // Los fondos que se llenan. El plano de 1867 trae el corazón de cada manzana abierto (patios, huertas, corralones) y
  // nada de lo de arriba lo toca; pero para 1940 las manzanas del centro estaban techadas de medianera a medianera,
  // con patios de aire y luz de pocos metros (la foto aérea de 1940 del mapa de la Ciudad). Acá la manzana se lotea
  // como se loteaba: tiras derechas de unas 10 varas de frente, perpendiculares a la calle —las de los dos lados
  // largos llegan hasta el eje; las de las dos cabeceras, hasta un tercio—. Cada tira es un lote, y su fondo se edifica
  // de una vez, entero y con un solo techo, en la etapa que le toque: FONDOS dice qué parte de los fondos está
  // edificada en cada etapa, por zona. Queda un patio de aire y luz contra una medianera. Son alas parejas, no casas
  // nuevas: no cuentan para el censo. Todo esto es supuesto, salvo los dos extremos (1867 y 1940).
  // El fondo es del edificio de adelante. Si en su tira, sobre la calle, hay un edificio de tres pisos o más levantado
  // en 1921 o en 1940, el fondo tiene sus pisos, su alto y su semilla: se lee como un solo edificio que llega hasta
  // el corazón de la manzana, y no como una torre con un galponcito de techo colorado atrás. El fondo que ya estaba
  // edificado de antes se rehace con ese edificio, en la etapa en que se lo levanta (una sola vez: si adelante hay uno
  // de 1921 y otro de 1940, con el de 1940). Detrás de una casa baja queda como estaba.
  const misFondos = [], tirasHechas = []; // (tirasHechas: cada fondo edificado —su cuerpo, sus celdas y si ya tiene dos cuerpos—)
  { const enLaCity = city(cx, cy) > 0.5, frA = enLaCity ? FONDOS[0] : FONDOS[zona], frB = enLaCity ? FONDOS[0] : FONDOS[zona5]; // (hasta 1910 · desde 1921)
    if ((frA || frB) && nu >= 24 && nv >= 24 && lots.length >= 6) { // (con casas: una plaza no se lotea)
      const Rf = rng(b * 977 + 4513);
      // (el edificio de adelante de una tira en la etapa s: el que más celdas ocupa entre la calle y el fondo, si es alto y nuevo)
      const adelante = (T, d0, s) => {
        const cu = new Map(); let mejor = -1, mx = 0;
        for (let d = 0; d < d0; d++) for (let t = 0; t < T.an; t++) { const q = T.q(d, t); for (const cp of [v2, v1, v0]) { const L = cp[q]; if (L < 0) continue; const lo = lots[L]; if (lo.fondo || lo.n > s || (lo.m && lo.m <= s)) continue; const n = (cu.get(L) ?? 0) + 1; cu.set(L, n); if (n > mx) { mx = n; mejor = L; } break; } }
        const lo = mejor >= 0 ? lots[mejor] : null; return lo && !lo.fija && lo.n >= E21 && lo.floors >= 3 ? lo : null;
      };
      const libre = (q) => { if (v0[q] >= 0 || v1[q] >= 0 || v2[q] >= 0) return false; const k = kDe(q % nu, (q / nu) | 0); return !!(patio67[k] || dentro[k]) && !banda[k] && !ocupa[k] && !solar[k] && !calle[k] && !via[k] && !agua[k] && !junto[k]; };
      const largoU = nu >= nv, A = largoU ? nu : nv, C = largoU ? nv : nu, cab = Math.round(C * 0.32), medio = C >> 1;
      const q0 = (a, c) => (largoU ? c * nu + a : a * nu + c); // (a: a lo largo del lado largo · c: a lo ancho)
      const tiras = [];
      const corta = (de, a, hacer) => { let t = de; while (t < a) { let an = 7 + Math.floor(Rf() * 4); if (a - t - an < 5) an = a - t; hacer(t, t + an); t += an; } };
      corta(cab, A - cab, (t0, t1) => { tiras.push({ hondo: medio, an: t1 - t0, q: (d, t) => q0(t0 + t, d) }); tiras.push({ hondo: C - medio, an: t1 - t0, q: (d, t) => q0(t0 + t, C - 1 - d) }); });
      corta(0, C, (t0, t1) => { tiras.push({ hondo: cab, an: t1 - t0, q: (d, t) => q0(d, t0 + t) }); tiras.push({ hondo: cab, an: t1 - t0, q: (d, t) => q0(A - 1 - d, t0 + t) }); });
      for (const T of tiras) {
        const r0 = Rf(), r1 = Rf(), r2 = Rf(), r3 = Rf(), sem = 1 + Math.floor(Rf() * 65000);
        let e = 0; for (let k = 1; k <= N; k++) { const fr = k >= E_SANTA_FE ? frB : frA; if (fr && r0 < fr[k - 1]) { e = k; break; } } if (!e) continue;
        const alta = (e >= E_SANTA_FE ? frB : frA) === FONDOS[0];
        // (las filas enteras libres, de la calle hacia el fondo; el cuerpo es el tramo corrido más largo)
        let d0 = 0, d1 = 0, a = -1;
        for (let d = 0; d <= T.hondo; d++) { let ok = d < T.hondo; if (ok) for (let t = 0; t < T.an; t++) if (!libre(T.q(d, t))) { ok = false; break; } if (ok) { if (a < 0) a = d; } else if (a >= 0) { if (d - a > d1 - d0) { d0 = a; d1 = d; } a = -1; } }
        if (d1 - d0 < 4) continue;
        const pat = d1 - d0 >= 9 && T.an >= 6 ? d0 + 3 + Math.floor(r3 * (d1 - d0 - 7)) : -1, lado = r3 < 0.5; // (el patio: 3 × 3 celdas)
        const base = r1 < 0.3 ? 2 : 1, floors = e < E21 ? base : e < E40 ? base + (r1 > 0.7 ? 1 : 0) : alta ? Math.max(base, 2) + Math.floor(r1 * 3) : base + Math.floor(r1 * 2);
        const F = ENSAYO || e < E21 ? null : adelante(T, d0, e), G = ENSAYO || e >= E40 ? null : adelante(T, d0, E40);
        const cuerpo = F ? { h: F.h, seed: F.seed, floors: F.floors, n: e, m: 0, fondo: true } : { h: Math.round((floors * (3.3 + r2 * 0.4) + 1 + r2 * 0.6) * 10), seed: sem, floors, n: e, m: 0, fondo: true };
        const L1 = lots.length; lots.push(cuerpo);
        let L2 = -1; if (G && G !== F && G.n > e && G.h > cuerpo.h + 10) { cuerpo.m = G.n; L2 = lots.length; lots.push({ h: G.h, seed: G.seed, floors: G.floors, n: G.n, m: 0, fondo: true }); dos = true; nFondosAltos++; } else if (F) nFondosAltos++;
        const qs = []; tirasHechas.push({ cuerpo, qs, dos: L2 >= 0 });
        for (let d = d0; d < d1; d++) for (let t = 0; t < T.an; t++) { if (d >= pat && d < pat + 3 && pat >= 0 && (lado ? t < 3 : t >= T.an - 3)) continue; const q = T.q(d, t); v1[q] = L1; if (L2 >= 0) v2[q] = L2; qs.push(q); misFondos.push(kDe(q % nu, (q / nu) | 0), e); }
        cambia = true; nFondos[e - 1]++;
      }
    }
  }
  // Los fondos se van con el frente. Arriba, lo de 1867 que no da a la calle solo se renueva en la «city», y un fondo
  // de los que se llenan toma el alto del edificio de adelante solo si ese edificio ya estaba cuando se lo edificó: en
  // el resto del centro el frente del lote pasaba a ser un edificio de ocho pisos con azotea y atrás le quedaba, hasta
  // 1940, el cuerpo bajo de antes con su techo colorado. Un edificio de renta de los años veinte y treinta ocupaba
  // casi todo el lote, con patios de aire y luz chicos: lo de atrás se tiraba con lo de adelante. Acá, en el centro y
  // el anillo (zonas 0 y 1 de tools/alturas.mjs, como quedan desde 1921) y solo en 1921 y 1940:
  //   - un cuerpo de fondo —de 1867, o de los que se llenaron después con uno a tres pisos— que comparte pared (3 m o
  //     más) con un edificio de cuatro pisos o más levantado en 1921 o 1940, o con un fondo que ya es de uno de esos
  //     edificios, puede irse con él. «Puede»: con una suerte que crece con la parte del frente de la manzana (las
  //     casas a la calle de 1867, por superficie) que ya es edificio de cuatro pisos o más: P_FONDO67, de 25 % en una
  //     manzana toda baja a seguro donde lo es la mitad del frente. En una manzana a medio renovar quedan fondos viejos;
  //   - si se va, casi siempre (ABSORBE) lo absorbe el edificio con el que más pared comparte: toma sus pisos, su alto
  //     y su semilla (misma azotea, mismo color). El de 1867, sobre el rectángulo más grande del lote: lo que sobra
  //     queda de patio de aire y luz. Si no —o si en el lote no entra un rectángulo— se demuele y queda patio. Un fondo
  //     que se edifica en esa misma etapa no se demuele ni se rehace: nace ya con el alto del edificio (no suma nada).
  //     El de 1867 absorbido en 1921 se rehace en 1940 si entonces le levantan al lado uno más alto;
  //   - de un cuerpo largo (más de LARGO67 m²: en las manzanas grandes del plano hay fondos de 10 × 120 m) el edificio
  //     se queda solo con el tramo que tiene pegado, hasta HONDO67 m; el resto de un fondo nuevo sigue en pie, y puede
  //     irse después con ese tramo o con otro edificio. El largo de 1867 no se puede partir: se rehace entero, como
  //     otro edificio (su semilla) y sin pasar de seis pisos;
  //   - el que no comparte pared con ninguno pero tiene a menos de CERCA67 m un edificio alto y nuevo de los que dan a
  //     la calle (en las manzanas grandes del plano, que son varias cuadras de hoy, casi todo lo edificado es fondo y
  //     las casas a la calle son pocas) se rehace con sus pisos y su alto y con semilla propia —es otro edificio—,
  //     con menos suerte (SUELTO67 de la de los otros);
  //   - los lotes muy grandes y lo que toca una obra quedan como estaban.
  // Es un supuesto: no hay dato de qué se demolió lote por lote; lo que se ve en la foto aérea de 1940 es el resultado
  // (las manzanas del centro techadas de medianera a medianera). No cuentan para el censo —son fondos— y en el ensayo
  // no se hace (todavía no se sabe qué casas se renuevan): por eso lo de 1867 demolido se anota en `pulmon`, para que
  // los frentes de avenida no lo tomen por lote libre y haya los mismos que se contaron.
  if (!ENSAYO && zona5 <= 1 && n67 >= 6) {
    const Rv = rng(b * 613 + 9001), marca = new Int32Array(Nc).fill(-1), cand = [];
    // (los candidatos: los cuerpos de fondo de 1867 que nadie tocó y los fondos nuevos de una sola etapa)
    for (let L = 0; L < n67; L++) { const lo = lots[L]; if (lo.kind !== 1 || lo.m || lo.celdas > 1800) continue; const qs = []; for (const t of lo.rects) for (let j = te67[t + 2]; j < te67[t + 4]; j++) for (let i = te67[t + 1]; i < te67[t + 3]; i++) qs.push(j * nu + i); cand.push({ L, lo, qs, cuerpo: null }); }
    for (const T of tirasHechas) if (!T.dos) cand.push({ L: -1, lo: T.cuerpo, qs: T.qs, cuerpo: null });
    cand.forEach((c, n) => { c.u = Rv(); c.u2 = Rv(); for (const q of c.qs) marca[q] = n; });
    const enPie = (q, s) => { for (const cp of [v2, v1, v0]) { const L = cp[q]; if (L < 0) continue; const lo = lots[L]; if (lo.n <= s && !(lo.m && lo.m <= s)) return lo; } return null; };
    const altoNuevo = (o) => !!o && !o.fija && o.n >= E21 && o.floors >= 4;
    // (con quién comparte pared el candidato n en la etapa s: el edificio alto y nuevo que más lo toca)
    // (`pegado`: el rectángulo de las celdas del candidato que dan a ese edificio, [i0, j0, i1, j1])
    let pegado = null;
    const vecino = (n, s) => {
      const cu = new Map(); let mejor = null;
      const toca = (i, j, i0, j0) => { if (i < 0 || j < 0 || i >= nu || j >= nv || marca[j * nu + i] === n) return; const o = enPie(j * nu + i, s); if (!altoNuevo(o)) return; let c = cu.get(o); if (!c) cu.set(o, (c = { o, k: 0, r: [i0, j0, i0 + 1, j0 + 1] })); c.k++; c.r[0] = Math.min(c.r[0], i0); c.r[1] = Math.min(c.r[1], j0); c.r[2] = Math.max(c.r[2], i0 + 1); c.r[3] = Math.max(c.r[3], j0 + 1); if (!mejor || c.k > mejor.k) mejor = c; };
      for (const q of cand[n].qs) { const i = q % nu, j = (q / nu) | 0; toca(i - 1, j, i, j); toca(i + 1, j, i, j); toca(i, j - 1, i, j); toca(i, j + 1, i, j); }
      if (!mejor || mejor.k < 3) return null;
      pegado = mejor.r; return mejor.o;
    };
    // (el que no toca a ninguno pero tiene cerca —a menos de CERCA67 metros de su centro— un edificio alto y nuevo de
    // los que dan a la calle: se rehace con sus pisos y su alto, y con semilla propia, que es otro edificio.
    // `altos`: esos edificios en la etapa s, con su centro)
    let altos = [];
    const losAltos = (s) => { const m = new Map(); for (let q = 0; q < Nc; q++) { const o = enPie(q, s); if (!altoNuevo(o) || o.fondo) continue; let c = m.get(o); if (!c) m.set(o, (c = { o, n: 0, i: 0, j: 0 })); c.n++; c.i += q % nu; c.j += (q / nu) | 0; } altos = [...m.values()]; for (const c of altos) { c.i /= c.n; c.j /= c.n; } };
    const cercano = (n) => {
      const c = cand[n]; let mejor = null, dm = CERCA67, en = 0;
      for (const q of c.qs) { const i = q % nu, j = (q / nu) | 0; for (const a of altos) { const d = Math.hypot(a.i - i, a.j - j); if (d < dm) { dm = d; mejor = a.o; en = q; } } }
      if (!mejor) return null;
      pegado = [en % nu, (en / nu) | 0, (en % nu) + 1, ((en / nu) | 0) + 1]; return { h: mejor.h, floors: mejor.floors, seed: c.lo.seed, n: mejor.n };
    };
    // (de un cuerpo largo el edificio se queda con lo que tiene pegado, hasta HONDO67 metros: ¿la celda cae en ese tramo?)
    const cerca = (i, j) => i >= pegado[0] - HONDO67 && i < pegado[2] + HONDO67 && j >= pegado[1] - HONDO67 && j < pegado[3] + HONDO67;
    const como = (F, s, mas) => ({ h: F.h, seed: F.seed, floors: F.floors, n: s, m: 0, fondo: true, ...mas });
    for (const s of [E21, E40]) {
      const alto = new Uint8Array(n67); let tot = 0, hay = 0;
      for (let q = 0; q < Nc; q++) { const L = v0[q]; if (L < 0 || lots[L].kind !== 0 || alto[L]) continue; const o = enPie(q, s); if (o && !o.fija && o.floors >= 4) alto[L] = 1; }
      for (let L = 0; L < n67; L++) if (lots[L].kind === 0) { tot += lots[L].celdas; if (alto[L]) hay += lots[L].celdas; }
      const p = tot ? Math.min(1, P_FONDO67[0] + P_FONDO67[1] * (hay / tot)) : 0, cuenta = (que) => nFondos67[que][zona5][s - E21]++;
      losAltos(s);
      for (let vuelta = 0; vuelta < VUELTAS67; vuelta++) for (let n = 0, tope = cand.length; n < tope; n++) {
        const c = cand[n], lo = c.lo;
        if (c.cuerpo) { // (el de 1867 absorbido en 1921: se rehace si en 1940 tiene al lado uno más alto, de otro edificio)
          if (s !== E40 || c.cuerpo.m || c.L < 0) continue; const G = vecino(n, s); if (!G || G.n !== E40 || G.seed === c.cuerpo.seed || G.h <= c.cuerpo.h + 10) continue;
          c.cuerpo.m = s; const L2 = lots.length, k = c.cuerpo.caja; lots.push((c.cuerpo = como(G, s, { caja: k }))); dos = true; cuenta(0);
          for (let j = k[1]; j < k[3]; j++) for (let i = k[0]; i < k[2]; i++) v2[j * nu + i] = L2;
          continue;
        }
        if (lo.m || lo.n > s || altoNuevo(lo) || c.u >= p) continue;
        let F = vecino(n, s), suelto = false; if (!F && c.u < p * SUELTO67) { F = cercano(n); suelto = true; }
        if (!F || F.h <= lo.h + 10) continue;
        cambia = true;
        if (c.L < 0) {
          // un fondo nuevo. Si es largo, se parte: el tramo pegado al edificio se va con él y el resto sigue como
          // estaba (otro cuerpo igual, que más adelante puede irse con este o con otro edificio)
          let qs = c.qs;
          if (qs.length > LARGO67) {
            const va = qs.filter((q) => cerca(q % nu, (q / nu) | 0));
            if (va.length < qs.length) { const resto = qs.filter((q) => !cerca(q % nu, (q / nu) | 0)), Lr = lots.length; lots.push({ ...lo }); for (const q of resto) { v1[q] = Lr; marca[q] = cand.length; } cand.push({ L: -1, lo: lots[Lr], qs: resto, cuerpo: null, u: Rv(), u2: Rv() }); qs = c.qs = va; }
          }
          // el de esta misma etapa nace con el alto del edificio; el de antes se rehace o se demuele
          if (lo.n === s) { lo.h = F.h; lo.seed = F.seed; lo.floors = F.floors; cuenta(suelto ? 5 : 2); }
          else { lo.m = s; if (suelto || c.u2 < ABSORBE) { const L2 = lots.length; lots.push(como(F, s)); for (const q of qs) v2[q] = L2; dos = true; cuenta(suelto ? 5 : 3); } else cuenta(4); }
          c.cuerpo = lo; continue;
        }
        const k = c.u2 < ABSORBE ? cajaDe(c.L) : null;
        // (un lote largo de 1867 no se puede partir: se rehace entero, como otro edificio y sin pasar de seis pisos)
        const E = lo.celdas > LARGO67 ? { ...F, seed: lo.seed, floors: Math.min(6, F.floors), h: F.floors > 6 ? Math.round((F.h * 6) / F.floors) : F.h } : F;
        lo.m = s; cuenta(!k ? 1 : suelto ? 5 : 0);
        if (k) { const L1 = lots.length; lots.push((c.cuerpo = como(E, s, { caja: k }))); for (let j = k[1]; j < k[3]; j++) for (let i = k[0]; i < k[2]; i++) v1[j * nu + i] = L1; }
        else for (const q of c.qs) pulmon[kDe(q % nu, (q / nu) | 0)] = 1;
      }
    }
  }
  const vi = ENSAYO ? vivoS : vivo, mu = ENSAYO ? muertoS : muerto;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const q = j * nu + i, L = v0[q]; if (L < 0) continue; const k = kDe(i, j); lote67[k] = 1; const u = v2[q] >= 0 ? v2[q] : v1[q]; if (!lots[L].m || (u >= 0 && !lots[u].m)) vi[k] = 1; }
  for (let t = 0; t < misFondos.length; t += 2) { const k = misFondos[t]; vi[k] = 1; if (!ENSAYO) { const x = k % w, y = (k / w) | 0, q = Math.min(TH - 1, Math.floor((y * 2 / PLANO.alto) * TH)) * TW + Math.min(TW - 1, Math.floor((x * 2 / PLANO.ancho) * TW)), c = CODIGO[misFondos[t + 1] - 1]; if (c > lamB[q]) lamB[q] = c; } }
  if (!cambia) continue;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const q = j * nu + i, L = v0[q], u = L < 0 ? -1 : v2[q] >= 0 ? v2[q] : v1[q], mm = L < 0 ? 0 : u >= 0 ? lots[u].m : lots[L].m; if (mm) { const k = kDe(i, j); if (!mu[k] || mm < mu[k]) mu[k] = mm; } }
  if (ENSAYO) continue;
  // lo que se va, anotado registro por registro
  for (let L = 0; L < n67; L++) if (lots[L].m) for (const t of lots[L].rects) muereT.set(t / 8, lots[L].m);
  for (const t of murosDe[b]) {
    const f = mu67[t + 1], dir = f & 3, c = mu67[t + 2], a = mu67[t + 3], i = dir === 0 || dir === 2 ? a : dir === 1 ? c - 1 : c, j = dir === 0 ? c : dir === 2 ? c - 1 : a, L = i >= 0 && j >= 0 && i < nu && j < nv ? v0[j * nu + i] : -1;
    if (L >= 0 && lots[L].m) muereM.set(t / 8, lots[L].m);
  }
  const id = manzanas.length; if (id > 65535) throw new Error('demasiadas manzanas para 16 bits');
  const sil = siluetas(nu, nv, lots, dos ? [v0, v1, v2] : [v0, v1], (i, j, lo) => { if (i < 0 || j < 0 || i >= nu || j >= nv) return 0; const k = kDe(i, j); return (banda[k] && banda[k] <= lo.n) || !patio67[k] ? 0 : 1; }, b + 500000);
  techar(id, nu, nv, lots, sil.capas[1]); if (dos) techar(id, nu, nv, lots, sil.capas[2]);
  murar(id, nu, nv, lots, sil.capas, sil.vacio);
  manzanas.push({ Q, nu, nv });
}
}

// --------------------------------------------------------------------------------------- los frentes de las avenidas
// Sobre cada línea nueva, una franja con su propia grilla (a lo largo de la avenida y hacia adentro): se edifica lo
// que quedó libre entre la línea y lo que sigue en pie. En las diagonales eso da los frentes en sesgo, todos a la
// misma altura (la Diagonal Norte se hizo con cornisa pareja a 33 m).
function frentes() {
const oc = ENSAYO ? ocupa.slice() : ocupa, vi = ENSAYO ? vivoS : vivo, mu = ENSAYO ? muertoS : muerto;
for (const F of FRENTES_DE) {
  // (el cuadrilátero tiene que girar para el mismo lado que las manzanas: si no, los techos quedan mirando para abajo
  // y no se ven. El de la vereda de enfrente viene espejado: se le da vuelta el sentido del frente.)
  const { e, fondo, pisos, alto } = F, Q = (F.Q[1][0] - F.Q[0][0]) * (F.Q[3][1] - F.Q[0][1]) - (F.Q[1][1] - F.Q[0][1]) * (F.Q[3][0] - F.Q[0][0]) < 0 ? [F.Q[1], F.Q[0], F.Q[3], F.Q[2]] : F.Q;
  const nu = Math.max(2, Math.round(dAl(Q[0], Q[1]) * MPP)), nv = Math.max(2, Math.round(dAl(Q[0], Q[3]) * MPP)), Nc = nu * nv;
  const R = rng(Math.round(Q[0][0] * 13 + Q[0][1] * 7 + e)), kk = new Int32Array(Nc), tipo = new Uint8Array(Nc); // 0 libre (un fondo, o donde se tiró una casa) · 1 calle · 2 otro edificio
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const s = (i + 0.5) / nu, t = (j + 0.5) / nv, x = (1 - s) * (1 - t) * Q[0][0] + s * (1 - t) * Q[1][0] + s * t * Q[2][0] + (1 - s) * t * Q[3][0], y = (1 - s) * (1 - t) * Q[0][1] + s * (1 - t) * Q[1][1] + s * t * Q[2][1] + (1 - s) * t * Q[3][1];
    const k = Math.min(h - 1, Math.max(0, Math.floor(y))) * w + Math.min(w - 1, Math.max(0, Math.floor(x))), q = j * nu + i; kk[q] = k;
    tipo[q] = banda[k] || calle[k] || via[k] || agua[k] || (!F.libre && (!dentro[k] || !(lote67[k] || patio67[k] || mu[k]))) ? 1 : // (ni en las plazas: solo donde había casa o fondo)
      oc[k] || vi[k] || pulmon[k] || (mu[k] > e) || ((cls[k] === EDIF || cls[k] === MACIZO) && !lote67[k]) ? 2 : 0;
  }
  // cuánto fondo libre hay en cada columna, desde la línea (con dos celdas de gracia)
  const D = new Int16Array(nu), E0 = new Int16Array(nu);
  for (let i = 0; i < nu; i++) { let j0 = 0; while (j0 < 3 && tipo[j0 * nu + i] !== 0) j0++; if (j0 >= 3) continue; let j = j0; while (j < Math.min(nv, j0 + fondo) && tipo[j * nu + i] === 0) j++; E0[i] = j0; D[i] = j - j0; }
  const own = new Int32Array(Nc).fill(-1), lots = [];
  // Cada edificio es un rectángulo limpio sobre la línea: un frente derecho y un fondo parejo. Donde el fondo libre
  // cambia de una columna a otra (la manzana vieja está girada respecto de la avenida y el borde queda en diente de
  // sierra), se elige el ancho que más superficie da y lo que sobra queda de patio: así el contrafrente sale escalonado
  // de a un edificio, y no de a un metro.
  let a = 0;
  while (a < nu) {
    if (D[a] < 8) { a++; continue; }
    const tope = Math.min(nu, a + 10 + Math.floor(R() * 11));
    let j0 = 0, j1 = 1e9, mejor = null;
    for (let i = a; i < tope && D[i] >= 8; i++) {
      j0 = Math.max(j0, E0[i]); j1 = Math.min(j1, E0[i] + D[i]);
      const an = i - a + 1, d = j1 - j0; if (d < 8) break;
      if (an >= 7 && (!mejor || an * d > mejor.an * mejor.d * 1.08)) mejor = { an, d, j0 };
    }
    if (!mejor) { a++; continue; }
    const floors = pisos[0] + Math.floor(R() * (pisos[1] - pisos[0] + 1)), hh = alto ? alto + R() * 0.6 : floors * (3.4 + R() * 0.5) + 1.4 + R() * 1.2;
    const L = lots.length; lots.push({ h: Math.round(hh * 10), seed: 1 + Math.floor(R() * 65000), floors, n: e, m: 0, celdas: mejor.an * mejor.d, en: [(a + mejor.an / 2) / nu, (mejor.j0 + mejor.d / 2) / nv] });
    for (let i = a; i < a + mejor.an; i++) for (let j = mejor.j0; j < mejor.j0 + mejor.d; j++) own[j * nu + i] = L;
    a += mejor.an;
  }
  for (let q = 0; q < Nc; q++) if (own[q] >= 0 && lots[own[q]].celdas < 70) own[q] = -1;
  if (!lots.some((lo) => lo.celdas >= 70)) continue;
  if (ENSAYO) {
    // (al censo, como están: los frentes de las avenidas no se renuevan)
    for (const lo of lots) {
      if (lo.celdas < 70) continue;
      const [s, t] = lo.en, n = ((1 - s) * (1 - t) * Q[0][0] + s * (1 - t) * Q[1][0] + s * t * Q[2][0] + (1 - s) * t * Q[3][0] - centro[0]) * MPP, r = ((1 - s) * (1 - t) * Q[0][1] + s * (1 - t) * Q[1][1] + s * t * Q[2][1] + (1 - s) * t * Q[3][1] - centro[1]) * MPP;
      censo.push({ clave: null, z: zonaDe(n, r, 0), z5: zonaDe(n, r, E_SANTA_FE), n, r, sem: lo.seed, nace: e, muere: 0, clase: claseDe(lo.floors), fijo: true });
    }
    for (let q = 0; q < Nc; q++) if (own[q] >= 0) { oc[kk[q]] = 1; mu[kk[q]] = 0; }
    continue;
  }
  const id = manzanas.length; if (id > 65535) throw new Error('demasiadas manzanas para 16 bits');
  techar(id, nu, nv, lots, own);
  murar(id, nu, nv, lots, [own], (i, j) => (j < 0 || i < 0 || i >= nu ? 0 : j >= nv ? 1 : tipo[j * nu + i] === 1 ? 0 : tipo[j * nu + i] === 2 ? 2 : 1));
  manzanas.push({ Q, nu, nv });
  for (const lo of lots) if (lo.celdas >= 70) cuenta[e - 1]++;
  for (let q = 0; q < Nc; q++) if (own[q] >= 0) {
    const k = kk[q], x = k % w, y = (k / w) | 0, t = Math.min(TH - 1, Math.floor((y * 2 / PLANO.alto) * TH)) * TW + Math.min(TW - 1, Math.floor((x * 2 / PLANO.ancho) * TW));
    ocupa[k] = 1; if (!(F.tarde && muerto[k] < e)) muerto[k] = 0; // (el frente de una obra tardía no borra lo que ya se había despejado antes)
    if (CODIGO[e - 1] > lamB[t]) lamB[t] = CODIGO[e - 1];
    if (debug) { const col = [[225, 70, 50], [240, 150, 40], [235, 215, 60], [70, 185, 90], [60, 130, 235], [185, 90, 215]][e - 1]; debug[k * 3] = col[0]; debug[k * 3 + 1] = col[1]; debug[k * 3 + 2] = col[2]; }
  }
}
}
// El ensayo, el reparto y la pasada de verdad
ENSAYO = true; nuevas(); viejas(); frentes(); ENSAYO = false;
{
  const informe = repartir(censo);
  for (const l of censo) if (l.clave !== null) planDe.set(l.clave, l.plan);
  lap(`los pisos, zona por zona y etapa por etapa (% de casas de 1, 2, 3, 4 y 5 o más; ${censo.length} casas):\n${cuadro(informe)}`);
}
nuevas();
for (let i = 0; i < SE_VAN.length; i += 2) if (!muerto[SE_VAN[i]] || SE_VAN[i + 1] < muerto[SE_VAN[i]]) muerto[SE_VAN[i]] = SE_VAN[i + 1]; // (las casas inventadas que se van con una obra tardía)
lap(`${manzanas.length} manzanas con casas nuevas (de ${nCuatro} de cuatro lados y ${nRaras} irregulares): ${AÑOS.map((a, i) => `${a.año}: ${cuenta[i]}`).join(' · ')} · techos ${techos.length / 8}, muros ${muros.length / 8}`);
viejas();
lap(`en la city: ${JSON.stringify(enCity)}`);
lap(`fondos de manzana edificados: ${AÑOS.map((a, i) => `${a.año}: ${nFondos[i]}`).join(' · ')} · con el alto del edificio de adelante: ${nFondosAltos}`);
lap(`fondos que se van con el frente (1921 · 1940): ${['de 1867 absorbidos', 'de 1867 demolidos', 'nuevos que nacen altos', 'nuevos rehechos', 'nuevos demolidos', 'rehechos sin compartir pared'].map((t, i) => `${t}, centro ${nFondos67[i][0].join(' · ')}, anillo ${nFondos67[i][1].join(' · ')}`).join('; ')}`);
lap(`lo de 1867: ${nSeVan} casas en la traza de alguna obra; casas renovadas (las de 1867 y las que vinieron después), ${AÑOS.map((a, i) => `${a.año}: ${nRenovadas[i]}`).join(' · ')}`);
frentes();
lap(`frentes de avenida: ${FRENTES_DE.length} líneas · en total, techos ${techos.length / 8}, muros ${muros.length / 8}, manzanas ${manzanas.length}`);

// --------------------------------------------------------------------------------------- la lámina del «desde cuándo»
// R: lo urbanizado (las manzanas nuevas y sus calles: lo edificado y los fondos, engordados unos 25 m) y la tierra
// ganada al río. Donde el plano de 1867 ya trae manzana (patio o edificio) no se toca.
const maximo = (m, r) => { // el máximo en un cuadrado de lado 2r + 1 (primero por filas, después por columnas)
  const a = new Uint8Array(TW * TH), b = new Uint8Array(TW * TH);
  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) { let v = 0; for (let t = Math.max(0, x - r); t <= Math.min(TW - 1, x + r); t++) { const u = m[y * TW + t]; if (u > v) v = u; } a[y * TW + x] = v; }
  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) { let v = 0; for (let t = Math.max(0, y - r); t <= Math.min(TH - 1, y + r); t++) { const u = a[t * TW + x]; if (u > v) v = u; } b[y * TW + x] = v; }
  return b;
};
const s67 = await sharp('public/plano/suelo.webp').resize(TW, TH, { fit: 'fill' }).raw().toBuffer();
const lamR = new Uint8Array(TW * TH);
{ const j = new Uint8Array(TW * TH); for (let q = 0; q < TW * TH; q++) j[q] = Math.max(lamG[q], lamB[q]); const u = maximo(j, 8); for (let q = 0; q < TW * TH; q++) lamR[q] = s67[q * 3] > 100 || s67[q * 3 + 1] > 127 || s67[q * 3 + 2] > 127 ? 0 : u[q]; }
// (adentro de los parques de Palermo no hay nada urbanizado: sigue el pasto del plano de 1867)
const enPal = (q) => zonaPal[Math.min(h - 1, Math.floor((((q / TW) | 0) + 0.5) / TH * PLANO.alto / 2)) * w + Math.min(w - 1, Math.floor(((q % TW) + 0.5) / TW * PLANO.ancho / 2))] > 0;
for (let q = 0; q < TW * TH; q++) if (lamR[q] && enPal(q)) { lamR[q] = 0; lamG[q] = 0; lamB[q] = 0; }

// La tierra ganada al río: el puerto (hecho entre 1887 y 1897: en el plano de 1888 todavía es «futuro puerto», en el
// de 1895 ya está) y el relleno del Retiro. La costa nueva está calcada a mano sobre el plano de 1905 (su color no
// alcanza para separar el río de la tierra); los diques y las dársenas son los de hoy, que son los mismos.
const COSTA05 = [[1662, 600], [1662, 2036], [1703, 2279], [1727, 2344], [1727, 2536], [2676, 2349], [2880, 2350], [2968, 2330], [2968, 2271], [2912, 2125], [3017, 1979], [3187, 1744], [3447, 1444], [3755, 1249], [3929, 1078], [3929, 600]]; // en píxeles de la lámina
const diques = [];
// El Puerto Nuevo: sus dársenas son las de hoy (A a E; la F es posterior), con el contorno del mapa actual. El plano
// de Peuser las dibuja corridas y deformadas, así que en esa zona el suelo no se calca: la tierra es lo que queda entre
// la costa vieja y el frente de los muelles (FRENTE_PN, leído del mismo mapa), menos las dársenas.
// Qué estaba hecho en cada etapa (de la carta de los planos oficiales de 1919–1920, fuentes/planos/1925-puerto.jpg):
// en 1921 estaban dragadas A, B y C y a medio dragar la D, con los espigones 1 a 3 terminados y el 4 y el 5 en relleno
// crudo; la E era todavía río. En 1940, las cinco dársenas y los seis espigones.
const darsenasPN = [];
for (const e of lee('lagos')) {
  const m = /^Dársena ([A-E])$/.exec(e.tags?.name ?? ''); if (!m) continue;
  const pts = []; for (const mm of e.members ?? []) if (mm.role === 'outer') for (const g of mm.geometry ?? []) pts.push(aPlano(g.lat, g.lon));
  if (pts.length >= 3) darsenasPN.push({ nombre: e.tags.name, H: hull(pts), e: m[1] === 'E' ? E40 : E21, hecho: 'ABC'.includes(m[1]) ? E21 : E40 });
}
for (const e of lee('lagos')) {
  if (!/^(Dique \d|Dársena Norte|Dársena Sur)$/.test(e.tags?.name ?? '')) continue;
  const pts = []; for (const m of e.members ?? []) if (m.role === 'outer') for (const g of m.geometry ?? []) pts.push(aPlano(g.lat, g.lon));
  // el contorno de verdad: los tramos de afuera, cosidos por las puntas (con la envolvente los pasos entre dique y
  // dique quedaban en embudo). Si no cierra, vale la envolvente.
  let anillo = null;
  { const tramos = (e.members ?? []).filter((m) => m.role === 'outer' && m.geometry?.length > 1).map((m) => m.geometry.map((g) => aPlano(g.lat, g.lon))), cerca = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 3;
    if (tramos.length) { const R = tramos.shift().slice(); let anda = true;
      while (tramos.length && anda) { anda = false; for (let i = 0; i < tramos.length; i++) { const t = tramos[i], fin = R[R.length - 1]; if (cerca(t[0], fin)) { R.push(...t.slice(1)); } else if (cerca(t[t.length - 1], fin)) { R.push(...t.slice(0, -1).reverse()); } else continue; tramos.splice(i, 1); anda = true; break; } }
      if (!tramos.length && R.length > 3 && cerca(R[0], R[R.length - 1])) anillo = R.slice(0, -1); } }
  if (pts.length >= 3) diques.push({ nombre: e.tags.name, H: anillo ?? hull(pts), cosido: !!anillo });
}
{
  const kx = TW / PLANO.ancho, ky = TH / PLANO.alto; let ganado = 0;
  const D = diques.map((d) => d.H.map(([x, y]) => [x * kx, y * ky]));
  // (con el borde suavizado —16 muestras por punto—: si no, los diques salen en serrucho)
  const x0 = Math.floor(Math.min(...COSTA05.map((p) => p[0]))), x1 = Math.ceil(Math.max(...COSTA05.map((p) => p[0]))), y0 = Math.floor(Math.min(...COSTA05.map((p) => p[1]))), y1 = Math.min(TH - 1, Math.ceil(Math.max(...COSTA05.map((p) => p[1]))));
  const cajas = D.map((H) => [Math.min(...H.map((p) => p[0])) - 1, Math.min(...H.map((p) => p[1])) - 1, Math.max(...H.map((p) => p[0])) + 1, Math.max(...H.map((p) => p[1])) + 1]);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const q = y * TW + x; if (s67[q * 3] < 100) continue;
    const cerca = D.filter((H, i) => x >= cajas[i][0] - 1 && x <= cajas[i][2] + 1 && y >= cajas[i][1] - 1 && y <= cajas[i][3] + 1); let n = 0;
    for (let b = 0; b < 4; b++) for (let a = 0; a < 4; a++) { const px = x + (a + 0.5) / 4, py = y + (b + 0.5) / 4; if (inPoly(COSTA05, px, py) && !cerca.some((H) => inPoly(H, px, py))) n++; }
    if (n) { lamR[q] = Math.max(lamR[q], Math.round((CODIGO[E95 - 1] * n) / 16)); ganado += n / 16; }
  }
  // El bajo: la franja que en 1867 ya era tierra entre la última fila de manzanas y la orilla —la alameda del Paseo
  // Colón y del Paseo de Julio, la playa—. Con el puerto queda tierra adentro y se urbaniza con él: desde 1895 es suelo
  // de ciudad (se va la arboleda que dibuja el plano y entran las calles de hoy: Paseo Colón, Alem, Azopardo). El
  // contorno está trazado a mano, en píxeles del plano, por el borde de las manzanas de 1867; del lado del río sobra,
  // porque ahí solo cuenta lo que en 1867 era tierra sin edificar. (La manzana de la Aduana Nueva entra entera.)
  {
    const BAJO = [[7900, 9930], [8120, 9930], [8120, 9830], [8310, 9830], [8320, 9935], [8400, 9925], [8500, 9900], [8600, 9880], [8700, 9840], [8800, 9820], [8900, 9790], [8900, 9770], [9090, 9770], [9100, 9840], [9260, 9850], [9500, 9855], [9770, 9850], [9900, 9870], [10230, 9880], [10230, 9905], [10440, 9905], [10470, 9850], [11110, 9850], [11120, 9885], [11640, 9885], [11650, 9855], [11820, 9850], [11830, 9795], [11990, 9745], [12030, 9750], [12200, 9700], [12215, 9690], [12420, 9600], [12480, 9600], [12480, 10300], [7900, 10300]].map(([x, y]) => [x * kx, y * ky]);
    const ADUANA = [10337 * kx, 9937 * ky, (61 / PLANO.metro + 6) * kx]; let n = 0;
    const bx0 = Math.floor(Math.min(...BAJO.map((p) => p[0]))), bx1 = Math.ceil(Math.max(...BAJO.map((p) => p[0]))), by0 = Math.floor(Math.min(...BAJO.map((p) => p[1]))), by1 = Math.min(TH - 1, Math.ceil(Math.max(...BAJO.map((p) => p[1]))));
    for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) {
      const q = y * TW + x; if (lamR[q] || s67[q * 3] > 100 || !inPoly(BAJO, x + 0.5, y + 0.5)) continue;
      if ((s67[q * 3 + 1] > 127 || s67[q * 3 + 2] > 127) && Math.hypot(x + 0.5 - ADUANA[0], y + 0.5 - ADUANA[1]) > ADUANA[2]) continue;
      lamR[q] = CODIGO[E95 - 1]; n++;
    }
    lap(`el bajo, urbanizado con el puerto: ${(n * (PLANO.ancho * PLANO.metro / TW) ** 2 / 1e4).toFixed(1)} ha`);
  }
  lap(`tierra ganada al río: ${(ganado * (PLANO.ancho * PLANO.metro / TW) ** 2 / 1e6).toFixed(2)} km², ${diques.length} diques y dársenas (${diques.filter((d) => d.cosido).length} con su contorno)`);
}
// El Puerto Nuevo (empezado en 1911, la primera parte habilitada en 1919, terminado en 1928), el relleno de Retiro
// para las estaciones y los parques de la Costanera. La costa de 1940 sale del plano de Peuser, que pinta el río de
// celeste liso: dentro de una zona marcada a mano (ZONA40, que deja afuera los rótulos), lo que en 1867 era río, no
// es celeste y está unido a tierra firme. Para 1921 vale lo mismo, hasta donde llegaba el relleno en el plano de
// Cannizzaro (ZONA21). Lo verde del plano (los parques) va a la otra lámina.
const lamV = new Uint8Array(TW * TH); // el verde de las plazas y los parques: desde cuándo
{
  const d2t = (P) => P.map(([x, y]) => [2500 + x * 1.0497, 600 + y * 1.0497]); // (los puntos están leídos sobre un recorte de la lámina)
  const ZONA40 = d2t([[1362, 300], [1362, 610], [1310, 655], [1215, 750], [1115, 860], [1045, 960], [1000, 1060], [975, 1120], [955, 1150], [950, 1215], [925, 1240], [925, 1340], [915, 1410], [950, 1440], [760, 1700], [590, 1870], [200, 1875], [200, 1400], [500, 1000], [900, 500]]);
  const ZONA21 = d2t([[1362, 250], [1362, 375], [1200, 530], [1050, 700], [900, 870], [800, 985], [735, 1060], [790, 1200], [800, 1290], [805, 1500], [800, 1560], [660, 1700], [540, 1760], [360, 1790], [350, 1640], [210, 1650], [200, 1500], [300, 1400], [500, 1000], [900, 500]]);
  const { data: P } = await sharp(`fuentes/planos/epoca-${AÑOS[E40 - 1].año}.webp`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const seco = Buffer.alloc(TW * TH), pasto = Buffer.alloc(TW * TH);
  for (let q = 0; q < TW * TH && q * 4 < P.length; q++) { const r = P[q * 4], g = P[q * 4 + 1], b = P[q * 4 + 2]; if (P[q * 4 + 3] < 128) continue; seco[q] = b > r + 12 && b > g - 14 ? 0 : 255; pasto[q] = r - g < 7 && g - b > 48 && g > 120 ? 255 : 0; }
  const liso = async (m, s) => sharp(m, { raw: { width: TW, height: TH, channels: 1 } }).blur(s).extractChannel(0).raw().toBuffer();
  const S = await liso(seco, 1.6), V = await liso(pasto, 1.2);
  const caja = (Z) => [Math.floor(Math.min(...Z.map((p) => p[0]))), Math.floor(Math.min(...Z.map((p) => p[1]))), Math.ceil(Math.max(...Z.map((p) => p[0]))), Math.min(TH - 1, Math.ceil(Math.max(...Z.map((p) => p[1]))))];
  const [x0, y0, x1, y1] = caja(ZONA40), an = x1 - x0 + 1, al = y1 - y0 + 1, est = new Uint8Array(an * al); // 0 nada · 1 tierra de antes · 2 candidato · 3 tierra nueva
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const q = y * TW + x, viejo = s67[q * 3] < 100 || lamR[q] > 0; est[(y - y0) * an + x - x0] = viejo ? 1 : inPoly(ZONA40, x + 0.5, y + 0.5) && S[q] > 128 ? 2 : 0; }
  const cola = []; for (let k = 0; k < an * al; k++) if (est[k] === 1) cola.push(k);
  for (let hd = 0; hd < cola.length; hd++) { const k = cola[hd], x = k % an, y = (k / an) | 0; for (const n of [x > 0 ? k - 1 : -1, x < an - 1 ? k + 1 : -1, y > 0 ? k - an : -1, y < al - 1 ? k + an : -1]) if (n >= 0 && est[n] === 2) { est[n] = 3; cola.push(n); } }
  let g21 = 0, g40 = 0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (est[(y - y0) * an + x - x0] !== 3) continue;
    const q = y * TW + x, e = inPoly(ZONA21, x + 0.5, y + 0.5) ? E21 : E40; lamR[q] = Math.max(lamR[q], CODIGO[e - 1]); if (e === E21) g21++; else g40++;
    if (V[q] > 128) lamV[q] = Math.max(lamV[q], CODIGO[e - 1]);
  }
  // el Puerto Nuevo, con sus contornos (lo calcado ahí se descarta)
  {
    const kx = TW / PLANO.ancho, ky = TH / PLANO.alto, enL = (P) => P.map(([x, y]) => [x * kx, y * ky]);
    const Z = enL(ZONA_PN), Z2 = enL(ANTEPUERTO), T = enL(TIERRA_PN), D = [...darsenasPN.map((d) => enL(d.H)), enL(LAGUNA_PN)], [zx0, zy0, zx1, zy1] = caja([...Z, ...Z2]), x21 = PN_1921 * kx;
    for (let y = Math.max(0, zy0); y <= zy1; y++) for (let x = Math.max(0, zx0); x <= Math.min(TW - 1, zx1); x++) {
      if (!inPoly(Z, x + 0.5, y + 0.5) && !inPoly(Z2, x + 0.5, y + 0.5)) continue;
      const q = y * TW + x; if (s67[q * 3] < 100) continue;
      if (lamR[q] > 0 && lamR[q] <= CODIGO[E21 - 1] && x >= x0 && x <= x1 && y >= y0 && y <= y1 && est[(y - y0) * an + x - x0] === 3) { if (lamR[q] === CODIGO[E21 - 1]) g21--; else g40--; lamR[q] = 0; lamV[q] = 0; }
      let n = 0; for (let b = 0; b < 4; b++) for (let a = 0; a < 4; a++) { const px = x + (a + 0.5) / 4, py = y + (b + 0.5) / 4; if (inPoly(T, px, py) && !D.some((H) => inPoly(H, px, py))) n++; }
      if (!n) continue;
      const e = x + 0.5 < x21 ? E21 : E40; lamR[q] = Math.max(lamR[q], Math.round((CODIGO[e - 1] * n) / 16)); if (e === E21) g21 += n / 16; else g40 += n / 16;
    }
  }
  // La Costanera Norte (src/playas-retiro.js). La orilla: el calco de arriba la deja en serrucho —la zona esquiva los
  // rótulos del plano—, así que se rellena hasta el borde de la rambla, trazado a mano, y se saca lo que quedó más
  // allá. Y los parques: en toda la
  // tierra ganada de las playas se borra el verde que salió del calco (manchas sin forma, y algunas ya en 1921, cuando
  // ahí no había más que relleno) y se vuelve a leer del plano de Peuser con otra cuenta, solo adentro de los contornos
  // de los parques: verde es lo que tiene poco rojo y poco azul (el amarillo de las avenidas y los senderos tiene más
  // rojo; el río, más azul), sin contar la tinta negra del punteado de los árboles y de las líneas. Quedan los
  // canteros con la forma del plano, y entre ellos los senderos. Todo desde 1940.
  {
    const kx = TW / PLANO.ancho, ky = TH / PLANO.alto, enL = (Q) => Q.map(([x, y]) => [x * kx, y * ky]);
    const T = enL(TIERRA_NORTE), [tx0, ty0, tx1, ty1] = caja(T); let orilla = 0;
    for (let y = Math.max(0, ty0); y <= ty1; y++) for (let x = Math.max(0, tx0); x <= Math.min(TW - 1, tx1); x++) { const q = y * TW + x; if (lamR[q] || s67[q * 3] < 100 || !inPoly(T, x + 0.5, y + 0.5)) continue; lamR[q] = CODIGO[E40 - 1]; orilla++; g40++; }
    const RN = enL(RIO_NORTE), [rx0, ry0, rx1, ry1] = caja(RN); let sacado = 0;
    for (let y = Math.max(0, ry0); y <= ry1; y++) for (let x = Math.max(0, rx0); x <= Math.min(TW - 1, rx1); x++) { const q = y * TW + x; if (!lamR[q] || s67[q * 3] < 100 || !inPoly(RN, x + 0.5, y + 0.5)) continue; lamR[q] = 0; lamV[q] = 0; sacado++; g40--; }
    const tinta = Buffer.alloc(TW * TH), verdeP = Buffer.alloc(TW * TH);
    for (let q = 0; q < TW * TH && q * 4 < P.length; q++) { const r = P[q * 4], g = P[q * 4 + 1], b = P[q * 4 + 2]; if (P[q * 4 + 3] < 128) continue; const negro = r + g + b <= 400; tinta[q] = negro ? 0 : 255; verdeP[q] = !negro && r < 206 && b < 160 && g - b > 35 ? 255 : 0; }
    const Vn = await liso(verdeP, 1.2), Cn = await liso(tinta, 1.2);
    const Z = enL(ZONA_PLAYAS), PQ = PARQUES_NORTE.map(enL), [zx0, zy0, zx1, zy1] = caja(Z), za = Math.min(TW - 1, zx1) - Math.max(0, zx0) + 1, zb = zy1 - Math.max(0, zy0) + 1, ox = Math.max(0, zx0), oy = Math.max(0, zy0);
    let m = new Uint8Array(za * zb), borrado = 0, puesto = 0;
    for (let y = 0; y < zb; y++) for (let x = 0; x < za; x++) {
      const q = (y + oy) * TW + x + ox; if (s67[q * 3] < 100 || !inPoly(Z, x + ox + 0.5, y + oy + 0.5)) continue;
      if (lamV[q]) { lamV[q] = 0; borrado++; }
      const k = Math.min(h - 1, Math.floor(((y + oy + 0.5) / ky) / 2)) * w + Math.min(w - 1, Math.floor(((x + ox + 0.5) / kx) / 2));
      if (lamR[q] > 0 && !avMano[k] && Cn[q] > 50 && Vn[q] > 0.56 * Cn[q] && PQ.some((H) => inPoly(H, x + ox + 0.5, y + oy + 0.5))) m[y * za + x] = 1;
    }
    // (se van las motas sueltas y se tapan los agujeritos: dos pasadas de mayoría entre los ocho vecinos)
    for (let p = 0; p < 2; p++) { const o = new Uint8Array(za * zb); for (let y = 1; y < zb - 1; y++) for (let x = 1; x < za - 1; x++) { const i = y * za + x, n = m[i - 1] + m[i + 1] + m[i - za] + m[i + za] + m[i - za - 1] + m[i - za + 1] + m[i + za - 1] + m[i + za + 1]; o[i] = m[i] ? (n >= 3 ? 1 : 0) : (n >= 6 ? 1 : 0); } m = o; }
    // (y se cierran las rajas de menos de unos 20 m —el punteado y los rótulos del plano—: se engorda tres celdas y se
    // vuelve a afinar, sin salir de los contornos de los parques ni pisar las avenidas)
    { const paso = (de, pone) => { const o = new Uint8Array(za * zb); for (let y = 1; y < zb - 1; y++) for (let x = 1; x < za - 1; x++) { const i = y * za + x; let n = 0; for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) n += de[i + b * za + a]; o[i] = pone ? (n > 0 ? 1 : 0) : (n === 9 ? 1 : 0); } return o; };
      let d = m; for (let p = 0; p < 3; p++) d = paso(d, true); for (let p = 0; p < 3; p++) d = paso(d, false);
      for (let y = 0; y < zb; y++) for (let x = 0; x < za; x++) { const i = y * za + x; if (m[i] || !d[i]) continue; const q = (y + oy) * TW + x + ox, k = Math.min(h - 1, Math.floor(((y + oy + 0.5) / ky) / 2)) * w + Math.min(w - 1, Math.floor(((x + ox + 0.5) / kx) / 2)); if (lamR[q] > 0 && !avMano[k] && PQ.some((H) => inPoly(H, x + ox + 0.5, y + oy + 0.5))) m[i] = 1; } }
    for (let y = 0; y < zb; y++) for (let x = 0; x < za; x++) { if (!m[y * za + x]) continue; const q = (y + oy) * TW + x + ox; if (lamR[q] > 0) { lamV[q] = CODIGO[E40 - 1]; puesto++; } }
    const ha = (n) => ((n * (PLANO.ancho * PLANO.metro / TW) ** 2) / 1e4).toFixed(1);
    lap(`la Costanera Norte: ${ha(orilla)} ha más de tierra hasta la rambla y ${ha(sacado)} ha menos más allá; parques, ${ha(puesto)} ha (se borraron ${ha(borrado)} ha del calco)`);
  }
  const km2 = (n) => (n * (PLANO.ancho * PLANO.metro / TW) ** 2 / 1e6).toFixed(2);
  lap(`el Puerto Nuevo, Retiro y la Costanera: ${km2(g21)} km² para ${AÑOS[E21 - 1].año} y ${km2(g40)} km² más para ${AÑOS[E40 - 1].año}`);
  if (ver) { const o = Buffer.alloc(an * al * 3); for (let k = 0; k < an * al; k++) { const q = (y0 + ((k / an) | 0)) * TW + x0 + (k % an), c = est[k] === 3 ? (lamR[q] === CODIGO[E21 - 1] ? [60, 130, 235] : [185, 90, 215]) : est[k] === 1 ? [200, 190, 170] : [120, 160, 190]; for (let t = 0; t < 3; t++) o[k * 3 + t] = c[t] * 0.55 + P[q * 4 + t] * 0.45; if (lamV[q]) o[k * 3 + 1] = Math.min(255, o[k * 3 + 1] + 60); } await sharp(o, { raw: { width: an, height: al, channels: 3 } }).jpeg({ quality: 84 }).toFile('tmp/crece-costa.jpg'); }
}
// El arroyo Maldonado (su cauce, en tools/plano.mjs): corrió a cielo abierto hasta que lo entubaron, en los
// años treinta, y encima quedó la avenida Juan B. Justo (inaugurada el 9 de julio de 1937). En la lámina su cauce es «tierra ganada» de 1940: de
// 1867 a 1921 es agua y en 1940 deja de serlo.
{
  const kx = TW / PLANO.ancho, ky = TH / PLANO.alto;
  // (y los otros arroyos que dejan de correr a la vista —ARROYOS, con `hasta`—, lo mismo, cada uno en su etapa)
  for (const [nombre, tramos, EA] of [['el arroyo Maldonado', MALDONADO, E40], ...ARROYOS.filter((a) => a.hasta).map((a) => [`el ${a.nombre.toLowerCase()}`, a.tramos, etapaDe(a.hasta)])]) {
  let n = 0;
  for (const { ancho, eje } of tramos) {
    const r = (ancho / 2) * kx + 1.5; // (con un punto de margen: que no quede un hilo de agua en la orilla)
    for (let i = 0; i + 1 < eje.length; i++) {
      const ax = eje[i][0] * kx, ay = eje[i][1] * ky, bx = eje[i + 1][0] * kx, by = eje[i + 1][1] * ky, m = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) * 2));
      for (let k = 0; k <= m; k++) {
        const cx = ax + ((bx - ax) * k) / m, cy = ay + ((by - ay) * k) / m;
        for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(TH - 1, Math.ceil(cy + r)); y++) for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(TW - 1, Math.ceil(cx + r)); x++) {
          const q = y * TW + x; if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r && s67[q * 3] > 20 && lamR[q] < CODIGO[EA - 1]) { lamR[q] = CODIGO[EA - 1]; n++; }
        }
      }
    }
  }
  lap(`${nombre}, entubado para ${AÑOS[EA - 1].año}: ${n} puntos de la lámina`);
  }
}
// Los depósitos del puerto (los «docks», de 1900 a 1905) ya no salen de acá: los modela src/lugares/puerto.js, con
// sus grúas. (Queda la cuenta de dónde iban, apagada.)
for (const d of diques) {
  if (true || !/^Dique/.test(d.nombre)) continue;
  const P = d.H.map(([x, y]) => [x / 2, y / 2]), cx = P.reduce((t, p) => t + p[0], 0) / P.length, cy = P.reduce((t, p) => t + p[1], 0) / P.length;
  let sxx = 0, sxy = 0, syy = 0; for (const [x, y] of P) { sxx += (x - cx) ** 2; sxy += (x - cx) * (y - cy); syy += (y - cy) ** 2; }
  const th = 0.5 * Math.atan2(2 * sxy, sxx - syy), ux = Math.cos(th), uy = Math.sin(th); let vx = -uy, vy = ux;
  if ((centro[0] - cx) * vx + (centro[1] - cy) * vy < 0) { vx = -vx; vy = -vy; } // (hacia la ciudad)
  let u0 = Infinity, u1 = -Infinity, v1 = -Infinity; for (const [x, y] of P) { const u = (x - cx) * ux + (y - cy) * uy, v = (x - cx) * vx + (y - cy) * vy; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v1 = Math.max(v1, v); }
  const R = rng(Math.round(cx * 7 + cy)), n = 4, paso = (u1 - u0) / n, hueco = 16 / MPP, v0 = v1 + 26 / MPP, fondo = 24 / MPP;
  for (let i = 0; i < n; i++) {
    const a = u0 + i * paso + hueco / 2, b = u0 + (i + 1) * paso - hueco / 2, pt = (u, v) => [cx + u * ux + v * vx, cy + u * uy + v * vy];
    let Q = [pt(a, v0), pt(b, v0), pt(b, v0 + fondo), pt(a, v0 + fondo)], area = 0; for (let k = 0; k < 4; k++) area += Q[k][0] * Q[(k + 1) % 4][1] - Q[k][1] * Q[(k + 1) % 4][0];
    if (area < 0) Q.reverse();
    const nu = Math.round(Math.hypot(Q[1][0] - Q[0][0], Q[1][1] - Q[0][1]) * MPP), nv = Math.round(Math.hypot(Q[3][0] - Q[0][0], Q[3][1] - Q[0][1]) * MPP), id = manzanas.length, alto = Math.round((15 + R() * 3) * 10), seed = 1 + Math.floor(R() * 65000), e = E05;
    techos.push(id, 0, 0, nu, nv, alto, seed, 4 | (e << 8));
    muros.push(id, 0 | (4 << 4) | (e << 8), 0, 0, nu, 0, alto, seed, id, 2 | (4 << 4) | (e << 8), nv, 0, nu, 0, alto, seed, id, 1 | (4 << 4) | (e << 8), nu, 0, nv, 0, alto, seed, id, 3 | (4 << 4) | (e << 8), 0, 0, nv, 0, alto, seed);
    manzanas.push({ Q, nu, nv }); cuenta[e - 1]++;
    for (let t = 0; t <= nv * 2; t++) for (let r = 0; r <= nu * 2; r++) { const sx = r / (nu * 2), sy = t / (nv * 2), x = (1 - sx) * (1 - sy) * Q[0][0] + sx * (1 - sy) * Q[1][0] + sx * sy * Q[2][0] + (1 - sx) * sy * Q[3][0], y = (1 - sx) * (1 - sy) * Q[0][1] + sx * (1 - sy) * Q[1][1] + sx * sy * Q[2][1] + (1 - sx) * sy * Q[3][1], q = Math.min(TH - 1, Math.floor((y * 2 / PLANO.alto) * TH)) * TW + Math.min(TW - 1, Math.floor((x * 2 / PLANO.ancho) * TW)); lamB[q] = Math.max(lamB[q], CODIGO[e - 1]); if (debug) { const k = (Math.floor(y) * w + Math.floor(x)) * 3; debug[k] = 235; debug[k + 1] = 215; debug[k + 2] = 60; } }
  }
}

// ------------------------------------------------------------------------- lo de 1867 que queda en medio de una calle
// Las casillas y construcciones sueltas de las afueras que caen donde después pasa una calle: se van cuando llega.
let sueltas = 0;
for (let b = 0; b * 10 < mz67.length; b++) {
  const o = b * 10; if (mz67[o + 8] * mz67[o + 9] > 1200) continue;
  const x = (mz67[o] + mz67[o + 2] + mz67[o + 4] + mz67[o + 6]) / 8, y = (mz67[o + 1] + mz67[o + 3] + mz67[o + 5] + mz67[o + 7]) / 8, k = Math.floor(y) * w + Math.floor(x);
  if (!calle[k] || label[k] >= 0) continue;
  const v = lamR[Math.min(TH - 1, Math.floor((y * 2 / PLANO.alto) * TH)) * TW + Math.min(TW - 1, Math.floor((x * 2 / PLANO.ancho) * TW))], e = CODIGO.indexOf(v) + 1;
  if (!e) continue;
  sueltas++; for (const t of techosDe[b]) if (!muereT.has(t / 8)) muereT.set(t / 8, e); for (const t of murosDe[b]) if (!muereM.has(t / 8)) muereM.set(t / 8, e);
}

// La otra lámina: lo que se despejó (las trazas de las obras y el lugar de las casas que se fueron sin reemplazo) y
// el verde de las plazas nuevas.
const lamD = new Uint8Array(TW * TH), lamC = new Uint8Array(TW * TH); // (lamC: la calzada empedrada de las avenidas nuevas)
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const k = y * w + x, e = banda[k] && muerto[k] ? Math.min(banda[k], muerto[k]) : banda[k] || muerto[k]; if (!e) continue;
  const t = Math.min(TH - 1, Math.floor((y * 2 / PLANO.alto) * TH)) * TW + Math.min(TW - 1, Math.floor((x * 2 / PLANO.ancho) * TW));
  if (CODIGO[e - 1] > lamD[t]) lamD[t] = CODIGO[e - 1];
  if (verde[k] && banda[k] && !calle[k] && CODIGO[banda[k] - 1] > lamV[t]) lamV[t] = CODIGO[banda[k] - 1]; // (los canteros: lo que hoy no es calzada)
  if (calzada[k] && !(verde[k] && !calle[k]) && CODIGO[calzada[k] - 1] > lamC[t]) lamC[t] = CODIGO[calzada[k] - 1];
}

// Los muelles: unos 38 m alrededor de cada dique y cada dársena (la explanada de piedra donde trabajaban las grúas).
const muelle = new Uint8Array(w * h);
for (const d of diques) { const H = d.H.map(([x, y]) => [x / 2, y / 2]); for (let i = 0; i < H.length; i++) { const [ax, ay] = H[i], [bx, by] = H[(i + 1) % H.length], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 8)); for (let j = 0; j <= n; j++) sello(muelle, ax + ((bx - ax) * j) / n, ay + ((by - ay) * j) / n, 38 / MPP); } }

// (y los del Puerto Nuevo, más anchos —los espigones eran todo playa de carga—, cada uno desde su etapa)
const muellePN = new Uint8Array(w * h);
{ const m = new Uint8Array(w * h);
  for (const et of [E40, E21]) { m.fill(0);
    for (const d of darsenasPN) { if (d.hecho > et) continue; const H = d.H.map(([x, y]) => [x / 2, y / 2]); for (let i = 0; i < H.length; i++) { const [ax, ay] = H[i], [bx, by] = H[(i + 1) % H.length], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 8)); for (let j = 0; j <= n; j++) sello(m, ax + ((bx - ax) * j) / n, ay + ((by - ay) * j) / n, 62 / MPP); } }
    { const H = FRENTE_PN.map(([x, y]) => [x / 2, y / 2]); for (let i = 0; i + 1 < H.length; i++) { const [ax, ay] = H[i], [bx, by] = H[i + 1]; if (et === E21 && Math.max(ax, bx) * 2 > PN_HECHO_1921) continue; const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 8)); for (let j = 0; j <= n; j++) sello(m, ax + ((bx - ax) * j) / n, ay + ((by - ay) * j) / n, 62 / MPP); } }
    for (let k = 0; k < w * h; k++) if (m[k]) muellePN[k] = et;
  } }

// --------------------------------------------------------------------------------------- las calles, con los años
// Una tercera lámina (public/plano/calles.webp) para pintar el suelo en color: dónde hay calle y desde cuándo está
// pavimentada. Acá la cuenta tiene un escalón más que en las otras, porque en 1867 ya había empedrado: la etapa e
// (0 = 1867 … 6 = 1940) vale 255·(7 − e)/7.
//   R: desde cuándo tiene piedra (el empedrado bruto de 1867, el adoquín de granito después) · G: desde cuándo es lisa
//   (madera primero, asfalto después) · B: cuánto de ese punto es calle (para que el borde sea la vereda).
// La calle es lo que queda entre las manzanas: alrededor de las de 1867, su franja (calle67), y en lo que creció
// después, las calles de hoy. Las fechas salen de los censos y memorias municipales (ver LEEME.md), por zonas:
//   1867  empedrado bruto en unas 500 cuadras (498 al 1-12-1868): del río a Uruguay–San José, de Santa Fe a San
//         Juan, y Buen Orden–Lima hasta Constitución. Lo demás, tierra.
//   1888  la «zona de conservación» del censo de 1887: del río a Callao–Entre Ríos y hasta Caseros, adoquinada; afuera,
//         las avenidas (Rivadavia, Corrientes hasta la Chacarita, Santa Fe, Montes de Oca).
//   1895  pavimento continuo hasta Centro América–Jujuy (la zona del hormigón de 1895); la Avenida de Mayo, de madera.
//   1905  casi todo lo que abarca el plano; de madera las calles angostas del centro (del río a Uruguay–San José, de
//         Córdoba a Independencia) y las del ensayo de 1895-96 (Artes, Buen Orden, Juncal, Brasil, Perú, Defensa).
//   1921  el asfalto hasta Callao–Entre Ríos (de Santa Fe a San Juan) · 1940: hasta Pueyrredón–Jujuy y en las avenidas;
//         al sur de Independencia sigue el adoquín. (Estas dos últimas son una suposición: no hay cifras por zona.)
const E7 = (e) => Math.round((255 * (7 - e)) / 7);
{
  const tmp = new Uint8Array(w * h);
  /** en `m`, deja `v` adentro del polígono donde `v` sea menor que lo que había (o donde no había nada, si `vacio`) */
  const zonaA = (m, Q, v, vacio = false) => { tmp.fill(0); llenar(tmp, Q); for (let k = 0; k < w * h; k++) if (tmp[k] && (vacio ? !m[k] || v < m[k] : v < m[k])) m[k] = v; };
  /** la franja que va de la calle a–b (una que corre de norte a sur) hasta el río */
  const alRio = (a, b) => { const L = dAl(a, b); let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L; if (ny < 0) { nx = -nx; ny = -ny; } const R = M(7000); return [a, [a[0] + nx * R, a[1] + ny * R], [b[0] + nx * R, b[1] + ny * R], b]; };
  const mas = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; // (de a hacia b, y más allá si t > 1)
  const URU = ['Uruguay', 'San José'], CAL = ['Avenida Callao', 'Avenida Entre Ríos'], PUE = ['Avenida Pueyrredón', 'Avenida Jujuy'];
  const SFE = 'Avenida Santa Fe', COR = 'Avenida Córdoba', IND = 'Avenida Independencia', SJU = 'Avenida San Juan', CAS = 'Avenida Caseros';
  const casCal = cruce(CAL, CAS), casPue = cruce(PUE, CAS);
  // la piedra: 1 + la etapa de cada zona
  const zona = new Uint8Array(w * h).fill(4);
  zonaA(zona, alRio(mas(casPue, extremo('Avenida Pueyrredón', casPue, true), 1.15), casPue), 3);
  zonaA(zona, alRio(mas(casCal, extremo('Avenida Callao', casCal, true), 1.25), casCal), 2);
  zonaA(zona, alRio(cruce(URU, SFE), cruce(URU, SJU)), 1);
  // lo liso: la etapa de cada zona (0: nunca)
  const lisa = new Uint8Array(w * h);
  zonaA(lisa, alRio(mas(cruce(PUE, IND), extremo('Avenida Pueyrredón', casPue, true), 1.15), cruce(PUE, IND)), 6, true);
  zonaA(lisa, alRio(cruce(CAL, SFE), cruce(CAL, SJU)), 5, true);
  zonaA(lisa, alRio(cruce(URU, COR), cruce(URU, IND)), 3, true);
  // los ejes: el empedrado hasta Constitución en 1867, y las calles de madera de 1895-96
  const eje0 = new Uint8Array(w * h), ejeL = new Uint8Array(w * h), avda = new Uint8Array(w * h);
  const eje = (m, a, b) => { const n = Math.ceil(dAl(a, b) / 3); for (let i = 0; i <= n; i++) sello(m, a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n, M(11)); };
  /** el cruce de una calle con la primera de las otras que encuentre (no todas llegan igual de lejos); si no hay, nada */
  const cruza = (a, ...bs) => { for (const b of bs) { try { return cruce(a, b); } catch { /* sigue con la otra */ } } console.warn('     (sin cruce: ' + a + ' con ' + bs.join(', ') + ')'); return null; };
  const ejeDe = (m, a, b) => { if (a && b) eje(m, a, b); };
  const BRA = 'Avenida Brasil', GAR = 'Avenida Juan de Garay';
  for (const n of ['Bernardo de Irigoyen', 'Lima']) ejeDe(eje0, cruza(n, SJU), cruza(n, BRA, GAR, 'Cochabamba'));
  { const BI = ['Carlos Pellegrini', 'Bernardo de Irigoyen']; ejeDe(ejeL, cruza(BI, SFE, 'Arenales', 'Marcelo T. de Alvear'), cruza(BI, BRA, GAR, 'Cochabamba')); }
  ejeDe(ejeL, cruza('Juncal', 'Avenida Callao'), cruza('Juncal', 'Esmeralda', 'Suipacha', 'Carlos Pellegrini'));
  ejeDe(ejeL, cruza(BRA, 'Avenida Entre Ríos', 'Lima'), cruza(BRA, 'Defensa', 'Avenida Paseo Colón'));
  ejeDe(ejeL, cruza('Perú', ['Avenida Rivadavia', 'Rivadavia'], 'Avenida de Mayo', 'Adolfo Alsina'), cruza('Perú', SJU, 'Humberto 1º', 'Carlos Calvo')); ejeDe(ejeL, cruza('Defensa', ['Hipólito Yrigoyen', 'Avenida Hipólito Yrigoyen'], 'Adolfo Alsina'), cruza('Defensa', BRA, GAR));
  for (const e of lee('avenidas')) { const c = e.tags?.highway; if ((c === 'primary' || c === 'secondary' || c === 'trunk') && e.geometry) linea(avda, e, (MEDIO[c] + 6) / MPP); }

  const cR = new Uint8Array(TW * TH), cG = new Uint8Array(TW * TH), nSi = new Uint16Array(TW * TH), nTo = new Uint16Array(TW * TH);
  const nT = new Uint16Array(TW * TH); // (cuántas celdas de cada punto son calzada nueva de una obra tardía: entran después)
  const de67 = [0, 0, 0, 0, 0, 0, 0], lisas = [0, 0, 0, 0, 0, 0, 0]; let celdas = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = y * w + x, t = Math.min(TH - 1, Math.floor((y * 2 / PLANO.alto) * TH)) * TW + Math.min(TW - 1, Math.floor((x * 2 / PLANO.ancho) * TW));
    nTo[t]++;
    let s = -1, l = 0;
    const cz = calzada[k] && !(verde[k] && !calle[k]) ? calzada[k] : 0;
    const en67 = calle67[k] && !dentro[k] && !baldioPal[k] && !zonaC[k], hoy = calle[k] && !dentro[k] && !zonaP[k] && !zonaPal[k] && !baldioPal[k] && !zonaC[k];
    if (en67 || hoy) {
      const urb = CODIGO.indexOf(lamR[t]) + 1; // (0: no es de lo que creció después)
      if (en67 ? urb || zona[k] < 4 || hoy : urb && !via[k]) {
        if (agua[k] && !urb) continue;
        let z = eje0[k] ? 0 : zona[k] - 1; if (avda[k] && z > 1) z--;
        s = en67 && zona[k] < 4 ? z : Math.max(urb, z); // (las calles de la ciudad de 1867 ya estaban: solo cuenta su zona)
        if (costanera[k]) s = Math.max(s, E21); // (la Costanera Sur se inauguró en 1918)
        let lz = lisa[k]; if (ejeL[k] && zona[k] < 3) lz = lz ? Math.min(lz, 3) : 3; if (avda[k] && !lz) lz = 6;
        if (agua[k] && lz < 6) lz = 0; // (en el puerto, sobre la tierra ganada al río, adoquín: la madera era de las calles del centro)
        l = lz ? Math.max(lz, s) : 0;
      }
    }
    // (los muelles: la explanada adoquinada alrededor de los diques y las dársenas, desde que están)
    if (s < 0 && muelle[k] && lamR[t] >= CODIGO[E95 - 1]) s = E95;
    if (s < 0 && muellePN[k] && lamR[t] > 0) s = Math.max(muellePN[k], lamR[t] >= CODIGO[E21 - 1] ? E21 : E40);
    // (las avenidas de las playas de Retiro y de la Costanera Norte, trazadas a mano: adoquín desde que están y asfalto en 1940 —lo del asfalto, supuesto—)
    if (s < 0 && avMano[k] && lamR[t] > 0) { s = Math.max(avMano[k], lamR[t] >= CODIGO[E21 - 1] ? E21 : E40); l = N; }
    // (las calzadas de la Plaza Colón, calcadas a mano: adoquín desde su etapa y asfalto desde la que diga cada una)
    if (calzC[k]) { s = s < 0 ? calzC[k] : Math.min(s, calzC[k]); l = l ? Math.min(l, Math.max(lisaC[k], s)) : Math.max(lisaC[k], s); }
    // (las avenidas nuevas: pavimento liso desde que se abren —de madera la de Mayo, de asfalto las demás—)
    let nuevaT = false;
    if (cz) { if ((en67 || calzadaT[k]) && s >= 0) l = l ? Math.min(l, Math.max(cz, s)) : Math.max(cz, s); else { s = cz; l = cz; nuevaT = !!calzadaT[k]; } } // (calzadaT: la de una obra tardía no le cambia el pavimento a la calle que ya estaba)
    if (s < 0) continue;
    if (nuevaT) { nT[t]++; continue; }
    nSi[t]++; celdas++; de67[s]++; if (l) lisas[l]++;
    if (E7(s) > cR[t]) cR[t] = E7(s); if (l && E7(l) > cG[t]) cG[t] = E7(l);
  }
  // (la calzada nueva de una obra tardía entra ahora, con su fecha. No entra en los puntos de la placa donde ya había
  // una calle pavimentada de antes, ni en los de al lado: la placa guarda una sola fecha y un solo ancho de calle por
  // punto, para todas las etapas, y ahí la calle vieja cambiaría antes de la obra —se quedaría sin veredas, o sin el
  // pavimento del borde—. Ese anillo de unos 5 m, la boca donde la avenida nueva desemboca en la calle vieja, lo
  // pinta a mano el lugar de la obra, con un paño que nace con ella: src/lugares/obelisco-1940.js.)
  { const vieja = Uint8Array.from(cR, (v) => (v > E7(N) ? 1 : 0));
    for (let y = 1; y < TH - 1; y++) for (let x = 1; x < TW - 1; x++) { const q = y * TW + x; if (!nT[q]) continue; let boca = false; for (let j = -1; j <= 1 && !boca; j++) for (let i = -1; i <= 1; i++) if (vieja[q + j * TW + i]) { boca = true; break; } if (boca) continue;
      nSi[q] += nT[q]; celdas += nT[q]; de67[N] += nT[q]; lisas[N] += nT[q]; if (E7(N) > cR[q]) cR[q] = E7(N); if (E7(N) > cG[q]) cG[q] = E7(N); } }
  // (la fecha se corre a los puntos de al lado que no son calle: así el borde lo marca solo el canal B, y de lejos
  // —cuando la placa promedia— no se mezcla con ceros)
  const correr = (c, pasadas) => { let a = c; for (let p = 0; p < pasadas; p++) { const o = Uint8Array.from(a); for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) { const q = y * TW + x; if (a[q]) continue; let v = 0; if (x && a[q - 1] > v) v = a[q - 1]; if (x < TW - 1 && a[q + 1] > v) v = a[q + 1]; if (y && a[q - TW] > v) v = a[q - TW]; if (y < TH - 1 && a[q + TW] > v) v = a[q + TW]; o[q] = v; } a = o; } return a; };
  const R2 = correr(cR, 26), G2 = correr(cG, 3);
  const lam3 = Buffer.alloc(TW * TH * 3); for (let q = 0; q < TW * TH; q++) { lam3[q * 3] = R2[q]; lam3[q * 3 + 1] = G2[q]; lam3[q * 3 + 2] = nTo[q] ? Math.round((255 * nSi[q]) / nTo[q]) : 0; }
  await sharp(lam3, { raw: { width: TW, height: TH, channels: 3 } }).webp({ lossless: true, effort: 5 }).toFile('public/plano/calles.webp');
  const w2 = TW / 2, h2 = Math.floor(TH / 2), chico = Buffer.alloc(w2 * h2 * 3);
  for (let y = 0; y < h2; y++) for (let x = 0; x < w2; x++) { const q = [0, 1, TW, TW + 1].map((d) => (y * 2 * TW + x * 2 + d) * 3), o = (y * w2 + x) * 3; chico[o] = Math.max(...q.map((i) => lam3[i])); chico[o + 1] = Math.max(...q.map((i) => lam3[i + 1])); chico[o + 2] = Math.round(q.reduce((t, i) => t + lam3[i + 2], 0) / 4); }
  await sharp(chico, { raw: { width: w2, height: h2, channels: 3 } }).webp({ lossless: true, effort: 5 }).toFile('public/plano/calles-2k.webp');
  const km2 = (n) => ((n * MPP * MPP) / 1e6).toFixed(2);
  lap(`las calles: ${km2(celdas)} km² de calle; con piedra, ${de67.map((n, e) => `${e ? AÑOS[e - 1].año : 1867}: +${km2(n)}`).join(' · ')}; lisas, ${lisas.map((n, e) => (n ? `${AÑOS[e - 1].año}: +${km2(n)}` : '')).filter(Boolean).join(' · ')} km²`);
}

// --------------------------------------------------------------------------------------------------------- a guardar
mkdirSync('public/datos', { recursive: true });
const u16 = (a) => { for (const v of a) if (v < 0 || v > 65535) throw new Error('no entra en 16 bits: ' + v); return Buffer.from(new Uint16Array(a).buffer); };
const mz = new Float32Array(manzanas.length * 10);
manzanas.forEach((m, i) => { for (let q = 0; q < 4; q++) { mz[i * 10 + q * 2] = m.Q[q][0] * 2; mz[i * 10 + q * 2 + 1] = m.Q[q][1] * 2; } mz[i * 10 + 8] = m.nu; mz[i * 10 + 9] = m.nv; });
// (el mismo empaque que tools/empacar.mjs)
const planos = (buf, rec) => { const n = buf.length / rec, out = Buffer.alloc(buf.length); for (let k = 0; k < rec; k++) for (let i = 0; i < n; i++) out[k * n + i] = buf[i * rec + k]; return out; };
const pares = (m) => { const a = new Uint32Array(m.size * 2); let i = 0; for (const [k, e] of [...m].sort((x, y) => x[0] - y[0])) { a[i++] = k; a[i++] = e; } return Buffer.from(a.buffer); };
// (mueT y mueM: lo de 1867 que se va —registro de sus techos o de sus muros, etapa—)
const partes = [['manzanas', 40, Buffer.from(mz.buffer)], ['techos', 16, u16(techos)], ['muros', 16, u16(muros)], ['mueT', 8, pares(muereT)], ['mueM', 8, pares(muereM)]];
const cab = Buffer.from(JSON.stringify({ partes: partes.map(([nombre, registro, b]) => ({ nombre, bytes: b.length, registro })) })), largo = Buffer.alloc(4); largo.writeUInt32LE(cab.length);
writeFileSync('public/datos/crece.pak', gzipSync(Buffer.concat([largo, cab, ...partes.map(([, r, b]) => planos(b, r))]), { level: 9 }));
writeFileSync('public/datos/crece.json', JSON.stringify({ epocas: AÑOS.map(({ año, plano, titulo, autor, fuente, licencia }, i) => ({ año, plano, titulo, autor, fuente, licencia, corto: CORTO[año], obras: OBRAS_DE[año], casas: cuenta[i], renovadas: nRenovadas[i] })) }));
const lam = Buffer.alloc(TW * TH * 3); for (let q = 0; q < TW * TH; q++) { lam[q * 3] = lamR[q]; lam[q * 3 + 1] = lamG[q]; lam[q * 3 + 2] = lamB[q]; }
await sharp(lam, { raw: { width: TW, height: TH, channels: 3 } }).webp({ lossless: true, effort: 5 }).toFile('public/plano/crece.webp');
await sharp(lam, { raw: { width: TW, height: TH, channels: 3 } }).resize(2048, Math.round(TH / 2), { fit: 'fill', kernel: 'nearest' }).webp({ lossless: true, effort: 5 }).toFile('public/plano/crece-2k.webp');
// (En la tierra ganada de las playas de Retiro y del Puerto Nuevo —src/playas-retiro.js— el suelo de 1867 trae como
// «edificado» y «patio» los barcos fondeados y los rótulos que el plano dibuja en el río: debajo del relleno quedaban
// como manchas color teja. Se dan por despejadas desde que llega la tierra.)
{
  const kx = TW / PLANO.ancho, ky = TH / PLANO.alto, Z = ZONA_PLAYAS.map(([x, y]) => [x * kx, y * ky]); let n = 0;
  const zx0 = Math.floor(Math.min(...Z.map((p) => p[0]))), zy0 = Math.floor(Math.min(...Z.map((p) => p[1]))), zx1 = Math.ceil(Math.max(...Z.map((p) => p[0]))), zy1 = Math.ceil(Math.max(...Z.map((p) => p[1])));
  const sucio = (q) => s67[q * 3 + 1] > 3 || s67[q * 3 + 2] > 3;
  for (let y = Math.max(1, zy0); y <= Math.min(TH - 2, zy1); y++) for (let x = Math.max(1, zx0); x <= Math.min(TW - 2, zx1); x++) {
    const q = y * TW + x; if (!lamR[q] || s67[q * 3] < 100 || !inPoly(Z, x + 0.5, y + 0.5)) continue;
    let hay = false; for (let b = -2; b <= 2 && !hay; b++) for (let a = -2; a <= 2; a++) { const p = q + b * TW + a; if (p >= 0 && p < TW * TH && sucio(p)) { hay = true; break; } }
    if (!hay) continue;
    const cod = CODIGO[(lamR[q] >= CODIGO[E21 - 1] ? E21 : E40) - 1]; if (cod > lamD[q]) { lamD[q] = cod; n++; }
  }
  lap(`las playas de Retiro y el Puerto Nuevo: ${n} puntos del suelo de 1867 (barcos y rótulos del río) tapados por el relleno`);
  // (lo mismo detrás de la Casa de Gobierno, de la Aduana al Correo —src/plaza-colon.js—: las toscas, los juncos y
  // los rótulos que el plano de 1867 dibuja en la orilla quedaban como manchas en la avenida y en el parque. Se dan
  // por tapados desde 1895, con el relleno del puerto. Solo el dibujo del suelo: las casas no cambian.)
  { const C = [[9690, 9896], [11190, 9896], [11190, 10172], [9690, 10172]].map(([x, y]) => [x * kx, y * ky]); let m = 0;
    for (let y = Math.floor(C[0][1]); y <= Math.ceil(C[2][1]); y++) for (let x = Math.floor(C[0][0]); x <= Math.ceil(C[1][0]); x++) {
      const q = y * TW + x; if (!lamR[q] || !inPoly(C, x + 0.5, y + 0.5)) continue;
      let hay = false; for (let b = -2; b <= 2 && !hay; b++) for (let a = -2; a <= 2; a++) if (sucio(q + b * TW + a)) { hay = true; break; }
      if (hay && CODIGO[E95 - 1] > lamD[q]) { lamD[q] = CODIGO[E95 - 1]; m++; }
    }
    lap(`la Plaza Colón y el bajo de la Casa de Gobierno: ${m} puntos del suelo de 1867 tapados por el relleno`); }
}
// (los lagos y las avenidas de los parques de Palermo: «despejados» desde su etapa, para que se vayan los árboles
// que el plano de 1867 dibuja ahí; encima van el agua y la calzada de src/lugares/palermo.js)
{ const kx = TW / PLANO.ancho, ky = TH / PLANO.alto; let n = 0;
  const pone = (x, y, cod) => { if (x < 0 || y < 0 || x >= TW || y >= TH) return; const q = y * TW + x; if (cod > lamD[q]) { lamD[q] = cod; n++; } };
  for (const [, e, O] of LAGOS_PALERMO) { const Q = O.map(([x, y]) => [x * kx, y * ky]), x0 = Math.floor(Math.min(...Q.map((p) => p[0]))), x1 = Math.ceil(Math.max(...Q.map((p) => p[0]))), y0 = Math.floor(Math.min(...Q.map((p) => p[1]))), y1 = Math.ceil(Math.max(...Q.map((p) => p[1])));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inPoly(Q, x + 0.5, y + 0.5)) pone(x, y, CODIGO[e - 1]); }
  for (const [, e, medio, L] of AVENIDAS_PALERMO) { const r = Math.max(1, Math.round((medio / PLANO.metro) * kx));
    for (let i = 0; i + 1 < L.length; i++) { const [ax, ay] = L[i], [bx, by] = L[i + 1], pasos = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) * kx)); for (let j = 0; j <= pasos; j++) { const cx = Math.round((ax + ((bx - ax) * j) / pasos) * kx), cy = Math.round((ay + ((by - ay) * j) / pasos) * ky); for (let b = -r; b <= r; b++) for (let a = -r; a <= r; a++) if (a * a + b * b <= r * r) pone(cx + a, cy + b, CODIGO[e - 1]); } } }
  lap(`los lagos y las avenidas de Palermo: ${n} puntos despejados`); }
// (y la tierra que los parques de Palermo le ganaron al río es pasto desde que está)
{ let n = 0; for (let q = 0; q < TW * TH; q++) if (lamR[q] && enPal(q) && lamV[q] < lamR[q]) { lamV[q] = lamR[q]; n++; } lap(`los parques de Palermo: ${n} puntos de tierra ganada, con pasto`); }
const lam2 = Buffer.alloc(TW * TH * 3); for (let q = 0; q < TW * TH; q++) { lam2[q * 3] = lamD[q]; lam2[q * 3 + 1] = lamV[q]; lam2[q * 3 + 2] = lamC[q]; }
await sharp(lam2, { raw: { width: TW, height: TH, channels: 3 } }).webp({ lossless: true, effort: 5 }).toFile('public/plano/despeje.webp');
await sharp(lam2, { raw: { width: TW, height: TH, channels: 3 } }).resize(2048, Math.round(TH / 2), { fit: 'fill', kernel: 'nearest' }).webp({ lossless: true, effort: 5 }).toFile('public/plano/despeje-2k.webp');
if (ver) {
  mkdirSync('tmp', { recursive: true });
  for (let k = 0; k < w * h; k++) if (!debug[k * 3] && !debug[k * 3 + 1] && !debug[k * 3 + 2]) { const v = agua[k] ? [40, 60, 90] : ocup[k] ? [150, 150, 150] : calle[k] ? [70, 70, 70] : via[k] ? [90, 50, 90] : [25, 25, 25]; debug[k * 3] = v[0]; debug[k * 3 + 1] = v[1]; debug[k * 3 + 2] = v[2]; }
  await sharp(debug, { raw: { width: w, height: h, channels: 3 }, limitInputPixels: false }).jpeg({ quality: 86 }).toFile('tmp/crece-ver.jpg');
}
lap(`guardado: crece.pak ${(statSync('public/datos/crece.pak').size / 1e6).toFixed(2)} MB, crece.webp ${(statSync('public/plano/crece.webp').size / 1e6).toFixed(2)} MB, de 1867 se van ${muereT.size} techos y ${muereM.size} muros (${sueltas} construcciones sueltas)`);
process.exit(0);
