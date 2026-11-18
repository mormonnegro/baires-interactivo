// Paso 2: del rayado a la ciudad. Lee tmp/clases.png (lo que dejó el paso 1) y arma:
//   - las manzanas: cada mancha de tinta rayada, con sus cuatro lados ajustados a rectas;
//   - los lotes: el borde edificado de cada manzana se reparte en casas a lo largo de la calle. El fondo de cada casa
//     es el que dibuja el plano en ese lugar; el ancho del frente es inventado (el plano no trae las medianeras),
//     con las medidas de la época: 10 varas (8,66 m) y sus múltiplos;
//   - las construcciones sueltas de las afueras, las casillas, los árboles que el plano dibuja uno por uno (lo chico
//     se lee en el escaneo entero: tools/chicas.mjs), y las iglesias.
// Todo queda en coordenadas de cada manzana (celdas de 1 m) para que el archivo sea chico: public/datos/*.bin
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { PLANO, AGUA, CARTELES, RESERVAS, NO_IGLESIAS, IGLESIAS } from './plano.mjs';
import { chicas } from './chicas.mjs';
import { OBJETIVO, zonaDeManzana, claseDe, repartir, cuadro, azar } from './alturas.mjs';

const PAPEL = 0, EDIF = 1, PATIO = 2, MACIZO = 3, OTRO = 4;
const { data: cls, info } = await sharp('tmp/clases.png').extractChannel(0).raw().toBuffer({ resolveWithObject: true });
const tono = await sharp('tmp/tono.png').extractChannel(0).raw().toBuffer();
const w = info.width, h = info.height, MPP = PLANO.metro * 2; // metros por píxel de clases
const rng = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const t0 = Date.now(), lap = (s) => console.log(`${((Date.now() - t0) / 1000).toFixed(1)}s  ${s}`);

// ------------------------------------------------------------------------------------------------ máscaras del plano
const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const erode = (m) => { const o = new Uint8Array(w * h); for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const k = y * w + x; o[k] = m[k] & m[k - 1] & m[k + 1] & m[k - w] & m[k + w] & m[k - w - 1] & m[k - w + 1] & m[k + w - 1] & m[k + w + 1]; } return o; };
const dilate = (m) => { const o = new Uint8Array(w * h); for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const k = y * w + x; o[k] = m[k] | m[k - 1] | m[k + 1] | m[k - w] | m[k + w] | m[k - w - 1] | m[k - w + 1] | m[k + w - 1] | m[k + w + 1]; } return o; };

// fuera del marco, y los carteles grandes: papel
const [fx0, fy0, fx1, fy1] = PLANO.marco.map((v) => v / 2);
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < fx0 || x > fx1 || y < fy0 || y > fy1) cls[y * w + x] = PAPEL;
for (const [x0, y0, x1, y1] of CARTELES) for (let y = y0 >> 1; y < y1 >> 1; y++) for (let x = x0 >> 1; x < x1 >> 1; x++) cls[y * w + x] = PAPEL;

// el agua: la tinta sin ritmo que se toca con el río. (Las olas están dibujadas a mano: el paso 1 las deja como "otra tinta".)
const agua = new Uint8Array(w * h);
{
  const poly = AGUA.map(([x, y]) => [x / 2, y / 2]);
  let bx0 = w, by0 = h, bx1 = 0, by1 = 0;
  for (const [x, y] of poly) { bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); }
  const otro = new Uint8Array(w * h);
  for (let k = 0; k < w * h; k++) otro[k] = cls[k] === OTRO || cls[k] === MACIZO ? 1 : 0;
  const firme = erode(otro), stack = [];
  for (let y = Math.max(1, by0 | 0); y < Math.min(h - 1, by1); y++) {
    // (por renglón: dónde entra y dónde sale del polígono)
    const xs = [];
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y)) xs.push(((xj - xi) * (y - yi)) / (yj - yi) + xi); }
    xs.sort((a, b) => a - b);
    for (let s = 0; s + 1 < xs.length; s += 2) for (let x = Math.max(1, Math.ceil(xs[s])); x < Math.min(w - 1, xs[s + 1]); x++) { const k = y * w + x; if (cls[k] !== PAPEL) { agua[k] = 1; if (firme[k]) stack.push(k); } }
  }
  const seen = new Uint8Array(w * h);
  for (const k of stack) seen[k] = 1;
  while (stack.length) { const k = stack.pop(); for (const n of [k - 1, k + 1, k - w, k + w]) if (firme[n] && !seen[n]) { seen[n] = 1; stack.push(n); } }
  const mojado = dilate(dilate(seen));
  for (let k = 0; k < w * h; k++) if (mojado[k] && cls[k] !== EDIF) agua[k] = 1;
  for (let k = 0; k < w * h; k++) if (agua[k]) cls[k] = PAPEL;
}
lap('agua');

// "otra tinta" gruesa: lo que queda después de borrar todo lo que tenga menos de 5 píxeles de ancho (letras, cercos, líneas)
const grueso = (() => { const o = new Uint8Array(w * h); for (let k = 0; k < w * h; k++) o[k] = cls[k] === OTRO || cls[k] === MACIZO ? 1 : 0; return dilate(dilate(erode(erode(o)))); })();
// tinta, y la tinta sin hilos: lo que une dos manzanas por una letra o una raya se corta
const tinta = new Uint8Array(w * h);
for (let k = 0; k < w * h; k++) tinta[k] = cls[k] !== PAPEL ? 1 : 0;
const firme = dilate(erode(tinta));
for (let k = 0; k < w * h; k++) firme[k] &= tinta[k];
lap('máscaras');

