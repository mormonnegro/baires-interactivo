// Los nombres de las calles de hoy, escritos sobre el plano cuando «lo de hoy» está prendido y uno se acerca.
// tools/calles.mjs deja un ancla por cuadra (el medio del tramo entre dos esquinas, con la dirección de la calle y el
// largo del tramo). Acá, en cada cuadro, se proyectan las anclas de alrededor y se escribe cada nombre girado como va
// la calle en la pantalla, en un lienzo 2D puesto encima de la vista. Un nombre no pisa a otro (grilla de ocupación),
// no se repite pegado, y aparece y se va de a poco. Los que ya estaban tienen prioridad: así no parpadean al moverse.
import * as THREE from 'three';
import { u } from './url.js';

const TINTA = '#8f2a1a', PAPEL = '#f4ead3';
const FUENTE = ['italic 12.5px "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif', '600 13px "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif'];
const D_CALLE = 1500, D_AVENIDA = 3600; // hasta qué distancia de cámara se nombran las calles y las avenidas
const CELDA = 300, PASO = 13; // metros de la grilla de anclas; píxeles de la grilla de ocupación

export function createCalles(camera, cam, { mundo, suelo = () => 0 }) {
  const el = Object.assign(document.createElement('canvas'), { id: 'calles' });
  el.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;';
  document.getElementById('marcas')?.before(el);
  const ctx = el.getContext('2d'), v = new THREE.Vector3();
  let D = null, pedido = null, sucio = false, cuadro = 0, sellos = new Int32Array(0), cols = 0, filas = 0;
  const vivos = new Map(), anchos = [new Map(), new Map()]; // ancla → { a, sx, sy, ang }

  function cargar() {
    pedido ??= Promise.all([fetch(u('datos/calles.bin')).then((r) => r.arrayBuffer()), fetch(u('datos/calles.json')).then((r) => r.json())]).then(([buf, nombres]) => {
      const u = new Uint16Array(buf), n = u.length / 6, x = new Float32Array(n), z = new Float32Array(n), dx = new Float32Array(n), dz = new Float32Array(n), grilla = new Map();
      for (let i = 0; i < n; i++) {
        [x[i], z[i]] = mundo(u[i * 6], u[i * 6 + 1]);
        const a = (u[i * 6 + 2] / 65536) * Math.PI; dx[i] = Math.cos(a); dz[i] = Math.sin(a);
        const k = Math.floor(x[i] / CELDA) + ',' + Math.floor(z[i] / CELDA); let c = grilla.get(k); if (!c) grilla.set(k, (c = [])); c.push(i);
      }
      D = { n, u, x, z, dx, dz, grilla, nombres };
    }).catch(() => {});
    return pedido;
  }
  const ancho = (nombre, clase) => { let w = anchos[clase].get(nombre); if (w === undefined) { ctx.font = FUENTE[clase]; w = ctx.measureText(nombre).width; anchos[clase].set(nombre, w); } return w; };
  const pantalla = (x, z, W, H) => { v.set(x, suelo(x, z), z).project(camera); return v.z < 1 ? [(v.x * 0.5 + 0.5) * W, (-v.y * 0.5 + 0.5) * H] : null; };
  const borrar = () => { if (sucio) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, el.width, el.height); sucio = false; } };

  return {
    cargar,
    get datos() { return D; },
    /** Los nombres de calle de hoy que pasan cerca de un punto del mundo: [nombre, metros], del más cercano al más lejano. */
    cerca(x, z, radio = 200) {
      const out = []; if (!D) return out;
      for (let j = Math.floor((z - radio) / CELDA); j <= Math.floor((z + radio) / CELDA); j++) for (let i = Math.floor((x - radio) / CELDA); i <= Math.floor((x + radio) / CELDA); i++)
        for (const k of D.grilla.get(i + ',' + j) ?? []) { const d = Math.hypot(D.x[k] - x, D.z[k] - z); if (d < radio) out.push([D.nombres[D.u[k * 6 + 3]], d]); }
      return out.sort((a, b) => a[1] - b[1]);
    },
    /** `k`: cuánto de «lo de hoy» está a la vista (0..1). `dt`: segundos. `yaEsta`: sin transiciones (para capturas).
     *  Devuelve si quedó algo animándose. */
    update(k, dt, yaEsta = false) {
      const dist = cam.now.dist;
      if (!D || k <= 0.01 || dist > D_AVENIDA) { borrar(); vivos.clear(); return false; }
      const dpr = Math.min(devicePixelRatio || 1, 2), W = el.clientWidth, H = el.clientHeight;
      if (el.width !== Math.round(W * dpr) || el.height !== Math.round(H * dpr)) { el.width = Math.round(W * dpr); el.height = Math.round(H * dpr); }
      if (cols !== Math.ceil(W / PASO) + 2 || filas !== Math.ceil(H / PASO) + 2) { cols = Math.ceil(W / PASO) + 2; filas = Math.ceil(H / PASO) + 2; sellos = new Int32Array(cols * filas); }
      cuadro++;
      // --- las candidatas: las anclas de alrededor de lo que se mira; primero las que ya estaban escritas ---
      const R = Math.min(2400, dist * 1.4 + 150), cx = cam.now.x, cz = cam.now.z, cand = [];
      for (let j = Math.floor((cz - R) / CELDA); j <= Math.floor((cz + R) / CELDA); j++) for (let i = Math.floor((cx - R) / CELDA); i <= Math.floor((cx + R) / CELDA); i++) {
        const c = D.grilla.get(i + ',' + j); if (!c) continue;
        for (const a of c) if (D.u[a * 6 + 5] || dist < D_CALLE) cand.push(a);
      }
      cand.sort((a, b) => (vivos.get(b)?.puesta ? 1 : 0) - (vivos.get(a)?.puesta ? 1 : 0) || a - b);
      for (const m of vivos.values()) m.puesta = false;
      const libre = (sx, sy, cs, sn, w, marcar) => {
        for (let t = -w / 2; t <= w / 2 + PASO * 0.6; t += PASO * 0.8) for (let lado = -1; lado <= 1; lado++) {
          const px = sx + t * cs - lado * 8 * sn, py = sy + t * sn + lado * 8 * cs;
          const ci = Math.floor(px / PASO) + 1, cj = Math.floor(py / PASO) + 1; if (ci < 0 || cj < 0 || ci >= cols || cj >= filas) continue;
          if (marcar) sellos[cj * cols + ci] = cuadro; else if (sellos[cj * cols + ci] === cuadro) return false;
        }
        return true;
      };
      const porNombre = new Map(); let puestas = 0;
      for (const a of cand) {
        if (puestas >= 90) break;
        const clase = D.u[a * 6 + 5], nombre = D.nombres[D.u[a * 6 + 3]], L = D.u[a * 6 + 4];
        let p = pantalla(D.x[a], D.z[a], W, H); if (!p) continue;
        const p0 = p;
        const q = pantalla(D.x[a] + D.dx[a] * 20, D.z[a] + D.dz[a] * 20, W, H); if (!q) continue;
        const s = Math.hypot(q[0] - p0[0], q[1] - p0[1]) / 20; // píxeles por metro, a lo largo de la calle
        if (s < (clase ? 0.2 : 0.4)) continue;
        const w = ancho(nombre, clase);
        if (w > L * s * (clase ? 3.4 : 1.3)) continue; // (no entra en su cuadra)
        // de muy cerca la cuadra es más larga que la pantalla: el nombre se corre por su cuadra hacia lo que se mira
        const juego = L / 2 - w / (2 * s) - 12;
        if (juego > 4) {
          const t = Math.max(-juego, Math.min(juego, (cx - D.x[a]) * D.dx[a] + (cz - D.z[a]) * D.dz[a]));
          if (Math.abs(t) > 1) { p = pantalla(D.x[a] + D.dx[a] * t, D.z[a] + D.dz[a] * t, W, H); if (!p) continue; }
        }
        const [sx, sy] = p;
        if (sx < -20 || sy < -20 || sx > W + 20 || sy > H + 20) continue;
        let ang = Math.atan2(q[1] - p0[1], q[0] - p0[0]);
        if (ang > Math.PI / 2) ang -= Math.PI; else if (ang <= -Math.PI / 2) ang += Math.PI;
        const cs = Math.cos(ang), sn = Math.sin(ang);
        const otros = porNombre.get(nombre), lejos = clase ? 400 : 300;
        if (otros && otros.some((o) => Math.hypot(o[0] - sx, o[1] - sy) < lejos)) continue;
        if (!libre(sx, sy, cs, sn, w, false)) continue;
        libre(sx, sy, cs, sn, w, true);
        if (otros) otros.push([sx, sy]); else porNombre.set(nombre, [[sx, sy]]);
        let m = vivos.get(a); if (!m) vivos.set(a, (m = { a: 0, nombre, clase }));
        m.sx = sx; m.sy = sy; m.ang = ang; m.puesta = true; puestas++;
      }
      // --- escribir: los puestos suben, los que quedaron afuera se van ---
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); sucio = true;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = 3.4; ctx.strokeStyle = PAPEL; ctx.fillStyle = TINTA;
      const lejosC = 1 - Math.min(1, Math.max(0, (dist - D_CALLE * 0.86) / (D_CALLE * 0.14))), lejosA = 1 - Math.min(1, Math.max(0, (dist - D_AVENIDA * 0.86) / (D_AVENIDA * 0.14)));
      let animando = false;
      for (const [a, m] of vivos) {
        m.a = yaEsta ? +m.puesta : m.puesta ? Math.min(1, m.a + dt * 5) : m.a - dt * 7;
        if (m.a <= 0) { vivos.delete(a); continue; }
        if (m.a < 1) animando = true;
        const alfa = m.a * k * (m.clase ? lejosA : lejosC); if (alfa < 0.02) continue;
        ctx.globalAlpha = alfa; ctx.font = FUENTE[m.clase];
        ctx.setTransform(dpr, 0, 0, dpr, m.sx * dpr, m.sy * dpr); ctx.rotate(m.ang);
        ctx.strokeText(m.nombre, 0, 0); ctx.fillText(m.nombre, 0, 0);
      }
      ctx.globalAlpha = 1;
      return animando; // (¿quedó algún nombre a medio aparecer o irse? Entonces hay que volver a pasar)
    },
  };
}
