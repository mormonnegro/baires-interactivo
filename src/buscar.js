// El buscador: uno escribe una dirección de hoy y se le muestra dónde caería en el plano de 1867.
// La dirección se pasa a coordenadas con el normalizador de direcciones de la Ciudad (USIG), que entiende calle y
// altura y esquinas; si no la conoce (un lugar por su nombre), con Nominatim, el buscador de OpenStreetMap. Solo al
// enviar: nunca mientras se escribe. De las coordenadas al plano se va con la misma cuenta que el resto de «lo de
// hoy» (src/geo.js + tools/geo.json). Después se arma la respuesta: si eso era río, cuál era el lugar de entonces más
// cercano y a cuánto, y qué había alrededor según el plano.
import { metros, conCampo, aMetros } from './geo.js';
import GEO from '../tools/geo.json';
import { u } from './url.js';

const CSS = `
#buscar, #buscar-msg { position: fixed; left: 26px; z-index: 6; box-sizing: border-box; width: min(400px, calc(100vw - 52px)); color: #2a221b; background: #f1e6cd; border: 1px solid #2a221b; outline: 1px solid #2a221b99; outline-offset: 2px; box-shadow: 0 5px 24px #0007; }
#buscar { top: 24px; display: flex; align-items: stretch; opacity: 0; transition: opacity 1.2s, background .2s; }
body.listo #buscar { opacity: 1; }
#buscar:focus-within { background: #fff6e2; }
#buscar input { flex: 1; min-width: 0; margin: 0; font: inherit; font-size: 16px; color: inherit; background: transparent; border: 0; outline: 0; border-radius: 0; padding: 9px 6px 10px 14px; -webkit-appearance: none; appearance: none; -webkit-user-select: text; user-select: text; }
#buscar input::placeholder { color: #2a221b; opacity: .55; font-style: italic; }
#buscar input::-webkit-search-cancel-button { display: none; }
#buscar button { flex: none; margin: 0; font: inherit; color: inherit; background: transparent; border: 0; border-radius: 0; cursor: pointer; }
#buscar .x { display: none; padding: 0 9px; font-size: 20px; line-height: 1; opacity: .55; }
#buscar.con .x { display: block; }
#buscar .x:hover { opacity: 1; }
#buscar .ir { padding: 0 14px; font-size: 14.5px; letter-spacing: .04em; border-left: 1px solid #2a221b55; }
#buscar .ir:hover { background: #2a221b; color: #f7eedb; }
#buscar.espera .ir { opacity: .5; pointer-events: none; }
#buscar-msg { top: 76px; padding: 8px 14px 9px; font-size: 14px; line-height: 1.42; opacity: 0; visibility: hidden; transition: opacity .3s, visibility .3s; }
#buscar-msg.ver { opacity: 1; visibility: visible; }
#buscar-msg small { display: block; margin-top: 3px; font-size: 12.5px; font-style: italic; opacity: .75; }
body.limpio #buscar, body.limpio #buscar-msg { display: none; }
/* la marca de lo buscado: un sello rojo lleno, siempre a la vista y con su nota abierta */
.marca.buscada { z-index: 4; }
.marca.buscada .tag { color: #f7eedb; background: #a03220; border-color: #a03220; outline: 1px solid #a0322099; outline-offset: 2px; padding: 5px 12px 6px; box-shadow: 0 4px 18px #0007; }
.marca.buscada .tag:hover { background: #b23a26; }
.marca.buscada .tag b { font-variant: normal; font-size: 14.5px; letter-spacing: .03em; }
.marca.buscada .tag i { display: block; max-width: 250px; opacity: .95; }
.marca.buscada .hilo { background: #a03220; }
.marca.buscada .punto { left: -6px; top: -6px; width: 10px; height: 10px; background: #a03220; }
.marca.buscada .punto::after { content: ''; position: absolute; inset: -1px; border-radius: 50%; border: 2px solid #a03220; animation: buscada 1.8s ease-out infinite; }
@keyframes buscada { from { transform: scale(1); opacity: .9; } to { transform: scale(4.2); opacity: 0; } }
@media (max-width: 780px) { #buscar, #buscar-msg { width: min(400px, calc(100vw - 340px)); } }
@media (pointer: coarse) { #buscar input { padding-top: 11px; padding-bottom: 12px; } #buscar .x { padding: 0 13px; font-size: 22px; } #buscar .ir { padding: 0 15px; } }
@media (max-height: 500px) and (min-width: 641px) {
  #buscar, #buscar-msg { left: calc(14px + var(--sl)); width: min(340px, calc(100vw - 400px)); }
  #buscar { top: calc(12px + var(--st)); } #buscar-msg { top: calc(64px + var(--st)); max-height: calc(100dvh - 150px); overflow-y: auto; }
}
@media (max-width: 640px) {
  #buscar, #buscar-msg { left: calc(14px + var(--sl)); right: calc(14px + var(--sr)); width: auto; }
  #buscar { top: calc(12px + var(--st)); } #buscar-msg { top: calc(64px + var(--st)); }
  body.listo.hoy.con-aviso #leyenda { opacity: 0 !important; }
}
`;

