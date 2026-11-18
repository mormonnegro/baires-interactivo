# Fuentes para la etapa de 1955

Lo que se juntó para sumar al visor una etapa más (la 7: 1955). Acá no hay código del visor ni del generador:
solo las fuentes, de dónde salió cada una, qué se verificó y qué no. Consultado todo el 18-11-2026.

- `../planos/1955.jpg` (fuera de git), `../planos/epoca-1955.webp` y `-2k.webp`, y su entrada en `../planos/indice.json`:
  el plano de época, calzado como los otros seis.
- `aerea.mjs`: pide un recorte de las fotos aéreas de 1940, 1965 o 1978 del mapa de la Ciudad. `aereas/`: seis
  muestras (tres lugares, 1940 y 1965) y los tres pares lado a lado.
- `edificacion.json`: lo que hay para las alturas (la serie de permisos de edificación), en el formato de
  `../censos/alturas.json`.
- `cronologia.json`: 45 ítems de lo que cambia entre 1940 y 1955 dentro del marco, con su fuente y su seguridad.
- `fotos.json`: 36 fotos de época candidatas para las fichas (sin bajar).

## 1. El plano

**Plano de la ciudad de Buenos Aires y alrededores**, Oficina Cartográfica «Ludwig», dibujado por A. Cannizzaro y
L. Winter, **1948**, escala 1:25 000, con el norte a la derecha. Ejemplar de la American Geographical Society Library
(University of Wisconsin-Milwaukee), sello de ingreso del 31-12-1948:
<https://collections.lib.uwm.edu/digital/collection/agdm/id/36714>. Es una edición nueva del mismo plano Ludwig de
1921 que ya usa el visor, de la misma biblioteca. 12 659 × 11 458 píxeles, 1,6 m por píxel. Distingue «manzana
edificada» de «manzana no edificada» y dibuja los subtes (la línea E incluida) y la 9 de Julio de Belgrano a Córdoba.

**No es de 1950–1955: es de 1948**, siete años antes de la etapa. No apareció ninguno más cercano que sea libre y
esté en línea a resolución de plano. Lo que se revisó:

| candidato | qué pasó |
|---|---|
| Automóvil Club Argentino, *Buenos Aires: plano del centro de la ciudad*, 1954 (BnF, en Commons) | es una **vista en perspectiva** del centro con los edificios dibujados: no se puede calzar. Sirve de referencia (qué edificios había en 1954) y trae al dorso cinco circuitos comentados cuadra por cuadra |
| Peuser 1953 y Ludwig 1953 | existen (los vende Geographicus como imagen digital), pero son escaneos pagos, sin licencia clara |
| Peuser 1938 y 1940, Rodríguez-Trío c. 1950 y 1963 (Princeton) | con acceso restringido |
| Gallica (BnF) | el buscador rechazó los pedidos automáticos (403); en Commons, de la BnF, solo está el del ACA |
| Library of Congress | rechaza los pedidos automáticos (403) |
| David Rumsey | en la búsqueda «Buenos Aires plano» (186 resultados), nada entre 1940 y 1960 |
| Commons («Old maps of Buenos Aires», «Street maps…», «1950s maps of Argentina») | nada más |
| Biblioteca Nacional (Trapalanda), AGN, IGM/IGN | no se llegó a consultarlos: no tienen un buscador que se pueda pedir de afuera sin navegador |

**Licencia.** El plano es obra de una editorial, publicado en 1948: en la Argentina está en dominio público desde
1999 (ley 11.723, art. 8: 50 años desde la publicación). En Estados Unidos, donde está el ejemplar, el plazo pudo
haberse restituido en 1996 (seguía protegido acá) y la ficha de la biblioteca dice «Rights: The Board of Regents of
the University of Wisconsin System»; el de 1921, de la misma biblioteca, ya figura en el proyecto como dominio
público. El escaneo no se redistribuye (queda fuera de git, como los otros); lo que entra al repositorio es la lámina
calzada, a 3 m por píxel.

**Cómo se bajó.** Con `tools/epocas.mjs`, como los demás. Hubo que hacerle un arreglo chico: el servidor de la AGS no
entrega de una vez imágenes de más de 100 millones de píxeles y esta tiene 145, así que una época puede llevar
`partes` (regiones IIIF) que se bajan de a una y se unen. Las otras seis épocas no cambian (se volvieron a correr
1921 y 1940 y dieron los mismos archivos).

    node --max-old-space-size=8000 tools/epocas.mjs 1955 --ver

**El calce.** Calce grueso con las seis plazas de siempre y ajuste fino contra las calles de hoy:

    1955 · 2365 px, ±20: 144 ventanas, quedan 123, error mediano 11,9 m
    1955 · 2365 px, ±10:  39 ventanas, quedan  39, error mediano 12,7 m

(1921 da 9,6 y 7,4 m; 1940, 33,2 y 5,1 m.) Aparte, en cada punto de control se midió el corrimiento que mejor pone
las calles del plano calzado sobre las de hoy, en una ventana de 400 m. Es una medida ruidosa (los rótulos y las
plazas pesan), por eso van al lado los otros dos planos, medidos igual:

