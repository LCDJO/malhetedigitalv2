import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, roleLabels, type AppRole } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  UserPlus, Search, Users, MoreHorizontal, Pencil, Eye,
  ShieldCheck, ShieldOff, KeyRound, Trash2, Loader2,
} from "lucide-react";
import { useAuditLog } from "@/hooks/useAuditLog";
import { UserFormDialog } from "@/components/gestao-usuarios/UserFormDialog";
import { UserDetailDialog } from "@/components/gestao-usuarios/UserDetailDialog";
import { ResetPasswordDialog } from "@/components/gestao-usuarios/ResetPasswordDialog";
import { DeleteUserDialog } from "@/components/gestao-usuarios/DeleteUserDialog";

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: AppRole | null;
  tenant_role: string;
  is_active: boolean;
  created_at: string;
  cpf?: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  avatar_url?: string | null;
}

export default function GestaoUsuarios() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { logAction } = useAuditLog();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formInitial, setFormInitial] = useState<Partial<UserRow>>({});
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [detailUser, setDetailUser] = useState<UserRow | null>(null);
  const [resetUser, setResetUser] = useState<UserRow | null>(null);
  const [resetSaving, setResetSaving] = useState(false);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);

  // Resolve tenant
  useEffect(() => {
    const resolveTenant = async () => {
      if (!session?.user?.id) return;
      const { data } = await supabase
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", session.user.id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (data) setTenantId(data.tenant_id);
    };
    resolveTenant();
  }, [session?.user?.id]);

  const apiCall = useCallback(
    async (action: string, method: string, body?: Record<string, unknown>, extraParams?: string) => {
      const params = `action=${action}${tenantId ? `&tenant_id=${tenantId}` : ""}${extraParams ? `&${extraParams}` : ""}`;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?${params}`;
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
    [session?.access_token, tenantId]
  );

  const fetchUsers = useCallback(async () => {
    if (!session?.access_token || !tenantId) return;
    setLoading(true);
    const { ok, data } = await apiCall("list", "GET");
    if (ok) setUsers(data);
    else toast.error(data.error || "Erro ao carregar usuários");
    setLoading(false);
  }, [session?.access_token, tenantId, apiCall]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Actions
  const openCreate = () => {
    setFormMode("create");
    setFormInitial({});
    setEditUserId(null);
    setFormOpen(true);
  };

  const openEdit = (user: UserRow) => {
    setFormMode("edit");
    setFormInitial(user);
    setEditUserId(user.id);
    setFormOpen(true);
  };

  const handleSave = async (data: { full_name: string; email: string; password: string; role: AppRole; cpf: string; phone: string; address: string; birth_date: string }) => {
    if (!data.full_name.trim()) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    try {
      if (formMode === "create") {
        if (!data.email.trim() || !data.password.trim()) { toast.error("Email e senha são obrigatórios"); setSaving(false); return; }
        if (data.password.length < 6) { toast.error("Senha mínima: 6 caracteres"); setSaving(false); return; }
        const { ok, data: res } = await apiCall("create", "POST", {
          email: data.email.trim(), full_name: data.full_name.trim(),
          password: data.password, role: data.role,
          tenant_id: tenantId, tenant_role: "member",
          cpf: data.cpf || undefined, phone: data.phone || undefined,
          address: data.address || undefined, birth_date: data.birth_date || undefined,
        });
        if (!ok) { toast.error(res.error || "Erro ao criar"); setSaving(false); return; }
        toast.success("Usuário criado com sucesso");
        logAction({ action: "CREATE_USER", targetTable: "profiles", details: { email: data.email.trim(), role: data.role } });
      } else {
        const { ok, data: res } = await apiCall("update", "PUT", {
          user_id: editUserId, full_name: data.full_name.trim(), role: data.role,
          cpf: data.cpf || undefined, phone: data.phone || undefined,
          address: data.address || undefined, birth_date: data.birth_date || undefined,
        });
        if (!ok) { toast.error(res.error || "Erro ao atualizar"); setSaving(false); return; }
        toast.success("Usuário atualizado");
        logAction({ action: "UPDATE_USER", targetTable: "profiles", targetId: editUserId ?? undefined, details: { full_name: data.full_name.trim(), role: data.role } });
      }
      setFormOpen(false);
      fetchUsers();
    } catch { toast.error("Erro inesperado"); } finally { setSaving(false); }
  };

  const toggleActive = async (user: UserRow) => {
    const { ok, data } = await apiCall("update", "PUT", { user_id: user.id, is_active: !user.is_active });
    if (!ok) { toast.error(data.error || "Erro"); return; }
    toast.success(user.is_active ? "Usuário desativado" : "Usuário ativado");
    logAction({ action: user.is_active ? "DEACTIVATE_USER" : "ACTIVATE_USER", targetTable: "profiles", targetId: user.id, details: { email: user.email } });
    fetchUsers();
  };

  const handleResetPassword = async (newPassword: string) => {
    if (!resetUser) return;
    setResetSaving(true);
    try {
      const { ok, data } = await apiCall("reset_password", "PUT", { user_id: resetUser.id, new_password: newPassword });
      if (!ok) { toast.error(data.error || "Erro ao resetar senha"); return; }
      toast.success(`Senha de ${resetUser.full_name} resetada`);
      logAction({ action: "RESET_PASSWORD", targetTable: "profiles", targetId: resetUser.id, details: { email: resetUser.email } });
      setResetUser(null);
    } catch { toast.error("Erro inesperado"); } finally { setResetSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    const { ok, data } = await apiCall("delete", "DELETE", { user_id: deleteUser.id });
    if (!ok) { toast.error(data.error || "Erro ao excluir"); return; }
    toast.success(`${deleteUser.full_name} excluído permanentemente`);
    logAction({ action: "DELETE_USER", targetTable: "profiles", targetId: deleteUser.id, details: { email: deleteUser.email } });
    setDeleteUser(null);
    fetchUsers();
  };

  // Filters
  const filtered = users.filter((u) => {
    if (filterStatus === "active" && !u.is_active) return false;
    if (filterStatus === "inactive" && u.is_active) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  const countActive = users.filter((u) => u.is_active).length;
  const countInactive = users.filter((u) => !u.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Gestão de Usuários</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os usuários e permissões desta Loja
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2" disabled={!tenantId}>
          <UserPlus className="h-4 w-4" /> Novo Usuário
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setFilterStatus("all")}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-success/50 transition-colors" onClick={() => setFilterStatus("active")}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <ShieldCheck className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{countActive}</p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-destructive/50 transition-colors" onClick={() => setFilterStatus("inactive")}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <ShieldOff className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{countInactive}</p>
              <p className="text-xs text-muted-foreground">Inativos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Users className="h-4 w-4 text-muted-foreground" />
              Usuários ({filtered.length})
              {filterStatus !== "all" && (
                <Badge variant="outline" className="text-[10px] ml-1 cursor-pointer" onClick={() => setFilterStatus("all")}>
                  {filterStatus === "active" ? "Ativos" : "Inativos"} ✕
                </Badge>
              )}
            </CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou email..." value={search}
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
                <TableHead>Cargo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-16">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    {tenantId ? "Nenhum usuário encontrado." : "Loja não identificada. Contate o administrador."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => (
                  <TableRow key={user.id} className={!user.is_active ? "opacity-60" : ""}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                    <TableCell>
                      {user.role ? (
                        <Badge variant="outline" className="text-xs border-border">
                          {roleLabels[user.role] ?? user.role}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Sem cargo</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "destructive"} className="text-[10px]">
                        {user.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => setDetailUser(user)}>
                            <Eye className="h-4 w-4 mr-2" /> Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/secretaria?edit_email=${encodeURIComponent(user.email)}`)}>
                            <Pencil className="h-4 w-4 mr-2" /> Editar na Secretaria
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setResetUser(user)}>
                            <KeyRound className="h-4 w-4 mr-2" /> Resetar Senha
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toggleActive(user)}>
                            {user.is_active ? (
                              <><ShieldOff className="h-4 w-4 mr-2 text-destructive" /> <span className="text-destructive">Desativar</span></>
                            ) : (
                              <><ShieldCheck className="h-4 w-4 mr-2 text-success" /> <span className="text-success">Ativar</span></>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeleteUser(user)} className="text-destructive focus:text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initialData={formInitial}
        saving={saving}
        onSave={handleSave}
      />

      <UserDetailDialog
        user={detailUser}
        open={!!detailUser}
        onOpenChange={(o) => { if (!o) setDetailUser(null); }}
      />

      <ResetPasswordDialog
        open={!!resetUser}
        onOpenChange={(o) => { if (!o) setResetUser(null); }}
        userName={resetUser?.full_name ?? ""}
        saving={resetSaving}
        onConfirm={handleResetPassword}
      />

      <DeleteUserDialog
        open={!!deleteUser}
        onOpenChange={(o) => { if (!o) setDeleteUser(null); }}
        userName={deleteUser?.full_name ?? ""}
        onConfirm={handleDelete}
      />
    </div>
  );
}
