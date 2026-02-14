import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdvertiser } from "@/components/anunciante/AnuncianteLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Eye, MousePointerClick, TrendingUp, BarChart3, Calendar } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";

interface CampaignOption { id: string; name: string; }

export default function AnuncianteAnalytics() {
  const advertiser = useAdvertiser();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState("todos");
  const [period, setPeriod] = useState("30");

  const [dailyData, setDailyData] = useState<any[]>([]);
  const [campaignStats, setCampaignStats] = useState<any[]>([]);
  const [pageStats, setPageStats] = useState<any[]>([]);
  const [totals, setTotals] = useState({ impressions: 0, clicks: 0 });

  useEffect(() => {
    supabase
      .from("ad_campaigns")
      .select("id, name")
      .eq("advertiser_id", advertiser.id)
      .order("name")
      .then(({ data }) => setCampaigns((data as CampaignOption[]) ?? []));
  }, [advertiser.id]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const days = parseInt(period);
      const since = new Date(Date.now() - days * 86400000).toISOString();

      let impQuery = supabase.from("ad_impressions").select("created_at, campaign_id, page").eq("advertiser_id", advertiser.id).gte("created_at", since);
      let clkQuery = supabase.from("ad_clicks").select("created_at, campaign_id, page").eq("advertiser_id", advertiser.id).gte("created_at", since);

      if (selectedCampaign !== "todos") {
        impQuery = impQuery.eq("campaign_id", selectedCampaign);
        clkQuery = clkQuery.eq("campaign_id", selectedCampaign);
      }

      const [{ data: impressions }, { data: clicks }] = await Promise.all([impQuery, clkQuery]);

      const impList = impressions ?? [];
      const clkList = clicks ?? [];
      setTotals({ impressions: impList.length, clicks: clkList.length });

      // Daily aggregation
      const dayMap = new Map<string, { date: string; impressions: number; clicks: number }>();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        dayMap.set(d, { date: d, impressions: 0, clicks: 0 });
      }
      impList.forEach((r) => { const p = dayMap.get(r.created_at.slice(0, 10)); if (p) p.impressions++; });
      clkList.forEach((r) => { const p = dayMap.get(r.created_at.slice(0, 10)); if (p) p.clicks++; });
      setDailyData(Array.from(dayMap.values()));

      // Page aggregation
      const pageMap = new Map<string, { page: string; impressions: number; clicks: number }>();
      impList.forEach((r) => {
        const p = pageMap.get(r.page) ?? { page: r.page, impressions: 0, clicks: 0 };
        p.impressions++;
        pageMap.set(r.page, p);
      });
      clkList.forEach((r) => {
        const p = pageMap.get(r.page) ?? { page: r.page, impressions: 0, clicks: 0 };
        p.clicks++;
        pageMap.set(r.page, p);
      });
      setPageStats(Array.from(pageMap.values()).sort((a, b) => b.impressions - a.impressions));

      // Per-campaign stats (only when "todos")
      if (selectedCampaign === "todos" && campaigns.length > 0) {
        const campMap = new Map<string, { name: string; impressions: number; clicks: number }>();
        campaigns.forEach((c) => campMap.set(c.id, { name: c.name, impressions: 0, clicks: 0 }));
        impList.forEach((r) => { const c = campMap.get(r.campaign_id); if (c) c.impressions++; });
        clkList.forEach((r) => { const c = campMap.get(r.campaign_id); if (c) c.clicks++; });
        setCampaignStats(
          Array.from(campMap.values())
            .map((c) => ({ ...c, ctr: c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : "0.00" }))
            .sort((a, b) => b.impressions - a.impressions)
        );
      }

      setLoading(false);
    };

    fetchAnalytics();
  }, [advertiser.id, selectedCampaign, period, campaigns]);

  const ctr = totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : "0.00";
  const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))"];

  if (loading && dailyData.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Métricas de desempenho das suas campanhas</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="14">Últimos 14 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <SelectValue placeholder="Campanha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as campanhas</SelectItem>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Impressões</p>
                <p className="text-2xl font-bold">{totals.impressions.toLocaleString("pt-BR")}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Eye className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Cliques</p>
                <p className="text-2xl font-bold">{totals.clicks.toLocaleString("pt-BR")}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center">
                <MousePointerClick className="h-4 w-4 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">CTR</p>
                <p className="text-2xl font-bold">{ctr}%</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Area Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-serif flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Evolução Diária
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dailyData.every((d) => d.impressions === 0 && d.clicks === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-10">Sem dados no período selecionado.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="anaGradImp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="anaGradClk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  labelFormatter={(v) => new Date(v).toLocaleDateString("pt-BR")}
                  formatter={(val: number, name: string) => [val, name === "impressions" ? "Impressões" : "Cliques"]}
                />
                <Area type="monotone" dataKey="impressions" stroke="hsl(var(--primary))" fill="url(#anaGradImp)" strokeWidth={2} />
                <Area type="monotone" dataKey="clicks" stroke="hsl(var(--accent))" fill="url(#anaGradClk)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Reach by page */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-serif">Alcance por Página</CardTitle>
          </CardHeader>
          <CardContent>
            {pageStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Sem dados.</p>
            ) : (
              <div className="space-y-3">
                {pageStats.map((p) => {
                  const maxImp = Math.max(...pageStats.map((x) => x.impressions), 1);
                  return (
                    <div key={p.page} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{p.page}</span>
                        <span className="text-muted-foreground">{p.impressions} imp · {p.clicks} clk</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${(p.impressions / maxImp) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Per-campaign table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-serif">Desempenho por Campanha</CardTitle>
          </CardHeader>
          <CardContent>
            {campaignStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {selectedCampaign !== "todos" ? "Filtrando campanha específica." : "Sem dados."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium text-muted-foreground">Campanha</th>
                      <th className="pb-2 font-medium text-muted-foreground text-right">Imp.</th>
                      <th className="pb-2 font-medium text-muted-foreground text-right">Cliques</th>
                      <th className="pb-2 font-medium text-muted-foreground text-right">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignStats.map((s, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 font-medium truncate max-w-[120px]">{s.name}</td>
                        <td className="py-2 text-right text-muted-foreground">{s.impressions.toLocaleString("pt-BR")}</td>
                        <td className="py-2 text-right text-muted-foreground">{s.clicks.toLocaleString("pt-BR")}</td>
                        <td className="py-2 text-right font-medium">{s.ctr}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
