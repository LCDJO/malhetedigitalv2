import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet } from "lucide-react";

interface FinanceConfig {
  mensalidade_padrao: number;
  dia_vencimento: number;
  meses_tolerancia_inadimplencia: number;
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
            onChange={(e) => onChange("mensalidade_padrao", parseFloat(e.target.value) || 0)}
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
      </CardContent>
    </Card>
  );
}
