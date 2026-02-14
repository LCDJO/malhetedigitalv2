import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdvertiser } from "@/components/anunciante/AnuncianteLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Megaphone, Pencil, Trash2, Loader2, Play, Pause, Square } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export default function AnuncianteCampanhas() {
  const advertiser = useAdvertiser();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [saving, setSaving] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchCampaigns = async () => {
    const { data } = await supabase
      .from("ad_campaigns")
      .select("*")
      .eq("advertiser_id", advertiser.id)
      .order("created_at", { ascending: false });
    setCampaigns((data as Campaign[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, [advertiser.id]);

  const openNew = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setDialogOpen(true);
  };

  const openEdit = (c: Campaign) => {
    setEditing(c);
    setName(c.name);
    setDescription(c.description ?? "");
    setStartDate(c.start_date?.slice(0, 10) ?? "");
    setEndDate(c.end_date?.slice(0, 10) ?? "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Nome é obrigatório."); return; }
    setSaving(true);

    if (editing) {
      const { error } = await supabase
        .from("ad_campaigns")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          start_date: startDate || null,
          end_date: endDate || null,
        })
        .eq("id", editing.id);
      if (error) toast.error(error.message);
      else toast.success("Campanha atualizada!");
    } else {
      const { error } = await supabase.from("ad_campaigns").insert({
        advertiser_id: advertiser.id,
        name: name.trim(),
        description: description.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
      });
      if (error) toast.error(error.message);
      else toast.success("Campanha criada!");
    }

    setSaving(false);
    setDialogOpen(false);
    fetchCampaigns();
  };

  const updateStatus = async (id: string, status: "rascunho" | "ativa" | "pausada" | "encerrada") => {
    await supabase.from("ad_campaigns").update({ status }).eq("id", id);
    toast.success(`Status alterado para ${status}.`);
    fetchCampaigns();
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("Excluir esta campanha e todos os criativos vinculados?")) return;
    await supabase.from("ad_campaigns").delete().eq("id", id);
    toast.success("Campanha excluída.");
    fetchCampaigns();
  };

  const statusColors: Record<string, string> = {
    rascunho: "secondary",
    ativa: "default",
    pausada: "outline",
    encerrada: "destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Campanhas</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie suas campanhas publicitárias</p>
        </div>
        <Button className="gap-2" onClick={openNew}>
          <Plus className="h-4 w-4" /> Nova Campanha
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">Nenhuma campanha encontrada.</p>
            <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={openNew}>
              <Plus className="h-3.5 w-3.5" /> Criar campanha
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((c) => (
            <Card key={c.id}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground truncate">{c.name}</h3>
                      <Badge variant={statusColors[c.status] as any ?? "secondary"} className="shrink-0">
                        {c.status}
                      </Badge>
                    </div>
                    {c.description && <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>}
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
                      {c.start_date && <span>Início: {new Date(c.start_date).toLocaleDateString("pt-BR")}</span>}
                      {c.end_date && <span>Fim: {new Date(c.end_date).toLocaleDateString("pt-BR")}</span>}
                      <span>Criada: {new Date(c.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {c.status === "rascunho" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-success" title="Ativar" onClick={() => updateStatus(c.id, "ativa")}>
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {c.status === "ativa" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-warning" title="Pausar" onClick={() => updateStatus(c.id, "pausada")}>
                        <Pause className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {c.status === "pausada" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-success" title="Reativar" onClick={() => updateStatus(c.id, "ativa")}>
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {(c.status === "ativa" || c.status === "pausada") && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Encerrar" onClick={() => updateStatus(c.id, "encerrada")}>
                        <Square className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCampaign(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">{editing ? "Editar Campanha" : "Nova Campanha"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da Campanha *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Promoção de Verão" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o objetivo..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data de Início</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label>Data de Fim</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                {editing ? "Salvar" : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
