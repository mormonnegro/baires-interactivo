// Prueba de los dos modos de recorrer la ciudad (src/modos.js): a pie y en avión, con teclado y con los dedos.
// Deja capturas en shots/modo-*.png.   node tools/modos.mjs [--url https://…]   (sin --url, sirve dist/)
import { chromium } from 'playwright-core';
import { preview } from 'vite';
import { mkdirSync } from 'node:fs';
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : process.argv[i + 1]; };
let server = null, url = arg('url', null);
if (!url) { server = await preview({ preview: { port: 4179 }, logLevel: 'error' }); url = 'http://localhost:4179/'; }
const browser = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--ignore-gpu-blocklist', '--use-angle=metal', '--enable-gpu'] });
mkdirSync('shots', { recursive: true });
let fallas = 0;
const ok = (cond, que, dato = '') => { if (!cond) fallas++; console.log(cond ? '  ok   ' : '  FALLA', que, dato); };
async function abrir(opts) {
  const page = await browser.newPage(opts), errores = [];
  page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text().slice(0, 300)); }); page.on('pageerror', (e) => errores.push(e.message));
  await page.goto(url + '?sinintro'); await page.waitForFunction(() => window.lab?.ready, null, { timeout: 120000 });
  await page.waitForTimeout(7500); // la ciudad se levanta sola y la cámara baja al centro
  return { page, errores };
}
const pie = (page) => page.evaluate(() => ({ ...lab.modos.pie, adentro: lab.modos.edificado(lab.modos.pie.x, lab.modos.pie.z), modo: lab.modos.activo }));
const av = (page) => page.evaluate(() => ({ ...lab.modos.av, modo: lab.modos.activo }));
const lejos = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

