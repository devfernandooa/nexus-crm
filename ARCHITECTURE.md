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
