# 🏗️ Arquitetura & Setup do Ninho

**Versão:** 1.0  
**Status:** Em Desenvolvimento  

---

## 📁 Estrutura de Pastas

```
ninho/
├── README.md                    # Overview do projeto
├── PRODUCT_MAP.md               # Mapa de produto (Single Source of Truth)
├── IMPLEMENTATION_CHECKLIST.md  # Progresso de implementação
├── ARCHITECTURE.md              # Este arquivo
│
├── src/
│   ├── app/
│   │   ├── _layout.tsx          # Root navigation (Expo Router)
│   │   ├── (auth)/
│   │   │   ├── _layout.tsx      # Auth stack
│   │   │   ├── splash.tsx       # Splash screen (UC_AUTH_001)
│   │   │   ├── login.tsx        # Login (UC_AUTH_002)
│   │   │   ├── signup.tsx       # Cadastro (UC_AUTH_001)
│   │   │   ├── forgot-password.tsx
│   │   │   └── accept-invite.tsx
│   │   │
│   │   ├── (onboarding)/
│   │   │   ├── _layout.tsx      # Onboarding stack
│   │   │   ├── welcome.tsx
│   │   │   ├── create-family.tsx
│   │   │   ├── add-baby.tsx
│   │   │   ├── invite-partner.tsx
│   │   │   └── tutorial.tsx
│   │   │
│   │   └── (app)/
│   │       ├── _layout.tsx      # App stack (tabs)
│   │       ├── (dashboard)/
│   │       │   ├── index.tsx    # Main dashboard
│   │       │   ├── quick-register.tsx
│   │       │   └── [babyId].tsx
│   │       │
│   │       ├── (baby)/
│   │       │   ├── index.tsx    # Dashboard do bebê
│   │       │   ├── [babyId]/
│   │       │   │   ├── history.tsx
│   │       │   │   ├── charts.tsx
│   │       │   │   └── [recordId].tsx
│   │       │   └── register/
│   │       │       ├── feeding.tsx
│   │       │       ├── sleep.tsx
│   │       │       └── [type].tsx
│   │       │
│   │       ├── (agenda)/
│   │       │   ├── index.tsx
│   │       │   └── [eventId].tsx
│   │       │
│   │       ├── (tasks)/
│   │       │   ├── index.tsx
│   │       │   └── [taskId].tsx
│   │       │
│   │       ├── (shopping)/
│   │       │   ├── index.tsx
│   │       │   └── [listId].tsx
│   │       │
│   │       ├── (family)/
│   │       │   ├── index.tsx
│   │       │   ├── members.tsx
│   │       │   └── [memberId].tsx
│   │       │
│   │       ├── (mental-load)/
│   │       │   ├── index.tsx
│   │       │   └── insights.tsx
│   │       │
│   │       └── (settings)/
│   │           ├── index.tsx
│   │           ├── profile.tsx
│   │           ├── security.tsx
│   │           ├── preferences.tsx
│   │           └── about.tsx
│   │
│   ├── components/
│   │   ├── ui/                  # UI components genéricos
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── TextArea.tsx
│   │   │   ├── Select.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/              # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── TabBar.tsx
│   │   │   └── SafeAreaWrapper.tsx
│   │   │
│   │   ├── auth/                # Auth-related components
│   │   │   ├── AuthForm.tsx
│   │   │   ├── SocialAuth.tsx
│   │   │   └── PasswordInput.tsx
│   │   │
│   │   ├── dashboard/           # Dashboard-specific components
│   │   │   ├── DashboardCard.tsx
│   │   │   ├── QuickRegisterMenu.tsx
│   │   │   ├── BabySelector.tsx
│   │   │   ├── NextFeedingCard.tsx
│   │   │   ├── MentalLoadCard.tsx
│   │   │   └── ...
│   │   │
│   │   ├── baby/                # Baby module components
│   │   │   ├── BabyAvatar.tsx
│   │   │   ├── ActivityForm.tsx
│   │   │   ├── ActivityList.tsx
│   │   │   ├── FeedingForm.tsx
│   │   │   ├── SleepForm.tsx
│   │   │   └── ...
│   │   │
│   │   └── ...
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts           # Auth context hook
│   │   ├── useFamily.ts         # Family data hook
│   │   ├── useBaby.ts           # Baby data hook
│   │   ├── useActivities.ts     # Activities data hook
│   │   ├── useMentalLoad.ts     # Mental load hook
│   │   └── ...
│   │
│   ├── services/                # API & external services
│   │   ├── auth/
│   │   │   ├── authService.ts
│   │   │   ├── googleAuth.ts
│   │   │   └── appleAuth.ts
│   │   │
│   │   ├── family/
│   │   │   ├── familyService.ts
│   │   │   └── invitationService.ts
│   │   │
│   │   ├── baby/
│   │   │   ├── babyService.ts
│   │   │   └── activitiesService.ts
│   │   │
│   │   ├── supabase/
│   │   │   ├── supabaseClient.ts
│   │   │   ├── supabaseRealtime.ts
│   │   │   └── supabaseStorage.ts
│   │   │
│   │   └── ...
│   │
│   ├── context/                 # React context for state management
│   │   ├── AuthContext.tsx
│   │   ├── FamilyContext.tsx
│   │   ├── BabyContext.tsx
│   │   ├── NotificationContext.tsx
│   │   └── ...
│   │
│   ├── types/                   # TypeScript types
│   │   ├── auth.types.ts
│   │   ├── family.types.ts
│   │   ├── baby.types.ts
│   │   ├── activity.types.ts
│   │   ├── task.types.ts
│   │   └── ...
│   │
│   ├── utils/                   # Utility functions
│   │   ├── validators.ts        # Form validation
│   │   ├── formatters.ts        # Data formatting
│   │   ├── dates.ts             # Date utilities
│   │   ├── storage.ts           # AsyncStorage helpers
│   │   └── ...
│   │
│   ├── constants/               # App constants
│   │   ├── roles.ts             # Family roles
│   │   ├── categories.ts        # Activity categories
│   │   ├── colors.ts            # Design tokens
│   │   └── ...
│   │
│   └── App.tsx                  # Entry point
│
├── supabase/
│   ├── schema.sql               # Database schema
│   ├── migrations/              # Database migrations
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_add_features.sql
│   │   └── ...
│   ├── seed.sql                 # Seed data (dev)
│   └── rls_policies.sql         # Row-level security policies
│
├── tests/
│   ├── unit/                    # Unit tests
│   │   ├── auth.test.ts
│   │   ├── family.test.ts
│   │   └── ...
│   ├── integration/             # Integration tests
│   │   ├── auth.integration.test.ts
│   │   └── ...
│   └── e2e/                     # E2E tests
│       ├── auth.e2e.test.ts
│       └── ...
│
├── .env.example                 # Environment variables template
├── .env.local                   # Local env (git ignored)
├── .env.production              # Production env (git ignored)
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── metro.config.js
├── babel.config.js
└── .gitignore
```

