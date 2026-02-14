import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ConfirmSensitiveAction } from "@/components/ConfirmSensitiveAction";
import {
  Image as ImageIcon, Video, Plus, Pencil, Trash2, Upload, Eye, Calendar,
} from "lucide-react";

const PAGINA_CHECKBOXES: { value: string; label: string }[] = [
  { value: "admin", label: "SuperAdmin" },
  { value: "loja", label: "Login da Loja" },
  { value: "portal", label: "Portal do Irmão" },
];

function parsePaginas(pagina: string): string[] {
  if (!pagina || pagina === "todos") return ["admin", "loja", "portal"];
  return pagina.split(",").filter(Boolean);
}

function serializePaginas(selected: string[]): string {
  if (selected.length === 0) return "todos";
  const sorted = [...selected].sort();
  if (sorted.length === 3 && sorted.join(",") === "admin,loja,portal") return "todos";
  return sorted.join(",");
}

function getPaginaLabels(pagina: string): string[] {
  const items = parsePaginas(pagina);
  if (items.length === 3) return ["Todos"];
  return items.map((v) => PAGINA_CHECKBOXES.find((p) => p.value === v)?.label ?? v);
}

interface Banner {
  id: string;
  titulo: string;
  tipo: "imagem" | "video";
  media_url: string;
  data_inicio: string;
  data_fim: string | null;
  ativo: boolean;
  duracao_segundos: number;
  pagina: string;
  created_at: string;
}

