// Las mallas grandes, en trozos. Las casas de 1867, las que crecen después y los lugares hechos a mano son tres mallas
// de uno a dos millones de triángulos cada una, y se dibujaban enteras en cada cuadro, dos veces (una para la sombra y
// otra para la vista), aunque se estuviera mirando una sola manzana: entre siete y ocho millones de triángulos por
// cuadro en 1940. Acá cada malla se parte en una grilla de celdas de 800 m, y de cada celda sale un trozo con su
// propio bulto: lo que queda fuera de la vista (o fuera de la sombra) no se dibuja.
//
// No se copia nada: los triángulos se reordenan por celda en un solo índice, y cada trozo es una geometría que comparte
// los atributos y ese índice, y dibuja nada más que su tramo. La malla original queda de percha (ya no se dibuja
// ella): conserva su geometría, sus hijos y su `visible`, que es lo que usa el resto del código.
// Se ve igual: son los mismos triángulos con el mismo material.
import * as THREE from 'three';

// `?entera`: las mallas de una pieza, como antes (para comparar: tools/ritmo.mjs --entera)
const ENTERA = typeof location !== 'undefined' && new URLSearchParams(location.search).has('entera');
const OCULTO = new THREE.Material(); OCULTO.visible = false;
const PARTIDAS = []; let enteras = false;

/** De muy lejos se ve todo, y dibujar cientos de trozos sale más caro que dibujar cada malla de una vez: ahí se
 *  vuelve a las mallas enteras (son los mismos triángulos: el índice es uno solo). `si`: si la vista es de lejos. */
export function trozosEnteros(si) {
  if (si === enteras) return; enteras = si;
  for (const { mesh, trozos, material, sombra } of PARTIDAS) { mesh.material = si ? material : OCULTO; mesh.castShadow = si && sombra; for (const t of trozos) t.visible = !si; }
}

/** Parte `mesh` en trozos por celdas. `alto`: cuánto puede subir un punto por encima de su altura (la ola que levanta
 *  la ciudad se pasa un poco, y con `?relieve` el terreno la sube). Hay que llamarla antes del primer dibujo. */
export function trozar(mesh, { celda = 800, alto = 170 } = {}) {
  if (ENTERA) return [];
  const g = mesh.geometry, pos = g.attributes.position.array, nV = pos.length / 3;
  const viejo = g.index ? g.index.array : null, nT = (viejo ? viejo.length : nV) / 3;
  // (sin índice, los triángulos van de a tres puntos seguidos: se le arma uno)
  const idx = viejo ?? (() => { const a = new Uint32Array(nV); for (let k = 0; k < nV; k++) a[k] = k; return a; })();
  // a qué celda va cada triángulo (por su primer punto) y cuántos caen en cada una. (Con tablas, sin diccionarios:
  // son millones de triángulos y esto corre en el teléfono mientras se espera la ciudad.)
  // (la grilla: 128 × 128 celdas alrededor de la plaza; con celdas de 800 m, 51 km para cada lado)
  const ni = 128, nj = 128, i0 = -64, j0 = -64;
  const de = new Int32Array(nT), cuantosEn = new Int32Array(ni * nj);
  for (let t = 0; t < nT; t++) { const a = idx[t * 3] * 3, c = Math.min(nj - 1, Math.max(0, Math.floor(pos[a + 2] / celda) - j0)) * ni + Math.min(ni - 1, Math.max(0, Math.floor(pos[a] / celda) - i0)); de[t] = c; cuantosEn[c]++; }
  // el índice nuevo: los mismos triángulos, celda por celda y, adentro de cada una, en el orden en que estaban
  const arranqueEn = new Int32Array(ni * nj), va = new Int32Array(ni * nj), celdas = []; let n = 0;
  for (let c = 0; c < ni * nj; c++) { arranqueEn[c] = va[c] = n; n += cuantosEn[c]; if (cuantosEn[c]) celdas.push(c); }
  const nuevo = new (nV > 65535 ? Uint32Array : Uint16Array)(nT * 3);
  // (y de paso, la caja de cada celda: mínimos y máximos de x, y, z de sus puntos)
  const cajas = new Float32Array(ni * nj * 6); for (let c = 0; c < ni * nj; c++) { cajas[c * 6] = cajas[c * 6 + 1] = cajas[c * 6 + 2] = Infinity; cajas[c * 6 + 3] = cajas[c * 6 + 4] = cajas[c * 6 + 5] = -Infinity; }
  for (let t = 0; t < nT; t++) {
    const c = de[t], o = va[c]++ * 3, b = c * 6;
    for (let e = 0; e < 3; e++) { const q = idx[t * 3 + e], a = q * 3, x = pos[a], y = pos[a + 1], z = pos[a + 2]; nuevo[o + e] = q; if (x < cajas[b]) cajas[b] = x; if (y < cajas[b + 1]) cajas[b + 1] = y; if (z < cajas[b + 2]) cajas[b + 2] = z; if (x > cajas[b + 3]) cajas[b + 3] = x; if (y > cajas[b + 4]) cajas[b + 4] = y; if (z > cajas[b + 5]) cajas[b + 5] = z; }
  }
  g.setIndex(new THREE.BufferAttribute(nuevo, 1));
  const trozos = [];
  for (const c of celdas) {
    const t0 = arranqueEn[c], cuantos = cuantosEn[c], caja = new THREE.Box3();
    const b = c * 6; caja.min.set(cajas[b], Math.min(cajas[b + 1], 0) - 5, cajas[b + 2]); caja.max.set(cajas[b + 3], cajas[b + 4] * 1.2 + alto, cajas[b + 5]);
    const gt = new THREE.BufferGeometry();
    for (const nombre in g.attributes) gt.setAttribute(nombre, g.attributes[nombre]);
    gt.setIndex(g.index); gt.setDrawRange(t0 * 3, cuantos * 3);
    gt.boundingBox = caja; gt.boundingSphere = caja.getBoundingSphere(new THREE.Sphere());
    const m = new THREE.Mesh(gt, mesh.material);
    m.customDepthMaterial = mesh.customDepthMaterial; m.castShadow = mesh.castShadow; m.receiveShadow = mesh.receiveShadow; m.renderOrder = mesh.renderOrder;
    m.matrixAutoUpdate = false; m.userData.trozo = true;
    trozos.push(m);
  }
  // (los trozos van antes que los otros hijos de la malla, para que se dibujen en el orden en que se dibujaba ella)
  const hijos = mesh.children.slice(); for (const h of hijos) mesh.remove(h);
  mesh.add(...trozos, ...hijos);
  PARTIDAS.push({ mesh, trozos, material: mesh.material, sombra: mesh.castShadow });
  if (enteras) for (const t of trozos) t.visible = false; else { mesh.material = OCULTO; mesh.castShadow = false; }
  return trozos;
}
