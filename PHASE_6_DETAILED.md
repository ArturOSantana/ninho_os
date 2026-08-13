# ⚖️ Fase 6: Diferencial — Carga Mental + Notificações + IA Insights

**Status:** 🚀 Iniciada  
**Duração:** 2 semanas (Semanas 10-11)  
**Objetivo:** Funcionalidades diferenciadoras que tornam o Ninho único no mercado  
**Pré-requisito:** Fase 5 ✅ Completa

---

## 📋 Visão Geral da Fase 6

### O que será criado

1. **Módulo Carga Mental** — UC024, UC025, UC026  
   - Pontuação automática de atividades por membro
   - Visualização de equilíbrio entre parceiros
   - Histórico semanal e mensal
   - Insights automáticos sobre desbalanceamento

2. **Módulo Notificações** — UC (novo)  
   - Central de notificações in-app
   - Push notifications via Expo
   - Preferências por tipo de notificação
   - Horário silencioso

3. **Módulo IA Insights** — (futuro/preview)  
   - Resumo semanal automático
   - Detecção de padrões de sono/alimentação
   - Alertas inteligentes
   - Cards de insight no Dashboard

---

## 🎯 UCs da Fase 6

| UC | Nome | Módulo | Telas |
|----|------|--------|-------|
| UC024 | Visualizar equilíbrio de carga mental | Carga Mental | (mental-load)/index |
| UC025 | Visualizar histórico de carga mental | Carga Mental | (mental-load)/history |
| UC026 | Visualizar insight automático | Carga Mental | (mental-load)/insights |

---

## 📁 Estrutura de Pastas (Fase 6)

```
src/app/(app)/
├── (mental-load)/
│   ├── _layout.tsx
│   ├── index.tsx          ← UC024: Resumo e equilíbrio
│   ├── history.tsx        ← UC025: Histórico semanal/mensal
│   └── insights.tsx       ← UC026: Insights automáticos
│
└── (notifications)/
    ├── _layout.tsx
    ├── index.tsx          ← Central de notificações
    └── preferences.tsx    ← Preferências por tipo

src/services/
├── mental-load/
│   └── mentalLoadService.ts  ← Cálculo e queries de carga mental
├── notifications/
│   └── notificationService.ts ← Push + in-app notifications
└── ai/
    └── aiService.ts           ← Geração de insights (preview)

src/hooks/
├── useMentalLoad.ts
├── useNotifications.ts
└── useAIInsights.ts

src/types/
└── differential.types.ts  ← MentalLoad, Notification, AIInsight

src/components/
├── mental-load/
│   ├── MentalLoadBar.tsx
│   ├── MemberLoadCard.tsx
│   └── InsightCard.tsx
└── notifications/
    ├── NotificationItem.tsx
    └── NotificationBadge.tsx
```

---

## 📊 Tasks da Fase 6

### Task 6.1: Tipos TypeScript (0.5h)
- [x] `differential.types.ts` com MentalLoadEntry, MentalLoadSummary, Notification, AIInsight

### Task 6.2: Services (3h)
- [x] `mentalLoadService.ts` — calcular pontuação, buscar resumo, histórico
- [x] `notificationService.ts` — registrar token push, listar, marcar como lida
- [x] `aiService.ts` — gerar insights por análise de padrões locais

### Task 6.3: Hooks (1h)
- [x] `useMentalLoad.ts` — estado e ações da carga mental
- [x] `useNotifications.ts` — estado e ações das notificações
- [x] `useAIInsights.ts` — geração e cache de insights

### Task 6.4: Módulo Carga Mental (4h)
- [x] Tab Carga Mental no App Layout
- [x] `(mental-load)/index.tsx` — Resumo + gráfico de equilíbrio
- [x] `(mental-load)/history.tsx` — Timeline de contribuições
- [x] `(mental-load)/insights.tsx` — Cards de insights automáticos

### Task 6.5: Módulo Notificações (3h)
- [x] `(notifications)/index.tsx` — Central de notificações
- [x] `(notifications)/preferences.tsx` — Configuração por tipo
- [x] Integração Expo Push Notifications

### Task 6.6: Componentes (2h)
- [x] `MentalLoadBar.tsx` — Barra de progresso comparativa
- [x] `MemberLoadCard.tsx` — Card com pontuação por membro
- [x] `InsightCard.tsx` — Card de insight com ação sugerida
- [x] `NotificationItem.tsx` — Item da lista de notificações
- [x] `NotificationBadge.tsx` — Badge numérico para ícone da tab

### Task 6.7: Schema SQL (0.5h)
- [x] Tabelas `mental_load_entries`, `notifications`, `notification_preferences`

---

## 📈 Estimativa de Tempo

| Task | Tempo |
|------|-------|
| 6.1: Tipos | 0.5h |
| 6.2: Services | 3h |
| 6.3: Hooks | 1h |
| 6.4: Carga Mental | 4h |
| 6.5: Notificações | 3h |
| 6.6: Componentes | 2h |
| 6.7: SQL | 0.5h |
| **TOTAL** | **14h** |

---

## 🎯 Critérios de Aceite — Fase 6

- [ ] Carga mental calcula pontuação corretamente por membro
- [ ] Gráfico de equilíbrio exibe percentual de cada parceiro
- [ ] Histórico mostra contribuições dos últimos 7/30 dias
- [ ] Insight automático identifica quem fez mais na semana
- [ ] Notificação push chega quando tarefa é delegada
- [ ] Central de notificações lista e marca como lida
- [ ] Preferências de notificação são persistidas
- [ ] TypeScript 0 errors
- [ ] ESLint 0 warnings

---

## 🧠 Algoritmo de Carga Mental

### Pesos por tipo de atividade

| Atividade | Pontos |
|-----------|--------|
| Mamada (amamentação) | 3 |
| Mamada (fórmula/garrafa) | 2 |
| Troca de fralda | 1 |
| Banho | 2 |
| Sono (monitoria) | 1 |
| Medicamento | 3 |
| Consulta médica | 5 |
| Vacina | 4 |
| Tarefa concluída (alta prioridade) | 4 |
| Tarefa concluída (média prioridade) | 2 |
| Tarefa concluída (baixa prioridade) | 1 |
| Item de compra adicionado | 1 |

### Cálculo do equilíbrio

```
percentual_A = (pontos_A / (pontos_A + pontos_B)) * 100
equilíbrio_ideal = 50/50 (± 10% tolerância)
alerta_desbalanceamento = diferença > 30%
```

---

## 📝 Notas Técnicas

- **Carga mental:** Calculada em runtime com queries agregadas sobre tabelas existentes (baby_activities, tasks, shopping_items)
- **Sem tabela própria:** Os pontos são calculados na query, não armazenados separadamente, para evitar inconsistência
- **Push Notifications:** Expo Notifications SDK — token registrado em `push_tokens` no Supabase
- **Notificações in-app:** Tabela `notifications` com `read_at` nullable
- **IA (preview):** Sem chamada a API externa no MVP — análise de padrões feita localmente com dados do Supabase
- **Padrão:** Seguir exatamente o padrão estabelecido nas Fases 1-5

---

**Fase 6: Diferencial iniciada! 🚀**
