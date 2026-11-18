// La línea A del subte: el «subterráneo» de la Compañía de Tranvías Anglo Argentina, que corre bajo la Avenida de Mayo
// y Rivadavia. De Plaza de Mayo a Plaza Once se inauguró el 1 de diciembre de 1913; el 1 de abril de 1914 llegó a Río
// de Janeiro y en julio de 1914 a Caballito (hoy Primera Junta, que queda fuera del plano; la rampa por donde los
// coches salían a la calle estaba más allá todavía, entre Cachimayo y Emilio Mitre). Como va bajo tierra, lo que se
// ve son las bocas: acá están las de las doce estaciones que caen dentro del plano, desde 1921.
//
// Cómo era una boca (todas iguales, de 1913 a 1940 por lo menos), de las fotos de Wikimedia Commons:
//   · «Pasco Sur - Boca acceso - 1938» y «(2)» (la repavimentación de Rivadavia, con la Casa del Pueblo detrás): la
//     escalera corre a lo largo de la vereda, pegada al cordón; la rodea por tres lados una baranda de hierro de un
//     metro sobre un zócalo de piedra, y en la punta por donde se entra hay un pórtico de dos pilares de hierro calado,
//     de unos cuatro metros y medio, con el cartel de lado a lado («SUBTERRÁNEO A / PLAZA ONCE») y otro más chico
//     colgado debajo («CABALLITO»).
//   · «CONGRESO ACCESO ORIGINAL» (años treinta, junto al Congreso): el mismo pórtico con sus dos carteles y, al fondo,
//     el de la otra boca de la misma vereda, que mira para el otro lado: son dos por andén, con la entrada en las
//     puntas de afuera, y bajan una hacia la otra.
//   · «Boca de acceso al Subte A» (c. 1940, «SUBTERRÁNEO A CABALLITO») y «ANTIGUA ENTRADA AL SUBTE» («SUBTERRÁNEO A
//     PLAZA MAYO»): el cartel blanco con su marco, la crestería de hierro encima y el farol que cuelga en el medio.
//   · «Estacion saenz pena subte a 1928» (de noche, «A PLAZA MAYO» en la vereda norte) y «Boca de acceso est.
//     Caballito» (24-6-1914, el pórtico recién puesto): los carteles dicen hacia dónde va el andén de esa vereda. Los
//     trenes corren por la izquierda: la vereda sur baja al andén que va a Once y Caballito, la norte al que va a la plaza.
//   · «Casa Rosada y boca de subte» (c. 1915) y «ESTACION PZA MAYO»: las dos bocas de la terminal, una en la vereda de
//     la Casa Rosada, delante del ala sur, y otra en el borde de la plaza.
// Dónde va cada una sale de las bocas de hoy en el mapa (OpenStreetMap), que siguen en el lugar de las de 1913 —se
// comprueba con la de la Casa Rosada, la del Congreso y las de Pasco Sur—, corridas a la vereda que el plano deja ver.
// Lo que es supuesto: que todas las estaciones tenían sus cuatro bocas (el mapa de hoy trae menos en Congreso, Loria,
// Castro Barros y Río de Janeiro); el lugar justo de Alberti Norte (cerrada en 1953, como Pasco Sur; va a la misma
// distancia de su otra mitad que las dos de Pasco); las cuatro de Plaza Once, que son las de hoy; y las medidas, que
// salen de comparar con la gente de las fotos. Las letras de los carteles no están.
export default function (c) {
  const { THREE, PINTA, PIEDRA, TINTA, PINTADO, GRIS } = c;
  c.epoca(c.etapaDe(1913)); // (en la línea de tiempo: 1921 y 1940)

  const LARGO = 9, ANCHO = 2.6, ZOCALO = 0.35, GRUESO = 0.28; // la escalera con su baranda · el zócalo de piedra
  const HIERRO = 1.0, ALTO = 4.6, CARTEL = 3.5;                // la baranda sobre el zócalo · los pilares · a qué altura va el cartel
  const BLANCO = { pinta: [PINTA.BLANCO, 1] };
  /** Una boca: se entra por (ox, oz) y la escalera baja hacia (ax, az), que es uno de los cuatro rumbos del lugar.
   *  Con `dos`, el segundo cartel colgado debajo (el de «Caballito»). Adentro se mide con `a` (a lo largo, desde la
   *  entrada) y `b` (a lo ancho, desde el medio). */
  const boca = (L, ox, oz, ax, az, dos = false) => {
    const p = (a, b) => [ox + a * ax - b * az, oz + a * az + b * ax];
    const caja = (la, h, lb, a, y, b, kind, o) => { const [x, z] = p(a, b); L.caja(ax ? la : lb, h, ax ? lb : la, x, y, z, kind, o); };
    /** una «U» abierta en a0, que llega hasta a1, de ancho w y grosor g */
    const u = (a0, a1, w, g) => [[a0, -w / 2], [a1, -w / 2], [a1, w / 2], [a0, w / 2], [a0, w / 2 - g], [a1 - g, w / 2 - g], [a1 - g, g - w / 2], [a0, g - w / 2]].map(([a, b]) => p(a, b));
    const paño = (a0, a1, w) => [[a0, -w / 2], [a1, -w / 2], [a1, w / 2], [a0, w / 2]].map(([a, b]) => p(a, b));
    // el zócalo de piedra y, encima, la baranda de hierro (el zócalo se hunde un poco: la vereda no siempre está a la
    // altura del medio de la calle, que es donde se apoya la estación)
    L.prisma(u(0, LARGO, ANCHO, GRUESO), ZOCALO + 0.5, -0.5, PIEDRA, { tono: GRIS });
    L.prisma(u(0.2, LARGO - 0.1, ANCHO - 0.2, 0.08), HIERRO, ZOCALO, TINTA);
    // la escalera: los primeros escalones a la luz y el resto, que se pierde en lo oscuro
    const w = ANCHO - 2 * GRUESO;
    L.tapete(paño(0, LARGO * 0.3, w), PINTA.ADOQUIN, { y: 0.12, claro: 0.62 });
    L.tapete(paño(LARGO * 0.3, LARGO - GRUESO, w), PINTA.NEGRO, { y: 0.12, claro: 0.16 });
    // el pórtico: los dos pilares de hierro calado, el marco del cartel con su crestería (un frontis bajo), el cartel
    // blanco, que asoma por las dos caras, y el farol que cuelga en el medio
    for (const s of [-1, 1]) caja(0.3, ALTO + 0.5, 0.3, 0, -0.5, s * (ANCHO / 2 - 0.15), TINTA);
    const m = ANCHO / 2 - 0.2, [fx, fz] = p(0, 0), giro = Math.atan2(ax, az);
    const marco = new THREE.Shape([[-m, CARTEL - 0.14], [m, CARTEL - 0.14], [m, CARTEL + 0.76], [0, CARTEL + 1.15], [-m, CARTEL + 0.76]].map(([b, y]) => new THREE.Vector2(b, y)));
    L.put(new THREE.ExtrudeGeometry(marco, { depth: 0.1, bevelEnabled: false }).translate(0, 0, -0.05).rotateY(giro).translate(fx, 0, fz), TINTA, { H: CARTEL + 1.15 });
    caja(0.2, 0.62, ANCHO - 0.75, 0, CARTEL, 0, PINTADO, BLANCO);
    if (dos) caja(0.14, 0.34, ANCHO * 0.55, 0, CARTEL - 0.6, 0, PINTADO, BLANCO);
    L.put(new THREE.OctahedronGeometry(0.2).translate(fx, CARTEL - (dos ? 0.95 : 0.5), fz), PINTADO, { ...BLANCO, H: CARTEL });
  };

  // ------------------------------------------------------------------------------------------- las estaciones
  // Cada una es un lugar, con el origen en el medio de sus bocas: x a lo largo de la avenida, hacia el oeste (hacia
  // Caballito), y z hacia el norte. A lo largo, las bocas van donde las de hoy (el mapa de hoy da cada par a 32 o 39 m;
  // en Congreso, a 60); a lo ancho, en la vereda que el plano deja entre la calzada pintada y las casas: `norte` y
  // `sur` son a cuántos metros del origen queda el medio de la boca de cada vereda.
  const RIVADAVIA = [0.0032, -1]; // (hacia dónde corre Rivadavia en el plano, de este a oeste)
  // El eje de la Avenida de Mayo es el que pinta el suelo (tools/crece.mjs, que lo imprime al correr: la recta de los
  // cruces de hoy con Perú y con San José, alargada de Bolívar a Sáenz Peña). Si el suelo cambia, se cambia acá y las
  // cuatro estaciones lo siguen.
  const MAYO_A = [10333, 9403], MAYO_B = [10331, 7541], MAYO = [(MAYO_B[0] - MAYO_A[0]) / 1862, (MAYO_B[1] - MAYO_A[1]) / 1862];
  const ejeMayo = (py) => MAYO_A[0] + ((py - MAYO_A[1]) * (MAYO_B[0] - MAYO_A[0])) / (MAYO_B[1] - MAYO_A[1]);
  /** Una estación de las de siempre: dos bocas por vereda, a `h` metros del medio cada una, mirando hacia afuera.
   *  `caballito`: si la vereda sur lleva el segundo cartel (hasta Once: «a Plaza Once / y Caballito»). */
  const estacion = (px, py, rumbo, { h = 16.2, norte = null, sur = null, caballito = true } = {}) => {
    const L = c.lugar(px, py, ...rumbo);
    for (const [z, s] of [[norte, 1], [sur, -1]]) if (z != null) for (const k of [-1, 1]) boca(L, k * h, z, -k, 0, caballito && s < 0);
    return L;
  };

  // Bajo la Avenida de Mayo (30 m de frente a frente: las bocas, en la vereda, contra el cordón)
  const N = 12, S = -12;
  estacion(ejeMayo(9264), 9264, MAYO, { norte: N, sur: S });                // Perú: entre Bolívar y Perú
  estacion(ejeMayo(8711), 8711, MAYO, { h: 19.6, norte: N, sur: S });       // Piedras: entre Piedras y Tacuarí
  estacion(ejeMayo(8165), 8165, MAYO, { norte: N, sur: S });                // Lima: entre Lima y Salta
  estacion(ejeMayo(7614), 7614, MAYO, { norte: N, sur: S });                // Sáenz Peña: entre San José y Luis Sáenz Peña
  // Bajo Rivadavia, que en el plano es la calle angosta de 1867: las bocas van contra los frentes
  estacion(10424, 6822, RIVADAVIA, { h: 30, norte: 15.8, sur: -4 });         // Congreso: junto al palacio, de Callao hacia Riobamba
  estacion(10420, 6230, RIVADAVIA, { sur: -4.3 });                           // Pasco Sur (hasta 1953): frente a la Casa del Pueblo
  estacion(10420, 6039, RIVADAVIA, { norte: 7.4 });                          // Pasco Norte: entre Pasco y Pichincha
  estacion(10420, 5727, RIVADAVIA, { sur: -14.8 });                          // Alberti Sur: entre Matheu y Alberti
  estacion(10420, 5536, RIVADAVIA, { norte: 9.1 });                          // Alberti Norte (hasta 1953): pasando Larrea
  estacion(10424, 4953, RIVADAVIA, { h: 14, norte: -6.2, sur: -20.5 });      // Plaza Once: dos en el borde de la plaza y dos enfrente
  estacion(10412, 3807, RIVADAVIA, { h: 24.5, norte: 12.1, sur: -6.9, caballito: false }); // Loria
  estacion(10337, 2939, [-0.38, -0.925], { norte: 9, sur: -8, caballito: false });         // Castro Barros (la estación «Medrano» de 1914)
  estacion(9850, 1830, [-0.4, -0.917], { norte: 8, sur: -4.8, caballito: false });         // Río de Janeiro: la punta de la línea de abril a julio de 1914

  { // Plaza de Mayo, la terminal: el andén está bajo la punta sudeste de la plaza, de Defensa a Balcarce. Una boca en
    // el borde sur de la plaza, a la altura de Defensa, y otra en la vereda de la Casa Rosada, delante del ala sur (la
    // foto de c. 1915; cuando en 1938 se demolió el ala, la boca quedó donde estaba: es la de hoy, en la esquina de
    // Yrigoyen). Un lugar por boca: así cada una tiene su marca y se ilumina sola.
    boca(c.lugar(10276, 9589, 0, -1), 0, 0, -1, 0, true); // la de la plaza: se entra por el oeste
    // (la otra va de norte a sur. De los ejes de la Casa Rosada, src/edificios.js: a 33 m del eje del arco y a 3,5 del frente)
    const [rx, rz] = [-46.5, -43.5];
    boca(c.lugar(10352 + (rx * 0.9992 - rz * 0.0411) / 0.675, 9830 + (rx * 0.0411 + rz * 0.9992) / 0.675, 0, -1), 0, 0, 0, -1, true);
  }
}
