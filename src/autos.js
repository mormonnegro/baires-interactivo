// En coche por la ciudad: el tercer modo de recorrerla (los otros dos, a pie y en avión, están en src/modos.js, que es
// quien carga este archivo recién cuando se toca «Manejar»).
// Hay un vehículo por cada año de la línea de tiempo, y al cambiar de año el que se está manejando se transforma en el
// de la época (y desde el tablero se puede elegir cualquiera de los anteriores, que seguían en la calle). Cuál era cada uno sale de lo que la ciudad contaba de sí misma (los censos municipales de 1887 y 1909 y
// los anuarios estadísticos de 1901 y 1903), no de lo que se usaba en otros países:
//   1867  volanta          la del Río de la Plata: cuatro ruedas, capota, pescante y dos asientos enfrentados (así la
//                          define el Diccionario de americanismos; la de dos ruedas es la cubana). Era coche de cochería
//                          y de campaña: en la Plaza de la Victoria ya había parada de coches de alquiler
//   1888  coche de plaza   la victoria de alquiler (el «mateo» de después). En septiembre de 1888 había 560 coches de
//                          plaza; en 1901, de 2.184 de alquiler, 2.077 eran victorias y 107 cupés
//   1895  cupé             el coche cerrado. No era el más común (uno cada veinte victorias entre los de plaza), pero sí
//                          de los que más tenían los particulares: 453 en 1901. Va para que cada año tenga el suyo; quien
//                          quiera lo estrictamente más visto en 1895 tiene que dejar la victoria (subirle el `desde`)
//   1905  voiturette       un De Dion-Bouton de un cilindro. Los autos todavía eran una rareza: 60 en toda la ciudad en
//                          1903, contra 4.791 carruajes. De esa marca fue uno de los primeros que anduvieron por Buenos Aires
//   1910  doble faetón     un automóvil europeo, sin marca: a fines de 1909 había 2.287 autos, casi todos traídos de
//                          Europa (el Ford T ya lo traía un importador desde 1908, pero era uno más), y no hay
//                          estadística por marca que deje elegir una
//   1921  Ford T           el más común, lejos: de unos 48.000 autos vendidos en el país entre 1913 y 1920, 35.000
//                          fueron Ford, que desde 1916 o 1917 se armaban en Barracas
//   1940  Ford V8 de 1937  sedán de cuatro puertas. Ford y Chevrolet tenían fábrica en el país y cualquiera de los dos
//                          vale: cuál se vendía más, y si este modelo se armó acá o vino armado, no se pudo saber
// Lo más usado de verdad para moverse, de 1870 en adelante, era el tranvía (36 millones de pasajeros en 1887, 282 en
// 1909); pero va por sus rieles, y esto es para manejar.
// Las medidas son las de cada uno (entre ejes, largo, ancho, alto y rodado: ver cada uno; donde dice «a ojo», son las
// corrientes de ese tipo de coche, no las de un ejemplar). Las formas están hechas con pocas
// piezas y dibujadas con la misma tinta que la ciudad, como el tren (src/tren.js): en tinta salen en grises de grabado
// y en color, pintados con los tonos que ya tiene src/tinta.js (no hay otros: el granate del V8 es su «rojo»; el
// cromado, su «chapa»; el cuero y la goma, su «negro» y su «asfalto»).
// El volante va a la derecha: en la Argentina se circuló por la izquierda hasta 1945.
// El manejo es de juego, pero con los números de cada uno: el caballo al trote largo no pasa de 20 km/h, el T llega a
// 68 y el V8 a 135; cuanto más rápido se va, menos se puede doblar (las cubiertas angostas no agarran más), y los frenos
// de varillas frenan poco. Contra las casas se choca (src/modos.js dice dónde hay una), y al río y a los diques no se entra.
import * as THREE from 'three';
import { pedir } from './url.js';
import { createMinimapa } from './minimapa.js';
import { etapaDeCodigo } from './etapas.js';

const TINTA = 7, PINTADO = 9;
// (los tonos de PINTADO: ver «kind» 9 en src/tinta.js)
const MADERA = 0, VERDE = 1, BRONCE = 2, ROJO = 3, OCRE = 4, LONA = 5, GOMA = 13, CHAPA = 14, NEGRO = 15, BLANCO = 16;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
const Y = new THREE.Vector3(0, 1, 0);

// ---------- las piezas ----------
/** Una curva suave por unos puntos [z, valor], ordenados por z. */
function curva(pts) {
  return (z) => {
    const n = pts.length; if (z <= pts[0][0]) return pts[0][1]; if (z >= pts[n - 1][0]) return pts[n - 1][1];
    let i = 0; while (z > pts[i + 1][0]) i++;
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)], d = p2[0] - p1[0], t = (z - p1[0]) / d;
    const m1 = ((p2[1] - p0[1]) / (p2[0] - p0[0])) * d, m2 = ((p3[1] - p1[1]) / (p3[0] - p1[0])) * d, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * p1[1] + (t3 - 2 * t2 + t) * m1 + (3 * t2 - 2 * t3) * p2[1] + (t3 - t2) * m2;
  };
}
/** Un paño de nu × nv cuadros sobre los puntos que da f(u, v), con la cara hacia `hacia`. */
function parche(nu, nv, f, hacia) {
  const pos = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) pos.push(...f(i / nu, j / nv));
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, b, d, a, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const n = g.attributes.normal; let s = 0; for (let i = 0; i < n.count; i++) s += n.getX(i) * hacia[0] + n.getY(i) * hacia[1] + n.getZ(i) * hacia[2];
  if (s < 0) { for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } g.setIndex(idx); g.computeVertexNormals(); }
  return g;
}
/**
 * Una piel tendida sobre cuadernas, como el casco de un bote: así salen las carrocerías, los capós, las capotas y los
 * guardabarros. Cada cuaderna, en su z: de la altura `a` a la `b`, con medio ancho `w` abajo y `v` arriba (si no se
 * dice, igual), centrada en `x`. El contorno es una superelipse: `n` dice qué tan cuadrada es la mitad de arriba y `m`
 * la de abajo (2 es un óvalo, 8 casi una caja), y `c`, a qué altura queda lo más ancho (0: abajo de todo, con el piso plano).
 */
function piel(cuadernas, M = 12) {
  const C = cuadernas.map((c) => ({ x: 0, n: 3, c: 0.5, ...c, v: c.v ?? c.w, m: c.m ?? c.n ?? 3 })).sort((p, q) => p.z - q.z), CAMPOS = ['z', 'a', 'b', 'w', 'v', 'n', 'm', 'c', 'x'];
  const en = (z) => { let i = 0; while (i < C.length - 2 && z > C[i + 1].z) i++; const p = C[i], q = C[i + 1], t = clamp((z - p.z) / (q.z - p.z), 0, 1), o = {}; for (const k of CAMPOS) o[k] = lerp(p[k], q[k], t); return o; };
  const borde = (c, t) => {
    const s = Math.sin(t), co = Math.cos(t), p = s >= 0 ? c.n : c.m, ex = Math.sign(co) * Math.abs(co) ** (2 / p), ey = Math.sign(s) * Math.abs(s) ** (2 / p), ym = lerp(c.a, c.b, c.c), y = ym + ey * (ey >= 0 ? c.b - ym : ym - c.a);
    return [c.x + ex * lerp(c.w, c.v, (y - c.a) / Math.max(1e-6, c.b - c.a)), y];
  };
  /** hasta dónde llega el costado `s` (+1 o −1) a la altura y */
  const lado = (z, y, s) => {
    const c = en(z), ym = lerp(c.a, c.b, c.c), arriba = y >= ym, p = arriba ? c.n : c.m, e = clamp(arriba ? (y - ym) / Math.max(1e-6, c.b - ym) : (ym - y) / Math.max(1e-6, ym - c.a), 0, 1);
    return c.x + s * lerp(c.w, c.v, clamp((y - c.a) / Math.max(1e-6, c.b - c.a), 0, 1)) * Math.max(0, 1 - e ** p) ** (1 / p);
  };
  /** la altura del lomo en (z, x) */
  const arriba = (z, x) => {
    const c = en(z), ym = lerp(c.a, c.b, c.c); let w = c.v, y = c.b;
    for (let i = 0; i < 4; i++) { const ex = clamp(Math.abs(x - c.x) / Math.max(1e-6, w), 0, 1); y = ym + (c.b - ym) * Math.max(0, 1 - ex ** c.n) ** (1 / c.n); w = lerp(c.w, c.v, (y - c.a) / Math.max(1e-6, c.b - c.a)); }
    return y;
  };
  const anillo = (i) => { const o = []; for (let k = 0; k < M; k++) o.push(borde(C[i], ((k + 0.5) / M) * Math.PI * 2)); return o; };
  const geo = (P, N) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); return g; };
  /** la tapa de una punta (adelante: la de más z) */
  const tapa = (adelante) => {
    const i = adelante ? C.length - 1 : 0, r = anillo(i), z = C[i].z, P = [], N = []; let cx = 0, cy = 0; for (const p of r) { cx += p[0] / M; cy += p[1] / M; }
    for (let k = 0; k < M; k++) { const p = r[k], q = r[(k + 1) % M]; P.push(cx, cy, z, ...(adelante ? [p[0], p[1], z, q[0], q[1], z] : [q[0], q[1], z, p[0], p[1], z])); N.push(0, 0, adelante ? 1 : -1, 0, 0, adelante ? 1 : -1, 0, 0, adelante ? 1 : -1); }
    return geo(P, N);
  };
  const malla = (atras = true, adelante = true) => {
    const pos = [], idx = [];
    C.forEach((c, i) => { for (const p of anillo(i)) pos.push(p[0], p[1], c.z); });
    for (let i = 0; i + 1 < C.length; i++) for (let k = 0; k < M; k++) { const a = i * M + k, b = i * M + ((k + 1) % M); idx.push(a, b, b + M, a, b + M, a + M); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const l = g.toNonIndexed(), P = Array.from(l.attributes.position.array), N = Array.from(l.attributes.normal.array);
    for (const t of [atras ? tapa(false) : null, adelante ? tapa(true) : null]) if (t) { P.push(...t.attributes.position.array); N.push(...t.attributes.normal.array); }
    return geo(P, N);
  };
  /** Algo calcado sobre un costado (un vidrio, la raya de una puerta): entre cuatro esquinas [z, y] —abajo atrás, abajo
   *  adelante, arriba adelante, arriba atrás—, despegado `sale` metros. */
  const calcoLado = (s, e, sale = 0.012, nu = 4, nv = 2) => parche(nu, nv, (u, v) => {
    const z = lerp(lerp(e[0][0], e[1][0], u), lerp(e[3][0], e[2][0], u), v), y = lerp(lerp(e[0][1], e[1][1], u), lerp(e[3][1], e[2][1], u), v);
    return [lado(z, y, s) + s * sale, y, z];
  }, [s, 0, 0]);
  /** Lo mismo sobre el lomo (el parabrisas, la luneta, el techo de lona): las esquinas son [z, x]. */
  const calcoArriba = (e, sale = 0.012, nu = 4, nv = 2) => {
    const E = 0.004, normal = (z, x) => { const gx = (arriba(z, x + E) - arriba(z, x - E)) / (2 * E), gz = (arriba(z + E, x) - arriba(z - E, x)) / (2 * E), l = Math.hypot(gx, 1, gz); return [-gx / l, 1 / l, -gz / l]; };
    const zc = (e[0][0] + e[1][0] + e[2][0] + e[3][0]) / 4, xc = (e[0][1] + e[1][1] + e[2][1] + e[3][1]) / 4;
    return parche(nu, nv, (u, v) => {
      const z = lerp(lerp(e[0][0], e[1][0], u), lerp(e[3][0], e[2][0], u), v), x = lerp(lerp(e[0][1], e[1][1], u), lerp(e[3][1], e[2][1], u), v), n = normal(z, x);
      return [x + n[0] * sale, arriba(z, x) + n[1] * sale, z + n[2] * sale];
    }, normal(zc, xc));
  };
  return { malla, tapa, calcoLado, calcoArriba, lado, arriba };
}

