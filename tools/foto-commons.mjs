// Baja una foto de Wikimedia Commons para una ficha, con su procedencia: deja fuentes/fotos/<nombre>.jpg (o .png) y
// fuentes/fotos/<nombre>.json (título del archivo, autor, fecha, licencia y dirección de la página), tal como los
// quiere tools/fotos.mjs. Los datos salen de Commons, no se escriben a mano. Si la licencia no es dominio público ni
// una licencia libre, no la baja.
//   node tools/foto-commons.mjs "Fuente las nereidas en paseo de julio 1916.jpg" nereidas-1916
//     (el título es el del archivo en Commons, sin «File:»; el nombre, corto, en minúsculas y con guiones)
// Después: node tools/fotos.mjs, y el pie de la foto en PIES (src/fichas.js).
// Hace dos pedidos, separados, y se presenta con un nombre genérico. La imagen se baja a una carpeta temporal nueva y
// se la vuelve a guardar con sharp: al repositorio entra solo si de verdad es una imagen.
import sharp from 'sharp';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [titulo0, nombre] = process.argv.slice(2);
if (!titulo0 || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(nombre ?? '')) { console.log('uso: node tools/foto-commons.mjs "<título del archivo en Commons>" <nombre-corto>'); process.exit(2); }
const titulo = titulo0.replace(/^(File|Archivo):/i, '').replace(/_/g, ' ');
if (['jpg', 'png', 'json'].some((e) => existsSync(`fuentes/fotos/${nombre}.${e}`))) { console.log(`Ya hay una foto «${nombre}» en fuentes/fotos: elegí otro nombre.`); process.exit(1); }
const AGENTE = 'mapas-historicos/1.0 (visor de planos antiguos)', LIBRES = /public domain|dominio p[úu]blico|\bPD\b|CC0|CC[ -]BY(?:[ -]SA)?(?![ -]N)/i;
const limpio = (s) => String(s ?? '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ').replace(/date QS:.*$/s, '').replace(/\s+/g, ' ').trim();

const api = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1920&titles=${encodeURIComponent('File:' + titulo)}`;
const r = await fetch(api, { headers: { 'User-Agent': AGENTE } }); if (!r.ok) { console.log('Commons no respondió:', r.status); process.exit(1); }
const info = Object.values((await r.json()).query?.pages ?? {})[0]?.imageinfo?.[0];
if (!info) { console.log(`No hay ningún archivo «${titulo}» en Commons (el título va exacto, con su extensión).`); process.exit(1); }
const m = info.extmetadata ?? {}, licencia = limpio(m.LicenseShortName?.value);
const datos = { titulo, autor: limpio(m.Artist?.value).replace(/^(Unknown author)+$/i, '') || 'Autor desconocido', fecha: limpio(m.DateTimeOriginal?.value) || 'sin fecha', licencia, desc: limpio(m.ImageDescription?.value).slice(0, 400), url: info.descriptionurl };
if (!LIBRES.test(licencia)) { console.log(`La licencia de esa foto es «${licencia || 'desconocida'}»: no es dominio público ni una licencia libre. No se baja.`); process.exit(1); }

await new Promise((s) => setTimeout(s, 2600));
const carpeta = mkdtempSync(join(tmpdir(), 'foto-')), cruda = join(carpeta, 'foto');
try {
  // (Commons frena de a ratos con un 429, «demasiados pedidos»: se espera y se prueba de nuevo, dos veces más)
  let f = null; for (let intento = 0; intento < 3; intento++) { if (intento) { console.log('  Commons pide esperar: pruebo de nuevo en medio minuto…'); await new Promise((s) => setTimeout(s, 30000 * intento)); } f = await fetch(info.width > 1920 && info.thumburl ? info.thumburl : info.url, { headers: { 'User-Agent': AGENTE } }); if (f.status !== 429) break; }
  if (f.status === 429) { console.log('Commons sigue pidiendo esperar (429). Probá de nuevo en unos minutos; no insistas enseguida.'); process.exit(1); }
  if (!f.ok || !/^image\//.test(f.headers.get('content-type') ?? '')) { console.log('No se pudo bajar la imagen:', f.status); process.exit(1); }
  writeFileSync(cruda, Buffer.from(await f.arrayBuffer()));
  const img = sharp(readFileSync(cruda)), md = await img.metadata(), ext = md.format === 'png' ? 'png' : 'jpg';
  await (ext === 'png' ? img.png() : img.jpeg({ quality: 90 })).toFile(`fuentes/fotos/${nombre}.${ext}`);
  writeFileSync(`fuentes/fotos/${nombre}.json`, JSON.stringify({ ...datos, w: md.width, h: md.height }) + '\n');
  console.log(`fuentes/fotos/${nombre}.${ext} (${md.width}×${md.height}) y fuentes/fotos/${nombre}.json`);
  console.log(`  autor: ${datos.autor} · fecha: ${datos.fecha} · licencia: ${datos.licencia}\n  ${datos.url}`);
  console.log('Mirá la foto antes de usarla (que sea el lugar y la época que dice), y después: node tools/fotos.mjs');
} finally { rmSync(carpeta, { recursive: true, force: true }); }
