// Los patios, para el modo en color: árboles y aljibes sembrados en los fondos de las manzanas. El plano no los
// dibuja (raya el fondo y nada más), así que son inventados y solo se ven en color: src/patios.js.
// Lee tmp/clases.png (lo que dejó tools/1-clases.mjs: 1 píxel = 1,35 m, clase 2 = patio o fondo) y busca dónde hay
// lugar: adentro de una manzana, sobre patio, lejos de las paredes y de los techos que levantó tools/2-ciudad.mjs,
// fuera del río (public/plano/suelo.webp, de tools/hoy.mjs --suelo) y lejos de los árboles que el plano sí dibuja.
// Todo sale de una semilla fija: dos corridas dan el mismo archivo.
//   node --max-old-space-size=4000 tools/patios.mjs  →  public/datos/patios.pak  (y tmp/patios-ver.jpg para mirar)
//   formato, ya descomprimido (gzip):  [cuántos, uint32][por planos, como ciudad.pak: 6 bytes por registro]
//   registro: x, y (uint16, píxeles del plano) · radio (uint8, decímetros; 0 = aljibe) · suerte (uint8: de ahí salen
//             la forma y el tono de cada árbol, y cuáles se dejan de lado en un teléfono: los de suerte más alta)
import sharp from 'sharp';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { PLANO, CARTELES, RESERVAS } from './plano.mjs';

const TOPE = 30000; // árboles, como mucho
const SEMILLA = 1867;
const { data: cls, info } = await sharp('tmp/clases.png').extractChannel(0).raw().toBuffer({ resolveWithObject: true });
const w = info.width, h = info.height, MPP = PLANO.metro * 2;
// una suerte fija para cada par de enteros: 0..1
const suerte = (a, b, c = 0) => { let t = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + SEMILLA, 0xc2b2ae35) ^ Math.imul(c + 1, 0x27d4eb2f); t = Math.imul(t ^ (t >>> 15), 0x2c1b3c6d); t = Math.imul(t ^ (t >>> 12), 0x297a2d39); return ((t ^ (t >>> 15)) >>> 0) / 4294967296; };
/** ruido suave (para que haya patios pelados y otros tupidos) */
const ruido = (x, y, paso, c) => { const fx = x / paso, fy = y / paso, i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j, a = u * u * (3 - 2 * u), b = v * v * (3 - 2 * v); return (suerte(i, j, c) * (1 - a) + suerte(i + 1, j, c) * a) * (1 - b) + (suerte(i, j + 1, c) * (1 - a) + suerte(i + 1, j + 1, c) * a) * b; };

