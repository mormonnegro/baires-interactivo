// Cuánto cuesta dibujar, como en un teléfono: pantalla de 390 × 844 a 3 puntos por píxel, procesador frenado, sobre lo
// ya construido (dist/: hay que correr `npx vite build` antes). De varias vistas, en 1867 y en 1940, anota cuántas
// llamadas de dibujo y cuántos triángulos lleva un cuadro (con sombras y todo), cuánto tarda y a cuántos cuadros por
// segundo se mueve la cámara; y además, cuánto tarda en llegar la ciudad y en armarse la línea de tiempo.
//   node tools/ritmo.mjs [--url https://…] [--puerto 5457] [--cpu 4] [--escritorio] [--entera] [--query liviano] [--json salida.json]
// (--entera: con las mallas de una pieza, sin partir en trozos —src/trozos.js—, para comparar)
// Ojo con lo que dice y lo que no: el procesador se frena de verdad (÷4), pero la placa de video es la de esta
// máquina, mucho más rápida que la de un teléfono. Los triángulos y las llamadas valen igual en cualquier equipo; los
// milisegundos sirven para comparar un antes y un después, no para saber cuánto tarda un teléfono de verdad.
import { chromium } from 'playwright-core';
import { preview } from 'vite';
import { writeFileSync } from 'node:fs';
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : process.argv[i + 1]; };
const cpu = +arg('cpu', 4), escritorio = process.argv.includes('--escritorio');
let server = null, url = arg('url', null);
if (!url) { const puerto = +arg('puerto', 5457); server = await preview({ preview: { port: puerto, strictPort: true }, logLevel: 'error' }); url = `http://localhost:${puerto}/`; }
const browser = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--ignore-gpu-blocklist', '--use-angle=metal', '--enable-gpu'] });
const page = await browser.newPage(escritorio ? { viewport: { width: 1500, height: 900 } } : { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
const errores = []; page.on('pageerror', (e) => errores.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text().slice(0, 200)); });
const cdp = await page.context().newCDPSession(page);
if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
const salida = { url, cpu, pantalla: escritorio ? 'escritorio 1500×900' : 'teléfono 390×844 ×3', vistas: [] };

const t0 = Date.now();
await page.goto(url + '?sinintro&plano&color' + (process.argv.includes('--entera') ? '&entera' : '') + (arg('query', null) ? '&' + arg('query') : ''), { waitUntil: 'commit' });
await page.waitForFunction(() => document.body.classList.contains('listo'), null, { timeout: 180000 }); salida.plano_s = (Date.now() - t0) / 1000;
await page.waitForFunction(() => window.lab?.ready, null, { timeout: 180000 }); salida.ciudad_s = (Date.now() - t0) / 1000;
Object.assign(salida, await page.evaluate(() => ({ liviano: lab.liviano, puntos: lab.cuenta.puntos, lienzo: [lab.renderer.domElement.width, lab.renderer.domElement.height], sombra: lab.renderer.shadowMap.enabled ? lab.scene.children.find((o) => o.isDirectionalLight)?.shadow.mapSize.x : 0 })));
await page.evaluate(async () => { lab.levantar(true); lab.frente(9500); await lab.finas(); lab.step(0, 3); });

