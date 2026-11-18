// El juego: «¿Dónde es esta foto?». Sale una foto de época y hay que marcar en el plano el lugar que muestra. Cada
// respuesta suma los metros que faltaron para acertar, y la partida termina cuando esa suma llega al tope (LIMITE): el
// puntaje es cuántas fotos se llegaron a ubicar. El año que se esté mirando no cuenta: solo el lugar.
//
// Las fotos y sus lugares son los de las fichas (src/fichas.js): el blanco de cada foto es la marca del lugar que
// retrata (no el punto donde se paró el fotógrafo, que no se sabe). Alrededor de cada blanco hay un margen que vale
// como acierto (el radio del lugar: una plaza es más grande que una iglesia). Quedan afuera los interiores, las vistas
// aéreas o generales y lo que es una línea y no un punto (una avenida, el subte, el puerto entero).
// Mientras se juega no hay marcas con nombre ni fichas ni buscador: se busca mirando la ciudad.
import * as THREE from 'three';
import { FOTOS, ficha as fichaDe } from './fichas.js';
import { u } from './url.js';

export const LIMITE = 10000; // metros de error que se pueden juntar antes de que termine la partida (el pliego mide 12,8 × 9 km: un solo error grande no la termina)
const SIN_FOTO = new Set(['kavanagh-cocina', 'centro-gath-hall', 'retiro-hall', 'tribunales-galeria', 'aduana-vista-gonnet', 'darsenanorte-aerea', 'nuevedejulio-aerea', 'rada-vidal', 'rada-boote', 'puerto-1915', 'puerto-dique2', 'pampero-gonnet', 'barolo-zeppelin', 'plazacongreso-detalle', 'chade-collivadino',
  'nereidas-1916' /* (la fuente estaba todavía en el Paseo de Julio: la marca es la de la Costanera) */, 'paseocolon-panunzi']);
// Las fotos que están en la ficha de un lugar pero retratan sobre todo otro: a qué marca van.
const VA_A = { 'mod-obraspublicas-1936': 'Ministerio de Obras Públicas', 'victoria-recova-gonnet': 'Plaza de la Victoria', 'congreso-gonnet': 'Congreso Nacional', 'tranvia-gonnet': 'Muelle de pasajeros', 'colon-agn': 'Recova Vieja', 'sanmartin-gonnet': 'Monumento a San Martín', 'retiro-torre-1916': 'Torre de los Ingleses' };
const SIN_LUGAR = new Set(['Subte A', 'Avenida de Mayo', 'Avenida 9 de Julio', 'Diagonal Norte', 'Puerto Madero', 'Puerto Nuevo', 'La rada', 'Costanera Sur', 'Parque Tres de Febrero', 'Los docks', 'Carteles de la Plaza de la República']);

