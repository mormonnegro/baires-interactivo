// Cuenta, sin citar texto, cómo fue el trabajo entre el humano y el agente según el historial de sesiones de Claude
// Code de este proyecto (archivos .jsonl del directorio de sesiones, que se pasa como argumento). Solo lee.
//   node paper/medidas/historial.mjs <directorio de sesiones> [--excluir <id>] > paper/medidas/historial.txt
// Con --mensajes imprime además el comienzo de cada pedido humano (para leerlos; esa salida no se guarda).
import { readdirSync, createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { join } from 'node:path';

const dir = process.argv[2], excluir = process.argv.includes('--excluir') ? process.argv[process.argv.indexOf('--excluir') + 1] : null, ver = process.argv.includes('--mensajes');
const tot = { sesiones: 0, delegadas: 0, encargos: 0, avisos: 0, terminadas: 0, pedidos: 0, imagenes: 0, turnosAgente: 0, herramientas: {}, modelos: {}, subagentes: 0, capturas: 0, pruebas: 0, desde: null, hasta: null, caracteresPedidos: 0 };
const PRUEBAS = /tools\/(fichas|modos|autos|vitrina|telefono|tactil|carga|vivo|busca)\.mjs/;
for (const f of readdirSync(dir).filter((f) => f.endsWith('.jsonl')).sort()) {
  if (excluir && f.startsWith(excluir)) continue;
  tot.sesiones++;
  const s = { pedidos: 0, herramientas: 0, subagentes: 0 };
  for await (const linea of createInterface({ input: createReadStream(join(dir, f)), crlfDelay: Infinity })) {
    let o; try { o = JSON.parse(linea); } catch { continue; }
    if (o.isSidechain) continue;
    if (o.timestamp) { if (!tot.desde || o.timestamp < tot.desde) tot.desde = o.timestamp; if (!tot.hasta || o.timestamp > tot.hasta) tot.hasta = o.timestamp; }
    const c = o.message?.content;
    if (o.type === 'user' && !o.isMeta) {
      const partes = typeof c === 'string' ? [{ type: 'text', text: c }] : Array.isArray(c) ? c : [];
      if (partes.some((p) => p.type === 'tool_result')) continue;
      const texto = partes.filter((p) => p.type === 'text').map((p) => p.text).join(' ').trim();
      if (!texto || /^<(command-|local-command|system-reminder|task-notification)/.test(texto) || /^This session is being continued/.test(texto) || /^\[Request interrupted/.test(texto) || /^The user hasn't heard/.test(texto)) continue;
      if (/^Act as the /.test(texto)) { tot.encargos++; tot.delegadas++; continue; } // el encargo escrito por el agente principal a un subagente
      if (/^Delegated task /.test(texto)) { tot.terminadas++; continue; } // el aviso de que un subagente terminó
      if (/^(Aviso|Un cambio de coordinación)/.test(texto)) { tot.avisos++; continue; } // avisos de coordinación del agente principal
      tot.pedidos++; s.pedidos++; tot.caracteresPedidos += texto.length; tot.imagenes += partes.filter((p) => p.type === 'image').length;
      if (ver) console.log(`  [${f.slice(0, 8)} ${String(o.timestamp).slice(0, 16)}] ${texto.replace(/\s+/g, ' ').slice(0, 260)}`);
    } else if (o.type === 'assistant' && Array.isArray(c)) {
      tot.turnosAgente++; if (o.message.model) tot.modelos[o.message.model] = (tot.modelos[o.message.model] ?? 0) + 1;
      for (const p of c) if (p.type === 'tool_use') {
        tot.herramientas[p.name] = (tot.herramientas[p.name] ?? 0) + 1; s.herramientas++;
        if (p.name === 'Agent' || p.name === 'Task') { tot.subagentes++; s.subagentes++; }
        const cmd = p.input?.command ?? '';
        if (/tools\/shot\.mjs/.test(cmd)) tot.capturas++;
        if (PRUEBAS.test(cmd)) tot.pruebas++;
      }
    }
  }
  if (!ver) console.log(`sesión ${f.slice(0, 8)}: ${s.pedidos} pedidos humanos, ${s.herramientas} llamadas a herramientas, ${s.subagentes} subagentes`);
}
if (!ver) {
  console.log(`\nsesiones: ${tot.sesiones}${excluir ? ' (sin contar la que escribe este artículo)' : ''} · de ${String(tot.desde).slice(0, 10)} a ${String(tot.hasta).slice(0, 10)}`);
  console.log(`sesiones delegadas (abren con un encargo escrito por el agente principal): ${tot.delegadas} · avisos de coordinación entre agentes: ${tot.avisos} · avisos de tarea terminada: ${tot.terminadas}`);
  console.log(`pedidos humanos (mensajes escritos por la persona): ${tot.pedidos}, con ${tot.imagenes} imágenes adjuntas; largo medio ${Math.round(tot.caracteresPedidos / Math.max(1, tot.pedidos))} caracteres`);
  console.log(`turnos del agente: ${tot.turnosAgente} · llamadas a herramientas: ${Object.values(tot.herramientas).reduce((a, b) => a + b, 0)}`);
  console.log('modelo que firma cada turno: ' + Object.entries(tot.modelos).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', '));
  console.log('por herramienta: ' + Object.entries(tot.herramientas).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => `${k} ${v}`).join(', '));
  console.log(`subagentes lanzados: ${tot.subagentes} · corridas de tools/shot.mjs (capturas): ${tot.capturas} · corridas de las pruebas automáticas: ${tot.pruebas}`);
}
