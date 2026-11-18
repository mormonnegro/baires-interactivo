// «Añadir lugar»: un botón al lado del «?» y su cartel. Da el pedido listo para pasarle a un asistente de código (Claude
// Code u otro), que hace el resto con las reglas del repositorio; «Manual» muestra los mismos pasos para hacerlos a mano.
const REPO = 'https://github.com/mormonnegro/baires-interactivo';

const CSS = `
#colaborar-b { left: 82px; bottom: 26px; display: inline-flex; align-items: center; gap: 7px; height: 44px; box-sizing: border-box; padding: 0 16px; pointer-events: auto; cursor: pointer; font: inherit; font-size: 16px; letter-spacing: .02em; border-radius: 0; }
#colaborar-b:hover { background: #fff6e2; }
#colaborar-b:active { transform: translateY(1px); }
#colaborar-b svg { width: 20px; height: 20px; flex: none; fill: currentColor; }
body.info #colaborar-b, body.modo #colaborar-b, body.juego #colaborar-b { display: none; }
@media (min-width: 641px) and (max-width: 720px) and (min-height: 501px) { #colaborar-b { bottom: 88px; } }
/* (en lo angosto, solo el dibujo: el rótulo chocaría con la fila de botones) */
@media (max-width: 960px) { #colaborar-b { width: 44px; padding: 0; justify-content: center; } #colaborar-b span { display: none; } }
@media (max-width: 640px), (max-height: 500px) {
  #colaborar-b { left: calc(66px + var(--sl)); bottom: calc(16px + var(--sb)); width: 44px; padding: 0; justify-content: center; }
  #colaborar-b span { display: none; }
}
@media (max-width: 640px) { #colaborar-b { bottom: calc(68px + var(--sb)); } body.ficha #colaborar-b { display: none; } }

#colaborar { position: fixed; inset: 0; z-index: 21; display: grid; place-items: center; padding: max(14px, var(--st)) max(14px, var(--sr)) max(14px, var(--sb)) max(14px, var(--sl)); box-sizing: border-box; background: #1d1a17a6; opacity: 0; visibility: hidden; transition: opacity .3s, visibility .3s; }
#colaborar.ver { opacity: 1; visibility: visible; }
#colaborar .hoja { box-sizing: border-box; width: min(600px, 100%); max-height: calc(100vh - 28px - var(--st) - var(--sb)); max-height: calc(100dvh - 28px - var(--st) - var(--sb)); display: flex; flex-direction: column; color: #2a221b; background: #f1e6cd; border: 1px solid #2a221b; outline: 1px solid #2a221b99; outline-offset: 3px; box-shadow: 0 14px 60px #000b; transform: translateY(10px); transition: transform .3s; }
#colaborar.ver .hoja { transform: none; }
#colaborar .texto { min-height: 0; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; touch-action: pan-y; padding: 24px 30px 4px; -webkit-user-select: text; user-select: text; }
#colaborar h2 { margin: 0; font-size: 30px; font-weight: 500; letter-spacing: .03em; line-height: 1.1; }
#colaborar .bajada { margin: 5px 0 0; font-style: italic; font-size: 16px; opacity: .82; }
#colaborar h3 { margin: 16px 0 8px; padding-top: 13px; border-top: 1px solid #2a221b55; font-size: 13.5px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; }
#colaborar p { margin: 0 0 8px; font-size: 16px; line-height: 1.5; }
#colaborar a { color: #a03220; text-underline-offset: 2px; }
#colaborar ol { margin: 0 0 4px; padding: 0; list-style: none; counter-reset: paso; }
#colaborar li { counter-increment: paso; position: relative; padding-left: 30px; margin-bottom: 11px; font-size: 15px; line-height: 1.45; }
#colaborar li::before { content: counter(paso); position: absolute; left: 0; top: .05em; width: 19px; height: 19px; border-radius: 50%; border: 1px solid #2a221b; font-size: 12.5px; line-height: 19px; text-align: center; font-variant-numeric: lining-nums; }
#colaborar li small { display: block; margin-top: 5px; font-size: 13.5px; line-height: 1.45; opacity: .85; }
/* lo que hay que escribir: en letra de máquina, y se copia con un toque */
#colaborar code { display: block; position: relative; margin: 5px 0 0; padding: 7px 10px; font: 12.5px/1.45 ui-monospace, 'SF Mono', Menlo, Consolas, monospace; color: #2a221b; background: #fff6e2; border: 1px solid #2a221b55; overflow-wrap: anywhere; cursor: copy; }
#colaborar code:hover { border-color: #2a221b; }
#colaborar code.listo::after { content: 'copiado'; position: absolute; right: 0; top: 0; bottom: 0; display: grid; place-items: center; padding: 0 10px; font: italic 13px/1 inherit; font-family: inherit; background: #2a221b; color: #f7eedb; }
#colaborar .chico { font-size: 13.5px; line-height: 1.45; opacity: .85; }
#colaborar .pie { display: flex; align-items: stretch; justify-content: flex-end; gap: 12px; padding: 12px 30px 20px; }
#colaborar .pie > * { box-sizing: border-box; min-height: 46px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; font: inherit; font-size: 17px; letter-spacing: .03em; border: 1px solid #2a221b; border-radius: 0; padding: 10px 22px; text-decoration: none; }
#colaborar .github { color: #2a221b; background: none; }
#colaborar .github:hover { background: #fff6e2; }
#colaborar .cerrar { color: #f7eedb; background: #2a221b; outline: 1px solid #2a221b99; outline-offset: 2px; }
#colaborar .cerrar:hover { background: #453a30; }
@media (max-width: 640px) {
  #colaborar { padding: max(10px, var(--st)) max(10px, var(--sr)) max(10px, var(--sb)) max(10px, var(--sl)); }
  #colaborar .texto { padding: 18px 18px 4px; }
  #colaborar h2 { font-size: 25px; } #colaborar .bajada { font-size: 14.5px; } #colaborar p { font-size: 15px; } #colaborar li { font-size: 14.5px; }
  #colaborar .pie { padding: 10px 18px 16px; gap: 8px; } #colaborar .pie > * { flex: 1; padding: 8px 10px; font-size: 16px; }
}
/* el pedido para pasarle al asistente */
#colaborar pre { margin: 0 0 8px; padding: 11px 13px; max-height: min(330px, 38vh); overflow-y: auto; overscroll-behavior: contain; white-space: pre-wrap; overflow-wrap: anywhere; font: 12.5px/1.5 ui-monospace, 'SF Mono', Menlo, Consolas, monospace; color: #2a221b; background: #fff6e2; border: 1px solid #2a221b55; -webkit-user-select: text; user-select: text; }
#colaborar [hidden] { display: none !important; }
#colaborar .pie .otra { margin-right: auto; color: #2a221b; background: none; }
#colaborar .pie .otra:hover { background: #fff6e2; }
#colaborar .copiar { color: #f7eedb; background: #2a221b; outline: 1px solid #2a221b99; outline-offset: 2px; }
#colaborar .copiar:hover { background: #453a30; }
#colaborar .cerrar { color: #2a221b; background: none; outline: 0; }
#colaborar .cerrar:hover { background: #fff6e2; }
@media (max-width: 640px) { #colaborar .pie > * { padding: 8px 6px; font-size: 15.5px; } #colaborar .pie .otra { flex: 0 1 auto; padding: 8px 12px; } #colaborar .pie .cerrar { flex: 0 1 auto; padding: 8px 12px; } }
`;

