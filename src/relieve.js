// El relieve: la barranca del río y las lomas. Lo arma tools/relieve.mjs (las alturas de hoy, limpiadas y alisadas, con
// el río de 1867 a cero) y acá se lo lee de dos maneras: como textura, para que el dibujo suba y baje todo lo que usa
// la tinta (src/tinta.js: altura()), y como una cuenta, para lo que se mueve de este lado (la cámara a pie, las marcas).
import * as THREE from 'three';
import { pedir } from './url.js';

export async function loadRelieve({ plaza, metro, ancho, alto }) {
  const r = await pedir('datos/relieve.bin'); if (!r.ok) throw new Error('relieve.bin');
  const d = new Uint16Array(await r.arrayBuffer()), W = d[0], H = d[1], m = new Float32Array(W * H), medio = new Uint16Array(W * H);
  for (let q = 0; q < W * H; q++) { m[q] = d[2 + q] / 10; medio[q] = THREE.DataUtils.toHalfFloat(m[q]); }
  // (medio flotante: se puede filtrar en cualquier teléfono, y sobra precisión para alturas de 0 a 30 m)
  const tex = new THREE.DataTexture(medio, W, H, THREE.RedFormat, THREE.HalfFloatType);
  tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
  /** La altura del terreno en un punto del mundo (metros desde la plaza), con la ciudad levantada. */
  const en = (x, z) => {
    const u = ((x / metro + plaza[0]) / ancho) * W - 0.5, v = ((z / metro + plaza[1]) / alto) * H - 0.5;
    const i = Math.min(W - 2, Math.max(0, Math.floor(u))), j = Math.min(H - 2, Math.max(0, Math.floor(v))), a = Math.min(1, Math.max(0, u - i)), b = Math.min(1, Math.max(0, v - j)), q = j * W + i;
    return m[q] * (1 - a) * (1 - b) + m[q + 1] * a * (1 - b) + m[q + W] * (1 - a) * b + m[q + W + 1] * a * b;
  };
  return { tex, en, W, H };
}
