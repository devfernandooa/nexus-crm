---

### 2. `CONTEXTO.md`
*Foco: Diário de bordo atualizado com o status atual e os próximos passos.*

```markdown
# CONTEXTO.md — Nexus CRM

> **Propósito:** Diário de bordo do desenvolvimento. O que já foi feito e qual é o próximo passo imediato.

## 1. Status Atual do Desenvolvimento

### O que já está implementado (Concluído):
- [x] **Setup Inicial:** React, Vite, Tailwind, Firebase (Auth + Firestore).
- [x] **Landing Page:** Página inicial com tema claro/escuro.
- [x] **Autenticação Completa:** Login, Cadastro e `AuthContext` (buscando `empresaId` e `role`).
- [x] **Multi-tenant Base:** Isolamento de dados garantido em todas as queries.
- [x] **Layout Premium:** Sidebar escura com ícones, card de usuário editável, e Header com status do Firestore.
- [x] **Dashboard:** Tela inicial com KPIs dinâmicos (contatos, negócios, tarefas, receita) e Ações Rápidas.
- [x] **CRUD de Contatos:** Criação, leitura, edição e exclusão. Campos: Nome, E-mail, Telefone, Cargo, Empresa, Endereço, Observações e Status.
- [x] **CRUD de Negócios (Kanban):** Funil de vendas visual com Drag and Drop (desktop) e botões de avanço (mobile).
- [x] **Integração Produtos ↔ Negócios:** Seleção de produtos no modal de negócios com cálculo automático do valor total.
- [x] **CRUD de Produtos / Serviços:** Catálogo completo com nome, preço, tipo e descrição.
- [x] **Módulo de Tarefas:** Lista de tarefas com filtros, data de vencimento e status (concluída/pendente).
- [x] **Relatórios:** Gráficos (Pizza e Barras) com dados reais e **exportação em PDF e CSV**.
- [x] **Gestão de Equipe (Convites):** Sistema de convites para novos membros e visualização da equipe.
- [x] **Tela de Configurações (Empresa):** Edição do perfil da empresa (Nome, Responsável, Segmento).
- [x] **Mobile First:** Layouts responsivos em todos os módulos.

### O que está pendente (Próximos Passos):
- [ ] **Contatos: Leads vs. Clientes:** Filtrar a página de Contatos para separar Leads de Clientes (via rota e abas).
- [ ] **Gestão de Equipe: Editar/Excluir:** Permitir que o Admin edite o cargo ou remova membros da equipe.
- [ ] **Configurações: Abas de Conta e Preferências:** Refinar a tela de configurações (Perfil do Usuário, Senha, Preferências).
- [ ] **Auditoria (Logs):** Registrar ações de criação, edição e exclusão na coleção `auditoria`.

---

## 2. Histórico de Sessões

### Sessões 1 a 4 — (Setup e Autenticação)

- **O que fiz:** Configuração do Vite, Tailwind e Firebase. Criação da Landing Page. Autenticação (Login/Cadastro). Criação do `AuthContext` (Multi-tenant).

### Sessão 5 — (CRUD de Contatos)

- **O que fiz:** Implementação do CRUD de Contatos com escuta em tempo real (`onSnapshot`).
- **O que aprendi:** Como gerenciar estado de edição/criação com `contatoEditando` e filtrar queries por `empresaId`.

### Sessão 6 — (Tela de Configurações da Empresa)

- **O que fiz:** Criação da tela de Configurações (dados da empresa) e do `empresaService.js`.

### Sessão 7 — (Kanban de Negócios e Padronização de UI)

- **O que fiz:** Implementação do funil (Drag and Drop). Criação do `ConfirmModal` e integração do `react-hot-toast`. Correção semântica do `<h1>`.

### Sessão 8 — (Responsividade Mobile First)

- **O que fiz:** Menu hambúrguer, tabelas transformadas em cards no mobile, colunas do Kanban empilhadas.

### Sessão 9 — (Relatórios e Padronização de Cabeçalhos)

- **O que fiz:** Criação da página de Relatórios com gráficos (Recharts). Criação do componente `PageHeader` para unificar títulos.

### Sessão 10 — (Módulo de Tarefas)

- **O que fiz:** CRUD de Tarefas com data de vencimento e filtros (Todas, Pendentes, Concluídas).

### Sessão 11 — (Gestão de Equipe e Convites)

- **O que fiz:** Sistema de convites (coleção `convites`), vinculação automática do convidado à empresa ao se cadastrar.

### Sessão 12 — (Módulo de Produtos e Serviços)

- **O que fiz:** CRUD de Produtos/Serviços com busca e layout responsivo.

### Sessão 13 a 15 — (Exportação, Perfil e Refinamentos)

- **O que fiz:** Exportação de Relatórios (PDF/CSV), edição de perfil do usuário, logout com modal e redirecionamento, integração de Produtos aos Negócios.

---

## 3. Decisões de Arquitetura (Histórico)

- **Modelo de Cadastro:** Cadastro inicial enxuto (Empresa, Responsável, Segmento). Dados complexos são geridos na tela de Configurações.
- **Modelo de 1 Usuário = 1 Empresa:** Para o MVP. A arquitetura de múltiplos vínculos (ex: contador com 2 empresas) ficará para o futuro.
- **Geração de PDF/CSV no Front-end:** Para evitar custos de Cloud Functions.
- **Mobile First:** Regra imutável a partir da Sessão 8.

### Sessão 20 — (Auditoria e Início da Estabilização)

- **O que fiz:**
  - Recebi um relatório de auditoria técnica apontando 5 problemas críticos.
  - Criei o plano de ação no arquivo `AUDITORIA_E_CORRECOES.md`.
  - Criei o arquivo `firestore.rules` com as regras de segurança Multi-tenant e RBAC.
- **O que aprendi:**
  - A importância de regras de segurança no Firestore para impedir que usuários mal-intencionados acessem dados de outras empresas via console.
  - O conceito de condição de corrida (race condition) no cadastro.
- **Próximo passo:** Aplicar as regras no Console, corrigir o bug do `deleteDoc` e refatorar o `AuthContext` para usar `onSnapshot`.

### Sessão 21 — (Testes Finais e Correções)

- **O que fiz:**
  - Corrigi o bug de fuso horário nas datas de vencimento.
  - Sincronizei o nome do responsável da empresa com o Sidebar.
  - Executei a bateria completa de testes em todos os módulos.
- **O que aprendi:**
  - A importância de testar o sistema como um todo antes de entregar para o cliente.
  - Como o isolamento Multi-tenant funciona na prática (teste de URL direta).
- **Próximo passo:** Deploy na Vercel para o cliente.

# CONTEXTO.md — Nexus CRM

> **Propósito:** Diário de bordo do desenvolvimento. O que já foi feito e qual é o próximo passo imediato.

## 1. Status Atual do Desenvolvimento (Atualizado: Pós-Fase D)

### ✅ O que está implementado (Concluído):

- [x] **Setup Inicial:** React, Vite, Tailwind, Firebase (Auth + Firestore).
- [x] **Landing Page:** Página inicial com tema claro/escuro.
- [x] **Autenticação Completa:** Login, Cadastro e `AuthContext` (buscando `empresaId` e `role`).
- [x] **Multi-tenant Base:** Isolamento de dados garantido em todas as queries.
- [x] **Layout Premium:** Sidebar escura com ícones, card de usuário editável, e Header com status do Firestore.
- [x] **Dashboard:** Tela inicial com KPIs dinâmicos (contatos, negócios, tarefas, receita) e Ações Rápidas.
- [x] **CRUD de Contatos:** Criação, leitura, edição e exclusão. Campos: Nome, E-mail, Telefone, Cargo, Empresa, Endereço, Observações e Status.
- [x] **Módulo de Negócios (Kanban Avançado):**
  - Funil de vendas visual com Drag and Drop (`@hello-pangea/dnd`) otimizado para desktop.
  - Navegação por botões (setas) otimizada para mobile (touch-manipulation).
  - **Funil Dinâmico:** Configuração de etapas via modal "Etapas" (adicionar, remover, reordenar).
  - Migração automática de dados legados para novas estruturas de funil.
  - Scroll horizontal robusto ("Full Bleed") sem cortes visuais.
- [x] **Visualização Múltipla:** Switcher entre Kanban e Lista (tabela densa com ordenação). Preferência salva no localStorage.
- [x] **Drawer Lateral Rico:** Detalhes do negócio com abas (Visão Geral, Atividades Vinculadas, Produtos/Serviços).
- [x] **Integração Produtos ↔ Negócios:** Seleção de produtos no modal de negócios com cálculo automático do valor total e exibição detalhada no drawer.
- [x] **CRUD de Produtos / Serviços:** Catálogo completo com nome, preço, tipo e descrição.
- [x] **Módulo de Tarefas:** Lista de tarefas com filtros, data de vencimento e status. Integração com negócios via `negocioId`.
- [x] **Relatórios:** Gráficos (Pizza e Barras) com dados reais e exportação em PDF e CSV.
- [x] **Gestão de Equipe (Convites):** Sistema de convites para novos membros e visualização da equipe.
- [x] **Tela de Configurações (Empresa):** Edição do perfil da empresa e gerenciamento do funil de vendas.
- [x] **Mobile First:** Layouts responsivos em todos os módulos, com interações adaptadas para toque.
- [x] **Refinamento Visual Premium:** Tipografia hierárquica, contraste ajustado para temas claro/escuro, KPIs compactos e layout estilo Pipedrive.

### 📋 O que está pendente (Próximos Passos):

- [ ] **Contatos: Leads vs. Clientes:** Filtrar a página de Contatos para separar Leads de Clientes (via rota e abas).
- [ ] **Gestão de Equipe: Editar/Excluir:** Permitir que o Admin edite o cargo ou remova membros da equipe.
- [ ] **Configurações: Abas de Conta e Preferências:** Refinar a tela de configurações (Perfil do Usuário, Senha, Preferências).
- [ ] **Auditoria (Logs):** Registrar ações de criação, edição e exclusão na coleção `auditoria`.
- [ ] **Importação de Dados:** Wizard para importação de contatos/negócios via CSV com mapeamento de colunas.

---

## 2. Histórico de Sessões Recentes

### Sessão 22 a 25 — (Refatoração do Kanban e SoC)

- **O que fiz:** Extração de lógica para `useNegociosKanban`, criação de `KanbanCard` e `KanbanColumn` isolados. Implementação de drag-and-drop seguro e navegação mobile com botões de seta.
- **Decisões:** Separação radical de responsabilidades. Mobile usa clique/toque; Desktop usa arrasto.

### Sessão 26 a 28 — (Drawer de Detalhes e Integração de Tarefas)

- **O que fiz:** Criação do `NegocioDrawer` com abas. Integração de tarefas vinculadas via filtro local (`negocioId`). Refinamento tipográfico para padrão enterprise.
- **Decisões:** Uso de filtragem client-side para tarefas para evitar índices compostos complexos no MVP.

### Sessão 29 a 31 — (Switcher de Views e Ordenação)

- **O que fiz:** Implementação de `ListView` e switcher Kanban/Lista. Persistência de preferência em localStorage. Ordenação dinâmica por valor, data e título.
- **Decisões:** View mode é estado local persistente. Lista usa tabela nativa com scroll horizontal no mobile.

### Sessão 32 a 36 — (Funil Dinâmico e Layout Full Bleed)

- **O que fiz:** Modal `ConfigurarFunil` com CRUD de etapas e reordenação via DND. Hook `useNegociosKanban` agora lê etapas do Firestore. Layout "Full Bleed" sem margens laterais. Correções críticas de altura para DND funcionar com scroll horizontal.
- **Decisões:** Altura fixa via `calc(100vh - Xpx)` no container do DND para garantir estabilidade do arrasto. Funil armazenado como array no doc da empresa.

### Sessão 37 — (Refinamento Final de UI/UX)

- **O que fiz:** Ajuste de contraste de títulos no modo claro. Remoção de ID do drawer. Botões de ação no rodapé do drawer (Editar/Fechar). Enriquecimento da aba "Visão Geral" com lista detalhada de produtos.
- **Decisões:** Drawer fecha ao editar para evitar sobreposição de modais. Título do drawer usa `text-slate-900` para legibilidade máxima.

---

## 3. Decisões de Arquitetura (Atualizadas)

- **Modelo de Funil:** Etapas são um array simples no documento da empresa (`etapasFunil`). "Ganho" e "Perdido" são tratados logicamente como as duas últimas etapas para KPIs.
- **Drag & Drop Horizontal:** Requer container com altura explícita (`h-[calc(...)]`) e `min-w-max` no wrapper interno. Nunca usar `flex-1` herdados para containers de DND com scroll.
- **Mobile First Real:** Cards não são arrastáveis no mobile. Usam botões de ação rápida e toque para abrir detalhes.
- **Separação de Responsabilidades:** Páginas são orquestradores. Lógica de dados fica em hooks. UI fica em componentes burros.
