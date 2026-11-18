// La muestra de evaluación de la lectura automática: tres recortes de 300 × 300 m, elegidos por regla antes de mirarlos
// (sobre el eje que sale de la Plaza de la Victoria hacia el oeste, a 0,5, 2,0 y 3,5 km), con el escaneo, las clases
// del paso 1 y lo que llega al visor (techos por lote, árboles). El conteo de aciertos y errores se hace a ojo sobre
// las láminas grandes que deja en paper/medidas/muestra/ y se anota en paper/medidas/muestra-conteo.md.
//   node --max-old-space-size=8000 paper/medidas/muestra.mjs > paper/medidas/muestra.txt
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { PLANO } from '../../tools/plano.mjs';
import { FIG, R, ESCANEO, clasesGuardadas, COLORES, NOMBRES, ciudad67, enPlano, hoja } from './comun.mjs';

const M = PLANO.metro, S = 444; // 444 px = 299,7 m
const RECORTES = [0.5, 2.0, 3.5].map((km) => ({ nombre: `oeste-${km.toFixed(1)}km`, km, x: PLANO.plaza[0] - S / 2, y: Math.round(PLANO.plaza[1] - (km * 1000) / M) - S / 2 }));
const { mz, te, ar } = ciudad67();
mkdirSync(R('paper/medidas/muestra'), { recursive: true });
const paneles = [], out = [];
for (const c of RECORTES) {
  const X0 = c.x & ~1, Y0 = c.y & ~1, E = 3, P = S * E;
  const escaneo = await sharp(ESCANEO, { limitInputPixels: false }).extract({ left: X0, top: Y0, width: S, height: S }).resize(P, P, { kernel: 'lanczos3' }).png().toBuffer();
  const cls = await clasesGuardadas(X0, Y0, S, S), w = S >> 1, rgb = Buffer.alloc(w * w * 3), n = [0, 0, 0, 0, 0];
  for (let k = 0; k < w * w; k++) { rgb.set(COLORES[cls[k]], k * 3); n[cls[k]]++; }
  const clases = await sharp(rgb, { raw: { width: w, height: w, channels: 3 } }).resize(P, P, { kernel: 'nearest' }).png().toBuffer();
  // lo que llega al visor: techos (un color por lote) y árboles
  const dentro = ([x, y]) => x > X0 && y > Y0 && x < X0 + S && y < Y0 + S, formas = [], lotes = new Set(); let techos = 0, arboles = 0;
  for (let i = 0; i < te.length / 8; i++) {
    const k = i * 8, b = te[k], Q = [[te[k + 1], te[k + 2]], [te[k + 3], te[k + 2]], [te[k + 3], te[k + 4]], [te[k + 1], te[k + 4]]].map(([u, v]) => enPlano(mz, b, u, v));
    if (!Q.some(dentro)) continue; techos++; const s = te[k + 6]; lotes.add(b + ':' + s);
    formas.push(`<polygon points="${Q.map(([x, y]) => `${((x - X0) * E).toFixed(1)},${((y - Y0) * E).toFixed(1)}`).join(' ')}" fill="rgb(${60 + (s * 7) % 180},${60 + (s * 13) % 180},${60 + (s * 29) % 180})" fill-opacity="0.6" stroke="#c0281a" stroke-width="1.2"/>`);
  }
  for (let i = 0; i < ar.length / 3; i++) { const x = ar[i * 3], y = ar[i * 3 + 1]; if (!dentro([x, y])) continue; arboles++; formas.push(`<circle cx="${((x - X0) * E).toFixed(1)}" cy="${((y - Y0) * E).toFixed(1)}" r="${(Math.max(2.5, ar[i * 3 + 2]) * E).toFixed(1)}" fill="none" stroke="#0a8f2a" stroke-width="2.4"/>`); }
  // una grilla de 4 × 4 con letras, para anotar el conteo
  const grilla = []; for (let i = 1; i < 4; i++) grilla.push(`<line x1="${(i * P) / 4}" y1="0" x2="${(i * P) / 4}" y2="${P}"/><line x1="0" y1="${(i * P) / 4}" x2="${P}" y2="${(i * P) / 4}"/>`);
  const rot = []; for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) rot.push(`<text x="${(i * P) / 4 + 6}" y="${(j * P) / 4 + 22}">${'ABCD'[i]}${j + 1}</text>`);
  const reja = `<g stroke="#1667c9" stroke-width="1" stroke-opacity="0.55">${grilla.join('')}</g><g font-family="Helvetica, Arial, sans-serif" font-size="18" fill="#1667c9">${rot.join('')}</g>`;
  const svg = (dentro) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${P}" height="${P}">${dentro}</svg>`);
  const visor = await sharp(escaneo).modulate({ brightness: 1.12 }).composite([{ input: svg(`<rect width="${P}" height="${P}" fill="#fff" fill-opacity="0.35"/>${formas.join('')}`) }]).png().toBuffer();
  await sharp(escaneo).composite([{ input: svg(reja) }]).png().toFile(R(`paper/medidas/muestra/${c.nombre}-escaneo.png`));
  await sharp(visor).composite([{ input: svg(reja) }]).png().toFile(R(`paper/medidas/muestra/${c.nombre}-visor.png`));
  await sharp(clases).composite([{ input: svg(reja) }]).png().toFile(R(`paper/medidas/muestra/${c.nombre}-clases.png`));
  const chico = (b) => sharp(b).resize(666, 666).png().toBuffer();
  paneles.push({ img: await chico(escaneo), texto: `${c.km.toFixed(1).replace('.', ',')} km al oeste: escaneo (300 × 300 m)` }, { img: await chico(clases), texto: 'clases del paso 1' }, { img: await chico(visor), texto: 'techos por lote y árboles del visor' });
  const pct = n.map((v) => ((100 * v) / (w * w)).toFixed(1));
  console.log(`${c.nombre}: píxeles [${X0}, ${Y0}] de ${S} px · clases (%): ${NOMBRES.map((nm, i) => `${nm} ${pct[i]}`).join('; ')} · techos ${techos} en ${lotes.size} lotes · árboles ${arboles}`);
  out.push({ ...c, x: X0, y: Y0, lado: S, clasesPct: Object.fromEntries(NOMBRES.map((nm, i) => [nm, +pct[i]])), techos, lotes: lotes.size, arboles });
}
await (await hoja(paneles, 3, { pw: 666, ph: 666 })).toFile(FIG('fig08-muestra.png'));
writeFileSync(new URL('./muestra.json', import.meta.url), JSON.stringify(out, null, 1));
