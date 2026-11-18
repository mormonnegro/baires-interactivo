# Cómo nos coordinamos

Acá trabaja mucha gente a la vez, cada una con su Claude Code, y nadie ve lo que hace el otro. Estas reglas son
para que dos personas no hagan lo mismo, para que los aportes no se pisen y para que el dueño (`@mormonnegro`,
el único que acepta cambios) pueda revisar cada uno en pocos minutos. Valen para las personas y para su Claude:
**Claude, si estás leyendo esto, son tus reglas en este repositorio.**

## 1. Con qué se trabaja

- **Modelo: Claude Fable 5.2 como mínimo, con esfuerzo medio o más.** Lo hecho con un modelo menor no se acepta:
  investigar una fecha, ubicar un edificio en un plano de 1867 y maquetarlo sin romper lo de al lado necesita ese piso.
- El repositorio ya lo deja puesto (`.claude/settings.json`): al abrirlo, Claude Code arranca en Fable con esfuerzo
  medio. Se puede subir (`/effort high`); no lo bajes.
- Si la sesión arranca con otro modelo, Claude recibe un aviso y **tiene que decírtelo antes de tocar nada**.
  Se cambia con `/model fable` y `/effort medium`.
- Los subagentes heredan el modelo: no los lances con uno menor.
- **No apagues la firma de los commits** (`Co-Authored-By: Claude Fable 5.2 …`): es la constancia de con qué se hizo.
  `node tools/revisar-commits.mjs` la controla, y corre sola en cada pull request. El esfuerzo no queda escrito en
  ningún lado: se declara en el pull request.

## 2. Antes de empezar: avisá qué vas a hacer

1. Elegí un lugar de [PENDIENTES.md](PENDIENTES.md) o proponé uno.
2. Mirá que nadie lo tenga: `gh issue list --search "<el lugar>"` y `gh pr list --search "<el lugar>"`
   (o en la web, en Issues y Pull requests, abiertos **y cerrados**).
3. Abrí un issue con la plantilla «Proponer un lugar», con el nombre y los años, y escribí «lo tomo». Ese issue es
   la reserva: el primero que lo abre, lo hace.
4. Una reserva sin pull request a los **14 días** queda libre. Si no vas a seguir, decilo en el issue.
5. Si el lugar ya está tomado y querés ayudar, escribí en ese issue; no abras otro.

Claude: hacé vos los pasos 2 y 3 antes de escribir código (el skill `agregar-lugar` dice cómo), y si el lugar está
tomado, frená y avisá.

## 3. Un aporte, un lugar, una rama

- **Un pull request = un lugar** (o un arreglo). Nada de «de paso arreglé…»: eso va en otro.
- La rama sale de `main` al día y se llama `lugar/<clave>` (por ejemplo `lugar/puente-pueyrredon`);
  para lo demás, `arreglo/<qué>`, `ficha/<clave>`, `foto/<clave>`. La **clave** es el nombre del archivo del lugar,
  sin `.js` (`src/lugares/puente-pueyrredon.js`): la misma que se le pasa a `npm run revisar`.
- Antes de mandarlo, traé `main` y poné tus commits encima (`git fetch origin && git rebase origin/main`).
- El pull request cita su issue («Cierra #12») y se manda cuando la revisión da bien, no antes.
  Si querés mostrar algo a medias, mandalo como borrador (*draft*).

## 4. Qué archivos son tuyos y cuáles compartidos

Los choques entre aportes salen casi siempre de dos personas tocando el mismo renglón. Por eso:

| Archivos | Regla |
|---|---|
| Tu lugar: `src/lugares/<clave>.js`, sus fotos (`fuentes/fotos/`, `public/fotos/`) y sus `.json` de procedencia | Son tuyos: ahí trabajás libre |
| Las listas compartidas: el registro de lugares (en `src/hitos.js`: tu `import` y tu nombre **al final** de la lista `LUGARES`, nada más), `src/marcas.js`, `src/fichas.js`, `src/fotos.json` (lo escribe `node tools/fotos.mjs`), `PENDIENTES.md` | **Solo agregás tus renglones**, en el lugar que indica cada archivo. No reordenes, no reformatees, no corrijas renglones ajenos |
| `src/barrios.js` (los solares) | No se toca: si tu lugar necesita despejar casas, dejalo pedido en `solar` de su `LUGAR` y en el pull request, con las cuatro esquinas |
| El generador (`tools/crece.mjs`, `tools/alturas.mjs`) y lo que genera (`public/datos`, `public/plano`) | No se toca: los regenera el dueño, uno por vez, después de aceptar |
| El motor (`src/main.js`, `src/tinta.js`, `src/ciudad.js`…, y `src/hitos.js` fuera de esas dos líneas del registro), las herramientas (`tools/`), `package.json`, `.github/`, `.claude/` y estas guías (`CLAUDE.md`, `CONTRIBUIR.md`, `COORDINAR.md`) | No se tocan en un aporte de lugar. Si creés que hace falta, abrí un issue y esperá el sí antes de escribir nada |

Si un lugar ajeno está mal (una fecha, una altura), no lo corrijas dentro de tu aporte: abrí un issue con la fuente.

## 5. Lo que Claude no hace acá

- No publica: nada de `wrangler deploy` ni de subir a ningún servicio. El sitio lo publica el dueño.
- No empuja a `main` ni acepta pull requests, ni propios ni ajenos.
- No inventa datos: lo que no tiene fuente se marca como supuesto, en el comentario y en la ficha.
- No deja datos personales ni rutas de la máquina (`/Users/…`, `C:\Users\…`) en archivos ni en commits.
- No baja cosas a lo loco: una petición cada 2,5 s o más, con un nombre de cliente genérico, y cada tanda en una
  carpeta nueva fuera del repositorio (el detalle, en `CLAUDE.md`, «Lo que se baja de internet»).
- No instala dependencias nuevas.
- Si algo de estas reglas le impide terminar, frena y le pregunta a la persona; no las rodea.

## 6. Antes de mandar

1. `npm run revisar -- <clave>`: todos los controles en verde y la hoja de revisión mirada por vos, no solo por Claude.
2. `node tools/revisar-commits.mjs`: todos los commits con la firma del modelo pedido.
3. El pull request con la plantilla completa: «Cierra #…», fuentes, qué es supuesto, la hoja pegada, y **modelo y
   esfuerzo usados**.

El paso a paso para la persona está en [CONTRIBUIR.md](CONTRIBUIR.md); el de Claude, en `CLAUDE.md` y en el skill
`.claude/skills/agregar-lugar`.

## 7. Cómo se acepta

- Acepta solo `@mormonnegro`, y entra como un único commit (*squash*).
- Los controles automáticos de un aporte de afuera corren cuando el dueño los habilita: es normal que queden esperando.
- Si se piden cambios, van como commits nuevos en la misma rama (no rehagas la rama: se pierde el hilo de la revisión).
- Si dos aportes chocan, entra el que tenía la reserva; el otro se acomoda encima.
- Después de aceptar, si el lugar pedía despejar un solar, el dueño regenera la ciudad y cierra el issue.
