// Retiro y la Plaza San Martín: cinco edificios que la línea de tiempo trae (y uno que se lleva).
//   - la Torre de los Ingleses (1916), en la plaza de enfrente de la estación, donde en 1867 estaba la fábrica de gas;
//   - el Plaza Hotel (1909), en la cuadra en diagonal de Florida, de cara a la plaza;
//   - el Palacio Paz (1914), sobre Santa Fe, de Maipú hacia Esmeralda;
//   - el Palacio Anchorena —desde 1936, Palacio San Martín— (1909), en Arenales 761;
//   - el Pabellón Argentino, el de hierro y vidrio de la Exposición de París de 1889: se rearmó en 1893 donde habían
//     estado los Cuarteles del Retiro, del lado de la barranca, y se desarmó en 1933 para agrandar la plaza.
// Los tres del medio van en su lugar del mapa de hoy (src/edificios.js, de tools/edificios.mjs); la torre y el
// pabellón, por su punto del plano de 1867. Años, autores y direcciones: Wikipedia en español y en inglés, y la
// Cancillería para el Palacio San Martín. Las formas salen de fotos de Wikimedia Commons (se nombra cada una en su
// edificio); son bocetos de pocas piezas, como los de src/hitos.js. El Kavanagh y la Estación Retiro están en
// src/hitos.js.
export default function (c) {
  const { THREE, PIEDRA, CASA, TINTA, PIZARRA, PINTADO, PINTA } = c, TAU = Math.PI * 2;

  // ------------------------------------------------------------------------------------------------ las herramientas
  /** hacia dónde mira cada cara: el ángulo (0: hacia +x; π/2: hacia +z) y su vector */
  const CARA = { '+x': 0, '+z': Math.PI / 2, '-x': Math.PI, '-z': -Math.PI / 2 };
  /** de qué va pintado algo: pinta('COBRE', 0.4) (el segundo número, qué tan claro sale en tinta) */
  const pinta = (k, claro = 0.5) => ({ pinta: [PINTA[k], claro] });
  /** Un vano en (x, y, z) mirando hacia el ángulo `ang`: de tinta, o un paño de otra cosa (`kind`, `o`: un vidrio, un
   *  cuadrante). Con arco, de medio punto; con redondo, un círculo de diámetro w apoyado en y. */
  const hueco = (T, w, h, x, y, z, ang, { arco = true, redondo = false, kind = TINTA, o } = {}) => {
    const s = new THREE.Shape(), r = w / 2, hh = arco ? Math.max(0.1, h - r) : h;
    if (redondo) s.absarc(0, r, r, 0, TAU, false); else { s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, hh); if (arco) s.absarc(0, hh, r, 0, Math.PI, false); else s.lineTo(-r, hh); s.closePath(); }
    T.put(new THREE.ShapeGeometry(s, redondo ? 10 : 5).rotateY(Math.PI / 2 - ang).translate(x, y, z), kind, o);
  };
  /** lo mismo sobre una pared a escuadra: `t` es el lugar a lo largo de la pared y `fijo` dónde está la pared */
  const vano = (T, w, h, t, y, fijo, cara, q) => (cara.endsWith('z') ? hueco(T, w, h, t, y, fijo, CARA[cara], q) : hueco(T, w, h, fijo, y, t, CARA[cara], q));
  /** una fila de n vanos de a a b sobre una pared a escuadra */
  const fila = (T, n, a, b, w, h, y, fijo, cara, q) => { for (let i = 0; i < n; i++) vano(T, w, h, a + ((i + 0.5) / n) * (b - a), y, fijo, cara, q); };
  /** n vanos alrededor de un cuerpo redondo (o de n lados) de radio r con centro en (x, z); a0: dónde cae el primero */
  const anillo = (T, x, z, r, y, n, w, h, { a0 = 0, ...q } = {}) => { for (let i = 0; i < n; i++) { const a = a0 + (i / n) * TAU; hueco(T, w, h, x + Math.cos(a) * (r + 0.07), y, z + Math.sin(a) * (r + 0.07), a, q); } };
  /** Lo curvo de piedra no puede traer puntos que miren derecho para arriba: src/hitos.js los tomaría por una azotea. Se los inclina apenas. */
  const curva = (g) => { const n = g.attributes.normal; for (let i = 0; i < n.count; i++) if (n.getY(i) > 0.85) { const h = Math.hypot(n.getX(i), n.getZ(i)), k = h > 1e-3 ? 0.527 / h : 0; n.setXYZ(i, k ? n.getX(i) * k : 0.527, 0.85, n.getZ(i) * k); } return g; };
  /** un frontis: el triángulo (o el arco rebajado, con curvo) de `ancho` × `alto` y `fondo` de espesor, mirando hacia `cara` */
  const frontis = (T, ancho, alto, fondo, t, y, fijo, cara, kind = PIEDRA, o, curvo = false) => {
    const s = new THREE.Shape(); s.moveTo(-ancho / 2, 0); s.lineTo(ancho / 2, 0); if (curvo) s.absellipse(0, 0, ancho / 2, alto, 0, Math.PI, false); else s.lineTo(0, alto); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: fondo, bevelEnabled: false, curveSegments: 8 }).translate(0, 0, -fondo / 2);
    if (cara.endsWith('x')) g.rotateY(Math.PI / 2);
    T.put(cara.endsWith('z') ? g.translate(t, y, fijo) : g.translate(fijo, y, t), kind, { H: y + alto, ...o });
  };
  /** una media naranja de n gajos (8: ochavada), de radio r y `alto` veces más alta, apoyada en y */
  const media = (T, r, x, y, z, alto, gajos, kind, o) => T.put(curva(new THREE.SphereGeometry(r, gajos, 6, 0, TAU, 0, Math.PI / 2).rotateY(Math.PI / gajos).scale(1, alto, 1).translate(x, y, z)), kind, o);

  /** la planta de un edificio de src/edificios.js en metros de su lugar (sin repetir el primer punto) */
  const plantaDe = (T, clave) => c.EDIFICIOS[clave].planta[0].slice(0, -1).map(([px, py]) => T.deMundo(px, py));
  /** una mansarda sobre una planta cualquiera: sube h metiéndose `mete` por cada lado, con su tapa */
  const mansardaDe = (T, pts, h, y, mete, kind = PIZARRA, o) => {
    const A = pts, B = c.adentro(pts, mete), v = [], n = A.length; let area = 0;
    for (let i = 0; i < n; i++) { const [x0, z0] = A[i], [x1, z1] = A[(i + 1) % n]; area += x0 * z1 - x1 * z0; }
    for (let i = 0; i < n; i++) {
      const k = (i + 1) % n, a = [A[i][0], y, A[i][1]], b = [A[k][0], y, A[k][1]], d = [B[k][0], y + h, B[k][1]], e = [B[i][0], y + h, B[i][1]];
      if (area > 0) v.push(a, d, b, a, e, d); else v.push(a, b, d, a, d, e);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v.flat(), 3)); g.computeVertexNormals(); T.put(g, kind, o);
    T.put(new THREE.ShapeGeometry(new THREE.Shape(B.map(([x, z]) => new THREE.Vector2(x, -z)))).rotateX(-Math.PI / 2).translate(0, y + h, 0), kind, o);
  };
  /** una fila de n vanos sobre la pared que va de a a b (la de afuera queda a la izquierda de a→b si g > 0); m: lo que se deja libre en cada punta */
  const lado = (T, a, b, g, n, w, h, y, { sep = 0.07, m = 1, ...q } = {}) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), dx = (b[0] - a[0]) / L, dz = (b[1] - a[1]) / L, nx = g * dz, nz = -g * dx, ang = Math.atan2(nz, nx);
    for (let i = 0; i < n; i++) { const t = m + ((i + 0.5) / n) * (L - 2 * m); hueco(T, w, h, a[0] + dx * t + nx * sep, y, a[1] + dz * t + nz * sep, ang, q); }
  };
  /** una caja sobre la pared que va de a a b: de w de ancho (a lo largo), saliendo `sale`, con el centro a t metros de a */
  const sobre = (T, a, b, g, t, w, sale, y, h, kind, o) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), dx = (b[0] - a[0]) / L, dz = (b[1] - a[1]) / L, nx = g * dz, nz = -g * dx, q = (e, f) => [a[0] + dx * (t + e) + nx * f, a[1] + dz * (t + e) + nz * f];
    T.prisma([q(-w / 2, -0.2), q(w / 2, -0.2), q(w / 2, sale), q(-w / 2, sale)], h, y, kind, o);
  };
  /** para qué lado gira una planta [x, z]: +1 o −1 */
  const giro = (P) => { let a = 0; for (let i = 0; i < P.length; i++) { const [x0, z0] = P[i], [x1, z1] = P[(i + 1) % P.length]; a += x0 * z1 - x1 * z0; } return a > 0 ? 1 : -1; };

  // ------------------------------------------------------------------------------------------ la Torre de los Ingleses
  { // La Torre de los Ingleses (hoy Torre Monumental): el regalo de los residentes británicos para el Centenario, de
    // Ambrose Macdonald Poynter. La piedra fundamental es de noviembre de 1910; se inauguró el 24 de mayo de 1916, en
    // el terreno que la compañía de gas recién dejó en 1912. Ladrillo colorado y piedra de Portland traídos de
    // Inglaterra, ocho pisos y unos 60 metros (59 dice Wikipedia en español; 60, la ficha del mapa de hoy).
    // De la foto del día de la inauguración («Torre monumental inauguracion.jpg») y de la postal de Bourquin y
    // Kohlmann tomada desde un arco de la estación («MG-017-0002 (Buenos Aires– Torre Británica.).tif»): la
    // plataforma con sus escaleras; el basamento de piedra, con la puerta y los escudos del lado de la plaza San
    // Martín; el fuste de ladrillo liso con cuatro ventanas de marco blanco por cara (la de abajo, con frontis y
    // balcón); el balcón de hierro; el cuerpo de piedra del reloj —los cuadrantes, de 4,4 m—; la baranda, y el
    // templete de ocho lados en dos pisos, con la cúpula de cobre y la veleta (una fragata). Las alturas de cada
    // parte, a ojo sobre esas dos fotos, repartidas en los 60 metros.
    const T = c.lugar(12962, 9571, 0.62, -0.7846); c.epoca(c.etapaDe(1916)); // (x hacia la estación, al noroeste; la puerta mira a −z: al sudoeste, a la plaza San Martín)
    const piedra = { tono: c.BLANCO }, ladrillo = pinta('LADRILLO', 0.5), cobre = pinta('COBRE', 0.42), blanco = pinta('BLANCO', 0.96);
    const P = (w, h, d, x, y, z) => T.caja(w, h, d, x, y, z, PIEDRA, piedra), CARAS = ['+x', '-x', '+z', '-z'], sg = (cara) => (cara[0] === '-' ? -1 : 1);
    // la plataforma, con su baranda y una escalera por lado
    P(22, 1.2, 22, 0, 0, 0);
    for (const [sx, sz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      for (let i = 0; i < 3; i++) T.caja(sx ? 1 : 6, 0.4 * (3 - i), sx ? 6 : 1, sx * (11.5 + i), 0, sz * (11.5 + i), PIEDRA, { tono: c.GRIS });
      for (const s of [-1, 1]) { const l = 7.4, m = s * (3.3 + l / 2); P(sx ? 0.4 : l, 0.95, sx ? l : 0.4, sx ? sx * 10.7 : m, 1.2, sx ? m : sz * 10.7); }
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { P(0.9, 1.5, 0.9, sx * 10.7, 1.2, sz * 10.7); T.cilindro(0.09, 3.2, sx * 10.7, 2.7, sz * 10.7, TINTA, 5); T.put(new THREE.SphereGeometry(0.36, 8, 6).translate(sx * 10.7, 6.1, sz * 10.7), PINTADO, pinta('BLANCO', 0.97)); }
    // el basamento de piedra: la puerta con su frontis y, encima, los escudos
    const y0 = 1.2, B = 9.4, HB = 7.3;
    P(B + 0.8, 1, B + 0.8, 0, y0, 0); P(B, HB - 1, B, 0, y0 + 1, 0); P(B + 1, 0.5, B + 1, 0, y0 + HB, 0);
    P(4.6, 4.6, 1.1, 0, y0, -B / 2 - 0.3); frontis(T, 5.2, 1.2, 1.3, 0, y0 + 4.6, -B / 2 - 0.3, '-z', PIEDRA, piedra);
    vano(T, 1.9, 3.9, 0, y0 + 0.3, -B / 2 - 0.92, '-z'); vano(T, 2.6, 1.3, 0, y0 + 5.9, -B / 2 - 0.07, '-z', { arco: false, kind: PINTADO, o: pinta('PATINA', 0.45) });
    for (const cara of ['+x', '-x', '+z']) vano(T, 1.5, 3.4, 0, y0 + 2.6, sg(cara) * (B / 2 + 0.07), cara);
    // el fuste de ladrillo y sus cuatro ventanas por cara
    const y1 = y0 + HB + 0.5, F = 8, y2 = 33, HF = y2 - y1;
    T.caja(F, HF, F, 0, y1, 0, PINTADO, ladrillo);
    for (const cara of CARAS) {
      const s = sg(cara), f = s * F / 2, caja = (w, h, y) => (cara.endsWith('z') ? P(w, h, 0.5, 0, y, f) : P(0.5, h, w, f, y, 0));
      [11.2, 18.4, 23.8, 29.2].forEach((y, i) => { caja(1.7, 2.9, y - 1.45); vano(T, 1.05, 2.2, 0, y - 1.1, f + s * 0.32, cara, { arco: false }); if (!i) { caja(2.3, 0.3, y - 1.75); frontis(T, 2.1, 0.8, 0.5, 0, y + 1.45, f, cara, PIEDRA, piedra, true); if (cara.endsWith('z')) T.caja(2.5, 0.8, 0.9, 0, y - 1.5, f + s * 0.5, TINTA); else T.caja(0.9, 0.8, 2.5, f + s * 0.5, y - 1.5, 0, TINTA); } });
    }
    // el balcón de hierro y el cuerpo del reloj
    const R = 7.8, y3 = 43.8;
    P(F + 1.1, 0.45, F + 1.1, 0, y2, 0); P(F + 2.6, 0.35, F + 2.6, 0, y2 + 0.45, 0);
    for (const [sx, sz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) T.caja(sx ? 0.07 : F + 2.5, 1, sx ? F + 2.5 : 0.07, sx * (F / 2 + 1.2), y2 + 0.8, sz * (F / 2 + 1.2), TINTA);
    P(R, y3 - y2 - 0.8, R, 0, y2 + 0.8, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) P(0.9, y3 - y2 - 0.8, 0.9, sx * (R / 2 - 0.3), y2 + 0.8, sz * (R / 2 - 0.3));
    const yr = 39.9; // (el centro de los cuadrantes)
    for (const cara of CARAS) {
      const s = sg(cara), f = s * (R / 2 + 0.07);
      vano(T, 5.4, 0, 0, yr - 2.7, f, cara, { redondo: true }); vano(T, 4.6, 0, 0, yr - 2.3, f + s * 0.06, cara, { redondo: true, kind: PINTADO, o: blanco });
      const ag = (l, w, a) => { const g = new THREE.PlaneGeometry(w, l).translate(0, l / 2 - 0.25, 0).rotateZ(a).rotateY(Math.PI / 2 - CARA[cara]); T.put(cara.endsWith('z') ? g.translate(0, yr, f + s * 0.12) : g.translate(f + s * 0.12, yr, 0), TINTA); };
      ag(2, 0.2, 0.5); ag(1.4, 0.28, -1.9);
      vano(T, 1, 1.7, 0, y2 + 1.5, f, cara, { arco: false });
    }
    // la cornisa de arriba, la baranda con sus remates y el templete de ocho lados, en dos pisos
    P(R + 1.2, 0.5, R + 1.2, 0, y3, 0); P(R + 1.9, 0.35, R + 1.9, 0, y3 + 0.5, 0);
    for (const [sx, sz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) P(sx ? 0.25 : R + 1.8, 0.85, sx ? R + 1.8 : 0.25, sx * (R / 2 + 0.8), y3 + 0.85, sz * (R / 2 + 0.8));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { P(0.8, 1.4, 0.8, sx * (R / 2 + 0.65), y3 + 0.85, sz * (R / 2 + 0.65)); T.piramide(0.5, 1.3, sx * (R / 2 + 0.65), y3 + 2.25, sz * (R / 2 + 0.65), PIEDRA, 4, piedra); }
    const y4 = y3 + 0.85, ocho = (r, h, y, kind = PIEDRA, o = piedra) => T.put(curva(new THREE.CylinderGeometry(r, r, h, 8).rotateY(Math.PI / 8).translate(0, y + h / 2, 0)), kind, o);
    ocho(3.3, 4.4, y4); anillo(T, 0, 0, 3.3 * Math.cos(Math.PI / 8), y4 + 0.6, 8, 1.3, 3.2); ocho(3.7, 0.4, y4 + 4.4);
    ocho(2.5, 2.4, y4 + 4.8); anillo(T, 0, 0, 2.5 * Math.cos(Math.PI / 8), y4 + 5.1, 8, 0.9, 1.8); ocho(2.9, 0.35, y4 + 7.2);
    // la cúpula de cobre, acampanada, con su aguja y la veleta
    const yd = y4 + 7.55;
    T.put(new THREE.LatheGeometry([[2.75, 0], [2.85, 0.5], [2.7, 1.3], [2.2, 2.2], [1.4, 2.9], [0.6, 3.4], [0.25, 4]].map(([r, y]) => new THREE.Vector2(r, y)), 8).rotateY(Math.PI / 8).translate(0, yd, 0), PINTADO, cobre);
    T.cilindro(0.2, 2.2, 0, yd + 4, 0, PINTADO, 6, 0.06, cobre); T.cilindro(0.05, 2.2, 0, yd + 6.2, 0, TINTA, 4);
    T.caja(1.5, 0.8, 0.06, 0, yd + 7.3, 0, TINTA); // (la fragata de la veleta)
  }

  // ------------------------------------------------------------------------------------------------- el Plaza Hotel
  { // El Plaza Hotel (Florida 1005, entonces Florida y Charcas): lo hizo levantar Ernesto Tornquist, con proyecto de
    // Alfred Zucker; abrió el 15 de julio de 1909, con nueve pisos. Wikipedia en inglés le da 63 metros de alto; las
    // fotos no dan para tanto (nueve pisos, con la mansarda: unos 40) y acá va como en las fotos.
    // De «Plaza hotel bs as en 1910.jpg» y «Plaza Hotel (1910).jpg»: un basamento de piedra de dos pisos, con arcos y
    // un balcón corrido arriba; cinco pisos de ladrillo con tiras de miradores claros; la cornisa, un ático y la
    // mansarda de pizarra, cargada de lucarnas ovaladas y de crestería. Sobre la cuadra en diagonal de Florida, de
    // cara a la plaza, son dos alas con un patio abierto en el medio, y las esquinas del ala norte, redondas y con
    // cúpula; el frente del sudoeste, donde Florida llega a la plaza, traía en 1910 la entrada, bajo dos marquesinas
    // y detrás de un cerco. En la foto de Peuser de los años veinte («Plaza Hotel (Peuser).JPG») delante de ese
    // frente ya hay un pabellón de dos pisos, de frente redondo (la entrada de carruajes es de 1913). La reforma de
    // 1934, que le sacó adornos, no se pudo ver en fotos: en 1940 queda como en 1921.
    const T = c.obra('plazaHotel', c.LADRILLO), O = plantaDe(T, 'plazaHotel'), g = giro(O); // (x hacia la plaza: el frente de Florida es +x; z a lo largo de Florida, hacia el norte)
    const piedra = { tono: c.BLANCO }, HB = 9.4, HC = 28.6, HA = 32.4, HM = 38.2;
    T.prisma(c.adentro(O, -0.25), HB, 0, PIEDRA, piedra); T.prisma(c.adentro(O, -0.9), 0.45, HB, PIEDRA, piedra); T.prisma(c.adentro(O, -0.75), 0.9, HB + 0.45, PIEDRA, piedra);
    T.prisma(O, HC - HB, HB, CASA, { floors: 5, tono: c.LADRILLO });
    T.prisma(c.adentro(O, -1), 0.8, HC, PIEDRA, piedra); T.prisma(c.adentro(O, 0.2), HA - HC - 0.8, HC + 0.8, CASA, { floors: 1, tono: c.BLANCO }); T.prisma(c.adentro(O, -0.3), 0.4, HA, PIEDRA, piedra);
    mansardaDe(T, O, HM - HA - 0.4, HA + 0.4, 2.4);
    // los frentes a la calle: [de qué punto a cuál, cuántos arcos abajo, dónde van las tiras de miradores]
    const FRENTES = [[10, 0, 8, [4.5, 11, 17.5, 24, 30.5]], [0, 1, 3, [3, 9]], [4, 5, 4, [4.5, 12.5]], [5, 6, 6, [5, 12.5, 20]], [9, 10, 3, [7]], [1, 2, 4, [6, 14]], [3, 4, 4, [6, 14]]];
    for (const [i, k, n, tiras] of FRENTES) {
      const a = O[i], b = O[k], patio = (i === 1 && k === 2) || (i === 3 && k === 4);
      lado(T, a, b, g, n, 2, 5.6, 2.3, { sep: 0.33, m: 1.6 });
      for (const t of tiras) {
        sobre(T, a, b, g, t, 2.5, 0.75, HB + 1.35, HC - HB - 1.9, PIEDRA, piedra);
        if (!patio) { sobre(T, a, b, g, t, 2.2, 0.5, HA + 0.4, 2.9, PIEDRA, piedra); sobre(T, a, b, g, t, 1, 0.56, HA + 1.2, 1.3, TINTA); }
        for (let p = 0; p < 5; p++) sobre(T, a, b, g, t, 1.5, 0.82, HB + 2 + p * 3.84, 2.1, TINTA);
      }
    }
    { const B = c.adentro(O, 2.45), C = c.adentro(O, 2.6); for (let i = 0; i < O.length; i++) { const k = (i + 1) % O.length; T.prisma([B[i], B[k], C[k], C[i]], 0.55, HM, TINTA); } } // (la crestería, sobre el borde de la mansarda)
    // las esquinas redondas con cúpula: las dos del ala norte sobre Florida y la del sur, sobre Charcas
    for (const i of [4, 5, 10]) {
      const [x, z] = c.adentro(O, 1.6)[i];
      T.cilindro(3.4, HB, x, 0, z, PIEDRA, 14, 3.4, piedra); T.cilindro(3.2, HC - HB, x, HB, z, CASA, 14, 3.2, { floors: 5, tono: c.BLANCO }); T.cilindro(3.9, 0.8, x, HC, z, PIEDRA, 14, 3.9, piedra);
      T.cilindro(3.2, HA - HC - 0.4, x, HC + 0.8, z, CASA, 14, 3.2, { floors: 1, tono: c.BLANCO }); T.cilindro(3.5, 0.4, x, HA + 0.4, z, PIEDRA, 14, 3.5, piedra);
      T.cupula(3.3, x, HA + 0.8, z, 1.75, PIZARRA); T.cilindro(0.5, 1.3, x, HA + 6.5, z, PIZARRA, 6, 0.15); T.cilindro(0.05, 1.6, x, HA + 7.8, z, TINTA, 4);
    }
    // las chimeneas
    for (const [x, z] of [[14, -14.5], [14, 12], [-4, -12], [-4, 14], [6, -17.5], [8, 17]]) T.caja(1.3, 3.4, 2.2, x, HM - 1, z, PIEDRA, piedra);
    { // delante del frente del sudoeste: en 1910, el cerco y las dos marquesinas de la entrada; después, el pabellón
      const a = O[10], b = O[0], e = c.etapaDe(1909);
      c.epoca(e, e + 1);
      for (const t of [20.5, 26]) { sobre(T, a, b, g, t, 3.6, 3.4, 4.6, 0.5, TINTA); sobre(T, a, b, g, t, 3, 3, 5.1, 0.7, PINTADO, pinta('CHAPA', 0.5)); }
      sobre(T, a, b, g, 16, 30, 6.6, 0, 1.5, PIEDRA, piedra); sobre(T, a, b, g, 16, 29.4, 6.3, 1.5, 0.1, PINTADO, pinta('CESPED', 0.7));
      c.epoca(e + 1);
      sobre(T, a, b, g, 21, 21, 6.5, 0, 9, PIEDRA, piedra); sobre(T, a, b, g, 21, 21.8, 7, 9, 0.5, PIEDRA, piedra); sobre(T, a, b, g, 21, 21, 6.6, 9.5, 0.9, PIEDRA, piedra);
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]), u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], nn = [g * u[1], -g * u[0]], cx = a[0] + u[0] * 21 + nn[0] * 6.5, cz = a[1] + u[1] * 21 + nn[1] * 6.5, an = Math.atan2(nn[1], nn[0]);
      T.cilindro(5.4, 9, cx, 0, cz, PIEDRA, 16, 5.4, piedra); T.cilindro(5.8, 0.5, cx, 9, cz, PIEDRA, 16, 5.8, piedra); T.cilindro(5.4, 0.9, cx, 9.5, cz, PIEDRA, 16, 5.4, piedra);
      for (let i = -2; i <= 2; i++) { const q = an + i * 0.5; hueco(T, 1.6, 4.4, cx + Math.cos(q) * 5.47, 4, cz + Math.sin(q) * 5.47, q); hueco(T, 1.6, 2.6, cx + Math.cos(q) * 5.47, 0.5, cz + Math.sin(q) * 5.47, q, { arco: false }); }
      for (const t of [12.5, 15.5, 26.5, 29.5]) { const p = [a[0] + u[0] * t + nn[0] * 6.57, a[1] + u[1] * t + nn[1] * 6.57]; hueco(T, 1.6, 4.4, p[0], 4, p[1], an); hueco(T, 1.6, 2.6, p[0], 0.5, p[1], an, { arco: false }); }
    }
  }

  // --------------------------------------------------------------------------------------------------- el Palacio Paz
  { // El Palacio Paz (Avenida Santa Fe 750): la casa de José C. Paz, el fundador de La Prensa, proyectada en París por
    // Louis Sortais y dirigida acá por Carlos Agote; la obra fue de 1902 a 1914 (Paz murió en 1912, sin verla
    // terminada). La compró el Estado en 1938 y es la sede del Círculo Militar; las cocheras del lado de Esmeralda
    // se cambiaron por el pabellón de deportes recién en 1941, así que en 1940 sigue como era.
    // De la foto de la revista Plus Ultra de junio de 1916 («Palacio Paz en 1916. Buenos Aires.png»), tomada desde la
    // plaza: tres pisos de símil piedra —un zócalo bajo, la planta noble de ventanas de arco y el piso alto de
    // ventanas rectas con balcones— y las mansardas de pizarra con sus lucarnas; en la esquina de Maipú, la rotonda
    // con su cúpula y su linterna en aguja; sobre Santa Fe, el pabellón del medio, de techo alto con frontis, y otro
    // en la punta, con su aguja, al lado del portón; sobre Maipú, el mirador redondo (el «bow window»).
    const T = c.obra('palacioPaz', c.SILLAR), O = plantaDe(T, 'palacioPaz'), g = giro(O), sillar = { tono: c.SILLAR }; // (x hacia el norte, z hacia Maipú: el frente de Santa Fe va en diagonal)
    const HZ = 2.6, HN = 9, HC = 14.6, HM = 21;
    const P = [O[0], O[1], O[2], O[3], O[8], O[12], O[13], O[14], O[15], O[16], O[17], O[18], O[19], O[20], O[21], O[22]]; // (la planta, sin los quiebres chicos del mirador)
    T.prisma(P, HC, 0, PIEDRA, sillar); T.prisma(c.adentro(P, -0.3), HZ, 0, PIEDRA, { tono: c.GRIS }); T.prisma(c.adentro(P, -0.45), 0.4, HN, PIEDRA, sillar); T.prisma(c.adentro(P, -0.8), 0.7, HC, PIEDRA, sillar);
    mansardaDe(T, c.adentro(P, 0.3), HM - HC - 0.7, HC + 0.7, 2.6);
    /** los tres pisos de vanos de un tramo de pared: los del zócalo, los de arco de la planta noble y los rectos de arriba */
    const pisos = (a, b, n, m = 1.5) => { lado(T, a, b, g, n, 1.3, 1.1, 0.9, { arco: false, m, sep: 0.37 }); lado(T, a, b, g, n, 1.7, 4.4, HZ + 1.2, { m }); lado(T, a, b, g, n, 1.5, 3.2, HN + 1.3, { arco: false, m }); };
    /** una lucarna de la mansarda sobre la pared de a a b, a t metros de a */
    const lucarna = (a, b, t) => { sobre(T, a, b, g, t, 1.7, -0.5, HC + 0.7, 2.7, PIEDRA, sillar); const L = Math.hypot(b[0] - a[0], b[1] - a[1]), u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], n = [g * u[1], -g * u[0]]; hueco(T, 1, 1.9, a[0] + u[0] * t + n[0] * -0.43, HC + 1.1, a[1] + u[1] * t + n[1] * -0.43, Math.atan2(n[1], n[0])); };
    const largo = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]), en = (a, b, t) => { const L = largo(a, b); return [a[0] + ((b[0] - a[0]) * t) / L, a[1] + ((b[1] - a[1]) * t) / L]; };
    /** un pabellón sobre la pared de a a b, con el centro a t metros de a: sale un poco, sube más y lleva un techo alto de pizarra (con aguja si se pide) */
    const pabellon = (a, b, t, w, fondo, alto, aguja) => {
      const L = largo(a, b), u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], n = [g * u[1], -g * u[0]], q = (e, f) => [a[0] + u[0] * (t + e) + n[0] * f, a[1] + u[1] * (t + e) + n[1] * f], R = [q(-w / 2, -fondo), q(w / 2, -fondo), q(w / 2, 0.9), q(-w / 2, 0.9)], ang = Math.atan2(n[1], n[0]);
      T.prisma(R, HC + 0.5, 0, PIEDRA, sillar); T.prisma(c.adentro(R, -0.5), 0.7, HC + 0.5, PIEDRA, sillar); mansardaDe(T, R, alto, HC + 1.2, Math.min(w, fondo + 0.9) / 2 - (aguja ? 0.4 : 1.6));
      const nv = Math.max(1, Math.round(w / 4.2));
      for (let i = 0; i < nv; i++) { const e = -w / 2 + ((i + 0.5) / nv) * w, p = q(e, 0.97); hueco(T, 1.9, 4.8, p[0], HZ + 1.2, p[1], ang); hueco(T, 1.6, 3.4, p[0], HN + 1.3, p[1], ang, { arco: false }); hueco(T, 1.3, 1.1, p[0], 0.9, p[1], ang, { arco: false }); }
      sobre(T, q(-w / 2, 0), q(w / 2, 0), g, w / 2, Math.min(3.4, w - 2), 1.1, HC + 1.2, 3.2, PIEDRA, sillar); hueco(T, 1.4, 2.3, q(0, 1.17)[0], HC + 1.7, q(0, 1.17)[1], ang);
      if (aguja) { const m = q(0, -fondo / 2 + 0.45); T.cilindro(0.07, 3.5, m[0], HC + 1.2 + alto, m[1], TINTA, 4); }
      else T.prisma([q(-w / 2 + 1.8, -fondo / 2 + 0.35), q(w / 2 - 1.8, -fondo / 2 + 0.35), q(w / 2 - 1.8, -fondo / 2 + 0.55), q(-w / 2 + 1.8, -fondo / 2 + 0.55)], 0.6, HC + 1.2 + alto, TINTA);
    };
    // el frente de Santa Fe: del portón (el punto 20 del mapa) a la rotonda de la esquina (el 21)
    { const a = O[20], b = O[21], L = largo(a, b);
      pabellon(a, b, L - 17, 5.5, 8, 10, true); pabellon(a, b, L * 0.44, 13, 12, 9, false); pabellon(a, b, 4.2, 7, 9, 11, true);
      for (const [t0, t1, n] of [[L - 13.8, L - 6.5, 2], [L * 0.44 + 7, L - 20.3, 4], [8.2, L * 0.44 - 7, 4]]) { pisos(en(a, b, t0), en(a, b, t1), n, 0.6); for (let i = 0; i < n; i++) lucarna(a, b, t0 + 0.6 + ((i + 0.5) / n) * (t1 - t0 - 1.2)); }
      // el frontis del pabellón del medio
      const u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], n = [g * u[1], -g * u[0]], m = en(a, b, L * 0.44); T.put(new THREE.ExtrudeGeometry(new THREE.Shape([[-4.4, 0], [4.4, 0], [0, 2.4]].map(([x, y]) => new THREE.Vector2(x, y))), { depth: 0.8, bevelEnabled: false }).rotateY(Math.PI / 2 - Math.atan2(n[1], n[0])).translate(m[0] + n[0] * 0.5, HC + 4.4, m[1] + n[1] * 0.5), PIEDRA, { ...sillar, H: HC + 6.9 });
    }
    // la rotonda de la esquina de Maipú, con su cúpula de pizarra y la linterna en aguja
    { const [x, z] = c.adentro(O, 2.6)[21], r = 5.2, an = Math.atan2(z - O[21][1] + 0.001, x - O[21][0]) + Math.PI;
      T.cilindro(r + 0.3, HZ, x, 0, z, PIEDRA, 18, r + 0.3, { tono: c.GRIS }); T.cilindro(r, HC + 1.4 - HZ, x, HZ, z, PIEDRA, 18, r, sillar); T.cilindro(r + 0.35, 0.4, x, HN, z, PIEDRA, 18, r + 0.35, sillar); T.cilindro(r + 0.7, 0.7, x, HC + 1.4, z, PIEDRA, 18, r + 0.7, sillar);
      for (let i = -2; i <= 2; i++) { const q = an + i * 0.62; if (i) hueco(T, 1.3, 3.6, x + Math.cos(q) * (r + 0.07), HZ + 1.6, z + Math.sin(q) * (r + 0.07), q); else { hueco(T, 2.6, 4.6, x + Math.cos(q) * (r + 0.07), HZ + 1.2, z + Math.sin(q) * (r + 0.07), q); hueco(T, 1.7, 2.9, x + Math.cos(q) * (r + 0.37), 0, z + Math.sin(q) * (r + 0.37), q, { arco: false }); } hueco(T, i ? 1.2 : 2, 3.3, x + Math.cos(q) * (r + 0.07), HN + 1.3, z + Math.sin(q) * (r + 0.07), q, { arco: false }); }
      T.cupula(r + 0.1, x, HC + 2.1, z, 1.25, PIZARRA); T.cilindro(1.2, 1.6, x, HC + 8.3, z, PIEDRA, 8, 1, sillar); T.cilindro(1.3, 2.6, x, HC + 9.9, z, PIZARRA, 8, 0.12); T.cilindro(0.05, 2.4, x, HC + 12.5, z, TINTA, 4);
      for (const s of [-1, 1]) { const q = an + s * 1.55; T.caja(1.1, 5.6, 1.1, x + Math.cos(q) * (r - 1.2), HC + 2.1, z + Math.sin(q) * (r - 1.2), PIEDRA, sillar); } // (las chimeneas de los costados)
    }
    // sobre Maipú, hasta el mirador redondo de la esquina de Charcas (hoy Marcelo T. de Alvear), y el ala de esa calle
    { const a = O[21], b = O[22], L = largo(a, b); pisos(en(a, b, 5.5), en(a, b, L - 1), 4, 0.8); for (let i = 0; i < 4; i++) lucarna(a, b, L - 3 - i * 4.3); }
    { const [x, z] = O[22], r = 4.4; T.cilindro(r, HN + 0.4, x - 1.4, 0, z - 1.6, PIEDRA, 14, r, sillar); T.cilindro(r + 0.3, HZ, x - 1.4, 0, z - 1.6, PIEDRA, 14, r + 0.3, { tono: c.GRIS }); T.cilindro(r + 0.3, 0.9, x - 1.4, HN + 0.4, z - 1.6, PIEDRA, 14, r + 0.3, sillar); anillo(T, x - 1.4, z - 1.6, r, HZ + 1.2, 5, 1.4, 4.2, { a0: Math.PI / 2 - 0.2 - 1.2 * 2 + 1.2 }); }
    pisos(O[0], O[1], 9, 4); for (let i = 0; i < 8; i++) lucarna(O[0], O[1], 7 + i * 5);
    // del lado del jardín, liso: una fila de ventanas por piso
    pisos(O[15], O[16], 2, 1); pisos(O[16], O[17], 6, 2); pisos(O[14], O[15], 4, 1.5);
    for (const [x, z] of [[-27, 12], [-27, -8], [-24, 22], [2, 14], [14, -2], [22, -16]]) T.caja(1.2, 5.2, 2, x, HM - 2.4, z, PIEDRA, sillar); // (las chimeneas)
    { // el portón de hierro y bronce, al final del frente, y la reja del jardín hasta la esquina de Esmeralda
      const a = O[20], u = [(O[20][0] - O[21][0]) / largo(O[21], O[20]), (O[20][1] - O[21][1]) / largo(O[21], O[20])], q = (t) => [a[0] + u[0] * t, a[1] + u[1] * t];
      for (const t of [1.2, 7.2]) { const p = q(t); T.caja(1.5, 7.4, 1.5, p[0], 0, p[1], PIEDRA, sillar); T.cilindro(0.5, 1.1, p[0], 7.4, p[1], PIEDRA, 6, 0.25, sillar); }
      const m = q(4.2), an = Math.atan2(-g * u[0], g * u[1]); T.put(new THREE.BoxGeometry(0.12, 5.6, 4.6).rotateY(-an).translate(m[0], 2.8, m[1]), TINTA);
      const f = q(36); T.put(new THREE.BoxGeometry(0.1, 2.6, 28).rotateY(-an).translate((q(8)[0] + f[0]) / 2, 1.3, (q(8)[1] + f[1]) / 2), TINTA);
      for (let t = 8; t <= 36; t += 7) { const p = q(t); T.caja(0.9, 3.2, 0.9, p[0], 0, p[1], PIEDRA, sillar); }
    }
  }

  // --------------------------------------------------------------------------------------------- el Palacio San Martín
  { // El Palacio Anchorena (Arenales 761), de Alejandro Christophersen para Mercedes Castellanos de Anchorena y sus
    // hijos: tres casas alrededor de un patio de honor, detrás de un solo portal. Proyecto de 1905; la Cancillería da
    // la obra entre 1905 y 1909 (otras fichas la estiran hasta 1912 o 1916). El Estado lo compró en 1936 para el
    // Ministerio de Relaciones Exteriores, y desde entonces es el Palacio San Martín.
    // De la foto de hacia 1910 «Palacio anchorena 1900s.jpg», tomada desde la plaza: sobre Arenales, dos pabellones
    // de tres pisos —el zócalo de granito, la planta noble de ventanas de arco con balcones y el piso alto entre
    // pilastras— con mansardas de pizarra de ojos de buey y chimeneas altas; entre los dos, más bajo y metido hacia
    // adentro, el portal: un arco grande entre columnas pareadas. Detrás (de fotos de hoy), el patio oval con su
    // galería de columnas y el cuerpo del fondo, de techo curvo de pizarra.
    const T = c.obra('palacioSanMartin', c.SILLAR), sillar = { tono: c.SILLAR }, gris = { tono: c.GRIS }; // (x hacia Esmeralda, al oeste; el frente de Arenales es −z)
    const HZ = 3.6, HN = 10, HC = 16, HM = 21.6, ZF = -20, PW = 23, X0 = -36.6, X1 = 35.8;
    const S = (w, h, d, x, y, z) => T.caja(w, h, d, x, y, z, PIEDRA, sillar);
    /** una de las casas: el cuerpo de tres pisos con su zócalo, sus cornisas, la mansarda con la crestería y las chimeneas */
    const casa = (xa, xb, za, zb) => {
      const w = xb - xa, d = zb - za, x = (xa + xb) / 2, z = (za + zb) / 2;
      S(w, HC, d, x, 0, z); T.caja(w + 0.5, HZ, d + 0.5, x, 0, z, PIEDRA, gris); S(w + 0.8, 0.4, d + 0.8, x, HN, z); S(w + 1.7, 0.8, d + 1.7, x, HC, z);
      T.mansarda(w, d, HM - HC - 0.8, x, HC + 0.8, z, 2.6); T.caja(w - 5, 0.5, 0.08, x, HM, z - d / 2 + 2.7, TINTA); T.caja(w - 5, 0.5, 0.08, x, HM, z + d / 2 - 2.7, TINTA);
      for (const sx of [-1, 1]) for (const e of [-0.28, 0.28]) { S(1.5, 6.6, 2.2, x + sx * (w / 2 - 1.4), HC + 0.8, z + e * d); S(1.9, 0.5, 2.6, x + sx * (w / 2 - 1.4), HC + 7.4, z + e * d); }
    };
    /** los vanos de una pared de una casa: los del zócalo, los de arco con su balcón, los rectos de arriba y los ojos de buey de la mansarda */
    const frente = (n, a, b, fijo, cara) => {
      const s = cara[0] === '-' ? -1 : 1;
      fila(T, n, a, b, 1.5, 1.6, 1, fijo + s * 0.32, cara, { arco: false }); fila(T, n, a, b, 2, 4.6, HZ + 1.2, fijo + s * 0.07, cara); fila(T, n, a, b, 1.7, 3.6, HN + 1.4, fijo + s * 0.07, cara, { arco: false });
      for (let i = 0; i < n; i++) {
        const t = a + ((i + 0.5) / n) * (b - a);
        for (const [y, sale] of [[HZ + 0.5, 0.5], [HN + 0.6, 0.6]]) { if (cara.endsWith('z')) T.caja(2.9, 0.8, sale, t, y, fijo + s * sale / 2, TINTA); else T.caja(sale, 0.8, 2.9, fijo + s * sale / 2, y, t, TINTA); }
        // el ojo de buey, en su marco de piedra, asomando de la mansarda
        if (cara.endsWith('z')) { S(2.3, 2.9, 1.2, t, HC + 0.8, fijo - s * 0.9); frontis(T, 2.3, 0.9, 1.2, t, HC + 3.7, fijo - s * 0.9, cara, PIEDRA, sillar, true); } else { S(1.2, 2.9, 2.3, fijo - s * 0.9, HC + 0.8, t); frontis(T, 2.3, 0.9, 1.2, t, HC + 3.7, fijo - s * 0.9, cara, PIEDRA, sillar, true); }
        vano(T, 1.3, 0, t, HC + 1.7, fijo - s * 0.27, cara, { redondo: true });
      }
    };
    const XA = -PW / 2, XB = PW / 2, ZB = 9.4;
    casa(X0, XA, ZF, ZB); casa(XB, X1, ZF, ZB);
    frente(3, X0 + 1.5, XA - 1.5, ZF, '-z'); frente(3, XB + 1.5, X1 - 1.5, ZF, '-z'); frente(4, ZF + 2, ZB - 2, X0, '-x'); frente(4, ZF + 2, ZB - 2, X1, '+x');
    fila(T, 3, X0 + 2, XA - 2, 1.7, 3.6, HN + 1.4, ZB + 0.07, '+z', { arco: false }); fila(T, 3, XB + 2, X1 - 2, 1.7, 3.6, HN + 1.4, ZB + 0.07, '+z', { arco: false });
    fila(T, 3, X0 + 2, XA - 2, 2, 4.6, HZ + 1.2, ZB + 0.07, '+z'); fila(T, 3, XB + 2, X1 - 2, 2, 4.6, HZ + 1.2, ZB + 0.07, '+z');
    // el portal, entre las dos casas y metido 5 metros: el arco grande con su reja, entre columnas pareadas, y un ala baja a cada lado
    const ZP = ZF + 5, HP = 8.6;
    S(PW, HP, 4, 0, 0, ZP + 2); T.caja(PW + 0.2, 1.4, 4.3, 0, 0, ZP + 2, PIEDRA, gris); S(PW, 0.6, 4.8, 0, HP, ZP + 2); S(PW, 0.9, 0.3, 0, HP + 0.6, ZP + 0.3);
    S(8.6, 11.4, 5, 0, 0, ZP + 1.7); frontis(T, 9.6, 2.5, 5.4, 0, 11.4, ZP + 1.7, '-z', PIEDRA, sillar, true);
    vano(T, 5, 9.6, 0, 0, ZP - 0.87, '-z'); for (const e of [-1, 1]) { T.columnas(2, e * 3.3, ZP - 1.4, e * 4.1, ZP - 1.4, 1.4, 0.36, 6.6); S(2, 1.4, 1.2, e * 3.7, 0, ZP - 1.4); S(2, 0.6, 1.2, e * 3.7, 8, ZP - 1.4); vano(T, 2.2, 4.8, e * 8, 2, ZP - 0.07, '-z', { arco: false }); }
    // el patio de honor: la galería curva de columnas y, al fondo, el cuerpo del medio, redondo, con su techo de pizarra
    const zc = -3.5, rx = 11, rz = 6.6;
    T.tapete(T.ovalo(0, zc, rx, rz, 24), PINTA.ADOQUIN, { y: 0.12 });
    for (let i = 0; i < 12; i++) { const q = Math.PI * (0.06 + (i / 11) * 0.88), x = Math.cos(q) * rx, z = zc + Math.sin(q) * rz; T.put(new THREE.CylinderGeometry(0.3, 0.34, 5, 8).translate(x, 4.6, z), PIEDRA, sillar); }
    T.prisma([...T.ovalo(0, zc, rx + 0.6, rz + 0.6, 24).filter(([, z]) => z >= zc), ...T.ovalo(0, zc, rx + 3.4, rz + 3.4, 24).filter(([, z]) => z >= zc).reverse()], 0.7, 7.1, PIEDRA, sillar);
    T.prisma([...T.ovalo(0, zc, rx + 0.4, rz + 0.4, 24).filter(([, z]) => z >= zc), ...T.ovalo(0, zc, rx + 3.4, rz + 3.4, 24).filter(([, z]) => z >= zc).reverse()], 2.1, 0, PIEDRA, sillar);
    const XC0 = -18.8, XC1 = 13.7, ZC1 = 20.6, xm = (XC0 + XC1) / 2;
    S(PW + 0.2, HC, ZB - 5.6, 0, 0, (ZB + 5.6) / 2 - 0.1); casa(XC0, XC1, ZB - 0.2, ZC1);
    frente(5, XC0 + 1.5, XC1 - 1.5, ZC1, '+z'); frente(2, ZB + 1.5, ZC1 - 1.5, XC0, '-x'); frente(2, ZB + 1.5, ZC1 - 1.5, XC1, '+x');
    T.cilindro(7.6, HC + 0.8, 0, 0, 6.2, PIEDRA, 20, 7.6, sillar); T.cilindro(8, 0.8, 0, HC + 0.8, 6.2, PIEDRA, 20, 8, sillar); T.cupula(7.5, 0, HC + 1.6, 6.2, 0.75, PIZARRA); T.cilindro(1.6, 1.2, 0, HC + 6.8, 6.2, PIZARRA, 10, 1.2);
    anillo(T, 0, 6.2, 7.6, HN + 1.4, 12, 1.5, 3.3, { arco: false, a0: Math.PI + 0.26 }); void xm;
  }

  // --------------------------------------------------------------------------------------------- el Pabellón Argentino
  { // El Pabellón Argentino de la Exposición Universal de París de 1889 (Albert Ballu): hierro, vidrio, cerámica y
    // mosaicos. Se desarmó en 1890, llegó en barco y el ingeniero Juan Waldorp lo rearmó en 1893 (se reinauguró el 14
    // de enero de 1894) donde habían estado los Cuarteles del Retiro, entre la plaza y la barranca. Fue sala de
    // exposiciones y, de 1910 a 1932, el Museo Nacional de Bellas Artes; en 1933 lo desarmaron para agrandar la plaza.
    // De las dos fotos de la Sociedad Fotográfica Argentina de Aficionados («Pabellon argentino en plaza sanmartin.jpg»
    // y «Pabellon argentino sfa.jpg»), de la de Avanzi de 1900 («Pabellon-argentino plazasmartin 1900.jpg») y de la
    // de 1932, de frente y desde abajo de la barranca («Pabellon argentino en pza sanmartin.jpg»): un cuerpo largo de
    // dos pisos sobre un terraplén con muro de ladrillo y reja; en las cuatro esquinas, pilones con un grupo de bronce
    // arriba; en cada cabecera, un ventanal de medio punto bajo un frontis; en el medio del lado de la plaza, la
    // portada de tres arcos con el grupo de bronce adentro (del lado de la barranca, un solo ventanal), y a cada lado
    // tres paños con galería de arquitos y balcones; arriba, la cúpula grande sobre su cuerpo cuadrado y cuatro chicas.
    // El lugar y el rumbo salen de la postal de hacia 1920 («Plaza San Martín y Pabellón Argentino (ca. 1920).jpg»):
    // el lado largo sobre la calle que bordeaba la plaza, y en la punta de Maipú el anexo bajo de arcos (la confitería
    // de Carlos Morra, después la Comisión Nacional de Bellas Artes). Las medidas se sacaron de la foto de frente,
    // tomando 68 m de largo (las fuentes dan 1.600 m² y de 23 a 30 m de alto): 68 × 23,5 m, 10 a la cornisa de las
    // galerías, 14 a la de los pilones, 16 a los frontis y 25 al tope de la cúpula.
    const T = c.lugar(12571, 9256, 0.578, -0.816); c.epoca(c.etapaDe(1894), c.etapaDe(1933)); // (x a lo largo, hacia el noroeste —hacia Maipú—; la plaza queda en −z y la barranca en +z)
    const L = 68, W = 23.5, X = L / 2, Z = W / 2, H = 10.4, y0 = 1.3, PIL = 2.7, HP = 13.8, CUMBRE = 16.2;
    const crema = { tono: c.CREMA }, barro = { tono: c.LADRILLO }, vidrio = pinta('AGUA', 0.5), zinc = pinta('CHAPA', 0.62), bronce = pinta('PATINA', 0.3), ladrillo = pinta('LADRILLO', 0.45);
    const Cr = (w, h, d, x, y, z) => T.caja(w, h, d, x, y, z, PIEDRA, crema), Ba = (w, h, d, x, y, z) => T.caja(w, h, d, x, y, z, PIEDRA, barro);
    /** un pilar fino con su remate (una copa de loza) */
    const pilar = (x, z, h, w = 1.2) => { Ba(w, h, w, x, y0, z); Cr(w + 0.3, 0.3, w + 0.3, x, y0 + h - 1.5, z); T.cilindro(0.5, 0.8, x, y0 + h, z, PIEDRA, 6, 0.28, crema); T.cilindro(0.28, 1, x, y0 + h + 0.8, z, PIEDRA, 6, 0.07, crema); };
    /** un arco con su arquivolta clara, de w × h, sobre la pared `fijo`: de vidrio (o) o en sombra */
    const ventanal = (w, h, t, y, fijo, cara, s, o = vidrio) => { vano(T, w + 1, h + 0.5, t, y, fijo + s * 0.07, cara, { kind: PIEDRA, o: crema }); vano(T, w, h, t, y, fijo + s * 0.13, cara, o ? { kind: PINTADO, o } : {}); };
    // el terraplén: el muro de ladrillo, los pilares y la reja
    const TX = X + 6, TZ = Z + 5.5;
    T.caja(2 * TX, y0, 2 * TZ, 0, 0, 0, PINTADO, ladrillo); T.tapete(T.recto(2 * TX - 1, 2 * TZ - 1), PINTA.GRANZA, { y: y0 + 0.08 });
    for (const s of [-1, 1]) { T.caja(2 * TX, 1.6, 0.08, 0, y0, s * (TZ - 0.3), TINTA); T.caja(0.08, 1.6, 2 * TZ, s * (TX - 0.3), y0, 0, TINTA); }
    for (const s of [-1, 1]) { for (let i = 0; i <= 8; i++) Cr(0.8, 2.2, 0.8, -TX + 0.3 + (i / 8) * (2 * TX - 0.6), y0, s * (TZ - 0.3)); for (let i = 1; i < 4; i++) Cr(0.8, 2.2, 0.8, s * (TX - 0.3), y0, -TZ + 0.3 + (i / 4) * (2 * TZ - 0.6)); }
    // el cuerpo, la cornisa con su crestería de hierro y el techo de cinc, a dos aguas, con su linterna corrida
    Cr(L - 4, H, W - 1, 0, y0, 0); Ba(L - 3.4, 0.5, W - 0.2, 0, y0 + H, 0);
    for (const s of [-1, 1]) T.caja(L - 6, 0.6, 0.08, 0, y0 + H + 0.5, s * (Z - 0.4), TINTA);
    T.tejado(L - 3.6, W - 1.4, 3.3, 0, y0 + H + 0.5, 0, 'x', PIZARRA);
    for (const s of [-1, 1]) { T.caja(18, 1, 3.4, s * 19.5, y0 + H + 2.9, 0, PINTADO, vidrio); T.tejado(18, 3.8, 0.8, s * 19.5, y0 + H + 3.9, 0, 'x', PIZARRA); }
    // los cuatro pilones de las esquinas, cada uno con su grupo de bronce arriba (una Fama con su trompeta)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = sx * (X - PIL / 2), z = sz * (Z - PIL / 2), m = PIL / 2 + 0.07;
      Ba(PIL, HP, PIL, x, y0, z); Ba(PIL + 0.6, 2.4, PIL + 0.6, x, y0, z);
      for (const y of [4.4, 9.6, HP - 2.2]) Cr(PIL + 0.3, 0.35, PIL + 0.3, x, y0 + y, z);
      Cr(PIL + 1.2, 0.6, PIL + 1.2, x, y0 + HP, z); Ba(PIL - 0.2, 1, PIL - 0.2, x, y0 + HP + 0.6, z); Ba(PIL - 1.1, 0.7, PIL - 1.1, x, y0 + HP + 1.6, z);
      for (const cara of [sx > 0 ? '+x' : '-x', sz > 0 ? '+z' : '-z']) {
        const e = cara.endsWith('x') ? [z, x + sx * m] : [x, z + sz * m];
        vano(T, 0.95, 2.2, e[0], y0 + 5.6, e[1], cara); vano(T, 1.2, 0, e[0], y0 + HP - 1.6, e[1], cara, { redondo: true, kind: PINTADO, o: pinta('BLANCO', 0.9) });
      }
      const yb = y0 + HP + 2.3, a = Math.atan2(sz, sx);
      T.cilindro(0.8, 0.8, x, yb, z, PINTADO, 6, 0.55, bronce); T.cilindro(0.55, 2.4, x, yb + 0.8, z, PINTADO, 6, 0.2, bronce); T.put(new THREE.SphereGeometry(0.3, 6, 5).translate(x, yb + 3.4, z), PINTADO, bronce);
      for (const q of [-1, 1]) T.put(new THREE.BoxGeometry(0.12, 2.2, 1).rotateX(q * 0.5).translate(-0.3, yb + 3, q * 0.75).rotateY(-a).translate(x, 0, z), PINTADO, bronce); // (las alas)
      T.put(new THREE.BoxGeometry(1.5, 0.1, 0.1).translate(0.9, yb + 3.3, 0).rotateY(-a).translate(x, 0, z), PINTADO, bronce); // (la trompeta)
    }
    // las cabeceras: bajo el frontis, el ventanal de medio punto entre dos pilares finos, y un paño más chico a cada lado
    for (const s of [-1, 1]) {
      const cara = s > 0 ? '+x' : '-x', f = s * (X - 0.9), A = W - 2 * PIL, hm = CUMBRE - 3.4;
      Ba(1.2, hm, A, f, y0, 0); frontis(T, A, 3.4, 1.2, 0, y0 + hm, f, cara, PIEDRA, barro); frontis(T, A + 0.5, 3.7, 0.5, 0, y0 + hm, f - s * 0.5, cara, PIEDRA, crema);
      ventanal(7.4, 7.6, 0, y0 + 5, f + s * 0.6, cara, s);
      for (const e of [-1, 1]) { vano(T, 0.14, 6.6, e * 1.25, y0 + 5, f + s * 0.8, cara, { arco: false }); pilar(f + s * 0.25, e * 4.9, CUMBRE - 1); ventanal(2.3, 4.6, e * 7.1, y0 + 5.6, f + s * 0.6, cara, s); vano(T, 1.2, 2.5, e * 7.1, y0 + 0.3, f + s * 0.67, cara, { arco: false }); }
      vano(T, 0.14, 3.8, 0, y0 + 5, f + s * 0.8, cara, { arco: false }); vano(T, 7, 0.14, 0, y0 + 8.8, f + s * 0.8, cara, { arco: false });
      vano(T, 7.4, 3.5, 0, y0 + 0.5, f + s * 0.67, cara, { arco: false, kind: PINTADO, o: vidrio });
      T.caja(1.1, 0.85, 8.8, f + s * 1.1, y0 + 4.2, 0, TINTA); for (const e of [-1, 1]) T.caja(0.9, 0.85, 2.7, f + s * 1, y0 + 4.7, e * 7.1, TINTA); // (los balcones)
    }
    // los lados largos: en el medio la portada (tres arcos del lado de la plaza, un ventanal del de la barranca) y, a cada lado, tres paños con su galería
    const PW = 22, V = (L - 2 * PIL - PW) / 6; // (el ancho de la portada y el de cada paño)
    for (const s of [-1, 1]) {
      const cara = s > 0 ? '+z' : '-z', f = s * (Z - 0.5), plaza = s < 0;
      Ba(PW, 11.4, 2.2, 0, y0, f); Ba(9.4, 1.5, 2.2, 0, y0 + 11.4, f); frontis(T, 9.4, 3.3, 2.2, 0, y0 + 12.9, f, cara, PIEDRA, barro); frontis(T, 10, 3.6, 0.5, 0, y0 + 12.9, f - s * 0.6, cara, PIEDRA, crema);
      if (plaza) { // el arco grande, con el grupo de bronce adentro y el letrero
        ventanal(6.6, 11.6, 0, y0 + 0.4, f + s * 1.1, cara, s, null);
        Cr(7, 0.8, 0.3, 0, y0 + 4.2, f + s * 1.25); T.cilindro(1.5, 1, 0, y0 + 5, f + s * 0.75, PINTADO, 6, 1.1, bronce); T.cilindro(1.1, 2.6, 0, y0 + 6, f + s * 0.75, PINTADO, 6, 0.3, bronce);
      } else { ventanal(6.6, 7.4, 0, y0 + 4.6, f + s * 1.1, cara, s); vano(T, 6.6, 3.4, 0, y0 + 0.5, f + s * 1.17, cara, { arco: false, kind: PINTADO, o: vidrio }); T.caja(8, 0.85, 1, 0, y0 + 4, f + s * 1.5, TINTA); }
      for (const e of [-1, 1]) {
        frontis(T, 4.7, 2.4, 2.2, e * 7.75, y0 + 11.4, f, cara, PIEDRA, barro);
        if (plaza) ventanal(2.8, 9.2, e * 7.75, y0 + 0.4, f + s * 1.1, cara, s, null); else { ventanal(2.6, 4.6, e * 7.75, y0 + 5.2, f + s * 1.1, cara, s); vano(T, 2.6, 3.4, e * 7.75, y0 + 0.5, f + s * 1.17, cara, { arco: false, kind: PINTADO, o: vidrio }); }
        pilar(e * 5.2, f + s * 0.75, CUMBRE - 0.5); pilar(e * 10.4, f + s * 0.75, HP);
        // los tres paños: abajo el vidrio, arriba la galería en sombra con sus tres arquitos y el balcón de hierro
        for (let i = 0; i < 3; i++) {
          const x = e * (PW / 2 + V / 2 + i * V), w = V - 1.3;
          vano(T, w, 3.6, x, y0 + 0.5, f + s * 0.07, cara, { arco: false, kind: PINTADO, o: vidrio });
          vano(T, w, 4.3, x, y0 + 4.9, f + s * 0.07, cara, { arco: false });
          for (const q of [-1, 1]) Cr(0.16, 4.3, 0.16, x + q * (w / 6), y0 + 4.9, f + s * 0.1);
          T.caja(w + 0.3, 0.85, 0.8, x, y0 + 4.5, f + s * 0.45, TINTA);
          if (i < 2) Ba(0.5, H, 0.3, x + e * (V / 2), y0, f + s * 0.1);
        }
      }
    }
    // la cúpula grande, sobre su cuerpo cuadrado de vidrios y su tambor, y las cuatro chicas alrededor
    const yc = y0 + H + 1.5, B = 11.5, ya = y0 + 16.4;
    Ba(B, ya - yc, B, 0, yc, 0); Cr(B + 0.6, 0.4, B + 0.6, 0, ya, 0);
    for (const cara of ['+x', '-x', '+z', '-z']) fila(T, 5, -4.6, 4.6, 1.1, 1.2, ya - 1.7, (cara[0] === '-' ? -1 : 1) * (B / 2 + 0.07), cara, { arco: false, kind: PINTADO, o: vidrio });
    T.cilindro(4.7, 1.9, 0, ya + 0.4, 0, PIEDRA, 20, 4.7, barro); T.cilindro(4.95, 0.35, 0, ya + 2.3, 0, PIEDRA, 20, 4.95, crema);
    T.cupula(4.75, 0, ya + 2.65, 0, 1.3, PINTADO, zinc); T.cilindro(0.7, 1.1, 0, ya + 8.7, 0, PINTADO, 8, 0.4, zinc); T.cupula(0.5, 0, ya + 9.8, 0, 1.2, PINTADO, zinc); T.cilindro(0.05, 1.8, 0, ya + 10.3, 0, TINTA, 5);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = sx * 7.3, z = sz * 6.6;
      T.cilindro(2.3, 3.1, x, yc, z, PIEDRA, 12, 2.3, barro); T.cilindro(2.5, 0.3, x, yc + 3.1, z, PIEDRA, 12, 2.5, crema);
      media(T, 2.35, x, yc + 3.4, z, 1.25, 10, PINTADO, zinc); T.cilindro(0.25, 1.3, x, yc + 6.1, z, PINTADO, 6, 0.07, zinc);
    }
    { // el anexo de la punta de Maipú: un pabellón bajo, de arcos entre pilastras, con su baranda
      const xa = TX + 11.5, za = -TZ + 6.5;
      Cr(19, 6.4, 12, xa, 0, za); Cr(19.8, 0.5, 12.8, xa, 6.4, za); Cr(19.4, 0.9, 12.4, xa, 6.9, za); T.caja(18, 0.2, 11, xa, 7.6, za, PINTADO, zinc);
      fila(T, 5, xa - 8.6, xa + 8.6, 2.2, 4.6, 0.9, za - 6.07, '-z'); fila(T, 3, za - 5.2, za + 5.2, 2.2, 4.6, 0.9, xa + 9.57, '+x'); fila(T, 5, xa - 8.6, xa + 8.6, 1.6, 3, 1.6, za + 6.07, '+z', { arco: false });
      T.cilindro(0.5, 0.8, xa, 7.8, za - 5, PINTADO, 6, 0.4, bronce); T.cilindro(0.4, 1.8, xa, 8.6, za - 5, PINTADO, 6, 0.15, bronce);
    }
  }
}
