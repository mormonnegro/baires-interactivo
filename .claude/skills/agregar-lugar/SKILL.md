---
name: agregar-lugar
description: Agregar, maquetar o modelar un lugar en el visor de Buenos Aires (un edificio, una plaza, un estadio, un monumento, un puente, un mercado, una estación), en los años en que existió, con su marca, su ficha y su foto. Usalo cuando pidan «agregá tal lugar», «sumá el edificio X», «falta la plaza Y», «hacé el estadio Z», o cuando elijan algo de PENDIENTES.md. También para corregir un lugar que ya está.
---

# Agregar un lugar al visor

Vas a sumar un lugar hecho a mano: un archivo en `src/lugares/`, su marca, su ficha y, si hay, su foto. Al final
corre una revisión automática que tiene que dar todo bien, y el aporte se manda como pedido (pull request): lo
acepta solo el dueño, `@mormonnegro`.

Las reglas del repositorio están en `CLAUDE.md` y valen todas. La que más se rompe: **no inventar**. Un lugar con
tres datos ciertos y el resto dicho como supuesto entra; uno con un año inventado, no.

Seguí los pasos en orden. Los archivos de apoyo de esta carpeta:
- `fuentes.md`: dónde buscar cada dato y cómo bajar cosas sin riesgo.
- `plantilla-lugar.js`: el esqueleto de un archivo de lugar, para copiar.
- `fallas.md`: qué hacer con cada control de la revisión que falle.

## 0. Antes de empezar

```
npm install                 # si no hay node_modules
git checkout -b lugar/<nombre-corto>     # nunca sobre main
```

Leé `src/lugares/LEEME.md` entero (las piezas, los ejes, las etapas) y mirá dos lugares que ya están:
`src/lugares/teatro-colon.js` (un edificio, con su `LUGAR` declarado) y `src/lugares/cabildo.js` (uno que cambia
cuatro veces). Para un estadio, un hospital o un mercado, `src/lugares/barrios.js`. Fijate si el lugar ya está:
`grep -i "<nombre>" src/marcas.js src/fichas.js PENDIENTES.md`.

## 1. Preguntar lo mínimo

Dos cosas, y solo si no las dijeron:
1. **Qué lugar es**, si el nombre es ambiguo (hubo dos Teatro Colón; «la cancha de River» fueron cuatro).
2. **Si la persona tiene fuentes o fotos** propias (un libro, un plano, una foto de familia con fecha).

No preguntes lo que podés averiguar (años, dirección, forma), ni pidas permiso para cada paso. Si no hay con quién
hablar, seguí con lo que haya y dejá las dudas anotadas en `supuestos`.

## 2. Investigar

Hay que salir de este paso con una tabla así, **cada renglón con su fuente** (la página, y qué dice):

| Qué | Ejemplo |
|---|---|
| Años | empezó la obra, se inauguró, cambió (reformas, ampliaciones), se demolió |
| Dirección de hoy | calle y altura, o la esquina; entre qué calles |
| Planta | cuánto mide de frente y de fondo, si ocupa la manzana entera, hacia dónde mira |
| Alzado | cuántos pisos, altura si se sabe, cómo termina arriba (cúpula, mansarda, torre, azotea) |
| Materiales y color | ladrillo, símil piedra, hierro, madera; claro u oscuro |
| Fotos de época | cuáles hay, de cuándo, con qué licencia, qué lado muestran |

`fuentes.md` dice dónde se busca cada cosa. Lo corto:
- **Años, autores, dirección**: el artículo de Wikipedia en español y, para cruzar, otra fuente (Wikipedia en otro
  idioma no cuenta como segunda: suelen copiarse). Anotá la fecha en que lo consultaste.
- **La forma**: fotos fechadas de Wikimedia Commons. Lo que se ve en una foto fechada es dato; lo que no se ve, no.
- **La planta y el lugar**: el mapa de hoy si el edificio sigue en pie (`fuentes/osm/`, `src/edificios.js`); si no,
  la foto aérea de 1940, que la revisión te pone en la hoja.

Cuando las fuentes **se contradicen** (dos años de inauguración): no elijas. Buscá una tercera; si no aparece, la
ficha lo dice («Commons la fecha en 1883, pero el arco se tiró en agosto de ese año»: mirá cómo lo hace el pie de
`recova-demolicion` en `src/fichas.js`). Cuando **no hay** fuente de algo: es un supuesto y va a `supuestos`. Si lo
que falta es lo esencial —dónde estaba, o de cuándo es—, el lugar no se hace: se anota en `PENDIENTES.md` qué
habría que averiguar y se le dice a la persona.

