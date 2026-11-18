// La Plaza Colón y el Parque Colón: lo que había detrás de la Casa de Gobierno, entre el Paseo Colón–Paseo de Julio y
// la avenida del puerto (Huergo y Madero), de la Aduana al Correo.
//   · 1895 (etapa 2) — el relleno recién hecho donde estuvo la Aduana Nueva. El plano de Obras Públicas dibuja la
//     «Plaza Colón» como un cuadro en el eje de la casa (el nombre es de la ordenanza del 28-11-1894); lo demás,
//     terraplén.
//   · 1905 y 1910 (etapas 3 y 4) — el Parque Colón de Carlos Thays (inaugurado en 1904): un trapecio entre las
//     avenidas Espora y Rosales, de la Casa de Gobierno a la avenida del puerto, como lo dibujan los planos de Ludwig
//     de 1905 y 1909. En el eje, la explanada con la Fuente Monumental (de la fundición Val d'Osne), que se desarmó
//     para poner el monumento.
//   · 1921 (etapa 5) — el plano de Cannizzaro: la plaza partida en tres por una calle en U. En el medio, un escudo con
//     el Monumento a Colón de Arnaldo Zocchi (inaugurado el 15-6-1921) y los jardines de Eugenio Carrasco y Francisco
//     Lavecchia; a cada lado, un trapecio de parque. Al norte de Rosales, la plazoleta en punta y la plaza de frente
//     al Correo (en obra desde 1915); al sur de Espora, las plazoletas del Paseo Colón.
//   · 1940 (etapa 6) — la foto aérea de 1940: el escudo como en 1921, árbol más o menos; al sur, el parque ya es la
//     obra del Ministerio de Guerra (empezada en 1938, inaugurada en 1943: hoy el Edificio Libertador), con el pozo,
//     el esqueleto a medio levantar y los obradores; al norte, el parque con sus hileras de árboles nuevos; la plaza
//     de frente al Correo (inaugurado en 1928) hecha playa de estacionamiento, y la manzana de detrás del Correo,
//     cortada por Rosales.
// De dónde sale cada cosa:
//   · los ejes y los anchos de las calzadas (src/plaza-colon.js, que también lee tools/crece.mjs para pintarlas), el
//     contorno del escudo, el lugar del monumento, de los canteros, de las bandas de árboles, de la obra y de la playa
//     de autos: la foto aérea de 1940 del mapa interactivo de la Ciudad de Buenos Aires, llevada al plano;
//   · qué había en cada etapa anterior: los planos de época de fuentes/planos/ (1895, 1905, 1909, 1921 y 1936);
//   · las fechas: «Monumento a Cristóbal Colón (Buenos Aires)», «Edificio Libertador», «Aduana Taylor» y «Casa
//     Rosada», en Wikipedia en español;
//   · el monumento visto desde la plaza, con los tranvías del Paseo Colón pasando entre él y la casa: «Monumento
//     Colón tranvías» (hacia 1930) y, para la fuente, «Casa Rosada fuente 1920 Plaza Colón», en Wikimedia Commons.
// Lo supuesto: el dibujo de los canteros y senderos del parque de 1905–1910 (los planos dan solo el contorno) y de
// los trapecios de 1921; el lugar de cada árbol fuera del escudo; la forma de la fuente, de los dos canteros cuadrados
// de la explanada (en la foto se ven dos cuadros, no qué eran), de los faroles, de la obra del Ministerio (cuántas
// columnas, qué altura llevaba en 1940) y de los galpones de detrás del Correo; la plaza de frente a la Aduana antes
// de 1940 (el plano de 1921 la pinta verde; el dibujo es el de la foto de 1940). Las terrazas y escalinatas de 1911
// no están.
import { EJE_COLON, CALLE_U } from '../plaza-colon.js';
import { ferro } from './ferro.js';

