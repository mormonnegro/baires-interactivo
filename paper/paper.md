# Del grabado a la ciudad navegable: lectura automática del rayado de un plano de 1867 y reconstrucción 3D por etapas de Buenos Aires (1867–1940) hecha por un agente de programación

**Claude Code**¹ · **@mormonnegro**² (*meat proxy*)

¹ Agente de programación de Anthropic (un modelo de lenguaje que escribe y ejecuta código). ² *Meat proxy*: la persona que dirigió el trabajo, eligió qué hacer y validó a ojo cada resultado (ver la nota de contribuciones).

Versión del 17 de noviembre de 2026. Visor: <https://baires.mormon.garden>

**Nota de contribuciones.** *Claude Code* escribió todo el código del visor y de las herramientas, eligió y ajustó los métodos de lectura de imagen y de georreferencia, buscó y fichó las fuentes, modeló a mano los edificios y las plazas a partir de fotos y planos, corrió las pruebas, hizo las mediciones de este artículo y lo redactó. *@mormonnegro* figura como *meat proxy*, el término con que se nombra acá a la persona de carne y hueso por cuya mano el agente actúa en el mundo: concibió el proyecto, decidió en cada paso qué se hacía y qué no, aportó fuentes (entre ellas el catálogo de planos con el que se eligieron las etapas), señaló errores mirando el visor y capturas de pantalla, corrigió datos históricos, probó cada versión antes de publicarla y es quien responde por la publicación. No escribió código ni este texto. Ninguna otra persona intervino. Un modelo de lenguaje no puede asumir la responsabilidad que las revistas piden a un autor; ese punto se discute en la sección 8 y queda a criterio de quien publique.

## Resumen

Presentamos un estudio de caso y un método: cómo se convirtió un plano grabado de Buenos Aires de 1867 (Departamento Topográfico; dibujo de Carlos Glade; escala 1:8000) en una ciudad 3D navegable en el navegador, y cómo se la hizo crecer en siete etapas (1867, 1888, 1895, 1905, 1910, 1921 y 1940) con seis planos posteriores, datos abiertos de hoy y fotografías de época. El trabajo lo hizo un agente de programación dirigido por una persona. El aporte técnico principal es la lectura automática de la convención gráfica del grabador: lo edificado está rayado en cruz y los fondos de las manzanas con rayado simple, con rayas separadas apenas 4,3 píxeles en el escaneo. En vez de vectorizar líneas se mide, en ventanas de 12 píxeles, la respuesta del gris a una onda de ese período en cada diagonal, y con las dos respuestas y el tono medio se clasifica cada punto en cinco clases. De ahí salen manzanas, frentes edificados, patios, iglesias, casillas y árboles; los lotes, las alturas y las aberturas se inventan con reglas declaradas. La georreferencia parte de un ajuste afín con 14 edificios (residuo medio 22,5 m) y se refina calzando las calles angostas de hoy (OpenStreetMap) contra el papel libre del plano, por ventanas: el corrimiento medio de 9,7 m baja a 2,4 m, y a 3,1–3,9 m en validación cruzada por zonas. El crecimiento combina señas de color de cada plano posterior con reglas y con obras fechadas a mano. El visor de 1867 tiene 52.521 techos, 146.487 muros y 35.658 árboles en 1,35 MB; en 1940, 64.007 cuerpos edificados. En una muestra chica (tres recortes de 300 m, contados a ojo por el propio agente) el visor pone techos en 61 de 74 cuerpos edificados dibujados, con ocho grupos de techos falsos concentrados junto a la junta del pliego, y fuera del casco urbano confunde cercos, letras y casillas con árboles. Declaramos con detalle qué sale del plano, qué es inventado y qué no se verificó.

**Palabras clave:** cartografía histórica; reconstrucción urbana 3D; modelo de ciudad 4D; rayado; análisis de textura; georreferenciación; OpenStreetMap; Buenos Aires; agentes de programación; humanidades digitales.

## Title, abstract and keywords (English)

**From engraving to navigable city: automatic reading of the hatching of an 1867 plan and a staged 3D reconstruction of Buenos Aires (1867–1940) built by a coding agent**

**Abstract.** We present a case study and a method: how an engraved 1867 plan of Buenos Aires (Departamento Topográfico; drawn by Carlos Glade; scale 1:8000) was turned into a 3D city that can be explored in a web browser, and how it was grown through seven stages (1867, 1888, 1895, 1905, 1910, 1921 and 1940) using six later plans, present-day open data and period photographs. The work was carried out by a coding agent directed by one person. The main technical contribution is the automatic reading of the engraver's graphic convention: built-up areas are cross-hatched and the backyards of each block are single-hatched, with lines only 4.3 pixels apart in the scan. Instead of vectorising lines, we measure, in 12-pixel windows, the response of the grey image to a wave of that period along each diagonal, and classify every point into five classes from the two responses and the mean tone. Blocks, built frontages, yards, churches, sheds and trees come from that reading; lot boundaries, heights and openings are invented with declared rules. Georeferencing starts from an affine fit on 14 buildings (mean residual 22.5 m) and is refined by matching today's narrow streets (OpenStreetMap) against the blank paper of the plan, window by window: the mean offset drops from 9.7 m to 2.4 m, and to 3.1–3.9 m under zone-wise cross-validation. Growth combines per-plan colour signatures of each later map with rules and hand-dated public works. The 1867 city holds 52,521 roofs, 146,487 walls and 35,658 trees in 1.35 MB; by 1940 it has 64,007 building bodies. In a small sample (three 300 m crops, counted by eye by the agent itself) the viewer places roofs on 61 of 74 drawn built bodies, with eight groups of false roofs clustered next to the sheet join, and outside the urban core it mistakes fences, lettering and sheds for trees. We state in detail what comes from the plan, what is invented and what was not verified.

**Keywords:** historical cartography; 3D urban reconstruction; 4D city model; hatching; texture analysis; georeferencing; OpenStreetMap; Buenos Aires; coding agents; digital humanities.

## 1. Introducción y pregunta

Un plano urbano del siglo XIX dice más de lo que muestra a primera vista. El *Plano topográfico de la Ciudad de Buenos Aires y de todo su Municipio* de 1867 no dibuja solo calles y manzanas: adentro de cada manzana el grabador distinguió, con dos tramas de rayas, lo que estaba edificado de lo que era patio, corralón o fondo, y sembró el pliego de árboles, casillas e iglesias marcadas con una cruz (figura 1). Esa información está en la imagen, pero codificada en una convención gráfica y a una escala en la que cada raya ocupa uno o dos píxeles del escaneo.

La pregunta de este trabajo es práctica: **¿cuánto de la ciudad de 1867 se puede levantar automáticamente del escaneo de ese plano, con herramientas clásicas de imagen y sin datos de entrenamiento, y cómo se la puede hacer crecer hasta 1940 con otros planos sin perder de vista qué es dato y qué es invención?** La respuesta es un visor público, «Buenos Aires, de 1867 a 1940», y este artículo documenta cómo se hizo: cada técnica descrita está en el código del repositorio, cada cifra sale de un script que se puede volver a correr (`paper/medidas/`) y cada limitación que conocemos está dicha.

El trabajo tiene además una particularidad de método: lo hizo un agente de programación (un modelo de lenguaje con acceso a una terminal) dirigido por una sola persona que no escribió código. Tratamos ese arreglo como parte del método y no como una curiosidad, porque condiciona qué se verificó y cómo (secciones 5 y 8).

Las contribuciones son cuatro:

1. Un lector del rayado de un plano grabado que no vectoriza líneas: mide la respuesta local a la trama en dos diagonales y la combina con el tono (sección 4.2), con una segunda pasada a resolución plena para lo chico (4.3) y una corrección por tono donde el escaneo engaña (4.4).
2. Un ajuste fino de la georreferencia por calce de calles en ventanas, que usa el papel en blanco del plano como señal y las calles de hoy como patrón, con criterios de aceptación explícitos y validación cruzada por zonas (4.6).
3. Un esquema de crecimiento por etapas que consulta a cada plano posterior con una seña de color propia y separa en el código lo leído, lo reglado y lo fechado a mano (4.7–4.8).
4. Una descripción franca del método de trabajo agente–humano, con sus controles y sus huecos (5 y 8).

![**Figura 1.** El plano de 1867 (arriba; el recuadro rojo marca el recorte de abajo a la izquierda: 608 × 432 m alrededor de la Plaza de la Victoria) y un detalle de 203 × 144 m con cada píxel del escaneo ampliado (abajo a la derecha): se ve el rayado cruzado de lo edificado, el rayado simple de los fondos, los árboles de la plaza y una iglesia en negro con su cruz. Fuente: Departamento Topográfico, 1867; ejemplar de la Bibliothèque nationale de France (Gallica btv1b53098699s) vía Wikimedia Commons, dominio público. Hecha con `paper/medidas/fig-plano-clases.mjs`.](figuras/fig01-plano.jpg)

## 2. Trabajos relacionados

**Procesamiento automático de mapas históricos.** Chiang, Leyk y Knoblock (2014) ordenan el campo en separación de capas gráficas, reconocimiento de símbolos y texto y vectorización, y señalan que la mayoría de los métodos dependen del tipo de mapa. En la última década el problema se resolvió sobre todo con redes convolucionales: Heitzler y Hurni (2020) reconstruyen huellas de edificios del mapa Siegfried suizo, Uhl et al. (2020) extraen asentamientos de series topográficas con supervisión débil, Chen et al. (2021) vectorizan mapas históricos combinando un filtro de bordes aprendido con la extracción de formas cerradas, y la competencia de ICDAR 2021 (Chazalon et al., 2021) fijó tareas y datos de referencia para la segmentación de mapas históricos. Nuestro caso es el opuesto en recursos: un solo pliego, ninguna anotación, y una convención gráfica muy regular. Por eso el lector es un filtro de textura clásico, del linaje de la segmentación por bancos de filtros de Gabor (Jain y Farrokhnia, 1991), seguido de morfología matemática (Haralick, Sternberg y Zhuang, 1987). No comparamos contra un método aprendido; lo decimos como limitación (sección 8).

**Georreferenciación y distorsión de mapas antiguos.** La georreferencia de cartografía histórica se hace por lo común con puntos de control puestos a mano, a veces por muchas personas (Fleet, Kowal y Přidal, 2012), y sus residuos sirven a la vez para estudiar la geometría del mapa (Balletti, 2006; Jenny y Hurni, 2011). Hay trabajos que automatizan el calce con datos actuales: Chen, Knoblock y Shahabi (2008) conflacionan automáticamente mapas ráster con ortoimágenes, Duan et al. (2020) alinean vectores actuales con mapas históricos georreferenciados por aprendizaje por refuerzo, y Luft y Schiewe (2021) georreferencian hojas topográficas por su contenido. Nuestro calce (4.6) es de esa familia, con una señal más pobre y más barata: no detecta calles ni cruces en el plano; busca el corrimiento que deja las calles de hoy sobre papel en blanco y fuera de lo rayado.

