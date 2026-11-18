// Las imágenes del video que salen del plano y de los datos del visor. Solo lee del repo; escribe en paper/video/assets.
//   node --max-old-space-size=8000 paper/video/tools/capas.mjs
import sharp from 'sharp';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { PLANO } from '../../../tools/plano.mjs';
import { grueso, aPlanoM } from '../../../tools/geo.mjs';
import { metros } from '../../../src/geo.js';
import { R, ESCANEO, gris, clasificar, clasesGuardadas, ciudad67, enPlano } from '../../medidas/comun.mjs';

const AQUI = fileURLToPath(new URL('../assets/', import.meta.url)), A = (f) => join(AQUI, f);
for (const d of ['plano', 'muestra', 'planos', 'visor']) mkdirSync(A(d), { recursive: true });
const M = PLANO.metro, B = [9966, 9474], F = [9904, 9420]; // la manzana que se sigue, y el borde entre su frente y su fondo
const rect = (c, w, h = Math.round((w * 9) / 16)) => ({ x: Math.round(c[0] - w / 2), y: Math.round(c[1] - h / 2), w, h });
const C = [12170, 7191]; // el centro de la ventana del calce de calles de la figura 4 (la de corrimiento más cercano a la media)
const NIVELES = [{ x: 0, y: 2630, w: 18919, h: 10642 }, rect(B, 6400), rect(B, 2134, 1200), rect(B, 712, 400), rect(F, 256, 144), rect(C, 4000), rect(C, 1312, 738)];
const CALLES = NIVELES[6], datos = { metro: M, B, F, C, niveles: NIVELES, calles: CALLES };
const escaneo = () => sharp(ESCANEO, { limitInputPixels: false });
const hacer = process.argv[2] ?? 'todo';

// --- 1. los niveles del zoom: el mismo escaneo, recortado cada vez más cerca (el último, con cada píxel a la vista) ---
if (hacer === 'todo' || hacer === 'niveles') for (const [i, n] of NIVELES.entries()) {
  const r = escaneo().extract({ left: n.x, top: n.y, width: n.w, height: n.h });
  if (i === 4) await r.resize(3840, 2160, { kernel: 'nearest' }).png({ compressionLevel: 9 }).toFile(A('plano/n4.png'));
  else await r.resize(3840, 2160, { kernel: 'lanczos3' }).jpeg({ quality: 88, mozjpeg: true }).toFile(A(`plano/n${i}.jpg`));
  console.log(`nivel ${i}: [${n.x}, ${n.y}] ${n.w} × ${n.h} px (${Math.round(n.w * M)} m de ancho)`);
}

// --- 2. las clases del paso 1 sobre el nivel 3 (lo que dejó tools/1-clases.mjs), y las respuestas en dos puntos ---
{
  const n = NIVELES[3], cls = await clasesGuardadas(n.x, n.y, n.w, n.h), w = n.w >> 1, h = n.h >> 1, rgba = Buffer.alloc(w * h * 4);
  const COL = { 1: [194, 50, 28, 205], 2: [111, 143, 78, 175], 3: [31, 27, 23, 235] };
  for (let k = 0; k < w * h; k++) if (COL[cls[k]]) rgba.set(COL[cls[k]], k * 4);
  await sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).resize(w * 6, h * 6, { kernel: 'nearest' }).png({ compressionLevel: 9 }).toFile(A('plano/clases.png'));
  // dos ventanas dentro del nivel 4: una bien adentro del rayado cruzado y otra del simple (la más cercana a un punto dado)
  const m = NIVELES[4], X0 = (m.x - 40) & ~1, Y0 = (m.y - 40) & ~1, W = m.w + 80, H = m.h + 80, c = clasificar(await gris(X0, Y0, W, H));
  const pura = (X, Y, cl) => { for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) if (c.cls[(Y + j) * c.w + X + i] !== cl) return false; return true; };
  const busca = (cl, [px, py]) => { let mejor = null; for (let Y = 8; Y < c.h - 8; Y++) for (let X = 8; X < c.w - 8; X++) { if (!pura(X, Y, cl)) continue; const x = X0 + X * 2 + 1, y = Y0 + Y * 2 + 1, d = Math.hypot(x - px, y - py); if (!mejor || d < mejor.d) mejor = { x, y, d, a: +c.A[Y * c.w + X].toFixed(1), b: +c.B[Y * c.w + X].toFixed(1), tono: Math.round(c.M[Y * c.w + X]) }; } return mejor; };
  datos.cruzado = busca(1, [F[0] - 55, F[1] + 20]); datos.simple = busca(2, [F[0] + 55, F[1] + 25]);
  console.log('ventana en rayado cruzado:', JSON.stringify(datos.cruzado), '· en rayado simple:', JSON.stringify(datos.simple));
}

// --- 3. los techos del visor sobre el nivel 3 (un rectángulo por techo, como los baja el visor) ---
{
  const n = NIVELES[3], { mz, te } = ciudad67(), E = 1920 / n.w, P = []; let cuenta = 0;
  for (let i = 0; i < te.length / 8; i++) {
    const k = i * 8, b = te[k], Q = [[te[k + 1], te[k + 2]], [te[k + 3], te[k + 2]], [te[k + 3], te[k + 4]], [te[k + 1], te[k + 4]]].map(([u, v]) => enPlano(mz, b, u, v));
    if (!Q.some(([x, y]) => x > n.x && y > n.y && x < n.x + n.w && y < n.y + n.h)) continue; cuenta++;
    P.push('M' + Q.map(([x, y]) => `${((x - n.x) * E).toFixed(1)} ${((y - n.y) * E).toFixed(1)}`).join('L') + 'Z');
  }
  datos.techos = { cuenta, d: P.join('') }; console.log(`techos del visor en el nivel 3: ${cuenta}`);
}

