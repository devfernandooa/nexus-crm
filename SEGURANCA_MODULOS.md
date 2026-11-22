# Nexus Hub — Arquitetura de Segurança & Roadmap Técnico de Módulos

**Última atualização:** 2026-11-21  
**Arquitetura:** SPA React + Vite + Tailwind CSS | Backend-as-a-Service (Firebase Auth & Cloud Firestore)  
**Modelo:** SaaS Multi-Tenant isolado por `empresaId`

---

## 1. Arquitetura de Segurança (Multi-Tenant)

Em uma SPA conectada diretamente ao Firebase sem backend intermediário próprio, **todo o código JavaScript enviado ao navegador é público**. Qualquer usuário com as chaves públicas do `firebase-config` pode inspecionar o bundle ou enviar requisições diretas via REST API / SDK do Firestore fora dos formulários React.

Por isso, a segurança do **Nexus Hub** deve operar em **três camadas**:

1. **Camada de Banco (Firestore Security Rules):** barreira definitiva de isolamento por `empresaId`, controle de papéis (`role`) e validação de tipos/campos.
2. **Camada de Identidade (Firebase Auth & App Check):** proteção contra bots, criação em massa de contas e abuso de cota.
3. **Camada de Interface (React):** guardas de rota por papel (`RoleGuard`), sincronização reativa de sessão e tratamento seguro de inputs e erros.

---

### 1.1 Matriz de Riscos e Mitigações

| Vetor de Ataque                              | Como Ocorre na Prática                                                                                                                        | Severidade     | Mitigação Técnica Obrigatória                                                                                                                          |
| :------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- | :------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vazamento Cross-Tenant (IDOR)**            | Usuário autenticado altera o filtro `empresaId` na chamada do SDK para ler ou editar dados de outra empresa.                                  | **Crítica**    | Validar `empresaId` diretamente nas **Firestore Security Rules** cruzando com o perfil de `request.auth.uid`.                                          |
| **Escalação de Privilégio (`role`)**         | Usuário envia `{ role: "admin", empresaId: "outro-id" }` ao criar ou atualizar `usuarios/{uid}`.                                              | **Crítica**    | Bloquear alteração de `role` e `empresaId` pelo próprio usuário nas Security Rules; restringir gestão de equipe a admins.                              |
| **Criação Irrestrita de Empresas**           | Como `/empresas` permite `create` para qualquer usuário autenticado, scripts automatizados podem criar milhares de empresas lixo.             | **Alta**       | Exigir no `create` de `empresas` que `criadoPor == request.auth.uid`, validar campos obrigatórios e ativar **Firebase App Check**.                     |
| **Transferência ou Corrupção de Dados**      | Alteração do campo `empresaId` em um `update` (roubo/desvio de registro) ou envio de tipos inválidos (ex.: `valor: "abc"`, strings gigantes). | **Alta**       | Impedir mutação de `empresaId` em updates (`request.resource.data.empresaId == resource.data.empresaId`) e validar tipos/tamanhos no schema das Rules. |
| **Exclusão Indevida por Membros Comuns**     | Membro operacional apaga negócios ganhos, catálogo de produtos ou registros históricos.                                                       | **Média/Alta** | Restringir `delete` em coleções sensíveis (`produtos`, `negocios` ganhos, `usuarios`) apenas para `role == 'admin'`.                                   |
| **Exposição de Segredos ou Sessão Obsoleta** | Uso de segredos em variáveis `VITE_*` ou dependência de `window.location.reload()` após editar perfil na `Sidebar`.                           | **Média**      | Manter apenas chaves públicas do Web SDK em `VITE_*`, guardar só preferências de UI no `localStorage` e atualizar o `AuthContext` reativamente.        |

---

### 1.2 Firestore Security Rules (Produção — Multi-Tenant + Schema)

