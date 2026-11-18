<!-- Para un aporte de lugar. Si el pedido es otra cosa, borrá lo que no corresponda y contá qué cambia. -->

## Qué lugar

<!-- El nombre, dónde estaba (las calles de hoy) y en una línea qué era. Un pedido, un lugar (COORDINAR.md). -->

Cierra #<!-- el número del issue con que lo reservaste -->

## Años

<!-- Obra, inauguración, cambios y demolición, y en qué años del visor aparece, cambia y se va. -->

## Fuentes

<!-- De dónde sale cada dato: la dirección de la página y qué se tomó de ahí. Las fotos, con su licencia. -->

-

## Qué es supuesto

<!-- Lo que no se pudo verificar: medidas, alturas, lo que la foto no muestra. Tiene que estar dicho también en la ficha. -->

-

## La hoja de revisión

<!-- Arrastrá acá revision/<clave>.jpg (la deja `npm run revisar -- <clave>`). -->

## Los controles

<!-- Pegá acá el contenido de revision/<clave>.md. Si quedó algún aviso (⚠️), explicá por qué. -->

## ¿Hace falta despejar un solar o tocar el suelo?

<!-- Si donde va el lugar el visor pone casas, árboles o una calle: decí cuáles son las esquinas y desde qué año. Lo hace el autor. Si no hace falta, «No». -->

## Modelo y esfuerzo usados

<!-- Con qué modelo y qué esfuerzo se hizo: «Claude Fable 5.2, esfuerzo medio». Se pide eso como mínimo (COORDINAR.md). Si algún commit no lleva la firma de Claude, contá cómo se hizo. -->

## Antes de mandar

- [ ] El lugar estaba reservado con un issue, y este pedido lo cita arriba («Cierra #…»).
- [ ] La rama se llama `lugar/<clave>`, sale de `main` al día y trae un solo lugar.
- [ ] `node tools/revisar-commits.mjs` da bien: los commits llevan la firma de Claude Fable 5.2 o mayor.

- [ ] `npm run revisar -- <clave>` da todo bien (ningún ❌).
- [ ] Miré la hoja: el lugar cae donde corresponde en la foto aérea y se parece a la foto de época.
- [ ] Ningún dato es inventado; lo que no se pudo verificar está dicho como supuesto en la ficha.
- [ ] Las fotos son de dominio público o de licencia libre, cada una con su `.json` de procedencia.
- [ ] El pedido no toca el generador (`tools/crece.mjs`, `tools/alturas.mjs`) ni los datos generados (`public/datos`, `public/plano`).
- [ ] No hay rutas de mi máquina ni datos personales en ningún archivo.
