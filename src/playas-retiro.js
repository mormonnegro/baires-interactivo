// Las playas de Retiro, el Puerto Nuevo y la Costanera Norte: lo que se calcó a mano para el suelo, en píxeles del
// plano (fuentes/plano-1867.jpg; x al norte, y al río). Lo usan tools/crece.mjs (qué calles se pintan, dónde hay
// tierra y dónde pasto) y src/lugares/playas-retiro.js (las vías, los galpones, la rambla).
//   · La zona: del frente de las estaciones de Retiro al río y hasta la punta norte del plano, toda tierra ganada. Las
//     calles de hoy que caen adentro (las de la Villa 31, los accesos a las autopistas, la Costanera de ahora, que va
//     por un relleno posterior) no son de 1921 ni de 1940: no se pintan.
//   · Las avenidas que sí estaban van trazadas acá, una por una, con la etapa en que entran.
//   · La costa de 1940 al norte del Puerto Nuevo: el borde de la rambla del plano de Peuser (1936).
// Qué sale de dónde: ver LEEME.md («El Puerto Nuevo, las playas de Retiro y la Costanera Norte»).

/** Adentro de este contorno no se pintan las calles de hoy. (Del lado del río sobra: ahí solo cuenta lo que es tierra.) */
export const ZONA_PLAYAS = [[13150, 9540], [13160, 9160], [14080, 8090], [14230, 8190], [14700, 7700], [15350, 6850], [15700, 6450], [16400, 5850], [17050, 5300], [17150, 5520], [17500, 5560], [17900, 5650], [19000, 5600], [19000, 11700], [13300, 11700], [13200, 10800], [13230, 10100], [13260, 9960], [13450, 9770]];

/** Las avenidas: [nombre, etapa en que entra (5: 1921 · 6: 1940), medio ancho en metros, la línea].
 *  Las tres primeras siguen la traza de hoy (OpenStreetMap), que es la del plano de Peuser: la avenida que baja de la
 *  Plaza Británica al puerto (el plano la rotula «San Martín» y «Maipú»; hoy, Comodoro Py), la avenida Edison a lo
 *  largo de las cabeceras de las dársenas (hoy, Ramón S. Castillo) y la que corre entre las playas y los depósitos
 *  (hoy, Antártida Argentina). La Costanera es la franja que el Peuser pinta entre los parques y el río. */
export const AVENIDAS = [
  ['al puerto', 5, 9, [[13190, 9932], [13251, 10009], [13353, 10107], [13581, 10321], [13960, 10617], [13996, 10648]]],
  ['Edison', 5, 9, [[13996, 10648], [14275, 10329], [14577, 9879], [14905, 9581]]],
  ['Edison, hasta la usina', 6, 9, [[14905, 9581], [15140, 9350], [15420, 9090], [15545, 8960]]],
  ['de las playas', 6, 8, [[13282, 9949], [13615, 9876], [13904, 9816], [14275, 9733], [14677, 9648], [14905, 9581]]],
  ['Costanera', 6, 11, [[15545, 8960], [15545, 8330], [15600, 8120], [15790, 7960], [16050, 7880], [16290, 7830], [16400, 7700], [16450, 7575], [16540, 7275], [16770, 6975], [17020, 6675], [17300, 6375], [17610, 6075], [17800, 5875], [17900, 5765]]],
];

/** La orilla de 1940 al norte del espigón 6: el borde de la rambla (de sur a norte). */
export const COSTA_NORTE = [[16593, 8300], [16440, 8100], [16405, 7910], [16495, 7613], [16585, 7313], [16815, 7013], [17065, 6713], [17345, 6413], [17655, 6113], [17845, 5913], [17945, 5803], [18180, 5703]];
/** … y lo que esa orilla encierra del lado de tierra (para rellenar hasta ella lo que el calco del plano dejó en serrucho). */
export const TIERRA_NORTE = [...COSTA_NORTE, [18180, 5450], [17400, 5750], [16700, 6500], [16250, 7100], [16000, 7800], [16100, 7800]];
/** … y del lado del río (para sacar lo que el calco puso más allá de la rambla). */
export const RIO_NORTE = [...COSTA_NORTE, [18180, 6300], [17500, 7100], [16900, 7900], [16700, 8290]];

/** Dónde van los parques de la Costanera Norte: adentro de estos contornos, lo que el plano de Peuser pinta de verde.
 *  (El primero, la franja entre las vías y la avenida —del lado de tierra llega hasta la última vía, la del Pacífico—; el segundo, el parque redondeado del sur, al oeste de la laguna.) */
export const PARQUES_NORTE = [
  [[15150, 8300], [15145, 7995], [15505, 7605], [15925, 7035], [16255, 6615], [16705, 6195], [16945, 5895], [17145, 5685], [17450, 5560], [17900, 5600], [18000, 5800], [17830, 5900], [17640, 6100], [17330, 6400], [17050, 6700], [16800, 7000], [16570, 7300], [16480, 7600], [16305, 8008], [16150, 8340], [15930, 8300], [15930, 8215], [15560, 8215], [15560, 8300]],
  [[14880, 8250], [15480, 8350], [15490, 8650], [15400, 8860], [15210, 9040], [15100, 9010], [14940, 8760], [14880, 8450]],
];
