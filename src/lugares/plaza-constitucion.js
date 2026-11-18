// La Plaza Constitución, época por época: del hueco de las carretas del Mercado del Sur a las dos islas de 1940. La
// estación vieja (1865) está en src/lugares/viejos-1867.js y la de 1887 en src/hitos.js; acá va solo la plaza.
//   · 1867 (etapa 0) — el mercado de carretas (funcionaba desde la década de 1850). Nada más que las carretas, sin
//     bueyes, formadas en hileras con el pértigo en el suelo, como en «Mercado de Constitución (Gonnet, 1864)» y
//     «Recuerdos de Buenos Ayres - 13 - Mercado de Constitución» (Esteban Gonnet, 1864) y en «Carretas frente a
//     estacion constitucion» (anónima, c. 1865). Cuántas eran y dónde paraba cada una no lo dice ninguna fuente: van
//     en el descampado que el plano deja libre. El suelo es el dibujo del plano y no se toca.
//   · 1888 (etapa 1) — el paseo a medio hacer. La mitad del este (del lado de la estación nueva) ya es jardín, con su
//     reja, su lago y su puente; la del oeste sigue siendo un campo pelado donde paran los carros; entre las dos, la
//     avenida que une la calle Hornos con Lima, con arbolitos recién plantados, y en la punta norte la «gruta» recién
//     terminada (las memorias municipales la dan por hecha entre 1885 y 1888). De «Plaza constitucion desde la gruta»
//     (anónima, antes de 1892: el jardín cercado, la avenida, el campo), «Plaza Constitucion - Buenos Aires» (Samuel
//     Boote), «Lago en plaza constitucion» y «Puente peatonal en plaza constitucion» (anónimas, c. 1890).
//   · 1895 (etapa 2) — la plaza entera (se abrió completa el 30 de octubre de 1892): canteros de bordes curvos «a la
//     inglesa» en todo el trapecio, como los dibuja el Plano Topográfico de 1895 (Oficina de Obras Públicas), la avenida
//     con sus bancos («Estación constitución II», década de 1890), el estanque al pie de la gruta («Gruta de Plaza
//     Constitución», E. C. Moody, c. 1890), los faroles a gas y los carros en fila sobre la calle Brasil («Buenos
//     Aires. Plaza Constitution», fotocromo de Photoglob, LCCN 2017656797).
//   · 1905 y 1910 (etapas 3 y 4) — lo mismo, ya sin agua (el lago estaba seco antes de 1900) y con los árboles
//     crecidos; palmeras junto a la gruta («Gruta plaza constitucion postal», 1905; «Gruta plaza constitucion 1910»).
//     Desde 1910, el monumento a Castelli (Gustav Eberlein, inaugurado en mayo de 1910): la forma, de la foto de hoy
//     («Juan J. Castelli, Gustav Eberlein 1»); el lugar es el que tiene en la foto aérea de 1940 (no hay vista de 1910
//     que lo ubique).
//   · 1921 (etapa 5) — sin la gruta (demolida en 1914) y con la avenida Garay cruzando la plaza en diagonal: quedan
//     dos islas, como en el plano de 1921 (el de 1909 todavía la muestra entera). Del interior hay una sola foto
//     («Plaza Constitucion (AGN, 1926)»: tierra, montículos de pasto y árboles grandes), así que van los canteros
//     viejos que quedaron dentro de cada isla, recortados, y los árboles que no tocó la avenida. Es una aproximación.
//   · 1940 (etapa 6) — la plaza rehecha después de la obra del subte (1933-34, que excavó casi todo el subsuelo): el
//     trazado está calcado de las «Fotografías aéreas de 1940» de la Ciudad de Buenos Aires, llevadas al marco del
//     plano. La isla del sur, de puntas redondas, con el Castelli en su cantero cuadrado y tres refugios sobre la
//     vereda de Brasil; la del norte, con sus senderos, un redondel de baldosas donde estuvo la gruta y, cerca de Lima
//     Oeste y Pavón, una zanja cercada que baja hacia el túnel (se la toma por la rampa del taller del subte: no hay
//     texto que lo confirme). De qué son el redondel y los refugios tampoco: van sencillos.
// Los textos: «Grutas, rocallas y árboles de cemento…» (Anales del Instituto de Arte Americano 44, 2014), para la
// gruta; «Excavaciones arqueológicas en Plaza Constitución» (Urbania 3, 2014), para la obra del subte; y los artículos
// de Wikipedia sobre la plaza, el barrio y la estación del subte.
// Las medidas: todo está escrito en píxeles del plano de 1867 (x al norte, y al río), leídos de la aérea de 1940 y de
// las esquinas del mapa de hoy; `p` los pasa a metros. La gruta va donde el plano de 1895 dibuja sus rocas, que es
// donde la aérea de 1940 muestra el redondel (± 15 m). Colores que faltan: la tierra apisonada es `LONA`, la rocalla
// de cemento es `BALASTO` y el granito oscuro del Castelli es `NEGRO`.
export default function (c) {
  const { THREE, PINTA, PIEDRA, TINTA, FOLLAJE, PINTADO, GRIS } = c;
  const OX = 7512, OY = 8112, M = 0.675, T = c.lugar(OX, OY, 1, 0);
  /** de píxeles del plano a metros del lugar (un punto, o una lista) */
  const p = (px, py) => [(px - OX) * M, (py - OY) * M], P = (pts) => pts.map(([a, b]) => p(a, b));
  /** las herramientas con el origen en un punto de la plaza (en metros): lo que se levanta se apoya en el terreno de ahí */
  const en = (x, z) => c.lugar(OX + x / M, OY + z / M, 1, 0);
  const N1 = 0.2, N2 = 0.42; // lo que va a ras: el piso de la plaza y, encima, el césped, los senderos y el cordón
  const AGUA = { alto: 0.58, tono: PINTA.AGUA, cordon: 0.5, claro: 0.58 };
  const MADERA = { pinta: [PINTA.MADERA, 0.45] }, CUERO = { pinta: [PINTA.LONA, 0.78] }, BLANCO = { pinta: [PINTA.BLANCO, 0.97] }, VERDE = { pinta: [PINTA.VERDE, 0.45] };
  const BRONCE = { pinta: [PINTA.PATINA, 0.3] }, GRANITO = { pinta: [PINTA.NEGRO, 0.32] }, ROCA = { pinta: [PINTA.BALASTO, 0.6] };

  // ------------------------------------------------------------------------------------------------ las formas
  const area = (pts) => { let a = 0; pts.forEach(([x, z], i) => { const [x1, z1] = pts[(i + 1) % pts.length]; a += x * z1 - x1 * z; }); return a / 2; };
  const mezcla = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  /** un polígono con las puntas redondeadas */
  const redondo = (pts, r = 3, n = 3) => pts.flatMap((b, i) => {
    const a = pts[(i + pts.length - 1) % pts.length], d = pts[(i + 1) % pts.length], la = Math.hypot(a[0] - b[0], a[1] - b[1]), ld = Math.hypot(d[0] - b[0], d[1] - b[1]);
    const q0 = mezcla(b, a, Math.min(r, la / 2) / la), q1 = mezcla(b, d, Math.min(r, ld / 2) / ld);
    return Array.from({ length: n + 1 }, (_, k) => { const t = k / n, u = 1 - t; return [u * u * q0[0] + 2 * u * t * b[0] + t * t * q1[0], u * u * q0[1] + 2 * u * t * b[1] + t * t * q1[1]]; });
  });
  /** lo que queda de un polígono dentro de un marco convexo */
  const recorta = (pts, marco) => {
    let out = pts; const s = area(marco) > 0 ? 1 : -1;
    for (let i = 0; i < marco.length && out.length; i++) {
      const a = marco[i], b = marco[(i + 1) % marco.length], lado = (q) => s * ((b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0])), antes = out; out = [];
      antes.forEach((q, k) => { const r = antes[(k + 1) % antes.length], dq = lado(q), dr = lado(r); if (dq >= 0) out.push(q); if (dq * dr < 0) out.push(mezcla(q, r, dq / (dq - dr))); });
    }
    return out;
  };
  const dentro = ([x, z], pts) => { let d = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, zi] = pts[i], [xj, zj] = pts[j]; if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) d = !d; } return d; };
  /** un paño con un agujero: el contorno y, cosido a él por el punto más cercano, el hueco recorrido al revés */
  const conHueco = (afuera, hueco) => {
    let m = [0, 0, Infinity];
    afuera.forEach((a, i) => hueco.forEach((b, j) => { const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (d < m[2]) m = [i, j, d]; }));
    const [i, j] = m, vuelta = [...hueco.slice(j), ...hueco.slice(0, j + 1)];
    if (area(afuera) * area(hueco) > 0) vuelta.reverse();
    return [...afuera.slice(0, i + 1), ...vuelta, ...afuera.slice(i)];
  };
  /** puntos cada `paso` metros a lo largo de un contorno, corridos `d` metros hacia adentro */
  const alBorde = (pts, paso, d) => {
    const q = c.adentro(pts, d), out = []; let t = paso / 2;
    q.forEach((a, i) => { const b = q[(i + 1) % q.length], largo = Math.hypot(b[0] - a[0], b[1] - a[1]); for (; t <= largo; t += paso) out.push(mezcla(a, b, t / largo)); t -= largo; });
    return out;
  };
  /** una mancha de césped de bordes blandos (centro y radios en píxeles del plano) */
  const mancha = (cx, cy, rx, ry, s, n = 14) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2, k = 1 + 0.11 * Math.sin(2 * a + s) + 0.07 * Math.sin(3 * a + 2.3 * s); return p(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k); });
  const azar = (s) => () => (s = (s * 16807 + 11) % 2147483647) / 2147483647;
  const cesped = (pts) => T.tapete(pts, PINTA.CESPED, { y: N2, claro: 0.74 });
  const cordon = (isla, ancho = 0.7) => T.tapete(conHueco(isla, c.adentro(isla, ancho)), PINTA.BALDOSA, { y: N2, claro: 0.97 });

  // ------------------------------------------------------------------------------------------------ los contornos
  // El hueco, de línea de edificación a línea de edificación (de la aérea de 1940): Lima Oeste, Brasil, la diagonal de
  // Lima Este y la calle Constitución.
  const HUECO = P([[7240, 7998], [7788, 7998], [7788, 8238], [7708, 8252], [7640, 8270], [7475, 8312], [7240, 8376]]);
  // La plaza entera (1885-1914): el trapecio de cordón a cordón.
  const VIEJA0 = P([[7270, 8036], [7758, 8044], [7758, 8216], [7270, 8322]]), VIEJA = redondo(VIEJA0, 10, 4);
  // Las dos islas que dejó la avenida Garay (los cordones de la aérea de 1940).
  const SUR0 = P([[7317, 8029], [7396, 8029], [7456, 8285], [7304, 8322]]), NOR0 = P([[7428, 8038], [7760, 8044], [7760, 8216], [7483, 8280]]);
  const SUR = redondo(SUR0, 12, 4), NOR = redondo(NOR0, 12, 4);
  const ISLAS5 = [c.adentro(SUR0, 5), c.adentro(NOR0, 5)], ISLAS2 = [c.adentro(SUR0, 2), c.adentro(NOR0, 2)];
  // La avenida del medio (1885-1914), de la boca de Hornos a la de Lima: su eje, y una banda a lo largo.
  const AV = (px) => 8102 + ((px - 7270) / 488) * 43;
  const banda = (d0, d1) => P([[7230, AV(7230) + d0], [7800, AV(7800) + d0], [7800, AV(7800) + d1], [7230, AV(7230) + d1]]);
  const A0 = p(7270, AV(7270)), A1 = p(7758, AV(7758)), LA = Math.hypot(A1[0] - A0[0], A1[1] - A0[1]), UA = [(A1[0] - A0[0]) / LA, (A1[1] - A0[1]) / LA];
  /** un punto de la avenida: a `t` metros de Brasil y `d` metros a la derecha (el este) del eje; y al revés, cuánto se aparta un punto del eje */
  const enAv = (t, d) => [A0[0] + UA[0] * t - UA[1] * d, A0[1] + UA[1] * t + UA[0] * d], delEje = ([x, z]) => (z - A0[1]) * UA[0] - (x - A0[0]) * UA[1];
  const GR = p(7648, 8096), CAS = p(7333.5, 8170); // la gruta · el Castelli
  const LAGO = redondo(P([[7325, 8172], [7337, 8170], [7343, 8182], [7341, 8198], [7336, 8210], [7339, 8224], [7344, 8238], [7340, 8250], [7328, 8252], [7322, 8240], [7326, 8226], [7328, 8212], [7323, 8198], [7320, 8183]]), 4, 1);

  // ------------------------------------------------------------------------------------------------ las piezas
  /** una carreta tucumana (la caja sobre dos ruedas altas, el toldo de cuero y el pértigo apoyado en el suelo) o, sin toldo, un carro */
  const carreta = (px, py, giro = 0, toldo = true) => {
    const L = c.lugar(px, py, Math.cos(giro), Math.sin(giro)), R = toldo ? 1.15 : 0.8, w = toldo ? 1.6 : 1.5, l = toldo ? 3.7 : 3.2;
    for (const s of [-1, 1]) L.put(new THREE.CylinderGeometry(R, R, 0.12, 7).rotateZ(Math.PI / 2).translate(s * (w / 2 + 0.12), R, 0), PINTADO, { H: 2 * R, ...MADERA });
    L.caja(w, toldo ? 0.45 : 0.7, l, 0, R - 0.1, 0, PINTADO, MADERA);
    L.put(new THREE.BoxGeometry(0.13, 0.13, Math.hypot(2.9, R)).rotateX(Math.atan2(R, 2.9)).translate(0, R / 2, l / 2 + 1.45), PINTADO, { H: R, ...MADERA });
    if (toldo) L.put(new THREE.CylinderGeometry(0.86, 0.86, l - 0.1, 6).rotateX(Math.PI / 2).translate(0, R + 0.72, 0), PINTADO, { H: R + 1.6, ...CUERO });
  };
  /** un farol: el poste de hierro y la linterna (los de gas, bajos; las columnas de después, más altas) */
  const farol = (x, z, h = 3.3) => { const L = en(x, z), k = h > 4 ? 0.5 : 0.36; L.put(new THREE.CylinderGeometry(0.05, h > 4 ? 0.11 : 0.08, h, 4, 1, true).translate(0, h / 2, 0), TINTA, { H: h }); L.caja(k, k * 1.3, k, 0, h, 0, PINTADO, BLANCO); };
  /** un banco de listones: `s` dice de qué lado queda el respaldo */
  const banco = (x, z, s) => { const L = en(x, z); L.caja(1.9, 0.08, 0.5, 0, 0.45, 0, PINTADO, VERDE); L.caja(1.9, 0.42, 0.07, 0, 0.5, s * 0.25, PINTADO, VERDE); };
  /** una reja baja a lo largo de un contorno, en tramos cortos (cada uno apoyado en su pedazo de terreno) */
  const reja = (pts, alto = 1.1) => pts.forEach((a, i) => {
    const b = pts[(i + 1) % pts.length], largo = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(largo / 34);
    for (let k = 0; k < n; k++) en(...mezcla(a, b, (k + 0.5) / n)).put(new THREE.BoxGeometry(largo / n, alto, 0.07).translate(0, alto / 2 + N1, 0).rotateY(-Math.atan2(b[1] - a[1], b[0] - a[0])), TINTA, { H: alto + N1 });
  });
  const palmera = (x, z, h = 6) => {
    const L = en(x, z);
    L.cilindro(0.3, h, 0, 0, 0, PINTADO, 5, 0.2, { pinta: [PINTA.MADERA, 0.42] });
    L.put(new THREE.SphereGeometry(3, 7, 3).scale(1, 0.4, 1).translate(0, h + 0.35, 0), FOLLAJE, { H: h + 1.5 }); L.put(new THREE.ConeGeometry(1.4, 1.5, 6).translate(0, h + 1.6, 0), FOLLAJE, { H: h + 2.4 });
  };
  const sobrevive = (q) => ISLAS2.some((isla) => dentro(q, isla));
  /** un árbol de la plaza vieja: nace en la etapa `d` y crece con los radios que se le pasen (el último vale hasta 1910);
   *  si en 1914 quedó dentro de una de las dos islas, sigue en 1921, más grande */
  const viejo = (x, z, d, rs) => {
    for (let e = d, i = 0; e < 5; i++) { const h = i >= rs.length - 1 ? 5 : e + 1; c.epoca(e, h); T.arbol(x, z, rs[Math.min(i, rs.length - 1)]); e = h; }
    if (sobrevive([x, z])) { c.epoca(5, 6); T.arbol(x, z, rs[rs.length - 1] + 0.9); }
  };
  /** un monte: n árboles repartidos dentro de un contorno */
  const monte = (pts, n, r, semilla, planta = (x, z) => T.arbol(x, z, r), libre = () => true) => {
    const az = azar(semilla), xs = pts.map((q) => q[0]), zs = pts.map((q) => q[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs), hechos = [];
    for (let k = 0; hechos.length < n && k < n * 30; k++) {
      const q = [x0 + az() * (x1 - x0), z0 + az() * (z1 - z0)];
      if (dentro(q, pts) && libre(q) && hechos.every((o) => Math.hypot(o[0] - q[0], o[1] - q[1]) > r * 1.25)) { hechos.push(q); planta(q[0], q[1]); }
    }
  };

  // ------------------------------------------------------------------------------------------- 1867: las carretas
  c.epoca(0, 1);
  for (const [px, py, n, paso, giro] of [[7322, 8052, 9, 5, 0], [7440, 8090, 10, 5, 0], [7650, 8060, 6, 5, 0], [7330, 8222, 4, 6, Math.PI]])
    for (let i = 0; i < n; i++) carreta(px + i * paso + Math.sin(i * 2.3) * 0.8, py + Math.cos(i * 1.7) * 2.5, giro + Math.sin(i * 3.1) * 0.12);

  // ------------------------------------------------------------------------------------- las calzadas y los pisos
  // En el suelo queda pintado el mercado de 1867: de 1888 en adelante la calzada va de pared a pared alrededor de la
  // plaza (adoquín, como en el fotocromo; lisa en 1940) y la plaza lleva su propio piso.
  c.epoca(1, 5); T.tapete(conHueco(HUECO, c.adentro(VIEJA, 0.4)), PINTA.ADOQUIN, { y: 0.06, claro: 0.9 });
  { // (desde que Garay cruza la plaza, el hueco se parte en dos por el eje de la avenida, con una isla en cada mitad)
    const HS = P([[7240, 7998], [7412, 7998], [7470, 8313.4], [7240, 8376]]), HN = P([[7412, 7998], [7788, 7998], [7788, 8238], [7708, 8252], [7640, 8270], [7475, 8312], [7470, 8313.4]]);
    for (const [d, h, tono, claro] of [[5, 6, PINTA.ADOQUIN, 0.9], [6, 0, PINTA.ASFALTO, 0.82]]) { c.epoca(d, h); T.tapete(conHueco(HS, c.adentro(SUR, 0.4)), tono, { y: 0.06, claro }); T.tapete(conHueco(HN, c.adentro(NOR, 0.4)), tono, { y: 0.06, claro }); }
  }
  // el piso de la plaza: granza (el fotocromo lo pinta rosado) y el cordón
  c.epoca(1, 5); T.tapete(VIEJA, PINTA.GRANZA, { y: N1, claro: 0.93 }); cordon(VIEJA);
  c.epoca(5); for (const isla of [SUR, NOR]) T.tapete(isla, PINTA.GRANZA, { y: N1, claro: 0.93 });
  c.epoca(5, 6); for (const isla of [SUR, NOR]) cordon(isla);
  // 1888: del lado del oeste, hasta la avenida, todavía es tierra
  c.epoca(1, 2); T.tapete(recorta(c.adentro(VIEJA, 0.9), banda(-400, 9.6)), PINTA.LONA, { y: N2, claro: 0.9 });
  // 1895-1910: la avenida, de tierra apisonada, de 13 m
  c.epoca(2, 5); T.tapete(recorta(c.adentro(VIEJA, 0.9), banda(-9.6, 9.6)), PINTA.LONA, { y: N2, claro: 0.95 });

  // ---------------------------------------------------------------------------- 1888-1921: los canteros «a la inglesa»
  // Las manchas del Plano Topográfico de 1895, llevadas al trapecio medido: [centro x, y, radios, desde qué etapa].
  // Las del este (la del lago primero) ya están en 1888; las del oeste, desde que se abrió la plaza entera.
  const MANCHAS = [
    [7336, 8207, 38, 60, 1], [7427, 8194, 45, 40, 1], [7290, 8284, 12, 22, 1], [7380, 8280, 23, 11, 1], [7436, 8269, 25, 10, 1], [7495, 8249, 25, 13, 1], [7517, 8166, 21, 26, 1],
    [7513, 8218, 18, 11, 1], [7584, 8222, 18, 22, 1], [7661, 8182, 50, 26, 1], [7641, 8224, 23, 10, 1], [7702, 8214, 20, 9, 1], [7738, 8182, 11, 23, 1], [7570, 8165, 17, 17, 1],
    [7299, 8069, 17, 16, 2], [7368, 8077, 30, 20, 2], [7442, 8059, 25, 11, 2], [7478, 8087, 28, 15, 2], [7537, 8065, 23, 13, 2], [7586, 8086, 18, 25, 2], [7642, 8094, 34, 22, 2], [7738, 8086, 11, 28, 2],
  ];
  /** donde no va un árbol: el lago, el pie del Castelli, la gruta y su estanque */
  const libre = (q) => !dentro(q, LAGO) && Math.hypot(q[0] - CAS[0], q[1] - CAS[1]) > 8 && !(Math.abs(q[0] - GR[0] + 4) < 24 && Math.abs(q[1] - GR[1]) < 9);
  MANCHAS.forEach(([cx, cy, rx, ry, d], k) => {
    const pts = mancha(cx, cy, rx * 1.08, ry * 1.08, k * 1.7, rx * ry > 700 ? 20 : 14), a = Math.abs(area(pts));
    // (1921: lo que quedó de cada cantero dentro de las islas)
    const restos = ISLAS5.map((isla) => recorta(pts, isla)).filter((r) => r.length > 2 && Math.abs(area(r)) > 90), entera = restos.length === 1 && Math.abs(area(restos[0])) > 0.97 * a;
    c.epoca(d, entera ? 6 : 5); cesped(pts);
    if (!entera) { c.epoca(5, 6); restos.forEach(cesped); }
    monte(pts, Math.max(1, Math.round(a / 300)), 3.4, k + 3, (x, z) => viejo(x, z, d, d === 1 ? [2.2, 3.1, 3.9, 4.4] : [2.1, 3.1, 3.8]), libre);
  });

  // ------------------------------------------------------------------------------------ 1888-1910: la plaza entera
  { // la avenida: dos hileras de árboles (palitos en 1888), los faroles y, desde 1895, los bancos
    for (let t = 9; t < LA - 5; t += 12) for (const s of [-1, 1]) viejo(...enAv(t, s * 8.3), 1, [1.3, 2.4, 3.4]);
    c.epoca(1, 5); for (let t = 20, s = 1; t < LA; t += 50, s = -s) farol(...enAv(t, s * 7.4));
    c.epoca(2, 5); for (let t = 32; t < LA - 20; t += 40) for (const s of [-1, 1]) banco(...enAv(t, s * 7), s);
    // los faroles del borde y, desde 1895, los arbolitos de la vereda (el fotocromo los muestra con sus tutores)
    c.epoca(1, 5); for (const q of alBorde(VIEJA, 52, 1.3)) if (Math.abs(delEje(q)) > 9) farol(...q);
    for (const q of alBorde(VIEJA, 13, 2.6)) if (Math.abs(delEje(q)) > 10) viejo(...q, 2, [1.8, 2.9]);
  }
  { // 1888: la reja del jardín del este, y los carros en la punta del campo, del lado de Brasil
    c.epoca(1, 2); reja(recorta(c.adentro(VIEJA0, 3), banda(11.5, 400)));
    for (let i = 0; i < 6; i++) carreta(7285 + Math.sin(i * 2.1) * 2, 8046 + i * 7, Math.PI / 2 + Math.sin(i * 1.3) * 0.15, false);
    // 1895-1905: los carros de alquiler en fila sobre Brasil, contra el cordón de la plaza (el fotocromo)
    c.epoca(2, 4); for (let i = 0; i < 6; i++) carreta(7263, 8050 + i * 9, Math.PI / 2 + 0.25 + Math.sin(i * 1.9) * 0.08, false);
  }
  { // el lago del jardín del este, con su puente de madera blanca, y el estanque al pie de la gruta: los dos, hasta
    // que se secaron (antes de 1900)
    c.epoca(1, 3); T.cantero(LAGO, AGUA); T.cantero(T.ovalo(GR[0] - 19.5, GR[1] + 1, 5.5, 4.2, 14), AGUA);
    const L = en(...p(7332.5, 8218));
    L.caja(10.5, 0.16, 1.7, 0, 0.95, 0, PINTADO, BLANCO); for (const s of [-1, 1]) L.caja(10.5, 0.75, 0.07, 0, 1.11, s * 0.82, PINTADO, BLANCO);
  }
  { // La gruta (1885-88, demolida en 1914): una montaña de rocalla de cemento de unos 25 m de largo y 19 de alto. En
    // las fotos, de una punta a la otra: un peñón con su torre almenada y las pasarelas que lo rodean; en el medio, el
    // «tanque roto» sobre columnas finas, arriba de la boca de la cueva; y otro torreón más bajo, con su pináculo.
    c.epoca(1, 5);
    const L = en(...GR);
    L.prisma([[-13, -2], [-10, -5.5], [-2, -6.5], [6, -5.5], [12, -4], [13.5, 1], [10.5, 5.5], [2, 6.5], [-7, 6], [-12.5, 3]], 2.4, 0, PINTADO, ROCA);
    L.prisma([[-10.5, -2.5], [-5, -4.6], [4.5, -4.2], [10.5, -2.8], [11, 2.6], [4, 4.6], [-5.5, 4.2], [-10.5, 1.8]], 3.8, 2.4, PINTADO, ROCA);
    L.prisma([[-5.5, -3], [5.5, -3.2], [6, 2.8], [-5.5, 3]], 4.3, 6.2, PINTADO, ROCA);
    L.prisma([[13, 3], [15.5, 2], [16, 5], [13.5, 6]], 1.2, 0, PINTADO, ROCA);
    L.vano(4.4, 5.4, 0, 0.5, -4.65, '-z');
    const almenas = (x, y, z, r) => { for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + 0.3; L.caja(0.6, 0.55, 0.6, x + Math.cos(a) * r, y, z + Math.sin(a) * r, PINTADO, ROCA); } };
    /** un torreón: el peñón que se afina hacia arriba, la ménsula que se abre y el tambor con sus almenas */
    const torre = (x, z, r, alto) => {
      L.cilindro(r, alto - 9.2, x, 6.2, z, PINTADO, 6, r * 0.66, ROCA); L.cilindro(r * 0.66, 0.9, x, alto - 3, z, PINTADO, 8, r * 0.9, ROCA);
      L.cilindro(r * 0.9, 1.5, x, alto - 2.1, z, PINTADO, 8, r * 0.9, ROCA); almenas(x, alto - 0.6, z, r * 0.7);
    };
    torre(8.5, 0.3, 2.5, 19); torre(-8.3, -0.2, 2.2, 16.6); L.cilindro(0.22, 2, -8.3, 16, -0.2, PINTADO, 5, 0.06, ROCA);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; L.cilindro(0.24, 5, Math.cos(a) * 1.5, 10.5, Math.sin(a) * 1.5, PINTADO, 5, 0.2, ROCA); }
    L.cilindro(1.9, 2.1, 0, 15.5, 0, PINTADO, 9, 2, ROCA); almenas(0, 17.6, 0, 1.6);
    // las pasarelas de hierro: dos alrededor del peñón, la escalera que sube y el puente colgante entre los torreones
    L.cilindro(2.9, 0.12, 8.5, 9.5, 0.3, TINTA, 8); L.cilindro(2.6, 0.12, 8.5, 13, 0.3, TINTA, 8);
    L.put(new THREE.BoxGeometry(0.9, 0.12, 9.3).rotateX(0.87).translate(11.3, 5.95, 2.6), TINTA, { H: 9.5 });
    L.caja(16, 0.12, 0.8, 0, 10.5, -3.6, TINTA); L.caja(16, 0.8, 0.05, 0, 10.62, -4, TINTA);
    // (las palmeras que tiene al lado en la postal de 1905)
    c.epoca(3, 5); palmera(GR[0] - 17, GR[1] - 7, 5.5); palmera(GR[0] + 19, GR[1] + 6, 6.2); palmera(GR[0] - 4, GR[1] + 10.5, 5);
  }

  // ------------------------------------------------------------------------------------------- 1910: el Castelli
  { // El monumento a Juan José Castelli, de Gustav Eberlein: las gradas, el pedestal de granito oscuro con una columna
    // en cada esquina, el bloque con el nombre y el bronce de pie, de unos 3,5 m. Sobre su cantero cuadrado.
    c.epoca(4);
    T.cantero(T.recto(9.5, 9.5, ...CAS, 1.2), { alto: 0.6 });
    const L = en(...CAS);
    L.caja(5.6, 1.15, 5.6, 0, 0, 0, PINTADO, GRANITO); L.caja(4.8, 0.35, 4.8, 0, 1.15, 0, PINTADO, GRANITO); L.caja(4, 0.35, 4, 0, 1.5, 0, PINTADO, GRANITO);
    L.caja(3, 0.5, 3, 0, 1.85, 0, PINTADO, GRANITO); L.caja(2.1, 2.6, 2.1, 0, 2.35, 0, PINTADO, GRANITO);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) L.cilindro(0.34, 2.6, sx * 1.15, 2.35, sz * 1.15, PINTADO, 6, 0.3, GRANITO);
    L.caja(3.1, 1.3, 3.1, 0, 4.95, 0, PINTADO, GRANITO); L.caja(1.6, 0.25, 1.4, 0, 6.25, 0, PINTADO, BRONCE);
    L.cilindro(0.7, 2.8, 0, 6.5, 0, PINTADO, 6, 0.32, BRONCE); L.put(new THREE.SphereGeometry(0.37, 6, 4).translate(0, 9.6, 0), PINTADO, { H: 10, ...BRONCE });
  }

  // ------------------------------------------------------------------------------------ 1921 y 1940: las dos islas
  c.epoca(5); for (const isla of [SUR, NOR]) for (const q of alBorde(isla, 48, 1.4)) farol(...q, 5.6);
  c.epoca(6);
  { // 1940, calcado de la foto aérea: la vereda de baldosas alrededor de cada isla, la explanada del Castelli, el
    // redondel de la isla norte y los canteros (cada uno con los árboles que se le cuentan en la foto).
    for (const isla of [SUR, NOR]) cordon(isla, 5);
    T.tapete(P([[7316, 8147], [7350, 8147], [7350, 8201], [7314, 8201]]), PINTA.BALDOSA, { y: N2, claro: 0.97 });
    T.tapete(T.ovalo(...p(7646, 8098), 10.5, 10.5, 20), PINTA.BALDOSA, { y: N2, claro: 0.97 });
    const CANTEROS = [ // [el contorno, en píxeles del plano · cuántos árboles · de qué radio]
      // la isla del sur
      [[[7327, 8037], [7389, 8037], [7399, 8081], [7327, 8081]], 7, 4.6], [[[7324, 8104], [7346, 8100], [7346, 8140], [7324, 8144]], 0, 0], [[[7354, 8088], [7400, 8088], [7407, 8118], [7356, 8094]], 1, 3],
      [[[7354, 8104], [7411, 8131], [7416, 8150], [7354, 8150]], 1, 3.4], [[[7354, 8156], [7417, 8156], [7440, 8258], [7400, 8268], [7354, 8250]], 15, 5], [[[7319, 8206], [7348, 8206], [7348, 8248], [7318, 8237]], 1, 4],
      [[[7320, 8249], [7356, 8263], [7352, 8284], [7330, 8290], [7318, 8280]], 2, 3.6], [[[7360, 8264], [7410, 8283], [7409, 8288], [7360, 8299]], 3, 3.4],
      // la isla del norte, de Garay hacia Constitución
      [[[7446, 8056], [7474, 8052], [7468, 8090], [7453, 8094]], 2, 3.8], [[[7482, 8052], [7532, 8052], [7526, 8094], [7476, 8094]], 4, 4.2], [[[7462, 8102], [7528, 8102], [7528, 8123], [7466, 8123]], 1, 3.2],
      [[[7534, 8102], [7562, 8102], [7562, 8117], [7534, 8117]], 0, 0], [[[7470, 8128], [7496, 8128], [7496, 8146], [7474, 8146]], 0, 0], [[[7502, 8128], [7530, 8128], [7530, 8144], [7502, 8144]], 0, 0],
      [[[7500, 8152], [7536, 8152], [7536, 8170], [7500, 8170]], 4, 4.2], [[[7474, 8158], [7496, 8158], [7496, 8172], [7478, 8172]], 2, 4], [[[7478, 8180], [7530, 8180], [7530, 8230], [7492, 8236], [7482, 8212]], 5, 4.6],
      [[[7536, 8180], [7556, 8180], [7556, 8236], [7536, 8240]], 6, 4.6], [[[7562, 8208], [7598, 8208], [7598, 8230], [7562, 8232]], 2, 3.8], [[[7578, 8052], [7628, 8052], [7628, 8090], [7578, 8090]], 7, 4.6],
      [[[7572, 8108], [7628, 8108], [7628, 8144], [7572, 8144]], 8, 4.8], [[[7600, 8176], [7640, 8176], [7640, 8192], [7600, 8192]], 2, 4], [[[7604, 8198], [7640, 8198], [7640, 8228], [7604, 8236]], 4, 4.4],
      [[[7648, 8160], [7688, 8160], [7688, 8182], [7648, 8182]], 1, 3.6], [[[7650, 8120], [7690, 8120], [7690, 8142], [7650, 8142]], 4, 4.4], [[[7648, 8190], [7690, 8190], [7690, 8222], [7648, 8230]], 5, 4.6],
      [[[7700, 8054], [7748, 8056], [7748, 8130], [7700, 8130]], 8, 5], [[[7700, 8150], [7748, 8150], [7748, 8205], [7700, 8215]], 7, 5],
    ];
    CANTEROS.forEach(([pts, n, r], k) => { const q = redondo(P(pts), 4, 2); cesped(q); if (n) monte(c.adentro(q, 1.5), n, r, 40 + k); });
    // (la hilera de la vereda de Lima Oeste y los árboles sueltos alrededor del redondel)
    for (let px = 7580; px < 7700; px += 17) T.arbol(...p(px, 8048), 3.6);
    for (const [px, py] of [[7664, 8082], [7668, 8108], [7634, 8116]]) T.arbol(...p(px, py), 4.2);
  }
  // los tres refugios de la vereda de Brasil, frente a la estación (en la aérea, tres techos blancos de 3 × 6 m)
  for (const [px, py] of [[7317, 8065], [7315.6, 8158], [7313, 8203]]) {
    const L = c.lugar(px, py, 1, 0);
    L.caja(3.2, 0.16, 6, 0, 2.5, 0, PINTADO, BLANCO); for (const sx of [-1, 1]) for (const sz of [-1, 1]) L.cilindro(0.07, 2.5, sx * 1.3, 0, sz * 2.6, TINTA, 4);
  }
  { // la zanja cercana a Lima Oeste y Pavón: 21 × 7,5 m, girada hacia la esquina, con su paredón alrededor y abierta
    // por la punta de la plaza (por donde bajaría la rampa)
    const L = c.lugar(7549, 8065, 20 / 32, -25 / 32), HORMIGON = { tono: GRIS };
    L.tapete(L.recto(21.6, 7.5), PINTA.NEGRO, { y: N2, claro: 0.3 });
    for (const s of [-1, 1]) L.caja(21.6, 1, 0.3, 0, 0, s * 3.75, PIEDRA, HORMIGON);
    L.caja(0.3, 2.2, 7.8, 10.8, 0, 0, PIEDRA, HORMIGON);
  }
  c.epoca(0);
}
