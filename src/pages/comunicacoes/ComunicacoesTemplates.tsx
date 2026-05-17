import { useEffect, useState } from "react";
import { useScope } from "@/contexts/ScopeContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FileText, Loader2 } from "lucide-react";

interface Template {
  id: string;
  key: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string | null;
  is_active: boolean;
  updated_at: string;
}

const emptyTemplate = {
  key: "",
  name: "",
  subject: "",
  body_html: "",
  body_text: "",
  is_active: true,
};

export default function ComunicacoesTemplates() {
  const { tenantId } = useScope();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState({ ...emptyTemplate });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("name");
    if (error) toast.error("Erro ao carregar templates");
    else setTemplates(data as Template[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [tenantId]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyTemplate });
    setOpen(true);
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    setForm({
      key: t.key,
      name: t.name,
      subject: t.subject,
      body_html: t.body_html,
      body_text: t.body_text ?? "",
      is_active: t.is_active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!tenantId) return;
    if (!form.key.trim() || !form.name.trim() || !form.subject.trim() || !form.body_html.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setSaving(true);
    const payload = { ...form, tenant_id: tenantId };
    const { error } = editing
      ? await supabase.from("email_templates").update(payload).eq("id", editing.id)
      : await supabase.from("email_templates").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Template atualizado" : "Template criado");
    setOpen(false);
    load();
  };

  const remove = async (t: Template) => {
    if (!confirm(`Excluir o template "${t.name}"?`)) return;
    const { error } = await supabase.from("email_templates").delete().eq("id", t.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Template excluído");
      load();
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" /> Templates de E-mail
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os modelos de e-mail utilizados nas comunicações da loja.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" /> Novo Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Templates cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhum template cadastrado. Crie o primeiro para começar.
            </p>
          ) : (
            <div className="space-y-2">
              {templates.map((t) => (
                <div key={t.id} className="flex items-center justify-between border rounded-md p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {t.key}
                      </Badge>
                      {!t.is_active && (
                        <Badge variant="secondary" className="text-xs">
                          Inativo
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.subject}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(t)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Template" : "Novo Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Chave *</Label>
                <Input
                  value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value })}
                  placeholder="ex: boas_vindas"
                  disabled={!!editing}
                />
              </div>
              <div>
                <Label>Nome *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Boas-vindas ao novo irmão"
                />
              </div>
            </div>
            <div>
              <Label>Assunto *</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Bem-vindo à Loja"
              />
            </div>
            <div>
              <Label>Corpo HTML *</Label>
              <Textarea
                rows={8}
                value={form.body_html}
                onChange={(e) => setForm({ ...form, body_html: e.target.value })}
                placeholder="<p>Olá {{nome}}, ...</p>"
                className="font-mono text-xs"
              />
            </div>
            <div>
              <Label>Corpo texto (opcional)</Label>
              <Textarea
                rows={3}
                value={form.body_text}
                onChange={(e) => setForm({ ...form, body_text: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
