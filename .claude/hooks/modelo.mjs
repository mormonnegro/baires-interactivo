// Al abrir el repo con Claude Code: avisa si el modelo es menor que el que pide el proyecto (COORDINAR.md).
// No bloquea nada ni manda nada a ningún lado: solo le deja el aviso a Claude, que se lo tiene que decir a la persona.
import { piso } from './piso.mjs';

let entrada = '';
process.stdin.on('data', (d) => (entrada += d));
process.stdin.on('end', () => {
  let modelo = '';
  try { modelo = JSON.parse(entrada).model || ''; } catch { /* sin dato: no se dice nada */ }
  if (!modelo || piso(modelo)) return;
  console.log(
    `AVISO DEL PROYECTO: esta sesión usa «${modelo}». Para aportar acá se pide como mínimo Claude Fable 5.2 con ` +
    'esfuerzo medio (COORDINAR.md). Decíselo a la persona antes de tocar nada y pedile que cambie con /model y /effort; ' +
    'lo hecho con un modelo menor no se acepta.'
  );
});
