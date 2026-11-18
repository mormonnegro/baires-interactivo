// El puerto: de la rada de 1867 a los diques de Madero y la Costanera Sur.
//   · 1867 y 1888 (etapas 0 y 1): no hay puerto. Los barcos de ultramar fondean en la rada, río adentro; se baja en
//     balleneras hasta el muelle de pasajeros y, con el río bajo, en carros de ruedas altas que entran al agua.
//   · 1895 (etapa 2): la Dársena Sur (1889) y los diques 1, 2 (1890) y 3 (1892) con sus murallones de piedra, los
//     puentes giratorios, las grúas hidráulicas y vapores amarrados. Del lado de la ciudad, los galpones bajos que el
//     plano de 1895 dibuja donde después van los docks. El Dique 4 y la Dársena Norte se habilitaron en 1897: llevan
//     barcos recién desde 1905.
//   · 1905 (etapa 3): los docks —los depósitos de ladrillo de Hawkshaw, Son & Hayter, cuatro por dique— con las grúas
//     colgadas del frente (fotos «Dique 1, sección 4» y «Dique 2, sección 4», c. 1900-1910): cinco en el Dique 3; del lado del río, los
//     elevadores de granos de chapa (foto de H. G. Olds, «Puerto Madero. Elevadores de granos») y el molino con sus
//     silos (Molinos Río de la Plata, desde 1902, sobre el Dique 2).
//   · 1921 (etapa 5): la Costanera Sur de Brasil a Belgrano (el Balneario Municipal, inaugurado el 11-12-1918): la
//     rambla con su murallón, la balaustrada y las escalinatas al río, el espigón (1919), los jardines y la Fuente de
//     las Nereidas (Lola Mora, 1903; mudada acá en 1918). Y el Yacht Club, en la boca de la Dársena Norte (1915).
//   · 1940 (etapa 6): la costanera sigue hacia el norte (1924, con los canteros de Forestier), las pérgolas y la
//     Cervecería Munich (Kálnay, 1927).
// Los contornos de los diques salen de OpenStreetMap (fuentes/osm/lagos.json), que son los mismos de 1897; lo que hay
// a cada lado, de los planos de 1895 (Obras Públicas), 1905 (Ludwig), 1921 (Cannizzaro) y 1936 (Peuser).
// Los lugares, en píxeles del plano de 1867 (x al norte, y al río); las medidas, en metros. El agua está a la altura
// del suelo: los cascos flotan en y = 0.
export default function (c) {
  const { THREE, PINTA, PINTADO, PIEDRA, TINTA, PIZARRA, CASA } = c, M = 0.675;
  /** un color parejo: de qué va pintado y qué tan claro sale en tinta */
  const P = (tono, claro = 0.5) => ({ pinta: [tono, claro] });
  const NEGRO = P(PINTA.NEGRO, 0.12), BLANCO = P(PINTA.BLANCO, 0.97), ROJO = P(PINTA.ROJO, 0.35), LONA = P(PINTA.LONA, 0.9), MADERA = P(PINTA.MADERA, 0.55), CHAPA = P(PINTA.CHAPA, 0.8), OCRE = P(PINTA.OCRE, 0.7), LADRILLO = P(PINTA.LADRILLO, 0.74);
  let azar = 0.4217; const al = () => (azar = (azar * 9301 + 0.2113) % 1); // (siempre la misma tirada)

  // ----------------------------------------------------------------------------------------------- piezas sueltas
  /** la planta de un casco de eslora L y manga B: la proa (en punta) hacia +x, la popa redonda */
  const planta = (L, B) => [[-L / 2, -B * 0.28], [-L * 0.46, -B * 0.45], [-L * 0.3, -B / 2], [L * 0.25, -B / 2], [L * 0.4, -B * 0.33], [L / 2, 0], [L * 0.4, B * 0.33], [L * 0.25, B / 2], [-L * 0.3, B / 2], [-L * 0.46, B * 0.45], [-L / 2, B * 0.28]];
  /** una traca del casco: la planta levantada de y0 a y1, sin tapas (con `tapa`, solo la cubierta, a la altura y1) */
  const traca = (pts, y0, y1, tapa = false) => {
    const v = [], n = pts.length; let a = 0, cx = 0, cz = 0;
    for (let i = 0; i < n; i++) { const [x0, z0] = pts[i], [x1, z1] = pts[(i + 1) % n]; a += x0 * z1 - x1 * z0; cx += x0 / n; cz += z0 / n; }
    for (let i = 0; i < n; i++) {
      let p = pts[i], q = pts[(i + 1) % n]; if (a < 0) [p, q] = [q, p];
      if (tapa) v.push(cx, y1, cz, q[0], y1, q[1], p[0], y1, p[1]);
      else v.push(p[0], y0, p[1], p[0], y1, p[1], q[0], y1, q[1], p[0], y0, p[1], q[0], y1, q[1], q[0], y0, q[1]);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals(); return g;
  };
  /** un palo inclinado (una pluma de carga, un botalón): de (x, y, z), largo `l`, volcado `a` radianes hacia ±x o ±z */
  const pluma = (T, x, y, z, l, a, eje = 'x', g = 0.22) => { const b = new THREE.BoxGeometry(g, l, g).translate(0, l / 2, 0); if (eje === 'x') b.rotateZ(-a); else b.rotateX(a); T.put(b.translate(x, y, z), TINTA); };
  /** un techo a cuatro aguas pintado (las tejas coloradas, la chapa) */
  const cuatro = (T, w, d, h, x, y, z, o) => {
    const r = Math.max(0, (w - d) / 2), s = Math.max(0, (d - w) / 2), A = [-w / 2, 0, -d / 2], B = [w / 2, 0, -d / 2], C = [w / 2, 0, d / 2], D = [-w / 2, 0, d / 2], R1 = [-r, h, -s], R2 = [r, h, s];
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([D, C, R2, D, R2, R1, B, A, R1, B, R1, R2, A, D, R1, C, B, R2].flat(), 3)); g.computeVertexNormals();
    T.put(g.translate(x, y, z), PINTADO, o);
  };
  /** un galpón: el cuerpo pintado y el techo a dos aguas con la cumbrera a lo largo */
  const galpon = (T, w, h, d, x, z, o = CHAPA, a = 'x') => { T.caja(w, h, d, x, 0, z, PINTADO, o); T.tejado(w + 0.8, d + 0.8, Math.min(w, d) * 0.2, x, h, z, a); };

  // -------------------------------------------------------------------------------------------------- los barcos
  // Cuatro modelos y sus variantes: el vapor de carga (casco negro, la obra viva roja, el puente blanco en el medio, una
  // chimenea y dos palos con sus plumas: los de la foto de Olds), el paquete de pasajeros (más largo, el casillaje
  // corrido y dos chimeneas), el velero de tres palos con las velas aferradas a las vergas, y lo chico: remolcadores,
  // chatas, balleneras. Cada uno, anclado en el punto del agua donde flota.
  const barco = (px, py, ux, uy, o = {}) => {
    const n = Math.hypot(ux, uy), T = c.lugar(px, py, ux / n, uy / n);
    const { tipo = 'carga', L = 92, B = L * 0.135, alto = L * 0.045 + 1.6, casco = NEGRO, chimenea = NEGRO, ruedas = false } = o, pl = planta(L, B);
    const viva = Math.min(0.9, alto * 0.25);
    T.put(traca(pl, 0, viva), PINTADO, tipo === 'bote' ? casco : ROJO); T.put(traca(pl, viva, alto), PINTADO, casco); T.put(traca(pl, 0, alto, true), PINTADO, P(PINTA.MADERA, 0.86));
    const palo = (x, h, r = 0.26) => T.cilindro(r, h, x, alto, 0, TINTA, 4, r * 0.4);
    if (tipo === 'carga' || tipo === 'pasaje') {
      // el castillo de proa y la toldilla
      T.prisma([[L * 0.3, -B * 0.44], [L * 0.4, -B * 0.33], [L / 2, 0], [L * 0.4, B * 0.33], [L * 0.3, B * 0.44]], 1.5, alto, PINTADO, casco);
      T.prisma([[-L / 2, -B * 0.28], [-L * 0.46, -B * 0.45], [-L * 0.37, -B / 2], [-L * 0.37, B / 2], [-L * 0.46, B * 0.45], [-L / 2, B * 0.28]], 1.3, alto, PINTADO, casco);
      const pasaje = tipo === 'pasaje', lc = L * (pasaje ? 0.52 : 0.2), xc = pasaje ? -L * 0.02 : -L * 0.03;
      T.caja(lc, 2.5, B * 0.84, xc, alto, 0, PINTADO, BLANCO); T.caja(lc * (pasaje ? 0.86 : 0.5), 2.3, B * 0.64, xc + (pasaje ? 0 : lc * 0.2), alto + 2.5, 0, PINTADO, BLANCO);
      for (const k of pasaje ? [-0.09, 0.07] : [-0.06]) { const r = B * (pasaje ? 0.13 : 0.11), h = pasaje ? 9.5 : 7.5; T.cilindro(r, h, L * k, alto + (pasaje ? 4.8 : 2.5), 0, PINTADO, 7, r, chimenea); if (chimenea !== NEGRO) T.cilindro(r * 1.04, 1.4, L * k, alto + (pasaje ? 4.8 : 2.5) + h, 0, PINTADO, 7, r * 1.04, NEGRO); }
      for (const s of [-1, 1]) {
        const xm = s * L * (pasaje ? 0.36 : 0.26); palo(xm, L * 0.24 + 4);
        if (!pasaje) { pluma(T, xm, alto + 1.2, 0, L * 0.13, 0.95); pluma(T, xm, alto + 1.2, 0, L * 0.13, -0.95); T.caja(L * 0.1, 0.8, B * 0.46, xm - s * L * 0.1, alto, 0, PINTADO, LONA); }
      }
    } else if (tipo === 'velero' || tipo === 'ruedas') {
      // la fragata o la barca: tres palos con las vergas cruzadas y la lona aferrada, y el botalón
      const velero = tipo === 'velero';
      pluma(T, L * 0.46, alto + 0.3, 0, L * 0.24, 1.25, 'x', 0.3);
      if (velero) T.put(traca(pl, alto * 0.62, alto * 0.78).scale(1.012, 1, 1.03), PINTADO, BLANCO); // (la faja blanca)
      [[0.27, 0.5], [-0.02, 0.56], [-0.3, 0.42]].forEach(([k, hk], i) => {
        if (!velero && i === 1) return;
        const h = L * hk * (velero ? 1 : 0.7); palo(L * k, h, 0.4);
        for (let v = 0; v < (velero ? (i < 2 ? 3 : 1) : 1); v++) T.caja(0.45, 0.45, B * (1.75 - v * 0.42), L * k, alto + h * (0.3 + v * 0.26), 0, PINTADO, LONA);
        if (velero && i === 2) pluma(T, L * k, alto + h * 0.5, 0, L * 0.16, 2.0, 'x', 0.26); // (la botavara de la cangreja)
      });
      T.caja(L * 0.12, 1.9, B * 0.5, -L * 0.3, alto, 0, PINTADO, BLANCO);
      if (ruedas) { // el vapor de la carrera de 1867: los tambores de las ruedas a los costados y una chimenea flaca
        for (const s of [-1, 1]) { T.put(new THREE.CylinderGeometry(3.3, 3.3, 2, 9, 1, false, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2).translate(-L * 0.02, alto - 1.1, s * (B / 2 + 1)), PINTADO, BLANCO); }
        T.cilindro(0.8, 9, -L * 0.02, alto, 0, PINTADO, 6, 0.8, NEGRO); T.caja(L * 0.22, 2, B * 0.6, L * 0.02, alto, 0, PINTADO, BLANCO);
      }
    } else if (tipo === 'remolcador') {
      T.caja(L * 0.36, 2.2, B * 0.62, L * 0.04, alto, 0, PINTADO, BLANCO); T.cilindro(0.7, 5, -L * 0.06, alto + 1.6, 0, PINTADO, 6, 0.7, chimenea); palo(L * 0.26, 8, 0.16);
    } else if (tipo === 'chata') {
      T.caja(L * 0.66, 1.3, B * 0.7, 0, alto, 0, PINTADO, LONA);
    } else if (tipo === 'bote') {
      // la ballenera: un bote de dos proas con su vela al tercio
      if (o.vela !== false) {
        T.caja(0.14, 5.4, 0.14, L * 0.12, alto * 0.5, 0, TINTA);
        const a = [-L * 0.3, alto + 0.6, 0.06], b = [L * 0.2, alto + 0.6, 0.06], d = [L * 0.14, alto + 5.2, 0.06], e = [-L * 0.22, alto + 4.2, 0.06], g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute([a, b, d, a, d, e, a, d, b, a, e, d].flat(), 3)); g.computeVertexNormals(); T.put(g, PINTADO, LONA);
      } else for (const k of [-0.2, 0.15]) T.caja(0.5, 0.9, 0.5, L * k, alto * 0.6, 0, PINTADO, k < 0 ? NEGRO : ROJO); // (los remeros)
    }
    return T;
  };
  const SURTIDO = [{ L: 92 }, { L: 104, chimenea: ROJO }, { L: 78, chimenea: OCRE }, { L: 98, chimenea: P(PINTA.BLANCO, 0.9) }, { L: 86 }, { L: 110, chimenea: OCRE }];

  // ------------------------------------------------------------------------------------- 1867: la rada y la playa
  c.epoca(0, 2);
  { // los barcos de ultramar, fondeados río adentro (más allá de donde después se ganó la tierra), todos aproados al
    // mismo viento; más cerca, las goletas y los pailebotes del cabotaje y los vapores de la carrera de Montevideo
    const rumbo = (k) => [-0.42 + k * 0.1, -0.9];
    [[9050, 11950, 60], [9700, 11800, 52], [10250, 12050, 64], [10700, 11720, 56], [11150, 11980, 60], [11650, 11660, 50], [12050, 11900, 58], [9350, 11460, 44], [10050, 11330, 40], [11300, 11300, 46], [12300, 11420, 48], [8600, 11600, 50],
      [9900, 11080, 34], [10750, 11150, 36], [11000, 11420, 42], [11800, 11180, 34], [9200, 11150, 38], [10450, 11560, 48]]
      .forEach(([x, y, L], i) => barco(x, y, ...rumbo(al() - 0.5), { tipo: 'velero', L, B: L * 0.17, alto: L * 0.06 + 1, casco: i % 4 === 2 ? P(PINTA.VERDE, 0.2) : NEGRO }));
    [[10480, 10990, 62], [11500, 10960, 56], [9500, 10900, 50]].forEach(([x, y, L]) => barco(x, y, ...rumbo(al() - 0.5), { tipo: 'ruedas', L, B: L * 0.13, alto: 3.4, ruedas: true }));
    // las balleneras, yendo y viniendo de la punta del muelle de pasajeros ([10940, 9962], 388 m río adentro) y del de la Aduana
    [[10900, 10580, 1, 0.3], [10985, 10620, -0.6, 1], [11040, 10520, 0.2, 1], [10850, 10700, 1, 1], [10960, 10760, -1, 0.4], [11100, 10680, 0.5, -1], [10760, 10560, 1, -0.2], [10990, 10880, 0.3, 1], [10380, 10830, 1, 0.5], [10300, 10760, -1, 0.6], [10560, 10700, 0.8, 1], [11250, 10500, -0.7, 1]]
      .forEach(([x, y, ux, uy], i) => barco(x, y, ux, uy, { tipo: 'bote', L: 9.5, B: 2.7, alto: 1, casco: i % 3 ? P(PINTA.MADERA, 0.6) : BLANCO, vela: i % 4 !== 3 }));
    // los carros de desembarco: con el río bajo, las balleneras no llegaban a la orilla y se trasbordaba a estos carros
    // de ruedas altísimas, tirados por dos caballos con el agua al pecho
    [[10560, 10075, 0.1, 1], [10610, 10120, -0.2, 1], [10700, 10060, 0.2, -1], [10760, 10140, 0, 1], [10820, 10080, 0.3, 1], [10470, 10110, -0.1, -1], [11040, 10060, 0.1, 1], [11110, 10110, -0.3, 1], [11190, 10050, 0.2, -1], [10650, 10200, 0, 1]].forEach(([x, y, ux, uy], i) => {
      const n = Math.hypot(ux, uy), T = c.lugar(x, y, ux / n, uy / n);
      T.caja(3.3, 0.9, 1.7, 0, 1.5, 0, PINTADO, MADERA); T.caja(3.5, 0.12, 1.9, 0, 1.4, 0, TINTA);
      for (const s of [-1, 1]) { T.put(new THREE.CylinderGeometry(1.45, 1.45, 0.14, 9).rotateX(Math.PI / 2).translate(-0.3, 1.45, s * 1.05), PINTADO, P(PINTA.MADERA, 0.3)); T.caja(2.1, 1.05, 0.6, 3.5, 0.6, s * 0.5, PINTADO, s * (i % 2 ? 1 : -1) > 0 ? NEGRO : P(PINTA.MADERA, 0.4)); T.caja(0.5, 0.8, 0.4, 4.6, 1.4, s * 0.5, PINTADO, s * (i % 2 ? 1 : -1) > 0 ? NEGRO : P(PINTA.MADERA, 0.4)); }
      [[-0.9, BLANCO], [0, NEGRO], [0.9, i % 2 ? ROJO : P(PINTA.OCRE, 0.6)]].forEach(([k, o]) => T.caja(0.5, 1, 0.5, k, 2.4, k * 0.3, PINTADO, o));
    });
  }

  // ------------------------------------------------------------------------------------- los diques (desde 1895)
  // [SO, NO, NE, SE] de cada espejo de agua. El lado oeste da a la ciudad; el este, a la tierra ganada y al río.
  const DIQUES = [
    { n: 1, desde: 2, q: [[7788, 10459], [8622, 10442], [8624, 10674], [7813, 10693]] },
    { n: 2, desde: 2, q: [[8752, 10439], [9593, 10418], [9594, 10652], [8753, 10672]] },
    { n: 3, desde: 2, q: [[9718, 10415], [10727, 10396], [10730, 10631], [9720, 10649]] },
    { n: 4, desde: 3, q: [[10843, 10395], [11755, 10385], [11758, 10617], [10846, 10629]] }, // (habilitado en 1897)
  ];
  /** una grúa hidráulica de pórtico, de las que corrían por el borde del muelle; la pluma, hacia `lado` (±z) */
  const grua = (T, x, z, lado) => {
    for (const s of [-1, 1]) T.caja(0.34, 5.6, 3.8, x + s * 2, 0, z, TINTA);
    T.caja(4.6, 0.35, 4.2, x, 5.6, z, TINTA); T.caja(3, 2.7, 3, x, 5.95, z, PINTADO, CHAPA);
    pluma(T, x, 7.6, z + lado * 1.3, 13, lado * 0.72, 'z', 0.3);
  };
  /** la grúa de un dock: el castillete de hierro arrimado a la fachada, que pasa la cornisa, con la casilla en voladizo */
  const gruaDock = (T, x, zf, h) => {
    for (const s of [-1, 1]) T.caja(0.3, h + 1.2, 0.3, x + s * 1.5, 0, zf + 0.5, TINTA);
    { const l = Math.hypot(h * 0.45, 3.6); T.put(new THREE.BoxGeometry(3.2, l, 0.24).translate(0, l / 2, 0).rotateX(Math.atan2(3.6, h * 0.45)).translate(x, h * 0.75, zf + 0.5), TINTA); } // (los tornapuntas)
    T.caja(3.8, 0.3, 4.6, x, h + 1.2, zf + 2.2, TINTA); T.caja(3.2, 2.6, 3.4, x, h + 1.5, zf + 2.4, PINTADO, P(PINTA.LONA, 0.85));
    pluma(T, x, h + 2.4, zf + 4, 8, 1.05, 'z', 0.26);
  };
  /** el coronamiento de piedra de un murallón, de (x0, z0) a (x1, z1), con sus bolardos */
  const murallon = (T, x0, z0, x1, z1) => {
    const l = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(z1 - z0, x1 - x0);
    T.put(new THREE.BoxGeometry(l + 1.8, 0.55, 1.8).rotateY(-a).translate((x0 + x1) / 2, 0.275, (z0 + z1) / 2), PIEDRA, { tono: c.SILLAR });
    for (let i = 0, n = Math.round(l / 70); i < n; i++) { const t = (i + 0.5) / n; T.caja(0.5, 0.6, 0.5, x0 + (x1 - x0) * t, 0.55, z0 + (z1 - z0) * t, TINTA); }
  };
  for (const D of DIQUES) {
    const [so, no, ne, se] = D.q, cx = (so[0] + no[0] + ne[0] + se[0]) / 4, cy = (so[1] + no[1] + ne[1] + se[1]) / 4;
    const lx = Math.hypot(no[0] - so[0], no[1] - so[1]), ux = (no[0] - so[0]) / lx, uy = (no[1] - so[1]) / lx, L = lx * M, W = Math.hypot(se[0] - so[0], se[1] - so[1]) * M;
    const T = c.lugar(cx, cy, ux, uy), w = W / 2, l = L / 2; // (x a lo largo del dique, hacia el norte; z hacia el río)
    c.epoca(2);
    // los murallones: de granito, con el coronamiento a ras del muelle. En las cabeceras queda el paso al dique vecino.
    murallon(T, -l, -w, l, -w); murallon(T, -l, w, l, w);
    for (const s of [-1, 1]) { if (D.n === 1 && s < 0) murallon(T, -l, -w, -l, w - 22); else { murallon(T, s * l, -w, s * l, -11); murallon(T, s * l, 11, s * l, w); } }
    // --- el lado de la ciudad ---
    // Cuántos y cómo: los planos de 1895 y de 1921 dibujan cuatro en los diques 1, 2 y 4 y cinco, más cortos, en el 3;
    // y en el 1 y el 2, los de las puntas son más cortos y más hondos que los del medio (así es todavía el del sur del
    // Dique 2, en el mapa de hoy). Que esos lleven un piso más es supuesto.
    const nd = D.n === 3 ? 5 : 4, paso = L / nd, zf = -w - 24;
    c.epoca(D.desde, 0);
    for (let i = 0; i < 4; i++) grua(T, -l + (i + 0.5) * (L / 4) + (al() - 0.5) * 30, -w - 5.5, 1);
    for (let i = 0; i < nd; i++) {
      const x = -l + (i + 0.5) * paso, punta = D.n < 3 && (i === 0 || i === nd - 1), largo = (paso - 16) * (punta ? 0.64 : 1), fondo = punta ? 33 : 25, zc = zf - fondo / 2;
      // 1895: los galpones de chapa del primer puerto (el plano de 1895 los dibuja: bajos, uno por sección)
      c.epoca(2, 3); galpon(T, (paso - 16) * (i % 3 ? 0.9 : 0.5), 5.2, 17, x, zf - 9.5, i % 2 ? CHAPA : MADERA);
      // 1905: el dock. Cuatro pisos de ladrillo sobre un sótano, la planta baja de arcos (blanqueada, como en las fotos),
      // las bocas de carga una arriba de la otra debajo de cada grúa y un techo bajo detrás del pretil.
      c.epoca(3); const h = punta ? 21.4 : 17.5, pisos = punta ? 4 : 3;
      T.caja(largo, h, fondo, x, 0, zc, PINTADO, LADRILLO); T.caja(largo + 0.7, 0.55, fondo + 0.7, x, h, zc, PIEDRA, { tono: c.CREMA }); T.cuatroAguas(largo - 1, fondo - 1, 3.2, x, h + 0.55, zc);
      const na = Math.round(largo / 6.4);
      for (const s of [-1, 1]) {
        T.caja(largo + 0.3, 4.5, 0.3, x, 0, zc + s * (fondo / 2 + 0.05), PIEDRA, { tono: c.BLANCO }); T.fila(na, x - largo / 2 + 0.6, x + largo / 2 - 0.6, 3.3, 3.9, 0, zc + s * (fondo / 2 + 0.24), s < 0 ? '-z' : '+z');
        for (let p = 0; p < pisos; p++) { T.fila(na, x - largo / 2 + 0.6, x + largo / 2 - 0.6, 1.3, 2.3, 5.9 + p * 3.9, zc + s * (fondo / 2 + 0.06), s < 0 ? '-z' : '+z', false); T.fila(3, zc - fondo / 2 + 2, zc + fondo / 2 - 2, 1.3, 2.3, 5.9 + p * 3.9, x + s * (largo / 2 + 0.06), s < 0 ? '-x' : '+x', false); }
      }
      for (let k = 0; k < 3; k++) { const xg = x + (k - 1) * largo * 0.31; T.vano(2.6, h - 6.4, xg, 5, zf + 0.06, '+z', false); gruaDock(T, xg, zf, h); }
    }
    // --- el lado del río ---
    c.epoca(Math.max(3, D.desde));
    for (let i = 0; i < 2; i++) grua(T, -l + (i + 0.5) * (L / 2) + (al() - 0.5) * 60, w + 5.5, -1);
    if (D.n === 3) {
      // los elevadores de granos (foto de Olds): una hilera de torres de chapa, cada una con su cabezal a dos aguas allá
      // arriba, sobre los galpones bajos del muelle; del cabezal bajaban los caños que cargaban las bodegas.
      for (let i = 0; i < 9; i++) {
        const paso = 50, x = (i - 4) * paso, z = w + 36, ht = 23 + ((i * 2) % 5) * 1.6;
        galpon(T, paso - 4, 7.5, 21, x, w + 21, CHAPA); T.caja(13, ht, 14, x, 0, z, PINTADO, CHAPA); T.tejado(13.6, 14.6, 3.4, x, ht, z, 'z');
        T.caja(5.4, 9.5, 7, x, ht + 1.2, z + 0.5, PINTADO, CHAPA); T.tejado(5.9, 7.6, 2.4, x, ht + 10.7, z + 0.5, 'z'); pluma(T, x, ht - 1.5, z - 7, 31, -2.02, 'z', 0.45);
      }
    } else if (D.n === 2) {
      // el molino (Molinos Río de la Plata, de Bunge y Born, desde 1902): el cuerpo de ladrillo de seis pisos, los silos
      // redondos en dos hileras con su galería arriba, la chimenea y los galpones
      const x = 20, z = w + 44;
      T.caja(64, 26, 24, x, 0, z, CASA, { floors: 6, tono: c.LADRILLO }); T.caja(64.8, 0.6, 24.8, x, 26, z, PIEDRA, { tono: c.LADRILLO }); T.tejado(64, 24, 4, x, 26.6, z, 'x');
      T.caja(11, 34, 11, x - 20, 0, z - 4, CASA, { floors: 8, tono: c.LADRILLO }); T.piramide(8, 5, x - 20, 34, z - 4);
      for (let i = 0; i < 6; i++) for (const s of [0, 1]) T.cilindro(5.6, 24, x + 44 + i * 11.4, 0, z - 6 + s * 11.6, PIEDRA, 10, 5.6, { tono: c.CREMA });
      T.caja(68, 3.4, 9, x + 72.5, 24, z - 0.2, PINTADO, CHAPA); T.tejado(68.6, 9.6, 1.8, x + 72.5, 27.4, z - 0.2, 'x');
      T.cilindro(1.9, 38, x - 40, 0, z + 6, PIEDRA, 10, 1.1, { tono: c.LADRILLO });
      galpon(T, 120, 7, 20, x + 30, w + 20, CHAPA); galpon(T, 90, 7, 20, -l + 80, w + 22, CHAPA); galpon(T, 70, 7, 20, l - 60, w + 22, MADERA);
    } else {
      // los galpones largos del muelle del este (los que el plano de 1905 dibuja como una raya a lo largo del dique)
      for (let i = 0; i < 3; i++) galpon(T, L / 3 - 26, 7, 20, -l + (i + 0.5) * (L / 3), w + 22, i === 1 ? MADERA : CHAPA);
    }
    // --- los barcos amarrados: de punta a punta por los dos muelles, alguno acoderado, las chatas y un remolcador ---
    c.epoca(D.desde);
    const amarra = (x, lado, o) => { const [px, py] = T.aPlano(x, lado * (w - 3.2 - (o.B ?? o.L * 0.135) / 2)); const s = al() < 0.5 ? 1 : -1; barco(px, py, s * ux, s * uy, o); };
    const nb = Math.round(L / 150);
    for (let i = 0; i < nb; i++) {
      const x = -l + (i + 0.5) * (L / nb), a = SURTIDO[(D.n * 2 + i) % 6], b = SURTIDO[(D.n * 3 + i + 2) % 6];
      if ((i + D.n) % 4 === 1 && D.desde === 2) amarra(x, -1, { tipo: 'velero', L: 58, B: 10, alto: 4.6 }); else amarra(x + (al() - 0.5) * 20, -1, a);
      if ((i + D.n) % 3) amarra(x + (al() - 0.5) * 30, 1, b);
      else { amarra(x - 22, 1, { tipo: 'chata', L: 30, B: 7.5, alto: 1.9 }); amarra(x + 16, 1, { tipo: 'chata', L: 26, B: 7, alto: 1.9, casco: P(PINTA.ROJO, 0.3) }); }
    }
    { const [px, py] = T.aPlano(l * 0.3 * (D.n % 2 ? 1 : -1), (al() - 0.5) * 30); barco(px, py, ux, uy + 0.25, { tipo: 'remolcador', L: 24, B: 6, alto: 2.3, chimenea: D.n % 2 ? OCRE : ROJO }); }
  }

  // ------------------------------------------------------------------------------------- los puentes giratorios
  // Cuatro, en los pasos entre dique y dique (20 m de agua): una viga de hierro que gira sobre un pilar redondo, a un
  // lado del paso, para dejar pasar los barcos. Por ellos se cruzaba a los muelles del este.
  [[8687, 10557, 2, 88], [9655, 10534, 2, 84], [10787, 10513, 3, 78], [11835, 10498, 3, 106]].forEach(([px, py, desde, ancho]) => {
    c.epoca(desde);
    const T = c.lugar(px, py, 0.02, 1), a = ancho / 2 + 1; // (x hacia el río, a lo largo del puente; z, a lo largo del paso)
    murallon(T, -11, -a, -11, a); murallon(T, 11, -a, 11, a);
    // (el suelo pinta cada dique con su envolvente y el paso le queda hecho un embudo: van acá las dos lenguas de
    // muelle que separan un dique del otro, empedradas)
    for (const s of [-1, 1]) T.tapete([[s * 11, -a + 1], [s * 80, -a + 1], [s * 80, a - 1], [s * 11, a - 1]], PINTA.ADOQUIN, { y: 0.1, claro: 0.9 });
    T.cilindro(5.2, 0.9, -15.5, 0, 0, PIEDRA, 14, 5.2, { tono: c.SILLAR });
    T.caja(46, 0.5, 7.6, -6, 0.9, 0, PINTADO, P(PINTA.MADERA, 0.7));
    for (const s of [-1, 1]) { T.caja(46, 1.3, 0.3, -6, 1.4, s * 3.9, TINTA); T.caja(18, 1.5, 0.3, -15.5, 2.7, s * 3.9, TINTA); T.caja(7, 1.1, 0.3, -15.5, 4.2, s * 3.9, TINTA); }
    T.caja(0.3, 0.3, 8, -15.5, 5, 0, TINTA);
  });

  // ------------------------------------------------------------------------------------------ la Dársena Sur (1889)
  { // un canal de 117 m de ancho, en diagonal, del Dique 1 a la boca del Riachuelo: el puerto de los vapores de la
    // carrera, de los veleros del cabotaje y de las chatas. (x a lo largo, hacia la boca; z hacia la Boca.)
    const T = c.lugar(7550, 10969, -0.681, 0.732), w = 58.5, sal = (x, z) => T.aPlano(x, z);
    c.epoca(2);
    murallon(T, 30, w, 760, w); murallon(T, 60, -w, 780, -w); murallon(T, 60, -w - 58, 780, -w - 58);
    // (el suelo todavía no trae la tierra de los costados de la dársena: del lado de la Boca la costa de 1867 queda más
    // atrás, y la tierra ganada del este recién arranca en el Dique 1. Van acá los dos muelles, empedrados.)
    T.tapete([[30, w], [760, w], [760, w + 44], [30, w + 44]], PINTA.ADOQUIN, { y: 0.1, claro: 0.9 });
    T.tapete([[60, -w - 58], [780, -w - 58], [780, -w], [60, -w]], PINTA.ADOQUIN, { y: 0.1, claro: 0.9 });
    for (let i = 0; i < 4; i++) grua(T, 150 + i * 150, w + 5.5, -1);
    for (let i = 0; i < 4; i++) galpon(T, 110, 6, 18, 130 + i * 160, w + 24, i % 2 ? MADERA : CHAPA);
    [[120, 1, { tipo: 'pasaje', L: 84, B: 11.5, alto: 4.6, chimenea: OCRE }], [250, 1, { tipo: 'velero', L: 50, B: 9, alto: 4.2 }], [370, 1, SURTIDO[2]], [520, 1, { tipo: 'velero', L: 46, B: 8.5, alto: 4, casco: P(PINTA.VERDE, 0.2) }], [660, 1, SURTIDO[4]],
      [200, -1, { tipo: 'chata', L: 30, B: 7.5, alto: 1.9 }], [245, -1, { tipo: 'chata', L: 28, B: 7, alto: 1.9, casco: P(PINTA.ROJO, 0.3) }], [430, -1, SURTIDO[0]], [610, -1, { tipo: 'velero', L: 54, B: 9.5, alto: 4.4 }]]
      .forEach(([x, lado, o]) => { const [px, py] = sal(x, lado * (w - 3.2 - (o.B ?? o.L * 0.135) / 2)); const s = al() < 0.5 ? 1 : -1; barco(px, py, -0.681 * s, 0.732 * s, o); });
    { const [px, py] = sal(330, 6); barco(px, py, -0.6, 0.8, { tipo: 'remolcador', L: 22, B: 5.6, alto: 2.2, chimenea: ROJO }); }
    c.epoca(3);
    for (let i = 0; i < 4; i++) galpon(T, 120, 6, 18, 160 + i * 150, -w - 24, i % 2 ? CHAPA : MADERA);
    for (let i = 0; i < 3; i++) grua(T, 230 + i * 170, -w - 5.5, 1);
  }

  // ---------------------------------------------------------------------------------------- la Dársena Norte (1897)
  { // la entrada del norte: acá atracaban los transatlánticos (enfrente, del lado del Retiro, se hizo en 1911 el Hotel
    // de Inmigrantes). El muelle del oeste y el del sur, con dos paquetes y un carguero.
    c.epoca(3);
    const T = c.lugar(12040, 10287, 0.978, -0.207); // (x a lo largo del muelle del oeste, hacia el norte; z hacia el agua)
    murallon(T, 0, 0, 380, 0);
    const S = c.lugar(12042, 10300, 0, 1); // (x a lo largo del muelle del sur, hacia el río; el agua queda en −z)
    murallon(S, 0, 0, 120, 0); murallon(S, 160, 0, 360, 0);
    for (let i = 0; i < 3; i++) { grua(T, 70 + i * 120, -5.5, 1); grua(S, 190 + i * 70, 5.5, -1); }
    galpon(T, 150, 7, 20, 110, -24, CHAPA); galpon(T, 130, 7, 20, 270, -24, MADERA);
    { const [px, py] = T.aPlano(110, 13); barco(px, py, 0.978, -0.207, { tipo: 'pasaje', L: 138, B: 16.5, alto: 7.6, chimenea: OCRE }); }
    { const [px, py] = T.aPlano(290, 12); barco(px, py, -0.978, 0.207, { tipo: 'pasaje', L: 118, B: 14.5, alto: 7, chimenea: ROJO }); }
    { const [px, py] = S.aPlano(260, -11); barco(px, py, 0, -1, SURTIDO[5]); }
    { const [px, py] = S.aPlano(200, -150); barco(px, py, 0.5, 1, { tipo: 'remolcador', L: 24, B: 6, alto: 2.3, chimenea: OCRE }); }
    // el Yacht Club Argentino (Le Monnier, 1915), en la escollera de la boca: el pabellón con sus terrazas y la torre del faro
    c.epoca(5);
    const Y = c.lugar(12215, 10858, 0.98, -0.2);
    Y.caja(26, 7.5, 13, 0, 0, 0, CASA, { floors: 2, tono: c.CREMA }); Y.caja(27, 0.5, 14, 0, 7.5, 0, PIEDRA, { tono: c.CREMA }); Y.caja(12, 3.6, 9, -4, 8, 0, CASA, { floors: 1, tono: c.CREMA });
    Y.cilindro(3.1, 22, 12, 0, 2, PIEDRA, 10, 2.5, { tono: c.CREMA }); Y.cilindro(3.4, 0.5, 12, 22, 2, PIEDRA, 10, 3.4, { tono: c.CREMA }); Y.cilindro(1.5, 3.4, 12, 22.5, 2, TINTA, 8); Y.cupula(1.8, 12, 25.9, 2, 1.1);
    Y.caja(36, 0.8, 20, 0, 0, 0, PIEDRA, { tono: c.SILLAR });
  }

  // ------------------------------------------------------------------------------------ la Costanera Sur (1918)
  // El origen, en el murallón, frente al arranque de la avenida (hoy, Tristán Achával Rodríguez); x corre a lo largo
  // de la costa hacia el norte y z hacia el río. De Brasil (x ≈ −70) a Belgrano (x ≈ 545), el Balneario Municipal de
  // 1918; de ahí hasta Córdoba (x ≈ 2080), la ampliación de 1924.
  {
    const T = c.lugar(8860, 11538, 0.9811, -0.1934), ZM = 3; // (el murallón, tres metros adentro del río: tapa la orilla)
    /** la balaustrada: el zócalo, el pasamanos y un pilar cada doce metros */
    const baranda = (x0, x1, z, y = 0.9, eje = 'x') => {
      const l = x1 - x0, m = (x0 + x1) / 2, caja = (w, h, d, a, yy, b) => (eje === 'x' ? T.caja(w, h, d, a, yy, b) : T.caja(d, h, w, b, yy, a));
      caja(l, 0.25, 0.4, m, y, z); caja(l, 0.16, 0.5, m, y + 0.8, z);
      for (let i = 0, n = Math.max(1, Math.round(l / 12)); i <= n; i++) caja(0.6, 1.15, 0.6, x0 + (l * i) / n, y, z);
    };
    /** un farol de los de la rambla: la columna y el globo */
    const farol = (x, z, y = 0.9) => { T.caja(0.16, 4.4, 0.16, x, y, z, TINTA); T.caja(0.5, 0.6, 0.5, x, y + 4.4, z, PIEDRA, { tono: c.BLANCO }); };
    /** un tramo de rambla de x0 a x1: el murallón con la vereda alta, la balaustrada (cortada en las escalinatas), las
     *  escalinatas que bajan al río, la calzada y las dos hileras de árboles */
    const tramo = (x0, x1, bajadas, cortes = []) => {
      const l = x1 - x0, m = (x0 + x1) / 2;
      T.caja(l, 0.9, 12, m, 0, ZM - 6, PIEDRA, { tono: c.SILLAR }); T.caja(l, 0.45, 1.3, m, 0, ZM - 12.6, PIEDRA, { tono: c.SILLAR });
      T.tapete(T.recto(l, 14, m, ZM - 20.5), PINTA.ADOQUIN, { y: 0.1, claro: 0.9 });
      const huecos = [...bajadas.map((x) => [x - 12, x + 12]), ...cortes].sort((a, b) => a[0] - b[0]); let x = x0;
      for (const [a, b] of [...huecos, [x1, x1]]) { if (a - x > 2) baranda(x, a, ZM - 0.4); x = Math.max(x, b); }
      for (const xb of bajadas) { for (let i = 0; i < 4; i++) T.caja(24, 0.72 - i * 0.2, 1.3, xb, 0, ZM + 0.65 + i * 1.3, PIEDRA, { tono: c.SILLAR }); for (const s of [-1, 1]) T.caja(0.7, 1.5, 6, xb + s * 12.3, 0, ZM + 2.4, PIEDRA, { tono: c.SILLAR }); }
      for (let xa = x0 + 8, k = 0; xa < x1 - 4; xa += 13, k++) { T.arbol(xa, ZM - 10, 3.6); T.arbol(xa + 6.5, ZM - 31, 4); if (k % 4 === 1) farol(xa + 6.5, ZM - 2.2); }
    };
    /** un cantero de césped con sus árboles en las puntas */
    const jardin = (w, d, x, z, cordon = true) => { if (cordon) T.cantero(T.recto(w, d, x, z)); else T.tapete(T.recto(w, d, x, z), PINTA.CESPED, { y: 0.12, claro: 0.74 }); for (const s of [-1, 1]) for (const t of [-1, 1]) if (w > 30 && d > 22) T.arbol(x + s * (w / 2 - 7), z + t * (d / 2 - 7), 3.4); };

    c.epoca(5);
    tramo(-40, 545, [185, 300, 415, 520], [[48, 72]]);
    T.caja(62, 0.9, 6, -70, 0, ZM - 3, PIEDRA, { tono: c.SILLAR }); baranda(-101, -40, ZM - 0.4); // (el murallón sigue hasta Brasil, detrás de la fuente)
    { // el espigón (1919): una lengua ancha y arbolada que entra al río, con la punta redonda y las barandas (en la
      // foto aérea del Balneario de 1935, del archivo de la Municipalidad, se lo ve tapado de árboles)
      const x = 60, l = 122, z0 = ZM;
      T.caja(24, 0.9, l, x, 0, z0 + l / 2, PIEDRA, { tono: c.SILLAR }); T.cilindro(17, 0.9, x, 0, z0 + l + 8, PIEDRA, 18, 17, { tono: c.SILLAR });
      for (const s of [-1, 1]) { baranda(z0 + 1, z0 + l - 6, x + s * 11.7, 0.9, 'z'); for (let i = 1; i < 5; i++) { farol(x + s * 10.6, z0 + i * 26 - 13); T.arbol(x + s * 6.5, z0 + i * 26, 3.4); T.arbol(x + s * 6.5, z0 + i * 26 - 13, 3.2); } }
      for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2 + 0.22; if (Math.abs(Math.sin(a)) > 0.62 || Math.cos(a) > 0) T.caja(0.6, 1.15, 0.6, x + Math.sin(a) * 16.5, 0.9, z0 + l + 8 + Math.cos(a) * 16.5); }
      T.cilindro(0.2, 9, x, 0.9, z0 + l + 8, TINTA, 5, 0.1);
    }
    { // la Fuente de las Nereidas (Lola Mora, 1903): en la rotonda del arranque. La pileta redonda, las rocas, los tres
      // caballos que salen del agua con sus tritones, la valva que sostienen las dos nereidas y, arriba, Venus. De mármol.
      const [fx, fz] = [-68, -31], MAR = { tono: c.BLANCO };
      T.tapete(T.ovalo(fx, fz, 27, 27, 14), PINTA.ADOQUIN, { y: 0.1, claro: 0.9 }); T.tapete(T.ovalo(fx, fz, 13, 13, 14), PINTA.CESPED, { y: 0.32, claro: 0.74 }); // (el cantero de césped que la rodea, como en la foto de Wehrli de 1938)
      T.cantero(T.ovalo(fx, fz, 7.2, 7.2, 14), { alto: 0.95, tono: PINTA.AGUA, cordon: 0.55 });
      T.cilindro(3.5, 1.9, fx, 0.6, fz, PIEDRA, 9, 2.3, MAR); T.cilindro(2, 1.5, fx, 2.5, fz, PIEDRA, 8, 1.3, MAR); T.cilindro(1.1, 0.7, fx, 4, fz, PIEDRA, 10, 2.7, MAR);
      T.cilindro(0.36, 1.9, fx, 4.6, fz, PIEDRA, 6, 0.22, MAR); T.cilindro(0.24, 0.42, fx, 6.5, fz, PIEDRA, 6, 0.2, MAR);
      for (const s of [-1, 1]) T.cilindro(0.3, 1.6, fx + s * 1.5, 2.6, fz + 0.5, PIEDRA, 5, 0.2, MAR);
      for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.5, sx = Math.sin(a), cz = Math.cos(a); T.put(new THREE.BoxGeometry(0.75, 1.3, 2.3).rotateX(-0.45).rotateY(a).translate(fx + sx * 3.9, 1.9, fz + cz * 3.9), PIEDRA, MAR); T.cilindro(0.3, 1.7, fx + sx * 2.9 + cz * 0.9, 1.6, fz + cz * 2.9 - sx * 0.9, PIEDRA, 5, 0.2, MAR); }
    }
    // los jardines del balneario: una cuña entre la rambla y la avenida de adentro (hoy, Calabria), más ancha al sur
    for (let i = 0; i < 6; i++) { const x = -5 + i * 98, d = Math.max(16, 96 - i * 15.5); jardin(84, d * 0.5 - 4, x + 44, ZM - 36 - d * 0.25, i < 2); if (d > 44 && i !== 1) jardin(84, d * 0.5 - 4, x + 44, ZM - 36 - d * 0.75, false); }
    { // la pérgola del balneario: dos hileras de columnas blancas con sus vigas, entre los canteros
      const z = ZM - 96, x0 = 102, n = 12;
      T.tapete(T.recto(80, 11, x0 + 33, z), PINTA.GRANZA, { y: 0.1 });
      for (let i = 0; i < n; i++) for (const s of [-1, 1]) T.cilindro(0.32, 3.3, x0 + i * 5.8, 0, z + s * 2, PIEDRA, 5, 0.27, { tono: c.BLANCO });
      for (const s of [-1, 1]) T.caja(n * 5.8, 0.3, 0.4, x0 + (n - 1) * 2.9, 3.3, z + s * 2, PIEDRA, { tono: c.BLANCO });
      for (let i = 0; i < n; i++) T.caja(0.22, 0.26, 5.6, x0 + i * 5.8, 3.6, z, PINTADO, MADERA);
    }

    c.epoca(6);
    // 1924: la rambla sigue hasta Córdoba, con la avenida de adentro (hoy, de los Italianos) y, entre las dos, los
    // canteros «a la francesa» de Forestier; cada tanto, una rotonda con su pérgola en medio círculo mirando al río
    tramo(545, 2080, [660, 880, 1100, 1320, 1540, 1760, 1980]);
    T.tapete(T.recto(1535, 13, 1312.5, ZM - 69), PINTA.ADOQUIN, { y: 0.1, claro: 0.9 });
    for (let xa = 552; xa < 2076; xa += 13) if (Math.abs(xa - 846) > 36) T.arbol(xa, ZM - 79, 3.8);
    for (let i = 0; i < 16; i++) {
      const x = 548 + i * 96;
      if (i % 5 === 2) { // la rotonda y la pérgola
        const xc = x + 46, zc = ZM - 46;
        T.tapete(T.ovalo(xc, zc, 11, 11, 12), PINTA.FLORES, { y: 0.14, claro: 0.7 });
        for (let k = 0; k <= 8; k++) { const a = Math.PI * (k / 8), px = xc - Math.cos(a) * 20, pz = zc - Math.sin(a) * 20; T.cilindro(0.34, 3.3, px, 0, pz, PIEDRA, 5, 0.28, { tono: c.BLANCO }); if (k < 8) { const b = Math.PI * ((k + 0.5) / 8); T.put(new THREE.BoxGeometry(8, 0.3, 0.45).rotateY(-(b - Math.PI / 2)).translate(xc - Math.cos(b) * 20, 3.3, zc - Math.sin(b) * 20), PIEDRA, { tono: c.BLANCO }); } }
        for (const s of [-1, 1]) jardin(22, 24, xc + s * 35, zc, false);
      } else { jardin(88, 12, x + 46, ZM - 38, false); jardin(88, 12, x + 46, ZM - 54, false); }
    }
    { // la Cervecería Munich (Andrés Kálnay, 1927; inaugurada el 21-12-1927): del otro lado de la avenida de adentro,
      // mirando al río. El cuerpo de dos pisos con sus terrazas, la torre del medio y los torreones, todo de tejas.
      const x = 846, z = -97, CR = { tono: c.CREMA }, TEJA = P(PINTA.ROJO, 0.45);
      T.caja(62, 1.1, 14, x, 0, z + 15, PIEDRA, CR); T.pilares(15, x - 30, z + 21.6, x + 30, z + 21.6, 1.1, 0.5, 0.9);
      T.caja(44, 8.6, 18, x, 0, z, CASA, { floors: 2, ...CR }); cuatro(T, 45.4, 19.4, 4.6, x, 8.6, z, TEJA);
      T.caja(30, 4.4, 7, x, 1.1, z + 12, CASA, { floors: 1, ...CR }); T.caja(31, 0.4, 8, x, 5.5, z + 12, PIEDRA, CR); T.fila(7, x - 14, x + 14, 2.6, 3.4, 1.1, z + 15.56, '+z');
      T.caja(8.4, 16, 8.4, x, 0, z + 2, CASA, { floors: 4, ...CR }); T.piramide(6.6, 7, x, 16, z + 2, PINTADO, 4, TEJA); T.cilindro(0.14, 3, x, 23, z + 2, TINTA, 4);
      for (const s of [-1, 1]) { T.caja(9, 11.5, 10, x + s * 21, 0, z + 5, CASA, { floors: 3, ...CR }); T.piramide(7.2, 5, x + s * 21, 11.5, z + 5, PINTADO, 4, TEJA); }
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) T.arbol(x + s * (40 + k * 9), z + 14, 3.6);
    }
  }
  c.epoca(0);
}
