# 📋 Checklist de Implementação - Ninho MVP

Use este documento para rastrear o progresso de cada funcionalidade. Cada item é vinculado ao PRODUCT_MAP.md.

---

## Fase 1: Fundação (Sprint 1-2)

### Arquitetura Base

- [ ] Configurar projeto Expo com TypeScript
- [ ] Configurar TailwindCSS + NativeWind
- [ ] Estrutura de pastas do projeto
- [ ] Configurar ESLint e Prettier
- [ ] Configurar variáveis de ambiente (.env)
- [ ] Configurar GitHub Actions (CI/CD)
- [ ] README.md com instruções de setup

### Supabase Setup

- [ ] Criar projeto Supabase
- [ ] Configurar PostgreSQL
- [ ] Habilitar Supabase Auth
- [ ] Criar esquema do banco (schema.sql)
- [ ] Configurar Row-Level Security (RLS)
- [ ] Configurar Realtime
- [ ] Testes de conexão

### Autenticação (UC001-UC004)

- [ ] Integração com Supabase Auth
- [ ] Tela de Splash Screen
- [ ] Tela de Login
  - [ ] Validação de e-mail
  - [ ] Validação de senha
  - [ ] Mensagens de erro
  - [ ] Link "Esqueci a senha"
- [ ] Tela de Cadastro
  - [ ] Validação de dados
  - [ ] Criação de perfil
  - [ ] E-mail de verificação
- [ ] UC002 - Login com senha
- [ ] UC003 - Login com Google
- [ ] UC004 - Login com Apple
- [ ] UC005 - Recuperar Senha
- [ ] Token refresh automático
- [ ] Logout

### Testes

- [ ] Testes unitários de autenticação
- [ ] Testes de integração (Supabase)
- [ ] Testes de UI (Splash, Login, Cadastro)

---

## Fase 2: Onboarding (Sprint 3)

### Onboarding Completo (UC006-UC008)

- [ ] UC006 - Criar Família
  - [ ] Formulário de dados da família
  - [ ] Upload de foto
  - [ ] Criação no banco
  - [ ] Validações
- [ ] UC007 - Adicionar Bebê
  - [ ] Formulário de dados do bebê
  - [ ] Upload de foto
  - [ ] Validação de data
  - [ ] Criação no banco
- [ ] UC008 - Convidar Parceiro
  - [ ] Geração de link único
  - [ ] Geração de QR Code
  - [ ] Envio de e-mail
  - [ ] Compartilhamento manual
- [ ] Tutorial interativo (opcional para MVP)
- [ ] Pular onboarding (opcional)

### Banco de Dados

- [ ] Tabelas de onboarding criadas
- [ ] Migrations documentadas
- [ ] RLS configurado

### Testes

- [ ] Fluxo completo de onboarding
- [ ] Validações de formulário
- [ ] Geração de convites

---

## Fase 3: Core (Sprint 4-6)

### Dashboard (UC009-UC010)

- [ ] Tela principal do Dashboard
- [ ] Card - Bom Dia
- [ ] Card - Resumo do Bebê
- [ ] Card - Próxima Mamada
- [ ] Card - Última Troca
- [ ] Card - Último Sono
- [ ] Card - Agenda (próximos 3 eventos)
- [ ] Card - Tarefas (top 3)
- [ ] Card - Compras (itens pendentes)
- [ ] Card - Carga Mental
- [ ] UC009 - Carregar dados do dashboard
  - [ ] Recuperação de dados em tempo real
  - [ ] Pull-to-refresh
  - [ ] Auto-refresh a cada 30s
- [ ] UC010 - Abrir Registro Rápido
  - [ ] Menu flutuante
  - [ ] Opções de registro
  - [ ] Formulário pré-preenchido
  - [ ] Link para registro completo
- [ ] Swipe entre crianças (se múltiplas)

### Módulo Bebê (UC011-UC013)

- [ ] Tela Dashboard do Bebê
- [ ] Tela Histórico
- [ ] Tela Gráficos
- [ ] UC011 - Registrar Mamada
  - [ ] Tipo de mamada (seio, fórmula, garrafa, sólido)
  - [ ] Cronômetro
  - [ ] Duração
  - [ ] Volume
  - [ ] Notas
  - [ ] Salvar no banco
- [ ] Registrar Sono
  - [ ] Duração
  - [ ] Qualidade
  - [ ] Local
- [ ] Registrar Troca
  - [ ] Tipo
  - [ ] Notas
- [ ] Registrar Medicamento
  - [ ] Nome
  - [ ] Dosagem
  - [ ] Horário
- [ ] Registrar Banho, Peso, Altura, Temperatura
- [ ] UC012 - Visualizar Gráficos
  - [ ] Gráfico de peso
  - [ ] Gráfico de altura
  - [ ] Gráfico de sono
  - [ ] Seletor de período
  - [ ] Zoom/drag para detalhe