// ------------------------------------------------------------------------------------------------ dónde hay lugar
const mz = new Float32Array(readFileSync('public/datos/manzanas.bin').buffer.slice(0)), techos = new Uint16Array(readFileSync('public/datos/techos.bin').buffer.slice(0));
const plan = new Float32Array(readFileSync('public/datos/arboles.bin').buffer.slice(0)), meta = JSON.parse(readFileSync('public/datos/ciudad.json', 'utf8'));
// adentro de qué manzana cae cada píxel (0: en ninguna, o sea en la calle o en el campo)
const dentro = new Int32Array(w * h);
for (let b = 0; b < mz.length / 10; b++) {
  const Q = [0, 1, 2, 3].map((q) => [mz[b * 10 + q * 2] / 2, mz[b * 10 + q * 2 + 1] / 2]);
  const y0 = Math.max(0, Math.ceil(Math.min(...Q.map((p) => p[1])))), y1 = Math.min(h - 1, Math.floor(Math.max(...Q.map((p) => p[1]))));
  for (let y = y0; y <= y1; y++) {
    const xs = [];
    for (let i = 0, j = 3; i < 4; j = i++) { const [xi, yi] = Q[i], [xj, yj] = Q[j]; if ((yi > y) !== (yj > y)) xs.push(((xj - xi) * (y - yi)) / (yj - yi) + xi); }
    xs.sort((a, c) => a - c);
    for (let s = 0; s + 1 < xs.length; s += 2) for (let x = Math.max(0, Math.ceil(xs[s])); x <= Math.min(w - 1, xs[s + 1]); x++) dentro[y * w + x] = b + 1;
  }
}
// los techos, tal como quedaron levantados (en celdas de 1 m de su manzana)
const techo = new Uint8Array(w * h);
for (let i = 0; i < techos.length / 8; i++) {
  const k = i * 8, b = techos[k] * 10, nu = mz[b + 8], nv = mz[b + 9];
  for (let v = techos[k + 2]; v <= techos[k + 4]; v += 0.5) for (let u = techos[k + 1]; u <= techos[k + 3]; u += 0.5) {
    const s = u / nu, t = v / nv, a = (1 - s) * (1 - t), c = s * (1 - t), d = s * t, e = (1 - s) * t;
    const x = Math.round((a * mz[b] + c * mz[b + 2] + d * mz[b + 4] + e * mz[b + 6]) / 2), y = Math.round((a * mz[b + 1] + c * mz[b + 3] + d * mz[b + 5] + e * mz[b + 7]) / 2);
    if (x >= 0 && y >= 0 && x < w && y < h) techo[y * w + x] = 1;
  }
}
// el río de 1867
const rio = await sharp('public/plano/suelo.webp').extractChannel(0).resize(w, h, { fit: 'fill', kernel: 'nearest' }).raw().toBuffer();
// lo que se levanta a mano (y las iglesias)
const reservado = new Uint8Array(w * h);
for (const [x0, y0, x1, y1] of [...RESERVAS, ...CARTELES]) for (let y = (y0 >> 1) - 3; y <= (y1 >> 1) + 3; y++) for (let x = (x0 >> 1) - 3; x <= (x1 >> 1) + 3; x++) reservado[y * w + x] = 1;
for (const g of meta.iglesias) { const r = Math.ceil(Math.hypot(g.largo, g.ancho) / 4) + 4; for (let y = Math.round(g.y / 2) - r; y <= Math.round(g.y / 2) + r; y++) for (let x = Math.round(g.x / 2) - r; x <= Math.round(g.x / 2) + r; x++) { const dx = x - g.x / 2, dy = y - g.y / 2; if (Math.abs(dx * g.ux + dy * g.uy) <= g.largo / 4 + 3 && Math.abs(-dx * g.uy + dy * g.ux) <= g.ancho / 4 + 3) reservado[y * w + x] = 1; } }

const [fx0, fy0, fx1, fy1] = PLANO.marco.map((v) => v / 2);
const libre = new Uint8Array(w * h);
let area = 0;
for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
  const k = y * w + x;
  if (cls[k] === 2 && dentro[k] && !techo[k] && rio[k] < 128 && !reservado[k] && x > fx0 && x < fx1 && y > fy0 && y < fy1) { libre[k] = 1; area++; }
}
// a cuántos metros está la pared (o la calle, o el techo) más cercana: dos pasadas, ida y vuelta
const pared = new Float32Array(w * h), D1 = MPP, D2 = MPP * Math.SQRT2;
for (let k = 0; k < w * h; k++) pared[k] = libre[k] ? 1e9 : 0;
for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const k = y * w + x; if (pared[k] > 0) pared[k] = Math.min(pared[k], pared[k - 1] + D1, pared[k - w] + D1, pared[k - w - 1] + D2, pared[k - w + 1] + D2); }
for (let y = h - 2; y > 0; y--) for (let x = w - 2; x > 0; x--) { const k = y * w + x; if (pared[k] > 0) pared[k] = Math.min(pared[k], pared[k + 1] + D1, pared[k + w] + D1, pared[k + w + 1] + D2, pared[k + w - 1] + D2); }

// ---------------------------------------------------------------------------------------------------- cada patio
// (un patio: una mancha de fondo de una sola pieza. De cada uno se anota el tamaño y su punto más metido adentro.)
const patio = new Int32Array(w * h).fill(-1), patios = [], pila = new Int32Array(w * h);
for (let s = 0; s < w * h; s++) {
  if (!libre[s] || patio[s] >= 0) continue;
  let n = 0, i = 0, mejor = s; pila[n++] = s; patio[s] = patios.length;
  while (i < n) { const k = pila[i++]; if (pared[k] > pared[mejor]) mejor = k; for (const v of [k - 1, k + 1, k - w, k + w]) if (libre[v] && patio[v] < 0) { patio[v] = patios.length; pila[n++] = v; } }
  patios.push({ n, x: mejor % w, y: (mejor / w) | 0, fondo: pared[mejor] });
}