## 3. Ubicar

**Nunca pongas coordenadas de memoria**, ni las tuyas ni las de un artículo sin comprobar. Ya pasó que un edificio
quedó a 400 metros. Hacen falta dos fuentes que no dependan una de la otra:

```
node tools/esquina.mjs --calle "Pellegr"                      # cómo se llama la calle en el mapa de hoy
node tools/esquina.mjs "Carlos Pellegrini" "Sarmiento"        # la esquina → píxeles del plano y metros del mundo
node tools/esquina.mjs --punto -34.6037 -58.3816              # una latitud y longitud → lo mismo
```

- La primera fuente: **las esquinas** de la manzana (las cuatro, si ocupa la manzana: dan la planta y el rumbo).
  `esquina.mjs` da el cruce de los ejes de las calles: la vereda está 6 a 10 metros adentro.
- La segunda: **una latitud y longitud** de otro lado (la del artículo, la de OpenStreetMap), pasada con `--punto`.
  Ojo con lo que se mudó: las coordenadas del artículo son las de donde está hoy.
- Tienen que caer a menos de una cuadra una de la otra. Si no, una está mal: averiguá cuál antes de seguir.
- La tercera, contra lo que ya hay: mirá qué pone el visor en ese punto (paso 5, «mirar antes») y qué marcas hay
  cerca (`grep` de los números en `src/marcas.js`).
- **Si el lugar ya no existe y nadie da sus coordenadas** (algo demolido o mudado hace un siglo), no las inventes:
  declarás solo la `esquina`, y como segunda fuente usás un vecino que siga en pie y salga en las fotos de época
  (su dirección o sus coordenadas, con `--punto`), anotado en `fuentes`. La revisión va a dejar un aviso («una
  sola fuente»): es lo esperado, y se cuenta en el pedido. El punto exacto queda dicho como supuesto.
- Si una calle no aparece (`no hay calle…`), cambió de nombre: `--calle` con un pedazo del nombre, o probá con la
  calle de al lado.

Las cuentas: el plano de 1867 está escaneado a 0,675 m por píxel. En el plano, **x crece hacia el norte e y hacia
el río** (el este). En el mundo del visor, en metros desde la Plaza de Mayo:
`x = (px − 10335) · 0,675` hacia el norte y `z = (py − 9485) · 0,675` hacia el río.
Adentro de un lugar, `T.aPlano(x, z)` y `T.deMundo(px, py)` pasan de un sistema al otro.

Si el lugar cae fuera del plano (más allá de Palermo, de Flores o del Riachuelo), no entra: decilo.

## 4. En qué etapas existe

La línea de tiempo tiene pocas etapas, una por plano de época. **No escribas los años ni los números de etapa de
memoria**: la revisión los lista al arrancar («etapas: 1867, 1888, …») y salen de `public/datos/crece.json`.

- `c.etapaDe(año)` da la primera etapa que ya encuentra hecho algo de ese año. Un edificio de 1908 aparece en la
  etapa de 1910.
- `c.epoca(desde, hasta)`: lo que se construya después existe si `desde <= etapa < hasta` (`hasta` 0: para siempre).

| Caso | Cómo se dice | Ejemplo en el repo |
|---|---|---|
| Se hizo y sigue | `c.epoca(c.etapaDe(1908))` | `src/lugares/teatro-colon.js` (por `c.obra`) |
| Se hizo y se demolió | `c.epoca(c.etapaDe(1920), c.etapaDe(1937))` | Sportivo Barracas, en `src/barrios.js` |
| Cambia de forma | un bloque por estado, cada uno con su `c.epoca(a, b)`, sin huecos ni encimados | `src/lugares/cabildo.js` |
| En obra durante una etapa | un bloque «en obra» (andamios, el esqueleto) y después el terminado | la Facultad de Derecho en `src/lugares/barrios.js` |
| Está desde antes de 1867 | `c.epoca(0, …)` | la Pirámide, en `src/hitos.js` |

Tres trampas:
- Un lugar que **nace y se va entre dos etapas** no se ve nunca: no entra (como la cancha de River de Alvear y
  Tagle, 1923-1938). Se anota en `PENDIENTES.md`.
