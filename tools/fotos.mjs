// Las fotos de época de las fichas: de fuentes/fotos (tal como se bajaron de Wikimedia Commons, cada una con su .json
// de datos: título del archivo, autor, fecha, licencia y dirección de la página) a lo que pide el sitio:
//   public/fotos/<nombre>.webp     la grande, para el visor (lado mayor ≤ 1400 px)
//   public/fotos/m/<nombre>.webp   la de la ficha (ancho ≤ 720 px)
//   src/fotos.json                 medidas y procedencia de cada una (lo lee src/fichas.js)
// En fuentes/fotos están solo las que alguna ficha muestra.   node tools/fotos.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import sharp from 'sharp';

const DE = 'fuentes/fotos', A = 'public/fotos';
// Recortes [x0, y0, x1, y1] en fracción de la imagen: para sacar el cartón del álbum o el borde del escaneo.
const RECORTES = JSON.parse(readFileSync(`${DE}/recortes.json`, 'utf8'));
const USADAS = readdirSync(DE).filter((f) => f.endsWith('.json') && f !== 'recortes.json').map((f) => f.slice(0, -5)).sort();

mkdirSync(`${A}/m`, { recursive: true });
const datos = {};
let total = 0;
for (const nombre of USADAS) {
  const origen = ['jpg', 'png'].map((e) => `${DE}/${nombre}.${e}`).find(existsSync);
  if (!origen) { console.log('FALTA', nombre); continue; }
  const c = JSON.parse(readFileSync(`${DE}/${nombre}.json`, 'utf8'));
  const m = await sharp(origen).metadata();
  const [x0, y0, x1, y1] = RECORTES[nombre] ?? [0, 0, 1, 1];
  const zona = { left: Math.round(x0 * m.width), top: Math.round(y0 * m.height), width: Math.round((x1 - x0) * m.width), height: Math.round((y1 - y0) * m.height) };
  const base = () => sharp(origen).extract(zona).flatten({ background: '#ffffff' });
  const g = await base().resize(1400, 1400, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toFile(`${A}/${nombre}.webp`);
  const ch = await base().resize(720, 900, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 72 }).toFile(`${A}/m/${nombre}.webp`);
  total += g.size + ch.size;
  datos[nombre] = { w: ch.width, h: ch.height, titulo: c.titulo, autor: c.autor, fecha: c.fecha, licencia: c.licencia, fuente: c.url };
  console.log(nombre.padEnd(26), `${m.width}x${m.height} → ${g.width}x${g.height}`, (g.size / 1024).toFixed(0) + ' KB', '+', (ch.size / 1024).toFixed(0) + ' KB');
}
// lo que ya no se usa, afuera
for (const d of [A, `${A}/m`]) for (const f of readdirSync(d)) if (f.endsWith('.webp') && !datos[f.slice(0, -5)]) { rmSync(`${d}/${f}`); console.log('quitada', `${d}/${f}`); }
writeFileSync('src/fotos.json', JSON.stringify(datos, null, 1) + '\n');
console.log(Object.keys(datos).length, 'fotos ·', (total / 1048576).toFixed(2), 'MB en', A, '·', statSync('src/fotos.json').size, 'bytes de datos');
