import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plug, Mail, MessageCircle, Send } from "lucide-react";
import { EmailIntegrations } from "@/components/admin/integracoes/EmailIntegrations";
import { Badge } from "@/components/ui/badge";

export default function AdminIntegracoes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Integrações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie as integrações externas da plataforma.
        </p>
      </div>

      <Tabs defaultValue="comunicacao" className="space-y-4">
        <TabsList>
          <TabsTrigger value="comunicacao" className="gap-1.5">
            <MessageCircle className="h-4 w-4" /> Comunicação
          </TabsTrigger>
          <TabsTrigger value="outros" className="gap-1.5">
            <Plug className="h-4 w-4" /> Outros
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comunicacao">
          <Tabs defaultValue="email" className="space-y-4">
            <TabsList className="bg-transparent border h-auto flex-wrap gap-1 p-1">
              <TabsTrigger value="email" className="gap-1.5 data-[state=active]:bg-accent">
                <Mail className="h-3.5 w-3.5" /> Email
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="gap-1.5 data-[state=active]:bg-accent">
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </TabsTrigger>
              <TabsTrigger value="telegram" className="gap-1.5 data-[state=active]:bg-accent">
                <Send className="h-3.5 w-3.5" /> Telegram
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <EmailIntegrations />
            </TabsContent>

            <TabsContent value="whatsapp">
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
            </TabsContent>

            <TabsContent value="telegram">
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
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="outros">
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <Plug className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Nenhuma integração configurada</p>
              <p className="text-sm mt-1">As integrações disponíveis aparecerão aqui.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}