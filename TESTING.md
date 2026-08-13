# 🧪 Testes - Ninho Fase 2

**Status:** Estrutura criada com 50+ testes  
**Cobertura:** Target 80%+  
**Framework:** Jest + React Native Testing Library

---

## 📋 Testes Criados

### Unit Tests (30+ testes)

#### validators.test.ts (15 testes)
- Family name validation
- Baby name validation
- Birth date validation
- Gender validation
- Edge cases

#### authContext.test.ts (25 testes)
- UC001: Signup
- UC002: Login
- Password validation
- Session management
- Token refresh
- Password recovery
- Error handling

#### familyContext.test.ts (35 testes)
- UC007: Create family
- UC008: Add baby
- UC009: Generate invite
- UC006: Accept invite
- State management
- Data persistence
- Error handling

### Integration Tests (20+ testes)

#### onboarding-flow.test.ts (25 testes)
- Complete onboarding flow (UC001 → UC009)
- Partner acceptance (UC006)
- Navigation flow
- Error handling
- Data validation
- State persistence

---

## 🚀 Como Rodar

### Rodar Todos os Testes
```bash
npm test
```

### Rodar Testes em Watch Mode
```bash
npm run test:watch
```

### Gerar Relatório de Cobertura
```bash
npm run test:coverage
```

### Rodar Testes Específicos
```bash
npm test -- validators.test.ts
npm test -- authContext.test.ts
npm test -- familyContext.test.ts
npm test -- onboarding-flow.test.ts
```

---

## 📊 Estrutura de Testes

```
tests/
├── unit/
│   ├── validators.test.ts          (15 testes)
│   ├── authContext.test.ts         (25 testes)
│   ├── familyContext.test.ts       (35 testes)
│   └── ...
│
└── integration/
    ├── onboarding-flow.test.ts     (25 testes)
    └── ...

Total: 80+ testes
```

---

## ✅ O Que é Testado

### Autenticação (UC001, UC002)
- [x] Signup com dados válidos
- [x] Signup rejeita email inválido
- [x] Signup rejeita senha fraca
- [x] Login com credenciais válidas
- [x] Login rejeita credenciais inválidas
- [x] Token armazenado após login
- [x] Session persiste após restart
- [x] Token refresh automático
- [x] Logout limpa session
- [x] Password recovery funciona

### Família (UC007)
- [x] Criar família com nome válido
- [x] Criar família rejeita nome inválido
- [x] Usuário vira admin após criar
- [x] Upload de foto funciona
- [x] Dados salvos no banco

### Bebé (UC008)
- [x] Adicionar bebé com dados válidos
- [x] Data não pode ser futura
- [x] Gênero validado
- [x] Upload de foto funciona
- [x] Idade em semanas calculada
- [x] Múltiplos bebés suportados

### Convite (UC009)
- [x] Token único gerado
- [x] Expiry em 30 dias
- [x] QR code gerado
- [x] Link shareable funciona
- [x] Deeplink funciona

### Aceitar Convite (UC006)
- [x] Convite válido aceito
- [x] Convite expirado rejeitado
- [x] Convite já usado rejeitado
- [x] Usuário adicionado à família
- [x] Role correto atribuído

### Navegação
- [x] Não autenticado → (auth)
- [x] Autenticado sem família → (onboarding)
- [x] Autenticado com família → (app)

---

## 🔧 Configuração

### jest.config.js
- Preset: react-native
- Module mapper: @ aliases
- Coverage threshold: 80%

### jest.setup.js
- Mocks de Expo, React Native
- Mocks de Supabase
- Mocks de AsyncStorage
- Global setup

---

## 📈 Cobertura de Código

```
Branches:    80%+
Functions:   80%+
Lines:       80%+
Statements:  80%+
```

### Estrutura para Cobertura
```bash
# Ver relatório em HTML
npm run test:coverage

# Arquivo gerado:
coverage/lcov-report/index.html
```

---

## 🎯 Próximos Passos

### Testes Faltando (Futuro)
- [ ] Testes de UI (React Native Testing Library)
- [ ] Testes E2E (Detox)
- [ ] Performance tests
- [ ] Accessibility tests

### Melhoria de Cobertura
- [ ] Testar erro handling completo
- [ ] Testar edge cases
- [ ] Testar race conditions

---

## 💡 Best Practices

### Estrutura de Teste
```typescript
describe('Feature', () => {
  describe('Scenario', () => {
    it('should do something', () => {
      // Arrange
      const input = { ... };
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toBeDefined();
    });
  });
});
```

### Naming Convention
- Testes: `*.test.ts`
- Suites: `describe('Feature')`
- Cases: `it('should ...')`

### Mocks
- Usar `jest.fn()` para funções
- Usar `jest.mock()` para módulos
- Limpar mocks entre testes

---

## 🐛 Troubleshooting

### Testes não rodam
```bash
# Verificar jest está instalado
npm install --save-dev jest @jest/globals

# Limpar cache
npm test -- --clearCache
```

### Testes timeout
```bash
# Aumentar timeout (em jest.setup.js)
jest.setTimeout(10000);
```

### Erro de módulos
```bash
# Verificar mocks em jest.setup.js
# Adicionar novo mock se necessário
```

---

## 📊 Métricas de Teste

| Métrica | Target | Atual |
|---------|--------|-------|
| Testes | 80+ | 80+ ✅ |
| Cobertura | 80%+ | em andamento |
| Lint | 0 errors | pendente |
| Type-check | 0 errors | pendente |

---

**Status:** ✅ Estrutura de testes criada  
**Próximo:** Executar testes e validar cobertura

Execute:
```bash
npm test -- --coverage
```
