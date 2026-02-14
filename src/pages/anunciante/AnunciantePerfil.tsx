import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdvertiser } from "@/components/anunciante/AnuncianteLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Loader2, Building2, UserCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Minha Empresa</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie os dados do seu cadastro</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-serif flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Dados Cadastrais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Documento</Label>
              <Input value={`${advertiser.document_type.toUpperCase()}: ${advertiser.document_number}`} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Status</Label>
              <Input value={advertiser.status} disabled className="bg-muted capitalize" />
            </div>
          </div>
          <div>
            <Label>Razão Social *</Label>
            <Input value={form.company_name} onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))} />
          </div>
          <div>
            <Label>Nome Fantasia</Label>
            <Input value={form.trading_name} onChange={(e) => setForm((f) => ({ ...f, trading_name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>E-mail</Label>
              <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>Website</Label>
            <Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
          </div>
          <div>
            <Label>Endereço</Label>
            <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-serif flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Representante Legal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Nome Completo</Label>
              <Input value={form.representative_name} onChange={(e) => setForm((f) => ({ ...f, representative_name: e.target.value }))} />
            </div>
            <div>
              <Label>CPF</Label>
              <Input value={form.representative_cpf} onChange={(e) => setForm((f) => ({ ...f, representative_cpf: e.target.value }))} placeholder="000.000.000-00" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={form.representative_email} onChange={(e) => setForm((f) => ({ ...f, representative_email: e.target.value }))} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={form.representative_phone} onChange={(e) => setForm((f) => ({ ...f, representative_phone: e.target.value }))} placeholder="(00) 00000-0000" />
            </div>
          </div>
          <div>
            <Label>Endereço</Label>
            <Input value={form.representative_address} onChange={(e) => setForm((f) => ({ ...f, representative_address: e.target.value }))} />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
