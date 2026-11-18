// El relieve: la barranca del río y las lomas, que el plano dibuja con rayitas pero no mide. Las alturas son las de
// hoy: las curvas de nivel de la Ciudad, de metro en metro («Elevación terreno», Secretaría de Desarrollo Urbano del
// GCBA, en Buenos Aires Data, CC BY 2.5 AR), pasadas al plano con la georreferencia. Son del suelo, no de los techos
// (una primera versión usó el modelo SRTM, que en el centro mide los edificios: daba 44 m en Corrientes y Callao).
// El terreno natural de la meseta es el mismo de 1867; lo que cambió es la costa (la tierra ganada: Puerto Madero,
// Retiro) y el Riachuelo, así que el río de 1867 va a cero y de la orilla sube en rampa.
//   node tools/relieve.mjs   →   public/datos/relieve.bin (Uint16: ancho, alto, y las alturas en decímetros) y
//                                tmp/relieve.png para mirarlo. Las curvas quedan en fuentes/relieve/curvas-de-nivel.csv.
import sharp from 'sharp';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { PLANO, ARROYOS } from './plano.mjs';
import { aPlano } from './geo.mjs';

const W = 512, H = Math.round((W * PLANO.alto) / PLANO.ancho), paso = PLANO.ancho / W, celda = paso * PLANO.metro;
const CSV = 'fuentes/relieve/curvas-de-nivel.csv';
const URL_CURVAS = 'https://cdn.buenosaires.gob.ar/datosabiertos/datasets/secretaria-de-desarrollo-urbano/elevacion-terreno/curvas-de-nivel.csv';
mkdirSync('fuentes/relieve', { recursive: true });
if (!existsSync(CSV)) { const r = await fetch(URL_CURVAS, { headers: { 'User-Agent': 'Mozilla/5.0' } }); if (!r.ok) throw new Error(`curvas: ${r.status}`); writeFileSync(CSV, Buffer.from(await r.arrayBuffer())); }

// 1. las curvas, a la grilla: cada celda que toca una curva queda con su cota (si la tocan varias, el promedio)
const suma = new Float32Array(W * H), veces = new Uint16Array(W * H);
let curvas = 0;
for (const fila of readFileSync(CSV, 'utf8').split('\n').slice(1)) {
  const c = fila.split(';'); if (c.length < 9) continue;
  const cota = +c[7], m = /\(([^)]*)\)/.exec(c[8]); if (!m || !Number.isFinite(cota)) continue;
  const p = m[1].split(',').map((s) => { const [lon, lat] = s.trim().split(/\s+/).map(Number); return aPlano(lat, lon); });
  curvas++;
  for (let i = 0; i + 1 < p.length; i++) {
    const [ax, ay] = p[i], [bx, by] = p[i + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / (paso / 2)));
    for (let k = 0; k <= n; k++) { const x = Math.floor((ax + ((bx - ax) * k) / n) / paso), y = Math.floor((ay + ((by - ay) * k) / n) / paso); if (x >= 0 && x < W && y >= 0 && y < H) { suma[y * W + x] += cota; veces[y * W + x]++; } }
  }
}

// 2. el río de 1867 (la lámina del suelo, canal rojo; incluye el Riachuelo): ahí la altura es cero, y las curvas de
// hoy que caen dentro (la tierra ganada) no cuentan
const rio = await sharp('public/plano/suelo.webp').resize(W, H, { fit: 'fill' }).extractChannel(0).raw().toBuffer();
// (menos los arroyos que corren por lo alto —el Manso—: son agua pintada sobre el terreno, no una zanja al nivel del río)
for (const a of ARROYOS) if (a.enLoAlto) for (const { eje } of a.tramos) for (let i = 0; i + 1 < eje.length; i++) {
  const [ax, ay] = eje[i], [bx, by] = eje[i + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / (paso / 2)));
  for (let k = 0; k <= n; k++) { const x = Math.floor((ax + ((bx - ax) * k) / n) / paso), y = Math.floor((ay + ((by - ay) * k) / n) / paso); for (let b = Math.max(0, y - 1); b <= Math.min(H - 1, y + 1); b++) for (let c = Math.max(0, x - 1); c <= Math.min(W - 1, x + 1); c++) rio[b * W + c] = 0; }
}
const fija = new Uint8Array(W * H), h = new Float32Array(W * H);
let conCurva = 0;
for (let q = 0; q < W * H; q++) {
  if (rio[q] > 127) { fija[q] = 1; h[q] = 0; } else if (veces[q]) { fija[q] = 1; h[q] = suma[q] / veces[q]; conCurva++; }
}

