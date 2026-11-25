# ARCHITECTURE.md — Nexus CRM

> **Propósito:** Lei do projeto. Descreve o que é **estável**: visão geral,
> pastas, camadas, modelo de dados, segurança, decisões arquiteturais, fluxos,
> operações de manutenção, dívida técnica e convenções.
>
> O que muda por ciclo fica em `PROJECT_STATE.md`. O passado em `CHANGELOG.md`.
> Se um dado aparece em dois lugares, é bug de documentação.

---

## 1. Visão Geral

Nexus CRM é um SaaS multi-tenant de CRM: **React + Vite + TailwindCSS +
Firebase** (Auth + Firestore). O produto é vendido por assinatura (planejado)
e o isolamento de dados por empresa é regra imutável em todas as camadas.

**Público:** pequenas e médias empresas que precisam de funil de vendas,
contatos, tarefas e relatórios em um só lugar.

## 2. Estrutura de Pastas e Camadas

O projeto segue **Separação de Responsabilidades (SoC)**, com arquitetura
baseada em features para módulos complexos:

```text
src/
├── components/
│   ├── layouts/           # Layout, Sidebar, AuthLayout
│   └── ui/                # Reutilizáveis (Botao, Modal, PageHeader, SelectProdutos)
├── constants/             # Constantes visuais e de domínio (funilCores.js)
├── contexts/              # Estado global (AuthContext, ThemeContext)
├── services/              # Regras de negócio e comunicação com Firebase (CRUDs)
├── pages/                 # Telas (Dashboard, Contatos, Negocios, etc.)
├── utils/                 # Funções puras (slug, order, datas)
└── features/
    └── negocios/          # Módulo de Negócios (Kanban, Lista, Drawer, Funil)
        ├── useNegociosKanban.js      # Hook principal (dados + lógica do board)
        ├── KanbanColumn.jsx          # Coluna com DND
        ├── KanbanCard.jsx            # Card individual
        ├── ListView.jsx              # Visualização em tabela
        ├── NegocioDrawer.jsx         # Painel lateral de detalhes
        └── ModalConfigurarFunil.jsx  # Editor de etapas do funil
```

### 4.4 Resiliência de Funil (Negócios Órfãos)

Como o `status` é uma string (e futuramente `etapaId`), um negócio pode ficar "órfão" se sua etapa for deletada diretamente no banco. Para garantir a integridade dos dados:

1. **Bloqueio de Exclusão:** O modal de funil verifica se existem negócios na etapa antes de permitir a exclusão ou renomeação.
2. **Coluna Virtual:** O hook `useNegociosKanban` varre a lista de negócios. Qualquer negócio cujo `status` não exista na lista ativa de etapas é direcionado para uma coluna virtual renderizada no final do board (`id: 'sem-etapa'`, flag `isVirtual: true`).
3. **Imutabilidade da coluna virtual:** Cards de etapas válidas não podem ser arrastados para a coluna "Sem Etapa". No entanto, cards órfãos podem ser arrastados (ou movidos via botão) de volta para qualquer etapa válida.

## 7. Notificações

O sistema utiliza a coleção `notificacoes` para manter os usuários informados sobre eventos importantes.

### Estrutura da Coleção `notificacoes`

| Campo            | Tipo      | Descrição                                                                           |
| :--------------- | :-------- | :---------------------------------------------------------------------------------- |
| `id`             | string    | ID único da notificação.                                                            |
| `empresaId`      | string    | **Chave estrangeira** para `empresas`.                                              |
| `tipo`           | string    | Tipo do evento: `novo_lead`, `negocio_ganho`, `negocio_perdido`, `tarefa_vencendo`. |
| `mensagem`       | string    | Texto exibido ao usuário.                                                           |
| `link`           | string    | Rota para onde o usuário deve ir ao clicar.                                         |
| `lida`           | boolean   | `true` se o usuário já visualizou.                                                  |
| `destinatarioId` | string    | `todos` (para todos da empresa) ou um `userId` específico.                          |
| `dataCriacao`    | timestamp | Data/hora do evento.                                                                |

### Fluxo de Notificações

1.  **Novo Lead:** Ao criar um contato (`contatoService.js`), insere notificação com `tipo: 'novo_lead'` e `destinatarioId: 'todos'`.
2.  **Negócio Fechado:** Ao atualizar o status para "Ganho" ou "Perdido" (`negocioService.js`), insere notificação com `tipo: 'negocio_ganho'` ou `negocio_perdido`.
3.  **Lembrete de Agenda:** Um `useEffect` no `Layout.jsx` verifica tarefas com vencimento próximo (ex: 24h) e cria notificações `tarefa_vencendo`.
4.  **Exibição:** Ícone de sino no Header com contador de não lidas. Dropdown com as últimas 10 notificações.


## Fluxo de Leads via WhatsApp e Notificações em Tempo Real

### 1. Ingestão e Normalização (`api/whatsapp-webhook.js`)
- Recebe eventos `POST` da API do WhatsApp e extrai `nome`, `telefone`, `interesse`, `empresa`, `email` e `respostaCurta` via Groq (`openai/gpt-oss-20b`) ou Gemini (`gemini-2.5-flash`), com fallback local.
- Normaliza o telefone e persiste o lead na coleção `contatos` com os mesmos campos base do cadastro manual (`empresaId`, `nome`, `cargo`, `empresa`, `email`, `telefone`, `endereco`, `status: 'Novo'`, `observacoes: 'Interesse via WhatsApp: ...'`, `dataCriacao`, `atualizadoEm`), além de registrar oportunidade em `negocios` e histórico em `whatsapp_sessoes`.

### 2. Visualização no CRM (`src/pages/Contatos.jsx`)
- Escuta `contatos` filtrado por `dadosUsuario.empresaId`.
- Renderiza **Observações** em coluna própria na tabela (removendo o prefixo `Interesse via WhatsApp:` na exibição, mantendo o texto completo em `title` e suportando busca em `observacoes`).

### 3. Alertas em Tempo Real (`src/components/NotificacoesLeads.jsx` em `Layout.jsx`)
- Mantém um listener `onSnapshot` em `contatos` por `empresaId`.
- Na primeiraSnapshot (`primeiraCargaRef`), carrega apenas o histórico recente sem disparar alertas; em eventos `added` subsequentes, toca um acorde via Web Audio API, exibe um `toast` de aviso e atualiza o dropdown/contador do sino.