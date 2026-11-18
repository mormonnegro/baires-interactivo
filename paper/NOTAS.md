# Notas para quien revise el artículo antes de enviarlo

Escritas por el agente (Claude Code) el 17 de noviembre de 2026, al terminar el borrador.

## Qué hay en esta carpeta

| Archivo | Qué es |
|---|---|
| `paper.md` | El artículo, en español, con título, resumen y palabras clave también en inglés. Es la fuente. |
| `paper.html` | Versión legible, una sola página con las figuras adentro (5 MB). |
| `paper.pdf` | Versión A4, 29 páginas. Sin autor ni rutas en los metadatos (el título, y «HeadlessChrome» / «Skia» como programa). |
| `hacer.mjs` | `node paper/hacer.mjs` rehace el HTML y el PDF desde `paper.md` (conversor propio; no instala nada). |
| `referencias.bib` | Las 31 referencias y las 4 fuentes de datos, en BibTeX. |
| `figuras/` | Las ocho figuras (y el SVG del diagrama). |
| `medidas/` | Los scripts de medición (solo leen del repositorio) y sus salidas. |

## Qué se verificó y cómo

**Cifras.** Cada número de la sección 6 del artículo sale de una salida guardada:

| Cifra | Script | Salida |
|---|---|---|
| Residuos de la georreferencia, validación cruzada, escala y giro | `medidas/georef.mjs` | `georef.txt`, `georef.json` |
| Inventario por etapa, superficie de techos, tierra ganada, relieve | `medidas/inventario.mjs` | `inventario.txt`, `inventario.json` |
| Líneas de código, marcas, fichas, fotos y licencias, tamaños de descarga | `medidas/conteos.mjs` | `conteos.txt`, `conteos.json` |
| Clases de todo el pliego; coincidencia de la reimplementación del paso 1 | `medidas/fig-plano-clases.mjs` | `clases.txt`, `clases.json` |
| Ventana de la figura 4 | `medidas/fig-calce.mjs` | `calce.txt` |
| Recortes de la muestra | `medidas/muestra.mjs` | `muestra.txt`, `muestra.json`, `muestra/*.png` |
| Conteo a ojo de la muestra | (a mano, por el agente) | `muestra-conteo.md` |
| Tiempos de carga del sitio publicado | `tools/carga.mjs --url https://baires.mormon.garden/` (del proyecto) | `carga-publicada.txt` |
| Alturas que da el LEEME como ejemplo | `medidas/relieve-puntos.mjs` | `relieve-puntos.txt` |
| Sesiones, pedidos, llamadas a herramientas, capturas, pruebas | `medidas/historial.mjs <directorio de sesiones> --excluir <esta sesión>` | `historial.txt` |

`georef.mjs` no vuelve a correr el calce de calles (eso reescribiría `tools/geo.json`): reconstruye los 104 pares de
control a partir de `tools/geo.json` y repite las cuentas con las funciones del repositorio. Sus números coinciden con
los que el propio `tools/calce.mjs` anotó en `geo.json` (media 2,5 m, máximo 7,1 m) salvo por el redondeo al metro de
los puntos guardados (el script da 2,4 y 8,3). `inventario.mjs` comprobó que `ciudad.pak` descomprimido es idéntico,
byte por byte, a los cuatro `.bin`.

**Técnicas.** Todo lo descrito en la sección 4 se leyó en el código (`tools/*.mjs`, `src/*.js`, `src/lugares/*.js`) y en
`LEEME.md` y `src/lugares/LEEME.md`. Los parámetros del apéndice B se copiaron del código; los que cité de memoria en el
primer borrador se volvieron a cotejar (señas de color, renovación, modelo del campo, calcos, sombreador).

