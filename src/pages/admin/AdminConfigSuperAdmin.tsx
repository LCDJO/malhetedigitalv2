import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DomainManagement } from "@/components/admin/config/DomainManagement";
import { Settings, Globe, Shield, Activity } from "lucide-react";

export default function AdminConfigSuperAdmin() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-serif font-bold text-foreground">Configurações do Sistema</h1>
        <p className="text-muted-foreground">Parametrizações globais do painel administrativo.</p>
      </div>

      <Tabs defaultValue="dominios" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="geral" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="dominios" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Domínios
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="monitoramento" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Monitoramento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dominios">
          <DomainManagement />
        </TabsContent>

        <TabsContent value="geral" className="py-12 text-center text-muted-foreground">
          Configurações gerais serão exibidas aqui.
        </TabsContent>
        
        <TabsContent value="seguranca" className="py-12 text-center text-muted-foreground">
          Configurações de segurança e autenticação.
        </TabsContent>
        
        <TabsContent value="monitoramento" className="py-12 text-center text-muted-foreground">
          Métricas e logs de monitoramento do sistema.
        </TabsContent>
      </Tabs>
    </div>
  );
}

