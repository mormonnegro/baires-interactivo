// La dirección de un archivo de public/, con la versión de lo publicado pegada (?v=…). Esos archivos se sirven con
// caché larga (public/_headers): la versión cambia cuando cambia cualquiera de ellos, y así nunca queda uno viejo.
// La calcula vite.config.mjs, que además adelanta en index.html los pedidos de lo primero que hace falta.
export const u = (ruta) => `${ruta}?v=${__V__}`;

/** Pide un archivo de public/. Si index.html ya lo había pedido (window.__pre), usa ese pedido; si no, o si falló, lo hace. */
const adelantados = globalThis.__pre ?? {};
export function pedir(ruta) {
  const p = adelantados[ruta]; delete adelantados[ruta];
  return p ? p.then((r) => (r.ok ? r : fetch(u(ruta))), () => fetch(u(ruta))) : fetch(u(ruta));
}
