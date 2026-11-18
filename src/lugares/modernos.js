// Los modernos: lo que los años treinta le agregaron a la ciudad —las primeras torres de hormigón sobre Corrientes,
// el ministerio que quedó en medio de la 9 de Julio, el Luna Park, el Abasto, la Bombonera— y, en La Boca, el
// Transbordador de 1914. Cada uno en su lugar del mapa de hoy (src/edificios.js, de tools/edificios.mjs) y con su
// propio origen, para que el visor pueda resaltarlos de a uno:
//   - el Puente Transbordador Nicolás Avellaneda (1914), sobre el Riachuelo: desde la etapa de 1921;
//   - el Edificio Comega (1933), en Corrientes y Leandro N. Alem;
//   - el Edificio Safico (1934), en Corrientes 456;
//   - el Ministerio de Obras Públicas (1936), en Lima y Moreno: la 9 de Julio llegó hasta él recién en 1947;
//   - el Luna Park (1932, techado en 1934), en Corrientes y Bouchard;
//   - el Mercado de Abasto (1934), sobre Corrientes entre Agüero y Anchorena;
//   - el estadio de Boca Juniors (25 de mayo de 1940), como se inauguró: sin la tercera bandeja (1953) y, en la
//     cabecera norte, sin la segunda (1941).
// Años, autores, pisos y alturas: Wikipedia en español (se anota cada dato en su edificio). Las formas salen de fotos
// de Wikimedia Commons, que se nombran en cada uno; son bocetos de pocas piezas, como los de src/hitos.js.
export default function (c) {
  const { THREE, PIEDRA, CASA, TINTA, PIZARRA, PINTADO, PINTA } = c;

  // ------------------------------------------------------------------------------------------------ las herramientas
  /** un color parejo: de qué va pintado y qué tan claro sale en tinta */
  const P = (tono, claro = 0.6) => ({ pinta: [tono, claro] });
  const HORMIGON = P(PINTA.BALDOSA, 0.88), CHAPA = P(PINTA.CHAPA, 0.8), BLANCO = P(PINTA.BLANCO, 0.97), MADERA = P(PINTA.MADERA, 0.6);
  /** la planta de un edificio de src/edificios.js, en metros de su lugar (sin el punto que la cierra) */
  const planta = (T, clave, k = 0) => c.EDIFICIOS[clave].planta[k].slice(0, -1).map(([px, py]) => T.deMundo(px, py));
  /** una barra de a a b ([x, y, z], en metros del lugar), de g de grueso: cuatro caras, sin tapas (el hierro) */
  const barra = (T, a, b, g = 0.4, kind = TINTA, o) => {
    const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), l = d.length();
    const geo = new THREE.CylinderGeometry(g * 0.707, g * 0.707, l, 4, 1, true).rotateY(Math.PI / 4);
    geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
    T.put(geo.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), kind, o);
  };
  /** una malla de paños sueltos: cada paño, cuatro puntos [x, y, z]. Va con las dos caras (lo que es una cáscara
   *  —una bóveda, una tribuna— se ve de los dos lados) */
  const paños = (T, Q, kind, o) => {
    const v = []; for (const [a, b, d, e] of Q) v.push(a, b, d, a, d, e, a, d, b, a, e, d);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v.flat(), 3)); g.computeVertexNormals(); T.put(g, kind, o);
  };
  /** Una figura plana (x a lo largo, y hacia arriba) puesta sobre la pared que va de a a b ([x, z]), `sale` metros
   *  delante de ella. `lado`: +1 si el lado de afuera queda a la izquierda de quien va de a a b, −1 si a la derecha */
  const enPared = (T, forma, a, b, lado, sale, kind = TINTA, o) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), dx = (b[0] - a[0]) / L, dz = (b[1] - a[1]) / L, nx = lado * dz, nz = -lado * dx;
    const g = new THREE.ShapeGeometry(forma, 8), p = g.attributes.position, v = [];
    const ix = g.index.array, pt = (i) => [a[0] + dx * p.getX(i) + nx * sale, p.getY(i), a[1] + dz * p.getX(i) + nz * sale];
    for (let i = 0; i < ix.length; i += 3) { const A = pt(ix[i]), B = pt(ix[i + 1]), D = pt(ix[i + 2]); v.push(A, B, D, A, D, B); }
    const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(v.flat(), 3)); out.computeVertexNormals(); T.put(out, kind, o);
  };
  /** una caja arrimada a la pared que va de a a b: de s0 a s1 a lo largo, de y0 a y1, saliendo de e0 a e1 */
  const cajaEnPared = (T, a, b, lado, s0, s1, y0, y1, e0, e1, kind = PIEDRA, o) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), dx = (b[0] - a[0]) / L, dz = (b[1] - a[1]) / L, nx = lado * dz, nz = -lado * dx, s = (s0 + s1) / 2, e = (e0 + e1) / 2;
    T.put(new THREE.BoxGeometry(s1 - s0, y1 - y0, e1 - e0).rotateY(-Math.atan2(dz, dx)).translate(a[0] + dx * s + nx * e, (y0 + y1) / 2, a[1] + dz * s + nz * e), kind, o);
  };
  /** un arco de medio punto (o rebajado) de s0 a s1 a lo largo, con los pies en y0 y el arranque en y1 */
  const arco = (s0, s1, y0, y1, flecha = (s1 - s0) / 2) => { const f = new THREE.Shape(); f.moveTo(s0, y0); f.lineTo(s1, y0); f.lineTo(s1, y1); f.absellipse((s0 + s1) / 2, y1, (s1 - s0) / 2, flecha, 0, Math.PI, false); f.lineTo(s0, y0); return f; };
  const recto = (s0, s1, y0, y1) => { const f = new THREE.Shape(); f.moveTo(s0, y0); f.lineTo(s1, y0); f.lineTo(s1, y1); f.lineTo(s0, y1); f.closePath(); return f; };
  /** una línea quebrada [x, z] repartida en n tramos iguales de largo: n + 1 puntos */
  const repartir = (pts, n) => {
    const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return Array.from({ length: n + 1 }, (_, k) => { const s = (k / n) * L[L.length - 1]; let i = 1; while (i < L.length - 1 && L[i] < s) i++; const t = (s - L[i - 1]) / (L[i] - L[i - 1] || 1); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]; });
  };

  // ------------------------------------------------------------------------- el Puente Transbordador Nicolás Avellaneda
  { // El transbordador del Ferrocarril del Sud (autorizado en 1908, inaugurado en 1914), entre La Boca y la Isla
    // Maciel: dos torres de hierro, una en cada orilla, y arriba una viga de 77,5 m que deja 43,5 m libres sobre el
    // río; de ella cuelga la barquilla, que cruza a ras del agua. De las fotos «Buenos Aires, Argentina, Avellaneda
    // Bridge» (National Photo Company, entre 1909 y 1920: el puente entero, con la casilla de máquinas),
    // «Puente transbordador Avellaneda 1938» (los pilones desde el agua), «…en 1932» (la barquilla llena, del Archivo
    // General de la Nación) y, para entender el armado, una de hoy («Buenos Aires Most Transportowy 1»): cada torre
    // son dos pilones de celosía que se afinan hacia arriba, arriostrados entre sí; la viga, dos cerchas de montantes
    // y diagonales con el cordón de arriba en curva, que pasan de las torres en voladizo. El eje y el largo salen del
    // mapa de hoy; el centro va corrido 15 m, al medio del Riachuelo que dibuja el plano de 1867. (x cruza el río, de
    // La Boca a la isla; z va río arriba.)
    c.epoca(c.etapaDe(1914));
    const T = c.lugar(5247, 11329, -0.642, 0.767), XT = 77.5 / 2, ZV = 6.25, ALTO = 43.5, PIE = 1.4, B = 5, C = 1.2;
    /** la esquina (sx, sz) de un pilón con centro en (x, z), a la altura k (0 el pie, 1 la cabeza) */
    const esq = (x, z, k, sx, sz) => { const r = B + (C - B) * k; return [x + sx * r, PIE + k * (ALTO - PIE), z + sz * r]; };
    const NIVELES = [0, 0.27, 0.52, 0.76, 1], E = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (const s of [-1, 1]) {
      const x = s * XT;
      for (const z of [-ZV, ZV]) {
        // el pilón: cuatro montantes, un anillo en cada nivel y una cruz de San Andrés por cara y por tramo
        for (const [sx, sz] of E) barra(T, esq(x, z, 0, sx, sz), esq(x, z, 1, sx, sz), 0.62);
        for (let n = 0; n < NIVELES.length; n++) for (let i = 0; i < 4; i++) {
          const a = E[i], b = E[(i + 1) % 4];
          if (n) barra(T, esq(x, z, NIVELES[n], ...a), esq(x, z, NIVELES[n], ...b), 0.36);
          if (n + 1 < NIVELES.length) { barra(T, esq(x, z, NIVELES[n], ...a), esq(x, z, NIVELES[n + 1], ...b), 0.22); barra(T, esq(x, z, NIVELES[n], ...b), esq(x, z, NIVELES[n + 1], ...a), 0.22); }
        }
        T.caja(2 * B + 2.6, PIE, 2 * B + 2.6, x, 0, z, PIEDRA, { tono: c.GRIS }); // (el macizo de hormigón de la fundación)
      }
      // el arriostramiento entre los dos pilones, de media altura para arriba (abajo queda libre)
      const dentro = (k, sx, lado) => { const r = B + (C - B) * k; return [x + sx * r, PIE + k * (ALTO - PIE), lado * (ZV - r)]; };
      for (let n = 2; n < NIVELES.length; n++) {
        for (const sx of [-1, 1]) barra(T, dentro(NIVELES[n], sx, -1), dentro(NIVELES[n], sx, 1), 0.3);
        if (n + 1 < NIVELES.length) { barra(T, dentro(NIVELES[n], 0, -1), dentro(NIVELES[n + 1], 0, 1), 0.2); barra(T, dentro(NIVELES[n], 0, 1), dentro(NIVELES[n + 1], 0, -1), 0.2); }
      }
    }
    // la viga: dos cerchas, catorce tramos entre torre y torre y dos más en cada voladizo
    const VOL = 13, peralte = (x) => (Math.abs(x) <= XT ? 5 + 3.6 * (1 - (x / XT) ** 2) : 5 - 3.5 * ((Math.abs(x) - XT) / VOL));
    const xs = Array.from({ length: 19 }, (_, i) => (i < 2 ? -XT - VOL + (i * VOL) / 2 : i > 16 ? XT + ((i - 16) * VOL) / 2 : -XT + ((i - 2) * 77.5) / 14));
    for (const z of [-ZV, ZV]) {
      barra(T, [xs[0], ALTO + 0.4, z], [xs[18], ALTO + 0.4, z], 0.8);
      for (let i = 0; i < xs.length; i++) {
        const pie = [xs[i], ALTO + 0.4, z], cab = [xs[i], ALTO + peralte(xs[i]), z];
        barra(T, pie, cab, 0.3);
        if (i === 18) break;
        const cab2 = [xs[i + 1], ALTO + peralte(xs[i + 1]), z];
        barra(T, cab, cab2, 0.55);
        if (xs[i] + xs[i + 1] < 0) barra(T, cab, [xs[i + 1], ALTO + 0.4, z], 0.26); else barra(T, pie, cab2, 0.26); // (las diagonales bajan hacia el medio)
      }
    }
    for (let i = 2; i <= 16; i++) barra(T, [xs[i], ALTO + peralte(xs[i]), -ZV], [xs[i], ALTO + peralte(xs[i]), ZV], 0.26);
    T.caja(xs[18] - xs[0], 0.5, 2 * ZV + 1.2, 0, ALTO - 0.1, 0, TINTA); // el tablero por donde corre el carro
    for (const s of [-1, 1]) T.caja(VOL - 1, 0.35, 2 * ZV + 5, s * (XT + VOL / 2 + 0.5), ALTO + 0.4, 0, TINTA); // las plataformas de las puntas
    { // la barquilla, a un tercio del cruce: la plataforma con sus barandas ciegas, el techo, la garita del guarda y
      // los tensores que la cuelgan del carro
      const xg = -12, yp = 0.9;
      T.caja(9, 0.9, 2 * ZV - 1, xg, ALTO - 1, 0, TINTA);
      T.caja(10.5, 0.45, 12.6, xg, yp, 0, PINTADO, MADERA); T.caja(11.6, 0.4, 13.8, xg, yp + 5.4, 0, PINTADO, CHAPA);
      for (const sz of [-1, 1]) {
        T.caja(10.5, 1.25, 0.16, xg, yp + 0.45, sz * 6.2, TINTA);
        for (const sx of [-1, 0, 1]) barra(T, [xg + sx * 5, yp + 0.4, sz * 6.1], [xg + sx * 5, yp + 5.4, sz * 6.1], 0.2);
        for (const sx of [-1, 1]) { barra(T, [xg + sx * 5, yp + 5.6, sz * 6.1], [xg + sx * 4, ALTO - 1, sz * 5.4], 0.2); barra(T, [xg + sx * 5, yp + 5.6, sz * 6.1], [xg - sx * 4, ALTO - 1, sz * 5.4], 0.1); }
      }
      T.caja(2, 2.3, 2, xg + 3.8, yp + 0.45, -4.8, PINTADO, BLANCO);
    }
    { // la casilla de máquinas, del lado de La Boca: una caseta vidriada sobre zancos, arrimada a la torre
      const x = -XT - B - 6.4, y = 11.4;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) barra(T, [x + sx * 2.5, 0, sz * 4.8], [x + sx * 2.5, y, sz * 4.8], 0.3);
      for (const sz of [-1, 1]) { barra(T, [x - 2.5, 0, sz * 4.8], [x + 2.5, y, sz * 4.8], 0.16); barra(T, [x + 2.5, 0, sz * 4.8], [x - 2.5, y, sz * 4.8], 0.16); }
      T.caja(6.2, 0.4, 11, x, y, 0, TINTA); T.caja(5.2, 3.9, 10, x, y + 0.4, 0, PINTADO, BLANCO); T.cuatroAguas(6.4, 11.2, 1.5, x, y + 4.3, 0);
      T.fila(5, -4.6, 4.6, 1.4, 1.9, y + 1.6, x - 2.66, '-x', false); for (const sz of [-1, 1]) T.fila(2, x - 2.2, x + 2.2, 1.4, 1.9, y + 1.6, sz * 5.06, sz < 0 ? '-z' : '+z', false);
      barra(T, [x + 2.6, y + 0.2, 0], [-XT - B * 0.75, y + 0.2, 0], 0.3);
    }
  }

  // ---------------------------------------------------------------------------------------------------- el Comega
  { // El Edificio Comega (1931-1933, de Enrique Douillet y Alfredo Joselevich, para la Compañía Mercantil y Ganadera):
    // la esquina sudoeste de Corrientes y Leandro N. Alem. Hormigón armado revestido de travertino, sin un adorno:
    // 21 pisos y 88 metros. De «Edificios Comega y Safico» (década de 1930, desde Alem, con Corrientes a la derecha) y
    // de una de hoy desde abajo: sobre Alem, dos alas —la del sur, un piso más baja— con un patio angosto entre las
    // dos, cerrado abajo por un basamento de tres pisos; arriba del ala norte y del fondo del patio, la torre, a ras
    // del frente de Corrientes y retirada de Alem, con el mirador curvo de la confitería justo donde termina el patio.
    // (x hacia Corrientes, z hacia Alem. Las alturas de las alas salen de contar pisos en la foto.)
    const T = c.obra('comega', c.CREMA);
    T.cuerpo(25, 12, 24.6, 0, 0, 0.2);
    T.cuerpo(8.8, 65, 24.6, -8.1, 0, 0.2); T.cuerpo(11.2, 70, 24.6, 6.9, 0, 0.2); T.cuerpo(5.2, 70, 19.8, -1.1, 0, -2.2);
    T.cuerpo(16.2, 15, 19.6, 4.4, 70, -1.9); T.liso(16.7, 0.5, 20.1, 4.4, 85, -1.9); T.liso(7, 2.6, 8, 4.4, 85.5, -3);
    for (const [r, h, y, kind] of [[2.5, 0.5, 69.7, PIEDRA], [2.3, 3.1, 70.2, TINTA], [2.5, 0.5, 73.3, PIEDRA]]) T.cilindro(r, h, -1.2, y, 7.9, kind, 12, r, { tono: c.CREMA }); // (el mirador de la confitería)
    T.vano(4.2, 5.6, 6.9, 0, 12.56, '+z', false); T.fila(3, -6, 9, 3, 4.6, 0, 12.56, '+x', false); // (las entradas, en planta baja)
    T.cilindro(0.12, 9, 4.4, 88.1, -3, TINTA, 5);
  }

  // ---------------------------------------------------------------------------------------------------- el Safico
  { // El Edificio Safico (1932-1934, del ingeniero suizo Walter Moll, para la Sociedad Anónima Financiera y Comercial):
    // Corrientes 456, entre Reconquista y San Martín. El reglamento de 1928 no dejaba pasar de 40 m sobre la línea de
    // frente: hasta ahí es un bloque de planta baja y diez pisos, y de ahí sube retirada una torre de quince pisos más
    // que se va escalonando hasta los 90 m, como las de Nueva York. De «Edificio Safico 1934», de la foto de Horacio
    // Coppola desde el Comega (1936) y de una de hoy desde el mismo lugar. (x hacia Corrientes, z hacia el río.)
    const T = c.obra('safico', c.BLANCO), xc = -2.6, zc = -0.3;
    T.prisma(planta(T, 'safico'), 40, 0, CASA, { floors: 0, tono: c.BLANCO });
    let y = 40;
    for (const [w, d, h] of [[32, 24.5, 22], [27.5, 22, 7], [23.5, 20, 6], [19.5, 17.5, 5], [15.5, 14.5, 5], [11.5, 11.5, 5]]) { T.cuerpo(w, h, d, xc, y, zc); y += h; }
    T.liso(6, 2.2, 6, xc, y, zc); T.cilindro(0.1, 6, xc, y + 2.2, zc, TINTA, 5);
    T.fila(3, -8, 7, 3.2, 5, 0, 21.6, '+x', false);
  }

  // ------------------------------------------------------------------------------- el Ministerio de Obras Públicas
  { // El Ministerio de Obras Públicas (proyecto de Alberto Belgrano Blanco; empezado el 15 de noviembre de 1934 e
    // inaugurado en septiembre de 1936): el primer rascacielos del Estado, de planta baja y 22 pisos, 93 metros. En
    // 1940 no estaba «en medio de la avenida»: la 9 de Julio llegó hasta acá en 1947; ocupaba su terreno entre Lima,
    // Moreno y la plaza. De «MOP desde el oeste» (Coppola, 1936) y «Ministerio de Obras Públicas 1937» (aérea): la
    // planta en U, con el patio abierto hacia Lima; un basamento de diez niveles con las esquinas en ochava y, más
    // angosta en las dos puntas, la torre blanca; arriba, la terraza con su mirador redondo. El frente, con la
    // portada de tres pisos, mira al este. (x hacia Moreno, z hacia el este.)
    const T = c.obra('obrasPublicas', c.BLANCO), O = planta(T, 'obrasPublicas'), o = { floors: 0, tono: c.BLANCO };
    T.prisma(O, 38, 0, CASA, o);
    // la torre: la misma U, 6,5 m más corta en cada punta
    const e = 6.5, U = O.map(([x, z]) => [Math.max(-24.3 + e, Math.min(24.3 - e, x)), z]).filter((p, i, A) => { const q = A[(i + 1) % A.length]; return Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.05; });
    T.prisma(U, 50, 38, CASA, o); T.prisma(c.adentro(U, -0.35), 0.5, 88, PIEDRA, { tono: c.BLANCO });
    T.cuerpo(26, 3.2, 12, 0, 88.5, 7.5); T.cilindro(4.2, 4.4, 0, 88.5, -1.2, PIEDRA, 14, 4.2, { tono: c.BLANCO }); T.cilindro(4.6, 0.3, 0, 92.9, -1.2, PIEDRA, 14, 4.6, { tono: c.BLANCO });
    T.vano(7, 12.5, 0, 0, 17.72, '+z', false); T.liso(11, 1, 3, 0, 4.4, 18.6); // la portada y su alero
    for (const s of [-1, 1]) T.caja(1.2, 4.6, 1.2, s * 20.4, 0, 18.4, PIEDRA, { tono: c.BLANCO }); // (las dos estatuas de las puntas, apenas un pedestal)
  }

  // ---------------------------------------------------------------------------------------------------- el Luna Park
  { // El Luna Park (Jorge Kálnay, para Ismael Pace y José Lectoure): la manzana de Corrientes, Bouchard, Lavalle y
    // Madero. Se estrenó con los bailes de carnaval de 1932, a cielo abierto y con tres tribunas; el techo es de 1934.
    // De «Luna park 1930s» (la obra, hacia 1932: el cuerpo de dos pisos que da la vuelta a la manzana y, en la ochava de
    // Corrientes y Bouchard, la torrecita del cartel) y de cómo se lo ve hoy: adentro del cerco, la nave del estadio
    // con su techo de chapa a dos aguas. (x hacia Lavalle, z hacia Madero.)
    const T = c.obra('lunaPark', c.CREMA), O = planta(T, 'lunaPark');
    T.prisma(O, 9.5, 0, CASA, { floors: 2, tono: c.CREMA }); T.prisma(c.adentro(O, -0.3), 0.45, 9.5, PIEDRA, { tono: c.CREMA });
    T.caja(88, 3.2, 45, 0.3, 9.95, 0, PINTADO, CHAPA); T.tejado(88, 46.5, 5.2, 0.3, 13.15, 0, 'x'); T.caja(60, 1.3, 5, 0.3, 17.6, 0, PINTADO, CHAPA); T.tejado(60, 6, 1, 0.3, 18.9, 0, 'x');
    // la torre del cartel, en la ochava: las letras iban en un tablero de lamparitas
    const a = O[8], b = O[10], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], L = Math.hypot(b[0] - a[0], b[1] - a[1]), u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
    T.put(new THREE.BoxGeometry(6.4, 16.5, 4).rotateY(-Math.atan2(u[1], u[0])).translate(m[0] + 1.2, 8.25, m[1] + 1.2), PIEDRA, { tono: c.CREMA });
    enPared(T, recto(-2.2, 2.2, 7.6, 15.4), [m[0] - 0.25, m[1] - 0.25], [m[0] - 0.25 + u[0], m[1] - 0.25 + u[1]], 1, 0.08, PINTADO, P(PINTA.ROJO, 0.3));
    enPared(T, recto(-1.6, 1.6, 0, 4.4), [m[0] - 0.25, m[1] - 0.25], [m[0] - 0.25 + u[0], m[1] - 0.25 + u[1]], 1, 0.08);
  }

  // ------------------------------------------------------------------------------------------ el Mercado de Abasto
  { // El Mercado de Abasto Proveedor, el edificio nuevo (1931-1934, de Delpini, Sulčič y Bes): sobre Corrientes, de
    // Agüero a Anchorena, delante del mercado viejo de 1893. Cinco naves de hormigón armado, cada una con su bóveda,
    // que asoman a la avenida como cinco arcos vidriados —el del medio, el más alto—, y a los lados dos cuerpos bajos
    // con su ventanal. De «Mercado de Abasto de Buenos Aires, ca. 1945» (Archivo General de la Nación): los arcos con
    // su arquivolta escalonada, los pilares acanalados entre arco y arco, la marquesina, la trama del vidriado. Las
    // calles del costado no salen a escuadra de Corrientes: las naves van paralelas a ellas (un supuesto: la foto no
    // lo deja ver). El frente mide 112 m; la altura, 32 m al medio, es la que le da el mapa de hoy.
    // (x hacia el fondo, a lo largo de Agüero; z hacia Anchorena.)
    const T = c.obra('abasto', c.CREMA), O = planta(T, 'abasto'), PARED = { tono: c.CREMA };
    const frente = (z) => O[30][0] + ((O[23][0] - O[30][0]) * (z - O[30][1])) / (O[23][1] - O[30][1]); // (la línea de Corrientes)
    const Fw = [frente(O[33][1]) + 1.5, O[33][1]], Fe = [frente(O[20][1]) + 0.7, O[20][1]], Bw = O[0], Be = O[15];
    /** un punto de la planta: u de Agüero (0) a Anchorena (1), v del frente (0) al fondo (1) */
    const en = (u, v) => { const f = [Fw[0] + (Fe[0] - Fw[0]) * u, Fw[1] + (Fe[1] - Fw[1]) * u], b = [Bw[0] + (Be[0] - Bw[0]) * u, Bw[1] + (Be[1] - Bw[1]) * u]; return [f[0] + (b[0] - f[0]) * v, f[1] + (b[1] - f[1]) * v]; };
    const ANCHO = Math.hypot(Fe[0] - Fw[0], Fe[1] - Fw[1]), LADO = 13.4;
    // los cuerpos de las puntas, de azotea
    for (const [u0, u1] of [[0, LADO / ANCHO], [1 - LADO / ANCHO, 1]]) { const Q = [en(u0, 0), en(u1, 0), en(u1, 1), en(u0, 1)]; T.prisma(Q, 18.5, 0, CASA, { floors: 4, tono: c.CREMA }); T.prisma(c.adentro(Q, -0.35), 0.6, 18.5, PIEDRA, PARED); }
    // las naves: [ancho, altura del arranque de la bóveda]; la flecha es medio ancho
    const NAVES = [[18.5, 17.5], [12.6, 15.2], [23.2, 20.4], [12.6, 15.2], [18.5, 17.5]].map(([w, y]) => [(w * (ANCHO - 2 * LADO)) / 85.4, y]); let s = LADO;
    for (const [w, y1] of NAVES) {
      const u0 = s / ANCHO, u1 = (s + w) / ANCHO, N = 12, Q = [], R = [];
      // las paredes y la bóveda, del frente al fondo
      for (const [ua, ub] of [[u0, u0], [u1, u1]]) { const a = en(ua, 0), b = en(ub, 1); R.push([[a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]]); }
      for (let i = 0; i < N; i++) {
        const t0 = Math.PI * (1 - i / N), t1 = Math.PI * (1 - (i + 1) / N), ua = (u0 + u1) / 2 + ((u1 - u0) / 2) * Math.cos(t0), ub = (u0 + u1) / 2 + ((u1 - u0) / 2) * Math.cos(t1), ya = y1 + (w / 2) * Math.sin(t0), yb = y1 + (w / 2) * Math.sin(t1);
        const a = en(ua, 0), b = en(ub, 0), d = en(ub, 1), e = en(ua, 1); Q.push([[a[0], ya, a[1]], [b[0], yb, b[1]], [d[0], yb, d[1]], [e[0], ya, e[1]]]);
      }
      paños(T, R, PIEDRA, PARED); paños(T, Q, PINTADO, HORMIGON);
      // los dos testeros: el del fondo, ciego; el de Corrientes, con su arco vidriado
      const a = en(u0, 0), b = en(u1, 0), a2 = en(u0, 1), b2 = en(u1, 1);
      enPared(T, arco(0, w, 0, y1), a, b, -1, 0, PIEDRA, PARED); enPared(T, arco(0, Math.hypot(b2[0] - a2[0], b2[1] - a2[1]), 0, y1), a2, b2, 1, 0, PIEDRA, PARED);
      const m = w * 0.13, yv = 5.6;
      enPared(T, arco(m, w - m, yv, y1 - 1.2), a, b, -1, 0.25); // el vidriado, y encima su trama de hormigón
      for (let i = 1; i < 5; i++) enPared(T, recto(m + ((w - 2 * m) * i) / 5 - 0.16, m + ((w - 2 * m) * i) / 5 + 0.16, yv, y1 - 1.2 + (w / 2 - m) * Math.sin(Math.acos(Math.abs(i / 5 - 0.5) * 2)) - 0.1), a, b, -1, 0.32, PIEDRA, PARED);
      for (let k = 1; k * 4.2 + yv < y1 - 1.2; k++) enPared(T, recto(m, w - m, yv + k * 4.2 - 0.14, yv + k * 4.2 + 0.14), a, b, -1, 0.32, PIEDRA, PARED);
      cajaEnPared(T, a, b, -1, m - 0.6, w - m + 0.6, 4.6, 5.2, 0, 2.2, PIEDRA, PARED); enPared(T, recto(m + 1, w - m - 1, 0, 4.2), a, b, -1, 0.12); // la marquesina y las puertas
      s += w;
    }
    // los pilares acanalados entre arco y arco, con su remate
    s = LADO;
    for (let i = 0; i <= NAVES.length; i++) {
      const h = i === 0 || i === 5 ? 20 : Math.min(NAVES[i - 1][1], NAVES[i][1]) + 3.4;
      cajaEnPared(T, Fw, Fe, -1, s - 1.3, s + 1.3, 0, h, -0.6, 0.9, PIEDRA, PARED); cajaEnPared(T, Fw, Fe, -1, s - 1.6, s + 1.6, h, h + 0.7, -0.8, 1.2, PIEDRA, PARED);
      if (i < NAVES.length) s += NAVES[i][0];
    }
    // el ventanal de cada cuerpo bajo, sobre Corrientes
    for (const [u0, u1] of [[0, LADO / ANCHO], [1 - LADO / ANCHO, 1]]) { const a = en(u0, 0), b = en(u1, 0); enPared(T, arco(2.2, LADO - 2.2, 6, 11.4), a, b, -1, 0.1); enPared(T, recto(3.4, LADO - 3.4, 0, 4.2), a, b, -1, 0.1); }
  }

  // ---------------------------------------------------------------------------------------------------- la Bombonera
  { // El estadio de Boca Juniors (Delpini, Sulčič y Bes; la obra empezó en 1938 y se inauguró el 25 de mayo de 1940),
    // en Brandsen 805, contra las vías. Como estaba ese día, que no es como hoy: una herradura de hormigón de dos
    // bandejas —la de arriba, volada sobre la de abajo— abierta hacia la calle Del Crucero (hoy Del Valle Iberlucea),
    // donde el terreno no daba para una tribuna y solo había un cuerpo bajo de palcos. La cabecera del norte tenía
    // nada más que la bandeja de abajo: la segunda se estrenó el 16 de noviembre de 1941, y la tercera, que hoy le da
    // la silueta, es de 1951-1953. De «La bombonera vista aérea 1940» (dos bandejas, el lado abierto, el mástil),
    // «Bombonera construcción feb1939» y, para comparar, «La bombonera 1951». La herradura es la del mapa de hoy.
    // (x a lo largo de la cancha, hacia el norte; z hacia los palcos.)
    const T = c.obra('bombonera', c.GRIS), O = planta(T, 'bombonera'), N = 48, PARED = { tono: c.GRIS };
    const afuera = repartir(O.slice(0, 25), N), adentro = repartir(O.slice(25, 47).reverse(), N);
    /** el punto de la estación k a t del ancho de la tribuna (0: el borde de la cancha; 1: la pared de afuera), a la altura y */
    const pt = (k, t, y) => [adentro[k][0] + (afuera[k][0] - adentro[k][0]) * t, y, adentro[k][1] + (afuera[k][1] - adentro[k][1]) * t];
    const NORTE = Math.round(N * 0.27), gradas = [], muros = [], sombra = [], ventanas = [], rayas = [];
    for (let k = 0; k < N; k++) {
      const alta = k >= NORTE, tf = alta ? 1 : 0.6, hf = alta ? 23.5 : 11.2; // (hasta dónde llega la tribuna en este tramo, y la altura de su pared de afuera)
      gradas.push([pt(k, 0, 2), pt(k + 1, 0, 2), pt(k + 1, 0.6, 10.6), pt(k, 0.6, 10.6)]);
      muros.push([pt(k, 0, 0), pt(k + 1, 0, 0), pt(k + 1, 0, 2.9), pt(k, 0, 2.9)]);
      muros.push([pt(k, tf, 0), pt(k + 1, tf, 0), pt(k + 1, tf, hf + 1), pt(k, tf, hf + 1)]);
      if (alta) {
        gradas.push([pt(k, 0.4, 13.2), pt(k + 1, 0.4, 13.2), pt(k + 1, 1, 23.5), pt(k, 1, 23.5)]);
        muros.push([pt(k, 0.4, 12.1), pt(k + 1, 0.4, 12.1), pt(k + 1, 0.4, 14.1), pt(k, 0.4, 14.1)]);
        sombra.push([pt(k, 0.6, 10.6), pt(k + 1, 0.6, 10.6), pt(k + 1, 0.6, 12.6), pt(k, 0.6, 12.6)], [pt(k, 0.4, 12.1), pt(k + 1, 0.4, 12.1), pt(k + 1, 0.6, 12.4), pt(k, 0.6, 12.4)]);
        // las aberturas de la pared de afuera: una faja por nivel, cortada por las costillas
        const f = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        const A = f([afuera[k][0], afuera[k][1]], [afuera[k + 1][0], afuera[k + 1][1]], 0.16), Bq = f([afuera[k][0], afuera[k][1]], [afuera[k + 1][0], afuera[k + 1][1]], 0.84);
        const cx = (adentro[k][0] + adentro[k + 1][0]) / 2, cz = (adentro[k][1] + adentro[k + 1][1]) / 2, mx = (A[0] + Bq[0]) / 2 - cx, mz = (A[1] + Bq[1]) / 2 - cz, ml = Math.hypot(mx, mz), ox = (mx / ml) * 0.12, oz = (mz / ml) * 0.12;
        for (const [y0, y1] of [[1, 4.6], [7.4, 10.6], [13.6, 16.8], [18.6, 21.4]]) ventanas.push([[A[0] + ox, y0, A[1] + oz], [Bq[0] + ox, y0, Bq[1] + oz], [Bq[0] + ox, y1, Bq[1] + oz], [A[0] + ox, y1, A[1] + oz]]);
      }
      // los escalones: unas rayas a lo largo de cada bandeja
      for (let i = 1; i < 6; i++) { const t = 0.6 * (i / 6), y = 2 + 8.6 * (i / 6) + 0.07; rayas.push([pt(k, t, y), pt(k + 1, t, y), pt(k + 1, t + 0.012, y + 0.17), pt(k, t + 0.012, y + 0.17)]); }
      if (alta) for (let i = 1; i < 7; i++) { const t = 0.4 + 0.6 * (i / 7), y = 13.2 + 10.3 * (i / 7) + 0.07; rayas.push([pt(k, t, y), pt(k + 1, t, y), pt(k + 1, t + 0.012, y + 0.2), pt(k, t + 0.012, y + 0.2)]); }
      if (k === NORTE) muros.push([pt(k, 0.4, 0), pt(k, 1, 0), pt(k, 1, 24.5), pt(k, 0.4, 13.2)]); // (el corte donde termina, por ahora, la bandeja alta)
    }
    for (const k of [0, N]) muros.push([pt(k, 0, 0), pt(k, k ? 1 : 0.6, 0), pt(k, k ? 1 : 0.6, k ? 24.5 : 12.2), pt(k, 0, 2.9)]); // las dos puntas de la herradura
    paños(T, gradas, PINTADO, HORMIGON); paños(T, muros, PIEDRA, PARED); paños(T, sombra, TINTA); paños(T, ventanas, TINTA); paños(T, rayas, PINTADO, P(PINTA.ADOQUIN, 0.6));
    // la cancha y sus líneas
    const cx = (O[29][0] + O[42][0]) / 2, cz = (O[36][1] + 51.3) / 2 + 1;
    T.tapete(T.recto(105, 68, cx, cz), PINTA.CESPED, { y: 0.1, claro: 0.78 });
    for (const [w, d, x, z] of [[105, 0.5, 0, -34], [105, 0.5, 0, 34], [0.5, 68, -52.5, 0], [0.5, 68, 52.5, 0], [0.5, 68, 0, 0], [0.5, 40, -36, 0], [0.5, 40, 36, 0], [16.5, 0.5, -44.25, -20], [16.5, 0.5, -44.25, 20], [16.5, 0.5, 44.25, -20], [16.5, 0.5, 44.25, 20]]) T.tapete(T.recto(w, d, cx + x, cz + z), PINTA.BLANCO, { y: 0.32, claro: 0.97 });
    for (const s of [-1, 1]) { for (const z of [-3.66, 3.66]) T.caja(0.14, 2.44, 0.14, cx + s * 52.5, 0, cz + z, PINTADO, BLANCO); T.caja(0.14, 0.14, 7.46, cx + s * 52.5, 2.44, cz, PINTADO, BLANCO); }
    // el lado abierto: el cuerpo bajo de los palcos y el mástil
    const Q = planta(T, 'bombonera', 1);
    T.prisma(Q, 7.2, 0, CASA, { floors: 2, tono: c.CREMA }); T.prisma(c.adentro(Q, -0.25), 0.4, 7.2, PIEDRA, { tono: c.CREMA });
    T.cilindro(0.3, 30, cx, 7.6, 56, PINTADO, 6, 0.14, BLANCO);
  }
  c.epoca(0);
}
