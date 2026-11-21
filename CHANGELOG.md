# CHANGELOG.md — Nexus CRM

> **Propósito:** Histórico cronológico de sessões. Só passado — plano e estado
> ficam em `PROJECT_STATE.md`.

## Sessões 1–15 — (Consolidado)

- **Setup:** Vite, React, Tailwind, Firebase.
- **Auth:** Login, Cadastro, Contexto, Rotas Protegidas.
- **CRUDs:** Contatos, Negócios (Kanban), Produtos, Tarefas.
- **Relatórios:** Gráficos e Exportação (PDF/CSV).
- **Gestão:** Convites, Configurações, Edição de Perfil.
- **UI/UX:** Design System, Mobile First, Modais, Toasts.

## Sessão 16 — Integração Produtos ↔ Negócios

Seletor de produtos no modal, cálculo automático, exibição no Kanban.
**Aprendi:** dropdown customizado evita conflito de z-index com Modal.

## Sessão 17 — Exportação de Relatórios

`jspdf` + `papaparse` para PDF/CSV.

## Sessão 18 — Edição de Perfil e Logout

Modal de edição, logout com confirmação e redirecionamento.

## Sessão 19 — Configurações Avançadas e Sidebar

Painel com 4 abas; troca de senha e tema; `AuthContext` com `onSnapshot`.
**Aprendi:** sincronizar coleções via `onSnapshot`; `setTimeout` + reload
após edições críticas.

## Sessão 20 — Auditoria e Estabilização

Plano de auditoria; `firestore.rules` com multi-tenant + RBAC.
**Aprendi:** regras impedem acesso via console; race condition no cadastro.

## Sessão 21 — Testes Finais

Correção de fuso horário; sync do nome do responsável.
**Aprendi:** testar como um todo; validar isolamento via URL direta.

## Sessões 22–25 — Refatoração do Kanban e SoC

Extração para `useNegociosKanban`, `KanbanCard`, `KanbanColumn`.
**Decisão:** mobile usa toque; desktop usa arrasto.

## Sessões 26–28 — Drawer e Integração de Tarefas

`NegocioDrawer` com abas; tarefas por `negocioId`.
**Decisão:** filtragem client-side para evitar índices compostos.

## Sessões 29–31 — Switcher de Views

`ListView` + switcher Kanban/Lista; preferência em localStorage.
**Decisão:** view mode é estado local persistente.

## Sessões 32–36 — Funil Dinâmico e Full Bleed

`ModalConfigurarFunil` com CRUD e reordenação via DND; layout full bleed.
**Decisão:** altura fixa via `calc(100vh - Xpx)`; funil como array.

## Sessão 37 — Refinamento Final UI/UX

Contraste, drawer sem ID, botões no rodapé, aba Visão Geral enriquecida.
**Decisão:** drawer fecha ao editar.

## Sessão 38 (2026-11-21) — Consolidação da Documentação

**Contexto:** 8+ arquivos `.md` com duplicação e sobreposição.
**O que fiz:** reduzimos para 4 documentos canônicos — `README`,
`ARCHITECTURE`, `PROJECT_STATE`, `CHANGELOG`. Absorvidos: `CONTEXTO`,
`ROADMAP_FUTURO`, `DATABASE`, `AUDITORIA_E_CORRECOES`, `RELATORIO`,
`PROMPT_INICIAL`, `PLANO_KANBAN`, `CICLO_KANBAN`, `MIGRACAO`.
**Próximo passo:** E0 (auditoria) do ciclo Kanban Mobile First.
