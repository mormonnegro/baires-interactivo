# Conteo a ojo de la muestra de evaluación

Hecho por el agente (un modelo de lenguaje que mira imágenes), una sola vez, sobre las láminas de
`paper/medidas/muestra/*-escaneo.png` y `*-visor.png` (444 px del escaneo ampliados ×3, con grilla A1…D4).
No hay segundo observador ni verdad de campo: es una lectura del mismo plano por otro camino (el ojo), no una
comprobación contra la ciudad real. Los recortes se eligieron por regla antes de mirarlos (`muestra.mjs`).

Unidad de conteo: «cuerpo edificado» = cada tramo continuo de rayado cruzado (un frente de manzana entre dos
esquinas, o un edificio suelto) dibujado en el plano. Acierto = el visor le pone techos en más de la mitad de su
largo; parcial = techos con huecos de un cuarto del largo o más; falta = sin techos o casi; falso = techos donde el
plano no dibuja edificio.

| recorte | cuerpos dibujados | acierto | parcial | falta | grupos de techos falsos | árboles dibujados | árboles hallados (ciertos) | árboles falsos |
|---|---|---|---|---|---|---|---|---|
| 0,5 km (centro) | 24 frentes de manzana | 21 | 3 | 0 | 0 | 0 | 0 | 3 |
| 2,0 km (borde) | 33 | 31 | 1 | 1 | 8 | ≈ 39 | 31 | 0 |
| 3,5 km (quintas) | 17 | 9 | 1 | 7 | 0 | 2 | 2 | 15 |
| total | 74 | 61 | 5 | 8 | 8 | ≈ 41 | 33 | 18 |

## Notas por recorte

**0,5 km.** Los 24 frentes tienen techos; tres con huecos (el frente sur de las manzanas A2–A3, B2–C3 y D2–D3,
donde el rayado cruzado se angosta junto a una iglesia o a un edificio con rótulo). Los fondos de rayado simple
quedan limpios (ningún techo falso). Las letras de los nombres de calle (VICTORIA, RIVADAVIA) y los números 56 y
14 no se volvieron edificio. Tres árboles falsos: los puntos del recuadro blanco con letras dentro del edificio 14
(D3). En los lados este y oeste de la manzana B2–C3 los techos salen como tiras largas y finas a lo largo del
frente: la geometría existe pero la partición en lotes ahí no se parece a casas. La partición en lotes es inventada
en todos los casos (el plano no dibuja lotes).

**2,0 km.** Por el recorte pasa la junta entre las dos mitades del pliego (línea horizontal en y ≈ 960 de la lámina).
Debajo de la junta el escaneo es más borroso y el rayado simple de los fondos responde en las dos diagonales: en la
manzana B4–C4 quedan 8 grupos de techos falsos dentro del fondo (la corrección por tono de `tools/2-ciudad.mjs`
saca parte, no todo). La L de rayado cruzado de la manzana D3 (frente norte y oeste) casi no tiene techos: es la
única falta grande. Árboles de la plaza (52): de unos 36 símbolos dibujados se hallan 29, todos sobre un símbolo;
faltan sobre todo los arbustos chicos. Fuera de la plaza, 2 de 3.

**3,5 km.** De los 7 edificios sueltos de las quintas (rectángulos de 5–8 m con puntos blancos adentro) solo 1 sale
como casa; 2 salen como árbol y 4 no salen. Los 10 cuerpos de rayado cruzado de las manzanas del sur del recorte
salen (uno, C4 abajo, a medias). De los 17 árboles hallados solo 2 son árboles dibujados: 6 caen sobre cercos
(dibujados como una línea festoneada), 4 sobre letras del nombre del dueño de la quinta, 3 sobre matas de pasto o
rayas de surco y 2 sobre edificios sueltos. Las matas de pasto (más de cien en el recorte) casi nunca se toman por
árbol (3 casos).

## Lo que la muestra no dice

Tres recortes (0,27 km² de 86,6 km² dentro de la guarda) sobre un solo eje; no hay recorte en la Boca ni en la
barranca del norte, donde el plano cambia de carácter. Un solo observador, que además es el autor del sistema que
evalúa. Los conteos de árboles dibujados son aproximados (± 3).
