// El ajuste fino de la georreferencia: se calzan las calles de hoy (OpenStreetMap) contra las del plano.
// El centro no cambió de traza: una calle de 1867 sigue siendo calle. Así que, por ventanas de unas cuadras, se busca
// cuánto hay que correr las calles de hoy para que caigan sobre el papel que el plano deja entre las manzanas (y no
// sobre lo edificado). Cada ventana que calza da un par (lugar de hoy → lugar en el plano); con todos los pares se
// ajusta una transformación suave.  →  tools/geo.json  (lo lee tools/geo.mjs)
//   node tools/calce.mjs [--ver]   (--ver: tmp/calce.png, los corrimientos hallados)
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { PLANO } from './plano.mjs';
import { metros, grueso, ajustar, aplicar, conCampo, BASES, REFERENCIAS, USADAS, errorRef } from './geo.mjs';

const { data: cls, info } = await sharp('tmp/clases.png').extractChannel(0).raw().toBuffer({ resolveWithObject: true });
const w = info.width, h = info.height, M2 = PLANO.metro * 2; // 1 píxel de clases = 1,35 m
// cuánto vale que una calle de hoy pase por cada punto: papel suma, construido resta, lo demás (agua, letras) no cuenta
const val = new Int8Array(w * h);
for (let i = 0; i < w * h; i++) val[i] = cls[i] === 0 ? 1 : cls[i] <= 3 ? -1 : 0;

// las calles angostas de hoy (las avenidas se ensancharon, casi siempre de un solo lado: no sirven para calzar)
const SIRVEN = /^(residential|tertiary|unclassified|living_street|pedestrian)$/;
const pts = []; // [e, n] cada 4 m
for (const f of ['calles', 'avenidas']) for (const el of JSON.parse(readFileSync(`fuentes/osm/${f}.json`, 'utf8')).elements) {
  if (el.type !== 'way' || !el.geometry || !SIRVEN.test(el.tags?.highway ?? '') || el.tags.tunnel || el.tags.bridge) continue;
  let ant = null, resto = 0;
  for (const g of el.geometry) {
    const p = metros(g.lat, g.lon);
    if (ant) { const d = Math.hypot(p[0] - ant[0], p[1] - ant[1]); let t = resto; for (; t < d; t += 4) pts.push([ant[0] + ((p[0] - ant[0]) * t) / d, ant[1] + ((p[1] - ant[1]) * t) / d]); resto = t - d; }
    ant = p;
  }
}
console.log(pts.length, 'puntos de calle');