| punto | 1955 (plano de 1948) | 1940 (plano de 1936) | 1921 |
|---|---|---|---|
| Plaza de Mayo | 29 m | 21 m | (no vale) |
| Once (Rivadavia y Pueyrredón) | 3 m | (no vale) | 16 m |
| Retiro (Santa Fe y Maipú) | 25 m | 19 m | 11 m |
| Constitución (la plaza) | 5 m | 5 m | 32 m |
| Palermo (Las Heras y Coronel Díaz) | 16 m | 40 m | 14 m |
| La Boca (Brandsen y Del Valle Iberlucea) | 20 m | 4 m | 40 m |
| Santa Fe y Callao | 13 m | 12 m | 15 m |
| Caseros y Entre Ríos | 22 m | 13 m | 9 m |
| Córdoba y Pueyrredón | 17 m | 37 m | 14 m |
| Obelisco | 22 m | 18 m | 23 m |

O sea: entre 3 y 29 m, mediana 18 m, lo mismo que los otros planos de 1:25 000 (una calle dibujada mide ahí 10 a
15 m de ancho). Alcanza para decir qué manzana está edificada; no para ubicar un edificio dentro de la manzana.

**Qué trae y qué no.** Trae la 9 de Julio abierta de Belgrano a Córdoba (con el Ministerio de Obras Públicas en el
medio), la línea E, la Diagonal Sur, el Puerto Nuevo entero. No trae lo de 1949 a 1955: el tramo Córdoba–Paraguay
de la 9 de Julio (1951), la Facultad de Derecho, la CGT, la Fundación Eva Perón. Y arrastra cosas viejas: todavía
dibuja el Arsenal de Guerra y, parece, el Mercado del Plata demolido en 1947.

## 2. Las fotos aéreas