// lo ya puesto, en una grilla, para que nada quede encimado: [x, y, radio] en píxeles de clases
const CELDA = 8, gw = Math.ceil(w / CELDA), puestos = new Map();
const anotar = (x, y, r) => { const key = ((y / CELDA) | 0) * gw + ((x / CELDA) | 0); let c = puestos.get(key); if (!c) puestos.set(key, (c = [])); c.push(x, y, r); };
/** ¿entra algo de radio r (más un aire) en (x, y)? */
const entra = (x, y, r, aire) => {
  const cx = (x / CELDA) | 0, cy = (y / CELDA) | 0;
  for (let j = cy - 1; j <= cy + 1; j++) for (let i = cx - 1; i <= cx + 1; i++) { const c = puestos.get(j * gw + i); if (c) for (let q = 0; q < c.length; q += 3) if (Math.hypot(c[q] - x, c[q + 1] - y) < (c[q + 2] + r) * aire) return false; }
  return true;
};
// los árboles del plano ya están: ahí no va nada (su radio, como lo dibuja src/ciudad.js)
for (let i = 0; i < plan.length / 3; i++) anotar(plan[i * 3] / 2, plan[i * 3 + 1] / 2, Math.min(7, Math.max(2.2, plan[i * 3 + 2] * PLANO.metro * 1.15)) / MPP);

// --- los aljibes: cada tanto, en el medio de un patio grande (y no más de dos por manzana) ---
const salida = [], porManzana = new Map();
let nAljibes = 0;
patios.forEach((p, i) => {
  if (p.n * MPP * MPP < 260 || p.fondo < 5 || suerte(p.x, p.y, 11) > 0.42) return;
  const b = dentro[p.y * w + p.x], ya = porManzana.get(b) ?? 0; if (ya >= 2) return;
  // (corrido un poco del medio justo, pero sin arrimarse a la pared)
  let x = p.x + (suerte(i, 3, 12) - 0.5) * 3, y = p.y + (suerte(i, 4, 12) - 0.5) * 3;
  if (pared[Math.round(y) * w + Math.round(x)] < 4) { x = p.x; y = p.y; }
  porManzana.set(b, ya + 1); anotar(x, y, 2.6 / MPP); salida.push([x * 2, y * 2, 0, Math.floor(suerte(i, 5, 12) * 256)]); nAljibes++;
});

// --- los árboles: se prueba un lugar por cada casilla de 4 m, y queda si hay patio, aire y suerte ---
const PASO = 3, candidatos = [];
for (let j = 0; j < h / PASO; j++) for (let i = 0; i < w / PASO; i++) {
  const x = (i + suerte(i, j, 1)) * PASO, y = (j + suerte(i, j, 2)) * PASO, k = Math.round(y) * w + Math.round(x);
  if (!libre[k]) continue;
  const d = pared[k], p = patios[patio[k]];
  // cuánto arbolado hay acá: por zonas (hay barrios de huertas y barrios pelados), por patio, y menos en el medio de
  // un fondo muy grande (las quintas: el árbol va cerca de la casa y del cerco, el resto es tierra labrada)
  const zona = ruido(x, y, 150, 5), lugar = ruido(x, y, 22, 6);
  const propio = suerte(p.x, p.y, 7);
  let cuanto = 0.035 + 0.5 * Math.min(1, Math.max(0, (zona * 0.5 + lugar * 0.5 - 0.36) * 3)) * (0.12 + 0.88 * propio * propio);
  cuanto *= 1 - 0.75 * Math.min(1, Math.max(0, (d - 14) / 26));
  if (suerte(i, j, 3) > cuanto) continue;
  // el tamaño: los más, chicos (frutales, parras); cada tanto uno grande, si el patio da
  const g = suerte(i, j, 4); let r = 1.5 + 1.3 * g + (g > 0.8 ? (g - 0.8) * 9 : 0);
  r = Math.min(r, (d - 0.5) / 0.8); if (r < 1.35) continue;
  candidatos.push([suerte(i, j, 8), x, y, r]);
}
// (en el orden de la suerte, no en el del barrido: así no quedan en hileras)
candidatos.sort((a, b) => a[0] - b[0]);
let nArboles = 0;
for (const [s, x, y, r] of candidatos) {
  if (nArboles >= TOPE) break;
  if (!entra(x, y, r / MPP, 1.08)) continue;
  anotar(x, y, r / MPP); salida.push([x * 2, y * 2, Math.round(r * 10), Math.floor(suerte(Math.round(x * 8), Math.round(y * 8), 9) * 256)]); nArboles++;
}

