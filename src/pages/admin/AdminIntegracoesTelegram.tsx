import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Send, Settings2, ExternalLink, Bell, Users } from "lucide-react";

export default function AdminIntegracoesTelegram() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sky-600/10">
            <Send className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">Telegram</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Configure o Bot do Telegram para notificações e alertas da Loja</p>
          </div>
        </div>
      </div>

      {/* Seção Bot de Notificações */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10">
            <Bell className="h-4 w-4 text-amber-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-serif font-semibold text-foreground">Bot de Notificações</h2>
            <p className="text-xs text-muted-foreground">Alertas financeiros e avisos automáticos via Telegram Bot</p>
          </div>
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">Em breve</Badge>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Ativar Bot do Telegram</Label>
                <p className="text-xs text-muted-foreground">Envia alertas financeiros e comunicados via Telegram</p>
              </div>
              <Switch disabled />
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Settings2 className="h-3 w-3" /> Bot Token
                </Label>
                <Input placeholder="Token fornecido pelo @BotFather" disabled className="h-10" type="password" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome do Bot</Label>
                <Input placeholder="@SuaLoja_bot" disabled className="h-10" />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Eventos para notificar</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {["Cobrança gerada", "Pagamento confirmado", "Inadimplência detectada", "Aviso de sessão", "Novo membro cadastrado", "Incidente LGPD"].map((evento) => (
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
                Crie seu bot em{" "}
                <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                  @BotFather
                </a>
                {" "}e obtenha o token de acesso
              </p>
            </div>

            <div className="flex justify-end">
              <Button disabled className="gap-1.5">Salvar Configuração</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Seção Canal/Grupo */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500/10">
            <Users className="h-4 w-4 text-teal-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-serif font-semibold text-foreground">Canal / Grupo</h2>
            <p className="text-xs text-muted-foreground">Vincule um grupo ou canal do Telegram à Loja</p>
          </div>
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">Em breve</Badge>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Ativar integração com canal/grupo</Label>
                <p className="text-xs text-muted-foreground">Publica comunicados e atas automaticamente no canal ou grupo</p>
              </div>
              <Switch disabled />
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Chat ID</Label>
              <Input placeholder="Ex: -1001234567890" disabled className="h-10" />
              <p className="text-[11px] text-muted-foreground">ID do grupo ou canal. Adicione o bot como admin e use /start para obter o ID</p>
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
