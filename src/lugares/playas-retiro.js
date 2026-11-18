// Las playas de vías de Retiro, las vías del Puerto Nuevo y la Costanera Norte: lo que había entre las estaciones y
// las dársenas, y de ahí para el norte, sobre la tierra ganada al río. (Las dársenas, los barcos, las grúas, los
// galpones de los muelles y las usinas están en puerto-nuevo.js; la estación Retiro, en src/hitos.js; acá va lo demás.)
//   · 1921 (etapa 5): las tres playas —la del Central Argentino, la del Central Córdoba y la del Pacífico, que el plano
//     de Cannizzaro ya dibuja con sus vías y sus dos estaciones más—, con sus vagones y sus galpones de cargas; las dos
//     líneas que siguen hacia Palermo; la vía del puerto, que viene de los diques por el lazo del sudoeste y corre a lo
//     largo de las cabeceras, con los ramales de los dos espigones habilitados (el 2 y el 3). Lo demás es relleno
//     crudo: el «Nuevo Puerto» que el plano cuadricula de puntos era un proyecto y no se hizo.
//   · 1940 (etapa 6): lo que agrega el plano de Peuser (1936): más vías en la playa, el empalme que baja de las playas
//     al puerto, los ramales de los espigones 1, 4 y 5 y el de la usina, los depósitos del triángulo entre las playas y
//     la avenida Edison, el Ferrocarril del Estado, un elevador de granos, y la Costanera Norte: la rambla con su
//     pretil y sus faroles, la avenida arbolada y los árboles de los parques. (El pasto de los parques y la calzada de
//     las avenidas los pinta el suelo: tools/crece.mjs con src/playas-retiro.js.)
// De dónde sale cada cosa: las trazas, de los planos de 1921 y 1936 (fuentes/planos/) y, para la vía del puerto, del
// mapa de hoy, que sigue el mismo lazo. El Peuser dibuja las dársenas corridas y de más: lo de los espigones va sobre
// los contornos de hoy, con el reparto que muestra el plano (vías entre hilera e hilera de galpones). Qué hay en cada
// galpón, los colores, las alturas, cuántos vagones y dónde, la forma de las estaciones y la del elevador son
// supuestos (ver LEEME.md). Todo va en píxeles del plano de 1867 (x al norte, y al río); las medidas, en metros.
import { ferro } from './ferro.js';
import { AVENIDAS, COSTA_NORTE } from '../playas-retiro.js';
import ARBOLES from './costanera-arboles.js';