**Referencias.** Las 25 con DOI se consultaron en la API de Crossref (título, autores, revista, volumen, páginas y año
coinciden con lo citado). Las dos de arXiv, en la API de arXiv (SWE-bench trae la nota «ICLR 2024»; SWE-agent se cita
solo como arXiv, porque no confirmé la sede). Scobie (1974) y Gorelik (1998), en catálogos de bibliotecas y reseñas;
Favelukes y Aliata (2015), en el repositorio de CONICET y la revista; Balletti (2006), en la lista de bibliografía de
MapAnalyst y con el PDF en el sitio de la revista (responde 200). **Verifiqué que existen y que los datos
bibliográficos son correctos; no leí los textos completos.** Lo que digo de cada una en la sección 2 se apoya en su
título y resumen: conviene que alguien del área lo revise.

**Fuentes.** La ficha del plano de 1867 en Wikimedia Commons (18.919 × 13.272 px; «Glade, Carlos, cartographe»;
Departamento Topográfico; 1867; BnF; dominio público) se leyó con la API de Commons. La licencia CC BY 2.5 AR de
«Elevación terreno» se leyó en la página del conjunto de datos. El sitio «Buenos Aires en cartografía» responde y nombra
a la cátedra Lombardi y al Archivo Buenos Aires. La página de Gallica devolvió 403 a un cliente automático: el
identificador btv1b53098699s lo confirma la ficha de Commons, no Gallica.

## De dónde sale cada figura

| Figura | Archivo | Cómo se hizo | Fuente de las imágenes |
|---|---|---|---|
| 1 | `figuras/fig01-plano.jpg` | `medidas/fig-plano-clases.mjs` | Plano de 1867 (BnF vía Commons, dominio público) |
| 2 | `figuras/fig02-proceso.png`, `.svg` | `medidas/fig-proceso.mjs` | Diagrama propio |
| 3 | `figuras/fig03-clases.png` | `medidas/fig-plano-clases.mjs` | Plano de 1867 y datos derivados |
| 4 | `figuras/fig04-calce.png` | `medidas/fig-calce.mjs` | Plano de 1867; calles © colaboradores de OpenStreetMap (ODbL) |
| 5 | `figuras/fig05-etapas.png` | `tools/shot.mjs` + `medidas/fig-etapas.mjs` | Tomas propias del visor |
| 6 | `figuras/fig06-plaza.png` | `tools/shot.mjs` + `medidas/fig-plaza.mjs` | Gonnet 1864 (`fuentes/fotos/constitucion-gonnet.jpg`, Commons, dominio público); Plano Topográfico de 1895 (`fuentes/planos/1895.jpg`, Commons, dominio público); tomas propias |
| 7 | `figuras/fig07-tinta.jpg` | `tools/shot.mjs` + `medidas/fig-etapas.mjs` | Toma propia del visor |
| 8 | `figuras/fig08-muestra.png` | `medidas/muestra.mjs` | Plano de 1867 y datos derivados |

Las tomas del visor (quedaron en `shots/paper-*.png`), todas a 1600 × 1000 con `--puerto 5461`; a las láminas se les
recorta la franja de arriba y la de abajo, donde está la interfaz (el recuadro de créditos trae una foto de perfil):

- Figura 5: `--query "color"`, `"año"` 1867 … 1940, `"ver":{"x":0,"z":150,"dist":1500,"yaw":-1.57,"pitch":0.75}`; el
  panel de tinta, lo mismo con `--query ""` y `"año":1867`.
- Figura 6: `--query "color"`, `"año"` 1867 y 1895, `"ver":{"x":-1950,"z":-915,"dist":760,"yaw":-1.57,"pitch":1.25}`.
- Figura 7: `--query ""`, `"año":1867`, `"ver":{"x":0,"z":0,"dist":420,"yaw":-0.9,"pitch":0.55}`.

## Lo que quedó sin verificar o sin medir

1. **La evaluación es chica y de un solo observador.** Tres recortes de 300 m, contados a ojo por el mismo agente que
   escribió el lector. Hace falta un segundo observador (humano) y más recortes, sobre todo en la Boca, la barranca del
   norte y las quintas del sur.