/** Junta piezas en una sola geometría, con lo que pide la tinta (aInfo, aWall), como en src/tren.js. */
function armar() {
  const P = [], N = [], I = [], W = [];
  let seed = 0.47;
  const add = (g, tono = NEGRO, claro = 0.13, kind = PINTADO) => {
    const n = g.index ? g.toNonIndexed() : g, p = n.attributes.position, nn = n.attributes.normal;
    seed = (seed * 7.31 + 0.173) % 1;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      // (aInfo.w = -1e5: como el avión, el coche nunca se acuesta con la ciudad ni depende del color)
      P.push(x, y, z); N.push(nn.getX(i), nn.getY(i), nn.getZ(i)); I.push(seed, kind * 10 + 1, 4, -1e5); W.push(x + z * 0.6 + 500, y, tono, claro);
    }
  };
  const hacia = (g, a, b) => g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y, new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize())).translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  const largo = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const T = {
    add,
    /** caja de w (x) × h × d (z), apoyada en y, centrada en (x, z) */
    caja: (w, h, d, x, y, z, tono, claro, kind) => add(new THREE.BoxGeometry(w, h, d).translate(x, y + h / 2, z), tono, claro, kind),
    /** un caño de a hasta b, de radio r en a y r2 en b */
    barra: (a, b, r, tono, claro, r2 = r, caras = 6) => add(hacia(new THREE.CylinderGeometry(r2, r, largo(a, b), caras), a, b), tono, claro),
    /** un listón de a hasta b, de w (a lo largo del coche) por t */
    viga: (a, b, w, t, tono, claro) => add(hacia(new THREE.BoxGeometry(t, largo(a, b), w), a, b), tono, claro),
    bola: (r, x, y, z, tono, claro, e = [1, 1, 1]) => add(new THREE.SphereGeometry(r, 10, 7).scale(e[0], e[1], e[2]).translate(x, y, z), tono, claro),
    /** una cara plana que mira hacia adelante (o, con giro = π, hacia atrás) */
    cara: (w, h, x, y, z, tono, claro, kind, giro = 0) => add(new THREE.PlaneGeometry(w, h).rotateY(giro).translate(x, y, z), tono, claro, kind),
    disco: (r, x, y, z, tono, claro, kind, giro = 0) => add(new THREE.CircleGeometry(r, 12).rotateY(giro).translate(x, y, z), tono, claro, kind),
    /** una piel (ver arriba), ya agregada; devuelve con qué calcarle cosas encima */
    piel: (C, tono, claro, { M = 12, base = {}, atras = true, adelante = true } = {}) => {
      const p = piel(C.map((c) => ({ ...base, ...c })), M); add(p.malla(atras, adelante), tono, claro);
      return {
        lado: (s, esq, to, cl, kind, sale, nu) => add(p.calcoLado(s, esq, sale, nu), to, cl, kind),
        lados: (esq, to, cl, kind, sale, nu) => { for (const s of [-1, 1]) add(p.calcoLado(s, esq, sale, nu), to, cl, kind); },
        arriba: (esq, to, cl, kind, sale, nu) => add(p.calcoArriba(esq, sale, nu), to, cl, kind),
        tapa: (adelante, to, cl, kind) => add(p.tapa(adelante), to, cl, kind),
      };
    },
    /** un guardabarros de chapa: una cinta combada que sigue el perfil [z, alto] */
    aleta: (x, perfil, w, tono, claro, grosor = 0.045) => {
      const f = curva(perfil), z0 = perfil[0][0], z1 = perfil[perfil.length - 1][0], k = Math.ceil((z1 - z0) / 0.14), C = [];
      for (let i = 0; i <= k; i++) { const z = lerp(z0, z1, i / k), b = f(z); C.push({ z, a: b - grosor, b, w, x, n: 2, m: 30, c: 0 }); }
      add(piel(C, 8).malla(), tono, claro);
    },
    /** un guardabarros de bulto, de los de 1937: cerrado, con el hueco de la rueda (de radio `arco`, alrededor del eje) */
    bulto: (x, eje, r, arco, lomo, ancho, tono, claro) => {
      const fb = curva(lomo), fw = curva(ancho), z0 = lomo[0][0], z1 = lomo[lomo.length - 1][0], zs = new Set();
      for (let i = 0; i <= 12; i++) zs.add(+lerp(z0, z1, i / 12).toFixed(3));
      for (const d of [-1, -0.93, -0.72, -0.42, 0, 0.42, 0.72, 0.93, 1]) zs.add(+(eje + d * arco).toFixed(3));
      const C = [...zs].filter((z) => z >= z0 && z <= z1).sort((p, q) => p - q).map((z) => { const b = fb(z), dz = Math.abs(z - eje); return { z, a: Math.min(r + Math.sqrt(Math.max(0, arco * arco - dz * dz)), b - 0.035), b, w: fw(z), x, n: 2.3, m: 20, c: 0.15 }; });
      add(piel(C, 10).malla(), tono, claro);
    },
    geometria() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aInfo', new THREE.Float32BufferAttribute(I, 4)); g.setAttribute('aWall', new THREE.Float32BufferAttribute(W, 4));
      return g;
    },
  };
  return T;
}

/** Una rueda, con el eje a lo largo de x y el centro en el origen (las dos caras iguales: sirve de los dos lados).
 *  tipo: 'madera' (rayos de artillería), 'alambre' o 'disco' (de chapa, con su taza). */
function rueda({ r, goma, tipo = 'madera', rayos = 12, pinta = [MADERA, 0.5], cubierta = [GOMA, 0.22], taza = [NEGRO, 0.15] }) {
  const T = armar(), ri = r - 2 * goma, giro = (g, a) => g.rotateX(a);
  T.add(new THREE.TorusGeometry(r - goma, goma, 6, 20).rotateY(Math.PI / 2), ...cubierta);
  if (tipo === 'disco') {
    T.add(new THREE.CylinderGeometry(ri + 0.012, ri + 0.012, goma * 1.3, 18).rotateZ(Math.PI / 2), ...pinta);
    for (const s of [-1, 1]) {
      T.add(new THREE.SphereGeometry(ri * 0.5, 10, 6).scale(0.3, 1, 1).translate(s * goma * 0.6, 0, 0), ...taza);
      for (let k = 0; k < 8; k++) T.add(giro(new THREE.BoxGeometry(0.012, 0.028, 0.07).translate(s * goma * 0.65, ri * 0.74, 0), (k / 8) * Math.PI * 2), 0, 0, TINTA);
    }
  } else {
    const fino = tipo === 'alambre', cubo = fino ? 0.05 : 0.06, L = ri - cubo;
    T.add(new THREE.TorusGeometry(ri - 0.006, fino ? 0.018 : 0.024, 4, 20).rotateY(Math.PI / 2), ...pinta); // la llanta
    T.add(new THREE.CylinderGeometry(cubo, cubo, fino ? 0.15 : 0.17, 10).rotateZ(Math.PI / 2), ...taza);
    for (let k = 0; k < rayos; k++) {
      // (los de alambre van cruzados, de las puntas del cubo a la llanta; los de madera, derechos y gruesos)
      const g = fino ? new THREE.CylinderGeometry(0.008, 0.008, L, 4, 1, true).translate(0, cubo + L / 2, 0).rotateZ((k % 2 ? -1 : 1) * 0.13).rotateX(k % 2 ? 0.25 : -0.25) : new THREE.BoxGeometry(0.03, L, 0.036).translate(0, cubo + L / 2, 0);
      T.add(giro(g, (k / rayos) * Math.PI * 2), ...pinta);
    }
  }
  return T.geometria();
}
/** El volante: un aro con sus rayos, con el eje a lo largo de y. */
function aro(r) {
  const T = armar();
  T.add(new THREE.TorusGeometry(r, 0.014, 5, 16).rotateX(Math.PI / 2), NEGRO, 0.2);
  for (let k = 0; k < 4; k++) T.add(new THREE.BoxGeometry(0.016, 0.012, r).translate(0, 0, r / 2).rotateY((k / 4) * Math.PI * 2 + Math.PI / 4), NEGRO, 0.2);
  T.add(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 8), BRONCE, 0.8);
  return T.geometria();
}
/** El caballo: mira hacia +z, con los cascos en el suelo. El cuerpo es una pieza; las patas van aparte (se mueven). */
function caballo(pelo) {
  const T = armar(), CRIN = [NEGRO, 0.12];
  T.piel([{ z: -0.68, a: 1.14, b: 1.46, w: 0.12 }, { z: -0.5, a: 0.93, b: 1.54, w: 0.25 }, { z: -0.1, a: 0.86, b: 1.47, w: 0.28 }, { z: 0.35, a: 0.88, b: 1.5, w: 0.26 }, { z: 0.6, a: 1.0, b: 1.53, w: 0.2 }, { z: 0.72, a: 1.14, b: 1.5, w: 0.1 }], ...pelo, { M: 10, base: { n: 2.2 } });
  T.barra([0, 1.34, 0.52], [0, 1.99, 0.98], 0.2, ...pelo, 0.11, 8); // el cogote
  T.barra([0, 2.03, 0.92], [0, 1.6, 1.33], 0.125, ...pelo, 0.065, 8); // la cabeza
  for (const s of [-1, 1]) T.barra([s * 0.06, 2.03, 0.9], [s * 0.085, 2.18, 0.87], 0.035, ...pelo, 0.004, 4);
  T.viga([0, 1.5, 0.43], [0, 2.07, 0.86], 0.1, 0.03, ...CRIN); // la crin
  T.barra([0, 1.44, -0.67], [0, 0.8, -0.84], 0.055, ...CRIN, 0.02, 6); // la cola
  // el arnés: la pechera, la cincha y la retranca
  T.add(new THREE.TorusGeometry(0.25, 0.04, 5, 12).scale(0.95, 1.25, 1).rotateX(-0.5).translate(0, 1.36, 0.56), ...CRIN);
  T.add(new THREE.TorusGeometry(0.285, 0.022, 4, 12).scale(1, 1.14, 1).translate(0, 1.17, 0.12), ...CRIN);
  const muslo = armar(); muslo.barra([0, 0.04, 0], [0, -0.5, 0], 0.09, ...pelo, 0.05, 7);
  const caña = armar(); caña.barra([0, 0, 0], [0, -0.42, 0], 0.046, ...pelo, 0.034, 6); caña.barra([0, -0.41, 0.005], [0, -0.5, 0.02], 0.045, ...CRIN, 0.058, 6);
  return { cuerpo: T.geometria(), muslo: muslo.geometria(), caña: caña.geometria() };
}

// ---------- los coches ----------
// Todos miran hacia +z (la derecha queda en −x), con el suelo en y = 0 y el origen en el medio entre los ejes.

/** La volanta de 1867, la rioplatense: cuatro ruedas (las de atrás más altas), la caja con dos asientos enfrentados,
 *  la capota de cuero armada encima y el pescante adelante. Medidas a ojo: 1,90 m entre ejes, 2,70 de largo. */
function volanta() {
  const T = armar(), E = 0.95, RD = 0.5, RT = 0.66, CH = [MADERA, 0.42], CUERO = [NEGRO, 0.2], NEG = [NEGRO, 0.12], LAT = [BRONCE, 0.8];
  T.barra([-0.7, RD, E], [0.7, RD, E], 0.03, ...NEG); T.barra([-0.7, RT, -E], [0.7, RT, -E], 0.035, ...NEG);
  T.caja(0.46, 0.06, 2.1, 0, 0.64, 0, ...NEG); // la vara que une los dos ejes
  for (const s of [-1, 1]) { T.caja(0.05, 0.05, 0.9, s * 0.46, RT + 0.04, -E, ...NEG); T.caja(0.05, 0.05, 0.7, s * 0.44, RD + 0.14, E, ...NEG); } // los elásticos
  const caja = T.piel([{ z: -1.22, a: 0.94, b: 1.3, w: 0.42 }, { z: -1.06, a: 0.74, b: 1.36, w: 0.54 }, { z: -0.3, a: 0.68, b: 1.3, w: 0.55 }, { z: 0.4, a: 0.72, b: 1.3, w: 0.53 }, { z: 0.56, a: 0.86, b: 1.26, w: 0.44 }], ...CH, { base: { n: 5, m: 3, c: 0.6 } });
  caja.arriba([[-1.0, -0.46], [-1.0, 0.46], [0.42, 0.44], [0.42, -0.44]], 0, 0, TINTA); // adentro, a la sombra
  caja.lados([[-1.0, 1.2], [0.42, 1.2], [0.42, 1.23], [-1.0, 1.23]], ...LAT, PINTADO, 0.008);
  for (const z of [-0.52, 0.02]) caja.lados([[z, 0.76], [z + 0.012, 0.76], [z + 0.012, 1.2], [z, 1.2]], 0, 0, TINTA, 0.005, 1); // la portezuela
  // los dos respaldos, uno frente al otro
  for (const [z, b] of [[-1.06, 1.66], [0.34, 1.6]]) T.piel([{ z: z - 0.07, a: 1.24, b, w: 0.47 }, { z: z + 0.07, a: 1.24, b, w: 0.47 }], ...CUERO, { M: 10, base: { n: 3, c: 0 } });
  // la capota: cerrada atrás, abierta adelante, sobre sus cuatro parantes
  T.piel([{ z: -1.26, a: 1.3, b: 1.98, w: 0.5 }, { z: -1.1, a: 1.3, b: 2.22, w: 0.57 }, { z: -0.6, a: 1.6, b: 2.32, w: 0.58 }, { z: 0.0, a: 2.08, b: 2.32, w: 0.58 }, { z: 0.44, a: 2.2, b: 2.29, w: 0.56 }], ...CUERO, { base: { n: 3, c: 0 } });
  for (const s of [-1, 1]) {
    T.barra([s * 0.52, 1.28, 0.4], [s * 0.54, 2.22, 0.42], 0.016, ...NEG); T.barra([s * 0.54, 1.3, -0.36], [s * 0.56, 2.0, -0.2], 0.016, ...NEG);
    T.caja(0.09, 0.16, 0.09, s * 0.5, 1.42, 0.62, ...LAT); // los faroles
    T.caja(0.26, 0.03, 0.22, s * 0.62, 0.52, -0.24, ...NEG); T.barra([s * 0.6, 0.53, -0.24], [s * 0.52, 0.76, -0.24], 0.012, ...NEG); // el estribo
  }
  // el pescante, sobre su cajón, y la tabla de los pies
  T.piel([{ z: 0.56, a: 0.86, b: 1.38, w: 0.4 }, { z: 1.12, a: 0.98, b: 1.38, w: 0.38 }], ...CH, { base: { n: 6, m: 3, c: 0.6 } });
  T.caja(0.8, 0.1, 0.42, 0, 1.38, 0.82, ...CUERO); T.viga([0, 1.0, 1.14], [0, 1.4, 1.32], 0.03, 0.78, ...CH);
  const gd = rueda({ r: RD, goma: 0.02, rayos: 12, pinta: [ROJO, 0.4], cubierta: [NEGRO, 0.1] }), gt = rueda({ r: RT, goma: 0.02, rayos: 14, pinta: [ROJO, 0.4], cubierta: [NEGRO, 0.1] });
  return { geo: T.geometria(), ruedas: [...[-1, 1].map((s) => ({ geo: gd, x: s * 0.7, z: E, r: RD, dobla: true })), ...[-1, 1].map((s) => ({ geo: gt, x: s * 0.7, z: -E, r: RT }))], tiro: { z: E + 0.2, lejos: 2.2, alto: 0.95, pelo: [MADERA, 0.4] } };
}
/** El coche de plaza de 1888: una victoria, baja en el medio para subir de un paso, con el pescante adelante.
 *  Medidas a ojo: 1,75 m entre ejes. */
