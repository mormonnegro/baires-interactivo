// El tren, en capturas: node tools/tren.mjs --name tren --t 120 [--ver '{"dist":300,"yaw":-0.5,"pitch":0.5}'] [--query "limpio&color"] [--size 1600x900]
// Pone el reloj del tren en --t segundos y la cámara sobre él (salvo que --ver traiga x y z).
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { mkdirSync } from 'node:fs';
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : process.argv[i + 1]; };
const [W, H] = arg('size', '1600x900').split('x').map(Number);
const server = await createServer({ server: { port: 5437 }, logLevel: 'error' }); await server.listen();
const browser = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--ignore-gpu-blocklist', '--use-angle=metal', '--enable-gpu'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[' + m.type() + ']', m.text().slice(0, 600)); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`http://localhost:5437/?capture&${arg('query', 'limpio')}`);
await page.waitForFunction(() => window.lab?.ready, null, { timeout: 120000 });
mkdirSync('shots', { recursive: true });
const lugar = await page.evaluate(async ({ t, ver, frente }) => {
  lab.tren.tiempo = t; lab.frente(frente); lab.step(0);
  const l = lab.tren.lugar; lab.ver({ x: l.x, z: l.z, dist: 300, yaw: -0.5, pitch: 0.5, ...ver });
  await lab.finas(); lab.step(0, 2);
  return { ...l, ciclo: lab.tren.ciclo, viaje: lab.tren.viaje, largo: lab.tren.largo };
}, { t: +arg('t', 60), ver: JSON.parse(arg('ver', '{}')), frente: +arg('frente', 9500) });
console.log(lugar);
await page.screenshot({ path: `shots/${arg('name', 'tren')}.png` });
console.log('shots/' + arg('name', 'tren') + '.png');
await browser.close(); await server.close();
