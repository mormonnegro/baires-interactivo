// Mira la firma que Claude Code deja en cada commit («Co-Authored-By: Claude … <noreply@anthropic.com>») y dice
// si alguno se hizo con un modelo menor que el que pide el proyecto (COORDINAR.md).
//   node tools/revisar-commits.mjs [base]      base: la rama contra la que se compara (por omisión origin/main)
// Sale con error si hay un commit de un modelo menor. Los commits sin firma no fallan: se listan para que el
// dueño los mire. El esfuerzo no queda escrito en el commit: se declara en el pull request.
import { execFileSync } from 'node:child_process';
import { piso, PIDE } from '../.claude/hooks/piso.mjs';

const base = process.argv[2] || 'origin/main';
const git = (...a) => execFileSync('git', a, { encoding: 'utf8' });
const lista = git('log', '--no-merges', '--format=%H%x1f%s%x1f%(trailers:key=Co-Authored-By,valueonly,separator=%x1e)%x1d', `${base}..HEAD`)
  .split('\x1d').map((t) => t.trim()).filter(Boolean);

let mal = 0, sinFirma = 0;
for (const t of lista) {
  const [hash, asunto, firmas = ''] = t.split('\x1f');
  const claude = firmas.split('\x1e').filter((f) => /noreply@anthropic\.com/i.test(f)).map((f) => f.replace(/\s*<.*$/, ''));
  const corto = `${hash.slice(0, 7)} ${asunto}`;
  if (!claude.length) { sinFirma++; console.log(`  ?  ${corto}  (sin firma de Claude: hecho a mano o con la firma apagada)`); continue; }
  const menor = claude.filter((n) => !piso(n));
  if (menor.length) { mal++; console.log(`  ✗  ${corto}  (${menor.join(', ')})`); } else console.log(`  ✓  ${corto}  (${claude.join(', ')})`);
}

if (!lista.length) console.log(`No hay commits nuevos respecto de ${base}.`);
if (sinFirma) console.log(`\n${sinFirma} sin firma: no fallan, pero decí en el pull request cómo se hicieron.`);
if (mal) {
  console.log(`\n${mal} commit(s) con un modelo menor al pedido (${PIDE}). Rehacelos con /model fable y /effort medium.`);
  process.exit(1);
}
