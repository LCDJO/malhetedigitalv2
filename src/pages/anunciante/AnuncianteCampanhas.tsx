import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdvertiser } from "@/components/anunciante/AnuncianteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Plus, Megaphone, Pencil, Trash2, Loader2, Play, Pause, Square,
  Search, Eye, MousePointerClick, Filter,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  target_pages: string[];
  target_slots: string[] | null;
  total_budget: number | null;
  daily_budget: number | null;
  created_at: string;
}

const PAGE_OPTIONS = [
  { value: "portal_dashboard", label: "Portal — Dashboard" },
  { value: "portal_financeiro", label: "Portal — Financeiro" },
  { value: "portal_jornada", label: "Portal — Jornada" },
  { value: "login", label: "Tela de Login" },
  { value: "dashboard_admin", label: "Dashboard Admin" },
  { value: "totem", label: "Totem" },
];

const SLOT_OPTIONS = [
  { value: "banner_principal", label: "Banner Principal" },
  { value: "sidebar", label: "Sidebar" },
  { value: "inline", label: "Inline (entre conteúdo)" },
  { value: "footer", label: "Rodapé" },
  { value: "totem_bottom", label: "Totem — Rodapé" },
];

export default function AnuncianteCampanhas() {
  const advertiser = useAdvertiser();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [targetPages, setTargetPages] = useState<string[]>([]);
  const [targetSlots, setTargetSlots] = useState<string[]>([]);
  const [totalBudget, setTotalBudget] = useState("");
  const [dailyBudget, setDailyBudget] = useState("");

  // Stats per campaign
  const [campaignStats, setCampaignStats] = useState<Record<string, { imp: number; clk: number }>>({});

  const fetchCampaigns = async () => {
    let query = supabase
      .from("ad_campaigns")
      .select("*")
      .eq("advertiser_id", advertiser.id)
      .order("created_at", { ascending: false });
    if (statusFilter !== "todos") query = query.eq("status", statusFilter as any);
    const { data } = await query;
    const list = (data as Campaign[]) ?? [];
    setCampaigns(list);
    setLoading(false);

    // Fetch stats for each campaign
    if (list.length > 0) {
      const statsMap: Record<string, { imp: number; clk: number }> = {};
      await Promise.all(
        list.map(async (c) => {
          const [impRes, clkRes] = await Promise.all([
            supabase.from("ad_impressions").select("id", { count: "exact", head: true }).eq("campaign_id", c.id),
            supabase.from("ad_clicks").select("id", { count: "exact", head: true }).eq("campaign_id", c.id),
          ]);
          statsMap[c.id] = { imp: impRes.count ?? 0, clk: clkRes.count ?? 0 };
        })
      );
      setCampaignStats(statsMap);
    }
  };

  useEffect(() => { fetchCampaigns(); }, [advertiser.id, statusFilter]);

  const openNew = () => {
    setEditing(null);
    setName(""); setDescription(""); setStartDate(""); setEndDate("");
    setTargetPages([]); setTargetSlots([]); setTotalBudget(""); setDailyBudget("");
    setDialogOpen(true);
  };

  const openEdit = (c: Campaign) => {
    setEditing(c);
    setName(c.name);
    setDescription(c.description ?? "");
    setStartDate(c.start_date?.slice(0, 10) ?? "");
    setEndDate(c.end_date?.slice(0, 10) ?? "");
    setTargetPages(c.target_pages ?? []);
    setTargetSlots(c.target_slots ?? []);
    setTotalBudget(c.total_budget?.toString() ?? "");
    setDailyBudget(c.daily_budget?.toString() ?? "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Nome é obrigatório."); return; }
    if (targetPages.length === 0) { toast.error("Selecione pelo menos uma página-alvo."); return; }
    setSaving(true);

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      start_date: startDate || null,
      end_date: endDate || null,
      target_pages: targetPages,
      target_slots: targetSlots.length > 0 ? targetSlots : null,
      total_budget: totalBudget ? parseFloat(totalBudget) : null,
      daily_budget: dailyBudget ? parseFloat(dailyBudget) : null,
    };

    if (editing) {
      const { error } = await supabase.from("ad_campaigns").update(payload).eq("id", editing.id);
      if (error) toast.error(error.message);
      else toast.success("Campanha atualizada!");
    } else {
      const { error } = await supabase.from("ad_campaigns").insert({
        advertiser_id: advertiser.id,
        ...payload,
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
    await supabase.from("ad_creatives").delete().eq("campaign_id", id);
    await supabase.from("ad_campaigns").delete().eq("id", id);
    toast.success("Campanha excluída.");
    fetchCampaigns();
  };

  const toggleCheckbox = (list: string[], value: string, setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: any; label: string }> = {
      rascunho: { variant: "secondary", label: "Rascunho" },
      ativa: { variant: "default", label: "Ativa" },
      pausada: { variant: "outline", label: "Pausada" },
      encerrada: { variant: "destructive", label: "Encerrada" },
    };
    const s = map[status] || map.rascunho;
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const filtered = campaigns.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar campanha..." className="pl-10" />
        </div>
        <div className="flex gap-1.5">
          {["todos", "rascunho", "ativa", "pausada", "encerrada"].map((s) => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className="capitalize text-xs">
              {s}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
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
        <div className="grid gap-3">
          {filtered.map((c) => {
            const st = campaignStats[c.id];
            const ctr = st && st.imp > 0 ? ((st.clk / st.imp) * 100).toFixed(1) : "0.0";
            return (
              <Card key={c.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-foreground truncate">{c.name}</h3>
                        {statusBadge(c.status)}
                      </div>
                      {c.description && <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>}

                      {/* Metrics inline */}
                      {st && (
                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-0.5">
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {st.imp.toLocaleString("pt-BR")}</span>
                          <span className="flex items-center gap-1"><MousePointerClick className="h-3 w-3" /> {st.clk.toLocaleString("pt-BR")}</span>
                          <span className="font-medium text-foreground">{ctr}% CTR</span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                        {c.start_date && <span>Início: {new Date(c.start_date).toLocaleDateString("pt-BR")}</span>}
                        {c.end_date && <span>Fim: {new Date(c.end_date).toLocaleDateString("pt-BR")}</span>}
                        {c.target_pages.length > 0 && (
                          <span className="text-accent">{c.target_pages.length} página(s) alvo</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
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
            );
          })}
        </div>
      )}

      {/* Campaign Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
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
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Objetivo da campanha..." rows={2} />
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

            {/* Target Pages */}
            <div>
              <Label className="mb-2 block">Páginas-alvo *</Label>
              <div className="grid grid-cols-1 gap-2">
                {PAGE_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={targetPages.includes(opt.value)}
                      onCheckedChange={() => toggleCheckbox(targetPages, opt.value, setTargetPages)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Target Slots */}
            <div>
              <Label className="mb-2 block">Espaços (slots)</Label>
              <div className="grid grid-cols-2 gap-2">
                {SLOT_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={targetSlots.includes(opt.value)}
                      onCheckedChange={() => toggleCheckbox(targetSlots, opt.value, setTargetSlots)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Orçamento Total (R$)</Label>
                <Input type="number" value={totalBudget} onChange={(e) => setTotalBudget(e.target.value)} placeholder="0.00" min="0" step="0.01" />
              </div>
              <div>
                <Label>Orçamento Diário (R$)</Label>
                <Input type="number" value={dailyBudget} onChange={(e) => setDailyBudget(e.target.value)} placeholder="0.00" min="0" step="0.01" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                {editing ? "Salvar" : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
