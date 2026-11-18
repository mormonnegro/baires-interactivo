// Los trenes: las vías de cada ferrocarril (src/vias.js), dibujadas con su balasto, sus durmientes y sus rieles, y los
// trenes que andan por ellas todo el tiempo. Cambian con la línea de tiempo: cada línea está en sus años.
//   - En las líneas de dos vías sale un tren del andén cada tanto y se pierde por el borde del plano, y por la otra
//     vía llegan otros. En las de una vía hay un solo tren, que va de punta a punta y vuelve marcha atrás.
//   - Los trenes son una locomotora de vapor con su ténder y unos coches (o coches solos, donde ya eran eléctricos).
//     La forma es inventada, y van un cuarto más grandes de lo real para que se distingan. Están hechos con pocas
//     piezas y dibujados con la misma tinta que la ciudad (y pintados, en el modo en color).
//   - Avanzan con el tiempo que les pasa main.js (el mismo de la ola y de la cámara): con ?capture, el de lab.step().
//   - La página dibuja solo cuando algo cambió. Los trenes piden un cuadro únicamente si alguno está levantado, dentro
//     de lo que ve la cámara, a una distancia donde se distingue, y si desde el último dibujo se movió al menos medio
//     punto de pantalla. Fuera de eso siguen andando (es una cuenta), pero no hacen dibujar nada.
import * as THREE from 'three';
import { trozar, soltar } from './trozos.js';

import { VIA, LINEAS } from './vias.js';
export { VIA }; // (src/ciudad.js la usa: el lector del plano toma por árboles los puntos con que está dibujada)

const PIEDRA = 6, TINTA = 7, PINTADO = 9;
// (los tonos de PINTADO: ver «kind» 9 en src/tinta.js)
const MADERA = 0, VERDE = 1, BRONCE = 2, ROJO = 3, OCRE = 4, LONA = 5, BALASTO = 6;
const ESCALA = 1.25; // un cuarto más grande de lo real: a tamaño justo, desde la vista del mapa casi no se lo ve
const EMPUJE = 0.4, ESPERA = 14, POP = 1.6; // m/s², segundos parado en cada punta, y lo que tarda un tren en aparecer o irse en el andén
// cómo se anda en cada etapa: [m/s, coches por tren, cada cuántos segundos sale uno en las líneas de dos vías]
const EPOCA = [[8, 3, 110], [10, 4, 90], [10, 4, 90], [11, 4, 80], [11, 4, 80], [12, 5, 70], [12, 5, 60]];
const TROCHA = 0.82 * 1.25; // medio ancho entre rieles, a la escala de los trenes
const HUMOS = 22, CADA = 0.3; // cuántas bocanadas hay a la vez, y cada cuántos segundos sale una
const VIENTO = [-0.9, 0.5]; // m/s, hacia donde se va el humo (x norte, z este)

/** Junta piezas en una sola geometría, con lo que pide la tinta (aInfo, aWall). */
function armar() {
  const P = [], N = [], I = [], W = [];
  let seed = 0.47;
  const add = (g, kind = TINTA, tono = 0, claro = 0) => {
    const n = g.index ? g.toNonIndexed() : g, p = n.attributes.position, nn = n.attributes.normal;
    seed = (seed * 7.31 + 0.173) % 1;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) * ESCALA, y = p.getY(i) * ESCALA, z = p.getZ(i) * ESCALA;
      // (aInfo.w = 0: «en la plaza», donde la ola ya pasó mucho antes de llegar a la vía; cuánto está levantado el
      // tren lo decide actualizar(), con el grupo. No va en negativo: eso es lo que solo existe en color.)
      P.push(x, y, z); N.push(nn.getX(i), nn.getY(i), nn.getZ(i)); I.push(seed, kind * 10 + 1, 4, 0); W.push(x + z * 0.6 + 500, y, tono, claro);
    }
  };
  const T = {
    add,
    /** caja de w (x) × h × d (z), apoyada en y, centrada en (x, z) */
    caja: (w, h, d, x, y, z, kind, tono, claro) => add(new THREE.BoxGeometry(w, h, d).translate(x, y + h / 2, z), kind, tono, claro),
    /** cilindro acostado a lo largo de z, de z0 a z1, con el eje a la altura y */
    tubo: (r, z0, z1, y, kind, tono, claro, x = 0, r2 = r) => add(new THREE.CylinderGeometry(r2, r, z1 - z0, 14).rotateX(Math.PI / 2).translate(x, y, (z0 + z1) / 2), kind, tono, claro),
    /** cilindro parado */
    poste: (r, h, x, y, z, kind, tono, claro, r2 = r) => add(new THREE.CylinderGeometry(r2, r, h, 12).translate(x, y + h / 2, z), kind, tono, claro),
    /** un par de ruedas de radio r en z */
    ruedas: (r, z, trocha = 0.82) => { for (const s of [-1, 1]) { add(new THREE.CylinderGeometry(r, r, 0.13, 18).rotateZ(Math.PI / 2).translate(s * trocha, r, z), TINTA); add(new THREE.CylinderGeometry(r * 0.72, r * 0.72, 0.03, 18).rotateZ(Math.PI / 2).translate(s * (trocha + 0.07), r, z), PINTADO, ROJO, 0.42); } add(new THREE.CylinderGeometry(0.07, 0.07, trocha * 2, 8).rotateZ(Math.PI / 2).translate(0, r, z), TINTA); },
    geometria() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aInfo', new THREE.Float32BufferAttribute(I, 4)); g.setAttribute('aWall', new THREE.Float32BufferAttribute(W, 4));
      return g;
    },
  };
  return T;
}

