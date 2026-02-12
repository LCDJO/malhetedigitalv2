import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, ArrowLeft, LogIn, ShieldAlert, Loader2 } from "lucide-react";

type PortalAuthView = "login" | "forgot" | "reset";

const MAX_ATTEMPTS = 5;

function isCpf(value: string): boolean {
  return /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(value.trim());
}

function normalizeCpf(value: string): string {
  return value.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export default function PortalAuth() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [view, setView] = useState<PortalAuthView>("login");
  const [identifier, setIdentifier] = useState(""); // email or CPF
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);

  // Detect password recovery event
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setView("reset");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Redirect authenticated users to portal
  useEffect(() => {
    if (authLoading || !user) return;
    if (view === "reset") return;
    navigate("/portal", { replace: true });
  }, [user, authLoading, navigate, view]);

  const logAttempt = async (id: string, success: boolean) => {
    await supabase.from("login_attempts").insert({
      identifier: id,
      success,
    });
  };

  const checkBlocked = async (id: string): Promise<boolean> => {
    const { data } = await supabase.rpc("count_failed_attempts", { _identifier: id });
    if (data !== null && data >= MAX_ATTEMPTS) {
      setBlocked(true);
      return true;
    }
    return false;
  };

  const resolveEmail = async (id: string): Promise<string | null> => {
    if (isCpf(id)) {
      const cpf = normalizeCpf(id);
      const { data } = await supabase.rpc("lookup_email_by_cpf", { _cpf: cpf });
      if (!data) {
        toast.error("CPF não encontrado ou membro inativo.");
        return null;
      }
      return data as string;
    }
    return id.trim().toLowerCase();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error("Preencha todos os campos.");
      return;
    }

    setLoading(true);

    // Check lockout
    const isBlocked = await checkBlocked(identifier);
    if (isBlocked) {
      setLoading(false);
      return;
    }

    // Resolve email from CPF if needed
    const email = await resolveEmail(identifier);
    if (!email) {
      await logAttempt(identifier, false);
      setLoading(false);
      return;
    }

    // Check if active member
    const { data: isActive } = await supabase.rpc("is_active_member", { _email: email });
    if (!isActive) {
      toast.error("Apenas irmãos com cadastro ativo podem acessar o Portal.");
      await logAttempt(identifier, false);
      setLoading(false);
      return;
    }

    // Authenticate
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      await logAttempt(identifier, false);
      const { data: attempts } = await supabase.rpc("count_failed_attempts", { _identifier: identifier });
      const remaining = MAX_ATTEMPTS - (attempts ?? 0);

      if (remaining <= 0) {
        setBlocked(true);
      } else {
        toast.error(`Credenciais inválidas. ${remaining} tentativa(s) restante(s).`);
      }
      setLoading(false);
      return;
    }

    // Success
    await logAttempt(identifier, true);

    // Log to audit
    await supabase.from("audit_log").insert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      user_name: email,
      action: "PORTAL_LOGIN",
      target_table: "auth",
      details: { method: isCpf(identifier) ? "cpf" : "email" },
    });

    toast.success("Bem-vindo ao Portal do Irmão!");
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      toast.error("Informe seu e-mail.");
      return;
    }

    setLoading(true);
    const email = await resolveEmail(identifier);
    if (!email) {
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/portal/auth`,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("E-mail de redefinição enviado! Verifique sua caixa de entrada.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error("Preencha todos os campos.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Senha redefinida com sucesso!");
      setView("login");
    }
  };

  const PwToggle = () => (
    <button
      type="button"
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      onClick={() => setShowPw(!showPw)}
    >
      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground font-serif font-bold text-2xl shadow-lg">
            M
          </div>
          <h1 className="text-2xl font-serif font-bold tracking-tight">Portal do Irmão</h1>
          <p className="text-sm text-muted-foreground">Acesse seus dados, financeiro e prestação de contas</p>
        </div>

        <Card>
          {/* Blocked state */}
          {blocked && view === "login" && (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-destructive">
                  <ShieldAlert className="h-5 w-5" />
                  <div>
                    <p className="font-semibold text-sm">Acesso Bloqueado</p>
                    <p className="text-xs text-muted-foreground">Muitas tentativas inválidas.</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Seu acesso foi temporariamente bloqueado após {MAX_ATTEMPTS} tentativas inválidas.
                  Aguarde 30 minutos ou redefina sua senha.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { setBlocked(false); setView("forgot"); }}
                >
                  Redefinir Senha
                </Button>
              </CardContent>
            </>
          )}

          {/* Forgot Password */}
          {view === "forgot" && (
            <>
              <CardHeader className="pb-3">
                <button
                  onClick={() => { setView("login"); setBlocked(false); }}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 w-fit"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Voltar ao login
                </button>
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold text-sm">Redefinir Senha</p>
                    <p className="text-xs text-muted-foreground">Informe seu e-mail ou CPF</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>E-mail ou CPF</Label>
                    <Input
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="seu@email.com ou 000.000.000-00"
                      autoComplete="email"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Enviando..." : "Enviar Link de Redefinição"}
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {/* Reset Password */}
          {view === "reset" && (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold text-sm">Nova Senha</p>
                    <p className="text-xs text-muted-foreground">Defina sua nova senha de acesso</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Nova Senha</Label>
                    <div className="relative">
                      <Input
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        autoComplete="new-password"
                      />
                      <PwToggle />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Confirmar Nova Senha</Label>
                    <Input
                      type={showPw ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      autoComplete="new-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Salvando..." : "Redefinir Senha"}
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {/* Login */}
          {view === "login" && !blocked && (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <LogIn className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold text-sm">Acessar Portal</p>
                    <p className="text-xs text-muted-foreground">Use seu e-mail ou CPF cadastrado</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>E-mail ou CPF</Label>
                    <Input
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="seu@email.com ou 000.000.000-00"
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Senha</Label>
                    <div className="relative">
                      <Input
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••"
                        autoComplete="current-password"
                      />
                      <PwToggle />
                    </div>
                  </div>
                  <Button type="submit" className="w-full gap-1.5" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setView("forgot")}
                    className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Esqueceu sua senha?
                  </button>
                </form>
              </CardContent>
            </>
          )}
        </Card>

        <p className="text-[10px] text-muted-foreground text-center">
          Ao acessar, você concorda com os Termos de Uso e Política de Privacidade da Loja.
        </p>
      </div>
    </div>
  );
}
