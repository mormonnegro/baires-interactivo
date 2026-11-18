// La Plaza de Mayo después de la Recova: de 1888 a 1940. En 1867 la plaza es la del plano (src/hitos.js: la Pirámide, la
// Recova Vieja que la parte en dos y los paraísos); acá va lo que vino después, cada trazado en su etapa:
//   · 1888 — la plaza recién unida. En mayo de 1884 Torcuato de Alvear hizo demoler la Recova (Buschiazzo dirigió la
//     obra) y quedó una sola plaza, con las palmeras traídas de Río de Janeiro en 1883, canteros de césped de puntas
//     redondas, las dos fuentes de hierro de 1870 con su reja de ocho lados y los faroles a gas. El Belgrano ecuestre
//     (1873) se subió a un pedestal nuevo, llegado de Génova en 1885, y desde 1886 está frente a la Casa de Gobierno,
//     mirando al norte. (Fotos: «Palmeras en plaza mayo 1885»; «Plaza Victoria y Catedral. 1890», de A. W. Boote y Cía.;
//     «Plaza de Mayo, fines del siglo XIX», del AGN, con la fuente frente al Cabildo. El dibujo de los canteros es
//     aproximado: no hay una vista de toda la plaza de esos años.)
//   · 1895 — el trazado de Carlos Thays, inaugurado con la Avenida de Mayo el 9 de julio de 1894: una cruz de granza
//     (la avenida que sigue hasta la Casa Rosada y la calle Defensa, ya cerrada), cuatro canteros en punta, una cuña
//     de césped detrás de la Pirámide y otra con el Belgrano, la fuente sobre un redondel blanco y, en el cruce, un
//     óvalo con un farol. Quedan las palmeras del lado sur y se plantan los plátanos. (Fotocromo «Buenos Aires. Plaza
//     Victoria I» y «II», Photoglob, c. 1895-1899; «Plaza de mayo y casa de gobierno 1890s».)
//   · 1905 y 1910 — el mismo trazado, redondeado: la fuente en el medio de tres anillos (blanco, césped, blanco), los
//     canteros que se curvan a su alrededor, la isleta de palmeras en el cruce y los senderos claros. En 1904 se
//     agregaron los estanques redondos con luces. (Sociedad Fotográfica Argentina de Aficionados, «Plaza 25 de Mayo»,
//     1900, dos vistas; «Plaza de Mayo 1904»; «Buenos aires 1910 (3)»; la postal nocturna del Centenario.)
//   · 1921 — la Pirámide en el centro: la corrieron 63,17 m hacia el este, sobre rieles, del 12 al 20 de noviembre de
//     1912, sin las cuatro estatuas del pedestal. En octubre de 1921 Eugenio Carrasco cambió los redondeles de los
//     costados por parterres rectangulares de broderie, de los que salen cuatro senderos hacia Bolívar y cuatro hacia
//     Balcarce. (Field Museum, «Plaza Mayo, showing Banco Nación, Pirámide…», 1924; postal «Plaza de Mayo ca. 1920»;
//     «Plaza de Mayo desde el arco de Casa Rosada».)
//   · 1940 — lo mismo con la obra de 1929: senderos de mosaico blanco, veredas de cinco metros, balasto rojo entre
//     los canteros y faroles de cinco luces en las esquinas; alrededor, las calzadas ya de asfalto. (Postal «Plaza de
//     mayo argentina», c. 1931; «Plaza mayo alumbrado público 1930»; AGN, 17 de octubre de 1945.)
// El lugar: el origen en la Pirámide de 1867, x al norte y z al río, derecho con las calles que rodean la plaza. Todo
// se mide desde ahí: el cruce con Defensa (y la Pirámide desde 1912) a 63,17 m, la fuente del este a otro tanto, el
// Belgrano a 149 m (su lugar de hoy en el mapa) y la Casa Rosada a 190.
export default function (c) {
  const { THREE } = c, P = c.PINTA, T = c.lugar(10344, 9484, 1, 0);
  const XK = 51, ZO = -55, ZE = 170;          // los cordones del paseo: de Rivadavia a Yrigoyen y de Bolívar a Balcarce
  const ZC = 63.17, ZF = 2 * ZC, ZB = 149.4;  // el cruce (y la Pirámide desde 1912) · la fuente del este · el Belgrano
  const N1 = 0.22, N2 = 0.42, CESPED = { alto: 0.58 }, N4 = 0.87; // las alturas de lo que va a ras: el piso, los senderos, el césped, lo que va encima
  const RAD = Math.PI / 180;

  // ------------------------------------------------------------------------------------------------ las formas
  const espX = (pts) => pts.map(([x, z]) => [-x, z]);
  const espZ = (pts, zc = ZC) => pts.map(([x, z]) => [x, 2 * zc - z]);
  /** los puntos de un arco: el ángulo 0 mira al norte (+x) y 90 al río (+z) */
  const arco = (cx, cz, r, a0, a1, n = 8) => Array.from({ length: n + 1 }, (_, i) => { const a = (a0 + ((a1 - a0) * i) / n) * RAD; return [cx + Math.cos(a) * r, cz + Math.sin(a) * r]; });
  /** un polígono con las puntas redondeadas */
  const redondo = (pts, r = 3, n = 3) => pts.flatMap((b, i) => {
    const a = pts[(i + pts.length - 1) % pts.length], d = pts[(i + 1) % pts.length], la = Math.hypot(a[0] - b[0], a[1] - b[1]), ld = Math.hypot(d[0] - b[0], d[1] - b[1]), ka = Math.min(r, la / 2) / la, kd = Math.min(r, ld / 2) / ld;
    const p = [b[0] + (a[0] - b[0]) * ka, b[1] + (a[1] - b[1]) * ka], q = [b[0] + (d[0] - b[0]) * kd, b[1] + (d[1] - b[1]) * kd];
    return Array.from({ length: n + 1 }, (_, k) => { const t = k / n, u = 1 - t; return [u * u * p[0] + 2 * u * t * b[0] + t * t * q[0], u * u * p[1] + 2 * u * t * b[1] + t * t * q[1]]; });
  });
  /** una cuña: lo que queda entre dos rumbos (a0 < a1) desde un centro, a partir de r0 y hasta el borde de una caja [x0, x1, z0, z1] */
  const cuña = (cx, cz, a0, a1, r0, caja) => {
    const [x0, x1, z0, z1] = caja, hasta = (a) => { const dx = Math.cos(a * RAD), dz = Math.sin(a * RAD); let t = 1e9; if (dx > 1e-9) t = Math.min(t, (x1 - cx) / dx); if (dx < -1e-9) t = Math.min(t, (x0 - cx) / dx); if (dz > 1e-9) t = Math.min(t, (z1 - cz) / dz); if (dz < -1e-9) t = Math.min(t, (z0 - cz) / dz); return [cx + dx * t, cz + dz * t]; };
    const esquinas = [[x0, z0], [x0, z1], [x1, z0], [x1, z1]].map(([x, z]) => { let a = Math.atan2(z - cz, x - cx) / RAD; while (a < a0) a += 360; return a; }).filter((a) => a > a0 + 0.5 && a < a1 - 0.5);
    return [...arco(cx, cz, r0, a0, a1, 4), ...[a1, ...esquinas.sort((p, q) => q - p), a0].map(hasta)];
  };
  const tira = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
  const cesped = (pts, o) => T.cantero(pts, { ...CESPED, ...o });
  const sendero = (pts, tono = P.BALDOSA, y = N2) => T.tapete(pts, tono, { y, claro: 0.96 });

  // ------------------------------------------------------------------------------------------------ las piezas
  const bronce = { pinta: [P.BRONCE, 0.3] }, hierro = c.TINTA, luz = { pinta: [P.BLANCO, 0.97] };
  /** una palmera: el tronco y una copa de hojas que caen. Las de Alvear, altas y finas; las Phoenix, bajas y anchas */
  const palmera = (x, z, h = 8, r = 2.5, rt = 0.2) => {
    T.put(new THREE.CylinderGeometry(rt * 0.75, rt, h, 5, 1, true).translate(x, h / 2, z), c.PINTADO, { pinta: [P.MADERA, 0.5], H: h });
    const n = 7, v = [], pt = (i) => { const a = (i * Math.PI) / n + x * 0.37 + z * 0.11, k = i % 2 ? 0.42 : 1; return [x + Math.cos(a) * r * k, h + (i % 2 ? r * 0.16 : -r * 0.34), z + Math.sin(a) * r * k]; };
    for (let i = 0; i < 2 * n; i++) v.push([x, h + r * 0.42, z], pt(i + 1), pt(i), [x, h - r * 0.05, z], pt(i), pt(i + 1));
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v.flat(), 3)); g.computeVertexNormals(); T.put(g, c.FOLLAJE, { H: h + r * 0.4 });
  };
  const poste = (x, z, h, r = 0.07) => T.put(new THREE.CylinderGeometry(r * 0.7, r, h, 4, 1, true).translate(x, h / 2, z), hierro, { H: h });
  /** un farol a gas: el poste de hierro y la linterna */
  const farol = (x, z, h = 3.2) => { poste(x, z, h); T.caja(0.36, 0.52, 0.36, x, h, z, c.PINTADO, luz); };
  /** un candelabro eléctrico: el poste alto, el travesaño y un globo en cada punta (los de las fotos de 1895 a 1912) */
  const candelabro = (x, z, h = 8.5, alo = 'x') => { poste(x, z, h, 0.13); T.caja(alo === 'x' ? 2.4 : 0.1, 0.1, alo === 'x' ? 0.1 : 2.4, x, h - 0.9, z, hierro); for (const s of [-1, 1]) T.caja(0.42, 0.5, 0.42, x + (alo === 'x' ? s * 1.2 : 0), h - 1.6, z + (alo === 'x' ? 0 : s * 1.2), c.PINTADO, luz); };
  /** una columna con un globo blanco (1900 en adelante) */
  const globo = (x, z, h = 3.6) => { poste(x, z, h, 0.09); T.caja(0.5, 0.5, 0.5, x, h, z, c.PINTADO, luz); };
  /** la farola de 1929: la columna labrada, la linterna grande arriba y cuatro (o dos) más chicas a los lados */
  const farola = (x, z, luces = 5) => { poste(x, z, 6.2, 0.16); T.caja(0.6, 0.75, 0.6, x, 6.2, z, c.PINTADO, luz); for (const [sx, sz] of luces === 5 ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : [[1, 0], [-1, 0]]) T.caja(0.36, 0.46, 0.36, x + sx * 0.75, 4.9, z + sz * 0.75, c.PINTADO, luz); };
  /** un banco de listones, con su respaldo: `a` son los grados que gira (0 mira al río, 90 al sur, -90 al norte) */
  const banco = (x, z, a = 0) => { const g = new THREE.BoxGeometry(1.9, 0.08, 0.5).translate(0, 0.45, 0), r = new THREE.BoxGeometry(1.9, 0.42, 0.07).translate(0, 0.72, -0.25); for (const q of [g, r]) T.put(q.rotateY(-a * RAD).translate(x, N1, z), c.PINTADO, { pinta: [P.VERDE, 0.45] }); };
  /** bancos a lo largo de un tramo, mirando hacia donde diga `mira` (grados) */
  const bancos = (n, x0, z0, x1, z1, mira) => { for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; banco(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, mira); } };
  /** una de las dos fuentes de hierro de 1870 (fundición del Val d'Osne): la pileta, el pie con sus figuras y dos platos */
  const fuente = (x, z, y = 0) => {
    T.cantero(T.ovalo(x, z, 4.6, 4.6, 16), { alto: y + 0.85, tono: P.AGUA, cordon: 0.5, claro: 0.6 });
    T.cilindro(1.25, 1.7, x, y + 0.5, z, c.PINTADO, 8, 0.8, bronce); T.cilindro(2.1, 0.22, x, y + 2.2, z, c.PINTADO, 10, 2.4, bronce);
    T.cilindro(0.45, 1.5, x, y + 2.42, z, c.PINTADO, 6, 0.32, bronce); T.cilindro(1.15, 0.18, x, y + 3.92, z, c.PINTADO, 8, 1.35, bronce); T.cilindro(0.22, 0.9, x, y + 4.1, z, c.PINTADO, 5, 0.05, bronce);
  };
  /** un estanque (los de 1904, redondos y con luces; los ovalados de los años 20 y 30), con su chorro */
  const estanque = (x, z, rx, rz = rx, alto = 0.88) => { T.cantero(T.ovalo(x, z, rx, rz, 16), { alto, tono: P.AGUA, cordon: 0.5, claro: 0.6 }); T.cilindro(0.3, 1.5, x, alto, z, c.PINTADO, 5, 0.03, luz); };
  /** un quiosco de los que había sobre la vereda de la plaza */
  const quiosco = (x, z) => { T.cilindro(1.3, 2.7, x, N1, z, c.PINTADO, 8, 1.3, { pinta: [P.VERDE, 0.5] }); T.cilindro(1.7, 1.2, x, N1 + 2.7, z, c.PIZARRA, 8, 0.15); };
  const hilera = (n, x0, z0, x1, z1, r) => { for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); T.arbol(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, r); } };
  const hileraDe = (hacer, n, x0, z0, x1, z1) => { for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); hacer(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t); } };

  // ------------------------------------------------------------------------------------- el piso y las calzadas
  // Las calzadas que rodean la plaza: empedradas hasta los años 20 (el adoquín de las fotos), de asfalto en 1940.
  for (const [desde, hasta, tono] of [[1, 6, P.ADOQUIN], [6, 0, P.ASFALTO]]) {
    c.epoca(desde, hasta);
    for (const t of [tira(-64, -XK + 1, -68, 186), tira(XK - 1, 62, -68, 186), tira(-XK, XK, -68, ZO + 1), tira(-XK, XK, ZE - 1, 186)]) T.tapete(t, tono, { y: 0.05, claro: 0.98 });
  }
  // El paseo: el cordón de piedra todo alrededor, con las esquinas redondas, y el piso de granza (polvo de ladrillo).
  c.epoca(1);
  const paseo = T.recto(2 * XK, ZE - ZO, 0, (ZE + ZO) / 2, 9);
  T.cantero(paseo, { alto: 0.15, tono: P.GRANZA, cordon: 0.5, claro: 0.92 });

  // ---------------------------------------------------------------------------- el Belgrano, frente a la Casa de Gobierno
  // Albert Carrier-Belleuse hizo al general y Manuel de Santa Coloma el caballo; se inauguró el 24 de septiembre de
  // 1873. El pedestal alto de granito y la reja son los de 1885; desde 1886 mira al norte (la cabeza hacia +x).
  {
    const y0 = 0.6, hp = 4.3, yb = y0 + 0.8 + hp + 0.35;
    T.caja(7.4, 0.4, 5.6, 0, y0, ZB); T.caja(6.2, 0.4, 4.4, 0, y0 + 0.4, ZB);
    T.caja(4.6, hp, 2.5, 0, y0 + 0.8, ZB); T.caja(5.1, 0.35, 3, 0, y0 + 0.8 + hp, ZB);
    const br = (w, h, d, x, y, z = 0) => T.caja(w, h, d, x, yb + y, ZB + z, c.PINTADO, bronce);
    br(4.2, 0.2, 1.6, 0, 0); br(2.7, 1, 0.9, 0, 1.3);                                   // la base y el cuerpo del caballo
    for (const [x, z] of [[-1.05, -0.3], [-1.05, 0.3], [0.85, 0.3]]) br(0.26, 1.2, 0.26, x, 0.2, z); br(0.26, 0.75, 0.26, 1.3, 0.65, -0.3); // tres patas apoyadas y una mano en alto
    T.put(new THREE.BoxGeometry(0.55, 1.5, 0.6).rotateZ(-0.6).translate(1.55, yb + 2.5, ZB), c.PINTADO, bronce); br(0.9, 0.42, 0.42, 2.25, 2.95); // el cuello y la cabeza
    br(0.2, 0.9, 0.2, -1.55, 1.25);                                                      // la cola
    br(0.62, 1.25, 0.72, -0.1, 2.3); br(0.4, 0.42, 0.4, -0.1, 3.55); br(0.5, 0.16, 0.5, -0.1, 3.97); // el general y el bicornio
    br(0.08, 3.3, 0.08, 0.5, 2.2, 0.45); br(1.25, 0.8, 0.05, -0.15, 4.6, 0.45);          // la bandera que levanta
    // la reja de 1885, de hierro y bronce, con sus pilares en las esquinas (se ve en las vistas de 1895 a 1910)
    c.epoca(1, 5);
    const rx = 5, rz = 4.1;
    for (const s of [-1, 1]) { T.caja(2 * rx, 0.09, 0.09, 0, y0 + 1.05, ZB + s * rz, hierro); T.caja(0.09, 0.09, 2 * rz, s * rx, y0 + 1.05, ZB, hierro); T.caja(2 * rx, 0.09, 0.09, 0, y0 + 0.5, ZB + s * rz, hierro); T.caja(0.09, 0.09, 2 * rz, s * rx, y0 + 0.5, ZB, hierro); for (const q of [-1, 1]) T.caja(0.3, 1.5, 0.3, s * rx, y0, ZB + q * rz, c.PIEDRA); }
    T.caja(2 * rx + 1.6, 0.6, 2 * rz + 1.6, 0, 0, ZB);
    // desde los años 20: sin reja, sobre un cantero de flores, y al lado el mástil de la bandera
    c.epoca(5);
    T.caja(8.4, 0.6, 6.6, 0, 0, ZB); T.cilindro(0.2, 27, 7.5, 0, ZB + 1, c.PINTADO, 5, 0.07, luz); T.caja(2.4, 1.3, 2.4, 7.5, 0, ZB + 1);
  }

  // =================================================================================================== 1888
  c.epoca(1, 2);
  {
    // el piso claro, de tierra apisonada, de las fotos de 1885 y 1890
    T.tapete(c.adentro(paseo, 0.7), P.LONA, { y: N2, claro: 0.94 });
    // los canteros de césped de puntas redondas, a los lados del eje: cuatro alrededor de la Pirámide y cuatro en lo
    // que había sido la Plaza 25 de Mayo. Entre unos y otros queda libre el paso de la calle Defensa (cerrada en 1890).
    for (const s of [-1, 1]) for (const [w, d, x, z] of [[31, 30, 29.5, -29], [31, 38, 29.5, 33], [31, 44, 29.5, 103], [27, 22, 31.5, 150]]) cesped(T.recto(w, d, s * x, z, 7));
    // las dos fuentes de hierro de 1870, al este y al oeste de la Pirámide, con su reja de ocho lados y un farol en cada ángulo
    for (const z of [-30, 40]) {
      fuente(0, z);
      T.put(new THREE.TorusGeometry(6.3, 0.05, 3, 8).rotateX(Math.PI / 2).rotateY(Math.PI / 8).translate(0, N2 + 1, z), hierro);
      for (let i = 0; i < 8; i++) { const a = (i + 0.5) * 45 * RAD; if (i % 2) farol(Math.cos(a) * 6.3, z + Math.sin(a) * 6.3, 2.9); else poste(Math.cos(a) * 6.3, z + Math.sin(a) * 6.3, 1.3); }
    }
    // las palmeras de Alvear: en hilera por los cuatro costados (las del sur de la mitad este duran hasta 1895, más abajo)
    hileraDe((x, z) => palmera(x, z, 7.5 + ((x * 7 + z * 3) % 5) * 0.4), 19, 47.5, -46, 47.5, 162);
    hileraDe((x, z) => palmera(x, z, 7.5 + ((z * 3) % 5) * 0.4), 11, -47.5, -46, -47.5, 69.5);
    hileraDe((x, z) => palmera(x, z, 8.2), 7, -34, 165.5, 34, 165.5);
    for (const [x, z] of [[-22, -22], [-36, -36], [22, 26], [-24, 40], [-30, 98], [30, 110]]) palmera(x, z, 2.2, 2.6, 0.32);
    // los faroles a gas en las puntas de los canteros y los candelabros de dos brazos del eje (foto de Boote, 1890)
    for (const s of [-1, 1]) for (const z of [-46, -12, 12, 54, 79, 127, 137, 163]) farol(s * 13, z);
    candelabro(0, -14, 6.5); candelabro(0, 16, 6.5); candelabro(0, 100, 6.5);
    for (const s of [-1, 1]) { bancos(3, s * 12.2, -40, s * 12.2, -18, s > 0 ? 90 : -90); bancos(3, s * 12.2, 86, s * 12.2, 122, s > 0 ? 90 : -90); }
    quiosco(46.5, 22);
  }
  // (las de la mitad este del lado sur, que siguen en pie en la foto «Plaza de mayo y casa de gobierno 1890s»)
  c.epoca(1, 3);
  hileraDe((x, z) => palmera(x, z, 7.5 + ((z * 3) % 5) * 0.4), 9, -47.5, 80, -47.5, 162);
  // los cuatro faroles de las esquinas de la reja de la Pirámide, mientras estuvo en su lugar viejo
  c.epoca(1, 5);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) farol(sx * 8.4, sz * 8.4, 3);

  // ================================================================================== 1895: el trazado de Thays
  // Los cuatro canteros «en punta»: el lado corto sobre el cruce de Defensa, la punta junto a su centro (la fuente al
  // este, la Pirámide al oeste) y el lado largo que se abre hacia la esquina de la plaza. Así se ven en el fotocromo.
  const punta = [[-46, 80], [-31, 80], [-13, ZF - 11], [-46, 161]];
  c.epoca(2, 3);
  {
    for (const p of [punta, espX(punta)]) { cesped(redondo(p, 2.5)); cesped(redondo(espZ(p).map(([x, z]) => [x, z < -30 ? -40 : z]), 2.5)); }
    cesped(redondo([[0, ZF + 11.5], [29, 165.5], [-29, 165.5]], 3)); // la cuña del Belgrano
    cesped(redondo([[0, -16], [-30, -50.5], [30, -50.5]], 3));       // la cuña de atrás de la Pirámide, con árboles
    cesped(T.ovalo(0, ZC, 9, 4.5, 20)); candelabro(0, ZC, 9, 'z');   // el óvalo del cruce, con su farol
    // la fuente (la que quedaba de las dos), en el medio de un redondel blanco
    T.tapete(T.ovalo(0, ZF, 9, 9, 24), P.BLANCO, { y: N2, claro: 1 }); fuente(0, ZF, N2 - 0.2);
    candelabro(0, ZF + 10.3, 10, 'x'); candelabro(0, 22, 9, 'x');
    for (const s of [-1, 1]) {
      for (const [x, z] of [[-29, 78], [-12, ZF - 13], [-22, 97], [-30, 138], [-44, 163]]) { farol(s * x, z); farol(s * x, 2 * ZC - z > -45 ? 2 * ZC - z : -42); }
      bancos(3, s * 28, 82, s * 13.5, ZF - 14, s > 0 ? 115 : -115); bancos(3, s * 16.5, ZF - 6, s * 43, 155, s > 0 ? 50 : -50);
      bancos(2, s * 28, 2 * ZC - 82, s * 13.5, 2 * ZC - ZF + 14, s > 0 ? 65 : -65);
    }
    // los plátanos recién plantados, por los costados (los trajo Thays del Parque 3 de Febrero), y los de la cuña del oeste
    hilera(24, 48.5, -48, 48.5, 163, 2.1); hilera(14, -48.5, -48, -48.5, 72, 2.1);
    for (const [x, z] of [[-14, -42], [0, -36], [14, -42], [-7, -27], [7, -27]]) T.arbol(x, z, 2.6);
    quiosco(-47, 70); quiosco(47, 8);
  }

  // ====================================================================== 1905 y 1910: los anillos y las curvas
  c.epoca(3, 5);
  {
    // los senderos claros: los tres anillos de la fuente, el camino del eje, el redondel del cruce, la calle de
    // Defensa de lado a lado y las dos diagonales hacia las esquinas de Balcarce
    sendero(T.ovalo(0, ZF, 22, 22, 32)); sendero(T.ovalo(0, ZC, 17, 17, 28));
    sendero(tira(-4, 4, 8.4, ZF - 20)); sendero(tira(-49, 49, ZC - 4, ZC + 4));
    for (const s of [-1, 1]) sendero([[s * 10, ZF + 15], [s * 16, ZF + 10], [s * 47, 158], [s * 41, 163]]);
    // la fuente en su redondel, y alrededor el anillo de césped (partido en cuatro por los pasos)
    for (let i = 0; i < 4; i++) cesped([...arco(0, ZF, 15.6, i * 90 + 7, i * 90 + 83, 7), ...arco(0, ZF, 10.4, i * 90 + 80, i * 90 + 10, 6)]);
    fuente(0, ZF, N2 - 0.2);
    // los cuatro canteros grandes, ahora con el borde curvo que acompaña los anillos; en el medio de los del este,
    // los estanques redondos con luces de 1904
    const curvo = [[-46, 85], [-25, 85], ...arco(0, ZF, 26.5, 245, 142, 9), [-46, 160]], viejo = [[-46, ZC - 22], [-25, ZC - 22], ...arco(0, 0, 19, 118, 215, 8), [-46, -40]];
    for (const s of [-1, 1]) { const m = (p) => (s < 0 ? p : espX(p)); cesped(redondo(m(curvo), 1.6, 2)); cesped(redondo(m(viejo), 1.6, 2)); estanque(s * 36.5, 112, 3.6); T.tapete(T.ovalo(s * 36, 20, 3.4, 3.4, 12), P.FLORES, { y: N4, claro: 0.66 }); }
    cesped(redondo([[0, ZF + 25.5], [24, 165.5], [-24, 165.5]], 3));
    cesped(redondo([[0, -22], [-28, -50.5], [28, -50.5]], 3));
    // la isleta del cruce: flores en el medio y las palmeras Phoenix alrededor (donde en 1900 se armó el templete)
    cesped(T.ovalo(0, ZC, 11, 11, 24)); T.tapete(T.ovalo(0, ZC, 4.2, 4.2, 14), P.FLORES, { y: N4, claro: 0.66 });
    for (let i = 0; i < 6; i++) palmera(Math.cos((i * 60 + 30) * RAD) * 7.6, ZC + Math.sin((i * 60 + 30) * RAD) * 7.6, 1.5, 2.7, 0.34);
    for (const s of [-1, 1]) for (const [x, z] of [[27, 88], [27, ZC - 25], [43, 88], [43, ZC - 25]]) palmera(s * x, z, 1.4, 2.6, 0.34);
    // las columnas de tres globos al borde de los canteros y los candelabros altos del eje
    for (const s of [-1, 1]) { for (const [x, z] of [[24, 83], [23, ZF - 12], [26, ZF + 9], [44, 163], [24, ZC - 20], [18, 14], [18, -12], [44, -42], [47, ZC]]) globo(s * x, z); bancos(4, s * 22.5, ZF - 14, s * 22.5, ZF + 14, s > 0 ? 90 : -90); bancos(2, s * 16.5, 8, s * 16.5, -8, s > 0 ? 90 : -90); bancos(2, s * 21, 87, s * 13, 96, s > 0 ? 125 : -125); }
    candelabro(0, ZF + 17.5, 10, 'x'); candelabro(0, 30, 9, 'x'); candelabro(-21, ZC, 9, 'z'); candelabro(21, ZC, 9, 'z');
    quiosco(-47, 72); quiosco(47, 8);
  }
  // los plátanos ya crecidos, en hilera por el norte y por el sur, y el macizo de árboles a los lados del Belgrano
  c.epoca(3, 4); hilera(26, 48.5, -48, 48.5, 163, 3); hilera(26, -48.5, -48, -48.5, 163, 3);
  c.epoca(4, 5); hilera(26, 48.5, -48, 48.5, 163, 3.5); hilera(26, -48.5, -48, -48.5, 163, 3.5);
  c.epoca(3, 5);
  for (const s of [-1, 1]) { for (const [x, z] of [[16, 162], [26, 164], [37, 163], [21, 156]]) T.arbol(s * x, z, 3.2); for (const [x, z] of [[-12, -44], [0, -38], [12, -44]]) T.arbol(x + s * 1.5, z, 3); }

  // ============================================================ 1921 y 1940: la Pirámide en el centro, los parterres
  c.epoca(5);
  {
    // la Pirámide de 1856 en su lugar nuevo, a 63,17 m del viejo: igual, pero al ras del piso y sin las cuatro
    // estatuas del pedestal (se las sacaron para el traslado; volvieron recién en 2017). Ni reja: flores alrededor.
    const z = ZC, y = 0.65;
    T.caja(8, 0.5, 8, 0, y, z); T.caja(5.2, 3.2, 5.2, 0, y + 0.5, z); T.caja(5.8, 0.4, 5.8, 0, y + 3.7, z);
    T.put(new THREE.CylinderGeometry(1.0, 2.05, 11, 4).rotateY(Math.PI / 4).translate(0, y + 4.1 + 5.5, z), c.PIEDRA, { H: y + 15.1 }); T.caja(1.9, 0.5, 1.9, 0, y + 15.1, z);
    T.cilindro(0.42, 2.6, 0, y + 15.6, z, c.PIEDRA, 6, 0.3); T.cilindro(0.3, 0.5, 0, y + 18.2, z, c.PIEDRA, 5, 0.12);
    T.cilindro(0.5, 0.06, 2.07 * 0.7, y + 7.5, z, c.PINTADO, 8, 0.5, { pinta: [P.OCRE, 0.6] }); // (el sol, en la cara que mira al naciente… acá, un toque)
    // el gran redondel: césped, la broderie de flores en dos coronas y los arbustos recortados (Field Museum, 1924)
    cesped(T.ovalo(0, z, 22, 22, 36));
    for (let i = 0; i < 4; i++) { T.tapete([...arco(0, z, 18.5, i * 90 + 12, i * 90 + 78, 7), ...arco(0, z, 15.5, i * 90 + 74, i * 90 + 16, 6)], P.FLORES, { y: N4, claro: 0.66 }); T.tapete([...arco(0, z, 11, i * 90 - 30, i * 90 + 30, 5), ...arco(0, z, 8, i * 90 + 26, i * 90 - 26, 4)], P.FLORES, { y: N4, claro: 0.66 }); }
    T.tapete(T.recto(11, 11, 0, z, 1.5), P.FLORES, { y: N4, claro: 0.66 });
    for (let i = 0; i < 8; i++) T.cilindro(0.9, 1.3, Math.cos((i * 45 + 22.5) * RAD) * 13.2, 0.6, z + Math.sin((i * 45 + 22.5) * RAD) * 13.2, c.FOLLAJE, 6, 0.35);
    // los parterres rectangulares de broderie sobre el eje, al este y al oeste (Carrasco, octubre de 1921)
    for (const s of [-1, 1]) { const zp = z + s * 42; cesped(T.recto(14, 22, 0, zp, 1.2)); T.tapete(T.ovalo(0, zp, 4.2, 8, 16), P.FLORES, { y: N4, claro: 0.66 }); for (const q of [-1, 1]) T.cilindro(0.8, 1.2, 0, 0.6, zp + q * 9.4, c.FOLLAJE, 6, 0.3); }
    // los cuatro canteros de los cuadrantes, con la curva del redondel y un estanque ovalado en cada uno (el de
    // «las patas en la fuente» de 1945 es uno de estos)
    const cuad = [[45, z + 6], [45, z + 53], [13, z + 53], ...arco(0, z, 29.5, 64, 12, 8)];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const p = cuad.map(([x, q]) => [sx * x, z + sz * (q - z)]); cesped(redondo(p, 1.5, 2)); estanque(sx * 30, z + sz * 31, 5.2, 7.5); }
    // las puntas: desde el fin de cada parterre, cuatro senderos en abanico hacia Bolívar y hacia Balcarce, y entre
    // ellos las cuñas de césped (la del medio del lado este es la del Belgrano)
    const oeste = [-45, 45, -50, z - 57], este = [-45, 45, z + 57, 165.5];
    for (const [a0, a1] of [[-17, 17], [25, 50], [58, 90], [-50, -25], [-90, -58]]) { cesped(redondo(cuña(0, z - 57, 270 + a0, 270 + a1, 13, oeste), 1.2, 2)); cesped(redondo(cuña(0, z + 57, 90 + a0, 90 + a1, 13, este), 1.2, 2)); }
    T.tapete(T.ovalo(0, ZB, 9, 6.5, 20), P.FLORES, { y: N4, claro: 0.66 });
    // las Phoenix ya grandes (las de la postal de c. 1931) y las del Belgrano, que todavía están
    for (const sx of [-1, 1]) { for (const [x, q] of [[18, -33], [28.5, -30], [40, -34], [33, 14], [20, 34]]) palmera(sx * x, z + q, 6.5 + (x % 3) * 0.6, 4.2, 0.45); for (const q of [-9, 9]) palmera(sx * 10, ZB + q, 7, 4, 0.45); }
    // los plátanos de los costados y los de las puntas
    hilera(27, 48.5, -48, 48.5, 163, 3.8); hilera(27, -48.5, -48, -48.5, 163, 3.8);
    for (const s of [-1, 1]) for (const [x, q] of [[30, 158], [41, 150], [30, -44], [41, -36]]) T.arbol(s * x, q, 3.6);
    for (const s of [-1, 1]) { bancos(3, s * 46.2, z + 14, s * 46.2, z + 50, s > 0 ? 90 : -90); bancos(3, s * 46.2, z - 50, s * 46.2, z - 14, s > 0 ? 90 : -90); bancos(2, s * 9, z + 34, s * 9, z + 50, s > 0 ? 90 : -90); bancos(2, s * 9, z - 50, s * 9, z - 34, s > 0 ? 90 : -90); }
  }
  // 1921: los globos de siempre al borde de los senderos de granza
  c.epoca(5, 6);
  for (const sx of [-1, 1]) for (const [x, q] of [[10.5, 30.5], [10.5, 55], [10.5, -30.5], [10.5, -55], [47, 0], [46.5, 55], [46.5, -55], [31, 100], [31, -108]]) globo(sx * x, ZC + q, 4);
  candelabro(0, ZC + 26.5, 9, 'x'); candelabro(0, ZC - 26.5, 9, 'x');
  // 1940: la obra de 1929. Los senderos de mosaico blanco con su guarda, la vereda de cinco metros todo alrededor y
  // las farolas: de cinco luces en las esquinas, de dos en los costados
  c.epoca(6);
  {
    const z = ZC, B = P.BLANCO;
    for (const t of [tira(-XK + 0.7, -46, ZO + 6, ZE - 6), tira(46, XK - 0.7, ZO + 6, ZE - 6), tira(-46, 46, ZO + 0.7, ZO + 5), tira(-46, 46, ZE - 5, ZE - 0.7)]) sendero(t, P.BALDOSA);
    sendero(T.ovalo(0, z, 28.5, 28.5, 36), B); sendero(tira(-46, 46, z - 3.5, z + 3.5), B);
    for (const s of [-1, 1]) { sendero(tira(s * 7.8, s * 12.2, z + 26, z + 55), B); sendero(tira(s * 7.8, s * 12.2, z - 55, z - 26), B); }
    sendero(tira(-46, 46, z + 53.6, z + 56.4), B); sendero(tira(-46, 46, z - 56.4, z - 53.6), B);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) farola(sx * (XK - 4), sz > 0 ? ZE - 4 : ZO + 4);
    for (const sx of [-1, 1]) for (const q of [-78, -39, 0, 39, 78]) farola(sx * 48.6, z + q + 4.5, 2);
    for (const sx of [-1, 1]) for (const [x, q] of [[13.5, 30.5], [13.5, 57.5], [13.5, -30.5], [13.5, -57.5], [31, 100], [31, -108]]) globo(sx * x, z + q, 4);
  }
  c.epoca(0);
}
