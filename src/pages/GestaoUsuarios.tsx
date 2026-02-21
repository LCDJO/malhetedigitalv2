/**
 * Gestão de Usuários — Tabbed page following Gestão RH pattern
 * Tabs: Usuários | Cargos | Permissões
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth, roleLabels, type AppRole } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Users, Shield, Key } from "lucide-react";
import { useAuditLog } from "@/hooks/useAuditLog";
import { UsersTab, type UserRow } from "@/components/iam/UsersTab";
import { RolesOverview } from "@/components/iam/RolesOverview";
import { PermissionMatrixView } from "@/components/iam/PermissionMatrixView";
import { UserFormDialog } from "@/components/gestao-usuarios/UserFormDialog";
import { ResetPasswordDialog } from "@/components/gestao-usuarios/ResetPasswordDialog";
import { DeleteUserDialog } from "@/components/gestao-usuarios/DeleteUserDialog";

export default function GestaoUsuarios() {
  const { session } = useAuth();
  const { logAction } = useAuditLog();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formInitial, setFormInitial] = useState<Partial<UserRow>>({});
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      const headers: Record<string, string> = {
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      };
      if (body) headers["Content-Type"] = "application/json";
      const resp = await fetch(url, {
        method, headers, ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const text = await resp.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { error: text }; }
      return { ok: resp.ok, data };
    },
    [session?.access_token, tenantId]
  );

  const fetchUsers = useCallback(async () => {
    if (!session?.access_token || !tenantId) return;
    setLoading(true);
    const { ok, data } = await apiCall("list", "GET");
    if (ok) setUsers(data.filter((u: UserRow) => !!u.role));
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

  const promoteToAdmin = async (user: UserRow) => {
    const { ok, data } = await apiCall("update", "PUT", { user_id: user.id, role: "administrador" });
    if (!ok) { toast.error(data.error || "Erro ao promover"); return; }
    toast.success(`${user.full_name} agora é Administrador`);
    logAction({ action: "PROMOTE_ADMIN", targetTable: "user_roles", targetId: user.id, details: { email: user.email } });
    fetchUsers();
  };

  const toggleActive = async (user: UserRow) => {
    const { ok, data } = await apiCall("update", "PUT", { user_id: user.id, is_active: !user.is_active });
    if (!ok) { toast.error(data.error || "Erro"); return; }
    toast.success(user.is_active ? "Usuário desativado" : "Usuário ativado");
    logAction({ action: user.is_active ? "DEACTIVATE_USER" : "ACTIVATE_USER", targetTable: "profiles", targetId: user.id });
    fetchUsers();
  };

  const handleResetPassword = async (newPassword: string) => {
    if (!resetUser) return;
    setResetSaving(true);
    try {
      const { ok, data } = await apiCall("reset_password", "PUT", { user_id: resetUser.id, new_password: newPassword });
      if (!ok) { toast.error(data.error || "Erro ao resetar senha"); setResetSaving(false); return; }
      toast.success(`Senha de ${resetUser.full_name} resetada`);
      logAction({ action: "RESET_PASSWORD", targetTable: "profiles", targetId: resetUser.id });
      setResetUser(null);
    } catch { toast.error("Erro inesperado"); } finally { setResetSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    try {
      const resp = await apiCall("update", "PUT", { user_id: deleteUser.id, role: null });
      if (!resp.ok) { toast.error(resp.data?.error || "Erro ao remover permissão"); return; }
      toast.success(`Permissão removida de ${deleteUser.full_name}`);
      logAction({ action: "REMOVE_ADMIN", targetTable: "user_roles", targetId: deleteUser.id });
      fetchUsers();
    } catch (err: unknown) {
      toast.error("Erro ao remover");
    } finally { setDeleteUser(null); }
  };

  const adminCount = users.filter((u) => u.role === "administrador").length;

  // Tenant-specific entities for permission matrix
  const tenantEntities = [
    "dashboard", "members", "member_transactions", "lodge_config",
    "plano_contas", "audit_logs", "user_roles", "totem_codes", "notifications",
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuários & Permissões</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie membros, cargos e controle de acesso da Loja.
          </p>
        </div>
      </div>

      {/* Tabs following RH pattern */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-4 w-4" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-1.5">
            <Shield className="h-4 w-4" /> Cargos
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-1.5">
            <Key className="h-4 w-4" /> Permissões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTab
            users={users}
            loading={loading}
            search={search}
            onSearchChange={setSearch}
            isAdmin={true}
            onOpenCreate={openCreate}
            onResetPassword={(u) => setResetUser(u)}
            onPromoteAdmin={promoteToAdmin}
            onToggleActive={toggleActive}
            onRemovePermission={(u) => setDeleteUser(u)}
            adminCount={adminCount}
          />
        </TabsContent>

        <TabsContent value="roles">
          <RolesOverview mode="tenant" />
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionMatrixView mode="tenant" filterEntities={[...tenantEntities]} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initialData={formInitial}
        saving={saving}
        onSave={handleSave}
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
