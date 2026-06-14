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
  listarDocumentos, criarDocumento, atualizarDocumento, excluirDocumento,
  uploadArquivo, getSignedUrl, registrarLeitura, contarLeituras,
  type Documento, type DocumentoCategoria,
} from "@/services/repositorio";
import { FileText, Upload, Download, Trash2, Plus, Eye, Lock } from "lucide-react";

const CATEGORIAS: { value: DocumentoCategoria; label: string }[] = [
  { value: "estatuto", label: "Estatuto" },
  { value: "regulamento", label: "Regulamento" },
  { value: "ata_publicada", label: "Ata Publicada" },
  { value: "circular", label: "Circular" },
  { value: "oficio", label: "Ofício" },
  { value: "balanco", label: "Balanço" },
  { value: "relatorio", label: "Relatório" },
  { value: "convocacao", label: "Convocação" },
  { value: "outros", label: "Outros" },
];

const GRAUS = [
  { value: 1, label: "Aprendiz (1°)" },
  { value: 2, label: "Companheiro (2°)" },
  { value: 3, label: "Mestre (3°)" },
];

export default function Documentos() {
  const { tenantId } = useUserTenant();
  const { appRole, tenantRole } = useScope();
  const canWrite = hasPermission("lodge_config", "write", appRole, tenantRole);

  const [items, setItems] = useState<Documento[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<DocumentoCategoria | "all">("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Documento | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [confirmDel, setConfirmDel] = useState<Documento | null>(null);

  const [form, setForm] = useState({
    titulo: "", descricao: "", categoria: "outros" as DocumentoCategoria,
    grau_minimo: 1, ano_referencia: new Date().getFullYear(), reservado: false,
  });

  async function load() {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [docs, leituras] = await Promise.all([listarDocumentos(tenantId), contarLeituras(tenantId)]);
      setItems(docs);
      setStats(leituras.porDocumento);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [tenantId]);

  function openCreate() {
    setEditing(null); setFile(null);
    setForm({ titulo: "", descricao: "", categoria: "outros", grau_minimo: 1, ano_referencia: new Date().getFullYear(), reservado: false });
    setOpen(true);
  }
  function openEdit(d: Documento) {
    setEditing(d); setFile(null);
    setForm({
      titulo: d.titulo, descricao: d.descricao ?? "", categoria: d.categoria,
      grau_minimo: d.grau_minimo, ano_referencia: d.ano_referencia ?? new Date().getFullYear(),
      reservado: d.reservado,
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
        const up = await uploadArquivo(tenantId, "documentos", file);
        storage_path = up.path; mime_type = up.mime; tamanho_bytes = up.size;
      }
      const payload = { ...form, storage_path, mime_type, tamanho_bytes };
      if (editing) await atualizarDocumento(editing.id, payload);
      else await criarDocumento({ tenant_id: tenantId, ...payload });
      toast.success(editing ? "Documento atualizado." : "Documento cadastrado.");
      setOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
  }

  async function baixar(d: Documento) {
    if (!d.storage_path) { toast.error("Sem arquivo anexado."); return; }
    try {
      const url = await getSignedUrl(d.storage_path);
      await registrarLeitura({ tenantId: d.tenant_id, documentoId: d.id, acao: "baixou" });
      window.open(url, "_blank");
    } catch (e: any) { toast.error(e.message); }
  }

  async function excluir() {
    if (!confirmDel) return;
    try {
      await excluirDocumento(confirmDel.id);
      toast.success("Documento excluído.");
      setConfirmDel(null); load();
    } catch (e: any) { toast.error(e.message); }
  }

  const filtered = items.filter(d =>
    (filtro === "all" || d.categoria === filtro) &&
    (!search || d.titulo.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold">Repositório de Documentos</h1>
          <p className="text-sm text-muted-foreground mt-1">Acervo institucional da Secretaria.</p>
        </div>
        {canWrite && (
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Novo Documento</Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <Label className="text-xs">Buscar</Label>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Título..." />
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
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhum documento encontrado.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(d => (
                <Card key={d.id} className="hover:shadow-md transition">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      {d.reservado && <Lock className="h-3.5 w-3.5 text-amber-600" />}
                    </div>
                    <CardTitle className="text-sm leading-tight">{d.titulo}</CardTitle>
                    <CardDescription className="text-xs">
                      {CATEGORIAS.find(c => c.value === d.categoria)?.label}
                      {d.ano_referencia ? ` • ${d.ano_referencia}` : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {d.descricao && <p className="text-xs text-muted-foreground line-clamp-2">{d.descricao}</p>}
                    <div className="flex items-center gap-1 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">Grau ≥ {d.grau_minimo}</Badge>
                      <Badge variant="secondary" className="text-[10px] flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {stats[d.id] ?? 0}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 pt-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => baixar(d)} disabled={!d.storage_path}>
                        <Download className="h-3.5 w-3.5 mr-1" /> Abrir
                      </Button>
                      {canWrite && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => openEdit(d)}>Editar</Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmDel(d)}>
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
            <DialogTitle>{editing ? "Editar Documento" : "Novo Documento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v as DocumentoCategoria }))}>
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
              <div>
                <Label>Ano</Label>
                <Input type="number" value={form.ano_referencia} onChange={e => setForm(f => ({ ...f, ano_referencia: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.reservado} onChange={e => setForm(f => ({ ...f, reservado: e.target.checked }))} />
                  Reservado
                </label>
              </div>
            </div>
            <div>
              <Label>Arquivo {editing?.storage_path && <span className="text-xs text-muted-foreground">(substituir)</span>}</Label>
              <Input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} />
              {editing?.storage_path && !file && <p className="text-xs text-muted-foreground mt-1">Arquivo atual será mantido.</p>}
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
          title="Excluir documento"
          description={`Confirmar exclusão de "${confirmDel.titulo}"? Esta ação remove o arquivo do acervo.`}
          requireTypedConfirmation="EXCLUIR"
          destructive
          onConfirm={excluir}
        />
      )}
    </div>
  );
}
