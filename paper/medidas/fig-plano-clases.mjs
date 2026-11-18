// Figuras 1 y 2: el plano con un recorte ampliado, y las etapas de la lectura de la tinta sobre un mismo recorte.
// Además comprueba que la reimplementación del paso 1 (comun.mjs) da lo mismo que tmp/clases.png, y cuenta las clases
// de todo el pliego.   node --max-old-space-size=8000 paper/medidas/fig-plano-clases.mjs > paper/medidas/clases.txt
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { PLANO } from '../../tools/plano.mjs';
import { ESCANEO, FIG, R, gris, clasificar, clasesGuardadas, COLORES, NOMBRES, ciudad67, enPlano, rampa, png, hoja } from './comun.mjs';

const out = {};
// ------------------------------------------------------------------------------------------------ figura 1
{
  const W = 1500, k = W / PLANO.ancho, H = Math.round(PLANO.alto * k);
  const Z = { x: 9900, y: 9150, w: 900, h: 640 }; // el recorte ampliado: la Plaza de la Victoria y sus manzanas
  const Z2 = { x: 10250, y: 9300, w: 300, h: 213 }; // y uno más cerca: se ve el rayado
  const marco = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect x="${Z.x * k}" y="${Z.y * k}" width="${Z.w * k}" height="${Z.h * k}" fill="none" stroke="#c0281a" stroke-width="3"/></svg>`;
  const todo = await sharp(ESCANEO, { limitInputPixels: false }).resize(W, H).composite([{ input: Buffer.from(marco) }]).jpeg({ quality: 86 }).toBuffer();
  const pw = 742, ph = Math.round((pw * Z.h) / Z.w);
  const m2 = `<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}"><rect x="${((Z2.x - Z.x) * pw) / Z.w}" y="${((Z2.y - Z.y) * ph) / Z.h}" width="${(Z2.w * pw) / Z.w}" height="${(Z2.h * ph) / Z.h}" fill="none" stroke="#c0281a" stroke-width="3"/></svg>`;
  const a = await sharp(ESCANEO, { limitInputPixels: false }).extract({ left: Z.x, top: Z.y, width: Z.w, height: Z.h }).resize(pw, ph).composite([{ input: Buffer.from(m2) }]).jpeg({ quality: 90 }).toBuffer();
  const b = await sharp(ESCANEO, { limitInputPixels: false }).extract({ left: Z2.x, top: Z2.y, width: Z2.w, height: Z2.h }).resize(pw, ph, { kernel: 'nearest' }).jpeg({ quality: 92 }).toBuffer();
  await sharp({ create: { width: W, height: H + ph + 16, channels: 3, background: '#ffffff' } }).composite([{ input: todo, left: 0, top: 0 }, { input: a, left: 0, top: H + 16 }, { input: b, left: pw + 16, top: H + 16 }]).jpeg({ quality: 88 }).toFile(FIG('fig01-plano.jpg'));
  out.fig1 = { pliego: [PLANO.ancho, PLANO.alto], recorte: Z, detalle: Z2, mPorPx: PLANO.metro };
  console.log(`fig01-plano.jpg · pliego ${PLANO.ancho} × ${PLANO.alto} px; recorte de ${Math.round(Z.w * PLANO.metro)} × ${Math.round(Z.h * PLANO.metro)} m; detalle de ${Math.round(Z2.w * PLANO.metro)} × ${Math.round(Z2.h * PLANO.metro)} m (cada píxel del escaneo, ${(pw / Z2.w).toFixed(2)} puntos)`);
}

