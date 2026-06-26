// ── nao-conformidade.js ───────────────────────────────────────────────────
import { renderNav, toast, emptyState, icons } from './utils.js';
import { getAll, getSubAll, formatDate } from './db.js';
import { emaFilter, detectAnomaly } from './dsp.js';

renderNav('alertas');

const alertList    = document.getElementById('alert-list');
const filterTipo   = document.getElementById('filter-tipo');
const filterCliente = document.getElementById('filter-cliente');
const cntAnomalias  = document.getElementById('count-anomalias');
const cntNaoConf    = document.getElementById('count-nao-conformes');
const cntRuim       = document.getElementById('count-ruim');
const cntSemInsp    = document.getElementById('count-sem-insp');

let todosAlertas = [];
let clientes     = {};
let areas        = {};

async function init() {
  try {
    // Carrega metadados
    const [cls, ars, tiposLista] = await Promise.all([
      getAll('clientes', 'nome'),
      getAll('areas'),
      getAll('tiposPonto')
    ]);

    // Mapa cliente
    cls.forEach(c => { clientes[c.id] = c; });
    const selCliente = filterCliente;
    cls.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id; o.textContent = c.nome;
      selCliente.appendChild(o);
    });

    // Mapa área
    ars.forEach(a => { areas[a.id] = a; });

    // Mapa tipo
    const tiposMap = {};
    tiposLista.forEach(t => { tiposMap[t.id] = t; });

    // Carrega todos os pontos e suas inspeções
    const pontos = await getAll('pontos');
    todosAlertas = [];

    const ALPHA = parseFloat(localStorage.getItem('dsp_alpha') || '0.3');
    const K     = parseFloat(localStorage.getItem('dsp_k')     || '2');

    for (const ponto of pontos) {
      const area     = areas[ponto.areaId]    || {};
      const cliente  = clientes[area.clienteId] || {};
      const tipo     = tiposMap[ponto.tipoId]  || {};

      const inspecoes = await getSubAll('pontos', ponto.id, 'inspecoes');

      // Sem inspeção
      if (inspecoes.length === 0) {
        todosAlertas.push({
          tipo: 'sem-inspecao',
          ponto, area, cliente, tipo, inspecoes,
          titulo: `${ponto.codigo} — Sem inspeção registrada`,
          detalhe: `Área: ${area.nome || '—'} · ${cliente.nome || '—'}`,
          severity: 'warning',
        });
        continue;
      }

      const ultima = inspecoes[0]; // ordenado desc

      // Não conforme
      if (ultima.conforme === false) {
        todosAlertas.push({
          tipo: 'nao-conforme',
          ponto, area, cliente, tipo, inspecoes, inspecao: ultima,
          titulo: `${ponto.codigo} — Não conforme`,
          detalhe: `Última inspeção: ${formatDate(ultima.timestamp)} · ${cliente.nome || '—'}`,
          severity: 'danger',
        });
      }

      // Condição visual ruim/crítica
      if (ultima.condicaoVisual === 'Ruim' || ultima.condicaoVisual === 'Crítica') {
        todosAlertas.push({
          tipo: 'condicao',
          ponto, area, cliente, tipo, inspecoes, inspecao: ultima,
          titulo: `${ponto.codigo} — Condição ${ultima.condicaoVisual}`,
          detalhe: `Última inspeção: ${formatDate(ultima.timestamp)} · ${cliente.nome || '—'}`,
          severity: 'danger',
        });
      }

      // Anomalia DSP (EMA)
      if (inspecoes.length >= 3) {
        const serie  = inspecoes.map(i => i.resistencia || 0).reverse(); // ordem cronológica
        const flags  = detectAnomaly(serie, K);
        const nAnoms = flags.filter(Boolean).length;
        if (nAnoms > 0) {
          const idxAnomalo = flags.lastIndexOf(true);
          todosAlertas.push({
            tipo: 'anomalia',
            ponto, area, cliente, tipo, inspecoes,
            titulo: `${ponto.codigo} — Anomalia DSP detectada`,
            detalhe: `n=${idxAnomalo}: ${serie[idxAnomalo].toFixed(1)} Ω · ${cliente.nome || '—'} · α=${ALPHA} k=${K}σ`,
            severity: 'danger',
            nAnoms,
          });
        }
      }
    }

    // Contadores
    cntAnomalias.textContent = todosAlertas.filter(a => a.tipo === 'anomalia').length;
    cntNaoConf.textContent   = todosAlertas.filter(a => a.tipo === 'nao-conforme').length;
    cntRuim.textContent      = todosAlertas.filter(a => a.tipo === 'condicao').length;
    cntSemInsp.textContent   = todosAlertas.filter(a => a.tipo === 'sem-inspecao').length;

    render();

  } catch (err) {
    alertList.innerHTML = `<div class="empty-state"><p style="color:var(--danger)">Erro: ${err.message}</p></div>`;
    console.error(err);
  }
}

function render() {
  const tipoFiltro    = filterTipo.value;
  const clienteFiltro = filterCliente.value;

  let lista = todosAlertas;
  if (tipoFiltro !== 'all') lista = lista.filter(a => a.tipo === tipoFiltro);
  if (clienteFiltro)        lista = lista.filter(a => a.cliente?.id === clienteFiltro);

  if (lista.length === 0) {
    alertList.innerHTML = emptyState('check', 'Nenhum alerta encontrado', 'Todos os pontos estão conformes!');
    return;
  }

  alertList.innerHTML = lista.map(a => {
    const iconSvg = a.severity === 'danger'
      ? icons.x
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

    return `
      <a href="ponto-detalhe.html?pontoId=${a.ponto.id}" class="list-item">
        <div class="item-icon ${a.severity}">${iconSvg}</div>
        <div class="item-body">
          <p class="item-title">${a.titulo}</p>
          <p class="item-subtitle">${a.detalhe}</p>
        </div>
        <div>${icons.chevronRight}</div>
      </a>
    `;
  }).join('');
}

filterTipo.addEventListener('change', render);
filterCliente.addEventListener('change', render);

init();
