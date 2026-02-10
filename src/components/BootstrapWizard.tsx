import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Eye, EyeOff, Sparkles, Building2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Props {
  onComplete: () => void;
}

export default function BootstrapWizard({ onComplete }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [lodgeName, setLodgeName] = useState("");
  const [lodgeNumber, setLodgeNumber] = useState("");
  const [orient, setOrient] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email || !password || !confirmPassword || !lodgeName.trim() || !lodgeNumber.trim() || !orient.trim()) {
      toast.error("Preencha todos os campos.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Formato de email inválido.");
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
    try {
      const { data, error } = await supabase.functions.invoke("bootstrap", {
        method: "POST",
        body: {
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          lodge_name: lodgeName.trim(),
          lodge_number: lodgeNumber.trim(),
          orient: orient.trim(),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Sistema inicializado! Faça login com suas credenciais.");
      onComplete();
    } catch (err: any) {
      toast.error(err.message || "Erro ao inicializar o sistema.");
    } finally {
      setLoading(false);
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
    <div className="w-full max-w-lg space-y-6">
      {/* Branding */}
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground font-serif font-bold text-2xl shadow-lg">
          M
        </div>
        <h1 className="text-2xl font-serif font-bold tracking-tight">Ativação Inicial do Malhete Digital</h1>
        <p className="text-sm text-muted-foreground">Configure o sistema para uso da sua Loja</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
            <div className="flex gap-2 items-start">
              <Shield className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Este é o primeiro acesso ao sistema. Configure os dados da <strong className="text-foreground">Loja</strong> e crie a conta do{" "}
                <strong className="text-foreground">Administrador Raiz</strong> com controle total sobre o Malhete Digital.
                Esta ação só pode ser executada <strong className="text-foreground">uma única vez</strong>.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBootstrap} className="space-y-5">
            {/* Lodge Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Building2 className="h-4 w-4 text-primary" />
                Dados da Loja
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="lodge-name">Nome da Loja</Label>
                  <Input
                    id="lodge-name"
                    value={lodgeName}
                    onChange={(e) => setLodgeName(e.target.value)}
                    placeholder="Ex: Loja Fraternidade Universal"
                    maxLength={150}
                    autoComplete="organization"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="lodge-number">Número da Loja</Label>
                    <Input
                      id="lodge-number"
                      value={lodgeNumber}
                      onChange={(e) => setLodgeNumber(e.target.value)}
                      placeholder="Ex: 1234"
                      maxLength={20}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="orient">Oriente</Label>
                    <Input
                      id="orient"
                      value={orient}
                      onChange={(e) => setOrient(e.target.value)}
                      placeholder="Ex: São Paulo"
                      maxLength={100}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Admin Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Administrador Raiz
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bootstrap-name">Nome Completo</Label>
                  <Input
                    id="bootstrap-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nome do Administrador"
                    maxLength={100}
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bootstrap-email">Email</Label>
                  <Input
                    id="bootstrap-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@loja.com"
                    maxLength={255}
                    autoComplete="email"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="bootstrap-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="bootstrap-password"
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mín. 6 caracteres"
                        autoComplete="new-password"
                      />
                      <PwToggle />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bootstrap-confirm">Confirmar Senha</Label>
                    <div className="relative">
                      <Input
                        id="bootstrap-confirm"
                        type={showPw ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a senha"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Inicializando sistema..." : "Ativar Malhete Digital"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