// ------------------------------------------------------------------------------------------------------- las manchas
const label = new Int32Array(w * h).fill(-1), comps = [];
{
  const q = new Int32Array(w * h);
  for (let s = 0; s < w * h; s++) {
    if (!firme[s] || label[s] >= 0) continue;
    const id = comps.length; let head = 0, tail = 0; q[tail++] = s; label[s] = id;
    const c = { id, n: 0, x0: w, y0: h, x1: 0, y1: 0, nE: 0, nP: 0, nM: 0, nO: 0, sx: 0, sy: 0, start: s };
    while (head < tail) {
      const k = q[head++], x = k % w, y = (k / w) | 0, v = cls[k];
      c.n++; c.sx += x; c.sy += y; if (x < c.x0) c.x0 = x; if (x > c.x1) c.x1 = x; if (y < c.y0) c.y0 = y; if (y > c.y1) c.y1 = y;
      if (v === EDIF) c.nE++; else if (v === PATIO) c.nP++; else if (v === MACIZO) c.nM++; else c.nO++;
      if (x > 0 && firme[k - 1] && label[k - 1] < 0) { label[k - 1] = id; q[tail++] = k - 1; }
      if (x < w - 1 && firme[k + 1] && label[k + 1] < 0) { label[k + 1] = id; q[tail++] = k + 1; }
      if (y > 0 && firme[k - w] && label[k - w] < 0) { label[k - w] = id; q[tail++] = k - w; }
      if (y < h - 1 && firme[k + w] && label[k + w] < 0) { label[k + w] = id; q[tail++] = k + w; }
    }
    comps.push(c);
  }
}
lap(`${comps.length} manchas`);

// ----------------------------------------------------------------------------------------------- ajustar cuatro lados
const hull = (pts) => { // (x, y) ordenados; cadena monótona
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  lo.pop(); up.pop(); return lo.concat(up);
};
function borde(c) { const out = []; for (let y = c.y0; y <= c.y1; y++) for (let x = c.x0; x <= c.x1; x++) { const k = y * w + x; if (label[k] !== c.id) continue; if (label[k - 1] !== c.id || label[k + 1] !== c.id || label[k - w] !== c.id || label[k + w] !== c.id) out.push([x, y]); } return out; }
/** Las cuatro esquinas de la mancha (en píxeles de clases), en orden, y cuánto se parece la mancha a ese cuadrilátero. */
function cuatroLados(c) {
  const B = borde(c);
  let H = hull(B.map((p) => [p[0], p[1]]));
  if (H.length < 4) return null;
  // quitar de a uno el vértice que menos aporta, hasta que queden cuatro
  const tri = (a, b, d) => Math.abs((b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]));
  H = H.slice();
  while (H.length > 4) { let best = 0, bv = Infinity; for (let i = 0; i < H.length; i++) { const v = tri(H[(i + H.length - 1) % H.length], H[i], H[(i + 1) % H.length]); if (v < bv) { bv = v; best = i; } } H.splice(best, 1); }
  // cada lado: la recta que mejor pasa por los puntos del borde que le tocan
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
  // (el centro de un píxel del borde está medio píxel adentro: correr cada recta medio píxel hacia afuera)
  const cx = c.sx / c.n, cy = c.sy / c.n;
  for (const l of lines) { let nx = l.uy, ny = -l.ux; if ((l.px - cx) * nx + (l.py - cy) * ny < 0) { nx = -nx; ny = -ny; } l.px += nx * 0.5 + 0.5; l.py += ny * 0.5 + 0.5; }
  const Q = [];
  for (let i = 0; i < 4; i++) { const a = lines[(i + 3) % 4], b = lines[i], det = a.ux * b.uy - a.uy * b.ux; if (Math.abs(det) < 1e-6) return null; const t = ((b.px - a.px) * b.uy - (b.py - a.py) * b.ux) / det; Q.push([a.px + a.ux * t, a.py + a.uy * t]); }
  // parecido: píxeles de la mancha dentro del cuadrilátero, contra los dos juntos
  let inter = 0, qa = 0;
  const x0 = Math.max(0, Math.floor(Math.min(...Q.map((p) => p[0])))), x1 = Math.min(w - 1, Math.ceil(Math.max(...Q.map((p) => p[0])))), y0 = Math.max(0, Math.floor(Math.min(...Q.map((p) => p[1])))), y1 = Math.min(h - 1, Math.ceil(Math.max(...Q.map((p) => p[1]))));
  if ((x1 - x0) * (y1 - y0) > c.n * 6) return null;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inPoly(Q, x + 0.5, y + 0.5)) { qa++; if (label[y * w + x] === c.id) inter++; }
  const iou = inter / (qa + c.n - inter);
  // el orden: empezar por la esquina de arriba a la izquierda y seguir en el sentido del reloj (en el plano, y crece hacia abajo)
  let area = 0; for (let i = 0; i < 4; i++) { const a = Q[i], b = Q[(i + 1) % 4]; area += a[0] * b[1] - a[1] * b[0]; }
  if (area < 0) Q.reverse();
  let s = 0; for (let i = 1; i < 4; i++) if (Q[i][0] + Q[i][1] < Q[s][0] + Q[s][1]) s = i;
  return { Q: [0, 1, 2, 3].map((i) => Q[(s + i) % 4]), iou, hull: H };
}
/** Sin cuatro lados claros: un rectángulo que la contiene, orientado como la mayoría de sus bordes. */
function rectangulo(c) {
  const m = (x, y) => (label[y * w + x] === c.id ? 1 : 0);
  let sc = 0, ss = 0; const B = borde(c);
  for (const [x, y] of B) { if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) continue; const gx = m(x + 1, y - 1) + 2 * m(x + 1, y) + m(x + 1, y + 1) - m(x - 1, y - 1) - 2 * m(x - 1, y) - m(x - 1, y + 1), gy = m(x - 1, y + 1) + 2 * m(x, y + 1) + m(x + 1, y + 1) - m(x - 1, y - 1) - 2 * m(x, y - 1) - m(x + 1, y - 1); if (!gx && !gy) continue; const f = Math.atan2(gy, gx) * 4; sc += Math.cos(f); ss += Math.sin(f); }
  const th = Math.atan2(ss, sc) / 4, ux = Math.cos(th), uy = Math.sin(th);
  let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
  for (const p of B) { const u = p[0] * ux + p[1] * uy, v = -p[0] * uy + p[1] * ux; if (u < u0) u0 = u; if (u > u1) u1 = u; if (v < v0) v0 = v; if (v > v1) v1 = v; }
  u0 -= 0.5; v0 -= 0.5; u1 += 1; v1 += 1;
  const P = (u, v) => [u * ux - v * uy + 0.5, u * uy + v * ux + 0.5];
  const Q = [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];
  let s = 0; for (let i = 1; i < 4; i++) if (Q[i][0] + Q[i][1] < Q[s][0] + Q[s][1]) s = i;
  return [0, 1, 2, 3].map((i) => Q[(s + i) % 4]);
}

