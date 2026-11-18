# Censos: pisos y densidad por distrito, 1869-1914

Datos para que las alturas de los edificios y la densidad de las manzanas del visor respondan a lo que
contaron los censos. Acá no hay código del visor: solo las tablas, de dónde salieron, qué se verificó y una
propuesta de calibración para las siete etapas (1867, 1888, 1895, 1905, 1910, 1921 y 1940).

- `alturas.json`: las tablas transcritas (casas por número de pisos, habitantes y superficie por distrito), con
  la fuente, la página y qué tan de primera mano es cada una.
- `medir-visor.mjs`: mide lo que hace hoy el visor, por zona y etapa. Solo lee `public/datos/`.
  Se corre con `node fuentes/censos/medir-visor.mjs` y sirve para volver a comparar después de calibrar.
- `LEEME.md`: esto.

En todo el texto, **niveles** quiere decir planta baja más pisos altos: una casa baja tiene 1 nivel, una «de
altos» tiene 2. Cada número lleva dicho si es **censo**, **interpolación** o **supuesto**.

## 1. Las fuentes

| año | qué trae | de dónde | cómo se tomó | verificación |
|---|---|---|---|---|
| 1869 | casas por techo y número de cuerpos, individuos, familias, cuadras y hectáreas, en las 20 secciones de policía | Primer Censo de la República Argentina, Tabla N.º 9, pp. 80-81 ([PDF](http://www.santafe.gov.ar/archivos/estadisticas/censos/C1869-TU.pdf), páginas 135-136) | transcrito del cuadro, leyendo la imagen | cierran las 20 filas y las columnas de casas, cuadras y familias; la de individuos suma 171 394 y el total impreso dice 171 404 |
| 1887 | casas de 1, 2, 3 y 4 pisos, con sótano, aseguradas y con gas, en las 20 secciones más Flores y Belgrano; habitantes, hectáreas y habitantes por hectárea de 1869 y 1887 | Censo municipal de 1887, t. II, pp. 7, 8 y 109 ([archive.org](https://archive.org/details/censogeneraldela02buen), hojas n10, n11 y n122) | transcrito del cuadro, leyendo la imagen | cierran las 22 filas y las 8 columnas; en habitantes, 1887 − 1869 da el aumento impreso en las 20 secciones |
| 1895 | casas por material y número de cuerpos en las 29 secciones policiales y Martín García | Segundo Censo Nacional, t. III, cap. IV, cuadro I, p. 3 ([PDF](http://www.santafe.gov.ar/archivos/estadisticas/censos/C1895-T3.pdf), página 269) | transcrito del cuadro, leyendo la imagen (escaneo borroso) | cierran las 30 filas y las 12 columnas; una cifra corregida por suma |
| 1904 | superficie, habitantes, manzanas, habitantes por manzana y por hectárea, y población en conventillos, en las 20 circunscripciones | facsímiles del censo en *Población de Buenos Aires*, vol. 4, n.º 6, 2007, pp. 89-98 ([PDF](https://www.redalyc.org/pdf/740/74040610.pdf)) | transcrito de los facsímiles (no del tomo) | conventillos + casas de familia = habitantes en las 20; cierran los totales |
| 1914 | edificios de planta baja, 1, 2, 3, 4, 5 y 6 o más pisos en las 20 circunscripciones | Tercer Censo Nacional, t. X, «Censo de edificación», p. 485 ([PDF](http://www.santafe.gov.ar/archivos/estadisticas/censos/C1914-T10.pdf), página 517) | transcrito del cuadro, leyendo la imagen | cierran las 20 filas y las 9 columnas |
| 1910-1919 | permisos de edificación por año, casas bajas y de altos | Memoria de la Comisión Nacional de Casas Baratas, 1921-22 ([archive.org](https://archive.org/details/1921_1922_Memoria_de_la_Comision_Nacional_de_Casas_Baratas_VI)) | tomado de un resumen, sobre texto reconocido automáticamente | no se verificó contra la imagen; dos absolutos ilegibles van en `null` |

Cómo se transcribió: el texto reconocido automáticamente de estos tomos no sirve para tablas (confunde
columnas y dígitos), así que cada cuadro se leyó sobre la imagen de la página, ampliada por partes, y se pasó
a mano. Después un script sumó cada fila y cada columna y las comparó con los totales impresos; donde una
cifra se leía de dos maneras se tomó la que hace cerrar a la vez la fila y la columna. Las sumas cierran en
todas las tablas salvo en lo que se anota arriba y en `alturas.json` (clave `advertencias` de cada fuente).

Lecturas dudosas que quedaron anotadas:

- **1869**: el total de individuos impreso tiene diez más que la suma de las secciones (las cifras por
  sección son las mismas que repite el censo de 1887). La sección 5ª trae 43 casas de «3 ó más cuerpos»
  contra 60 de 2, que es raro, pero es lo que dice el cuadro.
- **1895**: sección 21ª, azotea de 3 o más cuerpos: se lee «6» y solo cierra con 16; va 16.
- **1904**: la superficie de la circunscripción 2ª empieza con «3» u «8» (tiene que ser 8 por la densidad) y
  la de la 19ª no coincide del todo con su densidad impresa.
- **1887 contra otras fuentes**: el censo da 33 804 casas; la Memoria de Casas Baratas, 33 561. Para 1914 otra
  cita secundaria da 131 432 edificios; el cuadro dice y suma 131 742.

### Lo que no se consiguió

- **Casas por pisos de 1904 y de 1909.** El tomo de 1904 no está en ninguno de los sitios que respondieron (hay
  solo los facsímiles de población y densidad); de 1909 el ejemplar en línea es el tomo II, sin edificación.
  De 1904 quedan los totales por resumen: 82 540 casas y 476 935 piezas.
- **1936.** No apareció en línea ningún cuadro de edificios por pisos del Cuarto Censo General; lo publicado
  es población. La etapa de 1940 es extrapolación.
- **Baldíos por distrito**: no se transcribieron de ningún censo.
- **Límites escritos** de las 20 secciones de 1869 y 1887 (el censo solo trae el plano) y de las 29 de 1895.
- **Cifras de altura** de los reglamentos de 1887, 1891 y 1928: los trabajos leídos los describen sin dar
  los metros (los de 1910 sí están, ver el punto 4).
- Scobie, Torres y Liernur no se pudieron leer en línea; lo secundario sale de Gutman y Hardoy, Tella,
  Sabbadini, Bonicatto, Aboy, y Mazzeo y Lago.
- Varios sitios no respondieron o bloquean las descargas automáticas (la revista y el catálogo de Estadística
  de la Ciudad, HathiTrust, Google Books); no se insistió.

## 2. Cómo cuenta los pisos cada censo

No es la misma convención en todos, y si se mezclan sin pasar a niveles sale mal:

- **1869 y 1895** cuentan «cuerpos»: 1 cuerpo es la casa baja. La columna más alta es «3 ó más cuerpos», sin
  abrir: no se sabe cuántas de esas tienen 4 o 5.
- **1887** cuenta «pisos» como niveles («1 piso» es la casa baja) y llega a 4. Incluye entrepisos y
  bohardillas habitables.
- **1914** cuenta pisos **altos**: «planta baja» es 1 nivel, «1 piso» son 2 niveles, «6 y más» son 7 o más.

Además, el censo de 1887 avisa que el de 1869 contó como casas los departamentos de las secciones céntricas:
la sección 1ª da 1 209 «casas» en 1869 y 919 en 1887 sobre las mismas cuarenta manzanas. El total de casas
del centro de 1869 está inflado y la mezcla de pisos puede estar corrida, no se sabe hacia dónde.

## 3. Los distritos

**1869, 1887 y 1895: secciones de policía.** Veinte en el antiguo municipio (más Flores y Belgrano en 1887),
veintinueve en 1895. Las impares quedan al norte de Rivadavia y las pares al sur. El censo de 1887 trae el
plano («La antigua división de la ciudad de Buenos Aires en veinte secciones de policía», t. I, junto a las
pp. 188-189; [archive.org](https://archive.org/details/censogeneraldela01buen), hojas n245 y n246) pero no
describe los límites, y el centro de la lámina cae en el pliegue. Lo que va en `alturas.json` es **lectura
del plano más el número de manzanas de 1869, aproximado**:

- 1ª: Rivadavia – Córdoba, del río a Maipú (8 × 5 = 40 manzanas). 3ª: de Maipú a Libertad. 5ª: de Libertad a
  Callao.
- 2ª, 4ª y 6ª: lo mismo al sur, entre Rivadavia e Independencia, hasta Entre Ríos. No se pudo decidir si la 2ª
  termina en Chacabuco o en Piedras.
- 13ª Retiro, 15ª Recoleta y el Pilar, 17ª Palermo; 14ª y 16ª San Telmo y Concepción, 18ª Constitución, 20ª La
  Boca y Barracas sobre el Riachuelo; 7ª a 10ª Balvanera; 11ª, 12ª y 19ª las orillas del oeste y del sur.

Para 1895 no se encontraron los límites. Por la cantidad de casas, las secciones 1ª a 20ª parecen seguir a
las de 1887 con ajustes (cambian mucho la 4ª y la 15ª): es una conjetura. Según Gutman y Hardoy, las
secciones 1ª a 6ª equivalen más o menos a las circunscripciones 13 y 14 de después.

**1904 a 1960: veinte circunscripciones** (Ley 4161 y decreto de 1903). Los límites, calle por calle, están en
`alturas.json`, tomados de un resumen (el artículo «Ley N.º 4161» de Wikipedia, que copia el decreto); el mapa
está en los facsímiles de 1904 y en Mazzeo y Lago, «Las divisiones espaciales de la Ciudad de Buenos Aires»
([PDF](https://www.redalyc.org/pdf/740/74012045006.pdf)). Las que importan para el visor: 14 San Nicolás
(Rivadavia – Córdoba, río – Callao), 13 Monserrat (Independencia – Rivadavia, río – Entre Ríos), 20 Socorro
(al norte de Córdoba, hasta Callao), 19 Pilar, 12 Concepción (Garay – Independencia), 10 y 11 Balvanera Sud y
Norte (de Callao – Entre Ríos a Jujuy – Pueyrredón), 9 Balvanera Oeste, 8 San Cristóbal, 4 San Juan
Evangelista (La Boca), 3 Santa Lucía (Barracas).

**Las mismas calles en coordenadas del visor** (metros; x hacia el norte, z hacia el río; Plaza de Mayo en
0, 0), leídas de los bordes de las manzanas de 1867:

| calle | posición |
|---|---|
| Rivadavia | x ≈ +61 |
| Córdoba | x ≈ +1 069 |
| Independencia | x ≈ −969 |
| Garay | x ≈ −1 760 |
| Maipú – Chacabuco | z ≈ −321 |
| Libertad | z ≈ −955 |
| Callao – Entre Ríos | z ≈ −1 730 |
| Pueyrredón – Jujuy | z ≈ −2 990 (medido al norte de Rivadavia) |
| Bulnes – Boedo | z ≈ −4 130 (**estimado** contando cuadras, no medido) |

La cuadra mide entre 126 y 132 m de eje a eje. El (0, 0) del visor es el centro de la manzana oeste de la
plaza (la Plaza de la Victoria).

## 4. Las reglas de altura de cada época

| época | regla | fuente |
|---|---|---|
| década de 1870 | altura máxima según el ancho de la calle: 12,12 m en calles de 9,52 m (11 varas) | Gutman y Hardoy |
| 1887 | Reglamento de Construcciones (17-VI-1887): la altura depende del ancho de la calle, con dos casos, calles de menos y de más de 10 m, sin zonas. Prohíbe el barro y la madera dentro de un perímetro que llega a Entre Ríos y Callao (art. 88). **Los metros no aparecen en lo leído**; Gutman y Hardoy dan 16 m para «reglamentaciones posteriores» a la de 1870 | Sabbadini; Tella; Gutman y Hardoy |
| 1891 | segundo reglamento, versión corregida del anterior (misma prohibición, art. 78). Sin cifras en lo leído | Tella |
| 1910 | Reglamento del 4-XI-1910. Art. 60: **21 m** en calles de hasta 10 m de ancho; en las más anchas, 21 m más la mitad de lo que el ancho pase de 10 m, **sin pasar de 32 m**. Art. 61: frente a plazas, hasta **40 m**. Art. 62: sobre la Avenida de Mayo, altura **mínima de 20 m**, sobre la línea municipal. Por encima, permiso especial del Concejo | Bonicatto; Gutman y Hardoy (21 m «hasta 7 pisos»; 10 y 13 pisos en avenidas y plazas) |
| 1928 | Reglamento General de Construcciones (ordenanza 2 736, 30-VI-1928): tres zonas con alturas y densidades que bajan hacia afuera. La central va de Brasil, Entre Ríos, Independencia, Jujuy y Pueyrredón al río, más los frentes de Rivadavia, Santa Fe y Cabildo; la segunda son los subcentros; el resto, la tercera. Perfil según el ancho de la calle, remate escalonado y torres por encima del plano límite. Altura máxima de fachada fijada sobre la Avenida de Mayo, las diagonales y las plazas de Mayo y del Congreso (arts. 74 y 75). **Los metros no aparecen en lo leído** | Gutman y Hardoy; Tella; Sabbadini; *La Habitación Popular*, 1940 |
| 1944 | Código de la Edificación (referencia, fuera del período): doce zonas de altura y fondo libre obligatorio | Sabbadini |

Dos fuentes no coinciden en los subcentros de la segunda zona de 1928: Tella dice Flores, Belgrano y Devoto;
Sabbadini, Flores, Belgrano y Villa Urquiza.

Edificios que pasaron la regla con permiso especial (Bonicatto; Gutman y Hardoy): el Plaza Hotel (1907-1909,
14 pisos, 63 m, Florida y Charcas), el Railway Building (80 m, Paseo Colón y Alsina), la Galería Güemes
(1915, 80 m; Gutman y Hardoy le dan 15 pisos y la llaman el primer rascacielos), el edificio de Otto Wulff
(60 m, Belgrano y Perú), el Pasaje Barolo (permiso del 3 de enero de 1921, casi 100 m), el Mihanovich
(Arroyo 845, 80 m después de que le negaran los 100). De los años treinta, el Comega (1932), el Safico (1933)
y el Kavanagh (1934-1936); sus alturas no están en lo leído (el Kavanagh ronda los 120 m, dato general sin
verificar acá).

Referencias: J. Gutman y J. E. Hardoy, *Buenos Aires* (MAPFRE, 1992); G. Tella, sobre los cuatro reglamentos
generales de construcción ([texto](http://www.arranz.net/web.arch-mag.com/3/coll/coll3t.html)); M. V.
Sabbadini, en *Cuaderno Urbano* 44 ([PDF](https://revistas.unne.edu.ar/index.php/crn/article/download/9593/9700/33427));
V. Bonicatto, «La inserción urbana del rascacielos en el Río de la Plata (1900-1930)», 2009
([PDF](https://www.aacademica.org/000-008/454.pdf)); R. Aboy, en *Anuario IEHS* 23 (2008).

## 5. Lo que dicen los censos

Porcentaje de casas por niveles, en las zonas de la propuesta (definidas en el punto 7). Todo es censo, salvo
el reparto de centro y anillo en 1914, que es supuesto.

| zona | 1869: 1 / 2 / 3+ | 1887: 1 / 2 / 3 / 4 | 1895: 1 / 2 / 3+ | 1914: 1 / 2 / 3 / 4 / 5+ |
|---|---|---|---|---|
| centro (secc. 1ª y 2ª) | 68,6 / 27,2 / 4,2 | 46,2 / 44,3 / 8,5 / 1,1 | 41,7 / 45,3 / 13,1 | 26,5 / 30,7 / 23,0 / 8,0 / 11,8 (supuesto) |
| anillo (secc. 3ª a 6ª) | 88,9 / 9,8 / 1,2 | 70,1 / 26,2 / 3,4 / 0,2 | 67,1 / 27,3 / 5,7 | 42,7 / 39,1 / 11,3 / 3,1 / 3,8 (supuesto) |
| centro y anillo juntos (circ. 13 y 14) | 83,6 / 14,4 / 2,0 | 64,3 / 30,6 / 4,7 / 0,4 | 61,6 / 31,2 / 7,3 | 39,0 / 37,2 / 14,0 / 4,2 / 5,6 |
| norte cercano (secc. 13ª; circ. 20) | 93,2 / 6,7 / 0,1 | 79,3 / 19,9 / 0,7 / 0,1 | 69,6 / 26,3 / 4,1 | 37,7 / 34,5 / 17,2 / 7,5 / 3,2 |
| norte lejano (secc. 15ª; circ. 19) | 98,4 / 1,6 / 0 | 90,5 / 8,7 / 0,8 / 0 | 77,7 / 19,7 / 2,7 | 64,1 / 27,4 / 6,0 / 1,7 / 0,8 |
| sur cercano (secc. 14ª y 16ª; circ. 12) | 93,9 / 5,9 / 0,2 | 85,9 / 13,7 / 0,4 / 0 | 81,3 / 17,5 / 1,2 | 64,7 / 28,3 / 5,1 / 1,2 / 0,7 |
| La Boca (secc. 20ª; circ. 4) | 50,9 / 49,1 / 0 | 40,6 / 58,2 / 0,9 / 0,3 | 48,2 / 50,8 / 1,0 | 54,9 / 40,6 / 4,3 / 0,3 / 0 |
| oeste (secc. 7ª y 8ª; circ. 10 y 11) | 97,3 / 2,7 / 0 | 88,1 / 11,3 / 0,6 / 0 | 84,2 / 13,7 / 2,1 | 64,4 / 26,4 / 6,2 / 1,4 / 1,6 |
| arrabal (secc. 9ª, 10ª y 18ª; circ. 3, 8 y 9) | 96,0 / 3,3 / 0,6 | 94,0 / 5,7 / 0,3 / 0 | 89,4 / 10,3 / 0,3 | 77,6 / 19,5 / 2,3 / 0,4 / 0,2 |
| orillas (el resto) | 97,3 / 2,6 / 0,1 | 94,3 / 5,5 / 0,2 / 0 | 92,6 / 7,1 / 0,3 | 89,3 / 9,6 / 1,0 / 0,1 / 0,1 |
| toda la ciudad | 88,7 / 10,3 / 0,9 | 83,9 / 14,7 / 1,3 / 0,1 | 84,0 / 14,4 / 1,7 | 80,2 / 15,8 / 2,8 / 0,7 / 0,6 |

Lo que se ve:

- **El centro siempre fue más alto, y la diferencia crece.** En 1869 tiene altos una de cada tres casas del
  centro, una de cada nueve del anillo y casi ninguna afuera. En centro y anillo juntos las casas con altos
  son el 16 % en 1869, el 36 % en 1887, el 38 % en 1895 y el 61 % en 1914.
- **El salto grande es entre 1895 y 1914**: en centro y anillo las casas bajas pasan del 62 % al 39 % y
  aparecen los edificios de 5 niveles o más (393, de los cuales 225 tienen 6 o más y 85 tienen 7 o más).
- **El norte cercano alcanza al centro.** En 1914 el Socorro promedia 2,06 niveles, igual que San Nicolás y
  Monserrat juntos (2,05), y tiene más casas de 3 y 4 niveles que ellos.
- **El sur del centro es algo más bajo que el norte, no la mitad**: Monserrat 1,89 de promedio contra 2,20
  de San Nicolás en 1914; 4,6 % contra 6,4 % de casas de 5 niveles o más.
- **La Boca es un caso aparte**: entre el 41 % y el 58 % de casas de dos niveles en los cuatro censos (las de
  madera y chapa «de alto»), y casi nada más arriba.
- **Las orillas casi no cambian**: de 97 % a 89 % de casas bajas en 45 años. En 1914, Vélez Sarsfield tiene
  99 % de casas bajas; Flores 94 %; Belgrano 89 %; Palermo 78 %.
- Edificios de 7 niveles o más en 1914, en toda la ciudad: 138. San Nicolás 58, Monserrat 27, Socorro 15,
  Balvanera Norte 10, Pilar 5, y de 1 a 4 en otras ocho.

**Densidad.**

- Habitantes por hectárea, por sección: en 1869 el centro tiene entre 174 y 264 (la 3ª es la más densa) y las
  orillas entre 1 y 9; en 1887 el centro sube a 228-333 (la más densa pasa a ser la 6ª) y Balvanera pasa de 8
  a 98. El antiguo municipio promedia 40 en 1869 y 90 en 1887. Los valores sección por sección están en
  `alturas.json`.
- En 1904, por circunscripción: 414 a 535 habitantes por manzana en todo el casco (Monserrat 463, San Nicolás
  474, Socorro 462, Concepción 535, Balvanera Sud 516, Norte 455 y Oeste 409, San Cristóbal 414), 317 a 348
  en La Boca, Barracas y el Pilar, 174 a 243 en Las Heras, San Carlos y San Cristóbal Sud, y 25 a 86 en Vélez
  Sarsfield, Flores, Belgrano, Palermo y San Bernardo.
- **Casas por manzana**: en el casco hay entre 19 y 33 casas por manzana en 1887 (secciones 1ª a 6ª) y entre
  23 y 33 edificios por manzana en 1914 (circunscripciones 10 a 14 y 20, con las manzanas de 1904). No cambia:
  la densidad sube por los pisos y por el hacinamiento, no porque entren más casas en la manzana.
- Personas por casa: 11,2 en la sección 1ª en 1869 (con las casas infladas), 16,9 en 1887; 11,96 por edificio
  en toda la ciudad en 1914; 15,7 por casa de vivienda a fines de 1919.
- Conventillos: 27 % de la población en 1887; en 1904, 138 188 personas (14,5 %), con el máximo en Monserrat
  (29 %), Socorro (30 %), Concepción (27 %), San Juan Evangelista (27 %) y San Nicolás (24 %).
- Permisos de edificación: unos 7 000 a 11 000 por año entre 1910 y 1913 y 2 000 a 3 000 entre 1914 y 1919;
  las casas con altos son entre el 11 % y el 21 % de los permisos.

## 6. Cómo estaba el visor antes de aplicar esto

> **Ya aplicado (17 de noviembre de 2026).** Lo que sigue en este punto, la columna «el visor hoy» de los cuadros del
> punto 7 y todo el punto 8 describen el visor de *antes*. Desde esa fecha los pisos salen de los cuadros del punto 7:
> `tools/alturas.mjs` los trae como objetivo y reparte las casas de cada zona y etapa para cumplirlos (lo usan
> `tools/2-ciudad.mjs` y `tools/crece.mjs`). Medido después con `medir-visor.mjs`, cada zona queda a uno o dos puntos
> del cuadro en todas las etapas; lo que se aparta son el centro y el anillo en 1895 y 1921, algo por encima en
> edificios de cinco pisos o más por los frentes de la Avenida de Mayo y de las diagonales, que no entran en el reparto.


La regla, leída de `tools/2-ciudad.mjs` y `tools/crece.mjs` (sin tocarlos): en 1867 los cuerpos interiores
tienen siempre 1 piso y los de la calle tienen 3 con probabilidad 0,17·exp(−d/520) y 2 con probabilidad
0,66·exp(−d/1300) + 0,05, donde d es la distancia en metros del centro de la manzana a la plaza; la altura es
pisos × (3,9 a 5,4 m) más 0,6 a 1,3 m. Las casas nuevas de cada etapa (e = 1 para 1888 … 6 para 1940) tienen
3 pisos con probabilidad (0,14 + 0,05·e)·exp(−d/900), 2 con 0,62·exp(−d/2400) + 0,07, y 4 o más con
0,05·(e − 3)·exp(−d/1500) recién desde 1910; desde 1921 se suma la «city» (1 hasta 750 m de la plaza, después
exp(−(d − 750)/620), por 0,55 al sur), que da 4 a 9 pisos con probabilidad 0,35 en 1921 y 0,8 en 1940. Las
casas de 1867 se renuevan en cada etapa con una probabilidad de 0,07 (1888), 0,05, 0,08, 0,06, 0,12 y 0,17
(1940) por exp(−d/1500), o por la «city» (0,3 en 1921, 0,78 en 1940), con topes de 3, 4, 5, 6, 8 y 9 pisos; en
1940 un 6 % de lo renovado en el centro son torres de 38 a 54 m. Aparte van los frentes de avenidas: Avenida
de Mayo (4 a 6 pisos desde 1895), Diagonal Norte (9, con cornisa a 33 m), Diagonal Sur (7 a 9), Corrientes
ensanchada (5 a 9) y Santa Fe.

Medido el 17 de noviembre de 2026 sobre `public/datos/` tal como estaba (hay otros cambios en curso: conviene
volver a correr `medir-visor.mjs`). La unidad es el cuerpo a la calle; los cuerpos interiores de 1867, que
son siempre bajos, quedan fuera del porcentaje. Por franja de distancia a la plaza:

| franja | 1867 | 1888 | 1895 | 1905 | 1910 | 1921 | 1940 |
|---|---:|---:|---:|---:|---:|---:|---:|
| 0 a 400 m | 1,78 | 1,83 | 2,11 | 2,19 | 2,24 | 3,59 | 4,74 |
| 400 a 800 m | 1,59 | 1,64 | 1,86 | 1,90 | 1,96 | 2,85 | 4,69 |
| 800 a 1 200 m | 1,39 | 1,46 | 1,59 | 1,61 | 1,64 | 2,36 | 3,72 |
| 1 200 a 1 800 m | 1,25 | 1,34 | 1,36 | 1,39 | 1,42 | 1,84 | 2,62 |
| 1 800 a 2 500 m | 1,17 | 1,30 | 1,31 | 1,31 | 1,32 | 1,37 | 1,49 |
| 2 500 a 3 500 m | 1,07 | 1,24 | 1,24 | 1,24 | 1,24 | 1,25 | 1,27 |
| 3 500 a 5 000 m | 1,05 | 1,17 | 1,18 | 1,18 | 1,18 | 1,18 | 1,18 |
| más de 5 000 m | 1,02 | 1,07 | 1,11 | 1,12 | 1,12 | 1,12 | 1,13 |
| toda la lámina | 1,19 | 1,25 | 1,25 | 1,25 | 1,25 | 1,31 | 1,46 |

(Promedio de pisos de los cuerpos a la calle. Por superficie de techo y contando los interiores, toda la
lámina da 1,11 en 1867 y 1,47 en 1940, que es lo que ya figuraba en el inventario del proyecto.) La mezcla por
zona está al lado de cada tabla del punto 7.

Cantidad de casas: en el centro y el anillo el visor tiene unos 5 600 a 6 200 cuerpos, contando los
interiores, contra 6 938 casas del censo de 1887 y 7 063 edificios del de 1914: el orden es el mismo. Los
cuerpos a la calle son unos 2 100 a 2 700, o sea que cada frente del visor equivale a dos o tres casas
reales. Por eso lo que conviene comparar con el censo es el **porcentaje** de frentes de cada altura y no la
cantidad.

## 7. Propuesta de calibración

### Las zonas

Nueve, definidas con calles para que se puedan pasar a coordenadas (las del punto 3):

| zona | qué es | límites | distritos de censo |
|---|---|---|---|
| centro | Plaza de Mayo, Florida, San Martín, el arranque de la Avenida de Mayo | Independencia – Córdoba, del río a Maipú – Chacabuco | secciones 1ª y 2ª; parte este de las circunscripciones 13 y 14 |
| anillo | lo que rodea al centro | Independencia – Córdoba, de Maipú – Chacabuco a Callao – Entre Ríos | secciones 3ª a 6ª; resto de las circunscripciones 13 y 14 |
| norte cercano | Retiro, Socorro, plaza San Martín | al norte de Córdoba, del río a Callao | sección 13ª; circunscripción 20 |
| norte lejano | el Pilar, la Recoleta | al norte de Córdoba, de Callao a Bulnes | sección 15ª; circunscripción 19 |
| sur cercano | San Telmo, Concepción, Constitución | Garay – Independencia, del río a Entre Ríos | secciones 14ª y 16ª; circunscripción 12 |
| La Boca | La Boca y el borde del Riachuelo | al sur de Garay, del lado del río (al este de Montes de Oca) | sección 20ª; circunscripción 4 |
| oeste | Balvanera, el Once | Independencia – Córdoba, de Callao – Entre Ríos a Pueyrredón – Jujuy | secciones 7ª y 8ª; circunscripciones 10 y 11 |
| arrabal | Barracas, San Cristóbal, Balvanera Oeste | al sur de Garay y al oeste de Montes de Oca hasta Entre Ríos; entre Garay y Córdoba, de Pueyrredón – Jujuy (o Entre Ríos, al sur de Independencia) a Bulnes – Boedo | secciones 9ª, 10ª y 18ª; circunscripciones 3, 8 y 9 |
| orillas | todo lo demás | | secciones 11ª, 12ª, 17ª y 19ª; circunscripciones 1, 2, 5, 6, 7 y 15 a 18 |

Salvedades: los distritos de censo no calzan exactos con las zonas (la circunscripción 20 es más grande que
la sección 13ª; las secciones de 1895 se suponen iguales a las de 1887), y en `medir-visor.mjs` la zona «La
Boca» es todo lo que queda al sur de Garay desde 350 m al oeste de la línea de la plaza hacia el río, que
incluye el este de Barracas: ese límite está puesto a ojo.

### Cómo se llenó cada etapa

- **1867**: el censo de 1869, tal cual. Es dos años posterior y es el único dato; tiene la salvedad de los
  departamentos contados como casas en el centro. Si se desconfía, el techo es el censo de 1887: la verdad de
  1867 no puede estar por encima.
- **1888**: el censo de 1887, tal cual.
- **1895**: el censo de 1895 para 1 nivel, 2 niveles y «3 o más». El reparto de ese «3 o más» en 3, 4 y 5+
  es **supuesto**: 70 %, 22 % y 8 % en el centro (por la Avenida de Mayo, abierta en 1894); 80 %, 16 % y 4 %
  en el anillo; casi todo de 3 en el resto.
- **1905 y 1910**: **interpolación** lineal en el tiempo entre 1895 y 1914 (10/19 y 15/19 del camino). No hay
  cuadro de 1904 ni de 1909 para corregirla; los permisos (7 000 a 11 000 por año en 1910-1913) dicen que el
  grueso del cambio ya estaba hecho antes de la guerra, así que la interpolación lineal no exagera 1910.
- **1914** no es una etapa, pero es el ancla. Para separar centro y anillo dentro de las circunscripciones 13
  y 14 se usó un **supuesto**: que el centro guarda con el conjunto la misma relación que en 1895 (0,68 veces
  las casas bajas, 1,8 veces las de 3 o más) y que pesa el 23 % de las casas.
- **1921**: **extrapolación**: el censo de 1914 más el 12 % del cambio habido entre 1895 y 1914, porque en
  esos siete años se edificó a un tercio o un cuarto del ritmo anterior (2 000 a 3 000 permisos por año).
- **1940**: **supuesto**, sin censo que lo sostenga: las casas de 1 y 2 niveles siguen cayendo al ritmo de
  1895-1914 hasta un piso de 10 a 18 % en el centro y el anillo, las de 3 y 4 se mantienen y lo que falta pasa
  a 5 o más. Tómese como orden de magnitud, con unos diez puntos de margen para cada lado.

El promedio de cada fila cuenta las casas de 5+ como 5 niveles en 1867-1888, 5,5 en 1895-1905, 6 en 1910, 6,2
en 1921 y 7 en 1940 (**supuesto**; en 1914, de los 393 edificios de 5 o más del centro y el anillo, 168 tienen
5, 140 tienen 6 y 85 tienen 7 o más).

El «máximo razonable» es lo más alto que conviene que salga de corrido en la zona; sale de la columna más
alta del censo con alguna casa, de la regla de altura de la época y de los edificios nombrados en el punto 4.

#### 1867

| zona | % de 1 | % de 2 | % de 3 | % de 4 | % de 5+ | promedio | máximo razonable (niveles) | de dónde sale | el visor hoy: 1 / 2 / 3 / 4 / 5+ (promedio) |
|---|---:|---:|---:|---:|---:|---:|---|---|---|
| centro | 68,6 | 27,2 | 4,2 | 0,0 | 0,0 | 1,36 | 3 | censo de 1869, secciones 1ª y 2ª | 46,3 / 46,2 / 7,5 / 0,0 / 0,0 (1,61) |
| anillo | 88,9 | 9,8 | 1,2 | 0,0 | 0,0 | 1,12 | 3 | censo de 1869, secciones 3ª a 6ª | 69,3 / 29,1 / 1,5 / 0,0 / 0,0 (1,32) |
| norte cercano | 93,2 | 6,7 | 0,1 | 0,0 | 0,0 | 1,07 | 2 (3, una casa) | censo de 1869, sección 13ª | 80,9 / 18,7 / 0,4 / 0,0 / 0,0 (1,20) |
| norte lejano | 98,4 | 1,6 | 0,0 | 0,0 | 0,0 | 1,02 | 2 | censo de 1869, sección 15ª | 91,7 / 8,3 / 0,0 / 0,0 / 0,0 (1,08) |
| sur cercano | 93,9 | 5,9 | 0,2 | 0,0 | 0,0 | 1,06 | 2 (3, cuatro casas) | censo de 1869, secciones 14ª y 16ª | 75,5 / 23,6 / 0,9 / 0,0 / 0,0 (1,25) |
| La Boca | 50,9 | 49,1 | 0,0 | 0,0 | 0,0 | 1,49 | 2 | censo de 1869, sección 20ª | 95,1 / 4,8 / 0,1 / 0,0 / 0,0 (1,05) |
| oeste | 97,3 | 2,7 | 0,0 | 0,0 | 0,0 | 1,03 | 2 | censo de 1869, secciones 7ª y 8ª | 84,4 / 15,3 / 0,3 / 0,0 / 0,0 (1,16) |
| arrabal | 96,0 | 3,3 | 0,6 | 0,0 | 0,0 | 1,05 | 2 (3 raro) | censo de 1869, secciones 9ª, 10ª y 18ª | 91,8 / 8,1 / 0,1 / 0,0 / 0,0 (1,08) |
| orillas | 97,3 | 2,6 | 0,1 | 0,0 | 0,0 | 1,03 | 2 | censo de 1869, secciones 11ª, 12ª, 17ª y 19ª | 95,6 / 4,4 / 0,0 / 0,0 / 0,0 (1,04) |

#### 1888

| zona | % de 1 | % de 2 | % de 3 | % de 4 | % de 5+ | promedio | máximo razonable (niveles) | de dónde sale | el visor hoy: 1 / 2 / 3 / 4 / 5+ (promedio) |
|---|---:|---:|---:|---:|---:|---:|---|---|---|
| centro | 46,2 | 44,3 | 8,5 | 1,1 | 0,0 | 1,65 | 4 (18 casas) | censo de 1887, secciones 1ª y 2ª | 43,7 / 46,6 / 9,8 / 0,0 / 0,0 (1,66) |
| anillo | 70,1 | 26,2 | 3,4 | 0,2 | 0,0 | 1,34 | 4 (10 casas) | censo de 1887, secciones 3ª a 6ª | 64,0 / 32,7 / 3,3 / 0,0 / 0,0 (1,39) |
| norte cercano | 79,3 | 19,9 | 0,7 | 0,1 | 0,0 | 1,22 | 3 (4, una casa) | censo de 1887, sección 13ª | 71,0 / 27,8 / 1,3 / 0,0 / 0,0 (1,30) |
| norte lejano | 90,5 | 8,7 | 0,8 | 0,0 | 0,0 | 1,10 | 3 | censo de 1887, sección 15ª | 79,1 / 20,4 / 0,4 / 0,0 / 0,0 (1,21) |
| sur cercano | 85,9 | 13,7 | 0,4 | 0,0 | 0,0 | 1,15 | 3 | censo de 1887, secciones 14ª y 16ª | 68,6 / 29,1 / 2,3 / 0,0 / 0,0 (1,34) |
| La Boca | 40,6 | 58,2 | 0,9 | 0,3 | 0,0 | 1,61 | 3 (4, cuatro casas) | censo de 1887, sección 20ª | 81,1 / 18,5 / 0,4 / 0,0 / 0,0 (1,19) |
| oeste | 88,1 | 11,3 | 0,6 | 0,0 | 0,0 | 1,13 | 3 | censo de 1887, secciones 7ª y 8ª | 74,6 / 24,6 / 0,8 / 0,0 / 0,0 (1,26) |
| arrabal | 94,0 | 5,7 | 0,3 | 0,0 | 0,0 | 1,06 | 3 (4, dos casas) | censo de 1887, secciones 9ª, 10ª y 18ª | 78,4 / 21,1 / 0,4 / 0,0 / 0,0 (1,22) |
| orillas | 94,3 | 5,5 | 0,2 | 0,0 | 0,0 | 1,06 | 2 (3 raro) | censo de 1887, secciones 11ª, 12ª, 17ª y 19ª | 83,8 / 16,0 / 0,2 / 0,0 / 0,0 (1,16) |

#### 1895

| zona | % de 1 | % de 2 | % de 3 | % de 4 | % de 5+ | promedio | máximo razonable (niveles) | de dónde sale | el visor hoy: 1 / 2 / 3 / 4 / 5+ (promedio) |
|---|---:|---:|---:|---:|---:|---:|---|---|---|
| centro | 41,7 | 45,3 | 9,2 | 2,9 | 1,0 | 1,77 | 4; 5 a 6 sobre la Avenida de Mayo | censo de 1895 para 1, 2 y «3 ó más»; el reparto en 3, 4 y 5+ es supuesto | 41,6 / 44,5 / 10,7 / 2,0 / 1,2 (1,77) |
| anillo | 67,1 | 27,3 | 4,6 | 0,9 | 0,2 | 1,40 | 4; 5 a 6 sobre la Avenida de Mayo | censo de 1895 para 1, 2 y «3 ó más»; el reparto en 3, 4 y 5+ es supuesto | 60,5 / 32,0 / 4,1 / 1,3 / 2,2 (1,53) |
| norte cercano | 69,6 | 26,3 | 3,5 | 0,5 | 0,1 | 1,35 | 4 | censo de 1895 para 1, 2 y «3 ó más»; el reparto en 3, 4 y 5+ es supuesto | 69,5 / 28,8 / 1,7 / 0,0 / 0,0 (1,32) |
| norte lejano | 77,7 | 19,7 | 2,4 | 0,3 | 0,0 | 1,25 | 3 | censo de 1895 para 1, 2 y «3 ó más»; el reparto en 3, 4 y 5+ es supuesto | 79,7 / 19,8 / 0,5 / 0,0 / 0,0 (1,21) |
| sur cercano | 81,3 | 17,5 | 1,1 | 0,1 | 0,0 | 1,20 | 3 | censo de 1895 para 1, 2 y «3 ó más»; el reparto en 3, 4 y 5+ es supuesto | 67,6 / 29,5 / 2,9 / 0,0 / 0,0 (1,35) |
| La Boca | 48,2 | 50,8 | 1,0 | 0,0 | 0,0 | 1,53 | 3 | censo de 1895 para 1, 2 y «3 ó más»; el reparto en 3, 4 y 5+ es supuesto | 80,3 / 19,3 / 0,5 / 0,0 / 0,0 (1,20) |
| oeste | 84,2 | 13,7 | 1,9 | 0,2 | 0,0 | 1,18 | 3 (4 raro) | censo de 1895 para 1, 2 y «3 ó más»; el reparto en 3, 4 y 5+ es supuesto | 74,2 / 24,8 / 1,0 / 0,0 / 0,0 (1,27) |
| arrabal | 89,4 | 10,3 | 0,3 | 0,0 | 0,0 | 1,11 | 3 | censo de 1895 para 1, 2 y «3 ó más»; el reparto en 3, 4 y 5+ es supuesto | 78,4 / 21,1 / 0,5 / 0,0 / 0,0 (1,22) |
| orillas | 92,6 | 7,1 | 0,3 | 0,0 | 0,0 | 1,08 | 2 (3 raro) | censo de 1895 para 1, 2 y «3 ó más»; el reparto en 3, 4 y 5+ es supuesto | 83,3 / 16,5 / 0,2 / 0,0 / 0,0 (1,17) |

#### 1905

| zona | % de 1 | % de 2 | % de 3 | % de 4 | % de 5+ | promedio | máximo razonable (niveles) | de dónde sale | el visor hoy: 1 / 2 / 3 / 4 / 5+ (promedio) |
|---|---:|---:|---:|---:|---:|---:|---|---|---|
| centro | 33,7 | 37,6 | 16,5 | 5,6 | 6,7 | 2,17 | 6 a 7 | interpolación 1895 → 1914 (10/19); el reparto centro / anillo de 1914 es supuesto | 40,7 / 43,6 / 11,1 / 2,9 / 1,7 (1,82) |
| anillo | 54,2 | 33,5 | 8,1 | 2,1 | 2,1 | 1,65 | 5; 6 a 7 sobre la Avenida de Mayo | interpolación 1895 → 1914 (10/19); el reparto centro / anillo de 1914 es supuesto | 59,7 / 31,5 / 5,0 / 1,6 / 2,2 (1,56) |
| norte cercano | 52,8 | 30,6 | 10,7 | 4,2 | 1,7 | 1,72 | 5 a 6 | interpolación 1895 → 1914 (10/19) | 69,3 / 28,7 / 1,8 / 0,2 / 0,0 (1,33) |
| norte lejano | 70,5 | 23,7 | 4,3 | 1,0 | 0,4 | 1,37 | 4 | interpolación 1895 → 1914 (10/19) | 79,9 / 19,7 / 0,4 / 0,0 / 0,0 (1,21) |
| sur cercano | 72,6 | 23,2 | 3,2 | 0,7 | 0,4 | 1,33 | 4 | interpolación 1895 → 1914 (10/19) | 67,1 / 29,3 / 3,3 / 0,3 / 0,0 (1,37) |
| La Boca | 51,7 | 45,4 | 2,7 | 0,2 | 0,0 | 1,51 | 3 | interpolación 1895 → 1914 (10/19) | 80,4 / 19,1 / 0,5 / 0,0 / 0,0 (1,20) |
| oeste | 73,8 | 20,4 | 4,2 | 0,8 | 0,8 | 1,35 | 4 a 5 | interpolación 1895 → 1914 (10/19) | 74,1 / 24,7 / 1,1 / 0,1 / 0,0 (1,27) |
| arrabal | 83,2 | 15,1 | 1,4 | 0,2 | 0,1 | 1,19 | 3 a 4 | interpolación 1895 → 1914 (10/19) | 78,4 / 21,0 / 0,6 / 0,0 / 0,0 (1,22) |
| orillas | 90,8 | 8,4 | 0,7 | 0,1 | 0,1 | 1,11 | 3 | interpolación 1895 → 1914 (10/19) | 83,9 / 15,9 / 0,2 / 0,0 / 0,0 (1,16) |

#### 1910

| zona | % de 1 | % de 2 | % de 3 | % de 4 | % de 5+ | promedio | máximo razonable (niveles) | de dónde sale | el visor hoy: 1 / 2 / 3 / 4 / 5+ (promedio) |
|---|---:|---:|---:|---:|---:|---:|---|---|---|
| centro | 29,7 | 33,8 | 20,1 | 6,9 | 9,5 | 2,42 | 7 en calles (21 m); 9 a 10 en avenidas (32 m) | interpolación 1895 → 1914 (15/19); el reparto centro / anillo de 1914 es supuesto | 39,6 / 41,7 / 12,5 / 3,3 / 2,8 (1,88) |
| anillo | 47,8 | 36,6 | 9,9 | 2,6 | 3,0 | 1,79 | 7; 9 a 10 en avenidas | interpolación 1895 → 1914 (15/19); el reparto centro / anillo de 1914 es supuesto | 58,8 / 30,8 / 5,7 / 2,1 / 2,6 (1,60) |
| norte cercano | 44,4 | 32,7 | 14,3 | 6,0 | 2,5 | 1,92 | 7; el Plaza Hotel, 14 pisos y 63 m | interpolación 1895 → 1914 (15/19) | 68,8 / 28,6 / 2,1 / 0,4 / 0,1 (1,34) |
| norte lejano | 66,9 | 25,8 | 5,2 | 1,4 | 0,6 | 1,43 | 5 a 6 | interpolación 1895 → 1914 (15/19) | 80,0 / 19,5 / 0,4 / 0,0 / 0,0 (1,20) |
| sur cercano | 68,2 | 26,0 | 4,3 | 1,0 | 0,6 | 1,41 | 5 | interpolación 1895 → 1914 (15/19) | 66,6 / 29,0 / 3,7 / 0,5 / 0,2 (1,39) |
| La Boca | 53,4 | 42,7 | 3,6 | 0,2 | 0,0 | 1,51 | 3 (4 raro) | interpolación 1895 → 1914 (15/19) | 80,2 / 19,1 / 0,5 / 0,1 / 0,0 (1,21) |
| oeste | 68,6 | 23,7 | 5,3 | 1,1 | 1,3 | 1,44 | 6 a 7 | interpolación 1895 → 1914 (15/19) | 74,0 / 24,5 / 1,3 / 0,2 / 0,0 (1,28) |
| arrabal | 80,1 | 17,6 | 1,9 | 0,3 | 0,2 | 1,23 | 4 a 5 | interpolación 1895 → 1914 (15/19) | 78,3 / 21,1 / 0,6 / 0,1 / 0,0 (1,22) |
| orillas | 89,9 | 9,1 | 0,9 | 0,1 | 0,1 | 1,12 | 3 a 4 | interpolación 1895 → 1914 (15/19) | 84,3 / 15,5 / 0,2 / 0,0 / 0,0 (1,16) |

#### 1921

| zona | % de 1 | % de 2 | % de 3 | % de 4 | % de 5+ | promedio | máximo razonable (niveles) | de dónde sale | el visor hoy: 1 / 2 / 3 / 4 / 5+ (promedio) |
|---|---:|---:|---:|---:|---:|---:|---|---|---|
| centro | 24,7 | 29,0 | 24,7 | 8,6 | 13,1 | 2,72 | 9 a 10 (32 m; 40 m frente a plazas); torres con permiso: Güemes y Railway Building 80 m, Otto Wulff 60 m | extrapolación: censo de 1914 más el 12 % del cambio 1895 → 1914; el reparto centro / anillo es supuesto | 28,3 / 29,8 / 12,7 / 7,1 / 22,1 (2,93) |
| anillo | 39,8 | 40,5 | 12,1 | 3,4 | 4,2 | 1,97 | 9 a 10; el Barolo (casi 100 m, en obra) | extrapolación: censo de 1914 más el 12 % del cambio 1895 → 1914; el reparto centro / anillo es supuesto | 47,7 / 25,4 / 7,0 / 5,1 / 14,8 (2,26) |
| norte cercano | 33,8 | 35,4 | 18,8 | 8,3 | 3,6 | 2,17 | 9 a 10; el Plaza Hotel, 63 m | extrapolación: censo de 1914 más el 12 % del cambio 1895 → 1914 | 64,2 / 26,8 / 2,7 / 1,8 / 4,5 (1,60) |
| norte lejano | 62,5 | 28,3 | 6,4 | 1,9 | 0,9 | 1,51 | 7 | extrapolación: censo de 1914 más el 12 % del cambio 1895 → 1914 | 80,0 / 19,5 / 0,4 / 0,0 / 0,1 (1,21) |
| sur cercano | 62,7 | 29,6 | 5,6 | 1,3 | 0,8 | 1,49 | 6 | extrapolación: censo de 1914 más el 12 % del cambio 1895 → 1914 | 65,5 / 28,4 / 3,7 / 1,4 / 1,0 (1,44) |
| La Boca | 55,6 | 39,3 | 4,7 | 0,3 | 0,0 | 1,50 | 4 | extrapolación: censo de 1914 más el 12 % del cambio 1895 → 1914 | 80,8 / 18,5 / 0,5 / 0,1 / 0,2 (1,21) |
| oeste | 62,0 | 27,9 | 6,7 | 1,5 | 1,8 | 1,55 | 7 a 8 | extrapolación: censo de 1914 más el 12 % del cambio 1895 → 1914 | 73,4 / 24,3 / 1,3 / 0,6 / 0,4 (1,30) |
| arrabal | 76,2 | 20,6 | 2,5 | 0,4 | 0,2 | 1,28 | 5 a 6 | extrapolación: censo de 1914 más el 12 % del cambio 1895 → 1914 | 78,3 / 21,0 / 0,6 / 0,1 / 0,1 (1,23) |
| orillas | 88,8 | 9,9 | 1,1 | 0,1 | 0,1 | 1,13 | 4 | extrapolación: censo de 1914 más el 12 % del cambio 1895 → 1914 | 84,5 / 15,2 / 0,2 / 0,0 / 0,0 (1,16) |

#### 1940

| zona | % de 1 | % de 2 | % de 3 | % de 4 | % de 5+ | promedio | máximo razonable (niveles) | de dónde sale | el visor hoy: 1 / 2 / 3 / 4 / 5+ (promedio) |
|---|---:|---:|---:|---:|---:|---:|---|---|---|
| centro | 10,0 | 15,0 | 24,0 | 11,0 | 40,0 | 4,36 | 10 a 12 de corrido; torres de 80 a 100 m (Comega, Safico) | supuesto (no hay cuadro de 1936): las casas bajas siguen cayendo al ritmo 1895-1914, las de 3 y 4 se mantienen y el resto pasa a 5+ | 13,2 / 13,7 / 15,2 / 11,3 / 46,6 (4,39) |
| anillo | 18,0 | 30,0 | 16,0 | 8,0 | 28,0 | 3,54 | 10 a 12; el Barolo | supuesto (no hay cuadro de 1936): las casas bajas siguen cayendo al ritmo 1895-1914, las de 3 y 4 se mantienen y el resto pasa a 5+ | 28,0 / 15,5 / 10,2 / 10,1 / 36,3 (3,60) |
| norte cercano | 18,0 | 30,0 | 20,0 | 11,0 | 21,0 | 3,29 | 10 a 12; el Kavanagh (torre de la plaza San Martín) y el Mihanovich (80 m) | supuesto (no hay cuadro de 1936): las casas bajas siguen cayendo al ritmo 1895-1914, las de 3 y 4 se mantienen y el resto pasa a 5+ | 54,6 / 23,8 / 4,6 / 4,1 / 12,9 (2,13) |
| norte lejano | 48,0 | 30,0 | 10,0 | 5,0 | 7,0 | 2,07 | 8 a 10 | supuesto (no hay cuadro de 1936): las casas bajas siguen cayendo al ritmo 1895-1914, las de 3 y 4 se mantienen y el resto pasa a 5+ | 80,1 / 19,2 / 0,4 / 0,1 / 0,2 (1,21) |
| sur cercano | 52,0 | 33,0 | 9,0 | 3,0 | 3,0 | 1,78 | 7 a 8 | supuesto (no hay cuadro de 1936): las casas bajas siguen cayendo al ritmo 1895-1914, las de 3 y 4 se mantienen y el resto pasa a 5+ | 63,5 / 28,3 / 3,8 / 1,4 / 2,9 (1,54) |
| La Boca | 52,0 | 40,0 | 6,5 | 1,0 | 0,5 | 1,59 | 4 a 5 | supuesto (no hay cuadro de 1936): las casas bajas siguen cayendo al ritmo 1895-1914, las de 3 y 4 se mantienen y el resto pasa a 5+ | 80,1 / 19,0 / 0,5 / 0,1 / 0,3 (1,22) |
| oeste | 45,0 | 30,0 | 11,0 | 5,0 | 9,0 | 2,21 | 8 a 10 sobre Rivadavia, Corrientes y Callao; 6 adentro | supuesto (no hay cuadro de 1936): las casas bajas siguen cayendo al ritmo 1895-1914, las de 3 y 4 se mantienen y el resto pasa a 5+ | 71,3 / 24,1 / 1,4 / 0,8 / 2,5 (1,41) |
| arrabal | 68,0 | 25,0 | 4,5 | 1,5 | 1,0 | 1,45 | 6 a 7 | supuesto (no hay cuadro de 1936): las casas bajas siguen cayendo al ritmo 1895-1914, las de 3 y 4 se mantienen y el resto pasa a 5+ | 78,0 / 20,9 / 0,6 / 0,1 / 0,4 (1,24) |
| orillas | 84,0 | 14,0 | 1,5 | 0,3 | 0,2 | 1,19 | 4 a 5 | supuesto (no hay cuadro de 1936): las casas bajas siguen cayendo al ritmo 1895-1914, las de 3 y 4 se mantienen y el resto pasa a 5+ | 84,5 / 15,1 / 0,2 / 0,0 / 0,1 (1,16) |

### En forma de regla

Para quien toque los números de `tools/` (son **ajustes a ojo** sobre las tablas, para arrancar; hay que
medir después):

- **1867.** Con la regla de hoy el centro sale como en el censo de 1887, no como en el de 1869. Para acercarse
  a 1869: 2 pisos con probabilidad ≈ 0,76·exp(−d/490) + 0,025 (hoy 0,66·exp(−d/1300) + 0,05) y 3 pisos con
  ≈ 0,13·exp(−d/480) (hoy 0,17·exp(−d/520)). Lo que cambia es sobre todo la caída de las casas de dos pisos
  con la distancia, que hoy es mucho más lenta que en el censo.
- **Casas nuevas de 1888 a 1910 lejos del centro.** Hoy salen con 2 pisos en una proporción de
  0,62·exp(−d/2400) + 0,07, que da 20 a 30 % a dos o tres kilómetros; el censo da 5 a 14 %. Algo como
  0,30·exp(−d/1500) + 0,04 queda en el orden.
- **Renovación de 1895 a 1910.** Tiene que ser bastante más fuerte en centro, anillo y norte cercano: entre
  1895 y 1914 un tercio de las casas bajas de esas zonas pasó a tener altos (hoy la parte renovada por etapa
  es 0,05 a 0,08 en la plaza y cae con la distancia). Y la de 1921 más débil: esos años se edificó poco.
- **El norte cercano** tiene que tratarse como centro desde 1895: la distancia a la Plaza de Mayo lo
  castiga, y en el censo de 1914 es tan alto como San Nicolás. Sirve medir la distancia al eje Florida –
  plaza San Martín en vez de a la plaza sola, o usar las zonas.
- **El sur del centro**: el factor 0,55 de la «city» al sur es más de lo que dice el censo de 1914 (la
  relación de promedios Monserrat / San Nicolás es 0,86), aunque el resultado medido de 1921 queda parecido
  (2,22 contra 2,65) porque la Avenida de Mayo levanta el lado sur.
- **La Boca**: la mitad de las casas de dos pisos en todas las etapas, techo de 3, sin depender de la
  distancia.
- **Orillas**: 3 a 10 % de casas de dos pisos según la etapa, no 15 a 17 %.

## 8. Dónde se aparta más el visor

De mayor a menor:

1. **Norte cercano (Retiro y Socorro), de 1905 en adelante.** El visor da 1,33 a 1,34 niveles de promedio en
   1905 y 1910 y 2,1 % de casas de 3 niveles; el censo de 1914 da 2,06 y 27,9 % de 3 o más. Es la zona donde
   la regla por distancia a la plaza falla más. En 1921 sigue igual (1,60 contra 2,17).
2. **Centro y anillo en 1905 y 1910: quedan bajos.** El visor casi no cambia entre 1895 y 1910 (casas bajas
   del centro: 41,6 % a 39,6 %); en los censos pasan de 41,7 % (1895) a algo como 26,5 % (1914). En las
   circunscripciones 13 y 14 juntas el visor de 1910 tiene 53,4 % de frentes bajos y 2,6 % de 5 o más; el
   censo de 1914, 39,0 % y 5,6 %. Edificios de 6 niveles o más: 19 en el visor de 1910, 225 en el censo.
3. **El salto de 1921.** El visor guarda el crecimiento para 1921 y ahí se pasa: en el centro los frentes de 5
   o más van de 2,8 % (1910) a 22,1 % (1921), cuando en 1914 ya había cerca de 12 % (con el supuesto del
   reparto) y después se edificó poco; en el anillo, de 2,6 % a 14,8 % contra unos 4 %. En cantidad no es disparatado (307 frentes
   de 6 o más en el visor de 1921 contra 225 edificios en 1914), pero faltan las casas de 2 y 3 niveles que
   los rodean: el visor de 1921 tiene en el anillo 7,0 % de frentes de 3 niveles y el censo, 11 a 12 %.
4. **Fuera del centro, de 1888 a 1910: demasiadas casas de dos pisos.** En el arrabal el visor da 21 % en
   1888 y el censo 5,7 %; en las orillas 16 % contra 5,5 %; en el oeste 24,6 % contra 11,3 %; en el sur cercano
   29,1 % contra 13,7 %. Hacia 1910 el arrabal y el sur cercano coinciden con los datos (porque los datos
   subieron), pero las orillas siguen arriba (15,5 % contra 9,1 %).
5. **1867 en el centro: alto.** El visor da 46,2 % de frentes de dos pisos y 7,5 % de tres; el censo de 1869,
   27,2 % y 4,2 % (promedio 1,61 contra 1,36). En el anillo, 29,1 % contra 9,8 %. El visor de 1867 se parece
   al censo de 1887. Vale la salvedad del censo de 1869 dicha arriba.
6. **La Boca**: el visor no la distingue (19 % de dos pisos); los censos dan 41 a 58 %.
7. **Norte lejano y oeste desde 1905**: bajos (el Pilar: 1,20 contra 1,43 en 1910; Balvanera: 1,28 contra
   1,44), y sin casas de 3 niveles (0,4 % y 1,3 % contra 5 %).
8. **1940**: no hay dato para juzgarlo. El centro y el anillo del visor (46,6 % y 36,3 % de frentes de 5 o
   más; promedios 4,39 y 3,60) caen dentro de lo que da el supuesto (40 % y 28 %; 4,36 y 3,54). El norte
   cercano queda bajo (2,13 contra 3,3) por lo mismo que en el punto 1. El tope de 9 pisos es bajo para las
   avenidas de 1940, pero las torres de 38 a 54 m lo compensan en parte.

Donde el visor ya coincide con los datos: el centro en 1888 (43,7 / 46,6 / 9,8 contra 46,2 / 44,3 / 8,5 / 1,1)
y en 1895 (41,6 / 44,5 / 10,7 / 2,0 / 1,2 contra 41,7 / 45,3 y 13,1 de 3 o más), el norte cercano y el lejano
en 1895, el sur cercano de 1905 a 1921, y el arrabal en 1910 y 1921.
