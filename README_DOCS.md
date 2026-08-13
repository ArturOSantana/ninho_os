# 🍼 Ninho - Aplicativo para Famílias com Bebês

> **Ninho é a primeira plataforma completa para gerenciar a rotina, saúde e bem-estar do bebê. Com foco em equilibrar a carga mental dos responsáveis.**

![Status](https://img.shields.io/badge/status-MVP%20Development-yellow?style=flat-square)
![Version](https://img.shields.io/badge/version-1.0.0--beta-blue?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## 📋 Índice Rápido

- [O que é Ninho?](#o-que-é-ninho)
- [Quick Start](#quick-start)
- [Documentação](#documentação)
- [Tech Stack](#tech-stack)
- [Como Contribuir](#como-contribuir)
- [Roadmap](#roadmap)

---

## 🎯 O que é Ninho?

Ninho é um aplicativo mobile (iOS + Android) que ajuda famílias a:

✅ **Rastrear cuidados do bebê**
- Mamadas, sono, trocas, medicamentos, peso, altura
- Timeline visual com gráficos e estatísticas
- Exportar relatórios para pediatra

✅ **Organizar a vida familiar**
- Agenda compartilhada (consultas, vacinas, aniversários)
- Lista de tarefas com delegação
- Lista de compras colaborativa

✅ **Equilibrar carga mental** ⭐ *Nosso diferencial*
- Dashboard mostra quem está fazendo mais trabalho
- Insights automáticos sobre padrões
- Alertas quando carga fica desbalanceada

✅ **Comunicar como família**
- Convites por link e QR code
- Múltiplos roles (pai, mãe, babá, avó)
- Permissões granulares

---

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+ e npm
- Git
- Expo CLI: `npm install -g expo-cli`
- Supabase CLI (opcional): `npm install -g supabase`

### Instalação

```bash
# 1. Clone o repo
git clone https://github.com/seu-usuario/ninho.git
cd ninho

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais do Supabase

# 4. Rode o app em desenvolvimento
npm run dev

# 5. Abra no seu telefone
# Scan QR code com Expo Go (iOS/Android)
```

### Comandos Principais

```bash
npm run dev              # Expo dev server
npm run dev:ios         # iOS simulator
npm run dev:android     # Android emulator
npm test                # Jest tests
npm run lint            # ESLint
npm run build:preview   # Expo preview build
npm run build:ios       # Production iOS build
npm run build:android   # Production Android build
```

---

## 📚 Documentação

### Para Começar

| Papel | Próximo Passo | Leia |
|-------|---------------|------|
| 👨‍💼 **Product Manager** | Entender o produto completo | [PRODUCT_MAP.md](./PRODUCT_MAP.md) |
| 👨‍💻 **Desenvolvedor** | Entender a arquitetura | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| 🎨 **Designer** | Entender casos de uso | [PRODUCT_MAP.md](./PRODUCT_MAP.md) §3 (Dashboard) |
| 🧪 **QA** | Entender specs | [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) |

### Documentação Principal

- **[INDEX.md](./INDEX.md)** - Índice completo (comece aqui!)
- **[PRODUCT_MAP.md](./PRODUCT_MAP.md)** - Single Source of Truth do produto
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitetura técnica e patterns
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Como implementar features
- **[IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)** - Rastreamento de progresso

---

## 🏗️ Estrutura do Projeto

```
ninho/
├── src/
│   ├── app/                 # Expo Router (file-based navigation)
│   ├── components/          # React components reutilizáveis
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API calls e external services
│   ├── context/             # React Context para state management
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── constants/           # App constants e design tokens
│   └── App.tsx              # Entry point
│
├── supabase/
│   ├── schema.sql           # Database schema
│   ├── migrations/          # Database migrations
│   ├── seed.sql             # Dev seed data
│   └── rls_policies.sql     # Row-level security
│
├── tests/
│   ├── unit/                # Unit tests (Jest)
│   ├── integration/         # Integration tests
│   └── e2e/                 # E2E tests (Detox)
│
├── .env.example             # Environment variables template
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── metro.config.js
├── babel.config.js
└── README.md                # Você está aqui
```

Veja detalhes completos em [ARCHITECTURE.md](./ARCHITECTURE.md#-estrutura-de-pastas).

---

## 💻 Tech Stack

| Layer | Tech | Por quê |
|-------|------|--------|
| **Frontend** | React Native + Expo | Cross-platform (iOS/Android) |
| **Navigation** | Expo Router | File-based routing |
| **Language** | TypeScript | Type safety |
| **Styling** | TailwindCSS + NativeWind | Consistent, web-familiar |
| **Backend** | Supabase | Serverless, Auth built-in |
| **Database** | PostgreSQL | Relational, powerful |
| **Realtime** | Supabase Realtime | Live updates |
| **Auth** | Supabase Auth | Google, Apple, email |
| **Storage** | Supabase Storage | Images, PDFs |
| **Testing** | Jest + React Native Testing Library | Standard |
| **State** | React Context + hooks | Simple for MVP |

---

## 📱 Funcionalidades MVP

### Fase 1-3 (Críticas)
- ✅ Autenticação (email, Google, Apple)
- ✅ Onboarding (criar família, adicionar bebê)
- ✅ Dashboard (resumo diário)
- ✅ Registros do bebê (mamada, sono, troca, etc)
- ✅ Gráficos e estatísticas

### Fase 4-5 (Alta)
- ✅ Agenda compartilhada
- ✅ Tarefas com delegação
- ✅ Lista de compras colaborativa
- ✅ Gerenciar membros da família

### Fase 6-7 (Média)
- ✅ Carga mental (diferencial!)
- ✅ Notificações inteligentes
- ✅ Configurações e preferências
- ✅ Assinatura (planos + pagamento)

### Fase 8+ (Futuro)
- 🔜 IA (resumo, insights, sugestões)
- 🔜 Módulo de crianças maiores
- 🔜 Módulo de casa e saúde
- 🔜 Backoffice administrativo

Veja a lista completa em [PRODUCT_MAP.md](./PRODUCT_MAP.md).

---

## 🔐 Segurança

Ninho segue rigorosamente os padrões de segurança:

- ✅ Senhas hasheadas (Supabase Auth)
- ✅ JWT tokens com refresh automático
- ✅ Row-level security (RLS) no banco
- ✅ Dados sensíveis nunca loggados
- ✅ TLS 1.2+ em todas as comunicações
- ✅ Tokens armazenados em Keychain (iOS) / Keystore (Android)

Veja detalhes em [ARCHITECTURE.md §Authentication](./ARCHITECTURE.md#-authentication-flow).

---

## 🧪 Testes

```bash
# Testes unitários
npm test

# Watch mode
npm test:watch

# Coverage report
npm test:coverage

# Linting
npm run lint
npm run lint:fix
```

Esperamos **> 80% de cobertura de testes** antes de production.

---

## 📊 Roadmap

```
Semana 1-2    ✨ Fase 1: Fundação + Autenticação
Semana 3      ✨ Fase 2: Onboarding
Semana 4-6    ✨ Fase 3: Core (Dashboard + Bebê)
Semana 7-8    ✨ Fase 4: Produtividade (Agenda + Tarefas + Compras)
Semana 9      ✨ Fase 5: Social (Família + Convites)
Semana 10-11  ✨ Fase 6: Diferencial (Carga Mental + Notificações)
Semana 12+    ✨ Fase 7: Sistema (Configurações + Assinatura)
Semana 16+    🔜 Fase 8: Avançado (IA + Backoffice)
```

**MVP esperado em 12-16 semanas.**

---

## 🤝 Como Contribuir

### Workflow de Desenvolvimento

1. **Crie um branch** com seu trabalho:
   ```bash
   git checkout -b feature/UC###-descricao
   ```

2. **Faça commits descritivos**:
   ```bash
   git commit -m "feat(auth): UC002 implement login screen"
   ```

3. **Push e abra PR** com template de descrição

4. **Code review** antes de merge

5. **Atualize checklist** ao completar

### Padrões de Código

- ✅ TypeScript (sem `any`)
- ✅ Componentes funcionais com hooks
- ✅ Testes para toda lógica
- ✅ ESLint + Prettier
- ✅ Nenhum console.log em production
- ✅ Nenhuma secret hardcoded

Veja detalhes em [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md).

---

## 📞 Suporte

### Issues
- 🐛 **Bug** → Abra issue com label `bug`
- 💡 **Feature** → Abra issue com label `enhancement`
- ❓ **Dúvida** → Use Discussions

### Comunicação
- **Daily Standup:** Todos os dias 9h
- **Code Review:** < 4 horas
- **Bloqueadores:** Escalação imediata

### Documentação

Dúvida sobre algo? Procure em:
1. [INDEX.md](./INDEX.md) - Índice de tudo
2. [PRODUCT_MAP.md](./PRODUCT_MAP.md) - Especificação do produto
3. [ARCHITECTURE.md](./ARCHITECTURE.md) - Especificação técnica
4. [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Padrões de código

---

## 📈 Métricas de Sucesso

### MVP Launch (Semana 16)
- [ ] 1.000 famílias cadastradas
- [ ] 4.5+ rating na App Store
- [ ] < 2% crash rate
- [ ] > 80% monthly active users

### 6 Meses
- [ ] 50.000 famílias
- [ ] 30% usando assinatura Pro+
- [ ] < 0.5% crash rate
- [ ] NPS > 50

---

## 📄 Licença

MIT License - veja [LICENSE](./LICENSE) para detalhes.

---

## 👨‍💻 Autor

**Ninho Product Team**  
Estrutura criada para máxima eficiência entre PM e Dev(s).

---

## 🙏 Agradecimentos

Obrigado por contribuir ao Ninho! 🌟

Este projeto foi criado com ❤️ para ajudar famílias a cuidarem melhor de bebês.

---

## 🚀 Comece Agora!

### Passo 1: Setup
```bash
npm install
npm run dev
```

### Passo 2: Leia a Documentação
- PM: [PRODUCT_MAP.md](./PRODUCT_MAP.md)
- Dev: [ARCHITECTURE.md](./ARCHITECTURE.md)

### Passo 3: Escolha uma Tarefa
Veja [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)

### Passo 4: Comece a Cuidar! 🍼

---

**Status:** ✅ Pronto para começar  
**Última atualização:** 2024  
**Versão:** 1.0-beta

---

<div style="text-align: center; margin-top: 40px; font-size: 14px; color: #666;">

Made with 💙 for families who love their babies

[📚 Documentação](./INDEX.md) • [🐛 Issues](https://github.com/seu-usuario/ninho/issues) • [💬 Discussions](https://github.com/seu-usuario/ninho/discussions)

</div>
