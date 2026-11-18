// Los parques de Palermo: el Parque Tres de Febrero (inaugurado el 11 de noviembre de 1875), el Zoológico (1888), el
// Jardín Botánico (1898), la Exposición Rural (1878), el Hipódromo (1876) y la cancha de polo (1928). Junta lo que hace
// falta para el suelo y para src/lugares/palermo.js y lo deja en src/palermo.js (en píxeles del plano de 1867):
//   · los contornos: adentro no se levantan casas ni se pintan las calles de hoy (tools/crece.mjs);
//   · los lagos, las avenidas del parque, los senderos y dónde va cada árbol.
// De dónde sale cada cosa: los contornos de los canteros, los lagos, las avenidas y los senderos, del mapa de hoy
// (© los colaboradores de OpenStreetMap, ODbL: fuentes/osm/palermo.json, lagos.json, agua.json, avenidas.json y
// calles.json), que calza con el plano de Peuser de 1936; los contornos grandes (el parque entre la avenida Alvear
// —hoy del Libertador— y las vías, el Zoológico, la Rural, el Hipódromo, el polo), calcados a mano sobre ese plano; la
// etapa en que entra cada cosa, de los planos de época (ver LEEME.md, «Los parques de Palermo»). El lugar de cada
// árbol es al azar, con una tirada fija.
//   node tools/palermo.mjs [--ver]     (después: node tools/crece.mjs; con --ver deja tmp/palermo-ver.json)
// fuentes/osm/palermo.json se baja de Overpass con este pedido, en el recuadro -34.592,-58.437,-34.553,-58.397:
//   (way[leisure~"^(park|garden|track)$"];relation[leisure~"^(park|garden)$"];way[tourism=zoo];relation[tourism=zoo];
//    way[highway~"^(footway|path|pedestrian)$"];way[natural=water];node[historic~"^(monument|memorial)$"];);out tags geom;
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { aPlano } from './geo.mjs';
import { LINEAS } from '../src/vias.js';
import { altoVia } from '../src/viaducto.js';

const lee = (f) => JSON.parse(readFileSync(`fuentes/osm/${f}.json`, 'utf8')).elements;
const M = 0.675; // metros por píxel del plano
const E88 = 1, E95 = 2, E05 = 3, E10 = 4, E21 = 5, E40 = 6;
const BORDE_X = 18170; // (más al norte ya es la guarda del plano: tools/plano.mjs, PLANO.marco)
/** un contorno recortado en ese borde */
const recorta = (P) => { const o = []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], da = a[0] <= BORDE_X, db = b[0] <= BORDE_X; if (da) o.push(a); if (da !== db) { const t = (BORDE_X - a[0]) / (b[0] - a[0]); o.push([BORDE_X, a[1] + (b[1] - a[1]) * t]); } } return o; };
const adentro = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const area = (P) => { let a = 0; for (let i = 0; i < P.length; i++) { const [x, y] = P[i], [x1, y1] = P[(i + 1) % P.length]; a += x * y1 - x1 * y; } return Math.abs(a / 2); };
const centro = (P) => [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length];
const aSeg = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
/** una línea con menos puntos (Douglas y Peucker), sin apartarse más de `tol` píxeles */
const afina = (P, tol) => { if (P.length < 3) return P; let m = 0, k = 0; for (let i = 1; i + 1 < P.length; i++) { const d = aSeg(P[i], P[0], P[P.length - 1]); if (d > m) { m = d; k = i; } } return m <= tol ? [P[0], P[P.length - 1]] : [...afina(P.slice(0, k + 1), tol).slice(0, -1), ...afina(P.slice(k), tol)]; };
const anillo = (P, tol) => { const Q = P.slice(); if (Q.length > 1 && Math.hypot(Q[0][0] - Q.at(-1)[0], Q[0][1] - Q.at(-1)[1]) < 0.5) Q.pop(); if (Q.length < 8) return Q; const h = Q.length >> 1; return [...afina(Q.slice(0, h + 1), tol).slice(0, -1), ...afina([...Q.slice(h), Q[0]], tol).slice(0, -1)]; };
const R = (P) => P.map(([x, y]) => [Math.round(x), Math.round(y)]);
const enPx = (g) => g.map((p) => aPlano(p.lat, p.lon));

