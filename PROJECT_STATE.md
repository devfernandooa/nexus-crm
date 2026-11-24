# PROJECT_STATE.md — Nexus Hub (Nexus CRM)

> **Propósito:** Fonte única da verdade sobre onde estamos e para onde vamos. Absorve os antigos `CONTEXTO`, `CICLO_KANBAN`, `ROADMAP_FUTURO` e `MIGRACAO`.  
> **Última atualização:** 2026-11-24  
> **Marca:** Nexus Hub  
> **Stack principal:** React, Vite, Tailwind CSS, Firebase (Auth / Firestore / Admin SDK), Vercel Serverless Functions, React Router, Lucide React, `react-hot-toast`

---

## 1. Status Atual

### ✅ Concluído (fato)

- **Core & Infraestrutura:**
  - Setup React + Vite + Tailwind CSS + Firebase (Auth + Firestore)
  - Deploy em produção na Vercel (`https://nexus-crm-green-one.vercel.app`) com acesso externo/mobile validado e `Require Log In` desativado para webhooks públicos
  - Rebranding para **Nexus Hub** com identidade visual em verde esmeralda (`emerald`) e suporte completo a tema claro/escuro
  - Layout responsivo Mobile First (`Sidebar`, `Layout.jsx`, `PageHeader`, `AuthLayout` com transição animada)
- **Autenticação, Segurança & Multi-tenant:**
  - Autenticação completa (`Login`, `Cadastro`, `AuthContext` com `empresaId` e `role`)
  - Logout automático por inatividade (30 minutos via `useInactivityLogout`)
  - Isolamento multi-tenant em todas as queries e `firestore.rules` com RBAC
  - **Base do Super Admin:** Custom Claim `superAdmin: true` atribuída via `scripts/set-super-admin.js`, regra `isSuperAdmin()` publicada em `firestore.rules` e leitura via `getIdTokenResult(true)` exposta no `AuthContext.jsx`
- **Módulos Operacionais:**
  - Dashboard com KPIs dinâmicos, Contatos Recentes e Pulso Comercial
  - CRUD de Contatos (abas Todos/Leads/Clientes, busca ampliada e visualização responsiva)
  - CRUD de Negócios com Kanban (drag desktop + setas mobile), resiliência de etapas (bloqueio de exclusão com cards e coluna virtual "Sem Etapa"), vínculo automático de contato (`garantirContatoVinculado`), cores por etapa, visualização em Lista, Drawer de detalhes e integração com Produtos
  - CRUD de Produtos/Serviços
  - Módulo de Tarefas em Kanban (Pendentes, Vencidas, Concluídas) e Lista, observações e modal rápido de renovação de data
  - Relatórios com gráficos e exportação PDF/CSV
  - Gestão de Equipe (edição do nome da equipe, convites e CRUD direto de membros)
  - Configurações da Empresa e preferências de tema

### 🟡 Em andamento

1. **Ciclo Kanban Mobile First:** Camada de resiliência (tratamento de órfãos) concluída; próximo foco na ordenação interna das colunas (**E2** e **E3**). Detalhes em §2.
2. **Módulo WhatsApp Business Cloud API:** Endpoint serverless (`/api/whatsapp-webhook`) publicado em produção na Vercel; aguardando validação end-to-end com a Meta Developers e fluxo completo de captura. Detalhes em §4.
3. **Painel Técnico Super Admin:** Base de permissão concluída; pendente construir a interface de alternância de empresa (`empresaId`) e monitor de sessões. Detalhes em §4.

---

## 2. Ciclo Atual — Kanban Mobile First

### 2.1 Problema

- `negocios.status` referencia etapa **pelo nome** → renomear etapa quebra dados.
- **Não existe `order`** → ordem dentro da coluna é a do Firestore.
- `handleDragEnd` tem early-return de mesma coluna → arrastar dentro da coluna **não tem efeito**.
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
- Receita em §5.
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
- [ ] Lib de DnD identificada: \_\_\_ (versão \_\_\_)
- [ ] `etapaId` presente em algum doc? \_\_\_
- [ ] `etapasFunil` ainda `string[]` em todos os tenants? \_\_\_
- [ ] `firestore.rules` valida `status`? \_\_\_

### 2.5 Fora de escopo neste ciclo

- Filtros, busca, WIP limit, "card parado há X dias".
- Drag-and-drop no mobile.
- Migração de produção além da Fase 1.
- Automação do rebalanceamento.

---

## 3. Roadmap

### Curto prazo (concluir MVP)

- [x] Contatos: separar Leads vs. Clientes (abas implementadas)
- [x] Gestão de Equipe: editar/excluir membros
- [ ] Painel Super Admin: seletor de `empresaId` e diagnóstico de sessões WhatsApp
- [ ] Validação end-to-end do Webhook WhatsApp em produção
- [ ] Configurações: abas Conta/Segurança/Preferências
- [ ] Auditoria (logs em `audit_logs` / `auditoria`)
- [ ] Central de Ajuda (FAQ) e Importação de dados via CSV

### Médio prazo (escalabilidade)

- [ ] Multi-tenant avançado (1 usuário → N empresas)
- [ ] Transações atômicas no backend (Vercel Functions / Cloud Functions)
- [ ] Planos de assinatura (Stripe/Mercado Pago)
- [ ] Notificações em tempo real (`notificacoes` + FCM)

### Longo prazo (inovação)

- [ ] Agente de IA (resumos, follow-ups, sentimento)
- [ ] Relatórios preditivos

### Próximos ciclos (não iniciar antes de fechar Kanban)

