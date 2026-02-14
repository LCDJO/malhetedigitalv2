import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Settings2, ExternalLink, Bell, Users } from "lucide-react";

export default function AdminIntegracoesWhatsapp() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-600/10">
            <MessageCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">WhatsApp</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Configure a integração com WhatsApp Business API para notificações e cobranças</p>
          </div>
        </div>
      </div>

      {/* Seção Notificações Automáticas */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10">
            <Bell className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-serif font-semibold text-foreground">Notificações Automáticas</h2>
            <p className="text-xs text-muted-foreground">Envio de cobranças, lembretes e comunicados via WhatsApp</p>
          </div>
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">Em breve</Badge>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Ativar notificações WhatsApp</Label>
                <p className="text-xs text-muted-foreground">Envia mensagens automáticas de cobrança e aviso aos Irmãos</p>
              </div>
              <Switch disabled />
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Settings2 className="h-3 w-3" /> Token de Acesso (API)
                </Label>
                <Input placeholder="Token do WhatsApp Business API" disabled className="h-10" type="password" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone Number ID</Label>
                <Input placeholder="ID do número de telefone" disabled className="h-10" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">WhatsApp Business Account ID</Label>
                <Input placeholder="WABA ID" disabled className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Webhook Verify Token</Label>
                <Input placeholder="Token de verificação" disabled className="h-10" type="password" />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Eventos para notificar</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {["Cobrança gerada", "Lembrete de vencimento", "Pagamento confirmado", "Aviso de sessão"].map((evento) => (
                  <div key={evento} className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/30">
                    <span className="text-xs font-medium">{evento}</span>
                    <Switch disabled className="scale-90" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/60">
              <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Documentação disponível em{" "}
                <a href="https://developers.facebook.com/docs/whatsapp" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                  developers.facebook.com/docs/whatsapp
                </a>
              </p>
            </div>

            <div className="flex justify-end">
              <Button disabled className="gap-1.5">Salvar Configuração</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Seção Grupo da Loja */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500/10">
            <Users className="h-4 w-4 text-teal-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-serif font-semibold text-foreground">Grupo da Loja</h2>
            <p className="text-xs text-muted-foreground">Integração com grupo de WhatsApp para comunicados gerais</p>
          </div>
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">Em breve</Badge>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Ativar integração com grupo</Label>
                <p className="text-xs text-muted-foreground">Envia comunicados e atas automaticamente no grupo da Loja</p>
              </div>
              <Switch disabled />
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">ID do Grupo</Label>
              <Input placeholder="ID do grupo WhatsApp" disabled className="h-10" />
              <p className="text-[11px] text-muted-foreground">Obtido via API do WhatsApp Business após adicionar o número ao grupo</p>
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
