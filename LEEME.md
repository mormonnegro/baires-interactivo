# Buenos Aires, de 1867 a 1940

El plano topográfico de la ciudad, acostado sobre la mesa. Se toca un botón y la ciudad se levanta del papel, dibujada
con la misma tinta: cada manzana, cada casilla suelta y cada árbol que el grabador dibujó, en su lugar.

    npm install
    npm run dev        # http://localhost:5430
    npm run build      # dist/

Arrastrar mueve, la rueda acerca, el botón derecho (o ⇧) gira e inclina. Espacio: plano ⇄ ciudad. Tocar un nombre
lleva hasta ese lugar. En el teléfono, los gestos de cualquier mapa: un dedo mueve (y al soltarlo con impulso, sigue
un poco); dos dedos acercan y mueven, giran recién cuando el giro es franco, e inclinan si suben o bajan juntos; dos
toques acercan (y si el segundo se arrastra, acerca o aleja con un solo dedo); un toque con dos dedos aleja.

**Ver lo de hoy** (o la tecla H) estampa en rojo, sobre el plano, la ciudad actual: las calles, las vías del tren y la
costa de hoy (de OpenStreetMap), y rayada la tierra que se le ganó al río desde 1867 (unos 11,5 km² dentro del pliego:
Puerto Madero, la Reserva, el puerto y las vías de Retiro, la Costanera). De lejos se ven las avenidas, las vías y la
costa; al acercarse entran todas las calles. Además marca lugares actuales —el Obelisco, el Congreso, Retiro, la
Bombonera— donde caerían. Con lo de hoy prendido, al acercarse aparecen también los **nombres de las calles
actuales**, escritos a lo largo de cada calle (las avenidas desde más lejos).

**El buscador** (arriba a la izquierda): se escribe una dirección de hoy —calle y altura («Corrientes 1234»), una
esquina («Callao y Santa Fe») o el nombre de un lugar— y la cámara va hasta donde caería en 1867, con una marca que
dice si eso era río, cuál era el lugar de entonces más cercano (en cuadras y con el rumbo) y qué había alrededor según
el plano (ciudad edificada, quintas y construcciones sueltas, o campo: una estimación por cuánto dibuja edificado el
plano en 300 m a la redonda). Si la dirección queda fuera del pliego, lo dice. **El texto que se busca viaja a dos
servicios externos**, y solo al enviar (nunca mientras se escribe): primero al normalizador de direcciones de la Ciudad
de Buenos Aires (USIG, `servicios.usig.buenosaires.gob.ar`), que conoce calles, alturas y esquinas; y, si no la
encuentra, a Nominatim (`nominatim.openstreetmap.org`), el buscador de OpenStreetMap, para los lugares por su nombre.
No se guarda nada.

Para poner lo de hoy en su lugar se hace en dos pasos. Primero, catorce edificios que no se movieron (las iglesias
viejas, el Cabildo, la Recoleta) dan una transformación afín. Después se calzan las calles: el centro no cambió de
traza, así que por ventanas de unas cuadras se busca cuánto hay que correr las calles de hoy para que caigan sobre el
papel que el plano deja entre manzana y manzana. Con el primer paso solo, las calles quedaban corridas 10 m de promedio
(hasta 26 m); con el ajuste fino (un afín nuevo más una corrección local suave) quedan a 2,5 m de promedio y 7 m la
peor, y 3 a 4 m en validación cruzada. Eso vale para el casco viejo, donde hay calles de 1867 con qué calzar; hacia
las afueras no hay cómo medirlo y el error es mayor (decenas de metros en los bordes del pliego).

## En color

El visor arranca en color. Se apaga con el botón «Color» o la tecla C (y queda apagado para la próxima visita);
`?tinta` y `?color` en la dirección lo fuerzan.

El botón de la gota (o la tecla C; `?color` en la dirección) pinta la misma ciudad: azoteas de baldosa colorada, paredes
encaladas, árboles verdes, calles empedradas en el centro y de tierra afuera (ver «La línea de tiempo») y el río marrón. Anda acostado y levantado, a pie y en avión, y se puede
prender junto con lo de hoy. Fuera de la guarda del plano sigue el papel. Los colores son inventados: el plano no dice
de qué color era nada.

Para pintar el suelo hace falta saber qué es cada punto. Lo dice una lámina aparte (`public/plano/suelo.webp`, 0,6 MB;
`suelo-2k.webp` en un teléfono), con el río de 1867, los patios y lo edificado, que se pide recién al prender el color.
La arma `node --max-old-space-size=8000 tools/hoy.mjs --suelo` a partir de `tmp/clases.png`. El dibujo está en
`src/tinta.js` (`uColor`), y `src/pagina.js` afloja el contorno de tinta y suma un poco de bruma a lo lejos.

**Los patios.** En color, los fondos de las manzanas llevan árboles de verdad (frutales, parras y matas bajas, cada
tanto uno grande) y algún aljibe —el brocal de mampostería con su arco de hierro— en el medio de los patios grandes:
unos 15.400 árboles y 322 aljibes. El plano no los dibuja, así que **solo existen en color**: crecen al prenderlo y en
tinta no están (ahí siguen valiendo nada más que los árboles del grabador). Con los años se van los que
quedan bajo una casa nueva o en la traza de una avenida. Dónde va cada uno lo decide
`node --max-old-space-size=4000 tools/patios.mjs`, con semilla fija, leyendo `tmp/clases.png`: adentro de una manzana,
sobre patio, separados entre sí, de las paredes, de los techos ya levantados y de los árboles del plano, y nunca en la
calle ni en el río (para eso lee `public/plano/suelo.webp`: va después de `tools/hoy.mjs --suelo`). Deja
`public/datos/patios.pak` (59 KB), que se pide junto con la lámina del suelo, la primera vez que se prende el color.
Los dibuja `src/patios.js`: mallas instanciadas por zonas de 350 m, con la copa más o menos trabajada según la
distancia; a más de 5 km no se dibujan y el suelo los pinta como manchas (lo mismo donde la ciudad sigue acostada).
En un teléfono va algo más de la mitad de los árboles, y se dibujan hasta los 3 km. A pie no frenan el paso.

## En el teléfono, y cuánto tarda en cargar

La carga va por etapas (`src/main.js`), para que con una conexión de teléfono se vea algo enseguida:

1. **El plano tendido**, con una lámina de 1024 px que pesa 0,13 MB (`plano/primero.webp`). Con el código, son unos
   0,33 MB hasta ver el plano y poder moverlo. Esos primeros pedidos salen de un script en línea de `index.html`
   (lo arma `vite.config.mjs`), sin esperar a que llegue el código.
2. **La ciudad**: manzanas, techos, muros y árboles en un solo archivo comprimido, `datos/ciudad.pak` (1,35 MB; los
   cuatro `.bin` sueltos suman 3,76 MB). Lo arma `tools/empacar.mjs` (`npm run empacar`; hay que volver a correrlo si
   cambian los `.bin`) y lo abre `src/ciudad.js`; si el navegador no tiene `DecompressionStream`, se piden los
   sueltos. Mientras llega, el botón dice «Cargando la ciudad…». Las fichas y el buscador van en archivos aparte.
3. **Las láminas finas.** Un teléfono (pantalla de menos de 600 px de lado, o poca memoria: `?liviano` lo fuerza y
   `?pesado` lo evita) usa la lámina entera de 4096 px (2 MB) en vez de la de 8192 (9 MB), y sombras de 2048. De las
   teselas a tamaño del escaneo se piden solo las que se ven con detalle al llegar (una o dos en un teléfono), no las
   del camino del vuelo.

Los archivos de `public/` se piden con una versión en la dirección (`?v=…`, una huella de todo `public/`: `src/url.js`)
y se sirven con caché de un año (`public/_headers`): la segunda visita no baja nada de eso.

Se dibuja solo cuando algo cambió (la cámara, la ola, una lámina que llega, un toque): con la vista quieta la página no
gasta batería. Y si el equipo no llega a dibujar a buen ritmo, achica el dibujo de a pasos (hasta el 60 %).

El título y la ayuda («arrastrá para moverte · rueda para acercarte…») son un solo recuadro de información, abajo a
la izquierda (`#titulo`, con la ayuda en `.como`; con dedo, `src/main.js` le cambia el texto por el de los gestos).
Arranca siempre guardado en un botón «?», que lo abre y lo cierra (`body.info`); adentro, «¿Qué estoy viendo?» abre
el cartel de entrada. En una ventana de 641 a 1080 px, abierto, sube por encima de la fila de botones. En el teléfono
el «?» va en la fila de los modos, que a la izquierda está libre (la de abajo se llena con «Ocultar lo de hoy»).

Para que la pantalla chica no quede cargada, ahí el recuadro es un cartel de paso: abierto ocupa la fila de los modos
(que se guardan mientras tanto, igual que la leyenda de «lo de hoy» y la nota del año) y se cierra al tocar el plano,
al abrirse una ficha —que sube desde abajo— o al entrar a caminar, volar o manejar. La nota del año (qué cambió y de
qué plano sale) se muestra unos nueve segundos al elegirlo y se guarda; tocando el año de nuevo vuelve (`fresca` y
`aviso`, en `src/epocas.js`). La leyenda de «lo de hoy» va abajo, encima de los botones (arriba están el buscador y
los años). La firma queda en el retrato solo. Acostado, el buscador, los años y el retrato entran en una sola fila
arriba, y con una ficha abierta los años se guardan.

Entre 1101 y 1440 px el buscador se angosta para
no pisar los años, que van centrados. Los botones miden 44 px por lo menos, y
las etiquetas de las marcas no atajan el dedo: se puede arrastrar o pellizcar el plano desde arriba de una, y el toque
se resuelve en el lienzo (`marcas.enPunto`, en `src/ficha.js`). Parado y acostado.

Para probarlo: `npm run build` y después `node tools/carga.mjs` (cuánto tarda y cuánto pesa cada etapa, con la red y el
procesador frenados; `--red 4g-lenta`, `--entrar`), `node tools/tactil.mjs` (los gestos, uno por uno, y que quieta no
dibuje) y `node tools/telefono.mjs` (capturas de cada estado y el tamaño de los blancos táctiles). Los tres aceptan
`--url` para probar lo publicado.

## A pie, en avión y en coche

Además de mirarla desde arriba, la ciudad se puede recorrer de tres maneras más (los tres botones de abajo, junto a
«Levantar la ciudad»; `src/modos.js`):

- **A pie**: a la altura de los ojos (1,7 m), por las calles. Se arranca siempre en la Plaza de Mayo, del lado del
  Cabildo y de cara a la Pirámide y a la Casa de Gobierno (el coche, en la calle que la bordea por el norte, frente a
  la Catedral: `modos.desde`, en `src/main.js`); el avión, en cambio, despega hacia lo que se estaba mirando, y al
  pasar de un modo a otro se sigue donde se estaba. Las casas frenan el paso: se choca contra todo lo edificado (los techos de los datos y los edificios hechos
  a mano) y, de costado contra una pared, se resbala a lo largo. Los árboles no frenan.
  Teclado: W A S D o flechas, arrastrar para mirar, ⇧ para correr. Teléfono: el pulgar izquierdo camina (una palanca que
  aparece donde se apoya), el derecho mira, y el botón «más rápido» corre.
- **En avión**: un biplano que avanza solo, visto desde atrás. Flechas o W A S D (o un dedo de palanca, donde sea): girar,
  subir y bajar; ⇧ o «más rápido» acelera. No baja de 32 m ni sube de 3000, y si se sale del pliego vira solo hacia la
  ciudad. La línea de tiempo queda a la vista: tocando un año, o con Q y E, la ciudad cambia abajo sin bajar del avión. Es una licencia: en 1867 faltaban cuarenta años para el primer avión.
- **En coche** (`src/autos.js`, que se baja recién al tocar «Manejar»): se maneja por las calles el vehículo del año
  que se está mirando, y al cambiar de año el coche se transforma en el de la época: la volanta (1867), el coche de
  plaza (1888), el cupé (1895), la voiturette De Dion-Bouton (1905), el doble faetón (1910), el Ford T (1921) y el
  Ford V8 de 1937 (1940). Cuál va en cada año sale de los censos municipales de 1887 y 1909 y de los anuarios de 1901
  y 1903 (el encabezado de `src/autos.js` dice qué está confirmado y qué no). Desde el tablero (las flechas, o la N)
  se puede elegir cualquiera de los anteriores, que seguían en la calle; al cambiar de año se vuelve al de ese año.
  Flechas o W A S D: acelerar, frenar y doblar (S con el coche parado es marcha atrás); espacio frena; V cambia la
  vista (de atrás o desde el asiento), B bocina o relincho, M calla el sonido, Q y E cambian de año. En el teléfono,
  un dedo de palanca. Cada uno anda con sus números (el caballo no pasa de 20 km/h, el T llega a 68, el V8 a 135) y
  cuanto más rápido, menos dobla. Se choca contra las casas del año que se mira y no se entra al río ni a los diques;
  los árboles, las rejas, los monumentos y los trenes se atraviesan, y los puentes sobre el agua quedan cerrados. El
  volante va a la derecha: se circuló por la izquierda hasta 1945. El sonido es sintetizado. En una esquina, un
  mapita redondo (`src/minimapa.js`) muestra las manzanas y las calles de alrededor, las del año que se mira: gira
  con la cámara, el coche es la flecha del medio, una N marca el norte y, cuanto más rápido se va, más lejos muestra.

Arriba dice dónde se está («a 2 cuadras al norte del Cabildo»; en avión, también la altura y la velocidad; a pie y con
«lo de hoy» prendido, por qué calle actual se camina). Se pasa de un modo al otro sin volver al mapa (se despega desde
donde se caminaba, se baja donde iba el avión), y Esc o «Volver al mapa» dejan la cámara del mapa sobre el mismo lugar.
En los modos la cámara abre más el ángulo (el mapa mira de lejos, con 30°), el cielo es papel y parado no se dibuja.
En un teléfono, en avión no se piden las láminas finas del plano.

Pruebas: `node tools/modos.mjs` (a pie y en avión, con teclado y con dedos; que no se atraviesen las casas),
`node tools/autos.mjs` (el coche de cada año, los choques, la orilla, el cambio de coche; con `--fotos`, capturas de cada uno) y
`node tools/modos-fotos.mjs` (capturas en varias pantallas, para mirarlas).

## La línea de tiempo

Arriba hay una fila de años: 1867, 1888, 1895, 1905, 1910, 1921 y 1940, y un ▶ que los recorre solo. Al elegir otro
año no cambia el plano ni el dibujo: sobre la ciudad de 1867 se ve **cómo se fue transformando**, en una ola que sale
del centro.

- **Lo que crece**: se levantan las casas que se sumaron después, iguales a las demás. El suelo acompaña: aparecen las
  manzanas nuevas con sus fondos y sus calles, y los árboles de las quintas que quedan bajo una casa o en medio de una
  calle se van.
- **Lo que se abre**: se demuelen las casas que estaban en la traza de las avenidas y las plazas nuevas, a los vecinos
  les queda la medianera a la vista y sobre la línea nueva se levantan los frentes, más altos.
- **Lo que se renueva**: en cada etapa una parte de las casas —las de 1867 y las que vinieron después— se reemplaza
  por un edificio de más pisos en el mismo lote (a lo sumo dos veces por lote, y nunca antes de los quince años).
  Cuántas, y a cuántos pisos, lo dicen los censos, zona por zona (ver «Las alturas», más abajo). En la «city» (unas
  ocho cuadras alrededor de Corrientes y Esmeralda) se renuevan además los fondos de manzana, sobre todo entre 1921 y
  1940, como en las fotos del Obelisco recién inaugurado. Los edificios de cuatro pisos o más llevan azotea de
  cemento, no de baldosa colorada.
