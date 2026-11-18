// Cuántos pisos tiene cada casa. Lo dicen los censos (fuentes/censos/LEEME.md, punto 7): de cada zona de la ciudad y
// de cada etapa, qué parte de las casas era de un piso, de dos, de tres, de cuatro y de cinco o más. Acá están esos
// cuadros y el reparto: quién se queda como está, a quién le hacen los altos y dónde se tira una casa para levantar un
// edificio. Lo usan tools/2-ciudad.mjs (1867) y tools/crece.mjs (lo que sigue).
//
// Qué es dato y qué no: 1867, 1888 y 1895 salen de los censos de 1869, 1887 y 1895; 1905 y 1910 son una interpolación
// entre el de 1895 y el de 1914; 1921 es el de 1914 con un poco más; 1940 es un supuesto (no hay cuadro de 1936).
// El centro de 1940 —la mitad de las casas de cinco pisos o más, hasta catorce— es el más supuesto de todos: está
// puesto a ojo contra las fotos aéreas de esos años, donde entre las torres casi no queda casa baja.
// 1950 es otra extrapolación, como 1940 (fuentes/1965/LEEME.md, punto 3): no se consiguió ningún cuadro de pisos por
// zona ni del censo de 1947 ni del de 1960. Lo único de primera mano es la serie anual de permisos de edificación de
// toda la Capital: de 1941 a 1950 se autorizaron 22,4 millones de m² (dos veces y media lo de 1935–1940) en 172 mil
// permisos, a 130 m² por permiso —casi lo mismo que a fines de los años treinta—. O sea, mucha obra chica y mediana:
// el salto en el tamaño de las obras (265 m² por permiso en 1955, 440 en 1957) viene después. Por eso de 1940 a 1950
// la mezcla se corre poco: de las casas de uno y dos pisos a las de cinco o más pasan 6 puntos en el centro y en el
// norte cercano (el Barrio Norte y la Recoleta, que en la foto aérea de 1965 ya están llenos de casas de
// departamentos y en la de 1940 son casas con patio), 4,5 en el anillo, 1,5 en el norte lejano, 1,3 en el oeste (el
// Once, que entre las dos fotos casi no cambia) y casi nada en el sur. Cuánto de ese cambio de veinticinco años cae
// antes de 1950 no lo dice ninguna fuente: se le dio más o menos un tercio.
// Cuál casa de la cuadra es la alta no lo dice ningún censo: eso se sortea, con más suerte cerca de Florida, de la
// Avenida de Mayo y de las otras calles de edificios altos.

import { AÑOS } from '../src/etapas.js';

