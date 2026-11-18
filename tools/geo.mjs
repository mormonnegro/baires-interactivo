// La georreferencia: de la latitud y longitud de hoy a un punto del plano de 1867 (en píxeles del escaneo).
// Primero, un ajuste afín con edificios que siguen en el mismo lugar (las iglesias viejas, sobre todo; coordenadas de
// Wikipedia en español; la Pirámide no sirve: en 1912 la corrieron al centro de la plaza). Después, si tools/calce.mjs
// ya corrió, se usa su ajuste fino, hecho calzando las calles de hoy contra las del plano (tools/geo.json).
import { existsSync, readFileSync } from 'node:fs';
import { PLANO } from './plano.mjs';
// (la cuenta pura vive en src/geo.js, que también usa el navegador)
import { metros, grados, BASES, aplicar, conCampo, aMetros as aMetros0 } from '../src/geo.js';
export { metros, grados, BASES, aplicar, conCampo };

// [nombre, x, y en el plano, latitud, longitud]
export const REFERENCIAS = [
  ['San Ignacio', 10024, 9312, -34.6105, -58.3739], ['San Francisco', 9952, 9591, -34.61069, -58.371403],
  ['Santo Domingo', 9575, 9585, -34.61305556, -58.37166667], ['La Merced', 10840, 9659, -34.605388, -58.37206],
  ['Catedral', 10497, 9445, -34.60740833, -58.37327778], ['San Telmo', 8261, 9651, -34.62096111, -58.37057778],
  ['El Socorro', 12837, 8742, -34.59319543, -58.37990939], ['San Juan', 9986, 8777, -34.61080833, -58.37781389],
  ['El Pilar', 14034, 7200, -34.5868, -58.392], ['San Nicolás (hoy, el Obelisco)', 11216, 8411, -34.60376, -58.38162],
  ['Cabildo', 10294, 9378, -34.60885833, -58.37375556], ['Plaza del Parque (Lavalle)', 11590, 8003, -34.6021, -58.3846],
  ['Mercado Constitución', 7512, 8112, -34.62595833, -58.38133611], ['Mercado 11 de Septiembre (Miserere)', 10512, 4862, -34.60972222, -58.40744444],
  ['Cementerio de la Recoleta', 13929, 7047, -34.58805556, -58.39305556], ['Plaza de Marte (San Martín)', 12512, 9112, -34.59444444, -58.375],
];

// Mínimos cuadrados con pesos: cada coordenada del plano como combinación de las funciones `base(e, n)`.
export function ajustar(pares, base) { // pares: [e, n, x, y, peso]
  const k = base(0, 0).length, S = Array.from({ length: k }, () => new Float64Array(k + 2));
  for (const [e, n, x, y, w = 1] of pares) { const v = base(e, n); for (let i = 0; i < k; i++) { for (let j = 0; j < k; j++) S[i][j] += w * v[i] * v[j]; S[i][k] += w * v[i] * x; S[i][k + 1] += w * v[i] * y; } }
  for (let i = 0; i < k; i++) { // Gauss con pivote
    let p = i; for (let r = i + 1; r < k; r++) if (Math.abs(S[r][i]) > Math.abs(S[p][i])) p = r;
    [S[i], S[p]] = [S[p], S[i]];
    for (let r = 0; r < k; r++) if (r !== i) { const f = S[r][i] / S[i][i]; for (let c = i; c < k + 2; c++) S[r][c] -= f * S[i][c]; }
  }
  return { A: S.map((r, i) => r[k] / r[i]), B: S.map((r, i) => r[k + 1] / r[i]) };
}
// --- el ajuste afín de las referencias (se descartan las que no calzan) ---
const par = (r) => [...metros(r[3], r[4]), r[1], r[2]];
let refs = REFERENCIAS, f0 = aplicar(ajustar(refs.map(par), BASES[1]), BASES[1]);
export const errorRef = (r, f = f0) => { const [x, y] = f(...metros(r[3], r[4])); return Math.hypot(x - r[1], y - r[2]) * PLANO.metro; };
for (let vuelta = 0; vuelta < 3; vuelta++) { const buenas = refs.filter((r) => errorRef(r) < 60); if (buenas.length === refs.length || buenas.length < 8) break; refs = buenas; f0 = aplicar(ajustar(refs.map(par), BASES[1]), BASES[1]); }
export const USADAS = refs;
export const grueso = f0; // (este, norte en metros) → [x, y] del plano

// --- el ajuste fino, si está: un afín nuevo y, encima, una corrección local suave que se apaga lejos de donde hay datos ---
const FINO = new URL('./geo.json', import.meta.url);
export function fino() { return existsSync(FINO) ? conCampo(JSON.parse(readFileSync(FINO, 'utf8'))) : null; }
const f1 = fino();
export const esFino = !!f1;
export const aPlanoM = f1 ?? f0;
export const aPlano = (lat, lon) => aPlanoM(...metros(lat, lon));
// (y la vuelta: del plano a metros)
export const aMetros = (x, y, f = aPlanoM) => aMetros0(x, y, f);
