// Prueba del modo «Manejar» (src/autos.js y src/modos.js): el coche de cada año de la línea de tiempo, con teclado y
// con los dedos. Y, con --fotos, capturas de cada coche para mirarlos (shots/auto-*.png).
//   node tools/autos.mjs [--url https://…] [--puerto 5447]        la prueba (sin --url levanta su propio vite)
//   node tools/autos.mjs --fotos [--años 1867,1921] [--tinta]     cada coche de costado, de frente y de atrás
//   node tools/autos.mjs --finales                                las cuatro de muestra (shots/final-autos-*.png)
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { mkdirSync } from 'node:fs';
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : process.argv[i + 1]; }, tiene = (n) => process.argv.includes('--' + n);
const PUERTO = +arg('puerto', 5447);
let server = null, url = arg('url', null);
// (sin vigilar los archivos: si alguien toca uno a mitad de la prueba, la página no se recarga)
if (!url) { server = await createServer({ server: { port: PUERTO, strictPort: true, hmr: false, watch: null }, logLevel: 'error' }); await server.listen(); url = `http://localhost:${PUERTO}/`; }
const browser = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--ignore-gpu-blocklist', '--use-angle=metal', '--enable-gpu', '--autoplay-policy=no-user-gesture-required'] });
mkdirSync('shots', { recursive: true });
const COCHES = { 1867: 'volanta', 1888: 'victoria', 1895: 'cupe', 1905: 'voiturette', 1910: 'faeton', 1921: 'ford-t', 1940: 'v8' };
const cerrar = async (c) => { await browser.close(); if (server) await server.close(); process.exit(c); };

if (tiene('fotos') || tiene('finales')) {
  // sin reloj (?capture): cada cuadro se pide a mano
  const abrir = async (tinta, año) => {
    const page = await browser.newPage({ viewport: { width: 1200, height: 750 } });
    page.on('console', (m) => { if (m.type() === 'error') console.log('[error]', m.text().slice(0, 400)); }); page.on('pageerror', (e) => console.log('[pageerror]', e.message));
    await page.goto(`${url}?capture${tinta ? '' : '&color'}`); await page.waitForFunction(() => window.lab?.ready, null, { timeout: 120000 });
    await page.evaluate(async () => { lab.ver({ x: 0, z: 0, dist: 500, yaw: -0.5, pitch: 0.5 }); lab.frente(9500); await lab.finas(); lab.step(0, 2); });
    return page;
  };
  /** Pone el coche del año en una bocacalle (que es donde hay lugar para mirarlo de costado), lejos de la plaza, que está llena de rejas y de monumentos. */
  const alAño = async (page, año) => {
    await page.evaluate(async (año) => { lab.epocas.elegir(año); await lab.finas(); lab.step(0, 2); }, año);
    if (!(await page.evaluate(() => lab.modos.activo))) { await page.click('#manejar'); await page.waitForFunction(() => lab.modos.activo === 'manejar', null, { timeout: 30000 }); }
    await page.evaluate(() => {
      const m = lab.modos.manejo, a = m.auto, E = lab.modos.edificado; m.entrar(350, -350, 0); lab.step(1 / 60, 60);
      const corre = (x, z, h) => { let r = 0; while (r < 40 && !E(x + Math.sin(h) * (r + 1), z + Math.cos(h) * (r + 1))) r++; return r; };
      const fx = Math.sin(a.h), fz = Math.cos(a.h);
      for (let d = 0; d < 400; d++) for (const s of d ? [1, -1] : [1]) {
        const x = a.x + fx * d * s, z = a.z + fz * d * s; if (E(x, z) || m.agua(x, z)) continue;
        if (corre(x, z, a.h + Math.PI / 2) >= 40 && corre(x, z, a.h - Math.PI / 2) >= 40 && corre(x, z, a.h) > 12 && corre(x, z, a.h + Math.PI) > 12) { const c = (m.vehiculo.frente + m.vehiculo.cola) / 2; a.x = x - fx * c; a.z = z - fz * c; a.v = 0; return; }
      }
    });
    await page.evaluate(() => lab.step(1 / 60, 30));
    return page.evaluate(() => { const v = lab.modos.manejo.vehiculo; return v.frente - v.cola; });
  };
  const foto = async (page, f) => { await page.waitForTimeout(250); await page.screenshot({ path: f }); console.log(f); };
  if (tiene('finales')) {
    // las cuatro de muestra: dos andando por la calle (como se ve al manejar) y dos de cerca, una en tinta
    const TOMAS = [{ año: 1867, anda: 150 }, { año: 1910, orbita: (l) => ({ a: -0.7, d: l * 1.9 + 2, y: 1.9 }) }, { año: 1921, tinta: true, orbita: (l) => ({ a: 2.5, d: l * 1.9 + 2, y: 2.3 }) }, { año: 1940, anda: 260 }];
    for (const [i, t] of TOMAS.entries()) {
      const page = await abrir(t.tinta, t.año), largo = await alAño(page, t.año);
      if (t.anda) { await page.keyboard.down('KeyW'); await page.evaluate((n) => lab.step(1 / 60, n), t.anda); } else await page.evaluate((o) => { lab.modos.manejo.auto.orbita = o; lab.step(1 / 60, 2); }, t.orbita(largo));
      await foto(page, `shots/final-autos-${i + 1}.png`); await page.keyboard.up('KeyW'); await page.close();
    }
    await cerrar(0);
  }
  const años = arg('años', Object.keys(COCHES).join(',')).split(',').map(Number), tinta = tiene('tinta'), page = await abrir(tinta);
  for (const año of años) {
    const largo = await alAño(page, año);
    for (const [vista, o] of [['costado', { a: -Math.PI / 2, d: largo * 2.3 + 2, y: 1.1 }], ['frente', { a: -0.7, d: largo * 1.9 + 2, y: 1.9 }], ['atras', { a: 2.5, d: largo * 1.9 + 2, y: 2.3 }]]) {
      await page.evaluate((o) => { lab.modos.manejo.auto.orbita = o; lab.step(1 / 60, 2); }, o);
      await foto(page, `shots/auto-${año}-${vista}${tinta ? '-tinta' : ''}.png`);
    }
    await page.evaluate(() => { lab.modos.manejo.auto.orbita = null; });
    console.log(año, await page.evaluate(() => lab.modos.manejo.vehiculo.clave), JSON.stringify(await page.evaluate(() => lab.modos.manejo.triangulos())));
  }
  await cerrar(0);
}

