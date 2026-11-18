// Prueba de las fichas en un navegador de verdad: abre varias, agranda una foto, cierra, toca un edificio, cambia de
// año (las marcas y las fichas de la línea de tiempo), y repite en el teléfono. Deja capturas en shots/ficha-*.png.   node tools/fichas.mjs [--url http://localhost:5430/]
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { mkdirSync } from 'node:fs';
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : process.argv[i + 1]; };
let server = null, url = arg('url', null);
if (!url) { server = await createServer({ server: { port: 5436 }, logLevel: 'error' }); await server.listen(); url = 'http://localhost:5436/'; }
const browser = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--ignore-gpu-blocklist', '--use-angle=metal', '--enable-gpu'] });
mkdirSync('shots', { recursive: true });
let fallas = 0;
const ok = (cond, que) => { if (!cond) fallas++; console.log(cond ? '  ok ' : '  FALLA', que); };

async function abrirPagina(opts) {
  const page = await browser.newPage(opts);
  const errores = [];
  page.on('console', (m) => { if (m.type() === 'error') errores.push('[error] ' + m.text().slice(0, 300)); });
  page.on('pageerror', (e) => errores.push('[pageerror] ' + e.message));
  page.on('requestfailed', (r) => errores.push('[red] ' + r.url()));
  page.on('response', (r) => { if (r.status() >= 400) errores.push(`[${r.status()}] ${r.url()}`); });
  await page.goto(url);
  await page.waitForFunction(() => window.lab?.ready, null, { timeout: 120000 });
  if (await page.locator('#intro.ver').count()) { await page.waitForTimeout(500); await page.click('#intro .entrar'); }
  await page.waitForTimeout(7000); // la presentación: se levanta la ciudad
  return { page, errores };
}
// lleva la cámara cerca de la marca (para que se vea) y la toca
async function tocar(page, nombre, { tap = false } = {}) {
  await page.evaluate((n) => { const m = lab.marcas.marcas.find((m) => m.el.querySelector('b').textContent === n); const k = Math.min(1, innerWidth / 1200); lab.ver({ x: m.x + 120 * k, z: m.z + 160 * k, dist: 900, pitch: 0.7 }); }, nombre);
  await page.waitForTimeout(500);
  const tag = page.locator('.marca.ver .tag').filter({ has: page.locator('b', { hasText: new RegExp('^' + nombre + '$') }) });
  if (!(await tag.count())) { console.log('  (la marca', nombre, 'no está a la vista: se la toca por código)'); await page.evaluate((n) => lab.marcas.marcas.find((m) => m.el.querySelector('b').textContent === n).el.querySelector('.tag').click(), nombre); }
  // (con el dedo las etiquetas no atajan el toque: se toca el lugar de la pantalla donde está, como haría un dedo)
  else if (tap) { const b = await tag.boundingBox(); await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); } else await tag.click();
  await page.waitForTimeout(3300); // el vuelo
}
const estado = (page) => page.evaluate(() => {
  const f = document.getElementById('ficha'), r = f.getBoundingClientRect(), caja = (id) => { const e = document.getElementById(id); if (!e) return null; const b = e.getBoundingClientRect(), o = +getComputedStyle(e).opacity; return o > 0.05 && b.width ? b : null; };
  const pisa = (b) => !!b && r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top;
  const a = document.querySelector('.marca.abierta'), ar = a?.querySelector('.tag').getBoundingClientRect();
  return {
    abierta: f.classList.contains('ver'), titulo: f.querySelector('h2').textContent, era: f.querySelector('.era').textContent,
    parrafos: f.querySelectorAll('.texto p').length, fotos: f.querySelectorAll('figure').length,
    cargadas: [...f.querySelectorAll('figure img')].filter((i) => i.complete && i.naturalWidth > 0).length,
    caja: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)],
    pisaBotones: pisa(caja('botones')), pisaLeyenda: pisa(caja('leyenda')), pisaBuscador: pisa(caja('buscar')), pisaInfo: pisa(caja('titulo')),
    marcaTapada: ar ? pisa(ar) : null, notaALaVista: a ? !!a.querySelector('.tag i') && getComputedStyle(a.querySelector('.tag i')).display !== 'none' : null,
  };
});
async function revisar(page, nombre, pre, { hoy = false, minFotos = 0, tap = false } = {}) {
  console.log(nombre);
  await tocar(page, nombre, { tap });
  await page.waitForFunction(() => [...document.querySelectorAll('#ficha figure img')].every((i) => i.complete), null, { timeout: 15000 }).catch(() => {});
  const e = await estado(page);
  console.log('  ', JSON.stringify(e));
  ok(e.abierta && e.parrafos >= 1 && (hoy || e.era.length > 5), 'se abre con su texto');
  ok(e.fotos >= minFotos && e.cargadas === e.fotos, `fotos: ${e.fotos} (todas cargadas)`);
  ok(!e.pisaBotones && !e.pisaLeyenda && !e.pisaBuscador && !e.pisaInfo, 'no tapa botones, leyenda, buscador ni el recuadro de información');
  ok(e.marcaTapada === false, 'la marca queda a la vista'); ok(e.notaALaVista === false, 'la notita de la marca no se repite');
  await page.screenshot({ path: `shots/ficha-${pre}-${nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png` });
  return e;
}

