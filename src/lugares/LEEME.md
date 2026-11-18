# Los lugares hechos a mano

Cada archivo de esta carpeta arma un lugar (una plaza, una avenida, el puerto, un grupo de edificios) con piezas
sueltas, como los edificios de `src/hitos.js`, y lo hace aparecer o irse con la línea de tiempo. `src/hitos.js` los
llama uno por uno al final de `createHitos` y les pasa sus herramientas:

```js
export default function (c) {
  const T = c.lugar(px, py, ux, uy); // un lugar: el origen en un punto del plano (píxeles del plano de 1867) y hacia dónde apunta su x
  c.epoca(4);                        // lo que sigue existe desde la etapa 4 (1910)…
  T.cantero(T.recto(60, 40, 0, 0, 8));
  c.epoca(4, 6);                     // …y esto, desde la 4 hasta que llega la 6 (se va en 1940)
  T.caja(2, 4, 2, 0, 0.3, 0);
  c.epoca(0);                        // (al terminar no hace falta: hitos.js lo repone)
}
```

## Las medidas y los ejes

- Las etapas: 0 es 1867, 1 es 1888, 2 es 1895, 3 es 1905, 4 es 1910, 5 es 1921, 6 es 1940 y 7 es 1950. `c.etapaDe(1914)` da la
  primera etapa que ya encuentra hecho algo de ese año (5). `c.epoca(desde, hasta)`: existe si desde <= etapa < hasta
  (hasta 0: para siempre).
- El plano: píxeles del escaneo de 1867, 0,675 m por píxel. **x crece hacia el norte, y hacia el río (el este).** La
  Pirámide de 1867 está en [10344, 9484]. `node tools/esquina.mjs "Calle A" "Calle B"` da una esquina de hoy en
  píxeles del plano (y `--calle texto` lista los nombres; `--punto lat lon` pasa una coordenada).
- `c.lugar(px, py, ux, uy)`: sin rumbo, el x del lugar va a lo largo de la grilla de la ciudad (hacia el norte, apenas
  girado: unos grados) y el z a su derecha (hacia el río). Con `(ux, uy)` (un vector en el plano), el x apunta ahí.
  Adentro todo va en metros: `x`, `z` en el suelo, `y` hacia arriba.
- `T.aPlano(x, z)` y `T.deMundo(px, py)` pasan de metros del lugar a píxeles del plano y al revés.
- El mundo (para las capturas): metros desde la plaza, x = (px − 10335)·0,675 hacia el norte, z = (py − 9485)·0,675
  hacia el río.

## Las piezas (`T.…`)

Las de siempre, de `src/hitos.js` (mirá ahí cómo se usan; el `kind` es de qué está hecha):

- `caja(w, h, d, x, y, z, kind = PIEDRA, o)` · `cilindro(r, h, x, y, z, kind, lados, r2, o)` · `cupula(r, x, y, z, alto, kind, o)`
  · `piramide(r, h, x, y, z, kind, lados, o)` · `tejado(w, d, h, x, y, z, 'x' | 'z', kind, curvo)` ·
  `cuatroAguas(w, d, h, x, y, z, kind)` · `mansarda(w, d, h, x, y, z, mete, kind)` ·
  `prisma(pts, h, y, kind, o)` (una planta cualquiera, levantada) · `portada(...)` (un muro con un arco abierto) ·
  `vano(w, h, x, y, z, cara, arco)` y `fila(n, a, b, w, h, y, fijo, cara, arco)` (puertas y ventanas pintadas de tinta
  sobre una pared; cara: `'+x'`, `'-x'`, `'+z'`, `'-z'`) · `pilares(n, x0, z0, x1, z1, y, lado, alto)` ·
  `put(geometria, kind, o)` (cualquier `THREE.BufferGeometry`, ya en metros del lugar).
- `kind`: `c.PIEDRA` (liso, claro), `c.CASA` (pared con ventanas y puertas solas: `o.floors` = pisos, 0 = los que
  entren a 3,3 m), `c.PIZARRA` (techos, cúpulas), `c.TINTA` (hierro, negro), `c.FOLLAJE` (verde de árbol: palmeras,
  cercos, arbustos armados a mano) y `c.PINTADO` (un color parejo: `o.pinta = [c.PINTA.BRONCE, 0.3]`; el segundo
  número es qué tan claro sale en el modo tinta, de 0 a 1).
