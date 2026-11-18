// Prueba de carga como en un teléfono: red y procesador frenados, y se anota cuánto tarda y cuánto pesa cada etapa.
//   node tools/carga.mjs [--url https://…] [--red 4g|4g-lenta|3g|sin] [--cpu 4] [--espera 20] [--entrar]
// Sin --url, sirve dist/ (hay que construir antes). Los bytes son los que viajan (comprimidos), según el navegador.
import { chromium } from 'playwright-core';
import { preview } from 'vite';
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : process.argv[i + 1]; };
const REDES = { '4g': [9000, 3000, 85], '4g-lenta': [1600, 750, 150], '3g': [700, 300, 300], sin: null }; // kbit/s bajada, subida, ms de latencia
const red = arg('red', '4g'), cpu = +arg('cpu', 4), espera = +arg('espera', 20);
let server = null, url = arg('url', null);
if (!url) { server = await preview({ preview: { port: 4175 }, logLevel: 'error' }); url = 'http://localhost:4175/'; }
const browser = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--ignore-gpu-blocklist', '--use-angle=metal', '--enable-gpu'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
const cdp = await page.context().newCDPSession(page);
await cdp.send('Network.enable');
if (REDES[red]) await cdp.send('Network.emulateNetworkConditions', { offline: false, downloadThroughput: (REDES[red][0] * 1000) / 8, uploadThroughput: (REDES[red][1] * 1000) / 8, latency: REDES[red][2] });
if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
const pedidos = new Map(); let bytes = 0, n = 0;
cdp.on('Network.requestWillBeSent', (e) => pedidos.set(e.requestId, { url: e.request.url, t: e.timestamp }));
cdp.on('Network.loadingFinished', (e) => { const p = pedidos.get(e.requestId); if (p) { p.bytes = e.encodedDataLength; p.fin = e.timestamp; bytes += e.encodedDataLength; n++; } });
const errores = []; page.on('pageerror', (e) => errores.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text().slice(0, 200)); });
const MB = (b) => (b / 1e6).toFixed(2) + ' MB';
const t0 = Date.now(), seg = () => ((Date.now() - t0) / 1000).toFixed(1) + ' s';
console.log(`${url}  ·  red ${red}  ·  procesador ÷${cpu}`);
await page.goto(url, { waitUntil: 'commit' });
await page.waitForSelector('#intro.ver', { timeout: 180000 }).catch(() => {});
console.log('cartel de entrada a la vista  ', seg().padStart(7), MB(bytes).padStart(9), `${n} archivos`);
await page.waitForFunction(() => document.body.classList.contains('listo'), null, { timeout: 180000 });
console.log('el plano a la vista           ', seg().padStart(7), MB(bytes).padStart(9), `${n} archivos`);
await page.waitForFunction(() => window.lab?.ready, null, { timeout: 180000 });
console.log('la ciudad lista para levantar ', seg().padStart(7), MB(bytes).padStart(9), `${n} archivos`);
// --entrar: como alguien que cierra el cartel y mira cómo se levanta la ciudad (ahí se piden las láminas finas del centro)
const entrar = process.argv.includes('--entrar');
if (entrar && (await page.locator('#intro.ver').count())) await page.tap('#intro .entrar');
await page.waitForTimeout(espera * 1000);
console.log((entrar ? `${espera} s después de entrar` : `a los ${espera} s de quieto`).padEnd(30), seg().padStart(7), MB(bytes).padStart(9), `${n} archivos`);
const lista = [...pedidos.values()].filter((p) => p.bytes > 30000).sort((a, b) => b.bytes - a.bytes).slice(0, 12);
for (const p of lista) console.log('   ', MB(p.bytes).padStart(8), new URL(p.url).pathname + new URL(p.url).search.slice(0, 12));
console.log(errores.length ? errores.join('\n') : 'sin errores');
await browser.close(); if (server) await new Promise((r) => server.httpServer.close(r));
