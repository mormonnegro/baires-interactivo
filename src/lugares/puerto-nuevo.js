// El Puerto Nuevo: las cinco dársenas en peine al norte de la Dársena Norte (la idea de Huergo, al fin), hechas por
// C. H. Walker & Co. entre 1911 y 1928, y lo que quedó a su lado: el Hotel de Inmigrantes y las dos usinas.
//   · 1921 (etapa 5): la primera parte, inaugurada en 1919. La carta del puerto hecha con los planos de Obras Públicas
//     de 1919-1920 (fuentes/planos/1925-puerto.jpg) dibuja ya las cinco dársenas y la escollera, pero con galpones
//     hechos solo en los espigones 2 y 3 (los del 1 y el 4, de puntos: en proyecto) y con estas sondas: 31 pies en la A,
//     30 en la B, 29 en la C, de 18 a 24 en la D y 6 —el río, sin tocar— en la E. Así que van los vapores de ultramar
//     en la A, la B y el muelle sur de la C, los galpones de esos dos espigones, y la obra en el resto: las dragas en
//     la D, los martinetes y los montones de relleno en los espigones 4 y 5. Grúas, todavía no: se cargaba con las
//     plumas de los barcos. Y el Hotel de Inmigrantes (1906-1911) con su desembarcadero, sobre el muelle norte de la
//     Dársena Norte.
//   · 1940 (etapa 6): el puerto terminado en 1928. Las grúas eléctricas de pórtico (MAN y Demag, de 1926 a 1930), los
//     transatlánticos en la A, cargueros en todas, galpones también en los espigones 1 y 4, la súper usina de la CHADE
//     en el espigón 5 —el frente de las dos torres mirando a la ciudad, la sala de máquinas y las calderas atrás, la
//     playa de carbón hacia la punta— y la de la Ítalo (CIAE) en el 6, al norte de la Dársena E.
// Los contornos son los de OpenStreetMap (fuentes/osm/lagos.json): los murallones siguen esas líneas. Lo que hay arriba
// de cada espigón sale de la carta de 1925 y de la del Almirantazgo de 1935 (hecha con el plano oficial de 1931),
// calzada sobre esos contornos; la escollera, de esa misma carta. La Dársena F es posterior: no está.
// Los lugares, en píxeles del plano de 1867 (x al norte, y al río); las medidas, en metros. Los cascos flotan en y = 0.
export default function (c) {
  const { THREE, PINTA, PINTADO, PIEDRA, TINTA, CASA } = c, M = 0.675, K = 1 / M;
  /** un color parejo: de qué va pintado y qué tan claro sale en tinta */
  const P = (tono, claro = 0.5) => ({ pinta: [tono, claro] });
  const NEGRO = P(PINTA.NEGRO, 0.12), BLANCO = P(PINTA.BLANCO, 0.97), ROJO = P(PINTA.ROJO, 0.35), LONA = P(PINTA.LONA, 0.9), MADERA = P(PINTA.MADERA, 0.55), CHAPA = P(PINTA.CHAPA, 0.8), OCRE = P(PINTA.OCRE, 0.7), LADRILLO = P(PINTA.LADRILLO, 0.74), CARBON = P(PINTA.ASFALTO, 0.22), RELLENO = P(PINTA.GRANZA, 0.78);
  let azar = 0.6131; const al = () => (azar = (azar * 9301 + 0.2113) % 1); // (siempre la misma tirada)
  // Las dársenas corren hacia el río, casi derechas con el plano (0,7° de giro). Un lugar de acá: x hacia el río, z al sur.
  const UX = 0.012, UY = 0.99993, L = (px, py) => c.lugar(px, py, UX, UY);

  // ----------------------------------------------------------------------------------------------- piezas sueltas
  // (las mismas del puerto de Madero, src/lugares/puerto.js: los dos puertos, con el mismo lenguaje)
  /** la planta de un casco de eslora L y manga B: la proa (en punta) hacia +x, la popa redonda */
  const planta = (L, B) => [[-L / 2, -B * 0.28], [-L * 0.46, -B * 0.45], [-L * 0.3, -B / 2], [L * 0.25, -B / 2], [L * 0.4, -B * 0.33], [L / 2, 0], [L * 0.4, B * 0.33], [L * 0.25, B / 2], [-L * 0.3, B / 2], [-L * 0.46, B * 0.45], [-L / 2, B * 0.28]];
  /** una traca del casco: la planta levantada de y0 a y1, sin tapas (con `tapa`, solo la cubierta, a la altura y1) */
  const traca = (pts, y0, y1, tapa = false) => {
    const v = [], n = pts.length; let a = 0, cx = 0, cz = 0;
    for (let i = 0; i < n; i++) { const [x0, z0] = pts[i], [x1, z1] = pts[(i + 1) % n]; a += x0 * z1 - x1 * z0; cx += x0 / n; cz += z0 / n; }
    for (let i = 0; i < n; i++) {
      let p = pts[i], q = pts[(i + 1) % n]; if (a < 0) [p, q] = [q, p];
      if (tapa) v.push(cx, y1, cz, q[0], y1, q[1], p[0], y1, p[1]);
      else v.push(p[0], y0, p[1], p[0], y1, p[1], q[0], y1, q[1], p[0], y0, p[1], q[0], y1, q[1], p[0], y0, q[1]);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals(); return g;
  };
  /** un palo inclinado (una pluma de carga, un tornapunta): de (x, y, z), largo `l`, volcado `a` radianes hacia ±x o ±z */
  const pluma = (T, x, y, z, l, a, eje = 'x', g = 0.22) => { const b = new THREE.BoxGeometry(g, l, g).translate(0, l / 2, 0); if (eje === 'x') b.rotateZ(-a); else b.rotateX(a); T.put(b.translate(x, y, z), TINTA); };
  /** un techo a cuatro aguas pintado (acá, los montones de carbón y de relleno) */
  const cuatro = (T, w, d, h, x, y, z, o) => {
    const r = Math.max(0, (w - d) / 2), s = Math.max(0, (d - w) / 2), A = [-w / 2, 0, -d / 2], B = [w / 2, 0, -d / 2], C = [w / 2, 0, d / 2], D = [-w / 2, 0, d / 2], R1 = [-r, h, -s], R2 = [r, h, s];
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([D, C, R2, D, R2, R1, B, A, R1, B, R1, R2, A, D, R1, C, B, R2].flat(), 3)); g.computeVertexNormals();
    T.put(g.translate(x, y, z), PINTADO, o);
  };
  /** el coronamiento de piedra de un murallón, de (x0, z0) a (x1, z1), con sus bolardos */
  const murallon = (T, x0, z0, x1, z1) => {
    const l = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(z1 - z0, x1 - x0);
    T.put(new THREE.BoxGeometry(l + 1.8, 0.55, 1.8).rotateY(-a).translate((x0 + x1) / 2, 0.275, (z0 + z1) / 2), PIEDRA, { tono: c.SILLAR });
    for (let i = 0, n = Math.round(l / 70); i < n; i++) { const t = (i + 0.5) / n; T.caja(0.5, 0.6, 0.5, x0 + (x1 - x0) * t, 0.55, z0 + (z1 - z0) * t, TINTA); }
  };

  // -------------------------------------------------------------------------------------------------- los barcos
  // El vapor de carga y el paquete de pasajeros del puerto de Madero, y tres de acá: el transatlántico (más largo, de
  // dos o tres chimeneas), el carbonero (el puente a popa) y la draga de cangilones de la obra. Cada uno, anclado en
  // el punto del agua donde flota.
  const barco = (px, py, ux, uy, o = {}) => {
    const n = Math.hypot(ux, uy), T = c.lugar(px, py, ux / n, uy / n);
    const { tipo = 'carga', L = 92, B = L * 0.135, alto = L * 0.045 + 1.6, casco = NEGRO, chimenea = NEGRO } = o, pl = planta(L, B);
    const viva = Math.min(0.9, alto * 0.25);
    T.put(traca(pl, 0, viva), PINTADO, ROJO); T.put(traca(pl, viva, alto), PINTADO, casco); T.put(traca(pl, 0, alto, true), PINTADO, P(PINTA.MADERA, 0.86));
    const palo = (x, h, r = 0.26) => T.cilindro(r, h, x, alto, 0, TINTA, 4, r * 0.4);
    if (tipo === 'carga' || tipo === 'pasaje') {
      // el castillo de proa y la toldilla
      T.prisma([[L * 0.3, -B * 0.44], [L * 0.4, -B * 0.33], [L / 2, 0], [L * 0.4, B * 0.33], [L * 0.3, B * 0.44]], 1.5, alto, PINTADO, casco);
      T.prisma([[-L / 2, -B * 0.28], [-L * 0.46, -B * 0.45], [-L * 0.37, -B / 2], [-L * 0.37, B / 2], [-L * 0.46, B * 0.45], [-L / 2, B * 0.28]], 1.3, alto, PINTADO, casco);
      const pasaje = tipo === 'pasaje', popa = !!o.popa, lc = L * (pasaje ? 0.52 : 0.2), xc = pasaje ? -L * 0.02 : popa ? -L * 0.3 : -L * 0.03;
      T.caja(lc, 2.5, B * 0.84, xc, alto, 0, PINTADO, BLANCO); T.caja(lc * (pasaje ? 0.86 : 0.5), 2.3, B * 0.64, xc + (pasaje ? 0 : lc * 0.2), alto + 2.5, 0, PINTADO, BLANCO);
      if (o.puentes) T.caja(lc * 0.7, 2.3, B * 0.56, xc, alto + 4.8, 0, PINTADO, BLANCO); // (el transatlántico: una cubierta más)
      const ks = o.chimeneas ?? (pasaje ? [-0.09, 0.07] : [popa ? -0.33 : -0.06]), y0 = alto + (pasaje ? 4.8 : 2.5) + (o.puentes ? 2.3 : 0);
      for (const k of ks) { const r = B * (pasaje ? 0.13 : 0.11), h = pasaje ? 9.5 : 7.5; T.cilindro(r, h, L * k, y0, 0, PINTADO, 7, r, chimenea); if (chimenea !== NEGRO) T.cilindro(r * 1.04, 1.4, L * k, y0 + h, 0, PINTADO, 7, r * 1.04, NEGRO); }
      for (const s of [-1, 1]) {
        const xm = popa ? (s < 0 ? -L * 0.12 : L * 0.2) : s * L * (pasaje ? 0.36 : 0.26); palo(xm, L * 0.24 + 4);
        if (!pasaje) { pluma(T, xm, alto + 1.2, 0, L * 0.13, 0.95); pluma(T, xm, alto + 1.2, 0, L * 0.13, -0.95); T.caja(L * 0.1, 0.8, B * 0.46, xm - s * L * 0.1, alto, 0, PINTADO, LONA); }
      }
    } else if (tipo === 'remolcador') {
      T.caja(L * 0.36, 2.2, B * 0.62, L * 0.04, alto, 0, PINTADO, BLANCO); T.cilindro(0.7, 5, -L * 0.06, alto + 1.6, 0, PINTADO, 6, 0.7, chimenea); palo(L * 0.26, 8, 0.16);
    } else if (tipo === 'chata') {
      T.caja(L * 0.66, 1.3, B * 0.7, 0, alto, 0, PINTADO, o.carga ?? LONA);
    } else if (tipo === 'draga') {
      // la draga de cangilones: el castillete del medio, del que cuelga la escala que baja al fondo por la proa, la
      // casilla y la chimenea a popa, y a un costado el caño por el que vuelca el barro en la chata
      T.caja(L * 0.26, 2.4, B * 0.7, -L * 0.26, alto, 0, PINTADO, BLANCO); T.cilindro(0.85, 8, -L * 0.3, alto + 2.4, 0, PINTADO, 6, 0.85, chimenea);
      for (const s of [-1, 1]) for (const t of [-1, 1]) T.caja(0.36, 13, 0.36, t * 2.3, alto, s * B * 0.3, TINTA);
      T.caja(5.4, 0.45, B * 0.72, 0, alto + 13, 0, TINTA); pluma(T, 0, alto + 12.6, 0, 34, 2.0, 'x', 1.3); pluma(T, 0, alto + 9, 0, B * 0.95, 1.9, 'z', 0.7);
    }
    return T;
  };
  const SURTIDO = [{ L: 104 }, { L: 118, chimenea: ROJO }, { L: 96, chimenea: OCRE }, { L: 112, chimenea: P(PINTA.BLANCO, 0.9) }, { L: 100 }, { L: 124, chimenea: OCRE }];
  const CARBONERO = { L: 98, popa: true, casco: P(PINTA.NEGRO, 0.16) };

  // ------------------------------------------------------------------------------------------------ las dársenas
  // De cada una, el muelle del sur y el del norte: [en la cabecera, en la boca]. `cab`: donde la cabecera hace esquina
  // (del lado sur van en chanfle). El agua de cada una la pinta el suelo (tools/crece.mjs) con estos mismos contornos.
  const DARSENAS = {
    A: { s: [[13637, 10990], [13640, 11520]], n: [[13843, 10984], [13847, 11524]] },
    B: { s: [[14136, 10826], [14146, 11517]], n: [[14338, 10682], [14348, 11323]], cab: [14307, 10683] },
    C: { s: [[14636, 10327], [14648, 11318]], n: [[14838, 10123], [14849, 10844]], cab: [14801, 10124] },
    D: { s: [[15188, 9651], [15199, 10508]], n: [[15406, 9434], [15417, 10152]], cab: [15370, 9431] },
    E: { s: [[15973, 8695], [15984, 9550]], n: [[16191, 8474], [16200, 9195]], cab: [16154, 8474] },
  };
  /** un punto del muelle de una dársena: del lado 's' o 'n', a la altura `y` del plano, `d` metros tierra adentro (negativo: al agua) */
  const muelle = (D, lado, y, d = 0) => { const q = DARSENAS[D][lado], t = (y - q[0][1]) / (q[1][1] - q[0][1]); return [q[0][0] + (q[1][0] - q[0][0]) * t + (lado === 's' ? -1 : 1) * d * K, y]; };
  /** un barco amarrado a un muelle, con la proa al río o a la cabecera */
  const atraca = (D, lado, y, o, proa = al() < 0.5 ? 1 : -1) => { const [px, py] = muelle(D, lado, y, -(3.4 + (o.B ?? o.L * 0.135) / 2)); return barco(px, py, UX * proa, UY * proa, o); };
  /** una grúa eléctrica de pórtico (1926-1930): las cuatro patas a caballo de la vía del muelle, la casilla giratoria con
   *  su contrapeso y la pluma de celosía, vuelta `giro` radianes desde el agua (`lado`: ±1 en z) */
  const grua = (px, py, lado, giro = 0) => {
    const T = L(px, py), a = (lado > 0 ? 0 : Math.PI) + giro;
    for (const s of [-1, 1]) for (const t of [-1, 1]) T.caja(0.42, 8.4, 0.42, s * 2.7, 0, t * 2.7, TINTA);
    T.caja(6.4, 0.5, 6.4, 0, 8.4, 0, TINTA);
    const pone = (g, kind, o) => T.put(g.rotateY(a).translate(0, 8.9, 0), kind, o);
    pone(new THREE.BoxGeometry(3.6, 3.2, 4.6).translate(0, 1.6, -0.5), PINTADO, CHAPA); pone(new THREE.BoxGeometry(2.6, 1.5, 2.2).translate(0, 1.2, -3.8), TINTA);
    pone(new THREE.BoxGeometry(0.5, 23, 0.5).translate(0, 11.5, 0).rotateX(0.82).translate(0, 2.4, 1.6), TINTA);
    pone(new THREE.BoxGeometry(0.22, 9, 0.22).translate(0, 4.5, 0).rotateX(-0.25).translate(0, 3.2, -0.4), TINTA);
  };
  const gruas = (D, lado, y0, y1, n) => { for (let i = 0; i < n; i++) { const [px, py] = muelle(D, lado, y0 + ((i + 0.5 + (al() - 0.5) * 0.5) / n) * (y1 - y0), 5.5); grua(px, py, lado === 's' ? -1 : 1, (al() - 0.5) * 1.5); } };
  /** un galpón del Puerto Nuevo: el cuerpo de material con sus portones, el andén de carga a cada lado, el techo a dos
   *  aguas y el lucernario corrido en la cumbrera. Con `pisos` 2, los de depósito alto (los que la carta de 1935 raya) */
  const galpon = (px, py, largo, { fondo = 32, pisos = 1, o = LADRILLO } = {}) => {
    const T = L(px, py), h = pisos > 1 ? 12.6 : 8.2, n = Math.max(2, Math.round(largo / 24));
    T.caja(largo, h, fondo, 0, 0, 0, PINTADO, o); T.tejado(largo + 1, fondo + 1.4, fondo * 0.15, 0, h, 0, 'x'); T.caja(largo * 0.86, 1.5, 4.6, 0, h + fondo * 0.15 - 0.7, 0, PINTADO, CHAPA);
    for (const s of [-1, 1]) {
      T.caja(largo, 1.1, 3.2, 0, 0, s * (fondo / 2 + 1.6), PIEDRA, { tono: c.SILLAR }); T.fila(n, -largo / 2 + 3, largo / 2 - 3, 4.2, 4.4, 1.1, s * (fondo / 2 + 0.07), s < 0 ? '-z' : '+z', false);
      if (pisos > 1) T.fila(n * 2, -largo / 2 + 3, largo / 2 - 3, 2.2, 2.4, 8.3, s * (fondo / 2 + 0.07), s < 0 ? '-z' : '+z', false);
    }
  };
  /** una hilera de `n` galpones a lo largo de un muelle, `d` metros tierra adentro (o, con `x`, a esa altura del plano) */
  const hilera = (D, lado, d, y0, y1, n, o = {}) => { for (let i = 0; i < n; i++) { const y = y0 + ((i + 0.5) / n) * (y1 - y0), px = o.x ?? muelle(D, lado, y, d)[0]; galpon(px, y, ((y1 - y0) / n) * M - 14, { ...o, o: o.o ?? ((i + n) % 3 === 1 ? OCRE : LADRILLO) }); } };

  // --- los murallones: el coronamiento de granito de los cinco espejos y de la punta de cada espigón (los de la
  // Dársena E y el espigón 6, recién en 1940: en 1921 esa parte era todavía río) ---
  for (const [n, D] of Object.entries(DARSENAS)) {
    c.epoca(n === 'E' ? 6 : 5);
    const T = L((D.s[0][0] + D.n[1][0]) / 2, (D.s[0][1] + D.n[1][1]) / 2), pts = [D.s[1], D.s[0], ...(D.cab ? [D.cab] : []), D.n[0], D.n[1]].map(([x, y]) => T.deMundo(x, y));
    for (let i = 0; i + 1 < pts.length; i++) murallon(T, ...pts[i], ...pts[i + 1]);
  }
  [[[13490, 11520], [13640, 11520]], [[13847, 11524], [14146, 11517]], [[14348, 11323], [14648, 11318]], [[14849, 10844], [15199, 10508]], [[15417, 10152], [15489, 10153], [15676, 9924], [15984, 9550]], [[16200, 9195], [16542, 8875]]].forEach((tr, i) => {
    c.epoca(i === 5 ? 6 : 5);
    const T = L(...tr[0]), pts = tr.map(([x, y]) => T.deMundo(x, y)); for (let i = 0; i + 1 < pts.length; i++) murallon(T, ...pts[i], ...pts[i + 1]);
  });
  c.epoca(5);

  // --- la escollera: la exterior, de piedra suelta, que abriga el canal de las bocas (unos 260 m de agua entre ella y
  // las puntas de los espigones), y la del norte, que cubre la entrada a la Dársena E. Con su baliza en cada punta. ---
  const escollera = (pts, ancho = 9) => {
    for (let i = 0; i + 1 < pts.length; i++) {
      const T = L(...pts[i]), [x1, z1] = T.deMundo(...pts[i + 1]), l = Math.hypot(x1, z1), a = Math.atan2(z1, x1);
      T.put(new THREE.BoxGeometry(l + ancho * 0.6, 1.5, ancho).rotateY(-a).translate(x1 / 2, 0.75, z1 / 2), PIEDRA, { tono: c.SILLAR });
      T.put(new THREE.BoxGeometry(l + ancho * 0.3, 0.7, ancho * 0.36).rotateY(-a).translate(x1 / 2, 1.85, z1 / 2), PIEDRA, { tono: c.GRIS });
    }
  };
  const baliza = (px, py, o = ROJO) => { const T = L(px, py); T.cilindro(2.6, 2.4, 0, 0, 0, PIEDRA, 8, 2.2, { tono: c.SILLAR }); T.cilindro(0.55, 7, 0, 2.4, 0, PINTADO, 6, 0.4, o); T.cilindro(0.8, 1.1, 0, 9.4, 0, PINTADO, 6, 0.8, BLANCO); };
  escollera([[12846, 12026], [13494, 11958], [14479, 11835], [14907, 11808], [15954, 10501], [15971, 10426], [15944, 10353], [15890, 10307]]);
  escollera([[16593, 8818], [16618, 9090], [16285, 9492], [16148, 9514], [16126, 9728], [15845, 10102], [15703, 10106]], 7);
  baliza(12846, 12026); baliza(15890, 10307); baliza(15703, 10106, BLANCO);

  // ------------------------------------------------------------------------- el Hotel de Inmigrantes (1906-1911)
  // Sobre el muelle norte de la Dársena Norte, al oeste de los dos diques de carena. Junto al agua, el desembarcadero:
  // la nave larga y baja con su galería, donde atracaban los vapores y se revisaban los papeles y los baúles. Detrás,
  // perpendicular al muelle, el hotel: una mole de hormigón gris de planta baja y tres pisos (cuatro dormitorios por
  // piso, de 250 camas cada uno), con el frontis del reloj en el medio del frente oeste (foto de Obras Públicas, de
  // noviembre de 1910). Alrededor, los pabellones bajos —la dirección, la oficina de trabajo, el hospital, el depósito
  // de equipajes— y los jardines. (x a lo largo del muelle, hacia el río; el agua queda en +z.)
  {
    const H = c.lugar(12595, 10169, 0.4, 0.9165), GR = { tono: c.GRIS }, CR = { tono: c.CREMA };
    murallon(H, 3, 0, 186, 0);
    // el desembarcadero: dos naves a lo largo del muelle, el cuerpo de dos pisos en el medio y los pabellones de las puntas
    H.caja(126, 6.2, 17, 70, 0, -15.5, CASA, { floors: 1, ...CR }); H.tejado(127, 9.4, 2.2, 70, 6.2, -11.2, 'x'); H.tejado(127, 9.4, 2.2, 70, 6.2, -19.8, 'x');
    H.fila(17, 9, 131, 4.2, 4.6, 0, -6.94, '+z');
    H.caja(20, 10.4, 19, 70, 0, -15.5, CASA, { floors: 2, ...CR }); H.cuatroAguas(21, 20, 3, 70, 10.4, -15.5);
    for (const s of [-1, 1]) { H.caja(11, 8.6, 19, 70 + s * 63, 0, -15.5, CASA, { floors: 2, ...CR }); H.cuatroAguas(12, 20, 2.4, 70 + s * 63, 8.6, -15.5); }
    // el hotel
    const xh = 146, zh = -84, lh = 100, ah = 26, hh = 19.6;
    H.caja(ah, hh, lh, xh, 0, zh, CASA, { floors: 4, ...GR }); H.caja(ah + 1, 0.7, lh + 1, xh, hh, zh, PIEDRA, GR); H.caja(ah - 1.6, 1.1, lh - 1.6, xh, hh + 0.7, zh, PIEDRA, GR);
    for (const s of [-1, 1]) { H.caja(1.1, hh + 3.6, 13, xh + s * (ah / 2 + 0.3), 0, zh, PIEDRA, GR); H.caja(1.3, 2, 6, xh + s * (ah / 2 + 0.3), hh + 3.6, zh, PIEDRA, GR); for (const t of [-1, 1]) H.caja(1, hh + 1.4, 8, xh + s * (ah / 2 + 0.25), 0, zh + t * (lh / 2 - 4), PIEDRA, GR); }
    H.put(new THREE.CylinderGeometry(1.25, 1.25, 0.2, 12).rotateZ(Math.PI / 2).translate(xh - ah / 2 - 0.95, hh + 2.2, zh), PIEDRA, { tono: c.BLANCO }); // (el reloj)
    // los pabellones y los galpones de equipajes
    [[62, -46, 54, 12, 7.6, 2], [24, -78, 12, 44, 7.2, 2], [70, -84, 46, 13, 5.6, 1], [70, -112, 46, 15, 5.6, 1], [116, -40, 16, 14, 7.2, 2]].forEach(([x, z, w, d, h, f]) => { H.caja(w, h, d, x, 0, z, CASA, { floors: f, ...CR }); H.tejado(w + 0.8, d + 0.8, Math.min(w, d) * 0.2, x, h, z, w > d ? 'x' : 'z'); });
    for (let i = 0; i < 3; i++) { H.caja(38, 5.4, 15, 28 + i * 44, 0, -146, PINTADO, i === 1 ? MADERA : CHAPA); H.tejado(38.8, 15.8, 3, 28 + i * 44, 5.4, -146, 'x'); }
    // los jardines: el cantero largo frente al hotel y las hileras de árboles
    H.cantero(H.recto(14, 78, xh - 26, zh), { claro: 0.74 }); H.cantero(H.recto(40, 14, 70, -63), { claro: 0.74 });
    for (let i = 0; i < 9; i++) { H.arbol(xh - 36, zh - 40 + i * 10, 3.6); H.arbol(xh + 22, zh - 40 + i * 10, 3.8); if (i < 6) H.arbol(40 + i * 12, -30, 3.4); }
  }

  // ------------------------------------------------------------------------------- 1921: lo habilitado y la obra
  // Los galpones de los espigones 2 y 3, como los dibujan las dos cartas: tres hileras a lo largo, la del medio entre
  // las dos calles; los del muelle de la Dársena C, más largos y de dos plantas.
  c.epoca(5);
  hilera('A', 'n', 34, 11070, 11492, 2); hilera('B', 's', 34, 10862, 11496, 3); hilera('A', 'n', 0, 10866, 11494, 3, { x: 13993, o: CHAPA, fondo: 28 });
  hilera('B', 'n', 34, 10724, 11296, 3); hilera('C', 's', 38, 10452, 11160, 2, { pisos: 2, fondo: 36 }); hilera('B', 'n', 0, 10480, 11296, 4, { x: 14493, o: CHAPA, fondo: 28 });
  // los vapores de ultramar: en la A (el paquete de pasajeros, del lado sur), en la B y en el muelle sur de la C
  atraca('A', 's', 11240, { tipo: 'pasaje', L: 148, B: 17.5, alto: 8, chimenea: OCRE });
  atraca('B', 's', 10960, SURTIDO[1]); atraca('B', 's', 11190, SURTIDO[4]); atraca('B', 's', 11410, SURTIDO[3]);
  atraca('B', 'n', 10830, SURTIDO[2]); atraca('B', 'n', 11028, SURTIDO[5]);
  atraca('C', 's', 10700, SURTIDO[3]); atraca('C', 's', 11010, SURTIDO[0]);
  atraca('A', 'n', 11490, { tipo: 'chata', L: 30, B: 7.5, alto: 1.9 }, 1); atraca('C', 's', 10860, { tipo: 'chata', L: 28, B: 7, alto: 1.9, casco: P(PINTA.ROJO, 0.3) }, -1);
  barco(13745, 11330, 0.3, 1, { tipo: 'remolcador', L: 24, B: 6, alto: 2.3, chimenea: OCRE }); barco(14250, 11560, -0.5, 1, { tipo: 'remolcador', L: 24, B: 6, alto: 2.3, chimenea: ROJO });

  c.epoca(5, 6);
  // los espigones 4 y 5, de relleno fresco: la tierra refulada del fondo de las dársenas, todavía sin empedrar
  // (va como un paño sobre el suelo, del muelle norte de la C al muelle sur de la E, con unos 100 m de terraplén por
  // detrás de las cabeceras: el relleno se hizo primero por el borde, y adentro quedó años una laguna)
  { const T = L(15300, 9900); T.tapete([[14838, 10123], [14849, 10844], [15199, 10508], [15188, 9651], [15370, 9431], [15406, 9434], [15417, 10152], [15489, 10153], [15676, 9924], [15984, 9550], [15973, 8695], [15856, 8605], [15289, 9344], [15069, 9563], [14700, 9960], [14560, 10100], [14560, 10330], [14636, 10327], [14801, 10124]].map(([x, y]) => T.deMundo(x, y)), PINTA.BALASTO, { y: 0.1, claro: 0.84 }); }
  // dos cargueros en el muelle norte de la A y otro en el de la B (en 1940 ahí atracan los transatlánticos); en la rada
  // del antepuerto, un vapor esperando muelle
  atraca('A', 'n', 11130, SURTIDO[0]); atraca('A', 'n', 11370, SURTIDO[2]); atraca('B', 'n', 11230, SURTIDO[4]); barco(13080, 11420, 0.86, -0.5, SURTIDO[1]);
  { // la obra. En la Dársena D, a medio dragar, dos dragas de cangilones con sus chatas barreras; en el muelle norte
    // de la C y en el espigón 4, los montones de relleno, los martinetes hincando pilotes y la vía de las vagonetas.
    barco(15300, 9900, 0.1, 1, { tipo: 'draga', L: 50, B: 11, alto: 2.6, chimenea: NEGRO }); barco(15322, 9906, 0.1, 1, { tipo: 'chata', L: 34, B: 8, alto: 2, carga: RELLENO });
    barco(15290, 10330, -0.2, -1, { tipo: 'draga', L: 46, B: 10.5, alto: 2.6, chimenea: OCRE }); barco(15268, 10322, -0.2, -1, { tipo: 'chata', L: 32, B: 8, alto: 2, carga: RELLENO });
    barco(15330, 10120, 1, 0.6, { tipo: 'remolcador', L: 22, B: 5.6, alto: 2.2, chimenea: NEGRO }); barco(14740, 10560, 0.05, 1, { tipo: 'chata', L: 34, B: 8, alto: 2, carga: RELLENO }); barco(14760, 10880, 0.1, -1, { tipo: 'draga', L: 46, B: 10.5, alto: 2.6 });
    /** un martinete: la torre de madera con su tornapunta y la maza, sobre una plataforma */
    const martinete = (px, py, lado) => { const T = L(px, py); T.caja(5, 0.5, 5, 0, 0, 0, PINTADO, MADERA); for (const s of [-1, 1]) T.caja(0.3, 15, 0.3, s * 0.8, 0.5, lado * 2, PINTADO, MADERA); T.caja(1.9, 0.3, 0.3, 0, 15.5, lado * 2, PINTADO, MADERA); T.caja(1, 1.6, 0.8, 0, 9, lado * 2, TINTA); pluma(T, 0, 0.5, -lado * 2, 15.6, lado * 0.26, 'z', 0.3); T.caja(2.2, 2, 2.2, 0, 0.5, -lado * 1.2, PINTADO, CHAPA); };
    martinete(...muelle('C', 'n', 10330, 1.5), 1); martinete(...muelle('C', 'n', 10640, 1.5), 1); martinete(...muelle('D', 's', 10060, 1.5), -1); martinete(...muelle('D', 'n', 9700, 1.5), 1); martinete(...muelle('D', 'n', 9990, 1.5), 1);
    // los pilotes ya hincados, en fila, donde va a ir el coronamiento
    for (const [D, lado, y0, y1] of [['C', 'n', 10360, 10600], ['D', 'n', 9730, 9950]]) { const T = L(...muelle(D, lado, (y0 + y1) / 2, -2.2)), l = (y1 - y0) * M; for (let i = 0; i < 14; i++) T.caja(0.45, 2.2 + (i % 3) * 0.5, 0.45, -l / 2 + (i / 13) * l, 0, 0, PINTADO, MADERA); }
    // el relleno: montones de tierra y de piedra partida, y la vía angosta con sus vagonetas
    [[15010, 10200, 44, 26, 8], [14960, 10460, 36, 24, 7], [15090, 9960, 50, 28, 9], [15060, 10560, 30, 20, 6], [15560, 9700, 56, 30, 9.5], [15640, 9450, 42, 26, 7.5], [15520, 9980, 38, 24, 7], [15790, 9300, 48, 28, 8.5], [15700, 9060, 40, 24, 7]].forEach(([x, y, w, d, h], i) => cuatro(L(x, y), w, d, h, 0, 0, 0, i % 3 === 1 ? P(PINTA.ADOQUIN, 0.7) : RELLENO));
    { const T = L(15020, 10130); T.caja(300, 0.16, 1.4, 0, 0, 0, TINTA); for (let i = 0; i < 7; i++) T.caja(2.6, 1.4, 1.5, -40 + i * 3.4, 0.16, 0, PINTADO, i ? MADERA : NEGRO); T.cilindro(0.3, 1.8, -42.4, 1.5, 0, TINTA, 5); }
    // los bloques de hormigón del murallón, apilados a la espera, y dos grúas de vapor de las de la obra
    for (const [x, y, n] of [[15130, 10250, 7], [15120, 9860, 5], [15470, 9620, 8], [15460, 9900, 6]]) { const T = L(x, y); for (let i = 0; i < n; i++) for (let k = 0; k < 2; k++) T.caja(4.4, 2.2 + ((i + k) % 2) * 2.2, 2.6, -n * 2.6 + i * 5.2, 0, k * 3.4, PIEDRA, { tono: c.GRIS }); }
    for (const [x, y, lado] of [[15168, 10180, -1], [15436, 9790, 1]]) { const T = L(x, y); T.caja(4.6, 1, 4.6, 0, 0, 0, TINTA); T.caja(3.4, 3, 3.6, 0, 1, -lado * 0.4, PINTADO, MADERA); T.cilindro(0.4, 3.4, 0, 4, -lado * 1.4, TINTA, 5); pluma(T, 0, 2.6, lado * 1.6, 17, lado * 0.7, 'z', 0.34); }
    for (const [x, y] of [[14990, 10330], [15600, 9860]]) { const T = L(x, y); T.caja(16, 3.6, 7, 0, 0, 0, PINTADO, MADERA); T.tejado(16.6, 7.6, 1.6, 0, 3.6, 0, 'x'); } // (las casillas de la empresa)
  }

  // ------------------------------------------------------------------------------- 1940: el puerto terminado
  c.epoca(6);
  // los galpones de los espigones 1 y 4 (la carta de 1925 los trae en proyecto; el plano de Peuser de 1936, hechos)
  hilera('A', 's', 34, 11050, 11490, 2); hilera('C', 'n', 34, 10210, 10790, 2); hilera('D', 's', 34, 9760, 10440, 3, { o: OCRE });
  // las grúas eléctricas, por el borde de cada muelle
  gruas('A', 's', 11040, 11500, 3); gruas('A', 'n', 11040, 11500, 4); gruas('B', 's', 10880, 11500, 5); gruas('B', 'n', 10740, 11300, 5);
  gruas('C', 's', 10420, 11290, 7); gruas('C', 'n', 10200, 10800, 5); gruas('D', 's', 9740, 10460, 5); gruas('E', 's', 8900, 9500, 4);
  // los barcos: el transatlántico de tres chimeneas en la A (la dársena de pasajeros), cargueros en todas y los
  // carboneros de Cardiff al pie de las usinas
  atraca('A', 'n', 11262, { tipo: 'pasaje', L: 196, B: 24, alto: 10.5, chimenea: P(PINTA.BLANCO, 0.92), chimeneas: [-0.13, -0.02, 0.09], puentes: true }, 1);
  atraca('B', 'n', 11224, { tipo: 'pasaje', L: 130, B: 16.5, alto: 7.6, chimenea: ROJO });
  atraca('C', 's', 11215, SURTIDO[5]); atraca('C', 's', 10460, SURTIDO[2]); atraca('C', 'n', 10300, SURTIDO[1]); atraca('C', 'n', 10520, SURTIDO[4]); atraca('C', 'n', 10740, SURTIDO[2]);
  atraca('D', 's', 9840, SURTIDO[0]); atraca('D', 's', 10090, SURTIDO[3]); atraca('D', 's', 10350, SURTIDO[5]); atraca('D', 'n', 9700, SURTIDO[2]); atraca('D', 'n', 9980, { ...CARBONERO, L: 90 });
  atraca('E', 's', 9050, CARBONERO); atraca('E', 's', 9330, { ...CARBONERO, L: 106, chimenea: OCRE }); atraca('E', 'n', 8790, { ...CARBONERO, L: 92 }); atraca('E', 'n', 9050, SURTIDO[4]);
  barco(15790, 9818, 0.633, -0.774, { ...CARBONERO, L: 102, chimenea: ROJO }); // (en el muelle en chanfle del espigón 5)
  atraca('C', 'n', 10160, { tipo: 'chata', L: 30, B: 7.5, alto: 1.9, carga: CARBON }, 1); atraca('E', 's', 9190, { tipo: 'chata', L: 30, B: 7.5, alto: 1.9, carga: CARBON }, -1);
  barco(15300, 10020, 0.2, 1, { tipo: 'remolcador', L: 24, B: 6, alto: 2.3, chimenea: ROJO }); barco(16090, 9020, -0.1, 1, { tipo: 'remolcador', L: 22, B: 5.6, alto: 2.2, chimenea: NEGRO });
  // un paquete entrando por el antepuerto, a remolque, rumbo a la Dársena A
  barco(13120, 11520, 0.86, 0.5, { tipo: 'pasaje', L: 158, B: 19, alto: 8.6, chimenea: OCRE }); barco(13260, 11590, 0.86, 0.5, { tipo: 'remolcador', L: 24, B: 6, alto: 2.3, chimenea: OCRE }); barco(13040, 11440, 0.9, 0.3, { tipo: 'remolcador', L: 24, B: 6, alto: 2.3, chimenea: NEGRO });

  { // la súper usina de la CHADE, en el espigón 5 (Collivadino la pintó en obra hacia 1928; Wikipedia la da inaugurada
    // en 1927 en un artículo y en 1932 en otro: para la etapa de 1940 da igual). El
    // frente, de más de 190 m, mira a la ciudad: el cuerpo del medio con su arco, entre dos torres rematadas en un
    // templete con cúpula; a cada lado, las alas de ventanales de medio punto. Atrás, la sala de máquinas y, más alta,
    // la de calderas con sus chimeneas cortas de chapa. (El origen, al pie del arco; x a lo largo del frente, hacia el
    // noroeste; el frente mira a −z.)
    const U = c.lugar(15707, 9108, 0.626, -0.78), ST = { tono: c.SILLAR }, CR = { tono: c.CREMA };
    const ala = (x0, x1) => {
      const w = x1 - x0, m = (x0 + x1) / 2, n = Math.round(w / 6.6);
      U.caja(w, 19, 22, m, 0, 11, PIEDRA, ST); U.caja(w + 0.8, 0.7, 22.8, m, 19, 11, PIEDRA, CR); U.caja(w - 1.4, 2, 20.6, m, 19.7, 11, PIEDRA, ST);
      U.fila(n, x0 + 1.5, x1 - 1.5, 2.8, 4.4, 0.6, -0.07, '-z'); U.fila(n, x0 + 1.5, x1 - 1.5, 3.4, 9.8, 6.6, -0.07, '-z');
      U.caja(7, 22.4, 1.2, x0 + (x0 < 0 ? 3.5 : w - 3.5), 0, -0.3, PIEDRA, ST); // (el pabellón de la punta)
    };
    ala(-86, -26); ala(26, 111);
    U.caja(30, 33, 26, 0, 0, 13, PIEDRA, ST); U.caja(31, 0.8, 27, 0, 33, 13, PIEDRA, CR); U.caja(24, 3, 22, 0, 33.8, 13, PIEDRA, ST);
    U.vano(13, 15.5, 0, 9.5, -0.07, '-z'); U.fila(3, -9.5, 9.5, 3.4, 6.4, 0, -0.07, '-z'); for (const s of [-1, 1]) U.caja(1.8, 31, 1.3, s * 9.6, 0, -0.5, PIEDRA, ST);
    for (const s of [-1, 1]) {
      const x = s * 20.5, z = 4.5;
      U.caja(11, 36, 11, x, 0, z, PIEDRA, ST); U.caja(12.4, 0.9, 12.4, x, 36, z, PIEDRA, CR);
      for (const [y, h] of [[1, 5], [10, 5.6], [20, 5.6], [29, 4.6]]) U.vano(2.6, h, x, y, z - 5.57, '-z');
      U.caja(8.6, 8, 8.6, x, 36.9, z, PIEDRA, ST); U.vano(2.8, 5.4, x, 38, z - 4.37, '-z'); U.caja(9.6, 0.6, 9.6, x, 44.9, z, PIEDRA, CR);
      // el templete: el tambor abierto entre columnas, el anillo y la cúpula
      U.cilindro(2.1, 7.4, x, 45.5, z, TINTA, 8); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.39; U.cilindro(0.46, 7.4, x + Math.cos(a) * 3.3, 45.5, z + Math.sin(a) * 3.3, PIEDRA, 5, 0.4, ST); }
      U.cilindro(4, 0.8, x, 52.9, z, PIEDRA, 10, 4, CR); U.cupula(3.5, x, 53.7, z, 0.85); U.cilindro(0.16, 3, x, 56.6, z, TINTA, 4);
    }
    // la sala de máquinas y la de calderas
    U.caja(197, 25, 30, 12.5, 0, 37, PIEDRA, ST); U.tejado(197, 31, 5, 12.5, 25, 37, 'x'); U.fila(24, -84, 109, 3, 8, 14, 52.07, '+z');
    U.caja(150, 35, 40, -5, 0, 72, PIEDRA, { tono: c.GRIS }); U.caja(151, 0.8, 41, -5, 35, 72, PIEDRA, { tono: c.GRIS }); U.fila(18, -78, 68, 3.2, 12, 16, 92.07, '+z');
    for (let i = 0; i < 6; i++) U.cilindro(2.3, 15, -67 + i * 24.8, 35.8, 72, PINTADO, 8, 1.9, NEGRO);
    for (const s of [-1, 1]) for (let k = 0; k < 2; k++) U.cilindro(7, 9, 140 + k * 19, 0, 22 + s * 12, PINTADO, 12, 7, CHAPA); // (los tanques, hacia la cabecera de la E)
  }
  { // la playa de carbón de la usina, hacia la punta del espigón: los montones, el puente grúa que los reparte y la
    // casilla del maquinista. (Lo que la carta de 1935 dibuja como un segundo recinto; el detalle es supuesto.)
    const T = L(15712, 9690);
    for (let i = 0; i < 4; i++) cuatro(T, 64, 34, 7 + (i % 2) * 2, -108 + i * 70, 0, 4, CARBON);
    for (const x of [-60, 60]) { for (const s of [-1, 1]) { T.caja(1.2, 16, 1.2, x - 4, 0, s * 32, TINTA); T.caja(1.2, 16, 1.2, x + 4, 0, s * 32, TINTA); } }
    for (const x of [-60, 60]) { T.caja(9.6, 2.2, 76, x, 16, 0, TINTA); T.caja(5, 3, 5, x, 12.6, 14, PINTADO, CHAPA); }
  }
  { // la súper usina de la Ítalo (CIAE), «Nuevo Puerto», en el espigón 6, al norte de la Dársena E: inaugurada en 1932.
    // De ladrillo a la vista, como las demás de la compañía: la nave de máquinas, la de calderas y dos chimeneas.
    // (1933, según otro artículo. El lugar es el que dice Wikipedia y el que marca el plano de Peuser; la forma es supuesta.)
    const T = L(16330, 8890), LD = { tono: c.LADRILLO };
    T.caja(112, 21, 24, 0, 0, 14, CASA, { floors: 3, ...LD }); T.caja(113, 0.7, 25, 0, 21, 14, PIEDRA, { tono: c.CREMA }); T.tejado(112, 24, 4, 0, 21.7, 14, 'x');
    T.caja(96, 29, 26, -4, 0, -11, CASA, { floors: 4, ...LD }); T.caja(97, 0.7, 27, -4, 29, -11, PIEDRA, { tono: c.CREMA });
    T.caja(14, 34, 12, 49, 0, 14, CASA, { floors: 5, ...LD }); T.piramide(9.4, 5, 49, 34, 14);
    for (const x of [-34, 22]) { T.cilindro(3.1, 58, x, 0, -11, PIEDRA, 10, 1.9, LD); T.cilindro(2.2, 1.2, x, 58, -11, TINTA, 10, 2.2); }
    for (let i = 0; i < 3; i++) cuatro(T, 34, 22, 6, -30 + i * 38, 0, 52, CARBON);
  }
  // --- lo que faltaba en los espigones del norte (va al final, para no correrle la tirada a lo de arriba): la hilera
  // del medio del espigón 4, de chapa, como las de los espigones 2 y 3; los depósitos del muelle norte de la Dársena D
  // (el espigón 5, de la cabecera a la playa de carbón de la usina) y las grúas de ese muelle y del muelle norte de la
  // E. El plano de Peuser raya esos muelles como los demás; cuántos galpones y de qué largo, supuesto. ---
  c.epoca(6);
  hilera('D', 's', 0, 10180, 10650, 3, { x: 15013, o: CHAPA, fondo: 28 }); hilera('D', 'n', 34, 9560, 10100, 2);
  gruas('D', 'n', 9540, 10110, 4); gruas('E', 'n', 8560, 9150, 3);
  c.epoca(0);
}