/** La locomotora: mira hacia +z. Largo 7,2 m (de -3,6 a 3,6); la chimenea queda en z = 2,75. */
function locomotora() {
  const T = armar();
  T.caja(1.7, 0.3, 6.9, 0, 0.85, 0, TINTA); // el bastidor
  T.tubo(0.7, -1.3, 2.3, 1.95, PINTADO, VERDE, 0.34); // la caldera
  for (const z of [-0.6, 0.5, 1.6]) T.tubo(0.72, z - 0.05, z + 0.05, 1.95, PINTADO, BRONCE, 0.8); // los zunchos
  T.tubo(0.76, 2.3, 3.15, 1.95, TINTA); // la caja de humo
  T.poste(0.2, 1.45, 0, 2.6, 2.75, TINTA); T.poste(0.2, 0.4, 0, 4.05, 2.75, TINTA, 0, 0, 0.36); // la chimenea, con su boca ancha
  T.poste(0.34, 0.5, 0, 2.55, 0.5, PINTADO, BRONCE, 0.8); T.add(new THREE.SphereGeometry(0.34, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 3.05, 0.5), PINTADO, BRONCE, 0.8); // el domo
  T.poste(0.1, 0.5, 0, 2.6, -0.7, PINTADO, BRONCE, 0.8); // la válvula
  T.caja(1.6, 1.75, 1.3, 0, 1.15, -1.95, PINTADO, VERDE, 0.34); // el hogar
  // el puesto del maquinista: un parabrisas de chapa y un techito sobre cuatro parantes
  T.caja(1.9, 1.2, 0.08, 0, 2.3, -1.32, PINTADO, VERDE, 0.34);
  for (const s of [-1, 1]) { T.caja(0.08, 1.9, 0.08, s * 0.9, 1.5, -1.35, TINTA); T.caja(0.08, 1.9, 0.08, s * 0.9, 1.5, -3.3, TINTA); T.caja(0.06, 0.9, 1.9, s * 0.93, 1.15, -2.35, PINTADO, VERDE, 0.34); }
  T.caja(2.1, 0.09, 2.3, 0, 3.4, -2.35, PINTADO, LONA, 0.86);
  T.caja(1.8, 0.1, 2.2, 0, 1.15, -2.5, TINTA); // el piso
  for (const s of [-1, 1]) T.tubo(0.2, 2.1, 3.0, 0.95, TINTA, 0, 0, s * 0.98); // los cilindros
  T.caja(2.15, 0.34, 0.16, 0, 0.8, 3.52, PINTADO, ROJO, 0.42); // el travesaño de adelante, con sus topes
  for (const s of [-1, 1]) T.tubo(0.13, 3.55, 3.85, 0.97, TINTA, 0, 0, s * 0.75);
  T.ruedas(0.48, 2.45); T.ruedas(0.86, 0.3); T.ruedas(0.48, -2.5);
  return T.geometria();
}
/** El ténder: 3,6 m. */
function tender() {
  const T = armar();
  T.caja(1.7, 0.3, 3.5, 0, 0.7, 0, TINTA);
  T.caja(2.0, 1.25, 3.4, 0, 1.0, 0, PINTADO, VERDE, 0.34);
  T.caja(1.6, 0.22, 2.3, 0, 2.2, -0.3, TINTA); // el carbón
  T.ruedas(0.5, 1.05); T.ruedas(0.5, -1.05);
  return T.geometria();
}
/** Un coche de dos ejes, con tres compartimentos: 6,1 m. */
function coche(tono) {
  const T = armar(), claro = tono === MADERA ? 0.5 : 0.7;
  T.caja(1.8, 0.26, 5.9, 0, 0.72, 0, TINTA);
  T.caja(2.2, 1.95, 5.8, 0, 0.98, 0, PINTADO, tono, claro);
  // el techo, apenas curvo: dos tablas, la de arriba más angosta
  T.caja(2.42, 0.1, 6.05, 0, 2.93, 0, PINTADO, LONA, 0.86); T.caja(1.6, 0.09, 6.05, 0, 3.03, 0, PINTADO, LONA, 0.86);
  // las ventanillas y las puertas, de tinta, a los dos lados
  for (const s of [-1, 1]) for (let c = -1; c <= 1; c++) {
    const z = c * 1.9, cara = (w, h, y, dz) => T.add(new THREE.PlaneGeometry(w, h).rotateY(s * Math.PI / 2).translate(s * 1.115, y, z + dz), TINTA);
    cara(0.5, 0.62, 2.3, 0); cara(0.36, 0.5, 2.36, -0.6); cara(0.36, 0.5, 2.36, 0.6);
    cara(0.035, 1.75, 1.92, -0.33); cara(0.035, 1.75, 1.92, 0.33); // el marco de la puerta
  }
  T.caja(2.24, 0.06, 5.84, 0, 1.92, 0, TINTA); // la moldura bajo las ventanillas
  for (const s of [-1, 1]) for (const z of [-3.0, 3.0]) T.tubo(0.11, z - 0.12, z + 0.12, 0.92, TINTA, 0, 0, s * 0.75); // los topes
  T.ruedas(0.5, 1.8); T.ruedas(0.5, -1.8);
  return T.geometria();
}

