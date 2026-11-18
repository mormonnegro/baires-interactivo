// Buenos Aires, 1867. El plano topográfico del Departamento Topográfico, levantado: cada manzana, cada construcción
// suelta y cada árbol que dibuja el plano, en su lugar y con su forma. Lo que el plano no dice (dónde termina una casa
// y empieza la otra, cuántos pisos tiene) está inventado con las reglas de la época. Ver LEEME.md.
//   espacio     plano ⇄ ciudad
//   ?capture    sin reloj: window.lab.step(segundos) avanza a mano (para capturas)
//   ?liviano    como en un teléfono (láminas más chicas, sombras más chicas)   ?pesado: lo contrario
// Además de mirarla desde arriba, se la puede caminar o sobrevolar en avión: src/modos.js.
//
// La carga va por etapas, para que en un teléfono se vea algo enseguida:
//   1. el plano tendido, con una lámina bien liviana (plano/primero.webp, 0,13 MB). Ya se lo puede mirar y mover.
//   2. la ciudad (datos/ciudad.pak, 1,35 MB), las marcas, las fichas y el buscador. Recién ahí se puede levantar.
//   3. las láminas más finas: la del pliego entero que le corresponde al equipo (4096 de ancho en un teléfono; 2048 y
//      después 8192 en una pantalla grande) y, al acercarse, las teselas de lo que se mira.
// Y se dibuja solo cuando algo cambió: con la vista quieta, la página no gasta batería.
import * as THREE from 'three';
import { createTinta, SOL, AMBIENTE } from './tinta.js';
import { loadMeta, loadCiudad, createCiudad, loadCrece, createCrece, marcarMueren } from './ciudad.js';
import { createHitos } from './hitos.js';
import { loadPatios, createPatios } from './patios.js';
import { createPagina } from './pagina.js';
import { createCamara } from './camara.js';
import { createMarcas, LUGARES } from './marcas.js';
import { createIntro } from './intro.js';
import { createCalles } from './calles.js';
import { createTren } from './tren.js';
import { pedir as bajar, u } from './url.js';
import { loadRelieve } from './relieve.js';
import { createEpocas } from './epocas.js';
import { trozar, trozosEnteros, soltar } from './trozos.js';

const q = new URLSearchParams(location.search), capture = q.has('capture'), $ = (id) => document.getElementById(id);
// el cartel de entrada: se puede ir leyendo mientras carga el plano  (?sinintro lo saltea)
const intro = capture || q.has('sinintro') || q.has('limpio') || q.has('lugar') || q.has('juego') ? null : createIntro();
// (el juego de las fotos se puede pedir antes de que la ciudad esté: desde el cartel de entrada, o con `?juego`)
let quiereJugar = q.has('juego'); addEventListener('jugar', () => { quiereJugar = true; });
if (q.has('limpio')) document.body.classList.add('limpio'); // (desde el principio: que no asome ningún cartel)

// --- todo lo que hay que bajar se pide de entrada y a la vez (lo primero ya lo adelantó index.html) ---
const pLaminas = bajar('plano/laminas.json').then((r) => r.json());
const pMeta = loadMeta();
const pDatos = loadCiudad(pMeta); pDatos.catch(() => {});
const pDeHoy = bajar('datos/hoy.json').then((r) => r.json()).catch(() => []);
// (las fichas y el buscador no hacen falta para ver el plano: van aparte, y se bajan mientras tanto)
const pModulos = Promise.all([import('./ficha.js'), import('./buscar.js'), import('./modos.js')]); pModulos.catch(() => {});

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
const maxTex = renderer.capabilities.maxTextureSize, aniso = renderer.capabilities.getMaxAnisotropy();
// un teléfono (o un equipo con poca memoria): láminas y sombras más chicas. Se ve igual: la pantalla tiene menos puntos.
const liviano = q.has('liviano') || (!q.has('pesado') && (maxTex < 8192 || Math.min(screen.width, screen.height) < 600 || (navigator.deviceMemory ?? 8) < 4));
const PUNTOS = capture ? 1 : q.has('puntos') ? Math.min(3, Math.max(0.5, parseFloat(q.get('puntos')) || 1)) : Math.min(devicePixelRatio, liviano ? 1.5 : 2); // (en un teléfono, 1,5: con 2 son casi el doble de puntos que pintar, y no llega. `?puntos=2`: para probar)
renderer.setPixelRatio(PUNTOS);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.NoToneMapping;
$('view').appendChild(renderer.domElement);
// (si el teléfono le saca la placa de video a la pestaña —pasa al volver de otra aplicación—, se empieza de nuevo:
// las láminas ya no están de este lado para volver a subirlas)
renderer.domElement.addEventListener('webglcontextrestored', () => location.reload());

const scene = new THREE.Scene();
// (los colores se escriben tal cual se ven: acá no hay conversión de espacio de color al final)
const tal = (hex) => new THREE.Color().setRGB(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255, THREE.LinearSRGBColorSpace);
scene.background = tal(0x2a2521); // (igual que la mesa: así no se le ve el borde a lo lejos)
// (los datos de cada casa, sin interpolar: solo si el navegador deja elegir de qué vértice se toman, que así sale gratis;
// ver createTinta. `?fijo=0` y `?fijo=1`: para probar sin eso y con eso a la fuerza)
const vertice = q.has('sinvertice') ? null : renderer.getContext().getExtension('WEBGL_provoking_vertex');
if (vertice) vertice.provokingVertexWEBGL(vertice.FIRST_VERTEX_CONVENTION_WEBGL);
const tinta = createTinta({ fijo: q.has('fijo') ? q.get('fijo') !== '0' : !!vertice }), U = tinta.U;
const [laminas, meta] = await Promise.all([pLaminas, pMeta]), { plaza, metro } = meta.plano;
U.uHoja.value.set(laminas.ancho, laminas.alto); U.uPlaza.value.set(plaza[0], plaza[1]); U.uMetro.value = metro;
{ const m = meta.plano.marco; U.uMarco.value.set(m[0] / laminas.ancho, m[1] / laminas.alto, m[2] / laminas.ancho, m[3] / laminas.alto); }

