// Lo que hay que saber del escaneo del plano (fuentes/plano-1867.jpg, 18919 × 13272). Todo en píxeles del escaneo.
export const PLANO = {
  ancho: 18919, alto: 13272,
  // Las manzanas de Buenos Aires miden 140 varas y las calles 10: 150 varas (129,9 m) de esquina a esquina.
  // En el escaneo son 192,5 píxeles, así que un píxel son 0,675 m. (El plano es 1:8000.)
  metro: 0.675,
  // el centro de la Plaza de la Victoria: de ahí se miden las distancias
  plaza: [10335, 9485],
  // lo que queda dentro de la guarda
  marco: [1300, 1250, 18180, 12510],
  // el borde de adentro de la guarda, justo
  interior: [805, 750, 18148, 12532],
};

// El río, marcado a mano unos 50 m mar adentro de la orilla. Sirve de semilla: toda la tinta de olas que se toque con
// esta zona es agua. Incluye el título, la rosa de los vientos y la tabla de referencias, que están dibujados en el río.
export const AGUA = [
  [5450, 12560], [5850, 12360], [6250, 12230], [6700, 12120], [6700, 11990], [6850, 11850], [7000, 11520], [7070, 11050],
  [7190, 10830], [7480, 10530], [7690, 10290], [7850, 10110], [8133, 10175], [8300, 10110], [8733, 10025], [9233, 10008],
  [9733, 9965], [10067, 9925], [10200, 10060], [10500, 10060], [10733, 10040], [11067, 10025], [11400, 10085], [11500, 10160],
  [11800, 10175], [12067, 10125], [12400, 10058], [12800, 9940], [13300, 9600], [13750, 9250], [14180, 8950], [14210, 8300],
  [14390, 8120], [14750, 7700], [14790, 7330], [14930, 7270], [15290, 7130], [15470, 6880], [15610, 6740], [16000, 6420],
  [16360, 6100], [16720, 5960], [16900, 5810], [17250, 5780], [17610, 5450], [17900, 5090], [18200, 4740], [18300, 4400],
  [18300, 12600], [5450, 12600],
];

