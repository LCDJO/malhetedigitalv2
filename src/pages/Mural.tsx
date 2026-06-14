import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmSensitiveAction } from "@/components/ConfirmSensitiveAction";
import { useUserTenant } from "@/core/tenant/useUserTenant";
import { usePortalMember } from "@/core/tenant/usePortalMember";
import { useScope } from "@/contexts/ScopeContext";
import { hasPermission } from "@/domains/security/permissions";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Pin, Plus, Trash2, Edit, Check, Search, CheckCheck } from "lucide-react";
import {
  listarComunicados, criarComunicado, atualizarComunicado, excluirComunicado,
  listarComunicadosLidos, marcarComunicadoLido, marcarComunicadosLidosEmLote,
  type Comunicado, type ComunicacaoFilters,
} from "@/services/comunicacao";

const GRAUS = [
  { value: 1, label: "Aprendiz (1°)" },
  { value: 2, label: "Companheiro (2°)" },
  { value: 3, label: "Mestre (3°)" },
];

type Periodo = "todos" | "7d" | "30d" | "90d";

function periodoToFrom(p: Periodo): string | undefined {
  if (p === "todos") return undefined;
  const dias = p === "7d" ? 7 : p === "30d" ? 30 : 90;
  const d = new Date(); d.setDate(d.getDate() - dias);
  return d.toISOString();
}

