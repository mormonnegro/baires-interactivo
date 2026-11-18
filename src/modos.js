// Tres maneras más de recorrer la ciudad, además de mirarla desde arriba como un plano:
//   a pie      a la altura de los ojos, por las calles. Las casas frenan el paso (se choca contra lo edificado).
//   en avión   volando sobre la ciudad, con la cámara detrás del avión. (En 1867 faltaban cuarenta años para el
//              primero: es una licencia, y por eso el avión es de los de tela y madera.)
//   en coche   manejando por las calles el vehículo de la época: un coche de caballos en 1867, un Ford T en 1921…
//              Cambia solo al cambiar de año en la línea de tiempo, que en este modo sigue a la vista. Los coches, su
//              andar, su tablero y su ruido están en src/autos.js, que se baja recién al tocar «Manejar».
// Con teclado y ratón, o con los dedos: una palanca que aparece donde se apoya el pulgar.
//   a pie:     W A S D o flechas caminan y giran · arrastrar mira · ⇧ corre
//              (teléfono: el pulgar izquierdo camina, el derecho mira)
//   en avión:  flechas o W A S D: girar, subir y bajar · ⇧ más rápido · Q y E: el año anterior y el siguiente (la línea
//              de tiempo queda a la vista)   (teléfono: un dedo donde sea, de palanca)
//   en coche:  flechas o W A S D: acelerar, frenar (y marcha atrás) y doblar · espacio frena · V cambia la vista ·
//              B bocina · M sonido · Q y E: el año anterior y el siguiente   (teléfono: un dedo de palanca, igual)
//   Esc sale. El botón «más rápido» hace de ⇧ para los dedos.
// main.js decide cuándo dibujar y maneja lo demás (sombras, láminas, marcas): este módulo solo mueve la cámara y dice
// qué se está mirando (`vista`).
import * as THREE from 'three';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const OJOS = 1.7, RADIO = 0.45; // metros: la altura de la mirada y el ancho de quien camina
const PASO = 5, CORRIDA = 13; // m/s (se camina ligero: la ciudad es grande)
const VUELO = 75, VUELO_RAPIDO = 150, PISO = 32, TECHO = 3000; // m/s y metros de altura
const CELDA = 32; // metros de la grilla donde se buscan los choques

const CSS = `
#mando { position: fixed; inset: 0; z-index: 4; display: none; touch-action: none; cursor: grab; }
body.modo #mando { display: block; }
#mando:active { cursor: grabbing; }
#mando .palanca { position: absolute; left: 0; top: 0; width: 112px; height: 112px; margin: -56px 0 0 -56px; border-radius: 50%; border: 1.5px solid #2a221bcc; background: #f1e6cd40; box-shadow: 0 0 0 1px #f1e6cd99, 0 4px 18px #0005; opacity: 0; transition: opacity .15s; pointer-events: none; }
#mando .palanca.ver { opacity: 1; }
#mando .palanca i { position: absolute; left: 50%; top: 50%; width: 46px; height: 46px; margin: -23px 0 0 -23px; border-radius: 50%; background: #2a221bd9; border: 1.5px solid #f1e6cd; }
#modo-info { left: calc(26px + var(--sl)); top: calc(24px + var(--st)); max-width: min(420px, calc(100vw - 52px)); padding: 9px 14px 10px; font-size: 14px; line-height: 1.4; display: none; }
body.modo #modo-info { display: block; }
#modo-info b { font-weight: 500; font-size: 15.5px; letter-spacing: .07em; font-variant: small-caps; margin-right: 8px; }
#modo-info span { opacity: .86; font-style: italic; }
#modo-info small { display: block; font-size: 12.5px; line-height: 1.45; opacity: .74; margin-top: 5px; padding-top: 5px; border-top: 1px solid #2a221b33; }
#modo-info small.ido { display: none; }
#modos { display: contents; }
body:not(.con-modos) #modos { display: none; }
#botones #modos button { display: inline-flex; align-items: center; gap: 7px; }
#modos svg { width: 20px; height: 20px; flex: none; fill: currentColor; }
#botones #modos button.on { background: #2a221b; color: #f7eedb; }
#botones #modos button.on:hover { background: #453a30; }
#botones #modos #ritmo, #botones #salir { display: none; }
body.modo #botones #modos #ritmo { display: inline-flex; } body.modo #botones #salir { display: block; }
body.modo #alzar, body.modo #titulo, body.modo #buscar, body.modo #buscar-msg, body.modo #ficha, body.modo #calles { display: none !important; }
body.modo .marca .tag { pointer-events: none; }
/* en coche no hay «más rápido». En coche y en avión la línea de tiempo sigue a la vista: al cambiar de año cambia el
   coche, y desde el avión se ve cambiar la ciudad entera */
body.modo-manejar #botones #modos #ritmo { display: none; }
body.modo-manejar #epocas, body.modo-volar #epocas { display: block; z-index: 5; }
/* (en una ventana angosta sube al borde, donde en el mapa va el título, y en el teléfono va sin su leyenda: no hay lugar) */
@media (max-width: 1100px) { body.modo-manejar #epocas, body.modo-volar #epocas { top: calc(24px + var(--st, 0px)); } }
@media (max-width: 640px) { body.modo-manejar #epocas, body.modo-volar #epocas { top: calc(12px + var(--st, 0px)); } body.modo-manejar #epocas .pie, body.modo-volar #epocas .pie { display: none; } }
/* en ventanas no muy anchas, los botones de los modos quedan solo con su dibujo */
@media (max-width: 1320px) { #modos button .rot { display: none; } #botones #modos button { padding-left: 12px; padding-right: 12px; min-width: 44px; justify-content: center; } }
/* el teléfono: los modos van en una segunda fila, arriba de los botones */
@media (max-width: 640px), (max-height: 500px) {
  #modos { display: flex; gap: 8px; position: fixed; right: calc(14px + var(--sr)); bottom: calc(68px + var(--sb)); }
  #botones #modos button { width: 44px; padding: 0; }
  body.ficha:not(.modo) #modos { display: none; }
  #modo-info { left: calc(14px + var(--sl)); right: calc(14px + var(--sr)); top: calc(12px + var(--st)); max-width: none; padding: 7px 12px 8px; font-size: 13px; }
  #modo-info b { font-size: 14.5px; }
  body.modo #leyenda { display: none; }
}
@media (max-height: 500px) and (min-width: 641px) {
  #modo-info { right: auto; max-width: min(380px, calc(100vw - 28px)); }
}
`;

