import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmSensitiveAction } from "@/components/ConfirmSensitiveAction";
import { useUserTenant } from "@/core/tenant/useUserTenant";
import { useScope } from "@/contexts/ScopeContext";
import { hasPermission } from "@/domains/security/permissions";
import { toast } from "sonner";
import {
  listarBiblioteca, criarBibliotecaItem, atualizarBibliotecaItem, excluirBibliotecaItem,
  uploadArquivo, getSignedUrl, registrarLeitura, contarLeituras,
  type BibliotecaItem, type BibliotecaCategoria,
} from "@/services/repositorio";
import { BookOpen, Download, Trash2, Plus, Eye, Upload } from "lucide-react";

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
  { value: 1, label: "Aprendiz (1°)" },
  { value: 2, label: "Companheiro (2°)" },
  { value: 3, label: "Mestre (3°)" },
];

export default function Biblioteca() {
  const { tenantId } = useUserTenant();
  const { appRole, tenantRole } = useScope();
  const canWrite = hasPermission("lodge_config", "write", appRole, tenantRole);

  const [items, setItems] = useState<BibliotecaItem[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<BibliotecaCategoria | "all">("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BibliotecaItem | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [confirmDel, setConfirmDel] = useState<BibliotecaItem | null>(null);

  const [form, setForm] = useState({
    titulo: "", autor: "", descricao: "", conteudo: "",
    categoria: "outros" as BibliotecaCategoria, grau_minimo: 1, publicado: true,
  });

  async function load() {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [its, lt] = await Promise.all([listarBiblioteca(tenantId), contarLeituras(tenantId)]);
      setItems(its); setStats(lt.porBiblioteca);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [tenantId]);

  function openCreate() {
    setEditing(null); setFile(null);
    setForm({ titulo: "", autor: "", descricao: "", conteudo: "", categoria: "outros", grau_minimo: 1, publicado: true });
    setOpen(true);
  }
  function openEdit(it: BibliotecaItem) {
    setEditing(it); setFile(null);
    setForm({
      titulo: it.titulo, autor: it.autor ?? "", descricao: it.descricao ?? "",
      conteudo: it.conteudo ?? "", categoria: it.categoria, grau_minimo: it.grau_minimo,
      publicado: it.publicado,
    });
    setOpen(true);
  }

  async function salvar() {
    if (!tenantId) return;
    if (!form.titulo.trim()) { toast.error("Título é obrigatório."); return; }
    try {
      let storage_path = editing?.storage_path ?? null;
      let mime_type = editing?.mime_type ?? null;
      let tamanho_bytes = editing?.tamanho_bytes ?? null;
      if (file) {
        const up = await uploadArquivo(tenantId, "biblioteca", file);
        storage_path = up.path; mime_type = up.mime; tamanho_bytes = up.size;
      }
      const payload = { ...form, storage_path, mime_type, tamanho_bytes };
      if (editing) await atualizarBibliotecaItem(editing.id, payload);
      else await criarBibliotecaItem({ tenant_id: tenantId, ...payload });
      toast.success(editing ? "Item atualizado." : "Item adicionado à biblioteca.");
      setOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
  }

  async function abrir(it: BibliotecaItem) {
    try {
      await registrarLeitura({ tenantId: it.tenant_id, bibliotecaItemId: it.id, acao: it.storage_path ? "baixou" : "visualizou" });
      if (it.storage_path) {
        const url = await getSignedUrl(it.storage_path);
        window.open(url, "_blank");
      } else {
        toast.info("Item sem arquivo anexo (apenas conteúdo textual).");
      }
    } catch (e: any) { toast.error(e.message); }
  }

  async function excluir() {
    if (!confirmDel) return;
    try {
      await excluirBibliotecaItem(confirmDel.id);
      toast.success("Item excluído.");
      setConfirmDel(null); load();
    } catch (e: any) { toast.error(e.message); }
  }

  const filtered = items.filter(i =>
    (filtro === "all" || i.categoria === filtro) &&
    (!search || i.titulo.toLowerCase().includes(search.toLowerCase()) ||
      (i.autor ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold">Biblioteca — Tempo de Estudos</h1>
          <p className="text-sm text-muted-foreground mt-1">Acervo de pranchas, livros e materiais de estudo.</p>
        </div>
        {canWrite && (
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Novo Item</Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <Label className="text-xs">Buscar</Label>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Título ou autor..." />
            </div>
            <div className="w-56">
              <Label className="text-xs">Categoria</Label>
              <Select value={filtro} onValueChange={(v) => setFiltro(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Carregando…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhum item disponível.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(it => (
                <Card key={it.id} className="hover:shadow-md transition">
                  <CardHeader className="pb-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <CardTitle className="text-sm leading-tight">{it.titulo}</CardTitle>
                    <CardDescription className="text-xs">
                      {CATEGORIAS.find(c => c.value === it.categoria)?.label}
                      {it.autor ? ` • ${it.autor}` : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {it.descricao && <p className="text-xs text-muted-foreground line-clamp-2">{it.descricao}</p>}
                    <div className="flex items-center gap-1 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">Grau ≥ {it.grau_minimo}</Badge>
                      {!it.publicado && <Badge variant="secondary" className="text-[10px]">Oculto</Badge>}
                      <Badge variant="secondary" className="text-[10px] flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {stats[it.id] ?? 0}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 pt-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => abrir(it)}>
                        <Download className="h-3.5 w-3.5 mr-1" /> Abrir
                      </Button>
                      {canWrite && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => openEdit(it)}>Editar</Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmDel(it)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Item" : "Novo Item de Biblioteca"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
            </div>
            <div>
              <Label>Autor</Label>
              <Input value={form.autor} onChange={e => setForm(f => ({ ...f, autor: e.target.value }))} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={2} />
            </div>
            <div>
              <Label>Conteúdo (texto, opcional)</Label>
              <Textarea value={form.conteudo} onChange={e => setForm(f => ({ ...f, conteudo: e.target.value }))} rows={5} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v as BibliotecaCategoria }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Grau mínimo</Label>
                <Select value={String(form.grau_minimo)} onValueChange={v => setForm(f => ({ ...f, grau_minimo: parseInt(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{GRAUS.map(g => <SelectItem key={g.value} value={String(g.value)}>{g.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.publicado} onChange={e => setForm(f => ({ ...f, publicado: e.target.checked }))} />
              Publicado (visível aos membros)
            </label>
            <div>
              <Label>Arquivo (opcional)</Label>
              <Input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}><Upload className="h-4 w-4 mr-1" /> Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {confirmDel && (
        <ConfirmSensitiveAction
          open={!!confirmDel}
          onOpenChange={(o) => !o && setConfirmDel(null)}
          title="Excluir item"
          description={`Confirmar exclusão de "${confirmDel.titulo}"?`}
          requireTypedConfirmation="EXCLUIR"
          destructive
          onConfirm={excluir}
        />
      )}
    </div>
  );
}
