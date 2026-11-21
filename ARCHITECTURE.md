# ARCHITECTURE.md — Nexus CRM

> **Propósito:** Lei do projeto. Descreve o que é **estável**: visão geral,
> pastas, camadas, modelo de dados, segurança, decisões arquiteturais, fluxos,
> operações de manutenção, dívida técnica e convenções.
>
> O que muda por ciclo fica em `PROJECT_STATE.md`. O passado em `CHANGELOG.md`.
> Se um dado aparece em dois lugares, é bug de documentação.

---

## 1. Visão Geral

Nexus CRM é um SaaS multi-tenant de CRM: **React + Vite + TailwindCSS +
Firebase** (Auth + Firestore). O produto é vendido por assinatura (planejado)
e o isolamento de dados por empresa é regra imutável em todas as camadas.

**Público:** pequenas e médias empresas que precisam de funil de vendas,
contatos, tarefas e relatórios em um só lugar.

## 2. Estrutura de Pastas e Camadas

O projeto segue **Separação de Responsabilidades (SoC)**, com arquitetura
baseada em features para módulos complexos:

```text
src/
├── components/
│   ├── layouts/           # Layout, Sidebar, AuthLayout
│   └── ui/                # Reutilizáveis (Botao, Modal, PageHeader, SelectProdutos)
├── constants/             # Constantes visuais e de domínio (funilCores.js)
├── contexts/              # Estado global (AuthContext, ThemeContext)
├── services/              # Regras de negócio e comunicação com Firebase (CRUDs)
├── pages/                 # Telas (Dashboard, Contatos, Negocios, etc.)
├── utils/                 # Funções puras (slug, order, datas)
└── features/
    └── negocios/          # Módulo de Negócios (Kanban, Lista, Drawer, Funil)
        ├── useNegociosKanban.js      # Hook principal (dados + lógica do board)
        ├── KanbanColumn.jsx          # Coluna com DND
        ├── KanbanCard.jsx            # Card individual
        ├── ListView.jsx              # Visualização em tabela
        ├── NegocioDrawer.jsx         # Painel lateral de detalhes
        └── ModalConfigurarFunil.jsx  # Editor de etapas do funil
```

### 4.4 Resiliência de Funil (Negócios Órfãos)

Como o `status` é uma string (e futuramente `etapaId`), um negócio pode ficar "órfão" se sua etapa for deletada diretamente no banco. Para garantir a integridade dos dados:

1. **Bloqueio de Exclusão:** O modal de funil verifica se existem negócios na etapa antes de permitir a exclusão ou renomeação.
2. **Coluna Virtual:** O hook `useNegociosKanban` varre a lista de negócios. Qualquer negócio cujo `status` não exista na lista ativa de etapas é direcionado para uma coluna virtual renderizada no final do board (`id: 'sem-etapa'`, flag `isVirtual: true`).
3. **Imutabilidade da coluna virtual:** Cards de etapas válidas não podem ser arrastados para a coluna "Sem Etapa". No entanto, cards órfãos podem ser arrastados (ou movidos via botão) de volta para qualquer etapa válida.
