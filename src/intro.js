// El cartel de entrada: qué es esto, cómo era la ciudad en 1867 y de dónde salen los datos. Tapa la vista hasta que
// se lo cierra; después se lo puede volver a abrir tocando el título.
import { u } from './url.js';

const PLANO = 'https://commons.wikimedia.org/wiki/File:Plano_topografico_de_la_Ciudad_de_Buenos_Aires_y_de_todo_su_Municipio_incluyendo_parte_de_los_partidos_de_Belgrano,_San_Jose_de_Flores_y_Barracas_al_Sur_-_levantado_por_el_Departamento_Topografico,_construido_y_dibuj..._-_btv1b53098699s.jpg';

const CSS = `
#intro { position: fixed; inset: 0; z-index: 20; display: grid; place-items: center; padding: max(14px, var(--st)) max(14px, var(--sr)) max(14px, var(--sb)) max(14px, var(--sl)); box-sizing: border-box; background: #1d1a17a6; opacity: 0; visibility: hidden; transition: opacity .5s, visibility .5s; }
#intro.ver { opacity: 1; visibility: visible; }
#intro .hoja { box-sizing: border-box; width: min(1040px, 100%); max-height: calc(100vh - 28px - var(--st) - var(--sb)); max-height: calc(100dvh - 28px - var(--st) - var(--sb)); display: flex; flex-direction: column; color: #2a221b; background: #f1e6cd; border: 1px solid #2a221b; outline: 1px solid #2a221b99; outline-offset: 3px; box-shadow: 0 14px 60px #000b; transform: translateY(10px); transition: transform .5s; }
#intro.ver .hoja { transform: none; }
#intro .texto { min-height: 0; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; touch-action: pan-y; padding: 26px 34px 6px; -webkit-user-select: text; user-select: text; }
#intro .cols { display: grid; grid-template-columns: 1fr 1fr; grid-template-areas: 'a b' 'c b'; grid-template-rows: auto 1fr; gap: 0 40px; }
#intro .cols > :nth-child(1) { grid-area: a; } #intro .cols > :nth-child(2) { grid-area: b; } #intro .cols > :nth-child(3) { grid-area: c; }
#intro h2 { margin: 0; font-size: 34px; font-weight: 500; letter-spacing: .03em; line-height: 1.1; }
#intro .bajada { margin: 5px 0 0; font-style: italic; font-size: 16px; opacity: .82; }
/* quién lo hizo: la firma, arriba a la derecha (en lo angosto baja debajo del título) */
#intro .cabeza { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 10px 28px; }
#intro .autor { flex: none; display: flex; align-items: center; gap: 10px; color: #2a221b; text-decoration: none; font-size: 14.5px; line-height: 1.2; }
#intro .autor img { display: block; width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 1px solid #2a221b; outline: 1px solid #2a221b99; outline-offset: 2px; }
#intro .autor i { display: block; font-size: 12px; letter-spacing: .1em; text-transform: uppercase; font-style: normal; opacity: .7; }
#intro .autor b { font-weight: 600; letter-spacing: .01em; }
#intro .autor:hover b { text-decoration: underline; text-underline-offset: 2px; }
#intro h3 { margin: 18px 0 5px; padding-top: 13px; border-top: 1px solid #2a221b55; font-size: 13.5px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; }
#intro p { margin: 0 0 8px; font-size: 16px; line-height: 1.5; }
#intro ul { margin: 0; padding: 0; list-style: none; }
#intro li { margin: 0 0 6px; padding-left: 15px; position: relative; font-size: 14.5px; line-height: 1.45; }
#intro li::before { content: ''; position: absolute; left: 2px; top: .62em; width: 5px; height: 5px; border-radius: 50%; background: #2a221b; }
#intro li em { opacity: .78; }
#intro a { color: #a03220; text-underline-offset: 2px; }
#intro .pie { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 34px 20px; }
#intro .pie span { font-size: 12.5px; font-style: italic; opacity: .7; }
#intro .entrar { flex: none; min-height: 46px; cursor: pointer; font: inherit; font-size: 17px; letter-spacing: .03em; color: #f7eedb; background: #2a221b; border: 1px solid #2a221b; border-radius: 0; outline: 1px solid #2a221b99; outline-offset: 2px; padding: 10px 24px; }
#intro .entrar:hover { background: #453a30; }
#intro .entrar:active { transform: translateY(1px); }
#titulo { pointer-events: auto; cursor: pointer; }
#titulo:hover { background: #fff6e2; }
#titulo .acerca { margin-top: 5px; font-style: normal; font-size: 12px; letter-spacing: .04em; text-decoration: underline; text-underline-offset: 2px; opacity: .7; }
@media (max-width: 900px) { #intro .hoja { width: min(680px, 100%); } #intro .cols { display: block; } }
@media (max-width: 640px) {
  #intro { padding: max(10px, var(--st)) max(10px, var(--sr)) max(10px, var(--sb)) max(10px, var(--sl)); }
  #intro .hoja { max-height: calc(100vh - 20px - var(--st) - var(--sb)); max-height: calc(100dvh - 20px - var(--st) - var(--sb)); }
  #intro .texto { padding: 18px 18px 4px; }
  #intro h2 { font-size: 27px; } #intro .bajada { font-size: 14.5px; }
  #intro p { font-size: 15px; } #intro li { font-size: 13.5px; }
  #intro .pie { padding: 12px 18px 16px; } #intro .pie span { display: none; } #intro .entrar { width: 100%; }
}
/* el teléfono acostado: poco alto, así que menos aire */
@media (max-height: 500px) {
  #intro .texto { padding-top: 14px; } #intro h2 { font-size: 24px; } #intro .bajada { font-size: 14px; }
  #intro h3 { margin-top: 12px; padding-top: 9px; } #intro .pie { padding: 8px 18px 10px; } #intro .entrar { min-height: 44px; padding: 6px 24px; }
}
`;