const AMBA = '-58.75,-34.35,-58.15,-34.85'; // (dónde busca Nominatim: Buenos Aires y alrededores)
const sinAcentos = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const CHICAS = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'el']);
const titulo = (s) => s.toLowerCase().split(/\s+/).map((p, i) => (i && CHICAS.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1))).join(' ');
// (las palabras que distinguen una calle de otra, para reconocerla entre los nombres de OpenStreetMap)
const RELLENO = new Set(['av', 'avenida', 'pje', 'pasaje', 'bv', 'boulevard', 'calle', 'de', 'del', 'la', 'las', 'los', 'y', 'e', 'el', 'gral', 'general', 'tte', 'teniente', 'dr', 'doctor', 'pres', 'presidente', 'cnel', 'coronel', 'ing', 'ingeniero']);
const claves = (s) => sinAcentos(s).split(/[^a-z0-9]+/).filter((p) => p && !RELLENO.has(p));

async function pedir(url, ms = 9000) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
  try { const r = await fetch(url, { signal: c.signal }); if (!r.ok) throw new Error(String(r.status)); return await r.json(); } finally { clearTimeout(t); }
}
/** El normalizador de la Ciudad: calle y altura, o esquina. → [{ lat, lon, caba, d }] */
async function usig(texto) {
  const j = await pedir('https://servicios.usig.buenosaires.gob.ar/normalizar/?' + new URLSearchParams({ direccion: texto, geocodificar: 'true', maxOptions: '6' }));
  return (j.direccionesNormalizadas ?? []).filter((d) => d.coordenadas && isFinite(+d.coordenadas.x) && isFinite(+d.coordenadas.y)).map((d) => ({ lat: +d.coordenadas.y, lon: +d.coordenadas.x, caba: d.cod_partido === 'caba', d }));
}
/** Nominatim (OpenStreetMap): los lugares por su nombre. → [{ lat, lon, nombre }] */
async function nominatim(texto) {
  const j = await pedir('https://nominatim.openstreetmap.org/search?' + new URLSearchParams({ q: texto, format: 'jsonv2', limit: '5', countrycodes: 'ar', addressdetails: '1', viewbox: AMBA, bounded: '1', 'accept-language': 'es' }));
  return (Array.isArray(j) ? j : []).filter((r) => isFinite(+r.lat) && isFinite(+r.lon)).map((r) => {
    const a = r.address ?? {}, calle = [a.road, a.house_number].filter(Boolean).join(' ');
    return { lat: +r.lat, lon: +r.lon, nombre: (r.name || calle || String(r.display_name ?? texto).split(',')[0]).replace(/^Avenida /, 'Av. ') };
  });
}