// ------------------------------------------------------------------------------------------------- los contornos
// Calcados sobre el plano de Peuser (1936) con el mapa de hoy encima.
const MANO = [
  // el parque, de la avenida Alvear (hoy del Libertador) a las vías del Central Argentino, y de Casares a Dorrego
  ['Parque Tres de Febrero', E88, [[15825, 4900], [16235, 4217], [16973, 3186], [17827, 3708], [18146, 3873], [18146, 4587], [17585, 5071], [17407, 5275], [16693, 5632], [16250, 5239]]],
  ['Avenida Sarmiento, de la Plaza Italia al parque', E88, [[15290, 3500], [15399, 3338], [15959, 3817], [16300, 4160], [16235, 4300], [16185, 4275]]],
  ['Jardín Zoológico', E95, [[15290, 3500], [16185, 4275], [16094, 4489], [15192, 3914]]],
  ['Exposición Rural', E88, [[15399, 3338], [15470, 3275], [16082, 3333], [15959, 3817]]],
  ['Hipódromo Argentino', E88, [[17050, 3211], [18362, 1504], [18600, 1700], [18600, 2800], [18175, 3338], [17827, 3695]]],
  ['Cancha de polo', E05, [[16961, 3147], [16846, 2625], [17560, 2039], [17712, 2166]]],
];
// (del lado del río de la avenida: los canteros del mapa de hoy que caen acá son parque)
const LADO_RIO = [[15825, 4900], [17001, 3080], [18363, 1486], [18900, 1900], [18900, 5600], [16400, 5700], [15600, 5300]];
const TAMBIEN = /^(Jardín Botánico Carlos Thays|Plaza Intendente Francisco Seeber|Plaza Italia|Plaza Alemania)$/;
const ETAPA_DE = (n, [cx, cy]) => /Botánico/.test(n) ? E05 : /Plaza Italia/.test(n) ? E05 : /Rosedal|Poetas/.test(n) ? E21 : /Andaluz|Japonés|Alemania|Irán/.test(n) ? E40 : cx > 17900 && cy < 3900 ? E05 : E88;
// La Recoleta y Palermo Chico, entre el parque y Retiro: las plazas que el plano de Peuser pinta de verde a lo largo de
// la avenida Alvear (hoy del Libertador) —Francia, Intendente Alvear, Mitre, Urquiza—, las del Barrio Parque y el
// parque de Retiro. (fuentes/osm/recoleta.json: el mismo pedido, en el recuadro -34.600,-58.413,-34.570,-58.374.)
const RECOLETA = [[14044, 8133], [14267, 8200], [14711, 7689], [15200, 7044], [15711, 6422], [15600, 5778], [15022, 5778], [14800, 6044], [14556, 6578], [14333, 6933], [13933, 6911], [13867, 7244], [13911, 7422], [14333, 7378], [14333, 7689], [14044, 7956]];
// (el baldío entre la avenida Centenario —hoy Figueroa Alcorta— y las vías: el Peuser lo deja amarillo. Las plazas y
// las calles que hoy tiene encima —la Facultad de Derecho, el parque Thays— son posteriores: ni unas ni otras van)
const BALDIO = [[14540, 7460], [14890, 6790], [14985, 6640], [15345, 6905], [15200, 7090], [14720, 7720], [14500, 7530]];
// (y un cerco que el plano de 1867 dibuja en el río frente a la Recoleta: el lector lo tomó por calles, y al llegar el
// relleno quedaba pintado como un rectángulo de calzada en medio de las vías)
const CERCO_67 = [[14650, 6900], [15400, 6400], [15820, 6560], [15600, 7420], [14700, 7160]];
const vistos = new Set(), palermo = [...lee('palermo'), ...lee('recoleta')].filter((e) => { const k = e.type + e.id; if (vistos.has(k)) return false; vistos.add(k); return true; });
const PARQUES = MANO.map(([n, e, P]) => [n, e, R(recorta(P))]);
for (const e of palermo) {
  const t = e.tags ?? {}; if (!(t.leisure === 'park' || t.leisure === 'garden') || !e.geometry) continue;
  const P = enPx(e.geometry), c = centro(P), n = t.name ?? '';
  if (area(P) * M * M < 2500 || c[0] > BORDE_X || recorta(P).length < 3) continue;
  if (/Japonés/.test(n)) continue; // (de 1967)
  const reco = adentro(RECOLETA, ...c) && !adentro(BALDIO, ...c) && !/Jardín de la Recoleta|Libres del Sud/.test(n); // (esas dos caen en lo que el Peuser deja amarillo)
  if (!TAMBIEN.test(n) && !adentro(LADO_RIO, ...c) && !reco) continue;
  PARQUES.push([n || 'cantero', reco ? (/Francia|Intendente Alvear/.test(n) ? E05 : E21) : ETAPA_DE(n, c), R(recorta(anillo(P, 2)))]);
}
const etapaEn = (x, y) => { let e = 0; for (const [, et, P] of PARQUES) if (adentro(P, x, y)) e = e ? Math.min(e, et) : et; return e; }; // (0: afuera)
/** la etapa del contorno más chico que contiene al punto (el Rosedal adentro del parque, por ejemplo) */
const etapaFina = (x, y) => { let e = 0, a0 = Infinity; for (const [, et, P] of PARQUES) if (adentro(P, x, y)) { const a = area(P); if (a < a0) { a0 = a; e = et; } } return e; };
const nombreEn = (x, y) => PARQUES.filter(([, , P]) => adentro(P, x, y)).map((p) => p[0]);