const CSS = `
#juego { position: fixed; z-index: 9; right: 26px; top: 24px; width: min(388px, calc(100vw - 52px)); max-height: calc(100vh - 24px - 104px); max-height: calc(100dvh - 24px - 104px); box-sizing: border-box; display: none; flex-direction: column; color: #2a221b; background: #f1e6cd; border: 1px solid #2a221b; outline: 1px solid #2a221b99; outline-offset: 2px; box-shadow: 0 8px 34px #0008; }
body.juego #juego { display: flex; }
#juego .cabeza { flex: none; display: flex; align-items: baseline; gap: 10px; padding: 10px 46px 8px 16px; }
#juego .cabeza b { font-weight: 500; font-size: 17px; letter-spacing: .07em; font-variant: small-caps; white-space: nowrap; }
#juego .cabeza span { margin-left: auto; font-size: 13.5px; font-style: italic; opacity: .85; white-space: nowrap; font-variant-numeric: tabular-nums; }
#juego .barra { flex: none; height: 5px; margin: 0 16px; background: #2a221b22; }
#juego .barra i { display: block; height: 100%; width: 0; background: #a03220; transition: width .6s; }
#juego .x { position: absolute; right: 5px; top: 4px; width: 36px; height: 36px; padding: 0; cursor: pointer; font: inherit; font-size: 24px; line-height: 32px; color: inherit; background: none; border: 0; opacity: .6; }
#juego .x:hover { opacity: 1; background: #2a221b14; }
#juego .cuerpo { min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 12px 16px 14px; }
#juego .foto { display: block; width: 100%; padding: 0; cursor: zoom-in; background: #2a221b; border: 1px solid #2a221b; border-radius: 0; line-height: 0; }
#juego .foto img { display: block; width: 100%; height: auto; max-height: 46vh; object-fit: contain; filter: sepia(.12); }
#juego .dice { margin: 10px 0 0; font-size: 14.5px; line-height: 1.45; }
#juego .dice b { font-weight: 500; }
#juego .dice .cuanto { display: block; font-size: 22px; letter-spacing: .02em; margin-bottom: 2px; font-variant-numeric: lining-nums; }
#juego .dice .cuanto.bien { color: #3d6b34; } #juego .dice .cuanto.mal { color: #a03220; }
#juego .dice i { opacity: .85; }
#juego .dice small { display: block; margin-top: 4px; font-size: 12.5px; font-style: italic; opacity: .75; }
#juego .fila { display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
#juego .fila button { flex: 1 1 auto; min-height: 44px; cursor: pointer; font: inherit; font-size: 16px; letter-spacing: .03em; color: #f7eedb; background: #2a221b; border: 1px solid #2a221b; border-radius: 0; padding: 8px 16px; }
#juego .fila button:hover { background: #453a30; }
#juego .fila button:disabled { opacity: .4; cursor: default; background: #2a221b; }
#juego .fila button.otro { color: #2a221b; background: none; }
#juego .fila button.otro:hover { background: #fff6e2; }
#juego .final h3 { margin: 2px 0 6px; font-size: 22px; font-weight: 500; letter-spacing: .03em; }
#juego .final .n { display: block; font-size: 46px; line-height: 1.05; font-variant-numeric: lining-nums; }
#juego .final p { margin: 0 0 6px; font-size: 14.5px; line-height: 1.45; }
#juego .final ol { margin: 8px 0 0; padding: 8px 0 0 22px; border-top: 1px solid #2a221b33; font-size: 13px; line-height: 1.5; }
#juego .final ol span { float: right; font-variant-numeric: tabular-nums; opacity: .8; margin-left: 10px; }
#juego-capa { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 3; pointer-events: none; display: none; overflow: visible; }
body.juego #juego-capa { display: block; }
#juego-capa .linea { stroke: #2a221b; stroke-width: 2; stroke-dasharray: 7 6; fill: none; }
#juego-capa .borde { stroke: #f1e6cd; stroke-width: 4.5; stroke-dasharray: none; opacity: .75; fill: none; }
#juego-capa .pin path { stroke: #f1e6cd; stroke-width: 1.5; }
#juego-capa .pin circle { fill: #f1e6cd; }
#juego-capa .mio path { fill: #2a221b; } #juego-capa .era path { fill: #a03220; }
#juego-capa text { font: 500 14px "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif; fill: #2a221b; paint-order: stroke; stroke: #f1e6cd; stroke-width: 5px; stroke-linejoin: round; text-anchor: middle; font-variant-numeric: lining-nums; }
#juego-capa .pista { fill: none; stroke: #a03220; stroke-width: 3; animation: juego-pista 1.3s ease-in-out infinite; }
#juego-capa .pista.borde { stroke: #f1e6cd; stroke-width: 6; opacity: .7; animation: none; }
@keyframes juego-pista { 0%, 100% { opacity: .3; } 50% { opacity: 1; } }
#juego .dice .paso { display: block; margin-top: 6px; }
#juego-visor { position: fixed; inset: 0; z-index: 30; display: grid; place-items: center; padding: 18px; box-sizing: border-box; background: #14110ff2; opacity: 0; visibility: hidden; transition: opacity .25s, visibility .25s; cursor: zoom-out; }
#juego-visor.ver { opacity: 1; visibility: visible; }
#juego-visor img { max-width: 100%; max-height: 100%; min-height: 0; object-fit: contain; border: 1px solid #f1e6cd55; box-shadow: 0 10px 50px #000; background: #2a221b; }
/* mientras se juega: sin nombres, sin fichas, sin buscador y sin los modos de recorrer */
body.juego #marcas, body.juego #ficha, body.juego #buscar, body.juego #buscar-msg, body.juego #titulo, body.juego #modos, body.juego #firma, body.juego #leyenda { display: none !important; }
body.juego #view canvas { cursor: crosshair; }
@media (min-width: 641px) and (max-width: 1100px) { body.juego #epocas { max-width: calc(100vw - 388px - 78px); } }
/* el teléfono: la tarjeta abajo, sobre la fila de botones (como la ficha); los años suben al borde */
@media (max-width: 640px) {
  #juego { right: calc(10px + var(--sr)); left: calc(10px + var(--sl)); top: auto; bottom: calc(68px + var(--sb)); width: auto; max-height: 50vh; max-height: 50dvh; }
  #juego .cabeza { padding: 8px 46px 6px 12px; } #juego .cabeza b { font-size: 15.5px; } #juego .barra { margin: 0 12px; }
  #juego .cuerpo { padding: 9px 12px 11px; }
  #juego .foto img { max-height: 23vh; }
  #juego .dice { margin-top: 7px; font-size: 13.5px; } #juego .dice .cuanto { font-size: 19px; }
  #juego .fila { margin-top: 9px; }
  #juego.chica .foto img { max-height: 13vh; }
  body.juego #epocas { top: calc(12px + var(--st, 0px)); } body.juego #epocas .pie { display: none !important; }
  #juego .x { width: 44px; height: 44px; right: 0; top: 0; }
}
@media (max-height: 500px) and (min-width: 641px) {
  #juego { top: calc(10px + var(--st)); right: calc(14px + var(--sr)); width: min(330px, 42vw); max-height: calc(100vh - 82px - var(--st) - var(--sb)); max-height: calc(100dvh - 82px - var(--st) - var(--sb)); }
  #juego .foto img { max-height: 34vh; }
}
`;