const VISTAS = {
  'el pliego entero': null,
  'media ciudad, de lejos': { x: 500, z: -1500, dist: 4500, yaw: -0.3, pitch: 0.6 },
  'la ciudad (como se llega)': { x: 60, z: -260, dist: 1500, yaw: -0.5, pitch: 0.52 },
  'el centro, de cerca': { x: 600, z: -300, dist: 420, yaw: 0.6, pitch: 0.7 },
  'Palermo': { x: 4300, z: -2900, dist: 900, yaw: 0.3, pitch: 0.6 },
};
/** Un cuadro de esa vista: llamadas, triángulos y milisegundos (el promedio de 20, esperando a la placa cada vez). */
const medir = (ver) => page.evaluate(async (ver) => {
  lab.ver(ver ?? lab.ENTERO); await lab.finas(); lab.step(0, 3);
  const r = lab.renderer, gl = r.getContext(), px = new Uint8Array(4); r.info.autoReset = false; r.info.reset(); lab.step(0);
  const calls = r.info.render.calls, tris = r.info.render.triangles; r.info.autoReset = true;
  // (leer un punto obliga a terminar el cuadro: gl.finish() solo no espera en todas las placas)
  const fin = () => { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); };
  fin(); const N = 20, t = performance.now(); for (let i = 0; i < N; i++) { lab.step(0); fin(); }
  return { calls, tris, ms: (performance.now() - t) / N };
}, ver);
/** Cuadros por segundo con la cámara girando despacio alrededor de lo que se mira, 3 segundos, con el reloj de verdad. */
const mover = (ver) => page.evaluate(async (ver) => {
  lab.ver(ver ?? lab.ENTERO); await new Promise((r) => setTimeout(r, 300));
  const c0 = lab.cuenta.cuadros, t = performance.now(), yaw = lab.cam.goal.yaw; let peor = 0, ant = t;
  await new Promise((fin) => { const paso = () => { const now = performance.now(); peor = Math.max(peor, now - ant); ant = now; if (now - t > 3000) return fin(); lab.cam.jump({ ...lab.cam.goal, yaw: yaw + ((now - t) / 3000) * 0.5 }); requestAnimationFrame(paso); }; requestAnimationFrame(paso); });
  return { fps: ((lab.cuenta.cuadros - c0) * 1000) / (performance.now() - t), peor, puntos: lab.cuenta.puntos };
}, ver);

for (const año of [1867, 1940]) {
  if (año !== 1867) {
    // la primera vez que se sale de 1867: baja crece.pak y arma la malla de lo que crece (el tirón más largo de la página)
    const t = Date.now(); await page.evaluate(async (a) => { lab.epocas.elegir(a); await lab.epocas.lista_(); }, año); salida.epocas_s = (Date.now() - t) / 1000;
    await page.evaluate(() => { for (let i = 0; i < 400; i++) lab.step(0.1); }); // (que termine de avanzar la línea de tiempo)
  }
  for (const [nombre, ver] of Object.entries(VISTAS)) {
    const m = await medir(ver), f = await mover(ver);
    salida.vistas.push({ año, nombre, ...m, ...f });
    console.log(`${año}  ${nombre.padEnd(26)} ${String(m.calls).padStart(5)} llamadas ${(m.tris / 1e6).toFixed(2).padStart(6)} M de triángulos ${m.ms.toFixed(1).padStart(6)} ms por cuadro ${f.fps.toFixed(0).padStart(4)} cuadros/s (el peor, ${f.peor.toFixed(0)} ms; dibujo a ×${f.puntos.toFixed(2)})`);
  }
}
salida.armado_ms = await page.evaluate(() => lab.tiempos ?? null);
salida.memoria = await page.evaluate(() => ({ geometrias: lab.renderer.info.memory.geometries, texturas: lab.renderer.info.memory.textures, js_MB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null }));
console.log(`${salida.pantalla} · procesador ÷${cpu} · liviano: ${salida.liviano} · lienzo ${salida.lienzo.join('×')} · sombras de ${salida.sombra}`);
console.log(`el plano a la vista: ${salida.plano_s.toFixed(1)} s · la ciudad lista: ${salida.ciudad_s.toFixed(1)} s · salir de 1867 la primera vez: ${salida.epocas_s?.toFixed(1)} s · memoria de JS: ${salida.memoria.js_MB} MB · geometrías ${salida.memoria.geometrias}`);
console.log('armar las mallas (ms, con el procesador frenado):', JSON.stringify(salida.armado_ms));
console.log(errores.length ? errores.join('\n') : 'sin errores');
if (arg('json', null)) writeFileSync(arg('json'), JSON.stringify(salida, null, 1));
await browser.close(); if (server) await new Promise((r) => server.httpServer.close(r));
