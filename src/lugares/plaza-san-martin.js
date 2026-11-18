// La Plaza San Martín (en 1867, Plaza de Marte): la lonja alta del Retiro, con el primer monumento ecuestre del país,
// y la barranca que se le sumó en los años treinta. Época por época, lo que muestran las fotos y los planos:
//   - 1867 (etapa 0): el suelo es el del plano (el Campo de Marte arbolado según el proyecto de José Canale, de 1860).
//     Encima va solo el monumento: el San Martín de Louis-Joseph Daumas, inaugurado el 13 de julio de 1862, sobre su
//     pedestal bajo de mármol, con la reja de hierro y los cuatro faroles a gas. Mira al sudeste («al naciente»). De
//     «Monumento al General San Martín.jpg» (Esteban Gonnet, 1864), «Estatua de san martin junior.jpg» y «MG-11-015
//     (Estatua del General San Martín).tif» (Christiano Junior, 1876) y «Campo de Marte (ca 1862).jpg» (Casa Witcomb).
//     Va sobre el signo que dibuja el plano, unos 13 m al sudeste de donde está hoy (ver abajo, «Dónde va cada cosa»).
//   - 1888, 1895 y 1905 (etapas 1 a 3): el jardín «a la inglesa» de Eugène Courtois (Wikipedia lo fecha en 1874): la
//     avenida central de granza entre eucaliptos enormes, con bancos de listones y faroles a gas en el eje; la
//     explanada pelada alrededor del monumento, con una palmera sola del otro lado; canteros de césped de puntas
//     redondas a los dos lados del eje y, hacia la punta del noroeste, un estanque con rocalla. De las vistas de Samuel
//     Rimathé de hacia 1890 («MG-014-134 (Plaza San Martín).tif», desde el sudeste; «MG-014-074 (Plaza San Martín).tif»,
//     desde atrás del monumento; «MG-014-045 (Plaza San Martín y Cuartel de Retiro).tif»), del plano topográfico de
//     1895 (fuentes/planos/1895.jpg: los canteros en dos filas, el cuadrado del monumento, el redondel del estanque y
//     otro redondel en el eje cerca de la punta del sudeste, que acá es un macizo redondo y nada más: no se sabe qué
//     era), de «Plaza san martin sfa.jpg» (Sociedad Fotográfica Argentina de Aficionados, c. 1900: palmeras, bancos,
//     faroles) y de «Plaza San Martín (ca. 1905).jpg» (la arboleda cerrada, con el sendero derecho del noroeste).
//     En 1905, además, el Falucho de Lucio Correa Morales (16 de mayo de 1897) en la plazoleta de Florida y Charcas;
//     lo sacaron en 1910 («Monumento a falucho florida y charcas.jpg»: el pedestal de piedra tosca y las palmeras).
//   - 1910 y 1921 (etapas 4 y 5): el monumento nuevo, «al General San Martín y a los Ejércitos de la Independencia»:
//     la misma estatua de Daumas, dada vuelta (ahora mira al noroeste, a lo largo de la plaza), sobre el basamento de
//     granito rojo de Gustav Eberlein, con el Marte del frente, los relieves y los cuatro grupos de bronce de las
//     esquinas (inaugurado el 27 de mayo de 1910). De «Buenos Aires Statue of General San Martin (4725380420).jpg»
//     (c. 1910-1915: los tres escalones corridos, la terraza, la escalinata del frente, el cantero con postes y
//     cadena). Alrededor, la explanada grande; del lado de Santa Fe, la escalinata de piedra («Autos en plaza san
//     martin.jpg», c. 1910). En 1921, lo que agrega «Plaza sanmartin en 1916.jpg»: el cantero rectangular con flores
//     al pie del monumento, el cantero largo del lado del Pabellón con una conífera en la punta y el estanque, que
//     sigue. «La Duda», el mármol de Cordier, se emplazó en 1905-1906 (Wikipedia): va desde 1910, en su lugar de hoy.
//   - 1940 (etapa 6): la ampliación. Hacia 1932 se demolió la manzana de la barranca; en 1933 se desarmó el Pabellón
//     Argentino (src/lugares/retiro.js) y en 1936 Carlos León Thays (hijo) plantó la parte nueva. De la fotografía
//     aérea de 1940 (Gobierno de la Ciudad, mapa interactivo), llevada al plano: la explanada ovalada con sus dos
//     canteros largos, el césped ovalado sobre el eje (ya sin la avenida central de ese lado), la arboleda del
//     sudeste, la punta del noroeste alargada hasta Esmeralda; donde estuvo el Pabellón, una terraza en «D» con un
//     paseo de granza bordeado de árboles nuevos y cuatro paños de césped, un árbol grande que quedó de antes, la
//     barranca de césped con grupos de arbolitos y el sendero que baja al redondel del pie. También «Horacio Coppola -
//     Plaza San Martín desde Kavanagh.jpg» (1936) y «Plaza San Martín (1932).JPG» (la demolición).
// Lo que no está: la reja y los pilares del contorno de 1867 (se ven en «Campo de Marte (ca 1862).jpg»; en el plano
// son los rectangulitos del borde), la plazoleta en cuña del lado de Maipú que trae el plano de 1895, las escaleras de
// la barranca y el monumento a Alem (no pude fechar su emplazamiento). Los dibujos de los canteros de 1888 a 1921 son
// aproximados: salen del plano de 1895 y de fotos tomadas a ras del suelo.
// Dónde va cada cosa: el contorno de la lonja es el del plano de 1867; el monumento, la escalinata y «La Duda», el mapa
// de hoy; lo de 1940, la foto aérea. El plano de 1867 dibuja el monumento 13 m al sudeste de su lugar de hoy; el de
// 1895 ya lo trae donde está, y solo una página del Gobierno de la Ciudad dice que en 1910 «se lo desplazó»: acá va
// sobre el signo en 1867 (para que coincida con el dibujo del suelo) y en su lugar de hoy desde 1888.
// Todo en metros desde el monumento: x a lo largo de la lonja, hacia el noroeste (Arenales y Esmeralda); z hacia el
// noreste (el Pabellón, la barranca). El lado de −z es el de Maipú y Santa Fe; la punta de −x, la de Florida.
export default function (c) {
  const { THREE, PINTA, PIEDRA, TINTA, FOLLAJE, PINTADO, GRIS } = c;
  const RUMBO = -0.82, UX = Math.cos(RUMBO), UY = Math.sin(RUMBO); // (el eje largo de la lonja en el plano de 1867)
  const T = c.lugar(12543, 9087, UX, UY);
  /** las herramientas con el origen en un punto de la plaza: lo que se levanta del suelo se apoya en el terreno de ahí */
  const en = (x, z) => c.lugar(...T.aPlano(x, z), UX, UY);
  const BRONCE = { pinta: [PINTA.PATINA, 0.3] }, MARMOL = { pinta: [PINTA.BLANCO, 0.97] }, LUZ = { pinta: [PINTA.BLANCO, 1] }, ROCA = { tono: GRIS };
  const GRANITO = { pinta: [PINTA.LADRILLO, 0.45] }; // (el granito rojo pulido de Eberlein: no hay ese color, va el ladrillo, que es el rojo más apagado)
  const CESPED = { alto: 0.5 }, AGUA = { alto: 0.62, tono: PINTA.AGUA, cordon: 0.5, claro: 0.58 }, GRANZA = { alto: 0.22, tono: PINTA.GRANZA, cordon: 0.5, claro: 0.9 };
  const EN1867 = [-12.8, -1]; // (el signo del monumento en el plano)
  const RAD = Math.PI / 180;

  // ------------------------------------------------------------------------------------------------ las formas
  /** un polígono con las puntas redondeadas */
  const redondo = (pts, r = 6, n = 3) => pts.flatMap((b, i) => {
    const a = pts[(i + pts.length - 1) % pts.length], d = pts[(i + 1) % pts.length], la = Math.hypot(a[0] - b[0], a[1] - b[1]), ld = Math.hypot(d[0] - b[0], d[1] - b[1]), ka = Math.min(r, la / 2) / la, kd = Math.min(r, ld / 2) / ld;
    const p = [b[0] + (a[0] - b[0]) * ka, b[1] + (a[1] - b[1]) * ka], q = [b[0] + (d[0] - b[0]) * kd, b[1] + (d[1] - b[1]) * kd];
    return Array.from({ length: n + 1 }, (_, k) => { const t = k / n, u = 1 - t; return [u * u * p[0] + 2 * u * t * b[0] + t * t * q[0], u * u * p[1] + 2 * u * t * b[1] + t * t * q[1]]; });
  });
  /** los puntos de un arco de elipse, de a0 a a1 grados (0 mira a +x, 90 a +z) */
  const elipse = (cx, cz, rx, rz, a0, a1, n = 10) => Array.from({ length: n + 1 }, (_, i) => { const a = (a0 + ((a1 - a0) * i) / n) * RAD; return [cx + Math.cos(a) * rx, cz + Math.sin(a) * rz]; });
  const dentro = (pts, x, z) => { let d = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, zi] = pts[i], [xj, zj] = pts[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) d = !d; } return d; };
  const azar = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
  /** el borde de la lonja del lado de Maipú (sw) y del de la barranca (ne), a la altura de x */
  const sw = (x) => -58.3 + (x + 120) * 0.0841, ne = (x) => 49 - (x + 118) * 0.0899;
  /** un cantero entre el eje y el borde, de x0 a x1: s = −1 del lado de Maipú, +1 del de la barranca */
  const par = (x0, x1, s) => redondo(s < 0 ? [[x0, -8], [x1, -8], [x1, sw(x1) + 5.5], [x0, sw(x0) + 5.5]] : [[x0, 2], [x1, 2], [x1, ne(x1) - 5.5], [x0, ne(x0) - 5.5]], 7);
  /** un sendero de granza a lo largo de unos puntos */
  const senda = (pts, ancho, y = 0.5) => pts.forEach(([x0, z0], i) => {
    T.tapete(T.ovalo(x0, z0, ancho / 2, ancho / 2, 10), PINTA.GRANZA, { y, claro: 0.9 }); if (i + 1 === pts.length) return;
    const [x1, z1] = pts[i + 1], l = Math.hypot(x1 - x0, z1 - z0), nx = (-(z1 - z0) / l) * ancho / 2, nz = ((x1 - x0) / l) * ancho / 2;
    T.tapete([[x0 + nx, z0 + nz], [x1 + nx, z1 + nz], [x1 - nx, z1 - nz], [x0 - nx, z0 - nz]], PINTA.GRANZA, { y, claro: 0.9 });
  });
  const flores = (pts, y = 0.8) => T.tapete(pts, PINTA.FLORES, { y, claro: 0.6 });

  // ------------------------------------------------------------------------------------------------ las piezas
  const bola = (L, r, x, y, z, o = BRONCE, sy = 1) => L.put(new THREE.SphereGeometry(r, 6, 4).scale(1, sy, 1).translate(x, y, z), PINTADO, { H: y + r, ...o });
  /** una figura de alto h parada en (x, y, z): el cuerpo y la cabeza, nada más */
  const figura = (L, x, y, z, h, o = BRONCE) => { L.cilindro(h * 0.2, h * 0.8, x, y, z, PINTADO, 6, h * 0.09, o); bola(L, h * 0.105, x, y + h * 0.9, z, o); };
  /** una barra (o un paño de reja) de (x0, z0) a (x1, z1) */
  const barra = (L, x0, z0, x1, z1, y, h, t = 0.06, kind = TINTA, o) => {
    const largo = Math.hypot(x1 - x0, z1 - z0);
    L.put(new THREE.BoxGeometry(largo, h, t).translate(0, h / 2, 0).rotateY(-Math.atan2(z1 - z0, x1 - x0)).translate((x0 + x1) / 2, y, (z0 + z1) / 2), kind, { H: y + h, ...o });
  };
  /** un farol a gas: la columna de hierro y la linterna (los de Rimathé y los de la reja del monumento) */
  const gas = (x, z, h = 3.6) => { const L = en(x, z); L.cilindro(0.16, 0.9, 0, 0, 0, TINTA, 5, 0.1); L.cilindro(0.08, h - 0.9, 0, 0.9, 0, TINTA, 5, 0.05); L.caja(0.42, 0.56, 0.42, 0, h, 0, PINTADO, LUZ); L.caja(0.52, 0.08, 0.52, 0, h + 0.56, 0, TINTA); };
  /** una columna con un globo blanco (las de las fotos de 1916 y 1923) */
  const globo = (x, z, h = 4.4) => { const L = en(x, z); L.cilindro(0.13, h, 0, 0, 0, TINTA, 5, 0.06); L.put(new THREE.SphereGeometry(0.33, 5, 3).translate(0, h + 0.28, 0), PINTADO, { H: h, ...LUZ }); };
  /** un banco de listones con su respaldo; `a`: hacia dónde mira (0: a +z; π: a −z) */
  const banco = (x, z, a = 0) => { const L = en(x, z); for (const g of [new THREE.BoxGeometry(1.9, 0.08, 0.5).translate(0, 0.76, 0), new THREE.BoxGeometry(1.9, 0.45, 0.07).translate(0, 1.02, -0.25)]) L.put(g.rotateY(a), PINTADO, { H: 1.2, pinta: [PINTA.BLANCO, 0.9] }); };
  /** una palmera: el tronco, el paraguas de hojas que caen y el penacho */
  const palmera = (x, z, h = 6) => {
    const L = en(x, z), r = 1.6 + h * 0.28;
    L.cilindro(0.3, h, 0, 0, 0, PINTADO, 5, 0.2, { pinta: [PINTA.MADERA, 0.42] });
    L.put(new THREE.SphereGeometry(r, 8, 4).scale(1, 0.36, 1).translate(0, h + 0.35, 0), FOLLAJE, { H: h + 1.6 }); L.put(new THREE.ConeGeometry(r * 0.45, 1.5, 6).translate(0, h + 1.6, 0), FOLLAJE, { H: h + 2.4 });
  };
  /** El San Martín de Daumas: el caballo empinado sobre las patas y el general que señala con el brazo derecho.
   *  Apoyado en y, con el centro en x0; hacia = +1 si mira a +x (desde 1910) y −1 si mira a −x (hasta 1909). */
  const jinete = (L, y, hacia, x0 = 0) => {
    const pz = (g) => L.put(g.rotateY(hacia > 0 ? 0 : Math.PI).translate(x0, y, 0), PINTADO, { H: y + 4.6, ...BRONCE });
    pz(new THREE.BoxGeometry(3.4, 0.22, 1.4).translate(0, 0.11, 0));                                                    // el plinto
    pz(new THREE.BoxGeometry(2.7, 1, 0.85).rotateZ(0.42).translate(0.05, 2.15, 0));                                     // el cuerpo, empinado
    for (const s of [-1, 1]) pz(new THREE.BoxGeometry(0.3, 1.55, 0.28).rotateZ(-0.18).translate(-1, 0.98, s * 0.3));    // las patas, apoyadas
    pz(new THREE.BoxGeometry(0.26, 1.1, 0.7).rotateZ(-1).translate(1.55, 2.3, 0));                                      // las manos, en el aire
    pz(new THREE.BoxGeometry(0.55, 1.4, 0.5).rotateZ(-0.35).translate(1.35, 3.3, 0));                                   // el cuello
    pz(new THREE.BoxGeometry(0.85, 0.4, 0.38).rotateZ(-0.5).translate(1.85, 3.75, 0));                                  // la cabeza
    pz(new THREE.BoxGeometry(0.2, 1.2, 0.2).rotateZ(0.5).translate(-1.6, 1.3, 0));                                      // la cola
    pz(new THREE.BoxGeometry(0.6, 1.25, 0.7).rotateZ(0.12).translate(-0.1, 3.3, 0));                                    // el general
    pz(new THREE.SphereGeometry(0.27, 6, 4).translate(-0.05, 4.2, 0)); pz(new THREE.BoxGeometry(0.2, 0.3, 0.62).translate(-0.05, 4.5, 0)); // la cabeza y el falucho
    pz(new THREE.BoxGeometry(1.15, 0.16, 0.16).rotateZ(0.45).translate(0.6, 4, 0.36));                                  // el brazo que señala
  };
  /** El monumento de 1862: el pedestal de mármol, la reja y los cuatro faroles. Mira al sudeste (−x). */
  const daumas = (x, z) => {
    const L = en(x, z), m = (w, h, d, y) => L.caja(w, h, d, 0, y, 0, PINTADO, MARMOL);
    m(6.6, 0.55, 4.4, 0); m(5.8, 0.25, 3.6, 0.55); m(5, 0.4, 3, 0.8); m(4.4, 2.5, 2.4, 1.2); m(5.1, 0.35, 3.1, 3.7);
    jinete(L, 4.05, -1);
    const reja = redondo([[-8, -5.5], [8, -5.5], [8, 5.5], [-8, 5.5]], 3, 2);
    reja.forEach((p, i) => { const q = reja[(i + 1) % reja.length]; barra(L, p[0], p[1], q[0], q[1], 0, 1.25); });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) gas(x + sx * 8.7, z + sz * 6.2, 3.9);
  };
  /** El monumento de 1910: el basamento de Eberlein, de granito rojo, con sus bronces. Mira al noroeste (+x). */
  const eberlein = () => {
    const L = en(0, 0), g = (w, h, d, x, y, z = 0) => L.caja(w, h, d, x, y, z, PINTADO, GRANITO), b = (w, h, d, x, y, z = 0) => L.caja(w, h, d, x, y, z, PINTADO, BRONCE);
    g(18.4, 0.8, 12.4, 0, 0); g(17.4, 1, 11.4, 0, 0); g(16.4, 1.2, 10.4, 0, 0); // los tres escalones corridos
    const y0 = 1.2, yt = y0 + 1.7, xp = -1.2;
    g(13.6, yt - y0, 9.6, xp, y0);                                              // la terraza
    for (let i = 0; i < 5; i++) g(0.5, (yt - y0) * (1 - (i + 1) / 6), 5.4, 5.85 + 0.5 * i, y0); // la escalinata del frente
    for (const [x, sx] of [[6.6, 1], [-7, -1]]) for (const s of [-1, 1]) {      // los cuatro grupos: la Partida, la Batalla, la Victoria y el Regreso
      g(2.2, 3.2, 2.2, x, y0, s * 4.2); g(2.6, 0.25, 2.6, x, y0 + 3.2, s * 4.2);
      figura(L, x - sx * 0.3, y0 + 3.45, s * 4.2, 2.3); figura(L, x + sx * 0.45, y0 + 3.45, s * 4.4, 1.9);
      b(0.12, 1.5, 1.3, x - sx * 0.75, y0 + 4.4, s * 4.2);                      // (un ala, una bandera)
    }
    // el pilar: el zócalo, el dado con los relieves (San Lorenzo, Chacabuco, Maipú) y la cornisa
    g(6.4, 0.9, 4.6, xp, yt); g(5.6, 0.8, 3.8, xp, yt + 0.9); g(4.7, 3.4, 3, xp, yt + 1.7); g(5.5, 0.45, 3.7, xp, yt + 5.1); g(4.6, 0.5, 2.9, xp, yt + 5.55);
    for (const s of [-1, 1]) { b(3.5, 1.6, 0.1, xp, yt + 2.7, s * 1.52); b(4.4, 0.55, 0.1, xp, yt + 1.02, s * 1.92); }
    b(0.1, 1.6, 2.2, xp - 2.37, yt + 2.7); b(0.1, 0.55, 3, xp - 2.82, yt + 1.02);
    // al frente, Marte con el cóndor y la bandera
    g(1.9, 1.5, 2.4, xp + 3.5, yt); figura(L, xp + 3.5, yt + 1.5, 0, 3); b(0.3, 0.5, 2.8, xp + 4.25, yt + 1.6); b(0.12, 4.3, 0.12, xp + 3.1, yt + 1.5, 0.75);
    jinete(L, yt + 6.05, 1, xp);
  };

  // ============================================================================================ el monumento
  c.epoca(0, 1); daumas(...EN1867);
  c.epoca(1, 4); daumas(0, 0);
  c.epoca(4); eberlein();

  // ================================================================================================= la lonja
  // El contorno de la Plaza de Marte del plano de 1867 (el mismo hasta hoy del lado de Maipú): el cordón y el piso de
  // granza. Los canteros van encima.
  const LONJA = [[-125, -57], [-101, -56], [-53, -52.7], [-15.5, -49], [33, -45], [54, -44], [68, -43], [82.5, -38], [91.5, -32.5], [100, -22.5], [104.5, -8.5], [104.5, 6], [97.5, 18.5], [87.5, 27.5], [73.5, 32], [56, 33], [-10.5, 38.5], [-30.5, 42.5], [-90.5, 47], [-114.5, 48.5], [-125, 49.5], [-139.5, 44], [-151, 32], [-159, 21], [-164, 2.5], [-164.5, -10], [-157, -27], [-149, -38], [-137.5, -50]];
  // (en 1940 la punta del noroeste llega hasta la esquina de Esmeralda y Arenales: el «anexo» de la foto aérea)
  const ANEXO = [[62, -48], [93.8, -77.4], [151, -5], [93, 35]];
  c.epoca(1, 6); T.cantero(LONJA, GRANZA);
  c.epoca(6); T.cantero([...LONJA.slice(0, 6), ...ANEXO, ...LONJA.slice(14)], GRANZA);

  // Los canteros de césped: [desde, hasta, contorno, cada cuántos metros lleva un árbol (0: ninguno)].
  const CANTEROS = [];
  for (const s of [-1, 1]) {
    // del monumento a la punta de Florida, a los dos lados de la avenida central (el plano de 1895 y Rimathé)
    CANTEROS.push([1, 4, par(-58, -16, s), 10.5], [4, 6, par(-58, -36, s), 10.5], [1, 6, par(-94, -64, s), 10.5], [6, 0, par(-96, -78, s), 9], [1, 0, par(-121, -100, s), 10]);
    // la cabecera redonda del sudeste, partida por la entrada de la avenida
    CANTEROS.push([1, 0, redondo(s < 0 ? [[-134, -9.5], [-158.5, -9.5], [-152, -25], [-144.5, -35], [-134, -46.5]] : [[-134, 3.5], [-134, 41.5], [-137.5, 40], [-147, 29.5], [-154, 20], [-158.5, 3.5]], 4), 9]);
    // del otro lado de la explanada: dos canteros antes del estanque y dos después, que cierran la punta del noroeste
    CANTEROS.push([1, 0, par(38, 50, s), 8], [1, 0, redondo(s < 0 ? [[72, -8], [72, -37], [82, -33.5], [90, -28], [96.5, -19], [99, -8]] : [[72, 2], [99, 2], [96, 10], [91, 17.5], [84.5, 23.5], [72, 27.5]], 4), 9]);
  }
  // 1940: el césped ovalado sobre el eje, al sudeste de la explanada (ahí ya no pasa la avenida central)
  CANTEROS.push([6, 0, T.ovalo(-53, 0, 19, 22, 28), 0]);
  /** los árboles crecen: en cada época, el mismo lugar y una copa más grande */
  const EDADES = [[1, 2, 0.9], [2, 4, 1], [4, 6, 1.12], [6, 0, 1.25]];
  const enEdades = (desde, hasta, hacer) => { for (const [d, h, f] of EDADES) { const a = Math.max(d, desde), b = Math.min(h || 9, hasta || 9); if (a < b) { c.epoca(a, b > 8 ? 0 : b); hacer(f); } } };
  /** árboles sembrados adentro de un contorno, cada `paso` metros, corridos al azar (siempre igual) */
  const monte = (pts, paso, r, k = 1) => {
    const q = c.adentro(pts, 2.2), xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]); let i = 0;
    for (let x = Math.min(...xs) + paso / 2; x < Math.max(...xs); x += paso) for (let z = Math.min(...zs) + paso / 2; z < Math.max(...zs); z += paso) {
      i++; const px = x + (azar(i, k) - 0.5) * paso * 0.7, pz = z + (azar(i, k + 7) - 0.5) * paso * 0.7;
      if (dentro(q, px, pz)) T.arbol(px, pz, r * (0.82 + azar(i, k + 3) * 0.4));
    }
  };
  for (const [d, h, pts, paso] of CANTEROS) {
    c.epoca(d, h); T.cantero(pts, CESPED);
    if (paso) enEdades(d, h, (f) => monte(pts, paso, 4 * f, Math.round(pts[0][0] * 3 + pts[0][1])));
  }
  // Los eucaliptos de la avenida central (Rimathé, c. 1890: ya altísimos), en el borde de los canteros, y las hileras
  // del contorno, que vienen del proyecto de 1860 (los árboles en fila del plano) y siguen en la foto aérea de 1940.
  const hilera = (x0, x1, paso, z, r) => { for (let x = x0; x <= x1 + 0.01; x += paso) T.arbol(x, typeof z === 'function' ? z(x) : z, r); };
  for (const [d, h, x1] of [[1, 4, -19], [4, 6, -38], [6, 0, -79]]) enEdades(d, h, (f) => { for (const z of [-10.3, 4.3]) { hilera(-155, -137, 9, z, 4.8 * f); hilera(-119, x1, 9.1, z, 4.8 * f); } });
  enEdades(1, 0, (f) => {
    hilera(-116, 14, 10.6, (x) => sw(x) + 2.7, 4 * f); hilera(41, 54, 10.6, (x) => sw(x) + 2.7, 4 * f); // (el claro: la escalinata de Santa Fe)
    hilera(-112, 56, 10.6, (x) => ne(x) - 2.7, 4 * f);
  });

  // ------------------------------------------------------------------------------ 1888-1905: el jardín de Courtois
  c.epoca(1, 4);
  for (const x of [-118, -98, -80, -60, -40]) gas(x, -3);                        // los faroles, en el medio de la avenida
  for (const x of [-112, -90, -74, -52, -32]) { banco(x, -6.9, 0); banco(x + 4, 0.9, Math.PI); }
  { // la palmera sola del otro lado del monumento, con su cerco (Rimathé, n.º 74)
    T.cantero(T.ovalo(22, -6, 2, 2, 12), { alto: 0.4 }); palmera(22, -6, 8.5);
  }
  // el redondel del eje, cerca de la punta del sudeste, que trae el plano de 1895: un macizo y nada más
  c.epoca(2, 4); T.cantero(T.ovalo(-127.5, -3, 3.2, 3.2, 14), CESPED); flores(T.ovalo(-127.5, -3, 2, 2, 10));
  { // el estanque con su rocalla, hacia la punta del noroeste (el plano de 1895, Rimathé y, todavía, la foto de 1916)
    c.epoca(1, 6);
    T.cantero(T.ovalo(61, -3, 7, 5.5, 18), AGUA);
    const L = en(61, -3);
    for (const [x, z, r, h] of [[-5.6, 3.4, 1.5, 1.5], [-6.8, 0.6, 1.1, 1], [5.2, -3.6, 1.3, 1.2], [2, 5, 1, 0.8]]) L.cilindro(r, h, x, 0, z, PIEDRA, 5, r * 0.45, ROCA);
  }
  // las palmeras (en la foto de la Sociedad Fotográfica de c. 1900 y en las de 1923; en la aérea de 1940, sus estrellas)
  c.epoca(3); for (const [x, z, h] of [[-104, -38, 6.5], [-110, -29, 5.5], [-46, 20, 6], [-146, 15, 5.5], [70, 9, 5]]) palmera(x, z, h);
  { // 1905: el Falucho (Francisco Cafferata y Lucio Correa Morales, 1897) en la plazoleta de Florida y Charcas
    c.epoca(3, 4);
    T.cantero(redondo([[-213, -48.5], [-178, -50.5], [-198, -25]], 4), CESPED);
    const L = en(-196, -41);
    L.cilindro(1.5, 3, 0, 0, 0, PIEDRA, 6, 0.95, ROCA); figura(L, 0, 3, 0, 2.4);
    L.caja(0.07, 3.3, 0.07, 0.45, 3, 0, PINTADO, BRONCE); L.caja(0.05, 0.8, 0.9, 0.45, 5.4, 0.45, PINTADO, BRONCE); // (la bandera)
    for (const [x, z] of [[-204, -44], [-190, -45.5], [-197, -33], [-199, -47]]) palmera(x, z, 2.6);
  }

  // ------------------------------------------------------------------------------- desde 1910: la explanada
  { // la escalinata de piedra del lado de Santa Fe («Autos en plaza san martin», c. 1910; la foto de 1916). El terreno
    // acá no tiene el escalón de la plaza: va como unas gradas bajas que salen del cordón, entre dos dados.
    c.epoca(4);
    const L = en(28, sw(28)), a = Math.atan(0.0841);
    for (let i = 0; i < 4; i++) L.put(new THREE.BoxGeometry(13, 0.52 - 0.12 * i, 0.6).translate(0, (0.52 - 0.12 * i) / 2, -0.3 - 0.6 * i).rotateY(-a), PIEDRA, { H: 0.6, ...ROCA });
    for (const s of [-1, 1]) L.put(new THREE.BoxGeometry(0.9, 0.95, 3).translate(s * 7, 0.475, -1.1).rotateY(-a), PIEDRA, { H: 1, ...ROCA });
  }
  { // «La Duda» (Louis-Henri Cordier), de mármol: un viejo y un muchacho sentados en una roca. Donde está hoy.
    c.epoca(4);
    const L = en(-47.4, -23.1);
    L.caja(2.6, 0.95, 1.9, 0, 0, 0, PIEDRA, ROCA); L.caja(2, 0.8, 1.5, 0, 0.95, 0, PINTADO, MARMOL); figura(L, -0.4, 1.75, 0, 1.5, MARMOL); figura(L, 0.45, 1.75, 0.1, 1.3, MARMOL);
  }
  // el cantero del monumento: en 1910, césped con postes y cadena; en 1916, un rectángulo con su guarda de flores
  c.epoca(4, 6); T.cantero(T.recto(27, 19, 0, 0, 1.5), CESPED);
  c.epoca(4, 5);
  { const L = en(0, 0), P = T.recto(25.6, 17.6); P.forEach((p, i) => { const q = P[(i + 1) % 4]; barra(L, p[0], p[1], q[0], q[1], 1.05, 0.06, 0.06); for (let k = 0; k < 5; k++) L.cilindro(0.07, 0.6, p[0] + ((q[0] - p[0]) * k) / 5, 0.55, p[1] + ((q[1] - p[1]) * k) / 5, TINTA, 4); }); }
  c.epoca(5, 6); for (const s of [-1, 1]) { flores(T.recto(24, 1.5, 0, s * 8, 0.7)); flores(T.recto(1.5, 14, s * 12, 0, 0.7)); }
  // 1940: ovalado, con una guarda de flores a cada lado (la foto aérea)
  c.epoca(6); T.cantero(T.ovalo(0, 0, 13.5, 10.6, 24), CESPED); for (const s of [-1, 1]) flores(T.ovalo(0, s * 8.6, 8.5, 1.3, 14));
  // el cantero largo del lado del Pabellón, con la conífera en la punta (1916); en 1940 tiene su gemelo del otro lado
  c.epoca(5); T.cantero(T.ovalo(0.6, 28.5, 12, 3.5, 20), CESPED); flores(T.ovalo(0.6, 28.5, 9.5, 1.6, 14));
  { const L = en(15.5, 27); T.cantero(T.ovalo(15.5, 27, 2.6, 2.6, 12), { alto: 0.4 }); L.cilindro(0.3, 2, 0, 0, 0, PINTADO, 5, 0.2, { pinta: [PINTA.MADERA, 0.42] }); L.put(new THREE.ConeGeometry(2.5, 11, 7).translate(0, 7, 0), FOLLAJE, { H: 12.5 }); }
  c.epoca(6); T.cantero(T.ovalo(-1.7, -24, 10.5, 3.7, 20), CESPED); flores(T.ovalo(-1.7, -24, 8, 1.7, 14));
  for (const [x, z, r] of [[-19, 16, 7], [-35.5, -17, 2.6], [-36, 14, 2.6], [31.7, -16, 3]]) T.arbol(x, z, r); // (los árboles sueltos del borde de la explanada)
  // los faroles de globo alrededor de la explanada y en la avenida, y los bancos
  c.epoca(4);
  for (const [x, z] of elipse(0, 0, 33, 27.5, 22, 382, 8).slice(0, 8)) globo(x, z);
  for (const x of [-118, -98, -80]) globo(x, -3);
  for (const x of [-112, -90]) { banco(x, -6.9, 0); banco(x + 4, 0.9, Math.PI); }

  // ================================================================================ 1940: la plaza agrandada
  c.epoca(6);
  // La barranca: lo que fue la calle del borde (Arenales), el solar del Pabellón y la manzana demolida, hasta la
  // vereda de Florida, la avenida que baja (Maipú) y el redondel del pie. Todo césped; encima, los paseos de granza.
  const NB = 0.5; // (la altura de los paseos sobre el césped de la barranca)
  T.cantero([[-139.5, 44], [-125, 49.5], [-114.5, 48.5], [-90.5, 47], [-30.5, 42.5], [-10.5, 38.5], [-3, 50], [-1.5, 80], [-1.5, 150], [-1.5, 196], [-11, 211], [-40, 221], [-56, 226], [-78, 227], [-90, 215.7], [-106, 206], [-127.5, 187], [-146, 162], [-163, 141], [-165, 80], [-164, 50], [-151, 32]], { alto: 0.22, cordon: 0.4 });
  // la terraza en «D» donde estuvo el Pabellón: el paseo de granza que la rodea, el paseo ancho del medio y el cruce
  const DX = -75, DZ = 76;
  T.tapete([[-1.5, 58], ...elipse(DX, DZ, 73.5, 76, 0, 180, 26), [-148.5, 58]], PINTA.GRANZA, { y: NB, claro: 0.9 });
  const PAÑO = { alto: 0.72 };
  T.cantero(redondo([[-86, 67], [-86, 100], [-138, 100], [-141.5, 85], [-141.5, 72], [-136, 67]], 5), PAÑO);
  T.cantero(redondo([[-58, 62], [-11, 62], [-8.5, 76], [-9.5, 89], [-58, 89]], 5), PAÑO);
  T.cantero([[-81, 107], ...elipse(DX, DZ, 67.5, 69.5, 95, 153.5, 8)], PAÑO);
  T.cantero([[-57, 92], ...elipse(DX, DZ, 67.5, 69.5, 13.3, 74.5, 8)], PAÑO);
  // los árboles nuevos de Thays (hijo): la hilera por adentro del paseo curvo y los de los bordes de los paños
  for (const [x, z] of elipse(DX, DZ, 65, 67, 14, 166, 26)) T.arbol(x, z, 1.9);
  for (const [x, z0, z1] of [[-88, 77, 86], [-60, 60, 84], [-83, 119, 137], [-55, 114, 130]]) for (let i = 0; i < 4; i++) T.arbol(x, z0 + ((z1 - z0) * i) / 3, 2.1);
  T.arbol(-50.7, 105, 8.5); // (el árbol grande que quedó de antes, al borde del paño)
  for (const [x, z] of [[-110.5, 81], [-41, 72]]) for (let i = 0; i < 4; i++) T.arbol(x + Math.cos(i * 1.6) * 3, z + Math.sin(i * 1.6) * 3, 1.3);
  // la arboleda vieja que quedó entre la lonja y la terraza, sobre lo que era la calle
  hilera(-140, -89, 8.5, 62.5, 4.3);
  for (const [x, z, r] of [[-158, 44, 5.5], [-150, 55, 5], [-131, 54, 5.5], [-116, 55.5, 5], [-100, 53.5, 5.5], [-52, 50, 5], [-40, 51.5, 5.5], [-27, 50, 5], [-16, 49, 4.5]]) T.arbol(x, z, r);
  // los pasos de la lonja a la terraza, la entrada de Florida y el sendero que baja al redondel del pie de la barranca
  senda([[-72.5, 44], [-72.5, 59]], 22, NB); senda([[-6, 41], [-6, 59]], 9, NB); senda([[-166, 62], [-149, 62]], 6, NB);
  senda([[-57, 217], [-29, 208.6], [-11.4, 190.7], [-3.5, 173], [-2.5, 152]], 5, NB);
  T.tapete(T.ovalo(-66.8, 222, 10.7, 10.7, 20), PINTA.GRANZA, { y: NB, claro: 0.9 });
  // los grupos de arbolitos recién plantados en el césped de la barranca
  for (const [x, z] of [[-134.6, 164], [-97, 165.7], [-29, 155], [-93.6, 199.6], [-33, 190.7], [-24, 178], [-113, 190], [-62, 170]]) for (let i = 0; i < 5; i++) T.arbol(x + Math.cos(i * 1.9 + x) * 4.5, z + Math.sin(i * 1.9 + x) * 4.5, 1.5);
  // La punta del noroeste, alargada: tres paños de césped con árboles entre la lonja vieja y las dos calles, y la
  // punta despejada.
  for (const [pts, k] of [[[[66, -50], [92.5, -73], [107, -55], [98, -36], [85, -44]], 3], [[[104, -28], [112, -44], [124, -28], [121, -2], [110, -8]], 5], [[[108, 10], [120, 12], [96, 31], [90, 31], [101, 20]], 8]]) { const p = redondo(pts, 3); T.cantero(p, CESPED); monte(p, 7.5, 5.2, k); }
  c.epoca(0);
}
