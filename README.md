# RastreaSPDA

Sistema web/mobile de rastreabilidade de pontos de inspeção de SPDA (Sistema de Proteção contra Descargas Atmosféricas).

## Stack

- HTML + CSS + JavaScript puro (sem frameworks)
- Firebase Firestore (banco NoSQL, tempo real)
- Firebase Hosting
- qrcodejs (geração de QR Code)
- html5-qrcode (leitura via câmera)
- Chart.js (gráficos de conformidade)

## Setup

### 1. Criar projeto Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Crie um novo projeto
3. Ative o **Firestore Database** (modo produção ou teste)
4. Em **Configurações do Projeto → Seus apps**, adicione um app Web e copie o `firebaseConfig`

### 2. Configurar credenciais

Edite [`public/js/firebase-config.js`](public/js/firebase-config.js) com as credenciais do seu projeto:

```js
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJECT.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  // ...
};
```

### 3. Configurar Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # selecione seu projeto
```

Ou edite `.firebaserc` com seu Project ID.

### 4. Deploy

```bash
firebase deploy
```

Para testar localmente:

```bash
firebase serve
```

## Estrutura do Projeto

```text
public/
├── index.html            # Dashboard
├── clientes.html         # CRUD Clientes
├── areas.html            # CRUD Áreas
├── tipos-ponto.html      # CRUD Tipos de Ponto (global)
├── pontos.html           # CRUD Pontos de Inspeção
├── ponto-detalhe.html    # Detalhe + QR Code + histórico
├── inspecao.html         # Formulário de inspeção
├── scan.html             # Scanner de QR Code
├── css/style.css
└── js/
    ├── firebase-config.js
    ├── db.js             # Helpers Firestore
    ├── utils.js          # Toast, Nav, ícones
    ├── dashboard.js
    ├── clientes.js
    ├── areas.js
    ├── tipos-ponto.js
    ├── pontos.js
    ├── ponto-detalhe.js
    ├── inspecoes.js
    └── scan.js
```

## Fluxo de Uso

1. Cadastre **Clientes** → **Áreas** (com sigla) → **Tipos de Ponto** (com sigla)
2. Crie **Pontos** — o código é gerado automaticamente: `{SIGLA_AREA}-{SIGLA_TIPO}-{SEQ}`
3. Imprima o **QR Code** de cada ponto e fixe no campo
4. No campo, use o **Scanner** para escanear o QR e registrar inspeções
5. Acompanhe conformidade no **Dashboard**