export default function (c) {
  const { THREE, PINTA, PINTADO, PIEDRA, TINTA, CASA } = c, M = 0.675;
  let azar = 0.4173; const al = () => (azar = (azar * 9301 + 0.2113) % 1); // (siempre la misma tirada)
  const K = ferro(c, al), { P, CHAPA, OXIDO, LADRILLO, OCRE, MADERA } = K;
  /** un lugar derecho con el plano (x al norte, z al río), con el origen en ese punto: `l` pasa una línea de píxeles a sus metros */
  const en = (px, py) => { const T = c.lugar(px, py, 1, 0), g = (x, y) => [(x - px) * M, (y - py) * M]; return { T, g, l: (pts) => pts.map(([x, y]) => g(x, y)) }; };
  /** una vía sobre una línea de píxeles del plano: con `pasadas` 0, derecha (un tramo cada 30 m) */
  const via = (F, pts, cama = true, pasadas = 3, paso = pasadas ? 12 : 30) => K.via(F.T, K.curva(F.l(pts), pasadas, paso), cama);
  /** dos vías a la par (la doble) */
  const doble = (F, pts, pasadas = 3, d = 2.3) => { const L = K.curva(F.l(pts), pasadas, 12); for (const s of [-1, 1]) K.via(F.T, K.corrida(L, s * d)); };
  /** vagones sueltos a lo largo del tramo derecho de A a B (píxeles) */
  const vagones = (F, A, B, cuanto = 0.3, loco = 0.2) => K.cortes(F.T, F.g(...A), F.g(...B), cuanto, loco);
  /** un galpón con el centro en un punto del plano y el largo hacia (ux, uy) */
  const nave = (F, [px, py], [ux, uy], w, d, h, o) => { const [x, z] = F.g(px, py); K.nave(F.T, x, z, ux, uy, w, d, h, o); };

  // ============================================================================================ las playas de Retiro
  // Un marco a lo largo de las vías: x desde la boca de las naves de la estación Retiro hacia Palermo, z hacia el río.
  // El plano de Peuser da la playa entre la avenida Alem (z ≈ −150) y el borde de los depósitos (z ≈ 360), con los
  // tres rótulos: Central Argentino (z de −95 a 60), Central Córdoba (135 a 205) y Pacífico (230 a 300).
  const UY = [0.7097, -0.7049], OY = [13404, 9124], yp = (x, z) => [OY[0] + (x * UY[0] - z * UY[1]) / M, OY[1] + (x * UY[1] + z * UY[0]) / M], yl = (pts) => pts.map(([x, z]) => yp(x, z));
  const FY = en(13950, 8950);
  /** la playa balastada: una banda de x0 a x1, de z0 a z1 */
  const balasto = (x0, x1, z0, z1) => K.tira(FY.T, K.curva(FY.l(yl([[x0, (z0 + z1) / 2], [x1, (z0 + z1) / 2]])), 0, 30), z1 - z0, PINTA.BALASTO, 0.1, 0.7, 30);

  c.epoca(5);
  // --- el Central Argentino: las vías de los andenes, que salen de las dos naves y se juntan en las cuatro generales
  //     (las dos del medio son las de los trenes, src/vias.js); a la izquierda, la playa de cargas con sus galpones ---
  balasto(6, 1180, -95, -8); balasto(6, 1180, 8, 24);
  for (const [z, a] of [[-42, -17], [-30, -17], [-18, -12], [18, 12], [30, 17], [42, 17]]) via(FY, yl([[8, z], [150, z], [300, a], [340, a]]), false, 2);
  for (const z of [-17, -12, 12, 17]) via(FY, yl([[340, z], [1150, z], [1250, z < 0 ? -7 : 7]]), false, 1, 30);
  for (let k = 0; k < 6; k++) { const z = -60 - k * 5; via(FY, yl([[-30, z], [730 - k * 14, z], [880, -24], [960, -17]]), false, 2, 20); vagones(FY, yp(0, z), yp(700 - k * 14, z), 0.34, 0.12); }
  via(FY, yl([[40, -102], [700, -102], [790, -85]]), true, 2, 20); vagones(FY, yp(60, -102), yp(690, -102), 0.4, 0);
  nave(FY, yp(200, -121), UY, 270, 20, 7, { o: LADRILLO, cubierta: CHAPA }); nave(FY, yp(545, -126), UY, 250, 20, 7, { o: LADRILLO, cubierta: OXIDO });

  // --- el Central Córdoba y el Pacífico: de cada estación salen cuatro vías de andén que se abren en ocho de playa y
  //     vuelven a juntarse en las dos de la línea, hacia Palermo ---
  /** la cabecera de una estación: el edificio a lo ancho de las vías y los dos andenes techados */
  const cabecera = (z0, tono) => {
    const T = c.lugar(...yp(-272, z0), UY[0], UY[1]);
    T.caja(13, 9.4, 46, -8, 0, 0, CASA, { floors: 2, tono }); T.tejado(14, 47, 3, -8, 9.4, 0, 'z'); T.caja(9, 12.5, 12, -8, 0, 0, CASA, { floors: 3, tono }); T.cuatroAguas(10, 13, 3, -8, 12.5, 0);
    for (const s of [-1, 1]) { T.caja(180, 0.9, 6, 92, 0, s * 8, PIEDRA, { tono: c.GRIS }); T.put(K.techo(176, 7.6, 1.4).translate(92, 4.4, s * 8), PINTADO, CHAPA); for (let i = 0; i < 10; i++) T.caja(0.3, 3.5, 0.3, 10 + i * 18.2, 0.9, s * 8, TINTA); }
  };
  for (const [z0, tono, cuanto] of [[170, c.CREMA, 0.36], [265, c.LADRILLO, 0.4]]) {
    balasto(-262, 1090, z0 - 44, z0 + 44);
    for (let j = 0; j < 8; j++) { const z = z0 - 35 + j * 10, za = z0 + [-12, -4, 4, 12][j >> 1]; via(FY, yl([[-262, za], [-70, za], [60, z], [960, z], [1090, z0 - 2.5 + (j % 2) * 5]]), false, 2, 24); vagones(FY, yp(80, z), yp(940, z), (j === 3 || j === 4) ? 0.12 : cuanto, 0.14); }
    cabecera(z0, tono);
  }
  nave(FY, yp(300, 334), UY, 300, 18, 7, { o: LADRILLO, cubierta: CHAPA }); via(FY, yl([[90, 305], [150, 318], [470, 318], [540, 300]]), true, 2, 20); vagones(FY, yp(160, 318), yp(460, 318), 0.5, 0);
  // las dos líneas, hacia Palermo (el plano de Peuser las lleva a la par de la del Central Argentino, cada una por su franja)
  const FN = en(16000, 7000), CORDOBA = [yp(1090, 170), [15000, 7880], [15360, 7460], [15720, 7010], [16080, 6590], [16500, 6200], [16800, 5900], [17060, 5640]], PACIFICO = [yp(1090, 265), [15120, 7970], [15480, 7580], [15900, 7010], [16230, 6590], [16680, 6170], [16920, 5870], [17120, 5660]];
  doble(FN, CORDOBA); doble(FN, PACIFICO);

  c.epoca(6);
  // 1940: la playa de coches del Central Argentino, del lado del río, y un desvío más en cada una de las otras
  balasto(330, 1010, 24, 60);
  for (let k = 0; k < 6; k++) { const z = 30 + k * 5; via(FY, yl([[330, 17], [430 + k * 12, z], [900 - k * 12, z], [1000, 17]]), false, 2, 20); vagones(FY, yp(450 + k * 12, z), yp(880 - k * 12, z), 0.3, 0.1); }

  // ============================================================================================ las vías del puerto
  // La vía del puerto: viene de la avenida de los diques, da la vuelta por el sudoeste y corre a lo largo de las
  // cabeceras de las dársenas, entre ellas y la avenida Edison. (La traza, la de hoy; es la del lazo de los dos planos.)
  const FP = en(14300, 10500);
  const TRONCAL = [[12990, 9950], [13123, 9965], [13231, 10028], [13299, 10129], [13311, 10180], [13379, 10558], [13426, 10694], [13486, 10749], [13560, 10784], [13856, 10785], [13940, 10774], [14025, 10741], [14081, 10702], [14175, 10613], [14377, 10368], [14980, 9630]];
  const HASTA_USINA = [[14980, 9630], [15044, 9554], [15300, 9250], [15500, 9060], [15640, 8960], [15700, 8900]];
  /** por dónde pasa la vía del puerto a la altura x del plano (de la dársena A en adelante) */
  const enTroncal = (x) => { const L = [...TRONCAL.slice(8), ...HASTA_USINA.slice(1)]; for (let i = 0; i + 1 < L.length; i++) if (x <= L[i + 1][0] || i === L.length - 2) return L[i][1] + ((x - L[i][0]) / (L[i + 1][0] - L[i][0])) * (L[i + 1][1] - L[i][1]); return 0; };
  /** un ramal: del fondo de un espigón (xp, yp) derecho hasta su arranque (xr), y de ahí la curva que lo mete en la
   *  vía del puerto, rumbo a las playas. Con sus vagones en la recta. */
  const ramal = (xp, ypunta, xr = xp, cuanto = 0.3) => {
    const yj = enTroncal(xr), yr = yj + 100;
    via(FP, [[xp, ypunta], [xr, yr], [xr + 12, yj + 50], [xr + 48, yj + 13], [xr + 92, enTroncal(xr + 92)], [xr + 150, enTroncal(xr + 150)]], true, 3, 14);
    if (cuanto > 0) vagones(FP, [xp, ypunta - 12], [xr, yr + 30], cuanto, 0.1);
  };
  c.epoca(5);
  doble(FP, TRONCAL, 1); vagones(FP, [13580, 10781], [13840, 10782], 0.3, 0.5); vagones(FP, [14390, 10356], [14960, 9658], 0.16, 0.3);
  // los espigones habilitados en 1919: el 2 (entre las dársenas A y B) y el 3 (entre la B y la C). En cada uno, la
  // vía del muelle a cada lado —por debajo de las grúas— y dos más en cada calle, entre hilera e hilera de galpones.
  ramal(13855, 11500, 13851, 0.2); for (const x of [13938, 13948, 14035, 14045]) ramal(x, 11492, x, x % 2 ? 0.3 : 0.42); ramal(14138, 11500, 14129, 0.2);
  ramal(14356, 11300, 14347, 0.2); for (const x of [14436, 14446, 14534, 14544]) ramal(x, 11296, x, x % 4 ? 0.3 : 0.42); ramal(14639, 11300, 14629, 0.2);

  c.epoca(6);
  doble(FP, HASTA_USINA, 2); via(FP, [[15700, 8900], [15850, 8852], [15935, 8872], [15963, 8960], [15973, 9480]], true, 3, 12); vagones(FP, [15964, 8990], [15973, 9470], 0.5, 0);
  // los otros tres espigones, terminados en 1928: el 1 (al sur de la A), el 4 (entre la C y la D) y el 5, el de la usina
  ramal(13631, 11500, 13629, 0.2); ramal(13552, 11490, 13552, 0.3);
  ramal(14857, 10820, 14846, 0.2); ramal(14945, 10770, 14945, 0.3); ramal(14955, 10760, 14955, 0.4); ramal(15071, 10625, 15071, 0.4); ramal(15081, 10612, 15081, 0.3); ramal(15190, 10480, 15180, 0.2);
  ramal(15425, 10120, 15414, 0.2); ramal(15507, 10090, 15507, 0.34); ramal(15517, 10080, 15517, 0.4);
  // el empalme: de la línea del Pacífico, al norte de la playa, baja por el borde del parque y entra a la vía del
  // puerto frente a la Dársena D (las dos líneas que el plano de Peuser trae por ahí), con un desvío a su lado
  const EMPALME = [[15120, 7970], [15010, 8190], [14890, 8450], [14862, 8700], [14900, 9000], [14975, 9330], [15005, 9520], [14975, 9645], [14930, 9691], [14850, 9789]];
  const FE = en(14900, 8900); via(FE, EMPALME, true, 3, 12);
  { const L = K.curva(FE.l(EMPALME.slice(1, 7)), 3, 12); K.via(FE.T, K.corrida(L, 5)); } vagones(FE, [14866, 8480], [14860, 8720], 0.6, 0.3); vagones(FE, [14897, 9020], [14962, 9300], 0.5, 0.2);

  // ============================================================================================ los depósitos
  // El triángulo entre la playa del Pacífico, la avenida de las playas y la avenida Edison: el plano de Peuser lo
  // llena de galpones largos, atravesados a las vías, en tres o cuatro hileras, con otros chicos entre medio; y más
  // al este, dos largos a lo largo de las vías. (El plano no dice de quién eran: van sin nombre.)
  { const zTope = (x) => (x < 251 ? 355 + 0.942 * (x + 280) : x > 356 ? 419 + 1.057 * (741 - x) : 840), V = [-UY[1], UY[0]], FD = en(14150, 9450);
    for (let r = 0; r < 4; r++) for (let x = -150; x <= 700; x += 52) {
      const z0 = 380 + r * 112; if (z0 + 92 > Math.min(zTope(x - 12), zTope(x + 12)) - 20) continue;
      const t = al(), o = { o: t < 0.5 ? LADRILLO : t < 0.75 ? OCRE : CHAPA, cubierta: al() < 0.3 ? OXIDO : CHAPA };
      if (al() < 0.24) { for (const k of [0, 1]) nave(FD, yp(x, z0 + 18 + k * 50), V, 26, 20, 5.5, o); } else nave(FD, yp(x, z0 + 46), V, 92, 20, 6.5 + al() * 1.5, o);
    }
    nave(FD, [14760, 9200], UY, 150, 18, 7, { o: LADRILLO, cubierta: CHAPA }); nave(FD, [14802, 9242], UY, 150, 18, 7, { o: OCRE, cubierta: OXIDO });
  }
  // el Ferrocarril del Estado: los dos edificios que el plano rotula así, junto a la avenida que baja al puerto. (La forma, supuesta.)
  for (const [px, py, w, d] of [[13570, 10110, 46, 40], [13860, 10070, 42, 42]]) { const T = c.lugar(px, py, 0.729, 0.685); T.caja(w, 8.6, d, 0, 0, 0, CASA, { floors: 2, tono: c.CREMA }); T.cuatroAguas(w + 1, d + 1, 4, 0, 8.6, 0); }

  // --- un elevador de granos, en el arranque del espigón 4, entre las vías: los silos de hormigón en dos hileras, la
  //     torre de las máquinas y la galería de la cinta que cruza al muelle de la Dársena D. Va por el encargo y sin
  //     nombre: ni el lugar ni la forma salen de los planos (ver LEEME.md). ---
  { const T = c.lugar(15013, 10045, 0, 1), HO = { tono: c.GRIS }; // (x hacia el río; z hacia el sur, hacia la Dársena C)
    for (let i = 0; i < 7; i++) for (const s of [-1, 1]) T.cilindro(5.4, 30, -30 + i * 10.6, 0, s * 5.3, PIEDRA, 10, 5.4, HO);
    T.caja(76, 4, 11, 1.8, 30, 0, PINTADO, CHAPA); T.put(K.techo(77, 12, 2).translate(1.8, 34, 0), PINTADO, CHAPA);
    T.caja(13, 46, 15, -43.5, 0, 0, CASA, { floors: 10, ...HO }); T.put(K.techo(13.6, 15.6, 3).translate(-43.5, 46, 0), PINTADO, CHAPA);
    T.put(new THREE.BoxGeometry(3, 3, 116).translate(-43.5, 21, -64), PINTADO, CHAPA); for (const z of [-40, -75, -110]) T.caja(0.5, 19.5, 0.5, -43.5, 0, z, TINTA);
    T.caja(9, 23, 9, -43.5, 0, -124, PINTADO, CHAPA);
  }

  // ============================================================================================ la Costanera Norte
  // La rambla, entre la avenida y el río: el solado, el pretil de material sobre el murallón y los faroles; las dos
  // hileras de árboles de la avenida; y los árboles de los parques, cada uno donde la lámina del suelo tiene pasto
  // (los reparte tools/costanera.mjs, que los deja en costanera-arboles.js).
  { const FC = en(17000, 6700), costa = K.curva(FC.l(COSTA_NORTE.slice(2)), 2, 14), GRANITO = { tono: c.SILLAR }, BLANCO = P(PINTA.BLANCO, 0.97);
    K.tira(FC.T, K.corrida(costa, -9), 14, PINTA.BALDOSA, 0.12, 0.86);
    const borde = K.corrida(costa, -1);
    for (let i = 0; i + 1 < borde.length; i++) { const [x0, z0] = borde[i], [x1, z1] = borde[i + 1], a = -Math.atan2(z1 - z0, x1 - x0);
      if (i % 3 === 0) { const j = Math.min(borde.length - 1, i + 3), [x2, z2] = borde[j], l2 = Math.hypot(x2 - x0, z2 - z0); FC.T.put(new THREE.BoxGeometry(l2 + 0.4, 1, 0.55).rotateY(-Math.atan2(z2 - z0, x2 - x0)).translate((x0 + x2) / 2, 0.5, (z0 + z2) / 2), PIEDRA, GRANITO); }
      if (i % 3 === 1) { const [x, z] = K.corrida(costa, -3.2)[i]; FC.T.put(new THREE.BoxGeometry(0.22, 5.6, 0.22).translate(x, 2.8, z), TINTA); FC.T.put(new THREE.BoxGeometry(0.7, 0.7, 0.7).rotateY(a).translate(x, 5.95, z), PINTADO, BLANCO); }
    }
    const av = K.curva(FC.l(AVENIDAS.find((a) => a[0] === 'Costanera')[3].slice(6)), 2, 16);
    for (const s of [-1, 1]) K.corrida(av, s * 14.5).forEach(([x, z], i) => FC.T.arbol(x, z, 3.6 + (i % 3) * 0.3));
    for (const [px, py, r] of ARBOLES) FC.T.arbol(...FC.g(px, py), r);
  }

  // ============================================================================== la faja de vías, hacia Palermo
  // El plano de Peuser llena de vías la faja entre la avenida Centenario y los parques, de las playas a Palermo: van
  // desvíos entre las dos líneas y del lado de tierra de la del Córdoba, con sus cortes de vagones. (Cuántos son y
  // dónde está cada uno, supuesto. Va al final del archivo para no correrle la tirada a lo de arriba.)
  { c.epoca(6);
    const entre = (t, n) => CORDOBA.slice(0, n).map((p, i) => [p[0] + (PACIFICO[i][0] - p[0]) * t, p[1] + (PACIFICO[i][1] - p[1]) * t]);
    const tramo = (A, B, a, b) => [[A[0] + (B[0] - A[0]) * a, A[1] + (B[1] - A[1]) * a], [A[0] + (B[0] - A[0]) * b, A[1] + (B[1] - A[1]) * b]];
    for (const [t, n] of [[0.34, 6], [0.67, 6], [-0.4, 6], [-0.8, 5], [-1.2, 4]]) {
      const L = entre(t, n); via(FN, [...L, (t > 0.5 ? PACIFICO : CORDOBA)[n]], true, 3, 14);
      vagones(FN, ...tramo(L[2], L[3], 0.2, 0.8), 0.4, 0.1); if (n > 4) vagones(FN, ...tramo(L[3], L[4], 0.2, 0.8), 0.25, 0);
    }
  }
  c.epoca(0);
}
