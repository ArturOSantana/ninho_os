# 🎯 FASE 2: ONBOARDING - INICIADA

**Status:** 🚀 **Pronta para Implementação**  
**Duração:** Semana 3 (próxima semana)  
**Preparação:** 100% Documentação + 40% Código Base

---

## 📄 O que foi Criado

### Documentação
- ✅ **PHASE_2_DETAILED.md** (14 KB)
  - 12 tasks estruturadas
  - 3 UCs (UC007, UC008, UC009)
  - Schema de banco SQL
  - Testes estruturados
  - Critérios de aceite

- ✅ **PHASE_2_FLOW.md** (8 KB)
  - Fluxo visual ASCII do onboarding
  - Diagrama de estados
  - Validações e erros
  - Estrutura de dados final
  - Componentes e endpoints

### Código Base
- ✅ `src/types/common.types.ts` - Tipos base (UUID, AsyncState, etc)
- ✅ `src/types/family.types.ts` - Tipos de família (Family, Baby, Profile, Invite)
- ✅ `src/types/index.ts` - Índice de tipos
- ✅ `src/services/family/familyService.ts` - 10 funções prontas

---

## 🔧 Funções Implementadas (familyService.ts)

```typescript
✓ createFamily()        - UC007: Criar família com admin
✓ getFamily()           - Buscar dados da família
✓ updateFamily()        - Atualizar família
✓ createBaby()          - UC008: Criar bebê
✓ getBaby()             - Buscar bebê
✓ listBabies()          - Listar bebês da família
✓ updateBaby()          - Atualizar bebê
✓ createInviteLink()    - UC009: Gerar token + link + QR
✓ acceptInvite()        - UC006: Aceitar convite
✓ uploadBabyPhoto()     - Upload e compressão
```

---

## 📋 Próximos Passos - Ordem Exata

### Passo 1: Dependências (15 min)
```bash
npm install qrcode expo-image-picker react-native-share
```

### Passo 2: Configurar Supabase Storage (20 min)
- Criar bucket `ninho-storage` (público)
- Adicionar RLS policies
- Testar upload de arquivo

### Passo 3: FamilyContext & Hooks (2 horas)
```
src/context/FamilyContext.tsx
  └─ Gerencia: family, babies, members, loading, error
  └─ Actions: createFamily, addBaby, joinFamily, etc

src/hooks/useFamily.ts
  └─ Hook para acessar FamilyContext
  └─ Validação de estado
```

### Passo 4: UI Components (4 horas)
```
src/components/onboarding/
  ├─ OnboardingStep.tsx
  ├─ FamilyForm.tsx
  ├─ BabyForm.tsx
  └─ InviteUI.tsx
```

### Passo 5: Screens (4 horas)
```
src/app/(onboarding)/
  ├─ _layout.tsx
  ├─ welcome.tsx
  ├─ create-family.tsx
  ├─ add-baby.tsx
  ├─ invite-partner.tsx
  └─ complete.tsx
```

### Passo 6: Navigation (1 hora)
- Atualizar `src/app/_layout.tsx`
- Lógica: Não autenticado → Auth → Sem família → Onboarding → App

### Passo 7: Testes (6 horas)
- Unit tests (25 tests)
- Integration tests (8 tests)
- UI tests (5 tests)

### Passo 8: Polish (2 horas)
- Bug fixes
- Validações faltantes
- Performance checks

**Total: ~23 horas = ~1 semana com pausas**

---

## ✅ Checklist para Começar

Antes de iniciar Passo 2, verificar:

- [ ] Fase 1 (Autenticação) 100% funcionando
- [ ] Login/Signup/Google/Apple funcionam
- [ ] AuthContext e useAuth hooks funcionam
- [ ] Profiles criadas automaticamente após signup
- [ ] Tokens armazenados seguramente
- [ ] npm install qrcode expo-image-picker react-native-share
- [ ] Supabase Storage bucket criado
- [ ] SUPABASE_URL e SUPABASE_ANON_KEY em .env

---

## 📊 Métricas da Fase 2

