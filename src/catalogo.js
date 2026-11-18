// La página de los edificios (edificios.html): la lista de todo lo que tiene nombre y cuerpo en el visor, año por año,
// al lado del visor mismo —metido en un marco, sin carteles: src/vitrina.js—, que va hasta cada edificio a medida que
// se baja por la lista, le da vueltas y lo aclara. No hay nada escrito dos veces: los lugares salen de src/marcas.js,
// los textos y las fotos de src/fichas.js, y las iglesias las cuenta el visor cuando termina de cargar.
import { LUGARES } from './marcas.js';
import { FICHAS, FOTOS } from './fichas.js';
import { u } from './url.js';

const AÑOS = [1867, 1888, 1895, 1905, 1910, 1921, 1940], ULTIMA = AÑOS.length - 1;
const DE_CADA_AÑO = {
  1867: 'La ciudad del plano de Glade: la aldea grande, con el río al pie de la barranca.',
  1888: 'La capital recién federalizada: se va la Recova y las dos plazas quedan unidas.',
  1895: 'Se abre la Avenida de Mayo y el puerto le gana tierra al río.',
  1905: 'La Casa Rosada entera, los docks y los elevadores del puerto de Madero.',
  1910: 'El Centenario: el Congreso, el Colón nuevo, Tribunales.',
  1921: 'El subte, las diagonales, la Costanera y el Puerto Nuevo.',
  1940: 'Los rascacielos, el Obelisco y la 9 de Julio.',
};
// lo que tiene marca pero no es un edificio (un barrio, una obra de suelo, muchas cosas sueltas), y lo que la tiene «de cerca» y sí lo es
const FUERA = new Set(['La rada', 'Puerto Nuevo', 'Puerto Madero', 'Costanera Sur', 'Subte A', 'Fuentes de hierro', 'Diagonal Norte']);
const DE_CERCA = new Set(['Yacht Club Argentino', 'La Equitativa del Plata', 'Edificio Bencich', 'Edificio Miguel Bencich', 'Monumento a Belgrano']);

/** Los edificios: cada uno con sus versiones (la misma marca cambia de alto, de nota o de nombre con los años). */
function juntar() {
  const grupos = new Map();
  for (const [nombre, px, py, alto, nivel, nota, e = {}] of LUGARES) {
    const clave = e.ficha ?? nombre;
    if (e === true || e.velo || nivel === 1 || FUERA.has(clave) || !FICHAS[clave]) continue;
    if (nivel === 3 && !DE_CERCA.has(clave) && !grupos.has(clave)) continue;
    if (!grupos.has(clave)) grupos.set(clave, { clave, ficha: FICHAS[clave], versiones: [] });
    grupos.get(clave).versiones.push({ nombre, px, py, alto, nivel, nota, desde: e.desde ?? 0, hasta: e.hasta ?? 0, radio: e.radio ?? 0 });
  }
  return [...grupos.values()].map(armar);
}
const enEtapa = (v, s) => v.desde <= s && (!v.hasta || s < v.hasta);
function armar(g) {
  g.etapas = AÑOS.map((_, s) => s).filter((s) => g.versiones.some((v) => enEtapa(v, s)));
  g.primera = g.etapas[0]; g.ultima = g.etapas[g.etapas.length - 1];
  g.de = (s) => g.versiones.find((v) => enEtapa(v, s)) ?? g.versiones[0];
  g.titulo = g.ficha?.titulo ?? (g.versiones.some((v) => v.nombre === g.clave) ? g.clave : g.versiones[0].nombre);
  return g;
}

const $ = (s, el = document) => el.querySelector(s);
const crear = (tag, clase, html) => { const e = document.createElement(tag); if (clase) e.className = clase; if (html != null) e.innerHTML = html; return e; };
const limpio = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// (la Pirámide está desde 1811: lo que aparece en 1921 es su lugar nuevo, y ahí recién tiene marca propia)
const CUANDO = { 'Pirámide de Mayo': 'Desde 1921, en el centro de la plaza' };
const cuando = (g) => CUANDO[g.clave] ?? (g.ultima === ULTIMA
  ? (g.primera === 0 ? 'Está en el plano de 1867 y sigue en 1940' : `Aparece en ${AÑOS[g.primera]}`)
  : g.primera === g.ultima ? `Solo en ${AÑOS[g.primera]}: en ${AÑOS[g.ultima + 1]} ya no está`
    : `De ${AÑOS[g.primera]} a ${AÑOS[g.ultima]}: en ${AÑOS[g.ultima + 1]} ya no está`);

