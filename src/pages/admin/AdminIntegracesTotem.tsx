import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Monitor, Settings2, Wifi, QrCode } from "lucide-react";

export default function AdminIntegracesTotem() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-600/10">
            <Monitor className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">Totem</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Configure totens de autoatendimento para a Loja</p>
          </div>
        </div>
      </div>

      {/* Seção Configuração do Totem */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10">
            <Settings2 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-serif font-semibold text-foreground">Configuração Geral</h2>
            <p className="text-xs text-muted-foreground">Gerencie os totens registrados e suas configurações</p>
          </div>
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">Em breve</Badge>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Ativar modo Totem</Label>
                <p className="text-xs text-muted-foreground">Habilita o acesso via totem de autoatendimento na Loja</p>
              </div>
              <Switch disabled />
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome do Totem</Label>
                <Input placeholder="Ex: Totem Entrada Principal" disabled className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Localização</Label>
                <Input placeholder="Ex: Hall de entrada" disabled className="h-10" />
              </div>
            </div>

            <div className="flex justify-end">
              <Button disabled className="gap-1.5">Salvar Configuração</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Seção Funcionalidades */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500/10">
            <QrCode className="h-4 w-4 text-teal-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-serif font-semibold text-foreground">Funcionalidades do Totem</h2>
            <p className="text-xs text-muted-foreground">Escolha quais recursos estarão disponíveis no totem</p>
          </div>
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">Em breve</Badge>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="space-y-3">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Módulos disponíveis</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {["Check-in por QR Code", "Consulta de débitos", "Emissão de boletos", "Avisos e comunicados"].map((funcionalidade) => (
                  <div key={funcionalidade} className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/30">
                    <span className="text-xs font-medium">{funcionalidade}</span>
                    <Switch disabled className="scale-90" />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Wifi className="h-3.5 w-3.5" /> Monitoramento de conexão
                </Label>
                <p className="text-xs text-muted-foreground">Receba alertas quando o totem ficar offline</p>
              </div>
              <Switch disabled />
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
