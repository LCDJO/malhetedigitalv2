import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useUserTenant } from "@/core/tenant/useUserTenant";
import { useScope } from "@/contexts/ScopeContext";
import { useAuth } from "@/core/auth";
import { hasPermission } from "@/domains/security/permissions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  listarPranchas, criarPrancha, atualizarPrancha, enviarParaAnalise,
  darParecer, publicarPrancha, uploadArquivo, getSignedUrl,
  type PranchaSubmissao, type BibliotecaCategoria,
} from "@/services/repositorio";
import { Send, CheckCircle2, XCircle, BookUp, Plus, Download, Pencil } from "lucide-react";

const CATEGORIAS: { value: BibliotecaCategoria; label: string }[] = [
  { value: "prancha", label: "Prancha" },
  { value: "livro", label: "Livro" },
  { value: "ritualistica", label: "Ritualística" },
  { value: "historia", label: "História" },
  { value: "simbolismo", label: "Simbolismo" },
  { value: "filosofia", label: "Filosofia" },
  { value: "outros", label: "Outros" },
];

const GRAUS = [
  { value: 1, label: "Aprendiz" },
  { value: 2, label: "Companheiro" },
  { value: 3, label: "Mestre" },
];

const ESTADO_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  rascunho: { label: "Rascunho", variant: "outline" },
  em_analise: { label: "Em análise", variant: "secondary" },
  aprovada: { label: "Aprovada", variant: "default" },
  rejeitada: { label: "Rejeitada", variant: "destructive" },
  publicada: { label: "Publicada", variant: "default" },
};

