import { getAll, add, update, remove } from './db.js';
import { renderNav, toast, icons, openModal, closeModal, confirmDialog } from './utils.js';

renderNav('tipos');

let tipos = [];
let editingId = null;

const listContainer = document.getElementById('list-container');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const form = document.getElementById('form');
const btnSave = document.getElementById('btn-save');

document.getElementById('btn-add').addEventListener('click', () => openForm());
document.getElementById('btn-close').addEventListener('click', () => closeForm());
document.getElementById('btn-cancel').addEventListener('click', () => closeForm());
modal.addEventListener('click', e => { if (e.target === modal) closeForm(); });
form.addEventListener('submit', saveTipo);
document.getElementById('f-sigla').addEventListener('input', function () { this.value = this.value.toUpperCase(); });

async function loadTipos() {
  listContainer.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
  tipos = await getAll('tiposPonto', 'nome');
  renderList();
}

function renderList() {
  if (!tipos.length) {
    listContainer.innerHTML = `
      <div class="empty-state">
        ${icons.settings}
        <h3>Nenhum tipo cadastrado</h3>
        <p>Exemplos: Captação Isolada (CI), Condutor de Descida (CD), Eletrodo de Aterramento (EA)</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = tipos.map(t => `
    <div class="list-item">
      <div class="item-icon">${icons.settings}</div>
      <div class="item-body">
        <div class="item-title">${t.nome} <span class="code-pill">${t.sigla}</span></div>
        <div class="item-subtitle">${t.descricao || 'Sem descrição'}</div>
      </div>
      <div class="item-actions">
        <button class="icon-btn" onclick="editTipo('${t.id}')" title="Editar">${icons.edit}</button>
        <button class="icon-btn del" onclick="deleteTipo('${t.id}')" title="Excluir">${icons.trash}</button>
      </div>
    </div>
  `).join('');
}

function openForm(tipo = null) {
  editingId = tipo?.id || null;
  modalTitle.textContent = editingId ? 'Editar Tipo' : 'Novo Tipo';
  document.getElementById('f-nome').value = tipo?.nome || '';
  document.getElementById('f-sigla').value = tipo?.sigla || '';
  document.getElementById('f-descricao').value = tipo?.descricao || '';
  openModal('modal');
  document.getElementById('f-nome').focus();
}

function closeForm() {
  closeModal('modal');
  form.reset();
  editingId = null;
}

async function saveTipo(e) {
  e.preventDefault();
  const nome = document.getElementById('f-nome').value.trim();
  const sigla = document.getElementById('f-sigla').value.trim().toUpperCase();
  if (!nome) { toast('Nome é obrigatório', 'warning'); return; }
  if (!sigla) { toast('Sigla é obrigatória', 'warning'); return; }

  const data = { nome, sigla, descricao: document.getElementById('f-descricao').value.trim() };

  btnSave.disabled = true;
  try {
    if (editingId) {
      await update('tiposPonto', editingId, data);
      toast('Tipo atualizado', 'success');
    } else {
      await add('tiposPonto', data);
      toast('Tipo cadastrado', 'success');
    }
    closeForm();
    await loadTipos();
  } catch (err) {
    console.error(err);
    toast('Erro ao salvar', 'danger');
  } finally {
    btnSave.disabled = false;
  }
}

window.editTipo = (id) => {
  const t = tipos.find(x => x.id === id);
  if (t) openForm(t);
};

window.deleteTipo = async (id) => {
  if (!confirmDialog('Excluir este tipo de ponto? Esta ação não pode ser desfeita.')) return;
  try {
    await remove('tiposPonto', id);
    toast('Tipo excluído', 'success');
    tipos = tipos.filter(x => x.id !== id);
    renderList();
  } catch (err) {
    console.error(err);
    toast('Erro ao excluir', 'danger');
  }
};

loadTipos().catch(err => {
  console.error(err);
  toast('Erro ao carregar tipos', 'danger');
});