- [ ] UC013 - Exportar Relatório
  - [ ] Geração de PDF
  - [ ] Seletor de período e conteúdo
  - [ ] Download

### Banco de Dados

- [ ] Tabelas de atividades
- [ ] Tabelas específicas por tipo (feeding, sleep, etc)
- [ ] RLS configurado

### Testes

- [ ] Testes de registro de atividades
- [ ] Testes de gráficos
- [ ] Testes de export

---

## Fase 4: Produtividade (Sprint 7-8)

### Agenda (UC014-UC015)

- [ ] Tela Calendário (vista mensal)
- [ ] Tela Agenda Semanal
- [ ] Tela de Evento (criar/editar)
- [ ] Tela Detalhes do Evento
- [ ] UC014 - Criar Evento
  - [ ] Formulário completo
  - [ ] Categorias (consulta, vacina, aniversário, etc)
  - [ ] Lembretes
  - [ ] Recorrência
  - [ ] Compartilhamento
  - [ ] Salvamento no banco
- [ ] Notificações de lembrete
- [ ] Editar evento
- [ ] Deletar evento

### Tarefas (UC016-UC017)

- [ ] Tela Lista de Tarefas
- [ ] Tela Detalhes da Tarefa
- [ ] Tela Nova Tarefa
- [ ] UC016 - Criar Tarefa
  - [ ] Formulário completo
  - [ ] Prioridade
  - [ ] Responsável
  - [ ] Prazo
  - [ ] Checklist
  - [ ] Categoria
  - [ ] Salvamento no banco
- [ ] Marcar como concluída
- [ ] Editar tarefa
- [ ] Deletar tarefa
- [ ] Notificar responsável
- [ ] Filtrar por prioridade/responsável

### Compras (UC018-UC019)

- [ ] Tela Lista de Compras
- [ ] Tela Histórico
- [ ] UC018 - Criar Item de Compra
  - [ ] Formulário
  - [ ] Categoria
  - [ ] Quantidade
  - [ ] Preço
  - [ ] Notas
- [ ] UC019 - Marcar como Comprado
- [ ] Deletar item
- [ ] Compartilhar lista
- [ ] Histórico de compras

### Banco de Dados

- [ ] Tabelas de agenda
- [ ] Tabelas de tarefas
- [ ] Tabelas de compras
- [ ] RLS configurado

### Testes

- [ ] Testes de CRUD para cada módulo
- [ ] Testes de compartilhamento
- [ ] Testes de notificações

---

## Fase 5: Social (Sprint 9)

### Família (UC020-UC022)

- [ ] Tela Membros da Família
- [ ] Tela Perfil do Membro
- [ ] Tela Permissões
- [ ] Tela Convites
- [ ] UC020 - Convidar Membro
  - [ ] Formulário com e-mail
  - [ ] Seleção de role
  - [ ] Geração de link
  - [ ] Envio de e-mail
  - [ ] Histórico de convites
- [ ] UC021 - Alterar Permissão
  - [ ] Mudança de role
  - [ ] Validação de admin
- [ ] UC022 - Remover Membro
  - [ ] Remoção da família
  - [ ] Revogar acesso
- [ ] UC005 - Aceitar Convite (continuação da autenticação)
  - [ ] Link de convite funcional
  - [ ] QR Code funcional
  - [ ] Adição à família automática
  - [ ] Redirecionamento para dashboard

### Banco de Dados

- [ ] RLS para permissões de família

### Testes

- [ ] Testes de convites
- [ ] Testes de permissões
- [ ] Testes de múltiplas famílias por usuário

---

## Fase 6: Diferencial (Sprint 10-11)

### Carga Mental (UC024-UC026)

- [x] Tipos TypeScript — `differential.types.ts` com MentalLoad, Notification, AIInsight
- [x] `mentalLoadService.ts` — cálculo de pontuação em runtime, histórico diário
- [x] `useMentalLoad.ts` — estado, período (semana/mês), refresh
- [x] Tela `(mental-load)/index.tsx` — UC024: equilíbrio + barra comparativa
- [x] Tela `(mental-load)/history.tsx` — UC025: histórico por dia e membro
- [x] Tela `(mental-load)/insights.tsx` — UC026: insights automáticos + resumo semanal
- [x] Algoritmo de pontuação por tipo de atividade (MENTAL_LOAD_POINTS)
- [x] Alertas de desbalanceamento (diferença > 30%)
- [x] Componente `MentalLoadBar.tsx` — barra proporcional entre membros
- [x] Componente `MemberLoadCard.tsx` — card de ranking por membro
- [x] Componente `InsightCard.tsx` — card com severidade info/warning/positive

### IA Insights

- [x] `aiService.ts` — insights locais: sono, alimentação, tarefas em atraso, carga mental
- [x] `useAIInsights.ts` — hook com resumo semanal + lista de insights
- [x] `WeeklySummary` — total de mamadas, trocas, sono médio, tarefas

### Notificações