export default function Pranchas() {
  const { tenantId } = useUserTenant();
  const { user } = useAuth();
  const { appRole, tenantRole } = useScope();
  const canApprove = hasPermission("lodge_config", "approve", appRole, tenantRole);

  const [meMemberId, setMeMemberId] = useState<string | null>(null);
  const [meGrau, setMeGrau] = useState<number>(1);
  const [tab, setTab] = useState<"minhas" | "fila">("minhas");
  const [todas, setTodas] = useState<PranchaSubmissao[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PranchaSubmissao | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    titulo: "", resumo: "", conteudo: "",
    categoria: "prancha" as BibliotecaCategoria, grau: 1,
  });

  const [parecerOpen, setParecerOpen] = useState<PranchaSubmissao | null>(null);
  const [parecerText, setParecerText] = useState("");

  // Resolver member do usuário autenticado
  useEffect(() => {
    (async () => {
      if (!user?.email || !tenantId) return;
      const { data } = await supabase.from("members")
        .select("id, grau_numerico")
        .eq("tenant_id", tenantId).eq("email", user.email).maybeSingle();
      setMeMemberId(data?.id ?? null);
      setMeGrau(data?.grau_numerico ?? 1);
    })();
  }, [user, tenantId]);

  async function load() {
    if (!tenantId) return;
    setLoading(true);
    try {
      const all = await listarPranchas(tenantId);
      setTodas(all);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [tenantId]);

  const minhas = todas.filter(p => p.member_id === meMemberId);
  const fila = todas.filter(p => p.estado === "em_analise" || p.estado === "aprovada");

  function openCreate() {
    setEditing(null); setFile(null);
    setForm({ titulo: "", resumo: "", conteudo: "", categoria: "prancha", grau: meGrau });
    setOpen(true);
  }
  function openEdit(p: PranchaSubmissao) {
    if (p.estado !== "rascunho") { toast.error("Apenas rascunhos podem ser editados."); return; }
    setEditing(p); setFile(null);
    setForm({ titulo: p.titulo, resumo: p.resumo ?? "", conteudo: p.conteudo ?? "", categoria: p.categoria, grau: p.grau });
    setOpen(true);
  }

  async function salvar() {
    if (!tenantId || !meMemberId) { toast.error("Sua ficha de membro não foi localizada."); return; }
    if (!form.titulo.trim()) { toast.error("Título é obrigatório."); return; }
    try {
      let storage_path = editing?.storage_path ?? null;
      let mime_type = editing?.mime_type ?? null;
      if (file) {
        const up = await uploadArquivo(tenantId, "pranchas", file);
        storage_path = up.path; mime_type = up.mime;
      }
      const payload = { ...form, storage_path, mime_type };
      if (editing) await atualizarPrancha(editing.id, payload);
      else await criarPrancha({ tenant_id: tenantId, member_id: meMemberId, ...payload });
      toast.success("Salvo.");
      setOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
  }

  async function enviar(p: PranchaSubmissao) {
    try { await enviarParaAnalise(p.id); toast.success("Enviado para análise."); load(); }
    catch (e: any) { toast.error(e.message); }
  }

  async function decidir(estado: "aprovada" | "rejeitada") {
    if (!parecerOpen || !user) return;
    if (!parecerText.trim()) { toast.error("Informe o parecer."); return; }
    try {
      await darParecer(parecerOpen.id, estado, parecerText, user.id);
      toast.success(estado === "aprovada" ? "Prancha aprovada." : "Prancha rejeitada.");
      setParecerOpen(null); setParecerText(""); load();
    } catch (e: any) { toast.error(e.message); }
  }

  async function publicar(p: PranchaSubmissao) {
    try { await publicarPrancha(p); toast.success("Publicada na biblioteca."); load(); }
    catch (e: any) { toast.error(e.message); }
  }

  async function baixar(p: PranchaSubmissao) {
    if (!p.storage_path) return;
    try { const url = await getSignedUrl(p.storage_path); window.open(url, "_blank"); }
    catch (e: any) { toast.error(e.message); }
  }

  function renderCard(p: PranchaSubmissao, isMine: boolean) {
    const est = ESTADO_LABEL[p.estado];
    return (
      <Card key={p.id}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm leading-tight">{p.titulo}</CardTitle>
            <Badge variant={est.variant} className="text-[10px] shrink-0">{est.label}</Badge>
          </div>
          <CardDescription className="text-xs">
            Grau {p.grau} • {CATEGORIAS.find(c => c.value === p.categoria)?.label}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {p.resumo && <p className="text-xs text-muted-foreground line-clamp-2">{p.resumo}</p>}
          {p.parecer && (
            <div className="rounded border bg-muted/40 p-2 text-[11px]">
              <strong>Parecer:</strong> {p.parecer}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1 pt-1">
            {p.storage_path && (
              <Button size="sm" variant="outline" onClick={() => baixar(p)}>
                <Download className="h-3.5 w-3.5 mr-1" /> Arquivo
              </Button>
            )}
            {isMine && p.estado === "rascunho" && (
              <>
                <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                </Button>
                <Button size="sm" onClick={() => enviar(p)}>
                  <Send className="h-3.5 w-3.5 mr-1" /> Enviar
                </Button>
              </>
            )}
            {canApprove && p.estado === "em_analise" && (
              <Button size="sm" onClick={() => { setParecerOpen(p); setParecerText(""); }}>
                Dar parecer
              </Button>
            )}
            {canApprove && p.estado === "aprovada" && (
              <Button size="sm" variant="default" onClick={() => publicar(p)}>
                <BookUp className="h-3.5 w-3.5 mr-1" /> Publicar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold">Pranchas / Trabalhos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Envie pranchas para apreciação do Orador/Venerável e acompanhe a fila de aprovação.
          </p>
        </div>
        {meMemberId && (
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Nova Prancha</Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="minhas">Minhas Pranchas ({minhas.length})</TabsTrigger>
          {canApprove && <TabsTrigger value="fila">Fila de Aprovação ({fila.length})</TabsTrigger>}
        </TabsList>

        <TabsContent value="minhas" className="mt-4">
          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Carregando…</p>
          ) : minhas.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
              Você ainda não criou pranchas.
            </CardContent></Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {minhas.map(p => renderCard(p, true))}
            </div>
          )}
        </TabsContent>

        {canApprove && (
          <TabsContent value="fila" className="mt-4">
            {fila.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma prancha aguardando.
              </CardContent></Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {fila.map(p => renderCard(p, p.member_id === meMemberId))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Modal criar/editar */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Rascunho" : "Nova Prancha"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div><Label>Título *</Label>
              <Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} /></div>
            <div><Label>Resumo</Label>
              <Textarea value={form.resumo} onChange={e => setForm(f => ({ ...f, resumo: e.target.value }))} rows={2} /></div>
            <div><Label>Conteúdo</Label>
              <Textarea value={form.conteudo} onChange={e => setForm(f => ({ ...f, conteudo: e.target.value }))} rows={6} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v as BibliotecaCategoria }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Grau</Label>
                <Select value={String(form.grau)} onValueChange={v => setForm(f => ({ ...f, grau: parseInt(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{GRAUS.map(g => <SelectItem key={g.value} value={String(g.value)}>{g.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Anexo (opcional)</Label>
              <Input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>Salvar Rascunho</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Parecer */}
      <Dialog open={!!parecerOpen} onOpenChange={(o) => !o && setParecerOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Parecer — {parecerOpen?.titulo}</DialogTitle>
          </DialogHeader>
          <Textarea rows={5} value={parecerText} onChange={e => setParecerText(e.target.value)} placeholder="Descreva o parecer..." />
          <DialogFooter className="gap-2">
            <Button variant="destructive" onClick={() => decidir("rejeitada")}>
              <XCircle className="h-4 w-4 mr-1" /> Rejeitar
            </Button>
            <Button onClick={() => decidir("aprovada")}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