// El pedido: lo único que hay que pasarle al asistente. No nombra ningún lugar: el asistente pregunta y va guiando.
const PEDIDO = `Quiero colaborar con el visor «Buenos Aires, de 1867 a 1950» (${REPO}) sumándole un lugar. Guiame vos paso a paso: no sé programar ni conozco el proyecto.

Para empezar:
1. Hacé un fork del repositorio en mi cuenta de GitHub, clonalo, entrá a la carpeta y corré npm install. Si me falta algo para eso (git, node, la cuenta de GitHub), decime qué y cómo instalarlo.
2. Leé CLAUDE.md, CONTRIBUIR.md y COORDINAR.md y seguilos al pie de la letra: son las reglas del proyecto.

Después, conmigo:
3. Preguntame qué lugar quiero sumar. Si no tengo uno pensado, mostrame algunos de PENDIENTES.md y ayudame a elegir. Fijate en los issues y los pull requests que nadie lo esté haciendo, y reservalo con un issue.
4. Buscá vos en internet todo lo que haga falta: cuándo se hizo, cuándo cambió o se demolió, dónde estaba exactamente y cómo era, con sus fuentes, y fotos de época de dominio público. Preguntame si tengo fotos, planos o datos propios para sumar, pero no dependas de eso. No inventes nada: lo que no se pueda verificar, marcalo como supuesto.
5. Contame en pocas líneas lo que encontraste y lo que vas a hacer antes de hacerlo.
6. Maquetalo siguiendo las instrucciones del repositorio (.claude/skills/agregar-lugar), en el estilo de los lugares que ya hay, con su marca y su ficha.
7. Corré npm run revisar -- <clave>, mostrame la hoja de revisión y explicame qué mirar. Corregí lo que yo te marque.
8. Cuando te diga que está bien, mandá el pull request con la plantilla del repositorio.

En cada paso explicame en criollo qué estás haciendo y qué necesitás de mí. No publiques nada, no toques el generador ni los datos generados, y no dejes datos míos ni rutas de mi máquina en los archivos.`;

