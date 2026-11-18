// Los edificios de 1867 que faltaban: las dos estaciones que el plano dibuja y que hasta acá eran casas genéricas, y
// el Congreso viejo. Cada uno en su origen (c.lugar), para que el visor lo resalte solo.
//
// · La Estación del Parque (Ferrocarril del Oeste), en la manzana de Cerrito, Tucumán, Libertad y Viamonte.
//     - 1867: la de 1857, de madera. No encontré foto ni grabado de dominio público: sale del plano, que dibuja el
//       cobertizo sobre la punta de la vía (8,4 × 43 m), un cuerpo angosto sobre Tucumán (11 × 31 m), el andén entre
//       los dos, un patio en la esquina y una casilla suelta; y de lo que se sabe («una construcción de montaje en
//       seco, de madera, con un cobertizo lateral»: Tartarini, «Arquitectura ferroviaria», citado en Wikipedia). Las
//       alturas, los techos y el color son supuestos.
//     - 1888: la terminal de mampostería de 1872, que es la de todas las fotos. Sale de «Ferrocarril Oeste de Buenos
//       Aires Estación del Parque», de Christiano Junior (el lado de Libertad, por donde entraban los trenes: el gran
//       tímpano entre dos torrecitas con farol y las dos alas de arcos, con el pretil quebrado), de «Estación Parque
//       Ferrocarril del Oeste (fachada Cerrito)» (el frente: el portal de arco con frontis y cuatro ventanas de arco
//       por lado) y de «Estación del Parque (1)» (adentro: la nave de hierro entre las dos alas). Los trenes dejaron
//       de llegar el 1 de enero de 1883 y desde 1884 fue del Estado Mayor del Ejército: en 1888 ya no tiene vías. Se
//       demolió para el Teatro Colón, cuya obra empezó en 1890: en 1895 ya no está.
// · La Estación del Sud (la primera Constitución, abierta en agosto de 1865 y reemplazada por la de 1887). Sale de
//   «Carretas frente a estacion constitucion» (anónima, c. 1865): el edificio bajo y blanco sobre la calle Brasil, de
//   nueve vanos de arco con un frontis sobre los tres del medio y un cuerpo más alto detrás; la verja de pilares del
//   costado y, atrás, el cobertizo de los andenes, con su linterna a lo largo de la cumbrera. La planta es la del
//   plano: el edificio (15,5 × 35 m), el patio de la mesa giratoria y el cobertizo (25 × 65 m), más los dos galpones.
// · El Congreso Nacional (de Jonás Larguía, inaugurado el 12 de mayo de 1864), en la ochava de Balcarce y Victoria.
//   Sesionó ahí hasta 1905; después fue el Archivo General de la Nación y se demolió en 1942 (queda el recinto, dentro
//   del edificio del Banco Hipotecario): en esta línea de tiempo está siempre. Sale de «Congreso (Junior, 1876)», de
//   Christiano Junior, y de «MG-002-0038 Antiguo Congreso Nacional» (anónima): siete vanos en dos pisos, los tres del
//   medio abiertos en un pórtico de arcos con rejas y frontis con el escudo, y a cada lado dos ventanas de arco con una
//   luneta encima; atrás, la media naranja del recinto. El plano dibuja la ochava (64 m), no el edificio: el lugar
//   exacto sobre ella es supuesto, igual que las dos casas de altos que la completan (las fotos las muestran a cada lado).
// · La Manzana de las Luces (la Universidad y el Colegio Nacional) no está: las fotos que hay del Colegio muestran la
//   portada que se le hizo después de 1884, no el frente colonial de 1867, y la fachada de la Universidad sobre Perú es
//   «de la década de 1860», sin año. Sin una imagen de cómo eran en 1867, sería inventarlos.
// Todas las fotos son de Wikimedia Commons, de dominio público. Las alturas están medidas a ojo sobre ellas.
export default function (c) {
  const { THREE, PIEDRA, TINTA, PIZARRA, CASA, PINTADO, PINTA, BLANCO, CREMA, ROSA, GRIS } = c;
  const GIRO = { '+z': 0, '-z': Math.PI, '+x': Math.PI / 2, '-x': -Math.PI / 2 };
  const madera = { pinta: [PINTA.MADERA, 0.5] }, chapa = { pinta: [PINTA.CHAPA, 0.62] }, tabla0 = { pinta: [PINTA.LONA, 0.8] };

  // -------------------------------------------------------------------------------------------- piezas sueltas
  /** Un muro con los vanos abiertos de verdad: de u0 a u1 a lo largo de la pared, h de alto desde y, G de espesor.
   *  `cara`: hacia dónde mira; `fijo`: dónde queda el paramento. huecos: [u del medio, ancho, alto, desde, con arco]. */
  const muro = (T, cara, fijo, u0, u1, y, h, huecos, G = 0.6, kind = PIEDRA, o) => {
    const e = cara === '-z' || cara === '+x' ? -1 : 1, a = Math.min(u0 * e, u1 * e), b = Math.max(u0 * e, u1 * e); // (al girarlo, esas dos caras quedan en espejo)
    const s = new THREE.Shape(); s.moveTo(a, 0); s.lineTo(b, 0); s.lineTo(b, h); s.lineTo(a, h); s.closePath();
    for (const [u, w, hh, y0 = 0, arco = true] of huecos) {
      const p = new THREE.Path(), cx = u * e, r = w / 2, yb = Math.max(0.04, y0), top = y0 + hh;
      p.moveTo(cx - r, yb); p.lineTo(cx + r, yb);
      if (arco) { p.lineTo(cx + r, top - r); p.absarc(cx, top - r, r, 0, Math.PI, false); } else { p.lineTo(cx + r, top); p.lineTo(cx - r, top); }
      p.closePath(); s.holes.push(p);
    }
    const g = new THREE.ExtrudeGeometry(s, { depth: G, bevelEnabled: false, curveSegments: 5 }).translate(0, 0, -G).rotateY(GIRO[cara]);
    T.put(cara.endsWith('z') ? g.translate(0, y, fijo) : g.translate(fijo, y, 0), kind, { H: y + h, ...o });
  };
  /** un paño parado sobre una pared (la sombra de un pórtico, un cartel): de u0 a u1, de h de alto desde y */
  const pano = (T, cara, fijo, u0, u1, y, h, kind = TINTA, o) => {
    const g = new THREE.PlaneGeometry(Math.abs(u1 - u0), h).rotateY(GIRO[cara]);
    T.put(cara.endsWith('z') ? g.translate((u0 + u1) / 2, y + h / 2, fijo) : g.translate(fijo, y + h / 2, (u0 + u1) / 2), kind, o);
  };
  /** un techo a dos aguas como T.tejado, pero de lo que se diga (chapa, madera): la cumbrera a lo largo de `along` */
  const aguas = (T, w, d, h, x, y, z, along = 'x', kind = PINTADO, o = chapa) => {
    const half = (along === 'x' ? d : w) / 2, len = along === 'x' ? w : d, s = new THREE.Shape(); s.moveTo(-half, 0); s.lineTo(half, 0); s.lineTo(0, h); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false }).translate(0, 0, -len / 2); if (along === 'x') g.rotateY(Math.PI / 2);
    T.put(g.translate(x, y, z), kind, o);
  };
  /** un frontis: el triángulo, de `ancho` a lo largo de la pared y `fondo` de espesor, mirando hacia `cara` */
  const frontis = (T, ancho, alto, fondo, x, y, z, cara, kind = PIEDRA, o) => {
    const s = new THREE.Shape(); s.moveTo(-ancho / 2, 0); s.lineTo(ancho / 2, 0); s.lineTo(0, alto); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: fondo, bevelEnabled: false }).translate(0, 0, -fondo / 2); if (cara.endsWith('x')) g.rotateY(Math.PI / 2);
    T.put(g.translate(x, y, z), kind, { H: y + alto, ...o });
  };
  /** una tabla parada, de dos caras: atravesada a z o, con `deLado`, a x */
  const tabla = (T, w, h, x, y, z, deLado, kind = TINTA, o) => { for (const a of [0, Math.PI]) T.put(new THREE.PlaneGeometry(w, h).rotateY(a + (deLado ? Math.PI / 2 : 0)).translate(x, y + h / 2, z), kind, o); };
  /** una reja de (x0, z0) a (x1, z1): dos pasamanos y un barrote cada tanto */
  const reja = (T, x0, z0, x1, z1, y, alto, cada = 0.6, kind = TINTA, o) => {
    const deLado = Math.abs(z1 - z0) > Math.abs(x1 - x0), l = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(l / cada));
    for (const k of [0.12, 0.92]) T.caja(deLado ? 0.07 : l, 0.07, deLado ? l : 0.07, (x0 + x1) / 2, y + alto * k, (z0 + z1) / 2, kind, o);
    for (let i = 0; i <= n; i++) tabla(T, 0.07, alto, x0 + ((x1 - x0) * i) / n, y, z0 + ((z1 - z0) * i) / n, deLado, kind, o);
  };
  /** una verja: pilares de material cada `paso` metros, un murete y la reja entre ellos */
  const verja = (T, x0, z0, x1, z1, paso = 4, alto = 2.3, tono = BLANCO) => {
    const l = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(l / paso)), deLado = Math.abs(z1 - z0) > Math.abs(x1 - x0);
    T.caja(deLado ? 0.35 : l, 0.6, deLado ? l : 0.35, (x0 + x1) / 2, 0, (z0 + z1) / 2, PIEDRA, { tono });
    for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n, z = z0 + ((z1 - z0) * i) / n; T.caja(0.6, alto, 0.6, x, 0, z, PIEDRA, { tono }); T.caja(0.8, 0.18, 0.8, x, alto, z, PIEDRA, { tono }); }
    for (let i = 0; i < n; i++) reja(T, x0 + ((x1 - x0) * (i + 0.08)) / n, z0 + ((z1 - z0) * (i + 0.08)) / n, x0 + ((x1 - x0) * (i + 0.92)) / n, z0 + ((z1 - z0) * (i + 0.92)) / n, 0.6, alto - 0.9, 0.5);
  };
  /** una vía: los dos rieles, de x0 a x1, con el eje en z */
  const via = (T, x0, x1, z) => { for (const s of [-0.84, 0.84]) T.caja(Math.abs(x1 - x0), 0.16, 0.1, (x0 + x1) / 2, 0.14, z + s, TINTA); };
  /** un cobertizo de madera: los postes, el techo de chapa a dos aguas (la cumbrera a lo largo de x) y los faldones */
  const cobertizo = (T, x0, x1, z0, z1, alero, cumbre, cada = 6) => {
    const L = x1 - x0, W = z1 - z0, xc = (x0 + x1) / 2, zc = (z0 + z1) / 2, n = Math.max(1, Math.round(L / cada));
    for (let i = 0; i <= n; i++) for (const z of [z0 + 0.2, z1 - 0.2]) T.caja(0.24, alero, 0.24, x0 + 0.2 + ((L - 0.4) * i) / n, 0, z, PINTADO, madera);
    aguas(T, L + 1, W + 1.2, cumbre - alero, xc, alero, zc, 'x');
    for (const z of [z0, z1]) T.caja(L, 0.7, 0.12, xc, alero - 0.7, z, PINTADO, madera);
  };

  // ============================================================================== la Estación del Sud (1865–1887)
  // (x hacia el norte, que es hacia donde mira: la calle Brasil y el mercado de carretas; z hacia el este)
  c.epoca(0, 1);
  {
    const T = c.lugar(7146, 8188, 1, 0);
    // --- el edificio, sobre la calle: el plano le da 15,5 m de fondo y 35 de frente
    const XF = 57.4, FO = 15.5, XM = XF - FO / 2, Z0 = -15.5, Z1 = 19.6, ZC = (Z0 + Z1) / 2, AN = Z1 - Z0, H = 6.0, paso = AN / 9;
    T.caja(FO, H, AN, XM, 0, ZC, PIEDRA, { tono: BLANCO }); T.caja(FO + 0.5, 0.35, AN + 0.5, XM, H, ZC, PIEDRA, { tono: BLANCO }); T.caja(FO, 0.55, AN, XM, H + 0.35, ZC, PIEDRA, { tono: BLANCO });
    T.caja(FO + 0.2, 0.9, AN + 0.2, XM, 0, ZC, PIEDRA, { tono: GRIS }); // el zócalo
    // el frente: nueve vanos de arco (dos puertas a los lados del medio) y el cuerpo del medio, apenas salido, con su frontis
    for (let i = 0; i < 9; i++) { const z = Z0 + (i + 0.5) * paso, puerta = i === 3 || i === 5, medio = i > 2 && i < 6; T.vano(puerta ? 1.9 : 1.35, puerta ? 3.9 : 2.7, XF + (medio ? 0.46 : 0.06), puerta ? 0 : 1.5, z, '+x'); }
    T.caja(0.4, H + 0.9, paso * 3 + 0.5, XF + 0.2, 0, ZC, PIEDRA, { tono: BLANCO }); T.caja(1.1, 0.4, paso * 3 + 1.1, XF + 0.1, H + 0.9, ZC, PIEDRA, { tono: BLANCO });
    frontis(T, paso * 3 + 1.1, 2.1, 1.1, XF + 0.1, H + 1.3, ZC, '+x', PIEDRA, { tono: BLANCO });
    pano(T, '+x', XF + 0.68, ZC - 4.4, ZC + 4.4, H + 0.05, 0.5); // (el letrero: «Ferro Carril del Sud»)
    // los costados y el contrafrente, que da al patio de la mesa giratoria
    for (const [zz, cara] of [[Z0 - 0.06, '-z'], [Z1 + 0.06, '+z']]) T.fila(3, XF - FO + 1.5, XF - 1.5, 1.35, 2.7, 1.5, zz, cara);
    T.fila(7, Z0 + 2, Z1 - 2, 1.6, 3.4, 0, XF - FO - 0.06, '-x');
    // el cuerpo más alto de atrás del frontis, y las chimeneas
    T.caja(6.5, 2.7, 9.5, XM - 1.5, H + 0.9, ZC, PIEDRA, { tono: BLANCO }); T.caja(7, 0.3, 10, XM - 1.5, H + 3.6, ZC, PIEDRA, { tono: BLANCO });
    for (const s of [-1, 1]) { T.vano(0.9, 1.3, XM + 1.76, H + 1.7, ZC + s * 2.3, '+x'); T.caja(0.7, 1.5, 0.7, XM + 1, H + 0.9, ZC + s * 11, PIEDRA, { tono: BLANCO }); }
    // --- el patio: la mesa giratoria, la verja de pilares del lado del mercado y la tapia del otro
    const XP0 = 6.75, XP1 = XF - FO;
    verja(T, XP0 + 0.6, -14.85, XP1 - 0.4, -14.85, 4.3);
    T.caja(XP1 - XP0, 2.4, 0.4, (XP0 + XP1) / 2, 0, 10.4, PIEDRA, { tono: BLANCO });
    T.tapete(T.recto(XP1 + 58, 21, (XP1 - 58) / 2, -2.4), PINTA.BALASTO, { y: 0.1, claro: 0.7 });
    T.cantero(T.ovalo(33, -2.4, 5.4, 5.4, 18), { alto: 0.3, tono: PINTA.BALASTO, cordon: 0.5, claro: 0.6 });
    T.caja(10, 0.3, 2.4, 33, 0.3, -2.4, PINTADO, madera); via(T, 28, 38, -2.4);
    // --- el cobertizo de los andenes (25 × 65 m en el plano): columnas de hierro, techo de chapa a dos aguas con la
    // linterna a lo largo de la cumbrera, los tímpanos de tablas y, adentro, los dos andenes y tres vías
    const CX0 = -58, CX1 = 6.75, CZ0 = -14.85, CZ1 = 10.1, CZ = (CZ0 + CZ1) / 2, CW = CZ1 - CZ0, CL = CX1 - CX0, CXM = (CX0 + CX1) / 2, AL = 5.6, CU = 10;
    for (let i = 0; i <= 10; i++) for (const z of [CZ0 + 0.3, CZ1 - 0.3]) T.cilindro(0.17, AL, CX0 + 0.3 + ((CL - 0.6) * i) / 10, 0, z, TINTA, 5);
    aguas(T, CL + 0.8, CW + 1, CU - AL, CXM, AL, CZ, 'x');
    T.caja(CL - 7, 1.1, 3.6, CXM, CU - 0.9, CZ, TINTA); aguas(T, CL - 6.2, 4.6, 0.9, CXM, CU + 0.2, CZ, 'x');
    for (const x of [CX0, CX1]) { T.caja(0.2, 1.1, CW, x, AL - 1.1, CZ, PINTADO, madera); aguas(T, 0.2, CW, CU - AL - 0.15, x, AL, CZ, 'x', PINTADO, madera); }
    for (const z of [CZ0, CZ1]) T.caja(CL, 0.8, 0.14, CXM, AL - 0.8, z, PINTADO, madera);
    for (const s of [-1, 1]) T.caja(CL - 1, 0.9, 3.6, CXM, 0, CZ + s * (CW / 2 - 2.1), PIEDRA, { tono: GRIS });
    for (const k of [-4.6, 0, 4.6]) via(T, CX0 - 22, k ? 16 : 28, CZ + k);
    // (la entrada del lado del mercado: dos pilares y el portón abierto, en la punta de la verja)
    for (const s of [-1, 1]) { T.caja(0.9, 3.1, 0.9, CX1 - 1.5 + s * 2.4, 0, CZ0 - 0.6, PIEDRA, { tono: BLANCO }); T.caja(1.1, 0.25, 1.1, CX1 - 1.5 + s * 2.4, 3.1, CZ0 - 0.6, PIEDRA, { tono: BLANCO }); }
  }
  { // el galpón del oeste (el plano lo dibuja entre las letras de «Estación principal»: 10 × 46 m), de madera
    const T = c.lugar(7056, 8134.5, 1, 0);
    T.caja(46, 4.4, 10, 0, 0, 0, PINTADO, madera); aguas(T, 47, 11.2, 2.8, 0, 4.4, 0, 'x');
    T.fila(5, -20, 20, 3, 3.4, 0, 5.06, '+z', false); T.fila(5, -20, 20, 3, 3.4, 0, -5.06, '-z', false);
  }
  { // y el de las cargas, del lado del este: un cobertizo largo y angosto sobre su vía (8 × 91 m en el plano)
    const T = c.lugar(7057, 8217, 1, 0);
    cobertizo(T, -45.5, 45.5, -4, 4, 4.2, 6.4, 6.5);
    T.caja(90, 0.9, 5, 0, 0, 0.9, PIEDRA, { tono: GRIS });
  }

  // ======================================================================================== el Congreso (1864–1942)
  // (x a lo largo de la ochava, hacia la calle Victoria —la derecha de quien lo mira—; z hacia afuera, a la plaza)
  c.epoca(0);
  const OCH = [0.691, -0.723]; // el rumbo de la ochava en el plano: de Balcarce [10171, 9741] a Victoria [10237, 9672]
  {
    const T = c.lugar(10200, 9711, ...OCH), o = { tono: BLANCO };
    const MED = 6.5, ALA = 9.5, W = MED + ALA, FO = 10, P = 3.6; // medio cuerpo del medio, cada ala, medio frente, el fondo del cuerpo de adelante y el del pórtico
    const IMP = 5.9, COR = 10, AT = 11.4, PA = 4.33; // la imposta, la cornisa, el pretil y el paso de los arcos del medio
    // las alas, de dos vanos: abajo la ventana de arco con reja (la primera de la izquierda es una puerta); arriba, la
    // luneta dentro de un arco ciego, con medallones en las enjutas
    for (const s of [-1, 1]) {
      const xc = s * (MED + ALA / 2);
      T.caja(ALA, COR, FO, xc, 0, -FO / 2, PIEDRA, o); T.caja(ALA + 0.1, 0.28, 0.3, xc, IMP, 0.08, PIEDRA, o);
      for (const k of [-1, 1]) {
        const x = xc + k * 2.3, puerta = s < 0 && k < 0;
        T.vano(2, puerta ? 4.5 : 3.6, x, puerta ? 0 : 0.9, 0.06, '+z'); T.vano(2.3, 1.15, x, 6.45, 0.06, '+z');
        T.put(new THREE.RingGeometry(2.0, 2.28, 10, 1, 0, Math.PI).translate(x, IMP + 0.3, 0.09), PIEDRA, { tono: GRIS });
      }
      for (const x of [xc, xc - s * (ALA / 2 - 0.25)]) T.put(new THREE.CircleGeometry(0.42, 10).translate(x, 8.75, 0.08), PIEDRA, { tono: GRIS });
      // el pretil: pilares y, entre ellos, la reja
      for (const k of [-1, 0, 1]) T.caja(0.7, AT - COR - 0.3, 0.7, xc + k * (ALA / 2 - 0.4), COR + 0.3, -0.5, PIEDRA, o);
      for (const k of [-1, 1]) reja(T, xc + k * 0.5, -0.5, xc + k * (ALA / 2 - 0.9), -0.5, COR + 0.3, 1, 0.45);
    }
    // el cuerpo del medio: el pórtico de tres arcos sobre pilares, abierto de verdad, con las rejas; atrás, la pared
    // de las puertas, en sombra
    muro(T, '+z', 0.25, -MED, MED, 0, COR, [-1, 0, 1].map((k) => [k * PA, 3.3, 8.3, 0, true]), 0.95, PIEDRA, o);
    T.caja(2 * MED, COR, FO - P, 0, 0, -P - (FO - P) / 2, PIEDRA, o); T.caja(2 * MED, COR - 8.6, P, 0, 8.6, -P / 2, PIEDRA, o);
    pano(T, '+z', -P + 0.05, -MED, MED, 0, 8.6); T.caja(2 * MED, 0.3, P, 0, 0, -P / 2 + 0.2, PIEDRA, { tono: GRIS });
    for (const k of [-1, 0, 1]) { reja(T, k * PA - 1.6, -0.4, k * PA + 1.6, -0.4, 0.3, 4.3, 0.36); T.caja(3.3, 0.5, 0.1, k * PA, 4.6, -0.4, TINTA); }
    for (const k of [-1.5, -0.5, 0.5, 1.5]) T.caja(1.05, 0.4, 1.2, k * PA, IMP - 0.2, -0.2, PIEDRA, o); // (los capiteles de los pilares)
    for (const k of [-0.5, 0.5]) T.put(new THREE.CircleGeometry(0.42, 10).translate(k * PA, 8.9, 0.27), PIEDRA, { tono: GRIS });
    // la cornisa, el ático del medio y el frontis con el escudo; arriba, el asta
    T.caja(2 * W + 0.9, 0.42, FO + 0.6, 0, COR, -FO / 2 + 0.15, PIEDRA, o);
    T.caja(2 * MED + 0.3, 1.5, 2.2, 0, COR + 0.42, -0.9, PIEDRA, o); T.caja(2 * MED + 0.9, 0.3, 2.6, 0, COR + 1.92, -0.9, PIEDRA, o);
    frontis(T, 2 * MED + 0.9, 3, 2.4, 0, COR + 2.22, -0.9, '+z', PIEDRA, o);
    T.put(new THREE.CircleGeometry(1.05, 14).translate(0, COR + 3.25, 0.33), TINTA); T.put(new THREE.CircleGeometry(0.82, 14).translate(0, COR + 3.25, 0.36), PINTADO, { pinta: [PINTA.BRONCE, 0.75] });
    T.cilindro(0.07, 7.5, 0, COR + 5.2, -0.9, TINTA, 4);
    // lo de arriba: el cuerpo de la derecha, la claraboya de la izquierda y, más atrás, el recinto con su media naranja
    T.caja(6.4, 1.9, 4.6, W - 3.5, COR + 0.42, -4.4, PIEDRA, o); T.caja(6.9, 0.3, 5, W - 3.5, COR + 2.32, -4.4, PIEDRA, o);
    T.piramide(2.5, 1.5, -W + 6.2, COR + 0.42, -5.5, PINTADO, 4, tabla0);
    T.caja(21, 9, 17, 0, 0, -FO - 8.5, PIEDRA, o); T.caja(21.5, 0.35, 17.5, 0, 9, -FO - 8.5, PIEDRA, o);
    T.cilindro(6.6, 1.6, 0, 9.35, -FO - 8.5, PINTADO, 16, 6.6, tabla0);
    T.put(new THREE.SphereGeometry(6.6, 16, 5, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.5, 1).translate(0, 10.95, -FO - 8.5), PINTADO, tabla0);
    T.cilindro(0.9, 1.3, 0, 14.1, -FO - 8.5, PINTADO, 8, 0.9, tabla0); T.piramide(1.2, 1, 0, 15.4, -FO - 8.5, PIZARRA, 8);
    // --- las dos casas de altos que completan la ochava, cada una en su origen (no son del Congreso)
    const casa = (x0, x1, h, tono, balcon) => {
      const [px, py] = T.aPlano((x0 + x1) / 2, -5.5), V = c.lugar(px, py, ...OCH), w = x1 - x0;
      V.caja(w, h, 11, 0, 0, 0, CASA, { floors: 2, tono }); V.caja(w + 0.3, 0.35, 11.3, 0, h, 0, PIEDRA, { tono });
      if (balcon) { V.caja(w - 1.2, 0.18, 1, 0, h * 0.48, 5.95, PIEDRA, { tono }); reja(V, -w / 2 + 0.7, 6.4, w / 2 - 0.7, 6.4, h * 0.48 + 0.18, 0.95, 0.5); }
    };
    casa(-W - 12.4, -W - 0.1, 8.7, CREMA, false); casa(W + 0.1, W + 20.4, 9.3, ROSA, true);
  }

  // =========================================================================================== la Estación del Parque
  // (x hacia el este, a Cerrito: es para donde corre la vía, que viene de la plaza; z hacia el sur, a Tucumán)
  c.epoca(0, 1);
  { // la de 1857, de madera, como la dibuja el plano de 1867
    const T = c.lugar(11614, 8200, 0, 1);
    // el cobertizo de la punta de la vía (8,4 × 43 m): de tablas de la mitad para arriba, abierto abajo y en las puntas
    const CX = 21.6, CZ = 4.2, AL = 4.6, CU = 7.2;
    cobertizo(T, -CX, CX, -CZ, CZ, AL, CU, 5.4);
    for (const z of [-CZ, CZ]) T.caja(2 * CX, 1.9, 0.12, 0, AL - 2.6, z, PINTADO, madera);
    for (const x of [-CX, CX]) { aguas(T, 0.16, 2 * CZ + 0.6, CU - AL - 0.1, x, AL, 0, 'x', PINTADO, madera); T.caja(0.16, 0.9, 2 * CZ, x, AL - 0.9, 0, PINTADO, madera); }
    T.cilindro(0.06, 2.6, -CX, CU, 0, TINTA, 4); via(T, -CX - 30, CX - 1.5, -0.7); T.caja(0.5, 1.1, 2.6, CX - 1, 0, -0.7, PINTADO, madera); // (el asta y el paragolpes)
    // el cuerpo de la estación, sobre Tucumán (11 × 31 m): de tablas, con techo a dos aguas y el alero corrido sobre
    // el andén —el «cobertizo lateral»—, sostenido por postes
    const EX0 = -52.6, EX1 = -21.6, EZ0 = 10.1, EZ1 = 20.9, EL = EX1 - EX0, EXM = (EX0 + EX1) / 2, EZM = (EZ0 + EZ1) / 2, EH = 4.3;
    T.caja(EL, EH, EZ1 - EZ0, EXM, 0, EZM, PINTADO, tabla0); aguas(T, EL + 1.4, EZ1 - EZ0 + 1.4, 2.6, EXM, EH, EZM, 'x');
    for (const x of [EX0 - 0.03, EX1 + 0.03]) aguas(T, 0.14, EZ1 - EZ0 + 1.5, 2.7, x, EH, EZM, 'x', PINTADO, madera);
    T.fila(7, EX0 + 1.5, EX1 - 1.5, 1.2, 2.5, 0.2, EZ0 - 0.06, '-z', false); T.fila(7, EX0 + 1.5, EX1 - 1.5, 1, 1.7, 1.1, EZ1 + 0.06, '+z', false);
    T.vano(1.6, 2.8, EX0 - 0.06, 0.2, EZM, '-x', false); T.caja(EL + 0.2, 0.5, EZ1 - EZ0 + 0.2, EXM, 0, EZM, PINTADO, madera);
    // el andén, entre el cuerpo y la vía, y su alero
    T.caja(EL + 20, 0.8, 5.6, EXM + 10, 0, EZ0 - 2.9, PINTADO, madera);
    const gA = new THREE.BoxGeometry(EL + 1, 0.14, 6).rotateX(-0.16).translate(EXM, EH - 0.25, EZ0 - 2.9); T.put(gA, PINTADO, chapa);
    for (let i = 0; i <= 6; i++) T.caja(0.2, EH - 1.5, 0.2, EX0 + 0.4 + ((EL - 0.8) * i) / 6, 0.8, EZ0 - 5.5, PINTADO, madera);
    // el patio de la esquina de Libertad, con su cerco de tablas, y la casilla suelta del otro lado de la vía
    for (const [x0, z0, x1, z1] of [[-62.8, 6.8, -62.8, 18.2], [-62.8, 18.2, -53.3, 18.2], [-62.8, 6.8, -58, 6.8]]) reja(T, x0, z0, x1, z1, 0, 1.5, 0.3, PINTADO, tabla0);
    T.caja(6.7, 3, 5.4, -54, 0, -17.5, PINTADO, tabla0); T.cuatroAguas(7.5, 6.2, 1.6, -54, 3, -17.5); T.vano(1, 2.1, -54, 0, -14.76, '+z', false);
  }
  c.epoca(1, 2);
  { // la terminal de 1872, de mampostería, ya sin trenes: una planta en U, con el vestíbulo sobre Cerrito, un ala a
    // cada lado y, entre las dos, la nave de hierro de los andenes, que del lado de Libertad se cierra con el tímpano.
    // Llega a la esquina de Cerrito y Tucumán, como en la foto del frente, y tiene la vía vieja en el eje; el ancho
    // (44 m) y el largo (95 m, con el patio de las vías del lado de Libertad) son a ojo, igual que la cuenta de arcos
    // del costado. Las alas tienen su propio techo, más bajo que la nave («Estación del Parque (3)», desde la plaza).
    const T = c.lugar(11615.5, 8217.5, 0, 1), o = { tono: CREMA };
    const X = 47.5, Z = 22, ALA = 10.5, NA = Z - ALA, VE = 12, XV = X - VE, COR = 7.2, PR = 8.5, PQ = 9.3; // media planta, el ancho de un ala, media nave, el fondo del vestíbulo, la cornisa, el pretil y el ático de las puntas
    /** un arco pintado sobre la pared, como T.vano pero de lo que se diga (los ciegos van de gris) */
    const arco = (w, h, x, y, z, cara, kind, oo) => { const s = new THREE.Shape(), r = w / 2; s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, h - r); s.absarc(0, h - r, r, 0, Math.PI, false); s.closePath(); T.put(new THREE.ShapeGeometry(s, 5).rotateY(GIRO[cara]).translate(x, y, z), kind, oo); };
    /** el pretil quebrado: el murete y, en el medio del tramo, el frontis chato */
    const quebrado = (ancho, x, z, cara) => { const lado = cara.endsWith('x'); T.caja(lado ? 0.5 : ancho, PQ - COR - 0.3, lado ? ancho : 0.5, x, COR + 0.3, z, PIEDRA, o); T.caja(lado ? 0.7 : ancho + 0.2, 0.2, lado ? ancho + 0.2 : 0.7, x, PQ, z, PIEDRA, o); frontis(T, ancho * 0.6, 1.1, 0.5, x, PQ + 0.2, z, cara, PIEDRA, o); };
    // las dos alas y el vestíbulo, con el zócalo y la cornisa
    for (const s of [-1, 1]) {
      const z = s * (NA + ALA / 2), xm = (XV - X) / 2;
      T.caja(XV + X, COR, ALA, xm, 0, z, PIEDRA, o); T.caja(XV + X + 0.4, 0.3, ALA + 0.4, xm, COR, z, PIEDRA, o); T.caja(XV + X - 0.6, 0.5, ALA - 0.6, xm, COR + 0.3, z, PIEDRA, o);
      // el costado: la hilera de arcos (uno de cada dos es una puerta), y el pretil corrido
      for (let i = 0; i < 16; i++) { const x = -X + 3 + (i * (2 * X - 6)) / 15, puerta = i % 2 === 1; T.vano(2.2, puerta ? 5.4 : 4.3, x, puerta ? 0.3 : 1.4, s * (Z + 0.06), s > 0 ? '+z' : '-z'); }
      T.caja(2 * X, PR - COR - 0.3, 0.45, 0, COR + 0.3, s * (Z - 0.25), PIEDRA, o);
      aguas(T, XV + X - 1.4, ALA - 1.3, 1.9, xm - 0.2, COR + 0.6, z, 'x');
      // la punta del ala sobre Libertad: dos arcos (el de afuera, ciego) y el pretil quebrado
      arco(3.6, 5.6, -X - 0.06, 0.3, s * (NA + 3.1), '-x', TINTA); arco(3.6, 5.6, -X - 0.06, 0.3, s * (NA + 7.6), '-x', PIEDRA, { tono: GRIS });
      quebrado(ALA - 0.4, -X + 0.25, z, '-x');
      // la torrecita, entre el ala y la nave, con su farol
      const zt = s * (NA + 0.2); T.caja(1.7, 10.6, 1.7, -X + 0.2, 0, zt, PIEDRA, o); T.caja(2.3, 0.35, 2.3, -X + 0.2, 10.6, zt, PIEDRA, o);
      T.caja(1, 1.3, 1, -X + 0.2, 10.95, zt, TINTA); T.piramide(1, 1.2, -X + 0.2, 12.25, zt, PIZARRA, 4); T.cilindro(0.05, 1.2, -X + 0.2, 13.4, zt, TINTA, 4);
      // adentro, el andén
      T.caja(XV + X - 2, 0.9, 3.4, xm, 0, s * (NA - 1.7), PIEDRA, { tono: GRIS });
    }
    T.caja(VE, COR, 2 * NA, X - VE / 2, 0, 0, PIEDRA, o); T.caja(VE + 0.4, 0.3, 2 * Z + 0.4, X - VE / 2, COR, 0, PIEDRA, o);
    T.caja(0.9, 0.9, 2 * Z + 0.3, X - 0.35, 0, 0, PIEDRA, { tono: GRIS }); T.caja(0.9, 0.9, 2 * Z + 0.3, -X + 0.35, 0, 0, PIEDRA, { tono: GRIS });
    aguas(T, VE - 1.2, 2 * Z - 1.4, 1.9, X - VE / 2, COR + 0.3, 0, 'z');
    // el frente sobre Cerrito: cuatro ventanas de arco por lado, con su pretil quebrado, y en el medio el portal —un
    // arco grande entre pilastras, con frontis—
    const PO = 4.6;
    for (const s of [-1, 1]) { T.fila(4, s * (PO + 1.2), s * (Z - 1.2), 2.2, 4.4, 1.4, X + 0.06, '+x'); quebrado(Z - PO - 0.4, X - 0.25, s * (PO + (Z - PO) / 2), '+x'); }
    muro(T, '+x', X + 0.8, -PO, PO, 0, 9.4, [[0, 5, 7.9, 0, true]], 0.9, PIEDRA, o); pano(T, '+x', X + 0.02, -2.6, 2.6, 0, 8);
    for (const s of [-1, 1]) T.caja(0.5, 9.4, 1.1, X + 0.85, 0, s * (PO - 0.6), PIEDRA, o);
    T.caja(1.5, 0.45, 2 * PO + 0.7, X + 0.45, 9.4, 0, PIEDRA, o); frontis(T, 2 * PO + 0.7, 2.1, 1.5, X + 0.45, 9.85, 0, '+x', PIEDRA, o);
    pano(T, '+x', X + 0.84, -3.2, 3.2, 8.45, 0.5); // (el letrero: «Ferro-Carril del Oeste»)
    // la nave: el techo de chapa a dos aguas, con la cumbrera a lo largo, y el tímpano de Libertad, que cuelga entre
    // las dos torrecitas con el borde de abajo en arco y el letrero («el primero en la República Argentina…»)
    aguas(T, XV + X + 0.3, 2 * NA + 0.8, 5.4, (XV - X) / 2, COR + 0.6, 0, 'x'); T.caja(XV + X - 16, 0.5, 1.4, (XV - X) / 2, COR + 5.75, 0, TINTA);
    { const s = new THREE.Shape(); s.moveTo(-NA, COR + 0.5); s.lineTo(0, COR + 6.1); s.lineTo(NA, COR + 0.5); s.lineTo(NA, 5); s.quadraticCurveTo(0, 9.8, -NA, 5); s.closePath();
      T.put(new THREE.ExtrudeGeometry(s, { depth: 0.5, bevelEnabled: false, curveSegments: 8 }).translate(0, 0, -0.5).rotateY(GIRO['-x']).translate(-X, 0, 0), PIEDRA, { tono: CREMA, H: 13 }); }
    pano(T, '-x', -X - 0.06, -6.2, 6.2, 9.9, 0.5); pano(T, '-x', -X - 0.06, -7.6, 7.6, 8.6, 0.42);
    // el patio de Libertad: la verja, con la entrada en el medio
    for (const s of [-1, 1]) verja(T, -74, s * 7, -74, s * Z, 5, 2.6, CREMA);
  }
}
