// Lo que faltaba fuera del eje Plaza de Mayo–Retiro–Palermo: las canchas de fútbol, la Penitenciaría, los hospitales,
// la cárcel de Caseros, el Parque de los Patricios y unos edificios sueltos del centro. Los solares (con su etapa y sus
// cuatro esquinas) están en `src/barrios.js`; `tools/crece.mjs` los despeja de casas.
//
// Qué es dato y qué no. De cada lugar es dato dónde estaba (las esquinas de hoy, de `tools/esquina.mjs`), desde cuándo
// y a grandes rasgos qué era: una cancha de tablones con una tribuna techada, un penal radial de cinco pabellones
// detrás de una muralla con torreones, un hospital de pabellones sueltos en un jardín, un mercado de naves de hierro.
// Las medidas de cada cuerpo, cuántos pabellones y dónde va cada uno son supuestos: no hay acá una planta de época
// de ninguno. Las canchas que no caen en ninguna etapa no están: la de River en Alvear y Tagle (1923-1938) y la de
// tablones de Boca (1924-1938) nacen después del plano de 1921 y ya no están en 1940.
//
// En cada solar: x a lo largo del frente (de la esquina A a la B), z hacia el fondo; el origen, metido `m` metros.
import { SITIOS } from '../barrios.js';
import { PARQUES_PALERMO } from '../palermo.js';

