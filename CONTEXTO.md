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