// ----------------------------------------------------------------------------------------------------- los lagos
// Con la forma de hoy. La etapa: el del Rosedal ya está en el plano de 1895; los del Zoológico, con el jardín; los de
// las Lomas (hoy del Planetario) y Victoria Ocampo, y los del centro del Hipódromo, en el de Ludwig de 1905.
const LAGOS = [];
const etapaLago = (n, [cx, cy]) => /Rosedal/.test(n) ? E95 : /Burmeister|Azara|Darwin/.test(n) ? E95 : etapaEn(cx, cy) === E95 ? E95 : /Planetario|Victoria/.test(n) ? E05 : Math.max(E05, etapaEn(cx, cy));
for (const e of lee('lagos')) {
  const n = e.tags?.name ?? ''; if (/Shigaken/.test(n)) continue;
  const fuera = e.members.filter((m) => m.role === 'outer' && m.geometry), islas = e.members.filter((m) => m.role === 'inner' && m.geometry).map((m) => enPx(m.geometry));
  // (los anillos de afuera vienen en tramos: se cosen punta con punta)
  let tr = fuera.map((m) => enPx(m.geometry)), O = tr.shift(); if (!O) continue;
  while (tr.length) { const f = O.at(-1); let k = tr.findIndex((t) => Math.hypot(t[0][0] - f[0], t[0][1] - f[1]) < 1), al = false; if (k < 0) { k = tr.findIndex((t) => Math.hypot(t.at(-1)[0] - f[0], t.at(-1)[1] - f[1]) < 1); al = true; } if (k < 0) break; const t = tr.splice(k, 1)[0]; O = O.concat((al ? t.reverse() : t).slice(1)); }
  const c = centro(O); if (!etapaEn(...c) || c[0] > BORDE_X) continue;
  LAGOS.push([n || 'lago', etapaLago(n, c), R(recorta(anillo(O, 1.2))), islas.filter((I) => area(I) * M * M > 30).map((I) => R(anillo(I, 1.2)))]);
}
for (const f of ['agua', 'palermo']) for (const e of lee(f)) {
  const t = e.tags ?? {}; if (t.natural !== 'water' || !e.geometry || e.geometry.length < 5 || /basin|reflecting_pool/.test(t.water ?? '') || /Kyoto/.test(t.name ?? '')) continue;
  const P = enPx(e.geometry), c = centro(P); if (!etapaEn(...c) || c[0] > BORDE_X || area(P) * M * M < 150) continue;
  if (LAGOS.some(([, , O]) => adentro(O, ...c) || Math.hypot(centro(O)[0] - c[0], centro(O)[1] - c[1]) < 8)) continue;
  LAGOS.push([t.name || 'lago', etapaLago(t.name ?? '', c), R(recorta(anillo(P, 1.2))), []]);
}
const enLago = (x, y, margen = 0) => LAGOS.some(([, , O]) => adentro(O, x, y) || (margen && O.some((p, i) => aSeg([x, y], p, O[(i + 1) % O.length]) < margen)));