let fallas = 0;
const ok = (cond, que, dato = '') => { if (!cond) fallas++; console.log(cond ? '  ok   ' : '  FALLA', que, dato); };
async function abrir(opts) {
  const page = await browser.newPage(opts), errores = [];
  page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text().slice(0, 300)); }); page.on('pageerror', (e) => errores.push(e.message));
  await page.goto(url + '?sinintro'); await page.waitForFunction(() => window.lab?.ready, null, { timeout: 120000 });
  await page.waitForTimeout(7500); // la ciudad se levanta sola y la cámara baja al centro
  return { page, errores };
}
const coche = (page) => page.evaluate(() => { const m = lab.modos.manejo; return { ...m.auto, coche: m.vehiculo?.clave, toca: m.adentro(), modo: lab.modos.activo, kmh: Math.abs(m.auto.v) * 3.6 }; });
const lejos = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const alCabildo = (page) => page.evaluate(() => { const m = lab.marcas.marcas.find((m) => m.el.querySelector('b').textContent === 'Cabildo'); lab.cam.jump({ x: m.x + 40, z: m.z + 60, dist: 500, yaw: -0.5, pitch: 0.5 }); });
const elegir = async (page, año) => { await page.click(`#epocas button[data-a="${año}"]`); await page.waitForFunction((a) => lab.epocas.año === a && lab.epocas.etapa === lab.epocas.lista.indexOf(a), año, { timeout: 60000 }); await page.waitForTimeout(1600); };

