// Los planos de otras épocas, calzados sobre el de 1867. El visor no los muestra: de ellos sale qué estaba edificado en
// cada año, para las casas que se suman en la línea de tiempo (tools/crece.mjs, que corre después de este).
// Cada plano se baja a fuentes/planos/ (son de dominio público, de Wikimedia Commons y de la AGS Library; ver EPOCAS) y se lleva al marco
// de la lámina de 1867 en dos pasos:
//   1. un calce grueso con cinco o seis plazas marcadas a mano (de Mayo, el Once, Constitución, San Martín, Lavalle, la Recoleta);
//   2. un ajuste fino automático contra las calles de hoy (public/plano/hoy-cerca.webp, que ya está en el marco de
//      1867): en ventanas de unos 600 m se busca el corrimiento que mejor pone las calles del plano viejo (lo claro
//      entre manzana y manzana) sobre las de hoy, y con todos esos corrimientos se ajusta una transformación de
//      segundo grado. Fuera de la zona con calles (el río, el campo) vale lo que diga esa transformación.
//   node tools/epocas.mjs [año …] [--ver]   →   fuentes/planos/epoca-<año>.webp (4096) y epoca-<año>-2k.webp,
//                                               fuentes/planos/indice.json, y con --ver tmp/epoca-<año>.jpg para mirar.
import sharp from 'sharp';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { PLANO } from './plano.mjs';

/** año, de dónde sale, y los puntos del calce grueso: [x, y en el plano nuevo, x, y en el de 1867]. */
export const EPOCAS = [
  {
    año: 1888, titulo: 'Plano de la ciudad de Buenos Aires y de los partidos federalizados de San José de Flores y de Belgrano',
    autor: 'F. Latzina; Félix Lajouane, editor (grabado por Erhard hermanos)', fuente: 'Bibliothèque nationale de France, vía Wikimedia Commons', licencia: 'Dominio público',
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Plano_de_la_ciudad_de_Buenos-Aires_y_de_los_partidos_federalizados_de_San_Jose_de_Flores_y_de_Belgrano._1888._Geografia_de_la_Rep%C3%BAblica_Argentina_-_por_F._Latzina_%3B_Felix_Lajouane%2C_editor_-_btv1b53025268c.jpg',
    puntos: [[5538, 2589, 10340, 9590], [4584, 2641, 10512, 4862], [5307, 3184, 7512, 8112], [5407, 2115, 12512, 9112], [4976, 1854, 13929, 7047], [5189, 2346, 11590, 8003]],
  },
  {
    año: 1895, titulo: 'Plano topográfico de la ciudad de Buenos Aires, capital de la República Argentina',
    autor: 'Oficina de Obras Públicas de la Municipalidad (grabado en los talleres del Museo de La Plata)', fuente: 'Wikimedia Commons', licencia: 'Dominio público',
    url: 'https://upload.wikimedia.org/wikipedia/commons/d/d6/Plano_topografico_ciudad_buenos_aires_1895.jpg',
    puntos: [[6425, 9000, 10340, 9590], [6347, 7228, 10512, 4862], [5358, 8565, 7512, 8112], [7712, 7903, 13929, 7047], [6818, 8364, 11590, 8003]],
  },
  {
    año: 1905, titulo: 'Municipio de Buenos Aires y parte del partido de Avellaneda (5.ª edición)',
    autor: 'Pablo Ludwig, cartógrafo', fuente: 'Bibliothèque nationale de France, vía Wikimedia Commons', licencia: 'Dominio público',
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Municipio_de_Buenos_Aires_y_parte_del_partido_de_Avellaneda_-_publicado_por_Pablo_Ludwig..._-_btv1b530645133.jpg',
    puntos: [[6427, 3500, 10340, 9590], [5234, 3592, 10512, 4862], [6150, 4215, 7512, 8112], [6300, 2911, 12512, 9112], [5723, 2588, 13929, 7047]],
  },
  { // (el año es el de la etapa en la línea de tiempo; el plano lleva fecha de 1909 y salió para la Exposición de 1910)
    año: 1910, plano: 1909, titulo: 'Municipio de Buenos Aires y parte del partido de Avellaneda (edición extraordinaria para la Exposición Internacional de 1910)',
    autor: 'Pablo Ludwig, cartógrafo', fuente: 'Bibliothèque nationale de France, vía Wikimedia Commons', licencia: 'Dominio público',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Municipio_de_Buenos-Aires_y_parte_del_partido_de_Avellaneda_-_publicado_por_Pablo_Ludwig..._-_btv1b530635989.jpg',
    puntos: [[6032, 3500, 10340, 9590], [4839, 3596, 10512, 4862], [5755, 4215, 7512, 8112], [5905, 2911, 12512, 9112], [5328, 2588, 13929, 7047]],
  },
  {
    año: 1921, plano: 1921, titulo: 'Plano de la ciudad de Buenos Aires y sus alrededores',
    autor: 'A. Cannizzaro; Oficina Cartográfica Ludwig', fuente: 'American Geographical Society Library, University of Wisconsin-Milwaukee Libraries', licencia: 'Dominio público',
    url: 'https://collections.lib.uwm.edu/iiif/2/agdm:5385/full/full/0/default.jpg',
    puntos: [[5362, 7653, 10340, 9590], [5408, 6131, 10512, 4862], [4461, 7213, 7512, 8112], [5770, 7152, 11590, 8003], [6078, 7516, 12512, 9112], [6513, 6830, 13929, 7047]],
  },
  { // (el plano es de 1936; la etapa se llama 1940 porque suma las obras abiertas hasta ese año: ver tools/crece.mjs)
    año: 1940, plano: 1936, titulo: 'Nuevo plano de la ciudad de Buenos Aires (Guía Peuser del viajero)',
    autor: 'Casa Jacobo Peuser', fuente: 'Bibliothèque nationale de France, vía Wikimedia Commons', licencia: 'Dominio público',
    url: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Nuevo_plano_de_la_ciudad_de_Buenos_Aires._Guia_Peuser_del_viajero_-_btv1b531214306_%282_of_2%29.jpg',
    puntos: [[4416, 5447, 10340, 9590], [4466, 4370, 10512, 4862], [3786, 5113, 7512, 8112], [4686, 5092, 11590, 8003], [4910, 5348, 12512, 9112], [5247, 4871, 13929, 7047]],
  },
];

