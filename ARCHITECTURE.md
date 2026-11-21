# ARCHITECTURE.md — Nexus CRM

> **Propósito:** Descreve a arquitetura, os padrões e os fluxos do sistema. É a "lei" do projeto.

---

## 1. Estrutura de Pastas e Camadas (Atualizada)

O projeto segue o padrão de **Separação de Responsabilidades (SoC)**, utilizando uma arquitetura baseada em features para módulos complexos:

```text
src/
├── components/
│   ├── layouts/      # Layout, Sidebar, AuthLayout
│   └── ui/           # Componentes reutilizáveis (Botao, Modal, PageHeader, SelectProdutos)
├── contexts/         # Estado global (AuthContext, ThemeContext)
├── services/         # Regras de negócio e comunicação direta com Firebase (CRUDs)
├── pages/            # Telas do sistema (Dashboard, Contatos, Negocios, etc.)
└── features/         # Módulos complexos com múltiplos componentes e hooks
    └── negocios/     # Módulo de Negócios (Kanban, Lista, Drawer, Funil)
        ├── useNegociosKanban.js  # Hook principal de lógica e dados
        ├── KanbanColumn.jsx      # Coluna do kanban com DND
        ├── KanbanCard.jsx        # Card individual com interações mobile/desktop
        ├── ListView.jsx          # Visualização em tabela
        ├── NegocioDrawer.jsx     # Painel lateral de detalhes
        └── ModalConfigurarFunil.jsx # Editor de etapas do funil
```

## Módulo Negócios — Modelo de dados e ordenação

### Identificador de etapa

- `negocios/{id}.etapaId: string` (slug, ex.: `"qualificacao"`) — **novo padrão**.
- `negocios/{id}.status: string` — **legado**, removido na Fase 3 da migração.
- `empresas/{id}.etapasFunil: { id, nome, ordem }[]` — **novo padrão**.
  Antes: `string[]`.

Regra: nunca referenciar etapa por `nome`. Sempre por `etapaId`.

### Ordenação dentro da coluna

- `negocios/{id}.order: number` (float).
- Ordenação: `where('etapaId','==',etapaId).orderBy('order','asc')`.
- Inserção entre vizinhos: `order = (a.order + b.order) / 2`.
- Início: `order = primeiroOrder / 2`. Fim: `ultimoOrder + 1`.
- Rebalanceamento: quando `|a.order - b.order| < 0.0001`, reespaçar a coluna
  (script admin) — ver PLANO_KANBAN.md §D4.

### Interação por breakpoint

- **Desktop (≥ md):** drag-and-drop via `@hello-pangea/dnd`.
- **Mobile (< md):** sem drag. Ação "Mover para…" no card abre sheet com
  etapas disponíveis. Escolha motivada por conflito entre touch sensor e
  `scroll-snap` horizontal.

### Fluxo de movimentação

---

### 📄 `ARCHITECTURE.md` — seção a adicionar

```markdown
## Módulo Negócios — Modelo de dados e ordenação

### Identificador de etapa

- `negocios/{id}.etapaId: string` (slug, ex.: `"qualificacao"`) — padrão novo.
- `negocios/{id}.status: string` — legado, removido na Fase 3 (PLANO_KANBAN.md §3).
- `empresas/{id}.etapasFunil: { id, nome, ordem }[]` — padrão novo.
  Antes: `string[]`.

Regra: **nunca** referenciar etapa por `nome`. Sempre por `etapaId`.

### Ordenação dentro da coluna

- `negocios/{id}.order: number` (float).
- Query: `where('etapaId','==',etapaId).orderBy('order','asc')`.
- Inserção entre vizinhos: `order = (a.order + b.order) / 2`.
- Início: `order = primeiroOrder / 2`. Fim: `order = ultimoOrder + 1`.
- Rebalanceamento: quando `|a.order - b.order| < 0.0001`, reespaçar coluna
  via script admin (PLANO_KANBAN.md D4).

### Interação por breakpoint

- **Desktop (≥ md):** drag-and-drop via `@hello-pangea/dnd`.
- **Mobile (< md):** sem drag. Ação "Mover para…" no card abre sheet com
  etapas disponíveis. Motivo: touch sensor conflita com `scroll-snap` x.

### Fluxo de movimentação
```

### Camadas

- `hooks/useKanban.js` — `onSnapshot`, agrupamento por etapa, `moveCard`.
- `components/kanban/KanbanBoard.jsx` — apresentação pura (props only).
- `services/negociosService.js` — escritas no Firestore.
