// La ciudad: lo que dejó tools/2-ciudad.mjs (manzanas, techos, muros, árboles), vuelto malla.
// Cada manzana trae sus cuatro esquinas en píxeles del plano y una grilla de celdas de 1 m; techos y muros vienen
// en celdas de su manzana. Acá se pasan a metros del mundo: x hacia el norte, z hacia el río, con el cero en la plaza.
import { LINEAS } from './vias.js';
import * as THREE from 'three';
import { trozar, soltar } from './trozos.js';
import { mergeVertices, mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

import { pedir } from './url.js';

const bin = async (url, T) => { const r = await pedir(url); if (!r.ok) throw new Error(url); return new T(await r.arrayBuffer()); };
const TIPOS = { manzanas: Float32Array, techos: Uint16Array, muros: Uint16Array, arboles: Float32Array };

/** Todo en un archivo, comprimido (lo arma tools/empacar.mjs: ahí está el formato). Pesa un tercio que los sueltos. */
async function paquete(ruta = 'datos/ciudad.pak', tipos = TIPOS) {
  if (typeof DecompressionStream !== 'function') throw new Error('sin DecompressionStream');
  const r = await pedir(ruta); if (!r.ok) throw new Error(ruta);
  const buf = await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  const n = new DataView(buf).getUint32(0, true), cab = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, n))), out = {};
  let o = 4 + n;
  for (const { nombre, bytes, registro } of cab.partes) {
    // (vienen por planos: todos los primeros bytes de cada registro, después todos los segundos…)
    const src = new Uint8Array(buf, o, bytes), dst = new Uint8Array(bytes), m = bytes / registro;
    for (let k = 0; k < registro; k++) { const base = k * m; for (let i = 0; i < m; i++) dst[i * registro + k] = src[base + i]; }
    out[nombre] = new tipos[nombre](dst.buffer); o += bytes;
  }
  return out;
}
const sueltos = async () => { const [manzanas, techos, muros, arboles] = await Promise.all(Object.entries(TIPOS).map(([n, T]) => bin(`datos/${n}.bin`, T))); return { manzanas, techos, muros, arboles }; };

/** Lo poco que hace falta para tender el plano: sus medidas y dónde está la plaza. */
export const loadMeta = () => pedir('datos/ciudad.json').then((r) => r.json());
/** La ciudad entera. `meta`: lo de loadMeta (o su promesa). */
export async function loadCiudad(meta) {
  const d = await paquete().catch(sueltos);
  return { meta: await meta, mz: d.manzanas, techos: d.techos, muros: d.muros, arboles: d.arboles };
}

/** Lo que la ciudad cambia después de 1867 (tools/crece.mjs): las casas de los planos que siguen, con el mismo formato
 *  (y, en cada una, la etapa en que nace y la etapa en que se va), y lo de 1867 que se demuele: pares (registro, etapa)
 *  de sus techos (mueT) y de sus muros (mueM). */
export async function loadCrece() {
  const d = await paquete('datos/crece.pak', { manzanas: Float32Array, techos: Uint16Array, muros: Uint16Array, mueT: Uint32Array, mueM: Uint32Array });
  return { mz: d.manzanas, techos: d.techos, muros: d.muros, mueT: d.mueT, mueM: d.mueM };
}

/** La copa de un árbol, de radio 1: una bola más o menos abollada (y con su tronco, la de cerca). La usan también los
 *  árboles de los patios (src/patios.js). */
export const copa = (detalle, tronco, bulto) => {
  let g = new THREE.IcosahedronGeometry(1, detalle); g.deleteAttribute('uv'); g.deleteAttribute('normal'); g = mergeVertices(g, 1e-4);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = 1 + bulto * (0.13 * Math.sin(x * 4.1 + y * 2.3 + 1) * Math.cos(z * 3.7 - y * 1.9) + 0.09 * Math.sin(y * 6.3 + z * 5.1) * Math.cos(x * 5.7 + 2)); p.setXYZ(i, x * n, (y * 0.9 + 1.3) * n, z * n); }
  g.computeVertexNormals();
  if (tronco) { const t = new THREE.CylinderGeometry(0.09, 0.13, 0.7, 5, 1, true).translate(0, 0.35, 0); t.deleteAttribute('uv'); g = mergeGeometries([g, t]); }
  return g;
};

/** De qué estilo es cada casa sin nombre: lo decide cuándo nació (la etapa de la línea de tiempo), cuántos pisos tiene y
 *  en qué barrio está, con un sorteo fijo por casa para que la cuadra no salga pareja. src/tinta.js dibuja cada uno:
 *    0 colonial (la casa de azotea de 1867, blanqueada) · 1 italianizante (pilastras, cornisa, pretil con balaustres,
 *    ocres y rosas: de 1880 a 1910, y las casas de altos de 1867) · 2 francesa (símil piedra, balcones de hierro y
 *    mansarda de pizarra: 1905 a 1921, más en el Barrio Norte) · 3 de comercio (vidrieras y toldos abajo: el centro)
 *    · 4 racionalista (ventanas apaisadas, balcones macizos, sin cornisa: los años treinta) · 5 galpón de ladrillo,
 *    con techo de chapa a dos aguas (el puerto, Barracas) · 6 casilla de madera y chapa, de colores (La Boca) ·
 *    7 casa de las orillas, de ladrillo o revoque sin pintar, con chapa o teja francesa · 8 rancho de 1867, con paja.
 *  x, z: el centro de la manzana, en metros del mundo (x al norte, z al río). Es un boceto por barrio, no un censo. */