// ------------------------------------------------------------------------------------------------------ a guardar
// ordenados por zona (así los bytes vecinos se parecen y comprimen mejor), y por planos
salida.sort((a, b) => (Math.floor(a[1] / 512) - Math.floor(b[1] / 512)) || (Math.floor(a[0] / 512) - Math.floor(b[0] / 512)) || a[1] - b[1] || a[0] - b[0]);
const n = salida.length, REG = 6, crudo = Buffer.alloc(n * REG), cuerpo = Buffer.alloc(4 + n * REG);
salida.forEach(([x, y, r, s], i) => { crudo.writeUInt16LE(Math.round(x), i * REG); crudo.writeUInt16LE(Math.round(y), i * REG + 2); crudo[i * REG + 4] = r; crudo[i * REG + 5] = s; });
cuerpo.writeUInt32LE(n, 0);
for (let k = 0; k < REG; k++) for (let i = 0; i < n; i++) cuerpo[4 + k * n + i] = crudo[i * REG + k];
writeFileSync('public/datos/patios.pak', gzipSync(cuerpo, { level: 9 }));
console.log(`patios: ${patios.length} manchas de fondo, ${(area * MPP * MPP / 1e4).toFixed(0)} ha`);
console.log(`${nArboles} árboles (de ${candidatos.length} lugares posibles; tope ${TOPE}) y ${nAljibes} aljibes`);
console.log('public/datos/patios.pak', (statSync('public/datos/patios.pak').size / 1024).toFixed(0), 'KB  (sin comprimir:', (cuerpo.length / 1024).toFixed(0), 'KB)');

// para mirar: el centro, con el patio en claro, lo edificado en oscuro y lo sembrado encima
{
  const X0 = Math.round(PLANO.plaza[0] / 2) - 700, Y0 = Math.round(PLANO.plaza[1] / 2) - 700, T = 1400, Z = 2, img = Buffer.alloc(T * Z * T * Z * 3);
  for (let y = 0; y < T * Z; y++) for (let x = 0; x < T * Z; x++) { const k = (Y0 + ((y / Z) | 0)) * w + X0 + ((x / Z) | 0), o = (y * T * Z + x) * 3, c = libre[k] ? [214, 196, 150] : techo[k] ? [150, 90, 70] : cls[k] === 2 ? [190, 190, 160] : [236, 228, 208]; img[o] = c[0]; img[o + 1] = c[1]; img[o + 2] = c[2]; }
  for (const [x, y, r] of salida) {
    const cx = (x / 2 - X0) * Z, cy = (y / 2 - Y0) * Z, R = r ? (r / 10 / MPP) * Z : 2.5, c = r ? [40, 110, 40] : [30, 60, 200];
    for (let j = Math.floor(cy - R); j <= cy + R; j++) for (let i = Math.floor(cx - R); i <= cx + R; i++) if (i >= 0 && j >= 0 && i < T * Z && j < T * Z && Math.hypot(i - cx, j - cy) <= R) { const o = (j * T * Z + i) * 3; img[o] = c[0]; img[o + 1] = c[1]; img[o + 2] = c[2]; }
  }
  await sharp(img, { raw: { width: T * Z, height: T * Z, channels: 3 } }).jpeg({ quality: 86 }).toFile('tmp/patios-ver.jpg');
}
