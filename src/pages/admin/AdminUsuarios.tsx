import { useState, useEffect, useCallback } from "react";
import { useAuth, roleLabels, type AppRole } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  UserPlus,
  Pencil,
  ShieldCheck,
  ShieldOff,
  Search,
  Users,
  Shield,
} from "lucide-react";

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: AppRole | null;
  is_active: boolean;
  created_at: string;
}

const allRoles: AppRole[] = [
  "superadmin",
  "administrador",
  "veneravel",
  "secretario",
  "tesoureiro",
  "orador",
  "chanceler",
  "consulta",
  "portal_irmao",
];

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
  const [formRole, setFormRole] = useState<AppRole>("consulta");
  const [editUserId, setEditUserId] = useState<string | null>(null);

  const apiCall = useCallback(
    async (action: string, method: string, body?: Record<string, unknown>) => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=${action}`;
      const headers: Record<string, string> = {
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      };
      const resp = await fetch(url, {
        method,
        headers,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const data = await resp.json();
      return { ok: resp.ok, data };
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

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openCreate = () => {
    setDialogMode("create");
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("consulta");
    setEditUserId(null);
    setDialogOpen(true);
  };

  const openEdit = (user: UserRow) => {
    setDialogMode("edit");
    setFormName(user.full_name);
    setFormEmail(user.email);
    setFormPassword("");
    setFormRole(user.role ?? "consulta");
    setEditUserId(user.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    try {
      if (dialogMode === "create") {
        if (!formEmail.trim() || !formPassword.trim()) {
          toast.error("Email e senha são obrigatórios");
          setSaving(false);
          return;
        }
        if (formPassword.length < 6) {
          toast.error("Senha deve ter no mínimo 6 caracteres");
          setSaving(false);
          return;
        }
        const { ok, data } = await apiCall("create", "POST", {
          email: formEmail.trim(),
          full_name: formName.trim(),
          password: formPassword,
          role: formRole,
        });
        if (!ok) {
          toast.error(data.error || "Erro ao criar usuário");
          setSaving(false);
          return;
        }
        toast.success("Usuário criado com sucesso");
      } else {
        const { ok, data } = await apiCall("update", "PUT", {
          user_id: editUserId,
          full_name: formName.trim(),
          role: formRole,
        });
        if (!ok) {
          toast.error(data.error || "Erro ao atualizar");
          setSaving(false);
          return;
        }
        toast.success("Usuário atualizado com sucesso");
      }
      setDialogOpen(false);
      fetchUsers();
    } catch {
      toast.error("Erro inesperado");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user: UserRow) => {
    const newStatus = !user.is_active;
    const { ok, data } = await apiCall("update", "PUT", {
      user_id: user.id,
      is_active: newStatus,
    });
    if (!ok) {
      toast.error(data.error || "Erro ao alterar status");
      return;
    }
    toast.success(newStatus ? "Usuário ativado" : "Usuário desativado");
    fetchUsers();
  };

  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadgeVariant = (role: AppRole | null) => {
    if (!role) return "secondary";
    if (role === "superadmin") return "default";
    if (role === "administrador") return "default";
    return "outline";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Usuários da Plataforma</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie todos os usuários cadastrados, perfis e acessos.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <UserPlus className="h-4 w-4" /> Novo Usuário
        </Button>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Users className="h-4 w-4 text-muted-foreground" />
              Usuários ({filtered.length})
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {user.role === "superadmin" && (
                          <Shield className="h-3.5 w-3.5 text-accent" />
                        )}
                        {user.full_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                    <TableCell>
                      {user.role ? (
                        <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                          {roleLabels[user.role] ?? user.role}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem perfil</span>
                      )}
                    </TableCell>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(user)} title={user.is_active ? "Desativar" : "Ativar"}>
                          {user.is_active ? (
                            <ShieldOff className="h-3.5 w-3.5 text-destructive" />
                          ) : (
                            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                          )}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {dialogMode === "create" ? "Novo Usuário" : "Editar Usuário"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome Completo</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: João da Silva"
                maxLength={100}
              />
            </div>
            {dialogMode === "create" && (
              <>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="usuario@email.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Senha</Label>
                  <Input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label>Perfil (Role)</Label>
              <Select value={formRole} onValueChange={(v) => setFormRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      <div className="flex items-center gap-2">
                        {r === "superadmin" && <Shield className="h-3 w-3 text-accent" />}
                        {roleLabels[r]}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : dialogMode === "create" ? "Criar Usuário" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
