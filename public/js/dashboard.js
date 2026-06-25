import { getAll, getSubAll, formatDate } from './db.js';
import { renderNav, toast, icons } from './utils.js';

renderNav('dashboard');

async function loadStats() {
  const [clientes, areas, pontos] = await Promise.all([
    getAll('clientes'),
    getAll('areas'),
    getAll('pontos')
  ]);

  // Carrega todas as inspeções de todos os pontos
  const inspecoesPromises = pontos.map(p => getSubAll('pontos', p.id, 'inspecoes'));
  const inspecoesPorPonto = await Promise.all(inspecoesPromises);
  const todasInspecoes = inspecoesPorPonto.flat();

  // Stats
  const grid = document.getElementById('stats-grid');
  grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${clientes.length}</div>
      <div class="stat-label">Clientes</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${areas.length}</div>
      <div class="stat-label">Áreas</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${pontos.length}</div>
      <div class="stat-label">Pontos</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${todasInspecoes.length}</div>
      <div class="stat-label">Inspeções</div>
    </div>
  `;

  // Chart conformidade (donut)
  const conformes = todasInspecoes.filter(i => i.conforme).length;
  const naoConformes = todasInspecoes.length - conformes;
  const ctxDonut = document.getElementById('chart-conformidade').getContext('2d');
  new Chart(ctxDonut, {
    type: 'doughnut',
    data: {
      labels: ['Conformes', 'Não Conformes'],
      datasets: [{
        data: [conformes, naoConformes],
        backgroundColor: ['#059669', '#dc2626'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 16, font: { size: 13 } } }
      },
      cutout: '65%'
    }
  });

  // Chart inspeções por mês (bar)
  const meses = getUltimos6Meses();
  const contagemPorMes = meses.map(m => {
    return todasInspecoes.filter(i => {
      const d = tsToDate(i.timestamp);
      return d && `${d.getFullYear()}-${d.getMonth()}` === m.key;
    }).length;
  });

  const ctxBar = document.getElementById('chart-meses').getContext('2d');
  new Chart(ctxBar, {
    type: 'bar',
    data: {
      labels: meses.map(m => m.label),
      datasets: [{
        label: 'Inspeções',
        data: contagemPorMes,
        backgroundColor: '#1d4ed8',
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#e2e8f0' } },
        x: { grid: { display: false } }
      }
    }
  });

  // Inspeções recentes
  const pontoMap = Object.fromEntries(pontos.map(p => [p.id, p]));
  const recentes = todasInspecoes
    .map(i => ({ ...i, _pontoId: i._pontoId }))
    .sort((a, b) => tsToDate(b.timestamp) - tsToDate(a.timestamp))
    .slice(0, 10);

  // Para mapear inspecao → ponto, precisamos reconstruir com pontoId
  const inspecoesComPonto = [];
  inspecoesPorPonto.forEach((arr, idx) => {
    arr.forEach(i => inspecoesComPonto.push({ ...i, pontoId: pontos[idx].id }));
  });
  const recentesComPonto = inspecoesComPonto
    .sort((a, b) => tsToDate(b.timestamp) - tsToDate(a.timestamp))
    .slice(0, 10);

  const recentList = document.getElementById('recent-list');
  if (!recentesComPonto.length) {
    recentList.innerHTML = `
      <div class="empty-state">
        ${icons.clipboard}
        <h3>Sem inspeções ainda</h3>
        <p>Escaneie um QR Code para registrar a primeira inspeção</p>
      </div>
    `;
    return;
  }

  recentList.innerHTML = recentesComPonto.map(i => {
    const ponto = pontoMap[i.pontoId];
    const isConforme = i.conforme;
    return `
      <a class="list-item" href="ponto-detalhe.html?id=${i.pontoId}">
        <div class="item-icon ${isConforme ? 'success' : 'danger'}">${isConforme ? icons.check : icons.x}</div>
        <div class="item-body">
          <div class="item-title">${ponto?.codigo || i.pontoId}</div>
          <div class="item-subtitle">${i.condicaoVisual || '—'} · ${formatDate(i.timestamp)}</div>
        </div>
        <span class="badge ${isConforme ? 'badge-success' : 'badge-danger'}">${isConforme ? 'OK' : 'NOK'}</span>
      </a>
    `;
  }).join('');
}

function getUltimos6Meses() {
  const result = [];
  const now = new Date();
  const mesesPt = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: `${mesesPt[d.getMonth()]} ${d.getFullYear()}` });
  }
  return result;
}

function tsToDate(ts) {
  if (!ts) return null;
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return new Date(ts);
}

loadStats().catch(err => {
  console.error(err);
  toast('Erro ao carregar dados', 'danger');
});