- **El río retrocede** donde se le ganó tierra: Puerto Madero con sus cuatro diques, la Dársena Norte y los depósitos
  de ladrillo; después el Puerto Nuevo, el relleno de Retiro y la Costanera.

| Año | Qué se abre |
|---|---|
| 1888 | Se va la Recova Vieja (1884): las dos plazas quedan unidas. Callao, de Rivadavia a Córdoba, despejada a su ancho de hoy: el plano de 1867 la trae ancha solo a trechos, con casas metidas en la traza (la fecha es supuesta). |
| 1895 | La Avenida de Mayo (inaugurada en 1894), por el medio de las manzanas, de Bolívar a Sáenz Peña, y su traza abierta hasta Entre Ríos–Callao, como la dibujan los planos de 1895 y 1905 (ese tramo se vuelve la plaza del Congreso en 1910). Puerto Madero; desaparecen la Aduana Nueva y los muelles. |
| 1910 | La plaza del Congreso, para el Centenario. |
| 1921 | Las dos primeras cuadras de cada diagonal (la Norte hasta Maipú, la Sur hasta Chacabuco). Santa Fe ensanchada de Esmeralda a Libertad (1913). La primera parte del Puerto Nuevo. |
| 1940 | La 9 de Julio, de Bartolomé Mitre a Tucumán (1937), con el Obelisco (1936) donde estaba San Nicolás; la Diagonal Norte hasta Lavalle y Libertad, la esquina de la Plaza Lavalle (el último tramo, de Cerrito a Lavalle, está abierto en la foto aérea de 1940); la Diagonal Sur hasta Belgrano; Corrientes ensanchada (1931–1936) y Santa Fe hasta Callao; el Puerto Nuevo entero y la Costanera. |

**Los edificios grandes** llegan cada uno en su año, modelados a mano (`src/hitos.js`), y se llevan lo que había en
su lugar:

| Desde | Edificio | En su lugar se va |
|---|---|---|
| 1888 | Estación Constitución (la de 1887) | |
| 1895 | Palacio de Aguas Corrientes (1894) | |
| 1905 | Casa Rosada (1898) · Estación del Once (1898) | lo que quedaba del Fuerte y la Estación Central (quemada en 1897) · los depósitos del Ferrocarril del Oeste |
| 1910 | Congreso (1906) · Teatro Colón (1908) · Tribunales (habilitado en 1910) | la Fábrica de gas del Retiro |
| 1921 | Estación Retiro (1915) | la Estación del Norte |
| 1940 | Palacio Barolo (1923) · Correo Central (1928) · Kavanagh y Obelisco (1936) | San Nicolás |

El lugar, el rumbo y el tamaño de cada uno salen de su planta en el mapa de hoy (OpenStreetMap, `tools/edificios.mjs`
→ `src/edificios.js`). La forma es un boceto con pocas piezas —los cuerpos, las cúpulas, las mansardas, las bóvedas
de los andenes—, hecho de memoria y no medido sobre planos: sirve para reconocerlos, no para estudiarlos.

**Los lugares hechos a mano** (`src/lugares/`, uno por archivo; `src/lugares/LEEME.md` cuenta con qué se arman):
plazas, avenidas y el puerto, cada uno con el trazado de su época, sacado de fotos de entonces (Wikimedia Commons;
cada archivo dice de cuál sale cada cosa). Los canteros, los senderos y las fuentes son piezas a ras del suelo que
siguen el terreno; los árboles nacen y se van con su etapa.

| Lugar | Qué muestra | Desde |
|---|---|---|
| Plaza de Mayo (`plaza-de-mayo.js`) | la plaza unida de 1884 con sus fuentes de hierro y palmeras · el trazado de Thays de 1894 · el de 1905–1910 con los estanques · la Pirámide en el centro (1912) y los parterres de 1921 · el solado de 1929. Siempre, el Belgrano ecuestre | 1888 |
| Puerto (`puerto.js`) | la rada con veleros, balleneras y carros de desembarco (1867–1888) · los diques con vapores, grúas y puentes giratorios (1895) · los diecisiete docks de ladrillo —cuatro por dique y cinco, más cortos, en el Dique 3; en los diques 1 y 2 los de las puntas son más cortos y más hondos—, los elevadores de granos y el molino (1905) · la Costanera Sur con el balneario, el espigón y la Fuente de las Nereidas (1921) · su ampliación y la Cervecería Munich (1940) | 1867 |
| Puerto Madero, alrededor de los diques (`puerto-madero.js`) | la Plaza Colón detrás de la Casa de Gobierno (1895) · las vías del puerto en lazo alrededor de cada dique, por los puentes giratorios, con sus vagones, el Parque Colón, el embarcadero de animales del Dique 1 y el depósito en T del Dique 2 (1905) · la Aduana y los primeros depósitos de las manzanas del bajo (1910) · la playa de maniobras del oeste, la alameda de Huergo y Madero, el Monumento a Colón, la Plaza Mazzini, el molino y los silos del Dique 3, la segunda hilera de galpones del Dique 4, la playa de vías del sudeste con los galpones largos de Florencio Sánchez, el corralón y el lazareto (1921) · las manzanas completas, los jardines entre las vías y la Costanera y la estación radiotelegráfica (1940) | 1895 |
| Plaza del Congreso (`plaza-congreso.js`) | la plaza de Thays de 1910, con su pileta, el parterre, El Pensador y la Plaza Lorea con el Mariano Moreno · el Monumento de los Dos Congresos (1914) · los canteros de 1940 y el Kilómetro Cero | 1910 |
| Plaza San Martín (`plaza-san-martin.js`) | el San Martín de Daumas solo en la Plaza de Marte (1867) · el jardín de Courtois, con su avenida, canteros y estanque (1888–1905; el Falucho, en 1905) · el monumento de Eberlein, la escalinata y «La Duda» (1910–1921) · la ampliación: la punta hasta Esmeralda, la terraza donde estuvo el Pabellón y la barranca plantada (1940) | 1867 |
| Plaza Lavalle (`plaza-lavalle.js`) | la Plaza del Parque con su pabellón y el frente del Parque de Artillería (1867) · el jardín con la columna de Lavalle y el Palacio Miró (1888) · Tucumán abierta, con la columna en su isla (1905) · el solado y la boca del subte, y la manzana del Miró hecha plaza tras la demolición de 1937 (1940) | 1867 |
| Plaza Once (`plaza-once.js`) | el mercado con sus carretas (1867) · la plaza de Alvear, levantada del suelo, con canteros en estrella y el ombú (1888–1910) · la plaza rehecha tras el subte (1921) · la explanada con el Mausoleo de Rivadavia (1940) | 1867 |
| Plaza Constitución (`plaza-constitucion.js`) | el mercado con sus carretas (1867) · el paseo de Alvear a medio hacer, con la gruta (1888) · la plaza entera, con canteros a la inglesa, lago y puente (1895) · sin agua y con el Castelli (1905–1910) · partida en dos por Garay, sin gruta (1921) · las dos islas de la aérea de 1940 | 1867 |
| Plaza Británica (`plaza-britanica.js`) | la plaza de la Torre de los Ingleses, frente a la estación Retiro, donde estuvo la fábrica de gas: la de 1916, con la explanada, los canteros, los árboles recién plantados y la plazoleta del Paseo de Julio (1921) · la de la aérea de 1940, árbol por árbol, con los parterres de dibujo, el refugio de la avenida y los colectivos · alrededor, el adoquinado, las veredas, las vías y los tranvías frente a la estación, y los galpones del puerto con su paredón | 1921 |
| Avenida 9 de Julio (`nueve-de-julio.js`) | la avenida de 1937: la plataforma del Obelisco, las cuatro islas con sus fuentes, los canteros, las rampas del estacionamiento, el alumbrado y los plátanos recién plantados | 1940 |
| Diagonal Norte (`diagonal-norte.js`) | el Banco de Boston (1924), La Equitativa del Plata (1929), los dos edificios Bencich (1927), el Banco Argentino Uruguayo (1928) y La Continental (1931) | 1940 |
| Plaza de la República (`obelisco-1940.js`) | lo que rodeaba al Obelisco en las fotos de 1936 y 1937: El Trust Joyero Relojero (1925), con la cúpula del reloj; el Edificio Díaz (1927), con el chalet en la terraza y las dos torres de letras; las casas de Cerrito al 300 y la de la cúpula en la esquina de Corrientes; sobre Corrientes, el Ópera (1936), el Gran Rex (1937), el Tabarís y el Broadway (1930); la playa de estacionamiento de Corrientes y Cerrito, y ocho carteles con el texto que se lee en esas fotos («DIAZ», «MUEBLES DIAZ», «EL TRUST», «RELOJES MARCONI — DAN LA HORA AL MUNDO», «OPERA», «TABARIS», «EL GUIPUR 539») | 1940 |
| Puerto Nuevo (`puerto-nuevo.js`) | las dársenas en peine al norte de la Dársena Norte: en 1921, A, B y C con sus vapores y galpones, la D a medio dragar y los espigones 4 y 5 en obra (dragas, martinetes, vagonetas), más el Hotel de Inmigrantes y el desembarcadero · en 1940, las cinco dársenas con sus galpones, las grúas eléctricas de pórtico, transatlánticos y cargueros, y las usinas de la CHADE y de la Ítalo | 1921 |
| Las playas de Retiro y la Costanera Norte (`playas-retiro.js`) | detrás de las tres estaciones, las playas de vías del Central Argentino, del Central Córdoba y del Pacífico con sus cortes de vagones y sus galpones de cargas, las líneas que salen hacia Palermo y la vía del puerto, que corre por las cabeceras de las dársenas con un ramal a cada muelle · en 1940, además: la playa de coches del Central Argentino, las vías de los espigones 1, 4 y 5 y la de la usina, el empalme del norte, los depósitos del triángulo entre las playas y la avenida Edison, los dos edificios del Ferrocarril del Estado, un elevador de granos y la Costanera Norte (la avenida arbolada, la rambla con su pretil y sus faroles, y los árboles de los parques) | 1921 |
| Cabildo (`cabildo.js`) | el colonial de once arcos con la torre de 1765 · la reforma de Benoit, a la italiana y con la torre diez metros más alta (1888) · sin torre y sin los tres arcos del norte, demolidos en 1889 (de 1895 a 1921) · la restauración de Buschiazzo, con cinco arcos y la torre nueva (1940) | 1867 |
| Casa Rosada (`casa-rosada.js`) | entera y simétrica, con el arco de Tamburini en el medio (inaugurada en 1898) · desde 1940, sin los 17 m del lado sur que se demolieron en 1938 | 1905 |
| Subte A (`subte-a.js`) | las bocas de las catorce estaciones que entran en el plano, de Plaza de Mayo a Río de Janeiro: el pórtico de hierro con el cartel («A Plaza Once y Caballito» en la vereda sur, «A Plaza de Mayo» en la del norte) y la baranda sobre su zócalo. Pasco y Alberti, en dos medias estaciones cada una | 1921 |
| Los que faltaban de 1867 (`viejos-1867.js`) | la Estación del Sud de 1865, con su patio, el cobertizo de los andenes y el de cargas · el Congreso Nacional de Jonás Larguía (1864), en la ochava de Balcarce y Victoria, que sigue en pie hasta 1940 (se demolió en 1942) · la Estación del Parque: la de madera de 1867 y, en 1888, la terminal de mampostería de 1872 | 1867 |
| Retiro y la Plaza San Martín (`retiro.js`) | el Pabellón Argentino de la Exposición de París de 1889, de hierro y vidrio, con su anexo (de 1895 a 1921: se desarmó en 1933) · el Plaza Hotel (1909): en 1910 con el cerco y las marquesinas, desde 1921 con el pabellón redondo de la entrada · el Palacio Anchorena (1909), que en 1940 ya es el Palacio San Martín · el Palacio Paz (1914) · la Torre de los Ingleses (1916), en su plaza | 1895 |
| La Avenida de Mayo y el centro (`avenida-de-mayo.js`) | el Palacio Municipal (1893): solo, con sus tres arcos en la esquina; desde 1921 ensanchado hasta Rivadavia, con la cúpula de aguja, y en 1940 sin ella · La Prensa (1898), con la farola · la Confitería del Molino (1916), con la torre de las aspas · la Galería Güemes (1915), con el faro · Gath & Chaves (1914), con la cúpula de la esquina | 1895 |
| Los modernos de 1940 y La Boca (`modernos.js`) | el Puente Transbordador (1914), con sus dos torres de celosía, la viga y la barquilla · y en 1940: el Comega y el Safico sobre Corrientes, el Ministerio de Obras Públicas todavía en su manzana, el Luna Park con el techo de 1934, el Mercado de Abasto de las cinco bóvedas y la Bombonera recién inaugurada, con dos bandejas | 1921 |
| Teatro Colón (`teatro-colon.js`) | el de 1908, sobre la foto del Archivo General de la Nación de hacia 1910: los tres pisos, los pabellones de las esquinas, la galería de columnas sobre el balcón, la marquesina, el cuerpo de la sala y la caja del escenario | 1910 |

Las medidas salen de proporciones leídas en las fotos y calzadas contra las esquinas del mapa, no de planos: los
trazados son fieles en lo grande y aproximados en lo chico (cuántos faroles, dónde cada banco). Lo que no se ve en
ninguna foto está hecho simple o no está. Debajo de cada plaza el suelo queda despejado desde su etapa
(`tools/crece.mjs`): en la de Mayo, desde 1888, se va el dibujo de 1867 con sus árboles.

En el puerto, además, el suelo: las calles de hoy de Puerto Madero no se pintan (quedan la de los depósitos, los
cruces por los puentes y, desde 1921, la Costanera Sur), los muelles van adoquinados unos 38 m alrededor de cada
dique, los diques tienen su contorno de verdad (con los pasos angostos entre uno y otro) y el agua, en color, es más
gris que la tierra para que se lea como agua. Los depósitos ya no son cajas que se levantan solas. Sobre la tierra
ganada no se levantan casas solas: las vías, las manzanas del bajo (entre Paseo Colón–Alem y la avenida del puerto) y
lo que hay entre los diques y la Costanera están hechos a mano en `src/lugares/puerto-madero.js`.

**Los parques de Palermo.** El Parque Tres de Febrero (1875), el Zoológico (1888), el Jardín Botánico (1898), la Rural
(1878), el Hipódromo (1876) y la cancha de polo (1928) dejaron de ser el campo del plano de 1867 con manchas de casas
encima. `node tools/palermo.mjs` junta en `src/palermo.js` los contornos, los lagos, las avenidas del parque, los
senderos y el lugar de cada árbol (hay que correrlo antes de `tools/crece.mjs` si cambia algo):

- **Adentro de los contornos** `tools/crece.mjs` no levanta casas en ninguna etapa, no pinta las calles de hoy y no da
  nada por urbanizado: sigue el pasto de 1867, y la tierra que el parque le ganó al río es pasto desde que está. Lo de
  1867 que quedaba adentro (el caserón de Rosas, demolido en 1899, y los ranchos de alrededor) se va en 1905. Debajo de
  los lagos y de las avenidas se sacan los árboles que dibuja el plano de 1867.