function victoria() {
  const T = armar(), E = 0.875, RD = 0.46, RT = 0.58, CH = [NEGRO, 0.14], CUERO = [NEGRO, 0.21], NEG = [NEGRO, 0.1], LAT = [BRONCE, 0.8], PANA = [ROJO, 0.36];
  T.barra([-0.66, RD, E], [0.66, RD, E], 0.03, ...NEG); T.barra([-0.66, RT, -E], [0.66, RT, -E], 0.03, ...NEG);
  T.caja(0.5, 0.06, 2.0, 0, 0.6, 0, ...NEG);
  const caja = T.piel([{ z: -1.3, a: 1.0, b: 1.2, w: 0.38 }, { z: -1.0, a: 0.72, b: 1.12, w: 0.52 }, { z: -0.35, a: 0.5, b: 0.96, w: 0.53 }, { z: 0.3, a: 0.5, b: 0.74, w: 0.5 }, { z: 0.62, a: 0.82, b: 1.24, w: 0.42 }, { z: 1.2, a: 1.0, b: 1.28, w: 0.4 }], ...CH, { base: { n: 5, m: 3, c: 0.6 } });
  caja.arriba([[-0.95, -0.44], [-0.95, 0.44], [0.25, 0.42], [0.25, -0.42]], 0, 0, TINTA);
  T.caja(0.94, 0.14, 0.5, 0, 0.98, -0.88, ...PANA); // el asiento, de pana
  T.piel([{ z: -1.2, a: 1.08, b: 1.5, w: 0.47 }, { z: -1.08, a: 1.08, b: 1.52, w: 0.47 }], ...PANA, { M: 10, base: { n: 3, c: 0 } });
  // la capota, a medio levantar
  T.piel([{ z: -1.36, a: 1.14, b: 1.74, w: 0.5 }, { z: -1.14, a: 1.2, b: 2.0, w: 0.57 }, { z: -0.6, a: 1.5, b: 2.06, w: 0.58 }, { z: -0.3, a: 1.86, b: 2.04, w: 0.57 }], ...CUERO, { base: { n: 3, c: 0 } });
  T.caja(0.8, 0.12, 0.4, 0, 1.28, 0.9, ...CUERO); T.caja(0.8, 0.22, 0.04, 0, 1.38, 0.68, ...CUERO); // el pescante
  T.viga([0, 1.08, 1.3], [0, 1.5, 1.42], 0.03, 0.8, ...CUERO); // el guardabarro
  for (const s of [-1, 1]) {
    T.aleta(s * 0.68, [[-E - 0.62, 0.9], [-E - 0.3, 1.2], [-E, 1.26], [-E + 0.42, 1.12], [-E + 0.64, 0.84]], 0.09, ...NEG, 0.03);
    T.aleta(s * 0.68, [[E - 0.5, 0.78], [E - 0.2, 0.98], [E, 1.01], [E + 0.34, 0.94]], 0.09, ...NEG, 0.03);
    T.caja(0.09, 0.17, 0.09, s * 0.48, 1.3, 0.66, ...LAT); T.caja(0.24, 0.03, 0.2, s * 0.6, 0.48, 0.1, ...NEG);
  }
  const gd = rueda({ r: RD, goma: 0.018, rayos: 12, pinta: [OCRE, 0.78], cubierta: [NEGRO, 0.1] }), gt = rueda({ r: RT, goma: 0.018, rayos: 14, pinta: [OCRE, 0.78], cubierta: [NEGRO, 0.1] });
  return { geo: T.geometria(), ruedas: [...[-1, 1].map((s) => ({ geo: gd, x: s * 0.68, z: E, r: RD, dobla: true })), ...[-1, 1].map((s) => ({ geo: gt, x: s * 0.68, z: -E, r: RT }))], tiro: { z: E + 0.2, lejos: 2.2, alto: 0.95, pelo: [LONA, 0.86] } };
}
/** El cupé de 1895: la cabina cerrada, con sus ventanillas, y el cochero afuera, en el pescante. Medidas a ojo. */
function cupe() {
  const T = armar(), E = 0.78, RD = 0.45, RT = 0.6, CH = [VERDE, 0.3], CUERO = [NEGRO, 0.2], NEG = [NEGRO, 0.1], LAT = [BRONCE, 0.8];
  T.barra([-0.66, RD, E], [0.66, RD, E], 0.03, ...NEG); T.barra([-0.66, RT, -E], [0.66, RT, -E], 0.03, ...NEG);
  T.caja(0.5, 0.06, 1.9, 0, 0.62, 0.05, ...NEG);
  const cab = T.piel([{ z: -1.1, a: 0.84, b: 1.86, w: 0.48 }, { z: -0.98, a: 0.64, b: 1.98, w: 0.56 }, { z: 0.16, a: 0.64, b: 1.98, w: 0.56 }, { z: 0.3, a: 0.7, b: 1.94, w: 0.53 }], ...CH, { M: 14, base: { n: 7, m: 3.5, c: 0.5 } });
  cab.arriba([[-1.0, -0.5], [-1.0, 0.5], [0.24, 0.5], [0.24, -0.5]], ...CUERO, PINTADO, 0.006); // el techo, de cuero
  cab.lados([[-0.5, 1.3], [0.12, 1.3], [0.12, 1.78], [-0.5, 1.78]], 0, 0, TINTA); // la ventanilla de la portezuela
  cab.lados([[-0.52, 0.72], [-0.506, 0.72], [-0.506, 1.84], [-0.52, 1.84]], 0, 0, TINTA, 0.005, 1); cab.lados([[0.14, 0.72], [0.154, 0.72], [0.154, 1.84], [0.14, 1.84]], 0, 0, TINTA, 0.005, 1);
  cab.lados([[-1.02, 1.24], [0.26, 1.24], [0.26, 1.27], [-1.02, 1.27]], ...NEG, PINTADO, 0.008);
  T.cara(0.84, 0.44, 0, 1.56, 0.306, 0, 0, TINTA); T.cara(0.5, 0.3, 0, 1.58, -1.106, 0, 0, TINTA, Math.PI);
  for (const s of [-1, 1]) { T.caja(0.03, 0.03, 0.1, s * 0.585, 1.18, -0.42, ...LAT); T.caja(0.1, 0.2, 0.1, s * 0.6, 1.5, 0.4, ...LAT); }
  // el pescante, sobre su caja, y el guardabarro
  T.piel([{ z: 0.3, a: 0.7, b: 1.3, w: 0.42 }, { z: 1.02, a: 0.86, b: 1.3, w: 0.4 }], ...CH, { base: { n: 6, m: 3, c: 0.6 } });
  T.caja(0.82, 0.12, 0.42, 0, 1.3, 0.62, ...CUERO); T.viga([0, 1.02, 1.04], [0, 1.44, 1.2], 0.03, 0.8, ...CUERO);
  for (const s of [-1, 1]) { T.aleta(s * 0.68, [[-E - 0.6, 0.95], [-E - 0.3, 1.22], [-E, 1.28], [-E + 0.42, 1.14], [-E + 0.62, 0.9]], 0.09, ...NEG, 0.03); T.caja(0.22, 0.03, 0.2, s * 0.62, 0.5, -0.2, ...NEG); }
  const gd = rueda({ r: RD, goma: 0.018, rayos: 12, pinta: [MADERA, 0.5], cubierta: [NEGRO, 0.1] }), gt = rueda({ r: RT, goma: 0.018, rayos: 14, pinta: [MADERA, 0.5], cubierta: [NEGRO, 0.1] });
  return { geo: T.geometria(), ruedas: [...[-1, 1].map((s) => ({ geo: gd, x: s * 0.68, z: E, r: RD, dobla: true })), ...[-1, 1].map((s) => ({ geo: gt, x: s * 0.68, z: -E, r: RT }))], tiro: { z: E + 0.25, lejos: 2.2, alto: 0.95, pelo: [NEGRO, 0.2] } };
}
/** La voiturette De Dion-Bouton de c. 1904 («Populaire»): dos asientos, el capó en pendiente y el radiador de tubos
 *  colgado adelante. 1,90 m entre ejes, 2,75 de largo, ruedas de 700 (medidas a ojo, de memoria). */
function voiturette() {
  const T = armar(), E = 0.95, R = 0.35, CH = [ROJO, 0.36], CUERO = [NEGRO, 0.2], NEG = [NEGRO, 0.12], LAT = [BRONCE, 0.8];
  T.caja(0.62, 0.07, 2.3, 0, 0.42, 0, ...NEG);
  T.barra([-0.55, R, E], [0.55, R, E], 0.025, ...NEG); T.barra([-0.55, R, -E], [0.55, R, -E], 0.03, ...NEG); T.bola(0.1, 0, R, -E, ...NEG);
  for (const s of [-1, 1]) for (const z of [E, -E]) T.caja(0.04, 0.04, 0.7, s * 0.36, R + 0.03, z, ...NEG); // los elásticos
  const capo = T.piel([{ z: 0.5, a: 0.48, b: 0.98, w: 0.28 }, { z: 1.12, a: 0.48, b: 0.78, w: 0.23 }, { z: 1.2, a: 0.5, b: 0.68, w: 0.19 }], ...CH, { M: 10, base: { n: 3, m: 12, c: 0.4 } });
  for (let i = 0; i < 5; i++) { const z = 0.62 + i * 0.08; capo.lados([[z, 0.6], [z + 0.022, 0.6], [z + 0.022, 0.8 - i * 0.02], [z, 0.8 - i * 0.02]], 0, 0, TINTA, 0.006, 1); }
  // el radiador: un serpentín de tubos con aletas, abajo y adelante
  T.caja(0.6, 0.17, 0.07, 0, 0.26, 1.24, ...LAT); for (let i = 0; i < 3; i++) T.cara(0.56, 0.018, 0, 0.3 + i * 0.045, 1.277, 0, 0, TINTA);
  T.caja(0.92, 0.52, 0.03, 0, 0.5, 0.49, MADERA, 0.5); // el tablero, de madera
  const caja = T.piel([{ z: -1.08, a: 0.52, b: 0.9, w: 0.4 }, { z: -0.6, a: 0.48, b: 0.96, w: 0.5 }, { z: 0.08, a: 0.48, b: 0.9, w: 0.5 }, { z: 0.47, a: 0.48, b: 0.62, w: 0.46 }], ...CH, { base: { n: 6, m: 4, c: 0.6 } });
  caja.lados([[-0.95, 0.6], [-0.2, 0.6], [-0.2, 0.615], [-0.95, 0.615]], ...LAT, PINTADO, 0.008, 2);
  T.caja(0.9, 0.11, 0.46, 0, 0.9, -0.28, ...CUERO); // el asiento, capitoné
  T.piel([{ z: -0.66, a: 0.92, b: 1.3, w: 0.5 }, { z: -0.5, a: 0.92, b: 1.32, w: 0.5 }], ...CUERO, { M: 10, base: { n: 3, c: 0 } });
  for (const s of [-1, 1]) {
    T.piel([{ z: -0.56, a: 0.92, b: 1.2, w: 0.04, x: s * 0.47 }, { z: -0.1, a: 0.92, b: 1.06, w: 0.04, x: s * 0.47 }], ...CUERO, { M: 8, base: { n: 3, c: 0 } });
    T.aleta(s * 0.62, [[0.48, 0.42], [0.62, 0.62], [E, 0.8], [E + 0.3, 0.72], [E + 0.42, 0.56]], 0.1, ...NEG, 0.03);
    T.aleta(s * 0.62, [[-E - 0.42, 0.56], [-E - 0.25, 0.74], [-E, 0.8], [-0.62, 0.66], [-0.46, 0.42]], 0.1, ...NEG, 0.03);
    T.caja(0.2, 0.03, 0.9, s * 0.6, 0.4, 0.02, ...NEG); // el estribo
    T.caja(0.1, 0.15, 0.1, s * 0.52, 0.92, 0.57, ...LAT); T.disco(0.04, s * 0.52, 1.0, 0.622, BLANCO, 0.95); // los faroles
  }
  T.barra([-0.22, 0.5, 0.42], [-0.22, 1.2, 0.2], 0.018, ...LAT);
  const g = rueda({ r: R, goma: 0.04, rayos: 10, pinta: [OCRE, 0.78], cubierta: [LONA, 0.7] }); // (las cubiertas de entonces eran claras)
  return { geo: T.geometria(), ruedas: [1, -1].flatMap((d) => [-1, 1].map((s) => ({ geo: g, x: s * 0.575, z: d * E, r: R, dobla: d > 0 }))), volante: { p: [-0.22, 1.22, 0.195], incl: 0.3, r: 0.18 } };
}
/** El doble faetón de 1910: un automóvil europeo de quince o veinte caballos, sin marca (ver arriba). Capó largo,
 *  radiador y faroles de latón, tablero de madera, el asiento de atrás más ancho y más alto que el de adelante, capota
 *  de lona con sus correas, y por afuera, a la derecha, las palancas y las dos cubiertas de repuesto. Medidas a ojo, las
 *  corrientes de entonces: 2,90 m entre ejes, 4,05 de largo, 1,66 de ancho, ruedas de 870. */
