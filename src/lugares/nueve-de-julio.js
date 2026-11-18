// La Avenida 9 de Julio y la Plaza de la República, como quedaron al inaugurarse el primer tramo (12 de octubre de
// 1937): cinco cuadras, de Bartolomé Mitre a Tucumán, en el lugar de las manzanas enteras que había entre Cerrito y
// Carlos Pellegrini. El suelo ya pinta de asfalto todo el ancho; acá va lo que tenía encima.
//
// De qué foto sale cada cosa (todas en Wikimedia Commons, de 1937 y de dominio público):
//   · «Avenida 9 de Julio (foto aérea inauguración)» (Municipalidad de Buenos Aires, 12-10-1937; mira al sur, con
//     Cerrito a la derecha): el corte de la avenida —la calzada central, a cada lado un canterito angosto, un carril y
//     un cantero ancho de césped, y afuera Cerrito y Pellegrini—, las tres cuadras del sur y las dos del norte, la
//     plataforma redonda del Obelisco en medio de una gran calzada despejada y las cuatro fuentes redondas, una en la
//     punta de cada isla. Las medidas salen de ahí, repartidas en el ancho que hay entre las dos calles.
//   · «Av 9 de julio y obelisco 1937» (desde Pellegrini al 500, mirando al sudoeste): la plataforma clara y lisa, sin
//     reja ni escalones; la isla del nordeste con su fuente baja de borde ancho, dos paños de césped de puntas
//     redondas y una casilla; el cerco bajo de los canteritos, cortado en tramos; las columnas altas de dos globos,
//     las farolas de un globo en las veredas; los plátanos recién plantados, podados, en hilera; y la rampa del
//     estacionamiento subterráneo, todavía en obra, en la punta del cantero.
//   · «Vista de la Avenida 9 de Julio, Buenos Aires, en la década de 1930» (postal coloreada, desde Cerrito y
//     Tucumán): los canteros verdes, la isla del noroeste con sus dos paños y los canteritos cortos que siguen hasta
//     cerca de la plaza.
//   · «Avenida 9 de Julio 01» (el día de la inauguración, desde el norte): la rampa terminada, con su baranda blanca.
//   · «Av 9 julio arg 1937» (la obra, Archivo General de la Nación): las columnas de alumbrado en fila sobre los dos
//     canteritos.
// Lo que las fotos no dejan medir va simple y parejo: las cuatro islas iguales, una rampa por cantero en las cuadras
// donde la aérea muestra algo (la de Mitre a Perón no la tiene: ahí el césped va partido en dos paños).
export default function (c) {
  const { THREE, PINTA, TINTA, FOLLAJE, PINTADO } = c;
  // Las esquinas de hoy (tools/esquina.mjs), en píxeles del plano: cada calle con Cerrito y con Carlos Pellegrini.
  const ESQ = {
    mitre: [[10615, 8273], [10617, 8438]], peron: [[10813, 8279], [10807, 8445]], sarmiento: [[10997, 8284], [10995, 8449]],
    lavalle: [[11390, 8296], [11387, 8461]], tucuman: [[11578, 8299], [11571, 8470]],
  };
  // El eje va de la mitad de Mitre a la mitad de Tucumán (el Obelisco cae justo encima): x hacia el norte, z hacia
  // Pellegrini (el río), y el origen al pie del Obelisco.
  const medio = ([a, b]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], A = medio(ESQ.mitre), B = medio(ESQ.tucuman), largo = Math.hypot(B[0] - A[0], B[1] - A[1]);
  const T = c.lugar(11195, 8373, (B[0] - A[0]) / largo, (B[1] - A[1]) / largo);
  const calle = (e) => (T.deMundo(...e[0])[0] + T.deMundo(...e[1])[0]) / 2; // (a cuántos metros del Obelisco cruza)
  const MITRE = calle(ESQ.mitre), PERON = calle(ESQ.peron), SARMIENTO = calle(ESQ.sarmiento), LAVALLE = calle(ESQ.lavalle), TUCUMAN = calle(ESQ.tucuman);
  c.epoca(6);

  // El corte, del eje hacia afuera (metros): media calzada central, el canterito del cerco, un carril y el cantero
  // ancho con su vereda; de ahí al frente de las casas, la calle de siempre (Cerrito o Pellegrini).
  const CENTRO = 11.5, CERCO = 3.2, CARRIL = 8.3, Z0 = CENTRO + CERCO + CARRIL, Z1 = 50.5, VEREDA = 4;
  const BOCA = 8; // (lo que queda libre a cada lado del eje de una calle que cruza)
  const blanco = { pinta: [PINTA.BLANCO, 1] }, SOLADO = { claro: 0.93 }; // (las veredas, casi del color del papel en el modo tinta)
  const lado = (pts, s) => pts.map(([x, z]) => [x, s * z]);

  const globo = (x, y, z, r) => T.put(new THREE.IcosahedronGeometry(r, 0).translate(x, y, z), PINTADO, blanco);
  /** una columna de alumbrado de las altas: el pie, el fuste y arriba el travesaño con un globo colgado de cada punta */
  const columna = (x, z) => {
    T.caja(0.55, 1.1, 0.55, x, 0, z, TINTA); T.cilindro(0.17, 8.5, x, 1.1, z, TINTA, 6, 0.1);
    T.caja(0.12, 0.12, 2.4, x, 9.45, z, TINTA); T.cilindro(0.07, 0.8, x, 9.6, z, TINTA, 4, 0.02);
    for (const s of [-1, 1]) globo(x, 9.0, z + s * 1.1, 0.38);
  };
  /** una farola de vereda: un poste con un globo */
  const farola = (x, z) => { T.cilindro(0.1, 3.5, x, 0, z, TINTA, 5, 0.07); globo(x, 3.75, z, 0.32); };
  /** un rectángulo de u0..u1 × z0..z1 con las dos puntas de u0 redondeadas con r0 y las de u1 con r1 */
  const redondo = (u0, u1, z0, z1, r0, r1 = r0) => {
    // (pocos puntos por punta: lo que va a ras del suelo se parte en triángulos chicos, y cada punto pesa)
    const out = [], arco = (cu, cz, r, a0) => { const n = r > 6 ? 9 : 3; for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * Math.PI / 2; out.push([cu + Math.cos(a) * r, cz + Math.sin(a) * r]); } };
    arco(u1 - r1, z0 + r1, r1, -Math.PI / 2); arco(u1 - r1, z1 - r1, r1, 0); arco(u0 + r0, z1 - r0, r0, Math.PI / 2); arco(u0 + r0, z0 + r0, r0, Math.PI);
    return out;
  };
  /** una hilera de plátanos jóvenes de xa a xb, con una farola cada tres árboles */
  const hilera = (xa, xb, z, faroles = true) => {
    const n = Math.max(1, Math.round(Math.abs(xb - xa) / 9));
    for (let i = 0; i <= n; i++) { const x = xa + ((xb - xa) * i) / n; T.arbol(x, z, 1.5); if (faroles && i % 3 === 1 && i < n) farola(x + (xb - xa) / n / 2, z); }
  };
  /** el canterito del cerco, de xa a xb del lado s: el cordón, el cerco bajo cortado en tramos y las columnas en los claros */
  const cerco = (xa, xb, s) => {
    const z = s * (CENTRO + CERCO / 2), n = Math.max(1, Math.round((xb - xa - 5) / 24)), paso = (xb - xa - 5) / n;
    T.cantero(T.recto(xb - xa, CERCO, (xa + xb) / 2, z), { alto: 0.25, cordon: 0.35 });
    for (let i = 0; i <= n; i++) columna(xa + 2.5 + i * paso, z);
    for (let i = 0; i < n; i++) T.caja(paso - 4.4, 0.75, 1.5, xa + 2.5 + (i + 0.5) * paso, 0.25, z, FOLLAJE);
  };

  // ------------------------------------------------------------------------------------------------ las cuadras
  /** Una cuadra, de xa a xb: a cada lado la vereda ancha con su cantero de césped y sus plátanos, y junto a la calzada
   *  central el canterito del cerco. `rampa`: en qué punta baja al estacionamiento (1: la de xb, −1: la de xa, 0: no
   *  tiene); `partido`: el césped en dos paños, con un paso en el medio. */
  const cuadra = (xa, xb, { rampa = 0, partido = false } = {}) => {
    const xm = (xa + xb) / 2, RL = 30, RA = 7, zr = Z0 + 3; // (la rampa: 30 × 7 m, del lado de adentro)
    for (const s of [-1, 1]) {
      T.tapete(lado(redondo(xa, xb, Z0, Z1, 4), s), PINTA.BALDOSA, SOLADO);
      const zi = Z0 + VEREDA, zo = Z1 - VEREDA;
      if (partido) for (const [a, b] of [[xa + VEREDA, xm - 2], [xm + 2, xb - VEREDA]]) T.cantero(lado(redondo(a, b, zi, zo, 3), s));
      else if (!rampa) T.cantero(lado(redondo(xa + VEREDA, xb - VEREDA, zi, zo, 3), s));
      else {
        // el césped le deja el rincón a la rampa: una ele
        const e = rampa > 0 ? xb : xa, d = -rampa, x0 = e + d * VEREDA, xr = e + d * (RL + 2), x1 = (rampa > 0 ? xa : xb) - d * VEREDA, zm = zr + RA + 2;
        T.cantero([[x1, s * zi], [xr, s * zi], [xr, s * zm], [x0, s * zm], [x0, s * zo], [x1, s * zo]]);
        // la rampa: la baranda blanca por tres lados, el piso que baja y, al fondo, la losa por donde se mete bajo el cantero
        const xc = e + d * RL / 2, zcr = s * (zr + RA / 2);
        for (const k of [0, 1]) T.caja(RL, 1, 0.35, xc, 0, s * (zr + k * RA));
        T.caja(0.35, 1, RA + 0.35, e + d * RL, 0, zcr);
        T.tapete(T.recto(RL * 0.55, RA - 0.4, e + d * RL * 0.275, zcr), PINTA.ASFALTO, { y: 0.32, claro: 0.5 });
        T.tapete(T.recto(RL * 0.45 - 0.2, RA - 0.4, e + d * (RL * 0.775 - 0.1), zcr), PINTA.NEGRO, { y: 0.32, claro: 0.2 });
        T.caja(RL * 0.3, 0.25, RA, e + d * RL * 0.85, 0.75, zcr);
      }
      hilera(xa + 3, xb - 3, s * (Z0 + 1.7)); hilera(xa + 3, xb - 3, s * (Z1 - 1.7));
      cerco(xa + 4, xb - 4, s);
    }
  };
  cuadra(MITRE + BOCA, PERON - BOCA, { partido: true });
  cuadra(PERON + BOCA, SARMIENTO - BOCA, { rampa: 1 });
  cuadra(LAVALLE + BOCA, TUCUMAN - BOCA, { rampa: -1 });

  // ----------------------------------------------------------------------------------- la Plaza de la República
  // El Obelisco (que ya está en src/hitos.js) en el centro de una plataforma redonda de 54 m, clara y lisa, sin reja;
  // alrededor, una calzada abierta de lado a lado por donde daban la vuelta los autos y los tranvías.
  T.cantero(T.ovalo(0, 0, 27, 27, 40), { alto: 0.3, tono: PINTA.BLANCO, cordon: 0.5, claro: 0.97 });

  // Las cuatro islas, entre la plaza y la primera calle que cruza (Lavalle al norte, Sarmiento al sur): la punta
  // redondeada hacia el Obelisco con la fuente, y atrás dos paños de césped. El borde ondulado que tiene la plaza en
  // la foto aérea son estas cuatro puntas.
  const PUNTA = 50; // (a cuántos metros del Obelisco empiezan)
  const isla = (sx, s, fin) => {
    const en = (pts) => pts.map(([u, z]) => [sx * u, s * z]), zi = Z0 + VEREDA, zo = Z1 - VEREDA, zc = (Z0 + Z1) / 2;
    T.tapete(en(redondo(PUNTA, fin, Z0, Z1, 11, 4)), PINTA.BALDOSA, SOLADO);
    // la fuente: un piletón redondo y bajo, de borde ancho
    T.cantero(T.ovalo(sx * (PUNTA + 11), s * zc, 4.4, 4.4, 16), { alto: 0.55, tono: PINTA.AGUA, cordon: 0.85, claro: 0.6 });
    T.cantero(en(redondo(PUNTA + 19.5, PUNTA + 29.5, zi, zo, 4)));
    T.cantero(en(redondo(PUNTA + 33, fin - VEREDA, zi, zo, 4)));
    hilera(sx * (PUNTA + 13), sx * (fin - 3), s * (Z0 + 1.7)); hilera(sx * (PUNTA + 13), sx * (fin - 3), s * (Z1 - 1.7));
    for (const k of [-1, 1]) farola(sx * (PUNTA + 6), s * (zc + k * 7.5));
    cerco(sx > 0 ? PUNTA + 28 : -(fin - 4), sx > 0 ? fin - 4 : -(PUNTA + 28), s);
  };
  for (const s of [-1, 1]) { isla(1, s, LAVALLE - BOCA); isla(-1, s, -SARMIENTO - BOCA); }
  // (la casilla de la isla del nordeste, junto al primer paño de césped: la única que se ve en la foto)
  T.caja(3, 2.4, 2.2, PUNTA + 17, 0, Z1 - 5.5); T.caja(3.4, 0.2, 2.6, PUNTA + 17, 2.4, Z1 - 5.5);

  // Los plátanos de las veredas de Cerrito y de Pellegrini, frente a las casas, cuadra por cuadra. Corrientes y la
  // Diagonal Norte (que entra por el sudeste, desde Pellegrini, y sale por el noroeste, hacia Tribunales) quedan libres.
  const F = BOCA + 4, DIAGONAL = 76; // (hasta cuántos metros del Obelisco llega la boca de la Diagonal sobre el frente de las casas)
  for (const s of [-1, 1]) {
    for (const [a, b] of [[MITRE, PERON], [PERON, SARMIENTO], [LAVALLE, TUCUMAN]]) hilera(a + F, b - F, s * 63.2, false);
    // (del lado de Pellegrini la Diagonal corta la cuadra del sur; del de Cerrito, la del norte)
    hilera(SARMIENTO + F, s > 0 ? -DIAGONAL : -14, s * 63.2, false);
    hilera(s > 0 ? 14 : DIAGONAL, LAVALLE - F, s * 63.2, false);
  }

  // Lo que al Obelisco de src/hitos.js le falta: la ventanita de cada cara, arriba, y la puerta del pie (mira al oeste).
  // Va con sus mismos ejes: los de la grilla.
  const O = c.lugar(11195, 8373), cara = (y) => 3.4 - 1.653 * (y - 0.5) / 63.5; // (media cara a esa altura)
  for (const k of ['+x', '-x', '+z', '-z']) { const d = (k[0] === '+' ? 1 : -1) * (cara(61.6) + 0.04); O.vano(0.6, 0.9, k[1] === 'x' ? d : 0, 61.6, k[1] === 'z' ? d : 0, k, false); }
  O.vano(0.9, 2, 0, 0.5, -(cara(0.5) + 0.04), '-z', false);
}
