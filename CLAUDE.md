# CLAUDE.md — RastreaSPDA

> Leia este arquivo no início de toda sessão antes de tocar em qualquer código.

***

## O que é este projeto

**RastreaSPDA** — sistema web/mobile de rastreabilidade de pontos de inspeção do SPDA (Sistema de Proteção contra Descargas Atmosféricas).

Cada ponto físico recebe um código único + QR Code. O técnico escaneia em campo, vê o histórico de inspeções e registra uma nova medição. O histórico é tratado como sinal discreto `x[n]` e processado por um filtro IIR (EMA) para detectar anomalias automaticamente.

**Disciplina:** Análise e Processamento de Sinais — UEMA  
**Apresentação:** 06/07/2026  
**Equipe:** Suamí · Elton John · Gabriel

***

## Stack — nunca substitua sem avisar a equipe

| Camada | Tecnologia | Observação |
|---|---|---|
| Front-end | HTML + CSS + JavaScript puro | Sem framework (Vue, React etc.) |
| Banco de dados | Firebase Firestore | NoSQL, free tier |
| QR Code (geração) | `qrcodejs` via CDN | |
| QR Code (leitura) | `html5-qrcode` via CDN | |
| Gráficos | `Chart.js` via CDN | |
| Hospedagem | Firebase Hosting | `firebase deploy` |

***

## Estrutura de arquivos esperada

```
RastreaSPDA/
├── CLAUDE.md
├── public/
│   ├── index.html              ← dashboard
│   ├── clientes.html           ← CRUD clientes
│   ├── areas.html              ← CRUD áreas
│   ├── tipos-ponto.html        ← CRUD tipos de ponto
│   ├── pontos.html             ← cadastro e listagem de pontos + QR
│   ├── ponto-detalhe.html      ← ficha do ponto + QR Code + histórico
│   ├── inspecao.html           ← formulário de nova inspeção
│   ├── scan.html               ← leitor de QR Code (câmera)
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── firebase-config.js  ← credenciais (não commitar em repo público)
│       ├── db.js               ← todas as funções Firestore (getAll, getById, getWhere, getWhere2, add, update, remove, getSubAll, addSub)
│       ├── utils.js            ← renderNav, toast, icons, modal helpers
│       ├── dashboard.js
│       ├── clientes.js
│       ├── areas.js
│       ├── tipos-ponto.js
│       ├── pontos.js           ← geração de código + CRUD pontos
│       ├── ponto-detalhe.js    ← carrega ficha + gera QR Code no browser
│       ├── inspecoes.js
│       └── scan.js             ← html5-qrcode scanner
├── firebase.json
├── firestore.rules
└── firestore.indexes.json
```

***

## Modelo de dados Firestore

### Coleções raiz

```
clientes/{clienteId}
  nome: string
  cnpj: string
  criadoEm: timestamp

areas/{areaId}
  clienteId: string   ← FK
  nome: string
  descricao: string

tiposPonto/{tipoId}
  nome: string        ← "Caixa de Inspeção", "Haste Captora" etc.

pontos/{pontoId}
  codigo: string      ← gerado: "{siglaArea}-{siglaTipo}-{seq}" ex: "BLK-CI-001"
  areaId: string      ← FK
  tipoId: string      ← FK
  latitude: number    ← opcional
  longitude: number   ← opcional
  qrCodeUrl: string   ← data-URL gerado no browser
  criadoEm: timestamp

pontos/{pontoId}/inspecoes/{inspecaoId}   ← subcoleção
  timestamp: timestamp   ← campo real no Firestore (serverTimestamp via addSub)
  tecnico: string
  continuidade: number     ← Ω
  resistencia: number      ← Ω  (valor principal para DSP)
  condicaoVisual: string   ← "boa" | "regular" | "ruim"
  conforme: boolean
  observacoes: string
```

### Regra importante
`inspecoes` é **subcoleção de `pontos`**, não coleção raiz. Nunca achatar isso em uma coleção única.

***

## Lógica DSP — não altere sem revisar com Suamí

### Filtro IIR de 1ª ordem (EMA)

```js
// dsp.js
export function emaFilter(alpha, xArr) {
  const y = [];
  for (let n = 0; n < xArr.length; n++) {
    y[n] = n === 0
      ? xArr[0]
      : alpha * xArr[n] + (1 - alpha) * y[n - 1];
  }
  return y;
}
```

Função de transferência: `H(z) = α / (1 − (1−α)·z⁻¹)`  
Polo em `z = 1−α` — dentro do círculo unitário → sistema estável.  
**Alpha padrão:** `0.3` (suavização moderada).

### Detecção de anomalia

