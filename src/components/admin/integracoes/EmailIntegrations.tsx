import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Mail, Check, ChevronDown, ChevronUp, Server } from "lucide-react";
import { toast } from "sonner";

interface EmailProvider {
  id: string;
  name: string;
  description: string;
  logo: string;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
}

const providers: EmailProvider[] = [
  {
    id: "resend",
    name: "Resend",
    description: "API moderna e simples para envio de emails transacionais.",
    logo: "📨",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "re_xxxxxxxxxxxxxxxx" },
      { key: "from_email", label: "Email Remetente", placeholder: "noreply@seudominio.com" },
    ],
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    description: "Plataforma robusta da Twilio para emails em escala.",
    logo: "📧",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "SG.xxxxxxxxxxxxxxxx" },
      { key: "from_email", label: "Email Remetente", placeholder: "noreply@seudominio.com" },
    ],
  },
  {
    id: "mailgun",
    name: "Mailgun",
    description: "Serviço de email com foco em deliverability e analytics.",
    logo: "✉️",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "key-xxxxxxxxxxxxxxxx" },
      { key: "domain", label: "Domínio", placeholder: "mg.seudominio.com" },
      { key: "from_email", label: "Email Remetente", placeholder: "noreply@seudominio.com" },
    ],
  },
  {
    id: "ses",
    name: "Amazon SES",
    description: "Serviço de email escalável da AWS com custo baixo.",
    logo: "📬",
    fields: [
      { key: "access_key", label: "Access Key ID", placeholder: "AKIAXXXXXXXXXXXXXXXX" },
      { key: "secret_key", label: "Secret Access Key", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", type: "password" },
      { key: "region", label: "Região", placeholder: "us-east-1" },
      { key: "from_email", label: "Email Remetente", placeholder: "noreply@seudominio.com" },
    ],
  },
  {
    id: "postmark",
    name: "Postmark",
    description: "Especializado em emails transacionais com entrega rápida.",
    logo: "📮",
    fields: [
      { key: "server_token", label: "Server Token", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
      { key: "from_email", label: "Email Remetente", placeholder: "noreply@seudominio.com" },
    ],
  },
  {
    id: "brevo",
    name: "Brevo (Sendinblue)",
    description: "Plataforma completa de marketing e emails transacionais.",
    logo: "💌",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "xkeysib-xxxxxxxxxxxxxxxx" },
      { key: "from_email", label: "Email Remetente", placeholder: "noreply@seudominio.com" },
    ],
  },
];

const customSmtpFields = [
  { key: "host", label: "Servidor SMTP", placeholder: "smtp.seudominio.com" },
  { key: "port", label: "Porta", placeholder: "587" },
  { key: "username", label: "Usuário", placeholder: "usuario@seudominio.com" },
  { key: "password", label: "Senha", placeholder: "••••••••", type: "password" },
  { key: "from_email", label: "Email Remetente", placeholder: "noreply@seudominio.com" },
  { key: "from_name", label: "Nome Remetente", placeholder: "Malhete Digital" },
];

export function EmailIntegrations() {
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, Record<string, string>>>({});
  const [activeProvider, setActiveProvider] = useState<string | null>("resend");
  const [useTls, setUseTls] = useState(true);

  const toggleProvider = (id: string) => {
    setExpandedProvider(expandedProvider === id ? null : id);
  };

  const updateField = (providerId: string, fieldKey: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [providerId]: { ...prev[providerId], [fieldKey]: value },
    }));
  };

  const handleSave = (providerId: string) => {
    toast.success(`Configurações de ${providerId === "custom" ? "SMTP personalizado" : providers.find((p) => p.id === providerId)?.name} salvas com sucesso.`);
    setActiveProvider(providerId);
  };

  const handleTestEmail = (providerId: string) => {
    toast.info("Enviando email de teste...");
    setTimeout(() => toast.success("Email de teste enviado com sucesso!"), 1500);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Configure o serviço de envio de emails da plataforma. Selecione um provedor e insira suas credenciais.
      </p>

      {providers.map((provider) => (
        <Card key={provider.id} className={`transition-all ${activeProvider === provider.id ? "border-primary/50 shadow-sm" : ""}`}>
          <button
            onClick={() => toggleProvider(provider.id)}
            className="w-full text-left"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{provider.logo}</span>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {provider.name}
                      {activeProvider === provider.id && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">
                          <Check className="h-3 w-3 mr-0.5" /> Ativo
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">{provider.description}</CardDescription>
                  </div>
                </div>
                {expandedProvider === provider.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </CardHeader>
          </button>
          {expandedProvider === provider.id && (
            <CardContent className="pt-0 space-y-4">
              <Separator />
              <div className="grid gap-3 sm:grid-cols-2">
                {provider.fields.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label className="text-xs">{field.label}</Label>
                    <Input
                      type={field.type || "text"}
                      placeholder={field.placeholder}
                      value={formValues[provider.id]?.[field.key] || ""}
                      onChange={(e) => updateField(provider.id, field.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={() => handleSave(provider.id)}>Salvar e Ativar</Button>
                <Button size="sm" variant="outline" onClick={() => handleTestEmail(provider.id)}>
                  <Mail className="h-3.5 w-3.5 mr-1.5" /> Enviar Teste
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {/* Custom SMTP */}
      <Card className={`transition-all ${activeProvider === "custom" ? "border-primary/50 shadow-sm" : ""}`}>
        <button onClick={() => toggleProvider("custom")} className="w-full text-left">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Server className="h-6 w-6 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    SMTP Personalizado
                    {activeProvider === "custom" && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0">
                        <Check className="h-3 w-3 mr-0.5" /> Ativo
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">Configure seu próprio servidor SMTP para envio de emails.</CardDescription>
                </div>
              </div>
              {expandedProvider === "custom" ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </CardHeader>
        </button>
        {expandedProvider === "custom" && (
          <CardContent className="pt-0 space-y-4">
            <Separator />
            <div className="grid gap-3 sm:grid-cols-2">
              {customSmtpFields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs">{field.label}</Label>
                  <Input
                    type={field.type || "text"}
                    placeholder={field.placeholder}
                    value={formValues["custom"]?.[field.key] || ""}
                    onChange={(e) => updateField("custom", field.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={useTls} onCheckedChange={setUseTls} id="tls-switch" />
              <Label htmlFor="tls-switch" className="text-xs">Usar TLS/SSL</Label>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={() => handleSave("custom")}>Salvar e Ativar</Button>
              <Button size="sm" variant="outline" onClick={() => handleTestEmail("custom")}>
                <Mail className="h-3.5 w-3.5 mr-1.5" /> Enviar Teste
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
