# 🗺️ Ninho - Mapa Completo do Produto

**Versão:** 1.0  
**Status:** MVP em Desenvolvimento  
**Última atualização:** 2024

---

## 📖 Como usar este documento

Este é o **Single Source of Truth** para o Ninho. Cada módulo, tela, caso de uso e funcionalidade está aqui documentado. Use este documento para:

1. **Entender o escopo completo** do produto
2. **Planejar sprints** sem ambiguidades
3. **Implementar tela por tela** sem precisar redefinir o produto
4. **Rastrear progresso** no IMPLEMENTATION_CHECKLIST.md
5. **Comunicar com stakeholders** (designers, PM, dev)

---

# 1️⃣ Autenticação

## Telas

| Tela | Status | Descrição |
|------|--------|-----------|
| Splash Screen | [ ] | Tela inicial com logo, enquanto app carrega |
| Login | [ ] | Entrada com e-mail e senha |
| Cadastro | [ ] | Criação de nova conta |
| Recuperar Senha | [ ] | Reset de senha por e-mail |
| Convite para Família | [ ] | Aceitar convite (link ou QR) |
| Escolha de Família | [ ] | Se usuário participa de múltiplas famílias |

## Funcionalidades

- [x] Autenticação com e-mail/senha
- [x] Autenticação com Google OAuth
- [x] Autenticação com Apple Sign-In
- [x] Logout
- [x] Recuperação de senha
- [x] Convite por link único
- [x] Convite por QR Code
- [x] Verificação de e-mail
- [x] Session management (token refresh)

## Casos de Uso

### UC001 - Criar Conta
**Ator:** Usuário não autenticado  
**Pré-condição:** Usuário está na tela de cadastro  
**Fluxo:**
1. Usuário informa nome, e-mail e senha
2. Sistema valida dados (e-mail único, senha forte)
3. Sistema cria perfil no banco
4. Sistema envia e-mail de verificação
5. Sistema redireciona para tela de verificação
6. Usuário verifica e-mail
7. Sistema redireciona para onboarding

**Critérios de Aceite:**
- E-mail não pode estar registrado
- Senha deve ter mínimo 8 caracteres, 1 maiúscula, 1 número, 1 caractere especial
- E-mail de verificação enviado com link válido por 24h
- Após verificação, usuário pode fazer login
- Dados não visíveis antes de verificação

---

### UC002 - Fazer Login
**Ator:** Usuário registrado  
**Pré-condição:** Usuário está na tela de login  
**Fluxo:**
1. Usuário informa e-mail e senha
2. Sistema valida credenciais
3. Sistema gera JWT token
4. Sistema salva token local + refresh token
5. Sistema redireciona para dashboard (se família existe) ou onboarding

**Critérios de Aceite:**
- Mensagem de erro clara para credenciais inválidas
- Token armazenado de forma segura (keychain iOS, keystore Android)
- Refresh token funciona automaticamente
- Logout limpa tokens e session

---

### UC003 - Login com Google
**Ator:** Usuário com conta Google  
**Pré-condição:** Usuário clica em "Entrar com Google"  
**Fluxo:**
1. App abre Google OAuth flow
2. Usuário autentica na Google
3. Sistema recebe ID token
4. Sistema busca/cria perfil
5. Sistema gera JWT token
6. Sistema redireciona para dashboard/onboarding

**Critérios de Aceite:**
- OAuth flow seguro (PKCE flow)
- Perfil criado automaticamente se não existe
- E-mail verificado automaticamente (Google já verifica)

---

### UC004 - Login com Apple
**Ator:** Usuário com conta Apple  
**Pré-condição:** Usuário clica em "Entrar com Apple"  
**Fluxo:**
1. App abre Apple Sign-In
2. Usuário autentica na Apple
3. Sistema recebe identity token
4. Sistema busca/cria perfil
5. Sistema gera JWT token
6. Sistema redireciona para dashboard/onboarding

**Critérios de Aceite:**
- Sign-In seguro (PKCE flow)
- Perfil criado automaticamente se não existe
- E-mail mascarado (Apple Private Relay) tratado corretamente

---

### UC005 - Recuperar Senha
**Ator:** Usuário registrado esqueceu a senha  
**Pré-condição:** Usuário clica em "Esqueci minha senha"  
**Fluxo:**
1. Usuário informa e-mail
2. Sistema busca perfil
3. Sistema gera link de reset com token UUID
4. Sistema envia e-mail com link
5. Usuário clica no link
6. Sistema valida token (válido por 1h)
7. Usuário informa nova senha
8. Sistema atualiza senha hasheada
9. Sistema invalida tokens existentes
10. Sistema redireciona para login

**Critérios de Aceite:**
- Token válido por exatamente 1h
- Link funciona apenas uma vez
- Se token expirar, usuário volta para step 1
- E-mail enviado mesmo que e-mail não exista (segurança)
- Após reset, usuário faz login com nova senha

---

### UC006 - Aceitar Convite (Link ou QR)
**Ator:** Usuário convidado  
**Pré-condição:** Usuário clica em link de convite ou escaneia QR code  
**Fluxo:**
1. Sistema valida token de convite
2. Se usuário não autenticado, redireciona para login/cadastro
3. Se usuário autenticado, adiciona à família
4. Sistema marca convite como aceito
5. Sistema redireciona para dashboard

**Critérios de Aceite:**
- Token de convite válido por 30 dias
- Convite com e-mail específico valida permissões
- Usuário já registrado é adicionado direto
- Novo usuário completa onboarding first
- Convite não pode ser usado 2x

---

## Schema de Banco