// El Riachuelo, calcado a mano sobre el escaneo: el eje del cauce, de la boca hacia arriba, en tres tramos con su ancho
// (en píxeles del escaneo). El plano lo dibuja con olas finas entre dos orillas y el lector no lo distingue del campo,
// así que para el suelo en color y para el relieve sale de acá (tools/hoy.mjs). Hasta el Puente Alsina el eje calza
// con el grabado a unos 10 m; más arriba, a unos 20 m. Los brazos, la laguna de Anderson y los arroyos finos no están.
export const RIACHUELO = [
  { ancho: 90, eje: [ // de la boca al puente de Barracas
    [6600, 12010], [6400, 12010], [6250, 12020], [6100, 12020], [5980, 11995], [5890, 11960], [5810, 11910],
    [5720, 11850], [5630, 11770], [5540, 11690], [5460, 11600], [5380, 11500], [5310, 11410], [5245, 11325],
    [5195, 11240], [5160, 11150], [5140, 11050], [5140, 10950], [5160, 10850], [5150, 10760], [5100, 10700],
    [5040, 10690], [4980, 10720], [4930, 10780], [4890, 10880], [4865, 10990], [4810, 11085], [4720, 11125],
    [4620, 11150], [4520, 11170], [4400, 11190], [4300, 11215], [4230, 11230], [4200, 11100], [4165, 11000],
    [4145, 10900], [4085, 10800], [4000, 10700], [3915, 10600], [3825, 10510], [3740, 10440], [3720, 10350],
    [3730, 10250], [3740, 10170], [3700, 10080], [3640, 10000], [3580, 9920], [3530, 9840], [3480, 9740],
    [3440, 9640], [3410, 9550], [3370, 9470], [3300, 9410], [3200, 9390], [3100, 9410], [3020, 9440], [2950, 9410],
    [2880, 9330], [2810, 9230], [2740, 9120], [2670, 9020], [2590, 8930], [2500, 8870], [2420, 8830],
  ] },
  { ancho: 48, eje: [ // del puente de Barracas al Puente Alsina
    [2420, 8830], [2370, 8760], [2340, 8680], [2320, 8600], [2320, 8520], [2400, 8440], [2420, 8360], [2410, 8280],
    [2390, 8200], [2360, 8120], [2340, 8040], [2360, 7960], [2380, 7900], [2360, 7840], [2300, 7810], [2200, 7830],
    [2100, 7860], [2020, 7850], [1960, 7790], [1950, 7720], [1990, 7660], [2070, 7620], [2160, 7570], [2260, 7500],
    [2350, 7430], [2380, 7350], [2360, 7280], [2300, 7230], [2220, 7180], [2150, 7120], [2080, 7030], [2000, 6950],
    [1900, 6900], [1800, 6920], [1750, 7000], [1720, 7100], [1670, 7160], [1620, 7150], [1590, 7080], [1560, 6990],
    [1500, 6920], [1420, 6900], [1350, 6930], [1310, 7010], [1260, 7080], [1170, 7110], [1090, 7060], [1050, 6960],
    [1035, 6840], [1040, 6720], [1075, 6610], [1160, 6545], [1280, 6550], [1390, 6580], [1480, 6640], [1570, 6710],
    [1660, 6770], [1750, 6790], [1830, 6760], [1860, 6690], [1850, 6600], [1790, 6530], [1700, 6470], [1630, 6400],
    [1590, 6300], [1540, 6220], [1510, 6130], [1530, 6050], [1600, 5990], [1690, 5940], [1770, 5880], [1800, 5790],
    [1800, 5700], [1810, 5620], [1870, 5580], [1950, 5590], [2010, 5650], [2060, 5730], [2110, 5800], [2170, 5835],
    [2250, 5810], [2315, 5750], [2360, 5670], [2385, 5590], [2380, 5510], [2325, 5455], [2240, 5420], [2140, 5390],
    [2060, 5350], [2010, 5290], [2010, 5210], [2060, 5140], [2140, 5080], [2240, 5040], [2350, 5030], [2470, 5040],
    [2560, 5030], [2610, 4990], [2580, 4900], [2545, 4820], [2535, 4720], [2550, 4630], [2545, 4540], [2490, 4470],
    [2400, 4440], [2300, 4440], [2240, 4490], [2200, 4570], [2175, 4670], [2150, 4770], [2100, 4850], [2030, 4885],
    [1945, 4850], [1885, 4770], [1890, 4680], [1940, 4590], [2020, 4530], [2070, 4460], [2100, 4380], [2105, 4300],
    [2130, 4200], [2160, 4130], [2250, 4085], [2350, 4075], [2450, 4075], [2540, 4120], [2610, 4200], [2680, 4235],
    [2760, 4225], [2850, 4180], [2885, 4105], [2860, 4025], [2790, 3990], [2720, 3975], [2655, 3925], [2640, 3850],
    [2680, 3795], [2750, 3775], [2860, 3765], [2945, 3715], [2960, 3640], [2900, 3575], [2810, 3525], [2750, 3440],
    [2720, 3340], [2700, 3250], [2640, 3210], [2580, 3230], [2555, 3300], [2500, 3340], [2400, 3295], [2300, 3285],
    [2200, 3310], [2140, 3290], [2120, 3210], [2150, 3140], [2250, 3110], [2370, 3090], [2415, 3010],
  ] },
  { ancho: 36, eje: [ // del Puente Alsina a la guarda
    [2415, 3010], [2400, 2900], [2360, 2800], [2300, 2700], [2230, 2600], [2160, 2500], [2090, 2400], [2000, 2330],
    [1900, 2290], [1800, 2290], [1720, 2340], [1670, 2420], [1620, 2500], [1540, 2570], [1470, 2590], [1410, 2540],
    [1400, 2470], [1450, 2420], [1540, 2380], [1620, 2320], [1650, 2260], [1620, 2200], [1540, 2170], [1400, 2140],
    [1250, 2120], [1100, 2100], [950, 2080], [870, 2050], [850, 1980], [880, 1880], [940, 1760], [1000, 1650],
    [1060, 1540], [1090, 1460], [1060, 1400], [980, 1360], [900, 1320], [830, 1260], [800, 1220],
  ] },
];