```js
export function detectAnomaly(xArr, k = 2) {
  const mu = xArr.reduce((a, b) => a + b, 0) / xArr.length;
  const sigma = Math.sqrt(xArr.reduce((s, v) => s + (v - mu) ** 2, 0) / xArr.length);
  return xArr.map(v => Math.abs(v - mu) > k * sigma);
}
```

`k = 2` significa 2 desvios-padrão. Anomalia retorna `true` nesse índice.

### Ressalva conceitual (citar no relatório)
> O índice `n` não corresponde a frequência de amostragem fixa — inspeções ocorrem em intervalos de calendário irregulares. O Teorema de Nyquist **não se aplica literalmente** aqui.

***

## Geração do código do ponto

Formato: **`{siglaArea}-{siglaTipo}-{seq}`** — ex: `BLK-CI-001`

As siglas (`area.sigla`, `tipo.sigla`) são campos armazenados diretamente nos documentos de `areas` e `tiposPonto` (não derivados do nome em tempo real).

```js
// pontos.js — implementação real
async function gerarCodigo(areaId, tipoId) {
  const [area, tipo, existentes] = await Promise.all([
    getById('areas', areaId),
    getById('tiposPonto', tipoId),
    getWhere2('pontos', 'areaId', '==', areaId, 'tipoId', '==', tipoId)
  ]);
  const seq = String(existentes.length + 1).padStart(3, '0');
  return `${area.sigla}-${tipo.sigla}-${seq}`;
}
```

***

## Seed de dados simulados

O arquivo `js/seed.js` deve ser executado **uma única vez** durante o desenvolvimento (não em produção).

Requisito mínimo para a apresentação:
- 2 clientes cadastrados
- 3 áreas por cliente
- 15 pontos no total (distribuídos entre as áreas)
- 8–10 inspeções por ponto nos pontos de destaque
- **Pelo menos 1 inspeção anômala** em `n = 6` de um ponto (resistência fora de `mu ± 2σ`)

***

## Navegação entre telas

| Tela | URL / âncora | Acesso via |
|---|---|---|
| Dashboard | `index.html` | Sempre visível na nav |
| Configurações | `configuracoes.html` | Menu → Configurações |
| Pontos | `pontos.html` | Menu → Pontos |
| Nova inspeção | `inspecao.html?pontoId=XXX` | Botão na ficha do ponto |
| Ficha do ponto | `ficha.html?pontoId=XXX` | QR Code ou lista de pontos |
| Não conformidade | `nao-conformidade.html` | Menu → Alertas |

O `pontoId` é passado via `URLSearchParams`. Cada tela lê `new URLSearchParams(location.search).get("pontoId")` para carregar os dados certos.

***

## Responsividade

Layout **mobile-first**. O sistema será demonstrado num celular em campo.

- Breakpoint principal: `768px`
- Touch targets: mínimo `44×44px`
- Fonte mínima do body: `16px`
- Nenhum tooltip que dependa de hover — usar tap/modal no mobile

***

## Convenções de código

- **Nenhum framework JS** — DOM puro, `async/await`, módulos ES6 (`type="module"`)
- Funções assíncronas sempre com `try/catch` e feedback visual de erro na tela
- Cada arquivo em `js/db/` exporta apenas as funções de acesso ao Firestore daquela coleção
- `firebase-config.js` **não sobe para repositório público** — usar `.gitignore`
- Comentários em português (equipe fala português)
- Nomes de variáveis e funções em camelCase inglês (padrão JS)

***

## O que está fora do escopo — não implementar

Só implementar se o Sprint 3 fechar com folga real:

- Exportação de relatório em PDF
- Autenticação de usuário (login/senha)
- Histórico de alterações nos cadastros

Esses itens **não comprometem a nota**.

***

## Divisão de responsabilidades

| Módulo | Dono | Ninguém altera sem avisar |
|---|---|---|
| `js/db/` + seed + Firestore | Elton John | — |
| `js/dsp.js` + gráficos + relatório técnico | Suamí | — |
| Layout, navegação, QR Code | Gabriel | — |

Se precisar mexer no módulo de outro membro, **abrir PR ou avisar no grupo antes**.

***

## Checklist pré-apresentação (06/07/2026)

- [ ] Deploy no Firebase Hosting funcionando
- [ ] QR Code gerado e lido por câmera de celular real
- [ ] Gráfico sobrepondo `x[n]` e `y[n]` com pelo menos 8 pontos
- [ ] Anomalia em `n = 6` aparece destacada no gráfico e no painel
- [ ] Segundo cliente cadastrado ao vivo durante o ensaio
- [ ] Relatório técnico com `H(z)`, polo e ressalva sobre amostragem não-uniforme
- [ ] Slides na ordem do edital (11 slides)
- [ ] Ensaio cronometrado realizado pela equipe completa