const HTML = `
<div class="hoja" role="dialog" aria-modal="true" aria-labelledby="intro-t">
  <div class="texto">
    <div class="cabeza"><div>
    <h2 id="intro-t">Buenos Aires, de 1867 a 1940</h2>
    <p class="bajada">Un plano de hace más de siglo y medio, levantado manzana por manzana, y la ciudad que creció encima.</p>
    </div>
    <a class="autor" href="https://x.com/mormonnegro" target="_blank" rel="noopener" title="@mormonnegro en X"><img src="${u('autor.webp')}" alt="" width="44" height="44"><span><i>Hecho por</i><b>@mormonnegro</b></span></a>
    </div>

    <div class="cols"><div>
    <h3>Qué estás viendo</h3>
    <p>El plano topográfico de la ciudad, obra de Carlos Glade, que el Departamento Topográfico de la provincia publicó en 1867, tendido sobre una mesa. De ese dibujo sale la ciudad que se levanta: las manzanas, lo edificado y los patios, las casillas, las quintas y los árboles están donde el plano los pone.</p>
    <p>Lo que el plano no dice —dónde termina una casa y empieza la otra, cuántos pisos tenía, cómo era su frente— está completado con las costumbres de la época, y los edificios principales, con fotos tomadas tres años antes.</p>

    <h3>Y los años que siguen</h3>
    <p>La ciudad no se queda en 1867. Abajo, la línea de tiempo la lleva a <b>1888, 1895, 1905, 1910, 1921 y 1940</b> (el ▶ los recorre solo). Sobre el mismo plano se levantan las casas que traen los planos de cada año, el río retrocede cuando se hace el puerto, se abren la Avenida de Mayo, las diagonales y la 9 de Julio, y las calles pasan de la tierra al adoquín y al asfalto.</p>
    <p>Cada año trae sus edificios y sus plazas, hechos a partir de fotos de entonces: la Casa Rosada, el Congreso y su plaza, el Teatro Colón, Retiro, los diques con sus barcos, la Plaza de Mayo de cada época, el Obelisco. Los que tienen etiqueta se pueden tocar: cuentan qué eran y muestran cómo se veían. Están todos, uno por uno, en <a href="./edificios.html">la página de los edificios</a>.</p>
    <p>Y se la puede recorrer por adentro: <b>a pie</b>, <b>en avión</b> o <b>manejando</b> el coche de cada año, de la volanta de 1867 al Ford V8 de 1940, con los botones de abajo.</p>

    </div><div>
    <h3>La ciudad en 1867</h3>
    <p>Tenía unos 180.000 habitantes. Era presidente Bartolomé Mitre y el país estaba en guerra con el Paraguay. Casi todas las casas eran bajas, de azotea y patios: lo más alto eran las torres de las iglesias.</p>
    <p>El río llegaba al pie de la barranca, por donde hoy corren Paseo Colón y Leandro N. Alem. No había puerto: los barcos fondeaban lejos de la costa y se bajaba a tierra por el muelle de pasajeros o por el de la Aduana Nueva. La Plaza de Mayo eran dos, la de la Victoria y la 25 de Mayo, separadas por la Recova Vieja.</p>
    <p>El ferrocarril tenía diez años y salía de la Estación del Parque, donde hoy está el Teatro Colón; las calles del centro se alumbraban a gas. Ese año llegó el cólera, y cuatro años después, la fiebre amarilla. No existían la Avenida de Mayo, la 9 de Julio, el Obelisco ni el Congreso, y Flores y Belgrano eran pueblos aparte.</p>

    <h3>Y la ciudad de hoy</h3>
    <ul>
      <li>«Ver lo de hoy» estampa en rojo, sobre el plano, las calles (con sus nombres al acercarte), las vías y la costa actuales, de <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>, © sus colaboradores, licencia ODbL. <em>En el centro calza con pocos metros de error; en las afueras, hasta algunas decenas.</em></li>
      <li>Arriba a la izquierda podés buscar una dirección actual y ver dónde caería. <em>La búsqueda se consulta en el normalizador de direcciones de la Ciudad (USIG) y en Nominatim, de OpenStreetMap.</em></li>
    </ul>
    </div><div>
    <h3>De dónde salen los datos</h3>
    <ul>
      <li><a href="${PLANO}" target="_blank" rel="noopener"><i>Plano topográfico de la Ciudad de Buenos Aires y de todo su Municipio</i></a>, de Carlos Glade, Departamento Topográfico, 1867. Ejemplar de la Bibliothèque nationale de France, vía Wikimedia Commons; dominio público. <em>Es la única fuente de la forma de la ciudad: calles, manzanas, construcciones y arboledas se leen de ahí.</em></li>
      <li>Los planos de Latzina (1888), de la Municipalidad (1895), de Pablo Ludwig (1905 y 1910), de Cannizzaro (1921) y de Peuser (1936), calzados sobre el de 1867. <em>De ahí sale lo que la ciudad creció en cada año; las plazas, el puerto y los edificios nuevos, de fotos de época de Wikimedia Commons.</em></li>
      <li><i>Recuerdos de Buenos Ayres</i>, fotografías de Esteban Gonnet, 1864. <em>Para modelar el Cabildo, la Recova, el primer Teatro Colón y la Aduana.</em></li>
      <li><i>Buenos-Ayres a vista de pájaro</i>, litografía de J. Dulin. <em>Como referencia del aspecto general y las alturas.</em></li>
    </ul>
    </div></div>
  </div>
  <div class="pie"><span class="como">Arrastrá para moverte, acercate con la rueda y tocá un nombre para ir.</span><button class="entrar">Ver la ciudad</button></div>
</div>`;

