# Lo que falta

Lugares, marcas y fotos que el visor todavía no tiene, para que cada uno elija. Están ordenados por el año en que
aparecerían. De cada uno va **lo que ya se sabe** (lo que dice el propio repositorio, con el archivo donde está) y
**lo que hay que averiguar**. Lo que acá no figura como sabido, no se sabe: hay que buscarlo con su fuente, no
suponerlo.

Cómo se aporta: `CONTRIBUIR.md`. Antes de empezar uno, reservalo con un issue («Proponer un lugar»), para que no lo
hagan dos: `COORDINAR.md` dice cómo.
Cuando esté hecho, se saca de esta lista en el mismo pedido.

Las marcas de dificultad son orientativas: 🟢 chico y con fuentes a mano · 🟡 mediano · 🔴 grande, o pide que el dueño
despeje un solar o cambie el suelo.

## Lugares

### Desde el plano de 1867

- 🔴 **Las iglesias con el frente genérico.** San Juan, Monserrat, La Piedad, La Concepción y San Telmo salen con una
  torre de molde porque no se encontró una foto confiable; San Ignacio, San Francisco y Santo Domingo llevan sus
  torres y su cúpula, pero el frente es el de molde (`LEEME.md`, «Lo que falta»; las iglesias se arman en
  `src/hitos.js`, no en `src/lugares/`). *Averiguar*: una foto de época de dominio público de cada una. Ojo: tocan
  `src/hitos.js`, así que conviene hablarlo antes en un issue.
- 🔴 **Estaciones y mercados de 1867 sin modelo propio**: la Estación del Parque de madera, la Estación Central (queda
  una casilla), la Estación del Sud y el edificio de arcos del Mercado de Constitución que asoma en la foto de
  Gonnet (`LEEME.md`, «Lo que falta»). *Averiguar*: una imagen de cómo eran en 1867 y, del edificio de arcos, dónde
  estaba.

### Hacia 1895–1910

- 🟡 **El trazado de Thays del Parque Lezama.** El parque es público desde 1894 y en el visor sigue con el dibujo de la
  quinta de 1867 (lo dice su ficha, `src/fichas.js`, «Parque Lezama»; tiene marca y una foto, `barrios-lezama`).
  *Averiguar*: de qué año es el trazado, un plano o una foto aérea que lo muestre (senderos, escalinatas, el
  anfiteatro, las estatuas con sus años) y qué había en cada etapa. Es suelo y árboles: puede hacer falta que el
  dueño saque los árboles de la quinta.
- 🟢 **Los árboles del cantero de la Fuente de las Nereidas (1905 y 1910).** La fuente ya está en su primer lugar
  (`src/lugares/nereidas-1903.js`), pero el cantero va pelado, y en las fotos de la ficha está lleno de árboles.
  No se pusieron porque, con árboles propios, `npm run revisar` mide mal el lugar (el comentario del archivo dice
  por qué). *Averiguar*: dónde iban, con una foto que muestre el cantero entero.
- 🟡 **Las terrazas y escalinatas de la Plaza Colón, de 1911.** `src/lugares/plaza-colon.js` dice que no están.
  *Averiguar*: cómo eran (una foto o un plano), dónde iban respecto de la Casa de Gobierno y hasta cuándo duraron.
- 🟢 **La marca y la ficha de la Plaza Colón.** La plaza y el Parque Colón están modelados
  (`src/lugares/plaza-colon.js`), pero no tienen marca en `src/marcas.js` ni ficha en `src/fichas.js`. *Averiguar*:
  los años de la plaza y del monumento a Colón, con su fuente (el comentario del archivo cita las fotos que usó).
  No hay que modelar nada.

### Hacia 1921–1940

- 🔴 **El Mercado del Plata**, en Carlos Pellegrini, entre Perón y Sarmiento. *Averiguar*: de qué año era el mercado
  viejo, cómo era (fotos), qué planta ocupaba y cuándo se demolió. Hace falta despejar el solar.
- 🔴 **El Puente Pueyrredón**, sobre el Riachuelo. *Averiguar*: cuál de los puentes que hubo en ese cruce corresponde a
  cada etapa (años de cada uno), cómo era cada uno y dónde apoyaba (el plano de 1867 nombra un «puente de Barracas»: ver
  si es el mismo cruce). Cruza el agua: puede hacer falta que el dueño toque el suelo.

### Los que no entran (y por qué)

- La cancha de River en Alvear y Tagle (1923–1938) y la de tablones de Boca (1924–1938): nacen después del plano
  de 1921 y ya no están en 1940, así que no caen en ninguna etapa (`src/lugares/barrios.js`). Entrarían si algún
  día hay una etapa intermedia.
- El Monumental de River, en Núñez: queda fuera del plano.

## Fotos que faltan

Lugares que están hechos y cuya ficha no tiene ninguna imagen de época. Hace falta una foto **de dominio público o
con licencia libre**, fechada, que muestre el lugar (`node tools/foto-commons.mjs` la baja con su procedencia).
No hay que modelar nada: es el aporte más fácil.

- 🟢 **Sportivo Barracas** (el estadio, 1920–1937).
- 🟢 **La cancha de River en la Dársena Sur** (1915–1923).
- 🟢 **La cancha de GEBA** en Palermo (desde 1902).
- 🟢 **El Teatro Cervantes** (1921).
- 🟢 San Juan, La Piedad, La Concepción y San Telmo (las iglesias).
- 🟢 El Kilómetro Cero, los dos edificios Bencich, el puente giratorio, la usina de la Ítalo y la Galería Güemes: en
  Commons solo se encontraron fotos actuales, con otra licencia, o una de época demasiado chica (`LEEME.md`, «Las
  fichas de los lugares»).
- 🟢 La Confitería del Molino (solo hay fotos de la obra) y el Mercado de Abasto (la que hay es de «hacia 1945»).

## Otras cosas

Están en `LEEME.md`, «Lo que falta»: el agua que el plano dibuja y el visor no (los brazos del bañado de la Boca,
la laguna de Anderson), el relieve de 1867, los nombres de las calles cortas. No son lugares y tocan el generador:
no son para un aporte de lugar.
