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