// --- cuándo hay que dibujar: solo si algo cambió (la cámara, la ola, una lámina que llegó, un toque) ---
let cuadros = 3;
const pedirCuadro = (n = 2) => { cuadros = Math.max(cuadros, n); };
for (const ev of ['pointerdown', 'pointerup', 'click', 'keydown', 'keyup', 'wheel', 'focus']) addEventListener(ev, () => pedirCuadro(3), { capture: true, passive: true });
document.addEventListener('visibilitychange', () => pedirCuadro(3));

// --- el plano, en niveles de menor a mayor. Con el primero ya se puede mirar. ---
async function lamina(ruta, color = false) {
  const r = await bajar(ruta); if (!r.ok) throw new Error(ruta);
  const bmp = await createImageBitmap(await r.blob(), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
  const t = new THREE.Texture(bmp);
  t.format = color ? THREE.RGBAFormat : THREE.RedFormat; t.type = THREE.UnsignedByteType; t.flipY = false; t.colorSpace = THREE.NoColorSpace;
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = aniso; t.needsUpdate = true;
  // (una vez que está en la placa de video, la copia de este lado no hace falta: en un teléfono son decenas de megas)
  t.onUpdate = () => { bmp.close?.(); t.onUpdate = null; };
  pedirCuadro(3);
  return t;
}
/** Pone una lámina del pliego entero (de `ancho` píxeles) como fondo de todo lo que no tiene tesela fina. */
const medio = (t, ancho) => {
  const vieja = U.tMedio.value;
  for (let s = 0; s < 4; s++) if (!U.uFinoOn.value[s]) U.tFino.value[s] = t;
  U.tMedio.value = t; U.uMedioRes.value = laminas.ancho / ancho; vieja?.dispose(); pedirCuadro(3);
};
medio(await lamina('plano/primero.webp'), 1024);
// las teselas finas: se piden las que rodean el punto que se mira (y solo las que se ven con detalle), y se sueltan
// las que quedaron lejos
const TES = laminas.tesela, teselas = new Map(), sinFinas = maxTex < TES || q.has('chico');
// la lámina entera más fina que va a tener este equipo: 8192 de ancho en una pantalla grande, 4096 en un teléfono
const GRANDE = !liviano && maxTex >= 8192, ANCHO_MEDIO = GRANDE ? 8192 : 4096;
let turno = 0;
function pedir(i, j) {
  const key = `${i}-${j}`; let t = teselas.get(key);
  if (!t) { t = { i, j, tex: null, uso: 0 }; t.lista = lamina(`plano/f/${key}.webp`).then((tex) => { t.tex = tex; }).catch(() => { teselas.delete(key); }); teselas.set(key, t); }
  t.uso = turno; return t;
}

// --- la hoja sobre la mesa ---
const X0 = -plaza[0] * metro, Z0 = -plaza[1] * metro, AN = laminas.ancho * metro, AL = laminas.alto * metro;
let mesa;
{
  // (con vértices cada 33 m, los mismos de la grilla del relieve: la hoja sigue el terreno cuando la ciudad se levanta)
  const g = new THREE.PlaneGeometry(AN, AL, 384, 269).rotateX(-Math.PI / 2).translate(X0 + AN / 2, 0, Z0 + AL / 2);
  g.setAttribute('aInfo', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 4).map((_, i) => (i % 4 === 1 ? 40 : 0)), 4));
  // (apenas hundida, para que no pelee con lo que está apoyado en ella. Sin corrimiento por pendiente: mirando de lejos
  // y al ras, ese corrimiento la mandaba detrás de la mesa y el plano se veía negro.)
  const hoja = new THREE.Mesh(g.translate(0, -0.05, 0), tinta.make({ polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: 2 }));
  hoja.receiveShadow = true; trozar(hoja); soltar(hoja.geometry); scene.add(hoja); // (en trozos, como la ciudad: src/trozos.js)
  mesa = new THREE.Mesh(new THREE.PlaneGeometry(120000, 120000).rotateX(-Math.PI / 2).translate(0, -150, 0), new THREE.MeshBasicMaterial({ color: tal(0x2a2521) }));
  scene.add(mesa);
}

// --- la luz: solo importa de dónde viene y qué tapa ---
const SOMBRA = liviano ? 2048 : 4096;
const sol = new THREE.DirectionalLight(0xffffff, Math.PI);
sol.castShadow = true; sol.shadow.mapSize.set(SOMBRA, SOMBRA); sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.6; sol.shadow.radius = 2.5;
scene.add(sol, sol.target, new THREE.AmbientLight(0xffffff, Math.PI * AMBIENTE));
// (los ejes de la luz, como los arma la cámara de la sombra: para correrla de a puntos enteros, y cuándo se la calculó)
const LUZ = (() => { const X = new THREE.Vector3(0, 1, 0).cross(SOL).normalize(), Y = SOL.clone().cross(X); return { xx: X.x, xz: X.z, yx: Y.x, yz: Y.z, det: X.x * Y.z - X.z * Y.x }; })();
sol.shadow.autoUpdate = false; const sombraEn = { a: NaN, b: NaN, s: 0, ojo: new THREE.Vector3() };