/** El avión: un biplano de tela y madera, hecho con pocas piezas y dibujado con la misma tinta que la ciudad.
 *  La nariz mira hacia +z; el ala derecha queda hacia -x. */
function crearAvion(tinta) {
  const PIEDRA = 6, TINTA = 7, PIZARRA = 8, P = [], N = [], I = [], W = [];
  let seed = 0.31;
  const add = (g, kind) => {
    const n = g.index ? g.toNonIndexed() : g, p = n.attributes.position, nn = n.attributes.normal;
    seed = (seed * 7.31 + 0.173) % 1;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      // (aInfo.w = -1e5: «a esa distancia de la plaza» la ola ya pasó siempre, así que el avión nunca se acuesta)
      P.push(x, y, z); N.push(nn.getX(i), nn.getY(i), nn.getZ(i)); I.push(seed, kind * 10 + 1, 4, -1e5); W.push(x + z * 0.6 + 500, y, 0, 0);
    }
  };
  const caja = (w, h, d, x, y, z, kind = PIEDRA, rz = 0) => add(new THREE.BoxGeometry(w, h, d).rotateZ(rz).translate(x, y, z), kind);
  // el cuerpo: se afina hacia la cola
  add(new THREE.CylinderGeometry(0.42, 0.95, 8.6, 10).rotateX(-Math.PI / 2).translate(0, 0, -1.3), PIEDRA);
  add(new THREE.CylinderGeometry(0.95, 0.8, 1.3, 10).rotateX(-Math.PI / 2).translate(0, 0, 3.65), PIZARRA); // el motor
  add(new THREE.SphereGeometry(0.42, 10, 6).scale(1, 1, 1.5).translate(0, 0, 4.5), TINTA);
  // las alas: dos planos, el de arriba un poco adelantado, y los montantes entre los dos
  caja(15.5, 0.2, 2.5, 0, 2.05, 1.6); caja(14, 0.2, 2.2, 0, -0.55, 1.2);
  for (const s of [-1, 1]) {
    for (const x of [2.1, 5.6]) { caja(0.13, 2.6, 0.13, s * x, 0.75, 2.3, TINTA); caja(0.13, 2.6, 0.13, s * x, 0.75, 0.55, TINTA); }
    caja(0.1, 3.2, 0.1, s * 3.85, 0.75, 1.45, TINTA, s * 0.86); // los tensores, en cruz
    caja(3.3, 0.18, 1.5, s * 1.85, 0.35, -5.1); // el timón de profundidad
    caja(0.14, 1.5, 0.14, s * 0.85, -1.2, 2.0, TINTA, s * -0.35); // las patas del tren
    add(new THREE.CylinderGeometry(0.62, 0.62, 0.3, 14).rotateZ(Math.PI / 2).translate(s * 1.25, -1.95, 2.0), TINTA);
  }
  caja(2.8, 0.12, 0.12, 0, -1.95, 2.0, TINTA); // el eje de las ruedas
  caja(0.18, 1.9, 1.7, 0, 1.2, -5.0); // la deriva
  caja(0.7, 0.5, 1.4, 0, 0.95, -0.2, TINTA); // la carlinga: un hueco oscuro
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aInfo', new THREE.Float32BufferAttribute(I, 4)); g.setAttribute('aWall', new THREE.Float32BufferAttribute(W, 4));
  const cuerpo = new THREE.Mesh(g, tinta.make()), prof = tinta.depth();
  // (el avión vuela: no se apoya en el terreno como todo lo demás)
  cuerpo.material.defines = { ...cuerpo.material.defines, SIN_RELIEVE: '' }; prof.defines = { ...prof.defines, SIN_RELIEVE: '' };
  cuerpo.customDepthMaterial = prof; cuerpo.castShadow = true; cuerpo.receiveShadow = false; cuerpo.frustumCulled = false;
  // la hélice gira aparte
  P.length = N.length = I.length = W.length = 0;
  caja(0.32, 4.6, 0.1, 0, 0, 0, TINTA);
  const gh = new THREE.BufferGeometry();
  gh.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); gh.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); gh.setAttribute('aInfo', new THREE.Float32BufferAttribute(I, 4)); gh.setAttribute('aWall', new THREE.Float32BufferAttribute(W, 4));
  const helice = new THREE.Mesh(gh, cuerpo.material); helice.position.set(0, 0, 4.95); helice.frustumCulled = false; helice.customDepthMaterial = prof; helice.castShadow = true;
  const grupo = new THREE.Group(); grupo.add(cuerpo, helice); grupo.rotation.order = 'YXZ'; grupo.visible = false;
  return { grupo, helice };
}

/**
 * @param camera, scene, tinta
 * @param suelo(x, z)   la altura del terreno en un punto, en metros (src/relieve.js)
 * @param datos     lo de loadCiudad (manzanas y techos: contra eso se choca)   @param hitos  lo de createHitos
 * @param limites   [x0, z0, x1, z1] del pliego, en metros
 * @param lugares   [{ nombre, x, z }] los lugares con nombre, para decir dónde se está
 * @param describir(d, alEste, alNorte, lugar)   la frase «a 2 cuadras al norte del Cabildo»
 * @param calles    lo de createCalles (el nombre de la calle de hoy, si están cargadas)
 * @param etapa()   la etapa de la línea de tiempo que se mira (0 = 1867)   @param epocas  la línea de tiempo (src/epocas.js)
 * @param alEntrar(modo), alSalir(vista)   avisos a main.js
 */