// -------------------------------------------------------------------------------------------------- las avenidas
// Las del mapa de hoy que ya estaban, con el nombre de hoy y la etapa en que entran (del plano en que aparecen). Se
// toma lo que corre por adentro de los parques o pegado a ellos: el resto lo pinta tools/crece.mjs, como siempre.
const AV = {
  'Avenida Presidente Sarmiento': E88, 'Avenida Del Libertador': E88, 'Avenida General Las Heras': E88, 'Avenida Casares': E95, 'República de la India': E95,
  'Avenida Iraola': E05, 'Avenida Infanta Isabel': E05, 'Avenida Dorrego': E05, 'Avenida Adolfo Berro': E05, 'República Árabe Siria': E05, 'Avenida Colombia': E05,
  'Avenida Presidente Figueroa Alcorta': E10, // (la avenida Centenario)
  'Avenida Presidente Pedro Montt': E21, 'Avenida Belisario Roldán': E21, 'Avenida de los Ombúes': E21, 'Avenida Coronel Marcelino E. Freyre': E21, 'Avenida Valentín Alsina': E21, 'Andrés Bello': E21, 'Avenida Ernesto Tornquist': E21,
};
const MEDIO = { trunk: 7, primary: 7, secondary: 6, tertiary: 4.5, residential: 3.5, unclassified: 3.5 };
const cercaDeParque = (x, y, d) => etapaEn(x, y) > 0 || [[d, 0], [-d, 0], [0, d], [0, -d], [d * 0.7, d * 0.7], [-d * 0.7, d * 0.7], [d * 0.7, -d * 0.7], [-d * 0.7, -d * 0.7]].some(([a, b]) => etapaEn(x + a, y + b) > 0);
const AVENIDAS = [];
for (const f of ['avenidas', 'calles']) for (const e of lee(f)) {
  const n = e.tags?.name, et = AV[n], medio = MEDIO[e.tags?.highway]; if (!et || !medio || !e.geometry || e.tags?.tunnel || e.tags?.bridge) continue;
  // (se parte donde se aleja de los parques)
  const P = enPx(e.geometry); let tramo = [];
  const cierra = () => { if (tramo.length > 1) AVENIDAS.push([n, et, medio, R(afina(tramo, 1))]); tramo = []; };
  for (let i = 0; i < P.length; i++) {
    if (i) { const a = P[i - 1], b = P[i], k = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 20)); for (let j = 1; j < k; j++) P.splice(i, 0, [a[0] + ((b[0] - a[0]) * j) / k, a[1] + ((b[1] - a[1]) * j) / k]), i++; }
  }
  for (const p of P) { if (p[0] < BORDE_X && cercaDeParque(p[0], p[1], 45)) tramo.push(p); else cierra(); }
  cierra();
}
const enAvenida = (x, y, mas = 0) => AVENIDAS.some(([, , medio, P]) => P.some((p, i) => i + 1 < P.length && aSeg([x, y], p, P[i + 1]) < (medio + mas) / M));

