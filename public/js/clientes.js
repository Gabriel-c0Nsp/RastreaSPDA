import { getAll, add, update, remove } from './db.js';
import { renderNav, toast, icons, openModal, closeModal, confirmDialog } from './utils.js';

renderNav('clientes');

let clientes = [];
let editingId = null;

const listContainer = document.getElementById('list-container');
const searchEl = document.getElementById('search');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const form = document.getElementById('form');
const btnSave = document.getElementById('btn-save');

document.getElementById('btn-add').addEventListener('click', () => openForm());
document.getElementById('btn-close').addEventListener('click', () => closeForm());
document.getElementById('btn-cancel').addEventListener('click', () => closeForm());
modal.addEventListener('click', e => { if (e.target === modal) closeForm(); });
searchEl.addEventListener('input', () => renderList(searchEl.value));
form.addEventListener('submit', saveCliente);

async function loadClientes() {
  listContainer.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
  clientes = await getAll('clientes', 'nome');
  renderList();
}

function renderList(filter = '') {
  const q = filter.toLowerCase();
  const filtered = clientes.filter(c =>
    c.nome?.toLowerCase().includes(q) ||
    c.cnpj?.toLowerCase().includes(q) ||
    c.email?.toLowerCase().includes(q)
  );

  if (!filtered.length) {
    listContainer.innerHTML = `
      <div class="empty-state">
        ${icons.users}
        <h3>${filter ? 'Nenhum resultado' : 'Nenhum cliente cadastrado'}</h3>
        <p>${filter ? 'Tente outro termo de busca' : 'Toque no + para adicionar o primeiro cliente'}</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = filtered.map(c => `
    <div class="list-item">
      <div class="item-icon">${icons.users}</div>
      <div class="item-body">
        <div class="item-title">${c.nome}</div>
        <div class="item-subtitle">${[c.cnpj, c.email].filter(Boolean).join(' · ') || 'Sem dados de contato'}</div>
      </div>
      <div class="item-actions">
        <a href="areas.html?clienteId=${c.id}" class="icon-btn" title="Ver áreas">${icons.mapPin}</a>
        <button class="icon-btn" onclick="editCliente('${c.id}')" title="Editar">${icons.edit}</button>
        <button class="icon-btn del" onclick="deleteCliente('${c.id}')" title="Excluir">${icons.trash}</button>
      </div>
    </div>
  `).join('');
}

function openForm(cliente = null) {
  editingId = cliente?.id || null;
  modalTitle.textContent = editingId ? 'Editar Cliente' : 'Novo Cliente';
  document.getElementById('f-nome').value = cliente?.nome || '';
  document.getElementById('f-cnpj').value = cliente?.cnpj || '';
  document.getElementById('f-email').value = cliente?.email || '';
  document.getElementById('f-telefone').value = cliente?.telefone || '';
  document.getElementById('f-endereco').value = cliente?.endereco || '';
  openModal('modal');
  document.getElementById('f-nome').focus();
}

function closeForm() {
  closeModal('modal');
  form.reset();
  editingId = null;
}

async function saveCliente(e) {
  e.preventDefault();
  const nome = document.getElementById('f-nome').value.trim();
  if (!nome) { toast('Nome é obrigatório', 'warning'); return; }

  const data = {
    nome,
    cnpj: document.getElementById('f-cnpj').value.trim(),
    email: document.getElementById('f-email').value.trim(),
    telefone: document.getElementById('f-telefone').value.trim(),
    endereco: document.getElementById('f-endereco').value.trim(),
  };

  btnSave.disabled = true;
  try {
    if (editingId) {
      await update('clientes', editingId, data);
      toast('Cliente atualizado', 'success');
    } else {
      await add('clientes', data);
      toast('Cliente cadastrado', 'success');
    }
    closeForm();
    await loadClientes();
  } catch (err) {
    console.error(err);
    toast('Erro ao salvar', 'danger');
  } finally {
    btnSave.disabled = false;
  }
}

window.editCliente = (id) => {
  const c = clientes.find(x => x.id === id);
  if (c) openForm(c);
};

window.deleteCliente = async (id) => {
  if (!confirmDialog('Excluir este cliente? As áreas associadas não serão apagadas.')) return;
  try {
    await remove('clientes', id);
    toast('Cliente excluído', 'success');
    clientes = clientes.filter(x => x.id !== id);
    renderList(searchEl.value);
  } catch (err) {
    console.error(err);
    toast('Erro ao excluir', 'danger');
  }
};

loadClientes().catch(err => {
  console.error(err);
  toast('Erro ao carregar clientes', 'danger');
});