export const ZONAS = ['centro', 'anillo', 'norte cercano', 'norte lejano', 'sur cercano', 'La Boca', 'oeste', 'arrabal', 'orillas'];
export const AÑO = AÑOS; // (src/etapas.js)
// OBJETIVO[etapa][zona] = % de casas de 1, 2, 3, 4 y 5 o más pisos
export const OBJETIVO = [
  [[68.6, 27.2, 4.2, 0, 0], [88.9, 9.8, 1.2, 0, 0], [93.2, 6.7, 0.1, 0, 0], [98.4, 1.6, 0, 0, 0], [93.9, 5.9, 0.2, 0, 0], [50.9, 49.1, 0, 0, 0], [97.3, 2.7, 0, 0, 0], [96.0, 3.3, 0.6, 0, 0], [97.3, 2.6, 0.1, 0, 0]],
  [[46.2, 44.3, 8.5, 1.1, 0], [70.1, 26.2, 3.4, 0.2, 0], [79.3, 19.9, 0.7, 0.1, 0], [90.5, 8.7, 0.8, 0, 0], [85.9, 13.7, 0.4, 0, 0], [40.6, 58.2, 0.9, 0.3, 0], [88.1, 11.3, 0.6, 0, 0], [94.0, 5.7, 0.3, 0, 0], [94.3, 5.5, 0.2, 0, 0]],
  [[41.7, 45.3, 9.2, 2.9, 1.0], [67.1, 27.3, 4.6, 0.9, 0.2], [69.6, 26.3, 3.5, 0.5, 0.1], [77.7, 19.7, 2.4, 0.3, 0], [81.3, 17.5, 1.1, 0.1, 0], [48.2, 50.8, 1.0, 0, 0], [84.2, 13.7, 1.9, 0.2, 0], [89.4, 10.3, 0.3, 0, 0], [92.6, 7.1, 0.3, 0, 0]],
  [[33.7, 37.6, 16.5, 5.6, 6.7], [54.2, 33.5, 8.1, 2.1, 2.1], [52.8, 30.6, 10.7, 4.2, 1.7], [70.5, 23.7, 4.3, 1.0, 0.4], [72.6, 23.2, 3.2, 0.7, 0.4], [51.7, 45.4, 2.7, 0.2, 0], [73.8, 20.4, 4.2, 0.8, 0.8], [83.2, 15.1, 1.4, 0.2, 0.1], [90.8, 8.4, 0.7, 0.1, 0.1]],
  [[29.7, 33.8, 20.1, 6.9, 9.5], [47.8, 36.6, 9.9, 2.6, 3.0], [44.4, 32.7, 14.3, 6.0, 2.5], [66.9, 25.8, 5.2, 1.4, 0.6], [68.2, 26.0, 4.3, 1.0, 0.6], [53.4, 42.7, 3.6, 0.2, 0], [68.6, 23.7, 5.3, 1.1, 1.3], [80.1, 17.6, 1.9, 0.3, 0.2], [89.9, 9.1, 0.9, 0.1, 0.1]],
  [[24.7, 29.0, 24.7, 8.6, 13.1], [39.8, 40.5, 12.1, 3.4, 4.2], [33.8, 35.4, 18.8, 8.3, 3.6], [62.5, 28.3, 6.4, 1.9, 0.9], [62.7, 29.6, 5.6, 1.3, 0.8], [55.6, 39.3, 4.7, 0.3, 0], [62.0, 27.9, 6.7, 1.5, 1.8], [76.2, 20.6, 2.5, 0.4, 0.2], [88.8, 9.9, 1.1, 0.1, 0.1]],
  [[8, 12, 20, 10, 50], [18, 30, 16, 8, 28], [18, 30, 20, 11, 21], [48, 30, 10, 5, 7], [52, 33, 9, 3, 3], [52, 40, 6.5, 1, 0.5], [45, 30, 11, 5, 9], [68, 25, 4.5, 1.5, 1], [84, 14, 1.5, 0.3, 0.2]],
  // 1950: supuesto (ver arriba)
  [[6, 10, 18, 10, 56], [15, 28, 16, 8.5, 32.5], [14, 27, 20, 12, 27], [44, 31, 11, 5.5, 8.5], [50, 34, 9.5, 3.2, 3.3], [51.5, 40.3, 6.7, 1, 0.5], [42, 31, 11.5, 5.2, 10.3], [65, 27, 5, 1.8, 1.2], [81, 16.5, 1.8, 0.4, 0.3]],
];
// Hasta cuántos pisos llega lo que sale de corrido en cada zona (el «máximo razonable» de los mismos cuadros: lo más
// alto que anota el censo, el reglamento de 1910 —21 m sobre calle angosta, 32 m sobre avenida— y los edificios de la época)
const TOPE = [
  [3, 3, 3, 3, 3, 3, 3, 3, 3], [4, 4, 4, 3, 3, 4, 3, 4, 3], [6, 6, 5, 5, 5, 5, 5, 5, 5], [7, 6, 6, 5, 5, 5, 5, 5, 5],
  [8, 7, 7, 6, 5, 5, 7, 5, 5], [10, 9, 9, 7, 6, 5, 8, 6, 5], [14, 12, 12, 10, 8, 5, 10, 7, 5],
  [14, 12, 12, 11, 8, 5, 10, 7, 5], // (1950: los mismos topes, y uno más en el norte lejano —Palermo, sobre Santa Fe y Las Heras—)
];
// (cuántos pisos de más, en promedio, tienen los edificios de «cinco o más»: en 1914, de los 393 del centro, 168 tenían 5, 140 tenían 6 y 85 tenían 7 o más)
const DE_MAS = [0, 0, 0.5, 0.6, 1, 1.2, 2.4, 2.8];
// Y de cuántos pisos, por lo menos, es un edificio de «cinco o más» que se levanta en cada etapa. Hasta 1940, cinco.
// En 1950 ya es otra cosa: la casa de departamentos entre medianeras, con ascensor, que con la ley de propiedad
// horizontal (13.512, de 1948) se puede vender piso por piso. No baja de siete pisos y, con los topes de arriba, no
// pasa de doce fuera del centro. (Que arranque en siete es un supuesto; en La Boca y las orillas el tope manda y
// siguen siendo de cinco.)
const PISOS_MIN = [5, 5, 5, 5, 5, 5, 5, 7];

