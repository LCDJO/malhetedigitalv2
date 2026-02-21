/**
 * Roles Overview — Card grid showing available roles with descriptions
 * Adapted from Gestão RH RolesTab pattern.
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Crown, Users, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleCard {
  name: string;
  label: string;
  description: string;
  icon: typeof Shield;
  permissions: string[];
  isSystem: boolean;
  color: string;
}

const TENANT_ROLES: RoleCard[] = [
  {
    name: "owner",
    label: "Venerável",
    description: "Proprietário da Loja. Acesso total a todos os módulos, configurações e gestão de usuários.",
    icon: Crown,
    permissions: ["Leitura", "Escrita", "Aprovação", "Gestão de Usuários"],
    isSystem: true,
    color: "text-amber-600",
  },
  {
    name: "admin",
    label: "Administrador",
    description: "Administrador da Loja. Gerencia operações, membros e finanças.",
    icon: Shield,
    permissions: ["Leitura", "Escrita", "Aprovação", "Gestão de Usuários"],
    isSystem: true,
    color: "text-primary",
  },
  {
    name: "member",
    label: "Membro",
    description: "Membro regular da Loja. Acesso de leitura a dados e informações relevantes.",
    icon: Users,
    permissions: ["Leitura"],
    isSystem: true,
    color: "text-muted-foreground",
  },
];

const APP_ROLES: RoleCard[] = [
  {
    name: "superadmin",
    label: "SuperAdmin",
    description: "Administrador da plataforma SaaS. Gerencia todas as Lojas, planos e configurações globais.",
    icon: Crown,
    permissions: ["Acesso Total", "Todas as Lojas", "Configurações Globais"],
    isSystem: true,
    color: "text-amber-600",
  },
  {
    name: "administrador",
    label: "Administrador",
    description: "Administrador vinculado a uma Loja. Gerencia operações e membros do tenant.",
    icon: Shield,
    permissions: ["Gestão de Loja", "Membros", "Finanças", "Configurações"],
    isSystem: true,
    color: "text-primary",
  },
];

interface Props {
  mode: "app" | "tenant";
}

export function RolesOverview({ mode }: Props) {
  const roles = mode === "app" ? APP_ROLES : TENANT_ROLES;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Cargos do Sistema</h2>
        <div className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Cargos fixos — não editáveis</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.name} className="relative overflow-hidden">
            <div className={cn("absolute top-0 left-0 w-1 h-full", role.color === "text-amber-600" ? "bg-amber-500" : role.color === "text-primary" ? "bg-primary" : "bg-muted-foreground/30")} />
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <role.icon className={cn("h-4 w-4", role.color)} />
                  <CardTitle className="text-base">{role.label}</CardTitle>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  <Lock className="h-2.5 w-2.5 mr-0.5" /> Sistema
                </Badge>
              </div>
              <CardDescription className="text-xs leading-relaxed">{role.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-1">
                {role.permissions.map((perm) => (
                  <Badge key={perm} variant="outline" className="text-[10px] font-normal">
                    {perm}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
