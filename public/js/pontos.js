import { getAll, getById, getWhere2, add, update, remove } from './db.js';
import { renderNav, toast, icons, openModal, closeModal, confirmDialog } from './utils.js';

renderNav('pontos');

let pontos = [];
let clientes = [];
let areas = [];
let tipos = [];

const listContainer = document.getElementById('list-container');
const filterCliente = document.getElementById('filter-cliente');
const filterArea = document.getElementById('filter-area');
const modal = document.getElementById('modal');
const fClienteForm = document.getElementById('f-cliente');
const fAreaForm = document.getElementById('f-area');
const fTipo = document.getElementById('f-tipo');
const codigoPreview = document.getElementById('codigo-preview');
const form = document.getElementById('form');
const btnSave = document.getElementById('btn-save');

const params = new URLSearchParams(location.search);

document.getElementById('btn-add').addEventListener('click', () => openForm());
document.getElementById('btn-close').addEventListener('click', () => closeForm());
document.getElementById('btn-cancel').addEventListener('click', () => closeForm());
modal.addEventListener('click', e => { if (e.target === modal) closeForm(); });
filterCliente.addEventListener('change', onFilterClienteChange);
filterArea.addEventListener('change', renderList);
form.addEventListener('submit', savePonto);
fClienteForm.addEventListener('change', onFormClienteChange);
fAreaForm.addEventListener('change', updateCodigoPreview);
fTipo.addEventListener('change', updateCodigoPreview);

async function loadData() {
  listContainer.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
  [clientes, areas, tipos, pontos] = await Promise.all([
    getAll('clientes', 'nome'),
    getAll('areas', 'nome'),
    getAll('tiposPonto', 'nome'),
    getAll('pontos', 'codigo')
  ]);

  const cliOpts = clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
  filterCliente.innerHTML = `<option value="">Todos os clientes</option>` + cliOpts;
  fClienteForm.innerHTML = `<option value="">Selecione…</option>` + cliOpts;
  fTipo.innerHTML = `<option value="">Selecione…</option>` + tipos.map(t => `<option value="${t.id}">${t.nome} (${t.sigla})</option>`).join('');

  // Se vier URL params
  const areaIdParam = params.get('areaId');
  if (areaIdParam) {
    const a = areas.find(x => x.id === areaIdParam);
    if (a) {
      filterCliente.value = a.clienteId;
      onFilterClienteChange();
      filterArea.value = areaIdParam;
    }
  }

  renderList();
}

function onFilterClienteChange() {
  const cid = filterCliente.value;
  const areaDaArea = areas.filter(a => !cid || a.clienteId === cid);
  filterArea.innerHTML = `<option value="">Todas as áreas</option>` + areaDaArea.map(a => `<option value="${a.id}">${a.nome}</option>`).join('');
  renderList();
}

async function onFormClienteChange() {
  const cid = fClienteForm.value;
  const areaDaArea = areas.filter(a => a.clienteId === cid);
  fAreaForm.innerHTML = `<option value="">Selecione…</option>` + areaDaArea.map(a => `<option value="${a.id}">${a.nome} (${a.sigla})</option>`).join('');
  codigoPreview.textContent = '—';
}

async function updateCodigoPreview() {
  const areaId = fAreaForm.value;
  const tipoId = fTipo.value;
  if (!areaId || !tipoId) { codigoPreview.textContent = '—'; return; }
  try {
    const codigo = await gerarCodigo(areaId, tipoId);
    codigoPreview.textContent = codigo;
  } catch {
    codigoPreview.textContent = '—';
  }
}

async function gerarCodigo(areaId, tipoId) {
  const [area, tipo, existentes] = await Promise.all([
    getById('areas', areaId),
    getById('tiposPonto', tipoId),
    getWhere2('pontos', 'areaId', '==', areaId, 'tipoId', '==', tipoId)
  ]);
  const seq = String(existentes.length + 1).padStart(3, '0');
  return `${area.sigla}-${tipo.sigla}-${seq}`;
}

function renderList() {
  const cid = filterCliente.value;
  const aid = filterArea.value;

  const areaIds = aid
    ? [aid]
    : (cid ? areas.filter(a => a.clienteId === cid).map(a => a.id) : null);

  const filtered = areaIds
    ? pontos.filter(p => areaIds.includes(p.areaId))
    : pontos;

  if (!filtered.length) {
    listContainer.innerHTML = `
      <div class="empty-state">
        ${icons.clipboard}
        <h3>Nenhum ponto cadastrado</h3>
        <p>Toque no + para adicionar o primeiro ponto de inspeção</p>
      </div>
    `;
    return;
  }

  const areaMap = Object.fromEntries(areas.map(a => [a.id, a]));
  const tipoMap = Object.fromEntries(tipos.map(t => [t.id, t]));

  listContainer.innerHTML = filtered.map(p => {
    const area = areaMap[p.areaId];
    const tipo = tipoMap[p.tipoId];
    return `
      <a class="list-item" href="ponto-detalhe.html?id=${p.id}">
        <div class="item-icon">${icons.clipboard}</div>
        <div class="item-body">
          <div class="item-title"><span class="code-pill">${p.codigo}</span></div>
          <div class="item-subtitle">${tipo?.nome || '—'} · ${area?.nome || '—'}</div>
        </div>
        <div class="item-actions">
          <button class="icon-btn del" onclick="deletePonto(event,'${p.id}')" title="Excluir">${icons.trash}</button>
          ${icons.chevronRight}
        </div>
      </a>
    `;
  }).join('');
}

function openForm() {
  fClienteForm.value = filterCliente.value || '';
  onFormClienteChange();
  fAreaForm.value = filterArea.value || '';
  fTipo.value = '';
  codigoPreview.textContent = '—';
  document.getElementById('f-descricao').value = '';
  openModal('modal');
}

function closeForm() {
  closeModal('modal');
  form.reset();
  codigoPreview.textContent = '—';
}

async function savePonto(e) {
  e.preventDefault();
  const areaId = fAreaForm.value;
  const tipoId = fTipo.value;
  if (!areaId) { toast('Selecione a área', 'warning'); return; }
  if (!tipoId) { toast('Selecione o tipo', 'warning'); return; }

  btnSave.disabled = true;
  try {
    const codigo = await gerarCodigo(areaId, tipoId);
    const pontoId = await add('pontos', {
      areaId,
      tipoId,
      codigo,
      descricao: document.getElementById('f-descricao').value.trim(),
      qrCodeUrl: ''
    });
    const qrCodeUrl = `${location.origin}/ponto-detalhe.html?id=${pontoId}`;
    await update('pontos', pontoId, { qrCodeUrl });

    toast(`Ponto ${codigo} criado`, 'success');
    closeForm();
    await loadData();
  } catch (err) {
    console.error(err);
    toast('Erro ao criar ponto', 'danger');
  } finally {
    btnSave.disabled = false;
  }
}

window.deletePonto = async (e, id) => {
  e.preventDefault();
  e.stopPropagation();
  if (!confirmDialog('Excluir este ponto? As inspeções serão perdidas.')) return;
  try {
    await remove('pontos', id);
    toast('Ponto excluído', 'success');
    pontos = pontos.filter(x => x.id !== id);
    renderList();
  } catch (err) {
    console.error(err);
    toast('Erro ao excluir', 'danger');
  }
};

loadData().catch(err => {
  console.error(err);
  toast('Erro ao carregar pontos', 'danger');
});
