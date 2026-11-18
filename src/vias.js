// Las vías de los ferrocarriles, en píxeles del plano (fuentes/plano-1867.jpg), y cuándo estuvo cada una. Las usan
// src/tren.js (que las dibuja y hace andar los trenes) y tools/crece.mjs (para no inventar casas encima).
//   - Las de 1867 están calcadas a mano del plano, mirando recortes del escaneo: el Ferrocarril del Oeste (de la
//     Estación del Parque al Once y de ahí hacia Flores), el del Norte (del Retiro por la orilla hasta Palermo), el del
//     Sud (de Constitución a Barracas al Sud, cruzando el Riachuelo) y el de la Boca (de la Estación Venezuela, por el
//     Paseo Colón y la Casa Amarilla).
//   - El «tramway» del Paseo de Julio también es del plano; como vía de tren vale para los años en que la Estación
//     Central (1872–1897) unía las líneas del norte con las del sur.
//   - La salida nueva de Retiro (desde la estación de 1915) es la vía de hoy, de OpenStreetMap, ya puesta en el plano.
// desde: la primera etapa en que está (0 = 1867, 1 = 1888, 2 = 1895, 3 = 1905, 4 = 1910, 5 = 1921, 6 = 1940);
// hasta: la etapa en que ya no está (0 = sigue). doble: dos vías, con trenes que salen y llegan todo el tiempo y se
// pierden por el borde del plano; si no, una sola vía y un tren que va y vuelve entre sus dos puntas.
// electrico: desde qué etapa los trenes son eléctricos (Retiro–Tigre desde 1916, Once–Moreno desde 1923).
// alto: (px, py) → a cuántos metros del suelo va la vía (el viaducto de Palermo: src/viaducto.js); sin eso, a ras.

import { altoVia } from './viaducto.js';

/** De la Estación del Parque (el plano la rotula «Estacion Central») al Mercado 11 de Setiembre: cruza la Plaza del
 *  Parque en diagonal, sigue derecha por la calle del Parque, hace la ese de Callao, sube por Corrientes, dobla frente
 *  a los «Talleres del Ferro-Carril» y entra a la «Estacion» del Once. Se levantó en 1883. */
export const VIA = [
  [11615, 8232], [11615, 8150], [11615, 8100], [11611, 8070], [11600, 8044], [11580, 8020], [11552, 8002], [11520, 7988], // la estación y la plaza
  [11488, 7975], [11460, 7960], [11436, 7940], [11418, 7918], [11408, 7892], [11405, 7860],
  [11404, 7700], [11405, 7400], [11406, 7150], [11407, 7030], // la calle del Parque
  [11404, 6975], [11395, 6935], [11374, 6898], [11345, 6865], [11318, 6838], [11288, 6812], [11258, 6789], [11232, 6762], [11215, 6728], [11208, 6690], [11207, 6640], // la ese de Callao
  [11217, 6560], [11225, 6400], [11232, 6240], [11238, 6130], [11254, 5813], [11271, 5553], [11286, 5380], [11295, 5262], // Corrientes
  [11294, 5228], [11285, 5198], [11263, 5168], [11230, 5143], [11176, 5125], [11107, 5109], [11019, 5088], [10933, 5065], // la curva de los talleres
  [10847, 5042], [10785, 5025], [10733, 5000], [10696, 4974], [10672, 4946], [10655, 4903], [10645, 4838], [10649, 4769], [10663, 4705], [10681, 4659], // la entrada a la estación
];
const BOCA = [[8100, 9960], [7644, 9951], [7200, 9927], [6889, 9904], [6622, 9900], [6356, 9933], [6156, 10000], [5933, 10093], [5756, 10156], [5600, 10211], [5467, 10251]];
const COLON = [[9300, 9870], [8860, 9860], [8400, 9920]];

const SUD = [[6800, 8150], [6400, 8138], [5822, 8116], [5133, 8062], [4564, 8003], [4350, 7992], [4150, 8005], [3722, 8062], [2878, 8176], [2389, 8256], [1944, 8333], [1500, 8389]];

