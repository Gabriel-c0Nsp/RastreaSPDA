# Backlog — RastreaSPDA
> Apresentação: **06/07/2026** · Última atualização: 25/06/2026

---

## ✅ Feito

### 🔵 PWA & Infraestrutura
| Item | Arquivo |
|---|---|
| `manifest.json` com `standalone`, shortcuts, ícones | `public/manifest.json` |
| Service Worker (cache-first, fallback offline) | `public/sw.js` |
| Ícone 192×192 | `public/icons/icon-192.png` |
| Ícone 512×512 | `public/icons/icon-512.png` |
| Meta tags iOS (`apple-mobile-web-app-*`) em todos os HTMLs | 8 arquivos |
| `<link rel="manifest">` em todos os HTMLs | 8 arquivos |
| `viewport-fit=cover` (safe area iPhone) em todos os HTMLs | 8 arquivos |
| Registro do Service Worker em todos os HTMLs | 8 arquivos |
| Deploy no Firebase Hosting (configurado) | `firebase.json` |

### 🟢 Banco de Dados (Firestore)
| Item | Arquivo |
|---|---|
| Camada de acesso Firestore (`getAll`, `getById`, `getWhere`, `getWhere2`, `add`, `update`, `remove`, `getSubAll`, `addSub`) | `js/db.js` |
| Modelo de dados correto (coleções + subcoleção `inspecoes`) | Firestore |
| `firestore.rules` configurado | `firestore.rules` |
| `firestore.indexes.json` configurado | `firestore.indexes.json` |
| `firebase-config.example.js` documentado | `js/firebase-config.example.js` |

### 🟡 Seed de Dados
| Item | Arquivo |
|---|---|
| 2 clientes (Indústria Maranhão + UEMA) | `js/seed.js` |
| 6 áreas (3 por cliente, com sigla) | `js/seed.js` |
| 4 tipos de ponto (CI, HC, CD, AT) | `js/seed.js` |
| 15 pontos com códigos `{SIGLA_AREA}-{SIGLA_TIPO}-{SEQ}` | `js/seed.js` |
| ~70 inspeções históricas com timestamps reais | `js/seed.js` |
| **Anomalia em `n=6`** no ponto `GAL-CI-001` (28.7 Ω, ~3σ) | `js/seed.js` |
| Botão de seed com log inline na tela Configurações | `configuracoes.html` |

### 🔴 DSP — Processamento de Sinais
| Item | Arquivo |
|---|---|
| Filtro IIR EMA: `H(z) = α / (1 − (1−α)·z⁻¹)` | `js/dsp.js` |
| Detecção de anomalia por desvio: `|x[n] − μ| > k·σ` | `js/dsp.js` |
| Estatísticas do sinal (`dspStats`: μ e σ) | `js/dsp.js` |
| Gráfico DSP na ficha do ponto (x[n], y[n]=EMA, faixas μ±kσ) | `js/ponto-detalhe.js` |
| Pontos anômalos destacados em vermelho no gráfico | `js/ponto-detalhe.js` |
| Tooltip com data da inspeção no gráfico | `js/ponto-detalhe.js` |
| α e k configuráveis (salvos em `localStorage`) | `js/configuracoes.js` |

### 🟠 Telas implementadas
| Tela | Arquivo | Status |
|---|---|---|
| Dashboard (stats + donut conformidade + bar meses + recentes) | `index.html` + `dashboard.js` | ✅ Completo |
| Clientes (CRUD completo: listar, busca, criar, editar, excluir) | `clientes.html` + `clientes.js` | ✅ Completo |
| Áreas (CRUD completo com filtro por cliente, sigla) | `areas.html` + `areas.js` | ✅ Completo |
| Tipos de Ponto (CRUD completo com sigla) | `tipos-ponto.html` + `tipos-ponto.js` | ✅ Completo |
| Pontos (listar, filtrar, criar com código auto-gerado, excluir) | `pontos.html` + `pontos.js` | ✅ Completo |
| Ficha do Ponto (info + gráfico DSP + QR Code + histórico) | `ponto-detalhe.html` + `ponto-detalhe.js` | ✅ Completo |
| Nova Inspeção (form com resistência, continuidade, condição visual) | `inspecao.html` + `inspecoes.js` | ✅ Completo |
| Scanner QR (câmera + busca manual por código) | `scan.html` + `scan.js` | ✅ Completo |
| Alertas / Não Conformidades (stats + lista filtrada + detecção DSP) | `nao-conformidade.html` + `nao-conformidade.js` | ✅ Completo |
| Configurações (parâmetros DSP + seed + H(z) + equipe) | `configuracoes.html` + `configuracoes.js` | ✅ Completo |

### 🎨 Design & UX
| Item | Status |
|---|---|
| Layout mobile-first, touch targets ≥ 44px | ✅ |
| Bottom nav mobile (5 itens) → sidebar desktop (8 itens) | ✅ |
| Safe area `env(safe-area-inset-bottom)` | ✅ |
| Toast notifications (sucesso, erro, warning) | ✅ |
| Modal bottom-sheet com animação `slideUp` | ✅ |
| Spinner de carregamento em todas as telas | ✅ |
| Empty states com ícone e mensagem | ✅ |
| Badges de status (conforme / não conforme / condição visual) | ✅ |
| `code-pill` para exibir códigos de ponto | ✅ |
| Download do QR Code como PNG | ✅ |
| Compartilhar URL do ponto (`navigator.share`) | ✅ |

---

## ❌ Falta / Pendente

### 🔴 CRÍTICO — bloqueia funcionamento