const args = process.argv.slice(2), ver = args.includes('--ver'), pedidos = args.filter((a) => /^\d+$/.test(a)).map(Number);
mkdirSync('fuentes/planos', { recursive: true }); mkdirSync('tmp', { recursive: true });

// --- cuentas chicas ---
/** mínimos cuadrados: A (filas) · c = b */
function resolver(A, b) {
  const n = A[0].length, M = Array.from({ length: n }, () => new Float64Array(n + 1));
  for (let r = 0; r < A.length; r++) for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) M[i][j] += A[r][i] * A[r][j]; M[i][n] += A[r][i] * b[r]; }
  for (let i = 0; i < n; i++) { let p = i; for (let k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[p][i])) p = k; [M[i], M[p]] = [M[p], M[i]]; for (let k = i + 1; k < n; k++) { const f = M[k][i] / M[i][i]; for (let j = i; j <= n; j++) M[k][j] -= f * M[i][j]; } }
  const c = new Float64Array(n); for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let j = i + 1; j < n; j++) s -= M[i][j] * c[j]; c[i] = s / M[i][i]; }
  return c;
}
const U = (x) => (x - PLANO.plaza[0]) / 4000, V = (y) => (y - PLANO.plaza[1]) / 4000;
const base = (x, y, grado) => { const u = U(x), v = V(y); return grado === 1 ? [1, u, v] : [1, u, v, u * u, u * v, v * v]; };
/** La transformación (plano de 1867 → plano nuevo) que mejor pasa por los pares [x67, y67, xn, yn]. */
function ajustar(pares, grado) {
  const A = pares.map(([x, y]) => base(x, y, grado)), cx = resolver(A, pares.map((p) => p[2])), cy = resolver(A, pares.map((p) => p[3]));
  const f = (x, y) => { const b = base(x, y, grado); let X = 0, Y = 0; for (let i = 0; i < b.length; i++) { X += cx[i] * b[i]; Y += cy[i] * b[i]; } return [X, Y]; };
  f.coef = { grado, x: [...cx], y: [...cy] }; return f;
}
const desenfocar = (m, w, h, r) => { // caja, dos pasadas por eje (alcanza para lo que se busca)
  let a = Float32Array.from(m), b = new Float32Array(w * h);
  for (let v = 0; v < 2; v++) {
    for (let y = 0; y < h; y++) { let s = 0; for (let x = -r; x <= r; x++) s += a[y * w + Math.min(w - 1, Math.max(0, x))]; for (let x = 0; x < w; x++) { b[y * w + x] = s / (2 * r + 1); s += a[y * w + Math.min(w - 1, x + r + 1)] - a[y * w + Math.max(0, x - r)]; } }
    for (let x = 0; x < w; x++) { let s = 0; for (let y = -r; y <= r; y++) s += b[Math.min(h - 1, Math.max(0, y)) * w + x]; for (let y = 0; y < h; y++) { a[y * w + x] = s / (2 * r + 1); s += b[Math.min(h - 1, y + r + 1) * w + x] - b[Math.max(0, y - r) * w + x]; } }
  }
  return a;
};

