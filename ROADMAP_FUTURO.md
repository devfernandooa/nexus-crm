# ROADMAP_FUTURO — Nexus CRM

## 1. Evolução do Produto (Curto/Médio Prazo)

- [ ] **Módulo de Contatos:** CRUD completo (Criar, Ler, Editar, Deletar) com filtros.
- [ ] **Módulo de Negócios:** Funil de vendas (Kanban) e gerenciamento de oportunidades.
- [ ] **Relatórios:** Gráficos de conversão e desempenho.
- [ ] **Configurações:** Edição do perfil da empresa (CNPJ, endereço, logo) e gestão de usuários.

## 2. Escalabilidade e Arquitetura (Longo Prazo)

- **Modelo Multi-tenant Avançado:** Permitir que um único usuário participe de várias empresas (necessário para contadores e agências).
- **Cloud Functions:** Mover a lógica de criação de conta e empresa do front-end para o back-end (via Firebase Cloud Functions), para garantir transações atômicas à prova de falhas.
- **Planos de Assinatura:** Integração com Stripe ou Mercado Pago para cobrança recorrente.

## 3. Expansão

- Integração com WhatsApp Business API.
- Automação de e-mails de follow-up.
