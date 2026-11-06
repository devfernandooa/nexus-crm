---

### 2. `ARCHITECTURE.md` (Criar novo)

```markdown
# ARCHITECTURE.md — Nexus CRM

> **Propósito:** Descreve a arquitetura, os padrões e os fluxos do sistema. É a "lei" do projeto.

---

## 1. Estrutura de Pastas e Camadas (Feature-based)

O projeto segue o padrão de **Separação de Responsabilidades (SoC)**:

```text
src/
├── components/       # Componentes globais (layouts/, ui/)
├── contexts/         # Estado global (AuthContext, ThemeContext)
├── services/         # Regras de negócio e comunicação com o Firebase
├── pages/            # Telas do sistema (LandingPage, Dashboard, Contatos)
└── features/         # Módulos específicos (em construção)
```
