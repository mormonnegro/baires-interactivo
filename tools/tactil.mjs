// Prueba táctil sobre lo ya construido (dist/): los gestos de un teléfono, uno por uno, y que la página descanse
// cuando nadie la toca.   node tools/tactil.mjs [--url https://…]
import { chromium } from 'playwright-core';
import { preview } from 'vite';
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : process.argv[i + 1]; };
let server = null, url = arg('url', null);
if (!url) { server = await preview({ preview: { port: 4174 }, logLevel: 'error' }); url = 'http://localhost:4174/'; }
const browser = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--ignore-gpu-blocklist', '--use-angle=metal', '--enable-gpu'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
const errores = []; page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text().slice(0, 300)); }); page.on('pageerror', (e) => errores.push(e.message)); page.on('requestfailed', (r) => errores.push('[red] ' + r.url()));
let fallas = 0;
const ok = (cond, que, dato = '') => { if (!cond) fallas++; console.log(cond ? '  ok   ' : '  FALLA', que, dato); };
await page.goto(url);
await page.waitForFunction(() => window.lab?.ready, null, { timeout: 120000 });
ok(await page.evaluate(() => lab.liviano), 'se reconoce como teléfono (láminas livianas)');
if (await page.locator('#intro.ver').count()) { await page.waitForTimeout(700); await page.screenshot({ path: 'shots/tactil-intro.png' }); await page.tap('#intro .entrar'); }
await page.waitForTimeout(8500);
const estado = () => page.evaluate(() => ({ x: Math.round(lab.cam.goal.x), z: Math.round(lab.cam.goal.z), dist: Math.round(lab.cam.goal.dist), yaw: +lab.cam.goal.yaw.toFixed(3), pitch: +lab.cam.goal.pitch.toFixed(3) }));
const cdp = await page.context().newCDPSession(page);
const toque = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], id) => ({ x, y, id })) });
const pausa = (ms) => page.waitForTimeout(ms);
/** Mueve los dedos de `desde` a `hasta` (listas de puntos) en `n` pasos. */
async function gesto(desde, hasta, n = 12, paso = 16) {
  await toque('touchStart', desde);
  for (let i = 1; i <= n; i++) { await toque('touchMove', desde.map(([x, y], k) => [x + ((hasta[k][0] - x) * i) / n, y + ((hasta[k][1] - y) * i) / n])); await pausa(paso); }
  await toque('touchEnd', []);
}
const lejos = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
let a = await estado(), b;
console.log('al llegar', a);

// un dedo, despacio y frenando antes de soltar: mueve, y se queda donde lo dejaron
await toque('touchStart', [[200, 400]]); for (let i = 1; i <= 10; i++) { await toque('touchMove', [[200 - i * 8, 400 + i * 5]]); await pausa(16); } await pausa(180); await toque('touchEnd', []);
b = await estado(); await pausa(500); let c = await estado();
ok(lejos(a, b) > 20, 'un dedo mueve el plano', `${Math.round(lejos(a, b))} m`); ok(lejos(b, c) < 1, 'soltando quieto, no sigue de largo');
ok(b.yaw === a.yaw && b.dist === a.dist, 'y no gira ni acerca');

// un dedo, rápido y soltando en movimiento: sigue con el impulso
a = await estado(); await gesto([[300, 300]], [[120, 420]], 6, 12); b = await estado(); await pausa(900); c = await estado();
ok(lejos(b, c) > 15, 'soltando con impulso, sigue un poco', `${Math.round(lejos(b, c))} m más`);
await pausa(1500); const d = await estado(); await pausa(400); ok(lejos(d, await estado()) < 0.5, 'y se frena');

// dos dedos que se separan: acerca, sin girar
a = await estado(); await gesto([[170, 400], [230, 400]], [[110, 395], [290, 408]]); await pausa(700); b = await estado();
ok(b.dist < a.dist * 0.6, 'dos dedos que se separan acercan', `${a.dist} → ${b.dist} m`); ok(b.yaw === a.yaw, 'sin girar el plano (el pellizco venía un poco torcido)');

// dos dedos que giran de verdad: gira
a = await estado(); await gesto([[130, 400], [260, 400]], [[150, 340], [240, 460]], 14); await pausa(600); b = await estado();
ok(Math.abs(b.yaw - a.yaw) > 0.3, 'dos dedos que giran, giran el plano', `${(b.yaw - a.yaw).toFixed(2)} rad`);

// dos dedos juntos hacia arriba o abajo: inclina, sin mover ni acercar
a = await estado(); await gesto([[150, 500], [240, 500]], [[150, 400], [240, 400]], 12); await pausa(600); b = await estado();
ok(Math.abs(b.pitch - a.pitch) > 0.15, 'dos dedos que suben juntos inclinan', `${a.pitch} → ${b.pitch}`); ok(Math.abs(b.dist - a.dist) < a.dist * 0.03 && Math.abs(b.yaw - a.yaw) < 0.01, 'sin acercar ni girar');

