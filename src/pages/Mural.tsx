import { useEffect, useState } from "react";
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
import { useScope } from "@/contexts/ScopeContext";
import { hasPermission } from "@/domains/security/permissions";
import { toast } from "sonner";
import { Pin, Plus, Trash2, Edit } from "lucide-react";
import {
  listarComunicados, criarComunicado, atualizarComunicado, excluirComunicado,
  type Comunicado,
} from "@/services/comunicacao";

const GRAUS = [
  { value: 1, label: "Aprendiz (1°)" },
  { value: 2, label: "Companheiro (2°)" },
  { value: 3, label: "Mestre (3°)" },
];

export default function Mural() {
  const { tenantId } = useUserTenant();
  const { appRole, tenantRole } = useScope();
  const canWrite = hasPermission("lodge_config", "write", appRole, tenantRole);

  const [items, setItems] = useState<Comunicado[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Comunicado | null>(null);
  const [confirmDel, setConfirmDel] = useState<Comunicado | null>(null);
  const [form, setForm] = useState({ titulo: "", conteudo: "", grau_minimo: 1, fixado: false, publicado: true });

  async function load() {
    if (!tenantId) return;
    setLoading(true);
    try { setItems(await listarComunicados(tenantId)); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [tenantId]);

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif">Mural da Loja</h1>
          <p className="text-muted-foreground">Comunicados institucionais visíveis aos irmãos.</p>
        </div>
        {canWrite && <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Novo comunicado</Button>}
      </div>

      {loading ? <p>Carregando…</p> : items.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Nenhum comunicado publicado.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map(c => (
            <Card key={c.id} className={c.fixado ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    {c.fixado && <Pin className="w-4 h-4 text-primary" />}
                    {c.titulo}
                  </span>
                  <div className="flex gap-2 items-center">
                    <Badge variant="secondary">Grau ≥ {c.grau_minimo}</Badge>
                    {!c.publicado && <Badge variant="outline">Rascunho</Badge>}
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
          ))}
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
