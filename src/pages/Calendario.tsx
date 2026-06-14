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
import { useScope } from "@/contexts/ScopeContext";
import { hasPermission } from "@/domains/security/permissions";
import { toast } from "sonner";
import { Calendar as CalIcon, Download, Plus, Trash2, Edit } from "lucide-react";
import {
  listarEventos, criarEvento, atualizarEvento, excluirEvento, exportarICal,
  type EventoCalendario, type EventoTipo,
} from "@/services/comunicacao";

const TIPOS: { value: EventoTipo; label: string }[] = [
  { value: "sessao", label: "Sessão" },
  { value: "data_magna", label: "Data Magna" },
  { value: "aniversario", label: "Aniversário" },
  { value: "evento", label: "Evento" },
  { value: "liturgico", label: "Litúrgico" },
];

export default function Calendario() {
  const { tenantId } = useUserTenant();
  const { appRole, tenantRole } = useScope();
  const canWrite = hasPermission("lodge_config", "write", appRole, tenantRole);

  const [items, setItems] = useState<EventoCalendario[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<EventoTipo | "all">("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EventoCalendario | null>(null);
  const [confirmDel, setConfirmDel] = useState<EventoCalendario | null>(null);
  const [form, setForm] = useState({
    titulo: "", descricao: "", data_inicio: "", data_fim: "",
    dia_inteiro: false, tipo: "evento" as EventoTipo, grau_minimo: 1,
  });

  async function load() {
    if (!tenantId) return;
    setLoading(true);
    try { setItems(await listarEventos(tenantId)); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [tenantId]);

  const filtrados = useMemo(
    () => filtro === "all" ? items : items.filter(i => i.tipo === filtro),
    [items, filtro]
  );

  function openNew() {
    setEditing(null);
    setForm({ titulo: "", descricao: "", data_inicio: "", data_fim: "", dia_inteiro: false, tipo: "evento", grau_minimo: 1 });
    setOpen(true);
  }
  function openEdit(e: EventoCalendario) {
    setEditing(e);
    setForm({
      titulo: e.titulo, descricao: e.descricao ?? "",
      data_inicio: e.data_inicio.slice(0, 16),
      data_fim: e.data_fim ? e.data_fim.slice(0, 16) : "",
      dia_inteiro: e.dia_inteiro, tipo: e.tipo, grau_minimo: e.grau_minimo,
    });
    setOpen(true);
  }

  async function save() {
    if (!tenantId) return;
    if (!form.titulo || !form.data_inicio) { toast.error("Título e data de início são obrigatórios."); return; }
    const payload = {
      titulo: form.titulo,
      descricao: form.descricao || null,
      data_inicio: new Date(form.data_inicio).toISOString(),
      data_fim: form.data_fim ? new Date(form.data_fim).toISOString() : null,
      dia_inteiro: form.dia_inteiro,
      tipo: form.tipo, grau_minimo: form.grau_minimo,
    };
    try {
      if (editing) await atualizarEvento(editing.id, payload);
      else await criarEvento({ ...payload, tenant_id: tenantId });
      toast.success("Evento salvo.");
      setOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
  }

  async function remove() {
    if (!confirmDel) return;
    try { await excluirEvento(confirmDel.id); toast.success("Removido."); setConfirmDel(null); load(); }
    catch (e: any) { toast.error(e.message); }
  }

  function downloadICal() {
    const ics = exportarICal(filtrados);
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "calendario-loja.ics"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-serif flex items-center gap-2"><CalIcon className="w-7 h-7" />Calendário Litúrgico</h1>
          <p className="text-muted-foreground">Agenda integrada com sessões, datas magnas e aniversários.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadICal}><Download className="w-4 h-4 mr-2" />Exportar iCal</Button>
          {canWrite && <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Novo evento</Button>}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={filtro === "all" ? "default" : "outline"} onClick={() => setFiltro("all")}>Todos</Button>
        {TIPOS.map(t => (
          <Button key={t.value} size="sm" variant={filtro === t.value ? "default" : "outline"} onClick={() => setFiltro(t.value)}>{t.label}</Button>
        ))}
      </div>

      {loading ? <p>Carregando…</p> : filtrados.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Nenhum evento cadastrado.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtrados.map(e => (
            <Card key={e.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center gap-2 text-base">
                  <span>{e.titulo}</span>
                  <div className="flex gap-2 items-center">
                    <Badge>{TIPOS.find(t => t.value === e.tipo)?.label}</Badge>
                    {canWrite && (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(e)}><Edit className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setConfirmDel(e)}><Trash2 className="w-4 h-4" /></Button>
                      </>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {new Date(e.data_inicio).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: e.dia_inteiro ? undefined : "short" })}
                  {e.data_fim && ` → ${new Date(e.data_fim).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: e.dia_inteiro ? undefined : "short" })}`}
                </p>
                {e.descricao && <p className="text-sm text-muted-foreground mt-1">{e.descricao}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} evento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título</Label><Input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} /></div>
            <div><Label>Descrição</Label><Textarea rows={3} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Início</Label><Input type="datetime-local" value={form.data_inicio} onChange={e => setForm({ ...form, data_inicio: e.target.value })} /></div>
              <div><Label>Fim</Label><Input type="datetime-local" value={form.data_fim} onChange={e => setForm({ ...form, data_fim: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3 items-end">
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v: EventoTipo) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Grau mínimo</Label>
                <Select value={String(form.grau_minimo)} onValueChange={v => setForm({ ...form, grau_minimo: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Aprendiz</SelectItem>
                    <SelectItem value="2">Companheiro</SelectItem>
                    <SelectItem value="3">Mestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between"><Label>Dia inteiro</Label><Switch checked={form.dia_inteiro} onCheckedChange={v => setForm({ ...form, dia_inteiro: v })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmSensitiveAction
        open={!!confirmDel}
        onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Excluir evento"
        description={`Excluir "${confirmDel?.titulo}"?`}
        confirmKeyword="EXCLUIR"
        onConfirm={remove}
      />
    </div>
  );
}
