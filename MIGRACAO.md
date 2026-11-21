# MIGRACAO.md — Scripts de migração e manutenção

> **Propósito:** Documentar scripts únicos (backfill, rebalanceamento) para que
> possam ser reexecutados ou auditados. Não é código — é receita.

## 1. Backfill de `order` (E2.5)

**Quando:** após E2, antes de E3.
**O que faz:** percorre `negocios` do tenant, grava `order` em docs sem o campo
(ordem inicial = `createdAt` convertido para timestamp numérico).
**Como rodar:** [preencher na E2.5 — botão admin ou Cloud Function]
**Idempotente:** sim (só grava se `order` ausente).
**Rollback:** remover campo `order` dos docs afetados (script reverso).

## 2. Backfill de `etapaId` (Fase 2 da migração)

**Quando:** após E3, quando board estiver estável.
**O que faz:** grava `etapaId = slugify(status)` em docs sem `etapaId`.
**Idempotente:** sim.
**Rollback:** remover `etapaId` (volta ao fallback de leitura).

## 3. Rebalanceamento de float (D4)

**Quando:** quando `|a.order - b.order| < 0.0001` em alguma coluna.
**O que faz:** reespaça os `order` da coluna com gaps de 1.0 (ex.: 1, 2, 3...).
**Idempotente:** sim (recalcula do zero).
**Frequência esperada:** raríssima (após ~50 inserções no mesmo vão).