export const LINEAS = [
  { clave: 'parque', nombre: 'Ferrocarril del Oeste, de la Estación del Parque al Once', desde: 0, hasta: 1, doble: false, enCalle: true, pts: VIA },
  { clave: 'oeste', nombre: 'Ferrocarril del Oeste, del Once hacia Flores', desde: 0, hasta: 0, doble: true, electrico: 6,
    pts: [[10668, 4930], [10664, 4800], [10672, 4700], [10690, 4600], [10712, 4500], [10733, 4344], [10751, 4011], [10733, 3789], [10700, 3589], [10644, 3322], [10578, 3011], [10467, 2744], [10333, 2456], [10200, 2144]] },
  { clave: 'norte', nombre: 'Ferrocarril del Norte, del Retiro a Palermo por la orilla', desde: 0, hasta: 5, doble: true,
    pts: [[12930, 9385], [12978, 9324], [13060, 9220], [14270, 7700], [14560, 7300], [14922, 6789], [15556, 5967], [16178, 5356], [16622, 4933], [17125, 4400], [17675, 3925], [17950, 3600], [18100, 3225], [18150, 3100]] },
  { clave: 'retiro', nombre: 'Ferrocarril Central Argentino, desde la estación Retiro de 1915', desde: 5, hasta: 0, doble: true, electrico: 5, alto: altoVia,
    pts: [[13177, 9411], [13404, 9124], [13455, 9032], [13492, 8966], [13592, 8890], [13627, 8855], [13915, 8625], [13999, 8542], [14166, 8339], [14223, 8276], [14326, 8179], [14627, 7913], [14729, 7808], [14837, 7670], [15059, 7337], [15320, 6900], [15413, 6776], [15514, 6666], [15661, 6531], [16431, 5905], [16671, 5728], [16878, 5561], [17040, 5411], [17114, 5323], [17193, 5207], [17251, 5107], [17315, 4977], [17368, 4838], [17389, 4766], [17414, 4652], [17429, 4549], [17442, 4393], [17482, 4145], [17515, 4033], [17565, 3921], [17613, 3845], [17821, 3557], [17929, 3392], [18172, 3054], [18259, 2902]] },
  // (El Sud, en dos: en 1867 la punta entra al cobertizo de la primera estación —src/lugares/viejos-1867.js—; desde 1888,
  // a la nave de la Constitución de 1887. La traza es la misma: `yaEstaba` le avisa a tools/crece.mjs que no hay nada que tirar.)
  { clave: 'sud', nombre: 'Ferrocarril del Sud, de Constitución a Barracas al Sud', desde: 0, hasta: 1, doble: true,
    pts: [[7150, 8184], [7060, 8184], [6960, 8172], [6860, 8156], ...SUD] },
  { clave: 'sud', nombre: 'Ferrocarril del Sud, de Constitución a Barracas al Sud', desde: 1, hasta: 0, doble: true, yaEstaba: true,
    pts: [[7203, 8151], [7141, 8148], [7040, 8152], ...SUD] },
  { clave: 'boca', nombre: 'Ferrocarril de la Boca, desde la Estación Venezuela', desde: 0, hasta: 1, doble: false, pts: [...COLON, ...BOCA] },
  { clave: 'central-sur', nombre: 'De la Estación Central a la Boca', desde: 1, hasta: 3, doble: false,
    pts: [[10520, 9880], [10440, 9915], [10240, 9918], [10100, 9900], [9700, 9880], ...COLON, ...BOCA] },
  { clave: 'central-norte', nombre: 'De la Estación Central al Retiro, por el Paseo de Julio', desde: 1, hasta: 3, doble: false, enCalle: true,
    pts: [[10535, 9884], [11000, 9890], [11600, 9900], [11920, 9840], [12200, 9730], [12500, 9600], [12700, 9510], [12900, 9395]] },
  { clave: 'casa-amarilla', nombre: 'De la Casa Amarilla a la Boca', desde: 3, hasta: 0, doble: false, pts: BOCA.slice(1) },
];
