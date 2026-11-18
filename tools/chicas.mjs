// Lo chico: las casillas (los rectangulitos de tinta llena con que el plano dibuja las casas sueltas de La Boca y de
// las orillas) y los árboles dibujados de a uno. A media resolución no se distinguen entre sí, así que esto se lee en
// el escaneo entero. La idea: quedarse con el "corazón" de la tinta (lo que sigue siendo tinta después de comerle un
// píxel de cada lado). Las letras, los cercos y las rayas desaparecen; quedan las manchas con cuerpo.
//   - un corazón rectangular y lleno es una casilla;
//   - uno chico y redondo es un árbol.
import sharp from 'sharp';

export async function chicas(fuente, { marco, umbral = 160, espeso = 18, ver = null, zona = null }) {
  const { data: g, info } = await sharp(fuente, { limitInputPixels: false }).greyscale().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, core = new Uint8Array(W * H);
  const [x0, y0, x1, y1] = marco;
  // tinta espesa: los píxeles con casi todo su alrededor (5 × 5) oscuro. Un rectángulo lleno pierde un píxel de cada
  // lado; un árbol (un garabato apretado) queda como una mancha; una letra, un cerco o una mata de pasto, desaparecen.
  {
    const fila = new Uint8Array(W * H);
    for (let y = y0 - 2; y < y1 + 2; y++) { let k = y * W + x0, s = 0; for (let d = -2; d <= 2; d++) s += g[k + d] < umbral ? 1 : 0; for (let x = x0; x < x1; x++, k++) { fila[k] = s; s += (g[k + 3] < umbral ? 1 : 0) - (g[k - 2] < umbral ? 1 : 0); } }
    for (let y = y0; y < y1; y++) for (let x = x0, k = y * W + x0; x < x1; x++, k++) if (fila[k - 2 * W] + fila[k - W] + fila[k] + fila[k + W] + fila[k + 2 * W] >= espeso) core[k] = 1;
  }
  // Las letras gordas de los carteles ("PLAZA", "25 DE MAYO") también dejan manchas: se reconocen porque la mancha es
  // parte de un trazo más grande, del tamaño de una letra. (Un árbol suelto es chico; uno pegado a un cerco se pierde
  // a lo largo del cerco, que es mucho más largo que una letra.)
  const letra = (s) => {
    const visto = new Set([s]), cola = [s]; let a0 = s % W, a1 = a0, b0 = (s / W) | 0, b1 = b0;
    while (cola.length) {
      const k = cola.pop(), x = k % W, y = (k / W) | 0; if (x < a0) a0 = x; if (x > a1) a1 = x; if (y < b0) b0 = y; if (y > b1) b1 = y;
      if (visto.size > 1800 || a1 - a0 > 90 || b1 - b0 > 90) return false;
      for (const q of [k - 1, k + 1, k - W, k + W]) if (g[q] < umbral && !visto.has(q)) { visto.add(q); cola.push(q); }
    }
    const w = a1 - a0 + 1, h = b1 - b0 + 1;
    return visto.size >= 260 && Math.min(w, h) >= 22;
  };
  const casillas = [], arboles = [], MAX = 420, st = new Int32Array(1 << 22), px = new Int32Array(MAX * 2);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const s = y * W + x; if (core[s] !== 1) continue;
    let top = 0, n = 0, sx = 0, sy = 0, sg = 0, nc = 0; st[top++] = s; core[s] = 2;
    while (top) {
      const k = st[--top], cx = k % W, cy = (k / W) | 0;
      if (n < MAX) { px[n * 2] = cx; px[n * 2 + 1] = cy; } n++; sx += cx; sy += cy; sg += g[k]; if (g[k] >= 150) nc++;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const q = k + dy * W + dx; if (core[q] === 1 && top < st.length) { core[q] = 2; st[top++] = q; } }
    }
    if (n < 6 || n > MAX) continue;
    // la caja más chica que lo encierra, a cualquier ángulo
    let best = null;
    for (let a = 0; a < 18; a++) {
      const th = (a * Math.PI) / 36, ux = Math.cos(th), uy = Math.sin(th); let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
      for (let i = 0; i < n; i++) { const p = px[i * 2] * ux + px[i * 2 + 1] * uy, q = -px[i * 2] * uy + px[i * 2 + 1] * ux; if (p < a0) a0 = p; if (p > a1) a1 = p; if (q < b0) b0 = q; if (q > b1) b1 = q; }
      const A = (a1 - a0 + 1) * (b1 - b0 + 1); if (!best || A < best.A) best = { A, ux, uy, a0, a1, b0, b1 };
    }
    const { ux, uy } = best, la = best.a1 - best.a0 + 1, lb = best.b1 - best.b0 + 1, largo = Math.max(la, lb), ancho = Math.min(la, lb), lleno = n / best.A;
    const cx = sx / n + 0.5, cy = sy / n + 0.5;
    // (a la mancha le falta el píxel que perdió de cada lado)
    const tono = sg / n, claro = nc / n;
    if (zona && cx > zona[0] && cy > zona[1] && cx < zona[2] && cy < zona[3]) console.log(zona[4], 'n', n, 'largo', largo.toFixed(1), 'ancho', ancho.toFixed(1), 'lleno', lleno.toFixed(2), 'tono', tono.toFixed(0), 'claro', claro.toFixed(2));
    if (lleno >= 0.7 && ancho >= 3.5 && largo >= 5 && largo <= 46 && tono < 92 && claro <= 0.02) {
      const at = (p, q) => [p * ux - q * uy + 0.5, p * uy + q * ux + 0.5];
      casillas.push({ x: cx, y: cy, largo: largo + 2, ancho: ancho + 2, lleno, Q: [at(best.a0 - 1, best.b0 - 1), at(best.a1 + 1, best.b0 - 1), at(best.a1 + 1, best.b1 + 1), at(best.a0 - 1, best.b1 + 1)] });
    } else if (n >= 8 && n <= 170 && ancho >= 2.5 && largo <= 17 && largo / ancho < 2.2 && lleno >= 0.5 && !letra(s)) arboles.push([cx, cy, Math.sqrt(n / Math.PI) + 1.6]);
  }
  if (ver) {
    // para mirar: recortes con las casillas en rojo y los árboles en verde
    for (const [name, vx, vy, vw, vh] of ver) {
      const o = Buffer.alloc(vw * vh * 3);
      for (let y = 0; y < vh; y++) for (let x = 0; x < vw; x++) { const v = g[(vy + y) * W + vx + x], k = (y * vw + x) * 3; o[k] = o[k + 1] = o[k + 2] = v; }
      const dot = (x, y, r, gg, b) => { x = Math.round(x - vx); y = Math.round(y - vy); if (x < 0 || y < 0 || x >= vw || y >= vh) return; const k = (y * vw + x) * 3; o[k] = r; o[k + 1] = gg; o[k + 2] = b; };
      for (const c of casillas) for (let i = 0; i < 4; i++) { const a = c.Q[i], b = c.Q[(i + 1) % 4]; for (let t = 0; t <= 1; t += 0.03) dot(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 255, 30, 30); }
      for (const [x, y, r] of arboles) for (let a = 0; a < 6.3; a += 0.3) dot(x + Math.cos(a) * r, y + Math.sin(a) * r, 20, 200, 60);
      await sharp(o, { raw: { width: vw, height: vh, channels: 3 } }).resize(vw * 4, vh * 4, { kernel: 'nearest' }).png().toFile(`tmp/chicas-${name}.png`);
    }
  }
  /** ¿Hay una letra gorda en (x, y)? (para las manchas que se leen a media resolución) */
  const esLetra = (x, y) => { x = Math.round(x); y = Math.round(y); for (let r = 0; r <= 4; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const k = (y + dy) * W + x + dx; if (g[k] < umbral) return letra(k); } return false; };
  return { casillas, arboles, esLetra };
}