/** La tarjeta de un edificio. */
function tarjeta(g, i) {
  const f = g.ficha ?? {}, a = crear('article', 'edif'); a.dataset.i = i; a.id = `e${i}`;
  const [primero, ...resto] = f.texto ?? [], foto = (f.fotos ?? []).map((k) => [k, FOTOS[k]]).find(([, d]) => d);
  a.innerHTML = `
    <p class="cuando">${limpio(cuando(g))}</p>
    <h3>${limpio(g.titulo)}</h3>
    ${f.era ? `<p class="era">${limpio(f.era)}</p>` : ''}
    ${foto ? `<figure><img loading="lazy" decoding="async" width="${foto[1].w}" height="${foto[1].h}" src="${u(`fotos/m/${foto[0]}.webp`)}" alt="${limpio(foto[1].que)}"><figcaption>${limpio(foto[1].que)} <span>${limpio([foto[1].autor, foto[1].fecha].filter(Boolean).join(', '))}</span></figcaption></figure>` : ''}
    ${primero ? `<p>${primero}</p>` : ''}
    ${resto.length || f.hoyEs ? `<details><summary>Seguir leyendo</summary>${resto.map((p) => `<p>${p}</p>`).join('')}${f.hoyEs ? `<p class="hoy"><b>Hoy</b> · ${f.hoyEs}</p>` : ''}</details>` : ''}
    <div class="pie">
      <div class="años" role="group" aria-label="Verlo en otro año">${g.etapas.map((s) => `<button type="button" data-s="${s}">${AÑOS[s]}</button>`).join('')}</div>
      <a class="ver" href="./">Abrir en el visor</a>
    </div>
    <p class="nota" hidden></p>`;
  return a;
}

// ------------------------------------------------------------------------------------------------------ la página
for (const im of document.querySelectorAll('img[data-de]')) im.src = u(im.dataset.de); // (las imágenes de public/, con su versión)
const lista = $('#lista'), marco = $('#ciudad'), cartel = $('#cartel'), mover = $('#mover');
const grupos = juntar(), tarjetas = [];
function seccion(titulo, bajada, items, id) {
  const s = crear('section', 'año'); s.id = id;
  s.append(crear('h2', null, limpio(titulo)), crear('p', 'bajada', limpio(bajada)));
  for (const g of items) { const t = tarjeta(g, tarjetas.length); tarjetas.push({ g, el: t, etapa: g.primera }); s.append(t); }
  $('#cierre').before(s); return s;
}
const indice = $('#indice');
AÑOS.forEach((año, s) => {
  const items = grupos.filter((g) => g.primera === s); if (!items.length) return;
  seccion(String(año), DE_CADA_AÑO[año], items, `a${año}`);
  indice.append(Object.assign(crear('a', null, `${año}<i>${items.length}</i>`), { href: `#a${año}` }));
});
$('#cuantos').textContent = String(grupos.length);

// --- el visor: se le habla con mensajes; lo que se pide antes de que esté listo espera ---
let listo = false, pendiente = null;
const decir = (m) => { if (listo) marco.contentWindow.postMessage(m, location.origin); else pendiente = m; };
addEventListener('message', (e) => {
  if (e.origin !== location.origin || e.source !== marco.contentWindow || !e.data) return;
  if (e.data.vitrina === 'lista') {
    listo = true; document.body.classList.add('con-ciudad');
    if (e.data.iglesias?.length && !$('#iglesias')) iglesias(e.data.iglesias);
    if (pendiente) { const m = pendiente; pendiente = null; decir(m); } else decir({ vitrina: 'ciudad', año: 1867 });
  } else if (e.data.vitrina === 'tocada') document.body.classList.add('tocada');
  else if (e.data.vitrina === 'soltar') { soltar(false); mover.focus(); }
});
/** Las iglesias no tienen marca fija (salen de las cruces del plano): las cuenta el visor, y van al final. */
function iglesias(L) {
  const SE_VAN = { 'San Nicolás': 6 };
  const items = L.filter((g) => FICHAS[g.nombre]).map((g) => armar({ clave: g.nombre, ficha: FICHAS[g.nombre], versiones: [{ nombre: g.nombre, px: g.px, py: g.py, alto: g.alto, nivel: 3, nota: '', desde: 0, hasta: SE_VAN[g.nombre] ?? 0, radio: 0 }] }));
  if (!items.length) return;
  seccion('Las iglesias', 'Las del plano de 1867, una por cada cruz negra: la nave del largo y el ancho que el plano le da.', items, 'iglesias');
  indice.append(Object.assign(crear('a', null, `Iglesias<i>${items.length}</i>`), { href: '#iglesias' }));
  $('#cuantos').textContent = String(grupos.length + items.length);
  for (const t of tarjetas) pintar(t);
  medir();
}

