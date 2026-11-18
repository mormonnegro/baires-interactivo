// Las marcas: los lugares que hay que conocer, señalados sobre el plano con una etiqueta de papel. Cada una sigue a
// su lugar en la pantalla; al tocarla, la cámara va hasta ahí y la etiqueta cuenta qué era.
//   nivel 1: se ve desde lejos (los barrios y las plazas)   2: al acercarse (los edificios)   3: de cerca (las iglesias)
// Hay dos juegos: los lugares de cada época (los de 1867 y los que trae la línea de tiempo: cada marca sabe desde qué
// año vale y hasta cuál) y, si se pide, los de hoy (en rojo, como un sello puesto después), para ver dónde quedaría
// cada cosa. Los de hoy salen de tools/hoy.mjs.
import * as THREE from 'three';

/** [nombre, x, y en píxeles del plano, alto en metros (dónde se apoya la marca), nivel, nota, época]
 *  La época (si falta, la marca es de siempre) dice en qué etapas de la línea de tiempo vale: { desde, hasta }, y se
 *  ve si desde <= etapa < hasta (hasta 0: para siempre). Las etapas son las de src/epocas.js: 0 es 1867, 1 es 1888,
 *  2 es 1895, 3 es 1905, 4 es 1910, 5 es 1921 y 6 es 1940. Los edificios nuevos entran en la primera etapa que ya los
 *  encuentra hechos, igual que en src/hitos.js; los de 1867 se van en la etapa en que hitos.js los saca.
 *  Además: `ficha`, la clave en src/fichas.js cuando no es el nombre (hay dos Teatro Colón); `tapa`, la marca roja «de
 *  hoy» del mismo lugar, que se calla mientras esta esté (si no, se enciman las dos); `radio`, cuántos metros alrededor
 *  cuentan como tocar el edificio (los palacios ocupan una manzana entera); `velo`, qué se aclara al pasarle el mouse
 *  cuando no es un edificio (src/ficha.js): 'suelo' para lo que es suelo (una plaza, un dique, una avenida: las de
 *  nivel 1 ya lo son) y 'radio' para lo que son muchas cosas sueltas (los barcos de la rada). */