const FOV = 30; // (la cámara del mapa mira de lejos, con poco ángulo; a pie y en avión lo abre src/modos.js)
const camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 5, 40000);
const pagina = createPagina(renderer);
// de lejos, que entre el pliego entero
const lejos = () => { const t = Math.tan((FOV * Math.PI) / 360); return Math.max(AL / 2 / t, AN / 2 / (t * camera.aspect)) * 1.04; };
const cam = createCamara(camera, renderer.domElement, { bounds: [X0, Z0, X0 + AN, Z0 + AL], far: lejos() });
const ENTERO = { x: X0 + AN / 2, z: Z0 + AL / 2, dist: lejos(), yaw: 0, pitch: Math.PI / 2 };
const VISTA = { x: 60, z: -260, dist: 1500, yaw: -0.5, pitch: 0.52 };
const fit = () => {
  renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); pagina.resize();
  // (al girar el teléfono cambia cuánto hay que alejarse para ver el pliego entero)
  const entera = cam.goal.dist >= ENTERO.dist * 0.98; ENTERO.dist = lejos(); cam.far = ENTERO.dist; if (entera && !cam.flying) cam.jump({ ...cam.goal, dist: ENTERO.dist });
  pedirCuadro(3);
};
addEventListener('resize', fit);
cam.jump(ENTERO);

/** De las cuatro teselas de alrededor de lo que se mira, cuáles se ven con más detalle del que da la lámina entera.
 *  (En un teléfono suelen ser una o dos: las otras quedan fuera de la pantalla, o lejos, y no vale la pena bajarlas.) */
const rayo = new THREE.Raycaster(), ndc = new THREE.Vector2(), pt = new THREE.Vector3(), alLlegar = camera.clone();
function hacenFalta(i0, j0, camera) {
  const falta = [false, false, false, false];
  const pix = (2 * Math.tan((camera.fov * Math.PI) / 360)) / Math.max(1, renderer.domElement.height); // radianes por punto de pantalla
  const res = laminas.ancho / ANCHO_MEDIO; // (se compara con la lámina entera que va a haber, aunque todavía no haya llegado)
  for (let b = -1; b <= 1; b += 0.25) for (let a = -1; a <= 1; a += 0.25) {
    rayo.setFromCamera(ndc.set(a, b), camera);
    const o = rayo.ray.origin, d = rayo.ray.direction; if (d.y > -0.03) continue;
    const L = -o.y / d.y; pt.copy(o).addScaledVector(d, L);
    // cuántos píxeles del escaneo entran ahí en un punto de pantalla (en el peor sentido: al ras, el suelo se aprieta)
    if ((L * pix) / -d.y / metro > res) continue;
    const i = Math.floor((pt.x / metro + plaza[0]) / TES) - i0, j = Math.floor((pt.z / metro + plaza[1]) / TES) - j0;
    if (i >= 0 && i < 2 && j >= 0 && j < 2) falta[j * 2 + i] = true;
  }
  return falta;
}
/** Elige (y pide) las teselas finas para lo que se va a estar mirando: `a` es adónde va la cámara. Mientras vuela
 *  no se piden las del camino: solo las de la llegada, que así ya están cuando llega. */
function afinar(a, todas = capture, real = null) {
  if (sinFinas) return Promise.resolve();
  turno++;
  const { x, z } = a;
  // (a pie o en avión no hay vuelo de la cámara del mapa: se mira con la cámara como está, `real`)
  if (!real) { alLlegar.aspect = camera.aspect; alLlegar.fov = camera.fov; cam.posar(alLlegar, a); }
  const px = x / metro + plaza[0], py = z / metro + plaza[1];
  const i0 = Math.min(laminas.cols - 2, Math.max(0, Math.floor(px / TES - 0.5))), j0 = Math.min(laminas.rows - 2, Math.max(0, Math.floor(py / TES - 0.5)));
  const falta = todas ? null : hacenFalta(i0, j0, real ?? alLlegar), pedidas = [];
  [[i0, j0], [i0 + 1, j0], [i0, j0 + 1], [i0 + 1, j0 + 1]].forEach(([i, j], s) => {
    // (las que no hacen falta no se piden; pero si ya estaban, se usan)
    const t = !falta || falta[s] ? pedir(i, j) : teselas.get(`${i}-${j}`);
    if (t) { t.uso = turno; if (!falta || falta[s]) pedidas.push(t.lista); }
    U.uFinoOn.value[s] = t?.tex ? 1 : 0;
    if (!t?.tex) { U.tFino.value[s] = U.tMedio.value; return; }
    U.tFino.value[s] = t.tex;
    U.uFino.value[s].set((t.i * TES) / laminas.ancho, (t.j * TES) / laminas.alto, Math.min(TES, laminas.ancho - t.i * TES) / laminas.ancho, Math.min(TES, laminas.alto - t.j * TES) / laminas.alto);
  });
  if (teselas.size > (liviano ? 6 : 12)) for (const [key, t] of teselas) if (t.tex && turno - t.uso > (liviano ? 240 : 600)) { t.tex.dispose(); teselas.delete(key); }
  return Promise.all(pedidas);
}

