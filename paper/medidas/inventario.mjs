// Inventario de lo generado, por etapa (solo lectura): manzanas, casas, techos, muros, árboles, superficie edificada
// y tierra ganada al río. Lee public/datos/* y public/plano/*.webp tal como los baja el navegador.
//   node paper/medidas/inventario.mjs > paper/medidas/inventario.txt   (escribe además paper/medidas/inventario.json)
import sharp from 'sharp';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const R = (f) => new URL('../../' + f, import.meta.url);
const meta = JSON.parse(readFileSync(R('public/datos/ciudad.json'), 'utf8')), crece = JSON.parse(readFileSync(R('public/datos/crece.json'), 'utf8'));
const { ancho, alto, metro, plaza, interior } = meta.plano;
const AÑOS = [1867, ...crece.epocas.map((e) => e.año)], N = crece.epocas.length;
const out = { años: AÑOS };

/** abre un .pak (gzip, cabecera JSON, registros «por planos») → { nombre: Buffer } */
function pak(f) {
  const buf = gunzipSync(readFileSync(R(f))), n = buf.readUInt32LE(0), cab = JSON.parse(buf.subarray(4, 4 + n).toString('utf8')), o = {}; let p = 4 + n;
  for (const { nombre, bytes, registro } of cab.partes) { const src = buf.subarray(p, p + bytes), dst = Buffer.alloc(bytes), m = bytes / registro; for (let k = 0; k < registro; k++) for (let i = 0; i < m; i++) dst[i * registro + k] = src[k * m + i]; o[nombre] = dst; p += bytes; }
  return { cab, partes: o, crudo: buf.length };
}
const f32 = (b) => new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)), u16 = (b) => new Uint16Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)), u32 = (b) => new Uint32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));

// ------------------------------------------------------------------------------------------------ la ciudad de 1867
const c67 = pak('public/datos/ciudad.pak');
for (const n of ['manzanas', 'techos', 'muros', 'arboles']) if (Buffer.compare(c67.partes[n], readFileSync(R(`public/datos/${n}.bin`)))) throw new Error(`ciudad.pak y ${n}.bin no coinciden`);
console.log('ciudad.pak coincide byte a byte con los cuatro .bin sueltos');
const mz = f32(c67.partes.manzanas), te = u16(c67.partes.techos), mu = u16(c67.partes.muros), ar = f32(c67.partes.arboles);
const nMz = mz.length / 10, nTe = te.length / 8, nMu = mu.length / 8, nAr = ar.length / 3;
/** m² de una celda de la grilla de la manzana b (el cuadrilátero, repartido en nu × nv celdas) */
const celda = (m, b) => { const k = b * 10; let a = 0; for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; a += m[k + i * 2] * m[k + j * 2 + 1] - m[k + j * 2] * m[k + i * 2 + 1]; } return (Math.abs(a) / 2) * metro * metro / (m[k + 8] * m[k + 9]); };
let grandes = 0; for (let b = 0; b < nMz; b++) if (mz[b * 10 + 8] >= 45 && mz[b * 10 + 9] >= 45) grandes++;
const area67 = new Float64Array(nTe), pisos67 = new Uint8Array(nTe), alto67 = new Float32Array(nTe); const casas67 = new Set();
for (let i = 0; i < nTe; i++) { const k = i * 8; area67[i] = (te[k + 3] - te[k + 1]) * (te[k + 4] - te[k + 2]) * celda(mz, te[k]); pisos67[i] = te[k + 7] & 15; alto67[i] = te[k + 5] / 10; casas67.add(te[k] * 65536 + te[k + 6]); }
console.log(`1867 · ciudad.json: manzanas ${meta.manzanas}, lotes ${meta.lotes}, techos ${meta.techos}, muros ${meta.muros}, árboles ${meta.arboles}, iglesias ${meta.iglesias.length}`);
console.log(`1867 · leído de los datos: registros de manzana ${nMz} (de ellos ${grandes} con los dos lados ≥ 45 m; el resto, construcciones sueltas y casillas), techos ${nTe}, muros ${nMu}, árboles ${nAr}, cuerpos distintos (manzana, semilla) ${casas67.size}`);
out.c67 = { manzanas: nMz, manzanasGrandes: grandes, lotes: meta.lotes, cuerpos: casas67.size, techos: nTe, muros: nMu, arboles: nAr, iglesias: meta.iglesias.length };

