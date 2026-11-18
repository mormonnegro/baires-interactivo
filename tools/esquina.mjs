// Dónde queda una esquina de hoy en el plano de 1867: busca el cruce de dos calles del mapa de hoy (fuentes/osm) y lo
// da en píxeles del plano y en metros del mundo (x hacia el norte, z hacia el río, desde la plaza). Sirve para ubicar
// lo que se modela a mano (src/hitos.js, src/lugares/).
//   node tools/esquina.mjs "Avenida Corrientes" "Carlos Pellegrini" ["Otra calle" "Otra más" …]   (de a pares)
//   node tools/esquina.mjs --calle "Cerrito"        (lista las calles cuyo nombre contiene eso)
//   node tools/esquina.mjs --punto -34.6037 -58.3816  (una latitud y longitud)
import { readFileSync } from 'node:fs';
import { PLANO } from './plano.mjs';
import { aPlano } from './geo.mjs';
const lee = (f) => JSON.parse(readFileSync(`fuentes/osm/${f}.json`, 'utf8')).elements;
const nombradas = new Map();
for (const f of ['calles', 'avenidas']) for (const e of lee(f)) { const n = e.tags?.name; if (!n || !e.geometry) continue; if (!nombradas.has(n)) nombradas.set(n, []); nombradas.get(n).push(e.geometry.map((g) => aPlano(g.lat, g.lon))); }
const sale = ([x, y]) => `[${Math.round(x)}, ${Math.round(y)}] del plano · mundo x ${((x - PLANO.plaza[0]) * PLANO.metro).toFixed(0)}, z ${((y - PLANO.plaza[1]) * PLANO.metro).toFixed(0)}`;
const a = process.argv.slice(2);
if (a[0] === '--calle') { for (const n of [...nombradas.keys()].filter((n) => n.toLowerCase().includes(a[1].toLowerCase())).sort()) console.log(n); process.exit(0); }
if (a[0] === '--punto') { console.log(sale(aPlano(+a[1], +a[2]))); process.exit(0); }
const tramos = (n) => { const t = nombradas.get(n); if (!t) { console.log(`no hay calle «${n}» (probá --calle)`); process.exit(1); } return t; };
for (let i = 0; i + 1 < a.length; i += 2) {
  const hallados = [];
  for (const A of tramos(a[i])) for (const B of tramos(a[i + 1])) for (let p = 0; p + 1 < A.length; p++) for (let q = 0; q + 1 < B.length; q++) {
    const [x1, y1] = A[p], [x2, y2] = A[p + 1], [x3, y3] = B[q], [x4, y4] = B[q + 1], den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4); if (Math.abs(den) < 1e-9) continue;
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den, u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den, la = Math.hypot(x2 - x1, y2 - y1), lb = Math.hypot(x4 - x3, y4 - y3);
    if (t >= -8 / la && t <= 1 + 8 / la && u >= -8 / lb && u <= 1 + 8 / lb) { const P = [x1 + t * (x2 - x1), y1 + t * (y2 - y1)]; if (!hallados.some((h) => Math.hypot(h[0] - P[0], h[1] - P[1]) < 30)) hallados.push(P); }
  }
  console.log(`${a[i]} y ${a[i + 1]}: ${hallados.length ? hallados.map(sale).join('  |  ') : 'no se cruzan'}`);
}
