import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "lucide-react";

export interface FinanceConfig {
  mensalidade_padrao: number;
  dia_vencimento: number;
  meses_tolerancia_inadimplencia: number;
  permitir_juros: boolean;
  percentual_multa: number;
  percentual_juros: number;
}

interface Props {
  config: FinanceConfig;
  canWrite: boolean;
  onChange: <K extends keyof FinanceConfig>(key: K, value: FinanceConfig[K]) => void;
}

export function TabParametrosFinanceiros({ config, canWrite, onChange }: Props) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Parâmetros Financeiros</CardTitle>
        </div>
        <CardDescription>
          Valores padrão utilizados como sugestão automática nos lançamentos da Tesouraria e Secretaria.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Valores base */}
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="mensalidade_padrao">Mensalidade Padrão (R$)</Label>
            <Input
              id="mensalidade_padrao"
              type="number"
              min={0}
              step={0.01}
              value={config.mensalidade_padrao}
              onChange={(e) => onChange("mensalidade_padrao", parseFloat(e.target.value) || 0)}
              disabled={!canWrite}
            />
            <p className="text-xs text-muted-foreground">Sugerido ao criar mensalidades</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dia_vencimento">Dia de Vencimento</Label>
            <Input
              id="dia_vencimento"
              type="number"
              min={1}
              max={28}
              value={config.dia_vencimento}
              onChange={(e) => onChange("dia_vencimento", parseInt(e.target.value) || 10)}
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
              onChange={(e) => onChange("meses_tolerancia_inadimplencia", parseInt(e.target.value) || 3)}
              disabled={!canWrite}
            />
            <p className="text-xs text-muted-foreground">Meses antes de marcar como inadimplente</p>
          </div>
        </div>

        <Separator />

        {/* Juros e multa */}
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Permitir Juros e Multa</p>
              <p className="text-xs text-muted-foreground">
                Aplicar encargos automaticamente sobre lançamentos em atraso.
              </p>
            </div>
            <Switch
              checked={config.permitir_juros}
              onCheckedChange={(v) => onChange("permitir_juros", v)}
              disabled={!canWrite}
            />
          </div>

          {config.permitir_juros && (
            <div className="grid gap-5 sm:grid-cols-2 pl-1 border-l-2 border-primary/20 ml-1">
              <div className="space-y-2 pl-4">
                <Label htmlFor="percentual_multa">Percentual de Multa (%)</Label>
                <Input
                  id="percentual_multa"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={config.percentual_multa}
                  onChange={(e) => onChange("percentual_multa", parseFloat(e.target.value) || 0)}
                  disabled={!canWrite}
                />
                <p className="text-xs text-muted-foreground">Multa única aplicada no atraso</p>
              </div>
              <div className="space-y-2 pl-4">
                <Label htmlFor="percentual_juros">Percentual de Juros ao Mês (%)</Label>
                <Input
                  id="percentual_juros"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={config.percentual_juros}
                  onChange={(e) => onChange("percentual_juros", parseFloat(e.target.value) || 0)}
                  disabled={!canWrite}
                />
                <p className="text-xs text-muted-foreground">Juros mensal sobre o valor em atraso</p>
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-[10px]">Info</Badge>
          Estes valores são usados como sugestão automática ao criar novos lançamentos.
        </div>
      </CardContent>
    </Card>
  );
}
