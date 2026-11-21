# ROADMAP_FUTURO — Nexus CRM

## 1. Curto Prazo (Concluir o MVP)

- [ ] Contatos: separar Leads vs. Clientes
- [ ] Gestão de Equipe: editar/excluir membros
- [ ] Configurações: abas Conta/Segurança/Preferências
- [ ] Auditoria (logs em `auditoria`)
- [ ] Central de Ajuda (FAQ estático)
- [ ] Importação de dados via CSV

## 2. Médio Prazo (Escalabilidade e Produto)

- [ ] Multi-tenant avançado (1 usuário → N empresas)
- [ ] Cloud Functions para transações atômicas
- [ ] Planos de assinatura (Stripe/Mercado Pago)
- [ ] Notificações em tempo real (FCM)

## 3. Longo Prazo (Inovação)

- [ ] Agente de IA (resumos, follow-ups, sentimento)
- [ ] Integração WhatsApp (API oficial)
- [ ] Relatórios preditivos

## 4. Ciclo Atual — Kanban Mobile First

> Detalhes em `CICLO_KANBAN.md`.

- [ ] E0 Auditoria
- [ ] E1 Leitura tolerante `etapaId`
- [ ] E2 `order` float + cálculo no drop
- [ ] E2.5 Backfill de `order`
- [ ] E3 `moveCard` com optimistic + rollback
- [ ] E4 Separação hook/board/service
- [ ] E5 UX Mobile (scroll-snap + ação Mover)
- [ ] E6 Fechamento

## 5. Próximos ciclos (não iniciar antes de fechar Kanban)

- Filtros e busca no board
- WIP limit por coluna
- Card "parado há X dias"
- Relatório de tempo por etapa
- Automação do rebalanceamento de float