// Las zonas, con las calles que las separan, en metros desde la Plaza de Mayo (n hacia el norte, r hacia el río):
// Rivadavia, Córdoba, Santa Fe, Independencia, Garay · Callao – Entre Ríos, Pueyrredón – Jujuy, Bulnes – Boedo, Maipú – Chacabuco
const COR = 1069, SFE = 1460, IND = -969, GAR = -1760, CAL = -1730, PUE = -2990, BOE = -4130, CEN = -385, BOC = -350;
/** Desde qué etapa el centro y el anillo llegan por el norte hasta Santa Fe (1921): antes terminan en Córdoba, que es
 *  donde los cortan los cuadros de los censos. Para 1921 el Retiro y la Plaza San Martín ya eran centro (el Plaza
 *  Hotel es de 1909 y el Kavanagh, de 1936); que el corte se corra justo en 1921, y hasta Santa Fe, es un supuesto. */
export const E_SANTA_FE = 5;
/** La zona de un punto en la etapa e (0 = 1867 … 7 = 1950): cambia en 1921, cuando el centro y el anillo pasan de Córdoba a Santa Fe. */
export const zonaDe = (n, r, e = 0) => { const NOR = e >= E_SANTA_FE ? SFE : COR; return n >= IND && n < NOR && r >= CEN ? 0 : n >= IND && n < NOR && r >= CAL ? 1 : n >= COR && r >= CAL ? 2 : n >= COR && r >= BOE ? 3 : n >= GAR && n < IND && r >= CAL ? 4
  : n < GAR && r >= BOC ? 5 : n >= IND && n < COR && r >= PUE ? 6 : (n < GAR && r >= CAL) || (n >= GAR && n < COR && r >= BOE) ? 7 : 8; };
export const azar = (a, b) => { let t = (Math.imul(a | 0, 0x9e3779b1) ^ Math.imul((b | 0) + 0x7f4a7c15, 0x85ebca6b)) | 0; t = Math.imul(t ^ (t >>> 15), 0x2c1b3c6d); t = Math.imul(t ^ (t >>> 12), 0x297a2d39); return (((t ^ (t >>> 15)) >>> 0) + 0.5) / 4294967296; };
/** La zona de una manzana. Las del borde caen de un lado o del otro (hasta 120 m), para que el cambio no sea una raya. */
export const zonaDeManzana = (n, r, e = 0) => { const s = Math.round(n / 9) * 7919 + Math.round(r / 9); return zonaDe(n + (azar(s, 1) - 0.5) * 240, r + (azar(s, 2) - 0.5) * 240, e); };

