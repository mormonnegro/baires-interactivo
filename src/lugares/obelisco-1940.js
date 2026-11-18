// La Plaza de la República hacia 1940: lo que rodeaba al Obelisco —los edificios con nombre de sus esquinas y de las
// dos cuadras de Corrientes que lo flanquean— y sus carteles. (El Obelisco está en src/hitos.js, la avenida en
// nueve-de-julio.js y la Diagonal Norte en diagonal-norte.js: acá no se tocan.) Todo aparece en la etapa de 1940.
//
// Cada edificio y cada cartel sale de una foto fechada entre 1936 y 1937, de la foto aérea de 1940 o de un texto; lo
// que es supuesto (el frente del Broadway, que es el de hoy; los letreros del Broadway y del Gran Rex, que no salen
// de ninguna foto; el pie de la segunda torre «DIAZ»; a qué lote toca cada casa de Cerrito al 300; el año de las
// casas sin fecha, que es el de la foto más vieja que las muestra) está dicho en su lugar. Las plantas son las de OpenStreetMap (src/edificios.js, tanda «obelisco»), comparadas
// una por una con la aérea de 1940 del mapa de la Ciudad (las fotos de 1940 del mapa interactivo de Buenos Aires).
// Los datos (años, autores, direcciones) son de Wikipedia en español: «El Trust Joyero Relojero», «Chalet Díaz»,
// «Teatro Gran Rex», «Teatro Ópera», «Teatro Broadway (Buenos Aires)» y «Avenida Corrientes».
//
// Las fotos (todas en Wikimedia Commons; entre paréntesis, quién y cuándo):
//   [A] «Buenos Aires - San Nicolás - Construcción del Obelisco.jpg» (Archivo General de la Nación, 1936, con el Obelisco a medio hacer).
//       Está espejada: los textos se leen al revés. La esquina sudeste de Corrientes y Carlos Pellegrini.
//   [B] «Av 9 de julio y obelisco 1937.jpg» (autor desconocido, 1937): la plaza desde un piso alto de Carlos
//       Pellegrini al 500, mirando al sur.
//   [C] «Inauguracion primer tramo Av 9 de Julio 1937.png» (Juan Di Sandro, 1937): la plaza desde el aire, mirando
//       al este, con Corrientes hacia arriba y la Diagonal Norte hacia la derecha.
//   [D] «Avenida 9 de Julio (obras Av. Corrientes).JPG» (autor desconocido, 1937).
//   [E] «Franz Graser Buenos Aires Teatro Opera 1937.jpg» (Franz Grasser, 1937).
//   [F] «Horacio Coppola - Buenos Aires 1936 - Cine-Teatro Ópera presenta Tiempos modernos.jpg» (1936).
//   [G] «Teatro Dancing Tabaris (1937).JPG» (autor desconocido, 1937).
//   [H] de hoy, solo para entender los volúmenes: «Edificio del Trust.JPG» (2014), «Chalet de la 9 de Julio Muebles
//       casa Díaz.jpg» (2022) y «Teatro Broadway (Buenos Aires).JPG» (2010).
//
// LOS EDIFICIOS
//   · El Trust Joyero Relojero (la esquina sudeste de Corrientes y Carlos Pellegrini; la joyería vieja se demolió en
//     1925 y se hizo este, con departamentos arriba): la ochava redonda con el tambor, la cúpula y el reloj, y un
//     cuerpo más alto atrás. De [A], [C], [D] y [H].
//   · Su vecino de la punta de la Diagonal Norte: en [A] (otoño de 1936) es un esqueleto de hormigón; en [C] (julio
//     de 1937) ya está terminado, blanco, de frente curvo. No le encontré nombre.
//   · El edificio Díaz (Sarmiento 1113), de la mueblería: nueve pisos y, en la terraza, el chalet normando que Rafael
//     Díaz terminó en 1927. De [B] (el chalet, la glorieta de la terraza, la medianera) y [H] (la mansarda y dónde
//     queda el chalet). Y la casa de la esquina de Sarmiento y Cerrito, que en [B] lleva la otra torre: de ella en
//     1937 solo se ve la torre; el cuerpo es el de hoy.
//   · La casa de la esquina sudoeste de Corrientes y Cerrito, con la cúpula en la ochava: de [B] y [D]. Sin nombre.
//   · El Teatro Broadway (Corrientes 1155, de Jorge Kálnay, inaugurado el 11 de octubre de 1930): el frente es el de
//     hoy [H] —no encontré una foto de esos años—; la sala de atrás, con su techo en bóveda, de la aérea de 1940.
//   · El Gran Rex (Corrientes 857, de Alberto Prebisch con el ingeniero Adolfo Moret, 1937): un rectángulo liso de
//     travertino con un gran paño de vidrio partido en dos por una viga. De la descripción de su artículo y de [C].
//   · El Ópera (Corrientes 860, de Alberto Bourdon, 1935-1936): el cuerpo curvo del medio, de ventanas altas, rematado en
//     una torre redonda de dos escalones, entre dos paños lisos; la marquesina curva. De [E], [F] y [C].
//   · El Tabarís (Corrientes 829): el frente de vidrio y aletas que le hizo Rafael Sammartino en 1937, como está
//     en [G] (que salió en la Revista de Arquitectura n.º 197, de mayo de 1937).
//   · La playa de estacionamiento de la punta de Corrientes, Cerrito y la Diagonal: en la aérea de 1940 son filas de
//     autos, con un galpón bajo de techo claro contra el Broadway. (En [B], de 1937, todavía es un baldío cercado.)
//   · El último tramo de la Diagonal Norte, de Cerrito a Lavalle y Libertad: en la aérea de 1940 ya está abierto. Lo
//     hace tools/crece.mjs (ahí dice qué sale de la foto y qué es supuesto); acá van solo las dos bocas de asfalto.
//
// LOS CARTELES (el texto es el que se lee en la foto; lo que no se pudo leer o ubicar no está)
//   1. «DIAZ», en letras puestas una sobre otra en una torre de hierro, sobre la terraza del edificio Díaz: [B].
//   2. «DIAZ», igual, en la otra torre, más baja y hacia Cerrito: [B]. (Va sobre la casa de la esquina de Sarmiento:
//      la foto le tapa el pie, y el lugar sale de que está unos diez metros más abajo y unos veinte al este.)
//   3. «MUEBLES / DIAZ», un tablero blanco en lo alto de la medianera norte del edificio Díaz: [B]. («DIAZ» se lee
//      bien; el renglón de arriba, chico, se lee a medias y lo confirma el nombre de la casa.)
//   4. «EL TRUST», un tablero sobre la azotea del Trust, del lado de Corrientes: [A].
//   5. «RELOJES MARCONI / DAN LA HORA AL MUNDO», una faja oscura de letras claras que da la vuelta a la ochava del
//      Trust, sobre el entrepiso: [A].
//   6. «OPERA», las letras grandes sobre la marquesina del Ópera, a la izquierda del cartel de la película: [E] y [F].
//   7. «TABARIS», las letras inclinadas sobre la marquesina: [G].
//   8. «EL / GUIPUR» con el número «539», un cartel colgante de Carlos Pellegrini 539: [B].
// Y DOS LETREROS SUPUESTOS, que no salen de ninguna foto. Del frente del Broadway y del Gran Rex en esos años no
// apareció una foto fechada y libre (busqué dos veces en Wikimedia Commons, y por la Revista de Arquitectura, el
// Archivo General de la Nación y las postales de 1937 a 1940: del Gran Rex solo está la sala, en 1937; del Broadway,
// nada anterior a 2010). Que las dos salas llevaban su nombre al frente es seguro; cómo era el letrero, no. Van los
// más sobrios que se pueden hacer, para que la sala se reconozca desde la vereda:
//   9. «BROADWAY», un tablero oscuro de letras claras parado sobre la marquesina. SUPUESTO: el texto es el nombre
//      de la sala; el lugar, el tamaño y la forma no están documentados.
//  10. «GRAN REX», letras sueltas claras de filo oscuro paradas sobre el borde de la marquesina. SUPUESTO, igual.
// Los colores no salen de las fotos, que son en blanco y negro: van claro sobre oscuro u oscuro sobre claro, como se
// ven. Las letras son trazos de geometría (no hay texturas): `letras`, más abajo.
export default function (c) {
  const { THREE, PIEDRA, TINTA, PIZARRA, CASA, PINTADO, PINTA } = c;
  const P = (tono, claro = 0.6) => ({ pinta: [tono, claro] });
  const BLANCO = P(PINTA.BLANCO, 0.97), NEGRO = P(PINTA.NEGRO, 0.24), TEJA = P(PINTA.LADRILLO, 0.5), CHAPA = P(PINTA.CHAPA, 0.84);

  // ---------------------------------------------------------------------------------------------- las herramientas
  /** el lugar de un edificio de src/edificios.js, con el x hacia el norte y el z hacia el río, en la etapa de su año */
  const sitio = (clave, ux, uy) => { const e = c.EDIFICIOS[clave]; c.epoca(c.etapaDe(e.año)); return c.lugar(e.x, e.y, ux ?? e.ux, uy ?? e.uy); };
  /** una barra de a a b ([x, y, z]), de g de grueso: cuatro caras, sin tapas (el hierro) */
  const barra = (T, a, b, g = 0.3, kind = TINTA, o) => {
    const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), l = d.length();
    const geo = new THREE.CylinderGeometry(g * 0.707, g * 0.707, l, 4, 1, true).rotateY(Math.PI / 4);
    geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
    T.put(geo.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), kind, o);
  };
  /** n + 1 puntos [x, z] de un arco de radio r con centro en (cx, cz), del ángulo a0 al a1 (0: hacia +x; π/2: hacia +z) */
  const arco = (cx, cz, r, a0, a1, n = 6) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return [cx + Math.cos(a) * r, cz + Math.sin(a) * r]; });
  /** una faja que vuela `vuelo` metros de la planta (una cornisa, un balcón corrido) */
  const faja = (T, pts, y, h, vuelo, kind = PIEDRA, o) => T.prisma(c.adentro(pts, -vuelo), h, y, kind, o);
  /** lo mismo, pero solo del punto i0 al i1 de la planta (los frentes: en las medianeras no hay balcones) */
  const repisa = (T, pts, i0, i1, y, h, vuelo, kind = PIEDRA, o) => { const f = c.adentro(pts, -vuelo); T.prisma([...pts.slice(i0, i1 + 1), ...f.slice(i0, i1 + 1).reverse()], h, y, kind, o); };
  /** una baranda de hierro sobre el borde de esa repisa: el pasamanos y, cada tanto, un parante */
  const baranda = (T, pts, i0, i1, y, vuelo, alto = 0.95) => {
    const f = c.adentro(pts, -vuelo + 0.08).slice(i0, i1 + 1);
    for (let i = 0; i + 1 < f.length; i++) { barra(T, [f[i][0], y + alto, f[i][1]], [f[i + 1][0], y + alto, f[i + 1][1]], 0.09); barra(T, [f[i][0], y + alto * 0.5, f[i][1]], [f[i + 1][0], y + alto * 0.5, f[i + 1][1]], 0.06); }
    for (const q of f) barra(T, [q[0], y, q[1]], [q[0], y + alto, q[1]], 0.09);
  };
  /** un tablero de w × h y e de espesor, apoyado en y, que mira hacia `cara` ([nx, nz]) */
  const tabla = (T, x, y, z, cara, w, h, e, kind, o) => T.put(new THREE.BoxGeometry(w, h, e).rotateY(Math.atan2(cara[0], cara[1])).translate(x, y + h / 2, z), kind, o);
  /** una caja de e (hacia afuera) × h × w puesta sobre un cilindro de centro (cx, cz) y radio R, en el ángulo a */
  const radial = (T, cx, cz, R, a, w, h, e, y, kind, o) => T.put(new THREE.BoxGeometry(e, h, w).rotateY(-a).translate(cx + Math.cos(a) * R, y + h / 2, cz + Math.sin(a) * R), kind, o);
  /** un techo a dos aguas de un color (el de teja): la cumbrera a lo largo de x si along = 'x' */
  const aguas = (T, w, d, h, x, y, z, along, o) => {
    const half = (along === 'x' ? d : w) / 2, len = along === 'x' ? w : d, s = new THREE.Shape(); s.moveTo(-half, 0); s.lineTo(half, 0); s.lineTo(0, h); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false }).translate(0, 0, -len / 2); if (along === 'x') g.rotateY(Math.PI / 2);
    T.put(g.translate(x, y, z), PINTADO, o);
  };

  // Las letras: de palo, hechas de trazos. Cada una, su ancho y sus líneas quebradas en una grilla de 6 de alto.
  const O = [[1, 0], [0, 1.2], [0, 4.8], [1, 6], [3, 6], [4, 4.8], [4, 1.2], [3, 0], [1, 0]], PANZA = [[0, 0], [0, 6], [3, 6], [4, 5], [4, 3.8], [3, 2.8], [0, 2.8]];
  const TRAZOS = {
    A: [4, [[0, 0], [2, 6], [4, 0]], [[0.8, 2], [3.2, 2]]], B: [4, [[0, 0], [0, 6], [3, 6], [4, 5.1], [4, 4], [3, 3.1], [0, 3.1]], [[3, 3.1], [4, 2.2], [4, 0.9], [3, 0], [0, 0]]],
    C: [4, [[4, 1.2], [3, 0], [1, 0], [0, 1.2], [0, 4.8], [1, 6], [3, 6], [4, 4.8]]], D: [4, [[0, 0], [0, 6], [2.6, 6], [4, 4.6], [4, 1.4], [2.6, 0], [0, 0]]],
    E: [3.6, [[3.6, 0], [0, 0], [0, 6], [3.6, 6]], [[0, 3.1], [2.8, 3.1]]], F: [3.6, [[0, 0], [0, 6], [3.6, 6]], [[0, 3.1], [2.8, 3.1]]],
    G: [4, [[4, 4.8], [3, 6], [1, 6], [0, 4.8], [0, 1.2], [1, 0], [3, 0], [4, 1.2], [4, 2.8], [2.2, 2.8]]], H: [4, [[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3.1], [4, 3.1]]],
    I: [1, [[0.5, 0], [0.5, 6]]], J: [3.6, [[0, 1.2], [1, 0], [2.6, 0], [3.6, 1.2], [3.6, 6]]], K: [4, [[0, 0], [0, 6]], [[4, 6], [0, 2.4]], [[1.5, 3.7], [4, 0]]],
    L: [3.4, [[0, 6], [0, 0], [3.4, 0]]], M: [4.8, [[0, 0], [0, 6], [2.4, 2.2], [4.8, 6], [4.8, 0]]], N: [4, [[0, 0], [0, 6], [4, 0], [4, 6]]],
    O: [4, O], P: [4, PANZA], Q: [4, O, [[2.6, 1.5], [4.2, -0.3]]], R: [4, PANZA, [[2, 2.8], [4, 0]]],
    S: [4, [[4, 4.8], [3, 6], [1, 6], [0, 4.8], [0, 3.9], [1, 3.1], [3, 2.9], [4, 2.1], [4, 1.2], [3, 0], [1, 0], [0, 1.2]]], T: [4, [[0, 6], [4, 6]], [[2, 0], [2, 6]]],
    U: [4, [[0, 6], [0, 1.2], [1, 0], [3, 0], [4, 1.2], [4, 6]]], V: [4, [[0, 6], [2, 0], [4, 6]]], W: [5.2, [[0, 6], [1.3, 0], [2.6, 4], [3.9, 0], [5.2, 6]]],
    X: [4, [[0, 0], [4, 6]], [[0, 6], [4, 0]]], Y: [4, [[0, 6], [2, 3], [4, 6]], [[2, 3], [2, 0]]], Z: [4, [[0, 6], [4, 6], [0, 0], [4, 0]]],
    0: [4, O], 1: [2.4, [[0.3, 4.6], [1.8, 6], [1.8, 0]]], 2: [4, [[0, 4.8], [1, 6], [3, 6], [4, 4.8], [4, 3.6], [0, 0], [4, 0]]],
    3: [4, [[0, 4.8], [1, 6], [3, 6], [4, 5], [4, 4], [3, 3.1], [1.6, 3.1]], [[3, 3.1], [4, 2.2], [4, 1], [3, 0], [1, 0], [0, 1.2]]], 4: [4, [[3, 0], [3, 6], [0, 2], [4, 2]]],
    5: [4, [[4, 6], [0, 6], [0, 3.4], [3, 3.4], [4, 2.4], [4, 1.2], [3, 0], [1, 0], [0, 1.2]]], 6: [4, [[4, 4.8], [3, 6], [1, 6], [0, 4.8], [0, 1.2], [1, 0], [3, 0], [4, 1.2], [4, 2.4], [3, 3.4], [0, 3.4]]],
    7: [4, [[0, 6], [4, 6], [1.4, 0]]], 8: [4, [[1, 3.1], [0, 3.9], [0, 5], [1, 6], [3, 6], [4, 5], [4, 3.9], [3, 3.1], [1, 3.1], [0, 2.2], [0, 1], [1, 0], [3, 0], [4, 1], [4, 2.2], [3, 3.1]]],
    9: [4, [[0, 1.2], [1, 0], [3, 0], [4, 1.2], [4, 4.8], [3, 6], [1, 6], [0, 4.8], [0, 3.6], [1, 2.6], [4, 2.6]]],
  };
  /** Un renglón de letras de `alto` metros, centrado en (x, z), con el pie en y, que mira hacia `cara` ([nx, nz]: quien
   *  lo lee está de ese lado). Cada trazo es un paño plano (dos triángulos; con `doble`, también el revés: para las
   *  letras sueltas, que se ven de atrás). `grueso`: el del trazo, en partes del alto · `sep`: el blanco entre letras
   *  · `vertical`: una letra debajo de otra, e y es el tope · `inclina`: cuánto se vuelcan (0,25: itálica) ·
   *  `curva`: { cx, cz, R, a }, el renglón da la vuelta a un cilindro, centrado en el ángulo a. */
  const letras = (T, txt, x, y, z, cara, alto, { kind = TINTA, o, grueso = 0.17, sep = 0.26, doble = false, vertical = false, inclina = 0, curva = null } = {}) => {
    const k = alto / 6, h = (grueso * alto) / 2, G = [...txt].map((ch) => TRAZOS[ch] ?? null), anchos = G.map((g) => (g ? g[0] : 2.2) * k), v = [];
    const total = anchos.reduce((a, b) => a + b, 0) + sep * alto * (G.length - 1);
    let s = -total / 2;
    G.forEach((g, i) => {
      const w = anchos[i], s0 = s; s += w + sep * alto; if (!g) return;
      let px = x, pz = z, nx = cara[0], nz = cara[1], u0 = s0, v0 = 0;
      if (vertical) { u0 = -w / 2; v0 = -(i + 1) * alto - i * sep * alto; }
      if (curva) { const a = curva.a - (s0 + w / 2) / curva.R; nx = Math.cos(a); nz = Math.sin(a); px = curva.cx + curva.R * nx; pz = curva.cz + curva.R * nz; u0 = -w / 2; }
      const ax = nz, az = -nx, pt = (u, vv) => [px + ax * (u0 + u + inclina * vv), y + v0 + vv, pz + az * (u0 + u + inclina * vv)];
      for (const linea of g.slice(1)) {
        // cada quiebre, a inglete (los dos trazos comparten los puntos del codo); las puntas sueltas, apenas más largas
        const Q = linea.map(([a, b]) => [a * k, b * k]), n = Q.length, cerrada = n > 2 && Math.hypot(Q[0][0] - Q[n - 1][0], Q[0][1] - Q[n - 1][1]) < 1e-6, m = cerrada ? n - 1 : n;
        const dir = (i) => { const a = Q[i], b = Q[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; };
        const izq = [], der = [];
        for (let i = 0; i < m; i++) {
          const d1 = i > 0 ? dir(i - 1) : cerrada ? dir(n - 2) : null, d2 = i < n - 1 ? dir(i) : null;
          let qx = Q[i][0], qy = Q[i][1], ox, oy;
          if (d1 && d2) { const den = Math.max(0.45, 1 + d1[0] * d2[0] + d1[1] * d2[1]); ox = ((-d1[1] - d2[1]) / den) * h; oy = ((d1[0] + d2[0]) / den) * h; }
          else { const d = d1 ?? d2, sg = d1 ? 1 : -1; ox = -d[1] * h; oy = d[0] * h; qx += sg * d[0] * h * 0.5; qy += sg * d[1] * h * 0.5; }
          izq.push(pt(qx + ox, qy + oy)); der.push(pt(qx - ox, qy - oy));
        }
        for (let j = 0; j + 1 < n; j++) { const a = j, b = (j + 1) % m, A = der[a], B = der[b], C = izq[b], D = izq[a]; v.push(A, B, C, A, C, D); if (doble) v.push(A, C, B, A, D, C); }
      }
    });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(v.flat(), 3)); geo.computeVertexNormals(); T.put(geo, kind, o);
  };
  /** una torre de hierro para letras: cuatro montantes que se juntan en la punta, con sus anillos y sus diagonales;
   *  y, en la cara que mira hacia +x (el norte), las letras una sobre otra */
  const torreDeLetras = (T, x, z, y0, alto, b, txt, altoLetra) => {
    const E = [[-1, -1], [1, -1], [1, 1], [-1, 1]], N = 7, en = (i, n) => { const t = n / N, r = b * (1 - t) + 0.12 * t; return [x + E[i][0] * r, y0 + alto * t * 0.82, z + E[i][1] * r]; };
    for (let i = 0; i < 4; i++) {
      barra(T, en(i, 0), en(i, N), 0.24);
      for (let n = 0; n < N; n++) { barra(T, en(i, n), en((i + 1) % 4, n), 0.12); barra(T, en(i, n), en((i + 1) % 4, n + 1), 0.09); }
    }
    barra(T, [x, y0 + alto * 0.8, z], [x, y0 + alto, z], 0.16); // el mástil de la punta
    const tope = y0 + alto * 0.03 + [...txt].length * altoLetra * 1.24; // (las letras, claras con el filo oscuro: como salen en la foto)
    letras(T, txt, x + b + 0.2, tope, z, [1, 0], altoLetra, { vertical: true, doble: true, grueso: 0.36, sep: 0.24 });
    letras(T, txt, x + b + 0.27, tope, z, [1, 0], altoLetra, { vertical: true, kind: PINTADO, o: BLANCO, grueso: 0.17, sep: 0.24 });
  };

  // ---------------------------------------------------------------------------------------- el Trust Joyero Relojero
  { // (x hacia el norte: el frente de Corrientes en x = 10; z hacia el río: el de Carlos Pellegrini en z = −15,9)
    const T = sitio('trust', 0.9989, 0.0469), TONO = { tono: c.CREMA }, cx = 4, cz = -9.9, R = 6;
    const pl = [[-6.2, -15.9], ...arco(cx, cz, R, -Math.PI / 2, 0, 7), [10, 15.2], [-8.5, 15.2], [-8.5, -5], [-6.2, -5]];
    // planta baja y entrepiso, tres pisos con el orden de columnas, el de las ventanas en arco y dos más: ocho
    T.prisma(pl, 30.5, 0, CASA, { floors: 8, ...TONO });
    faja(T, pl, 8.5, 0.5, 0.7, PIEDRA, TONO); faja(T, pl, 19.3, 0.45, 0.45, PIEDRA, TONO); faja(T, pl, 23, 0.4, 0.7, PIEDRA, TONO); faja(T, pl, 30.5, 0.8, 0.9, PIEDRA, TONO);
    T.prisma(c.adentro(pl, 1.1), 2.3, 31.3, PIZARRA); // la mansarda baja de arriba de la cornisa
    for (let i = 0; i < 8; i++) T.caja(0.3, 10.3, 0.55, 10.12, 9, -8.6 + i * 3.3, PIEDRA, TONO); // las pilastras del orden, sobre Corrientes…
    for (let i = 0; i < 3; i++) T.caja(0.55, 10.3, 0.3, -4.6 + i * 3.6, 9, -16.02, PIEDRA, TONO); // …y sobre Carlos Pellegrini
    for (let i = 1; i < 4; i++) radial(T, cx, cz, R + 0.12, -Math.PI / 2 + (i * Math.PI) / 8, 0.55, 10.3, 0.3, 9, PIEDRA, TONO); // …y en la ochava
    baranda(T, pl, 0, 9, 9, 0.7); baranda(T, pl, 0, 9, 23.4, 0.7); // (los dos balcones corridos: del punto 0 al 9 de la planta van los dos frentes y la ochava)
    for (let i = 0; i < 7; i++) { T.caja(1, 1.9, 1.5, 9.2, 31.3, -6.5 + i * 3.4, PIEDRA, TONO); T.tejado(1.3, 1.8, 0.7, 9.2, 33.2, -6.5 + i * 3.4, 'x'); } // las lucarnas de la mansarda
    for (let i = 0; i < 2; i++) { T.caja(1.5, 1.9, 1, -3.4 + i * 3.6, 31.3, -15.1, PIEDRA, TONO); T.tejado(1.8, 1.3, 0.7, -3.4 + i * 3.6, 33.2, -15.1, 'z'); }
    // el tambor de la ochava, la cúpula gallonada, el reloj de cuatro caras y el remate
    const tx = 5.2, tz = -11.1;
    T.cilindro(3.3, 4.3, tx, 31.3, tz, PIEDRA, 14, 3.3, TONO); T.cilindro(3.7, 0.4, tx, 35.6, tz, PIEDRA, 14, 3.7, TONO);
    T.cupula(3.4, tx, 36, tz, 1.15, PIZARRA);
    for (let i = 0; i < 8; i++) radial(T, tx, tz, 3.3, (i / 8) * Math.PI * 2 + 0.39, 0.9, 2.6, 0.12, 32.3, TINTA); // las ventanas del tambor
    T.caja(2.3, 2.4, 2.3, tx, 39.3, tz, PIEDRA, TONO);
    for (const [a, dx, dz] of [[0, 0, 1], [Math.PI, 0, -1], [Math.PI / 2, 1, 0], [-Math.PI / 2, -1, 0]]) T.put(new THREE.CircleGeometry(0.95, 14).rotateY(a).translate(tx + dx * 1.17, 40.5, tz + dz * 1.17), PINTADO, BLANCO);
    T.cupula(1.5, tx, 41.7, tz, 1.05, PIZARRA); T.cilindro(0.1, 2.2, tx, 43.2, tz, TINTA, 4, 0.03);
    T.caja(7.5, 9, 8, -3.5, 30.5, -1.5, PIEDRA, TONO); T.caja(5.6, 2.4, 6, -3.5, 39.5, -1.5, PIEDRA, { tono: c.BLANCO }); // el cuerpo alto de atrás
    // el cartel de la azotea, sobre Corrientes, mirando a la plaza: «EL TRUST»
    { const n = [0.42, -0.9075], x = 9.2, z = 6.5;
      for (const s of [-2.4, 2.4]) barra(T, [x - n[0] * 0.2 + n[1] * s, 31.3, z - n[1] * 0.2 - n[0] * s], [x - n[0] * 0.2 + n[1] * s, 35.2, z - n[1] * 0.2 - n[0] * s], 0.18);
      tabla(T, x, 33.3, z, n, 6.6, 1.9, 0.14, PINTADO, BLANCO);
      letras(T, 'EL TRUST', x + n[0] * 0.1, 33.65, z + n[1] * 0.1, n, 1.15, { grueso: 0.19 }); }
    // la faja de la ochava, sobre el entrepiso: «RELOJES MARCONI / DAN LA HORA AL MUNDO»
    T.prisma([...arco(cx, cz, R + 0.95, -Math.PI / 2 - 0.05, 0.05, 9), ...arco(cx, cz, R + 0.6, 0.05, -Math.PI / 2 - 0.05, 9)], 1.9, 9.05, PINTADO, NEGRO);
    letras(T, 'RELOJES MARCONI', 0, 10, 0, [0, 0], 0.66, { kind: PINTADO, o: BLANCO, grueso: 0.2, curva: { cx, cz, R: R + 0.99, a: -Math.PI / 4 } });
    letras(T, 'DAN LA HORA AL MUNDO', 0, 9.3, 0, [0, 0], 0.38, { kind: PINTADO, o: BLANCO, grueso: 0.2, curva: { cx, cz, R: R + 0.99, a: -Math.PI / 4 } });
  }
  { // el vecino de la punta de la Diagonal Norte: nueve pisos blancos de frente curvo y dos más, retirados
    const T = sitio('trustVecino', 0.9989, 0.0469), TONO = { tono: c.BLANCO };
    const pl = [[5.5, -10.5], [5.4, 0], [2, 0], [-1.7, 6.2], [3.9, 10.6], [2, 14.1], [-6.3, 9.1], [-14, 3.4], [-6.9, -6.8], [-5.6, -8.6], [-3.9, -9.9], [-1.9, -10.6]];
    T.prisma(pl, 31, 0, CASA, { floors: 9, ...TONO });
    faja(T, pl, 4.9, 0.4, 0.5, PIEDRA, TONO); faja(T, pl, 31, 0.5, 0.6, PIEDRA, TONO);
    for (let p = 2; p <= 8; p++) repisa(T, pl, 7, 11, 5.1 + ((p - 1) * 25.9) / 8 - 0.25, 1.15, 0.75, PIEDRA, TONO); // (del punto 7 al 11: la Diagonal, la curva y Carlos Pellegrini)
    T.prisma([[3, -8.4], [3, 7.5], [-5, 7.5], [-11.2, 3], [-5.2, -6.2], [-2, -8.4]], 6.2, 31.5, CASA, { floors: 2, ...TONO });
    T.caja(5, 2.6, 5, -1.5, 37.7, 2, PIEDRA, TONO);
  }

  // -------------------------------------------------------------------------------------------- el edificio Díaz
  { // (x hacia el norte: el frente de Sarmiento en x = −31; z hacia el río)
    const T = sitio('diaz'), TONO = { tono: c.CREMA }, H = 30, HM = 36.5;
    T.caja(62.3, H, 15.3, 0, 0, 0, CASA, { floors: 8, ...TONO });
    T.caja(44.2, HM - H, 15.3, 9.05, H, 0, CASA, { floors: 2, ...TONO });
    T.caja(0.3, HM, 15.4, 31.2, 0, 0, PIEDRA, TONO); // (la medianera del norte, ciega)
    // sobre Sarmiento, los dos pisos de mansarda con su cornisa
    T.caja(18.9, 0.5, 16.1, -22.05, H - 0.2, 0, PIEDRA, TONO); T.mansarda(18.2, 15.3, HM - H - 0.3, -22, H + 0.3, 0, 1.4);
    // el chalet: dos pisos blancos con el entramado de madera a la vista, techo de teja a dos aguas con la cumbrera
    // hacia Sarmiento, un mojinete atravesado y la chimenea
    { const x = -19, w = 11, d = 9.4, y = HM, hp = 5.2, hr = 4.4;
      T.caja(w, hp, d, x, y, 0, PINTADO, BLANCO);
      aguas(T, w + 0.9, d + 1.3, hr, x, y + hp, 0, 'x', TEJA); aguas(T, 5.2, d / 2 + 1.6, 3, x + 0.6, y + hp, d / 4 + 0.8, 'z', TEJA);
      for (const s of [-1, 1]) { // los dos hastiales, blancos, con sus maderas
        const xs = x + s * (w / 2 + 0.47), g = new THREE.BufferGeometry(), a = [xs, y + hp, s * (d / 2 + 0.5)], b = [xs, y + hp, -s * (d / 2 + 0.5)], t = [xs, y + hp + hr - 0.45, 0];
        g.setAttribute('position', new THREE.Float32BufferAttribute([a, b, t].flat(), 3)); g.computeVertexNormals(); T.put(g, PINTADO, BLANCO);
        const xm = x + s * (w / 2 + 0.06);
        T.caja(0.12, 0.24, d, xm, y + hp - 0.24, 0, TINTA); T.caja(0.12, 0.2, d, xm, y + 2.5, 0, TINTA);
        for (const z of [-4.5, -2.2, 0, 2.2, 4.5]) T.caja(0.12, hp, 0.2, xm, y, z, TINTA);
        T.caja(0.1, hr - 1.3, 0.2, xs + s * 0.03, y + hp, 0, TINTA);
      }
      for (const s of [-1, 1]) { T.caja(w, 0.2, 0.12, x, y + 2.5, s * (d / 2 + 0.06), TINTA); for (const dx of [-5.3, -2.6, 0, 2.6, 5.3]) T.caja(0.2, hp, 0.12, x + dx, y, s * (d / 2 + 0.06), TINTA); }
      T.caja(1, hp + hr + 1.6, 1, x - 3.2, y, -d / 2 + 0.3, PINTADO, P(PINTA.LADRILLO, 0.55));
    }
    // la glorieta de hierro de la terraza y, encima, la torre de las letras
    { const x = 9, z = -0.5, y = HM, r = 3.1;
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { barra(T, [x + sx * r, y, z + sz * r], [x + sx * r, y + 5.6, z + sz * r], 0.26); barra(T, [x + sx * 1.6, y + 5.6, z + sz * 1.6], [x + sx * r, y + 7.6, z + sz * r], 0.2); }
      for (const yy of [2.9, 5.6, 7.6]) for (const [a, b] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]]) barra(T, [x + a[0] * r, y + yy, z + a[1] * r], [x + b[0] * r, y + yy, z + b[1] * r], 0.2);
      torreDeLetras(T, x, z, y + 7.6, 22, 1.6, 'DIAZ', 2.7);
    }
    // el tablero de la medianera norte: «MUEBLES / DIAZ»
    tabla(T, 31.42, 30.6, 3.5, [1, 0], 6.6, 4.9, 0.12, PINTADO, BLANCO);
    letras(T, 'MUEBLES', 31.5, 33.95, 3.5, [1, 0], 0.9, { grueso: 0.2 }); letras(T, 'DIAZ', 31.5, 31.25, 3.5, [1, 0], 1.9, { grueso: 0.2 });
  }
  { // la casa de la esquina de Sarmiento y Cerrito, con la otra torre de letras
    const T = sitio('diazEsquina'), TONO = { tono: c.GRIS };
    T.caja(23.3, 21.5, 15.5, 0, 0, 0, CASA, { floors: 6, ...TONO }); T.caja(24.2, 0.5, 16.4, 0, 21.5, 0, PIEDRA, TONO); T.mansarda(23.3, 15.5, 4.6, 0, 22, 0, 1.6);
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) barra(T, [2 + sx * 1.7, 26.6, sz * 1.7], [2 + sx * 1.7, 29.2, sz * 1.7], 0.24);
    torreDeLetras(T, 2, 0, 29.2, 23, 1.7, 'DIAZ', 2.8);
  }

  { // Cerrito al 300, entre las dos esquinas: en [B] son una casa blanca larga, de seis pisos y mansarda (los dos lotes
    // del sur), y otra más baja y oscura, de cuatro (el del norte). Los carteles que llevaban no se alcanzan a leer.
    const T = sitio('cerrito300'), e = c.EDIFICIOS.cerrito300, L = e.partes.map((p) => ({ ...p, c: T.deMundo(p.x, p.y) })).sort((a, b) => a.c[0] - b.c[0]);
    const x0 = L[0].c[0] - L[0].largo / 2, x1 = L[1].c[0] + L[1].largo / 2, zb = (L[0].c[1] + L[1].c[1]) / 2, db = (L[0].ancho + L[1].ancho) / 2;
    T.caja(x1 - x0, 22, db, (x0 + x1) / 2, 0, zb, CASA, { floors: 6, tono: c.BLANCO }); T.caja(x1 - x0 + 0.8, 0.45, db + 0.8, (x0 + x1) / 2, 22, zb, PIEDRA, { tono: c.BLANCO }); T.mansarda(x1 - x0, db, 4.2, (x0 + x1) / 2, 22.45, zb, 1.5);
    T.caja(L[2].largo, 15.5, L[2].ancho, L[2].c[0], 0, L[2].c[1], CASA, { floors: 4, tono: c.GRIS }); T.caja(L[2].largo + 0.7, 0.5, L[2].ancho + 0.7, L[2].c[0], 15.5, L[2].c[1], PIEDRA, { tono: c.GRIS });
  }

  // ------------------------------------------------------------------------- la esquina de Corrientes y Cerrito
  { // (x hacia el norte: el frente de Corrientes en x = 14; el de Cerrito, en z = 7,1)
    const T = sitio('esquinaCerrito'), TONO = { tono: c.GRIS };
    const pl = [[14, -7.1], [14, 4.9], [11.8, 7.1], [-13.4, 7.1], [-13.4, 0.3], [-9.5, 0.3], [-9.5, -7.1]];
    T.prisma(pl, 20.5, 0, CASA, { floors: 6, ...TONO });
    faja(T, pl, 7.9, 0.45, 0.6, PIEDRA, TONO); faja(T, pl, 20.5, 0.6, 0.8, PIEDRA, TONO);
    T.prisma(c.adentro(pl, 0.9), 4, 21.1, PIZARRA);
    T.cilindro(2.5, 5.4, 12.1, 20.5, 5.2, PIEDRA, 12, 2.5, TONO); T.cilindro(2.8, 0.35, 12.1, 25.9, 5.2, PIEDRA, 12, 2.8, TONO);
    T.cupula(2.6, 12.1, 26.2, 5.2, 1.7, PIZARRA); T.cilindro(0.14, 4.6, 12.1, 30.5, 5.2, TINTA, 4, 0.03);
  }

  // --------------------------------------------------------------------------------------------- el Teatro Broadway
  { // (x hacia el norte: el frente de Corrientes en x = −23,9)
    const T = sitio('broadway'), TONO = { tono: c.CREMA }, xf = -23.9;
    for (const s of [-1, 1]) T.caja(13.5, 36, 6.2, xf + 6.75, 0, s * 11 - 0.2, CASA, { floors: 10, ...TONO }); // las dos alas
    T.caja(12.7, 31, 15.8, xf + 7.15, 0, -0.2, CASA, { floors: 9, ...TONO }); T.caja(9.5, 4.2, 15.8, xf + 8.75, 31, -0.2, CASA, { floors: 1, ...TONO }); // el medio, apenas retirado, y su ático
    T.caja(0.5, 0.55, 15.8, xf + 0.7, 8.3, -0.2, PIEDRA, TONO); T.caja(0.5, 0.5, 15.8, xf + 0.7, 31, -0.2, PIEDRA, TONO);
    T.caja(2.5, 0.5, 15.6, xf - 0.4, 4.4, -0.2, PIEDRA, TONO); // la marquesina
    // «BROADWAY», sobre la marquesina. SUPUESTO (el cartel 9 de la cabecera): no sale de ninguna foto
    tabla(T, xf - 1.45, 4.9, -0.2, [-1, 0], 12.4, 2.1, 0.3, PINTADO, NEGRO);
    letras(T, 'BROADWAY', xf - 1.64, 5.25, -0.2, [-1, 0], 1.4, { kind: PINTADO, o: BLANCO, grueso: 0.2 });
    // la sala, atrás: el techo en bóveda
    T.caja(34, 14.5, 27, 6.6, 0, -0.2, PIEDRA, TONO); T.tejado(34, 27, 5.5, 6.6, 14.5, -0.2, 'x', PIZARRA, true);
  }

  // --------------------------------------------------------------------------------------------------- el Gran Rex
  { // (x hacia el norte: el frente de Corrientes en x = −22,2)
    const T = sitio('granRex'), TONO = { tono: c.BLANCO }, xf = -22.2, zc = 0.1, AV = 24, Y0 = 6.6, HV = 22.6;
    T.caja(12, 33, 36.6, xf + 6, 0, zc, PIEDRA, TONO);
    // el gran paño de vidrio, con sus parantes, partido en dos por la viga
    T.caja(0.24, HV, AV, xf - 0.02, Y0, zc, TINTA);
    for (let i = 1; i < 8; i++) T.caja(0.14, 0.16, AV, xf - 0.16, Y0 + (HV * i) / 8 - 0.08, zc, PINTADO, BLANCO);
    for (let i = 1; i < 9; i++) T.caja(0.14, HV, 0.16, xf - 0.16, Y0, zc - AV / 2 + (AV * i) / 9, PINTADO, BLANCO);
    T.caja(0.6, 0.75, AV + 0.6, xf - 0.25, Y0 + HV / 2 - 0.37, zc, PIEDRA, TONO);
    T.caja(2.8, 0.6, 27, xf - 1.4, 4.9, zc, PIEDRA, TONO); // la marquesina
    // «GRAN REX», en el borde de la marquesina. SUPUESTO (el cartel 10 de la cabecera): no sale de ninguna foto
    letras(T, 'GRAN REX', xf - 2.62, 5.5, zc, [-1, 0], 1.3, { doble: true, grueso: 0.36 });
    letras(T, 'GRAN REX', xf - 2.7, 5.5, zc, [-1, 0], 1.3, { kind: PINTADO, o: BLANCO, grueso: 0.17 });
    T.fila(5, zc - 10, zc + 10, 2.7, 3.5, 0, xf - 0.03, '-x', false);
    T.caja(32.6, 21, 36.6, 6.1, 0, zc, PIEDRA, { tono: c.GRIS }); T.caja(22, 2.4, 26, 3, 21, zc, PIEDRA, { tono: c.GRIS }); // la sala, con el lomo del cielorraso
  }

  // ------------------------------------------------------------------------------------------------------ el Ópera
  { // (x hacia el norte: el frente de Corrientes en x = 29,8)
    const T = sitio('opera'), TONO = { tono: c.BLANCO }, xf = 29.8, zc = -0.3, tx = 23.9, R = 6.6;
    T.caja(48, 18.5, 27.6, -6, 0, zc, PIEDRA, { tono: c.GRIS }); T.tejado(47, 26.4, 3, -6, 18.5, zc, 'x', PIEDRA, true); // la sala, con su techo claro apenas curvo
    for (const s of [-1, 1]) T.caja(11.6, 27, 6.2, 24, 0, zc + s * 10.9, PIEDRA, { tono: c.GRIS }); // los dos paños lisos de las puntas
    T.caja(10, 29.5, 15.8, 23.2, 0, zc, PIEDRA, TONO);
    // el cuerpo curvo del medio, con sus cinco ventanas altas, y la torre redonda de dos escalones
    T.cilindro(R, 26.6, tx, 5.4, zc, PIEDRA, 22, R, TONO);
    for (const a of [-0.84, -0.42, 0, 0.42, 0.84]) radial(T, tx, zc, R, a, 1.05, 19, 0.16, 9.6, TINTA);
    T.cilindro(R + 0.3, 0.4, tx, 32, zc, PIEDRA, 22, R + 0.3, TONO);
    T.cilindro(5, 5.4, tx, 32.4, zc, PIEDRA, 20, 5, TONO); for (let i = 0; i < 12; i++) radial(T, tx, zc, 5, (i / 12) * Math.PI * 2 + 0.26, 0.5, 6, 0.3, 32.4, PIEDRA, TONO);
    T.cilindro(3.4, 7.6, tx, 37.8, zc, PIEDRA, 18, 3.4, TONO); for (let i = 0; i < 12; i++) radial(T, tx, zc, 3.4, (i / 12) * Math.PI * 2, 0.4, 8, 0.24, 37.8, PIEDRA, TONO);
    T.cilindro(3.7, 0.35, tx, 45.4, zc, PIEDRA, 18, 3.7, TONO);
    // la marquesina curva, el cartel de la película y, a su izquierda, «OPERA»
    T.prisma([[xf, zc - 10.5], [xf + 1.5, zc - 9.6], [xf + 2.5, zc - 5.2], [xf + 2.8, zc], [xf + 2.5, zc + 5.2], [xf + 1.5, zc + 9.6], [xf, zc + 10.5]], 0.9, 4.5, PIEDRA, TONO);
    tabla(T, xf + 1.05, 5.4, zc, [1, 0], 17.4, 3.5, 0.3, PINTADO, NEGRO);
    letras(T, 'OPERA', xf + 1.24, 5.95, zc + 3.6, [1, 0], 2.2, { kind: PINTADO, o: BLANCO, grueso: 0.22 });
    T.fila(5, zc - 7, zc + 7, 2.2, 3.3, 0, xf + 0.02, '+x', false);
  }

  // ---------------------------------------------------------------------------------------------------- el Tabarís
  { // (x hacia el norte: el frente de Corrientes en x = −15,2)
    const T = sitio('tabaris'), TONO = { tono: c.BLANCO }, xf = -15.2, zc = -0.1;
    T.caja(9, 21, 15.2, xf + 4.5, 0, zc, PIEDRA, TONO); T.caja(21.8, 13.5, 15.2, 4.7, 0, zc, PIEDRA, { tono: c.GRIS }); // el cuerpo del frente y la sala
    T.caja(1.3, 25, 7.8, xf + 0.4, 0, zc, PIEDRA, TONO); // el cuerpo del medio, más alto
    T.caja(0.2, 16.6, 6.3, xf - 0.3, 7.2, zc, TINTA); for (let i = 0; i < 5; i++) T.caja(0.5, 17.4, 0.26, xf - 0.5, 7.2, zc + (i - 2) * 1.05, PIEDRA, TONO); // el vidrio y sus aletas
    for (const s of [-1, 1]) { T.caja(0.2, 12.6, 2.5, xf - 0.06, 7.2, zc + s * 5.7, TINTA); T.caja(0.3, 12.6, 0.2, xf - 0.16, 7.2, zc + s * 5.7, PIEDRA, TONO); }
    // la marquesina curva y las letras inclinadas: «TABARIS»
    T.prisma([[xf, zc - 7.5], [xf - 1.6, zc - 6.6], [xf - 2.2, zc], [xf - 1.6, zc + 6.6], [xf, zc + 7.5]], 0.8, 4.7, PIEDRA, TONO);
    letras(T, 'TABARIS', xf - 2.3, 5.6, zc - 0.2, [-1, 0], 1.5, { doble: true, grueso: 0.22, inclina: 0.28 });
    T.fila(3, zc - 3, zc + 3, 1.7, 3.2, 0, xf - 0.27, '-x', false);
  }

  c.epoca(6);
  // ------------------------------------------------------------------------- el cartel de Carlos Pellegrini 539
  { // «EL GUIPUR»: un cartel colgante, de canto a la vereda del este de Carlos Pellegrini (se lee de los dos lados)
    const T = c.lugar(11459, 8485), z = -1.05;
    T.caja(0.16, 6.5, 1.15, 0, 3.5, z, PINTADO, BLANCO); T.caja(0.2, 0.7, 1.15, 0, 2.8, z, TINTA);
    for (const y of [4.2, 9.8]) barra(T, [0, y, 0.6], [0, y, z], 0.1);
    for (const s of [-1, 1]) {
      letras(T, 'EL', s * 0.1, 9.45, z, [s, 0], 0.36, { grueso: 0.2 });
      letras(T, 'GUIPUR', s * 0.1, 9.25, z, [s, 0], 0.7, { vertical: true, grueso: 0.2, sep: 0.3 });
      letras(T, '539', s * 0.12, 2.97, z, [s, 0], 0.36, { kind: PINTADO, o: BLANCO, grueso: 0.2 });
    }
  }

  // ----------------------------------------------------------- la playa de estacionamiento de Corrientes y Cerrito
  { // (tools/crece.mjs despeja el lugar: «Playa de estacionamiento de Corrientes y Cerrito»)
    const T = c.lugar(11222, 8230), pl = [[11222, 8209], [11222, 8276], [11226, 8281], [11234, 8282], [11289, 8209]].map(([px, py]) => T.deMundo(px, py));
    T.tapete(pl, PINTA.BALASTO, { y: 0.08, claro: 0.86 });
    // las filas de autos de la aérea de 1940: paralelas a Corrientes, cada vez más cortas hacia la Diagonal
    for (let f = 0; f < 5; f++) {
      const x = 3.6 + f * 7.4, z0 = -12.6, z1 = (x < 8.1 ? 33 : 35 - (x - 8.1) * 1.326) - 2.6;
      for (let i = 0, z = z0; z < z1; i++, z += 2.55) {
        if ((i * 7 + f * 3) % 6 === 0) continue;
        T.caja(4.3, 1.1, 1.7, x, 0.3, z, PINTADO, NEGRO); T.caja(2, 0.62, 1.5, x - 0.25, 1.4, z, PINTADO, NEGRO);
      }
    }
    // el galpón bajo, contra el Broadway: paredes claras y techo de chapa con su lucarna corrida
    T.caja(32.4, 5.2, 15.6, 16.6, 0, -23.4, PIEDRA, { tono: c.GRIS }); T.caja(32.8, 0.3, 16, 16.6, 5.2, -23.4, PINTADO, CHAPA); T.caja(22, 1.1, 4.2, 16.6, 5.5, -23.4, PINTADO, CHAPA);
  }

  // ------------------------------------------------- las dos bocas del último tramo de la Diagonal Norte (1940)
  { // El tramo de Cerrito a Lavalle lo abre tools/crece.mjs («obra tardía»: el suelo, la calzada y las veredas). Pero
    // la calzada nueva no entra en la lámina de las calles donde toca una calle que ya estaba —ahí la lámina guarda
    // una sola fecha para todas las etapas, y Cerrito, Lavalle y Libertad cambiarían antes de 1940—: esas dos bocas
    // quedarían cruzadas por la vereda de la calle vieja. Van pintadas acá, con un paño de asfalto que nace en 1940.
    // (Los puntos, sobre el eje de la avenida: t a lo largo, desde Carlos Pellegrini; s hacia el nordeste; en
    // píxeles del plano. La calzada tiene 17 a cada lado.)
    const BOCA = { y: 0.07, claro: 1 }; // (en tinta, del color del papel: como el resto de la calzada)
    const T = c.lugar(11300, 8200), DN = (t, s) => T.deMundo(11150 + 0.5915 * t + 0.8063 * s, 8440 - 0.8063 * t + 0.5915 * s), en = (px, py) => T.deMundo(px, py);
    T.tapete([DN(183.6, 16.4), DN(228.6, 16.4), DN(228.6, -16.4), DN(158.7, -16.4)], PINTA.ASFALTO, BOCA); // la de Cerrito
    T.tapete([DN(342, 16.4), en(11401, 8147), en(11401, 8094), en(11361, 8094), DN(342, -16.4)], PINTA.ASFALTO, BOCA); // la de Lavalle y Libertad
  }
}
