import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal } from "lucide-react";

interface WalletEntry {
  user_id: string;
  xp_total: number;
  level: number;
  profiles?: { full_name: string; avatar_url: string | null };
}

export default function GamifyRanking() {
  const { tenant } = useTenant();
  const [entries, setEntries] = useState<WalletEntry[]>([]);

  useEffect(() => {
    if (!tenant) return;
    supabase
      .from("wallets")
      .select("user_id, xp_total, level, profiles:user_id(full_name, avatar_url)")
      .eq("tenant_id", tenant.id)
      .order("xp_total", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setEntries((data as unknown as WalletEntry[]) || []);
      });
  }, [tenant]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-serif font-bold">Ranking</h1>
        <p className="text-sm text-muted-foreground mt-1">Top jogadores por XP</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4 text-accent" /> Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 && <p className="text-muted-foreground text-center py-8">Nenhum dado de ranking ainda.</p>}
          <div className="space-y-2">
            {entries.map((entry, i) => {
              const name = (entry.profiles as any)?.full_name ?? "Usuário";
              return (
                <div key={entry.user_id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <span className="text-lg font-bold text-muted-foreground w-8 text-center">
                    {i < 3 ? <Medal className={`h-5 w-5 mx-auto ${i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : "text-amber-700"}`} /> : `${i + 1}º`}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{name}</p>
                    <p className="text-xs text-muted-foreground">Nível {entry.level}</p>
                  </div>
                  <span className="font-bold text-sm">{entry.xp_total.toLocaleString()} XP</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
