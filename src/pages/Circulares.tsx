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
import { Send, Plus, Trash2, Edit, FileText } from "lucide-react";
import {
  listarCirculares, criarCircular, atualizarCircular, excluirCircular, enviarCircular,
  type Circular,
} from "@/services/comunicacao";

const GRAUS = [
  { value: 1, label: "Aprendiz (1°)" },
  { value: 2, label: "Companheiro (2°)" },
  { value: 3, label: "Mestre (3°)" },
];

export default function Circulares() {
  const { tenantId } = useUserTenant();
  const { appRole, tenantRole } = useScope();
  const canWrite = hasPermission("lodge_config", "write", appRole, tenantRole);

  const [items, setItems] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Circular | null>(null);
  const [confirmDel, setConfirmDel] = useState<Circular | null>(null);
  const [confirmSend, setConfirmSend] = useState<Circular | null>(null);
  const [form, setForm] = useState({
    numero: "", assunto: "", corpo: "", grau_minimo: 1,
    enviar_email: true, enviar_push: true,
  });

  async function load() {
    if (!tenantId) return;
    setLoading(true);
    try { setItems(await listarCirculares(tenantId)); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [tenantId]);

  function openNew() {
    setEditing(null);
    setForm({ numero: "", assunto: "", corpo: "", grau_minimo: 1, enviar_email: true, enviar_push: true });
    setOpen(true);
  }
  function openEdit(c: Circular) {
    setEditing(c);
    setForm({
      numero: c.numero, assunto: c.assunto, corpo: c.corpo, grau_minimo: c.grau_minimo,
      enviar_email: c.enviar_email, enviar_push: c.enviar_push,
    });
    setOpen(true);
  }

  async function save() {
    if (!tenantId) return;
    if (!form.numero || !form.assunto || !form.corpo) { toast.error("Preencha número, assunto e corpo."); return; }
    try {
      if (editing) await atualizarCircular(editing.id, form);
      else await criarCircular({ ...form, tenant_id: tenantId, status: "rascunho" });
      toast.success("Circular salva.");
      setOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
  }

  async function remove() {
    if (!confirmDel) return;
    try { await excluirCircular(confirmDel.id); toast.success("Removida."); setConfirmDel(null); load(); }
    catch (e: any) { toast.error(e.message); }
  }

  async function send() {
    if (!confirmSend) return;
    try {
      await enviarCircular(confirmSend);
      toast.success("Circular enviada aos irmãos elegíveis.");
      setConfirmSend(null); load();
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif">Circulares Oficiais</h1>
          <p className="text-muted-foreground">Comunicações formais com registro de envio e leitura.</p>
        </div>
        {canWrite && <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nova circular</Button>}
      </div>

      {loading ? <p>Carregando…</p> : items.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Nenhuma circular cadastrada.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map(c => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center gap-2 text-base">
                  <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Nº {c.numero} — {c.assunto}</span>
                  <div className="flex gap-2 items-center">
                    <Badge variant={c.status === "enviada" ? "default" : "secondary"}>{c.status}</Badge>
                    <Badge variant="outline">Grau ≥ {c.grau_minimo}</Badge>
                    {canWrite && c.status === "rascunho" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => openEdit(c)}><Edit className="w-3 h-3 mr-1" />Editar</Button>
                        <Button size="sm" onClick={() => setConfirmSend(c)}><Send className="w-3 h-3 mr-1" />Enviar</Button>
                        <Button size="icon" variant="ghost" onClick={() => setConfirmDel(c)}><Trash2 className="w-4 h-4" /></Button>
                      </>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap line-clamp-3">{c.corpo}</p>
                {c.enviada_em && <p className="text-xs text-muted-foreground mt-2">Enviada em {new Date(c.enviada_em).toLocaleString("pt-BR")}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Nova"} circular</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Nº</Label><Input value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} placeholder="2026/001" /></div>
              <div className="col-span-2"><Label>Assunto</Label><Input value={form.assunto} onChange={e => setForm({ ...form, assunto: e.target.value })} /></div>
            </div>
            <div><Label>Corpo</Label><Textarea rows={10} value={form.corpo} onChange={e => setForm({ ...form, corpo: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Grau mínimo</Label>
                <Select value={String(form.grau_minimo)} onValueChange={v => setForm({ ...form, grau_minimo: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{GRAUS.map(g => <SelectItem key={g.value} value={String(g.value)}>{g.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2 justify-center">
                <div className="flex items-center justify-between"><Label>Enviar por e-mail</Label><Switch checked={form.enviar_email} onCheckedChange={v => setForm({ ...form, enviar_email: v })} /></div>
                <div className="flex items-center justify-between"><Label>Enviar push</Label><Switch checked={form.enviar_push} onCheckedChange={v => setForm({ ...form, enviar_push: v })} /></div>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmSensitiveAction
        open={!!confirmDel}
        onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Excluir circular"
        description={`Excluir circular Nº ${confirmDel?.numero}?`}
        confirmKeyword="EXCLUIR"
        onConfirm={remove}
      />
      <ConfirmSensitiveAction
        open={!!confirmSend}
        onOpenChange={(v) => !v && setConfirmSend(null)}
        title="Enviar circular"
        description={`Confirma o envio da circular Nº ${confirmSend?.numero} a todos os irmãos elegíveis?`}
        confirmKeyword="ENVIAR"
        onConfirm={send}
      />
    </div>
  );
}
