# 📖 Guia de Implementação - Como o Bob Vai Trabalhar

**Versão:** 1.0  
**Objetivo:** Deixar claro para o Bob (assistente de código) como implementar cada feature sem ambiguidades

---

## 🎯 Princípios

1. **Incremental:** Uma tela/feature por vez. Nunca múltiplas ao mesmo tempo.
2. **Sem Decisões de Produto:** O Bob segue exatamente o que o PRODUCT_MAP define. Nenhuma improviso.
3. **Testes Primeiro:** Antes de implementar a UI, testes da lógica.
4. **Documentação Local:** Cada tela tem seu próprio README (quando complexa).
5. **Tracking:** Use IMPLEMENTATION_CHECKLIST.md para marcar progresso.

---

## 📋 Template: Como Pedir uma Feature para o Bob

Quando você quer uma nova tela ou funcionalidade, use este template:

```markdown
# Implementar [Nome da Tela/Feature]

## Referência
- **Módulo:** [Módulo no PRODUCT_MAP]
- **UC:** [UC###]
- **Tela:** [Nome da tela]
- **Prioridade:** [Alta/Média/Baixa]

## Descrição
[Copie a descrição do PRODUCT_MAP.md]

## Critérios de Aceite
[Copie os critérios de aceite do UC]

## Schema de Banco
[Se há mudanças no banco, copie do PRODUCT_MAP.md]

## Casos de Uso Relacionados
- UC###
- UC###

## Notas
[Contexto adicional, se necessário]
```

### Exemplo Real

```markdown
# Implementar Tela de Login

## Referência
- **Módulo:** Autenticação (1️⃣)
- **UC:** UC002
- **Tela:** Login
- **Prioridade:** Crítica

## Descrição
Tela onde usuários registrados fazem login com e-mail e senha.

## Critérios de Aceite
- Mensagem de erro clara para credenciais inválidas
- Token armazenado de forma segura (keychain iOS, keystore Android)
- Refresh token funciona automaticamente
- Logout limpa tokens e session

## Schema de Banco
N/A (usa Supabase Auth)

## Notas
- Usar Supabase Auth para validação
- Integrar com AuthContext para state management
- Tela deve estar em `src/app/(auth)/login.tsx`
```

---

## 🛠️ Passo a Passo: Como o Bob Implementa

### Passo 1: Ler e Entender

```bash
# Bob lê o PRODUCT_MAP.md
# Bob lê o ARCHITECTURE.md
# Bob entende a feature completamente antes de programar
```

### Passo 2: Criar Tests

```tsx
// tests/auth.test.ts
describe("Login (UC002)", () => {
  it("should login with valid credentials", async () => {
    // Test implementation
  });

  it("should show error for invalid credentials", async () => {
    // Test implementation
  });

  it("should store token securely", async () => {
    // Test implementation
  });
});
```

### Passo 3: Implementar Service Layer

```tsx
// src/services/auth/authService.ts
export const loginWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);
  return data;
};
```

### Passo 4: Implementar UI Component

```tsx
// src/app/(auth)/login.tsx
export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      await loginWithEmail(email, password);
      // Redirect to dashboard
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white p-4">
      {/* UI */}
    </View>
  );
}
```

### Passo 5: Testar

```bash
npm test -- auth.test.ts
# Tests devem passar 100%
```

### Passo 6: Code Review

- [ ] Código limpo e documentado
- [ ] Testes passam
- [ ] TypeScript sem erros
- [ ] Performance OK
- [ ] Segurança checada

### Passo 7: Atualizar Checklist

```bash
# Edit IMPLEMENTATION_CHECKLIST.md
- [x] Tela de Login
```

---

## 📦 Estrutura de Componentes

### Componente Simples (Button)

```tsx
// src/components/ui/Button.tsx
import { TouchableOpacity, Text } from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}) => {
  const variantStyles = {
    primary: 'bg-blue-500',
    secondary: 'bg-gray-300',
    danger: 'bg-red-500',
  };

  return (
    <TouchableOpacity
      className={`px-4 py-3 rounded-lg ${variantStyles[variant]}`}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <Text className="text-white font-bold text-center">
        {loading ? 'Carregando...' : label}
      </Text>
    </TouchableOpacity>
  );
};
```

### Componente Complexo (ActivityForm)

