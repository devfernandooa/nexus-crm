# Relatório do Projeto — Nexus CRM

> **Data:** 17/11/2026 · **Versão analisada:** commit `db973f5` (merge do PR #40), com comparação ao commit `482f6ae`.
> **Base da análise:** leitura do código, `npm audit`, lint e build executados, e as regras do Firestore que você enviou.

---

## 1. A ideia do projeto

O **Nexus CRM** é um SaaS multiempresa (_multi-tenant_) para gestão de relacionamento e vendas, pensado para equipes pequenas e médias. Pelos documentos do repositório e pela interface em português, a proposta é entregar o essencial de um CRM com uma experiência leve e rápida:

- **Contatos** (leads e clientes), **negócios** em funil Kanban, **catálogo de produtos e serviços**, **tarefas** e **relatórios** com exportação em PDF e CSV.
- **Gestão de equipe** com convites e papéis (`admin`, `vendedor`, `leitor`).
- Interface **mobile first**, com tema claro e escuro.
- Arquitetura **sem backend próprio** (React + Firebase), uma decisão tomada para reduzir custo de operação no MVP; no modelo atual, um usuário pertence a uma única empresa.

A ideia é boa e tem mercado, mas hoje o produto está entre "protótipo bem feito" e "MVP". O que o separa de um CRM de verdade é, nesta ordem: **segurança dos dados**, **estabilidade da base de código** e **profundidade do funil de vendas**.

---

## 2. Onde o projeto está hoje

| Item                           | Situação                                                                                    |
| :----------------------------- | :------------------------------------------------------------------------------------------ |
| Stack                          | React 19, Vite 8, Tailwind 4, React Router 7, Firebase 13 (Auth e Firestore)                |
| Tamanho                        | 11 telas, 9 serviços, cerca de 3,9 mil linhas em `src/`                                     |
| Build                          | **Quebrado** no commit `db973f5` (`useTheme` não é mais exportado)                          |
| Lint                           | 2 erros e 2 avisos (eram 17 erros antes do PR #40)                                          |
| Testes automatizados           | Nenhum                                                                                      |
| CI e deploy                    | Nenhum configurado (sem `.github`, sem `firebase.json`)                                     |
| Bundle principal               | cerca de 1,9 MB (578 kB compactado), sem divisão por rota (medido antes da quebra do build) |
| Dependências                   | `npm audit` com 4 vulnerabilidades altas, todas via `@grpc/grpc-js` dentro do Firestore     |
| Regras do Firestore publicadas | **Abertas**: qualquer usuário logado lê e escreve tudo                                      |

---

## 3. O que está bom

Nenhum ponto chega a "excelente" ainda. Os melhores estão em nível **ótimo**:

- **Organização em camadas (ótimo).** Páginas chamam serviços que devolvem `{ sucesso, erro }`; contextos isolam autenticação e tema. Fácil de manter e de testar.
- **Interface consistente e mobile first (ótimo).** `PageHeader`, `Modal` em portal, `ConfirmModal`, toasts, estados vazios, sidebar que abre e fecha no celular, tema claro e escuro persistido.
- **Documentação e processo (ótimo).** `ARCHITECTURE`, `CONTEXTO`, `ROADMAP_FUTURO`, `AUDITORIA_E_CORRECOES`, commits convencionais e pull requests.
- **Reação rápida à auditoria (ótimo).** Condição de corrida do cadastro, imports faltando e lint foram tratados no mesmo dia.
- **Modelo de dados pensado para multiempresa (bom).** `empresaId` em todas as coleções operacionais e atualização em tempo real com `onSnapshot`.
- **Funil e catálogo (bom).** Kanban com arrastar e soltar; produtos vinculados ao negócio, com cópia do preço que preserva o histórico.
- **Relatórios (bom).** Gráficos Recharts e exportação PDF e CSV sem custo de servidor.
- **Higiene de segredos (bom).** Nenhuma chave no código e `.env` fora do Git.
- **Toolchain moderna (bom).** React 19, Vite 8, Tailwind 4 e ESLint em configuração flat.

---

## 4. O que está ruim

Em ordem de gravidade.

### 4.1 Crítico

1. **Regras do Firestore abertas.** As regras publicadas liberam leitura e escrita de qualquer documento para qualquer usuário logado. Como o cadastro é aberto, qualquer pessoa que crie uma conta lê, altera e apaga os dados de todas as empresas e pode mudar o `role` de outros usuários. Em `convites`, a leitura é pública e a escrita vale para qualquer usuário logado. O isolamento entre empresas hoje existe só na interface.
2. **O `firestore.rules` do repositório não funciona com o app.** Ele lê `request.auth.token.role` e `request.auth.token.empresaId` (_custom claims_), mas nada no projeto define claims (não há Cloud Functions nem Admin SDK). Publicado como está, negaria todo acesso a contatos, negócios, tarefas e produtos. Além disso, `write` usa `resource.data`, que não existe na criação de um documento. Isso provavelmente explica por que a regra aberta voltou ao console.
3. **O build está quebrado.** `useTheme` foi comentado em `ThemeContext.jsx` (provavelmente para silenciar o lint), mas `Configuracoes.jsx` e `ThemeToggle.jsx` ainda o importam; `vite build` falha com `MISSING_EXPORT`.

### 4.2 Alto

4. **Brechas mesmo nas regras novas:** o dono pode atualizar o próprio documento inteiro em `usuarios` (inclusive `role` e `empresaId`); `isAdmin()` não confere a empresa do alvo; o `update` não impede trocar o `empresaId` de um registro; `convites` é legível por qualquer pessoa.
5. **Sequestro de convite.** O cadastro localiza o convite pelo e-mail digitado, sem exigir e-mail verificado. Quem souber o endereço convidado pode ocupar a vaga e entrar na empresa com o papel do convite.
6. **Papéis não são aplicados na interface.** Um `leitor` consegue criar, editar e apagar registros e abrir a gestão de equipe.
7. **Exclusão de conta e de empresa não funcionam.** Depois do PR #40, o botão "Excluir Conta" ficou sem ação (como "Excluir Empresa"). O usuário não tem como apagar os próprios dados, o que pesa na LGPD. Remover um membro apaga só o perfil no Firestore, e o login continua ativo no Auth.

### 4.3 Médio

8. **Dashboard sem dados.** KPIs fixos em 0, "Total de Usuários: 1" fixo, botões "Agendar" sem ação, enquanto o `CONTEXTO.md` descreve os KPIs como dinâmicos.
9. **Data de vencimento errada no Brasil.** `new Date('2026-11-17')` é lido como UTC e aparece como 16/11 (reproduzido com fuso America/Bahia).
10. **Tarefas novas sem o campo `concluida`** desde o PR #40, mais uma variável sem uso (erro de lint).
11. **Login incompleto.** "Esqueceu sua senha?" é `href="#"` e os três botões sociais não têm ação.
12. **Link e rótulos enganosos.** `/app/ajuda` não tem rota; "Versão 1.0 • Pro" é fixo; `role || 'Admin'` mostra Admin quando o papel falta; ainda existe um `window.location.reload()` em `Sidebar.jsx`.
13. **Cadastro não atômico.** Auth e gravações no Firestore em sequência: uma falha no meio deixa usuário sem perfil. No fluxo de convite, o convidado tenta apagar o convite, mas as regras só permitem isso a admins.
14. **Telas que quebram com campo ausente**, como `p.nome.toLowerCase()` em `Produtos.jsx`.
15. **Relatórios caros e vulneráveis a planilha maliciosa.** Baixam coleções inteiras só para contar, e o CSV não neutraliza células iniciadas por `=`, `+`, `-` ou `@`.
16. **Funil raso.** O negócio só passa por três estados, e o contato do negócio é texto livre, sem ligação com o cadastro de contatos.

### 4.4 Baixo

17. **Sem testes, sem CI.** A quebra de hoje teria sido barrada por uma verificação automática.
18. **Bundle de 1,9 MB** e nenhum `React.lazy`.
19. **Acessibilidade e SEO básico.** Modal sem `role="dialog"`, sem Esc e sem foco preso; botões só com ícone sem `aria-label`; `index.html` com `lang="en"` e título "nexus-crm".
20. **Sem App Check**, sem restrição da chave por domínio e sem cabeçalhos de segurança.

---

## 5. O que pode melhorar

- **Arquitetura de segurança:** tirar do navegador o que decide permissão. Uma função de servidor (Cloud Function) cria empresa, perfil e convite, e as regras proíbem `create` direto em `usuarios` e `empresas`. Isso exige o plano Blaze do Firebase; sem ele, dá para chegar perto com regras baseadas em `get()` e `getAfter()`, aceitando que o cadastro continue no cliente.
- **Qualidade:** testes (Vitest e Testing Library), testes das regras no Firebase Emulator, CI com lint, build e `npm audit`, e uma regra: nenhum PR entra com build ou lint quebrado.
- **Código:** corrigir o lint na origem (por exemplo, mover `useTheme` para `useTheme.js` em vez de comentá-lo), tratar campos ausentes com `?.`, padronizar datas com `serverTimestamp()`, tratar erros nos listeners do `onSnapshot`.
- **Desempenho:** dividir o bundle por rota (`React.lazy` e `Suspense`, começando por Relatórios e Negócios) e usar agregações (`getCountFromServer`) nos relatórios.
- **Experiência:** Dashboard com dados reais, recuperação de senha, papéis refletidos na interface, e remover ou implementar tudo que hoje é botão sem ação.
- **Documentação:** manter `CONTEXTO.md` e `DATABASE.md` alinhados ao código no mesmo PR que muda o comportamento.

---

## 6. O que precisa ser implementado

Esforços em estimativa para uma pessoa.

### 6.1 Urgente (próximos 7 dias)

- [ ] Trocar as regras abertas por regras mínimas de isolamento por empresa, lendo a empresa do usuário com `get()` em `usuarios` — 2 a 4 horas.
- [ ] Restaurar `useTheme` em arquivo próprio e fechar o build — 30 minutos.
- [ ] Reescrever o `firestore.rules` do repositório (claims → `get()`, separar `create` de `update`, `empresaId` imutável, `usuarios` restrito, `isAdmin` com escopo de empresa) e testar no Emulator antes de publicar — 1 a 2 dias.
- [ ] Fechar a leitura pública de `convites` e exigir e-mail verificado antes de vincular — 0,5 a 1 dia.
- [ ] Corrigir a data de vencimento, voltar a gravar `concluida: false` e usar `nome?.` — 0,5 dia.
- [ ] Esconder ou implementar "Excluir conta", "Excluir Empresa", `/app/ajuda` e o login social — 0,5 dia.
- [ ] Recuperação de senha com `sendPasswordResetEmail` — 2 horas.

### 6.2 Curto prazo (até 2 meses)

- [ ] Testes e CI (lint, build e `npm audit`) — 1 semana.
- [ ] Aplicar papéis na interface — 3 a 4 dias.
- [ ] Cadastro atômico e exclusão de conta com dados (LGPD) — 1 semana.
- [ ] Dashboard com dados reais — 2 a 3 dias.
- [ ] Divisão de código por rota e agregações nos relatórios — 2 a 3 dias.
- [ ] Trilha de auditoria (coleção `auditoria`, já modelada no `DATABASE.md`) — 1 semana.

### 6.3 Longo prazo (3 a 12 meses)

- [ ] Camada de servidor (Cloud Functions) para cadastro, convites, claims e rotinas — 3 a 4 semanas.
- [ ] Funil com etapas configuráveis e histórico de atividades — 4 a 6 semanas.
- [ ] Integrações (WhatsApp, e-mail, calendário) — 2 a 3 meses.
- [ ] Automações e notificações — 1 a 2 meses.
- [ ] Um usuário em várias empresas, planos e cobrança — 1 a 2 meses.
- [ ] Observabilidade (Sentry, métricas de uso) e migração gradual para TypeScript — contínuo.

---

## 7. Novos módulos para virar um CRM completo

A ordem certa é: ligar as entidades entre si, tornar o funil configurável e registrar atividades; só depois compensam integrações, automações e IA.

| Módulo                                  | O que entrega                                                                        | Prioridade  | Esforço       |
| :-------------------------------------- | :----------------------------------------------------------------------------------- | :---------- | :------------ |
| Vínculo contato, empresa e negócio      | Referenciar o cadastro de contatos e de empresas-cliente, em vez de texto livre      | Essencial   | 1 a 2 semanas |
| Funil configurável                      | Vários funis, etapas editáveis, probabilidade, motivo de perda e previsão de receita | Essencial   | 3 a 4 semanas |
| Linha do tempo de atividades            | Ligações, reuniões, notas e e-mails no contato e no negócio                          | Essencial   | 2 semanas     |
| Agenda e lembretes                      | Tarefas com hora, calendário e o botão "Agendar" funcionando                         | Essencial   | 2 semanas     |
| Importação e exportação em massa        | CSV e planilha com mapeamento de colunas e detecção de duplicados                    | Essencial   | 1 a 2 semanas |
| Metas e desempenho por vendedor         | Meta mensal, ranking, conversão por origem e por responsável                         | Importante  | 2 semanas     |
| Campos personalizados, tags e segmentos | Cada empresa adapta o cadastro ao seu negócio                                        | Importante  | 2 semanas     |
| Propostas e orçamentos em PDF           | Gerados a partir dos produtos do negócio                                             | Importante  | 2 semanas     |
| Captação de leads                       | Formulário embutível e webhook, com origem registrada                                | Importante  | 2 a 3 semanas |
| Notificações                            | Tarefa vencida, negócio parado e menção                                              | Importante  | 1 a 2 semanas |
| Automações                              | Regras do tipo "ao mudar de etapa, criar tarefa"                                     | Diferencial | 4 a 6 semanas |
| WhatsApp e e-mail                       | Conversas dentro do CRM e registro automático na linha do tempo                      | Diferencial | 2 a 3 meses   |
| Assistente de IA                        | Resumo do histórico, próxima ação sugerida e risco de perda                          | Diferencial | 1 a 2 meses   |
| Administração avançada                  | Papéis granulares, auditoria consultável, LGPD, SSO                                  | Diferencial | 1 a 2 meses   |
| Planos e cobrança                       | Assinatura, limites por plano, Pix e cartão                                          | Diferencial | 1 a 2 meses   |
| PWA com uso offline                     | Instalável no celular, com cache para consulta em campo                              | Diferencial | 2 a 3 semanas |

### Cronograma resumido (uma pessoa em tempo integral, a partir de 17/11/2026)

| Fase              | Período              | Foco                                 | Critério para avançar                                                                                     |
| :---------------- | :------------------- | :----------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| 0 · Urgente       | 17/11/26 a 24/11/26  | Build, regras e bugs visíveis        | `vite build` e lint verdes; dois usuários de empresas diferentes sem acesso cruzado nos testes das regras |
| 1 · Fundação      | 25/11/26 a 31/01/27  | Testes, CI, papéis, LGPD e servidor  | CI obrigatório nos PRs; cadastro e convite pela função de servidor                                        |
| Piloto            | a partir de 01/02/27 | Poucos clientes reais de um segmento | Uso semanal e lista de dores priorizada                                                                   |
| 2 · Núcleo de CRM | 01/02/27 a 30/04/27  | Vínculos, funil, atividades e agenda | Piloto conduz negócios do início ao fim no Nexus, sem planilha paralela                                   |
| 3 · Crescimento   | 01/05/27 a 31/07/27  | Metas, campos, propostas e captação  | Dashboard e relatórios usados na gestão                                                                   |
| 4 · Diferenciais  | 01/08/27 a 31/01/28  | WhatsApp, automações, IA e cobrança  | Primeiros clientes pagantes                                                                               |

---

## 8. Como se destacar como CRM

**Pontos fortes hoje:** cobertura básica completa (contatos, funil, produtos, tarefas, relatórios, equipe), modelo multiempresa desde o início, experiência leve e mobile first, base moderna e barata de operar.

**Pontos fracos hoje:** funil raso, entidades soltas (contato, negócio e tarefa sem ligação), sem histórico de interações, sem origem do lead, sem tags ou campos personalizados, Dashboard vazio, sem integrações, notificações ou automações, e segurança insuficiente para guardar dados de clientes de terceiros.

CRMs de mercado já oferecem funis configuráveis, registro de atividades e integração com e-mail e WhatsApp; esses itens são o mínimo para competir, não um diferencial. O espaço para se destacar está em escolher um público e fazer melhor nele:

- **WhatsApp em primeiro lugar:** conversa dentro do CRM, registro automático na linha do tempo e lembrete de retorno.
- **Implantação em minutos:** usar o campo `segmento` que o cadastro da empresa já coleta para criar funil, campos e modelos prontos por segmento, e importar a planilha atual do cliente no primeiro acesso.
- **Feito para o Brasil:** suporte em português, cobrança com Pix, LGPD pronta (consentimento, exportação e exclusão de dados).
- **IA aplicada à rotina:** próxima ação sugerida, resumo do histórico antes de uma ligação e alerta de negócio parado.
- **Confiança como produto:** auditoria consultável, papéis claros e um histórico de segurança que o cliente consegue ver.

**Recomendação:** fechar a base (segurança, build e testes) primeiro, escolher um segmento para o piloto e medir com poucos clientes reais antes de ampliar o escopo.

---

## 9. Limites desta análise

- Não tive acesso ao projeto no console do Firebase: as regras publicadas são as que foram enviadas na conversa; índices e claims definidos por fora do código são desconhecidos.
- Nada foi executado contra um Firebase real. Cadastro por convite e comportamento das regras foram avaliados lendo o código. Foram executados: lint, build e `npm audit` (no estado atual), a medição do bundle (no commit anterior, porque o atual não compila) e a reprodução do bug de data em Node.
- Estimativas de esforço são para uma pessoa e não consideram disponibilidade, revisão nem testes com usuários.