---

## 🔗 Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend Framework** | Expo + React Native | Cross-platform (iOS/Android) |
| **Navigation** | Expo Router | File-based routing (familiar to Next.js) |
| **Language** | TypeScript | Type safety |
| **Styling** | TailwindCSS + NativeWind | Consistent with web dev patterns |
| **Backend** | Supabase (PostgreSQL) | Serverless, built-in Auth, Realtime |
| **State Management** | React Context + hooks | Simple for MVP, can upgrade to Redux later |
| **Storage** | Supabase Storage | Images, PDFs |
| **Auth** | Supabase Auth | Google, Apple, email/password |
| **Realtime** | Supabase Realtime | Live dashboard updates |
| **Testing** | Jest + React Native Testing Library | Standard for React projects |
| **Code Quality** | ESLint + Prettier | Consistency |
| **CI/CD** | GitHub Actions | Free for open source |

---

## 🗄️ Database Design Principles

1. **Normalization:** 3NF (normal form) para evitar redundância
2. **RLS (Row-Level Security):** Cada user vê apenas sua família
3. **Auditoria:** `created_at`, `updated_at` em todas tabelas
4. **Soft Deletes:** Usar `deleted_at` instead of DELETE (opcional)
5. **UUIDs:** Como primary key (não auto-increment)
6. **Relationships:** Foreign keys com ON DELETE CASCADE onde apropriado

### Exemplo de RLS

```sql
-- Usuário vê apenas atividades de sua família
CREATE POLICY "Users can view their family activities"
  ON activities
  FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );
```

---

## 🔐 Authentication Flow

### Sign Up
```
1. User completes UC_AUTH_001 (Create Account)
2. Email verification sent (Supabase Auth sends)
3. User verifies email (link in inbox)
4. Redirects to onboarding
5. Create family + baby
6. Ready for dashboard
```

### Login
```
1. User enters email/password
2. Supabase Auth validates
3. JWT token + refresh token returned
4. Tokens stored in secure storage (Keychain/Keystore)
5. Redirect to dashboard if family exists, else onboarding
```

### Google/Apple OAuth
```
1. User taps "Sign in with Google/Apple"
2. Expo linking opens native OAuth
3. User authenticates
4. OAuth provider returns identity token
5. Supabase verifies token
6. User created/updated in auth.users
7. Same flow as manual signup
```

