// La ficha: al tocar un lugar (su marca, o el edificio mismo), una hoja al costado cuenta qué era —en 1867 o en el año
// de la línea de tiempo en que aparece— y muestra fotos de la época. Los textos y la lista de fotos están en fichas.js;
// las imágenes, en public/fotos (se piden recién al abrir la ficha). En el teléfono es una hoja que sube desde abajo.
// Y para que se note que se puede tocar: al pasar el mouse por un edificio con ficha, el cursor cambia y su marca se
// resalta (los estilos de las marcas, en index.html).
import * as THREE from 'three';
import { FICHAS, FOTOS, ficha as fichaDe } from './fichas.js';
import { u } from './url.js';

const CSS = `
#ficha { position: fixed; z-index: 8; right: 26px; top: 24px; width: min(372px, calc(100vw - 52px)); max-height: calc(100vh - 24px - 104px); max-height: calc(100dvh - 24px - 104px); box-sizing: border-box; display: flex; flex-direction: column; color: #2a221b; background: #f1e6cd; border: 1px solid #2a221b; outline: 1px solid #2a221b99; outline-offset: 2px; box-shadow: 0 8px 34px #0008; opacity: 0; visibility: hidden; transform: translateX(14px); transition: opacity .35s, transform .35s, visibility .35s; }
body.hoy #ficha { max-height: calc(100vh - 24px - 204px); max-height: calc(100dvh - 24px - 204px); }
#ficha.ver { opacity: 1; visibility: visible; transform: none; }
#ficha.hoy { border-color: #a03220; outline-color: #a0322099; }
#ficha .cabeza { flex: none; padding: 13px 44px 10px 18px; border-bottom: 1px solid #2a221b44; }
#ficha h2 { margin: 0; font-size: 21px; font-weight: 500; letter-spacing: .07em; font-variant: small-caps; line-height: 1.15; }
#ficha.hoy h2 { color: #a03220; font-variant: normal; letter-spacing: .03em; }
#ficha .era { margin: 3px 0 0; font-size: 13.5px; font-style: italic; opacity: .82; line-height: 1.35; }
#ficha .x { position: absolute; right: 7px; top: 7px; width: 32px; height: 32px; padding: 0; cursor: pointer; font: inherit; font-size: 24px; line-height: 30px; color: inherit; background: none; border: 0; border-radius: 0; opacity: .6; }
#ficha .x:hover { opacity: 1; background: #2a221b14; }
#ficha .cuerpo { min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 12px 18px 16px; -webkit-user-select: text; user-select: text; }
#ficha .texto p { margin: 0 0 8px; font-size: 14.5px; line-height: 1.5; }
#ficha .texto p.hoyes { margin-top: 10px; padding-top: 8px; border-top: 1px solid #2a221b33; font-size: 13.5px; }
#ficha .texto p.hoyes b { font-weight: 500; letter-spacing: .08em; font-variant: small-caps; }
#ficha .fotos { margin: 0 0 12px; display: flex; flex-direction: column; gap: 12px; }
#ficha .fotos.mas { margin: 12px 0 0; padding-top: 12px; border-top: 1px solid #2a221b33; }
#ficha .fotos.una figure img { max-height: 290px; object-fit: cover; object-position: 50% 42%; }
#ficha .fotos:empty { display: none; }
#ficha figure { margin: 0; }
#ficha figure button { display: block; width: 100%; padding: 0; cursor: zoom-in; background: #2a221b; border: 1px solid #2a221b; border-radius: 0; line-height: 0; }
#ficha figure img { display: block; width: 100%; height: auto; filter: sepia(.12); transition: opacity .2s; }
#ficha figure button:hover img { opacity: .9; }
#ficha figcaption { margin-top: 5px; font-size: 12px; line-height: 1.38; opacity: .86; }
#ficha figcaption b { font-weight: 500; font-style: normal; }
#ficha figcaption i { opacity: .9; }
#ficha .sinfoto { margin: 2px 0 0; font-size: 12px; font-style: italic; opacity: .6; }
.marca.fichada .tag i { display: none !important; }
.marca.fichada.abierta .tag { padding: 3px 9px 4px; }

#visor { position: fixed; inset: 0; z-index: 30; display: grid; grid-template-rows: minmax(0, 1fr) auto; place-items: center; gap: 10px; padding: 18px 18px 14px; box-sizing: border-box; background: #14110ff2; opacity: 0; visibility: hidden; transition: opacity .25s, visibility .25s; }
#visor.ver { opacity: 1; visibility: visible; }
#visor img { max-width: 100%; max-height: 100%; min-height: 0; object-fit: contain; border: 1px solid #f1e6cd55; box-shadow: 0 10px 50px #000; background: #2a221b; }
#visor .pie { max-width: 820px; text-align: center; color: #efe4cd; font-size: 14px; line-height: 1.45; -webkit-user-select: text; user-select: text; }
#visor .pie a { color: #e9b9a6; text-underline-offset: 2px; white-space: nowrap; }
#visor .pie i { opacity: .85; }
#visor button { position: absolute; cursor: pointer; font: inherit; color: #efe4cd; background: #2a221bcc; border: 1px solid #efe4cd66; border-radius: 0; width: 42px; height: 42px; padding: 0; font-size: 24px; line-height: 38px; }
#visor button:hover { background: #453a30; }
#visor .x { right: 14px; top: 14px; }
#visor .ant { left: 14px; top: 50%; margin-top: -21px; } #visor .sig { right: 14px; top: 50%; margin-top: -21px; }
#visor.una .ant, #visor.una .sig { display: none; }

@media (max-width: 640px) {
  #ficha { right: 10px; left: 10px; top: auto; bottom: 66px; width: auto; max-height: 46vh; max-height: 46dvh; transform: translateY(16px); }
  body.hoy #ficha { max-height: 46vh; max-height: 46dvh; }
  #ficha .cabeza { padding: 9px 42px 8px 13px; } #ficha h2 { font-size: 18px; } #ficha .era { font-size: 12.5px; }
  #ficha .cuerpo { padding: 10px 13px 12px; }
  #ficha .fotos.una figure img { max-height: 150px; object-fit: cover; }
  #ficha .fotos.mas { flex-direction: row; overflow-x: auto; gap: 9px; scroll-snap-type: x proximity; margin: 10px -13px 0; padding: 10px 13px 0; }
  #ficha .fotos.mas figure { flex: none; width: 62%; scroll-snap-align: center; } #ficha .fotos.mas figure:only-child { width: 100%; }
  #ficha .fotos.mas figure img { height: 112px; object-fit: cover; }
  #ficha figcaption { font-size: 11.5px; }
  #ficha .texto p { font-size: 13.5px; }
  #visor { padding: 10px 8px 12px; } #visor .pie { font-size: 12.5px; }
  #ficha { right: calc(10px + var(--sr)); left: calc(10px + var(--sl)); bottom: calc(68px + var(--sb)); }
}
/* con el dedo: los botones, de 44 px */
@media (pointer: coarse) {
  #ficha .x { width: 44px; height: 44px; right: 2px; top: 2px; font-size: 26px; line-height: 42px; }
  #ficha .cabeza { padding-right: 48px; }
  #visor button { width: 46px; height: 46px; line-height: 42px; }
  #ficha .cuerpo { -webkit-overflow-scrolling: touch; touch-action: pan-y; } #ficha .fotos.mas { touch-action: pan-x pan-y; }
}
/* el teléfono acostado: la ficha al costado, del alto que deja la fila de botones */
@media (max-height: 500px) and (min-width: 641px) {
  #ficha { top: calc(10px + var(--st)); right: calc(14px + var(--sr)); width: min(340px, 44vw); max-height: calc(100vh - 82px - var(--st) - var(--sb)); max-height: calc(100dvh - 82px - var(--st) - var(--sb)); }
  body.hoy #ficha { max-height: calc(100vh - 82px - var(--st) - var(--sb)); max-height: calc(100dvh - 82px - var(--st) - var(--sb)); }
  #ficha .cabeza { padding-top: 9px; padding-bottom: 8px; } #ficha h2 { font-size: 18px; } #ficha .cuerpo { padding: 10px 14px 12px; }
  #ficha .fotos.una figure img { max-height: 150px; } #ficha .texto p { font-size: 13.5px; }
  #visor { padding: 8px 60px; }
}
body.limpio #ficha { display: none; }
`;

