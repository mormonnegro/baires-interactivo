// Las fichas: qué era cada lugar en 1867, qué pasó después y qué hay hoy, con sus fotos de época. Y las de lo que trae
// la línea de tiempo (1888–1940): cada edificio, avenida o plaza nuevos, con quién lo hizo, cuándo y qué reemplazó.
// Los datos salen de Wikipedia en español (consultada en noviembre de 2026) y de las descripciones de Wikimedia
// Commons; donde las fuentes no coinciden o no alcanzan, el texto lo dice en vez de elegir.
// Las fotos son todas de dominio público, de Wikimedia Commons: su título, autor, licencia y dirección están en
// fotos.json (lo escribe tools/fotos.mjs); acá va lo que se lee al pie: qué se ve, de quién es y de cuándo.
import DATOS from './fotos.json';

const GONNET = 'Esteban Gonnet', PANUNZI = 'Benito Panunzi', JUNIOR = 'Christiano Junior';
const DESPUES = 'Posterior al plano.', SIN_AUTOR = 'Autor desconocido';

/** nombre del archivo → { que: lo que se ve, autor, fecha, nota? } */
const PIES = {
  'piramide-gonnet': { que: 'La Pirámide de Mayo en su lugar original, con la Catedral a la izquierda y la Curia al fondo.', autor: GONNET, fecha: '1864' },
  'victoria-panunzi': { que: 'La Plaza de la Victoria con la Pirámide, el Cabildo y la Recova Nueva.', autor: PANUNZI, fecha: '1867' },
  'victoria-recova-gonnet': { que: 'La Recova Nueva, del lado sur de la plaza; a la derecha, un ala del Cabildo y, detrás, las torres y la cúpula de San Ignacio.', autor: GONNET, fecha: '1864' },
  'victoria-catedral-gonnet': { que: 'La Catedral y, a su derecha, la Curia, vistas desde la plaza.', autor: GONNET, fecha: '1864' },
  'cabildo-gonnet': { que: 'El Cabildo con la torre vieja y los once arcos; adelante, la Pirámide.', autor: GONNET, fecha: '1864' },
  'cabildo-junior': { que: 'El Cabildo (a la izquierda), todavía entero, la Pirámide y la Catedral.', autor: JUNIOR, fecha: '1876', nota: 'Nueve años después del plano.' },
  'calle-victoria-panunzi': { que: 'La calle Victoria (hoy Hipólito Yrigoyen) hacia el oeste; al fondo, el Cabildo.', autor: PANUNZI, fecha: '1867' },
  'catedral-junior': { que: 'El frente de la Catedral desde la plaza; a la derecha, parte de la Curia.', autor: JUNIOR, fecha: '1876', nota: DESPUES },
  'recova-gonnet': { que: 'El Arco de los Virreyes, en el medio de la Recova; a la izquierda asoma el primer Teatro Colón.', autor: GONNET, fecha: '1864' },
  'recova-panunzi': { que: 'La Plaza 25 de Mayo: a la izquierda, la entrada del Fuerte; el edificio con arcos del centro es el primer Congreso.', autor: PANUNZI, fecha: '1867' },
  'recova-demolicion': { que: 'La demolición: queda en pie una sola ala. Detrás, el Correo y la Casa de Gobierno nuevos.', autor: JUNIOR, fecha: '1883–1884', nota: 'Commons la fecha el 25 de mayo de 1883, pero el arco central recién se tiró en agosto de ese año.' },
  'colon-agn': { que: 'La Recova con su arco, la Pirámide y, a la izquierda, el primer Teatro Colón.', autor: 'Archivo General de la Nación', fecha: '1875', nota: 'Posterior al plano: la plaza ya tiene canteros.' },
  'aduana-vista-gonnet': { que: 'La ciudad desde el río: a la izquierda, la Aduana Nueva; a la derecha, el techo del primer Teatro Colón.', autor: GONNET, fecha: '1864' },
  'rentas-gonnet': { que: 'A la izquierda, el viejo Fuerte; al centro, la Administración de Rentas Nacionales.', autor: GONNET, fecha: '1864' },
  'gobierno-junior': { que: 'La Casa de Gobierno en lo que quedaba del Fuerte y, a la derecha, el edificio nuevo del Correo.', autor: JUNIOR, fecha: '1876', nota: DESPUES },
  'aduana-gonnet': { que: 'La Aduana Nueva desde el Paseo de Julio, con la torre del faro.', autor: GONNET, fecha: '1864', nota: 'Adelante, las vías del tranvía a caballo del Ferrocarril del Norte.' },
  'aduana-muelle-gonnet': { que: 'El muelle de cargas de la Aduana, con sus grúas.', autor: GONNET, fecha: '1864' },
  'muelle-gonnet': { que: 'Las dos casillas de la entrada del muelle y, en la rada, los barcos fondeados.', autor: GONNET, fecha: '1864' },
  'muelle-panunzi': { que: 'Las casillas de entrada al muelle de pasajeros.', autor: PANUNZI, fecha: '1867' },
  'muelle-1867': { que: 'El muelle visto desde el río hacia la ciudad.', autor: 'Autor desconocido', fecha: '1867' },
  'tranvia-gonnet': { que: 'El tranvía a caballo del Ferrocarril del Norte frente al muelle de pasajeros.', autor: GONNET, fecha: 'c. 1864' },
  'central-junior': { que: 'La Estación Central que se construyó en 1872.', autor: JUNIOR, fecha: '1876', nota: 'No es lo que había en 1867: este edificio se inauguró cinco años después del plano.' },
  'viejos-sud-carretas': { que: 'Las carretas frente a la estación recién inaugurada.', autor: SIN_AUTOR, fecha: '1865' },
  'viejos-congreso-junior': { que: 'El Congreso desde la plaza: el pórtico de tres arcos con sus rejas, entre las casas vecinas.', autor: JUNIOR, fecha: '1876' },
  'viejos-congreso-frente': { que: 'El frente, con el escudo en el frontis.', autor: SIN_AUTOR, fecha: 'sin fecha' },
  'viejos-parque-cerrito': { que: 'El frente de la terminal sobre Cerrito, desde la esquina de Tucumán.', autor: SIN_AUTOR, fecha: 'hacia 1875', nota: 'Posterior al plano.' },
  'viejos-parque-nave': { que: 'La nave de hierro de los andenes, entre las dos alas, mirando hacia la plaza.', autor: 'Archivo General de la Nación', fecha: 'entre 1875 y 1884', nota: 'Posterior al plano.' },
  'parque-junior': { que: 'La estación con la terminal de 1872. En el frontis: «el primero en la República Argentina, inaugurado el 30 de agosto de 1857».', autor: JUNIOR, fecha: 'década de 1870', nota: 'Posterior al plano: en 1867 el edificio era de madera.' },
  'pampero-gonnet': { que: 'La locomotora Pampero, del Ferrocarril del Oeste, probablemente en la Plaza del Parque.', autor: GONNET, fecha: '1864' },
  'plazaparque-gonnet': { que: 'La plaza desde la estación: las vías, los faroles de gas y, al fondo, la entrada del Parque de Artillería.', autor: GONNET, fecha: '1864' },
  'norte-gonnet': { que: 'La estación del Retiro con los coches del tranvía a caballo.', autor: GONNET, fecha: '1864' },
  'gas-gonnet': { que: 'La fábrica de gas al borde del río; adelante, las vías del Ferrocarril del Norte.', autor: GONNET, fecha: '1864' },
  'gas-junior': { que: 'La fábrica con sus gasómetros.', autor: JUNIOR, fecha: '1876', nota: DESPUES },
  'marte-gonnet': { que: 'El Paseo de Marte visto desde los cuarteles del Retiro, con artilleros y sus cañones.', autor: GONNET, fecha: '1864' },
  'sanmartin-gonnet': { que: 'El monumento a San Martín, inaugurado dos años antes.', autor: GONNET, fecha: '1864' },
  'constitucion-gonnet': { que: 'Las tropas de carretas en el Mercado de Constitución.', autor: GONNET, fecha: '1864' },
  'once-panunzi': { que: 'Carretas en la plaza 11 de Septiembre.', autor: PANUNZI, fecha: '1865' },
  'recoleta2-panunzi': { que: 'El paredón del cementerio y la iglesia del Pilar.', autor: PANUNZI, fecha: '1867' },
  'pilar-gonnet': { que: 'La iglesia del Pilar: la torre a la izquierda y la espadaña de doble arco a la derecha.', autor: GONNET, fecha: '1864' },
  'boca-1870': { que: 'Veleros en el Riachuelo, en la Boca.', autor: 'Autor desconocido', fecha: 'c. 1870', nota: 'Unos años posterior al plano.' },
  'riachuelo-junior': { que: 'Casas de madera y mástiles en la ribera del Riachuelo.', autor: JUNIOR, fecha: '1877', nota: DESPUES },
  'paseocolon-panunzi': { que: 'La ribera hacia el sur vista desde la Aduana Nueva: la chimenea del molino San Francisco y, detrás, las torres de Santo Domingo.', autor: PANUNZI, fecha: 'c. 1867' },
  'congreso-gonnet': { que: 'El primer Congreso y, a su derecha, asomando, la cúpula y las torres de San Francisco.', autor: GONNET, fecha: '1864' },
  'sanfrancisco-pellegrini': { que: 'San Francisco con su frente neoclásico y, a la izquierda, la capilla de San Roque.', autor: 'Litografía de Charles Pellegrini', fecha: 'c. 1850' },
  'santodomingo-vidal': { que: 'Santo Domingo cuando tenía una sola torre.', autor: 'Lámina de Emeric Essex Vidal', fecha: '1820', nota: 'En 1867 ya tenía las dos.' },
  'santodomingo-witcomb': { que: 'El frente con las dos torres, ya reformado en 1894 y todavía sin el mausoleo de Belgrano.', autor: 'Alexander Witcomb', fecha: 'c. 1900', nota: DESPUES },
  'merced-witcomb': { que: 'La Merced con su fachada original, la que tenía en 1867.', autor: 'Casa Witcomb', fecha: '1877', nota: 'La fachada se cambió desde 1894.' },
  'sannicolas-witcomb': { que: 'San Nicolás, sobre la calle Corrientes.', autor: 'Alexander Witcomb', fecha: 'década de 1890', nota: DESPUES },
  'sannicolas-antigua': { que: 'La iglesia ya en el siglo XX, antes de la demolición de 1931.', autor: 'Autor desconocido', fecha: 'antes de 1931' },
  'socorro-witcomb': { que: 'El frente y el atrio del Socorro.', autor: 'Archivo Casa Witcomb', fecha: 'c. 1880', nota: DESPUES },
  // --- las de la línea de tiempo: cada cosa cuando era nueva (o en obra). Donde Commons no dice quién la sacó, «autor
  // desconocido»; donde la fecha de Commons no cierra con lo que se ve, la nota lo dice. ---
  'plazamayo-photoglob': { que: 'La plaza desde la Casa de Gobierno: el monumento a Belgrano, la fuente, la Pirámide y, detrás, la Avenida de Mayo recién abierta. A la izquierda, el Cabildo, ya sin torre; a la derecha, la Catedral.', autor: 'Fotocromo de Photoglob', fecha: 'c. 1895–1900', nota: 'Commons la fecha en 1890, pero ya se ve la Avenida de Mayo, de 1894.' },
  'constitucion-witcomb': { que: 'El frente de la estación de 1887, con el letrero del Ferrocarril del Sud.', autor: 'Archivo Casa Witcomb', fecha: 'c. 1890' },
  'avmayo-gath': { que: 'La esquina de la Avenida de Mayo y Perú, con la tienda Gath & Chaves.', autor: SIN_AUTOR, fecha: '1910' },
  'puerto-dique2': { que: 'Uno de los depósitos del Dique 2 —el cartel dice «sección 4»—, con las grúas colgadas del frente.', autor: SIN_AUTOR, fecha: 'c. 1900' },
  'banco-1921': { que: 'La casa central del banco, con los frentes ya unificados por Büttner.', autor: 'Postal, autor desconocido', fecha: 'c. 1921' },
  'rosada-plaza': { que: 'La Casa Rosada desde la plaza, con el arco que une sus dos mitades. A la derecha, el ala sur todavía entera.', autor: SIN_AUTOR, fecha: 'década de 1890' },
  'rosada-1910': { que: 'La Casa Rosada vista desde una de sus esquinas, con carros en la calle empedrada.', autor: SIN_AUTOR, fecha: '1910' },
  'once-1900': { que: 'La estación sobre la plaza, con un tranvía eléctrico en la esquina.', autor: 'Postal de Mitchell’s Book Stores', fecha: 'c. 1900' },
  'congreso-obra': { que: 'El Congreso en obra, con la cúpula todavía entre andamios.', autor: SIN_AUTOR, fecha: '1906' },
  'congreso-1910': { que: 'El frente del Congreso, con la escalinata y las rampas para los coches.', autor: SIN_AUTOR, fecha: 'c. 1910' },
  'congreso-bourquin': { que: 'La Plaza del Congreso, el monumento y el Congreso, vistos desde lo alto del Palacio Barolo.', autor: 'Gastón Bourquin', fecha: 'c. 1925' },
  'plazacongreso-obra': { que: 'La plaza en obra: un árbol crecido llega en carro para ser plantado. Al fondo, el Congreso.', autor: SIN_AUTOR, fecha: 'c. 1910' },
  'colon-nuevo-agn': { que: 'El teatro a poco de inaugurarse: el frente sobre la calle Libertad y uno de los costados.', autor: 'Archivo General de la Nación', fecha: 'c. 1910' },
  'tribunales-obra': { que: 'El Palacio todavía con andamios, visto desde la Plaza Lavalle; adelante, la columna del monumento a Lavalle.', autor: SIN_AUTOR, fecha: 'c. 1910' },
  'tribunales-galeria': { que: 'Una de las galerías de adentro, con sus estatuas.', autor: 'Archivo General de la Nación', fecha: 'c. 1910' },
  'doscongresos-bk': { que: 'El monumento con su fuente y, detrás, el Congreso.', autor: 'Postal de Bourquin & Kohlmann', fecha: 'décadas de 1920 o 1930', nota: 'Commons solo dice «antes de 1950».' },
  'retiro-hall': { que: 'El gran hall, con las puertas a los andenes y las carteleras de horarios.', autor: 'Del folleto de la inauguración', fecha: '1915' },
  'costanera-1918': { que: 'El día de la inauguración. Según el epígrafe de la revista: «Monseñor Alberti, la escultora Lola Mora, el intendente y el coronel Martínez Urquiza, dirigiéndose al balneario».', autor: 'Revista Plus Ultra', fecha: '11 de diciembre de 1918' },
  'palermo-lago-1890': { que: 'Uno de los lagos del parque, con su quiosco en la isla.', autor: 'Photoglob Co. (fotocromo)', fecha: 'c. 1890' },
  'palermo-portones': { que: 'Los Portones de Palermo, la entrada del parque, donde hoy está la Plaza Italia.', autor: SIN_AUTOR, fecha: 'década de 1890' },
  'palermo-1916': { que: 'La avenida de los Lagos (hoy Infanta Isabel) un día de paseo: coches de caballos y automóviles. Al fondo, el lago y el Rosedal.', autor: 'Dirección Municipal de Paseos', fecha: 'c. 1916' },
  'rosedal-1914': { que: 'Un concierto en el Rosedal el año en que se inauguró; al fondo, la pérgola.', autor: SIN_AUTOR, fecha: '1914' },
  'barrios-gasometro': { que: 'El Gasómetro vacío: la estructura de hierro de las tribunas.', autor: SIN_AUTOR, fecha: 'hacia 1930' },
  'barrios-huracan': { que: 'La cancha vieja de Huracán, llena.', autor: SIN_AUTOR, fecha: 'entre 1920 y 1930' },
  'barrios-sportiva': { que: 'La tribuna de la Sociedad Sportiva.', autor: SIN_AUTOR, fecha: '1900' },
  'barrios-rivadavia': { que: 'El hospital, sobre la calle todavía de tierra.', autor: SIN_AUTOR, fecha: 'década de 1890' },
  'barrios-derecho': { que: 'El edificio sin terminar, sobre Las Heras.', autor: 'GEOPÉ', fecha: 'hacia 1925' },
  'barrios-clinicas': { que: 'El hospital sobre Córdoba, recién hecho.', autor: SIN_AUTOR, fecha: '1883' },
  'barrios-muniz': { que: 'Una ambulancia sale por el portón del hospital.', autor: SIN_AUTOR, fecha: 'hacia 1900' },
  'barrios-harrods': { que: 'La tienda sobre Florida. Archivo General de la Nación.', autor: SIN_AUTOR, fecha: '1939' },
  'barrios-lezama': { que: 'El lago del parque; al fondo, las cúpulas de la iglesia rusa.', autor: 'Harry Grant Olds', fecha: 'hacia 1900' },
  'barrios-penitenciaria': { que: 'La Penitenciaría desde la calle Las Heras.', autor: SIN_AUTOR, fecha: 'hacia 1900' },
  'zoo-elefantes-1904': { que: 'El templo hindú de los elefantes, con uno en la puerta.', autor: SIN_AUTOR, fecha: '1904' },
  'costanera-1935': { que: 'El balneario desde el aire: la rambla, el espigón y la gente en el agua. Al fondo, Puerto Madero.', autor: 'Municipalidad de Buenos Aires', fecha: '1935' },
  'barolo-1925': { que: 'El Barolo sobre la Avenida de Mayo; más allá, las cúpulas de La Inmobiliaria y, al fondo, el Congreso.', autor: SIN_AUTOR, fecha: 'c. 1925' },
  'barolo-zeppelin': { que: 'El Graf Zeppelin pasa sobre la Avenida de Mayo; a la izquierda, el Barolo.', autor: SIN_AUTOR, fecha: '30 de junio de 1934' },
  'correo-1930': { que: 'El frente principal del Palacio de Correos.', autor: SIN_AUTOR, fecha: 'década de 1930' },
  'kavanagh-cocina': { que: 'La cocina de uno de los departamentos, con heladera eléctrica.', autor: SIN_AUTOR, fecha: '1936' },
  'obelisco-obra': { que: 'El Obelisco en obra, dentro de su andamio.', autor: 'Archivo General de la Nación', fecha: '1936' },
  'obelisco-disandro': { que: 'La inauguración, desde el aire: todavía no existe la 9 de Julio, y el Obelisco está rodeado de manzanas.', autor: 'Juan Di Sandro', fecha: '23 de mayo de 1936' },
  'nuevedejulio-aerea': { que: 'El día de la inauguración: las cinco cuadras de la avenida, con el Obelisco en el medio.', autor: 'Municipalidad de Buenos Aires', fecha: '12 de octubre de 1937' },
  'nuevedejulio-postal': { que: 'La avenida recién abierta, con el Obelisco y los canteros nuevos.', autor: 'Postal coloreada, autor desconocido', fecha: 'c. 1937' },
  // (la Plaza de la República hacia 1940, src/lugares/obelisco-1940.js)
  'republica-trust-1936': { que: 'La esquina de Corrientes y Carlos Pellegrini: el Trust, con la cúpula del reloj y sus carteles, y a su derecha el esqueleto del edificio de la Diagonal Norte. Adelante, el Obelisco en obra.', autor: 'Archivo General de la Nación', fecha: '1936', nota: 'La copia de Wikimedia Commons está espejada: acá va dada vuelta, con los carteles al derecho.' },
  'republica-1937': { que: 'La plaza desde Carlos Pellegrini, mirando al sur. A la derecha del Obelisco, la casa de la cúpula de Corrientes y Cerrito y, detrás, el edificio Díaz con el chalet y las dos torres de letras. En el borde izquierdo, el cartel de El Guipur.', autor: SIN_AUTOR, fecha: '1937' },
  'republica-disandro-1937': { que: 'La plaza desde el aire, mirando al este: detrás del Obelisco, el Trust y el edificio blanco de la Diagonal Norte; Corrientes sube hacia la izquierda, con la torre redonda del Ópera.', autor: 'Juan Di Sandro', fecha: '1937' },
  'opera-grasser-1937': { que: 'El frente del Ópera sobre Corrientes: el cuerpo curvo, la torre, la marquesina y las letras.', autor: 'Franz Grasser', fecha: '1937' },
  'opera-coppola-1936': { que: 'La marquesina del Ópera de noche, con «Tiempos modernos» en cartel.', autor: 'Horacio Coppola', fecha: '1936' },
  'tabaris-1937': { que: 'El frente nuevo del Tabarís, con las letras sobre la marquesina.', autor: 'Revista de Arquitectura, n.º 197', fecha: 'mayo de 1937' },
  // --- las de las piezas de src/lugares/ y las que les faltaban a algunos edificios: todas de Wikimedia Commons, en
  // dominio público según la página de cada archivo (noviembre de 2026). ---
  'aguas-1890': { que: 'El Palacio recién terminado, entero, visto desde una esquina.', autor: SIN_AUTOR, fecha: 'década de 1890' },
  'aguas-1930': { que: 'El frente del Palacio, con autos, un tranvía y los cables en la calle.', autor: SIN_AUTOR, fecha: 'década de 1930' },
  'plazamayo-1931': { que: 'La Pirámide en el centro de la plaza, ya sin reja. Detrás, el Cabildo sin torre y el Palacio Municipal; a la izquierda, la torre de la Legislatura; a la derecha, la calle Rivadavia y la Catedral.', autor: SIN_AUTOR, fecha: '1931' },
  'piramide-traslado': { que: 'La mudanza: la Pirámide dentro de su armazón de madera, rodeada de curiosos.', autor: SIN_AUTOR, fecha: '1912' },
  'belgrano-1885': { que: 'La plaza recién unificada, con palmeras nuevas. A la izquierda, el monumento a Belgrano con su reja; al fondo, la Pirámide y el Cabildo con la torre de Benoit.', autor: SIN_AUTOR, fecha: '1885' },
  'fuente-1884': { que: 'Una de las dos fuentes, junto a la Pirámide, que todavía tiene su reja y sus estatuas. Detrás, el Cabildo con su torre vieja.', autor: 'Archivo General de la Nación', fecha: 'entre 1870 y 1879', nota: 'Commons la fecha en 1884, pero la torre es la anterior a la reforma de Benoit, de 1879.' },
  'plazamayo-sfa': { que: 'La plaza de Thays: la fuente que quedó en el medio de los canteros, el monumento a Belgrano y la Casa de Gobierno, con el ala sur entera.', autor: 'Sociedad Fotográfica de Aficionados', fecha: 'entre 1894 y 1912', nota: 'Commons solo dice «antes de 1920»: el trazado es el de 1894 y la Pirámide todavía no se mudó al centro.' },
  'plazacongreso-loc': { que: 'La plaza desde la Avenida de Mayo. A la izquierda, al borde, el monumento a Moreno; en el medio, el estanque con El Pensador y, en el cantero siguiente, el mármol de El Perdón. Al fondo, el Congreso, todavía con andamios.', autor: 'National Photo Company (Biblioteca del Congreso de los Estados Unidos)', fecha: 'c. 1910–1913', nota: 'La biblioteca la fecha entre 1908 y 1919; todavía no está el Monumento de los Dos Congresos, de 1914.' },
  'plazacongreso-detalle': { que: 'Detalle de la misma foto: El Pensador, oscuro, delante del estanque; en el cantero de atrás, blanco, El Perdón.', autor: 'National Photo Company (Biblioteca del Congreso de los Estados Unidos)', fecha: 'c. 1910–1913' },
  'pensador-1910': { que: 'El Pensador sobre su pedestal de piedra.', autor: SIN_AUTOR, fecha: 'c. 1910', nota: 'Commons no dice de dónde sale la foto.' },
  'plazalorea-rimathe': { que: 'La Plaza Lorea de antes del Centenario, con el tanque de agua en el medio.', autor: 'Samuel Rimathé', fecha: 'entre 1889 y 1910', nota: 'Commons solo dice «antes de 1930»: Rimathé llegó a Buenos Aires en 1889, y en las fotos del Centenario el tanque ya no está.' },
  'diagonal-coppola': { que: 'La Diagonal hacia la Plaza de Mayo, desde Suipacha: todos los frentes a la misma altura.', autor: 'Horacio Coppola', fecha: '1936' },
  'diagonal-1930': { que: 'La Diagonal desde lo alto, llena de autos y colectivos; por encima de la línea de los frentes asoman una torre y una cúpula.', autor: SIN_AUTOR, fecha: 'década de 1930', nota: 'Commons no dice qué cuadra es ni de dónde sale la foto.' },
  'boston-1924': { que: 'El banco iluminado de noche, el año en que se inauguró.', autor: SIN_AUTOR, fecha: '1924' },
  'boston-cupula': { que: 'La cúpula de tejas, recién terminada.', autor: SIN_AUTOR, fecha: '1924' },
  'equitativa-1930': { que: 'La Equitativa recién terminada, con el local de la Aeropostal en la esquina.', autor: SIN_AUTOR, fecha: 'c. 1930' },
  'bancouruguayo-1927': { que: 'El banco casi terminado: la torre ya está, pero la ochava sigue con andamios.', autor: SIN_AUTOR, fecha: '1927' },
  'continental-1931': { que: 'El Hotel Continental, con las columnas de tres pisos en el frente.', autor: 'Postal, autor desconocido', fecha: 'década de 1930' },
  'estacionamiento-1937': { que: 'La playa bajo la avenida, recién hecha, con sus columnas en forma de hongo.', autor: SIN_AUTOR, fecha: '1937' },
  'kavanagh-postal': { que: 'El Kavanagh desde la Plaza San Martín; a la derecha, el Plaza Hotel.', autor: 'Postal, autor desconocido', fecha: 'c. 1936' },
  'centro-prensa-1910': { que: 'El frente sobre la Avenida de Mayo, con la farola arriba de la cúpula.', autor: SIN_AUTOR, fecha: 'hacia 1910' },
  'centro-prensa-farola': { que: 'La farola subiendo a la cúpula. Atrás, el reloj del Palacio Municipal.', autor: 'Caras y Caretas', fecha: 'noviembre de 1898' },
  'centro-municipal-1900': { que: 'El palacio antes del ensanche, con la entrada en la esquina de Bolívar.', autor: SIN_AUTOR, fecha: 'hacia 1900' },
  'centro-municipal-1899': { que: 'Las fiestas mayas en la Plaza de Mayo. A la derecha, la esquina del palacio.', autor: 'Archivo General de la Nación', fecha: '25 de mayo de 1899' },
  'centro-molino-obra': { que: 'La confitería en obra, con el esqueleto de la torre.', autor: SIN_AUTOR, fecha: 'hacia 1915' },
  'centro-molino-postal': { que: 'Callao y Rivadavia desde la explanada del Congreso; el Molino, todavía con andamios.', autor: 'Postal', fecha: 'hacia 1915' },
  'centro-gath-1914': { que: 'La casa central desde la esquina, con la cúpula.', autor: SIN_AUTOR, fecha: 'hacia 1914' },
  'centro-gath-hall': { que: 'El hall central, con la escalera y las galerías de cada piso.', autor: SIN_AUTOR, fecha: '1913' },
  'mod-transbordador-1920': { que: 'El transbordador recién estrenado, con la casilla de máquinas arriba de una torre.', autor: 'National Photo Company', fecha: 'entre 1914 y 1920' },
  'mod-transbordador-1932': { que: 'La barquilla llena, cruzando el Riachuelo.', autor: 'Archivo General de la Nación', fecha: '1932' },
  'mod-comega-1930s': { que: 'El Comega desde Corrientes, con el Safico al fondo.', autor: SIN_AUTOR, fecha: 'década de 1930' },
  'mod-safico-1936': { que: 'Corrientes hacia el oeste y el Safico, desde lo alto del Comega.', autor: 'Horacio Coppola', fecha: '1936' },
  'mod-obraspublicas-1936': { que: 'El ministerio desde el oeste, detrás de la iglesia de Monserrat.', autor: 'Horacio Coppola', fecha: '1936' },
  'mod-lunapark-1932': { que: 'El Luna Park todavía sin techo, con el cartel en la ochava.', autor: SIN_AUTOR, fecha: '1931 o 1932' },
  'mod-abasto-1945': { que: 'Los arcos del Abasto sobre Corrientes, con los carros en la puerta.', autor: 'Archivo General de la Nación', fecha: 'hacia 1945' },
  'mod-bombonera-1939': { que: 'La Bombonera en obra.', autor: SIN_AUTOR, fecha: 'febrero de 1939' },
  'retiro-torre-1916': { que: 'La torre el día de la inauguración, con el palco y la multitud.', autor: SIN_AUTOR, fecha: '24 de mayo de 1916' },
  'retiro-torre-1932': { que: 'Chicos jugando a la pelota en el baldío, con la torre al fondo.', autor: SIN_AUTOR, fecha: '1932' },
  'retiro-plaza-1910': { que: 'El hotel recién abierto, con las marquesinas de la entrada.', autor: SIN_AUTOR, fecha: '1910' },
  'retiro-plaza-peuser': { que: 'El hotel desde Florida y Charcas, ya con el pabellón de la entrada. A la derecha, la casa de Tornquist.', autor: 'Fototipia Peuser', fecha: 'década de 1920' },
  'retiro-paz-1916': { que: 'El palacio desde la plaza.', autor: 'Revista Plus Ultra', fecha: 'junio de 1916' },
  'retiro-anchorena': { que: 'El palacio sobre la calle Arenales, con el portal entre dos de las casas.', autor: SIN_AUTOR, fecha: 'hacia 1910', nota: 'Commons la fecha en 1900, cuando todavía no estaba construido.' },
  'retiro-pabellon-sfa': { que: 'El pabellón desde la calle, con su reja.', autor: 'Sociedad Fotográfica Argentina de Aficionados', fecha: 'antes de 1932' },
  'retiro-pabellon-1900': { que: 'La cabecera del pabellón, desde la plaza.', autor: 'Eugenio Avanzi', fecha: '1900' },
  'retiro-1937': { que: 'El frente de la estación, con tranvías y colectivos en la puerta.', autor: SIN_AUTOR, fecha: '1937' },
  'cabildo-1915': { que: 'El Cabildo sin torre y con ocho arcos, como quedó entre 1889 y 1931. A la derecha, la Avenida de Mayo.', autor: 'Ministerio de Obras Públicas (Archivo General de la Nación)', fecha: 'diciembre de 1915', nota: DESPUES },
  'cabildo-1940': { que: 'El Cabildo recién restaurado: cinco arcos y la torre nueva.', autor: SIN_AUTOR, fecha: '1940', nota: DESPUES },
  'rosada-1928': { que: 'La Casa Rosada desde la esquina de Balcarce e Hipólito Yrigoyen, con una escolta de caballería: en primer plano, el ala sur entera, diez años antes de que la recortaran.', autor: 'Pacific and Atlantic Photos (Biblioteca Nacional de Francia)', fecha: '1928' },
  'rada-boote': { que: 'Veleros y botes fondeados frente a la ciudad, que se ve al fondo.', autor: 'Samuel Boote', fecha: 'década de 1880', nota: 'Commons no le pone fecha: la década es una estimación.' },
  'rada-vidal': { que: 'El desembarco antes del muelle: del bote al carro de ruedas altas.', autor: 'Acuarela de Emeric Essex Vidal', fecha: '1820' },
  'darsenasur-1915': { que: 'Un muelle de la Dársena Sur: carros, un camión, grúas y vapores amarrados.', autor: SIN_AUTOR, fecha: '1915' },
  'docks-1909': { que: 'Carros cargando bolsas al pie de los depósitos; arriba, una de las grúas del frente.', autor: SIN_AUTOR, fecha: '1909' },
  'elevadores-olds': { que: 'Los elevadores de granos del Dique 2, con vapores al pie.', autor: 'Harry Grant Olds', fecha: 'c. 1910' },
  'elevadores-1915': { que: 'Los elevadores del Ferrocarril Central Argentino, con barcos al pie.', autor: SIN_AUTOR, fecha: '1915' },
  'molinos-1910': { que: 'El molino, los silos y los depósitos, con las vías del puerto adelante y el dique a la izquierda.', autor: SIN_AUTOR, fecha: '1910' },
  'puerto-1915': { que: 'Un dique lleno de barcos, visto desde la Aduana; al fondo, molinos y elevadores.', autor: 'Diapositiva coloreada a mano (Oregon State University)', fecha: '1915' },
  'darsenanorte-1921': { que: 'La dársena desde el aire: un transatlántico amarrado y, en la punta del muelle, la sede del Yacht Club con su torre.', autor: 'Revista Plus Ultra', fecha: 'abril de 1921' },
  'darsenanorte-aerea': { que: 'La Dársena Norte desde un aeroplano; más allá, el Puerto Nuevo y la ciudad.', autor: 'Postal de Bourquin & Kohlmann', fecha: 'década de 1920', nota: 'Commons solo dice «antes de 1930».' },
  'inmigrantes-mop': { que: 'El frente oeste del hotel recién terminado: planta baja y tres pisos de hormigón, con el reloj en el medio.', autor: 'Ministerio de Obras Públicas', fecha: 'noviembre de 1910', nota: 'La fecha es la del rótulo de la placa.' },
  'chade-1933': { que: 'El frente de la usina visto desde el agua: el arco entre las dos torres y, a los lados, las alas de ventanales.', autor: SIN_AUTOR, fecha: '1933' },
  'chade-collivadino': { que: 'La usina en obra, con los andamios y la estructura de hierro pintada de minio. Óleo.', autor: 'Pío Collivadino', fecha: 'hacia 1928' },
  'subte-inauguracion-1913': { que: 'El tren del viaje inaugural, embanderado, en la estación Plaza de Mayo.', autor: 'Compañía de Tranvías Anglo Argentina', fecha: '1 de diciembre de 1913' },
  'subte-pasco-1938': { que: 'La boca de Pasco Sur, en Rivadavia, mientras repavimentan la avenida: el pórtico de hierro con los carteles «Plaza Once» y «Caballito».', autor: SIN_AUTOR, fecha: '1938' },
  'subte-boca-1940': { que: 'Pasajeros bajando por una boca con el cartel «Subterráneo · A Caballito».', autor: 'Archivo General de la Nación', fecha: 'hacia 1940' },
  'subte-saenz-1915': { que: 'Los andenes de la estación Sáenz Peña, con sus columnas de hierro.', autor: SIN_AUTOR, fecha: 'hacia 1915' },
  'nereidas-1916': { que: 'La fuente en su primer lugar, sobre el Paseo de Julio.', autor: SIN_AUTOR, fecha: '1916' },
  'nereidas-1938': { que: 'La fuente en la Costanera Sur, con una pérgola detrás.', autor: 'Leo Wehrli', fecha: '1938' },
  'nereidas-palace': { que: 'La fuente en el cantero del Paseo de Julio, con su cadena. Detrás, el Palace Hotel, que sigue en pie en 25 de Mayo y Perón.', autor: 'Archivo General de la Nación', fecha: 'entre 1912 y 1918', nota: 'Commons la fecha hacia 1910, pero el hotel ya tiene la mansarda que reemplazó a su terraza, y eso fue después de 1912.' },
  'nereidas-postal': { que: 'Postal coloreada: la fuente entre los árboles y, del otro lado del Paseo de Julio, el Palace Hotel todavía con su terraza y su mirador.', autor: SIN_AUTOR, fecha: 'hacia 1910' },
  'munich-1927': { que: 'La cervecería recién abierta, con las mesas en la terraza.', autor: SIN_AUTOR, fecha: 'c. 1927' },
  'munich-noche': { que: 'La Munich de noche, iluminada.', autor: 'Hermanos Forero', fecha: '26 de julio de 1929' },
};

