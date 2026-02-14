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
  const [banners, setBanners] = useState<{ tipo: string; media_url: string; duracao_segundos: number }[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [bannerFading, setBannerFading] = useState(false);

  // Fetch banners
  useEffect(() => {
    supabase
      .from("login_banners")
      .select("tipo, media_url, duracao_segundos")
      .eq("ativo", true)
      .lte("data_inicio", new Date().toISOString())
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          const now = new Date();
          const active = (data as any[]).filter((b) => !b.data_fim || new Date(b.data_fim) > now);
          setBanners(active);
        }
      });
  }, []);

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

  // Redirect authenticated users to portal
  useEffect(() => {
    if (authLoading || !user) return;
    if (view === "reset" || view === "force_change" || view === "first_access") return;
    navigate("/portal", { replace: true });
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

    await logAttempt(identifier, true);

    const currentUser = (await supabase.auth.getUser()).data.user;
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
  const bannerSection = (
    <div className="hidden lg:flex lg:w-1/2 p-4">
      <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-muted/60 overflow-hidden">
        {banners.length > 0 ? (
          <>
            {banners.map((b, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  i === currentBannerIndex && !bannerFading ? "opacity-100" : "opacity-0"
                }`}
              >
                {b.tipo === "video" ? (
                  <video
                    src={b.media_url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <img
                    src={b.media_url}
                    alt="Banner"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                )}
              </div>
            ))}
            {banners.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setBannerFading(true); setTimeout(() => { setCurrentBannerIndex(i); setBannerFading(false); }, 300); }}
                    className={`rounded-full transition-all duration-300 ${
                      i === currentBannerIndex
                        ? "w-6 h-2 bg-primary-foreground"
                        : "w-2 h-2 bg-primary-foreground/40"
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 rounded-2xl" />
            <div className="relative z-10 text-center space-y-6 p-12 max-w-lg">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/15 text-primary font-serif font-bold text-4xl">
                M
              </div>
              <h2 className="text-3xl font-serif font-bold text-foreground/90">
                Portal do Irmão
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed">
                Acompanhe sua trajetória maçônica, financeiro e prestação de contas em um só lugar.
              </p>
              <div className="flex justify-center gap-8 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">100%</div>
                  <div className="text-xs text-muted-foreground">Digital</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">LGPD</div>
                  <div className="text-xs text-muted-foreground">Compatível</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">24/7</div>
                  <div className="text-xs text-muted-foreground">Disponível</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ─── FORM CARD CONTENT ────────────────────────────────────────
  const formCard = (
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

      {/* Force Password Change */}
      {view === "force_change" && (
        <>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-warning" />
              <div>
                <p className="font-semibold text-sm">Criar Nova Senha</p>
                <p className="text-xs text-muted-foreground">Sua senha atual é provisória. Defina uma senha pessoal.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForceChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nova Senha</Label>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
              <Button type="submit" className="w-full gap-1.5" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                {loading ? "Salvando..." : "Definir Nova Senha"}
              </Button>
            </form>
          </CardContent>
        </>
      )}

      {/* Login */}
      {view === "login" && !blocked && (
        <>
          <CardHeader className="pb-3">
            <p className="font-semibold text-sm">Acesse o Portal</p>
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
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => setView("forgot")}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Esqueceu sua senha?
                </button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">ou</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-1.5"
                  onClick={() => setView("first_access")}
                >
                  <UserPlus className="h-4 w-4" />
                  Primeiro Acesso
                </Button>
              </div>
            </form>
          </CardContent>
        </>
      )}

      {/* First Access */}
      {view === "first_access" && (
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
              <UserPlus className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-sm">Primeiro Acesso</p>
                <p className="text-xs text-muted-foreground">Informe seu CPF e CIM para ativar seu acesso</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFirstAccess} className="space-y-4">
              <div className="space-y-1.5">
                <Label>CPF</Label>
                <Input
                  value={firstAccessCpf}
                  onChange={(e) => setFirstAccessCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label>CIM</Label>
                <Input
                  value={firstAccessCim}
                  onChange={(e) => setFirstAccessCim(e.target.value)}
                  placeholder="Número do CIM"
                  autoComplete="off"
                />
              </div>
              <Button type="submit" className="w-full gap-1.5" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {loading ? "Validando..." : "Ativar Acesso"}
              </Button>
            </form>
          </CardContent>
        </>
      )}
    </Card>
  );

  // ─── SPLIT LAYOUT ─────────────────────────────────────────────
  return (
    <div className="relative flex h-screen w-full bg-background">
      {/* Left side - Auth */}
      <div className="flex h-full w-full lg:w-1/2 flex-col items-center justify-between px-6 py-8">
        {/* Logo top */}
        <div className="flex w-full flex-1 items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground font-serif font-bold text-2xl shadow-lg">
            M
          </div>
        </div>

        {/* Form area */}
        <div className="z-10 flex w-full items-center md:max-w-[90%] 2xl:max-w-[50%]">
          <div className="flex w-full flex-col gap-4">
            <div>
              <h1 className="mb-1 text-xl font-serif font-bold tracking-tight text-foreground md:text-2xl xl:text-3xl">
                Bem-Vindo, Irmão!
              </h1>
              <p className="text-sm text-muted-foreground tracking-wide">
                Portal do Irmão — Malhete Digital
              </p>
            </div>

            {formCard}

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground text-xs"
                onClick={() => navigate("/auth")}
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Painel Administrativo
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full pt-6 pb-2 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Malhete Digital — Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Right side - Banner */}
      {bannerSection}
    </div>
  );
}