const HTML = `
<div class="hoja" role="dialog" aria-modal="true" aria-labelledby="colaborar-t">
  <div class="texto">
    <h2 id="colaborar-t">Sumá un lugar</h2>
    <p class="bajada">El proyecto es abierto, y a la ciudad le falta mucho.</p>

    <div class="con-llm">
      <h3>Con tu asistente</h3>
      <p>Copiá este pedido y pegalo en Claude Code, o en el asistente de código que uses. Él te pregunta qué lugar querés sumar, busca en internet las fechas, la ubicación y las fotos de época, lo maqueta en el estilo del proyecto y te muestra cómo quedó antes de mandarlo.</p>
      <pre tabindex="0"></pre>
      <p class="chico">No hace falta saber programar ni traer nada. Si tenés fotos, planos o recuerdos del lugar, mejor: el asistente te los va a pedir. Se pide como mínimo Claude Fable 5.2 con esfuerzo medio.</p>
    </div>

    <div class="a-mano" hidden>
      <h3>A mano</h3>
      <ol>
        <li>Hacé tu copia del <a href="${REPO}" target="_blank" rel="noopener">repositorio</a> (<i>fork</i>), bajala y levantala:<code>npm install && npx vite</code></li>
        <li>Elegí un lugar de <a href="${REPO}/blob/main/PENDIENTES.md" target="_blank" rel="noopener">la lista de pendientes</a> o traé el tuyo, y reservalo con <a href="${REPO}/issues/new/choose" target="_blank" rel="noopener">un issue</a>, para que nadie más lo haga a la vez.</li>
        <li>Juntá las fuentes: años de obra, de cambios y de demolición, la dirección exacta y fotos de época de dominio público. Lo que no tenga fuente va dicho como supuesto.</li>
        <li>Maquetalo en un archivo nuevo de <i>src/lugares/</i>, mirando uno parecido de los que ya hay, y sumale su marca y su ficha. <small>La guía paso a paso: <a href="${REPO}/blob/main/CONTRIBUIR.md" target="_blank" rel="noopener">CONTRIBUIR.md</a> y <a href="${REPO}/blob/main/src/lugares/LEEME.md" target="_blank" rel="noopener">src/lugares/LEEME.md</a>.</small></li>
        <li>Revisalo: arma una hoja con el lugar en cada año, al lado de la foto de época.<code>npm run revisar -- la-clave-del-lugar</code></li>
        <li>Mandá el pull request desde una rama <i>lugar/la-clave</i>, con la hoja pegada. Lo revisa @mormonnegro antes de que entre.</li>
      </ol>
      <p class="chico">Cómo nos organizamos entre todos: <a href="${REPO}/blob/main/COORDINAR.md" target="_blank" rel="noopener">COORDINAR.md</a>. ¿Solo tenés un dato o una foto? <a href="${REPO}/issues/new/choose" target="_blank" rel="noopener">Dejalo en un issue</a>: también suma.</p>
    </div>
  </div>
  <div class="pie"><button class="otra" type="button">Manual</button><button class="cerrar" type="button">Cerrar</button><button class="copiar" type="button">Copiar el pedido</button></div>
</div>`;

