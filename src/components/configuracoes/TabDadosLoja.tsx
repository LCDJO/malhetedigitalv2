import { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, Upload, Loader2 } from "lucide-react";

export interface DadosLojaConfig {
  lodge_name: string;
  lodge_number: string;
  orient: string;
  potencia: string;
  endereco: string;
  email_institucional: string;
  telefone: string;
  logotipo_url: string;
  observacoes: string;
}

interface Props {
  config: DadosLojaConfig;
  canWrite: boolean;
  onChange: <K extends keyof DadosLojaConfig>(key: K, value: DadosLojaConfig[K]) => void;
  onLogoUpload: (file: File) => Promise<string | null>;
}

export function TabDadosLoja({ config, canWrite, onChange, onLogoUpload }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await onLogoUpload(file);
    if (url) onChange("logotipo_url", url);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Dados da Loja</CardTitle>
        </div>
        <CardDescription>Informações oficiais da Loja utilizadas em documentos e relatórios.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logotipo */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 rounded-lg border">
            <AvatarImage src={config.logotipo_url || undefined} alt="Logotipo" />
            <AvatarFallback className="rounded-lg bg-muted text-muted-foreground text-xl font-serif">
              {config.lodge_name?.[0] || "L"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-sm font-medium">Logotipo da Loja</p>
            <p className="text-xs text-muted-foreground">PNG ou JPG, recomendado 256×256px</p>
            {canWrite && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 mt-1"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {uploading ? "Enviando..." : "Enviar Logotipo"}
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </>
            )}
          </div>
        </div>

        <Separator />

        {/* Campos obrigatórios */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            Campos Obrigatórios
            <Badge variant="destructive" className="text-[9px] px-1 py-0">Obrigatório</Badge>
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="lodge_name">Nome da Loja *</Label>
              <Input
                id="lodge_name"
                value={config.lodge_name}
                onChange={(e) => onChange("lodge_name", e.target.value)}
                disabled={!canWrite}
                placeholder="Ex: Loja Maçônica Luz e Liberdade"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lodge_number">Número da Loja *</Label>
              <Input
                id="lodge_number"
                value={config.lodge_number}
                onChange={(e) => onChange("lodge_number", e.target.value)}
                disabled={!canWrite}
                placeholder="Ex: 2693"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orient">Oriente *</Label>
              <Input
                id="orient"
                value={config.orient}
                onChange={(e) => onChange("orient", e.target.value)}
                disabled={!canWrite}
                placeholder="Ex: Alta Floresta"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="potencia">Potência / Obediência *</Label>
              <Input
                id="potencia"
                value={config.potencia}
                onChange={(e) => onChange("potencia", e.target.value)}
                disabled={!canWrite}
                placeholder="Ex: Grande Oriente do Brasil (GOB)"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Campos opcionais */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Campos Opcionais
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={config.endereco}
                onChange={(e) => onChange("endereco", e.target.value)}
                disabled={!canWrite}
                placeholder="Rua, número, bairro, cidade – UF"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_institucional">E-mail Institucional</Label>
              <Input
                id="email_institucional"
                type="email"
                value={config.email_institucional}
                onChange={(e) => onChange("email_institucional", e.target.value)}
                disabled={!canWrite}
                placeholder="contato@loja.org.br"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={config.telefone}
                onChange={(e) => onChange("telefone", e.target.value)}
                disabled={!canWrite}
                placeholder="(66) 99999-9999"
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
