# CONTEXTO.md — Nexus CRM

> **Propósito:** Diário de bordo do desenvolvimento. O que já foi feito e qual é
> o próximo passo imediato. Para o plano executável do ciclo atual, ver
> `CICLO_KANBAN.md`.

## 1. Status Atual (2026-11-21)

### ✅ Concluído (fato)

- [x] Setup React + Vite + Tailwind + Firebase (Auth + Firestore)
- [x] Landing Page, tema claro/escuro
- [x] Autenticação completa + `AuthContext` (empresaId, role)
- [x] Multi-tenant base (isolamento em todas as queries)
- [x] Layout premium (Sidebar, Header, card de usuário editável)
- [x] Dashboard com KPIs dinâmicos
- [x] CRUD de Contatos
- [x] CRUD de Negócios com Kanban (drag desktop + setas mobile)
- [x] Funil dinâmico por tenant (`etapasFunil: string[]` — **será migrado**)
- [x] Visualização Lista + Kanban (preferência em localStorage)
- [x] Drawer de detalhes com abas
- [x] Integração Produtos ↔ Negócios (cálculo automático de valor)
- [x] CRUD de Produtos/Serviços
- [x] Módulo de Tarefas (filtros, vencimento, vínculo com negócio)
- [x] Relatórios com gráficos + exportação PDF/CSV
- [x] Gestão de Equipe (convites)
- [x] Configurações da Empresa
- [x] Mobile First em todos os módulos
- [x] `firestore.rules` com multi-tenant + RBAC
- [x] Correção de fuso horário em datas
- [x] Sincronização do nome do responsável com Sidebar

### 🟡 Em andamento — Ciclo Kanban Mobile First

Ver `CICLO_KANBAN.md`. Estado: **E0 não iniciada**.
Decisões consolidadas: `etapaId` (slug) substitui `status`;
`order: float` para ordenação; mobile sem drag (ação "Mover para…" — alvo).

### 📋 Pendente (fora do ciclo Kanban)

- [ ] Contatos: separar Leads vs. Clientes
- [ ] Gestão de Equipe: editar/excluir membros
- [ ] Configurações: abas Conta/Segurança/Preferências (parcialmente feito na Sessão 19)
- [ ] Auditoria (logs em `auditoria`)
- [ ] Importação de dados via CSV

### 🧱 Dívida técnica conhecida

- `status` por nome em produção → migração em 3 fases (`CICLO_KANBAN.md` §3)
- `etapasFunil` ainda `string[]` → migrar para `{id, nome, ordem}[]`
- Sem `order` em `negocios` → E2 do ciclo
- Sem backfill de `order` → E2.5 do ciclo
- Lib de DnD não auditada → E0 do ciclo

## 2. Histórico de Sessões (resumo)

> Detalhes em `HISTORICO_NEXUS.md`.

- Sessões 1–15: setup, auth, CRUDs, relatórios, UI.
- Sessões 16–21: produtos↔negócios, exportação, perfil, configurações, auditoria.
- Sessões 22–36: refatoração do Kanban, drawer, switcher, funil dinâmico, full bleed.
- Sessão 37: refinamento final de UI/UX.
- **Sessão 38 (atual):** planejamento do ciclo Kanban Mobile First.

## 3. Decisões de Arquitetura

> Movidas para `ARCHITECTURE.md` §3. Fonte única de verdade.
