# 🗺️ Navigation Architecture - Ninho

**Status:** ✅ Implementado  
**Objetivo:** Roteamento automático baseado em estado (auth + family)

---

## 📊 Estrutura de Navigation

```
Root (_layout.tsx)
  ├─ Verificar Autenticação
  ├─ Verificar Família
  └─ Rotear para Stack apropriado:
      ├─ Auth Stack (não autenticado)
      ├─ Onboarding Stack (autenticado sem família)
      ├─ App Stack (autenticado com família)
      └─ Modal Stacks (sobre tudo)
```

---

## 🔄 Fluxo de Roteamento

### 1. Não Autenticado
```
App Inicia
  ↓
Root Layout verifica contexto
  ↓
Sem user → Auth Stack
  ↓
splash.tsx (Splash Screen)
  ↓
login.tsx ou signup.tsx
  ↓
Usuário faz login ✅
```

### 2. Autenticado sem Família
```
Usuário faz login
  ↓
Root Layout verifica family
  ↓
user ✅ mas family ❌ → Onboarding Stack
  ↓
welcome.tsx (Tela 1)
  ↓
... (create-family, add-baby, invite-partner, complete)
  ↓
Usuário cria família ✅
```

### 3. Autenticado com Família
```
Usuário completa onboarding
  ↓
Root Layout verifica state
  ↓
user ✅ && family ✅ → App Stack
  ↓
dashboard (Main App)
  ↓
Usuário navega pela app
```

---

## 📁 Estrutura de Pastas

```
src/app/
├── _layout.tsx                  ← Root Navigation (aqui!)
├── splash-loader.tsx            ← Loader enquanto inicia
│
├── (auth)/
│   ├── _layout.tsx              ← Auth Stack
│   ├── splash.tsx
│   ├── login.tsx
│   ├── signup.tsx
│   └── ...
│
├── (onboarding)/
│   ├── _layout.tsx              ← Onboarding Stack
│   ├── welcome.tsx
│   ├── create-family.tsx
│   ├── add-baby.tsx
│   ├── invite-partner.tsx
│   └── complete.tsx
│
└── (app)/
    ├── _layout.tsx              ← App Stack (Tabs)
    ├── (dashboard)/
    │   ├── index.tsx
    │   └── ...
    ├── (baby)/
    │   ├── index.tsx
    │   └── ...
    └── ... (outros tabs)

+ accept-invite.tsx             ← Modal (aceitar convite)
```

---

## 🎯 Componentes Principais

### Root Layout (_layout.tsx)
```typescript
- AuthProvider (wraps everything)
- FamilyProvider (wraps everything)
- RootLayoutNav (lógica de roteamento)
- useSegments para saber stack atual
- useRouter para navegar
- Condições IF para determinar stack
```

### Contextos Requeridos
```typescript
// Precisa estar funcionando para roteamento correto:
- AuthContext (user, loading)
- FamilyContext (family, loading)
```

### Hooks Usados
```typescript
- useAuth() → pega user
- useFamily() → pega family
- useRouter() → navega
- useSegments() → sabe stack atual
- useRootNavigationState() → sabe se app está pronto
```

---

## 🔐 Estados de Autenticação

| Estado | user | family | Roteia Para | Descrição |
|--------|------|--------|-------------|-----------|
| Loading | ? | ? | splash-loader | App está carregando |
| Novo Usuário | ❌ | - | (auth) | Fazer login/signup |
| Login OK | ✅ | ❌ | (onboarding) | Criar família |
| Completo | ✅ | ✅ | (app) | Usar app normally |

---

## 📱 Fluxos de Uso

### Novo Usuário (Completo)
```
splash-loader
  ↓ (wait for auth check)
(auth)/splash
  ↓ (tap Começar)
(auth)/signup
  ↓ (preencher form)
(auth)/login (auto-redirect após signup)
  ↓ (sucesso)
(onboarding)/welcome
  ↓ (tap Começar)
(onboarding)/create-family
  ↓
(onboarding)/add-baby
  ↓
(onboarding)/invite-partner
  ↓
(onboarding)/complete
  ↓
(app)/(dashboard) ✅
```