// --- las calles de hoy, en el marco de 1867 ---
const callesDe = async (W) => { const H = Math.round((W * PLANO.alto) / PLANO.ancho), { data } = await sharp('public/plano/hoy-cerca.webp', { limitInputPixels: false }).resize(W, H, { fit: 'fill' }).extractChannel(0).raw().toBuffer({ resolveWithObject: true }); return { W, H, m: Float32Array.from(data) }; };

const indice = [];
for (const e of EPOCAS) {
  if (pedidos.length && !pedidos.includes(e.año)) { if (existsSync(`fuentes/planos/epoca-${e.año}.webp`)) indice.push(e); continue; }
  const archivo = `fuentes/planos/${e.año}.jpg`;
  if (!existsSync(archivo)) { const r = await fetch(e.url, { headers: { 'User-Agent': 'mapas-historicos/1.0 (visor de planos antiguos)' } }); if (!r.ok) throw new Error(`${e.año}: ${r.status}`); writeFileSync(archivo, Buffer.from(await r.arrayBuffer())); }
  const { data: rgb, info } = await sharp(archivo, { limitInputPixels: false, failOn: 'none' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const mw = info.width, mh = info.height, gris = new Float32Array(mw * mh);
  for (let q = 0; q < mw * mh; q++) gris[q] = (rgb[q * 3] * 0.3 + rgb[q * 3 + 1] * 0.5 + rgb[q * 3 + 2] * 0.2);
  const tomar = (m, x, y) => { if (!(x >= 0 && y >= 0 && x < mw - 1 && y < mh - 1)) return -1; const i = Math.floor(x), j = Math.floor(y), a = x - i, b = y - j, q = j * mw + i; return m[q] * (1 - a) * (1 - b) + m[q + 1] * a * (1 - b) + m[q + mw] * (1 - a) * b + m[q + mw + 1] * a * b; };

  let T = ajustar(e.puntos.map(([xn, yn, x, y]) => [x, y, xn, yn]), 1);
  // el ajuste fino, tres vueltas: de lejos y con ventanas grandes a de cerca y con ventanas chicas
  for (const [W, radio, lado, paso, grado] of [[2365, 20, 300, 100, 1], [2365, 10, 160, 80, 2], [4730, 8, 200, 100, 2]]) {
    const { H, m: S } = await callesDe(W), k = PLANO.ancho / W;
    const M = new Float32Array(W * H), hay = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const [X, Y] = T((x + 0.5) * k, (y + 0.5) * k), v = tomar(gris, X, Y); if (v >= 0) { M[y * W + x] = v; hay[y * W + x] = 1; } }
    const fondo = desenfocar(M, W, H, Math.round(40 / (k * PLANO.metro))); // (la manzana y su calle: unos 40 m)
    for (let q = 0; q < W * H; q++) M[q] = hay[q] ? M[q] - fondo[q] : 0;
    const pares = [];
    for (let cy = lado; cy < H - lado; cy += paso) for (let cx = lado; cx < W - lado; cx += paso) {
      const pts = []; let vacio = 0;
      for (let y = cy - lado / 2; y < cy + lado / 2; y++) for (let x = cx - lado / 2; x < cx + lado / 2; x++) { const q = y * W + x; if (!hay[q]) vacio++; else if (S[q] > 90) pts.push(q); }
      if (pts.length < lado * lado * 0.04 || vacio > lado * lado * 0.2) continue;
      let mejor = -1e30, bx = 0, by = 0, suma = 0, suma2 = 0, n = 0;
      for (let dy = -radio; dy <= radio; dy++) for (let dx = -radio; dx <= radio; dx++) { let s = 0; const d = dy * W + dx; for (let i = 0; i < pts.length; i++) s += M[pts[i] + d]; s /= pts.length; suma += s; suma2 += s * s; n++; if (s > mejor) { mejor = s; bx = dx; by = dy; } }
      const media = suma / n, desvio = Math.sqrt(Math.max(1e-9, suma2 / n - media * media)), nota = (mejor - media) / desvio;
      if (nota < 3.2 || Math.abs(bx) === radio || Math.abs(by) === radio) continue;
      const [X, Y] = T((cx + bx + 0.5) * k, (cy + by + 0.5) * k); pares.push([(cx + 0.5) * k, (cy + 0.5) * k, X, Y, nota]);
    }
    if (pares.length < 12) { console.log(`  ${e.año}: solo ${pares.length} ventanas a ${W} px, se deja como estaba`); continue; }
    // ajuste robusto: se ajusta, se sacan las ventanas que quedan lejos, y otra vez
    let usados = pares, f = ajustar(usados, grado), err = 0;
    for (let v = 0; v < 4; v++) { const d = usados.map((p) => { const [X, Y] = f(p[0], p[1]); return Math.hypot(X - p[2], Y - p[3]); }), orden = [...d].sort((a, b) => a - b), med = orden[Math.floor(orden.length / 2)]; err = med; const tope = Math.max(med * 2.5, 0.5); usados = usados.filter((p, i) => d[i] <= tope); f = ajustar(usados, grado); }
    T = f;
    const mpp = Math.hypot(...T(PLANO.plaza[0] + 1000, PLANO.plaza[1]).map((v, i) => v - T(...PLANO.plaza)[i])) / 1000; // píxeles del plano nuevo por píxel del de 1867
    console.log(`  ${e.año} · ${W} px, ±${radio}: ${pares.length} ventanas, quedan ${usados.length}, error mediano ${(err / mpp * PLANO.metro).toFixed(1)} m`);
  }

  // la lámina: el plano nuevo en el marco de 1867, en color, transparente donde no llega
  for (const [nombre, W] of [[`epoca-${e.año}`, 4096], [`epoca-${e.año}-2k`, 2048]]) {
    const H = Math.round((W * PLANO.alto) / PLANO.ancho), k = PLANO.ancho / W, out = Buffer.alloc(W * H * 4);
    const [i0, j0, i1, j1] = PLANO.interior.map((v) => v / k);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (x < i0 || x > i1 || y < j0 || y > j1) continue;
      const [X, Y] = T((x + 0.5) * k, (y + 0.5) * k); if (!(X >= 0 && Y >= 0 && X < mw - 1 && Y < mh - 1)) continue;
      const i = Math.floor(X), j = Math.floor(Y), a = X - i, b = Y - j, q = (j * mw + i) * 3, o = (y * W + x) * 4;
      for (let c = 0; c < 3; c++) out[o + c] = rgb[q + c] * (1 - a) * (1 - b) + rgb[q + 3 + c] * a * (1 - b) + rgb[q + mw * 3 + c] * (1 - a) * b + rgb[q + mw * 3 + 3 + c] * a * b;
      out[o + 3] = 255;
    }
    await sharp(out, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 78, effort: 5 }).toFile(`fuentes/planos/${nombre}.webp`);
    if (ver && W === 2048) {
      const calles = await callesDe(W), mezcla = Buffer.alloc(W * H * 3);
      for (let q = 0; q < W * H; q++) { const s = calles.m[q] / 255; mezcla[q * 3] = out[q * 4] * (1 - s) + 255 * s; mezcla[q * 3 + 1] = out[q * 4 + 1] * (1 - s); mezcla[q * 3 + 2] = out[q * 4 + 2] * (1 - s); }
      await sharp(mezcla, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 82 }).toFile(`tmp/epoca-${e.año}.jpg`);
    }
  }
  e.calce = T.coef; indice.push(e);
  console.log(`fuentes/planos/epoca-${e.año}.webp`);
}
writeFileSync('fuentes/planos/indice.json', JSON.stringify(indice.map(({ año, plano, titulo, autor, fuente, licencia }) => ({ año, plano: plano ?? año, titulo, autor, fuente, licencia }))));
console.log('fuentes/planos/indice.json:', indice.map((e) => e.año).join(', '));
process.exit(0);
