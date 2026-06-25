import { getWhere } from './db.js';
import { renderNav, toast } from './utils.js';

renderNav('scanner');

function navigateToPonto(pontoId) {
  location.href = `ponto-detalhe.html?id=${pontoId}`;
}

function handleDecodedUrl(text) {
  try {
    const url = new URL(text);
    const id = url.searchParams.get('id');
    if (id) {
      navigateToPonto(id);
      return;
    }
  } catch {
    // não é URL, pode ser um código direto (ex: SB1-CI-001)
  }
  // Tenta buscar pelo código
  buscarPorCodigo(text.trim().toUpperCase());
}

async function buscarPorCodigo(codigo) {
  try {
    const pontos = await getWhere('pontos', 'codigo', '==', codigo);
    if (pontos.length > 0) {
      navigateToPonto(pontos[0].id);
    } else {
      toast(`Ponto "${codigo}" não encontrado`, 'warning');
    }
  } catch (err) {
    console.error(err);
    toast('Erro ao buscar ponto', 'danger');
  }
}

// Inicia scanner
// eslint-disable-next-line no-undef
const scanner = new Html5QrcodeScanner('reader', {
  fps: 10,
  qrbox: { width: 250, height: 250 },
  rememberLastUsedCamera: true,
  showTorchButtonIfSupported: true
}, false);

scanner.render(
  (decodedText) => {
    scanner.clear().catch(() => {});
    document.getElementById('scan-result').style.display = 'block';
    document.getElementById('result-text').textContent = decodedText;
    handleDecodedUrl(decodedText);
  },
  (err) => {
    // Ignorar erros de scanning contínuo (câmera ativa mas QR não detectado)
    if (!err.includes('QR code parse error')) {
      console.warn(err);
    }
  }
);

// Busca manual por código
document.getElementById('btn-manual').addEventListener('click', () => {
  const codigo = document.getElementById('manual-code').value.trim().toUpperCase();
  if (!codigo) { toast('Informe o código do ponto', 'warning'); return; }
  buscarPorCodigo(codigo);
});

document.getElementById('manual-code').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-manual').click();
});