**Reconstrucción 3D y modelos 4D de ciudades.** Levantar ciudades desaparecidas a partir de mapas tiene antecedentes directos: Herold y Hecht (2018) reconstruyen en 3D la historia urbana desde mapas antiguos, Kersten et al. (2012) generan un modelo 4D de Hamburgo, Farella, Özdemir y Remondino (2021) reconstruyen edificios en 4D con aprendizaje automático y mapas históricos, y Vaienti et al. (2023) combinan aprendizaje y modelado procedimental para ciudades históricas en 4D, en la línea de la *Venice Time Machine* (Kaplan, 2015). El modelado procedimental de ciudades y edificios viene de Parish y Müller (2001) y Müller et al. (2006), y Biljecki et al. (2015) repasan para qué se usan los modelos 3D de ciudad. Frente a esos trabajos, el nuestro es más modesto en inferencia (las alturas no se estiman: se asignan con una regla declarada) y pone el acento en dos cosas menos tratadas: conservar el propio plano como superficie visible del modelo y llevar en el código la contabilidad de lo leído frente a lo inventado.

**Representación no fotorrealista.** El visor no intenta parecer una foto: parece el plano. El trazado de contornos a partir del búfer de profundidad sigue la idea de Saito y Takahashi (1990); el rayado como tono, la de la ilustración a pluma generada por computadora (Winkenbach y Salesin, 1994) y el rayado en tiempo real (Praun et al., 2001).

**Historia urbana de Buenos Aires.** El período que cubre el visor es el de la gran expansión de la ciudad, estudiado por Scobie (1974) y Gorelik (1998). Sobre el plano de 1867 y el trabajo del Departamento Topográfico, Favelukes y Aliata (2015). No hacemos historia urbana: usamos esa bibliografía para fechar obras y para no leer en el plano más de lo que trae.

**Agentes de lenguaje en programación y en SIG.** Los modelos de lenguaje que resuelven tareas reales de ingeniería de software con herramientas se evalúan desde SWE-bench (Jimenez et al., 2024) y se organizan como agentes con interfaz propia a la computadora (Yang et al., 2024). En geografía se propuso el «SIG autónomo» (Li y Ning, 2023) y asistentes que encadenan herramientas geoespaciales (Zhang et al., 2024). No conocemos un trabajo publicado en que un agente de este tipo haya llevado de punta a punta la reconstrucción de una ciudad a partir de cartografía histórica; no hicimos una búsqueda sistemática que permita afirmar que no existe.

## 3. Fuentes

Todas las fuentes cartográficas y fotográficas están en dominio público según su ficha de origen; los datos de hoy tienen licencias abiertas con atribución (sección 9).

**El plano de 1867.** *Plano topográfico de la Ciudad de Buenos Aires y de todo su Municipio, incluyendo parte de los partidos de Belgrano, San José de Flores y Barracas al Sur*, levantado por el Departamento Topográfico y publicado en 1867; la ficha de la Bibliothèque nationale de France da como cartógrafo a Carlos Glade y la cartela nombra a los miembros del Departamento (Saturnino Salas, Germán Kuhr, Pedro Benoit, Ygnacio Casagemas y Antonio E. Malaver). Usamos el ejemplar de la BnF (Gallica btv1b53098699s) en la copia de Wikimedia Commons: 18.919 × 13.272 píxeles. El plano declara escala 1:8000. La escala del escaneo se fijó con la propia ciudad: 150 varas (129,9 m, una manzana de 140 varas más una calle de 10) miden 192,5 píxeles, o sea 0,675 m por píxel (`tools/plano.mjs`), lo que a 1:8000 equivale a unos 301 puntos por pulgada. El escaneo no está en el repositorio (pesa 60 MB); va en `fuentes/plano-1867.jpg`.

**Los planos posteriores** (`fuentes/planos/indice.json`, `tools/epocas.mjs`):

| Etapa | Plano | Autor o editor | De dónde sale |
|---|---|---|---|
| 1888 | *Plano de la ciudad de Buenos Aires y de los partidos federalizados de San José de Flores y de Belgrano* (1888) | F. Latzina; Félix Lajouane, editor; grabado por Erhard hermanos | BnF, vía Wikimedia Commons |
| 1895 | *Plano topográfico de la ciudad de Buenos Aires, capital de la República Argentina* (1895) | Oficina de Obras Públicas de la Municipalidad; grabado en los talleres del Museo de La Plata | Wikimedia Commons |
| 1905 | *Municipio de Buenos Aires y parte del partido de Avellaneda*, 5.ª edición | Pablo Ludwig, cartógrafo | BnF, vía Wikimedia Commons |
| 1910 | El mismo título, edición extraordinaria para la Exposición Internacional de 1910 (plano de 1909) | Pablo Ludwig | BnF, vía Wikimedia Commons |
| 1921 | *Plano de la ciudad de Buenos Aires y sus alrededores* (1921) | A. Cannizzaro; Oficina Cartográfica Ludwig | American Geographical Society Library, University of Wisconsin–Milwaukee Libraries |
| 1940 | *Nuevo plano de la ciudad de Buenos Aires*, Guía Peuser del viajero (plano de 1936) | Casa Jacobo Peuser | BnF, vía Wikimedia Commons |

Dos etapas llevan un año distinto del de su plano: «1910» sale del plano de 1909 y «1940» del de 1936 más las obras hechas hasta 1940. Los planos se eligieron con el catálogo «Buenos Aires en cartografía» (Atlas histórico de planos urbanos, Archivo Buenos Aires, cátedra Lombardi, FADU-UBA), que aportó la persona que dirigió el trabajo.

**Datos de hoy.** Calles, vías, costa, agua y plantas de edificios de OpenStreetMap, bajados con la API Overpass (`tools/osm.mjs`, `tools/edificios.mjs`). Curvas de nivel de un metro de la Ciudad de Buenos Aires («Elevación terreno», Buenos Aires Data). Para el buscador de direcciones del visor, el normalizador de direcciones de la Ciudad (USIG) y Nominatim.

**Fotografías.** 146 fotos de época de Wikimedia Commons, cada una guardada con su ficha (título del archivo, autor, fecha, licencia y dirección de la página) en `fuentes/fotos/*.json`: 20 de Esteban Gonnet, 9 de Christiano Junior, 5 de Benito Panunzi y 69 de autor desconocido, entre otras; todas figuran en Commons como dominio público (`paper/medidas/conteos.txt`). Sirven de evidencia para el modelado a mano y se muestran en las fichas del visor.

**Fotografía aérea de 1940.** Para el trazado de varias plazas en la etapa de 1940, el código cita la capa de fotografías aéreas de 1940 del mapa interactivo de la Ciudad de Buenos Aires. No está en el repositorio y en la redacción de este artículo no pudimos comprobar su ficha ni su licencia (sección 8).

**Referencia visual, no incluida:** la vista a vuelo de pájaro de J. Dulin y el álbum *Recuerdos de Buenos Ayres* de Gonnet (1864).

## 4. Métodos

### 4.1 Vista general

El proceso (figura 2) son scripts de Node.js que se corren en orden y dejan archivos binarios chicos que el navegador baja; no hay servidor ni base de datos. El procesamiento de imagen usa la biblioteca `sharp` solo para leer, recortar y escribir: los filtros, la morfología, los ajustes y las búsquedas están escritos a mano en JavaScript sobre arreglos tipados (31 archivos y 4.093 líneas en `tools/`). El visor es three.js con sombreadores propios (25 archivos y 6.516 líneas en `src/`, más 18 archivos y 4.585 líneas de lugares modelados a mano). Todo lo aleatorio usa un generador con semilla fija, así que la misma entrada da la misma ciudad.

![**Figura 2.** El proceso. Fuentes (ocre), pasos automáticos (azul), trabajo a mano con fuente citada (rojo) y el programa del visor (verde). Diagrama propio (`paper/medidas/fig-proceso.mjs`).](figuras/fig02-proceso.png)

### 4.2 Leer la tinta: la respuesta al rayado

Quien dirigió el proyecto lo describe como «usar distintos contrastes para sacar más resolución». Lo que el código hace es otra cosa, emparentada: no aumenta la resolución ni realza el contraste para leer; **mide una textura**. El contraste estirado existe, pero solo para mostrar (4.13).

El problema es de muestreo. En el escaneo las rayas del grabado están separadas unos 4,3 píxeles (0,36 mm en el papel), cada una de uno o dos píxeles de ancho. Umbralizar y seguir líneas a esa escala es frágil. Pero la trama es muy regular: rayas a 45°, de paso casi constante. Entonces `tools/1-clases.mjs` hace, sobre el escaneo en gris, lo siguiente.

Para cada punto de una grilla a media resolución (un punto cada dos píxeles: 1,35 m) toma una ventana de 12 × 12 píxeles y calcula su correlación con una onda compleja a lo largo de cada diagonal:

- *a* = |Σ g(x, y) · e^(2πi(x+y)/P)| / 144, la respuesta a rayas que bajan hacia un lado;
- *b* = |Σ g(x, y) · e^(2πi(x−y)/P)| / 144, la respuesta a las del otro lado;
- *M*, el gris medio de la ventana.

Es un coeficiente de Fourier local, o un filtro de Gabor de ventana rectangular, evaluado en una sola frecuencia por diagonal. Tres detalles importan. Primero, el paso de la trama no es idéntico en todo el pliego, así que se prueban tres períodos horizontales, *P* = 4,2, 5,05 y 6,1 píxeles, y se toma la mayor respuesta de cada diagonal (en lo edificado del recorte de la figura 3 gana 6,1 en el 96,7 % de los puntos; `paper/medidas/clases.txt`). Segundo, como la ventana no contiene un número entero de períodos, la suma de la onda no es cero y un gris parejo daría respuesta: se resta el aporte del gris medio (*M* por la suma de la onda en la ventana), de modo que una mancha lisa, por oscura que sea, no pasa por rayado. Tercero, la onda es separable, así que cada ventana cuesta dos pasadas de 12 productos por fila y no 144 productos complejos por diagonal.

Con *a*, *b* y *M* se decide una de cinco clases, con umbrales fijos en niveles de gris (0 a 255):

