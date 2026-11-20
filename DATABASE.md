# DATABASE.md — Estrutura do Banco de Dados (Firestore)

> **Propósito:** Documentar o modelo de dados do Nexus CRM. Este é o "esqueleto" do SaaS.
> Todas as coleções operacionais são filtradas por `empresaId` para garantir o isolamento Multi-tenant.
>
> **Atualizado em 17/11/2026** a partir do código do commit `db973f5`.

**Legenda da coluna "Situação":**

- **Em uso** — o código grava e lê o campo.
- **Futuro** — planejado, ainda não é gravado pelo código.
- **Atenção** — o campo existe, mas o comportamento difere do esperado (detalhes na nota abaixo da tabela).

---

## Convenções gerais

- **Multi-tenant:** todo documento de `contatos`, `negocios`, `produtos`, `tarefas` e `convites` carrega `empresaId`. As consultas filtram por `where('empresaId', '==', ...)`.
- **IDs:** gerados pelo Firestore, exceto em `usuarios`, onde o ID do documento é o UID do Firebase Auth.
- **Tempo real:** as telas usam `onSnapshot`; a ordenação é feita no cliente (não há `orderBy` nas consultas, portanto não existem índices compostos).
- **Datas de criação — dois padrões em uso:**
  - `serverTimestamp()` em `negocios`, `produtos` e `tarefas` (relógio do servidor, o correto);
  - `new Date()` em `empresas`, `usuarios`, `convites` e `contatos` (relógio do dispositivo do usuário).
  - **Padrão a adotar:** `serverTimestamp()` em tudo.
- **`dataVencimento` das tarefas** é uma string `YYYY-MM-DD`. Não converter com `new Date('YYYY-MM-DD')`: o JavaScript lê como UTC e, no Brasil, a data aparece um dia antes. Montar a data local: `new Date(ano, mes - 1, dia)`.
- **Dados desnormalizados:** `negocios.produtos` guarda uma cópia `{ id, nome, preco }` do produto no momento da venda; `usuarios.nomeEmpresa` guarda uma cópia do nome da empresa.

---

## 1. Coleção: `empresas`

Armazena os dados de cada empresa (Tenant).

| Campo         | Tipo      | Descrição                                      | Situação |
| :------------ | :-------- | :--------------------------------------------- | :------- |
| `id`          | string    | ID único gerado pelo Firestore.                | Em uso   |
| `nome`        | string    | Nome da empresa (ex: Sirrus Tecnologia LTDA).  | Em uso   |
| `responsavel` | string    | Nome do responsável (Admin).                   | Em uso   |
| `segmento`    | string    | Segmento da empresa (Tecnologia, Varejo, etc). | Em uso   |
| `dataCriacao` | timestamp | Data de criação da empresa.                    | Em uso   |
| `plano`       | string    | Plano de assinatura (ex: `free`, `pro`).       | Futuro   |

> **Nota:** `plano` consta no modelo, mas o cadastro (`authService.js`) não o grava. Hoje nenhuma empresa tem esse campo; ao implementar planos, tratar a ausência como `free`.

---

## 2. Coleção: `usuarios`

Armazena os perfis dos usuários vinculados a uma empresa.

| Campo         | Tipo      | Descrição                                                           | Situação |
| :------------ | :-------- | :------------------------------------------------------------------ | :------- |
| `id`          | string    | UID do usuário no Firebase Auth (é o ID do documento).              | Em uso   |
| `email`       | string    | E-mail do usuário.                                                  | Em uso   |
| `nome`        | string    | Nome completo do usuário.                                           | Em uso   |
| `nomeEmpresa` | string    | Cópia do nome da empresa, gravada no cadastro (usada no Dashboard). | Atenção  |
| `empresaId`   | string    | **Chave estrangeira** para `empresas`.                              | Em uso   |
| `role`        | string    | Papel do usuário: `admin`, `vendedor` ou `leitor`.                  | Atenção  |
| `dataCriacao` | timestamp | Data de criação do perfil.                                          | Em uso   |
| `avatarUrl`   | string    | URL da foto de perfil.                                              | Futuro   |

