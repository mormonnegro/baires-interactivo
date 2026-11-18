// Un recorte de las fotos aéreas históricas del mapa interactivo de la Ciudad de Buenos Aires (1940, 1965, 1978).
// Son teselas TMS en Web Mercator (256 px; la fila se cuenta desde el sur):
//   https://servicios.usig.buenosaires.gob.ar/mapcache/tms/1.0.0/fotografias_aereas_<año>_caba_3857@GoogleMapsCompatible/{z}/{x}/{y}.png
// La lista de capas sale de https://epok.buenosaires.gob.ar/mapainteractivoba/layers/ (zoom 9 a 18).
// La de 1940 responde entera hasta zoom 18 (0,49 m por píxel). Las de 1965 y 1978 fallan de a ratos (error 500,
// «Failed to draw layer» o «another thread/process failed to create the tile»): a zoom 17 (0,98 m por píxel) salen
// casi siempre, a zoom 18 casi nunca. Cada tesela se pide hasta tres veces; la que no sale se rellena con la del zoom
// anterior, agrandada, y si tampoco está queda gris (el resumen final dice cuántas). Si quedan grises, volver a correr.
// Las teselas traen estampados los nombres de las calles de hoy (en amarillo y verde): no hay capa sin rótulos.
// Licencia: los contenidos del Gobierno de la Ciudad son CC BY 2.5 AR (https://buenosaires.gob.ar/terminos-y-condiciones);
// las fotos mismas, de 1940 y 1965, están en dominio público en la Argentina (ley 11.723, art. 34).
//
//   node fuentes/1965/aerea.mjs <año> --punto <lat> <lon> | --plano <x> <y>  [--lado 800] [--zoom 17] [--marco] --sale <archivo.jpg>
//     --punto   el centro, en latitud y longitud        --plano   el centro, en píxeles del plano de 1867
//     --lado    el lado del cuadrado, en metros          --zoom    17 por omisión (18 solo sirve para 1940)
//     --marco   lo entrega girado al marco del plano de 1867 (arriba el oeste, como el plano), a 1 m por píxel;
//               sin eso sale con el norte arriba, tal como viene
//   node fuentes/1965/aerea.mjs <año> --lamina [--zoom 16] [--cache <carpeta>] --sale <archivo.webp>
//     la foto de todo el marco del plano de 1867, calzada como los planos de época (4096 px de ancho, 3,1 m por píxel,
//     transparente donde no hay foto; al lado deja la de 2048, «-2k»). A zoom 16 son unas 600 teselas: media hora o
//     más. Con --cache guarda cada tesela y, si se corta, al volver a correr sigue donde quedó.
// Va despacio (una tesela cada 2,6 s) y no guarda nada más que el archivo de salida. Un recorte de 800 m son 16 a 25
// teselas: un minuto. No es para bajar la ciudad entera.
import sharp from 'sharp';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { PLANO } from '../../tools/plano.mjs';
import { aPlano, aMetros, grados } from '../../tools/geo.mjs';

const a = process.argv.slice(2), año = +a[0], op = (n, k = 1) => { const i = a.indexOf(n); return i < 0 ? null : a.slice(i + 1, i + 1 + k); };
const lamina = a.includes('--lamina'), cache = op('--cache')?.[0]; if (cache) mkdirSync(cache, { recursive: true });
const lado = +(op('--lado')?.[0] ?? 800), zoom = +(op('--zoom')?.[0] ?? (lamina ? 16 : 17)), sale = op('--sale')?.[0], marco = a.includes('--marco');
let lat, lon;
if (op('--punto', 2)) [lat, lon] = op('--punto', 2).map(Number);
else if (lamina) [lat, lon] = grados(...aMetros(...PLANO.plaza));
else if (op('--plano', 2)) [lat, lon] = grados(...aMetros(...op('--plano', 2).map(Number)));
if (![1940, 1965, 1978].includes(año) || !(lat < 0) || !sale) { console.log('uso: node fuentes/1965/aerea.mjs <1940|1965|1978> --punto <lat> <lon> | --plano <x> <y> [--lado 800] [--zoom 17] [--marco] --sale <archivo.jpg>\n     node fuentes/1965/aerea.mjs <año> --lamina [--zoom 16] [--cache <carpeta>] --sale <archivo.webp>'); process.exit(1); }

