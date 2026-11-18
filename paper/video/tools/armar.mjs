// Escribe compositions/plano.html a partir de tools/plano.plantilla.html y de assets/capas.json (las calles, los techos
// y los rectángulos de cada nivel del zoom). Las demás escenas están escritas a mano.
//   node paper/video/tools/armar.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const D = (f) => new URL(f, import.meta.url), c = JSON.parse(readFileSync(D('../assets/capas.json'), 'utf8'));
const E = 1920 / c.calles.w; // píxeles del escaneo → unidades de la capa de calles
// el orden de las capas en la escena: n0, n1, n2, n3, n4, n5, n6
const niveles = c.niveles.map((n) => [n.x, n.y, n.w, n.h]);
const html = readFileSync(D('./plano.plantilla.html'), 'utf8')
  .replace('%%AFIN%%', c.osm.afin).replace('%%FINO%%', c.osm.fino).replace('%%TECHOS%%', c.techos.d)
  .replace('%%NIVELES%%', JSON.stringify(niveles))
  .replace('%%DX%%', (c.osm.corrimientoPx[0] * E).toFixed(1)).replace('%%DY%%', (c.osm.corrimientoPx[1] * E).toFixed(1));
mkdirSync(D('../compositions/'), { recursive: true });
writeFileSync(D('../compositions/plano.html'), html);
console.log(`compositions/plano.html · ${(html.length / 1024).toFixed(0)} kB`);
