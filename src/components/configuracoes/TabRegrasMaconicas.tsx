import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollText } from "lucide-react";

interface RegraConfig {
  tempo_minimo_aprendiz: number;
  tempo_minimo_companheiro: number;
  exigir_quitacao_para_avanco: boolean;
}

interface Props {
  config: RegraConfig;
  canWrite: boolean;
  onChange: <K extends keyof RegraConfig>(key: K, value: RegraConfig[K]) => void;
}

export function TabRegrasMaconicas({ config, canWrite, onChange }: Props) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Regras Maçônicas</CardTitle>
        </div>
        <CardDescription>
          Parâmetros ritualísticos e regulamentares que controlam avanço de grau e exigências.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tempo_aprendiz">Tempo Mínimo como Aprendiz (meses)</Label>
            <Input
              id="tempo_aprendiz"
              type="number"
              min={1}
              max={60}
              value={config.tempo_minimo_aprendiz}
              onChange={(e) => onChange("tempo_minimo_aprendiz", parseInt(e.target.value) || 12)}
              disabled={!canWrite}
            />
            <p className="text-xs text-muted-foreground">Período mínimo antes da Elevação ao 2° Grau</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tempo_companheiro">Tempo Mínimo como Companheiro (meses)</Label>
            <Input
              id="tempo_companheiro"
              type="number"
              min={1}
              max={60}
              value={config.tempo_minimo_companheiro}
              onChange={(e) => onChange("tempo_minimo_companheiro", parseInt(e.target.value) || 12)}
              disabled={!canWrite}
            />
            <p className="text-xs text-muted-foreground">Período mínimo antes da Exaltação ao 3° Grau</p>
          </div>
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Exigir Quitação para Avanço de Grau</p>
            <p className="text-xs text-muted-foreground">
              O irmão precisa estar adimplente para ser elevado ou exaltado.
            </p>
          </div>
          <Switch
            checked={config.exigir_quitacao_para_avanco}
            onCheckedChange={(v) => onChange("exigir_quitacao_para_avanco", v)}
            disabled={!canWrite}
          />
        </div>
      </CardContent>
    </Card>
  );
}