// --- cuál se mira: la tarjeta que cruza la línea de lectura. Se espera un momento antes de volar: pasar de largo no cuenta ---
let activa = -2, espera = 0;
const angosta = () => matchMedia('(max-width: 860px)').matches;
function mostrar(i, ya = false) {
  clearTimeout(espera);
  const ir = () => {
    document.body.classList.remove('tocada'); soltar(false);
    if (i < 0) { cartel.hidden = true; decir({ vitrina: 'ciudad', año: 1867 }); return; }
    const t = tarjetas[i], v = t.g.de(t.etapa), año = AÑOS[t.etapa];
    cartel.hidden = false; $('b', cartel).textContent = v.nombre; $('i', cartel).textContent = año;
    decir({ vitrina: 'ir', px: v.px, py: v.py, alto: v.alto, año, radio: v.radio, nivel: v.nivel });
  };
  if (ya) ir(); else espera = setTimeout(ir, 260);
}
function pintar(t) {
  const v = t.g.de(t.etapa), año = AÑOS[t.etapa];
  for (const b of t.el.querySelectorAll('.años button')) b.classList.toggle('on', +b.dataset.s === t.etapa);
  $('.ver', t.el).href = `./?lugar=${encodeURIComponent(v.nombre)}&año=${año}`;
  const era = t.g.ficha?.eras?.[v.desde], nota = $('.nota', t.el), dice = era || v.nota;
  nota.hidden = !dice || t.g.etapas.length < 2; nota.innerHTML = dice ? `<b>${año}</b> · ${limpio(dice)}` : '';
}
function medir() {
  const alto = innerHeight, tope = angosta() ? $('#escena').getBoundingClientRect().bottom : 0, linea = tope + (alto - tope) * (angosta() ? 0.38 : 0.42);
  let mejor = -1, d0 = Infinity;
  const portada = $('#portada').getBoundingClientRect();
  if (portada.bottom > linea) mejor = -1;
  else for (let i = 0; i < tarjetas.length; i++) {
    const r = tarjetas[i].el.getBoundingClientRect(); if (r.bottom < tope - 200 || r.top > alto + 200) continue;
    const d = r.top <= linea && r.bottom >= linea ? 0 : Math.min(Math.abs(r.top - linea), Math.abs(r.bottom - linea));
    if (d < d0) { d0 = d; mejor = i; }
  }
  if (mejor === activa) return;
  tarjetas[activa]?.el.classList.remove('activa'); activa = mejor; tarjetas[activa]?.el.classList.add('activa');
  for (const a of indice.children) {
    const on = activa >= 0 && tarjetas[activa].el.parentElement.id === a.hash.slice(1);
    // (el índice no entra entero en una columna angosta: se corre solo para que el año en que se está quede a la vista)
    if (on && !a.classList.contains('on')) indice.scrollTo({ left: a.offsetLeft - (indice.clientWidth - a.offsetWidth) / 2, behavior: 'smooth' });
    a.classList.toggle('on', on);
  }
  mostrar(activa);
}
let pedido = false;
const alMover = () => { if (pedido) return; pedido = true; requestAnimationFrame(() => { pedido = false; medir(); }); };
addEventListener('scroll', alMover, { passive: true }); addEventListener('resize', alMover);

// los años de cada tarjeta: el mismo edificio en otro momento (o la ciudad que cambia a su alrededor)
lista.addEventListener('click', (e) => {
  const b = e.target.closest('.años button'); if (!b) return;
  const el = b.closest('.edif'), i = +el.dataset.i, t = tarjetas[i];
  t.etapa = +b.dataset.s; pintar(t);
  if (i !== activa) { tarjetas[activa]?.el.classList.remove('activa'); activa = i; el.classList.add('activa'); }
  mostrar(i, true);
});
for (const t of tarjetas) pintar(t);

// agarrar la cámara: el marco no recibe el mouse (si no, la rueda acercaría la ciudad en vez de bajar la página) hasta que se lo pide
function soltar(si) {
  document.body.classList.toggle('libre', si); if (si) document.body.classList.remove('tocada'); mover.setAttribute('aria-pressed', String(si));
  mover.textContent = si ? 'Seguir el recorrido' : 'Mover la cámara';
  if (!si && listo) decir({ vitrina: 'quieta', si: false });
}
mover.addEventListener('click', () => soltar(!document.body.classList.contains('libre')));
addEventListener('keydown', (e) => { if (e.key === 'Escape') soltar(false); });

medir();