```sql
-- Tabela de usuários (gerenciado por Supabase Auth)
-- auth.users (id, email, email_confirmed_at, encrypted_password, created_at, updated_at, ...)

-- Perfil do usuário (extensão de auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Convites (token para aceitar convite)
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token UUID DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL,
  role VARCHAR(20) DEFAULT 'member',
  accepted_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS: Usuários veem apenas seus próprios convites aceitos
```

---

# 2️⃣ Onboarding

## Telas

| Tela | Status | Descrição |
|------|--------|-----------|
| Bem-vindo | [ ] | Splash com mensagem de boas-vindas |
| Criar Família | [ ] | Formulário com dados da família |
| Dados da Família | [ ] | Confirmação de dados |
| Adicionar Bebê | [ ] | Formulário com dados do primeiro bebê |
| Convidar Parceiro | [ ] | Link/QR code para convidar |
| Tutorial | [ ] | Carousel com overview (opcional) |

## Funcionalidades

- [x] Criar família com nome e foto
- [x] Dados de endereço (opcional)
- [x] Registrar primeiro bebê
- [x] Gerar link e QR code de convite
- [x] Nomear papéis (pai, mãe, babá, vó, etc)
- [x] Pular onboarding (para testes)

## Casos de Uso

### UC007 - Criar Família
**Ator:** Usuário recém-registrado  
**Pré-condição:** Usuário completou UC001 (criar conta)  
**Fluxo:**
1. Usuário informa nome da família
2. Usuário faz upload de foto (opcional)
3. Usuário informa endereço (opcional)
4. Sistema valida dados
5. Sistema cria família no banco
6. Sistema define usuário como admin
7. Sistema redireciona para UC008 (adicionar bebê)

**Critérios de Aceite:**
- Nome da família obrigatório (min 2, max 100 chars)
- Foto comprimida e armazenada no Supabase Storage
- Endereço armazenado (usar Geocoding API depois se necessário)
- Admin pode editar dados depois
- Família visível no dashboard

---

### UC008 - Adicionar Bebê
**Ator:** Usuário durante onboarding  
**Pré-condição:** Usuário completou UC007 (criar família)  
**Fluxo:**
1. Usuário informa nome do bebê
2. Usuário seleciona gênero
3. Usuário informa data de nascimento
4. Usuário faz upload de foto (opcional)
5. Sistema valida dados
6. Sistema cria bebê no banco
7. Sistema redireciona para UC009 (convidar parceiro)

**Critérios de Aceite:**
- Nome obrigatório (min 2, max 50 chars)
- Gênero obrigatório (Menino, Menina, Outro)
- Data de nascimento obrigatória (não pode ser futura)
- Foto comprimida em Supabase Storage
- Cálculo automático de idade em semanas
- Múltiplos bebês podem ser adicionados depois
- Bebê aparece no dashboard

---

### UC009 - Convidar Parceiro
**Ator:** Usuário durante onboarding  
**Pré-condição:** Usuário completou UC008 (adicionar bebê)  
**Fluxo:**
1. Sistema gera link de convite único
2. Sistema gera QR code do link
3. Usuário pode copiar link ou compartilhar
4. Usuário pode escanear QR code (outro telefone)
5. Usuário pode pular para dashboard
6. Sistema cria convite no banco
7. Convite válido por 30 dias

**Critérios de Aceite:**
- Link único e seguro (formato: ninho.app/invite/[token])
- QR code escaneável com câmera nativa ou app
- Botões: Copiar link, Compartilhar, QR Code, Pular
- Se parceiro clica em link → UC006 (aceitar convite)
- Convite pode ser regenerado (antigo invalida)

---

## Schema de Banco

```sql
-- Tabela de famílias
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar_url TEXT,
  address TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Membros da família (junction table)
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role VARCHAR(20) DEFAULT 'member', -- 'admin', 'member', 'babysitter', 'grandparent'
  joined_at TIMESTAMP DEFAULT NOW(),
  permissions JSONB DEFAULT '{}' -- custom permissions se necessário
);

-- Tabela de bebês
CREATE TABLE babies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  name TEXT NOT NULL,
  gender VARCHAR(20), -- 'male', 'female', 'other'
  birth_date DATE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS: Membros veem apenas sua família
```

---

# 3️⃣ Dashboard

**Importância:** 🌟🌟🌟 Tela mais crítica do app

## Descrição

Dashboard é a "Home" do Ninho. Mostra em uma tela o que é mais importante:
- Status do bebê agora
- Próxima ação necessária
- Indicadores de carga
- Links rápidos para ações

**Propósito:** Usuário abre app, vê tudo que precisa saber em 5 segundos.

## Telas

| Tela | Status | Descrição |
|------|--------|-----------|
| Dashboard Principal | [ ] | Cards com overview do dia |
| Registro Rápido | [ ] | Menu flutuante para registros rápidos |

## Cards

### Card 1: Bom Dia
**Conteúdo:** "Bom dia, [Nome]! 👋"  
**Ação:** Nenhuma (informativo)  
**Exibe:** Data, previsão do dia (opcional)

---

### Card 2: Resumo do Bebê
**Conteúdo:** 
- Foto do bebê
- Nome do bebê
- Idade (semanas ou meses)
- Peso/altura (último registro)

**Ação:** Abrir dashboard do bebê  
**Exibe:** Múltiplos bebês se existirem (swipe)

---

### Card 3: Próxima Mamada
**Conteúdo:**
- Ícone de mamadeira
- Tempo até próxima mamada (14h 32m)
- Última mamada (2h 14m atrás)

**Ação:** Registrar mamada (abre registro rápido)  
**Lógica:** Se ≤30min até próxima → vermelho, se 1-2h → amarelo

---

