// La Plaza Colón y el Parque Colón, detrás de la Casa de Gobierno: lo que el suelo necesita saber de esa zona.
// Lo leen tools/crece.mjs (la lámina de las calles) y src/lugares/plaza-colon.js (lo que se arma a mano encima).
// Todo en píxeles del plano de 1867 (x hacia el norte, y hacia el río; 0,675 m por píxel).
//
// Por qué hace falta: las calles del suelo salen del mapa de hoy, y acá el mapa de hoy no sirve. La avenida de la
// Rábida de hoy es una curva chata, rehecha cuando se cerró el Paseo Colón detrás de la Casa Rosada (años ochenta) y
// vuelta a ensanchar en 2007; y de las dos diagonales que ordenaban el parque, la avenida Espora ya no existe y de
// la avenida Rosales queda un tramo. Lo que había, según las fuentes:
//   · el plano de Obras Públicas de 1895: el Paseo Colón–Paseo de Julio pasando por detrás de la Casa de Gobierno, la
//     «Plaza Colón» como un cuadro en el eje de la casa, y las diagonales «Espora» y «Rosales» dibujadas entre
//     manzanas rayadas (proyecto: la tierra era relleno reciente);
//   · los de Ludwig de 1905 y 1909: el «Parque Cristóbal Colón» como un trapecio entre Espora y Rosales, de la Casa
//     de Gobierno a la avenida del puerto;
//   · el de Cannizzaro de 1921: la «Plaza Colón» partida en tres por una calle en U —un escudo en el medio, con el
//     monumento, y un trapecio de parque a cada lado—, la «Aven. Rosales» y «Espora»;
//   · la foto aérea de 1940 del mapa interactivo de la Ciudad de Buenos Aires (capa «fotografías aéreas 1940»), que
//     calza con el plano a unos metros: de ahí están medidos los ejes y los anchos de abajo. Muestra el Paseo Colón
//     derecho y pegado a la casa, la calle en U arbolada, Espora y Rosales en uso (con sus nombres pintados en la
//     foto), y al sur del escudo la obra del Ministerio de Guerra (empezada en 1938), que ya se comió ese parque.
// Supuesto: la etapa en que cada calzada pasa de adoquín a asfalto, y que Espora, Rosales y el Paseo Colón tuvieran en
// 1895–1921 el mismo eje y el mismo ancho que en la foto de 1940.

/** una quebrada, con las esquinas redondeadas (de a cuartos); cada punto puede traer más datos, que se promedian igual */
export const suave = (pts, pasadas = 2) => {
  for (let k = 0; k < pasadas; k++) { const o = [pts[0]]; for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1]; o.push(a.map((v, j) => v * 0.75 + b[j] * 0.25), a.map((v, j) => v * 0.25 + b[j] * 0.75)); } o.push(pts[pts.length - 1]); pts = o; }
  return pts;
};

/** el eje de la plaza: el del monumento y los dos quioscos de la foto de 1940 (unos 20 m al sur del medio de la casa de hoy) */
export const EJE_COLON = 10318;

/** Adentro de este contorno la lámina de las calles no pinta las calles de hoy ni la franja de las manzanas de 1867
 *  (la de la Aduana Nueva y los depósitos de la orilla): van las calzadas de abajo, cada una desde su etapa. */
export const ZONA_COLON = [[9864, 9896], [10792, 9896], [10792, 10164], [9864, 10164]];

const U = [[-176, 9936], [-178, 9990], [-172, 10040], [-158, 10085], [-132, 10122], [-95, 10150], [-50, 10165], [0, 10168]];
/** el eje de la calle en U que rodea el escudo del medio (de la foto de 1940; el plano de 1921 la dibuja igual) */
export const CALLE_U = suave([...U, ...U.slice(0, -1).reverse().map(([dx, y]) => [-dx, y])].map(([dx, y]) => [EJE_COLON + dx, y]), 3);

/** Las calzadas: [nombre, etapa en que aparece (2 = 1895 … 6 = 1940), etapa en que se asfalta, eje: [x, y, medio ancho en metros]…] */
export const CALZADAS_COLON = [
  ['Paseo Colón y Paseo de Julio (Leandro N. Alem)', 2, 5, [[9690, 9920, 20], [9864, 9920, 20], [10000, 9915, 18], [10150, 9914, 14], [10262, 9916, 11.5], [10440, 9916, 11.5], [10520, 9908, 17], [10640, 9900, 22], [10790, 9897, 28], [10815, 9897, 28]]],
  ['Avenida Espora', 3, 6, [[10108, 9944, 7], [9853, 10054, 7], [9851, 10072, 7]]],
  ['Avenida Rosales', 3, 6, [[10476, 9930, 8], [10600, 9968, 8], [10772, 10018, 8], [10992, 10108, 8], [11183, 10166, 8]]],
  ['la calle en U de la Plaza Colón', 5, 6, CALLE_U.map(([x, y]) => [x, y, 6])],
];

/** Lo que es calzada de lado a lado: [nombre, etapa, etapa del asfalto, contorno]. La explanada del arranque del
 *  Paseo de Julio, al norte de la casa (donde estuvo la Estación Central): en la foto de 1940, todo pavimento, con una
 *  isla ovalada en el medio. */
export const EXPLANADAS_COLON = [
  ['la explanada del Paseo de Julio', 2, 5, [[10452, 9902], [10452, 9850], [10612, 9850], [10645, 9876], [10645, 9902]]],
];