> **Notas:**
>
> - `nomeEmpresa` não estava documentado. Como é uma cópia, pode ficar desatualizado se a empresa for renomeada; preferir ler `empresas/{empresaId}` (o `AuthContext` já escuta esse documento).
> - `role` é gravado no cadastro e na gestão de equipe, mas **ainda não é aplicado na interface** (um `leitor` consegue criar, editar e apagar registros). A aplicação real das permissões depende das regras do Firestore (ver seção "Regras de acesso").

---

## 3. Coleção: `convites`

Armazena convites pendentes para novos membros entrarem na empresa.

| Campo         | Tipo      | Descrição                                   | Situação |
| :------------ | :-------- | :------------------------------------------ | :------- |
| `id`          | string    | ID único do convite.                        | Em uso   |
| `email`       | string    | E-mail do convidado.                        | Em uso   |
| `empresaId`   | string    | **Chave estrangeira** para `empresas`.      | Em uso   |
| `role`        | string    | Papel que o convidado terá ao se cadastrar. | Em uso   |
| `status`      | string    | Status do convite (`pendente`).             | Atenção  |
| `dataCriacao` | timestamp | Data de criação do convite.                 | Em uso   |

> **Notas:**
>
> - `status` é gravado como `pendente` e nunca mais lido nem atualizado: o convite é apagado quando usado.
> - O cadastro localiza o convite **pelo e-mail digitado**, sem exigir e-mail verificado. Ver riscos no `Relatorio.md`.
> - Não há data de expiração. Sugestão: `expiraEm` (timestamp) e ID aleatório longo usado como token do link de convite.

---

## 4. Coleção: `contatos`

Armazena os Leads e Clientes.

| Campo         | Tipo      | Descrição                                               | Situação |
| :------------ | :-------- | :------------------------------------------------------ | :------- |
| `id`          | string    | ID único do contato.                                    | Em uso   |
| `empresaId`   | string    | **Chave estrangeira** para `empresas`.                  | Em uso   |
| `nome`        | string    | Nome completo do contato.                               | Em uso   |
| `email`       | string    | E-mail do contato.                                      | Em uso   |
| `telefone`    | string    | Telefone do contato.                                    | Em uso   |
| `cargo`       | string    | Cargo do contato na empresa dele.                       | Em uso   |
| `empresa`     | string    | Nome da empresa onde o contato trabalha (texto livre).  | Atenção  |
| `endereco`    | string    | Endereço do contato.                                    | Em uso   |
| `observacoes` | string    | Anotações sobre o contato.                              | Em uso   |
| `status`      | string    | Status do contato: `Novo`, `Em Atendimento`, `Cliente`. | Em uso   |
| `dataCriacao` | timestamp | Data de criação do contato (`new Date()`).              | Atenção  |

> **Notas:**
>
> - `empresa` é só texto: não existe uma coleção de empresas-cliente, então dois contatos da mesma empresa não ficam ligados entre si.
> - Na interface, "Leads" são os contatos com `status` diferente de `Cliente`; "Clientes" são os com `status == 'Cliente'`.

---

## 5. Coleção: `negocios`

Armazena as oportunidades do Funil de Vendas.

| Campo            | Tipo      | Descrição                                                            | Situação |
| :--------------- | :-------- | :------------------------------------------------------------------- | :------- |
| `id`             | string    | ID único do negócio.                                                 | Em uso   |
| `empresaId`      | string    | **Chave estrangeira** para `empresas`.                               | Em uso   |
| `titulo`         | string    | Título do negócio (ex: Proposta Empresa X).                          | Em uso   |
| `valor`          | number    | Valor total do negócio.                                              | Atenção  |
| `status`         | string    | Status do negócio: `Aberto`, `Ganho`, `Perdido` (colunas do Kanban). | Em uso   |
| `contato`        | string    | Nome do contato vinculado (**texto livre**, não é referência).       | Atenção  |
| `produtos`       | array     | Lista de objetos `{ id, nome, preco }` dos produtos vinculados.      | Em uso   |
| `dataCriacao`    | timestamp | Data de criação do negócio (`serverTimestamp()`).                    | Em uso   |
| `dataFechamento` | timestamp | Data de fechamento (Ganho/Perdido).                                  | Futuro   |
| `contatoId`      | string    | Referência ao documento em `contatos`.                               | Futuro   |