- **Lo demás lo arma `src/lugares/palermo.js`**, cada cosa desde su etapa: los lagos con sus islas, las avenidas
  (tierra, adoquín desde 1910, asfalto en 1940), los senderos, unos 3.700 árboles, el Rosedal (1914) con sus canteros,
  su pérgola y sus puentes, la pista y las tribunas del Hipódromo, la cancha de polo, los galpones de la Rural, la casa
  y el invernadero del Botánico, el Garibaldi de la Plaza Italia (1904), el Sarmiento de Rodin (1900) y el Monumento
  de los Españoles (1927).
- **Qué sale de dónde**: la forma de los lagos, de los canteros, de las avenidas y de los senderos, del mapa de hoy
  (© los colaboradores de OpenStreetMap, ODbL; `fuentes/osm/palermo.json`), que calza con el plano de Peuser de 1936;
  los contornos grandes, calcados sobre ese plano; la etapa de cada cosa, del plano de época en que aparece y de su
  fecha. **Es supuesto**: que lagos y senderos tuvieran antes la forma de hoy, el lugar de cada árbol y de cada cantero
  de rosas, el pavimento, y el tamaño y la forma de las tribunas, los galpones y los monumentos (van reducidos a sus
  volúmenes). **No están**: las jaulas sueltas del Zoológico ni las vías a nivel de antes del viaducto.

**El Zoológico, la Rural y el viaducto.**

- **Los pabellones del Zoológico** (desde 1905) y **los de la Rural** con su pista central y sus tribunas (desde
  1910) van en la planta que tienen hoy: `fuentes/osm/palermo-edificios.json` (© los colaboradores de OpenStreetMap,
  ODbL), sin los pabellones nuevos de la Rural. El mapa no dice cuál pabellón del Zoológico es cuál: las cúpulas, las
  torres y los tejados van repartidos por tamaño. Los galpones del ganado ya no son todos iguales (cambian de largo,
  de material y de techo, con algún corral entre medio) y desde 1910 le dejan lugar a los pabellones.
- **El viaducto** (desde 1921): las vías de hoy de los ferrocarriles Mitre y San Martín al norte de la avenida
  Sarmiento van sobre arcos de ladrillo, con un puente de hierro en cada avenida. La altura sale de
  `src/viaducto.js` (5,5 m, con sus rampas: supuesto) y los trenes de Retiro andan por arriba: la línea `retiro` de
  `src/vias.js` lleva `alto`, y `src/tren.js` levanta con eso las vías y los trenes.

**Las fichas de Palermo.** Tres marcas que se pueden tocar: «Bosques de Palermo» (desde 1888; la ficha es la del
Parque Tres de Febrero), «Jardín Zoológico» (desde 1895) y «El Rosedal» (desde 1921). Los textos salen de Wikipedia en
español («Parque Tres de Febrero», «Rosedal de Palermo», «Jardín Zoológico de Buenos Aires»); las cinco fotos, de
Wikimedia Commons, todas de dominio público (`fuentes/fotos/palermo-*`, `rosedal-1914`, `zoo-elefantes-1904`).

**Los fondos de manzana.** El plano de 1867 trae el corazón de cada manzana abierto (patios, huertas, corralones), y
hasta acá el visor lo dejaba así hasta 1940. Ahora `tools/crece.mjs` lotea ese corazón como se loteaba: tiras derechas
de 9 a 14 metros de frente, perpendiculares a la calle (las de los lados largos llegan al eje de la manzana; las de las
cabeceras, a un tercio). Cada tira es un lote y su fondo se edifica de una vez, entero y con un solo techo, con un
patio de aire y luz contra una medianera. `FONDOS` dice qué parte de los lotes tiene el fondo edificado en cada etapa:
en el centro y la «city», 15 % en 1888, 25 % en 1895, 40 % en 1905, 50 % en 1910, 60 % en 1921 y 85 % en 1940; algo
menos en el anillo y el norte cercano; la mitad en el sur cercano y el oeste; en el resto no se toca. Lo que no sale
queda de patio. Los árboles del plano se van solos donde se edifica. **Qué es dato**: los dos extremos —el plano de
1867 y la foto aérea de 1940 del mapa de la Ciudad, donde las manzanas del centro se ven techadas de medianera a
medianera—. **Qué es supuesto**: los porcentajes de las etapas intermedias, y el loteo, la etapa y los pisos de cada
cuerpo (uno o dos hasta 1921; de dos a cuatro en el centro en 1940). No cuentan para el censo: son cuerpos de fondo,
no casas a la calle. Suma unos 7 mil cuerpos; `crece.pak` pasa de 3,3 a 3,8 MB.

**El fondo es del edificio de adelante.** Si en la misma tira, sobre la calle, hay un edificio de tres pisos o más
levantado en 1921 o en 1940, el fondo tiene sus pisos, su alto y su semilla (el mismo color, la misma azotea): se lee
como un solo edificio que llega hasta el corazón de la manzana, y no como una torre con un galpón de techo colorado
atrás. El fondo que ya estaba edificado de antes se rehace con ese edificio en la etapa en que se lo levanta (una sola
vez: si adelante hay uno de 1921 y otro de 1940, con el de 1940). Detrás de una casa baja queda como estaba. Son unos
1.450 de los 7.100 fondos; `crece.pak` pasa de 3,80 a 3,87 MB. **Es supuesto**, como todo lo de los fondos, y sigue
sin contar para el censo. Lo que todavía se ve colorado entre los edificios del centro de 1940 son, sobre todo, los
cuerpos de 1867 del corazón de las manzanas, que fuera de la «city» no se renuevan.

**Los barrios: canchas, hospitales, la Penitenciaría.** `src/lugares/barrios.js` arma lo que faltaba fuera del eje
Plaza de Mayo–Retiro–Palermo, y `src/barrios.js` guarda los solares (la etapa y las cuatro esquinas de cada uno), que
`tools/crece.mjs` despeja de casas. Son veintidós lugares, todos con su marca y su ficha: las canchas (el Gasómetro,
Huracán, Sportivo Barracas, la de River en la Dársena Sur, la Sociedad Sportiva y la de GEBA en Palermo), la Penitenciaría
Nacional, los hospitales Rivadavia, de Clínicas, Italiano y la Casa de Aislamiento (Muñiz), la Facultad de Medicina
de 1895 y la de Derecho de Las Heras, la cárcel de Caseros, el Parque de los Patricios, Santa Felicitas, la Iglesia
Ortodoxa Rusa, el Mercado Spinetto, el Teatro Cervantes, Harrods, el Jockey Club y la Casa de Moneda; el Parque
Lezama tiene marca y ficha, sin obra nueva. **Qué es dato**: dónde estaba cada uno (las esquinas de hoy, de
`tools/esquina.mjs`), desde cuándo y qué clase de edificio era. **Qué es supuesto**: las medidas, la cantidad y el
lugar de cada cuerpo: no hay planta de época de ninguno. **Lo que quedó afuera**: las canchas de River en Alvear y
Tagle (1923-1938) y la de tablones de Boca (1924-1938), que nacen y se van entre el plano de 1921 y el de 1940;
Racing, Independiente y el Monumental, fuera del marco; el Puente Pueyrredón, el Mercado del Plata y el trazado de
Thays del Parque Lezama, sin hacer. Las ubicaciones se contrastaron con el mapa de hoy (Nominatim y Wikipedia): la
cancha de River en la Dársena Sur es la única sin referencia para comparar. Diez fichas llevan foto de época de
Wikimedia Commons (`fuentes/fotos/barrios-*`).

**Las canchas, según las fotos.** Las seis canchas de `src/lugares/barrios.js` siguen las fotos de época de Wikimedia
Commons y lo que cuentan los artículos de Wikipedia de cada estadio (los nombres de archivo están en los comentarios
del código). El Gasómetro tiene dos estados: en 1921, la cancha con la tribuna oficial de madera techada; en 1940, la
tribuna corrida de tablones sobre hierro, de esquinas curvas, con la estructura a la vista. Sportivo Barracas es una
olla baja de cemento con la tribuna oficial techada sobre Luzuriaga, y se va en 1940 (lo demolieron en 1937). Huracán
lleva la pista peraltada entre la cancha y las tribunas de madera. GEBA cambia en cada etapa: la cancha sola (1905),
las tres tribunas del Centenario con la oficial de dos pisos (1910), la pista de atletismo que quedó tras el incendio
de 1916 (1921) y las tribunas de cemento (1940). **Qué sigue siendo supuesto**: el alto y el fondo de cada tribuna, y
la orientación de las canchas de GEBA y de River.

**Entre Palermo y Retiro.** La franja que quedaba pelada entre el parque y las playas de vías:

- **Las plazas de la Recoleta y Palermo Chico** que el plano de Peuser pinta de verde a lo largo de la avenida Alvear
  (Francia e Intendente Alvear desde 1905; Mitre, Rubén Darío, República Oriental del Uruguay, República de Chile y
  el parque de Retiro desde 1921) entran por el mismo camino que los parques de Palermo (`tools/palermo.mjs`, con
  `fuentes/osm/recoleta.json`): pasto, senderos y árboles, sin casas inventadas.
- **Los parques de la Costanera** llegan ahora, del lado de tierra, hasta la última vía (`PARQUES_NORTE`, en
  `src/playas-retiro.js`): de 76 a 94 hectáreas, con los canteros del Peuser.
- **La faja de vías**: en 1940 lleva cinco desvíos más entre las líneas del Córdoba y del Pacífico y del lado de
  tierra, con sus cortes de vagones (al final de `src/lugares/playas-retiro.js`). Cuántos son y dónde, supuesto.
- **El baldío de la avenida Centenario** (hoy Figueroa Alcorta), que el Peuser deja amarillo: no se pintan las calles
  que hoy tiene encima, ni un cerco que el plano de 1867 dibuja en el río frente a la Recoleta y que el lector había
  tomado por calles (`BALDIOS_PALERMO`). Las plazas de hoy que caen ahí no van.

**El Puerto Nuevo, las playas de Retiro y la Costanera Norte.** Del frente de las estaciones de Retiro al río y hasta la punta norte del plano todo es tierra ganada después de 1910.
El suelo de esa zona se arma con lo que está calcado a mano en `src/playas-retiro.js` (lo leen `tools/crece.mjs` y
`src/lugares/playas-retiro.js`):

- **Las calles de hoy no se pintan** adentro de la zona (`ZONA_PLAYAS`): las de la Villa 31, los accesos a las
  autopistas, la Costanera de ahora (que va por un relleno posterior). Siguen en el mapa de hoy («Ver lo de hoy») y en
  el buscador; solo se dejan de pintar en la lámina `public/plano/calles.webp`. Las casas y las plazas de afuera no
  cambian (se comparó `crece.pak` y `crece.json` antes y después: iguales byte a byte).
- **Las avenidas de época** van trazadas una por una (`AVENIDAS`): la que baja de la Plaza Británica al puerto y la
  avenida Edison a lo largo de las cabeceras de las dársenas, desde 1921; la Edison hasta la usina, la que corre entre
  las playas y los depósitos, y la Costanera, desde 1940. Las tres primeras siguen la traza de hoy (Comodoro Py,
  Ramón S. Castillo, Antártida Argentina), que coincide con la del plano de Peuser.
- **La orilla de 1940** al norte del espigón 6 es el borde de la rambla del Peuser (`COSTA_NORTE`): se rellena hasta
  ahí lo que el calco dejaba en serrucho y se saca lo que quedaba más allá.
- **Los parques**: se borra el verde que salía del calco (manchas sin forma, algunas ya en 1921) y se vuelve a leer
  del Peuser solo adentro de los contornos de los parques (`PARQUES_NORTE`), cerrando las rajas del punteado y de los
  rótulos. Los árboles los reparte `node tools/costanera.mjs` donde quedó pasto (hay que correrlo después de
  `tools/crece.mjs` si cambian los parques); deja la lista en `src/lugares/costanera-arboles.js`.
- **Las manchas color teja** que había en el relleno eran los barcos fondeados y los rótulos que el plano de 1867
  dibuja en el río (el suelo de 1867 los trae como «edificado»): adentro de la zona se dan por despejados desde que
  llega la tierra.

Las vías, los vagones, los galpones, el elevador y la rambla están en `src/lugares/playas-retiro.js`; lo que se
agregó a los muelles (la hilera del medio del espigón 4, los depósitos y las grúas del muelle norte de la Dársena D,
las grúas del muelle norte de la E), al final de `src/lugares/puerto-nuevo.js`. En total suman unos 74 mil triángulos
(de 3,85 a 3,92 millones en toda la escena de 1940).

El bajo que ya era tierra en 1867 —la alameda del Paseo Colón y la del Paseo de Julio, entre la última fila de manzanas
y la orilla vieja, unas 24 ha— se urbaniza con el puerto: desde 1895 es suelo de ciudad (`BAJO`, en
`tools/crece.mjs`: un contorno trazado a mano por el borde de las manzanas de 1867). Se van la arboleda y los rótulos
del plano y entran las calles de hoy (Paseo Colón, Alem, Azopardo). Con la Aduana Nueva se van también los depósitos
de la orilla que tenía al lado y las casillas de atrás de la Casa de Gobierno: ahí va la Plaza Colón.

**Las calles, en color**, cambian con los años (`public/plano/calles.webp`): lo que no está pavimentado es tierra.

| Año | Qué se ve | De dónde sale |
|---|---|---|
| 1867 | Empedrado bruto del río a Uruguay–San José y de Santa Fe a San Juan, más Buen Orden y Lima hasta Constitución. Lo demás, tierra. | 498 cuadras empedradas al 1‑12‑1868 (*Revista de Buenos Aires*, t. 18); las calles empedradas en 1858 (Memoria municipal de 1859). El perímetro es una estimación que da esa cantidad de cuadras. |
| 1888 | Adoquín de granito del río a Callao–Entre Ríos y hasta Caseros; afuera, solo las avenidas. | La «zona de conservación» y las 2.039 cuadras del Censo municipal de 1887 y la Memoria de la Intendencia de 1887. |
| 1895 | Pavimento hasta Centro América (Pueyrredón)–Jujuy. La Avenida de Mayo, de madera. | La zona del hormigón de Portland de la ordenanza del 20‑6‑1895 (Memoria de 1895); Morales, *Revista Técnica*, 1898. |
| 1905 | Casi todo lo que abarca el plano. De madera, las calles angostas del centro (del río a Uruguay–San José, de Córdoba a Independencia) y Artes, Buen Orden, Juncal, Brasil, Perú y Defensa. | El criterio de 1896 que cuenta Morales; Anuario estadístico de 1905 (granito 67 %, madera 9 %, asfalto 3 %). |
| 1910 | Lo mismo, completo. | Memoria del Departamento Ejecutivo de 1911. |
| 1921 | Asfalto del río a Callao–Entre Ríos, de Santa Fe a San Juan. | Suposición: no encontré cifras por zona después de 1911. |
| 1940 | Asfalto hasta Pueyrredón–Jujuy y en las avenidas; al sur de Independencia sigue el adoquín. | Suposición, sobre lo que cuenta «La ciudad de Buenos Aires y la domesticación de sus calles» (Junta de Estudios Históricos). |

La calle es lo que queda entre las manzanas del propio visor (alrededor de las de 1867, una franja; en lo que creció
después, las calles de hoy), así que el pavimento cae justo entre las fachadas. Pegada a las casas va la vereda, y las
avenidas nuevas tienen las suyas, más anchas. Los anchos: las calles del casco siguen de 11 varas (9,5 m); Callao,
Entre Ríos y las avenidas al oeste de ellas ya tenían 30 varas (26 m) desde el decreto de 1827 y así las trae el plano;
de las que se ensancharon antes de 1940 están la Avenida de Mayo (30 m), las diagonales, Corrientes, Santa Fe y la
9 de Julio. Córdoba, Belgrano, Independencia, San Juan y Garay tenían ordenanza de ensanche desde 1904, pero al este
de Entre Ríos seguían angostas (de Belgrano no encontré el año: no está ensanchada).