// ------------------------------------------------------------------------------------------------------- las iglesias
// El plano las dibuja en negro, con una cruz en blanco adentro. La cruz parte el negro en pedazos, así que primero se
// lo "cierra" (se tapan los huecos de menos de 13 m) y después se busca lo que quedó con forma de rectángulo.
// Se levantan aparte (src/hitos.js): acá solo se anota dónde están y se les reserva el lugar.
const iglesias = [], reservado = new Uint8Array(w * h);
{
  let negro = new Uint8Array(w * h);
  for (let k = 0; k < w * h; k++) negro[k] = cls[k] === MACIZO ? 1 : 0;
  for (let i = 0; i < 5; i++) negro = dilate(negro);
  for (let i = 0; i < 5; i++) negro = erode(negro);
  const fuera = (x, y, L) => L.some(([x0, y0, x1, y1]) => x * 2 > x0 && y * 2 > y0 && x * 2 < x1 && y * 2 < y1);
  const seen = new Uint8Array(w * h), q = new Int32Array(w * h);
  for (let s = 0; s < w * h; s++) {
    if (!negro[s] || seen[s]) continue;
    let head = 0, tail = 0, nM = 0, nH = 0; q[tail++] = s; seen[s] = 1; const pts = [];
    while (head < tail) { const k = q[head++]; pts.push([k % w, (k / w) | 0]); if (cls[k] === MACIZO) nM++; else if (cls[k] === EDIF || cls[k] === PATIO) nH++; for (const n of [k - 1, k + 1, k - w, k + w]) if (negro[n] && !seen[n]) { seen[n] = 1; q[tail++] = n; } }
    if (pts.length < 220 || nM < pts.length * 0.3 || nH > pts.length * 0.3) continue;
    const H = hull(pts.map((p) => [p[0], p[1]])); let best = null;
    for (let i = 0; i < H.length; i++) {
      const a = H[i], b = H[(i + 1) % H.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1e-6) continue;
      const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L; let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
      for (const p of H) { const u = p[0] * ux + p[1] * uy, v = -p[0] * uy + p[1] * ux; if (u < u0) u0 = u; if (u > u1) u1 = u; if (v < v0) v0 = v; if (v > v1) v1 = v; }
      const A = (u1 - u0 + 1) * (v1 - v0 + 1); if (!best || A < best.A) best = { A, ux, uy, u0, u1, v0, v1 };
    }
    if (pts.length / best.A < 0.68) continue;
    let { ux, uy, u0, u1, v0, v1 } = best; u1 += 1; v1 += 1;
    let lu = u1 - u0, lv = v1 - v0, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
    const cx = cu * ux - cv * uy, cy = cu * uy + cv * ux;
    if (lv > lu) { [lu, lv] = [lv, lu]; [ux, uy] = [-uy, ux]; }
    if (lu * MPP < 18 || lu * MPP > 105 || lv * MPP < 9 || lv * MPP > 46 || fuera(cx, cy, NO_IGLESIAS) || fuera(cx, cy, RESERVAS) || IGLESIAS.some((g) => Math.hypot(g[0] / 2 - cx, g[1] / 2 - cy) < 60)) continue;
    // el frente: la punta que da a la calle (del otro lado sigue la manzana)
    const papel = (s) => { let n = 0; for (let t = 4; t < 22; t++) for (let o = -3; o <= 3; o += 3) { const x = Math.round(cx + s * (lu / 2 + t) * ux - o * uy), y = Math.round(cy + s * (lu / 2 + t) * uy + o * ux); if (cls[y * w + x] === PAPEL) n++; } return n; };
    iglesias.push({ x: cx, y: cy, ux, uy, largo: lu, ancho: lv, frente: papel(1) >= papel(-1) ? 1 : -1 });
    for (const p of pts) reservado[p[1] * w + p[0]] = 1;
  }
  for (const [x, y, ux, uy, largo, ancho, frente] of IGLESIAS) iglesias.push({ x: x / 2, y: y / 2, ux, uy, largo: largo / 2, ancho: ancho / 2, frente });
  // (y lo que rodea a la cruz, que también es de la iglesia)
  for (const g of iglesias) { const r = Math.ceil(Math.hypot(g.largo, g.ancho) / 2); for (let y = Math.round(g.y) - r; y <= Math.round(g.y) + r; y++) for (let x = Math.round(g.x) - r; x <= Math.round(g.x) + r; x++) { const dx = x - g.x, dy = y - g.y; if (Math.abs(dx * g.ux + dy * g.uy) <= g.largo / 2 && Math.abs(-dx * g.uy + dy * g.ux) <= g.ancho / 2) reservado[y * w + x] = 1; } }
}
for (const [x0, y0, x1, y1] of RESERVAS) for (let y = y0 >> 1; y <= y1 >> 1; y++) for (let x = x0 >> 1; x <= x1 >> 1; x++) reservado[y * w + x] = 1;
lap(`${iglesias.length} iglesias`);

