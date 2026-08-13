# 🎯 Fase 2: Onboarding

**Status:** 🚀 Em andamento  
**Duração:** Semana 3 (5 dias úteis)  
**Pré-requisito:** Fase 1 completa (autenticação funcionando)  
**Objetivo:** Usuário criar família, adicionar bebê e convidar parceiro

---

## 📋 Tasks da Fase 2

### 2.1 Context & Hooks para Família

- [ ] Criar `src/context/FamilyContext.tsx`
  - Estado: family, babies, members
  - Funções: createFamily(), joinFamily(), updateFamily()
  - Error handling
- [ ] Criar `src/hooks/useFamily.ts`
  - Hook para acessar FamilyContext
  - Hook para carregar família
- [ ] Testes de context (5-8 testes)

### 2.2 Service Layer - Família

- [ ] Criar `src/services/family/familyService.ts`
  - `createFamily(name: string)` → chama `create_family_for_user()`
  - `joinFamilyByInvite(token: string)` → chama `join_family_by_invite()`
  - `getFamily(familyId: UUID)` → select * from families
  - `updateFamily(id, updates)` → update families
- [ ] Testes de service (8-12 testes)

### 2.3 Service Layer - Bebês

- [ ] Criar `src/services/baby/babyService.ts`
  - `createBaby(babyData)` → insert into babies
  - `updateBaby(id, updates)` → update babies
  - `getBaby(id)` → select from babies
  - `listBabies(familyId)` → select all babies of family
  - `deleteBaby(id)` → soft delete ou hard delete
  - Photo upload to Supabase Storage
- [ ] Testes de service (10-15 testes)

### 2.4 Service Layer - Convites