> **Notas:**
>
> - `valor` é gravado como `Number(valor)` a partir do formulário; a versão anterior deste documento dizia "calculado a partir dos produtos". Confirmar na tela se o valor é recalculado ao incluir produtos.
> - `contato` é digitado como texto: renomear ou apagar um contato não atualiza o negócio. Migrar para `contatoId` é a principal evolução de modelagem.
> - O funil tem apenas 3 estados. Etapas configuráveis exigirão uma coleção `funis` (ver "Coleções planejadas").

---

## 6. Coleção: `produtos`

Armazena o catálogo de Produtos e Serviços.

| Campo         | Tipo      | Descrição                              | Situação |
| :------------ | :-------- | :------------------------------------- | :------- |
| `id`          | string    | ID único do produto.                   | Em uso   |
| `empresaId`   | string    | **Chave estrangeira** para `empresas`. | Em uso   |
| `nome`        | string    | Nome do produto/serviço.               | Em uso   |
| `preco`       | number    | Preço unitário.                        | Em uso   |
| `tipo`        | string    | Tipo: `Produto` ou `Serviço`.          | Em uso   |
| `descricao`   | string    | Descrição detalhada.                   | Em uso   |
| `dataCriacao` | timestamp | Data de criação (`serverTimestamp()`). | Em uso   |

> **Nota:** como `negocios.produtos` guarda uma cópia do preço, alterar o preço aqui não muda negócios antigos. Isso é intencional (preserva o histórico).

---

## 7. Coleção: `tarefas`

Armazena as tarefas e follow-ups.

| Campo            | Tipo      | Descrição                                          | Situação |
| :--------------- | :-------- | :------------------------------------------------- | :------- |
| `id`             | string    | ID único da tarefa.                                | Em uso   |
| `empresaId`      | string    | **Chave estrangeira** para `empresas`.             | Em uso   |
| `titulo`         | string    | Descrição da tarefa.                               | Em uso   |
| `dataVencimento` | string    | Data de vencimento (`YYYY-MM-DD`; pode ser vazia). | Atenção  |
| `concluida`      | boolean   | `true` se concluída; ausente significa pendente.   | Atenção  |
| `dataCriacao`    | timestamp | Data de criação (`serverTimestamp()`).             | Em uso   |
| `contatoId`      | string    | Vínculo com um contato específico.                 | Futuro   |
| `negocioId`      | string    | Vínculo com um negócio específico.                 | Futuro   |
| `responsavelId`  | string    | UID do usuário responsável pela tarefa.            | Futuro   |

> **Notas:**
>
> - Desde o PR #40, tarefas novas **não gravam mais `concluida: false`**; o campo só aparece depois de marcar a tarefa. Hoje isso funciona porque a interface trata ausência como pendente, mas consultas `where('concluida', '==', false)` não encontrariam essas tarefas. Recomendado voltar a gravar `concluida: false` na criação.
> - Ver a convenção de `dataVencimento` no início deste documento.

---

## 8. Coleções planejadas (ainda não existem)

| Coleção      | Para quê                                                                                     |
| :----------- | :------------------------------------------------------------------------------------------- |
| `auditoria`  | Log de quem criou, editou ou apagou cada registro (detalhado abaixo).                        |
| `funis`      | Funis de venda configuráveis: nome, etapas ordenadas, probabilidade por etapa.               |
| `atividades` | Linha do tempo de ligações, reuniões, notas e e-mails ligados a um contato ou negócio.       |
| `metas`      | Metas mensais por empresa e por vendedor (o Dashboard mostra "Meta do Mês" fixa em zero).    |
| `clientes`   | Empresas-cliente, para ligar vários contatos à mesma empresa (substitui `contatos.empresa`). |

