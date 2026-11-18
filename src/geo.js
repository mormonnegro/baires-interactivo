// La georreferencia, la parte que es pura cuenta: de la latitud y longitud de hoy a un punto del plano de 1867 (en
// píxeles del escaneo) y la vuelta. La usan las herramientas (tools/geo.mjs, que además busca el ajuste) y el
// navegador (el buscador de direcciones), con los mismos números: tools/geo.json.

export const LAT0 = -34.6083, LON0 = -58.3722, KY = 110940, KX = 111320 * Math.cos((LAT0 * Math.PI) / 180); // metros por grado
export const metros = (lat, lon) => [(lon - LON0) * KX, (lat - LAT0) * KY]; // este, norte (desde la Plaza de Mayo)
export const grados = (e, n) => [LAT0 + n / KY, LON0 + e / KX];

// (las funciones de cada grado, con las distancias en kilómetros para que las cuentas no se desboquen)
export const BASES = {
  1: (e, n) => [1, e / 1000, n / 1000],
  2: (e, n) => { const a = e / 1000, b = n / 1000; return [1, a, b, a * a, a * b, b * b]; },
  3: (e, n) => { const a = e / 1000, b = n / 1000; return [1, a, b, a * a, a * b, b * b, a * a * a, a * a * b, a * b * b, b * b * b]; },
};
export const aplicar = ({ A, B }, base) => (e, n) => { const v = base(e, n); let x = 0, y = 0; for (let i = 0; i < v.length; i++) { x += A[i] * v[i]; y += B[i] * v[i]; } return [x, y]; };

// El ajuste fino: un afín y, encima, una corrección local suave que se apaga lejos de donde hay datos.
/** g: { A, B, sigma, freno, puntos: [e, n, dx, dy] }  →  (este, norte en metros) → [x, y] del plano */
export function conCampo(g) {
  const af = aplicar(g, BASES[1]), P = g.puntos ?? [], k = -1 / (2 * g.sigma * g.sigma);
  return (e, n) => {
    const [x, y] = af(e, n); let sx = 0, sy = 0, sw = g.freno;
    for (let i = 0; i < P.length; i++) { const de = e - P[i][0], dn = n - P[i][1], w = Math.exp((de * de + dn * dn) * k); sx += w * P[i][2]; sy += w * P[i][3]; sw += w; }
    return [x + sx / sw, y + sy / sw];
  };
}
/** La vuelta: del plano a metros, por Newton (la transformación es casi afín). */
export function aMetros(x, y, f) {
  let e = 0, n = 0;
  for (let i = 0; i < 12; i++) {
    const [x0, y0] = f(e, n), [x1, y1] = f(e + 1, n), [x2, y2] = f(e, n + 1);
    const a = x1 - x0, b = x2 - x0, c = y1 - y0, d = y2 - y0, det = a * d - b * c, dx = x - x0, dy = y - y0;
    e += (d * dx - b * dy) / det; n += (a * dy - c * dx) / det;
  }
  return [e, n];
}
