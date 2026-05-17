import { useScope } from "@/contexts/ScopeContext";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { TabIntegracaoEmail } from "@/components/configuracoes/TabIntegracaoEmail";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Loader2 } from "lucide-react";

export default function ComunicacoesPreferencias() {
  const { tenantId, loading } = useScope();
  const { enabled: hasAccess, loading: moduleLoading } = useModuleAccess(tenantId, "email_servers");

  if (loading || moduleLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tenantId) {
    return (
      <Alert>
        <AlertDescription>Loja não identificada.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
          <Mail className="h-6 w-6" /> Preferências de Comunicação
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure o servidor de e-mail que será utilizado para envio das comunicações da loja.
        </p>
      </div>

      {!hasAccess ? (
        <Card>
          <CardHeader>
            <CardTitle>Módulo indisponível</CardTitle>
            <CardDescription>
              O módulo de servidores de e-mail não está habilitado para esta loja. Entre em contato com a administração da plataforma.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <TabIntegracaoEmail tenantId={tenantId} enabled={true} />
      )}
    </div>
  );
}
