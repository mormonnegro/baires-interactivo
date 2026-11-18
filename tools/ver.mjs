// Recorta un pedazo de una imagen y lo agranda o achica, para mirarlo. Con cuadrícula si se pide (cada `g` píxeles de la fuente).
//   node tools/ver.mjs x y w h escala salida [fuente] [g]
import sharp from 'sharp';
const [x, y, w, h, s, out, src = 'fuentes/plano-1867.jpg', g = 0] = process.argv.slice(2);
const W = Math.round(+w * +s), H = Math.round(+h * +s);
let img = sharp(src, { limitInputPixels: false }).extract({ left: +x, top: +y, width: +w, height: +h }).resize({ width: W, height: H, fit: 'fill', kernel: +s > 1 ? 'nearest' : 'lanczos3' });
if (+g) {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
  for (let v = Math.ceil(+x / +g) * +g; v < +x + +w; v += +g) { const p = (v - x) * s; svg += `<line x1="${p}" y1="0" x2="${p}" y2="${H}" stroke="#e00" stroke-width="1" opacity=".55"/><text x="${p + 3}" y="14" font-size="14" font-family="Helvetica" fill="#c00" font-weight="bold">${v}</text>`; }
  for (let v = Math.ceil(+y / +g) * +g; v < +y + +h; v += +g) { const p = (v - y) * s; svg += `<line x1="0" y1="${p}" x2="${W}" y2="${p}" stroke="#06c" stroke-width="1" opacity=".55"/><text x="3" y="${p - 3}" font-size="14" font-family="Helvetica" fill="#04a" font-weight="bold">${v}</text>`; }
  img = sharp(await img.png().toBuffer()).composite([{ input: Buffer.from(svg + '</svg>') }]);
}
await img.jpeg({ quality: 86 }).toFile(out);
