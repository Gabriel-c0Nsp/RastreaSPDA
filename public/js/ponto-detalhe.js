import { getById, getSubAll, remove, formatDate } from './db.js';
import { emaFilter, detectAnomaly, dspStats } from './dsp.js';
import { renderNav, toast, icons, confirmDialog } from './utils.js';

// Alpha do filtro EMA e k de desvios-padrão para anomalia (ver dsp.js / CLAUDE.md)
const EMA_ALPHA = 0.3;
const ANOMALY_K = 2;

renderNav('pontos');

const params = new URLSearchParams(location.search);
const pontoId = params.get('id');
const mainContent = document.getElementById('main-content');

if (!pontoId) {
  mainContent.innerHTML = `<p style="color:var(--danger);padding:1rem">ID do ponto não informado.</p>`;
  throw new Error('pontoId ausente');
}

document.getElementById('btn-back').addEventListener('click', () => history.back());
document.getElementById('btn-delete').addEventListener('click', deletePonto);

async function loadPonto() {
  const [ponto, inspecoes] = await Promise.all([
    getById('pontos', pontoId),
    getSubAll('pontos', pontoId, 'inspecoes')
  ]);

  if (!ponto) {
    mainContent.innerHTML = `<p style="color:var(--danger);padding:1rem">Ponto não encontrado.</p>`;
    return;
  }

  const [area, tipo] = await Promise.all([
    getById('areas', ponto.areaId),
    getById('tiposPonto', ponto.tipoId)
  ]);

  document.getElementById('page-title').textContent = ponto.codigo;

  // --- Preparo do sinal DSP ---
  // inspecoes vem em ordem desc (mais recente primeiro); x[n] precisa ser cronológico.
  const cronologico = [...inspecoes].reverse();
  const serie = cronologico
    .filter(i => i.resistencia != null)
    .map(i => ({ valor: i.resistencia, data: i.timestamp }));
  const x = serie.map(s => s.valor);
  const podeDsp = x.length >= 2;

  let y = [], anomalias = [], mu = 0, sigma = 0;
  if (podeDsp) {
    y = emaFilter(EMA_ALPHA, x);
    anomalias = detectAnomaly(x, ANOMALY_K);
    ({ mu, sigma } = dspStats(x));
  }

  // Última inspeção
  const ultima = inspecoes[0];
  const statusBadge = ultima
    ? `<span class="badge ${ultima.conforme ? 'badge-success' : 'badge-danger'}">${ultima.conforme ? 'Conforme' : 'Não Conforme'}</span>`
    : `<span class="badge badge-neutral">Sem inspeção</span>`;

  mainContent.innerHTML = `
    <!-- Info do ponto -->
    <div class="card" style="margin-bottom:.75rem">
      <div class="card-body">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
          <span class="code-pill" style="font-size:1.125rem;padding:.35rem .75rem">${ponto.codigo}</span>
          ${statusBadge}
        </div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Tipo</div>
            <div class="info-value">${tipo?.nome || '—'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Área</div>
            <div class="info-value">${area?.nome || '—'}</div>
          </div>
          ${ponto.descricao ? `
          <div class="info-item" style="grid-column:1/-1">
            <div class="info-label">Localização</div>
            <div class="info-value" style="font-weight:400;font-size:.875rem">${ponto.descricao}</div>
          </div>` : ''}
        </div>
      </div>
    </div>

    <!-- Análise do Sinal (DSP) -->
    <div class="section-header">
      <span class="section-title">Análise do Sinal (DSP)</span>
    </div>
    <div class="card" style="margin-bottom:1.25rem">
      <div class="card-body">
        ${podeDsp ? `
          <div style="position:relative;height:260px">
            <canvas id="dsp-chart"></canvas>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:.75rem;margin-top:.75rem;font-size:.75rem;color:var(--text-muted)">
            <span>μ = ${mu.toFixed(2)} Ω</span>
            <span>σ = ${sigma.toFixed(2)} Ω</span>
            <span>EMA α = ${EMA_ALPHA}</span>
            <span>limite = μ ± ${ANOMALY_K}σ</span>
          </div>` : `
          <p style="color:var(--text-muted);font-size:.875rem;text-align:center;padding:1rem 0">
            Mínimo de 2 medições de resistência para análise DSP.
          </p>`}
      </div>
    </div>

    <!-- QR Code -->
    <div class="section-header">
      <span class="section-title">QR Code</span>
    </div>
    <div class="qr-box" style="margin-bottom:1.25rem">
      <div class="qr-code" id="qr-code"></div>
      <div>
        <div class="qr-label">${ponto.codigo}</div>
        <div class="qr-sub">${tipo?.nome || ''} · ${area?.nome || ''}</div>
      </div>
      <div style="display:flex;gap:.5rem">
        <button class="btn btn-secondary btn-sm" id="btn-download">
          ${icons.download} Baixar PNG
        </button>
        <button class="btn btn-secondary btn-sm" id="btn-share">
          Compartilhar URL
        </button>
      </div>
    </div>

    <!-- Botão nova inspeção -->
    <a href="inspecao.html?pontoId=${pontoId}" class="btn btn-primary btn-full" style="margin-bottom:1.25rem">
      ${icons.plus} Nova Inspeção
    </a>

    <!-- Histórico de inspeções -->
    <div class="section-header">
      <span class="section-title">Histórico (${inspecoes.length})</span>
    </div>
    <div id="insp-list">
      ${inspecoes.length ? renderInspecoes(inspecoes) : `
        <div class="empty-state" style="padding:2rem">
          ${icons.clipboard}
          <h3>Sem inspeções</h3>
          <p>Registre a primeira inspeção</p>
        </div>
      `}
    </div>
  `;

  // Gera QR Code
  const qrUrl = `${location.origin}/ponto-detalhe.html?id=${pontoId}`;
  // eslint-disable-next-line no-undef
  new QRCode(document.getElementById('qr-code'), {
    text: qrUrl,
    width: 180,
    height: 180,
    colorDark: '#0f172a',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M
  });

  // Gráfico DSP
  if (podeDsp) {
    renderDspChart({ serie, x, y, anomalias, mu, sigma });
  }

  document.getElementById('btn-download').addEventListener('click', () => downloadQR(ponto.codigo));
  document.getElementById('btn-share').addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({ title: `Ponto ${ponto.codigo}`, url: qrUrl });
    } else {
      navigator.clipboard.writeText(qrUrl);
      toast('URL copiada!', 'success');
    }
  });
}

