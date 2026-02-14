import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Plug, Mail } from "lucide-react";
import { EmailIntegrations } from "@/components/admin/integracoes/EmailIntegrations";

export default function AdminIntegracoes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Integrações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie as integrações externas da plataforma.
        </p>
      </div>

      <Tabs defaultValue="emails" className="space-y-4">
        <TabsList>
          <TabsTrigger value="emails" className="gap-1.5">
            <Mail className="h-4 w-4" /> Emails
          </TabsTrigger>
          <TabsTrigger value="outros" className="gap-1.5">
            <Plug className="h-4 w-4" /> Outros
          </TabsTrigger>
        </TabsList>

        <TabsContent value="emails">
          <EmailIntegrations />
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
