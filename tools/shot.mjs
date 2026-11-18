// Capturas sin ventana: node tools/shot.mjs [--puerto 5431] --name centro --ver '{"x":0,"z":0,"dist":900,"yaw":-0.5,"pitch":0.5}' [--frente 9500] [--size 1600x900] [--query chico]   (en --serie, cada toma puede traer "año": 1888, 1895, 1905, 1910, 1921 o 1940, para la línea de tiempo)
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { mkdirSync } from 'node:fs';
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : process.argv[i + 1]; };
const [W, H] = arg('size', '1600x900').split('x').map(Number);
const PUERTO = +arg('puerto', 5431); // (cada uno que saque capturas a la vez, con su puerto)
const server = await createServer({ server: { port: PUERTO, strictPort: true }, logLevel: 'error' }); await server.listen();
const browser = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--ignore-gpu-blocklist', '--use-angle=metal', '--enable-gpu'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[' + m.type() + ']', m.text().slice(0, 600)); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`http://localhost:${PUERTO}/?capture&${arg('query', '')}`);
await page.waitForFunction(() => window.lab?.ready, null, { timeout: 120000 });
mkdirSync('shots', { recursive: true });
const shots = JSON.parse(arg('serie', 'null')) ?? [{ name: arg('name', 'shot'), ver: JSON.parse(arg('ver', 'null')), frente: +arg('frente', 9500) }];
for (const s of shots) {
  await page.evaluate(async ({ ver, frente, rapido, año }) => { if (ver) lab.ver(ver); lab.frente(frente ?? 9500); if (año) lab.epocas.elegir(año); if (!rapido) await lab.finas(); lab.step(0, 2); }, { ...s, rapido: process.argv.includes('--rapido') });
  await page.waitForTimeout(450); // (las marcas aparecen y se van con una transición)
  await page.screenshot({ path: `shots/${s.name}.png` });
  console.log('shots/' + s.name + '.png');
}
if (process.argv.includes('--tiempos')) console.log(await page.evaluate(() => { const t = performance.now(); for (let i = 0; i < 30; i++) lab.step(0); lab.renderer.getContext().finish(); return { ms: (performance.now() - t) / 30, info: lab.renderer.info.render, cuenta: lab.ciudad.cuenta }; }));
await browser.close(); await server.close();