export function createModos({ camera, scene, tinta, suelo = () => 0, datos, hitos, limites, lugares, describir, calles, etapa = () => 0, epocas = null, alEntrar, alSalir }) {
  document.head.appendChild(Object.assign(document.createElement('style'), { textContent: CSS }));
  const $ = (id) => document.getElementById(id);
  const mando = Object.assign(document.createElement('div'), { id: 'mando', innerHTML: '<div class="palanca"><i></i></div>' });
  const info = Object.assign(document.createElement('div'), { id: 'modo-info', className: 'panel', innerHTML: '<b></b><span></span><small></small>' });
  document.body.append(mando, info);
  const palanca = mando.firstChild, perilla = palanca.firstChild;
  const conDedo = matchMedia('(pointer: coarse)').matches;

  let modo = null, rapido = false, quieto = 0, tInfo = 0, tAyuda = 0;
  const pie = { x: 0, z: 0, h: 0, p: 0, andado: 0 };
  const av = { x: 0, y: 300, z: 0, h: 0, p: 0, r: 0, v: VUELO };
  const ojo = new THREE.Vector3(), mira = new THREE.Vector3(), arriba = new THREE.Vector3(0, 1, 0);
  const vista = { x: 0, z: 0, dist: 440 };
  const { grupo: avion, helice } = crearAvion(tinta); scene.add(avion);

  // ---------- contra qué se choca al caminar ----------
  // Los techos de las casas (cuadriláteros, como vienen en los datos) y, de los edificios hechos a mano, todo lo que
  // tiene algo encima a más de 2,5 m. Se guardan en una grilla para mirar solo los de alrededor.
  // (con la línea de tiempo se suman las casas de los planos que siguen —`sumar`—: cada una estorba desde su etapa y
  // hasta que la demuelen; las de 1867 que se van también dejan de estorbar)
  let choques = null; const sumadas = [];
  function prepararChoques() {
    const { meta } = datos, { plaza, metro } = meta.plano, nT0 = datos.techos.length / 8, nT = nT0 + sumadas.reduce((t, d) => t + d.techos.length / 8, 0);
    const Q = new Float32Array(nT * 8), desde = new Uint8Array(nT), hasta = new Uint8Array(nT).fill(99), grilla = new Map(), tmp = [0, 0];
    let mz = datos.mz;
    const P = (b, u, v, o) => {
      const k = b * 10, s = u / mz[k + 8], t = v / mz[k + 9], a = (1 - s) * (1 - t), c = s * (1 - t), d = s * t, e = (1 - s) * t;
      Q[o] = (a * mz[k] + c * mz[k + 2] + d * mz[k + 4] + e * mz[k + 6] - plaza[0]) * metro; Q[o + 1] = (a * mz[k + 1] + c * mz[k + 3] + d * mz[k + 5] + e * mz[k + 7] - plaza[1]) * metro;
    };
    const anotar = (mapa, i, x0, z0, x1, z1) => {
      for (let cz = Math.floor((z0 - 1) / CELDA); cz <= Math.floor((z1 + 1) / CELDA); cz++) for (let cx = Math.floor((x0 - 1) / CELDA); cx <= Math.floor((x1 + 1) / CELDA); cx++) { const k = (cx + 4096) * 8192 + cz + 4096; let l = mapa.get(k); if (!l) mapa.set(k, (l = [])); l.push(i); }
    };
    let i = 0;
    for (const d of [datos, ...sumadas]) for (let k = 0; k < d.techos.length; k += 8, i++) {
      const techos = d.techos, b = techos[k], o = i * 8; mz = d.mz; if (d !== datos) { desde[i] = (techos[k + 7] >> 8) & 15; hasta[i] = techos[k + 7] >> 12 || 99; }
      P(b, techos[k + 1], techos[k + 2], o); P(b, techos[k + 1], techos[k + 4], o + 2); P(b, techos[k + 3], techos[k + 4], o + 4); P(b, techos[k + 3], techos[k + 2], o + 6);
      // (que todos giren para el mismo lado: así «adentro» queda siempre del mismo lado de cada borde)
      let area = 0; for (let e = 0; e < 4; e++) { const a = o + e * 2, c = o + ((e + 1) % 4) * 2; area += Q[a] * Q[c + 1] - Q[c] * Q[a + 1]; }
      if (area < 0) { tmp[0] = Q[o + 2]; tmp[1] = Q[o + 3]; Q[o + 2] = Q[o + 6]; Q[o + 3] = Q[o + 7]; Q[o + 6] = tmp[0]; Q[o + 7] = tmp[1]; }
      anotar(grilla, i, Math.min(Q[o], Q[o + 2], Q[o + 4], Q[o + 6]), Math.min(Q[o + 1], Q[o + 3], Q[o + 5], Q[o + 7]), Math.max(Q[o], Q[o + 2], Q[o + 4], Q[o + 6]), Math.max(Q[o + 1], Q[o + 3], Q[o + 5], Q[o + 7]));
    }
    for (const d of sumadas) if (d.mueT) for (let j = 0; j < d.mueT.length; j += 2) hasta[d.mueT[j]] = d.mueT[j + 1];
    mz = datos.mz;
    // las manzanas: para saber qué es calle (donde se empieza a caminar)
    const nM = mz.length / 10, M = new Float32Array(nM * 8), grillaM = new Map();
    for (let b = 0; b < nM; b++) {
      for (let e = 0; e < 4; e++) { M[b * 8 + e * 2] = (mz[b * 10 + e * 2] - plaza[0]) * metro; M[b * 8 + e * 2 + 1] = (mz[b * 10 + e * 2 + 1] - plaza[1]) * metro; }
      const o = b * 8; anotar(grillaM, b, Math.min(M[o], M[o + 2], M[o + 4], M[o + 6]), Math.min(M[o + 1], M[o + 3], M[o + 5], M[o + 7]), Math.max(M[o], M[o + 2], M[o + 4], M[o + 6]), Math.max(M[o + 1], M[o + 3], M[o + 5], M[o + 7]));
    }
    // los edificios hechos a mano: los triángulos que miran hacia arriba y están a más de 2,5 m
    const hp = hitos.mesh.geometry.attributes.position, hn = hitos.mesh.geometry.attributes.normal, hi = hitos.mesh.geometry.attributes.aInfo, T = [], Td = [], Th = [], grillaT = new Map();
    for (let i = 0; i + 2 < hp.count; i += 3) {
      if (hn.getY(i) < 0.3 || Math.min(hp.getY(i), hp.getY(i + 1), hp.getY(i + 2)) < 2.5) continue;
      const n = T.length / 6; for (let v = 0; v < 3; v++) T.push(hp.getX(i + v), hp.getZ(i + v));
      // (los que la línea de tiempo trae o se lleva: desde qué etapa están y hasta cuál, como en src/hitos.js)
      { const et = Math.floor(hi.getW(i) / 20000 + 0.01), muere = Math.floor(et / 8); Td.push(et - 8 * muere); Th.push(muere || 99); }
      const o = n * 6; anotar(grillaT, n, Math.min(T[o], T[o + 2], T[o + 4]), Math.min(T[o + 1], T[o + 3], T[o + 5]), Math.max(T[o], T[o + 2], T[o + 4]), Math.max(T[o + 1], T[o + 3], T[o + 5]));
    }
    choques = { Q, desde, hasta, grilla, M, grillaM, T: new Float32Array(T), Td, Th, grillaT };
  }
  const clave = (x, z) => (Math.floor(x / CELDA) + 4096) * 8192 + Math.floor(z / CELDA) + 4096;
  /** ¿(x, z) cae dentro del cuadrilátero `o` de `A`? (de cualquier giro) */
  const enCuad = (A, o, x, z) => {
    let pos = 0, neg = 0;
    for (let e = 0; e < 4; e++) { const a = o + e * 2, c = o + ((e + 1) % 4) * 2, s = (A[c] - A[a]) * (z - A[a + 1]) - (A[c + 1] - A[a + 1]) * (x - A[a]); if (s > 0) pos++; else if (s < 0) neg++; }
    return !(pos && neg);
  };
  const enTri = (T, o, x, z) => {
    const s1 = (T[o + 2] - T[o]) * (z - T[o + 1]) - (T[o + 3] - T[o + 1]) * (x - T[o]), s2 = (T[o + 4] - T[o + 2]) * (z - T[o + 3]) - (T[o + 5] - T[o + 3]) * (x - T[o + 2]), s3 = (T[o] - T[o + 4]) * (z - T[o + 5]) - (T[o + 1] - T[o + 5]) * (x - T[o + 4]);
    return !((s1 < 0 || s2 < 0 || s3 < 0) && (s1 > 0 || s2 > 0 || s3 > 0));
  };
  const enHito = (x, z) => { const l = choques.grillaT.get(clave(x, z)); if (l) { const e = etapa(); for (const i of l) if (choques.Td[i] <= e && e < choques.Th[i] && enTri(choques.T, i * 6, x, z)) return true; } return false; };
  /** ¿Hay algo edificado en (x, z)? */
  const edificado = (x, z) => { const l = choques.grilla.get(clave(x, z)); if (l) { const e = etapa(); for (const i of l) if (choques.desde[i] <= e && e < choques.hasta[i] && enCuad(choques.Q, i * 8, x, z)) return true; } return enHito(x, z); };
  const enManzana = (x, z) => { const l = choques.grillaM.get(clave(x, z)); if (l) for (const b of l) if (enCuad(choques.M, b * 8, x, z)) return true; return false; };
  /** Mover de (x0, z0) a (x1, z1), sin atravesar paredes: lo que se mete en una casa se lo saca por el borde más
   *  cercano (así, de costado contra una pared, se resbala a lo largo). */
  function andar(x0, z0, x1, z1) {
    const { Q, grilla, desde, hasta } = choques, et = etapa(); let x = x1, z = z1;
    for (let vuelta = 0; vuelta < 3; vuelta++) {
      const l = grilla.get(clave(x, z)); let tocado = false; if (!l) break;
      for (const i of l) {
        if (!(desde[i] <= et && et < hasta[i])) continue; // (las casas que todavía no están, o que ya demolieron, no frenan)
        const o = i * 8; let dMin = Infinity, nx = 0, nz = 0, adentro = true;
        for (let e = 0; e < 4 && adentro; e++) {
          const a = o + e * 2, c = o + ((e + 1) % 4) * 2, ex = Q[c] - Q[a], ez = Q[c + 1] - Q[a + 1], L = Math.hypot(ex, ez) || 1;
          const d = (ex * (z - Q[a + 1]) - ez * (x - Q[a])) / L; // cuánto adentro de este borde (los cuadriláteros giran todos igual)
          if (d < -RADIO) adentro = false; else if (d < dMin) { dMin = d; nx = ez / L; nz = -ex / L; }
        }
        if (adentro) { x += nx * (dMin + RADIO + 0.01); z += nz * (dMin + RADIO + 0.01); tocado = true; }
      }
      if (!tocado) break;
    }
    if (edificado(x, z)) {
      // (un rincón, o un edificio de los hechos a mano: se prueba avanzar en un solo sentido; si no, no se avanza)
      if (!edificado(x1, z0)) return [x1, z0]; if (!edificado(x0, z1)) return [x0, z1]; return [x0, z0];
    }
    return [clamp(x, limites[0], limites[2]), clamp(z, limites[1], limites[3])];
  }
  /** De la casa que tiene adentro a (x, z), hacia dónde queda su pared más cercana: [nx, nz], apuntando afuera. (Nada si
   *  no es una casa del plano: los edificios hechos a mano no tienen paredes derechas que se puedan decir así.) */
  function pared(x, z) {
    const { Q, grilla, desde, hasta } = choques, et = etapa(), l = grilla.get(clave(x, z)); if (!l) return null;
    for (const i of l) {
      if (!(desde[i] <= et && et < hasta[i])) continue;
      const o = i * 8; let dMin = Infinity, nx = 0, nz = 0, adentro = true;
      for (let e = 0; e < 4 && adentro; e++) {
        const a = o + e * 2, c = o + ((e + 1) % 4) * 2, ex = Q[c] - Q[a], ez = Q[c + 1] - Q[a + 1], L = Math.hypot(ex, ez) || 1, d = (ex * (z - Q[a + 1]) - ez * (x - Q[a])) / L;
        if (d < 0) adentro = false; else if (d < dMin) { dMin = d; nx = ez / L; nz = -ex / L; }
      }
      if (adentro) return [nx, nz];
    }
    return null;
  }
  /** El punto de calle más cercano a (x, z): fuera de toda manzana (si no hay cerca, al menos donde no haya nada edificado). */
  function aLaCalle(x, z) {
    for (const libre of [(a, b) => !enManzana(a, b) && !edificado(a, b), (a, b) => !edificado(a, b)]) {
      if (libre(x, z)) return [x, z];
      for (let r = 3; r <= 400; r += 3) for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, px = x + Math.sin(a) * r, pz = z + Math.cos(a) * r; if (libre(px, pz)) return [px, pz]; }
    }
    return [x, z];
  }

  // ---------- el mando: teclas, ratón y dedos ----------
  const teclas = new Set(), eje = { x: 0, y: 0 }; // eje: la palanca (x a la derecha, y hacia adelante o arriba), de -1 a 1
  let dedoPalanca = null, dedoMira = null, giroPend = 0, cabeceoPend = 0;
  const soltar = () => { dedoPalanca = dedoMira = null; eje.x = eje.y = 0; palanca.classList.remove('ver'); };
  mando.addEventListener('contextmenu', (e) => e.preventDefault());
  mando.addEventListener('pointerdown', (e) => {
    if (!modo) return;
    mando.setPointerCapture(e.pointerId); quieto = 0;
    // a pie, el ratón siempre mira; los dedos: el de la izquierda camina, el de la derecha mira. En avión y en coche, todo es palanca.
    const quierePalanca = modo !== 'caminar' || (e.pointerType !== 'mouse' && e.clientX < innerWidth * 0.5);
    if (quierePalanca && !dedoPalanca) { dedoPalanca = { id: e.pointerId, x: e.clientX, y: e.clientY }; palanca.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; perilla.style.transform = ''; palanca.classList.add('ver'); }
    else if (!dedoMira) dedoMira = { id: e.pointerId, x: e.clientX, y: e.clientY };
  });
  mando.addEventListener('pointermove', (e) => {
    if (dedoPalanca?.id === e.pointerId) {
      let dx = e.clientX - dedoPalanca.x, dy = e.clientY - dedoPalanca.y; const R = 52, d = Math.hypot(dx, dy);
      if (d > R) { dx *= R / d; dy *= R / d; }
      perilla.style.transform = `translate(${dx}px,${dy}px)`;
      // (una zona muerta chica en el medio, para que el pulgar apoyado no camine solo)
      const m = Math.hypot(dx, dy) / R, k = m < 0.14 ? 0 : (m - 0.14) / 0.86 / (m || 1);
      eje.x = (dx / R) * k; eje.y = (-dy / R) * k; quieto = 0;
    } else if (dedoMira?.id === e.pointerId) {
      const k = (camera.fov * Math.PI) / 180 / innerHeight * 1.15; // arrastrar una pantalla de alto gira lo que la pantalla muestra
      giroPend += (e.clientX - dedoMira.x) * k; cabeceoPend += (e.clientY - dedoMira.y) * k; dedoMira.x = e.clientX; dedoMira.y = e.clientY; quieto = 0;
    }
  });
  const arribaDedo = (e) => {
    if (dedoPalanca?.id === e.pointerId) { dedoPalanca = null; eje.x = eje.y = 0; palanca.classList.remove('ver'); }
    else if (dedoMira?.id === e.pointerId) dedoMira = null;
  };
  mando.addEventListener('pointerup', arribaDedo); mando.addEventListener('pointercancel', arribaDedo);
  const MIAS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight', 'Space']);
  addEventListener('keydown', (e) => {
    if (!modo || e.target?.tagName === 'INPUT' || e.metaKey || e.ctrlKey) return;
    if (e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); salir(); return; }
    // en coche y en avión, Q y E pasan al año anterior y al siguiente (a pie, giran); en coche, V, B y M son del coche (src/autos.js)
    if (conAños() && (e.code === 'KeyQ' || e.code === 'KeyE')) { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) otroAño(e.code === 'KeyE' ? 1 : -1); quieto = 0; return; }
    if (modo === 'manejar' && manejo.tecla(e.code, e.repeat)) { e.preventDefault(); e.stopImmediatePropagation(); quieto = 0; return; }
    if (MIAS.has(e.code)) { e.preventDefault(); e.stopImmediatePropagation(); teclas.add(e.code); quieto = 0; }
  }, true);
  addEventListener('keyup', (e) => teclas.delete(e.code), true);
  addEventListener('blur', () => { teclas.clear(); soltar(); });
  const t = (c) => (teclas.has(c) ? 1 : 0);

  // ---------- los tres modos ----------
  /** El ángulo vertical de la cámara para que, de costado, se vea al menos `ancho` grados (de pie, el teléfono muestra poco a los lados). */
  const abrir = (ancho, min, max) => { const v = clamp((2 * Math.atan(Math.tan((ancho * Math.PI) / 360) / camera.aspect) * 180) / Math.PI, min, max); if (Math.abs(camera.fov - v) > 0.01) camera.fov = v; };
  function caminar(dt) {
    const corre = rapido || t('ShiftLeft') || t('ShiftRight'), vel = corre ? CORRIDA : PASO;
    let ax = eje.x + t('KeyD') - t('KeyA'), ay = eje.y + t('KeyW') + t('ArrowUp') - t('KeyS') - t('ArrowDown');
    const m = Math.hypot(ax, ay); if (m > 1) { ax /= m; ay /= m; }
    const giro = t('ArrowRight') + t('KeyE') - t('ArrowLeft') - t('KeyQ');
    pie.h -= giro * 1.9 * dt + giroPend; pie.p = clamp(pie.p - cabeceoPend, -1.25, 1.35);
    const movio = giroPend || cabeceoPend || giro || m > 0.001; giroPend = cabeceoPend = 0;
    const fx = Math.sin(pie.h), fz = Math.cos(pie.h);
    if (m > 0.001) {
      const [x, z] = andar(pie.x, pie.z, pie.x + (fx * ay - fz * ax) * vel * dt, pie.z + (fz * ay + fx * ax) * vel * dt);
      pie.andado += Math.hypot(x - pie.x, z - pie.z); pie.x = x; pie.z = z;
    }
    abrir(78, 55, 84);
    // (un vaivén apenas, al paso)
    ojo.set(pie.x, suelo(pie.x, pie.z) + OJOS + Math.sin(pie.andado * (corre ? 1.5 : 2.2)) * 0.035, pie.z);
    const cp = Math.cos(pie.p);
    camera.position.copy(ojo); camera.up.set(0, 1, 0); camera.lookAt(mira.set(pie.x + fx * cp, ojo.y + Math.sin(pie.p), pie.z + fz * cp));
    camera.near = 0.35; camera.far = 14000;
    vista.x = pie.x; vista.z = pie.z; vista.dist = 440;
    return movio;
  }
  function volar(dt) {
    const sx = clamp(eje.x + t('KeyD') + t('ArrowRight') - t('KeyA') - t('ArrowLeft'), -1, 1), sy = clamp(eje.y + t('KeyW') + t('ArrowUp') - t('KeyS') - t('ArrowDown'), -1, 1);
    const apuro = rapido || t('ShiftLeft') || t('ShiftRight');
    av.v += ((apuro ? VUELO_RAPIDO : VUELO) - av.v) * (1 - Math.exp(-dt * 1.2));
    // fuera del pliego no hay nada: el avión vira solo hacia la ciudad
    const afuera = av.x < limites[0] - 600 || av.x > limites[2] + 600 || av.z < limites[1] - 600 || av.z > limites[3] + 600;
    let gira = sx;
    if (afuera) { let d = Math.atan2((limites[0] + limites[2]) / 2 - av.x, (limites[1] + limites[3]) / 2 - av.z) - av.h; d = Math.atan2(Math.sin(d), Math.cos(d)); if (Math.abs(d) > 0.5) gira = clamp(-d * 2, -1, 1); }
    av.r += (gira * 0.85 - av.r) * (1 - Math.exp(-dt * 3.2));
    av.h -= av.r * 0.78 * dt; // (vira lo que está inclinado)
    // cerca del piso o del techo no se puede seguir bajando o subiendo
    let quiere = sy * 0.42; if (av.y < PISO + 25 && quiere < 0) quiere *= clamp((av.y - PISO) / 25, 0, 1); if (av.y > TECHO - 200 && quiere > 0) quiere *= clamp((TECHO - av.y) / 200, 0, 1);
    av.p += (quiere - av.p) * (1 - Math.exp(-dt * 2.4));
    const cp = Math.cos(av.p), fx = Math.sin(av.h), fz = Math.cos(av.h);
    av.x += fx * cp * av.v * dt; av.z += fz * cp * av.v * dt; av.y = clamp(av.y + Math.sin(av.p) * av.v * dt, PISO, TECHO);
    avion.position.set(av.x, av.y, av.z); avion.rotation.set(-av.p, av.h, av.r);
    helice.rotation.z += dt * 38;
    // la cámara: detrás y un poco arriba, y llega con un instante de demora (así se ve al avión virar)
    abrir(64, 46, 70);
    const lejos = 33 / Math.min(1, camera.aspect * 1.25), kx = fx * cp, kz = fz * cp;
    mira.set(av.x - kx * lejos, av.y + 9 + Math.max(0, -Math.sin(av.p)) * 14, av.z - kz * lejos);
    if (salto) { ojo.copy(mira); salto = false; } else ojo.lerp(mira, 1 - Math.exp(-dt * 5.5));
    ojo.y = Math.max(ojo.y, suelo(ojo.x, ojo.z) + 6);
    camera.position.copy(ojo);
    // (el horizonte se inclina un poco con el avión; el ala derecha es -x cuando se vuela hacia +z)
    camera.up.set(-fz * Math.sin(av.r * 0.4), 1, fx * Math.sin(av.r * 0.4)).normalize();
    camera.lookAt(mira.set(av.x + kx * 26, av.y + 3 + Math.sin(av.p) * 26, av.z + kz * 26));
    camera.near = 3; camera.far = 40000;
    // lo que se mira: el suelo de más adelante
    vista.x = clamp(av.x + fx * av.y * 0.8, limites[0], limites[2]); vista.z = clamp(av.z + fz * av.y * 0.8, limites[1], limites[3]); vista.dist = clamp(av.y * 1.7 + 420, 440, 5600);
    return true;
  }
  let salto = false;
  // en coche: el taller (src/autos.js) se baja recién la primera vez que se toca «Manejar»
  let manejo = null, taller = null;
  const añoVisto = () => epocas?.año ?? 1867;
  const abrirTaller = () => (taller ??= import('./autos.js').then(async (m) => {
    if (!choques) prepararChoques();
    const libres = (f) => (x, z) => { if (!choques) prepararChoques(); return f(x, z); }; // (si la línea de tiempo suma casas mientras se maneja)
    manejo = m.createManejo({ camera, scene, tinta, suelo, limites, año: añoVisto, etapa, edificado: libres(edificado), enManzana: libres(enManzana), pared: libres(pared), abrir });
    await manejo.listo; return manejo;
  }).catch((e) => { console.warn(e); taller = null; return null; }));
  /** En coche y en avión se puede cambiar de año sin salir: la línea de tiempo queda a la vista. */
  const conAños = () => modo === 'manejar' || modo === 'volar';
  const otroAño = (d) => { const l = epocas?.lista; if (!l) return; const i = l.indexOf(epocas.año) + d; if (i >= 0 && i < l.length) epocas.elegir(l[i]); };
  function manejar(dt) {
    const gira = clamp(eje.x + t('KeyD') + t('ArrowRight') - t('KeyA') - t('ArrowLeft'), -1, 1), pedal = clamp(eje.y + t('KeyW') + t('ArrowUp') - t('KeyS') - t('ArrowDown'), -1, 1);
    const coche = manejo.vehiculo, movio = manejo.andar(dt, { gira, pedal, freno: t('Space') });
    if (manejo.vehiculo !== coche) { tInfo = 0; acomodar(); } // (cambió el año, y con él el coche)
    vista.x = manejo.auto.x; vista.z = manejo.auto.z; vista.dist = 440;
    return movio;
  }
  /** En coche y en avión la línea de tiempo queda a la vista: en una ventana angosta va arriba a la izquierda, donde está
   *  el cartel que dice por dónde se anda, así que el cartel baja hasta quedar debajo de ella. */
  function acomodar() {
    info.style.top = ''; if (!conAños()) return;
    const e = $('epocas')?.getBoundingClientRect(), i = info.getBoundingClientRect();
    if (e && e.width && e.left < i.right + 8 && i.left < e.right + 8 && e.top < i.bottom + 8) info.style.top = `${Math.round(e.bottom + 10)}px`;
  }
  addEventListener('resize', () => { if (conAños()) acomodar(); });
  // (y con cada año la línea de tiempo cambia de alto: su leyenda es más larga o más corta)
  if (typeof ResizeObserver !== 'undefined' && $('epocas')) new ResizeObserver(() => { if (conAños()) acomodar(); }).observe($('epocas'));

  // ---------- lo que se cuenta arriba ----------
  function contar() {
    info.firstChild.textContent = modo === 'volar' ? 'En avión' : modo === 'manejar' ? (manejo.vehiculo?.caballo ? 'En coche' : 'En auto') : 'A pie';
    const x = modo === 'volar' ? av.x : modo === 'manejar' ? manejo.auto.x : pie.x, z = modo === 'volar' ? av.z : modo === 'manejar' ? manejo.auto.z : pie.z;
    let mejor = null, d = Infinity; for (const l of lugares) { const dl = Math.hypot(l.x - x, l.z - z); if (dl < d) { d = dl; mejor = l; } }
    const partes = [];
    if (modo === 'volar') partes.push(`${Math.round(av.y / 10) * 10} m de altura`, `${Math.round((av.v * 3.6) / 10) * 10} km/h`);
    // (x crece hacia el norte y z hacia el este)
    if (mejor) partes.push(describir(d, z - mejor.z, x - mejor.x, mejor));
    if (modo !== 'volar' && document.body.classList.contains('hoy')) { const c = calles?.cerca(x, z, 45)[0]; if (c) partes.push(`hoy, ${c[0]}`); }
    const dice = partes.filter(Boolean).join(' · '); if (dice !== info.children[1].textContent) { info.children[1].textContent = dice; acomodar(); } // (el cartel cambió de ancho: puede haber llegado hasta la línea de tiempo)
  }
  const AYUDA = {
    caminar: conDedo ? 'el pulgar izquierdo camina · el derecho mira<br>«más rápido» para correr' : 'W A S D o las flechas para caminar · arrastrá para mirar<br>⇧ para correr · Esc para volver al mapa',
    volar: conDedo ? 'apoyá un dedo y movelo: gira, sube y baja<br>«más rápido» para acelerar · cambiá de año arriba y mirá cambiar la ciudad' : 'flechas o W A S D: girar, subir y bajar (o arrastrá) · ⇧ para acelerar<br>Q y E cambian de año: la ciudad cambia abajo · Esc para volver al mapa',
    manejar: conDedo ? 'apoyá un dedo y movelo: adelante acelera, atrás frena, a los lados dobla<br>cambiá de año arriba, y cambia el coche; con las flechas del tablero elegís otro' : 'flechas o W A S D: acelerar, frenar y doblar · espacio frena<br>V la vista · B la bocina · M el sonido · N otro coche · Q y E cambian de año, y con el año, el coche',
  };
  // (la ayuda va en el mismo cartel, y se va sola a los pocos segundos)
  function ayudar() { const h = info.lastChild; h.innerHTML = AYUDA[modo]; h.classList.remove('ido'); clearTimeout(tAyuda); tAyuda = setTimeout(() => h.classList.add('ido'), 12000); }

  /** Entra a un modo. `desde`: { x, z, yaw, dist } de la cámara del mapa (o del otro modo). (A «manejar» se entra con
   *  el botón, que antes baja el taller.) */
  function entrar(cual, desde) {
    if (cual === 'manejar' && !manejo) return;
    if (!choques) prepararChoques();
    const yaDe = modo, ma = manejo?.auto;
    // desde otro modo se sigue donde se estaba: se aterriza donde va el avión, se despega desde donde se camina, o se baja del coche
    const x0 = yaDe === 'volar' ? av.x : yaDe === 'caminar' ? pie.x : yaDe === 'manejar' ? ma.x : desde.x, z0 = yaDe === 'volar' ? av.z : yaDe === 'caminar' ? pie.z : yaDe === 'manejar' ? ma.z : desde.z;
    const h0 = yaDe === 'volar' ? av.h : yaDe === 'caminar' ? pie.h : yaDe === 'manejar' ? ma.h : desde.yaw + Math.PI; // (la cámara del mapa mira al revés de su «yaw»)
    if (yaDe === 'manejar') manejo.salir();
    modo = cual; soltar(); teclas.clear(); giroPend = cabeceoPend = 0; quieto = 0; tInfo = 0;
    if (cual === 'caminar') { [pie.x, pie.z] = aLaCalle(x0, z0); pie.h = h0; pie.p = 0; pie.andado = 0; avion.visible = false; }
    else if (cual === 'manejar') { avion.visible = false; manejo.entrar(x0, z0, h0); }
    else {
      // se arranca un poco antes del lugar que se miraba, para llegar volando
      const alto = yaDe === 'caminar' ? 180 : clamp((desde.dist ?? 1500) * 0.28, 220, 900);
      av.h = h0; av.p = yaDe === 'caminar' ? 0.25 : 0; av.r = 0; av.v = VUELO; av.y = alto;
      const atras = yaDe ? 0 : Math.min(900, alto * 1.6);
      av.x = clamp(x0 - Math.sin(h0) * atras, limites[0], limites[2]); av.z = clamp(z0 - Math.cos(h0) * atras, limites[1], limites[3]);
      avion.visible = true; salto = true;
    }
    for (const b of ['caminar', 'volar', 'manejar']) $(b)?.classList.toggle('on', b === cual);
    document.body.classList.add('modo'); for (const b of ['caminar', 'volar', 'manejar']) document.body.classList.toggle(`modo-${b}`, cual === b);
    mando.style.cursor = cual === 'volar' ? 'crosshair' : '';
    contar(); ayudar(); acomodar(); alEntrar?.(cual, yaDe);
    actualizar(0);
  }
  function salir() {
    if (!modo) return;
    // la cámara del mapa queda mirando lo que se estaba mirando, y para el mismo lado
    const v = modo === 'volar' ? { x: vista.x, z: vista.z, dist: clamp(av.y * 2.4, 500, 6000), yaw: av.h + Math.PI, pitch: 0.62 } : modo === 'manejar' ? { x: manejo.auto.x, z: manejo.auto.z, dist: 420, yaw: manejo.auto.h + Math.PI, pitch: 0.5 } : { x: pie.x, z: pie.z, dist: 420, yaw: pie.h + Math.PI, pitch: 0.5 };
    if (modo === 'manejar') manejo.salir();
    modo = null; soltar(); teclas.clear(); avion.visible = false; clearTimeout(tAyuda); info.style.top = '';
    for (const b of ['caminar', 'volar', 'manejar']) $(b)?.classList.remove('on');
    document.body.classList.remove('modo', 'modo-volar', 'modo-caminar', 'modo-manejar');
    alSalir?.(v);
  }
  /** Avanza `dt` segundos. Devuelve si hay que volver a dibujar. */
  function actualizar(dt) {
    if (!modo) return false;
    if (!choques) prepararChoques(); // (la línea de tiempo pudo sumar casas mientras tanto)
    const movio = modo === 'volar' ? volar(dt) : modo === 'manejar' ? manejar(dt) : caminar(dt);
    camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
    tInfo -= dt; if (tInfo <= 0) { tInfo = 0.4; contar(); }
    if (movio) quieto = 0; else quieto += dt;
    return quieto < 0.25;
  }

  $('caminar')?.addEventListener('click', () => (modo === 'caminar' ? salir() : entrar('caminar', pedirDesde('caminar'))));
  $('volar')?.addEventListener('click', () => (modo === 'volar' ? salir() : entrar('volar', pedirDesde('volar'))));
  $('manejar')?.addEventListener('click', () => { if (modo === 'manejar') salir(); else abrirTaller().then((m) => { if (m && modo !== 'manejar') entrar('manejar', pedirDesde('manejar')); }); });
  $('salir')?.addEventListener('click', salir);
  $('ritmo')?.addEventListener('click', () => { rapido = !rapido; $('ritmo').classList.toggle('on', rapido); $('ritmo').setAttribute('aria-pressed', String(rapido)); quieto = 0; });
  let pedirDesde = () => ({ x: 0, z: 0, yaw: 0, dist: 1500 });
  document.body.classList.add('con-modos');

  return {
    get activo() { return modo; }, vista, entrar, salir, actualizar,
    /** De dónde se arranca: una función que recibe el modo y devuelve { x, z, yaw, dist } (la cámara del mapa, o un lugar fijo). */
    set desde(f) { pedirDesde = f; },
    /** Suma las casas de la línea de tiempo (lo de loadCrece) a lo que frena el paso. */
    sumar(d) { if (!sumadas.includes(d)) { sumadas.push(d); choques = null; } },
    /** En avión y con poca máquina no se piden las láminas finas: se pasa demasiado rápido para aprovecharlas. */
    get vuela() { return modo === 'volar'; },
    /** (para las marcas) a pie solo se nombran los lugares de alrededor */
    cerca: (m) => (modo === 'caminar' ? Math.hypot(m.x - pie.x, m.z - pie.z) < 330 : modo === 'manejar' ? Math.hypot(m.x - manejo.auto.x, m.z - manejo.auto.z) < 330 : true),
    /** (para las pruebas) */
    get manejo() { return manejo; },
    pie, av, edificado: (x, z) => { if (!choques) prepararChoques(); return edificado(x, z); }, enManzana: (x, z) => { if (!choques) prepararChoques(); return enManzana(x, z); },
  };
}
