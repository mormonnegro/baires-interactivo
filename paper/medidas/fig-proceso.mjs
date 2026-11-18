// Figura 8: el diagrama del proceso (SVG propio) y su versión PNG.   node paper/medidas/fig-proceso.mjs
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { FIG } from './comun.mjs';

const W = 1560, H = 800, BW = 330;
const X = [20, 420, 820, 1210];
const C = { fuente: ['#f4ead3', '#8a7350'], paso: ['#e3ecf5', '#4a6a8f'], mano: ['#f6e1dc', '#a5493a'], visor: ['#e6efe0', '#4f7a43'] };
const cajas = {
  s1: [0, 30, 70, 'fuente', ['Plano topográfico de 1867 (Glade)', 'escaneo de 18 919 × 13 272 px, 0,675 m/px']],
  s2: [0, 200, 56, 'fuente', ['16 edificios de referencia', '(posición en el plano y coordenadas de hoy)']],
  s3: [0, 310, 56, 'fuente', ['OpenStreetMap', 'calles, agua, vías, edificios (ODbL)']],
  s4: [0, 440, 56, 'fuente', ['Seis planos posteriores', '1888, 1895, 1905, 1909, 1921, 1936']],
  s5: [0, 560, 56, 'fuente', ['Curvas de nivel de 1 m', '(Ciudad de Buenos Aires)']],
  s6: [0, 670, 70, 'fuente', ['Fotos de época (Wikimedia Commons),', 'aérea de 1940, planos de detalle,', 'textos']],
  p1: [1, 20, 70, 'paso', ['tools/1-clases.mjs', 'respuesta al rayado en dos diagonales', '+ tono medio → 5 clases (1,35 m/px)']],
  p1b: [1, 108, 56, 'paso', ['tools/chicas.mjs', 'casillas y árboles a resolución plena']],
  p2: [1, 200, 56, 'paso', ['tools/geo.mjs', 'afín por mínimos cuadrados, con descarte']],
  p3: [1, 300, 76, 'paso', ['tools/calce.mjs', 'calles de hoy contra las clases del paso 1,', 'por ventanas de 420 m → afín + campo local']],
  p4: [1, 430, 76, 'paso', ['tools/epocas.mjs', 'ajuste por plazas + refinamiento contra', 'las calles de hoy (polinomio de grado 2)']],
  p5: [1, 560, 56, 'paso', ['tools/relieve.mjs', 'rasterizado + relajación (3000 pasadas)']],
  p6: [1, 670, 70, 'mano', ['Modelado a mano, con fuente citada', 'src/lugares/*.js, src/hitos.js,', 'src/marcas.js, src/fichas.js']],
  c1: [2, 30, 76, 'paso', ['tools/2-ciudad.mjs', 'manzanas, lotes, pisos, techos, muros,', 'iglesias (semilla fija)']],
  c4: [2, 150, 56, 'paso', ['tools/3-laminas.mjs · tools/empacar.mjs', 'láminas webp por niveles · ciudad.pak']],
  c2: [2, 300, 76, 'paso', ['tools/hoy.mjs', 'río de 1867, suelo en color, capas de hoy,', 'tierra ganada']],
  c3: [2, 430, 76, 'paso', ['tools/crece.mjs', 'manzanas de las calles de hoy, señas de color', 'por plano, reglas, obras fechadas a mano']],
  v: [3, 30, 710, 'visor', ['Visor (three.js, vite)', '', 'src/ciudad.js — geometría', 'por lotes, instanciada', '', 'src/epocas.js — línea de', 'tiempo de siete etapas', '', 'src/tinta.js — sombreado', 'de tinta sobre el plano', '', 'src/pagina.js — contornos', 'por profundidad y grano', '', 'src/relieve.js — barranca', '', 'src/marcas.js, fichas.js,', 'buscar.js, autos.js, modos.js', '', 'pruebas con Chromium', 'sin ventana (tools/*.mjs)']],
};
const flechas = [['s1', 'p1'], ['s1', 'p1b'], ['p1', 'c1'], ['p1b', 'c1'], ['s2', 'p2'], ['p2', 'p3'], ['s3', 'p3'], ['p3', 'c2'], ['s3', 'c2'], ['s4', 'p4'], ['c2', 'p4'], ['p4', 'c3'], ['c1', 'c4'], ['c4', 'v'], ['c1', 'v'], ['c2', 'v'], ['c3', 'v'], ['s5', 'p5'], ['p5', 'v'], ['s6', 'p6'], ['p6', 'v']];
const caja = (k) => { const [c, y, h] = cajas[k]; return { x: X[c], y, w: c === 3 ? 330 : BW, h, c }; };
let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Helvetica, Arial, sans-serif">
<defs><marker id="p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#555"/></marker></defs>
<rect width="${W}" height="${H}" fill="#ffffff"/>`;
for (const [a, b] of flechas) {
  const A = caja(a), B = caja(b);
  let x1, y1, x2, y2;
  if (A.c === B.c) { x1 = x2 = A.x + A.w / 2 + (a === 'p6' ? 0 : 0); y1 = A.y < B.y ? A.y + A.h : A.y; y2 = A.y < B.y ? B.y : B.y + B.h; }
  else if (A.c < B.c) { x1 = A.x + A.w; x2 = B.x; y1 = A.y + A.h / 2; y2 = b === 'v' ? y1 : B.y + B.h / 2; }
  else { x1 = A.x; x2 = B.x + B.w; y1 = A.y + A.h / 2; y2 = B.y + B.h / 2; }
  s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#555" stroke-width="1.6" marker-end="url(#p)"/>`;
}
for (const k in cajas) {
  const { x, y, w, h } = caja(k), [, , , tipo, lineas] = cajas[k], [f, b] = C[tipo];
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${f}" stroke="${b}" stroke-width="1.6"/>`;
  const alto = 19, y0 = k === 'v' ? y + 34 : y + h / 2 - ((lineas.length - 1) * alto) / 2 + 5;
  lineas.forEach((t, i) => { s += `<text x="${x + w / 2}" y="${y0 + i * alto}" text-anchor="middle" font-size="${i === 0 ? 15 : 14}" font-weight="${i === 0 ? 700 : 400}" fill="#222">${t.replace(/&/g, '&amp;')}</text>`; });
}
const ley = [['fuente', 'fuente'], ['paso', 'paso automático (script)'], ['mano', 'trabajo a mano, con fuente'], ['visor', 'programa del visor']];
ley.forEach(([t, n], i) => { s += `<rect x="${20 + i * 260}" y="${H - 30}" width="18" height="14" fill="${C[t][0]}" stroke="${C[t][1]}"/><text x="${44 + i * 260}" y="${H - 18}" font-size="13" fill="#333">${n}</text>`; });
s += '</svg>';
writeFileSync(FIG('fig02-proceso.svg'), s);
await sharp(Buffer.from(s), { density: 144 }).png().toFile(FIG('fig02-proceso.png'));
console.log('fig02-proceso.svg, fig02-proceso.png');
