# 🏠 Ninho — Family OS

> O sistema operacional da sua família.

Um app mobile multiplataforma (iOS + Android + Web) para famílias com bebês — registros de rotina, agenda compartilhada, tarefas, lista de compras e muito mais.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Mobile + Web | Expo (React Native) + Expo Router |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Estilização | NativeWind (Tailwind para RN) |
| Estado | Zustand |
| Data fetching | TanStack Query |

---

## Estrutura de pastas

```
ninho/
├── app/                     # Rotas (Expo Router)
│   ├── _layout.tsx          # Layout raiz + providers
│   ├── (auth)/              # Telas de autenticação
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── onboarding.tsx   # Criar família + bebê + convidar parceiro
│   └── (app)/               # App autenticado
│       ├── (tabs)/          # Bottom tabs
│       │   ├── dashboard.tsx
│       │   ├── baby.tsx
│       │   ├── couple.tsx
│       │   ├── kids.tsx
│       │   └── home.tsx
│       ├── baby/
│       │   └── record.tsx   # Registro rápido (mamada, fralda, sono…)
│       └── family/
│           └── settings.tsx
├── src/
│   ├── components/
│   │   ├── ui/              # Button, Input, Card, Header
│   │   └── baby/            # RecordCard, QuickRegister
│   ├── constants/
│   │   └── theme.ts         # Cores, espaçamentos, tipografia
│   ├── hooks/
│   │   └── useAuth.ts       # Hook de autenticação + listener
│   ├── lib/
│   │   └── supabase.ts      # Client Supabase configurado
│   ├── services/
│   │   └── api.ts           # Todas as chamadas ao Supabase
│   ├── stores/
│   │   └── auth.store.ts    # Zustand store de autenticação
│   ├── styles/
│   │   └── global.css       # Tailwind base
│   └── types/
│       └── index.ts         # Tipos TypeScript globais
└── supabase/
    └── schema.sql           # Schema completo com RLS
```

---

## Começar

### 1. Clonar e instalar

```bash
git clone <repo>
cd ninho
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Preencha com suas chaves do Supabase
```

Crie um projeto em [supabase.com](https://supabase.com), vá em **Settings → API** e copie:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### 3. Criar o banco de dados

No painel do Supabase, abra o **SQL Editor** e execute:

```bash
cat supabase/schema.sql
```

Cole e execute todo o conteúdo.

### 4. Rodar

```bash
# Web (mais rápido para desenvolvimento)
npm run web

# iOS (necessário Mac + Xcode)
npm run ios

# Android (necessário Android Studio)
npm run android
```

---

## Roadmap

| Fase | Status | Entrega |
|------|--------|---------|
| **0 — Fundação** | ✅ | Expo + Supabase + Design System + Nav |
| **1 — Onboarding** | ✅ | Criar família + convidar + cadastrar bebê |
| **2 — Dashboard** | ✅ | Resumo do dia + registro rápido |
| **3 — Registro bebê** | ✅ | Mamada, fralda, sono, peso, remédio |
| **4 — Agenda** | 📋 | Eventos familiares + notificações |
| **5 — Tarefas** | 🔄 (básico) | Criar, concluir, carga mental |
| **6 — Compras** | ✅ | Lista compartilhada em tempo real |
| **7 — Carga mental** | 🔄 (básico) | Termômetro semanal |
| **8 — Convidados** | 📋 | Link/QR com expiração |
| **9 — Notificações** | 📋 | Push inteligente |
| **10 — IA** | 📋 | Insights da rotina familiar |
| **11 — Assinatura** | 📋 | Stripe / Apple / Google |
| **12 — Landing Page** | 📋 | SEO + Blog |
| **13 — Publicação** | 📋 | Lojas + Domínio |

---

## Perfis e permissões (Row Level Security)

| Perfil | Acesso |
|--------|--------|
| `admin` | Tudo — criar família, convidar, deletar |
| `parent` | Registros, tarefas, eventos |
| `child` | Apenas suas tarefas |
| `guest` | Somente visualização, acesso temporário |

As regras são aplicadas diretamente no PostgreSQL via RLS — nenhuma família acessa dados de outra, mesmo com a anon key exposta no client.

---

## Segurança

- Credenciais via variáveis de ambiente (`EXPO_PUBLIC_*`)
- Row Level Security em **todas** as tabelas
- Tokens de convite com expiração (`expires_at`)
- Sem secrets no código

---

*Ninho v1.0.0 — Fase 0-3 completa*
