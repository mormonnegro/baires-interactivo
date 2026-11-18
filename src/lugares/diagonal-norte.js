// Los edificios de la Diagonal Norte (la Avenida Presidente Roque Sáenz Peña), que se abrió de a tramos entre 1913 y
// 1943 con un reglamento estricto: todos los frentes a 33 metros hasta la cornisa, un balcón corrido a los 9 y, en las
// esquinas, permiso para rematar con una cúpula. Acá van los seis que más se reconocen, cada uno en su lugar del mapa
// de hoy (src/edificios.js, de tools/edificios.mjs) y con la planta en cuña que le deja la diagonal:
//   - en el cruce con Florida, uno por esquina: el Banco de Boston (1924), La Equitativa del Plata (1929), el Miguel
//     Bencich (1927) y, cerrando la plazoleta del lado de Bartolomé Mitre, el Bencich de las dos cúpulas (1927);
//   - en la punta que mira a la Plaza de Mayo, el Banco Argentino Uruguayo (1928);
//   - en la manzana triangular de Maipú y Perón, La Continental (1931).
// Años, autores y direcciones: Wikipedia en español. Las formas salen de fotos de Wikimedia Commons (se nombra cada
// una en su edificio); son bocetos de pocas piezas, como los de src/hitos.js. Aparecen todos en la etapa de 1940.
export default function (c) {
  const { THREE, PIEDRA, CASA, TINTA, PINTADO, PINTA } = c, TAU = Math.PI * 2;

  // ------------------------------------------------------------------------------------------------ las herramientas
  /** para qué lado gira una planta [x, z]: +1 o −1 (de eso depende cuál es el lado de afuera de cada pared) */
  const giro = (P) => { let a = 0; for (let i = 0; i < P.length; i++) { const [x0, z0] = P[i], [x1, z1] = P[(i + 1) % P.length]; a += x0 * z1 - x1 * z0; } return a > 0 ? 1 : -1; };
  /** La planta de un edificio en metros de su lugar, con las esquinas que se pidan redondeadas. Cada esquina es
   *  [i0, i1, r]: los puntos i0…i1 de la planta del mapa (la ochava, que el mapa trae en dos o tres quiebres) se
   *  cambian por un arco de radio r tangente a las dos fachadas que se encuentran ahí. Devuelve la planta (P), su giro
   *  (g), los puntos originales (O) y, de cada arco: el centro (C), dónde empieza y dónde termina (A, B), sus ángulos
   *  (a0 y cuánto barre, da) y el vértice donde se cruzarían las dos fachadas (V). `calle` dice qué parte da a la
   *  calle —del punto i al j de la planta del mapa; lo demás son medianeras—: vuelo(d) da una tira de esa parte que
   *  sale d metros de la pared (para los balcones, las cornisas, el zócalo), y si no hay medianeras, la vuelta entera. */
  const planta = (T, clave, esquinas = [], calle = null) => {
    const O = c.EDIFICIOS[clave].planta[0].slice(0, -1).map(([px, py]) => T.deMundo(px, py)), N = O.length, P = [], arcos = [];
    const uni = (a, b) => { const d = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(...d); return [d[0] / l, d[1] / l]; };
    for (const [i0, i1, r, n = 8] of esquinas) {
      const a = O[(i0 - 1 + N) % N], e = O[i1], u = uni(a, O[i0]), v = uni(e, O[(i1 + 1) % N]), den = u[0] * v[1] - u[1] * v[0], s = Math.sign(den);
      const t = ((e[0] - a[0]) * v[1] - (e[1] - a[1]) * v[0]) / den, V = [a[0] + u[0] * t, a[1] + u[1] * t];
      const da = Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1]))), tl = r * Math.tan(da / 2);
      const A = [V[0] - u[0] * tl, V[1] - u[1] * tl], B = [V[0] + v[0] * tl, V[1] + v[1] * tl], C = [A[0] - s * u[1] * r, A[1] + s * u[0] * r], a0 = Math.atan2(A[1] - C[1], A[0] - C[0]);
      arcos.push({ i0, i1, r, C, A, B, V, a0, da: s * da, pts: Array.from({ length: n + 1 }, (_, k) => [C[0] + Math.cos(a0 + (s * da * k) / n) * r, C[1] + Math.sin(a0 + (s * da * k) / n) * r]) });
    }
    const donde = []; // (en qué lugar de la planta nueva quedó cada punto de la del mapa)
    for (let i = 0; i < N; i++) { const o = arcos.find((q) => (q.i0 <= q.i1 ? i >= q.i0 && i <= q.i1 : i >= q.i0 || i <= q.i1)); donde[i] = P.length; if (!o) P.push(O[i]); else if (i === o.i0) P.push(...o.pts); else donde[i] = P.length - 1; }
    const vuelo = (d, mete = 0.3) => {
      const fuera = c.adentro(P, -d); if (!calle) return fuera;
      const dentro = c.adentro(P, mete), ix = [], g = giro(P); for (let i = donde[calle[0]]; ; i = (i + 1) % P.length) { ix.push(i); if (i === donde[calle[1]]) break; }
      // (las dos puntas, a escuadra con su fachada: el bisel de c.adentro las tiraría hacia la medianera)
      const punta = (i, j, k, e) => { const L = Math.hypot(P[j][0] - P[i][0], P[j][1] - P[i][1]); return [P[k][0] + ((g * (P[j][1] - P[i][1])) / L) * e, P[k][1] - ((g * (P[j][0] - P[i][0])) / L) * e]; };
      const n = ix.length - 1, F = ix.map((i) => fuera[i]), D = ix.map((i) => dentro[i]);
      F[0] = punta(ix[0], ix[1], ix[0], d); D[0] = punta(ix[0], ix[1], ix[0], -mete); F[n] = punta(ix[n - 1], ix[n], ix[n], d); D[n] = punta(ix[n - 1], ix[n], ix[n], -mete);
      return [...F, ...D.reverse()];
    };
    return { P, O, g: giro(O), arcos, vuelo };
  };
  /** el punto de una esquina redondeada que queda a d metros de las dos fachadas (para plantar ahí la torre) */
  const adentroDe = (o, d) => [o.V[0] + (o.C[0] - o.V[0]) * (d / o.r), o.V[1] + (o.C[1] - o.V[1]) * (d / o.r)];
  /** un vano de tinta en (x, y, z), mirando hacia el ángulo `ang` (0: hacia +x; π/2: hacia +z). Con arco, de medio
   *  punto; con redondo, un ojo de buey de diámetro w */
  const hueco = (T, w, h, x, y, z, ang, arco = true, redondo = false) => {
    const s = new THREE.Shape(), r = w / 2, hh = arco ? Math.max(0.1, h - r) : h;
    if (redondo) s.absarc(0, r, r, 0, TAU, false); else { s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, hh); if (arco) s.absarc(0, hh, r, 0, Math.PI, false); else s.lineTo(-r, hh); s.closePath(); }
    T.put(new THREE.ShapeGeometry(s, redondo ? 8 : 4).rotateY(Math.PI / 2 - ang).translate(x, y, z), TINTA);
  };
  /** una fila de n vanos sobre la pared que va de a a b (g: el giro de la planta; m: cuánto se deja libre en cada punta) */
  const lado = (T, a, b, g, n, w, h, y, { arco = true, sep = 0.07, m = 1 } = {}) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), dx = (b[0] - a[0]) / L, dz = (b[1] - a[1]) / L, nx = g * dz, nz = -g * dx, ang = Math.atan2(nz, nx);
    for (let i = 0; i < n; i++) { const t = m + ((i + 0.5) / n) * (L - 2 * m); hueco(T, w, h, a[0] + dx * t + nx * sep, y, a[1] + dz * t + nz * sep, ang, arco); }
  };
  /** n fajas verticales (pilastras) sobre la pared que va de a a b: de w de ancho, saliendo `sale`, de y a y + h */
  const fajas = (T, a, b, g, n, w, sale, y, h, tono) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), dx = (b[0] - a[0]) / L, dz = (b[1] - a[1]) / L, nx = g * dz, nz = -g * dx;
    for (let i = 0; i < n; i++) { const t = n === 1 ? L / 2 : (i / (n - 1)) * L, q = (e, f) => [a[0] + dx * (t + e) + nx * f, a[1] + dz * (t + e) + nz * f]; T.prisma([q(-w / 2, -0.2), q(w / 2, -0.2), q(w / 2, sale), q(-w / 2, sale)], h, y, PIEDRA, { tono }); }
  };
  /** n vanos alrededor de un cuerpo redondo de radio r con centro en (x, z); con a0 y da, solo en ese tramo de la vuelta */
  const anillo = (T, x, z, r, y, n, w, h, { arco = true, redondo = false, a0 = 0, da = TAU } = {}) => {
    for (let i = 0; i < n; i++) { const a = a0 + ((i + 0.5) / n) * da; hueco(T, w, h, x + Math.cos(a) * (r + 0.07), y, z + Math.sin(a) * (r + 0.07), a, arco, redondo); }
  };
  /** Lo curvo de piedra (una cúpula, una lucarna) no puede traer puntos que miren derecho para arriba: src/hitos.js
   *  los tomaría por una azotea, y la mezcla con los de al lado saldría de cualquier color. Se los inclina apenas. */
  const curva = (g) => { const n = g.attributes.normal; for (let i = 0; i < n.count; i++) if (n.getY(i) > 0.85) { const h = Math.hypot(n.getX(i), n.getZ(i)), k = h > 1e-3 ? 0.527 / h : 0; n.setXYZ(i, k ? n.getX(i) * k : 0.527, 0.85, n.getZ(i) * k); } return g; };
  /** las piezas de un edificio, ya con su tono: la planta levantada con ventanas (pared), lisa (losa), corrida hacia
   *  afuera (vuelo: balcones y cornisas) o hacia adentro (los pisos retirados), y los cuerpos redondos de las torres */
  const piezas = (T, tono) => ({
    pared: (pts, h, y = 0) => T.prisma(pts, h, y, CASA, { floors: 0, tono }),
    losa: (pts, h, y, t = tono) => T.prisma(pts, h, y, PIEDRA, { tono: t }),
    tambor: (r, h, x, y, z, r2 = r, lados = 20) => T.cilindro(r, h, x, y, z, PIEDRA, lados, r2, { tono }),
    media: (r, x, y, z, alto) => T.put(curva(new THREE.SphereGeometry(r, 16, 8, 0, TAU, 0, Math.PI / 2).scale(1, alto, 1).translate(x, y, z)), PIEDRA, { tono }),
    /** una lucarna redonda que sale de una cúpula con centro en (x, z): mira hacia el ángulo a, con el frente a
     *  `frente` metros del eje, y lleva su ojo de buey */
    lucarna: (x, z, a, frente, y, r, largo = 1.7) => {
      T.put(curva(new THREE.CylinderGeometry(r, r, largo, 8).rotateZ(Math.PI / 2).translate(frente - largo / 2, y, 0).rotateY(-a).translate(x, 0, z)), PIEDRA, { tono });
      hueco(T, 2 * r - 0.5, 0, x + Math.cos(a) * (frente + 0.06), y - r + 0.25, z + Math.sin(a) * (frente + 0.06), a, true, true);
    },
  });
  /** el balcón corrido de los 9 metros y la cornisa de los 33 que el reglamento de la avenida les pedía a todos */
  const reglamento = (K, B, H, balcon = 8.2) => { K.losa(B.vuelo(0.55), 0.4, balcon); K.losa(B.vuelo(0.75), 0.6, H); };

  // ----------------------------------------------------------------------------------------------- el Banco de Boston
  { // El First National Bank of Boston (1921-1924, de Chambers y Thomas con York y Sawyer), en la esquina de Florida,
    // Bartolomé Mitre y la Diagonal. Como en la foto de Rius de hacia 1925 («Banco de Boston (foto rius, mitchells
    // bookstore).jpg») y la de la cúpula recién hecha («Banco de Boston 1924 cúpula.JPG»): la esquina es un gran cuerpo
    // redondo, con la portada plateresca de piedra tallada (17 m) al pie; arriba, el último piso es una galería de
    // arcos bajo un alero de tejas, y sobre la esquina un tambor de arcos con su techo de tejas coloradas en punta. El
    // zócalo, hasta el primer piso, es de granito gris; el resto, símil piedra blanco.
    const T = c.obra('boston', c.BLANCO), K = piezas(T, c.BLANCO), B = planta(T, 'boston', [[3, 9, 12.5, 14]], [2, 10]), { P, O, g, arcos: [o] } = B;
    const [x, z] = o.C, R = o.r, H = 29.6, medio = o.a0 + o.da / 2; // (x hacia Florida, z hacia Bartolomé Mitre)
    K.pared(P, H); K.losa(B.vuelo(0.3), 8, 0, c.GRIS); K.losa(B.vuelo(0.6), 0.4, 8);
    lado(T, O[2], o.A, g, 8, 1.9, 5.6, 1.2, { sep: 0.37, m: 2 }); lado(T, o.B, O[10], g, 8, 1.9, 5.6, 1.2, { sep: 0.37, m: 2 });
    // la galería del último piso y el alero
    K.losa(P, 3.9, H); K.losa(B.vuelo(0.5), 0.35, H);
    lado(T, O[2], o.A, g, 10, 1.5, 2.9, H + 0.6, { m: 1.5 }); lado(T, o.B, O[10], g, 11, 1.5, 2.9, H + 0.6, { m: 1.5 });
    anillo(T, x, z, R, H + 0.6, 11, 1.5, 2.9, { a0: o.a0, da: o.da });
    T.prisma(B.vuelo(1.5, 1), 0.45, H + 3.9, PINTADO, { pinta: [PINTA.LADRILLO, 0.45] }); K.losa(c.adentro(P, 0.5), 1.3, H + 4.35);
    // la portada: un paño de piedra que sobresale de la esquina redonda, con el arco de la puerta y el remate
    const sector = (r0, r1, da) => [...Array.from({ length: 6 }, (_, k) => medio - da + (k / 5) * 2 * da).map((a) => [x + Math.cos(a) * r1, z + Math.sin(a) * r1]), ...Array.from({ length: 6 }, (_, k) => medio + da - (k / 5) * 2 * da).map((a) => [x + Math.cos(a) * r0, z + Math.sin(a) * r0])];
    K.losa(sector(R - 0.5, R + 1, 0.4), 12.6, 0); K.losa(sector(R - 0.5, R + 1.3, 0.43), 0.5, 12.6); K.losa(sector(R - 0.5, R + 1, 0.2), 4, 13.1); K.losa(sector(R - 0.5, R + 0.9, 0.09), 1.4, 17.1);
    hueco(T, 4.2, 8.6, x + Math.cos(medio) * (R + 1.08), 0, z + Math.sin(medio) * (R + 1.08), medio); hueco(T, 1.7, 3, x + Math.cos(medio) * (R + 1.08), 13.5, z + Math.sin(medio) * (R + 1.08), medio);
    for (const s of [-1, 1]) hueco(T, 1.3, 3.4, x + Math.cos(medio + s * 0.29) * (R + 1.08), 1.6, z + Math.sin(medio + s * 0.29) * (R + 1.08), medio + s * 0.29);
    // el tambor de la esquina: los arcos, la baranda, el anillo de los ojos de buey y el techo de tejas con su aguja
    const y0 = H + 4.35;
    K.tambor(9.4, 6.3, x, y0, z, 9.4, 28); anillo(T, x, z, 9.4, y0 + 1.5, 16, 2, 3.9);
    K.tambor(9.9, 0.5, x, y0 + 6.3, z, 9.9, 28); K.tambor(8.7, 2.1, x, y0 + 6.8, z, 8.7, 28); anillo(T, x, z, 8.7, y0 + 7.3, 12, 1, 1, { redondo: true });
    T.put(new THREE.CylinderGeometry(0.5, 10.3, 4.3, 28).translate(x, y0 + 8.9 + 2.15, z), PINTADO, { pinta: [PINTA.LADRILLO, 0.45] });
    K.tambor(0.5, 2.4, x, y0 + 13.2, z, 0.22, 8); K.media(0.42, x, y0 + 15.6, z, 1.6);
  }

  // ------------------------------------------------------------------------------------------ La Equitativa del Plata
  { // La Equitativa del Plata (1927-1929, de Alejandro Virasoro): la cuña entre Florida y la Diagonal, art déco. De la
    // foto de hacia 1930 («La Equitativa del Plata 1930.jpg»): la marquesina que da la vuelta a la esquina, ocho pisos
    // de fajas verticales sin un solo adorno («Sin novedad en el frente», le decían), un piso retirado y, sobre la
    // esquina redonda, la torre: un tronco de cono, un cilindro de dos pisos y una cúpula escalonada como un zigurat.
    const T = c.obra('equitativa', c.CREMA), K = piezas(T, c.CREMA), B = planta(T, 'equitativa', [[1, 5, 5.5]], [0, 6]), { P, O, g, arcos: [o] } = B;
    const [x, z] = o.C, H = 30.4;
    K.pared(P, H); K.losa(B.vuelo(1.2), 0.45, 7.3); K.losa(B.vuelo(0.6), 0.5, H); K.pared(c.adentro(P, 1.8), 3.2, H + 0.5);
    // las fajas: sobre la Diagonal, sobre Florida y dando la vuelta a la esquina
    fajas(T, [O[0][0] + 1, O[0][1] + 0.63], o.A, g, 10, 0.75, 0.4, 7.75, H - 7.75, c.CREMA); fajas(T, o.B, [O[6][0], O[6][1] + 1], g, 5, 0.75, 0.4, 7.75, H - 7.75, c.CREMA);
    for (let i = 1; i < 4; i++) { const a = o.a0 + (i / 4) * o.da; T.put(new THREE.BoxGeometry(0.6, H - 7.75, 0.75).translate(o.r + 0.1, 7.75 + (H - 7.75) / 2, 0).rotateY(-a).translate(x, 0, z), PIEDRA, { tono: c.CREMA }); }
    const y0 = H + 3.7;
    K.tambor(5.3, 3.3, x, y0, z, 4.3, 24); K.tambor(4.3, 9.3, x, y0 + 3.3, z, 4.3, 24);
    anillo(T, x, z, 4.3, y0 + 4.5, 10, 0.95, 2.1, { arco: false }); anillo(T, x, z, 4.3, y0 + 8.4, 10, 0.95, 2.1, { arco: false });
    K.tambor(4.7, 0.5, x, y0 + 12.6, z, 4.7, 24);
    // la cúpula: ocho escalones que se van cerrando
    for (let i = 0; i < 8; i++) K.tambor(4.4 * Math.cos((i / 8) * 1.42), 0.72, x, y0 + 13.1 + i * 0.72, z, 4.4 * Math.cos(((i + 0.55) / 8) * 1.42), 24);
    K.tambor(0.55, 0.7, x, y0 + 18.86, z, 0.4, 8);
  }

  // ------------------------------------------------------------------------------------------------------ el Bencich
  { // El Edificio Bencich (1927, de Eduardo Le Monnier, para la constructora de los hermanos Bencich): cierra la
    // plazoleta por el lado de Bartolomé Mitre, con una esquina redonda sobre Florida y otra sobre la Diagonal, y en
    // cada una, una cúpula de cinco pisos: el anillo de la base, el tambor de ventanales, la media naranja con dos
    // vueltas de lucarnas, la linterna y la aguja. De «Edificio Bencich (1), AA 2014.jpg», «Bencich cúpulas.jpg»,
    // «Edificio de renta ‘Bencich’.jpg» y la vista de dron «Diagonal Norte drone.jpg».
    const T = c.obra('bencich', c.SILLAR), K = piezas(T, c.SILLAR), B = planta(T, 'bencich', [[8, 10, 6], [11, 12, 8]], [7, 0]), { P, arcos } = B, H = 33;
    K.pared(P, H); reglamento(K, B, H); K.pared(c.adentro(P, 1.5), 2.9, H + 0.6);
    for (const o of arcos) {
      const [x, z] = adentroDe(o, 7), y0 = H + 0.6;
      K.tambor(6.8, 3.4, x, y0, z); anillo(T, x, z, 6.8, y0 + 0.9, 12, 1.4, 1.8, { arco: false }); K.tambor(7.1, 0.4, x, y0 + 3.4, z);
      K.tambor(6.4, 6.1, x, y0 + 3.8, z); anillo(T, x, z, 6.4, y0 + 4.7, 12, 1.6, 4.2); K.tambor(6.75, 0.45, x, y0 + 9.9, z);
      const yc = y0 + 10.35, rc = 6.4, alto = 1.2;
      K.media(rc, x, yc, z, alto);
      // las lucarnas: una vuelta abajo y otra de ojos de buey más arriba, asomando de la curva
      for (let i = 0; i < 12; i++) { K.lucarna(x, z, ((i + 0.5) / 12) * TAU, 6.25, yc + 2.5, 0.8, 1.4); K.lucarna(x, z, (i / 12) * TAU, 4.85, yc + 5.3, 0.52, 1.2); }
      const yl = yc + rc * alto - 0.4;
      K.tambor(1.5, 2.7, x, yl, z, 1.5, 10); K.tambor(1.8, 0.3, x, yl + 2.7, z, 1.8, 10); K.media(1.55, x, yl + 3, z, 1.15); T.cilindro(0.11, 3.6, x, yl + 4.6, z, TINTA, 5);
    }
  }

  // ----------------------------------------------------------------------------------------------- el Miguel Bencich
  { // El Edificio Miguel Bencich (1927, también de Le Monnier), enfrente: la esquina redonda de Florida y la Diagonal,
    // con un piso retirado detrás de la baranda y una torre de dos cuerpos redondos de arcos, cada uno con su balcón,
    // una cúpula baja y un remate escalonado. De «La Equitativa del Plata - Miguel Bencich 01.jpg» (vista desde el
    // Bencich) y «Edificio 'Miguel Bencich'.jpg».
    const T = c.obra('miguelBencich', c.BLANCO), K = piezas(T, c.BLANCO), B = planta(T, 'miguelBencich', [[8, 8, 7]], [7, 0]), { P, arcos: [o] } = B, H = 33;
    K.pared(P, H); reglamento(K, B, H); K.pared(c.adentro(P, 1.6), 3.2, H + 0.6);
    const [x, z] = adentroDe(o, 6.2), y0 = H + 0.6;
    K.tambor(5.6, 4.3, x, y0, z); anillo(T, x, z, 5.6, y0 + 0.8, 12, 1.5, 2.9); K.tambor(5.95, 0.45, x, y0 + 4.3, z);
    K.tambor(4.9, 4.1, x, y0 + 4.75, z); anillo(T, x, z, 4.9, y0 + 5.5, 10, 1.4, 2.7); K.tambor(5.25, 0.45, x, y0 + 8.85, z);
    K.media(4.9, x, y0 + 9.3, z, 0.62);
    K.tambor(1.7, 1, x, y0 + 12, z, 1.5, 10); K.tambor(1.15, 1, x, y0 + 13, z, 1, 10); K.tambor(0.75, 1.7, x, y0 + 14, z, 0.1, 10);
  }

  // -------------------------------------------------------------------------------------- el Banco Argentino Uruguayo
  { // El Banco Argentino Uruguayo (1928, de Le Monnier): la punta de la Diagonal contra la Plaza de Mayo, entre la
    // avenida y la calle San Martín, al lado de la Catedral. De «Banco Argentino Uruguayo.JPG»: la ochava es un
    // cilindro que sube los ocho pisos y sigue en una torre —un cuerpo con contrafuertes y ojos de buey, una linterna
    // de ventanales altos y la cúpula de cobre verde, a 56 metros—.
    const T = c.obra('argentinoUruguayo', c.SILLAR), K = piezas(T, c.SILLAR), B = planta(T, 'argentinoUruguayo', [[1, 4, 4.8]], [0, 5]), { P, arcos: [o] } = B, H = 33;
    K.pared(P, H); reglamento(K, B, H, 8.6); K.pared(c.adentro(P, 1.4), 3, H + 0.6);
    const [x, z] = o.C, y0 = H + 0.6, cobre = { pinta: [PINTA.COBRE, 0.4] };
    K.tambor(4.7, 4.6, x, y0, z); anillo(T, x, z, 4.7, y0 + 1, 8, 1.5, 2.2, { arco: false }); K.tambor(5, 0.45, x, y0 + 4.6, z);
    K.tambor(4.1, 5.6, x, y0 + 5.05, z); anillo(T, x, z, 4.1, y0 + 6.9, 4, 1.7, 1.7, { redondo: true, a0: Math.PI / 4 });
    for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2; T.put(new THREE.BoxGeometry(1.5, 5.6, 1.5).translate(4.25, y0 + 5.05 + 2.8, 0).rotateY(-a).translate(x, 0, z), PIEDRA, { tono: c.SILLAR }); }
    K.tambor(4.6, 0.45, x, y0 + 10.65, z);
    K.tambor(3.1, 5.3, x, y0 + 11.1, z, 3.1, 16); anillo(T, x, z, 3.1, y0 + 11.9, 8, 1.2, 3.8); K.tambor(3.45, 0.4, x, y0 + 16.4, z, 3.45, 16);
    T.cupula(3.2, x, y0 + 16.8, z, 1.25, PINTADO, cobre); T.cilindro(0.75, 1.4, x, y0 + 20.6, z, PINTADO, 8, 0.55, cobre); T.cupula(0.7, x, y0 + 22, z, 1.2, PINTADO, cobre);
    T.cilindro(0.1, 2.6, x, y0 + 22.6, z, TINTA, 5);
  }

  // ---------------------------------------------------------------------------------------------------- La Continental
  { // El edificio de la compañía de seguros La Continental (proyecto de Alejandro Bustillo de 1927, inaugurado en
    // 1931; fue el Hotel Continental): toda la manzana triangular entre la Diagonal, Maipú y Perón. Sin cúpula: un
    // bloque clásico y liso, con las esquinas en ochava, cuatro columnas de tres pisos en el medio del frente sobre la
    // avenida, una cornisa pesada y dos pisos retirados. De «Hotel Continental, Buenos Aires, Argentina - 1930s.jpg»
    // y «Hotel Continental Buenos Aires.JPG».
    const T = c.obra('continental', c.CREMA), K = piezas(T, c.CREMA), { P, O } = planta(T, 'continental'), H = 30.4;
    const cx = P.reduce((t, p) => t + p[0], 0) / P.length, cz = P.reduce((t, p) => t + p[1], 0) / P.length, achicar = (k) => P.map(([x, z]) => [cx + (x - cx) * k, cz + (z - cz) * k]);
    K.pared(P, H); K.losa(c.adentro(P, -0.7), 0.45, 7.9); K.losa(c.adentro(P, -1), 0.7, H);
    K.pared(achicar(0.84), 3.3, H + 0.7); K.losa(achicar(0.5), 2.8, H + 4);
    // las columnas, delante de un entrepaño en sombra (el frente sobre la Diagonal corre a lo largo de x, en −z)
    const zf = (O[4][1] + O[5][1]) / 2, xm = (O[4][0] + O[5][0]) / 2;
    T.fila(3, xm - 5.1, xm + 5.1, 2.3, 10.4, 8.5, zf - 0.12, '-z', false);
    T.columnas(4, xm - 5.1, zf - 0.5, xm + 5.1, zf - 0.5, 8.35, 0.62, 10.8); K.losa(T.recto(13.4, 1.5, xm, zf - 0.35), 1.2, 19.15);
  }
}
