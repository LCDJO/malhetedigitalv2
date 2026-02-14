export type AppRole =
  | "administrador"
  | "veneravel"
  | "secretario"
  | "tesoureiro"
  | "orador"
  | "chanceler"
  | "consulta"
  | "portal_irmao"
  | "superadmin";

export type PermissionAction = "read" | "write" | "approve" | "manage_users";

export const roleLabels: Record<AppRole, string> = {
  superadmin: "SuperAdmin",
  administrador: "Administrador",
  veneravel: "Venerável Mestre",
  secretario: "Secretário",
  tesoureiro: "Tesoureiro",
  orador: "Orador",
  chanceler: "Chanceler",
  consulta: "Usuário de Consulta",
  portal_irmao: "Portal do Irmão",
};
