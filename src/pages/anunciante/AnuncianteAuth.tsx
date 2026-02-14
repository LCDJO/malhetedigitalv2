import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  Megaphone,
  Building2,
  FileText,
  ShieldCheck,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AuthView = "login" | "register" | "forgot" | "verify";

function validateCNPJ(cnpj: string): boolean {
  const clean = cnpj.replace(/\D/g, "");
  if (clean.length !== 14) return false;
  if (/^(\d)\1+$/.test(clean)) return false;
  let sum = 0;
  let weight = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) sum += parseInt(clean[i]) * weight[i];
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(clean[12]) !== digit) return false;
  sum = 0;
  weight = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) sum += parseInt(clean[i]) * weight[i];
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return parseInt(clean[13]) === digit;
}

function validateCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return false;
  if (/^(\d)\1+$/.test(clean)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(clean[i]) * (10 - i);
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(clean[9]) !== digit) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(clean[i]) * (11 - i);
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return parseInt(clean[10]) === digit;
}

export default function AnuncianteAuth() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [view, setView] = useState<AuthView>("login");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register - Empresa
  const [regCompanyName, setRegCompanyName] = useState("");
  const [regTradingName, setRegTradingName] = useState("");
  const [regDocType, setRegDocType] = useState<"cnpj" | "cpf">("cnpj");
  const [regDocNumber, setRegDocNumber] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regWebsite, setRegWebsite] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPw, setRegConfirmPw] = useState("");

  // Register - Representante Legal
  const [repName, setRepName] = useState("");
  const [repCpf, setRepCpf] = useState("");
  const [repEmail, setRepEmail] = useState("");
  const [repPhone, setRepPhone] = useState("");
  const [repAddress, setRepAddress] = useState("");

  // Verification
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyUserId, setVerifyUserId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Check if user is already an approved advertiser
  useEffect(() => {
    if (authLoading || !user) return;
    supabase
      .from("advertisers")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.status === "aprovado") {
          navigate("/anunciante", { replace: true });
        } else if (data?.status === "pendente") {
          // Stay on page, show message
        }
      });
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Preencha todos os campos."); return; }
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      toast.error("Credenciais inválidas.");
      setLoading(false);
      return;
    }

    // Check advertiser status
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (uid) {
      const { data } = await supabase
        .from("advertisers")
        .select("status")
        .eq("user_id", uid)
        .maybeSingle();

      if (!data) {
        toast.error("Esta conta não está vinculada a nenhum anunciante.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (data.status === "pendente") {
        toast.info("Seu cadastro está em análise. Aguarde a aprovação.");
        setLoading(false);
        return;
      }
      if (data.status === "rejeitado") {
        toast.error("Seu cadastro foi rejeitado. Entre em contato com o suporte.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }
      if (data.status === "suspenso") {
        toast.error("Sua conta está suspensa. Entre em contato com o suporte.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      toast.success("Bem-vindo ao Portal do Anunciante!");
      navigate("/anunciante", { replace: true });
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regCompanyName || !regDocNumber || !regEmail || !regPassword) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }

    // Validate document
    if (regDocType === "cnpj" && !validateCNPJ(regDocNumber)) {
      toast.error("CNPJ inválido.");
      return;
    }
    if (regDocType === "cpf" && !validateCPF(regDocNumber)) {
      toast.error("CPF inválido.");
      return;
    }

    if (regPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (regPassword !== regConfirmPw) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    // 1. Create auth user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
      options: {
        emailRedirectTo: window.location.origin + "/anunciante/auth",
        data: { full_name: regCompanyName },
      },
    });

    if (signUpError) {
      toast.error(signUpError.message);
      setLoading(false);
      return;
    }

    const userId = signUpData.user?.id;
    if (!userId) {
      toast.error("Erro ao criar conta.");
      setLoading(false);
      return;
    }

    // 2. Create advertiser record via edge function (bypasses RLS for unconfirmed users)
    const { data: advData, error: advError } = await supabase.functions.invoke("register-advertiser", {
      body: {
        user_id: userId,
        company_name: regCompanyName.trim(),
        trading_name: regTradingName.trim() || null,
        document_type: regDocType,
        document_number: regDocNumber.replace(/\D/g, ""),
        email: regEmail.trim().toLowerCase(),
        phone: regPhone.trim() || null,
        website: regWebsite.trim() || null,
        representative_name: repName.trim() || null,
        representative_cpf: repCpf.replace(/\D/g, "") || null,
        representative_email: repEmail.trim().toLowerCase() || null,
        representative_phone: repPhone.trim() || null,
        representative_address: repAddress.trim() || null,
      },
    });

    if (advError || advData?.error) {
      toast.error("Erro ao registrar anunciante: " + (advData?.error || advError?.message));
      setLoading(false);
      return;
    }

    // 3. Send verification code via email
    const trimmedEmail = regEmail.trim().toLowerCase();
    const { data: codeData, error: codeError } = await supabase.functions.invoke("send-verification-code", {
      body: { user_id: userId, email: trimmedEmail },
    });

    if (codeError || codeData?.error) {
      console.error("Erro ao enviar código:", codeData?.error || codeError?.message);
      toast.warning("Cadastro criado, mas houve erro ao enviar o código de verificação. Tente reenviar.");
    } else {
      toast.success("Código de verificação enviado para " + trimmedEmail);
    }

    setVerifyEmail(trimmedEmail);
    setVerifyUserId(userId);
    setResendCooldown(60);
    setView("verify");
    setLoading(false);
  };

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("send-verification-code", {
      body: { user_id: verifyUserId, email: verifyEmail },
    });
    setLoading(false);
    if (error || data?.error) {
      toast.error("Erro ao reenviar código: " + (data?.error || error?.message));
    } else {
      toast.success("Novo código enviado!");
      setResendCooldown(60);
      setOtpCode("");
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast.error("Digite o código de 6 dígitos.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("verify-email-code", {
      body: { email: verifyEmail, code: otpCode.trim() },
    });
    setLoading(false);

    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Código inválido ou expirado.");
      return;
    }

    toast.success("E-mail verificado com sucesso! Aguarde a aprovação do seu cadastro.");
    setView("login");
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Informe seu e-mail."); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/anunciante/auth`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("E-mail de redefinição enviado!");
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
    <div className="min-h-screen flex bg-background">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 p-4">
        <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 overflow-hidden">
          <div className="relative z-10 text-center space-y-6 p-12 max-w-lg">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <Megaphone className="h-10 w-10" />
            </div>
            <h2 className="text-3xl font-serif font-bold text-foreground/90">
              Portal do Anunciante
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              Crie campanhas, gerencie seus criativos e acompanhe métricas de desempenho em tempo real.
            </p>
            <div className="flex justify-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">Ads</div>
                <div className="text-xs text-muted-foreground">Self-service</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">CTR</div>
                <div className="text-xs text-muted-foreground">Métricas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">24/7</div>
                <div className="text-xs text-muted-foreground">Disponível</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center lg:text-left space-y-1">
            <div className="flex items-center gap-2 justify-center lg:justify-start">
              <Megaphone className="h-6 w-6 text-accent" />
              <span className="text-lg font-bold text-foreground tracking-tight">Malhete Ads</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {view === "login" && "Acesse sua conta de anunciante"}
              {view === "register" && "Cadastre-se como anunciante"}
              {view === "forgot" && "Recupere sua senha"}
              {view === "verify" && "Verifique seu e-mail"}
            </p>
          </div>

          <Card>
            {/* LOGIN */}
            {view === "login" && (
              <CardContent className="pt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@empresa.com"
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
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="pr-10"
                      />
                      <PwToggle />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Entrar
                  </Button>
                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setView("forgot")}
                    >
                      Esqueci minha senha
                    </button>
                    <button
                      type="button"
                      className="text-accent hover:text-accent/80 font-medium transition-colors"
                      onClick={() => setView("register")}
                    >
                      Cadastre-se
                    </button>
                  </div>
                </form>
              </CardContent>
            )}

            {/* REGISTER */}
            {view === "register" && (
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
                    <Building2 className="h-5 w-5 text-accent" />
                    <div>
                      <p className="font-semibold text-sm">Cadastro de Anunciante</p>
                      <p className="text-xs text-muted-foreground">Preencha os dados da empresa</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Razão Social *</Label>
                      <Input value={regCompanyName} onChange={(e) => setRegCompanyName(e.target.value)} placeholder="Empresa Ltda." />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Nome Fantasia</Label>
                      <Input value={regTradingName} onChange={(e) => setRegTradingName(e.target.value)} placeholder="Nome comercial" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1.5">
                        <Label>Tipo *</Label>
                        <Select value={regDocType} onValueChange={(v) => setRegDocType(v as "cnpj" | "cpf")}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cnpj">CNPJ</SelectItem>
                            <SelectItem value="cpf">CPF</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label>{regDocType === "cnpj" ? "CNPJ" : "CPF"} *</Label>
                        <Input
                          value={regDocNumber}
                          onChange={(e) => setRegDocNumber(e.target.value)}
                          placeholder={regDocType === "cnpj" ? "00.000.000/0000-00" : "000.000.000-00"}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>E-mail *</Label>
                      <Input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="contato@empresa.com" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label>Telefone</Label>
                        <Input value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="(00) 00000-0000" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Website</Label>
                        <Input value={regWebsite} onChange={(e) => setRegWebsite(e.target.value)} placeholder="https://..." />
                      </div>
                    </div>

                    {/* Representante Legal */}
                    <div className="pt-3 mt-3 border-t border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <UserCheck className="h-4 w-4 text-accent" />
                        <p className="font-semibold text-sm">Representante Legal</p>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label>Nome Completo</Label>
                          <Input value={repName} onChange={(e) => setRepName(e.target.value)} placeholder="Nome do representante" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>CPF</Label>
                          <Input value={repCpf} onChange={(e) => setRepCpf(e.target.value)} placeholder="000.000.000-00" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1.5">
                            <Label>E-mail</Label>
                            <Input type="email" value={repEmail} onChange={(e) => setRepEmail(e.target.value)} placeholder="representante@email.com" />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Telefone</Label>
                            <Input value={repPhone} onChange={(e) => setRepPhone(e.target.value)} placeholder="(00) 00000-0000" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Endereço</Label>
                          <Input value={repAddress} onChange={(e) => setRepAddress(e.target.value)} placeholder="Rua, nº, bairro, cidade - UF" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Senha *</Label>
                      <div className="relative">
                        <Input
                          type={showPw ? "text" : "password"}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="pr-10"
                        />
                        <PwToggle />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Confirmar Senha *</Label>
                      <Input
                        type="password"
                        value={regConfirmPw}
                        onChange={(e) => setRegConfirmPw(e.target.value)}
                        placeholder="Confirme sua senha"
                      />
                    </div>
                    <Button type="submit" className="w-full mt-2" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                      Enviar Cadastro
                    </Button>
                    <p className="text-[11px] text-muted-foreground text-center">
                      Após o cadastro, sua conta será analisada e aprovada pela equipe administrativa.
                    </p>
                  </form>
                </CardContent>
              </>
            )}

            {/* FORGOT */}
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
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleForgot} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>E-mail</Label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@empresa.com" />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Enviando..." : "Enviar Link de Redefinição"}
                    </Button>
                  </form>
                </CardContent>
              </>
            )}

            {/* VERIFY EMAIL */}
            {view === "verify" && (
              <>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-accent" />
                    <div>
                      <p className="font-semibold text-sm">Verificação de E-mail</p>
                      <p className="text-xs text-muted-foreground">
                        Enviamos um código de 6 dígitos para <strong>{verifyEmail}</strong>
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleVerifyCode} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Código de Verificação</Label>
                      <Input
                        value={otpCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setOtpCode(val);
                        }}
                        placeholder="000000"
                        className="text-center text-2xl tracking-[0.5em] font-bold"
                        maxLength={6}
                        autoFocus
                      />
                      <p className="text-[11px] text-muted-foreground text-center">
                        O código expira em 10 minutos.
                      </p>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading || otpCode.length !== 6}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                      Verificar Código
                    </Button>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={resendCooldown > 0 || loading}
                        className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
                      >
                        <RefreshCw className="h-3 w-3" />
                        {resendCooldown > 0
                          ? `Reenviar em ${resendCooldown}s`
                          : "Reenviar código"}
                      </button>
                    </div>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setView("login")}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Voltar ao login
                      </button>
                    </div>
                  </form>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
