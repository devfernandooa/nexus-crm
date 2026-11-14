# ROADMAP DE DESENVOLVIMENTO — Nexus CRM

> **Legenda de Prioridade:** 🔴 Crítico (Parar tudo e resolver) | 🟠 Urgente (Fazer na sequência) | 🟡 Pode Esperar (Melhoria) | 🔵 Futuro (Inovação)
> **Legenda de Status:** [x] Concluído | [ ] Pendente | [~] Em Andamento

## ETAPA 1: Fundação Sólida e Completude (O "MVP Comercial")

_Foco: Garantir que o sistema tenha todos os dados necessários para funcionar no mundo real, sem precisar quebrar o banco depois._

| Status | Tarefa                                 | Descrição                                                                                               | Prioridade | Dificuldade | Tempo Estimado |
| :----- | :------------------------------------- | :------------------------------------------------------------------------------------------------------ | :--------- | :---------- | :------------- |
| [ ]    | **Completar Schema de Contatos**       | Adicionar Cargo, Empresa (onde trabalha), Endereço, Data de Nascimento, Observações.                    | 🔴 Crítico | Baixa       | 2h             |
| [ ]    | **Completar Schema de Negócios**       | Adicionar Data Prevista de Fechamento, Origem do Lead, Produtos vinculados (soma automática do valor).  | 🔴 Crítico | Média       | 3h             |
| [ ]    | **Completar Schema de Produtos**       | Adicionar Código/SKU, Categoria, Estoque (se for produto físico).                                       | 🟠 Urgente | Baixa       | 1h             |
| [ ]    | **Ajuste no Logout**                   | Adicionar confirmação (ex: "Deseja sair?") e limpar o estado global ao deslogar.                        | 🟠 Urgente | Baixa       | 30min          |
| [ ]    | **Refatorar Configurações do Usuário** | Permitir que o usuário logado altere seu próprio nome, e-mail e senha (não apenas os dados da empresa). | 🟠 Urgente | Média       | 2h             |

## ETAPA 2: Segurança e Rastreabilidade

_Foco: Garantir que o sistema seja seguro e auditável, requisito básico para vender para empresas._

| Status | Tarefa                          | Descrição                                                                                                                   | Prioridade | Dificuldade | Tempo Estimado |
| :----- | :------------------------------ | :-------------------------------------------------------------------------------------------------------------------------- | :--------- | :---------- | :------------- |
| [ ]    | **Sistema de Auditoria**        | Criar coleção `auditoria` e registrar logs (quem, o quê, quando) em todas as ações de Create, Update e Delete nos serviços. | 🔴 Crítico | Média       | 3h             |
| [ ]    | **Refinar Regras do Firestore** | Sair do "modo teste" (`if true`) e criar regras granulares baseadas em `role` (ex: vendedor não pode deletar empresa).      | 🔴 Crítico | Alta        | 4h             |
| [ ]    | **Tratamento de Erros Global**  | Criar um sistema para capturar erros de rede e mostrar mensagens amigáveis (não apenas `console.error`).                    | 🟠 Urgente | Média       | 2h             |

## ETAPA 3: Experiência do Usuário e Suporte

_Foco: Reduzir a curva de aprendizado e melhorar a usabilidade em todas as telas._

| Status | Tarefa                              | Descrição                                                                                                    | Prioridade      | Dificuldade | Tempo Estimado |
| :----- | :---------------------------------- | :----------------------------------------------------------------------------------------------------------- | :-------------- | :---------- | :------------- |
| [ ]    | **Central de Ajuda (FAQ)**          | Criar página `/app/ajuda` com artigos curtos explicando como usar cada módulo (Contatos, Kanban, etc).       | 🟠 Urgente      | Baixa       | 2h             |
| [ ]    | **Refinar Responsividade (Kanban)** | No mobile, adicionar botões de "mover para próxima coluna" em vez de depender apenas de arrastar (touch).    | 🟡 Pode Esperar | Média       | 2h             |
| [ ]    | **Onboarding (Primeiros Passos)**   | Quando o usuário logar pela primeira vez, mostrar um modal de boas-vindas com um tour rápido.                | 🟡 Pode Esperar | Média       | 3h             |
| [ ]    | **Melhorar Modais no Mobile**       | Garantir que modais com muitos campos (ex: Cadastro) tenham scroll interno e não estourem a tela no celular. | 🟠 Urgente      | Baixa       | 1h             |

## ETAPA 4: Funcionalidades Avançadas

_Foco: Entregar recursos que geram valor agregado e diferenciais competitivos._

| Status | Tarefa                          | Descrição                                                                                             | Prioridade      | Dificuldade | Tempo Estimado |
| :----- | :------------------------------ | :---------------------------------------------------------------------------------------------------- | :-------------- | :---------- | :------------- |
| [ ]    | **Exportação Real (PDF/CSV)**   | Implementar a lógica do botão de exportar relatórios usando `jspdf` e `papaparse`.                    | 🟡 Pode Esperar | Média       | 3h             |
| [ ]    | **Notificações em Tempo Real**  | Usar Firebase Cloud Messaging (FCM) para notificar o usuário quando um novo lead for atribuído a ele. | 🟡 Pode Esperar | Alta        | 5h             |
| [ ]    | **Gestão de Permissões (RBAC)** | Refinar o que cada `role` pode fazer. (Ex: vendedor só vê os próprios contatos, admin vê tudo).       | 🟠 Urgente      | Alta        | 4h             |

## ETAPA 5: Inovação e Futuro

_Foco: Diferenciais de mercado (IA) e integrações._

| Status | Tarefa                                | Descrição                                                                                   | Prioridade | Dificuldade | Tempo Estimado |
| :----- | :------------------------------------ | :------------------------------------------------------------------------------------------ | :--------- | :---------- | :------------- |
| [ ]    | **Agente de IA (Resumo de Negócios)** | Integrar com API da OpenAI/Gemini para gerar resumos de negócios ou sugestões de follow-up. | 🔵 Futuro  | Alta        | 5h             |
| [ ]    | **Integração com WhatsApp**           | Enviar mensagens diretamente do CRM para o lead (requer API oficial do WhatsApp).           | 🔵 Futuro  | Muito Alta  | 8h+            |
| [ ]    | **Planos de Assinatura**              | Integrar Stripe ou Mercado Pago para cobrar mensalidade do SaaS.                            | 🔵 Futuro  | Alta        | 6h             |

---

**Histórico de Progresso:**
_(A cada tarefa concluída, marque [x] na tabela acima e adicione uma linha abaixo registrando a data.)_