const ESTILO = { COLONIAL: 0, ITALIANA: 1, FRANCESA: 2, COMERCIO: 3, RACIONAL: 4, GALPON: 5, CHAPA: 6, ORILLA: 7, RANCHO: 8 };
const paso = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const azar = (n) => { let h = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
export function estiloDe(x, z, nace, pisos, semilla) {
  const E = ESTILO, r = azar(semilla * 3 + 1), r2 = azar(semilla * 3 + 2), r3 = azar(semilla * 3 + 3), d = Math.hypot(x, z);
  const boca = 1 - paso(600, 1100, Math.hypot(x + 3050, z - 1250)); // (la Vuelta de Rocha)
  const norte = paso(1000, 1500, x) * paso(-3300, -2700, z) * (1 - paso(600, 1000, z)); // (el Retiro, la Recoleta, el Barrio Norte)
  const city = 1 - paso(600, 1300, Math.hypot(x - 550, z + 450)); // (alrededor de Corrientes y Esmeralda)
  // (lo que se le ganó al río frente al centro —depósitos— y Barracas, la de los saladeros y las barracas)
  const fabril = Math.max(paso(380, 560, z) * (1 - paso(2300, 2800, Math.abs(x))), 0.55 * paso(-2300, -2900, x) * (1 - paso(300, 700, z)));
  if (boca > r && pisos < 3) return nace === 0 || r2 < 0.75 ? E.CHAPA : E.ITALIANA;
  if (nace === 0) {
    if (fabril > r && pisos < 2) return E.GALPON;
    if (pisos >= 2) return E.ITALIANA;
    return paso(3000, 4500, d) > r2 ? E.RANCHO : E.COLONIAL;
  }
  if (fabril > r && pisos < 4) return E.GALPON;
  const lejos = paso(2300, 3700, d);
  if (nace >= 6) { // 1940 y 1950 (el edificio de departamentos de 1950, casi siempre racionalista: supuesto)
    if (pisos >= 4) return r2 < (nace >= 7 ? 0.9 : 0.72) ? E.RACIONAL : r2 < 0.86 ? E.FRANCESA : E.COMERCIO;
    if (lejos > r) return E.ORILLA;
    return r2 < 0.45 ? E.RACIONAL : r2 < 0.75 ? E.ITALIANA : E.COMERCIO;
  }
  if (nace >= 3) { // 1905, 1910 y 1921
    if (pisos >= 3) return r2 < 0.4 + 0.45 * norte ? E.FRANCESA : city > r3 ? E.COMERCIO : E.ITALIANA;
    if (lejos > r) return E.ORILLA;
    return pisos === 2 && city * 0.7 > r3 ? E.COMERCIO : r2 < 0.2 + 0.3 * norte ? E.FRANCESA : E.ITALIANA;
  }
  if (lejos > r) return E.ORILLA; // 1888 y 1895
  if (pisos >= 3) return norte * 0.5 > r2 ? E.FRANCESA : E.ITALIANA;
  return pisos === 2 && city * 0.4 > r3 ? E.COMERCIO : E.ITALIANA;
}

/** Techos y muros vueltos una sola geometría. Cada casa puede traer anotada su etapa de la línea de tiempo (desde qué
 *  plano existe: 1, 2 o 3; las de 1867 no traen nada): va sumada a la distancia a la plaza, de a 20 000 (src/tinta.js). */
export function mallaCasas({ mz, techos, muros }, { plaza, metro }, tiempos = false) {
  // (tiempos: lo de la línea de tiempo trae cuándo nace y cuándo se va cada cosa; va como nace + 8 · muere. Ver alzado(), en tinta.js)
  const cuando = (f) => (tiempos ? ((f >> 8) & 15) + 8 * (f >> 12) : 0) * 20000;
  // un punto (u, v) de la grilla de la manzana b, en el mundo
  const P = (b, u, v, out, o) => {
    const k = b * 10, s = u / mz[k + 8], t = v / mz[k + 9], a = (1 - s) * (1 - t), c = s * (1 - t), d = s * t, e = (1 - s) * t;
    out[o] = (a * mz[k] + c * mz[k + 2] + d * mz[k + 4] + e * mz[k + 6] - plaza[0]) * metro;
    out[o + 2] = (a * mz[k + 1] + c * mz[k + 3] + d * mz[k + 5] + e * mz[k + 7] - plaza[1]) * metro;
  };
  // a qué distancia de la plaza está cada manzana: de eso depende cuándo se levanta
  const dist = new Float32Array(mz.length / 10), cen = new Float32Array(dist.length * 2), tmp = [0, 0, 0];
  for (let b = 0; b < dist.length; b++) { P(b, mz[b * 10 + 8] / 2, mz[b * 10 + 9] / 2, tmp, 0); dist[b] = Math.hypot(tmp[0], tmp[2]); cen[b * 2] = tmp[0]; cen[b * 2 + 1] = tmp[2]; }
  // (el estilo de la casa, igual en su techo y en todos sus muros: sale de la manzana, la etapa, los pisos y la semilla)
  const estilo = (b, f, pisos, semilla) => estiloDe(cen[b * 2], cen[b * 2 + 1], tiempos ? (f >> 8) & 15 : 0, pisos, semilla);
  const estiloT = (i) => estilo(techos[i * 8], techos[i * 8 + 7], techos[i * 8 + 7] & 15, techos[i * 8 + 6]);
  const nT = techos.length / 8, nM = muros.length / 8, nB = nT + nM;
  // Los remates: lo que cada casa lleva arriba según su estilo, para que no sean todas cajas. El techo a dos aguas
  // (1: galpones, casillas, orillas y ranchos), la mansarda de pizarra (2: las francesas), la casilla del tanque y el
  // ascensor (3: las casas de renta de cuatro pisos o más y las torres de los treinta), el mirador (4: algunas casas
  // viejas de azotea), la chimenea de ladrillo (5: algunos galpones grandes; lleva también sus dos aguas) y, sumada,
  // la cúpula de las esquinas (+8: los edificios de 1905 a 1921 que dan a la esquina de su manzana). Se deciden acá,
  // antes de reservar la malla; de tanque, mirador, chimenea y cúpula va uno por casa, aunque tenga varios cuerpos.
  const rem = new Uint8Array(nT), CUANTAS = [0, 3, 4, 5, 5, 12], dados = new Set();
  let nX = 0;
  // Las ochavas: la esquina cortada en diagonal, que en Buenos Aires es regla desde 1821 para todo lo que se edifica.
  // La llevan los cuerpos nuevos (los de la línea de tiempo; lo de 1867 queda como lo dibuja el plano) que tienen una
  // esquina junto a la de su manzana, con las dos paredes a la calle. Los datos no cambian: acá se acortan esas dos
  // paredes (rec0, rec1: cuántas celdas, en cada punta), y más abajo, con los remates, se recorta el techo y se
  // cierra con la pared en diagonal. och: qué esquinas del cuerpo van cortadas (un bit por cada una, en el orden
  // de los vértices del techo). Los galpones, las casillas y los ranchos no la llevan.
  const och = new Uint8Array(nT), rec0 = new Uint8Array(nM), rec1 = new Uint8Array(nM), OCH = 4;
  if (tiempos) {
    const lineas = new Map(), kl = (b, dir, c) => (b * 4 + dir) * 2048 + c;
    for (let i = 0; i < nM; i++) { const k = i * 8, key = kl(muros[k], muros[k + 1] & 3, muros[k + 2]), l = lineas.get(key); if (l) l.push(i); else lineas.set(key, [i]); }
    /** las paredes de la casa `s` sobre esa línea que caen en las OCH celdas que siguen a la esquina `a` (hacia adelante
     *  si fin es 0, hacia atrás si es 1): vale si ninguna es medianera y alguna arranca del suelo justo en la esquina
     *  (a la calle o «a un patio»: entre la casa y el borde de la grilla suele quedar una franja de la manzana, la vereda) */
    const frente = (b, dir, c, a, fin, s) => {
      const x0 = fin ? a - OCH : a, x1 = fin ? a : a + OCH, l = (lineas.get(kl(b, dir, c)) ?? []).filter((i) => muros[i * 8 + 7] === s && muros[i * 8 + 3] < x1 && muros[i * 8 + 4] > x0); let punta = false;
      for (const i of l) { const k = i * 8; if (((muros[k + 1] >> 2) & 3) > 1) return null; if (muros[k + 5] === 0 && muros[k + 3 + fin] === a) punta = true; }
      return punta ? l : null;
    };
    /** saca de esas paredes lo que cae en el tramo de la ochava */
    const recorta = (l, a, fin) => { for (const i of l) { const k = i * 8, largo = muros[k + 4] - muros[k + 3]; if (fin) rec1[i] = Math.max(rec1[i], Math.min(largo - rec0[i], muros[k + 4] - (a - OCH))); else rec0[i] = Math.max(rec0[i], Math.min(largo - rec1[i], a + OCH - muros[k + 3])); } };
    for (let i = 0; i < nT; i++) {
      const k = i * 8, b = techos[k], u0 = techos[k + 1], v0 = techos[k + 2], u1 = techos[k + 3], v1 = techos[k + 4], s = techos[k + 6], U = mz[b * 10 + 8], V = mz[b * 10 + 9];
      if (u1 - u0 < OCH + 3 || v1 - v0 < OCH + 3 || estiloT(i) >= ESTILO.GALPON) continue;
      const doble = u1 - u0 >= 2 * OCH + 3 && v1 - v0 >= 2 * OCH + 3;
      // (cada esquina: dónde está, la pared «horizontal» —dir, punta— y la «vertical»)
      for (const [j, cu, cv, dh, fh, dv, fv] of [[0, u0, v0, 0, 0, 3, 0], [1, u0, v1, 2, 0, 3, 1], [2, u1, v1, 2, 1, 1, 1], [3, u1, v0, 0, 1, 1, 0]]) {
        if ((cu > 7 && cu < U - 7) || (cv > 7 && cv < V - 7) || (och[i] && !doble)) continue;
        const lh = frente(b, dh, cv, cu, fh, s), lv = lh && frente(b, dv, cu, cv, fv, s); if (!lv) continue;
        och[i] |= 1 << j; recorta(lh, cu, fh); recorta(lv, cv, fv);
      }
    }
  }
  const bits = (n) => (n & 1) + ((n >> 1) & 1) + ((n >> 2) & 1) + ((n >> 3) & 1);
  for (let i = 0; i < nT; i++) {
    const k = i * 8, b = techos[k], fk = techos[k + 7], pisos = fk & 15, nace = tiempos ? (fk >> 8) & 15 : 0, s16 = techos[k + 6];
    const u0 = techos[k + 1], v0 = techos[k + 2], u1 = techos[k + 3], v1 = techos[k + 4], corto = Math.min(u1 - u0, v1 - v0), es = estiloT(i), clave = b * 65536 + s16;
    let t = 0;
    if (es >= ESTILO.GALPON) { t = corto >= 3 ? 1 : 0; // (los cuerpos más angostos quedan chatos: a dos aguas serían aletas)
      if (es === ESTILO.GALPON && nace >= 1 && corto >= 9 && azar(s16 * 7 + 4) < 0.1 && !dados.has(clave)) { t = 5; dados.add(clave); } }
    else if (es === ESTILO.FRANCESA && pisos >= 2 && corto >= 4) t = 2;
    else if ((es === ESTILO.RACIONAL ? pisos >= 5 : pisos >= 4) && es !== ESTILO.COLONIAL && corto >= 7 && !dados.has(clave)) { t = 3; dados.add(clave); }
    else if ((es === ESTILO.COLONIAL || es === ESTILO.ITALIANA) && nace <= 2 && corto >= 6 && pisos <= 3 && azar(s16 * 7 + 5) < (pisos >= 2 ? 0.16 : 0.03) && !dados.has(clave)) { t = 4; dados.add(clave); }
    if ((es === ESTILO.FRANCESA || es === ESTILO.COMERCIO || es === ESTILO.ITALIANA) && pisos >= 2 && nace >= 3 && (nace <= 5 || es === ESTILO.FRANCESA) && corto >= 6 && t !== 4 && azar(s16 * 7 + 6) < (pisos >= 3 ? 0.9 : 0.3) && !dados.has(-clave - 1)) {
      const U = mz[b * 10 + 8], V = mz[b * 10 + 9];
      if ((u0 <= 5 || u1 >= U - 5) && (v0 <= 5 || v1 >= V - 5)) { t += 8; dados.add(-clave - 1); } // (las casas arrancan a unos 4 m del borde de la manzana: la vereda)
    }
    rem[i] = t; nX += CUANTAS[t & 7] + (t & 8 ? 32 : 0) + bits(och[i]) * ((t & 7) === 2 ? 3 : 2);
  }
  const nQ = nB + nX;
  const pos = new Float32Array(nQ * 12), nor = new Float32Array(nQ * 12), uv = new Float32Array(nQ * 16), info = new Float32Array(nQ * 16), idx = new Uint32Array(nQ * 6), est = new Float32Array(nQ * 4);
  // (dónde quedaron los remates de cada techo, para llevárselos cuando la casa se demuele: marcarMueren)
  const remDe = new Uint32Array(nT), remN = new Uint8Array(nT);
  let q = 0;
  const quad = () => { const o = q * 4; idx.set([o, o + 1, o + 2, o, o + 2, o + 3], q * 6); q++; };
  for (let i = 0; i < nT; i++) {
    const k = i * 8, b = techos[k], h = techos[k + 5] / 10, seed = techos[k + 6] / 65535, fk = techos[k + 7], o = q * 12;
    P(b, techos[k + 1], techos[k + 2], pos, o); P(b, techos[k + 1], techos[k + 4], pos, o + 3); P(b, techos[k + 3], techos[k + 4], pos, o + 6); P(b, techos[k + 3], techos[k + 2], pos, o + 9);
    for (let v = 0; v < 4; v++) { pos[o + v * 3 + 1] = h; nor[o + v * 3 + 1] = 1; info.set([seed, 30 + (fk & 15), h, dist[b] + cuando(fk)], q * 16 + v * 4); }
    est.fill(estiloT(i), q * 4, q * 4 + 4);
    // (para dibujar el pretil: dónde está cada punto de la azotea respecto de sus bordes, en metros)
    const W = Math.hypot(pos[o + 9] - pos[o], pos[o + 11] - pos[o + 2]), L = Math.hypot(pos[o + 3] - pos[o], pos[o + 5] - pos[o + 2]);
    uv.set([0, 0, W, L, 0, L, W, L, W, L, W, L, W, 0, W, L], q * 16);
    quad();
  }
  const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]], a2 = [0, 0, 0], b2 = [0, 0, 0], c2 = [0, 0, 0];
  for (let i = 0; i < nM; i++) {
    const k = i * 8, b = muros[k], f = muros[k + 1], dir = f & 3, kind = (f >> 2) & 3, floors = (f >> 4) & 15, c = muros[k + 2], a0 = muros[k + 3] + rec0[i], a1 = muros[k + 4] - rec1[i], y0 = muros[k + 5] / 10, y1 = muros[k + 6] / 10, seed = muros[k + 7] / 65535, o = q * 12;
    const horiz = dir === 0 || dir === 2;
    if (horiz) { P(b, a0, c, a2, 0); P(b, a1, c, b2, 0); P(b, (a0 + a1) / 2 + DIRS[dir][0], c + DIRS[dir][1], c2, 0); } else { P(b, c, a0, a2, 0); P(b, c, a1, b2, 0); P(b, c + DIRS[dir][0], (a0 + a1) / 2 + DIRS[dir][1], c2, 0); }
    // la normal: perpendicular al muro, hacia afuera
    const ex = b2[0] - a2[0], ez = b2[2] - a2[2], L = Math.hypot(ex, ez) || 1; let nx = -ez / L, nz = ex / L;
    if ((c2[0] - (a2[0] + b2[0]) / 2) * nx + (c2[2] - (a2[2] + b2[2]) / 2) * nz < 0) { nx = -nx; nz = -nz; }
    // (el orden de los vértices, para que la cara mire hacia afuera)
    const flip = ex * nz - ez * nx < 0, A = flip ? b2 : a2, B = flip ? a2 : b2;
    pos.set([A[0], y0, A[2], B[0], y0, B[2], B[0], y1, B[2], A[0], y1, A[2]], o);
    for (let v = 0; v < 4; v++) { nor[o + v * 3] = nx; nor[o + v * 3 + 2] = nz; info.set([seed, kind * 10 + floors, y1, dist[b] + cuando(f)], q * 16 + v * 4); }
    est.fill(estilo(b, f, floors, muros[k + 7]), q * 4, q * 4 + 4);
    uv.set([0, y0, L, y0, L, y0, L, y0, L, y1, L, y0, 0, y1, L, y0], q * 16); // (z, w: el largo del muro y de dónde arranca; lo usan los avisos pintados de las medianeras, src/tinta.js)
    quad();
  }
  // ---- los remates ----
  /** una cara de cuatro puntos [x, y, z] (dos pueden coincidir: un triángulo) que mira hacia `hacia`; en `en`, en qué
   *  lugar de la malla va (si no, al final). uvs: [x, y] de cada punto (aWall.xy); zw: lo que va en aWall.zw. */
  const cara = (C, hacia, uvs, zw, inf, e, en = -1) => {
    let a = C[0], b = C[1], c = C[2], d = C[3], n = [(b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])];
    if (Math.hypot(...n) < 1e-6) n = [(c[1] - a[1]) * (d[2] - a[2]) - (c[2] - a[2]) * (d[1] - a[1]), (c[2] - a[2]) * (d[0] - a[0]) - (c[0] - a[0]) * (d[2] - a[2]), (c[0] - a[0]) * (d[1] - a[1]) - (c[1] - a[1]) * (d[0] - a[0])];
    let U = uvs;
    if (n[0] * hacia[0] + n[1] * hacia[1] + n[2] * hacia[2] < 0) { [b, d] = [d, b]; U = [uvs[0], uvs[3], uvs[2], uvs[1]]; n = [-n[0], -n[1], -n[2]]; }
    const l = Math.hypot(...n) || 1, Q = en < 0 ? q : en, o = Q * 12;
    pos.set([...a, ...b, ...c, ...d], o);
    for (let v = 0; v < 4; v++) { nor.set([n[0] / l, n[1] / l, n[2] / l], o + v * 3); info.set(inf, Q * 16 + v * 4); uv.set([U[v][0], U[v][1], zw[0], zw[1]], Q * 16 + v * 4); }
    est.fill(e, Q * 4, Q * 4 + 4);
    if (en < 0) quad();
  };
  const ARR = [0, 1, 0];
  for (let i = 0; i < nT; i++) {
    const t = rem[i]; if (!t && !och[i]) continue;
    const k = i * 8, b = techos[k], h = techos[k + 5] / 10, seed = techos[k + 6] / 65535, s16 = techos[k + 6], fk = techos[k + 7], pisos = fk & 15, w = dist[b] + cuando(fk), e = estiloT(i), o = i * 12;
    remDe[i] = q;
    // las cuatro esquinas del cuerpo y sus lados, en metros
    const c0 = [pos[o], pos[o + 2]], c1 = [pos[o + 3], pos[o + 5]], c2 = [pos[o + 6], pos[o + 8]], c3 = [pos[o + 9], pos[o + 11]];
    const W = Math.hypot(c3[0] - c0[0], c3[1] - c0[1]) || 1, L = Math.hypot(c1[0] - c0[0], c1[1] - c0[1]) || 1, uu = [(c3[0] - c0[0]) / W, (c3[1] - c0[1]) / W], vv = [(c1[0] - c0[0]) / L, (c1[1] - c0[1]) / L];
    /** un punto de adentro: a metros de c0 por el lado u y b por el lado v, a la altura y */
    const B = (a, bb, y) => { const s = a / W, tt = bb / L; return [(1 - s) * (1 - tt) * c0[0] + (1 - s) * tt * c1[0] + s * tt * c2[0] + s * (1 - tt) * c3[0], y, (1 - s) * (1 - tt) * c0[1] + (1 - s) * tt * c1[1] + s * tt * c2[1] + s * (1 - tt) * c3[1]]; };
    const techo = [seed, 30 + pisos, h, w], r1 = azar(s16 * 11 + 1), r2 = azar(s16 * 11 + 2), r3 = azar(s16 * 11 + 3), r4 = azar(s16 * 11 + 4);
    /** una caja apoyada en la azotea: centro (a, bb), lados la y lb, alto al; los muros de la clase `kind` */
    const caja = (a, bb, la, lb, al, kind) => {
      const x0 = a - la / 2, x1 = a + la / 2, y0 = bb - lb / 2, y1 = bb + lb / 2, m = [seed, kind * 10 + 1, al, w];
      const lado = (p, r, largo, fuera) => cara([[p[0], h, p[2]], [r[0], h, r[2]], [r[0], h + al, r[2]], [p[0], h + al, p[2]]], [fuera[0], 0, fuera[1]], [[0, 0], [largo, 0], [largo, al], [0, al]], [0, 0], m, e);
      lado(B(x0, y0, h), B(x0, y1, h), lb, [-uu[0], -uu[1]]); lado(B(x1, y0, h), B(x1, y1, h), lb, uu); lado(B(x0, y0, h), B(x1, y0, h), la, [-vv[0], -vv[1]]); lado(B(x0, y1, h), B(x1, y1, h), la, vv);
      cara([B(x0, y0, h + al), B(x0, y1, h + al), B(x1, y1, h + al), B(x1, y0, h + al)], ARR, [[0, 0], [0, lb], [la, lb], [la, 0]], [la, lb], techo, e);
    };
    let piso = h; // (a qué altura queda la azotea, para apoyar la cúpula)
    // el contorno con las ochavas (PL, en metros del cuerpo) y la pared en diagonal de cada una
    let PL = null;
    if (och[i]) {
      const C = [[0, 0], [0, L], [W, L], [W, 0]], da = (OCH * W) / (techos[k + 3] - techos[k + 1]), db = (OCH * L) / (techos[k + 4] - techos[k + 2]), mW = B(W / 2, L / 2, 0);
      const hacia = (p, r) => (r[0] !== p[0] ? [p[0] + Math.sign(r[0] - p[0]) * da, p[1]] : [p[0], p[1] + Math.sign(r[1] - p[1]) * db]);
      PL = [];
      for (let j = 0; j < 4; j++) {
        if (!(och[i] & (1 << j))) { PL.push(C[j]); continue; }
        const pa = hacia(C[j], C[(j + 3) % 4]), pb = hacia(C[j], C[(j + 1) % 4]), A = B(pa[0], pa[1], 0), Bb = B(pb[0], pb[1], 0), ld = Math.hypot(Bb[0] - A[0], Bb[2] - A[2]);
        PL.push(pa, pb);
        cara([A, Bb, [Bb[0], h, Bb[2]], [A[0], h, A[2]]], [(A[0] + Bb[0]) / 2 - mW[0], 0, (A[2] + Bb[2]) / 2 - mW[2]], [[0, 0], [ld, 0], [ld, h], [0, h]], [ld, 0], [seed, pisos, h, w], e);
      }
    }
    /** un techo de varios lados (convexo), en abanico: el primer paño va en el lugar del techo plano */
    const abanico = (pts, y, inf, corre, zw) => {
      const P3 = pts.map((p) => B(p[0], p[1], y)), U = pts.map((p) => [p[0] - corre, p[1] - corre]);
      cara([P3[0], P3[1], P3[2], P3[3]], ARR, [U[0], U[1], U[2], U[3]], zw, inf, e, i);
      for (let j = 4; j < pts.length; j++) cara([P3[0], P3[j - 1], P3[j], P3[j]], ARR, [U[0], U[j - 1], U[j], U[j]], zw, inf, e);
    };
    if (PL && (t & 7) !== 2) abanico(PL, h, techo, 0, [W, L]);
    if ((t & 7) === 1 || (t & 7) === 5) {
      // a dos aguas: la cumbrera por el medio, a lo largo; la primera falda va en el lugar del techo plano
      const lx = W >= L, al = Math.min(2.8, Math.max(0.45, (lx ? L : W) * 0.22)), y = h + al;
      if (lx) {
        const R0 = B(0, L / 2, y), R1 = B(W, L / 2, y);
        cara([[c0[0], h, c0[1]], R0, R1, [c3[0], h, c3[1]]], ARR, [[0, 0], [0, L / 2], [W, L / 2], [W, 0]], [W, L], techo, e, i);
        cara([R0, [c1[0], h, c1[1]], [c2[0], h, c2[1]], R1], ARR, [[0, L / 2], [0, L], [W, L], [W, L / 2]], [W, L], techo, e);
        const m = [seed, 21, 3 + al, w];
        cara([[c0[0], h, c0[1]], [c1[0], h, c1[1]], R0, R0], [-uu[0], 0, -uu[1]], [[0, 3], [L, 3], [L / 2, 3 + al], [L / 2, 3 + al]], [0, 0], m, e);
        cara([[c3[0], h, c3[1]], [c2[0], h, c2[1]], R1, R1], [uu[0], 0, uu[1]], [[0, 3], [L, 3], [L / 2, 3 + al], [L / 2, 3 + al]], [0, 0], m, e);
      } else {
        const R0 = B(W / 2, 0, y), R1 = B(W / 2, L, y);
        cara([[c0[0], h, c0[1]], [c1[0], h, c1[1]], R1, R0], ARR, [[0, 0], [0, L], [W / 2, L], [W / 2, 0]], [W, L], techo, e, i);
        cara([R0, R1, [c2[0], h, c2[1]], [c3[0], h, c3[1]]], ARR, [[W / 2, 0], [W / 2, L], [W, L], [W, 0]], [W, L], techo, e);
        const m = [seed, 21, 3 + al, w];
        cara([[c0[0], h, c0[1]], [c3[0], h, c3[1]], R0, R0], [-vv[0], 0, -vv[1]], [[0, 3], [W, 3], [W / 2, 3 + al], [W / 2, 3 + al]], [0, 0], m, e);
        cara([[c1[0], h, c1[1]], [c2[0], h, c2[1]], R1, R1], [vv[0], 0, vv[1]], [[0, 3], [W, 3], [W / 2, 3 + al], [W / 2, 3 + al]], [0, 0], m, e);
      }
    } else if ((t & 7) === 2 && PL) {
      // la mansarda de un cuerpo con ochava: un faldón por cada lado del contorno, y arriba el zinc
      const d = Math.min(1.3, Math.min(W, L) * 0.2), al = 2.3, y = h + al, n = PL.length, mW = B(W / 2, L / 2, 0);
      const I = PL.map((p, j) => {
        const a = PL[(j + n - 1) % n], c = PL[(j + 1) % n];
        const nrm = (p0, p1) => { const ex = p1[0] - p0[0], ey = p1[1] - p0[1], l = Math.hypot(ex, ey) || 1; let v = [-ey / l, ex / l]; if (v[0] * (W / 2 - (p0[0] + p1[0]) / 2) + v[1] * (L / 2 - (p0[1] + p1[1]) / 2) < 0) v = [-v[0], -v[1]]; return v; };
        const n1 = nrm(a, p), n2 = nrm(p, c), kq = d / (1 + n1[0] * n2[0] + n1[1] * n2[1]);
        return [p[0] + (n1[0] + n2[0]) * kq, p[1] + (n1[1] + n2[1]) * kq];
      });
      abanico(I, y, [seed, 30 + pisos, y, w], d, [W - 2 * d, L - 2 * d]);
      const piz = [seed, 80, y, w];
      for (let j = 0; j < n; j++) {
        const j1 = (j + 1) % n, A = B(PL[j][0], PL[j][1], h), A1 = B(PL[j1][0], PL[j1][1], h), largo = Math.hypot(A1[0] - A[0], A1[2] - A[2]);
        cara([A, A1, B(I[j1][0], I[j1][1], y), B(I[j][0], I[j][1], y)], [(A[0] + A1[0]) / 2 - mW[0], 0.6 * Math.hypot((A[0] + A1[0]) / 2 - mW[0], (A[2] + A1[2]) / 2 - mW[2]), (A[2] + A1[2]) / 2 - mW[2]], [[0, h], [largo, h], [largo - d, y], [d, y]], [0, 0], piz, e);
      }
      piso = y;
    } else if ((t & 7) === 2) {
      // la mansarda: cuatro faldones de pizarra y, arriba, el techo de zinc (en el lugar del techo plano)
      const d = Math.min(1.3, Math.min(W, L) * 0.2), al = 2.3, y = h + al, I = [B(d, d, y), B(d, L - d, y), B(W - d, L - d, y), B(W - d, d, y)], E = [[c0[0], h, c0[1]], [c1[0], h, c1[1]], [c2[0], h, c2[1]], [c3[0], h, c3[1]]];
      cara(I, ARR, [[0, 0], [0, L - 2 * d], [W - 2 * d, L - 2 * d], [W - 2 * d, 0]], [W - 2 * d, L - 2 * d], [seed, 30 + pisos, y, w], e, i);
      const F = [[-uu[0], -uu[1]], vv, uu, [-vv[0], -vv[1]]], piz = [seed, 80, y, w];
      for (let j = 0; j < 4; j++) { const j1 = (j + 1) % 4, largo = j % 2 ? W : L; cara([E[j], E[j1], I[j1], I[j]], [F[j][0], 0.6, F[j][1]], [[0, h], [largo, h], [largo - d, y], [d, y]], [0, 0], piz, e); }
      piso = y;
    } else if ((t & 7) === 3) caja(W * (0.5 + 0.3 * (r3 - 0.5)), L * (0.5 + 0.3 * (r4 - 0.5)), 2.6 + 0.8 * r1, 3.4 + 1.0 * r2, 2.5, 2);
    else if ((t & 7) === 4) { const l = 3.0 + 0.7 * r1; caja(W * (0.5 + 0.35 * (r3 - 0.5)), L * (0.5 + 0.35 * (r4 - 0.5)), l, l, 3.3, 0); }
    if ((t & 7) === 5) {
      // la chimenea de la fábrica: de ladrillo, ochavada y más fina arriba, con la boca negra
      const C = B(W * (0.25 + 0.5 * r3), L * (0.25 + 0.5 * r4), 0), al = 13 + 9 * r1, N = 8, lad = [seed, 90, al, w];
      const aro = (rad, y) => Array.from({ length: N }, (_, j) => { const an = (j / N) * Math.PI * 2 + Math.PI / N; return [C[0] + Math.cos(an) * rad, y, C[2] + Math.sin(an) * rad]; });
      const A0 = aro(1.15, h), A1 = aro(0.7, h + al);
      for (let j = 0; j < N; j++) { const j1 = (j + 1) % N; cara([A0[j], A0[j1], A1[j1], A1[j]], [(A0[j][0] + A0[j1][0]) / 2 - C[0], 0, (A0[j][2] + A0[j1][2]) / 2 - C[2]], [[0, 0], [0.9, 0], [0.9, al], [0, al]], [17, 0.42], lad, e); }
      cara([A1[0], A1[2], A1[4], A1[6]], ARR, [[0, 0], [1, 0], [1, 1], [0, 1]], [0, 0], [seed, 70, al, w], e);
    }
    if (t & 8) {
      // la cúpula de la esquina: un tambor de ocho lados y, encima, la media naranja de pizarra
      const u0 = techos[k + 1], v0 = techos[k + 2], R = 1.9, m = och[i] ? 3.6 : 2.4, cx = u0 <= 5 ? m : W - m, cy = v0 <= 5 ? m : L - m, C = B(cx, cy, 0), yb = h, alT = (piso - h) + 1.3, N = 8;
      const aro = (rad, y) => Array.from({ length: N }, (_, j) => { const an = (j / N) * Math.PI * 2 + Math.PI / N; return [C[0] + Math.cos(an) * rad, y, C[2] + Math.sin(an) * rad]; });
      const A0 = aro(R, yb), A1 = aro(R, yb + alT), lado = 2 * R * Math.sin(Math.PI / N);
      for (let j = 0; j < N; j++) { const j1 = (j + 1) % N, mx = (A0[j][0] + A0[j1][0]) / 2 - C[0], mzz = (A0[j][2] + A0[j1][2]) / 2 - C[2]; cara([A0[j], A0[j1], A1[j1], A1[j]], [mx, 0, mzz], [[0, 0], [lado, 0], [lado, alT], [0, alT]], [0, 0], [seed, 61, alT, w], e); }
      let ant = aro(R * 1.06, yb + alT);
      for (let f = 1; f <= 3; f++) {
        const an = (f / 3) * Math.PI / 2, sig = aro(Math.max(0.02, R * 1.06 * Math.cos(an)), yb + alT + 2.5 * Math.sin(an));
        for (let j = 0; j < N; j++) { const j1 = (j + 1) % N, mx = (ant[j][0] + ant[j1][0]) / 2 - C[0], mzz = (ant[j][2] + ant[j1][2]) / 2 - C[2]; cara([ant[j], ant[j1], sig[j1], sig[j]], [mx, 1.2, mzz], [[0, ant[j][1]], [lado, ant[j][1]], [lado, sig[j][1]], [0, sig[j][1]]], [0, 0], [seed, 80, yb + alT + 2.5, w], e); }
        ant = sig;
      }
    }
    remN[i] = q - remDe[i];
  }
  if (q !== nQ) console.warn(`remates: se contaron ${nQ - nB} y salieron ${q - nB}`);
  const g = new THREE.BufferGeometry(); g.userData.remates = { de: remDe, n: remN, cuantos: nX };
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('aWall', new THREE.BufferAttribute(uv, 4)); g.setAttribute('aInfo', new THREE.BufferAttribute(info, 4)); g.setAttribute('aEstilo', new THREE.BufferAttribute(est, 1));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeBoundingSphere();
  return { g, nT, nM, manzanas: dist.length };
}

