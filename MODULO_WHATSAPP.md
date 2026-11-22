# MODULO_WHATSAPP.md — Integração WhatsApp Business Platform

> **Propósito:** Documentar a arquitetura, o fluxo de captação de leads e os custos da integração com a API oficial do WhatsApp (WhatsApp Business Platform).
>
> **Status:** Planejado / Em desenvolvimento.

---

## 1. Visão Geral

O módulo de WhatsApp permitirá que o Nexus Hub receba mensagens de leads automaticamente, colete informações essenciais (Nome, E-mail, Telefone, Interesse) por meio de um bot de conversa e cadastre o contato como Lead no sistema, vinculado à empresa correta (`empresaId`).

**Fluxo Resumido:**

1.  Lead envia mensagem para o número comercial da empresa.
2.  Meta (WhatsApp) dispara um **Webhook** para uma Cloud Function.
3.  A Cloud Function valida a origem, inicia o fluxo de perguntas e salva as respostas.
4.  Ao final, cria um documento na coleção `contatos` com `status: 'Novo'` e `empresaId` da empresa.

---

## 2. Arquitetura Técnica

### 2.1 Componentes

| Componente               | Tecnologia                              | Responsabilidade                                                                                             |
| :----------------------- | :-------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| **Endpoint de Recepção** | Firebase Cloud Function (`onRequest`)   | Receber Webhooks da Meta (GET para verificação, POST para mensagens).                                        |
| **Lógica do Bot**        | Cloud Function (Node.js)                | Gerenciar o estado da conversa, fazer perguntas, validar respostas.                                          |
| **Banco de Dados**       | Firestore                               | Armazenar o estado temporário da conversa (ex: `whatsapp_sessions`) e, ao final, criar o Lead em `contatos`. |
| **Credenciais**          | Variáveis de Ambiente (Firebase Config) | `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`.                                |

### 2.2 Estrutura de Pastas (Sugestão)

```text
functions/
├── index.js               # Ponto de entrada das Cloud Functions
├── whatsapp/
│   ├── webhook.js         # Handler do Webhook (GET/POST)
│   ├── botFlow.js         # Lógica de perguntas e respostas
│   └── whatsappService.js # Funções para enviar mensagens (API da Meta)
```
