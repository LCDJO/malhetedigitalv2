import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminIntegracoesTelegram() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Telegram</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Integração com Telegram Bot API.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <Send className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Telegram Bot</CardTitle>
              <CardDescription>Integre um bot do Telegram para notificações em grupo.</CardDescription>
            </div>
            <Badge variant="outline" className="ml-auto text-muted-foreground">Em breve</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 text-sm text-muted-foreground">
          Conecte um bot para enviar alertas financeiros, avisos de sessão e comunicados ao grupo da Loja.
        </CardContent>
      </Card>
    </div>
  );
}