// ------------------------------------------------------------------------------------------------ figura 2
{
  const X0 = 9760, Y0 = 9320, S = 400; // un recorte de 270 m: San Francisco (negro con cruz), manzanas con frente y fondo
  // (se clasifica con 12 px de margen de cada lado, para que la ventana no se salga, y se recorta el medio)
  const MG = 12, grande = await gris(X0 - MG, Y0 - MG, S + 2 * MG, S + 2 * MG), cg = clasificar(grande), w = S >> 1, h = S >> 1, E = 3;
  const medio = (a) => { const o = new a.constructor(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) o[y * w + x] = a[(y + MG / 2) * cg.w + x + MG / 2]; return o; };
  const c = { A: medio(cg.A), B: medio(cg.B), M: medio(cg.M), pA: medio(cg.pA), pB: medio(cg.pB), cls: medio(cg.cls), w, h };
  const rec = { g: Buffer.alloc(S * S), w: S, h: S }; for (let y = 0; y < S; y++) grande.g.copy(rec.g, y * S, (y + MG) * (S + 2 * MG) + MG, (y + MG) * (S + 2 * MG) + MG + S);
  // (a) el escaneo, tal cual y con el contraste estirado como en tools/3-laminas.mjs (50 → negro, 214 → blanco)
  const crudo = Buffer.alloc(S * S * 3), estirado = Buffer.alloc(S * S * 3);
  for (let k = 0; k < S * S; k++) { const v = rec.g[k], e = Math.max(0, Math.min(255, ((v - 50) * 255) / (214 - 50))); crudo[k * 3] = crudo[k * 3 + 1] = crudo[k * 3 + 2] = v; estirado[k * 3] = estirado[k * 3 + 1] = estirado[k * 3 + 2] = e; }
  const mn = new Float32Array(w * h), mx = new Float32Array(w * h); for (let k = 0; k < w * h; k++) { mn[k] = Math.min(c.A[k], c.B[k]); mx[k] = Math.max(c.A[k], c.B[k]); }
  const clasesRGB = Buffer.alloc(w * h * 3); for (let k = 0; k < w * h; k++) clasesRGB.set(COLORES[c.cls[k]], k * 3);
  // (f) lo que quedó en el visor: los techos (rectángulos) de las casas, sobre el escaneo aclarado
  const { mz, te, ar } = ciudad67(); const F = (E * w) / S;
  const formas = [];
  for (let i = 0; i < te.length / 8; i++) { const k = i * 8, b = te[k], P = [[te[k + 1], te[k + 2]], [te[k + 3], te[k + 2]], [te[k + 3], te[k + 4]], [te[k + 1], te[k + 4]]].map(([u, v]) => enPlano(mz, b, u, v)); if (!P.some(([x, y]) => x > X0 && y > Y0 && x < X0 + S && y < Y0 + S)) continue; const s = te[k + 6]; formas.push(`<polygon points="${P.map(([x, y]) => `${((x - X0) * F).toFixed(1)},${((y - Y0) * F).toFixed(1)}`).join(' ')}" fill="rgb(${60 + (s * 7) % 180},${60 + (s * 13) % 180},${60 + (s * 29) % 180})" fill-opacity="0.72" stroke="#2e2620" stroke-width="0.6"/>`); }
  for (let i = 0; i < ar.length / 3; i++) { const x = ar[i * 3], y = ar[i * 3 + 1]; if (x > X0 && y > Y0 && x < X0 + S && y < Y0 + S) formas.push(`<circle cx="${((x - X0) * F).toFixed(1)}" cy="${((y - Y0) * F).toFixed(1)}" r="${(Math.max(2, ar[i * 3 + 2]) * F).toFixed(1)}" fill="none" stroke="#168a2c" stroke-width="2"/>`); }
  const pw = w * E, ph = h * E;
  const aclarado = Buffer.alloc(S * S * 3); for (let k = 0; k < S * S; k++) aclarado[k * 3] = aclarado[k * 3 + 1] = aclarado[k * 3 + 2] = 150 + rec.g[k] * 0.41;
  const lotes = await sharp(aclarado, { raw: { width: S, height: S, channels: 3 } }).resize(pw, ph).composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}">${formas.join('')}</svg>`) }]).png().toBuffer();
  const paneles = [
    { img: await sharp(crudo, { raw: { width: S, height: S, channels: 3 } }).resize(pw, ph).png().toBuffer(), texto: '(a) escaneo en gris (0,675 m/px)' },
    { img: await sharp(estirado, { raw: { width: S, height: S, channels: 3 } }).resize(pw, ph).png().toBuffer(), texto: '(b) contraste estirado 50–214 (solo para mostrar)' },
    { img: await png(rampa(c.M.map((v) => 255 - v), 255), w, h, E), texto: '(c) tono medio M en ventana de 12 px' },
    { img: await png(rampa(c.A, 40), w, h, E), texto: '(d) respuesta al rayado, diagonal x+y' },
    { img: await png(rampa(c.B, 40), w, h, E), texto: '(e) respuesta al rayado, diagonal x−y' },
    { img: await png(rampa(mn, 40), w, h, E), texto: '(f) mínimo de las dos: rayado cruzado' },
    { img: await png(clasesRGB, w, h, E), texto: '(g) clases: papel, edificado, fondo, negro, otra' },
    { img: lotes, texto: '(h) techos por lote y árboles que llegan al visor' },
  ];
  await (await hoja(paneles, 4, { pw, ph })).toFile(FIG('fig03-clases.png'));
  // ¿da lo mismo que tmp/clases.png?
  const guardado = await clasesGuardadas(X0, Y0, S, S); let igual = 0, n = 0; const mg = 0;
  for (let y = mg; y < h - mg; y++) for (let x = mg; x < w - mg; x++) { n++; if (guardado[y * w + x] === c.cls[y * w + x]) igual++; }
  console.log(`fig03-clases.png · recorte [${X0}, ${Y0}] de ${S} px (${(S * PLANO.metro).toFixed(0)} m)`);
  console.log(`reimplementación del paso 1 vs. tmp/clases.png en ese recorte: ${igual} de ${n} píxeles iguales (${((100 * igual) / n).toFixed(2)} %)`);
  out.fig2 = { recorte: [X0, Y0, S], coincide: igual / n };
  // qué período del rayado gana, dentro de lo edificado del recorte
  const per = [0, 0, 0]; for (let k = 0; k < w * h; k++) if (c.cls[k] === 1) per[c.pA[k]]++; console.log(`período que más responde en lo edificado del recorte (4,2 / 5,05 / 6,1 px): ${per.join(' / ')}`);
  out.fig2.periodos = per;
}