const HTML = `
<button class="x" type="button" aria-label="Cerrar">×</button>
<div class="cabeza"><h2></h2><p class="era"></p></div>
<div class="cuerpo"><div class="fotos una"></div><div class="texto"></div><div class="fotos mas"></div></div>`;

const pieDe = (f) => `<b>${f.que}</b> <i>${[f.autor, f.fecha].filter(Boolean).join(', ')}.</i>${f.nota ? ' ' + f.nota : ''}`;

/**
 * @param camera, cam (la de camara.js), lienzo (el canvas), marcas (lo que devuelve createMarcas; puede faltar)
 * Devuelve { abrir(m, a), cerrar(), abierta }.  `m` es una marca de marcas.js (se lee su nombre y su nota de la
 * etiqueta); `a`, si se pasa, es el destino del vuelo de la cámara ({ x, z, dist, pitch }): se lo corre para que el
 * lugar no quede tapado por la ficha.
 */
export function createFicha({ camera, cam, lienzo, marcas, U = null, pedirCuadro = () => {}, junto = null, etapa = () => 0 }) {
  document.head.appendChild(Object.assign(document.createElement('style'), { textContent: CSS }));
  const el = Object.assign(document.createElement('aside'), { id: 'ficha', innerHTML: HTML });
  el.setAttribute('aria-live', 'polite');
  const visor = Object.assign(document.createElement('div'), { id: 'visor', innerHTML: '<img alt=""><div class="pie"></div><button class="x" type="button" aria-label="Cerrar">×</button><button class="ant" type="button" aria-label="Anterior">‹</button><button class="sig" type="button" aria-label="Siguiente">›</button>' });
  document.body.append(el, visor);
  const $ = (s, r = el) => r.querySelector(s);
  let abierta = null, fotos = [], enVisor = -1;

  // --- el visor: la foto grande ---
  function ver(i) {
    enVisor = (i + fotos.length) % fotos.length;
    const f = fotos[enVisor], img = $('img', visor);
    img.src = u(`fotos/${f.archivo}.webp`); img.alt = f.que;
    $('.pie', visor).innerHTML = `${pieDe(f)} <a href="${f.fuente}" target="_blank" rel="noopener">Ver en Wikimedia Commons ↗</a>`;
    visor.classList.toggle('una', fotos.length < 2); visor.classList.add('ver');
  }
  const cerrarVisor = () => { enVisor = -1; visor.classList.remove('ver'); };
  visor.addEventListener('click', (e) => { if (e.target === visor || e.target.tagName === 'IMG') cerrarVisor(); });
  $('.x', visor).addEventListener('click', cerrarVisor);
  $('.ant', visor).addEventListener('click', () => ver(enVisor - 1));
  $('.sig', visor).addEventListener('click', () => ver(enVisor + 1));
  // con el dedo: deslizar hacia los costados pasa de foto; hacia abajo, cierra
  { let t0 = null;
    visor.addEventListener('touchstart', (e) => { t0 = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null; }, { passive: true });
    visor.addEventListener('touchend', (e) => {
      const a = t0, p = e.changedTouches[0]; t0 = null; if (!a || !p || enVisor < 0) return;
      const dx = p.clientX - a.x, dy = p.clientY - a.y;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5 && fotos.length > 1) { e.preventDefault(); ver(enVisor + (dx < 0 ? 1 : -1)); }
      else if (dy > 70 && dy > Math.abs(dx) * 1.5) { e.preventDefault(); cerrarVisor(); }
    });
  }

  // --- la ficha ---
  const nombreDe = (m) => m.el.querySelector('.tag b')?.textContent ?? '';
  // El velo: un manto claro sobre el edificio que se puede tocar (lo pinta src/tinta.js, uSobre). Fuerte bajo el mouse
  // —o con el mouse en su etiqueta—; más suave sobre el de la ficha abierta, para que se vea de cuál se habla.
  // Se aclara el edificio y nada alrededor: si junto a la marca hay un edificio suelto (junto(), en src/hitos.js), ese
  // entero; si es parte de un lugar más grande, las piezas a menos del radio; si no tiene modelo propio, las casas que
  // haya ahí. Las plazas, los diques y las avenidas (`velo: 'suelo'` en src/marcas.js) son suelo: se aclara el suelo.
  function apuntar(m) {
    const r = m.radio || (m.nivel === 1 ? 75 : 48), que = U.uSobreQue.value;
    const j = m.velo || !junto ? null : junto(m.x, m.z, r, etapa());
    if (j?.ancla) { U.uSobre.value.set(m.x, m.z, j.ancla, velo.k); que.set(1, 0, 0, 0); return; }
    U.uSobre.value.set(m.x, m.z, r, velo.k);
    if (m.velo === 'suelo') que.set(r < 30 ? 0 : 2, 1, r < 30 ? 0 : 1, 0); // (lo chico, una fuente: con sus piezas)
    else que.set(0, 0, 0, j && !j.hay ? 1 : 0); // (sin piezas a la vista: también las casas sin nombre que haya ahí)
  }
  const velo = { m: null, k: 0, meta: 0, pide: 0, encima: null, tag: null };
  const veloDe = () => { const m = velo.encima ?? velo.tag ?? abierta; return m && !m.hoy && m.vale !== false ? m : null; };
  function velar() {
    if (!U?.uSobre) return;
    const m = veloDe();
    if (m && m !== velo.m && velo.k > 0.02) velo.meta = 0; // (de un edificio a otro: primero se apaga)
    else { if (m) { velo.m = m; apuntar(m); } velo.meta = !m ? 0 : m === velo.encima || m === velo.tag ? 1 : 0.6; }
    if (velo.k !== velo.meta) velo.pide ||= requestAnimationFrame(paso);
  }
  function paso() {
    velo.pide = 0;
    const d = velo.meta - velo.k; velo.k = Math.abs(d) < 0.04 ? velo.meta : velo.k + d * 0.3;
    U.uSobre.value.w = velo.k; pedirCuadro(2);
    if (velo.k !== velo.meta) velo.pide = requestAnimationFrame(paso);
    else if (velo.k === 0) { velo.m = null; velar(); } // (apagado: si esperaba otro, ahora se prende)
  }
  // Corre el destino del vuelo para que el lugar quede en el medio de lo que la ficha deja libre: más arriba en el
  // teléfono (la ficha sube desde abajo) y, en ventanas angostas, más a la izquierda.
  function encuadrar(a) {
    if (!a || !cam) return;
    const W = innerWidth, H = innerHeight, yaw = cam.goal.yaw, s = Math.sin(yaw), c = Math.cos(yaw);
    const medio = Math.tan((camera.fov * Math.PI) / 360), pitch = Math.max(0.3, a.pitch ?? cam.goal.pitch), dist = a.dist ?? cam.goal.dist;
    if (W <= 640) { const d = (0.23 * 2 * dist * medio) / Math.sin(pitch); a.x += s * d; a.z += c * d; }
    else if (W < 1080) { const d = ((el.offsetWidth + 26) / 2 / W) * 2 * dist * medio * camera.aspect; a.x += c * d; a.z -= s * d; }
  }
  function abrir(m, a) {
    if (!m?.el || m.el.classList.contains('buscada')) return false;
    // (la ficha se busca por el nombre de la marca, salvo que la marca diga otra clave: hay dos Teatro Colón)
    const nombre = nombreDe(m), nota = m.el.querySelector('.tag i')?.textContent ?? '', d = fichaDe(m.ficha ?? nombre, { hoy: m.el.classList.contains('hoy'), nota });
    if (!d) return false;
    m.el.classList.add('fichada'); m.w = 0; // (la notita de la marca ya no hace falta: lo cuenta la ficha)
    abierta = m; fotos = (d.fotos ?? []).map((k) => ({ archivo: k, ...FOTOS[k] })).filter((f) => f.que);
    el.classList.toggle('hoy', !!d.hoy);
    $('h2').textContent = d.titulo ?? nombre; { const era = d.eras?.[m.desde] ?? d.era ?? ''; $('.era').textContent = era; $('.era').hidden = !era; } // (`eras`: lo que cambia con la época de la marca, como el Cabildo)
    $('.texto').innerHTML = d.texto.map((p) => `<p>${p}</p>`).join('') + (d.hoyEs ? `<p class="hoyes"><b>Hoy</b> · ${d.hoyEs}</p>` : '') + (fotos.length || d.hoy ? '' : '<p class="sinfoto">Sin imagen de época confiable de este lugar.</p>');
    const una = $('.fotos.una'), mas = $('.fotos.mas'); una.textContent = ''; mas.textContent = '';
    fotos.forEach((f, i) => {
      const fig = document.createElement('figure');
      fig.innerHTML = `<button type="button" aria-label="Agrandar la imagen"><img loading="lazy" decoding="async" alt="" width="${f.w}" height="${f.h}"></button><figcaption>${pieDe(f)}</figcaption>`;
      const img = fig.querySelector('img'); img.alt = f.que; img.src = u(`fotos/m/${f.archivo}.webp`);
      fig.querySelector('button').addEventListener('click', () => ver(i));
      (i ? mas : una).appendChild(fig);
    });
    $('.cuerpo').scrollTop = 0; mas.scrollLeft = 0;
    el.classList.add('ver'); document.body.classList.add('ficha');
    encuadrar(a); velar();
    return true;
  }
  function cerrar() { if (!abierta) return; abierta = null; el.classList.remove('ver'); document.body.classList.remove('ficha'); cerrarVisor(); velar(); }
  $('.x').addEventListener('click', cerrar);
  // si se vuelve a tocar la marca abierta (marcas.js la cierra) o se apaga «lo de hoy» con una ficha roja a la vista, se va con ella
  addEventListener('click', (e) => { if (abierta && e.target.closest?.('.marca.abierta .tag') && abierta.el.contains(e.target)) cerrar(); }, true);
  new MutationObserver(() => { if (abierta?.hoy && !document.body.classList.contains('hoy')) cerrar(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  // y si al cambiar de año la marca abierta deja de existir (la Recova en 1888), también
  if (marcas) marcas.alCaer = (m) => { if (abierta === m) cerrar(); };
  addEventListener('keydown', (e) => {
    if (enVisor >= 0) {
      if (e.code === 'Escape') cerrarVisor(); else if (e.code === 'ArrowLeft') ver(enVisor - 1); else if (e.code === 'ArrowRight') ver(enVisor + 1); else return;
      e.preventDefault(); e.stopImmediatePropagation();
    } else if (abierta && e.code === 'Escape' && e.target?.tagName !== 'INPUT') cerrar();
  }, true);

  // --- tocar el edificio mismo: un click sin arrastre elige el lugar con nombre más cercano a lo tocado ---
  if (marcas && lienzo) {
    const rayo = new THREE.Raycaster(), ndc = new THREE.Vector2();
    // Con el dedo, las etiquetas de las marcas no atajan el toque (index.html): se busca acá cuál se tocó. Y el toque
    // sobre un edificio espera un instante antes de elegir: si enseguida viene otro, eran dos toques para acercar.
    const conDedo = matchMedia('(pointer: coarse)').matches;
    let abajo = null, espera = 0;
    lienzo.addEventListener('pointerdown', (e) => { clearTimeout(espera); espera = 0; abajo = e.isPrimary && e.button === 0 ? { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId } : null; });
    lienzo.addEventListener('pointermove', (e) => { if (abajo && (e.pointerId !== abajo.id || Math.hypot(e.clientX - abajo.x, e.clientY - abajo.y) > 6)) abajo = null; });
    lienzo.addEventListener('pointerup', (e) => {
      const a = abajo; abajo = null;
      if (!a || e.pointerId !== a.id || performance.now() - a.t > 450 || document.body.classList.contains('juego')) return; // (jugando, el toque marca: src/juego.js)
      const cx = e.clientX, cy = e.clientY;
      if (conDedo) { const m = marcas.enPunto(cx, cy, 9); if (m) { m.el.querySelector('.tag')?.click(); return; } }
      if (e.pointerType === 'touch') espera = setTimeout(() => { espera = 0; elegir(cx, cy); }, 340); else elegir(cx, cy);
    });
    /** La marca del lugar que está bajo un punto de la pantalla (o null): el lugar con nombre más cercano a lo que se
     *  toca. Cada marca vale por un cilindro parado en su lugar, del alto del edificio: así se acierta tanto al pie
     *  como a la punta de una torre (mirando de costado, el techo tapa el suelo de más atrás). */
    function bajo(cx, cy) {
      if (document.body.classList.contains('juego')) return null;
      camera.updateMatrixWorld();
      const r = lienzo.getBoundingClientRect();
      ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      rayo.setFromCamera(ndc, camera);
      const o = rayo.ray.origin, d = rayo.ray.direction; if (d.y > -0.02) return null;
      const altura = o.y, hoyOn = document.body.classList.contains('hoy'), arriba = document.body.classList.contains('arriba');
      if (altura > 4200) return null;
      const llano = d.x * d.x + d.z * d.z;
      let mejor = null, dMejor = Infinity;
      for (const m of marcas.marcas) {
        if (m.vale === false) continue; // (no es del año que se mira)
        if (m.hoy && !hoyOn) continue;
        if (m.el.classList.contains('buscada')) continue;
        // (dónde pasa el rayo más cerca del eje del lugar; si ahí va por encima del techo o por debajo del suelo, se
        // mide donde cruza el techo o el suelo. Con la ciudad acostada no hay alto: se mide en el suelo.)
        const techo = arriba ? m.alto ?? 0 : 0, t0 = llano > 1e-6 ? ((m.x - o.x) * d.x + (m.z - o.z) * d.z) / llano : -o.y / d.y;
        const y = Math.min(techo, Math.max(0, o.y + d.y * t0)), t = (y - o.y) / d.y;
        const lejos = Math.hypot(o.x + d.x * t - m.x, o.z + d.z * t - m.z), radio = (m.radio || (m.nivel === 1 ? 75 : 48)) + altura * 0.012; // (de lejos, el dedo es más grueso)
        if (lejos < radio && lejos < dMejor) { dMejor = lejos; mejor = m; }
      }
      return mejor;
    }
    function elegir(cx, cy) {
      const mejor = bajo(cx, cy); if (!mejor) return;
      if (mejor.el.classList.contains('abierta')) abrir(mejor); else mejor.el.querySelector('.tag')?.click();
    }
    // Con mouse: al pasar por un edificio con ficha, el cursor es la manito y su marca se resalta. Una sola prueba por
    // cuadro, por más que el mouse mande muchos avisos, y ninguna mientras se arrastra la cámara (o con el dedo: no hay
    // dónde «pasar»).
    if (!conDedo) {
      let pide = 0, mx = 0, my = 0, encima = null;
      const soltar = () => { cancelAnimationFrame(pide); pide = 0; if (encima) { encima = null; marcas.sobre(null); lienzo.style.cursor = ''; velo.encima = null; velar(); } };
      const probar = () => {
        pide = 0;
        const m = bajo(mx, my), con = m && fichaDe(m.ficha ?? nombreDe(m), { hoy: m.hoy }) ? m : null;
        if (con === encima) return;
        encima = con; marcas.sobre(con); lienzo.style.cursor = con ? 'pointer' : ''; velo.encima = con; velar();
      };
      lienzo.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse' || e.buttons) { soltar(); return; }
        mx = e.clientX; my = e.clientY; pide ||= requestAnimationFrame(probar);
      });
      lienzo.addEventListener('pointerdown', soltar);
      lienzo.addEventListener('pointerleave', soltar);
      // (y con el mouse sobre la etiqueta misma, también se vela su edificio)
      for (const m of marcas.marcas) {
        const t = m.el.querySelector('.tag'); if (!t) continue;
        t.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && m.vale !== false && fichaDe(m.ficha ?? nombreDe(m), { hoy: m.hoy })) { velo.tag = m; velar(); } });
        t.addEventListener('pointerleave', () => { if (velo.tag === m) { velo.tag = null; velar(); } });
      }
      // (y con la rueda la ciudad se mueve bajo el mouse quieto: se vuelve a mirar qué quedó debajo)
      lienzo.addEventListener('wheel', (e) => { mx = e.clientX; my = e.clientY; pide ||= requestAnimationFrame(probar); }, { passive: true });
    }
  }
  return { abrir, cerrar, get abierta() { return abierta; }, FICHAS };
}
