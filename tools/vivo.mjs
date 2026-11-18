// Prueba en vivo, con el reloj de verdad: la presentación, los cuadros por segundo, una marca, la rueda, el arrastre y
// el botón.   node tools/vivo.mjs [--size 1440x900] [--dpr 2] [--url http://localhost:4173/]
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { mkdirSync } from 'node:fs';
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : process.argv[i + 1]; };
const [W, H] = arg('size', '1440x900').split('x').map(Number), dpr = +arg('dpr', 2);
let server = null, url = arg('url', null);
if (!url) { server = await createServer({ server: { port: 5432 }, logLevel: 'error' }); await server.listen(); url = 'http://localhost:5432/'; }
const browser = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--ignore-gpu-blocklist', '--use-angle=metal', '--enable-gpu'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: dpr });
const errores = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errores.push('[' + m.type() + '] ' + m.text().slice(0, 300)); });
page.on('pageerror', (e) => errores.push('[pageerror] ' + e.message));
page.on('requestfailed', (r) => errores.push('[red] ' + r.url()));
mkdirSync('shots', { recursive: true });
const t0 = Date.now();
await page.goto(url);
await page.waitForFunction(() => window.lab?.ready, null, { timeout: 120000 });
console.log('lista en', Date.now() - t0, 'ms');
// el cartel de entrada: tiene que estar, tapar la vista y frenar el espacio; se cierra con su botón
if (await page.locator('#intro.ver').count()) {
  await page.waitForTimeout(700); await page.screenshot({ path: 'shots/vivo-intro.png' });
  await page.keyboard.press('KeyH'); await page.waitForTimeout(2200);
  console.log('cartel abierto · frente', Math.round(await page.evaluate(() => lab.tinta.U.uFront.value)), '(tiene que seguir en -400) · hoy:', await page.textContent('#hoy'));
  await page.click('#intro .entrar'); await page.waitForTimeout(600);
  console.log('cartel cerrado:', (await page.locator('#intro.ver').count()) === 0);
}
await page.evaluate(() => { window.__f = 0; const tick = () => { window.__f++; requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
const fps = async (ms) => { const a = await page.evaluate(() => window.__f); await page.waitForTimeout(ms); return (((await page.evaluate(() => window.__f)) - a) / ms * 1000).toFixed(0); };
const cam = () => page.evaluate(() => ({ x: Math.round(lab.cam.now.x), z: Math.round(lab.cam.now.z), dist: Math.round(lab.cam.now.dist), yaw: +lab.cam.now.yaw.toFixed(2), pitch: +lab.cam.now.pitch.toFixed(2), frente: Math.round(lab.tinta.U.uFront.value) }));
for (let i = 0; i < 5; i++) { const f = await fps(1500); if (i === 1 || i === 4) await page.screenshot({ path: `shots/vivo-${i}.png` }); console.log(`t=${((Date.now() - t0) / 1000).toFixed(1)}s  ${f} fps`, await cam()); }
// una marca: tocar "Cabildo"
const marca = page.locator('.marca.ver .tag', { hasText: 'Cabildo' });
console.log('marcas a la vista:', await page.locator('.marca.ver').count());
await marca.click(); await page.waitForTimeout(3200);
console.log('en el Cabildo:', await cam(), '| nota:', await page.locator('.marca.abierta i').textContent());
await page.screenshot({ path: 'shots/vivo-marca.png' });
// la rueda, el arrastre y el giro
await page.mouse.move(W / 2, H / 2 + 80);
for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, -240); await page.waitForTimeout(60); }
console.log('acercando:', await fps(1200), 'fps', await cam());
await page.mouse.down(); await page.mouse.move(W / 2 - 240, H / 2 + 140, { steps: 12 }); await page.mouse.up();
await page.mouse.down({ button: 'right' }); await page.mouse.move(W / 2 - 60, H / 2 + 40, { steps: 12 }); await page.mouse.up({ button: 'right' });
console.log('arrastre y giro:', await fps(1000), 'fps', await cam());
// el botón: volver al plano y otra vez arriba
await page.click('#alzar'); await page.waitForTimeout(2500);
console.log('abajo:', (await cam()).frente, await page.textContent('#alzar'));
await page.keyboard.press('Space'); await page.waitForTimeout(3500);
console.log('arriba:', (await cam()).frente, await page.textContent('#alzar'));
console.log(errores.length ? errores.join('\n') : 'sin errores en la consola');
await browser.close(); await server?.close();
