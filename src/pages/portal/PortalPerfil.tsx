import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Key, Mail, Chrome } from "lucide-react";
import { TwoFactorSettings } from "@/components/TwoFactorSettings";

export default function PortalPerfil() {
  const { user, profile } = useAuth();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [linking, setLinking] = useState(false);

  const identities = user?.identities || [];
  const isGoogleLinked = identities.some(identity => identity.provider === 'google');

  const handleLinkGoogle = async () => {
    try {
      setLinking(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/portal/perfil`,
          queryParams: {
            prompt: 'select_account'
          }
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error("Erro ao vincular conta Google: " + (error.message || "Tente novamente."));
      setLinking(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPw || newPw.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("As senhas não conferem.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSaving(false);

    if (error) {
      toast.error("Erro ao alterar senha. Tente novamente.");
      return;
    }

    toast.success("Senha alterada com sucesso!");
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-serif font-bold">Perfil e Segurança</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie suas credenciais de acesso</p>
      </div>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-sans flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Informações da Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">Nome</Label>
            <p className="text-sm font-medium">{profile?.full_name ?? "—"}</p>
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">E-mail</Label>
            <p className="text-sm font-medium">{user?.email ?? "—"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Google Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-sans flex items-center gap-2">
            <Chrome className="h-4 w-4" />
            Vincular Conta Google
          </CardTitle>
          <CardDescription>
            Conecte sua conta Google para facilitar o acesso ao portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isGoogleLinked ? (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md border border-green-100">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-sm font-medium">Sua conta Google já está vinculada!</span>
            </div>
          ) : (
            <Button 
              variant="outline" 
              onClick={handleLinkGoogle} 
              disabled={linking}
              className="w-full sm:w-auto gap-2"
            >
              {linking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Chrome className="h-4 w-4" />
              )}
              Vincular Google
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-sans flex items-center gap-2">
            <Key className="h-4 w-4" />
            Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nova senha *</Label>
            <Input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Confirmar nova senha *</Label>
            <Input
              type="password"
              placeholder="Repita a nova senha"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
            />
          </div>
          <Button onClick={handleChangePassword} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Alterar Senha
          </Button>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <TwoFactorSettings />
    </div>
  );
}