// --- escritorio ---
console.log('== escritorio 1440x900');
{
  const { page, errores } = await abrirPagina({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await revisar(page, 'Cabildo', 'pc', { minFotos: 2 });
  await revisar(page, 'Catedral', 'pc', { minFotos: 2 });
  await revisar(page, 'Recova Vieja', 'pc', { minFotos: 2 });
  await revisar(page, 'La Merced', 'pc', { minFotos: 1 });
  await revisar(page, 'Estación del Parque', 'pc', { minFotos: 2 });
  await revisar(page, 'Estación del Sud', 'pc');
  // el visor: agrandar la primera foto, pasar a la siguiente, cerrar con Escape (la ficha tiene que seguir)
  await tocar(page, 'Recova Vieja');
  await page.locator('#ficha figure button').first().click(); await page.waitForTimeout(900);
  const v1 = await page.evaluate(() => ({ ver: document.getElementById('visor').classList.contains('ver'), src: document.querySelector('#visor img').src.split('/').pop(), ok: document.querySelector('#visor img').naturalWidth, enlace: document.querySelector('#visor .pie a')?.href }));
  console.log('visor', JSON.stringify(v1)); ok(v1.ver && v1.ok > 0 && /commons\.wikimedia\.org/.test(v1.enlace), 'la foto se agranda, con su enlace a Commons');
  await page.screenshot({ path: 'shots/ficha-pc-visor.png' });
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(700);
  const v2 = await page.evaluate(() => document.querySelector('#visor img').src.split('/').pop()); ok(v2 !== v1.src, 'la flecha pasa a la siguiente: ' + v2);
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  ok(await page.evaluate(() => !document.getElementById('visor').classList.contains('ver') && document.getElementById('ficha').classList.contains('ver')), 'Escape cierra el visor y deja la ficha');
  await page.locator('#ficha figure button').first().click(); await page.waitForTimeout(500); await page.mouse.click(20, 120); await page.waitForTimeout(400);
  ok(await page.evaluate(() => !document.getElementById('visor').classList.contains('ver')), 'tocar afuera cierra el visor');
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  ok(await page.evaluate(() => !document.getElementById('ficha').classList.contains('ver') && !document.body.classList.contains('ficha')), 'Escape cierra la ficha');
  await tocar(page, 'Cabildo'); await page.click('#ficha .x'); await page.waitForTimeout(500);
  ok(await page.evaluate(() => !document.getElementById('ficha').classList.contains('ver')), 'la × cierra la ficha');
  // tocar el edificio mismo (sin arrastrar): la Catedral
  const p = await page.evaluate(() => { const m = lab.marcas.marcas.find((m) => m.el.querySelector('b').textContent === 'Catedral'); const v = new lab.Vector3(m.x, m.alto * 0.5, m.z).project(lab.camera); return [(v.x * 0.5 + 0.5) * innerWidth, (-v.y * 0.5 + 0.5) * innerHeight]; });
  await page.mouse.click(p[0], p[1]); await page.waitForTimeout(3200);
  const e = await estado(page); ok(e.abierta && e.titulo === 'Catedral', 'tocar el edificio abre su ficha: ' + e.titulo);
  // arrastrar no abre nada, y la cámara se mueve con la ficha abierta
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  const c0 = await page.evaluate(() => lab.cam.goal.x);
  await page.mouse.move(500, 500); await page.mouse.down(); await page.mouse.move(380, 560, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(500);
  ok(await page.evaluate((c0) => !document.getElementById('ficha').classList.contains('ver') && Math.abs(lab.cam.goal.x - c0) > 1, c0), 'arrastrar mueve la cámara y no abre fichas');
  // lo de hoy: una marca roja, con la leyenda puesta
  await page.click('#hoy'); await page.waitForTimeout(1500);
  await revisar(page, 'Obelisco', 'pc', { hoy: true, minFotos: 1 });
  await revisar(page, 'Congreso', 'pc', { hoy: true });
  await revisar(page, 'Cabildo', 'pc-hoy', { minFotos: 2 });
  await tocar(page, 'Obelisco'); await page.click('#hoy'); await page.waitForTimeout(700);
  ok(await page.evaluate(() => !document.getElementById('ficha').classList.contains('ver')), 'al apagar lo de hoy, la ficha roja se cierra');
  // --- la línea de tiempo: los edificios de cada año tienen su marca y su ficha, y se nota que se pueden tocar ---
  console.log('la línea de tiempo: 1910');
  const enPantalla = (page, cual) => page.evaluate((cual) => { const m = lab.marcas.marcas.find((m) => (m.ficha ?? m.nombre) === cual); const v = new lab.Vector3(m.x, m.alto * 0.5, m.z).project(lab.camera); return [(v.x * 0.5 + 0.5) * innerWidth, (-v.y * 0.5 + 0.5) * innerHeight]; }, cual);
  const marca = (page, cual) => page.evaluate((cual) => { const m = lab.marcas.marcas.find((m) => (m.ficha ?? m.nombre) === cual); return { vale: m.vale, ver: m.ver, nueva: m.el.classList.contains('nueva'), sobre: m.el.classList.contains('sobre') }; }, cual);
  ok(!(await marca(page, 'Tribunales')).vale && !(await marca(page, 'Tribunales')).ver, 'en 1867 Tribunales no tiene marca');
  await page.evaluate(() => { lab.ver({ x: 800, z: -1000, dist: 1100, yaw: 0.6, pitch: 0.7 }); lab.epocas.elegir(1910); });
  await page.waitForFunction(() => lab.marcas.etapa === 4, null, { timeout: 90000 }); await page.waitForTimeout(400);
  { const t = await marca(page, 'Tribunales'), c = await marca(page, 'Teatro Colón (1908)'), viejas = await page.evaluate(() => ['Estación del Parque', 'Plaza del Parque', 'Recova Vieja'].filter((n) => lab.marcas.marcas.find((m) => m.nombre === n).vale));
    ok(t.vale && t.ver && c.vale && c.ver, 'en 1910 aparecen las marcas de Tribunales y del Colón nuevo');
    ok(t.nueva && c.nueva, 'y se anuncian con un pulso'); ok(!viejas.length, 'las de lo que ya no está se fueron' + (viejas.length ? ': quedan ' + viejas : ''));
    await page.screenshot({ path: 'shots/ficha-pc-1910-pulso.png' }); }
  // pasar el mouse por el edificio: la manito y la marca resaltada; al arrastrar, nada
  { const p = await enPantalla(page, 'Tribunales'); await page.mouse.move(p[0] - 30, p[1] + 10); await page.mouse.move(p[0], p[1], { steps: 4 }); await page.waitForTimeout(250);
    ok((await marca(page, 'Tribunales')).sobre && await page.evaluate(() => lab.renderer.domElement.style.cursor === 'pointer'), 'al pasar el mouse por Tribunales, la manito y su marca resaltada');
    await page.screenshot({ path: 'shots/ficha-pc-1910-sobre.png' });
    await page.mouse.down(); await page.mouse.move(p[0] + 40, p[1] + 30, { steps: 5 }); await page.waitForTimeout(150);
    ok(!(await marca(page, 'Tribunales')).sobre && await page.evaluate(() => !document.querySelector('.marca.sobre') && lab.renderer.domElement.style.cursor === ''), 'mientras se arrastra no se resalta nada');
    await page.mouse.up(); await page.waitForTimeout(600); ok(await page.evaluate(() => !document.getElementById('ficha').classList.contains('ver')), 'y arrastrar no abrió ninguna ficha'); }
  await page.waitForTimeout(2600); ok(!(await marca(page, 'Tribunales')).nueva, 'el pulso se apaga solo');
  await revisar(page, 'Tribunales', 'pc-1910', { minFotos: 1 });
  // tocar el edificio mismo: el Colón nuevo (que comparte el nombre con el de 1857: cada uno tiene su ficha)
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  await page.evaluate(() => lab.ver({ x: 800, z: -1000, dist: 1100, yaw: 0.6, pitch: 0.7 })); await page.waitForTimeout(600); // (la ficha anterior dejó la cámara encima de Tribunales)
  { const p = await enPantalla(page, 'Teatro Colón (1908)'); await page.mouse.click(p[0], p[1]); await page.waitForTimeout(3200);
    const e = await estado(page); ok(e.abierta && e.titulo === 'Teatro Colón' && /1908/.test(e.era), 'tocar el Colón nuevo abre su ficha: ' + e.titulo + ' · ' + e.era);
    await page.screenshot({ path: 'shots/ficha-pc-1910-colon.png' }); }
  // con lo de hoy prendido, la marca roja del mismo edificio se calla: gana la de la época
  await page.click('#hoy'); await page.waitForTimeout(900);
  ok(await page.evaluate(() => { const h = lab.marcas.marcas.find((m) => m.hoy && m.nombre === 'Teatro Colón de hoy'), o = lab.marcas.marcas.find((m) => m.hoy && m.nombre === 'Abasto'); return !h.vale && !h.ver && o.vale; }), 'la marca roja del Colón de hoy no se encima con la de 1908');
  await page.click('#hoy'); await page.waitForTimeout(500);
  // de vuelta en 1867 con la ficha de un edificio de 1910 abierta: se cierra, y la marca ya no está ni se puede tocar
  await tocar(page, 'Tribunales'); ok((await estado(page)).titulo === 'Palacio de Justicia', 'la ficha de Tribunales, abierta');
  await page.evaluate(() => lab.epocas.elegir(1867)); await page.waitForFunction(() => lab.marcas.etapa === 0, null, { timeout: 30000 }); await page.waitForTimeout(700);
  { const t = await marca(page, 'Tribunales'); ok(!t.vale && !t.ver, 'en 1867 la marca de Tribunales ya no está');
    ok(await page.evaluate(() => !document.getElementById('ficha').classList.contains('ver') && !document.querySelector('.marca.abierta')), 'y su ficha se cerró sola');
    const p = await enPantalla(page, 'Tribunales'); await page.mouse.click(p[0], p[1]); await page.waitForTimeout(1200);
    ok((await estado(page)).titulo !== 'Palacio de Justicia' || !(await estado(page)).abierta, 'tocar donde va a estar Tribunales no abre su ficha');
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    ok(await page.evaluate(() => ['Estación del Parque', 'Plaza del Parque', 'Recova Vieja'].every((n) => lab.marcas.marcas.find((m) => m.nombre === n).vale)), 'y vuelven las marcas de 1867'); }
  console.log(errores.length ? errores.join('\n') : 'sin errores en la consola'); fallas += errores.length;
  await page.close();
}

// --- ventana angosta ---
console.log('== ventana angosta 900x700');
{
  const { page, errores } = await abrirPagina({ viewport: { width: 900, height: 700 }, deviceScaleFactor: 1 });
  await revisar(page, 'Aduana Nueva', 'angosta', { minFotos: 2 });
  console.log(errores.length ? errores.join('\n') : 'sin errores en la consola'); fallas += errores.length;
  await page.close();
}

// --- teléfono ---
console.log('== teléfono 390x844');
{
  const { page, errores } = await abrirPagina({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
  for (const [n, o] of [['Cabildo', { minFotos: 2 }], ['Recova Vieja', { minFotos: 2 }], ['Santo Domingo', { minFotos: 2 }], ['Estación del Norte', { minFotos: 1 }], ['Monserrat', {}]]) {
    const e = await revisar(page, n, 'tel', { ...o, tap: true });
    ok(e.caja[1] >= 844 * 0.44, 'no pasa de la mitad de la pantalla (arriba en ' + e.caja[1] + ')');
  }
  await tocar(page, 'Cabildo', { tap: true });
  await page.locator('#ficha figure button').first().tap(); await page.waitForTimeout(900);
  ok(await page.evaluate(() => document.getElementById('visor').classList.contains('ver') && document.querySelector('#visor img').naturalWidth > 0), 'la foto se agranda en el teléfono');
  await page.screenshot({ path: 'shots/ficha-tel-visor.png' });
  await page.tap('#visor .x'); await page.waitForTimeout(400);
  await page.tap('#hoy'); await page.waitForTimeout(1500);
  const e = await revisar(page, 'Casa Rosada', 'tel', { hoy: true, minFotos: 1, tap: true });
  ok(e.caja[1] >= 844 * 0.44, 'no pasa de la mitad de la pantalla (arriba en ' + e.caja[1] + ')');
  await page.tap('#ficha .x'); await page.waitForTimeout(500);
  ok(await page.evaluate(() => !document.getElementById('ficha').classList.contains('ver')), 'la × cierra la ficha');
  console.log(errores.length ? errores.join('\n') : 'sin errores en la consola'); fallas += errores.length;
  await page.close();
}
console.log(fallas ? `\n${fallas} FALLAS` : '\ntodo bien');
await browser.close(); await server?.close();
process.exit(fallas ? 1 : 0);
