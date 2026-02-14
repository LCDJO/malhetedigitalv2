import { EmailIntegrations } from "@/components/admin/integracoes/EmailIntegrations";

export default function AdminIntegracoes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Email</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie os provedores de email transacional da plataforma.
        </p>
      </div>

      <EmailIntegrations />
    </div>
  );
}
