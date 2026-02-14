import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdvertiser } from "@/components/anunciante/AnuncianteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, ImagePlus, Loader2, Trash2, ExternalLink } from "lucide-react";

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

export default function AnuncianteCriativos() {
  const advertiser = useAdvertiser();
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${advertiser.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("ad-creatives").upload(path, file);
    if (error) {
      toast.error("Erro ao enviar arquivo.");
      setUploading(false);
      return;
    }

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

    const { error } = await supabase.from("ad_creatives").insert({
      advertiser_id: advertiser.id,
      campaign_id: campaignId,
      title: title.trim(),
      media_url: mediaUrl,
      media_type: mediaType,
      destination_url: destinationUrl.trim() || null,
      grupo,
    });

    if (error) toast.error(error.message);
    else {
      toast.success("Criativo adicionado!");
      setDialogOpen(false);
      setTitle("");
      setCampaignId("");
      setDestinationUrl("");
      setMediaUrl("");
      fetchData();
    }
    setSaving(false);
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

  const grupoLabels: Record<string, string> = {
    banner_principal: "Banner Principal",
    sidebar: "Sidebar",
    inline: "Inline",
    login: "Tela de Login",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Criativos</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seus banners e mídias</p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)} disabled={campaigns.length === 0}>
          <Plus className="h-4 w-4" /> Novo Criativo
        </Button>
      </div>

      {campaigns.length === 0 && !loading && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p className="text-sm">Crie uma campanha primeiro para adicionar criativos.</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : creatives.length === 0 && campaigns.length > 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImagePlus className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">Nenhum criativo encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {creatives.map((c) => (
            <Card key={c.id} className="overflow-hidden">
              <div className="aspect-video bg-muted relative">
                {c.media_type === "video" ? (
                  <video src={c.media_url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={c.media_url} alt={c.title} className="w-full h-full object-cover" />
                )}
                {!c.is_active && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <span className="text-xs font-medium text-muted-foreground">Inativo</span>
                  </div>
                )}
              </div>
              <CardContent className="pt-3 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                    <p className="text-[11px] text-muted-foreground">{grupoLabels[c.grupo] || c.grupo}</p>
                    <div className="flex gap-3 mt-1 text-[11px] text-muted-foreground">
                      <span>{c.impressions_count} impressões</span>
                      <span>{c.clicks_count} cliques</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => toggleActive(c.id, c.is_active)}
                      title={c.is_active ? "Desativar" : "Ativar"}
                    >
                      <div className={`h-2.5 w-2.5 rounded-full ${c.is_active ? "bg-success" : "bg-muted-foreground"}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteCreative(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Creative Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Novo Criativo</DialogTitle>
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
                  <SelectItem value="banner_principal">Banner Principal</SelectItem>
                  <SelectItem value="sidebar">Sidebar</SelectItem>
                  <SelectItem value="inline">Inline</SelectItem>
                  <SelectItem value="login">Tela de Login</SelectItem>
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
                  <img src={mediaUrl} alt="Preview" className="w-full h-32 object-cover" />
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
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                Criar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