// --- 4. las calles angostas de hoy (OpenStreetMap) llevadas al plano: con el afín de referencias y con el ajuste fino ---
{
  const n = CALLES, E = 1920 / n.w, SIRVEN = /^(residential|tertiary|unclassified|living_street|pedestrian)$/, g = [], f = []; let dx = 0, dy = 0, k = 0;
  for (const arch of ['calles', 'avenidas']) for (const el of JSON.parse(readFileSync(R(`fuentes/osm/${arch}.json`), 'utf8')).elements) {
    if (el.type !== 'way' || !el.geometry || !SIRVEN.test(el.tags?.highway ?? '') || el.tags.tunnel || el.tags.bridge) continue;
    const en = el.geometry.map((p) => metros(p.lat, p.lon)), G = en.map(([e, nn]) => grueso(e, nn)), Fi = en.map(([e, nn]) => aPlanoM(e, nn));
    if (!G.some(([x, y]) => x > n.x - 60 && y > n.y - 60 && x < n.x + n.w + 60 && y < n.y + n.h + 60)) continue;
    const d = (P) => 'M' + P.map(([x, y]) => `${((x - n.x) * E).toFixed(1)} ${((y - n.y) * E).toFixed(1)}`).join('L');
    g.push(d(G)); f.push(d(Fi));
    G.forEach(([x, y], i) => { if (x > n.x && y > n.y && x < n.x + n.w && y < n.y + n.h) { dx += Fi[i][0] - x; dy += Fi[i][1] - y; k++; } });
  }
  datos.osm = { vias: g.length, afin: g.join(''), fino: f.join(''), corrimientoPx: [+(dx / k).toFixed(2), +(dy / k).toFixed(2)], corrimientoM: +(Math.hypot(dx / k, dy / k) * M).toFixed(1) };
  console.log(`calles de hoy en el recorte: ${g.length}; corrimiento medio local entre el afín y el fino: ${datos.osm.corrimientoM} m (${datos.osm.corrimientoPx} px)`);
}

// --- 5. dos recortes de la muestra de evaluación (los mismos de paper/medidas/muestra.mjs), sin la grilla de conteo ---
if (hacer === 'todo' || hacer === 'muestra') {
  const S = 444, P = 1080, E = P / S, { mz, te, ar } = ciudad67();
  for (const km of [0.5, 3.5]) {
    const X0 = (PLANO.plaza[0] - S / 2) & ~1, Y0 = (Math.round(PLANO.plaza[1] - (km * 1000) / M) - S / 2) & ~1, dentro = ([x, y]) => x > X0 && y > Y0 && x < X0 + S && y < Y0 + S, tech = [], arb = [];
    await escaneo().extract({ left: X0, top: Y0, width: S, height: S }).resize(P, P, { kernel: 'lanczos3' }).jpeg({ quality: 90, mozjpeg: true }).toFile(A(`muestra/${km}-escaneo.jpg`));
    for (let i = 0; i < te.length / 8; i++) { const k = i * 8, b = te[k], Q = [[te[k + 1], te[k + 2]], [te[k + 3], te[k + 2]], [te[k + 3], te[k + 4]], [te[k + 1], te[k + 4]]].map(([u, v]) => enPlano(mz, b, u, v)); if (Q.some(dentro)) tech.push(`<polygon points="${Q.map(([x, y]) => `${((x - X0) * E).toFixed(1)},${((y - Y0) * E).toFixed(1)}`).join(' ')}"/>`); }
    for (let i = 0; i < ar.length / 3; i++) { const x = ar[i * 3], y = ar[i * 3 + 1]; if (dentro([x, y])) arb.push(`<circle cx="${((x - X0) * E).toFixed(1)}" cy="${((y - Y0) * E).toFixed(1)}" r="${(Math.max(3.2, ar[i * 3 + 2]) * E).toFixed(1)}"/>`); }
    writeFileSync(A(`muestra/${km}-visor.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${P} ${P}" width="${P}" height="${P}"><g fill="#c2321c" fill-opacity="0.5" stroke="#c2321c" stroke-width="2.2">${tech.join('')}</g><g fill="none" stroke="#1f7a2e" stroke-width="6">${arb.join('')}</g></svg>`);
    console.log(`muestra ${km} km: píxeles [${X0}, ${Y0}] · techos ${tech.length} · árboles ${arb.length}`);
  }
}

// --- 6. los seis planos posteriores, en chico ---
if (hacer === 'todo' || hacer === 'planos') for (const a of [1888, 1895, 1905, 1910, 1921, 1940]) {
  const m = await sharp(R(`fuentes/planos/${a}.jpg`), { limitInputPixels: false, failOn: 'none' }).metadata();
  await sharp(R(`fuentes/planos/${a}.jpg`), { limitInputPixels: false, failOn: 'none' }).resize({ height: 900, withoutEnlargement: true }).jpeg({ quality: 86, mozjpeg: true }).toFile(A(`planos/${a}.jpg`));
  console.log(`plano ${a}: ${m.width} × ${m.height}`);
}

// --- 7. las tomas fijas del visor (shots/paper-v-*.png), sin la franja de la interfaz ---
if (hacer === 'todo' || hacer === 'visor') for (const nombre of ['etapa-1867', 'etapa-1888', 'etapa-1895', 'etapa-1905', 'etapa-1910', 'etapa-1921', 'etapa-1940', 'fin-1940'])
  await sharp(R(`shots/paper-v-${nombre}.png`)).extract({ left: 0, top: 130, width: 1920, height: 1080 }).jpeg({ quality: 90, mozjpeg: true }).toFile(A(`visor/${nombre}.jpg`));

writeFileSync(A('capas.json'), JSON.stringify(datos));
console.log('capas.json');
