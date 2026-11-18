# Qué hacer con cada control que falla

`npm run revisar -- <clave>` dice, debajo de cada falla, cómo se arregla. Esto lo amplía. La regla general: un
control que falla está avisando de algo real; se arregla la causa, no el dato para que pase.

| Control | Qué significa | Qué hacer |
|---|---|---|
| **El lugar existe / Está registrado** | La clave no está en `src/hitos.js`. | El `import` junto a los otros y el nombre al final de `const LUGARES = { … }`. A la revisión se le pasa el nombre del archivo (`mercado-del-plata`); también entiende el de la lista (`mercadoDelPlata`). |
| **Se arma sin errores** | La función del lugar tiró un error, o no puso nada. | Leé el error: casi siempre un argumento que falta en una pieza o una variable sin definir. Las piezas y su orden de argumentos, en `src/lugares/LEEME.md` y en `src/hitos.js`. |
| **Declara qué es** | Falta `export const LUGAR` o alguno de sus campos. | Completalo (formato en `src/lugares/LEEME.md`). No pongas un campo vacío para que pase: si no hay fuentes, falta investigar. |
| **Las etapas son válidas / coinciden con los años** | Aparece o se va en una etapa que no corresponde al año que declara. | Usá `c.etapaDe(año)` en vez de números. Si el año estaba mal, corregilo en `LUGAR` **con su fuente**. Si nace y se va entre dos etapas, o es posterior a la última, no entra en el visor: a `PENDIENTES.md`. |
| **Entra en el cupo de puntos** | Pesa demasiado. | Menos lados en cilindros y cúpulas (6 u 8), una sola pieza por cornisa, vanos pintados (`T.fila`) en vez de huecos de verdad, nada de lo que no se ve desde arriba. No subas el cupo. Si de verdad es un conjunto grande, `clase: 'conjunto'`. |
| **Está donde dice su dirección** | La esquina o las coordenadas declaradas caen a más de 90 m de lo construido, o a más de 200 m una de la otra. | No elijas una al azar. Volvé al paso 3: sacá las cuatro esquinas de la manzana, pasá las coordenadas con `--punto`, y mirá la foto aérea de la hoja. Si lo que está mal es el modelo, corré el origen de `c.lugar(px, py)`. Si es solo el aviso de «una sola fuente» y el lugar ya no existe ni hay coordenadas de donde estuvo, se deja y se explica en el pedido. |
| **Tiene marca** | No hay marca con ese nombre, o está lejos, o vale en etapas en que el lugar no existe. | Agregala en `src/marcas.js` con el mismo nombre que en `LUGAR.marcas`, sobre el lugar, con el mismo `desde` y `hasta` (en etapas) que `c.epoca()`. |
| **Tiene ficha / La ficha tiene el largo esperado** | Falta la entrada en `FICHAS`, o es muy corta o muy larga. | Dos o tres párrafos, 150 a 1.100 letras. Si sobra, sacá lo que no es de este lugar; si falta, falta investigar. |
| **Tiene fuentes** | `LUGAR.fuentes` vacío. | Cada dato sale de algún lado: anotá de dónde. |
| **Dice qué es supuesto** (aviso) | Declarás supuestos y la ficha no los dice. | Un último párrafo: «Las medidas y el alto son supuestos». |
| **Cada foto tiene su procedencia y su licencia** | Falta el `.json`, la licencia no es libre, o no corriste `tools/fotos.mjs`. | `node tools/foto-commons.mjs` y `node tools/fotos.mjs`. Una foto con licencia dudosa se saca. |
| **No cambia nada fuera de su entorno** | Otros lugares quedaron distintos de como están en `main`. | Si dice «cambiaron los colores»: tu lugar no está último en `LUGARES`. Si dice otra cosa: tocaste un archivo ajeno; `git diff main --stat` y deshacé lo que no sea tuyo. |
| **No cambia marcas ni fichas ajenas** (aviso) | Cambiaste una marca o una ficha que no es de tu lugar. | Si es a propósito (cortarle la época a la marca de lo que tu lugar reemplaza), contalo en el pedido. Si no, deshacelo. |
| **Toca solo lo suyo** | El aporte cambia el generador, los datos generados o la configuración. | `git checkout main -- <archivo>`. Lo que necesites de ahí se pide en el pedido. |
| **No deja rutas de la máquina** | Quedó una ruta de tu carpeta personal en algún archivo. | Sacala: rutas relativas al repositorio. |
| **`node tools/revisar-commits.mjs` marca un commit con ✗** | Ese commit se hizo con un modelo menor que el que pide el proyecto. | Rehacelo con Claude Fable 5.2 o mayor (`/model fable`, `/effort medium`): `COORDINAR.md`. Un «?» (sin firma) no falla, pero se explica en el pedido. |
| **Compila** | `vite build` falla. | `npx vite build` y leé el error. |
| **Se ve bien en el visor** | El lugar falla al armarse en el navegador, o la consola tira errores. | `npx vite`, abrir la página y mirar la consola. Si el mismo aviso sale en `main`, no es tuyo: decilo en el pedido. |

## Lo que la herramienta no ve

Que el edificio se parezca. Eso se mira en la hoja (`revision/<clave>.jpg`), contra la foto de época y contra la
foto aérea de 1940, y lo va a mirar el dueño antes de aceptar.