// -------------------------------------------------------------------------------------------------------- una manzana
const centro = [PLANO.plaza[0] / 2, PLANO.plaza[1] / 2];
const manzanas = [], techos = [], muros = [], arboles = [];
let nLotes = 0;
// Los pisos de cada casa salen del censo de 1869, zona por zona (tools/alturas.mjs). Para repartirlos hay que saber
// antes cuántas casas hay en cada zona: las manzanas se recorren dos veces, la primera de ensayo (se arman los lotes
// y se anotan; no se guarda nada) y la segunda de verdad, con los pisos ya repartidos.
let ENSAYO = false, censando = false, nLlamada = 0;
const censo = [], pisosDe67 = new Map();
const debug = new Uint8Array(w * h * 3);
const FRENTES = [8, 9, 9, 9, 9, 10, 11, 13, 13, 17, 17, 22, 26];

function manzana(c, Q, suelta, lleno, todo = false) {
  const R = rng(c.start * 7 + 13), llamada = nLlamada++;
  const len = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const nu = Math.max(2, Math.round((len(Q[0], Q[1]) + len(Q[3], Q[2])) / 2 * MPP)), nv = Math.max(2, Math.round((len(Q[0], Q[3]) + len(Q[1], Q[2])) / 2 * MPP));
  if (nu > 1200 || nv > 1200) return;
  const at = (i, j) => { const s = (i + 0.5) / nu, t = (j + 0.5) / nv; return [(1 - s) * (1 - t) * Q[0][0] + s * (1 - t) * Q[1][0] + s * t * Q[2][0] + (1 - s) * t * Q[3][0], (1 - s) * (1 - t) * Q[0][1] + s * (1 - t) * Q[1][1] + s * t * Q[2][1] + (1 - s) * t * Q[3][1]]; };
  // lo que dice el plano en cada celda: 1 edificado, 2 patio, 3 no se sabe (tinta fina), 0 nada
  const N = nu * nv, tipo = new Uint8Array(N), blk = new Uint8Array(N), gris = new Uint8Array(N);
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const [x, y] = at(i, j), k = Math.min(h - 1, Math.max(0, Math.floor(y))) * w + Math.min(w - 1, Math.max(0, Math.floor(x))), v = cls[k], mine = todo || label[k] === c.id || (lleno && tinta[k]);
    blk[j * nu + i] = lleno ? 1 : mine ? 1 : 0; gris[j * nu + i] = tono[k];
    if (reservado[k]) tipo[j * nu + i] = 0;
    else if (suelta) tipo[j * nu + i] = mine ? 1 : 0;
    else if (v === EDIF || v === MACIZO || (grueso[k] && v !== PATIO)) tipo[j * nu + i] = 1;
    else if (v === PATIO) tipo[j * nu + i] = 2;
    else if (v === OTRO) tipo[j * nu + i] = 3;
  }
  // la tinta fina toma lo que tenga al lado
  for (let pass = 0; pass < 3; pass++) { const nx = tipo.slice(); for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const k = j * nu + i; if (tipo[k] !== 3) continue; let b = 0, p = 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const a = i + di, d = j + dj; if (a < 0 || d < 0 || a >= nu || d >= nv) continue; const v = tipo[d * nu + a]; if (v === 1) b++; else if (v === 2) p++; } if (b || p) nx[k] = b >= p ? 1 : 2; } tipo.set(nx); }
  // Lo edificado lleva más tinta que los fondos (dos rayados contra uno). Donde el rayado del fondo hace aguas con el
  // escaneo aparecen rayas "cruzadas" que no son: se reconocen porque tienen el gris del fondo, no el de lo edificado.
  if (!suelta) {
    const tb = [], tp = [];
    for (let k = 0; k < N; k++) if (tipo[k] === 1) tb.push(gris[k]); else if (tipo[k] === 2) tp.push(gris[k]);
    if (tb.length > 40 && tp.length > 40) {
      tb.sort((a, b) => a - b); tp.sort((a, b) => a - b);
      const b = tb[tb.length >> 2], p = tp[tp.length >> 1];
      if (p - b >= 12) { const thr = b + 0.55 * (p - b); for (let k = 0; k < N; k++) if (tipo[k] === 1 && gris[k] > thr) tipo[k] = 2; }
    }
  }
  const built = new Uint8Array(N);
  for (let k = 0; k < N; k++) built[k] = tipo[k] === 1 ? 1 : 0;
  // limpiar: manchitas edificadas sueltas (los números escritos en los patios) y agujeritos en lo edificado
  const flood = (mask, val, min, set) => { const seen = new Uint8Array(N); for (let s = 0; s < N; s++) { if (mask[s] !== val || seen[s]) continue; const st = [s], all = [s]; seen[s] = 1; let touch = false; while (st.length) { const k = st.pop(), i = k % nu, j = (k / nu) | 0; if (i === 0 || j === 0 || i === nu - 1 || j === nv - 1) touch = true; for (const n of [i > 0 ? k - 1 : -1, i < nu - 1 ? k + 1 : -1, j > 0 ? k - nu : -1, j < nv - 1 ? k + nu : -1]) if (n >= 0 && mask[n] === val && !seen[n]) { seen[n] = 1; st.push(n); all.push(n); } } if (all.length < min && !(val === 0 && touch)) for (const k of all) mask[k] = set; } };
  if (!suelta) {
    flood(built, 1, 30, 0); flood(built, 0, 36, 1);
    // bordes derechos: se borra lo que tenga menos de 3 m de ancho y se tapan las muescas de menos de 3 m
    const er = (m) => { const o = new Uint8Array(N); for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { let v = 1; for (let b = -1; b <= 1 && v; b++) for (let a = -1; a <= 1; a++) { const x = Math.min(nu - 1, Math.max(0, i + a)), y = Math.min(nv - 1, Math.max(0, j + b)); if (!m[y * nu + x]) { v = 0; break; } } o[j * nu + i] = v; } return o; };
    const di = (m) => { const o = new Uint8Array(N); for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { let v = 0; for (let b = -1; b <= 1 && !v; b++) for (let a = -1; a <= 1; a++) { const x = i + a, y = j + b; if (x >= 0 && y >= 0 && x < nu && y < nv && m[y * nu + x]) { v = 1; break; } } o[j * nu + i] = v; } return o; };
    built.set(er(di(di(er(built)))));
    for (let k = 0; k < N; k++) if (!blk[k]) built[k] = 0;
  }
  let nBuilt = 0; for (let k = 0; k < N; k++) nBuilt += built[k];
  if (nBuilt < 12) return;

  const id = manzanas.length, mx = c.sx / c.n, my = c.sy / c.n, dist = Math.hypot(mx - centro[0], my - centro[1]) * MPP;
  const own = new Int32Array(N).fill(-1), lots = [];
  const lugar = [((Q[0][0] + Q[1][0] + Q[2][0] + Q[3][0]) / 4 - centro[0]) * MPP, ((Q[0][1] + Q[1][1] + Q[2][1] + Q[3][1]) / 4 - centro[1]) * MPP]; // (metros al norte y hacia el río de la plaza)
  const pisos = (interior) => { if (interior) return 1; R(); return pisosDe67.get(llamada * 4096 + lots.length) ?? 1; };
  const nuevo = (kind, fl, alto) => { const f = fl ?? pisos(kind === 1), hh = alto ?? f * (3.9 + R() * 1.5) + 0.6 + R() * 0.7; lots.push({ h: Math.round(hh * 10), floors: f, kind, seed: 1 + Math.floor(R() * 65000), n: 0 }); return lots.length - 1; };

  if (suelta || nBuilt > N * 0.9 && N < 2600) {
    // una construcción sola: un cuerpo, o dos si es larga
    // (en La Boca la mitad de las casas era de altos —lo dice el censo de 1869—, y ahí casi todo son casillas sueltas)
    const A = nBuilt, big = A > 500, alta = !big && zonaDeManzana(...lugar) === 5 && azar(c.start, 77) < OBJETIVO[0][5][1] / 100, f = big ? (R() < 0.35 ? 2 : 1) : alta ? 2 : 1, hh = big ? 6 + R() * 4 : 3.6 + R() * 1.8 + (A > 150 ? 1 : 0) + (alta ? 2.7 : 0);
    const L = nuevo(2, f, hh);
    for (let k = 0; k < N; k++) if (built[k]) { own[k] = L; lots[L].n++; }
  } else {
    // el fondo edificado visto desde cada calle
    const sides = [0, 1, 2, 3].map((s) => { const La = s % 2 === 0 ? nu : nv, Ld = s % 2 === 0 ? nv : nu, D = new Int16Array(La), E = new Int16Array(La);
      const cell = (a, d) => s === 0 ? d * nu + a : s === 2 ? (nv - 1 - d) * nu + a : s === 1 ? a * nu + (nu - 1 - d) : a * nu + d;
      for (let a = 0; a < La; a++) { let e = 0; while (e < Ld && !blk[cell(a, e)]) e++; if (e > Ld * 0.4) { D[a] = 0; E[a] = 0; continue; } let s0 = e; while (s0 < e + 3 && s0 < Ld && !built[cell(a, s0)]) s0++; if (s0 >= e + 3 || s0 >= Ld) { D[a] = 0; E[a] = e; continue; } let d = s0; while (d < Ld && built[cell(a, d)]) d++; D[a] = d - e; E[a] = e; }
      if (!lleno) { const E0 = E.slice(); for (let a = 0; a < La; a++) { const v = []; for (let t = Math.max(0, a - 4); t <= Math.min(La - 1, a + 4); t++) v.push(E0[t]); v.sort((x, y) => x - y); E[a] = v[v.length >> 1]; } }
      const mid = Array.from(D).filter((v) => v >= 4 && v <= Ld * 0.45).sort((a, b) => a - b), cap = mid.length ? Math.min(Ld * 0.5, Math.max(9, mid[mid.length >> 1] * 1.45)) : Math.min(Ld * 0.5, 22);
      return { s, La, Ld, D, E, cell, cap };
    });
    const order = R() < 0.5 ? [0, 2, 1, 3] : [1, 3, 0, 2];
    for (const si of order) {
      const S = sides[si]; let a = 0;
      while (a < S.La) {
        if (S.D[a] < 4) { a++; continue; }
        // un tramo edificado seguido; se corta también donde el fondo pega un salto (ahí hay una medianera de verdad)
        let b = a + 1; while (b < S.La && S.D[b] >= 4) b++;
        let p = a;
        while (p < b) {
          let wd = FRENTES[Math.floor(R() * FRENTES.length)], q = Math.min(b, p + wd);
          for (let t = p + 5; t < q; t++) if (Math.abs(Math.min(S.D[t], S.cap) - Math.min(S.D[t - 1], S.cap)) >= 4) { q = t; break; }
          if (b - q < 6) q = b;
          const ds = []; for (let t = p; t < q; t++) ds.push(Math.min(S.D[t], S.cap)); ds.sort((x, y) => x - y);
          const depth = Math.round(ds[ds.length >> 1]), L = nuevo(0);
          for (let t = p; t < q; t++) for (let d = S.E[t]; d < Math.min(S.Ld, S.E[t] + depth); d++) { const k = S.cell(t, d); if (blk[k] && own[k] < 0) { own[k] = L; lots[L].n++; built[k] = 1; } }
          p = q;
        }
        a = b;
      }
    }
    // lo que quedó sin dueño: construcciones del corazón de la manzana
    const seen = new Uint8Array(N);
    for (let s = 0; s < N; s++) {
      if (!built[s] || own[s] >= 0 || seen[s]) continue;
      const st = [s], all = [s]; seen[s] = 1; const near = new Map();
      while (st.length) { const k = st.pop(), i = k % nu, j = (k / nu) | 0; for (const n of [i > 0 ? k - 1 : -1, i < nu - 1 ? k + 1 : -1, j > 0 ? k - nu : -1, j < nv - 1 ? k + nu : -1]) { if (n < 0 || !built[n]) continue; if (own[n] >= 0) { near.set(own[n], (near.get(own[n]) || 0) + 1); continue; } if (!seen[n]) { seen[n] = 1; st.push(n); all.push(n); } } }
      if (all.length < 16) { if (near.size) { const L = [...near.entries()].sort((x, y) => y[1] - x[1])[0][0]; for (const k of all) { own[k] = L; lots[L].n++; } } continue; }
      // (si es grande, se parte en cuerpos de unos 14 m, a lo largo de su lado más largo)
      let i0 = nu, i1 = 0, j0 = nv, j1 = 0; for (const k of all) { const i = k % nu, j = (k / nu) | 0; if (i < i0) i0 = i; if (i > i1) i1 = i; if (j < j0) j0 = j; if (j > j1) j1 = j; }
      const alongU = i1 - i0 >= j1 - j0, span = (alongU ? i1 - i0 : j1 - j0) + 1, parts = Math.max(1, Math.round(span / (12 + R() * 8))), ids = [];
      for (let p = 0; p < parts; p++) ids.push(nuevo(1));
      for (const k of all) { const i = k % nu, j = (k / nu) | 0, p = Math.min(parts - 1, Math.floor(((alongU ? i - i0 : j - j0) / span) * parts)); own[k] = ids[p]; lots[ids[p]].n++; }
    }
  }
  // lotes de nada: afuera
  for (let k = 0; k < N; k++) if (own[k] >= 0 && lots[own[k]].n < 8) own[k] = -1;
  if (censando) {
    // (para el censo cuentan las casas a la calle y las construcciones sueltas, no los cuerpos del corazón de la manzana)
    const [qn, qr] = lugar, z = zonaDeManzana(qn, qr);
    lots.forEach((lo, L) => { if (lo.n >= 8 && lo.kind !== 1) censo.push({ clave: llamada * 4096 + L, z, n: qn, r: qr, sem: lo.seed, nace: 0, muere: 0, clase: lo.kind === 2 ? claseDe(lo.floors) : 0, fijo: lo.kind === 2 }); });
    if (ENSAYO) return;
  }

  // --- la malla: techos (rectángulos) y muros (donde el vecino es más bajo o no hay vecino) ---
  const hOf = (i, j) => (i < 0 || j < 0 || i >= nu || j >= nv || own[j * nu + i] < 0 ? 0 : lots[own[j * nu + i]].h);
  const done = new Uint8Array(N); let any = false;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const k = j * nu + i, L = own[k]; if (L < 0 || done[k]) continue;
    let i1 = i; while (i1 + 1 < nu && own[j * nu + i1 + 1] === L && !done[j * nu + i1 + 1]) i1++;
    let j1 = j; outer: while (j1 + 1 < nv) { for (let t = i; t <= i1; t++) if (own[(j1 + 1) * nu + t] !== L || done[(j1 + 1) * nu + t]) break outer; j1++; }
    for (let b = j; b <= j1; b++) for (let a = i; a <= i1; a++) done[b * nu + a] = 1;
    techos.push(id, i, j, i1 + 1, j1 + 1, lots[L].h, lots[L].seed, lots[L].floors | (lots[L].kind << 4)); any = true;
  }
  // dir 0: mira a −v (j menor) · 1: +u · 2: +v · 3: −u
  const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  for (let dir = 0; dir < 4; dir++) {
    const [di, dj] = DIRS[dir], horiz = dj !== 0, La = horiz ? nu : nv, Lc = horiz ? nv : nu;
    for (let cc = 0; cc < Lc; cc++) {
      let run = null;
      const flush = () => { if (run) { muros.push(id, dir | (run.kind << 2) | (lots[run.L].floors << 4) | (lots[run.L].kind << 8), dir === 0 ? cc : dir === 2 ? cc + 1 : dir === 1 ? cc + 1 : cc, run.a0, run.a1, run.y0, lots[run.L].h, lots[run.L].seed); run = null; } };
      for (let a = 0; a < La; a++) {
        const i = horiz ? a : cc, j = horiz ? cc : a, L = own[j * nu + i];
        if (L < 0) { flush(); continue; }
        const ni = i + di, nj = j + dj, y0 = hOf(ni, nj), hh = lots[L].h;
        if (hh <= y0 + 3) { flush(); continue; }
        const out = ni < 0 || nj < 0 || ni >= nu || nj >= nv || !blk[nj * nu + ni];
        // 0: da a la calle · 1: da a un patio · 2: medianera (asoma sobre el vecino)
        const kind = y0 > 0 ? 2 : out ? 0 : 1;
        if (run && run.L === L && run.y0 === y0 && run.kind === kind) run.a1 = a + 1; else { flush(); run = { L, a0: a, a1: a + 1, y0, kind }; }
      }
      flush();
    }
  }
  if (!any) return;
  nLotes += lots.length;
  manzanas.push({ Q, nu, nv, x: mx, y: my });
  // para mirar: cada lote de un color
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const L = own[j * nu + i]; if (L < 0) continue; const [x, y] = at(i, j), k = (Math.floor(y) * w + Math.floor(x)) * 3, s = lots[L].seed; debug[k] = 60 + (s * 7) % 180; debug[k + 1] = 60 + (s * 13) % 180; debug[k + 2] = 60 + (s * 29) % 180; }
}

