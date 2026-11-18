// Conteos (solo lectura): lugares modelados a mano, marcas, fichas y fotos con su licencia; tamaño del código y de lo
// que baja el navegador.   node paper/medidas/conteos.mjs > paper/medidas/conteos.txt   (y paper/medidas/conteos.json)
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url)), R = (f) => join(RAIZ, f);
const out = {};
const lineas = (f) => readFileSync(R(f), 'utf8').split('\n').length;

// ------------------------------------------------------------------------------------------------ el código
const dir = (d, ext) => readdirSync(R(d)).filter((f) => ext.test(f)).map((f) => `${d}/${f}`);
const grupos = { 'tools/*.mjs': dir('tools', /\.mjs$/), 'src/*.js': dir('src', /\.js$/), 'src/lugares/*.js': dir('src/lugares', /\.js$/), 'index.html + edificios.html': ['index.html', 'edificios.html'] };
console.log('== Código ==');
out.codigo = {};
for (const [g, fs] of Object.entries(grupos)) { const n = fs.reduce((t, f) => t + lineas(f), 0); out.codigo[g] = { archivos: fs.length, lineas: n }; console.log(`${g.padEnd(30)} ${String(fs.length).padStart(3)} archivos  ${String(n).padStart(6)} líneas`); }
const pkg = JSON.parse(readFileSync(R('package.json'), 'utf8'));
out.dependencias = { ...pkg.dependencies, ...pkg.devDependencies };
console.log('dependencias:', JSON.stringify(out.dependencias));

// ------------------------------------------------------------------------------------------------ marcas, fichas, fotos
const { LUGARES } = await import('../../src/marcas.js');
const fotosJson = JSON.parse(readFileSync(R('src/fotos.json'), 'utf8'));
const fuenteFichas = readFileSync(R('src/fichas.js'), 'utf8').replace(/import DATOS from '\.\/fotos\.json';/, `const DATOS = ${JSON.stringify(fotosJson)};`);
const { FICHAS, FOTOS } = await import('data:text/javascript;charset=utf-8,' + encodeURIComponent(fuenteFichas));
const ETAPAS = [1867, 1888, 1895, 1905, 1910, 1921, 1940];
console.log('\n== Marcas (src/marcas.js, LUGARES) ==');
const porNivel = {}, porDesde = {}; let conFin = 0;
for (const l of LUGARES) { const nivel = l[4], ep = l[6] ?? {}; porNivel[nivel] = (porNivel[nivel] ?? 0) + 1; const d = ETAPAS[ep.desde ?? 0]; porDesde[d] = (porDesde[d] ?? 0) + 1; if (ep.hasta) conFin++; }
console.log(`marcas de época: ${LUGARES.length} · por nivel ${JSON.stringify(porNivel)} · por etapa en que aparecen ${JSON.stringify(porDesde)} · con fecha de salida ${conFin}`);
const vigentes = ETAPAS.map((a, e) => LUGARES.filter((l) => { const ep = l[6] ?? {}; return (ep.desde ?? 0) <= e && (!ep.hasta || e < ep.hasta); }).length);
console.log('marcas vigentes por etapa:', ETAPAS.map((a, i) => `${a}: ${vigentes[i]}`).join(' · '));
const hoy = JSON.parse(readFileSync(R('public/datos/hoy.json'), 'utf8'));
console.log(`marcas «de hoy» (public/datos/hoy.json): ${hoy.length} (de ellas ${hoy.filter((h) => h.rio).length} caen en lo que en 1867 era río)`);
out.marcas = { epoca: LUGARES.length, porNivel, porDesde, conFin, vigentes: Object.fromEntries(ETAPAS.map((a, i) => [a, vigentes[i]])), hoy: hoy.length, hoyEnRio: hoy.filter((h) => h.rio).length };

