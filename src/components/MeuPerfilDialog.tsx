import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { toast } from "sonner";
import { Loader2, Save, User, Globe, Users } from "lucide-react";

interface MeuPerfilDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProfileData {
  full_name: string;
  phone: string;
  cpf: string;
  address: string;
  birth_date: string;
  avatar_url: string | null;
  slug: string;
  show_suggestions: boolean;
}

export function MeuPerfilDialog({ open, onOpenChange }: MeuPerfilDialogProps) {
  const { user, refreshRole } = useAuth();
  const { logAction } = useAuditLog();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileData>({
    full_name: "",
    phone: "",
    cpf: "",
    address: "",
    birth_date: "",
    avatar_url: null,
    slug: "",
    show_suggestions: true,
  });

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    supabase
      .from("profiles")
      .select("full_name, phone, cpf, address, birth_date, avatar_url, slug, show_suggestions")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm({
            full_name: data.full_name ?? "",
            phone: data.phone ?? "",
            cpf: data.cpf ?? "",
            address: data.address ?? "",
            birth_date: data.birth_date ?? "",
            avatar_url: data.avatar_url,
            slug: data.slug ?? "",
            show_suggestions: data.show_suggestions ?? true,
          });
        }
        setLoading(false);
      });
  }, [open, user]);

  const handleSave = async () => {
    if (!user) return;
    if (!form.full_name.trim()) {
      toast.error("Nome completo é obrigatório.");
      return;
    }

    const cleanSlug = form.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        cpf: form.cpf.trim() || null,
        address: form.address.trim() || null,
        birth_date: form.birth_date || null,
        slug: cleanSlug || null,
        show_suggestions: form.show_suggestions,
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Erro ao salvar perfil.");
      setSaving(false);
      return;
    }

    await logAction({
      action: "UPDATE_OWN_PROFILE",
      targetTable: "profiles",
      targetId: user.id,
      details: { full_name: form.full_name },
    });

    await refreshRole(); // refresh profile in context
    toast.success("Perfil atualizado com sucesso!");
    setSaving(false);
    onOpenChange(false);
  };

  const initials = form.full_name
    ? form.full_name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "??";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <User className="h-5 w-5" />
            Meu Perfil
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Avatar className="h-16 w-16">
                {form.avatar_url ? <AvatarImage src={form.avatar_url} alt={form.full_name} /> : null}
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="profile-name">Nome completo *</Label>
                  <Input
                    id="profile-name"
                    value={form.full_name}
                    onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="profile-slug">Seu Identificador (URL) / Publico</Label>
                  <div className="relative">
                    <Input
                      id="profile-slug"
                      value={form.slug}
                      onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                      placeholder="seu-identificador"
                      className="pr-10"
                    />
                    {form.slug && (
                      <a
                        href={`/${form.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                        title="Ver Perfil Público"
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Permita edição do nome público que será exibido. Link: {window.location.origin}/{form.slug || "seu-slug"}
                  </p>
                </div>
              </div>
              <div>
                <Label htmlFor="profile-cpf">CPF</Label>
                <Input
                  id="profile-cpf"
                  value={form.cpf}
                  onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))}
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <Label htmlFor="profile-phone">Telefone</Label>
                <Input
                  id="profile-phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label htmlFor="profile-birth">Data de nascimento</Label>
                <Input
                  id="profile-birth"
                  type="date"
                  value={form.birth_date}
                  onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="profile-address">Endereço</Label>
                <Input
                  id="profile-address"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Seu endereço"
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-medium">Mostrar sugestões</Label>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Sugestões de contas baseadas em localização e fraternidade
                  </p>
                </div>
                <Switch
                  checked={form.show_suggestions}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, show_suggestions: checked }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Salvar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
