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
  veneravel: {
    dashboard: ["read"],
    secretaria: ["read"],
    tesouraria: ["read"],
    chancelaria: ["read"],
    configuracoes: ["read"],
  },
  secretario: {
    dashboard: ["read"],
    secretaria: ["read", "write"],
    tesouraria: [],
    chancelaria: [],
    configuracoes: [],
  },
  tesoureiro: {
    dashboard: ["read"],
    secretaria: ["read"],
    tesouraria: ["read", "write", "approve", "manage_users"],
    chancelaria: [],
    configuracoes: [],
  },
  orador: {
    dashboard: ["read"],
    secretaria: [],
    tesouraria: [],
    chancelaria: [],
    configuracoes: [],
  },
  chanceler: {
    dashboard: ["read"],
    secretaria: [],
    tesouraria: [],
    chancelaria: ["read", "write"],
    configuracoes: [],
  },
  consulta: {
    dashboard: ["read"],
    secretaria: [],
    tesouraria: [],
    chancelaria: [],
    configuracoes: [],
  },
  portal_irmao: {
    dashboard: [],
    secretaria: [],
    tesouraria: [],
    chancelaria: [],
    configuracoes: [],
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
