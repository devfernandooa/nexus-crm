# CONTEXTO.md — Nexus CRM

> **Propósito:** Diário de bordo do desenvolvimento. O que já foi feito e qual é o próximo passo imediato.

---

## 1. Status Atual do Desenvolvimento

### O que já está implementado (Concluído):
- [x] **Setup Inicial:** React, Vite, Tailwind, Firebase (Auth + Firestore).
- [x] **Landing Page:** Página inicial com tema claro/escuro e layout premium.
- [x] **Autenticação Completa:** Login, Cadastro (com Nome da Empresa, Responsável e Segmento) e `AuthContext` buscando dados do usuário (`empresaId` e `role`).
- [x] **Multi-tenant Base:** Isolamento de dados garantido em todas as queries e documentos (via `empresaId`).
- [x] **Layout Premium:** Sidebar escura com ícones, card de usuário, e Header com status do Firestore.
- [x] **Dashboard:** Tela inicial com KPIs mockados e Ações Rápidas.
- [x] **CRUD de Contatos (Completo):** 
  - **Create & Read:** Formulário no Modal e listagem em tempo real (`onSnapshot`).
  - **Update:** Edição de contatos reutilizando o Modal.
  - **Delete:** Exclusão com confirmação (`window.confirm`).
- [x] **Tela de Configurações:** Edição do perfil da empresa (Nome, Responsável, Segmento) com integração ao Firestore e feedback visual.

### O que estamos fazendo agora (Próximo Passo):
- [ ] **Módulo de Negócios (Funil de Vendas):** Criação da estrutura inicial para gerenciar as oportunidades de venda (leads convertidos). O objetivo é implementar uma lista de negócios com filtros de status e, futuramente, um Kanban.

---

## 2. O Próximo Passo Imediato

Estamos prontos para iniciar o módulo de **Negócios**. 
1.  Precisamos criar a página `Negocios.jsx` e a rota correspondente no `App.jsx`.
2.  Vamos criar o serviço `negocioService.js` (similar ao `contatoService.js`) para salvar as oportunidades no Firestore.
3.  **A fazer:** Construir a interface de listagem dos negócios (com KPIs de valor total e status).

---

## 3. Notas de Decisão (Histórico)

- **Modelo de Cadastro:** Optamos por manter o cadastro inicial enxuto (Empresa, Responsável, Segmento). Dados complexos (CNPJ, Endereço) são gerenciados na tela de "Configurações".
- **Modelo de 1 Usuário = 1 Empresa:** Para o MVP, um usuário gerencia uma empresa. A arquitetura de múltiplos vínculos ficará para o futuro.
- **Atualização de Perfil:** A tela de Configurações usa `updateDoc` no Firestore. Para refletir as mudanças no Dashboard imediatamente, implementamos um `window.location.reload()` após salvar.

---

## 4. Diário de Bordo (Histórico de Sessões)

### Sessão 1 a 4 — (Setup, Autenticação, Layout e Dashboard)
- **O que foi feito:** Configuração do Vite, Tailwind e Firebase. Criação da Landing Page. Integração do Firebase Auth (Login/Cadastro). Criação do `AuthContext` (Multi-tenant). Refatoração do Layout (Sidebar escura, Header, ícones do Lucide). Criação dos KPIs do Dashboard.

### Sessão 5 — (CRUD de Contatos Completo)
- **O que fiz:** Implementei todas as operações do CRUD de Contatos. Criei o formulário no Modal, a escuta em tempo real com `onSnapshot` (filtrando por `empresaId`), a edição de contatos e a exclusão com confirmação.
- **O que aprendi:** Como usar o `updateDoc` e `deleteDoc`. Como gerenciar o estado de "edição" vs "criação" com a variável `contatoEditando`. A importância de filtrar as queries pelo `empresaId`.
- **Próximo passo:** Iniciar o módulo de Negócios (Funil de Vendas).

### Sessão 6 — (Tela de Configurações)
- **O que fiz:** Criei a tela de Configurações da Empresa. Implementei o `empresaService.js` para atualizar os dados no Firestore. Adicionei feedback visual de sucesso e o reload da página para atualizar o Header.
- **O que aprendi:** Como atualizar documentos existentes no Firestore e como lidar com o estado global do `AuthContext` após uma edição.
- **Próximo passo:** Módulo de Negócios (Kanban/Lista).


### Sessão 7 — (Kanban de Negócios e Padronização de UI)
- **O que fiz:** 
  - Implementei o funil de vendas (Kanban) com a biblioteca `@hello-pangea/dnd`.
  - Criei o componente `ConfirmModal` e integrei o `react-hot-toast` para substituir os alertas nativos do navegador.
  - Apliquei os novos padrões de feedback visual nas telas de Contatos e Negócios.
  - Corrigi a semântica da Sidebar (`<h3>` para o logo).
- **O que aprendi:** 
  - Como funciona o ecossistema de Drag and Drop no React (Droppable, Draggable, DragDropContext).
  - Como gerenciar notificações globais usando uma biblioteca externa.
  - A importância de padronizar os feedbacks (Modais e Toasts) para manter a experiência do usuário coesa.
- **Próximo passo:** Iniciar o módulo de **Tarefas** ou a **Página de Relatórios** com gráficos.

### Sessão 8 — (Responsividade e Mobile First)
- **O que fiz:** 
  - Implementei o menu "hambúrguer" no Header para mobile, com Sidebar deslizante.
  - Adaptei a tabela de Contatos para virar cards empilhados no mobile.
  - Ajustei o Kanban de Negócios para empilhar as colunas verticalmente em telas pequenas.
- **O que aprendi:** 
  - Como usar as classes `md:` do Tailwind para criar layouts responsivos sem duplicar código.
  - A importância de otimizar os botões de ação para toque (touch targets maiores no mobile).
- **Próximo passo:** Iniciar o módulo de **Tarefas** ou a **Página de Relatórios**.

### Sessão 9 — (Módulo de Relatórios e Padronização de UI)
- **O que fiz:** 
  - Implementei o módulo de Relatórios com gráficos (Pizza e Barras) usando a biblioteca Recharts.
  - Criei o `relatorioService.js` para calcular KPIs (taxa de conversão, receita, totais).
  - Criei o componente reutilizável `PageHeader` para padronizar os títulos das páginas (ícone, título e subtítulo) em todo o sistema.
  - Apliquei o `PageHeader` nas telas de Relatórios, Negócios e Contatos.
  - Ajustei o contraste e o tamanho das fontes para melhorar a legibilidade no tema claro.
- **O que aprendi:** 
  - Como integrar gráficos no React usando Recharts.
  - A importância de criar componentes de layout (como o PageHeader) para manter a consistência visual e facilitar a manutenção.
  - Como usar o modificador `!` (important) do Tailwind para forçar cores específicas quando o tema global insiste em sobrescrever.
- **Próximo passo:** Implementar a lógica real de exportação (PDF/CSV) ou iniciar o módulo de Gestão de Equipe (convidar usuários).