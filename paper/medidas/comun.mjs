// Lo que comparten los scripts de figuras y de la muestra (solo lectura sobre el repo).
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

export const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
export const R = (f) => join(RAIZ, f);
export const ESCANEO = R('fuentes/plano-1867.jpg');
export const FIG = (f) => join(RAIZ, 'paper/figuras', f);

/** un recorte del escaneo, en gris: { g, w, h } */
export async function gris(x0, y0, w, h) {
  const { data } = await sharp(ESCANEO, { limitInputPixels: false }).extract({ left: x0, top: y0, width: w, height: h }).greyscale().raw().toBuffer({ resolveWithObject: true });
  return { g: data, w, h };
}

/** El paso 1 (tools/1-clases.mjs) sobre un recorte: las mismas cuentas, con los mismos números. El recorte tiene que
 *  empezar en coordenadas pares. Devuelve, a media resolución: las dos respuestas (a, b), el tono medio (M), el
 *  período que ganó en cada diagonal y la clase. */
export function clasificar({ g, w: W, h: H }) {
  const PS = [4.2, 5.05, 6.1], N = 12, Rr = N / 2, w = W >> 1, h = H >> 1;
  const A = new Float32Array(w * h), B = new Float32Array(w * h), M = new Float32Array(w * h), pA = new Uint8Array(w * h), pB = new Uint8Array(w * h), cls = new Uint8Array(w * h);
  PS.forEach((P, pi) => {
    const cs = [], sn = []; let kr = 0, ki = 0;
    for (let i = 0; i < N; i++) { cs.push(Math.cos((2 * Math.PI * (i - Rr)) / P)); sn.push(Math.sin((2 * Math.PI * (i - Rr)) / P)); kr += cs[i]; ki += sn[i]; }
    const aR = kr * kr - ki * ki, aI = 2 * kr * ki, bR = kr * kr + ki * ki;
    for (let Y = 0; Y < h; Y++) for (let X = 0; X < w; X++) {
      const x0 = X * 2 + 1 - Rr, y0 = Y * 2 + 1 - Rr; if (x0 < 0 || y0 < 0 || x0 + N > W || y0 + N > H) continue;
      let ar = 0, ai = 0, br = 0, bi = 0, s = 0;
      for (let j = 0; j < N; j++) { let re = 0, im = 0; const o = (y0 + j) * W + x0; for (let i = 0; i < N; i++) { const v = g[o + i]; re += v * cs[i]; im += v * sn[i]; s += v; } const c = cs[j], d = sn[j]; ar += re * c - im * d; ai += re * d + im * c; br += re * c + im * d; bi += im * c - re * d; }
      const m = s / (N * N), k = Y * w + X, a = Math.hypot(ar - m * aR, ai - m * aI) / (N * N), b = Math.hypot(br - m * bR, bi) / (N * N);
      if (a > A[k]) { A[k] = a; pA[k] = pi; } if (b > B[k]) { B[k] = b; pB[k] = pi; } M[k] = m;
    }
  });
  for (let k = 0; k < w * h; k++) { const a = A[k], b = B[k], m = M[k], mn = Math.min(a, b), mx = Math.max(a, b); cls[k] = mn >= 8.5 && mn >= 0.4 * mx && m < 165 ? 1 : mx >= 12 && m < 175 ? 2 : m < 88 ? 3 : m < 150 ? 4 : 0; }
  return { A, B, M, pA, pB, cls, w, h, margen: Rr / 2 };
}
export const COLORES = [[236, 226, 204], [60, 50, 44], [140, 170, 110], [200, 30, 30], [120, 160, 210]]; // papel, edificado, patio, macizo, otra tinta (los de tmp/clases-ver.jpg)
export const NOMBRES = ['papel', 'edificado (rayado cruzado)', 'patio o fondo (rayado simple)', 'negro lleno', 'otra tinta'];

/** un recorte de tmp/clases.png (lo que dejó tools/1-clases.mjs), a media resolución */
export async function clasesGuardadas(x0, y0, w, h) {
  const { data } = await sharp(R('tmp/clases.png')).extract({ left: x0 >> 1, top: y0 >> 1, width: w >> 1, height: h >> 1 }).extractChannel(0).raw().toBuffer({ resolveWithObject: true });
  return data;
}

/** abre un .pak del visor */
export function pak(f) {
  const buf = gunzipSync(readFileSync(R(f))), n = buf.readUInt32LE(0), cab = JSON.parse(buf.subarray(4, 4 + n).toString('utf8')), o = {}; let p = 4 + n;
  for (const { nombre, bytes, registro } of cab.partes) { const src = buf.subarray(p, p + bytes), dst = Buffer.alloc(bytes), m = bytes / registro; for (let k = 0; k < registro; k++) for (let i = 0; i < m; i++) dst[i * registro + k] = src[k * m + i]; o[nombre] = dst; p += bytes; }
  return o;
}
export const f32 = (b) => new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
export const u16 = (b) => new Uint16Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
export const u32 = (b) => new Uint32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));

/** la ciudad de 1867 tal como la baja el visor */
export function ciudad67() {
  const p = pak('public/datos/ciudad.pak');
  return { mz: f32(p.manzanas), te: u16(p.techos), mu: u16(p.muros), ar: f32(p.arboles), meta: JSON.parse(readFileSync(R('public/datos/ciudad.json'), 'utf8')) };
}
/** un punto (u, v) de la grilla de la manzana b, en píxeles del escaneo */
export const enPlano = (mz, b, u, v) => { const k = b * 10, s = u / mz[k + 8], t = v / mz[k + 9], a = (1 - s) * (1 - t), c = s * (1 - t), d = s * t, e = (1 - s) * t; return [a * mz[k] + c * mz[k + 2] + d * mz[k + 4] + e * mz[k + 6], a * mz[k + 1] + c * mz[k + 3] + d * mz[k + 5] + e * mz[k + 7]]; };

/** una imagen de un canal → RGB con una rampa (0 claro … máx oscuro) */
export const rampa = (v, max, de = [247, 238, 219], a = [46, 38, 32]) => { const o = Buffer.alloc(v.length * 3); for (let k = 0; k < v.length; k++) { const t = Math.min(1, v[k] / max); for (let c = 0; c < 3; c++) o[k * 3 + c] = de[c] + (a[c] - de[c]) * t; } return o; };
export const png = (rgb, w, h, escala = 1) => sharp(rgb, { raw: { width: w, height: h, channels: 3 } }).resize(w * escala, h * escala, { kernel: 'nearest' }).png().toBuffer();
/** arma una hoja: paneles (buffers PNG del mismo tamaño) en filas, con rótulo debajo de cada uno */
export async function hoja(paneles, cols, { pw, ph, rotulo = 30, sep = 10, fondo = '#ffffff' }) {
  const filas = Math.ceil(paneles.length / cols), W = cols * pw + (cols + 1) * sep, H = filas * (ph + rotulo) + (filas + 1) * sep;
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const comp = [], textos = [];
  paneles.forEach(({ img, texto }, i) => { const cx = i % cols, cy = Math.floor(i / cols), x = sep + cx * (pw + sep), y = sep + cy * (ph + rotulo + sep); comp.push({ input: img, left: x, top: y }); textos.push(`<text x="${x + 2}" y="${y + ph + 20}" font-family="Helvetica, Arial, sans-serif" font-size="15" fill="#222">${esc(texto)}</text>`); });
  comp.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${textos.join('')}</svg>`), left: 0, top: 0 });
  return sharp({ create: { width: W, height: H, channels: 3, background: fondo } }).composite(comp).png({ compressionLevel: 9 });
}
