// Los patios, en color: árboles y aljibes en los fondos de las manzanas. El plano no los dibuja (raya el fondo y nada
// más): son inventados, y por eso solo existen con el color prendido. En tinta sigue valiendo lo del grabador: cada
// árbol que él dibujó, en su lugar, y ninguno más. Dónde va cada uno lo decide tools/patios.mjs (ahí está el formato).
// Se dibujan como los árboles del plano (src/ciudad.js): mallas instanciadas, agrupadas por zonas, con una copa más
// o menos trabajada según la distancia; las zonas lejanas no se dibujan.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { copa } from './ciudad.js';
import { pedir } from './url.js';

/** Baja public/datos/patios.pak: x, y (píxeles del plano), radio (dm; 0 = aljibe) y suerte de cada cosa. */
export async function loadPatios() {
  const r = await pedir('datos/patios.pak'); if (!r.ok) throw new Error('patios.pak');
  const buf = await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  const n = new DataView(buf).getUint32(0, true), b = new Uint8Array(buf, 4), x = new Uint16Array(n), y = new Uint16Array(n);
  // (viene por planos: todos los primeros bytes de cada registro, después todos los segundos…)
  for (let i = 0; i < n; i++) { x[i] = b[i] | (b[n + i] << 8); y[i] = b[2 * n + i] | (b[3 * n + i] << 8); }
  return { n, x, y, radio: b.subarray(4 * n, 5 * n), suerte: b.subarray(5 * n, 6 * n) };
}

/** El aljibe: el brocal de mampostería sobre su grada, y encima el arco de hierro con la roldana, la soga y el balde.
 *  Va en dos mallas porque son dos materias: la cal y el hierro. */
function aljibe() {
  const sinUv = (g) => { g.deleteAttribute('uv'); return g.index ? g.toNonIndexed() : g; };
  const cil = (r0, r1, alto, y, lados, abierto = false) => sinUv(new THREE.CylinderGeometry(r0, r1, alto, lados, 1, abierto).translate(0, y + alto / 2, 0));
  const piedra = mergeGeometries([
    cil(1.3, 1.36, 0.14, 0, 12), // la grada
    cil(0.86, 0.92, 0.84, 0.14, 12, true), // el brocal
    cil(0.98, 0.98, 0.13, 0.98, 12), // la tapa de piedra, que vuela un poco
  ]);
  const hierro = mergeGeometries([
    sinUv(new THREE.CircleGeometry(0.62, 12).rotateX(-Math.PI / 2).translate(0, 1.115, 0)), // la boca
    cil(0.045, 0.045, 1.0, 1.1, 5).translate(-0.8, 0, 0), cil(0.045, 0.045, 1.0, 1.1, 5).translate(0.8, 0, 0), // los parantes
    sinUv(new THREE.TorusGeometry(0.8, 0.045, 5, 14, Math.PI).translate(0, 2.1, 0)), // el arco
    sinUv(new THREE.CylinderGeometry(0.13, 0.13, 0.07, 8).rotateX(Math.PI / 2).translate(0, 2.68, 0)), // la roldana
    cil(0.02, 0.02, 1.3, 1.3, 4), // la soga
    cil(0.2, 0.15, 0.3, 1.11, 7).translate(0.42, 0, 0.3), // el balde, apoyado en el brocal
  ]);
  return [piedra, hierro];
}

