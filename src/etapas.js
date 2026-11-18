// Los años de la línea de tiempo, en un solo lugar: la etapa 0 es el plano de 1867 y cada una de las que siguen es un
// plano de época calzado sobre él (tools/epocas.mjs → fuentes/planos/indice.json). De acá los leen el generador
// (tools/alturas.mjs y tools/crece.mjs, que además controla que coincidan con los planos que hay) y, en el visor, lo
// que necesita los años antes de que lleguen los datos (src/hitos.js, src/catalogo.js). La fila de años de arriba
// (src/epocas.js) sale de public/datos/crece.json, que escribe el generador con esta misma lista.
//
// Entran ocho etapas y no más: cada pieza de las mallas guarda «nace + 8 × muere» (src/tinta.js, alzado), o sea
// etapas de 0 a 7. Para sumar una novena (1965, por ejemplo) hay que ensanchar esa cuenta en src/tinta.js,
// src/ciudad.js, src/hitos.js y src/modos.js, y darle su código en las láminas (más abajo).
export const AÑOS = [1867, 1888, 1895, 1905, 1910, 1921, 1940, 1950];
/** La última etapa (su número). */
export const ULTIMA = AÑOS.length - 1;
/** La etapa de un año: la primera que ya lo encuentra hecho (1888 → 1 … 1950 → 7); 0 si es posterior a la última. */
export const etapaDe = (año) => AÑOS.slice(1).findIndex((a) => a >= año) + 1;

// Las láminas del suelo (public/plano/crece.webp, despeje.webp y calles.webp) guardan de cada punto «desde cuándo»,
// en un número de 0 a 255 que baja con las etapas (0 = nunca). Las etapas 1 a 6 —hasta 1940— conservan el código de
// cuando la línea de tiempo terminaba ahí: 255 · (7 − e) / 6 en crece y despeje, y 255 · (7 − e) / 7 en calles, que
// cuenta desde 1867. Así esas láminas, y lo que se pinta con ellas, quedan punto por punto como estaban. Lo que
// llega después va por debajo del último código viejo (42 y 36): la etapa 7 —1950— vale 10 en las tres. El umbral
// con el que el visor las lee (src/tinta.js, llego y llego7) sabe de ese escalón. Una etapa 8 tendría que entrar
// entre 0 y 10, con su umbral.
export const CODIGO_TARDE = 10;
/** El código de la etapa e (1…) en crece.webp y despeje.webp. */
export const codigoDe = (e) => (e <= 6 ? Math.round((255 * (7 - e)) / 6) : CODIGO_TARDE);
/** El código de la etapa e (0 = 1867…) en calles.webp. */
export const codigoCalle = (e) => (e <= 6 ? Math.round((255 * (7 - e)) / 7) : CODIGO_TARDE);
/** La etapa de un valor de crece.webp o despeje.webp (0: nunca; los valores intermedios del borde, a la más cercana). */
export const etapaDeCodigo = (v) => (v < CODIGO_TARDE / 2 ? 0 : v <= 21 ? 7 : Math.round(7 - (v / 255) * 6));