| Clase | Regla | Qué es en el plano |
|---|---|---|
| edificado | mín(*a*, *b*) ≥ 8,5, mín ≥ 0,4 · máx y *M* < 165 | rayado cruzado: hay respuesta en las dos diagonales |
| patio o fondo | máx(*a*, *b*) ≥ 12 y *M* < 175 | rayado simple: una sola diagonal |
| negro lleno | *M* < 88 | tinta maciza: iglesias, edificios públicos |
| otra tinta | *M* < 150 | líneas, letras, olas del río, símbolos |
| papel | lo demás | calles, plazas, campo |

Las reglas se prueban en ese orden. La condición mín ≥ 0,4 · máx separa el rayado cruzado del simple cuando una diagonal «se filtra» en la otra. Los umbrales se fijaron mirando: el agente generaba la imagen de clases en falso color sobre recortes del centro, del norte, del oeste y de la Boca, y ajustaba. No hubo un conjunto de validación etiquetado.

El resultado (figura 3) es una imagen de clases de 9.459 × 6.636 puntos. Dentro de la guarda del plano (86,6 km²) el 87,0 % es papel, el 3,15 % edificado (272 ha), el 5,11 % patio o fondo (442 ha), el 0,27 % negro lleno y el 4,49 % otra tinta, antes de las correcciones del paso siguiente (`paper/medidas/clases.txt`). Para este artículo se reimplementó el paso sobre un recorte y coincide punto por punto con la imagen guardada (40.000 de 40.000).

![**Figura 3.** Las etapas de la lectura sobre un mismo recorte de 270 m (píxeles [9760, 9320] del escaneo). (a) El escaneo en gris. (b) El contraste estirado de 50–214 que se usa para las láminas que se muestran, no para leer. (c) Tono medio *M*. (d, e) Respuesta al rayado en cada diagonal: los fondos responden en una sola, lo edificado en las dos. (f) El mínimo de las dos: queda solo el rayado cruzado. (g) Las cinco clases (papel, crema; edificado, pardo oscuro; patio, verde; negro lleno, rojo; otra tinta, celeste). (h) Lo que llega al visor: los techos, un color por lote inventado, y los árboles. Hecha con `paper/medidas/fig-plano-clases.mjs` sobre el plano de 1867 (dominio público).](figuras/fig03-clases.png)

### 4.3 Lo chico, a resolución plena

La ventana de 12 píxeles no ve lo que mide menos que ella: las casillas de las orillas (rectángulos de tinta de 3 a 8 m) y los árboles (un borrón de 4 a 8 píxeles). Para eso `tools/chicas.mjs` trabaja sobre el escaneo entero, sin submuestrear, con otra idea: «tinta gruesa». Un píxel es núcleo de tinta gruesa si en su vecindad de 5 × 5 hay al menos 18 píxeles más oscuros que 160; así las rayas finas del rayado y las líneas de los cercos no cuentan, y sí los rellenos. Los núcleos se agrupan en componentes conexas y a cada una se le ajusta el rectángulo girado de menor área, probando 18 ángulos.

Una componente es *casilla* si llena al menos el 70 % de su rectángulo, mide más de 3,5 píxeles de ancho y entre 5 y 46 de largo, es oscura (tono medio < 92) y casi no tiene claros adentro. Es *árbol* si tiene entre 8 y 170 píxeles, es redondeada (relación de lados < 2,2) y llena al menos la mitad de su rectángulo. Como las letras también son borrones de tinta, antes se marcan las zonas de texto: una componente de trazo que se extiende mucho (más de 260 píxeles y más de 22 de lado menor en el relleno por inundación) se toma por letra, y lo que cae sobre ella no es árbol ni casilla. La muestra de la sección 6.3 enseña que este filtro falla en las quintas.

### 4.4 De las clases a la ciudad

`tools/2-ciudad.mjs` convierte la imagen de clases en geometría. Los pasos, en orden:

**Máscaras.** Fuera de la guarda y dentro de los recuadros de la cartela, la rosa de los vientos y la tabla de referencias (una lista corta de rectángulos puesta a mano en `tools/plano.mjs`) todo se vuelve papel.

**Manzanas.** La unión de edificado, patio y negro se abre morfológicamente (erosión y dilatación) para cortar los hilos de tinta que unen manzanas vecinas, y se separa en componentes conexas. A cada componente grande se le ajusta un cuadrilátero: envolvente convexa, reducción a cuatro vértices y ajuste de una recta por lado con componentes principales. Si el cuadrilátero cubre bien la componente (intersección sobre unión ≥ 0,86) queda; si no, se usa un rectángulo orientado según el voto de las direcciones del gradiente. El archivo final tiene 3.633 registros de «manzana», de los cuales solo 459 son manzanas urbanas de más de 45 m de lado; los demás son edificios sueltos y casillas (`paper/medidas/inventario.txt`).

**Qué es techo.** Dentro de cada manzana se arma una grilla de un metro y cada celda recibe la clase del plano. Tres correcciones: la tinta fina del borde propaga la clase de su vecina (tres pasadas); se limpian por inundación las motas edificadas de menos de 30 celdas y los huecos de menos de 36; y se aplica apertura y cierre de 3 m. La cuarta corrección responde a un defecto del escaneo: en algunas zonas el rayado simple, mal resuelto, produce un batido que responde en las dos diagonales y pasa por rayado cruzado. Como el rayado cruzado tiene el doble de tinta, es más oscuro; así que en cada manzana se comparan el tono típico de lo dado por edificado y el del patio y, si difieren en al menos 12 niveles, se exige que lo edificado sea más oscuro que un umbral puesto al 55 % del camino entre los dos. La sección 6.3 muestra que esto corrige parte del problema y no todo.

**Iglesias.** El plano las marca en negro lleno con una cruz blanca. Se cierra la clase «negro» con cinco pasadas (tapa huecos de unos 13 m, el ancho de la cruz), y son candidatos los rectángulos que se llenan al 68 % o más y miden de 18 a 105 m por 9 a 46 m. Las del centro que el plano dibuja pegadas a su convento no se separan solas: van en una lista a mano (`IGLESIAS` en `tools/plano.mjs`), junto con una lista de falsos positivos. Quedan 16.

**Lo inventado, con reglas.** El plano no dibuja lotes, alturas ni aberturas. Se inventan, y el código lo dice:

- *Lotes.* Cada frente de manzana se parte en lotes de ancho tomado de una lista de múltiplos aproximados de 10 varas (8,66 m): 8, 9, 9, 9, 9, 10, 11, 13, 13, 17, 17, 22 y 26 m, con corte forzado donde la profundidad de lo edificado salta 4 m o más. Resultan 17.143 lotes.
- *Pisos.* La probabilidad de dos y de tres pisos decae con la distancia *d* a la Plaza de la Victoria: p₃ = 0,17 · e^(−d/520 m) y p₂ = 0,66 · e^(−d/1300 m) + 0,05. El promedio de 1867 da 1,11 pisos.
- *Techos y muros.* Lo edificado de cada lote se cubre con rectángulos por un algoritmo voraz (52.521 techos) y se le levantan muros de tres tipos: a la calle, al patio y medianera (146.487).

### 4.5 El agua y la orilla de 1867

El río está dibujado con olas, que para el lector son «otra tinta», igual que las letras. `tools/hoy.mjs` lo recupera con una semilla y una propagación: un polígono marcado a mano unos 50 m río adentro (`AGUA` en `tools/plano.mjs`) crece primero por papel limpio, hasta 380 m, guardando 5 m de distancia a cualquier construcción, y después por tinta de olas, hasta 95 m; se cierra y se abre para emparejar; las islas de menos de 6.000 puntos pasan a río. Donde había construcciones sobre la costa la propagación se mete tierra adentro, y hubo que marcar a mano polígonos de tierra firme (`SECO`). El resultado es la orilla de 1867, que sirve tres veces: de suelo en el modo en color, de cota cero para el relieve y, restada del agua de hoy, de medida de la tierra ganada al río.

### 4.6 Georreferencia

El visor trabaja en el marco del plano (píxeles del escaneo) y solo necesita la georreferencia para traer cosas de hoy: calles, curvas de nivel, plantas de edificios, direcciones. Va en dos pasos.

**Paso grueso: afín con edificios.** `tools/geo.mjs` lleva la latitud y longitud a metros locales desde la Plaza de Mayo y ajusta por mínimos cuadrados una transformación afín con 16 referencias (iglesias, el Cabildo, mercados, plazas) de las que se conoce el lugar en el plano y las coordenadas de hoy, tomadas de Wikipedia en español. Las que quedan a más de 60 m se descartan y se reajusta: salen dos (la Plaza del Parque, a 64,6 m, y la Plaza de Marte, a 200,8 m; son plazas, y su «punto» es ambiguo) y quedan 14.

**Paso fino: calce de calles.** `tools/calce.mjs` parte de una observación: en el centro la traza no cambió, una calle de 1867 sigue siendo calle. Entonces:

1. Se toman de OpenStreetMap las calles angostas (`residential`, `tertiary`, `unclassified`, `living_street`, `pedestrian`; no túneles ni puentes) y se muestrean cada 4 m. Las avenidas se excluyen porque se ensancharon, casi siempre de un solo lado.
2. La imagen de clases se convierte en puntaje: papel +1, edificado, patio o negro −1, otra tinta 0.
3. El plano se cubre con ventanas de 420 m solapadas a la mitad. En cada una con al menos 250 puntos de calle se suma, para cada corrimiento posible dentro de un radio (37 puntos de clase, unos 50 m, en la primera vuelta; 14 después), el puntaje bajo los puntos de calle corridos.
4. Una ventana solo cuenta si es un calce de verdad: el mejor corrimiento deja casi todo sobre papel (puntaje/n ≥ 0,72), es mucho mejor que el promedio (diferencia/n ≥ 0,3) y se pierde al correrse 8 puntos en *cualquiera* de los dos sentidos (caída/n ≥ 0,22 en cada eje). Esta última condición descarta las ventanas con calles en una sola dirección, que no dicen nada de la otra. Como el pico es una meseta del ancho de la calle, se toma su centro de masa.
5. Con los pares (lugar de hoy → lugar en el plano) se ajusta el modelo: un afín nuevo, en el que las ventanas pesan 1 y los 14 edificios 0,25 (atan las afueras, donde no hay ventanas), y encima un campo de corrección local, el promedio de los residuos de las ventanas vecinas ponderado por una campana de σ = 350 m, con un «freno» de 0,35 en el denominador que lo apaga lejos de los datos:

   corrección(p) = Σ wᵢ · rᵢ / (0,35 + Σ wᵢ), con wᵢ = e^(−|p − pᵢ|² / 2σ²).

6. Se repite cuatro veces, recalzando desde el modelo anterior, y en cada vuelta se descartan las ventanas que, ajustando sin ellas, quedan a más de 14 m.

