import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Server, Bell } from "lucide-react";
import { toast } from "sonner";

const MODULES = [
  { key: "email_servers", label: "Servidores de E-mail (Titan)", icon: Mail, description: "Permite ao tenant configurar Titan, gerenciar caixas e enviar e-mails." },
  { key: "push_onesignal", label: "Push (OneSignal)", icon: Bell, description: "Permite ao tenant configurar a integração OneSignal e enviar notificações push aos membros." },
];

interface TenantRow {
  id: string;
  name: string;
  overrides: Record<string, boolean | null>;
  plan_modules: string[];
}

export default function AdminModulosEmail() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: ts }, { data: ov }, { data: plans }] = await Promise.all([
      supabase.from("tenants").select("id, name").order("name"),
      supabase.from("tenant_module_overrides").select("tenant_id, module_key, enabled"),
      supabase.from("plans").select("tenant_id, modules, is_active"),
    ]);
    const overridesByTenant: Record<string, Record<string, boolean>> = {};
    (ov ?? []).forEach((o: { tenant_id: string; module_key: string; enabled: boolean }) => {
      overridesByTenant[o.tenant_id] ??= {};
      overridesByTenant[o.tenant_id][o.module_key] = o.enabled;
    });
    const planByTenant: Record<string, string[]> = {};
    (plans ?? []).forEach((p: { tenant_id: string | null; modules: unknown; is_active: boolean }) => {
      if (!p.tenant_id || !p.is_active) return;
      const mods = Array.isArray(p.modules) ? p.modules as string[] : [];
      planByTenant[p.tenant_id] = mods;
    });
    setTenants((ts ?? []).map((t: { id: string; name: string }) => ({
      id: t.id, name: t.name,
      overrides: overridesByTenant[t.id] ?? {},
      plan_modules: planByTenant[t.id] ?? [],
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleOverride = async (tenantId: string, moduleKey: string, value: boolean | null) => {
    try {
      if (value === null) {
        const { error } = await supabase.from("tenant_module_overrides")
          .delete().eq("tenant_id", tenantId).eq("module_key", moduleKey);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tenant_module_overrides")
          .upsert({ tenant_id: tenantId, module_key: moduleKey, enabled: value }, { onConflict: "tenant_id,module_key" });
        if (error) throw error;
      }
      toast.success("Atualizado");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold flex items-center gap-2"><Server className="h-6 w-6 text-primary" /> Módulos por Loja</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Disponibilidade vem do plano; aqui você pode forçar ligar/desligar módulos para lojas específicas.
        </p>
      </div>

      {MODULES.map(m => {
        const Icon = m.icon;
        return (
          <Card key={m.key}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-serif"><Icon className="h-4 w-4 text-primary" /> {m.label}</CardTitle>
              <CardDescription>{m.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {tenants.map(t => {
                const override = t.overrides[m.key];
                const inPlan = t.plan_modules.includes(m.key);
                const effective = override ?? inPlan;
                return (
                  <div key={t.id} className="flex items-center justify-between px-3 py-2 border rounded">
                    <div>
                      <div className="font-medium text-sm">{t.name}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px]">Plano: {inPlan ? "incluído" : "não incluído"}</Badge>
                        {override !== undefined && <Badge className="text-[9px] bg-accent text-accent-foreground">Override: {override ? "ligado" : "desligado"}</Badge>}
                        <span>Efetivo: {effective ? "✅" : "—"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={effective}
                        onCheckedChange={(v) => toggleOverride(t.id, m.key, v === inPlan ? null : v)}
                      />
                      {override !== undefined && (
                        <button onClick={() => toggleOverride(t.id, m.key, null)}
                          className="text-[10px] text-muted-foreground hover:text-primary underline">
                          remover override
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