### Card 4: Última Troca
**Conteúdo:**
- Ícone de fralda
- Tempo desde última troca (3h 22m)
- Tipo de troca (cocô/xixi/ambos)

**Ação:** Registrar troca  
**Lógica:** Se ≥3h → vermelho, se 2-3h → amarelo

---

### Card 5: Último Sono
**Conteúdo:**
- Ícone de cama
- Duração do sono (1h 45m)
- Qualidade (ótimo/bom/ruim)
- Horário de acordar

**Ação:** Registrar sono  
**Lógica:** Mostrar "Acordado há X tempo"

---

### Card 6: Agenda
**Conteúdo:**
- Próximos 3 eventos
- Ícone + hora + descrição

**Ação:** Ver calendário completo  
**Exemplo:**
```
📅 Próximos compromissos
🏥 Vacina - hoje 14h30
👶 Banho de sol - amanhã 10h
🎂 Aniversário da Mãe - 15/12
```

---

### Card 7: Tarefas
**Conteúdo:**
- Top 3 tarefas urgentes
- Ícone + descrição + responsável

**Ação:** Ver todas tarefas  
**Exemplo:**
```
✅ Tarefas
□ Comprar fórmula (URGENT - Maria)
□ Ligar pediatra (Lucas)
□ Fazer declaração (sem prazo)
```

---

### Card 8: Compras
**Conteúdo:**
- Número de itens pendentes
- Top 3 categorias

**Ação:** Ver lista de compras  
**Exemplo:**
```
🛒 Compras (5 itens)
📦 Alimentação (3)
🧪 Higiene (1)
👕 Roupas (1)
```

---

### Card 9: Carga Mental
**Conteúdo:**
- Gráfico de pizza (sua % vs parceiro)
- Score de equilíbrio (0-100)
- Status (equilibrado/desbalanceado)

**Ação:** Ver insights de carga  
**Exemplo:**
```
⚖️ Carga Mental
Você: 62% | Parceiro: 38%
Status: Ligeiramente desbalanceado
```

---

### Card 10: Botão Registrar
**Conteúdo:** Botão flutuante (FAB) com ícone +  
**Ação:** Abre menu de registro rápido com opções:
- Mamada
- Sono
- Troca
- Medicamento
- Banho
- Peso/Altura/Temperatura
- Observação

---

## Funcionalidades

- [x] Carregar dashboard ao abrir app
- [x] Pull-to-refresh
- [x] Auto-refresh a cada 30 segundos
- [x] Swipe entre múltiplos bebês
- [x] Botão flutuante (FAB) para registro rápido
- [x] Navegação para cada módulo
- [x] Indicadores visuais (cores) para urgência
- [x] Dados em tempo real via Realtime Supabase

## Casos de Uso

### UC010 - Visualizar Dashboard
**Ator:** Usuário autenticado  
**Pré-condição:** Usuário completou onboarding  
**Fluxo:**
1. App abre tela principal
2. Sistema carrega dados do bebê
3. Sistema carrega últimos registros
4. Sistema carrega próximos eventos
5. Sistema carrega tarefas ativas
6. Sistema exibe cards com informações
7. Cards atualizam em tempo real (Realtime)
8. Usuário pode fazer pull-to-refresh

**Critérios de Aceite:**
- Dashboard carrega em < 2 segundos
- Dados são atualizados em tempo real
- Se houver erro, exibir mensagem genérica + retry button
- Suporta múltiplos bebês (swipe)
- Cada card é um componente reutilizável

---

### UC011 - Registrar Rápido (Ação)
**Ator:** Usuário no dashboard  
**Pré-condição:** Usuário clica em card de registro ou FAB  
**Fluxo:**
1. Sistema abre menu flutuante com opções
2. Usuário seleciona tipo de registro
3. Sistema abre formulário pré-preenchido
4. Usuário preenche dados
5. Usuário clica salvar
6. Sistema salva no banco
7. Dashboard atualiza em tempo real
8. Feedback visual (toast: "Mamada registrada!")

**Critérios de Aceite:**
- Menu flutuante responsivo
- Formulário abre em modal/slide-up
- Campo de data/hora pré-preenchido
- Botão voltar cancela sem salvar
- Feedback visual de sucesso

---

## Schema de Banco

```sql
-- Registros de atividades (genérico)
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id UUID NOT NULL REFERENCES babies(id),
  family_id UUID NOT NULL REFERENCES families(id),
  type VARCHAR(50) NOT NULL, -- 'feeding', 'sleep', 'diaper', 'medication', 'bath', 'weight', 'height', 'temperature', 'note'
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  data JSONB NOT NULL -- dados específicos do tipo
);

-- RLS: family_members veem atividades de sua família
```

---

# 4️⃣ Módulo Bebê

## Telas

| Tela | Status | Descrição |
|------|--------|-----------|
| Dashboard do Bebê | [ ] | Overview com estatísticas |
| Histórico | [ ] | Timeline de atividades |
| Gráficos | [ ] | Visualização de tendências |
| Vacinas | [ ] | Calendário de vacinas |
| Medicamentos | [ ] | Histórico de medicamentos |
| Marcos | [ ] | Marcos de desenvolvimento |
| Configurações | [ ] | Dados do bebê |

## Funcionalidades

- [x] Registrar mamada (tipo, duração, volume)
- [x] Registrar sono (duração, qualidade, local)
- [x] Registrar troca (tipo, notas)
- [x] Registrar medicamento (nome, dosagem, hora)
- [x] Registrar banho
- [x] Registrar peso, altura, temperatura
- [x] Adicionar observações
- [x] Cronômetro integrado
- [x] Upload de fotos
- [x] Timeline visual
- [x] Gráficos de peso/altura/sono
- [x] Exportar relatório em PDF
- [x] Múltiplos bebês na conta

