# PROJECT_STATE.md — Nexus Hub (Nexus CRM)

> **Propósito:** Fonte única da verdade sobre onde estamos e para onde vamos. Absorve os antigos `CONTEXTO`, `CICLO_KANBAN`, `ROADMAP_FUTURO` e `MIGRACAO`.  
> **Última atualização:** 2026-11-26  
> **Marca:** Nexus Hub  
> **Branches ativas:** `main` (produção / Vercel) e `dev` (desenvolvimento)  
> **Stack principal:** React, Vite, Tailwind CSS, Firebase (Auth / Firestore / Admin SDK), Vercel Serverless Functions, React Router, Lucide React, `react-hot-toast`

---

## 1. Visão Geral do Estado por Módulo

| Módulo / Frente | Status | Resumo Atual |
| :--- | :---: | :--- |
| **Core, Layout & Infraestrutura** | ✅ | Deploy em produção na Vercel, tema claro/escuro esmeralda e layout responsivo Mobile First validado. |
| **Autenticação, RBAC & Multi-tenant** | ✅ | Login/Cadastro, logout por inatividade (30 min), isolamento por `empresaId` e base de `superAdmin`. |
| **Dashboard** | ✅ | KPIs dinâmicos, Contatos Recentes e Pulso Comercial operacionais. |
| **Contatos & Notificações em Tempo Real** | ✅ | Abas Todos/Leads/Clientes, coluna *Observações*, busca ampliada e alertas em tempo real (`NotificacoesLeads.jsx`). |
| **Negócios (Kanban Mobile First)** | 🟡 | Estrutura de etapas (`etapaId`), cores, lista, drawer e produtos concluídos; falta implementar `order` float e UX mobile sheet (§2). |
| **Tarefas** | ✅ | Kanban (Pendentes, Vencidas, Concluídas), Lista, observações e modal rápido de renovação de data. |
| **Produtos / Serviços** | ✅ | CRUD completo do catálogo integrado ao funil de negócios e relatórios. |
| **Relatórios** | ✅ | Loading e visibilidade por perfil corrigidos; gráficos, filtros, KPIs, exportação PDF/CSV e scroll notebook/mobile validados. |
| **Gestão de Equipe & Configurações** | 🟡 | CRUD de membros, convites e nome da equipe concluídos; pendente abas avançadas de Conta/Segurança. |
| **Central de Ajuda & Chamados** | 🟡 | Fase 1 (página inicial com busca, categorias e FAQ) concluída; pendentes artigos por módulo e Central de Controle de Chamados (§3). |
| **WhatsApp Business Cloud API** | 🟡 | Webhook serverless (`/api/whatsapp-webhook.js`) ativo com IA e persistência; pendente validação final Meta e roteamento multi-tenant (§4). |
| **Painel Técnico Super Admin** | 🟡 | Custom claim e `firestore.rules` concluídos; pendente interface de alternância de `empresaId` e diagnóstico de sessões (§5). |

---

## 2. Módulo: Negócios (Ciclo Kanban Mobile First)

### 2.1 Problema e Contexto
- `negocios.status` antigo referenciava etapa pelo nome (mitigado com migração automática para slug `etapaId` e coluna virtual `"⚠️ Sem Etapa"`).
- Falta o campo numérico `order` (float) para ordenação customizada dentro da mesma coluna (`handleDragEnd` ainda ignora drop na mesma coluna).
- No mobile, a movimentação usa botões de seta; será evoluída para sheet `"Mover para…"`.

### 2.2 Decisões Técnicas (D1–D8)

| # | Decisão | Status |
| :--- | :--- | :---: |
| D1 | `etapaId` (slug) substitui `status` (nome) | ✅ |
| D2 | `etapasFunil` estruturado como `{ id, nome, ordem, tipo, cor }[]` | ✅ |
| D3 | `negocios.order: number` (float) | ⬜ |
| D4 | Rebalanceamento automático quando gap `< 0.0001` | ⬜ |
| D5 | Mobile sem drag-and-drop; ação `"Mover para…"` | ⬜ |
| D6 | `moveCard(cardId, etapaId, order)` | ⬜ |
| D7 | Optimistic update + rollback em falha de rede | ⬜ |
| D8 | Separação Hook / Board puro / Service | 🟡 (parcial) |