function faeton() {
  const T = armar(), E = 1.45, R = 0.435, CH = [VERDE, 0.3], NEG = [NEGRO, 0.11], LAT = [BRONCE, 0.8], CAP = [LONA, 0.82], CUERO = [NEGRO, 0.2];
  // el bastidor, los ejes y los elásticos
  T.caja(0.8, 0.1, 3.7, 0, 0.56, -0.05, ...NEG);
  T.barra([-0.66, 0.42, E], [0.66, 0.42, E], 0.03, ...NEG); T.barra([-0.66, R, -E], [0.66, R, -E], 0.04, ...NEG); T.bola(0.14, 0, R, -E, ...NEG);
  for (const s of [-1, 1]) for (const z of [E, -E]) T.caja(0.05, 0.05, 0.95, s * 0.42, R + 0.06, z, ...NEG);
  // el radiador, de panal, y su tapa
  T.piel([{ z: E + 0.02, a: 0.66, b: 1.32, w: 0.27 }, { z: E + 0.13, a: 0.66, b: 1.32, w: 0.27 }], ...LAT, { base: { n: 5, m: 8, c: 0.5 } });
  T.cara(0.44, 0.52, 0, 0.98, E + 0.134, 0, 0, TINTA); T.barra([0, 1.31, E + 0.075], [0, 1.38, E + 0.075], 0.035, ...LAT, 0.03, 8);
  T.barra([0, 0.6, E + 0.13], [0, 0.6, E + 0.28], 0.012, ...NEG); T.barra([0, 0.6, E + 0.275], [0.11, 0.52, E + 0.275], 0.012, ...NEG); // la manija
  // el capó, largo, con sus persianas y la bisagra de latón a lo largo
  const capo = T.piel([{ z: 0.55, a: 0.66, b: 1.3, w: 0.3 }, { z: E + 0.02, a: 0.66, b: 1.3, w: 0.26 }], ...CH, { base: { n: 3, m: 10, c: 0.55 }, adelante: false });
  for (let i = 0; i < 8; i++) { const z = 0.7 + i * 0.085; capo.lados([[z, 0.84], [z + 0.022, 0.84], [z + 0.022, 1.08], [z, 1.08]], 0, 0, TINTA, 0.006, 1); }
  capo.arriba([[0.57, -0.009], [0.57, 0.009], [E, 0.009], [E, -0.009]], ...LAT, PINTADO, 0.006, 4);
  T.caja(1.08, 0.72, 0.04, 0, 0.66, 0.51, MADERA, 0.5); // el tablero
  // la caja: adelante angosta, atrás ancha y redonda
  const caja = T.piel([{ z: -2.0, a: 0.92, b: 1.3, w: 0.44 }, { z: -1.86, a: 0.74, b: 1.42, w: 0.62 }, { z: -1.25, a: 0.66, b: 1.4, w: 0.66 }, { z: -0.74, a: 0.66, b: 1.27, w: 0.58 }, { z: -0.1, a: 0.66, b: 1.27, w: 0.56 }, { z: 0.5, a: 0.66, b: 1.25, w: 0.52 }], ...CH, { M: 14, base: { n: 6, m: 4, c: 0.6 } });
  caja.arriba([[-1.74, -0.54], [-1.74, 0.54], [0.2, 0.44], [0.2, -0.44]], 0, 0, TINTA); // adentro, a la sombra
  for (const z of [-1.3, -0.76]) caja.lados([[z, 0.72], [z + 0.012, 0.72], [z + 0.012, 1.26], [z, 1.26]], 0, 0, TINTA, 0.005, 1); // la puerta de atrás (adelante no hay)
  for (const [z, w, b] of [[-0.5, 0.52, 1.5], [-1.8, 0.6, 1.64]]) T.piel([{ z: z - 0.1, a: 1.14, b, w }, { z: z + 0.08, a: 1.14, b: b - 0.02, w: w - 0.01 }], ...CUERO, { M: 10, base: { n: 3, c: 0 } }); // los respaldos, capitoné
  // el parabrisas: el marco solo, de latón
  for (const s of [-1, 1]) T.viga([s * 0.5, 1.26, 0.44], [s * 0.5, 1.86, 0.36], 0.03, 0.03, ...LAT);
  for (const [y, z] of [[1.28, 0.438], [1.57, 0.4], [1.86, 0.36]]) T.viga([-0.5, y, z], [0.5, y, z], 0.03, 0.03, ...LAT);
  // la capota de lona, con su cortina de atrás, sus varillas y las correas que la atan a los guardabarros
  T.piel([{ z: -2.05, a: 1.84, b: 1.91, w: 0.62 }, { z: -1.85, a: 1.89, b: 1.97, w: 0.66 }, { z: 0.25, a: 1.89, b: 1.97, w: 0.64 }, { z: 0.55, a: 1.86, b: 1.92, w: 0.6 }], ...CAP, { M: 10, base: { n: 2.4, m: 14, c: 0.3 } });
  T.piel([{ z: -2.07, a: 1.36, b: 1.88, w: 0.6 }, { z: -2.01, a: 1.36, b: 1.9, w: 0.62 }], ...CAP, { M: 10, base: { n: 8 } }); T.cara(0.5, 0.16, 0, 1.64, -2.076, 0, 0, TINTA, Math.PI);
  for (const s of [-1, 1]) {
    for (const [za, zb] of [[-1.5, -1.95], [-1.5, -0.9], [-0.5, -0.15]]) T.barra([s * 0.64, 1.36, za], [s * 0.63, 1.9, zb], 0.014, ...NEG, 0.014, 5);
    T.barra([s * 0.6, 1.88, 0.52], [s * 0.7, 0.96, E + 0.12], 0.008, ...NEG, 0.008, 4);
    // los guardabarros y el estribo
    T.aleta(s * 0.7, [[0.62, 0.5], [0.78, 0.6], [1.1, 0.9], [E, 0.97], [E + 0.3, 0.93], [E + 0.5, 0.74]], 0.13, ...NEG, 0.03);
    T.aleta(s * 0.7, [[-E - 0.5, 0.68], [-E - 0.3, 0.9], [-E, 0.97], [-1.12, 0.9], [-0.9, 0.66], [-0.74, 0.5]], 0.13, ...NEG, 0.03);
    T.caja(0.3, 0.035, 1.5, s * 0.7, 0.465, -0.06, ...NEG); T.caja(0.02, 0.2, 1.46, s * 0.555, 0.47, -0.06, ...NEG);
    // los faros de acetileno y los faroles del tablero
    T.barra([s * 0.4, 1.0, E + 0.02], [s * 0.4, 1.0, E + 0.2], 0.1, ...LAT, 0.125, 10); T.disco(0.115, s * 0.4, 1.0, E + 0.202, BLANCO, 0.95);
    T.barra([s * 0.4, 0.6, E + 0.08], [s * 0.4, 0.9, E + 0.08], 0.014, ...NEG);
    T.caja(0.08, 0.14, 0.08, s * 0.56, 1.22, 0.5, ...LAT);
  }
  // a la derecha, por afuera: las palancas del freno y de los cambios, la bocina de pera y las cubiertas de repuesto
  T.barra([-0.6, 0.6, -0.02], [-0.63, 1.2, 0.1], 0.014, ...LAT); T.barra([-0.66, 0.6, -0.1], [-0.69, 1.12, -0.06], 0.014, ...LAT);
  T.barra([-0.6, 1.3, 0.2], [-0.6, 1.24, 0.48], 0.02, ...LAT, 0.065, 8);
  for (const x of [-0.75, -0.84]) T.add(new THREE.TorusGeometry(R - 0.045, 0.045, 6, 18).rotateY(Math.PI / 2).translate(x, 0.49 + R, 0.36), LONA, 0.72);
  T.barra([0.72, 0.5, 0.4], [0.72, 0.8, 0.4], 0.075, ...LAT, 0.075, 8); // el generador de acetileno, en el otro estribo
  T.caja(0.07, 0.07, 0.04, 0.4, 0.86, -2.03, ROJO, 0.4);
  T.barra([-0.3, 0.96, 0.55], [-0.3, 1.42, 0.05], 0.018, ...NEG);
  const g = rueda({ r: R, goma: 0.045, rayos: 12, pinta: [MADERA, 0.5], cubierta: [LONA, 0.72] }); // (las cubiertas de entonces eran claras)
  return { geo: T.geometria(), ruedas: [1, -1].flatMap((d) => [-1, 1].map((s) => ({ geo: g, x: s * 0.7, z: d * E, r: R, dobla: d > 0 }))), volante: { p: [-0.3, 1.43, 0.04], incl: 0.8, r: 0.21 } };
}
/** El Ford T doble faetón, el de 1917 en adelante: radiador de chapa negra y torpedo curvo. 2,54 m entre ejes, 3,40 de
 *  largo, 1,68 de ancho, 1,87 de alto con la capota, ruedas de 30 pulgadas (medidas de fábrica). Va negro, que era como
 *  salía de Detroit; de qué colores se pintaban los armados acá no se pudo saber. */
function fordT() {
  const T = armar(), E = 1.27, R = 0.381;
  const CH = [NEGRO, 0.14], NEG = [NEGRO, 0.11], CAP = [NEGRO, 0.25];
  // el bastidor, los ejes y los elásticos atravesados
  T.caja(0.72, 0.1, 3.0, 0, 0.5, -0.05, ...NEG);
  T.barra([-0.66, 0.37, E], [0.66, 0.37, E], 0.03, ...NEG); T.caja(0.95, 0.05, 0.07, 0, 0.47, E, ...NEG);
  T.barra([-0.66, R, -E], [0.66, R, -E], 0.04, ...NEG); T.bola(0.13, 0, R, -E, ...NEG); T.caja(0.95, 0.05, 0.07, 0, 0.5, -E, ...NEG);
  // el radiador, con su panal y su tapa
  T.piel([{ z: E - 0.01, a: 0.68, b: 1.2, w: 0.255 }, { z: E + 0.1, a: 0.68, b: 1.2, w: 0.255 }], NEGRO, 0.17, { base: { n: 4, m: 14, c: 0.45 } });
  T.cara(0.41, 0.4, 0, 0.92, E + 0.104, 0, 0, TINTA); T.barra([0, 1.19, E + 0.045], [0, 1.26, E + 0.045], 0.035, CHAPA, 0.85, 0.03, 8);
  T.barra([0, 0.57, E + 0.1], [0, 0.57, E + 0.24], 0.012, ...NEG); T.barra([0, 0.57, E + 0.235], [0.1, 0.5, E + 0.235], 0.012, ...NEG); // la manija
  // el capó, con sus persianas
  const capo = T.piel([{ z: 0.5, a: 0.66, b: 1.21, w: 0.3 }, { z: E, a: 0.68, b: 1.185, w: 0.245 }], ...CH, { base: { n: 2.6, m: 14, c: 0.55 }, adelante: false });
  for (let i = 0; i < 6; i++) { const z = 0.66 + i * 0.075; capo.lados([[z, 0.8], [z + 0.022, 0.8], [z + 0.022, 1.0], [z, 1.0]], 0, 0, TINTA, 0.006, 1); }
  // la caja, abierta arriba; adelante, el torpedo de chapa
  const caja = T.piel([{ z: -1.7, a: 0.78, b: 1.2, w: 0.46 }, { z: -1.6, a: 0.66, b: 1.26, w: 0.57 }, { z: -1.0, a: 0.62, b: 1.25, w: 0.61 }, { z: -0.35, a: 0.62, b: 1.22, w: 0.56 }, { z: 0.26, a: 0.62, b: 1.22, w: 0.52 }, { z: 0.5, a: 0.66, b: 1.21, w: 0.31, n: 3 }], ...CH, { M: 14, base: { n: 6, m: 4, c: 0.6 } });
  caja.arriba([[-1.48, -0.5], [-1.48, 0.5], [0.16, 0.42], [0.16, -0.42]], 0, 0, TINTA); // adentro, a la sombra
  for (const z of [-0.92, -0.4, 0.2]) caja.lados([[z, 0.68], [z + 0.012, 0.68], [z + 0.012, 1.2], [z, 1.2]], 0, 0, TINTA, 0.005, 1);
  for (const [z, w, b] of [[-0.42, 0.5, 1.43], [-1.52, 0.55, 1.47]]) T.piel([{ z: z - 0.09, a: 1.1, b, w }, { z: z + 0.07, a: 1.1, b: b - 0.02, w: w - 0.01 }], NEGRO, 0.2, { M: 10, base: { n: 3, c: 0 } }); // los respaldos
  // el parabrisas: el marco solo
  for (const s of [-1, 1]) T.viga([s * 0.5, 1.2, 0.36], [s * 0.5, 1.75, 0.3], 0.03, 0.03, ...NEG);
  for (const [y, z] of [[1.22, 0.358], [1.48, 0.33], [1.75, 0.3]]) T.viga([-0.5, y, z], [0.5, y, z], 0.03, 0.03, ...NEG);
  // la capota, con su cortina de atrás y sus varillas
  T.piel([{ z: -1.75, a: 1.74, b: 1.81, w: 0.6 }, { z: -1.55, a: 1.79, b: 1.87, w: 0.64 }, { z: 0.2, a: 1.79, b: 1.87, w: 0.63 }, { z: 0.46, a: 1.76, b: 1.82, w: 0.6 }], ...CAP, { M: 10, base: { n: 2.4, m: 14, c: 0.3 } });
  T.piel([{ z: -1.77, a: 1.22, b: 1.78, w: 0.58 }, { z: -1.71, a: 1.22, b: 1.8, w: 0.6 }], ...CAP, { M: 10, base: { n: 8 } }); T.cara(0.46, 0.15, 0, 1.55, -1.776, 0, 0, TINTA, Math.PI);
  for (const s of [-1, 1]) for (const [za, zb] of [[-1.3, -1.66], [-1.3, -0.8], [-0.42, -0.1]]) T.barra([s * 0.6, 1.24, za], [s * 0.61, 1.8, zb], 0.014, ...NEG, 0.014, 5);
  for (const s of [-1, 1]) {
    // los guardabarros y el estribo
    T.aleta(s * 0.71, [[0.6, 0.45], [0.74, 0.54], [0.98, 0.8], [E, 0.87], [E + 0.27, 0.83], [E + 0.44, 0.66]], 0.13, ...NEG, 0.05);
    T.aleta(s * 0.71, [[-E - 0.46, 0.6], [-E - 0.28, 0.8], [-E, 0.87], [-1.0, 0.8], [-0.8, 0.6], [-0.64, 0.45]], 0.13, ...NEG, 0.05);
    T.caja(0.3, 0.035, 1.28, s * 0.69, 0.415, -0.02, ...NEG); T.caja(0.02, 0.2, 1.24, s * 0.545, 0.43, -0.02, ...NEG);
    // los faros, eléctricos, y los faroles del torpedo
    T.barra([s * 0.37, 0.93, E], [s * 0.37, 0.93, E + 0.16], 0.1, ...NEG, 0.11, 10); T.disco(0.1, s * 0.37, 0.93, E + 0.162, BLANCO, 0.95);
    T.barra([s * 0.37, 0.58, E + 0.06], [s * 0.37, 0.84, E + 0.06], 0.014, ...NEG);
    T.caja(0.07, 0.12, 0.07, s * 0.54, 1.17, 0.4, ...NEG);
  }
  T.caja(0.07, 0.07, 0.04, 0.38, 0.8, -1.73, ROJO, 0.4);
  T.barra([-0.3, 0.9, 0.5], [-0.3, 1.32, 0.02], 0.018, ...NEG);
  const g = rueda({ r: R, goma: 0.043, rayos: 12, pinta: [NEGRO, 0.2], cubierta: [GOMA, 0.22] });
  return { geo: T.geometria(), ruedas: [1, -1].flatMap((d) => [-1, 1].map((s) => ({ geo: g, x: s * 0.71, z: d * E, r: R, dobla: d > 0 }))), volante: { p: [-0.3, 1.33, 0.01], incl: 0.85, r: 0.2 } };
}
/** El Ford V8 de 1937, sedán de cuatro puertas («Fordor», de cola en pendiente): 2,845 m entre ejes (de fábrica); el
 *  resto a ojo: 4,56 de largo, 1,77 de ancho, 1,74 de alto, cubiertas 6.00-16. La trompa en punta con sus barras cromadas, los faros metidos en
 *  los guardabarros y el techo de chapa de una pieza. */
