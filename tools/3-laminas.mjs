// Paso 3: el plano como textura. En gris (es tinta sobre papel: el color lo pone el visor), en varios niveles:
//   primero.webp   todo el pliego, 1024 de ancho y bien liviano: lo primero que se ve, mientras llega lo demás
//   chico.webp     todo el pliego, 2048 de ancho
//   medio-4k.webp  todo el pliego, 4096 de ancho: el nivel intermedio de los teléfonos
//   medio.webp     todo el pliego, 8192 de ancho: el de las pantallas grandes
//   f/<i>-<j>.webp el pliego al tamaño del escaneo, en teselas de 3072 píxeles: el visor carga las cuatro que rodean
//                  lo que se está mirando. Ahí se ve el rayado del grabador.
import sharp from 'sharp';
import { mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { PLANO } from './plano.mjs';
const T = 3072, cols = Math.ceil(PLANO.ancho / T), rows = Math.ceil(PLANO.alto / T);
rmSync('public/plano', { recursive: true, force: true }); mkdirSync('public/plano/f', { recursive: true });
const gris = await sharp('fuentes/plano-1867.jpg', { limitInputPixels: false }).greyscale().linear(255 / (214 - 50), (-50 * 255) / (214 - 50)).raw().toBuffer();
const src = () => sharp(gris, { raw: { width: PLANO.ancho, height: PLANO.alto, channels: 1 }, limitInputPixels: false });
await src().resize({ width: 1024 }).webp({ quality: 62, effort: 6 }).toFile('public/plano/primero.webp');
await src().resize({ width: 2048 }).webp({ quality: 80 }).toFile('public/plano/chico.webp');
await src().resize({ width: 4096 }).webp({ quality: 50, effort: 6 }).toFile('public/plano/medio-4k.webp');
await src().resize({ width: 8192 }).webp({ quality: 50, effort: 6 }).toFile('public/plano/medio.webp');
let total = 0;
for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
  const f = `public/plano/f/${i}-${j}.webp`;
  await src().extract({ left: i * T, top: j * T, width: Math.min(T, PLANO.ancho - i * T), height: Math.min(T, PLANO.alto - j * T) }).webp({ quality: 48, effort: 6 }).toFile(f);
  total += statSync(f).size;
}
writeFileSync('public/plano/laminas.json', JSON.stringify({ ancho: PLANO.ancho, alto: PLANO.alto, tesela: T, cols, rows }));
for (const f of ['primero', 'chico', 'medio-4k', 'medio']) console.log(f, (statSync(`public/plano/${f}.webp`).size / 1e6).toFixed(2), 'MB');
console.log(`${cols * rows} teselas`, (total / 1e6).toFixed(1), 'MB en total');