export function createIntro() {
  document.head.appendChild(Object.assign(document.createElement('style'), { textContent: CSS }));
  const el = Object.assign(document.createElement('div'), { id: 'intro', innerHTML: HTML });
  if (matchMedia('(pointer: coarse)').matches) el.querySelector('.como').textContent = 'Un dedo mueve el plano; dos dedos lo acercan, lo giran y lo inclinan. Tocá un nombre para ir.';
  document.body.appendChild(el);
  let abierta = false, avisar;
  const cerrada = new Promise((r) => { avisar = r; });
  const abrir = () => { abierta = true; el.classList.add('ver'); el.querySelector('.texto').scrollTop = 0; el.querySelector('.entrar').focus({ preventScroll: true }); };
  const cerrar = () => { if (!abierta) return; abierta = false; el.classList.remove('ver'); document.activeElement?.blur?.(); avisar(); };
  el.querySelector('.entrar').addEventListener('click', cerrar);
  el.addEventListener('pointerdown', (e) => { if (e.target === el) cerrar(); });
  // mientras está abierto, el teclado es suyo: que el espacio no levante la ciudad por detrás
  addEventListener('keydown', (e) => {
    if (!abierta) return;
    if (e.code === 'Tab' || e.metaKey || e.ctrlKey) return;
    e.stopImmediatePropagation();
    if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape') { e.preventDefault(); if (!e.repeat) cerrar(); }
  }, true);
  // el título vuelve a abrirlo
  const titulo = document.getElementById('titulo');
  if (titulo) {
    titulo.appendChild(Object.assign(document.createElement('p'), { className: 'acerca', textContent: '¿Qué estoy viendo?' }));
    titulo.addEventListener('click', abrir);
    // (el recuadro arranca guardado en un botón «?», que lo abre: main.js corta ese toque antes de que llegue acá)
    titulo.classList.add('abre');
  }
  abrir();
  return { cerrada, abrir, cerrar, get abierta() { return abierta; } };
}
