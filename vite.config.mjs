import { defineConfig } from 'vite';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// La versión de lo que hay en public/: una huella de todos sus archivos. Va pegada a cada dirección (src/url.js), y
// con eso se los puede guardar en caché por mucho tiempo (public/_headers) sin que nunca quede uno viejo.
function version() {
  const h = createHash('sha1');
  const andar = (d) => { for (const e of readdirSync(d, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) { if (e.name.startsWith('.')) continue; const p = join(d, e.name); if (e.isDirectory()) andar(p); else h.update(p).update(readFileSync(p)); } };
  andar('public');
  return h.digest('hex').slice(0, 10);
}
const V = version();
// Lo primero que hace falta para ver el plano se pide desde el HTML, con un script en línea, sin esperar a que llegue
// y arranque el código: quedan en window.__pre, y src/url.js (pedir) los toma de ahí. (La ciudad también se adelanta,
// pero con prioridad baja: que no le quite ancho de banda a lo que se ve primero.)
// No se usa <link rel="preload">: con la red lenta, el fetch() que se sumaba a un preload todavía en viaje fallaba al
// leer el cuerpo, y la página quedaba en «Desplegando el plano…».
const PRIMERO = ['plano/laminas.json', 'datos/ciudad.json', 'plano/primero.webp'], DESPUES = ['datos/ciudad.pak'];
const adelantar = () => ({
  name: 'adelantar',
  // (solo en el visor: edificios.html no dibuja nada, lo trae adentro)
  transformIndexHtml: (html, ctx) => (!/index\.html$/.test(ctx.filename ?? ctx.path ?? 'index.html') ? [] : [{
    tag: 'script', injectTo: 'head',
    children: `{const f=(r,o)=>{const p=fetch(r+'?v=${V}',o);p.catch(()=>{});return p},P=window.__pre={};${JSON.stringify(PRIMERO)}.forEach(r=>P[r]=f(r));${JSON.stringify(DESPUES)}.forEach(r=>P[r]=f(r,{priority:'low'}))}`,
  }]),
});
// (dos páginas: el visor y la de los edificios, que lo trae adentro)
export default defineConfig({ base: './', build: { target: 'esnext', rollupOptions: { input: { index: 'index.html', edificios: 'edificios.html' } } }, define: { __V__: JSON.stringify(V) }, plugins: [adelantar()] });
