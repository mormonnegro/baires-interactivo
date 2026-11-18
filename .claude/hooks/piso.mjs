// El piso de modelo del proyecto, en un solo lugar: Claude Fable 5.2 (o Mythos 5.2) en adelante.
// Lo usan el aviso de arranque (modelo.mjs) y el control de los commits (tools/revisar-commits.mjs).
export const PISO = [5, 2];
export const PIDE = 'Claude Fable 5.2, esfuerzo medio o más';

// Vale para el identificador («claude-fable-5-2») y para el nombre de la firma del commit («Claude Fable 5.2»).
export function piso(texto) {
  const m = /(fable|mythos)[\s-]*(\d+)[.\s-]+(\d+)/i.exec(texto);
  if (!m) return /^(fable|mythos)$/i.test(texto.trim()); // el alias suelto apunta al último
  const [a, b] = [+m[2], +m[3]];
  return a > PISO[0] || (a === PISO[0] && b >= PISO[1]);
}