// --- cómo decir dónde queda algo respecto de un lugar de 1867 ---
const ARTICULO = {
  'Plaza de la Victoria': 'la Plaza de la Victoria', 'Plaza de Marte': 'la Plaza de Marte', 'Plaza del Parque': 'la Plaza del Parque',
  'Mercado Constitución': 'el Mercado Constitución', 'Mercado 11 de Septiembre': 'el Mercado 11 de Septiembre', 'La Recoleta': 'la Recoleta', 'La Boca': 'la Boca',
  Cabildo: 'el Cabildo', Catedral: 'la Catedral', 'Recova Vieja': 'la Recova Vieja', 'Teatro Colón': 'el primer Teatro Colón', 'Casa de Gobierno': 'la Casa de Gobierno',
  'Aduana Nueva': 'la Aduana Nueva', 'Muelle de pasajeros': 'el muelle de pasajeros', 'Estación Central': 'la Estación Central', 'Estación del Parque': 'la Estación del Parque',
  'Estación del Norte': 'la Estación del Norte', 'Estación del Sud': 'la Estación del Sud', 'Fábrica de gas': 'la fábrica de gas',
};
const frase = (nombre, iglesia) => ARTICULO[nombre] ?? (iglesia ? 'la iglesia de ' + nombre.replace(/^El /, 'el ').replace(/^La /, 'la ') : nombre);
const con = (prep, f) => `${prep} ${f}`.replace(/^de el /, 'del ').replace(/^a el /, 'al ').replace(/ de el /g, ' del ');
const RUMBOS = ['al norte', 'al noreste', 'al este', 'al sudeste', 'al sur', 'al sudoeste', 'al oeste', 'al noroeste'];
const rumbo = (de, dn) => RUMBOS[((Math.round(Math.atan2(de, dn) / (Math.PI / 4)) % 8) + 8) % 8];
const km = (m) => (m / 1000).toFixed(1).replace('.', ',') + ' km';
function desde(d, de, dn, f) {
  if (d < 70) return con('junto a', f).replace(/^junto a el /, 'junto al ');
  const cuanto = d < 1000 ? ((n) => `a ${n} cuadra${n > 1 ? 's' : ''}`)(Math.max(1, Math.round(d / 130))) : 'a ' + km(d);
  return `${cuanto} ${rumbo(de, dn)} ${con('de', f)}`;
}

/** Dónde queda algo respecto de un lugar de 1867: «a 2 cuadras al norte del Cabildo». d: metros; de, dn: cuánto al este y al norte. */
export const dondeQueda = (d, de, dn, nombre, iglesia) => desde(d, de, dn, frase(nombre, iglesia));

/**
 * hoja: { ancho, alto } del plano en píxeles · marco: [x0, y0, x1, y1] lo dibujado · metro: metros por píxel
 * referencias: [nombre, px, py, esIglesia] los lugares de 1867 · mz: las manzanas (10 números cada una)
 * calles: los nombres de las calles de hoy (src/calles.js) · alHallar(r), alQuitar(): qué hacer con el resultado
 */
