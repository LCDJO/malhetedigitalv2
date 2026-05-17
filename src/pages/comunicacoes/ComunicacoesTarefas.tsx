import { useEffect, useState } from "react";
import { useScope } from "@/contexts/ScopeContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Send, Loader2, Trash2, Clock } from "lucide-react";

interface Task {
  id: string;
  name: string;
  audience: string;
  status: string;
  scheduled_at: string | null;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  template_id: string | null;
}

interface Template {
  id: string;
  name: string;
  key: string;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  rascunho: "secondary",
  agendado: "outline",
  enviando: "default",
  concluido: "default",
  cancelado: "secondary",
  erro: "destructive",
};

const audienceLabel: Record<string, string> = {
  all_members: "Todos os membros",
  active_members: "Membros ativos",
  admins: "Administradores",
  custom_emails: "E-mails customizados",
};

export default function ComunicacoesTarefas() {
  const { tenantId } = useScope();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    template_id: "",
    audience: "active_members",
    custom_emails: "",
    scheduled_at: "",
  });

  const load = async () => {
    if (!tenantId) return;
    setLoading(true);
    const [tasksRes, templatesRes] = await Promise.all([
      supabase
        .from("email_dispatch_tasks")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false }),
      supabase.from("email_templates").select("id, name, key").eq("tenant_id", tenantId).eq("is_active", true),
    ]);
    if (tasksRes.error) toast.error("Erro ao carregar tarefas");
    else setTasks(tasksRes.data as Task[]);
    if (!templatesRes.error) setTemplates(templatesRes.data as Template[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [tenantId]);

  const openNew = () => {
    setForm({ name: "", template_id: "", audience: "active_members", custom_emails: "", scheduled_at: "" });
    setOpen(true);
  };

  const save = async () => {
    if (!tenantId) return;
    if (!form.name.trim() || !form.template_id) {
      toast.error("Informe o nome e selecione um template");
      return;
    }
    setSaving(true);
    const payload: any = {
      tenant_id: tenantId,
      name: form.name,
      template_id: form.template_id,
      audience: form.audience,
      status: form.scheduled_at ? "agendado" : "rascunho",
      scheduled_at: form.scheduled_at || null,
    };
    if (form.audience === "custom_emails") {
      payload.custom_emails = form.custom_emails
        .split(/[,\n;]/)
        .map((e) => e.trim())
        .filter(Boolean);
    }
    const { error } = await supabase.from("email_dispatch_tasks").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Tarefa criada");
    setOpen(false);
    load();
  };

  const remove = async (t: Task) => {
    if (!confirm(`Excluir a tarefa "${t.name}"?`)) return;
    const { error } = await supabase.from("email_dispatch_tasks").delete().eq("id", t.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Tarefa removida");
      load();
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
            <Send className="h-6 w-6" /> Tarefas de Disparo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crie e acompanhe os disparos de e-mail da loja.
          </p>
        </div>
        <Button onClick={openNew} disabled={templates.length === 0}>
          <Plus className="h-4 w-4 mr-2" /> Nova Tarefa
        </Button>
      </div>

      {templates.length === 0 && !loading && (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Cadastre um template ativo na aba <strong>Templates</strong> antes de criar uma tarefa de disparo.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma tarefa criada ainda.</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between border rounded-md p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{t.name}</span>
                      <Badge variant={statusVariant[t.status] ?? "secondary"}>{t.status}</Badge>
                      <Badge variant="outline" className="text-xs">
                        {audienceLabel[t.audience] ?? t.audience}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
                      {t.scheduled_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(t.scheduled_at).toLocaleString("pt-BR")}
                        </span>
                      )}
                      <span>
                        Enviados: {t.sent_count}/{t.total_recipients} • Falhas: {t.failed_count}
                      </span>
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => remove(t)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Tarefa de Disparo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Template *</Label>
              <Select value={form.template_id} onValueChange={(v) => setForm({ ...form, template_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Público</Label>
              <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_members">Todos os membros</SelectItem>
                  <SelectItem value="active_members">Apenas membros ativos</SelectItem>
                  <SelectItem value="admins">Administradores</SelectItem>
                  <SelectItem value="custom_emails">E-mails customizados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.audience === "custom_emails" && (
              <div>
                <Label>E-mails (separados por vírgula ou linha)</Label>
                <Textarea
                  rows={3}
                  value={form.custom_emails}
                  onChange={(e) => setForm({ ...form, custom_emails: e.target.value })}
                />
              </div>
            )}
            <div>
              <Label>Agendamento (opcional)</Label>
              <Input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar tarefa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
