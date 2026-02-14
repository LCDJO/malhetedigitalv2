import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  saving: boolean;
  onConfirm: (newPassword: string) => void;
}

export function ResetPasswordDialog({ open, onOpenChange, userName, saving, onConfirm }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isValid = password.length >= 6 && password === confirmPassword;

  const handleConfirm = () => {
    if (isValid) {
      onConfirm(password);
      setPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setPassword(""); setConfirmPassword(""); } onOpenChange(o); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-warning" /> Resetar Senha
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Definir nova senha para <span className="font-medium text-foreground">{userName}</span>
          </p>
          <div className="space-y-1.5">
            <Label>Nova Senha</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>
          <div className="space-y-1.5">
            <Label>Confirmar Senha</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha" />
          </div>
          {password.length > 0 && password.length < 6 && (
            <p className="text-xs text-destructive">A senha deve ter no mínimo 6 caracteres.</p>
          )}
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <p className="text-xs text-destructive">As senhas não coincidem.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!isValid || saving}>
            {saving ? "Salvando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
