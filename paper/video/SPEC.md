# Especificación

Película «El rayado» (ver `STORYLINES.md`). 1920×1080, 30 cuadros por segundo, 131,5 s. Voz en off en castellano, sin música.

## Regla de contenido

Nada inventado. Cada cifra en pantalla sale de `../paper.md`, de `../medidas/` o de `assets/capas.json` (que escribe `tools/capas.mjs` leyendo los datos del repo). Lo que se ve del plano es el escaneo; lo que se ve de la ciudad es el visor capturado, sin su interfaz.

## Aspecto, en números

- Fondo papel `#e8dcc4`; tinta `#1f1b17`; texto sobre tinta `#f1e7d2`.
- Un solo acento: carmín `#c2321c` (`#f0674c` sobre placas de tinta). Verde `#6f8f4e` solo para «patio o fondo». Azul `#1d5fb4` solo para las calles del ajuste afín.
- Títulos en League Gothic, mayúsculas, interlineado 0,92. Texto en Lato 700. Ningún texto por debajo de 28 px.
- Placas de tinta con esquinas rectas; marcos de 3 a 4 px con sombra dura desplazada 10 a 12 px, sin desenfoque.
- Entradas de 0,15 a 0,45 s (`expo.out`, `power4.out`); salidas de 0,22 a 0,25 s con desenfoque de 8 a 10 px. Los vuelos de cámara duran de 1,5 a 3,3 s.

## Prohibido

Degradés de fondo, esquinas redondeadas, brillos, sombras difusas, íconos genéricos, emoji, tarjetas flotando sobre fondo oscuro, texto que entra todo junto con la misma curva, cifras redondeadas «para que queden lindas», imágenes generadas de la ciudad.

## Tomas

| Tiempo (s) | Escena | Qué se ve | Voz |
| --- | --- | --- | --- |
| 0 – 10,9 | `plano` | La lámina entera de 1867, empuje lento; cartela «Buenos Aires, 1867» | 1 |
| 10,9 – 21,9 | `plano` | Zoom hasta una manzana (440 px de ancho) y hasta una esquina (200 px): rayado en cruz y rayado simple, rotulados | 2 |
| 21,9 – 35 | `plano` | «4,3 px entre raya y raya»; ventana de 12 px con sus dos respuestas diagonales (17,3 / 24,1 y 3,1 / 34,0); la clasificación tiñe las manzanas | 3 |
| 35 – 48,7 | `plano` | Vuelo a una ventana típica del calce: calles de hoy en azul (afín) y en rojo (ajuste fino); «9,7 m → 2,4 m»; vuelta a la manzana | 4 |
| 48,7 – 62,9 | `ciudad` | El plano se levanta: visor en tinta y después en color, misma cámara; 52.521 techos, 146.487 muros, 35.658 árboles; «lotes, alturas, aberturas: inventados» | 5 |
| 62,9 – 79,7 | `crece` | Los seis planos posteriores con su seña; después las siete etapas del visor, de 16.599 a 64.007 cuerpos | 6 |
| 79,7 – 94 | `agente` | «Claude Code», «@mormonnegro («meat proxy»)», 113 puntos y 3.473 puntos | 7 |
| 94 – 107,9 | `muestra` | Recorte a 0,5 km con los techos encima: 61 / 74; recorte a 3,5 km: 15 falsos de 17 | 8 |
| 107,9 – 131,5 | `cierre` | «Así se hizo» en tres pasos (leer el rayado, calzar con las calles de hoy, crecer por etapas); después la invitación: título, `baires.mormon.garden` en grande, dónde está el artículo y firmas | 9 |

## Voz

ElevenLabs Eleven v4 por el conector fal (`elevenlabs/tts/eleven-v4`), voz «George», `language_code: es`, estabilidad 0,6, semilla 1867. Nueve archivos en `assets/voz/`. Los números van escritos en letras y «Claude Code» va escrito como suena.

## Cierre (pedido del dueño, 17 de noviembre de 2026)

El final no enumera pendientes ni limitaciones. Es una invitación a visitar la página; si sobra tiempo se cuenta algo más de cómo se hizo. La dirección se dice en la locución y queda en pantalla desde que se nombra hasta el último cuadro.
