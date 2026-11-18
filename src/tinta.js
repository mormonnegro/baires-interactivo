// La tinta: cómo se dibuja todo. Hay un solo criterio, el del grabado: papel, tinta, y nada más.
//   - El suelo es el plano mismo. Los techos también: cada azotea lleva el pedazo de plano que tiene debajo, así que
//     vista desde arriba la ciudad levantada es idéntica al plano.
//   - Las paredes son papel en blanco; la sombra se dibuja con rayado, y las puertas y ventanas, con tinta llena.
//   - De las luces de three solo se usa cuánta luz llega a cada punto (y la sombra arrojada), nunca su color.
// Y un segundo criterio, que se prende aparte (uColor): la misma ciudad pintada. Las azoteas de baldosa colorada, las
// paredes encaladas, el follaje verde, las calles de tierra y el río color de león. Para pintar el suelo hace falta
// saber qué es cada punto: lo dice tSuelo (lo arma tools/hoy.mjs --suelo). Fuera de la guarda del plano sigue el papel.
import * as THREE from 'three';

export const SOL = new THREE.Vector3(0.52, 0.62, 0.5).normalize(); // desde el noreste, a media mañana (x = norte, z = este)
export const AMBIENTE = 0.34;

const COMUN = /* glsl */ `
  uniform sampler2D tMedio; uniform sampler2D tFino[4]; uniform vec4 uFino[4]; uniform float uFinoOn[4]; uniform float uMedioRes;
  uniform vec2 uHoja; uniform vec2 uPlaza; uniform float uMetro; uniform float uFront; uniform float uFlat;
  uniform vec3 uPaper; uniform vec3 uInk; uniform vec3 uSombra; uniform float uColor;
  // --- la línea de tiempo: la ciudad que crece y cambia (tools/crece.mjs). uEpocaK va de 0 (1867) a uEtapas (el último
  // plano), pasando por cada uno; tCrece dice de cada punto «desde cuándo»: R lo urbanizado y la tierra ganada al río,
  // G los fondos de las manzanas nuevas, B lo edificado (1 = la primera etapa, 1/uEtapas = la última, 0 = nunca).
  // tDespeje, con la misma cuenta, lo que se abrió: R lo demolido para una avenida o una plaza, G el verde nuevo y B
  // la calzada empedrada de las avenidas nuevas. ---
  uniform sampler2D tCrece; uniform sampler2D tDespeje; uniform float uEpocaK; uniform float uEtapas;
  /** El año que «ya llegó» a esa distancia de la plaza: cada etapa avanza como una ola que sale del centro. */
  float epocaEn(float dist) { float k = min(uEpocaK, uEtapas - 0.0001), e = floor(k); return e + clamp((k - e) * 1.5 - 0.5 * clamp(dist / 7000.0, 0.0, 1.0), 0.0, 1.0); }
  /** Cuánto se levantó una casa de la etapa et (cada una a su tiempo, según su semilla). */
  float nacido(float et, float seed, float dist) { return smoothstep(0.1 + 0.45 * seed, 0.45 + 0.45 * seed, epocaEn(dist) - (et - 1.0)); }
  float llego(float v, float k) { float u = (uEtapas + 0.5 - k) / uEtapas, m = 0.15 / uEtapas; return smoothstep(u - m, u + m, v); }
  /** Lo que se despejó hasta el año que se mira: x demolido (calle o plaza donde había manzana) · y verde nuevo. */
  vec2 despejado(vec2 uv, float dist) {
    if (uEpocaK <= 0.0) return vec2(0.0);
    float k = epocaEn(dist); vec2 c = texture(tDespeje, uv).rg;
    return vec2(llego(c.r, k), llego(c.g, k));
  }
  /** La calzada de las avenidas nuevas, hasta el año que se mira. */
  float calzadaEn(vec2 uv, float k) { return llego(texture(tDespeje, uv).b, k); }
  /** Lo que creció hasta el año que se mira, en un punto de la hoja: x urbanizado o ganado al río · y fondo · z edificado. */
  vec3 crecido(vec2 uv, float dist) {
    if (uEpocaK <= 0.0) return vec3(0.0);
    float k = epocaEn(dist); vec3 c = texture(tCrece, uv).rgb;
    return vec3(llego(c.r, k), llego(c.g, k), llego(c.b, k));
  }
  /** Cuánto se levantó lo que está a "dist" metros de la plaza: la ciudad sube como una ola que sale del centro. */
  float alzado(float dist, float seed) {
    // (con la distancia en negativo: lo que solo existe en color —los árboles y aljibes de los patios, src/patios.js—.
    // Crece al prenderse el color, cada uno a su tiempo, y con el color apagado no está.)
    if (dist < -9.0e4) return 1.0; // (el avión, src/modos.js: nunca se acuesta ni depende del color)
    // (con 20 000 por etapa sumados a la distancia: lo que nace o se va con los años —la línea de tiempo, src/epocas.js—.
    // El número es nace + 8 · muere: la etapa en que se levanta (0: está desde 1867) y la etapa en que se va (0: nunca).)
    float nace = 0.0, muere = 0.0;
    if (seed > 1.5) seed = fract(seed); // (los edificios con nombre llevan su tono en la parte entera, src/hitos.js)
    if (dist > 15000.0) { float et = floor(dist / 20000.0 + 0.01); dist -= et * 20000.0; muere = floor(et / 8.0 + 0.01); nace = et - 8.0 * muere; }
    float c = (nace > 0.5 ? nacido(nace, seed, dist) : 1.0) * (muere > 0.5 ? 1.0 - nacido(muere, seed, dist) : 1.0);
    if (dist < 0.0) { dist = -dist - 1.0; c = smoothstep(0.0, 1.0, uColor * 1.6 - seed * 0.6); }
    float t = clamp((uFront - dist - seed * 140.0) / 300.0, 0.0, 1.0), s = t - 1.0;
    return t <= 0.0 ? 0.0 : (1.0 + 2.2 * s * s * s + 1.2 * s * s) * c;
  }
  // --- el relieve: la barranca y las lomas (src/relieve.js). Acostado, el plano es una hoja lisa; el terreno se
  // hincha con la misma ola que levanta la ciudad. ---
  uniform sampler2D tRelieve; uniform float uRelieve;
  /** La altura del terreno en un punto del mundo, en metros. */
  float altura(vec2 xz) {
    if (uRelieve <= 0.0) return 0.0;
    float k = clamp((uFront - length(xz)) / 300.0, 0.0, 1.0);
    return texture(tRelieve, (xz / uMetro + uPlaza) / uHoja).r * uRelieve * k * k * (3.0 - 2.0 * k);
  }`;