// ------------------------------------------------------------------------------------------------ lo que crece
const cr = pak('public/datos/crece.pak');
const mz2 = f32(cr.partes.manzanas), te2 = u16(cr.partes.techos), mu2 = u16(cr.partes.muros), mueT = u32(cr.partes.mueT), mueM = u32(cr.partes.mueM);
const nTe2 = te2.length / 8, nMu2 = mu2.length / 8;
const muereT = new Map(); for (let i = 0; i < mueT.length; i += 2) muereT.set(mueT[i], mueT[i + 1]);
const muereM = new Map(); for (let i = 0; i < mueM.length; i += 2) muereM.set(mueM[i], mueM[i + 1]);
console.log(`crece.pak: registros de manzana ${mz2.length / 10}, techos ${nTe2}, muros ${nMu2}; de 1867 se van ${muereT.size} techos y ${muereM.size} muros`);
out.crece = { manzanas: mz2.length / 10, techos: nTe2, muros: nMu2, techos67queSeVan: muereT.size, muros67queSeVan: muereM.size };

const porEtapa = [];
for (let e = 0; e <= N; e++) {
  // lo de 1867 que sigue en pie en la etapa e
  let t = 0, m = 0, a = 0, ap = 0, hmax = 0; const cuerpos = new Set();
  for (let i = 0; i < nTe; i++) { const d = muereT.get(i); if (d && d <= e) continue; t++; a += area67[i]; ap += area67[i] * pisos67[i]; cuerpos.add('a' + (te[i * 8] * 65536 + te[i * 8 + 6])); }
  for (let i = 0; i < nMu; i++) { const d = muereM.get(i); if (!(d && d <= e)) m++; }
  // lo nuevo que ya nació y no se fue
  let tn = 0, mn = 0, nacen = 0; const nuevos = new Set();
  for (let i = 0; i < nTe2; i++) { const k = i * 8, f = te2[k + 7], nace = (f >> 8) & 15, muere = f >> 12; if (nace === e) nacen++; if (nace > e || (muere && muere <= e)) continue; tn++; const s = (te2[k + 3] - te2[k + 1]) * (te2[k + 4] - te2[k + 2]) * celda(mz2, te2[k]); a += s; ap += s * (f & 15); hmax = Math.max(hmax, te2[k + 5] / 10); nuevos.add(te2[k] * 65536 + te2[k + 6]); }
  for (let i = 0; i < nMu2; i++) { const f = mu2[i * 8 + 1], nace = (f >> 8) & 15, muere = f >> 12; if (nace <= e && !(muere && muere <= e)) mn++; }
  const ep = e ? crece.epocas[e - 1] : null;
  porEtapa.push({ año: AÑOS[e], techos: t + tn, techos67: t, techosNuevos: tn, muros: m + mn, cuerpos67: cuerpos.size, cuerposNuevos: nuevos.size, cuerpos: cuerpos.size + nuevos.size, casasNuevasSegunCreceJson: ep?.casas ?? 0, renovadasSegunCreceJson: ep?.renovadas ?? 0, edificadoHa: a / 1e4, pisosMedios: ap / a, altoMaxNuevo: hmax });
}
let acum = 0;
console.log('\naño   cuerpos en pie  (de 1867 / nuevos)   techos    muros   +casas (crece.json)  acumuladas  renovadas  edificado (ha)  pisos medios (por superficie)');
for (const p of porEtapa) { acum += p.casasNuevasSegunCreceJson; p.casasAcumuladas = acum; console.log(`${p.año}  ${String(p.cuerpos).padStart(8)}   (${String(p.cuerpos67).padStart(6)} / ${String(p.cuerposNuevos).padStart(6)})  ${String(p.techos).padStart(7)}  ${String(p.muros).padStart(7)}   ${String(p.casasNuevasSegunCreceJson).padStart(8)}         ${String(acum).padStart(8)}   ${String(p.renovadasSegunCreceJson).padStart(7)}   ${p.edificadoHa.toFixed(1).padStart(10)}   ${p.pisosMedios.toFixed(2).padStart(8)}`); }
out.porEtapa = porEtapa;

// ------------------------------------------------------------------------------------------------ los patios (color)
{ const b = gunzipSync(readFileSync(R('public/datos/patios.pak'))), n = b.readUInt32LE(0); let alj = 0; for (let i = 0; i < n; i++) if (b[4 + 4 * n + i] === 0) alj++;
  console.log(`\npatios.pak (solo en color): ${n} registros = ${n - alj} árboles + ${alj} aljibes`); out.patios = { arboles: n - alj, aljibes: alj }; }