// 3. entre curva y curva: cada celda libre toma el promedio de sus vecinas hasta que deja de moverse (así la altura
// pasa suave de una curva a la siguiente). Se arranca con la altura de la celda fija más cercana, para que llegue
// rápido a las zonas sin curvas (el otro lado del Riachuelo, que no es de la Ciudad, queda con la altura de la orilla).
{
  const d = new Float32Array(W * H).fill(1e9);
  for (let q = 0; q < W * H; q++) if (fija[q]) d[q] = 0;
  const pasada = (j0, j1, dj, i0, i1, di) => { for (let j = j0; j !== j1; j += dj) for (let i = i0; i !== i1; i += di) { const q = j * W + i; for (const [a, b, c] of [[-di, 0, 1], [0, -dj, 1], [-di, -dj, 1.414], [di, -dj, 1.414]]) { const x = i + a, y = j + b; if (x >= 0 && x < W && y >= 0 && y < H && d[y * W + x] + c < d[q]) { d[q] = d[y * W + x] + c; h[q] = h[y * W + x]; } } } };
  pasada(0, H, 1, 0, W, 1); pasada(H - 1, -1, -1, W - 1, -1, -1);
  const o = new Float32Array(W * H);
  for (let v = 0; v < 3000; v++) {
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const q = j * W + i; if (fija[q]) { o[q] = h[q]; continue; } o[q] = (h[j * W + Math.max(0, i - 1)] + h[j * W + Math.min(W - 1, i + 1)] + h[Math.max(0, j - 1) * W + i] + h[Math.min(H - 1, j + 1) * W + i]) / 4; }
    h.set(o);
  }
}

// 4. la orilla: las curvas de hoy pegadas al río de 1867 son de relleno (el Paseo de Julio, hoy Alem, era la playa).
// Del agua se sube en rampa suave hasta encontrar el terreno; más adentro esto no toca nada.
const sua = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
{
  const d = new Float32Array(W * H).fill(1e9);
  for (let q = 0; q < W * H; q++) if (rio[q] > 127) d[q] = 0;
  const pasada = (j0, j1, dj, i0, i1, di) => { for (let j = j0; j !== j1; j += dj) for (let i = i0; i !== i1; i += di) { const q = j * W + i; for (const [a, b, c] of [[-di, 0, 1], [0, -dj, 1], [-di, -dj, 1.414], [di, -dj, 1.414]]) { const x = i + a, y = j + b; if (x >= 0 && x < W && y >= 0 && y < H) d[q] = Math.min(d[q], d[y * W + x] + c * celda); } } };
  pasada(0, H, 1, 0, W, 1); pasada(H - 1, -1, -1, W - 1, -1, -1);
  for (let q = 0; q < W * H; q++) h[q] = Math.max(0, Math.min(h[q], 0.5 + 0.12 * d[q])) * (1 - rio[q] / 255);
}
// un alisado corto (las curvas van de metro en metro: sin esto quedan escalones) y nada fuera de la guarda
{ const o = new Float32Array(W * H); for (let v = 0; v < 2; v++) { for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { let s = 0, n = 0; for (let b = Math.max(0, j - 1); b <= Math.min(H - 1, j + 1); b++) for (let a = Math.max(0, i - 1); a <= Math.min(W - 1, i + 1); a++) { s += h[b * W + a]; n++; } o[j * W + i] = s / n; } h.set(o); } }
for (let q = 0; q < W * H; q++) h[q] *= 1 - rio[q] / 255;
const [m0, m1, m2, m3] = PLANO.marco.map((v) => v / paso);
for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) h[j * W + i] *= sua(m0, m0 + 5, i) * sua(m2, m2 - 5, i) * sua(m1, m1 + 5, j) * sua(m3, m3 - 5, j);

let max = 0; for (const v of h) max = Math.max(max, v);
const out = new Uint16Array(2 + W * H); out[0] = W; out[1] = H; for (let q = 0; q < W * H; q++) out[2 + q] = Math.round(h[q] * 10);
writeFileSync('public/datos/relieve.bin', Buffer.from(out.buffer));
mkdirSync('tmp', { recursive: true });
await sharp(Buffer.from(h.map((v) => (v / max) * 255)), { raw: { width: W, height: H, channels: 1 } }).png().toFile('tmp/relieve.png');
const en = (lat, lon) => { const [x, y] = aPlano(lat, lon); return h[Math.floor(y / paso) * W + Math.floor(x / paso)].toFixed(1); };
console.log(`relieve ${W} × ${H} (celdas de ${celda.toFixed(0)} m), ${curvas} curvas, ${conCurva} celdas con curva, máximo ${max.toFixed(1)} m`);
console.log('Corrientes: Callao', en(-34.6044, -58.3924), '· 9 de Julio', en(-34.6037, -58.3816), '· Florida', en(-34.6034, -58.3752), '· Reconquista', en(-34.6032, -58.3722), '· 25 de Mayo', en(-34.6031, -58.3708), '· Alem', en(-34.603, -58.37));
console.log('Plaza de Mayo', en(-34.6083, -58.3722), '· Casa Rosada', en(-34.6081, -58.3703), '· Paseo Colón', en(-34.6086, -58.3694), '· Congreso', en(-34.6098, -58.3926), '· Once', en(-34.609, -58.4065), '· Constitución', en(-34.6277, -58.3809));
console.log('Parque Lezama', en(-34.6268, -58.3697), '· Paseo Colón y Brasil', en(-34.6262, -58.3672), '· Plaza San Martín', en(-34.5953, -58.3757), '· Recoleta', en(-34.588, -58.3923), '· La Boca', en(-34.6393, -58.3626));
process.exit(0); // (sharp deja hilos abiertos y el programa no terminaba solo)