### 2.3 Etapas de Execução do Ciclo

#### ✅ Concluído no Módulo
- [x] **Base Kanban & Resiliência:** Drag-and-drop desktop, setas mobile, bloqueio de exclusão de etapas com cards, coluna virtual `"⚠️ Sem Etapa"`, vínculo automático de contato (`garantirContatoVinculado`), cores por etapa, visualização em Lista, Drawer de detalhes, vínculo com Produtos/Serviços e filtro de visibilidade por perfil (`admin` vs. `vendedor`).
- [x] **Leitura Tolerante & Migração de Slug:** `migrarFunilAntigo` e migração automática de `status` por nome para `id` (slug) no `useNegociosKanban.js`.

#### ⬜ Pendente no Ciclo
- [ ] **E0 — Auditoria Técnica (30 min):** Documentar em §2.4 os campos atuais de `negocios`, versão da lib de DnD no `package.json` e regras de `status` em `firestore.rules`. (`Commit: docs(state): E0 - auditoria`)
- [ ] **E2 — Campo `order` float:** Gravar `order` ao criar negócio e criar `src/utils/order.js` com `calcularOrderDestino(acima, abaixo)`. (`Commit: feat(kanban): E2 - campo order float`)
- [ ] **E2.5 — Backfill de `order`:** Script idempotente para preencher `order` em documentos existentes ordenados por `createdAt`. (`Commit: chore(kanban): E2.5 - backfill de order`)
- [ ] **E3 — `moveCard` robusto:** Liberar reordenação dentro da mesma coluna com `moverNegocio(id, { etapaId, order })`, optimistic update e rollback. (`Commit: feat(kanban): E3 - moveCard com optimistic e rollback`)
- [ ] **E4 — Separação de responsabilidades:** Isolar `KanbanBoard.jsx` de chamadas diretas ao Firebase, centralizando escritas em `negocioService.js`. (`Commit: refactor(kanban): E4 - separa hook, board e service`)
- [ ] **E5 — UX Mobile First:** Colunas com `scroll-snap-type: x mandatory`, cards `min-h-11` (≥44px) e sheet `"Mover para…"` no mobile. (`Commit: feat(kanban): E5 - UX mobile first`)
- [ ] **E6 — Fechamento do Ciclo:** Atualizar `ARCHITECTURE.md` e `CHANGELOG.md`. (`Commit: docs(state): E6 - fecha ciclo Kanban`)

### 2.4 Resultado da Auditoria (E0)
- [ ] `order` ausente nos docs de `negocios`? `___`
- [ ] Lib de DnD identificada: `___` (versão `___`)
- [ ] `etapaId` / slug aplicado nos docs atuais? `___`
- [ ] `firestore.rules` valida `status`? `___`

### 2.5 Fora de Escopo neste Ciclo
- WIP limit por coluna, alerta de *"card parado há X dias"* e relatório de tempo por etapa (movidos para o roadmap pós-ciclo).

---

## 3. Módulo: Central de Ajuda e Controle de Chamados

### ✅ Concluído
- [x] **Fase 1 — Página Inicial (`src/pages/CentralDeAjuda.jsx`):** Implementada com barra de busca instantânea, filtro por categorias/módulos do CRM, acordeão de Perguntas Frequentes (FAQ) e bloco de suporte, devidamente roteada em `App.jsx` e vinculada ao `Sidebar`.
- [x] **Documentação Arquitetural:** Especificação da expansão registrada para `ARCHITECTURE.md` e `CHANGELOG.md`.