Vale en color y en tinta, levantada o acostada, a pie y en avión (al caminar se choca contra las casas del año que se
mira, y se puede andar por las avenidas nuevas). Son unas 22 mil casas más en 1888, 31 mil en 1895, 34 mil en 1905,
40 mil en 1910, 42 mil en 1921 y 49 mil en 1940.

De dónde sale cada cosa (`tools/crece.mjs`):

- **Las manzanas** son las de hoy: lo que queda entre las calles de OpenStreetMap, ya puestas en el marco de 1867.
- **Qué estaba edificado en cada año** lo dicen seis planos de época, calzados sobre el de 1867 (`tools/epocas.mjs`):
  el punteado rosado en el de 1888, el rayado cruzado en el de 1895, el relleno rosa en los de Ludwig y el rayado
  rosa en el de Peuser. Los planos no se muestran: solo se les pregunta, lote por lote, si ahí había ciudad. Un lote
  se edifica en el primer plano que lo da por construido, si alguno de los que siguen lo confirma.
- **Las casas** son inventadas con la misma receta que las de 1867: sobre el frente de la manzana, en lotes de 10 varas
  y sus múltiplos, sin pisar nada de lo que el plano de 1867 ya trae edificado ni sus calles, ni las plazas (lo que
  el plano de Peuser pinta de verde y, en el casco viejo, lo que no era fondo de ninguna casa). Con los años vienen
  más altas, y más cuanto más cerca del centro.
- **Las avenidas y las plazas nuevas**: la traza es la de la calle de hoy (OpenStreetMap), con el ancho que tuvo cada
  una; el año de cada tramo sale de la historia de la obra, no de los planos. Toda casa de 1867 que pisa la traza se
  va entera, y los edificios del frente nuevo son inventados (en la Diagonal Norte, todos de la misma altura, como
  manda su ordenanza).
- **El puerto**: la costa de Puerto Madero está calcada a mano sobre el plano de 1905 y los diques son los de hoy; la
  de Retiro y la Costanera se lee del plano de Peuser (lo que pinta de celeste es río), dentro de una zona
  marcada a mano, y la de 1921 es esa misma hasta donde llegaba el relleno en el plano de Cannizzaro. El Puerto
  Nuevo no se calca (el Peuser lo dibuja corrido): sus dársenas A a E son las del mapa de hoy, con la tierra entre la
  costa vieja y el frente de los muelles. En 1921 hay agua en A, B, C y D y tierra hasta el borde de la futura E,
  según la carta de los planos oficiales de 1919–1920; los muelles terminados van empedrados.

| Etapa | Plano | De dónde sale |
|---|---|---|
| 1888 | F. Latzina, «Plano de la ciudad de Buenos Aires y de los partidos federalizados…», Lajouane | BnF, vía Wikimedia Commons (dominio público) |
| 1895 | «Plano topográfico de la ciudad de Buenos Aires», Oficina de Obras Públicas de la Municipalidad | Wikimedia Commons (dominio público) |
| 1905 | Pablo Ludwig, «Municipio de Buenos Aires y parte del partido de Avellaneda», 5.ª ed. | BnF, vía Wikimedia Commons (dominio público) |
| 1910 | Pablo Ludwig, el mismo plano en la edición extraordinaria para la Exposición Internacional (1909) | BnF, vía Wikimedia Commons (dominio público) |
| 1921 | A. Cannizzaro, «Plano de la ciudad de Buenos Aires y sus alrededores», Oficina Cartográfica Ludwig | American Geographical Society Library, University of Wisconsin-Milwaukee (dominio público) |
| 1940 | «Nuevo plano de la ciudad de Buenos Aires», Guía Peuser del viajero (1936) | BnF, vía Wikimedia Commons (dominio público) |

Los planos se eligieron con el catálogo «Buenos Aires en cartografía» (Atlas histórico de planos urbanos, Archivo
Buenos Aires, Cátedra Lombardi, FADU‑UBA): <https://sites.google.com/view/ba-en-cartografia/>.

El calce va en dos pasos: uno grueso con cinco o seis plazas marcadas a mano y otro fino, automático, contra las
calles de hoy: en ventanas se busca el corrimiento que pone las calles del plano viejo sobre las actuales y con eso se
ajusta una transformación de segundo grado. El de 1895, que es un levantamiento topográfico, queda a unos 6 m; el de
1921, a unos 7 m, y el de Peuser, a unos 5 m. Los de 1888, 1905 y 1910 son planos de guía, más esquemáticos: quedan
con el error del calce a mano, de algunas decenas de metros, y por eso lo edificado se les lee por zonas y no casa
por casa.

En el visor todo lo nuevo se baja recién al salir de 1867 (`public/datos/crece.pak`, 2,1 MB, y dos láminas:
`public/plano/crece.webp`, 0,7 MB, y `public/plano/despeje.webp`, de unos pocos KB; la de las calles,
`public/plano/calles.webp`, 0,7 MB, se baja al prender el color). Las casas nuevas son otra malla
como la de la ciudad; cada una trae anotada la etapa en que nace y, si la demuelen, la etapa en que se va, y el
sombreador la levanta o la baja cuando llega su año (`src/tinta.js`, `src/epocas.js`). Lo de 1867 que se demuele viene
en una lista aparte (techo por techo y muro por muro) y se anota en la malla de la ciudad. Las láminas dicen de cada
punto «desde cuándo»: lo urbanizado y la tierra ganada, los fondos y lo edificado en una; lo despejado y el verde de
las plazas nuevas en la otra.

Lo que es aproximado o falta:

- La etapa «1910» sale del plano de 1909 y la «1940» del de 1936, más las obras hechas hasta 1940.
- Las fechas de los tramos de las diagonales son redondas: las etapas son pocas y cada tramo cae en la que le sigue.
- De Corrientes se supuso que el ensanche se llevó el lado norte (los números pares).
- Qué casas de 1867 se renovaron es un sorteo (más probable cerca de la plaza), no un dato.
- La 9 de Julio lleva los canteros de hoy.
- De Santa Fe se supuso, como manda la ordenanza de 1904, que se corrió solo la línea del norte.
- El pavimento va por zonas enteras, no cuadra por cuadra: no encontré un plano de pavimentos digitalizado (la Memoria
  de 1911 dice que trae uno, pero el escaneo no lo incluye). No hay vías de tranvía ni arbolado en las calles.
- De los edificios nuevos con nombre hay cuarenta y el Obelisco, más lo del puerto y las plazas (`src/lugares/`);
  el resto de lo que se construyó (bancos, teatros, iglesias nuevas) son casas inventadas, y en el centro de 1940
  quedan más bajas de lo que eran. El Cabildo de cinco arcos a la italiana (de 1931 a 1939) cae entre dos años y no se
  ve; el arco de la Casa Rosada es un nicho, no se atraviesa, y la casa aparece recién en 1905 aunque el frente ya
  estaba en 1888. De los dos, las alturas y el reparto de los tramos están leídos en las fotos.
- De la Estación del Parque de madera no hay ninguna foto: sale de la planta del plano y de una descripción («de
  madera, con un cobertizo lateral»); alturas, techos y colores son supuestos. De la de mampostería, el largo y la
  cantidad de arcos del costado son a ojo, y el año no es seguro (1872 o 1875, según la fuente). Del Congreso, el
  plano dibuja la ochava y no el edificio: su lugar exacto y las dos casas vecinas son supuestos. La Manzana de las
  Luces (la Universidad y el Colegio Nacional) no está hecha: las fotos que hay son posteriores y muestran otros
  frentes.
- De los modernos: el Puente Transbordador va corrido unos 15 m para que las dos torres pisen las orillas del plano,
  y falta el puente carretero de 1940; detrás del Abasto nuevo queda un baldío donde estaba el mercado viejo de 1893,
  y las puntas van rectas (eran redondeadas); el techo del Luna Park va como hoy; de la Bombonera se supuso que la
  cabecera norte tenía una sola bandeja en 1940; las alturas de las alas del Comega y los escalones del Safico salen
  de contar pisos en las fotos.
- En el centro: la Galería Güemes es la menos documentada (los pisos altos de los dos frentes son supuestos, el faro
  va como hoy y quedan medianeras ciegas a la vista); de La Prensa, el frente de Rivadavia repite el de la avenida;
  del Palacio Municipal no pude saber cuándo se sacó la aguja de la ochava (acá, en 1940); la altura de Gath & Chaves
  sale de contar pisos, y las intermedias del Molino, de una foto de hoy.
- En el Retiro: el lugar del Pabellón Argentino sale de una postal de hacia 1920, con unos 10 m de margen, y sus
  colores son una aproximación (era de cerámica policromada). El Plaza Hotel de 1940 es el de 1921: no encontré cómo
  quedó tras la reforma de 1934. Del Palacio Paz, el lado del jardín va liso y faltan las cocheras de Esmeralda; del
  Anchorena, la casa del fondo y el contrafrente son supuestos. La Torre va de 60 m (las fuentes dicen 59, 60 o 75).
- En la Plaza Británica: el trazado de 1940 está calcado de la foto aérea de ese año y el de 1921, de una postal aérea
  de los años veinte (más borrosa: las tres franjas de canteros de cada lado y un redondel de flores; el segundo
  redondel va por simetría). Son supuestos el piso (de granza), los faroles y los bancos, el copón del parterre de
  Alem (en la foto hay algo blanco que no se distingue), los canteritos del pie de la torre (pueden ser las fuentes
  de granito que nombran las crónicas), el alto y el color de los galpones del puerto —que van derechos y solo en su
  primera fila—, el paredón, y cuántos tranvías y colectivos había y de qué color. No encontré quién proyectó la
  plaza. La hilera de casas del pie de la barranca, sobre Alem (de las que inventa `tools/crece.mjs`), sigue en 1940,
  cuando en la foto todo eso ya es explanada: por eso la plazoleta de 1921 y los separadores de 1940 van unos metros
  más cerca de la plaza que en las fotos. La fábrica de gas se va en 1910 (`src/hitos.js`), aunque dejó el terreno
  en 1912: ese año se ve su dibujo en el suelo. Al costado de la estación, hacia Alem, queda un baldío limpio donde
  la foto de 1940 muestra edificios que no se modelaron.
- Del subte, las bocas están donde las de hoy; que cada estación tuviera cuatro, y sus medidas, es supuesto. Sobre
  Rivadavia, que acá sigue siendo la calle angosta de 1867, no hay vereda donde ponerlas: van contra los frentes y
  pisan la calzada. Acoyte y Primera Junta quedan fuera del plano.
- En el puerto: la rada de 1867 no sale de ninguna foto (cuántos barcos y dónde es supuesto); los elevadores y el
  molino están donde el plano de 1905 pinta sus manchas; en el Puerto Nuevo, las usinas van solo en 1940 (las
  fuentes no coinciden en el año), el elevador de granos va sin nombre y en un lugar supuesto (ver más abajo), y la obra de 1921, la playa de carbón y
  qué barco hay en cada muelle son supuestos.
- Las playas de Retiro, el Puerto Nuevo y la Costanera Norte (`src/lugares/playas-retiro.js`, `src/playas-retiro.js`).
  **Sale de los planos** (Cannizzaro 1921, Peuser 1936 y el del puerto de 1925): el lugar, el rumbo y el ancho de las
  tres playas de vías (la del Central Argentino, la más ancha; la del Central Córdoba y la del Pacífico, pegadas del
  lado del río) y de la playa de coches de 1940; las líneas que salen hacia Palermo; la vía del puerto por las
  cabeceras de las dársenas y que cada muelle tiene la suya; el empalme que baja del norte por el borde del parque; el
  triángulo de depósitos entre las playas y la avenida Edison, con sus galpones largos atravesados a las vías; los dos
  edificios rotulados «F. C. del Estado»; las avenidas; la forma de los parques, la avenida Costanera y la rambla.
  Qué espigones están en cada etapa: en 1921, los 2 y 3 (dársenas A, B y C); en 1940, todos. **Del mapa de hoy**: los
  contornos de las dársenas y el trazado exacto de la vía del puerto y de las tres avenidas (el Peuser dibuja las
  dársenas corridas unos 270 m a la altura de la usina y con una de más: se usó para las playas, el empalme y los
  parques, y el mapa de hoy para los espigones). **Es supuesto**: cuántas vías tiene cada playa y dónde está cada
  desvío; los vagones (al azar, con tirada fija); la forma de los galpones de cargas, de las cabeceras de las
  estaciones y de los edificios del Ferrocarril del Estado; cuántos depósitos hay en el triángulo, su largo y su
  color; la unión entre el empalme (leído del Peuser) y la vía del puerto (del mapa de hoy); el tramo de la Costanera
  junto a la laguna; que las avenidas de 1921 fueran adoquinadas y las de 1940 asfaltadas; el pretil, los faroles y
  las dos hileras de árboles de la Costanera, y el lugar de cada árbol de los parques. Los parques del sur que el
  Peuser rotula «proyectado» se pintan igual, menos el lóbulo del este, que cae sobre la laguna. **El elevador de
  granos** del arranque del espigón 4 va porque el puerto los tenía, pero ni el lugar ni la forma ni la fecha salen de
  estas fuentes: no lleva nombre ni ficha, y si aparece un plano que lo ubique hay que moverlo. En el muelle norte
  de las dársenas D y E, cuántos galpones y grúas hay es supuesto.
- Alrededor de los diques (`src/lugares/puerto-madero.js`). **Sale de los planos** (1895, Ludwig 1905, Cannizzaro
  1921, Peuser 1936 y la carta del puerto de 1919-1920): por dónde van las vías (el lazo de cada dique por los puentes,
  la playa de maniobras del oeste, la del sudeste) aunque no cuántas ni la curva exacta de cada una; el lugar y la
  planta de la Plaza Colón, el Parque Colón con su hemiciclo y la Plaza Mazzini; la alameda de Huergo y Madero; el
  lugar de la Aduana; el embarcadero de animales y el depósito grande del Dique 1, el depósito en T del Dique 2, el
  molino y la fila de silos del Dique 3 (la planta de los silos, del mapa de hoy: siguen en pie), las dos hileras de
  galpones del Dique 4 y las de Florencio Sánchez; el corralón municipal y el lazareto de animales; el verde entre
  las vías y la Costanera y la estación radiotelegráfica de 1936. Que los docks sean cinco en el Dique 3 y que los de
  las puntas de los diques 1 y 2 sean más cortos y más hondos sale de esos planos y del mapa de hoy. **Es supuesto**:
  qué hay en cada lote de las manzanas del bajo (galpones y casas al azar sobre el lugar que dejan las calles, y en
  qué etapa aparece cada uno), los colores y las alturas, la forma de cada edificio (la Aduana está armada de memoria
  de su fachada, sin medidas), cuántos vagones hay y dónde, el dibujo de los canteros y senderos de los parques, los
  corrales y los novillos, las grúas de más del lado del río, las antenas, y que los docks de las puntas tengan un
  piso más. Los vagones están quietos: por las vías del puerto no andan trenes.
