// Re-export from new location for backward compatibility
export { AuthProvider, useAuth } from "@/core/auth";
export { roleLabels } from "@/core/auth/types";
export type { AppRole, PermissionAction } from "@/core/auth/types";
export { permissionsMatrix, moduleAccess } from "@/core/rbac/permissions";
