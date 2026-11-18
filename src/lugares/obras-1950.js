// Lo que trae la etapa de 1950 y no cabía en los lugares que ya estaban: los edificios públicos nuevos, el estadio de
// Huracán, la bandeja que le faltaba a la Bombonera, la obra del Mercado del Plata y el pavimento de las dos avenidas
// que se abrieron o se ensancharon. Va último en la lista de src/hitos.js: lo que se agrega acá no les corre la tirada
// de colores a los demás.
//
// Las fechas salen de fuentes/1965/cronologia.json (cada ítem con su fuente y su nivel de seguridad; acá solo entra
// lo de seguridad alta o media). El lugar de cada edificio, de esa cronología, cruzado con tools/esquina.mjs y con la
// foto aérea de 1965 del mapa de la Ciudad (fuentes/1965/aerea.mjs, en el marco del plano): de ahí salen las plantas
// y los largos. Las alturas salen de los pisos que da la cronología, donde los da; donde no, de contar pisos en las
// fotos de Wikimedia Commons que se nombran en cada edificio, o son supuesto, y se dice.
import { SITIOS } from '../barrios.js';
import { ferro } from './ferro.js';

export default function (c) {
  const { THREE, PIEDRA, CASA, TINTA, PINTADO, PINTA } = c;
  const P = (tono, claro = 0.6) => ({ pinta: [tono, claro] });
  const HORMIGON = P(PINTA.BALDOSA, 0.88), BLANCO = P(PINTA.BLANCO, 0.97), MADERA = P(PINTA.MADERA, 0.6), RAYA = P(PINTA.ADOQUIN, 0.6);
  const F = ferro(c, () => 0.5);
  const E50 = c.etapaDe(1950);
  const medio = ([a, b]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

  // ============================================================================================ el pavimento de 1950
  // La lámina de las calles (tools/crece.mjs) guarda una sola fecha por punto, así que la calzada de una obra de 1950
  // no entra donde ya había una calle ni al lado. En la 9 de Julio eso deja sin asfaltar las dos calles del costado
  // (Cerrito y Carlos Pellegrini al norte, Lima y Bernardo de Irigoyen al sur): entre los canteros y las casas quedaba
  // la calle vieja, que al lado de la avenida se lee como tierra. Y en Córdoba, lo que se le sacó a las manzanas
  // quedaba despejado y sin pavimento. Van acá, a mano, como paños que nacen con la obra.
  c.epoca(E50);
  { // --- la 9 de Julio: las calles del costado, de Belgrano a Mitre y de Tucumán a Córdoba (el tramo de 1937, de
    // Mitre a Tucumán, ya lo pinta el suelo). El mismo marco que src/lugares/nueve-de-julio.js: x hacia el norte, z
    // hacia el río, el origen al pie del Obelisco. El cantero termina a 50,5 m del eje; el eje de la calle del costado
    // pasa a 57 (las esquinas de hoy, tools/esquina.mjs) y el cordón de enfrente queda a 62: la vereda, hasta las casas.
    const mitre = [[10615, 8273], [10617, 8438]], tucuman = [[11578, 8299], [11571, 8470]], A = medio(mitre), B = medio(tucuman), l = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const T = c.lugar(11195, 8373, (B[0] - A[0]) / l, (B[1] - A[1]) / l), calle = (e) => (T.deMundo(...e[0])[0] + T.deMundo(...e[1])[0]) / 2;
    const X = Object.fromEntries(Object.entries({ belgrano: [[9668, 8238], [9669, 8408]], moreno: [[9868, 8241], [9869, 8414]], alsina: [[10046, 8252], [10048, 8419]], yrigoyen: [[10232, 8257], [10231, 8425]], rivadavia: [[10436, 8266], [10433, 8431]], mitre, tucuman, viamonte: [[11752, 8303], [11753, 8471]], cordoba: [[11954, 8309], [11944, 8476]] }).map(([k, e]) => [k, calle(e)]));
    const recta = (xa, xb, z) => F.curva([[xa, z], [xb, z]], 0, 12), Z1 = 50.5, CORDON = 62, CASAS = 66.5, BOCA = 8;
    for (const s of [-1, 1]) {
      for (const [xa, xb] of [[X.belgrano - 13, X.mitre + BOCA], [X.tucuman - BOCA, X.cordoba + 13]]) F.tira(T, recta(xa, xb, s * (Z1 + CORDON) / 2), CORDON - Z1, PINTA.ASFALTO, 0.05, 1);
      // (la vereda de enfrente, cuadra por cuadra: en las bocacalles se corta)
      for (const [a, b, ba = BOCA, bb = BOCA] of [[X.belgrano, X.moreno, 13], [X.moreno, X.alsina], [X.alsina, X.yrigoyen], [X.yrigoyen, X.rivadavia], [X.rivadavia, X.mitre], [X.tucuman, X.viamonte], [X.viamonte, X.cordoba, BOCA, 13]])
        F.tira(T, recta(a + ba, b - bb, s * (CORDON + CASAS) / 2), CASAS - CORDON, PINTA.BALDOSA, 0.05, 0.93);
    }
  }
  { // --- Córdoba, de Callao a Alem (ensanchada por etapas e inaugurada en 1945): 26 m entre líneas, 13 a cada lado del
    // eje de hoy, que es lo que despeja tools/crece.mjs. La calzada, de 16 m, y dos veredas de 5: supuesto (la
    // cronología no da el corte). Las veredas se cortan en cada calle que cruza.
    const EJE = [[11979, 6905], [11965, 7724], [11954, 8102], [11954, 8309], [11944, 8476], [11932, 8681], [11933, 9272], [11933, 9864]]; // Callao, Uruguay, Libertad, Cerrito, Pellegrini, Suipacha, Florida, Alem
    const CRUCES = [[11975, 7089], [11973, 7344], [11969, 7548], [11965, 7724], [11959, 7911], [11954, 8102], [11954, 8309], [11944, 8476], [11932, 8681], [11928, 8880], [11931, 9072], [11933, 9272], [11934, 9429], [11930, 9617], [11931, 9795]]; // Rodríguez Peña … 25 de Mayo
    const T = c.lugar(EJE[0][0], EJE[0][1], 0, 1), linea = F.curva(EJE.map(([x, y]) => T.deMundo(x, y)), 0, 12); // (x: a lo largo de la avenida, hacia el río)
    F.tira(T, linea, 16, PINTA.ASFALTO, 0.05, 1, 8);
    const xs = [9, ...CRUCES.map(([x, y]) => T.deMundo(x, y)[0]), linea[linea.length - 1][0] - 2];
    // (entre Cerrito y Pellegrini cruza la 9 de Julio: ahí no hay vereda)
    for (let i = 0; i + 1 < xs.length; i++) { if (i === 7) continue; const a = xs[i] + 8, b = xs[i + 1] - 8, tramo = linea.filter(([x]) => x > a && x < b); if (tramo.length > 1) for (const s of [-1, 1]) F.tira(T, F.corrida(tramo, s * 10.5), 5, PINTA.BALDOSA, 0.05, 0.93); }
  }
  // ================================================================================================ las herramientas
  const paños = (T, Q, kind, o) => {
    const v = []; for (const [a, b, d, e] of Q) v.push(a, b, d, a, d, e, a, d, b, a, e, d);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v.flat(), 3)); g.computeVertexNormals(); T.put(g, kind, o);
  };
  /** el marco de un solar de src/barrios.js, como en src/lugares/barrios.js: x a lo largo del frente (de A a B), z hacia el fondo */
  const sitio = (clave) => {
    const S = SITIOS[clave], [A, B, , D] = S.P; let o = A, ux = B[0] - A[0], uy = B[1] - A[1]; const l = Math.hypot(ux, uy); ux /= l; uy /= l;
    let w = (D[0] - A[0]) * -uy + (D[1] - A[1]) * ux; if (w < 0) { o = B; ux = -ux; uy = -uy; w = -w; }
    const k = S.m / 0.675; c.epoca(S.e, S.hasta);
    return { T: c.lugar(o[0] + (ux - uy) * k, o[1] + (uy + ux) * k, ux, uy), L: l * 0.675 - 2 * S.m, W: w * 0.675 - 2 * S.m };
  };
  /** un cuerpo con ventanas y su cornisa */
  const cuerpo = (T, w, h, d, x, z, pisos, tono, y = 0) => { T.caja(w, h, d, x, y, z, CASA, { floors: pisos, tono }); T.caja(w + 0.7, 0.7, d + 0.7, x, y + h, z, PIEDRA, { tono }); };
  /** el esqueleto de una obra de hormigón: columnas cada `paso` y `n` losas */
  const esqueleto = (T, w, d, x, z, n, paso = 9, alto = 3.6) => {
    const nx = Math.max(2, Math.round(w / paso)), nz = Math.max(2, Math.round(d / paso)), o = { tono: c.GRIS };
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) T.caja(0.7, n * alto + 1.2, 0.7, x - w / 2 + (w * i) / nx, 0, z - d / 2 + (d * j) / nz, PIEDRA, o);
    for (let p = 1; p <= n; p++) T.caja(w + 0.6, 0.4, d + 0.6, x, p * alto, z, PIEDRA, o);
  };
  /** una valla de obra, de tablas, alrededor de un rectángulo */
  const valla = (T, L, W) => { for (const [w, d, x, z] of [[L, 0.15, L / 2, 0], [L, 0.15, L / 2, W], [0.15, W, 0, W / 2], [0.15, W, L, W / 2]]) T.caja(w, 2.2, d, x, 0, z, PINTADO, MADERA); };

  // ============================================================================== el Ministerio de Guerra (1938–1943)
  { // Hoy, el Edificio Libertador (el nombre es de 1950). Reemplaza a la obra que muestra 1940 (src/lugares/plaza-colon.js).
    // La cronología: planta baja de doble altura y 16 pisos, con mansarda; dos bloques largos, al este y al oeste, unidos
    // por un cuerpo central, con dos patios. La planta sale de la aérea de 1965: unos 140 × 57 m (la cronología da
    // fachadas de 230 m, que en la foto no entran: va lo que se mide). Alturas: 8 m de planta baja y 3,5 por piso, supuesto.
    c.epoca(c.etapaDe(1943));
    const T = c.lugar(10070, 10122, 1, 0), H = 64, t = c.CREMA; // (x: hacia el norte; z: hacia el río)
    for (const s of [-1, 1]) { cuerpo(T, 140, H, 15, 0, s * 21, 17, t); T.mansarda(138, 14, 8, 0, H + 0.7, s * 21, 4); }
    for (const s of [-1, 1]) cuerpo(T, 13, H, 27, s * 63.5, 0, 17, t);
    cuerpo(T, 30, H + 5, 27, 0, 0, 18, t); T.mansarda(30, 40, 9, 0, H + 5.7, 0, 6);
    // la entrada, del lado de la plaza: el basamento y sus vanos (supuesto: cuántos)
    T.caja(36, 8, 3, 0, 0, -30, PIEDRA, { tono: t }); T.fila(7, -15, 15, 2.6, 6.4, 0, -31.55, '-z', false);
  }

  // ============================================================================ el Ministerio de Hacienda (1939–1950)
  { // La manzana de Hipólito Yrigoyen, Balcarce, Alsina y Paseo Colón, al sur de la Casa de Gobierno. La primera etapa
    // se ocupó hacia 1939 y la segunda —los dos lotes de los costados, sobre Paseo Colón y sobre Balcarce— es de
    // 1949–1950 (cronología). Acá entra entero en 1950: en la etapa de 1940 el visor no tenía la primera mitad, y no se
    // tocó. La planta es la de la aérea de 1965; los pisos (un basamento de nueve y un cuerpo retirado de cuatro más),
    // supuesto: la cronología no los da.
    const { T, L, W } = sitio('hacienda'), t = c.CREMA;
    cuerpo(T, L, 37, W, L / 2, W / 2, 9, t); cuerpo(T, L - 18, 15, W - 18, L / 2, W / 2, 4, t, 37.7);
    T.caja(30, 9, 2.4, L / 2, 0, -0.6, PIEDRA, { tono: t }); T.fila(5, L / 2 - 12, L / 2 + 12, 3, 7, 0, -1.85, '-z', false); // (la entrada, sobre Balcarce: supuesto)
  }

  // ============================================================== el Banco de la Nación, de Bustillo: la primera etapa
  { // La piedra fundamental es del 17-9-1940 y la primera etapa se inauguró el 21-7-1944; la segunda —el 40 % que
    // faltaba, sobre la esquina del teatro viejo— quedó parada hasta 1950 y se terminó en 1955 (cronología). En 1950
    // va lo hecho: una ele sobre Mitre y sobre 25 de Mayo, sin la cúpula, y en la esquina de Rivadavia y Reconquista
    // sigue el edificio viejo (el del primer Colón, src/hitos.js). Qué mitad se hizo primero no está en la fuente: sale
    // de que la segunda fue «donde había estado el teatro». Si en 1950 el viejo ya estaba demolido: sin verificar.
    // Alturas y pilastras: supuesto (unos 36 m de piedra y un ático retirado).
    const t = c.SILLAR, H = 36;
    for (const clave of ['bnacionNorte', 'bnacionEste']) {
      const { T, L, W } = sitio(clave);
      cuerpo(T, L, H, W, L / 2, W / 2, 6, t); cuerpo(T, L - 8, 5, W - 8, L / 2, W / 2, 1, t, H + 0.7);
      if (clave === 'bnacionNorte') for (let i = 0; i <= 12; i++) T.caja(0.9, H - 7, 2, L + 0.35, 6, 3 + (i * (W - 6)) / 12, PIEDRA, { tono: t }); // (las pilastras del frente de Mitre)
      else for (let i = 0; i <= 6; i++) T.caja(2, H - 7, 0.9, 2 + (i * (L - 4)) / 6, 6, W + 0.35, PIEDRA, { tono: t }); // (y las de 25 de Mayo)
    }
  }

  // =================================================================== la Facultad de Derecho, en Figueroa Alcorta
  { // Concurso de 1945; la mudanza fue el 21-9-1949, con la obra sin terminar (siguió hasta fines de los años sesenta).
    // De la aérea de 1965: un rectángulo de unos 150 × 100 m, girado, con el frente a la avenida. Va el cuerpo del
    // frente con su escalinata y sus catorce columnas dóricas, las dos alas y el cuerpo del medio; el fondo, en
    // esqueleto. Qué estaba hecho en 1950 y las alturas (unos 27 m): supuesto.
    const { T, L, W } = sitio('derecho'), t = c.SILLAR, H = 27, cx = L / 2;
    cuerpo(T, L, H, 24, cx, 20, 4, t); for (const s of [-1, 1]) cuerpo(T, 24, H, W - 44, cx + s * (L / 2 - 12), 32 + (W - 44) / 2, 4, t);
    cuerpo(T, 44, H - 5, 46, cx, 55, 3, t);
    for (let i = 0; i < 4; i++) T.caja(76 - i * 3, 1.1, 9 - i * 2, cx, i * 1.1, 4.5 + i, PIEDRA, { tono: t }); // la escalinata
    for (let i = 0; i < 14; i++) T.cilindro(1.25, 18, cx - 30 + (i * 60) / 13, 4.4, 6.6, PIEDRA, 8, 1.1, { tono: t });
    T.caja(66, 4.6, 5, cx, 22.4, 7, PIEDRA, { tono: t }); T.caja(60, 22.4, 0.3, cx, 4.4, 8.2, TINTA); // el entablamento y la sombra del pórtico
    esqueleto(T, L - 52, 14, cx, W - 9, 3);
  }

  // =============================================================================== el Automóvil Club Argentino (1942)
  { // En Libertador 1850. El año sale del artículo de los arquitectos (seguridad media). De la aérea de 1965: una placa
    // de unos 76 m sobre la avenida y, detrás, el tambor de los talleres y la cochera, de unos 32 m de radio. Los
    // pisos (doce la placa, cuatro el tambor): supuesto.
    const { T, L } = sitio('aca'), t = c.CREMA, cx = L / 2;
    T.cilindro(32, 16, cx, 0, 40, CASA, 20, 32, { floors: 4, tono: t }); T.cilindro(32.5, 0.7, cx, 16, 40, PIEDRA, 20, 32.5, { tono: t });
    cuerpo(T, L - 4, 44, 15, cx, 9, 12, t); cuerpo(T, 26, 6, 15, cx, 9, 1, t, 44.7);
    T.caja(22, 5.4, 2, cx, 0, 0.8, PIEDRA, { tono: t }); T.fila(5, cx - 9, cx + 9, 2.6, 4.2, 0, -0.25, '-z', false);
  }

  // ============================================================================= la CGT, en Azopardo e Independencia
  { // Inaugurada el 18-10-1950 (cronología). La aérea de 1965 muestra un edificio en la esquina, de unos 40 m sobre
    // Azopardo, con un ala hacia el fondo. Pisos (planta baja y seis) y el cuerpo de la entrada: supuesto.
    const { T, L, W } = sitio('cgt'), t = c.CREMA;
    cuerpo(T, L, 26, 16, L / 2, 8, 7, t); cuerpo(T, 15, 26, W - 16, L - 7.5, 16 + (W - 16) / 2, 7, t);
    cuerpo(T, 13, 31, 17, L / 2, 8.5, 8, t); T.fila(3, L / 2 - 5, L / 2 + 5, 2.4, 5, 0, -0.05, '-z', false);
  }

  // ============================================================================== la Casa de Moneda nueva (1944)
  { // En el relleno de Retiro (autorizada en 1939, inaugurada el 27-12-1944). De la aérea de 1965: un cuerpo de frente
    // y tres alas paralelas detrás, girado como las calles del Puerto Nuevo. Cinco pisos: supuesto.
    const { T, L, W } = sitio('monedaNueva'), t = c.GRIS, H = 22;
    cuerpo(T, L, H, 16, L / 2, 9, 5, t); for (const x of [16, L / 2, L - 16]) cuerpo(T, 19, H - 4, W - 30, x, 17 + (W - 30) / 2, 4, t);
    cuerpo(T, 24, H + 5, 18, L / 2, 9, 6, t);
  }

  // ============================================================================= el Edificio Guardacostas (1945–1949)
  { // Sobre Eduardo Madero, proyectado para el Ministerio de Marina. De la aérea de 1965: una placa de unos 90 × 20 m
    // con un cuerpo bajo detrás, que acá no va: en el visor las vías del puerto pasan pegadas al fondo y lo pisaban.
    // Pisos (planta baja y ocho, y el cuerpo del medio dos más): supuesto.
    const { T, L } = sitio('guardacostas'), t = c.CREMA;
    cuerpo(T, L, 34, 20, L / 2, 11, 9, t); cuerpo(T, 24, 42, 23, L / 2, 12, 11, t);
  }

  // =========================================================== la Facultad de Ciencias Médicas, en la calle Paraguay
  { // La obra empezó el 3-3-1939 y la primera etapa se habilitó en 1944 (cronología; el edificio viejo, de 1895, sigue
    // enfrente). La manzana, de la aérea de 1965. Va el frente de Paraguay con la torre del medio y las dos alas; el
    // fondo, hacia Marcelo T. de Alvear, queda abierto: se habilitó por etapas y no se sabe cuáles. Pisos (siete el
    // basamento y diecisiete la torre): supuesto.
    const { T, L, W } = sitio('medicinaNueva'), t = c.CREMA, cx = L / 2;
    cuerpo(T, L, 30, 20, cx, 10, 7, t); for (const s of [-1, 1]) cuerpo(T, 20, 30, W * 0.55, cx + s * (L / 2 - 10), 20 + W * 0.275, 7, t);
    cuerpo(T, 58, 68, 22, cx, 24, 17, t); cuerpo(T, 30, 6, 16, cx, 24, 1, t, 68.7);
  }

  // =========================================================================== el Mercado San Cristóbal nuevo (1944)
  { // Del estudio SEPRA (cronología, seguridad media). La aérea de 1965 muestra una nave de unos 60 × 38 m con el techo
    // en fajas: van cinco bóvedas de hormigón sobre un cuerpo bajo. La forma de las bóvedas y las alturas: supuesto.
    const { T, L, W } = sitio('cristobal'), t = c.BLANCO;
    T.caja(L, 7.5, W, L / 2, 0, W / 2, CASA, { floors: 1, tono: t });
    for (let i = 0; i < 5; i++) T.tejado(L / 5 - 0.4, W, 4.2, (L * (i + 0.5)) / 5, 7.5, W / 2, 'z', PIEDRA, true);
    T.fila(5, 4, L - 4, 4, 4.6, 0, -0.05, '-z', false);
  }

  // ====================================================================== el Mercado del Plata: el solar y la obra
  { // El mercado de 1856 se demolió en 1947 y ese año empezó la obra del edificio nuevo, que se paró en 1954 con la
    // estructura de hormigón hecha y se inauguró en 1962 (cronología). En 1950: la valla y el esqueleto. Cuántos pisos
    // tenía levantados ese año (acá, tres): sin verificar.
    const { T, L, W } = sitio('plata');
    T.tapete(T.recto(L, W, L / 2, W / 2), PINTA.LONA, { y: 0.1, claro: 0.88 }); valla(T, L, W);
    esqueleto(T, L - 14, W - 12, L / 2, W / 2, 3, 10);
    T.piramide(2, 26, 8, 0, W / 2, TINTA, 4); T.put(new THREE.BoxGeometry(24, 0.5, 0.5).translate(17, 24.5, W / 2), TINTA); // la grúa
  }

  // ================================================================= el estadio de Huracán (Tomás A. Ducó, 1947–1949)
  { // En el mismo predio de la cancha de madera, que se usó hasta 1942 (src/lugares/barrios.js). Las tribunas se
    // empezaron en 1943, el primer partido fue el 7-9-1947 y la inauguración oficial, el 11-11-1949 (cronología). De la
    // aérea de 1965: un anillo de hormigón de unos 190 × 150 m, con las cabeceras curvas, y sobre Alcorta el edificio
    // de la sede, con su torre. Alturas de las tribunas y medidas de la sede y la torre: supuesto.
    const { T, L, W } = sitio('duco'), cx = L / 2, cz = W / 2 + 4, a = 60, b = 41, r = 30, hondo = 30, h0 = 1.6;
    const contorno = (a, b, r, n = 5) => {
      const Q = [], E = [[a - r, b - r, 0], [r - a, b - r, 90], [r - a, r - b, 180], [a - r, r - b, 270]];
      E.forEach(([cu, cv, g0], i) => {
        for (let k = 0; k <= n; k++) { const g = ((g0 + (90 * k) / n) * Math.PI) / 180; Q.push([cu + Math.cos(g) * r, cv + Math.sin(g) * r]); }
        const [nu, nv, ng] = E[(i + 1) % 4], g1 = (ng * Math.PI) / 180, A = Q[Q.length - 1], B = [nu + Math.cos(g1) * r, nv + Math.sin(g1) * r], m = Math.max(1, Math.round((i % 2 ? 2 * (b - r) : 2 * (a - r)) / 15));
        for (let k = 1; k < m; k++) Q.push([A[0] + ((B[0] - A[0]) * k) / m, A[1] + ((B[1] - A[1]) * k) / m]);
      });
      return Q;
    };
    T.tapete(T.recto(105, 68, cx, cz), PINTA.CESPED, { y: 0.1, claro: 0.78 });
    for (const [w, d, x, z] of [[105, 0.5, 0, -34], [105, 0.5, 0, 34], [0.5, 68, -52.5, 0], [0.5, 68, 52.5, 0], [0.5, 68, 0, 0], [0.5, 40, -36, 0], [0.5, 40, 36, 0], [16.5, 0.5, -44.25, -20], [16.5, 0.5, -44.25, 20], [16.5, 0.5, 44.25, -20], [16.5, 0.5, 44.25, 20]]) T.tapete(T.recto(w, d, cx + x, cz + z), PINTA.BLANCO, { y: 0.32, claro: 0.97 });
    for (const s of [-1, 1]) { for (const z of [-3.66, 3.66]) T.caja(0.14, 2.44, 0.14, cx + s * 52.5, 0, cz + z, PINTADO, BLANCO); T.caja(0.14, 0.14, 7.46, cx + s * 52.5, 2.44, cz, PINTADO, BLANCO); }
    const I = contorno(a, b, r).map(([u, v]) => [cx + u, cz + v]), O = contorno(a + hondo, b + hondo, r + hondo).map(([u, v]) => [cx + u, cz + v]), N = I.length, v = (q, y) => [q[0], y, q[1]];
    const G = [], M = [], Ry = [];
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N, alto = (q) => (Math.abs(q[1] - cz) > b + hondo * 0.6 ? 22 : 17), hi = alto(O[i]), hj = alto(O[j]); // (las plateas de los costados, más altas que las cabeceras)
      const f = (k, t) => [I[k][0] + (O[k][0] - I[k][0]) * t, I[k][1] + (O[k][1] - I[k][1]) * t];
      G.push([v(I[i], h0), v(I[j], h0), v(O[j], hj), v(O[i], hi)]); M.push([v(I[i], 0), v(I[j], 0), v(I[j], h0), v(I[i], h0)], [v(O[i], 0), v(O[j], 0), v(O[j], hj + 1), v(O[i], hi + 1)]);
      for (let k = 1; k < 6; k++) { const t = k / 6, yi = h0 + (hi - h0) * t + 0.08, yj = h0 + (hj - h0) * t + 0.08; Ry.push([v(f(i, t), yi), v(f(j, t), yj), v(f(j, t + 0.012), yj + 0.2), v(f(i, t + 0.012), yi + 0.2)]); }
    }
    paños(T, G, PINTADO, HORMIGON); paños(T, M, PIEDRA, { tono: c.GRIS }); paños(T, Ry, PINTADO, RAYA);
    // la sede, sobre Alcorta, y la torre
    const zs = cz - b - hondo - 5;
    cuerpo(T, 64, 15, 10, cx, zs, 4, c.CREMA); cuerpo(T, 9, 38, 9, cx, zs, 9, c.CREMA); T.cilindro(0.3, 12, cx, 38.7, zs, PINTADO, 6, 0.12, BLANCO);
  }

  // ======================================================= la Bombonera: la segunda bandeja de la cabecera norte (1941)
  { // El 16-11-1941 se estrenó la segunda bandeja del sector norte, que en la inauguración faltaba (cronología): la
    // herradura queda pareja. La tercera bandeja, de 1951–1953, no entra. Las mismas estaciones y alturas que el
    // estadio de src/lugares/modernos.js.
    const T = c.obra('bombonera', c.GRIS); c.epoca(c.etapaDe(1941));
    const planta = c.EDIFICIOS.bombonera.planta[0].slice(0, -1).map(([px, py]) => T.deMundo(px, py)), N = 48, NORTE = Math.round(N * 0.27);
    const repartir = (pts, n) => {
      const Lq = [0]; for (let i = 1; i < pts.length; i++) Lq.push(Lq[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      return Array.from({ length: n + 1 }, (_, k) => { const s = (k / n) * Lq[Lq.length - 1]; let i = 1; while (i < Lq.length - 1 && Lq[i] < s) i++; const t = (s - Lq[i - 1]) / (Lq[i] - Lq[i - 1] || 1); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]; });
    };
    const afuera = repartir(planta.slice(0, 25), N), adentro = repartir(planta.slice(25, 47).reverse(), N);
    const pt = (k, t, y) => [adentro[k][0] + (afuera[k][0] - adentro[k][0]) * t, y, adentro[k][1] + (afuera[k][1] - adentro[k][1]) * t];
    const gradas = [], muros = [], sombra = [], rayas = [];
    for (let k = 0; k < NORTE; k++) {
      gradas.push([pt(k, 0.4, 13.2), pt(k + 1, 0.4, 13.2), pt(k + 1, 1, 23.5), pt(k, 1, 23.5)]);
      muros.push([pt(k, 0.4, 12.1), pt(k + 1, 0.4, 12.1), pt(k + 1, 0.4, 14.1), pt(k, 0.4, 14.1)], [pt(k, 1, 0), pt(k + 1, 1, 0), pt(k + 1, 1, 24.5), pt(k, 1, 24.5)]);
      sombra.push([pt(k, 0.4, 12.1), pt(k + 1, 0.4, 12.1), pt(k + 1, 0.6, 12.4), pt(k, 0.6, 12.4)]);
      for (let i = 1; i < 7; i++) { const t = 0.4 + 0.6 * (i / 7), y = 13.2 + 10.3 * (i / 7) + 0.07; rayas.push([pt(k, t, y), pt(k + 1, t, y), pt(k + 1, t + 0.012, y + 0.2), pt(k, t + 0.012, y + 0.2)]); }
    }
    muros.push([pt(0, 0.4, 0), pt(0, 1, 0), pt(0, 1, 24.5), pt(0, 0.4, 13.2)]); // (la punta de la herradura)
    paños(T, gradas, PINTADO, HORMIGON); paños(T, muros, PIEDRA, { tono: c.GRIS }); paños(T, sombra, TINTA); paños(T, rayas, PINTADO, RAYA);
  }
  c.epoca(0);
}
