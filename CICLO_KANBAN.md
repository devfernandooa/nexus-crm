---

### 📄 `CICLO_KANBAN.md` (novo — plano do ciclo, executável)

```markdown
# CICLO_KANBAN.md — Kanban Mobile First

> **Propósito:** Plano executável do ciclo atual. Diferente do `ARCHITECTURE.md`
> (estável), este arquivo muda a cada sessão: checklists, decisões pendentes,
> resultado de auditoria.
> **Última atualização:** 2026-11-21
> **Status do ciclo:** 🟡 Em planejamento (E0 não iniciada)

---

## 1. Contexto e problema

Estado verificado em 2026-11-21:

- `negocios.status` referencia etapa **pelo nome** → renomear etapa quebra dados.
- **Não existe `order`** em `negocios` → ordem dentro da coluna é a do Firestore
  (provavelmente `createdAt`).
- `handleDragEnd` tem early-return `if (source.droppableId === destination.droppableId) return;`
  → arrastar **dentro da mesma coluna não tem efeito**.
- Mobile usa **botões de seta** para mover entre colunas (não "Mover para…" —
  isso é alvo, não estado).
- Incerteza: lib de DnD pode ser `react-beautiful-dnd` (descontinuada) ou
  `@hello-pangea/dnd`. **A resolver na E0.**

## 2. Decisões do ciclo (D1–D8)

| #   | Decisão                                                | Status                              |
| --- | ------------------------------------------------------ | ----------------------------------- |
| D1  | `etapaId` (slug) substitui `status` (nome)             | ✅ aprovada                         |
| D2  | `etapasFunil` vira `{ id, nome, ordem }[]`             | ✅ aprovada                         |
| D3  | `negocios.order: number` (float, média entre vizinhos) | ✅ aprovada                         |
| D4  | Rebalanceamento quando gap < 0.0001                    | ✅ aprovada                         |
| D5  | Mobile sem drag; ação "Mover para…"                    | ✅ aprovada                         |
| D6  | `moveCard(cardId, etapaId, order)`                     | ✅ aprovada                         |
| D7  | Optimistic update + rollback                           | ✅ aprovada                         |
| D8  | Hook / Board puro / Service                            | ✅ aprovada (já parcialmente feito) |

## 3. Migração `status` → `etapaId` (3 fases)

### Fase 1 — Leitura tolerante (código novo, dados antigos)

- Hook deriva `etapaId = doc.etapaId ?? slugify(doc.status)`.
- Board renderiza; nenhuma escrita.

### Fase 2 — Backfill

- Script único grava `etapaId` e `order` inicial (por `createdAt`).
- Mantém `status` por compatibilidade.

### Fase 3 — Limpeza

- Remove `status`; `etapasFunil` vira objetos.
- Revisa `firestore.rules`.

**Aceite da migração:** renomear etapa no admin e confirmar que os negócios
daquela etapa continuam aparecendo.

## 4. Etapas de execução (ordem de dependência)

> Marcar `[x]` ao concluir. Cada etapa tem critério de aceite e commit sugerido.

### ⬜ E0 — Auditoria (30 min)

**O que fazer:**

- Abrir 3 docs `negocios` no console Firestore. Anotar campos.
- Abrir `package.json`. Anotar lib de DnD e versão.
- Abrir `empresas` de 2 tenants. Confirmar `etapasFunil: string[]`.
- Preencher §5 (resultado da auditoria).

**Aceite:** §5 preenchida.
**Commit:** `docs(kanban): E0 - auditoria do estado atual`

### ⬜ E1 — Leitura tolerante de `etapaId` (meio dia)

**O que fazer:**

- Centralizar `slugify` em `src/utils/slug.js`.
- No `useNegociosKanban`, derivar `etapaId` do `status` quando ausente.
- **Não escrever nada no Firestore.**

**Aceite:** negócios legados aparecem na coluna certa; console sem warn.
**Commit:** `feat(kanban): E1 - leitura tolerante de etapaId`

### ⬜ E2 — Campo `order` float (1 dia)

**O que fazer:**

- Adicionar `order` ao criar negócio.
- Criar `src/utils/order.js` com `calcularOrderDestino(acima, abaixo)` (função pura).
- No `handleDragEnd`, calcular `order` de destino (mas ainda **não remover**
  o early-return — isso é E3).

**Aceite:** mover entre colunas grava `order`; recarregar mantém posição.
**Commit:** `feat(kanban): E2 - campo order float e cálculo no drop`

### ⬜ E2.5 — Backfill de `order` (meio dia)

**O que fazer:**

- Script único (botão admin ou Cloud Function) que percorre `negocios` do
  tenant e grava `order` para docs sem o campo (ordem = `createdAt`).
- Registrar em `MIGRACAO.md`.

**Aceite:** 100% dos docs do tenant têm `order` numérico.
**Commit:** `chore(kanban): E2.5 - backfill de order`

### ⬜ E3 — `moveCard` robusto (meio dia)

**O que fazer:**

- Remover early-return de mesma coluna.
- Assinatura `moverNegocio(id, { etapaId, order })`.
- Optimistic update + rollback em falha.

**Aceite:** arrastar dentro da mesma coluna funciona; DevTools offline →
rollback + toast.
**Commit:** `feat(kanban): E3 - moveCard com optimistic update e rollback`

### ⬜ E4 — Separação de responsabilidades (1 dia)

**O que fazer:**

- `features/negocios/useKanban.js` (dados) vs `useNegociosKanban.js` (orquestração)?
  Decidir e documentar.
- `KanbanBoard.jsx` puro (props only, sem Firebase).
- `services/negociosService.js` centraliza escritas.

**Aceite:** `grep -r "firebase" src/features/negocios/KanbanBoard.jsx` vazio.
**Commit:** `refactor(kanban): E4 - separa hook, board puro e service`

### ⬜ E5 — UX Mobile First (1–2 dias)

**O que fazer:**

- Colunas com `scroll-snap-type: x mandatory`.
- Card `min-h-11` (≥44px).
- Mobile: sheet "Mover para…" substitui botões de seta.
- Desktop: drag mantido.

**Aceite:** DevTools iPhone 375px — scroll suave; mover via sheet funciona;
drag não "puxa" card sem querer; desktop intacto.
**Commit:** `feat(kanban): E5 - UX mobile first com scroll-snap e ação mover`

### ⬜ E6 — Fechamento (2h)

**O que fazer:**

- Marcar checklist §4.
- Atualizar `CONTEXTO.md`, `HISTORICO_NEXUS.md`, `ROADMAP_FUTURO.md`.
- Atualizar `ARCHITECTURE.md` se alguma decisão mudou.

**Aceite:** docs refletem o estado final.
**Commit:** `docs(kanban): E6 - fecha ciclo Kanban mobile first`

## 5. Resultado da auditoria E0

> Preencher ao concluir E0.

- [ ] `order` ausente em todos os docs de `negocios`? \_\_\_
- [ ] Lib de DnD identificada: **_ (versão _**)
- [ ] `etapaId` presente em algum doc? \_\_\_
- [ ] `etapasFunil` ainda `string[]` em todos os tenants? \_\_\_
- [ ] `firestore.rules` valida `status`? \_\_\_

## 6. Fora de escopo neste ciclo

- Filtros, busca, WIP limit, "card parado há X dias".
- Drag-and-drop no mobile.
- Migração de produção além da Fase 1.
- Automação do rebalanceamento (D4) — fica como script manual em `MIGRACAO.md`.

## 7. Riscos e mitigações

| Risco                                     | Mitigação                                          |
| ----------------------------------------- | -------------------------------------------------- |
| Float esgota precisão                     | Rebalanceamento manual (D4)                        |
| Lib descontinuada com React 18 StrictMode | Migrar para `@hello-pangea/dnd` na E0 se aplicável |
| Custo Firestore: 1 escrita por drop       | Aceitável; otimizar depois                         |
| Negócios órfãos durante transição         | Leitura tolerante (Fase 1)                         |
| Regras do Firestore validam `status`      | Revisar na Fase 3                                  |