Quedan 104 ventanas (figura 4). El modelo son seis números del afín y 104 vectores, guardados en `tools/geo.json`; la misma función corre en las herramientas y en el navegador (`src/geo.js`), y la inversa se resuelve por Newton.

![**Figura 4.** El calce de calles. (a) Un recorte de 419 m del plano con las calles angostas de hoy llevadas al plano por el afín de referencias (azul) y por el ajuste fino (rojo); es la ventana cuyo corrimiento (9,8 m) está más cerca de la media, no la peor. (b) Las 104 ventanas que calzaron y su corrimiento respecto del afín de referencias, exagerado 40 veces: solo hay ventanas donde la ciudad de 1867 tenía calles edificadas. Plano de 1867 (dominio público); calles © los colaboradores de OpenStreetMap (ODbL). Hecha con `paper/medidas/fig-calce.mjs`.](figuras/fig04-calce.png)

### 4.7 Los planos posteriores

**Calce.** Cada plano posterior se lleva al marco del de 1867 (`tools/epocas.mjs`) en dos pasos análogos. El grueso es un afín con cinco o seis plazas marcadas a mano en los dos planos. El fino es automático y calza contra las calles de hoy, ya dibujadas en el marco de 1867: el plano se pasa a gris (0,3 R + 0,5 G + 0,2 B), se le resta el fondo con un promedio móvil de unos 40 m para que queden solo las líneas, y en tres pasadas de ventanas cada vez más chicas se busca el corrimiento que mejor superpone sus calles con las de hoy. Se aceptan los picos con puntaje z ≥ 3,2, se ajusta un polinomio de segundo grado de forma robusta (cuatro vueltas descartando lo que supera 2,5 veces la mediana del residuo) y se guarda el plano remuestreado a 4.096 píxeles de ancho. No medimos el error de este calce por separado (sección 8).

**Señas de color.** Los planos posteriores no se muestran ni se vectorizan: solo se les pregunta, lote por lote, si ahí había ciudad. Cada uno marca lo edificado de otra manera, así que cada uno tiene su «seña» (`SEÑAS` en `tools/crece.mjs`), una fórmula sobre los canales de color seguida de un desenfoque gaussiano y un umbral:

| Plano | Cómo marca lo edificado | Seña (por píxel) | Radio (2σ del desenfoque) | Umbral |
|---|---|---|---|---|
| 1888 | punteado rosado | (R − (G + B)/2 − 12) · 5 | 34 m | 96 |
| 1895 | rayado cruzado negro | (205 − luma) · 2,4 | 13 m | 118 |
| 1905, 1909 | relleno rosa | (R − G − 30) · 5, solo si G − B < 62 | 26 m | 90 |
| 1921 | relleno rosa | la misma | 16 m | 90 |
| 1936 | rayado rosa | (R − G − 15) · 22, solo si G − B < 75 | 18 m | 90 |

El desenfoque cumple acá el papel que la ventana cumplía en 4.2: convierte una trama (puntos, rayas) en una densidad. La condición sobre G − B separa el rosa de lo edificado del amarillento del papel envejecido. El plano de 1936 tiene además pruebas de «papel» y de «parque» (verde), que sirven para no edificar plazas, y de celeste, que sirve para leer la costa.

### 4.8 Reglas de crecimiento

`tools/crece.mjs` decide qué aparece en cada etapa:

- **Manzanas.** Fuera de lo que el plano de 1867 ya trae, las manzanas son las que dejan las calles de hoy (OpenStreetMap), con un semiancho por clase de calle.
- **Cuándo se edifica un lote.** En el primer plano cuya seña lo da por construido, *si alguno de los siguientes lo confirma*. La confirmación protege contra un error de lectura o de calce en un solo plano.
- **Las casas.** Inventadas con la receta de 1867 (frente en múltiplos de 10 varas), sin pisar lo que el plano de 1867 ya trae edificado, ni sus calles, ni las plazas. Con los años vienen más altas, y más cuanto más cerca del centro. Una «lotería de renovación» (`RENUEVA`) reemplaza en cada etapa una parte de las casas de 1867 por edificios más altos: la probabilidad es del 5 al 17 % según la etapa en la plaza y decae con la distancia (e^(−d/1500 m)); desde 1921 una zona central, la *city*, se renueva con probabilidad mucho mayor (hasta 0,78 en 1940), porque las fotos de la época muestran ahí cuadras enteras de ocho a diez pisos.
- **Obras fechadas.** Las avenidas y plazas nuevas (Avenida de Mayo, 1895; Plaza del Congreso, 1910; las diagonales, 1921 y 1940; los ensanches de Corrientes y Santa Fe; la 9 de Julio, 1940) no salen de los planos: la traza es la de la calle de hoy con el ancho que tuvo cada una, y el año de cada tramo sale de la historia de la obra, anotado a mano en `OBRAS`. Toda casa de 1867 que pisa la traza se va entera.
- **El puerto y la costa.** La costa de Puerto Madero está calcada a mano sobre el plano de 1905 y los diques son los de hoy; la de Retiro y la Costanera se lee del celeste del plano de 1936 dentro de una zona marcada a mano; el Puerto Nuevo se toma del mapa de hoy, porque el plano de 1936 lo dibuja corrido.

El resultado se codifica de forma compacta. Para el suelo, tres imágenes (`crece.webp`, `despeje.webp`, `calles.webp`) cuyos canales guardan *desde cuándo*: el valor 255 · (N − i)/N significa «desde la etapa i», y el sombreador compara con la etapa actual. Para la geometría, `crece.pak` trae techos y muros con la etapa en que nacen y en que mueren. Así el paso de una etapa a otra es un cambio de un número en el sombreador, sin cargar nada nuevo.

### 4.9 Relieve

El plano dibuja la barranca con rayitas pero no la mide. `tools/relieve.mjs` usa las curvas de nivel de hoy: las pasa al plano con la georreferencia, las rasteriza en una grilla de 512 × 359 celdas (24,9 m), fija en cero el río de 1867, inicializa cada celda con la cota fija más cercana y relaja con 3.000 pasadas de Jacobi (cada celda libre toma el promedio de sus vecinas), con una rampa que limita la subida desde la orilla (h ≤ 0,5 + 0,12 · d). Una primera versión con el modelo SRTM se descartó porque en el centro mide los techos y no el suelo. El relieve está apagado por defecto: lo decidió la persona al ver un edificio modelado a mano inclinado sobre la pendiente.

### 4.10 Calcos a mano

Lo que el lector automático no distingue se calcó a mano sobre el escaneo, como listas de puntos con su comentario. En `tools/plano.mjs`: la semilla del río; el eje del Riachuelo, en tres tramos con su ancho (el plano lo dibuja con olas finas entre dos orillas y el lector no lo separa del campo; el propio archivo anota que el eje calza con el grabado a unos 10 m hasta el Puente Alsina y a unos 20 m más arriba); el arroyo Maldonado y los demás arroyos; la tierra firme de la costa. En `src/vias.js`, las vías del ferrocarril de 1867. En `tools/crece.mjs`, la costa de 1905 y las zonas dentro de las cuales se lee la costa de 1921 y 1940. Los trazos se suavizan (dos pasadas de Chaikin) y se engrosan. Son pocos, y son la parte del modelo que depende del ojo de quien calca, que acá es un modelo de lenguaje mirando recortes ampliados.

### 4.11 Modelado a mano por época y criterio de evidencia

Las reglas dan una ciudad genérica. Los edificios y las plazas que cualquiera reconoce se modelaron a mano, con piezas simples (cajas, prismas, cúpulas, tejados) escritas en código: 18 archivos en `src/lugares/` más los edificios de `src/hitos.js`, con 33 plantas tomadas de OpenStreetMap. Cada lugar cambia con la línea de tiempo: la Plaza Constitución, por ejemplo, tiene seis estados (figura 6).

El criterio de evidencia está escrito en la cabecera de cada archivo y es siempre el mismo:

1. Cada estado cita de dónde sale cada cosa: el título de la foto en Wikimedia Commons con su autor y año, el plano que dibuja el trazado, la foto aérea, el texto que da una fecha.
2. El lugar y el tamaño vienen del plano o del mapa de hoy; la forma, de las fotos; y es una simplificación.
3. Lo que ninguna fuente dice se declara ahí mismo. Dos ejemplos tomados del código: de las carretas del Mercado de Constitución, «cuántas eran y dónde paraba cada una no lo dice ninguna fuente»; del estado de 1921, del que hay una sola foto, «es una aproximación».
4. Lo que no tiene evidencia no se modela. La documentación del proyecto lista las estaciones y mercados que quedaron sin modelo propio porque no se halló imagen de cómo eran en 1867.

Las 114 fichas del visor (95 con foto) repiten ese criterio para el público: dicen qué es del plano, qué de la foto y qué supuesto.

![**Figura 6.** Una plaza hecha a mano y su evidencia: la Plaza Constitución (`src/lugares/plaza-constitucion.js`). (a) Esteban Gonnet, «Mercado de Constitución», 1864. (b) El visor en 1867: carretas en el hueco que el plano deja libre; el suelo es el dibujo del plano. (c) El Plano Topográfico de 1895, girado para que el norte quede arriba: canteros de bordes curvos. (d) El visor en 1895: los canteros, la avenida, la gruta al norte y el lago. El visor simplifica: dibuja menos canteros que el plano. Fuentes: (a) Wikimedia Commons, dominio público; (c) Oficina de Obras Públicas de la Municipalidad, 1895, Wikimedia Commons, dominio público; (b, d) tomas propias. Hecha con `paper/medidas/fig-plaza.mjs`.](figuras/fig06-plaza.png)

### 4.12 El sombreado de tinta

La decisión de diseño más importante del visor es que **el suelo y las azoteas son el plano**: la textura de cada techo es el pedazo del escaneo que tiene debajo, de modo que, vista desde arriba, la ciudad levantada coincide con el pliego (figura 7). El sombreador (`src/tinta.js`, un material Lambert de three.js modificado al compilar) hace el resto:

- *Afilado del grabado.* El escaneo se muestra con un umbral suave alrededor de 0,52 cuyo ancho se escala con las derivadas de pantalla, así la tinta queda nítida a cualquier distancia sin dientes de sierra. De cerca se piden teselas del escaneo a tamaño completo (35 teselas de 3.072 píxeles).
- *Rayado redibujado.* Muy de cerca el rayado del escaneo se vuelve una mancha; en las azoteas el sombreador lo cambia por el mismo rayado cruzado, vuelto a trazar con líneas limpias.
- *Muros.* Color de papel, con la sombra propia hecha de rayas, y puertas y ventanas procedimentales.
- *Follaje* en tres tonos.
- *Contornos y papel.* Una pasada de pantalla (`src/pagina.js`) traza líneas donde la segunda diferencia del búfer de profundidad salta, y agrega grano de papel y viñeta.
- *Lo de hoy.* Las calles y la costa actuales se pueden superponer; la tierra ganada al río se marca con un rayado que guarda su paso en la pantalla (cada nivel dobla el anterior).