```tsx
// src/components/baby/ActivityForm.tsx
// Típico: 200-400 linhas
// Tem validação, state, callbacks, sub-componentes

interface ActivityFormProps {
  type: 'feeding' | 'sleep' | 'diaper';
  onSubmit: (data: ActivityData) => Promise<void>;
  initialData?: ActivityData;
  babyId: string;
}

export const ActivityForm: React.FC<ActivityFormProps> = ({
  type,
  onSubmit,
  initialData,
  babyId,
}) => {
  const [formData, setFormData] = useState<ActivityData>(initialData || {});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = () => {
    const newErrors: FormErrors = {};
    // Validação específica por tipo
    return newErrors;
  };

  const handleSubmit = async () => {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      // Show success toast
    } catch (err) {
      // Show error toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 p-4">
      {/* Form fields específicos por tipo */}
      <Button label="Salvar" onPress={handleSubmit} loading={loading} />
    </ScrollView>
  );
};
```

---

## 🎨 Design System

### Cores (design tokens)

```tsx
// src/constants/colors.ts
export const colors = {
  primary: '#3B82D4',
  secondary: '#7C5CD8',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2328',
    900: '#111827',
  },
};
```

### Tipografia

```tsx
// src/constants/typography.ts
export const typography = {
  h1: 'text-3xl font-bold',
  h2: 'text-2xl font-bold',
  h3: 'text-xl font-semibold',
  body: 'text-base font-normal',
  caption: 'text-sm font-normal text-gray-600',
};
```

### Espaçamento

```tsx
// Usar Tailwind direto
className="p-4"     // padding
className="m-2"     // margin
className="gap-4"   // gap em flex
```

---

## 📐 Padrões de Código

### 1. Custom Hooks para Data Fetching

```tsx
// src/hooks/useBaby.ts
export const useBaby = (babyId: string) => {
  const [data, setData] = useState<Baby | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchBaby();
  }, [babyId]);

  const fetchBaby = async () => {
    try {
      const baby = await babyService.getBaby(babyId);
      setData(baby);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    setLoading(true);
    fetchBaby();
  };

  return { data, loading, error, refetch };
};
```

### 2. Context para Estado Global

