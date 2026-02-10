import { useState, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert } from "lucide-react";

interface ConfirmSensitiveActionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  requireTypedConfirmation?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmSensitiveAction({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  requireTypedConfirmation,
  destructive = false,
  onConfirm,
}: ConfirmSensitiveActionProps) {
  const [typedValue, setTypedValue] = useState("");
  const [loading, setLoading] = useState(false);

  const canConfirm = requireTypedConfirmation
    ? typedValue.toUpperCase() === requireTypedConfirmation.toUpperCase()
    : true;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      setTypedValue("");
      onOpenChange(false);
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) setTypedValue("");
    onOpenChange(v);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 font-serif">
            <ShieldAlert className={`h-5 w-5 ${destructive ? "text-destructive" : "text-primary"}`} />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {requireTypedConfirmation && (
          <div className="space-y-2 py-2">
            <Label className="text-xs text-muted-foreground">
              Digite <span className="font-semibold text-foreground">{requireTypedConfirmation}</span> para confirmar
            </Label>
            <Input
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder={requireTypedConfirmation}
              autoFocus
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {loading ? "Processando..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook for gating sensitive actions behind permission + confirmation
interface UseSensitiveActionOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  requireTypedConfirmation?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function useSensitiveAction(options: UseSensitiveActionOptions) {
  const [open, setOpen] = useState(false);

  const trigger = useCallback(() => {
    setOpen(true);
  }, []);

  const dialogProps: ConfirmSensitiveActionProps = {
    open,
    onOpenChange: setOpen,
    title: options.title,
    description: options.description,
    confirmLabel: options.confirmLabel,
    requireTypedConfirmation: options.requireTypedConfirmation,
    destructive: options.destructive,
    onConfirm: options.onConfirm,
  };

  return { trigger, dialogProps, ConfirmDialog: ConfirmSensitiveAction };
}
