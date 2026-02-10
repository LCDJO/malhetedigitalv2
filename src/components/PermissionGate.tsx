import { type ReactNode } from "react";
import { useAuth, type PermissionAction } from "@/contexts/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PermissionGateProps {
  module: string;
  action: PermissionAction;
  children: ReactNode;
  /** Fallback when permission is denied. Defaults to disabled children with tooltip. */
  fallback?: ReactNode;
  /** If true, hides children entirely instead of disabling. */
  hide?: boolean;
  /** Custom tooltip message when disabled. */
  message?: string;
}

/**
 * Wraps children and disables/hides them based on user permissions.
 * Use around buttons or action areas that require specific permissions.
 *
 * Usage:
 * <PermissionGate module="tesouraria" action="write">
 *   <Button onClick={handleDelete}>Excluir</Button>
 * </PermissionGate>
 */
export function PermissionGate({
  module,
  action,
  children,
  fallback,
  hide = false,
  message,
}: PermissionGateProps) {
  const { hasPermission } = useAuth();
  const allowed = hasPermission(module, action);

  if (allowed) return <>{children}</>;

  if (hide) return null;

  if (fallback) return <>{fallback}</>;

  const tooltipMsg =
    message || "Você não tem permissão para realizar esta ação.";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex opacity-40 cursor-not-allowed pointer-events-none select-none">
          {children}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-[200px]">
        {tooltipMsg}
      </TooltipContent>
    </Tooltip>
  );
}
