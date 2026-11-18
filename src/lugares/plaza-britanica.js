// La Plaza Británica (hoy Plaza Fuerza Aérea Argentina): la plaza de la Torre de los Ingleses, frente a la estación
// Retiro, y lo que la rodea. La torre está en src/lugares/retiro.js y la estación en src/hitos.js; acá va el suelo.
//   · Hasta 1905 (etapas 0 a 3) — la fábrica de gas (src/hitos.js). No se toca. En 1910 (etapa 4) hitos.js ya la da por
//     desarmada y queda su dibujo en el suelo: tampoco se toca (la compañía dejó el terreno recién en 1912; Wikipedia,
//     «Torre Monumental»).
//   · 1921 (etapa 5) — la plaza como se hizo para la inauguración de la torre (24 de mayo de 1916), a todo lo largo del
//     frente de la estación nueva. De la postal aérea de Bourquin y Kohlmann «Buenos Aires visto de un aeroplano,
//     Dársena Norte – Puerto Nuevo – Plaza Británica y parte de la Ciudad» (MG-017-0018, Wikimedia Commons; «antes de
//     1930»: por lo que falta del Puerto Nuevo, de la primera mitad de los años veinte): un rectángulo largo de puntas
//     redondeadas; en el medio, la explanada de la torre con un redondel de flores del lado de la calle San Martín; a
//     cada lado, tres franjas oscuras de canteros arbolados separadas por dos senderos claros; hacia el Paseo de
//     Julio, una plazoleta angosta y arbolada entre dos calzadas (la misma que dibuja el plano de Cannizzaro y Ludwig
//     de 1921, que ya la llama «Plaza Británica») y otra igual del lado del puerto, que en 1940 ya no está; del otro
//     lado de San Martín, los galpones del puerto. La postal no da para más: el dibujo de adentro de cada franja se
//     tomó de la foto de 1940 (las mismas hileras, con los árboles a medio crecer) y el parterre del medio va liso. De la foto de
//     la inauguración («Torre monumental inauguracion.jpg», 1916): los canteros bajos con su cordón, el piso claro de
//     tierra, los árboles recién plantados con tutor, un poste alto de alumbrado y, detrás, los galpones.
//   · 1940 (etapa 6) — el trazado está calcado de las «Fotografías aéreas de 1940» de la Ciudad de Buenos Aires (el
//     mapa interactivo), llevadas al marco del plano: el contorno (unos 135 × 215 m, con las dos puntas del lado del
//     puerto muy redondeadas: en la del norte paraban los colectivos); la explanada de ocho lados con dos parterres
//     apuntados en el eje de la torre y cuatro canteritos curvos al pie de la plataforma; a cada lado, de la avenida a
//     la calle San Martín: un cantero de árboles grandes, una franja con dos hileras de árboles chicos, un parterre de
//     dibujo (el del lado de Alem con algo blanco en el medio, el otro con una palmera), otra franja con dos hileras
//     y otro cantero de árboles grandes; la vereda del contorno con su hilera; el refugio largo en la avenida de la
//     estación, y en Leandro N. Alem dos separadores angostos con árboles. Cada árbol va donde se lo ve en la foto.
//     De «Estacion retiro fcca 1937.jpg»: el adoquinado, las vías del tranvía frente a la estación, los tranvías y
//     los colectivos.
// Los nombres: Plaza Británica (así en el plano de 1921, en la postal y en la guía Peuser de 1936); la avenida de la
// estación era Maipú y hoy es Ramos Mejía (Wikipedia, «Estación Retiro Mitre»); el Paseo de Julio pasó a llamarse Leandro
// N. Alem (hacia 1919: no lo verifiqué). La plaza de hoy se rehízo por una ley del 4 de enero de 1945 y se llama Fuerza Aérea Argentina
// desde 1982 (Wikipedia). No encontré quién proyectó la de 1916.
// Lo supuesto (no sale de ninguna fuente): de qué era el piso (va de granza, con la vereda de piedra); los faroles y
// los bancos, y dónde está cada uno; que en 1921 hubiera un segundo redondel del lado de la estación (en la postal lo
// tapa la torre: va por simetría) y los canteritos del pie de la torre; qué es lo blanco del medio del parterre de
// Alem (va un copón sobre un pedestal) y si los cuatro canteritos de la torre no eran las fuentes de granito que
// menciona Wikipedia; el alto y el color de los galpones, que además van derechos (en la foto corren algo cruzados) y
// solo en su primera fila; el paredón; el color de los tranvías y de los colectivos, y cuántos había.
// Colores que faltan: el crema de los tranvías es LONA; el ladrillo de los galpones, el tono LADRILLO de las paredes.
// Todo en metros desde la torre, con su mismo rumbo: x hacia la estación (el noroeste), z hacia el puerto (el
// noreste). El lado de −z es el de Leandro N. Alem; el de −x, el de la calle San Martín y los galpones.
export default function (c) {
  const { THREE, PINTA, PIEDRA, TINTA, FOLLAJE, PINTADO, PIZARRA } = c;
  const UX = 0.62, UY = -0.7846, T = c.lugar(12962, 9571, UX, UY), RAD = Math.PI / 180;
  /** las herramientas con el origen en un punto de la plaza: lo que se levanta del suelo se apoya en el terreno de ahí */
  const en = (x, z) => c.lugar(...T.aPlano(x, z), UX, UY);
  /** lo mismo, girado: su x apunta hacia el ángulo `a` (0: a la estación; π/2: al puerto) */
  const girado = (x, z, a) => c.lugar(...T.aPlano(x, z), UX * Math.cos(a) - UY * Math.sin(a), UY * Math.cos(a) + UX * Math.sin(a));
  const BLANCO = { pinta: [PINTA.BLANCO, 0.97] }, LUZ = { pinta: [PINTA.BLANCO, 1] }, VERDE = { pinta: [PINTA.VERDE, 0.45] }, CREMA = { pinta: [PINTA.LONA, 0.85] };
  const TRONCO = { pinta: [PINTA.MADERA, 0.42] }, BARRO = { tono: c.LADRILLO };
  const NP = 0.24, PISO = NP + 0.07;                  // el alto del cordón de la plaza y de su piso
  const CESPED = { alto: 0.5 }, VEREDA = { alto: 0.2, tono: PINTA.BALDOSA, cordon: 0.3, claro: 0.97 };

  // ------------------------------------------------------------------------------------------------ las formas
  const mezcla = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const area = (pts) => { let a = 0; pts.forEach(([x, z], i) => { const [x1, z1] = pts[(i + 1) % pts.length]; a += x * z1 - x1 * z; }); return a / 2; };
  /** un polígono con las puntas redondeadas */
  const redondo = (pts, r = 3, n = 3) => pts.flatMap((b, i) => {
    const a = pts[(i + pts.length - 1) % pts.length], d = pts[(i + 1) % pts.length], la = Math.hypot(a[0] - b[0], a[1] - b[1]), ld = Math.hypot(d[0] - b[0], d[1] - b[1]);
    const q0 = mezcla(b, a, Math.min(r, la / 2) / la), q1 = mezcla(b, d, Math.min(r, ld / 2) / ld);
    return Array.from({ length: n + 1 }, (_, k) => { const t = k / n, u = 1 - t; return [u * u * q0[0] + 2 * u * t * b[0] + t * t * q1[0], u * u * q0[1] + 2 * u * t * b[1] + t * t * q1[1]]; });
  });
  /** los puntos de un arco de círculo, de a0 a a1 grados (0 mira a +x, 90 a +z) */
  const arco = (cx, cz, r, a0, a1, n = 5) => Array.from({ length: n + 1 }, (_, i) => { const a = (a0 + ((a1 - a0) * i) / n) * RAD; return [cx + Math.cos(a) * r, cz + Math.sin(a) * r]; });
  /** un paño con un agujero: el contorno y, cosido a él por el punto más cercano, el hueco recorrido al revés */
  const conHueco = (afuera, hueco) => {
    let m = [0, 0, Infinity];
    afuera.forEach((a, i) => hueco.forEach((b, j) => { const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (d < m[2]) m = [i, j, d]; }));
    const [i, j] = m, vuelta = [...hueco.slice(j), ...hueco.slice(0, j + 1)];
    if (area(afuera) * area(hueco) > 0) vuelta.reverse();
    return [...afuera.slice(0, i + 1), ...vuelta, ...afuera.slice(i)];
  };
  const flores = (pts, y = 0.8) => T.tapete(pts, PINTA.FLORES, { y, claro: 0.6 });
  /** una fila de valores de a hasta b, cada `paso` */
  const cada = (a, b, paso) => Array.from({ length: Math.floor((b - a) / paso + 1e-6) + 1 }, (_, i) => a + i * paso);

  // ------------------------------------------------------------------------------------------------ los contornos
  // La plaza, de cordón a cordón: de la calle San Martín (x = −72) a la avenida de la estación (x = 63) y de Leandro
  // N. Alem (z = −118) a la calle del lado del puerto (z = 97).
  const X0 = -72, X1 = 63, Z0 = -118, Z1 = 97;
  const PLAZA21 = redondo([[X0, Z0], [X1, Z0], [X1, Z1], [X0, Z1]], 12, 5);
  const PLAZA40 = [...arco(X0 + 10, Z0 + 10, 10, 180, 270), ...arco(X1 - 10, Z0 + 10, 10, 270, 360), [63, 58], [61, 66], [56, 74], [48, 82], [39, 89], [29, 94], [18, 96.5], [10, 97], [-42, 97], [-50, 95.5], [-58, 91], [-65, 84], [-70, 74], [-72, 64]];
  // El hueco entero, de pared a pared: del paredón de los galpones (x = −93,5) al frente de la estación (x = 111,6),
  // y de la hilera de casas del pie de la barranca, sobre Alem (las que levanta tools/crece.mjs: sus frentes están a
  // unos 152 m de la torre), a la calle que baja al puerto. En la postal de los años veinte hay edificios ahí; en la
  // foto de 1940 ya no —todo eso es explanada, y la calzada llega a los 160 m—, pero el visor las conserva.
  const HX0 = -93.5, HX1 = 111.6, HZ0 = -153, HZ1 = 112, HUECO = [[HX0, HZ0], [HX1, HZ0], [HX1, HZ1], [HX0, HZ1]];

  // ------------------------------------------------------------------------------------------------ las piezas
  /** una columna de hierro con un globo blanco */
  const globo = (x, z, h = 4.4) => { const L = en(x, z); L.cilindro(0.2, 0.9, 0, 0, 0, TINTA, 6, 0.12); L.cilindro(0.1, h - 0.9, 0, 0.9, 0, TINTA, 5, 0.06); L.put(new THREE.SphereGeometry(0.34, 6, 4).translate(0, h + 0.3, 0), PINTADO, { H: h + 0.6, ...LUZ }); };
  /** una farola de la calle: la columna alta, el brazo hacia `a` y la linterna colgada */
  const farola = (x, z, a = 0, h = 7.4) => { const L = girado(x, z, a); L.cilindro(0.22, 1.2, 0, 0, 0, TINTA, 6, 0.14); L.cilindro(0.12, h - 1.2, 0, 1.2, 0, TINTA, 5, 0.07); L.caja(1.5, 0.08, 0.08, 0.7, h - 0.1, 0, TINTA); L.caja(0.42, 0.5, 0.42, 1.4, h - 0.66, 0, PINTADO, LUZ); };
  /** un banco de listones, pintado de verde; mira hacia el ángulo `a` */
  const banco = (x, z, a) => { const L = girado(x, z, a); L.caja(0.5, 0.08, 1.9, 0, PISO + 0.42, 0, PINTADO, VERDE); L.caja(0.07, 0.45, 1.9, -0.26, PISO + 0.5, 0, PINTADO, VERDE); for (const s of [-0.8, 0.8]) L.caja(0.46, 0.42, 0.07, 0, PISO, s, TINTA); };
  const palmera = (x, z, h = 6) => {
    const L = en(x, z), r = 1.6 + h * 0.28;
    L.cilindro(0.3, h, 0, 0, 0, PINTADO, 5, 0.2, TRONCO);
    L.put(new THREE.SphereGeometry(r, 8, 4).scale(1, 0.36, 1).translate(0, h + 0.35, 0), FOLLAJE, { H: h + 1.6 }); L.put(new THREE.ConeGeometry(r * 0.45, 1.5, 6).translate(0, h + 1.6, 0), FOLLAJE, { H: h + 2.4 });
  };
  /** un tranvía eléctrico de dos ejes, con sus plataformas y el trole; a lo largo de la avenida */
  const tranvia = (x, z) => {
    const L = girado(x, z, Math.PI / 2);
    L.caja(8.4, 0.45, 1.9, 0, 0.3, 0, TINTA); L.caja(9.6, 0.95, 2.3, 0, 0.75, 0, PINTADO, CREMA); L.caja(9.4, 0.8, 2.2, 0, 1.7, 0, TINTA);
    L.caja(9.8, 0.2, 2.45, 0, 2.5, 0, PINTADO, CREMA); L.caja(6.4, 0.22, 1.2, 0, 2.7, 0, PINTADO, CREMA);
    L.put(new THREE.BoxGeometry(4.6, 0.07, 0.07).rotateZ(0.4).translate(-1.6, 3.8, 0), TINTA, { H: 4.8 });
  };
  /** un colectivo de los años treinta: el capó, la caja con su franja de color y el techo blanco */
  const colectivo = (x, z, a, o) => {
    const L = girado(x, z, a);
    L.caja(5, 1, 2.1, -0.6, 0.4, 0, PINTADO, o); L.caja(1.5, 0.75, 1.7, 2.6, 0.4, 0, PINTADO, o); L.caja(4.8, 0.62, 2.05, -0.6, 1.4, 0, TINTA); L.caja(5.1, 0.2, 2.15, -0.6, 2.02, 0, PINTADO, BLANCO);
  };
  /** una fila de galpones del puerto: n naves de ladrillo con techo a dos aguas, las cumbreras hacia la calle San Martín */
  const galpones = (x0, x1, z0, z1, n) => {
    const w = x1 - x0, d = (z1 - z0) / n, L = en((x0 + x1) / 2, (z0 + z1) / 2);
    for (let i = 0; i < n; i++) {
      const z = (i + 0.5) * d - (z1 - z0) / 2;
      L.caja(w, 6.4, d, 0, 0, z, PIEDRA, BARRO); L.tejado(w + 0.8, d, 3.1, 0, 6.4, z, 'x'); L.vano(4, 4.8, w / 2 + 0.06, 0, z, '+x', false); L.vano(1.6, 1.6, w / 2 + 0.06, 6.6, z, '+x');
    }
  };
  /** los dos rieles de una vía del tranvía, a lo largo de la avenida */
  const via = (x, z0, z1) => { for (const s of [-0.72, 0.72]) T.tapete([[x + s - 0.07, z0], [x + s + 0.07, z0], [x + s + 0.07, z1], [x + s - 0.07, z1]], PINTA.NEGRO, { y: 0.27, claro: 0.3 }); };
  /** un árbol de la plaza: el mismo lugar en 1921 (recién plantado) y en 1940 (el radio que se le mide en la foto aérea) */
  const arbol = (x, z, r, joven = Math.max(1.7, r * 0.55)) => { c.epoca(5, 6); T.arbol(x, z, joven); c.epoca(6); T.arbol(x, z, r); };

  // ============================================================================== las calzadas y las veredas
  // En el suelo queda pintado lo que haya (el dibujo de 1867, las calles de hoy): desde 1921 la calzada va de pared a
  // pared alrededor de la plaza, adoquinada como en la foto de 1937.
  c.epoca(5, 6); T.tapete(conHueco(HUECO, c.adentro(PLAZA21, 0.5)), PINTA.ADOQUIN, { y: 0.06, claro: 0.9 });
  c.epoca(6); T.tapete(conHueco(HUECO, c.adentro(PLAZA40, 0.5)), PINTA.ADOQUIN, { y: 0.06, claro: 0.9 });
  c.epoca(5);
  T.cantero([[104.6, HZ0], [HX1 + 1, HZ0], [HX1 + 1, HZ1], [104.6, HZ1]], VEREDA);                 // la vereda de la estación
  T.cantero([[HX0 - 1, HZ0], [-87, HZ0], [-87, HZ1], [HX0 - 1, HZ1]], VEREDA);                     // la de los galpones
  T.cantero([[-62, HZ0 - 1.5], [72, HZ0 - 1.5], [72, -149.4], [-62, -149.4]], VEREDA);             // la de las casas de enfrente de Alem
  via(96.3, HZ0, HZ1); via(99.7, HZ0, HZ1);                                                        // las vías del tranvía, frente a la estación (la foto de 1937)
  for (const z of cada(-140, 100, 30)) farola(105.6, z, Math.PI);
  for (const z of cada(-100, 80, 36)) farola(-88, z, 0);
  // los tranvías parados frente a la estación
  c.epoca(5, 6); tranvia(99.7, -24); tranvia(96.3, 46);
  c.epoca(6); tranvia(99.7, -6); tranvia(99.7, 6.5); tranvia(96.3, 38);
  // 1940: el refugio largo de la avenida, del lado de la plaza, y los colectivos en la punta del norte
  T.cantero(T.recto(3, 150, 72, -20, 1.4), VEREDA);
  for (const z of cada(-80, 40, 40)) globo(72, z, 5);
  for (const [x, z, a, k] of [[60.5, 76, 2.5, 0], [57.5, 80.5, 2.5, 1], [51, 87, 2.4, 2], [39, 93.5, 2.05, 0], [67, -40, Math.PI / 2, 1], [67, 22, Math.PI / 2, 2], [-78, 30, -Math.PI / 2, 0]])
    colectivo(x, z, a, [{ pinta: [PINTA.ROJO, 0.45] }, VERDE, { pinta: [PINTA.OCRE, 0.6] }][k]);

  // Leandro N. Alem (el Paseo de Julio): en 1921, la plazoleta arbolada entre las dos calzadas; en 1940, los dos
  // separadores angostos, con sus hileras. (En la foto de 1940 el de afuera está a 143 m de la torre y la plazoleta
  // de los años veinte llegaba hasta los 146: acá van unos metros más cerca, para que quede calzada delante de las
  // casas del pie de la barranca.)
  c.epoca(5, 6); T.cantero(T.recto(118, 16, -7, -135, 7), CESPED);
  for (const z of [-139.5, -130.5]) for (const x of cada(-58, 45, 9.3)) T.arbol(x, z, 3.2);
  T.cantero(T.recto(112, 17, -5, 112, 7), CESPED);                                                 // (y la plazoleta del lado del puerto)
  for (const z of [108, 116]) for (const x of cada(-55, 44, 9)) T.arbol(x, z, 3);
  c.epoca(6);
  for (const z of [-140, -126]) { T.cantero(T.recto(88, 3.2, -21, z, 1.5), { alto: 0.22 }); for (const x of cada(-60, 17, 9.2)) T.arbol(x, z, 3.2); }
  for (const z of cada(-105, 57, 9)) T.arbol(-90.6, z, 2.6);                                       // la hilera de la vereda de los galpones

  // los galpones del puerto, del otro lado de la calle San Martín, y el paredón
  c.epoca(5);
  galpones(-150, -98, -112, -12, 8); galpones(-150, -98, -6, 54, 5);
  { const L = en(-94.3, -21); L.caja(0.5, 2.8, 182, 0, 0, 0, PIEDRA, BARRO); for (const z of cada(-91, 91, 13)) L.caja(0.8, 3.2, 0.8, 0, 0, z, PIEDRA, BARRO); }

  // =========================================================================================== la plaza: el piso
  // La vereda de piedra del contorno (el cordón, ancho) y adentro la granza.
  c.epoca(5, 6); T.cantero(PLAZA21, { alto: NP, tono: PINTA.GRANZA, cordon: 3.4, claro: 0.93 });
  c.epoca(6); T.cantero(PLAZA40, { alto: NP, tono: PINTA.GRANZA, cordon: 3.4, claro: 0.93 });

  // ------------------------------------------------------------------------------------------------ los canteros
  c.epoca(5);
  // los cuatro de las puntas, con los árboles grandes: cortados en chanfle hacia la explanada
  const AL = [[34, -104], [54, -104], [54, -21], [34, -33.5]], EL = [[-35, -104], [-35, -33], [-55, -21], [-61.5, -21], [-61.5, -104]];
  const AR = [[34, 31.5], [54, 15.5], [54, 56], [47, 70], [38, 79], [34, 81]], ER = [[-32.5, 32], [-55, 18.5], [-61.5, 18.5], [-61.5, 62], [-56, 76], [-46, 84], [-32.5, 86]];
  for (const P of [AL, EL, AR, ER]) T.cantero(redondo(P, 3), CESPED);
  // los dos parterres del medio de cada lado: de puntas entrantes (el del puerto, con la de afuera redonda como la plaza)
  const CL = [[10, -99], [10, -46], [3, -47.5], [-9, -47.5], [-16, -46], [-16, -99], [-9, -95.5], [3, -95.5]], CR = [[11.5, 41], [11.5, 84], [5, 87.5], [-4.5, 87.5], [-11, 84], [-11, 41], [-4.5, 44], [5, 44]];
  for (const P of [CL, CR]) T.cantero(redondo(P, 2, 2), CESPED);
  // y entre unos y otros, las cuatro franjas de las hileras
  for (const P of [T.recto(18.5, 58, 21.75, -75, 2), T.recto(14, 61, -25.5, -73.5, 2), T.recto(16.5, 53, 22.25, 59.5, 2), T.recto(14.5, 54, -20.75, 61, 2)]) T.cantero(P, CESPED);
  // los canteritos curvos al pie de la plataforma de la torre, uno en cada punta
  for (let k = 0; k < 4; k++) { const a = 22 + 90 * k; T.cantero([...arco(0, 0, 20.6, a, a + 46, 6), ...arco(0, 0, 17.2, a + 46, a, 6)], { alto: 0.5, cordon: 0.35 }); flores([...arco(0, 0, 19.8, a + 3, a + 43, 6), ...arco(0, 0, 18, a + 43, a + 3, 6)]); }

  // 1921: un óvalo de flores en cada parterre y los dos redondeles de la explanada, en el eje de la torre
  c.epoca(5, 6);
  flores(T.ovalo(-3, -72, 5.5, 14, 18)); flores(T.ovalo(0.2, 64, 5, 12, 18));
  for (const x of [41, -42]) { T.cantero(T.ovalo(x, 0, 8.5, 8.5, 22), CESPED); flores(T.ovalo(x, 0, 6.2, 6.2, 18)); T.cantero(T.ovalo(x, 0, 2, 2, 10), { alto: 0.86, cordon: 0 }); }

  // 1940: los parterres de dibujo y los dos parterres apuntados de la explanada
  c.epoca(6);
  for (const [x, z] of [[5, -85], [5, -55.5], [-10.5, -85.5], [-10.5, -55.5]]) flores(T.recto(6, 13, x, z, 1.2));
  for (const [x, z] of [[6.5, 52.5], [6.5, 74.5], [-6.2, 52.5], [-6.2, 74.5]]) flores(T.recto(5.5, 11.5, x, z, 1.2));
  { // (lo blanco del medio del parterre de Alem: un copón sobre su pedestal. Supuesto.)
    const L = en(-3, -70.5); L.caja(1.3, 0.9, 1.3, 0, 0.5, 0, PIEDRA, { tono: c.BLANCO }); L.cilindro(0.3, 0.5, 0, 1.4, 0, PINTADO, 8, 0.55, BLANCO); L.cilindro(0.55, 0.45, 0, 1.9, 0, PINTADO, 8, 0.8, BLANCO);
  }
  palmera(0.2, 63.5, 5.5); palmera(-56, 83, 6.5);
  for (const [xc, zc] of [[40, -1], [-43, 0]]) {
    const P = [[11.5, 0], [8.5, 5.2], [3.5, 7.5], [-3.5, 7.5], [-8.5, 5.2], [-11.5, 0], [-8.5, -5.2], [-3.5, -7.5], [3.5, -7.5], [8.5, -5.2]];
    T.cantero(P.map(([x, z]) => [xc + x, zc + z]), CESPED); flores(P.map(([x, z]) => [xc + x * 0.78, zc + z * 0.74]));
    T.cantero(T.ovalo(xc, zc, 3.2, 2.6, 12), { alto: 0.86, cordon: 0 }); en(xc, zc).put(new THREE.SphereGeometry(1.1, 6, 4).translate(0, 1.5, 0), FOLLAJE, { H: 2.6 });
  }

  // ------------------------------------------------------------------------------------------------ los árboles
  // Cada uno, donde lo muestra la foto aérea de 1940: [x, z, radio]. En 1921 van los mismos, recién plantados.
  // los grandes de los cuatro canteros de las puntas
  for (const [x, z, r] of [
    [45, -93, 5.5], [42, -80, 7], [48, -68, 5], [37, -58, 6], [47, -40, 6.5], [42, -32, 7.5], [48, -25, 4.5], [26, -102, 3], [33, -102, 3], [40, -102, 3], [47, -102, 3],
    [-46, -100, 4], [-38, -101, 3.5], [-54, -100, 4], [-48, -88, 6], [-50, -78, 7], [-55, -68, 6], [-42, -58, 5], [-55.5, -56, 4], [-50, -38, 8.5], [-50, -28, 6.5], [-57, -45, 5],
    [45, 20, 6.5], [44, 30, 7], [42, 37, 5.5], [50, 15, 4], [45, 62, 3], [40, 70, 4], [47, 48, 2], [51, 55, 2.2],
    [-42, 23, 7], [-45, 35, 8], [-55, 30, 5], [-57, 41, 5], [-47, 65, 8], [-45, 81, 4],
  ]) arbol(x, z, r);
  // las dos hileras de cada franja
  for (const z of cada(-98, -47, 7.3)) { arbol(22, z, 2.6, 1.7); arbol(15, z, 2.6, 1.7); }
  for (const z of cada(-97, -41, 7)) { if (z < -44) arbol(-22, z, 2.6, 1.7); arbol(-29.5, z, 2.6, 1.7); }
  for (const z of cada(40, 80, 6.6)) { arbol(25, z, 2.8, 1.7); arbol(18, z, 2.8, 1.7); }
  arbol(25, 33.4, 2.8, 1.7);
  for (const z of cada(36, 82.5, 6.6)) { if (z > 41) arbol(-17, z, 2.8, 1.7); arbol(-24, z, 2.8, 1.7); }
  // la hilera de la vereda: sobre Alem, sobre la avenida y sobre San Martín, y las del fondo de cada cantero
  for (const x of cada(-55, 40, 7.3)) arbol(x, -111.5, 2.2, 1.3);
  for (const z of cada(-96, -30, 6.3)) arbol(59, z, 1.6, 1.2);
  for (const z of [22, 28, 34, 44, 52]) arbol(59, z, 1.8, 1.2);
  for (const z of cada(-100, -26, 6.2)) arbol(-67, z, 2, 1.3);
  for (const z of cada(27, 67, 6.6)) arbol(-65.5, z, 2.2, 1.3);
  for (const z of [-97, -90, -83, -76]) arbol(-58.5, z, 2.5, 1.4);

  // ---------------------------------------------------------------------------------- los faroles y los bancos
  c.epoca(5);
  for (const [x, z] of [[33, -32], [33, 32], [-34, -32], [-34, 32], [14, -42.5], [-14, -42.5], [14, 40.5], [-14, 40.5], [57, -11], [57, 11], [-66, -11], [-66, 11]]) globo(x, z);
  for (const z of cada(-96, 48, 36)) { farola(61, z, 0); farola(-70, z, Math.PI); }
  for (const x of cada(-52, 44, 32)) farola(x, -116, -Math.PI / 2);
  for (const x of cada(-32, 4, 36)) farola(x, 95, Math.PI / 2);
  for (const x of [-22, -7, 7, 22]) { banco(x, -41.5, Math.PI / 2); banco(x, 39.5, -Math.PI / 2); }
  for (const z of [-9, 9]) { banco(29, z * 1.6, Math.PI); banco(-31, z * 1.6, 0); }
  c.epoca(0);
}
