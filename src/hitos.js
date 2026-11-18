// Los edificios que no son una casa más. El plano dice dónde están y qué lugar ocupan; cómo eran sale de la vista a
// vuelo de pájaro de Dulin (fuentes/dulin.jpg) y de lo que se sabe de cada uno. Están hechos con pocas piezas, como
// los dibujaría un litógrafo de lejos: el volumen, el techo, las torres, los arcos.
//   - las iglesias: una por cada cruz negra del plano, con la nave del largo y el ancho que el plano le da;
//   - alrededor de la plaza: la Pirámide, la Recova Vieja, el Cabildo, la Catedral, el Teatro Colón, la Casa de
//     Gobierno, la Aduana Nueva con su muelle, el muelle de pasajeros y la Estación Central;
//   - más lejos, los que tienen foto de esos años (fuentes/fotos/): la Estación del Norte, la Fábrica de gas y los
//     depósitos del Ferrocarril del Oeste en el Once.
//   - y los que trae la línea de tiempo, cada uno en su año: Constitución (1887), el Palacio de Aguas Corrientes (1894),
//     la Casa Rosada (1898), la estación del Once (1898), el Congreso (1906), el Teatro Colón (1908), Tribunales (1910),
//     Retiro (1915), el Barolo (1923), el Correo Central (1928), el Kavanagh y el Obelisco (1936). Su lugar y su tamaño
//     salen del mapa de hoy (src/edificios.js, de tools/edificios.mjs); la forma es un boceto.
//   - y los lugares armados con más detalle, cada uno en su archivo de src/lugares/: la Plaza de Mayo de cada año, la
//     Plaza del Congreso, la 9 de Julio, el puerto y la Costanera, el Teatro Colón de 1908 y los seis edificios del
//     cruce de Florida y la Diagonal Norte (el Banco de Boston, La Equitativa, los dos Bencich, el Argentino Uruguayo
//     y La Continental).
// Las medidas están en metros; los lugares, en píxeles del plano (los mismos de tools/plano.mjs).
import * as THREE from 'three';
import { trozar, soltar } from './trozos.js';
import { EDIFICIOS } from './edificios.js';
import nueveDeJulio from './lugares/nueve-de-julio.js';
import plazaCongreso from './lugares/plaza-congreso.js';
import plazaDeMayo from './lugares/plaza-de-mayo.js';
import puerto from './lugares/puerto.js';
import puertoMadero from './lugares/puerto-madero.js';
import diagonalNorte from './lugares/diagonal-norte.js';
import teatroColon from './lugares/teatro-colon.js';
import puertoNuevo from './lugares/puerto-nuevo.js';
import playasRetiro from './lugares/playas-retiro.js';
import palermo from './lugares/palermo.js';
import barrios from './lugares/barrios.js';
import cabildo from './lugares/cabildo.js';
import casaRosada from './lugares/casa-rosada.js';
import subteA from './lugares/subte-a.js';
import avenidaDeMayo from './lugares/avenida-de-mayo.js';
import retiro from './lugares/retiro.js';
import modernos from './lugares/modernos.js';
import viejos1867 from './lugares/viejos-1867.js';
import plazaSanMartin from './lugares/plaza-san-martin.js';
import plazaLavalle from './lugares/plaza-lavalle.js';
import plazaConstitucion from './lugares/plaza-constitucion.js';
import plazaOnce from './lugares/plaza-once.js';
import plazaBritanica from './lugares/plaza-britanica.js';
import { AÑOS } from './etapas.js';
import obelisco1940 from './lugares/obelisco-1940.js';
import plazaColon from './lugares/plaza-colon.js';
import obras1950 from './lugares/obras-1950.js';

const PIEDRA = 6, TINTA = 7, PIZARRA = 8, CASA = 0, FOLLAJE = 5, PINTADO = 9;
// Los lugares hechos a mano, cada uno en su archivo (src/lugares/LEEME.md cuenta con qué se construyen).
const LUGARES = { nueveDeJulio, plazaCongreso, plazaDeMayo, puerto, puertoMadero, diagonalNorte, teatroColon, puertoNuevo, cabildo, casaRosada, subteA, avenidaDeMayo, retiro, modernos, viejos1867, plazaSanMartin, plazaLavalle, plazaConstitucion, plazaOnce, plazaBritanica, obelisco1940, playasRetiro, palermo, barrios, plazaColon, obras1950 }; // (playasRetiro va al final: cada pieza que se agrega le corre la tirada de colores a las que siguen)
/** De qué va pintado lo PINTADO (el número va en aWall.z; los colores están en src/tinta.js). */
export const PINTA = { MADERA: 0, VERDE: 1, BRONCE: 2, ROJO: 3, OCRE: 4, LONA: 5, BALASTO: 6, CESPED: 7, AGUA: 8, BALDOSA: 9, GRANZA: 10, ADOQUIN: 11, FLORES: 12, ASFALTO: 13, CHAPA: 14, NEGRO: 15, BLANCO: 16, LADRILLO: 17, PATINA: 18, COBRE: 19 };
/** De dónde a dónde van los puntos de cada lugar en la malla, en la de lo que va a ras del suelo y en la lista de
 *  árboles: [malla0, raso0, árbol0, malla1, raso1, árbol1]. Lo llena createHitos; lo lee tools/revisar-lugar.mjs. */
export const TRAMOS = {};

/** Parte los triángulos de una malla (sin índice) hasta que ningún lado pase de `max` metros: lo que va a ras del
 *  suelo se apoya en el terreno punto por punto, y un paño grande de pocos triángulos lo cortaría. */
function fino(g0, max = 14) {
  const g = g0.index ? g0.toNonIndexed() : g0, p = g.attributes.position; let T = [];
  for (let i = 0; i < p.count; i += 3) T.push([[p.getX(i), p.getY(i), p.getZ(i)], [p.getX(i + 1), p.getY(i + 1), p.getZ(i + 1)], [p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2)]]);
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[2] - b[2]) ** 2, medio = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  for (let vuelta = 0; vuelta < 12; vuelta++) {
    const o = []; let partio = false;
    for (const [a, b, c] of T) {
      const ab = d2(a, b), bc = d2(b, c), ca = d2(c, a), mx = Math.max(ab, bc, ca);
      if (mx <= max * max) { o.push([a, b, c]); continue; }
      partio = true;
      if (mx === ab) { const m = medio(a, b); o.push([a, m, c], [m, b, c]); } else if (mx === bc) { const m = medio(b, c); o.push([a, b, m], [a, m, c]); } else { const m = medio(c, a); o.push([a, b, m], [m, b, c]); }
    }
    T = o; if (!partio) break;
  }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(T.flat(2), 3)); out.computeVertexNormals();
  return out;
}
/** Un polígono [x, z] corrido `d` metros hacia adentro (sirve para los simples: rectángulos, óvalos, canteros). */
function adentro(pts, d) {
  let area = 0; const n = pts.length; for (let i = 0; i < n; i++) { const [x0, z0] = pts[i], [x1, z1] = pts[(i + 1) % n]; area += x0 * z1 - x1 * z0; }
  const s = area > 0 ? 1 : -1, out = [];
  for (let i = 0; i < n; i++) {
    const a = pts[(i + n - 1) % n], b = pts[i], c = pts[(i + 1) % n];
    const u = [b[0] - a[0], b[1] - a[1]], v = [c[0] - b[0], c[1] - b[1]], lu = Math.hypot(...u) || 1, lv = Math.hypot(...v) || 1;
    const n1 = [-u[1] / lu * s, u[0] / lu * s], n2 = [-v[1] / lv * s, v[0] / lv * s], bx = n1[0] + n2[0], bz = n1[1] + n2[1], k = d / Math.max(0.35, 1 + n1[0] * n2[0] + n1[1] * n2[1]);
    out.push([b[0] + bx * k, b[1] + bz * k]);
  }
  return out;
}