- `c.etapaDe()` de un año **posterior a la última etapa** da 0, que es «desde 1867». Si el lugar es más nuevo que
  el último plano, no entra todavía.
- Las **marcas** (`src/marcas.js`) llevan números de etapa, no años: tienen que ser los mismos que en `c.epoca()`.

## 5. Modelar

**Mirar antes.** Sacá una captura de lo que hay hoy en ese lugar, en el año en que llega el tuyo:

```
export CHROME="$(node tools/revisar-lugar.mjs --chrome)"
node tools/shot.mjs --puerto 5478 --query color --serie '[{"name":"antes","año":1940,"ver":{"x":350,"z":-640,"dist":320,"yaw":0,"pitch":1.57}}]'
```
(`x`, `z`: los metros del mundo que te dio `esquina.mjs`; sale en `shots/antes.png`, visto de arriba con el oeste
arriba, como el plano. La cámara no se acerca a menos de 170 metros: con un `dist` más chico sale igual de lejos.
Una calle o una plaza seca casi no se distinguen del papel: que se vea liso no quiere decir que no haya nada.)

**Un archivo nuevo** en `src/lugares/<nombre-con-guiones>.js`, copiado de `plantilla-lugar.js`, salvo que el lugar
sea un detalle de uno que ya está y dure lo mismo que él (un banco, un cantero: va en el archivo de la plaza). Lo
que tiene sus propios años, su marca y su ficha —una fuente que estuvo quince años en una plazoleta, un monumento—
va en archivo aparte aunque esté dentro de una plaza ya hecha: así la revisión lo mira solo y no se toca lo ajeno. Se registra en
`src/hitos.js` con dos cambios y nada más: el `import` junto a los otros, y el nombre **al final** de la lista
`const LUGARES = { … }`. En el medio, les cambia los colores a todos los lugares que siguen, y la revisión lo nota.

**Empezá por una caja.** Poné el volumen principal con una sola `T.caja`, corré la revisión (paso 7) y mirá en la
hoja si cae donde tiene que caer contra la foto aérea de 1940. Recién entonces el detalle.

**Con las piezas del proyecto**, no con geometría propia: `T.caja`, `T.cilindro`, `T.cupula`, `T.tejado`,
`T.mansarda`, `T.prisma`, `T.fila` (ventanas pintadas), `T.tapete` y `T.cantero` (el suelo), `T.arbol`. Los
materiales: `c.CASA` (pared con ventanas solas), `c.PIEDRA` (liso), `c.PIZARRA` (techos), `c.TINTA` (hierro) y
`c.PINTADO` con un color de `c.PINTA`. Los tonos de pared: `c.BLANCO`, `c.CREMA`, `c.ROSA`, `c.GRIS`, `c.LADRILLO`,
`c.SILLAR`. Todo está explicado en `src/lugares/LEEME.md`. Si falta un color, usá el más parecido y anotalo: no
toques `src/tinta.js`.

**El nivel de detalle.** El visor se mira desde arriba y de lejos, como una vista a vuelo de pájaro. Vale la pena:
el volumen justo, el techo y cómo termina (cúpula, torre, mansarda), los cuerpos que salen o se meten, los arcos y
las filas de ventanas de los frentes, un pórtico, una chimenea. No vale la pena: interiores, molduras, balcones uno
por uno, rejas finas, nada de menos de medio metro. Lo que la foto no muestra va «simple y parejo» (el
contrafrente liso, el otro costado igual al que se ve) y se anota como supuesto.

**El cupo.** Un `edificio` suelto, hasta 25.000 puntos; un `conjunto` (plaza, parque, estadio), hasta 90.000. Lo que
más pesa: las cúpulas y los cilindros de muchos lados (con 6 u 8 alcanza), los `T.tapete` grandes y lo que se repite
en un `for`. Lo que va apilado a ras del suelo, separado por lo menos 20 cm en altura, o titila.

**El azar**, si hace falta (árboles sueltos, lotes), con una tirada fija propia, nunca `Math.random()`: el lugar
tiene que salir siempre igual (mirá `R()` en `src/lugares/barrios.js`).

