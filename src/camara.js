// La cámara: como mirar un plano sobre la mesa. Se lo arrastra, se acerca con la rueda, y al acercarse la cámara se
// inclina sola: de lejos se ve el plano de arriba; de cerca, la ciudad de costado.
//   arrastrar            mover          rueda / pellizco        acercar
//   botón derecho, o ⇧   girar e inclinar (desde ahí, la inclinación queda en manos de quien mira)
// En el teléfono, los gestos de cualquier mapa: ver más abajo, donde se atiende el puntero.
import * as THREE from 'three';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function createCamara(camera, el, { bounds, far = 9000 }) {
  let quieta = false, salto = false;
  const goal = { x: 0, z: 0, dist: far, yaw: 0, pitch: Math.PI / 2 }, now = { ...goal };
  let auto = true, fly = null;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
  /** la inclinación que corresponde a cada distancia, mientras nadie la toque */
  const tilt = (dist) => { const t = clamp((Math.log(dist) - Math.log(700)) / (Math.log(6500) - Math.log(700)), 0, 1), s = t * t * (3 - 2 * t); return 0.5 + (Math.PI / 2 - 0.5) * s; };
  const place = (s, c = camera) => {
    const cp = Math.cos(s.pitch), sp = Math.sin(s.pitch);
    c.position.set(s.x + Math.sin(s.yaw) * cp * s.dist, sp * s.dist, s.z + Math.cos(s.yaw) * cp * s.dist);
    c.up.set(-Math.sin(s.yaw) * sp, cp, -Math.cos(s.yaw) * sp);
    c.lookAt(s.x, 0, s.z);
    c.near = Math.max(2, s.dist * 0.04); c.far = s.dist * 5 + 16000;
    c.updateProjectionMatrix(); c.updateMatrixWorld(true);
  };
  /** el punto del suelo que está debajo de un punto de la pantalla, con la cámara puesta en `s` */
  const ground = (s, cx, cy) => {
    place(s);
    const r = el.getBoundingClientRect(); ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.ray.intersectPlane(plane, hit) ? hit.clone() : null;
  };
  const limit = () => {
    goal.dist = clamp(goal.dist, 170, far * 1.25); goal.pitch = clamp(goal.pitch, 0.16, Math.PI / 2);
    goal.x = clamp(goal.x, bounds[0], bounds[2]); goal.z = clamp(goal.z, bounds[1], bounds[3]);
  };
  const zoom = (factor, cx, cy) => {
    fly = null;
    const a = ground(goal, cx, cy);
    goal.dist = clamp(goal.dist * factor, 170, far * 1.25);
    if (auto) goal.pitch = tilt(goal.dist);
    const b = ground(goal, cx, cy);
    if (a && b) { goal.x += a.x - b.x; goal.z += a.z - b.z; }
    limit();
  };

  // --- el puntero. Con el ratón: arrastrar mueve; botón derecho o ⇧, gira e inclina. Con los dedos:
  //   un dedo            mover (y al soltarlo con impulso, sigue un poco)
  //   dos dedos          acercar y mover a la vez; girar, recién cuando el giro es franco (si no, cualquier
  //                      pellizco torcía el plano); los dos subiendo o bajando juntos, inclinar
  //   dos toques         acercar          dos toques y arrastrar    acercar o alejar con un solo dedo
  //   un toque con dos dedos              alejar
  const ptrs = new Map(); let grab = null, dos = null, turning = false, huboDos = false;
  let rastro = [], inercia = null, abajo = null, ultimoToque = null, doble = null;
  const ahora = () => performance.now();
  const medida = () => { const [a, b] = [...ptrs.values()]; return { d: Math.hypot(a.x - b.x, a.y - b.y), a: Math.atan2(b.y - a.y, b.x - a.x), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }; };
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  el.addEventListener('pointerdown', (e) => {
    el.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY }); fly = null; inercia = null;
    if (ptrs.size === 1) {
      const t = ahora(), tactil = e.pointerType === 'touch';
      abajo = { x: e.clientX, y: e.clientY, t, tactil }; huboDos = false; rastro = [];
      // ¿el segundo de dos toques seguidos? Entonces este dedo no mueve: acerca (al soltar, o arrastrando)
      doble = tactil && ultimoToque && t - ultimoToque.t < 330 && Math.hypot(e.clientX - ultimoToque.x, e.clientY - ultimoToque.y) < 34 ? { x: e.clientX, y: e.clientY, dist: goal.dist, movio: false } : null;
      ultimoToque = null;
      turning = !doble && (e.button === 2 || e.shiftKey || e.ctrlKey); grab = turning || doble ? null : ground(goal, e.clientX, e.clientY);
    } else if (ptrs.size === 2) { dos = { ...medida(), modo: null, giro: 0, girando: false, t: ahora(), quieto: true }; grab = null; doble = null; huboDos = true; }
  });
  el.addEventListener('pointermove', (e) => {
    const p = ptrs.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (ptrs.size === 1) {
      if (doble) {
        // (hacia abajo acerca, hacia arriba aleja; lo tocado se queda en su lugar)
        if (!doble.movio && Math.abs(e.clientY - doble.y) < 7) return;
        doble.movio = true; zoom((doble.dist * Math.exp((doble.y - e.clientY) * 0.011)) / goal.dist, doble.x, doble.y);
      } else if (turning) { goal.yaw -= dx * 0.005; goal.pitch += dy * 0.004; auto = false; limit(); }
      else if (grab) {
        const g = ground(goal, e.clientX, e.clientY); if (g) { goal.x += grab.x - g.x; goal.z += grab.z - g.z; limit(); }
        const t = ahora(); rastro.push({ t, x: goal.x, z: goal.z }); while (rastro.length > 2 && t - rastro[0].t > 110) rastro.shift();
      }
    } else if (ptrs.size === 2 && dos) {
      const m = medida(), [A, B] = [...ptrs.values()];
      if (!dos.modo) {
        // todavía no se sabe qué quieren los dos dedos: se espera a que se muevan un poco
        const yA = A.y - A.y0, yB = B.y - B.y0, xA = A.x - A.x0, xB = B.x - B.x0, lado = Math.abs(B.x0 - A.x0) > Math.abs(B.y0 - A.y0) * 1.2;
        // (los dedos avisan de a uno: mientras todavía pueda ser «los dos juntos para arriba o abajo», se espera)
        const puede = lado && yA * yB >= 0 && Math.abs(m.d - dos.d) < 8 + dos.d * 0.1 && Math.abs(xA) + Math.abs(xB) < (Math.abs(yA) + Math.abs(yB)) * 0.7 + 4;
        let da = m.a - dos.a; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
        if (puede && Math.min(Math.abs(yA), Math.abs(yB)) > 7) dos.modo = 'inclinar';
        else if (puede && Math.max(Math.abs(yA), Math.abs(yB)) < 26) return;
        else if (Math.abs(m.d - dos.d) > 9 || Math.abs(da) * dos.d > 14 || Math.hypot(m.cx - dos.cx, m.cy - dos.cy) > 11) dos.modo = 'mover';
        else return;
        Object.assign(dos, m, { quieto: false }); return; // (se arranca desde acá: sin salto)
      }
      if (dos.modo === 'inclinar') { goal.pitch += (m.cy - dos.cy) * 0.006; auto = false; }
      else {
        // lo que estaba bajo el medio de los dos dedos sigue bajo el medio de los dos dedos
        const g0 = ground(goal, dos.cx, dos.cy);
        goal.dist = clamp((goal.dist * dos.d) / Math.max(1, m.d), 170, far * 1.25); if (auto) goal.pitch = tilt(goal.dist);
        let da = m.a - dos.a; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
        if (dos.girando) goal.yaw -= da; else { dos.giro += da; if (Math.abs(dos.giro) > 0.21) dos.girando = true; }
        const g1 = ground(goal, m.cx, m.cy);
        if (g0 && g1) { goal.x += g0.x - g1.x; goal.z += g0.z - g1.z; }
      }
      Object.assign(dos, m); limit();
    }
  });
  const up = (e) => {
    if (!ptrs.delete(e.pointerId)) return;
    const t = ahora(), cancelado = e.type === 'pointercancel';
    if (dos) {
      // un toque corto con dos dedos, sin moverlos: alejar
      if (dos.quieto && !cancelado && t - dos.t < 320) { const r = el.getBoundingClientRect(); zoom(2, dos.cx ?? r.left + r.width / 2, dos.cy ?? r.top + r.height / 2); }
      dos = null;
    }
    if (ptrs.size === 1) { const [p] = [...ptrs.values()]; grab = ground(goal, p.x, p.y); turning = false; rastro = []; return; }
    if (ptrs.size) return;
    if (doble) { if (!doble.movio && !cancelado) zoom(0.5, doble.x, doble.y); }
    else if (abajo && !cancelado && !huboDos) {
      const quieto = Math.hypot(e.clientX - abajo.x, e.clientY - abajo.y) < 8;
      if (quieto && abajo.tactil && t - abajo.t < 300) ultimoToque = { t, x: e.clientX, y: e.clientY };
      // el impulso: si el dedo venía moviéndose al soltar, el plano sigue y se va frenando
      else if (!quieto && abajo.tactil && grab && rastro.length > 1) {
        const a = rastro[0], b = rastro[rastro.length - 1], dt = (b.t - a.t) / 1000;
        if (dt > 0.025 && t - b.t < 70) { const vx = (b.x - a.x) / dt, vz = (b.z - a.z) / dt; if (Math.hypot(vx, vz) > goal.dist * 0.18) inercia = { vx, vz }; }
      }
    }
    grab = null; doble = null; abajo = null; rastro = [];
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  el.addEventListener('wheel', (e) => { e.preventDefault(); inercia = null; zoom(Math.exp(clamp(e.deltaY, -240, 240) * (e.ctrlKey ? 0.008 : 0.0016)), e.clientX, e.clientY); }, { passive: false });
  const keys = new Set();
  addEventListener('keydown', (e) => { if (e.target.tagName !== 'INPUT') keys.add(e.code); });
  addEventListener('keyup', (e) => keys.delete(e.code)); addEventListener('blur', () => keys.clear());

  return {
    goal, now,
    get auto() { return auto; }, set auto(v) { auto = v; },
    /** Ir a un lugar: { x, z, dist, yaw, pitch }, en `secs` segundos. */
    flyTo(to, secs = 3) { inercia = null; fly = { from: { ...goal }, to: { ...goal, ...to }, t: 0, secs }; if (to.pitch != null) auto = false; },
    jump(to) { inercia = null; salto = true; Object.assign(goal, to); limit(); Object.assign(now, goal); fly = null; place(now); },
    update(dt) {
      const k = (c) => keys.has(c) ? 1 : 0, mx = k('KeyD') + k('ArrowRight') - k('KeyA') - k('ArrowLeft'), mz = k('KeyS') + k('ArrowDown') - k('KeyW') - k('ArrowUp');
      if (mx || mz) { fly = null; const sp = goal.dist * 0.9 * dt, c = Math.cos(goal.yaw), s = Math.sin(goal.yaw); goal.x += (mx * c + mz * s) * sp; goal.z += (-mx * s + mz * c) * sp; }
      const rot = k('KeyE') - k('KeyQ'); if (rot) { fly = null; goal.yaw += rot * dt * 1.1; }
      const zk = k('Minus') + k('NumpadSubtract') - k('Equal') - k('NumpadAdd'); if (zk) { const r = el.getBoundingClientRect(); zoom(Math.exp(zk * dt * 1.4), r.left + r.width / 2, r.top + r.height / 2); }
      if (fly) {
        fly.t = Math.min(1, fly.t + dt / fly.secs);
        const e = fly.t < 0.5 ? 4 * fly.t ** 3 : 1 - (-2 * fly.t + 2) ** 3 / 2, { from, to } = fly;
        goal.x = from.x + (to.x - from.x) * e; goal.z = from.z + (to.z - from.z) * e; goal.yaw = from.yaw + (to.yaw - from.yaw) * e; goal.pitch = from.pitch + (to.pitch - from.pitch) * e;
        goal.dist = Math.exp(Math.log(from.dist) + (Math.log(to.dist) - Math.log(from.dist)) * e);
        if (fly.t >= 1) fly = null;
      }
      if (inercia) {
        goal.x += inercia.vx * dt; goal.z += inercia.vz * dt;
        const k = Math.exp(-dt * 4.2); inercia.vx *= k; inercia.vz *= k;
        if (Math.hypot(inercia.vx, inercia.vz) < goal.dist * 0.03) inercia = null;
      }
      limit();
      const a = 1 - Math.exp(-dt * (fly ? 30 : 9));
      now.x += (goal.x - now.x) * a; now.z += (goal.z - now.z) * a; now.yaw += (goal.yaw - now.yaw) * a; now.pitch += (goal.pitch - now.pitch) * a;
      now.dist = Math.exp(Math.log(now.dist) + (Math.log(goal.dist) - Math.log(now.dist)) * a);
      // cuando ya casi llegó, llega: así se sabe que la cámara está quieta y no hace falta volver a dibujar
      const cerca = Math.abs(goal.x - now.x) + Math.abs(goal.z - now.z) < now.dist * 2e-4 && Math.abs(Math.log(goal.dist / now.dist)) < 2e-4 && Math.abs(goal.yaw - now.yaw) + Math.abs(goal.pitch - now.pitch) < 2e-4;
      quieta = cerca && !fly && !inercia && !salto && !(mx || mz || rot || zk); salto = false;
      if (cerca) Object.assign(now, goal);
      place(now);
    },
    /** Adónde va la cámara: el final del vuelo, si está volando; si no, donde la dejó quien mira. */
    get destino() { return fly ? fly.to : goal; },
    /** Pone otra cámara como quedaría esta en `s` (para saber qué se va a ver al llegar). */
    posar(c, s) { place(s, c); },
    /** ¿La cámara ya está donde tiene que estar? (después de update) */
    get quieta() { return quieta; },
    /** Hasta dónde se puede alejar (cambia con la forma de la ventana). */
    set far(v) { far = v; },
    get flying() { return !!fly; },
  };
}
