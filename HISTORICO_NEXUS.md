# HISTORICO_NEXUS.md — Diário de Bordo Detalhado

## Sessão 1 a 15 — (Consolidado)

- **Setup:** Vite, React, Tailwind, Firebase (Auth + Firestore).
- **Autenticação:** Login, Cadastro, Contexto, Rotas Protegidas.
- **CRUDs:** Contatos, Negócios (Kanban), Produtos, Tarefas.
- **Relatórios:** Gráficos (Pizza/Barras) e Exportação (PDF/CSV).
- **Gestão:** Convites de equipe, Configurações da Empresa, Edição de Perfil.
- **UI/UX:** Design System, Mobile First, Modais, Toasts, Confirmações.

## Sessão 16 — (Integração de Produtos e Negócios)

- **O que fiz:** Seletor de produtos no modal de negócios, cálculo automático de valor, exibição de itens no Kanban.
- **O que aprendi:** Criação de dropdown customizado (`SelectProdutos`) para evitar conflitos de z-index com o Modal.

## Sessão 17 — (Exportação de Relatórios)

- **O que fiz:** Implementação real de exportação PDF/CSV usando `jspdf` e `papaparse`.

## Sessão 18 — (Edição de Perfil e Logout Refinado)

- **O que fiz:** Modal de edição de perfil, logout com confirmação e redirecionamento via `RotaProtegida`.