// -------------------------------------------------------------------------------------------------- los senderos
// Los del mapa de hoy, por adentro de los parques (no las veredas ni los cruces). Entran con su parque.
const SENDEROS = [];
for (const e of palermo) {
  const t = e.tags ?? {}; if (!/^(footway|path|pedestrian)$/.test(t.highway ?? '') || t.footway || t.bridge || t.tunnel || !e.geometry) continue;
  const P = enPx(e.geometry); if (P.some((p) => p[0] > BORDE_X)) continue;
  const et = P.map((p) => etapaFina(...p)); if (et.filter((v) => v).length < P.length * 0.9) continue;
  let l = 0; for (let i = 0; i + 1 < P.length; i++) l += Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]);
  if (l * M < 30) continue;
  const m = centro(P), nn = nombreEn(...m).join(' '); if (/Hipódromo|polo|Rural/.test(nn)) continue;
  SENDEROS.push([Math.max(...et), t.highway === 'pedestrian' ? 3 : 1.6, R(afina(P, 1.2))]);
}
// (y los puentes de esos senderos sobre los lagos)
const PUENTES = [];
for (const e of palermo) { const t = e.tags ?? {}; if (!/^(footway|path|pedestrian)$/.test(t.highway ?? '') || !t.bridge || !e.geometry) continue; const P = enPx(e.geometry), c = centro(P); if (!etapaEn(...c) || c[0] > BORDE_X) continue; PUENTES.push([Math.max(etapaEn(...c), E21), R(P)]); }
// (una grilla para saber rápido si un punto cae sobre un sendero)
const CEL = 24, grilla = new Map();
for (const [, , P] of SENDEROS) for (let i = 0; i + 1 < P.length; i++) { const a = P[i], b = P[i + 1]; for (let gx = Math.floor(Math.min(a[0], b[0]) / CEL) - 1; gx <= Math.floor(Math.max(a[0], b[0]) / CEL) + 1; gx++) for (let gy = Math.floor(Math.min(a[1], b[1]) / CEL) - 1; gy <= Math.floor(Math.max(a[1], b[1]) / CEL) + 1; gy++) { const k = gx * 4096 + gy; if (!grilla.has(k)) grilla.set(k, []); grilla.get(k).push([a, b]); } }
const enSendero = (x, y, d) => (grilla.get(Math.floor(x / CEL) * 4096 + Math.floor(y / CEL)) ?? []).some(([a, b]) => aSeg([x, y], a, b) < d);