### 8.1 `auditoria` (Futuro)

| Campo          | Tipo      | Descrição                                               |
| :------------- | :-------- | :------------------------------------------------------ |
| `id`           | string    | ID único do log.                                        |
| `empresaId`    | string    | **Chave estrangeira** para `empresas`.                  |
| `usuarioId`    | string    | UID de quem realizou a ação.                            |
| `usuarioEmail` | string    | E-mail de quem realizou a ação.                         |
| `acao`         | string    | Ação realizada (ex: `criou_contato`, `editou_negocio`). |
| `entidade`     | string    | Coleção afetada (ex: `contatos`, `negocios`).           |
| `entidadeId`   | string    | ID do documento afetado.                                |
| `detalhes`     | map       | Detalhes da ação (ex: valores antigos e novos).         |
| `dataHora`     | timestamp | Data e hora da ação (`serverTimestamp()`).              |

> Os logs não devem poder ser editados nem apagados pelo cliente: nas regras, permitir apenas `create`.

---

## 9. Diagrama de Relacionamentos (Texto)

```text
[empresas] (1) ---< (N) [usuarios]
[empresas] (1) ---< (N) [contatos]
[empresas] (1) ---< (N) [negocios]
[empresas] (1) ---< (N) [produtos]
[empresas] (1) ---< (N) [tarefas]
[empresas] (1) ---< (N) [convites]
[empresas] (1) ---< (N) [auditoria]        (futuro)

[negocios] (N) ---< (N) [produtos]         (via array de cópias { id, nome, preco })
[negocios] (N) --- texto --- [contatos]    (hoje: nome digitado; futuro: contatoId)
[contatos] (1) ---< (N) [tarefas]          (futuro: contatoId)
[negocios] (1) ---< (N) [tarefas]          (futuro: negocioId)
```

---

## 10. Regras de acesso (Firestore Rules)

O isolamento entre empresas **só existe de verdade se as regras do Firestore o impuserem**: o filtro por `empresaId` no código do navegador não protege os dados.

> **Estado em 17/11/2026:** as regras publicadas no console liberam leitura e escrita de qualquer documento para qualquer usuário logado (modo de desenvolvimento). O arquivo `firestore.rules` do repositório depende de _custom claims_ (`token.role`, `token.empresaId`) que o app não define e, portanto, não funciona como está. Detalhes e plano de correção no `Relatorio.md`.

Invariantes que as regras definitivas devem garantir:

1. Um usuário só lê e escreve documentos cujo `empresaId` seja o da sua própria empresa.
2. `empresaId` é **imutável** em qualquer atualização.
3. Em `usuarios`, o dono altera apenas `nome`; só um `admin` da **mesma empresa** altera `role` de outros; ninguém altera o próprio `empresaId`.
4. Criação de documentos valida `request.resource.data.empresaId` (e não `resource.data`, que não existe na criação).
5. `convites` não pode ser listado publicamente; leitura apenas por ID, com validade e uso único.
6. Criação de empresa, perfil e consumo de convite idealmente passam por uma função de servidor (Cloud Function), e não pelo navegador.
7. `auditoria` aceita apenas `create`.

---

## 11. Como manter este documento

1. **Atualize-o no mesmo pull request** que criar ou alterar um campo.
2. Ao criar uma coleção ou campo, informe a **Situação** (Em uso, Futuro ou Atenção).
3. Consulte-o antes de criar uma funcionalidade nova: evita campos duplicados e o esquecimento do `empresaId`.
4. Sugestão de commit: `docs: atualiza dicionário de dados` (por uma branch e pull request, como nas últimas correções).
