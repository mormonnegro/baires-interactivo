// Figuras 4 y 6: arma las láminas con las capturas del visor que dejó tools/shot.mjs en shots/paper-*.png
// (se les recorta la franja de arriba y la de abajo, donde está la interfaz).
//   node paper/medidas/fig-etapas.mjs
import sharp from 'sharp';
import { R, FIG, hoja } from './comun.mjs';

const recorte = (f, pw) => sharp(R(`shots/${f}.png`)).extract({ left: 0, top: 130, width: 1600, height: 780 }).resize(pw).png().toBuffer();
const pw = 800, ph = 390;
const ETAPAS = [1867, 1888, 1895, 1905, 1910, 1921, 1940];
const paneles = [];
for (const a of ETAPAS) paneles.push({ img: await recorte(`paper-etapa-${a}`, pw), texto: `${a}` });
paneles.push({ img: await recorte('paper-tinta-1867', pw), texto: '1867, en tinta (el botón «Color» apagado, o ?tinta)' });
await (await hoja(paneles, 2, { pw, ph })).toFile(FIG('fig05-etapas.png'));
console.log('fig05-etapas.png');
// el sombreado de tinta, de cerca
await sharp(R('shots/paper-tinta-cerca.png')).extract({ left: 0, top: 130, width: 1600, height: 780 }).jpeg({ quality: 88 }).toFile(FIG('fig07-tinta.jpg'));
console.log('fig07-tinta.jpg');