const PIN = 'M0 0C-3.2-7.5-9-11.5-9-17.5a9 9 0 0 1 18 0C9-11.5 3.2-7.5 0 0z';
const metros = (m) => (m >= 1000 ? `${(Math.round(m / 10) / 100).toLocaleString('es-AR', { maximumFractionDigits: 2 })} km` : `${Math.round(m).toLocaleString('es-AR')} m`);
const cuadras = (m) => { const c = Math.round(m / 100); return c < 1 ? 'menos de una cuadra' : c === 1 ? 'una cuadra' : `unas ${c} cuadras`; };

/**
 * @param camera, cam (la de camara.js), lienzo (el canvas), marcas (lo de createMarcas), pedirCuadro
 * @param alEntrar, alSalir: avisos (main.js cierra la ficha, levanta la ciudad…)   lejos: () => la vista general
 * Devuelve { empezar(), salir(), update(), activo }. `update()` va en cada cuadro: acomoda los alfileres.
 */
export function createJuego({ camera, cam, lienzo, marcas, pedirCuadro, alEntrar = () => {}, alSalir = () => {}, lejos, azar = Math.random }) {
  document.head.appendChild(Object.assign(document.createElement('style'), { textContent: CSS }));
  const el = Object.assign(document.createElement('aside'), { id: 'juego' });
  el.innerHTML = '<button class="x" type="button" aria-label="Salir del juego" title="Salir del juego">×</button><div class="cabeza"><b></b><span></span></div><div class="barra"><i></i></div><div class="cuerpo"></div>';
  el.setAttribute('aria-live', 'polite');
  const NS = 'http://www.w3.org/2000/svg', capa = document.createElementNS(NS, 'svg'); capa.id = 'juego-capa';
  capa.innerHTML = `<line class="linea borde"/><line class="linea"/><text></text><g class="pin era"><path d="${PIN}"/><circle cy="-17.5" r="3.2"/></g><g class="pin mio"><path d="${PIN}"/><circle cy="-17.5" r="3.2"/></g><g class="aca"><circle class="pista borde" r="30"/><circle class="pista" r="30"/></g>`;
  const [lBorde, lLinea, rotulo, pinEra, pinMio, aca] = capa.children;
  const visor = Object.assign(document.createElement('div'), { id: 'juego-visor', innerHTML: '<img alt="">' });
  visor.addEventListener('click', () => visor.classList.remove('ver'));
  document.body.append(capa, el, visor);
  const $ = (s) => el.querySelector(s), cuerpo = $('.cuerpo');

  // --- las fotos que entran, cada una con su blanco: la marca en cuya ficha aparece antes (si está primera, mejor) ---
  const todas = (() => {
    const mejor = new Map();
    for (const m of marcas.marcas) {
      if (m.hoy || !m.el || m.el.classList.contains('buscada')) continue;
      const clave = m.ficha ?? m.nombre; if (SIN_LUGAR.has(clave)) continue;
      const d = fichaDe(clave); if (!d?.fotos) continue;
      d.fotos.forEach((k, i) => {
        if (SIN_FOTO.has(k) || !FOTOS[k]?.que) return;
        const ya = mejor.get(k); if (ya && ya.i <= i) return;
        mejor.set(k, { i, foto: k, x: m.x, z: m.z, nombre: d.titulo ?? m.nombre, margen: m.radio || (m.nivel === 1 ? 90 : 45) });
      });
    }
    for (const [k, nombre] of Object.entries(VA_A)) {
      const m = marcas.marcas.find((m) => !m.hoy && m.nombre === nombre), r = mejor.get(k);
      if (m && r) Object.assign(r, { x: m.x, z: m.z, nombre: fichaDe(m.ficha ?? m.nombre)?.titulo ?? m.nombre, margen: m.radio || (m.nivel === 1 ? 90 : 45) });
    }
    return [...mejor.values()];
  })();

  let activo = false, estado = 'nada', orden = [], n = 0, suma = 0, ronda = null, mio = null, hechas = [];
  // la práctica: la primera vez que se juega (o con `?tutorial`), una foto guiada que no suma, para mostrar cómo es
  let practica = false, forzarPractica = new URLSearchParams(location.search).has('tutorial');
  const vioPractica = () => { try { return localStorage.getItem('juego-practica') === '1'; } catch { return false; } };
  const anotarPractica = () => { try { localStorage.setItem('juego-practica', '1'); } catch { /* da igual */ } };
  const mejorDe = () => { try { return +localStorage.getItem('juego-mejor') || 0; } catch { return 0; } };
  const guardar = (v) => { try { localStorage.setItem('juego-mejor', String(v)); } catch { /* da igual */ } };

  function cabeza() {
    $('.cabeza b').textContent = practica ? 'Cómo se juega' : estado === 'fin' ? 'Fin de la partida' : `Foto ${n + 1}`;
    $('.cabeza span').textContent = practica ? 'de práctica: no suma' : estado === 'fin' ? '' : `te quedan ${metros(Math.max(0, LIMITE - suma))}`;
    $('.barra i').style.width = `${Math.min(100, (suma / LIMITE) * 100)}%`;
  }
  function boton(txt, alTocar, clase = '') { const b = Object.assign(document.createElement('button'), { type: 'button', textContent: txt, className: clase }); b.addEventListener('click', alTocar); return b; }
  function fila(...bs) { const f = Object.assign(document.createElement('div'), { className: 'fila' }); f.append(...bs); return f; }
  function fotoDe(k) {
    const f = FOTOS[k], b = Object.assign(document.createElement('button'), { type: 'button', className: 'foto', title: 'Agrandar la foto' });
    b.innerHTML = `<img alt="Foto de época para ubicar" width="${f.w}" height="${f.h}" decoding="async">`; b.firstChild.src = u(`fotos/m/${k}.webp`);
    b.addEventListener('click', () => { visor.firstChild.src = u(`fotos/${k}.webp`); visor.classList.add('ver'); });
    return b;
  }

  function mostrar() {
    ronda = orden[n]; mio = null; estado = 'busca'; el.classList.remove('chica'); cabeza();
    const dice = Object.assign(document.createElement('p'), { className: 'dice' });
    dice.innerHTML = `<b>¿Dónde es esto?</b> Tocá el lugar en el plano y confirmá.<small>Podés mirar cualquier año: solo cuenta el lugar.</small>`;
    const ok = boton('Confirmar', confirmar); ok.disabled = true; ok.classList.add('ok');
    cuerpo.replaceChildren(fotoDe(ronda.foto), dice, fila(ok)); cuerpo.scrollTop = 0;
    pintar(); pedirCuadro(3);
  }
  function confirmar() {
    if (estado !== 'busca' || !mio) return;
    const real = Math.hypot(mio.x - ronda.x, mio.z - ronda.z), d = Math.max(0, Math.round(real - ronda.margen));
    if (practica) return verPractica(real, d);
    suma += d; hechas.push({ nombre: ronda.nombre, d }); estado = 'vio'; ronda.d = d;
    const fin = suma >= LIMITE, ultima = n + 1 >= orden.length, f = FOTOS[ronda.foto];
    cabeza(); el.classList.add('chica');
    const dice = Object.assign(document.createElement('p'), { className: 'dice' });
    dice.innerHTML = `<b class="cuanto ${d === 0 ? 'bien' : d > 1000 ? 'mal' : ''}">${d === 0 ? '¡En el lugar!' : `+ ${metros(d)}`}</b>${d === 0 ? '' : `Le erraste por ${cuadras(d)}. `}<b></b> <i></i>`;
    dice.querySelectorAll('b')[1].textContent = `${ronda.nombre}.`;
    dice.querySelector('i').textContent = `${f.que} ${[f.autor, f.fecha].filter(Boolean).join(', ')}.`;
    cuerpo.replaceChildren(fotoDe(ronda.foto), dice, fila(boton(fin || ultima ? 'Ver el resultado' : 'Siguiente foto', () => (fin || ultima ? terminar(ultima && !fin) : (n++, volver(), mostrar())))));
    cuerpo.scrollTop = 0;
    encuadrar(real); pintar(); pedirCuadro(3);
  }
  /** La cámara: que entren los dos alfileres (en el teléfono la tarjeta tapa la mitad de abajo: se mira de más lejos,
   *  y se corre el centro, para que queden en la mitad de arriba, que es la que se ve). */
  function encuadrar(real) {
    const chico = innerWidth <= 640, medio = Math.tan((camera.fov * Math.PI) / 360);
    const dist = Math.min(lejos().dist * 1.6, Math.max(chico ? 700 : 520, real * (chico ? 3.3 / Math.min(1, camera.aspect) : 2.8)));
    const pitch = dist > 2600 ? Math.PI / 2 : Math.max(0.7, cam.goal.pitch), a = { x: (mio.x + ronda.x) / 2, z: (mio.z + ronda.z) / 2, dist, pitch };
    if (chico) { const c = (0.24 * 2 * dist * medio) / Math.sin(pitch); a.x += Math.sin(cam.goal.yaw) * c; a.z += Math.cos(cam.goal.yaw) * c; }
    cam.flyTo(a, 1.4);
  }

  // --- la práctica: una foto de un lugar que se reconoce, con el lugar señalado en el plano. Se marca, se confirma y
  // se ve cómo se mide el error; después empieza la partida de verdad. ---
  function practicar() {
    // (la foto: la de un lugar del centro que cualquiera reconoce; si no hubiera, la más cercana a la plaza)
    const de = (t) => todas.find((r) => r.nombre.includes(t));
    const r = de('Cabildo') ?? de('Catedral') ?? de('Casa Rosada') ?? todas.reduce((a, b) => (Math.hypot(a.x, a.z) <= Math.hypot(b.x, b.z) ? a : b));
    practica = true; ronda = { ...r }; mio = null; estado = 'busca'; n = 0; suma = 0; hechas = []; el.classList.remove('chica'); cabeza();
    const dice = Object.assign(document.createElement('p'), { className: 'dice' });
    dice.innerHTML = '<b>Sale una foto de época y hay que marcar en el plano el lugar que muestra.</b><span class="paso"></span><small>En la partida no hay pista ni nombres: se busca mirando la ciudad.</small>';
    dice.querySelector('.paso').textContent = `Esta foto es de «${ronda.nombre}». Te acercamos y te señalamos el lugar con un círculo: tocá el plano ahí, o cerca.`;
    const ok = boton('Confirmar', confirmar); ok.disabled = true; ok.classList.add('ok');
    cuerpo.replaceChildren(fotoDe(ronda.foto), dice, fila(ok, boton('Saltar la práctica', partida, 'otro'))); cuerpo.scrollTop = 0;
    // (cerca, pero no encima: que haya que ubicar el círculo; en el teléfono, corrido a la mitad de arriba)
    const chico = innerWidth <= 640, dist = chico ? 900 : 700, pitch = 1.0, a = { x: ronda.x, z: ronda.z, dist, pitch };
    if (chico) { const c = (0.24 * 2 * dist * Math.tan((camera.fov * Math.PI) / 360)) / Math.sin(pitch); a.x += Math.sin(cam.goal.yaw) * c; a.z += Math.cos(cam.goal.yaw) * c; }
    cam.flyTo(a, 1.6); cam.auto = false;
    pintar(); pedirCuadro(3);
  }
  function verPractica(real, d) {
    estado = 'vio'; ronda.d = d; ronda.real = real; cabeza(); el.classList.add('chica');
    const dice = Object.assign(document.createElement('p'), { className: 'dice' });
    dice.innerHTML = `<b class="cuanto ${d === 0 ? 'bien' : d > 1000 ? 'mal' : ''}"></b><span></span><span class="paso"></span>`;
    dice.querySelector('.cuanto').textContent = d === 0 ? '¡En el lugar!' : `+ ${metros(d)}`;
    dice.querySelector('span').textContent = d === 0
      ? `Tu alfiler quedó a ${metros(real)} del lugar: alrededor de cada uno hay un margen que vale como acierto.`
      : `Tu alfiler (el negro) quedó a ${metros(real)} del lugar (el rojo). Descontado el margen que vale como acierto, se suman ${metros(d)} de error.`;
    dice.querySelector('.paso').textContent = `El error de cada foto se va sumando, y la partida termina cuando juntás ${metros(LIMITE)}. Tu puntaje es cuántas fotos llegaste a ubicar. Podés acercarte, girar la vista y cambiar de año para buscar.`;
    cuerpo.replaceChildren(fotoDe(ronda.foto), dice, fila(boton('Empezar a jugar', partida))); cuerpo.scrollTop = 0;
    encuadrar(real); pintar(); pedirCuadro(3);
  }
  const volver = () => { const v = lejos(); cam.flyTo({ x: v.x, z: v.z, dist: v.dist, pitch: Math.PI / 2 }, 1.2); cam.auto = true; };
  function terminar(todas_) {
    estado = 'fin'; const antes = mejorDe(), cuantas = hechas.length - (suma >= LIMITE ? 1 : 0), record = cuantas > antes; if (record) guardar(cuantas);
    cabeza(); el.classList.remove('chica'); mio = null; ronda = null;
    const fin = Object.assign(document.createElement('div'), { className: 'final' });
    fin.innerHTML = `<h3><span class="n">${cuantas}</span>${cuantas === 1 ? 'foto ubicada' : 'fotos ubicadas'}</h3><p>${todas_ ? '¡Ubicaste todas las fotos sin llegar al tope!' : `Juntaste ${metros(suma)} de error y el tope son ${metros(LIMITE)}.`} ${record ? '<b>Es tu mejor partida.</b>' : antes ? `Tu mejor partida: ${antes}.` : ''}</p><ol></ol>`;
    for (const h of hechas) { const li = document.createElement('li'); li.textContent = h.nombre; li.prepend(Object.assign(document.createElement('span'), { textContent: h.d === 0 ? 'en el lugar' : `+ ${metros(h.d)}` })); fin.querySelector('ol').append(li); }
    const texto = `Ubiqué ${cuantas} ${cuantas === 1 ? 'foto' : 'fotos'} de la Buenos Aires de 1867 a 1940 antes de juntar ${metros(LIMITE)} de error. ¿Cuántas ubicás vos?`;
    const enlace = `${location.origin}${location.pathname}?juego`;
    const compartir = boton('Compartir', async (e) => {
      try { if (navigator.share) await navigator.share({ text: texto, url: enlace }); else { await navigator.clipboard.writeText(`${texto} ${enlace}`); e.target.textContent = 'Copiado'; setTimeout(() => { e.target.textContent = 'Compartir'; }, 1800); } } catch { /* lo canceló */ }
    }, 'otro');
    cuerpo.replaceChildren(fin, fila(boton('Jugar de nuevo', empezar), compartir, boton('Volver al mapa', salir, 'otro'))); cuerpo.scrollTop = 0;
    volver(); pintar(); pedirCuadro(3);
  }

  function empezar() {
    if (!todas.length) return;
    if (!activo) { activo = true; document.body.classList.add('juego'); alEntrar(); }
    if (forzarPractica || !vioPractica()) { forzarPractica = false; practicar(); } else partida();
  }
  function partida() {
    practica = false; anotarPractica();
    // (barajar; y que no salgan seguidas dos fotos del mismo lugar)
    orden = todas.map((r) => ({ ...r })); for (let i = orden.length - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [orden[i], orden[j]] = [orden[j], orden[i]]; }
    for (let i = 1; i < orden.length - 1; i++) if (orden[i].nombre === orden[i - 1].nombre) [orden[i], orden[i + 1]] = [orden[i + 1], orden[i]];
    n = 0; suma = 0; hechas = []; volver(); mostrar();
  }
  function salir() {
    if (!activo) return;
    activo = false; practica = false; estado = 'nada'; mio = null; ronda = null; visor.classList.remove('ver'); document.body.classList.remove('juego'); alSalir(); pedirCuadro(3);
  }
  $('.x').addEventListener('click', salir);
  addEventListener('keydown', (e) => {
    if (!activo || e.target?.tagName === 'INPUT') return;
    if (visor.classList.contains('ver')) { if (e.code === 'Escape') { visor.classList.remove('ver'); e.stopImmediatePropagation(); } return; }
    if (e.code === 'Escape') salir();
    else if (e.code === 'Enter') { e.preventDefault(); el.querySelector('.fila button:not(.otro):not(:disabled)')?.click(); }
    else if (e.code === 'Space') { e.preventDefault(); e.stopImmediatePropagation(); } // (que el espacio no acueste la ciudad en medio de la partida)
  }, true);

  // --- marcar: un toque (o un click) sin arrastre deja el alfiler donde cae en el suelo ---
  const rayo = new THREE.Raycaster(), ndc = new THREE.Vector2(), suelo = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), pt = new THREE.Vector3(), v = new THREE.Vector3();
  let abajo = null, dedos = 0;
  lienzo.addEventListener('pointerdown', (e) => { dedos++; abajo = activo && estado === 'busca' && dedos === 1 && e.button === 0 && !e.shiftKey && !e.ctrlKey ? { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId } : null; });
  lienzo.addEventListener('pointermove', (e) => { if (abajo && (e.pointerId !== abajo.id || Math.hypot(e.clientX - abajo.x, e.clientY - abajo.y) > 7)) abajo = null; });
  const arriba = (e) => {
    dedos = Math.max(0, dedos - 1); const a = abajo; abajo = null;
    if (!a || e.type !== 'pointerup' || e.pointerId !== a.id || performance.now() - a.t > 600 || estado !== 'busca') return;
    camera.updateMatrixWorld(); const r = lienzo.getBoundingClientRect();
    rayo.setFromCamera(ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
    if (!rayo.ray.intersectPlane(suelo, pt)) return;
    mio = { x: pt.x, z: pt.z }; const ok = el.querySelector('.ok'); if (ok) ok.disabled = false;
    if (practica) { const paso = el.querySelector('.dice .paso'); if (paso) paso.textContent = 'Ese alfiler es tu respuesta. Podés tocar otra vez para corregirla; cuando esté, confirmá.'; }
    pintar(); pedirCuadro(2);
  };
  lienzo.addEventListener('pointerup', arriba); lienzo.addEventListener('pointercancel', arriba);

  // --- los alfileres y la línea, sobre la pantalla ---
  const enPantalla = (p) => { v.set(p.x, 0, p.z).project(camera); return v.z < 1 ? [(v.x * 0.5 + 0.5) * innerWidth, (-v.y * 0.5 + 0.5) * innerHeight] : null; };
  const poner = (g, p) => { g.style.display = p ? '' : 'none'; if (p) g.setAttribute('transform', `translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})`); };
  function pintar() {
    if (!activo) return;
    const a = mio ? enPantalla(mio) : null, b = estado === 'vio' && ronda ? enPantalla(ronda) : null;
    poner(pinMio, a); poner(pinEra, b);
    poner(aca, practica && estado === 'busca' && ronda ? enPantalla(ronda) : null); // (la pista de la práctica)
    const ver = practica && ronda ? ronda.real ?? 0 : ronda?.d ?? 0; // (en la práctica se muestra la distancia entera, para que se vea cómo se mide)
    const hay = a && b && ver > (practica ? 3 : 0);
    for (const l of [lBorde, lLinea]) { l.style.display = hay ? '' : 'none'; if (hay) { l.setAttribute('x1', a[0]); l.setAttribute('y1', a[1]); l.setAttribute('x2', b[0]); l.setAttribute('y2', b[1]); } }
    rotulo.style.display = hay ? '' : 'none';
    if (hay) { rotulo.textContent = metros(ver); rotulo.setAttribute('x', (a[0] + b[0]) / 2); rotulo.setAttribute('y', (a[1] + b[1]) / 2 - 8); }
  }

  return { empezar, salir, update: pintar, get activo() { return activo; }, get fotos() { return todas.length; }, /** (para las pruebas) */ get ronda() { return ronda; }, get estado() { return estado; }, get suma() { return suma; }, get practica() { return practica; } };
}