### Usuário Existente (Login Rápido)
```
splash-loader
  ↓
(auth)/login
  ↓ (credentials corretos)
(app)/(dashboard) ✅
```

### Aceitar Convite (Deeplink)
```
ninho://invite/[token]
  ↓
(auth)/login (if not autenticado)
  ↓
accept-invite (modal)
  ↓
(app)/(dashboard) ✅
```

---

## 🔗 Deeplinks Suportados

```
ninho://
  └─ invite/[token]       → Aceitar convite
  └─ dashboard            → Ir para dashboard
  └─ family/[id]          → Abrir família específica
  └─ baby/[id]            → Abrir bebé específico
```

Configurar em `app.json`:
```json
{
  "scheme": "ninho",
  "plugins": [
    [
      "expo-router",
      {
        "origin": "https://ninho.app"
      }
    ]
  ]
}
```

---

## ⚡ Otimizações

### Loading States
```typescript
// Enquanto carrega:
- Não deixa usuário navegar
- Mostra splash-loader
- Após 300ms (auth check), roteia automaticamente
```

### Animations
```typescript
// Transições suaves:
- Auth → Onboarding: animationEnabled: false (flash)
- Onboarding → App: animationEnabled: true (slide)
- App navigation: animationEnabled: true (normal)
```

### Gesture Handling
```typescript
// Auth/Onboarding: gestureEnabled: false
// App: gestureEnabled: true
```

---

## 🧪 Como Testar

### Cenário 1: Novo Usuário
```
1. Limpar dados do app (ou usar novo device)
2. App inicia → splash-loader
3. Automático → (auth)/splash
4. Clicar "Começar" → signup
5. Preencher form → criar conta
6. Auto-redirect → (onboarding)/welcome
7. Completar onboarding
8. Auto-redirect → (app)/(dashboard) ✅
```

### Cenário 2: Usuário Logado
```
1. App já tem dados salvos
2. Inicia → splash-loader
3. Verifica auth → encontra token ✅
4. Auto-redirect → (app)/(dashboard) ✅
```

### Cenário 3: Deeplink Convite
```
1. Abrir link: ninho://invite/abc123
2. Se não autenticado → (auth)/login
3. Se autenticado → accept-invite (modal)
4. Auto-close → volta ao (app)
```

---

## 🐛 Troubleshooting

### App fica em splash-loader
**Problema:** `navigationState?.key` nunca vira true  
**Solução:** Verificar se `useRootNavigationState()` está funcionando

### Navigação não funciona
**Problema:** Contextos não carregaram  
**Solução:** Verificar `authLoading` e `familyLoading` no Log

### Loop infinito de navegação
**Problema:** Condição IF sempre redireciona  
**Solução:** Adicionar `if (!isReady) return;` no início do useEffect

### Deeplinks não funcionam
**Problema:** Link ninho:// não abre app  
**Solução:** Verificar `app.json` schema e configuração

---

## 📊 Próximas Etapas

### Passo 7: Testes
- Testar todos 3 cenários
- Testar deeplinks
- Testar logout + login novamente

### Passo 8: Polish
- Performance check
- Memory leaks check
- Edge cases

### Fase 3: Dashboard
- Criar stack (app)
- Criar dashboard screen
- Adicionar tabs de navegação

---

## 📝 Código Relevante

### Arquivo Principal
- `src/app/_layout.tsx` - Root Navigation

### Screens Relacionadas
- `src/app/splash-loader.tsx` - Loading screen
- `src/app/(auth)/_layout.tsx` - Auth Stack
- `src/app/(onboarding)/_layout.tsx` - Onboarding Stack
- `src/app/(app)/_layout.tsx` - App Stack (criar em Fase 3)

### Contextos Requeridos
- `src/context/AuthContext.tsx`
- `src/context/FamilyContext.tsx`

---

**Status:** ✅ Completo e testável

Próximo: Passo 7 - Testes
