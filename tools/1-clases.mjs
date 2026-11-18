// Paso 1: leer el rayado del plano. El grabador rayó a máquina lo construido y los fondos, con líneas a 45° cada
// 4 píxeles: cruzadas donde hay edificio, en un solo sentido donde hay patio o fondo. Todo lo demás (agua, barrancas,
// árboles, letras) está dibujado a mano y no tiene ese ritmo. Así que alrededor de cada punto se mide cuánta señal
// hay con ese ritmo en cada diagonal:
//   edificado   señal en las dos diagonales
//   patio       señal en una sola
//   macizo      negro lleno (las iglesias)
//   otra tinta  oscuro, pero sin el ritmo del rayado (edificios públicos, que llevan otro rayado; agua; letras)
//   papel       lo demás
// Sale tmp/clases.png, a la mitad del tamaño del plano (1 píxel = 1,35 m), tmp/tono.png y tmp/clases-ver.jpg para mirar.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const PAPEL = 0, EDIF = 1, PATIO = 2, MACIZO = 3, OTRO = 4;
// El rayado no tiene el mismo paso en todo el plano (entre 4 y 6,5 píxeles sobre x±y, según la zona): se prueban tres
// períodos y se toma el que más responde.
const PS = [4.2, 5.05, 6.1], N = 12, R = N / 2; // la ventana: 12 × 12 píxeles, unos 8 m

const { data: g, info } = await sharp('fuentes/plano-1867.jpg', { limitInputPixels: false }).greyscale().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, w = W >> 1, h = H >> 1;
console.log('plano', W, H, '→ clases', w, h);
const out = new Uint8Array(w * h), tone = new Uint8Array(w * h);
const waves = PS.map((P) => {
  const cs = [], sn = []; let kr = 0, ki = 0;
  for (let i = 0; i < N; i++) { cs.push(Math.cos(2 * Math.PI * (i - R) / P)); sn.push(Math.sin(2 * Math.PI * (i - R) / P)); kr += cs[i]; ki += sn[i]; }
  // (lo que daría un gris parejo: se le resta, para que una mancha oscura sin rayas no cuente)
  return { cs, sn, aR: kr * kr - ki * ki, aI: 2 * kr * ki, bR: kr * kr + ki * ki };
});

const STRIP = 256, rowsMax = STRIP * 2 + N + 2;
const hRe = new Float32Array(w * rowsMax), hIm = new Float32Array(w * rowsMax), hSum = new Float32Array(w * rowsMax);
const bestA = new Float32Array(w * STRIP), bestB = new Float32Array(w * STRIP), mean = new Float32Array(w * STRIP);
for (let Y0 = 0; Y0 < h; Y0 += STRIP) {
  const Y1 = Math.min(h, Y0 + STRIP), top = Y0 * 2 + 1 - R, n = (Y1 - Y0) * 2 + N;
  bestA.fill(0); bestB.fill(0);
  for (let pi = 0; pi < waves.length; pi++) {
    const { cs, sn, aR, aI, bR } = waves[pi];
    // a lo ancho: para cada columna de salida, la suma de la fila contra la onda
    for (let j = 0; j < n; j++) {
      const y = Math.min(H - 1, Math.max(0, top + j)) * W, o = j * w;
      for (let X = 0; X < w; X++) {
        const x0 = X * 2 + 1 - R;
        let re = 0, im = 0, s = 0;
        if (x0 >= 0 && x0 + N <= W) for (let i = 0; i < N; i++) { const v = g[y + x0 + i]; re += v * cs[i]; im += v * sn[i]; s += v; }
        else s = 255 * N;
        hRe[o + X] = re; hIm[o + X] = im; hSum[o + X] = s;
      }
    }
    // a lo alto: las dos diagonales salen de girar la onda para un lado o para el otro
    for (let Y = Y0; Y < Y1; Y++) for (let X = 0; X < w; X++) {
      const j0 = (Y - Y0) * 2;
      let ar = 0, ai = 0, br = 0, bi = 0, s = 0;
      for (let i = 0; i < N; i++) {
        const o = (j0 + i) * w + X, re = hRe[o], im = hIm[o], c = cs[i], d = sn[i];
        ar += re * c - im * d; ai += re * d + im * c; br += re * c + im * d; bi += im * c - re * d; s += hSum[o];
      }
      const M = s / (N * N), k = (Y - Y0) * w + X;
      const a = Math.hypot(ar - M * aR, ai - M * aI) / (N * N), b = Math.hypot(br - M * bR, bi) / (N * N);
      if (a > bestA[k]) bestA[k] = a; if (b > bestB[k]) bestB[k] = b; mean[k] = M;
    }
  }
  for (let Y = Y0; Y < Y1; Y++) for (let X = 0; X < w; X++) {
    const k = (Y - Y0) * w + X, a = bestA[k], b = bestB[k], M = mean[k], mn = Math.min(a, b), mx = Math.max(a, b);
    let c;
    // (cruzado de verdad: las dos diagonales responden parecido. Si una sola responde fuerte y la otra apenas, es un fondo.)
    if (mn >= 8.5 && mn >= 0.4 * mx && M < 165) c = EDIF;
    else if (mx >= 12 && M < 175) c = PATIO;
    else if (M < 88) c = MACIZO;
    else if (M < 150) c = OTRO;
    else c = PAPEL;
    out[Y * w + X] = c; tone[Y * w + X] = M;
  }
  process.stdout.write(`\r${Math.round(Y1 / h * 100)}%`);
}
console.log();
mkdirSync('tmp', { recursive: true });
await sharp(out, { raw: { width: w, height: h, channels: 1 } }).png({ compressionLevel: 6 }).toFile('tmp/clases.png');
await sharp(tone, { raw: { width: w, height: h, channels: 1 } }).png({ compressionLevel: 6 }).toFile('tmp/tono.png');
const COL = [[236, 226, 204], [60, 50, 44], [140, 170, 110], [200, 30, 30], [120, 160, 210]];
const rgb = Buffer.alloc(w * h * 3);
for (let k = 0; k < w * h; k++) { const c = COL[out[k]]; rgb[k * 3] = c[0]; rgb[k * 3 + 1] = c[1]; rgb[k * 3 + 2] = c[2]; }
await sharp(rgb, { raw: { width: w, height: h, channels: 3 }, limitInputPixels: false }).jpeg({ quality: 85 }).toFile('tmp/clases-ver.jpg');
console.log('listo');
