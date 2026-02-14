import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdvertiser } from "@/components/anunciante/AnuncianteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, ImagePlus, Loader2, Trash2, Pencil, Eye, MousePointerClick } from "lucide-react";

interface Creative {
  id: string;
  title: string;
  media_url: string;
  media_type: string;
  destination_url: string | null;
  grupo: string;
  is_active: boolean;
  campaign_id: string;
  impressions_count: number;
  clicks_count: number;
}

interface CampaignOption {
  id: string;
  name: string;
}

const grupoLabels: Record<string, string> = {
  banner_principal: "Banner Principal",
  sidebar: "Sidebar",
  inline: "Inline",
  login: "Tela de Login",
  footer: "Rodapé",
};

export default function AnuncianteCriativos() {
  const advertiser = useAdvertiser();
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Creative | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterCampaign, setFilterCampaign] = useState("todos");

  // Form
  const [title, setTitle] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [grupo, setGrupo] = useState("banner_principal");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image");

  const fetchData = async () => {
    const [creativesRes, campaignsRes] = await Promise.all([
      supabase.from("ad_creatives").select("*").eq("advertiser_id", advertiser.id).order("created_at", { ascending: false }),
      supabase.from("ad_campaigns").select("id, name").eq("advertiser_id", advertiser.id).order("name"),
    ]);
    setCreatives((creativesRes.data as Creative[]) ?? []);
    setCampaigns((campaignsRes.data as CampaignOption[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [advertiser.id]);

  const openNew = () => {
    setEditing(null);
    setTitle(""); setCampaignId(""); setDestinationUrl(""); setGrupo("banner_principal");
    setMediaUrl(""); setMediaType("image");
    setDialogOpen(true);
  };

  const openEdit = (c: Creative) => {
    setEditing(c);
    setTitle(c.title);
    setCampaignId(c.campaign_id);
    setDestinationUrl(c.destination_url ?? "");
    setGrupo(c.grupo);
    setMediaUrl(c.media_url);
    setMediaType(c.media_type);
    setDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${advertiser.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("ad-creatives").upload(path, file);
    if (error) { toast.error("Erro ao enviar arquivo."); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("ad-creatives").getPublicUrl(path);
    setMediaUrl(urlData.publicUrl);
    setMediaType(file.type.startsWith("video") ? "video" : "image");
    setUploading(false);
    toast.success("Arquivo enviado!");
  };

  const handleSave = async () => {
    if (!title.trim() || !campaignId || !mediaUrl) {
      toast.error("Preencha os campos obrigatórios (título, campanha e mídia).");
      return;
    }
    setSaving(true);

    const payload = {
      title: title.trim(),
      campaign_id: campaignId,
      media_url: mediaUrl,
      media_type: mediaType,
      destination_url: destinationUrl.trim() || null,
      grupo,
    };

    if (editing) {
      const { error } = await supabase.from("ad_creatives").update(payload).eq("id", editing.id);
      if (error) toast.error(error.message);
      else toast.success("Criativo atualizado!");
    } else {
      const { error } = await supabase.from("ad_creatives").insert({
        advertiser_id: advertiser.id,
        ...payload,
      });
      if (error) toast.error(error.message);
      else toast.success("Criativo adicionado!");
    }

    setSaving(false);
    setDialogOpen(false);
    fetchData();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("ad_creatives").update({ is_active: !current }).eq("id", id);
    fetchData();
  };

  const deleteCreative = async (id: string) => {
    if (!confirm("Excluir este criativo?")) return;
    await supabase.from("ad_creatives").delete().eq("id", id);
    toast.success("Criativo excluído.");
    fetchData();
  };

  const filtered = filterCampaign === "todos"
    ? creatives
    : creatives.filter((c) => c.campaign_id === filterCampaign);

  const campaignName = (id: string) => campaigns.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Criativos</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seus banners e mídias</p>
        </div>
        <Button className="gap-2" onClick={openNew} disabled={campaigns.length === 0}>
          <Plus className="h-4 w-4" /> Novo Criativo
        </Button>
      </div>

      {/* Filter by campaign */}
      {campaigns.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          <Button variant={filterCampaign === "todos" ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setFilterCampaign("todos")}>
            Todos
          </Button>
          {campaigns.map((c) => (
            <Button key={c.id} variant={filterCampaign === c.id ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setFilterCampaign(c.id)}>
              {c.name}
            </Button>
          ))}
        </div>
      )}

      {campaigns.length === 0 && !loading && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p className="text-sm">Crie uma campanha primeiro para adicionar criativos.</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 && campaigns.length > 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImagePlus className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">Nenhum criativo encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const ctr = c.impressions_count > 0 ? ((c.clicks_count / c.impressions_count) * 100).toFixed(1) : "0.0";
            return (
              <Card key={c.id} className="overflow-hidden group">
                <div className="aspect-video bg-muted relative">
                  {c.media_type === "video" ? (
                    <video src={c.media_url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={c.media_url} alt={c.title} className="w-full h-full object-cover" />
                  )}
                  {!c.is_active && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                      <Badge variant="secondary">Inativo</Badge>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-background/0 group-hover:bg-background/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => deleteCreative(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <CardContent className="pt-3 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                      <button
                        onClick={() => toggleActive(c.id, c.is_active)}
                        className={`h-2.5 w-2.5 rounded-full shrink-0 transition-colors ${c.is_active ? "bg-success" : "bg-muted-foreground/40"}`}
                        title={c.is_active ? "Desativar" : "Ativar"}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">{grupoLabels[c.grupo] || c.grupo} · {campaignName(c.campaign_id)}</p>
                    <div className="flex gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {c.impressions_count}</span>
                      <span className="flex items-center gap-1"><MousePointerClick className="h-3 w-3" /> {c.clicks_count}</span>
                      <span className="font-medium text-foreground">{ctr}% CTR</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Creative Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">{editing ? "Editar Criativo" : "Novo Criativo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do banner" />
            </div>
            <div>
              <Label>Campanha *</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Espaço</Label>
              <Select value={grupo} onValueChange={setGrupo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(grupoLabels).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>URL de Destino</Label>
              <Input value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)} placeholder="https://seusite.com" />
            </div>
            <div>
              <Label>Mídia *</Label>
              {mediaUrl ? (
                <div className="relative rounded-md overflow-hidden border">
                  {mediaType === "video" ? (
                    <video src={mediaUrl} className="w-full h-32 object-cover" muted />
                  ) : (
                    <img src={mediaUrl} alt="Preview" className="w-full h-32 object-cover" />
                  )}
                  <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => setMediaUrl("")}>
                    Remover
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-md p-6 text-center">
                  <input type="file" accept="image/*,video/*" onChange={handleFileUpload} className="hidden" id="creative-upload" />
                  <label htmlFor="creative-upload" className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    {uploading ? (
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    ) : (
                      <>
                        <ImagePlus className="h-6 w-6 mx-auto mb-2 opacity-40" />
                        Clique para enviar imagem ou vídeo
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
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
