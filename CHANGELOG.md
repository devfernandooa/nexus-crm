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

## Sessão 39 (2026-11-21) — Resiliência do Kanban e Prevenção de Dados Órfãos

**Contexto:** A exclusão ou renomeação de etapas do funil deixava negócios "invisíveis" (órfãos) no banco de dados, pois o frontend não os renderizava no Kanban.

**O que fiz:**

- Criação da função `buscarContagemNegociosPorEtapa` no `negociosService` para agregação de dados por status.
- Refatoração do `ModalConfigurarFunil`:
  - Bloqueio visual e lógico da exclusão e edição de etapas que possuem negócios.
  - Integração do `ConfirmModal` para confirmação dupla de exclusão.
  - Criação de um banner de "Ação Necessária" em vermelho vivo no topo do modal caso existam negócios órfãos (com status que não batem com o funil).
- Refatoração do `useNegociosKanban`:
  - Criação de um `useMemo` para agrupar as colunas (`colunasAgrupadas`).
  - Implementação da coluna virtual "Sem Etapa" (`isVirtual: true`) no final do board para capturar órfãos.
  - Bloqueio do drag-and-drop de cards válidos para a coluna virtual.
- Refatoração do `KanbanColumn`:
  - Aplicação de estilo visual distinto (fundo avermelhado e borda) para a coluna "Sem Etapa", sinalizando alerta.

**Aprendi:**

- Como garantir resiliência de dados em sistemas NoSQL onde a integridade referencial (Foreign Keys) não é imposta pelo banco.
- Padrão de UI "Fallback Column" para tratamento de erros de dados sem impactar a experiência do usuário.

**Próximo passo:** Implementar a ordenação manual dos cards dentro da mesma coluna (campo `order` float e optimistic update).

## Sessão 40 (2026-11-21) — Refinamento de Layout, Responsividade e Cores do Funil

**Contexto:** Sequência de melhorias visuais, de layout e de usabilidade no módulo de Negócios, na navegação lateral e na configuração de cores do funil, com atenção aos temas claro e escuro e à responsividade.

**O que fiz (em ordem cronológica):**

1. **Cabeçalho e espaçamento inicial (`Negocios.jsx`):** melhoria da legibilidade do título, redução dos espaçamentos internos e concentração da rolagem na área das colunas.
2. **Base global e layout (`src/index.css` e `Layout.jsx`):** limpeza de regras globais em conflito e remoção do _padding_ externo do `<main>` para eliminar faixas laterais/superiores e manter a rolagem contida[cite: 5].
3. **Ajuste de tipografia, KPIs e espaçamentos (`Negocios.jsx`):** aumento do título e da mensagem de apoio, redimensionamento dos KPIs e ajuste do espaçamento entre os controles superiores.
4. **Cabeçalho fixo por coluna (`KanbanColumn.jsx`):** aplicação de `sticky` no topo de cada coluna para manter título, valor e contagem visíveis durante a rolagem vertical[cite: 5].
5. **Rebranding e ajustes da `Sidebar` (`Sidebar.jsx`):** alteração do nome para **Nexus Hub**, cores para temas claro e escuro, transição de _hover_, remoção do submenu _"Meus Negócios"_ e ajustes de fonte e largura[cite: 5, 9, 10, 11].
6. **Responsividade no _mobile_ (`Negocios.jsx` e `KanbanColumn.jsx`):** alinhamento dos KPIs em três colunas e empilhamento vertical das colunas em telas estreitas (`flex-col md:flex-row`)[cite: 13, 16].
7. **Cores suaves por coluna (`KanbanColumn.jsx`):** introdução de cores suaves distintas para diferenciar as etapas ao longo de toda a coluna[cite: 14, 17].
8. **Paleta configurável por etapa (`src/constants/funilCores.js`, `ModalConfigurarFunil.jsx` e `useNegociosKanban.js`):** criação da paleta inicial e ampliada, escolha/alteração de cor por etapa, restauração do padrão e persistência da cor no funil[cite: 17, 18, 20].

**Aprendi:**

- Isolar o _padding_ externo no `Layout` e controlar a rolagem por área evita espaços indesejados nas bordas e mantém o quadro mais aproveitável[cite: 5].
- Centralizar os tokens de cor e repassá-los pelo _hook_ do Kanban garante consistência visual entre o modal de configuração e as colunas renderizadas.

**Próximo passo:** Continuar o ciclo de evolução do produto a partir deste estado, seguindo o planejamento em `PROJECT_STATE.md`.

# Changelog — Nexus Hub

Todas as mudanças relevantes do projeto estão registradas neste arquivo.

## [2026-11-21]

### Alterado

- **Autenticação (`AuthLayout.jsx`, `Login.jsx`, `Cadastro.jsx`):**
  - Padronizada a identidade **Nexus Hub** com paleta **verde esmeralda (`emerald`)** e suporte completo aos temas claro e escuro.
  - Igualada a altura do cartão no desktop (`md:h-[650px]`) entre **Login** e **Cadastro**, adicionada transição direcional entre as rotas e criado plano de fundo em camadas para os modos claro e escuro.
  - Substituídos os ícones genéricos dos botões do `Login.jsx` por ícones reais (Google, GitHub e WhatsApp).
  - Adicionada verificação visual em tempo real para divergência ou correspondência entre **Senha** e **Confirmar Senha** no `Cadastro.jsx`.
- **Sidebar e Cabeçalho (`Sidebar.jsx`, `PageHeader.jsx`):**
  - Removidos tons azuis residuais da `Sidebar` (logo, avatar, badge de papel, links ativos e modal de perfil) e do ícone do `PageHeader`, adotando **verde esmeralda (`emerald`)** com alto contraste.
- **Dashboard (`Dashboard.jsx`):**
  - Adicionado respiro lateral em relação à `Sidebar` e à borda direita, compactados os cartões de KPI, removidos acentos azuis e padronizados os botões **Agendar** e **Novo Contato**.
  - Adicionado o bloco **Pulso Comercial** na parte inferior para aproveitar o espaço da tela com indicadores do funil.
- **Contatos (`Contatos.jsx`):**
  - Alinhado ao tema **verde esmeralda (`emerald`)** e às margens padrão da aplicação, com contadores nas abas (**Todos**, **Leads**, **Clientes**), busca expandida e botão para limpar filtro de texto.
- **Negócios / Kanban (`Negocios.jsx`):**
  - Migrados cabeçalho, botões, seletores de visualização, KPIs e modal para **verde esmeralda (`emerald`)** com maior destaque visual e margens alinhadas, preservando integralmente a estrutura e o formato das colunas do Kanban.
- **Tarefas (`Tarefas.jsx`):**
  - Adotado formato **Kanban** (**Pendentes**, **Vencidas**, **Concluídas**) com alternância para **Lista**.
  - Adicionado campo **`textarea` de Observações**, exibição detalhada de prazo/observações nos cards e ação **Renovar data** disponível para qualquer tarefa.
