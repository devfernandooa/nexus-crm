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