export const LUGARES = [
  ['Plaza de la Victoria', 10344, 9484, 20, 1, 'En el medio, la Pirámide de Mayo (1811), como quedó con la reforma de 1856.', { hasta: 1 }],
  // (las plazas que para 1888 ya tenían otro nombre —o habían dejado de ser mercados de carretas— lo cambian ahí)
  ['Plaza de Marte', 12512, 9112, 7, 1, 'El Retiro. Hoy, Plaza San Martín.', { hasta: 1 }],
  ['Plaza del Parque', 11590, 8003, 7, 1, 'De la estación de enfrente salió el primer tren, en 1857. Hoy, Plaza Lavalle.', { hasta: 1 }],
  ['Mercado Constitución', 7512, 8112, 3, 1, 'Plaza de carretas, con la estación del Ferrocarril del Sud al lado.', { hasta: 1 }],
  ['Mercado 11 de Septiembre', 10512, 4862, 3, 1, 'Plaza de carretas del oeste. Hoy, Plaza Miserere: el Once.', { hasta: 1 }],
  ['La Recoleta', 13929, 7047, 5, 1, 'El cementerio del Norte y, al lado, la iglesia del Pilar.'],
  ['La Boca', 5850, 11250, 6, 1, 'Casillas sueltas a orillas del Riachuelo.'],
  // (el arroyo: agua de 1867 a 1921 —tools/plano.mjs, MALDONADO—; en 1940 ya va entubado)
  ['Arroyo Maldonado', 16450, 3070, 4, 1, 'El límite con el partido de Belgrano. Lo cruza el Puente de Maldonado, en el camino de Santa Fe.', { hasta: 6, radio: 110 }],
  // (el Cabildo cambia cuatro veces, src/lugares/cabildo.js: la marca sigue a la torre, que sube, se va y vuelve)
  ['Cabildo', 10294, 9378, 32, 2, 'Con sus once arcos y la torre vieja, de 1765.', { hasta: 1 }],
  ['Cabildo', 10294, 9378, 46, 2, 'Reformado por Pedro Benoit: el frente a la italiana y la torre diez metros más alta.', { desde: 1, hasta: 2 }],
  ['Cabildo', 10294, 9378, 13, 2, 'Sin la torre ni los tres arcos del norte: se demolieron en 1889 para abrir la Avenida de Mayo.', { desde: 2, hasta: 6 }],
  ['Cabildo', 10294, 9378, 32, 2, 'Restaurado por Mario Buschiazzo en 1940: quedan cinco arcos, con una torre nueva.', { desde: 6 }],
  ['Catedral', 10497, 9445, 31, 2, 'El pórtico de doce columnas, empezado en 1822.'],
  ['Recova Vieja', 10336, 9594, 20, 2, '1803–1884. Partía la plaza en dos: de la Victoria y 25 de Mayo.', { hasta: 1 }],
  // (el primer Colón cerró en 1888 y el edificio, reformado, fue después la casa del Banco de la Nación: sigue en pie
  // en toda la línea de tiempo, con el rótulo que le toca a cada año)
  ['Teatro Colón', 10488, 9628, 28, 2, 'El primero, de 1857. Donde hoy está el Banco Nación.', { hasta: 2 }],
  ['Casa de Gobierno', 10334, 9830, 12, 2, 'Lo que quedaba del Fuerte.', { hasta: 3 }],
  ['Congreso Nacional', 10195, 9706, 17, 2, 'Acá sesionó el Congreso de 1864 a 1905. De Jonás Larguía.', { hasta: 4 }],
  ['Congreso viejo', 10195, 9706, 17, 3, 'Desde 1906, el Archivo General de la Nación. Se demolió en 1942.', { desde: 4, ficha: 'Congreso Nacional' }],
  ['Aduana Nueva', 10337, 9960, 38, 2, 'De Eduardo Taylor, 1857: un medio círculo metido en el río, con su muelle.', { hasta: 2 }],
  ['Muelle de pasajeros', 10940, 10250, 5, 2, 'De 1855. Hasta ahí llegaban los botes desde los barcos.', { hasta: 2 }],
  ['Estación Central', 10486, 9851, 8, 2, '', { hasta: 3 }],
  ['Estación del Parque', 11615, 8205, 10, 2, 'La primera del país (1857), del Ferrocarril del Oeste: todavía de madera. Donde hoy está el Teatro Colón.', { hasta: 1 }],
  ['Estación del Parque', 11615, 8205, 15, 2, 'La terminal de mampostería de 1872. Los trenes dejaron de llegar en 1883.', { desde: 1, hasta: 2 }],
  ['Estación del Norte', 12962, 9294, 8, 2, 'La del Ferrocarril del Norte, en el Retiro.', { hasta: 5 }],
  ['Estación del Sud', 7200, 8188, 10, 2, 'La primera Constitución (1865), del Ferrocarril del Sud, frente al mercado de carretas.', { hasta: 1 }],
  ['Fábrica de gas', 12950, 9525, 12, 2, 'El gas del alumbrado, desde 1856.', { hasta: 5 }],

  // --- lo que trae la línea de tiempo. El lugar de cada edificio es el de su cuerpo más alto en src/hitos.js, y el
  // alto, el de ese techo o esa cúpula: la etiqueta se apoya justo encima. ---
  ['Plaza de Mayo', 10340, 9560, 6, 1, 'Las dos plazas, unidas en 1884 al demolerse la Recova.', { desde: 1, hasta: 5 }],
  // (desde 1912 la Pirámide está en el medio: la marca de la plaza se corre al parterre del este)
  ['Plaza de Mayo', 10344, 9645, 6, 1, 'Con la Pirámide en el centro desde 1912.', { desde: 5 }],
  ['Plaza San Martín', 12512, 9112, 7, 1, 'El viejo Campo de Marte, con el monumento a San Martín.', { desde: 1 }],
  ['Plaza Lavalle', 11660, 7996, 7, 1, 'La vieja Plaza del Parque: se llama así desde 1878.', { desde: 1 }], // (corrida de la columna, que tiene su marca)
  ['Plaza Constitución', 7512, 8112, 3, 1, 'El mercado de carretas, hecho paseo entre 1884 y 1892.', { desde: 1 }],
  ['Plaza 11 de Septiembre', 10512, 4862, 3, 1, 'El mercado de carretas del oeste, hecho plaza. Hoy, Plaza Miserere.', { desde: 1, hasta: 6 }],
  ['Plaza 11 de Septiembre', 10503, 4940, 3, 1, 'Con el mausoleo de Rivadavia en el medio desde 1932. Hoy, Plaza Miserere.', { desde: 6 }],
  ['Estación Constitución', 7219, 8219, 29, 2, 'La de 1887, del Ferrocarril del Sud.', { desde: 1, tapa: 'Estación Constitución', radio: 60 }],
  ['Avenida de Mayo', 10317, 8694, 4, 1, 'Abierta en 1894 por el medio de las manzanas.', { desde: 2, tapa: 'Avenida de Mayo' }],
  ['Puerto Madero', 10329, 10550, 4, 1, 'Los diques, de 1889 a 1898, sobre tierra ganada al río.', { desde: 2, tapa: 'Puerto Madero' }],
  ['Banco de la Nación', 10488, 9628, 28, 2, 'En el edificio del primer Teatro Colón, reformado.', { desde: 2 }],
  ['Palacio de Aguas Corrientes', 11893, 6625, 23, 2, 'De 1894: adentro, los tanques de agua de la ciudad.', { desde: 2, tapa: 'Palacio de Aguas Corrientes', radio: 56 }],
  // (la marca va sobre el arco. Desde 1938 le faltan 17 m del lado sur: src/lugares/casa-rosada.js)
  ['Casa Rosada', 10335, 9768, 27, 2, 'Las dos casas unidas por el arco de Tamburini, terminada en 1898.', { desde: 3, hasta: 6, tapa: 'Casa Rosada', radio: 62 }],
  ['Casa Rosada', 10335, 9768, 27, 2, 'En 1938 le demolieron 17 metros del lado sur: por eso el arco ya no queda en el medio.', { desde: 6, tapa: 'Casa Rosada', radio: 62 }],
  ['Estación Once', 10716, 4950, 28, 2, 'La del Ferrocarril del Oeste, de 1898.', { desde: 3, tapa: 'Estación Once', radio: 56 }],
  ['Palacio del Congreso', 10331, 6842, 82, 2, 'De Víctor Meano, inaugurado en 1906.', { desde: 4, tapa: 'Congreso', radio: 60 }],
  ['Plaza del Congreso', 10329, 7160, 8, 2, 'Abierta para el Centenario, en 1910.', { desde: 4, velo: 'suelo' }],
  ['Teatro Colón', 11635, 8193, 39, 2, 'El de hoy, inaugurado en 1908 donde estaba la Estación del Parque.', { desde: 4, ficha: 'Teatro Colón (1908)', tapa: 'Teatro Colón de hoy', radio: 52 }],
  ['Tribunales', 11496, 7808, 37, 2, 'El Palacio de Justicia, habilitado en parte en 1910.', { desde: 4, radio: 62 }],
  ['Monumento de los Dos Congresos', 10329, 7050, 28, 2, 'Inaugurado el 9 de julio de 1914.', { desde: 5 }],
  ['Estación Retiro', 13109, 9440, 32, 2, 'La del Central Argentino, de 1915.', { desde: 5, tapa: 'Estación Retiro', radio: 70 }],
  ['Costanera Sur', 9205, 11452, 4, 2, 'El Balneario Municipal, de 1918.', { desde: 5, velo: 'suelo' }],
  ['Palacio Barolo', 10279, 7749, 101, 2, 'De Mario Palanti, 1923: cien metros sobre la Avenida de Mayo.', { desde: 6, tapa: 'Palacio Barolo' }],
  ['Correo Central', 11084, 9994, 41, 2, 'El Palacio de Correos y Telégrafos, de 1928.', { desde: 6, tapa: 'Palacio Libertad', radio: 56 }],
  // la Avenida de Mayo y el centro (src/lugares/avenida-de-mayo.js)
  ['Palacio Municipal', 10363, 9332, 48, 2, 'De 1893: el primer edificio de la vereda norte de la Avenida de Mayo.', { desde: 2, hasta: 5, radio: 45 }],
  ['Palacio Municipal', 10363, 9332, 48, 2, 'El de 1893, ensanchado hasta Rivadavia entre 1911 y 1914.', { desde: 5, radio: 55 }],
  ['La Prensa', 10364, 9272, 51, 2, 'El diario de José C. Paz, de 1898: arriba, la farola de bronce dorado.', { desde: 3, radio: 45 }],
  ['Confitería del Molino', 10457, 6901, 65, 2, 'De Francisco Gianotti, 1916: la torre de las aspas, frente al Congreso.', { desde: 5, radio: 45 }],
  ['Galería Güemes', 10735, 9266, 87, 2, 'De 1915: el primer rascacielos de la ciudad, con su faro a 87 metros.', { desde: 5, radio: 75 }],
  ['Gath & Chaves', 10785, 9198, 53, 2, 'La gran tienda de Florida y Cangallo, de 1914.', { desde: 5, radio: 55 }],
  // los modernos de 1940 y La Boca (src/lugares/modernos.js)
  ['Puente Transbordador', 5247, 11329, 52, 2, 'De 1914: una barquilla colgada de una viga de hierro cruzaba el Riachuelo.', { desde: 5, tapa: 'Puente Transbordador', radio: 50 }],
  ['Edificio Comega', 11151, 9847, 88, 2, 'De 1933, en Corrientes y Alem: 21 pisos revestidos de travertino.', { desde: 6, radio: 35 }],
  ['Edificio Safico', 11140, 9485, 92, 2, 'De 1934: una torre escalonada de 90 metros, a la manera de Nueva York.', { desde: 6, radio: 40 }],
  ['Ministerio de Obras Públicas', 9819, 8276, 93, 2, 'De 1936: el primer rascacielos del Estado. La 9 de Julio todavía no llegaba hasta acá.', { desde: 6, radio: 45 }],
  ['Luna Park', 11279, 10115, 19, 2, 'El estadio de Corrientes y Bouchard, de 1932; el techo es de 1934.', { desde: 6, tapa: 'Luna Park', radio: 60 }],
  ['Mercado de Abasto', 11562, 4466, 32, 2, 'De 1934: cinco bóvedas de hormigón que asoman a Corrientes.', { desde: 6, tapa: 'Abasto', radio: 75 }],
  ['La Bombonera', 5798, 10230, 25, 2, 'Inaugurada el 25 de mayo de 1940, con dos bandejas.', { desde: 6, tapa: 'La Bombonera', radio: 75 }],
  // las plazas viejas, con lo de cada época (src/lugares/plaza-lavalle.js y plaza-once.js)
  ['Parque de Artillería', 11499, 7886, 13, 2, 'El arsenal que le dio nombre a la plaza. De acá salió la Revolución de 1890.', { hasta: 3, radio: 16 }],
  ['Palacio Miró', 11835, 8058, 23, 2, 'La villa de los Miró Dorrego, de 1868: cantón de la Revolución del Parque, demolida en 1937.', { desde: 1, hasta: 6, radio: 26 }],
  ['Monumento a Lavalle', 11586, 7996, 22, 3, 'La columna de mármol de Pietro Costa, de 1887: nunca se movió de acá.', { desde: 1, radio: 7 }],
  ['Mausoleo de Rivadavia', 10503, 4852, 10, 2, 'De Rogelio Yrurtia, inaugurado en 1932: guarda los restos de Bernardino Rivadavia.', { desde: 6, radio: 20 }],
  ['Gruta de Constitución', 7648, 8096, 19, 2, 'Montaña de cemento con torreones y pasarelas, hecha entre 1885 y 1888 y demolida en 1914.', { desde: 1, hasta: 5, radio: 40 }],
  ['Monumento a Castelli', 7334, 8170, 10, 3, 'Bronce de Gustav Eberlein, inaugurado en mayo de 1910.', { desde: 4, radio: 25 }],
  // (los arroyos que el plano dibuja además del Maldonado: tools/plano.mjs, ARROYOS)
  ['Arroyo Manso', 14215, 5860, 4, 2, 'El Tercero del Norte. Baja por lo que hoy es la calle Austria hasta el puente del camino de Chavango, hoy Las Heras.', { hasta: 1, radio: 60 }],
  ['Arroyo Maciel', 3050, 11900, 4, 1, 'Del otro lado del Riachuelo, en Barracas al Sur. Con el Riachuelo y el río encierra la que se llamó Isla Maciel.', { radio: 160 }],
  // (la Plaza San Martín, src/lugares/plaza-san-martin.js: el monumento cambia de lugar y de pedestal)
  ['Monumento a San Martín', 12529, 9100, 7, 3, 'El San Martín de Louis-Joseph Daumas, inaugurado el 13 de julio de 1862: el primer monumento ecuestre del país.', { hasta: 1, radio: 12 }],
  ['Monumento a San Martín', 12543, 9087, 7, 3, 'El San Martín de Daumas (1862), sobre su pedestal bajo de mármol, con reja y faroles a gas.', { desde: 1, hasta: 4, radio: 12 }],
  ['Monumento a San Martín', 12543, 9087, 13, 2, 'Desde 1910, sobre el basamento de granito rojo de Gustav Eberlein: «al General San Martín y a los Ejércitos de la Independencia».', { desde: 4, radio: 20 }],
  ['Falucho', 12301, 9258, 6, 3, 'El monumento de Lucio Correa Morales: estuvo en esta plazoleta de 1897 a 1910.', { desde: 3, hasta: 4, ficha: 'Plaza San Martín', radio: 12 }],
  ['La Duda', 12470, 9115, 3, 3, 'Mármol de Louis-Henri Cordier, comprado en 1905.', { desde: 4, ficha: 'Plaza San Martín', radio: 8 }],
  ['Barranca de la plaza', 12605, 9300, 3, 2, 'Donde estuvieron los Cuarteles y el Pabellón Argentino: plantada en 1936.', { desde: 6, ficha: 'Plaza San Martín', radio: 70 }],
  // los parques de Palermo (src/lugares/palermo.js)
  ['Bosques de Palermo', 17109, 4569, 4, 1, 'El Parque Tres de Febrero, inaugurado el 11 de noviembre de 1875 en las tierras que fueron de Rosas.', { desde: 1, ficha: 'Parque Tres de Febrero', radio: 260 }],
  ['Jardín Zoológico', 15690, 4045, 8, 2, 'Abierto acá el 30 de octubre de 1888: cada animal, en un pabellón del estilo de su tierra.', { desde: 2, velo: 'suelo', radio: 150 }],
  ['El Rosedal', 16973, 3923, 4, 2, 'El jardín de rosas de Benito Carrasco, inaugurado el 24 de noviembre de 1914.', { desde: 5, tapa: 'Rosedal', velo: 'suelo', radio: 90 }],
  // el Retiro y la Plaza San Martín (src/lugares/retiro.js)
  ['Pabellón Argentino', 12571, 9256, 30, 2, 'El pabellón de hierro y vidrio de la Exposición de París de 1889: estuvo acá de 1894 a 1933.', { desde: 2, hasta: 6, radio: 55 }],
  ['Plaza Hotel', 12357, 9367, 42, 2, 'El primer gran hotel de lujo de la ciudad, de Ernesto Tornquist: abrió en 1909.', { desde: 4, radio: 40 }],
  ['Palacio Anchorena', 12739, 8972, 24, 2, 'Tres casas detrás de un solo portal, de Alejandro Christophersen.', { desde: 4, hasta: 6, ficha: 'Palacio San Martín', radio: 50 }],
  ['Palacio San Martín', 12739, 8972, 24, 2, 'El Palacio Anchorena: desde 1936, la Cancillería.', { desde: 6, radio: 50 }],
  ['Palacio Paz', 12392, 9034, 26, 2, 'La casa de José C. Paz, el fundador de La Prensa.', { desde: 5, hasta: 6, radio: 55 }],
  ['Palacio Paz', 12392, 9034, 26, 2, 'La casa de José C. Paz, el fundador de La Prensa: desde 1938, el Círculo Militar.', { desde: 6, radio: 55 }],
  ['Torre de los Ingleses', 12962, 9571, 61, 2, 'El regalo de los británicos para el Centenario: se inauguró en 1916.', { desde: 5, tapa: 'Torre Monumental', radio: 30 }],
  // (la plaza de la torre, src/lugares/plaza-britanica.js: el cartel va sobre el parterre del lado de Alem)
  ['Plaza Británica', 12876, 9508, 3, 2, 'La plaza de la torre, donde estuvo la fábrica de gas. Hoy, Fuerza Aérea Argentina.', { desde: 5, velo: 'suelo', radio: 60 }],
  ['Edificio Kavanagh', 12428, 9410, 121, 2, 'De 1936: 120 metros de hormigón.', { desde: 6, tapa: 'Edificio Kavanagh' }],
  ['Obelisco', 11195, 8373, 68, 2, 'De 1936, donde estaba la iglesia de San Nicolás.', { desde: 6, tapa: 'Obelisco' }],
  ['Avenida 9 de Julio', 10900, 8370, 4, 2, 'El primer tramo, de Bartolomé Mitre a Tucumán, de 1937.', { desde: 6, velo: 'suelo' }],
  // lo que rodeaba a la Plaza de la República hacia 1940, con sus carteles (src/lugares/obelisco-1940.js)
  ['El Trust Joyero Relojero', 11168, 8499, 46, 2, 'La joyería de Corrientes y Carlos Pellegrini, de 1925: la cúpula del reloj, frente al Obelisco.', { desde: 6, radio: 22 }],
  ['Edificio Díaz', 11049, 8234, 47, 2, 'La mueblería de Sarmiento 1113, con el chalet en la terraza (1927) y las torres de letras.', { desde: 6, radio: 30 }],
  ['Cine Gran Rex', 11250, 8732, 34, 2, 'De Alberto Prebisch, 1937: un frente liso de travertino y vidrio.', { desde: 6, radio: 30 }],
  ['Cine Teatro Ópera', 11170, 8728, 47, 2, 'De 1936, frente al Gran Rex: la torre redonda y la marquesina curva.', { desde: 6, radio: 32 }],
  ['Teatro Broadway', 11245, 8163, 37, 2, 'De Jorge Kálnay, inaugurado en 1930: la sala abajo y ocho pisos encima.', { desde: 6, radio: 30 }],
  ['Tabarís', 11230, 8783, 26, 3, 'El dancing de Corrientes 829, con el frente de 1937.', { desde: 6, radio: 14 }],
  ['El Guipur', 11459, 8485, 11, 3, 'El cartel colgante de Carlos Pellegrini 539, como se lo ve en una foto de 1937.', { desde: 6, ficha: 'Carteles de la Plaza de la República', radio: 6 }],

  // --- lo que está armado pieza por pieza en src/lugares/: cada cosa con su marca, para que se pueda tocar. Lo chico
  // va en el nivel 3 (se rotula recién de cerca); el lugar y el alto son los de cada archivo. ---
  // la Plaza de Mayo
  ['Monumento a Belgrano', 10344, 9705, 12, 3, 'Belgrano a caballo, frente a la Casa de Gobierno.', { desde: 1, radio: 14 }],
  ['Fuente de hierro', 10344, 9543, 5, 3, 'Una de las dos fuentes de 1870, a cada lado de la Pirámide.', { desde: 1, hasta: 2, ficha: 'Fuentes de hierro', radio: 12, velo: 'suelo' }],
  ['Fuente de hierro', 10344, 9671, 5, 3, 'La fuente de 1870 que quedó en el trazado de Thays.', { desde: 2, hasta: 5, ficha: 'Fuentes de hierro', radio: 12, velo: 'suelo' }],
  ['Pirámide de Mayo', 10344, 9578, 20, 2, 'Corrida 63 metros en 1912, hasta el centro de la plaza.', { desde: 5, radio: 16 }],
  // la Plaza del Congreso
  ['El Perdón', 10329, 7205, 5, 3, 'Mármol de Boverie, de 1896.', { desde: 4, radio: 14 }],
  ['El Pensador', 10329, 7411, 6, 3, 'De Rodin: en la plaza desde 1907.', { desde: 4, radio: 14 }],
  ['Plaza Lorea', 10329, 7493, 8, 3, 'La plaza vieja, partida en dos por la Avenida de Mayo.', { desde: 4, radio: 30, velo: 'suelo' }],
  ['Mariano Moreno', 10286, 7493, 8, 3, 'Bronce de Miguel Blay, de 1910.', { desde: 4, radio: 14 }],
  ['Kilómetro Cero', 10353, 7456, 4, 3, 'El monolito de 1935, de donde se miden las rutas.', { desde: 6, radio: 12 }],
  // la Diagonal Norte
  ['Diagonal Norte', 10690, 9071, 4, 2, 'Empezada en 1913: en 1936 llegó a la 9 de Julio y en 1940 ya estaba abierta hasta Lavalle.', { desde: 5, radio: 20, velo: 'suelo' }],
  ['Banco de Boston', 10592, 9235, 50, 2, 'De 1924, con su portada plateresca en la ochava.', { desde: 6, radio: 30 }],
  ['La Equitativa del Plata', 10507, 9229, 54, 3, 'De Alejandro Virasoro, 1929: art déco.', { desde: 6, radio: 26 }],
  ['Edificio Bencich', 10635, 9178, 56, 3, 'De Le Monnier, 1927: el de las dos cúpulas.', { desde: 6, radio: 28 }],
  ['Edificio Miguel Bencich', 10538, 9188, 49, 3, 'También de Le Monnier, de 1927.', { desde: 6, radio: 24 }],
  ['Banco Argentino Uruguayo', 10470, 9377, 56, 2, 'De Le Monnier, hacia 1928: la punta que da a la plaza.', { desde: 6, radio: 26 }],
  ['La Continental', 10783, 8988, 37, 2, 'De Bustillo: abrió en 1931 como Hotel Continental.', { desde: 6, radio: 30 }],
  // la 9 de Julio
  ['Estacionamiento subterráneo', 11421, 8424, 3, 3, 'Una de las rampas de la playa de 1937, debajo de la avenida.', { desde: 6, radio: 16, velo: 'suelo' }],
  // el río y el puerto
  ['La rada', 10700, 11700, 30, 2, 'Sin puerto, los barcos de ultramar fondeaban río adentro.', { hasta: 2, radio: 420, velo: 'radio' }],
  ['Carros de desembarco', 10650, 10120, 4, 3, 'Con el río bajo se llegaba a tierra en carros de ruedas altas.', { hasta: 2, ficha: 'La rada', radio: 60, velo: 'radio' }],
  ['Dársena Sur', 7146, 11403, 8, 2, 'De 1889: la primera obra del puerto de Madero.', { desde: 2, radio: 110, velo: 'suelo' }],
  ['Dique 1', 8205, 10567, 8, 3, 'Habilitado en 1890.', { desde: 2, ficha: 'Puerto Madero', radio: 55, velo: 'suelo' }],
  ['Dique 2', 9173, 10545, 8, 3, 'Habilitado en 1890.', { desde: 2, ficha: 'Puerto Madero', radio: 55, velo: 'suelo' }],
  ['Dique 3', 10224, 10523, 8, 3, 'Habilitado en 1892.', { desde: 2, ficha: 'Puerto Madero', radio: 55, velo: 'suelo' }],
  ['Dique 4', 11300, 10507, 8, 3, 'Habilitado en 1897.', { desde: 3, ficha: 'Puerto Madero', radio: 55, velo: 'suelo' }],
  ['Puente giratorio', 8687, 10557, 6, 3, 'Giraba para dejar pasar los barcos de un dique al otro.', { desde: 2, radio: 22 }],
  ['Puente giratorio', 9655, 10534, 6, 3, 'Giraba para dejar pasar los barcos de un dique al otro.', { desde: 2, radio: 22 }],
  ['Puente giratorio', 10787, 10513, 6, 3, 'Giraba para dejar pasar los barcos de un dique al otro.', { desde: 3, radio: 22 }],
  ['Puente giratorio', 11835, 10498, 6, 3, 'Giraba para dejar pasar los barcos de un dique al otro.', { desde: 3, radio: 22 }],
  ['Los docks', 10222, 10351, 22, 2, 'Los depósitos de ladrillo, con sus grúas: cinco en este dique, cuatro en los otros.', { desde: 3, radio: 40 }],
  ['Los docks', 8205, 10396, 22, 3, 'Los depósitos de ladrillo, cuatro por dique, con sus grúas.', { desde: 3, radio: 40 }],
  ['Los docks', 9172, 10374, 22, 3, 'Los depósitos de ladrillo, cuatro por dique, con sus grúas.', { desde: 3, radio: 40 }],
  ['Los docks', 11299, 10336, 22, 3, 'Los depósitos de ladrillo, cuatro por dique, con sus grúas.', { desde: 3, radio: 40 }],
  ['Elevadores de granos', 10224, 10693, 42, 2, 'Las torres que cargaban el trigo en las bodegas.', { desde: 3, radio: 50 }],
  ['Molinos Río de la Plata', 9203, 10726, 38, 2, 'El molino y los silos de Bunge y Born, desde 1902.', { desde: 3, radio: 50 }],
  ['Dársena Norte', 12350, 10500, 10, 2, 'Habilitada en 1897.', { desde: 3, radio: 110, velo: 'suelo' }],
  ['Yacht Club Argentino', 12215, 10858, 27, 3, 'La sede con su torre, de 1915.', { desde: 5, radio: 30 }],
  ['Fuente de las Nereidas', 8752, 11512, 7, 2, 'De Lola Mora, 1903: la mudaron acá en 1918.', { desde: 5, radio: 18, velo: 'suelo' }],
  ['Espigón', 8983, 11700, 6, 3, 'El espigón del balneario, de 1919.', { desde: 5, ficha: 'Costanera Sur', radio: 40 }],
  ['Cervecería Munich', 10062, 11158, 23, 2, 'De Andrés Kálnay, 1927.', { desde: 6, radio: 30 }],
  // el Puerto Nuevo (src/lugares/puerto-nuevo.js)
  ['Puerto Nuevo', 14493, 10900, 14, 1, 'Empezado en 1911; la primera parte se inauguró en 1919 y se terminó en 1928.', { desde: 5, radio: 140 }],
  ['Dársena A', 13742, 11250, 10, 3, 'La primera del Puerto Nuevo, la de los barcos de pasajeros.', { desde: 5, ficha: 'Puerto Nuevo', radio: 70, velo: 'suelo' }],
  ['Dársena D, en obra', 15300, 10000, 8, 3, 'En 1921 todavía la estaban dragando.', { desde: 5, hasta: 6, ficha: 'Puerto Nuevo', radio: 70, velo: 'suelo' }],
  ['Hotel de Inmigrantes', 12796, 10317, 24, 2, 'De 1906 a 1911: alojaba gratis cinco días a los recién llegados.', { desde: 5, radio: 45 }],
  ['Desembarcadero', 12658, 10255, 12, 3, 'La primera puerta para quienes llegaban de ultramar.', { desde: 5, ficha: 'Hotel de Inmigrantes', radio: 30 }],
  ['Usina de la CHADE', 15707, 9108, 58, 2, 'La usina Puerto Nuevo de la Compañía Hispano Americana de Electricidad.', { desde: 6, radio: 60 }],
  ['Usina de la Ítalo', 16330, 8890, 58, 2, 'La de la Compañía Ítalo Argentina de Electricidad.', { desde: 6, radio: 60 }],
  ['Escollera', 14400, 11846, 4, 3, 'La escollera exterior, de 2.720 m, abriga el antepuerto.', { desde: 5, ficha: 'Puerto Nuevo', radio: 40 }],
  // el subte de la Anglo, la línea A (src/lugares/subte-a.js): en la calle solo se ven las bocas
  ['Subte: Plaza de Mayo', 10276, 9589, 5, 3, 'La terminal. De acá salió el primer tren, el 1 de diciembre de 1913.', { desde: 5, ficha: 'Subte A', radio: 14 }],
  ['Subte: la boca de la Casa Rosada', 10286, 9763, 5, 3, 'La otra entrada a la terminal, en la vereda de la Casa de Gobierno.', { desde: 5, ficha: 'Subte A', radio: 14 }],
  ['Subte: Perú', 10333, 9264, 5, 3, 'Entre Bolívar y Perú.', { desde: 5, ficha: 'Subte A', radio: 24 }],
  ['Subte: Piedras', 10332, 8711, 5, 3, 'Entre Piedras y Tacuarí.', { desde: 5, ficha: 'Subte A', radio: 27 }],
  ['Subte: Lima', 10332, 8165, 5, 3, 'Entre Lima y Salta.', { desde: 5, ficha: 'Subte A', radio: 24 }],
  ['Subte: Sáenz Peña', 10331, 7614, 5, 3, 'Entre San José y Sáenz Peña, a una cuadra de la plaza del Congreso.', { desde: 5, ficha: 'Subte A', radio: 24 }],
  ['Subte: Congreso', 10424, 6822, 5, 3, 'Sobre Rivadavia, junto al palacio.', { desde: 5, ficha: 'Subte A', radio: 38 }],
  ['Subte: Pasco Sur', 10420, 6230, 5, 3, 'Media estación: solo el andén de los trenes que van a Caballito.', { desde: 5, ficha: 'Subte A', radio: 20 }],
  ['Subte: Pasco Norte', 10420, 6039, 5, 3, 'Media estación: solo el andén de los trenes que vuelven a Plaza de Mayo.', { desde: 5, ficha: 'Subte A', radio: 22 }],
  ['Subte: Alberti Sur', 10420, 5727, 5, 3, 'Media estación: solo el andén de los trenes que van a Caballito.', { desde: 5, ficha: 'Subte A', radio: 26 }],
  ['Subte: Alberti Norte', 10420, 5536, 5, 3, 'Media estación: solo el andén de los trenes que vuelven a Plaza de Mayo.', { desde: 5, ficha: 'Subte A', radio: 22 }],
  ['Subte: Plaza Once', 10424, 4953, 5, 3, 'Hasta acá llegaba la línea el día en que se inauguró.', { desde: 5, ficha: 'Subte A', radio: 29 }],
  ['Subte: Loria', 10412, 3807, 5, 3, 'Abierta el 1 de abril de 1914.', { desde: 5, ficha: 'Subte A', radio: 31 }],
  ['Subte: Castro Barros', 10337, 2939, 5, 3, 'Abierta el 1 de abril de 1914.', { desde: 5, ficha: 'Subte A', radio: 22 }],
  ['Subte: Río de Janeiro', 9850, 1830, 5, 3, 'La punta de la línea de abril a julio de 1914, cuando llegó a Caballito.', { desde: 5, ficha: 'Subte A', radio: 22 }],
  // los estadios, los hospitales y los edificios sueltos de los barrios (src/lugares/barrios.js)
  ['El Gasómetro', 6521, 2372, 18, 2, 'La cancha de San Lorenzo en Avenida La Plata, de 1916.', { desde: 5, radio: 127 }],
  ['Cancha de Huracán', 4874, 5850, 12, 2, 'En Alcorta y Luna desde 1924, todavía de tablones.', { desde: 6, radio: 91 }],
  ['Sportivo Barracas', 3472, 7163, 16, 2, 'El estadio de cemento de Iriarte y Luzuriaga, de 1920 a 1937.', { desde: 5, hasta: 6, radio: 73 }],
  ['Cancha de River', 6400, 11546, 8, 2, 'La de la Dársena Sur, de 1915 a 1923.', { desde: 5, hasta: 6, radio: 47, velo: 'suelo' }],
  ['Penitenciaría Nacional', 14651, 4907, 26, 2, 'El penal de Las Heras, de 1877: cinco pabellones en abanico.', { desde: 1, radio: 160 }],
  ['Hospital Rivadavia', 14479, 5874, 12, 2, 'El hospital de mujeres, en Las Heras desde 1887.', { desde: 1, radio: 118 }],
  ['Facultad de Derecho', 13830, 6572, 30, 2, 'El gótico de Las Heras, de Arturo Prins: quedó sin terminar.', { desde: 6, radio: 35 }],
  ['Hospital de Clínicas', 12117, 6232, 12, 2, 'El hospital viejo de la Facultad de Medicina, de 1881.', { desde: 1, radio: 62 }],
  ['Facultad de Medicina', 11968, 6235, 22, 2, 'La de 1895, sobre Córdoba.', { desde: 2, radio: 62 }],
  ['Hospital Italiano', 11194, 2642, 16, 2, 'En Gascón desde 1901.', { desde: 3, radio: 58 }],
  ['Casa de Aislamiento', 5670, 6520, 9, 2, 'El hospital de infecciosos, de 1882. Desde 1904, Hospital Muñiz.', { desde: 1, radio: 160, velo: 'suelo' }],
  ['Cárcel de Caseros', 6335, 6273, 16, 2, 'La Casa de Corrección de Menores, de 1877.', { desde: 1, radio: 41 }],
  ['Parque de los Patricios', 5811, 4362, 6, 2, 'De 1902, sobre los Corrales Viejos.', { desde: 3, radio: 160, velo: 'suelo' }],
  ['Santa Felicitas', 5629, 9081, 26, 2, 'De 1876, por Felicitas Guerrero.', { desde: 1, radio: 30 }],
  ['Iglesia Ortodoxa Rusa', 7576, 9673, 24, 2, 'La de las cúpulas azules, frente al Parque Lezama. De 1901.', { desde: 3, radio: 30 }],
  ['Mercado Spinetto', 9949, 5861, 12, 2, 'El mercado de Pichincha y Alsina, de 1894.', { desde: 2, radio: 56 }],
  ['Teatro Cervantes', 11998, 8139, 30, 2, 'De 1921: el plateresco de María Guerrero.', { desde: 5, radio: 30 }],
  ['Harrods', 12028, 9354, 36, 2, 'La tienda de Florida, de 1914 a 1920.', { desde: 5, radio: 52 }],
  ['Jockey Club', 11465, 9289, 24, 2, 'La sede de Florida 559, de 1897.', { desde: 3, radio: 30 }],
  ['Casa de Moneda', 9226, 9626, 14, 2, 'La de Defensa y México, de 1881.', { desde: 1, radio: 30 }],
  ['Sociedad Sportiva', 17270, 2494, 9, 2, 'El estadio de Palermo, de 1899 a 1914.', { desde: 3, hasta: 5, radio: 120, velo: 'suelo' }],
  ['Parque Lezama', 7200, 9740, 6, 2, 'La quinta de Lezama, parque público desde 1894.', { desde: 2, radio: 120, velo: 'suelo' }],
  ['Cancha de GEBA', 17466, 3829, 9, 2, 'La cancha de Gimnasia y Esgrima, sobre Dorrego: la de la selección.', { desde: 3, radio: 70, velo: 'suelo' }],
];
/** Las iglesias llegan de src/hitos.js sin época: acá, la que se va (San Nicolás, demolida en 1931, donde hoy está el Obelisco). */
const SE_VAN = { 'San Nicolás': 6 };