const PLANO = /* glsl */ `
  /** El plano en un punto del mundo: 0 tinta, 1 papel. De cerca, los bordes de la tinta se afilan en vez de borronearse. */
  float tinta(vec2 xz) {
    vec2 px = xz / uMetro + uPlaza, uv = px / uHoja, dx = dFdx(px), dy = dFdy(px);
    // cuántos píxeles del escaneo entran en un píxel de pantalla
    float t = max(length(dx), length(dy));
    float g = textureGrad(tMedio, uv, dx / uHoja, dy / uHoja).r, res = uMedioRes;
    // de cerca, la tesela fina que toque (hay cuatro cargadas: las que rodean lo que se mira)
    if (t < uMedioRes) {
      float gf = g, hay = 0.0;
      #define FINO(i) { vec2 f = (uv - uFino[i].xy) / uFino[i].zw; if (uFinoOn[i] > 0.5 && f.x >= 0.0 && f.y >= 0.0 && f.x < 1.0 && f.y < 1.0) { gf = textureGrad(tFino[i], f, dx / (uHoja * uFino[i].zw), dy / (uHoja * uFino[i].zw)).r; hay = 1.0; } }
      FINO(0) FINO(1) FINO(2) FINO(3)
      hay *= 1.0 - smoothstep(0.7, 1.0, t / uMedioRes);
      g = mix(g, gf, hay); res = mix(uMedioRes, 1.0, hay);
    }
    t /= res;
    float a = clamp(t, 0.16, 1.0) * 0.5, s = smoothstep(0.52 - a, 0.52 + a, g);
    return mix(g, s, 0.8 * (1.0 - smoothstep(0.5, 1.1, t)));
  }
  // --- lo de hoy: el mapa actual, estampado en rojo sobre el plano ---
  uniform sampler2D tHoyCerca; uniform sampler2D tHoyLejos; uniform float uHoy; uniform float uHoyRes; uniform vec3 uRojo;
  float rayas(float v, float w) { return 1.0 - smoothstep(0.26 - w, 0.26 + w, abs(fract(v + 0.5) - 0.5) * 2.0); }
  /** Las calles, las vías y la costa de hoy en línea, y rayada la tierra que se le ganó al río. */
  vec3 hoy(vec3 col, vec2 xz) {
    vec2 px = xz / uMetro + uPlaza, uv = px / uHoja;
    if (uHoy <= 0.0 || uv.x <= 0.0 || uv.y <= 0.0 || uv.x >= 1.0 || uv.y >= 1.0) return col;
    vec2 dx = dFdx(px), dy = dFdy(px);
    float t = max(length(dx), length(dy)) / uHoyRes; // cuántos píxeles de la lámina de cerca entran en uno de pantalla
    // De lejos quedan las avenidas, las vías y la costa. Al acercarse entran todas las calles, con el borde afilado.
    // Y bien de cerca, cuando la línea ya sería una franja, queda solo su contorno: la calle de hoy, a dos trazos.
    float c = textureGrad(tHoyCerca, uv, dx / uHoja, dy / uHoja).r, a = clamp(t, 0.12, 1.0) * 0.5;
    float fina = mix(smoothstep(0.5 - a, 0.5 + a, c), c, smoothstep(0.7, 1.3, t));
    float orilla = 1.0 - smoothstep(0.7, 1.5, abs(c - 0.5) / max(length(vec2(dFdx(c), dFdy(c))), 1.0e-4));
    fina = mix(fina, max(orilla, fina * 0.16), 1.0 - smoothstep(0.2, 0.5, t));
    vec3 L = textureGrad(tHoyLejos, uv, dx / uHoja, dy / uHoja).rgb;
    float lejos = smoothstep(1.7, 3.2, t), linea = mix(fina, max(L.r, fina * 0.3), lejos);
    // la tierra ganada al río: un rayado que guarda su paso en la pantalla (cada nivel dobla el anterior)
    float g = smoothstep(0.35, 0.65, L.g);
    if (g > 0.0) {
      float m = t * uHoyRes * uMetro, n = log2(max(m, 0.01) * 13.0), n0 = floor(n), p = exp2(n0), d = (xz.x + xz.y) * 0.7071;
      float w = clamp(m / p * 1.5, 0.02, 0.5);
      float r = mix(rayas(d / p, w), rayas(d / (p * 2.0), w * 0.5), smoothstep(0.35, 1.0, n - n0));
      col = mix(col, uRojo, uHoy * g * (0.08 + 0.34 * r));
    }
    return mix(col, uRojo, uHoy * linea * 0.9);
  }
  float h11(float n) { return fract(sin(n * 127.1) * 43758.5453); }
  float h31(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
  float n3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h31(i), h31(i + vec3(1, 0, 0)), f.x), mix(h31(i + vec3(0, 1, 0)), h31(i + vec3(1, 1, 0)), f.x), f.y), mix(mix(h31(i + vec3(0, 0, 1)), h31(i + vec3(1, 0, 1)), f.x), mix(h31(i + vec3(0, 1, 1)), h31(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
  // --- en color ---
  uniform sampler2D tSuelo; uniform sampler2D tCalles; uniform vec4 uMarco; uniform float uMatas;
  /** Lo mismo que llego(), para la lámina de las calles (tools/crece.mjs), que cuenta desde 1867: la etapa e vale (7 − e)/7. */
  float llego7(float v, float k) { float u = (6.5 - k) / 7.0; return smoothstep(u - 0.02, u + 0.02, v); }
  /** Cuánto color lleva un punto: todo adentro de la guarda del plano, nada afuera (ahí sigue el papel). */
  float enColor(vec2 xz) {
    if (uColor <= 0.0) return 0.0;
    vec2 uv = (xz / uMetro + uPlaza) / uHoja, a = smoothstep(uMarco.xy - 0.0015, uMarco.xy + 0.0015, uv) * (1.0 - smoothstep(uMarco.zw - 0.0015, uMarco.zw + 0.0015, uv));
    return uColor * a.x * a.y;
  }
  /** La luz, en color: tibia al sol, azulada a la sombra. */
  vec3 luzColor(float luz) { return mix(vec3(0.5, 0.53, 0.64), vec3(1.07, 1.01, 0.9), smoothstep(0.3, 0.95, luz)); }
  /** El suelo pintado. papel: el plano en ese punto (su tinta queda como un dibujo tenue debajo del color). */
  vec3 sueloColor(vec2 xz, float papel) {
    vec2 uv = (xz / uMetro + uPlaza) / uHoja;
    vec3 s = texture(tSuelo, uv).rgb, lejos = textureLod(tSuelo, uv, 5.0).rgb, zona = textureLod(tSuelo, uv, 7.0).rgb; // R río · G patio · B edificado
    // con los años: el río retrocede donde se le ganó tierra, y aparecen las manzanas nuevas con sus calles
    float urb = 0.0, verde = 0.0, calz = 0.0, vereda = 0.0;
    if (uEpocaK > 0.0) {
      float d = length(xz); vec3 c = crecido(uv, d); vec2 des = despejado(uv, d);
      urb = llego(textureLod(tCrece, uv, 3.0).r, epocaEn(d)); s.r *= 1.0 - c.x; lejos.r *= 1.0 - llego(textureLod(tCrece, uv, 4.0).r, epocaEn(d));
      // (y donde se abrió una avenida o una plaza, ni casas ni fondos: la calle)
      s.g = max(s.g, c.y) * (1.0 - des.x); s.b = max(s.b, c.z) * (1.0 - des.x); verde = des.y;
      // la calzada de las avenidas nuevas y, a cada lado (lo despejado a menos de unos metros de ella), la vereda
      float ke = epocaEn(d); calz = calzadaEn(uv, ke);
      // (hasta unos 8 m de la calzada, haya o no casas atrás: lo que quede debajo de un edificio no se ve)
      { vec2 o = vec2(5.0 / uMetro) / uHoja, p = o * 1.3; vereda = max(max(max(calzadaEn(uv + vec2(o.x, 0.0), ke), calzadaEn(uv - vec2(o.x, 0.0), ke)), max(calzadaEn(uv + vec2(0.0, o.y), ke), calzadaEn(uv - vec2(0.0, o.y), ke))), max(max(calzadaEn(uv + p, ke), calzadaEn(uv - p, ke)), max(calzadaEn(uv + vec2(p.x, -p.y), ke), calzadaEn(uv + vec2(-p.x, p.y), ke)))) * (1.0 - calz) * (1.0 - verde); }
    }
    float n = n3(vec3(xz * 0.045, 1.0)) * 0.6 + n3(vec3(xz * 0.3, 2.0)) * 0.4, nf = n3(vec3(xz * 1.9, 3.0));
    // en la ciudad, tierra apisonada; en las afueras (donde casi no hay nada edificado alrededor), pasto
    vec3 tierra = mix(vec3(0.6, 0.5, 0.375), vec3(0.75, 0.655, 0.5), n) * (0.94 + 0.12 * nf);
    vec3 pasto = mix(vec3(0.36, 0.43, 0.2), vec3(0.6, 0.57, 0.31), n) * (0.9 + 0.2 * nf);
    vec3 col = mix(pasto, tierra, max(urb, max(smoothstep(0.03, 0.2, zona.g + zona.b), smoothstep(0.02, 0.25, zona.r))));
    // los patios y los fondos: tierra más oscura con manchones de pasto ralo. Los árboles son de verdad (src/patios.js)
    // hasta uMatas metros de la cámara; más lejos, y donde la ciudad todavía no se levantó, van pintados: unas matas
    float mata = smoothstep(0.5, 0.62, n3(vec3(xz * 0.15, 5.0)) * 0.6 + n3(vec3(xz * 0.42, 6.0)) * 0.4);
    if (uMatas > 0.0) mata *= max(smoothstep(uMatas - 900.0, uMatas + 100.0, distance(cameraPosition, vec3(xz.x, 0.0, xz.y))), 1.0 - clamp((uFront - length(xz)) / 300.0, 0.0, 1.0));
    vec3 fondo = mix(vec3(0.55, 0.46, 0.32), vec3(0.63, 0.54, 0.38), n3(vec3(xz * 0.07, 4.0))) * (0.88 + 0.2 * nf);
    fondo = mix(fondo, mix(vec3(0.4, 0.44, 0.2), vec3(0.5, 0.52, 0.26), nf), 0.5 * smoothstep(0.5, 0.78, n3(vec3(xz * 0.11, 8.0)) * 0.65 + n3(vec3(xz * 0.5, 9.0)) * 0.35));
    fondo = mix(fondo, mix(vec3(0.17, 0.25, 0.11), vec3(0.3, 0.38, 0.16), nf), mata);
    float patio = smoothstep(0.3, 0.7, s.g);
    col = mix(col, fondo, patio * 0.92);
    // lo edificado, mientras está acostado: el color de las azoteas
    col = mix(col, vec3(0.66, 0.43, 0.33) * (0.9 + 0.2 * n), smoothstep(0.4, 0.7, s.b));
    // las calles (tCalles: R desde cuándo tienen piedra, G desde cuándo son lisas, B cuánto del punto es calle). En
    // 1867, el empedrado bruto del centro —piedra despareja, con barro en las juntas—; después el adoquín de granito;
    // las lisas, de madera hasta el Centenario y de asfalto después. Lo que todavía no se pavimentó sigue de tierra.
    // Pegado a las casas (donde B baja) va la vereda: de ladrillo y piedra primero, de baldosa clara después.
    vec3 cs = texture(tCalles, uv).rgb;
    float k7 = uEpocaK > 0.0 ? epocaEn(length(xz)) : 0.0, lejosC = clamp(length(fwidth(xz)) / 7.0 - 0.35, 0.0, 1.0);
    float sup = mix(smoothstep(0.28, 0.58, cs.b), cs.b, lejosC), lisoC = llego7(cs.g, k7), pav = max(llego7(cs.r, k7), lisoC) * sup;
    float nb = n3(vec3(xz * 1.25, 11.0));
    vec3 bruto = mix(vec3(0.47, 0.42, 0.35), vec3(0.67, 0.62, 0.53), nb) * (0.92 + 0.16 * n);
    vec3 adoquin = mix(vec3(0.47, 0.45, 0.42), vec3(0.58, 0.55, 0.5), n) * (0.9 + 0.2 * nf);
    vec3 lisoCol = mix(vec3(0.4, 0.34, 0.28), vec3(0.33, 0.33, 0.34), smoothstep(3.6, 5.0, k7)) * (0.92 + 0.14 * n) * (0.97 + 0.06 * nf);
    vec3 calzCol = mix(mix(bruto, adoquin, smoothstep(0.25, 1.0, k7)), lisoCol, lisoC);
    vec3 veredaCol = mix(vec3(0.71, 0.61, 0.5), vec3(0.8, 0.775, 0.71), smoothstep(0.25, 1.0, k7)) * (0.94 + 0.1 * nf);
    float cordon = (1.0 - smoothstep(0.6, 0.86, cs.b)) * (1.0 - lejosC);
    col = mix(col, mix(calzCol, veredaCol, cordon * 0.9), pav * 0.94 * (1.0 - smoothstep(0.4, 0.7, s.b)) * (1.0 - patio * 0.8));
    // las veredas anchas de las avenidas nuevas
    col = mix(col, veredaCol, vereda * (1.0 - pav) * 0.95);
    // el césped de las plazas y los parques nuevos
    col = mix(col, mix(mix(vec3(0.34, 0.41, 0.19), vec3(0.5, 0.52, 0.27), n), vec3(0.22, 0.3, 0.13), mata * 0.55) * (0.92 + 0.16 * nf), verde * 0.92);
    col *= mix(mix(0.74, 0.93, patio), 1.0, papel);
    // el río: barro en suspensión, con el oleaje apenas; y la playa mojada en la orilla
    float ola = n3(vec3(xz.x * 0.018, xz.y * 0.07, 7.0)) * 0.65 + n3(vec3(xz.x * 0.09, xz.y * 0.33, 9.0)) * 0.35;
    // (el río es marrón, pero menos que la tierra: algo más gris y frío, para que el agua se lea como agua)
    vec3 agua = mix(vec3(0.37, 0.35, 0.3), vec3(0.57, 0.54, 0.46), ola) * mix(0.93, 1.0, papel);
    agua = mix(agua, vec3(0.64, 0.63, 0.57), 0.3 * smoothstep(0.5, 0.95, n3(vec3(xz.x * 0.05, xz.y * 0.21, 13.0)) * 0.6 + n3(vec3(xz.x * 0.17, xz.y * 0.6, 14.0)) * 0.4) * smoothstep(0.35, 0.8, ola));
    // (la playa es de la costa natural: donde la tierra se le ganó al río hay murallón, no playa)
    col = mix(col, vec3(0.52, 0.45, 0.35), smoothstep(0.1, 0.5, lejos.r) * (1.0 - smoothstep(0.4, 0.6, s.r)) * 0.55 * (1.0 - urb));
    col = mix(col, agua, smoothstep(0.35, 0.65, s.r));
    // el murallón de los diques y de la costa nueva: el borde de piedra, oscuro, entre el muelle y el agua
    float muralla = smoothstep(0.1, 0.38, s.r) * (1.0 - smoothstep(0.62, 0.9, s.r)) * smoothstep(0.2, 0.55, urb);
    return mix(col, vec3(0.31, 0.29, 0.26), muralla * 0.8);
  }`;

