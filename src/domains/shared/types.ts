/**
 * Shared Types — Single source of truth for domain types.
 * Adapted from Gestão RH pattern.
 */

export type AppRole = "superadmin" | "administrador";
export type TenantRole = "owner" | "admin" | "member";

export type PermissionAction = "read" | "write" | "approve" | "manage_users";

export const roleLabels: Record<AppRole, string> = {
  superadmin: "SuperAdmin",
  administrador: "Administrador",
};

export const tenantRoleLabels: Record<TenantRole, string> = {
  owner: "Venerável",
  admin: "Administrador",
  member: "Membro",
};