const BOTON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm1 6h3v2h-3v3h-2v-3H8V8h3V5h2z"/></svg><span>Añadir lugar</span>';
export function createColaborar() {
  document.head.appendChild(Object.assign(document.createElement('style'), { textContent: CSS }));
  const boton = Object.assign(document.createElement('button'), { id: 'colaborar-b', className: 'panel', type: 'button', title: 'Añadir un lugar: las instrucciones para sumarlo al visor', innerHTML: BOTON });
  boton.setAttribute('aria-label', 'Añadir un lugar: las instrucciones para sumarlo al visor');
  const el = Object.assign(document.createElement('div'), { id: 'colaborar', innerHTML: HTML });
  document.body.append(boton, el);
  const $ = (s) => el.querySelector(s);
  const pre = $('pre'), copiar = $('.copiar'), otra = $('.otra');
  let abierta = false, manual = false;
  pre.textContent = PEDIDO;
  const ver = (m) => {
    manual = m; $('.con-llm').hidden = m; $('.a-mano').hidden = !m; copiar.hidden = m;
    otra.textContent = m ? 'Con tu asistente' : 'Manual'; $('.texto').scrollTop = 0;
  };
  const abrir = () => { abierta = true; ver(false); pre.scrollTop = 0; el.classList.add('ver'); copiar.focus({ preventScroll: true }); };
  const cerrar = () => { if (!abierta) return; abierta = false; el.classList.remove('ver'); document.activeElement?.blur?.(); };
  const alPortapapeles = (texto, hecho) => { if (navigator.clipboard) navigator.clipboard.writeText(texto).then(hecho, () => {}); };
  boton.addEventListener('click', abrir);
  otra.addEventListener('click', () => ver(!manual));
  $('.cerrar').addEventListener('click', cerrar);
  copiar.addEventListener('click', () => alPortapapeles(PEDIDO, () => { copiar.textContent = 'Copiado'; setTimeout(() => { copiar.textContent = 'Copiar el pedido'; }, 1400); }));
  el.addEventListener('pointerdown', (e) => { if (e.target === el) cerrar(); });
  el.addEventListener('click', (e) => {
    const c = e.target.closest('code');
    if (c) alPortapapeles(c.textContent, () => { c.classList.add('listo'); setTimeout(() => c.classList.remove('listo'), 900); });
  });
  // mientras está abierto, el teclado es suyo: que nada mueva la ciudad por detrás
  addEventListener('keydown', (e) => {
    if (!abierta) return;
    if (e.code === 'Tab' || e.metaKey || e.ctrlKey) return;
    e.stopImmediatePropagation();
    if (e.code === 'Escape') { e.preventDefault(); cerrar(); }
  }, true);
  return { abrir, cerrar, get abierta() { return abierta; } };
}
