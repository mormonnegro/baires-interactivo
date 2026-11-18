// El Cabildo, que en esta línea de tiempo cambia cuatro veces (fechas: «Cabildo de Buenos Aires», Wikipedia en español).
//   · 1867 — el colonial, entero: once arcos por piso (cinco, el cuerpo del medio y cinco), blanco, con techo de tejas
//     y la torre terminada en 1765. Sale de «Cabildo de Buenos Aires (1864)», de Esteban Gonnet, y de «Cabildo
//     detalle by junior 1876», de Christiano Junior: el cuerpo del medio que sale de la línea, con sus pilastras de a
//     pares, el balcón de hierro, el frontis curvo entre dos remates y, encima, la torre de un solo cuerpo con los
//     relojes en lo alto de los arcos, el pretil con cuatro remates y la media naranja.
//   · 1888 — la reforma de Pedro Benoit (proyecto de 1879, torre terminada en 1881), para alojar a los tribunales:
//     el frente «a la italiana», de símil piedra, con balaustres en el balcón y en la azotea (se fueron las tejas),
//     columnas de a pares en el cuerpo del medio y una torre diez metros más alta, de tres cuerpos, con cúpula de
//     azulejos. Sale de «Cabildo de bsas torre benoit» (1879-1881) y de «Plaza de mayo 1880s», las dos anónimas.
//   · 1895 a 1921 — sin la torre y sin los tres arcos del norte, demolidos en 1889 para abrir la Avenida de Mayo:
//     quedan ocho (cinco, el del medio y dos). Sale de «Cabildo buenos aires 1915» y de
//     «Cabildo de bs as lado bolivar 1910». En agosto de 1931 se demolieron además los tres arcos del sur, para la
//     Diagonal Sur: ese Cabildo de cinco arcos a la italiana («Cabildo de Buenos Aires en 1933») duró nueve años
//     y cae entre dos etapas, así que no se ve.
//   · 1940 — la restauración de Mario Buschiazzo, inaugurada el 11 de octubre de 1940: cinco arcos, otra vez blanco y
//     con tejas, el balcón de hierro corrido y una torre nueva de hormigón, de dos cuerpos (el del reloj y el de las
//     campanas). Detrás, donde estaban la cárcel y los agregados de 1879, queda el patio. Sale de «Cabildo de bs as
//     restaurado 1940» y de «Cabildo de Buenos Aires en 1950».
// Todas las fotos son de Wikimedia Commons, de dominio público; las que no nombran a su autor son anónimas.
// Lo que es a ojo: las alturas (medidas sobre las fotos con el balcón a 5,6 m y la cornisa a 10,8), el ancho del
// cuerpo del medio (10,4 m: los otros diez arcos se reparten lo que queda de los 63,5 m que le da el plano) y el fondo.
// Los arcos son de verdad —un muro con los huecos abiertos— y detrás va un paño de tinta: la galería en sombra. El
// contrafrente y los costados van lisos, con los vanos pintados; de la torre de Benoit van los tres cuerpos y la
// cúpula, sin sus columnas. Al lado, hasta que pasa la avenida, sigue la Policía, como la dibuja el plano.
export default function (c) {
  const { THREE, PIEDRA, TINTA, PIZARRA, CASA, PINTADO, PINTA, BLANCO, SILLAR } = c;
  const T = c.lugar(10294, 9358); // (x hacia el norte, z hacia la plaza: el frente es +z)
  const L = c.m(94), C = 10.4, V = (L - C) / 10; // el largo de los once arcos, el cuerpo del medio y cada uno de los otros
  const F = 13, Z0 = 9, ZF = Z0 + F / 2, ZA = Z0 - F / 2, G = 1.5; // el fondo, su medio, el frente, el contrafrente y el espesor de la arcada
  const H1 = 5.6, H2 = 10.8, HB = 11.2; // el piso del balcón, la cornisa colonial y la de Benoit
  const XS = (n) => -(C / 2 + n * V), XN = (n) => C / 2 + n * V; // hasta dónde llegan n arcos hacia el sur y hacia el norte
  const CARAS = [['+z', 0, 1], ['-z', 0, -1], ['+x', 1, 0], ['-x', -1, 0]];

  // -------------------------------------------------------------------------------------------- piezas sueltas
  const liso = (w, h, d, x, y, z, tono) => T.caja(w, h, d, x, y, z, PIEDRA, { tono });
  /** Lo curvo de piedra no puede traer puntos que miren derecho para arriba: src/hitos.js los tomaría por una azotea. */
  const suave = (g) => { const n = g.attributes.normal; for (let i = 0; i < n.count; i++) if (n.getY(i) > 0.85) { const h = Math.hypot(n.getX(i), n.getZ(i)), k = h > 1e-3 ? 0.527 / h : 0; n.setXYZ(i, k ? n.getX(i) * k : 0.527, 0.85, n.getZ(i) * k); } return g; };
  /** una arcada: un muro de x0 a x1, de h de alto desde y y G de espesor, con n arcos abiertos de aw × ah; detrás, la sombra */
  const arcada = (x0, x1, n, y, h, aw, ah, tono, z = ZF) => {
    const s = new THREE.Shape(), paso = (x1 - x0) / n; s.moveTo(x0, 0);
    for (let i = 0; i < n; i++) { const cx = x0 + (i + 0.5) * paso; s.lineTo(cx - aw / 2, 0); s.lineTo(cx - aw / 2, ah - aw / 2); s.absarc(cx, ah - aw / 2, aw / 2, Math.PI, 0, true); s.lineTo(cx + aw / 2, 0); }
    s.lineTo(x1, 0); s.lineTo(x1, h); s.lineTo(x0, h); s.closePath();
    T.put(new THREE.ExtrudeGeometry(s, { depth: G, bevelEnabled: false, curveSegments: 4 }).translate(0, y, z - G), PIEDRA, { tono, H: y + h });
    T.put(new THREE.PlaneGeometry(x1 - x0 - 0.3, ah).translate((x0 + x1) / 2, y + ah / 2, z - G + 0.05), TINTA);
  };
  /** una tabla parada, de dos caras: atravesada a z (de frente) o, con `deLado`, a x */
  const tabla = (w, h, x, y, z, deLado, kind, o) => { for (const a of [0, Math.PI]) T.put(new THREE.PlaneGeometry(w, h).rotateY(a + (deLado ? Math.PI / 2 : 0)).translate(x, y + h / 2, z), kind, o); };
  /** una baranda de (x0, z0) a (x1, z1): el pasamanos y un barrote cada tanto (de hierro, o balaustres de piedra) */
  const baranda = (x0, z0, x1, z1, y, alto, cada, gr, kind, o) => {
    const deLado = Math.abs(z1 - z0) > Math.abs(x1 - x0), l = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(l / cada));
    T.caja(deLado ? gr * 1.5 : l + gr, gr * 0.9, deLado ? l + gr : gr * 1.5, (x0 + x1) / 2, y + alto - gr * 0.9, (z0 + z1) / 2, kind, o);
    for (let i = 0; i <= n; i++) tabla(gr, alto - gr * 0.9, x0 + ((x1 - x0) * i) / n, y, z0 + ((z1 - z0) * i) / n, deLado, kind, o);
  };
  /** un remate: el pedestal y la perilla */
  const remate = (x, y, z, tono, k = 1) => { liso(0.8 * k, 0.9 * k, 0.8 * k, x, y, z, tono); T.cilindro(0.34 * k, 1.5 * k, x, y + 0.9 * k, z, PIEDRA, 6, 0.06, { tono }); };
  /** un reloj: la esfera blanca con su aro y las agujas, sobre la cara que se diga */
  const reloj = (r, x, y, z, cara) => {
    const a = { '+z': 0, '-z': Math.PI, '+x': Math.PI / 2, '-x': -Math.PI / 2 }[cara], dx = Math.sin(a), dz = Math.cos(a), en = (g, s) => g.rotateY(a).translate(x + dx * s, y, z + dz * s);
    T.put(en(new THREE.CircleGeometry(r + 0.14, 10), 0.05), TINTA); T.put(en(new THREE.CircleGeometry(r, 10), 0.09), PINTADO, { pinta: [PINTA.BLANCO, 0.97] });
    T.put(en(new THREE.PlaneGeometry(0.11, r * 0.8).translate(0, r * 0.36, 0), 0.13), TINTA); T.put(en(new THREE.PlaneGeometry(r * 0.56, 0.11).translate(r * 0.24, 0, 0), 0.13), TINTA);
  };
  /** una media naranja */
  const media = (r, x, y, z, alto, kind, o) => T.put(suave(new THREE.SphereGeometry(r, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, alto, 1).translate(x, y, z)), kind, o);
  /** un techo de tejas a cuatro aguas, de x0 a x1 */
  const tejas = (x0, x1, y, h = 2.6) => {
    const w = x1 - x0 + 0.9, d = F + 0.9, r = Math.max(0, (w - d) / 2), A = [-w / 2, 0, -d / 2], B = [w / 2, 0, -d / 2], D = [w / 2, 0, d / 2], E = [-w / 2, 0, d / 2], R1 = [-r, h, 0], R2 = [r, h, 0];
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([E, D, R2, E, R2, R1, B, A, R1, B, R1, R2, A, E, R1, D, B, R2].flat(), 3)); g.computeVertexNormals();
    T.put(g.translate((x0 + x1) / 2, y, Z0), PINTADO, { pinta: [PINTA.LADRILLO, 0.55] });
  };

  // ------------------------------------------------------------------------- el colonial: el de 1867 y el de 1940
  /** La torre: los cuerpos que se digan (cada uno con su cornisa; `vano` y `reloj`: [medida, alto, a qué altura]),
   *  el pretil con cuatro remates, el tambor de ocho lados, la media naranja y la veleta. */
  const torre = (tw, zt, y0, cuerpos) => {
    let y = y0;
    for (const t of cuerpos) {
      liso(tw, t.h, tw, 0, y, zt, BLANCO);
      for (const [cara, dx, dz] of CARAS) {
        if (t.vano) T.vano(t.vano[0], t.vano[1], dx * (tw / 2 + 0.05), y + t.vano[2], zt + dz * (tw / 2 + 0.05), cara);
        if (t.reloj && cara !== '-z') reloj(t.reloj[0], (dx * tw) / 2, y + t.reloj[1], zt + (dz * tw) / 2, cara);
      }
      y += t.h; liso(tw + 0.9, 0.5, tw + 0.9, 0, y, zt, BLANCO); y += 0.5;
    }
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) remate(sx * (tw / 2 - 0.05), y, zt + sz * (tw / 2 - 0.05), BLANCO);
    for (const s of [-1, 1]) { liso(tw - 0.9, 0.75, 0.3, 0, y, zt + s * (tw / 2 - 0.05), BLANCO); liso(0.3, 0.75, tw - 0.9, s * (tw / 2 - 0.05), y, zt, BLANCO); }
    const r = tw * 0.33;
    T.cilindro(r, 1.1, 0, y, zt, PIEDRA, 8, r, { tono: BLANCO }); media(r * 1.05, 0, y + 1.1, zt, 1.15, PIEDRA, { tono: BLANCO });
    T.cilindro(0.3, 0.9, 0, y + 1 + r * 1.2, zt, PIEDRA, 6, 0.2, { tono: BLANCO }); T.cilindro(0.07, 2.4, 0, y + 1.9 + r * 1.2, zt, TINTA, 4);
  };
  /** El Cabildo blanco, con nS arcos al sur del cuerpo del medio y nN al norte. `restaurado`: el de 1940. */
  const colonial = (nS, nN, restaurado) => {
    const x0 = XS(nS), x1 = XN(nN), xm = (x0 + x1) / 2, len = x1 - x0, P = 0.9, zc = ZF + P;
    liso(len, H2, F - G, xm, 0, ZA + (F - G) / 2, BLANCO); liso(len + 0.6, 0.45, F + 0.6, xm, H2, Z0, BLANCO);
    tejas(x0, x1, H2 + 0.45);
    for (const [a, b, n] of [[x0, -C / 2, nS], [C / 2, x1, nN]]) {
      arcada(a, b, n, 0, H1, 3.5, 4.5, BLANCO); arcada(a, b, n, H1, H2 - H1, 3.3, 3.9, BLANCO);
      liso(b - a, 0.3, 0.3, (a + b) / 2, H1 - 0.3, ZF + 0.15, BLANCO); // la imposta entre los dos pisos
    }
    // el cuerpo del medio: sale de la línea, con el arco de la entrada, las pilastras de a pares y la puerta del balcón entre dos nichos
    liso(C, H2, P, 0, 0, ZF - G + P / 2, BLANCO); arcada(-C / 2, C / 2, 1, 0, H1, 3.3, 4.9, BLANCO, zc); liso(C, H2 - H1, G, 0, H1, zc - G / 2, BLANCO);
    T.vano(2, 3.8, 0, H1 + 0.3, zc + 0.05, '+z'); for (const s of [-1, 1]) T.vano(0.8, 2.1, s * 3.45, H1 + 1.3, zc + 0.05, '+z');
    for (const x of [-4.6, -2.35, 2.35, 4.6]) { liso(0.8, H1 - 0.4, 0.26, x, 0, zc + 0.13, BLANCO); liso(0.74, H2 - H1 - 0.8, 0.26, x, H1 + 0.3, zc + 0.13, BLANCO); }
    liso(C + 0.5, 0.35, 0.5, 0, H1 - 0.35, zc + 0.2, BLANCO); liso(C + 0.8, 0.6, G + 0.6, 0, H2, zc - G / 2 + 0.25, BLANCO);
    // el frontis curvo, con su óculo, entre dos remates; detrás arranca la torre
    const yf = H2 + 0.6, hf = restaurado ? 5.2 : 3.9, zt = zc - 0.55;
    liso(C - 0.4, 1.2, 1.1, 0, yf, zt, BLANCO);
    { const s = new THREE.Shape(), a = C * 0.36; s.moveTo(-a, 0); s.lineTo(a, 0); s.absellipse(0, 0, a, hf - 1.2, 0, Math.PI, false); s.closePath(); T.put(suave(new THREE.ExtrudeGeometry(s, { depth: 1.1, bevelEnabled: false, curveSegments: 5 }).translate(0, yf + 1.2, zt - 0.55)), PIEDRA, { tono: BLANCO }); }
    T.put(new THREE.CircleGeometry(0.75, 12).translate(0, yf + 2.3, zt + 0.61), TINTA);
    for (const s of [-1, 1]) remate(s * (C / 2 - 0.6), yf + 1.2, zt, BLANCO, 1.15);
    if (restaurado) {
      // la de Buschiazzo: el cuerpo del reloj y, encima, el de las campanas, con un arco por cara
      const tw = 6.6, z = zt + 0.55 - tw / 2 - 0.3;
      liso(tw + 1.2, yf + hf - 0.4 - H2, 5, 0, H2, z, BLANCO);
      torre(tw, z, yf + hf - 0.4, [{ h: 3.9, reloj: [0.8, 1.9] }, { h: 4.6, vano: [1.7, 3.5, 0.5] }]);
      // el balcón de hierro, corrido de punta a punta sobre sus ménsulas
      const zb = ZF + 1.1, zm = zc + 1.1;
      for (const [a, b, z1] of [[x0 - 0.3, -C / 2, zb], [-C / 2, C / 2, zm], [C / 2, x1 + 0.3, zb]]) { liso(b - a, 0.16, z1 - ZF + 0.1, (a + b) / 2, H1 - 0.16, (z1 + ZF) / 2 - 0.05, BLANCO); baranda(a, z1, b, z1, H1, 1, 0.8, 0.07, TINTA); }
      for (const s of [-1, 1]) { baranda(s * (C / 2), zb, s * (C / 2), zm, H1, 1, 0.5, 0.07, TINTA); baranda(s < 0 ? x0 - 0.3 : x1 + 0.3, ZF, s < 0 ? x0 - 0.3 : x1 + 0.3, zb, H1, 1, 0.5, 0.07, TINTA); }
      for (let i = 0; i <= nS; i++) liso(0.35, 0.5, 0.9, XS(i), H1 - 0.66, ZF + 0.45, BLANCO); for (let i = 0; i <= nN; i++) liso(0.35, 0.5, 0.9, XN(i), H1 - 0.66, ZF + 0.45, BLANCO);
      // el contrafrente, que Buschiazzo hizo parecido al frente, y los costados
      T.fila(5, x0 + 0.6, x1 - 0.6, 3.1, 4.3, 0, ZA - 0.05, '-z'); T.fila(5, x0 + 0.6, x1 - 0.6, 2.9, 3.6, H1 + 0.3, ZA - 0.05, '-z');
      for (const s of [-1, 1]) for (const y of [0.3, H1 + 0.6]) T.vano(1.5, 3, s < 0 ? x0 - 0.05 : x1 + 0.05, y, Z0 - 2, s < 0 ? '-x' : '+x');
    } else {
      // la de 1765: un solo cuerpo, con el reloj en lo alto de cada arco
      const tw = 7.4, z = zt + 0.55 - tw / 2 - 0.3;
      liso(tw + 1.2, yf + hf - 0.4 - H2, 5.4, 0, H2, z, BLANCO);
      torre(tw, z, yf + hf - 0.4, [{ h: 9.3, vano: [1.9, 4.2, 1.2], reloj: [0.9, 6.9] }]);
      // el balcón concejil, de hierro: delante del cuerpo del medio y de un arco a cada lado
      const a = XS(1), b = XN(1), zm = zc + 1;
      liso(b - a, 0.16, zm - ZF + 0.1, 0, H1 - 0.16, (zm + ZF) / 2 - 0.05, BLANCO); baranda(a, zm, b, zm, H1, 1, 0.8, 0.07, TINTA);
      for (const x of [a, b]) baranda(x, ZF, x, zm, H1, 1, 0.5, 0.07, TINTA);
    }
  };

  // --------------------------------------------------------------------- el de Benoit: de 1879 hasta la restauración
  /** un ala a la italiana, de x0 a x1 con n arcos: la arcada con sus pilastras, el balcón de balaustres y el pretil de la azotea */
  const alaItaliana = (x0, x1, n) => {
    const xm = (x0 + x1) / 2, len = x1 - x0, paso = len / n;
    liso(len, HB, F - G, xm, 0, ZA + (F - G) / 2, SILLAR);
    arcada(x0, x1, n, 0, H1, 3.5, 4.6, SILLAR); arcada(x0, x1, n, H1, HB - H1, 3.3, 4.4, SILLAR);
    for (let i = 0; i <= n; i++) { const x = x0 + i * paso; liso(0.7, H1 - 0.5, 0.25, x, 0, ZF + 0.12, SILLAR); liso(0.65, HB - H1 - 0.2, 0.25, x, H1, ZF + 0.12, SILLAR); }
    liso(len, 0.4, 1.3, xm, H1 - 0.4, ZF + 0.6, SILLAR); baranda(x0, ZF + 1.1, x1, ZF + 1.1, H1, 1, 0.75, 0.2, PIEDRA, { tono: SILLAR });
    liso(len, 0.6, F + 0.8, xm, HB, Z0, SILLAR); baranda(x0, ZF + 0.2, x1, ZF + 0.2, HB + 0.6, 1.1, 0.85, 0.22, PIEDRA, { tono: SILLAR });
    liso(len, 0.9, 0.3, xm, HB + 0.6, ZA - 0.2, SILLAR);
  };
  /** el murete de la azotea y la vuelta de la cornisa en una punta (s: −1 la del sur, 1 la del norte) */
  const punta = (x, s) => { liso(0.4, 0.6, F + 0.8, x + s * 0.2, HB, Z0, SILLAR); liso(0.3, 0.9, F + 0.4, x + s * 0.1, HB + 0.6, Z0, SILLAR); };
  c.epoca(1, 6);
  alaItaliana(XS(5), -C / 2, 5); alaItaliana(C / 2, XN(2), 2); punta(XS(5), -1);
  { // el cuerpo del medio: columnas de a pares en los dos pisos, a cada lado del arco y del ventanal, y el ático
    const P = 1, zc = ZF + P;
    liso(C, HB, F - G + P, 0, 0, ZA + (F - G + P) / 2, SILLAR); arcada(-C / 2, C / 2, 1, 0, H1, 3.4, 5, SILLAR, zc); liso(C, HB - H1, G, 0, H1, zc - G / 2, SILLAR);
    T.vano(2.7, 4.4, 0, H1 + 0.2, zc + 0.05, '+z');
    for (const x of [-4.4, -3.1, 3.1, 4.4]) {
      liso(0.9, 0.9, 0.9, x, 0, zc + 0.55, SILLAR); T.cilindro(0.36, H1 - 1.4, x, 0.9, zc + 0.55, PIEDRA, 6, 0.31, { tono: SILLAR });
      liso(0.9, 0.8, 0.9, x, H1, zc + 0.55, SILLAR); T.cilindro(0.33, HB - H1 - 0.8, x, H1 + 0.8, zc + 0.55, PIEDRA, 6, 0.28, { tono: SILLAR });
    }
    liso(C + 0.3, 0.5, 1.4, 0, H1 - 0.5, zc + 0.6, SILLAR); baranda(-2.5, zc + 1.1, 2.5, zc + 1.1, H1, 1, 0.75, 0.2, PIEDRA, { tono: SILLAR });
    liso(C + 0.6, 0.6, F + P + 1.4, 0, HB, Z0 + P / 2 + 0.3, SILLAR); liso(C - 0.6, 1.5, 2.4, 0, HB + 0.6, zc - 0.9, SILLAR);
  }
  // (atrás, la cárcel y los patios, y después los agregados de los tribunales: cuerpos bajos. Se van con la restauración.)
  c.epoca(0, 6); T.caja(XN(2) - XS(5), 6.8, 22, (XN(2) + XS(5)) / 2, 0, ZA - 11, CASA, { floors: 1 });
  c.epoca(1, 2);
  alaItaliana(XN(2), XN(5), 3); punta(XN(5), 1);
  { // la torre de Benoit: tres cuerpos que se van angostando —el de abajo con un arco alto por cara, el del medio y el
    // del reloj— y la cúpula de cuatro paños, de azulejos, con su linterna
    const zt = ZF + 1 - 0.8 - 4.1, y0 = HB + 0.6;
    liso(8.2, 9.5, 8.2, 0, y0, zt, SILLAR); for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) liso(1.3, 9.5, 1.3, sx * 3.65, y0, zt + sz * 3.65, SILLAR);
    liso(9.9, 0.8, 9.9, 0, y0 + 9.5, zt, SILLAR); liso(6.8, 5.2, 6.8, 0, y0 + 10.3, zt, SILLAR); liso(7.8, 0.6, 7.8, 0, y0 + 15.5, zt, SILLAR);
    liso(5.6, 6.7, 5.6, 0, y0 + 16.1, zt, SILLAR); liso(6.7, 0.6, 6.7, 0, y0 + 22.8, zt, SILLAR);
    for (const [cara, dx, dz] of CARAS) {
      T.vano(2.4, 5.8, dx * 4.16, y0 + 1.9, zt + dz * 4.16, cara); T.vano(1.7, 3.4, dx * 3.46, y0 + 11.1, zt + dz * 3.46, cara);
      T.vano(1, 1.7, dx * 2.86, y0 + 16.7, zt + dz * 2.86, cara); reloj(1.25, dx * 2.8, y0 + 20.6, zt + dz * 2.8, cara);
    }
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) remate(sx * 4.3, y0 + 10.3, zt + sz * 4.3, SILLAR);
    const yc = y0 + 23.4, g = new THREE.LatheGeometry([[1, 0], [0.96, 0.22], [0.85, 0.48], [0.66, 0.72], [0.45, 0.9], [0.3, 1]].map(([r, y]) => new THREE.Vector2(r * 3.95, y * 5.2)), 4).rotateY(Math.PI / 4).toNonIndexed();
    g.computeVertexNormals(); T.put(g.translate(0, yc, zt), PIZARRA);
    liso(1.7, 1.3, 1.7, 0, yc + 5.2, zt, SILLAR); T.piramide(1.25, 1.7, 0, yc + 6.5, zt, PIZARRA, 4); T.cilindro(0.08, 2.6, 0, yc + 8.2, zt, TINTA, 4);
  }
  // (desde 1889 el costado del norte da a la Avenida de Mayo: se le hizo un frente con dos arcos por piso)
  c.epoca(2, 6);
  punta(XN(2), 1);
  for (const y of [0, H1]) T.fila(2, ZA + 1.5, ZF - 2.5, 3.1, y ? 4.2 : 4.5, y, XN(2) + 0.05, '+x');

  // ------------------------------------------------------------------------------------------------ cada uno en su año
  c.epoca(0, 1); colonial(5, 5, false);
  c.epoca(6); colonial(2, 2, true);
  // (al norte, pegada: la Policía. El plano dibuja toda esa mitad de la cuadra con el rayado de los edificios
  // públicos. Por ahí pasa después la Avenida de Mayo, que se lleva también lo que había detrás de los tres arcos.)
  c.epoca(0, 2);
  T.caja(XN(5) - XN(2), 6.8, 22, (XN(5) + XN(2)) / 2, 0, ZA - 11, CASA, { floors: 1 });
  const lp = c.m(35), fp = c.m(27), xp = L / 2 + lp / 2 + 0.2, zp = c.m(17) - fp / 2;
  T.caja(lp, 11.6, fp, xp, 0, zp, CASA, { floors: 2 }); T.caja(lp + 0.5, 0.5, fp + 0.5, xp, 11.6, zp); T.pilares(7, xp - lp / 2 + 0.3, zp + fp / 2 - 0.1, xp + lp / 2 - 0.3, zp + fp / 2 - 0.1, 12.1, 0.5, 0.9);
  c.epoca(0);
}
