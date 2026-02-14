import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdvertiser } from "@/components/anunciante/AnuncianteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Loader2, Building2, UserCheck, Globe, Mail, Phone, MapPin, FileText, ShieldCheck } from "lucide-react";

export default function AnunciantePerfil() {
  const advertiser = useAdvertiser();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: advertiser.company_name,
    trading_name: advertiser.trading_name ?? "",
    email: advertiser.email,
    phone: advertiser.phone ?? "",
    website: advertiser.website ?? "",
    address: advertiser.address ?? "",
    representative_name: advertiser.representative_name ?? "",
    representative_cpf: advertiser.representative_cpf ?? "",
    representative_email: advertiser.representative_email ?? "",
    representative_phone: advertiser.representative_phone ?? "",
    representative_address: advertiser.representative_address ?? "",
  });

  const handleSave = async () => {
    if (!form.company_name.trim()) { toast.error("Razão Social é obrigatória."); return; }
    setSaving(true);

    const { error } = await supabase
      .from("advertisers")
      .update({
        company_name: form.company_name.trim(),
        trading_name: form.trading_name.trim() || null,
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        website: form.website.trim() || null,
        address: form.address.trim() || null,
        representative_name: form.representative_name.trim() || null,
        representative_cpf: form.representative_cpf.trim() || null,
        representative_email: form.representative_email.trim() || null,
        representative_phone: form.representative_phone.trim() || null,
        representative_address: form.representative_address.trim() || null,
      })
      .eq("id", advertiser.id);

    setSaving(false);
    if (error) toast.error("Erro ao salvar.");
    else toast.success("Dados atualizados!");
  };

  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    aprovado: { label: "Aprovado", variant: "default" },
    pendente: { label: "Pendente", variant: "secondary" },
    rejeitado: { label: "Rejeitado", variant: "destructive" },
    suspenso: { label: "Suspenso", variant: "outline" },
  };
  const st = statusMap[advertiser.status] ?? statusMap.pendente;

  const initials = advertiser.company_name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary/80 p-6 sm:p-8">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-accent/20 border-2 border-accent/40 flex items-center justify-center">
            <span className="text-xl font-bold text-accent">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 mb-1">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-primary-foreground truncate">
                {advertiser.trading_name || advertiser.company_name}
              </h1>
              <Badge variant={st.variant} className="text-[10px] uppercase tracking-wider font-semibold">{st.label}</Badge>
            </div>
            <p className="text-sm text-primary-foreground/60 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              {advertiser.document_type.toUpperCase()}: {advertiser.document_number}
            </p>
          </div>
        </div>
      </div>

      {/* Dados da Empresa */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-serif font-semibold text-foreground">Dados da Empresa</h2>
            <p className="text-xs text-muted-foreground">Informações cadastrais e contato</p>
          </div>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Razão Social *</Label>
                <Input value={form.company_name} onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome Fantasia</Label>
                <Input value={form.trading_name} onChange={(e) => setForm((f) => ({ ...f, trading_name: e.target.value }))} className="h-10" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="h-3 w-3" /> E-mail
                </Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="h-3 w-3" /> Telefone
                </Label>
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="(00) 00000-0000" className="h-10" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="h-3 w-3" /> Website
                </Label>
                <Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" /> Endereço
                </Label>
                <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="h-10" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Representante Legal */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/15">
            <UserCheck className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h2 className="text-base font-serif font-semibold text-foreground">Representante Legal</h2>
            <p className="text-xs text-muted-foreground">Pessoa responsável pela empresa</p>
          </div>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome Completo</Label>
                <Input value={form.representative_name} onChange={(e) => setForm((f) => ({ ...f, representative_name: e.target.value }))} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3" /> CPF
                </Label>
                <Input value={form.representative_cpf} onChange={(e) => setForm((f) => ({ ...f, representative_cpf: e.target.value }))} placeholder="000.000.000-00" className="h-10" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="h-3 w-3" /> E-mail
                </Label>
                <Input type="email" value={form.representative_email} onChange={(e) => setForm((f) => ({ ...f, representative_email: e.target.value }))} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="h-3 w-3" /> Telefone
                </Label>
                <Input value={form.representative_phone} onChange={(e) => setForm((f) => ({ ...f, representative_phone: e.target.value }))} placeholder="(00) 00000-0000" className="h-10" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3 w-3" /> Endereço
              </Label>
              <Input value={form.representative_address} onChange={(e) => setForm((f) => ({ ...f, representative_address: e.target.value }))} className="h-10" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Save button sticky */}
      <div className="flex justify-end pb-4">
        <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2 px-8 shadow-md">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}