El mapa interactivo de la Ciudad (<https://mapa.buenosaires.gob.ar>) tiene tres mosaicos históricos: **1940, 1965 y
1978** (después, satélite de 2004 en adelante). La lista de capas está en
<https://epok.buenosaires.gob.ar/mapainteractivoba/layers/>. Son teselas TMS en Web Mercator, de zoom 9 a 18:

    https://servicios.usig.buenosaires.gob.ar/mapcache/tms/1.0.0/fotografias_aereas_<año>_caba_3857@GoogleMapsCompatible/{z}/{x}/{y}.png

(la fila `y` se cuenta desde el sur: `y = 2^z − 1 − y` de las teselas comunes). La página de la Ciudad sobre
fotogrametría dice (según un resumen) que el archivo tiene además mosaicos de 1929, 1937, 1989, 1997 y 2002, que no están en el mapa:
se piden a la Dirección General de Antropología Urbana.

- **Licencia**: los contenidos del Gobierno de la Ciudad son CC BY 2.5 AR
  (<https://buenosaires.gob.ar/terminos-y-condiciones>); las fotos de 1940 y 1965 están además en dominio público.
- **1940** responde entera, hasta zoom 18 (0,49 m por píxel).
- **1965 y 1978** fallan de a ratos (error 500): a zoom 17 (0,98 m por píxel) salen casi siempre, reintentando; a
  zoom 18 no salió ninguna.
- Las teselas traen **estampados los nombres de las calles de hoy**, en amarillo y verde: molestan para medir.
- **Entre 1947 y 1960 no hay nada en línea.** No se encontró ningún vuelo de esos años (IGM, Armada, Commons).

**Cómo pedir un recorte**, por latitud y longitud o por píxeles del plano de 1867:

    node fuentes/1955/aerea.mjs 1965 --plano 11216 8411 --lado 800 --sale tmp/obelisco-1965.jpg
    node fuentes/1955/aerea.mjs 1940 --punto -34.6036 -58.3813 --lado 800 --zoom 18 --marco --sale tmp/obelisco.jpg

Con `--marco` sale girado al marco del plano de 1867, a 1 m por píxel. Va despacio (una tesela cada 2,6 s): un
recorte de 800 m tarda un minuto. No es para bajar la ciudad entera.

**Las muestras** (`aereas/`, 800 m de lado, norte arriba, 0,98 m por píxel): el Obelisco, Santa Fe y Callao, y Once
(Rivadavia y Pueyrredón), en 1940 y en 1965, y los pares `par-*.jpg`. Lo que se ve:

- Obelisco: en 1940 la 9 de Julio va de Tucumán a Bartolomé Mitre; en 1965 sigue al norte de Tucumán (playas de
  autos hasta Viamonte, que es el borde del recorte) y la Plaza de la República es el óvalo de hoy.
- Santa Fe y Callao: en 1940 es un tejido fino de casas con patio; en 1965 casi todas las manzanas tienen torres
  de departamentos en los frentes (techos grandes y claros, sombras largas).
- Once: cambia menos; edificios nuevos sobre Rivadavia y Pueyrredón, la plaza con árboles crecidos.

**¿Sirve para estimar qué manzanas se densificaron?** A ojo, sí; por programa, todavía no. Se probó lo más simple
(qué fracción de cada cuadro de 200 m queda en sombra y qué largo tienen las sombras) y **no sirve tal cual**: el
mosaico de 1965 está armado con fotos de distinto contraste y distinta hora, y el umbral de sombra que anda en una
no anda en la de al lado (dio 0,5 % de sombra en Santa Fe y Callao en 1965, donde hay más torres que en 1940). Para
que sirva hay que: (1) trabajar foto por foto (las costuras se ven); (2) calibrar cada una con sombras de altura
conocida (el Obelisco, el Kavanagh); (3) medir por manzana el largo de sombra sobre la calle del lado
opuesto al sol; y (4) enmascarar los rótulos. Lo que salga es 1965, no 1955: de los 25 años entre una foto y la otra,
1955 es el año 15, pero la obra no fue pareja (ver abajo): lo razonable es darle a 1955 el 55 % del cambio 1940–1965.

## 3. Las alturas

**No hay cuadros de pisos.** No se encontró en línea ningún cuadro de edificios por número de pisos y por
circunscripción ni del IV Censo General de la Nación (1947) ni del Censo Nacional de Vivienda de 1960 ni de un censo
municipal posterior a 1936 (se buscó en archive.org, en el repositorio de censos de Santa Fe de donde salió el de
1869 y en los buscadores). Del de 1947 se publicaron catorce cuadros de los cuarenta previstos (según un resumen, sin abrir la fuente). La etapa de 1955,
como la de 1940, va a ser **extrapolación**.

**Lo que sí hay** (`edificacion.json`): la serie anual de permisos de edificación de toda la Capital, 1935–2006, de
la Dirección General de Estadística y Censos de la Ciudad (*Edificación 2006*, cuadro 2.1). Resumida:

| años | permisos | superficie cubierta | m² por permiso | por año |
|---|---|---|---|---|
| 1935–1940 | 89 639 | 9,0 millones de m² | 100 | 1,50 millones |
| 1941–1947 | 119 252 | 15,6 | 131 | 2,22 |
| 1948–1955 | 106 711 | 16,4 | 154 | 2,05 |
| 1956–1965 | 69 042 | 26,8 | 388 | 2,68 |

Entre 1941 y 1955 se autorizaron **32 millones de m²**, tres veces y media lo de 1935–1940. El permiso medio crece
de a poco hasta 1952 (unos 150 m²) y **salta después**: 265 m² en 1955, 440 en 1957, 510 en 1958. O sea que el auge
de la propiedad horizontal (ley 13.512, de 1948) se nota en el tamaño de las obras recién desde 1954–1955; lo de
1941–1953 es mucha obra mediana (casas y casas de renta de pocos pisos). Hacia 1944, antes de la ley, ya vivía en
casas de departamentos no menos del 20 % de la ciudad (dato de un resumen, sin abrir la fuente).

**Propuesta para 1955** (supuesto, para discutir): (a) tomar la mezcla de 1940 y mover de 1 y 2 niveles a 5 o más en
proporción a los metros autorizados: si 1921→1940 fue la «unidad» de renovación, 1940→1955 es parecida en metros
por año pero con edificios un 40 % más grandes; (b) concentrar lo alto donde lo muestran las aéreas de 1965: Barrio
Norte y Recoleta (Santa Fe, Callao, Las Heras, Libertador), el centro, y los frentes de avenida (Rivadavia,
Corrientes, Córdoba, Pueyrredón), no el sur; (c) tope de 10 a 14 pisos entre medianeras, con el Atlas/Alas (unos
140 m) como única torre nueva; (d) corregir a mano con los tres pares de aéreas y con la vista del ACA de 1954.

## 4. La cronología

`cronologia.json`: 45 ítems. Cada uno trae qué pasa, inicio de obra, inauguración o demolición, cómo estaba en 1955,
lugar, píxeles del plano y metros del mundo, dimensiones si se saben, fuentes y seguridad (24 alta, 17 media,
4 baja). Las fechas salen de los artículos de Wikipedia en español citados en cada ítem, leídos uno por uno, y se
cruzaron con el plano de 1948 y las aéreas donde se pudo. Lo que no estaba en la fuente dice «sin verificar» en la
nota (27 ítems tienen algo así: sobre todo el año de inicio de obra y los pisos). Tres caen fuera del marco: el
Aeroparque, la cancha de Racing y casi toda la Costanera Norte.

Queda por hacer: leer entero el dorso del plano del ACA de 1954 (cinco circuitos por la ciudad, cuadra por cuadra,
con lo que estaba «en construcción»): es la mejor fuente para cerrar lo que quedó sin verificar.

## 5. Las fotos

`fotos.json`: 36 candidatas de Wikimedia Commons, con dirección, autor, fecha, licencia, qué muestran y a qué ítem de
la cronología sirven. Casi todas son de autor desconocido y Commons las da en dominio público por la regla
argentina (25 años desde la toma y 20 desde la primera publicación); la primera publicación casi nunca está
documentada en la ficha. No están bajadas ni incorporadas a `fuentes/fotos/`. Lo que falta está listado en el
mismo archivo.