// --------------------------------------------------------------------------------------------------- los árboles
// Uno cada tanto, adentro de los contornos: tupidos en el Botánico y el Zoológico, ralos en el Hipódromo (solo por
// afuera de la pista) y ninguno en la cancha de polo ni en la Rural. Y una hilera a cada lado de las avenidas.
let semilla = 1875; const al = () => { semilla = (semilla * 1664525 + 1013904223) >>> 0; return semilla / 4294967296; };
// (la pista del Hipódromo y la cancha de polo: las usa también src/lugares/palermo.js)
const PISTA = { c: [17905, 2600], u: [0.61, -0.7926], largo: 600, radio: 200 }; // centro, rumbo de las rectas, medio largo de las rectas y radio de las curvas (en píxeles)
const enPista = (x, y, mas = 0) => { const dx = x - PISTA.c[0], dy = y - PISTA.c[1], s = dx * PISTA.u[0] + dy * PISTA.u[1], t = -dx * PISTA.u[1] + dy * PISTA.u[0], q = Math.max(0, Math.abs(s) - PISTA.largo); return Math.hypot(q, t) < PISTA.radio + mas; };
const ARBOLES = [];
const PASO = 30;
const xs = PARQUES.flatMap((p) => p[2].map((q) => q[0])), ys = PARQUES.flatMap((p) => p[2].map((q) => q[1]));
for (let y = Math.min(...ys); y < Math.max(...ys); y += PASO) for (let x = Math.min(...xs); x < Math.max(...xs); x += PASO) {
  const px = Math.round(x + (0.1 + al() * 0.8) * PASO), py = Math.round(y + (0.1 + al() * 0.8) * PASO), r = Math.round((3.4 + al() * 2.4) * 10) / 10, t = al();
  const et = etapaFina(px, py); if (!et || px > BORDE_X) continue;
  const nn = nombreEn(px, py).join(' ');
  if (/polo|Rural/.test(nn)) continue;
  if (/Hipódromo/.test(nn) && (enPista(px, py, 40) || t > 0.5)) continue;
  // (claros: una mancha suave decide dónde hay pradera y dónde bosque)
  const claro = Math.sin(px / 173 + 1.3) * Math.cos(py / 131 - 0.4) + Math.sin((px + py) / 97);
  const cuanto = /Botánico|Zoológico/.test(nn) ? 0.9 : claro > 0.9 ? 0.25 : claro > 0.2 ? 0.6 : 0.88;
  if (t > cuanto) continue;
  if (enLago(px, py, 9) || enAvenida(px, py, 5) || enSendero(px, py, 5)) continue;
  ARBOLES.push([px, py, r, et]);
}
{ // las hileras de las avenidas
  const HILERA = /Sarmiento|Libertador|Infanta Isabel|Figueroa Alcorta|Casares|Iraola|Montt/;
  for (const [n, et, medio, P] of AVENIDAS) { if (!HILERA.test(n)) continue; let d = 0, prox = 6;
    for (let i = 0; i + 1 < P.length; i++) { const a = P[i], b = P[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 0.5) continue; const ux = (b[0] - a[0]) / l, uy = (b[1] - a[1]) / l;
      while (prox <= d + l) { const s = prox - d, cx = a[0] + ux * s, cy = a[1] + uy * s; prox += 16 / M;
        for (const lado of [-1, 1]) { const px = Math.round(cx - uy * lado * (medio + 3.5) / M), py = Math.round(cy + ux * lado * (medio + 3.5) / M); if (!etapaEn(px, py) || enLago(px, py, 6) || enAvenida(px, py, 2) || ARBOLES.some((q) => Math.abs(q[0] - px) < 9 && Math.abs(q[1] - py) < 9)) continue; ARBOLES.push([px, py, 4.2, Math.max(et, etapaEn(px, py))]); } }
      d += l; } }
}

// Los canteros de rosas del Rosedal (de 1914): redondeles entre los senderos, adentro del contorno del paseo.
const ROSALES = [];
{ const ros = PARQUES.find((p) => /Rosedal/.test(p[0]));
  if (ros) { const X = ros[2].map((p) => p[0]), Y = ros[2].map((p) => p[1]);
    for (let y = Math.min(...Y); y < Math.max(...Y); y += 20) for (let x = Math.min(...X); x < Math.max(...X); x += 20) { const px = Math.round(x + 10), py = Math.round(y + 10); if (!adentro(ros[2], px, py) || enSendero(px, py, 7.5) || enLago(px, py, 8)) continue; ROSALES.push([px, py, 3.6]); } } }
for (let i = ARBOLES.length - 1; i >= 0; i--) if (ROSALES.some((q) => Math.hypot(q[0] - ARBOLES[i][0], q[1] - ARBOLES[i][1]) < 14)) ARBOLES.splice(i, 1);