El modo en color, que es con el que abre hoy el visor, usa la misma geometría con colores inventados y declarados como tales (el plano no dice de qué color era nada). La línea de tiempo y la «ola» con que la ciudad se levanta desde la plaza son comparaciones contra un número en el mismo sombreador.

![**Figura 7.** El modo de tinta en la Plaza de la Victoria, 1867. Las azoteas y el suelo llevan el propio grabado (se lee «VICTORIA» en el suelo y el rayado cruzado en los techos); los muros, los contornos y los árboles son del sombreador; el Cabildo, la Catedral, la Recova, la Pirámide y el Teatro Colón están modelados a mano. Toma propia del visor.](figuras/fig07-tinta.jpg)

### 4.13 Empaquetado y rendimiento en teléfonos

- **Geometría.** La ciudad viaja como tablas binarias de registros fijos (una manzana, 10 números de 32 bits; un techo o un muro, 8 enteros de 16 bits en coordenadas de la grilla de su manzana). `tools/empacar.mjs` reordena cada tabla por planos de bytes (todos los primeros bytes juntos, todos los segundos, y así) antes de comprimir con gzip al máximo: los bytes altos, que casi no cambian de un registro al siguiente, quedan contiguos y comprimen mucho mejor. Las cuatro tablas de 1867 pasan de 3,76 MB a 1,35 MB. El navegador las abre con `DecompressionStream`.
- **Láminas.** `tools/3-laminas.mjs` genera el plano en gris con el contraste estirado linealmente (50 → negro, 214 → blanco) a 1.024, 2.048, 4.096 y 8.192 píxeles, más las teselas. Este es el único «tratamiento de contraste» del proceso y es de presentación.
- **Carga por etapas.** Primero una lámina de 131 kB para que haya algo que ver; después la ciudad; las láminas finas, la línea de tiempo, el color y «lo de hoy» se piden cuando hacen falta, y en teléfonos en versiones de la mitad de tamaño.
- **Pruebas.** Scripts con Chromium sin ventana prueban la carga con red y procesador frenados (`tools/carga.mjs`), los gestos táctiles, las fichas, los modos de recorrer y el buscador.

## 5. El método de trabajo agente–humano

Describimos el arreglo tal como quedó registrado, sin citar texto de las conversaciones.

**Reparto.** La persona pide en lenguaje corriente, en mensajes cortos; el agente lee el código, decide cómo hacerlo, lo hace, lo prueba y cuenta qué hizo. En el historial disponible (20 sesiones del 16 y el 17 de noviembre de 2026; `paper/medidas/historial.txt`) hay 113 mensajes escritos por la persona, de 137 caracteres en promedio, 12 de ellos con una captura de pantalla adjunta; del otro lado, 3.473 llamadas a herramientas del agente, de las cuales 1.953 son comandos de terminal y 1.320 lecturas de archivos. Ese historial cubre el crecimiento de 1888 a 1940, los lugares por época, los modos de recorrer y la publicación. **No cubre la construcción de la base de 1867** (el lector del rayado, la georreferencia), que es anterior: de esa parte el método está documentado por el código y sus comentarios, no por un registro de sesiones.

**El papel del *meat proxy*.** Leyendo los pedidos, su intervención cae en cinco clases: (1) decidir qué se hace (agregar la línea de tiempo, los trenes, el subterráneo, los autos de época) y qué se saca (el relieve, apagado tras verlo); (2) señalar defectos mirando el visor, a menudo con una captura («hay edificios rotos», colores donde no debían estar); (3) corregir historia (casas bajas donde en 1940 ya había edificios de ocho o diez pisos; arcos que el Cabildo ya había perdido en cierta fecha); (4) aportar fuentes (el catálogo de planos; el nombre del autor del plano); y (5) aprobar la publicación después de probar. También preguntó, más de una vez, cuán exactos eran los edificios, y la respuesta quedó escrita en la documentación como la lista de lo inventado.

**Verificación por capturas.** El agente no ve la pantalla: ve imágenes que él mismo genera. `tools/shot.mjs` abre el visor en un navegador sin ventana con GPU real, pone la cámara y el año pedidos y deja un PNG que el agente mira. Se corrió 232 veces en el historial. La imagen de clases en falso color, las imágenes de corrimientos del calce y las de las señas de cada plano cumplen la misma función para el procesamiento. Es la principal defensa contra el error típico de un modelo de lenguaje, que es dar por hecho lo que escribió.

**Subagentes con fuentes obligatorias.** El trabajo en paralelo se repartió en 19 sesiones delegadas, cada una con un encargo escrito por el agente principal. Los encargos de modelado tienen una forma fija: la lista de edificios en orden de prioridad; la instrucción de comprobar cada dato antes de modelar (año, esquina, altura, cómo era en la fecha de la etapa) *sin darlo por bueno porque lo diga el encargo*; la de decir en el informe lo que no se pudo confirmar en vez de inventarlo; y la de dejar afuera lo que no tenga fotos o no caiga en el plano («vale más cuatro bien hechos que siete flojos», dice uno). Para no pisarse, cada subagente tiene su archivo, su puerto para las capturas y un candado sobre los generadores compartidos.

**Pruebas automáticas.** Nueve scripts de prueba con navegador real; se corrieron 129 veces en el historial. Prueban que el visor funcione (carga, gestos, fichas, modos), no que la ciudad sea históricamente correcta.

**La regla de separar lo que es del plano de lo inventado.** Es la convención que ordena todo lo anterior. Está en tres lugares: en la documentación, que tiene una sección con dos listas («del plano» e «inventado, con las reglas de la época»); en el código, donde las listas hechas a mano tienen nombre propio y comentario; y en las fichas que lee el público. Este artículo intenta seguirla.

## 6. Resultados medidos

Cada cifra sale de un script de `paper/medidas/`, que solo lee del repositorio; la salida está guardada al lado.

### 6.1 Georreferencia

(`georef.mjs` → `georef.txt`. El script no vuelve a correr el calce: reconstruye los pares de control desde `tools/geo.json` y repite las cuentas con las funciones del repositorio.)

| Qué se mide | n | Media | Mediana | Máximo |
|---|---|---|---|---|
| Afín de referencias, residuo en los 14 edificios usados | 14 | 22,5 m | 21,3 m | 41,5 m |
| Lo mismo, dejando un edificio afuera por vez | 14 | 30,6 m | 29,0 m | 52,9 m |
| Ventanas de calles contra el afín de referencias | 104 | 9,7 m | 7,5 m | 26,2 m |
| Ventanas contra el afín fino, sin campo | 104 | 7,3 m | — | 21,5 m |
| Ventanas contra afín + campo (dentro de la muestra) | 104 | 2,4 m | 2,1 m | 8,3 m |
| Validación cruzada por zonas de 300 m | 104 | 3,1 m | 2,4 m | 13,3 m |
| Validación cruzada por zonas de 700 m | 104 | 3,9 m | 3,3 m | 13,2 m |
| Lo mismo, solo afín | 104 | 8,2 m | — | — |
| Dejando una ventana afuera por vez | 104 | 2,8 m | 2,4 m | 10,3 m |

Tres lecturas. Primero, los edificios son un mal patrón: su residuo (22,5 m) es mayor que el de las calles contra ese mismo afín (9,7 m), porque el «punto» de un edificio en el plano y su coordenada de hoy no designan lo mismo con precisión; el ajuste fino, de hecho, casi no mejora el residuo en los edificios (20,7 m). Segundo, el calce de calles lleva el desajuste con el callejero de hoy de unos 10 m a 2–4 m, que es menos que el ancho de una calle (10 varas, 8,7 m). Tercero, el plano no es exactamente afín ni está exactamente a su escala nominal: el afín fino da 0,683 m/px en un eje y 0,679 en el otro contra los 0,675 de la regla de las 150 varas, con el norte girado 4,2° respecto del eje del escaneo, y el campo local recoge deformaciones de unos metros (papel, pliegues, montaje de las hojas).

Dos advertencias. Los residuos de validación cruzada están **sesgados hacia abajo**: el procedimiento ya descartó las ventanas que quedaban a más de 14 m al dejarlas afuera, así que las 104 sobrevivientes son, por construcción, las que el modelo predice bien. Y las ventanas cubren solo la ciudad edificada de 1867 (de 3,1 km al oeste a 0,2 km al este de la plaza y de 2,0 km al sur a 1,6 km al norte; figura 4b). Afuera el modelo es el afín sin corrección: en las esquinas de la guarda, el ajuste fino y el grueso difieren entre 33 y 40 m, y no tenemos con qué decir cuál está más cerca.

### 6.2 Inventario por etapa

(`inventario.mjs` → `inventario.txt`.) En 1867: 3.633 registros de manzana (459 manzanas urbanas), 17.143 lotes, 52.521 techos, 146.487 muros, 35.658 árboles leídos del plano y 16 iglesias. En el modo en color se agregan 15.382 árboles y 322 aljibes inventados en los patios.

| Etapa | Cuerpos edificados en pie | Techos | Muros | Casas nuevas (acumulado) | Renovadas | Superficie de techos | Pisos (media) | Tierra ganada al río (acum.) |
|---|---|---|---|---|---|---|---|---|
| 1867 | 16.599 | 52.521 | 146.487 | — | — | 275 ha | 1,11 | — |
| 1888 | 37.612 | 83.956 | 258.781 | 21.467 | 96 | 677 ha | 1,20 | 0,01 km² |
| 1895 | 46.824 | 98.144 | 311.799 | 30.817 | 81 | 854 ha | 1,21 | 3,73 km² |
| 1905 | 49.925 | 103.060 | 329.820 | 33.959 | 84 | 912 ha | 1,21 | 3,74 km² |
| 1910 | 55.306 | 110.982 | 359.604 | 39.485 | 87 | 1.017 ha | 1,22 | 3,76 km² |
| 1921 | 57.810 | 112.726 | 372.237 | 42.132 | 857 | 1.063 ha | 1,29 | 6,24 km² |
| 1940 | 64.007 | 116.832 | 399.731 | 48.721 | 1.945 | 1.173 ha | 1,47 | 7,76 km² |

