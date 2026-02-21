import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminStats } from "@/services/admin";
import { Building2, Users, CreditCard, Activity, MessageSquare, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Stats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalMembers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalTenants: 0, activeTenants: 0, totalUsers: 0, totalMembers: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

      {/* Chat ao Vivo — Acesso rápido */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Chat ao Vivo</p>
              <p className="text-xs text-muted-foreground">Gerencie chamados e atendimento das lojas</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/atendimento")} className="gap-2">
            Acessar <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
