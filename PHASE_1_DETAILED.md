# 🔨 Fase 1: Fundação + Autenticação

**Status:** 🚀 Em andamento  
**Duração:** Semanas 1-2  
**Objetivo:** Ter autenticação funcionando e estrutura base do app

---

## 📋 Tasks da Fase 1

### 1.1 Configuração Base do Projeto ✅

- [x] Projeto Expo criado
- [x] TypeScript configurado
- [x] TailwindCSS + NativeWind instalados
- [x] Zustand para state management
- [x] Supabase SDK instalado
- [ ] ESLint configurado
- [ ] Jest configurado para testes
- [ ] GitHub Actions workflow criado

### 1.2 Supabase Setup

- [ ] Criar projeto Supabase
- [ ] Configurar PostgreSQL
- [ ] Criar schema do banco (schema.sql)
- [ ] Habilitar Row-Level Security (RLS)
- [ ] Habilitar Realtime
- [ ] Seed data para testes (opcional)
- [ ] Configurar `.env` com credenciais

### 1.3 Arquitetura de Pastas

- [ ] Reorganizar `src/` conforme ARCHITECTURE.md
- [ ] Criar pastas: `app/`, `components/`, `hooks/`, `services/`, `context/`, `types/`, `utils/`, `constants/`
- [ ] Criar `src/app/` com Expo Router structure
- [ ] Criar exemplos de componentes base

### 1.4 Autenticação - Parte 1: Service Layer

- [ ] Criar `src/services/auth/authService.ts`
  - Login com email/senha
  - Signup com email/senha
  - Google OAuth
  - Apple Sign-In
  - Logout
  - Token refresh
- [ ] Testes unitários de authService
- [ ] Integração com Supabase Auth
- [ ] Secure token storage (Keychain/Keystore)

### 1.5 Autenticação - Parte 2: Context & Hooks

- [ ] Criar `src/context/AuthContext.tsx`
- [ ] Criar `src/hooks/useAuth.ts`
- [ ] Implementar session persistence
- [ ] Testes de context

### 1.6 Autenticação - Parte 3: UI Screens

- [ ] Criar `src/app/(auth)/_layout.tsx`
- [ ] Criar `src/app/(auth)/splash.tsx` (UC_AUTH_SPLASH)
- [ ] Criar `src/app/(auth)/login.tsx` (UC002)
- [ ] Criar `src/app/(auth)/signup.tsx` (UC001)
- [ ] Criar `src/app/(auth)/forgot-password.tsx`
- [ ] Testes de UI com React Native Testing Library

### 1.7 Navigation & Routing

- [ ] Criar `src/app/_layout.tsx` (root)
- [ ] Implementar Auth Stack vs App Stack
- [ ] Criar placeholder para app screens
- [ ] Testar navegação completa

### 1.8 Validação & Utilitários

- [ ] Criar `src/utils/validators.ts`
  - Email validator
  - Password validator (força)
  - General input validation
- [ ] Criar `src/utils/storage.ts`
  - Token storage helpers
  - AsyncStorage helpers
- [ ] Testes de utilitários

### 1.9 UI Components Base

- [ ] Criar `src/components/ui/Button.tsx`
- [ ] Criar `src/components/ui/Input.tsx`
- [ ] Criar `src/components/ui/Card.tsx`
- [ ] Criar `src/components/ui/Modal.tsx`
- [ ] Criar `src/components/ui/Toast.tsx`
- [ ] Design tokens em `src/constants/colors.ts`

### 1.10 Testes

- [ ] Setup Jest + React Native Testing Library
- [ ] Testes: validators (5-10 tests)
- [ ] Testes: authService (8-12 tests)
- [ ] Testes: AuthContext (5-8 tests)
- [ ] Testes: UI screens (3-5 tests)
- [ ] Cobertura: > 80%

### 1.11 Documentação

- [ ] Criar `PHASE_1_DETAILED.md` (este arquivo atualizado)
- [ ] README.md com setup instructions
- [ ] Atualizar IMPLEMENTATION_CHECKLIST.md
- [ ] Documentar decisões técnicas

### 1.12 CI/CD

- [ ] Setup GitHub Actions
- [ ] Workflow para lint + testes
- [ ] Workflow para build preview
- [ ] Build iOS + Android (opcional para MVP)

---

## 🎯 Casos de Uso (UCs) da Fase 1

### UC001 - Criar Conta

**Tela:** `src/app/(auth)/signup.tsx`

**Fluxo:**
1. Usuário preenche formulário (nome, email, senha, confirmar senha)
2. Validação client-side
3. Call para `authService.signup()`
4. Supabase valida e cria usuário
5. E-mail de verificação enviado
6. App redireciona para onboarding (próxima fase)

**Testes:**
```tsx
describe("UC001 - Criar Conta", () => {
  it("should validate email", () => {});
  it("should validate password strength", () => {});
  it("should create account with valid data", () => {});
  it("should show error for duplicate email", () => {});
});
```

---

### UC002 - Fazer Login

**Tela:** `src/app/(auth)/login.tsx`

**Fluxo:**
1. Usuário preenche email + senha
2. Validação
3. Call para `authService.login()`
4. Token salvo em Keychain/Keystore
5. Redireciona para:
   - Onboarding (se primeira vez)
   - Dashboard (se família existe)

**Testes:**
```tsx
describe("UC002 - Fazer Login", () => {
  it("should login with valid credentials", () => {});
  it("should reject invalid credentials", () => {});
  it("should store token securely", () => {});
  it("should redirect correctly", () => {});
});
```

---

### UC003 - Login com Google