- `o.tono` (para `CASA` y `PIEDRA`): `c.BLANCO`, `c.CREMA`, `c.ROSA`, `c.GRIS`, `c.LADRILLO`, `c.SILLAR`.
- `c.PINTA`: `MADERA, VERDE, BRONCE, ROJO, OCRE, LONA, BALASTO, CESPED, AGUA, BALDOSA, GRANZA` (el polvo de ladrillo de
  los senderos), `ADOQUIN, FLORES, ASFALTO, CHAPA, NEGRO, BLANCO, LADRILLO, PATINA` (el bronce oscuro de las estatuas), `COBRE` (el verde de las cúpulas de cobre). Si falta un color, no toques
  `src/tinta.js`: usá el más parecido y dejalo anotado.
- `c.obra(clave, tono)`: las herramientas en el lugar de un edificio de `src/edificios.js` (con `cuerpo`, `liso`,
  `pabellon`, `columnas`), como los once que ya están en `src/hitos.js`. Pone sola la etapa según el año.

Las nuevas, para el suelo (van en una malla aparte: siguen el terreno punto por punto, no hacen sombra y a pie no
se chocan):

- `T.tapete(pts, tono, { y = 0.1, claro = 0.82 })`: un paño a ras del suelo con la planta que digan los puntos
  `[x, z]`, pintado de `c.PINTA.…`. Para los solados, los senderos, las calzadas, el agua.
- `T.cantero(pts, { alto = 0.28, tono = c.PINTA.CESPED, cordon = 0.45, claro })`: el cordón de piedra y adentro el
  césped (o agua, o flores). Para una fuente: un cantero alto con `tono: c.PINTA.AGUA`.
- `T.recto(w, d, x, z, r)` (un rectángulo, con las puntas redondeadas si r > 0) y `T.ovalo(x, z, rx, rz, n)` dan los
  puntos; `c.adentro(pts, d)` corre un polígono hacia adentro.
- `T.arbol(x, z, r = 3.2)`: un árbol como los del plano, que nace y se va con la etapa en curso (`c.epoca`).
- Lo que se apile a ras del suelo tiene que estar separado por lo menos 20 cm en altura (un solado en y 0,05 y los
  canteros arriba, por ejemplo): más cerca, de lejos titila.

## Las tiras largas: vías, alamedas

`T.tapete` está pensado para paños (parte los triángulos largos hasta que ninguno pase de 14 m): con una tira de
cientos de metros y dos o tres de ancho —una vía, un cordón de césped— da triángulos finísimos que al partirse se
multiplican por miles, y la página se queda sin memoria. Para eso `puerto-madero.js` arma la tira a mano, un paño por
tramo cada 12 m o menos, y la manda a la malla del suelo con `T.put(geo, c.PINTADO, { pinta: [tono, claro], raso:
true })` (sus `curva`, `tira` y `via`: la cama de balasto a 0,1 m y los dos rieles a 0,31 m). Si otro lugar las
necesita, conviene pasarlas a `src/hitos.js` en vez de copiarlas.

`ferro.js` trae esas mismas piezas sueltas del marco de `puerto-madero.js` (que conserva las suyas: todo lo de ese
archivo sale de una sola tirada y no conviene tocarlo), para cualquier lugar: `const F = ferro(c, al)` da `curva`,
`corrida`, `largo`, `tira(T, pts, ancho, tono, y, claro)`, `via(T, pts, cama)`, `corte` y `cortes(T, A, B, cuanto,
loco)` (los vagones, de la tirada `al` del lugar que las usa), `techo(w, d, h)` y `nave(T, x, z, ux, uz, w, d, h, {…})`
(un galpón a dos aguas, o en serrucho). Las usa `playas-retiro.js`, que arma con ellas las playas de vías de Retiro,
la vía del Puerto Nuevo y la Costanera Norte. Ese lugar va último en la lista `LUGARES` de `src/hitos.js`: cada pieza
que se agrega gasta una tirada, y uno nuevo en el medio le cambia los colores a los que siguen.

`palermo.js` (los parques de Palermo) va después de ese, por lo mismo; sus datos están en `src/palermo.js`, que arma
`node tools/palermo.mjs` (hay que correrlo antes de `tools/crece.mjs` si cambian los contornos).

Lo que ese lugar necesita del suelo está en `src/playas-retiro.js` (lo leen también `tools/crece.mjs` y
`tools/costanera.mjs`): la zona donde no se pintan las calles de hoy, las avenidas de época con su etapa, la orilla
de 1940 y los contornos de los parques. Si cambia algo de eso: `tools/crece.mjs` y después `node tools/costanera.mjs`
(que reparte los árboles de los parques en `costanera-arboles.js`).

