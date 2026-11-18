// Empaca los datos de la ciudad para que viajen livianos: manzanas, techos, muros y árboles en un solo archivo
// (public/datos/ciudad.pak), con los bytes de cada registro reordenados por plano (todos los primeros bytes juntos,
// después todos los segundos…: así se parecen entre sí y comprimen mucho más) y comprimido con gzip. El visor lo
// descomprime con DecompressionStream; si el navegador no la tiene, pide los .bin sueltos de siempre.
//   formato, ya descomprimido:  [largo de la cabecera, uint32][cabecera JSON][partes, una tras otra]
//   cabecera: { partes: [{ nombre, bytes, registro }] }
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
const PARTES = [['manzanas', 40], ['techos', 16], ['muros', 16], ['arboles', 12]]; // nombre, bytes por registro
const planos = (buf, rec) => { const n = buf.length / rec, out = Buffer.alloc(buf.length); for (let k = 0; k < rec; k++) for (let i = 0; i < n; i++) out[k * n + i] = buf[i * rec + k]; return out; };
const cuerpos = [], cabecera = { partes: [] }; let suelto = 0;
for (const [nombre, registro] of PARTES) {
  const b = readFileSync(`public/datos/${nombre}.bin`); if (b.length % registro) throw new Error(`${nombre}.bin no es múltiplo de ${registro}`);
  cuerpos.push(planos(b, registro)); cabecera.partes.push({ nombre, bytes: b.length, registro }); suelto += b.length;
}
const cab = Buffer.from(JSON.stringify(cabecera)), largo = Buffer.alloc(4); largo.writeUInt32LE(cab.length);
writeFileSync('public/datos/ciudad.pak', gzipSync(Buffer.concat([largo, cab, ...cuerpos]), { level: 9 }));
console.log('ciudad.pak', (statSync('public/datos/ciudad.pak').size / 1e6).toFixed(2), 'MB  (sueltos:', (suelto / 1e6).toFixed(2), 'MB)');