export function createCiudad({ meta, mz, techos, muros, arboles }, tinta, otros = [], { liviano = false } = {}) {
  const { plaza, metro } = meta.plano, group = new THREE.Group();
  /** de píxeles del plano a metros del mundo */
  const mundo = (px, py) => [(px - plaza[0]) * metro, (py - plaza[1]) * metro];
  const { g, nT, nM, manzanas } = mallaCasas({ mz, techos, muros }, meta.plano);
  const casas = new THREE.Mesh(g, tinta.make({ manto: 3 }));
  casas.customDepthMaterial = tinta.depth(); casas.castShadow = casas.receiveShadow = true; casas.frustumCulled = false;
  trozar(casas); // (en trozos: lo que no se ve no se dibuja, src/trozos.js)
  soltar(casas.geometry, ['aInfo']); // (aInfo se vuelve a tocar: marcarMueren)
  group.add(casas);

  // --- los árboles: una copa por cada árbol dibujado en el plano ---
  // Son decenas de miles: van agrupados por zonas de 700 m, y cada zona usa una copa más o menos trabajada según
  // qué tan lejos esté de la cámara (y las zonas que no se ven no se dibujan).
  const nP = arboles.length / 3, nA = nP + otros.length;
  const COPAS = [copa(2, true, 1), copa(1, false, 0.35), copa(0, false, 0)], ZONA = 700, zonas = new Map(), matArbol = tinta.make(), profArbol = tinta.depth();
  // (el lector toma por árboles los puntos con que el plano dibuja las vías, y las que el plano no trae pasan a veces por
  // una arboleda: los árboles que caen sobre una vía de 1867 no van. Las de después los sacan con la lámina, src/tinta.js)
  const via = new Set(), casilla = (x, z) => (Math.floor(x / 4) + 8192) * 16384 + Math.floor(z / 4) + 8192;
  for (const l of LINEAS) { if (l.desde > 0) continue; const r = l.doble ? 8 : 6; for (let k = 0; k + 1 < l.pts.length; k++) { const [ax, az] = mundo(...l.pts[k]), [bx, bz] = mundo(...l.pts[k + 1]), n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 3)); for (let j = 0; j <= n; j++) { const x = ax + ((bx - ax) * j) / n, z = az + ((bz - az) * j) / n; for (let dx = -r; dx <= r; dx += 4) for (let dz = -r; dz <= r; dz += 4) via.add(casilla(x + dx, z + dz)); } } }
  const enLaVia = (x, z) => via.has(casilla(x, z));
  for (let i = 0; i < nA; i++) {
    const [x, z] = i < nP ? mundo(arboles[i * 3], arboles[i * 3 + 1]) : otros[i - nP], r = i < nP ? Math.min(7, Math.max(2.2, arboles[i * 3 + 2] * metro * 1.15)) : otros[i - nP][2];
    if (i < nP && enLaVia(x, z)) continue;
    const key = Math.floor(x / ZONA) + ',' + Math.floor(z / ZONA); let zo = zonas.get(key); if (!zo) zonas.set(key, (zo = []));
    // (los que trae la línea de tiempo —los de las plazas nuevas, src/hitos.js— llevan su etapa: desde + 8 · hasta)
    zo.push(x, z, r, Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1, i < nP ? 0 : (otros[i - nP][3] || 0) + 8 * (otros[i - nP][4] || 0));
  }
  const copas = [], M = new THREE.Matrix4();
  for (const zo of zonas.values()) {
    const n = zo.length / 5, ai = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
    const geos = COPAS.map((c) => { const g = new THREE.BufferGeometry(); g.setIndex(c.index); g.setAttribute('position', c.attributes.position); g.setAttribute('normal', c.attributes.normal); g.setAttribute('aInfo', ai); return g; });
    const inst = new THREE.InstancedMesh(geos[2], matArbol, n); let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (let i = 0; i < n; i++) {
      const x = zo[i * 5], z = zo[i * 5 + 1], r = zo[i * 5 + 2], s = zo[i * 5 + 3], et = zo[i * 5 + 4];
      // (51: plantado después. A esos la lámina de lo despejado no los saca —src/tinta.js—: están en una plaza nueva)
      M.makeScale(r, r * (1.05 + s * 0.6), r).setPosition(x, 0, z); inst.setMatrixAt(i, M); ai.setXYZW(i, s, et ? 51 : 50, 0, Math.hypot(x, z) + et * 20000);
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
    }
    inst.boundingSphere = new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, 8, (z0 + z1) / 2), Math.hypot(x1 - x0, z1 - z0) / 2 + 26);
    inst.customDepthMaterial = profArbol; inst.castShadow = true; inst.receiveShadow = false;
    group.add(inst); copas.push({ inst, geos });
  }
  /** Elige el detalle de cada zona de árboles según la distancia a la cámara. (En un teléfono, la copa trabajada y la
   *  mediana llegan hasta la mitad de lejos: en su pantalla un árbol a 500 m son unos pocos puntos.) */
  const FINA = liviano ? 450 : 900, MEDIA = liviano ? 1500 : 2800;
  const detalle = (pos) => { for (const { inst, geos } of copas) { const d = pos.distanceTo(inst.boundingSphere.center) - inst.boundingSphere.radius, g = geos[d < FINA ? 0 : d < MEDIA ? 1 : 2]; if (inst.geometry !== g) inst.geometry = g; } };
  return { group, casas, detalle, mundo, cuenta: { techos: nT, muros: nM, arboles: nA, manzanas } };
}

