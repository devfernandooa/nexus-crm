# ARCHITECTURE.md — Nexus CRM

> **Propósito:** Descreve a arquitetura, os padrões e os fluxos do sistema. É a "lei" do projeto.

---

## 1. Estrutura de Pastas e Camadas

O projeto segue o padrão de **Separação de Responsabilidades (SoC)**, utilizando uma arquitetura baseada em features:

```text
src/
├── components/
│   ├── layouts/      # Layout, Sidebar, AuthLayout
│   └── ui/           # Componentes reutilizáveis (Botao, Modal, PageHeader, SelectProdutos)
├── contexts/         # Estado global (AuthContext, ThemeContext)
├── services/         # Regras de negócio e comunicação direta com Firebase (CRUDs)
├── pages/            # Telas do sistema (Dashboard, Contatos, Negocios, etc.)
└── features/         # (Futuro) Módulos complexos que exigem múltiplos componentes
```