export function TabBannerLogin() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteBanner, setDeleteBanner] = useState<Banner | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Form state
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<"imagem" | "video">("imagem");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [duracaoSegundos, setDuracaoSegundos] = useState(8);
  const [paginasSelecionadas, setPaginasSelecionadas] = useState<string[]>(["admin", "loja", "portal"]);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("login_banners")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar banners");
    else setBanners((data as Banner[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const resetForm = () => {
    setTitulo("");
    setTipo("imagem");
    setDataInicio(new Date().toISOString().slice(0, 16));
    setDataFim("");
    setDuracaoSegundos(8);
    setPaginasSelecionadas(["admin", "loja", "portal"]);
    setFile(null);
    setFilePreview(null);
    setEditBanner(null);
  };

  const openCreate = () => {
    resetForm();
    setDataInicio(new Date().toISOString().slice(0, 16));
    setDialogOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditBanner(b);
    setTitulo(b.titulo);
    setTipo(b.tipo);
    setDataInicio(b.data_inicio.slice(0, 16));
    setDataFim(b.data_fim ? b.data_fim.slice(0, 16) : "");
    setDuracaoSegundos(b.duracao_segundos ?? 8);
    setPaginasSelecionadas(parsePaginas(b.pagina));
    setFile(null);
    setFilePreview(b.media_url);
    setDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const isImage = f.type.startsWith("image/");
    const isVideo = f.type.startsWith("video/");

    if (tipo === "imagem" && !isImage) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    if (tipo === "video" && !isVideo) {
      toast.error("Selecione um arquivo de vídeo");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      toast.error("Arquivo deve ter no máximo 20MB");
      return;
    }

    setFile(f);
    if (isImage) {
      setFilePreview(URL.createObjectURL(f));
    } else {
      setFilePreview(URL.createObjectURL(f));
    }
  };

  const handleSave = async () => {
    if (!titulo.trim()) { toast.error("Título é obrigatório"); return; }
    if (!dataInicio) { toast.error("Data de início é obrigatória"); return; }
    if (!editBanner && !file) { toast.error("Selecione um arquivo"); return; }
    if (paginasSelecionadas.length === 0) { toast.error("Selecione ao menos uma página"); return; }

    setSaving(true);
    try {
      let mediaUrl = editBanner?.media_url || "";

      // Upload file if new
      if (file) {
        const ext = file.name.split(".").pop() || "bin";
        const path = `banners/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("login-banners")
          .upload(path, file, { upsert: true });
        if (upErr) {
          toast.error("Erro ao enviar arquivo: " + upErr.message);
          setSaving(false);
          return;
        }
        const { data: urlData } = supabase.storage.from("login-banners").getPublicUrl(path);
        mediaUrl = urlData.publicUrl;
      }

      const payload = {
        titulo: titulo.trim(),
        tipo,
        media_url: mediaUrl,
        data_inicio: new Date(dataInicio).toISOString(),
        data_fim: dataFim ? new Date(dataFim).toISOString() : null,
        duracao_segundos: duracaoSegundos,
        pagina: serializePaginas(paginasSelecionadas),
      };

      if (editBanner) {
        const { error } = await supabase
          .from("login_banners")
          .update(payload)
          .eq("id", editBanner.id);
        if (error) { toast.error("Erro ao atualizar: " + error.message); setSaving(false); return; }
        toast.success("Banner atualizado");
      } else {
        const { error } = await supabase
          .from("login_banners")
          .insert(payload);
        if (error) { toast.error("Erro ao criar: " + error.message); setSaving(false); return; }
        toast.success("Banner criado");
      }

      setDialogOpen(false);
      resetForm();
      fetchBanners();
    } catch {
      toast.error("Erro inesperado");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteBanner) return;
    const { error } = await supabase
      .from("login_banners")
      .delete()
      .eq("id", deleteBanner.id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Banner excluído");
    setDeleteBanner(null);
    fetchBanners();
  };

  const toggleAtivo = async (b: Banner) => {
    const { error } = await supabase
      .from("login_banners")
      .update({ ativo: !b.ativo })
      .eq("id", b.id);
    if (error) { toast.error("Erro ao alterar status"); return; }
    toast.success(b.ativo ? "Banner desativado" : "Banner ativado");
    fetchBanners();
  };

  const isActive = (b: Banner) => {
    if (!b.ativo) return false;
    const now = new Date();
    const start = new Date(b.data_inicio);
    if (now < start) return false;
    if (b.data_fim && now > new Date(b.data_fim)) return false;
    return true;
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-4">
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                Banners
              </CardTitle>
              <CardDescription className="mt-1">
                Gerencie as mídias exibidas no painel lateral da tela de autenticação.
              </CardDescription>
            </div>
            <Button onClick={openCreate} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Novo Banner
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Página</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                  </TableCell>
                </TableRow>
              ) : banners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Nenhum banner cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                banners.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {b.tipo === "imagem" ? (
                          <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <Video className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        {b.titulo}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {b.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getPaginaLabels(b.pagina).map((label) => (
                          <Badge key={label} variant="secondary" className="text-[10px]">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(b.data_inicio)}
                        {b.data_fim && <> — {formatDate(b.data_fim)}</>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {b.duracao_segundos}s
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={b.ativo}
                          onCheckedChange={() => toggleAtivo(b)}
                          className="scale-90"
                        />
                        <Badge
                          variant={isActive(b) ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {isActive(b) ? "Exibindo" : b.ativo ? "Agendado" : "Inativo"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => setPreviewUrl(b.media_url)}
                          title="Visualizar"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => openEdit(b)}
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => setDeleteBanner(b)}
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">
              {editBanner ? "Editar Banner" : "Novo Banner"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-2">
            {/* Left column — Media upload & preview */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Tipo de Mídia *</Label>
                <Select value={tipo} onValueChange={(v) => { setTipo(v as "imagem" | "video"); setFile(null); setFilePreview(editBanner?.media_url || null); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="imagem">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" /> Imagem
                      </div>
                    </SelectItem>
                    <SelectItem value="video">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" /> Vídeo
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>{editBanner ? "Substituir Arquivo" : "Arquivo *"}</Label>
                <div className="border border-dashed border-border rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept={tipo === "imagem" ? "image/*" : "video/*"}
                    onChange={handleFileChange}
                    className="hidden"
                    id="banner-file-input"
                  />
                  <label
                    htmlFor="banner-file-input"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {file ? file.name : "Clique para selecionar"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {tipo === "imagem" ? "JPG, PNG, WebP" : "MP4, WebM"} • Máx 20MB
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Tamanho ideal: 1920 × 1080 px (16:9)
                    </span>
                  </label>
                </div>
              </div>

              {/* Preview area */}
              {filePreview && (
                <div className="rounded-lg overflow-hidden border border-border bg-muted/30">
                  <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                    {tipo === "imagem" ? (
                      <img src={filePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <video src={filePreview} className="absolute inset-0 w-full h-full object-cover" muted autoPlay loop playsInline />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center py-1.5">Pré-visualização (16:9)</p>
                </div>
              )}

              {!filePreview && (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 flex items-center justify-center" style={{ aspectRatio: "16/9" }}>
                  <div className="text-center text-muted-foreground/50">
                    <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">Nenhuma mídia selecionada</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right column — Form fields */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Título *</Label>
                <Input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Campanha Dezembro"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label>Exibir em *</Label>
                <div className="flex flex-wrap gap-4">
                  {PAGINA_CHECKBOXES.map((p) => (
                    <label key={p.value} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={paginasSelecionadas.includes(p.value)}
                        onCheckedChange={(checked) => {
                          setPaginasSelecionadas((prev) =>
                            checked
                              ? [...prev, p.value]
                              : prev.filter((v) => v !== p.value)
                          );
                        }}
                      />
                      <span className="text-sm">{p.label}</span>
                    </label>
                  ))}
                </div>
                {paginasSelecionadas.length === 3 && (
                  <p className="text-[10px] text-muted-foreground">Todos os portais selecionados</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Data de Início *</Label>
                <Input
                  type="datetime-local"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Data de Fim</Label>
                <Input
                  type="datetime-local"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">Deixe vazio para exibição contínua</p>
              </div>

              <div className="space-y-1.5">
                <Label>Duração (segundos)</Label>
                <Input
                  type="number"
                  min={3}
                  max={120}
                  value={duracaoSegundos}
                  onChange={(e) => setDuracaoSegundos(Math.max(3, Number(e.target.value)))}
                />
                <p className="text-[10px] text-muted-foreground">Tempo de exibição na rotação entre banners</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : editBanner ? "Salvar" : "Criar Banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">Pré-visualização</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="rounded-lg overflow-hidden border border-border">
              {previewUrl.match(/\.(mp4|webm|ogg)/) ? (
                <video src={previewUrl} controls className="w-full max-h-[60vh] object-contain" />
              ) : (
                <img src={previewUrl} alt="Banner preview" className="w-full max-h-[60vh] object-contain" />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmSensitiveAction
        open={!!deleteBanner}
        onOpenChange={(open) => { if (!open) setDeleteBanner(null); }}
        title="Excluir Banner"
        description={`Tem certeza que deseja excluir o banner "${deleteBanner?.titulo}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        requireTypedConfirmation="EXCLUIR"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
