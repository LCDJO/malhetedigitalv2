import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTenant } from "@/contexts/TenantContext";
import { api } from "@/lib/api";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  interval_days: number;
  is_active: boolean;
}

export default function GamifyPlans() {
  const { tenant, isTenantAdmin } = useTenant();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "0", interval_days: "30" });

  const fetchPlans = async () => {
    if (!tenant) return;
    const res = await api<{ data: Plan[] }>("plans", { tenantId: tenant.id });
    setPlans(res.data || []);
  };

  useEffect(() => { fetchPlans(); }, [tenant]);

  const handleCreate = async () => {
    if (!tenant) return;
    await api("plans", {
      method: "POST",
      tenantId: tenant.id,
      body: { name: form.name, description: form.description, price: parseFloat(form.price), interval_days: parseInt(form.interval_days) },
    });
    toast.success("Plano criado!");
    setOpen(false);
    setForm({ name: "", description: "", price: "0", interval_days: "30" });
    fetchPlans();
  };

  const handleDelete = async (id: string) => {
    if (!tenant) return;
    await api(`plans/${id}`, { method: "DELETE", tenantId: tenant.id });
    toast.success("Plano removido!");
    fetchPlans();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold">Planos</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os planos de recorrência</p>
        </div>
        {isTenantAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Plano</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Plano</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Preço (R$)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                  <div><Label>Intervalo (dias)</Label><Input type="number" value={form.interval_days} onChange={(e) => setForm({ ...form, interval_days: e.target.value })} /></div>
                </div>
                <Button onClick={handleCreate} className="w-full">Criar Plano</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{plan.description || "Sem descrição"}</p>
              </div>
              {isTenantAdmin && (
                <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">R$ {Number(plan.price).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">a cada {plan.interval_days} dias</p>
            </CardContent>
          </Card>
        ))}
        {plans.length === 0 && <p className="text-muted-foreground col-span-2 text-center py-8">Nenhum plano cadastrado.</p>}
      </div>
    </div>
  );
}