**Si hay casas donde va el lugar.** La ciudad de cada año la levanta un generador, y donde hoy pone casas las va a
seguir poniendo, encimadas con tu modelo. Despejar un solar se hace en `SITIOS` (`src/barrios.js`) y exige volver a
generar la ciudad con archivos que no están en el repositorio: **lo hace el dueño**. Vos no toques `src/barrios.js`
ni `tools/crece.mjs`: dejalo pedido en `solar:` de tu `LUGAR` (las cuatro esquinas en píxeles del plano y desde
qué año) y en el pedido. La hoja va a mostrar las casas encimadas: es lo esperado, decilo. Si el lugar va sobre
una plaza, una calle, el río o un terreno vacío, no hace falta nada.

**La declaración.** Completá `export const LUGAR = { … }` (el formato está en `src/lugares/LEEME.md`): nombre,
clase, años, esquina y coordenadas, marcas, fuentes y supuestos. Y arriba del archivo, el comentario que cuenta de
qué foto sale cada cosa y qué es a ojo, como en `teatro-colon.js`.

## 6. Marca, ficha y foto

**La marca** (`src/marcas.js`, lista `LUGARES`; agregala al lado de la marca más cercana que ya haya; si no hay ninguna cerca, al final de la lista):

```js
['Mercado Spinetto', 9949, 5861, 12, 2, 'El mercado de Pichincha y Alsina, de 1894.', { desde: 2, radio: 56 }],
```
nombre · x, y en píxeles del plano (sobre lo más alto del lugar) · el alto en metros donde se apoya la etiqueta ·
nivel (1: barrios y plazas grandes; 2: edificios; 3: lo chico, que se rotula de cerca) · una nota de **una
oración** · `{ desde, hasta }` en etapas, `radio` (cuántos metros cuentan como tocarlo), `velo: 'suelo'` si es
suelo y no edificio, `ficha: '…'` si la clave de la ficha no es el nombre. Si tu lugar reemplaza a otro que tiene
marca, cortale la época a esa (`hasta`) en la etapa en que llega el tuyo, y contalo en el pedido.

Si ya hay una marca con ese nombre en otro sitio o de otra época (el Teatro Colón de 1857 y el de 1908; una fuente
antes y después de mudarse), la tuya lleva **el mismo nombre** y una ficha aparte: `ficha: 'Nombre (año)'` en la
marca, y esa clave en `FICHAS`, con `titulo: 'Nombre'`. Mirá cómo está hecho «Teatro Colón».

**La ficha** (`src/fichas.js`, en `FICHAS`, con la misma clave que el nombre de la marca):

```js
'Cancha de Huracán': {
  era: 'La cancha de Huracán en Parque Patricios, de madera. De 1924 a 1942.',
  texto: [
    'Huracán se mudó a Amancio Alcorta y Luna en 1924. Las tribunas eran de madera y daban toda la vuelta…',
    'La desarmaron desde 1942 para levantar en el mismo lugar el estadio de hormigón, que se inauguró en 1949.',
    'El alto y el fondo de las tribunas son supuestos.',
  ],
  hoyEs: 'el estadio Tomás Adolfo Ducó.',
  fotos: ['barrios-huracan'],
  por: '@tu-usuario',
},
```
- `era`: una línea, qué es y de cuándo (hasta 130 letras).
- `texto`: dos o tres párrafos cortos, entre 150 y 1.100 letras en total. Primero qué era y quién lo hizo, con sus
  años; después qué le pasó; **al final, qué es supuesto**, con todas las letras.
- `hoyEs`: qué hay hoy ahí, en minúscula y sin sujeto («un supermercado desde 1985»).
- `por`: el usuario de GitHub de quien lo aporta (preguntáselo; si no lo sabés, `git config user.name` no sirve:
  dejalo sin poner y avisá). Es el crédito que se ve: «Maquetado por @usuario».
- El tono: leé antes «El Gasómetro», «Sportivo Barracas» y «Penitenciaría Nacional» en `src/fichas.js`. Oraciones
  cortas, el dato concreto, ningún adjetivo de folleto, comillas «así».

**La foto**, si hay una de dominio público o con licencia libre:

