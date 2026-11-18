// Medidas de la georreferencia (solo lectura). No corre tools/calce.mjs: reconstruye los pares de control a partir
// de tools/geo.json y de las referencias de tools/geo.mjs, y repite las cuentas con las mismas funciones del repo.
//   node paper/medidas/georef.mjs > paper/medidas/georef.txt      (escribe además paper/medidas/georef.json)
import { readFileSync, writeFileSync } from 'node:fs';
import { REFERENCIAS, USADAS, ajustar, grueso, errorRef, aPlanoM, esFino } from '../../tools/geo.mjs';
import { metros, BASES, aplicar, conCampo } from '../../src/geo.js';
import { PLANO } from '../../tools/plano.mjs';

const M = PLANO.metro;
const est = (v) => { const s = [...v].sort((a, b) => a - b), n = s.length; return { n, media: s.reduce((a, b) => a + b, 0) / n, mediana: n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2, p90: s[Math.min(n - 1, Math.floor(n * 0.9))], max: s[n - 1], rms: Math.sqrt(s.reduce((a, b) => a + b * b, 0) / n) }; };
const f1 = (x) => x.toFixed(1), fila = (t, e) => `${t.padEnd(62)} n=${String(e.n).padStart(3)}  media ${f1(e.media).padStart(5)}  mediana ${f1(e.mediana).padStart(5)}  p90 ${f1(e.p90).padStart(5)}  máx ${f1(e.max).padStart(5)}  RMS ${f1(e.rms).padStart(5)}  (m)`;
const out = {};

// ------------------------------------------------------------------ 1. el ajuste afín sobre las referencias (edificios)
console.log('== 1. Ajuste afín con edificios de referencia (tools/geo.mjs) ==');
console.log(`referencias declaradas: ${REFERENCIAS.length} · usadas tras el descarte (< 60 m): ${USADAS.length}`);
const par = (r) => [...metros(r[3], r[4]), r[1], r[2]];
const resAf = REFERENCIAS.map((r) => ({ nombre: r[0], usada: USADAS.includes(r), afin: errorRef(r, grueso), fino: esFino ? errorRef(r, aPlanoM) : null }));
// dejando una afuera (solo entre las usadas: se reajusta el afín con las otras y se mide en la que quedó afuera)
for (const o of resAf) {
  const r = REFERENCIAS.find((q) => q[0] === o.nombre);
  if (!o.usada) { o.loo = null; continue; }
  const f = aplicar(ajustar(USADAS.filter((q) => q !== r).map(par), BASES[1]), BASES[1]);
  o.loo = errorRef(r, f);
}
console.log('referencia'.padEnd(40), 'afín'.padStart(7), 'LOO'.padStart(7), 'fino'.padStart(7), ' (m)');
for (const o of resAf) console.log(`${o.usada ? ' ' : '×'} ${o.nombre.padEnd(38)} ${f1(o.afin).padStart(7)} ${(o.loo == null ? '—' : f1(o.loo)).padStart(7)} ${(o.fino == null ? '—' : f1(o.fino)).padStart(7)}`);
const us = resAf.filter((o) => o.usada);
console.log(fila('afín, residuo en las referencias usadas', (out.afinUsadas = est(us.map((o) => o.afin)))));
console.log(fila('afín, dejando una afuera (LOO) entre las usadas', (out.afinLOO = est(us.map((o) => o.loo)))));
console.log(fila('afín, en las 16 declaradas (incluye las descartadas)', (out.afinTodas = est(resAf.map((o) => o.afin)))));
if (esFino) {
  console.log(fila('ajuste fino, en las referencias usadas (entran con peso 0,25)', (out.finoUsadas = est(us.map((o) => o.fino)))));
  console.log(fila('ajuste fino, en las 16 declaradas', (out.finoTodas = est(resAf.map((o) => o.fino)))));
}
out.referencias = resAf;

// la escala y el giro que da cada afín
const escala = (g) => { const ex = Math.hypot(g.A[1], g.B[1]), en = Math.hypot(g.A[2], g.B[2]); return { pxPorKmEste: ex, pxPorKmNorte: en, mPorPxEste: 1000 / ex, mPorPxNorte: 1000 / en, giroGrados: (Math.atan2(g.B[2], g.A[2]) * 180) / Math.PI }; };
const gAf = ajustar(USADAS.map(par), BASES[1]);
out.escalaAfin = escala(gAf);
console.log(`escala del afín de referencias: ${out.escalaAfin.mPorPxEste.toFixed(4)} m/px (eje este), ${out.escalaAfin.mPorPxNorte.toFixed(4)} m/px (eje norte); el norte del mundo apunta a ${out.escalaAfin.giroGrados.toFixed(2)}° del eje x del escaneo`);
console.log(`escala nominal usada por el visor (tools/plano.mjs): ${M} m/px`);

