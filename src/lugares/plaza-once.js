// La Plaza 11 de Septiembre, hoy Plaza Miserere («el Once»): el mercado de carretas del oeste, la plaza que le hizo
// Alvear después de la Exposición Continental de 1882, la que quedó cuando el subterráneo la levantó entera y la
// explanada arbolada con el mausoleo de Rivadavia. Cada época sale de esto:
//   - 1867 (etapa 0): el Mercado 11 de Septiembre, de frutos del país. El suelo es el del plano, que no dibuja nada
//     adentro; acá van solo unas carretas, como las de la foto de Benito Panunzi de 1865 («Panunzi, Benito - Platz des
//     11. September in Buenos Aires zur Zeit der Gauchos (Zeno Fotografie)»): de dos ruedas altas, con el toldo en
//     bóveda de cuero o de lona y el pértigo apoyado en el suelo. (La pirámide que recordaba el 11 de septiembre de
//     1852 no va: el plano no la dibuja y el Concejo aprobó demolerla en mayo de 1867, a pedido del Ferrocarril Oeste.)
//   - 1888, 1895, 1905 y 1910 (etapas 1 a 4): la plaza de Torcuato de Alvear. El mercado funcionó hasta 1882, ese año
//     el lugar fue la Exposición Continental («Exposicion continental buenos aires 1882») y después se delineó la
//     plaza. El contorno (un óvalo largo, de puntas redondas, entre Rivadavia, Ecuador, Piedad y Centro América) y el
//     trazado (el sendero del eje, el óvalo del medio, los senderos en estrella y las medialunas de las puntas) salen
//     del «Plano topográfico de la ciudad de Buenos Aires» de 1895 (fuentes/planos/1895.jpg), que es chico: los
//     canteros son una lectura aproximada. El borde, de la foto de Samuel Boote de hacia 1890 («Avenida Rivadavia
//     (Samuel Boote, sf)», tomada desde Ecuador): la esquina redonda, la vereda ancha de tierra con una hilera de
//     arbolitos nuevos, los bancos mirando a la calle, el farol a gas y adentro el jardín tupido. De Ricardo Llanes
//     («Antiguas plazas de la ciudad de Buenos Aires», 1977): el terreno levantado sobre la calle con un murete, los
//     dos pilares con copones de la entrada de Centro América, el ombú gigantesco del lado de Ecuador y Piedad (lo vio
//     en 1909), el arbolado «más cerca de lo rural» y la bomba de agua de la esquina de Rivadavia y Centro América.
//   - 1921 (etapa 5): la plaza rehecha después del subterráneo, que se construyó a cielo abierto (1911-1913) y «obligó
//     al desplazamiento de cuanto había». Del plano de Cannizzaro y Ludwig de 1921 (fuentes/planos/1921.jpg) sale lo
//     poco que se sabe: el mismo contorno, el sendero del eje, el óvalo del medio y los canteros de las puntas. La foto
//     «Av rivadavia en plaza miserere 1918» muestra el borde sur: una vereda clara y ancha, sin árboles grandes. Va
//     simple, a propósito. (Las bocas del subte no están acá: son de src/lugares/subte-a.js.)
//   - 1940 (etapa 6): el trazado de fines de 1923 y el mausoleo de Bernardino Rivadavia, de Rogelio Yrurtia (3 de
//     septiembre de 1932). Todo medido sobre la foto aérea de 1940 de la Ciudad (mapa interactivo de Buenos Aires,
//     «Fotografías aéreas 1940»): la explanada despejada, las hileras de árboles que la rodean (dos del lado de
//     Rivadavia, cuatro del de Bartolomé Mitre), el monumento en el medio con sus canteros, las tandas de bancos y
//     los redondeles con copón. Los plátanos, los bancos, los faroles de linterna y el copón sobre su pedestal se ven
//     en «Plaza once otono 1951». El mausoleo (25 × 15 m y 9,5 de alto, de granito gris; a los costados, dos bronces
//     sentados de 5,5 m: Moisés y la Acción) sale de las medidas que da la Ciudad y de las fotos de hoy («Mausoleo de
//     Rivadavia - Plano general», «- Puerta», «Estatua Rivadavia Plaza Miserere»). El eje largo corre a lo largo de
//     Rivadavia (así está en la foto aérea y en el mapa de hoy); cuál de los bronces mira a cada lado no está
//     confirmado, y van iguales.
// El contorno es el mismo en todas las épocas (el de la foto de 1940: los dos planos lo dibujan igual, con menos
// detalle). Lo que no se pudo confirmar y no va: el dibujo de adentro de los canteros de 1921, los refugios del lado de
// Pueyrredón que se adivinan en la foto aérea y las entradas del subte de adentro de la plaza.
// Todo en metros, desde el medio del mausoleo: x hacia el norte (Bartolomé Mitre, la estación) y z hacia el este
// (Pueyrredón), con el z a lo largo de Rivadavia.
export default function (c) {
  const { THREE, PINTA, PIEDRA, TINTA, PINTADO, BLANCO, GRIS } = c;
  const UN = Math.hypot(1, 0.018), UX = 1 / UN, UY = -0.018 / UN; // (la plaza sigue a Rivadavia: un grado girada contra el papel)
  const T = c.lugar(10503, 4850, UX, UY);
  /** las herramientas con el origen en un punto de la plaza: lo que se levanta del suelo se apoya en el terreno de ahí */
  const en = (x, z) => c.lugar(...T.aPlano(x, z), UX, UY);
  // Los cordones (de la foto aérea): el de Rivadavia y el de Mitre, la punta de Ecuador y el borde de Pueyrredón.
  const XS = -50, XN = 65.5, XC = (XS + XN) / 2, K = (XN - XS) / 2, ZO = -124.2, ZE = 121.5, ZC = (ZO + ZE) / 2;
  const RO = 42, RNE = 36, RSE = 26; // (la punta del oeste es media elipse de 42 m de fondo; las esquinas del este, redondas)
  const HIERRO = TINTA, LUZ = { pinta: [PINTA.BLANCO, 0.97] }, MADERA = { pinta: [PINTA.MADERA, 0.45] }, BRONCE = { pinta: [PINTA.PATINA, 0.3] };
  const GRANITO = { pinta: [PINTA.CHAPA, 0.8] }; // (el granito gris del mausoleo: no hay ese color, va el gris de la chapa)

  // ------------------------------------------------------------------------------------------------ las formas
  /** el contorno de la plaza, corrido d metros hacia adentro */
  const borde = (d = 0, n = 12) => {
    const k = K - d, zo = ZO + RO, ro = RO - d, rn = Math.max(2, RNE - d), rs = Math.max(2, RSE - d), ze = ZE - d, pts = [];
    for (let i = 0; i <= 2 * n; i++) { const a = (i / (2 * n)) * Math.PI; pts.push([XC - Math.cos(a) * k, zo - Math.sin(a) * ro]); }
    for (let i = 0; i <= n; i++) { const a = ((i / n) * Math.PI) / 2; pts.push([XC + k - rn + Math.cos(a) * rn, ze - rn + Math.sin(a) * rn]); }
    for (let i = 0; i <= n; i++) { const a = Math.PI / 2 + ((i / n) * Math.PI) / 2; pts.push([XC - k + rs + Math.cos(a) * rs, ze - rs + Math.sin(a) * rs]); }
    return pts;
  };
  /** puntos cada `paso` metros a lo largo de un contorno cerrado, con el rumbo del tramo: [x, z, ángulo] */
  const ronda = (pts, paso, fase = 0.5) => {
    let largo = 0; const L = pts.map((p, i) => { const q = pts[(i + 1) % pts.length], l = Math.hypot(q[0] - p[0], q[1] - p[1]); largo += l; return l; });
    const n = Math.round(largo / paso), out = []; let i = 0, hecho = 0;
    for (let k = 0; k < n; k++) {
      const s = ((k + fase) / n) * largo; while (i < L.length - 1 && hecho + L[i] < s) hecho += L[i++];
      const p = pts[i], q = pts[(i + 1) % pts.length], t = (s - hecho) / (L[i] || 1);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, Math.atan2(q[1] - p[1], q[0] - p[0])]);
    }
    return out;
  };
  /** de un polígono convexo, lo que queda del lado a·x + b·z <= k */
  const corta = (pts, a, b, k) => {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length], dp = a * p[0] + b * p[1] - k, dq = a * q[0] + b * q[1] - k;
      if (dp <= 0) out.push(p);
      if (dp < 0 !== dq < 0 && dp !== 0 && dq !== 0) { const t = dp / (dp - dq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
    }
    return out;
  };
  /** …y lo que queda en un cuarto de la plaza (sx: al norte o al sur del eje; sz: al este o al oeste del medio): a más de
   *  u0 metros del eje y entre v0 y v1 metros del medio, a lo largo */
  const cuarto = (pts, sx, sz, u0, v0, v1 = 1e3) => corta(corta(corta(pts, -sx, 0, -(sx * XC + u0)), 0, -sz, -(sz * ZC + v0)), 0, sz, sz * ZC + v1);
  const dentro = (pts, x, z) => { let d = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, zi] = pts[i], [xj, zj] = pts[j]; if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) d = !d; } return d; };
  const azar = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  /** dónde van los árboles de un cantero: una grilla de `paso` metros, desordenada, a más de 2,5 m del borde */
  const monte = (pts, paso, sem = 0) => {
    const q = c.adentro(pts, 2.5), xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]), out = []; let i = sem * 97;
    for (let x = Math.min(...xs) + paso * 0.4; x < Math.max(...xs); x += paso) for (let z = Math.min(...zs) + paso * 0.4; z < Math.max(...zs); z += paso) {
      const px = x + (azar(++i) - 0.5) * paso * 0.7, pz = z + (azar(++i) - 0.5) * paso * 0.7; if (dentro(q, px, pz)) out.push([px, pz, azar(++i)]);
    }
    return out;
  };

  // ------------------------------------------------------------------------------------------------ las piezas
  const bola = (L, r, x, y, z, o = BRONCE, sy = 1) => L.put(new THREE.SphereGeometry(r, 6, 4).scale(1, sy, 1).translate(x, y, z), PINTADO, { H: y + r, ...o });
  /** un farol: el poste de hierro con la linterna (los de gas y los de 1951) o con un globo blanco (los de 1918) */
  const farol = (x, z, h = 3.3, globo = false) => {
    const L = en(x, z); L.cilindro(globo ? 0.14 : 0.1, h, 0, 0, 0, HIERRO, 5, 0.06);
    if (globo) bola(L, 0.32, 0, h + 0.26, 0, LUZ); else L.caja(0.38, 0.56, 0.38, 0, h, 0, PINTADO, LUZ);
  };
  /** un banco de listones, con respaldo: a lo largo del rumbo que se le dé, mirando hacia la derecha de ese rumbo */
  const PERFIL = new THREE.Shape([[-0.27, 0.36], [0.25, 0.36], [0.25, 0.46], [-0.17, 0.46], [-0.17, 0.92], [-0.27, 0.92]].map(([a, b]) => new THREE.Vector2(a, b)));
  const banco = (x, z, rumbo) => en(x, z).put(new THREE.ExtrudeGeometry(PERFIL, { depth: 2, bevelEnabled: false }).translate(0, 0, -1).rotateY(Math.PI / 2 - rumbo), PINTADO, { H: 0.92, ...MADERA });
  /** un copón sobre su pedestal (los de la entrada de Centro América y los de los redondeles de 1940) */
  const copon = (x, z, ped = 1.5, flores = true) => {
    const L = en(x, z);
    L.caja(0.95, ped, 0.95, 0, 0, 0, PIEDRA, { tono: BLANCO }); L.caja(1.2, 0.18, 1.2, 0, ped, 0, PIEDRA, { tono: BLANCO });
    L.cilindro(0.16, 0.5, 0, ped + 0.18, 0, PIEDRA, 6, 0.55, { tono: BLANCO });
    if (flores) bola(L, 0.5, 0, ped + 0.85, 0, { pinta: [PINTA.FLORES, 0.55] }, 0.7);
  };
  /** una carreta: la caja larga sobre el eje, el toldo en bóveda, las dos ruedas altas y el pértigo apoyado en el suelo */
  const carreta = (x, z, rumbo, toldo = PINTA.LONA) => {
    const L = en(x, z), pone = (g, tono, claro, H) => L.put(g.rotateY(rumbo), PINTADO, { pinta: [tono, claro], H });
    pone(new THREE.BoxGeometry(1.5, 1.25, 4).translate(0, 1.75, 0), PINTA.MADERA, 0.45, 2.4);
    pone(new THREE.CylinderGeometry(0.78, 0.78, 4.1, 8).rotateX(Math.PI / 2).scale(1, 0.9, 1).translate(0, 2.32, 0), toldo, 0.8, 3);
    for (const s of [-1, 1]) pone(new THREE.CylinderGeometry(1.05, 1.05, 0.14, 10).rotateZ(Math.PI / 2).translate(s * 0.95, 1.05, 0.2), PINTA.MADERA, 0.35, 2.1);
    pone(new THREE.BoxGeometry(0.14, 0.14, 4).rotateX(0.27).translate(0, 0.62, 3.9), PINTA.MADERA, 0.4, 1.2);
  };
  const flores = (pts) => T.tapete(pts, PINTA.FLORES, { y: 0.8, claro: 0.6 });

  // ------------------------------------------------------------------------------------------------ 1867: el mercado
  // Unas pocas carretas en tandas, con el pértigo para el mismo lado, como en la foto de Panunzi (que mira hacia los
  // depósitos del ferrocarril: ahí estaban las más). Las de toldo oscuro son las de cuero.
  c.epoca(0, 1);
  [[40, 38, 0.2], [45, 47, 0.05], [39, 56, 0.3], [47, 66, 0.1], [41, 76, 0.25], [52, 55, -0.1], [30, 86, 0.15],
    [35, 45, 0.12], [50, 75, 0.2], [34, 68, 0.02], [56, 44, 0.3], [26, 74, 0.18],
    [-12, -34, 1.7], [-3, -37, 1.55], [6, -33, 1.8], [-18, -22, 1.6], [-8, -20, 1.75], [2, -19, 1.6], [-14, -46, 1.75],
    [18, -70, 2.9], [27, -64, 3.05], [22, -80, 3.2], [-24, 30, 0.9]]
    .forEach(([x, z, r], i) => carreta(x, z, r, i % 3 === 1 ? PINTA.MADERA : i % 3 === 2 ? PINTA.OCRE : PINTA.LONA));

  // ------------------------------------------------------------------------------------------------ las calzadas
  // En el suelo queda el descampado del mercado, de pared a pared. Las calles que rodean la plaza van de cordón a
  // cordón por debajo de todo: Rivadavia (acá ya ancha en la foto de Boote), Piedad —después Bartolomé Mitre—, Ecuador
  // y Centro América —Pueyrredón—. De adoquín (Llanes: «la calle ya adoquinada»), y lisas en 1940, como las pinta el suelo ahí.
  const calzada = T.recto(153.5, 273, 12.25, -1.5); // (de los frentes de Rivadavia a la estación y de los de Ecuador a la recova, menos las veredas)
  c.epoca(1, 6); T.tapete(calzada, PINTA.ADOQUIN, { y: 0.06, claro: 0.88 });
  c.epoca(6); T.tapete(calzada, PINTA.ASFALTO, { y: 0.06, claro: 0.82 });

  // ------------------------------------------------------------------------- 1888 a 1910: la plaza de Alvear
  {
    c.epoca(1, 5);
    // el terreno levantado, con su cordón: la vereda de tierra de la foto de Boote, de unos nueve metros
    T.cantero(borde(0), { alto: 0.2, tono: PINTA.GRANZA, cordon: 0.4, claro: 0.9 });
    // Los canteros, cercados por el murete. Del medio para afuera: el óvalo, los dos largos de los costados, las
    // cuñas entre el eje y las diagonales, los triángulos de afuera y las medialunas de las puntas.
    const G = borde(9), MURETE = { alto: 0.5 }, DA = 0.76, DB = 0.65; // (las diagonales van del óvalo a donde empiezan las medialunas)
    const diagonal = (pts, sx, sz, lado) => corta(pts, -lado * DA * sx, lado * DB * sz, -2.2 - lado * (DA * sx * XC - DB * sz * ZC));
    const canteros = [];
    for (const sx of [-1, 1]) {
      canteros.push(cuarto(G, sx, 1, 17, -20.5, 20.5));
      for (const sz of [-1, 1]) canteros.push(cuarto(G, sx, sz, 3, 59.5), diagonal(cuarto(G, sx, sz, 3, 24, 54.5), sx, sz, -1), diagonal(cuarto(G, sx, sz, 3, 25, 54.5), sx, sz, 1));
    }
    for (const p of canteros) T.cantero(p, MURETE);
    T.cantero(T.ovalo(XC, ZC, 10.5, 17.5, 28), MURETE); flores(T.ovalo(XC, ZC, 5.5, 10, 18));
    // la entrada de Centro América: los dos pilares con sus copones florecidos
    for (const s of [-1, 1]) copon(XC + s * 3.9, ZE - 9.4, 2.3);
    // los faroles a gas, en el cordón y alrededor del óvalo, y los bancos de la vereda, mirando a la calle
    for (const [x, z] of ronda(borde(1.2), 32)) farol(x, z);
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) farol(XC + sx * 11.5, ZC + sz * 16.5);
    for (const [x, z, a] of ronda(borde(6.3), 21, 0)) banco(x, z, a);
    // Los árboles, que crecen: la hilera nueva del cordón (en la foto de 1890 son varas; en «Estacion once en 1910»,
    // ya árboles) y el monte de los canteros, que Llanes recuerda profuso.
    const crece = (x, z, r, k1 = 0.5, k2 = 0.75) => { c.epoca(1, 2); T.arbol(x, z, r * k1); c.epoca(2, 3); T.arbol(x, z, r * k2); c.epoca(3, 5); T.arbol(x, z, r); };
    for (const [x, z] of ronda(borde(2.6), 9.2)) crece(x, z, 3, 0.45, 0.72);
    canteros.forEach((p, i) => { for (const [x, z, t] of monte(p, 12.5, i + 1)) crece(x, z, 3.9 + t * 1.8, 0.6, 0.8); });
    // el ombú del lado de Ecuador y Piedad, que venía de los días del mercado
    c.epoca(1, 5); T.arbol(XC + 31, ZC - 86, 8.5);
    // la bomba de agua para los caballos y los carros aguadores, en la esquina de Rivadavia y Centro América
    c.epoca(2, 6); { const L = en(-39, 110); L.cilindro(0.2, 1.5, 0, 0, 0, HIERRO, 6, 0.14); L.caja(0.16, 0.16, 0.9, 0, 1.25, 0.4, HIERRO); L.caja(1.5, 0.45, 0.7, 0, 0, 1.1, PIEDRA, { tono: GRIS }); }
  }

  // ------------------------------------------------------------------------- 1921 y 1940: el piso y la hilera del cordón
  c.epoca(5); T.cantero(borde(0), { alto: 0.2, tono: PINTA.BALDOSA, cordon: 0.4, claro: 0.96 });
  // (los árboles que se plantaron cuando se rehízo la plaza, a cuatro metros del cordón: nuevos en 1921, crecidos en 1940)
  for (const [x, z] of ronda(borde(4), 8.6)) { c.epoca(5, 6); T.arbol(x, z, 2.3); c.epoca(6); T.arbol(x, z, 3.9); }

  // ------------------------------------------------------------------------- 1921: después del subterráneo
  {
    c.epoca(5, 6);
    const G = borde(8), CESPED = { alto: 0.4 };
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      // el cantero largo de cada cuarto (con la punta comida por la rotonda del óvalo) y el de la punta de la plaza
      const largo = corta(cuarto(G, sx, sz, 4, 3, 71), -0.8 * sx, -0.6 * sz, -14.6 - 0.8 * sx * XC - 0.6 * sz * ZC);
      T.cantero(largo, CESPED); T.cantero(cuarto(G, sx, sz, 4, 76), CESPED);
      for (const [x, z, t] of monte(largo, 21, 40 + sx + 3 * sz)) T.arbol(x, z, 2.4 + t * 0.7);
      farol(XC + sx * 9.5, ZC + sz * 13, 4.6, true);
      for (const v of [45, 90]) farol(XC + sx * 5.2, ZC + sz * v, 4.6, true);
    }
    T.cantero(T.ovalo(XC, ZC, 8, 11, 24), CESPED); flores(T.ovalo(XC, ZC, 4.5, 6.5, 16));
    for (const [x, z] of ronda(borde(1.3), 41)) farol(x, z, 4.6, true);
  }

  // ------------------------------------------------------------------------- 1940: la explanada y el mausoleo
  {
    c.epoca(6);
    // Las hileras de adentro: la segunda vuelta (que deja abierta la boca de la explanada hacia Pueyrredón) y, del lado
    // de Mitre, dos más, derechas. Entre unas y otras queda la explanada, de unos 68 metros de ancho.
    for (const [x, z] of ronda(borde(12.5), 8.3, 0)) if (!(z > ZE - 20 && x > XS + 20 && x < XN - 25)) T.arbol(x, z, 3.7);
    for (let z = -74; z <= 91; z += 8.25) { T.arbol(42, z + 4, 3.6); T.arbol(31, z, 3.4); }
    // los arbolitos de los alcorques redondos de la punta del este, y los tres redondeles con copón que se ven en la foto
    for (const [x, z] of [[-8.8, 60], [4.7, 66], [-9.5, 91.8], [6, 95], [-17.6, 107], [18.9, 41]]) { T.cantero(T.ovalo(x, z, 1.5, 1.5, 10), { alto: 0.45, cordon: 0.3 }); T.arbol(x, z, 1.7); }
    for (const [x, z] of [[-16.9, -101.3], [38.5, -47.3], [39.8, -16.2]]) { T.cantero(T.ovalo(x, z, 2.4, 2.4, 14), { alto: 0.6 }); copon(x, z, 1.4, false); }
    // Los bancos claros: el cuadro que rodea el monumento (de a tres, en las esquinas) y las dos tandas de cada punta.
    const poyo = (x, z, alo) => en(x, z).caja(alo === 'x' ? 2.2 : 0.55, 0.45, alo === 'x' ? 0.55 : 2.2, 0, 0, 0, PINTADO, LUZ);
    for (const s of [-1, 1]) for (const d of [13.5, 17, 20.5]) { poyo(s * d, -30.4, 'x'); poyo(s * d, 32.4, 'x'); poyo(-26.3, s * (d + 4), 'z'); poyo(26.3, s * (d + 4), 'z'); }
    for (const z of [-75, -70, -65, -60]) { poyo(-12.2, z, 'z'); poyo(16.5, z, 'z'); }
    for (const z of [60, 65, 70, 75, 80]) { poyo(-13.5, z, 'z'); poyo(15.5, z, 'z'); }
    // los faroles de linterna, al borde de la explanada y en las esquinas del cuadro
    for (let z = -70; z <= 95; z += 33) { farol(-33.5, z, 4); farol(27, z, 4); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) farol(sx * 23.5, 1 + sz * 28, 4);

    // El mausoleo, sobre el eje, a lo largo de Rivadavia. A los costados, dos canteros de césped con un macizo oscuro en
    // cada punta (los cuatro cuadros que se ven en la foto aérea); por las cabeceras se llega a las puertas.
    const ZM = 1.35;
    for (const s of [-1, 1]) { T.cantero(T.recto(10, 43.6, s * 14.4, ZM + 0.4, 1.5), { alto: 0.5 }); for (const e of [-1, 1]) T.tapete(T.recto(7.6, 7.6, s * 14.4, ZM + 0.4 + e * 16.8, 1), PINTA.VERDE, { y: 0.8, claro: 0.5 }); }
    const M = en(0, ZM), gr = (g, H) => M.put(g, PINTADO, { H, ...GRANITO });
    /** un cuerpo en talud: de w × d abajo, y `mete` metros más chico por cada lado arriba */
    const talud = (w, d, h, y, mete) => {
      const g = new THREE.BoxGeometry(w, h, d), p = g.attributes.position;
      for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) p.setXYZ(i, p.getX(i) * (1 - (2 * mete) / w), p.getY(i), p.getZ(i) * (1 - (2 * mete) / d));
      g.computeVertexNormals(); gr(g.translate(0, y + h / 2, 0), y + h);
    };
    const bloque = (w, h, d, x, y, z) => gr(new THREE.BoxGeometry(w, h, d).translate(x, y + h / 2, z), y + h);
    bloque(16.6, 0.5, 26, 0, 0, 0);       // el escalón
    talud(15.4, 24.8, 3.3, 0.5, 1);       // el basamento, de caras tendidas
    bloque(10.8, 2.2, 20, 0, 3.8, 0);     // el cuello, metido, con las guirnaldas y los niños
    bloque(13.4, 3.3, 22.8, 0, 6, 0);     // el bloque de arriba, el del letrero («La República Argentina a Bernardino Rivadavia»)
    bloque(12.2, 0.2, 21.6, 0, 9.3, 0);
    for (const s of [-1, 1]) {
      // el bronce sentado del costado, sobre su pedestal: el torso, las piernas que cuelgan y la cabeza
      bloque(3, 2.3, 3.2, s * 8.6, 0, 0);
      M.caja(1.5, 1.1, 2, s * 9.1, 2.3, 0, PINTADO, BRONCE); M.caja(1.3, 1.9, 1.7, s * 10.2, 0.9, 0, PINTADO, BRONCE);
      M.cilindro(0.95, 2.5, s * 8.7, 3.2, 0, PINTADO, 7, 0.7, BRONCE); bola(M, 0.55, s * 8.75, 6.2, 0);
      // la puerta de la cripta, en un cuerpo que sale de la cabecera, con el niño de granito arriba (una en cada punta, cruzadas)
      const xp = s * 5.6, zp = s * 13.4;
      bloque(3.8, 5.3, 3.4, xp, 0, zp); bloque(1.5, 0.5, 1.5, xp, 5.3, zp); bloque(0.7, 1.7, 0.6, xp, 5.8, zp);
      M.vano(1.5, 3, xp, 0.5, zp + s * 1.73, s > 0 ? '+z' : '-z', false);
    }
  }
  c.epoca(0);
}
