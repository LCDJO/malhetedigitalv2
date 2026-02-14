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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Pencil, Search, Building2, CreditCard, Trash2, Undo2, Mail, Phone, MapPin, Hash, Globe, ScrollText, Shield, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ConfirmSensitiveAction } from "@/components/ConfirmSensitiveAction";
import type { Tables } from "@/integrations/supabase/types";
import { useAuditLog } from "@/hooks/useAuditLog";

type Tenant = Tables<"tenants"> & { deleted_at?: string | null; purge_at?: string | null };
type LodgeConfig = Tables<"lodge_config">;
type Plan = Tables<"plans">;

interface TenantWithConfig extends Tenant {
  lodge_config?: LodgeConfig | null;
  member_count?: number;
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
  const { logAction } = useAuditLog();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TenantWithConfig | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTenant, setDeleteTenant] = useState<TenantWithConfig | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: tenantsData }, { data: configsData }, { data: plansData }, { data: subsData }, { data: membersCountData }] = await Promise.all([
      supabase.from("tenants").select("*").order("created_at", { ascending: false }),
      supabase.from("lodge_config").select("*"),
      supabase.from("plans").select("*").eq("is_active", true).order("price"),
      supabase.from("subscriptions").select("id, tenant_id, plan_id, status").eq("status", "active"),
      supabase.from("members").select("tenant_id"),
    ]);

    setPlans(plansData ?? []);

    const subsMap: Record<string, { plan_id: string; id: string }> = {};
    (subsData ?? []).forEach((s) => { subsMap[s.tenant_id] = { plan_id: s.plan_id, id: s.id }; });
    setSubscriptions(subsMap);

    const configMap = new Map<string, LodgeConfig>();
    (configsData ?? []).forEach((c) => { if (c.tenant_id) configMap.set(c.tenant_id, c); });

    const memberCountMap = new Map<string, number>();
    (membersCountData ?? []).forEach((m) => {
      if (m.tenant_id) memberCountMap.set(m.tenant_id, (memberCountMap.get(m.tenant_id) || 0) + 1);
    });

    const merged: TenantWithConfig[] = (tenantsData ?? []).map((t) => ({
      ...t,
      lodge_config: configMap.get(t.id) ?? null,
      member_count: memberCountMap.get(t.id) ?? 0,
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

  const isDeleted = (t: TenantWithConfig) => !!(t as any).deleted_at;

  const daysUntilPurge = (t: TenantWithConfig) => {
    const purgeAt = (t as any).purge_at;
    if (!purgeAt) return null;
    const diff = new Date(purgeAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
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
        const { data: ownerData } = await supabase
          .from("tenant_users")
          .select("user_id")
          .eq("tenant_id", tenantId)
          .eq("role", "owner")
          .limit(1)
          .maybeSingle();

        const userId = ownerData?.user_id || tenantId;

        await supabase.from("subscriptions").insert({
          tenant_id: tenantId,
          plan_id: form.plan_id,
          user_id: userId,
          status: "active",
        });
      }
    } else if (tenantId && !form.plan_id && subscriptions[tenantId]) {
      await supabase.from("subscriptions").update({ status: "canceled" }).eq("id", subscriptions[tenantId].id);
    }

    toast({ title: editing ? "Loja atualizada com sucesso" : "Loja criada com sucesso" });
    logAction({ action: editing ? "UPDATE_TENANT" : "CREATE_TENANT", targetTable: "tenants", targetId: tenantId ?? undefined, details: { name: form.name } });
    setSaving(false);
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteTenant) return;
    const now = new Date();
    const purgeDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { error } = await supabase.from("tenants").update({
      deleted_at: now.toISOString(),
      purge_at: purgeDate.toISOString(),
      is_active: false,
    } as any).eq("id", deleteTenant.id);

    if (error) {
      toast({ title: "Erro ao excluir loja", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Loja marcada para exclusão", description: "Os dados serão removidos permanentemente em 30 dias." });
      logAction({ action: "DELETE_TENANT", targetTable: "tenants", targetId: deleteTenant.id, details: { name: deleteTenant.name } });
    }
    setDeleteTenant(null);
    fetchData();
  };

  const handleRestore = async (t: TenantWithConfig) => {
    const { error } = await supabase.from("tenants").update({
      deleted_at: null,
      purge_at: null,
      is_active: true,
    } as any).eq("id", t.id);

    if (error) {
      toast({ title: "Erro ao restaurar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Loja restaurada com sucesso" });
      logAction({ action: "RESTORE_TENANT", targetTable: "tenants", targetId: t.id, details: { name: t.name } });
    }
    fetchData();
  };

  const filtered = tenants.filter(
    (t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.toLowerCase().includes(search.toLowerCase())
  );

  // Separate active from deleted
  const activeTenants = filtered.filter((t) => !isDeleted(t));
  const deletedTenants = filtered.filter((t) => isDeleted(t));

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
            <Badge variant="secondary" className="text-xs">{activeTenants.length} {activeTenants.length === 1 ? "loja ativa" : "lojas ativas"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
          ) : activeTenants.length === 0 && deletedTenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Building2 className="h-10 w-10 opacity-40" /><p className="text-sm">Nenhuma loja encontrada.</p>
            </div>
          ) : (
            <>
              {activeTenants.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Nº</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Potência</TableHead>
                      <TableHead>Oriente</TableHead>
                      <TableHead>Membros</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criada em</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeTenants.map((t) => (
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
                        <TableCell className="text-center font-medium">{t.member_count ?? 0}</TableCell>
                        <TableCell>
                          <Badge variant={t.is_active ? "default" : "secondary"} className="text-[10px]">{t.is_active ? "Ativa" : "Inativa"}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">{new Date(t.created_at).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)} title="Editar">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTenant(t)} title="Excluir">
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {deletedTenants.length > 0 && (
                <div className="border-t border-border/60">
                  <div className="px-4 py-3 bg-destructive/5">
                    <p className="text-xs font-semibold text-destructive uppercase tracking-wider flex items-center gap-1.5">
                      <Trash2 className="h-3.5 w-3.5" />
                      Aguardando exclusão definitiva ({deletedTenants.length})
                    </p>
                  </div>
                  <Table>
                    <TableBody>
                      {deletedTenants.map((t) => {
                        const days = daysUntilPurge(t);
                        return (
                          <TableRow key={t.id} className="opacity-60">
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
                              <Badge variant="destructive" className="text-[10px]">
                                {days !== null ? `Exclusão em ${days}d` : "Excluindo..."}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {(t as any).deleted_at ? new Date((t as any).deleted_at).toLocaleDateString("pt-BR") : "—"}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRestore(t)} title="Restaurar">
                                <Undo2 className="h-3.5 w-3.5 text-primary" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog — Premium redesign */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          {/* Header with avatar */}
          <div className="px-6 pt-6 pb-4 border-b border-border/40 bg-muted/30">
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14 rounded-xl border-2 border-primary/20 shadow-sm">
                <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-xl font-serif font-bold">
                  {form.name?.[0]?.toUpperCase() || "L"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <DialogHeader className="text-left space-y-1">
                  <DialogTitle className="font-serif text-xl">
                    {editing ? "Editar Loja" : "Nova Loja"}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    {editing
                      ? `Editando "${editing.name}" · ${editing.member_count ?? 0} membros`
                      : "Preencha os dados para cadastrar uma nova Loja na plataforma."}
                  </p>
                </DialogHeader>
                {editing && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={form.is_active ? "default" : "secondary"} className="text-[10px]">
                      {form.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                    {getPlanName(editing.id) && (
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <CreditCard className="h-3 w-3" />
                        {getPlanName(editing.id)}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabbed form */}
          <div className="px-6 py-5">
            <Tabs defaultValue="identificacao" className="w-full">
              <TabsList className="w-full justify-start gap-1 bg-muted/50 p-1 h-auto flex-wrap">
                <TabsTrigger value="identificacao" className="gap-1.5 text-xs">
                  <Building2 className="h-3.5 w-3.5" /> Identificação
                </TabsTrigger>
                <TabsTrigger value="plano" className="gap-1.5 text-xs">
                  <CreditCard className="h-3.5 w-3.5" /> Plano
                </TabsTrigger>
                <TabsTrigger value="empresarial" className="gap-1.5 text-xs">
                  <ScrollText className="h-3.5 w-3.5" /> Empresarial
                </TabsTrigger>
                <TabsTrigger value="maconico" className="gap-1.5 text-xs">
                  <Shield className="h-3.5 w-3.5" /> Maçônico
                </TabsTrigger>
              </TabsList>

              {/* Tab: Identificação */}
              <TabsContent value="identificacao" className="mt-5 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="name" className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      Nome da Loja <span className="text-destructive">*</span>
                    </Label>
                    <Input id="name" placeholder="Ex: Loja Estrela do Oriente nº 123" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug" className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      Slug <span className="text-destructive">*</span>
                    </Label>
                    <Input id="slug" placeholder="estrela-oriente-123" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} className="font-mono text-sm" />
                    <p className="text-[11px] text-muted-foreground">Identificador único. Somente letras minúsculas, números e hífens.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lodge_number" className="flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                      Número da Loja
                    </Label>
                    <Input id="lodge_number" placeholder="Ex: 2693" value={form.lodge_number} onChange={(e) => setForm({ ...form, lodge_number: e.target.value })} />
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20">
                  <div>
                    <Label htmlFor="active" className="text-sm font-medium">Loja ativa</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Lojas inativas não podem ser acessadas por membros.</p>
                  </div>
                  <Switch id="active" checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                </div>
              </TabsContent>

              {/* Tab: Plano */}
              <TabsContent value="plano" className="mt-5 space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                    Plano de Assinatura <span className="text-destructive">*</span>
                  </Label>
                  <Select value={form.plan_id} onValueChange={(v) => setForm({ ...form, plan_id: v })}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione um plano..." />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{p.name}</span>
                            <span className="text-muted-foreground text-xs">
                              — R$ {p.price.toFixed(2)}/mês • até {p.max_members} membros
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {plans.length === 0 && (
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-dashed border-border bg-muted/20 text-muted-foreground">
                    <CreditCard className="h-5 w-5 opacity-50" />
                    <div>
                      <p className="text-sm font-medium">Nenhum plano disponível</p>
                      <p className="text-xs">Crie planos de assinatura na seção "Planos" para vinculá-los às Lojas.</p>
                    </div>
                  </div>
                )}
                {form.plan_id && (
                  <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                    <p className="text-xs text-primary font-medium">
                      ✓ Plano selecionado: {plans.find(p => p.id === form.plan_id)?.name}
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Tab: Empresarial */}
              <TabsContent value="empresarial" className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cnpj" className="flex items-center gap-1.5">
                      <ScrollText className="h-3.5 w-3.5 text-muted-foreground" />
                      CNPJ
                    </Label>
                    <Input id="cnpj" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      E-mail
                    </Label>
                    <Input id="email" type="email" placeholder="contato@loja.org.br" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone" className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      Telefone
                    </Label>
                    <Input id="telefone" placeholder="(00) 00000-0000" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="endereco" className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      Endereço
                    </Label>
                    <Input id="endereco" placeholder="Rua, número, bairro, cidade – UF" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
                  </div>
                </div>
              </TabsContent>

              {/* Tab: Maçônico */}
              <TabsContent value="maconico" className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="potencia" className="flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                      Potência / Obediência
                    </Label>
                    <Input id="potencia" placeholder="Ex: Grande Oriente do Brasil (GOB)" value={form.potencia} onChange={(e) => setForm({ ...form, potencia: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rito" className="flex items-center gap-1.5">
                      <ScrollText className="h-3.5 w-3.5 text-muted-foreground" />
                      Rito Adotado
                    </Label>
                    <Input id="rito" placeholder="Ex: Rito Escocês Antigo e Aceito" value={form.rito} onChange={(e) => setForm({ ...form, rito: e.target.value })} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="orient" className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      Oriente
                    </Label>
                    <Input id="orient" placeholder="Ex: Alta Floresta – MT" value={form.orient} onChange={(e) => setForm({ ...form, orient: e.target.value })} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border/40 bg-muted/20 flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              {editing ? `ID: ${editing.id.slice(0, 8)}…` : "Campos com * são obrigatórios"}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-[120px]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? "Salvando..." : editing ? "Salvar Alterações" : "Criar Loja"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmSensitiveAction
        open={!!deleteTenant}
        onOpenChange={(open) => { if (!open) setDeleteTenant(null); }}
        title="Excluir Loja"
        description={`Tem certeza que deseja excluir a loja "${deleteTenant?.name}"? Todos os dados associados (membros, lançamentos, configurações) serão permanentemente removidos após 30 dias. Durante esse período, a exclusão pode ser revertida.`}
        confirmLabel="Excluir"
        requireTypedConfirmation="EXCLUIR"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