### Token Refresh
```
- Refresh token stored locally
- Before every API request: check if JWT expired
- If expired: call refresh endpoint
- Update tokens locally
- Retry original request
```

---

## 🎯 State Management Strategy

### Level 1: React Context (for MVP)

Use context for:
- Auth state (current user, token)
- Family state (current family, members)
- Baby state (current baby)
- UI state (loading, modal open, etc)

```tsx
// Example: AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
```

### Level 2: Custom Hooks (for data fetching)

```tsx
// Example: useBaby hook
export const useBaby = (babyId: string) => {
  const [baby, setBaby] = useState<Baby | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = supabase
      .from("babies")
      .on("*", (payload) => {
        setBaby(payload.new);
      })
      .subscribe();

    return () => {
      unsubscribe.unsubscribe();
    };
  }, [babyId]);

  return { baby, loading, error };
};
```

---

## 🧪 Testing Strategy

### Unit Tests
```tsx
// Example: validators.test.ts
describe("Validators", () => {
  it("should validate email", () => {
    expect(validateEmail("test@example.com")).toBe(true);
    expect(validateEmail("invalid")).toBe(false);
  });

  it("should validate password strength", () => {
    expect(validatePassword("WeakPass")).toBe(false); // no number
    expect(validatePassword("Strong123!")).toBe(true);
  });
});
```

### Integration Tests
```tsx
// Example: auth.integration.test.ts
describe("Authentication", () => {
  it("should sign up a new user", async () => {
    const { user, error } = await supabase.auth.signUp({
      email: "test@example.com",
      password: "TestPass123!",
    });

    expect(user).toBeDefined();
    expect(error).toBeNull();
  });
});
```

### E2E Tests (Detox)
```tsx
// Example: auth.e2e.test.ts
describe("Auth Flow", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it("should complete signup flow", async () => {
    await element(by.id("email-input")).typeText("test@example.com");
    await element(by.id("password-input")).typeText("TestPass123!");
    await element(by.id("signup-button")).tap();

    await waitFor(element(by.text("Bom dia")))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

---

## 🚀 Deployment Pipeline

### Development
1. Local development (Expo Go or custom build)
2. Test on physical device
3. Run Jest tests locally

### Staging
1. Push to `develop` branch
2. GitHub Actions runs lint, tests, build
3. APK/IPA built and uploaded to TestFlight/Firebase

### Production
1. Merge to `main` branch
2. Tag version (v1.0.0)
3. GitHub Actions builds for both platforms
4. Manual review and release to App Store/Google Play

---

## 📦 Environment Variables

```bash
# .env.example
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxxxx
EXPO_PUBLIC_API_URL=https://api.ninho.app
EXPO_PUBLIC_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
EXPO_PUBLIC_APPLE_CLIENT_ID=xxxxx
```

---

## 🔄 Git Workflow

```bash
# Create feature branch
git checkout -b feature/UC001-login

# Commit with conventional commits
git commit -m "feat(auth): implement login screen"

# Push and create PR
git push origin feature/UC001-login

# After review, merge with squash
git merge --squash feature/UC001-login
```

### Branch Naming
- `feature/UC###-description`: Nova feature
- `fix/issue-description`: Bug fix
- `docs/description`: Documentation
- `refactor/description`: Refactoring

---

## 📋 Code Review Checklist

Before approving a PR:

- [ ] Código segue o style guide (Prettier, ESLint)
- [ ] TypeScript sem erros
- [ ] Testes passam (Jest)
- [ ] Cobertura de testes > 80%
- [ ] Sem console.log (apenas logger)
- [ ] Sem secrets hardcoded
- [ ] Performance OK (< 16ms para re-renders)
- [ ] Acessibilidade checada
- [ ] README/docs atualizados se necessário

---

## 🛠️ Development Commands

```bash
# Setup
npm install
npx expo prebuild

# Development
npm run dev              # Expo dev
npm run dev:ios         # iOS simulator
npm run dev:android     # Android emulator

# Testing
npm test                # Jest
npm test:watch          # Watch mode
npm test:coverage       # Coverage report

# Linting
npm run lint            # ESLint
npm run lint:fix        # Auto-fix

# Building
npm run build:preview   # Expo preview
npm run build:ios       # iOS production build
npm run build:android   # Android production build

# Database
npm run db:migrate      # Run migrations
npm run db:seed         # Seed data
npm run db:reset        # Reset database
```

---

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [React Native Styling Guide](https://reactnative.dev/docs/style)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

**Versão:** 1.0  
**Última atualização:** 2024
