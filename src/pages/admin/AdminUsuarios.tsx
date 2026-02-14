import { useState, useEffect, useCallback } from "react";
import { useAuth, type AppRole } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  UserPlus, Pencil, ShieldCheck, ShieldOff, Search, Users, Shield, Trash2, User, MapPin, KeyRound, Lock, Copy,
} from "lucide-react";
import { ConfirmSensitiveAction } from "@/components/ConfirmSensitiveAction";

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: AppRole | null;
  is_active: boolean;
  created_at: string;
  cpf?: string;
  phone?: string;
  address?: string;
  birth_date?: string;
}

const emptyForm = {
  full_name: "", email: "", password: "",
  cpf: "", phone: "", address: "", birth_date: "",
};

export default function AdminUsuarios() {
  const { session } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);

  // Password reset
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // 2FA status map & setup
  const [twoFAMap, setTwoFAMap] = useState<Record<string, boolean>>({});
  const [disabling2FA, setDisabling2FA] = useState(false);
  const [setupMode, setSetupMode] = useState(false);
  const [tfaSecret, setTfaSecret] = useState("");
  const [tfaCode, setTfaCode] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const apiCall = useCallback(
    async (fnName: string, action: string, method: string, body?: Record<string, unknown>, extraParams?: string) => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fnName}?action=${action}${extraParams || ""}`;
      const resp = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return { ok: resp.ok, data: await resp.json() };
    },
    [session?.access_token]
  );

  const fetchUsers = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    const { ok, data } = await apiCall("admin-users", "list", "GET");
    if (ok) setUsers(data);
    else toast.error(data.error || "Erro ao carregar usuários");
    setLoading(false);
  }, [session?.access_token, apiCall]);

  const fetch2FAStatus = useCallback(async () => {
    if (!session?.access_token) return;
    const { ok, data } = await apiCall("admin-users", "2fa_status", "GET");
    if (ok) setTwoFAMap(data);
  }, [session?.access_token, apiCall]);

  useEffect(() => {
    fetchUsers();
    fetch2FAStatus();
  }, [fetchUsers, fetch2FAStatus]);

  const openCreate = () => {
    setDialogMode("create");
    setForm(emptyForm);
    setEditUserId(null);
    setNewPassword("");
    setDialogOpen(true);
  };

  const openEdit = (user: UserRow) => {
    setDialogMode("edit");
    setForm({
      full_name: user.full_name,
      email: user.email,
      password: "",
      cpf: user.cpf || "",
      phone: user.phone || "",
      address: user.address || "",
      birth_date: user.birth_date || "",
    });
    setEditUserId(user.id);
    setNewPassword("");
    setSetupMode(false);
    setTfaSecret("");
    setTfaCode("");
    setBackupCodes([]);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    try {
      if (dialogMode === "create") {
        if (!form.email.trim() || !form.password.trim()) {
          toast.error("Email e senha são obrigatórios"); setSaving(false); return;
        }
        if (form.password.length < 6) {
          toast.error("Senha deve ter no mínimo 6 caracteres"); setSaving(false); return;
        }
        const { ok, data } = await apiCall("admin-users", "create", "POST", {
          email: form.email.trim(),
          full_name: form.full_name.trim(),
          password: form.password,
          role: "superadmin",
          cpf: form.cpf.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          birth_date: form.birth_date || undefined,
        });
        if (!ok) { toast.error(data.error || "Erro ao criar"); setSaving(false); return; }
        toast.success("SuperAdmin criado com sucesso");
      } else {
        const { ok, data } = await apiCall("admin-users", "update", "PUT", {
          user_id: editUserId,
          full_name: form.full_name.trim(),
          role: "superadmin",
          cpf: form.cpf.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          birth_date: form.birth_date || undefined,
        });
        if (!ok) { toast.error(data.error || "Erro ao atualizar"); setSaving(false); return; }
        toast.success("Usuário atualizado");
      }
      setDialogOpen(false); fetchUsers();
    } catch { toast.error("Erro inesperado"); } finally { setSaving(false); }
  };

  const handleResetPassword = async () => {
    if (!editUserId) return;
    if (newPassword.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres"); return;
    }
    setSavingPassword(true);
    try {
      const { ok, data } = await apiCall("admin-users", "reset_password", "PUT", {
        user_id: editUserId,
        new_password: newPassword,
      });
      if (!ok) { toast.error(data.error || "Erro ao redefinir senha"); return; }
      toast.success("Senha redefinida com sucesso");
      setNewPassword("");
    } catch { toast.error("Erro inesperado"); } finally { setSavingPassword(false); }
  };

  const handleDisable2FA = async () => {
    if (!editUserId) return;
    setDisabling2FA(true);
    try {
      const { ok, data } = await apiCall("admin-users", "disable_2fa", "PUT", { user_id: editUserId });
      if (!ok) { toast.error(data.error || "Erro ao desativar 2FA"); return; }
      toast.success("2FA desativado para este usuário");
      setTwoFAMap((prev) => {
        const copy = { ...prev };
        delete copy[editUserId!];
        return copy;
      });
    } catch { toast.error("Erro inesperado"); } finally { setDisabling2FA(false); }
  };

  // 2FA setup flow (for the currently logged-in user editing their own 2FA)
  const isEditingSelf = editUserId === session?.user?.id;

  const startSetup2FA = async () => {
    const { ok, data } = await apiCall("admin-2fa", "setup", "POST");
    if (ok) {
      setTfaSecret(data.secret);
      setSetupMode(true);
    } else {
      toast.error(data.error || "Erro ao iniciar configuração");
    }
  };

  const verifyAndEnable2FA = async () => {
    if (tfaCode.length !== 6) { toast.error("Digite o código de 6 dígitos"); return; }
    setVerifying2FA(true);
    const { ok, data } = await apiCall("admin-2fa", "verify", "POST", { code: tfaCode });
    setVerifying2FA(false);
    if (ok && data.success) {
      setTwoFAMap((prev) => ({ ...prev, [editUserId!]: true }));
      setSetupMode(false);
      setBackupCodes(data.backup_codes || []);
      toast.success("2FA ativado com sucesso!");
    } else {
      toast.error(data.error || "Código incorreto");
    }
  };

  const disableOwn2FA = async () => {
    const { ok, data } = await apiCall("admin-2fa", "disable", "POST");
    if (ok) {
      setTwoFAMap((prev) => {
        const copy = { ...prev };
        delete copy[editUserId!];
        return copy;
      });
      setBackupCodes([]);
      toast.success("2FA desativado");
    } else {
      toast.error(data.error || "Erro ao desativar");
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(tfaSecret);
    toast.success("Chave copiada!");
  };

  const toggleActive = async (user: UserRow) => {
    const { ok, data } = await apiCall("admin-users", "update", "PUT", { user_id: user.id, is_active: !user.is_active });
    if (!ok) { toast.error(data.error || "Erro"); return; }
    toast.success(user.is_active ? "Usuário desativado" : "Usuário ativado");
    fetchUsers();
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    const { ok, data } = await apiCall("admin-users", "delete", "DELETE", { user_id: deleteUser.id });
    if (!ok) { toast.error(data.error || "Erro ao excluir"); return; }
    toast.success("Usuário excluído com sucesso");
    setDeleteUser(null);
    fetchUsers();
  };

  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.cpf || "").includes(search)
  );

  const set = (field: keyof typeof emptyForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const is2FAActive = (userId: string) => !!twoFAMap[userId];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Usuários SuperAdmin</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os administradores da plataforma.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <UserPlus className="h-4 w-4" /> Novo SuperAdmin
        </Button>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Users className="h-4 w-4 text-muted-foreground" />
              SuperAdmins ({filtered.length})
            </CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, email ou CPF..." value={search}
                onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5 text-accent" />
                        {user.full_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                    <TableCell className="text-muted-foreground text-xs font-mono">{user.cpf || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{user.phone || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "destructive"} className="text-xs">
                        {user.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(user.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(user)} title="Editar">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title={is2FAActive(user.id) ? "2FA Ativo" : "2FA Inativo"} onClick={() => openEdit(user)}>
                          <KeyRound className={`h-3.5 w-3.5 ${is2FAActive(user.id) ? "text-primary" : "text-muted-foreground/40"}`} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(user)}
                          title={user.is_active ? "Desativar" : "Ativar"}>
                          {user.is_active ? <ShieldOff className="h-3.5 w-3.5 text-destructive" /> : <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteUser(user)} title="Excluir">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {dialogMode === "create" ? "Novo SuperAdmin" : "Editar SuperAdmin"}
            </DialogTitle>
          </DialogHeader>

          {dialogMode === "create" ? (
            /* ─── CREATE MODE ─── */
            <div className="space-y-6 py-2">
              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> Dados de Acesso
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Email *</Label>
                    <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="usuario@email.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Senha *</Label>
                    <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Mínimo 6 caracteres" />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Dados Pessoais
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Nome Completo *</Label>
                    <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Ex: João da Silva" maxLength={100} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CPF</Label>
                    <Input value={form.cpf} onChange={(e) => set("cpf", e.target.value)} placeholder="000.000.000-00" maxLength={14} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data de Nascimento</Label>
                    <Input type="date" value={form.birth_date} onChange={(e) => set("birth_date", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Telefone</Label>
                    <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(00) 00000-0000" maxLength={15} />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Endereço
                </p>
                <div className="space-y-1.5">
                  <Label>Endereço Completo</Label>
                  <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Rua, número, bairro, cidade – UF, CEP" />
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border border-border/60">
                <Shield className="h-4 w-4 text-accent" />
                <span className="text-sm text-muted-foreground">
                  Este usuário será criado com perfil <strong className="text-foreground">SuperAdmin</strong>.
                </span>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Salvando..." : "Criar SuperAdmin"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* ─── EDIT MODE WITH TABS ─── */
            <Tabs defaultValue="dados" className="py-2">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="senha">
                  <Lock className="h-3.5 w-3.5 mr-1.5" /> Senha
                </TabsTrigger>
                <TabsTrigger value="2fa">
                  <KeyRound className="h-3.5 w-3.5 mr-1.5" />
                  2FA
                  {editUserId && is2FAActive(editUserId) && (
                    <span className="ml-1.5 h-2 w-2 rounded-full bg-primary inline-block" />
                  )}
                </TabsTrigger>
              </TabsList>

              {/* ─── Tab: Dados Pessoais ─── */}
              <TabsContent value="dados" className="space-y-6 mt-4">
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> Dados Pessoais
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Nome Completo *</Label>
                      <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Ex: João da Silva" maxLength={100} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>CPF</Label>
                      <Input value={form.cpf} onChange={(e) => set("cpf", e.target.value)} placeholder="000.000.000-00" maxLength={14} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Data de Nascimento</Label>
                      <Input type="date" value={form.birth_date} onChange={(e) => set("birth_date", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Telefone</Label>
                      <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(00) 00000-0000" maxLength={15} />
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Endereço
                  </p>
                  <div className="space-y-1.5">
                    <Label>Endereço Completo</Label>
                    <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Rua, número, bairro, cidade – UF, CEP" />
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border border-border/60">
                  <Shield className="h-4 w-4 text-accent" />
                  <span className="text-sm text-muted-foreground">
                    Perfil: <strong className="text-foreground">SuperAdmin</strong>
                  </span>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </TabsContent>

              {/* ─── Tab: Senha ─── */}
              <TabsContent value="senha" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" /> Redefinir Senha
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Defina uma nova senha para este usuário. Ele poderá alterá-la após o próximo login.
                  </p>
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <Label>Nova Senha *</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <Button onClick={handleResetPassword} disabled={savingPassword || newPassword.length < 6} className="gap-2">
                  <Lock className="h-4 w-4" />
                  {savingPassword ? "Redefinindo..." : "Redefinir Senha"}
                </Button>
              </TabsContent>

              {/* ─── Tab: 2FA ─── */}
              <TabsContent value="2fa" className="space-y-4 mt-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    {editUserId && is2FAActive(editUserId) ? (
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    ) : (
                      <ShieldOff className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {editUserId && is2FAActive(editUserId) ? "2FA está ativado" : "2FA não está ativado"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {editUserId && is2FAActive(editUserId)
                          ? (isEditingSelf ? "Sua conta está protegida com autenticação TOTP." : "Este usuário configurou autenticação TOTP.")
                          : (isEditingSelf ? "Recomendamos ativar para maior segurança." : "O usuário ainda não ativou a autenticação em dois fatores.")}
                      </p>
                    </div>
                  </div>
                  <Badge variant={editUserId && is2FAActive(editUserId) ? "default" : "secondary"}>
                    {editUserId && is2FAActive(editUserId) ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                {/* Self: can setup 2FA */}
                {isEditingSelf && !is2FAActive(editUserId!) && !setupMode && (
                  <Button onClick={startSetup2FA} className="gap-2">
                    <KeyRound className="h-4 w-4" />
                    Configurar 2FA
                  </Button>
                )}

                {/* Self: setup mode */}
                {isEditingSelf && setupMode && (
                  <div className="space-y-4 pt-2">
                    <Separator />
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">1. Copie a chave secreta</Label>
                      <p className="text-xs text-muted-foreground">
                        Abra seu app autenticador (Google Authenticator, Authy, etc.) e adicione manualmente com a chave abaixo:
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-muted px-3 py-2 rounded text-xs font-mono break-all">
                          {tfaSecret}
                        </code>
                        <Button variant="outline" size="icon" onClick={copySecret} title="Copiar">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">2. Digite o código gerado</Label>
                      <p className="text-xs text-muted-foreground">
                        Insira o código de 6 dígitos exibido no seu autenticador.
                      </p>
                      <div className="flex items-center gap-2 max-w-xs">
                        <Input
                          value={tfaCode}
                          onChange={(e) => setTfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="000000"
                          maxLength={6}
                          className="text-center text-lg font-mono tracking-widest"
                        />
                        <Button onClick={verifyAndEnable2FA} disabled={verifying2FA || tfaCode.length !== 6}>
                          {verifying2FA ? "Verificando..." : "Ativar"}
                        </Button>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSetupMode(false)}>
                      Cancelar
                    </Button>
                  </div>
                )}

                {/* Self: disable own 2FA */}
                {isEditingSelf && is2FAActive(editUserId!) && !setupMode && (
                  <Button variant="destructive" size="sm" onClick={disableOwn2FA} className="gap-2">
                    <ShieldOff className="h-4 w-4" /> Desativar 2FA
                  </Button>
                )}

                {/* Admin: disable another user's 2FA */}
                {!isEditingSelf && editUserId && is2FAActive(editUserId) && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Como administrador, você pode desativar o 2FA deste usuário em caso de perda do autenticador.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDisable2FA}
                      disabled={disabling2FA}
                      className="gap-2"
                    >
                      <ShieldOff className="h-4 w-4" />
                      {disabling2FA ? "Desativando..." : "Desativar 2FA"}
                    </Button>
                  </div>
                )}

                {/* Admin: user hasn't enabled 2FA */}
                {!isEditingSelf && editUserId && !is2FAActive(editUserId) && (
                  <p className="text-xs text-muted-foreground italic">
                    O próprio usuário deve ativar o 2FA nas configurações da sua conta.
                  </p>
                )}

                {/* Backup codes */}
                {backupCodes.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <Separator />
                    <Label className="text-sm font-semibold text-destructive">
                      ⚠️ Códigos de Recuperação
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Guarde esses códigos em local seguro. Cada código pode ser usado uma única vez.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {backupCodes.map((bc, i) => (
                        <code key={i} className="bg-muted px-3 py-1.5 rounded text-xs font-mono text-center">
                          {bc}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmSensitiveAction
        open={!!deleteUser}
        onOpenChange={(open) => { if (!open) setDeleteUser(null); }}
        title="Excluir SuperAdmin"
        description={`Tem certeza que deseja excluir permanentemente o usuário "${deleteUser?.full_name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        requireTypedConfirmation="EXCLUIR"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
