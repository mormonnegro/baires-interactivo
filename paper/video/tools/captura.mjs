// Cuadros del visor para el video: una cámara que parte cenital sobre una manzana (calzada con el plano), se inclina
// y después gira despacio. Solo lee del repo: levanta el mismo servidor de desarrollo que tools/shot.mjs (puerto 5461)
// y saca capturas con ?capture. Deja JPG en el directorio que se le pasa (fuera del repo).
//   CHROME=… node paper/video/tools/captura.mjs <dir de salida> tinta|color <t0> <t1>
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , DIR, MODO, T0, T1] = process.argv, FPS = 30, PUERTO = 5461;
process.chdir(fileURLToPath(new URL('../../../', import.meta.url)));
const suave = (u) => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
const g = (t) => (t < 4 ? 0 : t < 7 ? ((t - 4) * (t - 4)) / 6 : t - 5.5); // el giro arranca sin tirón
/** la cámara en el segundo t (la misma para tinta y para color) */
export const camara = (t) => { const u = suave(t / 6); return { x: -249, z: -7, pitch: 1.55 + (0.62 - 1.55) * u, yaw: -0.45 * u - 0.05 * g(t), dist: 420 + 40 * u - 4 * g(t) }; };

mkdirSync(DIR, { recursive: true });
const server = await createServer({ server: { port: PUERTO, strictPort: true }, logLevel: 'error' }); await server.listen();
const browser = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--ignore-gpu-blocklist', '--use-angle=metal', '--enable-gpu'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1340 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`http://localhost:${PUERTO}/?capture&${MODO === 'color' ? 'color' : ''}`);
await page.waitForFunction(() => window.lab?.ready, null, { timeout: 120000 });
await page.addStyleTag({ content: '#marcas { display: none !important; }' }); // (los rótulos entran y salen con transiciones de reloj real)
const n0 = Math.round(+T0 * FPS), n1 = Math.round(+T1 * FPS), ini = Date.now();
for (let n = n0; n <= n1; n++) {
  await page.evaluate(async ({ ver, primero }) => { lab.ver(ver); lab.frente(9500); if (primero) lab.epocas.elegir(1867); await lab.finas(); lab.step(1 / 60, 2); }, { ver: camara(n / FPS), primero: n === n0 });
  if (n === n0) await page.waitForTimeout(600);
  await page.screenshot({ path: join(DIR, `${MODO}-${String(n).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 95 });
  if ((n - n0) % 30 === 0) console.log(`${MODO} ${n - n0}/${n1 - n0} · ${((Date.now() - ini) / 1000).toFixed(0)} s`);
}
await browser.close(); await server.close();
