// Los parques de Palermo: el Parque Tres de Febrero con sus lagos, sus avenidas, sus senderos y sus árboles; el
// Rosedal; el Zoológico y el Jardín Botánico; la pista del Hipódromo; la cancha de polo; los galpones de la Rural; la
// Plaza Italia con el Garibaldi, el Sarmiento de Rodin y el Monumento de los Españoles.
//   · 1888 (etapa 1) — el parque (inaugurado el 11 de noviembre de 1875) con la avenida Sarmiento y la avenida Alvear
//     (hoy del Libertador), el Hipódromo (1876) y la Exposición Rural (1878). Están en el plano de Latzina.
//   · 1895 (etapa 2) — el Jardín Zoológico (abierto en 1888 donde está) con sus lagos, el lago grande del parque y la
//     avenida Casares. Están en el plano topográfico de la Municipalidad.
//   · 1905 (etapa 3) — el Jardín Botánico (1898), la Plaza Italia con el Garibaldi (1904), el Sarmiento de Rodin (1900),
//     los otros lagos, Iraola, Infanta Isabel y Dorrego. Están en el plano de Ludwig.
//   · 1910 (etapa 4) — la avenida Centenario (hoy Figueroa Alcorta) y las tribunas nuevas del Hipódromo (1908).
//   · 1921 (etapa 5) — el Rosedal (1914), con sus canteros, su pérgola y sus puentes.
//   · 1940 (etapa 6) — el Monumento de los Españoles (1927), la cancha de polo (1928), el asfalto.
// Qué sale de dónde: los contornos, los lagos, las avenidas y los senderos están en src/palermo.js (los arma
// tools/palermo.mjs con el mapa de hoy —© los colaboradores de OpenStreetMap, ODbL— y lo calcado sobre el plano de
// Peuser). Las fechas, de Wikipedia («Parque Tres de Febrero», «Rosedal de Palermo», «Monumento de los Españoles»,
// «Hipódromo Argentino de Palermo», «Campo Argentino de Polo», «Jardín Botánico Carlos Thays», «Ecoparque de Buenos
// Aires», «La Rural»).
// Lo supuesto (no sale de ninguna fuente): que los lagos y los senderos tuvieran en cada etapa la forma de hoy (los
// planos de época los traen parecidos, no iguales); el lugar de cada árbol y de cada cantero de rosas; el pavimento
// de las avenidas (tierra apisonada hasta 1905, adoquín desde 1910 y asfalto en 1940); el tamaño, el lugar exacto y
// la forma de las tribunas del Hipódromo y del polo, de la casa y el invernadero del
// Botánico y de la pérgola; los monumentos van reducidos a sus volúmenes (el pedestal, la columna, el bronce).
//   · Los pabellones del Zoológico (desde 1905) y los de la Rural con su pista central (desde 1910) van en la planta
//     que tienen hoy (fuentes/osm/palermo-edificios.json, © los colaboradores de OpenStreetMap, ODbL).
//   · El viaducto (desde 1921): las vías de hoy de los ferrocarriles Mitre y San Martín, sobre arcos de ladrillo y con
//     un puente de hierro en cada avenida (los tramos que el mapa de hoy marca como puente). Los trenes de Retiro
//     andan por arriba (src/viaducto.js, src/vias.js).
// Supuesto también: cuál pabellón del Zoológico es cuál (el mapa no los nombra: las cúpulas, las torres y los
// tejados van repartidos por tamaño) y que estuvieran todos en 1905; que los pabellones de la Rural que quedan sean
// de 1910 (el año de la Exposición del Centenario) y la forma de sus techos; el largo, el material y el lugar de los
// galpones del ganado y de los corrales; el alto del viaducto (5,5 m), la forma de sus arcos y dónde sube y baja.
// No están: las jaulas sueltas del Zoológico, las vías a nivel de antes del viaducto (salvo la del Norte, que es de
// src/vias.js), el Planetario y el Jardín Japonés (son de los años sesenta), el Velódromo.
// Colores que faltan: la arena de la pista va de LONA; el mármol, de BLANCO.
import { PARQUES_PALERMO, LAGOS_PALERMO, AVENIDAS_PALERMO, SENDEROS_PALERMO, ARBOLES_PALERMO, PUENTES_PALERMO, ROSALES_PALERMO, PISTA_PALERMO, PABELLONES_PALERMO, VIADUCTOS_PALERMO } from '../palermo.js';
import { ferro } from './ferro.js';