export function createBuscador({ hoja, marco, metro, referencias, mz, calles, alHallar, alQuitar }) {
  document.head.appendChild(Object.assign(document.createElement('style'), { textContent: CSS }));
  const form = Object.assign(document.createElement('form'), { id: 'buscar', innerHTML: '<input type="search" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" aria-label="Buscar una dirección de hoy"><button type="button" class="x" aria-label="Borrar la búsqueda" title="Borrar">×</button><button type="submit" class="ir">Buscar</button>' });
  form.setAttribute('role', 'search');
  const msg = Object.assign(document.createElement('div'), { id: 'buscar-msg' }); msg.setAttribute('aria-live', 'polite');
  document.body.append(form, msg);
  const input = form.querySelector('input');
  const angosto = matchMedia('(max-width: 640px)'), cartel = () => { input.placeholder = angosto.matches ? 'Una dirección de hoy: Corrientes 1234' : 'Buscá una dirección de hoy: Corrientes 1234'; };
  cartel(); angosto.addEventListener?.('change', cartel);
  // (lo que se escribe acá no es un atajo: ni el espacio levanta la ciudad ni la H prende lo de hoy)
  input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.code === 'Escape') input.blur(); });
  for (const t of ['pointerdown', 'wheel', 'touchstart']) form.addEventListener(t, (e) => e.stopPropagation());
  const decir = (html) => { msg.innerHTML = html ?? ''; msg.classList.toggle('ver', !!html); document.body.classList.toggle('con-aviso', !!html); };
  const limpio = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const aPlanoM = conCampo(GEO), aPlano = (lat, lon) => aPlanoM(...metros(lat, lon));
  const dentro = (x, y) => x > marco[0] && y > marco[1] && x < marco[2] && y < marco[3];
  // los lugares de entonces, también en metros (este, norte) para medir distancias y rumbos de verdad
  const refs = referencias.map(([nombre, px, py, iglesia]) => ({ f: frase(nombre, iglesia), m: aMetros(px, py, aPlanoM) }));
  // las manzanas: el centro y la superficie de cada una
  const manzanas = [];
  for (let i = 0; i + 9 < mz.length; i += 10) {
    let x = 0, y = 0; for (let k = 0; k < 4; k++) { x += mz[i + k * 2] / 4; y += mz[i + k * 2 + 1] / 4; }
    manzanas.push([x, y, Math.hypot(mz[i + 2] - mz[i], mz[i + 3] - mz[i + 1]) * Math.hypot(mz[i + 6] - mz[i], mz[i + 7] - mz[i + 1]) * metro * metro]);
  }
  /** Qué había alrededor (300 m), según lo que el plano dibuja edificado. */
  function alrededor(px, py) {
    let n = 0, area = 0;
    for (const m of manzanas) if (Math.hypot(m[0] - px, m[1] - py) * metro < 300) { n++; area += m[2]; }
    const parte = area / (Math.PI * 300 * 300);
    return parte >= 0.3 ? 'ya era ciudad, con las manzanas edificadas' : parte >= 0.04 || n >= 6 ? 'eran las afueras: quintas y construcciones sueltas' : 'era campo, casi sin construcciones';
  }
  // la tierra ganada al río: el canal verde de la lámina de lejos de «lo de hoy»
  let mascara = null;
  async function eraRio(px, py) {
    mascara ??= fetch(u('plano/hoy-lejos.webp')).then((r) => r.blob()).then((b) => createImageBitmap(b, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' })).then((bmp) => {
      const c = Object.assign(document.createElement('canvas'), { width: bmp.width, height: bmp.height }), x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(bmp, 0, 0); return { x, w: bmp.width, h: bmp.height };
    }).catch(() => null);
    const m = await mascara; if (!m) return false;
    const d = m.x.getImageData(Math.max(0, Math.min(m.w - 1, Math.round((px / hoja.ancho) * m.w))), Math.max(0, Math.min(m.h - 1, Math.round((py / hoja.alto) * m.h))), 1, 1).data;
    return d[1] > 110;
  }
  /** El nombre de una calle como lo escribe el normalizador («PERON, JUAN DOMINGO, TTE. GENERAL», «CORRIENTES AV.»), prolijo. */
  function calleProlija(s, cercanas) {
    let t = String(s ?? '').trim(), pre = '';
    const m = t.match(/^(.*?)[ ,]+(AV|PJE|BV|AU)\.?$/i); if (m) { t = m[1]; pre = { AV: 'Av. ', PJE: 'Pje. ', BV: 'Bv. ', AU: 'Au. ' }[m[2].toUpperCase()]; }
    const k = claves(t); if (!k.length) return pre + titulo(t);
    // si entre las calles de hoy que pasan por ahí hay una con esas mismas palabras, vale su nombre (con acentos y en orden)
    let mejor = null;
    for (const [nombre, d] of cercanas) { const o = claves(nombre); if (k.every((p) => o.includes(p)) && (!mejor || o.length < mejor[1] || (o.length === mejor[1] && d < mejor[2]))) mejor = [nombre, o.length, d]; }
    return mejor ? mejor[0] : pre + titulo(t.split(',').map((x) => x.trim()).reverse().join(' '));
  }
  function nombreUsig(d, px, py) {
    if (d.cod_partido !== 'caba') return String(d.direccion ?? '').trim();
    const cercanas = calles?.cerca((px - hoja.plaza[0]) * metro, (py - hoja.plaza[1]) * metro, 260) ?? [];
    const a = calleProlija(d.nombre_calle, cercanas);
    if (d.tipo === 'calle_y_calle' && d.nombre_calle_cruce) return `${a} y ${calleProlija(d.nombre_calle_cruce, cercanas)}`;
    return d.altura ? `${a} ${d.altura}` : a;
  }

  /** Busca `texto`. → { estado: 'hallada' | 'fuera' | 'nada' | 'error', nombre, lat, lon, px, py, rio, nota } */
  async function resolver(texto) {
    let cand = [], fallo = false;
    try { cand = (await usig(texto)).map((c) => ({ ...c, p: aPlano(c.lat, c.lon) })); } catch { fallo = true; }
    let c = cand.find((k) => k.caba && dentro(...k.p)) ?? cand.find((k) => dentro(...k.p)) ?? cand.find((k) => k.caba);
    if (!c) {
      try { const n = (await nominatim(texto)).map((k) => ({ ...k, p: aPlano(k.lat, k.lon) })); c = n.find((k) => dentro(...k.p)) ?? n[0] ?? cand[0]; fallo = false; } catch { if (!cand.length) fallo = true; c = cand[0]; }
    }
    if (!c) return { estado: fallo ? 'error' : 'nada' };
    const [px, py] = c.p, [e, n] = metros(c.lat, c.lon);
    if (c.d) await calles?.cargar();
    const r = { nombre: c.d ? nombreUsig(c.d, px, py) : c.nombre, lat: c.lat, lon: c.lon, px, py };
    if (!dentro(px, py)) return { ...r, estado: 'fuera', nota: `Queda fuera del plano de 1867: ${desde(Math.hypot(e, n), e, n, 'la Plaza de la Victoria')}.` };
    let cerca = null; for (const k of refs) { const d = Math.hypot(e - k.m[0], n - k.m[1]); if (!cerca || d < cerca.d) cerca = { d, k }; }
    const donde = cerca ? desde(cerca.d, e - cerca.k.m[0], n - cerca.k.m[1], cerca.k.f) : '';
    r.rio = await eraRio(px, py);
    r.nota = r.rio ? `En 1867, esto era río: es tierra ganada después. Queda ${donde}.` : `En 1867: ${donde}. Según el plano, ${alrededor(px, py)}.`;
    return { ...r, estado: 'hallada' };
  }
  let turno = 0;
  async function buscar(texto) {
    texto = String(texto ?? '').trim().replace(/\s+/g, ' ').slice(0, 120);
    const yo = ++turno;
    if (!texto) { quitar(); return null; }
    form.classList.add('espera'); decir('Buscando…');
    const r = await resolver(texto).catch(() => ({ estado: 'error' }));
    if (yo !== turno) return r;
    form.classList.remove('espera');
    form.classList.add('con');
    if (r.estado === 'hallada') { decir(null); alHallar(r); return r; }
    alQuitar(); // (la marca de la búsqueda anterior ya no corresponde)
    if (r.estado === 'fuera') decir(`<b>${limpio(r.nombre)}</b><br>${limpio(r.nota)}`);
    else if (r.estado === 'nada') decir(`No encontré «${limpio(texto)}».<small>Probá con calle y altura («Corrientes 1234»), una esquina («Callao y Santa Fe») o el nombre de un lugar.</small>`);
    else decir('No pude consultar el buscador de direcciones.<small>Probá de nuevo en un rato.</small>');
    return r;
  }
  function quitar() { turno++; input.value = ''; form.classList.remove('con', 'espera'); decir(null); alQuitar(); }
  form.addEventListener('submit', (e) => { e.preventDefault(); input.blur(); buscar(input.value); });
  form.querySelector('.x').addEventListener('click', () => { quitar(); input.focus(); });
  return { buscar: (t) => { input.value = t; return buscar(t); }, quitar, el: form };
}