// ------------------------------------------------------------------------------------------------ el suelo, con los años
// La lámina crece.webp dice «desde cuándo» con un código por etapa; el visor destapa cada punto cuando el código
// supera un umbral que baja con los años (llego(), en src/tinta.js): acá se cuenta con ese mismo umbral.
const leer = async (f, w) => { const im = sharp(R(f).pathname); const md = await im.metadata(); const W = w ?? md.width, H = w ? Math.round((md.height * w) / md.width) : md.height; const { data, info } = await (w ? im.resize(W, H, { fit: 'fill', kernel: 'nearest' }) : im).raw().toBuffer({ resolveWithObject: true }); return { data, W: info.width, H: info.height, c: info.channels }; };
const cre = await leer('public/plano/crece.webp'), sue = await leer('public/plano/suelo.webp', cre.W);
if (sue.H !== cre.H) throw new Error('suelo y crece no miden lo mismo');
const px = (ancho * metro) / cre.W, km2 = (n) => (n * px * px) / 1e6;
const [ix0, iy0, ix1, iy1] = interior.map((v) => (v * cre.W) / ancho);
let rio67 = 0, guarda = 0; const ganada = new Array(N + 1).fill(0), urban = new Array(N + 1).fill(0), fondo = new Array(N + 1).fill(0), edif = new Array(N + 1).fill(0); let e67 = 0, p67 = 0;
for (let y = 0; y < cre.H; y++) for (let x = 0; x < cre.W; x++) {
  if (x < ix0 || x > ix1 || y < iy0 || y > iy1) continue; guarda++;
  const q = y * cre.W + x, r = cre.data[q * cre.c] / 255, g = cre.data[q * cre.c + 1] / 255, b = cre.data[q * cre.c + 2] / 255, agua = sue.data[q * sue.c] > 127;
  if (agua) rio67++; if (sue.data[q * sue.c + 1] > 127) p67++; if (sue.data[q * sue.c + 2] > 127) e67++;
  for (let k = 1; k <= N; k++) { const u = (N + 0.5 - k) / N; if (r > u) { if (agua) ganada[k]++; else urban[k]++; } if (g > u) fondo[k]++; if (b > u) edif[k]++; }
}
console.log(`\nlámina del suelo (${cre.W} × ${cre.H}, ${px.toFixed(2)} m por punto), dentro de la guarda: ${km2(guarda).toFixed(1)} km²`);
console.log(`1867: río y cauces ${km2(rio67).toFixed(2)} km² · rayado de fondo ${km2(p67).toFixed(2)} km² · rayado edificado y negro ${km2(e67).toFixed(2)} km²`);
console.log('año   tierra ganada al río, acumulada (km²)   suelo urbanizado nuevo (km²)   fondos nuevos (km²)   edificado nuevo en la lámina (km²)');
out.suelo = { pxM: px, guardaKm2: km2(guarda), rio67Km2: km2(rio67), patio67Km2: km2(p67), edif67Km2: km2(e67), porEtapa: [] };
for (let k = 1; k <= N; k++) { console.log(`${AÑOS[k]}  ${km2(ganada[k]).toFixed(2).padStart(10)} ${km2(urban[k]).toFixed(2).padStart(34)} ${km2(fondo[k]).toFixed(2).padStart(26)} ${km2(edif[k]).toFixed(2).padStart(24)}`); out.suelo.porEtapa.push({ año: AÑOS[k], ganadaKm2: km2(ganada[k]), urbanizadoKm2: km2(urban[k]), fondosKm2: km2(fondo[k]), edificadoLaminaKm2: km2(edif[k]) }); }

// la tierra ganada hasta hoy («lo de hoy»): el canal G de hoy-lejos.webp
{ const h = await leer('public/plano/hoy-lejos.webp'), p2 = (ancho * metro) / h.W; let n = 0, s = 0; for (let q = 0; q < h.W * h.H; q++) { const v = h.data[q * h.c + 1]; if (v > 127) n++; s += v / 255; }
  console.log(`\ntierra ganada al río hasta hoy (hoy-lejos.webp, canal G, ${h.W} px): ${((n * p2 * p2) / 1e6).toFixed(2)} km² con umbral 0,5; ${((s * p2 * p2) / 1e6).toFixed(2)} km² sumando la cobertura`);
  out.ganadaHoyKm2 = { umbral: (n * p2 * p2) / 1e6, cobertura: (s * p2 * p2) / 1e6 }; }

// el relieve
{ const b = readFileSync(R('public/datos/relieve.bin')), u = new Uint16Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)), W = u[0], H = u[1]; let mx = 0; for (let i = 2; i < u.length; i++) mx = Math.max(mx, u[i]);
  const en = (x, y) => u[2 + Math.floor((y / alto) * H) * W + Math.floor((x / ancho) * W)] / 10;
  console.log(`\nrelieve.bin: ${W} × ${H} celdas de ${((ancho * metro) / W).toFixed(1)} m, alturas en decímetros; máximo ${(mx / 10).toFixed(1)} m; en la Plaza de Mayo (centro de la plaza de 1867) ${en(...plaza).toFixed(1)} m`);
  out.relieve = { W, H, celdaM: (ancho * metro) / W, maxM: mx / 10, plazaM: en(...plaza) }; }
writeFileSync(new URL('./inventario.json', import.meta.url), JSON.stringify(out, null, 1));
