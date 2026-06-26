// ── configuracoes.js ──────────────────────────────────────────────────────
import { renderNav, toast } from './utils.js';
import { runSeed } from './seed.js';

renderNav('configuracoes');

// ── Parâmetros DSP ─────────────────────────────────────────────────────────
const cfgAlpha   = document.getElementById('cfg-alpha');
const cfgK       = document.getElementById('cfg-k');
const btnSaveDsp = document.getElementById('btn-save-dsp');

// Carrega valores salvos
cfgAlpha.value = localStorage.getItem('dsp_alpha') || '0.3';
cfgK.value     = localStorage.getItem('dsp_k')     || '2';

btnSaveDsp.addEventListener('click', () => {
  const alpha = parseFloat(cfgAlpha.value);
  const k     = parseFloat(cfgK.value);
  if (isNaN(alpha) || alpha <= 0 || alpha >= 1) {
    toast('Alpha deve estar entre 0 e 1 (exclusivo)', 'danger');
    return;
  }
  if (isNaN(k) || k < 1 || k > 4) {
    toast('k deve estar entre 1 e 4', 'danger');
    return;
  }
  localStorage.setItem('dsp_alpha', alpha.toString());
  localStorage.setItem('dsp_k',     k.toString());
  toast('Parâmetros DSP salvos!', 'success');
});

// ── Seed ───────────────────────────────────────────────────────────────────
const btnSeed = document.getElementById('btn-seed');
const seedLog = document.getElementById('seed-log');

btnSeed.addEventListener('click', async () => {
  if (!confirm('Isso vai inserir dados de demonstração no Firestore. Continuar?')) return;

  btnSeed.disabled  = true;
  btnSeed.textContent = 'Carregando…';
  seedLog.style.display = 'block';
  seedLog.textContent = '';

  try {
    await runSeed(seedLog);
    toast('Seed concluído com sucesso!', 'success');
  } catch (err) {
    seedLog.innerHTML += `\n❌ Erro: ${err.message}`;
    toast('Erro durante o seed: ' + err.message, 'danger');
    console.error(err);
  } finally {
    btnSeed.disabled = false;
    btnSeed.textContent = 'Carregar Dados de Demo';
  }
});
