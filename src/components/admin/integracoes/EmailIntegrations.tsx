import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Mail,
  Check,
  ChevronRight,
  Server,
  Shield,
  Zap,
  Send,
  Globe,
  Lock,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface EmailProvider {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
  tag?: string;
}

const providers: EmailProvider[] = [
  {
    id: "resend",
    name: "Resend",
    description: "API moderna e simples para emails transacionais",
    icon: <Zap className="h-5 w-5" />,
    color: "from-violet-500/20 to-violet-600/5 border-violet-500/20",
    tag: "Recomendado",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "re_xxxxxxxxxxxxxxxx" },
      { key: "from_email", label: "Email Remetente", placeholder: "noreply@seudominio.com" },
    ],
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    description: "Plataforma robusta da Twilio para emails em escala",
    icon: <Send className="h-5 w-5" />,
    color: "from-blue-500/20 to-blue-600/5 border-blue-500/20",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "SG.xxxxxxxxxxxxxxxx" },
      { key: "from_email", label: "Email Remetente", placeholder: "noreply@seudominio.com" },
    ],
  },
  {
    id: "mailgun",
    name: "Mailgun",
    description: "Foco em deliverability e analytics avançados",
    icon: <Mail className="h-5 w-5" />,
    color: "from-red-500/20 to-red-600/5 border-red-500/20",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "key-xxxxxxxxxxxxxxxx" },
      { key: "domain", label: "Domínio", placeholder: "mg.seudominio.com" },
      { key: "from_email", label: "Email Remetente", placeholder: "noreply@seudominio.com" },
    ],
  },
  {
    id: "ses",
    name: "Amazon SES",
    description: "Serviço escalável da AWS com custo muito baixo",
    icon: <Globe className="h-5 w-5" />,
    color: "from-amber-500/20 to-amber-600/5 border-amber-500/20",
    fields: [
      { key: "access_key", label: "Access Key ID", placeholder: "AKIAXXXXXXXXXXXXXXXX" },
      { key: "secret_key", label: "Secret Access Key", placeholder: "••••••••••••••••••••", type: "password" },
      { key: "region", label: "Região", placeholder: "us-east-1" },
      { key: "from_email", label: "Email Remetente", placeholder: "noreply@seudominio.com" },
    ],
  },
  {
    id: "postmark",
    name: "Postmark",
    description: "Especializado em entrega rápida e confiável",
    icon: <Shield className="h-5 w-5" />,
    color: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/20",
    fields: [
      { key: "server_token", label: "Server Token", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
      { key: "from_email", label: "Email Remetente", placeholder: "noreply@seudominio.com" },
    ],
  },
  {
    id: "brevo",
    name: "Brevo",
    description: "Marketing e emails transacionais em uma só plataforma",
    icon: <Sparkles className="h-5 w-5" />,
    color: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
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
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, Record<string, string>>>({});
  const [activeProvider, setActiveProvider] = useState<string | null>("resend");
  const [useTls, setUseTls] = useState(true);

  const updateField = (providerId: string, fieldKey: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [providerId]: { ...prev[providerId], [fieldKey]: value },
    }));
  };

  const handleSave = (providerId: string) => {
    const name = providerId === "custom" ? "SMTP personalizado" : providers.find((p) => p.id === providerId)?.name;
    toast.success(`Configurações de ${name} salvas com sucesso.`);
    setActiveProvider(providerId);
  };

  const handleTestEmail = (providerId: string) => {
    toast.info("Enviando email de teste...");
    setTimeout(() => toast.success("Email de teste enviado com sucesso!"), 1500);
  };

  const currentFields = selectedProvider === "custom"
    ? customSmtpFields
    : providers.find((p) => p.id === selectedProvider)?.fields || [];

  const currentProvider = providers.find((p) => p.id === selectedProvider);

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-border/60">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Serviço de E-mail Transacional</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Configure o provedor responsável pelo envio de códigos de verificação, notificações e comunicações automáticas da plataforma. Apenas um provedor pode estar ativo por vez.
          </p>
        </div>
      </div>

      {/* Provider grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {providers.map((provider) => {
          const isActive = activeProvider === provider.id;
          const isSelected = selectedProvider === provider.id;

          return (
            <button
              key={provider.id}
              onClick={() => setSelectedProvider(isSelected ? null : provider.id)}
              className={`
                relative group text-left rounded-xl border p-4 transition-all duration-200
                ${isSelected
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md"
                  : isActive
                    ? "border-accent/40 bg-accent/5 shadow-sm"
                    : "border-border hover:border-primary/30 hover:shadow-sm bg-card"
                }
              `}
            >
              {/* Tag */}
              {provider.tag && (
                <div className="absolute -top-2 left-3">
                  <Badge className="text-[9px] px-1.5 py-0 bg-accent text-accent-foreground font-semibold shadow-sm">
                    {provider.tag}
                  </Badge>
                </div>
              )}

              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-2.5 right-2.5">
                  <div className="h-5 w-5 rounded-full bg-success flex items-center justify-center shadow-sm">
                    <Check className="h-3 w-3 text-success-foreground" />
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${provider.color} flex items-center justify-center mb-3 border transition-transform group-hover:scale-105`}>
                {provider.icon}
              </div>

              {/* Text */}
              <p className="text-sm font-semibold text-foreground leading-tight">{provider.name}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug line-clamp-2">{provider.description}</p>

              {/* Expand hint */}
              <div className={`flex items-center gap-1 mt-3 text-[10px] font-medium transition-colors ${isSelected ? "text-primary" : "text-muted-foreground/60 group-hover:text-muted-foreground"}`}>
                {isSelected ? "Configurando..." : "Configurar"}
                <ChevronRight className={`h-3 w-3 transition-transform ${isSelected ? "rotate-90" : "group-hover:translate-x-0.5"}`} />
              </div>
            </button>
          );
        })}

        {/* Custom SMTP card */}
        <button
          onClick={() => setSelectedProvider(selectedProvider === "custom" ? null : "custom")}
          className={`
            relative group text-left rounded-xl border p-4 transition-all duration-200
            ${selectedProvider === "custom"
              ? "border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md"
              : activeProvider === "custom"
                ? "border-accent/40 bg-accent/5 shadow-sm"
                : "border-dashed border-border hover:border-primary/30 hover:shadow-sm bg-card/50"
            }
          `}
        >
          {activeProvider === "custom" && (
            <div className="absolute top-2.5 right-2.5">
              <div className="h-5 w-5 rounded-full bg-success flex items-center justify-center shadow-sm">
                <Check className="h-3 w-3 text-success-foreground" />
              </div>
            </div>
          )}

          <div className="h-10 w-10 rounded-lg bg-muted/60 flex items-center justify-center mb-3 border border-border transition-transform group-hover:scale-105">
            <Server className="h-5 w-5 text-muted-foreground" />
          </div>

          <p className="text-sm font-semibold text-foreground leading-tight">SMTP Personalizado</p>
          <p className="text-[11px] text-muted-foreground mt-1 leading-snug line-clamp-2">Seu próprio servidor SMTP</p>

          <div className={`flex items-center gap-1 mt-3 text-[10px] font-medium transition-colors ${selectedProvider === "custom" ? "text-primary" : "text-muted-foreground/60 group-hover:text-muted-foreground"}`}>
            {selectedProvider === "custom" ? "Configurando..." : "Configurar"}
            <ChevronRight className={`h-3 w-3 transition-transform ${selectedProvider === "custom" ? "rotate-90" : "group-hover:translate-x-0.5"}`} />
          </div>
        </button>
      </div>

      {/* Configuration panel */}
      {selectedProvider && (
        <Card className="border-primary/20 shadow-lg overflow-hidden">
          {/* Panel header */}
          <div className="px-5 py-4 bg-gradient-to-r from-primary/8 to-transparent border-b border-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center border ${
                  selectedProvider === "custom"
                    ? "bg-muted/60 border-border"
                    : `bg-gradient-to-br ${currentProvider?.color || ""}`
                }`}>
                  {selectedProvider === "custom"
                    ? <Server className="h-4.5 w-4.5 text-muted-foreground" />
                    : currentProvider?.icon
                  }
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground font-serif">
                    {selectedProvider === "custom" ? "SMTP Personalizado" : currentProvider?.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {selectedProvider === "custom"
                      ? "Configure seu servidor SMTP"
                      : currentProvider?.description
                    }
                  </p>
                </div>
              </div>
              {activeProvider === selectedProvider && (
                <Badge variant="default" className="bg-success text-success-foreground text-[10px] gap-1">
                  <Check className="h-3 w-3" /> Provedor Ativo
                </Badge>
              )}
            </div>
          </div>

          <CardContent className="p-5 space-y-5">
            {/* Fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              {currentFields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground/80">{field.label}</Label>
                  <div className="relative">
                    {field.type === "password" && (
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                    )}
                    <Input
                      type={field.type || "text"}
                      placeholder={field.placeholder}
                      value={formValues[selectedProvider]?.[field.key] || ""}
                      onChange={(e) => updateField(selectedProvider, field.key, e.target.value)}
                      className={field.type === "password" ? "pl-9 font-mono text-xs" : "font-mono text-xs"}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* TLS toggle for custom SMTP */}
            {selectedProvider === "custom" && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                <Switch checked={useTls} onCheckedChange={setUseTls} id="tls-switch" />
                <div>
                  <Label htmlFor="tls-switch" className="text-xs font-medium text-foreground cursor-pointer">
                    Conexão TLS/SSL
                  </Label>
                  <p className="text-[10px] text-muted-foreground">Recomendado para conexões seguras</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleSave(selectedProvider)} className="gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  Salvar e Ativar
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleTestEmail(selectedProvider)} className="gap-1.5">
                  <Send className="h-3.5 w-3.5" />
                  Enviar Teste
                </Button>
              </div>
              {selectedProvider !== "custom" && (
                <a
                  href={`https://${selectedProvider === "ses" ? "aws.amazon.com/ses" : selectedProvider + ".com"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                >
                  Documentação <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
