// Los nombres de las calles de hoy, para escribirlos sobre el plano al acercarse con «lo de hoy» prendido.
// De cada calle con nombre (OpenStreetMap, fuentes/osm/) se toma cada cuadra —el tramo entre dos esquinas— y se deja
// un ancla en el medio, con la dirección de la calle ahí y el largo del tramo.
//   → public/datos/calles.bin   6 enteros de 16 bits por ancla: x, y (píxeles del plano), ángulo (0..65535 = 0..π),
//                               nombre (índice), largo del tramo en metros, clase (1: avenida, 0: calle)
//   → public/datos/calles.json  los nombres
// Las anclas van ordenadas por importancia (avenidas primero, tramos largos primero): ese orden decide quién gana
// cuando dos nombres no entran.     node tools/calles.mjs
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { PLANO } from './plano.mjs';
import { aPlano, metros } from './geo.mjs';

const leer = (n) => JSON.parse(readFileSync(`fuentes/osm/${n}.json`, 'utf8')).elements;
const AVENIDA = /^(motorway|trunk|primary|secondary|tertiary)$/;
const prolijo = (s) => s.replace(/\s+/g, ' ').trim().replace(/^Avenida /, 'Av. ').replace(/^Pasaje /, 'Pje. ').replace(/^Boulevard /, 'Bv. ').replace(/^Autopista /, 'Au. ');

// --- las calles, juntadas por nombre: nodos (por sus coordenadas) y tramos entre nodos ---
const calles = new Map(); // nombre → { clase, ady: Map(nodo → [nodos vecinos]) }
const pos = new Map(), enNodo = new Map(); // nodo → [lat, lon] ; nodo → nombres que pasan por ahí
for (const w of [...leer('avenidas'), ...leer('calles')]) {
  const t = w.tags ?? {};
  if (!t.name || !w.geometry || w.geometry.length < 2 || /_link$/.test(t.highway)) continue;
  const nombre = prolijo(t.name);
  let c = calles.get(nombre); if (!c) calles.set(nombre, (c = { clase: 0, ady: new Map() }));
  if (AVENIDA.test(t.highway)) c.clase = 1;
  let antes = null;
  for (const g of w.geometry) {
    const k = g.lat + ',' + g.lon;
    if (!pos.has(k)) pos.set(k, [g.lat, g.lon]);
    let s = enNodo.get(k); if (!s) enNodo.set(k, (s = new Set())); s.add(nombre);
    if (!c.ady.has(k)) c.ady.set(k, []);
    if (antes && antes !== k) { c.ady.get(k).push(antes); c.ady.get(antes).push(k); }
    antes = k;
  }
}
const esquina = (k) => enNodo.get(k).size > 1;

// --- cada cuadra: de un corte (esquina, punta o bifurcación) al siguiente ---
const [mx0, my0, mx1, my1] = PLANO.interior ?? PLANO.marco;
const nombres = [...calles.keys()].sort((a, b) => a.localeCompare(b, 'es')), idx = new Map(nombres.map((n, i) => [n, i]));
let anclas = [];
for (const [nombre, c] of calles) {
  const corte = (k) => esquina(k) || c.ady.get(k).length !== 2, hecho = new Set();
  const tramo = (a, b) => { // camina desde a por b hasta el próximo corte
    const cam = [a, b]; hecho.add(a + '>' + b); hecho.add(b + '>' + a);
    while (!corte(cam.at(-1))) { const v = c.ady.get(cam.at(-1)), sig = v[0] === cam.at(-2) ? v[1] : v[0]; if (sig === cam[0] || cam.length > 4000) break; hecho.add(cam.at(-1) + '>' + sig); hecho.add(sig + '>' + cam.at(-1)); cam.push(sig); }
    return cam;
  };
  const caminos = [];
  for (const [k, v] of c.ady) if (corte(k)) for (const b of v) if (!hecho.has(k + '>' + b)) caminos.push(tramo(k, b));
  for (const [k, v] of c.ady) for (const b of v) if (!hecho.has(k + '>' + b)) caminos.push(tramo(k, b)); // (vueltas cerradas, sin cortes)
  for (const cam of caminos) {
    const P = cam.map((k) => metros(...pos.get(k))), acum = [0];
    for (let i = 1; i < P.length; i++) acum.push(acum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const L = acum.at(-1); if (L < 42) continue; // (no entra ni un nombre corto)
    const en = (s) => { let i = 1; while (i < P.length - 1 && acum[i] < s) i++; const f = (s - acum[i - 1]) / (acum[i] - acum[i - 1] || 1); const [la, lo] = pos.get(cam[i - 1]), [lb, lob] = pos.get(cam[i]); return aPlano(la + (lb - la) * f, lo + (lob - lo) * f); };
    const m = en(L / 2), a = en(Math.max(0, L / 2 - 18)), b = en(Math.min(L, L / 2 + 18));
    if (m[0] < mx0 || m[1] < my0 || m[0] > mx1 || m[1] > my1) continue;
    // (qué tan derecho es el tramo: en una curva cerrada el nombre quedaría cruzado)
    const p0 = en(0), p1 = en(L), cuerda = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) * PLANO.metro;
    if (cuerda < L * 0.8) continue;
    let ang = Math.atan2(b[1] - a[1], b[0] - a[0]); if (ang < 0) ang += Math.PI; if (ang >= Math.PI) ang -= Math.PI;
    anclas.push({ x: m[0], y: m[1], ang, n: idx.get(nombre), L, clase: c.clase });
  }
}
// las calzadas dobles dan dos anclas casi encimadas con el mismo nombre: queda la del tramo más largo
anclas.sort((a, b) => b.clase - a.clase || b.L - a.L);
{
  const C = 60 / PLANO.metro, celdas = new Map(), quedan = [];
  for (const a of anclas) {
    const cx = Math.floor(a.x / C), cy = Math.floor(a.y / C); let repetida = false;
    for (let j = cy - 1; j <= cy + 1 && !repetida; j++) for (let i = cx - 1; i <= cx + 1 && !repetida; i++) for (const o of celdas.get(i + ',' + j) ?? []) if (o.n === a.n && Math.hypot(o.x - a.x, o.y - a.y) < C) { repetida = true; break; }
    if (repetida) continue;
    const k = cx + ',' + cy; if (!celdas.has(k)) celdas.set(k, []); celdas.get(k).push(a); quedan.push(a);
  }
  anclas = quedan;
}
// (solo los nombres que se usan)
const usados = [...new Set(anclas.map((a) => a.n))].sort((a, b) => a - b), nuevo = new Map(usados.map((n, i) => [n, i]));
const out = new Uint16Array(anclas.length * 6);
anclas.forEach((a, i) => out.set([Math.round(a.x), Math.round(a.y), Math.min(65535, Math.round((a.ang / Math.PI) * 65536)), nuevo.get(a.n), Math.min(65535, Math.round(a.L)), a.clase], i * 6));
writeFileSync('public/datos/calles.bin', Buffer.from(out.buffer));
writeFileSync('public/datos/calles.json', JSON.stringify(usados.map((n) => nombres[n])));
console.log(anclas.length, 'anclas (', anclas.filter((a) => a.clase).length, 'de avenidas ),', usados.length, 'nombres ·', (statSync('public/datos/calles.bin').size / 1e3).toFixed(0), 'kB +', (statSync('public/datos/calles.json').size / 1e3).toFixed(0), 'kB');
