// Cómo se ve y se usa en un teléfono: saca capturas de cada estado (shots/<pre>-*.png) y mide los blancos táctiles.
//   node tools/telefono.mjs [--url https://…] [--pre tel] [--size 390x844]
import { chromium } from 'playwright-core';
import { preview } from 'vite';
import { mkdirSync } from 'node:fs';
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : process.argv[i + 1]; };
const pre = arg('pre', 'tel'), [W, H] = arg('size', '390x844').split('x').map(Number);
let server = null, url = arg('url', null);
if (!url) { server = await preview({ preview: { port: 4176 }, logLevel: 'error' }); url = 'http://localhost:4176/'; }
const browser = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--ignore-gpu-blocklist', '--use-angle=metal', '--enable-gpu'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
const errores = []; page.on('pageerror', (e) => errores.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text().slice(0, 200)); });
mkdirSync('shots', { recursive: true });
const foto = (n) => page.screenshot({ path: `shots/${pre}-${n}.png` });
/** Los blancos táctiles a la vista: cuáles miden menos de 44 px en algún lado. */
const blancos = (donde) => page.evaluate((donde) => {
  const out = [];
  for (const e of document.querySelectorAll('button, a, input, [role=button], #titulo')) {
    const r = e.getBoundingClientRect(), s = getComputedStyle(e);
    if (e.closest('.marca') && !e.closest('.marca.ver')) continue;
    // (las etiquetas de las marcas no atajan el toque: lo resuelve el lienzo, con 9 px de aire y el hilo y el punto de abajo)
    const marca = e.closest('.marca') && s.pointerEvents === 'none';
    if (!r.width || s.visibility === 'hidden' || +s.opacity === 0 || (s.pointerEvents === 'none' && !marca)) continue;
    if (e.closest('#intro:not(.ver)') || e.closest('#ficha:not(.ver)') || e.closest('#visor:not(.ver)') || e.closest('#buscar-msg:not(.ver)')) continue;
    // (lo que cuenta es dónde llega el dedo: el blanco puede ser más grande que lo dibujado, con ::after)
    const a = getComputedStyle(e, '::after'), extra = a.content !== 'none' && a.position === 'absolute' ? [-parseFloat(a.left) || 0, -parseFloat(a.top) || 0, -parseFloat(a.right) || 0, -parseFloat(a.bottom) || 0] : [0, 0, 0, 0];
    const w = r.width + extra[0] + extra[2] + (marca ? 18 : 0), h = r.height + extra[1] + extra[3] + (marca ? 9 + 26 + 9 : 0);
    if (w < 43.5 || h < 43.5) out.push(`${(e.id ? '#' + e.id : e.className || e.tagName).toString().slice(0, 18)} «${(e.textContent || e.placeholder || '').trim().slice(0, 22)}» ${Math.round(w)}×${Math.round(h)}`);
  }
  return { donde, chicos: out };
}, donde);
const informe = (b) => console.log(`${b.donde}: ${b.chicos.length ? b.chicos.length + ' blancos de menos de 44 px\n   ' + [...new Set(b.chicos)].slice(0, 14).join('\n   ') : 'todos los blancos miden 44 px o más'}`);

await page.goto(url);
await page.waitForFunction(() => window.lab?.ready, null, { timeout: 180000 });
await page.waitForTimeout(800); await foto('1-cartel'); informe(await blancos('cartel'));
await page.tap('#intro .entrar'); await page.waitForTimeout(9000);
await foto('2-ciudad'); informe(await blancos('ciudad'));
// acercarse al centro: las marcas de los edificios
await page.evaluate(() => { const c = lab.cam; c.flyTo({ x: 0, z: 0, dist: 900 }, 0.6); }); await page.waitForTimeout(2500);
await foto('3-centro'); informe(await blancos('centro'));
// una ficha
const tag = page.locator('.marca.ver .tag', { hasText: 'Cabildo' }).first();
if (await tag.count()) { const b = await tag.boundingBox(); await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(3500); await foto('4-ficha'); informe(await blancos('ficha')); await page.locator('#ficha .x').tap(); await page.waitForTimeout(600); }
// lo de hoy
await page.tap('#hoy'); await page.waitForTimeout(4000); await foto('5-hoy'); informe(await blancos('hoy'));
// el buscador (con el teclado no se puede probar acá: solo cómo queda el campo con foco)
await page.tap('#buscar input'); await page.keyboard.type('Corrientes 1234'); await page.waitForTimeout(400); await foto('6-buscar'); informe(await blancos('buscar'));
// acostado
await page.setViewportSize({ width: H, height: W }); await page.waitForTimeout(1500); await foto('7-acostado'); informe(await blancos('acostado'));
// ¿se desborda algo? (nada debería pasarse del ancho de la pantalla)
console.log('desborde:', await page.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width && s.visibility !== 'hidden' && +s.opacity > 0 && !e.closest('#marcas') && (r.right > innerWidth + 1 || r.left < -1); }).map((e) => e.id || e.className).slice(0, 8)));
console.log(errores.length ? errores.join('\n') : 'sin errores');
await browser.close(); if (server) await new Promise((r) => server.httpServer.close(r));