export default function Mural() {
  const { tenantId } = useUserTenant();
  const { member } = usePortalMember();
  const { appRole, tenantRole } = useScope();
  const canWrite = hasPermission("lodge_config", "write", appRole, tenantRole);

  const [items, setItems] = useState<Comunicado[]>([]);
  const [lidos, setLidos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Comunicado | null>(null);
  const [confirmDel, setConfirmDel] = useState<Comunicado | null>(null);
  const [form, setForm] = useState({ titulo: "", conteudo: "", grau_minimo: 1, fixado: false, publicado: true });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Filtros
  const [search, setSearch] = useState("");
  const [grau, setGrau] = useState<string>("todos");
  const [periodo, setPeriodo] = useState<Periodo>("todos");

  async function load() {
    if (!tenantId) return;
    setLoading(true);
    try {
      const filters: ComunicacaoFilters = {
        search: search.trim() || undefined,
        grauMinimo: grau === "todos" ? undefined : Number(grau),
        from: periodoToFrom(periodo),
      };
      const list = await listarComunicados(tenantId, filters);
      setItems(list);
      if (member?.id) {
        const ids = await listarComunicadosLidos(tenantId, member.id);
        setLidos(new Set(ids));
      }
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tenantId, member?.id, grau, periodo]);

  async function marcarLido(c: Comunicado) {
    if (!tenantId || !member?.id) return;
    try {
      await marcarComunicadoLido(tenantId, c.id, member.id);
      setLidos(prev => new Set(prev).add(c.id));
    } catch (e: any) { toast.error(e.message); }
  }

  function toggleSel(id: string) {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function marcarSelecionadosLidos() {
    if (!tenantId || !member?.id) return;
    const ids = Array.from(selected).filter(id => !lidos.has(id));
    if (ids.length === 0) { toast.info("Nada para marcar."); return; }
    try {
      await marcarComunicadosLidosEmLote(tenantId, ids, member.id);
      setLidos(prev => { const n = new Set(prev); ids.forEach(i => n.add(i)); return n; });
      setSelected(new Set());
      toast.success(`${ids.length} marcado(s) como lido.`);
    } catch (e: any) { toast.error(e.message); }
  }

  async function marcarTodosLidos() {
    if (!tenantId || !member?.id) return;
    const ids = items.filter(i => !lidos.has(i.id)).map(i => i.id);
    if (ids.length === 0) { toast.info("Nenhum não lido."); return; }
    try {
      await marcarComunicadosLidosEmLote(tenantId, ids, member.id);
      setLidos(prev => { const n = new Set(prev); ids.forEach(i => n.add(i)); return n; });
      toast.success(`${ids.length} marcado(s) como lido.`);
    } catch (e: any) { toast.error(e.message); }
  }

  function openNew() {
    setEditing(null);
    setForm({ titulo: "", conteudo: "", grau_minimo: 1, fixado: false, publicado: true });
    setOpen(true);
  }
  function openEdit(c: Comunicado) {
    setEditing(c);
    setForm({ titulo: c.titulo, conteudo: c.conteudo, grau_minimo: c.grau_minimo, fixado: c.fixado, publicado: c.publicado });
    setOpen(true);
  }

  async function save() {
    if (!tenantId) return;
    if (!form.titulo || !form.conteudo) { toast.error("Preencha título e conteúdo."); return; }
    try {
      if (editing) await atualizarComunicado(editing.id, form);
      else await criarComunicado({ ...form, tenant_id: tenantId });
      toast.success("Comunicado salvo.");
      setOpen(false);
      load();
    } catch (e: any) { toast.error(e.message); }
  }

  async function remove() {
    if (!confirmDel) return;
    try { await excluirComunicado(confirmDel.id); toast.success("Removido."); setConfirmDel(null); load(); }
    catch (e: any) { toast.error(e.message); }
  }

  const naoLidos = useMemo(() => items.filter(i => !lidos.has(i.id)).length, [items, lidos]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif">Mural da Loja</h1>
          <p className="text-muted-foreground">
            Comunicados institucionais visíveis aos irmãos.
            {member && naoLidos > 0 && <span className="ml-2 text-primary">• {naoLidos} não lido(s)</span>}
          </p>
        </div>
        {canWrite && <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Novo comunicado</Button>}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por título ou conteúdo…"
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") load(); }}
            />
          </div>
          <Select value={grau} onValueChange={setGrau}>
            <SelectTrigger><SelectValue placeholder="Grau" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os graus</SelectItem>
              {GRAUS.map(g => <SelectItem key={g.value} value={String(g.value)}>≥ {g.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
            <SelectTrigger><SelectValue placeholder="Período" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo o período</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? <p>Carregando…</p> : items.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Nenhum comunicado encontrado.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map(c => {
            const lido = lidos.has(c.id);
            return (
              <Card key={c.id} className={`${c.fixado ? "border-primary" : ""} ${!lido ? "bg-primary/5" : ""}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      {c.fixado && <Pin className="w-4 h-4 text-primary" />}
                      {!lido && <span className="w-2 h-2 rounded-full bg-primary" aria-label="Não lido" />}
                      {c.titulo}
                    </span>
                    <div className="flex gap-2 items-center">
                      <Badge variant="secondary">Grau ≥ {c.grau_minimo}</Badge>
                      {!c.publicado && <Badge variant="outline">Rascunho</Badge>}
                      {member && !lido && (
                        <Button size="sm" variant="outline" onClick={() => marcarLido(c)}>
                          <Check className="w-3 h-3 mr-1" />Marcar como lido
                        </Button>
                      )}
                      {canWrite && (
                        <>
                          <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Edit className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setConfirmDel(c)}><Trash2 className="w-4 h-4" /></Button>
                        </>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{c.conteudo}</p>
                  <p className="text-xs text-muted-foreground mt-3">{new Date(c.created_at).toLocaleString("pt-BR")}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} comunicado</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título</Label><Input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} /></div>
            <div><Label>Conteúdo</Label><Textarea rows={8} value={form.conteudo} onChange={e => setForm({ ...form, conteudo: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Grau mínimo</Label>
                <Select value={String(form.grau_minimo)} onValueChange={v => setForm({ ...form, grau_minimo: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{GRAUS.map(g => <SelectItem key={g.value} value={String(g.value)}>{g.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2 justify-center">
                <div className="flex items-center justify-between"><Label>Fixar no topo</Label><Switch checked={form.fixado} onCheckedChange={v => setForm({ ...form, fixado: v })} /></div>
                <div className="flex items-center justify-between"><Label>Publicado</Label><Switch checked={form.publicado} onCheckedChange={v => setForm({ ...form, publicado: v })} /></div>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmSensitiveAction
        open={!!confirmDel}
        onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Excluir comunicado"
        description={`Excluir "${confirmDel?.titulo}"?`}
        requireTypedConfirmation="EXCLUIR"
        onConfirm={remove}
      />
    </div>
  );
}
