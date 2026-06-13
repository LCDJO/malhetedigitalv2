import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollText, Gavel } from "lucide-react";

export interface RegraConfig {
  tempo_minimo_aprendiz: number;
  tempo_minimo_companheiro: number;
  exigir_quitacao_para_avanco: boolean;
  // Parâmetros de Sessões / Atas
  quorum_minimo_aprendiz: number;
  quorum_minimo_companheiro: number;
  quorum_minimo_mestre: number;
  escrutinio_secreto_obrigatorio: boolean;
  exigir_assinatura_vm: boolean;
  exigir_assinatura_orador: boolean;
  exigir_assinatura_secretario: boolean;
  dias_prazo_retificacao: number;
}

interface Props {
  config: RegraConfig;
  canWrite: boolean;
  onChange: <K extends keyof RegraConfig>(key: K, value: RegraConfig[K]) => void;
}

export function TabRegrasMaconicas({ config, canWrite, onChange }: Props) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Progressão de Grau</CardTitle>
          </div>
          <CardDescription>
            Parâmetros ritualísticos que controlam o avanço de grau dos irmãos.
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

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Gavel className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Sessões e Atas</CardTitle>
          </div>
          <CardDescription>
            Parâmetros que regem quórum, escrutínio secreto, assinaturas e retificação de atas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="quorum_apr">Quórum mínimo — Aprendiz</Label>
              <Input id="quorum_apr" type="number" min={1} max={99}
                value={config.quorum_minimo_aprendiz}
                onChange={(e) => onChange("quorum_minimo_aprendiz", parseInt(e.target.value) || 7)}
                disabled={!canWrite}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quorum_comp">Quórum mínimo — Companheiro</Label>
              <Input id="quorum_comp" type="number" min={1} max={99}
                value={config.quorum_minimo_companheiro}
                onChange={(e) => onChange("quorum_minimo_companheiro", parseInt(e.target.value) || 7)}
                disabled={!canWrite}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quorum_mes">Quórum mínimo — Mestre</Label>
              <Input id="quorum_mes" type="number" min={1} max={99}
                value={config.quorum_minimo_mestre}
                onChange={(e) => onChange("quorum_minimo_mestre", parseInt(e.target.value) || 7)}
                disabled={!canWrite}/>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Escrutínio Secreto Obrigatório</p>
              <p className="text-xs text-muted-foreground">
                Decisões sensíveis (sindicâncias, admissões) só podem ser votadas em escrutínio secreto.
              </p>
            </div>
            <Switch
              checked={config.escrutinio_secreto_obrigatorio}
              onCheckedChange={(v) => onChange("escrutinio_secreto_obrigatorio", v)}
              disabled={!canWrite}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Assinaturas obrigatórias para travar a ata</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center justify-between rounded-md border p-3">
                <Label className="text-sm">Venerável Mestre</Label>
                <Switch checked={config.exigir_assinatura_vm}
                  onCheckedChange={(v) => onChange("exigir_assinatura_vm", v)} disabled={!canWrite}/>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <Label className="text-sm">Orador</Label>
                <Switch checked={config.exigir_assinatura_orador}
                  onCheckedChange={(v) => onChange("exigir_assinatura_orador", v)} disabled={!canWrite}/>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <Label className="text-sm">Secretário</Label>
                <Switch checked={config.exigir_assinatura_secretario}
                  onCheckedChange={(v) => onChange("exigir_assinatura_secretario", v)} disabled={!canWrite}/>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2 max-w-xs">
            <Label htmlFor="prazo_ret">Prazo para retificação (dias)</Label>
            <Input id="prazo_ret" type="number" min={1} max={3650}
              value={config.dias_prazo_retificacao}
              onChange={(e) => onChange("dias_prazo_retificacao", parseInt(e.target.value) || 90)}
              disabled={!canWrite}/>
            <p className="text-xs text-muted-foreground">
              Janela máxima, após a publicação, em que uma ata pode ser retificada.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
