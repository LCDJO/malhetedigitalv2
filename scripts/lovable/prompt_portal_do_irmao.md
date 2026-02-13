# Prompt para Lovable — Perfil `portal_irmao` com edição no Portal do Irmão

Quero que você implemente **completo** no projeto o perfil de acesso **`portal_irmao`** e a funcionalidade de autoatendimento no **Portal do Irmão**.

## Objetivo
Criar o perfil `portal_irmao` para usuários do portal e permitir que, no Portal do Irmão, o usuário atualize **somente**:
- telefone celular (`phone`)
- foto do perfil (`avatar_url` + upload no bucket `member-photos`)
- endereço (`address`)
- e-mail (`email`)

## Regras obrigatórias
1. **Secretaria não grava financeiro** (somente consulta no contexto financeiro).
2. O perfil `portal_irmao` **não** pode ganhar acesso aos módulos administrativos (`dashboard`, `secretaria`, `tesouraria`, `chancelaria`, `configuracoes`).
3. Usuário do portal só pode editar **o próprio registro** em `members`.
4. Usuário do portal não pode alterar outros campos de `members` (cpf, cim, grau, datas, status etc).
5. Upload de foto do portal deve ser restrito ao próprio usuário no storage (`member-photos`) usando prefixo de caminho por `auth.uid()`.

---

## Implementações esperadas

### 1) Banco (SQL / migrations)
Crie migration para:
- Adicionar valor `portal_irmao` ao enum `public.app_role`.
- Atualizar `get_user_role` para incluir `portal_irmao` na prioridade (mais baixo que admin/venerável/secretário/tesoureiro etc).
- Criar policy de `UPDATE` em `public.members` para `portal_irmao`, limitando por:
  - usuário autenticado,
  - role `portal_irmao`,
  - e-mail do auth igual ao e-mail do membro,
  - membro ativo.
- Criar função + trigger `BEFORE UPDATE` em `members` para bloquear alterações de campos fora de:
  - `phone`, `avatar_url`, `address`, `email`.
- Criar policies de storage para `member-photos` permitindo ao `portal_irmao` apenas inserir/atualizar/remover arquivos do próprio prefixo: `{auth.uid()}/...`.
- Backfill opcional seguro: associar role `portal_irmao` para usuários auth já vinculados por e-mail a `members` ativos.

### 2) Edge Function `manage-portal-user`
Atualize a função para, no `create/reset` de acesso ao portal:
- garantir atribuição do role `portal_irmao` em `user_roles` (upsert por `user_id + role`),
- manter comportamento atual de criação/reset de senha,
- manter `force_password_change`.

### 3) Frontend (Portal)
Na tela de cadastro do portal (`Meu Cadastro`), adicionar formulário editável com:
- Foto do perfil (upload de imagem, até 2MB)
- E-mail
- Telefone celular
- Endereço
- Botão `Salvar alterações`

Requisitos de UX:
- Mostrar loading durante upload/salvamento.
- Bloquear botão salvar quando não houver alterações.
- Exibir toast de sucesso/erro.
- Se e-mail mudar, tentar sincronizar com `supabase.auth.updateUser({ email })` e informar necessidade de confirmação por e-mail.

### 4) Tipagens e permissões no app
- Incluir `portal_irmao` no tipo de role do frontend.
- Incluir label em `roleLabels`.
- Disponibilizar `portal_irmao` em Gestão de Usuários para atribuição manual, sem ampliar permissões administrativas.

---

## Arquivos alvo (referência)
- `src/contexts/AuthContext.tsx`
- `src/integrations/supabase/types.ts`
- `src/pages/GestaoUsuarios.tsx`
- `src/hooks/usePortalMember.ts`
- `src/pages/portal/PortalCadastro.tsx`
- `supabase/functions/manage-portal-user/index.ts`
- nova migration em `supabase/migrations/`

---

## Critérios de aceite (obrigatório)
1. Usuário com role `portal_irmao` consegue editar no portal apenas: telefone, foto, endereço e e-mail.
2. Tentativas de alterar outros campos de `members` pelo portal falham com erro de permissão/regra.
3. Upload de foto no portal funciona somente no próprio diretório no bucket `member-photos`.
4. Gestão de Usuários mostra role `portal_irmao`.
5. `manage-portal-user` atribui role `portal_irmao` automaticamente em criação/reset.
6. Build e lint sem erros (ou justificar qualquer erro legado não relacionado).

---

## Entrega
Ao final, me mostre:
- lista de arquivos alterados,
- resumo curto por arquivo,
- SQL/policies criadas,
- evidência de validação (build/lint/testes executados).
