export type AppRole =
  | "administrador"
  | "superadmin";

export type PermissionAction = "read" | "write" | "approve" | "manage_users";

export const roleLabels: Record<AppRole, string> = {
  superadmin: "SuperAdmin",
  administrador: "Administrador",
};
