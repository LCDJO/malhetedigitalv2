import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogIn, UserPlus, Eye, EyeOff, KeyRound, ArrowLeft } from "lucide-react";
import BootstrapWizard from "@/components/BootstrapWizard";

type AuthView = "login" | "signup" | "forgot" | "reset";

export default function Auth() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();

  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsBootstrap, setNeedsBootstrap] = useState<boolean | null>(null);

  // Check if bootstrap is needed
  useEffect(() => {
    supabase.functions.invoke("bootstrap", { method: "GET" }).then(({ data }) => {
      setNeedsBootstrap(data?.needs_bootstrap ?? false);
    }).catch(() => setNeedsBootstrap(false));
  }, []);

  // Detect password recovery event from URL
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setView("reset");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Redirect authenticated users based on role
  useEffect(() => {
    if (authLoading || !user) return;
    if (view === "reset") return; // Don't redirect during password reset

    // Role-based redirect
    const getRedirectPath = () => {
      if (!role) return "/";
      switch (role) {
        case "administrador":
        case "veneravel":
          return "/";
        case "secretario":
          return "/secretaria";
        case "tesoureiro":
          return "/tesouraria";
        default:
          return "/";
      }
    };

    navigate(getRedirectPath(), { replace: true });
  }, [user, role, authLoading, navigate, view]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Preencha todos os campos."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials"
        ? "Email ou senha incorretos."
        : error.message);
    } else {
      toast.success("Login realizado com sucesso.");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName.trim()) { toast.error("Preencha todos os campos."); return; }
    if (password.length < 6) { toast.error("A senha deve ter no mínimo 6 caracteres."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Conta criada! Verifique seu email para confirmar o cadastro.");
      setView("login");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Informe seu email."); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Email de redefinição enviado! Verifique sua caixa de entrada.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) { toast.error("Preencha todos os campos."); return; }
    if (password.length < 6) { toast.error("A senha deve ter no mínimo 6 caracteres."); return; }
    if (password !== confirmPassword) { toast.error("As senhas não coincidem."); return; }
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

  // Password toggle button
  const PwToggle = () => (
    <button
      type="button"
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      onClick={() => setShowPw(!showPw)}
    >
      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  // Show loading while checking bootstrap
  if (needsBootstrap === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Show bootstrap wizard if system needs initialization
  if (needsBootstrap) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <BootstrapWizard onComplete={() => setNeedsBootstrap(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground font-serif font-bold text-2xl shadow-lg">
            M
          </div>
          <h1 className="text-2xl font-serif font-bold tracking-tight">Malhete Digital</h1>
          <p className="text-sm text-muted-foreground">Sistema de Gestão Maçônica</p>
        </div>

        <Card>
          {/* Forgot Password View */}
          {view === "forgot" && (
            <>
              <CardHeader className="pb-3">
                <button
                  onClick={() => setView("login")}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 w-fit"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Voltar ao login
                </button>
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold text-sm">Redefinir Senha</p>
                    <p className="text-xs text-muted-foreground">Informe seu email para receber o link</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
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

          {/* Reset Password View (after clicking email link) */}
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
                    <Label htmlFor="reset-password">Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="reset-password"
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
                    <Label htmlFor="reset-confirm">Confirmar Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="reset-confirm"
                        type={showPw ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a nova senha"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Salvando..." : "Redefinir Senha"}
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {/* Login / Signup Tabs */}
          {(view === "login" || view === "signup") && (
            <Tabs value={view} onValueChange={(v) => setView(v as AuthView)}>
              <CardHeader className="pb-3">
                <TabsList className="w-full bg-muted/60">
                  <TabsTrigger value="login" className="flex-1 gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    <LogIn className="h-3.5 w-3.5" />
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="flex-1 gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    <UserPlus className="h-3.5 w-3.5" />
                    Criar Conta
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                <TabsContent value="login" className="mt-0">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="login-email">Email</Label>
                      <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" autoComplete="email" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="login-password">Senha</Label>
                      <div className="relative">
                        <Input id="login-password" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" autoComplete="current-password" />
                        <PwToggle />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
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
                </TabsContent>

                <TabsContent value="signup" className="mt-0">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-name">Nome Completo</Label>
                      <Input id="signup-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ex: João da Silva" maxLength={100} autoComplete="name" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" autoComplete="email" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-password">Senha</Label>
                      <div className="relative">
                        <Input id="signup-password" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
                        <PwToggle />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Criando conta..." : "Criar Conta"}
                    </Button>
                    <p className="text-[10px] text-muted-foreground text-center">
                      Após o cadastro, um administrador precisará atribuir seu cargo.
                    </p>
                  </form>
                </TabsContent>
              </CardContent>
            </Tabs>
          )}
        </Card>
      </div>
    </div>
  );
}
