import { getById, addSub } from './db.js';
import { renderNav, toast, icons } from './utils.js';

renderNav('pontos');

const params = new URLSearchParams(location.search);
const pontoId = params.get('pontoId');

const pontoInfo = document.getElementById('ponto-info');
const form = document.getElementById('form-inspecao');
const btnSubmit = document.getElementById('btn-submit');
const btnBack = document.getElementById('btn-back');
const btnCancel = document.getElementById('btn-cancel');

const backUrl = pontoId ? `ponto-detalhe.html?id=${pontoId}` : 'pontos.html';
btnBack.href = backUrl;
btnCancel.href = backUrl;

if (!pontoId) {
  pontoInfo.innerHTML = `<div class="card-body" style="color:var(--danger)">pontoId não informado na URL.</div>`;
  throw new Error('pontoId ausente');
}

async function loadPontoInfo() {
  const ponto = await getById('pontos', pontoId);
  if (!ponto) {
    pontoInfo.innerHTML = `<div class="card-body" style="color:var(--danger)">Ponto não encontrado.</div>`;
    return;
  }

  const [area, tipo] = await Promise.all([
    getById('areas', ponto.areaId),
    getById('tiposPonto', ponto.tipoId)
  ]);

  document.getElementById('page-title').textContent = `Inspecionar ${ponto.codigo}`;

  pontoInfo.innerHTML = `
    <div class="card-body" style="display:flex;align-items:center;gap:.75rem">
      <div class="item-icon">${icons.clipboard}</div>
      <div>
        <div style="font-weight:700;font-size:1rem">${ponto.codigo}</div>
        <div style="font-size:.8125rem;color:var(--text-muted)">${tipo?.nome || '—'} · ${area?.nome || '—'}</div>
        ${ponto.descricao ? `<div style="font-size:.8125rem;color:var(--text-muted)">${ponto.descricao}</div>` : ''}
      </div>
    </div>
  `;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const condicaoVisual = document.getElementById('f-condicao-visual').value;
  if (!condicaoVisual) { toast('Selecione a condição visual', 'warning'); return; }

  const resistencia = document.getElementById('f-resistencia').value;
  const continuidade = document.getElementById('f-continuidade').value;
  const conforme = document.getElementById('f-conforme').checked;
  const observacoes = document.getElementById('f-observacoes').value.trim();

  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Registrando…';

  try {
    await addSub('pontos', pontoId, 'inspecoes', {
      resistencia: resistencia !== '' ? parseFloat(resistencia) : null,
      continuidade: continuidade !== '' ? parseFloat(continuidade) : null,
      condicaoVisual,
      conforme,
      observacoes: observacoes || null
    });

    toast('Inspeção registrada com sucesso!', 'success');
    setTimeout(() => location.href = backUrl, 900);
  } catch (err) {
    console.error(err);
    toast('Erro ao registrar inspeção', 'danger');
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = `${icons.check} Registrar`;
  }
});

loadPontoInfo().catch(err => {
  console.error(err);
  toast('Erro ao carregar ponto', 'danger');
});
