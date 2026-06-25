import { getAll, add, update, remove } from './db.js';
import { renderNav, toast, icons, openModal, closeModal, confirmDialog } from './utils.js';

renderNav('clientes');

let areas = [];
let clientes = [];
let editingId = null;

const listContainer = document.getElementById('list-container');
const filterCliente = document.getElementById('filter-cliente');
const fCliente = document.getElementById('f-cliente');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const form = document.getElementById('form');
const btnSave = document.getElementById('btn-save');

// Pegar clienteId da URL se vier de clientes.html
const params = new URLSearchParams(location.search);
const clienteIdFromUrl = params.get('clienteId');

document.getElementById('btn-add').addEventListener('click', () => openForm());
document.getElementById('btn-close').addEventListener('click', () => closeForm());
document.getElementById('btn-cancel').addEventListener('click', () => closeForm());
modal.addEventListener('click', e => { if (e.target === modal) closeForm(); });
filterCliente.addEventListener('change', renderList);
form.addEventListener('submit', saveArea);

// Atualiza sigla em uppercase ao digitar
document.getElementById('f-sigla').addEventListener('input', function () {
  this.value = this.value.toUpperCase();
});

async function loadData() {
  listContainer.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
  [clientes, areas] = await Promise.all([
    getAll('clientes', 'nome'),
    getAll('areas', 'nome')
  ]);

  // Popula selects de cliente
  const opts = clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
  filterCliente.innerHTML = `<option value="">Todos os clientes</option>` + opts;
  fCliente.innerHTML = `<option value="">Selecione…</option>` + opts;

  if (clienteIdFromUrl) {
    filterCliente.value = clienteIdFromUrl;
    fCliente.value = clienteIdFromUrl;
    const c = clientes.find(x => x.id === clienteIdFromUrl);
    if (c) document.getElementById('page-title').textContent = `Áreas — ${c.nome}`;
  }

  renderList();
}

function renderList() {
  const cidFiltro = filterCliente.value;
  const filtered = cidFiltro ? areas.filter(a => a.clienteId === cidFiltro) : areas;

  if (!filtered.length) {
    listContainer.innerHTML = `
      <div class="empty-state">
        ${icons.mapPin}
        <h3>Nenhuma área cadastrada</h3>
        <p>Toque no + para adicionar uma área</p>
      </div>
    `;
    return;
  }

  const clienteMap = Object.fromEntries(clientes.map(c => [c.id, c]));
  listContainer.innerHTML = filtered.map(a => {
    const c = clienteMap[a.clienteId];
    return `
      <div class="list-item">
        <div class="item-icon">${icons.mapPin}</div>
        <div class="item-body">
          <div class="item-title">${a.nome} <span class="code-pill">${a.sigla}</span></div>
          <div class="item-subtitle">${c?.nome || 'Cliente não encontrado'}</div>
        </div>
        <div class="item-actions">
          <a href="pontos.html?areaId=${a.id}" class="icon-btn" title="Ver pontos">${icons.clipboard}</a>
          <button class="icon-btn" onclick="editArea('${a.id}')" title="Editar">${icons.edit}</button>
          <button class="icon-btn del" onclick="deleteArea('${a.id}')" title="Excluir">${icons.trash}</button>
        </div>
      </div>
    `;
  }).join('');
}

function openForm(area = null) {
  editingId = area?.id || null;
  modalTitle.textContent = editingId ? 'Editar Área' : 'Nova Área';
  fCliente.value = area?.clienteId || filterCliente.value || '';
  document.getElementById('f-nome').value = area?.nome || '';
  document.getElementById('f-sigla').value = area?.sigla || '';
  document.getElementById('f-descricao').value = area?.descricao || '';
  openModal('modal');
}

function closeForm() {
  closeModal('modal');
  form.reset();
  editingId = null;
}

async function saveArea(e) {
  e.preventDefault();
  const clienteId = fCliente.value;
  const nome = document.getElementById('f-nome').value.trim();
  const sigla = document.getElementById('f-sigla').value.trim().toUpperCase();
  if (!clienteId) { toast('Selecione o cliente', 'warning'); return; }
  if (!nome) { toast('Nome é obrigatório', 'warning'); return; }
  if (!sigla) { toast('Sigla é obrigatória', 'warning'); return; }

  const data = { clienteId, nome, sigla, descricao: document.getElementById('f-descricao').value.trim() };

  btnSave.disabled = true;
  try {
    if (editingId) {
      await update('areas', editingId, data);
      toast('Área atualizada', 'success');
    } else {
      await add('areas', data);
      toast('Área cadastrada', 'success');
    }
    closeForm();
    await loadData();
  } catch (err) {
    console.error(err);
    toast('Erro ao salvar', 'danger');
  } finally {
    btnSave.disabled = false;
  }
}

window.editArea = (id) => {
  const a = areas.find(x => x.id === id);
  if (a) openForm(a);
};

window.deleteArea = async (id) => {
  if (!confirmDialog('Excluir esta área? Os pontos associados não serão apagados.')) return;
  try {
    await remove('areas', id);
    toast('Área excluída', 'success');
    areas = areas.filter(x => x.id !== id);
    renderList();
  } catch (err) {
    console.error(err);
    toast('Erro ao excluir', 'danger');
  }
};

loadData().catch(err => {
  console.error(err);
  toast('Erro ao carregar áreas', 'danger');
});
