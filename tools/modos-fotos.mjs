// Capturas de los modos (a pie y en avión) en varias pantallas, para mirarlas: shots/mf-*.png   node tools/modos-fotos.mjs
import { chromium } from 'playwright-core';
import { preview } from 'vite';
const server = await preview({ preview: { port: 4180 }, logLevel: 'error' }), url = 'http://localhost:4180/';
const browser = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--ignore-gpu-blocklist', '--use-angle=metal', '--enable-gpu'] });
async function abrir(opts) {
  const page = await browser.newPage(opts);
  page.on('pageerror', (e) => console.log('ERROR', e.message));
  await page.goto(url + '?sinintro'); await page.waitForFunction(() => window.lab?.ready, null, { timeout: 120000 }); await page.waitForTimeout(7500);
  return page;
}
/** Pararse a `dn` metros al norte y `de` al este de un lugar, mirándolo. */
const frenteA = (page, nombre, dn, de) => page.evaluate(([nombre, dn, de]) => {
  const m = lab.marcas.marcas.find((m) => m.el.querySelector('b').textContent === nombre), p = lab.modos.pie;
  p.x = m.x + dn; p.z = m.z + de; p.h = Math.atan2(-dn, -de); p.p = 0.12; lab.step?.();
  return lab.modos.edificado(p.x, p.z);
}, [nombre, dn, de]);
{
  const page = await abrir({ viewport: { width: 1000, height: 700 }, deviceScaleFactor: 1 });
  await page.screenshot({ path: 'shots/mf-mapa-1000.png' });
  await page.click('#caminar'); await page.waitForTimeout(1500);
  for (const [n, dn, de] of [['Cabildo', 10, 75], ['Catedral', -70, 30], ['Recova Vieja', 5, -60], ['San Ignacio', 0, 45], ['Aduana Nueva', 0, -120]]) {
    const adentro = await frenteA(page, n, dn, de); await page.mouse.move(500, 300); await page.mouse.down(); await page.mouse.move(501, 300); await page.mouse.up(); await page.waitForTimeout(1800);
    console.log(n, adentro ? '(adentro de algo)' : '', await page.evaluate(() => document.getElementById('modo-info').children[1].textContent));
    await page.screenshot({ path: `shots/mf-pie-${n.replace(/ /g, '-')}.png` });
  }
  await page.click('#hoy'); await page.waitForTimeout(2500); await page.screenshot({ path: 'shots/mf-pie-hoy.png' });
  console.log('hoy:', await page.evaluate(() => document.getElementById('modo-info').children[1].textContent));
  await page.close();
}
{
  const page = await abrir({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
  await page.screenshot({ path: 'shots/mf-acostado-mapa.png' });
  await page.tap('#caminar'); await page.waitForTimeout(2500); await page.screenshot({ path: 'shots/mf-acostado-pie.png' });
  await page.tap('#volar'); await page.waitForTimeout(3000); await page.screenshot({ path: 'shots/mf-acostado-avion.png' });
  await page.close();
}
{
  const page = await abrir({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
  await page.tap('#caminar'); await page.waitForTimeout(2000); await page.tap('#hoy'); await page.waitForTimeout(2500); await page.screenshot({ path: 'shots/mf-tel-pie-hoy.png' });
  await page.tap('#volar'); await page.waitForTimeout(3000); await page.screenshot({ path: 'shots/mf-tel-avion-hoy.png' });
  await page.close();
}
await browser.close(); await new Promise((r) => server.httpServer.close(r));
