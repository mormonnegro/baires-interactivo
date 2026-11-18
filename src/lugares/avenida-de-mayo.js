// La Avenida de Mayo y el centro: cinco edificios que no eran una casa más, cada uno en su lugar del mapa de hoy
// (src/edificios.js, de tools/edificios.mjs) y en su año:
//   - el diario La Prensa (1898), Avenida de Mayo 575, con la farola en la punta;
//   - el Palacio Municipal, al lado: el de 1893 sobre la avenida y el ensanche de 1914 hasta Rivadavia;
//   - la Confitería del Molino (1916), en Callao y Rivadavia, con su torre y las aspas;
//   - la Galería Güemes (1915), de Florida a San Martín, el primer rascacielos;
//   - Gath & Chaves (1914), en Florida y Cangallo, con la cúpula de pizarra en la esquina.
// Años, direcciones, pisos y alturas: Wikipedia en español (y en inglés para la torre del Molino). Las formas salen de
// fotos de época de Wikimedia Commons (se nombra cada una en su edificio); son bocetos de pocas piezas, como los de
// src/hitos.js y los de la Diagonal Norte. Cada edificio cuelga de su propio origen (c.obra).
export default function (c) {
  const { THREE, PIEDRA, CASA, TINTA, PIZARRA, PINTADO, PINTA } = c, TAU = Math.PI * 2;

  // ------------------------------------------------------------------------------------------------ las herramientas
  /** para qué lado gira una planta [x, z]: +1 o −1 (de eso depende cuál es el lado de afuera de cada pared) */
  const giro = (P) => { let a = 0; for (let i = 0; i < P.length; i++) { const [x0, z0] = P[i], [x1, z1] = P[(i + 1) % P.length]; a += x0 * z1 - x1 * z0; } return a > 0 ? 1 : -1; };
  const centro = (P) => [P.reduce((t, p) => t + p[0], 0) / P.length, P.reduce((t, p) => t + p[1], 0) / P.length];
  /** Una pared, de a a b, de una planta que gira g: su largo (L), hacia dónde mira (ang; 0: hacia +x, π/2: hacia +z)
   *  y en(t, f): el punto que está a t metros de a y a f metros de la pared (hacia afuera; negativo, hacia adentro). */
  const pared = (a, b, g) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), dx = (b[0] - a[0]) / L, dz = (b[1] - a[1]) / L, nx = g * dz, nz = -g * dx;
    return { L, ang: Math.atan2(nz, nx), en: (t, f = 0) => [a[0] + dx * t + nx * f, a[1] + dz * t + nz * f] };
  };
  /** un vano de tinta en (x, y, z), mirando hacia el ángulo `ang`. Con arco, de medio punto; con redondo, un ojo de buey de diámetro w */
  const hueco = (T, w, h, x, y, z, ang, arco = false, redondo = false) => {
    const s = new THREE.Shape(), r = w / 2, hh = arco ? Math.max(0.1, h - r) : h;
    if (redondo) s.absarc(0, r, r, 0, TAU, false); else { s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, hh); if (arco) s.absarc(0, hh, r, 0, Math.PI, false); else s.lineTo(-r, hh); s.closePath(); }
    T.put(new THREE.ShapeGeometry(s, redondo ? 8 : 4).rotateY(Math.PI / 2 - ang).translate(x, y, z), TINTA);
  };
  /** una fila de n vanos sobre la pared W, repartidos entre t0 y t1 */
  const vanos = (T, W, n, w, h, y, { arco = false, redondo = false, sep = 0.07, t0 = 1, t1 = W.L - 1 } = {}) => {
    for (let i = 0; i < n; i++) { const [x, z] = W.en(t0 + ((i + 0.5) / n) * (t1 - t0), sep); hueco(T, w, h, x, y, z, W.ang, arco, redondo); }
  };
  /** un bloque apoyado en la pared W: de t0 a t1 a lo largo y de f0 a f1 hacia afuera, de y a y + h */
  const bloque = (T, W, t0, t1, f0, f1, h, y, kind = PIEDRA, o) => T.prisma([W.en(t0, f0), W.en(t1, f0), W.en(t1, f1), W.en(t0, f1)], h, y, kind, o);
  /** un rectángulo apoyado en la pared W (para levantarle algo encima): de t0 a t1 y `fondo` metros hacia adentro desde f */
  const paño = (W, t0, t1, fondo, f = 0) => [W.en(t0, f), W.en(t1, f), W.en(t1, f - fondo), W.en(t0, f - fondo)];
  /** n vanos alrededor de un cuerpo redondo de radio r con centro en (x, z); con a0 y da, solo en ese tramo de la vuelta */
  const anillo = (T, x, z, r, y, n, w, h, { arco = true, redondo = false, a0 = 0, da = TAU } = {}) => {
    for (let i = 0; i < n; i++) { const a = a0 + ((i + 0.5) / n) * da; hueco(T, w, h, x + Math.cos(a) * (r + 0.07), y, z + Math.sin(a) * (r + 0.07), a, arco, redondo); }
  };
  /** los puntos de un círculo (o de un polígono regular de n lados) de radio r con centro en (x, z); a0: hacia dónde mira el primero */
  const ronda = (x, z, r, n = 16, a0 = 0) => Array.from({ length: n }, (_, i) => [x + Math.cos(a0 + (i / n) * TAU) * r, z + Math.sin(a0 + (i / n) * TAU) * r]);
  /** Un techo torneado sobre la planta P: el perfil es una lista de [mete, y] —a esa altura, la planta corrida `mete`
   *  metros hacia adentro (negativo: un alero que sale)—. Sirve para una mansarda (dos renglones), un techo bombé, una
   *  cúpula, una aguja. Con `punta`, cierra en un punto a esa altura; si no, lo tapa plano. */
  const torno = (T, P, perfil, kind = PIZARRA, o = {}, punta = null) => {
    const [cx, cz] = centro(P), R = perfil.map(([m, y]) => (m ? c.adentro(P, m) : P).map(([x, z]) => [x, y, z])), n = P.length, v = [];
    const tri = (a, b, d, arriba) => { // (cada cara, mirando hacia afuera del eje —o hacia arriba, las tapas—)
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], wx = d[0] - a[0], wy = d[1] - a[1], wz = d[2] - a[2], nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
      const s = arriba ? ny : nx * ((a[0] + b[0] + d[0]) / 3 - cx) + nz * ((a[2] + b[2] + d[2]) / 3 - cz);
      if (s >= 0) v.push(...a, ...b, ...d); else v.push(...a, ...d, ...b);
    };
    for (let k = 0; k + 1 < R.length; k++) for (let i = 0; i < n; i++) { const j = (i + 1) % n; tri(R[k][i], R[k][j], R[k + 1][j]); tri(R[k][i], R[k + 1][j], R[k + 1][i]); }
    const U = R[R.length - 1];
    if (punta != null) for (let i = 0; i < n; i++) tri(U[i], U[(i + 1) % n], [cx, punta, cz]);
    else for (const [i, j, k] of THREE.ShapeUtils.triangulateShape(U.map(([x, , z]) => new THREE.Vector2(x, z)), [])) tri(U[i], U[j], U[k], true);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals();
    T.put(g, kind, { H: punta ?? perfil[perfil.length - 1][1], ...o });
  };
  /** el perfil de un techo bombé (un cuarto de elipse): de y0 a y1, metiéndose hasta `mete`, en n pasos */
  const bombe = (y0, y1, mete, n = 6) => Array.from({ length: n + 1 }, (_, k) => [mete * (1 - Math.cos((k / n) * Math.PI / 2)), y0 + (y1 - y0) * Math.sin((k / n) * Math.PI / 2)]);
  /** una hilera de lucarnas sobre la pared W: n cajas de piedra con su frontis y su ventana, asomando de la mansarda */
  const lucarnas = (T, W, n, t0, t1, y, tono, { w = 1.7, h = 2.5, fondo = 1.8, sale = 0.05, arco = true } = {}) => {
    for (let i = 0; i < n; i++) {
      const t = t0 + ((i + 0.5) / n) * (t1 - t0);
      bloque(T, W, t - w / 2, t + w / 2, sale - fondo, sale, h, y, PIEDRA, { tono }); bloque(T, W, t - w / 2 - 0.2, t + w / 2 + 0.2, sale - fondo, sale + 0.15, 0.3, y + h, PIEDRA, { tono });
      const [x, z] = W.en(t, sale + 0.07); hueco(T, w - 0.6, h - 0.5, x, y + 0.2, z, W.ang, arco);
    }
  };
  /** un frontis sobre la pared W, centrado en t: de `ancho` × `alto` y `fondo` de espesor, desde f hacia adentro. Curvo o en triángulo */
  const fronton = (T, W, t, f, ancho, alto, fondo, y, tono, curvo = true) => {
    const s = new THREE.Shape(); s.moveTo(-ancho / 2, 0); s.lineTo(ancho / 2, 0); if (curvo) s.absellipse(0, 0, ancho / 2, alto, 0, Math.PI, false); else s.lineTo(0, alto); s.closePath();
    const [x, z] = W.en(t, f);
    T.put(new THREE.ExtrudeGeometry(s, { depth: fondo, bevelEnabled: false, curveSegments: 6 }).translate(0, 0, -fondo).rotateY(Math.PI / 2 - W.ang).translate(x, y, z), PIEDRA, { tono, H: y + alto });
  };
  /** una crestería de hierro: una tira de tinta de (x0, z0) a (x1, z1) */
  const cresta = (T, a, b, y, h = 0.6) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = ((b[1] - a[1]) / L) * 0.06, nz = (-(b[0] - a[0]) / L) * 0.06; T.prisma([[a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz], [a[0] - nx, a[1] - nz]], h, y, TINTA); };
  /** la esfera de un reloj: un disco blanco con su aro, mirando hacia `ang` */
  const reloj = (T, x, y, z, r, ang) => {
    const cara = (rr, d, kind, o) => T.put(new THREE.CircleGeometry(rr, 14).rotateY(Math.PI / 2 - ang).translate(x + Math.cos(ang) * d, y, z + Math.sin(ang) * d), kind, o);
    cara(r * 1.18, 0.05, TINTA); cara(r, 0.09, PINTADO, { pinta: [PINTA.BLANCO, 0.96] });
  };

  // ------------------------------------------------------------------------------------------------------- La Prensa
  { // El edificio del diario La Prensa (1894-1898, proyectado en París y adaptado por los ingenieros Carlos Agote y
    // Alberto Gainza), Avenida de Mayo 575: 30,7 m de frente sobre la avenida y otro tanto sobre Rivadavia, con planta
    // baja y seis pisos. De la foto de frente de hacia 1910 («Edificio La Prensa (1910).JPG») y la de la colocación
    // de la farola en noviembre de 1898 («Cupula La Prensa.JPG»): siete vanos (dos, tres, dos), la planta baja de
    // arcos, el balcón corrido con sus faroles, tres pisos, la cornisa con balaustrada y la mansarda; en el medio, un
    // techo bombé de pizarra con el reloj en su lucarna, la terraza con baranda, la linterna y, arriba de todo, a 50
    // metros, la farola: la Palas Atenea de bronce dorado de Maurice Bouval (5,50 m), con la antorcha en alto.
    // El frente de Rivadavia no sale en ninguna foto: va igual pero más simple (supuesto).
    const tono = c.SILLAR, T = c.obra('prensa', tono), O = c.EDIFICIOS.prensa.planta[0].map(([px, py]) => T.deMundo(px, py));
    const P = [O[1], O[2], O[3], O[4]], g = giro(P), F = pared(P[0], P[1], g), R = pared(P[2], P[3], g), L = F.L, H = 25.4;
    const liso = (pts, h, y) => T.prisma(pts, h, y, PIEDRA, { tono });
    liso(P, H, 0);
    for (const [W, simple] of [[F, false], [R, true]]) {
      // la planta baja, almohadillada, con sus siete arcos; el balcón corrido del primer piso y su balaustrada
      bloque(T, W, 0, L, -0.2, 0.4, 8.4, 0, PIEDRA, { tono: c.GRIS }); vanos(T, W, 7, 2.5, 6.2, 0.7, { arco: true, sep: 0.47 });
      bloque(T, W, 0.2, L - 0.2, -0.2, 1.1, 0.4, 8.4, PIEDRA, { tono }); bloque(T, W, 0.2, L - 0.2, 0.9, 1.08, 0.85, 8.8, PIEDRA, { tono });
      // los tres pisos: dos vanos angostos en cada punta y tres más anchos en el medio
      for (const [y, h] of [[9.6, 3.9], [15, 3.3], [20.7, 3.3]]) { vanos(T, W, 2, 1.4, h, y, { t0: 1.2, t1: 7.6 }); vanos(T, W, 3, 1.7, h, y, { t0: 7.8, t1: L - 7.8 }); vanos(T, W, 2, 1.4, h, y, { t0: L - 7.6, t1: L - 1.2 }); }
      // las pilastras de dos pisos, la cornisa del medio con su balcón, y arriba la cornisa grande y la balaustrada
      for (const t of [0.5, 7.7, 12.6, L - 12.6, L - 7.7, L - 0.5]) { bloque(T, W, t - 0.45, t + 0.45, -0.1, 0.3, 10.6, 8.8, PIEDRA, { tono }); bloque(T, W, t - 0.4, t + 0.4, -0.1, 0.25, 5, 20.2, PIEDRA, { tono }); }
      bloque(T, W, 0, L, -0.2, 0.85, 0.4, 19.4, PIEDRA, { tono }); bloque(T, W, 0.2, L - 0.2, 0.68, 0.84, 0.8, 19.8, PIEDRA, { tono });
      bloque(T, W, 0, L, -0.2, 1.05, 0.8, H, PIEDRA, { tono }); bloque(T, W, 0, L, 0.8, 1, 0.9, H + 0.8, PIEDRA, { tono });
      if (simple) { torno(T, paño(W, 0, L, 9), [[0, H + 0.8], [1.7, H + 5.6]]); lucarnas(T, W, 7, 1, L - 1, H + 0.9, tono); continue; }
      // los faroles del balcón
      for (const t of [7.7, 12.6, L - 12.6, L - 7.7]) { const [x, z] = W.en(t, 0.95); T.cilindro(0.07, 1.9, x, 9.65, z, TINTA, 5); T.put(new THREE.SphereGeometry(0.27, 6, 5).translate(x, 11.75, z), PINTADO, { pinta: [PINTA.BLANCO, 0.97] }); }
    }
    // la mansarda del frente: a cada lado, un tramo recto con dos lucarnas y su crestería
    const y0 = H + 0.8, a = 7.6, fondo = 12;
    for (const [t0, t1] of [[0, a], [L - a, L]]) {
      torno(T, paño(F, t0, t1, fondo), [[0, y0], [1.7, y0 + 6.4], [2.3, y0 + 6.9]]); lucarnas(T, F, 2, t0 + 0.6, t1 - 0.6, y0 + 0.1, tono, { h: 3 });
      cresta(T, F.en(t0 + 2.2, -2.3), F.en(t1 - 2.2, -2.3), y0 + 6.9);
    }
    // el techo bombé del medio, con la lucarna del reloj (y el balcón redondo a sus pies) y una lucarna a cada lado
    const m = L / 2, yt = 37.2;
    torno(T, paño(F, a, L - a, fondo + 1), bombe(y0, yt, 3.9, 7));
    bloque(T, F, m - 1.7, m + 1.7, -1.8, 0.25, 6.2, y0, PIEDRA, { tono }); fronton(T, F, m, 0.3, 4, 1.5, 2, y0 + 6.2, tono);
    { const [x, z] = F.en(m, 0.3); hueco(T, 1.2, 2.6, x, y0 + 0.5, z, F.ang, true); reloj(T, x, y0 + 4.6, z, 0.95, F.ang); const [bx, bz] = F.en(m, 0.9); T.cilindro(1.5, 1.1, bx, y0 - 0.9, bz, PIEDRA, 10, 1.5, { tono }); }
    lucarnas(T, F, 1, m - 6.6, m - 3, y0 + 0.1, tono, { w: 2, h: 4.2, fondo: 2.2 }); lucarnas(T, F, 1, m + 3, m + 6.6, y0 + 0.1, tono, { w: 2, h: 4.2, fondo: 2.2 });
    // la terraza de arriba, con su baranda, y la linterna: el pedestal, el templete de columnas y la cupulita
    const [lx, lz] = F.en(m, -(fondo + 1) / 2), terraza = paño(F, a + 3.7, L - a - 3.7, fondo + 1 - 7.8, -3.9);
    liso(c.adentro(terraza, -0.3), 0.45, yt); for (let i = 0; i < 4; i++) cresta(T, c.adentro(terraza, -0.2)[i], c.adentro(terraza, -0.2)[(i + 1) % 4], yt + 0.45, 0.9);
    T.cilindro(2.5, 1.3, lx, yt + 0.45, lz, PIEDRA, 8, 2.2, { tono }); T.cilindro(1.5, 3.7, lx, yt + 1.75, lz, PIEDRA, 12, 1.5, { tono }); anillo(T, lx, lz, 1.5, yt + 2.1, 6, 0.75, 2.9);
    for (let i = 0; i < 8; i++) { const an = (i / 8) * TAU; T.cilindro(0.17, 3.7, lx + Math.cos(an) * 1.95, yt + 1.75, lz + Math.sin(an) * 1.95, PIEDRA, 6, 0.15, { tono }); }
    T.cilindro(2.35, 0.4, lx, yt + 5.45, lz, PIEDRA, 12, 2.35, { tono }); T.cupula(2.05, lx, yt + 5.85, lz, 0.72); T.cilindro(0.55, 0.5, lx, yt + 7.1, lz, PIEDRA, 8, 0.45, { tono });
    // la farola: la figura dorada, con la antorcha en la mano derecha y el periódico en la izquierda
    const oro = { pinta: [PINTA.OCRE, 0.6] }, ys = yt + 7.6, av = F.ang; // (av: hacia la avenida)
    const pieza = (geo, o = oro) => T.put(geo.rotateY(Math.PI / 2 - av).translate(lx, 0, lz), PINTADO, o); // (cada pieza, hecha mirando hacia +z y girada hacia la avenida)
    pieza(new THREE.CylinderGeometry(0.3, 0.62, 3.1, 8).translate(0, ys + 1.55, 0)); pieza(new THREE.CylinderGeometry(0.3, 0.33, 1, 8).translate(0, ys + 3.6, 0)); pieza(new THREE.SphereGeometry(0.27, 8, 6).translate(0, ys + 4.4, 0));
    pieza(new THREE.BoxGeometry(0.17, 1.5, 0.17).rotateZ(0.3).translate(-0.5, ys + 4.65, 0)); pieza(new THREE.BoxGeometry(0.16, 0.95, 0.16).rotateZ(-1.1).translate(0.62, ys + 3.5, 0.1));
    pieza(new THREE.SphereGeometry(0.25, 6, 5).translate(-0.74, ys + 5.6, 0), { pinta: [PINTA.BLANCO, 0.97] });
  }

  // ------------------------------------------------------------------------------------------- el Palacio Municipal
  { // El Palacio Municipal (proyecto de Juan Antonio Buschiazzo, dirigido por Juan Cagnoni), el primer edificio de la
    // vereda norte de la avenida, pegado a La Prensa. Tuvo dos tiempos, y acá van los dos:
    //   · el de 1893: un cuerpo sobre la avenida, de apenas 15 metros de fondo sobre Bolívar, con planta baja, tres
    //     pisos y mansarda (31 m hasta la cresta de los techos). En la esquina, el torreón redondo con la entrada de
    //     tres arcos y su cúpula de pizarra; en el medio del frente, un techo bombé y arriba la torre del reloj de
    //     cuatro esferas, de 48,20 m hasta la flecha. Detrás, hasta 1911, quedaba el resto de la manzana: van dos
    //     casas viejas de relleno (supuesto). De «Palacio Municipal 1900.JPG», «ENTRADA ANT.png» y la foto del
    //     Archivo General de la Nación de las fiestas mayas de 1899.
    //   · el ensanche de 1911-1914 hasta Rivadavia (Bonneu Ibero, Parodi y Figini), con una cúpula mucho más alta en
    //     esa ochava, de 65 metros hasta la punta de la aguja: «Palacio Municipal de Buenos Aires (ca. 1915).jpg» y
    //     la vista aérea de 1923. Esa aguja se sacó después y en su lugar quedó un remate igual al de la otra esquina;
    //     no se sabe bien cuándo: en una foto de hacia 1942 ya no está, y acá se la da por ida en 1940.
    const tono = c.CREMA, T = c.obra('municipal', tono), O = c.EDIFICIOS.municipal.planta[0].map(([px, py]) => T.deMundo(px, py));
    const [SE, SO, NO, N1, N2] = O, g = giro([SO, SE, N2, N1, NO]), A = pared(SO, SE, g), B = pared(SE, N2, g), RV = pared(N1, NO, g), LA = A.L, LB = B.L;
    const H = 21.8, YM = H + 0.7, F = 15, ep = c.etapaDe(1893), en1914 = c.etapaDe(1914);
    const liso = (pts, h, y, t = tono) => T.prisma(pts, h, y, PIEDRA, { tono: t });
    /** un frente: la planta baja almohadillada con sus vanos de arco, tres pisos de ventanas, las fajas y la cornisa */
    const frente = (W, t0, t1, n, { sale = 0, arcos = true } = {}) => {
      bloque(T, W, t0, t1, sale - 0.2, sale + 0.3, 6.8, 0, PIEDRA, { tono: c.GRIS }); vanos(T, W, n, 1.7, arcos ? 4.6 : 3.8, 0.9, { arco: arcos, sep: sale + 0.37, t0: t0 + 0.5, t1: t1 - 0.5 });
      bloque(T, W, t0, t1, sale - 0.2, sale + 0.65, 0.3, 6.8, PIEDRA, { tono }); bloque(T, W, t0, t1, sale - 0.2, sale + 0.4, 0.25, 11.9, PIEDRA, { tono });
      for (const [y, h] of [[7.9, 3.2], [12.9, 3.2], [17.7, 2.9]]) vanos(T, W, n, 1.4, h, y, { sep: sale + 0.07, t0: t0 + 0.5, t1: t1 - 0.5 });
      bloque(T, W, t0, t1, sale - 0.2, sale + 0.8, 0.7, H, PIEDRA, { tono });
    };
    /** la mansarda de un tramo, con sus lucarnas y la crestería */
    const mansarda = (W, t0, t1, n, fondo = F) => { torno(T, paño(W, t0, t1, fondo), [[0, YM], [2, YM + 4.3], [2.6, YM + 4.7]]); lucarnas(T, W, n, t0 + 0.4, t1 - 0.4, YM + 0.1, tono, { w: 1.5, h: 2.4 }); cresta(T, W.en(t0 + 2.6, -2.6), W.en(t1 - 2.6, -2.6), YM + 4.7, 0.5); };
    /** un pabellón de techo empinado, de los que flanquean las cúpulas: hasta los 31 m, con su crestería */
    const pabellon = (W, t0, t1, fondo = 5.4) => { torno(T, paño(W, t0, t1, fondo, 0.15), [[0, YM], [1.5, YM + 7.6]]); const q = c.adentro(paño(W, t0, t1, fondo, 0.15), 1.5); cresta(T, q[0], q[1], YM + 7.6, 0.7); cresta(T, q[3], q[2], YM + 7.6, 0.7); lucarnas(T, W, 1, t0, t1, YM + 0.1, tono, { w: 1.8, h: 3.2, sale: 0.2 }); };
    /** el torreón de una esquina, hasta la cornisa: redondo, con tres vanos por piso mirando a la calle (medio: hacia dónde) */
    const torreon = (x, z, r, medio, arcos) => {
      T.cilindro(r, H, x, 0, z, PIEDRA, 20, r, { tono }); T.cilindro(r + 0.3, 6.8, x, 0, z, PIEDRA, 20, r + 0.3, { tono: c.GRIS });
      anillo(T, x, z, r + 0.3, 0.6, 3, 1.9, arcos ? 5.2 : 4.4, { a0: medio - 0.95, da: 1.9 });
      for (const y of [6.8, 11.9]) T.cilindro(r + 0.55, 0.3, x, y, z, PIEDRA, 20, r + 0.55, { tono });
      for (const [y, h] of [[7.9, 3.2], [12.9, 3.2], [17.7, 2.9]]) anillo(T, x, z, r, y, 3, 1.4, h, { arco: false, a0: medio - 0.95, da: 1.9 });
      T.cilindro(r + 0.75, 0.7, x, H, z, PIEDRA, 20, r + 0.75, { tono });
    };
    /** el remate de 1893 de un torreón: el tambor de ventanas de arco, la cúpula de pizarra, la linterna y la aguja (38 m) */
    const remate = (x, z, r) => {
      T.cilindro(r - 0.3, 4.8, x, YM, z, PIEDRA, 20, r - 0.3, { tono }); anillo(T, x, z, r - 0.3, YM + 0.8, 8, 1.2, 3.1); T.cilindro(r + 0.15, 0.4, x, YM + 4.8, z, PIEDRA, 20, r + 0.15, { tono });
      T.cupula(r - 0.2, x, YM + 5.2, z, 1.25); T.cilindro(1, 1.7, x, YM + 5.2 + (r - 0.2) * 1.2, z, PIEDRA, 8, 0.9, { tono }); T.piramide(1.25, 1.6, x, YM + 6.9 + (r - 0.2) * 1.2, z, PIZARRA, 8); T.cilindro(0.07, 2.4, x, YM + 8.3 + (r - 0.2) * 1.2, z, TINTA, 5);
    };

    // ---- el cuerpo de 1893, sobre la avenida (está en todas las etapas)
    const tc = LA - 4.8, [ex, ez] = A.en(tc, -4.8), R = 5.2, medioE = (A.ang + B.ang) / 2 + (Math.abs(A.ang - B.ang) > Math.PI ? Math.PI : 0); // (el torreón de la esquina de Bolívar)
    liso([A.en(0, 0), A.en(LA - 3.6, 0), B.en(3.6, 0), B.en(F, 0), A.en(0, -F)], H, 0);
    const pc = 25.4, pa = 6.6; // (el pabellón del medio: dónde está su eje y medio ancho)
    frente(A, 0, pc - pa, 5); frente(A, pc + pa, tc - 5.6, 3); frente(A, pc - pa, pc + pa, 3, { sale: 0.6 }); frente(A, tc - 5.6, tc - 0.4, 1, { sale: 0.3 }); frente(B, 4.4, 10.2, 1, { sale: 0.3 }); frente(B, 10.2, F, 1);
    mansarda(A, 0, pc - pa, 5); mansarda(A, pc + pa, tc - 5.6, 3); pabellon(A, tc - 5.7, tc - 0.6); pabellon(B, 4.6, 10.1); mansarda(B, 10.1, F, 1, 9);
    torreon(ex, ez, R, medioE, true); remate(ex, ez, R);
    // el pabellón del medio: el techo bombé con su gran lucarna de frontis curvo y, arriba, la torre del reloj
    torno(T, paño(A, pc - pa, pc + pa, 12.4, 0.6), bombe(YM, 31, 4, 6)); bloque(T, A, pc - 2.6, pc + 2.6, -1.2, 0.75, 4.6, YM, PIEDRA, { tono }); fronton(T, A, pc, 0.8, 6, 2, 2, YM + 4.6, tono);
    { const [x, z] = A.en(pc, 0.83); hueco(T, 2.2, 3.6, x, YM + 0.5, z, A.ang, true); }
    const [rx, rz] = A.en(pc, -5.6), cuadro = (l) => T.recto(l, l, rx, rz);
    liso(cuadro(5.6), 1.2, 30.6); liso(cuadro(4.4), 6.6, 31.8); liso(cuadro(5.2), 0.45, 38.4);
    for (const an of [0, 1, 2, 3].map((k) => A.ang + (k * Math.PI) / 2)) { reloj(T, rx + Math.cos(an) * 2.2, 36, rz + Math.sin(an) * 2.2, 1.15, an); hueco(T, 1, 2.3, rx + Math.cos(an) * 2.27, 32.3, rz + Math.sin(an) * 2.27, an, true); }
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) T.caja(0.6, 1.7, 0.6, rx + sx * 2.3, 38.85, rz + sz * 2.3, PIEDRA, { tono });
    torno(T, cuadro(4.4), bombe(38.85, 41.6, 1.5, 4)); T.cilindro(0.8, 1.5, rx, 41.6, rz, PIEDRA, 8, 0.7, { tono }); T.piramide(1, 2.3, rx, 43.1, rz, PIZARRA, 8); T.cilindro(0.07, 2.9, rx, 45.3, rz, TINTA, 5);

    // ---- hasta 1911, detrás: las dos casas viejas que quedaban sobre Bolívar y Rivadavia
    c.epoca(ep, en1914);
    T.prisma([A.en(0, -F - 0.3), A.en(LA / 2, -F - 0.3), RV.en(RV.L - LA / 2, 0), NO], 7.4, 0, CASA, { floors: 2, tono: c.BLANCO });
    T.prisma([A.en(LA / 2 + 0.3, -F - 0.3), B.en(F + 0.3, 0), N2, N1, RV.en(RV.L - LA / 2 - 0.3, 0)], 8.6, 0, CASA, { floors: 2, tono: c.ROSA });

    // ---- el ensanche de 1914: Bolívar y Rivadavia, con la mansarda corrida y el torreón de la ochava
    c.epoca(en1914);
    const OC = pared(N2, N1, g), [nx, nz] = OC.en(OC.L / 2, -3.4), RN = 5.8, medioN = OC.ang;
    liso([A.en(0, -F), B.en(F, 0), N2, N1, NO], H, 0);
    frente(B, F, LB - 2.5, 5, { arcos: false }); frente(RV, 2.5, RV.L, 11, { arcos: false });
    mansarda(B, F, LB - 3.5, 4, 12); mansarda(RV, 3.5, RV.L, 10, 12);
    torreon(nx, nz, RN, medioN, false);
    T.cilindro(RN - 0.2, 4.8, nx, YM, nz, PIEDRA, 20, RN - 0.2, { tono }); anillo(T, nx, nz, RN - 0.2, YM + 0.8, 8, 1.3, 3.1); T.cilindro(RN + 0.25, 0.4, nx, YM + 4.8, nz, PIEDRA, 20, RN + 0.25, { tono });
    c.epoca(en1914, 6); // (la cúpula alta, con su linterna y la aguja de 65 m)
    const yc = YM + 5.2;
    T.cupula(RN, nx, yc, nz, 1.45); T.cilindro(1.9, 0.5, nx, yc + RN * 1.36, nz, PIEDRA, 10, 1.9, { tono }); T.cilindro(1.4, 4.4, nx, yc + RN * 1.36 + 0.5, nz, PIEDRA, 10, 1.25, { tono }); anillo(T, nx, nz, 1.36, yc + RN * 1.36 + 1.1, 6, 0.6, 2.8);
    const ya = yc + RN * 1.36 + 4.9;
    T.cilindro(1.8, 0.35, nx, ya, nz, PIEDRA, 10, 1.8, { tono }); torno(T, ronda(nx, nz, 1.6, 8), [[0, ya + 0.35], [0.9, ya + 3.6], [1.25, ya + 13.5]], PIZARRA, {}, ya + 19);
    T.put(new THREE.SphereGeometry(0.65, 8, 6).translate(nx, 60.6, nz), PIZARRA); T.cilindro(0.08, 65 - 61, nx, 61, nz, TINTA, 5);
    c.epoca(6); // (en 1940, el remate igual al de la otra esquina)
    T.cupula(RN - 0.5, nx, yc, nz, 1.2); T.cilindro(1, 1.7, nx, yc + (RN - 0.5) * 1.15, nz, PIEDRA, 8, 0.9, { tono }); T.piramide(1.25, 1.6, nx, yc + 1.7 + (RN - 0.5) * 1.15, nz, PIZARRA, 8); T.cilindro(0.07, 2.4, nx, yc + 3.1 + (RN - 0.5) * 1.15, nz, TINTA, 5);
  }

  // ------------------------------------------------------------------------------------------ la Confitería del Molino
  { // La Confitería del Molino (Francisco Gianotti; inaugurada el 9 de julio de 1916 y terminada en 1917), en la esquina
    // noroeste de Rivadavia y Callao, frente al Congreso: planta baja y cinco pisos, y sobre la ochava la torre, que
    // llega a los 65 metros. Del alzado de Gianotti («Vista late.jpg») y de dos fotos de hoy —el edificio no cambió—,
    // «Confitería El Molino, Buenos Aires - Argentina2.jpg» y «CABA - Balvanera - Confitería del Molino.jpg»: la
    // marquesina de hierro y vidrio, cuatro pisos de balcones, la cornisa y la mansarda; en cada frente, dos cuerpos
    // que suben hasta un remate de pizarra; y en la esquina, las aspas, el cuerpo de la torre con sus cuatro
    // garitas, el alero, la cúpula en ojiva de vitrales, el plato, la linterna y la aguja.
    const tono = c.SILLAR, T = c.obra('molino', tono), O = c.EDIFICIOS.molino.planta[0].slice(0, -1).map(([px, py]) => T.deMundo(px, py)), g = giro(O);
    const CA = pared(O[9], O[10], g), OC = pared(O[10], O[11], g), RV = pared(O[11], O[12], g), H = 24, YM = H + 0.5;
    const liso = (pts, h, y, t = tono) => T.prisma(pts, h, y, PIEDRA, { tono: t });
    liso(O, YM, 0);
    // cada frente, desde la ochava: tres ventanas, un cuerpo saliente, tres ventanas y otro cuerpo (d: de qué lado queda la ochava)
    for (const [W, d] of [[CA, -1], [RV, 1]]) {
      const L = W.L, en = (u) => (d > 0 ? u : L - u), tr = (a, b) => [Math.min(en(a), en(b)), Math.max(en(a), en(b))], v = (L - 1.2 - 7.4) / 6; // (v: el ancho de cada ventana)
      const tramos = [tr(0.6, 0.6 + 3 * v), tr(4.3 + 3 * v, 4.3 + 6 * v)], cuerpos = [tr(0.6 + 3 * v, 4.3 + 3 * v), tr(4.3 + 6 * v, 8 + 6 * v)];
      // la planta baja: las vidrieras y la marquesina
      vanos(T, W, 7, 2.5, 4.3, 0.4, { t0: 0.4, t1: L - 0.4 }); bloque(T, W, 0, L, 0, 2.4, 0.3, 5.1, PINTADO, { pinta: [PINTA.CHAPA, 0.3] }); bloque(T, W, 0, L, -0.2, 0.3, 0.5, 5.9, PIEDRA, { tono });
      for (const [t0, t1] of tramos) {
        for (const [y, h, arco] of [[6.9, 2.9, false], [11.3, 2.9, false], [15.7, 3.2, true], [20.3, 2.8, false]]) vanos(T, W, 3, 1.3, h, y, { arco, t0, t1 });
        for (const y of [6.5, 19.9]) { bloque(T, W, t0 + 0.2, t1 - 0.2, 0, 0.75, 0.22, y, PIEDRA, { tono }); bloque(T, W, t0 + 0.25, t1 - 0.25, 0.66, 0.72, 0.85, y + 0.22, TINTA); }
        lucarnas(T, W, 3, t0, t1, YM + 0.1, tono, { w: 1.5, h: 2.5, arco: false, sale: -0.3 });
      }
      for (const [t0, t1] of cuerpos) {
        const m = (t0 + t1) / 2;
        bloque(T, W, t0, t1, -0.2, 0.45, YM + 3.3, 0, PIEDRA, { tono });
        for (const [y, h, arco] of [[6.9, 2.9, true], [11.3, 2.9, false], [15.7, 3.2, true], [20.3, 2.8, false], [YM + 0.5, 2.5, true]]) { const [x, z] = W.en(m, 0.52); hueco(T, 1.5, h, x, y, z, W.ang, arco); }
        torno(T, paño(W, t0 - 0.35, t1 + 0.35, 3, 0.8), [[-0.15, YM + 3.2], [0.5, YM + 4.4], [1.1, YM + 6.3]]);
      }
      bloque(T, W, 0, L, -0.2, 1, 0.5, H, PIEDRA, { tono });
      torno(T, paño(W, 0, L, 9), [[0, YM], [1.5, YM + 3.9]]);
    }
    // la ochava: un paño saliente con un balcón por piso, la ventana alta del quinto y el alero curvo donde van las aspas
    const mo = OC.L / 2, [cx, cz] = OC.en(mo, -3), av = OC.ang, a0 = av + Math.PI / 8;
    bloque(T, OC, mo - 3.1, mo + 3.1, -0.3, 0.6, YM + 3.6, 0, PIEDRA, { tono }); bloque(T, OC, mo - 4.4, mo + 4.4, 0, 2.4, 0.3, 5.1, PINTADO, { pinta: [PINTA.CHAPA, 0.3] });
    { const [x, z] = OC.en(mo, 0.67); hueco(T, 2.6, 4.4, x, 0.3, z, av, true); for (const [y, h, arco] of [[6.9, 2.9, true], [11.3, 2.9, false], [15.7, 3.2, true], [20.3, 2.8, false], [YM + 0.4, 2.9, true]]) hueco(T, 1.6, h, x, y, z, av, arco); }
    for (const y of [6.5, 10.9, 15.3, 19.9, YM]) { const [x, z] = OC.en(mo, 0.6); T.put(new THREE.CylinderGeometry(1.5, 1.3, 0.25, 10, 1, false, 0, Math.PI).rotateY(-av).translate(x, y + 0.12, z), PIEDRA, { tono }); T.put(new THREE.CylinderGeometry(1.45, 1.45, 0.8, 10, 1, true, 0, Math.PI).rotateY(-av).translate(x, y + 0.65, z), TINTA); }
    torno(T, paño(OC, mo - 4, mo + 4, 4.6, 1.3), [[-0.5, YM + 3.2], [0.4, YM + 3.9], [1.7, YM + 6.4]]);
    // el cuerpo de la torre, de ocho lados, con una garita redonda en cada esquina y su balcón
    const yb = YM + 5, yt = 38.5, r = 3.5, ocho = ronda(cx, cz, r, 8, a0);
    liso(ocho, yt - YM, YM);
    for (let k = 0; k < 4; k++) { const a = av + (k * Math.PI) / 2; hueco(T, 1.4, 3.6, cx + Math.cos(a) * (r * 0.924 + 0.07), yb + 3.1, cz + Math.sin(a) * (r * 0.924 + 0.07), a, true); }
    for (let k = 0; k < 4; k++) {
      const a = av + Math.PI / 4 + (k * Math.PI) / 2, x = cx + Math.cos(a) * (r + 0.35), z = cz + Math.sin(a) * (r + 0.35);
      T.cilindro(0.35, 1.5, x, yb + 0.4, z, PIEDRA, 8, 0.95, { tono }); T.cilindro(0.95, 4.2, x, yb + 1.9, z, PIEDRA, 8, 0.95, { tono }); T.cupula(1, x, yb + 6.1, z, 1.1); hueco(T, 0.6, 1.9, x + Math.cos(a) * 1, yb + 3.4, z + Math.sin(a) * 1, a, true);
    }
    liso(ronda(cx, cz, r + 0.75, 8, a0), 0.25, yb + 2.3); for (let i = 0; i < 8; i++) cresta(T, ronda(cx, cz, r + 0.7, 8, a0)[i], ronda(cx, cz, r + 0.7, 8, a0)[(i + 1) % 8], yb + 2.55, 0.8);
    // las aspas: cuatro palas de hierro en cruz, delante de la torre
    { const [x, z] = OC.en(mo, 1.75), ya = yb + 1.2; for (let k = 0; k < 4; k++) T.put(new THREE.BoxGeometry(0.55, 3.5, 0.1).translate(0, 2.05, 0).rotateZ(Math.PI / 4 + (k * Math.PI) / 2).rotateY(Math.PI / 2 - av).translate(x, ya, z), PINTADO, { pinta: [PINTA.CHAPA, 0.62] }); T.put(new THREE.CylinderGeometry(0.45, 0.45, 0.3, 8).rotateX(Math.PI / 2).rotateY(Math.PI / 2 - av).translate(x, ya, z), TINTA); }
    // el alero, la cúpula en ojiva (ocho gajos con sus vitrales), el plato, la linterna y la aguja
    torno(T, ocho, [[-1.7, yt - 0.3], [-0.9, yt + 0.5], [0.1, yt + 2.2], [0.5, yt + 3.5]]);
    const oj = ronda(cx, cz, 3.05, 8, a0), y1 = yt + 3.5;
    torno(T, oj, [[0, y1], [-0.25, y1 + 2.4], [0, y1 + 5.4], [0.7, y1 + 8.6], [1.45, y1 + 11.2], [2.1, y1 + 13.5]], PINTADO, { pinta: [PINTA.CHAPA, 0.5] });
    for (let k = 0; k < 8; k++) { const a = av + (k * Math.PI) / 4; hueco(T, 0.9, 4.8, cx + Math.cos(a) * 3.12, y1 + 1.1, cz + Math.sin(a) * 3.12, a, true); }
    const y2 = y1 + 13.5;
    T.cilindro(0.95, 0.6, cx, y2, cz, PIZARRA, 12, 2.1); T.cilindro(2.1, 0.45, cx, y2 + 0.6, cz, PIZARRA, 12, 0.75); T.cilindro(0.6, 3, cx, y2 + 1.05, cz, PIEDRA, 8, 0.55, { tono }); anillo(T, cx, cz, 0.55, y2 + 1.5, 4, 0.4, 2, { a0: av - Math.PI / 4 });
    T.cilindro(1, 0.3, cx, y2 + 4.05, cz, PIZARRA, 8, 0.55); T.piramide(0.6, 2.3, cx, y2 + 4.35, cz, PIZARRA, 8); T.put(new THREE.SphereGeometry(0.3, 6, 5).translate(cx, y2 + 6.9, cz), PIZARRA); T.cilindro(0.06, 65 - (y2 + 7.1), cx, y2 + 7.1, cz, TINTA, 5);
  }

  // --------------------------------------------------------------------------------------------------- Gath & Chaves
  { // La casa central de la tienda Gath & Chaves (1912-1914, de Francisque Fleury Tronquoy), en la esquina sudoeste de
    // Florida y Cangallo (hoy Perón): dos subsuelos, planta baja y siete pisos, 2.400 m² por planta, con el gran hall
    // de ocho lados en el medio. De las fotos de hacia 1914 «Gath chaves casa central frente.jpg» y «Gath chaves
    // casa central.jpg»: sobre las dos calles, vidrieras con toldos, cuatro pisos de ventanales entre pilares que
    // cierran en arco en el quinto, la cornisa, un ático y arriba un piso retirado con la confitería de la terraza;
    // en la esquina, la entrada bajo la marquesina, un arco de cinco pisos, el tambor de ventanas y la cúpula de
    // pizarra en punta con su linterna.
    // La planta: el mapa de hoy trae el edificio partido en cuatro y unido con el vecino de Cangallo; acá va con el
    // contorno del plano de época («Plantas Arquitectónicas Edificio Gath y Chaves.jpg»): 49 m sobre Florida, unos 42
    // sobre Cangallo y una L por detrás del vecino. Las alturas no tienen fuente: salen de contar pisos en las fotos.
    const tono = c.CREMA, T = c.obra('gath', tono), px = (x, y) => T.deMundo(x, y);
    const S = px(10719, 9202), V = px(10793, 9206.4), E = px(10793, 9144), N1 = px(10750, 9144), N2 = px(10750, 9126), N3 = px(10725, 9125);
    const hacia = (a, b, d) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]); return [a[0] + ((b[0] - a[0]) * d) / l, a[1] + ((b[1] - a[1]) * d) / l]; };
    const C1 = hacia(V, S, 5.6), C2 = hacia(V, E, 5.6), P = [S, C1, C2, E, N1, N2, N3], g = giro(P), FL = pared(S, C1, g), OC = pared(C1, C2, g), CG = pared(C2, E, g);
    const H = 26, YA = H + 0.6, piedra = (pts, h, y, t = tono) => T.prisma(pts, h, y, PIEDRA, { tono: t });
    piedra(P, YA, 0);
    for (const [W, n, punta] of [[FL, 8, 0], [CG, 7, 1]]) { // (punta: de qué lado queda el pabellón del fondo)
      const L = W.L, pab = 4.6, t0 = punta ? 0.8 : pab, t1 = punta ? L - pab : L - 0.8, paso = (t1 - t0) / n;
      // las vidrieras y los toldos; los ventanales de cuatro pisos, que cierran en arco, con sus antepechos
      vanos(T, W, n, paso - 1.3, 4.2, 0.5, { t0, t1 }); bloque(T, W, t0, t1, 0.1, 1.9, 0.18, 5.2, PINTADO, { pinta: [PINTA.LONA, 0.9] });
      vanos(T, W, n, paso - 1.5, 18, 6.6, { arco: true, t0, t1 });
      for (const y of [10.3, 14.5, 18.7]) bloque(T, W, t0 + 0.3, t1 - 0.3, -0.1, 0.16, 0.7, y, PIEDRA, { tono });
      for (let i = 0; i <= n; i++) bloque(T, W, t0 + i * paso - 0.6, t0 + i * paso + 0.6, -0.1, 0.4, H - 6, 6, PIEDRA, { tono });
      bloque(T, W, 0, L, -0.1, 0.3, 0.6, 5.7, PIEDRA, { tono });
      // el pabellón del fondo: un paño saliente, con una ventana por piso
      const [p0, p1] = punta ? [L - pab, L] : [0, pab];
      bloque(T, W, p0, p1, -0.1, 0.4, YA + 3.6, 0, PIEDRA, { tono }); for (const y of [0.6, 6.9, 11, 15.2, 19.4, 23]) { const [x, z] = W.en((p0 + p1) / 2, 0.47); hueco(T, 1.8, y < 1 ? 4.2 : 2.5, x, y, z, W.ang, y > 22); }
      // la cornisa, el ático de ventanas de a pares y su cornisa
      bloque(T, W, 0, L, -0.1, 1.1, 0.6, H, PIEDRA, { tono });
      vanos(T, W, 2 * n, 1.1, 2.3, YA + 0.7, { t0, t1, sep: -0.33 });
    }
    piedra(c.adentro(P, 0.4), 3.6, YA); piedra(c.adentro(P, 0.1), 0.35, YA + 3.6);
    // el piso retirado, con su crestería
    const retiro = c.adentro(P, 3); T.prisma(retiro, 3.3, YA + 3.95, CASA, { floors: 1, tono }); for (const i of [0, 1, 2]) cresta(T, retiro[i], retiro[i + 1], YA + 7.25, 0.5);
    // la esquina: un pilar almohadillado a cada lado, la entrada con su marquesina y el arco de cinco pisos
    const mo = OC.L / 2, av = OC.ang, [cx, cz] = OC.en(mo, -3.6);
    for (const t of [0, OC.L]) { const [x, z] = OC.en(t, -0.5); T.cilindro(1.5, YA, x, 0, z, PIEDRA, 10, 1.5, { tono }); }
    bloque(T, OC, 0.6, OC.L - 0.6, -0.2, 0.35, YA, 0, PIEDRA, { tono });
    { const [x, z] = OC.en(mo, 0.42); hueco(T, 4.6, 4.9, x, 0.2, z, av, true); hueco(T, 4.4, 17.6, x, 6.9, z, av, true); for (const y of [10.5, 14.7, 18.9]) bloque(T, OC, mo - 2.3, mo + 2.3, 0.3, 0.6, 0.7, y, PIEDRA, { tono }); }
    { const [x, z] = OC.en(mo, 0.3); T.put(new THREE.CylinderGeometry(3.6, 3.6, 0.3, 14, 1, false, 0, Math.PI).rotateY(-av).translate(x, 5.6, z), PINTADO, { pinta: [PINTA.LONA, 0.9] }); }
    bloque(T, OC, -0.6, OC.L + 0.6, -0.1, 1.2, 0.6, H, PIEDRA, { tono });
    // el tambor, con su galería de arcos, y la cúpula de pizarra en punta, con la linterna y la aguja
    const R = 5.6, yd = YA + 6.6;
    T.cilindro(R, 6.2, cx, YA, cz, PIEDRA, 20, R, { tono }); anillo(T, cx, cz, R, YA + 1.1, 10, 1.5, 4.2); T.cilindro(R + 0.55, 0.4, cx, YA + 6.2, cz, PIEDRA, 20, R + 0.55, { tono });
    torno(T, ronda(cx, cz, R, 16), [[0, yd], [0.2, yd + 2.4], [0.8, yd + 4.9], [1.8, yd + 7.3], [3, yd + 9.3], [4.2, yd + 10.7]]);
    for (let k = 0; k < 4; k++) { const a = av + (k * Math.PI) / 2, x = cx + Math.cos(a) * (R - 0.5), z = cz + Math.sin(a) * (R - 0.5); T.put(new THREE.BoxGeometry(1.3, 2.2, 2.2).rotateY(-a).translate(x, yd + 1.3, z), PIEDRA, { tono }); hueco(T, 1.1, 1.1, cx + Math.cos(a) * (R + 0.22), yd + 0.8, cz + Math.sin(a) * (R + 0.22), a, false, true); }
    const yl = yd + 10.7;
    T.cilindro(1.6, 0.35, cx, yl, cz, PIZARRA, 10, 1.6); T.cilindro(1.15, 3, cx, yl + 0.35, cz, PIZARRA, 10, 1.15); anillo(T, cx, cz, 1.15, yl + 0.7, 6, 0.55, 2.2); T.cilindro(1.5, 0.3, cx, yl + 3.35, cz, PIZARRA, 10, 1.5);
    T.cupula(1.3, cx, yl + 3.65, cz, 1.15); T.cilindro(0.07, 3.6, cx, yl + 5.1, cz, TINTA, 5);
    // (lo que el mapa de hoy une al edificio y no era de la tienda: los vecinos de Cangallo, de relleno)
    T.prisma([E, px(10793, 9114), px(10751, 9112), N1], 15.5, 0, CASA, { floors: 4, tono: c.BLANCO }); T.prisma([N2, px(10750.5, 9112), px(10725, 9110), N3], 11, 0, CASA, { floors: 3, tono: c.ROSA });
  }

  // ------------------------------------------------------------------------------------------------ la Galería Güemes
  { // La Galería Güemes (Francisco Gianotti, 1913-1915; inaugurada el 15 de diciembre de 1915): el pasaje de 116 metros
    // que une Florida 165 con San Martín 170 y, encima, el primer rascacielos de la ciudad, de hormigón armado. Según
    // el proyecto: un cuerpo macizo de seis pisos y otros ocho que suben en dos alas, junto a una torre con faro;
    // 14 pisos, cerca de 80 m en la parte alta y 87 con la torre. De la foto de 1916 («Galería Güemes 1916.JPG»,
    // sacada desde lo alto de Gath & Chaves, del otro lado de Florida): las alas son dos cuerpos paralelos a Florida,
    // retirados unos 19 m, de siete ventanas por piso y una galería de balcones arriba de todo; entre los dos, un
    // vacío que arriba cruza un puente y, más abajo, un muro con tres ojos de buey; en cada punta, dos torrecillas
    // en punta. Dónde caen en el lote: la parte del medio de la planta de hoy (25 × 30 m). El faro, como se lo ve hoy
    // («Galeria Güemes desde Bencich.jpg»): un fuste de ocho lados, ocho costillas de cobre y un tambor arriba.
    // Supuestos: los pisos altos de los dos frentes (de Florida solo hay foto de la planta baja, «Casa tow en calle
    // florida ba 1928.jpg», y ese frente se quemó en 1971; del de San Martín no hay foto de época), el lado sur de
    // las alas (igual al norte) y el ancho del lado de San Martín, que va como en el mapa (30 m; el lote medía 20).
    const tono = c.BLANCO, T = c.obra('guemes', tono), px = (x, y) => T.deMundo(x, y);
    const P = [px(10713, 9218), px(10757, 9219), px(10755, 9391), px(10711, 9390)], g = giro(P), FL = pared(P[0], P[1], g), NO = pared(P[1], P[2], g), SM = pared(P[2], P[3], g), SU = pared(P[3], P[0], g);
    const H = 26, A = FL.L, liso = (pts, h, y, t = tono) => T.prisma(pts, h, y, PIEDRA, { tono: t });
    liso(P, H, 0);
    for (const [W, florida] of [[FL, true], [SM, false]]) {
      const L = W.L, m = L / 2;
      // la planta baja y el entrepiso: el arco del pasaje en el medio y las vidrieras a los lados
      bloque(T, W, 0, L, -0.2, 0.3, 8.6, 0, PIEDRA, { tono: c.SILLAR }); { const [x, z] = W.en(m, 0.37); hueco(T, 5.4, 8, x, 0, z, W.ang, true); }
      vanos(T, W, 2, 3.3, 3.6, 0.5, { sep: 0.37, t0: 0.8, t1: m - 3.4 }); vanos(T, W, 2, 3.3, 3.6, 0.5, { sep: 0.37, t0: m + 3.4, t1: L - 0.8 });
      vanos(T, W, 2, 3.3, 2.2, 5.3, { sep: 0.37, t0: 0.8, t1: m - 3.4 }); vanos(T, W, 2, 3.3, 2.2, 5.3, { sep: 0.37, t0: m + 3.4, t1: L - 0.8 });
      bloque(T, W, 0, L, -0.2, 0.8, 0.4, 8.6, PIEDRA, { tono });
      // cuatro pisos de ventanas entre fajas, la cornisa y la mansarda con sus lucarnas
      for (const [y, h, arco] of [[9.9, 2.9, false], [14, 2.9, false], [18.1, 2.9, false], [22.1, 2.7, true]]) vanos(T, W, 7, 1.5, h, y, { arco });
      for (let i = 0; i <= 7; i++) bloque(T, W, 1 + (i * (L - 2)) / 7 - 0.4, 1 + (i * (L - 2)) / 7 + 0.4, -0.1, 0.25, H - 9, 9, PIEDRA, { tono });
      bloque(T, W, 0, L, -0.2, 0.9, 0.6, H, PIEDRA, { tono });
      torno(T, paño(W, 0, L, florida ? 12 : 9), [[0, H + 0.6], [1.6, H + 4.6], [2.2, H + 5]]); lucarnas(T, W, 5, 5.6, L - 5.6, H + 0.7, tono, { w: 2, h: 3 });
      cresta(T, W.en(2.2, -2.2), W.en(L - 2.2, -2.2), H + 5, 0.6);
      for (const t of [0.2, L - 5.2]) torno(T, paño(W, t, t + 5, 5, 0.2), bombe(H + 0.6, H + 7.2, 2.3, 4)); // (un techo bombé en cada punta)
    }
    // las dos alas: catorce pisos hasta los 68 m, con siete ventanas por piso hacia Florida, hacia San Martín y hacia el vacío
    const HT = 68, alas = [[18.8, 28.3], [34.5, 44]], tira = (t0, t1, f0, f1) => [NO.en(t0, f0), NO.en(t1, f0), NO.en(t1, f1), NO.en(t0, f1)]; // (t: la distancia a Florida; f: hacia adentro del lote, en negativo)
    alas.forEach(([t0, t1], k) => {
      liso(tira(t0, t1, 0, -A), HT - H, H);
      const caras = [pared(NO.en(t0, -A), NO.en(t0, 0), g), pared(NO.en(t1, 0), NO.en(t1, -A), g)]; // (la que mira a Florida y la que mira a San Martín)
      caras.forEach((W, j) => {
        for (let p = 0; p < 8; p++) vanos(T, W, 7, 1.5, 2.7, H + 1.5 + p * 4.4, { t0: 1.6, t1: A - 1.6 });
        if (j !== k) { vanos(T, W, 7, 1.5, 2.7, HT - 5.4, { t0: 1.6, t1: A - 1.6 }); return; } // (hacia el vacío, un piso más de ventanas)
        // hacia la calle: la galería de arriba, con su balcón corrido, y la cornisa
        vanos(T, W, 7, 2.7, 3.9, HT - 5.6, { arco: true, t0: 1.6, t1: A - 1.6 });
        bloque(T, W, 1.4, A - 1.4, -0.1, 0.95, 0.3, HT - 6.1, PIEDRA, { tono }); bloque(T, W, 1.4, A - 1.4, 0.87, 0.95, 0.9, HT - 5.8, TINTA);
        bloque(T, W, 0, A, -0.2, 0.9, 0.5, HT - 1, PIEDRA, { tono });
      });
      torno(T, tira(t0, t1, 0, -A), [[0.3, HT], [2.3, HT + 2.4]]);
      // las torrecillas de las cuatro esquinas, con su capitel en punta (la aguja llega a los 80 m)
      for (const t of [t0 + 1.15, t1 - 1.15]) for (const f of [-1.15, -A + 1.15]) {
        const [x, z] = NO.en(t, f); T.cilindro(1.15, 8.6, x, HT - 3.4, z, PIEDRA, 8, 1.15, { tono }); T.cilindro(1.15, 0.6, x, HT + 5.2, z, PIEDRA, 8, 1.6, { tono }); T.piramide(1.6, 4.2, x, HT + 5.8, z, PIZARRA, 8); T.cilindro(0.05, 2, x, HT + 10, z, TINTA, 4);
      }
    });
    // entre las dos, en cada punta del vacío: el puente de arriba, con sus tres ventanas, y el muro de los ojos de buey
    for (const [W, f0, f1, u] of [[NO, 0, -2.4, (t) => t], [SU, -A + 2.4, -A, (t) => SU.L - t]]) {
      const [t0, t1] = [alas[0][1], alas[1][0]], ta = Math.min(u(t0), u(t1)) + 0.4, tb = Math.max(u(t0), u(t1)) - 0.4;
      liso(tira(t0, t1, f0, f1), 9, HT - 9); vanos(T, W, 3, 1.3, 2.7, HT - 4.6, { t0: ta, t1: tb });
      liso(tira(t0, t1, f0, f1), 7.5, HT - 30); vanos(T, W, 3, 1.9, 1.9, HT - 27.2, { redondo: true, t0: ta, t1: tb });
    }
    // la torre del faro, sobre el ala del fondo: el fuste de ocho lados, las costillas de cobre y el tambor (87 m)
    const [fx, fz] = NO.en(39.3, -A + 6.4), cobre = { pinta: [PINTA.COBRE, 0.45] }, yf = HT + 8.9;
    T.cilindro(2.4, 8.5, fx, HT, fz, PIEDRA, 8, 2, { tono }); anillo(T, fx, fz, 2.05, HT + 2.6, 4, 1.1, 4.8, { a0: FL.ang - Math.PI / 4 }); T.cilindro(2.35, 0.4, fx, HT + 8.5, fz, PIEDRA, 8, 2.35, { tono });
    for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; for (const [r0, r1, y, h] of [[1.9, 2.1, yf, 2.6], [2.1, 1.6, yf + 2.6, 2.4], [1.6, 1.25, yf + 5, 2]]) { const rm = (r0 + r1) / 2; T.put(new THREE.BoxGeometry(0.28, Math.hypot(h, r1 - r0) + 0.1, 0.6).rotateZ(Math.atan2(r0 - r1, h)).translate(rm, y + h / 2, 0).rotateY(-a).translate(fx, 0, fz), PINTADO, cobre); } }
    T.cilindro(0.4, 7, fx, yf, fz, TINTA, 6); T.cilindro(1.5, 2.3, fx, yf + 7, fz, PIEDRA, 12, 1.5, { tono }); T.cilindro(0.05, 87 - (yf + 9.3), fx, yf + 9.3, fz, TINTA, 4);
  }
}
