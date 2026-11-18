// La Casa Rosada: dos casas gemelas —la de Correos, de Carlos Kihlberg (1873-1879), al sur, y la de Gobierno, de
// Enrique Aberg (1882-1886), al norte— unidas por el arco de Francesco Tamburini (1886-1890), que además la agrandó
// hacia Rivadavia (hacia 1890), hacia Victoria (hacia 1896) y hacia el río; se inauguró entera en 1898. (Fechas y
// medidas: «Casa Rosada», Wikipedia en español.)
//   · 1905, 1910 y 1921 — la casa entera y simétrica: el arco en el medio del frente y, a cada lado, un tramo, el
//     pabellón de la cúpula, otro tramo y el pabellón de la punta.
//   · 1940 — a principios de 1938 se empezó a demolerla para abrir la plaza hacia el río; en abril se frenó la obra,
//     pero ya se había ido el costado sur, 17 metros, y con ese lugar se ensanchó Victoria (hoy Hipólito Yrigoyen).
//     Desde entonces el arco no está en el medio: queda unos 9 m al sur del centro del frente, y del lado sur la casa
//     termina, un arco de ventana después del pabellón de la cúpula, en un muro liso.
// El lugar y la planta son los de hoy (src/edificios.js): el frente sobre Balcarce va de −51 a +41 m, 92 m. Con los
// 17 m que faltan eran 109, y el eje del arco queda a la mitad: a 54,5 m de la punta norte, en x = −13,5 (ahí mismo
// la planta de hoy tiene un quiebre: las dos casas no estaban del todo en línea).
// De qué foto sale cada cosa (todas de Wikimedia Commons, anónimas y de dominio público):
//   · «Casa Rosada. Fines siglo XIX», desde la esquina de Rivadavia: el ala norte —el pabellón de la punta
//     con su mansarda trunca y la crestería de hierro, la logia de cinco arcos sobre cuatro ventanas, el pabellón de
//     la cúpula con sus tres puertas y el balcón— y, a la izquierda, el cuerpo de Tamburini, más alto y de azotea.
//   · «Casa Rosada en 1937», un año antes de la demolición: el frente entero, con el
//     arco de dos pisos de alto entre columnas, el ático de arquitos y, a la derecha, el ala sur de ventanas de a pares.
//   · «Casa Rosada en los años 1910» y «Casa Rosada y boca de subte»: el ala sur de cerca, con sus tres ventanas por
//     tramo y el pabellón de la punta que se demolió.
//   · «Casa rosada en 1916» (el costado de Rivadavia, con la entrada de carruajes y la explanada) y «Casa Rosada en
//     1910» (el frente del este, de tres pisos, con el cuerpo del medio y su grupo de esculturas).
//   · «Demolición de la Casa Rosada» y «Demolición parcial de la Casa Rosada, 1938»: la obra de 1938.
// Lo que es a ojo: las alturas (la cornisa de las alas a 14,6 m, el cuerpo del arco a 22 y lo de Tamburini a 20,5),
// el reparto de los tramos a cada lado del arco, los patios de adentro y todo el frente del este y el del sur, que
// las fotos muestran poco. Los vanos van pintados, salvo el arco y las dos logias, que son huecos de verdad.
export default function (c) {
  const { THREE, PIEDRA, TINTA, PIZARRA, ROSA } = c;
  const T = c.obra('rosada', ROSA); // (x hacia el norte, z hacia el río: el frente, sobre Balcarce, es −z)
  const XA = -13.5, ZF = -40, FB = 17, ZM = ZF + FB / 2; // el eje del arco · la línea del frente · el fondo de las alas y su medio
  const HW = 14.6, HP = 7.3, HA = 22, HT = 20.5;         // la cornisa de las alas · el piso alto · el cuerpo del arco · lo de Tamburini
  const D1 = 9.5, D2 = 22, D3 = 33, D4 = 45.5, D5 = 54.5; // desde el eje del arco: medio arco, un tramo, el pabellón de la cúpula, otro tramo y la punta
  const CORTE = D3 + (D4 - D3) / 3, SUR0 = XA - D5, SUR1 = XA - CORTE; // lo que quedó del ala sur en 1938: hasta un arco después del pabellón
  const NORTE = XA + D5;

  // -------------------------------------------------------------------------------------------- piezas sueltas
  /** un muro de x0 a x1 con n arcos abiertos de aw × ah (mira a −z, desde z hasta z + g); detrás, la sombra */
  const arcada = (x0, x1, n, y, h, aw, ah, z, g, seg = 4) => {
    const s = new THREE.Shape(), paso = (x1 - x0) / n; s.moveTo(x0, 0);
    for (let i = 0; i < n; i++) { const cx = x0 + (i + 0.5) * paso; s.lineTo(cx - aw / 2, 0); s.lineTo(cx - aw / 2, ah - aw / 2); s.absarc(cx, ah - aw / 2, aw / 2, Math.PI, 0, true); s.lineTo(cx + aw / 2, 0); }
    s.lineTo(x1, 0); s.lineTo(x1, h); s.lineTo(x0, h); s.closePath();
    T.put(new THREE.ExtrudeGeometry(s, { depth: g, bevelEnabled: false, curveSegments: seg }).translate(0, y, z), PIEDRA, { tono: ROSA, H: y + h });
    T.put(new THREE.PlaneGeometry(x1 - x0 - 0.3, ah).rotateY(Math.PI).translate((x0 + x1) / 2, y + ah / 2, z + g - 0.05), TINTA);
  };
  /** la crestería de hierro que corona una mansarda: un marco de w × d */
  const cresta = (w, d, x, y, z) => { for (const s of [-1, 1]) { T.caja(w, 0.55, 0.1, x, y, z + (s * d) / 2, TINTA); T.caja(0.1, 0.55, d, x + (s * w) / 2, y, z, TINTA); } };
  /** la cúpula de cuatro paños de un pabellón, con su remate chato y la crestería */
  const cupula = (w, d, h, x, y, z) => {
    const g = new THREE.LatheGeometry([[1, 0], [0.98, 0.2], [0.91, 0.45], [0.78, 0.68], [0.6, 0.87], [0.5, 1]].map(([r, v]) => new THREE.Vector2(r * Math.SQRT2, v)), 4).rotateY(Math.PI / 4).scale(w / 2, h, d / 2).toNonIndexed();
    g.computeVertexNormals(); T.put(g.translate(x, y, z), PIZARRA);
    T.caja(w / 2 + 0.3, 0.3, d / 2 + 0.3, x, y + h, z, PIZARRA); cresta(w / 2 - 0.4, d / 2 - 0.4, x, y + h + 0.3, z);
  };
  /** un tramo liso del frente, de x0 a x1: el muro, la faja entre los dos pisos y la cornisa */
  const tramo = (x0, x1, mete = 0) => {
    const xm = (x0 + x1) / 2, w = x1 - x0;
    T.liso(w, HW, FB - mete, xm, 0, ZM + mete / 2); T.liso(w, 0.35, 0.3, xm, HP - 0.35, ZF + mete - 0.12); T.liso(w, 0.6, FB + 0.8, xm, HW, ZM);
    // las lucarnas de la mansarda
    for (let i = 0, n = Math.round(w / 4.2); i < n; i++) { const x = x0 + ((i + 0.5) * w) / n; T.liso(1.3, 1.6, 1.8, x, HW + 1.1, ZF + 1.7); T.vano(0.7, 1, x, HW + 1.45, ZF + 0.74, '-z'); }
  };

  // ---------------------------------------------------------------------------------------- el frente: las dos alas
  /** Un ala: s = 1 la del norte (la de Aberg, con las logias), s = −1 la del sur (la de Kihlberg, con las ventanas de
   *  a pares). `hasta`: hasta qué distancia del eje se hace · `desde`: desde cuál (para lo que se demolió en 1938). */
  const ala = (s, desde, hasta) => {
    const X = (d) => XA + s * d, lado = (a, b) => [Math.min(X(a), X(b)), Math.max(X(a), X(b))];
    const entra = (a, b) => a >= desde - 0.01 && b <= hasta + 0.01;
    for (const [a, b] of [[D1, D2], [D3, D4]]) {
      // (el tramo de afuera del ala sur va en tres partes, una por ventana: la primera es la que quedó)
      const partes = s < 0 && a === D3 ? [[D3, CORTE], [CORTE, (CORTE + D4) / 2 + (D4 - D3) / 6], [(CORTE + D4) / 2 + (D4 - D3) / 6, D4]] : [[a, b]];
      for (const [p, q] of partes) {
        if (!entra(p, q)) continue;
        const [x0, x1] = lado(p, q), n = Math.round((q - p) / ((D4 - D3) / 3));
        if (s > 0) {
          // la logia: cinco arcos sobre su baranda, y abajo cuatro ventanas de arco
          tramo(x0, x1, 0.7); T.liso(x1 - x0, HP, 0.7, (x0 + x1) / 2, 0, ZF + 0.35);
          arcada(x0, x1, 5, HP, HW - HP, 1.75, 4.7, ZF, 0.7); T.liso(x1 - x0, 1, 0.2, (x0 + x1) / 2, HP, ZF + 0.1);
          T.fila(4, x0 + 0.4, x1 - 0.4, 1.9, 4.2, 1.5, ZF - 0.06, '-z');
        } else {
          tramo(x0, x1); T.fila(n, x0, x1, 2.2, 4.4, 1.5, ZF - 0.06, '-z');
          for (let i = 0; i < n; i++) for (const k of [-0.62, 0.62]) T.vano(1, 3.7, x0 + ((i + 0.5) * (x1 - x0)) / n + k, HP + 1.1, ZF - 0.06, '-z');
        }
      }
    }
    if (entra(D2, D3)) {
      // el pabellón de la cúpula: sale de la línea, con tres puertas sobre una grada, el balcón y tres ventanas de arco
      const [x0, x1] = lado(D2, D3), xm = (x0 + x1) / 2, w = x1 - x0, zc = ZF - 0.9;
      T.liso(w, HW + 0.9, FB + 0.9, xm, 0, ZM - 0.45); T.liso(w + 0.7, 0.7, FB + 1.6, xm, HW + 0.9, ZM - 0.45);
      T.liso(w - 1.4, 0.8, 2.4, xm, 0, zc - 1.2); T.fila(3, x0 + 1, x1 - 1, 1.9, 4.7, 0.8, zc - 0.06, '-z');
      T.liso(w - 1, 0.35, 1.3, xm, HP - 0.35, zc - 0.6); T.liso(w - 1, 1, 0.22, xm, HP, zc - 1.1); T.fila(3, x0 + 1, x1 - 1, 1.8, 4.5, HP + 0.9, zc - 0.06, '-z');
      cupula(w - 0.6, 9.4, 6.6, xm, HW + 1.6, zc + 5.2);
      // la lucarna del frente, con su ojo de buey
      T.liso(2.6, 3, 1.2, xm, HW + 1.6, zc + 0.9); T.put(new THREE.CircleGeometry(0.75, 10).rotateY(Math.PI).translate(xm, HW + 3.3, zc + 0.24), TINTA);
    }
    if (entra(D4, D5)) {
      // el pabellón de la punta: un ventanal por piso y la mansarda trunca, con su crestería
      const [x0, x1] = lado(D4, D5), xm = (x0 + x1) / 2, w = x1 - x0, zc = ZF - 0.6;
      T.liso(w, HW + 0.9, FB + 0.6, xm, 0, ZM - 0.3); T.liso(w + 0.7, 0.7, FB + 1.3, xm, HW + 0.9, ZM - 0.3);
      T.vano(2.5, 4.6, xm, 1.5, zc - 0.06, '-z'); T.vano(2.3, 4.6, xm, HP + 0.9, zc - 0.06, '-z'); T.liso(4.2, 0.3, 1, xm, HP - 0.3, zc - 0.5); T.liso(4.2, 1, 0.2, xm, HP, zc - 0.9);
      T.mansarda(w - 0.4, 9, 6.2, xm, HW + 1.6, zc + 4.7, 2.5); cresta(w - 5.6, 3.8, xm, HW + 7.8, zc + 4.7);
      // (el costado que da a la calle)
      T.fila(3, ZF + 2, ZF + FB - 2, 1.9, 4.2, 1.5, X(D5) + s * 0.06, s > 0 ? '+x' : '-x'); T.fila(3, ZF + 2, ZF + FB - 2, 1.8, 4.2, HP + 0.9, X(D5) + s * 0.06, s > 0 ? '+x' : '-x');
    }
    // la mansarda corrida, de pizarra, por detrás de las cúpulas
    // (la de lo que se demolió se mete en la otra, para que entre las dos no quede la limahoya)
    const m0 = desde > D1 ? desde - 6.4 : D1 - 2, m1 = Math.min(hasta, D5 - 1), [x0, x1] = lado(m0, m1);
    T.mansarda(x1 - x0, FB - 1.2, 3.8, (x0 + x1) / 2, HW + 0.6, ZM, 3.2);
  };
  ala(1, D1, D5);           // el ala norte, entera
  ala(-1, D1, CORTE);       // del ala sur, lo que sigue en pie
  c.epoca(3, 6); ala(-1, CORTE, D5); // y lo que se demolió en 1938: dos ventanas del tramo y el pabellón de la punta
  c.epoca(3);

  // ------------------------------------------------------------------------------------------- el arco de Tamburini
  { // un cuerpo de tres pisos que sale de la línea: el arco, de dos pisos de alto, entre columnas de a pares; ventanas
    // a los lados; arriba el ático de arquitos, la cornisa con su pretil, el escudo y el mástil
    const zc = ZF - 1.6, x0 = XA - D1, x1 = XA + D1, w = 2 * D1;
    arcada(x0, x1, 1, 0, HA, 7.4, 13.4, zc, 3, 6); T.liso(w, HA, FB - 1.4, XA, 0, zc + 3 + (FB - 1.4) / 2);
    for (const s of [-1, 1]) {
      T.vano(1.8, 4.4, XA + s * 7.6, 1.5, zc - 0.06, '-z'); T.vano(1.8, 4.2, XA + s * 7.6, HP + 0.9, zc - 0.06, '-z');
      T.fila(3, XA + s * 5 - 2.2, XA + s * 5 + 2.2 + s * 2.4, 0.9, 2.6, HW + 2, zc - 0.06, '-z');
      for (const k of [4.5, 5.7]) { T.liso(1, 1.7, 1, XA + s * k, 0, zc - 0.6); T.columnas(1, XA + s * k, zc - 0.6, XA + s * k, zc - 0.6, 1.7, 0.42, HP - 2.2); T.columnas(1, XA + s * k, zc - 0.6, XA + s * k, zc - 0.6, HP + 0.6, 0.38, HW - HP - 1.2); }
      T.liso(2.6, 0.5, 1.3, XA + s * 5.1, HP - 0.5, zc - 0.55); T.liso(2.6, 0.6, 1.3, XA + s * 5.1, HW - 0.6, zc - 0.55);
    }
    T.fila(3, XA - 2.4, XA + 2.4, 0.9, 2.6, HW + 2, zc - 0.06, '-z');
    T.liso(w + 0.5, 0.6, 0.6, XA, HW, zc - 0.1); T.liso(w + 0.9, 0.8, FB + 2.6, XA, HA, ZM - 0.6); T.liso(w, 1.1, 0.3, XA, HA + 0.8, zc + 0.1);
    T.liso(6, 2.6, 1, XA, HA + 0.8, zc + 0.4); T.liso(3.4, 1.2, 1, XA, HA + 3.4, zc + 0.4);
    T.cilindro(0.09, 7.5, XA, HA + 4.6, zc + 0.4, TINTA, 5);
  }

  // ------------------------------------------------------------------- lo de Tamburini: Rivadavia, el río y los patios
  // (tres pisos y azotea con pretil. Las ventanas de estos cuerpos se ponen solas.)
  const pretil = (w, d, x, z, h = HT) => { T.liso(w + 0.6, 0.6, d + 0.6, x, h, z); for (const s of [-1, 1]) { T.liso(w, 1, 0.3, x, h + 0.6, z + s * (d / 2 - 0.15)); T.liso(0.3, 1, d, x + s * (w / 2 - 0.15), h + 0.6, z); } };
  { // el costado de Rivadavia, con la entrada de carruajes que sale del cuerpo: tres arcos al frente, uno a cada lado
    const x0 = NORTE - 9.5, x1 = 48.5;
    T.cuerpo(x1 - x0, HT, 56, (x0 + x1) / 2, 0, 5, 3); pretil(x1 - x0, 56, (x0 + x1) / 2, 5);
    T.cuerpo(x1 - NORTE, HT, 8.5, (x1 + NORTE) / 2, 0, -27.25, 3); pretil(x1 - NORTE, 8.5, (x1 + NORTE) / 2, -27.25);
    T.liso(5.5, 9, 20, x1 + 2.75, 0, 1); T.liso(6, 0.5, 20.6, x1 + 2.9, 9, 1); T.liso(0.25, 1, 20, x1 + 5.4, 9.5, 1);
    T.fila(3, -7, 9, 3.2, 6.6, 1.2, x1 + 5.56, '+x'); for (const s of [-1, 1]) T.vano(3, 6.6, x1 + 2.75, 1.2, 1 + s * 10.06, s > 0 ? '+z' : '-z');
    T.liso(9, 1.2, 26, x1 + 4.5, 0, 1); // (la explanada)
  }
  /** el frente del río, de x0 a x1 */
  const este = (x0, x1) => { T.cuerpo(x1 - x0, HT, 17.5, (x0 + x1) / 2, 0, 31.75, 4); pretil(x1 - x0, 17.5, (x0 + x1) / 2, 31.75); };
  este(SUR1 - 1, 39);
  { // el cuerpo del medio del frente del río: sale de la línea, con su logia y el grupo de esculturas arriba
    T.liso(26, HT + 2, 3, XA, 0, 41.5); T.liso(26.8, 0.7, 3.8, XA, HT + 2, 41.5); T.liso(8, 3, 1.6, XA, HT + 2.7, 41.5);
    T.fila(5, XA - 11.5, XA + 11.5, 2.4, 5.4, 8, 43.06, '+z'); T.fila(5, XA - 11.5, XA + 11.5, 2, 3.4, 2.4, 43.06, '+z'); T.fila(5, XA - 11.5, XA + 11.5, 1.6, 3, 15.4, 43.06, '+z', false);
  }
  // los cuerpos de adentro, entre patio y patio: el del eje del arco, techado, y uno a cada lado
  T.liso(2 * D1, 17, 46, XA, 0, 0); T.tejado(2 * D1 - 4, 44, 2.2, XA, 17, 0, 'z', PIZARRA, true);
  T.cuerpo(9, 16, 46, 12, 0, 0, 3); T.cuerpo(9, 16, 46, -36, 0, 0, 3);

  // ------------------------------------------------------------------------------------- el costado sur, antes y después
  c.epoca(3, 6);
  { // hasta 1938: el frente de Tamburini sobre Victoria, con sus dos pabellones, y la punta del frente del río
    este(SUR0, SUR1 - 1);
    T.cuerpo(SUR1 - SUR0, 17, 46, (SUR0 + SUR1) / 2, 0, 0, 3); T.liso(SUR1 - SUR0 + 0.6, 0.6, 46, (SUR0 + SUR1) / 2 - 0.3, 17, 0);
  }
  c.epoca(6);
  // desde 1938: el muro liso que cierra los patios sobre la calle ensanchada
  T.liso(0.8, 13, 46, SUR1 - 0.6, 0, 0); T.liso(1.2, 0.5, 46, SUR1 - 0.6, 13, 0);
  c.epoca(0);
}
