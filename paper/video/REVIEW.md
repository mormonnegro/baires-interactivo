# Revisión

Película «El rayado», 131,5 s, 1920×1080 a 30 cuadros por segundo. Entregables en `renders/`: `buenos-aires-1867-paper-v2.mp4` (maestro) y `buenos-aires-1867-paper-v2-liviano.mp4` (copia para compartir).

## Decisiones

- Un solo movimiento de cámara desde la lámina entera hasta los píxeles del escaneo, y de ahí al visor con la misma cámara. Las otras dos películas posibles están en `STORYLINES.md` y no se hicieron.
- Todo lo que se ve del plano es el escaneo y todo lo que se ve de la ciudad es el visor capturado, sin su interfaz. Ninguna imagen generada.
- Cada cifra en pantalla sale del artículo o de sus medidas; la ventana del calce que se muestra es una típica (10,9 m de corrimiento local), no la manzana que sigue la cámara, donde el corrimiento era de solo 4,5 m.
- Sin música: el catálogo gratuito pide iniciar sesión en HeyGen y no se generó música paga sin pedido.
- Cierre (corrección del dueño, 17 de noviembre de 2026): el final ya no enumera qué quedó sin verificar. Ahora repasa en tres pasos cómo se hizo e invita a recorrer la ciudad en `baires.mormon.garden`, con la dirección dicha en la locución y en pantalla hasta el último cuadro. Solo se rehicieron la escena `cierre` y el noveno tramo de voz; el video pasó de 124,5 s a 131,5 s.

## Qué se midió y qué solo se miró

- Medido: `check` sin errores. Audio del archivo final: −19,2 LUFS integrado, pico real −1,6 dB, sin recortes. El tramo nuevo de voz mide −19,1 LUFS en el archivo, contra −19,9 del tramo anterior y −19,1 del primero. La pausa entre el octavo y el noveno tramo es de 1,2 s, igual que antes del cambio.
- Mirado: cuadros de todas las escenas, las tiras de cada corte, la hoja a ancho de celular y ocho cuadros del final sacados del archivo ya renderizado.
- Sin verificar: nadie escuchó la voz. La pronunciación de «Claude Code» (escrito como suena), de «baires punto mormon punto garden» y de las cifras en letras solo se controló por los tiempos que devuelve el servicio, no de oído. Las dos direcciones del cierre respondían al momento de hacerlo.

## La toma más floja

Los primeros tres segundos de la franja final (116,4 a 119,3 s): solo dice «Buenos Aires,» sobre la franja oscura hasta que se nombra la dirección. Con más tiempo, la dirección entraría antes o la franja subiría más tarde.

## Advertencias que quedaron

- `timeline_track_too_dense` (cuatro escenas): cada escena lleva de 4 a 10 elementos con tiempo; partirlas más las haría más difíciles de editar, no menos.
- `nested_media_start_basis_ambiguous` en `#ci-color`: el inicio en 5,5 s es local a la escena, a propósito.
- Los vuelos de cámara de `plano` y el empuje de las fotos se mueven con un objeto intermedio que el verificador no ve; por eso llevan `data-hold`.

## Para la próxima vuelta

- `tools/armar.mjs` genera `compositions/plano.html` desde `tools/plano.plantilla.html`: editar la plantilla, no el generado.
- Las cachés de la herramienta (`.hyperframes/` y demás) guardan rutas absolutas del disco; están en `.gitignore` y no deben entrar a ningún commit.
