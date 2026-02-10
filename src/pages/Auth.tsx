import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogIn, UserPlus, Eye, EyeOff } from "lucide-react";

export default function Auth() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

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
      setTab("login");
    }
  };

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
          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
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
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPw(!showPw)}>
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
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
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPw(!showPw)}>
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
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
        </Card>
      </div>
    </div>
  );
}
