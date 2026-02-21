/**
 * Security Middleware - Permission Matrix
 *
 * Centralized permission definitions mapping:
 *   Action × Entity → Required Roles
 *
 * This is the SINGLE SOURCE OF TRUTH for authorization.
 * Both frontend guards and backend RLS mirror these rules.
 *
 * Adapted from Gestão RH pattern for Malhete Digital.
 */

import type { AppRole, TenantRole, PermissionAction } from "@/domains/shared/types";

// ========================
// PERMISSION ENTITIES
// ========================

export type PermissionEntity =
  | "dashboard"
  | "members"
  | "member_transactions"
  | "lodge_config"
  | "plano_contas"
  | "audit_logs"
  | "user_roles"
  | "termos_uso"
  | "politicas_privacidade"
  | "incidentes"
  | "totem_codes"
  | "notifications"
  | "login_banners"
  | "plans"
  | "tenants"
  | "advertisers"
  | "ad_campaigns"
  | "ad_creatives"
  | "support_tickets";

// ========================
// ROLE SETS
// ========================

/** Tenant admins who manage the lodge */
const TENANT_ADMINS: TenantRole[] = ["owner", "admin"];

/** All members including viewers */
const ALL_MEMBERS: TenantRole[] = ["owner", "admin", "member"];

// ========================
// PERMISSION MATRIX
// ========================

type PermissionMatrix = Record<
  PermissionEntity,
  Record<PermissionAction, { appRoles?: AppRole[]; tenantRoles?: TenantRole[] }>
>;

export const PERMISSION_MATRIX: PermissionMatrix = {
  dashboard: {
    read: { appRoles: ["superadmin", "administrador"], tenantRoles: ALL_MEMBERS },
    write: { appRoles: ["superadmin", "administrador"], tenantRoles: TENANT_ADMINS },
    approve: { appRoles: ["superadmin", "administrador"], tenantRoles: TENANT_ADMINS },
    manage_users: { appRoles: ["superadmin", "administrador"], tenantRoles: TENANT_ADMINS },
  },
  members: {
    read: { appRoles: ["superadmin", "administrador"], tenantRoles: ALL_MEMBERS },
    write: { appRoles: ["superadmin", "administrador"], tenantRoles: TENANT_ADMINS },
    approve: { appRoles: ["superadmin", "administrador"], tenantRoles: TENANT_ADMINS },
    manage_users: { appRoles: ["superadmin", "administrador"], tenantRoles: TENANT_ADMINS },
  },
  member_transactions: {
    read: { appRoles: ["superadmin", "administrador"], tenantRoles: ALL_MEMBERS },
    write: { appRoles: ["superadmin", "administrador"], tenantRoles: TENANT_ADMINS },
    approve: { appRoles: ["superadmin", "administrador"], tenantRoles: TENANT_ADMINS },
    manage_users: { appRoles: ["superadmin", "administrador"], tenantRoles: TENANT_ADMINS },
  },
  lodge_config: {
    read: { appRoles: ["superadmin", "administrador"], tenantRoles: ALL_MEMBERS },
    write: { appRoles: ["superadmin", "administrador"], tenantRoles: TENANT_ADMINS },
    approve: { appRoles: ["superadmin", "administrador"], tenantRoles: TENANT_ADMINS },
    manage_users: { appRoles: ["superadmin", "administrador"], tenantRoles: TENANT_ADMINS },
  },
  plano_contas: {
    read: { appRoles: ["superadmin", "administrador"], tenantRoles: ALL_MEMBERS },
    write: { appRoles: ["superadmin", "administrador"], tenantRoles: TENANT_ADMINS },
    approve: { appRoles: ["superadmin", "administrador"], tenantRoles: TENANT_ADMINS },
    manage_users: { appRoles: ["superadmin", "administrador"], tenantRoles: TENANT_ADMINS },
  },
  audit_logs: {
    read: { appRoles: ["superadmin", "administrador"], tenantRoles: TENANT_ADMINS },
    write: { appRoles: [] },
    approve: { appRoles: [] },
    manage_users: { appRoles: [] },
  },
  user_roles: {
    read: { appRoles: ["superadmin", "administrador"], tenantRoles: ALL_MEMBERS },
    write: { appRoles: ["superadmin", "administrador"], tenantRoles: TENANT_ADMINS },
    approve: { appRoles: ["superadmin", "administrador"], tenantRoles: TENANT_ADMINS },
    manage_users: { appRoles: ["superadmin", "administrador"], tenantRoles: TENANT_ADMINS },
  },
  termos_uso: {
    read: { appRoles: ["superadmin", "administrador"], tenantRoles: ALL_MEMBERS },
    write: { appRoles: ["superadmin"], tenantRoles: TENANT_ADMINS },
    approve: { appRoles: ["superadmin"] },
    manage_users: { appRoles: [] },
  },
  politicas_privacidade: {
    read: { appRoles: ["superadmin", "administrador"], tenantRoles: ALL_MEMBERS },
    write: { appRoles: ["superadmin"], tenantRoles: TENANT_ADMINS },
    approve: { appRoles: ["superadmin"] },
    manage_users: { appRoles: [] },
  },
  incidentes: {
    read: { appRoles: ["superadmin", "administrador"] },
    write: { appRoles: ["superadmin", "administrador"] },
    approve: { appRoles: ["superadmin"] },
    manage_users: { appRoles: [] },
  },
  totem_codes: {
    read: { appRoles: ["superadmin", "administrador"], tenantRoles: TENANT_ADMINS },
    write: { appRoles: ["superadmin", "administrador"], tenantRoles: TENANT_ADMINS },
    approve: { appRoles: ["superadmin", "administrador"], tenantRoles: TENANT_ADMINS },
    manage_users: { appRoles: [] },
  },
  notifications: {
    read: { appRoles: ["superadmin", "administrador"], tenantRoles: ALL_MEMBERS },
    write: { appRoles: ["superadmin", "administrador"], tenantRoles: TENANT_ADMINS },
    approve: { appRoles: [] },
    manage_users: { appRoles: [] },
  },
  login_banners: {
    read: { appRoles: ["superadmin", "administrador"], tenantRoles: ALL_MEMBERS },
    write: { appRoles: ["superadmin"], tenantRoles: TENANT_ADMINS },
    approve: { appRoles: ["superadmin"] },
    manage_users: { appRoles: [] },
  },
  plans: {
    read: { appRoles: ["superadmin", "administrador"], tenantRoles: ALL_MEMBERS },
    write: { appRoles: ["superadmin"] },
    approve: { appRoles: ["superadmin"] },
    manage_users: { appRoles: [] },
  },
  tenants: {
    read: { appRoles: ["superadmin", "administrador"], tenantRoles: ALL_MEMBERS },
    write: { appRoles: ["superadmin"], tenantRoles: ["owner"] },
    approve: { appRoles: ["superadmin"] },
    manage_users: { appRoles: ["superadmin"] },
  },
  advertisers: {
    read: { appRoles: ["superadmin"] },
    write: { appRoles: ["superadmin"] },
    approve: { appRoles: ["superadmin"] },
    manage_users: { appRoles: [] },
  },
  ad_campaigns: {
    read: { appRoles: ["superadmin"] },
    write: { appRoles: ["superadmin"] },
    approve: { appRoles: ["superadmin"] },
    manage_users: { appRoles: [] },
  },
  ad_creatives: {
    read: { appRoles: ["superadmin"] },
    write: { appRoles: ["superadmin"] },
    approve: { appRoles: ["superadmin"] },
    manage_users: { appRoles: [] },
  },
  support_tickets: {
    read: { appRoles: ["superadmin", "administrador"], tenantRoles: ALL_MEMBERS },
    write: { appRoles: ["superadmin", "administrador"], tenantRoles: ALL_MEMBERS },
    approve: { appRoles: ["superadmin", "administrador"], tenantRoles: TENANT_ADMINS },
    manage_users: { appRoles: ["superadmin"] },
  },
};