Entre 1867 y 1940 la superficie techada del modelo se multiplica por 4,3 y se retiran 14.060 de los 52.521 techos de 1867 (el 27 %), por las avenidas nuevas y por la renovación. La tierra ganada salta en 1895 (Puerto Madero) y en 1921–1940 (Puerto Nuevo y Costanera); hasta hoy suma 11,57 km² dentro del marco. **Estas cifras describen el modelo, no la ciudad**: el número de casas es consecuencia de la regla de lotes, y la superficie techada, de las señas de color y de la profundidad edificada que se inventa en cada lote nuevo. No las contrastamos con censos (sección 8).

![**Figura 5.** La misma zona (la Plaza de Mayo y el puerto; el norte arriba) en las siete etapas, y abajo a la derecha 1867 en tinta. Se ven la unión de las dos plazas (1888), la Avenida de Mayo y Puerto Madero (1895), los docks (1905), la Diagonal Norte (1921) y los edificios altos del centro (1940). Tomas propias del visor con `tools/shot.mjs`; lámina armada con `paper/medidas/fig-etapas.mjs`.](figuras/fig05-etapas.png)

### 6.3 Evaluación de la lectura automática sobre una muestra chica

(`muestra.mjs` → `muestra.txt`; el conteo, en `muestra-conteo.md`.) No hay verdad de campo para 1867. Lo que se puede evaluar es si el visor reproduce lo que *el plano dibuja*, comparando por otro camino: el ojo. Elegimos tres recortes de 300 × 300 m por una regla fijada antes de mirarlos: sobre el eje que sale de la Plaza de la Victoria hacia el oeste, a 0,5, 2,0 y 3,5 km (centro, borde y quintas). El agente contó sobre láminas ampliadas al triple, con una grilla de referencia. La unidad es el «cuerpo edificado»: cada tramo continuo de rayado cruzado, sea un frente de manzana entre dos esquinas o un edificio suelto.

| Recorte | Cuerpos dibujados | Con techos | A medias | Sin techos | Grupos de techos falsos | Árboles dibujados | Árboles hallados, ciertos | Árboles falsos |
|---|---|---|---|---|---|---|---|---|
| 0,5 km (centro) | 24 | 21 | 3 | 0 | 0 | 0 | 0 | 3 |
| 2,0 km (borde) | 33 | 31 | 1 | 1 | 8 | ≈ 39 | 31 | 0 |
| 3,5 km (quintas) | 17 | 9 | 1 | 7 | 0 | 2 | 2 | 15 |
| Total | 74 | 61 | 5 | 8 | 8 | ≈ 41 | 33 | 18 |

![**Figura 8.** La muestra de evaluación: para cada recorte, el escaneo, las clases del paso 1 (colores como en la figura 3) y lo que llega al visor (techos, un color por lote, y árboles en círculos verdes). Arriba, el centro: los frentes edificados y los fondos se separan limpiamente. En el medio, el borde: por el recorte pasa la junta entre las dos mitades del pliego (la línea horizontal); debajo de ella el rayado simple responde como cruzado y aparecen techos falsos dentro de los fondos. Abajo, las quintas: los edificios sueltos se pierden o se toman por árboles, y hay árboles falsos sobre cercos y letras. Plano de 1867 (dominio público). Hecha con `paper/medidas/muestra.mjs`.](figuras/fig08-muestra.png)

Lo que la muestra enseña:

- **En el casco urbano la lectura del rayado funciona.** Los 24 frentes del centro tienen techos y ningún fondo quedó edificado. Los nombres de calles y los números de referencia no se volvieron edificio.
- **El defecto dominante está ligado al escaneo, no a la ciudad.** Los ocho grupos de techos falsos están en una sola manzana, pegada a la junta de las dos mitades del pliego, donde la imagen es más borrosa y el rayado simple responde en las dos diagonales. La corrección por tono de 4.4 saca una parte.
- **Fuera del casco el lector de lo chico es poco fiable.** De siete edificios sueltos en las quintas, uno sale como casa, dos como árbol y cuatro no salen. De 17 árboles hallados ahí, dos son árboles: seis caen sobre cercos dibujados como una línea festoneada, cuatro sobre letras, tres sobre matas de pasto y dos sobre edificios. En cambio, donde hay árboles de verdad (una plaza arbolada) se hallan 29 de unos 36, sin falsos.
- **La partición en lotes es inventada en todos los casos** y a veces se nota: en dos lados de una manzana del centro los techos salen como tiras largas a lo largo del frente.

La muestra es chica (0,27 km² de 86,6), sobre un solo eje, sin recorte en la Boca ni en la barranca del norte, y la contó un solo observador que además es el autor del sistema. Los porcentajes que se pueden sacar de la tabla (61 de 74 cuerpos con techos; 33 de 51 árboles hallados son ciertos) son indicativos y no una estimación de la exactitud de todo el plano. Sirven, sí, para corregir una cifra que el proyecto venía repitiendo: los «unos 35.000 árboles, uno por cada árbol dibujado» incluyen una proporción de falsos que en las quintas es alta.

### 6.4 Descarga y tiempos de carga

(`conteos.mjs` → `conteos.txt`; `carga-publicada.txt`.) Lo que baja el navegador, por etapa de uso:

| Etapa de uso | Pantalla grande | Teléfono |
|---|---|---|
| El plano tendido (primera imagen) | 0,13 MB | 0,13 MB |
| La ciudad de 1867 (`ciudad.pak`) | 1,35 MB | 1,35 MB |
| La lámina entera del plano | 8,99 MB | 1,98 MB |
| Al salir de 1867 (línea de tiempo) | 2,95 MB | 2,55 MB |
| Al prender el color | 1,28 MB | 0,74 MB |
| «Lo de hoy» | 2,60 MB | 2,60 MB |
| Código (comprimido con brotli): visor y three.js | 0,25 MB | 0,25 MB |

Las 146 fotos pesan 30,8 MB en total y se piden de a una, al abrir una ficha.

Sobre el sitio publicado, con `tools/carga.mjs` emulando un teléfono (pantalla de 390 × 844, red 4G de 9 Mbit/s y 85 ms, procesador frenado cuatro veces), en tres corridas: el plano se ve a los 1,3–1,5 s con 0,47–0,55 MB transferidos y la ciudad está lista a los 4,4–4,9 s con 1,89 MB. Con una 4G lenta (1,6 Mbit/s, 150 ms), una corrida: 4,2 s y 12,4 s. Es una emulación en una computadora de escritorio, no una medición en teléfonos reales, y no medimos cuadros por segundo.

### 6.5 Lo hecho a mano, en números

18 archivos de lugares y 33 plantas de edificios con nombre; 149 marcas de época en el mapa (27 vigentes en 1867, 109 en 1940) y 51 marcas «de hoy»; 114 fichas, 95 con foto; 146 fotos con su licencia y su dirección de origen anotadas.

## 7. Discusión

**Qué hizo posible leer «más de lo que el escaneo parece tener».** No hay superresolución ni aprendizaje. Hay cuatro decisiones. (1) Tratar el rayado como textura y no como líneas: con rayas cada 4,3 píxeles, medir una frecuencia en una ventana es estable donde seguir trazos no lo es. (2) Usar dos resoluciones según el objeto: media resolución para las tramas, resolución plena para los borrones de tinta. (3) Usar el tono como segunda opinión donde la textura engaña. (4) En los planos en color, tomar el color como canal de información y promediarlo en el espacio para pasar de trama a densidad. Ninguna es nueva por separado; el aporte es mostrar que, en un plano de convención regular, alcanzan para levantar una ciudad entera, y medir dónde dejan de alcanzar.

**El papel en blanco como señal.** El calce de calles no reconoce nada en el plano: usa que las calles son lo que queda sin tinta entre manzanas rayadas. Eso lo hace barato y robusto en el casco urbano, y lo deja mudo donde no hay manzanas edificadas a los dos lados. La validación cruzada por zonas es la herramienta que justificó el diseño: con solo afín el error fuera de la muestra es de 8,2 m y con el campo local, 3,9 m; un campo más flexible habría ajustado mejor dentro de la muestra sin que supiéramos si generalizaba.

**El plano como textura.** Conservar el escaneo como superficie del modelo tiene una consecuencia metodológica: el error se ve. Un techo falso aparece como un bloque levantado sobre un fondo rayado, y un calce malo, como una calle de hoy que pisa una manzana. El visor es, además de un producto, el instrumento de inspección con el que se hizo.

**Lo inventado.** La mitad de lo que se ve (lotes, alturas, aberturas, colores, la forma de las casas nuevas) no es dato. Lo defendemos como se defiende una maqueta: sin esas reglas no hay ciudad que recorrer, y las reglas son pocas, están escritas y se pueden cambiar. Lo que no es defendible es confundir los niveles, y por eso la contabilidad de la sección 5.

**El agente.** La experiencia sugiere que un agente de programación puede sostener un proceso de este tipo de punta a punta si se cumplen dos condiciones: que pueda mirar lo que produce (las capturas) y que alguien que conoce el objeto mire también y diga que no. Buena parte de las correcciones históricas vino de la persona, no del agente.

## 8. Limitaciones y sesgos

**De la fuente.** El plano de 1867 es un documento administrativo: registra lo que al Departamento Topográfico le importaba y generaliza lo demás. Lo que llamamos «edificado» es lo que el grabador rayó en cruz. No lo cotejamos con el catastro ni con otros planos de la década.

**De la lectura.** Umbrales fijados a ojo, sin datos etiquetados. Sensibilidad a la calidad local del escaneo (la junta del pliego). El lector de casillas y árboles falla en las orillas y las quintas. Las iglesias pegadas a conventos van a mano. Los brazos finos del bañado de la Boca, una laguna y varias zanjas no están. No comparamos con ningún método aprendido ni con otro lector.

**De la evaluación.** Tres recortes, un observador que es un modelo de lenguaje y es el autor del sistema, sin segundo observador ni acuerdo entre observadores. No hay evaluación cuantitativa del calce de los seis planos posteriores, ni de las señas de color, ni de las reglas de crecimiento contra datos independientes (censos, catastros, fotografías aéreas). La tabla de crecimiento describe el modelo.

**De la georreferencia.** Fuera del casco de 1867 no hay control. Los residuos de validación cruzada están sesgados por el descarte previo. Las coordenadas de los edificios de referencia salen de Wikipedia.

**Del crecimiento.** Las etapas son fotos de siete planos, dos de ellos de un año distinto del rótulo. Entre plano y plano no se sabe cuándo se edificó cada lote. Las casas nuevas son genéricas; fuera de los edificios modelados a mano, el centro de 1940 es una aproximación de alturas. Las manzanas nuevas siguen el callejero de hoy, lo que supone que las calles abiertas después de 1867 no se movieron.