`plaza-colon.js` (la Plaza Colón y el Parque Colón, detrás de la Casa de Gobierno) va después, último; lo que necesita
del suelo está en `src/plaza-colon.js`, que lee también `tools/crece.mjs`: la zona donde no se pintan las calles de
hoy, y las calzadas de época (el Paseo Colón, Espora, Rosales, la calle en U) con su eje, su ancho y su etapa. Salió
de `puerto-madero.js`: para que a lo que queda ahí no le cambien los lotes ni los colores, en el lugar de cada pieza
que se sacó quedaron repuestas a mano la tirada del archivo (`azar`) y la de los colores (`c.tirada`, que se puede
leer y escribir). Es el recurso para sacar piezas del medio de un lugar sin mover lo que sigue.

`puerto-madero.js` trabaja además en un solo marco para toda la zona (x a lo largo de los diques, z hacia el río) y
llena las manzanas con `manzana([px0, py0, px1, py1], desde, lleno)`: lotes al azar —con una tirada fija, siempre la
misma— sobre el rectángulo libre que dejan las calles pintadas. Los rectángulos están medidos sobre el suelo y las
casas que ya había: si cambian las calles del bajo en `tools/crece.mjs`, hay que volver a medirlos. Las manzanas que
no van derechas (los depósitos de Alem, hacia el Retiro) se arman con `bloque(c.lugar(px, py, ux, uy), largo, fondo,
desde, lleno)`, que es lo mismo con el marco girado. Lo que se agregue va al final del archivo: todo sale de una sola
tirada, y una manzana nueva en el medio le cambia los lotes a las que siguen.

`obras-1950.js` (lo que trae la etapa de 1950: edificios públicos, el estadio de Huracán, la obra del Mercado del
Plata y los paños de pavimento de la 9 de Julio y de Córdoba) va después, último. Sus solares están al final de
`SITIOS`, en `src/barrios.js`, con la etapa 7: `tools/crece.mjs` los despeja recién en 1950 y no cambia nada de las
etapas anteriores. Lo que un lugar anterior mostraba en 1940 y cambia en 1950 se cierra en su archivo con
`c.epoca(6, 7)` (la obra del Ministerio de Guerra en `plaza-colon.js`) o con `hasta: 7` en `SITIOS` (la cancha de
madera de Huracán), sin sacar piezas.

## Los carteles con letras

No hay texturas: las letras son geometría. `obelisco-1940.js` trae un alfabeto de trazos (`TRAZOS`: A–Z y 0–9 sobre
una grilla de 6 de alto) y `letras(T, 'TEXTO', x, y, z, cara, alto, { kind, o, grueso, sep, doble, vertical, inclina,
curva })`, que arma cada trazo con paños planos, centrado en `x, z` y mirando hacia `cara` (`[nx, nz]`, la normal
del cartel). `vertical` apila las letras, `inclina` las pone en cursiva, `curva` las dobla sobre un cilindro y
`doble` las repite de espaldas. Todavía no está entre las herramientas de `c`: si otro lugar las necesita, conviene
pasarlas a `src/hitos.js` en vez de copiarlas. Para que se lean en tinta y en color van en `c.TINTA` sobre un tablero
claro, o en `c.PINTADO` blanco (`claro` cerca de 1) sobre un tablero negro (`c.PINTA.NEGRO`, `claro` 0,24). Una
marquesina o un cartel que vuele sobre la vereda a 2,5 m o más con la cara de arriba plana cuenta como techo y frena
al que camina o maneja por abajo (`src/modos.js`): que no pase del cordón.

## Lo que no hace falta tocar

El suelo pintado (las calles, el pasto, el río: `tools/crece.mjs` y `src/tinta.js`), las casas que se levantan solas y
las vías. Si un lugar necesita que cambie algo de eso (que se despeje una manzana, que una calle no esté), se anota y
lo hace quien lleva esos archivos.

Un solar que se despeja para un edificio o una plaza de una etapa tardía conviene anotarlo en `tools/crece.mjs` como
obra «tardía» (`tarde: true` en `avenida()` y `plaza()`, o la clave del edificio en la lista `TARDE`): así las casas
que había antes en ese lugar se levantan y se renuevan como siempre en las etapas anteriores y se van recién cuando
llega la obra. Sin eso, las casas inventadas de ese lugar no se levantan nunca y las de 1867 no se renuevan. Si la
obra tardía trae calzada (una avenida), el punto donde desemboca en una calle que ya estaba no entra en la lámina de
las calles —para que esa calle no cambie antes de tiempo—: esa boca se pinta a mano, con un `T.tapete` de asfalto
que nace con la obra (ver el final de `obelisco-1940.js`).