```tsx
// src/context/AuthContext.tsx
type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Init auth on app start
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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

### 3. Service Layer para API Calls

```tsx
// src/services/baby/babyService.ts
export const babyService = {
  async getBaby(babyId: string): Promise<Baby> {
    const { data, error } = await supabase
      .from("babies")
      .select("*")
      .eq("id", babyId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateBaby(babyId: string, updates: Partial<Baby>) {
    const { data, error } = await supabase
      .from("babies")
      .update(updates)
      .eq("id", babyId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async listBabies(familyId: string): Promise<Baby[]> {
    const { data, error } = await supabase
      .from("babies")
      .select("*")
      .eq("family_id", familyId);

    if (error) throw new Error(error.message);
    return data || [];
  },
};
```

### 4. Tipos Centralizados

```tsx
// src/types/baby.types.ts
export interface Baby {
  id: string;
  family_id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  birth_date: string; // ISO 8601
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  baby_id: string;
  type: ActivityType;
  created_by: string;
  created_at: string;
  data: Record<string, any>;
}

export type ActivityType =
  | 'feeding'
  | 'sleep'
  | 'diaper'
  | 'medication'
  | 'bath'
  | 'weight'
  | 'height'
  | 'temperature'
  | 'note';
```

### 5. Validação de Formulário

```tsx
// src/utils/validators.ts
export const validators = {
  email: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  password: (password: string): { valid: boolean; errors: string[] } => {
    const errors = [];
    if (password.length < 8) errors.push("Mínimo 8 caracteres");
    if (!/[A-Z]/.test(password)) errors.push("Mínimo 1 letra maiúscula");
    if (!/[0-9]/.test(password)) errors.push("Mínimo 1 número");
    if (!/[!@#$%^&*]/.test(password)) errors.push("Mínimo 1 caractere especial");

    return { valid: errors.length === 0, errors };
  },

  babyName: (name: string): boolean => {
    return name.length >= 2 && name.length <= 50;
  },
};
```

---

## 🧪 Padrão de Testes

### Unit Test

```tsx
// tests/validators.test.ts
import { validators } from '@/utils/validators';

describe('Validators', () => {
  describe('email', () => {
    it('should validate correct email', () => {
      expect(validators.email('test@example.com')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validators.email('invalid')).toBe(false);
    });
  });

  describe('password', () => {
    it('should accept strong password', () => {
      const result = validators.password('StrongPass123!');
      expect(result.valid).toBe(true);
    });

    it('should reject weak password', () => {
      const result = validators.password('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
```

### Integration Test

```tsx
// tests/auth.integration.test.ts
import { authService } from '@/services/auth/authService';

describe('Auth Service', () => {
  it('should signup and login', async () => {
    const email = `test-${Date.now()}@example.com`;
    const password = 'TestPass123!';

    // Signup
    const { user } = await authService.signup(email, password);
    expect(user).toBeDefined();
    expect(user.email).toBe(email);

    // Login
    const { user: loginUser } = await authService.login(email, password);
    expect(loginUser.id).toBe(user.id);
  });
});
```

---

## 🚀 Checklist para Cada Feature

Use este checklist quando implementar qualquer tela/feature:

```
- [ ] Estudei o UC no PRODUCT_MAP.md
- [ ] Criei testes (unit + integration)
- [ ] Implementei service layer
- [ ] Implementei componente UI
- [ ] Integrei com estado global (Context/hooks)
- [ ] Testes passam 100%
- [ ] ESLint passa sem warnings
- [ ] TypeScript sem erros
- [ ] Testei em iOS e Android
- [ ] Testei offline (se aplicável)
- [ ] Performance checada (Perf Monitor)
- [ ] Acessibilidade revisada (Screen Reader labels)
- [ ] Nenhum console.log deixado
- [ ] Nenhum hardcoded string (i18n)
- [ ] Updated IMPLEMENTATION_CHECKLIST.md
- [ ] Updated README/docs se necessário
- [ ] Pronto para code review ✅
```

---

## 📝 Git Workflow

### Ao começar uma feature

```bash
# 1. Update main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/UC002-login

# 3. Link to PRODUCT_MAP
# (Commit message refencia o UC)
```

### Ao fazer commits

```bash
# Use conventional commits
git commit -m "feat(auth): implement login screen (UC002)"
git commit -m "test(auth): add login tests (UC002)"
git commit -m "fix(auth): handle token refresh error"
git commit -m "docs(auth): update README with login flow"
```

### Ao terminar feature

```bash
# Push
git push origin feature/UC002-login

# Create PR com template
# Title: "Implement Login Screen (UC002)"
# Description: [Copie do PRODUCT_MAP]
# Checklist: [Use checklist acima]

# After approval, merge
git merge --squash feature/UC002-login
git push origin main
```

---

## 🎓 Exemplos de Implementação Completa

### Exemplo 1: Feature Simples (Botão)

Arquivo: `src/components/ui/Button.tsx` (50 linhas)
Teste: `tests/Button.test.ts` (30 linhas)
Tempo estimado: 30 min

### Exemplo 2: Feature Média (Formulário de Login)

Arquivos:
- `src/services/auth/authService.ts` (50 linhas)
- `src/app/(auth)/login.tsx` (150 linhas)
- `src/utils/validators.ts` (30 linhas updates)

Testes:
- `tests/validators.test.ts` (40 linhas)
- `tests/auth.test.ts` (80 linhas)

Tempo estimado: 4 horas

### Exemplo 3: Feature Complexa (Dashboard)

Arquivos:
- `src/app/(app)/(dashboard)/index.tsx` (200 linhas)
- `src/components/dashboard/DashboardCard.tsx` (100 linhas)
- `src/hooks/useDashboard.ts` (60 linhas)
- `src/services/dashboard/dashboardService.ts` (80 linhas)

Testes:
- `tests/dashboard.test.ts` (150 linhas)

Tempo estimado: 12 horas

---

## 📞 Quando Pedir Ajuda

Peça um review do Bob quando:

1. **Dúvida sobre Spec:** "No UC002, quando o usuário clica em 'Esqueci a senha', o que acontece? Volta para login ou vai para outra tela?"

2. **Decisão de Arquitetura:** "Para o cache de atividades, uso Context ou AsyncStorage?"

3. **Performance Issue:** "O dashboard demora 3 segundos para carregar, como otimizo?"

4. **Security:** "Como armazenar o token de forma segura?"

5. **Testing:** "Como testo um fluxo que depende de Realtime do Supabase?"

---

**Versão:** 1.0  
**Última atualização:** 2024  
**Criado para:** Trabalho eficiente Bob + PM
