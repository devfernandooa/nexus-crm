---

### 📄 `PROJECT_STATE.md` (absorve `CONTEXTO`, `CICLO_KANBAN`, `ROADMAP`, `MIGRACAO`)

```markdown
# PROJECT_STATE.md — Nexus CRM

> **Propósito:** Onde estamos e para onde vamos. Absorve o antigo `CONTEXTO`,
> `CICLO_KANBAN`, `ROADMAP_FUTURO` e `MIGRACAO`. Seções: status atual, plano
> do ciclo, roadmap, operações.
> **Última atualização:** 2026-11-21

---

## 1. Status Atual

### ✅ Concluído (fato)

- Setup React + Vite + Tailwind + Firebase (Auth + Firestore)
- Landing Page, tema claro/escuro
- Autenticação completa + `AuthContext` (empresaId, role)
- Multi-tenant base (isolamento em todas as queries)
- Layout premium (Sidebar, Header, card de usuário editável)
- Dashboard com KPIs dinâmicos
- CRUD de Contatos
- CRUD de Negócios com Kanban (drag desktop + setas mobile)
- Funil dinâmico por tenant (`etapasFunil: string[]` — **será migrado**)
- Visualização Lista + Kanban (preferência em localStorage)
- Drawer de detalhes com abas
- Integração Produtos ↔ Negócios
- CRUD de Produtos/Serviços
- Módulo de Tarefas (filtros, vencimento, vínculo com negócio)
- Relatórios com gráficos + exportação PDF/CSV
- Gestão de Equipe (convites)
- Configurações da Empresa
- Mobile First em todos os módulos
- `firestore.rules` com multi-tenant + RBAC
- Correções de fuso horário e sync do responsável

### 🟡 Em andamento — Ciclo Kanban Mobile First

Estado: **E0 não iniciada.** Detalhes em §2.

## 2. Ciclo Atual — Kanban Mobile First

### 2.1 Problema

- `negocios.status` referencia etapa **pelo nome** → renomear etapa quebra dados.
- **Não existe `order`** → ordem dentro da coluna é a do Firestore.
- `handleDragEnd` tem early-return de mesma coluna → arrastar dentro da coluna
  **não tem efeito**.
- Mobile usa botões de seta; "Mover para…" é **alvo**, não estado.
- Lib de DnD não auditada (pode ser descontinuada).

### 2.2 Decisões do ciclo (D1–D8)

| #   | Decisão                                    | Status       |
| --- | ------------------------------------------ | ------------ |
| D1  | `etapaId` (slug) substitui `status` (nome) | ✅           |
| D2  | `etapasFunil` vira `{ id, nome, ordem }[]` | ✅           |
| D3  | `negocios.order: number` (float)           | ✅           |
| D4  | Rebalanceamento quando gap < 0.0001        | ✅           |
| D5  | Mobile sem drag; ação "Mover para…"        | ✅           |
| D6  | `moveCard(cardId, etapaId, order)`         | ✅           |
| D7  | Optimistic update + rollback               | ✅           |
| D8  | Hook / Board puro / Service                | ✅ (parcial) |

### 2.3 Etapas de execução

> Marcar `[x]` ao concluir. Um commit = uma etapa.

#### ⬜ E0 — Auditoria (30 min)

- Abrir 3 docs `negocios` no console; anotar campos.
- Abrir `package.json`; anotar lib de DnD e versão.
- Abrir `empresas` de 2 tenants; confirmar `etapasFunil: string[]`.
- Preencher §2.4.
- **Aceite:** §2.4 preenchida. **Commit:** `docs(state): E0 - auditoria`

#### ⬜ E1 — Leitura tolerante de `etapaId` (meio dia)

- Centralizar `slugify` em `src/utils/slug.js`.
- No `useNegociosKanban`, derivar `etapaId` do `status` quando ausente.
- Não escrever no Firestore.
- **Aceite:** negócios legados aparecem na coluna certa; console sem warn.
- **Commit:** `feat(kanban): E1 - leitura tolerante de etapaId`

#### ⬜ E2 — Campo `order` float (1 dia)

- Adicionar `order` ao criar negócio.
- Criar `src/utils/order.js` com `calcularOrderDestino(acima, abaixo)` (puro).
- Calcular `order` no drop; **não remover** o early-return ainda.
- **Aceite:** mover entre colunas grava `order`; recarregar mantém posição.
- **Commit:** `feat(kanban): E2 - campo order float`

#### ⬜ E2.5 — Backfill de `order` (meio dia)

- Script único grava `order` em docs sem o campo (por `createdAt`).
- Receita em §4.
- **Aceite:** 100% dos docs do tenant têm `order` numérico.
- **Commit:** `chore(kanban): E2.5 - backfill de order`

#### ⬜ E3 — `moveCard` robusto (meio dia)

- Remover early-return de mesma coluna.
- Assinatura `moverNegocio(id, { etapaId, order })`.
- Optimistic update + rollback em falha.
- **Aceite:** arrastar dentro da coluna funciona; DevTools offline → rollback + toast.
- **Commit:** `feat(kanban): E3 - moveCard com optimistic e rollback`

#### ⬜ E4 — Separação de responsabilidades (1 dia)

- `KanbanBoard.jsx` puro (sem Firebase).
- `services/negociosService.js` centraliza escritas.
- **Aceite:** `grep -r "firebase" src/features/negocios/KanbanBoard.jsx` vazio.
- **Commit:** `refactor(kanban): E4 - separa hook, board e service`

#### ⬜ E5 — UX Mobile First (1–2 dias)

- Colunas com `scroll-snap-type: x mandatory`.
- Card `min-h-11` (≥44px).
- Mobile: sheet "Mover para…" substitui setas.
- Desktop: drag mantido.
- **Aceite:** DevTools iPhone 375px — scroll suave; sheet funciona; desktop intacto.
- **Commit:** `feat(kanban): E5 - UX mobile first`

#### ⬜ E6 — Fechamento (2h)

- Marcar checklist.
- Atualizar `ARCHITECTURE.md` se decisão mudou.
- Adicionar entrada no `CHANGELOG.md`.
- **Aceite:** docs refletem estado final.
- **Commit:** `docs(state): E6 - fecha ciclo Kanban`

### 2.4 Resultado da auditoria E0

> Preencher ao concluir E0.

- [ ] `order` ausente em todos os docs de `negocios`? \_\_\_
- [ ] Lib de DnD identificada: **_ (versão _**)
- [ ] `etapaId` presente em algum doc? \_\_\_
- [ ] `etapasFunil` ainda `string[]` em todos os tenants? \_\_\_
- [ ] `firestore.rules` valida `status`? \_\_\_

### 2.5 Fora de escopo neste ciclo

- Filtros, busca, WIP limit, "card parado há X dias".
- Drag-and-drop no mobile.
- Migração de produção além da Fase 1.
- Automação do rebalanceamento.

## 3. Roadmap

### Curto prazo (concluir MVP)

- [ ] Contatos: separar Leads vs. Clientes
- [ ] Gestão de Equipe: editar/excluir membros
- [ ] Configurações: abas Conta/Segurança/Preferências
- [ ] Auditoria (logs em `auditoria`)
- [ ] Central de Ajuda (FAQ)
- [ ] Importação de dados via CSV

### Médio prazo (escalabilidade)

- [ ] Multi-tenant avançado (1 usuário → N empresas)
- [ ] Cloud Functions para transações atômicas
- [ ] Planos de assinatura (Stripe/Mercado Pago)
- [ ] Notificações em tempo real (FCM)

### Longo prazo (inovação)

- [ ] Agente de IA (resumos, follow-ups, sentimento)
- [ ] Integração WhatsApp (API oficial)
- [ ] Relatórios preditivos

### Próximos ciclos (não iniciar antes de fechar Kanban)

- Filtros e busca no board
- WIP limit por coluna
- Card "parado há X dias"
- Relatório de tempo por etapa
- Automação do rebalanceamento de float

## 4. Operações (migração e manutenção)

> Absorve o antigo `MIGRACAO.md`. Scripts únicos, idempotentes.

### 4.1 Backfill de `order` (E2.5)

- **Quando:** após E2, antes de E3.
- **O que faz:** grava `order` em docs sem o campo (por `createdAt`).
- **Como rodar:** [preencher na E2.5].
- **Idempotente:** sim. **Rollback:** remover `order` dos afetados.

### 4.2 Backfill de `etapaId` (Fase 2 da migração)

- **Quando:** após E3, board estável.
- **O que faz:** grava `etapaId = slugify(status)` em docs sem `etapaId`.
- **Idempotente:** sim. **Rollback:** remover `etapaId`.

### 4.3 Rebalanceamento de float (D4)

- **Quando:** quando `|a.order - b.order| < 0.0001`.
- **O que faz:** reespaça `order` da coluna com gaps de 1.0.
- **Frequência esperada:** raríssima.
- **Idempotente:** sim.
