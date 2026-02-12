import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface ActiveTerm {
  id: string;
  versao: string;
  conteudo: string;
  data_publicacao: string;
}

export function AceiteTermos() {
  const { acceptTerms, signOut } = useAuth();
  const [term, setTerm] = useState<ActiveTerm | null>(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchActiveTerm = async () => {
      const { data } = await supabase
        .from("termos_uso")
        .select("id, versao, conteudo, data_publicacao")
        .eq("ativo", true)
        .order("data_publicacao", { ascending: false })
        .limit(1)
        .maybeSingle();

      setTerm(data);
      setLoading(false);
    };
    fetchActiveTerm();
  }, []);

  const handleAccept = async () => {
    if (!term) return;
    setSubmitting(true);
    const success = await acceptTerms(term.id);
    setSubmitting(false);
    if (success) {
      toast.success("Termos aceitos com sucesso.");
    } else {
      toast.error("Erro ao registrar aceite. Tente novamente.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!term) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">Nenhum termo de uso ativo encontrado. Contate o administrador.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning/10">
              <ShieldCheck className="h-7 w-7 text-warning" />
            </div>
          </div>
          <CardTitle className="font-serif text-xl">Aceite Obrigatório — Termos de Uso</CardTitle>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Versão <span className="font-semibold text-foreground">{term.versao}</span>
            </p>
            <div className="rounded-md bg-warning/5 border border-warning/20 px-4 py-3 mt-2">
              <p className="text-sm text-foreground leading-relaxed">
                <strong>Atenção:</strong> Uma nova versão dos Termos de Uso foi publicada.
                O acesso aos módulos do sistema está temporariamente bloqueado até que você leia e aceite
                os termos abaixo, conforme exigido pela Lei Geral de Proteção de Dados (LGPD).
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-[400px] rounded-md border p-4">
            <div className="prose prose-sm max-w-none text-sm text-foreground whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: term.conteudo }} />
          </ScrollArea>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
            <Checkbox
              id="aceite"
              checked={checked}
              onCheckedChange={(v) => setChecked(!!v)}
              className="mt-0.5"
            />
            <label htmlFor="aceite" className="text-sm cursor-pointer leading-relaxed">
              Declaro que li integralmente os Termos de Uso (versão {term.versao}) acima e aceito todas as condições estabelecidas.
            </label>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={signOut}>
              Sair do sistema
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!checked || submitting}
              className="gap-1.5"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Processando...</>
              ) : (
                <><ShieldCheck className="h-4 w-4" /> Aceitar e Continuar</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
