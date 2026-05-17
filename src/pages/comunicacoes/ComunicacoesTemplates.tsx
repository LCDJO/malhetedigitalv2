import { useEffect, useRef, useState } from "react";
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
import { Plus, Pencil, Trash2, FileText, Loader2, Sparkles } from "lucide-react";

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

const AVAILABLE_VARIABLES: { key: string; label: string; sample: string }[] = [
  { key: "nome", label: "Nome do destinatário", sample: "João da Silva" },
  { key: "email", label: "E-mail", sample: "joao@exemplo.com" },
  { key: "loja", label: "Nome da Loja", sample: "Loja Maçônica Exemplo" },
  { key: "data", label: "Data atual", sample: new Date().toLocaleDateString("pt-BR") },
  { key: "link", label: "Link/URL", sample: "https://malhetedigital.com.br" },
  { key: "cim", label: "CIM", sample: "123456" },
  { key: "grau", label: "Grau", sample: "Mestre" },
];

const WELCOME_TEMPLATE = {
  key: "boas_vindas",
  name: "Boas-vindas (padrão)",
  subject: "Bem-vindo(a) à {{loja}}, {{nome}}!",
  body_html: `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a2a44;">
  <h1 style="color: #1a2a44; border-bottom: 2px solid #c9a84c; padding-bottom: 8px;">
    Bem-vindo(a), {{nome}}!
  </h1>
  <p>É com grande satisfação que damos as boas-vindas à <strong>{{loja}}</strong>.</p>
  <p>Sua conta foi criada com sucesso e você já pode acessar o portal utilizando o e-mail <strong>{{email}}</strong>.</p>
  <p style="text-align: center; margin: 32px 0;">
    <a href="{{link}}" style="background: #1a2a44; color: #c9a84c; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
      Acessar o Portal
    </a>
  </p>
  <p>Em caso de dúvidas, responda este e-mail ou entre em contato com a secretaria.</p>
  <p style="margin-top: 32px;">T∴ F∴ A∴<br/><strong>{{loja}}</strong></p>
  <hr style="border: none; border-top: 1px solid #e5e5e5; margin-top: 32px;"/>
  <p style="font-size: 11px; color: #888;">Enviado em {{data}}</p>
</div>`,
  body_text: "Bem-vindo(a) {{nome}} à {{loja}}! Acesse o portal em {{link}}.",
  is_active: true,
};

function renderPreview(html: string): string {
  let out = html;
  for (const v of AVAILABLE_VARIABLES) {
    out = out.replaceAll(`{{${v.key}}}`, v.sample);
  }
  return out;
}

export default function ComunicacoesTemplates() {
  const { tenantId } = useScope();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState({ ...emptyTemplate });
  const [saving, setSaving] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

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

  const openWelcome = () => {
    setEditing(null);
    setForm({ ...WELCOME_TEMPLATE });
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

  const insertVariable = (varKey: string) => {
    const token = `{{${varKey}}}`;
    const el = bodyRef.current;
    if (!el) {
      setForm((f) => ({ ...f, body_html: f.body_html + token }));
      return;
    }
    const start = el.selectionStart ?? form.body_html.length;
    const end = el.selectionEnd ?? form.body_html.length;
    const next = form.body_html.slice(0, start) + token + form.body_html.slice(end);
    setForm((f) => ({ ...f, body_html: next }));
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
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

  const hasWelcome = templates.some((t) => t.key === "boas_vindas");

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" /> Templates de E-mail
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os modelos de e-mail utilizados nas comunicações da loja.
          </p>
        </div>
        <div className="flex gap-2">
          {!hasWelcome && (
            <Button variant="outline" onClick={openWelcome}>
              <Sparkles className="h-4 w-4 mr-2" /> Usar modelo de boas-vindas
            </Button>
          )}
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" /> Novo Template
          </Button>
        </div>
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Template" : "Novo Template"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT: form */}
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
                  ref={bodyRef}
                  rows={12}
                  value={form.body_html}
                  onChange={(e) => setForm({ ...form, body_html: e.target.value })}
                  placeholder="<p>Olá {{nome}}, ...</p>"
                  className="font-mono text-xs"
                />
                <div className="mt-2 rounded-md border bg-muted/30 p-2">
                  <p className="text-[11px] text-muted-foreground mb-1.5">
                    Variáveis disponíveis (clique para inserir):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_VARIABLES.map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => insertVariable(v.key)}
                        title={v.label}
                        className="text-xs px-2 py-0.5 rounded border bg-background hover:bg-accent hover:text-accent-foreground transition font-mono"
                      >
                        {`{{${v.key}}}`}
                      </button>
                    ))}
                  </div>
                </div>
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

            {/* RIGHT: preview */}
            <div className="space-y-2">
              <Label>Prévia do e-mail</Label>
              <div className="border rounded-md bg-white overflow-hidden">
                <div className="bg-muted px-3 py-2 border-b">
                  <p className="text-[11px] text-muted-foreground">Assunto</p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {renderPreview(form.subject) || <span className="text-muted-foreground italic">(sem assunto)</span>}
                  </p>
                </div>
                <div
                  className="p-4 text-sm overflow-auto"
                  style={{ minHeight: 320, maxHeight: 500, color: "#1a2a44" }}
                  dangerouslySetInnerHTML={{
                    __html: form.body_html
                      ? renderPreview(form.body_html)
                      : '<p style="color:#999;font-style:italic">A prévia aparecerá aqui...</p>',
                  }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Os valores reais serão substituídos no momento do envio.
              </p>
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
