import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Search, CreditCard, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ConfirmSensitiveAction } from "@/components/ConfirmSensitiveAction";
import { useAuditLog } from "@/hooks/useAuditLog";

const ALL_MODULES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "secretaria", label: "Secretaria" },
  { id: "tesouraria", label: "Tesouraria" },
  { id: "chancelaria", label: "Chancelaria" },
  { id: "configuracoes", label: "Configurações" },
  { id: "totem", label: "Totem" },
];

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  interval_days: number;
  is_active: boolean;
  features: string[];
  modules: string[];
  max_members: number;
  max_totems: number;
  stripe_price_id: string | null;
  created_at: string;
}

const emptyForm = {
  name: "",
  description: "",
  price: 0,
  interval_days: 30,
  is_active: true,
  modules: ALL_MODULES.map((m) => m.id),
  max_members: 0,
  max_totems: 0,
  stripe_price_id: "",
};

export default function AdminPlanos() {
  const { logAction } = useAuditLog();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("plans")
      .select("*")
      .is("tenant_id", null)
      .order("price", { ascending: true });
    setPlans(
      (data ?? []).map((p: any) => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : [],
        modules: Array.isArray(p.modules) ? p.modules : [],
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: Plan) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description ?? "",
      price: p.price,
      interval_days: p.interval_days,
      is_active: p.is_active,
      modules: p.modules,
      max_members: p.max_members,
      max_totems: (p as any).max_totems ?? 0,
      stripe_price_id: p.stripe_price_id ?? "",
    });
    setDialogOpen(true);
  };

  const toggleModule = (moduleId: string) => {
    setForm((prev) => ({
      ...prev,
      modules: prev.modules.includes(moduleId)
        ? prev.modules.filter((m) => m !== moduleId)
        : [...prev.modules, moduleId],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Preencha o nome do plano", variant: "destructive" });
      return;
    }
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      interval_days: Number(form.interval_days),
      is_active: form.is_active,
      features: form.modules,
      modules: form.modules,
      max_members: Number(form.max_members),
      max_totems: Number(form.max_totems),
      stripe_price_id: form.stripe_price_id.trim() || null,
      tenant_id: null,
    };

    if (editing) {
      const { error } = await supabase.from("plans").update(payload).eq("id", editing.id);
      if (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Plano atualizado com sucesso" });
        logAction({ action: "UPDATE_PLAN", targetTable: "plans", targetId: editing.id, details: { name: form.name } });
      }
    } else {
      const { error } = await supabase.from("plans").insert(payload);
      if (error) {
        toast({ title: "Erro ao criar plano", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Plano criado com sucesso" });
        logAction({ action: "CREATE_PLAN", targetTable: "plans", details: { name: form.name, price: form.price } });
      }
    }

    setSaving(false);
    setDialogOpen(false);
    fetchPlans();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("plans").delete().eq("id", deleteTarget.id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Plano excluído com sucesso" });
      logAction({ action: "DELETE_PLAN", targetTable: "plans", targetId: deleteTarget.id, details: { name: deleteTarget.name } });
    }
    setDeleteTarget(null);
    setShowDeleteConfirm(false);
    fetchPlans();
  };

  const filtered = plans.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (v: number) =>
    v === 0 ? "Gratuito" : `R$ ${v.toFixed(2).replace(".", ",")}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Planos e Assinaturas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os planos disponíveis para as Lojas da plataforma.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Plano
        </Button>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar plano..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Badge variant="secondary" className="text-xs">
              {filtered.length} {filtered.length === 1 ? "plano" : "planos"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <CreditCard className="h-10 w-10 opacity-40" />
              <p className="text-sm">Nenhum plano encontrado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Módulos</TableHead>
                   <TableHead>Limite Membros</TableHead>
                   <TableHead>Totens</TableHead>
                   <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{p.name}</span>
                        {p.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{formatCurrency(p.price)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.interval_days} dias</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.modules.map((m) => (
                          <Badge key={m} variant="outline" className="text-[10px] px-1.5 py-0">
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.max_members === 0 ? (
                        <span className="text-muted-foreground">Ilimitado</span>
                      ) : (
                        p.max_members
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.max_totems === 0 ? (
                        <span className="text-muted-foreground">Ilimitado</span>
                      ) : (
                        p.max_totems
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.is_active ? "default" : "secondary"} className="text-[10px]">
                        {p.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            setDeleteTarget(p);
                            setShowDeleteConfirm(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">{editing ? "Editar Plano" : "Novo Plano"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Nome do Plano</Label>
              <Input
                id="plan-name"
                placeholder="Ex: Premium"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-desc">Descrição</Label>
              <Textarea
                id="plan-desc"
                placeholder="Descrição do plano..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan-price">Valor (R$)</Label>
                <Input
                  id="plan-price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-interval">Ciclo (dias)</Label>
                <Input
                  id="plan-interval"
                  type="number"
                  min={1}
                  value={form.interval_days}
                  onChange={(e) => setForm({ ...form, interval_days: parseInt(e.target.value) || 30 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan-members">Limite de Membros</Label>
                <Input
                  id="plan-members"
                  type="number"
                  min={0}
                  value={form.max_members}
                  onChange={(e) => setForm({ ...form, max_members: parseInt(e.target.value) || 0 })}
                />
                <p className="text-[11px] text-muted-foreground">0 = ilimitado</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-totems">Limite de Totens</Label>
                <Input
                  id="plan-totems"
                  type="number"
                  min={0}
                  value={form.max_totems}
                  onChange={(e) => setForm({ ...form, max_totems: parseInt(e.target.value) || 0 })}
                />
                <p className="text-[11px] text-muted-foreground">0 = ilimitado</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-stripe">Stripe Price ID</Label>
                <Input
                  id="plan-stripe"
                  placeholder="price_..."
                  value={form.stripe_price_id}
                  onChange={(e) => setForm({ ...form, stripe_price_id: e.target.value })}
                />
                <p className="text-[11px] text-muted-foreground">Opcional</p>
              </div>
            </div>
            <div className="space-y-3">
              <Label>Módulos Disponíveis</Label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_MODULES.map((mod) => (
                  <label
                    key={mod.id}
                    className="flex items-center gap-2 p-2 rounded-md border border-border/60 cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      checked={form.modules.includes(mod.id)}
                      onCheckedChange={() => toggleModule(mod.id)}
                    />
                    <span className="text-sm">{mod.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="plan-active">Plano ativo</Label>
              <Switch
                id="plan-active"
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Salvar" : "Criar Plano"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmSensitiveAction
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="Excluir Plano"
          description={`Tem certeza que deseja excluir o plano "${deleteTarget.name}"? Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          requireTypedConfirmation="EXCLUIR"
          destructive
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