## Casos de Uso

### UC012 - Registrar Mamada
**Ator:** Responsável pelo bebê  
**Pré-condição:** Usuário na tela de registro ou dashboard  
**Fluxo:**
1. Usuário clica em "Registrar Mamada"
2. Sistema abre formulário
3. Usuário seleciona tipo:
   - Seio (esquerdo, direito, ambos)
   - Fórmula (quantidade em ml)
   - Garrafa leite materno (quantidade em ml)
   - Sólido (descrição)
4. Usuário pode iniciar cronômetro (seio)
5. Usuário preenche duração/quantidade
6. Usuário adiciona notas (opcional)
7. Sistema salva no banco
8. Dashboard atualiza

**Critérios de Aceite:**
- Tipos de mamada predefinidos
- Cronômetro pausável/resumível
- Data/hora pode ser alterada
- Notas são texto simples (< 1000 chars)
- Cada mamada cria registro único
- Histórico mostra últimas 10 mamadas

---

### UC013 - Registrar Sono
**Ator:** Responsável pelo bebê  
**Fluxo:**
1. Usuário clica em "Registrar Sono"
2. Usuário informa hora de início/fim
3. Usuário informa qualidade (ótimo/bom/ruim)
4. Usuário informa local (berço/cama/carrinho/etc)
5. Usuário adiciona notas
6. Sistema calcula duração
7. Sistema salva no banco

**Critérios de Aceite:**
- Duração calculada automaticamente
- Qualidade tem emojis visuais
- Local é campo texto ou select predefinido
- Hora pode ser no passado/futuro

---

### UC014 - Visualizar Gráficos
**Ator:** Usuário quer ver tendências  
**Pré-condição:** Usuário tem dados suficientes (>2 semanas)  
**Fluxo:**
1. Usuário clica em "Gráficos"
2. Sistema exibe abas:
   - Peso (gráfico de linha)
   - Altura (gráfico de linha)
   - Sono (gráfico de barras)
   - Mamada (gráfico de pizza)
3. Usuário seleciona período (1 semana, 1 mês, 3 meses, custom)
4. Gráficos atualizam
5. Usuário pode fazer zoom/drag para detalhe

**Critérios de Aceite:**
- Gráficos usam biblioteca (Victory ou Recharts)
- Período selecionável
- Y-axis automático baseado em dados
- Tooltip ao passar mouse/toque
- Sem dados: mensagem "Não há dados para este período"

---

### UC015 - Exportar Relatório (PDF)
**Ator:** Usuário quer documento para levar ao pediatra  
**Pré-condição:** Usuário tem dados a exportar  
**Fluxo:**
1. Usuário clica em "Exportar PDF"
2. Sistema abre modal com opções:
   - Período (última semana, último mês, custom)
   - Conteúdo (marcas, gráficos, fotos, etc)
3. Usuário seleciona opções
4. Sistema gera PDF
5. Sistema oferece download ou envio por email
6. PDF contém:
   - Dados do bebê
   - Período coberto
   - Gráficos
   - Registros listados
   - Logo do Ninho

**Critérios de Aceite:**
- PDF gerado em < 5 segundos
- Suporta períodos custom
- Fotos incluídas (se selecionado)
- Qualidade de impressão
- Download via `react-native-file-viewer` ou similar

---

## Schema de Banco

```sql
-- Atividades de mamada (extends activities)
CREATE TABLE activities_feeding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id),
  type VARCHAR(20) NOT NULL, -- 'breast_left', 'breast_right', 'formula', 'bottle', 'solid'
  duration_minutes INT, -- só para seio
  amount_ml INT, -- só para fórmula/garrafa
  description TEXT, -- só para sólido
  notes TEXT
);

-- Atividades de sono
CREATE TABLE activities_sleep (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id),
  duration_minutes INT NOT NULL,
  quality VARCHAR(20), -- 'excellent', 'good', 'poor'
  location TEXT -- 'crib', 'bed', 'stroller', 'car'
);

-- Atividades de troca
CREATE TABLE activities_diaper (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id),
  type VARCHAR(20), -- 'pee', 'poop', 'both'
  notes TEXT
);

-- Medicamentos
CREATE TABLE activities_medication (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id),
  name TEXT NOT NULL,
  dosage TEXT NOT NULL, -- "5ml", "1 comprimido"
  reason TEXT -- "febre", "tosse"
);

-- Peso/altura/temperatura
CREATE TABLE activities_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id),
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,2),
  temperature_celsius DECIMAL(4,2)
);

-- RLS: family_members veem atividades de sua família
```

---

# 5️⃣ Agenda

## Telas

| Tela | Status | Descrição |
|------|--------|-----------|
| Calendário | [ ] | Vista mensal com eventos |
| Agenda Semanal | [ ] | Vista semanal com detalhes |
| Novo Evento | [ ] | Criar/editar evento |
| Detalhes | [ ] | Visualizar evento completo |

## Funcionalidades

- [x] Criar evento
- [x] Editar evento
- [x] Deletar evento
- [x] Categorias (consulta, vacina, aniversário, etc)
- [x] Lembretes (15min, 1h, 1 dia antes)
- [x] Recorrência (diária, semanal, mensal, etc)
- [x] Compartilhamento com família
- [x] Síncronia com calendário nativo (iOS Calendar, Google Calendar)
- [x] Notificações push em lembretes

## Casos de Uso