/** `datos`: lo de loadPatios. `liviano`: en un teléfono van menos árboles, y se dibujan hasta más cerca. */
export function createPatios(datos, meta, tinta, { liviano = false } = {}) {
  const { plaza, metro } = meta.plano, group = new THREE.Group(); group.visible = false;
  const ZONA = 350, zonas = new Map(), mat = tinta.make(), prof = tinta.depth();
  // (un teléfono se queda con algo más de la mitad de los árboles: los de suerte más baja. Los aljibes van todos.)
  const CORTE = liviano ? 140 : 256;
  let nArboles = 0, nAljibes = 0;
  for (let i = 0; i < datos.n; i++) {
    const r = datos.radio[i] / 10, s = datos.suerte[i]; if (r > 0 && s >= CORTE) continue;
    const x = (datos.x[i] - plaza[0]) * metro, z = (datos.y[i] - plaza[1]) * metro;
    const key = Math.floor(x / ZONA) + ',' + Math.floor(z / ZONA); let zo = zonas.get(key); if (!zo) zonas.set(key, (zo = { arboles: [], aljibes: [] }));
    (r > 0 ? zo.arboles : zo.aljibes).push(x, z, r, (s + 0.5) / 256);
    if (r > 0) nArboles++; else nAljibes++;
  }
  // tres copas: de cerca la más trabajada, con su tronco; de lejos, veinte caras
  const COPAS = [copa(2, true, 1), copa(1, false, 0.35), copa(0, false, 0)], [PIEDRA, HIERRO] = aljibe();
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), ARRIBA = new THREE.Vector3(0, 1, 0);
  const lista = [];
  for (const zo of zonas.values()) {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const a of [zo.arboles, zo.aljibes]) for (let i = 0; i < a.length; i += 4) { x0 = Math.min(x0, a[i]); x1 = Math.max(x1, a[i]); z0 = Math.min(z0, a[i + 1]); z1 = Math.max(z1, a[i + 1]); }
    const esfera = new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, 5, (z0 + z1) / 2), Math.hypot(x1 - x0, z1 - z0) / 2 + 14);
    /** Una malla instanciada de la zona. `clase`: 50 follaje · 60 piedra · 70 hierro (ver src/tinta.js). */
    const malla = (a, formas, clase, poner) => {
      const n = a.length / 4, ai = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
      const geos = formas.map((c) => { const g = new THREE.BufferGeometry(); if (c.index) g.setIndex(c.index); g.setAttribute('position', c.attributes.position); g.setAttribute('normal', c.attributes.normal); g.setAttribute('aInfo', ai); return g; });
      const inst = new THREE.InstancedMesh(geos[geos.length - 1], mat, n);
      for (let i = 0; i < n; i++) {
        const x = a[i * 4], z = a[i * 4 + 1], s = a[i * 4 + 3];
        poner(a[i * 4 + 2], s, Math.abs(Math.sin((x + z * 1.7) * 12.9898) * 43758.5453) % 1);
        M.compose(V.set(x, 0, z), Q.setFromAxisAngle(ARRIBA, s * 39), S); inst.setMatrixAt(i, M);
        // (la distancia a la plaza va en negativo: es la seña de que esto solo existe en color. Ver alzado(), en tinta.js)
        ai.setXYZW(i, s, clase, 0, -1 - Math.hypot(x, z));
      }
      inst.boundingSphere = esfera; inst.customDepthMaterial = prof; inst.castShadow = true; inst.receiveShadow = false;
      group.add(inst);
      return { inst, geos };
    };
    const z = { esfera, copas: null, aljibes: [] };
    // los árboles: los hay redondos, altos y, entre los chicos, parras y matas bajas y anchas
    if (zo.arboles.length) z.copas = malla(zo.arboles, COPAS, 50, (r, s, t) => { const baja = r < 2.3 && t < 0.3; S.set(r * (0.88 + 0.3 * t), r * (baja ? 0.5 + t * 0.5 : 0.95 + s * 0.55), r * (1.12 - 0.3 * t)); });
    if (zo.aljibes.length) for (const [forma, clase] of [[PIEDRA, 60], [HIERRO, 70]]) z.aljibes.push(malla(zo.aljibes, [forma], clase, (r, s) => S.setScalar(1.05 + s * 0.25)).inst);
    lista.push(z);
  }
  // hasta dónde llega cada cosa, en metros de la cámara al borde de la zona
  const D = liviano ? { fina: 220, media: 700, simple: 3200, sombra: 900, aljibe: 400 } : { fina: 350, media: 1100, simple: 5200, sombra: 2400, aljibe: 800 };
  tinta.U.uMatas.value = D.simple; // (más allá, el suelo los pinta: sueloColor, en tinta.js)
  /** Con el color apagado no hay nada. Prendido: de cada zona, qué copa le toca según lo lejos que esté (o ninguna). */
  const detalle = (pos, color) => {
    group.visible = color > 0; if (!group.visible) return;
    for (const { esfera, copas, aljibes } of lista) {
      const d = pos.distanceTo(esfera.center) - esfera.radius;
      if (copas) {
        const { inst, geos } = copas, g = geos[d < D.fina ? 0 : d < D.media ? 1 : 2];
        inst.visible = d < D.simple; inst.castShadow = d < D.sombra; if (inst.geometry !== g) inst.geometry = g;
      }
      for (const a of aljibes) a.visible = d < D.aljibe;
    }
  };
  return { group, detalle, cuenta: { arboles: nArboles, aljibes: nAljibes, zonas: lista.length } };
}