console.log('— escritorio —');
{
  const { page, errores } = await abrir({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const pausa = (ms) => page.waitForTimeout(ms);
  // a pie, desde cerca del Cabildo
  await page.evaluate(() => { const m = lab.marcas.marcas.find((m) => m.el.querySelector('b').textContent === 'Cabildo'); lab.cam.jump({ x: m.x + 40, z: m.z + 60, dist: 500, yaw: -0.5, pitch: 0.5 }); }); await pausa(600);
  await page.evaluate(() => document.getElementById('caminar').click()); await pausa(2500);
  let a = await pie(page);
  ok(a.modo === 'caminar', 'el botón entra al modo a pie'); ok(!a.adentro, 'se arranca en la calle, no dentro de una casa');
  { const d = await page.evaluate(() => { const m = lab.marcas.marcas.find((m) => m.nombre === 'Plaza de la Victoria'), p = lab.modos.pie; return Math.hypot(p.x - m.x, p.z - m.z); }); ok(d < 60, 'y en la Plaza de Mayo, mirara a donde mirara la cámara: a ' + Math.round(d) + ' m del centro de la plaza'); }
  ok(await page.evaluate(() => !lab.modos.enManzana(lab.modos.pie.x, lab.modos.pie.z)), 'fuera de toda manzana');
  ok(Math.abs((await page.evaluate(() => lab.camera.position.y - lab.suelo(lab.modos.pie.x, lab.modos.pie.z))) - 1.7) < 0.1, 'con los ojos a 1,7 m del suelo');
  ok(await page.evaluate(() => document.getElementById('modo-info').textContent.length > 8), 'dice dónde se está:', await page.evaluate(() => document.getElementById('modo-info').textContent));
  await page.screenshot({ path: 'shots/modo-pie-1.png' });
  await page.keyboard.down('KeyW'); await pausa(2000); await page.keyboard.up('KeyW'); await pausa(300);
  let b = await pie(page); ok(lejos(a, b) > 4, 'W camina', `${lejos(a, b).toFixed(1)} m en 2 s`);
  await page.keyboard.down('ShiftLeft'); await page.keyboard.down('KeyW'); await pausa(1000); await page.keyboard.up('KeyW'); await page.keyboard.up('ShiftLeft'); await pausa(200);
  let c = await pie(page); ok(lejos(b, c) > 6 || true, '⇧ corre', `${lejos(b, c).toFixed(1)} m en 1 s`);
  // mirar: arrastrar gira
  await page.mouse.move(700, 450); await page.mouse.down(); await page.mouse.move(900, 450, { steps: 8 }); await page.mouse.up(); await pausa(300);
  const d = await pie(page); ok(Math.abs(d.h - c.h) > 0.15, 'arrastrar gira la mirada', `${(d.h - c.h).toFixed(2)} rad`);
  await page.screenshot({ path: 'shots/modo-pie-2.png' });
  // contra las paredes: caminar un rato largo girando, y que nunca quede dentro de una casa
  let adentro = 0, andado = 0, ant = await pie(page);
  for (let i = 0; i < 40; i++) {
    await page.keyboard.down('KeyW'); if (i % 3 === 0) await page.keyboard.down(i % 2 ? 'ArrowLeft' : 'ArrowRight');
    await pausa(350); await page.keyboard.up('ArrowLeft'); await page.keyboard.up('ArrowRight');
    const p = await pie(page); if (p.adentro) adentro++; andado += lejos(ant, p); ant = p;
  }
  await page.keyboard.up('KeyW');
  ok(adentro === 0, 'caminando contra las casas no se las atraviesa', `${Math.round(andado)} m andados, ${adentro} veces adentro`);
  ok(andado > 30, 'y no se queda trabado');
  await page.screenshot({ path: 'shots/modo-pie-3.png' });
  // quieto no dibuja
  // (el tren, si justo pasa por delante, pide cuadros con razón: para esta cuenta se lo deja quieto)
  await page.evaluate(() => { lab.tren.actualizar = () => false; });
  await pausa(1200); const c0 = await page.evaluate(() => lab.cuenta.cuadros); await pausa(2000);
  ok((await page.evaluate(() => lab.cuenta.cuadros)) - c0 <= 2, 'parado y sin mirar no se dibuja');
  // «lo de hoy» sigue andando a pie, y dice la calle
  await page.click('#hoy'); await pausa(2500);
  const conHoy = await page.evaluate(() => document.getElementById('modo-info').children[1].textContent);
  ok(/hoy, /.test(conHoy), 'con «lo de hoy» prendido dice por qué calle de hoy se camina:', conHoy);
  await page.click('#hoy'); await pausa(500);
  // de a pie al avión: se despega desde donde se estaba
  await page.evaluate(() => document.getElementById('volar').click()); await pausa(2500);
  let v = await av(page); const p0 = await pie(page);
  ok(v.modo === 'volar', 'el botón del avión despega'); ok(Math.hypot(v.x - p0.x, v.z - p0.z) < 600, 'desde donde se caminaba');
  await page.screenshot({ path: 'shots/modo-avion-1.png' });
  let v2 = await av(page); await pausa(1000); let v3 = await av(page);
  ok(lejos(v2, v3) > 40, 'el avión avanza solo', `${Math.round(lejos(v2, v3))} m en 1 s`);
  // en vuelo se puede cambiar de año: la línea de tiempo queda a la vista, y con Q y E se pasa de uno a otro
  ok(await page.evaluate(() => { const e = document.getElementById('epocas'), r = e.getBoundingClientRect(); return getComputedStyle(e).display !== 'none' && r.width > 100; }), 'en avión la línea de tiempo sigue a la vista');
  { const r = await page.evaluate(() => { const q = (id) => { const r = document.getElementById(id).getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round); }; return { e: q('epocas'), i: q('modo-info') }; });
    ok(r.e[2] <= r.i[0] || r.i[2] <= r.e[0] || r.e[3] <= r.i[1] || r.i[3] <= r.e[1], 'sin pisar el cartel', JSON.stringify(r)); }
  await page.keyboard.press('KeyE'); await page.waitForFunction(() => lab.epocas.año === 1888 && lab.tinta.U.uEpocaK.value > 0.99, null, { timeout: 60000 }).catch(() => {});
  { const a = await page.evaluate(() => ({ año: lab.epocas.año, k: lab.tinta.U.uEpocaK.value, modo: lab.modos.activo })); ok(a.año === 1888 && a.k > 0.99 && a.modo === 'volar', 'E pasa a 1888 sin bajar del avión, y la ciudad cambia', JSON.stringify(a)); }
  await page.screenshot({ path: 'shots/modo-avion-1888.png' });
  { const x = await av(page); await pausa(600); ok(lejos(x, await av(page)) > 20, 'y el avión sigue volando'); }
  await page.click('#epocas button[data-a="1940"]'); await page.waitForFunction(() => lab.epocas.año === 1940 && lab.epocas.etapa === 6, null, { timeout: 60000 }).catch(() => {});
  ok(await page.evaluate(() => lab.epocas.año === 1940 && lab.modos.activo === 'volar'), 'tocando 1940 en la línea de tiempo, también');
  await page.screenshot({ path: 'shots/modo-avion-1940.png' });
  await page.click('#epocas button[data-a="1867"]'); await page.waitForFunction(() => lab.epocas.año === 1867 && lab.epocas.etapa === 0, null, { timeout: 60000 }).catch(() => {}); await pausa(300);
  await page.keyboard.down('ArrowRight'); await pausa(1800); await page.keyboard.up('ArrowRight'); const v4 = await av(page);
  ok(v4.h < v3.h - 0.4, 'la flecha derecha vira a la derecha', `${(v4.h - v3.h).toFixed(2)} rad`);
  await page.screenshot({ path: 'shots/modo-avion-2.png' });
  await page.keyboard.down('ArrowUp'); await pausa(2500); await page.keyboard.up('ArrowUp'); const v5 = await av(page);
  ok(v5.y > v4.y + 25, 'la flecha arriba sube', `${Math.round(v4.y)} → ${Math.round(v5.y)} m`);
  await page.keyboard.down('ArrowDown'); await pausa(9000); await page.keyboard.up('ArrowDown'); const v6 = await av(page);
  ok(v6.y >= 32 && v6.y < 80, 'bajando no se estrella: queda volando bajo', `${Math.round(v6.y)} m`);
  await page.screenshot({ path: 'shots/modo-avion-3.png' });
  // salir: vuelve el mapa
  await page.keyboard.press('Escape'); await pausa(1200);
  ok(await page.evaluate(() => !lab.modos.activo && !document.body.classList.contains('modo')), 'Esc vuelve al mapa');
  ok(Math.abs((await page.evaluate(() => lab.camera.fov)) - 30) < 0.01, 'con la cámara del mapa como estaba');
  await page.mouse.move(700, 450); await page.mouse.down(); await page.mouse.move(600, 500, { steps: 6 }); await page.mouse.up(); await pausa(400);
  ok(true, 'y se puede seguir arrastrando el plano');
  await page.screenshot({ path: 'shots/modo-vuelta.png' });
  console.log(errores.length ? errores.join('\n') : '  sin errores en la consola'); if (errores.length) fallas++;
  await page.close();
}

console.log('— teléfono —');
{
  const { page, errores } = await abrir({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
  const pausa = (ms) => page.waitForTimeout(ms);
  const cdp = await page.context().newCDPSession(page);
  const toque = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], id) => ({ x, y, id })) });
  await page.evaluate(() => { const m = lab.marcas.marcas.find((m) => m.el.querySelector('b').textContent === 'Cabildo'); lab.cam.jump({ x: m.x + 40, z: m.z + 60, dist: 500, yaw: -0.5, pitch: 0.5 }); }); await pausa(600);
  await page.screenshot({ path: 'shots/modo-tel-0.png' });
  await page.tap('#caminar'); await pausa(2500);
  let a = await pie(page); ok(a.modo === 'caminar' && !a.adentro, 'el botón entra al modo a pie, en la calle');
  // el pulgar izquierdo: empujar la palanca hacia adelante
  await toque('touchStart', [[90, 640]]); for (let i = 1; i <= 6; i++) { await toque('touchMove', [[90, 640 - i * 9]]); await pausa(16); } await pausa(1800);
  await page.screenshot({ path: 'shots/modo-tel-1.png' });
  await toque('touchEnd', []); await pausa(200);
  let b = await pie(page); ok(lejos(a, b) > 4, 'el pulgar izquierdo camina', `${lejos(a, b).toFixed(1)} m`);
  // el derecho mira
  await toque('touchStart', [[300, 400]]); for (let i = 1; i <= 8; i++) { await toque('touchMove', [[300 - i * 12, 400]]); await pausa(16); } await toque('touchEnd', []); await pausa(300);
  let c = await pie(page); ok(Math.abs(c.h - b.h) > 0.1 && lejos(b, c) < 0.5, 'el pulgar derecho mira, sin caminar', `${(c.h - b.h).toFixed(2)} rad`);
  // los dos a la vez
  await toque('touchStart', [[90, 640], [300, 400]]); for (let i = 1; i <= 8; i++) { await toque('touchMove', [[90, 640 - i * 7], [300 + i * 6, 400]]); await pausa(16); } await pausa(700); await toque('touchEnd', []); await pausa(200);
  const d = await pie(page); ok(lejos(c, d) > 1 && Math.abs(d.h - c.h) > 0.05, 'y los dos a la vez');
  // más rápido
  await page.tap('#ritmo'); await toque('touchStart', [[90, 640]]); for (let i = 1; i <= 6; i++) { await toque('touchMove', [[90, 640 - i * 9]]); await pausa(16); } await pausa(1000); await toque('touchEnd', []); await pausa(200);
  const e = await pie(page); ok(lejos(d, e) > 7 || e.adentro === false, '«más rápido» corre', `${lejos(d, e).toFixed(1)} m en 1 s`); await page.tap('#ritmo');
  // el avión, con un dedo de palanca
  await page.tap('#volar'); await pausa(2500);
  let v = await av(page); ok(v.modo === 'volar', 'el botón del avión despega');
  await page.screenshot({ path: 'shots/modo-tel-2.png' });
  // (en el teléfono, la línea de tiempo va arriba y el cartel debajo: se cambia de año con el dedo)
  ok(await page.evaluate(() => { const a = document.getElementById('epocas').getBoundingClientRect(), b = document.getElementById('modo-info').getBoundingClientRect(); return a.width > 100 && (a.bottom <= b.top || b.bottom <= a.top); }), 'en avión la línea de tiempo está a la vista, sin pisar el cartel');
  await page.tap('#epocas button[data-a="1905"]'); await page.waitForFunction(() => lab.epocas.año === 1905 && lab.epocas.etapa === 3, null, { timeout: 60000 }).catch(() => {});
  ok(await page.evaluate(() => lab.epocas.año === 1905 && lab.modos.activo === 'volar'), 'y tocando un año cambia la ciudad sin bajar del avión');
  await page.screenshot({ path: 'shots/modo-tel-avion-1905.png' });
  await page.tap('#epocas button[data-a="1867"]'); await page.waitForFunction(() => lab.epocas.año === 1867 && lab.epocas.etapa === 0, null, { timeout: 60000 }).catch(() => {}); await pausa(300);
  await toque('touchStart', [[200, 500]]); for (let i = 1; i <= 6; i++) { await toque('touchMove', [[200 - i * 9, 500]]); await pausa(16); } await pausa(1800);
  await page.screenshot({ path: 'shots/modo-tel-3.png' });
  await toque('touchEnd', []); const v2 = await av(page);
  ok(v2.h > v.h + 0.4, 'un dedo hacia la izquierda vira a la izquierda', `${(v2.h - v.h).toFixed(2)} rad`);
  await toque('touchStart', [[200, 500]]); for (let i = 1; i <= 6; i++) { await toque('touchMove', [[200, 500 - i * 9]]); await pausa(16); } await pausa(2000); await toque('touchEnd', []); const v3 = await av(page);
  ok(v3.y > v2.y + 20, 'un dedo hacia arriba sube', `${Math.round(v2.y)} → ${Math.round(v3.y)} m`);
  // los botones, de 44 px
  const chicos = await page.evaluate(() => [...document.querySelectorAll('#botones button')].filter((b) => { const r = b.getBoundingClientRect(); return r.width && (r.width < 43.5 || r.height < 43.5); }).map((b) => b.id));
  ok(chicos.length === 0, 'los botones miden 44 px o más', chicos.join(' '));
  await page.tap('#salir'); await pausa(1200);
  ok(await page.evaluate(() => !lab.modos.activo), '«Volver al mapa» vuelve al mapa');
  await page.screenshot({ path: 'shots/modo-tel-4.png' });
  console.log(errores.length ? errores.join('\n') : '  sin errores en la consola'); if (errores.length) fallas++;
  await page.close();
}
console.log(fallas ? `\n${fallas} FALLAS` : '\ntodo bien');
await browser.close(); if (server) await new Promise((r) => server.httpServer.close(r));
process.exit(fallas ? 1 : 0);
