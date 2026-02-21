/**
 * Permission Matrix View — Visual grid showing entity × action permissions
 * Adapted from Gestão RH PermissionMatrix pattern.
 * Read-only for this project's fixed RBAC model.
 */
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  Check, X, Users, Building2, Wallet, LayoutDashboard, ScrollText, Settings,
  Shield, ShieldCheck, Monitor, Scale, Eye, Pencil, Lock, Megaphone, Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PERMISSION_MATRIX, type PermissionEntity } from "@/domains/security/permissions";
import type { AppRole, TenantRole, PermissionAction } from "@/domains/shared/types";

// ════════════════════════════════════
// LABELS & ICONS
// ════════════════════════════════════

const ENTITY_ICON: Record<string, typeof Users> = {
  dashboard: LayoutDashboard,
  members: Users,
  member_transactions: Wallet,
  lodge_config: Settings,
  plano_contas: ScrollText,
  audit_logs: ScrollText,
  user_roles: Shield,
  termos_uso: Scale,
  politicas_privacidade: Scale,
  incidentes: ShieldCheck,
  totem_codes: Monitor,
  notifications: Bell,
  login_banners: Monitor,
  plans: Building2,
  tenants: Building2,
  advertisers: Megaphone,
  ad_campaigns: Megaphone,
  ad_creatives: Megaphone,
};

const ENTITY_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  members: "Membros",
  member_transactions: "Transações",
  lodge_config: "Configurações da Loja",
  plano_contas: "Plano de Contas",
  audit_logs: "Log de Auditoria",
  user_roles: "Cargos de Usuário",
  termos_uso: "Termos de Uso",
  politicas_privacidade: "Políticas de Privacidade",
  incidentes: "Incidentes",
  totem_codes: "Códigos Totem",
  notifications: "Notificações",
  login_banners: "Banners de Login",
  plans: "Planos",
  tenants: "Lojas (Tenants)",
  advertisers: "Anunciantes",
  ad_campaigns: "Campanhas",
  ad_creatives: "Criativos",
};

const ACTION_ICON: Record<string, typeof Eye> = {
  read: Eye,
  write: Pencil,
  approve: ShieldCheck,
  manage_users: Users,
};

const ACTION_LABELS: Record<PermissionAction, string> = {
  read: "Ler",
  write: "Escrever",
  approve: "Aprovar",
  manage_users: "Gerenciar",
};

const ACTIONS: PermissionAction[] = ["read", "write", "approve", "manage_users"];

// ════════════════════════════════════
// PROPS
// ════════════════════════════════════

interface Props {
  /** Which role perspective to highlight */
  highlightRole?: AppRole | TenantRole | null;
  /** "app" shows appRoles columns, "tenant" shows tenantRoles columns */
  mode: "app" | "tenant";
  /** Filter entities to show (null = all) */
  filterEntities?: PermissionEntity[];
}

// ════════════════════════════════════
// COMPONENT
// ════════════════════════════════════

export function PermissionMatrixView({ highlightRole, mode, filterEntities }: Props) {
  const entities = useMemo(() => {
    const all = Object.keys(PERMISSION_MATRIX) as PermissionEntity[];
    if (filterEntities) return all.filter((e) => filterEntities.includes(e));
    return all;
  }, [filterEntities]);

  const roles = useMemo(() => {
    if (mode === "app") return ["superadmin", "administrador"] as AppRole[];
    return ["owner", "admin", "member"] as TenantRole[];
  }, [mode]);

  const roleLabelsMap: Record<string, string> = {
    superadmin: "SuperAdmin",
    administrador: "Administrador",
    owner: "Venerável",
    admin: "Admin",
    member: "Membro",
  };

  const hasPermission = (entity: PermissionEntity, action: PermissionAction, role: string): boolean => {
    const perm = PERMISSION_MATRIX[entity]?.[action];
    if (!perm) return false;
    if (mode === "app") return perm.appRoles?.includes(role as AppRole) ?? false;
    return perm.tenantRoles?.includes(role as TenantRole) ?? false;
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Matriz de Permissões</h2>
            <Badge variant="outline" className="text-xs font-mono">
              {mode === "app" ? "Plataforma" : "Tenant"}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Somente leitura — permissões fixas do sistema</span>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-muted/60">
                  <th className="text-left py-3 px-4 font-semibold text-foreground border-b-2 border-border min-w-[220px]">
                    Recurso
                  </th>
                  {ACTIONS.map((action) => {
                    const ActionIcon = ACTION_ICON[action];
                    return (
                      <th key={action} colSpan={roles.length} className="text-center py-3 px-1 border-b-2 border-border border-l border-border/40">
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <ActionIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {ACTION_LABELS[action]}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
                {/* Role sub-headers */}
                <tr className="bg-muted/30">
                  <th className="border-b border-border" />
                  {ACTIONS.map((action) =>
                    roles.map((role) => (
                      <th key={`${action}-${role}`} className="text-center py-1.5 px-1 border-b border-border border-l border-border/20 min-w-[70px]">
                        <span className={cn(
                          "text-[9px] font-semibold uppercase tracking-wider",
                          highlightRole === role ? "text-primary" : "text-muted-foreground/60"
                        )}>
                          {roleLabelsMap[role]?.slice(0, 6)}
                        </span>
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {entities.map((entity, ri) => {
                  const EntityIcon = ENTITY_ICON[entity] || Shield;
                  const entityLabel = ENTITY_LABELS[entity] || entity;

                  return (
                    <tr
                      key={entity}
                      className={cn(
                        "transition-colors group hover:bg-accent/10",
                        ri % 2 === 0 ? "bg-background" : "bg-muted/10"
                      )}
                    >
                      <td className="py-2.5 px-4 border-b border-border/40">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground">
                            <EntityIcon className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-medium truncate">{entityLabel}</span>
                        </div>
                      </td>
                      {ACTIONS.map((action) =>
                        roles.map((role) => {
                          const allowed = hasPermission(entity, action, role);
                          return (
                            <td key={`${action}-${role}`} className="text-center py-2.5 px-1 border-b border-border/40 border-l border-border/10">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className={cn(
                                    "inline-flex items-center justify-center h-7 w-7 rounded-md transition-all",
                                    allowed
                                      ? highlightRole === role
                                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                                        : "bg-primary/15 text-primary"
                                      : "bg-transparent text-muted-foreground/20"
                                  )}>
                                    {allowed ? <Check className="h-3.5 w-3.5" /> : <X className="h-3 w-3" />}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  <p className="font-medium">{roleLabelsMap[role]}</p>
                                  <p className="text-muted-foreground">
                                    {allowed ? "Permitido" : "Negado"}: {ACTION_LABELS[action]} em {entityLabel}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </td>
                          );
                        })
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
