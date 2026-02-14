import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Shield, ShieldCheck, ShieldOff, Copy, KeyRound } from "lucide-react";

export function TwoFactorSettings() {
  const { session } = useAuth();
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState(false);
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const apiCall = useCallback(
    async (action: string, method: string, body?: Record<string, unknown>) => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-2fa?action=${action}`;
      const resp = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return { ok: resp.ok, data: await resp.json() };
    },
    [session?.access_token]
  );

  const checkStatus = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    const { ok, data } = await apiCall("status", "GET");
    if (ok) setTwoFAEnabled(data.enabled);
    setLoading(false);
  }, [session?.access_token, apiCall]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const startSetup = async () => {
    const { ok, data } = await apiCall("setup", "POST");
    if (ok) {
      setSecret(data.secret);
      setSetupMode(true);
    } else {
      toast.error(data.error || "Erro ao iniciar configuração");
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) {
      toast.error("Digite o código de 6 dígitos");
      return;
    }
    setVerifying(true);
    const { ok, data } = await apiCall("verify", "POST", { code });
    setVerifying(false);
    if (ok && data.success) {
      setTwoFAEnabled(true);
      setSetupMode(false);
      setBackupCodes(data.backup_codes || []);
      toast.success("2FA ativado com sucesso!");
    } else {
      toast.error(data.error || "Código incorreto");
    }
  };

  const disable2FA = async () => {
    const { ok, data } = await apiCall("disable", "POST");
    if (ok) {
      setTwoFAEnabled(false);
      setBackupCodes([]);
      toast.success("2FA desativado");
    } else {
      toast.error(data.error || "Erro ao desativar");
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast.success("Chave copiada!");
  };

  if (loading) {
    return (
      <Card className="border-border/60">
        <CardContent className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5 text-accent" />
          Autenticação em Dois Fatores (2FA)
        </CardTitle>
        <CardDescription>
          Proteja sua conta com autenticação TOTP.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            {twoFAEnabled ? (
              <ShieldCheck className="h-5 w-5 text-primary" />
            ) : (
              <ShieldOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                {twoFAEnabled ? "2FA está ativado" : "2FA não está ativado"}
              </p>
              <p className="text-xs text-muted-foreground">
                {twoFAEnabled
                  ? "Sua conta está protegida com autenticação TOTP."
                  : "Recomendamos ativar para maior segurança."}
              </p>
            </div>
          </div>
          <Badge variant={twoFAEnabled ? "default" : "secondary"}>
            {twoFAEnabled ? "Ativo" : "Inativo"}
          </Badge>
        </div>

        {!twoFAEnabled && !setupMode && (
          <Button onClick={startSetup} className="gap-2">
            <KeyRound className="h-4 w-4" />
            Configurar 2FA
          </Button>
        )}

        {twoFAEnabled && !setupMode && (
          <Button variant="destructive" size="sm" onClick={disable2FA}>
            Desativar 2FA
          </Button>
        )}

        {setupMode && (
          <div className="space-y-4 pt-2">
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm font-semibold">1. Copie a chave secreta</Label>
              <p className="text-xs text-muted-foreground">
                Abra seu app autenticador (Google Authenticator, Authy, etc.) e adicione manualmente com a chave abaixo:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded text-xs font-mono break-all">
                  {secret}
                </code>
                <Button variant="outline" size="icon" onClick={copySecret} title="Copiar">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">2. Digite o código gerado</Label>
              <p className="text-xs text-muted-foreground">
                Insira o código de 6 dígitos exibido no seu autenticador.
              </p>
              <div className="flex items-center gap-2 max-w-xs">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-lg font-mono tracking-widest"
                />
                <Button onClick={verifyCode} disabled={verifying || code.length !== 6}>
                  {verifying ? "Verificando..." : "Ativar"}
                </Button>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={() => setSetupMode(false)}>
              Cancelar
            </Button>
          </div>
        )}

        {backupCodes.length > 0 && (
          <div className="space-y-2 pt-2">
            <Separator />
            <Label className="text-sm font-semibold text-destructive">
              ⚠️ Códigos de Recuperação
            </Label>
            <p className="text-xs text-muted-foreground">
              Guarde esses códigos em local seguro. Cada código pode ser usado uma única vez para acessar sua conta caso perca o autenticador.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((bc, i) => (
                <code key={i} className="bg-muted px-3 py-1.5 rounded text-xs font-mono text-center">
                  {bc}
                </code>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