- En el bajo que ya era tierra en 1867 **sale de los planos** (Ludwig 1910, Cannizzaro 1921, Peuser 1936) qué manzanas
  están edificadas en cada etapa: la primera fila al sur de la Casa de Gobierno, de Paseo Colón a Azopardo (gris en
  1910, rosa en 1921); al este de Alem, la manzana de Corrientes a Lavalle (ya edificada en 1910), las dos que siguen
  a la Plaza Mazzini hasta Córdoba y los «Depósitos» que van hacia el Retiro (1921; tres manzanas torcidas en el
  Peuser); y los jardines de la barranca, del lado de la ciudad del Paseo Colón, entre Estados Unidos y Chile (verdes
  en los tres). **Es supuesto**, como en el resto del bajo, qué hay en cada lote y en qué etapa aparece, el dibujo de
  los canteros y dónde se cortan las tres manzanas de los depósitos (las calles de hoy ahí son otras). No están la
  Escuela Industrial (hoy Otto Krause) ni el mercado del Paseo Colón que rotula el plano de 1921: sus manzanas llevan
  lotes comunes o quedan vacías.
- Lo que no se arregló ahí: el bulevar que el suelo pinta al este del puente entre los diques 1 y 2 no figura en los planos de 1921 ni de 1936; y
  el Departamento del Puerto, el correo, el teatro y los juegos atléticos que rotula el plano de 1921 no están.
- Las manzanas de las afueras siguen el trazado de hoy, que no siempre es el de entonces.

    node tools/epocas.mjs [año …] [--ver]   # los planos calzados → fuentes/planos/epoca-<año>.webp e indice.json
    node tools/edificios.mjs                # las plantas de los edificios grandes, de OpenStreetMap → src/edificios.js
    node tools/esquina.mjs "Calle A" "Calle B"   # dónde queda una esquina de hoy en el plano (para lo que se modela a mano)
    node tools/crece.mjs [--ver]            # → public/datos/crece.pak y crece.json, public/plano/crece.webp, despeje.webp, calles.webp y sus -2k

## La barranca

La ciudad está sobre una meseta, a unos veinte metros sobre el río, y baja a la costa por una barranca. El plano la
dibuja con rayitas pero no la mide, así que las alturas son las de hoy: las curvas de nivel de la Ciudad, de metro en
metro («Elevación terreno», Secretaría de Desarrollo Urbano del GCBA, en Buenos Aires Data, CC BY 2.5 AR), pasadas al
plano con la georreferencia. El terreno natural es el mismo: lo que cambió desde 1867 es la costa (la tierra ganada)
y el Riachuelo, así que el río de 1867 va a cero y de la orilla se sube en rampa. Dan, por ejemplo, 17,6 m en la
Plaza de Mayo, 21 m en el Congreso y, por Corrientes, 16,6 m en la 9 de Julio y 3,6 m en Alem; y se ven los valles de
los terceros. (Una primera versión usó el modelo SRTM, que en el centro mide los techos y no el suelo: no servía.)

El Riachuelo tampoco lo distinguía el lector (el plano lo dibuja con olas finas entre dos orillas, igual de claras que
el campo), así que su cauce está calcado a mano sobre el escaneo, de la boca a la guarda (`RIACHUELO` en
`tools/plano.mjs`): en color es agua, como el río, y el relieve le hace el cauce. Después de tocarlo:
`node tools/hoy.mjs --suelo` y `node tools/relieve.mjs`.

**El arroyo Maldonado** está calcado igual (`MALDONADO`, en `tools/plano.mjs`). El plano lo trae en la esquina de
Palermo: serpentea desde la guarda de arriba hasta el «Puente de Maldonado» del camino de Santa Fe y de ahí sigue en
dos tramos rectos hasta el polvorín, junto al río. El grabado lo dibuja de unos 5 m —es un signo—; acá va de 11 m
aguas arriba y de 15 m aguas abajo, para que se lea como agua, y se corta donde lo cruza un camino (los puentes: si
no, quien maneja no pasaría). Es agua de 1867 a 1921 y en 1940 ya no está: lo entubaron en los años treinta y encima
se abrió la avenida Juan B. Justo (1937); `tools/crece.mjs` tapa el cauce en esa etapa. Entra solo en la lámina del
suelo (`tools/hoy.mjs --suelo`), así que no cuenta entre la tierra ganada al río de «lo de hoy». Tiene su marca y su
ficha («Arroyo Maldonado»), sin foto. Después de tocarlo: `node tools/hoy.mjs --suelo`, `node tools/patios.mjs`,
`node tools/relieve.mjs` y `node tools/crece.mjs`.

**Los otros dos arroyos** que el plano dibuja como agua van igual (`ARROYOS`, en `tools/plano.mjs`; mismos cuatro pasos
después de tocarlos), cada uno con su marca y su ficha:

- **El Manso** (el «Tercero del Norte»). El plano no lo nombra, pero lo dibuja con sus vueltas en las quintas del norte,
  y la georreferencia lo pone justo sobre la calle Austria de hoy, de French a Las Heras, donde lleva un puentecito. Es
  agua solo en 1867: los planos de 1888 en adelante ya traen ahí la cuadrícula y el Hospital Rivadavia, sin arroyo
  (`hasta: 1888`; la fecha real del entubado no se buscó). Corre por lo alto, así que el relieve no lo baja al nivel
  del río (`enLoAlto`): es agua pintada sobre el terreno.
- **El Maciel**, del otro lado del Riachuelo, rotulado dos veces, con las nueve zanjas que le llegan del norte (de una
  sola línea en el grabado; acá, de 6 m). Entra y sale por la guarda de abajo. Es agua en todas las etapas: siguió a
  cielo abierto mucho después de 1940.

El terreno sube con la misma ola que levanta la ciudad: acostado, el plano sigue siendo una hoja lisa. Todo se apoya en
él (las casas, los árboles, las marcas, quien camina).

**Está apagado**: el plano se ve llano. Se prende con `?relieve`, exagerado al doble (la barranca real son unos 15 m
en tres cuadras y, a escala justa, desde el aire no se nota); `?relieve=1` lo deja a escala. Los edificios hechos a mano suben
enteros, a la altura de su origen, así no se les inclina el techo, y su pie baja hasta el suelo donde el terreno queda
más abajo (el muro del Fuerte hace de paredón, los pilotes de los muelles se alargan). Las casas comunes siguen el
terreno punto por punto.

    node tools/relieve.mjs     # → public/datos/relieve.bin (368 KB); las curvas quedan en fuentes/relieve/

## Los trenes

Con la ciudad levantada se ven las vías —el balasto, los durmientes y los dos rieles— y por ellas andan trenes todo el
tiempo. Las vías y los recorridos cambian con el año (`src/vias.js`):

| Línea | Años | Cómo anda | De dónde sale la traza |
|---|---|---|---|
| Ferrocarril del Oeste, de la Estación del Parque al Once (por la calle del Parque, Callao y Corrientes) | 1867 | una vía; un tren que va y vuelve marcha atrás | calcada del plano de 1867 |
| Ferrocarril del Oeste, del Once hacia Flores | todos | dos vías; eléctrico en 1940 | calcada del plano de 1867 |
| Ferrocarril del Norte, del Retiro a Palermo por la orilla | 1867–1910 | dos vías | calcada del plano de 1867 |
| Desde la estación Retiro de 1915 | 1921–1940 | dos vías; eléctrico | la vía de hoy (OpenStreetMap) |
| Ferrocarril del Sud, de Constitución a Barracas al Sud | todos | dos vías | calcada del plano de 1867 (coincide con la de hoy) |
| Ferrocarril de la Boca, de la Estación Venezuela a la Boca por el Paseo Colón | 1867 | una vía, va y vuelve | calcada del plano de 1867 |
| De la Estación Central a la Boca, y de la Estación Central al Retiro por el Paseo de Julio | 1888–1895 | una vía cada una, va y vuelve | el plano de 1867 (que ya dibuja el «tramway» del Paseo de Julio); el paso frente a la Aduana es supuesto |
| De la Casa Amarilla a la Boca | 1905–1940 | una vía, va y vuelve | calcada del plano de 1867 |

En las líneas de dos vías sale un tren del andén cada minuto o dos (más seguido con los años), se pierde por el borde
del plano, y por la otra vía llegan otros tantos, que frenan, esperan y se van. Se anda por la izquierda. En las de una
vía hay un solo tren que va de punta a punta y vuelve. Los trenes son de vapor —la locomotora, el ténder y tres a cinco
coches— salvo los eléctricos (Retiro–Tigre desde 1916, Once–Moreno desde 1923), que son coches solos y sin humo.

Lo que es inventado o aproximado: la forma de la máquina y de los coches (y van un cuarto más grandes de lo real, para
que se distingan); que las líneas de 1867 tengan dos vías y tantos trenes (eran de una, con pocos servicios por día);
la fecha en que el Norte dejó la orilla (acá, con la estación de 1915). Faltan las otras líneas de Retiro (Pacífico y
Central Córdoba) y los tranvías; las vías del puerto están dibujadas (`src/lugares/puerto-madero.js`) pero sin trenes
que anden.

Para que la página siga sin gastar batería, los trenes piden un dibujo solo cuando alguno está dentro de lo que ve la
cámara, a una distancia donde se distingue, y se movió por lo menos medio punto de pantalla: con el pliego entero a la
vista no se dibuja nada. `node tools/tren.mjs --t 120` saca una captura del tren del Parque con el reloj en ese segundo.

## Qué es del plano y qué es inventado

Del plano (leído automáticamente, píxel por píxel):

- **Las manzanas y lo edificado adentro.** El grabador rayó lo construido con rayado cruzado y los fondos con rayado
  simple. Se detecta ese rayado y de ahí sale qué parte de cada manzana tiene techo y cuál es patio o corralón.
- **Las construcciones sueltas y las casillas** de las orillas y de La Boca (rectangulitos de tinta llena).
- **Los árboles**: uno por cada árbol dibujado (unos 35.000), en las plazas, las quintas y los caminos.
- **Las iglesias**: el plano las marca en negro con una cruz. De ahí salen el lugar, el largo y el ancho de la nave.
- El suelo y las azoteas *son* el plano: vista desde arriba, la ciudad levantada coincide con el pliego.

Inventado, con las reglas de la época (el plano no lo dice):

- **Dónde termina una casa y empieza la otra.** Los frentes se reparten en múltiplos de 10 varas (8,66 m).
- **Las alturas.** Cuántas casas hay de cada altura es dato: sale de los censos. Cuál casa de la cuadra es la alta es
  inventado. La ciudad se parte en nueve zonas (centro, anillo, norte cercano, norte lejano, sur cercano, La Boca,
  oeste, arrabal y orillas) y en cada una, etapa por etapa, el porcentaje de casas de uno, dos, tres, cuatro y cinco
  o más pisos es el del censo: 1867 con el de 1869, 1888 con el de 1887, 1895 con el de 1895; 1905 y 1910 son una
  interpolación entre el de 1895 y el de 1914; 1921 es el de 1914 con un poco más; 1940 es un supuesto (no hay cuadro
  de 1936). El centro de 1940 es el más supuesto de todos: 8 % de casas de un piso, 12 de dos, 20 de tres, 10 de
  cuatro y 50 de cinco o más, hasta catorce de corrido (antes, 10, 15, 24, 11 y 40, hasta doce: quedaba bajo contra
  las fotos aéreas de esos años); en el reparto sale 9,6 / 12,0 / 20,0 / 10,4 / 47,9, porque las casas que no se
  pueden tocar son más que el cupo de las de un piso. Y desde 1921 el centro y el anillo no terminan por el norte en
  Córdoba —donde los cortan los cuadros de los censos— sino en Santa Fe: el Retiro y la Plaza San Martín ya eran
  centro (el Plaza Hotel es de 1909, el Kavanagh de 1936). Que el corte se corra justo en 1921 es un supuesto; las
  casas de esa franja pasan al cuadro del centro o del anillo con los pisos que ya tenían. Los cuadros, las fuentes y las salvedades están en `fuentes/censos/LEEME.md`; el reparto, en
  `tools/alturas.mjs` (lo usan `tools/2-ciudad.mjs` y `tools/crece.mjs`, que primero cuentan las casas de cada zona
  y después reparten). Dentro de cada zona las casas altas se sortean, con más suerte cerca de la plaza, de Florida,
  de la Avenida de Mayo y de las otras calles de edificios altos: ese «tirón» es un supuesto. `node
  fuentes/censos/medir-visor.mjs` vuelve a medir lo generado contra los censos. Los frentes de las avenidas nuevas
  y los edificios con nombre no entran en el sorteo: por ellos el centro y el anillo de 1895 y de 1921 quedan algo
  por encima del censo en edificios de cinco pisos o más.
- **Puertas y ventanas.**
- **Los árboles y aljibes de los patios** (solo en color): el plano raya los fondos y no dice qué había en ellos.
- **El estilo de cada casa.** Ningún plano dice cómo era el frente de una casa cualquiera. Para que no sean todas la
  misma caja, cada casa sin nombre lleva uno de nueve estilos, elegido por dónde está, en qué etapa aparece, cuántos
  pisos tiene y su semilla (`estiloDe`, en `src/ciudad.js`):
  - *colonial* (lo de 1867: azotea, pretil, cal) y *rancho* (las orillas de 1867: barro y paja a dos aguas);
  - *italianizante* (de 1888 en adelante: pilastras, cornisa con dentículos, pretil de balaustres, balcones de hierro,
    ocres y rosas);
  - *francesa* (de 1905 a 1921, sobre todo en el Barrio Norte: símil piedra, almohadillado, balcón corrido y mansarda
    de pizarra);
  - *de comercio* (el centro: vidrieras, toldos a rayas y letreros);
  - *racionalista* (1940: ventanas apaisadas de vidrio, balcones macizos, la caja de la escalera, la casilla del
    tanque en la terraza);
  - *galpón* (el bajo junto al puerto y el sur, hacia Barracas: ladrillo a la vista, chapa a dos aguas y, algunos, la chimenea);
  - *casilla de chapa* (La Boca: chapa acanalada de colores, sobre pilotes) y *de orilla* (los barrios nuevos lejos del
    centro: ladrillo o revoque, teja francesa o zinc a dos aguas).

  Los techos a dos aguas, las mansardas, las casillas de tanque, los miradores de las casas viejas, las chimeneas y
  las cúpulas de las esquinas (edificios de 1905 a 1921 que dan a la esquina de su manzana) son piezas de verdad,
  sumadas a la malla de las casas (unos 157 mil paños más sobre 570 mil); las fachadas, los avisos pintados en las
  medianeras altas y los colores se dibujan en `src/tinta.js` con lo que dice `aEstilo`. Las zonas son a ojo (La Boca
  alrededor de la Vuelta de Rocha, lo fabril en el bajo, junto al puerto, y en el sur, hacia Barracas, el norte de Santa Fe para las
  francesas): son un boceto del carácter de cada barrio, no un relevamiento. Los edificios con nombre no cambian.
- **Las ochavas y las siluetas** (solo en lo que se edifica después de 1867; lo del plano queda como el plano lo
  dibuja). Las *ochavas* las arma el visor (`mallaCasas`, en `src/ciudad.js`): el cuerpo que tiene una esquina junto a
  la de su manzana, con las dos paredes libres, la lleva cortada en diagonal, a 4 m de cada lado; los datos no cambian.
  Las *siluetas* las arma `siluetas()`, en `tools/crece.mjs`: casas bajas en L (el patio al costado de la casa
  chorizo), edificios con un patio de aire y luz sobre la medianera o con el contrafrente en L o en U, y edificios de
  cinco pisos o más con los últimos pisos retirados dos o tres metros (sobre todo en 1940). Cuál lote lleva qué es un
  sorteo: ninguna fuente lo dice. Los pisos de cada casa no cambian, así que la comparación con los censos queda igual.

