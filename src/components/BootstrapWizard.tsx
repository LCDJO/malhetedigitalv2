import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Eye, EyeOff, Sparkles } from "lucide-react";

interface Props {
  onComplete: () => void;
}

export default function BootstrapWizard({ onComplete }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName.trim()) {
      toast.error("Preencha todos os campos.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("bootstrap", {
        method: "POST",
        body: { email, password, full_name: fullName.trim() },
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

  return (
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
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Ativação do Sistema</p>
              <p className="text-xs text-muted-foreground">
                Configure o primeiro administrador
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 mb-4">
            <div className="flex gap-2 items-start">
              <Shield className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Este é o primeiro acesso ao sistema. Crie a conta do <strong className="text-foreground">Administrador</strong> que terá controle total sobre o Malhete Digital. Esta ação só pode ser executada uma única vez.
              </p>
            </div>
          </div>

          <form onSubmit={handleBootstrap} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bootstrap-name">Nome Completo</Label>
              <Input
                id="bootstrap-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nome do Administrador"
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
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bootstrap-password">Senha</Label>
              <div className="relative">
                <Input
                  id="bootstrap-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Inicializando..." : "Ativar Sistema"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
