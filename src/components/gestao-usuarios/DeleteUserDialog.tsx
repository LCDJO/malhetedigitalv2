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
      title="Remover Acesso de Administrador"
      description={`Esta ação removerá a permissão de administrador do sistema de "${userName}". O cadastro do membro será mantido na Secretaria.`}
      requireTypedConfirmation="REMOVER"
      confirmLabel="Remover Permissão"
      destructive
      onConfirm={onConfirm}
    />
  );
}
