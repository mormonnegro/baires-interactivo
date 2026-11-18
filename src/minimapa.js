// El mapita de «Manejar»: un redondel en la esquina, como el de los juegos de autos, con las manzanas y las calles de
// alrededor vistas desde arriba. Gira con la cámara (lo de adelante queda arriba), el coche es la flecha del medio y
// una N en el borde dice dónde quedó el norte. Cuanto más rápido se va, más lejos muestra.
// No tiene un dibujo propio: sale de las mismas láminas con que se pinta el suelo en color (tools/crece.mjs) —la que
// dice qué es río, patio o edificado en 1867, la de lo que creció con los años y la de lo que se despejó para las
// avenidas y las plazas—, así que muestra la ciudad del año que se está mirando: la Avenida de Mayo recién aparece en
// 1895, las diagonales en 1921, y el río se va corriendo con el puerto.
// De las tres láminas se guarda, por punto, un solo número (desde cuándo es cada cosa); en cada cuadro se pinta a mano
// el redondel, punto por punto, girado y a la escala que toque. Lo carga src/autos.js, que recién se baja al tocar
// «Manejar»: quien no maneja no paga nada de esto.
import { pedir } from './url.js';
import { etapaDeCodigo } from './etapas.js';

const CSS = `
#minimapa { left: calc(26px + var(--sl)); bottom: calc(172px + var(--sb)); width: 168px; height: 168px; display: none; border-radius: 50%; overflow: hidden; }
body.modo-manejar #minimapa { display: block; }
#minimapa canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; border-radius: 50%; }
#minimapa .aro { position: absolute; inset: 0; border-radius: 50%; box-shadow: inset 0 0 0 3px #f1e6cd, inset 0 0 0 4px #2a221b99, inset 0 0 18px #2a221b40; }
#minimapa .flecha { position: absolute; left: 50%; top: 50%; width: 26px; height: 26px; margin: -13px 0 0 -13px; overflow: visible; }
#minimapa .norte { position: absolute; left: 50%; top: 50%; width: 18px; height: 18px; margin: -9px 0 0 -9px; border-radius: 50%; background: #2a221b; color: #f7eedb; font: 600 11px/18px "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif; text-align: center; }
@media (max-width: 640px) { #minimapa { left: calc(14px + var(--sl)); bottom: calc(228px + var(--sb)); width: 116px; height: 116px; } }
@media (max-height: 500px) { #minimapa { left: auto; right: calc(14px + var(--sr)); bottom: auto; top: calc(12px + var(--st)); width: 104px; height: 104px; } }
`;
// De qué va pintada cada cosa (los tonos del papel y de la tinta, como los paneles): la calle y el suelo abierto, los
// fondos de las manzanas, lo edificado, el río, el verde de las plazas nuevas y lo que queda fuera del pliego.
const CALLE = 0, PATIO = 1, CASAS = 2, AGUA = 3, VERDE = 4, FUERA = 5;
const TONOS = [[240, 229, 204], [205, 188, 152], [146, 118, 93], [157, 184, 191], [158, 172, 112], [216, 203, 174]];
const CERCA = 210, POR_VELOCIDAD = 9, LEJOS = 520; // cuántos metros muestra hacia cada lado: parado, lo que suma cada m/s, y el tope

/**
 * @param U        los uniformes de src/tinta.js (de ahí salen las medidas del pliego y cuántas etapas hay)
 * @param etapa()  la etapa de la línea de tiempo que se mira (0 = 1867)
 */
