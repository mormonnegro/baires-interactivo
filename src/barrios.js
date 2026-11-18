// Los solares de los estadios, los hospitales, la cárcel y los otros edificios sueltos de los barrios
// (src/lugares/barrios.js los arma; tools/crece.mjs los despeja de casas). Cada uno: el nombre, la etapa en que
// aparece (y en la que se va, si se va), y las cuatro esquinas en píxeles del plano: A y B son el frente, D es la
// esquina del fondo del lado de A. `m`: cuánto hay que meterse desde esas esquinas (salen de `tools/esquina.mjs`,
// que da el cruce de los ejes de las calles: la vereda está unos metros adentro). `pasto`: un parque.
const s = (nombre, e, A, B, D, o = {}) => ({ nombre, e, hasta: 0, m: 8, P: [A, B, [B[0] + D[0] - A[0], B[1] + D[1] - A[1]], D], ...o });

export const SITIOS = {
  // ------------------------------------------------------------------------------------------------- las canchas
  gasometro: s('El Gasómetro', 5, [6794, 2183], [6379, 2234], [6805, 2539]), // Av. La Plata, de Inclán a Las Casas, hasta Mármol (1916)
  huracan: s('Cancha de Huracán', 6, [4926, 5735], [5031, 5944], [4710, 5786], { hasta: 7 }), // Alcorta, de Luna a Colonia, hasta Miravé (1924; la desarmaron desde 1942)
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
  moneda: s('Casa de Moneda', 1, [9272, 9560], [9180, 9560], [9272, 9692], { m: 0 }), // Defensa y México (1881)  // ------------------------------------------------------------------------------------------------- los de 1950
  // (src/lugares/obras-1950.js. Las esquinas salen de la foto aérea de 1965 del mapa de la Ciudad, llevada al plano con
  // fuentes/1965/aerea.mjs, y se cruzaron con tools/esquina.mjs y con fuentes/1965/cronologia.json)
  duco: s('Estadio de Huracán', 7, [4921, 5721], [5036, 5985], [4714, 5811], { m: 0 }), // Alcorta y Luna: el estadio de hormigón, más grande que la cancha vieja (1947-1949)
  hacienda: s('Ministerio de Hacienda', 7, [10091, 9773], [10232, 9773], [10091, 9886], { m: 0 }), // Hipólito Yrigoyen, Balcarce, Alsina, Paseo Colón (1939-1950)
  bnacionNorte: s('Banco de la Nación, primera etapa', 7, [10536, 9592], [10610, 9592], [10536, 9751], { m: 1 }), // la manzana de Rivadavia, Reconquista, Mitre y 25 de Mayo, menos la esquina del teatro viejo (1944)
  bnacionEste: s('Banco de la Nación, primera etapa', 7, [10458, 9670], [10536, 9670], [10458, 9751], { m: 1 }),
  derecho: s('Facultad de Derecho', 7, [14633, 7289], [14760, 7107], [14754, 7373], { m: 0 }), // Figueroa Alcorta 2263 (1949)
  aca: s('Automóvil Club Argentino', 7, [14804, 6218], [14834, 6104], [14703, 6192], { m: 0 }), // Libertador 1850, antes de Tagle (1942)
  cgt: s('Confederación General del Trabajo', 7, [8873, 10126], [8815, 10126], [8873, 10200], { m: 0 }), // Azopardo e Independencia (1950)
  monedaNueva: s('Casa de Moneda', 7, [14154, 9954], [14282, 10055], [14268, 9809], { m: 0 }), // en el relleno del Puerto Nuevo, Retiro (1944)
  guardacostas: s('Edificio Guardacostas', 7, [10826, 10193], [10959, 10193], [10826, 10244], { m: 0 }), // Eduardo Madero, de Perón hacia Sarmiento (1949)
  medicinaNueva: s('Facultad de Ciencias Médicas', 7, [12206, 6331], [12272, 6109], [12428, 6320], { m: 6 }), // Paraguay, Junín, Marcelo T. de Alvear, Uriburu (1944, primera etapa)
  cristobal: s('Mercado San Cristóbal', 7, [8958, 6876], [9047, 6876], [8958, 6932], { m: 0 }), // Independencia y Entre Ríos (1944)
  plata: s('Mercado del Plata, la obra', 7, [10828, 8456], [10986, 8456], [10828, 8511], { m: 0 }), // Carlos Pellegrini, de Perón a Sarmiento, hasta Carabelas (el mercado viejo se demolió en 1947)
};