- [ ] Criar `src/services/invite/inviteService.ts`
  - `createInvite(familyId, role)` → insert into guest_invites
  - `getInvite(token)` → select from guest_invites
  - `acceptInvite(token)` → call join_family_by_invite()
  - QR code generation (usar `qrcode` lib)
  - Link generation (formato: ninho://invite/[token])
- [ ] Testes de service (8-10 testes)

### 2.5 Types & Validators

- [ ] Criar `src/types/family.types.ts`
  ```tsx
  interface Family { id, name, created_at }
  interface Baby { id, family_id, name, birth_date, sex, photo_url }
  interface Invite { id, token, role, expires_at }
  ```
- [ ] Atualizar `src/utils/validators.ts`
  - Validar nome da família (2-100 chars)
  - Validar nome do bebê (2-50 chars)
  - Validar data de nascimento (não futura)
- [ ] Testes (5-8 testes)

### 2.6 UI Components - Onboarding Base

- [ ] Criar `src/components/onboarding/OnboardingStep.tsx`
  - Wrapper com título, descrição, botões next/skip
  - Indicador de progresso (1/3, 2/3, 3/3)
  - Animação entre steps
- [ ] Criar `src/components/onboarding/FamilyForm.tsx`
  - Campo de texto: Nome da família
  - Upload de foto (opcional)
  - Validação em tempo real
  - Erro/sucesso visual
- [ ] Criar `src/components/onboarding/BabyForm.tsx`
  - Campo: Nome do bebê
  - Picker: Gênero (Menino, Menina, Outro)
  - DatePicker: Data de nascimento
  - Upload de foto (opcional)
- [ ] Testes de UI (5-10 testes)

### 2.7 Screens - Onboarding Telas

- [ ] Criar `src/app/(onboarding)/_layout.tsx`
  - Stack navigation para onboarding screens

- [ ] Criar `src/app/(onboarding)/welcome.tsx` (Tela 1)
  - Boas-vindas
  - "Vamos começar!" button
  - Skip option (para testes)

- [ ] Criar `src/app/(onboarding)/create-family.tsx` (Tela 2)
  - Usar `FamilyForm` component
  - Chamada para `familyService.createFamily()`
  - Loading state
  - Error handling + retry

- [ ] Criar `src/app/(onboarding)/add-baby.tsx` (Tela 3)
  - Usar `BabyForm` component
  - Chamada para `babyService.createBaby()`
  - Loading state
  - Error handling + retry

- [ ] Criar `src/app/(onboarding)/invite-partner.tsx` (Tela 4)
  - Mostrar link de convite (copiável)
  - Mostrar QR code
  - Botões: "Copiar link", "Compartilhar", "QR Code", "Pular"
  - Chamada para `inviteService.createInvite()`

- [ ] Criar `src/app/(onboarding)/complete.tsx` (Tela 5)
  - Mensagem de sucesso
  - "Ir para dashboard" button

### 2.8 Navigation & Routing

- [ ] Atualizar `src/app/_layout.tsx`
  - Lógica: Se usuário autenticado mas sem família → Onboarding
  - Se usuário com família → App stack
  - Se não autenticado → Auth stack

- [ ] Testar navegação:
  - Novo usuário: Auth → Onboarding → App
  - Usuário com família: Auth → App
  - Aceitar convite: Auth → App (via deeplink)

### 2.9 Image Upload

- [ ] Configurar Supabase Storage
  - Criar bucket `avatars` (público)
  - Criar bucket `baby-photos` (público)
  - Regras de acesso apropriadas

- [ ] Criar `src/services/storage/storageService.ts`
  - `uploadBabyPhoto(file)` → upload to baby-photos/
  - `uploadAvatar(file)` → upload to avatars/
  - Path: `/[family-id]/[baby-id]/[timestamp].jpg`
  - Retornar URL pública

- [ ] Integrar com `BabyForm`
  - `expo-image-picker` para selecionar foto
  - Compressão antes de upload (500KB max)
  - Progresso de upload
  - Preview de foto

### 2.10 Testes

- [ ] Testes unitários
  - Validators (5-8)
  - Services (25-40)
  - Hooks (5-8)

- [ ] Testes de integração
  - Fluxo completo de onboarding (3-5)
  - Criação de família + bebê (2-3)
  - Upload de foto (2-3)

- [ ] Testes de UI
  - Cada screen (5-8)
  - Forms com validação (3-5)
  - Navegação entre screens (2-3)

**Total esperado:** 80-120 testes

### 2.11 Documentação

- [ ] Adicionar exemplos em `IMPLEMENTATION_GUIDE.md`
- [ ] Criar `ONBOARDING_FLOW.md` (com screenshots/figma link)
- [ ] Atualizar `PHASE_2_DETAILED.md` com implementação real

### 2.12 Testes End-to-End

- [ ] Testar fluxo completo:
  1. Novo usuário faz login
  2. Vê welcome screen
  3. Cria família
  4. Adiciona bebê
  5. Gera convite
  6. Vê dashboard vazio
  7. Partner entra pelo link

- [ ] Testar casos de erro:
  - Rede cai durante criação
  - Timeout no upload de foto
  - Validação falha

---

## 🎬 Casos de Uso da Fase 2

### UC007 - Criar Família

**Tela:** `src/app/(onboarding)/create-family.tsx`

**Fluxo:**
1. Usuário preenche nome da família
2. Faz upload de foto (opcional)
3. Clica "Próximo"
4. Service chama `create_family_for_user(name)` do Supabase
5. Função retorna family com o usuário como admin
6. Navega para próxima tela (adicionar bebê)

**Validações:**
- Nome: 2-100 caracteres
- Sem emojis ou caracteres especiais (apenas letras, números, espaços)
- Photo: JPEG/PNG, max 2MB

**Testes:**
```tsx
describe("UC007 - Criar Família", () => {
  it("should create family with valid name", () => {});
  it("should set user as admin", () => {});
  it("should reject invalid family name", () => {});
  it("should upload photo if provided", () => {});
  it("should handle network error gracefully", () => {});
});
```

---

### UC008 - Adicionar Bebê

**Tela:** `src/app/(onboarding)/add-baby.tsx`

**Fluxo:**
1. Usuário preenche dados do bebê:
   - Nome
   - Gênero
   - Data de nascimento
   - Foto (opcional)
2. Clica "Próximo"
3. Service chama `INSERT into babies`
4. Photo upload se houver
5. Navega para tela de convite

**Validações:**
- Nome: 2-50 caracteres
- Gênero: male, female, other
- Data: Não pode ser futura, mín 1950
- Photo: JPEG/PNG, max 5MB

**Cálculos Automáticos:**
- Idade em semanas/dias (na dashboard depois)
- Próxima mamada (depois na Fase 3)

**Testes:**
```tsx
describe("UC008 - Adicionar Bebê", () => {
  it("should create baby with valid data", () => {});
  it("should calculate age correctly", () => {});
  it("should upload photo if provided", () => {});
  it("should reject future birth date", () => {});
  it("should allow multiple babies", () => {});
});
```

---

### UC009 - Convidar Parceiro

**Tela:** `src/app/(onboarding)/invite-partner.tsx`

**Fluxo:**
1. Sistema gera token de convite único
2. Cria entrada em `guest_invites` com role = 'parent'
3. Gera QR code do link
4. Usuário pode:
   - Copiar link
   - Compartilhar por WhatsApp/iMessage/SMS
   - Escanear QR code (outro telefone)
   - Pular e ir direto para dashboard

**Deeplink:**
```
ninho://invite/[token]
```

**Link via Web:**
```
https://ninho.app/invite/[token]
```

**QR Code:**
- Usar biblioteca `qrcode` ou `react-native-qrcode`
- Tamanho: 200x200 pixels
- Escaneável com câmera nativa

**Testes:**
```tsx
describe("UC009 - Convidar Parceiro", () => {
  it("should generate unique token", () => {});
  it("should create guest invite in DB", () => {});
  it("should generate valid QR code", () => {});
  it("should generate shareable link", () => {});
  it("should expire invite after 30 days", () => {});
});
```

---

### UC006 - Aceitar Convite (Continuação da Fase 1)

**Tela:** Deep link do convite

**Fluxo:**
1. Usuário recebe link: `ninho://invite/[token]`
2. App abre e valida token
3. Se usuário **não autenticado**:
   - Redireciona para login/signup (Fase 1)
   - Após autenticação, completa UC006
4. Se usuário **autenticado**:
   - Chama `join_family_by_invite(token)`
   - Função atualiza profile: family_id + role
   - Redireciona para dashboard
5. Se token **inválido/expirado**:
   - Mensagem de erro
   - Opção de entrar manualmente (copy-paste token)

**Testes:**
```tsx
describe("UC006 - Aceitar Convite", () => {
  it("should accept valid invite when authenticated", () => {});
  it("should redirect to auth when not authenticated", () => {});
  it("should reject expired invite", () => {});
  it("should prevent reusing invite", () => {});
  it("should handle deeplink correctly", () => {});
});
```

---

## 📊 Schema Adições (Fase 2)

Adicionar ao `schema.sql`:

```sql
-- Helpers para Onboarding
create or replace function public.get_family_with_babies(family_id uuid)
returns json as $$
select json_build_object(
  'family', row_to_json(f),
  'babies', coalesce(json_agg(row_to_json(b)), '[]'::json)
)
from families f
left join babies b on f.id = b.family_id
where f.id = family_id
group by f.id, f.name, f.created_at;
$$ language sql stable security definer;

-- Função para gerar link de convite seguro
create or replace function public.generate_invite_link(family_id uuid, role user_role default 'parent')
returns json as $$
declare
  new_invite guest_invites%rowtype;
begin
  insert into guest_invites (family_id, scope, expires_at, created_by)
  values (family_id, role, now() + interval '30 days', auth.uid())
  returning * into new_invite;
  
  return json_build_object(
    'token', new_invite.token,
    'link', 'https://ninho.app/invite/' || new_invite.token,
    'deeplink', 'ninho://invite/' || new_invite.token,
    'expires_at', new_invite.expires_at
  );
end;
$$ language plpgsql security definer;
```

---

## 🧪 Estrutura de Testes

```
tests/
├── unit/
│   ├── family.test.ts           # 10-15 testes
│   ├── baby.test.ts             # 10-15 testes
│   ├── invite.test.ts           # 8-12 testes
│   └── onboarding-validators.test.ts  # 5-8
│
├── integration/
│   ├── onboarding-flow.test.ts  # 5-8 testes
│   └── family-creation.test.ts  # 3-5 testes
│
└── e2e/
    └── onboarding.e2e.test.ts   # 3-5 testes
```

**Total esperado:** 80-120 testes passando

---

## 📦 Dependências Necessárias

```bash
npm install \
  qrcode \
  expo-image-picker \
  react-native-share
```

---

## 🎨 UI/UX Considerações

### Fluxo Visual
```
Welcome
   ↓
Create Family (FamilyForm)
   ↓
Add Baby (BabyForm)
   ↓
Invite Partner (InviteUI)
   ↓
Complete ✅
   ↓
Dashboard
```

### Design Tokens (usar do ARCHITECTURE.md)
- Cores primárias
- Tipografia
- Espaçamento (p-4, gap-3, etc)
- Rounded corners (rounded-lg)

### Validação Visual
- ✅ Campo preenchido corretamente
- ⚠️ Campo com erro (background red-50, border red-500)
- 🔄 Carregando (spinner)
- ✨ Sucesso (toast green)

---

## 📈 Critérios de Aceite - Fase 2 Completa

- [ ] Usuário novo completa onboarding em < 3 minutos
- [ ] Família criada com admin correto
- [ ] Bebê criado com dados corretos
- [ ] Foto do bebê comprimida e armazenada
- [ ] Convite gera token único e seguro
- [ ] QR code escaneável
- [ ] Link deeplink funciona
- [ ] Outro usuário aceita convite com sucesso
- [ ] RLS permite apenas membros acessarem dados
- [ ] ESLint passa 100%
- [ ] TypeScript sem erros
- [ ] Testes: > 80% cobertura
- [ ] App não crasha
- [ ] Navegação fluida entre screens
- [ ] Offline: Onboarding funciona (depois sincroniza)

---

## 🚀 Como Começar

### Passo 1: Setup

```bash
# Adicionar dependências
npm install qrcode expo-image-picker react-native-share

# Configurar Storage no Supabase
# - Criar bucket 'baby-photos' (público)
# - Adicionar RLS policies
```

### Passo 2: Ordem de Implementação

1. **Types & Validators** (1 hora)
2. **Services** (3 horas)
3. **Contexts & Hooks** (2 horas)
4. **Components** (4 horas)
5. **Screens** (4 horas)
6. **Navigation** (1 hora)
7. **Testes** (6 horas)
8. **Polish & Bug fixes** (2 horas)

**Total estimado:** 23 horas (< 1 semana com pausas)

### Passo 3: Testes Manuais

```bash
# Em iOS Simulator
npm run dev:ios

# Novo usuário:
# 1. Signup
# 2. Complete onboarding
# 3. Vê dashboard vazio ✓

# Segundo usuário:
# 1. Signup
# 2. Aceita convite do primeiro
# 3. Vê mesma família ✓
```

---

## ✅ Checklist para Completar Fase 2

- [ ] Todos os 80-120 testes passam
- [ ] ESLint sem warnings
- [ ] TypeScript sem errors
- [ ] App roda em iOS simulator
- [ ] App roda em Android emulator
- [ ] Fluxo novo usuário completo
- [ ] Fluxo convite funciona
- [ ] QR code testa e funciona
- [ ] Fotos upload e exibem
- [ ] PR aberto com todas mudanças
- [ ] Code review completo
- [ ] Merge para main
- [ ] IMPLEMENTATION_CHECKLIST.md atualizado

---

## 📝 Notas Importantes

- **Photo Upload:** Usar `expo-image-picker` para selecionar, não câmera
- **Compressão:** Comprimir foto antes de upload (500KB max)
- **Erro:** Se upload falhar, permitir continuar sem foto
- **QR Code:** Usar biblioteca `qrcode`, gerar SVG para melhor qualidade
- **Deeplinks:** Configurar no `app.json` (Expo)
- **Realtime:** Não necessário nesta fase (Fase 6)

---

**Início:** Segunda de Semana 3  
**Deadline:** Sexta 18h da Semana 3  
**Responsável:** Dev  
**PM:** Daily review
