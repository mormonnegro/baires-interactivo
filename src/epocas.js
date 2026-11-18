// La línea de tiempo: la ciudad que crece y cambia. Al elegir un año no se cambia de plano: sobre la ciudad de 1867 se
// levantan las casas que traen los planos que siguen, hasta 1940 (tools/crece.mjs las deja listas, con el mismo dibujo
// que las demás), el suelo se va cubriendo de manzanas y calles, el río retrocede donde se le ganó tierra para el
// puerto, y se demuele lo que estaba en la traza de las avenidas y las plazas nuevas (la Avenida de Mayo, las
// diagonales, la 9 de Julio). Los datos se bajan recién la primera vez que se sale de 1867.
import { pedir } from './url.js';

const BASE = { año: 1867, titulo: 'Plano topográfico de la ciudad de Buenos Aires y de todo su municipio', autor: 'Carlos Glade, Departamento Topográfico de la Provincia' };
const SUBE = 0.9, BAJA = 0.6; // segundos por etapa (corto: el cambio se nota más de golpe)

/** `cargar()` baja y arma lo que crece (una promesa); `alCambiar(año)` avisa cada cambio; `pedirCuadro()` pide dibujar. */
export function createEpocas(el, U, { cargar, alCambiar, pedirCuadro }) {
  let lista = [BASE], destino = 0, k = 0, listo = false, pedido = null, falla = false, andando = false, apuro = 1;
  const pie = el.querySelector('.pie'), fila = el.querySelector('.años');
  const miles = (n) => (n >= 1000 ? `${Math.round(n / 100) / 10} mil`.replace('.', ',') : String(n));
  const rotular = () => {
    const e = lista[destino];
    for (const b of fila.querySelectorAll('button[data-a]')) { const on = +b.dataset.a === e.año; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }
    const ver = fila.querySelector('.andar'); if (ver) { ver.textContent = andando ? '❚❚' : '▶'; ver.title = andando ? 'Detener' : `Ver cambiar la ciudad, de 1867 a ${lista[lista.length - 1].año}`; ver.setAttribute('aria-label', ver.title); }
    pie.textContent = destino === 0 ? '' : falla ? 'No se pudo cargar. Tocá el año otra vez para reintentar.' : !listo ? `Cargando la ciudad de ${e.año}…`
      : `${e.obras ? `${e.obras} ` : ''}Unas ${miles(lista.slice(1, destino + 1).reduce((t, x) => t + (x.casas || 0), 0))} casas nuevas desde 1867. Sale del ${e.corto ?? `«${e.titulo}», de ${e.plano ?? e.año}`}.`;
    el.classList.toggle('otra', destino !== 0); el.classList.toggle('aviso', destino !== 0 && (falla || !listo));
  };
  // (en el teléfono la nota del año se muestra un rato y se guarda, para no tapar la ciudad: index.html)
  let fresca = 0;
  const asomar = () => { el.classList.add('fresca'); clearTimeout(fresca); fresca = setTimeout(() => el.classList.remove('fresca'), 9000); };
  const asegurar = () => (pedido ??= cargar().then(() => { listo = true; falla = false; rotular(); asomar(); pedirCuadro(3); }).catch((e) => { console.warn(e); pedido = null; falla = true; rotular(); }));
  function ir(i) {
    if (i === destino && !falla) return;
    // (un salto largo no tarda más que un segundo y medio: las etapas del medio pasan más rápido)
    destino = i; falla = false; apuro = Math.max(1, Math.abs(i - k) / 1.7); if (i > 0) asegurar();
    rotular(); asomar(); alCambiar(lista[i].año); pedirCuadro(3);
  }
  let pendiente = null; // (un año pedido antes de que llegue la lista)
  const elegir = (año) => { const i = lista.findIndex((x) => x.año === año); if (i < 0) { pendiente = año; return; } andando = false; asomar(); ir(i); };
  /** De 1867 al último año, parando un momento en cada plano. */
  let pausa = 0;
  const andar = () => { if (andando) { andando = false; rotular(); return; } andando = true; pausa = 0; if (destino === lista.length - 1) { ir(0); pausa = 0.5; } else ir(destino + 1); rotular(); };

  const indice = pedir('datos/crece.json').then((r) => (r.ok ? r.json() : null)).then((j) => {
    if (!j?.epocas?.length) return;
    lista = [BASE, ...j.epocas].sort((a, b) => a.año - b.año); U.uEtapas.value = lista.length - 1;
    const boton = (txt, alTocar) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = txt; b.addEventListener('click', alTocar); return b; };
    fila.replaceChildren(...lista.map((e) => { const b = boton(e.año, () => elegir(e.año)); b.dataset.a = e.año; b.title = e.año === 1867 ? 'La ciudad del plano de 1867' : `La ciudad hacia ${e.año}`; return b; }), Object.assign(boton('▶', andar), { className: 'andar' }));
    rotular(); el.hidden = false;
    if (pendiente) { const a = pendiente; pendiente = null; elegir(a); }
  }).catch(() => {});

  return {
    elegir, andar, get año() { return lista[destino].año; }, get lista() { return lista.map((e) => e.año); },
    /** la etapa que se está viendo, redondeada (0 = 1867, 1 = el plano que sigue…): para saber contra qué casas se choca al caminar */
    get etapa() { return Math.round(k); },
    /** espera a que lo del año elegido esté (para las capturas) */
    lista_: () => indice.then(() => (destino ? asegurar() : null)),
    /** Avanza hacia el año elegido; devuelve si sigue moviéndose. `ya`: sin animar (las capturas). */
    update(dt, ya = false) {
      const d = destino === 0 || listo ? destino : Math.min(destino, 0), k0 = k;
      if (k !== d) k = ya ? d : k < d ? Math.min(d, k + (dt * apuro) / SUBE) : Math.max(d, k - (dt * Math.max(1, apuro * 0.6)) / BAJA);
      U.uEpocaK.value = k;
      // (con el ▶: al llegar a cada plano, un respiro y al siguiente)
      if (andando && listo && k === destino) { pausa += dt; if (pausa > 1.1) { pausa = 0; if (destino < lista.length - 1) ir(destino + 1); else { andando = false; rotular(); } } return true; }
      return k !== k0;
    },
  };
}
