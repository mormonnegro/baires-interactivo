// El viaducto de Palermo: a qué altura van las vías que cruzan el parque. Lo usan src/vias.js (los trenes de Retiro
// suben con él), tools/palermo.mjs (que arma los arcos) y src/lugares/palermo.js.
// Supuesto: 5,5 m de alto en todo el parque, con la rampa del lado de Retiro en 200 m antes de la avenida Sarmiento y
// las bajadas pasados los últimos puentes (hacia Belgrano, hacia Colegiales y hacia Villa Crespo). Los ferrocarriles
// Central Argentino y Buenos Aires al Pacífico levantaron estas vías entre 1912 y 1916; acá van desde la etapa de 1921.
export const ALTO_VIADUCTO = 5.5;
const sube = (t) => ALTO_VIADUCTO * Math.min(1, Math.max(0, t));
/** la altura de las vías en un punto del plano (px, py), en metros */
export function altoVia(px, py) {
  if (py >= 5260) return sube((5560 - py) / 300);                         // la rampa, viniendo de Retiro
  if (px > 17790 && py < 3700) return sube((18006 - px) / 216);           // la bajada hacia Belgrano
  if (px < 15392 && py < 2400) return sube((px - 15000) / 392);           // pasado el puente Pacífico, hacia Villa Crespo
  if (py < 1625 && px > 16000 && px < 17000) return sube((py - 1300) / 325); // hacia Colegiales
  return ALTO_VIADUCTO;
}
