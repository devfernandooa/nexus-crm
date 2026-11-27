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
  - `[x]` Botão/ação **Assumir Atendimento** implementado.
  - `[x]` Atualização de status para `Em Atendimento` e registro do vendedor responsável.
  - `[x]` Exibição do vendedor responsável para perfil `ADMIN`.
  - `[x]` Testado, documentado e commitado.
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
  - `[x]` Criação/vinculação automática ou manual de negócio ao assumir lead.
  - `[x]` Estrutura de `pedidos` dentro do negócio funcionando.
  - `[x]` Vendedor responsável visível ao Admin na gestão de negócios.
  - `[x]` Promoção automática para `Cliente` ao marcar negócio como `Ganho`.
  - `[x]` Testado, documentado e commitado.
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

  ## Parte 5 — Suíte Automatizada de Testes (Unitários, Integração, UI e E2E)
- Status atual: `[ ]` Pendente
- Arquivos envolvidos: `package.json`, `scripts/test-sistema-completo.mjs`, `tests/unit/sanitizacao.test.js`, `tests/integration/webhooks.test.js`, `tests/ui/NegocioDrawer.test.jsx`, `tests/e2e/fluxo-crm.spec.js`, `firestore.rules`
- Regras de negócio:
  - **Camada 1 — Testes Unitários (Regras Puras):** validar funções críticas sem dependência externa (`toNumeroSeguro` evitando `NaN`, formatação `BRL`, normalização de telefone DDI/DDD, filtro para impedir que DDD/telefone vire item de pedido, consolidação/mesclagem de itens e regras de encerramento).
  - **Camada 2 — Testes de Integração (Webhooks e Firestore Mock):** simular payloads reais do Telegram e WhatsApp validando deduplicação (`update_id` e `message.id`), fallback quando a IA falha/estoura cota (`429`) ou excede o timeout (`6s`), preservação de nome/observações existentes e prevenção de negócios duplicados antes do encerramento total.
  - **Camada 3 — Testes de Componentes (UI React):** renderizar componentes críticos (`NegocioDrawer`, cards do Kanban e modais de edição de negócio) com dados incompletos, nulos ou mistos garantindo que nunca exibam `R$ NaN` nem quebrem a interface.
  - **Camada 4 — Testes de Segurança e E2E (Regras e Navegador):** validar isolamento multi-tenant (`empresaId`) nas `firestore.rules` via emulador e executar fluxos ponta a ponta (login, criação/edição de negócio, conferência de notificações e totais).
- Checklist:
  - `[ ]` Configurar scripts de execução no `package.json` (`test:unit`, `test:webhooks`, `test:ui`, `test:e2e`, `test:all`).
  - `[ ]` Implementar testes unitários cobrindo sanitização numérica, normalização de itens e filtros de roteiro.
  - `[ ]` Implementar testes de integração dos webhooks (deduplicação, timeout/fallback 429, consolidação de pedido e ociosidade).
  - `[ ]` Implementar testes de componentes React (`NegocioDrawer` e edição de negócio) garantindo ausência de `NaN`.
  - `[ ]` Configurar testes de `firestore.rules` e fluxo E2E com Playwright para validação antes de deploys.
  - `[ ]` Testado ponta a ponta, documentado e commitado.
- Observações / Correções:
  - _Preencher durante a execução da Parte 5._

---

## Parte 6 — Evolução de Autenticação, Segurança (2FA) e Cadastro em Duas Etapas
- Status atual: `[ ]` Pendente
- Arquivos envolvidos: `src/pages/Login.jsx`, `src/pages/Cadastro.jsx`, `src/services/authService.js`, `src/components/layouts/AuthLayout.jsx`, `firestore.rules`
- Regras de negócio:
  - **Login corporativo limpo (sem redes sociais):** remover os botões de login social (Google, GitHub e WhatsApp) e o separador "OU", mantendo apenas autenticação via e-mail e senha, recuperação de senha e link discreto para suporte.
  - **Política de senha forte:** exigir no cadastro (e redefinição) mínimo de 8 caracteres com pelo menos 1 letra maiúscula, 1 letra minúscula, 1 número e 1 caractere especial, exibindo checklist visual em tempo real.
  - **Verificação em duas etapas (2FA):** após validar e-mail e senha no login, exigir confirmação de segundo fator (código OTP por e-mail ou aplicativo autenticador TOTP) antes de liberar o acesso completo ao `/app`.
  - **Cadastro em 2 etapas (Wizard):**
    - **Etapa 1 — Credenciais e Workspace:** manter os campos iniciais (`Nome Completo`, `Nome da Empresa`, `E-mail`, `Senha`, `Confirmar Senha`) com indicador de progresso (`Passo 1 de 2`).
    - **Etapa 2 — Perfil Fiscal, Contato e Pagamento:**
      - **Identificação fiscal:** alternância entre **Pessoa Jurídica (`CNPJ` / `MEI`)** e **Pessoa Física (`CPF`)**, com máscara e validação matemática de dígitos.
      - **Contato e Endereço completo:** `E-mail` (pré-preenchido com opção de alterar para financeiro), `Telefone`, `WhatsApp` (com checkbox "Mesmo do telefone"), `CEP` (com busca automática de endereço), `Logradouro`, `Número`, `Complemento`, `Bairro`, `Cidade` e `UF`.
      - **Método de Pagamento:** seleção entre **PIX**, **Boleto** ou **Cartão de Crédito**, exibindo campos dinâmicos conforme a escolha (dados de cobrança para Boleto/PIX; campos tokenizados via gateway para Cartão de Crédito, sem persistir número completo ou CVV no Firestore).
- Checklist:
  - `[ ]` Remover botões sociais e divisor "OU" em `src/pages/Login.jsx`, mantendo link discreto de suporte.
  - `[ ]` Implementar validador visual de senha forte (letras maiúsculas/minúsculas, números e caracteres especiais) em `src/pages/Cadastro.jsx`.
  - `[ ]` Implementar fluxo de Verificação em Duas Etapas (2FA) no login e configuração de segurança.
  - `[ ]` Refatorar `src/pages/Cadastro.jsx` para fluxo em 2 etapas com indicador de progresso responsivo (mobile e desktop).
  - `[ ]` Adicionar seleção `CNPJ/MEI` vs. `CPF` com máscaras, validação e consulta de `CEP` na Etapa 2.
  - `[ ]` Implementar seleção condicional de pagamento (`PIX`, `Boleto`, `Cartão de Crédito`) integrada ao gateway e salvar metadados fiscais/cobranca em `empresas/{empresaId}`.
  - `[ ]` Atualizar `firestore.rules` para proteger dados fiscais e de assinatura da empresa.
  - `[ ]` Testado ponta a ponta (desktop e mobile), documentado e commitado.
- Observações / Correções:
  - _Preencher durante a execução da Parte 6._

---