### UC016 - Criar Evento
**Ator:** Responsável pela agenda  
**Fluxo:**
1. Usuário clica em "+ Evento" ou data no calendário
2. Sistema abre formulário
3. Usuário preenche:
   - Título (obrigatório)
   - Data (obrigatório)
   - Hora (obrigatório)
   - Categoria (select: Consulta, Vacina, Aniversário, Outro)
   - Descrição (opcional)
   - Local (opcional)
   - Pessoas convidadas (opcional, autocomplete)
   - Lembretes (padrão: 15min antes)
   - Recorrência (nenhuma, diário, semanal, mensal)
4. Usuário salva
5. Sistema cria evento
6. Sistema envia notificações para convidados
7. Evento aparece no calendário

**Critérios de Aceite:**
- Título min 3, max 100 chars
- Hora em formato 24h (Brasil)
- Categorias têm ícones visuais
- Lembretes: 15min, 30min, 1h, 1 dia
- Recorrência funciona por X ocorrências ou data fim
- Convidados recebem convite (se email definido)

---

### UC017 - Visualizar Calendário
**Ator:** Usuário quer ver agenda  
**Fluxo:**
1. Usuário abre aba "Agenda"
2. Sistema exibe calendário mensal
3. Datas com eventos têm marcador
4. Usuário clica em data para ver eventos do dia
5. Usuário clica em evento para ver detalhes
6. Usuário pode navegar mês/ano
7. Vista semanal disponível (swipe ou toggle)

**Critérios de Aceite:**
- Calendário começa na segunda (Brasil)
- Eventos mostram ícone de categoria
- Navegação intuitiva (< 1 clique por mês)
- Vista semanal com horários visíveis
- Sem eventos: texto "Sem eventos"

---

## Schema de Banco

```sql
-- Eventos de agenda
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  category VARCHAR(30), -- 'appointment', 'vaccine', 'birthday', 'other'
  recurrence VARCHAR(20), -- 'none', 'daily', 'weekly', 'monthly'
  recurrence_end_date DATE, -- null = infinito
  reminder_minutes INT DEFAULT 15,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS: family_members veem eventos de sua família
```

---

# 6️⃣ Tarefas

## Telas

| Tela | Status | Descrição |
|------|--------|-----------|
| Lista | [ ] | Todas as tarefas com filtros |
| Detalhes | [ ] | Visualizar tarefa completa |
| Nova Tarefa | [ ] | Criar/editar tarefa |
| Categorias | [ ] | Gerenciar categorias |

## Funcionalidades

- [x] Criar tarefa
- [x] Editar tarefa
- [x] Marcar como concluída
- [x] Deletar tarefa
- [x] Prioridade (baixa, média, alta, urgente)
- [x] Atribuir para responsável
- [x] Prazo
- [x] Subtarefas (checklist)
- [x] Categorias personalizadas
- [x] Recorrência
- [x] Filtrar por prioridade/responsável/status
- [x] Ordenação (por data, prioridade, responsável)

## Casos de Uso

### UC018 - Criar Tarefa
**Ator:** Responsável pela organização  
**Fluxo:**
1. Usuário clica em "+ Tarefa"
2. Sistema abre formulário
3. Usuário preenche:
   - Descrição (obrigatório, max 200 chars)
   - Prioridade (select: Baixa, Média, Alta, Urgente)
   - Responsável (select de family_members)
   - Prazo (data opcional)
   - Categoria (select: Limpeza, Compras, Saúde, Outro)
   - Notas (textarea opcional)
   - Subtarefas (adicionar itens com checkbox)
   - Recorrência (nenhuma, semanal, mensal)
4. Usuário salva
5. Sistema notifica responsável
6. Tarefa aparece na lista

**Critérios de Aceite:**
- Descrição obrigatória
- Responsável padrão: usuário atual
- Prioridade padrão: Média
- Subtarefas podem ser reordenadas
- Tarefa pode ter 0-20 subtarefas

---

### UC019 - Concluir Tarefa
**Ator:** Responsável executa tarefa  
**Fluxo:**
1. Usuário vê tarefa na lista
2. Usuário clica checkbox
3. Sistema marca como concluída
4. Se subtarefas, exibir % completo
5. Quando 100%, tarefa fica com visual "done"
6. Feedback visual (confete, som, notificação)
7. Tarefa pode ser selecionada para filtro "Concluídas"

**Critérios de Aceite:**
- Toggle fácil e rápido
- Histórico guarda data/hora conclusão
- Pode desmarcar (undo)
- Subtarefas marcáveis individualmente

---

### UC020 - Delegar Tarefa
**Ator:** Responsável reassigna tarefa  
**Fluxo:**
1. Usuário clica em tarefa
2. Usuário clica em responsável atual
3. Sistema abre modal com family_members
4. Usuário seleciona novo responsável
5. Sistema atualiza banco
6. Novo responsável recebe notificação
7. Tarefa desaparece da lista do antigo (ou fica cinza)

**Critérios de Aceite:**
- Autocomplete de nomes
- Não-notificação se reassigna para si
- Notificação push para novo responsável

---

## Schema de Banco

```sql
-- Tarefas
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  description TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  assigned_to UUID REFERENCES auth.users(id),
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  due_date DATE,
  category VARCHAR(30),
  notes TEXT,
  completed_at TIMESTAMP,
  recurrence VARCHAR(20), -- 'none', 'weekly', 'monthly'
  recurrence_end_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Subtarefas
CREATE TABLE task_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  description TEXT NOT NULL,
  completed_at TIMESTAMP,
  order_index INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS: family_members veem tarefas de sua família
```

---

# 7️⃣ Compras

## Telas

| Tela | Status | Descrição |
|------|--------|-----------|
| Lista | [ ] | Itens a comprar |
| Categorias | [ ] | Filtrar por categoria |
| Histórico | [ ] | Itens já comprados |

## Funcionalidades

