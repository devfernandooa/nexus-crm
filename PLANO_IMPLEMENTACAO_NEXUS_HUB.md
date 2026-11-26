# Plano de Implementação — Nexus Hub (Agrotec)

> **Regra de execução:** Executar estritamente na ordem abaixo, concluindo, testando, documentando e commitando cada parte antes de iniciar a próxima.

## Legenda de Status
- `[ ]` Pendente
- `[~]` Em andamento
- `[!]` Necessário correção
- `[x]` Concluída e commitada

---

## Parte 1 — Identificação de Cliente, Notificações e Flags/Paginação em Contatos (Base)
- Status atual: `[~]` Em andamento
- Arquivos envolvidos: `src/components/NotificacoesLeads.jsx`, `src/pages/Contatos.jsx`
- Checklist:
  - `[x]` `DEFAULT_EMPRESA_ID` configurado como `agrotec-produtos-servicos-agropecuarios` na Vercel.
  - `[x]` Dropdown de notificações reposicionado e com melhor contraste/legibilidade e badges por canal (`Telegram` azul, `WhatsApp` verde).
  - `[x]` Flags visuais na listagem de contatos (`Novo Lead` pulsante em vermelho, `Em Atendimento` em âmbar, pill verde `Cliente` apenas para clientes).
  - `[x]` Filtro unificado (`Todos`, `Leads`, `Clientes`) e paginação em `Contatos.jsx`.
  - `[~]` Validação final em produção e commit desta base.
- Observações / Correções:
  - _Registrar aqui qualquer ajuste necessário antes de passar para a Parte 2._

---

## Parte 2 — Assumir Atendimento pelo Vendedor e Responsável Visível ao Admin
- Status atual: `[ ]` Pendente
- Arquivos envolvidos: `src/services/contatoService.js`, `src/pages/Contatos.jsx`
- Regras de negócio:
  - Todos os vendedores da empresa (`empresaId`) enxergam novos leads (`status: 'Novo'`).
  - Ao clicar em **Assumir Atendimento**, o lead passa para `status: 'Em Atendimento'` e recebe `vendedorResponsavelId` e `vendedorResponsavelNome`.
  - O Admin visualiza na listagem/detalhes qual vendedor está responsável pelo atendimento.
- Checklist:
  - `[ ]` Botão/ação **Assumir Atendimento** implementado.
  - `[ ]` Atualização de status para `Em Atendimento` e registro do vendedor responsável.
  - `[ ]` Exibição do vendedor responsável para perfil `ADMIN`.
  - `[ ]` Testado, documentado e commitado.
- Observações / Correções:
  - _Preencher durante a execução da Parte 2._

---

## Parte 3 — Negócios, Estrutura de Pedidos e Conversão para Cliente
- Status atual: `[ ]` Pendente
- Arquivos envolvidos: módulo/página de `Negocios`, `src/services/*`
- Regras de negócio:
  - Cada negócio vincula `contatoId`, `vendedorId`, `vendedorNome`, `tipoNegocio` (`'primeiro_negocio' | 'recompra' | 'atendimento'`), `status` (`'aberto' | 'ganho' | 'perdido'`) e array `pedidos` (`produto`, `quantidade`, `valorUnitario`, `subtotal`, `origem`).
  - Ao finalizar como `Ganho`, o contato é atualizado para `tipo: 'cliente'` e `status: 'Cliente'` e o histórico de compras é atualizado.
  - Se não fechar (`Perdido`), o negócio é encerrado como perdido sem promover a cliente.
- Checklist:
  - `[ ]` Criação/vinculação automática ou manual de negócio ao assumir lead.
  - `[ ]` Estrutura de `pedidos` dentro do negócio funcionando.
  - `[ ]` Vendedor responsável visível ao Admin na gestão de negócios.
  - `[ ]` Promoção automática para `Cliente` ao marcar negócio como `Ganho`.
  - `[ ]` Testado, documentado e commitado.
- Observações / Correções:
  - _Preencher durante a execução da Parte 3._

---

## Parte 4 — IA no Telegram (Coleta de Lead, Reconhecimento de Cliente e Recompra)
- Status atual: `[ ]` Pendente
- Arquivos envolvidos: `api/telegram-webhook.js`, `src/components/NotificacoesLeads.jsx`
- Regras de negócio:
  - **Novo contato:** IA extrai/valida **Nome**, **Telefone** e **Interesse** (produto ou serviço); se faltar dado, pergunta de forma objetiva; quando completo, cadastra como `lead` (`status: 'Novo'`).
  - **Cliente já cadastrado:** identifica sem duplicar lead, chama pelo nome, informa que já possui cadastro e pergunta a necessidade (suporte vs. novo pedido/recompra).
  - **Novo pedido / recompra de cliente:** consulta histórico de compras anteriores, anexa pedido ao negócio aberto ou cria negócio de `recompra` e dispara alerta para a equipe.
- Checklist:
  - `[ ]` Controle de sessão/coleta de `nome`, `telefone` e `interesse` para novos leads.
  - `[ ]` Identificação de cliente existente e saudação personalizada com verificação de necessidade.
  - `[ ]` Registro de pedido/recompra com checagem de compra anterior e alerta no CRM.
  - `[ ]` Testado ponta a ponta, documentado e commitado.
- Observações / Correções:
  - _Preencher durante a execução da Parte 4._

---

## Parte 5 — Segurança (`firestore.rules`) e Encerramento da Entrega
- Status atual: `[ ]` Pendente
- Arquivos envolvidos: `firestore.rules`, documentação do projeto
- Checklist:
  - `[ ]` Regras do Firestore revisadas para `contatos`, `negocios`, `solicitacoes_compra` e `sessoes_telegram`.
  - `[ ]` Testes de regressão concluídos.
  - `[ ]` Commit final e PR atualizada.
- Observações / Correções:
  - _Preencher durante a execução da Parte 5._