function fordV8() {
  const T = armar(), E = 1.4225, R = 0.355, CH = [ROJO, 0.3], CR = [CHAPA, 0.9], NEG = [NEGRO, 0.11];
  T.caja(1.0, 0.14, 3.7, 0, 0.26, 0, ...NEG);
  // la carrocería, de la cola a la trompa en punta
  const bajo = T.piel([
    { z: -2.24, a: 0.52, b: 0.74, w: 0.4 }, { z: -2.1, a: 0.44, b: 0.9, w: 0.6 }, { z: -1.75, a: 0.4, b: 1.04, w: 0.74 }, { z: -1.2, a: 0.38, b: 1.08, w: 0.8 }, { z: 0, a: 0.38, b: 1.08, w: 0.81 }, { z: 0.6, a: 0.4, b: 1.1, w: 0.74, n: 6 },
    { z: 0.78, a: 0.42, b: 1.1, w: 0.6, n: 4 }, { z: 1.3, a: 0.46, b: 1.07, w: 0.44, n: 3 }, { z: 1.8, a: 0.48, b: 1.02, w: 0.33, n: 2.8 }, { z: 2.02, a: 0.5, b: 0.97, w: 0.2, n: 2.6 }, { z: 2.1, a: 0.54, b: 0.9, w: 0.07, n: 2.4 },
  ], ...CH, { M: 14, base: { n: 7, m: 3.5, c: 0.55 } });
  // la cabina y el techo, de una pieza, que baja en pendiente hasta la cola
  const alto = T.piel([
    { z: -2.2, a: 0.7, b: 0.8, w: 0.4, v: 0.3 }, { z: -2.0, a: 0.86, b: 1.12, w: 0.6, v: 0.46 }, { z: -1.65, a: 1.0, b: 1.44, w: 0.71, v: 0.57 }, { z: -1.1, a: 1.04, b: 1.67, w: 0.76, v: 0.64 }, { z: -0.45, a: 1.04, b: 1.74, w: 0.77, v: 0.66 },
    { z: 0.08, a: 1.04, b: 1.69, w: 0.76, v: 0.65 }, { z: 0.32, a: 1.04, b: 1.55, w: 0.74, v: 0.63 }, { z: 0.62, a: 1.04, b: 1.12, w: 0.7, v: 0.66 },
  ], ...CH, { M: 14, base: { n: 4, c: 0 } });
  // los vidrios: tres ventanillas por lado, el parabrisas partido y la luneta
  alto.lados([[-0.42, 1.14], [0.42, 1.14], [0.2, 1.5], [-0.42, 1.52]], 0, 0, TINTA);
  alto.lados([[-1.08, 1.14], [-0.5, 1.14], [-0.5, 1.52], [-1.05, 1.5]], 0, 0, TINTA);
  alto.lados([[-1.55, 1.16], [-1.16, 1.14], [-1.16, 1.48], [-1.42, 1.38]], 0, 0, TINTA);
  for (const s of [-1, 1]) { alto.arriba([[0.6, s * 0.035], [0.6, s * 0.58], [0.35, s * 0.5], [0.35, s * 0.035]], 0, 0, TINTA); alto.arriba([[-1.93, s * 0.03], [-1.93, s * 0.3], [-1.72, s * 0.34], [-1.72, s * 0.03]], 0, 0, TINTA); }
  // la parrilla: barras cromadas sobre fondo oscuro, que doblan la punta y siguen por los costados del capó
  bajo.lados([[1.45, 0.6], [2.085, 0.6], [2.07, 0.95], [1.45, 0.985]], 0, 0, TINTA, 0.006, 6);
  for (let i = 0; i < 6; i++) { const y = 0.625 + i * 0.062; bajo.lados([[1.45, y], [2.09, y], [2.09, y + 0.026], [1.45, y + 0.026]], ...CR, PINTADO, 0.012, 6, 1); }
  bajo.lados([[0.72, 1.0], [1.45, 0.995], [1.45, 1.02], [0.72, 1.025]], ...CR, PINTADO, 0.01);
  T.caja(0.022, 0.035, 0.2, 0, 0.975, 1.9, ...CR); // el adorno del capó
  for (const z of [-1.13, -0.46, 0.52]) bajo.lados([[z, 0.44], [z + 0.012, 0.44], [z + 0.012, 1.08], [z, 1.08]], 0, 0, TINTA, 0.005, 1); // las puertas
  for (const s of [-1, 1]) {
    T.bulto(s * 0.68, E, R, 0.42, [[0.0, 0.4], [0.5, 0.56], [0.95, 0.83], [E, 0.94], [1.8, 0.86], [2.05, 0.66], [2.16, 0.5]], [[0.0, 0.15], [0.6, 0.2], [E, 0.205], [1.9, 0.19], [2.16, 0.1]], ...CH);
    T.bulto(s * 0.68, -E, R, 0.42, [[-2.22, 0.52], [-2.05, 0.74], [-E, 0.92], [-1.0, 0.84], [-0.75, 0.6], [-0.62, 0.4]], [[-2.22, 0.12], [-1.9, 0.19], [-E, 0.205], [-0.9, 0.19], [-0.62, 0.15]], ...CH);
    T.caja(0.24, 0.04, 0.74, s * 0.74, 0.33, -0.3, ...NEG); // el estribo, de goma
    T.bola(0.105, s * 0.5, 0.9, 1.72, ...CH, [1, 1, 1.7]); T.bola(0.08, s * 0.5, 0.905, 1.84, BLANCO, 0.96, [1, 1, 0.75]); // el faro, metido en el guardabarros
    T.bola(0.04, s * 0.6, 0.86, -2.1, ROJO, 0.5);
    for (const z of [-0.56, 0.42]) T.caja(0.03, 0.025, 0.12, s * 0.825, 0.98, z, ...CR); // las manijas
    for (const [z, d] of [[2.2, 1], [-2.33, -1]]) T.caja(0.05, 0.2, 0.05, s * 0.3, 0.38, z + d * 0.02, ...CR);
    // (por dentro, para la vista al volante: los parantes del parabrisas)
    T.viga([s * 0.6, 1.1, 0.58], [s * 0.5, 1.56, 0.3], 0.05, 0.04, ...NEG);
  }
  for (const z of [2.2, -2.33]) T.caja(1.72, 0.085, 0.035, 0, 0.42, z, ...CR); // los paragolpes
  T.caja(1.0, 0.02, 1.4, 0, 1.63, -0.5, LONA, 0.7); T.caja(1.3, 0.1, 0.05, 0, 1.03, 0.5, ...NEG); // (el cielorraso y el tablero)
  T.barra([-0.34, 0.95, 0.5], [-0.34, 1.2, 0.12], 0.018, ...NEG);
  const g = rueda({ r: R, goma: 0.078, tipo: 'disco', pinta: [ROJO, 0.3], taza: CR });
  return { geo: T.geometria(), ruedas: [1, -1].flatMap((d) => [-1, 1].map((s) => ({ geo: g, x: s * 0.71, z: d * E, r: R, dobla: d > 0 }))), volante: { p: [-0.34, 1.21, 0.11], incl: 0.99, r: 0.21 } };
}

/**
 * Cada vehículo: desde qué año es el que más se ve, cómo se llama, una línea, sus medidas en metros (ejes: de eje a
 * eje, o del eje al caballo; frente y cola: hasta dónde llega desde el medio), dónde van los ojos de quien maneja, y
 * cómo anda: vmax y atras en km/h, empuje y freno en m/s², agarre (lo más que aguanta de costado, m/s²), giro (lo más
 * que doblan las ruedas, rad) y volanteo (qué tan rápido, rad/s).
 */
export const VEHICULOS = [
  { clave: 'volanta', desde: 0, nombre: 'Volanta', linea: 'Cuatro ruedas, capota, pescante y dos asientos enfrentados: el coche que se alquilaba en las cocherías.', armar: volanta, caballo: true,
    ejes: 1.9, ancho: 1.54, frente: 4.65, cola: -1.65, ojo: [0, 2.1, 0.84], dial: 30, andar: { vmax: 20, atras: 4, empuje: 2.5, freno: 3, agarre: 3.2, giro: 0.5, volanteo: 1.3 }, bocina: 'relincho' },
  { clave: 'victoria', desde: 1880, nombre: 'Coche de plaza', linea: 'La victoria de alquiler, con su capota y su cochero en el pescante: en 1888 había 560 en las paradas. Después la iban a llamar mateo.', armar: victoria, caballo: true,
    ejes: 1.75, ancho: 1.5, frente: 4.6, cola: -1.5, ojo: [0, 2.02, 0.84], dial: 30, andar: { vmax: 19, atras: 4, empuje: 2.4, freno: 3, agarre: 3.2, giro: 0.5, volanteo: 1.3 }, bocina: 'relincho' },
  { clave: 'cupe', desde: 1892, nombre: 'Cupé', linea: 'El coche cerrado, con el cochero afuera. De plaza había uno cada veinte victorias; entre los particulares, era de los que más se veían.', armar: cupe, caballo: true,
    ejes: 1.56, ancho: 1.5, frente: 4.55, cola: -1.4, ojo: [0, 2.05, 0.6], dial: 30, andar: { vmax: 17, atras: 3, empuje: 2.1, freno: 2.8, agarre: 3, giro: 0.5, volanteo: 1.2 }, bocina: 'relincho' },
  { clave: 'voiturette', desde: 1901, nombre: 'Voiturette', linea: 'Un De Dion-Bouton de un cilindro, francés como muchos de los primeros que llegaron. En 1903 había 60 automóviles en toda la ciudad.', armar: voiturette,
    ejes: 1.9, ancho: 1.44, frente: 1.4, cola: -1.4, ojo: [-0.22, 1.5, -0.22], dial: 60, andar: { vmax: 42, atras: 8, empuje: 1.7, freno: 3.4, agarre: 3.8, giro: 0.6, volanteo: 1.6 }, motor: [9, 32], marchas: [0.5, 1], bocina: 'corneta' },
  { clave: 'faeton', desde: 1908, nombre: 'Doble faetón', linea: 'Un automóvil europeo, como casi todos los 2.287 que había a fines de 1909: capó largo, latón, y las palancas por afuera.', armar: faeton,
    ejes: 2.9, ancho: 1.7, frente: 1.98, cola: -2.08, ojo: [-0.3, 1.63, -0.22], dial: 80, andar: { vmax: 60, atras: 10, empuje: 1.9, freno: 3.8, agarre: 4, giro: 0.55, volanteo: 1.5 }, motor: [14, 52], marchas: [0.3, 0.6, 1], bocina: 'corneta' },
  { clave: 'ford-t', desde: 1917, nombre: 'Ford T', linea: 'Alto y flaco, el más común en la calle: de cada cuatro autos vendidos entre 1913 y 1920, casi tres fueron Ford. Se arman en Barracas.', armar: fordT,
    ejes: 2.54, ancho: 1.68, frente: 1.72, cola: -1.78, ojo: [-0.3, 1.53, -0.2], dial: 80, andar: { vmax: 68, atras: 14, empuje: 2.3, freno: 4.2, agarre: 4.4, giro: 0.6, volanteo: 1.7 }, motor: [17, 62], marchas: [0.42, 1], bocina: 'klaxon' },
  { clave: 'v8', desde: 1932, nombre: 'Ford V8', linea: 'Sedán de cuatro puertas de 1937, con ocho cilindros en V: el Ford de fines de los años treinta.', armar: fordV8,
    ejes: 2.845, ancho: 1.77, frente: 2.22, cola: -2.35, ojo: [-0.34, 1.4, -0.12], dial: 160, andar: { vmax: 135, atras: 20, empuje: 3.3, freno: 6, agarre: 6, giro: 0.6, volanteo: 2.2 }, motor: [28, 130], marchas: [0.3, 0.58, 1], bocina: 'bitono' },
];
/** El vehículo de un año: el último que ya andaba por la calle. */
export const delAño = (a) => { let v = VEHICULOS[0]; for (const c of VEHICULOS) if (c.desde <= a) v = c; return v; };

