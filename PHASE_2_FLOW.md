# 🎨 Fluxo Visual de Onboarding - Fase 2

```
┌─────────────────────────────────────────────────────────────┐
│ NOVO USUÁRIO - FLUXO COMPLETO                               │
└─────────────────────────────────────────────────────────────┘

1️⃣  SPLASH SCREEN (Fase 1)
    Logo Ninho
    Loading...
    ↓ 2-3 segundos

2️⃣  AUTH FLOW (Fase 1)
    Login / Signup / Google / Apple
    ✅ Usuário criado em auth.users
    ✅ Profile criado automaticamente (trigger)
    ✅ Token salvo em Keychain
    ↓

3️⃣  WELCOME SCREEN (Fase 2 - Tela 1)
    ┌─────────────────────────────┐
    │  👋 Bem-vindo ao Ninho!    │
    │                             │
    │  Vamos começar sua          │
    │  jornada com seu bebê       │
    │                             │
    │  [Começar]  [Pular]        │
    └─────────────────────────────┘
    ↓ "Começar"

4️⃣  CREATE FAMILY (Fase 2 - Tela 2)
    ┌─────────────────────────────┐
    │  📝 Dados da Família        │
    │                             │
    │  Nome da Família            │
    │  ┌──────────────────────┐   │
    │  │ Ex: Família Silva   │   │
    │  └──────────────────────┘   │
    │                             │
    │  📷 Foto (opcional)         │
    │  ┌──────────────────────┐   │
    │  │  + Selecionar foto  │   │
    │  └──────────────────────┘   │
    │                             │
    │      [Próximo]              │
    └─────────────────────────────┘
    
    🔄 BACKEND:
       - Validação de nome
       - Photo upload (se houver)
       - INSERT into families
       - UPDATE profiles: family_id + role='admin'
    ↓

5️⃣  ADD BABY (Fase 2 - Tela 3)
    ┌─────────────────────────────┐
    │  👶 Primeiro Bebê           │
    │                             │
    │  Nome                       │
    │  ┌──────────────────────┐   │
    │  │ Ex: João           │   │
    │  └──────────────────────┘   │
    │                             │
    │  Gênero                     │
    │  ◯ Menino  ◯ Menina  ◯Outro│
    │                             │
    │  Data de Nascimento         │
    │  ┌──────────────────────┐   │
    │  │ 15 / 12 / 2024     │   │
    │  └──────────────────────┘   │
    │                             │
    │  📷 Foto (opcional)         │
    │  ┌──────────────────────┐   │
    │  │  + Selecionar foto  │   │
    │  └──────────────────────┘   │
    │                             │
    │      [Próximo]              │
    └─────────────────────────────┘
    
    🔄 BACKEND:
       - Validação de dados
       - Photo upload (se houver, comprimir)
       - INSERT into babies
    ↓

6️⃣  INVITE PARTNER (Fase 2 - Tela 4)
    ┌─────────────────────────────┐
    │  💌 Convidar Parceiro       │
    │                             │
    │  Compartilhe este link:     │
    │                             │
    │  🔗 ninho.app/invite/abc123 │
    │     [Copiar]                │
    │                             │
    │  Ou escaneie o QR Code:     │
    │  ┌──────────────────────┐   │
    │  │   ▄▄▄▄▄▄▄▄▄▄▄▄    │   │
    │  │   █ ▄▄▄▄▄ █       │   │
    │  │   █ █   █ █       │   │
    │  │   █ █▀▀▀ █       │   │
    │  │   █ ▄▄▄▄▄ █       │   │
    │  │   ▀▀▀▀▀▀▀▀▀▀▀▀    │   │
    │  │                    │   │
    │  │   [Compartilhar]   │   │
    │  │   [Ver QR Code]    │   │
    │  │   [Pular]          │   │
    │  └──────────────────────┘   │
    └─────────────────────────────┘
    
    🔄 BACKEND:
       - Gerar token único (UUID)
       - INSERT into guest_invites
       - set expires_at = now() + 30 days
       - Retornar link + QR code
    
    ✅ Se "Compartilhar":
       - Abre Share Sheet (WhatsApp, iMessage, SMS, etc)
    
    ✅ Se "Próximo" ou "Pular":
       ↓

7️⃣  COMPLETE (Fase 2 - Tela 5)
    ┌─────────────────────────────┐
    │                             │
    │        ✅ Tudo pronto!      │
    │                             │
    │  Sua família está criada    │
    │  e seu bebê foi registrado  │
    │                             │
    │                             │
    │  [Ir para Dashboard]        │
    └─────────────────────────────┘
    ↓

8️⃣  DASHBOARD (Fase 3)
    Próximas fases implementam dashboard
    ↓

═══════════════════════════════════════════════════════════════

PARTNER - FLUXO DE CONVITE

1️⃣  RECEBE LINK/QR
    - WhatsApp: "Entra na nossa família Ninho!"
    - Link: ninho.app/invite/abc123
    - QR: Escaneia com câmera
    ↓

2️⃣  CLICA NO LINK
    - Se app instalado: Deeplink ninho://invite/abc123
    - Se não: Web ninho.app/invite/abc123
    ↓

3️⃣  APP VALIDA TOKEN
    
    IF token inválido/expirado:
        ❌ "Link expirado ou inválido"
        [Voltar] ou [Entrar manualmente]
    
    IF token válido E usuário não autenticado:
        → Ir para tela de Login/Signup
        → Após auth, completar aceitar convite
    
    IF token válido E usuário autenticado:
        → Aceitar convite diretamente
    ↓

4️⃣  ACEITAR CONVITE
    
    🔄 BACKEND:
       - Validar token em guest_invites
       - UPDATE profiles:
         * family_id = [convite.family_id]
         * role = [convite.role] (default: 'parent')
       - UPDATE guest_invites:
         * used_by = [perfil_id]
       - Se sucesso: retornar família
    ↓

5️⃣  REDIRECIONADO AO DASHBOARD
    ✅ Agora faz parte da mesma família!
    ✅ Vê o mesmo bebê
    ✅ Vê os mesmos registros
    ✅ Pode criar/editar dados

═══════════════════════════════════════════════════════════════

DADOS NO BANCO APÓS ONBOARDING

Tabela: families
┌────────────────────────────────┐
│ id    | name             │
├────────────────────────────────┤
│ f-123 | Família Silva    │
└────────────────────────────────┘

Tabela: profiles
┌─────────────────────────────────────────────┐
│ id    | user_id  | family_id | role        │
├─────────────────────────────────────────────┤
│ p-1   | auth-u1  | f-123     | admin       │
│ p-2   | auth-u2  | f-123     | parent      │
└─────────────────────────────────────────────┘

Tabela: babies
┌──────────────────────────────────────────────────────┐
│ id    | family_id | name | birth_date | photo_url    │
├──────────────────────────────────────────────────────┤
│ b-1   | f-123     | João | 2024-12-15 | /photos/... │
└──────────────────────────────────────────────────────┘

Tabela: guest_invites
┌───────────────────────────────────────────────────┐
│ id  | family_id | token | scope  | used_by | ... │
├───────────────────────────────────────────────────┤
│ gi-1| f-123     | abc123| parent | p-2     | ... │
└───────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════

COMPONENTES A CRIAR

OnboardingStep.tsx (Wrapper)
  ├─ title: string
  ├─ description: string
  ├─ children: ReactNode
  ├─ onNext: () => void
  ├─ onSkip?: () => void
  ├─ isLoading?: boolean
  └─ step: number (1-5)

FamilyForm.tsx
  ├─ onSubmit: (name, photo) => void
  ├─ isLoading: boolean
  └─ error?: string

BabyForm.tsx
  ├─ onSubmit: (baby) => void
  ├─ isLoading: boolean
  └─ error?: string

InviteUI.tsx
  ├─ familyId: UUID
  ├─ link: string
  ├─ qrCode: SVG
  ├─ onCopy: () => void
  ├─ onShare: () => void
  └─ onComplete: () => void

═══════════════════════════════════════════════════════════════

RESUMO DE ESTADO

Contexto: FamilyContext
{
  family: {
    id: UUID
    name: string
  } | null
  
  babies: Baby[]
  
  members: Profile[]
  
  loading: boolean
  error: string | null
  
  createFamily: (name) => Promise<Family>
  addBaby: (baby) => Promise<Baby>
  joinFamily: (token) => Promise<void>
}

═══════════════════════════════════════════════════════════════
```

## 📱 Screens em Detalhes

### Screen 1: Welcome
- Apenas introductório
- Próximo ou Pular

### Screen 2: Create Family
- FamilyForm (nome + foto)
- Loading while creating
- Error handling com retry

### Screen 3: Add Baby
- BabyForm (nome, gênero, data, foto)
- Date picker nativo
- Error handling com retry

### Screen 4: Invite Partner
- Mostrar link (copiável)
- Mostrar QR code
- Share button
- Skip option

### Screen 5: Complete
- Success message
- Go to dashboard button

## 🔄 Fluxos de Erro

### Rede cai
```
[Próximo] → ❌ Erro de conexão
[Tentar Novamente] → OK
```

### Foto muito grande
```
Selecionar foto → ❌ "Máximo 2MB"
[Tentar outra]
```

### Nome inválido
```
Nome: "123" → ❌ "Nome inválido"
Mostrar feedback em tempo real
```

## ✅ Validações em Tempo Real

- Nome da família: não vazio, 2-100 chars
- Nome do bebê: não vazio, 2-50 chars
- Data: não futura, formato válido
- Foto: JPEG/PNG, max 2-5MB

---

**Próximo:** Implementação no código fonte
