// Baja de OpenStreetMap (Overpass) lo de hoy dentro del recuadro del plano: calles, vías, costa y agua.
// → fuentes/osm/*.json   (© los colaboradores de OpenStreetMap, licencia ODbL). Si un archivo ya está, no se vuelve a bajar.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { PLANO } from './plano.mjs';
import { grueso, aMetros, grados } from './geo.mjs';

const [x0, y0, x1, y1] = PLANO.marco;
const esq = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => grados(...aMetros(x, y, grueso)));
const M = 0.005, caja = [Math.min(...esq.map((p) => p[0])) - M, Math.min(...esq.map((p) => p[1])) - M, Math.max(...esq.map((p) => p[0])) + M, Math.max(...esq.map((p) => p[1])) + M].map((v) => v.toFixed(4)).join(',');
const PEDIDOS = {
  avenidas: 'way[highway~"^(motorway|trunk|primary|secondary|tertiary|motorway_link|trunk_link|primary_link)$"];',
  calles: 'way[highway~"^(residential|unclassified|living_street|pedestrian)$"];',
  vias: 'way[railway=rail];',
  agua: '(way[natural=coastline];way[natural=water];way[waterway=riverbank];way[waterway~"^(river|canal|dock)$"];);',
  lagos: 'relation[natural=water];', // (los diques y el Riachuelo son relaciones: hacen falta sus miembros)
};
const SERVIDORES = ['https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
mkdirSync('fuentes/osm', { recursive: true });
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
for (const [nombre, que] of Object.entries(PEDIDOS)) {
  const archivo = `fuentes/osm/${nombre}.json`;
  if (existsSync(archivo)) { console.log('ya está', archivo); continue; }
  const data = `[out:json][timeout:240][bbox:${caja}];${que}out ${nombre === 'lagos' ? '' : 'tags '}geom;`;
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(SERVIDORES[i % SERVIDORES.length], { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'plano-antiguo/1.0' }, body: 'data=' + encodeURIComponent(data), signal: AbortSignal.timeout(170000) });
      const t = await r.text();
      if (!r.ok) throw new Error(r.status + ' ' + t.slice(0, 120).replace(/\s+/g, ' '));
      const j = JSON.parse(t);
      writeFileSync(archivo, t); console.log(archivo, j.elements.length, 'elementos,', (t.length / 1e6).toFixed(1), 'MB'); break;
    } catch (e) { console.log('  falló (' + e.message + ')'); if (i >= 7) throw e; await pausa(6000 * (i + 1)); }
  }
  await pausa(4000);
}