export default function (c) {
  const { THREE, PINTA, PIEDRA, PIZARRA, PINTADO, TINTA } = c;
  let semilla = 1875; const al = () => { semilla = (semilla * 1664525 + 1013904223) >>> 0; return semilla / 4294967296; };
  const F = ferro(c, al);
  const E88 = 1, E05 = 3, E10 = 4, E21 = 5, E40 = 6, M = 0.675;
  // Un solo marco para todo el suelo: el origen en la esquina de Sarmiento y Libertador, x al norte del plano, z al río.
  const T = c.lugar(16251, 4247, 1, 0);
  const m = (P) => P.map(([px, py]) => T.deMundo(px, py));
  const BLANCO = { tono: c.BLANCO }, BRONCE = { pinta: [PINTA.PATINA, 0.3] }, MARMOL = { pinta: [PINTA.BLANCO, 0.97] };

  // ---------------------------------------------------------------------------------------------------- los lagos
  for (const [, e, orilla, islas] of LAGOS_PALERMO) {
    c.epoca(e);
    T.tapete(m(orilla), PINTA.AGUA, { y: 0.1, claro: 0.62 });
    for (const isla of islas) T.tapete(m(isla), PINTA.CESPED, { y: 0.34, claro: 0.74 });
  }

  // ------------------------------------------------------------------------------------------------- las avenidas
  // (tierra apisonada hasta que llega el adoquín, en 1910; asfalto en 1940)
  for (const [, e, medio, pts] of AVENIDAS_PALERMO) {
    const L = F.curva(m(pts), 0, 12), ancho = medio * 2;
    if (e < E10) { c.epoca(e, E10); F.tira(T, L, ancho, PINTA.LONA, 0.3, 0.9); }
    c.epoca(Math.max(e, E10), E40); F.tira(T, L, ancho, PINTA.ADOQUIN, 0.3, 0.8);
    c.epoca(E40); F.tira(T, L, ancho, PINTA.ASFALTO, 0.3, 0.7);
  }

  // ------------------------------------------------------------------------------------------------- los senderos
  for (const [e, medio, pts] of SENDEROS_PALERMO) { c.epoca(e); F.tira(T, F.curva(m(pts), 0, 12), medio * 2, PINTA.GRANZA, 0.1, 0.88); }
  // (los puentes: un tablero blanco apenas levantado, con sus barandas)
  for (const [e, pts] of PUENTES_PALERMO) {
    c.epoca(e); const L = F.curva(m(pts), 0, 6);
    F.tira(T, L, 3.4, PINTA.BLANCO, 0.6, 0.97);
    for (const s of [-1, 1]) for (const p of F.corrida(L, s * 1.6)) T.caja(0.25, 1, 0.25, p[0], 0.6, p[1], PINTADO, MARMOL);
  }

  // -------------------------------------------------------------------------------------------------- los árboles
  for (const [px, py, r, e] of ARBOLES_PALERMO) { c.epoca(e); T.arbol(...T.deMundo(px, py), r); }

  // --------------------------------------------------------------------------------------------------- el Rosedal
  c.epoca(E21);
  for (const [px, py, r] of ROSALES_PALERMO) { const [x, z] = T.deMundo(px, py); T.cantero(T.ovalo(x, z, r, r, 12), { alto: 0.3, tono: PINTA.FLORES, cordon: 0.5, claro: 0.7 }); }
  { // la pérgola: dos hileras de columnas blancas con sus vigas, a lo largo del contorno del paseo que mira al lago
    const ros = PARQUES_PALERMO.find((p) => /Rosedal/.test(p[0]));
    if (ros) {
      const P = ros[2]; let k = 0, d0 = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], d = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d > d0) { d0 = d; k = i; } }
      const a = P[k], b = P[(k + 1) % P.length], cx = P.reduce((s, p) => s + p[0], 0) / P.length, cy = P.reduce((s, p) => s + p[1], 0) / P.length;
      let ux = (b[0] - a[0]) / d0, uy = (b[1] - a[1]) / d0, nx = -uy, ny = ux; if ((cx - a[0]) * nx + (cy - a[1]) * ny < 0) { nx = -nx; ny = -ny; }
      const largo = Math.min(90, d0 * M - 16), G = c.lugar((a[0] + b[0]) / 2 + nx * 14, (a[1] + b[1]) / 2 + ny * 14, ux, uy), n = Math.floor(largo / 4);
      for (let i = 0; i <= n; i++) for (const s of [-1, 1]) G.cilindro(0.22, 3.2, -largo / 2 + i * 4, 0, s * 1.9, PINTADO, 8, 0.2, MARMOL);
      for (const s of [-1, 1]) G.caja(largo + 0.8, 0.22, 0.3, 0, 3.2, s * 1.9, PINTADO, MARMOL);
      for (let i = 0; i <= n * 2; i++) G.caja(0.16, 0.16, 4.8, -largo / 2 + i * 2, 3.42, 0, PINTADO, MARMOL);
      G.tapete(G.recto(largo + 2, 5.4), PINTA.BALDOSA, { y: 0.32, claro: 0.9 });
    }
  }

  // -------------------------------------------------------------------------------------------------- el Hipódromo
  {
    const { c: [hx, hy], u: [ux, uy], largo, radio } = PISTA_PALERMO, H = c.lugar(hx, hy, ux, uy), L = largo * M, R = radio * M;
    // la pista de arena: dos rectas y dos codos
    const ovalo = (r, n = 22) => [...Array.from({ length: n + 1 }, (_, i) => { const a = -Math.PI / 2 + (i / n) * Math.PI; return [L + Math.cos(a) * r, Math.sin(a) * r]; }), ...Array.from({ length: n + 1 }, (_, i) => { const a = Math.PI / 2 + (i / n) * Math.PI; return [-L + Math.cos(a) * r, Math.sin(a) * r]; })];
    // (la punta norte de la pista cae afuera del marco del plano: se dibuja hasta ahí)
    const tramos = (r) => { const o = ovalo(r); o.push(o[0]); const out = []; let t = []; for (const p of F.curva(o, 0, 12)) { if (H.aPlano(...p)[0] < 18170) t.push(p); else { if (t.length > 1) out.push(t); t = []; } } if (t.length > 1) out.push(t); return out; };
    const anillo = (r, ...a) => { for (const t of tramos(r)) F.tira(H, t, ...a); };
    c.epoca(E88);
    anillo(R - 14, 26, PINTA.LONA, 0.12, 0.9);
    anillo(R - 44, 16, PINTA.CESPED, 0.12, 0.66); // (la pista de césped, por adentro)
    for (const r of [R, R - 28]) anillo(r, 0.35, PINTA.BLANCO, 0.9, 0.97); // (las barandas)
    // las tribunas, del lado de la avenida, frente a la recta final
    c.epoca(E88, E10);
    for (const x of [-60, 20]) { const B = c.lugar(...H.aPlano(-L * 0.45 + x, -R - 34), ux, uy); B.caja(60, 5, 12, 0, 0, 0, PIEDRA, { tono: c.CREMA }); B.tejado(62, 15, 3, 0, 5, 0, 'x', PIZARRA); }
    c.epoca(E10);
    for (const [x, w] of [[-150, 70], [-60, 90], [45, 90], [135, 60]]) {
      const B = c.lugar(...H.aPlano(-L * 0.45 + x, -R - 38), ux, uy);
      B.caja(w, 9, 16, 0, 0, -3, PIEDRA, BLANCO);                                  // el cuerpo, de espaldas a la avenida
      for (let i = 0; i < 6; i++) B.caja(w, 1.2, 2.4, 0, i * 1.2, 5 + 2.4 * (5 - i) - 6, PIEDRA, BLANCO); // las gradas, hacia la pista
      B.tejado(w + 2, 24, 3.2, 0, 11.5, 2, 'x', PIZARRA);
      for (let i = 0; i <= Math.floor(w / 10); i++) B.cilindro(0.25, 11.5, -w / 2 + i * (w / Math.floor(w / 10)), 0, 12, PINTADO, 8, 0.25, MARMOL);
    }
  }

  // ---------------------------------------------------------------------------------------------- la cancha de polo
  {
    const polo = PARQUES_PALERMO.find((p) => /polo/.test(p[0]));
    if (polo) {
      const P = polo[2], cx = P.reduce((s, p) => s + p[0], 0) / 4, cy = P.reduce((s, p) => s + p[1], 0) / 4, d = Math.hypot(P[2][0] - P[1][0], P[2][1] - P[1][1]), ux = (P[2][0] - P[1][0]) / d, uy = (P[2][1] - P[1][1]) / d;
      const G = c.lugar(cx, cy, ux, uy);
      c.epoca(E40);
      G.tapete(G.recto(275, 146), PINTA.CESPED, { y: 0.12, claro: 0.86 });
      for (const s of [-1, 1]) F.tira(G, F.curva([[-137, s * 73], [137, s * 73]], 0, 12), 0.5, PINTA.BLANCO, 0.34, 0.97);
      for (const s of [-1, 1]) for (const x of [-60, 60]) {
        const B = c.lugar(...G.aPlano(x, s * 92), ux, uy);
        B.caja(100, 3, 12, 0, 0, 0, PIEDRA, BLANCO); for (let i = 0; i < 5; i++) B.caja(100, 1, 2, 0, 3 + i, s * (4 - i * 2) + s * 1, PIEDRA, BLANCO);
        B.tejado(102, 16, 2.4, 0, 10, 0, 'x', PIZARRA); for (let i = 0; i <= 10; i++) B.cilindro(0.2, 10, -50 + i * 10, 0, -s * 6, PINTADO, 8, 0.2, MARMOL);
      }
    }
  }

  // ----------------------------------------------------------------------------------- los pabellones (Zoo y Rural)
  /** el rectángulo que envuelve una planta, alineado con su lado más largo: un lugar en su centro, y su ancho y fondo */
  const marco = (P) => {
    let d0 = 0, ux = 1, uy = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], d = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d > d0) { d0 = d; ux = (b[0] - a[0]) / d; uy = (b[1] - a[1]) / d; } }
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity; for (const [x, y] of P) { const a = x * ux + y * uy, b = -x * uy + y * ux; a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b); }
    const am = (a0 + a1) / 2, bm = (b0 + b1) / 2, G = c.lugar(am * ux - bm * uy, am * uy + bm * ux, ux, uy), w = (a1 - a0) * M, d = (b1 - b0) * M;
    let ar = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; ar += p[0] * q[1] - q[0] * p[1]; }
    return { G, w, d, planta: P.map(([x, y]) => G.deMundo(x, y)), lleno: (Math.abs(ar) / 2) * M * M / (w * d) };
  };
  const centroDe = (P) => [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length];
  const COBRE = { pinta: [PINTA.COBRE, 0.5] }, TEJA = { pinta: [PINTA.LADRILLO, 0.55] }, CHAPA = { pinta: [PINTA.CHAPA, 0.8] };

  // --------------------------------------------------------------------------------------------- el Zoológico
  // Los pabellones de la época de Holmberg y de Onelli, en la planta que tienen hoy. Cuál es cuál no sale del mapa
  // (no traen nombre): las formas de arriba —cúpulas, torres, tejados— van repartidas por tamaño.
  c.epoca(E05);
  {
    const TONOS = [c.CREMA, c.ROSA, c.BLANCO, c.LADRILLO, c.CREMA, c.SILLAR];
    PABELLONES_PALERMO.filter((p) => p[0] === 'zoo').forEach(([, , P], i) => {
      const { G, w, d, planta, lleno } = marco(P), tono = { tono: TONOS[i % TONOS.length] }, corto = Math.min(w, d), h = corto > 14 ? 6.5 : corto > 8 ? 5 : 3.8, k = i % 5;
      G.prisma(planta, h, 0, PIEDRA, tono);
      if (corto < 6) { G.piramide(corto * 0.75, 2, 0, h, 0, PIZARRA); return; }                       // un quiosco, una jaula techada
      if (k === 0) { // la cúpula sobre su tambor, y cuatro cupulines
        const r = corto * 0.3; G.cilindro(r, 2.6, 0, h, 0, PIEDRA, 12, r, tono); G.cupula(r * 1.06, 0, h + 2.6, 0, 1.15, PINTADO, COBRE); G.cilindro(0.16, 2.4, 0, h + 2.6 + r * 1.15, 0, TINTA, 5);
        if (lleno > 0.75) for (const sx of [-1, 1]) for (const sz of [-1, 1]) { G.cilindro(1.3, 1.6, sx * (w / 2 - 1.8), h, sz * (d / 2 - 1.8), PIEDRA, 8, 1.3, tono); G.cupula(1.4, sx * (w / 2 - 1.8), h + 1.6, sz * (d / 2 - 1.8), 1.3, PINTADO, COBRE); }
      } else if (k === 1 && lleno > 0.78) G.cuatroAguas(w + 1, d + 1, Math.min(4, corto * 0.3), 0, h, 0, PIZARRA);
      else if (k === 2) { // el templo: los cuerpos que se achican hacia arriba
        let y = h, s = corto * 0.62; for (let j = 0; j < 4; j++) { G.caja(s, 1.7, s, 0, y, 0, PIEDRA, tono); G.caja(s + 0.5, 0.25, s + 0.5, 0, y + 1.7, 0, PIEDRA, tono); y += 1.95; s *= 0.74; }
        G.cupula(s * 0.7, 0, y, 0, 1.5, PIEDRA, tono); G.cilindro(0.14, 2, 0, y + s, 0, TINTA, 5);
      } else if (k === 3 && lleno > 0.78) { G.tejado(w + 0.8, d + 0.8, Math.min(3.6, corto * 0.28), 0, h, 0, w >= d ? 'x' : 'z', PIZARRA); G.caja(2.6, 3.4, 2.6, (w >= d ? w : 0) * 0.3, h, (w >= d ? 0 : d) * 0.3, PIEDRA, tono); G.piramide(2.2, 2.6, (w >= d ? w : 0) * 0.3, h + 3.4, (w >= d ? 0 : d) * 0.3, PIZARRA); }
      else { // las torrecitas moriscas en las puntas, y el pretil
        G.prisma(c.adentro(planta, 1.2), 0.9, h, PIEDRA, tono);
        for (const [x, z] of planta.filter((_, j) => j % Math.max(1, Math.round(planta.length / 4)) === 0)) { G.cilindro(1.1, h + 3, x * 0.92, 0, z * 0.92, PIEDRA, 8, 1.1, tono); G.cupula(1.25, x * 0.92, h + 3, z * 0.92, 1.5, PINTADO, COBRE); }
      }
    });
  }

  // ------------------------------------------------------------------------------------------------------ la Rural
  {
    // (a lo largo de la avenida Sarmiento, de la Plaza Italia hacia el parque)
    const A = [15420, 3345], B = [15959, 3817], d = Math.hypot(B[0] - A[0], B[1] - A[1]), ux = (B[0] - A[0]) / d, uy = (B[1] - A[1]) / d, G = c.lugar(...A, ux, uy), rural = PARQUES_PALERMO.find((p) => /Rural/.test(p[0]))[2];
    const adentro = (px, py) => { let s = false; for (let i = 0, j = rural.length - 1; i < rural.length; j = i++) { const [xi, yi] = rural[i], [xj, yj] = rural[j]; if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) s = !s; } return s; };
    const propios = PABELLONES_PALERMO.filter((p) => p[0] === 'rural'), tribunas = propios.filter((p) => p[1] === 'tribuna'), pista = centroDe(tribunas.map((p) => centroDe(p[2])));
    c.epoca(E88);
    G.tapete(rural.map(([px, py]) => G.deMundo(px, py)), PINTA.LONA, { y: 0.1, claro: 0.9 });
    // Los galpones del ganado: de distinto largo, de ladrillo, de madera o de chapa, con algún corral abierto entre
    // medio. Hasta 1905 ocupan todo el predio; desde 1910 dejan el lado de la Plaza Italia a los pabellones y a la pista.
    const galpones = (libre) => {
      for (let x = 40; x < d * M - 30; x += 38) for (const z of [-34, -84, -134, -184, -234, -284, -334]) {
        const r = al(), r2 = al(), r3 = al(), largo = 24 + Math.floor(r * 4) * 6, ancho = r2 < 0.3 ? 16 : 22, zc = z + (r3 - 0.5) * 6;
        const esq = [[x - ancho / 2 - 2, zc - largo / 2 - 2], [x + ancho / 2 + 2, zc - largo / 2 - 2], [x + ancho / 2 + 2, zc + largo / 2 + 2], [x - ancho / 2 - 2, zc + largo / 2 + 2]].map((p) => G.aPlano(...p));
        if (!esq.every((p) => adentro(...p)) || !libre(G.aPlano(x, zc))) continue;
        if (r2 > 0.86) { // un corral: el cerco de madera y la tierra pisada
          const S = c.lugar(...G.aPlano(x, zc), ux, uy); S.tapete(S.recto(ancho, largo), PINTA.GRANZA, { y: 0.32, claro: 0.8 });
          for (const s of [-1, 1]) { S.caja(0.2, 1.2, largo, s * ancho / 2, 0, 0, PINTADO, { pinta: [PINTA.MADERA, 0.5] }); S.caja(ancho, 1.2, 0.2, 0, 0, s * largo / 2, PINTADO, { pinta: [PINTA.MADERA, 0.5] }); }
          continue;
        }
        const o = r < 0.4 ? F.LADRILLO : r < 0.7 ? F.MADERA : F.CHAPA, alto = 3.6 + r3 * 1.6;
        F.nave(G, x, zc, 0, 1, largo, ancho, alto, { o, cubierta: r2 < 0.5 ? F.CHAPA : TEJA, naves: ancho > 20 && r3 > 0.6 ? 2 : 1 });
      }
    };
    c.epoca(E88, E10); galpones(() => true);
    c.epoca(E10);
    galpones(([px, py]) => Math.hypot(px - pista[0], py - pista[1]) > 120 && !propios.some(([, , P]) => { const m = centroDe(P); return Math.hypot(px - m[0], py - m[1]) < 34 + Math.max(...P.map((q) => Math.hypot(q[0] - m[0], q[1] - m[1]))) * 0.8; }));
    // la pista central, entre sus tribunas
    { const R = Math.min(...tribunas.map((p) => Math.hypot(centroDe(p[2])[0] - pista[0], centroDe(p[2])[1] - pista[1]))) * M - 9, Gp = c.lugar(...pista, ux, uy);
      Gp.tapete(Gp.ovalo(0, 0, R + 3, R + 3, 28), PINTA.GRANZA, { y: 0.32, claro: 0.86 }); Gp.tapete(Gp.ovalo(0, 0, R - 5, R - 5, 24), PINTA.CESPED, { y: 0.54, claro: 0.8 });
      for (const [x, z] of Gp.ovalo(0, 0, R + 3.2, R + 3.2, 40)) Gp.caja(0.2, 1.1, 0.2, x, 0, z, PINTADO, MARMOL); }
    // los pabellones, en la planta que tienen hoy (los nombres son los de hoy)
    for (const [, n, P] of propios) {
      const { G: E, w, d: f, planta, lleno } = marco(P), eje = w >= f ? 'x' : 'z', corto = Math.min(w, f);
      if (n === 'tribuna') { // las gradas mirando a la pista, bajo su techo
        const [mx, mz] = E.deMundo(...pista), s = eje === 'x' ? Math.sign(mz) || 1 : Math.sign(mx) || 1;
        for (let i = 0; i < 5; i++) { const q = corto * (1 - i / 5), o = s * (corto - q) / 2; if (eje === 'x') E.caja(w, 1.1, q, 0, i * 1.1, -o, PIEDRA, BLANCO); else E.caja(q, 1.1, f, -o, i * 1.1, 0, PIEDRA, BLANCO); }
        E.tejado(w + 1, f + 1, 1.8, 0, 9, 0, eje, PIZARRA);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) E.cilindro(0.22, 9, sx * (w / 2 - 0.5), 0, sz * (f / 2 - 0.5), PINTADO, 8, 0.22, MARMOL);
      } else if (/Ocre/.test(n)) { // el pabellón grande: la nave de hierro y vidrio, con su frente de mampostería
        E.prisma(planta, 9, 0, PIEDRA, { tono: c.CREMA }); E.tejado(w - 2, f - 2, corto * 0.2, 0, 9, 0, eje, PIZARRA, true);
        for (const s of [-1, 1]) { const x = eje === 'x' ? s * (w / 2 - 3) : 0, z = eje === 'x' ? 0 : s * (f / 2 - 3); E.caja(eje === 'x' ? 6 : w * 0.5, 13, eje === 'x' ? f * 0.5 : 6, x, 0, z, PIEDRA, { tono: c.CREMA }); E.cupula(3.4, x, 13, z, 1.1, PINTADO, COBRE); }
      } else if (/Equinos/.test(n)) { // las caballerizas: ladrillo, techo a dos aguas con su lucernario
        E.prisma(planta, 6.5, 0, PIEDRA, { tono: c.LADRILLO }); E.tejado(w + 0.8, f + 0.8, corto * 0.22, 0, 6.5, 0, eje, PIZARRA);
        if (eje === 'x') E.caja(w * 0.8, 1.4, 3, 0, 6.5 + corto * 0.2, 0, PINTADO, CHAPA); else E.caja(3, 1.4, f * 0.8, 0, 6.5 + corto * 0.2, 0, PINTADO, CHAPA);
      } else if (/Central/.test(n)) { // el restaurante: dos pisos, el techo a cuatro aguas y el mirador
        E.prisma(planta, 7.5, 0, c.CASA, { tono: c.BLANCO, floors: 2 }); E.cuatroAguas(w * 0.7, f * 0.7, 3.2, 0, 7.5, 0, PIZARRA); E.caja(4.2, 4, 4.2, 0, 7.5, 0, PIEDRA, BLANCO); E.piramide(3.6, 3.4, 0, 11.5, 0, PIZARRA);
      } else if (/Pista/.test(n)) { E.prisma(planta, 5.5, 0, PIEDRA, { tono: c.CREMA }); if (lleno > 0.75) E.tejado(w + 0.6, f + 0.6, corto * 0.24, 0, 5.5, 0, eje, PIZARRA, true); }
      else { E.prisma(planta, 5, 0, PIEDRA, { tono: /Fogón/.test(n) ? c.LADRILLO : c.BLANCO }); if (lleno > 0.75) E.tejado(w + 0.6, f + 0.6, corto * 0.22, 0, 5, 0, eje, PIZARRA); else E.prisma(c.adentro(planta, 1), 0.8, 5, PIEDRA, BLANCO); }
    }
  }

  // ------------------------------------------------------------------------------------------------- el viaducto
  // Las vías del Central Argentino y del Pacífico, levantadas sobre arcos de ladrillo, con un puente de hierro sobre
  // cada avenida. Cada tramo va en su propio lugar, para apoyarse en el terreno que tiene debajo.
  c.epoca(E21);
  {
    const LAD = { pinta: [PINTA.LADRILLO, 0.6] }, HIERRO = { pinta: [PINTA.NEGRO, 0.2] }, PIEDRAS = { pinta: [PINTA.BALASTO, 0.7] };
    const malla = () => { const v = []; return { v,
      /** una barra de A a B (x, z), de ancho w, corrida `lat` a la derecha, de y0 a y1 en cada punta; caras: t(echo) l(ados) p(untas) b(ajo) */
      barra(A, B, w, lat, ya0, ya1, yb0, yb1, caras = 'tl') {
        const L = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1, nx = -(B[1] - A[1]) / L, nz = (B[0] - A[0]) / L, p = (P, s, y) => [P[0] + nx * (lat + (s * w) / 2), y, P[1] + nz * (lat + (s * w) / 2)];
        const a0 = p(A, -1, ya0), a1 = p(A, 1, ya0), a2 = p(A, 1, ya1), a3 = p(A, -1, ya1), b0 = p(B, -1, yb0), b1 = p(B, 1, yb0), b2 = p(B, 1, yb1), b3 = p(B, -1, yb1);
        const cx = (A[0] + B[0]) / 2 + nx * lat, cy = (ya0 + ya1 + yb0 + yb1) / 4, cz = (A[1] + B[1]) / 2 + nz * lat;
        const q = (a, b, cc, dd) => { // (la cara, mirando hacia afuera de la barra)
          const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = dd[0] - a[0], vy = dd[1] - a[1], vz = dd[2] - a[2], n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
          const m = [(a[0] + cc[0]) / 2 - cx, (a[1] + cc[1]) / 2 - cy, (a[2] + cc[2]) / 2 - cz];
          if (n[0] * m[0] + n[1] * m[1] + n[2] * m[2] >= 0) v.push(...a, ...b, ...cc, ...a, ...cc, ...dd); else v.push(...a, ...cc, ...b, ...a, ...dd, ...cc);
        };
        if (caras.includes('t')) q(a3, a2, b2, b3); if (caras.includes('b')) q(a0, a1, b1, b0);
        if (caras.includes('l')) { q(a0, b0, b3, a3); q(a1, b1, b2, a2); } if (caras.includes('p')) { q(a0, a1, a2, a3); q(b0, b1, b2, b3); }
      },
      pone(G, o) { if (!v.length) return; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals(); G.put(g, PINTADO, o); } }; };
    const ANCHO = 4.7;
    for (const [puente, rieles, pts] of VIADUCTOS_PALERMO) {
      const m0 = pts[pts.length >> 1], G = c.lugar(m0[0], m0[1], 1, 0), L = pts.map(([px, py, h]) => [...G.deMundo(px, py), h]);
      const lad = malla(), hie = malla(), bal = malla();
      for (let i = 0; i + 1 < L.length; i++) {
        const A = L[i], B = L[i + 1], ha = A[2], hb = B[2], hm = (ha + hb) / 2;
        if (hm < 0.35) { if (rieles) F.via(G, [A, B]); continue; }
        bal.barra(A, B, 3.4, 0, ha, ha + 0.14, hb, hb + 0.14, 't');
        if (rieles) for (const s of [-1, 1]) hie.barra(A, B, 0.18, s * 0.84, ha + 0.14, ha + 0.32, hb + 0.14, hb + 0.32, 't');
        if (puente) { // el tablero y las dos vigas de hierro
          hie.barra(A, B, ANCHO, 0, ha - 0.5, ha, hb - 0.5, hb, 'tlb');
          for (const s of [-1, 1]) hie.barra(A, B, 0.35, s * (ANCHO / 2 - 0.2), ha - 1.2, ha + 1.3, hb - 1.2, hb + 1.3, 'tlb');
          continue;
        }
        const bajo = Math.max(0, hm - 1); // (hasta ahí llegan los pilares; más abajo de 2,4 m no hay arcos: es un muro)
        lad.barra(A, B, ANCHO, 0, hm < 2.4 ? 0 : ha - 1, ha, hm < 2.4 ? 0 : hb - 1, hb, hm < 2.4 ? 'tl' : 'tlb');
        for (const s of [-1, 1]) lad.barra(A, B, 0.3, s * (ANCHO / 2 - 0.15), ha, ha + 0.9, hb, hb + 0.9, 'tl');
        if (hm >= 2.4) { const d = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1, ux = (B[0] - A[0]) / d, uz = (B[1] - A[1]) / d, h2 = 1.3; lad.barra([A[0] - ux * h2, A[1] - uz * h2], [A[0] + ux * h2, A[1] + uz * h2], ANCHO, 0, 0, bajo, 0, bajo, 'lp'); }
      }
      if (puente) { const a = L[0], b = L[L.length - 1]; for (const p of [a, b]) lad.barra([p[0] - 1.3, p[1]], [p[0] + 1.3, p[1]], ANCHO + 1.2, 0, 0, p[2] - 0.5, 0, p[2] - 0.5, 'lpt'); }
      lad.pone(G, LAD); hie.pone(G, HIERRO); bal.pone(G, PIEDRAS);
    }
  }

  // ------------------------------------------------------------------------------------------------ los monumentos
  { // el Jardín Botánico: la casa de ladrillo y el invernadero grande
    c.epoca(E05);
    const B = c.lugar(15020, 3925, 0.75, 0.66);
    B.caja(24, 8, 14, 0, 0, 0, PIEDRA, { tono: c.LADRILLO }); B.cuatroAguas(25, 15, 3.4, 0, 8, 0, PIZARRA);
    for (const s of [-1, 1]) B.caja(4.4, 11, 4.4, s * 10, 0, 6, PIEDRA, { tono: c.LADRILLO });
    const I = c.lugar(14900, 3840, 0.75, 0.66);
    I.caja(34, 4.5, 9, 0, 0, 0, PINTADO, { pinta: [PINTA.BLANCO, 0.9] }); I.tejado(34.6, 9.6, 3.2, 0, 4.5, 0, 'x', PIZARRA, true);
  }
  { // la Plaza Italia: el Garibaldi de Eugenio Maccagnani (1904)
    c.epoca(E05);
    const G = c.lugar(15280, 3380);
    G.cantero(G.ovalo(0, 0, 13, 13, 24), { alto: 0.3, tono: PINTA.CESPED });
    G.caja(7, 1.2, 9, 0, 0.3, 0, PIEDRA, BLANCO); G.caja(4.6, 6.2, 6.6, 0, 1.5, 0, PIEDRA, BLANCO); G.caja(5.2, 0.5, 7.2, 0, 7.7, 0, PIEDRA, BLANCO);
    G.caja(1.1, 1.5, 3.4, 0, 9.4, 0, PINTADO, BRONCE); for (const [x, z] of [[-0.35, -1.3], [0.35, -1.3], [-0.35, 1.3], [0.35, 1.3]]) G.caja(0.28, 1.3, 0.28, x, 8.2, z, PINTADO, BRONCE);
    G.caja(0.5, 1.3, 0.7, 0, 9.6, 1.9, PINTADO, BRONCE); G.caja(0.7, 1.5, 0.6, 0, 10.9, 0.1, PINTADO, BRONCE); G.cilindro(0.3, 0.5, 0, 12.4, 0.1, PINTADO, 8, 0.3, BRONCE);
    for (const s of [-1, 1]) G.caja(1.6, 2.2, 1.2, s * 3.4, 1.5, 0, PINTADO, BRONCE);
  }
  { // el Sarmiento de Rodin (1900)
    c.epoca(E05);
    const G = c.lugar(16280, 4380);
    G.caja(4.2, 0.6, 4.2, 0, 0, 0, PIEDRA, BLANCO); G.caja(2.6, 4, 2.6, 0, 0.6, 0, PIEDRA, BLANCO); G.caja(0.9, 2.5, 0.8, 0, 4.6, 0, PINTADO, BRONCE); G.cilindro(0.3, 0.5, 0, 7.1, 0, PINTADO, 8, 0.3, BRONCE);
  }
  { // el Monumento de los Españoles («La Carta Magna y las Cuatro Regiones Argentinas», inaugurado en 1927): 24,5 m
    c.epoca(E40);
    const G = c.lugar(16251, 4247);
    G.tapete(G.ovalo(0, 0, 34, 34, 36), PINTA.ASFALTO, { y: 0.52, claro: 0.7 });
    G.cantero(G.ovalo(0, 0, 17, 17, 32), { alto: 0.7, tono: PINTA.AGUA, cordon: 0.9, claro: 0.62 });
    G.cilindro(9.5, 1.4, 0, 0, 0, PINTADO, 24, 9, MARMOL); G.cilindro(7, 1.2, 0, 1.4, 0, PINTADO, 24, 6.6, MARMOL);
    G.caja(7.5, 5.4, 7.5, 0, 2.6, 0, PINTADO, MARMOL);
    for (const [x, z] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { G.caja(3.2, 2.6, 3.2, x * 5.2, 1.4, z * 5.2, PINTADO, BRONCE); G.caja(1.3, 2.2, 1.3, x * 5.2, 4, z * 5.2, PINTADO, BRONCE); }
    G.cilindro(3, 9.5, 0, 8, 0, PINTADO, 12, 2.3, MARMOL); G.cilindro(2.7, 0.8, 0, 17.5, 0, PINTADO, 12, 2.7, MARMOL);
    for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) G.caja(1, 3, 1, x * 2.2, 8, z * 2.2, PINTADO, MARMOL); // (las figuras al pie de la columna)
    G.caja(1.2, 4.6, 1.1, 0, 18.3, 0, PINTADO, MARMOL); G.cilindro(0.42, 0.8, 0, 22.9, 0, PINTADO, 8, 0.42, MARMOL); G.caja(3, 0.4, 0.5, 0, 21.2, 0, PINTADO, MARMOL); // (la República, con los brazos abiertos)
  }
  c.epoca(0);
}
