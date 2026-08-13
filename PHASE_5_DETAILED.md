# 👥 Fase 5: Social — Família + Permissões + Convites

**Status:** ✅ Completa  
**Duração:** 1 semana (Semana 9)  
**Objetivo:** Módulo Social com gestão de membros, roles e convites  
**Pré-requisito:** Fase 4 ✅ Completa

---

## 📋 Visão Geral da Fase 5

### O que foi criado

1. **Service expandido** (`familyService.ts`)
   - `listMembers(familyId)` — lista todos os membros
   - `updateMemberRole(memberId, role)` — altera permissão (RLS garante admin)
   - `removeMember(memberId)` — desvincula membro da família
   - `createInviteWithRole(familyId, role)` — gera link com role customizado

2. **Hook `useFamilyMembers`**
   - Estado: `members`, `loading`, `error`, `inviteLink`
   - Ações: `load`, `generateInvite`, `updateRole`, `removeMember`

3. **Componentes de UI**
   - `RoleBadge` — badge colorido por role (admin/parent/babysitter/guest)
   - `MemberCard` — card de membro com avatar, nome, role, crown para admin

4. **Telas**
   - `(family)/index.tsx` — lista de membros com header da família
   - `(family)/invite.tsx` — gerar link com seleção de role + copiar/compartilhar
   - `(family)/member/[id].tsx` — perfil completo + alterar role + remover

5. **Integração**
   - `(more)/index.tsx` → navega para `(family)` ao clicar "Membros da família"
   - `(app)/_layout.tsx` → rota `(family)` registrada (sem tab, navegação modal)
   - `hooks/index.ts` → exporta `useFamilyMembers`

---

## 🎯 UCs da Fase 5

| UC    | Nome                  | Tela                               | Status |
|-------|-----------------------|------------------------------------|--------|
| UC027 | Convidar membro       | `(family)/invite.tsx`              | ✅     |
| UC028 | Alterar permissão     | `(family)/member/[id].tsx`         | ✅     |
| UC029 | Remover membro        | `(family)/member/[id].tsx`         | ✅     |

---

## 📁 Arquivos Criados / Modificados

```
src/
├── services/family/familyService.ts      ✅ expandido (listMembers, updateMemberRole, removeMember, createInviteWithRole)
├── hooks/
│   ├── useFamilyMembers.ts               ✅ novo
│   └── index.ts                          ✅ exporta useFamilyMembers
├── components/family/
│   ├── RoleBadge.tsx                     ✅ novo
│   ├── MemberCard.tsx                    ✅ novo
│   └── index.ts                          ✅ novo
└── app/(app)/
    ├── _layout.tsx                       ✅ rota (family) registrada
    ├── (more)/index.tsx                  ✅ navega para (family)
    └── (family)/
        ├── _layout.tsx                   ✅ novo
        ├── index.tsx                     ✅ novo (UC027)
        ├── invite.tsx                    ✅ novo (UC027)
        └── member/
            └── [id].tsx                  ✅ novo (UC028 + UC029)
```

---

## 🔐 Segurança

- `updateMemberRole` e `removeMember` dependem de **RLS no Supabase** para garantir que somente admins executem
- A UI também esconde as ações para não-admins (camada de UX)
- Links de convite têm expiração de 7 dias (controlado pelo RPC `generate_invite_link`)

---

## 🎨 Design

- Paleta escura padrão (`bgPage`, `bgCard`, `border`)
- `RoleBadge` usa a cor do role como borda/fundo
- `MemberCard` exibe ícone de coroa (👑) para o admin
- Tela de convite mostra seletor de role visual antes de gerar o link

---

## ⏭️ Próxima Fase

**Fase 6: Diferencial** (Semanas 10–11)

- Carga Mental (UC024–UC026): pontuação, equilíbrio, histórico
- Notificações: push + in-app
- IA Insights: análise de padrões, resumo semanal