// ------------------------------------------------------------------------------------------------ las clases de todo el pliego
{
  const { data, info } = await sharp(R('tmp/clases.png')).extractChannel(0).raw().toBuffer({ resolveWithObject: true });
  const [x0, y0, x1, y1] = PLANO.marco.map((v) => v / 2), n = [0, 0, 0, 0, 0]; let t = 0;
  for (let y = Math.ceil(y0); y < y1; y++) for (let x = Math.ceil(x0); x < x1; x++) { n[data[y * info.width + x]]++; t++; }
  const ha = (c) => (c * (PLANO.metro * 2) ** 2) / 1e4;
  console.log(`\nclases de tmp/clases.png (${info.width} × ${info.height}, 1 px = ${(PLANO.metro * 2).toFixed(2)} m), dentro de la guarda (${(ha(t) / 100).toFixed(1)} km²), antes de las correcciones del paso 2:`);
  NOMBRES.forEach((nm, i) => console.log(`  ${nm.padEnd(32)} ${String(n[i]).padStart(9)} px  ${ha(n[i]).toFixed(0).padStart(6)} ha  ${((100 * n[i]) / t).toFixed(2).padStart(6)} %`));
  out.clases = Object.fromEntries(NOMBRES.map((nm, i) => [nm, { px: n[i], ha: ha(n[i]), pct: (100 * n[i]) / t }]));
}
writeFileSync(new URL('./clases.json', import.meta.url), JSON.stringify(out, null, 1));