// ------------------------------------------------------------------------------------- los pabellones y el viaducto
// Las plantas de hoy de los edificios del Zoológico y de la Rural (fuentes/osm/palermo-edificios.json). En la Rural
// se dejan afuera los pabellones nuevos (Azul, Verde, Amarillo, el Auditorio y sus salas: son de este siglo).
const PABELLONES = [];
{ const zoo = MANO.find((p) => /Zoológico/.test(p[0]))[2], rural = MANO.find((p) => /Rural/.test(p[0]))[2];
  for (const e of JSON.parse(readFileSync('fuentes/osm/palermo-edificios.json', 'utf8')).elements) {
    const P = anillo(enPx(e.geometry), 1.2), c = centro(P), n = e.tags?.name ?? '';
    if (/Azul|Verde|Amarillo|Auditorio|Nogal|Oficinas/.test(n)) continue;
    const z = adentro(zoo, ...c) ? 'zoo' : adentro(rural, ...c) ? 'rural' : ''; if (!z || P.length < 3) continue;
    PABELLONES.push([z, e.tags?.building === 'grandstand' ? 'tribuna' : n, P.map(([x, y]) => [+x.toFixed(1), +y.toFixed(1)])]);
  }
  PABELLONES.sort((a, b) => area(b[2]) - area(a[2]));
}
// Las vías de hoy de los ferrocarriles Mitre y San Martín, del lado norte de la avenida Sarmiento: van en viaducto
// (src/viaducto.js da la altura). Cada tramo: [es un puente sobre una avenida, lleva rieles, los puntos [px, py, alto]].
// (Sin rieles van las dos vías por donde andan los trenes de Retiro: esas las dibuja src/tren.js.)
const VIADUCTOS = [];
{ const tren = LINEAS.find((l) => l.clave === 'retiro').pts, aTren = (p) => { let d = Infinity; for (let i = 0; i + 1 < tren.length; i++) d = Math.min(d, aSeg(p, tren[i], tren[i + 1])); return d; };
  for (const e of lee('vias')) {
    const t = e.tags ?? {}; if (!e.geometry || t.service || t.tunnel || !/Mitre|San Martín/.test(t.name ?? '') || t.bridge === 'viaduct') continue; // (los viaductos largos de hoy son de 2019)
    let P = enPx(e.geometry); if (!P.some(([x, y]) => x > 14900 && y < 5560)) continue;
    // un punto cada 12 px, y afuera lo que cae fuera del marco o antes de la rampa
    const Q = [P[0]]; for (let i = 0; i + 1 < P.length; i++) { const a = P[i], b = P[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 12)); for (let k = 1; k <= n; k++) Q.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]); }
    let tramo = []; const cierra = () => { if (tramo.length > 1) { const m = tramo[tramo.length >> 1]; VIADUCTOS.push([t.bridge ? 1 : 0, aTren(m) * M > 4.2 ? 1 : 0, tramo.map(([x, y]) => [+x.toFixed(1), +y.toFixed(1), +altoVia(x, y).toFixed(2)])]); } tramo = []; };
    for (const p of Q) { if (p[0] < BORDE_X && p[1] > 1262 && p[1] < 5560 && p[0] > 14900) tramo.push(p); else cierra(); } cierra();
  }
}
// (ni árboles debajo de las vías ni adentro de los pabellones)
{ const cerca = new Set(), celda = (x, y) => (Math.round(x / 12)) + ':' + (Math.round(y / 12));
  for (const [, , L] of VIADUCTOS) for (const [x, y] of L) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) cerca.add((Math.round(x / 12) + dx) + ':' + (Math.round(y / 12) + dy));
  const rural = MANO.find((p) => /Rural/.test(p[0]))[2];
  for (let i = ARBOLES.length - 1; i >= 0; i--) { const [x, y] = ARBOLES[i]; if (cerca.has(celda(x, y)) || adentro(rural, x, y) || Math.hypot(x - 17466, y - 3829) < 150 /* la cancha de GEBA (src/lugares/barrios.js) */ || PABELLONES.some(([, , P]) => Math.hypot(centro(P)[0] - x, centro(P)[1] - y) < 90 && (adentro(P, x, y) || P.some((q) => Math.hypot(q[0] - x, q[1] - y) < 9)))) ARBOLES.splice(i, 1); }
}

