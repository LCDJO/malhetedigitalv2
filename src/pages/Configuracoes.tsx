import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Building2, Wallet, SlidersHorizontal, Save, Loader2 } from "lucide-react";

interface LodgeConfig {
  id: string;
  lodge_name: string;
  lodge_number: string;
  orient: string;
  mensalidade_padrao: number;
  dia_vencimento: number;
  meses_tolerancia_inadimplencia: number;
  permitir_lancamento_retroativo: boolean;
  exigir_aprovacao_tesouraria: boolean;
  notificar_inadimplencia: boolean;
  observacoes: string;
}

const defaultConfig: LodgeConfig = {
  id: "",
  lodge_name: "",
  lodge_number: "",
  orient: "",
  mensalidade_padrao: 0,
  dia_vencimento: 10,
  meses_tolerancia_inadimplencia: 3,
  permitir_lancamento_retroativo: true,
  exigir_aprovacao_tesouraria: false,
  notificar_inadimplencia: true,
  observacoes: "",
};

export default function Configuracoes() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("configuracoes", "write");

  const [config, setConfig] = useState<LodgeConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("lodge_config")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) {
        toast.error("Erro ao carregar configurações.");
      } else if (data) {
        setConfig(data as unknown as LodgeConfig);
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    if (!canWrite) {
      toast.error("Você não tem permissão para alterar configurações.");
      return;
    }
    setSaving(true);
    const { id, ...rest } = config;
    const { error } = await supabase
      .from("lodge_config")
      .update(rest as any)
      .eq("id", id);

    if (error) {
      toast.error("Erro ao salvar configurações.");
    } else {
      toast.success("Configurações salvas com sucesso!");
    }
    setSaving(false);
  };

  const set = <K extends keyof LodgeConfig>(key: K, value: LodgeConfig[K]) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold">Configurações da Loja</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Parâmetros institucionais, financeiros e comportamentais do sistema.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || !canWrite} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Alterações
        </Button>
      </div>

      {/* ── Dados Institucionais ── */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Dados Institucionais</CardTitle>
          </div>
          <CardDescription>Informações oficiais da Loja utilizadas em documentos e relatórios.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="lodge_name">Nome da Loja</Label>
            <Input
              id="lodge_name"
              value={config.lodge_name}
              onChange={(e) => set("lodge_name", e.target.value)}
              disabled={!canWrite}
              placeholder="Ex: Loja Maçônica Exemplo Nº 123"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lodge_number">Número da Loja</Label>
            <Input
              id="lodge_number"
              value={config.lodge_number}
              onChange={(e) => set("lodge_number", e.target.value)}
              disabled={!canWrite}
              placeholder="Ex: 2693"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orient">Oriente</Label>
            <Input
              id="orient"
              value={config.orient}
              onChange={(e) => set("orient", e.target.value)}
              disabled={!canWrite}
              placeholder="Ex: Alta Floresta"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={config.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
              disabled={!canWrite}
              rows={3}
              placeholder="Anotações internas sobre a Loja..."
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Parâmetros Financeiros ── */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Parâmetros Financeiros</CardTitle>
          </div>
          <CardDescription>
            Valores padrão utilizados pela Tesouraria e Secretaria ao gerar lançamentos.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="mensalidade_padrao">Mensalidade Padrão (R$)</Label>
            <Input
              id="mensalidade_padrao"
              type="number"
              min={0}
              step={0.01}
              value={config.mensalidade_padrao}
              onChange={(e) => set("mensalidade_padrao", parseFloat(e.target.value) || 0)}
              disabled={!canWrite}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dia_vencimento">Dia de Vencimento</Label>
            <Input
              id="dia_vencimento"
              type="number"
              min={1}
              max={28}
              value={config.dia_vencimento}
              onChange={(e) => set("dia_vencimento", parseInt(e.target.value) || 10)}
              disabled={!canWrite}
            />
            <p className="text-xs text-muted-foreground">Dia do mês (1–28)</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="meses_tolerancia">Tolerância Inadimplência</Label>
            <Input
              id="meses_tolerancia"
              type="number"
              min={1}
              max={12}
              value={config.meses_tolerancia_inadimplencia}
              onChange={(e) => set("meses_tolerancia_inadimplencia", parseInt(e.target.value) || 3)}
              disabled={!canWrite}
            />
            <p className="text-xs text-muted-foreground">Meses antes de marcar como inadimplente</p>
          </div>
        </CardContent>
      </Card>

      {/* ── Controles Globais ── */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Controles Globais</CardTitle>
          </div>
          <CardDescription>Comportamentos que impactam Secretaria, Tesouraria e Dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Permitir Lançamento Retroativo</p>
              <p className="text-xs text-muted-foreground">Permite registrar lançamentos com data anterior à atual.</p>
            </div>
            <Switch
              checked={config.permitir_lancamento_retroativo}
              onCheckedChange={(v) => set("permitir_lancamento_retroativo", v)}
              disabled={!canWrite}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Exigir Aprovação na Tesouraria</p>
              <p className="text-xs text-muted-foreground">
                Lançamentos precisam de aprovação do Venerável antes de serem efetivados.
              </p>
            </div>
            <Switch
              checked={config.exigir_aprovacao_tesouraria}
              onCheckedChange={(v) => set("exigir_aprovacao_tesouraria", v)}
              disabled={!canWrite}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Notificar Inadimplência</p>
              <p className="text-xs text-muted-foreground">
                Exibir alertas de inadimplência no Dashboard e painel de secretaria.
              </p>
            </div>
            <Switch
              checked={config.notificar_inadimplencia}
              onCheckedChange={(v) => set("notificar_inadimplencia", v)}
              disabled={!canWrite}
            />
          </div>
        </CardContent>
      </Card>

      {/* Impact notice */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
        <Badge variant="outline" className="text-[10px]">Atenção</Badge>
        Alterações aqui impactam Secretaria, Tesouraria e Dashboard imediatamente após salvar.
      </div>
    </div>
  );
}