// El arroyo Maldonado, calcado igual que el Riachuelo: el plano lo trae en la esquina de Palermo, serpenteando desde la
// guarda de arriba hasta el «Puente de Maldonado» del camino de Santa Fe y, de ahí al río, en dos tramos rectos (el
// rótulo «Arroyo de Maldonado» va sobre el primero). El grabado lo dibuja de unos 5 m de ancho —es un signo, no una
// medida—: acá va de 11 m aguas arriba y de 15 m aguas abajo, para que se lea como agua. Se corta donde lo cruza un
// camino (el puente): si no, quien maneja no pasaría. Es agua de 1867 a 1921; en 1940 ya corre entubado (la obra
// es de los años treinta; la avenida Juan B. Justo, encima, de 1937: tools/crece.mjs lo tapa). Solo va al suelo en color (tools/hoy.mjs --suelo): no cuenta como
// río en «lo de hoy», así la tierra ganada al río sigue siendo la de la costa.
export const MALDONADO = [
  { ancho: 16, eje: [ // de la guarda al primer camino
    [14075, 742], [14089, 757], [14143, 811], [14193, 864], [14236, 907], [14286, 957], [14336, 1000], [14372, 1026],
  ] },
  { ancho: 16, eje: [ // de ahí al Puente de Maldonado
    [14402, 1046], [14443, 1071], [14500, 1107], [14557, 1143], [14614, 1179], [14657, 1207], [14682, 1236],
    [14689, 1271], [14686, 1314], [14680, 1400], [14678, 1500], [14688, 1580], [14712, 1628], [14755, 1658],
    [14800, 1662], [14825, 1652], [14865, 1690], [14920, 1740], [14980, 1790], [15040, 1840], [15100, 1890],
    [15160, 1928], [15210, 1968], [15240, 2020], [15250, 2080], [15270, 2130], [15297, 2162], [15320, 2192],
    [15342, 2217], [15380, 2230], [15425, 2232], [15475, 2240], [15530, 2250], [15570, 2262], [15590, 2275],
    [15607, 2300], [15600, 2325], [15590, 2355], [15570, 2380], [15550, 2397], [15527, 2415], [15520, 2450],
    [15522, 2490], [15512, 2515], [15515, 2540], [15540, 2560], [15580, 2580], [15630, 2595], [15680, 2615],
    [15730, 2637], [15780, 2657], [15815, 2680], [15846, 2712],
  ] },
  { ancho: 22, eje: [ // del puente al camino que lo cruza más abajo
    [15876, 2750], [15910, 2785], [15955, 2815], [16010, 2845], [16928, 3314],
  ] },
  { ancho: 22, eje: [ // y al río, pasando bajo las vías del Ferrocarril del Norte
    [16974, 3345], [17675, 3925], [18083, 4283], [18098, 4297], // (hasta el Polvorín, donde el plano lo corta: después, el bañado)
  ] },
];