- [x] `notificationService.ts` — CRUD, push token, preferências, Realtime
- [x] `useNotifications.ts` — estado, Realtime subscription, markAsRead, updatePreference
- [x] Tela `(notifications)/index.tsx` — central com marcar como lida / marcar todas
- [x] Tela `(notifications)/preferences.tsx` — toggles push + in-app por tipo
- [x] Componente `NotificationItem.tsx` — item reutilizável com ícone por tipo
- [x] Componente `NotificationBadge.tsx` — badge numérico para tab bar
- [x] Tipos de notificação: 7 tipos + system
- [x] Horário silencioso (quiet_hours_start/end no banco)
- [x] Tab bar expandida de 5 para 7 abas (Equilíbrio + Avisos)

### Banco de Dados

- [x] `phase6_migration.sql` — push_tokens, notifications, notification_preferences
- [x] RLS configurado para todas as tabelas
- [x] Realtime habilitado para notifications
- [x] Trigger `on_task_assigned` — notifica responsável ao delegar tarefa
- [x] Função `notify_family_members` — helper para notificar família

### Testes

- [ ] Testes de cálculo de carga mental
- [ ] Testes de notificações
- [ ] Testes de push notifications

---

## Fase 7: Sistema (Sprint 12+)

### Configurações

- [ ] Tela Meu Perfil
  - [ ] Editar informações
  - [ ] Foto de perfil
- [ ] Tela Segurança
  - [ ] Trocar senha
  - [ ] Autenticação de dois fatores (2FA)
  - [ ] Logout de todos os dispositivos
- [ ] Tela Privacidade
  - [ ] Exportar dados (LGPD/GDPR)
  - [ ] Deletar conta
- [ ] Tela Preferências
  - [ ] Idioma
  - [ ] Tema (claro/escuro)
  - [ ] Unidades (kg/lb, cm/in)
  - [ ] Formato de data
- [ ] Tela Ajuda
  - [ ] FAQ
  - [ ] Contato com suporte
- [ ] Tela Sobre
  - [ ] Versão do app
  - [ ] Termos de serviço
  - [ ] Política de privacidade
  - [ ] Credenciamento

### Assinatura

- [ ] Tela Planos
  - [ ] Comparação de planos
  - [ ] Botão de upgrade/downgrade
- [ ] Tela de Pagamento
  - [ ] Integração com Stripe
  - [ ] Checkout
- [ ] Tela Histórico de Pagamentos
  - [ ] Faturas
  - [ ] Status da assinatura
- [ ] Sistema de trial (14 dias)
- [ ] Cupom de desconto
- [ ] Gerenciamento de assinatura
- [ ] Cancelamento

### IA (Futuro)

- [ ] Tela Chat com assistente
- [ ] Tela Insights (resumo da semana)
- [ ] Tela Sugestões
- [ ] Integração OpenAI API
- [ ] Funcionalidades:
  - [ ] Resumo semanal automático
  - [ ] Responder perguntas sobre cuidados
  - [ ] Gerar rotina
  - [ ] Detectar padrões
  - [ ] Alertas inteligentes

### Testes

- [ ] Testes de configurações
- [ ] Testes de assinatura
- [ ] Testes de IA

---

## Validação Geral

### Performance

- [ ] [ ] Tempo de carregamento < 2s
- [ ] [ ] Dashboard sem lag
- [ ] [ ] Sincronização em tempo real funciona
- [ ] [ ] App funciona offline (dados cached)

### Qualidade

- [ ] [ ] Cobertura de testes > 80%
- [ ] [ ] Lint passa em 100%
- [ ] [ ] Sem warnings de TypeScript
- [ ] [ ] Código documentado

### Segurança

- [ ] [ ] Senhas hasheadas
- [ ] [ ] JWT funciona corretamente
- [ ] [ ] RLS no Supabase está ativo
- [ ] [ ] Dados sensíveis não são logged
- [ ] [ ] HTTPS obrigatório

### UX/UI

- [ ] [ ] App funciona no iOS
- [ ] [ ] App funciona no Android
- [ ] [ ] Responsivo em diferentes tamanhos
- [ ] [ ] Acessibilidade (a11y) revisada
- [ ] [ ] Design System consistente

### Documentação

- [ ] [ ] README.md atualizado
- [ ] [ ] API documentada
- [ ] [ ] Componentes documentados
- [ ] [ ] Setup instructions claras
- [ ] [ ] Troubleshooting guide

---

## Status Geral

**Fase Atual:** [ ] Fundação [ ] Onboarding [ ] Core [ ] Produtividade [ ] Social [ ] Diferencial [ ] Sistema

**Progresso:** 0% completo

**Última atualização:** YYYY-MM-DD

---

Para atualizar este checklist, edite diretamente ou execute:
```bash
# Copiar template para novo arquivo de sprint
cp IMPLEMENTATION_CHECKLIST.md SPRINT_N_CHECKLIST.md
```