/** Las casas que se suman con los años: una malla como la de 1867, que nace sola al avanzar la línea de tiempo. */
export function createCrece(d, meta, tinta) {
  const { g, nT, nM, manzanas } = mallaCasas(d, meta.plano, true);
  const mesh = new THREE.Mesh(g, tinta.make({ manto: 3 }));
  mesh.customDepthMaterial = tinta.depth(); mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false;
  trozar(mesh); soltar(mesh.geometry);
  return { mesh, cuenta: { techos: nT, muros: nM, manzanas } };
}
/** Anota en la malla de 1867 lo que se demuele con los años: mueT y mueM son pares (registro, etapa) de sus techos y de
 *  sus muros, en el orden de la malla. */
export function marcarMueren(casas, { techos }, { mueT, mueM }) {
  if (casas.userData.mueren || !(mueT?.length || mueM?.length)) return;
  const a = casas.geometry.attributes.aInfo, nT = techos.length / 8;
  const marcar = (q, e) => { for (let v = 0; v < 4; v++) a.array[(q * 4 + v) * 4 + 3] += 8 * e * 20000; };
  const R = casas.geometry.userData.remates;
  for (let i = 0; i < mueT.length; i += 2) { marcar(mueT[i], mueT[i + 1]); if (R) for (let j = 0; j < R.n[mueT[i]]; j++) marcar(R.de[mueT[i]] + j, mueT[i + 1]); }
  for (let i = 0; i < mueM.length; i += 2) marcar(nT + mueM[i], mueM[i + 1]);
  a.needsUpdate = true; casas.userData.mueren = true;
}
