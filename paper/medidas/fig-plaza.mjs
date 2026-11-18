// Figura 5: una plaza hecha a mano y la evidencia que la respalda. Plaza Constitución (src/lugares/plaza-constitucion.js):
// la foto de Gonnet de 1864 junto a la toma de 1867, y el Plano Topográfico de 1895 junto a la toma de 1895.
//   node paper/medidas/fig-plaza.mjs
import sharp from 'sharp';
import { R, FIG, hoja } from './comun.mjs';
const pw = 800, ph = 520;
const toma = (f) => sharp(R(`shots/${f}.png`)).extract({ left: 300, top: 130, width: 1100, height: 715 }).resize(pw, ph).png().toBuffer();
// el plano de 1895, crudo (fuentes/planos/1895.jpg): la plaza está en [5358, 8565]; se gira para que el norte quede arriba, como en la toma
const crudo = await sharp(R('fuentes/planos/1895.jpg'), { limitInputPixels: false, failOn: 'none' }).extract({ left: 5242, top: 8397, width: 240, height: 370 }).png().toBuffer();
const plano = await sharp(await sharp(crudo).rotate(-90).png().toBuffer()).resize(pw, ph, { kernel: 'lanczos3', fit: 'cover' }).png().toBuffer();
const foto = await sharp(R('fuentes/fotos/constitucion-gonnet.jpg')).resize(pw, ph, { fit: 'cover' }).png().toBuffer();
const paneles = [
  { img: foto, texto: '(a) Esteban Gonnet, «Mercado de Constitución», 1864 (dominio público, Wikimedia Commons)' },
  { img: await toma('paper-constitucion-1867'), texto: '(b) el visor, 1867: las carretas en el hueco que el plano deja libre' },
  { img: plano, texto: '(c) Plano Topográfico de 1895, Oficina de Obras Públicas (dominio público), girado' },
  { img: await toma('paper-constitucion-1895'), texto: '(d) el visor, 1895: canteros de bordes curvos, avenida, gruta y lago' },
];
await (await hoja(paneles, 2, { pw, ph })).toFile(FIG('fig06-plaza.png'));
console.log('fig06-plaza.png');