| Métrica | Meta | Status |
|---------|------|--------|
| Documentos | 2 | ✅ 2/2 |
| Arquivos TS criados | 8+ | ✅ 4/8 |
| Funções de API | 10+ | ✅ 10/10 |
| Screens | 5 | ⏳ 0/5 |
| Components | 4 | ⏳ 0/4 |
| Testes | 80+ | ⏳ 0/80+ |
| Cobertura | >80% | ⏳ 0% |

---

## 🎯 Casos de Uso Covered

### UC007 - Criar Família
- Usuário preenche nome
- Faz upload de foto (opcional)
- Sistema cria família e define user como admin
- ✅ Implementado: `familyService.createFamily()`

### UC008 - Adicionar Bebê
- Usuário preenche: nome, gênero, data nascimento, foto
- Sistema valida data (não futura)
- Upload de foto com compressão
- ✅ Implementado: `familyService.createBaby()`

### UC009 - Convidar Parceiro
- Sistema gera token único
- Cria entry em guest_invites
- Gera QR code + link
- Usuário compartilha
- ✅ Implementado: `familyService.createInviteLink()`

### UC006 - Aceitar Convite (Continuação)
- Usuário clica em link/QR
- Se autenticado, aceita direto
- Se não, faz login/signup primeiro
- ✅ Implementado: `familyService.acceptInvite()`

---

## 🚀 Iniciar Fase 2

### Comando para começar

```bash
# 1. Instalar dependências
npm install qrcode expo-image-picker react-native-share

# 2. Criar primeiro arquivo (Passo 3)
touch src/context/FamilyContext.tsx

# 3. Começar implementação
npm run dev:ios
# ou
npm run dev:android
```

### Referências Rápidas
- Documentação: Ver `PHASE_2_DETAILED.md` e `PHASE_2_FLOW.md`
- Tipos: Ver `src/types/family.types.ts`
- Service: Ver `src/services/family/familyService.ts`
- Padrões: Ver `IMPLEMENTATION_GUIDE.md`

---

## 📚 Documentos Disponíveis

| Documento | Leia se | Tempo |
|-----------|---------|-------|
| PHASE_2_DETAILED.md | Quer entender tasks | 30 min |
| PHASE_2_FLOW.md | Quer ver fluxo visual | 15 min |
| PRODUCT_MAP.md §2 | Quer ver specs de negócio | 20 min |
| ARCHITECTURE.md | Quer ver padrões código | 20 min |
| IMPLEMENTATION_GUIDE.md | Quer exemplos de código | 30 min |

---

## 🎓 Estrutura Esperada Final

```
Após Fase 2 Completa:

Novo Usuário
  ↓ [Login/Signup]
  ↓ [Welcome Screen]
  ↓ [Create Family] ← UC007
  ↓ [Add Baby] ← UC008
  ↓ [Invite Partner] ← UC009
  ↓ [Complete]
  ✅ Vai para Dashboard (Fase 3)

Partner
  ↓ [Clica em link/QR]
  ↓ [Se não autenticado: Login/Signup]
  ↓ [Aceita Convite] ← UC006
  ✅ Entra na mesma família

Banco de Dados:
  - 1 Family criada
  - 2 Profiles (admin + parent)
  - 1 Baby criado
  - 1 Invite token consumido
  - Fotos comprimidas no Storage
```

---

## ⏰ Timeline Recomendada

| Dia | O que fazer | Tempo |
|-----|------------|-------|
| Seg | Passo 1-2: Deps + Storage | 0.5h |
| Seg | Passo 3: FamilyContext | 2h |
| Ter | Passo 4: UI Components | 4h |
| Qua | Passo 5: Screens | 4h |
| Qui | Passo 6-7: Nav + Testes | 7h |
| Sex | Passo 8: Polish + Deploy | 2h |
| **Total** | | **19.5h** |

---

## ✨ Diferencial Desta Abordagem

✅ **Documentação completa** - Nenhuma ambiguidade  
✅ **Código base pronto** - 40% já feito  
✅ **Tipos TypeScript** - Zero `any`, 100% type-safe  
✅ **Testes estruturados** - Não ad-hoc  
✅ **Padrões consistentes** - Services, Hooks, Context  
✅ **Fluxo visual** - Entender tudo em 5 minutos  

---

**Pronto para começar? Vá para Passo 3: FamilyContext! 🚀**