### ⬜ Pendente (Próximas Fases)
- [ ] **Fase 2 — Artigos Detalhados por Módulo:** Criar `src/data/artigosAjuda.js` com guias passo a passo por módulo (*Primeiros Passos*, *Contatos*, *Negócios*, *Relatórios*, *Produtos/Serviços*, *Equipe*) e componente de leitura (`DetalheArtigoModal.jsx`) integrado à busca.
- [ ] **Fase 3 — Abertura de Chamados:** Implementar `src/services/chamadoService.js` e `ModalAbrirChamado.jsx` capturando `titulo`, `modulo`, `tipo` (`duvida`/`bug`/`melhoria`), `prioridade`, `descricao` e metadados automáticos (`empresaId`, `solicitanteId`, `solicitanteRole`, `rotaOrigem`).
- [ ] **Fase 4 — Central de Controle de Chamados:** Desenvolver `ControleChamados.jsx` (KPIs de status, filtros, thread de mensagens e gestão por `admin`) e publicar regras da coleção `chamados` em `firestore.rules`.

---

## 4. Módulo: WhatsApp Business Cloud API & Leads em Tempo Real

### ✅ Concluído
- [x] **Webhook Serverless (`api/whatsapp-webhook.js`):** Operacional na Vercel sem custo fixo (`Require Log In` desativado), extraindo dados de leads via Groq/Gemini (com fallback) e persistindo em `contatos`, `negocios` e `whatsapp_sessoes` via `DEFAULT_EMPRESA_ID`.
- [x] **Gestão de Leads (`src/pages/Contatos.jsx`):** Exibição de leads com coluna dedicada **Observações** e filtro de busca abrangendo `observacoes`.
- [x] **Notificações em Tempo Real (`src/components/NotificacoesLeads.jsx` + `Layout.jsx`):** Listener `onSnapshot` em `contatos` por `empresaId` (ignorando carga inicial via `primeiraCargaRef`), disparando alerta sonoro (Web Audio API), toast clicável para `/app/contatos?tipo=leads` e badge no sino do cabeçalho.

### ⬜ Pendente
- [ ] Validar em produção o disparo conjunto de som, popup e badge no sino ao receber um novo lead real via WhatsApp/Meta Developers.
- [ ] Evoluir de `DEFAULT_EMPRESA_ID` para roteamento multi-tenant dinâmico por `phone_number_id` através da coleção `integracoes_whatsapp`.

---

## 5. Módulo: Painel Técnico Super Admin & Segurança

### ✅ Concluído
- [x] **Custom Claim & Auth:** Claim `superAdmin: true` atribuída via `scripts/set-super-admin.js` (Firebase Admin SDK) e exposta no `AuthContext.jsx` via `getIdTokenResult(true)`.
- [x] **Regras de Segurança (`firestore.rules`):** Função `isSuperAdmin()` ativa nas coleções operacionais, `whatsapp_sessoes` e `audit_logs`; regras RBAC de `negocios`, `contatos`, `tarefas`, `produtos`, `usuarios` e `empresas` publicadas.
- [x] **Inatividade:** Hook `useInactivityLogout` (30 minutos) integrado ao `AuthContext.jsx`.

### ⬜ Pendente
- [ ] Criar seletor de `empresaId` (*Context Switcher*) na interface para o Super Admin inspecionar e dar suporte a qualquer tenant sem alterar credenciais.
- [ ] Criar tela de diagnóstico técnico para monitorar/resetar sessões presas em `whatsapp_sessoes` e registrar ações em `audit_logs`.

---

## 6. Outros Módulos Operacionais (Status Consolidado)

