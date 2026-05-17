import { useEffect, useState } from "react";
import { useScope } from "@/contexts/ScopeContext";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface PushIntegration {
  id?: string;
  onesignal_app_id: string;
  onesignal_api_key: string;
  enabled: boolean;
}

export default function ComunicacoesPush() {
  const { tenantId, loading } = useScope();
  const { enabled: hasAccess, loading: moduleLoading } = useModuleAccess(tenantId, "push_onesignal");
  const [data, setData] = useState<PushIntegration>({
    onesignal_app_id: "",
    onesignal_api_key: "",
    enabled: false,
  });
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      setFetching(true);
      const { data: row } = await supabase
        .from("tenant_push_integrations" as never)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("provider", "onesignal")
        .maybeSingle();
      if (row) setData(row as unknown as PushIntegration);
      setFetching(false);
    })();
  }, [tenantId]);

  const handleSave = async () => {
    if (!tenantId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("tenant_push_integrations" as never)
        .upsert(
          {
            tenant_id: tenantId,
            provider: "onesignal",
            onesignal_app_id: data.onesignal_app_id,
            onesignal_api_key: data.onesignal_api_key,
            enabled: data.enabled,
          } as never,
          { onConflict: "tenant_id,provider" }
        );
      if (error) throw error;
      toast.success("Integração OneSignal salva");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || moduleLoading || fetching) {
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
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" /> Preferências de Push
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure as credenciais do OneSignal para envio de notificações push aos membros da loja.
        </p>
      </div>

      {!hasAccess ? (
        <Card>
          <CardHeader>
            <CardTitle>Módulo indisponível</CardTitle>
            <CardDescription>
              O módulo de Push (OneSignal) não está habilitado para esta loja. Entre em contato com a administração da plataforma.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>OneSignal</CardTitle>
            <CardDescription>
              Informe o App ID e a REST API Key disponíveis no painel do OneSignal (Settings → Keys & IDs).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="appid">OneSignal App ID</Label>
              <Input
                id="appid"
                value={data.onesignal_app_id}
                onChange={(e) => setData({ ...data, onesignal_app_id: e.target.value })}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apikey">REST API Key</Label>
              <Input
                id="apikey"
                type="password"
                value={data.onesignal_api_key}
                onChange={(e) => setData({ ...data, onesignal_api_key: e.target.value })}
                placeholder="••••••••••••••••"
              />
            </div>
            <div className="flex items-center justify-between border rounded-md p-3">
              <div>
                <div className="text-sm font-medium">Integração ativa</div>
                <div className="text-xs text-muted-foreground">Quando desligada, nenhum push será enviado.</div>
              </div>
              <Switch
                checked={data.enabled}
                onCheckedChange={(v) => setData({ ...data, enabled: v })}
              />
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
