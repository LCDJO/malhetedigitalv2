import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Building2, QrCode, FileBarChart, Settings2, ExternalLink } from "lucide-react";

export default function AdminIntegracoesBB() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-yellow-600/10">
            <Building2 className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">Banco do Brasil</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Configure as integrações com o Banco do Brasil para boletos e PIX</p>
          </div>
        </div>
      </div>

      {/* Seção Boletos */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10">
            <FileBarChart className="h-4 w-4 text-amber-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-serif font-semibold text-foreground">Boletos Bancários</h2>
            <p className="text-xs text-muted-foreground">Emissão e gestão de boletos via API BB</p>
          </div>
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">Em breve</Badge>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Ativar integração de boletos</Label>
                <p className="text-xs text-muted-foreground">Habilita a emissão automática de boletos para cobranças</p>
              </div>
              <Switch disabled />
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Número do Convênio</Label>
                <Input placeholder="Convênio BB" disabled className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Carteira</Label>
                <Input placeholder="Ex: 17" disabled className="h-10" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Variação da Carteira</Label>
                <Input placeholder="Ex: 35" disabled className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Agência / Conta</Label>
                <Input placeholder="Agência-Conta" disabled className="h-10" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Settings2 className="h-3 w-3" /> Client ID (API)
                </Label>
                <Input placeholder="client_id da API BB" disabled className="h-10" type="password" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Settings2 className="h-3 w-3" /> Client Secret (API)
                </Label>
                <Input placeholder="client_secret da API BB" disabled className="h-10" type="password" />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/60">
              <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Credenciais disponíveis no{" "}
                <a href="https://developers.bb.com.br" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                  Portal Developers BB
                </a>
              </p>
            </div>

            <div className="flex justify-end">
              <Button disabled className="gap-1.5">Salvar Configuração</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Seção PIX */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500/10">
            <QrCode className="h-4 w-4 text-teal-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-serif font-semibold text-foreground">PIX</h2>
            <p className="text-xs text-muted-foreground">Recebimento via PIX com QR Code dinâmico</p>
          </div>
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">Em breve</Badge>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Ativar integração PIX</Label>
                <p className="text-xs text-muted-foreground">Gera cobranças PIX com QR Code para pagamento instantâneo</p>
              </div>
              <Switch disabled />
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Chave PIX</Label>
                <Input placeholder="CPF, CNPJ, e-mail ou chave aleatória" disabled className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo da Chave</Label>
                <Input placeholder="Ex: CNPJ" disabled className="h-10" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Settings2 className="h-3 w-3" /> Client ID (API PIX)
                </Label>
                <Input placeholder="client_id para API PIX" disabled className="h-10" type="password" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Settings2 className="h-3 w-3" /> Client Secret (API PIX)
                </Label>
                <Input placeholder="client_secret para API PIX" disabled className="h-10" type="password" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Certificado Digital (.pem)</Label>
              <Input type="file" accept=".pem,.crt,.p12" disabled className="h-10" />
              <p className="text-[11px] text-muted-foreground">Certificado necessário para autenticação mTLS com a API PIX do BB</p>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/60">
              <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Documentação da API PIX BB disponível em{" "}
                <a href="https://developers.bb.com.br" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                  developers.bb.com.br
                </a>
              </p>
            </div>

            <div className="flex justify-end">
              <Button disabled className="gap-1.5">Salvar Configuração</Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
