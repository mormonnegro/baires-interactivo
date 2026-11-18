// Puerto Madero, alrededor de los diques: lo que había entre la ciudad y el agua, y entre el agua y la Costanera.
// (Los diques, los docks, los barcos, los elevadores y la Costanera Sur están en puerto.js; acá va lo demás.)
//   · 1895 (etapa 2): la tierra recién ganada: terraplén. (La Plaza Colón y el Parque Colón, detrás de la Casa de
//     Gobierno, están en plaza-colon.js, en todas las etapas.)
//   · 1905 (etapa 3): las vías del puerto —el plano de Ludwig las dibuja en lazo alrededor de cada dique, cruzando por
//     los puentes giratorios—, con sus vagones; del lado del río, el embarcadero de
//     animales en pie junto al Dique 1 (la tira rayada del plano) y el depósito en T del Dique 2.
//   · 1910 (etapa 4): la Aduana (Lanús y Hary, 1910), en Azopardo y Belgrano, y los primeros depósitos y barracas de
//     las manzanas nuevas entre Paseo Colón y la avenida del puerto (hoy Huergo); los jardines de la barranca.
//   · 1921 (etapa 5): lo que dibuja el plano de Cannizzaro: la playa de maniobras del oeste con todas sus vías, la
//     alameda de Huergo y Madero, las manzanas ya edificadas; del lado
//     del río, la segunda hilera de galpones del Dique 4, el molino y los silos del Dique 3 (los silos siguen en pie:
//     su planta sale de OpenStreetMap), el depósito grande del Dique 1, la playa de vías del sudeste con las dos
//     hileras de galpones largos de la calle Florencio Sánchez, y la Plaza Mazzini; al este de Alem, las manzanas
//     de Lavalle a Córdoba y los «Depósitos» que siguen hacia el Retiro.
//   · 1940 (etapa 6): las manzanas completas (algunas casas ya de varios pisos), los jardines entre las vías y la
//     Costanera que pinta el plano de Peuser de 1936 y la estación radiotelegráfica con sus antenas.
// De dónde sale cada cosa: los planos de 1895, 1905, 1921 y 1936 (fuentes/planos/), la carta del puerto de 1919-1920
// (fuentes/planos/1925-puerto.jpg) y, para lo que sigue en pie, OpenStreetMap. Las manzanas son las que quedan entre
// las calles que pinta el suelo. Qué hay en cada lote, los colores, las alturas, cuántos vagones y dónde, el dibujo de
// los canteros y la forma de cada edificio son supuestos (ver LEEME.md).
// Todo se mide en un solo marco: x a lo largo de los diques, hacia el norte; z hacia el río; el origen, en el agua del
// Dique 3. El murallón del oeste queda en z ≈ −68 y el del este en z ≈ 89.
export default function (c) {
  const { THREE, PINTA, PINTADO, PIEDRA, TINTA, PIZARRA, CASA } = c, M = 0.675, U = [0.99983, -0.0187], O = [9770, 10520];
  const P = (tono, claro = 0.5) => ({ pinta: [tono, claro] });
  const NEGRO = P(PINTA.NEGRO, 0.14), ROJO = P(PINTA.ROJO, 0.42), OXIDO = P(PINTA.LADRILLO, 0.6), LONA = P(PINTA.LONA, 0.9), MADERA = P(PINTA.MADERA, 0.5), CHAPA = P(PINTA.CHAPA, 0.8), OCRE = P(PINTA.OCRE, 0.7), LADRILLO = P(PINTA.LADRILLO, 0.74), BLANCO = P(PINTA.BLANCO, 0.96);
  let azar = 0.6131; const al = () => (azar = (azar * 9301 + 0.2113) % 1); // (siempre la misma tirada)
  const en = (px, py) => c.lugar(px, py, U[0], U[1]);
  const G = en(O[0], O[1]);
  /** de píxeles del plano a metros del marco */
  const g = (px, py) => [((px - O[0]) * U[0] + (py - O[1]) * U[1]) * M, (-(px - O[0]) * U[1] + (py - O[1]) * U[0]) * M];
  /** y de vuelta */
  const aPx = (x, z) => [O[0] + (x * U[0] - z * U[1]) / M, O[1] + (x * U[1] + z * U[0]) / M];

  // ------------------------------------------------------------------------------------------------ las líneas
  /** una quebrada con las esquinas redondeadas (de a cuartos, dos pasadas) y con un punto cada `paso` metros */
  const curva = (pts, pasadas = 3, paso = 12) => {
    for (let k = 0; k < pasadas; k++) { const o = [pts[0]]; for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1]; o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } o.push(pts[pts.length - 1]); pts = o; }
    const o = [pts[0]];
    for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1], d = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d < 0.5) continue; const n = Math.max(1, Math.ceil(d / paso)); for (let j = 1; j <= n; j++) o.push([a[0] + ((b[0] - a[0]) * j) / n, a[1] + ((b[1] - a[1]) * j) / n]); }
    return o;
  };
  /** la misma línea, corrida `d` metros a su derecha (hacia +z si va hacia +x) */
  const corrida = (pts, d) => pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [p[0] - ((b[1] - a[1]) / l) * d, p[1] + ((b[0] - a[0]) / l) * d]; });
  /** una tira a ras del suelo a lo largo de una línea: un paño por tramo (y, si es ancha, en fajas de hasta 12 m), para
   *  que siga el terreno. (No va con `tapete`: un polígono tan largo y tan flaco se triangula con lados de cientos de
   *  metros, y al partirlos salen millones de triángulos.) */
  const tira = (pts, ancho, tono, y, claro) => {
    const fajas = Math.max(1, Math.ceil(ancho / 12)), v = [];
    for (let f = 0; f < fajas; f++) {
      const A = corrida(pts, -ancho / 2 + (ancho * f) / fajas), B = corrida(pts, -ancho / 2 + (ancho * (f + 1)) / fajas);
      for (let i = 0; i + 1 < pts.length; i++) v.push(A[i][0], y, A[i][1], B[i][0], y, B[i][1], B[i + 1][0], y, B[i + 1][1], A[i][0], y, A[i][1], B[i + 1][0], y, B[i + 1][1], A[i + 1][0], y, A[i + 1][1]);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); geo.computeVertexNormals();
    G.put(geo, PINTADO, { pinta: [tono, claro], raso: true });
  };
  /** una vía: los dos rieles (trocha ancha) y, si no va sobre una playa ya balastada, su cama de piedra */
  const via = (pts, cama = true) => { if (cama) tira(pts, 3, PINTA.BALASTO, 0.1, 0.7); for (const s of [-1, 1]) tira(corrida(pts, s * 0.84), 0.3, PINTA.NEGRO, 0.31, 0.2); };
  const recta = (x0, z0, x1, z1) => curva([[x0, z0], [x1, z1]], 0);

  // ------------------------------------------------------------------------------------------------ los vagones
  /** un corte de `n` vagones sobre el tramo de A a B, empezando a `s` metros de A; con `loco`, la pava de maniobras
   *  en la punta. Cubiertos (de madera, pintados de colorado óxido o de gris), de bordes (con su carga) y chatas. */
  const corte = (A, B, s, n, loco = false) => {
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]), ux = (B[0] - A[0]) / L, uz = (B[1] - A[1]) / L, a = -Math.atan2(uz, ux), PASO = 9.6;
    const pone = (geo, t, y, kind, o) => G.put(geo.rotateY(a).translate(A[0] + ux * t, y, A[1] + uz * t), kind, o);
    n = Math.min(n, Math.floor((L - s) / PASO)); if (n < 1) return;
    pone(new THREE.BoxGeometry(n * PASO - 1, 0.5, 2.3), s + (n * PASO) / 2, 0.6, TINTA); // (los bastidores y las ruedas, de un saque)
    for (let i = 0; i < n; i++) {
      const t = s + (i + 0.5) * PASO, r = al();
      if (loco && i === 0) { // la locomotora: la caldera, la cabina, la chimenea y el domo
        pone(new THREE.CylinderGeometry(1.05, 1.05, 5.2, 8).rotateZ(Math.PI / 2).translate(0.9, 0, 0), t, 2.15, PINTADO, NEGRO); pone(new THREE.BoxGeometry(2.3, 2.9, 2.7).translate(-2.6, 0, 0), t, 2.3, PINTADO, NEGRO);
        pone(new THREE.CylinderGeometry(0.34, 0.26, 1.3, 6).translate(2.7, 0, 0), t, 3.8, TINTA); pone(new THREE.BoxGeometry(2.7, 0.14, 3).translate(-2.6, 0, 0), t, 3.82, TINTA);
      } else if (r < 0.56) { pone(new THREE.BoxGeometry(8.5, 2.6, 2.8), t, 2.15, PINTADO, r < 0.3 ? OXIDO : r < 0.44 ? MADERA : CHAPA); pone(new THREE.BoxGeometry(8.7, 0.16, 3), t, 3.53, TINTA); }
      else if (r < 0.86) { pone(new THREE.BoxGeometry(8.5, 1.15, 2.8), t, 1.42, PINTADO, P(PINTA.MADERA, 0.4)); pone(new THREE.BoxGeometry(7.8, 0.7, 2.3), t, 2.25, PINTADO, r < 0.7 ? LONA : OCRE); }
      else pone(new THREE.BoxGeometry(6.4, 1, 2.2), t, 1.35, PINTADO, MADERA); // (la chata, con cajones)
    }
  };
  /** cortes sueltos a lo largo de una vía derecha, de A a B: más o menos `cuanto` de la vía ocupada */
  const cortes = (A, B, cuanto = 0.3, loco = 0.25) => {
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]); let s = 8 + al() * 60;
    while (s < L - 40) { const n = 3 + Math.floor(al() * 9); if (al() < cuanto * 1.6) corte(A, B, s, n, al() < loco); s += n * 9.6 + 30 + al() * (60 / Math.max(0.1, cuanto)); }
  };

  // ------------------------------------------------------------------------------------------------ los edificios
  /** un techo a dos aguas pintado (chapa, o chapa con óxido), con la cumbrera a lo largo de x o de z */
  const dosAguas = (T, w, d, h, x, y, z, eje = 'x', o = CHAPA) => {
    const a = w / 2, b = d / 2, v = eje === 'x'
      ? [[-a, 0, b], [a, 0, b], [a, h, 0], [-a, 0, b], [a, h, 0], [-a, h, 0], [a, 0, -b], [-a, 0, -b], [-a, h, 0], [a, 0, -b], [-a, h, 0], [a, h, 0], [-a, 0, -b], [-a, 0, b], [-a, h, 0], [a, 0, b], [a, 0, -b], [a, h, 0]]
      : [[a, 0, b], [a, 0, -b], [0, h, -b], [a, 0, b], [0, h, -b], [0, h, b], [-a, 0, -b], [-a, 0, b], [0, h, b], [-a, 0, -b], [0, h, b], [0, h, -b], [-a, 0, b], [a, 0, b], [0, h, b], [a, 0, -b], [-a, 0, -b], [0, h, -b]];
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(v.flat(), 3)); geo.computeVertexNormals(); T.put(geo.translate(x, y, z), PINTADO, o);
  };
  /** un galpón: el cuerpo (de ladrillo, de chapa o de madera) y el techo a dos aguas; con `naves` > 1, en serrucho */
  const galpon = (T, w, h, d, x, z, { o = LADRILLO, techo = CHAPA, eje = 'x', naves = 1, puertas = true } = {}) => {
    T.caja(w, h, d, x, 0, z, PINTADO, o);
    for (let i = 0; i < naves; i++) { if (eje === 'x') dosAguas(T, w + 0.8, d / naves + 0.5, (d / naves) * 0.2, x, h, z - d / 2 + (i + 0.5) * (d / naves), 'x', techo); else dosAguas(T, w / naves + 0.5, d + 0.8, (w / naves) * 0.2, x - w / 2 + (i + 0.5) * (w / naves), h, z, 'z', techo); }
    if (puertas && eje === 'x' && w > 30) { const n = Math.max(2, Math.round(w / 26)); for (const s of [-1, 1]) T.fila(n, x - w / 2 + 4, x + w / 2 - 4, 3.6, Math.min(4.2, h - 1), 0, z + s * (d / 2 + 0.07), s < 0 ? '-z' : '+z', false); }
  };
  /** una grúa hidráulica de pórtico, como las de puerto.js; la pluma, hacia `lado` (±z) */
  const grua = (x, z, lado) => {
    for (const s of [-1, 1]) G.caja(0.34, 5.6, 3.8, x + s * 2, 0, z, TINTA);
    G.caja(4.6, 0.35, 4.2, x, 5.6, z, TINTA); G.caja(3, 2.7, 3, x, 5.95, z, PINTADO, CHAPA);
    G.put(new THREE.BoxGeometry(0.3, 13, 0.3).translate(0, 6.5, 0).rotateX(lado * 0.72).translate(x, 7.6, z + lado * 1.3), TINTA);
  };
  const TONOS = [c.LADRILLO, c.LADRILLO, c.CREMA, c.GRIS, c.BLANCO, c.LADRILLO, c.ROSA, c.CREMA];
  /** Una manzana de la tierra ganada (el rectángulo, en píxeles del plano): lotes sobre las cuatro calles, cada uno con
   *  su depósito, su barraca o su casa de altos, que se van levantando de `desde` en adelante; para 1940, algunos ya
   *  son edificios de varios pisos. `lleno`: cuánto de la manzana llega a edificarse. */
  const manzana = ([x0, y0, x1, y1], desde = 4, lleno = 1) => bloque(en((x0 + x1) / 2, (y0 + y1) / 2), (x1 - x0) * M - 3, (y1 - y0) * M - 3, desde, lleno); // (x: de sur a norte; z: de Paseo Colón al puerto)
  /** Lo mismo, con el marco ya puesto (para las manzanas que no van derechas): w a lo largo de su x, d a lo largo de su z. */
  const bloque = (T, w, d, desde, lleno) => {
    const filas = d >= 46 ? 2 : 1, fondo = filas === 2 ? d / 2 - (al() < 0.5 ? 0 : 3) : d, n = Math.max(1, Math.round(w / (17 + al() * 10)));
    for (let f = 0; f < filas; f++) for (let i = 0; i < n; i++) {
      if (al() > lleno) continue;
      const lw = w / n, x = -w / 2 + (i + 0.5) * lw, z = filas === 2 ? (f ? 1 : -1) * (d / 2 - fondo / 2) : 0, r = al();
      const e = Math.max(desde, r < 0.38 ? desde : r < 0.8 ? desde + 1 : 6), tono = TONOS[Math.floor(al() * TONOS.length)];
      if (e > 6) continue;
      const alto = (pisos, e0, e1) => { c.epoca(e0, e1); const h = pisos * 3.7 + 0.9; T.caja(lw - 0.15, h, fondo, x, 0, z, CASA, { floors: pisos, tono }); if (pisos > 4 && al() < 0.6) T.caja(lw * 0.5, 2.6, fondo * 0.4, x, h, z, PIEDRA, { tono }); };
      if (al() < 0.36) { c.epoca(e); galpon(T, lw - 0.15, 6.5 + al() * 3, fondo, x, z, { o: al() < 0.75 ? LADRILLO : OCRE, techo: al() < 0.4 ? OXIDO : CHAPA, eje: lw > fondo ? 'x' : 'z', puertas: false }); }
      else if (e < 6 && al() < 0.3) { alto(1 + Math.floor(al() * 3), e, 6); alto(5 + Math.floor(al() * 4), 6, 0); } // (el que en 1940 ya es otro)
      else alto(e >= 6 ? 3 + Math.floor(al() * 5) : 1 + Math.floor(al() * 4), e, 0);
    }
  };

  // =========================================================================================== el lado de la ciudad
  // --- la playa de maniobras, entre la avenida del puerto y la calle de los depósitos: el eje, en píxeles del plano ---
  const EJE = [[7880, 10296], [8700, 10279], [9770, 10260], [10780, 10247], [11280, 10243], [11720, 10228]].map(([x, y]) => g(x, y));
  const eje = curva(EJE, 0, 12);
  /** la z del eje de la playa a la altura x */
  const zEje = (x) => { for (let i = 0; i + 1 < EJE.length; i++) if (x <= EJE[i + 1][0] || i === EJE.length - 2) { const t = (x - EJE[i][0]) / (EJE[i + 1][0] - EJE[i][0]); return EJE[i][1] + t * (EJE[i + 1][1] - EJE[i][1]); } return 0; };
  const X0 = EJE[0][0], X1 = EJE[EJE.length - 1][0];
  // 1905: tres vías sobre su cama; 1921: la playa entera, balastada, con siete
  c.epoca(3, 5); tira(eje, 13.5, PINTA.BALASTO, 0.1, 0.7);
  c.epoca(5); tira(eje, 33, PINTA.BALASTO, 0.1, 0.7);
  c.epoca(3); for (const k of [-1, 0, 1]) via(corrida(eje, k * 4.8), false);
  c.epoca(5); for (const k of [-3, -2, 2, 3]) via(corrida(eje, k * 4.8), false);
  // los vagones de la playa: cortes sueltos en cada vía (más en las del medio)
  for (const [k, e, cuanto] of [[-1, 3, 0.3], [0, 3, 0.16], [1, 3, 0.34], [-3, 5, 0.3], [-2, 5, 0.4], [2, 5, 0.42], [3, 5, 0.3]]) {
    c.epoca(e);
    for (let x = X0 + 20; x < X1 - 140; x += 260) cortes([x, zEje(x) + k * 4.8], [x + 250, zEje(x + 250) + k * 4.8], cuanto, 0.18);
  }
  // la vía del muelle, entre las grúas y los docks, de punta a punta
  c.epoca(3); via(recta(-1310, -84, 1335, -84)); cortes([-1300, -84], [1330, -84], 0.2, 0.1);
  // --- la alameda de la avenida del puerto (Huergo y Madero): el cantero corrido y los árboles, del lado de las vías ---
  c.epoca(5);
  { const borde = corrida(eje, -22.5);
    tira(borde, 7, PINTA.CESPED, 0.12, 0.76);
    for (let i = 1; i < borde.length - 1; i++) { const [x, z] = borde[i]; if (Math.abs(((x + 4000) % 40) - 20) > 3) G.arbol(x, z + (i % 2 ? 1.6 : -1.6), 3.4 + (i % 3) * 0.3); } }

  // --- los lazos: de la playa del oeste, por cada puente giratorio, a las vías del este (el plano de 1905 ya los trae) ---
  const ZT1 = 147.5, ZT2 = 152, ZT3 = 198; // (las vías corridas del este; la tercera, la de afuera, es de 1921)
  const PUENTES = [[8687, 10557, 2], [9655, 10534, 2], [10787, 10513, 3], [11835, 10498, 1]].map(([px, py, lados]) => [g(px, py)[0], lados]);
  c.epoca(3);
  for (const [xb, lados] of PUENTES) for (const s of lados === 2 ? [-1, 1] : lados === 3 ? [-1, 1] : [-1]) {
    via(curva([[xb + s * 150, zEje(xb + s * 150) + 4.8], [xb + s * 78, zEje(xb + s * 78) + 4.8], [xb + s * 6, zEje(xb) + 10], [xb, -122], [xb, -6]], 3, 9));
    via(curva([[xb, 22], [xb, 104], [xb + s * 8, ZT1 - 8], [xb + s * 80, ZT1], [xb + s * 150, ZT1]], 3, 9));
  }

  // --- las manzanas nuevas, entre Paseo Colón y la avenida del puerto (los rectángulos libres, en píxeles del plano) ---
  // La fila de afuera (de Azopardo a Huergo) y lo que la fila de adentro tiene sobre tierra ganada: el plano de 1909
  // todavía las da sin edificar y el de 1921, edificadas.
  for (const R of [[7730, 10154, 7916, 10232], [7944, 10090, 8092, 10228], [8132, 10174, 8278, 10220], [8306, 10140, 8478, 10210], [8502, 10134, 8662, 10206], [8688, 10130, 8870, 10200], [8900, 10132, 9080, 10194], [9104, 10116, 9254, 10190], [9278, 10112, 9448, 10184], [9474, 10106, 9650, 10182]]) manzana(R, 4);
  for (const R of [[8306, 10072, 8476, 10108], [8500, 10050, 8660, 10104], [8684, 10020, 8868, 10100], [8960, 10034, 9078, 10094], [8900, 9976, 8998, 10030], [9102, 9984, 9252, 10090], [9294, 9966, 9418, 10084], [9472, 9944, 9650, 10072]]) manzana(R, 4, 0.9);
  // (La manzana de enfrente de la Aduana, de Belgrano a Moreno, no va: en el plano de 1921 es verde y en la foto aérea
  // de 1940, una plaza arbolada. La arma plaza-colon.js. Acá se reponen las dos tiradas —la de los lotes y la de los
  // colores— como quedaban después de lotearla, para no cambiarles nada a las manzanas y a los lugares que siguen.)
  azar = 0.7701048752087445; c.tirada = 0.41173640941790435;
  // (al norte del parque, sobre Madero: lo que el Peuser raya de rosa. La manzana de detrás del Correo la corta la
  // avenida Rosales: la arma plaza-colon.js; las tiradas, como arriba)
  azar = 0.19783001424912072; c.tirada = 0.7182511535078726;
  manzana([11506, 10074, 11566, 10132], 5); manzana([11808, 10114, 11882, 10232], 5, 0.8);

  // --- la Aduana (Eduardo Lanús y Pablo Hary, 1910): Azopardo entre Belgrano y Moreno. El cuerpo de cuatro pisos con
  //     su mansarda, las dos torres con cúpula sobre Azopardo y el hemiciclo que mira al puerto ---
  c.epoca(4);
  { const T = en(9761, 10134), SI = { tono: c.SILLAR }; // (x: de sur a norte; z: hacia el puerto)
    T.caja(92, 18.5, 40, 0, 0, -4, CASA, { floors: 4, ...SI }); T.caja(93, 0.7, 41, 0, 18.5, -4, PIEDRA, SI); T.mansarda(90, 38, 4.2, 0, 19.2, -4, 5);
    T.cilindro(15, 18.5, 0, 0, 14, CASA, 18, 15, { floors: 4, ...SI }); T.cilindro(15.5, 0.7, 0, 18.5, 14, PIEDRA, 18, 15.5, SI); T.cupula(13, 0, 19.2, 14, 0.35);
    for (const s of [-1, 1]) { T.caja(9.5, 27, 9.5, s * 24, 0, -22, CASA, { floors: 6, ...SI }); T.caja(10.3, 0.6, 10.3, s * 24, 27, -22, PIEDRA, SI); T.cupula(5, s * 24, 27.6, -22, 1.25); T.cilindro(0.5, 3, s * 24, 33.6, -22, TINTA, 5, 0.1); }
    T.caja(30, 22, 6, 0, 0, -24.5, CASA, { floors: 4, ...SI }); T.fila(3, -9, 9, 3.4, 7, 0, -27.56, '-z');
  }

  // --- el Parque Colón, la Plaza Colón, las plazoletas de la avenida Rosales y la obra del Ministerio de Guerra están
  //     en plaza-colon.js (con su tirada propia). Acá quedan las dos tiradas como estaban después de armarlos, para no
  //     cambiarles los lotes ni los colores a lo que sigue. ---
  const adentroDe = (pts, x, z) => { let d = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, zi] = pts[i], [xj, zj] = pts[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) d = !d; } return d; };
  azar = 0.9224372931575999; c.tirada = 0.7116347595586738;
  // la Plaza Mazzini (hoy Roma), frente a Lavalle
  c.epoca(5);
  { const [x0, z0] = g(11388, 9938), [x1, z1] = g(11550, 10040), xm = (x0 + x1) / 2, zm = (z0 + z1) / 2;
    G.cantero(G.recto(x1 - x0, z1 - z0, xm, zm, 5)); G.tapete(G.ovalo(xm, zm, 9, 9, 14), PINTA.GRANZA, { y: 0.56 });
    for (const [a, b] of [[1, 1], [1, -1]]) G.tapete([[xm - 48, zm - a * 30 * b - 1.6], [xm - 48, zm - a * 30 * b + 1.6], [xm + 48, zm + a * 30 * b + 1.6], [xm + 48, zm + a * 30 * b - 1.6]], PINTA.GRANZA, { y: 0.56 });
    T_estatua(xm, zm);
    for (let i = 0; i < 24; i++) { const x = x0 + 5 + al() * (x1 - x0 - 10), z = z0 + 5 + al() * (z1 - z0 - 10); if (Math.hypot(x - xm, z - zm) > 13 && Math.abs((z - zm) * 48 - (x - xm) * 30) > 220 && Math.abs((z - zm) * 48 + (x - xm) * 30) > 220) G.arbol(x, z, 3.2 + al()); } }
  /** (la estatua de Mazzini, de Monteverde, 1878: el pedestal y la figura de mármol) */
  function T_estatua(x, z) { G.caja(3, 2.6, 3, x, 0.3, z, PIEDRA, { tono: c.BLANCO }); G.cilindro(0.55, 2.6, x, 2.9, z, PIEDRA, 6, 0.4, { tono: c.BLANCO }); }

  // ============================================================================================== el lado del río
  // --- las vías corridas, detrás de los galpones del muelle, y la del muelle mismo ---
  c.epoca(3);
  via(recta(-1300, 98.2, 1335, 98.2)); via(recta(-1262, ZT1, 1385, ZT1)); cortes([-1290, 98.2], [1330, 98.2], 0.22, 0.1); cortes([-1250, ZT1], [1380, ZT1], 0.3, 0.2);
  for (const [x, lado] of [[-1210, -1], [-860, -1], [-560, -1], [-240, -1], [80, -1], [470, -1], [860, -1], [1240, -1], [-1010, -1], [640, -1], [1090, -1]]) grua(x + (al() - 0.5) * 24, 94.6, lado);
  c.epoca(5);
  via(recta(-1262, ZT2, 1385, ZT2)); cortes([-1250, ZT2], [1380, ZT2], 0.36, 0.2);
  // la de afuera: sale del lazo del puente del Dique 2 al 3, pasa entre los silos y el molino y sigue detrás de la
  // segunda hilera de galpones del Dique 4
  via(curva([[-150, ZT2], [-90, ZT2 + 4], [-30, ZT3 - 4], [40, ZT3], [1250, ZT3], [1320, ZT3 - 6], [1385, ZT2 + 2]], 3)); cortes([60, ZT3], [1240, ZT3], 0.3, 0.2);

  // --- el Dique 1: el embarcadero de animales en pie (la tira rayada del plano de 1905, rotulada en el de 1921): los
  //     corrales de tablas, las mangas hacia el muelle y los novillos; y, desde 1921, el depósito grande de más afuera ---
  c.epoca(3, 6);
  { const x0 = -1231, x1 = -912, z0 = 126, z1 = 144, n = 16, paso = (x1 - x0) / n, POSTE = P(PINTA.MADERA, 0.42);
    G.tapete([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], PINTA.BALASTO, { y: 0.1, claro: 0.8 });
    for (const z of [z0, (z0 + z1) / 2, z1]) for (const y of [0.7, 1.35]) G.caja(x1 - x0, 0.12, 0.12, (x0 + x1) / 2, y, z, PINTADO, POSTE);
    for (let i = 0; i <= n; i++) { for (const y of [0.7, 1.35]) G.caja(0.12, 0.12, z1 - z0, x0 + i * paso, y, (z0 + z1) / 2, PINTADO, POSTE); for (const z of [z0, (z0 + z1) / 2, z1]) G.caja(0.22, 1.6, 0.22, x0 + i * paso, 0, z, PINTADO, POSTE); }
    for (let i = 0; i < 70; i++) { const x = x0 + 2 + al() * (x1 - x0 - 4), z = z0 + 1.5 + al() * (z1 - z0 - 3), a = al() * Math.PI; G.put(new THREE.BoxGeometry(2.1, 1.05, 0.7).rotateY(a).translate(x, 0.95, z), PINTADO, al() < 0.5 ? P(PINTA.MADERA, 0.45) : al() < 0.5 ? NEGRO : P(PINTA.LONA, 0.85)); }
    for (const x of [-1150, -990]) { G.caja(3, 0.12, 22, x, 1.35, 115, PINTADO, POSTE); G.caja(0.12, 0.12, 22, x - 1.5, 0.7, 115, PINTADO, POSTE); G.caja(0.12, 0.12, 22, x + 1.5, 0.7, 115, PINTADO, POSTE); } // (las mangas)
    galpon(G, 26, 4.2, 8, x1 + 18, (z0 + z1) / 2, { o: MADERA, techo: OXIDO, puertas: false });
  }
  c.epoca(5);
  galpon(G, 118, 9.5, 62, -1121, 215, { o: LADRILLO, techo: CHAPA, eje: 'x', naves: 3 }); G.cilindro(1.5, 30, -1050, 0, 252, PIEDRA, 8, 0.9, { tono: c.LADRILLO });

  // --- el Dique 2: el depósito en T de más afuera (los planos de 1905 y de 1921 lo dibujan igual) ---
  c.epoca(3);
  { const x = -402, z = 178;
    G.caja(220, 11.5, 17, x, 0, z, CASA, { floors: 3, tono: c.LADRILLO }); dosAguas(G, 221, 18, 3.4, x, 11.5, z, 'x', CHAPA);
    G.caja(30, 11.5, 30, x + 8, 0, z + 23.5, CASA, { floors: 3, tono: c.LADRILLO }); dosAguas(G, 31, 31, 4.5, x + 8, 11.5, z + 23.5, 'z', CHAPA);
    G.cilindro(1.4, 27, x + 30, 0, z + 30, PIEDRA, 8, 0.85, { tono: c.LADRILLO });
  }
  c.epoca(5);
  galpon(G, 62, 6.5, 13, -356, 236, { o: MADERA, techo: OXIDO }); galpon(G, 50, 6, 12, -640, 166, { o: CHAPA, techo: CHAPA });

  // --- el Dique 3: los silos de Molinos Río de la Plata (siguen en pie, sobre Juana Manso: la planta sale del mapa de
  //     hoy), el depósito largo que les sigue hacia el sur y, más afuera, el molino que rotula el plano de 1921 ---
  c.epoca(5);
  { const [xs, zs] = g(10345, 10752), SILO = { tono: c.CREMA };
    for (let i = 0; i < 6; i++) G.cilindro(6.3, 29, xs - 31.5 + i * 12.6, 0, zs, PIEDRA, 12, 6.3, SILO);
    G.caja(76, 3.6, 6.4, xs, 29, zs, PINTADO, CHAPA); dosAguas(G, 77, 7.2, 1.6, xs, 32.6, zs, 'x', CHAPA);
    G.caja(9, 40, 9.5, xs - 43, 0, zs, CASA, { floors: 9, tono: c.CREMA }); dosAguas(G, 9.6, 10.2, 2.4, xs - 43, 40, zs, 'x', CHAPA);
    G.caja(214, 9, 15, 92, 0, zs, CASA, { floors: 2, tono: c.LADRILLO }); dosAguas(G, 215, 16, 3, 92, 9, zs, 'x', OXIDO);
    galpon(G, 50, 6.5, 13, 246, zs, { o: CHAPA });
    // el molino: el cuerpo de cinco pisos, la torre de la limpieza y la chimenea
    const xm = 280, zm = 224;
    G.caja(152, 20, 18, xm, 0, zm, CASA, { floors: 5, tono: c.LADRILLO }); G.caja(153, 0.6, 19, xm, 20, zm, PIEDRA, { tono: c.LADRILLO }); dosAguas(G, 152, 18, 3.6, xm, 20.6, zm, 'x', CHAPA);
    G.caja(13, 29, 13, xm - 52, 0, zm + 3, CASA, { floors: 7, tono: c.LADRILLO }); G.piramide(9.4, 5, xm - 52, 29, zm + 3);
    G.cilindro(1.8, 36, xm + 90, 0, zm + 4, PIEDRA, 10, 1, { tono: c.LADRILLO }); galpon(G, 40, 7, 16, xm + 110, zm - 2, { o: LADRILLO, techo: OXIDO });
  }

  // --- el Dique 4: la segunda hilera de galpones (el plano de 1921 dibuja dos hileras de a cuatro) ---
  for (const [a, b, o] of [[10887, 11031, LADRILLO], [11077, 11215, OCRE], [11375, 11515, LADRILLO], [11550, 11702, LADRILLO]]) galpon(G, (b - a) * M, 7.5, 18, g((a + b) / 2, 10700)[0], 174, { o, techo: o === OCRE ? OXIDO : CHAPA });

  // --- la playa del sudeste y los galpones largos de la calle Florencio Sánchez (los planos de 1921 y de 1936) ---
  { const Nw = g(8040, 11020), Ne = g(9560, 10990), q = (px, py) => g(px, py);
    const lineas = [
      [q(8005, 10990), Nw, q(8260, 10980), q(9380, 10978), Ne, q(9640, 10900), q(9700, 10760)],
      [Nw, q(8300, 11009), q(9400, 11009), Ne],
      [Nw, q(8260, 11036), q(9400, 11034), Ne],
      [Nw, q(8140, 11070), q(8300, 11109), q(9700, 11109), q(9900, 11085), q(10700, 10835), q(10900, 10810)],
      [q(8180, 11085), q(8330, 11190), q(9520, 11190), q(9640, 11150), q(9700, 11109)],
      [q(8240, 11140), q(8440, 11290), q(9540, 11290), q(9650, 11200), q(9700, 11109)],
    ];
    for (const L of lineas) via(curva(L, 3));
    for (const [a, b, cuanto] of [[q(8300, 10978), q(9360, 10978), 0.5], [q(8320, 11009), q(9380, 11009), 0.3], [q(8300, 11035), q(9380, 11034), 0.5], [q(8330, 11109), q(9680, 11109), 0.45], [q(8360, 11190), q(9500, 11190), 0.5], [q(8470, 11290), q(9520, 11290), 0.4]]) cortes(a, b, cuanto, 0.2);
    for (const [py, tramos] of [[11157, [[8281, 8600], [8765, 9203], [9250, 9560]]], [11243, [[8394, 8600], [8765, 9203], [9250, 9560]]]]) for (const [a, b] of tramos) {
      const T = en((a + b) / 2, py), w = (b - a) * M;
      T.caja(w, 1, 23, 0, 0, 0, PIEDRA, { tono: c.SILLAR }); // (el andén de carga)
      galpon({ ...T, caja: (ww, h, d, x, y, z, k, o) => T.caja(ww, h, d, x, y + 1, z, k, o), put: (geo, k, o) => T.put(geo.translate(0, 1, 0), k, o), fila: (n, x0, x1, vw, vh, y, f, cara, arco) => T.fila(n, x0, x1, vw, vh, y + 1, f, cara, arco) }, w, 7.2, 18, 0, 0, { o: al() < 0.6 ? LADRILLO : CHAPA, techo: al() < 0.35 ? OXIDO : CHAPA });
    }
  }
  // --- al sur, sobre la Dársena Sur: las reparticiones que rotula el plano de 1921 (el corralón municipal y el
  //     lazareto de animales del Ministerio de Agricultura). Las formas, supuestas. ---
  { const T = en(8040, 11150); galpon(T, 60, 6, 14, 0, -14, { o: LADRILLO, techo: OXIDO }); galpon(T, 40, 5.5, 12, -10, 10, { o: MADERA, techo: CHAPA }); T.caja(14, 7.6, 10, 30, 0, 12, CASA, { floors: 2, tono: c.CREMA }); }
  { const T = en(8250, 11470), POSTE = P(PINTA.MADERA, 0.42);
    for (let i = 0; i < 4; i++) galpon(T, 54, 5.4, 11, -105 + i * 70, -22, { o: i % 2 ? MADERA : LADRILLO, techo: i % 2 ? OXIDO : CHAPA });
    T.caja(22, 7.8, 12, -150, 0, 14, CASA, { floors: 2, tono: c.BLANCO }); T.cuatroAguas(23, 13, 3, -150, 7.8, 14);
    for (const z of [2, 16, 30]) for (const y of [0.7, 1.35]) T.caja(240, 0.12, 0.12, 10, y, z, PINTADO, POSTE);
    for (let i = 0; i <= 12; i++) for (const y of [0.7, 1.35]) T.caja(0.12, 0.12, 28, -110 + i * 20, y, 16, PINTADO, POSTE);
  }
  // 1940: la estación radiotelegráfica del plano de Peuser: la casa de los equipos y las tres antenas
  c.epoca(6);
  { const T = en(8330, 11380);
    T.caja(24, 7.6, 12, 0, 0, 0, CASA, { floors: 2, tono: c.BLANCO }); T.caja(25, 0.4, 13, 0, 7.6, 0, PIEDRA, { tono: c.BLANCO });
    for (const x of [-70, 0, 70]) { T.piramide(2.6, 56, x, 0, 26, TINTA, 4); T.cilindro(0.12, 6, x, 56, 26, TINTA, 4, 0.05); }
    for (const s of [-1, 1]) T.put(new THREE.BoxGeometry(70, 0.08, 0.08).translate(s * 35, 54, 26), TINTA);
  }
  // --- 1940: los jardines entre las vías y la Costanera, del Dique 3 hacia el norte (el verde del plano de Peuser) ---
  { const costa = (x, d) => g(8860 + (x * 0.9811 - d * 0.1934) / M, 11538 + (-x * 0.1934 - d * 0.9811) / M); // (x a lo largo de la rambla; d, tierra adentro)
    const J = [[-20, 412], [330, 318], [700, ZT3 + 17], [1290, ZT3 + 17], costa(1960, 96), costa(1500, 96), costa(1050, 96), costa(700, 110)];
    G.tapete(J, PINTA.CESPED, { y: 0.12, claro: 0.78 });
    const J2 = c.adentro(J, 9); for (let i = 0; i < 1500; i++) { const x = -20 + al() * 1330, z = 210 + al() * 280; if (adentroDe(J2, x, z) && al() < 0.7) G.arbol(x, z, 3 + al() * 1.8); }
  }
  // --- el bajo que ya era tierra en 1867: la alameda del Paseo Colón y la del Paseo de Julio. Con el puerto queda
  //     tierra adentro (tools/crece.mjs la da por urbanizada desde 1895) y se lotea como lo demás. Va al final, para no
  //     correrle la tirada a todo lo de arriba. ---
  // La mitad de adentro de la primera fila, de Paseo Colón a la orilla vieja (la otra mitad está más arriba): gris en
  // el plano de 1910, rosa en el de 1921.
  for (const R of [[7946, 9982, 8090, 10086], [8132, 9992, 8280, 10114], [8306, 9988, 8476, 10070], [8500, 9968, 8660, 10048], [8686, 9960, 8866, 10018], [9002, 9956, 9078, 10030], [8900, 10034, 8958, 10094], [9102, 9952, 9250, 9982]]) manzana(R, 4, 0.9);
  // Al este de Leandro N. Alem: la manzana de Corrientes a Lavalle (edificada ya en el plano de 1910) y las dos que
  // siguen a la Plaza Mazzini, hasta Córdoba (grises en 1910, rosas en 1921)…
  manzana([11202, 9944, 11350, 10048], 4, 0.9);
  for (const R of [[11582, 9934, 11740, 9998], [11582, 10000, 11672, 10046], [11762, 9906, 11914, 10040]]) manzana(R, 5, 0.9);
  // … y, de Córdoba hacia el Retiro, las de los «Depósitos» del plano de 1921, que el Peuser de 1936 raya en tres
  // manzanas: van torcidas, entre Alem y Madero. (El centro, en píxeles del plano; el largo y el fondo, en metros.)
  for (const [x, y, largo, fondo] of [[12015, 9940, 66, 94], [12128, 9909, 66, 98], [12240, 9909, 66, 70]]) bloque(c.lugar(x, y, 0.9654, -0.2607), largo - 3, fondo - 3, 5, 0.85);
  // Los jardines de la barranca, del lado de la ciudad del Paseo Colón, de Estados Unidos a Chile (verdes en los planos
  // de 1910, 1921 y 1936): dos canteros largos con su hilera de árboles, donde corría la vía del tren de la Boca.
  c.epoca(4);
  for (const [a, b] of [[8797, 8972], [8998, 9146]]) { const [x0, z0] = g(a, 9868), [x1, z1] = g(b, 9918), xm = (x0 + x1) / 2, zm = (z0 + z1) / 2;
    G.cantero(G.recto(x1 - x0, z1 - z0, xm, zm, 5)); G.tapete(G.recto(x1 - x0, 3, xm, zm), PINTA.GRANZA, { y: 0.56 });
    for (let x = x0 + 7; x < x1 - 5; x += 11) for (const s of [-1, 1]) G.arbol(x + al() * 2, zm + s * (z1 - z0) * 0.27, 3 + al()); }
  c.epoca(0);
}
