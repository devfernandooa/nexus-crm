# Nexus CRM — SaaS Multi-tenant

Sistema de CRM (Customer Relationship Management) moderno, construído como um SaaS.

## 🚀 Como Rodar

1. Clone o repositório.
2. Instale as dependências: `npm install`
3. Crie um arquivo `.env` na raiz e adicione as chaves do seu Firebase (veja o modelo abaixo).
4. Inicie o servidor local: `npm run dev`
5. Acesse: `http://localhost:3000`

**Modelo do `.env`:**

```env
VITE_FIREBASE_API_KEY="sua-chave"
VITE_FIREBASE_AUTH_DOMAIN="seu-projeto.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="seu-projeto"
VITE_FIREBASE_STORAGE_BUCKET="seu-projeto.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="seu-id"
VITE_FIREBASE_APP_ID="seu-app-id"
```