2. **No hay comparación con otro método** (ni un lector aprendido ni una vectorización clásica).
3. **El calce de los seis planos posteriores no tiene medida de error propia**, y las señas de color tampoco: no se
   comparó lo que cada seña da por edificado con una lectura a ojo del plano.
4. **El crecimiento no se contrastó con censos ni catastros.** La tabla por etapa describe el modelo.
5. **Fuera del casco de 1867 la georreferencia no tiene control.** Los residuos de validación cruzada están además
   sesgados hacia abajo, porque `tools/calce.mjs` ya descartó las ventanas que quedaban a más de 14 m.
6. **Cuadros por segundo: sin medir.** La opción `--tiempos` de `tools/shot.mjs` informa solo la última pasada (el
   cuadro de pantalla: 1 llamada, 2 triángulos), así que no sirve para el costo de la escena. Los tiempos de carga son de
   una emulación de teléfono en una computadora de escritorio.
7. **La fotografía aérea de 1940** (capa del mapa interactivo de la Ciudad, citada en las cabeceras de varias plazas):
   no encontré su ficha ni su licencia en la web. No se reproduce en ninguna figura.
8. **Los datos históricos** de fichas y cabeceras (fechas de obras, autores de edificios) no los revisó un historiador.
9. **El historial de sesiones** disponible empieza el 16 de noviembre de 2026: no incluye la construcción de la base de
   1867, así que la sección 5 describe el método de trabajo de la etapa de crecimiento y publicación.
10. **Las licencias de las 146 fotos**: se tomó lo que declara Wikimedia Commons («Public domain» en las 146). No se
    revisó cada caso según la ley argentina ni la del país donde se publique.

## Afirmaciones de la documentación del proyecto que no coinciden con lo medido

| Dónde | Dice | Se midió |
|---|---|---|
| `LEEME.md`, carga | «0,33 MB hasta ver el plano» | 0,47–0,55 MB transferidos en el sitio publicado al verse el plano (`carga-publicada.txt`). La lámina sola pesa 0,13 MB; el resto es HTML y código. |
| `LEEME.md`, «Qué es del plano» | Árboles: «uno por cada árbol dibujado (unos 35.000)» | El archivo tiene 35.658, pero no hay uno por árbol dibujado: en la muestra, 18 de 51 hallados son falsos (cercos, letras, casillas) y faltan unos 8 de 41 dibujados. |
| `LEEME.md`, «Qué es del plano» | «leído automáticamente, píxel por píxel» | El rayado se lee en ventanas de 12 px sobre una grilla de 2 px; solo lo chico (casillas, árboles) se lee a resolución plena. |
| `LEEME.md`, línea de tiempo | `calles.webp`, «0,7 MB» | 0,59 MB (589 kB). |
| `LEEME.md`, barranca | «3,6 m en Alem» por Corrientes | 5,8 m en el punto que probé (`relieve-puntos.txt`); está al pie de la barranca y cambia varios metros en una cuadra, así que depende de dónde se mida. Plaza de Mayo (17,6), Congreso (21,5) y 9 de Julio (16,8) coinciden. |
| `LEEME.md`, fuentes | El plano, «de Carlos Glade» | La ficha de la BnF lo da como cartógrafo («fonction indéterminée»); la cartela nombra al Departamento Topográfico y a sus miembros. En el artículo puse las dos cosas. Conviene mirar la cartela y decidir la atribución. |

Coinciden con lo medido: los 10 m → 2,5 m del calce de calles y los 3–4 m en validación cruzada; las 14 referencias;
`ciudad.pak` 1,35 MB contra 3,76 MB; las casas nuevas por etapa; los 15.400 árboles y 322 aljibes de los patios; los
11,5 km² de tierra ganada; las 146 fotos. (`crece.pak` «2,1 MB» y las fotos «29 MB» son correctos en MiB; en el
artículo uso MB decimales: 2,23 y 30,8.)

## Referencias que descarté