// ------------------------------------------------------------------ 2. el ajuste fino (tools/geo.json)
if (esFino) {
  const g = JSON.parse(readFileSync(new URL('../../tools/geo.json', import.meta.url), 'utf8'));
  console.log('\n== 2. Ajuste fino por calce de calles (tools/geo.json) ==');
  console.log(`ventanas que calzaron: ${g.ventanas} · sigma ${g.sigma} m · freno ${g.freno} · anotado por tools/calce.mjs: lo que falta correr, media ${g.medio} m, máximo ${g.maximo} m`);
  out.geoJson = { ventanas: g.ventanas, sigma: g.sigma, freno: g.freno, medio: g.medio, maximo: g.maximo };
  out.escalaFino = escala(g);
  console.log(`escala del afín fino: ${out.escalaFino.mPorPxEste.toFixed(4)} m/px (este), ${out.escalaFino.mPorPxNorte.toFixed(4)} m/px (norte); giro ${out.escalaFino.giroGrados.toFixed(2)}°`);
  // los pares de control: cada ventana, [e, n] (redondeado al metro en el archivo) → el punto del plano donde calzó
  const af = aplicar(g, BASES[1]);
  const pares = g.puntos.map(([e, n, dx, dy]) => { const [a, b] = af(e, n); return [e, n, a + dx, b + dy, 1]; });
  const resid = (ps, f) => ps.map(([e, n, x, y]) => { const [a, b] = f(e, n); return Math.hypot(a - x, b - y) * M; });
  console.log(fila('ventanas vs. el afín de referencias (paso 1 solo)', (out.ventanasGrueso = est(resid(pares, grueso)))));
  console.log(fila('ventanas vs. el afín fino (sin campo)', (out.ventanasAfin = est(resid(pares, af)))));
  console.log(fila('ventanas vs. afín + campo (residuo dentro de la muestra)', (out.ventanasCampo = est(resid(pares, conCampo(g))))));
  // lo mismo que tools/calce.mjs: el modelo y su validación cruzada por zonas
  const anclas = USADAS.map((r) => [...metros(r[3], r[4]), r[1], r[2], 0.25]);
  const hacer = (ps, campo = true) => { const h = { grado: 1, ...ajustar([...ps, ...anclas], BASES[1]), sigma: g.sigma, freno: g.freno, puntos: [] }; if (campo) { const a = aplicar(h, BASES[1]); h.puntos = ps.map(([e, n, x, y]) => { const [p, q] = a(e, n); return [e, n, x - p, y - q]; }); } return h; };
  const cruzada = (ps, campo, lado) => { const o = []; for (let k = 0; k < 9; k++) { const zona = (p) => (((Math.floor(p[2] / lado) % 3) + 3) % 3) + 3 * (((Math.floor(p[3] / lado) % 3) + 3) % 3) === k; o.push(...resid(ps.filter(zona), conCampo(hacer(ps.filter((p) => !zona(p)), campo)))); } return o; };
  console.log(fila('reajuste propio (afín+campo) dentro de la muestra', (out.reajuste = est(resid(pares, conCampo(hacer(pares)))))));
  console.log(fila('cruzada por zonas de 300 m, afín + campo', (out.cv300 = est(cruzada(pares, true, 300 / M)))));
  console.log(fila('cruzada por zonas de 700 m, afín + campo', (out.cv700 = est(cruzada(pares, true, 700 / M)))));
  console.log(fila('cruzada por zonas de 700 m, solo afín', (out.cv700afin = est(cruzada(pares, false, 700 / M)))));
  // dejando una ventana afuera
  const loo = pares.map((p) => resid([p], conCampo(hacer(pares.filter((q) => q !== p))))[0]);
  console.log(fila('dejando una ventana afuera (LOO), afín + campo', (out.looVentanas = est(loo))));
  const looAf = pares.map((p) => resid([p], conCampo(hacer(pares.filter((q) => q !== p), false)))[0]);
  console.log(fila('dejando una ventana afuera (LOO), solo afín', (out.looVentanasAfin = est(looAf))));
  // dónde hay ventanas: la extensión de los datos
  const ee = pares.map((p) => p[0]), nn = pares.map((p) => p[1]), dist = pares.map((p) => Math.hypot(p[0], p[1]));
  out.extension = { esteMin: Math.min(...ee), esteMax: Math.max(...ee), norteMin: Math.min(...nn), norteMax: Math.max(...nn), distMax: Math.max(...dist) };
  console.log(`extensión de las ventanas (m desde la Plaza de Mayo): este ${Math.min(...ee)}…${Math.max(...ee)}, norte ${Math.min(...nn)}…${Math.max(...nn)}; la más lejana, a ${Math.round(Math.max(...dist))} m`);
  // cuánto se aparta el fino del grueso en las esquinas de la guarda y en el centro
  const [x0, y0, x1, y1] = PLANO.marco, f = conCampo(g);
  out.apartamiento = [];
  for (const [nombre, x, y] of [['esquina x0,y0', x0, y0], ['esquina x1,y0', x1, y0], ['esquina x0,y1', x0, y1], ['esquina x1,y1', x1, y1], ['centro de la guarda', (x0 + x1) / 2, (y0 + y1) / 2], ['Plaza de Mayo', ...PLANO.plaza]]) {
    let e = 0, n = 0; for (let i = 0; i < 12; i++) { const [a, b] = grueso(e, n), [a1, b1] = grueso(e + 1, n), [a2, b2] = grueso(e, n + 1), A = a1 - a, B = a2 - a, C = b1 - b, D = b2 - b, det = A * D - B * C; e += (D * (x - a) - B * (y - b)) / det; n += (A * (y - b) - C * (x - a)) / det; }
    const [a, b] = f(e, n), d = Math.hypot(a - x, b - y) * M; out.apartamiento.push({ nombre, m: d });
    console.log(`  fino − grueso en ${nombre.padEnd(22)} ${d.toFixed(0)} m`);
  }
  out.pares = pares.map(([e, n, x, y]) => [e, n, +x.toFixed(2), +y.toFixed(2)]);
}
writeFileSync(new URL('./georef.json', import.meta.url), JSON.stringify(out, null, 1));