// ========================
// NAV ACCESS
// ========================

export type NavKey =
  | "dashboard"
  | "secretaria"
  | "tesouraria"
  | "chancelaria"
  | "configuracoes"
  | "totem"
  | "relatorios"
  | "gestao_usuarios"
  | "log_auditoria"
  | "gestao_termos"
  | "controle_aceites"
  | "financeiro_geral"
  | "atendimento";

const NAV_ENTITY_MAP: Record<NavKey, PermissionEntity> = {
  dashboard: "dashboard",
  secretaria: "members",
  tesouraria: "member_transactions",
  chancelaria: "lodge_config",
  configuracoes: "lodge_config",
  totem: "totem_codes",
  relatorios: "dashboard",
  gestao_usuarios: "user_roles",
  log_auditoria: "audit_logs",
  gestao_termos: "termos_uso",
  controle_aceites: "termos_uso",
  financeiro_geral: "member_transactions",
  atendimento: "support_tickets",
};

/**
 * Check if a set of roles can access a nav item.
 * Nav access = 'read' permission on the mapped entity.
 */
export function canAccessNavItem(
  navKey: NavKey,
  appRole: AppRole | null,
  tenantRole?: TenantRole | null
): boolean {
  const entity = NAV_ENTITY_MAP[navKey];
  if (!entity) return true;
  const perm = PERMISSION_MATRIX[entity].read;

  if (appRole && perm.appRoles?.includes(appRole)) return true;
  if (tenantRole && perm.tenantRoles?.includes(tenantRole)) return true;

  return false;
}

/**
 * Check if a role can perform an action on an entity.
 */
export function hasPermission(
  entity: PermissionEntity,
  action: PermissionAction,
  appRole: AppRole | null,
  tenantRole?: TenantRole | null
): boolean {
  const perm = PERMISSION_MATRIX[entity]?.[action];
  if (!perm) return false;

  if (appRole && perm.appRoles?.includes(appRole)) return true;
  if (tenantRole && perm.tenantRoles?.includes(tenantRole)) return true;

  return false;
}

// ========================
// LEGACY COMPAT (for old permissionsMatrix)
// ========================

/** Legacy permissions matrix for backward compatibility */
export const permissionsMatrix: Record<AppRole, Record<string, PermissionAction[]>> = {
  superadmin: {
    dashboard: ["read", "write", "approve", "manage_users"],
    secretaria: ["read", "write", "approve", "manage_users"],
    tesouraria: ["read", "write", "approve", "manage_users"],
    chancelaria: ["read", "write", "approve", "manage_users"],
    configuracoes: ["read", "write", "approve", "manage_users"],
    totem: ["read", "write", "approve", "manage_users"],
  },
  administrador: {
    dashboard: ["read", "write", "approve", "manage_users"],
    secretaria: ["read", "write", "approve", "manage_users"],
    tesouraria: ["read", "write", "approve", "manage_users"],
    chancelaria: ["read", "write", "approve", "manage_users"],
    configuracoes: ["read", "write", "approve", "manage_users"],
    totem: ["read", "write", "approve", "manage_users"],
  },
};

/** Legacy module access */
export const moduleAccess: Record<string, AppRole[]> = Object.keys(
  permissionsMatrix.administrador
).reduce(
  (acc, module) => {
    acc[module] = (Object.keys(permissionsMatrix) as AppRole[]).filter(
      (role) => (permissionsMatrix[role][module]?.length ?? 0) > 0
    );
    return acc;
  },
  {} as Record<string, AppRole[]>
);