// dos dedos que se corren juntos de costado: mueven
a = await estado(); await gesto([[150, 300], [150, 420]], [[250, 300], [250, 420]], 10); await pausa(600); b = await estado();
ok(lejos(a, b) > 15 && Math.abs(b.dist - a.dist) < a.dist * 0.03, 'dos dedos que se corren juntos mueven el plano', `${Math.round(lejos(a, b))} m`);

// dos toques seguidos: acerca
a = await estado(); await page.touchscreen.tap(195, 360); await pausa(90); await page.touchscreen.tap(195, 360); await pausa(900); b = await estado();
ok(b.dist < a.dist * 0.62, 'dos toques acercan', `${a.dist} → ${b.dist} m`);
ok(!(await page.locator('#ficha.ver').count()), 'y no abren una ficha por el camino');

// dos toques y arrastrar: un solo dedo acerca (abajo) o aleja (arriba)
a = await estado(); await page.touchscreen.tap(195, 360); await pausa(90); await gesto([[195, 360]], [[195, 240]], 10); await pausa(700); b = await estado();
ok(b.dist > a.dist * 1.8, 'dos toques y arrastrar hacia arriba aleja', `${a.dist} → ${b.dist} m`);

// un toque con dos dedos: aleja
a = await estado(); await toque('touchStart', [[150, 400], [250, 400]]); await pausa(70); await toque('touchEnd', []); await pausa(800); b = await estado();
ok(b.dist > a.dist * 1.7, 'un toque con dos dedos aleja', `${a.dist} → ${b.dist} m`);
await page.screenshot({ path: 'shots/tactil.png' });

// arrastrar empezando arriba de una etiqueta: el plano se mueve igual (la etiqueta no ataja el dedo)
await page.evaluate(() => { lab.cam.jump({ x: 0, z: 0, dist: 900, yaw: -0.5, pitch: 0.52 }); }); await pausa(900);
const tag = page.locator('.marca.ver .tag').first();
if (await tag.count()) {
  const r = await tag.boundingBox(), x = r.x + r.width / 2, y = r.y + r.height / 2;
  a = await estado(); await toque('touchStart', [[x, y]]); for (let i = 1; i <= 8; i++) { await toque('touchMove', [[x + i * 9, y + i * 6]]); await pausa(16); } await pausa(160); await toque('touchEnd', []); await pausa(400); b = await estado();
  ok(lejos(a, b) > 15, 'arrastrar desde arriba de una etiqueta mueve el plano', `${Math.round(lejos(a, b))} m  (${await tag.textContent()} en ${Math.round(x)},${Math.round(y)})`);
  ok(!(await page.locator('#ficha.ver').count()), 'y no la abre');
  // y un toque sobre la etiqueta sí la abre
  const r2 = await tag.boundingBox(); await page.touchscreen.tap(r2.x + r2.width / 2, r2.y + r2.height / 2); await pausa(1200);
  ok(await page.locator('#ficha.ver').count(), 'un toque sobre la etiqueta abre su ficha', await page.locator('#ficha h2').textContent());
  await page.tap('#ficha .x'); await pausa(3200);
} else ok(false, 'no hay ninguna etiqueta a la vista para probar');

// quieta, la página no dibuja
await pausa(1500); const c0 = await page.evaluate(() => lab.cuenta.cuadros); await pausa(3000); const c1 = await page.evaluate(() => lab.cuenta.cuadros);
ok(c1 - c0 <= 2, 'con la vista quieta no se dibuja', `${c1 - c0} cuadros en 3 s`);
await toque('touchStart', [[200, 500]]); for (let i = 1; i <= 20; i++) { await toque('touchMove', [[200 - i * 4, 500]]); await pausa(16); } await toque('touchEnd', []);
const c2 = await page.evaluate(() => lab.cuenta.cuadros); ok(c2 - c1 >= 12, 'y al mover, sí', `${c2 - c1} cuadros`);

// el botón
const antes = await page.evaluate(() => document.getElementById('alzar').textContent);
await page.tap('#alzar'); await pausa(2500);
console.log('botón', antes, '→', await page.evaluate(() => ({ frente: Math.round(lab.tinta.U.uFront.value), boton: document.getElementById('alzar').textContent, puntos: lab.cuenta.puntos })));
console.log(errores.length ? errores.join('\n') : 'sin errores');
console.log(fallas ? `\n${fallas} FALLAS` : '\ntodo bien');
await browser.close(); if (server) await new Promise((r) => server.httpServer.close(r));
process.exit(fallas ? 1 : 0);