A mano, mirando fotos de esos años (el álbum *Recuerdos de Buenos Ayres*, de Esteban Gonnet, 1864) y la vista a vuelo
de pájaro de Dulin: el Cabildo de once arcos, la Recova Vieja con el Arco de los Virreyes, la Pirámide, la Catedral,
el primer Teatro Colón, la Casa de Gobierno, la Aduana Nueva con su muelle, el muelle de pasajeros con las dos
casillas de la entrada, el Congreso Nacional y las torres y cúpulas de las iglesias. Fuera del centro: la Estación
del Parque y la del Sud (`src/lugares/viejos-1867.js`); la Estación del Norte, en el Retiro
(Gonnet, 1864); la Fábrica de gas con sus galpones, la chimenea y los gasómetros (Gonnet, 1864, y Junior, 1876), y los
depósitos de dos bóvedas del Ferrocarril del Oeste sobre el Mercado 11 de Septiembre (Panunzi, 1865). De las iglesias,
cuatro llevan lo que muestra su foto: la Merced (la torre a la izquierda y el frontis curvo), el Socorro (dos torres
bajas y el pórtico de columnas), el Pilar (la torre y la espadaña) y San Nicolás (la torre en el medio del frente).
El lugar y el tamaño de cada uno son los del plano; la forma es una simplificación.

**Los carteles de la Plaza de la República** (1940, `src/lugares/obelisco-1940.js`) llevan solo el texto que se lee
en fotos fechadas de 1936 y 1937 (la cabecera del archivo dice de cuál sale cada uno): «DIAZ» en las dos torres de
hierro y «MUEBLES DIAZ» en la medianera del edificio de la mueblería, «EL TRUST» en la azotea del Trust y «RELOJES
MARCONI — DAN LA HORA AL MUNDO» en la faja de su ochava, «OPERA» y «TABARIS» sobre las marquesinas, y el colgante
«EL GUIPUR 539» de Carlos Pellegrini. Las letras son geometría, de trazos rectos: dicen lo que decía el cartel, no
cómo estaba dibujado. Los colores no salen de las fotos, que son en blanco y negro (van claro sobre oscuro u oscuro
sobre claro, como se ven). Es supuesto: sobre qué casa se apoyaba la segunda torre «DIAZ» (la foto le tapa el pie), a
qué lote toca cada casa de Cerrito al 300, y el año de los edificios sin fecha (llevan el de la foto más vieja que
los muestra: 1936 o 1937). El frente del Broadway es el de hoy y el del Gran Rex sale de su descripción: de ninguno
apareció una foto fechada de esos años en dominio público. **Sus dos letreros son supuestos**: «BROADWAY» (un tablero
oscuro sobre la marquesina) y «GRAN REX» (letras sueltas en el borde de la marquesina) dicen el nombre de la sala,
que seguro estaba al frente, pero el lugar, el tamaño y la forma no salen de ninguna foto; están para que las salas
se reconozcan desde la vereda y hay que cambiarlos el día que aparezca una foto. Los demás carteles que no se leen
o no se pueden fechar no están.

Esos solares, la playa de Corrientes y Cerrito y el último tramo de la Diagonal Norte son **obras «tardías»** de
`tools/crece.mjs` (la opción `tarde` de `avenida()` y `plaza()`, y la lista `TARDE` de los edificios con nombre): no
cambian nada de las etapas anteriores a la suya. Con cualquier otra obra, el lote inventado que pisa la traza no se
edifica nunca y la casa de 1867 que la pisa no se renueva; con una tardía, esos lotes se edifican y se renuevan como
siempre y se van recién cuando llega la obra (1940). La regla general no cambia. Lo mismo vale para el suelo: la
calzada de una obra tardía no le cambia el pavimento a las calles que cruza, y su frente nuevo no borra lo que ya
se había despejado antes.

Comparando una corrida con esas entradas y otra sin ellas (el mismo `crece.mjs`), antes de 1940 queda: ningún techo
distinto (los mismos, que ahora se van en 1940); en las láminas del suelo, `crece.webp` y `despeje.webp` cambian solo
en valores de 1940, y `calles.webp` solo en puntos que antes no eran calle. Lo que sí queda:
- **medianeras**: `murar()` guarda entero el tramo que tapa un vecino si ese vecino después se va, y desde su altura
  si se queda; como ahora algunos vecinos se van en 1940, cambia ese tramo, que queda por dentro de la casa de al
  lado;
- **filos del suelo**: el visor lee las láminas interpolando entre puntos de 4,6 m. Donde un terreno despejado antes
  (una casa de 1867 que se fue sin reemplazo) toca la traza de la obra, el borde de ese terreno se corre hasta 1,2 m,
  y un árbol del plano que esté justo ahí se va antes;
- **el reparto de pisos por zona** (el censo de `tools/alturas.mjs`) cuenta también las casas de estos solares: con
  las entradas, dos casas lejanas que se renovaban en 1940 no se renuevan, y otras toman su lugar. Antes de 1940 son
  las mismas casas, pero sus medianeras se guardan distinto.

Para que las calles viejas no cambien, la calzada nueva no entra en la lámina de las calles en el punto donde las
toca (la lámina guarda una sola fecha y un solo ancho por punto, para todas las etapas): esas bocas —la de Cerrito y
la de Lavalle y Libertad— las pinta `src/lugares/obelisco-1940.js` con dos paños de asfalto que nacen en 1940.

**El último tramo de la Diagonal Norte** (de Cerrito a Lavalle y Libertad) entra en 1940. Los textos dan la obra
por terminada en 1943, pero en la foto aérea de 1940 del mapa de la Ciudad la calzada ya está abierta de punta a
punta, y el plano de Peuser de 1936 ya la dibuja atravesando la manzana. De la aérea sale: la traza y su ancho, que
el frente del norte es una fila continua de edificios altos (por las sombras) y que el del sur son baldíos y
medianeras, con la playa de estacionamiento en la punta. Es supuesto: los edificios del frente norte, que son los
genéricos de la avenida (33 m, la altura de su ordenanza; en la aérea el del medio es más bajo), y que en el frente
sur no haya nada nuevo. Como en las otras avenidas, el frente nuevo se levanta solo donde quedó lugar entre la línea
y las casas que siguen en pie: sale con huecos y casas bajas en el medio, no como la fila pareja de la foto. En la vereda sur la aérea muestra una hilera de puntos parejos (árboles recién plantados o
los postes de un cerco): no se distingue qué son y no están.