const J = (v) => JSON.stringify(v);
writeFileSync('src/palermo.js', `// Los parques de Palermo, en píxeles del plano de 1867 (x al norte, y al río). Lo escribe tools/palermo.mjs: no tocar
// a mano. Los contornos, los lagos, las avenidas y los senderos salen del mapa de hoy (© los colaboradores de
// OpenStreetMap, ODbL) y de lo calcado sobre el plano de Peuser de 1936; las etapas (1: 1888 … 6: 1940), de los planos
// de época. Lo usan tools/crece.mjs (los contornos) y src/lugares/palermo.js (todo).

/** Los contornos: [nombre, etapa en que entra, puntos]. */
export const PARQUES_PALERMO = ${J(PARQUES)};

/** Donde no se pintan las calles de hoy (el baldío de la avenida Centenario). */
export const BALDIOS_PALERMO = ${J([BALDIO, CERCO_67])};

/** Los lagos: [nombre, etapa, la orilla, las islas]. */
export const LAGOS_PALERMO = ${J(LAGOS)};

/** Las avenidas del parque: [nombre de hoy, etapa, medio ancho en metros, la línea]. */
export const AVENIDAS_PALERMO = ${J(AVENIDAS)};

/** Los senderos: [etapa, medio ancho en metros, la línea]. */
export const SENDEROS_PALERMO = ${J(SENDEROS)};

/** Los árboles: [px, py, radio, etapa]. */
export const ARBOLES_PALERMO = ${J(ARBOLES)};

/** Los puentes de los senderos sobre los lagos: [etapa, la línea]. */
export const PUENTES_PALERMO = ${J(PUENTES)};

/** Los canteros de rosas del Rosedal: [px, py, radio en metros]. */
export const ROSALES_PALERMO = ${J(ROSALES)};

/** Los pabellones del Zoológico y de la Rural, con la planta de hoy: ['zoo' | 'rural', nombre, puntos]. */
export const PABELLONES_PALERMO = ${J(PABELLONES)};

/** Las vías en viaducto: [puente sobre una avenida, lleva rieles, puntos [px, py, alto en metros]]. */
export const VIADUCTOS_PALERMO = ${J(VIADUCTOS)};

/** La pista del Hipódromo: el centro, el rumbo de las rectas, el medio largo de las rectas y el radio de las curvas (en píxeles). */
export const PISTA_PALERMO = ${J(PISTA)};
`);
console.log(`${PARQUES.length} contornos (${(PARQUES.reduce((s, p) => s + area(p[2]), 0) * M * M / 1e4).toFixed(0)} ha sin descontar lo encimado), ${LAGOS.length} lagos, ${AVENIDAS.length} tramos de avenida, ${SENDEROS.length} senderos, ${ARBOLES.length} árboles`);
if (process.argv.includes('--ver')) { mkdirSync('tmp', { recursive: true }); writeFileSync('tmp/palermo-ver.json', J([...PARQUES.map(([n, e, P]) => [n + ' ' + e, '#0a0', P]), ...LAGOS.map(([n, e, P]) => [n + ' ' + e, '#00f', P]), ...AVENIDAS.map(([n, e, , P]) => ['', '#f00', P, false]), ...SENDEROS.map(([, , P]) => ['', '#a50', P, false]), ['pista', '#f0f', Array.from({ length: 40 }, (_, i) => { const a = (i / 40) * Math.PI * 2, s = Math.cos(a) > 0 ? 1 : -1, lx = s * PISTA.largo + Math.cos(a) * PISTA.radio, ly = Math.sin(a) * PISTA.radio; return [PISTA.c[0] + lx * PISTA.u[0] - ly * PISTA.u[1], PISTA.c[1] + lx * PISTA.u[1] + ly * PISTA.u[0]]; })]])); }