export function createMarcas(el, camera, cam, { mundo, lugares, alIr, suelo = () => 0 }) {
  const v = new THREE.Vector3(), marcas = [];
  // con el dedo hace falta más aire entre una etiqueta y otra
  const AIRE = matchMedia('(pointer: coarse)').matches ? 9 : 5;
  // (en las capturas de las herramientas, ?capture, lo nuevo no se anuncia: saldría el pulso a medio hacer)
  const ANUNCIA = !new URLSearchParams(location.search).has('capture');
  let abierta = null, sobre = null, etapa = 0, ultimo = [-400, null];
  const abrir = (m) => { if (abierta && abierta !== m) abierta.el.classList.remove('abierta'); abierta = m; m?.el.classList.add('abierta'); };
  let hoyOn = false, buscada = null; // (buscada: la marca de lo que se buscó, siempre a la vista)
  for (const [nombre, px, py, alto, nivel, nota, epoca] of lugares) {
    // (la época: `true` es una marca de hoy —así las pasa main.js—; si no, lo que diga LUGARES)
    const e = epoca === true ? { hoy: true } : epoca ?? {}, hoy = !!e.hoy;
    const [x, z] = mundo(px, py), d = document.createElement('div');
    d.className = `marca n${nivel}${hoy ? ' hoy' : ''}`;
    d.innerHTML = '<button class="tag" type="button"><b></b><i></i></button><span class="hilo"></span><span class="punto"></span>';
    d.querySelector('b').textContent = nombre; d.querySelector('i').textContent = nota || '';
    if (!nota) d.querySelector('i').remove();
    const m = { el: d, nombre, x, z, alto, nivel, hoy, dist: Math.hypot(x, z), w: 0, h: 0, ver: false,
      desde: e.desde ?? 0, hasta: e.hasta ?? (hoy ? 0 : SE_VAN[nombre] ?? 0), ficha: e.ficha ?? null, tapa: e.tapa ?? null, radio: e.radio ?? 0, velo: e.velo ?? (nivel === 1 ? 'suelo' : null), vale: true, pulso: 0 };
    d.querySelector('.tag').addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (!m.vale) return; // (no es de este año)
      if (abierta === m) { abrir(null); return; }
      abrir(m); m.w = 0; alIr(m);
    });
    el.appendChild(d); marcas.push(m);
  }
  addEventListener('keydown', (e) => { if (e.code === 'Escape') abrir(null); });
  // el orden en que se acomodan (las que no entran, no se muestran): de cerca mandan los edificios; de lejos, los barrios
  const deHoy = marcas.filter((m) => m.hoy), deEpoca = marcas.filter((m) => !m.hoy);
  const cerca = (l) => [...l.filter((m) => m.nivel === 2), ...l.filter((m) => m.nivel !== 2)];
  const ORDEN = { lejos: [...deHoy, ...deEpoca], cerca: [...cerca(deHoy), ...cerca(deEpoca)] };
  // cada marca de hoy, con las de época que la callan mientras estén (la roja del Obelisco sobra cuando ya está el Obelisco)
  for (const h of deHoy) h.tapan = deEpoca.filter((m) => m.tapa === h.nombre);
  /** Cambia de año: qué marcas valen en la etapa `e`. Las que dejan de valer se van (si era la abierta, con su ficha:
   *  avisa por `alCaer`); las que acaban de aparecer se anuncian un par de segundos con un pulso (la clase `nueva`). */
  function deEtapa(e, anuncia) {
    etapa = e;
    const enEtapa = (m) => m.desde <= e && (!m.hasta || e < m.hasta);
    for (const m of marcas) {
      const vale = enEtapa(m) && !(m.hoy && m.tapan.some(enEtapa));
      if (vale === m.vale) continue;
      m.vale = vale; clearTimeout(m.pulso); m.el.classList.remove('nueva');
      if (!vale) { if (sobre === m) { sobre = null; m.el.classList.remove('sobre'); } if (abierta === m) { abrir(null); api.alCaer?.(m); } }
      else if (anuncia && ANUNCIA && !m.hoy) { m.el.classList.add('nueva'); m.pulso = setTimeout(() => m.el.classList.remove('nueva'), 2800); }
    }
  }
  deEtapa(0, false);
  const api = {
    marcas,
    /** (lo pone src/ficha.js) a quién avisarle que la marca abierta dejó de existir al cambiar de año */
    alCaer: null,
    /** Pone cada marca en su lugar. `frente`: hasta dónde llegó la ola que levanta la ciudad. `solo`: si se pasa,
     *  una función que dice qué marcas pueden verse (a pie, solo las de alrededor). `e`: la etapa de la línea de
     *  tiempo que se mira (src/epocas.js): solo se ven las marcas de ese año. */
    update(frente, solo = null, e = etapa) {
      if (e !== etapa) deEtapa(e, true);
      ultimo = [frente, solo];
      const W = el.clientWidth, H = el.clientHeight, dist = cam.now.dist, puestas = [];
      // primero la abierta, después por importancia
      const base = dist < 2600 ? ORDEN.cerca : ORDEN.lejos, orden0 = abierta ? [abierta, ...base.filter((m) => m !== abierta)] : base, orden = buscada ? [buscada, ...orden0] : orden0;
      for (const m of orden) {
        if (m.vale === false) { if (m.ver) { m.ver = false; m.el.classList.remove('ver'); } continue; }
        const sube = Math.min(1, Math.max(0, (frente - m.dist) / 300));
        v.set(m.x, m.alto * sube + suelo(m.x, m.z), m.z).project(camera);
        // (aquella sobre cuyo edificio está el mouse se muestra aunque de tan lejos no le toque, y sin correr a las demás)
        let ver = (!solo || solo(m)) && (!m.hoy || hoyOn || m.fija === true) && v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05 && (m === abierta || m === sobre || m.fija === true || m.nivel === 1 || dist < (m.nivel === 2 ? 4200 : 1500));
        const sx = (v.x * 0.5 + 0.5) * W, sy = (-v.y * 0.5 + 0.5) * H;
        if (ver) {
          if (!m.w) { const t = m.el.firstChild; m.w = t.offsetWidth; m.h = t.offsetHeight; }
          const r = [sx - m.w / 2 - AIRE, sy - 26 - m.h - AIRE + 2, sx + m.w / 2 + AIRE, sy + 5];
          const pisa = puestas.some((p) => r[0] < p[2] && r[2] > p[0] && r[1] < p[3] && r[3] > p[1]);
          if (m !== abierta && m !== sobre && !m.fija && pisa) ver = false; else if (!(m === sobre && pisa)) puestas.push(r);
        }
        if (ver) { m.sx = sx; m.sy = sy; m.el.style.transform = `translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px)`; }
        if (ver !== m.ver) { m.ver = ver; m.el.classList.toggle('ver', ver); }
      }
    },
    cerrar: () => abrir(null),
    /** Resalta la marca del edificio sobre el que está el mouse (o ninguna, con null): la clase `sobre`. Si no estaba a
     *  la vista, aparece. Devuelve si cambió. */
    sobre(m) {
      if (m === sobre) return false;
      sobre?.el.classList.remove('sobre'); sobre = m; m?.el.classList.add('sobre');
      api.update(...ultimo); // (las marcas se acomodan solas: no hace falta volver a dibujar la ciudad)
      return true;
    },
    /** La marca cuya etiqueta (con su hilo y su punto) está bajo un punto de la pantalla, con `aire` píxeles de más
     *  alrededor; si hay varias, la que tiene la etiqueta más cerca. Para resolver los toques desde el lienzo. */
    enPunto(x, y, aire = 8) {
      let mejor = null, dMejor = Infinity;
      for (const m of buscada ? [buscada, ...marcas] : marcas) {
        if (!m.ver || !m.w || m.vale === false) continue;
        const arriba = m.sy - 26 - m.h;
        if (x < m.sx - m.w / 2 - aire || x > m.sx + m.w / 2 + aire || y < arriba - aire || y > m.sy + aire) continue;
        if (y > m.sy - 26 + aire && Math.abs(x - m.sx) > 14) continue; // (debajo de la etiqueta solo cuentan el hilo y el punto)
        const d = Math.hypot(x - m.sx, y - (arriba + m.h / 2)) - (m === buscada || m === abierta ? 1000 : 0);
        if (d < dMejor) { dMejor = d; mejor = m; }
      }
      return mejor;
    },
    /** Deja (o mueve) la marca de lo buscado: un sello rojo con su nota, que no se esconde. Al tocarla, la cámara va. */
    poner(nombre, px, py, nota) {
      if (!buscada) {
        const d = document.createElement('div');
        d.className = 'marca buscada';
        d.innerHTML = '<button class="tag" type="button"><b></b><i></i></button><span class="hilo"></span><span class="punto"></span>';
        buscada = { el: d, x: 0, z: 0, alto: 0, nivel: 2, hoy: false, fija: true, dist: 0, w: 0, h: 0, ver: false };
        d.querySelector('.tag').addEventListener('click', (e) => { e.stopPropagation(); alIr(buscada); });
        el.appendChild(d);
      }
      const [x, z] = mundo(px, py);
      Object.assign(buscada, { x, z, dist: Math.hypot(x, z), w: 0 });
      buscada.el.querySelector('b').textContent = nombre; buscada.el.querySelector('i').textContent = nota || '';
      return buscada;
    },
    quitar() { buscada?.el.remove(); buscada = null; },
    /** Muestra u oculta los lugares de hoy. */
    hoy(on) { hoyOn = on; if (!on && abierta?.hoy) abrir(null); },
    /** La etapa de la línea de tiempo que muestran las marcas. */
    get etapa() { return etapa; },
  };
  return api;
}
