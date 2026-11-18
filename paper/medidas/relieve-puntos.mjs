// Las alturas que el LEEME da como ejemplo, leídas de public/datos/relieve.bin en los mismos lugares (las coordenadas
// de hoy de cada punto son aproximadas, puestas a mano acá; se pasan al plano con el ajuste fino). Solo lectura.
//   node paper/medidas/relieve-puntos.mjs > paper/medidas/relieve-puntos.txt
import { readFileSync } from 'node:fs';
import { aPlano } from '../../tools/geo.mjs';
import { PLANO } from '../../tools/plano.mjs';
import { R } from './comun.mjs';
const b = readFileSync(R('public/datos/relieve.bin')), u = new Uint16Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)), W = u[0], H = u[1];
const en = (x, y) => { const fx = (x / PLANO.ancho) * W - 0.5, fy = (y / PLANO.alto) * H - 0.5, i = Math.max(0, Math.min(W - 2, Math.floor(fx))), j = Math.max(0, Math.min(H - 2, Math.floor(fy))), s = fx - i, t = fy - j, v = (a, c) => u[2 + c * W + a] / 10; return v(i, j) * (1 - s) * (1 - t) + v(i + 1, j) * s * (1 - t) + v(i, j + 1) * (1 - s) * t + v(i + 1, j + 1) * s * t; };
const PUNTOS = [['Plaza de Mayo (Pirámide)', -34.60837, -58.37223, 17.6], ['Plaza del Congreso (frente al Palacio)', -34.60975, -58.39155, 21], ['Corrientes y 9 de Julio (Obelisco)', -34.60374, -58.38157, 16.6], ['Corrientes y Leandro N. Alem', -34.60318, -58.37032, 3.6]];
console.log(`relieve.bin: ${W} × ${H}; alturas en metros (interpolación bilineal)`);
for (const [n, lat, lon, leeme] of PUNTOS) { const [x, y] = aPlano(lat, lon); console.log(`${n.padEnd(42)} lat ${lat}, lon ${lon} → plano [${x.toFixed(0)}, ${y.toFixed(0)}] → ${en(x, y).toFixed(1)} m   (el LEEME dice ${leeme} m)`); }
