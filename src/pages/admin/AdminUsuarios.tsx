import { useState, useEffect, useCallback } from "react";
import { useAuth, roleLabels, type AppRole } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  UserPlus, Pencil, ShieldCheck, ShieldOff, Search, Users, Shield, Trash2,
} from "lucide-react";
import { ConfirmSensitiveAction } from "@/components/ConfirmSensitiveAction";

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: AppRole | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminUsuarios() {
  const { session } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);

  const apiCall = useCallback(
    async (action: string, method: string, body?: Record<string, unknown>) => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=${action}`;
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
    const { ok, data } = await apiCall("list", "GET");
    if (ok) setUsers(data);
    else toast.error(data.error || "Erro ao carregar usuários");
    setLoading(false);
  }, [session?.access_token, apiCall]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = () => {
    setDialogMode("create");
    setFormName(""); setFormEmail(""); setFormPassword("");
    setEditUserId(null);
    setDialogOpen(true);
  };

  const openEdit = (user: UserRow) => {
    setDialogMode("edit");
    setFormName(user.full_name); setFormEmail(user.email);
    setFormPassword("");
    setEditUserId(user.id); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    try {
      if (dialogMode === "create") {
        if (!formEmail.trim() || !formPassword.trim()) {
          toast.error("Email e senha são obrigatórios"); setSaving(false); return;
        }
        if (formPassword.length < 6) {
          toast.error("Senha deve ter no mínimo 6 caracteres"); setSaving(false); return;
        }
        const { ok, data } = await apiCall("create", "POST", {
          email: formEmail.trim(), full_name: formName.trim(),
          password: formPassword, role: "superadmin",
        });
        if (!ok) { toast.error(data.error || "Erro ao criar"); setSaving(false); return; }
        toast.success("SuperAdmin criado com sucesso");
      } else {
        const { ok, data } = await apiCall("update", "PUT", {
          user_id: editUserId, full_name: formName.trim(), role: "superadmin",
        });
        if (!ok) { toast.error(data.error || "Erro ao atualizar"); setSaving(false); return; }
        toast.success("Usuário atualizado");
      }
      setDialogOpen(false); fetchUsers();
    } catch { toast.error("Erro inesperado"); } finally { setSaving(false); }
  };

  const toggleActive = async (user: UserRow) => {
    const { ok, data } = await apiCall("update", "PUT", { user_id: user.id, is_active: !user.is_active });
    if (!ok) { toast.error(data.error || "Erro"); return; }
    toast.success(user.is_active ? "Usuário desativado" : "Usuário ativado");
    fetchUsers();
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    const { ok, data } = await apiCall("delete", "DELETE", { user_id: deleteUser.id });
    if (!ok) { toast.error(data.error || "Erro ao excluir"); return; }
    toast.success("Usuário excluído com sucesso");
    setDeleteUser(null);
    fetchUsers();
  };

  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Usuários SuperAdmin</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os administradores da plataforma.
          </p>
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
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
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
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(user)}
                          title={user.is_active ? "Desativar" : "Ativar"}>
                          {user.is_active ? <ShieldOff className="h-3.5 w-3.5 text-destructive" /> : <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteUser(user)}
                          title="Excluir">
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {dialogMode === "create" ? "Novo SuperAdmin" : "Editar SuperAdmin"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome Completo</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: João da Silva" maxLength={100} />
            </div>
            {dialogMode === "create" && (
              <>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)} placeholder="usuario@email.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Senha</Label>
                  <Input type="password" value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
                </div>
              </>
            )}
            <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border border-border/60">
              <Shield className="h-4 w-4 text-accent" />
              <span className="text-sm text-muted-foreground">
                Este usuário será criado com perfil <strong className="text-foreground">SuperAdmin</strong>.
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : dialogMode === "create" ? "Criar SuperAdmin" : "Salvar"}
            </Button>
          </DialogFooter>
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
