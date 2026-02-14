import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminIntegracoesWhatsapp() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">WhatsApp</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Integração com WhatsApp Business API.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <MessageCircle className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">WhatsApp Business API</CardTitle>
              <CardDescription>Envie notificações e mensagens automáticas via WhatsApp.</CardDescription>
            </div>
            <Badge variant="outline" className="ml-auto text-muted-foreground">Em breve</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 text-sm text-muted-foreground">
          Configure sua conta WhatsApp Business para enviar cobranças, lembretes e comunicados diretamente aos Irmãos.
        </CardContent>
      </Card>
    </div>
  );
}