// ------------------------------------------------------------------------------------------------------------ lo chico
// Las casillas y los árboles salen del escaneo entero. Acá se descartan los que caen donde no puede haber ninguno (el
// río, adentro de una manzana, sobre una iglesia o un cartel) y se anota qué lugar ocupan, para no repetirlos después.
const chico = await chicas('fuentes/plano-1867.jpg', { marco: PLANO.marco });
const esManzana = comps.map((c) => (c.nE + c.nP) / c.n >= 0.4 && c.nE >= 14 && c.n >= 60);
const libre = (X, Y) => {
  const k = (Y >> 1) * w + (X >> 1), v = cls[k], L = label[k];
  if (agua[k] || reservado[k] || v === EDIF || v === PATIO || (L >= 0 && esManzana[L]) || inPoly(AGUA, X, Y)) return false;
  for (const [x0, y0, x1, y1] of CARTELES) if (X > x0 && Y > y0 && X < x1 && Y < y1) return false;
  return true;
};
const tomado = new Uint8Array(w * h);
let nCasillas = 0;
// (una "casilla" sola en medio de una hilera de árboles es un árbol dibujado con más tinta)
const cerca = (lista, x, y, r) => { let n = 0; for (const p of lista) { const dx = (p.x ?? p[0]) - x, dy = (p.y ?? p[1]) - y; if (dx * dx + dy * dy < r * r) n++; } return n; };
censando = true;
for (const c of chico.casillas) {
  if (!libre(c.x, c.y)) continue;
  if (c.largo < 14 && cerca(chico.casillas, c.x, c.y, 34) <= 2 && cerca(chico.arboles, c.x, c.y, 34) >= 4) { chico.arboles.push([c.x, c.y, (c.largo + c.ancho) / 4]); continue; }
  let Q = c.Q.map((p) => [p[0] / 2, p[1] / 2]), area = 0;
  for (let i = 0; i < 4; i++) { const a = Q[i], b = Q[(i + 1) % 4]; area += a[0] * b[1] - a[1] * b[0]; }
  if (area < 0) Q.reverse();
  let s0 = 0; for (let i = 1; i < 4; i++) if (Q[i][0] + Q[i][1] < Q[s0][0] + Q[s0][1]) s0 = i;
  Q = [0, 1, 2, 3].map((i) => Q[(s0 + i) % 4]);
  const antes = manzanas.length;
  manzana({ id: -2, start: Math.round(c.x * 7 + c.y * 13), sx: c.x / 2, sy: c.y / 2, n: 1 }, Q, true, false, true);
  if (manzanas.length === antes) continue;
  nCasillas++;
  const xs = Q.map((p) => p[0]), ys = Q.map((p) => p[1]);
  for (let y = Math.floor(Math.min(...ys)) - 1; y <= Math.ceil(Math.max(...ys)) + 1; y++) for (let x = Math.floor(Math.min(...xs)) - 1; x <= Math.ceil(Math.max(...xs)) + 1; x++) tomado[y * w + x] = 1;
}
for (const [X, Y, r] of chico.arboles) {
  const k = (Y >> 1) * w + (X >> 1);
  if (!libre(X, Y) || tomado[k]) continue;
  arboles.push([X / 2, Y / 2, r / 2]);
  const rr = Math.ceil(r / 2 + 1); for (let y = -rr; y <= rr; y++) for (let x = -rr; x <= rr; x++) if (x * x + y * y <= rr * rr) tomado[k + y * w + x] |= 2;
}
const nChicos = arboles.length;
lap(`${nCasillas} casillas, ${nChicos} árboles chicos`);