// El tirón: cuánto llama a edificar en altura cada lugar (de 0 a 1). La plaza siempre; y las calles de los edificios
// altos, cada una desde que lo fue: Florida y San Martín, la Avenida de Mayo (1894), Corrientes, Santa Fe, Callao y
// Rivadavia hacia el Once. Es un supuesto: ordena las casas dentro de cada zona, no cambia cuántas hay de cada altura.
const EJES = [
  [[-600, -130], [1250, -170], 1, 0], [[1250, -170], [1650, -150], 1, 2], [[30, 0], [30, -1730], 1, 2], [[520, -100], [520, -1730], 0.85, 3],
  [[1460, -200], [1460, -3000], 0.75, 3], [[30, -1730], [1900, -1730], 0.7, 3], [[61, -1730], [61, -3600], 0.6, 3],
  // 1950: las avenidas de las casas de departamentos. En 1950 todavía son pocas fuera de ellas (el salto es después de
  // 1955), así que acá el tirón es fuerte y angosto: cae a la mitad a una cuadra (el quinto número, en metros; los de
  // arriba se abren con 450). Santa Fe hasta Palermo, Callao hasta la Recoleta, Las Heras, Pueyrredón, Córdoba y
  // Rivadavia hacia el oeste, por las esquinas de hoy (tools/esquina.mjs). Cabildo empieza a 250 m del borde del
  // plano: no entra. Que sean estas y no otras sale de las fotos aéreas de 1965 (fuentes/1965/aereas) y es un supuesto.
  [[1528, -1746], [1755, -2549], 1.25, 7, 150], [[1755, -2549], [2408, -3203], 1.25, 7, 150], [[2408, -3203], [3364, -4192], 1.1, 7, 150],
  [[1109, -1741], [1528, -1746], 1.25, 7, 150], [[1528, -1746], [1968, -1581], 1.25, 7, 150], [[1968, -1581], [2315, -1213], 1.1, 7, 150],
  [[1968, -1581], [2486, -2030], 1.2, 7, 150], [[2486, -2030], [2994, -2802], 1.1, 7, 150],
  [[59, -2997], [669, -2911], 1, 7, 150], [[669, -2911], [1324, -2705], 1, 7, 150], [[1324, -2705], [1755, -2549], 1.1, 7, 150], [[1755, -2549], [2486, -2030], 1.1, 7, 150],
  [[1109, -1741], [1324, -2705], 1.05, 7, 150], [[1324, -2705], [1525, -4182], 0.9, 7, 150],
  [[61, -1730], [59, -2997], 1, 7, 150], [[59, -2997], [25, -4372], 0.9, 7, 150],
];
const aTramo = (n, r, [an, ar], [bn, br]) => { const dn = bn - an, dr = br - ar, t = Math.max(0, Math.min(1, ((n - an) * dn + (r - ar) * dr) / (dn * dn + dr * dr))); return Math.hypot(n - an - t * dn, r - ar - t * dr); };
export const tiron = (n, r, e) => { let g = Math.exp(-Math.hypot(n, r) / 2500); for (const [a, b, peso, desde, ancho = 450] of EJES) if (e >= desde) g = Math.max(g, peso * Math.exp(-aTramo(n, r, a, b) / ancho)); return g; };

/** De la clase (1 a 4 pisos; 5 = cinco o más) a los pisos. u1, u2: dos números al azar de la casa. */
export const pisosDe = (clase, e, z, g, u1, u2) => (clase < 5 ? clase : Math.min(TOPE[e][z], Math.max(PISOS_MIN[e], 5 + Math.floor(DE_MAS[e] * (0.5 + g) * (u1 + u2)))));
export const claseDe = (pisos) => Math.min(5, Math.max(1, pisos));

const cupos = (T, N) => { const s = T.reduce((a, b) => a + b, 0), q = T.map((t) => (t / s) * N), c = q.map(Math.floor); let falta = N - c.reduce((a, b) => a + b, 0); for (const i of q.map((v, i) => [v - c[i], i]).sort((a, b) => b[0] - a[0]).map((p) => p[1])) { if (falta-- <= 0) break; c[i]++; } return c; };

