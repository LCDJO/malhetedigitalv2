import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, ArrowLeft, LogIn, ShieldAlert, Loader2, UserPlus } from "lucide-react";

type PortalAuthView = "login" | "forgot" | "reset" | "force_change" | "first_access";

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
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [forceChangeEmail, setForceChangeEmail] = useState<string | null>(null);
  const [firstAccessCpf, setFirstAccessCpf] = useState("");
  const [firstAccessCim, setFirstAccessCim] = useState("");

  // Banners
  const [banners, setBanners] = useState<{ id: string; tipo: string; media_url: string; duracao_segundos: number }[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [bannerFading, setBannerFading] = useState(false);

  // Fetch banners
  useEffect(() => {
    supabase
      .from("login_banners")
      .select("id, tipo, media_url, duracao_segundos, pagina, data_fim, grupo")
      .eq("ativo", true)
      .eq("grupo", "login")
      .lte("data_inicio", new Date().toISOString())
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          const now = new Date();
          const active = (data as any[]).filter((b) =>
            (!b.data_fim || new Date(b.data_fim) > now) &&
            (b.pagina === "todos" || b.pagina?.includes("portal"))
          );
          setBanners(active);
        }
      });
  }, []);

  // Track impressions
  useEffect(() => {
    if (banners.length === 0) return;
    const b = banners[currentBannerIndex];
    if (!b) return;
    supabase.from("banner_impressions").insert({ banner_id: b.id, pagina: "portal" }).then(() => {});
  }, [banners, currentBannerIndex]);

  // Rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const current = banners[currentBannerIndex];
    const duration = (current?.duracao_segundos || 8) * 1000;

    const timer = setTimeout(() => {
      setBannerFading(true);
      setTimeout(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
        setBannerFading(false);
      }, 500);
    }, duration);

    return () => clearTimeout(timer);
  }, [banners, currentBannerIndex]);

  // Detect password recovery event
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setView("reset");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Redirect authenticated users to portal (block advertisers)
  useEffect(() => {
    if (authLoading || !user) return;
    if (view === "reset" || view === "force_change" || view === "first_access") return;

    supabase.rpc("is_advertiser", { _user_id: user.id }).then(({ data: isAdv }) => {
      if (isAdv) {
        navigate("/anunciante/auth", { replace: true });
        return;
      }
      navigate("/portal", { replace: true });
    });
  }, [user, authLoading, navigate, view]);

  const logAttempt = async (id: string, success: boolean) => {
    await supabase.from("login_attempts").insert({ identifier: id, success });
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

  const handleFirstAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    const cpfClean = firstAccessCpf.replace(/\D/g, "");
    if (cpfClean.length !== 11) {
      toast.error("Informe um CPF válido.");
      return;
    }
    if (!firstAccessCim.trim()) {
      toast.error("Informe seu CIM.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("first-access", {
        body: { cpf: firstAccessCpf, cim: firstAccessCim },
      });

      if (error || data?.error) {
        toast.error(data?.error || "Erro ao validar primeiro acesso.");
        setLoading(false);
        return;
      }

      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        setForceChangeEmail(data.email);
        setView("force_change");
        toast.info("Acesso validado! Defina sua senha pessoal.");
      }
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    }

    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error("Preencha todos os campos.");
      return;
    }

    setLoading(true);

    const isBlocked = await checkBlocked(identifier);
    if (isBlocked) { setLoading(false); return; }

    const email = await resolveEmail(identifier);
    if (!email) { await logAttempt(identifier, false); setLoading(false); return; }

    const { data: isActive } = await supabase.rpc("is_active_member", { _email: email });
    if (!isActive) {
      toast.error("Apenas irmãos com cadastro ativo podem acessar o Portal.");
      await logAttempt(identifier, false);
      setLoading(false);
      return;
    }

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

    // Block advertisers from accessing Portal do Irmão
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (currentUser) {
      const { data: isAdv } = await supabase.rpc("is_advertiser", { _user_id: currentUser.id });
      if (isAdv) {
        await supabase.auth.signOut();
        setLoading(false);
        toast.error("Esta conta é de anunciante. Acesse pelo Portal do Anunciante.");
        return;
      }
    }

    await logAttempt(identifier, true);

    await supabase.from("audit_log").insert({
      user_id: currentUser?.id,
      user_name: email,
      action: "PORTAL_LOGIN",
      target_table: "auth",
      details: { method: isCpf(identifier) ? "cpf" : "email" },
    });

    const { data: memberData } = await supabase
      .from("members")
      .select("force_password_change")
      .eq("email", email)
      .eq("status", "ativo")
      .maybeSingle();

    if (memberData?.force_password_change) {
      setForceChangeEmail(email);
      setView("force_change");
      setPassword("");
      toast.info("Sua senha é provisória. Por favor, defina uma nova senha.");
      setLoading(false);
      return;
    }

    toast.success("Bem-vindo ao Portal do Irmão!");
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) { toast.error("Informe seu e-mail."); return; }
    setLoading(true);
    const email = await resolveEmail(identifier);
    if (!email) { setLoading(false); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/portal/auth`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); }
    else { toast.success("E-mail de redefinição enviado! Verifique sua caixa de entrada."); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) { toast.error("Preencha todos os campos."); return; }
    if (password.length < 6) { toast.error("A senha deve ter no mínimo 6 caracteres."); return; }
    if (password !== confirmPassword) { toast.error("As senhas não coincidem."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); }
    else { toast.success("Senha redefinida com sucesso!"); setView("login"); }
  };

  const handleForceChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) { toast.error("Preencha todos os campos."); return; }
    if (newPassword.length < 6) { toast.error("A senha deve ter no mínimo 6 caracteres."); return; }
    if (newPassword !== confirmPassword) { toast.error("As senhas não coincidem."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { toast.error(error.message); setLoading(false); return; }
    if (forceChangeEmail) {
      await supabase.from("members").update({ force_password_change: false }).eq("email", forceChangeEmail);
    }
    setLoading(false);
    toast.success("Senha atualizada com sucesso! Bem-vindo ao Portal.");
    setView("login");
    setNewPassword("");
    setConfirmPassword("");
    setForceChangeEmail(null);
    navigate("/portal", { replace: true });
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

  // ─── BANNER SECTION (reusable) ────────────────────────────────
  const bannerSection = null;

  // ─── FORM CARD CONTENT ────────────────────────────────────────
  const formCard = (
    <div className="flex w-full flex-col gap-3">
      <Card className="rounded-sm border-[#dbdbdb] bg-white shadow-none">
        <CardHeader className="pt-10 pb-6 flex flex-col items-center gap-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-serif font-bold text-2xl">
            M
          </div>
          <h1 className="text-xl font-serif font-bold text-foreground">
            Portal do Irmão
          </h1>
        </CardHeader>
        
        <CardContent className="px-10 pb-6">
          {/* Blocked state */}
          {blocked && view === "login" && (
            <div className="mb-4 space-y-3 text-center">
              <div className="flex items-center justify-center gap-2 text-destructive">
                <ShieldAlert className="h-5 w-5" />
                <p className="font-semibold text-sm">Acesso Bloqueado</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Seu acesso foi temporariamente bloqueado após {MAX_ATTEMPTS} tentativas inválidas.
                Aguarde 30 minutos ou redefina sua senha.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => { setBlocked(false); setView("forgot"); }}
              >
                Redefinir Senha
              </Button>
            </div>
          )}

          {/* Forgot Password */}
          {view === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <div className="flex flex-col items-center gap-2 mb-4">
                <KeyRound className="h-10 w-10 text-foreground/20" />
                <p className="font-semibold text-sm">Problemas ao entrar?</p>
                <p className="text-center text-xs text-muted-foreground">
                  Insira o seu email ou CPF e enviaremos um link para você recuperar o acesso à sua conta.
                </p>
              </div>
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="E-mail ou CPF"
                className="h-9 bg-[#fafafa] border-[#dbdbdb] text-xs focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-gray-400"
                autoComplete="email"
              />
              <Button 
                type="submit" 
                className="w-full h-8 text-xs font-semibold bg-[#0095f6] hover:bg-[#1877f2] transition-colors" 
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar link para login"}
              </Button>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[#dbdbdb]" />
                </div>
                <div className="relative flex justify-center text-[10px] font-semibold uppercase">
                  <span className="bg-white px-4 text-[#8e8e8e]">ou</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setView("login")}
                className="w-full text-center text-xs font-semibold text-foreground hover:opacity-70 transition-opacity"
              >
                Voltar ao login
              </button>
            </form>
          )}

          {/* Reset Password */}
          {view === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div className="flex flex-col items-center gap-2 mb-4">
                <KeyRound className="h-10 w-10 text-foreground/20" />
                <p className="font-semibold text-sm">Criar nova senha</p>
              </div>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nova senha"
                  className="h-9 bg-[#fafafa] border-[#dbdbdb] text-xs"
                />
                <PwToggle />
              </div>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar nova senha"
                  className="h-9 bg-[#fafafa] border-[#dbdbdb] text-xs"
                />
                <PwToggle />
              </div>
              <Button type="submit" className="w-full h-8 text-xs font-semibold bg-[#0095f6] hover:bg-[#1877f2]" disabled={loading}>
                {loading ? "Salvando..." : "Redefinir Senha"}
              </Button>
            </form>
          )}

          {/* Login */}
          {view === "login" && !blocked && (
            <form onSubmit={handleLogin} className="space-y-2">
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="E-mail ou CPF"
                className="h-9 bg-[#fafafa] border-[#dbdbdb] text-xs focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-gray-400"
                autoComplete="email"
              />
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  className="h-9 bg-[#fafafa] border-[#dbdbdb] text-xs focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-gray-400"
                  autoComplete="current-password"
                />
                <PwToggle />
              </div>
              <Button 
                type="submit" 
                className="w-full h-8 text-xs font-semibold bg-[#0095f6] hover:bg-[#1877f2] transition-colors mt-2" 
                disabled={loading}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[#dbdbdb]" />
                </div>
                <div className="relative flex justify-center text-[10px] font-semibold uppercase">
                  <span className="bg-white px-4 text-[#8e8e8e]">ou</span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setView("forgot")}
                className="w-full text-center text-xs text-[#00376b] hover:opacity-70 transition-opacity mt-2"
              >
                Esqueceu a senha?
              </button>
            </form>
          )}

          {/* First Access */}
          {view === "first_access" && (
            <form onSubmit={handleFirstAccess} className="space-y-3">
              <div className="flex flex-col items-center gap-2 mb-4">
                <UserPlus className="h-10 w-10 text-foreground/20" />
                <p className="font-semibold text-sm">Primeiro Acesso</p>
                <p className="text-center text-xs text-muted-foreground">
                  Informe seu CPF e CIM para ativar seu acesso no portal.
                </p>
              </div>
              <Input
                value={firstAccessCpf}
                onChange={(e) => setFirstAccessCpf(e.target.value)}
                placeholder="CPF (000.000.000-00)"
                className="h-9 bg-[#fafafa] border-[#dbdbdb] text-xs"
              />
              <Input
                value={firstAccessCim}
                onChange={(e) => setFirstAccessCim(e.target.value)}
                placeholder="Número do CIM"
                className="h-9 bg-[#fafafa] border-[#dbdbdb] text-xs"
              />
              <Button type="submit" className="w-full h-8 text-xs font-semibold bg-[#0095f6] hover:bg-[#1877f2]" disabled={loading}>
                {loading ? "Validando..." : "Ativar Acesso"}
              </Button>
              <button
                type="button"
                onClick={() => setView("login")}
                className="w-full text-center text-xs font-semibold text-foreground mt-2"
              >
                Voltar ao login
              </button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-sm border-[#dbdbdb] bg-white shadow-none py-5">
        <div className="text-center text-sm">
          {view === "first_access" ? (
            <p>
              Já tem uma conta?{" "}
              <button
                onClick={() => setView("login")}
                className="font-semibold text-[#0095f6] hover:text-[#1877f2]"
              >
                Conecte-se
              </button>
            </p>
          ) : (
            <p>
              Ainda não ativou seu acesso?{" "}
              <button
                onClick={() => setView("first_access")}
                className="font-semibold text-[#0095f6] hover:text-[#1877f2]"
              >
                Ativar agora
              </button>
            </p>
          )}
        </div>
      </Card>

      <div className="flex flex-col items-center gap-4 mt-2">
        <p className="text-sm">Obtenha o aplicativo.</p>
        <div className="flex gap-2 h-10">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Google_Play_Store_badge_EN.svg/2560px-Google_Play_Store_badge_EN.svg.png" 
            alt="Google Play" 
            className="h-full cursor-pointer"
          />
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Download_on_the_App_Store_Badge.svg/2560px-Download_on_the_App_Store_Badge.svg.png" 
            alt="App Store" 
            className="h-full cursor-pointer"
          />
        </div>
      </div>
    </div>
  );

  // ─── INSTAGRAM STYLE LAYOUT ─────────────────────────────────────
  return (
    <div className="min-h-screen w-full bg-[#fafafa] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[350px]">
        {formCard}

        <div className="mt-8 flex flex-col items-center gap-4 text-[#8e8e8e] text-[12px]">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            <span>Sobre</span>
            <span>Ajuda</span>
            <span>Imprensa</span>
            <span>API</span>
            <span>Carreiras</span>
            <span>Privacidade</span>
            <span>Termos</span>
            <span>Localizações</span>
            <span>Idioma</span>
          </div>
          <p>© {new Date().getFullYear()} Malhete Digital — Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