export default function (c) {
  const { THREE, PIEDRA, CASA, TINTA, PIZARRA, PINTADO, PINTA } = c;
  const P = (tono, claro = 0.6) => ({ pinta: [tono, claro] });
  const HORMIGON = P(PINTA.BALDOSA, 0.88), CHAPA = P(PINTA.CHAPA, 0.8), BLANCO = P(PINTA.BLANCO, 0.97), MADERA = P(PINTA.MADERA, 0.6), TABLA = P(PINTA.MADERA, 0.45), RAYA = P(PINTA.ADOQUIN, 0.6);
  let semilla = 20251; const R = () => { semilla = (Math.imul(semilla, 1664525) + 1013904223) | 0; return ((semilla >>> 8) & 0xffff) / 65536; };
  const paños = (T, Q, kind, o) => {
    const v = []; for (const [a, b, d, e] of Q) v.push(a, b, d, a, d, e, a, d, b, a, e, d);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v.flat(), 3)); g.computeVertexNormals(); T.put(g, kind, o);
  };
  /** el marco de un solar: { T, L, W } (L a lo largo del frente, W de fondo), ya metido `m` y con su etapa puesta */
  const marco = (Pq, m, e, hasta = 0) => {
    const [A, B, , D] = Pq; let o = A, ux = B[0] - A[0], uy = B[1] - A[1]; const l = Math.hypot(ux, uy); ux /= l; uy /= l;
    let w = (D[0] - A[0]) * -uy + (D[1] - A[1]) * ux; if (w < 0) { o = B; ux = -ux; uy = -uy; w = -w; }
    const k = m / 0.675; c.epoca(e, hasta);
    return { T: c.lugar(o[0] + (ux - uy) * k, o[1] + (uy + ux) * k, ux, uy), L: l * 0.675 - 2 * m, W: w * 0.675 - 2 * m };
  };
  const sitio = (clave) => { const S = SITIOS[clave]; return marco(S.P, S.m, S.e, S.hasta); };

  // ------------------------------------------------------------------------------------------------------ las piezas
  /** un pabellón: paredes con ventanas y techo a dos aguas (o azotea) */
  const pab = (T, x, z, w, d, pisos, tono, techo = true) => {
    const h = pisos * 4.2 + 0.8; T.caja(w, h, d, x, 0, z, CASA, { floors: pisos, tono });
    if (techo) T.tejado(w + 1, d + 1, Math.min(w, d) * 0.26, x, h, z, w >= d ? 'x' : 'z'); else T.caja(w + 0.5, 0.5, d + 0.5, x, h, z, PIEDRA, { tono });
    return h;
  };
  /** una pared entre dos puntos */
  const pared = (T, a, b, h, o, kind = PIEDRA, g = 0.5) => {
    const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), nx = (dz / l) * g * 0.5, nz = (-dx / l) * g * 0.5;
    T.prisma([[a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz], [a[0] - nx, a[1] - nz]], h, 0, kind, o);
  };
  const cerco = (T, L, W, h, o, kind) => { pared(T, [0, 0], [L, 0], h, o, kind); pared(T, [L, 0], [L, W], h, o, kind); pared(T, [L, W], [0, W], h, o, kind); pared(T, [0, W], [0, 0], h, o, kind); };
  const arboles = (T, n, x0, z0, x1, z1, libre = () => true) => { for (let i = 0; i < n; i++) { const x = x0 + R() * (x1 - x0), z = z0 + R() * (z1 - z0), r = 2.6 + R() * 1.6; if (libre(x, z)) T.arbol(x, z, r); } };

  /** la cancha: el césped, las líneas y los arcos. eje: a lo largo de 'x' o de 'z'. y0: a qué altura va el césped */
  const cancha = (T, cx, cz, eje, L = 105, A = 68, y0 = 0.1) => {
    const Q = (w, d, x, z) => (eje === 'x' ? T.recto(w, d, cx + x, cz + z) : T.recto(d, w, cx + z, cz + x));
    T.tapete(Q(L, A, 0, 0), PINTA.CESPED, { y: y0, claro: 0.78 });
    for (const [w, d, x, z] of [[L, 0.5, 0, -A / 2], [L, 0.5, 0, A / 2], [0.5, A, -L / 2, 0], [0.5, A, L / 2, 0], [0.5, A, 0, 0], [0.5, 40, -L / 2 + 16.5, 0], [0.5, 40, L / 2 - 16.5, 0],
      [16.5, 0.5, -L / 2 + 8.25, -20], [16.5, 0.5, -L / 2 + 8.25, 20], [16.5, 0.5, L / 2 - 8.25, -20], [16.5, 0.5, L / 2 - 8.25, 20]]) T.tapete(Q(w, d, x, z), PINTA.BLANCO, { y: y0 + 0.22, claro: 0.97 });
    for (const s of [-1, 1]) {
      const p = (u, v) => (eje === 'x' ? [cx + u, cz + v] : [cx + v, cz + u]);
      for (const v of [-3.66, 3.66]) { const [x, z] = p((s * L) / 2, v); T.caja(0.14, 2.44, 0.14, x, 0, z, PINTADO, BLANCO); }
      const [x, z] = p((s * L) / 2, 0); T.caja(eje === 'x' ? 0.14 : 7.46, 0.14, eje === 'x' ? 7.46 : 0.14, x, 2.44, z, PINTADO, BLANCO);
    }
  };
  /** una tribuna: de a a b es el borde de adelante; sube alejándose de `ctr` (el centro de la cancha) */
  const grada = (T, a, b, ctr, hondo, h0, h1, o, muro, techo = false) => {
    const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); let nx = dz / l, nz = -dx / l;
    if ((ctr[0] - a[0]) * nx + (ctr[1] - a[1]) * nz > 0) { nx = -nx; nz = -nz; }
    const f = (p, t) => [p[0] + nx * hondo * t, p[1] + nz * hondo * t], v = (p, y) => [p[0], y, p[1]], a2 = f(a, 1), b2 = f(b, 1);
    paños(T, [[v(a, h0), v(b, h0), v(b2, h1), v(a2, h1)]], PINTADO, o);
    paños(T, [[v(a, 0), v(b, 0), v(b, h0), v(a, h0)], [v(a2, 0), v(b2, 0), v(b2, h1 + 1), v(a2, h1 + 1)], [v(a, 0), v(a2, 0), v(a2, h1 + 1), v(a, h0)], [v(b, 0), v(b2, 0), v(b2, h1 + 1), v(b, h0)]], PINTADO, muro);
    const n = Math.max(3, Math.round(hondo / 2.2)), rayas = [];
    for (let i = 1; i < n; i++) { const t = i / n, y = h0 + (h1 - h0) * t + 0.08; rayas.push([v(f(a, t), y), v(f(b, t), y), v(f(b, t + 0.02), y + 0.2), v(f(a, t + 0.02), y + 0.2)]); }
    paños(T, rayas, PINTADO, RAYA);
    if (techo) { // el techo de chapa de la tribuna oficial, sobre postes
      const y0 = h1 + 5.5, y1 = h1 + 3.6;
      paños(T, [[v(f(a, 0.25), y0), v(f(b, 0.25), y0), v(b2, y1), v(a2, y1)]], PINTADO, CHAPA);
      const k = Math.max(2, Math.round(l / 9));
      for (let i = 0; i <= k; i++) { const t = i / k, q = [a[0] + dx * t, a[1] + dz * t]; for (const [u, y] of [[0.3, y0 - 0.1], [0.98, y1]]) { const s = f(q, u), yb = h0 + (h1 - h0) * u; T.caja(0.3, y - yb, 0.3, s[0], yb, s[1], TINTA); } }
    }
  };
  /** un rectángulo de medio largo a y medio ancho b con las esquinas redondeadas de radio r: las estaciones [u, v] */
  const contorno = (a, b, r, n = 6) => {
    r = Math.min(r, a, b); const Q = [], E = [[a - r, b - r, 0], [r - a, b - r, 90], [r - a, r - b, 180], [a - r, r - b, 270]];
    E.forEach(([cu, cv, g0], i) => {
      for (let k = 0; k <= n; k++) { const g = ((g0 + (90 * k) / n) * Math.PI) / 180; Q.push([cu + Math.cos(g) * r, cv + Math.sin(g) * r]); }
      const [nu, nv, ng] = E[(i + 1) % 4], g1 = (ng * Math.PI) / 180, A = Q[Q.length - 1], B = [nu + Math.cos(g1) * r, nv + Math.sin(g1) * r], m = Math.max(1, Math.round((i % 2 ? 2 * (b - r) : 2 * (a - r)) / 12));
      for (let k = 1; k < m; k++) Q.push([A[0] + ((B[0] - A[0]) * k) / m, A[1] + ((B[1] - A[1]) * k) / m]);
    });
    return Q;
  };
  /** una barra de hierro entre dos puntos [x, y, z] */
  const barra = (T, A, B, g = 0.3) => {
    const d = new THREE.Vector3(B[0] - A[0], B[1] - A[1], B[2] - A[2]), l = d.length(); if (l < 0.05) return;
    const geo = new THREE.CylinderGeometry(g * 0.7, g * 0.7, l, 4, 1, false); geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
    T.put(geo.translate((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2), TINTA);
  };
  /** una tribuna corrida alrededor de la cancha: por adentro el contorno (a, b, r), `hondo` de fondo, de h0 a h1.
   *  hierro: sin pared de atrás, con los pies derechos y las cruces de la estructura a la vista */
  const anillo = (T, cx, cz, eje, { a, b, r, hondo, h0 = 1.4, h1, o = MADERA, muro = TABLA, hierro = false }) => {
    const p = ([u, v]) => (eje === 'x' ? [cx + u, cz + v] : [cx + v, cz + u]);
    const I = contorno(a, b, r).map(p), O = contorno(a + hondo, b + hondo, r + hondo).map(p), N = I.length, v = (q, y) => [q[0], y, q[1]], f = (i, t) => [I[i][0] + (O[i][0] - I[i][0]) * t, I[i][1] + (O[i][1] - I[i][1]) * t];
    const G = [], M = [], Ry = [], n = Math.max(3, Math.round(hondo / 2.4));
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      G.push([v(I[i], h0), v(I[j], h0), v(O[j], h1), v(O[i], h1)]); M.push([v(I[i], 0), v(I[j], 0), v(I[j], h0), v(I[i], h0)]);
      if (!hierro) M.push([v(O[i], 0), v(O[j], 0), v(O[j], h1 + 1), v(O[i], h1 + 1)]);
      for (let k = 1; k < n; k++) { const t = k / n, y = h0 + (h1 - h0) * t + 0.08; Ry.push([v(f(i, t), y), v(f(j, t), y), v(f(j, t + 0.015), y + 0.2), v(f(i, t + 0.015), y + 0.2)]); }
      if (hierro) {
        const m = f(i, 0.5), ym = h0 + (h1 - h0) * 0.5;
        barra(T, v(O[i], 0), v(O[i], h1 + 1.2), 0.36); barra(T, v(m, 0), v(m, ym), 0.3); barra(T, v(m, 0), v(O[i], h1), 0.24);
        barra(T, v(O[i], h1 + 1.2), v(O[j], h1 + 1.2), 0.24); barra(T, v(O[i], h1 * 0.5), v(O[j], h1 * 0.5), 0.2); barra(T, v(O[i], 0), v(O[j], h1 * 0.5), 0.18); barra(T, v(O[i], h1 * 0.5), v(O[j], h1), 0.18);
      }
    }
    paños(T, G, PINTADO, o); paños(T, M, PINTADO, muro); paños(T, Ry, PINTADO, RAYA);
  };
  /** una cancha con sus tribunas. largos y cabeceras: la altura de cada una (0: no hay); la primera de `largos` queda del lado de z (o x) menor */
  const estadio = (T, cx, cz, eje, { L = 105, A = 68, largos = [8, 8], cabeceras = [6, 6], o = MADERA, muro = TABLA, techo = -1, sep = 7, k = 1.7 } = {}) => {
    cancha(T, cx, cz, eje, L, A);
    const p = (u, v) => (eje === 'x' ? [cx + u, cz + v] : [cx + v, cz + u]);
    largos.forEach((h, i) => { if (h) { const s = i ? 1 : -1; grada(T, p(-L / 2 - 2, s * (A / 2 + sep)), p(L / 2 + 2, s * (A / 2 + sep)), [cx, cz], h * k, 1.2, h, o, muro, techo === i); } });
    cabeceras.forEach((h, i) => { if (h) { const s = i ? 1 : -1; grada(T, p(s * (L / 2 + sep), -A / 2 - 2), p(s * (L / 2 + sep), A / 2 + 2), [cx, cz], h * k, 1.2, h, o, muro); } });
  };
  /** un hospital de pabellones: la administración al frente, los pabellones en filas, la capilla y los árboles */
  const hospital = (T, L, W, { tono = c.CREMA, cols = 4, filas = 1, pisos = 2, admin = 2, capilla = true, cercoAlto = 2.4 } = {}) => {
    T.tapete(T.recto(L - 2, W - 2, L / 2, W / 2), PINTA.CESPED, { y: 0.08, claro: 0.76 });
    T.tapete(T.recto(6, W - 30, L / 2, W / 2 + 6), PINTA.GRANZA, { y: 0.3 });
    cerco(T, L, W, cercoAlto, { tono });
    const fa = Math.min(L * 0.5, 80); pab(T, L / 2, 12, fa, 13, admin, tono); T.caja(14, admin * 4.2 + 4, 15, L / 2, 0, 12, CASA, { floors: admin, tono }); T.tejado(15, 16, 3, L / 2, admin * 4.2 + 4, 12, 'z');
    const z0 = 34, zf = W - 14, paso = (zf - z0) / filas, ocupa = [];
    for (let f = 0; f < filas; f++) for (let i = 0; i < cols; i++) {
      const lado = i < cols / 2 ? -1 : 1, n = i < cols / 2 ? cols / 2 - i : i - cols / 2 + 1, x = L / 2 + lado * (n - 0.5) * ((L - 20) / cols), z = z0 + paso * (f + 0.5), d = paso - 14;
      pab(T, x, z, 12, d, pisos, tono); ocupa.push([x, z, 9, d / 2 + 3]);
      T.tapete(T.recto(Math.abs(x - L / 2), 2.4, (x + L / 2) / 2, z), PINTA.GRANZA, { y: 0.3 });
    }
    if (capilla) { const z = W - 22; T.caja(9, 9, 16, L / 2, 0, z, PIEDRA, { tono }); T.tejado(10, 17, 3.2, L / 2, 9, z, 'z'); T.caja(3, 15, 3, L / 2, 0, z - 8, PIEDRA, { tono }); T.piramide(2.4, 4, L / 2, 15, z - 8); ocupa.push([L / 2, z, 8, 12]); }
    arboles(T, Math.round((L * W) / 420), 5, 22, L - 5, W - 5, (x, z) => Math.abs(x - L / 2) > 6 && !ocupa.some(([ox, oz, rx, rz]) => Math.abs(x - ox) < rx && Math.abs(z - oz) < rz));
  };

  // ------------------------------------------------------------------------------------------------------ las canchas
  // Cada una, como se la ve en las fotos de época de Wikimedia Commons (los nombres de archivo, entre comillas) y como
  // la cuentan los artículos de Wikipedia de cada estadio.
  { // El Gasómetro de San Lorenzo, en Avenida La Plata. En 1916 era una cancha con una tribuna oficial de madera, techada
    // a dos aguas («San lorenzo estadio tribunaoficial 1922»). El estadio que le dio el nombre es de 1929-1930: una
    // tribuna corrida de tablones sobre hierro, de esquinas curvas y pareja de alto por los cuatro lados, con la
    // estructura a la vista por afuera («Estadio san lorenzo gasometro 1930», «El Gasometro» —la foto aérea—).
    const { T, L, W } = sitio('gasometro'), cx = L / 2, cz = 84;
    c.epoca(5, 6); cerco(T, L, W, 2.6, TABLA, PINTADO);
    cancha(T, cx, cz, 'x'); grada(T, [cx - 30, cz - 42], [cx + 30, cz - 42], [cx, cz], 12, 1.5, 8, MADERA, TABLA, true);
    grada(T, [cx - 45, cz + 42], [cx + 45, cz + 42], [cx, cz], 6, 1, 3.6, MADERA, TABLA);
    c.epoca(6); cerco(T, L, W, 3, CHAPA, PINTADO);
    cancha(T, cx, cz, 'x'); anillo(T, cx, cz, 'x', { a: 60, b: 41, r: 20, hondo: 30, h0: 1.6, h1: 17, o: MADERA, muro: TABLA, hierro: true });
    for (let i = 0; i < 4; i++) T.tapete(T.recto(16, 32, 26 + i * 22, W - 22), PINTA.GRANZA, { y: 0.12 });
    T.cantero(T.recto(44, 16, L - 50, W - 26, 2), { tono: PINTA.AGUA, alto: 0.4 }); pab(T, L - 50, W - 8, 40, 9, 2, c.CREMA, false);
  }
  { // La cancha de Huracán en Alcorta y Luna (1924): tribunas de madera por los cuatro lados y, entre ellas y la cancha,
    // una pista peraltada de cemento para carreras de motos y bicicletas («Estadio antiguo Club Atletico Huracan»).
    // La desarmaron desde 1942 para hacer el estadio de hoy.
    const { T, L, W } = sitio('huracan'), cx = L / 2, cz = W / 2; cerco(T, L, W, 2.6, TABLA, PINTADO);
    T.tapete(contorno(59, 41, 30).map(([u, v]) => [cx + u, cz + v]), PINTA.BALDOSA, { y: 0.1 });
    T.tapete(contorno(53, 35, 25).map(([u, v]) => [cx + u, cz + v]), PINTA.CESPED, { y: 0.32, claro: 0.78 }); cancha(T, cx, cz, 'x', 100, 64, 0.54);
    anillo(T, cx, cz, 'x', { a: 59, b: 41, r: 30, hondo: 11, h0: 1.4, h1: 7.5 });
  }
  { // El estadio de Sportivo Barracas (1920-1937): una olla baja de cemento todo alrededor, con un murito con
    // balaustres contra la cancha («Estadio sportivo barracas construccion»), y sobre Luzuriaga la tribuna oficial,
    // alta y techada («Stadio Sportivo Barracas», «Sp barracas sudamericano 1921»). Lo demolieron en 1937.
    const { T, L, W } = sitio('sportivo'), cx = L / 2, cz = W / 2 + 4; cerco(T, L, W, 3, { tono: c.GRIS });
    cancha(T, cx, cz, 'x'); anillo(T, cx, cz, 'x', { a: 58, b: 40, r: 36, hondo: 13, h0: 1, h1: 5, o: HORMIGON, muro: HORMIGON });
    grada(T, [cx - 32, cz - 47], [cx + 32, cz - 47], [cx, cz], 13, 4.5, 11.5, HORMIGON, HORMIGON, true);
    for (const s of [-1, 1]) T.caja(0.2, 6, 0.2, cx + s * 30, 16.5, cz - 58, PINTADO, BLANCO);
  }
  { // La cancha de River en la Dársena Sur (1915-1923): la tribuna oficial, larga y techada sobre postes
    // («River v racing en darsena sur tribuna oficial 1915»), y enfrente una popular baja.
    const { T, L, W } = sitio('riverDarsena'), cx = L / 2 + 3, cz = W / 2; cerco(T, L, W, 2.4, TABLA, PINTADO);
    cancha(T, cx, cz, 'z', 98, 58);
    grada(T, [cx - 33, cz - 40], [cx - 33, cz + 40], [cx, cz], 9, 1.6, 6.5, MADERA, TABLA, true);
    grada(T, [cx + 33, cz - 34], [cx + 33, cz + 34], [cx, cz], 5, 1, 3.2, MADERA, TABLA);
  }
  { // La Sociedad Sportiva Argentina (1899-1914), donde hoy está el polo: la pista ovalada, la cancha en el medio y la
    // tribuna larga de madera. Ahí jugó la selección y se corrieron las primeras carreras de autos y los primeros vuelos.
    const polo = PARQUES_PALERMO.find((p) => /polo/i.test(p[0]));
    if (polo) {
      // (el contorno del polo no es un rectángulo: el marco va por su centro, a lo largo del lado largo, como en palermo.js)
      const Q = polo[2], mx = Q.reduce((t, p) => t + p[0], 0) / 4, my = Q.reduce((t, p) => t + p[1], 0) / 4, dl = Math.hypot(Q[2][0] - Q[1][0], Q[2][1] - Q[1][1]), qx = (Q[2][0] - Q[1][0]) / dl, qy = (Q[2][1] - Q[1][1]) / dl;
      const en = (u, v) => [mx + (qx * u - qy * v) / 0.675, my + (qy * u + qx * v) / 0.675];
      const { T, L, W } = marco([en(-170, -88), en(170, -88), en(170, 88), en(-170, 88)], 0, 3, 5), cx = L / 2, cz = W / 2, rx = Math.min(L / 2 - 26, 150), rz = Math.min(W / 2 - 8, 70);
      const eje = L >= W ? 'x' : 'z', O = (a, b) => (eje === 'x' ? T.ovalo(cx, cz, a, b, 40) : T.ovalo(cx, cz, b, a, 40));
      const ra = Math.max(rx, rz), rb = Math.min(rx, rz);
      T.tapete(O(ra, rb), PINTA.GRANZA, { y: 0.1 }); T.tapete(O(ra - 9, rb - 9), PINTA.CESPED, { y: 0.32, claro: 0.78 });
      cancha(T, cx, cz, eje, 100, Math.min(64, (rb - 12) * 2));
      const p = (u, v) => (eje === 'x' ? [cx + u, cz + v] : [cx + v, cz + u]);
      grada(T, p(-70, -rb - 3), p(70, -rb - 3), [cx, cz], 11, 1.5, 7.5, MADERA, TABLA, true);
      grada(T, p(-40, rb + 3), p(40, rb + 3), [cx, cz], 7, 1.2, 4.5, MADERA, TABLA);
    }
  }

  { // La cancha de Gimnasia y Esgrima en Palermo, sobre Dorrego («el field de Maldonado», 1902). Para los juegos del
    // Centenario le hicieron tres tribunas de madera: la oficial, de dos pisos como las del Hipódromo, del lado del
    // arroyo («Estadio geba tribuna 1910»), y dos populares, del lado del río y del de las vías. En la final del
    // Sudamericano de 1916 el público las incendió; no se rehicieron: en su lugar quedó una pista de atletismo. Las
    // tribunas de cemento son de mediados de los años treinta. (x a lo largo de Dorrego, hacia el río; z hacia el arroyo.)
    const { T, L, W } = marco(SITIOS.geba.P, 0, 3, 4), cx = L / 2, cz = W / 2;
    cancha(T, cx, cz, 'x', 100, 64); grada(T, [cx - 20, cz + 37], [cx + 20, cz + 37], [cx, cz], 5, 1, 3.4, MADERA, TABLA);
    c.epoca(4, 5); cancha(T, cx, cz, 'x', 100, 64);
    grada(T, [cx - 34, cz + 37], [cx + 34, cz + 37], [cx, cz], 9, 1.4, 5.2, MADERA, TABLA); // la oficial: la gradería de abajo…
    T.caja(68, 0.5, 9, cx, 7.6, cz + 41.5, PINTADO, MADERA); T.tejado(70, 11, 3, cx, 11.6, cz + 41.5, 'x'); // …el piso alto y el techo
    for (let i = 0; i <= 8; i++) for (const z of [37.3, 45.7]) T.caja(0.3, 11.6, 0.3, cx - 34 + i * 8.5, 0, cz + z, PINTADO, BLANCO);
    T.caja(68, 1, 0.15, cx, 8.1, cz + 37.2, PINTADO, BLANCO); for (const s of [-1, 0, 1]) { T.caja(7, 3, 7, cx + s * 30, 11.6, cz + 41.5, PINTADO, BLANCO); T.piramide(5, 4, cx + s * 30, 14.6, cz + 41.5); }
    grada(T, [cx + 56, cz - 30], [cx + 56, cz + 30], [cx, cz], 8, 1.2, 4.8, MADERA, TABLA); grada(T, [cx - 56, cz - 30], [cx - 56, cz + 30], [cx, cz], 8, 1.2, 4.8, MADERA, TABLA);
    grada(T, [cx - 40, cz - 37], [cx + 40, cz - 37], [cx, cz], 6, 1.2, 3.8, MADERA, TABLA);
    c.epoca(5, 6); T.tapete(contorno(66, 44, 40).map(([a, b]) => [cx + a, cz + b]), PINTA.GRANZA, { y: 0.1 });
    T.tapete(contorno(59, 37, 33).map(([a, b]) => [cx + a, cz + b]), PINTA.CESPED, { y: 0.32, claro: 0.78 }); cancha(T, cx, cz, 'x', 100, 64, 0.54);
    c.epoca(6); cancha(T, cx, cz, 'x', 100, 64);
    grada(T, [cx - 50, cz + 37], [cx + 50, cz + 37], [cx, cz], 13, 1.4, 8, HORMIGON, HORMIGON); grada(T, [cx - 50, cz - 37], [cx + 50, cz - 37], [cx, cz], 10, 1.4, 6, HORMIGON, HORMIGON);
  }

  // ---------------------------------------------------------------------------------------- Las Heras y los hospitales
  { // La Penitenciaría Nacional (Ernesto Bunge, 1877; demolida en 1962, hoy el Parque Las Heras): la muralla con sus
    // torreones, el edificio almenado sobre Las Heras y cinco pabellones en abanico desde la rotonda de vigilancia.
    const { T, L, W } = sitio('penitenciaria'), cx = L / 2, t = { tono: c.CREMA }, m = 5, rz = W * 0.47;
    T.tapete(T.recto(L - 12, W - 12, cx, W / 2), PINTA.BALDOSA, { y: 0.08 });
    pared(T, [m, m], [L - m, m], 7, t, PIEDRA, 1.2); pared(T, [L - m, m], [L - m, W - m], 7, t, PIEDRA, 1.2); pared(T, [L - m, W - m], [m, W - m], 7, t, PIEDRA, 1.2); pared(T, [m, W - m], [m, m], 7, t, PIEDRA, 1.2);
    for (const x of [m, cx - L / 4, cx + L / 4, L - m]) for (const z of [m, W - m]) { T.cilindro(3, 10.5, x, 0, z, PIEDRA, 10, 3, t); T.piramide(3.6, 3, x, 10.5, z, PIZARRA, 8); }
    for (const x of [m, L - m]) for (const z of [W / 3, (2 * W) / 3]) { T.cilindro(3, 10.5, x, 0, z, PIEDRA, 10, 3, t); T.piramide(3.6, 3, x, 10.5, z, PIZARRA, 8); }
    // el frente: la administración, con el cuerpo de la entrada y sus dos torres
    T.caja(110, 12.5, 14, cx, 0, m + 12, CASA, { floors: 3, ...t }); T.caja(111, 1.2, 15, cx, 12.5, m + 12, PIEDRA, t);
    T.caja(18, 18, 18, cx, 0, m + 10, CASA, { floors: 4, ...t }); for (const s of [-1, 1]) { T.caja(5, 23, 5, cx + s * 9, 0, m + 3, PIEDRA, t); T.piramide(3.4, 4, cx + s * 9, 23, m + 3); }
    for (const s of [-1, 1]) { T.caja(12, 16, 16, cx + s * 55, 0, m + 12, CASA, { floors: 4, ...t }); }
    // la rotonda y los cinco pabellones
    T.cilindro(15, 15, cx, 0, rz, PIEDRA, 16, 15, t); T.cupula(15, cx, 15, rz, 0.6); T.cilindro(2.6, 5, cx, 23.5, rz, PIEDRA, 8, 2.6, t); T.piramide(3, 3, cx, 28.5, rz, PIZARRA, 8);
    const ala = (ang, largo, ancho, h, pisos = 2) => {
      const ca = Math.cos(ang), sa = Math.sin(ang), p = (u, v) => [cx + ca * u - sa * v, rz + sa * u + ca * v], q = (e) => [p(13, -ancho / 2 - e), p(13 + largo + e, -ancho / 2 - e), p(13 + largo + e, ancho / 2 + e), p(13, ancho / 2 + e)];
      T.prisma(q(0), h, 0, CASA, { floors: pisos, ...t }); T.prisma(q(0.5), 0.9, h, PIZARRA); const r = q(-ancho * 0.3); T.prisma(r, 1.3, h + 0.9, PIZARRA);
    };
    const largo = Math.min(L / 2 - 45, W - rz - 62);
    for (const g of [16, 53, 90, 127, 164]) ala((g * Math.PI) / 180, g === 90 ? largo : largo * 1.02, 13, 10.5);
    ala(-Math.PI / 2, rz - m - 19 - 13, 11, 8.5);
    // los talleres, al fondo
    for (const s of [-1.5, -0.5, 0.5, 1.5]) { T.caja(46, 6.5, 15, cx + s * 62, 0, W - m - 16, CASA, { floors: 1, ...t }); T.tejado(47, 16, 3.4, cx + s * 62, 6.5, W - m - 16, 'x'); }
  }
  { // El Hospital Rivadavia (1887), el de mujeres: pabellones de dos pisos entre jardines, sobre Las Heras.
    const { T, L, W } = sitio('rivadavia'); hospital(T, L, W, { cols: 4, filas: 2, tono: c.CREMA });
  }
  { // El Hospital de Clínicas viejo (1881; demolido en 1975, hoy la Plaza Houssay) y, enfrente, la Facultad de Medicina (1895).
    const { T, L, W } = sitio('clinicas'); hospital(T, L, W, { cols: 4, filas: 1, tono: c.ROSA, capilla: false });
  }
  {
    const { T, L, W } = sitio('medicina'), t = { tono: c.CREMA }, d = W - 6;
    T.caja(L, 15.5, d, L / 2, 0, W / 2, CASA, { floors: 3, ...t }); T.mansarda(L, d, 4.5, L / 2, 15.5, W / 2, 4);
    T.caja(26, 20, d + 3, L / 2, 0, W / 2, CASA, { floors: 4, ...t }); T.mansarda(26, d + 3, 6, L / 2, 20, W / 2, 5);
    for (const s of [-1, 1]) { T.caja(14, 17.5, d + 2, L / 2 + s * (L / 2 - 7), 0, W / 2, CASA, { floors: 3, ...t }); T.mansarda(14, d + 2, 5, L / 2 + s * (L / 2 - 7), 17.5, W / 2, 3.5); }
  }
  { // El Hospital Italiano (1901), en Gascón: el cuerpo del frente, las dos alas y la capilla con su cúpula.
    const { T, L, W } = sitio('italiano'), t = c.CREMA;
    T.tapete(T.recto(L, W, L / 2, W / 2), PINTA.CESPED, { y: 0.08, claro: 0.76 });
    pab(T, L / 2, 8, L - 8, 13, 3, t); for (const s of [-1, 1]) pab(T, L / 2 + s * (L / 2 - 12), W / 2 + 6, 13, W - 28, 2, t);
    T.caja(12, 12, 20, L / 2, 0, W / 2 + 6, PIEDRA, { tono: t }); T.cilindro(5, 4, L / 2, 12, W / 2 + 6, PIEDRA, 12, 5, { tono: t }); T.cupula(5, L / 2, 16, W / 2 + 6, 1.1);
    arboles(T, 14, 16, 22, L - 16, W - 4, (x) => Math.abs(x - L / 2) > 9 && Math.abs(x - L / 2) < L / 2 - 22);
  }
  { // La Facultad de Derecho de Las Heras (Arturo Prins; la obra, de 1912, se abandonó en 1938 sin la torre ni el
    // revoque): el gótico de ladrillo a la vista que hoy es Ingeniería.
    const { T, L, W } = sitio('ingenieria'), t = { tono: c.LADRILLO }, d = W - 8, cz = d / 2 + 2;
    T.caja(L, 22, d, L / 2, 0, cz, CASA, { floors: 4, ...t }); T.caja(22, 29, d + 4, L / 2, 0, cz, CASA, { floors: 5, ...t });
    const n = Math.max(4, Math.round(L / 9)); for (let i = 0; i <= n; i++) { const x = (L * i) / n; T.caja(1.6, 25, 1.6, x, 0, 1.6, PIEDRA, t); T.piramide(1.3, 3.2, x, 25, 1.6, PIZARRA); }
    for (const s of [-1, 1]) { T.caja(3, 33, 3, L / 2 + s * 11, 0, 0.6, PIEDRA, t); T.piramide(2.2, 5, L / 2 + s * 11, 33, 0.6, PIZARRA); }
    T.vano(7, 13, L / 2, 0, -0.1, '-z');
  }

  // ------------------------------------------------------------------------------------------------------------ el sur
  { // La Casa de Aislamiento (1882), desde 1904 Hospital Muñiz: pabellones bajos y separados, para que no se pasaran los males.
    const { T, L, W } = sitio('muniz'); hospital(T, L, W, { cols: 6, filas: 2, pisos: 1, admin: 2, tono: c.BLANCO, cercoAlto: 2.8 });
  }
  { // La cárcel de Caseros (la Casa de Corrección de Menores Varones, de 1877; después Prisión Nacional): ladrillo y muralla.
    const { T, L, W } = sitio('caseros'), t = { tono: c.LADRILLO }; cerco(T, L, W, 6, t);
    for (const x of [0, L]) for (const z of [0, W]) { T.caja(4, 9, 4, x, 0, z, PIEDRA, t); T.piramide(3, 2.4, x, 9, z); }
    pab(T, L / 2, 12, L - 16, 13, 3, c.LADRILLO); pab(T, L / 2, W - 16, L - 16, 13, 3, c.LADRILLO); pab(T, L / 2, W / 2, 13, W - 44, 3, c.LADRILLO);
    for (const s of [-1, 1]) pab(T, L / 2 + s * (L / 2 - 16), W / 2, 11, W - 60, 2, c.LADRILLO);
  }
  { // El Parque de los Patricios (1902), sobre los Corrales Viejos: los senderos de polvo de ladrillo y la arboleda.
    const S = SITIOS.patricios, { T, L, W } = marco([S.P[0], S.P[1], S.P[2], S.P[3]], 14, S.e), Wm = W * 0.72;
    for (const [a, b] of [[[4, 4], [L - 4, Wm]], [[4, Wm], [L - 4, 4]]]) pared(T, a, b, 0.02, P(PINTA.GRANZA, 0.85), PINTADO, 5);
    T.tapete(T.ovalo(L / 2, Wm / 2 + 2, 22, 22, 28), PINTA.GRANZA, { y: 0.3 }); T.cantero(T.ovalo(L / 2, Wm / 2 + 2, 9, 9, 20), { tono: PINTA.AGUA, alto: 0.5 });
    arboles(T, 150, 4, 4, L - 4, Wm, (x, z) => Math.hypot(x - L / 2, z - Wm / 2 - 2) > 25 && Math.abs((z - 4) / (Wm - 4) - (x - 4) / (L - 8)) > 0.04 && Math.abs((z - 4) / (Wm - 4) - 1 + (x - 4) / (L - 8)) > 0.04);
  }
  { // Santa Felicitas (Ernesto Bunge, 1876): la iglesia de las dos torres que los Guerrero levantaron por Felicitas.
    const { T, L, W } = sitio('felicitas'), cx = L / 2, t = { tono: c.GRIS };
    T.tapete(T.recto(L, W, cx, W / 2), PINTA.CESPED, { y: 0.08, claro: 0.76 });
    T.caja(15, 14, 34, cx, 0, 22, PIEDRA, t); T.tejado(16, 35, 5, cx, 14, 22, 'z'); T.caja(26, 12, 10, cx, 0, 30, PIEDRA, t); T.tejado(27, 11, 3.6, cx, 12, 30, 'x');
    T.cilindro(7.5, 12, cx, 0, 39, PIEDRA, 12, 7.5, t); T.cupula(7.5, cx, 12, 39, 0.5);
    for (const s of [-1, 1]) { T.caja(5, 24, 5, cx + s * 6.5, 0, 5.5, PIEDRA, t); T.piramide(3.4, 9, cx + s * 6.5, 24, 5.5); }
    T.caja(8, 17, 3, cx, 0, 4.2, PIEDRA, t); T.vano(3.4, 7, cx, 0, 2.6, '-z');
    arboles(T, 8, 2, 2, L - 2, W - 2, (x) => Math.abs(x - cx) > 15);
  }
  { // La Iglesia Ortodoxa Rusa de la Santísima Trinidad (1901), frente al Parque Lezama: las cinco cúpulas de bulbo
    // azules (acá, del color del agua: en la paleta no hay otro azul).
    const { T, L, W } = sitio('rusa'), cx = L / 2, t = { tono: c.CREMA }, AZUL = P(PINTA.AGUA, 0.5);
    T.caja(15, 15, 22, cx, 0, 12, CASA, { floors: 3, ...t }); T.caja(16, 0.8, 23, cx, 15, 12, PIEDRA, t);
    const bulbo = (x, z, r, y) => { T.cilindro(r * 0.7, 4, x, y, z, PIEDRA, 10, r * 0.7, t); T.cupula(r, x, y + 4, z, 1.5, PINTADO, AZUL); T.caja(0.2, 2.4, 0.2, x, y + 4 + r * 1.5, z, PINTADO, P(PINTA.BRONCE, 0.4)); };
    bulbo(cx, 12, 3.2, 15.8); for (const sx of [-1, 1]) for (const sz of [-1, 1]) bulbo(cx + sx * 4.8, 12 + sz * 6.5, 1.9, 15.8);
  }

  // --------------------------------------------------------------------------------------------------------- el centro
  { // El Mercado Spinetto (1894): los locales a la calle y adentro las naves de hierro y chapa.
    const { T, L, W } = sitio('spinetto'), t = c.CREMA;
    pab(T, L / 2, 5, L, 10, 1, t, false); pab(T, L / 2, W - 5, L, 10, 1, t, false); pab(T, 5, W / 2, 10, W - 20, 1, t, false); pab(T, L - 5, W / 2, 10, W - 20, 1, t, false);
    const n = 4, a = (L - 22) / n; for (let i = 0; i < n; i++) { const x = 11 + a * (i + 0.5); T.caja(a - 0.6, 8, W - 22, x, 0, W / 2, PINTADO, CHAPA); T.tejado(a, W - 21, 4, x, 8, W / 2, 'z'); }
    for (const [x, z] of [[L / 2, 5], [L / 2, W - 5]]) { T.caja(14, 11, 10.5, x, 0, z, CASA, { floors: 2, tono: t }); T.tejado(15, 11, 3, x, 11, z, 'z'); }
  }
  { // El Teatro Cervantes (1921), de María Guerrero y Fernando Díaz de Mendoza: el plateresco de Alcalá, con su torre en la esquina.
    const { T, L, W } = sitio('cervantes'), t = { tono: c.CREMA };
    T.caja(L, 21, W, L / 2, 0, W / 2, CASA, { floors: 5, ...t }); T.caja(L + 0.6, 1, W + 0.6, L / 2, 21, W / 2, PIEDRA, t);
    T.caja(L * 0.5, 8, W * 0.6, L * 0.7, 21, W * 0.6, PIEDRA, t); // la caja del escenario
    T.caja(8, 29, 8, 4, 0, 4, CASA, { floors: 7, ...t }); T.piramide(5.4, 6, 4, 29, 4);
  }
  { // Harrods (1914-1920), la manzana de Florida, Córdoba, San Martín y Paraguay: siete pisos y cúpulas en las esquinas.
    const { T, L, W } = sitio('harrods'), t = { tono: c.CREMA }, h = 29;
    T.caja(L, h, W, L / 2, 0, W / 2, CASA, { floors: 7, ...t }); T.mansarda(L, W, 5, L / 2, h, W / 2, 5);
    for (const x of [3, L - 3]) for (const z of [3, W - 3]) { T.cilindro(5, h + 5, x, 0, z, CASA, 12, 5, { floors: 8, ...t }); T.cupula(5.2, x, h + 5, z, 1.2); T.cilindro(0.8, 3, x, h + 11, z, PIEDRA, 8, 0.8, t); }
  }
  { // El Jockey Club de la calle Florida (1897), el de la escalera de mármol; lo incendiaron en 1953.
    const { T, L, W } = sitio('jockey'), t = { tono: c.CREMA };
    T.caja(L, 19, W, L / 2, 0, W / 2, CASA, { floors: 3, ...t }); T.mansarda(L, W, 5, L / 2, 19, W / 2, 4);
  }
  { // La Casa de Moneda (1881), en Defensa y México: dos pisos alrededor de un patio.
    const { T, L, W } = sitio('moneda'), t = c.CREMA;
    pab(T, L / 2, 6, L, 12, 2, t, false); pab(T, L / 2, W - 6, L, 12, 2, t, false); pab(T, 6, W / 2, 12, W - 24, 2, t, false); pab(T, L - 6, W / 2, 12, W - 24, 2, t, false);
    T.caja(14, 13, 13, L / 2, 0, 6, CASA, { floors: 3, tono: t }); T.tejado(15, 14, 3, L / 2, 13, 6, 'z');
  }
  c.epoca(0);
}