const CELDA = 420 / M2, PASO = CELDA / 2; // ventanas de 420 m, encimadas a medias
function calzar(f, radio) {
  // cada punto, en píxeles de clases, y a qué ventanas cae
  const px = new Float32Array(pts.length), py = new Float32Array(pts.length), vent = new Map();
  pts.forEach(([e, n], i) => {
    const [x, y] = f(e, n); px[i] = x / 2; py[i] = y / 2;
    const ci = Math.floor(px[i] / PASO), cj = Math.floor(py[i] / PASO);
    for (const a of [ci - 1, ci]) for (const b of [cj - 1, cj]) { const k = a + ',' + b; let v = vent.get(k); if (!v) vent.set(k, (v = [])); v.push(i); }
  });
  const D = 2 * radio + 1, pares = [];
  for (const [, ids] of vent) {
    if (ids.length < 250) continue;
    const sc = new Float32Array(D * D);
    for (const i of ids) {
      const x = Math.round(px[i]), y = Math.round(py[i]);
      if (x < radio || y < radio || x >= w - radio || y >= h - radio) continue;
      for (let dy = -radio; dy <= radio; dy++) { const o = (y + dy) * w + x, s = (dy + radio) * D + radio; for (let dx = -radio; dx <= radio; dx++) sc[s + dx] += val[o + dx]; }
    }
    let best = -1e9, bi = 0, sum = 0;
    for (let i = 0; i < D * D; i++) { sum += sc[i]; if (sc[i] > best) { best = sc[i]; bi = i; } }
    const n = ids.length, media = sum / (D * D), bx = (bi % D) - radio, by = Math.floor(bi / D) - radio;
    // tiene que ser un calce de verdad: casi todo sobre papel, mucho mejor que el promedio, y que se pierda al correrse
    // en cualquiera de los dos sentidos (una ventana con calles en un solo sentido no dice nada del otro)
    if (best / n < 0.72 || (best - media) / n < 0.3) continue;
    const en = (dx, dy) => { const x = bx + dx + radio, y = by + dy + radio; return x < 0 || y < 0 || x >= D || y >= D ? -1e9 : sc[y * D + x]; };
    if (Math.abs(bx) > radio - 9 || Math.abs(by) > radio - 9) continue;
    const cx = best - Math.max(en(-8, 0), en(8, 0)), cy = best - Math.max(en(0, -8), en(0, 8));
    if (cx / n < 0.22 || cy / n < 0.22) continue;
    // el pico es una meseta del ancho de la calle: se toma su centro
    const umbral = best - 0.12 * (best - media); let sx = 0, sy = 0, sw = 0;
    for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) { const v = en(dx, dy) - umbral; if (v > 0) { sx += v * dx; sy += v * dy; sw += v; } }
    let e = 0, nn = 0; for (const i of ids) { e += pts[i][0]; nn += pts[i][1]; } e /= n; nn /= n;
    const [x0, y0] = f(e, nn);
    pares.push([e, nn, x0 + 2 * (bx + sx / sw), y0 + 2 * (by + sy / sw), 1, 2 * (bx + sx / sw), 2 * (by + sy / sw)]);
  }
  return pares;
}
const resid = (pares, f) => pares.map(([e, n, x, y]) => { const [a, b] = f(e, n); return Math.hypot(a - x, b - y) * PLANO.metro; }).sort((a, b) => a - b);
const resumen = (r) => r.length ? `medio ${(r.reduce((a, b) => a + b, 0) / r.length).toFixed(1)} m · mediana ${r[r.length >> 1].toFixed(1)} · 90% ${r[Math.floor(r.length * 0.9)].toFixed(1)} · máximo ${r.at(-1).toFixed(1)}` : 'nada';
// El modelo: un afín (con las ventanas y, con poco peso, los edificios de referencia, que atan las afueras) y encima
// el promedio de lo que le erra a las ventanas vecinas (campana de SIGMA metros; lejos de toda ventana, nada).
const SIGMA = +arg('sigma', 350), FRENO = 0.35;
function arg(n, d) { const i = process.argv.indexOf('--' + n); return i < 0 ? d : process.argv[i + 1]; }
const anclas = USADAS.map((r) => [...metros(r[3], r[4]), r[1], r[2], 0.25]);
function hacer(pares, campo = true) {
  const g = { grado: 1, ...ajustar([...pares, ...anclas], BASES[1]), sigma: SIGMA, freno: FRENO, puntos: [] };
  if (campo) { const af = aplicar(g, BASES[1]); g.puntos = pares.map(([e, n, x, y]) => { const [a, b] = af(e, n); return [Math.round(e), Math.round(n), +(x - a).toFixed(2), +(y - b).toFixed(2)]; }); }
  return g;
}
// validación cruzada: se ajusta sin las ventanas de una zona y se mide en ellas
function cruzada(pares, campo, lado) {
  const out = [];
  for (let k = 0; k < 9; k++) {
    const zona = (p) => (((Math.floor(p[2] / lado) % 3) + 3) % 3) + 3 * (((Math.floor(p[3] / lado) % 3) + 3) % 3) === k;
    out.push(...resid(pares.filter(zona), conCampo(hacer(pares.filter((p) => !zona(p)), campo))));
  }
  return out.sort((a, b) => a - b);
}

