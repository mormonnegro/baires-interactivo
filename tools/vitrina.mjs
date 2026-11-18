// Prueba de la página de los edificios (edificios.html, src/catalogo.js) y de la vitrina que maneja (src/vitrina.js):
// que la lista esté entera, que al bajar el visor vaya a cada edificio en su año y lo aclare, los años de cada tarjeta,
// agarrar y soltar la cámara (con el mouse y con el dedo) y los enlaces `?lugar=…&año=…` del visor.
// Deja capturas en shots/vitrina-*.jpg.   node tools/vitrina.mjs [--url https://…]   (sin --url, sirve dist/)
import { chromium } from 'playwright-core';
import { preview } from 'vite';
import { mkdirSync } from 'node:fs';
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : process.argv[i + 1]; };
let server = null, url = arg('url', null);
if (!url) { server = await preview({ preview: { port: 4181 }, logLevel: 'error' }); url = 'http://localhost:4181/'; }
const browser = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--ignore-gpu-blocklist', '--use-angle=metal', '--enable-gpu'] });
mkdirSync('shots', { recursive: true });
let fallas = 0;
const ok = (cond, que, dato = '') => { if (!cond) fallas++; console.log(cond ? '  ok   ' : '  FALLA', que, dato); };

async function pagina(nombre, opts) {
  console.log(nombre);
  const page = await browser.newPage(opts), errores = [];
  page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text().slice(0, 300)); }); page.on('pageerror', (e) => errores.push(e.message));
  await page.goto(url + 'edificios.html');
  await page.waitForFunction(() => document.body.classList.contains('con-ciudad'), null, { timeout: 120000 });
  const marco = page.frames().find((f) => f !== page.mainFrame());
  const visor = () => marco.evaluate(() => ({ año: lab.epocas.año, x: lab.cam.goal.x, z: lab.cam.goal.z, dist: lab.cam.goal.dist, yaw: lab.cam.goal.yaw, vuela: lab.cam.flying, velo: lab.tinta.U.uSobre.value.w, carteles: getComputedStyle(document.querySelector('#titulo')).display }));
  const foto = (n) => page.screenshot({ path: `shots/vitrina-${nombre}-${n}.jpg`, quality: 82 });
  const angosta = opts.viewport.width <= 860;

  const n = await page.evaluate(() => ({ tarjetas: document.querySelectorAll('.edif').length, secciones: document.querySelectorAll('section.año').length, iglesias: document.querySelectorAll('#iglesias .edif').length, cuantos: +document.querySelector('#cuantos').textContent, indice: document.querySelectorAll('#indice a').length, sinFoto: [...document.querySelectorAll('.edif')].filter((e) => !e.querySelector('img')).map((e) => e.querySelector('h3').textContent), repetidas: document.querySelectorAll('[id]').length - new Set([...document.querySelectorAll('[id]')].map((e) => e.id)).size }));
  ok(n.tarjetas >= 60 && n.cuantos === n.tarjetas, 'la lista está entera y la portada la cuenta', `${n.tarjetas} edificios`);
  ok(n.secciones === 8 && n.indice === 8 && n.iglesias >= 10, 'siete años y las iglesias, con su índice', `${n.iglesias} iglesias`);
  ok(n.repetidas === 0, 'ningún id repetido');
  console.log('        sin foto:', n.sinFoto.join(', ') || 'ninguna');
  await page.waitForTimeout(4200);
  let v = await visor();
  ok(v.carteles === 'none', 'el visor va sin carteles');
  ok(v.año === 1867 && v.dist > 1200 && !await page.evaluate(() => !document.querySelector('#cartel').hidden), 'en la portada, la ciudad entera de 1867', `a ${Math.round(v.dist)} m`);
  const y0 = v.yaw; await page.waitForTimeout(700); ok((await visor()).yaw > y0, 'y gira sola');
  await foto('portada');

  // bajar hasta una tarjeta: se la deja sobre la línea de lectura
  const hasta = async (titulo, espera = 6200) => {
    const id = await page.evaluate((t) => [...document.querySelectorAll('.edif')].find((e) => e.querySelector('h3').textContent === t)?.id, titulo);
    await page.evaluate((id) => { const el = document.getElementById(id), tope = matchMedia('(max-width: 860px)').matches ? document.querySelector('#escena').getBoundingClientRect().bottom : 0; scrollBy({ top: el.getBoundingClientRect().top - (tope + (innerHeight - tope) * 0.3), behavior: 'instant' }); }, id);
    await page.waitForTimeout(espera);
    return '#' + id;
  };
  for (const [titulo, año, cerca] of [['Cabildo', 1867, [-28, -72]], ['Edificio Kavanagh', 1940, [1413, -51]], ['Palacio Barolo', 1940, null]]) {
    const sel = await hasta(titulo); v = await visor();
    const p = await page.evaluate((sel) => ({ activa: document.querySelector('.edif.activa')?.id, cartel: document.querySelector('#cartel b').textContent, año: document.querySelector('#cartel i').textContent, indice: document.querySelector('#indice a.on')?.hash, seccion: document.querySelector(sel).parentElement.id, aLaVista: (() => { const a = document.querySelector('#indice a.on')?.getBoundingClientRect(), i = document.querySelector('#indice').getBoundingClientRect(); return !!a && a.left >= i.left - 1 && a.right <= i.right + 1; })(), tapada: document.querySelector(sel + ' h3').getBoundingClientRect().top < document.querySelector('#indice').getBoundingClientRect().bottom }), sel);
    ok('#' + p.activa === sel && p.cartel === titulo && +p.año === año && p.indice === '#' + p.seccion && p.aLaVista, `${titulo}: la tarjeta, el cartel y el índice (con su año a la vista)`, `${p.cartel}, ${p.año}`);
    ok(v.año === año && v.dist < 900 && !v.vuela && (!cerca || Math.hypot(v.x - cerca[0], v.z - cerca[1]) < 5), `${titulo}: el visor fue, en ${año}`, `a ${Math.round(v.dist)} m`);
    ok(v.velo > 0.2, `${titulo}: aclarado`, v.velo.toFixed(2));
    await foto(titulo.toLowerCase().replace(/\W+/g, '-'));
  }

  // los años de una tarjeta: el Congreso de 1864, que en 1940 es el Archivo
  const cong = await hasta('Congreso Nacional');
  const años = await page.evaluate((s) => [...document.querySelectorAll(s + ' .años button')].map((b) => b.textContent + (b.classList.contains('on') ? '*' : '')).join(' '), cong);
  ok(años === '1867* 1888 1895 1905 1910 1921 1940', 'el Congreso viejo: sus siete años, parado en el primero', años);
  await page.click(`${cong} .años button:last-child`); await page.waitForTimeout(5600); v = await visor();
  const c = await page.evaluate((s) => ({ href: document.querySelector(s + ' .ver').getAttribute('href'), nota: document.querySelector(s + ' .nota').textContent, cartel: document.querySelector('#cartel').textContent, on: document.querySelector(s + ' .años .on').textContent }), cong);
  ok(v.año === 1940 && c.on === '1940' && /Congreso viejo/.test(c.cartel) && /^1940 · /.test(c.nota), 'al elegir 1940, el visor cambia de año y la tarjeta lo cuenta', c.nota.slice(0, 60));
  ok(c.href === './?lugar=Congreso%20viejo&año=1940', 'y el enlace al visor lleva el lugar y el año', c.href);
  await foto('congreso-1940');

  // agarrar la cámara
  const y1 = await page.evaluate(() => scrollY);
  await page.click('#mover');
  let b = await page.evaluate(() => ({ clase: document.body.className, pe: getComputedStyle(document.querySelector('#ciudad')).pointerEvents, dice: document.querySelector('#mover').textContent, y: scrollY }));
  ok(/\blibre\b/.test(b.clase) && b.pe === 'auto' && b.dice === 'Seguir el recorrido' && Math.abs(b.y - y1) < 2, '«Mover la cámara» le da el mouse al visor, sin correr la lista');
  const caja = await page.locator('#escena').boundingBox(), X = caja.x + caja.width / 2, Y = caja.y + caja.height / 2;
  const antes = await visor();
  if (opts.hasTouch) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: X, y: Y }] });
    for (let i = 1; i <= 8; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: X + i * 12, y: Y + i * 9 }] }); await page.waitForTimeout(30); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else { await page.mouse.move(X, Y); await page.mouse.down(); await page.mouse.move(X + 110, Y + 30, { steps: 8 }); await page.mouse.up(); }
  await page.waitForTimeout(700); v = await visor();
  b = await page.evaluate(() => ({ clase: document.body.className, y: scrollY }));
  ok(/\btocada\b/.test(b.clase) && Math.hypot(v.x - antes.x, v.z - antes.z) > 3 && Math.abs(b.y - y1) < 2, 'arrastrar mueve la ciudad y no la página', `${Math.round(Math.hypot(v.x - antes.x, v.z - antes.z))} m`);
  const y2 = v.yaw; await page.waitForTimeout(600); ok(Math.abs((await visor()).yaw - y2) < 1e-6, 'y deja de girar sola');
  if (opts.hasTouch) await page.click('#mover'); else await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  b = await page.evaluate(() => ({ clase: document.body.className, pe: getComputedStyle(document.querySelector('#ciudad')).pointerEvents }));
  ok(!/\blibre\b/.test(b.clase) && b.pe === 'none', opts.hasTouch ? 'el botón la devuelve' : 'Escape (desde adentro del visor) la devuelve');
  const y3 = (await visor()).yaw; await page.waitForTimeout(600); ok((await visor()).yaw > y3, 'y vuelve a girar');

  // el índice, una iglesia, el final y la vuelta arriba
  await page.click('#indice a[href="#a1921"]'); await page.waitForTimeout(2600);
  const h = await page.evaluate(() => ({ h2: document.querySelector('#a1921 h2').getBoundingClientRect().top, tope: matchMedia('(max-width: 860px)').matches ? document.querySelector('#escena').getBoundingClientRect().bottom : 0 }));
  ok(h.h2 > h.tope && h.h2 < h.tope + 160, 'el índice lleva a 1921, a la vista', `el título a ${Math.round(h.h2 - h.tope)} px del borde`);
  await hasta('San Ignacio'); v = await visor();
  ok(v.año === 1867 && v.dist < 500 && await page.evaluate(() => document.querySelector('#cartel b').textContent === 'San Ignacio'), 'las iglesias, que las cuenta el visor: San Ignacio', `a ${Math.round(v.dist)} m`);
  await foto('san-ignacio');
  await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })); await page.waitForTimeout(900); await foto('cierre');
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(4600); v = await visor();
  ok(v.dist > 1200 && v.velo === 0 && await page.evaluate(() => document.querySelector('#cartel').hidden), 'arriba de todo, otra vez la ciudad entera');
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'nada se sale de ancho');
  ok(!errores.length, 'sin errores en la consola', errores.join(' | '));
  if (angosta) ok(await page.evaluate(() => { const e = document.querySelector('#escena').getBoundingClientRect(); return e.top === 0 && e.height < innerHeight * 0.5; }), 'en la ventana angosta, la ciudad queda arriba');
  await page.close();
}
await pagina('pc', { viewport: { width: 1500, height: 900 } });
await pagina('tel', { viewport: { width: 390, height: 800 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });

// los enlaces del visor: `?lugar=…&año=…` llega con la ficha abierta, sin el cartel de entrada
console.log('enlaces');
{ const page = await browser.newPage({ viewport: { width: 1400, height: 860 } }), errores = [];
  page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text().slice(0, 300)); }); page.on('pageerror', (e) => errores.push(e.message));
  for (const [lugar, año, titulo] of [['Cabildo', 1867, 'Cabildo'], ['Congreso viejo', 1940, 'Congreso viejo'], ['Edificio Kavanagh', 1940, 'Edificio Kavanagh'], ['No existe', 1921, '']]) {
    await page.goto(`${url}?lugar=${encodeURIComponent(lugar)}&año=${año}`); await page.waitForFunction(() => window.lab?.ready, null, { timeout: 120000 });
    await page.waitForTimeout(año > 1867 ? 8000 : 4500);
    const v = await page.evaluate(() => ({ año: lab.epocas.año, dist: lab.cam.goal.dist, ficha: document.querySelector('#ficha h2')?.textContent ?? '', abierta: !!document.querySelector('#ficha.ver, #ficha.abierta, body.con-ficha'), intro: !!document.querySelector('#intro.ver') }));
    ok(v.año === año && v.ficha === titulo && !v.intro && (titulo ? v.dist < 1000 : true), `${lugar}, ${año}`, titulo ? `la ficha «${v.ficha}», a ${Math.round(v.dist)} m` : 'no hay tal lugar: queda el plano');
  }
  ok(!errores.length, 'sin errores en la consola', errores.join(' | '));
  await page.close(); }

await browser.close(); await server?.close?.(); server?.httpServer?.close();
console.log(fallas ? `\n${fallas} fallas` : '\ntodo bien');
process.exit(fallas ? 1 : 0);