// ------------------------------------------------------------------------------------------------ recorrer las manchas
let nMz = 0, nSueltas = 0, nRaras = 0;
const recorrer = () => { for (const c of comps) {
  if (c.n < 10) continue;
  const rayado = (c.nE + c.nP) / c.n, bw = c.x1 - c.x0 + 1, bh = c.y1 - c.y0 + 1;
  if (rayado >= 0.4 && c.nE >= 14 && c.n >= 60) {
    // una manzana (o un pedazo de manzana): tiene el rayado de lo edificado
    const f = cuatroLados(c);
    if (f && f.iou >= 0.86) { manzana(c, f.Q, false, true); nMz++; }
    else { const Q = rectangulo(c); if (Q) { manzana(c, Q, false, false); nRaras++; } }
  } else if (rayado < 0.4 && c.n >= 9 && c.n <= 5200) {
    // tinta sin rayado: es una construcción suelta si es un rectángulo, y un árbol si es una mancha redonda y chica
    let g = 0, ya = 0, arb = 0; for (let y = c.y0; y <= c.y1; y++) for (let x = c.x0; x <= c.x1; x++) if (label[y * w + x] === c.id) { if (grueso[y * w + x]) g++; if (tomado[y * w + x] & 1) ya++; if (tomado[y * w + x] & 2) arb++; }
    if (ya > c.n * 0.35) continue; // ya se levantó como casilla
    const f = c.n >= 36 ? cuatroLados(c) : null;
    const lados = f ? [Math.hypot(f.Q[1][0] - f.Q[0][0], f.Q[1][1] - f.Q[0][1]), Math.hypot(f.Q[3][0] - f.Q[0][0], f.Q[3][1] - f.Q[0][1])] : null;
    if (f && f.iou >= 0.8 && g / c.n > 0.7 && Math.min(...lados) >= 4.2 && c.n * MPP * MPP >= 70) { manzana(c, f.Q, true, false); nSueltas++; }
    else if (!ENSAYO && !arb && c.n <= 90 && bw <= 13 && bh <= 13 && bw >= 3 && bh >= 3 && c.n / (bw * bh) > 0.55 && Math.max(bw, bh) / Math.min(bw, bh) < 1.6 && !chico.esLetra((c.sx / c.n) * 2, (c.sy / c.n) * 2)) arboles.push([c.sx / c.n, c.sy / c.n, Math.sqrt(c.n / Math.PI)]);
  }
} };
{
  const desde = nLlamada; ENSAYO = true; recorrer(); ENSAYO = censando = false; nLlamada = desde; nMz = nSueltas = nRaras = 0;
  const informe = repartir(censo, { hasta: 0 });
  for (const l of censo) if (l.plan.length) pisosDe67.set(l.clave, l.plan[0][1]);
  lap('los pisos de 1867, zona por zona (% de casas de 1, 2, 3, 4 y 5 o más):\n' + cuadro(informe));
  recorrer();
}
lap(`${nMz} manzanas de cuatro lados, ${nRaras} irregulares, ${nSueltas} construcciones sueltas, ${nLotes} lotes, ${arboles.length} árboles`);

