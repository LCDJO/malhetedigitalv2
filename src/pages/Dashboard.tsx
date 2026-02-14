import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, Wallet, Users, Zap } from "lucide-react";

export default function GamifyDashboard() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const [stats, setStats] = useState({ members: 0, plans: 0, xpTotal: 0, balance: 0 });

  useEffect(() => {
    if (!tenant || !user) return;
    const tid = tenant.id;

    Promise.all([
      supabase.from("tenant_users").select("id", { count: "exact", head: true }).eq("tenant_id", tid),
      supabase.from("plans").select("id", { count: "exact", head: true }).eq("tenant_id", tid),
      supabase.from("wallets").select("xp_total, balance").eq("tenant_id", tid).eq("user_id", user.id).maybeSingle(),
    ]).then(([membersRes, plansRes, walletRes]) => {
      setStats({
        members: membersRes.count ?? 0,
        plans: plansRes.count ?? 0,
        xpTotal: walletRes.data?.xp_total ?? 0,
        balance: walletRes.data?.balance ?? 0,
      });
    });
  }, [tenant, user]);

  if (!tenant) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <p className="text-muted-foreground">Selecione um tenant para começar.</p>
      </div>
    );
  }

  const cards = [
    { title: "Membros", value: stats.members, icon: Users, color: "text-primary" },
    { title: "Planos", value: stats.plans, icon: Zap, color: "text-accent" },
    { title: "Seu XP", value: stats.xpTotal.toLocaleString(), icon: Trophy, color: "text-warning" },
    { title: "Saldo", value: `R$ ${Number(stats.balance).toFixed(2)}`, icon: Wallet, color: "text-success" },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-serif font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">{tenant.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
