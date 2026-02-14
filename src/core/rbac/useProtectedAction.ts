import { useCallback } from "react";
import { useAuth } from "@/core/auth";
import type { PermissionAction } from "@/core/auth/types";
import { toast } from "sonner";
import { useSensitiveAction } from "@/components/ConfirmSensitiveAction";

interface ProtectedActionConfig {
  module: string;
  action: PermissionAction;
  title: string;
  description: string;
  confirmLabel?: string;
  requireTypedConfirmation?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
}

/**
 * Hook that gates an action behind permission check + confirmation dialog.
 */
export function useProtectedAction(config: ProtectedActionConfig) {
  const { hasPermission } = useAuth();

  const { trigger: openDialog, dialogProps, ConfirmDialog } = useSensitiveAction({
    title: config.title,
    description: config.description,
    confirmLabel: config.confirmLabel,
    requireTypedConfirmation: config.requireTypedConfirmation,
    destructive: config.destructive,
    onConfirm: config.onConfirm,
  });

  const execute = useCallback(() => {
    if (!hasPermission(config.module, config.action)) {
      toast.error("Você não tem permissão para realizar esta ação.");
      return;
    }
    openDialog();
  }, [hasPermission, config.module, config.action, openDialog]);

  return { execute, dialogProps, ConfirmDialog };
}
