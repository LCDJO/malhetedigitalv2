import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { SlidersHorizontal } from "lucide-react";

interface PreferenciaConfig {
  permitir_lancamento_retroativo: boolean;
  exigir_aprovacao_tesouraria: boolean;
  notificar_inadimplencia: boolean;
}

interface Props {
  config: PreferenciaConfig;
  canWrite: boolean;
  onChange: <K extends keyof PreferenciaConfig>(key: K, value: PreferenciaConfig[K]) => void;
}

export function TabPreferencias({ config, canWrite, onChange }: Props) {
  const items: { key: keyof PreferenciaConfig; title: string; description: string }[] = [
    {
      key: "permitir_lancamento_retroativo",
      title: "Permitir Lançamento Retroativo",
      description: "Permite registrar lançamentos com data anterior à atual.",
    },
    {
      key: "exigir_aprovacao_tesouraria",
      title: "Exigir Aprovação na Tesouraria",
      description: "Lançamentos precisam de aprovação do Venerável antes de serem efetivados.",
    },
    {
      key: "notificar_inadimplencia",
      title: "Notificar Inadimplência",
      description: "Exibir alertas de inadimplência no Dashboard e painel de secretaria.",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Preferências do Sistema</CardTitle>
        </div>
        <CardDescription>
          Comportamentos globais que impactam Secretaria, Tesouraria e Dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {items.map((item, i) => (
          <div key={item.key}>
            {i > 0 && <Separator className="mb-6" />}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <Switch
                checked={config[item.key] as boolean}
                onCheckedChange={(v) => onChange(item.key, v)}
                disabled={!canWrite}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
