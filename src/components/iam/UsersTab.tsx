/**
 * IAM Users Tab — List users, manage roles, reset passwords
 * Adapted from Gestão RH UsersTab pattern for Malhete Digital's fixed RBAC.
 */
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search, Users, ShieldCheck, ShieldOff, KeyRound, Crown, Trash2, Loader2, UserPlus,
} from "lucide-react";
import { roleLabels, type AppRole } from "@/domains/shared/types";
import { tenantRoleLabels, type TenantRole } from "@/domains/shared/types";

// ════════════════════════════════════
// TYPES
// ════════════════════════════════════

export interface UserRow {
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

interface Props {
  users: UserRow[];
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  isAdmin: boolean;
  onOpenCreate: () => void;
  onResetPassword: (user: UserRow) => void;
  onPromoteAdmin: (user: UserRow) => void;
  onToggleActive: (user: UserRow) => void;
  onRemovePermission: (user: UserRow) => void;
  adminCount: number;
}

// ════════════════════════════════════
// COMPONENT
// ════════════════════════════════════

export function UsersTab({
  users, loading, search, onSearchChange, isAdmin,
  onOpenCreate, onResetPassword, onPromoteAdmin, onToggleActive,
  onRemovePermission, adminCount,
}: Props) {
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (filterStatus === "active" && !u.is_active) return false;
      if (filterStatus === "inactive" && u.is_active) return false;
      if (search) {
        const q = search.toLowerCase();
        return u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      }
      return true;
    });
  }, [users, filterStatus, search]);

  const countActive = users.filter((u) => u.is_active).length;
  const countInactive = users.filter((u) => !u.is_active).length;

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setFilterStatus("all")}
          className={`flex items-center gap-3 p-4 rounded-xl border transition-colors text-left ${
            filterStatus === "all" ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"
          }`}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xl font-bold">{users.length}</p>
            <p className="text-[11px] text-muted-foreground">Total</p>
          </div>
        </button>
        <button
          onClick={() => setFilterStatus("active")}
          className={`flex items-center gap-3 p-4 rounded-xl border transition-colors text-left ${
            filterStatus === "active" ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"
          }`}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xl font-bold">{countActive}</p>
            <p className="text-[11px] text-muted-foreground">Ativos</p>
          </div>
        </button>
        <button
          onClick={() => setFilterStatus("inactive")}
          className={`flex items-center gap-3 p-4 rounded-xl border transition-colors text-left ${
            filterStatus === "inactive" ? "border-destructive/50 bg-destructive/5" : "border-border hover:border-destructive/30"
          }`}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
            <ShieldOff className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <p className="text-xl font-bold">{countInactive}</p>
            <p className="text-[11px] text-muted-foreground">Inativos</p>
          </div>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">Usuários</h2>
          <Badge variant="outline" className="text-xs font-mono">
            {filtered.length}
          </Badge>
          {filterStatus !== "all" && (
            <Badge
              variant="secondary"
              className="text-[10px] cursor-pointer"
              onClick={() => setFilterStatus("all")}
            >
              {filterStatus === "active" ? "Ativos" : "Inativos"} ✕
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          {isAdmin && (
            <Button size="sm" onClick={onOpenCreate} className="gap-1.5">
              <UserPlus className="h-4 w-4" /> Novo Usuário
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Admin</TableHead>
              {isAdmin && <TableHead className="text-right w-48">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  Nenhum usuário encontrado.
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
                  <TableCell>
                    {user.role === "administrador" ? (
                      <Badge variant="outline" className="text-[10px] border-primary/50 text-primary">
                        <Crown className="h-3 w-3 mr-1" /> Admin
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <TooltipProvider delayDuration={300}>
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onResetPassword(user)}>
                                <KeyRound className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Resetar Senha</TooltipContent>
                          </Tooltip>
                          {user.role !== "administrador" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onPromoteAdmin(user)}>
                                  <Crown className="h-4 w-4 text-amber-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Tornar Administrador</TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onToggleActive(user)}>
                                {user.is_active ? (
                                  <ShieldOff className="h-4 w-4 text-destructive" />
                                ) : (
                                  <ShieldCheck className="h-4 w-4 text-primary" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{user.is_active ? "Desativar" : "Ativar"}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                disabled={user.role === "administrador" && adminCount <= 1}
                                onClick={() => onRemovePermission(user)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {user.role === "administrador" && adminCount <= 1
                                ? "Último administrador"
                                : "Remover permissão"}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
