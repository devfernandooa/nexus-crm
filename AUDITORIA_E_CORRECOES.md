# AUDITORIA_E_CORRECOES.md — Plano de Estabilização

> **Propósito:** Documentar os achados da auditoria técnica e o plano de ação para corrigir os problemas críticos, garantindo que o Nexus esteja seguro e pronto para produção.

## 1. Segurança (Crítico) - Regras do Firestore
**Problema:** O isolamento de dados e as permissões (RBAC) só existem no front-end. Qualquer usuário logado pode acessar dados de outra empresa abrindo o console do navegador.
**Solução:** Criar o arquivo `firestore.rules` e configurá-lo no Console do Firebase.
**Tarefas:**
- [ ] Criar arquivo `firestore.rules` na raiz.
- [ ] Implementar regra de isolamento: `allow read, write: if request.auth != null && request.auth.token.empresaId == resource.data.empresaId;`
- [ ] Implementar regra de RBAC (ex: apenas admin pode deletar).
- [ ] Publicar regras no Console do Firebase.

## 2. Bug: Exclusão de Conta Deixa Dados Órfãos
**Problema:** `deleteDoc` não está importado no `usuarioService.js`. O erro é engolido e a conta do Auth é apagada, mas o perfil fica órfão no Firestore.
**Solução:** Corrigir o import e garantir que a exclusão no Firestore ocorra antes da exclusão no Auth.
**Tarefas:**
- [ ] Adicionar `import { deleteDoc } from 'firebase/firestore';` no `usuarioService.js`.
- [ ] Adicionar tratamento de erro visível (Toast) caso a exclusão no Firestore falhe.

## 3. Bug: Condição de Corrida no Cadastro
**Problema:** O perfil é lido assim que o usuário nasce no Auth, antes de ser gravado no Firestore. Os `window.location.reload()` são sintoma disso.
**Solução:** Usar `onSnapshot` no `AuthContext` para escutar o documento do usuário em tempo real, em vez de buscar uma vez com `getDoc`.
**Tarefas:**
- [ ] Refatorar o `AuthContext` para usar `onSnapshot` na coleção `usuarios`.
- [ ] Remover os `window.location.reload()` do código e substituir por atualizações de estado.

## 4. Lint: 17 Erros e 2 Bugs de Import
**Problema:** O build passa, mas o ESLint falha com variáveis não utilizadas e imports quebrados.
**Solução:** Rodar `npm run lint` e corrigir cada erro.
**Tarefas:**
- [ ] Rodar `npm run lint`.
- [ ] Corrigir imports não utilizados.
- [ ] Corrigir dependências de Hooks (exhaustive-deps).

## 5. Performance: Bundle de 1,9 MB
**Problema:** O bundle principal carrega o sistema inteiro de uma vez, incluindo bibliotecas pesadas como `recharts` e `jspdf`.
**Solução:** Implementar Code Splitting com `React.lazy()` e `Suspense`.
**Tarefas:**
- [ ] Transformar as páginas de Relatórios e Negócios em `React.lazy()`.
- [ ] Adicionar `<Suspense>` no `App.jsx` com um fallback de carregamento.