// --- lo de hoy: los lugares actuales y, estampado en rojo sobre el plano, el mapa actual (calles, vías, costa y la
// tierra ganada al río; de OpenStreetMap, ver tools/hoy.mjs). Las dos láminas se piden recién la primera vez: con la
// de lejos (liviana) ya se muestra; la de cerca, con todas las calles, se suma cuando llega. ---
let hoy = false, hoyK = 0, hoyListo = false, hoyPedido = null;
function mapaDeHoy() {
  hoyPedido ??= lamina('plano/hoy-lejos.webp', true).then((t) => {
    U.tHoyLejos.value = t; if (!U.tHoyCerca.value) { U.tHoyCerca.value = t; U.uHoyRes.value = laminas.ancho / 2048; }
    hoyListo = true; hoyK = Math.min(hoyK, 0.001); pedirCuadro(3);
    return maxTex < 8192 ? null : lamina('plano/hoy-cerca.webp').then((c) => { U.tHoyCerca.value = c; U.uHoyRes.value = laminas.ancho / 8192; pedirCuadro(3); }).catch(() => {});
  }).catch(() => {});
  return hoyPedido;
}
// --- en color: la misma ciudad, pintada (src/tinta.js). La lámina que dice qué es cada punto del suelo (río, patio,
// edificado) se pide recién la primera vez. ---
let color = false, colorK = 0, colorListo = false, colorPedido = null, patios = null, patiosPedido = null;
// (y con ella, los árboles y aljibes de los patios, que solo existen en color: src/patios.js)
function suelo() {
  patiosPedido ??= loadPatios().then((d) => { patios = createPatios(d, meta, tinta, { liviano }); scene.add(patios.group); pedirCuadro(3); }).catch(() => { patiosPedido = null; });
  colorPedido ??= lamina(liviano ? 'plano/suelo-2k.webp' : 'plano/suelo.webp', true).then((t) => { U.tSuelo.value = t; colorListo = true; pedirCuadro(3); lamina(liviano ? 'plano/calles-2k.webp' : 'plano/calles.webp', true).then((c) => { U.tCalles.value = c; pedirCuadro(3); }).catch(() => {}); }).catch(() => { colorPedido = null; });
  return colorPedido;
}
// la ayuda de arriba: con el dedo, otros gestos
const conDedo = matchMedia('(pointer: coarse)').matches;
// el recuadro de información (#titulo): qué es y cómo se maneja. Arranca guardado en un botón «?», que lo abre y lo
// cierra (body.info). «¿Qué estoy viendo?», adentro, abre el cartel de entrada.
if (conDedo) document.querySelector('#titulo .como').innerHTML = ['un dedo mueve', 'dos dedos acercan, giran e inclinan', 'dos toques acercan', 'tocá un nombre para ir'].map((t) => `<span>${t}</span>`).join(' · ');
const info = { chico: matchMedia('(max-width: 640px), (max-height: 500px)'), poner(si) { document.body.classList.toggle('info', si); $('titulo').setAttribute('aria-expanded', String(si)); $('titulo').title = si ? '' : 'Qué es esto y cómo se maneja'; } };
info.poner(false);
$('titulo').addEventListener('click', (e) => {
  const abierto = document.body.classList.contains('info');
  if (abierto && e.target.closest('.acerca')) { info.poner(false); return; } // (y sigue: el cartel de entrada se abre)
  e.stopImmediatePropagation(); info.poner(!abierto);
}, true);
// (en el teléfono es un cartel de paso, para no tapar la ciudad: se guarda al tocar el plano, al abrirse una ficha
// —que sube desde abajo, por donde va— y al entrar a caminar, volar o manejar)
new MutationObserver(() => { const b = document.body.classList; if (b.contains('info') && (b.contains('modo') || (b.contains('ficha') && info.chico.matches))) info.poner(false); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
renderer.domElement.addEventListener('pointerdown', () => { if (info.chico.matches && document.body.classList.contains('info')) info.poner(false); });
const calles = createCalles(camera, cam, { mundo: (px, py) => [(px - plaza[0]) * metro, (py - plaza[1]) * metro], suelo: (x, z) => altoVivo(x, z) });

// --- la ciudad y lo que depende de ella: llegan en la segunda etapa ---
// El relieve va exagerado al doble: la barranca real son 15 m en tres cuadras y, a escala justa, desde el aire no se
// nota. Está apagado: el plano se ve llano, y solo se prende con `?relieve` (o `?relieve=1`, a escala, o el número que
// se quiera).
const EXAG = !q.has('relieve') ? 0 : Math.min(5, Math.max(0, parseFloat(q.get('relieve')) || 2));
let relieve = null; const alto = (x, z) => (relieve ? relieve.en(x, z) * EXAG : 0);
// (y la altura que se ve en este momento: el terreno sube con la misma ola que levanta la ciudad)
const altoVivo = (x, z) => { if (!relieve) return 0; const k = Math.min(1, Math.max(0, (U.uFront.value - Math.hypot(x, z)) / 300)); return relieve.en(x, z) * EXAG * k * k * (3 - 2 * k); };
let datos = null, hitos = null, ciudad = null, marcas = null, ficha = null, buscador = null, modos = null, tren = null, juego = null;
const FONDO = scene.background, CIELO = tal(0xe6d9bd), CELESTE = tal(0xc3d3da), cielo = new THREE.Color(); // (a pie y en avión se ve el horizonte: el cielo es papel)

// --- levantar y acostar la ciudad: una ola que sale de la plaza ---
const LEJOS = 9500; // más lejos que la última casa
const ALTO_ENTERA = 2200; // (desde más arriba se ve casi todo el pliego: las mallas van enteras, src/trozos.js)
let arriba = false, frente = -400, falla = false;
function rotular() { $('alzar').textContent = falla ? 'No cargó: reintentar' : !arriba ? 'Levantar la ciudad' : ciudad ? 'Volver al plano' : 'Cargando la ciudad…'; }
function levantar(on) { arriba = on; rotular(); document.body.classList.toggle('arriba', on); pedirCuadro(3); }
let callesVivas = false;
/** Avanza `dt` segundos y, si algo cambió (o se lo pide con `si`), dibuja. Devuelve si dibujó. */
function frame(dt, si = false) {
  // (mientras la ciudad no llegó, la ola espera)
  const v = !arriba ? -5200 : ciudad ? 1500 + Math.max(0, frente) * 0.55 : 0, f0 = frente, h0 = hoyK;
  frente = Math.min(LEJOS, Math.max(-400, frente + v * dt));
  const c0 = colorK; colorK = !colorListo ? 0 : capture ? +color : color ? Math.min(1, colorK + dt / 0.9) : Math.max(0, colorK - dt / 0.6);
  hoyK = capture ? +hoy : hoy ? Math.min(1, hoyK + dt / 0.7) : Math.max(0, hoyK - dt / 0.45);
  // a pie o en avión la cámara la lleva src/modos.js; acá solo se anota qué se está mirando, para las sombras y las láminas
  const enModo = !!modos?.activo; let anda = false;
  if (enModo) { anda = modos.actualizar(dt); cam.now.x = modos.vista.x; cam.now.z = modos.vista.z; cam.now.dist = modos.vista.dist; } else cam.update(dt);
  // el tren anda siempre, pero solo pide dibujar si se lo ve moverse (src/tren.js)
  const pasa = tren?.actualizar(dt, camera, frente) ?? false;
  const funde = epocas.update(dt, capture); if (crece) crece.mesh.visible = U.uEpocaK.value > 0;
  if (!(si || pasa || funde || cuadros > 0 || (enModo ? anda : !cam.quieta) || frente !== f0 || hoyK !== h0 || colorK !== c0 || callesVivas)) return false;
  const pedido = cuadros > 0; cuadros = Math.max(0, cuadros - 1);
  U.uFront.value = frente;
  U.uColor.value = pagina.U.uColor.value = colorK * colorK * (3 - 2 * colorK);
  if (enModo) scene.background = cielo.copy(CIELO).lerp(CELESTE, U.uColor.value); // (el cielo: papel, o celeste si está en color)
  U.uHoy.value = hoyListo ? hoyK * hoyK * (3 - 2 * hoyK) : 0;
  // (en avión, en un teléfono, no se piden láminas finas: se pasa demasiado rápido para aprovecharlas, y pesan)
  if (enModo) { if (!(liviano && modos.vuela)) afinar(modos.vista, false, camera); } else if (cam.destino.dist < 5200) afinar(cam.destino);
  trozosEnteros(camera.position.y > ALTO_ENTERA);
  ciudad?.detalle(camera.position);
  patios?.detalle(camera.position, U.uColor.value);
  marcas?.update(frente, enModo ? modos.cerca : null, epocas.etapa); // (cada marca, en los años en que vale)
  callesVivas = calles.update(enModo ? 0 : U.uHoy.value, dt, capture) && !capture;
  juego?.update(); // (los alfileres del juego de las fotos siguen a la cámara)
  // la sombra se calcula solo alrededor de lo que se mira
  // (el tamaño va de a escalones —si cambiara con cada paso del acercamiento, la grilla de la sombra cambiaría en cada
  // cuadro y los bordes titilarían— y el centro se mueve de a 16 puntos enteros de la sombra, medidos sobre los ejes
  // de la luz y no sobre los del plano: así, al correrse, cada punto de la sombra cae donde caía y nada tiembla)
  const s = Math.min(3600, 420 * 2 ** (Math.ceil(Math.log2(Math.max(1, (cam.now.dist * 0.95) / 420)) * 2) / 2)), c = sol.shadow.camera, step = (2 * s) / SOMBRA * 16;
  const la = Math.round((cam.now.x * LUZ.xx + cam.now.z * LUZ.xz) / step) * step, lb = Math.round((cam.now.x * LUZ.yx + cam.now.z * LUZ.yz) / step) * step;
  const tx = (la * LUZ.yz - lb * LUZ.xz) / LUZ.det, tz = (lb * LUZ.xx - la * LUZ.yx) / LUZ.det;
  // La sombra se vuelve a calcular solo si cambió: si se corrió o cambió de tamaño, o si el cuadro se dibuja por algo
  // más que la cámara (la ola, el cambio de año, el tren, algo que llegó), o a pie, en auto o en avión, donde hay cosas
  // que se mueven. Girando o inclinando la vista sobre el mismo lugar, es la misma: la mitad del trabajo del cuadro.
  const otra = la !== sombraEn.a || lb !== sombraEn.b || s !== sombraEn.s;
  if (otra || si || pasa || funde || pedido || enModo || frente !== f0 || camera.position.distanceToSquared(sombraEn.ojo) > 6400) {
    sombraEn.a = la; sombraEn.b = lb; sombraEn.s = s; sombraEn.ojo.copy(camera.position); sol.shadow.needsUpdate = true;
    sol.target.position.set(tx, 0, tz); sol.position.set(tx, 0, tz).addScaledVector(SOL, s * 3 + 400);
    if (c.right !== s) { c.left = c.bottom = -s; c.right = c.top = s; c.near = 10; c.far = s * 6 + 800; c.updateProjectionMatrix(); }
    sol.target.updateMatrixWorld();
  }
  sol.castShadow = !!ciudad && frente > -300;
  pagina.render(scene, camera);
  return true;
}

$('alzar').addEventListener('click', () => { if (falla) { location.reload(); return; } levantar(!arriba); if (arriba && cam.now.pitch > 1.2) cam.flyTo(VISTA, 5); });
addEventListener('keydown', (e) => { if (e.target?.tagName === 'INPUT') return; if (e.code === 'Space' && !e.repeat && !modos?.activo) { e.preventDefault(); $('alzar').click(); } else if (e.code === 'KeyH' && !e.repeat) $('hoy').click(); else if (e.code === 'KeyC' && !e.repeat) $('color').click(); });
// en color, o en tinta
$('color').addEventListener('click', () => {
  color = !color; $('color').classList.toggle('on', color); $('color').setAttribute('aria-pressed', color); $('color').title = color ? 'Volver a la tinta' : 'Ver en color'; $('color').setAttribute('aria-label', $('color').title);
  if (color) suelo(); pedirCuadro(3);
});
// la línea de tiempo: al salir de 1867 se suman las casas de los planos que siguen (src/epocas.js). Lo que crece se
// baja recién entonces: las casas nuevas (otra malla como la de la ciudad) y la lámina del «desde cuándo» del suelo.
let crece = null;
const epocas = createEpocas($('epocas'), U, {
  pedirCuadro,
  async cargar() {
    await pDatos;
    const [d, t, t2] = await Promise.all([loadCrece(), lamina(liviano ? 'plano/crece-2k.webp' : 'plano/crece.webp', true), lamina(liviano ? 'plano/despeje-2k.webp' : 'plano/despeje.webp', true)]);
    while (!ciudad) { if (falla) throw new Error('sin ciudad'); await new Promise((r) => setTimeout(r, 60)); }
    U.tCrece.value = t; U.tDespeje.value = t2; const t0 = performance.now(); crece = createCrece({ ...d, meta }, meta, tinta); crece.datos = { ...d, meta }; scene.add(crece.mesh);
    marcarMueren(ciudad.casas, datos, d); modos?.sumar(crece.datos); lab.tiempos.crece = Math.round(performance.now() - t0);
  },
  alCambiar(año) {
    // (el título dice de qué año es lo que se mira; si la ciudad estaba acostada, se levanta: lo que crece son casas)
    document.querySelector('#titulo h1').textContent = `Buenos Aires, ${año}`; document.body.classList.toggle('epoca', año !== 1867);
    const bajada = document.querySelector('#titulo p'); bajada.dataset.de67 ??= bajada.textContent; bajada.textContent = año === 1867 ? bajada.dataset.de67 : 'La ciudad del plano de 1867 y cómo cambió después: lo que creció y lo que se abrió, según los planos de cada época.';
    // (la cámara no se toca: se cambia de año mirando el mismo lugar, para comparar)
    if (año !== 1867 && !arriba && !falla) levantar(true);
  },
});
// los lugares de hoy, sobre el plano de entonces
$('hoy').addEventListener('click', () => {
  hoy = !hoy; marcas?.hoy(hoy); $('hoy').textContent = hoy ? 'Ocultar lo de hoy' : 'Ver lo de hoy'; $('hoy').classList.toggle('on', hoy); document.body.classList.toggle('hoy', hoy);
  if (hoy) { mapaDeHoy(); calles.cargar().then(() => pedirCuadro(3)); }
  pedirCuadro(3);
});

// --- las láminas que siguen, una vez que llegó la ciudad (para no pelearle el ancho de banda: con la red lenta, lo
// que se espera es poder levantarla). En una pantalla grande: la de 2048 y después la de 8192, que pesa 9 MB y tarda.
// En un teléfono: directo la de 4096 (2 MB), que le alcanza a su pantalla; la de 2048 sería bajar de más. ---
const niveles = (async () => {
  await pDatos.catch(() => {});
  const soloChica = maxTex < 4096 || q.has('chico');
  if (GRANDE || soloChica) { try { medio(await lamina('plano/chico.webp'), 2048); } catch { /* se queda con la primera */ } }
  if (soloChica) return;
  try { medio(await lamina(GRANDE ? 'plano/medio.webp' : 'plano/medio-4k.webp'), ANCHO_MEDIO); } catch { /* se queda con la que tenía */ }
})();

window.lab = {
  renderer, scene, camera, cam, tinta, pagina, calles, liviano, epocas, Vector3: THREE.Vector3, suelo: (x, z) => alto(x, z),
  get ciudad() { return ciudad; }, get juego() { return juego; }, get crece() { return crece; }, get patios() { return patios; }, get hitos() { return hitos; }, get modos() { return modos; }, get tren() { return tren; }, get datos() { return datos; }, get marcas() { return marcas; }, get buscador() { return buscador; }, get ficha() { return ficha; },
  /** (para las capturas) espera a que estén las texturas de lo que se está mirando */
  finas: () => Promise.all([niveles, afinar(cam.goal, true), hoy ? mapaDeHoy() : null, hoy ? calles.cargar() : null, epocas.lista_(), color ? suelo() : null, color ? patiosPedido : null]),
  step(secs = 1 / 60, n = 1) { for (let i = 0; i < n; i++) frame(secs, true); },
  levantar, ver(v) { cam.jump({ ...cam.goal, ...v }); cam.auto = false; pedirCuadro(3); }, frente(v) { frente = v; arriba = v > 0; pedirCuadro(3); }, VISTA, ENTERO,
  /** cuántos cuadros se dibujaron y a qué tamaño (para las pruebas) */
  cuenta: { cuadros: 0, puntos: PUNTOS },
};

// --- etapa 1: el plano a la vista ---
fit(); frame(0, true);
$('loading').remove(); document.body.classList.add('listo');
if (!capture) {
  // el reloj. Si el equipo no llega a dibujar a buen ritmo, se achica el dibujo (y se lo vuelve a agrandar si después
  // sobra): en un teléfono viejo vale más que se mueva fluido a que cada línea sea finísima.
  const ESCALAS = [1, 0.85, 0.72, 0.6]; let nivel = 0, antes = false, n = 0, lentos = 0, holgados = 0, subidas = 1;
  const escalar = (k) => { nivel = k; renderer.setPixelRatio(PUNTOS * ESCALAS[k]); pagina.resize(); lab.cuenta.puntos = PUNTOS * ESCALAS[k]; n = lentos = holgados = 0; pedirCuadro(3); };
  let last = performance.now(); const arranque = last;
  renderer.setAnimationLoop(() => {
    const now = performance.now(), real = (now - last) / 1000, dt = Math.min(0.05, real); last = now;
    if (document.hidden) { antes = false; return; }
    const dibujo = frame(dt);
    if (dibujo) lab.cuenta.cuadros++;
    // (solo cuenta el tiempo entre dos cuadros seguidos, pasado el arranque; un tirón suelto no dice nada)
    if (dibujo && antes && now - arranque > 4000 && real < 0.4) {
      n++; if (real > 0.027) lentos++;
      if (n >= 30) {
        if (lentos > 18 && nivel < ESCALAS.length - 1) escalar(nivel + 1);
        else { holgados = lentos <= 1 ? holgados + 1 : 0; n = lentos = 0; if (holgados >= 8 && nivel > 0 && subidas > 0) { subidas--; escalar(nivel - 1); } }
      }
    }
    antes = dibujo;
  });
}

// --- etapa 2: la ciudad, las marcas, las fichas y el buscador ---
try {
  datos = await pDatos;
  // el relieve llega con la ciudad (acostado, el plano es una hoja lisa); si no llega, todo queda a nivel
    if (EXAG > 0) try { relieve = await loadRelieve({ plaza, metro, ancho: laminas.ancho, alto: laminas.alto }); U.tRelieve.value = relieve.tex; U.uRelieve.value = EXAG; } catch (e) { console.warn(e); }
  const t0 = performance.now(); hitos = createHitos(datos, tinta);
  const t1 = performance.now(); ciudad = createCiudad(datos, tinta, hitos.arboles, { liviano });
  lab.tiempos = { hitos: Math.round(t1 - t0), ciudad: Math.round(performance.now() - t1) }; // (cuánto tardó en armarse cada cosa, en ms: tools/ritmo.mjs)
  scene.add(ciudad.group, hitos.mesh);
  tren = createTren(tinta, { mundo: (px, py) => [(px - plaza[0]) * metro, (py - plaza[1]) * metro], alto: () => renderer.domElement.height, etapa: () => epocas.etapa, liviano });
  scene.add(tren.grupo);
  const deHoy = await pDeHoy, mundo = (px, py) => [(px - plaza[0]) * metro, (py - plaza[1]) * metro];
  const iglesias = hitos.iglesias.filter((g) => g.nombre !== 'iglesia' && g.nombre !== 'catedral');
  // (para el buscador y para decir por dónde se camina, las referencias son las de 1867: las marcas que no trae la línea de tiempo)
  const DE1867 = LUGARES.filter((l) => !l[6]?.desde);
  // las marcas: los lugares con nombre. Al tocar una, la cámara va hasta ahí.
  marcas = q.has('limpio') ? null : createMarcas($('marcas'), camera, cam, {
    mundo,
    suelo: altoVivo,
    lugares: [...LUGARES, ...iglesias.map((g) => [g.nombre, g.x, g.y, g.alto, 3, '']), ...deHoy.map((h) => [h.nombre, h.x, h.y, 0, h.nivel, h.nota, true])],
    alIr: (m) => { const a = { x: m.x, z: m.z, dist: Math.min(cam.goal.dist, Math.max(m.nivel === 1 ? 950 : 430, m.alto * 6.5)) /* (a una torre se la mira de más lejos: si no, la punta y su etiqueta quedan fuera) */, ...(arriba ? { pitch: Math.min(cam.goal.pitch, 0.55) } : {}) }; ficha?.abrir(m, a); cam.flyTo(a, 2.6); if (m.nombre === 'Estación del Parque') tren?.salir(); pedirCuadro(3); },
  });
  if (q.has('limpio')) document.body.classList.add('limpio');
  if (marcas) {
    marcas.hoy(hoy);
    const [{ createFicha }, { createBuscador, dondeQueda }, { createModos }] = await pModulos;
    // la ficha de cada lugar: al tocar una marca (o el edificio), una hoja al costado con su historia y fotos de época
    ficha = createFicha({ camera, cam, lienzo: renderer.domElement, marcas, U, pedirCuadro, junto: hitos.junto, etapa: () => epocas.etapa });
    // el buscador de direcciones (y los nombres de las calles de hoy, que se escriben al acercarse con lo de hoy prendido)
    buscador = createBuscador({
      hoja: { ancho: laminas.ancho, alto: laminas.alto, plaza }, marco: meta.plano.marco, metro, mz: datos.mz, calles,
      referencias: [...DE1867.map((l) => [l[0], l[1], l[2], false]), ...iglesias.map((g) => [g.nombre, g.x, g.y, true])],
      alHallar(r) {
        if (!hoy) $('hoy').click();
        const m = marcas.poner(r.nombre, r.px, r.py, r.nota);
        cam.flyTo({ x: m.x, z: m.z, dist: Math.min(cam.goal.dist, 650), ...(arriba ? { pitch: Math.min(cam.goal.pitch, 0.6) } : {}) }, capture ? 0.001 : 2.8);
        pedirCuadro(3);
      },
      alQuitar: () => { marcas.quitar(); pedirCuadro(3); },
    });
    // a pie y en avión
    modos = createModos({
      camera, scene, tinta, suelo: alto, datos, hitos, calles, etapa: () => epocas.etapa, epocas, limites: [X0, Z0, X0 + AN, Z0 + AL],
      lugares: [...DE1867.map((l) => { const [x, z] = mundo(l[1], l[2]); return { nombre: l[0], x, z, iglesia: false }; }), ...iglesias.map((g) => { const [x, z] = mundo(g.x, g.y); return { nombre: g.nombre, x, z, iglesia: true }; })],
      describir: (d, de, dn, l) => dondeQueda(d, de, dn, l.nombre, l.iglesia),
      alEntrar(cual, venia) {
        if (!venia) { if (!arriba) levantar(true); ficha.cerrar(); marcas.cerrar(); scene.background = CIELO; mesa.visible = false; }
        pedirCuadro(3);
      },
      alSalir(v) {
        scene.background = FONDO; mesa.visible = true; camera.fov = FOV;
        cam.jump(v); cam.auto = false; fit();
      },
    });
    if (crece) modos.sumar(crece.datos);
    // «Recorrer»: en una pantalla grande, los tres modos van guardados en un botón que los despliega (index.html)
    {
      const rec = $('recorrer'), poner = (si) => { document.body.classList.toggle('recorrer', si); rec.setAttribute('aria-expanded', String(si)); };
      rec.addEventListener('click', () => { const r = rec.getBoundingClientRect(); document.body.style.setProperty('--rx', `${r.left}px`); document.body.style.setProperty('--rw', `${r.width}px`); poner(!document.body.classList.contains('recorrer')); });
      // (se guarda al elegir un modo, al tocar cualquier otra cosa, con Escape y si cambia el tamaño de la ventana)
      addEventListener('pointerdown', (e) => { if (document.body.classList.contains('recorrer') && !e.target.closest?.('#recorrer, #modos')) poner(false); }, true);
      $('modos').addEventListener('click', () => poner(false));
      addEventListener('keydown', (e) => { if (e.code === 'Escape') poner(false); });
      addEventListener('resize', () => poner(false));
    }
    // el juego de las fotos (src/juego.js): se baja recién al tocar «Jugar» (o con `?juego`, o desde el cartel de entrada)
    let pJuego = null;
    const jugar = () => (pJuego ??= import('./juego.js').then(({ createJuego }) => {
      juego = createJuego({
        camera, cam, lienzo: renderer.domElement, marcas, pedirCuadro,
        lejos: () => ({ x: 0, z: -1900, dist: Math.min(ENTERO.dist, 7600) }), // (el casco viejo y sus alrededores: de ahí son casi todas las fotos)
        alEntrar() { if (modos?.activo) $('salir').click(); ficha.cerrar(); marcas.cerrar(); info.poner(false); if (!arriba && !falla) levantar(true); },
        alSalir() { pedirCuadro(3); },
      });
      return juego;
    })).then((j) => { j.empezar(); pedirCuadro(3); return j; });
    $('jugar').hidden = false; $('jugar').addEventListener('click', () => { if (juego?.activo) juego.salir(); else jugar(); });
    addEventListener('jugar', jugar); lab.jugar = jugar;
    if (quiereJugar) jugar();
    // a pie y en coche se arranca siempre en la Plaza de Mayo, de cara a la Pirámide y a la Casa de Gobierno (en el
    // plano, +y es hacia el río): a pie adentro de la plaza, del lado del Cabildo; el coche en la calle que la bordea
    // por el norte (Rivadavia), frente a la Catedral. El avión, en cambio, despega hacia lo que se estaba mirando.
    const enLaPlaza = (px, py) => ({ x: (px - plaza[0]) * metro, z: (py - plaza[1]) * metro, yaw: Math.PI, dist: 500 });
    const arranque = { caminar: enLaPlaza(10344, 9440), manejar: enLaPlaza(10435, 9440) };
    modos.desde = (cual) => arranque[cual] ?? (cam.goal.dist > 6000 ? { x: 0, z: 0, yaw: VISTA.yaw, dist: 1500 } : { x: cam.goal.x, z: cam.goal.z, yaw: cam.goal.yaw, dist: cam.goal.dist });
  }
} catch (e) {
  console.error(e); falla = true;
}
rotular(); pedirCuadro(3);
if (q.has('hoy')) $('hoy').click();
// Arranca en color; quien lo apaga (el botón o la tecla C) lo encuentra apagado la próxima vez. `?tinta` y `?color`
// lo fuerzan. (En las capturas de las herramientas, ?capture, sigue arrancando en tinta salvo que se pida ?color.)
{
  let guardado = null; try { guardado = localStorage.getItem('color'); } catch { /* sin almacenamiento */ }
  if (q.has('color') || (!q.has('tinta') && !capture && guardado !== '0')) $('color').click();
  $('color').addEventListener('click', () => { try { localStorage.setItem('color', color ? '1' : '0'); } catch { /* da igual */ } });
}
if (capture) frame(0, true);
else {
  // la presentación: primero el cartel; al cerrarlo, un momento para ver el plano, y arriba
  (intro ? intro.cerrada : Promise.resolve()).then(() => {
    setTimeout(() => { if (!arriba && !falla && !q.has('plano')) $('alzar').click(); }, intro ? 900 : 1600);
  });
}
// `?lugar=Nombre&año=1921`: llega derecho a un lugar, en su año y con la ficha abierta (así enlaza edificios.html)
if (q.has('lugar') && marcas) epocas.lista_().then(() => {
  const año = +q.get('año') || 1867, e = Math.max(0, epocas.lista.indexOf(año)), nombre = q.get('lugar');
  if (e > 0) epocas.elegir(año);
  const m = marcas.marcas.find((m) => !m.hoy && m.nombre === nombre && m.desde <= e && (!m.hasta || e < m.hasta)) ?? marcas.marcas.find((m) => !m.hoy && m.nombre === nombre);
  setTimeout(() => { if (!arriba && !falla) levantar(true); }, 500);
  // (la marca vale recién cuando la línea de tiempo llegó a su año: hasta 1940 son varios segundos)
  let veces = 0;
  const abrir = () => { if (!m) return; if (m.vale && arriba) m.el.querySelector('.tag').click(); else if (++veces < 80) setTimeout(abrir, 250); };
  setTimeout(abrir, 700);
});
// `?vitrina`: el visor metido en otra página, que lo maneja con mensajes (src/vitrina.js)
if (q.has('vitrina')) import('./vitrina.js').then(({ createVitrina }) => { lab.vitrina = createVitrina({ cam, epocas, U, hitos: () => hitos, levantar, pedirCuadro, plano: meta.plano, vista: VISTA, lienzo: renderer.domElement }); });
{ const retrato = document.querySelector('#firma img'); if (retrato) retrato.src = u('autor.webp'); } // (la firma, arriba a la derecha)
window.lab.ready = true;
