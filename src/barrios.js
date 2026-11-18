// Los solares de los estadios, los hospitales, la cárcel y los otros edificios sueltos de los barrios
// (src/lugares/barrios.js los arma; tools/crece.mjs los despeja de casas). Cada uno: el nombre, la etapa en que
// aparece (y en la que se va, si se va), y las cuatro esquinas en píxeles del plano: A y B son el frente, D es la
// esquina del fondo del lado de A. `m`: cuánto hay que meterse desde esas esquinas (salen de `tools/esquina.mjs`,
// que da el cruce de los ejes de las calles: la vereda está unos metros adentro). `pasto`: un parque.
const s = (nombre, e, A, B, D, o = {}) => ({ nombre, e, hasta: 0, m: 8, P: [A, B, [B[0] + D[0] - A[0], B[1] + D[1] - A[1]], D], ...o });

export const SITIOS = {
  // ------------------------------------------------------------------------------------------------- las canchas
  gasometro: s('El Gasómetro', 5, [6794, 2183], [6379, 2234], [6805, 2539]), // Av. La Plata, de Inclán a Las Casas, hasta Mármol (1916)
  huracan: s('Cancha de Huracán', 6, [4926, 5735], [5031, 5944], [4710, 5786]), // Alcorta, de Luna a Colonia, hasta Miravé (1924)
  sportivo: s('Estadio de Sportivo Barracas', 5, [3572, 7033], [3332, 7028], [3617, 7259], { hasta: 6 }), // Luzuriaga, de Iriarte a Río Cuarto, hasta Perdriel (1920-1937)
  riverDarsena: s('Cancha de River en la Dársena Sur', 5, [6286, 11470], [6429, 11408], [6370, 11683], { hasta: 6 }), // Caboto y Pinzón (1915-1923)
  geba: s('Cancha de GEBA', 3, [17420, 3686], [17616, 3820], [17316, 3838], { m: 0, pasto: true }), // Dorrego, en Palermo (1902): el solar se despeja de árboles
  // ------------------------------------------------------------------------------------------ Las Heras y el norte
  penitenciaria: s('Penitenciaría Nacional', 1, [14770, 5335], [15015, 4807], [14286, 5006]), // Las Heras, Coronel Díaz, Juncal, Salguero (1877)
  rivadavia: s('Hospital Rivadavia', 1, [14444, 6147], [14726, 5881], [14231, 5866]), // Las Heras, de Austria a Bustamante (1887)
  ingenieria: s('Facultad de Derecho, en obra', 6, [13817, 6650], [13903, 6574], [13757, 6570], { m: 4 }), // Las Heras y Azcuénaga (1912-1938, sin terminar)
  clinicas: s('Hospital de Clínicas', 1, [12014, 6337], [12028, 6132], [12206, 6331]), // Córdoba, Junín, Paraguay, Uriburu (1881)
  medicina: s('Facultad de Medicina', 2, [12028, 6132], [12014, 6337], [11922, 6132]), // Córdoba, de Uriburu a Junín (1895)
  italiano: s('Hospital Italiano', 3, [11098, 2575], [11290, 2575], [11098, 2710]), // Gascón 450, de Potosí hacia el norte (1901)
  // --------------------------------------------------------------------------------------------------------- el sur
  muniz: s('Casa de Aislamiento', 1, [5814, 6155], [5947, 6833], [5392, 6238]), // Uspallata, de Monasterio a Vélez Sársfield, hacia el sur (1882; Hospital Muñiz desde 1904)
  caseros: s('Cárcel de Caseros', 1, [6223, 6227], [6249, 6359], [6421, 6187]), // Caseros y Pichincha (1877)
  patricios: { nombre: 'Parque de los Patricios', e: 3, hasta: 0, m: 8, pasto: true, P: [[6022, 4759], [5925, 3994], [5690, 3900], [5608, 4794]] }, // (1902)
  felicitas: s('Santa Felicitas', 1, [5665, 9040], [5585, 9047], [5672, 9115], { m: 2 }), // Isabel la Católica, entre Pinzón y Brandsen (1876)
  rusa: s('Iglesia Ortodoxa Rusa', 3, [7552, 9653], [7552, 9693], [7600, 9653], { m: 0 }), // Brasil 315, frente al Parque Lezama (1901)
  // ------------------------------------------------------------------------------------------------------ el centro
  spinetto: s('Mercado Spinetto', 2, [10043, 5951], [9857, 5950], [10040, 5771]), // Pichincha, Alsina, Matheu, Moreno (1894)
  cervantes: s('Teatro Cervantes', 5, [11965, 8112], [11965, 8165], [12030, 8112], { m: 0 }), // Córdoba y Libertad (1921)
  harrods: s('Harrods', 5, [11943, 9283], [12113, 9283], [11943, 9425], { m: 5 }), // Florida, Córdoba, San Martín, Paraguay (1914-1920)
  jockey: s('Jockey Club', 3, [11440, 9248], [11490, 9248], [11440, 9330], { m: 0 }), // Florida 559 (1897)
  moneda: s('Casa de Moneda', 1, [9272, 9560], [9180, 9560], [9272, 9692], { m: 0 }), // Defensa y México (1881)
};
