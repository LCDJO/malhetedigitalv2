import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTenant } from "@/contexts/TenantContext";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Building2, Plus, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function TenantSelect() {
  const { tenants, setCurrentTenant, refreshTenants, loading } = useTenant();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "" });

  const handleCreate = async () => {
    try {
      const res = await api<{ data: { id: string } }>("tenants", {
        method: "POST",
        body: { name: form.name, slug: form.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-") },
      });
      toast.success("Tenant criado!");
      setOpen(false);
      await refreshTenants();
      setCurrentTenant(res.data.id);
      navigate("/app");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSelect = (id: string) => {
    setCurrentTenant(id);
    navigate("/app");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-serif font-bold">Gamify Recorrência</h1>
          <p className="text-muted-foreground mt-2">Selecione ou crie um workspace</p>
        </div>

        <div className="space-y-3">
          {tenants.map((t) => (
            <Card key={t.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => handleSelect(t.id)}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.slug}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full gap-2">
              <Plus className="h-4 w-4" /> Criar novo workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Workspace</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Minha Empresa" /></div>
              <div><Label>Slug (URL)</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="minha-empresa" /></div>
              <Button onClick={handleCreate} className="w-full">Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
