// Las vías, los vagones y los galpones de chapa, para los lugares que los necesiten. Son las mismas piezas de
// src/lugares/puerto-madero.js (que conserva las suyas: todo lo de ese archivo sale de una sola tirada al azar y no
// conviene tocarlo), sueltas del marco: cada una recibe el lugar `T` donde va (c.lugar) y trabaja en sus metros.
//   const F = ferro(c, al);   // al: la tirada al azar del lugar que las usa (los vagones salen de ahí)
//   F.via(T, F.curva(puntos)); F.cortes(T, A, B, 0.3);
export function ferro(c, al) {
  const { THREE, PINTA, PINTADO, TINTA } = c;
  const P = (tono, claro = 0.5) => ({ pinta: [tono, claro] });
  const NEGRO = P(PINTA.NEGRO, 0.14), OXIDO = P(PINTA.LADRILLO, 0.6), LONA = P(PINTA.LONA, 0.9), MADERA = P(PINTA.MADERA, 0.5), CHAPA = P(PINTA.CHAPA, 0.8), OCRE = P(PINTA.OCRE, 0.7), LADRILLO = P(PINTA.LADRILLO, 0.74);
  /** una quebrada con las esquinas redondeadas (de a cuartos, `pasadas` veces) y con un punto cada `paso` metros */
  const curva = (pts, pasadas = 3, paso = 12) => {
    for (let k = 0; k < pasadas; k++) { const o = [pts[0]]; for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1]; o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } o.push(pts[pts.length - 1]); pts = o; }
    const o = [pts[0]];
    for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1], d = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d < 0.5) continue; const n = Math.max(1, Math.ceil(d / paso)); for (let j = 1; j <= n; j++) o.push([a[0] + ((b[0] - a[0]) * j) / n, a[1] + ((b[1] - a[1]) * j) / n]); }
    return o;
  };
  /** la misma línea, corrida `d` metros a su derecha (hacia +z si va hacia +x) */
  const corrida = (pts, d) => pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [p[0] - ((b[1] - a[1]) / l) * d, p[1] + ((b[0] - a[0]) / l) * d]; });
  /** el largo de una línea */
  const largo = (pts) => { let l = 0; for (let i = 0; i + 1 < pts.length; i++) l += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); return l; };
  /** una tira a ras del suelo a lo largo de una línea: un paño por tramo (y, si es ancha, en fajas de hasta `faja`
   *  metros), para que siga el terreno sin triángulos larguísimos. (Con `tapete` saldrían de a miles.) */
  const tira = (T, pts, ancho, tono, y, claro, faja = 12) => {
    const fajas = Math.max(1, Math.ceil(ancho / faja)), v = [];
    for (let f = 0; f < fajas; f++) {
      const A = corrida(pts, -ancho / 2 + (ancho * f) / fajas), B = corrida(pts, -ancho / 2 + (ancho * (f + 1)) / fajas);
      for (let i = 0; i + 1 < pts.length; i++) v.push(A[i][0], y, A[i][1], B[i][0], y, B[i][1], B[i + 1][0], y, B[i + 1][1], A[i][0], y, A[i][1], B[i + 1][0], y, B[i + 1][1], A[i + 1][0], y, A[i + 1][1]);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); geo.computeVertexNormals();
    T.put(geo, PINTADO, { pinta: [tono, claro], raso: true });
  };
  /** una vía: los dos rieles (trocha ancha) y, si no va sobre una playa ya balastada, su cama de piedra */
  const via = (T, pts, cama = true) => { if (cama) tira(T, pts, 3, PINTA.BALASTO, 0.1, 0.7); for (const s of [-1, 1]) tira(T, corrida(pts, s * 0.84), 0.3, PINTA.NEGRO, 0.31, 0.2); };
  /** un corte de `n` vagones sobre el tramo de A a B, empezando a `s` metros de A; con `loco`, la pava de maniobras
   *  en la punta. Cubiertos (de madera, colorado óxido o gris), de bordes (con su carga) y chatas. */
  const corte = (T, A, B, s, n, loco = false) => {
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]), ux = (B[0] - A[0]) / L, uz = (B[1] - A[1]) / L, a = -Math.atan2(uz, ux), PASO = 9.6;
    const pone = (geo, t, y, kind, o) => T.put(geo.rotateY(a).translate(A[0] + ux * t, y, A[1] + uz * t), kind, o);
    n = Math.min(n, Math.floor((L - s) / PASO)); if (n < 1) return 0;
    pone(new THREE.BoxGeometry(n * PASO - 1, 0.5, 2.3), s + (n * PASO) / 2, 0.6, TINTA); // (los bastidores y las ruedas, de un saque)
    for (let i = 0; i < n; i++) {
      const t = s + (i + 0.5) * PASO, r = al();
      if (loco && i === 0) { // la locomotora: la caldera, la cabina, la chimenea
        pone(new THREE.CylinderGeometry(1.05, 1.05, 5.2, 8).rotateZ(Math.PI / 2).translate(0.9, 0, 0), t, 2.15, PINTADO, NEGRO); pone(new THREE.BoxGeometry(2.3, 2.9, 2.7).translate(-2.6, 0, 0), t, 2.3, PINTADO, NEGRO);
        pone(new THREE.CylinderGeometry(0.34, 0.26, 1.3, 6).translate(2.7, 0, 0), t, 3.8, TINTA); pone(new THREE.BoxGeometry(2.7, 0.14, 3).translate(-2.6, 0, 0), t, 3.82, TINTA);
      } else if (r < 0.56) { pone(new THREE.BoxGeometry(8.5, 2.6, 2.8), t, 2.15, PINTADO, r < 0.3 ? OXIDO : r < 0.44 ? MADERA : CHAPA); pone(new THREE.BoxGeometry(8.7, 0.16, 3), t, 3.53, TINTA); }
      else if (r < 0.86) { pone(new THREE.BoxGeometry(8.5, 1.15, 2.8), t, 1.42, PINTADO, P(PINTA.MADERA, 0.4)); pone(new THREE.BoxGeometry(7.8, 0.7, 2.3), t, 2.25, PINTADO, r < 0.7 ? LONA : OCRE); }
      else pone(new THREE.BoxGeometry(6.4, 1, 2.2), t, 1.35, PINTADO, MADERA); // (la chata, con cajones)
    }
    return n;
  };
  /** cortes sueltos a lo largo de una vía derecha, de A a B: más o menos `cuanto` de la vía ocupada. Devuelve cuántos vagones puso. */
  const cortes = (T, A, B, cuanto = 0.3, loco = 0.25) => {
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]); let s = 8 + al() * 60, n0 = 0;
    while (s < L - 40) { const n = 3 + Math.floor(al() * 9); if (al() < cuanto * 1.6) n0 += corte(T, A, B, s, n, al() < loco); s += n * 9.6 + 30 + al() * (60 / Math.max(0.1, cuanto)); }
    return n0;
  };
  /** la geometría de un techo a dos aguas de w × d que sube h, con la cumbrera a lo largo de x, centrado en el origen */
  const techo = (w, d, h) => {
    const a = w / 2, b = d / 2, geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([[-a, 0, b], [a, 0, b], [a, h, 0], [-a, 0, b], [a, h, 0], [-a, h, 0], [a, 0, -b], [-a, 0, -b], [-a, h, 0], [a, 0, -b], [-a, h, 0], [a, h, 0], [-a, 0, -b], [-a, 0, b], [-a, h, 0], [a, 0, b], [a, 0, -b], [a, h, 0]].flat(), 3)); geo.computeVertexNormals(); return geo;
  };
  /** Un galpón con el largo hacia donde apunta (ux, uz), centrado en (x, z): el cuerpo (de ladrillo, de chapa o de
   *  madera) y el techo a dos aguas; con `naves` > 1, en serrucho. Sin puertas: de lejos no se ven. */
  const nave = (T, x, z, ux, uz, w, d, h, { o = LADRILLO, cubierta = CHAPA, naves = 1, y = 0 } = {}) => {
    const a = -Math.atan2(uz, ux), pone = (geo, kind, q) => T.put(geo.rotateY(a).translate(x, y, z), kind, q);
    pone(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), PINTADO, o);
    for (let i = 0; i < naves; i++) pone(techo(w + 0.8, d / naves + 0.5, (d / naves) * 0.2).translate(0, h, -d / 2 + (i + 0.5) * (d / naves)), PINTADO, cubierta);
  };
  return { curva, corrida, largo, tira, via, corte, cortes, techo, nave, P, NEGRO, OXIDO, LONA, MADERA, CHAPA, OCRE, LADRILLO };
}
