// Pisos del visor por zona y etapa, para comparar con los censos (ver LEEME.md). SOLO LEE: public/datos/ciudad.pak,
// crece.pak y crece.json, tal como los baja el navegador; no escribe nada salvo que se le pase un archivo de salida.
//   node fuentes/censos/medir-visor.mjs [raíz del proyecto] [json de salida]
// Cada «casa» es un cuerpo (manzana, semilla) con el mayor número de pisos de sus techos. La tabla principal cuenta
// los cuerpos a la calle y las construcciones sueltas (los cuerpos interiores de 1867 quedan aparte, en la última columna).
// Coordenadas: x = (px − 10335) · 0,675 hacia el norte, z = (py − 9485) · 0,675 hacia el río; Plaza de Mayo = (0, 0).
import { readFileSync, writeFileSync } from 'node:fs'; import { gunzipSync } from 'node:zlib'; import { fileURLToPath } from 'node:url';
const RAIZ = process.argv[2] ?? fileURLToPath(new URL('../../', import.meta.url));
function pak(f) { const buf = gunzipSync(readFileSync(RAIZ + '/' + f)), n = buf.readUInt32LE(0), cab = JSON.parse(buf.subarray(4, 4 + n).toString('utf8')), o = {}; let p = 4 + n; for (const { nombre, bytes, registro } of cab.partes) { const src = buf.subarray(p, p + bytes), dst = Buffer.alloc(bytes), m = bytes / registro; for (let k = 0; k < registro; k++) for (let i = 0; i < m; i++) dst[i * registro + k] = src[k * m + i]; o[nombre] = dst; p += bytes; } return o; }
const f32 = (b) => new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)), u16 = (b) => new Uint16Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)), u32 = (b) => new Uint32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
const crece = JSON.parse(readFileSync(RAIZ + '/public/datos/crece.json', 'utf8')), AÑOS = [1867, ...crece.epocas.map((e) => e.año)], N = crece.epocas.length;
const c67 = pak('public/datos/ciudad.pak'), cr = pak('public/datos/crece.pak');
const mz = f32(c67.manzanas), te = u16(c67.techos), mz2 = f32(cr.manzanas), te2 = u16(cr.techos), mueT = u32(cr.mueT);
const enPlano = (m, b, u, v) => { const k = b * 10, s = u / m[k + 8], t = v / m[k + 9], a = (1 - s) * (1 - t), c = s * (1 - t), d = s * t, e = (1 - s) * t; return [a * m[k] + c * m[k + 2] + d * m[k + 4] + e * m[k + 6], a * m[k + 1] + c * m[k + 3] + d * m[k + 5] + e * m[k + 7]]; };
const celda = (m, b) => { const k = b * 10; let a = 0; for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; a += m[k + i * 2] * m[k + j * 2 + 1] - m[k + j * 2] * m[k + i * 2 + 1]; } return (Math.abs(a) / 2) * 0.675 * 0.675 / (m[k + 8] * m[k + 9]); };
const muere67 = new Map(); for (let i = 0; i < mueT.length; i += 2) muere67.set(mueT[i], mueT[i + 1]);
// cuerpos: clave (origen, manzana, semilla, nace, muere) → { x, z, pisos, alto, area, nace, muere, clase }
const cuerpos = new Map();
function suma(clave, m, t, k, pisos, nace, muere, clase) {
  const b = t[k], [px, py] = enPlano(m, b, (t[k + 1] + t[k + 3]) / 2, (t[k + 2] + t[k + 4]) / 2), s = (t[k + 3] - t[k + 1]) * (t[k + 4] - t[k + 2]) * celda(m, b);
  let c = cuerpos.get(clave); if (!c) cuerpos.set(clave, c = { x: 0, z: 0, pisos: 0, alto: 0, area: 0, nace, muere, clase });
  c.x += (px - 10335) * 0.675 * s; c.z += (py - 9485) * 0.675 * s; c.area += s; c.pisos = Math.max(c.pisos, pisos); c.alto = Math.max(c.alto, t[k + 5] / 10);
}
for (let i = 0; i < te.length / 8; i++) { const k = i * 8, d = muere67.get(i) || 0; suma(`a${te[k]}_${te[k + 6]}_${d}`, mz, te, k, te[k + 7] & 15, 0, d, (te[k + 7] >> 4) & 15); }
for (let i = 0; i < te2.length / 8; i++) { const k = i * 8, f = te2[k + 7]; suma(`b${te2[k]}_${te2[k + 6]}_${(f >> 8) & 15}_${f >> 12}`, mz2, te2, k, f & 15, (f >> 8) & 15, f >> 12, 9); }
const L = [...cuerpos.values()]; for (const c of L) { c.x /= c.area; c.z /= c.area; c.d = Math.hypot(c.x, c.z); }
// calles (en metros del visor; x al norte, z al río), leídas de los bordes de manzana de 1867
const RIV = 61, COR = 1069, IND = -969, GAR = -1760, CAL = -1730, PUE = -2990, BOE = -4130, MAI = -321, LIB = -955, CEN = -385, BOC = -350;
const zona = (c) => c.x >= IND && c.x < COR && c.z >= CEN ? 0 : c.x >= IND && c.x < COR && c.z >= CAL ? 1 : c.x >= COR && c.z >= CAL ? 2 : c.x >= COR && c.z >= BOE ? 3 : c.x >= GAR && c.x < IND && c.z >= CAL ? 4 : c.x < GAR && c.z >= BOC ? 5 : c.x >= IND && c.x < COR && c.z >= PUE ? 6 : (c.x < GAR && c.z >= CAL) || (c.x >= GAR && c.x < COR && c.z >= BOE) ? 7 : 8;
const ZONAS = [
  ['ZONA centro (Independencia-Córdoba, del río a Maipú/Chacabuco)', (c) => zona(c) === 0], ['ZONA anillo (Independencia-Córdoba, de Maipú/Chacabuco a Callao/Entre Ríos)', (c) => zona(c) === 1],
  ['ZONA norte cercano (Retiro y Socorro: norte de Córdoba, del río a Callao)', (c) => zona(c) === 2], ['ZONA norte lejano (Pilar y Recoleta: norte de Córdoba, de Callao a Bulnes)', (c) => zona(c) === 3],
  ['ZONA sur cercano (San Telmo y Concepción: Garay-Independencia, del río a Entre Ríos)', (c) => zona(c) === 4], ['ZONA La Boca (sur de Garay, del lado del río)', (c) => zona(c) === 5],
  ['ZONA oeste (Balvanera y Once: Independencia-Córdoba, de Callao/Entre Ríos a Pueyrredón/Jujuy)', (c) => zona(c) === 6], ['ZONA arrabal (Barracas, San Cristóbal, Balvanera Oeste)', (c) => zona(c) === 7], ['ZONA orillas (todo lo demás)', (c) => zona(c) === 8],
  ['franja 0-400 m', (c) => c.d < 400], ['franja 400-800 m', (c) => c.d >= 400 && c.d < 800], ['franja 800-1200 m', (c) => c.d >= 800 && c.d < 1200], ['franja 1200-1800 m', (c) => c.d >= 1200 && c.d < 1800],
  ['franja 1800-2500 m', (c) => c.d >= 1800 && c.d < 2500], ['franja 2500-3500 m', (c) => c.d >= 2500 && c.d < 3500], ['franja 3500-5000 m', (c) => c.d >= 3500 && c.d < 5000], ['franja 5000+ m', (c) => c.d >= 5000],
  ['c14 San Nicolás (Rivadavia-Córdoba, río-Callao)', (c) => c.x >= RIV && c.x < COR && c.z >= CAL],
  ['c13 Monserrat (Independencia-Rivadavia, río-Entre Ríos)', (c) => c.x >= IND && c.x < RIV && c.z >= CAL],
  ['c13+c14 (secciones 1 a 6 de 1887)', (c) => c.x >= IND && c.x < COR && c.z >= CAL],
  ['sección 1 de 1887 (Rivadavia-Córdoba, río-Maipú)', (c) => c.x >= RIV && c.x < COR && c.z >= MAI],
  ['sección 3 de 1887 (Maipú-Libertad)', (c) => c.x >= RIV && c.x < COR && c.z >= LIB && c.z < MAI],
  ['sección 5 de 1887 (Libertad-Callao)', (c) => c.x >= RIV && c.x < COR && c.z >= CAL && c.z < LIB],
  ['c20 Socorro (norte de Córdoba, río-Callao)', (c) => c.x >= COR && c.z >= CAL],
  ['c19 Pilar y más (norte de Córdoba, oeste de Callao)', (c) => c.x >= COR && c.z < CAL],
  ['c12 Concepción (Garay-Independencia, río-Entre Ríos)', (c) => c.x >= GAR && c.x < IND && c.z >= CAL],
  ['c3+c4 Barracas y La Boca (sur de Garay, este de Entre Ríos)', (c) => c.x < GAR && c.z >= CAL],
  ['c11 Balvanera Norte (Rivadavia-Córdoba, Callao-Pueyrredón)', (c) => c.x >= RIV && c.x < COR && c.z < CAL && c.z >= PUE],
  ['c10 Balvanera Sud (Independencia-Rivadavia, Entre Ríos-Jujuy)', (c) => c.x >= IND && c.x < RIV && c.z < CAL && c.z >= PUE],
  ['c9 Balvanera Oeste (Independencia-Córdoba, Jujuy-Boedo)', (c) => c.x >= IND && c.x < COR && c.z < PUE && c.z >= BOE],
  ['c8 San Cristóbal (Garay-Independencia, Entre Ríos-Boedo)', (c) => c.x >= GAR && c.x < IND && c.z < CAL && c.z >= BOE],
  ['c2 San Cristóbal Sud y más (sur de Garay, oeste de Entre Ríos)', (c) => c.x < GAR && c.z < CAL],
  ['oeste lejano (más allá de Boedo, entre Garay y Córdoba)', (c) => c.x >= GAR && c.x < COR && c.z < BOE],
  ['toda la lámina', () => true],
];
const out = { años: AÑOS, zonas: [] };
const fila = (cs) => { const h = [0, 0, 0, 0, 0, 0]; let s = 0, a = 0, ap = 0, mx = 0, ha = 0, n6 = 0, n8 = 0; for (const c of cs) { h[Math.min(5, c.pisos)]++; s += c.pisos; a += c.area; ap += c.area * c.pisos; mx = Math.max(mx, c.pisos); ha = Math.max(ha, c.alto); if (c.pisos >= 6) n6++; if (c.pisos >= 8) n8++; } const n = cs.length || 1; return { n: cs.length, p1: h[1] / n, p2: h[2] / n, p3: h[3] / n, p4: h[4] / n, p5: h[5] / n, medio: s / n, medioSup: a ? ap / a : 0, max: mx, altoMax: ha, de6: n6, de8: n8, ha: a / 1e4 }; };
for (const [nombre, dentro] of ZONAS) {
  const zs = L.filter(dentro), o = { zona: nombre, etapas: [] };
  console.log(`\n== ${nombre}`); console.log('año    casas   %1    %2    %3    %4   %5+   medio  (sup.)  máx  alto máx   6+   8+   | todos los cuerpos: n, medio');
  for (let e = 0; e <= N; e++) {
    const vivos = zs.filter((c) => c.nace <= e && !(c.muere && c.muere <= e)), frente = vivos.filter((c) => c.clase !== 1), f = fila(frente), t = fila(vivos);
    o.etapas.push({ año: AÑOS[e], frente: f, todos: t });
    const P = (v) => (v * 100).toFixed(1).padStart(5);
    console.log(`${AÑOS[e]} ${String(f.n).padStart(7)} ${P(f.p1)} ${P(f.p2)} ${P(f.p3)} ${P(f.p4)} ${P(f.p5)}   ${f.medio.toFixed(2)}   ${f.medioSup.toFixed(2)}   ${String(f.max).padStart(2)}   ${f.altoMax.toFixed(0).padStart(4)}  ${String(f.de6).padStart(5)} ${String(f.de8).padStart(4)}   | ${t.n}, ${t.medio.toFixed(2)}`);
  }
  out.zonas.push(o);
}
if (process.argv[3]) writeFileSync(process.argv[3], JSON.stringify(out));