let pares = calzar(grueso, 37), g = null;
console.log(pares.length, 'ventanas calzan. Con el ajuste de las referencias:', resumen(resid(pares, grueso)));
for (let vuelta = 0; vuelta < 4; vuelta++) {
  console.log(`  solo afín: ${resumen(resid(pares, conCampo(hacer(pares, false))))}`);
  console.log(`  afín + campo, cruzada por ventanas sueltas (zonas de 300 m): ${resumen(cruzada(pares, true, 300 / PLANO.metro))}`);
  console.log(`  afín + campo, cruzada por zonas de 700 m: ${resumen(cruzada(pares, true, 700 / PLANO.metro))}   (solo afín: ${resumen(cruzada(pares, false, 700 / PLANO.metro))})`);
  // fuera las ventanas que no calzan con sus vecinas
  const antes = pares.length;
  pares = pares.filter((p) => { const f = conCampo(hacer(pares.filter((o) => o !== p))); const [a, b] = f(p[0], p[1]); return Math.hypot(a - p[2], b - p[3]) * PLANO.metro < 14; });
  g = hacer(pares);
  console.log(`vuelta ${vuelta}: ${pares.length} ventanas (${antes - pares.length} descartadas)`);
  if (vuelta < 3) pares = calzar(conCampo(g), 14);
}
const f = conCampo(g);
console.log('\nreferencias (edificios), con el ajuste grueso → fino:');
for (const r of REFERENCIAS) console.log(`${USADAS.includes(r) ? ' ' : '×'} ${r[0].padEnd(38)} ${errorRef(r).toFixed(0).padStart(4)} → ${errorRef(r, f).toFixed(0).padStart(4)} m`);
const [mx0, my0, mx1, my1] = PLANO.marco;
console.log('cuánto se aparta del ajuste grueso en las esquinas y el centro del plano (m):');
for (const [x, y] of [[mx0, my0], [mx1, my0], [mx0, my1], [mx1, my1], [(mx0 + mx1) / 2, (my0 + my1) / 2]]) {
  // (el punto del mundo que el grueso manda a esa esquina)
  let e = 0, n = 0; for (let i = 0; i < 8; i++) { const [a, b] = grueso(e, n), [a1, b1] = grueso(e + 1, n), [a2, b2] = grueso(e, n + 1), A = a1 - a, B = a2 - a, C = b1 - b, Dd = b2 - b, det = A * Dd - B * C; e += (Dd * (x - a) - B * (y - b)) / det; n += (A * (y - b) - C * (x - a)) / det; }
  const [a, b] = f(e, n); console.log(`  [${x}, ${y}]  ${(Math.hypot(a - x, b - y) * PLANO.metro).toFixed(0)}`);
}
// (lo que queda después del último calce: cuánto habría que correr todavía cada ventana)
const fin = calzar(f, 14), r = fin.map((p) => Math.hypot(p[5], p[6]) * PLANO.metro).sort((a, b) => a - b);
console.log(`\ncalce final: ${fin.length} ventanas, lo que falta correr: ${resumen(r)}`);
writeFileSync(new URL('./geo.json', import.meta.url), JSON.stringify({ ...g, ventanas: pares.length, medio: +(r.reduce((a, b) => a + b, 0) / r.length).toFixed(1), maximo: +r.at(-1).toFixed(1) }));
if (process.argv.includes('--ver')) {
  // dónde calzó y para dónde corrió cada ventana (respecto del ajuste grueso)
  const S = 8, W = Math.ceil(PLANO.ancho / S), H = Math.ceil(PLANO.alto / S);
  const fl = pares.map(([e, n, x, y]) => { const [a, b] = grueso(e, n); return `<line x1="${a / S}" y1="${b / S}" x2="${(a + (x - a) * 6) / S}" y2="${(b + (y - b) * 6) / S}" stroke="#c00" stroke-width="2"/><circle cx="${a / S}" cy="${b / S}" r="3" fill="#00c"/>`; }).join('');
  await sharp('fuentes/plano-1867.jpg', { limitInputPixels: false }).resize(W, H).composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${fl}</svg>`) }]).png().toFile('tmp/calce.png');
}
