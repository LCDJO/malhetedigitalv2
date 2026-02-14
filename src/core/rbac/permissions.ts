import type { AppRole, PermissionAction } from "@/core/auth/types";

/** Granular permissions matrix: role → module → allowed actions */
export const permissionsMatrix: Record<AppRole, Record<string, PermissionAction[]>> = {
  superadmin: {
    dashboard: ["read", "write", "approve", "manage_users"],
    secretaria: ["read", "write", "approve", "manage_users"],
    tesouraria: ["read", "write", "approve", "manage_users"],
    chancelaria: ["read", "write", "approve", "manage_users"],
    configuracoes: ["read", "write", "approve", "manage_users"],
  },
  administrador: {
    dashboard: ["read", "write", "approve", "manage_users"],
    secretaria: ["read", "write", "approve", "manage_users"],
    tesouraria: ["read", "write", "approve", "manage_users"],
    chancelaria: ["read", "write", "approve", "manage_users"],
    configuracoes: ["read", "write", "approve", "manage_users"],
  },
};

/** Derived module access — roles that have at least one permission on a module */
export const moduleAccess: Record<string, AppRole[]> = Object.keys(
  permissionsMatrix.administrador
).reduce((acc, module) => {
  acc[module] = (Object.keys(permissionsMatrix) as AppRole[]).filter(
    (role) => (permissionsMatrix[role][module]?.length ?? 0) > 0
  );
  return acc;
}, {} as Record<string, AppRole[]>);