/** Cada foto con todo: lo del pie y, de fotos.json, w, h (de la chica), titulo (el del archivo en Commons), licencia y fuente. */
export const FOTOS = Object.fromEntries(Object.entries(PIES).filter(([k]) => DATOS[k]).map(([k, p]) => [k, { ...DATOS[k], ...p }]));

/** nombre de la marca (o la clave `ficha` que la marca diga, src/marcas.js) → { titulo?, era: qué era en 1867 —o, en
 *  las de la línea de tiempo, qué es y de cuándo—, texto: [párrafos], hoyEs?: qué hay hoy, fotos: [archivos] } */
export const FICHAS = {
  'Plaza de la Victoria': {
    era: 'La plaza mayor: la mitad oeste de la Plaza de Mayo de hoy.',
    texto: [
      'Iba del Cabildo a la Recova Vieja, que la separaba de la Plaza 25 de Mayo. En el medio estaba la Pirámide de Mayo, de 1811, tal como la dejó la reforma de 1856 que dirigió Prilidiano Pueyrredón, con la estatua de la Libertad, de Joseph Dubourdieu, en la punta.',
      'En 1884 se demolió la Recova y las dos plazas quedaron unidas. La Pirámide siguió en su lugar hasta 1912, cuando la corrieron 63 metros hacia el este.',
    ],
    hoyEs: 'la mitad de la Plaza de Mayo que da al Cabildo.',
    fotos: ['piramide-gonnet', 'victoria-panunzi', 'victoria-recova-gonnet'],
  },
  'Cabildo': {
    era: 'En 1867, tribunales y cárcel; todavía con sus once arcos.',
    // (cambia cuatro veces, src/lugares/cabildo.js: lo que dice arriba va con la marca de cada época, por su `desde`)
    eras: { 1: 'En 1888, con el frente a la italiana y la torre más alta, de Pedro Benoit.', 2: 'Sin la torre y con ocho arcos: así quedó en 1889, al abrirse la Avenida de Mayo.', 6: 'En 1940, recién restaurado: cinco arcos y una torre nueva.' },
    texto: [
      'Se empezó en 1725 con planos de los jesuitas Blanqui y Prímoli, y la torre se terminó en 1765. Disuelto el Cabildo en 1821, en el edificio quedaron los tribunales y la cárcel, que siguió ahí hasta 1877. Ocupaba la mitad sur de la cuadra: no estaba centrado con la plaza.',
      'Después lo fueron recortando. En 1879 Pedro Benoit le subió la torre diez metros; en 1889 se demolieron esa torre y los tres arcos del norte para abrir la Avenida de Mayo, y en 1931, los tres del sur, para la Diagonal Sur. Lo que se ve hoy, con cinco arcos, es la restauración de Mario Buschiazzo, inaugurada en 1940.',
    ],
    hoyEs: 'el Museo Histórico Nacional del Cabildo y de la Revolución de Mayo, en Bolívar 65.',
    fotos: ['cabildo-gonnet', 'cabildo-junior', 'calle-victoria-panunzi', 'cabildo-1915', 'cabildo-1940'],
  },
  'Catedral': {
    era: 'La Iglesia Metropolitana, con el frente recién terminado.',
    texto: [
      'El templo se inauguró en 1791, sin fachada. El frente de doce columnas, inspirado en el Palais Bourbon de París, lo proyectó Próspero Catelin y se empezó en 1822; el relieve del frontis, de Joseph Dubourdieu, se terminó hacia 1863, cuatro años antes del plano.',
      'La cúpula tiene 41 metros de alto. Al lado estaba la Curia, de Pedro Fossati, que se incendió en 1955. Desde 1880 guarda el mausoleo de San Martín.',
    ],
    hoyEs: 'sigue en su lugar, en Rivadavia y San Martín.',
    fotos: ['victoria-catedral-gonnet', 'catedral-junior'],
  },
  'Recova Vieja': {
    era: 'Una galería de tiendas que partía la plaza en dos.',
    texto: [
      'Se empezó en 1802 y a fines de 1803 ya funcionaba: dos alas de once arcos cada una, con cuarenta locales, que en 1804 se unieron con el arco grande del medio, el Arco de los Virreyes. De un lado quedaba la Plaza de la Victoria y del otro, la 25 de Mayo, frente al Fuerte.',
      'Nació como mercado de abasto y terminó ocupada por tenderos y artesanos; era de la familia Anchorena. El intendente Torcuato de Alvear hizo tirar el arco central en agosto de 1883, y el resto, una vez expropiado, cayó entre el 8 y el 14 de mayo de 1884.',
    ],
    hoyEs: 'el medio de la Plaza de Mayo.',
    fotos: ['recova-gonnet', 'colon-agn', 'recova-demolicion'],
  },
  'Teatro Colón': {
    era: 'El primer Colón, frente a la plaza.',
    texto: [
      'Lo proyectó Charles Henri Pellegrini y se inauguró el 25 de abril de 1857 con La Traviata. Entraban 2.500 personas. La estructura de hierro, fabricada en Dublín, fue la primera grande de ese material en la ciudad, y la araña de la sala tenía 450 luces de gas.',
      'Cerró el 13 de septiembre de 1888. El Colón de hoy se inauguró en 1908 en otra manzana: la que en 1867 ocupaba la Estación del Parque.',
    ],
    hoyEs: 'la casa central del Banco de la Nación Argentina.',
    fotos: ['colon-agn', 'recova-gonnet', 'aduana-vista-gonnet'],
  },
  'Casa de Gobierno': {
    era: 'La presidencia, en lo que quedaba del Fuerte.',
    texto: [
      'El Fuerte se había empezado en 1595. Desde 1853 se le demolieron las murallas y el lado sur, donde se levantó la Aduana Nueva; en el sector norte se instaló Mitre en 1862, como presidente.',
      'En 1867 un incendio dañó la parte que daba a la calle Rivadavia; al año siguiente Sarmiento la hizo arreglar y pintar de rosa. Después se construyó al lado el Correo, de Kihlberg (1873–1879); en 1882 se demolió lo último del Fuerte para la nueva casa de gobierno, de Aberg, y desde 1885 Tamburini unió los dos edificios.',
    ],
    hoyEs: 'la Casa Rosada.',
    fotos: ['rentas-gonnet', 'recova-panunzi', 'gobierno-junior'],
  },
  'Aduana Nueva': {
    era: 'La aduana de Taylor: un medio círculo metido en el río.',
    texto: [
      'La proyectó el ingeniero Edward Taylor; se empezó en 1855 y se habilitó en 1857, detrás de la Casa de Gobierno, sobre el primer relleno grande que se le ganó al río. Tenía planta baja y cinco pisos de depósitos en semicírculo, una torre con faro en el medio y un muelle de madera de 300 metros para las cargas.',
      'Se la demolió a fines del siglo XIX para hacer Puerto Madero; las fuentes no coinciden en el año.',
    ],
    hoyEs: 'el Parque Colón, detrás de la Casa Rosada. Parte de sus muros se ve en el Museo de la Casa Rosada.',
    fotos: ['aduana-gonnet', 'aduana-vista-gonnet', 'aduana-muelle-gonnet'],
  },
  'Muelle de pasajeros': {
    era: 'Por acá se entraba a Buenos Aires.',
    texto: [
      'Se inauguró en 1855 en el Bajo de la Merced, entre las actuales Bartolomé Mitre y Perón. Lo construyó Edward Taylor: era de madera, de 210 metros de largo, con unos rieles angostos por donde corrían las zorras del equipaje.',
      'Los barcos fondeaban lejos de la costa, y los pasajeros hacían el último tramo en bote hasta el muelle. Antes de 1855 se bajaba a tierra en carretas que entraban al río.',
    ],
    hoyEs: 'tierra firme, del otro lado de la avenida Leandro N. Alem: con Puerto Madero el río quedó lejos.',
    fotos: ['muelle-gonnet', 'muelle-panunzi', 'muelle-1867'],
  },
  'Estación Central': {
    era: 'Así la nombra el plano, al pie de la Casa de Gobierno.',
    texto: [
      'El plano de 1867 escribe «Estación central» en este lugar, sobre el Paseo de Julio. Desde 1863 salía de acá el tranvía a caballo del Ferrocarril del Norte, que llevaba a los pasajeros hasta el Retiro, donde tomaban el tren.',
      'El edificio que se hizo conocido con ese nombre es posterior: una estación de madera traída entera de Gran Bretaña, con torre y reloj, que se habilitó en 1872 y compartieron todas las líneas. Se incendió el 14 de febrero de 1897 y no se reconstruyó.',
    ],
    hoyEs: 'el costado norte de la Casa Rosada, donde arranca la avenida Leandro N. Alem.',
    fotos: ['tranvia-gonnet', 'aduana-gonnet', 'central-junior'],
  },
  'Estación del Parque': {
    era: 'La primera estación de tren del país.',
    eras: { 1: 'La terminal de 1872 de la primera estación del país, ya sin trenes: desde 1883 la cabecera es el Once.' },
    texto: [
      'Era la cabecera del Ferrocarril del Oeste. De acá salió, el 29 de agosto de 1857, el tren inaugural, que llegaba hasta la Floresta. En 1867 era un edificio de madera, con un cobertizo al costado.',
      'En 1872 se lo reemplazó por una terminal de mampostería, que es la que muestran las fotos de esa década. Los trenes dejaron de llegar el 1 de enero de 1883, cuando la cabecera pasó al Once. La manzana —Cerrito, Tucumán, Libertad y Viamonte— es hoy la del Teatro Colón, inaugurado en 1908.',
    ],
    hoyEs: 'el Teatro Colón.',
    fotos: ['parque-junior', 'viejos-parque-cerrito', 'viejos-parque-nave', 'pampero-gonnet', 'plazaparque-gonnet'],
  },
  'Congreso Nacional': {
    era: 'El primer edificio propio del Congreso, de Jonás Larguía. De 1864.',
    eras: { 4: 'El viejo Congreso, ya sin legisladores: desde 1906 guarda el Archivo General de la Nación.' },
    texto: [
      'Los planos se aprobaron en marzo de 1863 y se inauguró el 12 de mayo de 1864, sobre la ochava de Balcarce y Victoria, frente a la Plaza de Mayo. Hasta entonces el Congreso sesionaba en la sala de la Legislatura porteña, en la calle Perú.',
      'Tenía un pórtico de tres arcos con rejas y, detrás, el recinto con su media naranja. Quedó chico enseguida: la última sesión fue el 15 de diciembre de 1905, y al año siguiente el Congreso se mudó al palacio de la avenida Callao.',
      'Después fue el Archivo General de la Nación. Se demolió en 1942 para levantar el Banco Hipotecario Nacional, pero el recinto se conservó dentro del edificio nuevo.',
      'El plano dibuja la ochava, no el edificio: su lugar exacto sobre ella y las dos casas vecinas son supuestos.',
    ],
    hoyEs: 'el recinto sigue ahí, dentro del edificio de Balcarce 139: es la sede de la Academia Nacional de la Historia.',
    fotos: ['viejos-congreso-junior', 'viejos-congreso-frente'],
  },
  'Estación del Norte': {
    era: 'La estación del Retiro, del Ferrocarril del Norte.',
    texto: [
      'Era la cabecera del Ferrocarril del Norte, al pie de la barranca del Retiro. La línea llegó a Belgrano en diciembre de 1862, a San Isidro en 1863, a San Fernando en 1864 y al Tigre en 1865.',
      'En 1889 la empresa pasó al Central Argentino. La estación Retiro de hoy, la del Mitre, se inauguró en 1915 más cerca del río, sobre terrenos de relleno.',
    ],
    hoyEs: 'la zona de las estaciones de Retiro.',
    fotos: ['norte-gonnet', 'gas-gonnet'],
  },
  'Estación del Sud': {
    era: 'La estación del Ferrocarril del Sud, en Constitución.',
    texto: [
      'Las obras empezaron en marzo de 1864 y se inauguró en agosto de 1865: un edificio sencillo, con un frontis y dos andenes, al lado del mercado de carretas.',
      'Duró hasta 1885. La estación que la reemplazó se inauguró el 1 de enero de 1887.',
    ],
    hoyEs: 'la estación Plaza Constitución.',
    fotos: ['viejos-sud-carretas'],
  },
  'Fábrica de gas': {
    era: 'La usina del alumbrado a gas, en el bajo del Retiro.',
    texto: [
      'Era de la Compañía Primitiva de Gas, creada en 1854. Desde 1856 alumbró las calles del centro y, desde 1857, la araña del primer Teatro Colón. Estaba al borde del río, junto a las vías del Ferrocarril del Norte.',
    ],
    hoyEs: 'la Plaza Fuerza Aérea Argentina, donde está la Torre Monumental.',
    fotos: ['gas-gonnet', 'gas-junior'],
  },
  'Plaza de Marte': {
    era: 'El Campo de Marte, en el Retiro.',
    texto: [
      'En esta barranca estuvieron la plaza de toros, levantada en 1801 (las corridas se suprimieron en 1819), y los cuarteles donde San Martín formó en 1812 a los Granaderos a Caballo. Desde 1823 se la llamó Campo de Marte.',
      'En 1862 se inauguró el monumento ecuestre a San Martín, de Louis-Joseph Daumas: en 1867 tenía cinco años. Los cuarteles del Retiro seguían al borde de la plaza.',
    ],
    hoyEs: 'la Plaza San Martín.',
    fotos: ['marte-gonnet', 'sanmartin-gonnet'],
  },
  'Plaza del Parque': {
    era: 'La plaza del Parque de Artillería, cruzada por las vías.',
    texto: [
      'Se llamaba así por el Parque de Artillería, instalado en 1822: fábrica de armas y depósito de pólvora. Del otro lado estaba la estación del Ferrocarril del Oeste, y las vías cruzaban la plaza. En 1867 se instaló acá la primera calesita de la ciudad.',
      'Desde 1878 se llama Plaza Lavalle. En 1890 fue el escenario de la Revolución del Parque, y donde estaba el arsenal se levantó después el Palacio de Justicia.',
    ],
    hoyEs: 'la Plaza Lavalle, entre Tribunales y el Teatro Colón.',
    fotos: ['plazaparque-gonnet', 'pampero-gonnet'],
  },
  'Mercado Constitución': {
    era: 'Plaza de carretas del sur.',
    texto: [
      'Desde 1854 funcionaba acá el Mercado del Sud del Alto: una explanada donde paraban las tropas de carretas que hacían el tráfico entre Buenos Aires y el interior. En 1865 se le sumó, al lado, la estación del Ferrocarril del Sud.',
      'El mercado se cerró en 1885, cuando el intendente Alvear lo convirtió en plaza.',
    ],
    hoyEs: 'la Plaza Constitución, frente a la estación.',
    fotos: ['constitucion-gonnet'],
  },
  'Mercado 11 de Septiembre': {
    era: 'Plaza de carretas del oeste.',
    texto: [
      'En los antiguos corrales de Miserere paraban las carretas que llegaban del oeste. El nombre recordaba el 11 de septiembre de 1852.',
      'Fue mercado hasta 1882, cuando el intendente Alvear empezó a trazar la plaza. Del nombre viejo quedó el del barrio: el Once.',
    ],
    hoyEs: 'la Plaza Miserere.',
    fotos: ['once-panunzi'],
  },
  'La Recoleta': {
    era: 'El cementerio del Norte y la iglesia del Pilar, en las afueras.',
    texto: [
      'La iglesia del Pilar, del convento de los frailes recoletos, se terminó en 1732: la empezó Blanqui y la terminó Prímoli. El cementerio se abrió el 17 de noviembre de 1822 en la huerta del convento, y fue el primero público de la ciudad.',
      'En 1867 estaba todavía fuera de lo edificado, como muestra el plano. El cementerio se remodeló en 1881.',
    ],
    hoyEs: 'el Cementerio de la Recoleta y la basílica del Pilar, en el mismo lugar.',
    fotos: ['recoleta2-panunzi', 'pilar-gonnet'],
  },
  'Arroyo Maldonado': {
    era: 'El borde del municipio por el norte: del otro lado empezaba el partido de Belgrano.',
    texto: [
      'Nace en San Justo, en La Matanza, y cruza la ciudad hasta el Río de la Plata: unos 21 kilómetros en total. El plano trae su último tramo: serpentea entre quintas hasta el Puente de Maldonado, donde lo cruzaba el camino de Santa Fe, y de ahí sigue derecho al río, junto al polvorín de Palermo.',
      'El mismo plano lo rotula como límite: «Nuevo límite de Belgrano según la ley de 2 de Noviembre de 1867».',
      'Con las lluvias fuertes se desbordaba y anegaba las tierras bajas de sus orillas. Lo entubaron en los años treinta, y encima se abrió la avenida Juan B. Justo, inaugurada el 9 de julio de 1937.',
      'El grabado lo dibuja con un trazo de unos cinco metros, que es un signo y no una medida: acá va más ancho, para que se lea como agua.',
    ],
    hoyEs: 'un conducto bajo la avenida Juan B. Justo; donde estaba el Puente de Maldonado, el cruce de Santa Fe conocido como Puente Pacífico.',
    fotos: [],
  },
  'La Boca': {
    era: 'Un caserío de madera a orillas del Riachuelo.',
    texto: [
      'Las primeras familias se instalaron entre 1830 y 1852. Para 1867 era un puerto de veleros, astilleros y saladeros, poblado sobre todo por genoveses, con casas de madera y chapa levantadas sobre pilotes.',
      'El ramal del ferrocarril a Ensenada llegó al muelle de la Boca en 1866.',
    ],
    hoyEs: 'el barrio de La Boca.',
    fotos: ['boca-1870', 'riachuelo-junior'],
  },

  // --- las iglesias ---
  'San Ignacio': {
    titulo: 'San Ignacio', era: 'La iglesia más antigua que se conserva en la ciudad.',
    texto: [
      'La torre sur y la fachada son de 1686; el edificio actual se empezó en 1712, se inauguró en 1722 y se consagró en 1734. Es la iglesia de la Manzana de las Luces, la de los jesuitas.',
    ],
    hoyEs: 'sigue en pie, en Bolívar y Alsina. Monumento Histórico Nacional desde 1942.',
    fotos: ['victoria-recova-gonnet'],
  },
  'San Francisco': {
    era: 'En 1867, con frente neoclásico.',
    texto: [
      'La proyectó Blanqui; se empezó hacia 1731 y se inauguró en 1754. En 1807 se le vinieron abajo la fachada y las torres, y Tomás Toribio hizo un frente nuevo, neoclásico, terminado hacia 1815: ese es el que estaba en 1867. Al lado, la capilla de San Roque (1751–1762).',
      'El frente que tiene hoy es de una reforma de comienzos del siglo XX: según Wikipedia, de Ernesto Sackmann, entre 1907 y 1911.',
    ],
    hoyEs: 'la basílica de San Francisco, en Alsina y Defensa.',
    fotos: ['sanfrancisco-pellegrini', 'congreso-gonnet'],
  },
  'Santo Domingo': {
    era: 'El convento de los dominicos, ya con sus dos torres.',
    texto: [
      'Se empezó en 1751 con planos de Antonio Masella. Durante la invasión inglesa de 1807 tenía una sola torre, la que conserva las marcas de las balas; la del oeste se terminó recién en 1849.',
      'En 1894 la reformaron los arquitectos Plou y Oliver. En el atrio está, desde 1903, el mausoleo de Belgrano, de Ettore Ximenes.',
    ],
    hoyEs: 'la basílica del Rosario y convento de Santo Domingo, en Defensa y Belgrano.',
    fotos: ['santodomingo-vidal', 'santodomingo-witcomb', 'paseocolon-panunzi'],
  },
  'La Merced': {
    era: 'En 1867, con su fachada colonial.',
    texto: [
      'La obra se decidió en 1721, con planos de Blanqui y Prímoli; la nave estaba hecha en 1733 y el templo se terminó hacia 1779. La fachada que se ve hoy es de la reforma que empezó Juan Antonio Buschiazzo en 1894.',
    ],
    hoyEs: 'la basílica de la Merced, en Reconquista y Perón. Monumento Histórico Nacional desde 1942.',
    fotos: ['merced-witcomb'],
  },
  'San Nicolás': {
    titulo: 'San Nicolás de Bari', era: 'La iglesia que estaba donde hoy está el Obelisco.',
    texto: [
      'La capilla la levantó Domingo de Acassuso en 1733 y se rehízo en 1767, en la esquina de las actuales Corrientes y Carlos Pellegrini. Ahí se izó por primera vez la bandera en la ciudad, el 23 de agosto de 1812.',
      'La demolieron en 1931. La parroquia tiene desde 1935 una basílica nueva, en Santa Fe 1352.',
    ],
    hoyEs: 'el Obelisco, de 1936.',
    fotos: ['sannicolas-witcomb', 'sannicolas-antigua'],
  },
  'El Socorro': {
    titulo: 'Nuestra Señora del Socorro', era: 'Una parroquia en el borde norte de la ciudad.',
    texto: ['El terreno se donó en 1750 y es parroquia desde 1783. En 1867 quedaba casi en las afueras, como muestra el plano.'],
    hoyEs: 'la basílica del Socorro, en Juncal y Suipacha.',
    fotos: ['socorro-witcomb'],
  },
  'San Juan': {
    titulo: 'San Juan Bautista', era: 'La iglesia de las monjas capuchinas.',
    texto: ['En Alsina y Piedras. El edificio es de 1797. En 1867 tenía su frente antiguo: el actual se hizo en 1895.'],
    hoyEs: 'sigue en pie, en Alsina y Piedras.',
    fotos: [],
  },
  'Monserrat': {
    titulo: 'Nuestra Señora de Monserrat', era: 'La iglesia que le dio nombre al barrio.',
    texto: ['La primera la construyó Antonio Masella a mediados del siglo XVIII, para la hermandad de los catalanes. El templo que estaba en 1867 era casi nuevo: se terminó en 1865.'],
    hoyEs: 'sigue en pie, en la avenida Belgrano al 1100.',
    fotos: ['mod-obraspublicas-1936'],
  },
  'La Piedad': {
    titulo: 'Nuestra Señora de la Piedad', era: 'Una parroquia del oeste de la ciudad.',
    texto: ['A mediados del siglo XVIII hubo acá un oratorio, y después una iglesia con su pequeño camposanto. La basílica que hay hoy en el mismo lugar, en Bartolomé Mitre al 1500, es Monumento Histórico Nacional desde 2017; no pudimos confirmar cuánto de ese edificio existía ya en 1867.'],
    fotos: [],
  },
  'La Concepción': {
    titulo: 'La Inmaculada Concepción', era: 'En 1867, recién reformada.',
    texto: ['La parroquia viene de la primera mitad del siglo XVIII. El templo tomó su aspecto actual en 1865, dos años antes del plano; en 1978 perdió el atrio, con el ensanche de la avenida Independencia.'],
    hoyEs: 'sigue en pie, en Independencia 910.',
    fotos: [],
  },
  'San Telmo': {
    titulo: 'San Pedro Telmo', era: 'Nuestra Señora de Belén, todavía sin terminar.',
    texto: ['La empezaron los jesuitas en 1734 —Blanqui, Prímoli y Schmidt— y quedó a medio hacer cuando los expulsaron, en 1767. Los cuerpos altos de las torres son de 1852, y la obra se dio por terminada recién en 1876, con las torres que proyectó Pedro Benoit: en 1867 le faltaba eso.'],
    hoyEs: 'la parroquia de San Pedro González Telmo, en Humberto Primo 340.',
    fotos: [],
  },
  'El Pilar': {
    titulo: 'Nuestra Señora del Pilar', era: 'La iglesia de los frailes recoletos.',
    texto: ['Se terminó en 1732: la empezó Blanqui y la terminó Prímoli, con el dinero del vecino Juan de Narbona. En la huerta del convento se abrió, en 1822, el cementerio. La restauró Andrés Millé en 1930.'],
    hoyEs: 'la basílica del Pilar, al lado del Cementerio de la Recoleta.',
    fotos: ['pilar-gonnet', 'recoleta2-panunzi'],
  },
  // --- lo que trae la línea de tiempo, en el orden en que aparece ---
  'Plaza de Mayo': {
    era: 'La Plaza de la Victoria y la 25 de Mayo, hechas una sola en 1884.',
    texto: [
      'El intendente Torcuato de Alvear hizo demoler la Recova Vieja, que partía la plaza en dos, y desde el 17 de mayo de 1884 las dos mitades son una, con un solo nombre. Se levantó el empedrado de la calle Defensa, que la cruzaba, y se sacaron los rieles del tranvía a caballo.',
      'La Pirámide quedó entonces en el medio de la mitad oeste. En 1912 la corrieron 63 metros hacia el este, sobre rieles, hasta el centro de la plaza nueva.',
    ],
    hoyEs: 'la Plaza de Mayo, entre la Casa Rosada, el Cabildo y la Catedral.',
    fotos: ['plazamayo-photoglob', 'plazamayo-1931'],
  },
  'Plaza San Martín': {
    era: 'El viejo Campo de Marte: la lonja alta del Retiro, con el San Martín en el medio.',
    texto: [
      'Fue plaza de toros desde 1801 y Campo de Marte, al lado de los cuarteles donde San Martín formó a los Granaderos a Caballo en 1812. El 13 de julio de 1862 se inauguró el San Martín ecuestre de Louis-Joseph Daumas, sobre un pedestal bajo de mármol, con reja y faroles a gas.',
      'En la década de 1870 Eugène Courtois la rehízo como jardín a la inglesa: una avenida central entre árboles grandes, canteros de césped y un estanque con rocalla. Los cuarteles se demolieron entre 1881 y 1891, y en su lugar se armó en 1893 el Pabellón Argentino. Entre 1897 y 1910 la plazoleta de Florida y Charcas tuvo el monumento a Falucho.',
      'Para el Centenario, el 27 de mayo de 1910, se inauguró el monumento nuevo: la misma estatua, dada vuelta, sobre el basamento de granito rojo de Gustav Eberlein, con sus relieves y grupos de bronce.',
      'En los años treinta se demolió la manzana de la barranca y se desarmó el Pabellón, y en 1936 se plantó la parte nueva: la plaza bajó hasta el pie de la barranca, al lado del Kavanagh recién terminado.',
    ],
    hoyEs: 'la Plaza San Martín.',
    fotos: ['sanmartin-gonnet', 'marte-gonnet'],
  },
  'Monumento a San Martín': {
    era: 'El San Martín de Daumas, de 1862.',
    eras: { 4: 'Desde 1910, sobre el basamento de Eberlein.' },
    texto: [
      'El primer monumento ecuestre del país: el bronce del francés Louis-Joseph Daumas, inaugurado el 13 de julio de 1862 en el Campo de Marte. Estuvo casi cincuenta años sobre un pedestal bajo de mármol, con reja de hierro y cuatro faroles a gas.',
      'Para el Centenario el alemán Gustav Eberlein le hizo el basamento de granito rojo, con escalinata, relieves y grupos de bronce: desde el 27 de mayo de 1910 es el «Monumento al General San Martín y a los Ejércitos de la Independencia», con la estatua dada vuelta.',
      'El plano de 1867 lo dibuja unos trece metros al sudeste de donde está hoy, y el de 1895 ya lo trae en su lugar: acá va sobre el signo en 1867 y en el lugar actual desde 1888.',
    ],
    hoyEs: 'sigue en la Plaza San Martín.',
    fotos: ['sanmartin-gonnet'],
  },
  'Plaza Lavalle': {
    era: 'La vieja Plaza del Parque, con otro nombre desde 1878.',
    texto: [
      'Se llamó del Parque por el Parque de Artillería, la fábrica de armas instalada en 1822. Enfrente estuvo la primera estación de tren del país, la del Ferrocarril del Oeste: la vía cruzaba la plaza en diagonal hasta que la cabecera pasó al Once, en 1883.',
      'Una ordenanza de 1878 le dio el nombre del general Lavalle, y en 1887 se inauguró en el centro la columna de mármol con su estatua, de Pietro Costa. Del lado de Viamonte estaba desde 1868 el Palacio Miró, con su quinta.',
      'En julio de 1890 fue el campo de la Revolución del Parque. Después cambió todo alrededor: donde estaba el arsenal se levantó el Palacio de Justicia; en la manzana de la estación, el Teatro Colón (1908); y la calle Tucumán se abrió a través de la plaza —los planos la muestran cerrada en 1895 y abierta en 1905—, dejando la columna en una isleta.',
      'En 1937 se demolió el Palacio Miró y su manzana se sumó a la plaza, con un estanque y un reloj de sol.',
    ],
    hoyEs: 'la Plaza Lavalle: tres manzanas entre Tribunales y el Teatro Colón, con la columna en el mismo lugar.',
    fotos: ['plazaparque-gonnet'],
  },
  'Monumento a Lavalle': {
    era: 'La columna del general, en el centro de la plaza desde 1887.',
    texto: [
      'Es una columna de mármol de más de veinte metros, con la estatua de Juan Lavalle arriba, obra del escultor italiano Pietro Costa. Se inauguró en 1887, nueve años después de que la plaza tomara el nombre del general.',
      'No se movió nunca: lo que cambió fue la plaza. Cuando la calle Tucumán se abrió a través de ella, la columna quedó en una isleta en medio de la calzada.',
    ],
    hoyEs: 'el mismo monumento, en el cruce de Tucumán con el eje de la Plaza Lavalle.',
    fotos: [],
  },
  'Palacio Miró': {
    era: 'La villa de Mariano Miró y Felisa Dorrego, frente a la plaza (1868–1937).',
    texto: [
      'La proyectaron Nicolás y José Canale y se terminó en 1868: una casa a la italiana, con galería de columnas, terraza y mirador, en medio de una quinta que ocupaba la manzana entera, de Viamonte a Córdoba.',
      'En la Revolución del Parque, en julio de 1890, fue cantón de los sublevados, y ahí se firmó la capitulación el 29 de julio.',
      'Se demolió en 1937. En septiembre de ese año su manzana se sumó a la Plaza Lavalle, con algunos de los árboles de la quinta.',
    ],
    hoyEs: 'la manzana norte de la Plaza Lavalle, entre Viamonte y Córdoba.',
    fotos: [],
  },
  'Parque de Artillería': {
    era: 'El arsenal que le dio nombre a la Plaza del Parque.',
    texto: [
      'Instalado en 1822, era fábrica de armas y depósito de pólvora: ocupaba la manzana del oeste de la plaza, con el frente sobre Talcahuano.',
      'El 26 de julio de 1890 lo tomaron los sublevados de la Revolución del Parque, que se hicieron fuertes ahí hasta la capitulación. Se demolió hacia 1900, y en su lugar se levantó el Palacio de Justicia.',
    ],
    hoyEs: 'el Palacio de Justicia: Tribunales.',
    fotos: [],
  },
  'Plaza Constitución': {
    era: 'Mercado de carretas hasta 1885 · plaza desde 1892.',
    texto: [
      'Desde la década de 1850 el hueco del sur fue el Mercado Constitución, la parada de las carretas que llegaban de la campaña. En 1865 se le sumó, sobre la calle Brasil, la estación del Ferrocarril del Sud.',
      'El intendente Alvear lo hizo paseo. En 1884 se ajardinó la mitad del este, en 1885 se cerró el mercado y el 30 de octubre de 1892 quedó abierta la plaza entera, con canteros a la inglesa, un lago con su puente y una avenida arbolada de Hornos a Lima.',
      'Su rareza fue la «gruta»: una montaña de cemento de casi veinte metros, con torreones y pasarelas colgantes, terminada hacia 1888. Se quedó sin agua antes de 1900 y la demolieron en 1914.',
      'En mayo de 1910 se inauguró el monumento a Castelli. Después la avenida Garay partió la plaza en dos, y en 1933 y 1934 se la excavó casi entera para la terminal del subte a Retiro, abierta el 9 de noviembre de 1934.',
    ],
    hoyEs: 'la Plaza Constitución, entre Lima Oeste, Brasil, Lima Este y Constitución, frente a la estación.',
    fotos: ['constitucion-gonnet'],
  },
  'Gruta de Constitución': {
    era: 'De 1888 a 1914.',
    texto: [
      'Una montaña artificial de cemento armado sobre hierros, de casi veinte metros, con torreones en ruinas, pasarelas colgantes, una cascada y un estanque al pie: la moda de las rocallas, que el intendente Alvear trajo de los parques de París. Se levantó entre 1885 y 1888 en medio de la plaza nueva.',
      'La Prensa la llamó «espléndido mamarracho». Se agrietó, se quedó sin agua antes de 1900 y terminó de refugio de vagabundos. La demolieron en 1914.',
      'El lugar es el que le dan el plano de 1895 y la foto aérea de 1940, que todavía muestra el redondel; la altura y la forma salen de las fotos.',
    ],
    hoyEs: 'un cantero de la Plaza Constitución: de la gruta no quedó nada.',
    fotos: [],
  },
  'Monumento a Castelli': {
    era: 'Inaugurado en mayo de 1910.',
    texto: [
      'Juan José Castelli, el orador de la Revolución de Mayo, en bronce del escultor alemán Gustav Eberlein: uno de los monumentos que se encargaron para el Centenario.',
      'Acá va donde lo muestra la foto aérea de 1940; no está confirmado que en 1910 estuviera en el mismo punto de la plaza.',
    ],
    hoyEs: 'sigue en la Plaza Constitución.',
    fotos: [],
  },
  'Arroyo Manso': {
    era: 'A cielo abierto en 1867.',
    texto: [
      'El Tercero del Norte: el más largo de los tres arroyos —los «terceros»— que cruzaban la ciudad vieja. Nacía en unos bajos del oeste y salía al río por la Recoleta.',
      'El plano de 1867 no lo nombra, pero lo dibuja con todas sus vueltas en las quintas del norte, por donde hoy pasa la calle Austria, entre French y Las Heras, y le pone un puentecito en el camino de Chavango, hoy avenida Las Heras. De ahí al río dibuja solo el zanjón de la barranca.',
      'Los planos de 1888 en adelante ya traen ahí la cuadrícula de calles y el Hospital Rivadavia, sin arroyo: por eso acá se lo ve solo en 1867. Hoy corre entubado.',
    ],
    hoyEs: 'la calle Austria, entre French y la avenida Las Heras.',
    fotos: [],
  },
  'Arroyo Maciel': {
    era: 'A cielo abierto en todas las épocas del visor.',
    texto: [
      'Corría del otro lado del Riachuelo, por los bañados de Barracas al Sur —hoy Avellaneda—, y entre él, el Riachuelo y el río quedaba encerrada la Isla Maciel.',
      'El plano de 1867 lo rotula dos veces y le dibuja las zanjas que le llegaban del norte. Entra y sale por el borde de abajo del pliego, así que acá se ve solo el tramo del medio.',
      'Siguió a cielo abierto mucho después de 1940; lo entubaron en la segunda mitad del siglo XX.',
    ],
    hoyEs: 'Dock Sud y la Isla Maciel, en Avellaneda: el arroyo va entubado.',
    fotos: [],
  },
  'Plaza 11 de Septiembre': {
    era: 'El mercado de carretas del oeste, convertido en plaza.',
    eras: { 6: 'La plaza del Once, con el mausoleo de Rivadavia desde 1932.' },
    texto: [
      'Fueron los corrales de Miserere. Desde 1853 el descampado se llamó 11 de Septiembre: era el mercado del oeste, adonde llegaban las carretas con lana, cueros y frutos del país, y desde 1857 tuvo al lado al Ferrocarril del Oeste.',
      'Fue mercado hasta 1882. Ese año alojó la Exposición Continental, y después el intendente Alvear lo hizo plaza: el terreno levantado sobre la calle, canteros, senderos y mucho árbol. Del mercado quedó un ombú enorme, del lado de Ecuador.',
      'El subterráneo, que se hizo a cielo abierto y se inauguró en 1913, obligó a levantarla entera; se rehízo más sencilla. El 3 de septiembre de 1932 se inauguró en el medio el mausoleo de Bernardino Rivadavia, de Rogelio Yrurtia.',
    ],
    hoyEs: 'la Plaza Miserere —«el Once»—, entre Rivadavia, Pueyrredón, Bartolomé Mitre y Ecuador. Se llama así desde 1947.',
    fotos: ['once-panunzi'],
  },
  'Mausoleo de Rivadavia': {
    era: 'El monumento y la tumba de Bernardino Rivadavia, en el medio de la plaza desde 1932.',
    texto: [
      'Es obra del escultor Rogelio Yrurtia y se inauguró el 3 de septiembre de 1932: un bloque de granito gris de unos 25 por 15 metros y más de nueve de alto, con dos grandes bronces sentados, Moisés y la Acción.',
      'Adentro están los restos de Rivadavia, el primer presidente argentino, que había muerto en Cádiz en 1845.',
    ],
    hoyEs: 'el mismo mausoleo, Monumento Histórico Nacional desde 1946.',
    fotos: [],
  },
  'Estación Constitución': {
    era: 'La estación de 1887 del Ferrocarril del Sud: la primera con aire de palacio.',
    texto: [
      'En 1883 el Ferrocarril del Sud les encargó a los arquitectos Parr, Strong & Parr, de Londres, una terminal nueva en el lugar de la de 1865. Se inauguró el 1 de enero de 1887: un frente a la francesa, con mansardas, el cuerpo del medio con un gran reloj y dos pabellones en las puntas, y los andenes bajo un techo de hierro y vidrio.',
      'Fue la primera terminal de la ciudad con aspecto de palacio, y las otras compañías la imitaron. Desde 1898 se la amplió y se le rehízo el frente, con proyecto de Paul Bell Chambers y Louis Newbery Thomas; la estación de hoy, mucho más grande, salió de los planos de 1922.',
    ],
    hoyEs: 'la estación Plaza Constitución, cabecera del Ferrocarril Roca. Monumento Histórico Nacional desde 2021.',
    fotos: ['constitucion-witcomb'],
  },
  'Avenida de Mayo': {
    era: 'La primera avenida de la ciudad, inaugurada en 1894.',
    texto: [
      'La pidió el intendente Torcuato de Alvear en 1882 y la autorizó una ley de 1884: una avenida de 30 metros de ancho por lo menos, de la Plaza de Mayo a Entre Ríos, abierta por el medio de las manzanas que había entre Rivadavia y Victoria (hoy Hipólito Yrigoyen). Las demoliciones empezaron en 1888 por los edificios que daban a la plaza: la Casa de la Policía y los tres arcos del norte del Cabildo.',
      'Se inauguró el 9 de julio de 1894. Por debajo corre, desde el 1 de diciembre de 1913, el primer subterráneo de América Latina: la línea A de hoy.',
    ],
    hoyEs: 'la Avenida de Mayo, de la Casa Rosada al Congreso.',
    fotos: ['avmayo-gath', 'barolo-zeppelin'],
  },
  'Puerto Madero': {
    era: 'El puerto de los diques, hecho entre 1887 y 1898 sobre tierra ganada al río.',
    texto: [
      'Hasta entonces los barcos fondeaban lejos de la costa. El proyecto de Eduardo Madero, con planos de los ingenieros ingleses Hawkshaw, Son & Hayter, puso delante de la ciudad cuatro diques comunicados entre sí, con una dársena en cada punta. La obra, de la empresa Thomas Walker & Co., empezó el 1 de abril de 1887.',
      'La Dársena Sur se inauguró el 28 de enero de 1889; los diques 1 y 2, en 1890; el 3, en 1892; el 4 y la Dársena Norte, en 1897, y el puerto se dio por terminado el 31 de marzo de 1898. Con él desaparecieron la Aduana Nueva y los muelles de 1855.',
      'Quedó chico enseguida, porque los barcos eran cada vez más grandes. En 1919 se inauguró, más al norte, el Puerto Nuevo: dársenas abiertas en peine, como había propuesto Luis Huergo.',
    ],
    hoyEs: 'el barrio de Puerto Madero: los diques siguen ahí, con los depósitos de ladrillo reciclados.',
    fotos: ['puerto-dique2', 'puerto-1915'],
  },
  'Banco de la Nación': {
    era: 'El primer Teatro Colón, convertido en banco.',
    texto: [
      'El Colón de 1857 dio su última función en 1888: el Estado compró el edificio para el Banco Nacional, que se instaló en lo que había sido la sala. Ese banco quebró con la crisis de 1890, y en 1891 se creó el Banco de la Nación Argentina.',
      'El banco fue comprando el resto de la manzana, y en 1910 el arquitecto Adolfo Büttner unificó todos los frentes con una mansarda. La casa central de hoy, de Alejandro Bustillo, se hizo en dos etapas: la primera se inauguró en 1944 y la segunda, sobre la esquina donde había estado el teatro, se terminó en 1955.',
    ],
    hoyEs: 'la casa central del Banco de la Nación Argentina, que ocupa toda la manzana.',
    fotos: ['banco-1921'],
  },
  'Palacio de Aguas Corrientes': {
    era: 'El gran depósito de agua de la ciudad, vestido de palacio. De 1894.',
    texto: [
      'Después de las epidemias de cólera y de fiebre amarilla, la ciudad encaró las obras de agua corriente y cloacas. Este depósito lo proyectó la firma inglesa Bateman, Parsons & Bateman; las fachadas las dirigieron el ingeniero sueco Carlos Nyströmer y el arquitecto noruego Olaf Boye. Se construyó entre 1887 y 1894.',
      'Adentro no hay salones: una estructura de hierro sostiene doce tanques, para 72 millones de litros. Afuera, 300.000 piezas de terracota esmaltada traídas de Gran Bretaña.',
    ],
    hoyEs: 'sigue en pie, en la avenida Córdoba al 1900, con oficinas de AySA y un museo. Monumento Histórico Nacional desde 1989.',
    fotos: ['aguas-1890', 'aguas-1930'],
  },
  'Casa Rosada': {
    era: 'La Casa de Gobierno terminada, con el arco que une sus dos mitades. De 1898.',
    texto: [
      'Son dos edificios que nacieron separados: el Correo, de Kihlberg (1873–1879), y la casa de gobierno que Aberg levantó al lado, sobre lo último del Fuerte. En 1884 se le encargó al italiano Francesco Tamburini unirlos: el arco del frente, sobre la calle Balcarce, se empezó en 1886.',
      'Después se la amplió hacia Rivadavia (hacia 1890) y hacia la actual Hipólito Yrigoyen (hacia 1896). La fachada que mira al río fue lo último, y con ella se la inauguró oficialmente en 1898, en la segunda presidencia de Roca.',
      'En 1938 se le demolieron 17 metros del lado sur: por eso el arco no está en el medio.',
    ],
    hoyEs: 'la Casa Rosada, sede del Poder Ejecutivo.',
    fotos: ['rosada-plaza', 'rosada-1910', 'rosada-1928'],
  },
  'Estación Once': {
    titulo: 'Estación Once de Septiembre', era: 'La terminal del Ferrocarril del Oeste, sobre la plaza del Once.',
    texto: [
      'El Once fue primero una parada de la línea que salía de la Estación del Parque. Cuando esa cabecera se cerró, el 1 de enero de 1883, pasó a ser la terminal, con un edificio de madera.',
      'La estación de mampostería, neorrenacentista, la proyectó el arquitecto holandés John Doyer. Se hizo en dos etapas: la primera entre 1895 y 1898, y la segunda entre 1906 y 1907, cuando un cuerpo central la unió con el edificio vecino de la Bolsa de Cereales. El ferrocarril era, desde 1890, de una compañía inglesa.',
      'Una reforma de 1972 le quitó las naves de hierro de los andenes.',
    ],
    hoyEs: 'la estación Once de Septiembre, cabecera del Ferrocarril Sarmiento. Monumento Histórico Nacional desde 2021.',
    fotos: ['once-1900'],
  },
  'Palacio del Congreso': {
    era: 'El Congreso de la Nación, inaugurado en 1906 todavía sin terminar.',
    texto: [
      'El concurso internacional de 1895 lo ganó el italiano Vittorio Meano. La obra empezó en agosto de 1897; a Meano lo mataron en 1904 y la siguió el Ministerio de Obras Públicas. Se inauguró el 12 de mayo de 1906, para la apertura de las sesiones.',
      'Faltaba mucho: el revestimiento de piedra se terminó recién en 1946, y costó varias veces lo previsto. Lo apodaron «el Palacio de Oro». La cúpula, de 80 metros, lo hizo el edificio más alto del país.',
      'Quedó en la otra punta de la Avenida de Mayo, mirando a la Casa de Gobierno.',
    ],
    hoyEs: 'el Congreso de la Nación, en Entre Ríos y Rivadavia.',
    fotos: ['congreso-obra', 'congreso-1910'],
  },
  'Plaza del Congreso': {
    era: 'La plaza abierta delante del Congreso para el Centenario.',
    texto: [
      'Ocupa las manzanas que había entre el Congreso y la Plaza Lorea, de Rivadavia a Victoria (hoy Hipólito Yrigoyen). Entre los proyectos que se presentaron se eligió el de Carlos Thays, y la obra se terminó en enero de 1910: la inauguró el intendente Manuel Güiraldes.',
      'En el extremo que da al Congreso está, desde 1914, el Monumento de los Dos Congresos.',
    ],
    hoyEs: 'la Plaza del Congreso.',
    fotos: ['plazacongreso-obra', 'congreso-bourquin'],
  },
  'Teatro Colón (1908)': {
    titulo: 'Teatro Colón', era: 'El Colón de hoy, inaugurado en 1908 después de veinte años de obra.',
    texto: [
      'Cerrado el primer Colón, el de la Plaza de Mayo, se compró para el nuevo la manzana de la Estación del Parque. La licitación fue en 1889, con un proyecto de Francesco Tamburini, y la piedra fundamental se puso el 25 de mayo de 1890. Tamburini murió ese mismo año.',
      'Lo siguió Vittorio Meano, que cambió bastante el proyecto, y, muerto Meano en 1904, lo terminó el belga Julio Dormal. Se inauguró el 25 de mayo de 1908 con Aida, de Verdi.',
    ],
    hoyEs: 'el Teatro Colón, en la manzana de Libertad, Tucumán, Cerrito y Viamonte.',
    fotos: ['colon-nuevo-agn'],
  },
  'Tribunales': {
    titulo: 'Palacio de Justicia', era: 'Tribunales: habilitado a medias en 1910 y terminado treinta años después.',
    texto: [
      'Lo proyectó el francés Norbert Maillart en 1889, pero la crisis de 1890 lo dejó en el papel: la obra empezó recién en 1905, donde había estado el Parque de Artillería. Una parte se inauguró en 1910, para el Centenario, y la Corte Suprema se mudó en 1912.',
      'La guerra de 1914 paró la obra hasta la década de 1920. Hacia 1925 se cambió la mansarda del proyecto por un piso más, y se lo dio por terminado en 1942. Siempre lo criticaron por pesado.',
    ],
    hoyEs: 'el Palacio de Justicia, sede de la Corte Suprema, frente a la Plaza Lavalle.',
    fotos: ['tribunales-obra', 'tribunales-galeria'],
  },
  'Monumento de los Dos Congresos': {
    era: 'El monumento a la Asamblea del año XIII y al Congreso de Tucumán.',
    texto: [
      'Es obra de dos belgas, el escultor Jules Lagae y el arquitecto D’Huicque, y se inauguró el 9 de julio de 1914. Es de piedra de Nancy, con las figuras de bronce.',
      'Arriba está la República, con un ramo de laurel en una mano y la otra apoyada en un arado; a los lados, las figuras de los dos congresos que le dan el nombre: la Asamblea de 1813 y el de Tucumán, de 1816. Del lado de la plaza tiene una fuente.',
    ],
    hoyEs: 'sigue en su lugar, frente al Congreso.',
    fotos: ['doscongresos-bk'],
  },
  'Estación Retiro': {
    era: 'La terminal del Ferrocarril Central Argentino, de 1915.',
    texto: [
      'El Central Argentino necesitaba una cabecera desde que se quemó la Estación Central, en 1897. En 1908 presentó el proyecto de los arquitectos Eustace L. Conder, Roger Conder y Sydney G. Follett y el ingeniero Reginald Reynolds, todos británicos. La obra empezó en junio de 1909, y el presidente Victorino de la Plaza la inauguró el 2 de agosto de 1915.',
      'El proyecto tenía una tercera nave de andenes y un edificio de oficinas, que la guerra de 1914 dejó sin hacer. Está sobre relleno: la estación de 1867 quedaba tierra adentro, al pie de la barranca.',
    ],
    hoyEs: 'la estación Retiro del Ferrocarril Mitre.',
    fotos: ['retiro-1937', 'retiro-hall'],
  },
  'La Prensa': {
    era: 'El edificio del diario La Prensa, sobre la Avenida de Mayo. De 1898.',
    texto: [
      'El diario de José C. Paz inauguró en 1898 su casa de Avenida de Mayo 575. Se proyectó en París y lo adaptaron acá los ingenieros Carlos Agote y Alberto Gainza. Tiene unos 30 metros de frente sobre la avenida y otros tantos sobre Rivadavia, dos subsuelos, planta baja y seis pisos.',
      'Arriba de todo, a 50 metros, está «la farola»: una figura de bronce dorado de 5,50 metros y 4.100 kilos, de Maurice Bouval, con una antorcha eléctrica en alto. La subieron en noviembre de 1898. Desde 1900, una sirena anunciaba desde el edificio las grandes noticias.',
      'El frente de Rivadavia no sale en ninguna foto: va igual al de la avenida, más simple.',
    ],
    hoyEs: 'la Casa de la Cultura de la ciudad; es Monumento Histórico Nacional.',
    fotos: ['centro-prensa-1910', 'centro-prensa-farola'],
  },
  'Palacio Municipal': {
    era: 'La Intendencia, en la esquina de Bolívar y la Avenida de Mayo. De 1893.',
    eras: { 5: 'La Intendencia de 1893, ya ensanchada hasta Rivadavia, con la cúpula nueva en la otra esquina.' },
    texto: [
      'Lo proyectó Juan Antonio Buschiazzo y lo levantó Juan Cagnoni. La piedra fundamental es del 31 de diciembre de 1890 y se inauguró en marzo de 1893. Fue el primer edificio de la vereda norte de la Avenida de Mayo, con apenas 15 metros de fondo sobre Bolívar; se entraba por tres arcos en la esquina.',
      'Medía 31 metros hasta la cresta de los techos y 48 hasta la flecha del domo central, que lleva un reloj de cuatro esferas.',
      'Entre 1911 y 1914 se ensanchó hasta Rivadavia. La ochava nueva tuvo una cúpula con una aguja de 65 metros, que después se reemplazó por un remate igual al de la otra esquina. No pude saber cuándo: en una foto de hacia 1942 ya no está, y acá se va en 1940.',
    ],
    hoyEs: 'sigue en pie, al lado de La Prensa: es el Palacio de Gobierno de la Ciudad.',
    fotos: ['centro-municipal-1900', 'centro-municipal-1899'],
  },
  'Confitería del Molino': {
    era: 'La confitería de la esquina de Callao y Rivadavia, frente al Congreso. De 1916.',
    texto: [
      'La confitería estaba en esta esquina desde 1905. El edificio es de Francisco Gianotti: se inauguró el 9 de julio de 1916, para el Centenario de la Independencia, y se terminó en 1917.',
      'Es de hormigón armado: tres subsuelos, planta baja y cinco pisos. Sobre la ochava sube la torre de 65 metros, con las aspas de molino, la cúpula de vitrales y la aguja.',
      'No encontré una foto de esos años con el edificio terminado: las dos que hay son de la obra.',
    ],
    hoyEs: 'cerró en 1997; hoy pertenece al Congreso, que lo está restaurando.',
    fotos: ['centro-molino-obra', 'centro-molino-postal'],
  },
  'Galería Güemes': {
    era: 'El pasaje de Florida a San Martín y, encima, el primer rascacielos de Buenos Aires. De 1915.',
    texto: [
      'También es de Francisco Gianotti. Las obras empezaron el 10 de marzo de 1913 y se inauguró el 15 de diciembre de 1915. El pasaje, de 116 metros, une Florida 165 con San Martín 170.',
      'Arriba es de hormigón armado: tres subsuelos, un cuerpo de seis pisos y otros ocho en dos alas. Son catorce pisos y 87 metros con la torre del faro.',
      'Es el menos documentado de los edificios del centro: de Florida solo hay foto de la planta baja, así que los pisos altos de los dos frentes son supuestos, y el faro va como se ve hoy.',
    ],
    hoyEs: 'el pasaje sigue abierto. El frente de Florida se quemó en 1971: el de hoy es moderno.',
    fotos: [],
  },
  'Gath & Chaves': {
    era: 'La casa central de la gran tienda, en Florida y Cangallo. De 1914.',
    texto: [
      'Se construyó entre 1912 y 1914 en la esquina sudoeste de Florida y Cangallo (hoy Perón), con proyecto de Francisque Fleury Tronquoy. Tiene dos subsuelos, planta baja y siete pisos.',
      'En el medio había un gran hall de ocho lados, con su escalera y una cúpula de vidrio, y en la terraza una confitería. En la esquina, la cúpula de pizarra.',
      'En 1925 se sumó un anexo en la esquina de enfrente. La altura no tiene fuente: sale de contar los pisos.',
    ],
    hoyEs: 'el edificio sigue en pie; la tienda cerró en 1974.',
    fotos: ['centro-gath-1914', 'centro-gath-hall'],
  },
  'Puente Transbordador': {
    era: 'El transbordador Nicolás Avellaneda, sobre el Riachuelo. De 1914.',
    texto: [
      'Lo autorizaron en 1908 y lo levantó el Ferrocarril del Sud, con una estructura de hierro traída de Inglaterra; se inauguró en 1914. Une La Boca con la Isla Maciel.',
      'Dos torres de celosía sostienen una viga de 77,5 metros, que deja 43,5 libres para los barcos. De la viga cuelga la barquilla, que llevaba gente, carros y tranvías de una orilla a la otra: llegó a cruzar a 17.000 personas por día.',
      'En 1940 se inauguró al lado el puente carretero nuevo, que acá no está. Las medidas de las torres salen de las fotos, y el puente va corrido unos 15 metros para que las dos pisen las orillas del plano.',
    ],
    hoyEs: 'sigue en pie, al lado del puente nuevo.',
    fotos: ['mod-transbordador-1920', 'mod-transbordador-1932'],
  },
  'Edificio Comega': {
    era: 'El rascacielos de la Compañía Mercantil y Ganadera, en Corrientes y Alem. De los primeros años 30.',
    texto: [
      'Lo proyectaron Enrique Douillet y Alfredo Joselevich, con el ingeniero Alberto Stein. Tiene 21 pisos y 88 metros, de hormigón armado revestido en travertino, sin un adorno. Sobre Alem se abre en dos alas, con un patio angosto entre las dos.',
      'En el piso 19 funcionaba una confitería con mirador. La obra se hizo entre 1931 y 1934; las alturas de las alas salen de contar pisos en la foto.',
    ],
    hoyEs: 'sigue en pie, en Corrientes y Alem.',
    fotos: ['mod-comega-1930s'],
  },
  'Edificio Safico': {
    era: 'Una torre escalonada de 90 metros, en Corrientes 456. De 1934.',
    texto: [
      'Es obra del ingeniero suizo Walter Moll, empezada en 1932 y habilitada en 1934. El reglamento no dejaba pasar de 40 metros sobre la línea del frente: hasta ahí es un bloque de planta baja y diez pisos. De ahí para arriba sube, retirada, una torre de quince pisos que se va escalonando.',
      'Pablo Neruda vivió en el departamento de la punta.',
    ],
    hoyEs: 'sigue en pie, sobre Corrientes.',
    fotos: ['mod-safico-1936'],
  },
  'Ministerio de Obras Públicas': {
    era: 'El primer rascacielos del Estado. De 1936.',
    eras: { 7: 'El primer rascacielos del Estado, de 1936: desde 1947, en medio de la 9 de Julio.' },
    texto: [
      'Lo proyectó Alberto Belgrano Blanco sobre una idea de José Hortal. La obra empezó el 15 de noviembre de 1934 y se inauguró en septiembre de 1936: planta baja y 22 pisos, 93 metros, con la planta en U.',
      'En 1940 estaba en su manzana, entre casas, con la iglesia de Monserrat a una cuadra: la 9 de Julio llegó hasta acá recién en 1947.',
    ],
    hoyEs: 'quedó en medio de la 9 de Julio, que lo rodea. Es el Ministerio de Salud.',
    fotos: ['mod-obraspublicas-1936'],
  },
  'Luna Park': {
    era: 'El estadio de Corrientes y Bouchard. De 1932.',
    texto: [
      'Lo proyectó Jorge Kálnay para Ismael Pace y José Lectoure. Se estrenó con los bailes de carnaval de 1932, a cielo abierto y con tres tribunas; en 1934 se lo techó. Ocupa la manzana de Corrientes, Bouchard, Lavalle y Madero, con la torrecita del cartel en la ochava.',
      'No encontré una foto de esos años con el techo: va como se ve hoy.',
    ],
    hoyEs: 'sigue siendo el Luna Park.',
    fotos: ['mod-lunapark-1932'],
  },
  'Mercado de Abasto': {
    era: 'El mercado mayorista de frutas y verduras, sobre Corrientes. De 1934.',
    texto: [
      'El edificio nuevo, de Delpini, Sulčič y Bes, se terminó en 1934 delante del mercado viejo de 1893. Son cinco naves de hormigón armado, la del medio la más alta, que asoman a Corrientes como cinco arcos vidriados, con dos cuerpos bajos en las puntas.',
      'Acá el mercado viejo no está: detrás de las naves queda un baldío. El ancho y el alto de cada arco son a ojo.',
    ],
    hoyEs: 'el mercado cerró en 1984; desde 1998 es un centro comercial.',
    fotos: ['mod-abasto-1945'],
  },
  'La Bombonera': {
    era: 'El estadio de Boca Juniors, recién inaugurado: el 25 de mayo de 1940.',
    eras: { 7: 'El estadio de Boca Juniors, con las dos bandejas completas desde 1941.' },
    texto: [
      'Está en Brandsen 805. El proyecto es de 1937 y 1938. En 1940 tenía dos bandejas en herradura; la segunda bandeja del sector norte se habilitó el 16 de noviembre de 1941: por eso en 1940 esa cabecera va con una sola, y en 1950, con las dos. La tercera bandeja es de 1951 a 1953, y los palcos de hoy, de 1996.',
      'Las alturas de las bandejas y el cuerpo bajo del lado recto son supuestos.',
    ],
    hoyEs: 'el estadio de Boca, ya con tres bandejas.',
    fotos: ['mod-bombonera-1939'],
  },
  'Torre de los Ingleses': {
    era: 'La torre del reloj que la colectividad británica regaló para el Centenario. De 1916.',
    texto: [
      'Los británicos de Buenos Aires la ofrecieron para el Centenario, y el Congreso aceptó el regalo por una ley de 1909. La proyectó Ambrose Macdonald Poynter y la levantó la empresa Hopkins y Gardom, con ladrillo y piedra traídos de Inglaterra. La piedra fundamental es del 26 de noviembre de 1910; la inauguración, del 24 de mayo de 1916.',
      'Está donde había estado la fábrica de gas del Retiro, que dejó el lugar en 1912. Tiene ocho pisos y unos 60 metros; el reloj, de Gillett & Johnston, tiene cuatro cuadrantes de 4,4 metros. Remata en una cúpula de cobre, con una fragata por veleta.',
      'Las fuentes no coinciden en el alto (59, 60 o 75 metros): acá va de 60.',
    ],
    hoyEs: 'la Torre Monumental, en la plaza Fuerza Aérea Argentina.',
    fotos: ['retiro-torre-1916', 'retiro-torre-1932'],
  },
  'Plaza Británica': {
    era: 'La plaza de la Torre de los Ingleses, frente a la estación Retiro. De 1916.',
    texto: [
      'Acá estuvo desde la década de 1850 la fábrica de gas del Retiro. La compañía dejó el terreno en 1912; ahí se levantó la torre que los británicos regalaron para el Centenario, inaugurada el 24 de mayo de 1916, y a su alrededor se hizo la plaza. El plano de 1921 ya la llama Plaza Británica.',
      'Ocupaba todo el frente de la estación nueva: un rectángulo de unos 135 por 215 metros, con la torre en una explanada en el medio y, a cada lado, canteros de árboles y parterres de flores. Por la avenida de la estación —Maipú entonces, hoy Ramos Mejía— pasaban los tranvías, y en la punta del lado del puerto paraban los colectivos. Del otro lado de la plaza estaban los galpones del puerto.',
      'El trazado de 1940 está calcado de las fotos aéreas de la ciudad de ese año; el de 1921, de una postal aérea de los años veinte. Los faroles, los bancos y el piso son supuestos, lo mismo que el alto de los galpones. Falta saber quién la proyectó.',
    ],
    hoyEs: 'la Plaza Fuerza Aérea Argentina: el nombre es de 1982. La plaza de hoy se hizo por una ley de 1945.',
    fotos: ['retiro-torre-1916', 'darsenanorte-aerea', 'retiro-1937'],
  },
  'Plaza Hotel': {
    era: 'El primer gran hotel de lujo de la ciudad, frente a la plaza San Martín. De 1909.',
    texto: [
      'Lo hizo levantar el banquero Ernesto Tornquist, con proyecto del alemán Alfred Zucker, en Florida y Charcas (hoy Marcelo T. de Alvear). Abrió el 15 de julio de 1909, con nueve pisos, 160 habitaciones y 16 suites.',
      'En 1913 se le agregó la entrada de carruajes sobre la esquina: por eso en 1910 se ve con el cerco y las marquesinas, y desde 1921 con el pabellón redondo. La reforma de 1934 le sacó buena parte de los adornos; como no hay foto de cómo quedó, en 1940 sigue igual que en 1921.',
    ],
    hoyEs: 'el edificio sigue en pie, al lado del Kavanagh; el hotel cerró en 2017.',
    fotos: ['retiro-plaza-1910', 'retiro-plaza-peuser'],
  },
  'Palacio Paz': {
    era: 'La casa particular más grande de la ciudad, sobre la plaza San Martín. Terminada en 1914.',
    eras: { 6: 'El Palacio Paz, la casa particular más grande de la ciudad: desde 1938, el Círculo Militar.' },
    texto: [
      'José C. Paz, el fundador del diario La Prensa, la encargó en París al arquitecto Louis Sortais, que nunca vino a Buenos Aires; acá dirigió la obra Carlos Agote. Se construyó entre 1902 y 1914, y Paz murió en 1912, sin verla terminada.',
      'Tiene unos 12.000 metros cuadrados y 140 habitaciones. El Estado la compró en 1938 para el Círculo Militar.',
      'Las alturas salen de las proporciones de una foto de 1916; el lado del jardín va liso, sin foto de época.',
    ],
    hoyEs: 'sigue siendo la sede del Círculo Militar.',
    fotos: ['retiro-paz-1916'],
  },
  'Palacio San Martín': {
    era: 'El Palacio Anchorena: tres residencias alrededor de un patio de honor. De 1909.',
    eras: { 6: 'El viejo Palacio Anchorena: desde 1936, el Ministerio de Relaciones Exteriores.' },
    texto: [
      'Mercedes Castellanos de Anchorena lo encargó en 1905 a Alejandro Christophersen, para ella y sus hijos. Son tres casas detrás de un portal único, sobre la calle Arenales. La Cancillería da la obra por terminada en 1909; otras fuentes dicen 1912 o 1916.',
      'El Estado lo compró en 1936 para el Ministerio de Relaciones Exteriores, y desde entonces se llama Palacio San Martín.',
    ],
    hoyEs: 'la sede ceremonial de la Cancillería; es Monumento Histórico Nacional desde 1994.',
    fotos: ['retiro-anchorena'],
  },
  'Pabellón Argentino': {
    era: 'El pabellón del país en la Exposición Universal de París de 1889, rearmado en la plaza San Martín.',
    texto: [
      'Lo proyectó Albert Ballu, de hierro, vidrio, cerámica y mosaicos. Terminada la exposición se desarmó y vino en barco, en unos 6.000 cajones. El ingeniero Juan Waldorp lo rearmó en 1893 donde había estado el cuartel de artillería del Retiro, y se reinauguró el 14 de enero de 1894.',
      'Tuvo exposiciones —la Nacional de 1898, la de Arte del Centenario— y de 1910 a 1932 fue el Museo Nacional de Bellas Artes. En 1933 lo desarmaron para agrandar la plaza.',
      'El lugar sale de una postal de hacia 1920, con unos diez metros de margen; los colores son una aproximación.',
    ],
    hoyEs: 'parte de la plaza San Martín. De sus esculturas quedan algunas repartidas por la ciudad.',
    fotos: ['retiro-pabellon-sfa', 'retiro-pabellon-1900'],
  },
  'Costanera Sur': {
    era: 'El paseo y el balneario de la ciudad, sobre el río.',
    texto: [
      'Detrás de Puerto Madero había quedado un triángulo de tierra ganada al río, abandonado. En 1916 la Municipalidad le encargó un proyecto a su director de Paseos, Benito Carrasco; las obras empezaron en 1918, y el 11 de diciembre de ese año se inauguró el Balneario Municipal, entre las calles Belgrano y Brasil.',
      'En los años veinte se llenó de cervecerías y restaurantes; algunos, del arquitecto Andrés Kalnay, todavía están. Dejó de ser balneario en la década de 1980, cuando los rellenos de adelante se volvieron la Reserva Ecológica.',
    ],
    hoyEs: 'un paseo que ya no da al río, al borde de la Reserva Ecológica.',
    fotos: ['costanera-1935', 'costanera-1918'],
  },
  'Palacio Barolo': {
    era: 'Cien metros sobre la Avenida de Mayo: hasta 1935, el más alto de la ciudad.',
    texto: [
      'Se lo encargó el empresario textil Luis Barolo al arquitecto italiano Mario Palanti, que diseñó hasta los picaportes. Se inauguró el 7 de julio de 1923; Barolo había muerto antes. Es de hormigón armado y termina en un faro.',
      'Palanti hizo otro parecido en Montevideo, el Palacio Salvo. Se suele contar que el Barolo es una alegoría de la Divina Comedia: es una lectura de 1993, y no se conocen documentos de Palanti ni de Barolo que la respalden.',
    ],
    hoyEs: 'un edificio de oficinas, con su faro. Monumento Histórico Nacional desde 1997.',
    fotos: ['barolo-1925', 'barolo-zeppelin'],
  },
  'Correo Central': {
    era: 'El Palacio de Correos, inaugurado en 1928 después de cuarenta años de idas y vueltas.',
    texto: [
      'Juárez Celman aprobó el proyecto en 1888. Lo diseñó el francés Norbert Maillart —el mismo de Tribunales—, que empezó en 1889 sobre un terreno recién ganado al río; la crisis de 1890 paró la obra.',
      'En 1908 se contrató otra vez a Maillart para un proyecto nuevo, más grande y con la entrada por la calle Sarmiento, aprobado en 1909. En 1923 se acabaron los fondos, y lo inauguró por fin Alvear el 28 de septiembre de 1928, bastante distinto de como se lo había pensado.',
    ],
    hoyEs: 'el Palacio Libertad (Centro Cultural Domingo Faustino Sarmiento): dejó de ser correo en 2002.',
    fotos: ['correo-1930'],
  },
  'Edificio Kavanagh': {
    era: 'Un rascacielos de departamentos frente a la Plaza San Martín. De 1936.',
    texto: [
      'Lo pagó Corina Kavanagh y lo proyectó el estudio Sánchez, Lagos y de la Torre. La obra empezó el 16 de abril de 1934 y la estructura llegó arriba el 3 de noviembre de ese año; se inauguró el 3 de enero de 1936.',
      'Con 120 metros fue, hasta 1947, el edificio más alto de América Latina, y la estructura de hormigón armado más alta de Sudamérica. Sube escalonado, con terrazas, como la proa de un barco. Tiene 105 departamentos y fue el primer edificio de viviendas de la ciudad con aire acondicionado central.',
    ],
    hoyEs: 'sigue siendo de departamentos, en Florida 1065.',
    fotos: ['kavanagh-postal', 'kavanagh-cocina'],
  },
  'Obelisco': {
    era: 'Levantado en 1936, por los cuatrocientos años de la primera fundación.',
    texto: [
      'Es del arquitecto Alberto Prebisch y se hizo en dos meses: la obra empezó el 20 de marzo de 1936 y se inauguró el 23 de mayo. Mide 67,5 metros, y arriba tiene cuatro ventanas, a las que se llega por adentro.',
      'Está en la Plaza de la República, donde se cruzan Corrientes, la 9 de Julio y la Diagonal Norte: el lugar de la iglesia de San Nicolás, demolida en 1931, donde se izó por primera vez la bandera en la ciudad.',
    ],
    hoyEs: 'el Obelisco.',
    fotos: ['obelisco-obra', 'obelisco-disandro'],
  },
  'Avenida 9 de Julio': {
    era: 'En 1940, apenas cinco cuadras a los lados del Obelisco.',
    eras: { 7: 'En 1950, de la avenida Belgrano a la avenida Córdoba.' },
    texto: [
      'La idea de una avenida de norte a sur venía de fines del siglo XIX, y una ley de 1912 autorizó a expropiar las manzanas enteras entre Cerrito–Lima y Carlos Pellegrini–Bernardo de Irigoyen. Pasaron veinticinco años más.',
      'En marzo de 1937 el intendente Mariano de Vedia y Mitre ordenó abrirla, sobre los diseños de Carlos María della Paolera: 140 metros de ancho, con estacionamientos subterráneos. El primer tramo, de Bartolomé Mitre a Tucumán —unos 500 metros—, lo inauguró el presidente Justo el 12 de octubre de 1937.',
      'Hacia el sur, las cinco manzanas de Bartolomé Mitre a Belgrano se demolieron entre 1944 y 1947; en la última quedó en pie el Ministerio de Obras Públicas, en medio de la traza. Hacia el norte, el tramo de Tucumán a Córdoba se habilitó en 1950 y el que sigue hasta Paraguay, en 1951. Hasta Santa Fe y hasta Independencia llegó recién en 1971.',
      'De los tramos de 1947 y 1950 no hay acá una foto medida: los canteros repiten el corte del tramo de 1937, y es supuesto.',
    ],
    hoyEs: 'la Avenida 9 de Julio, que cruza todo el centro.',
    fotos: ['nuevedejulio-aerea', 'nuevedejulio-postal'],
  },
  // (lo que rodeaba a la Plaza de la República hacia 1940, src/lugares/obelisco-1940.js. Los datos, de los artículos
  // de Wikipedia en español de cada uno y de «Avenida Corrientes», consultados en noviembre de 2026)
  'El Trust Joyero Relojero': {
    era: 'La joyería de la esquina de Corrientes y Carlos Pellegrini. De 1925.',
    texto: [
      'En 1911 Juan Peire compró la vieja joyería Marinelli e Hijos, que estaba en esta esquina, y en 1924 la casa pasó a llamarse El Trust Joyero Relojero. Al año siguiente demolió el local viejo y levantó este edificio: la joyería abajo y, arriba, departamentos pensados para consultorios médicos.',
      'Con el ensanche de Corrientes, el Obelisco y la 9 de Julio, la esquina quedó en el lugar más fotografiado de la ciudad: la cúpula con el reloj y el cartel del Trust se volvieron la postal de la avenida nueva.',
      'Los carteles son los que se leen en una foto de 1936: «El Trust» sobre la azotea y, dando la vuelta a la ochava, «Relojes Marconi dan la hora al mundo». Al lado, sobre la Diagonal Norte, está el edificio blanco de frente curvo que en esa foto es todavía un esqueleto de hormigón y en 1937 ya aparece terminado.',
    ],
    hoyEs: 'el edificio sigue en pie, con la cúpula y el reloj; la joyería ya no está.',
    fotos: ['republica-trust-1936', 'republica-disandro-1937'],
  },
  'Edificio Díaz': {
    era: 'La mueblería de Sarmiento 1113, con un chalet en la terraza. De 1927.',
    texto: [
      'Rafael Díaz llegó de Sevilla en 1886, a los catorce años, y terminó dueño de una de las mueblerías más grandes del país. Levantó este edificio de nueve pisos —cada piso, un muestrario— y en 1926 decidió hacerse una casa en la azotea, para almorzar y dormir la siesta sin volver hasta Banfield: un chalet normando como los de Mar del Plata, terminado en 1927.',
      'La casa tuvo también su radio, LOK Radio Mueblería Díaz, con la antena en el mismo edificio. En una foto de 1937 se ven dos torres de hierro con las letras «Diaz» puestas una sobre otra y, en lo alto de la medianera, el tablero «Muebles Diaz».',
      'El pie de la segunda torre, la más baja, no se ve en la foto: va sobre la casa de la esquina de Cerrito, que es donde cae.',
    ],
    hoyEs: 'el edificio y el chalet siguen ahí, a la vista desde la 9 de Julio; la mueblería cerró en 1985.',
    fotos: ['republica-1937'],
  },
  'Cine Gran Rex': {
    era: 'El cine más grande de Corrientes, en el 857. De 1937.',
    texto: [
      'Lo proyectó Alberto Prebisch —el del Obelisco— con el ingeniero Adolfo T. Moret, y se hizo en seis meses. El frente es un rectángulo liso revestido en travertino, sin un adorno, con un gran paño de vidrio que deja ver el interior desde la vereda, partido en dos por una viga fina colgada de tensores. Tiene lugar para 3.262 espectadores, en platea y dos balcones.',
      'No encontré una foto del frente de esos años que se pueda mostrar: va según esa descripción y como se lo ve, de lejos, en una aérea de 1937. El letrero «Gran Rex» de la marquesina es supuesto: la sala llevaba su nombre al frente, pero cómo era ese letrero no sale de ninguna foto.',
    ],
    hoyEs: 'sigue siendo el Gran Rex.',
    fotos: [],
  },
  'Cine Teatro Ópera': {
    era: 'El tercer Ópera, en Corrientes 860. De 1936.',
    texto: [
      'El primer Teatro de la Ópera se inauguró acá en 1872 y se rehízo en 1889. Con el ensanche de Corrientes —que tiraba la vereda de enfrente y a esta no la tocaba—, su dueño, Clemente Lococo, aprovechó para hacer el tercero: en 1935 se demolió el viejo y el arquitecto belga Alberto Bourdon proyectó este, para 2.500 personas.',
      'El frente tiene un cuerpo curvo de ventanas altas que termina en una torre redonda de dos escalones, y una marquesina curva sobre la vereda. Encima, las letras «Opera» y el cartel de la película: en la foto de 1936, «Tiempos modernos».',
    ],
    hoyEs: 'sigue siendo el Teatro Ópera.',
    fotos: ['opera-grasser-1937', 'opera-coppola-1936'],
  },
  'Teatro Broadway': {
    era: 'Cine teatro art déco, en Corrientes 1155. De 1930.',
    texto: [
      'Lo proyectó Jorge Kálnay en 1929 para el empresario Augusto Álvarez y se inauguró el 11 de octubre de 1930. Abajo, la sala: sin columnas, para 2.265 personas, con el techo paraboloide y aire acondicionado. Arriba, ocho pisos de departamentos de renta.',
      'El frente va como se lo ve hoy: no encontré una foto de esos años. Por eso el letrero «Broadway» de la marquesina es supuesto: dice el nombre de la sala, pero no copia el cartel que tuvo. El techo de la sala es el de la foto aérea de 1940, donde al lado, hasta Cerrito, hay una playa de estacionamiento.',
    ],
    hoyEs: 'sigue siendo el Teatro Broadway; los pisos de arriba son un hotel.',
    fotos: [],
  },
  'Tabarís': {
    era: 'El dancing y teatro de Corrientes 829, con el frente de 1937.',
    texto: [
      'Se había llamado Royal Pigall y fue un club nocturno de categoría. Con Corrientes recién ensanchada le hicieron este frente de vidrio y aletas, con las letras inclinadas sobre la marquesina: es de 1937, del arquitecto Rafael Sammartino, y salió en la Revista de Arquitectura de mayo de ese año.',
    ],
    hoyEs: 'el Teatro Tabarís, al lado del Gran Rex.',
    fotos: ['tabaris-1937'],
  },
  'Carteles de la Plaza de la República': {
    era: 'Los avisos que rodeaban al Obelisco hacia 1937.',
    texto: [
      'Alrededor de la plaza nueva se llenaron de avisos las azoteas, las medianeras y las marquesinas. Acá están solo los que se pueden leer en una foto fechada: las dos torres «Diaz» y el tablero «Muebles Diaz» de la mueblería de Sarmiento; «El Trust» y «Relojes Marconi dan la hora al mundo» en la esquina de la joyería; «Opera» y «Tabaris» sobre sus marquesinas de Corrientes; y este, «El Guipur», el cartel colgante de Carlos Pellegrini 539.',
      'En las mismas fotos hay otros que no se alcanzan a leer —sobre las casas de Cerrito al 300, en el cerco del baldío de Corrientes y Cerrito— y no están; tampoco los de las postales de años después. Las fotos son en blanco y negro: los colores no se saben.',
    ],
    fotos: ['republica-1937', 'republica-trust-1936'],
  },

  // --- lo que está armado pieza por pieza en src/lugares/. Los datos salen de los mismos artículos de Wikipedia en
  // español con que se modeló cada cosa (noviembre de 2026); casi ninguna tiene todavía foto de época propia. ---
  'Monumento a Belgrano': {
    era: 'Belgrano a caballo, con la bandera en alto. De 1873.',
    texto: [
      'El jinete es del francés Albert-Ernest Carrier-Belleuse y el caballo, del argentino Manuel de Santa Coloma. Se inauguró el 24 de septiembre de 1873 en el centro de la Plaza 25 de Mayo, la mitad de la plaza que daba a la Casa de Gobierno.',
      'En 1886, ya unidas las dos plazas, quedó donde está: frente a la Casa de Gobierno, mirando al norte.',
    ],
    hoyEs: 'sigue ahí, frente a la Casa Rosada.',
    fotos: ['belgrano-1885', 'plazamayo-photoglob'],
  },
  'Fuentes de hierro': {
    era: 'Las fuentes de fundición que tuvo la plaza desde 1870.',
    texto: [
      'Eran dos, de hierro, traídas de la fundición francesa de Val d’Osne, y se pusieron en 1870 a cada lado de la Pirámide.',
      'Cuando Carlos Thays rehízo la plaza para la inauguración de la Avenida de Mayo, en 1894, quedó una sola, en el medio de sus canteros. Ya no está en el trazado de 1921.',
    ],
    fotos: ['fuente-1884', 'plazamayo-sfa'],
  },
  'Pirámide de Mayo': {
    era: 'La Pirámide, en el centro de la plaza desde 1912.',
    texto: [
      'Hasta entonces estaba en el medio de la vieja Plaza de la Victoria, la mitad oeste. En noviembre de 1912 la corrieron 63 metros hacia el este, sobre rieles, porque se pensaba levantar un monumento enorme que la guardara adentro. Ese monumento nunca se hizo.',
      'En la mudanza perdió la reja y las cuatro estatuas de mármol que tenía al pie desde 1873, que fueron a un depósito municipal.',
    ],
    hoyEs: 'sigue en ese lugar. Las cuatro estatuas están desde 1972 en la plazoleta de Defensa y Alsina.',
    fotos: ['plazamayo-1931', 'piramide-traslado'],
  },
  'El Perdón': {
    era: 'Un grupo de mármol en el cuadro central del jardín.',
    texto: ['Es de 1896, del escultor francés Juan Eugenio Boverie. Estuvo en el parterre del medio de la plaza desde que se inauguró, en 1910.'],
    hoyEs: 'desde 1991 está en el Parque Avellaneda.',
    fotos: ['plazacongreso-detalle', 'plazacongreso-loc'],
  },
  'El Pensador': {
    era: 'El bronce de Rodin, en la plaza desde 1907.',
    texto: ['Es una réplica sacada del molde original y firmada por Auguste Rodin. Está acá desde noviembre de 1907; en la plaza de 1910 quedó en el tramo del medio, junto al estanque.'],
    hoyEs: 'sigue en la plaza.',
    fotos: ['pensador-1910', 'plazacongreso-detalle'],
  },
  'Plaza Lorea': {
    era: 'La plaza vieja del barrio, partida en dos por la Avenida de Mayo.',
    texto: [
      'Isidro Lorea compró en 1782 la quinta que había acá, a la salida de la ciudad, y de ahí salió la plaza que lleva su nombre. La Avenida de Mayo, en 1894, la cruzó por el medio y la dejó en dos mitades.',
      'Para el Centenario, Carlos Thays la ajardinó junto con la plaza nueva del Congreso: canteros, palmeras y, en la mitad sur, el monumento a Mariano Moreno.',
    ],
    hoyEs: 'la mitad norte sigue llamándose Plaza Lorea; la del sur es la Plaza Mariano Moreno.',
    fotos: ['plazacongreso-loc', 'plazalorea-rimathe'],
  },
  'Mariano Moreno': {
    era: 'El monumento al secretario de la Primera Junta. De 1910.',
    texto: ['Es un bronce del catalán Miguel Blay, sobre una roca con un cóndor. Se inauguró el 1 de octubre de 1910, en la mitad sur de la Plaza Lorea.'],
    hoyEs: 'sigue en su lugar: ese sector se llama hoy Plaza Mariano Moreno.',
    fotos: ['plazacongreso-loc'],
  },
  'Kilómetro Cero': {
    era: 'El monolito desde donde se miden las rutas nacionales. De 1935.',
    texto: ['Es obra de los hermanos Máximo y José Fioravanti y se puso en octubre de 1935 en la punta norte de la Plaza Lorea, donde la Avenida de Mayo empalma con Rivadavia.'],
    hoyEs: 'sigue en la plaza: en 1944 lo corrieron unos metros, hacia la calle Virrey Cevallos.',
    fotos: [],
  },
  'Diagonal Norte': {
    era: 'La avenida Roque Sáenz Peña: de la Plaza de Mayo al Obelisco y a la Plaza Lavalle, en diagonal.',
    texto: [
      'Las dos diagonales que salen de la Plaza de Mayo se empezaron en 1913, cortando las manzanas al sesgo. La del norte llegaba a Maipú hacia 1916, a Suipacha en 1931 y a la 9 de Julio en 1936. El último tramo, hasta la Plaza Lavalle, se dio por terminado en 1943, pero en la foto aérea de 1940 la calzada ya está abierta hasta Lavalle y Libertad: del lado del norte, una fila de edificios altos; del otro, los baldíos de la demolición y la playa de estacionamiento de Corrientes.',
      'Se hizo con una regla estricta: todos los frentes a la misma altura, 33 metros. Por eso sus cuadras parecen un solo edificio, y por encima de esa línea asoman las cúpulas.',
    ],
    hoyEs: 'la avenida Presidente Roque Sáenz Peña.',
    fotos: ['diagonal-coppola', 'diagonal-1930'],
  },
  'Banco de Boston': {
    era: 'La sede del First National Bank of Boston, inaugurada en 1924.',
    texto: [
      'La proyectaron Paul Bell Chambers y Louis Newbery Thomas, con el estudio York y Sawyer, de Nueva York. La portada de la ochava, de 17 metros, se inspira en la del Hospital de Santa Cruz, de Toledo: 400 toneladas de piedra caliza de Indiana talladas en Nueva York, con una puerta de bronce de cuatro toneladas.',
      'Remata en una cúpula de tejas coloniales rojas. Con La Equitativa y los dos Bencich arma el cruce de las cuatro cúpulas de Florida y la Diagonal.',
    ],
    hoyEs: 'el edificio sigue en pie, en Florida y la Diagonal Norte.',
    fotos: ['boston-1924', 'boston-cupula'],
  },
  'La Equitativa del Plata': {
    era: 'La casa de una compañía de seguros, art déco. De 1929.',
    texto: ['La proyectó Alejandro Virasoro en 1927 y la terminó en 1929 su propia constructora: subsuelo, planta baja y ocho pisos. Por su frente liso, sin adornos, le decían «Sin novedad en el frente». En el local de la esquina funcionó la Aeropostal.'],
    hoyEs: 'sigue en pie, en la esquina de Florida.',
    fotos: ['equitativa-1930'],
  },
  'Edificio Bencich': {
    era: 'El edificio de renta de las dos cúpulas. De 1927.',
    texto: ['Lo proyectó el francés Eduardo Le Monnier para la constructora de los hermanos Bencich, que eran de Trieste. Los frentes son de símil piedra, con balcones en el segundo y el noveno piso, y arriba lleva dos cúpulas de cinco pisos de alto.'],
    hoyEs: 'sigue en pie.',
    fotos: [],
  },
  'Edificio Miguel Bencich': {
    era: 'El otro edificio de los Bencich, en la vereda de enfrente. De 1927.',
    texto: ['También es de Eduardo Le Monnier para la misma empresa. Con el Bencich, el Banco de Boston y La Equitativa completa el cruce de las cuatro cúpulas de Florida y la Diagonal.'],
    hoyEs: 'sigue en pie.',
    fotos: [],
  },
  'Banco Argentino Uruguayo': {
    era: 'La punta de la Diagonal que da a la Plaza de Mayo. Hacia 1928.',
    texto: ['Lo proyectó Eduardo Le Monnier para la casa matriz del banco, con oficinas de renta arriba: dos subsuelos, planta baja y ocho pisos, y una torre cuya linterna llega a 56 metros. La ochava es un cilindro con pilastras jónicas. Lo construyeron los ingenieros Ayerza y Perrone.'],
    hoyEs: 'es la sede de la Jefatura de Gabinete.',
    fotos: ['bancouruguayo-1927'],
  },
  'La Continental': {
    era: 'Una manzana en triángulo entre la Diagonal, Maipú y Cangallo.',
    texto: ['Alejandro Bustillo lo proyectó en 1927 para la compañía de seguros La Continental; lo construyó Erik Schmidt y abrió en 1931 como Hotel Continental, con 186 habitaciones. El frente tiene columnas de tres pisos de alto.'],
    hoyEs: 'sigue en pie, en la Diagonal Norte al 700.',
    fotos: ['continental-1931'],
  },
  'Estacionamiento subterráneo': {
    era: 'La playa que se hizo debajo de la avenida, en 1937.',
    texto: ['La 9 de Julio se inauguró en 1937 con estacionamientos bajo tierra. Los autos bajaban por rampas abiertas en los canteros, con baranda blanca.'],
    fotos: ['estacionamiento-1937', 'nuevedejulio-aerea'],
  },
  'La rada': {
    era: 'El puerto que no había: los barcos, fondeados río adentro.',
    texto: [
      'El río frente a la ciudad es playo, y los barcos de ultramar no podían arrimarse: fondeaban lejos de la costa. Pasajeros y carga hacían el último tramo en balleneras y, con el río bajo, en carros de ruedas altas que entraban en el agua.',
      'La gente bajaba en el muelle de pasajeros, de 1855, y la carga, en el de la Aduana Nueva. Todo eso terminó con los diques de Madero.',
    ],
    fotos: ['rada-boote', 'rada-vidal'],
  },
  'Dársena Sur': {
    era: 'La entrada sur del puerto, inaugurada el 28 de enero de 1889.',
    texto: ['Fue lo primero que se habilitó del puerto de Madero: por acá, junto a la boca del Riachuelo, se entraba a los diques desde el sur.'],
    hoyEs: 'la Dársena Sur, entre Puerto Madero y la Boca.',
    fotos: ['darsenasur-1915'],
  },
  'Puente giratorio': {
    era: 'Uno de los cuatro puentes que cruzaban los pasos entre los diques.',
    texto: ['Para llegar por tierra a los muelles del otro lado, el puerto tuvo cuatro puentes giratorios: cada uno giraba sobre su pilar para dejar pasar los barcos de un dique al otro.', 'Dónde estaba cada uno es una suposición: acá van en los tres pasos entre diques y en el de la Dársena Norte.'],
    fotos: [],
  },
  'Los docks': {
    era: 'Los depósitos de ladrillo del puerto, hechos entre 1895 y 1905.',
    texto: [
      'Los diseñaron en Gran Bretaña los mismos ingenieros del puerto, Hawkshaw, Son & Hayter, y los construyó la empresa alemana Wayss & Freytag. Son dieciséis, cuatro por dique, todos del lado de la ciudad, con grúas en el frente para subir la carga a cada piso.',
      'Puestos en fila, le taparon a la ciudad la vista del río.',
    ],
    hoyEs: 'siguen ahí, reciclados.',
    fotos: ['docks-1909', 'puerto-dique2'],
  },
  'Elevadores de granos': {
    era: 'Las torres que cargaban el cereal en los barcos.',
    texto: ['Del lado del río, las compañías exportadoras fueron levantando sus silos y elevadores: torres de chapa que subían el grano y lo volcaban por un caño en las bodegas.', 'Su lugar exacto es aproximado: salen de una foto de Harry Grant Olds, de hacia 1910, y de las manchas del plano de 1905.'],
    fotos: ['elevadores-olds', 'elevadores-1915'],
  },
  'Molinos Río de la Plata': {
    era: 'El molino y los silos de Bunge y Born, sobre el Dique 2.',
    texto: ['A partir de 1902, Bunge y Born levantó a lo largo del Dique 2 los silos y depósitos de Molinos Río de la Plata.'],
    hoyEs: 'quedan dos de esos edificios, reciclados.',
    fotos: ['molinos-1910', 'puerto-1915'],
  },
  'Dársena Norte': {
    era: 'La entrada norte del puerto, habilitada en 1897.',
    texto: ['Se habilitó junto con el Dique 4, y con ella el puerto de Madero quedó completo: se dio por terminado el 31 de marzo de 1898.'],
    hoyEs: 'la Dársena Norte.',
    fotos: ['darsenanorte-1921', 'darsenanorte-aerea'],
  },
  'Yacht Club Argentino': {
    era: 'La sede del club, en la boca de la Dársena Norte. De 1915.',
    texto: ['La proyectó Eduardo Le Monnier y se inauguró el 23 de diciembre de 1915. Antes el club había tenido sedes flotantes, en barcos fondeados en el Tigre.', 'Su lugar acá es aproximado, leído del plano de 1921.'],
    hoyEs: 'sigue siendo la sede del club.',
    fotos: ['darsenanorte-1921'],
  },
  'Fuente de las Nereidas': {
    era: 'La fuente de Lola Mora, mudada a la Costanera en 1918.',
    texto: [
      'Es de mármol de Carrara: las nereidas asisten al nacimiento de Venus. Lola Mora la hizo por encargo del intendente Adolfo Bullrich y se inauguró el 21 de mayo de 1903 en el Parque Colón, en el Paseo de Julio y Cangallo.',
      'Los desnudos armaron un escándalo, y en 1918 la mandaron más lejos: a la Costanera Sur, que se estaba haciendo.',
    ],
    hoyEs: 'sigue en la Costanera Sur.',
    fotos: ['nereidas-1916', 'nereidas-1938'],
  },
  'Fuente de las Nereidas (1903)': {
    titulo: 'Fuente de las Nereidas', era: 'La fuente de Lola Mora en su primer lugar, sobre el Paseo de Julio. De 1903 a 1918.',
    texto: [
      'Lola Mora la hizo en Roma, en mármol de Carrara, por encargo del intendente Adolfo Bullrich, y vino a dirigir el armado. Iba a ir en la Plaza de Mayo, pero los desnudos molestaron y terminó acá, en el cantero en punta entre el Paseo de Julio, la avenida Rosales y Cangallo. Se inauguró el 21 de mayo de 1903.',
      'Las quejas siguieron, y en 1918 la mudaron a la Costanera Sur, que se estaba haciendo: está ahí desde el 8 de diciembre de ese año. El traslado también lo dirigió ella.',
      'Una nota de La Nación de 2023 la pone una cuadra más al norte, entre Cangallo y Sarmiento; acá va donde la marca el plano del estudio de Patricia Corsani, de 2007. El punto exacto dentro del cantero, las medidas de la fuente y el contorno del cantero son supuestos. Faltan los árboles que lo llenaban.',
    ],
    hoyEs: 'la fuente sigue en la Costanera Sur.',
    fotos: ['nereidas-palace', 'nereidas-postal', 'nereidas-1916'],
    por: '@mormonnegro',
  },
  'Cervecería Munich': {
    era: 'La cervecería del balneario, inaugurada el 21 de diciembre de 1927.',
    texto: ['El empresario catalán Ricardo Banús se la encargó al arquitecto húngaro Andrés Kálnay, y se levantó en cuatro meses y ocho días. Le fue tan bien que la Municipalidad proyectó toda una fila de cervecerías y confiterías a lo largo del paseo.', 'Su forma acá es un boceto.'],
    hoyEs: 'el edificio sigue en pie y es un museo.',
    fotos: ['munich-1927', 'munich-noche'],
  },
  // el Puerto Nuevo (src/lugares/puerto-nuevo.js)
  'Puerto Nuevo': {
    era: 'El puerto en peine, al norte de la Dársena Norte. De 1911 a 1928.',
    texto: [
      'El puerto de Madero quedó chico enseguida: los diques en fila, con sus esclusas y sus puentes, no daban abasto. El nuevo se hizo al norte y con otro dibujo, cinco dársenas abiertas, una al lado de la otra como los dientes de un peine, de la A a la E. Lo construyó la empresa inglesa C. H. Walker & Co.: las obras empezaron en 1911, la primera parte se inauguró en 1919 y el conjunto se terminó en 1928.',
      'Dos escolleras de piedra, una de 2.720 metros y otra de 950, abrigan el antepuerto. En 1921 se ven en uso las primeras dársenas y las del norte todavía en obra, con las dragas y los martinetes; en 1940, las cinco con sus galpones y sus grúas eléctricas.',
      'El contorno de las dársenas es el de hoy; lo que había en cada una en 1921 sale de una carta del puerto de 1919–1920.',
    ],
    hoyEs: 'sigue siendo el puerto de cargas y de pasajeros de la ciudad.',
    fotos: ['darsenanorte-aerea'],
  },
  'Hotel de Inmigrantes': {
    era: 'El hotel de los recién llegados, junto a la Dársena Norte. De 1906 a 1911.',
    texto: [
      'Reemplazó a los alojamientos precarios que hubo antes en el Retiro. Es de hormigón armado: planta baja y tres pisos, con cuatro dormitorios por piso para 250 personas cada uno. Llegó a alojar a 3.000, y en el comedor se servía a mil por turno. La estadía, de cinco días, era gratis.',
      'Era parte de un conjunto: el desembarcadero sobre el muelle, donde atracaban los vapores y se revisaban los papeles y los baúles, la oficina de trabajo, el hospital y los depósitos de equipajes.',
      'Cerró en 1953.',
    ],
    hoyEs: 'Monumento Histórico Nacional desde 1995; ahí funciona el Museo de la Inmigración. En el desembarcadero está la Escuela de Guerra Naval.',
    fotos: ['inmigrantes-mop'],
  },
  'Usina de la CHADE': {
    era: 'La «súper usina» de Puerto Nuevo, de la Compañía Hispano Americana de Electricidad.',
    texto: [
      'La CHADE la levantó a fines de la década de 1920 sobre 140.400 metros cuadrados de tierra ganada al río, que se le cedieron gratis. Estaba proyectada para 900.000 caballos de fuerza, con doce turbinas y cuarenta y dos calderas, y tenía su playa de carbón en la punta del espigón.',
      'El frente, de más de 190 metros, mira a la ciudad, con un arco entre dos torres. Las fuentes no coinciden en el año en que empezó a funcionar (1927 o 1932); acá aparece en 1940.',
    ],
    hoyEs: 'sigue generando electricidad: es la Central Puerto Nuevo.',
    fotos: ['chade-1933', 'chade-collivadino'],
  },
  'Usina de la Ítalo': {
    era: 'La usina «Dr. Carlos Givogri», de la Compañía Ítalo Argentina de Electricidad.',
    texto: [
      'La Ítalo era la competidora de la CHADE, y puso su gran usina al lado, en el espigón más al norte del puerto. Se inauguró en 1932 o 1933, según la fuente. Es de ladrillo a la vista, como las demás usinas y subusinas de la compañía que quedan por la ciudad.',
      'Su forma acá es supuesta: el lugar es el que marca el plano de Peuser.',
    ],
    hoyEs: 'sigue en servicio: es la Central Nuevo Puerto.',
    fotos: [],
  },
  'Subte A': {
    era: 'El «subterráneo» de la Compañía de Tranvías Anglo Argentina, de Plaza de Mayo a Caballito. De 1913 y 1914.',
    texto: [
      'Fue el primero de América Latina. La Anglo, que ya manejaba casi todos los tranvías de la ciudad, empezó las obras en septiembre de 1911 y se las encargó a la constructora alemana Philipp Holzmann. El 1 de diciembre de 1913 se inauguró el tramo de Plaza de Mayo a Plaza Once, por debajo de la Avenida de Mayo y de Rivadavia; el 1 de abril de 1914 llegó a Río de Janeiro y en julio a Caballito, la estación que desde 1923 se llama Primera Junta.',
      'En la calle solo se veían las bocas: un pórtico de hierro con el cartel y una baranda alrededor de la escalera. Los trenes corrían por la izquierda, así que por la vereda sur se bajaba al andén de los que iban a Plaza Once y a Caballito, y por la del norte al de los que volvían a Plaza de Mayo. Pasco y Alberti eran medias estaciones, con un solo andén cada mitad y a una cuadra una de la otra; Pasco Sur y Alberti Norte se cerraron en 1953.',
      'El nombre de «línea A» es de 1939. Las bocas están donde las de hoy; que cada estación tuviera cuatro, y sus medidas, es supuesto. Las dos últimas estaciones, Acoyte y Caballito, quedan fuera del plano.',
    ],
    hoyEs: 'es la línea A, que llega hasta San Pedrito. Hasta 2013 corrieron por ella los coches de madera de 1913.',
    fotos: ['subte-inauguracion-1913', 'subte-pasco-1938', 'subte-boca-1940', 'subte-saenz-1915'],
  },
  'El Gasómetro': {
    era: 'La cancha de San Lorenzo de Almagro, en Avenida La Plata al 1700. Desde 1916.',
    texto: [
      'Se inauguró el 7 de mayo de 1916, y en los primeros años veinte tuvo una tribuna oficial de madera, techada a dos aguas: así va en 1921.',
      'El estadio que le dio el nombre es el de 1929 y 1930: una tribuna corrida de tablones sobre hierro, de esquinas curvas y pareja de alto por los cuatro lados, con la estructura a la vista por afuera. De lejos parecía uno de los gasómetros de la ciudad. Entraban 75 mil personas, y fue la cancha de la selección hasta que estuvo el Monumental.',
      'La cancha iba de punta contra la avenida: una cabecera daba a Avenida La Plata y la otra a José Mármol, con los laterales sobre Las Casas e Inclán. La forma sale de las fotos de época, entre ellas una aérea; las medidas de la tribuna y lo que hay al costado del club son supuestos.',
    ],
    hoyEs: 'un supermercado desde 1985; el club recuperó el terreno y proyecta volver.',
    fotos: ['barrios-gasometro'],
  },
  'Cancha de Huracán': {
    era: 'La cancha de Huracán en Parque Patricios, de madera. De 1924 a 1942.',
    texto: [
      'Huracán se mudó a Amancio Alcorta y Luna en 1924. Las tribunas eran de madera y daban toda la vuelta; entre ellas y la cancha corría una pista peraltada de cemento, para carreras de motos y de bicicletas. A mediados de los años treinta entraban cerca de 40 mil personas.',
      'La desarmaron desde 1942 para levantar en el mismo lugar el estadio de hormigón, que se inauguró en 1949.',
      'El alto y el fondo de las tribunas son supuestos.',
    ],
    hoyEs: 'el estadio Tomás Adolfo Ducó.',
    fotos: ['barrios-huracan'],
  },
  'Sportivo Barracas': {
    era: 'El estadio de Sportivo Barracas, entre Iriarte, Luzuriaga, Río Cuarto y Perdriel. De 1920 a 1937.',
    texto: [
      'Era una olla baja de cemento que daba toda la vuelta, con un murito de un metro contra la cancha, y sobre Luzuriaga la tribuna oficial, alta y techada. Entraban 37 mil personas.',
      'Fue el gran estadio de la ciudad en los años veinte: ahí se jugaron los Sudamericanos de 1921 y 1925 y ahí, el 2 de octubre de 1924, Cesáreo Onzari le hizo a Uruguay el gol desde el córner que quedó como «gol olímpico». Lo demolieron en 1937, cuando el club dejó el fútbol: por eso en 1940 ya no está.',
      'El alto de las gradas es supuesto.',
    ],
    hoyEs: 'manzanas de casas; del estadio no queda nada.',
  },
  'Cancha de River': {
    era: 'La cancha de River Plate en la Dársena Sur, en La Boca. De 1915 a 1923.',
    texto: [
      'River nació en La Boca, y esta fue su última cancha en el barrio: una tribuna oficial larga, techada sobre postes, y enfrente una popular baja. En 1923 se mudó a Alvear y Tagle, en la Recoleta, y en 1938 al Monumental, en Núñez: ninguna de esas dos entra en este visor, la primera porque nació y se fue entre dos planos, la segunda porque queda fuera del marco.',
      'El lugar exacto dentro de la manzana es supuesto.',
    ],
    hoyEs: 'galpones del puerto.',
  },
  'Penitenciaría Nacional': {
    era: 'La Penitenciaría Nacional, sobre la calle Las Heras. De 1877.',
    texto: [
      'La proyectó Ernesto Bunge: una muralla con torreones, un edificio almenado al frente y cinco pabellones de celdas que salían en abanico de una rotonda de vigilancia. Cuando se hizo quedaba en las afueras; la ciudad la rodeó después.',
      'Ahí fusilaron a Severino Di Giovanni en 1931 y al general Valle en 1956. La demolieron en 1962.',
      'El largo de los pabellones y los talleres del fondo son supuestos.',
    ],
    hoyEs: 'el Parque Las Heras.',
    fotos: ['barrios-penitenciaria'],
  },
  'Hospital Rivadavia': {
    era: 'El Hospital Rivadavia, el de mujeres, de la Sociedad de Beneficencia. En Las Heras desde 1887.',
    texto: [
      'Es un hospital de pabellones: cuerpos de dos pisos separados por jardines, como se hacían entonces para que corriera el aire entre las salas.',
      'Cuántos pabellones había y dónde iba cada uno es supuesto.',
    ],
    hoyEs: 'el mismo hospital, con varios de los pabellones viejos.',
    fotos: ['barrios-rivadavia'],
  },
  'Facultad de Derecho': {
    era: 'La Facultad de Derecho de la avenida Las Heras, sin terminar.',
    eras: { 7: 'El edificio gótico de Las Heras, sin terminar: en 1948 pasó a Ingeniería.' },
    texto: [
      'Arturo Prins la proyectó en gótico, con una torre de 120 metros. La obra empezó en 1912 y se paró en 1938, sin la torre y con el ladrillo a la vista, que es como sigue. Ingeniería lo recibió en 1948, y Derecho se mudó el 21 de septiembre de 1949 al edificio de Figueroa Alcorta.',
      'El fondo del edificio es supuesto.',
    ],
    hoyEs: 'la Facultad de Ingeniería.',
    fotos: ['barrios-derecho'],
  },
  'Hospital de Clínicas': {
    era: 'El Hospital de Clínicas viejo, en Córdoba y Junín. De 1881.',
    texto: [
      'Ocupaba la manzana de Córdoba, Junín, Paraguay y Uriburu, con pabellones entre patios. Lo demolieron en 1975, cuando ya funcionaba el edificio nuevo de enfrente.',
      'Los pabellones van supuestos.',
    ],
    hoyEs: 'la Plaza Houssay.',
    fotos: ['barrios-clinicas'],
  },
  'Facultad de Medicina': {
    era: 'El edificio de la Facultad de Medicina sobre la avenida Córdoba. De 1895.',
    texto: [
      'Quedaba frente al Hospital de Clínicas, para que los estudiantes cruzaran la calle. Cuando Medicina se mudó a su edificio de la calle Paraguay, pasó a Ciencias Económicas.',
      'Los cuerpos y la mansarda son supuestos.',
    ],
    hoyEs: 'la Facultad de Ciencias Económicas.',
  },
  'Hospital Italiano': {
    era: 'El Hospital Italiano, en la calle Gascón. De 1901.',
    texto: [
      'La colectividad italiana tenía su hospital en el sur desde 1872; el de Almagro se inauguró en diciembre de 1901.',
      'Las alas y la capilla son supuestas.',
    ],
    hoyEs: 'el mismo hospital, muy ampliado.',
  },
  'Casa de Aislamiento': {
    era: 'La Casa de Aislamiento, el hospital de las enfermedades infecciosas. De 1882; desde 1904 se llama Hospital Muñiz.',
    texto: [
      'Se hizo lejos de la ciudad después de las epidemias, con pabellones bajos y separados para que cada enfermedad tuviera el suyo.',
      'Cuántos pabellones había y dónde iba cada uno es supuesto.',
    ],
    hoyEs: 'el Hospital de Infecciosas Francisco Javier Muñiz.',
    fotos: ['barrios-muniz'],
  },
  'Cárcel de Caseros': {
    era: 'La cárcel vieja de Caseros y Pichincha. De 1877.',
    texto: [
      'Nació como Casa de Corrección de Menores Varones y después fue Prisión Nacional. La torre de hormigón que se hizo al lado es de los años setenta.',
      'La planta es supuesta.',
    ],
    hoyEs: 'el edificio viejo sigue en pie, con otros usos.',
  },
  'Parque de los Patricios': {
    era: 'El Parque de los Patricios, de 1902.',
    texto: [
      'Se hizo sobre los Corrales Viejos, el matadero del sur, que se mudó a Liniers en 1900. Lo trazó Carlos Thays.',
      'Los senderos y la fuente son supuestos.',
    ],
    hoyEs: 'el mismo parque.',
  },
  'Santa Felicitas': {
    era: 'La iglesia de Santa Felicitas, en Barracas. De 1876.',
    texto: [
      'La hicieron levantar los padres de Felicitas Guerrero, asesinada en 1872, en la quinta de la familia. El proyecto es de Ernesto Bunge.',
      'Las medidas son supuestas.',
    ],
    hoyEs: 'la misma iglesia, frente a la Plaza Colombia.',
  },
  'Iglesia Ortodoxa Rusa': {
    era: 'La Iglesia Ortodoxa Rusa de la Santísima Trinidad, en la calle Brasil. De 1901.',
    texto: [
      'Los planos vinieron de San Petersburgo y la obra la dirigió Alejandro Christophersen. Tiene cinco cúpulas de bulbo azules con estrellas.',
      'En el visor las cúpulas van del color del agua: es el único azul de la paleta.',
    ],
    hoyEs: 'la misma iglesia.',
    fotos: ['barrios-lezama'],
  },
  'Mercado Spinetto': {
    era: 'El Mercado Spinetto, en Balvanera. De 1894.',
    texto: [
      'Lo hizo David Spinetto: locales a la calle y adentro las naves de hierro.',
      'Cuántas naves tenía es supuesto.',
    ],
    hoyEs: 'un centro comercial, con la fachada vieja.',
  },
  'Teatro Cervantes': {
    era: 'El Teatro Cervantes, en Córdoba y Libertad. De 1921.',
    texto: [
      'Lo levantaron los actores españoles María Guerrero y Fernando Díaz de Mendoza, con la fachada copiada de la Universidad de Alcalá. Se inauguró el 5 de septiembre de 1921.',
      'Los volúmenes son supuestos.',
    ],
    hoyEs: 'el Teatro Nacional Cervantes.',
  },
  'Harrods': {
    era: 'La tienda Harrods, la única fuera de Londres. Abrió en 1914 y terminó de ocupar la manzana en 1920.',
    texto: [
      'Está en Florida 877. Con las ampliaciones llegó a tomar casi toda la manzana de Florida, Córdoba, San Martín y Paraguay.',
      'Acá va como un solo cuerpo de siete pisos: las etapas de la obra no están.',
    ],
    hoyEs: 'el edificio, cerrado desde 1998.',
    fotos: ['barrios-harrods'],
  },
  'Jockey Club': {
    era: 'La sede del Jockey Club en la calle Florida. De 1897.',
    texto: [
      'Era el club de la clase alta porteña, famoso por su escalera de mármol y su biblioteca. Lo incendiaron el 15 de abril de 1953.',
      'El fondo del edificio es supuesto.',
    ],
    hoyEs: 'una galería comercial.',
  },
  'Casa de Moneda': {
    era: 'La primera Casa de Moneda, en Defensa y México. De 1881.',
    eras: { 7: 'El edificio de la primera Casa de Moneda, de 1881: la Casa se mudó a Retiro en 1944.' },
    texto: [
      'Ahí se acuñaron las primeras monedas nacionales. Son dos pisos alrededor de un patio.',
      'La planta es supuesta.',
    ],
    hoyEs: 'dependencias del Ejército.',
  },
  'Sociedad Sportiva': {
    era: 'El estadio de la Sociedad Sportiva Argentina, en Palermo. De 1899 a 1914.',
    texto: [
      'Tenía una pista ovalada con una cancha en el medio y una tribuna larga de madera. Ahí jugó la selección, se corrieron carreras de autos y de ahí salió en 1907 el globo Pampero de Jorge Newbery y Aarón de Anchorena. En 1914 el Ejército se quedó con el terreno.',
      'La pista y las tribunas son supuestas.',
    ],
    hoyEs: 'el Campo Argentino de Polo, de 1928.',
    fotos: ['barrios-sportiva'],
  },
  'Parque Lezama': {
    era: 'El Parque Lezama, en la barranca de San Telmo. Público desde 1894.',
    texto: [
      'Era la quinta de José Gregorio Lezama, que el plano de 1867 dibuja con sus senderos. La viuda se la vendió a la Municipalidad en 1894 con la condición de que fuera un parque con su nombre. En la casa funciona desde 1897 el Museo Histórico Nacional.',
      'En el visor el parque sigue con el dibujo de la quinta de 1867: el trazado de Thays no está hecho.',
    ],
    hoyEs: 'el mismo parque.',
    fotos: ['barrios-lezama'],
  },
  'Cancha de GEBA': {
    era: 'La cancha de Gimnasia y Esgrima de Buenos Aires en Palermo, «el field de Maldonado». Desde 1902.',
    texto: [
      'Fue la cancha de la selección en las primeras décadas del siglo. Para los juegos del Centenario, en 1910, le hicieron tres tribunas de madera: la oficial, de dos pisos como las del Hipódromo, del lado del arroyo Maldonado.',
      'En la final del Sudamericano de 1916, contra Uruguay, entró mucha más gente de la que cabía: el partido se suspendió y el público incendió las tribunas. No se rehicieron: en 1921 hay una pista de atletismo. Las tribunas de cemento son de mediados de los años treinta.',
      'La orientación de la cancha y las medidas de las tribunas son supuestas.',
    ],
    hoyEs: 'la sede Jorge Newbery de GEBA.',
  },
  'Parque Tres de Febrero': {
    era: 'Los Bosques de Palermo: el gran parque de la ciudad, en las tierras que fueron de Rosas.',
    texto: [
      'Juan Manuel de Rosas había juntado acá unas 540 hectáreas de bañados, con su caserón en lo que hoy es la esquina de Sarmiento y Libertador. Después de Caseros —el 3 de febrero de 1852— el Estado se quedó con todo. Sarmiento hizo votar el parque por la ley 658, del 25 de junio de 1874; el nombre, que recuerda la fecha de la batalla, lo propuso Vicente Fidel López.',
      'La primera parte se inauguró el 11 de noviembre de 1875, ya con Avellaneda de presidente, ante 35.000 personas y 1.500 carruajes. La entrada eran los Portones de Jules Dormal, donde hoy está la Plaza Italia; de ahí salía la avenida de las Palmeras, hoy Sarmiento. En 1888 pasó a la Municipalidad, y de 1891 a 1914 lo agrandó y lo rehízo Carlos Thays, el director de Paseos.',
    ],
    hoyEs: 'el Parque Tres de Febrero: los lagos, el Rosedal y, desde 1966, el Planetario.',
    fotos: ['palermo-lago-1890', 'palermo-portones', 'palermo-1916'],
  },
  'Jardín Zoológico': {
    era: 'El zoológico de la ciudad, mudado a este predio en 1888.',
    texto: [
      'El parque de 1875 ya tenía una sección zoológica, del otro lado de la avenida. En 1888 pasó a la Municipalidad, que la mudó acá; se inauguró el 30 de octubre de ese año, con Eduardo Ladislao Holmberg de director. Holmberg quiso que cada animal viviera en una construcción del estilo de su tierra: un pabellón gótico para los osos (1897), un templo hindú para los elefantes, una pagoda, un palacete ruso, un pabellón morisco.',
      'En 1904 lo reemplazó Clemente Onelli, que lo dirigió hasta su muerte, en 1924, y lo hizo más paseo: una confitería, estatuas, un trencito, camellos y ponis para los chicos. En 1907 pasó por primera vez el millón de visitantes. En el plano los pabellones van en el lugar que tienen hoy, pero cuál es cuál no se sabe: las formas son supuestas.',
    ],
    hoyEs: 'el Ecoparque: el zoológico cerró en 2016, después de casi 128 años en este lugar.',
    fotos: ['zoo-elefantes-1904'],
  },
  'El Rosedal': {
    era: 'El jardín de rosas del parque, a la orilla del lago. De 1914.',
    texto: [
      'Lo impulsó el intendente Joaquín de Anchorena y lo hizo Benito Carrasco, discípulo de Thays y director de Paseos, sobre 3,4 hectáreas donde en 1910 habían estado los pabellones de las provincias de la Exposición del Centenario. La obra duró del 5 de mayo al 22 de noviembre de 1914 y se inauguró el 24 de noviembre, con 14.650 rosales de 1.189 variedades.',
      'Tenía una pérgola que bordea el lago, un templete, un embarcadero y un puente de entrada «griego». En 1920 se le sumó un jardín andaluz, de Eugenio Carrasco, y en 1929 el patio de azulejos que regaló el Ayuntamiento de Sevilla.',
    ],
    hoyEs: 'el Rosedal, con unos 18.000 rosales. Patrimonio Cultural de la Ciudad desde 2011.',
    fotos: ['rosedal-1914'],
  },
  // Lo que trae 1950 (src/lugares/obras-1950.js). Las fechas salen de fuentes/1965/cronologia.json, que cita cada
  // artículo de Wikipedia en español (consultados en noviembre de 2026). Las fotos de época están listadas en
  // fuentes/1965/fotos.json y todavía no se bajaron.
  'Ministerio de Guerra': {
    era: 'El Ministerio de Guerra, detrás de la Casa de Gobierno. Inaugurado en 1943.',
    texto: [
      'Está en Azopardo 250, sobre lo que había sido la mitad sur del Parque Colón. La obra empezó en 1938 —en 1940 era un pozo con el esqueleto a medio levantar— y se inauguró en abril de 1943. En 1950 le pusieron el nombre de Edificio Libertador.',
      'Son dos bloques largos, uno al este y otro al oeste, unidos por un cuerpo central que deja dos patios: planta baja de doble altura y dieciséis pisos, con mansarda.',
      'El largo sale de la foto aérea de 1965; las alturas de cada piso y los jardines son supuestos.',
    ],
    hoyEs: 'el Edificio Libertador.',
  },
  'Ministerio de Hacienda': {
    era: 'El Palacio de Hacienda, al sur de la Casa de Gobierno. Terminado en 1950.',
    texto: [
      'Está en Hipólito Yrigoyen 250, entre Balcarce y Paseo Colón. Se hizo en dos etapas: la primera se autorizó el 12 de enero de 1937 y se ocupó hacia 1939; la segunda, de 1949 y 1950, sumó los dos lotes vecinos, sobre Paseo Colón y sobre Balcarce.',
      'El 16 de junio de 1955 las bombas le dañaron los mármoles.',
      'Acá aparece entero en 1950: en la etapa de 1940 falta la primera mitad. Los pisos son supuestos.',
    ],
    hoyEs: 'el Palacio de Hacienda.',
  },
  'Banco de la Nación (1944)': {
    titulo: 'Banco de la Nación',
    era: 'La casa central nueva, de Alejandro Bustillo: en 1950, hecha a medias.',
    texto: [
      'La piedra fundamental se puso el 17 de septiembre de 1940, ya demolida la vieja Bolsa, y la primera etapa se inauguró el 21 de julio de 1944. La segunda —el cuarenta por ciento que faltaba, sobre la esquina donde había estado el primer Teatro Colón— quedó parada hasta 1950 y llevó cinco años más: el edificio se terminó en 1955, con la manzana entera y 10.000 metros cuadrados de planta.',
      'En 1950 se ve lo hecho hasta entonces. Qué lado se levantó primero no está en las fuentes: se dedujo de que la segunda etapa fue la de la esquina del teatro. Si ese año el edificio viejo ya estaba demolido, tampoco: acá sigue en pie. Las alturas son supuestas.',
    ],
    hoyEs: 'la casa central del Banco de la Nación Argentina, que ocupa toda la manzana.',
  },
  'Facultad de Derecho (1949)': {
    titulo: 'Facultad de Derecho',
    era: 'La Facultad de Derecho en la avenida Figueroa Alcorta. Se mudó en 1949, con la obra sin terminar.',
    texto: [
      'El concurso es de 1945. El terreno era de Obras Sanitarias: ahí había una estación de bombas, desmantelada en los años treinta. La facultad dejó el edificio gótico de Las Heras y se mudó el 21 de septiembre de 1949, pero la obra siguió dos décadas: se dio por terminada a fines de los años sesenta.',
      'El frente, con la escalinata y las catorce columnas, es el de hoy. Qué parte estaba hecha en 1950 no está en las fuentes: acá el fondo va en esqueleto, y es supuesto, igual que las alturas.',
    ],
    hoyEs: 'la Facultad de Derecho de la Universidad de Buenos Aires.',
  },
  'Automóvil Club Argentino': {
    era: 'La sede central del Automóvil Club Argentino, en la avenida del Libertador. De 1942.',
    texto: [
      'Está en Libertador 1850. El año sale del artículo de sus arquitectos; el del propio club no lo dice.',
      'En la foto aérea de 1965 se ve una placa larga sobre la avenida y, detrás, un cuerpo bajo de planta redonda. Los pisos de cada uno son supuestos.',
    ],
    hoyEs: 'la sede central del Automóvil Club Argentino.',
  },
  'CGT': {
    titulo: 'Confederación General del Trabajo',
    era: 'La casa de la Confederación General del Trabajo, en Azopardo e Independencia. De 1950.',
    texto: [
      'Se inauguró el 18 de octubre de 1950. El edificio lo donó la Fundación Eva Perón, que al año siguiente empezó su propia sede sobre Paseo Colón.',
      'Los pisos y el cuerpo de la entrada son supuestos.',
    ],
    hoyEs: 'la sede de la CGT.',
  },
  'Casa de Moneda (1944)': {
    titulo: 'Casa de Moneda',
    era: 'La Casa de Moneda nueva, en Retiro. De 1944.',
    texto: [
      'Se autorizó en 1939 y se inauguró el 27 de diciembre de 1944, sobre el relleno del Puerto Nuevo. Reemplazó a la casa de Defensa y México, de 1881.',
      'La planta —un cuerpo de frente y tres alas detrás— sale de la foto aérea de 1965; los pisos son supuestos.',
    ],
    hoyEs: 'la Casa de Moneda.',
  },
  'Edificio Guardacostas': {
    era: 'El Edificio Guardacostas, sobre la avenida Eduardo Madero. De 1949.',
    texto: [
      'Se proyectó para el Ministerio de Marina. La obra empezó en junio de 1945 y se terminó en 1949.',
      'La planta sale de la foto aérea de 1965; los pisos son supuestos.',
    ],
    hoyEs: 'el Edificio Guardacostas.',
  },
  'Facultad de Ciencias Médicas': {
    era: 'El edificio nuevo de la Facultad de Ciencias Médicas, en la calle Paraguay. En uso desde 1944.',
    texto: [
      'Está en Paraguay 2155, a una cuadra del edificio de 1895 y del Hospital de Clínicas viejo. La obra empezó el 3 de marzo de 1939 y la primera etapa se habilitó en 1944; después se fue ocupando por partes.',
      'En 1949 empezó, en la manzana de al lado, la obra del Hospital de Clínicas nuevo, que recibió los primeros servicios en 1962: en 1950 era apenas una obra y acá no está.',
      'Qué partes estaban habilitadas en 1950 y los pisos de cada cuerpo son supuestos.',
    ],
    hoyEs: 'la Facultad de Medicina de la Universidad de Buenos Aires.',
  },
  'Mercado San Cristóbal': {
    era: 'El Mercado San Cristóbal nuevo, en Independencia y Entre Ríos. De 1944.',
    texto: [
      'Lo proyectó el estudio SEPRA y reemplazó al mercado anterior, en el mismo cruce.',
      'La nave y las bóvedas del techo siguen lo que muestra la foto aérea de 1965; su forma exacta es supuesta.',
    ],
    hoyEs: 'el mismo mercado.',
  },
  'Estadio de Huracán': {
    era: 'El estadio de hormigón de Huracán, en Parque Patricios. Inaugurado en 1949.',
    texto: [
      'El club compró el predio de Alcorta y Luna el 23 de abril de 1939. La obra empezó el 26 de octubre de 1941; la cancha de madera se usó hasta el 22 de noviembre de 1942, y las tribunas nuevas se empezaron el 10 de agosto de 1943.',
      'El primer partido se jugó el 7 de septiembre de 1947, con más de 80.000 personas, y la inauguración oficial fue el 11 de noviembre de 1949. Hoy lleva el nombre de Tomás Adolfo Ducó.',
      'El contorno sale de la foto aérea de 1965. Las alturas de las tribunas y las medidas de la sede y de la torre son supuestas.',
    ],
    hoyEs: 'el estadio Tomás Adolfo Ducó.',
  },
  'Mercado del Plata': {
    era: 'El solar del Mercado del Plata, en obra. El mercado viejo se demolió en 1947.',
    texto: [
      'El mercado de 1856 ocupaba media manzana sobre Carlos Pellegrini, entre Sarmiento y Cangallo, hasta el pasaje Carabelas: desde 1937 daba a la 9 de Julio. Se demolió en 1947 y ese mismo año empezó la obra del edificio nuevo, de Crivelli y Heinzmann.',
      'La obra se paró en 1954, con la estructura de hormigón hecha, siguió después y se inauguró el 23 de diciembre de 1962.',
      'Cuánto había levantado en 1950 no está en las fuentes: los tres pisos de esqueleto son supuestos.',
    ],
    hoyEs: 'el Edificio del Plata.',
  },
  'Avenida Córdoba': {
    era: 'La avenida Córdoba, ensanchada de Callao a Leandro N. Alem. Inaugurada en 1945.',
    texto: [
      'El ensanche se hizo por etapas, con el retiro de la línea de edificación que mandaba la ordenanza de 1904.',
      'Qué vereda cedió no está verificado. Acá la avenida tiene 26 metros entre líneas, 13 a cada lado del eje de hoy, con una calzada de 16; todo eso es supuesto, igual que los frentes nuevos.',
    ],
    hoyEs: 'la avenida Córdoba.',
  },
};