- **Core & Layout:** ✅ Deploy ativo em `https://nexus-crm-green-one.vercel.app`, identidade visual esmeralda (claro/escuro) e navegação responsiva (`Sidebar`, `Layout.jsx`, `PageHeader`, `AuthLayout`).
- **Dashboard:** ✅ KPIs dinâmicos, Contatos Recentes e Pulso Comercial.
- **Tarefas:** ✅ Kanban (Pendentes, Vencidas, Concluídas), Lista, observações e modal rápido de renovação de data.
- **Produtos / Serviços:** ✅ CRUD completo e cálculo de itens mais vendidos nos relatórios.
- **Relatórios:** ✅ Correção de loading infinito (`Relatorios.jsx` + `useNegociosKanban.js`), carregamento por perfil (`admin`/`vendedor`), scroll vertical em notebooks (15,6") e mobile, KPIs e exportação PDF/CSV.
- **Gestão de Equipe & Configurações:** 🟡 CRUD de membros, convites e edição do nome da equipe concluídos; pendente organizar abas de *Conta / Segurança / Preferências* em Configurações.

---

## 7. Roadmap Geral

### Curto Prazo (Fechamento do MVP)
- [x] Contatos: separação Leads vs. Clientes e coluna Observações
- [x] Notificações em tempo real de novos leads (som, toast e sino)
- [x] Relatórios: correção de loading, filtros por vendedor/item e scroll responsivo
- [x] Central de Ajuda: Fase 1 (página inicial, busca e FAQ)
- [ ] Central de Ajuda & Chamados: Fases 2, 3 e 4 (artigos por módulo, abertura e controle de chamados)
- [ ] Kanban Mobile First: concluir etapas E0 a E6 (`order` float e sheet mobile)
- [ ] WhatsApp: validação end-to-end com Meta Developers e roteamento `integracoes_whatsapp`
- [ ] Painel Super Admin: seletor de `empresaId` e monitor de `whatsapp_sessoes`
- [ ] Configurações: abas Conta / Segurança / Preferências

### Médio Prazo (Escalabilidade)
- [ ] Multi-tenant avançado (1 usuário vinculado a N empresas)
- [ ] Transações atômicas no backend (Vercel Functions)
- [ ] Planos de assinatura e cobrança (Stripe / Mercado Pago)
- [ ] Notificações push via FCM (`notificacoes`)
- [ ] Importação em massa de contatos via CSV

### Longo Prazo & Pós-Ciclo Kanban
- [ ] Filtros avançados no board, WIP limit por coluna, alerta de card parado e tempo por etapa
- [ ] Automação do rebalanceamento de float (`order`)
- [ ] Agente de IA no CRM (resumos, sugestões de follow-up e análise de sentimento) e relatórios preditivos

---

## 8. Operações e Scripts de Manutenção

> Scripts administrativos ficam em `scripts/` e exigem `serviceAccountKey.json` / `service-account.json` local (protegidos no `.gitignore`) e relógio do sistema sincronizado.

- **Seed de Ambiente (`scripts/seed-nexus-hub.mjs`):** Limpa e popula dados de teste (empresa, usuários admin/vendedores, produtos, serviços, leads, clientes e negócios). Executar com `node scripts/seed-nexus-hub.mjs`.
- **Atribuição de Super Admin (`scripts/set-super-admin.js`):** Concede custom claim `superAdmin: true` a um UID específico via `node scripts/set-super-admin.js`.
- **Backfill de `order` (E2.5 — Planejado):** Script idempotente para preencher `order` numérico em `negocios` antigos ordenados por `createdAt`.
- **Rebalanceamento de Float (D4 — Planejado):** Reespacamento de `order` com gaps de `1.0` caso `|a.order - b.order| < 0.0001`.

---

## 9. Histórico Resumido de Sessões

- **Sessões 22–24:** Planejamento do módulo WhatsApp (`MODULO_WHATSAPP.md`), modelagem de notificações/recuperação de senha e implementação do logout automático por inatividade (`useInactivityLogout`).
- **Sessão 25 (2026-11-24):** Validação do deploy em produção na Vercel (acesso externo/mobile e webhook público) e implementação da base de `superAdmin` (custom claim, `firestore.rules` e `AuthContext.jsx`).
- **Sessão 26 (2026-11-25):** Estabilização do webhook WhatsApp com extração por IA, inclusão da coluna *Observações* e busca em `Contatos.jsx`, e criação de alertas em tempo real (`NotificacoesLeads.jsx`).
- **Sessão 27 (2026-11-26):** Correção do loading e da rolagem responsiva (notebook 15,6" e mobile) em `Relatorios.jsx`, implementação da página inicial da `CentralDeAjuda.jsx` (com rotas/menu) e consolidação da documentação do repositório.