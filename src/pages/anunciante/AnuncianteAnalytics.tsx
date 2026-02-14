import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdvertiser } from "@/components/anunciante/AnuncianteLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, MousePointerClick, TrendingUp, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface DailyMetric {
  date: string;
  impressions: number;
  clicks: number;
}

export default function AnuncianteAnalytics() {
  const advertiser = useAdvertiser();
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<DailyMetric[]>([]);
  const [campaignStats, setCampaignStats] = useState<any[]>([]);
  const [totals, setTotals] = useState({ impressions: 0, clicks: 0 });

  useEffect(() => {
    const fetchAnalytics = async () => {
      // Fetch impressions
      const { data: impressions } = await supabase
        .from("ad_impressions")
        .select("created_at")
        .eq("advertiser_id", advertiser.id);

      const { data: clicks } = await supabase
        .from("ad_clicks")
        .select("created_at")
        .eq("advertiser_id", advertiser.id);

      const impCount = impressions?.length ?? 0;
      const clickCount = clicks?.length ?? 0;
      setTotals({ impressions: impCount, clicks: clickCount });

      // Group by day
      const dayMap = new Map<string, { impressions: number; clicks: number }>();

      impressions?.forEach((i) => {
        const day = i.created_at.slice(0, 10);
        const existing = dayMap.get(day) || { impressions: 0, clicks: 0 };
        existing.impressions++;
        dayMap.set(day, existing);
      });

      clicks?.forEach((c) => {
        const day = c.created_at.slice(0, 10);
        const existing = dayMap.get(day) || { impressions: 0, clicks: 0 };
        existing.clicks++;
        dayMap.set(day, existing);
      });

      const sorted = Array.from(dayMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30);

      setDailyData(sorted);

      // Per-campaign stats
      const { data: campaignsData } = await supabase
        .from("ad_campaigns")
        .select("id, name")
        .eq("advertiser_id", advertiser.id);

      if (campaignsData) {
        const stats = await Promise.all(
          campaignsData.map(async (c) => {
            const [impRes, clickRes] = await Promise.all([
              supabase.from("ad_impressions").select("id", { count: "exact", head: true }).eq("campaign_id", c.id),
              supabase.from("ad_clicks").select("id", { count: "exact", head: true }).eq("campaign_id", c.id),
            ]);
            const imp = impRes.count ?? 0;
            const clk = clickRes.count ?? 0;
            return {
              name: c.name,
              impressions: imp,
              clicks: clk,
              ctr: imp > 0 ? ((clk / imp) * 100).toFixed(2) : "0.00",
            };
          })
        );
        setCampaignStats(stats);
      }

      setLoading(false);
    };

    fetchAnalytics();
  }, [advertiser.id]);

  const ctr = totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : "0.00";

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Métricas de desempenho das suas campanhas</p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Impressões</p>
                <p className="text-2xl font-bold">{totals.impressions.toLocaleString("pt-BR")}</p>
              </div>
              <Eye className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cliques</p>
                <p className="text-2xl font-bold">{totals.clicks.toLocaleString("pt-BR")}</p>
              </div>
              <MousePointerClick className="h-5 w-5 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CTR Geral</p>
                <p className="text-2xl font-bold">{ctr}%</p>
              </div>
              <TrendingUp className="h-5 w-5 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-serif flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Impressões e Cliques (últimos 30 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dailyData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sem dados para exibir.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  labelFormatter={(v) => new Date(v).toLocaleDateString("pt-BR")}
                  formatter={(value: number, name: string) => [value, name === "impressions" ? "Impressões" : "Cliques"]}
                />
                <Bar dataKey="impressions" fill="hsl(215 28% 22%)" radius={[2, 2, 0, 0]} name="impressions" />
                <Bar dataKey="clicks" fill="hsl(42 60% 50%)" radius={[2, 2, 0, 0]} name="clicks" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Per Campaign */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-serif">Desempenho por Campanha</CardTitle>
        </CardHeader>
        <CardContent>
          {campaignStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma campanha encontrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground">Campanha</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Impressões</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Cliques</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignStats.map((s, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2.5 font-medium">{s.name}</td>
                      <td className="py-2.5 text-right text-muted-foreground">{s.impressions.toLocaleString("pt-BR")}</td>
                      <td className="py-2.5 text-right text-muted-foreground">{s.clicks.toLocaleString("pt-BR")}</td>
                      <td className="py-2.5 text-right font-medium">{s.ctr}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