## Cómo está hecho

    tools/1-clases.mjs    el escaneo → qué es cada píxel (papel, edificado, patio, negro lleno, otra tinta)
    tools/2-ciudad.mjs    de ahí → manzanas, lotes, casillas, árboles e iglesias (public/datos/*.bin)
    tools/chicas.mjs      lo chico (casillas y árboles), leído en el escaneo entero
    tools/empacar.mjs     esos datos, en un solo archivo comprimido (public/datos/ciudad.pak)
    tools/3-laminas.mjs   el plano como texturas: entero en cuatro tamaños y en teselas al tamaño del escaneo
    tools/osm.mjs         baja de OpenStreetMap las calles, las vías y el agua de hoy (fuentes/osm/)
    tools/geo.mjs         la georreferencia: de latitud y longitud al plano
    tools/calce.mjs       su ajuste fino, calzando las calles de hoy contra las del plano (tools/geo.json)
    tools/hoy.mjs         lo de hoy sobre el plano: los lugares (public/datos/hoy.json) y el mapa actual en dos
                          láminas (public/plano/hoy-cerca.webp y hoy-lejos.webp), con la tierra ganada al río
    tools/calles.mjs      los nombres de las calles de hoy: un ancla por cuadra (public/datos/calles.bin y .json)
    tools/plano.mjs       lo que se marcó a mano: la escala, el río, los carteles, los edificios especiales
    tools/epocas.mjs      los planos de 1888 a 1936, calzados sobre el de 1867 (fuentes/planos/)
    tools/crece.mjs       las casas que se suman o se demuelen en cada etapa y las láminas del suelo (la línea de tiempo)
    tools/costanera.mjs   los árboles de los parques de la Costanera Norte, donde la lámina del suelo tiene pasto
    tools/palermo.mjs     los parques de Palermo: contornos, lagos, avenidas, senderos y árboles → src/palermo.js
    tools/edificios.mjs   dónde van y cuánto miden los edificios grandes que llegan después (de OpenStreetMap)
    tools/esquina.mjs     una esquina de hoy (o una latitud y longitud), en píxeles del plano y en metros del mundo
    src/lugares/          los lugares hechos a mano, por época: las plazas, la 9 de Julio, el puerto, la Diagonal Norte,
                          el Teatro Colón de 1908, el Cabildo y la Casa Rosada, las bocas del subte y los edificios
                          con nombre de cada tanda (Avenida de Mayo y el centro, Retiro, los modernos, los de 1867, la Plaza de la República de 1940)
    tools/patios.mjs      los árboles y aljibes de los patios, sembrados para el modo en color (public/datos/patios.pak)
    src/patios.js         esos árboles y aljibes, que solo existen en color
    src/epocas.js         la línea de tiempo: los años, la carga de lo que crece y el avance de una etapa a otra
    src/tinta.js          el dibujo: papel, tinta, rayado; la ola que levanta la ciudad
    src/ciudad.js         las casas y los árboles     src/hitos.js   los edificios hechos a mano
    src/vias.js           las vías de cada ferrocarril y sus años     src/tren.js   las vías dibujadas y los trenes
    src/marcas.js         los nombres sobre el plano  src/pagina.js  el contorno de tinta y el grano del papel
    src/camara.js         la cámara                   src/intro.js   el cartel de entrada
    src/modos.js          a pie, en avión y en coche   src/autos.js  los siete coches, su andar, su tablero y su ruido
    src/minimapa.js       el mapita redondo de «Manejar»
    src/ficha.js          la ficha de cada lugar y el velo sobre lo que se puede tocar   src/fichas.js  sus textos y fotos
    src/calles.js         los nombres de las calles de hoy, escritos en un lienzo encima de la vista
    edificios.html        la página de los edificios  src/catalogo.js  su lista   src/vitrina.js  el visor, manejado desde ella
    src/buscar.js         el buscador de direcciones  src/geo.js     la cuenta de la georreferencia (la comparten
                          las herramientas y el navegador, con los números de tools/geo.json)
    src/url.js            las direcciones con versión, y los pedidos que index.html adelanta

`npm run plano` rehace todo desde `fuentes/plano-1867.jpg` (el escaneo no está en el repositorio: pesa 60 MB; ver
«Lo que no está en el repositorio», acá abajo).
`tools/shot.mjs` saca capturas sin ventana, `tools/vivo.mjs` prueba la página con el reloj de verdad y
`tools/busca.mjs` prueba el buscador de punta a punta (con la red de verdad). `tools/vitrina.mjs` prueba la página de
los edificios.

## Lo que no está en el repositorio

El repositorio (<https://github.com/mormonnegro/baires-interactivo>) trae todo lo que hace falta para **ver y
compilar** el visor: el código, los datos ya generados (`public/`) y las fuentes livianas. Con `npm install` y
`npm run build` alcanza. Lo que queda afuera (`.gitignore`) solo hace falta para **volver a generar** los datos:

| Qué | Peso | Quién lo necesita | Cómo se consigue |
|---|---|---|---|
| `fuentes/plano-1867.jpg` | 57 MB | `tools/1-clases.mjs`, `2-ciudad.mjs`, `3-laminas.mjs`, `calce.mjs`, `hoy.mjs`, `ver.mjs` | El escaneo de la BnF, de Wikimedia Commons (la dirección está en «Fuentes»), con ese nombre. |
| `tmp/clases.png` | 2 MB | `tools/crece.mjs`, `patios.mjs`, `hoy.mjs --suelo` y otros | Lo deja `node --max-old-space-size=8000 tools/1-clases.mjs` a partir del escaneo. |
| `fuentes/planos/<año>.jpg` y `1925-puerto.jpg` | 100 MB | `tools/epocas.mjs` | Los baja solo `tools/epocas.mjs` la primera vez (las direcciones están en su lista `EPOCAS`). La carta del puerto se usó solo para mirar. |
| `fuentes/dulin.jpg` | 60 MB | nadie: referencia para modelar | *Buenos-Ayres a vista de pájaro*, de Wikimedia Commons. |
| `paper/video/assets/visor/` y `paper/video/renders/` | 500 MB | el video del artículo | Las tomas se graban del visor (`paper/video/tools/captura.mjs`) y el video se vuelve a armar. |
| `node_modules`, `dist`, `shots`, `tmp`, `.wrangler` | | | Se instalan o se generan. |

Los planos de época ya calzados (`fuentes/planos/epoca-<año>.webp` y `indice.json`, 18 MB) sí están: con ellos y
`tmp/clases.png`, `tools/crece.mjs` corre sin bajar nada.

## Fuentes

- *Plano topográfico de la Ciudad de Buenos Aires y de todo su Municipio*, de Carlos Glade, Departamento Topográfico, 1867.
  Ejemplar de la Bibliothèque nationale de France, vía Wikimedia Commons. Dominio público.
  <https://commons.wikimedia.org/wiki/File:Plano_topografico_de_la_Ciudad_de_Buenos_Aires_y_de_todo_su_Municipio_incluyendo_parte_de_los_partidos_de_Belgrano,_San_Jose_de_Flores_y_Barracas_al_Sur_-_levantado_por_el_Departamento_Topografico,_construido_y_dibuj..._-_btv1b53098699s.jpg>
  (identificador de Gallica: btv1b53098699s)
- El mapa actual (calles, vías, costa y agua): © los colaboradores de OpenStreetMap, con licencia ODbL
  (<https://www.openstreetmap.org/copyright>), bajado con la API Overpass. De ahí salen también los nombres de las
  calles.
- Las direcciones: normalizador de direcciones de la Ciudad de Buenos Aires (USIG) y Nominatim (OpenStreetMap).
- *Buenos-Ayres a vista de pájaro*, J. Dulin (David Rumsey Map Collection, vía Wikimedia Commons), y
  *Recuerdos de Buenos Ayres*, E. Gonnet, 1864 (Biblioteca Nacional, vía Wikimedia Commons): solo como referencia
  para modelar; no se incluyen.
- La Plaza de la República de 1940 (`src/lugares/obelisco-1940.js`): fotos del Archivo General de la Nación (1936), de
  Juan Di Sandro (1937), de Franz Grasser (1937), de Horacio Coppola (1936) y de la *Revista de Arquitectura* n.º 197
  (mayo de 1937), en Wikimedia Commons (están en la lista de fotos de las fichas, más abajo: `republica-…`,
  `opera-…` y `tabaris-1937`); la foto aérea de 1940 del mapa de la Ciudad, solo para ubicar; y, para los años y las
  direcciones, los artículos de Wikipedia en español «El Trust Joyero Relojero», «Chalet Díaz», «Teatro Gran Rex»,
  «Teatro Ópera», «Teatro Broadway (Buenos Aires)» y «Avenida Corrientes».

## Lo que falta

- Las iglesias sin foto confiable (San Juan, Monserrat, la Piedad, la Concepción, San Telmo y las chicas sin nombre)
  salen con una torre genérica, y algunas (las que el plano dibuja pegadas a su convento) no se reconocen solas: las
  del centro están marcadas a mano en `tools/plano.mjs`. San Ignacio, San Francisco y Santo Domingo llevan sus dos
  torres y la cúpula, pero el frente es el genérico.
- Estaciones y mercados sin modelo propio, porque no hay imagen de cómo eran en 1867: la Estación del Parque (la foto
  es de la terminal de 1872; la de 1867 era de madera), la Estación Central (la foto es del edificio de 1872; queda la
  casilla), la Estación del Sud (sin foto) y la estación del Once. Los dos mercados eran plazas de carretas, sin
  edificio propio: del de Constitución no se modeló el edificio de arcos que asoma al fondo de la foto de Gonnet,
  porque no se pudo ubicar en el plano; del 11 de Septiembre, solo los depósitos.
- En las orillas el lector confunde a veces un cerco o una letra con una casilla.
- Del agua están el río, el Riachuelo y los tres arroyos que el plano dibuja (Maldonado, Manso y Maciel). Faltan los
  brazos finos del bañado de la Boca, la laguna de Anderson (junto al saladero, cerca del Puente Alsina) y un par de
  zanjas sin nombre de las dos orillas del Riachuelo. Las fajas sombreadas del oeste y del sur son barrancas y
  bañados, no agua; los terceros del centro el plano no los dibuja, y del Manso solo trae el tramo de las quintas.
  Dentro del cauce quedaron algunas casillas y árboles sueltos que el lector tomó del dibujo de los muelles.
- El relieve es el de hoy: la barranca de 1867 era más abrupta (después se la suavizó y se rellenó el bajo), y de los
  terceros queda el valle pero no el zanjón.
- La orilla de 1867 (el borde de la tierra ganada) se lee sola de las olas del grabado; donde había construcciones
  sobre la costa hubo que marcarla a mano (`SECO` en `tools/plano.mjs`) y puede errar unos metros.
- Los nombres de calles salen uno por cuadra: en calles muy cortas o muy curvas no hay nombre. El buscador depende
  de dos servicios públicos ajenos; si no responden, avisa y nada más.

## La página de los edificios

`edificios.html` es la otra entrada: la lista de todo lo que tiene nombre y cuerpo en el visor —unos setenta
edificios—, año por año, con el visor al lado. Al bajar por la lista, la ciudad va hasta cada edificio en el año en
que aparece, le da vueltas despacio y lo aclara entre los vecinos; en el teléfono la ciudad queda arriba y la lista
pasa por debajo.

- No es otro modelo ni un video: es el visor mismo metido en un marco (`./?limpio&color&vitrina`), sin carteles, al
  que la página le habla con mensajes. `src/vitrina.js` es el lado del visor (elige el año, vuela, gira y pone el velo
  de las fichas sobre ese edificio solo) y `src/catalogo.js`, el de la página (arma las tarjetas y mira cuál cruza la
  línea de lectura). El protocolo está escrito arriba de `vitrina.js`.
- Nada está escrito dos veces: los lugares salen de `src/marcas.js` (las marcas de nivel 2, más unas pocas «de cerca»
  que son edificios: `DE_CERCA`; lo que tiene marca y no es un edificio queda afuera: `FUERA`), los textos y la foto,
  de `src/fichas.js`, y las iglesias las cuenta el visor cuando termina de cargar, porque salen de las cruces del
  plano. Un edificio nuevo con marca y ficha aparece solo en la lista.
- Cada tarjeta va en el año en que el edificio aparece, y trae los años en que está: tocarlos lo muestra en ese otro
  momento (el Cabildo recortado, el Congreso viejo hecho Archivo). «Abrir en el visor» lleva a
  `./?lugar=Nombre&año=1921`, que entra derecho a ese lugar, en su año, con la ficha abierta y sin el cartel de
  entrada.
- El marco no recibe el mouse ni los dedos (si no, la rueda acercaría la ciudad en vez de bajar la lista) hasta que
  se toca «Mover la cámara»; el mismo botón, o Escape, la devuelve. Por eso la página no lleva `scroll-padding`: con
  la ciudad pegada arriba, el navegador la creería tapada y correría la lista cada vez que algo de ella toma el foco.
- **La firma**: «Hecho por @mormonnegro», con su retrato (`public/autor.webp`) y el enlace a su cuenta de X, va en
  la portada y en el cierre de esta página, arriba del cartel de entrada del visor (`src/intro.js`) y en el visor
  mismo, arriba a la derecha (`#firma`, en `index.html`; en el teléfono, solo el retrato, al lado del buscador). Se
  corre cuando ahí va la ficha o el cartel de los modos de recorrer.
- `vite.config.mjs` arma las dos páginas; los pedidos adelantados de `index.html` no van en esta, que no los usa.
- `node tools/vitrina.mjs [--url …]` la prueba en escritorio y en teléfono (la lista, los vuelos, los años, agarrar y
  soltar la cámara) y prueba los enlaces `?lugar`.

## Las fichas de los lugares

Al tocar una marca —o el edificio mismo: un toque sin arrastrar elige el lugar con nombre más cercano— además de ir
con la cámara se abre una hoja al costado (en el teléfono sube desde abajo) con qué era ese lugar en 1867, qué pasó
después, qué hay hoy y fotos de la época; tocando una foto se agranda. Se cierra con la ×, con Escape o abriendo otra.

Las marcas siguen a la línea de tiempo: cada una sabe desde qué año vale y hasta cuál (`src/marcas.js`), así que al
cambiar de año se van las de lo que ya no está y aparecen las de lo nuevo, que se anuncian un par de segundos con un
pulso de tinta. Con mouse, al pasar por un edificio con ficha el cursor es la manito y su etiqueta se resalta, aunque
de lejos no se estuviera mostrando. Lo chico (una estatua, una fuente, un puente) se rotula recién de cerca.
Y el edificio mismo se cubre con un velo claro (en tinta, amarillo de resaltador): lo pinta `src/tinta.js` (`uSobre`)
y se aclara el edificio y nada alrededor, ni el suelo ni los vecinos. Qué es «el edificio» lo dice `junto()`, en
`src/hitos.js`: si junto a la marca hay un edificio suelto, ese entero (por su ancla, el origen de su lugar); si es
parte de un lugar más grande (el Obelisco en la 9 de Julio, la Aduana en el puerto), las piezas que estén dentro de
su radio; y si no tiene modelo propio, las casas que haya ahí. Las plazas, los diques y las avenidas son suelo
(`velo: 'suelo'` en `src/marcas.js`, o el nivel 1): ahí lo que se aclara es el suelo. Con la ficha abierta, su
edificio queda velado más suave.

- `src/ficha.js`: la hoja y el visor (el estilo va adentro, como en `intro.js`). `src/fichas.js`: los textos y qué
  fotos lleva cada lugar. Tienen ficha los 19 lugares de 1867, las 12 iglesias con nombre y todo lo que trae la
  línea de tiempo: los edificios, las plazas y las avenidas de cada año, y lo que está armado en `src/lugares/`
  (los monumentos de las plazas, los seis edificios de la Diagonal Norte, los diques, los docks, la Costanera). Las
  marcas rojas de hoy muestran su nota y, en ocho casos, una foto de lo que había ahí; mientras está la marca de
  época del mismo edificio, la roja se calla.
- Los datos de los textos se cotejaron con Wikipedia en español (noviembre de 2026) y con las descripciones de
  Wikimedia Commons. Donde las fuentes no coinciden o no alcanzan, el texto lo dice (el año de la demolición de la
  Aduana Nueva, la Piedad) o se queda en lo confirmado.
- Las fotos están en `fuentes/fotos/` como se bajaron, cada una con su `.json` (título del archivo en Commons, autor,
  fecha, licencia, dirección). `node tools/fotos.mjs` las pasa a `public/fotos/` (grande, hasta 1400 px) y
  `public/fotos/m/` (la de la ficha) y escribe `src/fotos.json`. Son 152, unos 32 MB en total, y se piden recién al
  abrir cada ficha. Cuando la foto es posterior a 1867, el pie lo dice; cuando la fecha de Commons no cierra con lo
  que se ve (una torre que ya no estaba, un monumento que falta), el pie da la que sale de la foto y lo anota.
- Sin imagen confiable quedaron: San Juan, La Piedad, La Concepción y San Telmo; de lo posterior, el Kilómetro Cero,
  los dos edificios Bencich (en Commons solo hay fotos actuales, con otra licencia), el puente giratorio, la usina de
  la Ítalo (de la que solo hay fotos actuales) y la Galería Güemes (la única de época es muy chica). Del Molino solo
  hay fotos de la obra, y la del Abasto es de «hacia 1945».
- Una ficha puede decir cosas distintas arriba según la época de la marca que se tocó (`eras`, por el `desde` de la
  marca): el Cabildo, que cambia cuatro veces.
- `node tools/fichas.mjs [--url …]` las prueba en un navegador (escritorio, ventana angosta y teléfono).

Todas las imágenes son de dominio público, de Wikimedia Commons (`https://commons.wikimedia.org/wiki/File:` + título):

- `aduana-gonnet` — «Aduana Nueva (1864).jpg» · Esteban Gonnet (1830-1868) · 1864 · Public domain
- `aduana-muelle-gonnet` — «Muelle de la Aduana Nueva (1864).jpg» · Esteban Gonnet (1830 - 1868) · 1864 · Public domain
- `aduana-vista-gonnet` — «Vista de la Aduana Nueva (Gonnet, 1864).jpg» · Esteban Gonnet · 1864 · Public domain
- `aguas-1890` — «Palacio aguas corrientes 1890s.jpg» · Autor desconocido · 1890s · Public domain
- `aguas-1930` — «Palacio aguas corrientes y transito 1930s.jpg» · Autor desconocido · 1930s · Public domain
- `avmayo-gath` — «Av de mayo y peru gathychaves.jpg» · Autor desconocido · 1910 · Public domain
- `banco-1921` — «Banco Nación (ca. 1921).jpg» · Autor desconocido · circa 1921 · Public domain
- `bancouruguayo-1927` — «Banco Argentino Uruguayo (1927).JPG» · Autor desconocido · 1927 · Public domain
- `barolo-1925` — «Barolo, La Inmobiliaria y Congreso Nacional.jpg» · Autor desconocido · circa 1925 · Public domain
- `barolo-zeppelin` — «Graf Zeppelin Palacio Barolo 30 de junio de 1934.jpg» · Autor desconocido · 1934-06-30 · Public domain
- `belgrano-1885` — «Palmeras en plaza mayo 1885.jpg» · Autor desconocido · 1885 · Public domain
- `boca-1870` — «Puerto de los tachos la boca c 1870.jpg» · autor desconocido · circa 1870 · Public domain
- `boston-1924` — «Banco de Boston 1924.JPG» · Autor desconocido · 1924 · Public domain
- `boston-cupula` — «Banco de Boston 1924 cúpula.JPG» · Autor desconocido · 1924 · Public domain
- `cabildo-1915` — «Cabildo buenos aires 1915.jpg» · Autor desconocido · 1915 · Public domain
- `cabildo-1940` — «Cabildo de bs as restaurado 1940.jpg» · Autor desconocido · 1940 · Public domain
- `cabildo-gonnet` — «Cabildo de Buenos Aires (1864).jpg» · Esteban Gonnet (1830-1868) · 1864 · Public domain
- `cabildo-junior` — «Plaza de la Victoria. El Cabildo (Junior, 1876).jpg» · Christiano Junior · 1876 · Public domain
- `calle-victoria-panunzi` — «Calle Victoria.png» · Benito Panunzi (1819–1894) · 1867 · Public domain
- `catedral-junior` — «Iglesia Metropolitana (Junior, 1876).jpg» · Christiano Junior · 1876 · Public domain
- `central-junior` — «Estación Central de los Ferro-carriles Unidos (Junior, 1876).jpg» · Christiano Junior · 1876 · Public domain
- `centro-gath-1914` — «Gath chaves casa central frente.jpg» · Autor desconocido · circa 1914 · Public domain
- `centro-gath-hall` — «Gath y Chavez.jpg» · Autor desconocido · 1913 · Public domain
- `centro-molino-obra` — «Confiteria del molino en construccion.jpg» · Autor desconocido · circa 1915 · Public domain
- `centro-molino-postal` — «Confitería del Molino.jpg» · Autor desconocido · circa 1915 · Public domain
- `centro-municipal-1899` — «Fiestas mayas en la Plaza (AGNA, 1899).jpg» · Autor desconocido · 1899-05-25 · Public domain
- `centro-municipal-1900` — «Palacio Municipal 1900.JPG» · Autor desconocido · circa 1900 · Public domain
- `centro-prensa-1910` — «Edificio La Prensa (1910).JPG» · Autor desconocido · circa 1910 · Public domain
- `centro-prensa-farola` — «Cupula La Prensa.JPG» · Autor desconocido · 1898-11 · Public domain
- `chade-1933` — «Usina de puerto nuevo bs as.jpg» · Autor desconocido · 1933 · Public domain
- `chade-collivadino` — «Usina puerto nuevo by collivadino.jpg» · Pío Collivadino · circa 1928 · Public domain
- `colon-agn` — «Buenos Aires - Recova, Plaza de la Victoria y Teatro Colón,.JPG» · Archivo General de la Nación Argentina · 1875 · Public domain
- `colon-nuevo-agn` — «Archivo General de la Nación Argentina sin fecha Buenos Aires, Teatro Colón.jpg» · Autor desconocido · circa 1910 · Public domain
- `congreso-1910` — «Palacio del congreso antigua.jpg» · Autor desconocido · 1910 · Public domain
- `congreso-bourquin` — «MG-017-0613 Plaza Congreso.tif» · Gastón Bourquin · circa 1925 · Public domain
- `congreso-gonnet` — «Palacio del Congreso (Gonnet, 1864).jpg» · Esteban Gonnet · 1864 · Public domain
- `congreso-obra` — «Congreso Argentina construccion 1906.jpg» · Autor desconocido · 1906 · Public domain
- `constitucion-gonnet` — «Mercado de Constitución (Gonnet, 1864).jpg» · Esteban Gonnet · 1864 · Public domain
- `constitucion-witcomb` — «Estación Constitución (ca 1890).jpg» · Archivo Casa Witcomb · circa 1887 · Public domain
- `continental-1931` — «Hotel Continental, Buenos Aires, Argentina - 1930s.jpg» · Autor desconocido (postal) · 1930s · Public domain
- `correo-1930` — «Palacio de correos 1930s.jpg» · Autor desconocido · 1930s · Public domain
- `costanera-1918` — «Inauguración del Balneario Municipal de Costanera Sur en 1918.png» · Revista argentina Plus Ultra. Diciembre de 1918. · 1918-12-11 · Public domain
- `costanera-1935` — «Balneario Costanera Sur (Archivo GCBA, 1935).jpg» · Municipalidad de Buenos Aires · 1935 · Public domain
- `darsenanorte-1921` — «Dársena Norte de Buenos Aires en 1921, uno de los puntos inmigratorios más importantes del mundo.png» · Revista argentina Plus Ultra. Abril de 1921. · 1921-04-01 · Public domain
- `darsenanorte-aerea` — «MG-017-0018 (Buenos Aires visto de un aeroplano, Darsena Norte – Puerto Nuevo – Plaza Británica y parte de la Ciudad).tif» · Bourquin & Kohlmann · before 1930 · Public domain
- `darsenasur-1915` — «Puerto buenos aires darsena sur.jpg» · Autor desconocido · 1915 · Public domain
- `diagonal-1930` — «Diagonal Norte en los Años 30.jpg» · Autor desconocido · 1930s · Public domain
- `diagonal-coppola` — «Horacio Coppola - Buenos Aires 1936 - Diagonal Norte desde Suipacha.jpg» · Horacio Coppola · 1936 · Public domain
- `docks-1909` — «Puerto madero depositos 1909.jpg» · Autor desconocido · 1909 · Public domain
- `doscongresos-bk` — «MG-017-0021 (Buenos Aires – Monumento a los Dos Congresos).tif» · Bourquin & Kohlmann · before 1950 · Public domain
- `elevadores-1915` — «Elevadores grano del fcca en el puerto ba 1915.jpg» · Autor desconocido · 1915 · Public domain
- `elevadores-olds` — «Puerto Madero Elevadores de Granos (Olds).jpg» · Harry Grant Olds · circa 1910 · Public domain
- `equitativa-1930` — «La Equitativa del Plata 1930.jpg» · Autor desconocido · circa 1930 · Public domain
- `estacionamiento-1937` — «Avenida 9 de Julio (estacionamiento subterráneo 1937).JPG» · Autor desconocido · 1937 · Public domain
- `fuente-1884` — «Cabildo y plaza de mayo agn 1884.jpg» · Autor desconocido · 1884 · Public domain
- `gas-gonnet` — «Primera fábrica de gas (Gonnet, 1864).jpg» · Esteban Gonnet · 1864 · Public domain
- `gas-junior` — «Gasómetro primitivo (Junior, 1876).jpg» · Christiano Junior · 1876 · Public domain
- `gobierno-junior` — «Casa Rosada (1876).jpg» · Christiano Junior (1832–1902) · 1876 · Public domain
- `inmigrantes-mop` — «Hotel de Inmigrantes c. 1912 - Google Arts & Culture.jpg» · Ministerio de Obras Públicas / Johannes Kronfuss · 1910 · Public domain
- `kavanagh-cocina` — «Edificio kavanagh 1936 05.jpg» · Autor desconocido · 1936 · Public domain
- `kavanagh-postal` — «Edificio kavanagh antiguo 03.jpg» · Autor desconocido · circa 1936 · Public domain
- `marte-gonnet` — «Paseo de Marte (Gonnet, 1864).jpg» · Esteban Gonnet · 1864 · Public domain
- `merced-witcomb` — «Iglesia de la Merced (Witcomb, 1877).jpg» · Casa Witcomb · 1877 · Public domain
- `mod-abasto-1945` — «Mercado de Abasto de Buenos Aires, ca 1945 (AGNA).jpg» · Autor desconocido · circa 1945 · Public domain
- `mod-bombonera-1939` — «Bombonera construccion feb1939.jpg» · Autor desconocido · 1939-02-01 · Public domain
- `mod-comega-1930s` — «Edificios Comega y Safico.jpg» · Autor desconocido · c. 1930s · Public domain
- `mod-lunapark-1932` — «Luna park 1930s.jpg» · Autor desconocido · 1931 · Public domain
- `mod-obraspublicas-1936` — «MOP desde el oeste.jpg» · Horacio Cóppola · 1936 · Public domain
- `mod-safico-1936` — «Horacio Coppola - Buenos Aires 1936 - Corrientes desde el edificio COMEGA diurna.jpg» · Horacio Coppola · 1936 · Public domain
- `mod-transbordador-1920` — «Buenos Aires, Argentina, Avellaneda Bridge LCCN2016821930.jpg» · National Photo Company Collection · between 1909 and 1920 · Public domain
- `mod-transbordador-1932` — «Buenos Aires - Puente Transbordador Nicolás Avellaneda en 1932.jpg» · Archivo General de la Nación Argentina · 1932 · Public domain
- `molinos-1910` — «Molinos rioplata y vias ffcc en puerto madero.jpg» · Autor desconocido · 1910 · Public domain
- `muelle-1867` — «Muelle de pasajeros bs as 1867.jpg» · autor desconocido · 1867 · Public domain
- `muelle-gonnet` — «Muelle de Pasajeros (Gonnet, 1864).jpg» · Esteban Gonnet · 1864 · Public domain
- `muelle-panunzi` — «Casillas Muelle de pasajeros bsas, Argentina — 1867.jpg» · Benito Panuzzi (dead in 1894) · 1867 · Public domain
- `munich-1927` — «Cerveceria munich antigua.jpg» · Autor desconocido · circa 1927 · Public domain
- `munich-noche` — «MG-20-02 (Munich – Balneario Municipal).tif» · Hnos. Forero (Buenos Aires) · 1929-07-26 · Public domain
- `nereidas-1916` — «Fuente las nereidas en paseo de julio 1916.jpg» · Autor desconocido · 1916 · Public domain
- `nereidas-1938` — «Fuente de las nereidas en costanera sur.jpg» · Leo Wehrli (1870–1954) · 1938 · Public domain
- `norte-gonnet` — «Retiro y tranvia a caballo fcnba.jpg» · Esteban Gonnet (1829-1868) · 1864 · Public domain
- `nuevedejulio-aerea` — «Avenida 9 de Julio (foto aérea inauguración).JPG» · Municipalidad de la Ciudad de Buenos Aires · 1937-10-12 · Public domain
- `nuevedejulio-postal` — «Vista de la Avenida 9 de Julio, Buenos Aires, en la década de 1930.jpg» · Autor desconocido · circa 1937 · Public domain
- `obelisco-disandro` — «Inauguración Obelisco by Juan di Sandro.jpg» · Juan di Sandro · 1936 · Public domain
- `obelisco-obra` — «Obelisco de Buenos Aires 1936.jpg» · Autor desconocido · 1936 · Public domain
- `once-1900` — «MG-16-039 (Estación Once de Septiembre).tiff» · Mitchell’s Book Stores (576,578 & 580 Cangallo) · 1900 · Public domain
- `once-panunzi` — «Panunzi, Benito - Platz des 11. September in Buenos Aires zur Zeit der Gauchos (Zeno Fotografie).jpg» · Panunzi, Benito · 1865 · Public domain
- `opera-coppola-1936` — «Horacio Coppola - Buenos Aires 1936 - Cine-Teatro Ópera presenta Tiempos modernos.jpg» · Horacio Coppola · 1936 · Public domain
- `opera-grasser-1937` — «Franz Graser Buenos Aires Teatro Opera 1937.jpg» · Franz Grasser · 1937 · Public domain
- `pampero-gonnet` — «Recuerdos de Buenos Ayres - 15 - Locomotora Pampero.jpg» · Esteban Gonnet · 1864 · Public domain
- `parque-junior` — «Ferrocarril Oeste de Buenos Aires Estación del Parque Christiano Junior.jpg» · Christiano Junior · between circa 1870 and circa 1880 · Public domain
- `paseocolon-panunzi` — «Panunzi Paseo Colon.jpg» · Benito Panunzi (1819-1894) · circa 1867 · Public domain
- `pensador-1910` — «The Thinker, by Auguste Rodin.png» · The Thinker (French: Le Penseur), by Auguste Rodin · 1910 · Public domain
- `pilar-gonnet` — «Iglesia de Nuestra Señora del Pilar (Gonnet, 1864).jpg» · Esteban Gonnet · 1864 · Public domain
- `piramide-gonnet` — «Pirámide de Mayo (Gonnet, 1864).jpg» · Esteban Gonnet (1830-1869) · 1864 · Public domain
- `piramide-traslado` — «Piramide mayo 1912.jpg» · Autor desconocido · 1912 · Public domain
- `plazacongreso-detalle` — «Plaza del Congreso, Buenos Aires LCCN2016821472.jpg» · National Photo Company Collection · between 1908 and 1919 · Public domain
- `plazacongreso-loc` — «Plaza del Congreso, Buenos Aires LCCN2016821472.jpg» · National Photo Company Collection · between 1908 and 1919 · Public domain
- `plazacongreso-obra` — «Buenos Aires - Construcción de la Plaza del Congreso.jpg» · Autor desconocido · circa 1910 · Public domain
- `plazalorea-rimathe` — «MG-014-015 (Plaza Lorea).tif» · Samuel Rimathé · before 1930 · Public domain
- `plazamayo-1931` — «Plaza de mayo y av rivadavia 1931.jpg» · Autor desconocido · 1931 · Public domain
- `plazamayo-photoglob` — «Buenos Aires. Plaza Victoria l LCCN2017656795.jpg» · Photoglob Co., publisher · 1890 · Public domain
- `plazamayo-sfa` — «MG-019-007 (Plaza 25 de Mayo).tif» · Sociedad Fotográfica de Aficionados · before 1920 · Public domain
- `plazaparque-gonnet` — «Plaza del Parque de Artillería (Gonnet, 1864).jpg» · Esteban Gonnet (1830-1869) · 1864 · Public domain
- `puerto-1915` — «Buenos Aires 1915.jpg» · Oregon State University Archives · 1915 · Public domain
- `puerto-dique2` — «Puerto madero dique 2.jpg» · Autor desconocido · circa 1900 · Public domain
- `rada-boote` — «Buenos Aires desde el Rio de la Plata.jpg» · Samuel Boote (1844 - 1921) · desconocida · Public domain
- `rada-vidal` — «Landing place by E.E. Vidal.png» · Emeric Essex Vidal (1791-1861) · 1820 · Public domain
- `recoleta2-panunzi` — «Plazoleta Recoleta Buenos Aires 1867.jpg» · Benito Panunzi · 1867 · Public domain
- `recova-demolicion` — «Demolición de la Recova.jpg» · Christiano Junior · 1883-05-25 · Public domain
- `recova-gonnet` — «Vieja Recova.jpg» · Esteban Gonnet (1830-1868) · 1864 · Public domain
- `recova-panunzi` — «Plaza 25 de Mayo.png» · Benito Panunzi (1819-1894) · 1867 · Public domain
- `rentas-gonnet` — «Administración de Rentas Nacionales.jpg» · Esteban Gonnet (1830 - 1868) · 1864 · Public domain
- `republica-1937` — «Av 9 de julio y obelisco 1937.jpg» · Autor desconocido · 1937 · Public domain
- `republica-disandro-1937` — «Inauguracion primer tramo Av 9 de Julio 1937.png» · Juan Di Sandro · 1937 · Public domain
- `republica-trust-1936` — «Buenos Aires - San Nicolás - Construcción del Obelisco.jpg» · Archivo General de la Nación · 1936 · Public domain (en Commons está espejada: acá va al derecho)
- `retiro-1937` — «Estacion retiro fcca 1937.jpg» · Autor desconocido · 1937 · Public domain
- `retiro-anchorena` — «Palacio anchorena 1900s.jpg» · Autor desconocido · 1900 · Public domain
- `retiro-hall` — «Gran Hall.jpg» · Autor desconocido · 1915 · Public domain
- `retiro-pabellon-1900` — «Pabellon-argentino plazasmartin 1900.jpg» · Eugenio Avanzi · 1900 · Public domain
- `retiro-pabellon-sfa` — «Pabellon argentino en plaza sanmartin.jpg» · Sociedad Fotografica de Aficionados · pre-1932 · Public domain
- `retiro-paz-1916` — «Palacio Paz en 1916. Buenos Aires.png» · Revista argentina Plus Ultra. Junio de 1916. · 1916-06-01 · Public domain
- `retiro-plaza-1910` — «Plaza hotel bs as en 1910.jpg» · Autor desconocido · 1910 · Public domain
- `retiro-plaza-peuser` — «Plaza Hotel (Peuser).JPG» · Fototipia Peuser · 1920s · Public domain
- `retiro-torre-1916` — «Torre monumental inauguracion.jpg» · Autor desconocido · 1916-05-24 · Public domain
- `retiro-torre-1932` — «Buenos Aires - Fútbol frente a la Torre Monumental (1932).jpg» · Autor desconocido · 1932 · Public domain
- `riachuelo-junior` — «Riachuelo de los navios.jpg» · Christiano Junior (1832-1902) · 1877 · Public domain
- `rosada-1910` — «Casa de gobierno de argentina.jpg» · Autor desconocido · 1910 · Public domain
- `rosada-1928` — «Buenos Aires, le palais du gouvernement (Pacific) - btv1b53207427n.jpg» · Pacific and Atlantic / Agence Rol (Bibliothèque nationale de France) · 1928 · Public domain
- `rosada-plaza` — «Plaza de mayo y casa de gobierno 1890s.jpg» · Autor desconocido · 1890s · Public domain
- `sanfrancisco-pellegrini` — «San Francisco por Carlos Pellegrini.jpg» · Charles Pellegrini · circa 1850 · Public domain
- `sanmartin-gonnet` — «Monumento al General San Martín.jpg» · Esteban Gonnet (1830 - 1868) · 1864 · Public domain
- `sannicolas-antigua` — «Antigua iglesia sannicolas en buenosaires.jpg» · autor desconocido · pre-1931 · Public domain
- `sannicolas-witcomb` — «San Nicolás de Bari.jpg» · Alexander Witcomb · 1890s · Public domain
- `santodomingo-vidal` — «Church of San Domingo - Emeric Essex Vidal - Picturesque illustrations of Buenos Ayres and Monte Video (1820).jpg» · Emeric Essex Vidal · 1820 · Public domain
- `santodomingo-witcomb` — «Iglesia de Santo Domingo (Witcomb).jpg» · Alexander Witcomb · circa 1900 · Public domain
- `socorro-witcomb` — «Basílica del Socorro (Archivo Witcomb).JPG» · Archivo Casa Witcomb · circa 1880 · Public domain
- `subte-boca-1940` — «Boca de acceso al Subte A.jpg» · Autor desconocido · 1940 · Public domain
- `subte-inauguracion-1913` — «Inauguración de la línea A - Plaza de Mayo (1913).jpg» · Autor desconocido · 1913-12-01 · Public domain
- `subte-pasco-1938` — «Pasco Sur - Boca acceso - 1938 (2).jpg» · Autor desconocido · 1938 · Public domain
- `subte-saenz-1915` — «Estación Sáenz Peña (c. 1915).jpg» · Autor desconocido · circa 1915 · Public domain
- `tabaris-1937` — «Teatro Dancing Tabaris (1937).JPG» · Autor desconocido · 1937 · Public domain
- `tranvia-gonnet` — «Primer tranvia a caballos en bs as 1863.jpg» · Esteban Gonnet · between circa 1864 and circa 1866 · Public domain
- `tribunales-galeria` — «Palacio de Justicia Buenos Aires 1910.jpg» · Autor desconocido · circa 1910 · Public domain
- `tribunales-obra` — «Tribunales en construccion.jpg» · Autor desconocido · circa 1910 · Public domain
- `victoria-catedral-gonnet` — «Plaza de la Victoria, Pirámide y Catedral (Gonnet, 1864).jpg» · Esteban Gonnet · 1864 · Public domain
- `victoria-panunzi` — «Plaza de la Victoria.png» · Benito Panunzi (died 1890) · 1867 · Public domain
- `victoria-recova-gonnet` — «Plaza de la Victoria y Recova Nueva (Gonnet, 1864).jpg» · Esteban Gonnet (1830-1869) · 1864 · Public domain
- `viejos-congreso-frente` — «MG-002-0038 Antiguo Congreso Nacional.jpg» · Autor desconocido · antes de 1950 · Public domain
- `viejos-congreso-junior` — «Congreso (Junior, 1876).jpg» · Christiano Junior · 1876 · Public domain
- `viejos-parque-cerrito` — «Estación del Parque (6).png» · Autor desconocido · c. 1875 · Public domain
- `viejos-parque-nave` — «Estación del Parque (1).jpg» · Anónimo (Archivo General de la Nación) · entre 1875 y 1884 · Public domain
- `viejos-sud-carretas` — «Carretas frente a estacion constitucion.jpg» · Autor desconocido · 1865 · Public domain