- Filtros e busca no board
- WIP limit por coluna
- Card "parado há X dias"
- Relatório de tempo por etapa
- Automação do rebalanceamento de float

---

## 4. Módulos em Implantação (Super Admin & WhatsApp)

### 4.1 Módulo Super Admin (Manutenção Técnica)

- **Status:** Base de autenticação e regras concluída.
- **Implementado:**
  - Custom Claim `superAdmin: true` atribuída via `scripts/set-super-admin.js` (Firebase Admin SDK; `scripts/service-account.json` protegido no `.gitignore`).
  - Função `isSuperAdmin()` publicada em `firestore.rules` para leitura e escrita técnica nas coleções operacionais, `whatsapp_sessoes` e `audit_logs`.
  - Exposição da flag `isSuperAdmin` no `AuthContext.jsx` via `getIdTokenResult(true)`.
- **O que falta:**
  - Criar seletor de `empresaId` (Context Switcher) no front-end para o Super Admin visualizar e intervir em qualquer tenant sem alterar credenciais do cliente.
  - Criar tela de diagnóstico técnico para inspecionar e resetar sessões presas em `whatsapp_sessoes` e gravar registros em `audit_logs`.

### 4.2 Módulo WhatsApp Business Cloud API

- **Status:** Webhook publicado em produção; aguardando validação end-to-end com a Meta.
- **Onde paramos:**
  - Arquitetura migrada de Cloud Functions para **Vercel Serverless Functions** (`/api/whatsapp-webhook.js`) para operar sem custo fixo.
  - Deploy de produção ativo em `https://nexus-crm-green-one.vercel.app` com proteção de preview (`Require Log In`) desativada para permitir requisições públicas da Meta.
  - Modelagem das coleções `whatsapp_sessoes`, `contatos` e `negocios` definida.
- **O que falta:**
  - Confirmar a verificação da **Callback URL** (`https://nexus-crm-green-one.vercel.app/api/whatsapp-webhook`) e a assinatura do campo `messages` no painel da Meta Developers.
  - Testar o envio de mensagens reais (com o app Meta configurado adequadamente) e validar a transição de estados da conversa em `whatsapp_sessoes` até a criação automática do lead/negócio no `empresaId` correspondente.
  - Exibir status e erros do webhook no painel de manutenção do Super Admin.

---

## 5. Operações (Migração e Manutenção)

> Scripts únicos e idempotentes.

### 5.1 Backfill de `order` (E2.5)

- **Quando:** após E2, antes de E3.
- **O que faz:** grava `order` em docs sem o campo (ordenado por `createdAt`).
- **Como rodar:** `[preencher na E2.5]`.
- **Idempotente:** sim. **Rollback:** remover `order` dos afetados.

### 5.2 Backfill de `etapaId` (Fase 2 da migração)

- **Quando:** após E3, board estável.
- **O que faz:** grava `etapaId = slugify(status)` em docs sem `etapaId`.
- **Idempotente:** sim. **Rollback:** remover `etapaId`.

### 5.3 Rebalanceamento de float (D4)

- **Quando:** quando `|a.order - b.order| < 0.0001`.
- **O que faz:** reespaça `order` da coluna com gaps de `1.0`.
- **Frequência esperada:** raríssima.
- **Idempotente:** sim.

### 5.4 Atribuição de Super Admin

- **Quando:** sempre que precisar conceder acesso técnico a um novo UID do Firebase Auth.
- **Como rodar:** editar o `uid` em `scripts/set-super-admin.js` (com `scripts/service-account.json` presente localmente e relógio do sistema sincronizado) e executar `node scripts/set-super-admin.js`.

---

## 6. Histórico Recente de Sessões

### Sessão 22 — (Planejamento do Módulo WhatsApp)
- Documentação inicial da arquitetura e fluxo de integração com WhatsApp (`MODULO_WHATSAPP.md`), custos de mensagens de serviço da Meta e requisitos do modo **Live**.

### Sessão 23 — (Segurança, Notificações e Recuperação de Senha)
- Documentação do logout por inatividade (30 min), fluxo de recuperação de senha e modelagem da coleção `notificacoes` multi-tenant.

### Sessão 24 — (Logout por Inatividade e Alinhamento Visual)
- Implementação do hook `useInactivityLogout` integrado ao `AuthContext.jsx` com limpeza de timers e alinhamento visual ao tema esmeralda.

### Sessão 25 — (Deploy em Produção, Super Admin e Status WhatsApp)
- **O que fiz:**
  - Validei o deploy de produção em `https://nexus-crm-green-one.vercel.app` (incluindo acesso externo via rede móvel/celular) e liberei o acesso público ao webhook desativando `Require Log In` na Vercel.
  - Implementei a base de **Super Admin** com Custom Claim (`superAdmin: true`) via `scripts/set-super-admin.js`, adicionei `isSuperAdmin()` nas `firestore.rules` e expus `isSuperAdmin` no `AuthContext.jsx`.
- **O que aprendi:**
  - A importação modular (`firebase-admin/app` e `firebase-admin/auth`) com `readFileSync` evita erros ESM no Node v24, e o relógio do Windows precisa estar sincronizado para não gerar `invalid_grant: Invalid JWT`.
  - Manter `scripts/service-account.json` no `.gitignore` é essencial para segurança das credenciais administrativas.
- **Próximo passo:** Criar a interface do Super Admin (seletor de `empresaId` e monitor de sessões) e concluir a validação end-to-end do webhook do WhatsApp na Meta Developers.