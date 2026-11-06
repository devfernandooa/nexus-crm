---

### 3. `CONTEXTO.md` (Criar novo)

```markdown
# CONTEXTO.md — Nexus CRM

> **Propósito:** Diário de bordo do desenvolvimento. O que já foi feito e qual é o próximo passo imediato.

## 1. Status Atual do Desenvolvimento

### O que já está implementado:

- [x] **Setup Inicial:** React, Vite, Tailwind, Firebase (Auth + Firestore).
- [x] **Landing Page:** Página inicial com tema claro/escuro.
- [x] **Autenticação:** Login, Cadastro e Contexto (`AuthContext`).
- [x] **Multi-tenant:** Criação de empresa e vínculo do usuário Admin no cadastro.
- [x] **Layout Premium:** Sidebar escura com ícones e submenus, Header com perfil do usuário.
- [x] **Dashboard:** Tela inicial com KPIs (mockados) e Ações Rápidas.

### O que estamos fazendo agora:

- [ ] **CRUD de Contatos:** Criação do Modal e formulário para adicionar novos contatos (Leads).

## 2. O Próximo Passo Imediato

Estamos no meio da implementação da criação de contatos.

1.  O componente `<Modal />` já foi criado em `src/components/ui/Modal.jsx`.
2.  O botão "Novo Contato" na página `Contatos.jsx` já abre o Modal.
3.  **A fazer:** Construir o formulário dentro do Modal (Nome, E-mail, Telefone, Status) e criar a função `adicionarContato` no `contatoService.js` (lembrando de passar o `empresaId` do `AuthContext`).

## 3. Notas de Decisão (Histórico)

- **Modelo de Cadastro:** Optamos por manter o cadastro inicial enxuto (Empresa, Responsável, Segmento). Dados complexos (CNPJ, Endereço) serão movidos para a tela de "Configurações" no futuro, para não assustar o usuário no primeiro contato.
- **Modelo de 1 Usuário = 1 Empresa:** Para o MVP, um usuário gerencia uma empresa. A arquitetura de múltiplos vínculos (ex: um contador com 2 empresas) ficará para o futuro.
```