/** `fijo`: los datos de cada casa (semilla, pisos, medidas del muro) pasan al sombreador de los puntos sin interpolar
 *  (`flat`). Interpolados son iguales en toda la pared salvo por un error ínfimo que algunas placas de teléfono sí
 *  cometen, y que las cuentas con la semilla agrandan millones de veces: las paredes titilan al moverse. Pero `flat`
 *  solo sale gratis si el navegador deja elegir de qué vértice se toma el dato (WEBGL_provoking_vertex, src/main.js):
 *  sin eso, en Metal y Direct3D reacomoda todos los triángulos por procesador y la página se arrastra. */
export function createTinta({ fijo = false } = {}) {
  const FIJO = fijo ? 'flat ' : '';
  const U = {
    tMedio: { value: null }, tFino: { value: [null, null, null, null] }, uFino: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, 1, 1)) }, uFinoOn: { value: [0, 0, 0, 0] }, uMedioRes: { value: 9 },
    uHoja: { value: new THREE.Vector2(1, 1) }, uPlaza: { value: new THREE.Vector2() }, uMetro: { value: 0.675 }, uFront: { value: -1000 },
    tCrece: { value: null }, tDespeje: { value: null }, uEpocaK: { value: 0 }, uEtapas: { value: 3 }, tHoyCerca: { value: null }, tHoyLejos: { value: null }, uHoy: { value: 0 }, uHoyRes: { value: 2.31 }, uRojo: { value: new THREE.Color().setRGB(0.66, 0.17, 0.1, THREE.LinearSRGBColorSpace) },
    tRelieve: { value: null }, uRelieve: { value: 0 }, tSuelo: { value: null }, tCalles: { value: null }, uColor: { value: 0 }, uMatas: { value: 0 }, uMarco: { value: new THREE.Vector4(0, 0, 1, 1) },
    uFlat: { value: SOL.y + AMBIENTE }, uPaper: { value: new THREE.Color(0xf7eedb) }, uInk: { value: new THREE.Color(0x2e2620) }, uSombra: { value: new THREE.Color(0.6, 0.57, 0.6) },
    // el velo claro sobre el edificio que se puede tocar (src/ficha.js): x, z de su marca, el radio y cuánto (0: nada).
    // Y a qué le toca (uSobreQue): x, las piezas con nombre (0: las que estén a menos del radio; 1: solo las del
    // edificio de la marca, las que tengan su ancla a menos del «radio»; 2: ninguna); y, lo que va a ras del suelo;
    // z, el suelo; w, las casas sin nombre. Sale de quién hay junto a la marca: junto(), en src/hitos.js.
    uSobre: { value: new THREE.Vector4(0, 0, 1, 0) }, uSobreQue: { value: new THREE.Vector4(0, 0, 0, 0) },
  };
  const vertex = (shader) => {
    Object.assign(shader.uniforms, U);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nattribute vec4 aInfo; attribute vec4 aWall; attribute vec3 aAncla; attribute float aEstilo; ${FIJO}varying vec4 vInfo; varying vec3 vWorld; varying vec4 vWall; ${FIJO}varying vec2 vMuro; varying float vRise; varying vec3 vAncla;\n${COMUN}`)
      .replace('#include <begin_vertex>', /* glsl */ `#include <begin_vertex>
          vAncla = aAncla;
        vRise = alzado(aInfo.w, aInfo.x);
        #ifdef USE_INSTANCING
          // (los árboles de 1867 que quedan bajo una casa nueva o en medio de una calle nueva se van; los de los fondos, no.
          // Y con ellos lo de los patios, que lleva la distancia en negativo: los aljibes también)
          if (uEpocaK > 0.0 && ((aInfo.y > 49.5 && aInfo.y < 50.5) || (aInfo.w < -0.5 && aInfo.w > -9.0e4))) { vec2 o = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xz; vec2 ouv = (o / uMetro + uPlaza) / uHoja; vec3 c = crecido(ouv, length(o)); vRise *= 1.0 - max(max(c.z, c.x * (1.0 - c.y)), despejado(ouv, length(o)).x); }
        #endif
        transformed.y *= vRise; vInfo = vec4(aInfo.xyz, aEstilo); // (el estilo viaja en el cuarto lugar, que del otro lado no se usa: así no se suma un dato más entre los dos sombreadores)
        // (lo que todavía no se levantó no existe: acostado, el plano es solo el plano)
        if (vRise <= 0.0 && (aInfo.y < 39.5 || aInfo.y > 49.5)) transformed = vec3(0.0, -1.0e4, 0.0);
        vWall = aWall; vMuro = aWall.zw;
        { vec4 wp = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            wp = instanceMatrix * wp;
          #endif
          vWorld = (modelMatrix * wp).xyz;
          // todo se apoya en el terreno (salvo lo que vuela: SIN_RELIEVE)
          #ifndef SIN_RELIEVE
            // (los edificios hechos a mano suben enteros, a la altura de su ancla —src/hitos.js—: si cada punto se apoyara
            // por su cuenta, en la cuesta quedarían con el techo inclinado. Sin ancla el atributo vale cero.)
            // (y su pie baja hasta el suelo donde el terreno queda más abajo que el ancla, para que no floten)
            float suelo = altura(vWorld.xz), sy = 1.0;
            if (aAncla.z > 0.5) { float sa = altura(aAncla.xy); suelo = position.y < 0.05 ? min(suelo, sa) : sa; }
            #ifdef USE_INSTANCING
              sy = length(instanceMatrix[1].xyz);
            #endif
            transformed.y += suelo / max(sy, 1.0e-4); vWorld.y += suelo;
          #endif
        }`);
  };
  /** kind (en aInfo.y / 10): 0 pared a la calle · 1 pared a un patio · 2 medianera · 3 techo · 4 suelo · 5 árbol · 6 piedra · 7 tinta llena (vanos) · 8 pizarra
   *  · 9 pintado (el tren, src/tren.js, y las plazas y el puerto, src/hitos.js): en aWall.z, de qué color va pintado (0 madera · 1 verde · 2 bronce · 3 rojo · 4 ocre · 5 lona · 6 el balasto de las vías · 7 césped · 8 agua · 9 baldosa · 10 granza · 11 adoquín · 12 flores · 13 asfalto · 14 chapa · 15 negro · 16 blanco · 17 ladrillo · 18 bronce patinado · 19 cobre con cardenillo: PINTA en src/hitos.js); en aWall.w, qué tan claro sale en tinta (0 tinta, 1 papel) */
  /** `manto`: qué es para el velo de lo que se puede tocar (uSobre): 1, las piezas con nombre de src/hitos.js; 2, lo que
   *  va a ras del suelo; 3, las casas sin nombre de src/ciudad.js; 0, lo que nunca se aclara. */
  const make = ({ manto = 0, ...extra } = {}) => {
    const m = new THREE.MeshLambertMaterial({ color: 0xffffff, ...extra });
    m.onBeforeCompile = (shader) => {
      vertex(shader); shader.uniforms.uManto = { value: manto };
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${FIJO}varying vec4 vInfo; varying vec3 vWorld; varying vec4 vWall; ${FIJO}varying vec2 vMuro; varying float vRise; varying vec3 vAncla; uniform vec4 uSobre; uniform vec4 uSobreQue; uniform float uManto;\n${COMUN}\n${PLANO}`)
        .replace('#include <opaque_fragment>', /* glsl */ `
          // (pisos: de 1 a 9; con 0, los que entren en la altura a 3,3 m cada uno —las torres, src/hitos.js—)
          float kind = floor(vInfo.y / 10.0 + 0.01), floors = vInfo.y - kind * 10.0, seed = vInfo.x;
          floors = floors < 0.5 ? max(1.0, floor((vInfo.z - 0.8) / 3.3 + 0.5)) : floors;
          float luz = dot(reflectedLight.directDiffuse + reflectedLight.indirectDiffuse, vec3(0.3333)) / uFlat;
          float kc = enColor(vWorld.xz);
          // (el estilo de las casas sin nombre, src/ciudad.js: 0 colonial · 1 italianizante · 2 francesa · 3 de comercio ·
          // 4 racionalista · 5 galpón · 6 casilla de chapa · 7 de las orillas · 8 rancho. Lo demás va siempre con 0.)
          float est = uManto > 2.5 ? floor(vInfo.w + 0.5) : 0.0;
          vec3 col;
          if (kind > 2.5 && kind < 4.5) {
            // techo o suelo: el plano, y encima la sombra
            if (kind > 3.5 && uRelieve > 0.0) {
              // la cuesta: el suelo que mira al sol se aclara y el que le da la espalda se apaga (si no, desde arriba
              // la barranca no se vería)
              const float E = 24.0;
              vec2 g = vec2(altura(vWorld.xz + vec2(E, 0.0)) - altura(vWorld.xz - vec2(E, 0.0)), altura(vWorld.xz + vec2(0.0, E)) - altura(vWorld.xz - vec2(0.0, E))) / (2.0 * E);
              luz *= clamp(1.0 + 2.2 * (dot(normalize(vec3(-g.x, 1.0, -g.y)), vec3(0.5466, 0.6517, 0.5256)) / 0.6517 - 1.0), 0.45, 1.35);
            }
            float papel = tinta(vWorld.xz);
            if (uEpocaK > 0.0) {
              // lo que creció, en tinta: el dibujo de 1867 se borra donde ahora hay ciudad (o tierra ganada al río),
              // los fondos de las manzanas nuevas van con el gris del rayado simple y lo edificado con el del cruzado
              // (y donde se demolió para abrir una avenida o una plaza queda el papel en blanco; el verde nuevo, un gris suave)
              vec2 huv = (vWorld.xz / uMetro + uPlaza) / uHoja;
              vec3 cre = crecido(huv, length(vWorld.xz)); vec2 des = despejado(huv, length(vWorld.xz));
              papel = mix(papel, 1.0, max(cre.x * 0.93, des.x)); papel = mix(papel, 0.8, cre.y * 0.9 * (1.0 - des.x)); papel = mix(papel, 0.5, cre.z * (1.0 - des.x)); papel = mix(papel, 0.86, des.y * 0.85);
            }
            float papelPlano = papel;
            if (kind < 3.5) {
              // muy de cerca el rayado del escaneo se vuelve una mancha: en las azoteas se lo cambia por el mismo
              // rayado cruzado, vuelto a trazar con líneas limpias
              vec2 d = vWorld.xz * 0.7071 / 2.1, r = vec2(d.x + d.y, d.x - d.y), rw = fwidth(r);
              vec2 l = smoothstep(0.42 - rw, 0.42 + rw, abs(fract(r) - 0.5) * 2.0);
              float cerca = 1.0 - smoothstep(0.22, 0.5, length(fwidth(vWorld.xz)) / uMetro * 0.7071);
              papel = mix(papel, mix((1.0 - l.x) * (1.0 - l.y), 0.2, clamp(max(rw.x, rw.y) * 1.2 - 0.2, 0.0, 1.0)), cerca * vRise);
            }
            col = mix(uInk, uPaper, papel);
            col *= mix(uSombra, vec3(1.0), smoothstep(0.42, 0.94, luz));
            float pretil = 0.0, borde = 0.0, aw = 0.0, falda = 0.0, cumbre = 0.0, alLargo = 0.0, alTraves = 0.0;
            // (a dos aguas: los galpones, las casillas, las casas de las orillas y los ranchos; con mansarda: las francesas)
            bool aguas = est > 4.5, mansarda = est > 1.5 && est < 2.5 && floors > 1.5;
            if (kind < 3.5) {
              // la azotea: cada casa un poco distinta de la de al lado, y el pretil alrededor
              col = mix(col, uPaper, (0.2 + 0.22 * h11(seed * 9.1)) * vRise);
              borde = min(min(vWall.x, vMuro.x - vWall.x), min(vWall.y, vMuro.y - vWall.y)); aw = fwidth(borde);
              if (aguas) {
                // el techo a dos aguas, dibujado: la cumbrera por el medio, a lo largo, y una falda más oscura que la otra
                bool lx = vMuro.x >= vMuro.y; alLargo = lx ? vWall.x : vWall.y; alTraves = lx ? vWall.y : vWall.x;
                float s = alTraves / max(lx ? vMuro.y : vMuro.x, 0.1), sw = fwidth(s);
                falda = smoothstep(0.5 - sw, 0.5 + sw, s); cumbre = 1.0 - smoothstep(sw * 0.6, sw * 1.8 + 0.004, abs(s - 0.5));
                col = mix(col, uInk, cumbre * 0.4 * vRise * clamp(1.5 - aw * 1.2, 0.0, 1.0)); // (las dos faldas son de verdad, src/ciudad.js: la luz ya las distingue)
              } else if (mansarda) {
                // la mansarda: el faldón de pizarra todo alrededor y, arriba, el techo de zinc
                pretil = 0.0; // (los faldones de pizarra son de verdad, src/ciudad.js: acá queda el techo de zinc de arriba)
              } else {
                pretil = (1.0 - smoothstep(0.42 - aw, 0.42 + aw, borde)) * 0.9 * vRise * clamp(1.6 - aw * 1.3, 0.0, 1.0);
                col = mix(col, uPaper * 0.97, pretil);
              }
            }
            if (kc > 0.0) {
              vec3 c2 = sueloColor(vWorld.xz, papelPlano);
              if (kind < 3.5) {
                // la azotea de baldosa colorada, más o menos gastada; algunas, blanqueadas con cal
                vec3 teja = mix(vec3(0.58, 0.33, 0.25), vec3(0.74, 0.53, 0.42), h11(seed * 9.1));
                teja = mix(teja, vec3(0.72, 0.67, 0.58), seed > 1.5 ? 1.0 : step(0.84, h11(seed * 3.7)));
                // (los edificios de varios pisos no tienen azotea de baldosa: cemento, o la membrana oscura)
                if (floors > 3.5 && seed <= 1.5) teja = mix(mix(vec3(0.69, 0.67, 0.62), vec3(0.58, 0.57, 0.55), h11(seed * 5.3)), vec3(0.4, 0.39, 0.38), step(0.8, h11(seed * 7.9)));
                if (est > 3.5 && est < 4.5) {
                  // la terraza de los años treinta: cemento, y la casilla del tanque y del ascensor con su sombra
                  teja = mix(vec3(0.71, 0.69, 0.64), vec3(0.6, 0.59, 0.57), h11(seed * 5.3));
                  if (min(vMuro.x, vMuro.y) > 7.0 && floors < 4.5) { // (las de cinco pisos o más la llevan de verdad, src/ciudad.js)
                    vec2 cq = vMuro * (0.5 + 0.3 * (vec2(h11(seed * 2.1), h11(seed * 2.7)) - 0.5)), dq = abs(vWall.xy - cq) - vec2(1.5, 2.0), ds = abs(vWall.xy - cq - vec2(0.9, 0.7)) - vec2(1.5, 2.0);
                    teja = mix(teja, teja * 0.6, 1.0 - smoothstep(0.0, aw + 0.05, max(ds.x, ds.y)));
                    teja = mix(teja, vec3(0.84, 0.82, 0.77), 1.0 - smoothstep(0.0, aw + 0.05, max(dq.x, dq.y)));
                  }
                }
                teja *= 0.88 + 0.24 * n3(vec3(vWorld.xz * 0.55, seed * 17.0));
                teja = mix(teja, vec3(0.93, 0.9, 0.83), pretil);
                if (aguas) {
                  // chapa de zinc (nueva, gris; vieja, con óxido), teja francesa o paja
                  float rt = h11(seed * 4.3), lw = fwidth(alLargo), tw = fwidth(alTraves);
                  if (est > 7.5) teja = mix(vec3(0.6, 0.5, 0.3), vec3(0.72, 0.62, 0.4), n3(vec3(vWorld.xz * 1.7, seed * 9.0)));
                  else if (est > 6.5 && rt > 0.55) teja = mix(vec3(0.66, 0.36, 0.24), vec3(0.76, 0.45, 0.3), h11(seed * 9.1)) * (1.0 - 0.16 * (1.0 - smoothstep(0.15 - tw, 0.15 + tw, abs(fract(alTraves / 0.42) - 0.5) * 2.0)) * clamp(1.0 / (tw * 4.0 + 0.5) - 0.3, 0.0, 1.0));
                  else teja = mix(mix(vec3(0.7, 0.72, 0.72), vec3(0.6, 0.62, 0.63), h11(seed * 9.1)), vec3(0.58, 0.4, 0.3), step(0.62, rt) * (0.35 + 0.5 * n3(vec3(vWorld.xz * 0.4, seed * 5.0)))) * (1.0 - 0.1 * (1.0 - smoothstep(0.3 - lw * 2.0, 0.3 + lw * 2.0, abs(fract(alLargo / 0.8) - 0.5) * 2.0)) * clamp(1.0 / (lw * 2.5 + 0.5) - 0.3, 0.0, 1.0));
                  teja = mix(teja, teja * 0.62, cumbre);
                } else if (mansarda) {
                  float zw = fwidth(vWall.x);
                  vec3 zinc = vec3(0.63, 0.65, 0.66) * (1.0 - 0.1 * (1.0 - smoothstep(0.1 - zw, 0.1 + zw, abs(fract(vWall.x / 0.9) - 0.5) * 2.0)) * clamp(1.0 / (zw * 2.5 + 0.5) - 0.3, 0.0, 1.0));
                  teja = zinc;
                }
                c2 = mix(c2, teja, smoothstep(0.0, 0.3, vRise));
              }
              col = mix(col, c2 * luzColor(luz), kc);
            }
            col = hoy(col, vWorld.xz);
          } else if (kind > 4.5 && kind < 5.5) {
            // árbol: follaje en tres tonos (sombra, media tinta y luz), con el borde de cada mancha movido como a mano
            float k = smoothstep(0.2, 1.0, luz);
            vec3 q = vWorld * vec3(0.8, 1.1, 0.8) + seed * 31.0;
            float tono = k * 0.74 + (n3(q) * 0.6 + n3(q * 2.7) * 0.4) * 0.42;
            float banda = smoothstep(0.31, 0.36, tono) * 0.5 + smoothstep(0.6, 0.65, tono) * 0.5;
            col = mix(mix(uInk, uPaper, 0.1), mix(uInk, uPaper, 0.76), banda);
            if (kc > 0.0) {
              vec3 hoja = mix(vec3(0.13, 0.2, 0.09), mix(vec3(0.36, 0.46, 0.17), vec3(0.47, 0.5, 0.2), h11(seed * 5.7)), smoothstep(0.22, 0.78, tono));
              col = mix(col, hoja * mix(vec3(0.8, 0.86, 1.0), vec3(1.05, 1.0, 0.9), k), kc);
            }
          } else {
            float H = vInfo.z, x = vWall.x, y = vWall.y;
            float k = smoothstep(0.3, 0.92, luz);
            col = uPaper * mix(0.7, 1.045, k);
            // la sombra propia, rayada como en el grabado
            float hv = (x + y * 1.4) / 0.42, hw = fwidth(hv), hl = abs(fract(hv) - 0.5) * 2.0;
            float raya = mix(0.5, 1.0 - smoothstep(0.42 - hw, 0.42 + hw, hl), clamp(1.0 / (hw + 0.6) - 0.35, 0.0, 1.0));
            col = mix(col, uInk, raya * (1.0 - k) * 0.34);
            if (kind > 8.5) {
              // pintado (el tren): un tono parejo, tan claro como diga vMuro.y, con la misma sombra rayada
              col = mix(uInk, uPaper, vMuro.y) * mix(0.62, 1.05, k);
              col = mix(col, uInk, raya * (1.0 - k) * 0.3);
            } else if (kind > 7.5) {
              // pizarra, tejas, cúpulas: un tono medio con las hiladas marcadas
              float tv = vWorld.y / 0.7, tw = fwidth(tv), tl = abs(fract(tv) - 0.5) * 2.0;
              col = mix(uInk, uPaper, 0.5) * mix(0.66, 1.08, k);
              col = mix(col, uInk, (1.0 - smoothstep(0.2 - tw, 0.2 + tw, tl)) * 0.3 * clamp(1.0 / (tw + 0.5) - 0.4, 0.0, 1.0));
            } else if (kind > 6.5) col = uInk * 1.12;
            float hueco = 0.0, corn = 0.0;
            // (lo que cada estilo le agrega a la fachada: molduras claras, juntas y sombras, hierro de balcones, pizarra
            // de mansarda, toldos y letreros; y si el vano es de vidrio o de postigos)
            float claro = 0.0, junta = 0.0, hierro = 0.0, mans = 0.0, toldo = 0.0, lista = 0.0, letrero = 0.0, letra = 0.0, vidrio = 0.0, pb = 0.0, aviso = 0.0, avisoL = 0.0;
            if (kind < 5.5) {
              float e1 = h11(seed * 13.7), ay = fwidth(y), calle = step(kind, 0.5);
              // las medidas del estilo: el pretil, el ancho del paño, el medio ancho del vano, el alféizar, el dintel,
              // cuántos paños de la planta baja son puerta y cuántos quedan ciegos
              float pret = min(0.8, H * 0.14), bw = 2.7 + 0.9 * e1, medio = 0.165, alf = 0.95, dint = 3.25, pp = 0.34, ciego = 0.1, mp = 0.2, dp = 3.0;
              if (est > 0.5) {
                if (est < 1.5) { pret = min(1.1, H * 0.17); bw = 2.5 + 0.6 * e1; medio = 0.175; alf = 0.8; dint = 3.45; }
                else if (est < 2.5) { pret = 0.35; bw = 2.3 + 0.5 * e1; medio = 0.19; alf = 0.5; dint = 3.2; pp = 0.2; ciego = 0.04; }
                else if (est < 3.5) { bw = 3.2 + 0.8 * e1; medio = 0.2; alf = 0.9; dint = 3.1; ciego = 0.05; }
                else if (est < 4.5) { pret = min(1.0, H * 0.12); bw = 3.3 + 0.9 * e1; medio = 0.33; alf = 1.0; dint = 2.45; pp = 0.25; ciego = 0.0; }
                else if (est < 5.5) { pret = 0.25; bw = 5.2 + 1.6 * e1; medio = 0.13; alf = 2.5; dint = 3.7; pp = 0.3; ciego = 0.25; mp = 0.34; dp = 3.9; }
                else if (est < 6.5) { pret = 0.0; bw = 2.6 + 0.7 * e1; medio = 0.15; alf = 1.0; dint = 2.4; ciego = 0.3; dp = 2.5; }
                else { pret = est < 7.5 ? 0.3 : 0.0; bw = 3.0 + 0.9 * e1; medio = 0.15; alf = 1.0; dint = 2.6; ciego = est < 7.5 ? 0.25 : 0.5; dp = 2.6; }
              }
              float fh = (H - pret) / floors, fi = min(floor(y / fh), floors - 1.0), fy = y - fi * fh;
              float bx = x / bw + h11(seed * 5.3), bi = floor(bx), fx = fract(bx);
              float r = h11(bi * 12.9898 + seed * 78.233 + fi * 3.1);
              pb = step(fi, 0.5);
              float puerta = pb * step(r, pp);
              float hay = kind < 0.5 ? step(ciego, r) : kind < 1.5 ? step(0.5, r) : 0.0;
              float y0 = puerta > 0.5 ? -1.0 : alf, y1 = min(fh - 0.75, puerta > 0.5 ? dp : dint), half1 = puerta > 0.5 ? mp : medio;
              float ax = fwidth(x) / bw;
              float arriba = step(0.5, fi) * calle, ultimo = step(floors - 1.5, fi);
              if (est > 0.5 && kind < 0.5) {
                if (est < 2.5) {
                  // italianizante y francesa: arriba, puertas a los balcones
                  if (fi > 0.5) y0 = 0.12;
                } else if (est < 3.5) {
                  // de comercio: abajo, vidrieras de lado a lado
                  if (pb > 0.5) { half1 = puerta > 0.5 ? 0.16 : 0.41; y0 = puerta > 0.5 ? -1.0 : 0.4; y1 = min(fh - 1.25, 2.7); hay = 1.0; vidrio = 1.0; }
                } else if (est < 4.5) {
                  // racionalista: vidrio, el local o el garaje abajo, y la caja de la escalera, una tira de arriba abajo
                  vidrio = 1.0;
                  if (pb > 0.5) { half1 = puerta > 0.5 ? 0.18 : 0.38; y0 = puerta > 0.5 ? -1.0 : 0.5; y1 = min(fh - 0.7, 2.6); hay = step(0.2, r); }
                  if (floors > 3.5 && abs(mod(bi + floor(h11(seed * 3.3) * 5.0), 5.0) - 2.0) < 0.5) { half1 = 0.085; y0 = pb > 0.5 ? 1.1 : -1.0; y1 = fh + 1.0; hay = 1.0; }
                }
              }
              float enX = smoothstep(0.5 - half1 - ax, 0.5 - half1 + ax, fx) - smoothstep(0.5 + half1 - ax, 0.5 + half1 + ax, fx);
              hueco = enX * (smoothstep(y0 - ay, y0 + ay, fy) - smoothstep(y1 - ay, y1 + ay, fy)) * hay * step(y, H - pret);
              // la cornisa y el zócalo
              corn = (1.0 - smoothstep(0.05, 0.11 + ay, abs(y - (H - pret)))) * clamp(1.4 - ay * 1.6, 0.0, 1.0);
              if (est > 0.5) {
                float cerca = clamp(1.5 - ay * 2.2, 0.0, 1.0), cx = clamp(1.4 - ax * bw * 2.4, 0.0, 1.0); // (de lejos, los detalles se apagan)
                float dx = abs(fx - 0.5), bajo = H - pret - y;
                if (est < 2.5) {
                  // pilastras entre paño y paño, el marco de cada vano con su guardapolvo, la cornisa ancha con dentículos
                  float fran = step(1.5, est);
                  claro = (1.0 - smoothstep(0.04, 0.04 + ax, min(fx, 1.0 - fx))) * calle * (1.0 - mans) * mix(1.0, 0.0, fran * (1.0 - pb)) * step(y, H - pret);
                  float marco = (1.0 - smoothstep(half1 + 0.035, half1 + 0.035 + ax, dx)) * (smoothstep(y0 - ay, y0 + ay, fy) - smoothstep(y1 + 0.22 - ay, y1 + 0.22 + ay, fy));
                  claro = max(claro, marco * hay * calle * (1.0 - mans) * step(y, H - pret));
                  float banda = smoothstep(0.0, ay, bajo) - smoothstep(0.38 - ay, 0.38 + ay, bajo);
                  claro = max(claro, banda * (1.0 - fran * step(1.5, floors)));
                  junta = (smoothstep(0.38, 0.38 + ay, bajo) - smoothstep(0.55, 0.55 + ay, bajo)) * step(0.5, fract(x / 0.42)) * 0.8 * cx * (1.0 - fran) * calle;
                  // el almohadillado de la planta baja (siempre en las francesas; en las italianas, algunas)
                  float alm = pb * calle * step(h11(seed * 6.1), mix(0.35, 1.0, fran)) * step(1.5, floors);
                  junta = max(junta, alm * (1.0 - smoothstep(0.05, 0.05 + ay * 1.5, abs(fract(fy / 0.48) - 0.5) * 0.96)) * 0.7 * cerca);
                  // los balcones: uno por puerta, de hierro; en las francesas, corrido en el primer piso
                  float baran = smoothstep(0.02, 0.02 + ay, fy) - smoothstep(0.95 - ay, 0.95 + ay, fy);
                  float uno = (1.0 - smoothstep(half1 + 0.1, half1 + 0.1 + ax, dx)) * hay, corrido = fran * step(abs(fi - 1.0), 0.5) * step(2.5, floors);
                  hierro = baran * max(uno, corrido) * arriba * (1.0 - mans) * mix(0.55, 1.0, step(0.5, fract(x / 0.13)) * cx) * step(y, H - pret);
                  junta = max(junta, (1.0 - smoothstep(0.07, 0.07 + ay, abs(fy - 0.04))) * max(uno, corrido) * arriba * (1.0 - mans));
                  if (fran < 0.5) junta = max(junta, step(bajo, -0.22) * step(y, H - 0.16) * step(0.55, fract(x / 0.3)) * 0.85 * cx); // (los balaustres del pretil)
                  else if (floors > 1.5) claro = max(claro, (smoothstep(0.0, ay, y - (floors - 1.0) * fh + 0.3) - smoothstep(0.0, ay, y - (floors - 1.0) * fh)) * calle); // (la cornisa, al pie de la mansarda)
                } else if (est < 3.5) {
                  // el toldo de lona a rayas sobre la vidriera, el letrero encima, y arriba marcos y una cornisa simple
                  float tiene = step(h11(bi * 7.7 + seed * 31.0), 0.62) * pb * calle * (1.0 - puerta);
                  toldo = tiene * (1.0 - smoothstep(0.46, 0.46 + ax, dx)) * (smoothstep(2.05 - ay, 2.05 + ay, fy) - smoothstep(2.95 - ay, 2.95 + ay, fy)) * step(3.6, fh);
                  lista = step(0.5, fract(x / 0.3));
                  float lt = step(4.1, fh) * pb * calle * step(0.3, h11(bi * 3.1 + seed * 17.0));
                  letrero = lt * (1.0 - smoothstep(0.44, 0.44 + ax, dx)) * (smoothstep(3.1 - ay, 3.1 + ay, fy) - smoothstep(3.75 - ay, 3.75 + ay, fy));
                  letra = (1.0 - smoothstep(0.34, 0.34 + ax, dx)) * (smoothstep(3.27 - ay, 3.27 + ay, fy) - smoothstep(3.58 - ay, 3.58 + ay, fy)) * step(0.38, fract(x / 0.21 + seed * 9.0)) * step(h11(floor(x / 0.21 + seed * 9.0) * 1.7), 0.8) * cx;
                  float marco = (1.0 - smoothstep(half1 + 0.03, half1 + 0.03 + ax, dx)) * (smoothstep(y0 - 0.1 - ay, y0 - 0.1 + ay, fy) - smoothstep(y1 + 0.15 - ay, y1 + 0.15 + ay, fy));
                  claro = max(marco * hay * arriba, (smoothstep(0.0, ay, bajo) - smoothstep(0.3 - ay, 0.3 + ay, bajo)) * calle);
                } else if (est < 4.5) {
                  // balcones macizos en una columna de paños sí y otra no, las losas marcadas y el basamento oscuro
                  float col2 = step(mod(bi + floor(h11(seed * 1.9) * 2.0), 2.0), 0.5) * step(2.5, floors);
                  claro = col2 * arriba * (1.0 - smoothstep(0.46, 0.46 + ax, dx)) * (smoothstep(0.08, 0.08 + ay, fy) - smoothstep(1.0 - ay, 1.0 + ay, fy)) * 0.7;
                  junta = max((1.0 - smoothstep(0.03, 0.03 + ay, abs(fy - 0.04))) * arriba * 0.8, col2 * arriba * (1.0 - smoothstep(0.46, 0.46 + ax, dx)) * (1.0 - smoothstep(0.0, 0.1, abs(fy - 0.04))) );
                  junta = max(junta, pb * calle * 0.55 * step(2.5, floors));
                  corn *= 0.5;
                } else if (est < 5.5) {
                  // ladrillo a la vista, con sus hiladas, y un contrafuerte entre paño y paño
                  junta = (1.0 - smoothstep(0.1, 0.1 + ay * 3.0, abs(fract(y / 0.3) - 0.5) * 2.0)) * 0.3 * cerca;
                  junta = max(junta, (1.0 - smoothstep(0.035, 0.035 + ax, min(fx, 1.0 - fx))) * 0.45 * calle);
                } else if (est < 6.5) {
                  // chapa acanalada, y abajo los pilotes: la casilla va levantada del suelo
                  float ch = fwidth(x) / 0.16;
                  junta = (1.0 - smoothstep(0.3 - ch, 0.3 + ch, abs(fract(x / 0.16) - 0.5) * 2.0)) * 0.42 * clamp(1.0 / (ch * 3.0 + 0.4) - 0.5, 0.0, 1.0);
                  junta = max(junta, (1.0 - smoothstep(0.42, 0.42 + ay, y)) * step(0.22, fract(x / 1.3)) * 0.95);
                  claro = (1.0 - smoothstep(half1 + 0.03, half1 + 0.03 + ax, dx)) * (smoothstep(y0 - 0.08 - ay, y0 - 0.08 + ay, fy) - smoothstep(y1 + 0.08 - ay, y1 + 0.08 + ay, fy)) * hay * calle * step(0.42, y);
                  hueco *= step(0.42, y); corn = 0.0;
                } else if (est < 7.5) {
                  junta = (1.0 - smoothstep(0.1, 0.1 + ay * 3.0, abs(fract(y / 0.3) - 0.5) * 2.0)) * 0.26 * cerca * step(h11(seed * 7.3), 0.45);
                } else corn = 0.0;
              }
              // El aviso pintado en la medianera: las casas altas que asoman sobre las vecinas, algunas, llevan uno
              // arriba: un paño de color con su filete y dos o tres renglones de letras. (vMuro.x: el largo del
              // muro; vMuro.y: de dónde arranca, que es hasta donde lo tapa la casa de al lado.)
              if (uManto > 2.5 && kind > 1.5 && kind < 2.5 && est > 0.5 && est < 4.5 && floors > 2.5 && vMuro.x > 6.5 && H - vMuro.y > 5.0 && h11(seed * 4.7 + vMuro.x * 0.37) < 0.3) {
                float aw = min(vMuro.x - 2.2, 6.0 + 6.0 * e1), ah = min(H - vMuro.y - 2.2, 3.2 + 2.6 * h11(seed * 8.3)), fa = max(fwidth(x), ay);
                vec2 ca = vec2(vMuro.x * 0.5, H - 1.3 - ah * 0.5), da = abs(vec2(x, y) - ca) - vec2(aw, ah) * 0.5;
                float sd = max(da.x, da.y), nf = ah > 4.3 ? 3.0 : 2.0, ry = (y - ca.y) / ah + 0.5, fl = floor(ry * nf), lw = ah / nf * 0.4;
                aviso = 1.0 - smoothstep(-fa, fa, sd);
                avisoL = (smoothstep(-0.34 - fa, -0.34 + fa, sd) - smoothstep(-0.2 - fa, -0.2 + fa, sd)) * 0.8;
                float renglon = step(0.24, fract(ry * nf)) * step(fract(ry * nf), 0.76) * step(abs(x - ca.x), (aw * 0.5 - 0.75) * mix(0.5, 1.0, h11(fl * 3.3 + seed * 6.0)));
                float lc = x / lw + seed * 9.0 + fl * 0.37;
                avisoL = max(avisoL, renglon * step(0.3, fract(lc)) * step(h11(floor(lc) * 1.7 + fl * 5.1), 0.8) * clamp(1.5 - fwidth(x) / lw * 2.2, 0.35, 1.0));
              }
              // en tinta: la pizarra en gris, los vanos llenos, las juntas y el hierro como trazos, el toldo a rayas
              col = mix(col, mix(uInk, uPaper, 0.52), mans * 0.85);
              col = mix(col, uInk * 1.15, hueco * 0.84);
              col = mix(col, uInk, corn * 0.5);
              col = mix(col, uInk, clamp(junta * 0.3 + hierro * 0.45, 0.0, 0.6));
              col = mix(col, mix(uInk, uPaper, 0.35 + 0.5 * lista), toldo * 0.9);
              col = mix(col, mix(uInk, uPaper, 0.2 + 0.7 * letra), letrero * 0.9);
              col = mix(col, mix(uInk, uPaper, 0.28 + 0.62 * avisoL), aviso * 0.8);
            }
            if (kc > 0.0) {
              // la cal: blanca las más, y si no crema, ocre claro o rosa viejo
              float r = h11(seed * 7.3);
              vec3 muro = r < 0.5 ? vec3(0.93, 0.91, 0.85) : r < 0.72 ? vec3(0.91, 0.84, 0.69) : r < 0.88 ? vec3(0.88, 0.75, 0.67) : vec3(0.82, 0.81, 0.75);
              // (y cada estilo, con su paleta: los ocres y rosas de las italianas, el símil piedra de las francesas, los
              // blancos y grises de los treinta, el ladrillo de los galpones y de las orillas, los colores de La Boca)
              if (est > 0.5) {
                if (est < 1.5) muro = r < 0.22 ? vec3(0.91, 0.85, 0.7) : r < 0.42 ? vec3(0.86, 0.73, 0.5) : r < 0.58 ? vec3(0.87, 0.7, 0.62) : r < 0.71 ? vec3(0.76, 0.79, 0.7) : r < 0.82 ? vec3(0.72, 0.79, 0.82) : r < 0.9 ? vec3(0.8, 0.56, 0.45) : vec3(0.93, 0.91, 0.85);
                else if (est < 2.5) muro = mix(vec3(0.87, 0.83, 0.75), vec3(0.76, 0.74, 0.69), r);
                else if (est < 3.5) muro = r < 0.35 ? vec3(0.9, 0.85, 0.72) : r < 0.65 ? vec3(0.8, 0.79, 0.75) : r < 0.85 ? vec3(0.86, 0.76, 0.6) : vec3(0.92, 0.9, 0.85);
                else if (est < 4.5) muro = r < 0.4 ? vec3(0.93, 0.92, 0.88) : r < 0.62 ? vec3(0.9, 0.86, 0.76) : r < 0.84 ? vec3(0.79, 0.78, 0.75) : vec3(0.87, 0.79, 0.65);
                else if (est < 5.5) muro = r < 0.78 ? mix(vec3(0.58, 0.33, 0.24), vec3(0.7, 0.43, 0.31), h11(seed * 3.1)) : vec3(0.75, 0.73, 0.68);
                else if (est < 6.5) muro = r < 0.17 ? vec3(0.22, 0.38, 0.52) : r < 0.34 ? vec3(0.27, 0.45, 0.33) : r < 0.5 ? vec3(0.82, 0.67, 0.27) : r < 0.64 ? vec3(0.62, 0.26, 0.19) : r < 0.78 ? vec3(0.53, 0.68, 0.72) : r < 0.9 ? vec3(0.62, 0.64, 0.64) : vec3(0.9, 0.88, 0.82);
                else if (est < 7.5) muro = r < 0.45 ? mix(vec3(0.62, 0.38, 0.27), vec3(0.72, 0.47, 0.33), h11(seed * 3.1)) : r < 0.8 ? vec3(0.76, 0.73, 0.67) : vec3(0.91, 0.89, 0.83);
                else muro = r < 0.6 ? vec3(0.87, 0.83, 0.75) : vec3(0.69, 0.57, 0.43);
              }
              // (los edificios con nombre, src/hitos.js, traen su tono en la parte entera de la semilla: blanco, crema,
              // rosa, gris de cemento, terracota o piedra)
              float tono = floor(seed - 2.0 + 0.001);
              vec3 dado = tono < 0.5 ? vec3(0.93, 0.91, 0.85) : tono < 1.5 ? vec3(0.9, 0.83, 0.69) : tono < 2.5 ? vec3(0.87, 0.63, 0.57) : tono < 3.5 ? vec3(0.74, 0.73, 0.69) : tono < 4.5 ? vec3(0.8, 0.59, 0.42) : vec3(0.85, 0.81, 0.73);
              if (seed > 1.5) muro = dado;
              if (kind > 8.5) {
                // pintado: madera barnizada, verde, bronce, rojo, ocre o lona, según vMuro.x
                float p = vMuro.x;
                muro = p < 0.5 ? vec3(0.47, 0.27, 0.13) : p < 1.5 ? vec3(0.15, 0.27, 0.18) : p < 2.5 ? vec3(0.8, 0.61, 0.25) : p < 3.5 ? vec3(0.58, 0.15, 0.1) : p < 4.5 ? vec3(0.74, 0.56, 0.24) : p < 5.5 ? vec3(0.7, 0.67, 0.6) : vec3(0.57, 0.53, 0.47) * (0.9 + 0.2 * n3(vWorld * 2.3));
                // (y lo de las plazas y el puerto, src/hitos.js: césped, agua de fuente, baldosa, granza, adoquín,
                // flores, asfalto, chapa, negro, blanco, ladrillo, bronce patinado y cobre verde)
                if (p > 6.5) {
                  float g1 = n3(vec3(vWorld.xz * 0.045, 1.0)) * 0.6 + n3(vec3(vWorld.xz * 0.3, 2.0)) * 0.4, g2 = n3(vec3(vWorld.xz * 1.9, 3.0));
                  muro = p < 7.5 ? mix(vec3(0.3, 0.4, 0.17), vec3(0.45, 0.5, 0.23), g1) * (0.9 + 0.2 * g2)
                    : p < 8.5 ? mix(vec3(0.3, 0.42, 0.44), vec3(0.45, 0.56, 0.56), n3(vec3(vWorld.xz * 0.6, 4.0)))
                    : p < 9.5 ? vec3(0.8, 0.775, 0.71) * (0.94 + 0.1 * g2)
                    : p < 10.5 ? mix(vec3(0.7, 0.5, 0.38), vec3(0.78, 0.6, 0.46), g1) * (0.94 + 0.1 * g2)
                    : p < 11.5 ? mix(vec3(0.47, 0.45, 0.42), vec3(0.58, 0.55, 0.5), g1) * (0.9 + 0.2 * g2)
                    : p < 12.5 ? mix(mix(vec3(0.25, 0.36, 0.15), vec3(0.72, 0.2, 0.16), smoothstep(0.42, 0.6, n3(vec3(vWorld.xz * 1.3, 5.0)))), vec3(0.86, 0.72, 0.25), smoothstep(0.62, 0.75, n3(vec3(vWorld.xz * 1.1, 6.0))))
                    : p < 13.5 ? vec3(0.33, 0.33, 0.34) * (0.92 + 0.14 * g1)
                    : p < 14.5 ? vec3(0.6, 0.62, 0.63) * (0.92 + 0.12 * n3(vWorld * 0.9))
                    : p < 15.5 ? vec3(0.13, 0.12, 0.12)
                    : p < 16.5 ? vec3(0.94, 0.93, 0.9)
                    : p < 17.5 ? vec3(0.62, 0.3, 0.22) * (0.9 + 0.18 * n3(vWorld * 1.7))
                    : p < 18.5 ? vec3(0.25, 0.29, 0.23) * (0.9 + 0.2 * n3(vWorld * 1.3))
                    : vec3(0.42, 0.6, 0.5) * (0.9 + 0.16 * n3(vWorld * 0.8));
                }
              } else if (kind > 7.5) {
                // pizarra y tejas
                float tv = vWorld.y / 0.7, tw = fwidth(tv);
                muro = mix(vec3(0.4, 0.43, 0.47), vec3(0.55, 0.57, 0.6), n3(vWorld * 0.4)) * (1.0 - 0.14 * (1.0 - smoothstep(0.2 - tw, 0.2 + tw, abs(fract(tv) - 0.5) * 2.0)) * clamp(1.0 / (tw + 0.5) - 0.4, 0.0, 1.0));
              } else if (kind > 6.5) muro = vec3(0.15, 0.12, 0.1);
              else if (kind > 5.5) muro = seed > 1.5 ? dado * 1.03 : vec3(0.92, 0.89, 0.82);
              else {
                // el zócalo salpicado de barro, la cornisa, y las puertas y postigos de madera oscura o verde
                muro *= mix(0.8, 1.0, smoothstep(0.25, 1.1, y)) * (0.94 + 0.1 * n3(vec3(x * 0.7, y * 0.7, seed * 40.0)));
                muro = mix(muro, muro * 0.72, corn * 0.6);
                if (est > 0.5) {
                  // las molduras, más claras que el paño; las juntas y las sombras; la pizarra con sus hiladas
                  muro = mix(muro, mix(muro, vec3(0.97, 0.95, 0.9), est > 3.5 ? 0.25 : est > 5.5 ? 0.8 : 0.55), claro);
                  if (est > 5.5 && est < 6.5) muro = mix(muro, vec3(0.94, 0.93, 0.89), claro);
                  muro *= 1.0 - 0.42 * junta;
                  float tv = y / 0.32, tw = fwidth(tv);
                  muro = mix(muro, mix(vec3(0.33, 0.36, 0.41), vec3(0.43, 0.46, 0.5), h11(seed * 9.1)) * (1.0 - 0.16 * (1.0 - smoothstep(0.2 - tw, 0.2 + tw, abs(fract(tv) - 0.5) * 2.0)) * clamp(1.0 / (tw + 0.5) - 0.4, 0.0, 1.0)), mans);
                }
                // los vanos: postigos de madera oscura o verde; en los comercios y en lo de los treinta, vidrio
                vec3 vano = h11(seed * 2.9) < 0.4 ? vec3(0.17, 0.25, 0.17) : vec3(0.2, 0.15, 0.11);
                if (vidrio > 0.5) vano = mix(vec3(0.17, 0.2, 0.22), vec3(0.36, 0.42, 0.44), smoothstep(0.2, 1.0, fract(y / 3.3 + x * 0.07)) * 0.7);
                else if (est > 5.5 && est < 6.5) vano = vec3(0.16, 0.15, 0.14);
                muro = mix(muro, vano, hueco * 0.9);
                if (aviso > 0.0) {
                  // (el aviso: azul, rojo, negro, ocre o blanco, con las letras claras u oscuras; gastado por la lluvia)
                  float ta = h11(seed * 6.7);
                  vec3 fondoA = ta < 0.3 ? vec3(0.17, 0.23, 0.36) : ta < 0.55 ? vec3(0.55, 0.18, 0.14) : ta < 0.72 ? vec3(0.15, 0.15, 0.14) : ta < 0.88 ? vec3(0.84, 0.69, 0.3) : vec3(0.91, 0.89, 0.81);
                  vec3 letraA = ta < 0.72 ? vec3(0.93, 0.89, 0.76) : vec3(0.15, 0.14, 0.13);
                  muro = mix(muro, mix(fondoA, letraA, avisoL) * (0.9 + 0.14 * n3(vec3(x * 0.5, y * 0.5, seed * 20.0))), aviso * 0.86);
                }
                if (est > 0.5) {
                  muro = mix(muro, vec3(0.12, 0.12, 0.13), hierro * 0.7);
                  float tt = h11(seed * 5.9);
                  vec3 lona = tt < 0.3 ? vec3(0.6, 0.2, 0.16) : tt < 0.55 ? vec3(0.2, 0.36, 0.26) : tt < 0.75 ? vec3(0.8, 0.62, 0.25) : vec3(0.24, 0.3, 0.42);
                  muro = mix(muro, mix(lona, vec3(0.93, 0.9, 0.82), lista * step(0.25, h11(seed * 8.7))) * mix(0.82, 1.0, smoothstep(2.05, 2.95, mod(y, 60.0))), toldo);
                  vec3 fondo = tt < 0.4 ? vec3(0.13, 0.15, 0.14) : tt < 0.7 ? vec3(0.36, 0.12, 0.1) : vec3(0.14, 0.2, 0.3);
                  muro = mix(muro, mix(fondo, vec3(0.92, 0.86, 0.66), letra), letrero);
                }
              }
              col = mix(col, muro * luzColor(luz), kc);
            }
          }
          // (y al despegarse del papel, todo arranca del color del plano)
          if (vRise < 0.3 && (kind < 2.5 || kind > 4.5)) { float p0 = tinta(vWorld.xz); vec3 base = mix(uInk, uPaper, p0); if (kc > 0.0) base = mix(base, sueloColor(vWorld.xz, p0), kc); col = mix(base, col, smoothstep(0.0, 0.3, vRise)); }
          // El velo: lo que se puede tocar se aclara al pasarle el mouse, como con un resaltador. Se aclara el edificio y
          // nada más (ni el suelo ni los vecinos): entero, por su ancla (el origen del lugar), cuando la marca es de un
          // edificio suelto; si no, lo que esté a menos del radio. El suelo solo entra cuando la marca es de una plaza,
          // un dique o una avenida, que son suelo.
          if (uSobre.w > 0.0) {
            bool piso = kind > 3.5 && kind < 4.5, pieza = uManto > 0.5 && uManto < 1.5;
            float cuanto = piso ? 0.3 * uSobreQue.z : pieza ? step(uSobreQue.x, 1.5) : uManto > 2.5 ? uSobreQue.w : uManto > 1.5 ? uSobreQue.y : 0.0;
            if (cuanto > 0.0) {
              float r = uSobre.z, cerca = 1.0 - smoothstep(r * 0.82, r, distance(vWorld.xz, uSobre.xy));
              if (pieza && !piso && uSobreQue.x > 0.5) cerca = vAncla.z > 0.5 && distance(vAncla.xy, uSobre.xy) < r ? 1.0 : 0.0;
              col = mix(col, mix(vec3(1.0, 0.93, 0.66), vec3(1.0, 0.97, 0.86), uColor), cerca * cuanto * uSobre.w * mix(0.5, 0.4, uColor));
            }
          }
          gl_FragColor = vec4(col, 1.0);`)
        .replace('#include <tonemapping_fragment>', '').replace('#include <colorspace_fragment>', '');
    };
    return m;
  };
  /** Para las sombras: el mismo alzado. */
  const depth = () => {
    const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, U);
      shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>\nattribute vec4 aInfo; attribute vec3 aAncla;\n${COMUN}`).replace('#include <begin_vertex>', `#include <begin_vertex>
        { float r = alzado(aInfo.w, aInfo.x);
          #ifdef USE_INSTANCING
            if (uEpocaK > 0.0 && ((aInfo.y > 49.5 && aInfo.y < 50.5) || (aInfo.w < -0.5 && aInfo.w > -9.0e4))) { vec2 o = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xz; vec2 ouv = (o / uMetro + uPlaza) / uHoja; vec3 c = crecido(ouv, length(o)); r *= 1.0 - max(max(c.z, c.x * (1.0 - c.y)), despejado(ouv, length(o)).x); }
          #endif
          transformed.y *= r; if (r <= 0.0) transformed = vec3(0.0, -1.0e4, 0.0);
          #ifndef SIN_RELIEVE
            vec4 wp = vec4(transformed, 1.0); float sy = 1.0;
            #ifdef USE_INSTANCING
              wp = instanceMatrix * wp; sy = length(instanceMatrix[1].xyz);
            #endif
            float suelo = altura((modelMatrix * wp).xz);
            if (aAncla.z > 0.5) { float sa = altura(aAncla.xy); suelo = position.y < 0.05 ? min(suelo, sa) : sa; }
            transformed.y += suelo / max(sy, 1.0e-4);
          #endif
        }`);
    };
    return m;
  };
  return { U, make, depth };
}