- [x] Adicionar item
- [x] Editar item
- [x] Deletar item
- [x] Marcar como comprado
- [x] Quantidade
- [x] Categoria
- [x] Preço (opcional)
- [x] Prioridade
- [x] Compartilhar lista
- [x] Checagem offline
- [x] Histórico de compras

## Casos de Uso

### UC021 - Criar Lista de Compras
**Ator:** Responsável pelas compras  
**Fluxo:**
1. Usuário clica em "+ Item"
2. Sistema abre form rápido
3. Usuário preenche:
   - Nome (obrigatório, autocomplete de itens anteriores)
   - Quantidade (padrão: 1)
   - Categoria (select: Alimentação, Higiene, Roupas, Outros)
   - Preço (opcional)
   - Prioridade (opcional)
4. Usuário salva
5. Item aparece na lista com checkbox
6. Lista atualiza para todos os family_members em tempo real

**Critérios de Aceite:**
- Autocomplete de itens já usados
- Quantidade com controle +/-
- Categoria com ícones
- Salva automático (sem botão "salvar")
- Suporta múltiplas listas (atual funcionalidade)

---

### UC022 - Marcar Comprado
**Ator:** Responsável faz compra  
**Fluxo:**
1. Usuário supermercado vê item na lista
2. Usuário clica checkbox ao lado de item
3. Sistema marca como comprado
4. Item fica com visual "strike-through"
5. Outros family_members veem atualizado em tempo real
6. Item pode ser adicionado a "Histórico"

**Critérios de Aceite:**
- Checkbox responsivo
- Visual claro de "comprado"
- Pode voltar a "não comprado"
- Suporta offline (sincroniza depois)

---

### UC023 - Compartilhar Lista
**Ator:** Responsável compartilha lista  
**Fluxo:**
1. Usuário clica em "Compartilhar"
2. Sistema gera link (ou copia lista para clipboard)
3. Usuário compartilha por WhatsApp, iMessage, SMS
4. Outro usuário clica em link
5. Se não autenticado, faz login
6. Se autenticado, lista é importada para sua conta
7. Ambos veem atualizações em tempo real

**Critérios de Aceite:**
- Link único e seguro (token)
- Link válido por 30 dias
- Botão "Copiar link" e "Compartilhar app"
- Funciona offline (sincroniza depois)

---

## Schema de Banco

```sql
-- Listas de compras
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  name TEXT DEFAULT 'Compras',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Itens de compra
CREATE TABLE shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES shopping_lists(id),
  name TEXT NOT NULL,
  quantity INT DEFAULT 1,
  category VARCHAR(30),
  price_cents INT, -- armazenar como centavos para evitar float issues
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high'
  completed_at TIMESTAMP,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS: family_members veem listas de sua família
```

---

# 8️⃣ Carga Mental

**Importância:** 🌟🌟🌟 Esse é o diferencial do Ninho

## Descrição

Carga Mental rastreia quem está fazendo mais trabalho invisível. Algoritmo pondera cada atividade registrada e calcula:
- **Equilíbrio:** % de trabalho por pessoa
- **Score:** Pontuação diária/semanal/mensal
- **Insights:** Tendências e alertas automáticos

## Telas

| Tela | Status | Descrição |
|------|--------|-----------|
| Resumo | [ ] | Overview com score e equilíbrio |
| Histórico | [ ] | Dados diários/semanais/mensais |
| Gráficos | [ ] | Visualização de tendências |
| Insights | [ ] | IA analisando padrões |

## Funcionalidades

- [x] Pontuação automática por atividade
- [x] Cálculo de equilíbrio em tempo real
- [x] Ranking "Quem fez mais"
- [x] Gráfico de pizza (distribuição)
- [x] Histórico semanal
- [x] Comparação mensal
- [x] Alertas de desbalanceamento
- [x] IA detectando padrões
- [x] Recomendações automáticas

## Algoritmo de Pontuação

Cada atividade tem um peso (pontos). Total de 100 pontos por dia = trabalho completo.

| Atividade | Pontos | Justificativa |
|-----------|--------|--------------|
| Registrar mamada | 5 | Planejamento + execução |
| Registrar sono | 3 | Monitoramento |
| Registrar troca | 2 | Higiene básica |
| Completar tarefa | 10 | Responsabilidade |
| Criar evento | 3 | Planejamento |
| Adicionar compra | 1 | Planejamento |

**Cálculo diário:**
```
Score de Maria hoje = 
  (Mamadas registradas × 5) +
  (Sonos registrados × 3) +
  (Tarefas concluídas × 10) +
  ...
```

**Equilíbrio:**
```
% de Maria = (Score de Maria / Total) × 100
```

## Casos de Uso

### UC024 - Visualizar Carga Mental
**Ator:** Usuário quer ver equilíbrio  
**Pré-condição:** Mínimo 3 dias de dados  
**Fluxo:**
1. Usuário clica em "Carga Mental"
2. Sistema exibe card resumido no dashboard
3. Usuário clica para abrir página completa
4. Sistema mostra:
   - Score de hoje (pontos acumulados)
   - % de distribuição (gráfico pizza)
   - Ranking de hoje
   - Status (equilibrado/alerta/crítico)
   - Histórico últimos 7 dias (gráfico barras)
   - Comparação com mês anterior
5. Usuário pode filtrar período
6. Sistema calcula IA insights

**Critérios de Aceite:**
- Score atualiza em tempo real
- Gráficos carregam em < 1s
- Sem dados: "Volte amanhã para ver insights"
- Período selecionável (dia, semana, mês)
- Status com ícone visual (😊/😐/😠)

---

