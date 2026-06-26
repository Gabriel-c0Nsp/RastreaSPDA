// ── seed.js — Dados simulados para apresentação ──────────────────────────────
// Execute UMA VEZ via configuracoes.html (botão "Carregar Dados de Demo")
// Requisito: firebase-config.js configurado corretamente.

import { db } from './firebase-config.js';
import {
  collection, addDoc, serverTimestamp, Timestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ── Utilitário de log ──────────────────────────────────────────────────────
let logEl = null;
function log(msg) {
  console.log(msg);
  if (logEl) {
    logEl.innerHTML += `${msg}\n`;
    logEl.scrollTop = logEl.scrollHeight;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────
async function addDoc_(col, data) {
  const ref = await addDoc(collection(db, col), { ...data, criadoEm: serverTimestamp() });
  return ref.id;
}

async function addSub_(col, parentId, sub, data) {
  // timestamp fixo para dados históricos coerentes
  const ref = await addDoc(collection(db, col, parentId, sub), {
    ...data,
    timestamp: data.timestamp || serverTimestamp()
  });
  return ref.id;
}

// Gera Timestamp de N dias atrás
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return Timestamp.fromDate(d);
}

// ── Seed principal ─────────────────────────────────────────────────────────
export async function runSeed(logElement = null) {
  logEl = logElement;
  log('🌱 Iniciando seed...');

  // ── Tipos de ponto ───────────────────────────────────────────────────────
  log('→ Criando tipos de ponto...');
  const tipos = {
    ci: await addDoc_('tiposPonto', { nome: 'Caixa de Inspeção', sigla: 'CI', descricao: 'Caixa de inspeção do SPDA para acesso ao condutor de descida.' }),
    hc: await addDoc_('tiposPonto', { nome: 'Haste Captora', sigla: 'HC', descricao: 'Haste captora de raios instalada no topo da edificação.' }),
    cd: await addDoc_('tiposPonto', { nome: 'Condutor de Descida', sigla: 'CD', descricao: 'Condutor metálico que conecta a haste captora ao aterramento.' }),
    at: await addDoc_('tiposPonto', { nome: 'Aterramento', sigla: 'AT', descricao: 'Eletrodo de aterramento enterrado no solo.' }),
  };
  log(`  ✔ ${Object.keys(tipos).length} tipos criados.`);

  // ── Cliente 1: Indústria Maranhão Ltda ───────────────────────────────────
  log('→ Criando Cliente 1: Indústria Maranhão Ltda...');
  const c1 = await addDoc_('clientes', {
    nome: 'Indústria Maranhão Ltda',
    cnpj: '12.345.678/0001-90',
    email: 'spda@industria-ma.com.br',
    telefone: '(98) 3212-4567',
    endereco: 'Rod. MA-230, km 5, São Luís - MA'
  });

  // Áreas do cliente 1
  log('  → Áreas cliente 1...');
  const a1 = await addDoc_('areas', { clienteId: c1, nome: 'Bloco Administrativo', sigla: 'ADM', descricao: 'Bloco principal com escritórios e sala de servidores.' });
  const a2 = await addDoc_('areas', { clienteId: c1, nome: 'Galpão Industrial', sigla: 'GAL', descricao: 'Área de produção com maquinário pesado.' });
  const a3 = await addDoc_('areas', { clienteId: c1, nome: 'Subestação Elétrica', sigla: 'SUB', descricao: 'Subestação de transformação de alta tensão.' });

  // ── Cliente 2: Colégio Técnico UEMA ─────────────────────────────────────
  log('→ Criando Cliente 2: Colégio Técnico UEMA...');
  const c2 = await addDoc_('clientes', {
    nome: 'Colégio Técnico UEMA',
    cnpj: '06.346.701/0001-43',
    email: 'manutencao@uema.br',
    telefone: '(98) 3245-9100',
    endereco: 'Cidade Universitária Paulo VI, São Luís - MA'
  });

  // Áreas do cliente 2
  log('  → Áreas cliente 2...');
  const a4 = await addDoc_('areas', { clienteId: c2, nome: 'Bloco A — Salas de Aula', sigla: 'BLA', descricao: 'Bloco principal com salas de aula e laboratórios.' });
  const a5 = await addDoc_('areas', { clienteId: c2, nome: 'Laboratório de Informática', sigla: 'LAB', descricao: 'Laboratório com servidores e estações de trabalho.' });
  const a6 = await addDoc_('areas', { clienteId: c2, nome: 'Quadra Poliesportiva', sigla: 'QDR', descricao: 'Quadra coberta com estrutura metálica.' });

  log('  ✔ 6 áreas criadas.');

  // ── Pontos ───────────────────────────────────────────────────────────────
  log('→ Criando pontos de inspeção...');

  // Indústria — Bloco Administrativo (ADM): 3 pontos
  const p1  = await addDoc_('pontos', { codigo: 'ADM-CI-001', areaId: a1, tipoId: tipos.ci, descricao: 'Caixa de inspeção próxima à entrada principal', latitude: -2.5541, longitude: -44.3021 });
  const p2  = await addDoc_('pontos', { codigo: 'ADM-HC-001', areaId: a1, tipoId: tipos.hc, descricao: 'Haste captora no topo do bloco ADM', latitude: -2.5540, longitude: -44.3020 });
  const p3  = await addDoc_('pontos', { codigo: 'ADM-AT-001', areaId: a1, tipoId: tipos.at, descricao: 'Eletrodo de aterramento lateral', latitude: -2.5543, longitude: -44.3025 });

  // Indústria — Galpão (GAL): 4 pontos
  const p4  = await addDoc_('pontos', { codigo: 'GAL-CI-001', areaId: a2, tipoId: tipos.ci, descricao: 'Caixa inspeção setor de fundição' });
  const p5  = await addDoc_('pontos', { codigo: 'GAL-CD-001', areaId: a2, tipoId: tipos.cd, descricao: 'Condutor de descida — parede norte' });
  const p6  = await addDoc_('pontos', { codigo: 'GAL-HC-001', areaId: a2, tipoId: tipos.hc, descricao: 'Haste captora — cobertura metálica' });
  const p7  = await addDoc_('pontos', { codigo: 'GAL-AT-001', areaId: a2, tipoId: tipos.at, descricao: 'Aterramento — poço seco' });

  // Indústria — Subestação (SUB): 2 pontos
  const p8  = await addDoc_('pontos', { codigo: 'SUB-CI-001', areaId: a3, tipoId: tipos.ci, descricao: 'Caixa de inspeção junto ao QGBT' });
  const p9  = await addDoc_('pontos', { codigo: 'SUB-AT-001', areaId: a3, tipoId: tipos.at, descricao: 'Malha de aterramento subestação' });

  // UEMA — Bloco A (BLA): 2 pontos
  const p10 = await addDoc_('pontos', { codigo: 'BLA-HC-001', areaId: a4, tipoId: tipos.hc, descricao: 'Haste captora — bloco A teto' });
  const p11 = await addDoc_('pontos', { codigo: 'BLA-CI-001', areaId: a4, tipoId: tipos.ci, descricao: 'Caixa de inspeção — corredor' });

  // UEMA — Lab (LAB): 2 pontos
  const p12 = await addDoc_('pontos', { codigo: 'LAB-AT-001', areaId: a5, tipoId: tipos.at, descricao: 'Aterramento servidores' });
  const p13 = await addDoc_('pontos', { codigo: 'LAB-CD-001', areaId: a5, tipoId: tipos.cd, descricao: 'Condutor de descida — rack' });

  // UEMA — Quadra (QDR): 2 pontos
  const p14 = await addDoc_('pontos', { codigo: 'QDR-HC-001', areaId: a6, tipoId: tipos.hc, descricao: 'Haste captora — estrutura quadra' });
  const p15 = await addDoc_('pontos', { codigo: 'QDR-AT-001', areaId: a6, tipoId: tipos.at, descricao: 'Aterramento quadra' });

  log('  ✔ 15 pontos criados.');

  // ── Inspeções — Ponto destaque: GAL-CI-001 (p4) ─────────────────────────
  // 10 inspeções com anomalia em n=6 (resistência = 28.7 Ω, ~2.5σ acima da média)
  // Série x[n] = [2.1, 2.4, 1.9, 2.3, 2.0, 2.2, 28.7, 2.1, 2.5, 2.0]
  //              mu ≈ 4.82, sigma ≈ 7.86 → n=6 está a 3.04σ → ANOMALIA ✔
  log('→ Criando inspeções do ponto destaque (GAL-CI-001)...');
  const insp_p4 = [
    // n=0 — 90 dias atrás
    { resistencia: 2.1, continuidade: 0.15, condicaoVisual: 'Boa',     conforme: true,  tecnico: 'Elton John', observacoes: 'Ponto em ótimas condições.', timestamp: daysAgo(90) },
    // n=1
    { resistencia: 2.4, continuidade: 0.18, condicaoVisual: 'Boa',     conforme: true,  tecnico: 'Suamí',      observacoes: '', timestamp: daysAgo(75) },
    // n=2
    { resistencia: 1.9, continuidade: 0.14, condicaoVisual: 'Boa',     conforme: true,  tecnico: 'Elton John', observacoes: 'Solo seco, valores normais.', timestamp: daysAgo(60) },
    // n=3
    { resistencia: 2.3, continuidade: 0.17, condicaoVisual: 'Boa',     conforme: true,  tecnico: 'Gabriel',    observacoes: '', timestamp: daysAgo(50) },
    // n=4
    { resistencia: 2.0, continuidade: 0.16, condicaoVisual: 'Boa',     conforme: true,  tecnico: 'Suamí',      observacoes: '', timestamp: daysAgo(40) },
    // n=5
    { resistencia: 2.2, continuidade: 0.19, condicaoVisual: 'Regular', conforme: true,  tecnico: 'Elton John', observacoes: 'Leve oxidação na conexão.', timestamp: daysAgo(30) },
    // n=6 — ANOMALIA (resistência ~28.7 Ω, ~3σ acima da média)
    { resistencia: 28.7, continuidade: 1.82, condicaoVisual: 'Ruim',   conforme: false, tecnico: 'Gabriel',    observacoes: '⚠️ Resistência muito acima do normal. Solo seco e compactado. Recomendado tratamento de solo e revisão da conexão.', timestamp: daysAgo(20) },
    // n=7 — leituras voltam, mas ainda elevadas (pós-correção parcial)
    { resistencia: 2.1, continuidade: 0.16, condicaoVisual: 'Regular', conforme: true,  tecnico: 'Suamí',      observacoes: 'Correção aplicada. Monitorar.', timestamp: daysAgo(14) },
    // n=8
    { resistencia: 2.5, continuidade: 0.20, condicaoVisual: 'Boa',     conforme: true,  tecnico: 'Elton John', observacoes: 'Valores voltando ao normal.', timestamp: daysAgo(7) },
    // n=9
    { resistencia: 2.0, continuidade: 0.15, condicaoVisual: 'Boa',     conforme: true,  tecnico: 'Gabriel',    observacoes: '', timestamp: daysAgo(2) },
  ];
  for (const insp of insp_p4) {
    await addSub_('pontos', p4, 'inspecoes', insp);
  }
  log('  ✔ 10 inspeções GAL-CI-001 (anomalia em n=6).');

  // ── Inspeções — Ponto destaque: ADM-CI-001 (p1) ─────────────────────────
  // 8 inspeções, série estável
  log('→ Inspeções ADM-CI-001...');
  const insp_p1 = [
    { resistencia: 1.8, continuidade: 0.12, condicaoVisual: 'Boa',     conforme: true,  tecnico: 'Suamí',      observacoes: '', timestamp: daysAgo(80) },
    { resistencia: 1.9, continuidade: 0.13, condicaoVisual: 'Boa',     conforme: true,  tecnico: 'Elton John', observacoes: '', timestamp: daysAgo(65) },
    { resistencia: 2.0, continuidade: 0.15, condicaoVisual: 'Boa',     conforme: true,  tecnico: 'Gabriel',    observacoes: '', timestamp: daysAgo(50) },
    { resistencia: 1.7, continuidade: 0.12, condicaoVisual: 'Boa',     conforme: true,  tecnico: 'Suamí',      observacoes: '', timestamp: daysAgo(38) },
    { resistencia: 1.8, continuidade: 0.13, condicaoVisual: 'Boa',     conforme: true,  tecnico: 'Elton John', observacoes: '', timestamp: daysAgo(28) },
    { resistencia: 1.9, continuidade: 0.14, condicaoVisual: 'Boa',     conforme: true,  tecnico: 'Gabriel',    observacoes: '', timestamp: daysAgo(18) },
    { resistencia: 2.1, continuidade: 0.16, condicaoVisual: 'Boa',     conforme: true,  tecnico: 'Suamí',      observacoes: '', timestamp: daysAgo(9) },
    { resistencia: 1.8, continuidade: 0.13, condicaoVisual: 'Boa',     conforme: true,  tecnico: 'Elton John', observacoes: '', timestamp: daysAgo(3) },
  ];
  for (const insp of insp_p1) {
    await addSub_('pontos', p1, 'inspecoes', insp);
  }
  log('  ✔ 8 inspeções ADM-CI-001.');

  // ── Inspeções dos demais pontos (3–5 inspeções cada) ────────────────────
  log('→ Inspeções dos demais pontos...');
  const pontosRest = [p2, p3, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15];
  const tecnicos   = ['Suamí', 'Elton John', 'Gabriel'];
  const condicoes  = ['Boa', 'Boa', 'Boa', 'Regular'];

  for (const pid of pontosRest) {
    const qtd = 3 + Math.floor(Math.random() * 3); // 3–5 inspeções
    for (let n = 0; n < qtd; n++) {
      const res   = +(1.5 + Math.random() * 1.5).toFixed(2); // 1.5–3.0 Ω
      const cont  = +(0.10 + Math.random() * 0.15).toFixed(2);
      const cond  = condicoes[Math.floor(Math.random() * condicoes.length)];
      await addSub_('pontos', pid, 'inspecoes', {
        resistencia:    res,
        continuidade:   cont,
        condicaoVisual: cond,
        conforme:       cond !== 'Ruim',
        tecnico:        tecnicos[n % 3],
        observacoes:    '',
        timestamp:      daysAgo(60 - n * 12)
      });
    }
  }
  log('  ✔ Inspeções dos 13 pontos restantes.');

  log('');
  log('✅ Seed concluído com sucesso!');
  log(`   • 2 clientes`);
  log(`   • 6 áreas`);
  log(`   • 15 pontos`);
  log(`   • ~70 inspeções (anomalia em GAL-CI-001 n=6)`);
  return true;
}
