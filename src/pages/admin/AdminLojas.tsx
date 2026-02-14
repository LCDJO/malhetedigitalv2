import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Search, Building2, CreditCard } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Tenant = Tables<"tenants">;
type LodgeConfig = Tables<"lodge_config">;
type Plan = Tables<"plans">;

interface TenantWithConfig extends Tenant {
  lodge_config?: LodgeConfig | null;
}

const emptyForm = {
  name: "", slug: "", is_active: true,
  cnpj: "", endereco: "", email: "", telefone: "",
  potencia: "", rito: "", orient: "", lodge_number: "",
  plan_id: "",
};

export default function AdminLojas() {
  const [tenants, setTenants] = useState<TenantWithConfig[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Record<string, { plan_id: string; id: string }>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TenantWithConfig | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: tenantsData }, { data: configsData }, { data: plansData }, { data: subsData }] = await Promise.all([
      supabase.from("tenants").select("*").order("created_at", { ascending: false }),
      supabase.from("lodge_config").select("*"),
      supabase.from("plans").select("*").eq("is_active", true).order("price"),
      supabase.from("subscriptions").select("id, tenant_id, plan_id, status").eq("status", "active"),
    ]);

    setPlans(plansData ?? []);

    const subsMap: Record<string, { plan_id: string; id: string }> = {};
    (subsData ?? []).forEach((s) => { subsMap[s.tenant_id] = { plan_id: s.plan_id, id: s.id }; });
    setSubscriptions(subsMap);

    const configMap = new Map<string, LodgeConfig>();
    (configsData ?? []).forEach((c) => { if (c.tenant_id) configMap.set(c.tenant_id, c); });

    const merged: TenantWithConfig[] = (tenantsData ?? []).map((t) => ({
      ...t,
      lodge_config: configMap.get(t.id) ?? null,
    }));

    setTenants(merged);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (t: TenantWithConfig) => {
    setEditing(t);
    const c = t.lodge_config;
    setForm({
      name: t.name,
      slug: t.slug,
      is_active: t.is_active,
      cnpj: (t as any).cnpj || "",
      endereco: (t as any).endereco || c?.endereco || "",
      email: (t as any).email || c?.email_institucional || "",
      telefone: (t as any).telefone || c?.telefone || "",
      potencia: (t as any).potencia || c?.potencia || "",
      rito: (t as any).rito || "",
      orient: (t as any).orient || c?.orient || "",
      lodge_number: (t as any).lodge_number || c?.lodge_number || "",
      plan_id: subscriptions[t.id]?.plan_id || "",
    });
    setDialogOpen(true);
  };

  const resolve = (t: TenantWithConfig, field: string, configField?: string) => {
    const val = (t as any)[field];
    if (val) return val;
    if (t.lodge_config) return (t.lodge_config as any)[configField ?? field] ?? "";
    return "";
  };

  const getPlanName = (tenantId: string) => {
    const sub = subscriptions[tenantId];
    if (!sub) return null;
    const plan = plans.find((p) => p.id === sub.plan_id);
    return plan?.name || null;
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast({ title: "Preencha nome e slug", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name, slug: form.slug, is_active: form.is_active,
      cnpj: form.cnpj, endereco: form.endereco, email: form.email, telefone: form.telefone,
      potencia: form.potencia, rito: form.rito, orient: form.orient, lodge_number: form.lodge_number,
    };

    let tenantId = editing?.id;

    if (editing) {
      const { error } = await supabase.from("tenants").update(payload).eq("id", editing.id);
      if (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
        setSaving(false); return;
      }
    } else {
      const { data, error } = await supabase.from("tenants").insert(payload).select("id").single();
      if (error) {
        toast({ title: "Erro ao criar Loja", description: error.message, variant: "destructive" });
        setSaving(false); return;
      }
      tenantId = data.id;
    }

    // Handle plan/subscription
    if (tenantId && form.plan_id) {
      const existingSub = subscriptions[tenantId];
      if (existingSub) {
        if (existingSub.plan_id !== form.plan_id) {
          await supabase.from("subscriptions").update({ plan_id: form.plan_id }).eq("id", existingSub.id);
        }
      } else {
        // Get first owner of tenant for user_id, or use a placeholder
        const { data: ownerData } = await supabase
          .from("tenant_users")
          .select("user_id")
          .eq("tenant_id", tenantId)
          .eq("role", "owner")
          .limit(1)
          .maybeSingle();

        const userId = ownerData?.user_id || tenantId; // fallback

        await supabase.from("subscriptions").insert({
          tenant_id: tenantId,
          plan_id: form.plan_id,
          user_id: userId,
          status: "active",
        });
      }
    } else if (tenantId && !form.plan_id && subscriptions[tenantId]) {
      // Remove subscription if plan was cleared
      await supabase.from("subscriptions").update({ status: "canceled" }).eq("id", subscriptions[tenantId].id);
    }

    toast({ title: editing ? "Loja atualizada com sucesso" : "Loja criada com sucesso" });
    setSaving(false);
    setDialogOpen(false);
    fetchData();
  };

  const filtered = tenants.filter(
    (t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Lojas</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie todas as Lojas cadastradas na plataforma.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Nova Loja</Button>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou slug..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Badge variant="secondary" className="text-xs">{filtered.length} {filtered.length === 1 ? "loja" : "lojas"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Building2 className="h-10 w-10 opacity-40" /><p className="text-sm">Nenhuma loja encontrada.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Nº</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Potência</TableHead>
                  <TableHead>Oriente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs font-mono">{resolve(t, "lodge_number") || "—"}</TableCell>
                    <TableCell>
                      {getPlanName(t.id) ? (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <CreditCard className="h-3 w-3" />
                          {getPlanName(t.id)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{resolve(t, "potencia") || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{resolve(t, "orient") || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={t.is_active ? "default" : "secondary"} className="text-[10px]">{t.is_active ? "Ativa" : "Inativa"}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(t.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">{editing ? "Editar Loja" : "Nova Loja"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Identificação */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Identificação
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name">Nome da Loja *</Label>
                  <Input id="name" placeholder="Ex: Loja Estrela do Oriente nº 123" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (identificador único) *</Label>
                  <Input id="slug" placeholder="Ex: estrela-oriente-123" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} />
                  <p className="text-[11px] text-muted-foreground">Somente letras minúsculas, números e hífens.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lodge_number">Número da Loja</Label>
                  <Input id="lodge_number" placeholder="Ex: 2693" value={form.lodge_number} onChange={(e) => setForm({ ...form, lodge_number: e.target.value })} />
                </div>
                <div className="flex items-center justify-between sm:col-span-2">
                  <Label htmlFor="active">Loja ativa</Label>
                  <Switch id="active" checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Plano */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" /> Plano de Assinatura
              </p>
              <div className="space-y-2">
                <Label>Plano *</Label>
                <Select value={form.plan_id} onValueChange={(v) => setForm({ ...form, plan_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano..." />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <span>{p.name}</span>
                          <span className="text-muted-foreground text-xs">
                            — R$ {p.price.toFixed(2)}/mês • até {p.max_members} membros
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {plans.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">Nenhum plano ativo cadastrado. Crie planos em "Planos".</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Dados Empresariais */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados Empresariais</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" placeholder="contato@loja.org.br" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" placeholder="(00) 00000-0000" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input id="endereco" placeholder="Rua, número, bairro, cidade – UF" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Dados Maçônicos */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados Maçônicos</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="potencia">Potência / Obediência</Label>
                  <Input id="potencia" placeholder="Ex: Grande Oriente do Brasil (GOB)" value={form.potencia} onChange={(e) => setForm({ ...form, potencia: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rito">Rito Adotado</Label>
                  <Input id="rito" placeholder="Ex: Rito Escocês Antigo e Aceito" value={form.rito} onChange={(e) => setForm({ ...form, rito: e.target.value })} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="orient">Oriente</Label>
                  <Input id="orient" placeholder="Ex: Alta Floresta – MT" value={form.orient} onChange={(e) => setForm({ ...form, orient: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : editing ? "Salvar" : "Criar Loja"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
