import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Send, CheckCircle2, XCircle, Plus, Trash2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  tenantId: string;
  enabled: boolean; // module availability
}

interface TitanConfig {
  domain: string;
  api_token: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  from_name: string;
  from_email: string;
  enabled: boolean;
}

const empty: TitanConfig = {
  domain: "", api_token: "", smtp_host: "smtp.titan.email", smtp_port: 587,
  smtp_user: "", smtp_password: "", from_name: "", from_email: "", enabled: false,
};

export function TabIntegracaoEmail({ tenantId, enabled }: Props) {
  const [cfg, setCfg] = useState<TitanConfig>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [mailboxes, setMailboxes] = useState<Array<{ email: string; first_name?: string; last_name?: string }>>([]);
  const [newMailbox, setNewMailbox] = useState({ email: "", password: "", first_name: "", last_name: "" });

  const call = async (action: string, extra: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke("titan-email", {
      body: { action, tenant_id: tenantId, ...extra },
    });
    if (error) throw error;
    return data;
  };

  useEffect(() => {
    if (!tenantId || !enabled) { setLoading(false); return; }
    (async () => {
      try {
        const res = await call("get_config");
        if (res?.config) {
          setCfg({ ...empty, ...res.config, api_token: "", smtp_password: "" });
        }
      } catch (e) {
        console.error(e);
      } finally { setLoading(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, enabled]);

  if (!enabled) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <Mail className="h-10 w-10 mx-auto text-muted-foreground" />
          <h3 className="font-serif text-lg">Módulo de Servidores de E-mail indisponível</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Este módulo não está incluído no seu plano atual. Entre em contato com o SuperAdmin para habilitá-lo.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const handleSave = async () => {
    setSaving(true);
    try {
      await call("save_config", { config: cfg });
      toast.success("Configurações salvas");
      setCfg(c => ({ ...c, api_token: "", smtp_password: "" }));
    } catch (e) {
      toast.error("Erro ao salvar: " + (e as Error).message);
    } finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const r = await call("test_connection");
      if (r?.ok) toast.success("Conexão com Titan validada");
      else toast.error(`Falha (${r?.status}): ${JSON.stringify(r?.body)?.slice(0, 200)}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setTesting(false); }
  };

  const loadMailboxes = async () => {
    try {
      const r = await call("list_mailboxes");
      const list = (r?.body?.data ?? r?.body?.accounts ?? r?.body ?? []) as Array<{ email: string; first_name?: string; last_name?: string }>;
      setMailboxes(Array.isArray(list) ? list : []);
    } catch (e) { toast.error((e as Error).message); }
  };

  const createMailbox = async () => {
    if (!newMailbox.email || !newMailbox.password) { toast.error("Email e senha obrigatórios"); return; }
    try {
      const r = await call("create_mailbox", { mailbox: newMailbox });
      if (r?.ok) {
        toast.success("Caixa criada");
        setNewMailbox({ email: "", password: "", first_name: "", last_name: "" });
        loadMailboxes();
      } else toast.error(`Falha: ${JSON.stringify(r?.body)?.slice(0, 200)}`);
    } catch (e) { toast.error((e as Error).message); }
  };

  const deleteMailbox = async (email: string) => {
    if (!confirm(`Excluir caixa ${email}?`)) return;
    try {
      const r = await call("delete_mailbox", { mailbox: { email } });
      if (r?.ok) { toast.success("Excluída"); loadMailboxes(); }
      else toast.error("Falha ao excluir");
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-serif flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" /> Titan Email
                {cfg.enabled ? <Badge className="bg-success text-success-foreground gap-1"><CheckCircle2 className="h-3 w-3" /> Ativo</Badge>
                  : <Badge variant="outline" className="gap-1"><XCircle className="h-3 w-3" /> Inativo</Badge>}
              </CardTitle>
              <CardDescription>Configure seu domínio Titan e credenciais de API para gerenciar caixas e enviar e-mails.</CardDescription>
            </div>
            <Switch checked={cfg.enabled} onCheckedChange={(v) => setCfg(c => ({ ...c, enabled: v }))} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Domínio</Label>
              <Input value={cfg.domain} onChange={e => setCfg(c => ({ ...c, domain: e.target.value }))} placeholder="suadominio.com.br" />
            </div>
            <div className="space-y-1.5">
              <Label>API Token Titan</Label>
              <Input type="password" value={cfg.api_token} onChange={e => setCfg(c => ({ ...c, api_token: e.target.value }))} placeholder={cfg.smtp_user ? "(mantém atual)" : "Bearer token"} />
            </div>
            <div className="space-y-1.5">
              <Label>Host SMTP</Label>
              <Input value={cfg.smtp_host} onChange={e => setCfg(c => ({ ...c, smtp_host: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Porta SMTP</Label>
              <Input type="number" value={cfg.smtp_port} onChange={e => setCfg(c => ({ ...c, smtp_port: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Usuário SMTP</Label>
              <Input value={cfg.smtp_user} onChange={e => setCfg(c => ({ ...c, smtp_user: e.target.value }))} placeholder="contato@suadominio.com.br" />
            </div>
            <div className="space-y-1.5">
              <Label>Senha SMTP</Label>
              <Input type="password" value={cfg.smtp_password} onChange={e => setCfg(c => ({ ...c, smtp_password: e.target.value }))} placeholder={cfg.smtp_user ? "(mantém atual)" : ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Nome do Remetente</Label>
              <Input value={cfg.from_name} onChange={e => setCfg(c => ({ ...c, from_name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail do Remetente</Label>
              <Input value={cfg.from_email} onChange={e => setCfg(c => ({ ...c, from_email: e.target.value }))} />
            </div>
          </div>
          <Alert>
            <AlertDescription className="text-xs">
              Credenciais são armazenadas no banco com RLS restrito; nunca expostas ao cliente. O token só pode ser usado por edge functions autorizadas.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={testing} className="gap-2">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Testar Conexão
            </Button>
          </div>
        </CardContent>
      </Card>

      {cfg.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" /> Caixas de E-mail
            </CardTitle>
            <CardDescription>Gerencie as caixas associadas ao seu domínio Titan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button size="sm" variant="outline" onClick={loadMailboxes}>Carregar Caixas</Button>

            <div className="grid sm:grid-cols-4 gap-2">
              <Input placeholder="email@dominio.com" value={newMailbox.email} onChange={e => setNewMailbox({ ...newMailbox, email: e.target.value })} />
              <Input type="password" placeholder="Senha inicial" value={newMailbox.password} onChange={e => setNewMailbox({ ...newMailbox, password: e.target.value })} />
              <Input placeholder="Nome" value={newMailbox.first_name} onChange={e => setNewMailbox({ ...newMailbox, first_name: e.target.value })} />
              <div className="flex gap-2">
                <Input placeholder="Sobrenome" value={newMailbox.last_name} onChange={e => setNewMailbox({ ...newMailbox, last_name: e.target.value })} />
                <Button size="icon" onClick={createMailbox}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>

            <div className="space-y-1">
              {mailboxes.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Nenhuma caixa carregada</p>
              ) : mailboxes.map((m) => (
                <div key={m.email} className="flex items-center justify-between px-3 py-2 border rounded text-sm">
                  <span>{m.email} {m.first_name && <span className="text-muted-foreground">— {m.first_name} {m.last_name}</span>}</span>
                  <Button size="icon" variant="ghost" onClick={() => deleteMailbox(m.email)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