// --------------------------------------------------------------------------------------------------------- a guardar
mkdirSync('public/datos', { recursive: true });
const u16 = (a) => { for (const v of a) if (v < 0 || v > 65535) throw new Error('no entra en 16 bits: ' + v); return Buffer.from(new Uint16Array(a).buffer); };
// las esquinas, en píxeles del plano entero (para que el visor las pase a metros)
const mz = new Float32Array(manzanas.length * 10);
manzanas.forEach((m, i) => { for (let q = 0; q < 4; q++) { mz[i * 10 + q * 2] = m.Q[q][0] * 2; mz[i * 10 + q * 2 + 1] = m.Q[q][1] * 2; } mz[i * 10 + 8] = m.nu; mz[i * 10 + 9] = m.nv; });
writeFileSync('public/datos/manzanas.bin', Buffer.from(mz.buffer));
writeFileSync('public/datos/techos.bin', u16(techos));
writeFileSync('public/datos/muros.bin', u16(muros));
writeFileSync('public/datos/arboles.bin', Buffer.from(new Float32Array(arboles.flatMap(([x, y, r]) => [x * 2, y * 2, r * 2])).buffer));
writeFileSync('public/datos/ciudad.json', JSON.stringify({
  plano: PLANO, manzanas: manzanas.length, techos: techos.length / 8, muros: muros.length / 8, arboles: arboles.length, lotes: nLotes,
  iglesias: iglesias.map((g) => ({ x: +(g.x * 2).toFixed(1), y: +(g.y * 2).toFixed(1), ux: +g.ux.toFixed(4), uy: +g.uy.toFixed(4), largo: +(g.largo * 2).toFixed(1), ancho: +(g.ancho * 2).toFixed(1), frente: g.frente })),
}));
for (const [x, y, r] of arboles) { const k = (Math.round(y) * w + Math.round(x)) * 3; for (const o of [0, 3, -3, w * 3, -w * 3]) { debug[k + o] = 20; debug[k + o + 1] = 230; debug[k + o + 2] = 60; } }
for (const g of iglesias) for (let t = -g.largo / 2; t <= g.largo / 2; t += 0.5) for (const s of [-g.ancho / 2, g.ancho / 2]) { const k = (Math.round(g.y + t * g.uy + s * g.ux) * w + Math.round(g.x + t * g.ux - s * g.uy)) * 3; debug[k] = 255; debug[k + 1] = 40; debug[k + 2] = 40; }
await sharp(debug, { raw: { width: w, height: h, channels: 3 }, limitInputPixels: false }).jpeg({ quality: 88 }).toFile('tmp/lotes-ver.jpg');
lap(`guardado: techos ${techos.length / 8}, muros ${muros.length / 8}`);