export function createMinimapa({ U, etapa }) {
  document.head.appendChild(Object.assign(document.createElement('style'), { textContent: CSS }));
  const el = Object.assign(document.createElement('div'), { id: 'minimapa', className: 'panel' }); el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<canvas></canvas><div class="aro"></div><svg class="flecha" viewBox="-13 -13 26 26"><path d="M0-10.500 7.500 8.500 0 4.500-7.500 8.500z" fill="#a03220" stroke="#f7eedb" stroke-width="1.6" stroke-linejoin="round"/></svg><div class="norte">N</div>';
  document.body.appendChild(el);
  const lienzo = el.querySelector('canvas'), ctx = lienzo.getContext('2d'), flecha = el.querySelector('.flecha'), norte = el.querySelector('.norte');

  // ---------- las láminas: de cada punto, desde cuándo es cada cosa, en un solo número ----------
  // De a tres bits: a · hasta qué etapa es río (0: nunca lo fue, 7: siempre) · b · desde cuándo está edificado (1: desde
  // 1867, 2: desde la etapa 1…; 0: nunca) · p · lo mismo para los fondos · d · desde qué etapa está despejado para una
  // avenida o una plaza · v · desde cuál es verde nuevo.
  // (en una máquina con poca memoria, o en un teléfono, las láminas chicas: las mismas que usa ahí el suelo)
  const chicas = (navigator.deviceMemory ?? 8) < 4 || Math.min(screen.width, screen.height) < 600, sufijo = chicas ? '-2k' : '';
  let cod = null, w = 0, h = 0, sucio = true;
  const pausa = () => new Promise((r) => setTimeout(r, 0));
  /** Lee una lámina de a tiras (para no trabar el manejo mientras tanto) y le pasa cada tira a `anotar(datos, desde, cuántos)`. */
  async function leer(ruta, anotar) {
    const r = await pedir(ruta); if (!r.ok) throw new Error(ruta);
    const bmp = await createImageBitmap(await r.blob(), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
    if (!cod) { w = bmp.width; h = bmp.height; cod = new Uint16Array(w * h); } else if (bmp.width !== w || bmp.height !== h) { bmp.close?.(); throw new Error(`${ruta}: otra medida`); }
    const TIRA = 192, c = Object.assign(document.createElement('canvas'), { width: w, height: TIRA }), g = c.getContext('2d', { willReadFrequently: true });
    for (let y = 0; y < h; y += TIRA) {
      const n = Math.min(TIRA, h - y); g.clearRect(0, 0, w, TIRA); g.drawImage(bmp, 0, y, w, n, 0, 0, w, n);
      anotar(g.getImageData(0, 0, w, n).data, y * w, w * n); sucio = true; await pausa();
    }
    bmp.close?.();
  }
  // De cada punto se guardan cinco cosas en un número de 16 bits, una sobre otra (a + 9·(b + 9·(p + 9·(d + 8·v)))):
  //   a  0 tierra · 1…7 río hasta esa etapa (tierra ganada) · 8 río siempre
  //   b  0 nada · 1 edificado en 1867 · 2…8 edificado desde la etapa b − 1        p  lo mismo, el patio o el fondo
  //   d  0 nada · 1…7 despejado desde esa etapa                                    v  lo mismo, el verde nuevo
  // (con ocho etapas ya no entran de a tres bits cada una)
  const RIO = 8, KB = 9, KP = 81, KD = 729, KV = 5832, NQUE = 9 * 9 * 9 * 8 * 8;
  const listo = (async () => {
    await leer(`plano/suelo${sufijo}.webp`, (d, o, n) => { for (let i = 0; i < n; i++) cod[o + i] = (d[i * 4] > 127 ? RIO : 0) + (d[i * 4 + 2] > 127 ? KB : 0) + (d[i * 4 + 1] > 127 ? KP : 0); });
    const de = new Uint8Array(256); for (let v = 0; v < 256; v++) de[v] = etapaDeCodigo(v); // (la etapa en que llega lo que la lámina anota con v: src/etapas.js)
    await leer(`plano/crece${sufijo}.webp`, (d, o, n) => {
      for (let i = 0; i < n; i++) {
        const r = de[d[i * 4]], f = de[d[i * 4 + 1]], b = de[d[i * 4 + 2]]; if (!(r | f | b)) continue;
        let c = cod[o + i];
        if (r && c % 9 === RIO) c += r - RIO;
        if (b && !(((c / KB) | 0) % 9)) c += (b + 1) * KB;
        if (f && !(((c / KP) | 0) % 9)) c += (f + 1) * KP;
        cod[o + i] = c;
      }
    }).catch(() => {});
    await leer(`plano/despeje${sufijo}.webp`, (d, o, n) => { for (let i = 0; i < n; i++) { const r = de[d[i * 4]], v = de[d[i * 4 + 1]]; if (r | v) cod[o + i] += r * KD + v * KV; } }).catch(() => {});
  })().catch((e) => console.warn('el mapita no se pudo armar:', e));

  // qué es cada número en la etapa que se mira (se rehace al cambiar de año)
  const que = new Uint8Array(NQUE); let etapaVista = -1;
  function rotular(e) {
    etapaVista = e;
    for (let c = 0; c < que.length; c++) {
      const a = c % 9, b = ((c / KB) | 0) % 9, p = ((c / KP) | 0) % 9, d = ((c / KD) | 0) % 8, v = (c / KV) | 0;
      que[c] = a === RIO || (a && e < a) ? AGUA : v && e >= v ? VERDE : d && e >= d ? CALLE : b && e >= b - 1 ? CASAS : p && e >= p - 1 ? PATIO : CALLE;
    }
  }
  // (los colores, como los quiere el lienzo: de a un punto de 32 bits, con el rojo en el byte más bajo)
  const T32 = new Uint32Array(TONOS.map(([r, g, b]) => (255 << 24) | (b << 16) | (g << 8) | r));

  // ---------- el dibujo ----------
  let imagen = null, d32 = null, N = 0;
  const visto = { x: NaN, z: NaN, rumbo: NaN, radio: NaN, apunta: NaN }; let radio = CERCA;
  function pintar(x, z, rumbo) {
    const lado = el.clientWidth; if (!lado) return false; // (todavía no está a la vista)
    const n = Math.round(lado * Math.min(devicePixelRatio || 1, 2));
    if (n !== N) { N = n; lienzo.width = lienzo.height = N; imagen = ctx.createImageData(N, N); d32 = new Uint32Array(imagen.data.buffer); }
    if (!cod) { d32.fill(T32[FUERA]); ctx.putImageData(imagen, 0, 0); return true; }
    // de un punto del redondel al mundo —arriba es hacia donde apunta `rumbo`, y a la derecha lo que queda a su
    // derecha— y de ahí a la lámina: todo en línea recta, así que se avanza sumando
    const s = N / (2 * radio), c = (N - 1) / 2, fx = Math.sin(rumbo), fz = Math.cos(rumbo);
    const kx = w / (U.uHoja.value.x * U.uMetro.value), kz = h / (U.uHoja.value.y * U.uMetro.value);
    const ax = (-fz / s) * kx, az = (fx / s) * kz, bx = (-fx / s) * kx, bz = (-fz / s) * kz; // (lo que se corre en la lámina por cada punto hacia la derecha y hacia abajo)
    const x0 = (x / U.uMetro.value + U.uPlaza.value.x) * (w / U.uHoja.value.x) - 0.5, z0 = (z / U.uMetro.value + U.uPlaza.value.y) * (h / U.uHoja.value.y) - 0.5;
    const r2 = (c + 1) * (c + 1), fuera = T32[FUERA];
    for (let j = 0, o = 0; j < N; j++) {
      const dj = j - c; let lx = x0 + bx * dj - ax * c, lz = z0 + bz * dj - az * c;
      for (let i = 0; i < N; i++, o++, lx += ax, lz += az) {
        const di = i - c; if (di * di + dj * dj > r2) continue; // (afuera del redondel no se ve)
        const u = Math.floor(lx), v = Math.floor(lz);
        if (u < 0 || v < 0 || u >= w - 1 || v >= h - 1) { d32[o] = fuera; continue; }
        const k = v * w + u, q00 = que[cod[k]], q10 = que[cod[k + 1]], q01 = que[cod[k + w]], q11 = que[cod[k + w + 1]];
        if (q00 === q10 && q00 === q01 && q00 === q11) { d32[o] = T32[q00]; continue; }
        // en los bordes, la mezcla de los cuatro vecinos: así las calles no salen dentadas
        const tx = lx - u, tz = lz - v, p00 = (1 - tx) * (1 - tz), p10 = tx * (1 - tz), p01 = (1 - tx) * tz, p11 = tx * tz, A = TONOS[q00], B = TONOS[q10], C = TONOS[q01], D = TONOS[q11];
        d32[o] = (255 << 24) | ((A[2] * p00 + B[2] * p10 + C[2] * p01 + D[2] * p11) << 16) | ((A[1] * p00 + B[1] * p10 + C[1] * p01 + D[1] * p11) << 8) | (A[0] * p00 + B[0] * p10 + C[0] * p01 + D[0] * p11);
      }
    }
    ctx.putImageData(imagen, 0, 0);
    return true;
  }

  return {
    listo,
    /** Pone el mapita donde está el coche: (x, z) en metros del mundo, `rumbo` hacia donde mira la cámara, `apunta`
     *  hacia donde va el coche (los dos como el `h` de src/autos.js), `v` la velocidad en m/s y `dt` los segundos que
     *  pasaron (0: de un salto, sin acomodar de a poco la escala). */
    poner(x, z, rumbo, apunta, v, dt) {
      const quiere = Math.min(LEJOS, CERCA + Math.abs(v) * POR_VELOCIDAD); radio = dt > 0 ? radio + (quiere - radio) * (1 - Math.exp(-dt * 1.4)) : quiere;
      const e = etapa(); if (e !== etapaVista) { rotular(e); sucio = true; }
      if (sucio || Math.abs(x - visto.x) > 0.2 || Math.abs(z - visto.z) > 0.2 || Math.abs(rumbo - visto.rumbo) > 0.003 || Math.abs(radio - visto.radio) > 0.8) {
        if (pintar(x, z, rumbo)) { visto.x = x; visto.z = z; visto.radio = radio; sucio = false; }
        if (rumbo !== visto.rumbo) { visto.rumbo = rumbo; const r = el.clientWidth / 2 - 13; norte.style.transform = `translate(${(-Math.cos(rumbo) * r).toFixed(1)}px, ${(-Math.sin(rumbo) * r).toFixed(1)}px)`; }
      }
      const giro = rumbo - apunta; if (Math.abs(giro - visto.apunta) > 0.004 || Number.isNaN(visto.apunta)) { visto.apunta = giro; flecha.style.transform = `rotate(${giro.toFixed(3)}rad)`; }
    },
  };
}