### UC025 - Alertas Automáticos
**Ator:** Sistema detecta problema  
**Fluxo (Background):**
1. A cada hora, sistema calcula carga mental atual
2. Se desbalanceamento > 30%:
   - Sistema cria alerta
   - Sistema envia push para ambos
   - Sistema adiciona card "⚠️ Aviso de carga"
3. Se desbalanceamento > 50%:
   - Sistema cria alerta crítico
   - Mensagem mais urgente
4. Alerta desaparece quando < 20% de diferença

**Critérios de Aceite:**
- Cálculo automático por hora
- Notificação push com contexto
- Usuário pode desabilitar alertas
- Histórico de alertas disponível

---

### UC026 - Insights Automáticos
**Ator:** IA do Ninho analisa padrões  
**Fluxo (Background):**
1. A cada 7 dias, sistema roda análise
2. Sistema identifica padrões:
   - "Você faz 80% das trocas"
   - "Seu parceiro acordou com bebê 5x esta semana"
   - "Carga mental equilibrada este mês! 💪"
3. Sistema exibe insights em card special
4. Usuário pode copiar insights para compartilhar

**Critérios de Aceite:**
- Insights em linguagem natural (português)
- Mínimo 7 dias de dados antes de mostrar
- Insights renderizam em página "Insights"
- Histórico de insights disponível

---

## Schema de Banco

```sql
-- Tabela de pontuação (cache de cálculos)
CREATE TABLE mental_load_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL,
  score INT DEFAULT 0,
  activities_count INT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(family_id, user_id, date)
);

-- Tabela de insights (IA-generated)
CREATE TABLE mental_load_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  week_start DATE,
  insights JSONB, -- array de insights: [{type: 'alert', message: '...', emoji: '...'}]
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS: family_members veem dados de sua família
```

---

# 9️⃣ Família

## Telas

| Tela | Status | Descrição |
|------|--------|-----------|
| Membros | [ ] | Lista de pessoas na família |
| Perfil | [ ] | Dados do membro |
| Permissões | [ ] | Gerenciar permissões |
| Convites | [ ] | Convites pendentes |

## Funcionalidades

- [x] Adicionar membro
- [x] Remover membro
- [x] Editar membro
- [x] Gerenciar permissões por role
- [x] Roles predefinidos (Admin, Membro, Babá, Avó)
- [x] Permissões customizáveis
- [x] Histórico de convites

## Casos de Uso

### UC027 - Convidar Membro
**Ator:** Admin de família  
**Pré-condição:** Usuário é admin  
**Fluxo:**
1. Usuário clica em "Convidar"
2. Sistema abre modal
3. Usuário informa:
   - E-mail (obrigatório)
   - Role (select: Admin, Membro, Babá, Avó)
4. Sistema gera convite com token
5. Sistema envia e-mail
6. E-mail contém link único + contexto
7. Convite aparece em "Convites pendentes"
8. Convite válido por 30 dias

**Critérios de Aceite:**
- E-mail validado
- Convite com contexto (nome da família, bebê)
- Link no e-mail abre app + aceita convite
- Convite pode ser revogado
- Sem limite de convites simultâneos

---

### UC028 - Alterar Permissão
**Ator:** Admin de família  
**Pré-condição:** Usuário é admin, membro existe  
**Fluxo:**
1. Usuário clica em membro da família
2. Usuário clica em role atual
3. Sistema abre modal com roles disponíveis
4. Usuário seleciona novo role
5. Sistema atualiza banco
6. Membro é notificado

**Critérios de Aceite:**
- Admin não pode remover permissão de si
- Mínimo 1 admin por família
- Alteração auditada (log)
- Membro notificado por push

---

### UC029 - Remover Membro
**Ator:** Admin de família  
**Pré-condição:** Usuário é admin, membro não é último admin  
**Fluxo:**
1. Usuário clica em membro
2. Usuário clica em "Remover"
3. Sistema pede confirmação
4. Usuário confirma
5. Sistema remove membro de family_members
6. Membro perde acesso imediato
7. Histórico é preservado

**Critérios de Aceite:**
- Confirmação obrigatória
- Membro recebe notificação
- Último admin não pode ser removido
- Dados históricos preservados

---

## Schema de Banco

```sql
-- Já criado em seção Onboarding
-- CREATE TABLE families (...)
-- CREATE TABLE family_members (...)

-- Histórico de convites
CREATE TABLE invitation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  invited_email TEXT NOT NULL,
  role VARCHAR(20),
  status VARCHAR(20), -- 'pending', 'accepted', 'rejected', 'expired'
  token UUID DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),
  accepted_at TIMESTAMP,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS: Admins veem convites; members veem apenas sua info
```

---

# 🔟 Perfil

## Telas

| Tela | Status | Descrição |
|------|--------|-----------|
| Meu Perfil | [ ] | Dados pessoais |
| Segurança | [ ] | Senha, 2FA, dispositivos |
| Privacidade | [ ] | Dados, deletion, export |
| Preferências | [ ] | Idioma, tema, unidades |
| Ajuda | [ ] | FAQ, contato |
| Sobre | [ ] | Versão, termos, política |

## Funcionalidades

- [x] Editar perfil (nome, foto, email)
- [x] Trocar senha
- [x] Ativar 2FA
- [x] Logout em todos dispositivos
- [x] Exportar dados (GDPR)
- [x] Deletar conta (GDPR)
- [x] Tema claro/escuro
- [x] Idioma (português, inglês, espanhol)
- [x] Unidades (kg/lb, cm/in)
- [x] FAQ integrado
- [x] Contato com suporte

---

# 1️⃣1️⃣ Assinatura

## Telas