export default function (c) {
  const { THREE, PINTA, PINTADO, PIEDRA, TINTA, CASA } = c, M = 0.675, OX = EJE_COLON, OY = 10050;
  const G = c.lugar(OX, OY, 1, 0); // (x: hacia el norte, como el plano; z: hacia el río)
  let azar = 0.4177; const al = () => (azar = (azar * 9301 + 0.2113) % 1); // (siempre la misma tirada)
  const F = ferro(c, al);
  const P = (tono, claro = 0.5) => ({ pinta: [tono, claro] });
  const CHAPA = P(PINTA.CHAPA, 0.8), MADERA = P(PINTA.MADERA, 0.5), NEGRO = P(PINTA.NEGRO, 0.2), HORMIGON = { tono: c.GRIS }, MAR = { tono: c.BLANCO };
  /** de píxeles del plano a metros del lugar */
  const q = (px, py) => [(px - OX) * M, (py - OY) * M];
  const Q = (pts) => pts.map(([x, y]) => q(x, y));
  /** lo mismo, midiendo la x desde el eje de la plaza: `s` es de qué lado (−1 el sur, +1 el norte) */
  const e = (s, dx, py) => q(OX + s * dx, py);
  const dentro = (pts, x, z) => { let d = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, zi] = pts[i], [xj, zj] = pts[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) d = !d; } return d; };
  /** un rectángulo entre dos esquinas (en píxeles del plano), con las puntas redondeadas */
  const R = (x0, y0, x1, y1, r = 1.5) => { const [a, b] = q(x0, y0), [a1, b1] = q(x1, y1); return G.recto(Math.abs(a1 - a), Math.abs(b1 - b), (a + a1) / 2, (b + b1) / 2, r); };
  const granza = (pts, y = 0.34) => G.tapete(pts, PINTA.GRANZA, { y });
  /** un sendero de granza de `ancho` metros a lo largo de una quebrada (en píxeles del plano) */
  const sendero = (pts, ancho = 4, y = 0.34) => F.tira(G, F.curva(Q(pts), 0, 10), ancho, PINTA.GRANZA, y, 0.82);
  /** `n` árboles al azar adentro de un polígono (en metros), lejos de lo que diga `libre` */
  const siembra = (pol, n, r0 = 3, r1 = 1.6, libre = () => true) => {
    const xs = pol.map((p) => p[0]), zs = pol.map((p) => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs), borde = c.adentro(pol, 3.5);
    for (let i = 0; i < n * 4 && n > 0; i++) { const x = x0 + al() * (x1 - x0), z = z0 + al() * (z1 - z0); if (dentro(borde, x, z) && libre(x, z)) { G.arbol(x, z, r0 + al() * r1); n--; } }
  };
  /** una hilera de árboles a lo largo de una quebrada (en metros), uno cada `paso` */
  const hilera = (pts, paso = 9, r = 3.4, vale = () => true) => { const L = F.curva(pts, 0, paso); for (let i = 0; i < L.length; i++) if (vale(L[i][0], L[i][1])) G.arbol(L[i][0], L[i][1], r + (i % 3) * 0.3); };
  /** un farol de plaza: la columna de hierro y el globo */
  const farol = (x, z) => { G.cilindro(0.16, 4.2, x, 0, z, TINTA, 5, 0.08); G.caja(0.5, 0.5, 0.5, x, 4.2, z, PINTADO, P(PINTA.BLANCO, 0.96)); };

  // Los bordes: las dos diagonales (la y de su eje a la altura x, en píxeles del plano) y la calle en U, corrida.
  const yEspora = (x) => 9944 + (10108 - x) * 0.4314, yRosales = (x) => 9930 + (x - 10476) * 0.3065;
  const corrida = (pts, d) => pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [p[0] - ((b[1] - a[1]) / l) * d, p[1] + ((b[0] - a[0]) / l) * d]; });
  const U_AFUERA = corrida(CALLE_U, 14), U_ADENTRO = corrida(CALLE_U, -14); // (el cordón de la vereda: 6 m de media calzada y 3,5 de vereda)
  /** el escudo del medio: lo que encierra la calle en U, hasta la vereda del Paseo Colón */
  const ESCUDO = Q(U_ADENTRO.map(([x, y]) => [x, Math.max(y, 9950)]));
  /** el trapecio del sur (entre Espora, la U y la avenida del puerto) y el del norte (entre la U, Rosales y Cangallo) */
  const SUR = Q([[9880, 10160], [9880, yEspora(9880) + 18], [10110, 9964], ...U_AFUERA.filter(([x, y]) => x < OX - 20 && y > 9966 && y < 10160)]);
  const NORTE = Q([...U_AFUERA.filter(([x, y]) => x > OX + 20 && y > 9966 && y < 10160), [10770, yRosales(10770) + 20], [10770, 10160]]);

  // ================================================================================== 1895: el cuadro de la plaza
  c.epoca(2, 3);
  { const [x, z] = q(OX, 10035);
    G.cantero(G.recto(118, 91, x, z, 6)); G.tapete(G.recto(118, 4, x, z), PINTA.GRANZA, { y: 0.56 }); G.tapete(G.recto(4, 91, x, z), PINTA.GRANZA, { y: 0.56 });
    for (const s of [-1, 1]) for (const t of [-1, 1]) for (let k = 0; k < 4; k++) G.arbol(x + s * (12 + k * 13), z + t * 26, 3.2); }

  // =========================================================== 1905 y 1910: el Parque Colón de Thays, de una pieza
  c.epoca(3, 5);
  { const PARQUE = Q([[10146, 9942], [10450, 9942], [10770, yRosales(10770) + 20], [10770, 10160], [9880, 10160], [9880, yEspora(9880) + 18]]);
    const [fx, fz] = q(OX, 10077), [, zp] = q(OX, 10138), [xa] = q(9896, 0), [xb] = q(10756, 0);
    G.tapete(PARQUE, PINTA.CESPED, { y: 0.12, claro: 0.76 });
    // los senderos: el paseo largo, paralelo a la avenida del puerto; el del eje, de la casa a la fuente y al puerto;
    // los que cruzan, y los dos que bajan en diagonal de la explanada
    sendero([[9896, 10138], [10756, 10138]], 7);
    sendero([[OX, 9946], [OX, 10156]], 6);
    for (const px of [9990, 10120, 10520, 10660]) sendero([[px, Math.max(px < OX ? yEspora(px) : yRosales(px), 9930) + 26], [px, 10138]], 4);
    for (const s of [-1, 1]) sendero([[OX + s * 20, 10090], [OX + s * 190, 10134]], 4);
    granza(G.ovalo(fx, fz, 21, 21, 24));
    // la Fuente Monumental: el pilón, el pie, los dos platos y la figura de arriba (de hierro fundido)
    G.cantero(G.ovalo(fx, fz, 8.5, 8.5, 20), { alto: 0.7, tono: PINTA.AGUA, cordon: 0.6 });
    const HIERRO = P(PINTA.PATINA, 0.34);
    G.cilindro(1.7, 1.5, fx, 0.7, fz, PINTADO, 8, 1.3, HIERRO); G.cilindro(0.5, 2.2, fx, 2.2, fz, PINTADO, 8, 0.4, HIERRO); G.cilindro(0.6, 0.5, fx, 4.2, fz, PINTADO, 12, 2.7, HIERRO);
    G.cilindro(0.34, 1.7, fx, 4.7, fz, PINTADO, 8, 0.28, HIERRO); G.cilindro(0.4, 0.36, fx, 6.2, fz, PINTADO, 12, 1.5, HIERRO); G.cilindro(0.3, 1.5, fx, 6.56, fz, PINTADO, 6, 0.14, HIERRO);
    // los árboles: las dos hileras del paseo largo, las de las diagonales y los sueltos (ninguno sobre un sendero)
    for (let x = xa + 5; x < xb - 4; x += 11) for (const s of [-1, 1]) if (Math.abs(x) > 8) G.arbol(x, zp + s * 6.8, 3.5);
    hilera(Q([[9884, yEspora(9884) + 24], [10136, yEspora(10136) + 24]]), 10, 3.6); hilera(Q([[10462, yRosales(10462) + 26], [10764, yRosales(10764) + 26]]), 10, 3.6);
    const cruces = [9990, 10120, 10520, 10660].map((px) => q(px, 0)[0]);
    siembra(PARQUE, 190, 3, 1.6, (x, z) => Math.abs(z - zp) > 11 && Math.abs(x) > 7 && Math.hypot(x - fx, z - fz) > 25 && cruces.every((cx) => Math.abs(x - cx) > 5) && Math.abs(Math.abs(x) * 0.259 - (z - fz) - 4) > 6);
  }

  // =============================================================== desde 1905: las plazoletas del sur de Espora
  c.epoca(3);
  { const PUNTA = Q([[9868, 9950], [10052, 9950], [9868, yEspora(9868) - 18]]);
    G.cantero(PUNTA); siembra(PUNTA, 30, 3.2, 1.4);
    hilera(Q([[9872, 9955], [10040, 9955]]), 11, 3.6); }

  // ====================================================== desde 1921: el escudo, con el monumento y sus jardines
  c.epoca(5);
  G.tapete(ESCUDO, PINTA.LONA, { y: 0.08, claro: 0.9 }); // (la explanada, clara en la foto: va de tierra apisonada)
  for (const s of [-1, 1]) {
    const r = (dx0, y0, dx1, y1, rr) => R(OX + s * dx0, y0, OX + s * dx1, y1, rr);
    // junto a la explanada, la banda de árboles; después, el jardín de dibujo; y contra la calle, otra banda
    G.cantero(r(54, 9958, 82, 10048));
    for (let i = 0; i < 8; i++) for (const dx of [61, 75]) { const [x, z] = e(s, dx, 9966 + i * 11); G.arbol(x, z, 3.7); }
    G.cantero(r(90, 9958, 136, 10046));
    if (s < 0) { for (let i = 0; i < 6; i++) for (const dx of [100, 113, 126]) { const [x, z] = e(s, dx, 9968 + i * 14); G.arbol(x, z, 2.3); } } // (en la foto, un cuadro de árboles chicos en filas)
    else for (let i = 0; i < 3; i++) for (const dx of [102, 124]) { const [x, z] = e(s, dx, 9974 + i * 28); G.cantero(G.recto(8.5, 12, x, z, 2.5), { alto: 0.62, tono: PINTA.FLORES, cordon: 0.3 }); } // (y del otro lado, canteros de flores)
    { const pts = [[144, 9958], [160, 9958], [158, 10030], [151, 10058], [144, 10058]].map(([dx, y]) => e(s, dx, y)); G.cantero(pts); }
    // más abajo, hacia el puerto: dos canteros a cada lado del monumento, un redondel de flores y la punta
    G.cantero(r(54, 10058, 88, 10100)); G.cantero(r(94, 10058, 128, 10100));
    { const [x, z] = e(s, 71, 10107); G.cantero(G.ovalo(x, z, 3.4, 3.4, 12), { alto: 0.62, tono: PINTA.FLORES, cordon: 0.3 }); }
    G.cantero([[30, 10114], [112, 10114], [64, 10150], [30, 10153]].map(([dx, y]) => e(s, dx, y)));
    for (const [dx, y] of [[40, 10124], [58, 10124], [78, 10122], [96, 10120], [42, 10142], [58, 10140]]) { const [x, z] = e(s, dx, y); G.arbol(x, z, 3.4); }
    // los dos cuadros de la explanada (en la foto se ven; qué eran, no): un cantero bajo con su pedestal y su copón
    { const [x, z] = e(s, 45, 9993); G.cantero(G.recto(9, 13.5, x, z, 1), { alto: 0.4 }); G.caja(1.6, 1.3, 1.6, x, 0.4, z, PIEDRA, MAR); G.cilindro(0.3, 0.9, x, 1.7, z, PIEDRA, 8, 0.8, MAR); }
    for (const y of [9962, 10030, 10100]) { const [x, z] = e(s, 49, y); farol(x, z); }
  }
  // los árboles de la vereda de la U, del lado de la plaza (la doble hilera de la foto, que tapa la calle)
  { const L = F.curva(Q(corrida(CALLE_U, -23)), 0, 9); for (const [x, z] of L) if (z > q(0, 9962)[1] && Math.abs(x) > 62 * M) G.arbol(x, z, 3.6); }
  { // el Monumento a Colón (Arnaldo Zocchi, 1921), de mármol de Carrara, unos 26 m: la escalinata, el basamento con sus
    // grupos, la columna y, arriba, el almirante mirando al río. (Hasta 2013 estuvo acá.)
    const T = c.lugar(OX, 10077, 1, 0);
    for (let i = 0; i < 3; i++) T.caja(15 - i * 2.4, 0.5, 15 - i * 2.4, 0, i * 0.5, 0, PIEDRA, MAR);
    T.caja(7.6, 4.6, 7.6, 0, 1.5, 0, PIEDRA, MAR); T.caja(8.4, 0.5, 8.4, 0, 6.1, 0, PIEDRA, MAR);
    for (const s of [-1, 1]) { T.caja(2.2, 2.6, 3.4, s * 4.9, 1.5, 0, PIEDRA, MAR); T.caja(3.4, 2.6, 2.2, 0, 1.5, s * 4.9, PIEDRA, MAR); }
    T.caja(3.4, 3, 3.4, 0, 6.6, 0, PIEDRA, MAR); T.cilindro(1.25, 11, 0, 9.6, 0, PIEDRA, 10, 1.05, MAR); T.caja(2.6, 0.8, 2.6, 0, 20.6, 0, PIEDRA, MAR);
    T.cilindro(0.7, 3.6, 0, 21.4, 0, PIEDRA, 6, 0.45, MAR); T.cilindro(0.42, 0.8, 0, 25, 0, PIEDRA, 6, 0.36, MAR);
  }

  // =================================================================== desde 1921: el trapecio del norte, parque
  { G.tapete(NORTE, PINTA.CESPED, { y: 0.12, claro: 0.76 });
    sendero([[10500, 10136], [10764, 10136]], 5); sendero([[10560, yRosales(10560) + 26], [10690, 10136]], 4); sendero([[10640, yRosales(10640) + 26], [10640, 10136]], 4);
    hilera(Q([[10520, yRosales(10520) + 27], [10764, yRosales(10764) + 27]]), 8, 3.9); hilera(Q([[10516, yRosales(10516) + 37], [10760, yRosales(10760) + 37]]), 8, 3.7); // (la arboleda de Rosales)
    hilera(Q(corrida(CALLE_U, 22)).filter(([x, z]) => x > 30 && z > q(0, 9975)[1] && z < q(0, 10150)[1]), 9, 3.6); // (y la otra hilera de la U)
    const [, zs] = q(0, 10136);
    siembra(NORTE, 26, 3, 1.5, (x, z) => Math.abs(z - zs) > 6 && z > q(0, 10100)[1]);
    c.epoca(6); // (1940: los árboles recién plantados, en hileras)
    for (const y of [10052, 10090, 10100]) for (let px = 10500; px < 10750; px += 13) { const [x, z] = q(px, y); if (dentro(c.adentro(NORTE, 5), x, z) && y > yRosales(px) + 46) G.arbol(x, z, 1.7); }
    c.epoca(5); }

  // ============================================= el trapecio del sur: parque en 1921, la obra del Ministerio en 1940
  c.epoca(5, 6);
  { G.tapete(SUR, PINTA.CESPED, { y: 0.12, claro: 0.76 });
    sendero([[9892, 10136], [10196, 10136]], 5); sendero([[10000, yEspora(10000) + 24], [10000, 10136]], 4); sendero([[10080, yEspora(10080) + 24], [9950, 10136]], 4);
    hilera(Q([[9886, yEspora(9886) + 25], [10100, yEspora(10100) + 25]]), 9, 3.8);
    hilera(Q(corrida(CALLE_U, 22)).filter(([x, z]) => x < -30 && z > q(0, 9975)[1] && z < q(0, 10150)[1]), 9, 3.6);
    const [, zs] = q(0, 10136); siembra(SUR, 60, 3, 1.5, (x, z) => Math.abs(z - zs) > 6); }
  c.epoca(6);
  { // El Ministerio de Guerra en obra (1938–1943): el terreno pelado, la valla, el pozo con el esqueleto de hormigón a
    // medio levantar —la planta, de la foto aérea: unos 142 × 58 m—, los obradores y una grúa.
    const OBRA = c.adentro(SUR, 2.5);
    G.tapete(OBRA, PINTA.LONA, { y: 0.1, claro: 0.88 });
    for (let i = 0; i < OBRA.length; i++) { const a = OBRA[i], b = OBRA[(i + 1) % OBRA.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L > 1) G.put(new THREE.BoxGeometry(L, 2.2, 0.14).rotateY(-Math.atan2(b[1] - a[1], b[0] - a[0])).translate((a[0] + b[0]) / 2, 1.1, (a[1] + b[1]) / 2), PINTADO, MADERA); }
    const [x0, z0] = q(9932, 10086), [x1, z1] = q(10140, 10170), nx = 14, nz = 5;
    G.tapete([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], PINTA.BALASTO, { y: 0.32, claro: 0.66 });
    for (const [w, d, x, z] of [[x1 - x0, 0.5, (x0 + x1) / 2, z0], [x1 - x0, 0.5, (x0 + x1) / 2, z1], [0.5, z1 - z0, x0, (z0 + z1) / 2], [0.5, z1 - z0, x1, (z0 + z1) / 2]]) G.caja(w, 1.1, d, x, 0, z, PIEDRA, HORMIGON);
    for (let i = 0; i < nx; i++) {
      const pisos = i < 5 ? 2 : i < 9 ? 1 : 0, alto = 1.2 + pisos * 3.6, x = x0 + ((i + 0.5) * (x1 - x0)) / nx; // (más adelantado del lado de la Aduana: supuesto)
      for (let j = 0; j < nz; j++) G.caja(0.7, alto, 0.7, x, 0, z0 + ((j + 0.5) * (z1 - z0)) / nz, PIEDRA, HORMIGON);
      for (let p = 1; p <= pisos; p++) G.caja(0.5, 0.6, (z1 - z0) * 0.8, x, p * 3.6 + 0.6, (z0 + z1) / 2, PIEDRA, HORMIGON);
    }
    for (let p = 1; p <= 2; p++) for (let j = 0; j < nz; j++) { const n = p === 1 ? 9 : 5, w = (n * (x1 - x0)) / nx - 6; G.caja(w, 0.6, 0.5, x0 + w / 2 + 3, p * 3.6 + 0.6, z0 + ((j + 0.5) * (z1 - z0)) / nz, PIEDRA, HORMIGON); }
    // los obradores, de chapa, y la grúa
    for (const [px, py, w, d] of [[10102, 10016, 34, 8], [10088, 10046, 44, 7], [9936, 10064, 36, 6.5]]) { const [x, z] = q(px, py); G.caja(w, 3.2, d, x, 0, z, PINTADO, CHAPA); G.caja(w + 0.6, 0.25, d + 0.6, x, 3.2, z, PINTADO, P(PINTA.CHAPA, 0.66)); }
    { const [x, z] = q(9906, 10128); G.piramide(2.2, 24, x, 0, z, TINTA, 4); G.put(new THREE.BoxGeometry(26, 0.5, 0.5).translate(x + 9, 22.5, z), TINTA); G.caja(2.4, 2.2, 2.4, x, 0, z, PINTADO, NEGRO); }
  }

  // ===================================================== al norte de Rosales: la plazoleta en punta y la del Correo
  c.epoca(5);
  { // la punta entre el Paseo de Julio y Rosales (en la foto, un cantero con un monumento chico en el medio)
    const PUNTA = Q([[10606, 9947], [10772, 9947], [10772, yRosales(10772) - 22]]), [x, z] = q(10716, 9966);
    G.cantero(PUNTA); G.caja(2.4, 1.6, 2.4, x, 0.3, z, PIEDRA, MAR); G.cilindro(0.5, 2.2, x, 1.9, z, PIEDRA, 6, 0.36, MAR);
    for (const [px, py] of [[10650, 9953], [10690, 9953], [10730, 9953], [10764, 9956], [10764, 9984], [10742, 9990]]) G.arbol(...q(px, py), 3.3); }
  { // entre Cangallo y Sarmiento, al sur de Rosales: el triángulo arbolado
    const TRI = Q([[10832, yRosales(10832) + 20], [10946, yRosales(10946) + 20], [10946, 10160], [10832, 10160]]);
    G.cantero(TRI); siembra(TRI, 34, 3.2, 1.6); }
  const CORREO = Q([[10832, 9948], [10946, 9948], [10946, yRosales(10946) - 20], [10832, yRosales(10832) - 20]]);
  c.epoca(5, 6); // (1921: el jardín de frente a la obra del Correo, que pinta de verde el plano de Cannizzaro)
  { const [x, z] = q(10889, 9990);
    G.cantero(CORREO); G.tapete(G.recto(3.6, 56, x, z), PINTA.GRANZA, { y: 0.56 }); G.tapete(G.recto(70, 3.6, x, z), PINTA.GRANZA, { y: 0.56 });
    siembra(CORREO, 26, 3.2, 1.4, (ax, az) => Math.abs(ax - x) > 5 && Math.abs(az - z) > 5); }
  c.epoca(6); // (1940: la foto aérea la muestra hecha playa de estacionamiento, con una fuente redonda y un monumento en la punta)
  { G.tapete(CORREO, PINTA.ADOQUIN, { y: 0.08, claro: 0.8 });
    for (let f = 0; f < 4; f++) for (let i = 0; i < 26; i++) { const px = 10840 + i * 3.9, py = 9960 + f * 14; if ((i * 5 + f * 3) % 7 === 0 || (f > 1 && px > 10900)) continue; const [x, z] = q(px, py); G.caja(1.7, 1.1, 4.3, x, 0.3, z, PINTADO, NEGRO); G.caja(1.5, 0.62, 2, x, 1.4, z + 0.25, PINTADO, NEGRO); }
    { const [x, z] = q(10878, 10008); G.cantero(G.ovalo(x, z, 4.2, 4.2, 14), { alto: 0.6, tono: PINTA.AGUA, cordon: 0.5 }); }
    { const [x, z] = q(10926, 10006); G.cantero(G.ovalo(x, z, 6, 8, 14), { alto: 0.4, tono: PINTA.BALDOSA }); G.caja(2.2, 2.4, 2.2, x, 0.4, z, PIEDRA, MAR); G.cilindro(0.5, 2.4, x, 2.8, z, PIEDRA, 6, 0.36, MAR); } }
  { // la manzana de detrás del Correo, que Rosales corta en punta: galpones (en la foto, techos grandes; cuántos, supuesto)
    const LAD = { floors: 2, tono: c.LADRILLO };
    for (const [px0, py0, px1, py1] of [[11040, 10086, 11172, 10100], [11096, 10102, 11172, 10116]]) { const [a, b] = q(px0, py0), [a1, b1] = q(px1, py1); G.caja(a1 - a, 8.4, b1 - b, (a + a1) / 2, 0, (b + b1) / 2, CASA, LAD); G.caja(a1 - a + 0.6, 0.3, b1 - b + 0.6, (a + a1) / 2, 8.4, (b + b1) / 2, PINTADO, CHAPA); }
    for (let px = 11020; px < 11170; px += 16) G.arbol(...q(px, yRosales(px) + 18), 3.3); }
  { // la isla ovalada de la explanada del Paseo de Julio, al norte de la casa
    const [x, z] = q(10537, 9873); G.cantero(G.ovalo(x, z, 23, 13.5, 24), { alto: 0.34, cordon: 2.2 }); G.cantero(G.ovalo(x + 4, z, 4, 4, 12), { alto: 0.7, tono: PINTA.FLORES, cordon: 0.3 }); }

  // ============================================ la plaza de frente a la Aduana, de Belgrano a Moreno (desde 1921)
  c.epoca(5);
  { const [x0, z0] = q(9694, 9952), [x1, z1] = q(9836, 10064), xm = (x0 + x1) / 2, zm = (z0 + z1) / 2, PL = G.recto(x1 - x0, z1 - z0, xm, zm, 5);
    G.cantero(PL); G.tapete(G.recto(3.6, z1 - z0, xm, zm), PINTA.GRANZA, { y: 0.56 }); G.tapete(G.recto(x1 - x0, 3.6, xm, zm), PINTA.GRANZA, { y: 0.56 });
    siembra(PL, 44, 3.2, 1.6, (x, z) => Math.abs(x - xm) > 5 && Math.abs(z - zm) > 5); }
  c.epoca(0);
}