| # | Item | Responsável | Detalhe |
|---|---|---|---|
| 1 | **`firebase-config.js`** | Elton John | Copiar `firebase-config.example.js`, preencher com credenciais reais do Firebase console. **Sem isso o app não funciona.** |
| 2 | **Executar o seed** | Qualquer um | Acessar `configuracoes.html` → botão "Carregar Dados de Demo". Fazer **uma vez** no projeto de produção. |
| 3 | **`firebase deploy`** | Qualquer um | Fazer o deploy final no Firebase Hosting antes da apresentação. |

### 🟡 IMPORTANTE — afeta apresentação

| # | Item | Responsável | Detalhe |
|---|---|---|---|
| 4 | **Técnico na inspeção** | Suamí/Elton | Campo `tecnico` no formulário de inspeção (`inspecao.html`) não existe — o nome é fixo no seed mas não é coletado em inspeções novas. Adicionar um `<input>` ou `<select>` com os nomes da equipe. |
| 5 | **Ficha do ponto: nome do técnico no histórico** | Gabriel | O card de inspeção em `ponto-detalhe.js` não exibe o campo `tecnico`. Mostra só resistência, continuidade e condição. |
| 6 | **Dashboard: link correto para ficha** | Gabriel | `dashboard.js` linha 129 usa `?id=` mas `ponto-detalhe.js` espera `?id=` — ✅ OK. Porém `?pontoId=` é usado em `inspecao.html`. Confirmar consistência em todos os lugares. |
| 7 | **`nao-conformidade.js` usa `dspStats` mas não importa de `dsp.js`** | Suamí | `nao-conformidade.js` importa `detectAnomaly` mas faz a lógica corretamente. Porém a função importa `emaFilter` que não é usada — leve desperdício. Sem impacto funcional. |

### 🟠 RECOMENDADO — melhora a nota

| # | Item | Responsável | Detalhe |
|---|---|---|---|
| 8 | **Técnico no formulário de inspeção** | Elton/Gabriel | Campo `tecnico` precisa ser coletado no formulário `inspecao.html` e salvo via `addSub`. |
| 9 | **Ponto destaque na apresentação** | Suamí | Identificar o `pontoId` real de `GAL-CI-001` após o seed e verificar que o gráfico DSP exibe a anomalia em n=6. Anotar a URL para a demo ao vivo. |
| 10 | **Segundo cliente ao vivo** | Gabriel | O CLAUDE.md diz "cadastrar 2º cliente ao vivo durante o ensaio". Praticar o fluxo: Cliente → Área → Ponto → Inspeção. |
| 11 | **Ensaio cronometrado** | Equipe | Cronometrar a apresentação completa. 11 slides conforme edital. |
| 12 | **QR Code testado em celular real** | Gabriel | Gerar QR Code de um ponto, imprimir/exibir na tela e escanear com celular físico. Verificar que redireciona corretamente. |

### 🔵 FORA DO ESCOPO (Sprint 3 — só se sobrar tempo)

| # | Item | Nota |
|---|---|---|
| — | Exportação PDF | Explicitamente fora do escopo no CLAUDE.md |
| — | Autenticação login/senha | Explicitamente fora do escopo |
| — | Histórico de alterações nos cadastros | Explicitamente fora do escopo |

---

## 📋 Checklist da Apresentação (06/07/2026)

- [ ] `firebase-config.js` criado com credenciais reais
- [ ] Seed executado (`configuracoes.html` → Carregar Dados)
- [ ] `firebase deploy` concluído e URL de produção funcionando
- [ ] QR Code testado em celular físico real
- [ ] Gráfico DSP com anomalia em n=6 visível na ficha de `GAL-CI-001`
- [ ] Campo `tecnico` no formulário de inspeção
- [ ] Cadastro ao vivo de 2º cliente funcionando (ensaio)
- [ ] Relatório técnico com H(z), polo e ressalva de amostragem não-uniforme
- [ ] 11 slides na ordem do edital
- [ ] Ensaio cronometrado pela equipe completa

---

## 🗂️ Estrutura Final do Projeto

```
public/
├── index.html              ✅ Dashboard
├── clientes.html           ✅ CRUD Clientes
├── areas.html              ✅ CRUD Áreas
├── tipos-ponto.html        ✅ CRUD Tipos
├── pontos.html             ✅ Pontos + QR
├── ponto-detalhe.html      ✅ Ficha + DSP + histórico
├── inspecao.html           ✅ Nova inspeção (falta campo técnico)
├── scan.html               ✅ Scanner QR
├── nao-conformidade.html   ✅ Alertas / DSP
├── configuracoes.html      ✅ Config + Seed
├── manifest.json           ✅ PWA manifest
├── sw.js                   ✅ Service Worker
├── icons/
│   ├── icon-192.png        ✅
│   └── icon-512.png        ✅
├── css/
│   └── style.css           ✅ Design system completo
└── js/
    ├── firebase-config.js  ❌ FALTA CRIAR (credenciais reais)
    ├── db.js               ✅ Camada Firestore
    ├── dsp.js              ✅ EMA + anomalia + stats
    ├── utils.js            ✅ Nav + toast + icons + modals
    ├── seed.js             ✅ Dados simulados
    ├── dashboard.js        ✅
    ├── clientes.js         ✅
    ├── areas.js            ✅
    ├── tipos-ponto.js      ✅
    ├── pontos.js           ✅
    ├── ponto-detalhe.js    ✅
    ├── inspecoes.js        ✅ (falta campo técnico)
    ├── scan.js             ✅
    ├── nao-conformidade.js ✅
    └── configuracoes.js    ✅
```
