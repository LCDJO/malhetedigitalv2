import { ConfirmSensitiveAction } from "@/components/ConfirmSensitiveAction";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  onConfirm: () => void;
}

export function DeleteUserDialog({ open, onOpenChange, userName, onConfirm }: Props) {
  return (
    <ConfirmSensitiveAction
      open={open}
      onOpenChange={onOpenChange}
      title="Excluir Usuário"
      description={`Esta ação excluirá permanentemente o usuário "${userName}" da plataforma, removendo seu acesso, perfil e vínculo com a Loja. Esta ação é irreversível.`}
      requireTypedConfirmation="EXCLUIR"
      confirmLabel="Excluir Permanentemente"
      destructive
      onConfirm={onConfirm}
    />
  );
}