export function createHitos({ meta, mz }, tinta) {
  const { plaza, metro } = meta.plano;
  const mundo = (px, py) => [(px - plaza[0]) * metro, (py - plaza[1]) * metro];
  const P = [], N = [], I = [], Wl = [], An = [], arboles = [];
  const RASO = { P: [], N: [], I: [], Wl: [] }; // (lo que va a ras del suelo: canteros, senderos, fuentes. Va en otra malla, que no hace sombra ni se choca)
  let seed = 0.137;
  // (la línea de tiempo, src/epocas.js: con hasta > 0, lo que se agregue desaparece al llegar esa etapa; con desde > 0,
  // recién aparece en esa etapa. Las etapas: 1 es 1888, 2 es 1895, 3 es 1905, 4 es 1910, 5 es 1921, 6 es 1940 y 7 es 1950
  // (src/etapas.js). Ver
  // alzado(), en src/tinta.js)
  let hasta = 0, desde = 0;
  /** Agrega una pieza (ya en su lugar del mundo). */
  const add = (g, kind, { floors = 1, H = 0, dist, ancla = null, tono = null, pinta = null, raso = false }) => {
    const n = g.index ? g.toNonIndexed() : g, p = n.attributes.position, nn = n.attributes.normal;
    seed = (seed * 7.31 + 0.173) % 1;
    // (con tono, el color de la pared no sale al azar: va en la parte entera de la semilla, ver tonoDe() en src/tinta.js)
    const sem = tono == null ? seed : 2 + tono + seed * 0.9;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), nx = nn.getX(i), nz = nn.getZ(i);
      // (lo de arriba de un cuerpo es su azotea: lleva el plano, como las de las casas. Los muelles y los pedestales, no.)
      const azotea = (kind === CASA || kind === PIEDRA) && nn.getY(i) > 0.9 && y >= 5;
      // (a ras del suelo: cada punto se apoya en el terreno por su cuenta, sin ancla; lleva la distancia de ese punto)
      if (raso) { RASO.P.push(x, y, z); RASO.N.push(nx, nn.getY(i), nz); RASO.I.push(sem, kind * 10 + 1, H, Math.hypot(x, z) + (desde + 8 * hasta) * 20000); RASO.Wl.push(x * nz - z * nx + 500, y, pinta ? pinta[0] : 0, pinta ? pinta[1] : 0); continue; }
      P.push(x, y, z); N.push(nx, nn.getY(i), nz); I.push(sem, azotea ? 30 + floors : kind * 10 + floors, H, dist + (desde + 8 * hasta) * 20000);
      // (el ancla: el origen del lugar. Todo el edificio se apoya en el terreno a esa altura, src/tinta.js)
      if (ancla) An.push(ancla[0], ancla[1], 1); else An.push(0, 0, 0);
      if (azotea) Wl.push(500, 500, 1000, 1000); else Wl.push(x * nz - z * nx + 500, y, pinta ? pinta[0] : 0, pinta ? pinta[1] : 0);
    }
  };
  /** Un lugar: origen en un punto del plano, x hacia donde apunta (ux, uy) y z a su derecha. Devuelve las herramientas para construir ahí. */
  const lugar = (px, py, ux = Math.cos(GRILLA), uy = Math.sin(GRILLA)) => {
    const [ox, oz] = mundo(px, py), M = new THREE.Matrix4().makeBasis(new THREE.Vector3(ux, 0, uy), new THREE.Vector3(0, 1, 0), new THREE.Vector3(-uy, 0, ux)).setPosition(ox, 0, oz), dist = Math.hypot(ox, oz);
    const put = (g, kind, o = {}) => { g.applyMatrix4(M); add(g, kind, { ...o, dist, ancla: [ox, oz] }); };
    const T = {
      /** caja de w (x) × h × d (z), apoyada en y, centrada en (x, z) */
      caja: (w, h, d, x = 0, y = 0, z = 0, kind = PIEDRA, o) => put(new THREE.BoxGeometry(w, h, d).translate(x, y + h / 2, z), kind, { H: y + h, ...o }),
      /** techo a dos aguas: la cumbrera a lo largo de x si along = 'x'. Con curvo, una bóveda (o un frontis curvo) */
      tejado: (w, d, h, x, y, z, along = 'x', kind = PIZARRA, curvo = false) => {
        const s = new THREE.Shape(); const half = (along === 'x' ? d : w) / 2; s.moveTo(-half, 0); s.lineTo(half, 0); if (curvo) s.absellipse(0, 0, half, h, 0, Math.PI, false); else s.lineTo(0, h); s.closePath();
        const len = along === 'x' ? w : d, g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false }).translate(0, 0, -len / 2);
        if (along === 'x') g.rotateY(Math.PI / 2);
        put(g.translate(x, y, z), kind);
      },
      cilindro: (r, h, x, y, z, kind = PIEDRA, segs = 14, r2 = r, o) => put(new THREE.CylinderGeometry(r2, r, h, segs).translate(x, y + h / 2, z), kind, { H: y + h, ...o }),
      cupula: (r, x, y, z, alto = 1, kind = PIZARRA, o) => put(new THREE.SphereGeometry(r, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, alto, 1).translate(x, y, z), kind, o),
      piramide: (r, h, x, y, z, kind = PIZARRA, segs = 4, o) => put(new THREE.ConeGeometry(r, h, segs).rotateY(Math.PI / 4).translate(x, y + h / 2, z), kind, o),
      /** un vano con arco, pintado de tinta sobre una pared. cara: hacia dónde mira ('+x', '-x', '+z', '-z') */
      vano: (w, h, x, y, z, cara, arco = true) => {
        const s = new THREE.Shape(), r = w / 2, hh = arco ? Math.max(0.1, h - r) : h;
        s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, hh); if (arco) s.absarc(0, hh, r, 0, Math.PI, false); else s.lineTo(-r, hh); s.closePath();
        const g = new THREE.ShapeGeometry(s, 5);
        g.rotateY({ '+z': 0, '-z': Math.PI, '+x': Math.PI / 2, '-x': -Math.PI / 2 }[cara]);
        put(g.translate(x, y, z), TINTA);
      },
      /** una fila de vanos sobre una pared, de a..b a lo largo */
      fila: (n, a, b, w, h, y, fijo, cara, arco = true) => { for (let i = 0; i < n; i++) { const t = a + ((i + 0.5) / n) * (b - a); if (cara.endsWith('z')) T.vano(w, h, t, y, fijo, cara, arco); else T.vano(w, h, fijo, y, t, cara, arco); } },
      /** techo a cuatro aguas sobre un rectángulo de w (x) × d (z) */
      cuatroAguas: (w, d, h, x, y, z, kind = PIZARRA) => {
        const r = Math.max(0, (w - d) / 2), A = [-w / 2, 0, -d / 2], B = [w / 2, 0, -d / 2], C = [w / 2, 0, d / 2], D = [-w / 2, 0, d / 2], R1 = [-r, h, 0], R2 = [r, h, 0];
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([D, C, R2, D, R2, R1, B, A, R1, B, R1, R2, A, D, R1, C, B, R2].flat(), 3)); g.computeVertexNormals();
        put(g.translate(x, y, z), kind);
      },
      /** un muro de w × h y d de espesor con un arco abierto en el medio, por el que se pasa (el paso corre a lo largo de z) */
      portada: (w, h, d, aw, ah, x, y, z, kind = PIEDRA) => {
        const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(-aw / 2, 0); s.lineTo(-aw / 2, ah - aw / 2); s.absarc(0, ah - aw / 2, aw / 2, Math.PI, 0, true); s.lineTo(aw / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();
        put(new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 10 }).translate(x, y, z - d / 2), kind, { H: y + h });
      },
      /** una hilera de pilarcitos (los del pretil de una azotea) de (x0, z0) a (x1, z1) */
      pilares: (n, x0, z0, x1, z1, y, s = 0.5, h = 1) => { for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); T.caja(s, h, s, x0 + (x1 - x0) * t, y, z0 + (z1 - z0) * t); } },
      /** un prisma: la planta que digan los puntos [x, z], levantada h desde y */
      prisma: (pts, h, y = 0, kind = PIEDRA, o) => { const s = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z))); put(new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, y, 0), kind, { H: y + h, ...o }); },
      /** una mansarda: un techo de pizarra de w × d que sube h metiéndose `mete` por cada lado */
      mansarda: (w, d, h, x, y, z, mete = 3, kind = PIZARRA) => {
        const g = new THREE.BoxGeometry(w, h, d), p = g.attributes.position, fx = Math.max(0.04, 1 - (2 * mete) / w), fz = Math.max(0.04, 1 - (2 * mete) / d);
        for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) p.setXYZ(i, p.getX(i) * fx, p.getY(i), p.getZ(i) * fz);
        g.computeVertexNormals(); put(g.translate(x, y + h / 2, z), kind);
      },
      /** un árbol como los del plano (la copa de src/ciudad.js), de radio r: nace y se va con la etapa en curso */
      arbol: (x, z, r = 3.2) => { const v = new THREE.Vector3(x, 0, z).applyMatrix4(M); arboles.push([v.x, v.z, r, desde, hasta]); },
      /** un paño a ras del suelo (sigue el terreno): la planta que digan los puntos [x, z], a `y` metros del suelo,
       *  pintado de `tono` (PINTA.CESPED, AGUA, BALDOSA, GRANZA, ADOQUIN…); `claro`: qué tan claro sale en tinta (0…1) */
      tapete: (pts, tono, { y = 0.1, claro = 0.82 } = {}) => {
        const g = fino(new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)))).rotateX(-Math.PI / 2).translate(0, y, 0)); g.applyMatrix4(M);
        add(g, PINTADO, { dist, pinta: [tono, claro], raso: true });
      },
      /** un cantero: el cordón de piedra (de `cordon` metros de ancho y `alto` de alto) y adentro el césped, o lo que diga `tono` */
      cantero: (pts, { alto = 0.28, tono = PINTA.CESPED, cordon = 0.45, claro = 0.74 } = {}) => {
        const g = fino(new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z))), { depth: alto, bevelEnabled: false }).rotateX(-Math.PI / 2)); g.applyMatrix4(M);
        add(g, PIEDRA, { dist, raso: true });
        T.tapete(cordon > 0 ? adentro(pts, cordon) : pts, tono, { y: alto + 0.07, claro });
      },
      /** los puntos de un óvalo (o un círculo) de radios rx, rz con centro en (x, z) */
      ovalo: (x, z, rx, rz = rx, n = 28) => Array.from({ length: n }, (_, i) => [x + Math.cos((i / n) * Math.PI * 2) * rx, z + Math.sin((i / n) * Math.PI * 2) * rz]),
      /** los puntos de un rectángulo de w × d con centro en (x, z); con r > 0, de puntas redondeadas */
      recto: (w, d, x = 0, z = 0, r = 0) => {
        if (r <= 0) return [[x - w / 2, z - d / 2], [x + w / 2, z - d / 2], [x + w / 2, z + d / 2], [x - w / 2, z + d / 2]];
        const out = []; r = Math.min(r, w / 2, d / 2);
        for (const [sx, sz, a0] of [[1, -1, -Math.PI / 2], [1, 1, 0], [-1, 1, Math.PI / 2], [-1, -1, Math.PI]]) for (let i = 0; i <= 6; i++) { const a = a0 + (i / 6) * Math.PI / 2; out.push([x + sx * (w / 2 - r) + Math.cos(a) * r, z + sz * (d / 2 - r) + Math.sin(a) * r]); }
        return out;
      },
      /** de un punto del lugar (x, z, en metros) a píxeles del plano y al revés: para ubicarse con las esquinas */
      aPlano: (x, z) => { const v = new THREE.Vector3(x, 0, z).applyMatrix4(M); return [v.x / metro + plaza[0], v.z / metro + plaza[1]]; },
      deMundo: (px, py) => { const [wx, wz] = mundo(px, py), v = new THREE.Vector3(wx, 0, wz).applyMatrix4(M.clone().invert()); return [v.x, v.z]; },
      put,
    };
    return T;
  };

  // la grilla de la ciudad no está derecha con el papel: se toma el ángulo de la manzana más cercana a la plaza
  let GRILLA = 0;
  { let best = Infinity; for (let b = 0; b < mz.length / 10; b++) { const k = b * 10, cx = (mz[k] + mz[k + 4]) / 2, cy = (mz[k + 1] + mz[k + 5]) / 2, d = Math.hypot(cx - plaza[0], cy - plaza[1] + 260); if (mz[k + 8] > 90 && mz[k + 9] > 90 && d < best) { best = d; GRILLA = Math.atan2(mz[k + 3] - mz[k + 1], mz[k + 2] - mz[k]); } } }
  const m = (px) => px * metro; // de píxeles del plano a metros

  // ---------------------------------------------------------------------------------------------------- las iglesias
  // (x, y del plano → nombre y rasgos. Las que no están en la lista salen con una torre.)
  const CONOCIDAS = [
    [10497, 9445, 'catedral'], [10024, 9312, 'San Ignacio', 2, 1], [9952, 9591, 'San Francisco', 2, 1], [9575, 9585, 'Santo Domingo', 2, 1],
    [10840, 9659, 'La Merced', 1, 1], [11216, 8411, 'San Nicolás', 1, 0], [12837, 8742, 'El Socorro', 2, 0], [9986, 8777, 'San Juan', 1, 0],
    [9740, 8119, 'Monserrat', 2, 1], [10546, 7472, 'La Piedad', 2, 1], [8840, 8562, 'La Concepción', 2, 1], [8261, 9651, 'San Telmo', 2, 1],
    [14034, 7200, 'El Pilar', 1, 0],
  ];
  // Lo que las fotos muestran de cada una (el frente se mira desde afuera: izquierda y derecha son las de quien llega).
  //   La Merced (Witcomb, 1877): la torre a la izquierda, con el remate de ocho lados y su chapitel, y el frontis curvo.
  //   El Socorro (Witcomb, c. 1880): un frente ancho y chato, dos torres bajas de ocho lados y un pórtico de cuatro
  //     columnas con tres puertas.
  //   El Pilar (Gonnet, 1864): la torre a la izquierda con su chapitel acampanado, y a la derecha la espadaña de dos arcos.
  //   San Nicolás (Witcomb, década de 1890): una sola torre alta, en el medio del frente, sobre tres puertas y un óculo.
  const RASGOS = {
    'La Merced': { lado: -1, ocho: 1, chapitel: 5.5, curvo: 1, puerta: 1.5 },
    'El Socorro': { ocho: 1, baja: 1, portico: 1, chata: 0.72 },
    'El Pilar': { lado: -1, bulbo: 1, espadana: 1 },
    'San Nicolás': { lado: 0, alta: 1, chapitel: 6.5, puertas: 1 },
  };
  const iglesias = [];
  for (const g of meta.iglesias) {
    const hit = CONOCIDAS.find((c) => Math.hypot(c[0] - g.x, c[1] - g.y) < 70), L = m(g.largo), W = m(g.ancho), f = g.frente || 1;
    // el frente mira hacia −x del lugar
    const T = lugar(g.x, g.y, -g.ux * f, -g.uy * f), nombre = hit?.[2] ?? 'iglesia', R = RASGOS[nombre] ?? {}, hN = Math.min(19, 7 + W * 0.42) * (R.chata ?? 1);
    iglesias.push({ nombre, x: g.x, y: g.y, alto: hN * 1.75 });
    hasta = nombre === 'San Nicolás' ? 6 : 0; // (demolida en 1931 para abrir la Diagonal Norte y la 9 de Julio: en su lugar está el Obelisco)
    if (nombre === 'catedral') {
      // la Catedral: sin torres, con el pórtico de doce columnas que mira a la plaza y la cúpula sobre el crucero
      T.caja(L - 9, hN, W, 4.5, 0, 0); T.tejado(L - 9, W, 5, 4.5, hN, 0, 'x');
      T.caja(7, hN - 2.5, W, -L / 2 + 3.5, 0, 0);
      for (let i = 0; i < 12; i++) T.cilindro(0.85, hN - 4, -L / 2 - 2.6, 0.6, -W / 2 + 2 + (i * (W - 4)) / 11, PIEDRA, 8);
      T.caja(6.5, 0.6, W, -L / 2 - 1, 0, 0); T.caja(7.5, 2.2, W + 0.8, -L / 2 - 0.6, hN - 3.4, 0);
      T.tejado(7.5, W + 0.8, 5.5, -L / 2 - 0.6, hN - 1.2, 0, 'x', PIEDRA);
      T.fila(3, -W * 0.3, W * 0.3, 2.6, 6.5, 0.8, -L / 2 - 0.05, '-x');
      T.cilindro(W * 0.2, 7, L * 0.18, hN + 2, 0, PIEDRA, 16); T.cupula(W * 0.215, L * 0.18, hN + 9, 0, 1.08); T.cilindro(1.1, 3.4, L * 0.18, hN + 9 + W * 0.215 * 1.02, 0, PIEDRA, 8); T.cupula(1.2, L * 0.18, hN + 12.2 + W * 0.215 * 1.02, 0, 1.2);
      T.fila(6, -L * 0.2, L * 0.42, 1.6, 4.2, hN * 0.45, W / 2 + 0.05, '+z'); T.fila(6, -L * 0.2, L * 0.42, 1.6, 4.2, hN * 0.45, -W / 2 - 0.05, '-z');
      continue;
    }
    const torres = hit?.[3] ?? (W > 17 ? 2 : 1), cupula = hit?.[4] ?? (L > 42 ? 1 : 0), tw = Math.min(7.5, Math.max(4.2, W * 0.27)), hT = hN * (torres ? (R.baja ? 1.5 : R.alta ? 2.05 : 1.75) : 1);
    T.caja(L, hN, W - (torres ? 0.6 : 0), 0, 0, 0); T.tejado(L, W - (torres ? 0.6 : 0), W * 0.2 + 1.5, 0, hN, 0, 'x');
    // la fachada: un cuerpo un poco más alto, con frontis y la puerta
    T.caja(2.2, hN + 2, W - (torres ? tw * 2 - 1 : 0), -L / 2 + 0.2, 0, 0); T.tejado(2.2, W - (torres ? tw * 2 - 1 : 0), R.curvo ? 4.2 : 3, -L / 2 + 0.2, hN + 2, 0, 'x', PIEDRA, !!R.curvo);
    const xv = -L / 2 - 0.95, pw = Math.min(3.6, W * 0.16) * (R.puerta ?? 1), ph = Math.min(7, hN * 0.5) * (R.puerta ? 1.15 : 1);
    if (R.portico) {
      // el pórtico: cuatro columnas, el entablamento y el frontis, delante de las tres puertas
      const pz = W - tw * 2 - 0.4, hc = hN - 2.4;
      for (let i = 0; i < 4; i++) T.cilindro(0.6, hc, xv - 1.3, 0.5, -pz / 2 + 0.9 + (i * (pz - 1.8)) / 3, PIEDRA, 8);
      T.caja(3.4, 0.5, pz, xv - 0.7, 0, 0); T.caja(3, 1.3, pz, xv - 0.6, hc + 0.5, 0); T.tejado(3, pz, 2.6, xv - 0.6, hc + 1.8, 0, 'x', PIEDRA);
      T.fila(3, -pz / 2 + 0.6, pz / 2 - 0.6, 2.4, hN * 0.42, 0.5, xv, '-x', false);
    } else if (R.puertas) { T.fila(3, -W * 0.34, W * 0.34, 2, hN * 0.36, 0, xv, '-x'); T.vano(2.2, 2.2, xv, hN * 0.62, 0, '-x'); }
    else { T.vano(pw, ph, xv, 0, 0, '-x'); T.vano(1.8, 1.8, xv, hN * 0.68, 0, '-x'); }
    if (R.espadana) {
      // la espadaña: un muro delgado con dos arcos para las campanas, sobre la esquina que no tiene torre
      const ze = -(R.lado ?? 1) * (W / 2 - 2.6), xe = -L / 2 + 0.3;
      T.caja(1.1, 5.4, 5, xe, hN, ze); T.tejado(1.1, 5, 1.5, xe, hN + 5.4, ze, 'x', PIEDRA);
      for (const s of [-1, 1]) for (const c of ['-x', '+x']) T.vano(1.3, 3.3, xe + (c === '-x' ? -0.6 : 0.6), hN + 1.2, ze + s * 1.2, c);
    }
    for (let t = 0; t < torres; t++) {
      const z = torres === 1 ? (R.lado ?? 1) * (W / 2 - tw / 2) : (t ? 1 : -1) * (W / 2 - tw / 2), x = -L / 2 + tw / 2 - 0.4, ta = tw - 0.9;
      T.caja(tw, hT - 4, tw, x, 0, z); T.caja(tw + 0.7, 0.6, tw + 0.7, x, hN + 1.5, z);
      if (R.ocho) { T.caja(tw + 0.5, 0.5, tw + 0.5, x, hT - 4, z); T.cilindro(ta * 0.56, 4.5, x, hT - 4, z, PIEDRA, 8); } else T.caja(ta, 4.5, ta, x, hT - 4, z);
      if (R.alta) for (const c of ['-x', '-z', '+z']) T.vano(1.3, 3.2, x + (c === '-x' ? -tw / 2 - 0.05 : 0), hT - 9.5, z + (c === '-z' ? -tw / 2 - 0.05 : c === '+z' ? tw / 2 + 0.05 : 0), c);
      const cv = R.ocho ? ta * 0.56 * 0.93 + 0.05 : ta / 2 + 0.05;
      for (const c of ['-x', '+x', '-z', '+z']) T.vano(1.3, 3.2, x + (c === '-x' ? -cv : c === '+x' ? cv : 0), hT - 3.6, z + (c === '-z' ? -cv : c === '+z' ? cv : 0), c);
      if (R.chapitel) { T.cilindro(ta * 0.6, 0.5, x, hT + 0.5, z, PIEDRA, 8); T.piramide(ta * 0.52, R.chapitel, x, hT + 1, z, PIZARRA, 8); T.cilindro(0.18, 2.2, x, hT + 0.6 + R.chapitel, z, TINTA, 5); }
      else if (R.bulbo) { T.cupula(ta * 0.56, x, hT + 0.5, z, 1.1); T.cilindro(ta * 0.24, 2.6, x, hT + 0.5 + ta * 0.56, z, PIZARRA, 8, ta * 0.1); T.cilindro(0.18, 2.6, x, hT + 2.8 + ta * 0.56, z, TINTA, 5); }
      else { T.cupula(ta * 0.56, x, hT + 0.5, z, 1.25); T.cilindro(0.18, 2.6, x, hT + 0.5 + ta * 0.68, z, TINTA, 5); }
    }
    if (cupula) { const r = W * 0.3, x = L * 0.2; T.cilindro(r, 4.5, x, hN + 1.2, 0, PIEDRA, 16); T.cupula(r * 1.04, x, hN + 5.7, 0, 1.05); T.cilindro(0.9, 2.4, x, hN + 5.7 + r * 1.06, 0, PIEDRA, 8); T.cupula(1, x, hN + 8.1 + r * 1.06, 0, 1.3); }
    const nv = Math.max(3, Math.round(L / 8));
    T.fila(nv, -L / 2 + 6, L / 2 - 2, 1.3, 3.6, hN * 0.5, W / 2 - (torres ? 0.3 : 0) + 0.05, '+z'); T.fila(nv, -L / 2 + 6, L / 2 - 2, 1.3, 3.6, hN * 0.5, -W / 2 + (torres ? 0.3 : 0) - 0.05, '-z');
  }
  hasta = 0;

  // ------------------------------------------------------------------------------------------- alrededor de la plaza
  // Los lugares salen del plano (ver el recorte del centro): x crece hacia el norte, y hacia el río.
  hasta = 5; // (en 1912 la corrieron al medio de la plaza: desde ahí la pone src/lugares/plaza-de-mayo.js)
  { // la Pirámide de Mayo, como quedó en 1856: un obelisco sobre su pedestal, con la estatua arriba y la reja alrededor
    const T = lugar(10344, 9484);
    T.caja(9, 0.5, 9); T.caja(5.2, 3.2, 5.2, 0, 0.5, 0); T.caja(5.8, 0.4, 5.8, 0, 3.7, 0);
    T.put(new THREE.CylinderGeometry(1.0, 2.05, 11, 4).rotateY(Math.PI / 4).translate(0, 4.1 + 5.5, 0), PIEDRA); T.caja(1.9, 0.5, 1.9, 0, 15.1, 0); T.cilindro(0.42, 2.6, 0, 15.6, 0, PIEDRA, 6, 0.3); T.cupula(0.36, 0, 18.2, 0, 1.2, PIEDRA);
    for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) T.cilindro(0.4, 1.9, x * 3.4, 0.5, z * 3.4, PIEDRA, 6, 0.28);
    // la reja
    const f = 8.4;
    for (const s of [-1, 1]) { T.caja(2 * f, 0.1, 0.1, 0, 1.2, s * f, TINTA); T.caja(0.1, 0.1, 2 * f, s * f, 1.2, 0, TINTA); for (let i = 0; i <= 6; i++) { T.caja(0.14, 1.35, 0.14, -f + (i * f) / 3, 0, s * f, TINTA); T.caja(0.14, 1.35, 0.14, s * f, 0, -f + (i * f) / 3, TINTA); } }
  }
  hasta = 1; // (la Recova Vieja se demolió en 1884, para unir las dos plazas)
  { // la Recova Vieja: dos alas de once arcos con azotea y, en el medio, el Arco de los Virreyes. Parte la plaza en dos.
    // (Como en las fotos de Gonnet, 1864: las alas bajas con sus pilares en el pretil, y el arco mucho más alto.)
    const T = lugar(10336, 9594), ala = m(80), fondo = m(36), h = 6.4, hueco = m(10);
    for (const s of [-1, 1]) {
      const x = s * (hueco + ala / 2);
      T.caja(ala, h, fondo, x, 0, 0); T.caja(ala + 0.5, 0.4, fondo + 0.5, x, h, 0);
      for (const z of [-1, 1]) { T.fila(11, x - ala / 2 + 0.5, x + ala / 2 - 0.5, 3.1, 4.6, 0, z * (fondo / 2 + 0.05), z < 0 ? '-z' : '+z'); T.pilares(12, x - ala / 2 + 0.3, z * (fondo / 2 - 0.1), x + ala / 2 - 0.3, z * (fondo / 2 - 0.1), h + 0.4, 0.55, 0.95); }
    }
    const aw = 2 * hueco + 1.4, ad = fondo + 2.2;
    T.portada(aw, 13.4, ad, 6.6, 10.6, 0, 0, 0); T.caja(aw + 1, 0.6, ad + 1, 0, 13.4, 0);
    T.caja(aw - 3.6, 2.9, ad - 1.2, 0, 14, 0); T.caja(aw - 3, 0.4, ad - 0.6, 0, 16.9, 0); T.caja(5.2, 1.2, ad - 1.2, 0, 17.3, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { T.caja(0.7, 1.7, 0.7, sx * (aw / 2 - 2.2), 17.3, sz * (ad / 2 - 1)); T.caja(0.6, 1.3, 0.6, sx * (aw / 2 - 0.2), 14, sz * (ad / 2 - 0.2)); T.vano(1.5, 3.2, sx * (aw / 2 - 2.1), 7.4, sz * (ad / 2 + 0.05), sz < 0 ? '-z' : '+z'); }
  }
  // (el Cabildo de cada año, y la Policía que tenía al lado, están en src/lugares/cabildo.js)
  hasta = 0;
  { // el Teatro Colón, el primero (1857): tres pisos a la italiana, con el cuerpo central de pilastras y frontis mirando a
    // la plaza, y encima el techo de hierro más grande de la ciudad, con la cumbrera paralela a la fachada
    const T = lugar(10488, 9628), fx = 62, fz = 54, H = 18, xf = -fx / 2, cw = 27;
    T.caja(fx, H, fz, 0, 0, 0, CASA, { floors: 3 }); T.caja(fx + 0.9, 0.7, fz + 0.9, 0, H, 0);
    T.caja(1.4, H, cw, xf - 0.7, 0, 0); T.caja(2.2, 0.7, cw + 0.8, xf - 0.7, H, 0); T.tejado(1.8, cw, 3.3, xf - 0.7, H + 0.7, 0, 'x', PIEDRA);
    T.fila(5, -cw / 2 + 1.6, cw / 2 - 1.6, 2.6, 5, 0, xf - 1.45, '-x'); T.fila(5, -cw / 2 + 1.6, cw / 2 - 1.6, 1.7, 3.7, 7.1, xf - 1.45, '-x'); T.fila(5, -cw / 2 + 1.6, cw / 2 - 1.6, 1.3, 2.1, 13.2, xf - 1.45, '-x');
    for (let i = 0; i <= 5; i++) T.caja(0.35, 10.9, 0.8, xf - 1.55, 6.3, -cw / 2 + 0.5 + (i * (cw - 1)) / 5);
    T.caja(0.3, 0.3, cw + 0.6, xf - 1.55, 6, 0);
    for (const s of [-1, 1]) { T.pilares(5, xf + 0.2, s * (cw / 2 + 2.5), xf + 0.2, s * (fz / 2 - 0.2), H + 0.7, 0.6, 1.1); T.pilares(11, xf + 3, s * (fz / 2 - 0.2), fx / 2 - 0.3, s * (fz / 2 - 0.2), H + 0.7, 0.6, 1.1); }
    T.tejado(fx - 10, fz - 5, 8.6, 2, H + 0.7, 0, 'z');
  }
  hasta = 3; // (en 1898 quedó terminada la Casa Rosada, con el arco que une las dos casas; la Estación Central se quemó en 1897)
  { // la Casa de Gobierno: lo que quedaba del Fuerte. El plano le dibuja el cerco, un cuerpo grande del lado norte y un
    // ala más baja hacia el sur; la entrada, por el portón que da a la plaza.
    const T = lugar(10334, 9830), ex = m(79), ez = m(68);
    T.caja(m(47), 10.4, m(99), m(38.5), 0, m(0.5), CASA, { floors: 2 }); T.caja(m(47) + 0.8, 0.6, m(99) + 0.8, m(38.5), 10.4, m(0.5));
    T.caja(m(84), 7.2, m(44), m(-27), 0, m(20), CASA, { floors: 1 }); T.caja(m(84) + 0.6, 0.5, m(44) + 0.6, m(-27), 7.2, m(20));
    T.caja(2 * ex, 3.4, 0.9, 0, 0, -ez); T.caja(2 * ex, 3.4, 0.9, 0, 0, ez); T.caja(0.9, 3.4, 2 * ez, -ex, 0, 0); T.caja(0.9, 3.4, 2 * ez, ex, 0, 0);
    T.caja(11, 11.5, 5, 0, 0, -ez); T.vano(5, 8.2, 0, 0, -ez - 2.55, '-z'); T.vano(5, 8.2, 0, 0, -ez + 2.55, '+z'); T.tejado(11, 5, 2.2, 0, 11.5, -ez, 'z', PIEDRA);
  }
  hasta = 2; // (la Aduana Nueva y los muelles: demolidos entre 1894 y 1897, cuando se hizo el puerto)
  { // la Aduana Nueva (Taylor, 1857): un medio círculo de tres pisos metido en el río, con la torre del faro, y el muelle
    const T = lugar(10337, 9937), R = 61;
    const medio = (r, h, y, kind, o) => T.put(new THREE.CylinderGeometry(r, r, h, 40, 1, false, -Math.PI / 2, Math.PI).translate(0, y + h / 2, 0), kind, { H: y + h, ...o });
    medio(R, 4.6, 0, PIEDRA); medio(R - 1.2, 9.4, 4.6, CASA, { floors: 2 }); medio(R - 0.6, 0.7, 14, PIEDRA); medio(R - 2.2, 0.5, 14.7, CASA);
    T.caja(2 * R, 14, 3, 0, 0, -1.5, CASA, { floors: 3 }); T.caja(2 * R + 0.8, 0.7, 3.8, 0, 14, -1.5);
    // los arcos de los depósitos, a ras del agua
    for (let i = 0; i < 25; i++) { const a = -Math.PI / 2 + ((i + 0.5) / 25) * Math.PI, g = new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.moveTo(-1.9, 0); s.lineTo(1.9, 0); s.lineTo(1.9, 1.5); s.absarc(0, 1.5, 1.9, 0, Math.PI, false); s.closePath(); return s; })(), 5); T.put(g.rotateY(a).translate(Math.sin(a) * (R + 0.08), 0.4, Math.cos(a) * (R + 0.08)), TINTA); }
    T.caja(15, 17.5, 9, 0, 0, -4.5); T.tejado(15, 9, 3.4, 0, 17.5, -4.5, 'x', PIEDRA); T.vano(5.5, 9, 0, 0, -9.05, '-z');
    T.caja(6.4, 27, 6.4, 0, 0, 2.5); T.caja(7.2, 0.6, 7.2, 0, 27, 2.5); T.caja(4.6, 6, 4.6, 0, 27.6, 2.5); T.cupula(2.7, 0, 33.6, 2.5, 1.2); T.cilindro(0.2, 3.5, 0, 36.8, 2.5, TINTA, 5);
    for (const c of ['-x', '+x', '-z', '+z']) T.vano(1.5, 3.6, c === '-x' ? -2.35 : c === '+x' ? 2.35 : 0, 28.6, 2.5 + (c === '-z' ? -2.35 : c === '+z' ? 2.35 : 0), c);
    // el muelle de la Aduana: unos 500 m río adentro, apenas curvo, sobre pilotes
    const curva = (t) => [46 * t * t, R - 1 + t * 512];
    for (let i = 0; i < 24; i++) {
      const [x0, z0] = curva(i / 24), [x1, z1] = curva((i + 1) / 24), len = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(x1 - x0, z1 - z0);
      T.put(new THREE.BoxGeometry(7.5, 0.9, len + 0.3).translate(0, 3.85, 0).rotateY(a).translate((x0 + x1) / 2, 0, (z0 + z1) / 2), PIEDRA);
      for (const s of [-1, 1]) T.put(new THREE.BoxGeometry(0.5, 3.4, 0.5).translate(s * 3, 1.7, 0).rotateY(a).translate((x0 + x1) / 2, 0, (z0 + z1) / 2), TINTA);
    }
  }
  { // el muelle de pasajeros (1855), con su glorieta en la punta
    const T = lugar(10940, 9962), L = 388;
    for (let i = 0; i < 20; i++) { T.caja(9, 0.9, L / 20 + 0.3, 0, 3.6, (i + 0.5) * (L / 20)); for (const s of [-1, 1]) T.caja(0.55, 3.6, 0.55, s * 3.6, 0, (i + 0.5) * (L / 20), TINTA); }
    T.caja(15, 0.9, 13, 0, 3.6, L + 6); T.caja(8.5, 4.2, 7, 0, 4.5, L + 6); T.piramide(6.6, 3.2, 0, 8.7, L + 6);
    // las dos casillas de la entrada (fotos de Gonnet, 1864, y Panunzi, 1867): de ocho lados, con un alero ancho sobre
    // postes y arriba un cuerpo más chico con su cupulita. El plano las dibuja una a cada lado del arranque.
    for (const s of [-1, 1]) {
      const x = s * 13.5, z = 5;
      T.cilindro(3.3, 3.3, x, 0, z, PIEDRA, 8); T.cilindro(5.6, 1.1, x, 3.1, z, PIZARRA, 8, 3); T.cilindro(2.9, 1.5, x, 4.2, z, PIEDRA, 8);
      T.cupula(3.15, x, 5.7, z, 0.72); T.cilindro(0.3, 1.3, x, 7.9, z, TINTA, 6, 0.12);
      for (let i = 0; i < 8; i++) { const a = (i + 0.5) * Math.PI / 4; T.cilindro(0.11, 3.2, x + Math.sin(a) * 5.2, 0, z + Math.cos(a) * 5.2, TINTA, 5); }
      T.vano(1.3, 2.5, x, 0, z - 3.1, '-z', false);
    }
  }
  hasta = 0;
  desde = 6;
  { // el Obelisco (1936), donde estaba San Nicolás: 67,5 m, en el cruce de Corrientes, la 9 de Julio y la Diagonal Norte
    const T = lugar(11195, 8373); // (la plataforma redonda, las fuentes y los canteros: src/lugares/nueve-de-julio.js)
    T.put(new THREE.CylinderGeometry(2.47, 4.81, 63.5, 4).rotateY(Math.PI / 4).translate(0, 0.5 + 31.75, 0), PIEDRA, { H: 64 });
    T.put(new THREE.CylinderGeometry(0, 2.47, 3.5, 4).rotateY(Math.PI / 4).translate(0, 64 + 1.75, 0), PIEDRA, { H: 67.5 });
  }
  desde = 0; hasta = 3;
  { // la Estación Central: en 1867, apenas una casilla y su playa de vías al pie de la barranca
    const T = lugar(10486, 9851);
    T.caja(m(22), 5.2, m(10), 0, 0, 0, CASA, { floors: 1 }); T.tejado(m(22) + 1.2, m(10) + 1.2, 2.4, 0, 5.2, 0, 'x');
  }
  // ------------------------------------------------------------------------------- las estaciones, el gas y el Once
  hasta = 5; // (hasta la estación nueva, de 1915)
  { // la Estación del Norte, en el Retiro, como en la foto de Gonnet (1864): un cuerpo bajo y largo con techo a dos
    // aguas, ventanales de arco y un porche con escalinata; a un lado, el ala que sigue, y en la otra punta los dos
    // galpones de madera por donde entraban los coches. El plano le dibuja el rectángulo (72 × 29 m) y el porche.
    const T = lugar(12959, 9306, 0.605, -0.796), L = m(107), D = m(43), zf = -D / 2, df = D / 2, h = 5.2;
    const lg = 9, lp = 24, xg = -L / 2 + lg, xp = xg + lp / 2, la = L / 2 - xg - lp, xa = L / 2 - la / 2, lt = L - lg, xt = xg + lt / 2;
    T.caja(lp, h, df, xp, 0, zf + df / 2); T.caja(lp + 0.5, 0.4, 0.5, xp, h - 0.4, zf - 0.1);
    T.caja(la, h, df - 1, xa, 0, zf + 1 + (df - 1) / 2);
    T.tejado(lt, df + 0.8, 3, xt, h, zf + df / 2, 'x');
    // (atrás, el cobertizo de los andenes)
    T.caja(lt, h, df, xt, 0, df / 2); T.tejado(lt, df + 0.8, 3, xt, h, df / 2, 'x');
    // el frente: dos ventanales a cada lado de la puerta, el porche sobre cuatro postes y la escalinata
    for (const s of [-1, 1]) for (const k of [5.3, 9.5]) T.vano(3, 3.4, xp + s * k, 1, zf - 0.05, '-z');
    T.vano(2.4, 3.5, xp, 0.9, zf - 0.05, '-z', false);
    T.caja(9.6, 0.45, 3.8, xp, 0, zf - 1.9); T.caja(8.6, 0.45, 2.9, xp, 0.45, zf - 1.45); T.caja(8.8, 0.3, 3, xp, 4.1, zf - 1.5);
    for (const k of [-4, -1.5, 1.5, 4]) T.cilindro(0.11, 3.2, xp + k, 0.9, zf - 2.7, TINTA, 5);
    for (const s of [-1, 1]) T.cilindro(0.07, 4.2, xp + s * 5, h + 2.2, zf + df / 2, TINTA, 4);
    T.fila(5, xa - la / 2 + 2, xa + la / 2 - 2, 1.1, 2.1, 1.5, zf + 0.95, '-z', false);
    // los galpones de madera
    for (const s of [0, 1]) { const x = -L / 2 + lg / 4 + (s * lg) / 2; T.caja(lg / 2, 6.4, D, x, 0, 0); T.tejado(lg / 2 + 0.3, D + 0.6, 2.3, x, 6.4, 0, 'z'); for (const e of [-1, 1]) T.vano(2.7, 4.6, x, 0, e * (D / 2 + 0.05), e < 0 ? '-z' : '+z', false); }
  }
  hasta = 5; // (la compañía dejó el terreno en 1912: en 1910 la usina sigue en pie; en su lugar quedó la plaza de la Torre de los Ingleses)
  { // la Fábrica de gas, en el bajo del Retiro (fotos de Gonnet, 1864, y de Junior, 1876): un paredón, las casas de
    // retortas con techo a dos aguas y ventanas de arco, la chimenea y los gasómetros con sus columnas de guía. El plano
    // dibuja el cerco, tres galpones largos, un cuerpo en la esquina y los redondeles de los gasómetros.
    const T = lugar(12921, 9553, 0.638, -0.769), Y = 72;
    for (const s of [-1, 1]) { T.caja(2 * Y, 2.6, 0.6, 0, 0, s * Y); T.caja(0.6, 2.6, 2 * Y, s * Y, 0, 0); }
    for (const [x, z, l] of [[50, -25, 46], [21, -23, 51], [-11, -15, 65]]) {
      T.caja(15, 6.2, l, x, 0, z); T.tejado(15.6, l - 0.4, 4, x, 6.2, z, 'z');
      for (const e of [-1, 1]) { const ze = z + e * (l / 2 - 0.1); T.tejado(15, 0.5, 4.2, x, 6.2, ze, 'z', PIEDRA); T.fila(3, x - 5.5, x + 5.5, 1.7, 3.5, 1.2, z + e * (l / 2 + 0.2), e < 0 ? '-z' : '+z'); T.vano(1.5, 1.5, x, 7, z + e * (l / 2 + 0.2), e < 0 ? '-z' : '+z'); }
      const nv = Math.round(l / 7); for (const s of [-1, 1]) T.fila(nv, z - l / 2 + 2, z + l / 2 - 2, 1.5, 3.2, 1.2, x + s * 7.55, s < 0 ? '-x' : '+x');
    }
    T.caja(3.6, 4, 3.6, 5, 0, -30); T.cilindro(1.5, 22, 5, 4, -30, PIEDRA, 10, 0.95); T.cilindro(1.2, 0.6, 5, 26, -30, PIEDRA, 10);
    T.caja(26, 5.4, 13, -45, 0, -63); T.tejado(26.6, 13.6, 3, -45, 5.4, -63, 'x'); T.fila(5, -56, -34, 1.5, 3, 1, -56.45, '+z');
    T.caja(8, 4.4, 8, -65, 0, -50); T.cuatroAguas(8.6, 8.6, 2.2, -65, 4.4, -50);
    for (const [x, z, r, a] of [[-48, -35, 12, 6], [-49, -6, 12, 7.5], [-44, 31, 16.5, 6.5], [-8, 47, 16.5, 8]]) {
      T.cilindro(r + 0.7, 1.4, x, 0, z, PIEDRA, 28); T.cilindro(r, a, x, 0, z, PIZARRA, 28); T.cupula(r, x, a, z, 0.1);
      for (let i = 0; i < 8; i++) { const t = (i * Math.PI) / 4; T.cilindro(0.22, 11, x + Math.sin(t) * (r + 1), 0, z + Math.cos(t) * (r + 1), TINTA, 5); }
      T.put(new THREE.TorusGeometry(r + 1, 0.16, 4, 28).rotateX(Math.PI / 2).translate(x, 10.9, z), TINTA);
    }
  }
  hasta = 3; // (hasta la estación del Once, de 1898)
  { // los depósitos del Ferrocarril del Oeste, sobre el Mercado 11 de Septiembre: en la foto de Panunzi (1865) son el
    // galpón largo de dos bóvedas, con una hilera de arcos al costado. El plano lo dibuja de 66 × 87 m, con las vías
    // entrando por la punta del oeste.
    const T = lugar(10753, 4880, 1, 0), A = m(97.5), Lg = m(129), w = A / 2, h = 5.4;
    for (const s of [-1, 1]) {
      const x = (s * w) / 2;
      T.caja(w, h, Lg, x, 0, 0); T.tejado(w, Lg - 0.6, 5, x, h, 0, 'z', PIZARRA, true);
      for (const e of [-1, 1]) { T.tejado(w, 0.5, 5.2, x, h, e * (Lg / 2 - 0.25), 'z', PIEDRA, true); T.vano(w * 0.52, 7, x, 0, e * (Lg / 2 + 0.05), e < 0 ? '-z' : '+z'); }
      T.fila(13, -Lg / 2 + 2, Lg / 2 - 2, 2.7, 3.9, 0, s * (A / 2 + 0.05), s < 0 ? '-x' : '+x');
    }
  }
  hasta = 0;
  // ------------------------------------------------------------------- los grandes edificios que vinieron después
  // Aparecen con la línea de tiempo, cada uno en la primera etapa que ya lo encuentra hecho. El lugar, el rumbo y el
  // tamaño salen del mapa de hoy (tools/edificios.mjs los deja en src/edificios.js); la forma es un boceto de cada
  // uno, con pocas piezas: los cuerpos, las cúpulas, las mansardas, las bóvedas de los andenes.
  const BLANCO = 0, CREMA = 1, ROSA = 2, GRIS = 3, LADRILLO = 4, SILLAR = 5;
  const ETAPAS = AÑOS.slice(1); // (los años de las etapas 1, 2, 3…: src/etapas.js)
  /** Las herramientas en el lugar de un edificio (x a lo largo, z a lo ancho) y sus datos; `tono` pinta sus paredes. */
  const obra = (clave, tono) => {
    const e = EDIFICIOS[clave], T = lugar(e.x, e.y, e.ux, e.uy);
    desde = ETAPAS.findIndex((a) => a >= e.año) + 1; hasta = 0;
    /** un cuerpo con ventanas (pisos = 0: los que entren) */
    T.cuerpo = (w, h, d, x = 0, y = 0, z = 0, pisos = 0) => T.caja(w, h, d, x, y, z, CASA, { floors: pisos, tono });
    /** lo mismo, liso */
    T.liso = (w, h, d, x = 0, y = 0, z = 0) => T.caja(w, h, d, x, y, z, PIEDRA, { tono });
    /** un pabellón: un cuerpo con su mansarda */
    T.pabellon = (w, h, d, x, z, pisos, alto = 6, mete = 3.5) => { T.cuerpo(w, h, d, x, 0, z, pisos); T.liso(w + 0.7, 0.7, d + 0.7, x, h, z); T.mansarda(w, d, alto, x, h + 0.7, z, Math.min(mete, w / 2 - 1, d / 2 - 1)); };
    /** una hilera de columnas de (x0, z0) a (x1, z1) */
    T.columnas = (n, x0, z0, x1, z1, y, r, h) => { for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); T.put(new THREE.CylinderGeometry(r * 0.86, r, h, 10).translate(x0 + (x1 - x0) * t, y + h / 2, z0 + (z1 - z0) * t), PIEDRA, { tono }); } };
    return T;
  };

  { // la Estación Constitución, la de 1887 (Parr, Strong y Parr): un frente a la francesa sobre la plaza, con el
    // pabellón del medio y los de las puntas con mansardas, y atrás las bóvedas de los andenes. (La de hoy es más grande.)
    const T = obra('constitucion', CREMA), xf = 1, zf = 22; // (x hacia el oeste, z hacia la plaza)
    T.cuerpo(94, 14.5, 19, xf, 0, zf, 3); T.mansarda(92, 17, 4, xf, 14.5, zf, 5);
    T.pabellon(24, 19, 22, xf, zf + 0.6, 4, 8, 6); T.liso(7, 5, 1.2, xf, 20, zf + 11.2); T.cilindro(1.9, 0.3, xf, 20.6, zf + 11.9, TINTA, 12);
    for (const s of [-1, 1]) { T.pabellon(15, 17, 21.5, xf + s * 40, zf + 0.4, 3, 6, 4.5); T.fila(3, xf + s * 40 - 5.5, xf + s * 40 + 5.5, 2.2, 5.4, 0, zf + 11.2, '+z'); }
    T.fila(3, xf - 8, xf + 8, 3.6, 8, 0, zf + 11.65, '+z');
    // los andenes: tres bóvedas de hierro y vidrio, con las bocas hacia el sur
    for (let i = 0; i < 3; i++) {
      const x = 0.5 + (i - 1) * 46.2;
      T.liso(46, 9, 45, x, 0, -10.5); T.tejado(46, 45, 10, x, 9, -10.5, 'z', PIZARRA, true);
      T.vano(36, 16, x, 0, -33.06, '-z');
    }
  }

  { // el Palacio de Aguas Corrientes (1894): una manzana entera de tres pisos de terracota, con un pabellón de mansarda
    // en cada esquina y otro en el medio de cada frente. Adentro no hay salones: son los tanques de agua.
    const T = obra('aguas', LADRILLO), e = EDIFICIOS.aguas, L = e.largo - 2, A = e.ancho - 2, H = 18;
    T.cuerpo(L, H, A, 0, 0, 0, 3); T.mansarda(L - 14, A - 14, 3.2, 0, H, 0, 14);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) T.pabellon(15, 22, 15, sx * (L / 2 - 6.6), sz * (A / 2 - 6.6), 4, 7, 4);
    for (const s of [-1, 1]) { T.pabellon(26, 23, 8, 0, s * (A / 2 - 3), 4, 8, 3); T.pabellon(8, 23, 26, s * (L / 2 - 3), 0, 4, 8, 3); }
    T.vano(4.4, 8, 0, 0, A / 2 + 1.06, '+z'); T.vano(4.4, 8, L / 2 + 1.06, 0, 0, '+x');
  }

  // (la Casa Rosada, entera hasta 1938 y como quedó después, está en src/lugares/casa-rosada.js)

  { // la estación del Once (1898): el edificio de tres pisos sobre la plaza, con el pabellón del medio, los de las
    // puntas y la cúpula de la esquina de Bartolomé Mitre; atrás, las dos bóvedas de los andenes.
    const T = obra('once', CREMA), zf = 21; // (x hacia el norte, z hacia la plaza Miserere)
    T.cuerpo(108, 15.5, 19, 0, 0, zf, 3); T.mansarda(106, 17, 3.6, 0, 15.5, zf, 5);
    T.pabellon(22, 19, 21, 0, zf + 0.5, 4, 7, 5); T.fila(3, -7, 7, 3.4, 7.5, 0, zf + 11.06, '+z');
    T.pabellon(14, 18, 21, -47, zf + 0.5, 4, 6, 4);
    T.cuerpo(14, 19, 21, 47, 0, zf + 0.5, 4); T.cilindro(6.2, 3.4, 47, 19, zf + 0.5, PIEDRA, 12); T.cupula(6, 47, 22.4, zf + 0.5, 1.15); T.cilindro(0.9, 3, 47, 28.8, zf + 0.5, PIEDRA, 6); T.piramide(1.1, 3, 47, 31.8, zf + 0.5);
    for (const s of [-1, 1]) { T.liso(54, 8, 42.5, s * 27.1, 0, -9.6); T.tejado(54, 42.5, 10, s * 27.1, 8, -9.6, 'z', PIZARRA, true); T.vano(42, 15, s * 27.1, 0, -30.91, '-z'); }
  }

  { // el Congreso (1906, de Meano): el palacio de piedra gris con la escalinata y el pórtico de seis columnas hacia la
    // plaza, la cúpula de cobre de 80 metros y, atrás, el medio círculo del recinto de Diputados.
    const T = obra('congreso', SILLAR), H = 21, xc = 3; // (x hacia el norte, z hacia la plaza)
    T.cuerpo(100, H, 70, 2.5, 0, 3, 4);
    for (const s of [-1, 1]) { T.cuerpo(19, H + 3, 13, 2.5 + s * 44, 0, 40.5, 4); T.liso(9, 3, 9, 2.5 + s * 44, H + 3, 40.5); T.cupula(4.6, 2.5 + s * 44, H + 6, 40.5, 1.1); T.cuerpo(22, H + 1, 13, 2.5 + s * 41, 0, -33, 4); }
    // la escalinata, el pórtico y el frontis
    for (let i = 0; i < 4; i++) T.liso(30 - i * 1.5, 1.2, 12 - i * 2.4, xc, i * 1.2, 44 - i * 1.2);
    T.liso(26, H + 2, 5, xc, 0, 39.5); T.columnas(6, xc - 10.5, 43.2, xc + 10.5, 43.2, 4.8, 1.15, 12.4);
    T.liso(25, 1.8, 4.6, xc, 17.2, 42); T.tejado(25, 4.6, 4.4, xc, 19, 42, 'z'); T.fila(3, xc - 6, xc + 6, 2.6, 7, 4.8, 42.06, '+z');
    // la cúpula: el basamento, el tambor con sus columnas, la media naranja, la linterna y la aguja
    const zc = 16;
    T.liso(27, H + 11, 27, xc, 0, zc); T.liso(22, 3, 22, xc, H + 11, zc);
    T.cilindro(9.6, 15, xc, H + 14, zc, PIEDRA, 20); for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; T.cilindro(0.6, 11, xc + Math.cos(a) * 10.6, H + 15, zc + Math.sin(a) * 10.6, PIEDRA, 6); }
    T.cilindro(11.6, 1.3, xc, H + 26, zc, PIEDRA, 20); T.cilindro(9.8, 3.2, xc, H + 27.3, zc, PIEDRA, 20);
    T.cupula(9.6, xc, H + 30.5, zc, 1.55); T.cilindro(2.3, 6.5, xc, H + 44.6, zc, PIEDRA, 8); T.cupula(2.4, xc, H + 51.1, zc, 1.1); T.cilindro(0.5, 6.5, xc, H + 53.4, zc, PIZARRA, 6, 0.06);
    // el recinto
    T.cilindro(15, H - 2, xc, 0, -33, PIEDRA, 24); T.cupula(15, xc, H - 2, -33, 0.3);
  }

  // (el Teatro Colón de 1908 está en src/lugares/teatro-colon.js)

  { // el Palacio de Tribunales (empezado en 1905, habilitado en 1910 y terminado mucho después): una manzana maciza de
    // seis pisos sobre la plaza Lavalle, con el cuerpo del medio de columnas gigantes.
    const T = obra('tribunales', GRIS), H = 31, xf = -55; // (x hacia el oeste: el frente, sobre la plaza, es −x)
    T.cuerpo(109, H, 100, 0, 0, 0, 6);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) T.cuerpo(17, H + 2.6, 17, sx * 46.6, 0, sz * 42.1, 6);
    T.liso(8, H + 5, 46, xf - 1, 0, 0); T.liso(6, 8.5, 48, xf - 6, 0, 0); T.columnas(8, xf - 7.4, -19, xf - 7.4, 19, 8.5, 1.5, 17);
    T.liso(6.4, 3.4, 48, xf - 6, 25.5, 0); T.liso(5, 4, 30, xf - 5.6, 28.9, 0);
    T.fila(3, -9, 9, 3.4, 6.2, 0, xf - 9.06, '-x');
    T.liso(84, 4.5, 74, 0, H, 0);
  }

  { // la estación Retiro (1915): el edificio largo sobre la avenida, con el pabellón del medio, y atrás las dos naves
    // de hierro de los andenes, de 250 metros.
    const T = obra('retiro', SILLAR), x0 = -155.5; // (x a lo largo de las vías, hacia el noroeste: el frente es −x)
    T.liso(38, 17, 150, x0 + 19, 0, 0); T.mansarda(36, 148, 4, x0 + 19, 17, 0, 6);
    T.fila(17, -70, 70, 4, 9.4, 1, x0 - 0.06, '-x'); T.fila(17, -70, 70, 2.2, 2.6, 12.6, x0 - 0.06, '-x', false);
    T.liso(42, 22, 38, x0 + 19.6, 0, 0); T.mansarda(40, 36, 9, x0 + 19.6, 22, 0, 9); T.fila(3, -11, 11, 6, 15, 0, x0 - 1.46, '-x');
    for (const s of [-1, 1]) { T.liso(40, 19.5, 17, x0 + 19.4, 0, s * 67.5); T.mansarda(38, 15, 6, x0 + 19.4, 19.5, s * 67.5, 5); T.vano(5, 11, x0 - 0.66, 0, s * 67.5, '-x'); }
    // el vestíbulo, a lo ancho, y las naves
    T.liso(17, 13, 122, x0 + 46.5, 0, 0); T.tejado(17, 122, 6, x0 + 46.5, 13, 0, 'z', PIZARRA, true);
    for (const s of [-1, 1]) { const z = -1 + s * 25.2; T.liso(255, 10, 50, 27.5, 0, z); T.tejado(255, 50, 15, 27.5, 10, z, 'x', PIZARRA, true); T.vano(40, 21, 155.06, 0, z, '+x'); }
  }

  { // el Palacio Barolo (1923, de Palanti): cien metros sobre la Avenida de Mayo. El cuerpo de catorce pisos con sus
    // dos torreones redondos, y en el medio la torre que termina en una cúpula con un faro. (Mide 31 m de frente: a los
    // lados van las casas vecinas.)
    const T = obra('barolo', CREMA), A = EDIFICIOS.barolo.ancho - 1; // (x hacia el río, z hacia el sur: la avenida queda en −z)
    T.cuerpo(31, 48, A, 0, 0, 0); T.liso(31.8, 1, A + 0.8, 0, 48, 0);
    for (const s of [-1, 1]) {
      T.cilindro(3.6, 48, s * 9.5, 6, -A / 2, PIEDRA, 12); T.cupula(3.6, s * 9.5, 54, -A / 2, 1.2);
      T.cilindro(3.2, 46, s * 9.5, 6, A / 2, PIEDRA, 12); T.cupula(3.2, s * 9.5, 52, A / 2, 1.1);
      T.cuerpo(7, 9, 7, s * 11, 49, 0); T.cupula(3.6, s * 11, 58, 0, 1.2);
      T.caja(14, 23, A, s * 22.6, 0, 0, CASA, { floors: 6 });
    }
    T.cuerpo(17, 26, 17, 0, 49, 0); T.liso(18, 0.9, 18, 0, 75, 0); T.cuerpo(12.5, 8, 12.5, 0, 75.9, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) T.cupula(2.3, sx * 6.4, 75.9, sz * 6.4, 1.5);
    T.cupula(6.6, 0, 83.9, 0, 1.45); T.cilindro(1.5, 4.6, 0, 92.6, 0, PIEDRA, 8); T.cupula(1.6, 0, 97.2, 0, 1.5);
    T.vano(5, 9.5, 0, 0, -A / 2 - 0.06, '-z');
  }

  { // el Kavanagh (1936): 120 metros de hormigón gris, en cuña entre dos calles, que suben escalonados hacia la torre.
    const T = obra('kavanagh', GRIS), C = [-13, 5];
    const cuña = [[-31, 21], [-26, -12], [-19, -22], [28, 11], [32, 16], [29, 22]];
    let y = 0;
    for (const [k, h] of [[1, 42], [0.8, 23], [0.6, 20], [0.42, 17], [0.27, 12], [0.14, 6]]) { T.prisma(cuña.map(([x, z]) => [C[0] + (x - C[0]) * k, C[1] + (z - C[1]) * k]), h, y, CASA, { floors: 0, tono: GRIS }); y += h; }
  }

  { // el Correo Central (1928): un palacio a la francesa de siete pisos, todo coronado de mansardas, con el pabellón de
    // columnas sobre la calle Sarmiento y otros en las esquinas y en los costados.
    const T = obra('correo', SILLAR), H = 30; // (x hacia el norte, z hacia el río)
    T.cuerpo(112, H, 73, 0, 0, 0.5, 6); T.liso(113, 1, 74, 0, H, 0.5); T.mansarda(110, 71, 9, 0, H + 1, 0.5, 10);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) T.pabellon(14, H + 2, 14, sx * 50, 0.5 + sz * 30.5, 6, 10, 4);
    for (const s of [-1, 1]) T.pabellon(22, H + 3, 8, 0, 0.5 + s * 34, 6, 11, 3);
    T.pabellon(8, H + 4, 32, -54.5, 0.5, 6, 13, 3); T.liso(5, 9, 34, -59.5, 0, 0.5); T.columnas(8, -60.6, -13.5, -60.6, 14.5, 9, 1.2, 17);
    T.liso(5.4, 2.6, 34, -59.5, 26, 0.5); T.fila(3, -7, 8, 3, 6.4, 0, -62.06, '-x');
    T.pabellon(8, H + 3, 24, 54.5, 0.5, 6, 11, 3);
  }
  desde = 0;
  // (los árboles de las plazas de 1867 no hacen falta acá: el plano los dibuja uno por uno y se leen de ahí)

  // ------------------------------------------------------------------------------------- los lugares hechos a mano
  // Cada uno en su archivo de src/lugares/: recibe estas herramientas y construye. Si uno falla, los demás siguen.
  const ctx = {
    THREE, lugar, mundo, m, obra, EDIFICIOS, ETAPAS, PINTA, fino, adentro,
    PIEDRA, TINTA, PIZARRA, CASA, FOLLAJE, PINTADO, BLANCO, CREMA, ROSA, GRIS, LADRILLO, SILLAR,
    get grilla() { return GRILLA; },
    /** la tirada de colores (cada pieza que se agrega la corre): se puede leer y reponer, para que un lugar que cambia
     *  de piezas no les cambie los colores a los que siguen */
    get tirada() { return seed; }, set tirada(v) { seed = v; },
    /** desde qué etapa existe lo que se construya de acá en más y hasta cuál (0: desde 1867 · 0: para siempre) */
    epoca: (d = 0, h = 0) => { desde = d; hasta = h; },
    /** la etapa de un año: la primera que ya lo encuentra hecho (1888 → 1 … 1950 → 7) */
    etapaDe: (año) => ETAPAS.findIndex((a) => a >= año) + 1,
  };
  const puntos = {}; // (cuántos puntos pone cada lugar, contando los de a ras del suelo: para saber cuál pesa)
  for (const [nombre, hacer] of Object.entries(LUGARES)) { desde = 0; hasta = 0; const n0 = P.length + RASO.P.length, t0 = [P.length / 3, RASO.P.length / 3, arboles.length]; try { hacer(ctx); } catch (e) { console.warn(`el lugar ${nombre} no se pudo armar:`, e); } puntos[nombre] = (P.length + RASO.P.length - n0) / 3; TRAMOS[nombre] = [...t0, P.length / 3, RASO.P.length / 3, arboles.length]; }
  desde = 0; hasta = 0;

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aInfo', new THREE.Float32BufferAttribute(I, 4)); g.setAttribute('aAncla', new THREE.Float32BufferAttribute(An, 3)); g.setAttribute('aWall', new THREE.Float32BufferAttribute(Wl, 4));
  const mesh = new THREE.Mesh(g, tinta.make({ manto: 1 }));
  mesh.customDepthMaterial = tinta.depth(); mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false;
  // lo que va a ras del suelo: otra malla, colgada de la primera, que recibe sombra pero no la hace (y con el
  // polígono corrido, para que de lejos no titile contra el suelo)
  if (RASO.P.length) {
    const gr = new THREE.BufferGeometry();
    gr.setAttribute('position', new THREE.Float32BufferAttribute(RASO.P, 3)); gr.setAttribute('normal', new THREE.Float32BufferAttribute(RASO.N, 3)); gr.setAttribute('aInfo', new THREE.Float32BufferAttribute(RASO.I, 4)); gr.setAttribute('aAncla', new THREE.Float32BufferAttribute(new Float32Array(RASO.P.length), 3)); gr.setAttribute('aWall', new THREE.Float32BufferAttribute(RASO.Wl, 4));
    const rasos = new THREE.Mesh(gr, tinta.make({ manto: 2, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    rasos.receiveShadow = true; rasos.frustumCulled = false; trozar(rasos); soltar(gr); mesh.add(rasos);
  }
  trozar(mesh); // (en trozos, como las casas: src/trozos.js)
  soltar(g, ['position', 'normal', 'aInfo']); // (src/modos.js los lee para armar por dónde se camina)
  // Para el velo de lo que se puede tocar (src/ficha.js): qué hay hecho a mano junto a una marca. De cada ancla (el
  // origen de un lugar), hasta dónde llegan sus piezas y en qué etapas existen; y, en una grilla de 8 m, dónde hay piezas.
  const CELDA = 8, anclas = new Map(), celdas = new Map();
  for (let i = 0, n = P.length / 3; i < n; i++) {
    const x = P[i * 3], z = P[i * 3 + 2], e = Math.floor(I[i * 4 + 3] / 20000), ha = e >> 3;
    let vive = 0; for (let k = e % 8; k < (ha || 8); k++) vive |= 1 << k;
    const kc = (Math.floor(x / CELDA) + 4096) * 8192 + Math.floor(z / CELDA) + 4096; celdas.set(kc, celdas.get(kc) | vive);
    if (!An[i * 3 + 2]) continue;
    const ax = An[i * 3], az = An[i * 3 + 1], ka = (Math.round(ax * 4) + 60000) * 120000 + Math.round(az * 4) + 60000;
    let a = anclas.get(ka); if (!a) anclas.set(ka, a = { x: ax, z: az, ext: 0, vive: 0 });
    a.vive |= vive; a.ext = Math.max(a.ext, Math.hypot(x - ax, z - az));
  }
  // (las listas con que se armó todo ya están copiadas en la malla: se vacían. Si no, quedan vivas mientras viva
  // `junto`, que comparte este ámbito, y son cientos de megas —cada número suelto pesa el doble que en la malla—)
  for (const l of [P, N, I, Wl, An, RASO.P, RASO.N, RASO.I, RASO.Wl]) l.length = 0;
  /** Junto a la marca (x, z, con su radio) en esa etapa: `ancla` > 0 si ahí hay un edificio suelto —las piezas con el
   *  ancla a menos de esa distancia son las suyas, y de nadie más—; si no, `hay` dice si hay piezas a menos del radio. */
  const junto = (x, z, r, etapa) => {
    const bit = 1 << etapa, tope = Math.max(r * 1.7, 60); let d0 = Math.min(r, 45), suelto = false, ajena = Infinity;
    for (const a of anclas.values()) {
      if (!(a.vive & bit)) continue;
      const d = Math.hypot(a.x - x, a.z - z);
      if (a.ext > tope) ajena = Math.min(ajena, d); else if (d < d0) { d0 = d; suelto = true; } // (ajena: la de un lugar entero, como el puerto o la 9 de Julio)
    }
    if (suelto && ajena > d0 + 0.6) return { ancla: Math.min(d0 + Math.max(4, r * 0.3), ajena - 0.5), hay: true };
    for (let cx = Math.floor((x - r) / CELDA); cx <= Math.floor((x + r) / CELDA); cx++) for (let cz = Math.floor((z - r) / CELDA); cz <= Math.floor((z + r) / CELDA); cz++)
      if (celdas.get((cx + 4096) * 8192 + cz + 4096) & bit && Math.hypot((cx + 0.5) * CELDA - x, (cz + 0.5) * CELDA - z) < r) return { ancla: 0, hay: true };
    return { ancla: 0, hay: false };
  };
  // (los árboles de la etapa 7 —1950—, al final de la lista: la forma de cada copa sale de su lugar en la lista
  // (src/ciudad.js), y así los que ya estaban quedan como eran)
  { const tarde = arboles.filter((a) => a[3] >= 7); if (tarde.length) { const antes = arboles.filter((a) => !(a[3] >= 7)); arboles.length = 0; arboles.push(...antes, ...tarde); } }
  return { mesh, arboles, iglesias, grilla: GRILLA, junto, puntos };
}