console.log('\n== Fichas y fotos (src/fichas.js, src/fotos.json, fuentes/fotos/) ==');
const claves = Object.keys(FICHAS), usadas = new Set();
const fotosDe = (f) => { const s = new Set(); const andar = (o) => { if (!o || typeof o !== 'object') return; if (Array.isArray(o.fotos)) for (const k of o.fotos) s.add(k); for (const v of Object.values(o)) andar(v); }; andar(f); return s; };
let conFoto = 0; for (const k of claves) { const s = fotosDe(FICHAS[k]); if (s.size) conFoto++; for (const x of s) usadas.add(x); }
const licencias = {}; for (const v of Object.values(fotosJson)) licencias[v.licencia] = (licencias[v.licencia] ?? 0) + 1;
const enFuentes = readdirSync(R('fuentes/fotos')).filter((f) => f.endsWith('.json') && f !== 'recortes.json');
const licFuentes = {}; let sinDatos = 0;
for (const f of enFuentes) { const j = JSON.parse(readFileSync(R('fuentes/fotos/' + f), 'utf8')); const l = j.licencia ?? j.license ?? '(sin dato)'; licFuentes[l] = (licFuentes[l] ?? 0) + 1; if (!j.autor && !j.artist) sinDatos++; }
const commons = Object.values(fotosJson).filter((v) => /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(v.fuente ?? '')).length;
const pesoFotos = (d) => existsSync(R(d)) ? readdirSync(R(d)).filter((f) => f.endsWith('.webp')).reduce((t, f) => t + statSync(R(`${d}/${f}`)).size, 0) : 0;
console.log(`fichas: ${claves.length} · con al menos una foto: ${conFoto}`);
console.log(`fotos catalogadas (src/fotos.json): ${Object.keys(fotosJson).length} · con pie en src/fichas.js (FOTOS): ${Object.keys(FOTOS).length} · citadas por alguna ficha: ${usadas.size}`);
console.log(`licencias en src/fotos.json: ${JSON.stringify(licencias)} · con dirección de Wikimedia Commons: ${commons}`);
console.log(`fuentes/fotos/*.json: ${enFuentes.length} · licencias: ${JSON.stringify(licFuentes)} · sin autor anotado: ${sinDatos}`);
console.log(`peso: public/fotos/*.webp ${(pesoFotos('public/fotos') / 1e6).toFixed(1)} MB · public/fotos/m/*.webp ${(pesoFotos('public/fotos/m') / 1e6).toFixed(1)} MB`);
const autores = {}; for (const v of Object.values(fotosJson)) { const a = /desconocid|unknown|an[oó]nim/i.test(v.autor ?? '') || !v.autor ? '(autor desconocido)' : v.autor.replace(/\s*\(.*$/, '').trim(); autores[a] = (autores[a] ?? 0) + 1; }
const top = Object.entries(autores).sort((a, b) => b[1] - a[1]);
console.log(`autores: ${top.length} rótulos distintos; los más frecuentes: ${top.slice(0, 8).map(([a, n]) => `${a} ${n}`).join(' · ')}`);
out.fichas = { fichas: claves.length, conFoto, fotos: Object.keys(fotosJson).length, fotosConPie: Object.keys(FOTOS).length, fotosCitadas: usadas.size, licencias, commons, fuentes: enFuentes.length, licFuentes, mbGrandes: pesoFotos('public/fotos') / 1e6, mbFicha: pesoFotos('public/fotos/m') / 1e6, autoresTop: top.slice(0, 8) };

// ------------------------------------------------------------------------------------------------ lugares a mano
console.log('\n== Lugares modelados a mano ==');
const lug = dir('src/lugares', /\.js$/);
const { EDIFICIOS } = await import('../../src/edificios.js');
const epocasEn = (f) => (readFileSync(R(f), 'utf8').match(/c\.epoca\(/g) ?? []).length;
out.lugares = { archivos: lug.length, edificiosOSM: Object.keys(EDIFICIOS).length, detalle: lug.map((f) => ({ archivo: f, lineas: lineas(f), cambiosDeEpoca: epocasEn(f) })) };
console.log(`archivos en src/lugares/: ${lug.length} (${lug.reduce((t, f) => t + lineas(f), 0)} líneas) · plantas de edificios tomadas de OpenStreetMap (src/edificios.js): ${Object.keys(EDIFICIOS).length}`);
for (const d of out.lugares.detalle) console.log(`  ${d.archivo.padEnd(38)} ${String(d.lineas).padStart(4)} líneas · ${String(d.cambiosDeEpoca).padStart(3)} llamadas a c.epoca()`);
const ig = JSON.parse(readFileSync(R('public/datos/ciudad.json'), 'utf8')).iglesias.length;
console.log(`iglesias levantadas desde las cruces del plano (public/datos/ciudad.json): ${ig}`);

// ------------------------------------------------------------------------------------------------ lo que baja el navegador
console.log('\n== Lo que baja el navegador (bytes en disco de public/; el servidor los manda tal cual: ya vienen comprimidos) ==');
const kb = (f) => statSync(R(f)).size, MB = (b) => (b / 1e6).toFixed(2).padStart(6) + ' MB';
const etapas = [
  ['1. el plano tendido', ['public/plano/primero.webp', 'public/plano/laminas.json', 'public/datos/ciudad.json']],
  ['2. la ciudad de 1867', ['public/datos/ciudad.pak']],
  ['   (alternativa sin DecompressionStream: los cuatro .bin)', ['public/datos/manzanas.bin', 'public/datos/techos.bin', 'public/datos/muros.bin', 'public/datos/arboles.bin']],
  ['3a. lámina entera, pantalla grande', ['public/plano/medio.webp']],
  ['3b. lámina entera, teléfono', ['public/plano/medio-4k.webp']],
  ['4. al salir de 1867 (línea de tiempo)', ['public/datos/crece.pak', 'public/datos/crece.json', 'public/plano/crece.webp', 'public/plano/despeje.webp']],
  ['   (lo mismo, en teléfono: láminas -2k)', ['public/datos/crece.pak', 'public/datos/crece.json', 'public/plano/crece-2k.webp', 'public/plano/despeje-2k.webp']],
  ['5. al prender el color', ['public/plano/suelo.webp', 'public/plano/calles.webp', 'public/datos/patios.pak']],
  ['   (lo mismo, en teléfono)', ['public/plano/suelo-2k.webp', 'public/plano/calles-2k.webp', 'public/datos/patios.pak']],
  ['6. «lo de hoy»', ['public/plano/hoy-cerca.webp', 'public/plano/hoy-lejos.webp', 'public/datos/hoy.json', 'public/datos/calles.bin', 'public/datos/calles.json']],
  ['7. relieve (apagado por defecto)', ['public/datos/relieve.bin']],
];
out.descarga = {};
for (const [n, fs] of etapas) { const t = fs.reduce((s, f) => s + kb(f), 0); out.descarga[n.trim()] = { bytes: t, archivos: fs.map((f) => [f, kb(f)]) }; console.log(`${n.padEnd(58)} ${MB(t)}   ${fs.map((f) => `${f.split('/').pop()} ${(kb(f) / 1e3).toFixed(0)} kB`).join(' · ')}`); }
const tes = readdirSync(R('public/plano/f')).filter((f) => f.endsWith('.webp')).map((f) => kb('public/plano/f/' + f));
console.log(`teselas a tamaño del escaneo (public/plano/f): ${tes.length}, ${MB(tes.reduce((a, b) => a + b, 0))} en total; cada una ${(Math.min(...tes) / 1e6).toFixed(2)}–${(Math.max(...tes) / 1e6).toFixed(2)} MB, mediana ${(tes.sort((a, b) => a - b)[tes.length >> 1] / 1e6).toFixed(2)} MB`);
out.teselas = { n: tes.length, bytes: tes.reduce((a, b) => a + b, 0), min: Math.min(...tes), max: Math.max(...tes) };
let total = 0; const andar = (d) => { for (const e of readdirSync(R(d), { withFileTypes: true })) { if (e.isDirectory()) andar(`${d}/${e.name}`); else total += kb(`${d}/${e.name}`); } }; andar('public');
console.log(`todo public/: ${MB(total)}`); out.publicBytes = total;

// el código ya construido (dist/assets), si está: tal cual y comprimido como lo mandaría un servidor
if (existsSync(R('dist/assets'))) {
  console.log('\n== Código construido (dist/assets; solo lectura) ==');
  out.js = [];
  for (const f of readdirSync(R('dist/assets')).sort()) { const b = readFileSync(R('dist/assets/' + f)), g = gzipSync(b, { level: 9 }).length, br = brotliCompressSync(b).length; out.js.push({ archivo: f.replace(/-[A-Za-z0-9_-]{8}\./, '-*.'), bytes: b.length, gzip: g, brotli: br }); console.log(`${f.padEnd(34)} ${(b.length / 1e3).toFixed(0).padStart(6)} kB   gzip ${(g / 1e3).toFixed(0).padStart(5)} kB   brotli ${(br / 1e3).toFixed(0).padStart(5)} kB`); }
  for (const f of ['index.html', 'edificios.html']) if (existsSync(R('dist/' + f))) { const b = readFileSync(R('dist/' + f)); out.js.push({ archivo: f, bytes: b.length, gzip: gzipSync(b, { level: 9 }).length, brotli: brotliCompressSync(b).length }); console.log(`${f.padEnd(34)} ${(b.length / 1e3).toFixed(0).padStart(6)} kB   gzip ${(gzipSync(b, { level: 9 }).length / 1e3).toFixed(0).padStart(5)} kB`); }
  console.log(`dist/ construido el ${statSync(R('dist/index.html')).mtime.toISOString()}`);
}
writeFileSync(new URL('./conteos.json', import.meta.url), JSON.stringify(out, null, 1));