function renderDspChart({ serie, x, y, anomalias, mu, sigma }) {
  const canvas = document.getElementById('dsp-chart');
  if (!canvas) return;

  if (typeof Chart === 'undefined') {
    toast('Não foi possível carregar a biblioteca de gráficos', 'danger');
    return;
  }

  const labels = x.map((_, n) => n);                 // eixo X = índice n
  const limSup = x.map(() => mu + ANOMALY_K * sigma);
  const limInf = x.map(() => mu - ANOMALY_K * sigma);

  // Cor de cada ponto de x[n]: vermelho onde há anomalia
  const corNormal = '#1d4ed8';
  const corAnomalia = '#dc2626';
  const pointColors = anomalias.map(a => (a ? corAnomalia : corNormal));
  const pointRadius = anomalias.map(a => (a ? 6 : 3));

  try {
    new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'x[n] — resistência (Ω)',
            data: x,
            borderColor: corNormal,
            backgroundColor: 'transparent',
            pointBackgroundColor: pointColors,
            pointBorderColor: pointColors,
            pointRadius,
            pointHoverRadius: 7,
            tension: 0,
            order: 1
          },
          {
            label: 'y[n] — EMA (α=' + EMA_ALPHA + ')',
            data: y,
            borderColor: '#16a34a',
            backgroundColor: 'transparent',
            pointRadius: 0,
            tension: 0.35,
            order: 2
          },
          {
            label: 'μ + ' + ANOMALY_K + 'σ',
            data: limSup,
            borderColor: 'rgba(220,38,38,.5)',
            borderDash: [6, 4],
            pointRadius: 0,
            tension: 0,
            order: 3
          },
          {
            label: 'μ − ' + ANOMALY_K + 'σ',
            data: limInf,
            borderColor: 'rgba(220,38,38,.5)',
            borderDash: [6, 4],
            pointRadius: 0,
            tension: 0,
            order: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            labels: { boxWidth: 12, font: { size: 11 }, usePointStyle: true }
          },
          tooltip: {
            callbacks: {
              title: (items) => {
                const n = items[0].dataIndex;
                const data = serie[n]?.data;
                return `n = ${n}` + (data ? ` · ${formatDate(data)}` : '');
              }
            }
          }
        },
        scales: {
          x: { title: { display: true, text: 'n (índice da inspeção)' } },
          y: { title: { display: true, text: 'Resistência (Ω)' } }
        }
      }
    });
  } catch (err) {
    console.error(err);
    toast('Erro ao renderizar gráfico DSP', 'danger');
  }
}

function renderInspecoes(inspecoes) {
  return inspecoes.map(i => `
    <div class="insp-card">
      <div class="insp-header">
        <div>
          <span class="badge ${i.conforme ? 'badge-success' : 'badge-danger'}">${i.conforme ? 'Conforme' : 'Não Conforme'}</span>
          <div class="insp-date">${formatDate(i.timestamp)}</div>
        </div>
        <span class="badge badge-neutral">${i.condicaoVisual || '—'}</span>
      </div>
      <div class="insp-values">
        <div>
          <div class="insp-val-label">Resistência</div>
          <div class="insp-val">${i.resistencia != null ? i.resistencia + ' Ω' : '—'}</div>
        </div>
        <div>
          <div class="insp-val-label">Continuidade</div>
          <div class="insp-val">${i.continuidade != null ? i.continuidade + ' mΩ' : '—'}</div>
        </div>
      </div>
      ${i.observacoes ? `<div class="insp-obs">"${i.observacoes}"</div>` : ''}
    </div>
  `).join('');
}

function downloadQR(codigo) {
  const canvas = document.querySelector('#qr-code canvas');
  if (!canvas) { toast('QR Code ainda não gerado', 'warning'); return; }
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `QR_${codigo}.png`;
  a.click();
}

async function deletePonto() {
  if (!confirmDialog('Excluir este ponto permanentemente? As inspeções registradas não serão recuperáveis.')) return;
  try {
    await remove('pontos', pontoId);
    toast('Ponto excluído', 'success');
    setTimeout(() => location.href = 'pontos.html', 800);
  } catch (err) {
    console.error(err);
    toast('Erro ao excluir', 'danger');
  }
}

loadPonto().catch(err => {
  console.error(err);
  toast('Erro ao carregar ponto', 'danger');
});
