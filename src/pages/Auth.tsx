import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { LogIn, UserPlus, Eye, EyeOff, KeyRound, ArrowLeft, Building2, User, MapPin, Phone } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";
import BootstrapWizard from "@/components/BootstrapWizard";

type AuthView = "login" | "signup" | "forgot" | "reset";

// Potencias and ritos are fetched from the database

const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

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
  const [banners, setBanners] = useState<{ id: string; tipo: string; media_url: string; duracao_segundos: number }[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [bannerFading, setBannerFading] = useState(false);

  // Lodge registration fields
  const [lodgeName, setLodgeName] = useState("");
  const [lodgeNumber, setLodgeNumber] = useState("");
  const [potencia, setPotencia] = useState("");
  const [rito, setRito] = useState("");
  const [orient, setOrient] = useState("");
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numeroEndereco, setNumeroEndereco] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [telefone, setTelefone] = useState("");

  // Catalogs from DB
  const [potenciasList, setPotenciasList] = useState<{ id: string; nome: string; sigla: string }[]>([]);
  const [ritosList, setRitosList] = useState<{ id: string; nome: string }[]>([]);
  const [potenciaRitosMap, setPotenciaRitosMap] = useState<Record<string, { id: string; nome: string }[]>>({});

  // Check if bootstrap is needed + fetch banners
  useEffect(() => {
    supabase.functions.invoke("bootstrap", { method: "GET" }).then(({ data }) => {
      setNeedsBootstrap(data?.needs_bootstrap ?? false);
    }).catch(() => setNeedsBootstrap(false));

    // Fetch catalogs
    supabase.from("potencias" as any).select("id, nome, sigla").eq("ativo", true).order("nome").then(({ data }) => {
      if (data) setPotenciasList(data as any);
    });

    // Fetch potencia_ritos combinations
    supabase.from("potencia_ritos" as any).select("potencia_id, rito_id, ritos:rito_id(id, nome)").eq("ativo", true).then(({ data }) => {
      if (data) {
        const map: Record<string, { id: string; nome: string }[]> = {};
        (data as any[]).forEach((r: any) => {
          if (!map[r.potencia_id]) map[r.potencia_id] = [];
          if (r.ritos) map[r.potencia_id].push(r.ritos);
        });
        setPotenciaRitosMap(map);
      }
    });

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
            (b.pagina === "todos" || b.pagina?.includes("loja"))
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
    supabase.from("banner_impressions").insert({ banner_id: b.id, pagina: "loja" }).then(() => {});
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

  // Detect password recovery event from URL
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setView("reset");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Redirect authenticated users based on role (block advertisers)
  useEffect(() => {
    if (authLoading || !user) return;
    if (view === "reset") return;

    // Check if user is an advertiser — if so, redirect to advertiser portal
    supabase.rpc("is_advertiser", { _user_id: user.id }).then(({ data: isAdv }) => {
      if (isAdv) {
        navigate("/anunciante/auth", { replace: true });
        return;
      }

      const getRedirectPath = () => {
        if (!role) return "/dashboard";
        switch (role) {
          case "superadmin": return "/admin";
          case "administrador": return "/dashboard";
          default: return "/dashboard";
        }
      };

      navigate(getRedirectPath(), { replace: true });
    });
  }, [user, role, authLoading, navigate, view]);

  // CEP auto-fill
  const handleCepBlur = async () => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setRua(data.logradouro || "");
        setBairro(data.bairro || "");
        setCidade(data.localidade || "");
        setEstado(data.uf || "");
      }
    } catch {
      // ignore
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Preencha todos os campos."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      toast.error(error.message === "Invalid login credentials"
        ? "Email ou senha incorretos."
        : error.message);
      return;
    }

    // Block advertisers from accessing lodge panel
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

    setLoading(false);
    toast.success("Login realizado com sucesso.");
  };

  const handleRegisterLodge = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate lodge fields
    if (!lodgeName.trim() || !lodgeNumber.trim() || !potencia || !rito || !orient.trim()) {
      toast.error("Preencha todas as informações obrigatórias da Loja.");
      return;
    }
    // Validate admin fields
    if (!fullName.trim() || !email.trim() || !password) {
      toast.error("Preencha todas as informações do administrador.");
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
    const { data, error } = await supabase.functions.invoke("register-lodge", {
      body: {
        lodge_name: lodgeName.trim(),
        lodge_number: lodgeNumber.trim(),
        potencia,
        rito,
        orient: orient.trim(),
        cep: cep.trim(),
        rua: rua.trim(),
        numero_endereco: numeroEndereco.trim(),
        complemento: complemento.trim(),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        estado,
        telefone: telefone.trim(),
        full_name: fullName.trim(),
        email: email.trim(),
        password,
      },
    });
    setLoading(false);

    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Erro ao cadastrar.");
      return;
    }

    toast.success("Loja cadastrada com sucesso! Verifique seu email para confirmar o cadastro.");
    setView("login");
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

  const PwToggle = () => (
    <button
      type="button"
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      onClick={() => setShowPw(!showPw)}
    >
      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  if (needsBootstrap === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (needsBootstrap) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <BootstrapWizard onComplete={() => setNeedsBootstrap(false)} />
      </div>
    );
  }

  // ─── SIGNUP VIEW (Full-page form) ─────────────────────────────
  if (view === "signup") {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <button
              onClick={() => setView("login")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 mx-auto sm:mx-0 w-fit"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar ao login
            </button>
            <div className="flex justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground font-serif font-bold text-2xl shadow-lg">
                M
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
              Cadastre sua Loja e Crie sua Conta
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Comece a modernizar a gestão da sua Loja Maçônica
            </p>
          </div>

          <form onSubmit={handleRegisterLodge} className="space-y-6">
            {/* Seção 1: Informações da Loja */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-serif font-semibold">Informações da Loja</h2>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="lodge-name">Nome da Loja *</Label>
                    <Input
                      id="lodge-name"
                      value={lodgeName}
                      onChange={(e) => setLodgeName(e.target.value)}
                      placeholder="Ex: ARLS União e Progresso"
                      maxLength={150}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lodge-number">Número da Loja *</Label>
                    <Input
                      id="lodge-number"
                      value={lodgeNumber}
                      onChange={(e) => setLodgeNumber(e.target.value)}
                      placeholder="Ex: 236"
                      maxLength={20}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Potência Maçônica *</Label>
                    <Select value={potencia} onValueChange={(v) => { setPotencia(v); setRito(""); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a Potência" />
                      </SelectTrigger>
                      <SelectContent>
                        {potenciasList.map((p) => (
                          <SelectItem key={p.id} value={p.nome}>
                            {p.sigla ? `${p.sigla} — ${p.nome}` : p.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Rito *</Label>
                    <Select value={rito} onValueChange={setRito} disabled={!potencia}>
                      <SelectTrigger>
                        <SelectValue placeholder={potencia ? "Selecione o Rito" : "Selecione a Potência primeiro"} />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          const selectedPot = potenciasList.find(p => p.nome === potencia);
                          const filteredRitos = selectedPot ? (potenciaRitosMap[selectedPot.id] || []) : [];
                          return filteredRitos.length > 0
                            ? filteredRitos.map((r) => (
                                <SelectItem key={r.id} value={r.nome}>{r.nome}</SelectItem>
                              ))
                            : <SelectItem value="__none" disabled>Nenhum rito disponível</SelectItem>;
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="orient">Oriente *</Label>
                  <Input
                    id="orient"
                    value={orient}
                    onChange={(e) => setOrient(e.target.value)}
                    placeholder="Ex: Manaus"
                    maxLength={100}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      onBlur={handleCepBlur}
                      placeholder="Ex: 01000-000"
                      maxLength={9}
                    />
                    <p className="text-[10px] text-muted-foreground">Digite o CEP para preenchimento automático</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="telefone">WhatsApp / Telefone</Label>
                    <Input
                      id="telefone"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="Ex: (11) 99999-9999"
                      maxLength={20}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="rua">Rua</Label>
                    <Input
                      id="rua"
                      value={rua}
                      onChange={(e) => setRua(e.target.value)}
                      placeholder="Ex: Rua dos Maçons"
                      maxLength={200}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="numero-endereco">Número</Label>
                    <Input
                      id="numero-endereco"
                      value={numeroEndereco}
                      onChange={(e) => setNumeroEndereco(e.target.value)}
                      placeholder="Ex: 123"
                      maxLength={10}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      value={complemento}
                      onChange={(e) => setComplemento(e.target.value)}
                      placeholder="Ex: Sala 1"
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      placeholder="Ex: Centro"
                      maxLength={100}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      placeholder="Ex: São Paulo"
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Estado</Label>
                    <Select value={estado} onValueChange={setEstado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS.map((uf) => (
                          <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seção 2: Informações do Administrador */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-serif font-semibold">Informações do Administrador</h2>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-name">Nome Completo *</Label>
                    <Input
                      id="admin-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ex: João da Silva"
                      maxLength={100}
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-email">Email *</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-password">Senha *</Label>
                    <div className="relative">
                      <Input
                        id="admin-password"
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
                    <Label htmlFor="admin-confirm">Confirmar Senha *</Label>
                    <div className="relative">
                      <Input
                        id="admin-confirm"
                        type={showPw ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a senha"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <Button type="submit" className="w-full h-12 text-base gap-2" disabled={loading}>
              {loading ? "Cadastrando..." : (
                <>
                  <Building2 className="h-4 w-4" />
                  Cadastrar Loja e Criar Conta
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <button type="button" onClick={() => setView("login")} className="text-primary hover:underline font-medium">
                Faça login aqui
              </button>
            </p>
          </form>
        </div>
      </div>
    );
  }

  // ─── LOGIN / FORGOT / RESET VIEWS (Split layout) ─────────────
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
                Bem-Vindo!
              </h1>
              <p className="text-sm text-muted-foreground tracking-wide">
                Sistema de Gestão Maçônica — Malhete Digital
              </p>
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

            {/* Reset Password View */}
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

            {/* Login View */}
            {view === "login" && (
              <>
                <CardHeader className="pb-3">
                  <p className="font-semibold text-sm">Acesse sua conta</p>
                </CardHeader>
                <CardContent>
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
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => setView("signup")}
                      >
                        <Building2 className="h-4 w-4" />
                        Cadastre sua Loja
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full text-muted-foreground"
                        onClick={() => navigate("/portal/auth")}
                      >
                        Portal do Irmão
                      </Button>
                    </div>
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
          </div>
        </div>

        {/* Ad slot below login form */}
        <div className="w-full max-w-md mx-auto mt-4">
          <AdSlot slotSlug="login_bottom" page="login" aspectRatio="25%" />
        </div>

        {/* Footer */}
        <div className="w-full pt-6 pb-2 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Malhete Digital — Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Right side - Banner */}
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
                  Gestão Maçônica Moderna
                </h2>
                <p className="text-muted-foreground text-base leading-relaxed">
                  Gerencie sua Loja com eficiência, transparência e segurança. Controle financeiro, secretaria, tesouraria e muito mais em um só lugar.
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
    </div>
  );
}