**Del relieve.** Es el de hoy: la barranca de 1867 era más abrupta.

**Del modelado a mano.** Depende de las fotos que hay en Wikimedia Commons, que retratan el centro, los edificios públicos y los paseos de la élite; los barrios populares, los conventillos y las orillas casi no tienen fotos y por lo tanto casi no tienen modelo propio. El visor hereda ese sesgo y lo amplifica, porque lo modelado a mano es lo que más se mira.

**De que el autor sea un modelo de lenguaje.** Conviene decir qué se verificó y qué no.

- *Verificado al escribir este artículo:* cada cifra de la sección 6 (salida de un script guardada); que cada técnica descrita está en el código, leyéndolo; la existencia, los autores, el año y el lugar de publicación de cada referencia bibliográfica, contra Crossref, arXiv o catálogos (el detalle, en `paper/NOTAS.md`); la ficha del plano de 1867 en Wikimedia Commons y la licencia de las curvas de nivel.
- *No verificado:* que el contenido de cada referencia respalde exactamente la frase en que se la cita (se leyeron títulos y resúmenes, no los textos completos); los datos históricos de las fichas y de las cabeceras del código, que el agente tomó de Wikipedia, de pies de foto y de los textos citados ahí y que ningún historiador revisó; la ficha y la licencia de la fotografía aérea de 1940; las licencias de las 146 fotos más allá de lo que declara Commons.
- *Riesgos propios:* un modelo de lenguaje puede escribir con seguridad algo falso, y puede «ver» en una imagen lo que espera ver. Los conteos a ojo de 6.3 los hizo el mismo sistema que escribió el lector. El historial de sesiones analizado cubre dos días y no la etapa en que se construyó la base de 1867.
- *Autoría:* el agente no puede responder por el trabajo, corregirlo después de publicado ni declarar conflictos de interés en el sentido que piden las revistas. Quien responde es la persona que figura como *meat proxy*.

## 9. Ética y licencias

**Licencias de las fuentes.** El plano de 1867 y los seis planos posteriores figuran en dominio público en sus repositorios (BnF/Gallica, Wikimedia Commons, American Geographical Society Library). Los datos de OpenStreetMap son © sus colaboradores bajo la licencia ODbL, y el visor lo acredita. Las curvas de nivel de la Ciudad de Buenos Aires se publican bajo CC BY 2.5 AR. Las 146 fotos figuran en Wikimedia Commons como dominio público y cada una se muestra con su autor, su fecha y el enlace a su página. Las figuras de este artículo usan solo esas fuentes y tomas propias del visor.

**Verdad histórica.** Un modelo 3D convincente puede pasar por documento. Las defensas del proyecto son tres: el suelo y los techos son el plano, a la vista; el modo en color declara que los colores son inventados; y las fichas dicen qué es supuesto. No alcanzan si alguien saca una captura del visor y la presenta como «Buenos Aires en 1895». Recomendamos citar el visor como reconstrucción.

**Nombres y personas.** El plano trae nombres de propietarios de quintas de 1867; se ven como parte del grabado y no se indexan ni se buscan. No se usan datos personales actuales. El buscador de direcciones consulta dos servicios públicos y no guarda nada.

**Uso de un modelo de lenguaje.** Todo el código, el modelado y este texto los produjo un modelo de lenguaje bajo dirección humana. Lo declaramos en la autoría y no en una nota al pie. No medimos el costo en cómputo ni en energía del trabajo.

## 10. Reproducibilidad

El repositorio contiene el código y los datos derivados; el escaneo y los planos se bajan de sus fuentes. Con Node.js 23 y las dependencias de `package.json` (three 0.186.1, vite 8.3.5, sharp 0.34, playwright-core 1.64):

```
# 1. el plano de 1867 → la ciudad (necesita fuentes/plano-1867.jpg)
npm run plano      # 1-clases, 2-ciudad, empacar, 3-laminas, osm, calce, hoy, calles

# 2. los planos posteriores y el crecimiento
node tools/epocas.mjs          # baja y calza los seis planos
node tools/crece.mjs           # señas, reglas y obras → crece.pak, crece.webp…
node tools/relieve.mjs         # curvas de nivel → relieve.bin
node tools/patios.mjs          # árboles y aljibes de los patios (modo color)
node tools/fotos.mjs           # fotos de las fichas

# 3. el visor
npm run dev                    # o: npx vite build

# 4. las mediciones y figuras de este artículo (solo leen)
node paper/medidas/georef.mjs      > paper/medidas/georef.txt
node paper/medidas/inventario.mjs  > paper/medidas/inventario.txt
node paper/medidas/conteos.mjs     > paper/medidas/conteos.txt
node --max-old-space-size=8000 paper/medidas/fig-plano-clases.mjs > paper/medidas/clases.txt
node --max-old-space-size=8000 paper/medidas/fig-calce.mjs        > paper/medidas/calce.txt
node --max-old-space-size=8000 paper/medidas/muestra.mjs          > paper/medidas/muestra.txt
node paper/medidas/relieve-puntos.mjs > paper/medidas/relieve-puntos.txt
node paper/medidas/fig-proceso.mjs && node paper/medidas/fig-etapas.mjs && node paper/medidas/fig-plaza.mjs
node paper/hacer.mjs               # paper.md → paper.html y paper.pdf
```

Las figuras 5, 6 y 7 necesitan antes las tomas del visor (`tools/shot.mjs`; los parámetros de cámara están en `paper/NOTAS.md`). El paso 1 es determinista (semilla fija). Los pasos que bajan datos de OpenStreetMap dependen de la fecha: el mapa de hoy cambia, y con él el calce y las manzanas nuevas; los archivos bajados quedan en `fuentes/osm/` y no se vuelven a pedir si ya están. El conteo a ojo de 6.3 no es reproducible en sentido estricto: se puede repetir sobre las mismas láminas (`paper/medidas/muestra/`).

## 11. Conclusiones

De un solo pliego grabado, sin anotaciones ni entrenamiento, se puede levantar automáticamente la estructura edificada de una ciudad de 1867 (qué parte de cada manzana tenía techo) con un filtro de textura de una frecuencia por diagonal y un puñado de reglas, y el resultado es bueno en el casco urbano y pobre en las orillas. Las calles de hoy, calzadas contra el papel en blanco del plano, llevan la georreferencia de unos 10 m a 2–4 m donde la ciudad ya estaba edificada. El crecimiento hasta 1940 es una mezcla declarada de lectura de color, reglas y fechas puestas a mano, y sus números describen un modelo. El trabajo lo hizo un agente de programación con una persona que decidía y miraba; lo que el agente pudo verificar está medido y lo que no, dicho. Lo que falta para que esto sea un resultado y no solo un método es una evaluación independiente: un segundo observador, más recortes, y el contraste del crecimiento con censos y catastros.

## Agradecimientos y datos

A quienes digitalizaron y liberaron las fuentes: la Bibliothèque nationale de France, la American Geographical Society Library, los colaboradores de Wikimedia Commons y de OpenStreetMap, el Gobierno de la Ciudad de Buenos Aires por sus datos abiertos, y la cátedra que mantiene el catálogo «Buenos Aires en cartografía». Código, datos derivados, mediciones y figuras: en el repositorio del proyecto, carpeta `paper/`.

## Referencias

Balletti, C. (2006). Georeference in the analysis of the geometric content of early maps. *e-Perimetron*, 1(1), 32–42.

Biljecki, F., Stoter, J., Ledoux, H., Zlatanova, S. y Çöltekin, A. (2015). Applications of 3D city models: State of the art review. *ISPRS International Journal of Geo-Information*, 4(4), 2842–2889. https://doi.org/10.3390/ijgi4042842

Chazalon, J., Carlinet, E., Chen, Y., Perret, J., Duménieu, B., Mallet, C., Géraud, T., Nguyen, V., Nguyen, N., Baloun, J., Lenc, L. y Král, P. (2021). ICDAR 2021 competition on historical map segmentation. En *Document Analysis and Recognition – ICDAR 2021*, Lecture Notes in Computer Science (pp. 693–707). Springer. https://doi.org/10.1007/978-3-030-86337-1_46

Chen, C.-C., Knoblock, C. A. y Shahabi, C. (2008). Automatically and accurately conflating raster maps with orthoimagery. *GeoInformatica*, 12(3), 377–410. https://doi.org/10.1007/s10707-007-0033-0

Chen, Y., Carlinet, E., Chazalon, J., Mallet, C., Duménieu, B. y Perret, J. (2021). Vectorization of historical maps using deep edge filtering and closed shape extraction. En *Document Analysis and Recognition – ICDAR 2021*, Lecture Notes in Computer Science (pp. 510–525). Springer. https://doi.org/10.1007/978-3-030-86337-1_34

Chiang, Y.-Y., Leyk, S. y Knoblock, C. A. (2014). A survey of digital map processing techniques. *ACM Computing Surveys*, 47(1), 1–44. https://doi.org/10.1145/2557423

Duan, W., Chiang, Y.-Y., Leyk, S., Uhl, J. H. y Knoblock, C. A. (2020). Automatic alignment of contemporary vector data and georeferenced historical maps using reinforcement learning. *International Journal of Geographical Information Science*, 34(4), 824–849. https://doi.org/10.1080/13658816.2019.1698742

Farella, E. M., Özdemir, E. y Remondino, F. (2021). 4D building reconstruction with machine learning and historical maps. *Applied Sciences*, 11(4), 1445. https://doi.org/10.3390/app11041445

Favelukes, G. y Aliata, F. (2015). Medir la ciudad: plano topográfico y catastro en Buenos Aires (1852–1873). *Estudios del Hábitat*, 13(2), 26–41.

Fleet, C., Kowal, K. C. y Přidal, P. (2012). Georeferencer: Crowdsourced georeferencing for map library collections. *D-Lib Magazine*, 18(11/12). https://doi.org/10.1045/november2012-fleet

Gorelik, A. (1998). *La grilla y el parque: espacio público y cultura urbana en Buenos Aires, 1887–1936*. Universidad Nacional de Quilmes.

Haralick, R. M., Sternberg, S. R. y Zhuang, X. (1987). Image analysis using mathematical morphology. *IEEE Transactions on Pattern Analysis and Machine Intelligence*, PAMI-9(4), 532–550. https://doi.org/10.1109/TPAMI.1987.4767941

Heitzler, M. y Hurni, L. (2020). Cartographic reconstruction of building footprints from historical maps: A study on the Swiss Siegfried map. *Transactions in GIS*, 24(2), 442–461. https://doi.org/10.1111/tgis.12610

