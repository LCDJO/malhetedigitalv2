Implemente no projeto o perfil de acesso `portal_irmao` para usuários do Portal do Irmão.

Requisitos:
1) Criar role `portal_irmao` (enum + tipagens + labels no frontend + disponível em Gestão de Usuários).
2) No Portal do Irmão (Meu Cadastro), permitir editar apenas:
- telefone celular (`phone`)
- foto do perfil (`avatar_url`, com upload no bucket `member-photos`)
- endereço (`address`)
- e-mail (`email`)
3) Proibir edição de qualquer outro campo de `members` para `portal_irmao`.
4) Garantir que o usuário do portal só atualize o próprio registro.
5) Criar policies de storage para `member-photos` permitindo ao `portal_irmao` apenas arquivos no prefixo `{auth.uid()}/...`.
6) Atualizar a edge function `manage-portal-user` para atribuir automaticamente a role `portal_irmao` ao criar/resetar acesso.
7) Manter Secretaria sem gravação financeira (somente consulta).

Entregue com:
- migration SQL completa,
- arquivos frontend alterados,
- resumo de mudanças,
- validação (build/lint) e critérios de aceite atendidos.