- **Petitpierre, Kaplan y di Lenardo (2021)**, sobre segmentación semántica genérica de mapas históricos: no la
  verifiqué (no tenía DOI a mano) y quedó afuera.
- **Favelukes, *El plano de la ciudad*** (libro, Instituto de Arte Americano, FADU-UBA): existe, pero las fuentes no
  coinciden en el año (2020 o 2021). Afuera hasta que alguien mire el colofón. Sería la mejor cita sobre el plano de 1867.
- **Münster et al.**, sobre reconstrucción 4D y patrimonio: la tenía anotada sin datos suficientes para buscarla. Afuera.
- **La ficha de Gallica** del plano: la página rechazó al cliente automático (403); cito el identificador que da Commons.
- **La fotografía aérea de 1940 de la Ciudad**: sin ficha verificable; se menciona como fuente no verificada, no como
  referencia.
- **SWE-agent**: se cita como arXiv; no confirmé que la sede sea NeurIPS 2024.

Todas las que quedaron en `referencias.bib` están verificadas como se dijo arriba.

## Qué debería revisar la persona antes de enviarlo

1. **La autoría.** Casi ninguna revista acepta un modelo de lenguaje como autor (las políticas de los editores grandes
   lo excluyen expresamente y piden declarar el uso de IA en métodos). Tal como está, «Claude Code» primero y
   «@mormonnegro» como *meat proxy*, el artículo sirve para un repositorio de prepublicaciones que lo admita, un sitio
   propio o una sede que busque explícitamente trabajos hechos por agentes. Para una revista convencional habría que
   poner como autora a la persona, con su nombre o seudónimo según lo que la revista admita, y pasar al agente a
   métodos y agradecimientos. Es una decisión de la persona; el texto de la nota de contribuciones ya lo deja dicho.
2. **Leer la sección 2** con alguien de cartografía histórica: los datos bibliográficos están verificados, la
   caracterización de cada trabajo no.
3. **La evaluación (6.3):** repetir el conteo a ojo sobre `medidas/muestra/*.png` y anotar las diferencias. Si se
   agregan recortes, elegirlos por regla antes de mirarlos.
4. **El repositorio.** El artículo dice «en el repositorio del proyecto» sin dar dirección: no me consta que sea
   público. Antes de enviar, publicar el código (y, si se puede, depositarlo con DOI) y poner la dirección en
   «Agradecimientos y datos» y en «Reproducibilidad».
5. **La atribución del plano** (ver la tabla de arriba) y los nombres de los miembros del Departamento Topográfico, que
   copié de la cartela tal como se leen en el escaneo.
6. **La foto de perfil** del recuadro de créditos del visor: la recorté de todas las figuras. Si se rehacen tomas,
   recortarla otra vez.
7. **El costo en cómputo** del trabajo no está medido; algunas sedes lo piden.
8. **El idioma.** Está en español rioplatense neutro. Para una revista internacional hay que traducirlo entero (el
   resumen en inglés ya está).

## A qué tipo de publicación apunta

Es un artículo de métodos con estudio de caso. Encaja, por orden de afinidad:

- Revistas de **humanidades digitales y patrimonio digital** que publican métodos y reconstrucciones (del tipo de
  *Digital Humanities Quarterly*, *Digital Applications in Archaeology and Cultural Heritage*, *Journal on Computing and
  Cultural Heritage*), o en español, revistas de historia urbana y cartografía con sección de métodos.
- Revistas y congresos de **cartografía histórica y SIG** (del tipo de *e-Perimetron*, la conferencia de la comisión de
  patrimonio cartográfico digital de la ICA, *Transactions in GIS*, *ISPRS International Journal of Geo-Information*),
  que pedirán la comparación con otros métodos y una evaluación más grande.
- Talleres sobre **agentes de lenguaje en ciencia o en software**, para los que la sección 5 es lo central.

Lo más débil para un arbitraje es la evaluación (puntos 1 a 4 de «sin verificar»); lo más fuerte, que todo es
reproducible y que lo inventado está separado de lo leído.
