// Figura 3: el calce de calles. (a) un recorte del plano con las calles angostas de hoy (OpenStreetMap) llevadas al
// plano con el afín de referencias (azul) y con el ajuste fino (rojo); (b) el pliego con el corrimiento que halló cada
// ventana respecto del afín de referencias, exagerado. Solo lectura.
//   node --max-old-space-size=8000 paper/medidas/fig-calce.mjs > paper/medidas/calce.txt
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { PLANO } from '../../tools/plano.mjs';
import { grueso, aPlanoM } from '../../tools/geo.mjs';
import { metros } from '../../src/geo.js';
import { ESCANEO, FIG, R, hoja } from './comun.mjs';

const M = PLANO.metro, geo = JSON.parse(readFileSync(new URL('./georef.json', import.meta.url), 'utf8'));
const pares = geo.pares.map(([e, n, x, y]) => { const [a, b] = grueso(e, n); return { e, n, x, y, a, b, d: Math.hypot(x - a, y - b) * M }; });
// el recorte: la ventana cuyo corrimiento respecto del afín de referencias es el más cercano a la media (un caso típico, no el peor)
const media = pares.reduce((s, p) => s + p.d, 0) / pares.length;
const tip = pares.reduce((m, p) => (Math.abs(p.d - media) < Math.abs(m.d - media) ? p : m));
const S = 620, X0 = Math.round(tip.x - S / 2), Y0 = Math.round(tip.y - S / 2), E = 1000 / S;
console.log(`ventanas: ${pares.length}; corrimiento medio respecto del afín de referencias ${media.toFixed(1)} m`);
console.log(`recorte (a): ventana en este ${tip.e} m, norte ${tip.n} m de la Plaza de Mayo; corrimiento ${tip.d.toFixed(1)} m; píxeles [${X0}, ${Y0}] de ${S} px (${Math.round(S * M)} m)`);

const SIRVEN = /^(residential|tertiary|unclassified|living_street|pedestrian)$/;
const lineas = { g: [], f: [] }; let vias = 0;
for (const f of ['calles', 'avenidas']) for (const el of JSON.parse(readFileSync(R(`fuentes/osm/${f}.json`), 'utf8')).elements) {
  if (el.type !== 'way' || !el.geometry || !SIRVEN.test(el.tags?.highway ?? '') || el.tags.tunnel || el.tags.bridge) continue;
  const en = el.geometry.map((g) => metros(g.lat, g.lon));
  for (const [k, fn] of [['g', grueso], ['f', aPlanoM]]) {
    const P = en.map(([e, n]) => fn(e, n));
    if (!P.some(([x, y]) => x > X0 - 40 && y > Y0 - 40 && x < X0 + S + 40 && y < Y0 + S + 40)) continue;
    if (k === 'g') vias++;
    lineas[k].push(`<polyline points="${P.map(([x, y]) => `${((x - X0) * E).toFixed(1)},${((y - Y0) * E).toFixed(1)}`).join(' ')}"/>`);
  }
}
console.log(`calles angostas de hoy que pasan por el recorte: ${vias}`);
const pw = 1000, ph = 1000;
const base = await sharp(ESCANEO, { limitInputPixels: false }).extract({ left: X0, top: Y0, width: S, height: S }).resize(pw, ph).toBuffer();
const capa = `<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}"><g fill="none" stroke-linecap="round" stroke-linejoin="round">
<g stroke="#1667c9" stroke-width="3" stroke-opacity="0.9">${lineas.g.join('')}</g><g stroke="#d3261a" stroke-width="3" stroke-opacity="0.9">${lineas.f.join('')}</g></g>
<rect x="14" y="14" width="356" height="62" fill="#ffffff" fill-opacity="0.9"/><g font-family="Helvetica, Arial, sans-serif" font-size="17" fill="#222">
<line x1="26" y1="34" x2="66" y2="34" stroke="#1667c9" stroke-width="4"/><text x="76" y="40">afín con 14 edificios de referencia</text>
<line x1="26" y1="60" x2="66" y2="60" stroke="#d3261a" stroke-width="4"/><text x="76" y="66">ajuste fino (afín + campo local)</text></g>
<line x1="${pw - 30 - (100 / M) * E}" y1="${ph - 26}" x2="${pw - 30}" y2="${ph - 26}" stroke="#222" stroke-width="4"/><rect x="${pw - 100}" y="${ph - 60}" width="76" height="26" fill="#fff" fill-opacity="0.9"/><text x="${pw - 94}" y="${ph - 40}" font-family="Helvetica, Arial, sans-serif" font-size="17" fill="#222">100 m</text></svg>`;
const a = await sharp(base).composite([{ input: Buffer.from(capa) }]).png().toBuffer();

// (b) el pliego, con los corrimientos exagerados
const W2 = Math.round((ph * PLANO.ancho) / PLANO.alto), k = W2 / PLANO.ancho, EX = 40;
const flechas = pares.map((p) => { const x = p.a * k, y = p.b * k, u = (p.x - p.a) * k * EX, v = (p.y - p.b) * k * EX; return `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + u).toFixed(1)}" y2="${(y + v).toFixed(1)}"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="#d3261a" stroke="none"/>`; });
const l20 = (20 / M) * k * EX;
const capa2 = `<svg xmlns="http://www.w3.org/2000/svg" width="${W2}" height="${ph}"><rect width="${W2}" height="${ph}" fill="#ffffff" fill-opacity="0.45"/>
<rect x="${X0 * k}" y="${Y0 * k}" width="${S * k}" height="${S * k}" fill="none" stroke="#1667c9" stroke-width="2.5"/>
<g stroke="#d3261a" stroke-width="2" stroke-linecap="round">${flechas.join('')}</g>
<rect x="18" y="${ph - 78}" width="330" height="58" fill="#ffffff" fill-opacity="0.92"/><line x1="30" y1="${ph - 40}" x2="${30 + l20}" y2="${ph - 40}" stroke="#d3261a" stroke-width="3"/>
<text x="30" y="${ph - 54}" font-family="Helvetica, Arial, sans-serif" font-size="17" fill="#222">corrimiento de 20 m (exagerado ×${EX})</text></svg>`;
const b = await sharp(ESCANEO, { limitInputPixels: false }).resize(W2, ph).greyscale().toColourspace('srgb').composite([{ input: Buffer.from(capa2) }]).png().toBuffer();
const alto = ph + 50, lienzo = sharp({ create: { width: pw + W2 + 30, height: alto, channels: 3, background: '#ffffff' } });
const rot = `<svg xmlns="http://www.w3.org/2000/svg" width="${pw + W2 + 30}" height="${alto}"><g font-family="Helvetica, Arial, sans-serif" font-size="17" fill="#222"><text x="12" y="${ph + 34}">(a) calles angostas de hoy sobre el plano, antes y después del ajuste fino</text><text x="${pw + 22}" y="${ph + 34}">(b) las ${pares.length} ventanas que calzaron: corrimiento respecto del afín de referencias</text></g></svg>`;
await lienzo.composite([{ input: a, left: 10, top: 10 }, { input: b, left: pw + 20, top: 10 }, { input: Buffer.from(rot), left: 0, top: 0 }]).png({ compressionLevel: 9 }).toFile(FIG('fig04-calce.png'));
console.log(`fig04-calce.png · (b) ${pares.length} flechas, exageración ×${EX}`);
