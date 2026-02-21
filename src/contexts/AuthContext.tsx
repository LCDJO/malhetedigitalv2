// Re-export from new domain locations for backward compatibility
export { AuthProvider, useAuth } from "@/core/auth";
export { roleLabels } from "@/domains/shared/types";
export type { AppRole, PermissionAction } from "@/domains/shared/types";
export { permissionsMatrix, moduleAccess } from "@/domains/security/permissions";