> **Nota de Performance e Custo:** Cada chamada `get(...)` dentro das Security Rules contabiliza 1 leitura extra no Firestore. Para o estágio atual do **Nexus Hub**, `getUserData()` resolve o isolamento com simplicidade; em escala maior, migrar `empresaId` e `role` para **Firebase Auth Custom Claims** elimina essa leitura extra em 100% das requisições.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // --- FUNÇÕES AUXILIARES ---
    function isSignedIn() {
      return request.auth != null;
    }

    function getUserData() {
      return get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data;
    }

    function belongsToEmpresa(empresaId) {
      return isSignedIn()
        && empresaId is string
        && getUserData().empresaId == empresaId;
    }

    function isAdminOfEmpresa(empresaId) {
      return belongsToEmpresa(empresaId) && getUserData().role == 'admin';
    }

    function isValidText(value, maxLen) {
      return value is string && value.size() > 0 && value.size() <= maxLen;
    }

    function isOptionalText(data, field, maxLen) {
      return !(field in data) || data[field] == null || (data[field] is string && data[field].size() <= maxLen);
    }

    // --- COLEÇÃO: USUÁRIOS ---
    match /usuarios/{userId} {
      allow read: if isSignedIn() && (
        request.auth.uid == userId ||
        belongsToEmpresa(resource.data.empresaId)
      );

      // No cadastro inicial, o usuário só pode criar o próprio documento
      allow create: if isSignedIn()
        && request.auth.uid == userId
        && isValidText(request.resource.data.nome, 120)
        && isValidText(request.resource.data.empresaId, 100)
        && request.resource.data.role in ['admin', 'vendedor', 'membro'];

      // Próprio usuário edita apenas nome; admin da empresa pode gerenciar papéis da equipe
      allow update: if isSignedIn() && (
        (request.auth.uid == userId
          && isValidText(request.resource.data.nome, 120)
          && request.resource.data.role == resource.data.role
          && request.resource.data.empresaId == resource.data.empresaId)
        || (isAdminOfEmpresa(resource.data.empresaId)
          && request.resource.data.empresaId == resource.data.empresaId)
      );

      allow delete: if isAdminOfEmpresa(resource.data.empresaId) && request.auth.uid != userId;
    }

    // --- COLEÇÃO: EMPRESAS ---
    match /empresas/{empresaId} {
      allow read: if belongsToEmpresa(empresaId);

      allow create: if isSignedIn()
        && isValidText(request.resource.data.nome, 120);

      allow update: if isAdminOfEmpresa(empresaId)
        && isValidText(request.resource.data.nome, 120);

      allow delete: if false; // Exclusão apenas via rotina administrativa controlada
    }

    // --- CONTATOS ---
    match /contatos/{docId} {
      allow read: if belongsToEmpresa(resource.data.empresaId);

      allow create: if belongsToEmpresa(request.resource.data.empresaId)
        && isValidText(request.resource.data.nome, 120)
        && isValidText(request.resource.data.email, 160)
        && isOptionalText(request.resource.data, 'observacoes', 2000);

      allow update: if belongsToEmpresa(resource.data.empresaId)
        && request.resource.data.empresaId == resource.data.empresaId
        && isValidText(request.resource.data.nome, 120)
        && isValidText(request.resource.data.email, 160)
        && isOptionalText(request.resource.data, 'observacoes', 2000);

      allow delete: if belongsToEmpresa(resource.data.empresaId);
    }

    // --- NEGÓCIOS ---
    match /negocios/{docId} {
      allow read: if belongsToEmpresa(resource.data.empresaId);

      allow create: if belongsToEmpresa(request.resource.data.empresaId)
        && isValidText(request.resource.data.titulo, 150)
        && request.resource.data.valor is number
        && request.resource.data.valor >= 0;

      allow update: if belongsToEmpresa(resource.data.empresaId)
        && request.resource.data.empresaId == resource.data.empresaId
        && isValidText(request.resource.data.titulo, 150)
        && request.resource.data.valor is number
        && request.resource.data.valor >= 0;

      allow delete: if belongsToEmpresa(resource.data.empresaId);
    }

    // --- TAREFAS ---
    match /tarefas/{docId} {
      allow read: if belongsToEmpresa(resource.data.empresaId);

      allow create: if belongsToEmpresa(request.resource.data.empresaId)
        && isValidText(request.resource.data.titulo, 200)
        && isOptionalText(request.resource.data, 'observacoes', 2000);

      allow update: if belongsToEmpresa(resource.data.empresaId)
        && request.resource.data.empresaId == resource.data.empresaId
        && isValidText(request.resource.data.titulo, 200)
        && isOptionalText(request.resource.data, 'observacoes', 2000);

      allow delete: if belongsToEmpresa(resource.data.empresaId);
    }

    // --- PRODUTOS / SERVIÇOS (Exclusão restrita a Admin) ---
    match /produtos/{docId} {
      allow read: if belongsToEmpresa(resource.data.empresaId);

      allow create: if belongsToEmpresa(request.resource.data.empresaId)
        && isValidText(request.resource.data.nome, 150)
        && request.resource.data.preco is number
        && request.resource.data.preco >= 0;

      allow update: if belongsToEmpresa(resource.data.empresaId)
        && request.resource.data.empresaId == resource.data.empresaId
        && isValidText(request.resource.data.nome, 150)
        && request.resource.data.preco is number
        && request.resource.data.preco >= 0;

      allow delete: if isAdminOfEmpresa(resource.data.empresaId);
    }

    // --- MÓDULOS FUTUROS (Atividades, Propostas, Configurações de Funil) ---
    match /{colecao}/{docId} {
      allow read: if colecao in ['atividades', 'propostas', 'funil_etapas']
        && belongsToEmpresa(resource.data.empresaId);

      allow create: if colecao in ['atividades', 'propostas', 'funil_etapas']
        && belongsToEmpresa(request.resource.data.empresaId);

      allow update: if colecao in ['atividades', 'propostas', 'funil_etapas']
        && belongsToEmpresa(resource.data.empresaId)
        && request.resource.data.empresaId == resource.data.empresaId;

      allow delete: if colecao in ['atividades', 'propostas', 'funil_etapas']
        && belongsToEmpresa(resource.data.empresaId);
    }
  }
}
```

## Integração WhatsApp

- **Token de Verificação:** O `VERIFY_TOKEN` deve ser uma string secreta e não deve ser commitado no código (usar variáveis de ambiente).
- **Validação de Origem:** A Cloud Function deve validar a assinatura `X-Hub-Signature-256` (usando o App Secret da Meta) para garantir que a requisição veio realmente do WhatsApp.
- **Isolamento Multi-tenant:** O número de telefone que recebe a mensagem deve ser mapeado para um `empresaId`. Um número não pode criar leads para mais de uma empresa.

## Sessão e Autenticação

### Logout por Inatividade (30 minutos)

Para mitigar riscos de acesso não autorizado em computadores compartilhados, a sessão do usuário expira automaticamente após **30 minutos de inatividade**.

- **Implementação:** Hook `useInactivityLogout` que monitora eventos de interação (`mousemove`, `keydown`, `click`, `scroll`).
- **Timer:** Reiniciado a cada evento. Se atingir 30 minutos, chama `signOut(auth)`.
- **Redirecionamento:** Após o logout, o usuário é levado para a Landing Page com a mensagem: "Sua sessão expirou por inatividade."
- **Configuração:** O tempo pode ser ajustado via constante `INACTIVITY_TIMEOUT` (padrão: 30 _ 60 _ 1000 ms).

### Recuperação de Senha

O link "Esqueceu sua senha?" na tela de Login dispara o fluxo de recuperação.

- **Implementação:** Modal com campo de e-mail. Ao submeter, chama `sendPasswordResetEmail(auth, email)`.
- **Feedback:** Toast de sucesso: "Enviamos um link de recuperação para o seu e-mail. Verifique a caixa de entrada e o spam."
- **Segurança:** O Firebase não revela se o e-mail existe ou não (proteção contra enumeração de usuários).
