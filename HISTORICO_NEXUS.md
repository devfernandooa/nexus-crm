# HISTORICO_NEXUS.md — Diário de Bordo do CRM SaaS

## Sessão 1 — [Data de Hoje]

- **O que fiz:**
  - Criação do projeto `nexus-crm` (Vite + React + Tailwind).
  - Criação do novo projeto no Firebase (Auth + Firestore) e isolamento das variáveis de ambiente (`.env`).
  - Criação da Landing Page escura com Tailwind.
  - Implementação do fluxo de Cadastro Multi-tenant: criação do usuário no Auth, criação da empresa no Firestore e vinculação do usuário (role: admin) à empresa.
  - Configuração das Regras de Segurança do Firestore (RBAC básico).
- **O que aprendi:**
  - Como funciona a arquitetura Multi-tenant na prática (precisamos do ID da empresa para isolar os dados).
  - A importância de usar o `doc(collection(db, 'empresas'))` para gerar um ID antes de salvar o documento (para podermos vincular ao usuário).
  - O tratamento de erros de autenticação (ex: e-mail já em uso) e as regras de segurança do Firestore.
- **O que travou:**
  - A duplicidade de nomes entre a função local e a função do serviço (resolvido renomeando a local para `handleSubmit`).
  - O banco não estava criado no Console do Firebase.
  - O usuário de teste ficou "preso" no Auth impedindo um novo teste (resolvido deletando o usuário no Console).
- **Próximo passo:** Criar a tela do Dashboard (`/app`) para exibir os dados da empresa logada e começar o CRUD de Contatos (o coração do CRM).
