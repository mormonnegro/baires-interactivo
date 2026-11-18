// El Teatro Colón de 1908 (Tamburini, Meano y Dormal), en la manzana de Libertad, Tucumán, Cerrito y Viamonte.
// Sale de la foto del Archivo General de la Nación de hacia 1910 que muestra la ficha («Archivo General de la Nación
// Argentina sin fecha Buenos Aires, Teatro Colón», en Wikimedia Commons, de dominio público): el frente sobre Libertad
// y uno de los costados, vistos desde la plaza. De ahí:
//   · los tres pisos de afuera: el basamento, de sillares, con vanos rectos; el piso noble, de ventanas de arco entre
//     pilastras, con su cornisa; y el ático, bajo, con la balaustrada y las copas arriba;
//   · el frente: dos pabellones en las esquinas, cada uno con su ventana grande entre columnas y un frontis chico, y
//     en el medio la galería de columnas pareadas sobre el balcón, con la marquesina de hierro de la entrada abajo;
//   · detrás del frente, más alto y metido hacia adentro, el cuerpo de la sala, con su fila de ventanas, y el techo a
//     dos aguas que da a Libertad un frontis con una ventana de medio punto; al fondo, más alta, la caja del escenario.
// Lo que la foto no muestra va simple y parejo: el otro costado igual al que se ve, el contrafrente sin adornos y, a
// cada lado, la entrada del pasaje de carruajes (que cruza el edificio de Tucumán a Viamonte) como un arco grande.
// Las medidas de la planta son las de src/edificios.js; las alturas, a ojo sobre la foto, con la gente de escala.
// Lo que el lugar dice de sí mismo, para `node tools/revisar-lugar.mjs teatroColon` (el formato: src/lugares/LEEME.md).
export const LUGAR = {
  nombre: 'Teatro Colón (1908)', clase: 'edificio', desde: 1908,
  esquina: ['Libertad', 'Tucumán'],
  marcas: ['Teatro Colón'],
  fuentes: [
    'Wikimedia Commons, «Archivo General de la Nación Argentina sin fecha Buenos Aires, Teatro Colón.jpg» (hacia 1910, dominio público): el frente sobre Libertad y un costado',
    'OpenStreetMap (src/edificios.js, clave «colon»): el lugar y las medidas de la planta',
    'Wikipedia en español, «Teatro Colón»: los años y los autores',
  ],
  supuestos: ['las alturas, a ojo sobre la foto', 'el costado que la foto no muestra, igual al otro', 'el contrafrente, sin adornos'],
};
export default function (c) {
  const { THREE, PIEDRA, TINTA, PINTADO, PINTA, CREMA, SILLAR } = c;
  const T = c.obra('colon', CREMA); // (x hacia Libertad, al oeste: el frente es +x; z hacia el norte)
  const L = 112, W = 55, X = L / 2, Z = W / 2;
  const B = 7.2, N = 17, H = 22.4; // hasta dónde llegan el basamento, el piso noble (ahí va la cornisa) y el ático
  const PAB = 12, PX = X + 1.4, PZ = Z + 1; // los pabellones de las esquinas: de qué lado miden y hasta dónde salen
  const CZ = Z - PAB + 1; // (media galería: lo que queda entre los dos pabellones del frente)

  // -------------------------------------------------------------------------------------------- piezas sueltas
  const sillar = (w, h, d, x, y, z) => T.caja(w, h, d, x, y, z, PIEDRA, { tono: SILLAR });
  /** un frontis: el triángulo de piedra, de `ancho` a lo largo de la pared y `fondo` de espesor, mirando hacia `cara` */
  const frontis = (ancho, alto, fondo, x, y, z, cara) => {
    const s = new THREE.Shape(); s.moveTo(-ancho / 2, 0); s.lineTo(ancho / 2, 0); s.lineTo(0, alto); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: fondo, bevelEnabled: false }).translate(0, 0, -fondo / 2);
    if (cara.endsWith('x')) g.rotateY(Math.PI / 2);
    T.put(g.translate(x, y, z), PIEDRA, { tono: CREMA, H: y + alto });
  };
  /** una copa de las del pretil, sobre su pedestal */
  const copa = (x, y, z) => { T.liso(0.8, 1.3, 0.8, x, y, z); T.cilindro(0.2, 0.45, x, y + 1.3, z, PIEDRA, 6, 0.42, { tono: CREMA }); T.cilindro(0.42, 0.3, x, y + 1.75, z, PIEDRA, 6, 0.16, { tono: CREMA }); };
  /** el pretil de una azotea: el murete y una copa cada tanto, de (x0, z0) a (x1, z1) */
  const pretil = (x0, z0, x1, z1, y, cada = 9) => {
    const l = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(l / cada));
    T.liso(Math.abs(x1 - x0) + 0.3, 0.95, Math.abs(z1 - z0) + 0.3, (x0 + x1) / 2, y, (z0 + z1) / 2);
    for (let i = 0; i <= n; i++) copa(x0 + ((x1 - x0) * i) / n, y, z0 + ((z1 - z0) * i) / n);
  };
  /** los tres pisos de vanos de un tramo de pared: rectos abajo, de arco en el piso noble y chicos en el ático */
  const pisos = (n, a, b, fijo, cara) => {
    T.fila(n, a, b, 2.1, 4.1, 1.7, fijo, cara, false); T.fila(n, a, b, 2.4, 6.4, B + 1.5, fijo, cara); T.fila(n, a, b, 1.9, 2.3, N + 2, fijo, cara, false);
  };
  /** las pilastras del piso noble de un tramo de pared que mira a ±z: una entre vano y vano, y las dos de las puntas */
  const pilastras = (n, a, b, z, s) => { for (let i = 0; i <= n; i++) T.liso(0.75, N - B - 0.5, 0.5, a + ((b - a) * i) / n, B + 0.5, z + s * 0.12); T.liso(b - a, 0.3, 0.7, (a + b) / 2, B + 1.15, z + s * 0.1); };
  /** un farol de los de la vereda: la columna de hierro y el globo */
  const farol = (x, z) => { T.cilindro(0.16, 4.4, x, 0, z, TINTA, 6, 0.09); T.put(new THREE.SphereGeometry(0.42, 8, 6).translate(x, 4.7, z), PINTADO, { pinta: [PINTA.BLANCO, 0.97] }); };

  // -------------------------------------------------------------------------------------- el cuerpo de afuera
  T.liso(L, H, W, 0, 0, 0); sillar(L + 0.6, B, W + 0.6, 0, 0, 0);
  T.liso(L + 1.3, 0.7, W + 1.3, 0, N, 0); T.liso(L + 1.5, 0.6, W + 1.5, 0, H, 0);
  // los cuatro pabellones de las esquinas: salen un poco de la línea y suben un metro más
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * (PX - PAB / 2), z = sz * (PZ - PAB / 2), cx = sx > 0 ? '+x' : '-x', cz = sz > 0 ? '+z' : '-z';
    T.liso(PAB, H + 1, PAB, x, 0, z); sillar(PAB + 0.6, B, PAB + 0.6, x, 0, z);
    T.liso(PAB + 1.3, 0.7, PAB + 1.3, x, N, z); T.liso(PAB + 1.5, 0.6, PAB + 1.5, x, H + 1, z);
    for (const [ex, ez] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) copa(x + ex * (PAB / 2 - 0.3), H + 1.6, z + ez * (PAB / 2 - 0.3));
    pisos(2, x - 4.6, x + 4.6, sz * (PZ + 0.07), cz); // (la cara que da a la calle del costado)
    if (sx < 0) { pisos(2, z - 4.6, z + 4.6, -(PX + 0.07), cx); continue; }
    // la cara que da a Libertad: la ventana grande entre dos columnas, sobre un pedestal que sale del basamento, y arriba el frontis chico
    sillar(1, B + 0.3, 7.8, PX + 0.5, 0, z); T.vano(2.6, 4.2, PX + 1.06, 1.6, z, cx, false);
    T.vano(3.6, 7.4, PX + 0.06, B + 1.2, z, cx); T.columnas(2, PX + 0.5, z - 2.9, PX + 0.5, z + 2.9, B + 0.3, 0.5, N - B - 1.3);
    T.liso(1.1, 1, 7.8, PX + 0.5, N - 1, z); T.liso(1.7, 0.7, 8.6, PX + 0.6, N, z); frontis(8.4, 1.9, 1.1, PX + 0.55, N + 0.7, z, cx);
  }
  for (const s of [-1, 1]) { // los pretiles, entre pabellón y pabellón
    pretil(-(X - PAB), s * Z, X - PAB, s * Z, H + 0.6); pretil(s * X, -CZ, s * X, CZ, H + 0.6);
  }

  // ---------------------------------------------------------------------------------- el frente, sobre Libertad
  { // la galería del medio: abajo las cinco puertas, arriba las columnas pareadas sobre el balcón y, detrás, las ventanas de arco
    const n = 5, paso = (2 * CZ) / n, xf = X + 0.9;
    sillar(0.9, B, 2 * CZ, X + 0.45, 0, 0); T.fila(n, -CZ, CZ, 3.2, 5.2, 0.5, xf + 0.06, '+x', false);
    T.liso(1.5, 0.45, 2 * CZ, X + 0.75, B, 0); T.liso(0.25, 0.95, 2 * CZ, X + 1.35, B + 0.45, 0);
    T.fila(n, -CZ, CZ, 3.4, 7, B + 1.2, X + 0.06, '+x'); T.fila(n, -CZ, CZ, 2.6, 2.3, N + 2, X + 0.06, '+x', false);
    for (let i = 0; i <= n; i++) { const z = -CZ + i * paso, par = i === 0 ? [0.7] : i === n ? [-0.7] : [-0.75, 0.75]; for (const d of par) T.columnas(1, X + 0.75, z + d, X + 0.75, z + d, B + 0.45, 0.48, N - B - 1.45); }
    T.liso(1.3, 1, 2 * CZ, X + 0.65, N - 1, 0); T.liso(1.9, 0.7, 2 * CZ, X + 0.95, N, 0);
    // la entrada: dos escalones, la marquesina de hierro y vidrio sobre las tres puertas del medio y los faroles
    T.liso(4.6, 0.2, 3.6 * paso, xf + 2.3, 0, 0); T.liso(3.8, 0.2, 3.4 * paso, xf + 1.9, 0.2, 0);
    T.tejado(3.8, 3 * paso, 0.8, xf + 1.9, 5.3, 0, 'z', TINTA, true);
    for (const z of [-1.5, -0.5, 0.5, 1.5]) T.cilindro(0.09, 5.3, xf + 3.6, 0, z * paso, TINTA, 6);
    for (const z of [-2.1, -1, 1, 2.1]) farol(xf + 5, z * paso);
  }

  // ------------------------------------------------------------------------- los costados y el contrafrente
  for (const s of [-1, 1]) {
    const cara = s > 0 ? '+z' : '-z', zf = s * (Z + 0.07), x0 = -(X - PAB), xa = 20, xb = xa + PAB, x1 = PX - PAB;
    pisos(14, x0, xa, zf, cara); pilastras(14, x0, xa, s * Z, s); pisos(3, xb, x1, zf, cara); pilastras(3, xb, x1, s * Z, s);
    // la entrada del pasaje de carruajes: un cuerpo que sale, con el arco grande abajo y un frontis arriba
    const xm = (xa + xb) / 2, zp = s * (Z + 1);
    T.liso(PAB, H + 1, 2, xm, 0, s * Z); sillar(PAB + 0.6, B, 2.6, xm, 0, s * Z); T.liso(PAB + 1.3, 0.7, 3.3, xm, N, s * Z); T.liso(PAB + 1.5, 0.6, 3.5, xm, H + 1, s * Z);
    T.vano(5, 6.2, xm, 0.2, zp + s * 0.37, cara); T.vano(3.4, 7, xm, B + 1.2, zp + s * 0.07, cara);
    for (const d of [-4.3, 4.3]) { T.vano(1.6, 3.6, xm + d, 2, zp + s * 0.37, cara, false); T.vano(1.6, 5.4, xm + d, B + 1.9, zp + s * 0.07, cara); }
    T.columnas(2, xm - 2.7, zp + s * 0.45, xm + 2.7, zp + s * 0.45, B, 0.45, N - B - 1); T.liso(7, 1, 1, xm, N - 1, zp + s * 0.35);
    frontis(PAB + 1, 2.3, 1.2, xm, H + 1.6, s * (Z + 0.5), cara);
  }
  // el contrafrente, sobre Cerrito: liso, con el portón del escenario
  pisos(7, -CZ, CZ, -(X + 0.07), '-x'); T.vano(5.2, 6.4, -(X + 0.38), 0.2, 0, '-x', false);

  // ----------------------------------------------------------------------------- la sala y la caja del escenario
  { // el cuerpo de la sala: más alto que lo de afuera y metido hacia adentro, con su fila de ventanas y el techo a dos aguas
    const x0 = -14, x1 = 38, xm = (x0 + x1) / 2, l = x1 - x0, zs = 20, hs = 7.6, hr = 7.4;
    T.liso(l, hs, 2 * zs, xm, H, 0); T.liso(l + 1.2, 0.6, 2 * zs + 1.2, xm, H + hs, 0);
    for (const s of [-1, 1]) T.fila(13, x0 + 1, x1 - 1, 1.8, 3.4, H + 2.6, s * (zs + 0.06), s > 0 ? '+z' : '-z', false);
    T.fila(5, -15, 15, 2, 3.4, H + 2.6, x1 + 0.06, '+x', false);
    T.tejado(l + 0.6, 2 * zs + 1.2, hr, xm - 0.3, H + hs + 0.6, 0, 'x');
    // el frontis que mira a Libertad, con la ventana de medio punto, y sus remates
    frontis(2 * zs + 1.2, hr, 0.8, x1 + 0.4, H + hs + 0.6, 0, '+x'); T.vano(10, 5, x1 + 0.86, H + hs + 1, 0, '+x');
    T.liso(1.7, 2.4, 1.7, x1 + 0.3, H + hs + hr - 0.5, 0); for (const s of [-1, 1]) T.liso(1.5, 1.8, 1.5, x1 + 0.2, H + hs + 0.6, s * zs);
  }
  { // la caja del escenario: lo más alto del teatro, al fondo
    const x0 = -46, x1 = -14, xm = (x0 + x1) / 2, l = x1 - x0, zs = 21.5, hs = 15, hr = 5.6;
    T.liso(l, hs, 2 * zs, xm, H, 0); T.liso(l + 1.2, 0.6, 2 * zs + 1.2, xm, H + hs, 0);
    for (const s of [-1, 1]) { T.fila(7, x0 + 1, x1 - 1, 1.6, 2.8, H + 10.4, s * (zs + 0.06), s > 0 ? '+z' : '-z', false); T.fila(7, x0 + 1, x1 - 1, 1.6, 2.8, H + 3, s * (zs + 0.06), s > 0 ? '+z' : '-z', false); }
    T.fila(5, -15, 15, 1.8, 2.8, H + 10.4, x0 - 0.06, '-x', false);
    T.liso(l + 0.6, 0.5, 2 * zs + 0.6, xm, H + 8, 0); // (una faja a media altura y las lesenas de las esquinas, para que no sea un cajón liso)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) T.liso(2.4, hs, 2.4, xm + sx * (l / 2 - 1), H, sz * (zs - 1));
    T.tejado(l, 2 * zs + 1.2, hr, xm, H + hs + 0.6, 0, 'x');
    for (const s of [-1, 1]) frontis(2 * zs + 1.2, hr, 0.8, s > 0 ? x1 + 0.2 : x0 - 0.2, H + hs + 0.6, 0, s > 0 ? '+x' : '-x');
  }
  T.liso(2.2, 6.5, 2.2, -51, H, 21); T.liso(2.8, 0.5, 2.8, -51, H + 6.5, 21); // (la chimenea, sobre la esquina del fondo)
}
