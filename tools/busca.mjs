// Prueba del buscador de direcciones, de punta a punta y con la red de verdad (USIG y Nominatim): escribe cada
// dirección en la caja, espera la respuesta y saca una captura.   node tools/busca.mjs [--size 1440x900] [--movil]
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { mkdirSync } from 'node:fs';
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : process.argv[i + 1]; };
const movil = process.argv.includes('--movil'), [W, H] = movil ? [390, 844] : arg('size', '1440x900').split('x').map(Number);
const CASOS = [
  ['altura', 'Corrientes 1234'], ['esquina', 'callao y santa fe'], ['lugar', 'Teatro Colón'], ['rio', 'Juana Manso 500'],
  ['persona', 'peron 1500'], ['boca', 'Brandsen 805'], ['fuera', 'Rivadavia 9000'], ['nada', 'zzzqqq 99999'],
];
const server = await createServer({ server: { port: 5433 }, logLevel: 'error' }); await server.listen();
const browser = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--ignore-gpu-blocklist', '--use-angle=metal', '--enable-gpu'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: movil ? 2 : 1, hasTouch: movil, isMobile: movil });
const errores = [];
page.on('console', (m) => { if (m.type() === 'error') errores.push('[error] ' + m.text().slice(0, 300)); });
page.on('pageerror', (e) => errores.push('[pageerror] ' + e.message));
mkdirSync('shots', { recursive: true });
await page.goto('http://localhost:5433/?sinintro&plano');
await page.waitForFunction(() => window.lab?.ready, null, { timeout: 120000 });
await page.waitForTimeout(1500);
for (const [nombre, texto] of (movil ? CASOS.slice(0, 2).concat([CASOS[6]]) : CASOS)) {
  await page.fill('#buscar input', texto);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.getElementById('buscar').classList.contains('espera'), null, { timeout: 30000 });
  await page.waitForTimeout(4200); // (el vuelo, las láminas de hoy y los nombres)
  const r = await page.evaluate(() => ({
    marca: document.querySelector('.marca.buscada')?.innerText.replace(/\n+/g, ' | ') ?? null, msg: document.getElementById('buscar-msg').classList.contains('ver') ? document.getElementById('buscar-msg').innerText.replace(/\n+/g, ' | ') : null,
    hoy: document.body.classList.contains('hoy'), cam: [Math.round(lab.cam.now.x), Math.round(lab.cam.now.z), Math.round(lab.cam.now.dist)],
  }));
  console.log(`${texto.padEnd(22)} → ${JSON.stringify(r)}`);
  await page.screenshot({ path: `shots/q-${movil ? 'movil-' : ''}${nombre}.png` });
  await page.waitForTimeout(1200); // (sin apurar a los servicios)
}
// escribir en la caja no dispara los atajos; la × borra la marca
const antes = await page.evaluate(() => [document.getElementById('alzar').textContent, document.body.classList.contains('hoy')]);
await page.click('#buscar input'); await page.keyboard.type('h h '); await page.waitForTimeout(600);
const despues = await page.evaluate(() => [document.getElementById('alzar').textContent, document.body.classList.contains('hoy')]);
console.log('atajos mientras se escribe:', JSON.stringify(antes) === JSON.stringify(despues) ? 'no se disparan' : `¡SE DISPARAN! ${antes} → ${despues}`);
await page.fill('#buscar input', 'Florida 100'); await page.keyboard.press('Enter');
await page.waitForFunction(() => document.querySelector('.marca.buscada'), null, { timeout: 30000 }).catch(() => {});
await page.click('#buscar .x'); await page.waitForTimeout(300);
console.log('tras la ×: marca', await page.locator('.marca.buscada').count(), '· caja «' + (await page.inputValue('#buscar input')) + '»');
console.log(errores.length ? errores.join('\n') : 'sin errores en la consola');
await browser.close(); await server.close();
