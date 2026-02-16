import { useEffect, useState } from "react";
import { getAdminStats } from "@/services/admin";
import { Building2, Users, CreditCard, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Stats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalMembers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalTenants: 0, activeTenants: 0, totalUsers: 0, totalMembers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch {
        // silently fail
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  const cards = [
    { label: "Total de Lojas", value: stats.totalTenants, icon: Building2, color: "text-accent" },
    { label: "Lojas Ativas", value: stats.activeTenants, icon: Activity, color: "text-success" },
    { label: "Usuários", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { label: "Irmãos Cadastrados", value: stats.totalMembers, icon: CreditCard, color: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Painel SuperAdmin</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral de todas as Lojas da plataforma.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{c.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
