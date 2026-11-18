# Cómo sumar un lugar

El visor muestra Buenos Aires desde el plano de 1867 en adelante, y le faltan lugares: un mercado, un puente, una
cancha, la plaza de tu barrio como era en 1910. Esta guía es para sumar uno **sin saber programar**, con Claude Code
haciendo el trabajo y vos mirando que quede bien.

Quien acepta los aportes es el autor del visor, [@mormonnegro](https://github.com/mormonnegro). Nadie más publica.
Como somos varios a la vez, cada uno con su Claude, hay unas pocas reglas para no pisarnos:
[`COORDINAR.md`](COORDINAR.md). Leela antes de empezar; esta guía no las repite.

## Qué se puede aportar

- **Un lugar**: un edificio, una plaza, un estadio, un monumento, una estación, un puente. Con su forma en cada año
  en que cambió, su etiqueta, su ficha y, si hay, una foto de época.
- **Una foto** de dominio público para un lugar que ya está y no tiene ninguna. Es lo más fácil.
- **Una corrección**: un año mal, un edificio corrido, una ficha que dice algo que no es. Para eso alcanza con
  abrir un issue contando qué está mal y de dónde sale el dato bueno.

Lo que no: cambiar cómo se genera la ciudad (las casas, las calles, el suelo), ni cómo se dibuja. Si tu lugar
necesita algo de eso —que se saquen las casas de una manzana, por ejemplo—, se pide y lo hace el autor.

## Cómo elegir un lugar

[`PENDIENTES.md`](PENDIENTES.md) tiene la lista de lo que falta, con lo que ya se sabe de cada cosa. Los marcados
🟢 son buenos para empezar. También podés proponer uno que no esté. Sirve que:

- **haya existido entre 1867 y el último año de la línea de tiempo**, y en alguno de los años que el visor muestra
  (un lugar que se hizo y se demolió entre dos de esos años no llega a verse);
- **esté dentro del plano**: más o menos de la Boca a Palermo y del río a Once y Almagro;
- **tenga con qué**: al menos una fuente para los años y la dirección, y mejor si hay una foto fechada.

Antes de arrancar, **reservalo**: fijate que nadie lo tenga y abrí un issue con la plantilla **«Proponer un lugar»**
(o pedile a Claude que lo haga). Así no lo hacen dos personas a la vez y el autor te puede decir si hay algo que
conviene saber. Cómo funciona la reserva y cuánto dura: [`COORDINAR.md`](COORDINAR.md), «Antes de empezar».

## Cómo se hace

Necesitás [git](https://git-scm.com), [Node.js](https://nodejs.org) (versión 22 o más nueva), una cuenta de GitHub
y [Claude Code](https://claude.com/claude-code), con **Claude Fable 5.2 y esfuerzo medio como mínimo** (el repositorio
ya lo deja puesto al abrirlo; no lo bajes: lo hecho con un modelo menor no se acepta).

1. Hacé tu copia del repositorio en GitHub (el botón **Fork**) y bajala:

       git clone https://github.com/<tu-usuario>/baires-interactivo
       cd baires-interactivo
       npm install

2. Abrí la carpeta con Claude Code y pedíselo con tus palabras:

   > Agregá al visor la Fuente de las Nereidas donde estuvo de 1903 a 1918. Mi usuario de GitHub es @fulana.

   Si tenés un libro, un plano o una foto con fecha, decíselo: son las mejores fuentes. El repositorio trae las
   instrucciones para Claude (`CLAUDE.md` y el skill `agregar-lugar`): va a investigar, ubicar el lugar, modelarlo,
   escribir la ficha y revisarlo. Te va a preguntar poco.

3. Para verlo andar: `npx vite` y abrí la dirección que dice (por lo común <http://localhost:5173>).

## Cómo mirar la hoja de revisión

Al terminar, Claude corre `npm run revisar -- <clave>` y deja dos archivos en la carpeta `revision/`:

- **`<clave>.jpg`, la hoja**: tu lugar en cada año en que aparece, cambia o se va, visto de costado, de arriba y
  en tinta. A la derecha, la foto aérea de 1940 con un recuadro rojo donde quedó tu lugar, y la foto de la ficha.
- **`<clave>.md`, la lista de controles**: cada uno con ✅, ❌ o ⚠️.

Mirá la hoja vos también. No hace falta saber nada de código para ver si:

- el recuadro rojo cae **sobre el edificio** en la foto aérea, y no en la vereda de enfrente ni a dos cuadras;
- **se parece** a la foto de época: el tamaño, el techo, la torre, cuántos pisos;
- aparece y se va **en los años que corresponde**;
- la ficha dice cosas ciertas, y dice **qué es supuesto**.

Si algo no te convence, decíselo a Claude con tus palabras («la torre es más alta», «eso estaba en la otra
esquina») y que vuelva a correr la revisión. No lo mandes con controles en ❌.

## Cómo mandarlo

Un pedido es **un lugar**, en su rama `lugar/<clave>`. Pedile a Claude que lo suba a tu copia y abra el pedido (pull
request), o hacelo vos:

    node tools/revisar-commits.mjs        # que cada commit lleve la firma de Claude
    git push -u origin lugar/<clave>

y en GitHub, **Compare & pull request** contra `main` de `mormonnegro/baires-interactivo`. El formulario pide:
qué lugar es y de qué años, las fuentes, **la hoja** (arrastrá `revision/<clave>.jpg` al texto), la lista de
controles (pegá `revision/<clave>.md`), qué es supuesto, si hace falta despejar un solar, **con qué modelo y qué
esfuerzo se hizo** y qué issue cierra («Cierra #12»: el de tu reserva).

GitHub corre solo una revisión corta del pedido (que compile, los controles que no necesitan navegador y la firma
de los commits). En un pedido de afuera corre cuando el autor la habilita: es normal que quede esperando.

## Qué va a mirar el autor para aceptarlo

1. **Que nada sea inventado.** Cada año, cada nombre y cada dirección con su fuente, que se pueda abrir. Lo que no
   se pudo verificar, dicho como supuesto en la ficha. Un aporte honesto con huecos vale más que uno redondo con
   datos dudosos.
2. **Que esté donde estaba.** La hoja, contra la foto aérea.
3. **Que se parezca y sea liviano.** El visor se mira desde arriba y tiene que andar en un teléfono: el volumen, el
   techo y las torres, no las molduras.
4. **Que no rompa nada.** Los controles en ✅, y que el pedido toque solo los archivos del lugar.
5. **Las fotos.** Solo de dominio público o con licencia libre, cada una con su procedencia.
6. **El texto.** Corto, llano, en el tono de las otras fichas.

Puede pedir cambios, o hacerlos él sobre tu pedido. Los pedidos se integran de un solo golpe (*squash*), así que
no hace falta prolijar los commits.

## El crédito

Tu usuario de GitHub queda al pie de la ficha del lugar («Maquetado por @fulana»), con enlace a tu perfil. Si
preferís no figurar, decilo en el pedido.

## La licencia

El proyecto se publica con la licencia MIT ([`LICENSE`](LICENSE); el detalle, en [`LICENCIAS.md`](LICENCIAS.md)): el
código, los textos, las fichas y los modelos. Al mandar un pedido aceptás que tu aporte se publique con esa misma
licencia, con tu crédito.

Lo que ya tiene dueño y condiciones propias: las fotos de las fichas son de dominio público o de licencia libre,
cada una con su procedencia en `fuentes/fotos/`; el mapa de hoy es de © los colaboradores de OpenStreetMap, con
licencia ODbL.
