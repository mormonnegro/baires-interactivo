// paper.md → paper.html (una sola página, con las figuras adentro) y paper.pdf (con el Chromium de playwright-core).
// Sin dependencias nuevas: un conversor mínimo de Markdown hecho para lo que usa paper.md (títulos, párrafos, listas,
// tablas, bloques de código, figuras con pie, negrita, cursiva, código y enlaces).
//   node paper/hacer.mjs [--sin-pdf]
//   (para el PDF: CHROME=/ruta/al/Chrome, o el «Chrome for Testing» que baja playwright en la caché del usuario)
import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';

const AQUI = dirname(fileURLToPath(import.meta.url));
const md = readFileSync(join(AQUI, 'paper.md'), 'utf8');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function enLinea(t) {
  const guardado = [];
  const guarda = (h) => { guardado.push(h); return `\u0000${guardado.length - 1}\u0000`; };
  t = t.replace(/`([^`]+)`/g, (_, c) => guarda(`<code>${esc(c)}</code>`));
  t = t.replace(/<(https?:\/\/[^>\s]+)>/g, (_, u) => guarda(`<a href="${esc(u)}">${esc(u)}</a>`));
  t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, a, u) => guarda(`<a href="${esc(u)}">${esc(a)}</a>`));
  t = t.replace(/(^|[\s(])(https?:\/\/[^\s<]+[^\s<.,;)])/g, (_, a, u) => a + guarda(`<a href="${esc(u)}">${esc(u)}</a>`));
  t = esc(t);
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*\s][^*]*)\*/g, '<em>$1</em>');
  return t.replace(/\u0000(\d+)\u0000/g, (_, i) => guardado[+i]);
}

async function figura(ruta) {
  const f = join(AQUI, ruta);
  const img = sharp(f), meta = await img.metadata(), ancho = Math.min(meta.width, 2000);
  const buf = await img.resize(ancho).flatten({ background: '#ffffff' }).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

const L = md.split('\n'), out = [];
let i = 0, titulo = '';
const ancla = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
while (i < L.length) {
  const l = L[i];
  if (!l.trim()) { i++; continue; }
  let m;
  if (l.startsWith('```')) { const c = []; i++; while (i < L.length && !L[i].startsWith('```')) c.push(L[i++]); i++; out.push(`<pre><code>${esc(c.join('\n'))}</code></pre>`); continue; }
  if ((m = l.match(/^(#{1,4})\s+(.*)$/))) {
    const n = m[1].length, id = ancla(m[2]);
    if (n === 1) titulo = m[2];
    out.push(`<h${n} id="${id}">${enLinea(m[2])}</h${n}>`); i++; continue;
  }
  if ((m = l.match(/^!\[(.*)\]\(([^)]+)\)\s*$/))) { out.push(`<figure><img src="${await figura(m[2])}" alt=""><figcaption>${enLinea(m[1])}</figcaption></figure>`); i++; continue; }
  if (l.startsWith('|') && /^\|[\s:|-]+\|\s*$/.test(L[i + 1] ?? '')) {
    const fila = (s) => s.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    const cab = fila(l); i += 2; const filas = [];
    while (i < L.length && L[i].startsWith('|')) filas.push(fila(L[i++]));
    out.push(`<div class="tabla"><table class="${cab.length > 6 ? 'ancha' : ''}"><thead><tr>${cab.map((c) => `<th>${enLinea(c)}</th>`).join('')}</tr></thead><tbody>${filas.map((f) => `<tr>${f.map((c) => `<td>${enLinea(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
    continue;
  }
  if (/^(-|\d+\.)\s+/.test(l)) {
    const ord = /^\d+\./.test(l), items = [];
    while (i < L.length) {
      if ((m = L[i].match(/^(?:-|\d+\.)\s+(.*)$/))) { items.push([m[1]]); i++; }
      else if (/^\s{2,}\S/.test(L[i])) { const it = items.at(-1); it[it.length - 1] += ' ' + L[i].trim(); i++; }
      else if (!L[i].trim() && /^\s{2,}\S/.test(L[i + 1] ?? '')) { items.at(-1).push(''); i++; } // un párrafo más dentro del mismo punto
      else if (!L[i].trim() && /^(-|\d+\.)\s+/.test(L[i + 1] ?? '') && /^\d+\./.test(L[i + 1]) === ord) i++;
      else break;
    }
    out.push(`<${ord ? 'ol' : 'ul'}>${items.map((ps) => `<li>${ps.map((p, k) => (k ? `<p class="sigue">${enLinea(p.trim())}</p>` : enLinea(p))).join('')}</li>`).join('')}</${ord ? 'ol' : 'ul'}>`);
    continue;
  }
  const p = [l]; i++;
  while (i < L.length && L[i].trim() && !/^(#{1,4}\s|```|\||!\[|(-|\d+\.)\s)/.test(L[i])) p.push(L[i++]);
  out.push(`<p>${enLinea(p.join(' '))}</p>`);
}

// ---------------------------------------------------------------------------------------------------- la página
// Una página de artículo: barra de arriba (PDF, visor, claro/oscuro), el índice fijo al costado en pantallas anchas
// (plegado arriba en las angostas), la cabecera con autores y filiaciones, los resúmenes en recuadro, y el texto a
// una columna de unas 70 letras. Siempre sobre fondo blanco y con letra sin serifa (así lo pidió quien lo lee). Al
// imprimir (y en el PDF) queda solo el artículo.
const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const css = `
:root { color-scheme: only light; --fondo: #ffffff; --fondo2: #f6f7f9; --texto: #1b1c1e; --suave: #5c6269; --raya: #e1e4e8; --enlace: #1a56a8; --acento: #1a56a8; --sobre: #ffffff; --codigo: #f1f3f5; }
* { box-sizing: border-box; }
html { background: var(--fondo); scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--fondo); color: var(--texto); font: 17.5px/1.7 ${SANS}; text-rendering: optimizeLegibility; }
a { color: var(--enlace); text-decoration-thickness: 1px; text-underline-offset: 2px; overflow-wrap: anywhere; }
#avance { position: fixed; top: 0; left: 0; height: 2px; width: 0; background: var(--acento); z-index: 7; }
.barra { position: sticky; top: 0; z-index: 6; display: flex; align-items: center; gap: .5rem; padding: .5rem 16px; background: color-mix(in srgb, var(--fondo) 86%, transparent); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); border-bottom: 1px solid var(--raya); font-family: ${SANS}; }
.barra .sitio { margin-right: auto; font-size: .7rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--suave); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.boton { display: inline-flex; align-items: center; justify-content: center; gap: .4rem; height: 2.25rem; padding: 0 .8rem; border: 1px solid var(--raya); border-radius: 7px; background: var(--fondo); color: var(--texto); font: 500 .82rem/1 ${SANS}; text-decoration: none; cursor: pointer; white-space: nowrap; }
.boton:hover { border-color: var(--suave); }
.boton.principal { background: var(--acento); border-color: var(--acento); color: var(--sobre); font-weight: 600; }
.boton svg { width: 1.05rem; height: 1.05rem; flex: none; }
.marco { max-width: 44rem; margin: 0 auto; padding: 0 20px 5rem; }
.indice { display: none; }
@media (min-width: 1160px) {
  .marco { display: grid; grid-template-columns: 15rem minmax(0, 44rem); column-gap: 3.5rem; max-width: 66.5rem; }
  .indice { display: block; position: sticky; top: 3.4rem; align-self: start; max-height: calc(100vh - 3.6rem); overflow-y: auto; padding: 2.9rem 0 2rem; font: .8rem/1.35 ${SANS}; }
  .indice-movil { display: none; }
}
.indice strong, .indice-movil summary { font: 600 .7rem/1 ${SANS}; letter-spacing: .09em; text-transform: uppercase; color: var(--suave); }
.indice ol { list-style: none; margin: .7rem 0 0; padding: 0; }
.indice li { margin: 0; }
.indice a { display: block; padding: .3rem .75rem; border-left: 2px solid var(--raya); color: var(--suave); text-decoration: none; }
.indice a:hover { color: var(--texto); }
.indice a.aca { color: var(--texto); border-left-color: var(--acento); font-weight: 600; }
.indice li ol { display: none; margin: 0; }
.indice li.abierta ol { display: block; }
.indice li ol a { padding-left: 1.55rem; font-size: .76rem; font-weight: 400; }
.indice-movil { margin: 1.4rem 0 0; border: 1px solid var(--raya); border-radius: 8px; padding: .8rem 1rem; font-family: ${SANS}; }
.indice-movil summary { cursor: pointer; }
.indice-movil ol { list-style: none; margin: .7rem 0 0; padding: 0; font-size: .9rem; line-height: 1.35; }
.indice-movil li { margin: .45rem 0; }
.indice-movil a { text-decoration: none; }
.cabeza { padding: 2.8rem 0 0; }
.tipo { margin: 0 0 .9rem; font: 600 .72rem/1 ${SANS}; letter-spacing: .1em; text-transform: uppercase; color: var(--acento); }
h1 { margin: 0 0 1.3rem; font: 750 2rem/1.2 ${SANS}; letter-spacing: -.02em; text-wrap: balance; }
.autores { margin: 0 0 .55rem; font: 1.05rem/1.4 ${SANS}; }
.autores strong { font-weight: 600; }
.afil, .fecha { margin: .25rem 0; font: .82rem/1.5 ${SANS}; color: var(--suave); }
.acciones { display: flex; flex-wrap: wrap; gap: .6rem; margin: 1.3rem 0 0; }
.citar { flex-basis: 100%; }
.citar summary { list-style: none; width: max-content; }
.citar summary::-webkit-details-marker { display: none; }
.citar p { margin: .7rem 0 0; padding: .8rem 1rem; border: 1px solid var(--raya); border-radius: 8px; background: var(--fondo2); font: .84rem/1.55 ${SANS}; }
.resumen { margin: 1.8rem 0 0; padding: 1.15rem 1.4rem 1.2rem; border: 1px solid var(--raya); border-radius: 10px; background: var(--fondo2); font-size: .95rem; line-height: 1.66; }
.resumen h2 { margin: 0 0 .5rem; padding: 0; border: 0; font: 700 .72rem/1 ${SANS}; letter-spacing: .1em; text-transform: uppercase; color: var(--suave); }
.resumen p { margin: .55rem 0; }
.resumen p:last-child { margin-bottom: 0; font-family: ${SANS}; font-size: .84rem; line-height: 1.55; color: var(--suave); }
.resumen p:last-child strong { color: var(--texto); }
.nota { margin: 1.6rem 0 0; padding: 0 0 0 1rem; border-left: 3px solid var(--raya); font: .86rem/1.6 ${SANS}; color: var(--suave); }
.nota strong { color: var(--texto); }
h2, h3 { font-family: ${SANS}; scroll-margin-top: 4.2rem; text-wrap: balance; }
h2 { margin: 3.2rem 0 .9rem; padding-top: 1.6rem; border-top: 1px solid var(--raya); font-size: 1.42rem; line-height: 1.25; font-weight: 700; letter-spacing: -.01em; }
h3 { margin: 2.2rem 0 .5rem; font-size: 1.1rem; line-height: 1.3; font-weight: 650; }
h4 { margin: 1.6rem 0 .3rem; font: 600 1rem/1.3 ${SANS}; }
p { margin: 0 0 1.05rem; }
ul, ol { margin: 0 0 1.05rem; padding-left: 1.5rem; }
li { margin: .4rem 0; }
li p.sigue { margin: .5rem 0; }
strong { font-weight: 650; }
code { font: .82em/1.3 ui-monospace, "SF Mono", Menlo, Consolas, monospace; background: var(--codigo); padding: .1em .32em; border-radius: 4px; overflow-wrap: anywhere; }
pre { margin: 1.3rem 0; padding: .9rem 1.1rem; border: 1px solid var(--raya); border-radius: 8px; background: var(--codigo); overflow-x: auto; font-size: .8rem; line-height: 1.5; }
pre code { background: none; padding: 0; font-size: 1em; overflow-wrap: normal; }
figure { margin: 2.2rem 0; }
figure img { display: block; width: 100%; height: auto; border: 1px solid var(--raya); border-radius: 6px; background: #fff; cursor: zoom-in; }
figcaption { margin-top: .7rem; font: .82rem/1.55 ${SANS}; color: var(--suave); }
figcaption strong { color: var(--texto); }
.tabla { margin: 1.6rem 0; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font: .82rem/1.4 ${SANS}; font-variant-numeric: tabular-nums; }
th, td { padding: .42rem .6rem; text-align: left; vertical-align: top; border-bottom: 1px solid var(--raya); }
thead th { border-top: 2px solid var(--texto); border-bottom: 1px solid var(--texto); font-weight: 600; }
tbody tr:last-child td { border-bottom: 2px solid var(--texto); }
table.ancha { font-size: .74rem; } table.ancha th, table.ancha td { padding: .32rem .4rem; }
.refs p { margin: 0 0 .7rem; padding-left: 1.7rem; text-indent: -1.7rem; font-size: .88rem; line-height: 1.55; }
.pie { margin: 3.5rem 0 0; padding-top: 1.2rem; border-top: 1px solid var(--raya); font: .8rem/1.5 ${SANS}; color: var(--suave); }
dialog { border: 0; padding: 0; background: transparent; max-width: 96vw; max-height: 96vh; }
dialog::backdrop { background: rgba(0, 0, 0, .84); }
dialog img { display: block; max-width: 96vw; max-height: 96vh; border-radius: 6px; background: #fff; cursor: zoom-out; }
@media (max-width: 640px) {
  body { font-size: 17px; line-height: 1.65; }
  .marco { padding: 0 16px 4rem; }
  .cabeza { padding-top: 1.8rem; }
  h1 { font-size: 1.55rem; }
  h2 { font-size: 1.25rem; margin-top: 2.6rem; }
  .resumen { padding: 1rem 1.05rem 1.05rem; }
  .barra .sitio span { display: none; }
}
@page { size: A4; margin: 19mm 17mm 20mm; }
@media print {
  :root { --fondo: #fff; --fondo2: #fff; --texto: #000; --suave: #444; --raya: #bbb; --enlace: #1a3f73; --acento: #000; --codigo: #f2f2f2; }
  .barra, .indice, .indice-movil, .acciones, #avance, dialog, .pie { display: none !important; }
  body { font-size: 10.4pt; line-height: 1.42; }
  .marco { display: block; max-width: none; padding: 0; }
  .cabeza { padding: 0; } .tipo { margin-bottom: 6pt; font-size: 7.5pt; }
  h1 { font-size: 17pt; margin-bottom: 9pt; } .autores { font-size: 11pt; } .afil, .fecha { font-size: 8.4pt; }
  .resumen { margin-top: 12pt; padding: 0; border: 0; font-size: 9.6pt; line-height: 1.42; } .resumen h2 { font-size: 8pt; }
  .resumen p:last-child { font-size: 8.6pt; } .nota { margin-top: 10pt; font-size: 8.6pt; line-height: 1.4; }
  h2 { font-size: 12.5pt; margin: 16pt 0 5pt; padding-top: 7pt; break-after: avoid; } h3 { font-size: 11pt; margin: 11pt 0 3pt; break-after: avoid; }
  p, ul, ol { margin-bottom: 6pt; } li { margin: 2pt 0; }
  figure { margin: 12pt 0; break-inside: avoid; } figure img { max-height: 190mm; width: auto; max-width: 100%; margin: 0 auto; border-radius: 0; } figcaption { font-size: 8.4pt; }
  table { font-size: 8.2pt; } table.ancha { font-size: 7pt; } tr { break-inside: avoid; } pre { font-size: 7.4pt; white-space: pre-wrap; }
  .refs p { font-size: 8.6pt; margin-bottom: 4pt; } a { color: inherit; text-decoration: none; }
}`;

// las partes: la cabecera (título, autores, filiaciones, versión, nota de contribuciones) y las secciones
const [h1, autores, afil, fecha, nota, ...resto] = out;
const secciones = [];
for (const h of resto) {
  let m;
  if ((m = h.match(/^<h2 id="([^"]+)">(.*)<\/h2>$/))) secciones.push({ id: m[1], t: m[2].replace(/<[^>]+>/g, ''), h, cuerpo: [], subs: [] });
  else { const s = secciones.at(-1); s.cuerpo.push(h); if ((m = h.match(/^<h3 id="([^"]+)">(.*)<\/h3>$/))) s.subs.push([m[1], m[2].replace(/<[^>]+>/g, '')]); }
}
const RESUMENES = { resumen: ['es', 'Resumen'], 'title-abstract-and-keywords-english': ['en', 'Abstract (English)'] };
const corto = (s) => (RESUMENES[s.id] ? RESUMENES[s.id][1] : s.t);
const seccion = (s) => {
  if (RESUMENES[s.id]) return `<section class="resumen" lang="${RESUMENES[s.id][0]}"><h2 id="${s.id}">${corto(s)}</h2>\n${s.cuerpo.join('\n')}</section>`;
  return `<section${s.id === 'referencias' ? ' class="refs"' : ''}>${s.h}\n${s.cuerpo.join('\n')}</section>`;
};
const cuales = secciones.filter((s) => RESUMENES[s.id]), demas = secciones.filter((s) => !RESUMENES[s.id]);
const lista = (conSubs) => `<ol>${secciones.map((s) => `<li><a href="#${s.id}">${esc(corto(s))}</a>${conSubs && s.subs.length ? `<ol>${s.subs.map(([id, t]) => `<li><a href="#${id}">${esc(t)}</a></li>`).join('')}</ol>` : ''}</li>`).join('')}</ol>`;
const AÑO = (fecha.match(/\b(20\d\d)\b/) ?? [])[1] ?? '', URL_PAPER = 'https://baires.mormon.garden/paper/';
const ICONO = {
  pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M4 19h16"/></svg>',
};
const guion = `
(function () {
  // dónde va la lectura: la barrita de arriba y el título marcado en el índice
  var titulos = [].slice.call(document.querySelectorAll('main h2[id], main h3[id]')), enlaces = {}, avance = document.getElementById('avance'), antes = null, pedido = false;
  [].forEach.call(document.querySelectorAll('.indice a'), function (a) { enlaces[a.getAttribute('href').slice(1)] = a; });
  function mirar() {
    pedido = false;
    var alto = document.documentElement.scrollHeight - innerHeight; avance.style.width = (alto > 0 ? Math.min(1, scrollY / alto) * 100 : 0) + '%';
    var cual = null; for (var i = 0; i < titulos.length; i++) { if (titulos[i].getBoundingClientRect().top < 110) cual = titulos[i]; else break; }
    var id = cual ? cual.id : null; if (id === antes) return; antes = id;
    [].forEach.call(document.querySelectorAll('.indice a.aca, .indice li.abierta'), function (n) { n.classList.remove('aca', 'abierta'); });
    var a = enlaces[id]; if (!a) return; a.classList.add('aca');
    var li = a.parentNode, arriba = li.parentNode.parentNode; if (arriba.tagName === 'LI') { arriba.classList.add('abierta'); arriba.firstElementChild.classList.add('aca'); } else li.classList.add('abierta');
  }
  addEventListener('scroll', function () { if (!pedido) { pedido = true; requestAnimationFrame(mirar); } }, { passive: true }); mirar();
  // las figuras se agrandan al tocarlas
  var lupa = document.getElementById('lupa'), grande = lupa.querySelector('img');
  [].forEach.call(document.querySelectorAll('figure img'), function (im) { im.addEventListener('click', function () { if (!lupa.showModal) return; grande.src = im.src; lupa.showModal(); }); });
  lupa.addEventListener('click', function () { lupa.close(); });
  // el índice plegado se cierra al elegir
  [].forEach.call(document.querySelectorAll('.indice-movil a'), function (a) { a.addEventListener('click', function () { a.closest('details').open = false; }); });
})();`;
const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="author" content="Claude Code; @mormonnegro (meat proxy)">
<meta name="description" content="Cómo se levantó en 3D el plano de Buenos Aires de 1867 y se lo hizo crecer hasta 1940: métodos, mediciones y límites.">
<meta name="citation_title" content="${esc(titulo)}"><meta name="citation_author" content="Claude Code"><meta name="citation_author" content="@mormonnegro">
<meta name="citation_publication_date" content="${AÑO}/11/17"><meta name="citation_pdf_url" content="${URL_PAPER}paper.pdf"><meta name="citation_language" content="es"><meta name="color-scheme" content="only light">
<style>${css}</style></head><body>
<div id="avance"></div>
<header class="barra">
  <span class="sitio">Prepublicación<span> · Buenos Aires, de 1867 a 1940</span></span>
  <a class="boton" href="https://baires.mormon.garden">Abrir el visor</a>
  <a class="boton principal" href="paper.pdf">${ICONO.pdf}PDF</a>
</header>
<div class="marco">
<nav class="indice" aria-label="Contenido"><strong>Contenido</strong>${lista(true)}</nav>
<main>
<header class="cabeza">
<p class="tipo">Artículo · Prepublicación</p>
${h1}
${autores.replace('<p>', '<p class="autores">')}
${afil.replace('<p>', '<p class="afil">').replace(' ² ', '<br>² ')}
${fecha.replace('<p>', '<p class="fecha">')}
<div class="acciones">
  <a class="boton principal" href="paper.pdf">${ICONO.pdf}Descargar el PDF</a>
  <a class="boton" href="https://baires.mormon.garden">Abrir el visor</a>
  <details class="citar"><summary class="boton">Cómo citar</summary><p>Claude Code y @mormonnegro (${AÑO}). <em>${esc(titulo)}</em>. Prepublicación. <a href="${URL_PAPER}">${URL_PAPER}</a></p></details>
</div>
</header>
<details class="indice-movil"><summary>Contenido</summary>${lista(false)}</details>
${cuales.map(seccion).join('\n')}
${nota.replace('<p>', '<p class="nota">')}
${demas.map(seccion).join('\n')}
<p class="pie">${fecha.replace(/^<p>|<\/p>$/g, '')} · <a href="paper.pdf">PDF</a> · <a href="#resumen">Volver arriba</a></p>
</main>
</div>
<dialog id="lupa" aria-label="Figura ampliada"><img alt=""></dialog>
<script>${guion}</script>
</body></html>`;
writeFileSync(join(AQUI, 'paper.html'), html);
console.log(`paper.html · ${(html.length / 1e6).toFixed(1)} MB`);

if (!process.argv.includes('--sin-pdf')) {
  const chrome = process.env.CHROME ?? join(homedir(), 'Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
  if (!existsSync(chrome)) { console.log('no hay Chrome para el PDF (poné CHROME=…): queda solo el HTML'); process.exit(0); }
  const { chromium } = await import('playwright-core');
  const b = await chromium.launch({ executablePath: chrome, headless: true });
  const pg = await b.newPage();
  await pg.goto(pathToFileURL(join(AQUI, 'paper.html')).href, { waitUntil: 'load' });
  await pg.pdf({ path: join(AQUI, 'paper.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true, margin: { top: '19mm', bottom: '20mm', left: '17mm', right: '17mm' }, headerTemplate: '<span></span>', footerTemplate: '<div style="width:100%;text-align:center;font:8pt Helvetica,Arial,sans-serif;color:#666"><span class="pageNumber"></span> / <span class="totalPages"></span></div>' });
  await b.close();
  console.log('paper.pdf');
}
