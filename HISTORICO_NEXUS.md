# HISTORICO_NEXUS.md — Diário de Bordo

> **Propósito:** Registro cronológico das sessões. O plano do ciclo atual fica
> em `CICLO_KANBAN.md`; decisões estáveis em `ARCHITECTURE.md`.

## Sessões 1–15 — (Consolidado)

- **Setup:** Vite, React, Tailwind, Firebase.
- **Auth:** Login, Cadastro, Contexto, Rotas Protegidas.
- **CRUDs:** Contatos, Negócios (Kanban), Produtos, Tarefas.
- **Relatórios:** Gráficos e Exportação (PDF/CSV).
- **Gestão:** Convites, Configurações, Edição de Perfil.
- **UI/UX:** Design System, Mobile First, Modais, Toasts.

## Sessão 16 — Integração Produtos ↔ Negócios

- Seletor de produtos no modal, cálculo automático, exibição no Kanban.
- **Aprendi:** dropdown customizado evita conflito de z-index com Modal.

## Sessão 17 — Exportação de Relatórios

- `jspdf` + `papaparse` para PDF/CSV.

## Sessão 18 — Edição de Perfil e Logout

- Modal de edição, logout com confirmação e redirecionamento.

## Sessão 19 — Configurações Avançadas e Sidebar

- Painel com 4 abas (Conta, Empresa, Segurança, Preferências).
- Troca de senha e tema.
- `AuthContext` com `onSnapshot` para empresa.
- **Aprendi:** sincronizar coleções via `onSnapshot`; `setTimeout` + reload
  após edições críticas.

## Sessão 20 — Auditoria e Estabilização

- Plano em `AUDITORIA_E_CORRECOES.md`.
- `firestore.rules` com multi-tenant + RBAC.
- **Aprendi:** regras impedem acesso via console; race condition no cadastro.

## Sessão 21 — Testes Finais

- Correção de fuso horário; sync do nome do responsável.
- **Aprendi:** testar como um todo; validar isolamento via URL direta.

## Sessões 22–25 — Refatoração do Kanban e SoC

- Extração para `useNegociosKanban`, `KanbanCard`, `KanbanColumn`.
- Drag seguro + navegação mobile com setas.
- **Decisão:** mobile usa toque; desktop usa arrasto.

## Sessões 26–28 — Drawer e Integração de Tarefas

- `NegocioDrawer` com abas; tarefas vinculadas por `negocioId`.
- **Decisão:** filtragem client-side para evitar índices compostos.

## Sessões 29–31 — Switcher de Views

- `ListView` + switcher Kanban/Lista; preferência em localStorage.
- **Decisão:** view mode é estado local persistente.

## Sessões 32–36 — Funil Dinâmico e Full Bleed

- `ModalConfigurarFunil` com CRUD e reordenação via DND.
- Layout full bleed; correções de altura para DND.
- **Decisão:** altura fixa via `calc(100vh - Xpx)`; funil como array.

## Sessão 37 — Refinamento Final UI/UX

- Contraste, drawer sem ID, botões no rodapé, aba Visão Geral enriquecida.
- **Decisão:** drawer fecha ao editar.

## Sessão 38 (2026-11-21) — Planejamento do Ciclo Kanban Mobile First

- **Contexto:** auditoria revelou ausência de `order` e uso de `status` por nome.
- **Decisões:** ver `CICLO_KANBAN.md` §2 (D1–D8).
- **Docs reorganizados:** `ARCHITECTURE.md` (estável), `CICLO_KANBAN.md`
  (plano), `MIGRACAO.md` (operação), este histórico (diário).
- **Próximo passo:** E0 (auditoria) → E1 (leitura tolerante).
