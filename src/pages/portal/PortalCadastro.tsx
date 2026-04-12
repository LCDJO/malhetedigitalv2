import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePortalMemberContext } from "@/components/portal/PortalLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Calendar, Award, Upload, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useAuditLog } from "@/hooks/useAuditLog";

const degreeLabels: Record<string, string> = {
  aprendiz: "Aprendiz",
  companheiro: "Companheiro",
  mestre: "Mestre",
};

const statusLabels: Record<string, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  licenciado: "Licenciado",
  suspenso: "Suspenso",
};

const fmtDate = (d: string | null) => (d ? format(new Date(d), "dd/MM/yyyy") : "—");

export default function PortalCadastro() {
  const member = usePortalMemberContext();
  const { user } = useAuth();
  const { logAction } = useAuditLog();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    email: member.email ?? "",
    phone: member.phone ?? "",
    address: member.address ?? "",
    avatar_url: member.avatar_url ?? "",
    slug: member.slug ?? "",
    bio: member.bio ?? "",
  });

  useEffect(() => {
    setForm({
      email: member.email ?? "",
      phone: member.phone ?? "",
      address: member.address ?? "",
      avatar_url: member.avatar_url ?? "",
      slug: member.slug ?? "",
      bio: member.bio ?? "",
    });
  }, [member.id, member.email, member.phone, member.address, member.avatar_url, member.slug, member.bio]);

  const isDirty = useMemo(() => {
    const normalize = (value: string | null | undefined) => (value ?? "").trim();
    return (
      normalize(form.email) !== normalize(member.email) ||
      normalize(form.phone) !== normalize(member.phone) ||
      normalize(form.address) !== normalize(member.address) ||
      normalize(form.avatar_url) !== normalize(member.avatar_url) ||
      normalize(form.slug) !== normalize(member.slug) ||
      normalize(form.bio) !== normalize(member.bio)
    );
  }, [form, member.email, member.phone, member.address, member.avatar_url, member.slug, member.bio]);

  const initials = member.full_name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A foto deve ter no máximo 2 MB.");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("member-photos").upload(path, file, { upsert: false });

    if (error) {
      toast.error(error.message || "Erro ao enviar foto.");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("member-photos").getPublicUrl(path);
    setForm((prev) => ({ ...prev, avatar_url: data.publicUrl }));
    setUploading(false);
  };

  const handleSalvar = async () => {
    setSaving(true);
    const email = form.email.trim().toLowerCase();
    
    // Member update payload
    const memberPayload = {
      email: email || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      avatar_url: form.avatar_url.trim() || null,
    };

    // Profile update payload
    const profilePayload = {
      slug: form.slug.trim().toLowerCase() || null,
      bio: form.bio.trim() || null,
      avatar_url: form.avatar_url.trim() || null,
    };

    // 1. Validate slug uniqueness if changed
    if (form.slug.trim() && form.slug.trim().toLowerCase() !== member.slug) {
      const { data: existingSlug } = await supabase
        .from("profiles")
        .select("id")
        .eq("slug", form.slug.trim().toLowerCase())
        .maybeSingle();
      
      if (existingSlug && existingSlug.id !== user?.id) {
        toast.error("Este nome de usuário (slug) já está sendo usado.");
        setSaving(false);
        return;
      }
    }

    // 2. Update Member table
    const { error: memberError } = await supabase.from("members").update(memberPayload).eq("id", member.id);
    if (memberError) {
      toast.error(memberError.message || "Erro ao atualizar dados do membro.");
      setSaving(false);
      return;
    }

    // 3. Update Profile table
    if (user?.id) {
      const { error: profileError } = await supabase.from("profiles").update(profilePayload).eq("id", user.id);
      if (profileError) {
        toast.error(profileError.message || "Erro ao atualizar perfil social.");
        setSaving(false);
        return;
      }
    }

    if (email && user?.email && email !== user.email.toLowerCase()) {
      const { error: authError } = await supabase.auth.updateUser({ email });
      if (authError) {
        toast.warning("Dados salvos, mas não foi possível atualizar o e-mail de login automaticamente.");
      } else {
        toast.success("Dados salvos. Verifique seu e-mail para confirmar a alteração de login.");
        setSaving(false);
        return;
      }
    }

    toast.success("Dados atualizados com sucesso.");
    logAction({ action: "UPDATE_OWN_PROFILE", targetTable: "members", targetId: member.id, details: { email: memberPayload.email, phone: memberPayload.phone, slug: profilePayload.slug } });
    setSaving(false);
  };

  const infoItems = [
    { icon: Mail, label: "E-mail", value: form.email || "—" },
    { icon: Phone, label: "Telefone", value: form.phone || "—" },
    { icon: MapPin, label: "Endereço", value: form.address || "—" },
    { icon: Calendar, label: "Data de Nascimento", value: fmtDate(member.birth_date) },
    { icon: Award, label: "CIM", value: member.cim ?? "—" },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-serif font-bold">Meu Perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">Visualize e edite seus dados pessoais</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-sans">{member.full_name}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{degreeLabels[member.degree] ?? member.degree}</Badge>
              <Badge className={member.status === "ativo" ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>
                {statusLabels[member.status] ?? member.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-5 flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {form.avatar_url ? <AvatarImage src={form.avatar_url} alt={member.full_name} /> : null}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Label htmlFor="portal-avatar">Foto do Perfil</Label>
              <Input id="portal-avatar" type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
              <p className="text-[11px] text-muted-foreground">PNG/JPG até 2MB.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="space-y-1.5">
              <Label>Nome de Usuário (@slug)</Label>
              <Input 
                value={form.slug} 
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '') }))} 
                placeholder="nome.exemplo" 
              />
              <p className="text-[10px] text-muted-foreground">Temos que separar o perfil público do perfil cadastrado para acesso a loja. separados! Link: malhetedigital.com.br/{form.slug || "usuario"}</p>
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="seuemail@exemplo.com" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Biografia (Bio)</Label>
              <Textarea 
                value={form.bio} 
                onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))} 
                placeholder="Conte um pouco sobre sua trajetória na Ordem..." 
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone Celular</Label>
              <Input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-1.5 sm:col-span-1">
              <Label>Endereço</Label>
              <Input value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} placeholder="Rua, número, bairro, cidade" />
            </div>
          </div>

          <div className="mb-6">
            <Button onClick={handleSalvar} disabled={saving || uploading || !isDirty} className="gap-1.5">
              {saving || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Salvar alterações
            </Button>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {infoItems.map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted shrink-0">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <dt className="text-[11px] text-muted-foreground uppercase tracking-wide">{item.label}</dt>
                  <dd className="text-sm font-medium">{item.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* Timeline maçônica */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-sans">Trajetória Maçônica</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: "Iniciação", date: member.initiation_date },
              { label: "Elevação", date: member.elevation_date },
              { label: "Exaltação", date: member.exaltation_date },
            ].map((step) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${step.date ? "bg-primary" : "bg-border"}`} />
                <span className="text-sm font-medium w-24">{step.label}</span>
                <span className="text-sm text-muted-foreground">{fmtDate(step.date)}</span>
              </div>
            ))}
            {member.master_installed && (
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full shrink-0 bg-accent" />
                <span className="text-sm font-medium w-24">Mestre Instalado</span>
                <Badge variant="outline" className="text-accent border-accent/30 text-[11px]">Sim</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