// Los otros dos arroyos que el plano dibuja como agua (doble línea, con sus vueltas), calcados igual. El plano no trae
// más: los terceros del centro no figuran, y las fajas sombreadas del oeste y del sur son barrancas y bañados, no agua.
//  · el Manso (el «Tercero del Norte»): sin rótulo, baja por lo que hoy es la calle Austria, de French a Las Heras,
//    donde el plano le pone un puentecito; de ahí al río dibuja solo el zanjón de la barranca. Los planos de 1888 en
//    adelante ya traen ahí la cuadrícula (y el Hospital Rivadavia), sin arroyo: acá es agua nada más que en 1867.
//    Corre por lo alto: el relieve (tools/relieve.mjs) no lo baja al nivel del río.
//  · el Maciel: rotulado dos veces, del otro lado del Riachuelo (Barracas al Sur), con sus zanjas. Entra y sale por la
//    guarda de abajo. Siguió a cielo abierto mucho después de 1940: es agua en todas las etapas.
// `hasta`: el año de la primera etapa en que ya no corre a la vista (tools/crece.mjs lo tapa); sin `hasta`, siempre.
export const ARROYOS = [
  { nombre: 'Arroyo Manso', hasta: 1888, enLoAlto: true, tramos: [
    { ancho: 14, eje: [
      [13918, 5590], [13989, 5606], [14064, 5617], [14131, 5625], [14173, 5644], [14201, 5677], [14216, 5710], [14216, 5738],
      [14195, 5754], [14189, 5781], [14192, 5823], [14201, 5851], [14220, 5880], [14230, 5913], [14244, 5936], [14272, 5955],
      [14301, 5969], [14324, 5998], [14348, 6036], [14386, 6069], [14428, 6106], [14471, 6144], [14498, 6163],
    ] },
  ] },
  { nombre: 'Arroyo Maciel', tramos: [
    { ancho: 16, eje: [ // el curso, de guarda a guarda
      [1275, 12540], [1350, 12525], [1400, 12500], [1440, 12450], [1460, 12390], [1485, 12330], [1515, 12280], [1540, 12260],
      [1600, 12270], [1645, 12310], [1660, 12360], [1670, 12440], [1695, 12500], [1733, 12512], [1786, 12477], [1812, 12362],
      [1795, 12274], [1768, 12221], [1786, 12159], [1856, 12106], [1892, 12036], [1945, 12000], [2015, 11987], [2086, 11974],
      [2103, 11921], [2103, 11877], [2148, 11850], [2205, 11841], [2205, 11780], [2183, 11727], [2148, 11683], [2134, 11621],
      [2130, 11577], [2165, 11568], [2236, 11585], [2298, 11607], [2342, 11585], [2395, 11532], [2457, 11488], [2510, 11462],
      [2554, 11434], [2598, 11431], [2642, 11471], [2677, 11493], [2721, 11497], [2810, 11480], [2871, 11475], [2893, 11500],
      [2856, 11524], [2852, 11562], [2894, 11590], [2927, 11618], [2918, 11694], [2922, 11769], [2904, 11825], [2894, 11872],
      [2932, 11919], [2979, 11957], [2998, 11995], [2979, 12042], [2998, 12098], [3035, 12122], [3111, 12098], [3176, 12094],
      [3233, 12126], [3299, 12155], [3351, 12169], [3369, 12136], [3355, 12079], [3336, 12023], [3355, 11985], [3412, 11971],
      [3459, 11948], [3487, 11901], [3515, 11868], [3581, 11858], [3647, 11844], [3722, 11835], [3788, 11830], [3812, 11835],
      [3831, 11877], [3807, 11919], [3774, 11948], [3765, 11976], [3788, 11995], [3835, 11985], [3864, 11995], [3868, 12042],
      [3892, 12079], [3948, 12103], [4014, 12098], [4052, 12117], [4061, 12174], [4089, 12230], [4160, 12280], [4195, 12330],
      [4185, 12400], [4200, 12435], [4225, 12420], [4255, 12387], [4265, 12420], [4300, 12445], [4360, 12480], [4420, 12525],
    ] },
    // (las zanjas que le llegan del norte: el plano las dibuja de una sola línea)
    { ancho: 9, eje: [[2130, 11577], [2060, 11520], [2036, 11497], [1965, 11382], [1894, 11285]] },
    { ancho: 9, eje: [[2036, 11497], [1929, 11499], [1850, 11488], [1779, 11444], [1726, 11409]] },
    { ancho: 9, eje: [[2554, 11434], [2554, 11338], [2582, 11241], [2609, 11153], [2635, 11038]] },
    { ancho: 9, eje: [[2889, 11505], [2960, 11505], [3016, 11439], [3073, 11364], [3111, 11298], [3176, 11223], [3233, 11157], [3266, 11115]] },
    { ancho: 9, eje: [[3016, 11439], [3082, 11439], [3176, 11439], [3271, 11430], [3332, 11425]] },
    { ancho: 9, eje: [[2922, 11769], [3007, 11755], [3073, 11712], [3139, 11665], [3205, 11642], [3318, 11609]] },
    { ancho: 9, eje: [[3007, 11755], [3082, 11778], [3129, 11788], [3205, 11780]] },
    { ancho: 9, eje: [[3812, 11835], [3807, 11778], [3788, 11703], [3774, 11646], [3741, 11609], [3675, 11562], [3619, 11515], [3581, 11477], [3567, 11435]] },
    { ancho: 9, eje: [[3774, 11646], [3779, 11599], [3807, 11562]] },
  ] },
];