const AGENTE = 'mapas-historicos/1.0 (visor de planos antiguos)', PAUSA = 2600;
const BASE = `https://servicios.usig.buenosaires.gob.ar/mapcache/tms/1.0.0/fotografias_aereas_${año}_caba_3857@GoogleMapsCompatible`;
// píxeles del mundo en Web Mercator, a un zoom
const mx = (lon, z) => ((lon + 180) / 360) * 256 * 2 ** z, my = (lat, z) => ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * 256 * 2 ** z;
const mpp = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom; // metros por píxel a ese zoom
const medio = (marco ? lado * 0.75 : lado / 2) / mpp; // (girado hace falta más: la diagonal)
const cx = mx(lon, zoom), cy = my(lat, zoom); let x0 = Math.floor((cx - medio) / 256), x1 = Math.floor((cx + medio) / 256), y0 = Math.floor((cy - medio) / 256), y1 = Math.floor((cy + medio) / 256);
if (lamina) { // las teselas que tocan el interior de la guarda: se recorre su borde
  const [i0, j0, i1, j1] = PLANO.interior, xs = [], ys = [];
  for (let t = 0; t <= 100; t++) for (const [x, y] of [[i0 + (i1 - i0) * t / 100, j0], [i0 + (i1 - i0) * t / 100, j1], [i0, j0 + (j1 - j0) * t / 100], [i1, j0 + (j1 - j0) * t / 100]]) { const [la, lo] = grados(...aMetros(x, y)); xs.push(mx(lo, zoom)); ys.push(my(la, zoom)); }
  x0 = Math.floor(Math.min(...xs) / 256); x1 = Math.floor(Math.max(...xs) / 256); y0 = Math.floor(Math.min(...ys) / 256); y1 = Math.floor(Math.max(...ys) / 256);
}
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
let pedidas = 0;
async function tesela(z, x, y) { // (x, y contados desde el norte; el servicio los quiere desde el sur) → RGB de 256 × 256, o null
  const guardada = cache && `${cache}/${año}-${z}-${x}-${y}`;
  if (guardada && existsSync(guardada + '.raw')) return readFileSync(guardada + '.raw');
  if (guardada && existsSync(guardada + '.no')) return null; // (el servidor dijo que ahí no hay foto: 404)
  if (pedidas++) await espera(PAUSA);
  for (let intento = 0; intento < 3; intento++) {
    try {
      const r = await fetch(`${BASE}/${z}/${x}/${2 ** z - 1 - y}.png`, { headers: { 'User-Agent': AGENTE } });
      if (r.status === 429) { await espera(60000); continue; }
      if (r.status >= 500) { await espera(PAUSA * (intento + 1)); continue; } // (el servidor falla de a ratos: otra vez, más despacio)
      if (!r.ok || !/image/.test(r.headers.get('content-type') ?? '')) { if (guardada && r.status === 404) writeFileSync(guardada + '.no', ''); return null; }
      const t = await sharp(Buffer.from(await r.arrayBuffer())).removeAlpha().resize(256, 256).raw().toBuffer(); if (guardada) writeFileSync(guardada + '.raw', t); return t;
    } catch { await espera(PAUSA); }
  }
  return null;
}
const nx = x1 - x0 + 1, ny = y1 - y0 + 1, W = nx * 256, H = ny * 256, mosaico = Buffer.alloc(W * H * 3, 128), hay = new Uint8Array(nx * ny);
if (lamina) console.log(`${nx} × ${ny} teselas a zoom ${zoom}`);
let enteras = 0, agrandadas = 0, vacias = 0; const padres = new Map();
for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
  let t = await tesela(zoom, tx, ty);
  if (t) enteras++;
  else { // la del zoom anterior, y de ella el cuarto que toca, agrandado
    const k = `${tx >> 1},${ty >> 1}`; if (!padres.has(k)) padres.set(k, await tesela(zoom - 1, tx >> 1, ty >> 1));
    const p = padres.get(k);
    if (p) { t = await sharp(p, { raw: { width: 256, height: 256, channels: 3 } }).extract({ left: (tx & 1) * 128, top: (ty & 1) * 128, width: 128, height: 128 }).resize(256, 256, { kernel: 'cubic' }).raw().toBuffer(); agrandadas++; } else vacias++;
  }
  if (t) hay[(ty - y0) * nx + tx - x0] = 1;
  if (lamina && (tx === x1)) console.log(`  fila ${ty - y0 + 1} de ${ny}: ${enteras} enteras, ${agrandadas} agrandadas, ${vacias} sin dato`);
  if (t) for (let y = 0; y < 256; y++) t.copy(mosaico, (((ty - y0) * 256 + y) * W + (tx - x0) * 256) * 3, y * 768, y * 768 + 768);
}
const tomar = (X, Y, c) => { const i = Math.max(0, Math.min(W - 2, Math.floor(X))), j = Math.max(0, Math.min(H - 2, Math.floor(Y))), u = Math.min(1, Math.max(0, X - i)), v = Math.min(1, Math.max(0, Y - j)), q = (j * W + i) * 3 + c; return mosaico[q] * (1 - u) * (1 - v) + mosaico[q + 3] * u * (1 - v) + mosaico[q + W * 3] * (1 - u) * v + mosaico[q + W * 3 + 3] * u * v; };
if (lamina) { // la lámina: cada píxel del marco de 1867 → latitud y longitud → mosaico; transparente donde no hay foto
  const base = sale.replace(/\.webp$/, '');
  for (const [nombre, An] of [[base, 4096], [base + '-2k', 2048]]) {
    const Al = Math.round((An * PLANO.alto) / PLANO.ancho), k = PLANO.ancho / An, o = Buffer.alloc(An * Al * 4), [i0, j0, i1, j1] = PLANO.interior.map((v) => v / k);
    for (let y = 0; y < Al; y++) for (let x = 0; x < An; x++) {
      if (x < i0 || x > i1 || y < j0 || y > j1) continue;
      const [la, lo] = grados(...aMetros((x + 0.5) * k, (y + 0.5) * k)), X = mx(lo, zoom) - x0 * 256, Y = my(la, zoom) - y0 * 256, tx = Math.floor(X / 256), ty = Math.floor(Y / 256);
      if (tx < 0 || ty < 0 || tx >= nx || ty >= ny || !hay[ty * nx + tx]) continue;
      const q = (y * An + x) * 4; for (let c = 0; c < 3; c++) o[q + c] = tomar(X, Y, c); o[q + 3] = 255;
    }
    await sharp(o, { raw: { width: An, height: Al, channels: 4 } }).webp({ quality: 80, effort: 5 }).toFile(nombre + '.webp');
  }
  console.log(`${sale}: ${año}, todo el marco · teselas: ${enteras} a zoom ${zoom}, ${agrandadas} agrandadas del ${zoom - 1}, ${vacias} sin dato`);
  process.exit(0);
}
let N, out;
if (marco) { // en el marco del plano de 1867, a 1 m por píxel: cada píxel de salida → píxel del plano → latitud y longitud → mosaico
  N = Math.round(lado); out = Buffer.alloc(N * N * 3); const [px, py] = aPlano(lat, lon);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const [la, lo] = grados(...aMetros(px + (x - N / 2) / PLANO.metro, py + (y - N / 2) / PLANO.metro)); for (let c = 0; c < 3; c++) out[(y * N + x) * 3 + c] = tomar(mx(lo, zoom) - x0 * 256, my(la, zoom) - y0 * 256, c); }
} else { // con el norte arriba, a la resolución del zoom
  N = Math.round(lado / mpp); out = Buffer.alloc(N * N * 3);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) for (let c = 0; c < 3; c++) out[(y * N + x) * 3 + c] = tomar(cx - N / 2 + x - x0 * 256, cy - N / 2 + y - y0 * 256, c);
}
await sharp(out, { raw: { width: N, height: N, channels: 3 } }).jpeg({ quality: 88 }).toFile(sale);
console.log(`${sale}: ${año}, ${lado} m de lado, ${N} px (${(lado / N).toFixed(2)} m por píxel), centro ${lat.toFixed(5)}, ${lon.toFixed(5)} · teselas: ${enteras} a zoom ${zoom}, ${agrandadas} agrandadas del ${zoom - 1}, ${vacias} sin dato`);
process.exit(0);