/**
 * @param tinta   lo de createTinta
 * @param mundo   (px, py) del plano → [x, z] en metros
 * @param alto    () => alto del dibujo en puntos de pantalla (para saber a qué distancia se distingue un tren)
 * @param etapa   () => la etapa de la línea de tiempo que se mira (0 = 1867 … 6 = 1940)
 * @param liviano en un teléfono: la mitad de los trenes
 */
export function createTren(tinta, { mundo, alto = () => innerHeight, etapa = () => 0, liviano = false }) {
  // ---------- las vías: una curva suave por los puntos marcados, y una tabla para andarla a paso parejo ----------
  const PASO = 2, ENTREVIA = 2.3;
  const tablaDe = (pts, alto) => { const c = new THREE.CatmullRomCurve3(pts.map(([px, py]) => { const [x, z] = mundo(px, py); return new THREE.Vector3(x, alto ? alto(px, py) : 0, z); }), false, 'centripetal'); return c.getSpacedPoints(Math.ceil(c.getLength() / PASO)); };
  /** la misma tabla, corrida d metros a la izquierda de su sentido de marcha */
  const corrida = (t, d) => t.map((p, i) => { const a = t[Math.max(0, i - 1)], b = t[Math.min(t.length - 1, i + 1)], dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1; return new THREE.Vector3(p.x + (dz / L) * d, p.y, p.z - (dx / L) * d); });
  const viaDe = (tabla) => { let largo = 0; for (let i = 1; i < tabla.length; i++) largo += tabla[i].distanceTo(tabla[i - 1]); return { tabla, tramos: tabla.length - 1, largo, paso: largo / (tabla.length - 1) }; };
  /** El punto de una vía a `s` metros de su principio. */
  const enVia = (v, s, o) => { const u = Math.min(v.tramos - 1e-6, Math.max(0, s / v.paso)), i = Math.floor(u); return o.lerpVectors(v.tabla[i], v.tabla[i + 1], u - i); };
  const lineas = LINEAS.map((L) => {
    const centro = tablaDe(L.pts, L.alto); // (con `alto`, la vía sube: el viaducto de Palermo)
    // (con dos vías se anda por la izquierda, como en la Argentina: la de ida y la de vuelta quedan una a cada lado)
    return { ...L, vias: L.doble ? [viaDe(corrida(centro, ENTREVIA)), viaDe(corrida([...centro].reverse(), ENTREVIA))] : [viaDe(centro)] };
  });
  const activa = (L, e) => L.desde <= e && (!L.hasta || e < L.hasta);

  // ---------- el dibujo de las vías: el balasto, los durmientes y los dos rieles. Aparecen y se van con la línea de
  // tiempo, igual que las casas (la cuenta de alzado(), en src/tinta.js) ----------
  const rieles = (() => {
    const P = [], N = [], I = [], W = [];
    const cuad = (a, b, c, d, kind, tono, claro, w) => { for (const p of [a, c, b, a, d, c]) { P.push(p[0], p[1], p[2]); N.push(0, 1, 0); I.push(0.3, kind * 10 + 1, 4, w); W.push(p[0] * 0.5 + p[2] * 0.3 + 500, p[1], tono, claro); } };
    for (const L of lineas) for (const v of L.vias) {
      const t = v.tabla, lado = (i, d, y) => { const a = t[Math.max(0, i - 1)], b = t[Math.min(t.length - 1, i + 1)], dx = b.x - a.x, dz = b.z - a.z, m = Math.hypot(dx, dz) || 1; return [t[i].x + (dz / m) * d, y + t[i].y, t[i].z - (dx / m) * d]; };
      const cuando = (i) => Math.hypot(t[i].x, t[i].z) + (L.desde + 8 * L.hasta) * 20000;
      // (en la calle no hay balasto ni durmientes a la vista: solo los rieles)
      for (let i = 0; i + 2 < t.length; i += 2) {
        const j = i + 2, w = cuando(i);
        if (!L.enCalle) cuad(lado(i, -1.75, 0.1), lado(i, 1.75, 0.1), lado(j, 1.75, 0.1), lado(j, -1.75, 0.1), PINTADO, BALASTO, 0.66, w);
        for (const s of [-1, 1]) cuad(lado(i, s * TROCHA - 0.09, 0.22), lado(i, s * TROCHA + 0.09, 0.22), lado(j, s * TROCHA + 0.09, 0.22), lado(j, s * TROCHA - 0.09, 0.22), TINTA, 0, 0, w);
      }
      if (!L.enCalle) for (let i = 1; i + 1 < t.length; i += liviano ? 2 : 1) {
        const a = t[i - 1], b = t[i + 1], dx = b.x - a.x, dz = b.z - a.z, m = Math.hypot(dx, dz) || 1, ux = dx / m, uz = dz / m, p = t[i], q = (d, e) => [p.x + uz * d + ux * e, 0.16 + p.y, p.z - ux * d + uz * e];
        cuad(q(-1.45, -0.16), q(1.45, -0.16), q(1.45, 0.16), q(-1.45, 0.16), PINTADO, MADERA, 0.3, cuando(i));
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aInfo', new THREE.Float32BufferAttribute(I, 4)); g.setAttribute('aWall', new THREE.Float32BufferAttribute(W, 4));
    // (apenas por encima del suelo: un empujón en la profundidad para que no titile contra él)
    const m = new THREE.Mesh(g, tinta.make({ polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })); m.frustumCulled = false; m.receiveShadow = true; m.castShadow = false;
    trozar(m); soltar(g); // (en trozos: las vías que no se ven no se dibujan, src/trozos.js)
    return m;
  })();

  // ---------- las piezas: cada clase es una sola malla repetida (todas las locomotoras, todos los coches de madera…) ----------
  const material = tinta.make(), prof = tinta.depth(), grupo = new THREE.Group();
  const CUPO = liviano ? 160 : 320;
  const clase = (g, largo, ejes, cupo) => { const malla = new THREE.InstancedMesh(g, material, cupo); malla.customDepthMaterial = prof; malla.castShadow = true; malla.receiveShadow = false; malla.frustumCulled = false; malla.count = 0; grupo.add(malla); return { malla, largo: largo * ESCALA, medio: (ejes * ESCALA) / 2, n: 0 }; };
  const MAQUINA = clase(locomotora(), 7.2, 4.9, 72), TENDER = clase(tender(), 3.6, 2.1, 72), COCHES = [clase(coche(MADERA), 6.1, 3.6, CUPO), clase(coche(OCRE), 6.1, 3.6, CUPO)];
  const ENGANCHE = 0.45;
  /** Una formación, de la cola hacia adelante: dónde va el centro de cada pieza, medido desde la cola. */
  const formaciones = new Map();
  const formacion = (coches, electrico) => {
    const k = coches + (electrico ? 'e' : 'v'); if (formaciones.has(k)) return formaciones.get(k);
    const piezas = []; for (let i = 0; i < coches + (electrico ? 1 : 0); i++) piezas.push(COCHES[electrico ? 0 : (i + 1) % 2 ? 0 : 1]);
    if (!electrico) piezas.push(TENDER, MAQUINA);
    let cola = 0; const f = { piezas: piezas.map((c) => { const p = { c, centro: cola + c.largo / 2 }; cola += c.largo + ENGANCHE; return p; }), humo: !electrico };
    f.largo = cola - ENGANCHE; formaciones.set(k, f); return f;
  };
  // el humo: bocanadas redondas, de papel (blancas en color), que suben y se van con el viento
  const gh = (() => { const g = new THREE.IcosahedronGeometry(1, 1), n = g.attributes.position.count, I = new Float32Array(n * 4), W = new Float32Array(n * 4); for (let i = 0; i < n; i++) { I.set([0.2, PIEDRA * 10 + 1, 4, 0], i * 4); W.set([g.attributes.position.getX(i) + 500, g.attributes.position.getY(i), 0, 0], i * 4); } g.setAttribute('aInfo', new THREE.BufferAttribute(I, 4)); g.setAttribute('aWall', new THREE.BufferAttribute(W, 4)); return g; })();
  const HUMO_CUPO = 72 * HUMOS, humo = new THREE.InstancedMesh(gh, material, HUMO_CUPO); humo.frustumCulled = false; humo.castShadow = false; humo.receiveShadow = false; humo.count = 0; grupo.add(humo);
  grupo.add(rieles);

  // ---------- el horario ----------
  // En las líneas de una vía (vaivén): espera, sale despacio, anda, frena, espera y vuelve marcha atrás.
  // En las de dos: por una salen trenes cada tantos segundos, que se pierden por el borde del plano, y por la otra
  // llegan otros tantos, que frenan en el andén, esperan y se van (ahí mismo: son los que después salen por la otra).
  const horarios = new Map();
  function horario(e) {
    if (horarios.has(e)) return horarios.get(e);
    const [V, coches, cada] = EPOCA[e], H = cada * (liviano ? 2 : 1), tA = V / EMPUJE, dA = (V * tA) / 2, trenes = [];
    for (const L of lineas) {
      if (!activa(L, e)) continue;
      const f = formacion(coches, !!L.electrico && e >= L.electrico);
      if (!L.doble) {
        const via = L.vias[0], R = via.largo - f.largo, tV = Math.max(0, (R - 2 * dA) / V), VIAJE = 2 * tA + tV, CICLO = 2 * (ESPERA + VIAJE);
        const tramo = (t) => (t <= 0 ? 0 : t < tA ? (EMPUJE * t * t) / 2 : t < tA + tV ? dA + V * (t - tA) : t < VIAJE ? R - (EMPUJE * (VIAJE - t) ** 2) / 2 : R);
        trenes.push({ L, via, f, ciclo: CICLO, viaje: VIAJE, donde: (t, o) => { const c = ((t % CICLO) + CICLO) % CICLO; o.s = c < ESPERA + VIAJE ? tramo(c - ESPERA) : R - tramo(c - 2 * ESPERA - VIAJE); o.vis = 1; } });
        continue;
      }
      const [ida, vuelta] = L.vias, Tv = tA + (ida.largo - dA) / V, n = Math.ceil((ESPERA + Tv) / H), C = n * H, R = vuelta.largo - f.largo, Tc = (vuelta.largo - dA) / V;
      for (let j = 0; j < n; j++) {
        trenes.push({ L, via: ida, f, ciclo: C, donde: (t, o) => { const p = (((t + j * H) % C) + C) % C; if (p < ESPERA) { o.s = 0; o.vis = Math.min(1, p / POP); } else { const u = p - ESPERA; o.s = u < tA ? (EMPUJE * u * u) / 2 : dA + V * (u - tA); o.vis = u <= Tv ? 1 : 0; } } });
        trenes.push({ L, via: vuelta, f, ciclo: C, donde: (t, o) => { const p = (((t + (j + 0.5) * H) % C) + C) % C; if (p < Tv) { const u = p - Tc; o.s = -f.largo + (u < 0 ? V * p : vuelta.largo - dA + V * u - (EMPUJE * u * u) / 2); o.vis = 1; } else { o.s = R; o.vis = Math.max(0, Math.min(1, (Tv + ESPERA - p) / POP)); } } });
      }
    }
    for (const t of trenes) { t.bulto = new THREE.Sphere(new THREE.Vector3(), t.f.largo / 2 + 22); t.dibujado = new THREE.Vector3(1e9, 0, 0); t.tDibujado = -1e9; t.sube = 0; }
    horarios.set(e, trenes); return trenes;
  }

  const a = new THREE.Vector3(), b = new THREE.Vector3(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), esc = new THREE.Vector3(), boca = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), est = { s: 0, vis: 0 }, antes = { s: 0, vis: 0 };
  const azar = (n) => { const v = Math.sin(n * 127.1) * 43758.5453; return v - Math.floor(v); };
  /** Dónde estaba la boca de la chimenea de un tren cuando tenía la cola en `s` (falso si la máquina no estaba a la vista). */
  const chimenea = (t, s, o) => { const p = t.f.piezas[t.f.piezas.length - 1], c = s + p.centro; if (c < 1 || c > t.via.largo - 1) return false; enVia(t.via, c + p.c.medio, a); enVia(t.via, c - p.c.medio, b); const L = a.distanceTo(b) || 1; o.addVectors(a, b).multiplyScalar(0.5).addScaledVector(a.sub(b), (2.75 * ESCALA) / L).setY(4.5 * ESCALA); return true; };
  let T = 0, actuales = [], frenteAhora = 0;
  /** Pone cada pieza de cada tren en su lugar para el instante T. */
  function colocar() {
    for (const c of [MAQUINA, TENDER, ...COCHES]) c.n = 0;
    let nh = 0;
    for (const t of actuales) {
      t.donde(T, est); t.s = est.s; t.vis = est.vis;
      enVia(t.via, est.s + t.f.largo / 2, t.bulto.center);
      // (la misma cuenta que alzado() en src/tinta.js: se levanta cuando la ola llega adonde está)
      const k = Math.min(1, Math.max(0, (frenteAhora - Math.hypot(t.bulto.center.x, t.bulto.center.z)) / 300)), k1 = k - 1;
      t.sube = (k <= 0 ? 0 : 1 + 2.2 * k1 * k1 * k1 + 1.2 * k1 * k1) * est.vis;
      if (t.sube <= 0) continue;
      for (const p of t.f.piezas) {
        const c = est.s + p.centro; if (c < 1 || c > t.via.largo - 1 || p.c.n >= p.c.malla.instanceMatrix.count) continue; // (lo que ya salió del plano, o todavía no entró)
        enVia(t.via, c + p.c.medio, a); enVia(t.via, c - p.c.medio, b);
        q.setFromAxisAngle(Y, Math.atan2(a.x - b.x, a.z - b.z));
        p.c.malla.setMatrixAt(p.c.n++, m4.compose(a.add(b).multiplyScalar(0.5), q, esc.set(1, t.sube, 1)));
      }
      // cada bocanada sale de donde estaba la chimenea en su momento, y desde ahí sube, se agranda y se deshace
      if (!t.f.humo) continue;
      const n0 = Math.floor(T / CADA);
      for (let j = 0; j < HUMOS && nh < HUMO_CUPO; j++) {
        const n = n0 - j, edad = T - n * CADA, vida = edad / (HUMOS * CADA);
        t.donde(n * CADA, antes); if (antes.vis < 0.5 || !chimenea(t, antes.s, boca)) continue;
        const r = (0.45 + 0.2 * edad) * (0.6 + 0.6 * azar(n)) * Math.min(1, edad / 0.5) * (1 - Math.max(0, (vida - 0.6) / 0.4) ** 2) * t.sube;
        boca.x += VIENTO[0] * edad + (azar(n + 0.3) - 0.5) * 0.5 * edad; boca.z += VIENTO[1] * edad + (azar(n + 0.7) - 0.5) * 0.5 * edad; boca.y = boca.y * t.sube + (7 + 5 * azar(n + 0.5)) * (1 - Math.exp(-edad / 4)) + r * 0.5;
        humo.setMatrixAt(nh++, m4.compose(boca, q.identity(), esc.setScalar(Math.max(r, 1e-4))));
      }
    }
    for (const c of [MAQUINA, TENDER, ...COCHES]) { c.malla.count = c.n; c.malla.instanceMatrix.needsUpdate = true; }
    humo.count = nh; humo.instanceMatrix.needsUpdate = true;
  }

  const vista = new THREE.Frustum(), pv = new THREE.Matrix4();
  let etapaAntes = -1, algoAntes = false;
  /**
   * Avanza `dt` segundos. `frente`: hasta dónde llegó la ola que levanta la ciudad (los trenes se levantan con ella).
   * Devuelve si hay que volver a dibujar por ellos: solo si alguno se ve, se distingue y se movió en la pantalla.
   */
  function actualizar(dt, camera, frente) {
    T += dt; frenteAhora = frente;
    const e = Math.max(0, Math.min(EPOCA.length - 1, etapa())), cambio = e !== etapaAntes; etapaAntes = e;
    actuales = horario(e);
    colocar();
    let algo = false; for (const t of actuales) if (t.sube > 0) { algo = true; break; }
    const habia = algoAntes; algoAntes = algo;
    if (cambio || algo !== habia) { for (const t of actuales) t.tDibujado = -1e9; return true; }
    if (!algo) return false;
    camera.updateMatrixWorld(); vista.setFromProjectionMatrix(pv.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    const tan = 2 * Math.tan((camera.fov * Math.PI) / 360), al = Math.max(1, alto());
    let pide = false;
    for (const t of actuales) {
      if (t.sube <= 0 || !vista.intersectsSphere(t.bulto)) continue;
      // cuántos metros entran en un punto de pantalla a esa distancia
      const punto = (camera.position.distanceTo(t.bulto.center) * tan) / al;
      if (t.f.largo / punto < 12) continue; // (todo el tren en menos de 12 puntos: no se distingue)
      // (parado en la estación solo se mueve el humo, y despacio; y mientras aparece o se va, cambia de alto)
      if (Math.max(t.dibujado.distanceTo(t.bulto.center), (T - t.tDibujado) * (t.vis < 1 ? 6 : t.f.humo ? 0.9 : 0)) < punto * 0.5) continue;
      t.dibujado.copy(t.bulto.center); t.tDibujado = T; pide = true;
    }
    return pide;
  }

  const parque = () => horario(0).find((t) => t.L.clave === 'parque');
  return {
    grupo, actualizar, lineas,
    /** (para las pruebas y las capturas) el reloj de los trenes, en segundos */
    get tiempo() { return T; }, set tiempo(v) { T = v; for (const t of actuales) t.tDibujado = -1e9; },
    /** Pone el tren del Parque en su estación, a punto de salir (al tocar la marca de la estación). */
    salir(en = 2.5) { T = ESPERA - en; for (const t of actuales) t.tDibujado = -1e9; },
    /** (lo del tren de la Estación del Parque, el de 1867) cuánto dura su ciclo y su viaje, cuánto espera, cuánto mide la vía y dónde está */
    get ciclo() { return parque().ciclo; }, get viaje() { return parque().viaje; }, espera: ESPERA, get largo() { return parque().via.largo; },
    get lugar() { const t = parque(); t.donde(T, est); enVia(t.via, est.s + t.f.largo / 2, a); return { x: a.x, z: a.z }; },
    /** cuántos trenes hay andando en la etapa que se mira, y dónde está cada uno (para las pruebas) */
    get trenes() { return actuales.map((t) => ({ linea: t.L.clave, x: t.bulto.center.x, z: t.bulto.center.z, visible: t.sube > 0 })); },
  };
}