/**
 * El reparto. `lotes`: [{ z, z5, n, r, sem, nace, muere, clase, fijo }] — la zona (y `z5`, la zona desde 1921 si es
 * otra: ver E_SANTA_FE; la casa pasa entonces al cuadro de su zona nueva, con los pisos que ya tenía), el lugar
 * (metros), una semilla, la etapa en que nace y en la que se va (0: nunca), la clase si ya la tiene (lo de 1867, los frentes de avenida) y si no se
 * puede tocar. Deja en cada lote `plan`: [[etapa, clase], …], primero con qué nace (si no traía clase) y después las
 * veces que se lo renueva (siempre a más pisos, a lo sumo dos veces y nunca antes de los quince años).
 * Etapa por etapa y zona por zona se llena el cupo de cada clase de abajo para arriba. Al cupo de una clase aspiran
 * las casas que ya son de esa altura y «la cola»: las casas nuevas y las que salieron de una clase más baja. Entran
 * primero las de menos tirón, con ventaja para las que ya estaban (`apego`: una casa en pie tiende a quedarse, y menos
 * cuanto más vieja) y con desventaja para las que vienen de abajo (a una casa que se tira no se la cambia por otra
 * apenas más alta si eso obliga a tirar la de al lado); las que no entran pasan a la cola de la clase que sigue. Así una parte de lo nuevo nace baja, a
 * una parte de lo viejo le hacen los altos y lo de más tirón termina en los edificios más altos.
 */
export function repartir(lotes, { hasta = AÑO.length - 1, beta = 4, apego = 1 } = {}) {
  // (porZona[0]: hasta 1910 · porZona[1]: desde 1921. Etapa por etapa y, adentro, zona por zona: una casa que cambia
  // de zona tiene que llegar a 1921 con lo que le pasó antes en la otra.)
  const porZona = [ZONAS.map(() => []), ZONAS.map(() => [])], informe = [];
  for (const l of lotes) { l.plan = []; l.cur = l.clase || 0; l.hecho = l.nace; l.ren = 0; porZona[0][l.z].push(l); porZona[1][l.z5 ?? l.z].push(l); }
  const gumbel = (l, e) => -Math.log(-Math.log(azar(l.sem, e * 31 + 7)));
  for (let e = 0; e <= hasta; e++) for (let z = 0; z < ZONAS.length; z++) {
    const vivos = porZona[e >= E_SANTA_FE ? 1 : 0][z].filter((l) => l.nace <= e && !(l.muere && l.muere <= e));
    if (!vivos.length) { informe.push({ z, e, n: 0 }); continue; }
    const cupo = cupos(OBJETIVO[e][z], vivos.length), porClase = [[], [], [], [], [], []];
    for (const l of vivos) { l.k = beta * tiron(l.n, l.r, e) + gumbel(l, e); porClase[l.cur].push(l); }
    let cola = porClase[0], nRen = 0; // (la cola: las casas nuevas sin clase y las que salen de una clase más baja)
    for (let c = 1; c <= 5; c++) {
      const libres = porClase[c].filter((l) => !l.fijo && l.ren < 2 && AÑO[e] - AÑO[l.hecho] >= 15), lugar = cupo[c - 1] - (porClase[c].length - libres.length);
      const pone = (l) => { if (l.cur) { l.ren++; nRen++; } l.cur = c; l.hecho = e; l.plan.push([e, c]); };
      if (c === 5) { for (const l of cola) pone(l); break; }
      const aspiran = libres.map((l) => [l.k - apego + 0.25 * (AÑO[e] - AÑO[l.hecho]) / 20, l, true]).concat(cola.map((l) => [l.k + (l.cur ? 2 : 0), l, false])).sort((a, b) => a[0] - b[0]);
      cola = [];
      aspiran.forEach(([, l, yaEstaba], i) => { if (i >= lugar) cola.push(l); else if (!yaEstaba) pone(l); });
    }
    const h = [0, 0, 0, 0, 0]; for (const l of vivos) h[l.cur - 1]++;
    informe.push({ z, e, n: vivos.length, hay: h.map((v) => (v * 100) / vivos.length), renovadas: nRen });
  }
  return informe.sort((a, b) => a.z - b.z || a.e - b.e);
}
/** El informe del reparto, en texto: de cada zona y etapa, lo que salió contra lo que dice el censo. */
export const cuadro = (informe) => informe.filter((f) => f.n).map((f) => `${ZONAS[f.z].padEnd(14)} ${AÑO[f.e]} ${String(f.n).padStart(6)} casas  ${f.hay.map((v) => v.toFixed(1).padStart(5)).join(' ')}   censo ${OBJETIVO[f.e][f.z].map((v) => v.toFixed(1).padStart(5)).join(' ')}   renovadas ${f.renovadas}`).join('\n');
