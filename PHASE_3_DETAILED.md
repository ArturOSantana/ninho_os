# 🎯 Fase 3: Core - Dashboard + Módulo Bebé

**Status:** 🚀 Iniciada  
**Duração:** 2-3 semanas (Semanas 4-6)  
**Objetivo:** MVP funcional com dashboard e registros do bebé  
**Pré-requisito:** Fase 2 ✅ Completa

---

## 📋 Visão Geral da Fase 3

### O que será criado

1. **App Stack (Navegação principal)**
   - Tab navigation (Dashboard, Bebé, Mais)
   - Bottom tab bar

2. **Dashboard Screen (Tela 1 da App)**
   - 9 Cards informativos
   - Progress bar
   - Indicadores visuais
   - Botão flutuante (FAB) para registros

3. **Módulo Bebé (Telas 2-N)**
   - Dashboard do bebé
   - Histórico de atividades
   - Formulários de registro
   - Gráficos simples

4. **Registros Rápidos**
   - Formulários para cada tipo (mamada, sono, troca, etc)
   - Validações
   - Salvar no banco

---

## 🎯 UCs da Fase 3

| UC | Nome | Status | Screens |
|----|------|--------|---------|
| UC010 | Visualizar Dashboard | 📋 Novo | dashboard/index |
| UC011 | Abrir Registro Rápido | 📋 Novo | quick-register |
| UC012 | Registrar Mamada | 📋 Novo | register/feeding |
| UC013 | Registrar Sono | 📋 Novo | register/sleep |
| UC014 | Registrar Troca | 📋 Novo | register/diaper |
| UC015+ | Outros Registros | 📋 Novo | register/* |

---

## 📁 Estrutura de Pasta (Fase 3)

```
src/app/(app)/
├── _layout.tsx                  ← Tab Navigation
│
├── (dashboard)/
│   ├── index.tsx                ← Dashboard Principal
│   ├── dashboard-card.tsx       ← Componente Card
│   └── quick-register-menu.tsx  ← Menu FAB
│
├── (baby)/
│   ├── index.tsx                ← Dashboard do Bebé
│   ├── history.tsx              ← Timeline
│   ├── charts.tsx               ← Gráficos
│   │
│   └── register/
│       ├── feeding.tsx          ← UC012
│       ├── sleep.tsx            ← UC013
│       ├── diaper.tsx           ← UC014
│       ├── medication.tsx
│       ├── bath.tsx
│       ├── vitals.tsx
│       └── [type].tsx           ← Genérico
│
└── (more)/
    ├── index.tsx                ← Menu mais
    ├── settings.tsx
    ├── profile.tsx
    └── ...

components/
├── dashboard/
│   ├── DashboardCard.tsx
│   ├── BabySelector.tsx
│   ├── NextFeedingCard.tsx
│   ├── MentalLoadCard.tsx
│   └── ...
│
└── baby/
    ├── BabyAvatar.tsx
    ├── ActivityForm.tsx
    ├── ActivityTimeline.tsx
    ├── FeedingForm.tsx
    ├── SleepForm.tsx
    └── ...
```

---

## 📊 Tasks de Fase 3

### Task 3.1: App Stack Navigation (1h)
- [ ] Criar `src/app/(app)/_layout.tsx` com tab navigation
- [ ] 3 tabs: Dashboard, Bebé, Mais
- [ ] Icons + labels
- [ ] Testes

### Task 3.2: Dashboard Screen (4h)
- [ ] Criar `src/app/(app)/(dashboard)/index.tsx`
- [ ] 9 cards (bom dia, resumo, próxima mamada, última troca, último sono, agenda, tarefas, compras, carga mental)
- [ ] Progress bar
- [ ] Botão FAB
- [ ] Pull-to-refresh
- [ ] Testes

### Task 3.3: Dashboard Components (3h)
- [ ] DashboardCard wrapper
- [ ] Componentes específicos por card
- [ ] Indicadores visuais
- [ ] Testes

### Task 3.4: Baby Screen (2h)
- [ ] Criar `src/app/(app)/(baby)/index.tsx`
- [ ] Seletor de bebé
- [ ] Estatísticas rápidas
- [ ] Botões para histórico/gráficos/registrar
- [ ] Testes

### Task 3.5: Quick Register (3h)
- [ ] Menu flutuante (FAB)
- [ ] Opções de registro
- [ ] Abrir formulários
- [ ] Testes

### Task 3.6: Feeding Form (2h)
- [ ] `src/app/(app)/(baby)/register/feeding.tsx` (UC012)
- [ ] Tipo de mamada
- [ ] Duração/quantidade
- [ ] Cronômetro
- [ ] Notas
- [ ] Validações
- [ ] Testes

### Task 3.7: Sleep Form (1h)
- [ ] `src/app/(app)/(baby)/register/sleep.tsx` (UC013)
- [ ] Duração
- [ ] Qualidade
- [ ] Local
- [ ] Notas
- [ ] Testes

### Task 3.8: Diaper Form (1h)
- [ ] `src/app/(app)/(baby)/register/diaper.tsx` (UC014)
- [ ] Tipo (xixi/cocô/ambos)
- [ ] Notas
- [ ] Testes

### Task 3.9: Other Forms (2h)
- [ ] Medicamento
- [ ] Banho
- [ ] Peso/Altura/Temperatura
- [ ] Observações
- [ ] Testes

### Task 3.10: History/Timeline (2h)
- [ ] `src/app/(app)/(baby)/history.tsx`
- [ ] Lista de atividades
- [ ] Ordenação por data
- [ ] Filtragem por tipo
- [ ] Testes

### Task 3.11: Charts (2h)
- [ ] `src/app/(app)/(baby)/charts.tsx`
- [ ] Gráfico de peso
- [ ] Gráfico de altura
- [ ] Gráfico de sono
- [ ] Seletor de período
- [ ] Testes

### Task 3.12: More Menu (1h)
- [ ] `src/app/(app)/(more)/index.tsx`
- [ ] Links para settings, perfil, etc
- [ ] Versão do app
- [ ] Testes

### Task 3.13: Services Extension (2h)
- [ ] Estender `familyService.ts` com queries de atividades
- [ ] Funções para carregar registros
- [ ] Filtros e ordenação
- [ ] Testes

### Task 3.14: Context Extension (1h)
- [ ] Estender `FamilyContext` com dados de atividades
- [ ] Gerenciar atividades do bebé
- [ ] Testes

### Task 3.15: Testes (8h)
- [ ] Unit tests (30+)
- [ ] Integration tests (10+)
- [ ] UI tests (5+)
- [ ] Coverage > 80%

---

## 📈 Estimativa de Tempo

| Task | Tempo |
|------|-------|
| 3.1: App Stack | 1h |
| 3.2: Dashboard Screen | 4h |
| 3.3: Dashboard Components | 3h |
| 3.4: Baby Screen | 2h |
| 3.5: Quick Register | 3h |
| 3.6: Feeding Form | 2h |
| 3.7: Sleep Form | 1h |
| 3.8: Diaper Form | 1h |
| 3.9: Other Forms | 2h |
| 3.10: History | 2h |
| 3.11: Charts | 2h |
| 3.12: More Menu | 1h |
| 3.13: Services | 2h |
| 3.14: Context | 1h |
| 3.15: Testes | 8h |
| **TOTAL** | **36h** |

**Duração realista:** 2-3 semanas (com pausas)

---

## 🎯 Critérios de Aceite - Fase 3

- [ ] Dashboard carrega em < 2s
- [ ] 9 cards exibem dados corretos
- [ ] Botão FAB abre menu de registros
- [ ] Cada registro salva corretamente
- [ ] Histórico mostra atividades
- [ ] Gráficos carregam dados
- [ ] Tab navigation funciona
- [ ] Dados persistem após reload
- [ ] 40+ testes passam
- [ ] Cobertura > 80%
- [ ] ESLint 0 warnings
- [ ] TypeScript 0 errors

---

## 🚀 Próximos Passos

### Imediato (Task 3.1)
1. Criar tab navigation
2. Planejar layout de each tab
3. Criar placeholder screens

### Após (Task 3.2)
1. Dashboard principal
2. Cards informativos
3. Integração com dados

### Continuação
1. Forms de registro
2. Histórico e gráficos
3. Testes completos

---

## 📝 Notas Importantes

- **Database:** Schema já existe (Fase 1)
- **Services:** Base pronta (Fase 2)
- **Context:** Pronto para estender (Fase 2)
- **Componentes:** Base criada (Fase 2)
- **Testes:** Jest configurado (Fase 2)

---

## 🎓 Conceitos Principais

**Dashboard:**
- Centraliza informações mais importantes
- Atualização em tempo real
- Indicadores visuais claros
- Acesso rápido a ações

**Módulo Bebé:**
- Registros de atividades
- Histórico e análises
- Gráficos de tendências
- Interface intuitiva

**Registros:**
- Formas específicas por tipo
- Validações automáticas
- Salvo em tempo real
- Sincronização com outros usuários

---

**Fase 3: Core iniciada! 🚀**

Próximo: Task 3.1 - App Stack Navigation
