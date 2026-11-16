# ROADMAP_FUTURO — Nexus CRM

## 1. Curto Prazo (Concluir o MVP)

- [ ] **Contatos: Leads vs. Clientes:** Implementar filtros na página de Contatos para separar Leads de Clientes.
- [ ] **Gestão de Equipe: Editar/Excluir:** Permitir que o Admin remova ou altere o cargo de membros da equipe.
- [ ] **Configurações Avançadas:** Criar abas na tela de configurações (Perfil, Preferências, Segurança).
- [ ] **Auditoria:** Registrar logs de ações (criação, edição, exclusão) na coleção `auditoria` do Firestore.
- [ ] **Central de Ajuda:** Criar uma página estática com tutoriais e FAQ para o usuário.

## 2. Médio Prazo (Escalabilidade e Produto)

- [ ] **Modelo Multi-tenant Avançado:** Permitir que um único usuário participe de várias empresas (ex: contadores, agências).
- [ ] **Cloud Functions:** Mover lógicas críticas (como criação de usuário e empresa) para o backend (Firebase Functions) para garantir transações atômicas.
- [ ] **Planos de Assinatura:** Integração com Stripe ou Mercado Pago para cobrança recorrente.
- [ ] **Notificações em Tempo Real:** Firebase Cloud Messaging (FCM) para avisar o usuário sobre novos leads ou tarefas.

## 3. Longo Prazo (Inovação)

- [ ] **Agente de IA:** Integração com OpenAI/Gemini para resumir negócios, sugerir follow-ups e analisar sentimento de e-mails.
- [ ] **Integração com WhatsApp:** API oficial para envio de mensagens diretamente do CRM.
- [ ] **Relatórios Preditivos:** Previsão de vendas baseada em dados históricos.
