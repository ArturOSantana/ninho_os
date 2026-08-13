# 📅 Fase 4: Produtividade — Agenda + Tarefas + Compras

**Status:** ✅ Completa  
**Duração:** 2 semanas (Semanas 7-8)  
**Objetivo:** Módulos de Agenda, Tarefas e Lista de Compras funcionais  
**Pré-requisito:** Fase 3 ✅ Completa

---

## 📋 Visão Geral da Fase 4

### O que será criado

1. **Módulo Agenda** (UC016–UC017)
   - Listagem de eventos por data
   - Criação/edição de evento
   - Categorias: consulta, vacina, aniversário, outro

2. **Módulo Tarefas** (UC018–UC020)
   - Lista de tarefas da família
   - Criar, concluir e delegar
   - Prioridade + prazo

3. **Módulo Compras** (UC021–UC023)
   - Lista de itens
   - Adicionar, marcar comprado, compartilhar
   - Categoria + quantidade

---

## 🎯 UCs da Fase 4

| UC    | Nome                  | Tela                           |
|-------|-----------------------|--------------------------------|
| UC016 | Criar evento          | `(agenda)/new.tsx`             |
| UC017 | Visualizar agenda     | `(agenda)/index.tsx`           |
| UC018 | Criar tarefa          | `(tasks)/new.tsx`              |
| UC019 | Concluir tarefa       | `(tasks)/index.tsx`            |
| UC020 | Delegar tarefa        | `(tasks)/[id].tsx`             |
| UC021 | Criar lista / add item| `(shopping)/index.tsx`         |
| UC022 | Marcar item comprado  | `(shopping)/index.tsx`         |
| UC023 | Compartilhar lista    | `(shopping)/index.tsx`         |

---

## 📁 Estrutura de Pastas (Fase 4)

```
src/
├── app/(app)/
│   ├── (agenda)/
│   │   ├── _layout.tsx         ← Stack navigator
│   │   ├── index.tsx           ← UC017: Lista de eventos
│   │   └── new.tsx             ← UC016: Criar evento
│   │
│   ├── (tasks)/
│   │   ├── _layout.tsx         ← Stack navigator
│   │   ├── index.tsx           ← UC018/UC019: Lista + concluir
│   │   └── [id].tsx            ← UC020: Detalhe/delegar tarefa
│   │
│   └── (shopping)/
│       ├── _layout.tsx         ← Stack navigator
│       └── index.tsx           ← UC021/UC022/UC023
│
├── services/
│   ├── agenda/
│   │   └── agendaService.ts
│   ├── tasks/
│   │   └── taskService.ts
│   └── shopping/
│       └── shoppingService.ts
│
├── hooks/
│   ├── useAgenda.ts
│   ├── useTask.ts
│   └── useShopping.ts
│
└── types/
    └── productivity.types.ts
```

---

## 📊 Tasks da Fase 4

### Task 4.1: Tipos (30min)
- [x] `src/types/productivity.types.ts`
  - FamilyEvent, CreateEventInput
  - Task, CreateTaskInput
  - ShoppingItem, CreateShoppingItemInput

### Task 4.2: Services (2h)
- [x] `src/services/agenda/agendaService.ts`
- [x] `src/services/tasks/taskService.ts`
- [x] `src/services/shopping/shoppingService.ts`

### Task 4.3: Hooks (1h)
- [x] `src/hooks/useAgenda.ts`
- [x] `src/hooks/useTask.ts`
- [x] `src/hooks/useShopping.ts`

### Task 4.4: Módulo Agenda (2h)
- [x] `(agenda)/_layout.tsx`
- [x] `(agenda)/index.tsx` — lista de eventos com calendário simples
- [x] `(agenda)/new.tsx` — formulário de criação

### Task 4.5: Módulo Tarefas (2h)
- [x] `(tasks)/_layout.tsx`
- [x] `(tasks)/index.tsx` — lista com swipe to complete
- [x] `(tasks)/[id].tsx` — detalhe + delegar

### Task 4.6: Módulo Compras (1.5h)
- [x] `(shopping)/_layout.tsx`
- [x] `(shopping)/index.tsx` — lista com checkbox + add inline

### Task 4.7: Navegação (30min)
- [x] Atualizar `(app)/_layout.tsx` com 5 tabs (+ Agenda, Tarefas, Compras escondidos)
- [x] Links corretos no Dashboard para cada módulo

---

## 📈 Estimativa de Tempo

| Task                    | Tempo |
|-------------------------|-------|
| 4.1 Tipos               | 30min |
| 4.2 Services            | 2h    |
| 4.3 Hooks               | 1h    |
| 4.4 Módulo Agenda       | 2h    |
| 4.5 Módulo Tarefas      | 2h    |
| 4.6 Módulo Compras      | 1.5h  |
| 4.7 Navegação           | 30min |
| **TOTAL**               | **~10h** |

---

## 🎯 Critérios de Aceite — Fase 4

- [ ] Criar evento salva corretamente no Supabase
- [ ] Eventos aparecem listados ordenados por `start_at`
- [ ] Criar tarefa salva com prioridade + prazo
- [ ] Concluir tarefa atualiza `status = 'done'`
- [ ] Delegar tarefa atualiza `assigned_to`
- [ ] Adicionar item de compra salva no Supabase
- [ ] Marcar item como comprado alterna `checked`
- [ ] Dashboard cards de Agenda/Tarefas/Compras navegam para módulo correto
- [ ] TypeScript 0 errors
- [ ] ESLint 0 warnings

---

## 📝 Notas Importantes

- **Schema:** Tabelas `family_events`, `tasks`, `shopping_items` já existem desde a Fase 1
- **RLS:** Políticas já configuradas no schema.sql
- **Realtime:** `tasks` e `shopping_items` já habilitados para sync ao vivo
- **Tab nav:** Agenda/Tarefas/Compras são acessados via Dashboard e `(more)`, não como tabs principais (para não poluir a barra inferior)

---

**Fase 4: Produtividade iniciada! 🚀**

Próximo: Task 4.1 — Tipos de Produtividade