/** Arma el vehículo: la caja, las ruedas (que giran, y las de adelante doblan), el volante y, si lo tira un caballo, el caballo. */
function montar(v, mat, prof) {
  const d = v.armar(), malla = (g) => { const m = new THREE.Mesh(g, mat); m.customDepthMaterial = prof; m.castShadow = true; m.receiveShadow = false; m.frustumCulled = false; return m; };
  const grupo = new THREE.Group(), caja = new THREE.Group(); grupo.rotation.order = 'YXZ'; grupo.visible = false; grupo.add(caja); caja.add(malla(d.geo));
  let triangulos = d.geo.attributes.position.count / 3;
  const ruedas = d.ruedas.map((r) => { const pivote = new THREE.Group(), m = malla(r.geo); pivote.position.set(r.x, r.r, r.z); pivote.add(m); grupo.add(pivote); triangulos += r.geo.attributes.position.count / 3; return { pivote, malla: m, r: r.r, dobla: !!r.dobla }; });
  let volante = null, tiro = null;
  if (d.volante) { const eje = new THREE.Group(); eje.position.set(...d.volante.p); eje.rotation.x = -d.volante.incl; volante = malla(aro(d.volante.r)); eje.add(volante); caja.add(eje); }
  if (d.tiro) {
    // el caballo va entre las varas, que giran con él alrededor de donde se enganchan
    const c = caballo(d.tiro.pelo), g = new THREE.Group(), cab = new THREE.Group(), V = armar(); g.position.z = d.tiro.z; cab.position.z = d.tiro.lejos; cab.add(malla(c.cuerpo));
    for (const s of [-1, 1]) { V.barra([s * 0.44, d.tiro.alto, -0.1], [s * 0.37, 1.08, d.tiro.lejos + 0.62], 0.028, MADERA, 0.4, 0.02); V.barra([s * 0.3, 1.2, d.tiro.lejos + 0.1], [s * 0.4, 1.02, d.tiro.lejos - 0.9], 0.012, NEGRO, 0.12); }
    const patas = [[0.14, 0.45, 0], [-0.14, 0.45, 1], [0.15, -0.45, 1], [-0.15, -0.45, 0]].map(([x, z, par]) => {
      const cadera = new THREE.Group(), rodilla = new THREE.Group(); cadera.position.set(x, 1.0, z); rodilla.position.y = -0.5; cadera.add(malla(c.muslo), rodilla); rodilla.add(malla(c.caña)); cab.add(cadera);
      return { cadera, rodilla, fase: par * Math.PI };
    });
    g.add(cab, malla(V.geometria())); grupo.add(g); tiro = { grupo: g, cab, patas };
    triangulos += (c.cuerpo.attributes.position.count + 4 * (c.muslo.attributes.position.count + c.caña.attributes.position.count)) / 3;
  }
  return { grupo, caja, ruedas, volante, tiro, triangulos };
}

// ---------- el sonido: todo sintetizado (sin archivos), bajito, y se puede callar ----------
function crearSonido() {
  let ctx = null, salida = null, filtro = null, gMotor = null, osc = [], ruido = null, callado = false;
  try { callado = localStorage.getItem('coche-callado') === '1'; } catch { /* sin almacenamiento */ }
  const prender = () => {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); return true; }
    const AC = window.AudioContext ?? window.webkitAudioContext; if (!AC) return false;
    try {
      ctx = new AC(); salida = ctx.createGain(); salida.gain.value = callado ? 0 : 0.55; salida.connect(ctx.destination);
      // el motor: dos ondas ásperas, una a la mitad de la otra (el tembleque del ralentí), por un filtro que se abre al acelerar
      filtro = ctx.createBiquadFilter(); filtro.type = 'lowpass'; filtro.frequency.value = 220; filtro.Q.value = 1.5;
      gMotor = ctx.createGain(); gMotor.gain.value = 0; filtro.connect(gMotor); gMotor.connect(salida);
      osc = [['sawtooth', 0.5], ['square', 0.3]].map(([type, g]) => { const o = ctx.createOscillator(), gg = ctx.createGain(); o.type = type; o.frequency.value = 20; gg.gain.value = g; o.connect(gg); gg.connect(filtro); o.start(); return o; });
      ruido = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate); const d = ruido.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch { ctx = null; return false; }
    return true;
  };
  /** un golpe de ruido filtrado: un casco contra el empedrado, o la chapa contra una pared */
  const golpe = (frec, dura, fuerza, tipo = 'bandpass') => {
    if (!ctx || callado) return; const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), t = ctx.currentTime;
    s.buffer = ruido; f.type = tipo; f.frequency.value = frec; f.Q.value = 1.2; g.gain.setValueAtTime(fuerza, t); g.gain.exponentialRampToValueAtTime(0.001, t + dura);
    s.connect(f); f.connect(g); g.connect(salida); s.start(t, Math.random() * 0.2, dura + 0.02);
  };
  /** una nota con su recorrido: [[segundos, hertz], …] */
  const nota = (tipo, puntos, fuerza, corte = 1800, vibra = 0) => {
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), t = ctx.currentTime, fin = puntos[puntos.length - 1][0];
    o.type = tipo; o.frequency.setValueAtTime(puntos[0][1], t); for (const [s, hz] of puntos.slice(1)) o.frequency.linearRampToValueAtTime(hz, t + s);
    if (vibra) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 13; lg.gain.value = vibra; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + fin + 0.1); }
    f.type = 'lowpass'; f.frequency.value = corte; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(fuerza, t + 0.03); g.gain.setValueAtTime(fuerza, t + fin - 0.08); g.gain.linearRampToValueAtTime(0.0001, t + fin);
    o.connect(f); f.connect(g); g.connect(salida); o.start(t); o.stop(t + fin + 0.05);
  };
  return {
    prender, golpe,
    get callado() { return callado; },
    callar(si) { callado = si; try { localStorage.setItem('coche-callado', si ? '1' : '0'); } catch { /* da igual */ } if (salida) salida.gain.setTargetAtTime(si ? 0 : 0.55, ctx.currentTime, 0.05); },
    /** el motor: vueltas (0 a 1) y cuánto se lo pisa (0 a 1); `frec`: [ralentí, a fondo] en explosiones por segundo. Sin `frec`, se calla. */
    motor(frec, vueltas = 0, carga = 0) {
      if (!ctx) return; const t = ctx.currentTime;
      if (!frec) { gMotor.gain.setTargetAtTime(0, t, 0.08); return; }
      const hz = lerp(frec[0], frec[1], vueltas);
      osc[0].frequency.setTargetAtTime(hz * 2, t, 0.05); osc[1].frequency.setTargetAtTime(hz, t, 0.05);
      filtro.frequency.setTargetAtTime(170 + 620 * vueltas + 420 * carga, t, 0.08); gMotor.gain.setTargetAtTime(0.07 + 0.07 * carga + 0.04 * vueltas, t, 0.1);
    },
    bocina(cual) {
      if (!prender() || callado) return;
      if (cual === 'klaxon') nota('sawtooth', [[0, 150], [0.2, 430], [0.48, 430], [0.85, 190]], 0.22, 2200); // «a-uuu-ga»
      else if (cual === 'bitono') { nota('sawtooth', [[0, 415], [0.55, 415]], 0.12, 1500); nota('sawtooth', [[0, 523], [0.55, 523]], 0.12, 1500); }
      else if (cual === 'relincho') nota('sawtooth', [[0, 1050], [0.16, 1450], [0.5, 1200], [0.95, 560]], 0.11, 2600, 70);
      else for (const d of [0, 0.26]) setTimeout(() => ctx && nota('square', [[0, 300], [0.17, 280]], 0.12, 1300), d * 1000); // la corneta de pera: dos toques
    },
    parar() { if (ctx) { gMotor.gain.setTargetAtTime(0, ctx.currentTime, 0.05); setTimeout(() => { if (ctx?.state === 'running' && gMotor.gain.value < 0.01) ctx.suspend().catch(() => {}); }, 400); } },
  };
}

// ---------- el tablero: el velocímetro, qué se maneja, y tres botones ----------
const CSS = `
#tablero { left: calc(26px + var(--sl)); bottom: calc(26px + var(--sb)); display: none; padding: 8px 14px 8px 8px; align-items: center; gap: 12px; }
body.modo-manejar #tablero { display: flex; }
#tablero .reloj { width: 96px; height: 96px; flex: none; display: block; }
#tablero .reloj text { font: 8px "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif; fill: #2a221b; text-anchor: middle; font-variant-numeric: lining-nums; }
#tablero .reloj .kmh { font-size: 15px; } #tablero .reloj .uni { font-size: 6.5px; font-style: italic; opacity: .8; }
#tablero .cual b { display: block; font-weight: 500; font-size: 15.5px; letter-spacing: .07em; font-variant: small-caps; white-space: nowrap; }
#tablero .cual b i { font-style: normal; opacity: .6; margin-left: 7px; font-variant-numeric: lining-nums; }
#tablero .cual span { display: block; font-size: 12.5px; line-height: 1.35; font-style: italic; opacity: .82; max-width: 230px; margin-top: 1px; }
#tablero .teclas { display: flex; gap: 6px; margin-top: 7px; }
#tablero button { pointer-events: auto; cursor: pointer; width: 38px; height: 32px; padding: 0; display: grid; place-items: center; font: inherit; color: #2a221b; background: #f1e6cd; border: 1px solid #2a221b; border-radius: 0; }
#tablero button:hover { background: #fff6e2; } #tablero button:active { transform: translateY(1px); }
#tablero button.on { background: #2a221b; color: #f7eedb; }
#tablero button:disabled { opacity: .35; cursor: default; }
#tablero button svg { width: 19px; height: 19px; fill: currentColor; }
@media (pointer: coarse) { #tablero button { width: 44px; height: 44px; } }
@media (max-width: 640px), (max-height: 500px) {
  #tablero { left: calc(14px + var(--sl)); bottom: calc(124px + var(--sb)); padding: 6px 10px 6px 6px; gap: 8px; }
  #tablero .cual span { display: none; } #tablero .reloj { width: 80px; height: 80px; } #tablero .cual b { font-size: 14px; }
}
@media (max-height: 500px) and (min-width: 641px) { #tablero { bottom: calc(16px + var(--sb)); } }
`;
const ICONOS = {
  vista: '<path d="M12 5.500c4.600 0 8.300 3 10 6.500-1.700 3.500-5.400 6.500-10 6.500S3.700 15.500 2 12c1.700-3.500 5.400-6.500 10-6.500zm0 2.500a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2.100a1.900 1.900 0 1 1 0 3.800 1.900 1.900 0 0 1 0-3.800z" fill-rule="evenodd"/>',
  bocina: '<path d="M3 9.500h3.500L14 5v14l-7.500-4.500H3zM16.200 8.300a5 5 0 0 1 0 7.400l-1.100-1.200a3.400 3.400 0 0 0 0-5zM18.700 5.800a8.600 8.600 0 0 1 0 12.400l-1.100-1.200a7 7 0 0 0 0-10z"/>',
  coche: '<path d="M7.500 3 3 7.500 7.500 12V8.700H17V6.300H7.500zM16.500 12v3.300H7v2.400h9.500V21l4.500-4.500z"/>',
  sonido: '<path d="M4 9.500h3.500L13 5.500v13l-5.500-4H4z"/><path class="si" d="M15.600 8.600a4.600 4.600 0 0 1 0 6.800l-1.100-1.200a3 3 0 0 0 0-4.400z"/><path class="no" d="m15.200 9.300 1.200-1.200 2.100 2.100 2.100-2.100 1.200 1.200-2.100 2.100 2.100 2.100-1.200 1.200-2.100-2.100-2.100 2.100-1.200-1.200 2.100-2.100z"/>',
};
/** El dibujo de la esfera: de 0 a `max` km/h, en un arco de 240°. */
function esfera(max) {
  const paso = max <= 30 ? 5 : max <= 80 ? 10 : 20, cada = max <= 30 ? 10 : max <= 80 ? 20 : 40, p = (a, r) => [50 + r * Math.sin(a), 50 - r * Math.cos(a)].map((n) => n.toFixed(2));
  let s = '<circle cx="50" cy="50" r="47" fill="#f7eedb" stroke="#2a221b" stroke-width="1.2"/><circle cx="50" cy="50" r="44" fill="none" stroke="#2a221b" stroke-width=".5" opacity=".6"/>';
  for (let k = 0; k <= max; k += paso) {
    const a = ((-120 + (240 * k) / max) * Math.PI) / 180, gr = k % cada === 0, [x0, y0] = p(a, 41), [x1, y1] = p(a, gr ? 35 : 38);
    s += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#2a221b" stroke-width="${gr ? 1.1 : 0.6}"/>`;
    if (gr) { const [x, y] = p(a, 27.5); s += `<text x="${x}" y="${+y + 2.8}">${k}</text>`; }
  }
  return `${s}<text class="kmh" x="50" y="80">0</text><text class="uni" x="50" y="88">km/h</text><g class="aguja"><path d="M50 14 51.600 50 50 56 48.400 50z" fill="#a03220"/></g><circle cx="50" cy="50" r="3" fill="#2a221b"/>`;
}

