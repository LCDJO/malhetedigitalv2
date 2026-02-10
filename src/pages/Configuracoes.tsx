import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Loader2, Building2, Wallet, ScrollText, Tags, SlidersHorizontal } from "lucide-react";
import { TabDadosLoja } from "@/components/configuracoes/TabDadosLoja";
import { TabParametrosFinanceiros } from "@/components/configuracoes/TabParametrosFinanceiros";
import { TabRegrasMaconicas } from "@/components/configuracoes/TabRegrasMaconicas";
import { TabCategoriasFinanceiras, type CategoriaFinanceira } from "@/components/configuracoes/TabCategoriasFinanceiras";
import { TabPreferencias } from "@/components/configuracoes/TabPreferencias";

interface LodgeConfig {
  id: string;
  lodge_name: string;
  lodge_number: string;
  orient: string;
  observacoes: string;
  mensalidade_padrao: number;
  dia_vencimento: number;
  meses_tolerancia_inadimplencia: number;
  tempo_minimo_aprendiz: number;
  tempo_minimo_companheiro: number;
  exigir_quitacao_para_avanco: boolean;
  categorias_financeiras: CategoriaFinanceira[];
  permitir_lancamento_retroativo: boolean;
  exigir_aprovacao_tesouraria: boolean;
  notificar_inadimplencia: boolean;
}

const defaultConfig: LodgeConfig = {
  id: "",
  lodge_name: "",
  lodge_number: "",
  orient: "",
  observacoes: "",
  mensalidade_padrao: 0,
  dia_vencimento: 10,
  meses_tolerancia_inadimplencia: 3,
  tempo_minimo_aprendiz: 12,
  tempo_minimo_companheiro: 12,
  exigir_quitacao_para_avanco: true,
  categorias_financeiras: [],
  permitir_lancamento_retroativo: true,
  exigir_aprovacao_tesouraria: false,
  notificar_inadimplencia: true,
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
        setConfig({
          ...defaultConfig,
          ...(data as any),
          categorias_financeiras: Array.isArray((data as any).categorias_financeiras)
            ? (data as any).categorias_financeiras
            : [],
        });
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
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
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

      {/* Tabs */}
      <Tabs defaultValue="dados" className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="dados" className="gap-1.5 text-xs sm:text-sm">
            <Building2 className="h-3.5 w-3.5" /> Dados da Loja
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="gap-1.5 text-xs sm:text-sm">
            <Wallet className="h-3.5 w-3.5" /> Parâmetros Financeiros
          </TabsTrigger>
          <TabsTrigger value="regras" className="gap-1.5 text-xs sm:text-sm">
            <ScrollText className="h-3.5 w-3.5" /> Regras Maçônicas
          </TabsTrigger>
          <TabsTrigger value="categorias" className="gap-1.5 text-xs sm:text-sm">
            <Tags className="h-3.5 w-3.5" /> Categorias Financeiras
          </TabsTrigger>
          <TabsTrigger value="preferencias" className="gap-1.5 text-xs sm:text-sm">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Preferências
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="mt-6">
          <TabDadosLoja config={config} canWrite={canWrite} onChange={set} />
        </TabsContent>

        <TabsContent value="financeiro" className="mt-6">
          <TabParametrosFinanceiros config={config} canWrite={canWrite} onChange={set} />
        </TabsContent>

        <TabsContent value="regras" className="mt-6">
          <TabRegrasMaconicas config={config} canWrite={canWrite} onChange={set} />
        </TabsContent>

        <TabsContent value="categorias" className="mt-6">
          <TabCategoriasFinanceiras
            categorias={config.categorias_financeiras}
            canWrite={canWrite}
            onChange={(cats) => set("categorias_financeiras", cats)}
          />
        </TabsContent>

        <TabsContent value="preferencias" className="mt-6">
          <TabPreferencias config={config} canWrite={canWrite} onChange={set} />
        </TabsContent>
      </Tabs>

      {/* Impact notice */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
        <Badge variant="outline" className="text-[10px]">Atenção</Badge>
        Alterações aqui impactam Secretaria, Tesouraria e Dashboard imediatamente após salvar.
      </div>
    </div>
  );
}
