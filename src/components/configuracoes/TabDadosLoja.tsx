import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2 } from "lucide-react";

interface LodgeConfig {
  lodge_name: string;
  lodge_number: string;
  orient: string;
  observacoes: string;
}

interface Props {
  config: LodgeConfig;
  canWrite: boolean;
  onChange: <K extends keyof LodgeConfig>(key: K, value: LodgeConfig[K]) => void;
}

export function TabDadosLoja({ config, canWrite, onChange }: Props) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Dados da Loja</CardTitle>
        </div>
        <CardDescription>Informações oficiais da Loja utilizadas em documentos e relatórios.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="lodge_name">Nome da Loja</Label>
          <Input
            id="lodge_name"
            value={config.lodge_name}
            onChange={(e) => onChange("lodge_name", e.target.value)}
            disabled={!canWrite}
            placeholder="Ex: Loja Maçônica Exemplo Nº 123"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lodge_number">Número da Loja</Label>
          <Input
            id="lodge_number"
            value={config.lodge_number}
            onChange={(e) => onChange("lodge_number", e.target.value)}
            disabled={!canWrite}
            placeholder="Ex: 2693"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="orient">Oriente</Label>
          <Input
            id="orient"
            value={config.orient}
            onChange={(e) => onChange("orient", e.target.value)}
            disabled={!canWrite}
            placeholder="Ex: Alta Floresta"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            value={config.observacoes}
            onChange={(e) => onChange("observacoes", e.target.value)}
            disabled={!canWrite}
            rows={3}
            placeholder="Anotações internas sobre a Loja..."
          />
        </div>
      </CardContent>
    </Card>
  );
}