/**
 * El manejo. Lo crea src/modos.js, que le pasa lo que ya sabe:
 * @param suelo(x, z)      la altura del terreno   @param limites [x0, z0, x1, z1] del pliego
 * @param año()            el año de la línea de tiempo que se mira   @param etapa()  y su número (0 = 1867)
 * @param edificado(x, z)  ¿hay una casa o un edificio ahí, en esa etapa?   @param enManzana(x, z)  ¿es adentro de una manzana de 1867?
 * @param pared(x, z)      de la casa que tiene adentro a ese punto, hacia dónde queda la pared más cercana: [nx, nz] (o nada)
 * @param abrir(ancho, min, max)  abre el ángulo de la cámara
 */
export function createManejo({ camera, scene, tinta, suelo, limites, año, etapa, edificado, enManzana, pared, abrir }) {
  document.head.appendChild(Object.assign(document.createElement('style'), { textContent: CSS }));
  const mat = tinta.make(), prof = tinta.depth(), U = tinta.U;
  const minimapa = createMinimapa({ U, etapa }); // (el mapita de la esquina: src/minimapa.js)
  // (el coche se apoya en el terreno por su cuenta, entero y con su inclinación: si cada punto lo hiciera por la suya —como
  // las casas—, las ruedas, que giran, se deformarían)
  mat.defines = { ...mat.defines, SIN_RELIEVE: '' }; prof.defines = { ...prof.defines, SIN_RELIEVE: '' };
  const hechos = new Map(), sonido = crearSonido();
  const dar = (v) => { let m = hechos.get(v.clave); if (!m) { m = montar(v, mat, prof); scene.add(m.grupo); hechos.set(v.clave, m); } return m; };

  const tablero = Object.assign(document.createElement('div'), { id: 'tablero', className: 'panel' });
  tablero.innerHTML = `<svg class="reloj" viewBox="0 0 100 100" role="img" aria-label="Velocímetro"></svg><div class="cual"><b></b><span></span><div class="teclas">${[['coche', 'Otro coche de esos años (N)'], ['vista', 'Cambiar de vista (V)'], ['bocina', 'Bocina (B)'], ['sonido', 'Sonido (M)']].map(([b, t]) => `<button type="button" data-b="${b}" title="${t}" aria-label="${t}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONOS[b]}</svg></button>`).join('')}</div></div>`;
  document.body.appendChild(tablero);
  const reloj = tablero.querySelector('.reloj'), boton = (b) => tablero.querySelector(`[data-b="${b}"]`);
  let aguja = null, cifra = null, kmhVisto = -1;

  // ---------- el agua: el río y los diques. Sale de las mismas láminas con que se pinta el suelo (src/tinta.js): la
  // que dice qué es río en 1867 y la que dice desde cuándo es tierra firme lo que se le ganó. ----------
  let rio = null, ganada = null;
  async function leer(ruta) {
    const r = await pedir(ruta); if (!r.ok) throw new Error(ruta);
    const bmp = await createImageBitmap(await r.blob(), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' }), c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(bmp, 0, 0); bmp.close?.();
    const d = g.getImageData(0, 0, c.width, c.height).data, o = new Uint8Array(c.width * c.height); for (let i = 0; i < o.length; i++) o[i] = d[i * 4];
    return { o, w: c.width, h: c.height };
  }
  const listo = Promise.all([leer('plano/suelo-2k.webp').then((m) => { rio = m; }), leer('plano/crece-2k.webp').then((m) => { ganada = m; }).catch(() => {})]).catch((e) => console.warn(e));
  const enLamina = (m, x, z) => { const u = (x / U.uMetro.value + U.uPlaza.value.x) / U.uHoja.value.x, v = (z / U.uMetro.value + U.uPlaza.value.y) / U.uHoja.value.y; return u < 0 || v < 0 || u >= 1 || v >= 1 ? 0 : m.o[Math.floor(v * m.h) * m.w + Math.floor(u * m.w)]; };
  const agua = (x, z) => {
    if (!rio || enLamina(rio, x, z) < 128) return false;
    const e = etapa(); if (e > 0 && ganada) { const eg = etapaDeCodigo(enLamina(ganada, x, z)); if (eg && eg <= e) return false; } // (tierra ganada al río: desde su etapa)
    return true;
  };

  // ---------- dónde está y cómo viene ----------
  const auto = { x: 0, z: 0, h: 0, v: 0, d: 0, y: 0, clave: null, vista: 'atras', golpes: 0, orbita: null };
  let V = null, M = null, saliente = null, tCambio = 1, activo = false, salto = true, etapaVista = -1;
  let camH = 0, brazo = 8, cabeceo = 0, rolido = 0, paso = 0, fase = 0, tGolpe = 0, vAntes = 0;
  const ojo = new THREE.Vector3(), mira = new THREE.Vector3(), tmp = new THREE.Vector3();
  try { if (localStorage.getItem('coche-vista') === 'volante') auto.vista = 'volante'; } catch { /* sin almacenamiento */ }

  const adentro = (x, z) => x > limites[0] + 2 && x < limites[2] - 2 && z > limites[1] + 2 && z < limites[3] - 2;
  const libre = (x, z) => adentro(x, z) && !agua(x, z) && !edificado(x, z);
  /** Los puntos del contorno con que se prueba si el coche toca algo: [de costado, a lo largo]. */
  const huella = (v) => { const p = [], hw = v.ancho / 2 - 0.1, n = Math.ceil((v.frente - v.cola) / 1.1); for (const s of [-1, 0, 1]) p.push([s * hw, v.frente], [s * hw, v.cola]); for (let i = 1; i < n; i++) { const a = lerp(v.cola, v.frente, i / n); p.push([-hw, a], [hw, a]); } return p; };
  for (const v of VEHICULOS) v.huella = huella(v);
  /** ¿El coche, puesto en (x, z) con rumbo h, toca algo? Devuelve nada, o hacia dónde queda libre (si se sabe). */
  function choca(x, z, h, v = V) {
    const fx = Math.sin(h), fz = Math.cos(h);
    for (const [l, a] of v.huella) {
      const px = x + fx * a + fz * l, pz = z + fz * a - fx * l;
      if (!adentro(px, pz)) return { n: [px <= limites[0] + 2 ? 1 : px >= limites[2] - 2 ? -1 : 0, pz <= limites[1] + 2 ? 1 : pz >= limites[3] - 2 ? -1 : 0] };
      if (agua(px, pz)) return { n: null };
      if (edificado(px, pz)) return { n: pared(px, pz) };
    }
    return null;
  }
  /** Dónde poner el coche cerca de (x0, z0): en la calle, a lo largo de ella y en el medio. */
  function ubicar(x0, z0, h0) {
    const corrida = (x, z, h, tope) => { let r = 0; while (r < tope && libre(x + Math.sin(h) * (r + 2), z + Math.cos(h) * (r + 2))) r += 2; return r; };
    for (const calle of [true, false]) for (let r = 0; r <= 700; r += 4) for (let k = 0; k < (r ? 20 : 1); k++) {
      const a = (k / 20) * Math.PI * 2; let x = x0 + Math.sin(a) * r, z = z0 + Math.cos(a) * r;
      if (!libre(x, z) || (calle && enManzana(x, z))) continue;
      // el rumbo: el de la calle (por donde se puede seguir más lejos), y entre parecidos, el que se traía
      let mejor = null, puntos = -1;
      for (let j = 0; j < 16; j++) { const h = h0 + (j * Math.PI) / 8, p = corrida(x, z, h, 90) + corrida(x, z, h + Math.PI, 30) * 0.3 - Math.min(j, 16 - j) * 3; if (p > puntos) { puntos = p; mejor = h; } }
      // al medio de la calle: lo mismo de lejos de las dos veredas (si las hay cerca)
      const iz = corrida(x, z, mejor + Math.PI / 2, 16), de = corrida(x, z, mejor - Math.PI / 2, 16);
      if (iz < 16 && de < 16) { const c = (iz - de) / 2; x += Math.cos(mejor) * c; z -= Math.sin(mejor) * c; }
      for (const h of [mejor, mejor + 0.2, mejor - 0.2, h0]) if (!choca(x, z, h)) return { x, z, h };
    }
    return { x: x0, z: z0, h: h0 };
  }

  // ---------- el vehículo de la época ----------
  // Se sube al de ese año, pero se puede elegir otro de los que ya andaban por la calle (en 1940 todavía se ve algún
  // Ford T, y coches de caballos): el botón de las flechas, o la N, los va pasando. Al cambiar de año se vuelve al suyo.
  let elegido = null, añoElegido = 0;
  const deEntonces = () => VEHICULOS.filter((v) => v.desde <= año());
  const elMio = () => (elegido && añoElegido === año() ? elegido : (elegido = null, delAño(año())));
  function otroCoche(paso = -1) {
    const l = deEntonces(), n = l.length; if (n < 2 || !activo) return;
    const v = l[(l.indexOf(V) + paso + n) % n];
    elegido = v === delAño(año()) ? null : v; añoElegido = año(); poner(v);
  }
  function poner(v) {
    if (M && M !== saliente) { if (saliente) saliente.grupo.visible = false; saliente = M; }
    V = v; M = dar(v); if (saliente === M) saliente = null; M.grupo.visible = true; tCambio = saliente ? 0 : 1; auto.clave = v.clave;
    auto.v = clamp(auto.v, -v.andar.atras / 3.6, v.andar.vmax / 3.6);
    reloj.innerHTML = esfera(v.dial); aguja = reloj.querySelector('.aguja'); cifra = reloj.querySelector('.kmh'); kmhVisto = -1;
    tablero.querySelector('.cual b').innerHTML = `${v.nombre}<i>${año()}</i>`; tablero.querySelector('.cual span').textContent = v.linea;
    { const n = deEntonces().length, b = boton('coche'); b.disabled = n < 2; b.title = n < 2 ? 'En este año no hay otro coche' : `Otro coche de esos años: hay ${n} (N)`; b.setAttribute('aria-label', b.title); }
    boton('bocina').title = v.caballo ? 'Relincho (B)' : 'Bocina (B)'; boton('bocina').setAttribute('aria-label', boton('bocina').title);
    boton('vista').title = `${v.caballo ? 'Desde el pescante' : 'Al volante'}, o desde atrás (V)`; boton('vista').setAttribute('aria-label', boton('vista').title);
    if (!v.motor) sonido.motor(null);
    // (el nuevo puede ser más largo o más ancho que el que había, o haber aparecido una casa con el año)
    if (activo && choca(auto.x, auto.z, auto.h)) { const p = ubicar(auto.x, auto.z, auto.h); auto.x = p.x; auto.z = p.z; auto.h = p.h; auto.v = 0; salto = true; }
  }
  const pintar = () => { boton('vista').classList.toggle('on', auto.vista === 'volante'); boton('sonido').classList.toggle('on', sonido.callado); boton('sonido').querySelector('.si').style.display = sonido.callado ? 'none' : ''; boton('sonido').querySelector('.no').style.display = sonido.callado ? '' : 'none'; };
  function cambiarVista() { auto.vista = auto.vista === 'atras' ? 'volante' : 'atras'; try { localStorage.setItem('coche-vista', auto.vista); } catch { /* da igual */ } salto = true; pintar(); }
  function bocina() { sonido.bocina(V.bocina); }
  function callar() { sonido.callar(!sonido.callado); pintar(); }
  boton('coche').addEventListener('click', () => otroCoche()); boton('vista').addEventListener('click', cambiarVista); boton('bocina').addEventListener('click', bocina); boton('sonido').addEventListener('click', callar);
  pintar();

  /** Se sube al coche cerca de (x0, z0), mirando hacia h0. */
  function entrar(x0, z0, h0) {
    for (const m of hechos.values()) m.grupo.visible = false; // (si ya había uno en la calle)
    activo = true; auto.v = 0; auto.d = 0; auto.golpes = 0; V = null; M = null; saliente = null; elegido = null; poner(delAño(año())); etapaVista = etapa();
    const p = ubicar(x0, z0, h0); auto.x = p.x; auto.z = p.z; auto.h = p.h; camH = p.h; salto = true; cabeceo = rolido = 0;
    sonido.prender(); andar(0, { gira: 0, pedal: 0, freno: 0 });
  }
  function salir() { activo = false; for (const m of hechos.values()) m.grupo.visible = false; saliente = null; sonido.parar(); }

  const giro = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const sube = (t) => { const s = clamp(t, 0, 1) - 1; return t <= 0 ? 0 : 1 + 2.2 * s * s * s + 1.2 * s * s; }; // (como se levantan las casas: src/tinta.js)
  /** Avanza `dt` segundos. gira: de −1 (izquierda) a 1 · pedal: de −1 (frenar, y después marcha atrás) a 1 · freno: el de mano. Devuelve si algo se movió. */
  function andar(dt, { gira, pedal, freno }) {
    // con los años cambia el coche (y las casas: si una apareció encima, se lo corre a la calle)
    const v = elMio(); if (v !== V) poner(v); else if (etapa() !== etapaVista && choca(auto.x, auto.z, auto.h)) { const p = ubicar(auto.x, auto.z, auto.h); auto.x = p.x; auto.z = p.z; auto.h = p.h; auto.v = 0; salto = true; }
    etapaVista = etapa();
    const A = V.andar, L = V.ejes, vmax = A.vmax / 3.6, vatras = A.atras / 3.6, x0 = auto.x, z0 = auto.z, h0 = auto.h;
    // --- el motor (o el caballo) y los frenos ---
    let ac = 0; const u = Math.abs(auto.v) / vmax;
    if (freno) ac = -Math.sign(auto.v) * A.freno * 1.1;
    else if (pedal > 0.02) ac = auto.v < -0.3 ? A.freno * pedal : Math.max(-0.6, A.empuje * (pedal - u ** 1.6)); // (el pedal a medias es andar a media marcha: con el dedo se regula el paso)
    else if (pedal < -0.02) ac = auto.v > 0.3 ? A.freno * pedal : auto.v > -vatras ? A.empuje * 0.7 * pedal : 0;
    // (sin pisar nada se va parando sola: el roce, el aire y el motor que retiene)
    const roce = pedal > 0.02 && auto.v >= 0 ? 0 : (0.25 + 0.5 * u + (pedal ? 0 : 0.35)) * (V.caballo ? 1.6 : 1), v1 = auto.v + ac * dt, cae = roce * dt;
    auto.v = (freno || (pedal < -0.02 && auto.v > 0)) && Math.sign(v1) !== Math.sign(auto.v) ? 0 : Math.abs(v1) <= cae ? 0 : v1 - Math.sign(v1) * cae;
    auto.v = clamp(auto.v, -vatras, vmax);
    // --- la dirección: cuanto más rápido, menos se puede doblar ---
    const dmax = Math.min(A.giro, Math.atan((A.agarre * L) / Math.max(1, auto.v * auto.v))), quiere = -gira * dmax, dd = quiere - auto.d, ritmo = A.volanteo * (Math.abs(quiere) < Math.abs(auto.d) ? 1.8 : 1) * dt;
    auto.d = clamp(auto.d + clamp(dd, -ritmo, ritmo), -A.giro, A.giro);
    // --- andar, de a pasos cortos, sin atravesar nada ---
    let resta = auto.v * dt; const pasos = Math.max(1, Math.ceil(Math.abs(resta) / 0.4));
    for (let i = 0; i < pasos && auto.v !== 0; i++) {
      const p = resta / pasos, fx = Math.sin(auto.h), fz = Math.cos(auto.h), h1 = auto.h + (p / L) * Math.tan(auto.d);
      // (gira alrededor del eje de atrás, como un auto de verdad)
      const x1 = auto.x - fx * (L / 2) + fx * p + Math.sin(h1) * (L / 2), z1 = auto.z - fz * (L / 2) + fz * p + Math.cos(h1) * (L / 2), toca = choca(x1, z1, h1);
      if (!toca) { auto.x = x1; auto.z = z1; auto.h = h1; continue; }
      const m = Math.sign(auto.v), n = toca.n, c = n ? m * (fx * n[0] + fz * n[1]) : -1;
      if (n && c > -0.6) {
        // de refilón: resbala a lo largo de la pared, que le va enderezando el rumbo, y pierde velocidad
        let tx = m * fx - c * n[0], tz = m * fz - c * n[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
        const h2 = auto.h + clamp(giro(Math.atan2(tx, tz) + (m < 0 ? Math.PI : 0) - auto.h), -0.05, 0.05), x2 = auto.x + tx * Math.abs(p) * tl + n[0] * 0.02, z2 = auto.z + tz * Math.abs(p) * tl + n[1] * 0.02;
        if (!choca(x2, z2, h2)) { auto.x = x2; auto.z = z2; auto.h = h2; auto.v *= 1 - Math.min(0.5, 0.04 + 0.12 * -Math.min(0, c)); if (tGolpe <= 0 && Math.abs(auto.v) > 2) { tGolpe = 0.35; sonido.golpe(260, 0.12, 0.12, 'lowpass'); } continue; }
      }
      // de frente: frena en seco y rebota apenas
      if (Math.abs(auto.v) > 1.2) { auto.golpes++; sonido.golpe(170, 0.22, Math.min(0.5, 0.12 + Math.abs(auto.v) * 0.04), 'lowpass'); tGolpe = 0.4; cabeceo += 0.02 * m * Math.min(4, Math.abs(auto.v)); }
      auto.v = Math.abs(auto.v) > 0.8 ? -auto.v * 0.22 : 0; break;
    }
    tGolpe -= dt;
    const anduvo = Math.hypot(auto.x - x0, auto.z - z0) * Math.sign(auto.v || 1);
    // --- apoyado en el terreno: la altura y la inclinación salen de dónde pisa cada rueda ---
    const fx = Math.sin(auto.h), fz = Math.cos(auto.h), mt = V.ancho * 0.4, ml = L / 2;
    const ad = suelo(auto.x + fx * ml, auto.z + fz * ml), at = suelo(auto.x - fx * ml, auto.z - fz * ml), iz = suelo(auto.x + fz * mt, auto.z - fx * mt), de = suelo(auto.x - fz * mt, auto.z + fx * mt);
    auto.y = (ad + at + iz + de) / 4;
    const g = M.grupo; g.position.set(auto.x, auto.y, auto.z); g.rotation.set(-Math.atan2(ad - at, L), auto.h, Math.atan2(iz - de, mt * 2));
    // la caja se hamaca sobre los elásticos: se inclina hacia afuera en las curvas y cabecea al frenar
    const k = 1 - Math.exp(-dt * 6), aLado = dt > 0 ? (auto.v * giro(auto.h - h0)) / dt : 0, aLargo = dt > 0 ? (auto.v - vAntes) / dt : 0; vAntes = auto.v;
    rolido += (clamp(aLado * 0.012, -0.07, 0.07) - rolido) * k; cabeceo += (clamp(-aLargo * 0.006, -0.04, 0.04) - cabeceo) * k;
    M.caja.rotation.set(cabeceo, 0, rolido);
    paso += anduvo;
    for (const r of M.ruedas) { r.malla.rotation.x = paso / r.r; if (r.dobla) r.pivote.rotation.y = auto.d; }
    if (M.volante) M.volante.rotation.y = auto.d * 2.6;
    if (M.tiro) {
      // el caballo: gira hacia donde se dobla, y trota (las patas de a pares cruzados) con lo que se anda
      M.tiro.grupo.rotation.y = auto.d * 0.9;
      const f0 = fase; fase += Math.abs(anduvo) * 2.4; const amp = Math.min(0.5, Math.abs(auto.v) * 0.16);
      for (const p of M.tiro.patas) { const s = Math.sin(fase + p.fase); p.cadera.rotation.x = -amp * s; p.rodilla.rotation.x = amp * 1.7 * Math.max(0, Math.cos(fase + p.fase)); }
      M.tiro.cab.position.y = Math.abs(Math.sin(fase)) * amp * 0.07;
      if (Math.floor(fase / Math.PI) !== Math.floor(f0 / Math.PI)) { sonido.golpe(900 + Math.random() * 300, 0.07, 0.2); setTimeout(() => activo && sonido.golpe(1200, 0.05, 0.11), 90); }
    } else if (V.motor) {
      // el motor: las vueltas suben y caen con cada cambio de marcha
      let lo = 0, hi = 1; for (const mch of V.marchas) { if (u <= mch) { hi = mch; break; } lo = mch; }
      sonido.motor(V.motor, clamp(0.12 + 0.88 * ((u - lo * 0.6) / (hi - lo * 0.6)), 0, 1), clamp(Math.abs(pedal), 0, 1));
    }
    // el cambio de época: el que se va se achica contra el suelo y el nuevo se levanta en su lugar
    if (tCambio < 1 || saliente) {
      tCambio = Math.min(1, tCambio + dt / 0.8);
      if (saliente) { const s = 1 - clamp(tCambio / 0.45, 0, 1); saliente.grupo.position.copy(g.position); saliente.grupo.rotation.copy(g.rotation); saliente.grupo.scale.set(1, Math.max(s * s, 1e-3), 1); if (s <= 0) { saliente.grupo.visible = false; saliente.grupo.scale.set(1, 1, 1); saliente = null; } }
      g.scale.set(1, Math.max(sube((tCambio - 0.3) / 0.7), 1e-3), 1);
    } else g.scale.set(1, 1, 1);
    // --- la cámara ---
    const quieta0 = tmp.copy(camera.position);
    camera.up.set(0, 1, 0); camera.far = 14000;
    if (auto.orbita) {
      // (para las capturas: la cámara donde se le diga, alrededor del coche — a: el ángulo desde la trompa, d: a cuánto, y: a qué altura)
      const o = auto.orbita, c = (V.frente + V.cola) / 2, cx = auto.x + fx * c, cz = auto.z + fz * c; abrir(o.ancho ?? 40, 20, 60); camera.near = 0.35;
      camera.position.set(cx + Math.sin(auto.h + o.a) * o.d, auto.y + o.y, cz + Math.cos(auto.h + o.a) * o.d); camera.lookAt(mira.set(cx, auto.y + (o.mira ?? 0.9), cz));
    } else if (auto.vista === 'volante') {
      // desde el asiento (o el pescante), mirando un poco hacia donde se dobla
      abrir(86, 58, 82); g.updateMatrixWorld(true); ojo.set(...V.ojo).applyMatrix4(M.caja.matrixWorld);
      const hm = auto.h + auto.d * 0.45; camera.position.copy(ojo); camera.near = 0.12;
      camera.lookAt(mira.set(ojo.x + Math.sin(hm) * 10, ojo.y - 0.75 + (ad - at) * (10 / L), ojo.z + Math.cos(hm) * 10));
    } else {
      // de atrás y un poco arriba; gira con un instante de demora (así se lo ve doblar), y el brazo se acorta si hay
      // una casa en el medio, para no meterse adentro
      abrir(66, 46, 72); camera.near = 0.35;
      camH = salto ? auto.h : camH + giro(auto.h - camH) * (1 - Math.exp(-dt * 3.4));
      const centro = (V.frente + V.cola) / 2, cx = auto.x + fx * centro, cz = auto.z + fz * centro, kx = Math.sin(camH), kz = Math.cos(camH);
      const D = (3.6 + (V.frente - V.cola) * 0.85 + Math.abs(auto.v) * 0.13) / Math.min(1, camera.aspect * 1.15);
      let cabe = D; for (let s = 1; s <= D + 0.8; s += 0.5) if (edificado(cx - kx * s, cz - kz * s)) { cabe = Math.max(1.5, s - 1); break; }
      brazo = salto ? cabe : brazo + (cabe - brazo) * (1 - Math.exp(-dt * (cabe < brazo ? 16 : 2.2)));
      const alto = 2.5 + (V.caballo ? 0.5 : 0) + (1 - brazo / D) * 1.6;
      mira.set(cx - kx * brazo, auto.y + alto, cz - kz * brazo); mira.y = Math.max(mira.y, suelo(mira.x, mira.z) + 1.2);
      if (salto) ojo.copy(mira); else { ojo.x = mira.x; ojo.z = mira.z; ojo.y += (mira.y - ojo.y) * (1 - Math.exp(-dt * 5)); }
      camera.position.copy(ojo); camera.lookAt(mira.set(cx + fx * 1.5, auto.y + 1.25, cz + fz * 1.5));
    }
    salto = false;
    // --- el mapita: gira con la cámara (en las capturas con la cámara suelta, con el coche) ---
    { const rumbo = auto.orbita || auto.vista === 'volante' ? auto.h : camH; minimapa.poner(auto.x, auto.z, rumbo, auto.h, auto.v, dt); }
    // --- el velocímetro ---
    const kmh = Math.abs(auto.v) * 3.6;
    if (Math.abs(kmh - kmhVisto) > 0.2) { kmhVisto = kmh; aguja.setAttribute('transform', `rotate(${(-120 + 240 * Math.min(1, kmh / V.dial)).toFixed(1)} 50 50)`); const n = String(Math.round(kmh)); if (cifra.textContent !== n) cifra.textContent = n; }
    return auto.v !== 0 || tCambio < 1 || Math.abs(dd) > 1e-4 || Math.abs(pedal) > 0.02 || quieta0.distanceToSquared(camera.position) > 1e-8 || Math.abs(rolido) + Math.abs(cabeceo) > 2e-3;
  }

  return {
    auto, entrar, salir, andar, listo,
    get vehiculo() { return V; }, get activo() { return activo; },
    /** Las teclas sueltas: V cambia la vista, B toca la bocina, M calla, N pasa a otro coche. Devuelve si la tecla era de acá. */
    tecla(code, repite) { const f = { KeyV: cambiarVista, KeyB: bocina, KeyM: callar, KeyN: () => otroCoche() }[code]; if (!f) return false; if (!repite) f(); return true; },
    /** (para las pruebas) ¿el coche está tocando algo?  · cuántos triángulos tiene cada uno */
    adentro: () => !!choca(auto.x, auto.z, auto.h), agua,
    triangulos: () => Object.fromEntries(VEHICULOS.map((v) => [v.clave, dar(v).triangulos])),
  };
}
