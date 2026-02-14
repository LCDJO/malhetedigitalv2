import { TwoFactorSettings } from "@/components/TwoFactorSettings";

export default function AdminConfigSuperAdmin() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Configurações SuperAdmin</h1>
        <p className="text-sm text-muted-foreground mt-1">Segurança e autenticação do painel.</p>
      </div>

      <TwoFactorSettings />
    </div>
  );
}
