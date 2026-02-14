import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogIn, UserPlus, Eye, EyeOff, KeyRound, ArrowLeft } from "lucide-react";

type AuthView = "login" | "signup" | "forgot" | "reset";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setView("reset");
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    if (view === "reset") return;
    navigate("/tenants", { replace: true });
  }, [user, authLoading, navigate, view]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Preencha todos os campos."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message === "Invalid login credentials" ? "Email ou senha incorretos." : error.message);
    else toast.success("Login realizado!");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName.trim()) { toast.error("Preencha todos os campos."); return; }
    if (password.length < 6) { toast.error("Senha deve ter no mínimo 6 caracteres."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName.trim() }, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Conta criada! Verifique seu email."); setView("login"); }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Informe seu email."); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth` });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Email de redefinição enviado!");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) { toast.error("Preencha todos os campos."); return; }
    if (password.length < 6) { toast.error("Senha mínima: 6 caracteres."); return; }
    if (password !== confirmPassword) { toast.error("Senhas não coincidem."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Senha redefinida!"); setView("login"); }
  };

  const PwToggle = () => (
    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPw(!showPw)}>
      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <div className="min-h-screen flex bg-background">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground font-serif font-bold text-2xl shadow-lg">G</div>
            <h1 className="text-2xl font-serif font-bold tracking-tight">Gamify Recorrência</h1>
            <p className="text-sm text-muted-foreground">SaaS de gamificação para recorrência</p>
          </div>

          <Card>
            {view === "forgot" && (
              <>
                <CardHeader className="pb-3">
                  <button onClick={() => setView("login")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 w-fit">
                    <ArrowLeft className="h-3.5 w-3.5" /> Voltar
                  </button>
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-primary" />
                    <div><p className="font-semibold text-sm">Redefinir Senha</p><p className="text-xs text-muted-foreground">Informe seu email</p></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" /></div>
                    <Button type="submit" className="w-full" disabled={loading}>{loading ? "Enviando..." : "Enviar Link"}</Button>
                  </form>
                </CardContent>
              </>
            )}

            {view === "reset" && (
              <>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-primary" />
                    <div><p className="font-semibold text-sm">Nova Senha</p></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div><Label>Nova Senha</Label><div className="relative"><Input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} /><PwToggle /></div></div>
                    <div><Label>Confirmar</Label><Input type={showPw ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
                    <Button type="submit" className="w-full" disabled={loading}>{loading ? "Salvando..." : "Redefinir"}</Button>
                  </form>
                </CardContent>
              </>
            )}

            {(view === "login" || view === "signup") && (
              <Tabs value={view} onValueChange={(v) => setView(v as AuthView)}>
                <CardHeader className="pb-3">
                  <TabsList className="w-full bg-muted/60">
                    <TabsTrigger value="login" className="flex-1 gap-1.5"><LogIn className="h-3.5 w-3.5" /> Entrar</TabsTrigger>
                    <TabsTrigger value="signup" className="flex-1 gap-1.5"><UserPlus className="h-3.5 w-3.5" /> Criar Conta</TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent>
                  <TabsContent value="login" className="mt-0">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" /></div>
                      <div><Label>Senha</Label><div className="relative"><Input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" /><PwToggle /></div></div>
                      <Button type="submit" className="w-full" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</Button>
                      <button type="button" onClick={() => setView("forgot")} className="w-full text-center text-xs text-muted-foreground hover:text-foreground">Esqueceu sua senha?</button>
                    </form>
                  </TabsContent>
                  <TabsContent value="signup" className="mt-0">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div><Label>Nome Completo</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="João da Silva" /></div>
                      <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" /></div>
                      <div><Label>Senha</Label><div className="relative"><Input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mín. 6 caracteres" /><PwToggle /></div></div>
                      <Button type="submit" className="w-full" disabled={loading}>{loading ? "Criando..." : "Criar Conta"}</Button>
                    </form>
                  </TabsContent>
                </CardContent>
              </Tabs>
            )}
          </Card>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10" />
        <div className="relative z-10 text-center space-y-6 p-12 max-w-lg">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/15 text-primary font-serif font-bold text-4xl">G</div>
          <h2 className="text-3xl font-serif font-bold text-foreground/90">Gamifique sua Recorrência</h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            XP, rankings, carteiras digitais e afiliados. Tudo multi-tenant, pronto para escalar.
          </p>
          <div className="flex justify-center gap-8 pt-4">
            <div className="text-center"><div className="text-2xl font-bold text-primary">Multi</div><div className="text-xs text-muted-foreground">Tenant</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-primary">XP</div><div className="text-xs text-muted-foreground">Gamificação</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-primary">API</div><div className="text-xs text-muted-foreground">REST</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