/** Los lugares de hoy (las marcas rojas) que tienen algo de 1867 para mostrar: qué había ahí y sus fotos. */
const HOY = {
  'Obelisco': { fotos: ['sannicolas-antigua', 'sannicolas-witcomb'] },
  'Teatro Colón de hoy': { fotos: ['parque-junior'] },
  'Estación Retiro': { fotos: ['norte-gonnet'] },
  'Torre Monumental': { antes: 'En 1867 acá estaba la fábrica de gas.', fotos: ['gas-gonnet'] },
  'Casa Rosada': { fotos: ['gobierno-junior', 'rentas-gonnet'] },
  'Puerto Madero': { antes: 'Así era la costa en 1867.', fotos: ['paseocolon-panunzi', 'aduana-muelle-gonnet'] },
  'Estación Constitución': { antes: 'En 1867 acá estaban el mercado de carretas y la primera estación del Ferrocarril del Sud.', fotos: ['constitucion-gonnet'] },
  'Estación Once': { antes: 'Junto a la vieja plaza de carretas del 11 de Septiembre.', fotos: ['once-panunzi'] },
};

/**
 * La ficha de una marca. Las de 1867 tienen la suya; las de hoy (rojas), una simple con su nota y, si la hay, alguna
 * foto de lo que había ahí. Devuelve null si no hay nada que contar.
 */
export function ficha(nombre, { hoy = false, nota = '' } = {}) {
  if (!hoy) return FICHAS[nombre] ?? null;
  const h = HOY[nombre] ?? {};
  return {
    hoy: true, era: 'La ciudad de hoy, sobre el plano de 1867.',
    texto: [nota || 'Un lugar de la Buenos Aires de hoy, marcado para ubicarse sobre el plano.', ...(h.antes ? [h.antes] : [])],
    fotos: h.fotos ?? [],
  };
}