console.log('— escritorio —');
{
  const { page, errores } = await abrir({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const pausa = (ms) => page.waitForTimeout(ms);
  await alCabildo(page); await pausa(600);
  const antes = await page.evaluate(() => ({ fov: lab.camera.fov, mallas: lab.scene.children.length }));
  await page.click('#manejar'); await page.waitForFunction(() => lab.modos.activo === 'manejar', null, { timeout: 30000 }); await pausa(1500);
  let a = await coche(page);
  ok(a.coche === 'volanta', 'el botón entra a manejar, y en 1867 se maneja una volanta', a.coche); ok(!a.toca, 'aparece en la calle, sin tocar nada');
  ok(await page.evaluate(() => !lab.modos.enManzana(lab.modos.manejo.auto.x, lab.modos.manejo.auto.z)), 'fuera de toda manzana');
  // se arranca siempre en la Plaza de Mayo (la cámara miraba al Cabildo, pero podría mirar a cualquier barrio)
  { const d = await page.evaluate(() => { const m = lab.marcas.marcas.find((m) => m.nombre === 'Catedral'), a = lab.modos.manejo.auto; return Math.hypot(a.x - m.x, a.z - m.z); }); ok(d < 90, 'y arranca en la Plaza de Mayo, en la calle de la Catedral', `a ${Math.round(d)} m de la Catedral`); }
  // (el recorrido que sigue se hace por las calles angostas de al lado del Cabildo, con paredes a los dos lados)
  await page.evaluate(() => { const m = lab.marcas.marcas.find((m) => m.el.querySelector('b').textContent === 'Cabildo'); lab.modos.manejo.entrar(m.x + 40, m.z + 60, -0.5 + Math.PI); }); await pausa(800);
  ok(await page.evaluate(() => { const r = document.getElementById('tablero').getBoundingClientRect(); return r.width > 100 && getComputedStyle(document.getElementById('tablero')).display !== 'none'; }), 'con el tablero a la vista');
  ok(await page.evaluate(() => getComputedStyle(document.getElementById('epocas')).display !== 'none'), 'y la línea de tiempo también');
  // el mapita (src/minimapa.js): a la vista y con algo pintado (más de un tono: calles y manzanas)
  await page.waitForFunction(() => { const c = document.querySelector('#minimapa canvas'); if (!c || !c.width) return false; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, s = new Set(); for (let i = 0; i < d.length; i += 4 * 97) s.add(d[i] >> 3); return s.size >= 3; }, null, { timeout: 30000 }).catch(() => {});
  ok(await page.evaluate(() => { const e = document.getElementById('minimapa'), c = e?.querySelector('canvas'); if (!e || getComputedStyle(e).display === 'none' || e.getBoundingClientRect().width < 80) return false; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, s = new Set(); for (let i = 0; i < d.length; i += 4 * 97) s.add(d[i] >> 3); return s.size >= 3; }), 'y el mapita de la esquina, con las calles pintadas');
  const tri = await page.evaluate(() => lab.modos.manejo.triangulos());
  ok(Object.values(tri).every((n) => n > 500 && n < 9000), 'cada coche, unos pocos miles de triángulos', JSON.stringify(tri));
  await page.screenshot({ path: 'shots/auto-p-1.png' });
  await page.keyboard.down('KeyW'); await pausa(3000); let b = await coche(page); await page.keyboard.up('KeyW');
  ok(lejos(a, b) > 5 && b.kmh > 6, 'W lo hace andar', `${lejos(a, b).toFixed(1)} m en 3 s, a ${b.kmh.toFixed(0)} km/h`);
  ok((await page.evaluate(() => +document.querySelector('#tablero .kmh').textContent)) > 5, 'y el velocímetro lo marca');
  await pausa(300); await page.keyboard.down('Space'); await pausa(2500); await page.keyboard.up('Space'); let c = await coche(page);
  ok(c.kmh < 0.5, 'espacio lo frena', `${c.kmh.toFixed(1)} km/h`);
  await page.keyboard.down('KeyS'); await pausa(2000); await page.keyboard.up('KeyS'); let d = await coche(page);
  ok(d.v < -0.3, 'S, una vez parado, es la marcha atrás', `${(d.v * 3.6).toFixed(1)} km/h`); await pausa(1500);
  // dando vueltas un rato largo: nunca queda adentro de una casa
  let adentro = 0, andado = 0, ant = await coche(page);
  for (let i = 0; i < 40; i++) {
    await page.keyboard.down('KeyW'); if (i % 3 === 0) await page.keyboard.down(i % 2 ? 'ArrowLeft' : 'ArrowRight');
    await pausa(350); await page.keyboard.up('ArrowLeft'); await page.keyboard.up('ArrowRight');
    const p = await coche(page); if (p.toca) adentro++; andado += lejos(ant, p); ant = p;
  }
  await page.keyboard.up('KeyW');
  ok(adentro === 0, 'andando contra las casas no se las atraviesa', `${Math.round(andado)} m andados, ${adentro} veces adentro, ${ant.golpes} golpes`); ok(andado > 20, 'y no se queda trabado');
  await page.screenshot({ path: 'shots/auto-p-2.png' });
  // de frente contra una pared: frena y rebota apenas, sin meterse
  const pared = await page.evaluate(() => {
    // una pared ancha y de frente, con el camino libre hasta ella
    const m = lab.modos.manejo, a = m.auto, E = lab.modos.edificado;
    for (let r = 12; r < 60; r += 2) for (let k = 0; k < 32; k++) {
      const h = (k / 32) * Math.PI * 2, fx = Math.sin(h), fz = Math.cos(h), en = (d, l) => E(a.x + fx * d + fz * l, a.z + fz * d - fx * l);
      let va = true; for (const l of [-3, 0, 3]) { for (const d of [r, r + 2, r + 4]) va &&= en(d, l); for (let d = -3; d < r - 3; d += 1.5) va &&= !en(d, l * 0.5); }
      if (va) { a.h = h; a.v = 0; a.d = 0; return r; }
    }
    return 0;
  });
  const g0 = (await coche(page)).golpes; await page.keyboard.down('KeyW');
  await page.waitForFunction((g) => lab.modos.manejo.auto.golpes > g, g0, { timeout: 25000 }).catch(() => {}); await pausa(700); const e = await coche(page); await page.keyboard.up('KeyW');
  ok(pared > 0 && !e.toca && e.golpes > g0 && e.kmh < 6, 'de frente contra una pared: choca, queda afuera y casi parado', `pared a ${pared} m, ${e.golpes - g0} golpes, ${e.kmh.toFixed(1)} km/h`);
  // al río no se entra
  const orilla = await page.evaluate(() => {
    const m = lab.modos.manejo, a = m.auto; let z = a.z; while (z < 4000 && !m.agua(a.x, z)) z += 2; if (z >= 4000) return null;
    for (let d = 14; d < 200; d += 2) if (!lab.modos.edificado(a.x, z - d) && !m.agua(a.x, z - d)) { a.x = a.x; a.z = z - d; a.h = 0; a.v = 0; if (!m.adentro()) return d; }
    return null;
  });
  await page.keyboard.down('KeyW'); await pausa(6000); const f = await coche(page); await page.keyboard.up('KeyW');
  ok(orilla !== null && !f.toca && !(await page.evaluate(() => { const m = lab.modos.manejo, a = m.auto; return m.agua(a.x, a.z); })), 'al río no se entra', orilla === null ? 'no se encontró la orilla' : `orilla a ${orilla} m, quedó a ${f.kmh.toFixed(1)} km/h`);
  await page.screenshot({ path: 'shots/auto-p-3.png' });
  // con los años, el coche se transforma en el de la época, y cada uno anda como es
  await alCabildo(page); await page.keyboard.press('Escape'); await pausa(800); await alCabildo(page); await pausa(400);
  await page.click('#manejar'); await page.waitForFunction(() => lab.modos.activo === 'manejar'); await pausa(1000);
  const topes = {};
  for (const [año, clave] of Object.entries(COCHES).slice(1)) {
    await elegir(page, +año); const p = await coche(page);
    ok(p.coche === clave && !p.toca, `en ${año} el coche es «${clave}», y sigue en la calle`, p.coche);
    await page.keyboard.down('KeyW'); await pausa(2500); const q = await coche(page); await page.keyboard.up('KeyW'); await page.keyboard.down('Space'); await pausa(1800); await page.keyboard.up('Space');
    ok(lejos(p, q) > 3 && !q.toca, '  anda, sin atravesar nada', `${lejos(p, q).toFixed(1)} m en 2,5 s, a ${q.kmh.toFixed(0)} km/h`);
    topes[clave] = await page.evaluate(() => lab.modos.manejo.vehiculo.andar.vmax);
    if (+año === 1905 || +año === 1940) await page.screenshot({ path: `shots/auto-p-${año}.png` });
  }
  ok(topes.v8 > topes['ford-t'] && topes['ford-t'] > topes.voiturette && topes.voiturette > topes.cupe, 'cada uno con su velocidad: el V8 más que el T, el T más que la voiturette, y esta más que el caballo', JSON.stringify(topes));
  // Q vuelve un año atrás
  await page.keyboard.press('KeyQ'); await page.waitForFunction(() => lab.epocas.año === 1921 && lab.epocas.etapa === 5, null, { timeout: 20000 }); await pausa(1500);
  ok((await coche(page)).coche === 'ford-t', 'Q vuelve al año anterior, y el coche con él');
  // en cada año se puede elegir, además del suyo, cualquiera de los anteriores (N, o el botón de las flechas del tablero)
  await page.keyboard.press('KeyN'); await pausa(700);
  ok((await coche(page)).coche === 'faeton', 'N pasa al coche anterior: en 1921, el doble faetón', (await coche(page)).coche);
  await page.click('#tablero [data-b="coche"]'); await pausa(700);
  ok((await coche(page)).coche === 'voiturette' && !(await coche(page)).toca, 'el botón del tablero sigue con la voiturette, que queda en la calle', (await coche(page)).coche);
  await page.keyboard.down('KeyW'); await pausa(1500); await page.keyboard.up('KeyW');
  ok((await coche(page)).coche === 'voiturette', 'y se la puede manejar en 1921 sin que vuelva sola al Ford T');
  await page.keyboard.press('KeyE'); await page.waitForFunction(() => lab.epocas.año === 1940 && lab.epocas.etapa === 6, null, { timeout: 20000 }); await pausa(1500);
  ok((await coche(page)).coche === 'v8', 'al cambiar de año se vuelve al coche de ese año');
  await page.keyboard.press('KeyQ'); await page.waitForFunction(() => lab.epocas.año === 1921 && lab.epocas.etapa === 5, null, { timeout: 20000 }); await pausa(1500);
  // la otra vista: desde el asiento
  await page.keyboard.press('KeyV'); await pausa(500);
  const ojo = await page.evaluate(() => { const a = lab.modos.manejo.auto; return { d: Math.hypot(lab.camera.position.x - a.x, lab.camera.position.z - a.z), vista: a.vista }; });
  ok(ojo.vista === 'volante' && ojo.d < 1.5, 'V pasa a la vista al volante', `la cámara a ${ojo.d.toFixed(2)} m del medio del auto`);
  await page.screenshot({ path: 'shots/auto-p-volante.png' });
  await page.keyboard.press('KeyV'); await page.keyboard.press('KeyB'); await page.keyboard.press('KeyM'); await pausa(300);
  ok(await page.evaluate(() => document.querySelector('#tablero [data-b="sonido"]').classList.contains('on')), 'M calla el sonido (y B toca la bocina sin romper nada)'); await page.keyboard.press('KeyM');
  // de coche a pie, y al mapa: todo vuelve a su lugar
  const enAuto = await coche(page); await page.click('#caminar'); await pausa(1200);
  const aPie = await page.evaluate(() => ({ ...lab.modos.pie, modo: lab.modos.activo }));
  ok(aPie.modo === 'caminar' && lejos(aPie, enAuto) < 30, 'de coche a pie: se baja donde estaba', `${lejos(aPie, enAuto).toFixed(1)} m`);
  await page.click('#manejar'); await page.waitForFunction(() => lab.modos.activo === 'manejar'); await pausa(800);
  await page.keyboard.press('Escape'); await pausa(1200);
  const fin = await page.evaluate(() => ({ modo: lab.modos.activo, clases: document.body.className, fov: lab.camera.fov, visibles: lab.scene.children.filter((o) => o.isGroup && o.rotation.order === 'YXZ' && o.visible).length, tablero: getComputedStyle(document.getElementById('tablero')).display, epocas: getComputedStyle(document.getElementById('epocas')).display, fondo: lab.scene.background.getHex() }));
  ok(!fin.modo && !/(^| )modo/.test(fin.clases), 'Esc vuelve al mapa', fin.clases); ok(Math.abs(fin.fov - antes.fov) < 0.01, 'con la cámara del mapa como estaba');
  ok(fin.visibles === 0 && fin.tablero === 'none', 'sin coche ni tablero a la vista', `${fin.visibles} coches visibles`); ok(fin.epocas !== 'none', 'y con la línea de tiempo donde estaba');
  await page.mouse.move(700, 450); await page.mouse.down(); await page.mouse.move(600, 500, { steps: 6 }); await page.mouse.up(); await pausa(400);
  await page.screenshot({ path: 'shots/auto-p-vuelta.png' });
  console.log(errores.length ? errores.join('\n') : '  sin errores en la consola'); if (errores.length) fallas++;
  await page.close();
}

console.log('— teléfono —');
{
  const { page, errores } = await abrir({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
  const pausa = (ms) => page.waitForTimeout(ms);
  const cdp = await page.context().newCDPSession(page);
  const toque = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], id) => ({ x, y, id })) });
  await alCabildo(page); await pausa(600);
  await page.tap('#manejar'); await page.waitForFunction(() => lab.modos.activo === 'manejar', null, { timeout: 30000 }); await pausa(1500);
  let a = await coche(page); ok(a.modo === 'manejar' && !a.toca, 'el botón entra a manejar, en la calle');
  await toque('touchStart', [[200, 520]]); for (let i = 1; i <= 6; i++) { await toque('touchMove', [[200, 520 - i * 9]]); await pausa(16); } await pausa(2500);
  await page.screenshot({ path: 'shots/auto-p-tel-1.png' });
  await toque('touchEnd', []); await pausa(200);
  let b = await coche(page); ok(lejos(a, b) > 3, 'un dedo hacia adelante acelera', `${lejos(a, b).toFixed(1)} m`);
  await toque('touchStart', [[200, 520]]); for (let i = 1; i <= 6; i++) { await toque('touchMove', [[200 - i * 8, 520 - i * 5]]); await pausa(16); } await pausa(1500); await toque('touchEnd', []);
  const c = await coche(page); ok(c.h > b.h + 0.05, 'y hacia la izquierda dobla a la izquierda', `${(c.h - b.h).toFixed(2)} rad`);
  await page.tap(`#epocas button[data-a="1921"]`); await page.waitForFunction(() => lab.epocas.etapa === 5, null, { timeout: 60000 }); await pausa(1800);
  ok((await coche(page)).coche === 'ford-t', 'tocando 1921 en la línea de tiempo, el coche pasa a ser el Ford T');
  await page.screenshot({ path: 'shots/auto-p-tel-2.png' });
  const chicos = await page.evaluate(() => [...document.querySelectorAll('#botones button, #tablero button')].filter((b) => { const r = b.getBoundingClientRect(); return r.width && (r.width < 43.5 || r.height < 43.5); }).map((b) => b.id || b.dataset.b));
  ok(chicos.length === 0, 'los botones miden 44 px o más', chicos.join(' '));
  const pisa = await page.evaluate(() => { const R = (id) => document.getElementById(id).getBoundingClientRect(), t = R('tablero'), s = (r) => !(r.right <= t.left || r.left >= t.right || r.bottom <= t.top || r.top >= t.bottom) && r.width > 0; return ['modo-info', 'epocas', 'manejar', 'salir'].filter((id) => s(R(id))).concat(s(R('modo-info')) ? [] : (() => { const e = R('epocas'), i = R('modo-info'); return !(i.right <= e.left || i.left >= e.right || i.bottom <= e.top || i.top >= e.bottom) ? ['cartel sobre la línea de tiempo'] : []; })()); });
  ok(pisa.length === 0, 'el tablero, el cartel y la línea de tiempo no se pisan', pisa.join(' '));
  await page.tap('#tablero [data-b="vista"]'); await pausa(500); ok((await coche(page)).vista === 'volante', 'el botón de la vista cambia la vista'); await page.screenshot({ path: 'shots/auto-p-tel-3.png' }); await page.tap('#tablero [data-b="vista"]');
  await page.tap('#salir'); await pausa(1200);
  ok(await page.evaluate(() => !lab.modos.activo), '«Volver al mapa» vuelve al mapa');
  console.log(errores.length ? errores.join('\n') : '  sin errores en la consola'); if (errores.length) fallas++;
  await page.close();
}
console.log(fallas ? `\n${fallas} FALLAS` : '\ntodo bien');
await cerrar(fallas ? 1 : 0);
