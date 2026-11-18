// La Plaza del Congreso: las tres manzanas que se demolieron frente al palacio para el Centenario (ley 6286, de 1908) y la
// vieja Plaza Lorea, que quedó en la punta del este partida en dos por la Avenida de Mayo. La proyectó Carlos Thays y se
// inauguró en enero de 1910. Acá está como se la ve en las fotos:
//   - 1910 (etapa 4): la explanada, la pileta frente al Congreso, el parterre con «El Perdón», los canteros de los
//     costados con los árboles recién trasplantados, el estanque lobulado con sus palmeras, El Pensador (1907) y Moreno
//     (1910). De la vista nocturna del Centenario («Celebración nocturna del Centenario en la Plaza del Congreso», 1910),
//     de la foto del Archivo General de la Nación con el estanque y La Inmobiliaria (AGN, caja 45, inv. 218770, 1910),
//     de la del carro de Thays («Buenos Aires - Construcción de la Plaza del Congreso», c. 1910) y de la de la Library
//     of Congress («Plaza del Congreso, Buenos Aires», LCCN 2016821472, National Photo Company, hacia 1911).
//   - 1921 (etapa 5): el Monumento de los Dos Congresos (Lagae y D'Huicque, 9 de julio de 1914) con su fuente
//     escalonada, donde estaba la pileta. De las dos vistas de Bourquin y Kohlmann («Buenos Aires – Monumento a los Dos
//     Congresos», n.º 5587, y «Plaza del Congreso desde el Palacio Barolo», n.º 5697, c. 1925) y de la de Plus Ultra de
//     octubre de 1916, sacada desde la terraza del monumento.
//   - 1940 (etapa 6): los canteros de césped con su vereda alrededor, la arboleda crecida («Plaza congreso 1920», que
//     por los edificios es de los años treinta) y el monolito del Kilómetro Cero (1935) en su primer lugar, la punta de
//     la Plaza Lorea.
// Dónde va cada cosa sale del mapa de hoy para lo que sigue en su sitio (el monumento y su fuente, el cuadro del
// parterre, el estanque, Moreno) y de medir las fotos contra eso para lo demás. Todo en metros: x hacia el norte
// (Rivadavia), z hacia el este (la Avenida de Mayo), desde el cruce del eje de la plaza con Entre Ríos.
export default function (c) {
  const { THREE, PINTA, PIEDRA, TINTA, FOLLAJE, PINTADO, BLANCO, GRIS } = c;
  const UX = 1, UY = -0.0025; // (el eje del Congreso y de la avenida: casi derecho con el papel)
  const T = c.lugar(10329, 6918, UX, UY);
  /** las herramientas con el origen en un punto de la plaza: lo que se levanta del suelo se apoya en el terreno de ahí */
  const en = (x, z) => c.lugar(...T.aPlano(x, z), UX, UY);
  const BRONCE = { pinta: [PINTA.PATINA, 0.3] } /* (el bronce de las estatuas, ya con su pátina oscura) */, MARMOL = { pinta: [PINTA.BLANCO, 0.97] }, NANCY = { tono: BLANCO }, GRANITO = { tono: GRIS };
  const K = 46.5; // del eje al cordón de la plaza (de cordón a cordón, los 93 m de hoy)
  const CESPED = { alto: 0.5 }, AGUA = { alto: 0.75, tono: PINTA.AGUA, cordon: 0.55, claro: 0.58 };

  // ------------------------------------------------------------------------------------------------ las piezas
  const bola = (L, r, x, y, z, o = BRONCE, sy = 1) => L.put(new THREE.SphereGeometry(r, 6, 4).scale(1, sy, 1).translate(x, y, z), PINTADO, { H: y + r, ...o });
  /** una figura de alto h parada en (x, y, z): el cuerpo y la cabeza, nada más (de lejos es lo que se ve) */
  const figura = (L, x, y, z, h, o = BRONCE) => { L.cilindro(h * 0.2, h * 0.8, x, y, z, PINTADO, 6, h * 0.09, o); bola(L, h * 0.105, x, y + h * 0.9, z, o); };
  /** un murete (o una barra) de (x0, z0) a (x1, z1) */
  const muro = (L, x0, z0, x1, z1, y, h, t = 0.35, o = NANCY, kind = PIEDRA) => {
    const largo = Math.hypot(x1 - x0, z1 - z0);
    L.put(new THREE.BoxGeometry(largo, h, t).translate(0, h / 2, 0).rotateY(-Math.atan2(z1 - z0, x1 - x0)).translate((x0 + x1) / 2, y, (z0 + z1) / 2), kind, { H: y + h, ...o });
  };
  const globo = (L, x, y, z, r) => L.put(new THREE.SphereGeometry(r, 5, 3).translate(x, y, z), PINTADO, { pinta: [PINTA.BLANCO, 1], H: y });
  /** un farol de columna de hierro con su globo; con brazos, un candelabro de varios globos (los del monumento y la Lorea) */
  const farol = (x, z, alto = 5.4, brazos = 0, y = 0, L = en(x, z), lx = 0, lz = 0) => {
    L.cilindro(0.15, alto, lx, y, lz, TINTA, 5, 0.06); globo(L, lx, y + alto + 0.28, lz, 0.34);
    for (let i = 0; i < brazos; i++) { const a = (i / brazos) * Math.PI * 2 + Math.PI / 4, dx = Math.cos(a) * 0.8, dz = Math.sin(a) * 0.8; muro(L, lx, lz, lx + dx, lz + dz, y + alto - 1, 0.09, 0.09, null, TINTA); globo(L, lx + dx, y + alto - 0.62, lz + dz, 0.26); }
  };
  /** una palmera (las fénix que Thays puso alrededor del estanque y en la Lorea) */
  const palmera = (x, z, h = 6.2) => {
    const L = en(x, z);
    L.cilindro(0.3, h, 0, 0, 0, PINTADO, 5, 0.2, { pinta: [PINTA.MADERA, 0.42] });
    // (la copa: un paraguas chato de hojas que caen, con el penacho arriba)
    L.put(new THREE.SphereGeometry(3.4, 8, 4).scale(1, 0.36, 1).translate(0, h + 0.35, 0), FOLLAJE, { H: h + 1.6 }); L.put(new THREE.ConeGeometry(1.5, 1.5, 6).translate(0, h + 1.6, 0), FOLLAJE, { H: h + 2.4 });
  };
  /** una estatua sobre su pedestal, en medio de un macizo de flores */
  const estatua = (x, z, ped = 2.2, h = 2.2, o = BRONCE) => {
    const L = en(x, z);
    L.caja(1.9, 0.35, 1.9, 0, 0.5, 0, PIEDRA, GRANITO); L.caja(1.35, ped, 1.35, 0, 0.85, 0, PIEDRA, NANCY); L.caja(1.6, 0.25, 1.6, 0, 0.85 + ped, 0, PIEDRA, NANCY);
    figura(L, 0, 1.1 + ped, 0, h, o);
  };
  const flores = (pts) => T.tapete(pts, PINTA.FLORES, { y: 0.8, claro: 0.6 });
  /** un contorno de lóbulos (el del estanque y los de sus canteros) */
  const lobulado = (x, z, R, k = 0.14, n = 44) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2, r = R * (1 - k + k * Math.abs(Math.cos(2 * a))); return [x + Math.cos(a) * r, z + Math.sin(a) * r]; });
  /** una «D»: derecha del lado del monumento (z0) y redonda hacia el este, desde z1 */
  const de = (medio, z0, z1, rz, n = 16) => [[-medio, z0], [medio, z0], ...Array.from({ length: n + 1 }, (_, i) => { const a = (i / n) * Math.PI; return [Math.cos(a) * medio, z1 + Math.sin(a) * rz]; })];
  /** el mismo árbol en las tres épocas, cada vez más grande */
  const crece = (x, z, r4, r5, r6) => { c.epoca(4, 5); T.arbol(x, z, r4); c.epoca(5, 6); T.arbol(x, z, r5); c.epoca(6); T.arbol(x, z, r6); };

  // --------------------------------------------------------------------------------------- las calzadas y veredas
  // Las fotos muestran la plaza como una isla entre dos avenidas anchas: Rivadavia y Victoria (Yrigoyen) se
  // ensancharon sobre las manzanas demolidas. En el suelo quedan pintadas las calles angostas de 1867, así que la
  // calzada va de cordón a cordón por debajo de todo: adoquín en 1910, liso después (como el resto de las avenidas).
  const calzada = T.recto(126.8, 449, 0, 211.5); // (de la reja del Congreso a la calle que cierra la Lorea por el este)
  c.epoca(4, 5); T.tapete(calzada, PINTA.ADOQUIN, { y: 0.06, claro: 0.88 });
  c.epoca(5); T.tapete(calzada, PINTA.ASFALTO, { y: 0.06, claro: 0.82 });
  c.epoca(4);
  // las veredas de enfrente, con su hilera de árboles (en todas las fotos, de las dos avenidas)
  for (const s of [-1, 1]) for (const [z0, z1] of [[8, 119], [138, s < 0 ? 235 : 244], [264, 384], [401, 417]]) {
    // (del lado de Rivadavia, hasta Solís, las casas quedaron más atrás: ahí la vereda es más ancha)
    const ancha = s > 0 && z1 < 125;
    T.cantero(T.recto(ancha ? 8.6 : 5.4, z1 - z0, s * (ancha ? 67.7 : 66.1), (z0 + z1) / 2, 1.2), { alto: 0.2, tono: PINTA.BALDOSA, cordon: 0.3, claro: 0.95 });
    for (let z = z0 + 4.5; z < z1 - 2; z += 10.5) T.arbol(s * 65.6, z, 2.7);
  }
  // la explanada, de baldosa clara: la plaza grande (de Entre Ríos a Virrey Cevallos), la del medio y las dos mitades de
  // la Lorea, estas con senderos de granza. Virrey Cevallos y la calle del borde de la Lorea cruzan entre una y otra.
  const SOLADO = { alto: 0.22, tono: PINTA.BALDOSA, cordon: 0.4, claro: 0.96 };
  T.cantero(T.recto(2 * K, 227, 0, 129.5, 12), SOLADO);
  T.cantero(T.recto(2 * K, 72, 0, 306, 12), SOLADO);
  for (const s of [-1, 1]) T.cantero(T.recto(34.5, 60, s * 29.25, 388, 9), { ...SOLADO, tono: PINTA.GRANZA, claro: 0.9 });

  // -------------------------------------------------------------------------------------------- frente al Congreso
  { // 1910: «una gran plaza cívica con una pileta central y canteros a los lados». La vista nocturna del Centenario la
    // muestra iluminada, ovalada, donde cuatro años después se levantó el monumento.
    c.epoca(4, 5);
    T.cantero(T.ovalo(0, 106, 21, 16, 32), CESPED); T.cantero(T.ovalo(0, 106, 15, 11, 28), AGUA);
    const L = en(0, 106);
    L.cilindro(1.1, 1.7, 0, 0.6, 0, PIEDRA, 8, 0.7, NANCY); L.cilindro(0.8, 0.5, 0, 2.3, 0, PIEDRA, 10, 2.3, NANCY);
  }
  { // 1921: el Monumento de los Dos Congresos, de piedra de Nancy y bronces. En la foto de Bourquin y Kohlmann (n.º
    // 5587), de este a oeste: el estanque bajo, redondeado hacia la avenida; cuatro escalones más arriba el estanque
    // alto, con los caballos; el paredón de la terraza con su balaustrada, que avanza en curva; los dos pilones de las
    // puntas; y en el medio el pilar con los dos grupos sentados (la Asamblea de 1813 y el Congreso de 1816) y arriba la
    // República con el laurel en alto.
    c.epoca(5);
    // (los canteros de borde curvo que abrazan el estanque bajo, y los dos estanques)
    T.cantero(de(27, 121, 130, 18.5), CESPED);
    T.cantero(de(17, 122, 129, 10), AGUA);
    T.cantero(T.recto(23, 17.5, 0, 113.25), { ...AGUA, alto: 1.5, cordon: 0.6 });
    const M = en(0, 89), ht = 4.4; // (la terraza: 34 m de ancho a 4,4 m del suelo)
    M.prisma([[-17, -11], [17, -11], [17, 11], ...Array.from({ length: 11 }, (_, i) => { const a = (i / 10) * Math.PI; return [Math.cos(a) * 10.5, 11 + Math.sin(a) * 4.5]; }), [-17, 11]], ht, 0, PIEDRA, NANCY);
    // la escalinata del lado del Congreso y las dos de los costados
    for (let i = 0; i < 7; i++) M.caja(15, (ht * (7 - i)) / 8, 1.3, 0, 0, -11.65 - 1.3 * i, PIEDRA, NANCY);
    for (const s of [-1, 1]) {
      M.caja(1.3, 2.6, 9.4, s * 8.15, 0, -15.7, PIEDRA, NANCY);
      for (let i = 0; i < 5; i++) M.caja(1.5, (ht * (5 - i)) / 6, 8, s * (17.75 + 1.5 * i), 0, -2, PIEDRA, NANCY);
      // la balaustrada
      muro(M, s * 8.8, -11, s * 17, -11, ht, 0.95); muro(M, s * 17, -11, s * 17, -6, ht, 0.95); muro(M, s * 17, 2, s * 17, 11, ht, 0.95); muro(M, s * 10.5, 11, s * 17, 11, ht, 0.95);
      for (let i = 0; i < 5; i++) { const a = (i / 10) * Math.PI, b = ((i + 1) / 10) * Math.PI; muro(M, s * Math.cos(a) * 10.5, 11 + Math.sin(a) * 4.5, s * Math.cos(b) * 10.5, 11 + Math.sin(b) * 4.5, ht, 0.95); }
      // los cóndores, donde la curva se junta con el paredón, y los candelabros
      M.caja(1.3, 1.5, 1.3, s * 10.5, ht, 11, PIEDRA, NANCY); bola(M, 0.5, s * 10.5, ht + 2, 11, BRONCE, 0.9);
      for (const w of [-1, 1]) M.put(new THREE.BoxGeometry(1.7, 0.12, 0.75).translate(0.85, 0, 0).rotateZ(0.3).rotateY(w < 0 ? Math.PI : 0).translate(s * 10.5, ht + 2.1, 11), PINTADO, { H: ht + 2.6, ...BRONCE });
      farol(0, 0, 3.6, 4, ht, M, s * 14.2, 9.6); farol(0, 0, 3.6, 4, ht, M, s * 15.4, -9.4);
      // el pilón de la punta, con su remate, y la ronda de niños al pie
      const xp = s * 18.5, zp = 12.6;
      M.caja(2.3, 6.8, 2.3, xp, 0, zp, PIEDRA, NANCY); M.caja(2.9, 0.45, 2.9, xp, 6.8, zp, PIEDRA, NANCY); M.cilindro(0.7, 1.7, xp, 7.25, zp, PIEDRA, 8, 1.05, NANCY); M.cilindro(1.05, 0.5, xp, 8.95, zp, PIEDRA, 8, 0.5, NANCY); M.cilindro(0.3, 1, xp, 9.45, zp, PIEDRA, 6, 0.12, NANCY);
      M.caja(1.7, 1.5, 1.5, xp, 0, zp + 2.2, PIEDRA, NANCY); for (const d of [-0.45, 0.45]) figura(M, xp + d, 1.5, zp + 2.2, 1.25);
      // los dos ríos (el Uruguay y el Paraná), a los lados del estanque alto, y los niños de la escalera del agua
      M.caja(2.8, 2, 1.7, s * 14.2, 0, 18.5, PIEDRA, NANCY); M.caja(2.1, 0.7, 0.9, s * 14.2, 2, 18.5, PINTADO, BRONCE); figura(M, s * 13.4, 2.4, 18.5, 1.5);
      M.caja(1.5, 1.4, 1.5, s * 13, 0, 34.2, PIEDRA, NANCY); for (const d of [-0.4, 0.4]) figura(M, s * 13 + d, 1.4, 34.2, 1.2);
      // los grupos del pilar: la Asamblea del año XIII y el Congreso de Tucumán
      M.caja(2.6, 2.1, 3.6, s * 5.6, ht, 0, PIEDRA, NANCY); M.caja(1.5, 1.1, 2.4, s * 5.7, ht + 2.1, 0, PINTADO, BRONCE); figura(M, s * 5.6, ht + 2.9, -0.4, 3.4); figura(M, s * 6.2, ht + 2.5, 1, 2.6);
    }
    // los escalones del agua, del estanque alto al bajo
    M.caja(23, 1.25, 0.9, 0, 0, 33.3, PIEDRA, NANCY); M.caja(23, 1, 0.9, 0, 0, 34.1, PIEDRA, NANCY);
    // los caballos que salen del agua, con la figura del medio
    const caballo = (x, z, rumbo) => {
      for (const g of [new THREE.BoxGeometry(2.5, 1.05, 0.85).rotateZ(0.75).translate(0, 1.1, 0), new THREE.BoxGeometry(1.3, 0.55, 0.45).rotateZ(1.25).translate(1.05, 2.5, 0), new THREE.BoxGeometry(0.85, 0.4, 0.36).rotateZ(-0.6).translate(1.5, 3.15, 0), new THREE.BoxGeometry(1.1, 0.22, 0.55).rotateZ(0.1).translate(1.45, 1.75, 0)]) M.put(g.rotateY(rumbo).translate(x, 1.3, z), PINTADO, { H: 5, ...BRONCE });
    };
    M.cilindro(2.7, 1.1, 0, 1.5, 22, PINTADO, 8, 1.7, BRONCE); figura(M, 0, 2.6, 21.6, 3.2);
    caballo(-2.4, 23.6, Math.PI + 0.9); caballo(2.4, 23.6, -0.9); caballo(-5, 22, Math.PI + 0.25); caballo(5, 22, -0.25);
    // el pilar: el basamento redondo, el fuste con el escudo y la cornisa
    M.cilindro(6, 0.5, 0, ht, 0, PIEDRA, 16, 5.7, NANCY); M.cilindro(4.7, 2.6, 0, ht + 0.5, 0, PIEDRA, 16, 4.2, NANCY);
    M.caja(4.5, 1, 4.5, 0, ht + 3.1, 0, PIEDRA, NANCY);
    const y0 = ht + 4.1, hf = 9.2;
    M.put(new THREE.CylinderGeometry(2.2, 2.62, hf, 4).rotateY(Math.PI / 4).translate(0, y0 + hf / 2, 0), PINTADO, { H: y0 + hf, ...MARMOL });
    M.caja(1.5, 2, 0.3, 0, y0 + 5.6, 1.72, PINTADO, MARMOL);
    M.caja(4.3, 0.6, 4.3, 0, y0 + hf, 0, PINTADO, MARMOL); M.caja(2.9, 0.9, 2.9, 0, y0 + hf + 0.6, 0, PINTADO, MARMOL);
    // la República: el laurel en la derecha, en alto, y la izquierda en la mancera del arado; a sus pies, el Trabajo
    const yr = y0 + hf + 1.5;
    M.cilindro(1.5, 1, 0, yr, 0, PINTADO, 8, 1.15, BRONCE); M.cilindro(1.1, 4.1, 0, yr + 1, 0, PINTADO, 8, 0.55, BRONCE); bola(M, 0.55, 0, yr + 5.6, 0);
    M.put(new THREE.BoxGeometry(0.34, 2.6, 0.34).translate(0, 1.3, 0).rotateZ(0.42).translate(-0.55, yr + 4.6, 0), PINTADO, { H: yr + 7.4, ...BRONCE }); bola(M, 0.45, -1.65, yr + 7.2, 0, BRONCE, 1.6);
    bola(M, 0.95, -1.25, yr + 1.7, 0.5, BRONCE, 0.95); M.caja(0.35, 1.5, 1.7, 1.2, yr + 1, 0.2, PINTADO, BRONCE);
  }

  // ------------------------------------------------------------------------------------ el parterre y los costados
  c.epoca(4);
  { // el cuadro del medio, de 33 × 61 m (sigue siendo un rectángulo de césped): en la vista de Bourquin, dos guardas de
    // flores a lo largo, el dibujo del centro y, en el medio, «El Perdón», el mármol de Boverie (1896), que estuvo ahí
    // hasta 1991.
    T.cantero(T.recto(33, 61, 0, 193.5), CESPED);
    for (const s of [-1, 1]) flores(T.recto(1.5, 50, s * 12.8, 193.5, 0.7));
    flores(T.ovalo(0, 193.5, 3.4, 8, 18));
    const L = en(0, 193.5);
    L.caja(2.4, 0.4, 1.9, 0, 0.5, 0, PIEDRA, GRANITO); L.caja(1.9, 1.5, 1.5, 0, 0.9, 0, PINTADO, MARMOL); figura(L, 0.25, 2.4, 0, 2, MARMOL); figura(L, -0.4, 2.4, 0.15, 1.4, MARMOL);
  }
  // Los canteros largos de los costados, de punta redonda (en la vista nocturna de 1910 se los ve bordeados de luces).
  // Ahí puso Thays los árboles grandes que trajo en carro, ya crecidos: en 1925 son un monte tupido a cada lado.
  c.epoca(4, 6); for (const s of [-1, 1]) T.cantero(T.recto(20.5, 78, s * 34.25, 173, 9), CESPED);
  // (en los años treinta el césped llega hasta la punta de la plaza y sube por los costados del monumento, con la
  // vereda alrededor)
  c.epoca(6); for (const s of [-1, 1]) { T.cantero(T.recto(19, 104, s * 31.5, 186, 8), CESPED); T.cantero(T.recto(12, 55, s * 34.5, 89.5, 6), CESPED); }
  for (const s of [-1, 1]) {
    for (let i = 0; i < 7; i++) { const z = 141 + 11 * i; crece(s * (29.3 + Math.sin(i * 2.1) * 0.9), z + 1.5, 2.7, 3.8, 4.9); crece(s * (39.2 + Math.cos(i * 1.7) * 0.9), z - 1.5, 2.5, 3.6, 4.7); }
    for (const z of [97, 108, 119]) crece(s * 39, z, 2.2, 2.8, 4.2);
    // una estatua en su macizo redondo, a cada lado, antes de Virrey Cevallos
    c.epoca(4, 6); T.cantero(T.ovalo(s * 31.7, 230, 6, 6, 20), CESPED);
    c.epoca(4); flores(T.ovalo(s * 31.7, 230, 3.7, 3.7, 14)); estatua(s * 31.7, 230, 2.4, 2.3);
  }

  // ---------------------------------------------------------------- la plaza del medio: el estanque y El Pensador
  c.epoca(4);
  { // el estanque lobulado con su surtidor, en un cantero también de lóbulos, con cuatro palmeras (foto del AGN, 1910:
    // el borde de piedra, el chorro, La Inmobiliaria atrás). Sigue en el mismo lugar.
    const ze = 302.4;
    T.cantero(lobulado(0, ze, 13.8, 0.1), CESPED); T.cantero(lobulado(0, ze, 7.7), AGUA);
    for (const [x, z] of [[10.7, 0], [-10.7, 0], [0, 10.7], [0, -10.7]]) flores(T.ovalo(x, ze + z, x ? 1.1 : 3.1, x ? 3.1 : 1.1, 12));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) palmera(sx * 8, ze + sz * 8, 6 + (sx + sz) * 0.3);
    en(0, ze).cilindro(0.5, 1.5, 0, 0, 0, PIEDRA, 6, 0.3, NANCY);
    // El Pensador de Rodin (noviembre de 1907), sobre el eje, de espaldas al Congreso: en las dos vistas desde el Barolo
    // está en un macizo de flores entre el estanque y la calle.
    const zp = 333, L = en(0, zp);
    T.cantero(lobulado(0, zp, 4.7, 0.1, 32), CESPED); flores(T.ovalo(0, zp, 3.1, 3.1, 14));
    L.caja(2, 0.4, 2, 0, 0.5, 0, PIEDRA, GRANITO); L.caja(1.5, 2.1, 1.6, 0, 0.9, 0, PIEDRA, GRANITO);
    L.caja(0.95, 0.75, 0.95, 0, 3, -0.1, PINTADO, BRONCE);
    L.put(new THREE.BoxGeometry(0.75, 1.15, 0.6).translate(0, 0.5, 0).rotateX(0.5).translate(0, 3.7, -0.1), PINTADO, { H: 4.9, ...BRONCE }); bola(L, 0.26, 0, 4.85, 0.45);
    L.caja(0.7, 0.3, 0.8, 0, 3.55, 0.45, PINTADO, BRONCE);
  }
  for (const s of [-1, 1]) {
    // las esculturas de los costados, dos de cada lado (en la vista de Bourquin, las del norte; las del sur van espejadas)
    for (const [x, z] of [[29.7, 287.5], [30.4, 331]]) {
      c.epoca(4, 6); T.cantero(T.ovalo(s * x, z, 6, 6, 20), CESPED);
      c.epoca(4); flores(T.ovalo(s * x, z, 3.7, 3.7, 14)); estatua(s * x, z, z > 300 ? 3 : 2.2, 2.2);
    }
    // el grupo de árboles nuevos entre una y otra; en los años treinta queda uno grande de cada lado, en el césped
    for (const [x, z] of [[38.5, 299], [40, 310], [37.5, 320.5], [27.5, 304.5], [28.5, 316]]) { c.epoca(4, 5); T.arbol(s * x, z, 2.3); c.epoca(5, 6); T.arbol(s * x, z, 3.2); }
    c.epoca(6); T.arbol(s * 33, 310, 6.2); T.cantero(T.recto(31, 60, s * 24.5, 306.5, 9), CESPED);
  }

  // ------------------------------------------------------------------------------------------------ la Plaza Lorea
  // La plaza vieja, que la Avenida de Mayo partió en dos en 1894. Thays le hizo «jardines estilo francés»: en la foto
  // de la Library of Congress (tomada desde la mitad sur) se ven los canteros de césped, las palmeras, los árboles
  // viejos y, sobre su pedestal de piedra que imita una montaña, el Mariano Moreno de Miguel Blay (1 de octubre de 1910).
  c.epoca(4);
  for (const s of [-1, 1]) {
    const x = s * 29.25;
    T.cantero(T.recto(29.5, 19, x, 371, 6), CESPED); T.cantero(T.recto(29.5, 19, x, 405, 6), CESPED);
    T.cantero(T.ovalo(x, 388, 5.2, 5.2, 20), CESPED); flores(T.ovalo(x, 388, 3.6, 3.6, 14));
    for (const [dx, z, r] of [[-8, 367.5, 4.6], [8.5, 374, 5], [-7, 407.5, 4.8], [9, 401.5, 4.4], [1.5, 411, 4.2]]) T.arbol(x + s * dx, z, r);
    palmera(x + s * 2, 368.5, 7); palmera(x - s * 3, 401, 6.2);
    for (const z of [371, 405]) farol(s * 13.6, z, 5.6, 4);
  }
  { // Mariano Moreno, sentado, con el cóndor que abre las alas detrás
    const L = en(-29.25, 388);
    L.put(new THREE.CylinderGeometry(1.5, 2.5, 3.9, 6).translate(0, 0.5 + 1.95, 0), PIEDRA, { H: 4.4, ...NANCY });
    L.caja(1.1, 0.9, 1.1, 0, 4.4, 0, PINTADO, BRONCE); figura(L, 0, 4.9, 0.1, 2.3);
    for (const w of [-1, 1]) L.put(new THREE.BoxGeometry(1.8, 0.14, 0.9).translate(0.9, 0, 0).rotateZ(0.35).rotateY(w < 0 ? Math.PI : 0).translate(0, 4.5, -1), PINTADO, { H: 5.2, ...BRONCE });
  }
  { // 1940: el monolito del Kilómetro Cero, de los Fioravanti (octubre de 1935). Hasta 1944 estuvo en la punta de la
    // mitad norte de la Lorea, «donde la Avenida de Mayo empalma con Rivadavia»; después lo corrieron a Virrey Cevallos.
    c.epoca(6);
    const L = en(16.5, 363);
    L.caja(2.3, 0.35, 2.3, 0, 0.2, 0, PIEDRA, GRANITO); L.caja(1.35, 2.5, 1.35, 0, 0.55, 0, PIEDRA, GRANITO); L.caja(1.6, 0.3, 1.6, 0, 3.05, 0, PIEDRA, GRANITO);
  }

  // ---------------------------------------------------------------------------------------------------- los faroles
  // (las columnas de un globo que en las fotos bordean el parterre y los cordones)
  c.epoca(4);
  for (const s of [-1, 1]) {
    for (const z of [22, 50, 152, 178, 204]) farol(s * (z < 100 ? 30 : 20.3), z);
    for (const z of [26, 58, 90, 122, 154, 186, 218, 282, 306, 330]) farol(s * (K - 1.1), z);
    for (const z of [276, 328]) farol(s * 17.5, z);
  }
  c.epoca(0);
}
