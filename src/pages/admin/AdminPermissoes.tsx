/**
 * Admin Permissões — Platform-level roles & permission matrix
 * Follows Gestão RH PlatformSecurityRoles + PlatformSecurityPermissions pattern.
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Key } from "lucide-react";
import { RolesOverview } from "@/components/iam/RolesOverview";
import { PermissionMatrixView } from "@/components/iam/PermissionMatrixView";

export default function AdminPermissoes() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cargos & Permissões</h1>
          <p className="text-sm text-muted-foreground">
            Visualize a matriz de acesso e os cargos da plataforma.
          </p>
        </div>
      </div>

      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList>
          <TabsTrigger value="matrix" className="gap-1.5">
            <Key className="h-4 w-4" /> Matriz de Permissões
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-1.5">
            <Shield className="h-4 w-4" /> Cargos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matrix">
          <PermissionMatrixView mode="app" />
        </TabsContent>

        <TabsContent value="roles">
          <RolesOverview mode="app" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