**Tela:** `src/app/(auth)/login.tsx` (botão extra)

**Fluxo:**
1. Usuário tapa "Sign in with Google"
2. Expo Linking abre Google OAuth
3. Usuário autentica
4. App recebe ID token
5. Supabase verifica
6. Same flow as UC002

**Notas:**
- Usar `expo-linking` + `@supabase/supabase-js` Google auth
- PKCE flow para segurança

---

### UC004 - Login com Apple

**Tela:** `src/app/(auth)/login.tsx` (botão extra)

**Fluxo:**
- Similar a UC003, mas com Apple Sign-In
- `expo-apple-authentication` (se necessário)

---

### UC005 - Recuperar Senha

**Tela:** `src/app/(auth)/forgot-password.tsx`

**Fluxo:**
1. Usuário informa e-mail
2. Supabase envia link de reset
3. Link válido por 1 hora
4. Usuário clica e vai para reset-password
5. Informa nova senha
6. Supabase atualiza
7. Redireciona para login

---

### UC006 - Aceitar Convite (Continuação)

**Tela:** `src/app/(auth)/accept-invite.tsx`

**Fluxo:**
1. Link: `ninho.app/invite/[token]`
2. App valida token
3. Se usuário não autenticado → signup
4. Se autenticado → adiciona à família (próxima fase)
5. Redireciona ao dashboard

---

## 📊 Schema de Banco (Fase 1)

```sql
-- Supabase gerencia auth.users automaticamente

-- Tabela de perfis de usuário (extensão de auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS para user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Tabelas de convites (usaremos depois)
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token UUID DEFAULT gen_random_uuid(),
  family_id UUID, -- Será usado na Fase 2
  role VARCHAR(20) DEFAULT 'member',
  accepted_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invitations sent to them"
  ON invitations FOR SELECT
  USING (email = auth.jwt() ->> 'email' OR auth.uid() = created_by);
```

---

## 🧪 Testes - Estrutura

```
tests/
├── unit/
│   ├── validators.test.ts        # 10-15 testes
│   ├── authService.test.ts       # 12-18 testes
│   └── storage.test.ts           # 5-8 testes
├── integration/
│   ├── auth.integration.test.ts  # 8-12 testes
│   └── authContext.test.ts       # 6-10 testes
└── e2e/
    └── auth-flow.e2e.test.ts     # 3-5 testes (opcional)
```

**Total esperado:** 50-80 testes passando

---

## 📦 Dependências Necessárias

Já instaladas em `package.json`:
- ✅ `@supabase/supabase-js`
- ✅ `expo`
- ✅ `expo-router`
- ✅ `expo-secure-store` (para tokens)
- ✅ `nativewind`
- ✅ `zustand`
- ✅ `react-native`

Faltam adicionar:
```bash
npm install --save-dev \
  @types/jest \
  jest \
  @react-native-async-storage/async-storage \
  @testing-library/react-native \
  @testing-library/react-native-testing-library
```

---

## ⚙️ Variáveis de Ambiente

Criar `.env.local`:

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxxxx

# OAuth (desejado)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
EXPO_PUBLIC_APPLE_CLIENT_ID=xxxxx
```

---

## 📈 Critérios de Aceite - Fase 1 Completa

- [ ] Splash screen exibe por 2-3 segundos
- [ ] Login funciona com email/senha
- [ ] Signup funciona com validações
- [ ] Google OAuth funciona (iOS + Android)
- [ ] Apple Sign-In funciona (iOS)
- [ ] Token armazenado de forma segura
- [ ] Logout limpa tokens
- [ ] Session persiste após fechar app
- [ ] ESLint passa 100%
- [ ] TypeScript sem erros
- [ ] Testes: > 80% cobertura
- [ ] App não crasha em desenvolvimento
- [ ] Navegação funciona entre auth screens
- [ ] Offline mode mantém sessão anterior

---

## 🚀 Como Começar

### Passo 1: Setup Supabase

1. Crie conta em [supabase.com](https://supabase.com)
2. Crie novo projeto
3. Copie URL e ANON_KEY
4. Crie `.env.local` com valores

### Passo 2: Rode o Schema

```bash
# Copie schema.sql para Supabase SQL Editor
# Ou use Supabase CLI
supabase db push
```

### Passo 3: Comece a Implementar

Ordem recomendada:
1. authService.ts (testes primeiro!)
2. validators.ts + testes
3. AuthContext.tsx
4. UI screens (splash, login, signup)
5. Navigation
6. E2E tests

### Passo 4: Rode Localmente

```bash
npm run dev
# Escanear QR com Expo Go
```

---

## 📝 Notas Importantes

- **Senhas:** Supabase Auth cuida do hashing, nunca envie plaintext
- **Tokens:** Use `expo-secure-store` para armazenar JWT
- **Refresh:** Implementar token refresh automático antes de expirar
- **Erros:** Não revelar detalhes internos (sempre mensagens genéricas)
- **Testing:** Testes ANTES da UI (TDD)

---

## ✅ Checklist para Completar Fase 1

- [ ] Schema.sql executado
- [ ] Todos os 50+ testes passam
- [ ] ESLint sem warnings
- [ ] TypeScript sem errors
- [ ] App roda em iOS simulator
- [ ] App roda em Android emulator
- [ ] Expo Go consegue abrir
- [ ] PR aberto com todas as mudanças
- [ ] Code review completo
- [ ] Merge para main
- [ ] IMPLEMENTATION_CHECKLIST.md atualizado

---

**Início:** Semana 1 seg 09h  
**Deadline:** Sexta 18h  
**Responsável:** Dev  
**PM:** Revisar daily standup
