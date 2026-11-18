// Los árboles de los parques de la Costanera Norte: uno cada tanto donde la lámina del suelo tiene pasto, adentro de
// los contornos de los parques (src/playas-retiro.js). Deja la lista en src/lugares/costanera-arboles.js, que usa
// src/lugares/playas-retiro.js. Correr después de tools/crece.mjs si cambian los parques:
//   node tools/costanera.mjs
// (El plano de Peuser puntea los canteros de árboles, pero no uno por uno: la posición de cada árbol es al azar,
// con una tirada fija.)
import fs from 'node:fs';
import sharp from 'sharp';
import { PARQUES_NORTE } from '../src/playas-retiro.js';

const ANCHO = 18919; // el ancho del plano, en píxeles (fuentes/plano-1867.jpg)
const PASO = 36, CUANTOS = 0.7; // un casillero cada 36 px (unos 24 m); en siete de cada diez va un árbol
const { data, info } = await sharp(new URL('../public/plano/despeje.webp', import.meta.url).pathname).raw().toBuffer({ resolveWithObject: true });
const k = info.width / ANCHO, C = info.channels;
const pasto = (px, py) => { const x = Math.round(px * k), y = Math.round(py * k); return x >= 0 && y >= 0 && x < info.width && y < info.height && data[(y * info.width + x) * C + 1] > 0; };
const adentro = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
let semilla = 1936; const al = () => { semilla = (semilla * 1664525 + 1013904223) >>> 0; return semilla / 4294967296; };

const xs = PARQUES_NORTE.flat().map((p) => p[0]), ys = PARQUES_NORTE.flat().map((p) => p[1]), out = [];
for (let y = Math.min(...ys); y < Math.max(...ys); y += PASO) for (let x = Math.min(...xs); x < Math.max(...xs); x += PASO) {
  const px = Math.round(x + (0.15 + al() * 0.7) * PASO), py = Math.round(y + (0.15 + al() * 0.7) * PASO), r = Math.round((3.2 + al() * 1.6) * 10) / 10, va = al() < CUANTOS;
  if (!va || !PARQUES_NORTE.some((P) => adentro(P, px, py))) continue;
  // (con pasto alrededor: ni en el borde de un cantero ni sobre un sendero)
  if (![[0, 0], [9, 0], [-9, 0], [0, 9], [0, -9]].every(([a, b]) => pasto(px + a, py + b))) continue;
  out.push([px, py, r]);
}
fs.writeFileSync(new URL('../src/lugares/costanera-arboles.js', import.meta.url), `// Los árboles de los parques de la Costanera Norte: [px, py, radio]. Lo escribe tools/costanera.mjs; no tocar a mano.\nexport default ${JSON.stringify(out)};\n`);
console.log(`${out.length} árboles en los parques de la Costanera Norte`);