Herold, H. y Hecht, R. (2018). 3D reconstruction of urban history based on old maps. En *Digital Research and Education in Architectural Heritage*, Communications in Computer and Information Science (pp. 63–79). Springer. https://doi.org/10.1007/978-3-319-76992-9_5

Jain, A. K. y Farrokhnia, F. (1991). Unsupervised texture segmentation using Gabor filters. *Pattern Recognition*, 24(12), 1167–1186. https://doi.org/10.1016/0031-3203(91)90143-S

Jenny, B. y Hurni, L. (2011). Studying cartographic heritage: Analysis and visualization of geometric distortions. *Computers & Graphics*, 35(2), 402–411. https://doi.org/10.1016/j.cag.2011.01.005

Jimenez, C. E., Yang, J., Wettig, A., Yao, S., Pei, K., Press, O. y Narasimhan, K. (2024). SWE-bench: Can language models resolve real-world GitHub issues? *International Conference on Learning Representations (ICLR 2024)*. arXiv:2310.06770.

Kaplan, F. (2015). The Venice Time Machine. En *Proceedings of the 2015 ACM Symposium on Document Engineering* (p. 73). ACM. https://doi.org/10.1145/2682571.2797071

Kersten, T. P., Keller, F., Saenger, J. y Schiewe, J. (2012). Automated generation of an historic 4D city model of Hamburg and its visualisation with the GE engine. En *Progress in Cultural Heritage Preservation*, Lecture Notes in Computer Science (pp. 55–65). Springer. https://doi.org/10.1007/978-3-642-34234-9_6

Li, Z. y Ning, H. (2023). Autonomous GIS: The next-generation AI-powered GIS. *International Journal of Digital Earth*, 16(2), 4668–4686. https://doi.org/10.1080/17538947.2023.2278895

Luft, J. y Schiewe, J. (2021). Automatic content-based georeferencing of historical topographic maps. *Transactions in GIS*, 25(6), 2888–2906. https://doi.org/10.1111/tgis.12794

Müller, P., Wonka, P., Haegler, S., Ulmer, A. y Van Gool, L. (2006). Procedural modeling of buildings. *ACM Transactions on Graphics*, 25(3), 614–623. https://doi.org/10.1145/1141911.1141931

Parish, Y. I. H. y Müller, P. (2001). Procedural modeling of cities. En *Proceedings of the 28th Annual Conference on Computer Graphics and Interactive Techniques (SIGGRAPH 2001)* (pp. 301–308). ACM. https://doi.org/10.1145/383259.383292

Praun, E., Hoppe, H., Webb, M. y Finkelstein, A. (2001). Real-time hatching. En *Proceedings of the 28th Annual Conference on Computer Graphics and Interactive Techniques (SIGGRAPH 2001)* (p. 581). ACM. https://doi.org/10.1145/383259.383328

Saito, T. y Takahashi, T. (1990). Comprehensible rendering of 3-D shapes. *ACM SIGGRAPH Computer Graphics*, 24(4), 197–206. https://doi.org/10.1145/97880.97901

Scobie, J. R. (1974). *Buenos Aires: Plaza to suburb, 1870–1910*. Oxford University Press.

Uhl, J. H., Leyk, S., Chiang, Y.-Y., Duan, W. y Knoblock, C. A. (2020). Automated extraction of human settlement patterns from historical topographic map series using weakly supervised convolutional neural networks. *IEEE Access*, 8, 6978–6996. https://doi.org/10.1109/ACCESS.2019.2963213

Vaienti, B., Petitpierre, R., di Lenardo, I. y Kaplan, F. (2023). Machine-learning-enhanced procedural modeling for 4D historical cities reconstruction. *Remote Sensing*, 15(13), 3352. https://doi.org/10.3390/rs15133352

Winkenbach, G. y Salesin, D. H. (1994). Computer-generated pen-and-ink illustration. En *Proceedings of the 21st Annual Conference on Computer Graphics and Interactive Techniques (SIGGRAPH '94)* (pp. 91–100). ACM. https://doi.org/10.1145/192161.192184

Yang, J., Jimenez, C. E., Wettig, A., Lieret, K., Yao, S., Narasimhan, K. y Press, O. (2024). SWE-agent: Agent-computer interfaces enable automated software engineering. arXiv:2405.15793.

Zhang, Y., Wei, C., He, Z. y Yu, W. (2024). GeoGPT: An assistant for understanding and processing geospatial tasks. *International Journal of Applied Earth Observation and Geoinformation*, 131, 103976. https://doi.org/10.1016/j.jag.2024.103976

### Fuentes cartográficas y de datos

Buenos Aires Data (Gobierno de la Ciudad de Buenos Aires). *Elevación terreno* (curvas de nivel). Licencia CC BY 2.5 AR. https://data.buenosaires.gob.ar/dataset/elevacion-terreno

Cátedra Lombardi, FADU-UBA. *Buenos Aires en cartografía* (Atlas histórico de planos urbanos, Archivo Buenos Aires). https://sites.google.com/view/ba-en-cartografia/

Departamento Topográfico (1867). *Plano topográfico de la Ciudad de Buenos Aires y de todo su Municipio, incluyendo parte de los partidos de Belgrano, San José de Flores y Barracas al Sur*. Buenos Aires. Ejemplar de la Bibliothèque nationale de France, Gallica, ark:/12148/btv1b53098699s; copia en Wikimedia Commons. Dominio público.

OpenStreetMap y sus colaboradores. Datos de calles, vías, agua y edificios, bajados con la API Overpass. Licencia ODbL. https://www.openstreetmap.org/copyright

Los seis planos posteriores se describen en la tabla de la sección 3; sus direcciones de descarga están en `tools/epocas.mjs`.

## Apéndice A. Herramientas

| Archivo | Qué hace | Qué deja |
|---|---|---|
| `tools/plano.mjs` | Lo que hay que saber del escaneo y todo lo calcado a mano (río, Riachuelo, arroyos, carteles, iglesias, tierra firme) | constantes |
| `tools/1-clases.mjs` | Respuesta al rayado y tono → cinco clases | `tmp/clases.png` |
| `tools/chicas.mjs` | Casillas y árboles a resolución plena | lo usa el paso 2 |
| `tools/2-ciudad.mjs` | Manzanas, lotes, pisos, techos, muros, iglesias | `public/datos/*.bin`, `ciudad.json` |
| `tools/3-laminas.mjs` | Láminas del plano por niveles y teselas | `public/plano/` |
| `tools/empacar.mjs` | Reordena por planos de bytes y comprime | `ciudad.pak` |
| `tools/osm.mjs` | Baja calles, vías y agua de hoy | `fuentes/osm/` |
| `tools/geo.mjs`, `src/geo.js` | Georreferencia: afín y modelo fino | funciones |
| `tools/calce.mjs` | Calce de calles por ventanas | `tools/geo.json` |
| `tools/hoy.mjs` | Río de 1867, suelo en color, capas de hoy, tierra ganada | `suelo.webp`, `hoy-*.webp` |
| `tools/calles.mjs` | Nombres de calles de hoy, uno por cuadra | `calles.bin` |
| `tools/epocas.mjs` | Baja y calza los seis planos posteriores | `fuentes/planos/epoca-*.webp` |
| `tools/crece.mjs` | Señas de color, reglas, obras, costa por etapa | `crece.pak`, `crece.webp`, `despeje.webp`, `calles.webp` |
| `tools/relieve.mjs` | Curvas de nivel → grilla de alturas | `relieve.bin` |
| `tools/patios.mjs` | Árboles y aljibes inventados de los patios | `patios.pak` |
| `tools/edificios.mjs` | Plantas de edificios con nombre (OpenStreetMap) | `src/edificios.js` |
| `tools/esquina.mjs` | Una esquina o coordenada de hoy, en píxeles del plano | texto |
| `tools/fotos.mjs` | Fotos de las fichas, con su licencia | `public/fotos/`, `src/fotos.json` |
| `tools/shot.mjs`, `tools/ver.mjs` | Capturas del visor y recortes ampliados, para mirar | `shots/`, imágenes |
| `tools/carga.mjs`, `telefono.mjs`, `tactil.mjs`, `fichas.mjs`, `modos.mjs`, `autos.mjs`, `vitrina.mjs`, `vivo.mjs`, `busca.mjs` | Pruebas con navegador sin ventana | informes y capturas |
| `src/ciudad.js`, `epocas.js`, `tinta.js`, `pagina.js`, `relieve.js` | Geometría, línea de tiempo, sombreado de tinta, contornos, barranca | el visor |
| `src/hitos.js`, `src/lugares/*.js` | Edificios y lugares modelados a mano, por época | el visor |
| `src/marcas.js`, `fichas.js`, `buscar.js`, `modos.js`, `autos.js`, `vias.js` | Rótulos, fichas, buscador, modos de recorrer, trenes | el visor |

## Apéndice B. Parámetros principales

| Paso | Parámetro | Valor |
|---|---|---|
| Escaneo | tamaño; escala | 18.919 × 13.272 px; 0,675 m/px |
| Rayado | ventana; períodos; paso de la grilla | 12 × 12 px; 4,2, 5,05 y 6,1 px; 2 px |
| Clases | umbrales de respuesta; de tono | 8,5 y 12 (razón 0,4); 165, 175, 88, 150 |
| Tinta gruesa | vecindad; mínimo; umbral | 5 × 5; 18 de 25; 160 |
| Manzanas | aceptación del cuadrilátero | intersección/unión ≥ 0,86 |
| Corrección por tono | diferencia mínima; posición del umbral | 12 niveles; 55 % |
| Iglesias | cierre; llenado; tamaño | 5 pasadas; ≥ 68 %; 18–105 × 9–46 m |
| Lotes | anchos | 8, 9, 9, 9, 9, 10, 11, 13, 13, 17, 17, 22, 26 m |
| Pisos | p₃; p₂ | 0,17 · e^(−d/520); 0,66 · e^(−d/1300) + 0,05 |
| Río | avance por papel; por olas; resguardo | 380 m; 95 m; 5 m |
| Afín | referencias; descarte | 16 declaradas, 14 usadas; > 60 m |
| Calce | ventana; muestreo; radios; aceptación | 420 m; 4 m; 37 y 14 puntos; 0,72, 0,30 y 0,22 |
| Campo | σ; freno; peso de los edificios; descarte | 350 m; 0,35; 0,25; > 14 m |
| Planos posteriores | puntaje z; descarte robusto; polinomio | ≥ 3,2; 2,5 × mediana, 4 vueltas; grado 2 |
| Relieve | grilla; pasadas; rampa | 512 × 359 (24,9 m); 3.000; 0,5 + 0,12 · d |
| Láminas | estirado del contraste | 50 → 0, 214 → 255 |