| Tela | Status | Descrição |
|------|--------|-----------|
| Planos | [ ] | Comparação de planos |
| Pagamento | [ ] | Checkout Stripe |
| Histórico | [ ] | Faturas e status |

## Funcionalidades

- [x] 3 planos (Grátis, Pro, Premium)
- [x] Trial de 14 dias
- [x] Upgrade/Downgrade
- [x] Cancelamento
- [x] Cupom de desconto
- [x] Integração Stripe
- [x] Faturas em PDF
- [x] Histórico de pagamentos

## Planos

| Plano | Preço | Funcionalidades |
|-------|-------|-----------------|
| Grátis | R$0 | Dashboard, registros básicos, max 1 bebê, sem AI |
| Pro | R$29/mês | Múltiplos bebês, agenda, tarefas, compras, carga mental |
| Premium | R$49/mês | Tudo + IA, export PDF, suporte prioritário |

---

# 1️⃣2️⃣ IA (Futuro)

## Telas

| Tela | Status | Descrição |
|------|--------|-----------|
| Chat | [ ] | Conversa com assistente |
| Insights | [ ] | Análise semanal |
| Sugestões | [ ] | Recomendações automáticas |

## Funcionalidades

- [ ] Resumo semanal automático
- [ ] Responder perguntas sobre cuidados
- [ ] Gerar rotina
- [ ] Detectar padrões
- [ ] Alertas inteligentes
- [ ] Integração OpenAI/Anthropic

---

# 1️⃣3️⃣ Notificações

## Telas

| Tela | Status | Descrição |
|------|--------|-----------|
| Central | [ ] | Histórico de notificações |
| Preferências | [ ] | Gerenciar tipos e horários |

## Funcionalidades

- [x] Push notifications
- [x] In-app notifications
- [x] E-mail notifications
- [x] Lembretes de próxima mamada
- [x] Alertas de vacina
- [x] Convite para família
- [x] Tarefa atribuída
- [x] Alerta de carga mental
- [x] Horário silencioso
- [x] Desabilitar por tipo

---

# 1️⃣4️⃣ Configurações Gerais

## Telas

| Tela | Status | Descrição |
|------|--------|-----------|
| Gerais | [ ] | Info do app |
| Segurança | [ ] | Senha e 2FA |
| Privacidade | [ ] | GDPR compliance |
| Ajuda | [ ] | FAQ e suporte |
| Sobre | [ ] | Versão e termos |

---

# 🚀 Módulos Futuros

## Crianças (Maiores)
- Escola e boletim
- Mesada
- Tarefas e conquistar

## Casa
- Contas e manutenção
- Estoque
- Documentos

## Saúde
- Consultas e exames
- Receitas
- Convênio

## Pets
- Vacinas e alimentação
- Passeios
- Banho

---

# 📊 Backoffice (Painel Administrativo)

**Nota:** Esse módulo é exclusivo da equipe Ninho (não para famílias).

## Dashboard Admin

- [ ] Usuários ativos
- [ ] Famílias cadastradas
- [ ] Assinaturas ativas
- [ ] Receita (MRR/ARR)
- [ ] Churn rate
- [ ] Retenção
- [ ] Novos cadastros (gráfico)

## Gestão de Usuários

- [ ] Buscar usuários
- [ ] Bloquear/desbloquear contas
- [ ] Gerenciar famílias
- [ ] Visualizar logs

## Conteúdo

- [ ] Artigos
- [ ] FAQ
- [ ] Notificações em massa
- [ ] Banners e campanhas

## Financeiro

- [ ] Assinaturas
- [ ] Pagamentos
- [ ] Cupons
- [ ] Reembolsos

## Suporte

- [ ] Tickets
- [ ] Feedbacks
- [ ] Relatórios de erro

---

# 📅 Ordem de Implementação (MVP)

1. **Fase 1: Fundação** ✅
   - Arquitetura
   - Autenticação
   - Supabase setup

2. **Fase 2: Onboarding** ✅
   - Criar família
   - Adicionar bebê
   - Convidar parceiro

3. **Fase 3: Core** ✅
   - Dashboard
   - Módulo Bebê (registros)

4. **Fase 4: Produtividade** ✅
   - Agenda
   - Tarefas
   - Compras

5. **Fase 5: Social** ✅
   - Permissões de família
   - Gerenciar membros

6. **Fase 6: Diferencial** ✅
   - Carga Mental
   - Notificações

7. **Fase 7: Sistema** ✅
   - Configurações
   - Assinatura
   - Suporte

8. **Fase 8+: Avançado**
   - IA
   - Backoffice
   - Módulos futuros

---

# 🎯 Métricas de Sucesso

## MVP Launch

- [ ] 1.000 famílias cadastradas (1 mês)
- [ ] 4.5+ rating na App Store
- [ ] < 2% crash rate
- [ ] > 80% monthly active users
- [ ] < 10% churn rate (mês 1)

## 6 Meses

- [ ] 50.000 famílias
- [ ] 30% usando assinatura Pro+
- [ ] < 0.5% crash rate
- [ ] NPS > 50

---

# 📝 Notas Importantes

1. **Scope:** Este documento é para MVP apenas. Recursos futuros podem mudar.
2. **Prioridade:** Dashboard e registros do bebê são 70% do valor. Implementar esses first.
3. **MVP vs Futuro:** Muitas funcionalidades (como IA, backoffice) são pós-MVP. Não comece por aí.
4. **UX:** Design system deve ser consistente. Usar Shadcn ou similar para iOS/Android.
5. **Testes:** Todos UC devem ter testes unitários + integração.
6. **Documentação:** Manter README e API docs sincronizados.

---

**Versão:** 1.0  
**Atualizado:** 2024  
**Autor:** Product Team  
**Status:** Aprovado para MVP
