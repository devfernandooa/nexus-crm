# Nexus CRM 🚀

> Um sistema de CRM (Customer Relationship Management) moderno, construído como um SaaS Multi-tenant. Projetado para ser escalável, seguro e com uma interface focada na experiência do usuário (UX).

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![React](https://img.shields.io/badge/React-18-blue)
![Vite](https://img.shields.io/badge/Vite-5-purple)
![Tailwind](https://img.shields.io/badge/Tailwind-3-cyan)
![Firebase](https://img.shields.io/badge/Firebase-10-orange)

## 🎯 Sobre o Projeto

O Nexus é um CRM genérico (não engessado em nichos) focado em gestão de contatos e oportunidades. A arquitetura foi pensada desde o início para suportar múltiplas empresas (Multi-tenant) de forma isolada e segura.

### Principais Funcionalidades (Em Construção)

- [x] Landing Page institucional.
- [x] Autenticação de usuários (Login e Cadastro).
- [x] Arquitetura Multi-tenant (cada cadastro cria uma empresa e vincula o usuário como Admin).
- [ ] Dashboard de métricas.
- [ ] CRUD de Contatos (Leads).
- [ ] CRUD de Oportunidades / Negócios.
- [ ] Gestão de usuários da equipe (RBAC).

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React + Vite
- **Estilização:** TailwindCSS (Design System próprio)
- **Roteamento:** React Router DOM
- **Backend as a Service (BaaS):** Firebase
  - **Auth:** Autenticação de usuários.
  - **Firestore:** Banco de dados NoSQL (Estrutura Multi-tenant).
- **Gerenciamento de Estado:** Context API (AuthContext).

## 🏗️ Arquitetura do Projeto

A estrutura de pastas foi desenhada usando o padrão **Feature-based**, separando as regras de negócio da interface:

```text
src/
├── components/       # Componentes reutilizáveis (Botao, Input)
├── contexts/         # Contextos globais (AuthContext)
├── services/         # Regras de negócio e comunicação com o Firebase
├── pages/            # Telas principais (LandingPage, Login, Cadastro, Dashboard)
└── features/         # Módulos do CRM (contatos, negocios, dashboard)
```