```
node tools/foto-commons.mjs "Título exacto del archivo en Commons.jpg" <nombre-corto>
node tools/fotos.mjs
```
El primero la baja a `fuentes/fotos/` con su `.json` de procedencia (autor, fecha, licencia, dirección: los toma de
Commons, no los escribas a mano) y se niega si la licencia no es libre. El segundo la prepara para el sitio y
actualiza `src/fotos.json`. Después: **mirá la foto** (que sea ese lugar y esa época), poné su pie en `PIES`
(`src/fichas.js`: qué se ve, de quién es y de cuándo; si la fecha de Commons no cierra con lo que se ve, el pie da
la que sale de la foto y lo anota) y su nombre en `fotos` de la ficha. Si `git status` muestra que cambiaron fotos
ajenas en `public/fotos/`, devolvelas (`git checkout -- <archivo>`): solo tienen que entrar las tuyas. Si la foto
no es de Commons, armá el `.json` a mano con los mismos campos y la dirección de la página de donde salió.

Si no hay foto libre: la ficha va sin `fotos` y se anota en `PENDIENTES.md`, en «Fotos que faltan».

## 7. Verificar

```
npm run revisar -- <clave>          # la clave es el nombre con que lo importaste en src/hitos.js
```
Compara contra `main`. Si saliste de otra rama, o si avisa que la base está vieja, traé lo último (`git fetch
origin`) o decile de cuál saliste: `npm run revisar -- <clave> --base <rama>`. Si fallan «No cambia nada fuera de
su entorno» o «Toca solo lo suyo» con archivos que no tocaste, es esto: no cambies nada para que pasen.
Tarda un minuto o dos. Deja:
- `revision/<clave>.jpg`: **la hoja**. El lugar en cada etapa en que aparece, cambia o se va (y la anterior, para
  ver qué había), de costado en color, de arriba en color y en tinta; al lado, la foto aérea de 1940 en el mismo
  encuadre que la vista de arriba —con un recuadro rojo donde está el lugar y una cruz azul en la dirección que
  declara— y las fotos de la ficha.
- `revision/<clave>.md`: la lista de controles, para pegar en el pedido.

**Abrí la hoja y mirala** (con la herramienta de leer imágenes). No alcanza con que los controles pasen:
- ¿El recuadro rojo cae sobre el edificio en la foto aérea de 1940, con su mismo tamaño y su mismo rumbo? (Si el
  lugar ya no estaba en 1940 o todavía no estaba, compará con las calles.)
- ¿Se parece a la foto de época? El volumen, el techo, la torre, cuántos pisos.
- ¿En la etapa «todavía no» hay lo que tenía que haber, y en «ya no está» se fue todo?
- ¿En tinta se lee? (Lo oscuro sobre oscuro se pierde.)
- ¿Algo flota, se entierra, titila o atraviesa al vecino?

Si un control falla, `fallas.md` dice qué hacer con cada uno. Corregí y volvé a correr hasta que dé **todo bien**.
Los avisos (⚠) no frenan, pero cada uno se explica en el pedido. Nunca «arregles» un control cambiando el dato para
que pase: si la dirección declarada queda lejos, o el lugar está mal puesto o la dirección está mal, y hay que
saber cuál.

Sin navegador (`--sin-navegador`) corre igual lo demás; sin red, la hoja sale sin la foto aérea.

## 8. Entregar

1. `PENDIENTES.md`: sacá el lugar de la lista (o dejá anotado lo que quedó sin hacer: la foto, el solar).
2. `git status`: que estén solo tus archivos (`src/lugares/…`, `src/hitos.js`, `src/marcas.js`, `src/fichas.js`,
   y si hay foto `src/fotos.json`, `fuentes/fotos/…`, `public/fotos/…`). La carpeta `revision/` no se sube.
3. El commit, con un título en español que diga qué se ve ahora en el visor, como los de `git log`:
   «El Puente Pueyrredón de tal año», «La Plaza Colón, con su marca y su ficha».
   En el cuerpo, dos o tres líneas: de dónde salen los datos y qué es supuesto.
4. Subí la rama a **tu copia** (fork) del repositorio y abrí el pedido contra `main` de
   `mormonnegro/baires-interactivo`. La plantilla (`.github/PULL_REQUEST_TEMPLATE.md`) pide: qué lugar y qué años,
   las fuentes, **la hoja** (`revision/<clave>.jpg`, arrastrada al texto del pedido), el resumen
   (`revision/<clave>.md`, pegado), qué es supuesto y si hace falta despejar un solar.
5. No publiques nada ni toques `main`. Si no tenés permiso para subir, dejá la rama lista y decile a la persona
   qué comandos correr.

Al terminar, contale a la persona en tres líneas: qué quedó hecho, qué es supuesto y qué quedó pendiente, y
mostrale la hoja.