// Tierra firme pegada a la orilla que el lector del río tomaría por agua (lleva otra tinta, como las olas).
export const SECO = [
  [[12915, 9405], [13075, 9530], [12935, 9705], [12770, 9570]], // la Fábrica de gas, en el Retiro
  [[8960, 9548], [10136, 9548], [10136, 9853], [9752, 9867], [9464, 9891], [9392, 9944], [8960, 9980]], // los almacenes y la Aduana vieja, al sur del Fuerte
];

// Los carteles grandes ("PARTIDO DE …"): letras tan gruesas que parecerían galpones.
export const CARTELES = [
  [2600, 1950, 12000, 2520], // PARTIDO DE SAN JOSÉ DE FLORES
  [13800, 2180, 17900, 2560], // PARTIDO DE BELGRANO
];

// Los edificios que se levantan a mano (src/hitos.js): ahí no se reparten casas.
export const RESERVAS = [
  [10324, 9464, 10364, 9504], // la Pirámide
  [10240, 9572, 10432, 9616], // la Recova
  [10244, 9322, 10344, 9382], // el Cabildo
  [10440, 9586, 10536, 9670], // el Teatro Colón
  [10250, 9757, 10418, 9899], // la Casa de Gobierno
  [10240, 9925, 10435, 10035], // la Aduana Nueva
  [10455, 9826, 10540, 9875], // la Estación Central
  // (src/lugares/viejos-1867.js)
  [7059, 8164, 7232, 8218], [7021, 8126, 7091, 8143], [6989, 8210, 7125, 8224], // la Estación del Sud: el edificio con su patio y el cobertizo, el galpón del oeste y las cargas
  [10159, 9660, 10238, 9742], // el Congreso, en la ochava de Balcarce y Victoria
  [11582, 8107, 11649, 8289], // la Estación del Parque: la de madera de 1867 y la de mampostería que la reemplazó
  // (las plazas hechas a mano: lo que el lector tomaba por casas donde va una pieza de 1867)
  [12519, 9090, 12539, 9110], // el signo del monumento a San Martín, en la Plaza de Marte (src/lugares/plaza-san-martin.js)
  [11416, 7874, 11582, 7898], // el frente del Parque de Artillería, sobre la Plaza del Parque (src/lugares/plaza-lavalle.js)
];

// Negro lleno que no es una iglesia: los gasómetros y galpones de la Fábrica de gas, en el Retiro.
export const NO_IGLESIAS = [
  [12740, 9400, 13060, 9690],
];

// Las iglesias que están pegadas a su convento (el negro de una se junta con el del otro y no queda un rectángulo
// limpio): marcadas a mano sobre el plano. [x, y del centro, hacia dónde corre la nave (ux, uy), largo, ancho, frente]
// El frente es +1 si la fachada está en la punta hacia (ux, uy), y −1 si está en la otra.
export const IGLESIAS = [
  [10497, 9445, 1, 0, 100, 68, -1], // la Catedral: mira al sur, a la plaza
  [10024, 9312, 0, 1, 84, 32, 1], // San Ignacio: mira al este, a la calle Bolívar
  [9952, 9591, 1, 0, 128, 30, 1], // San Francisco: mira al norte, a la calle Alsina
  [10840, 9659, 0, 1, 82, 32, -1], // La Merced: mira al oeste, a la calle Reconquista
  [14034, 7200, 0, 1, 60, 30, 1], // el Pilar, en la Recoleta
];
