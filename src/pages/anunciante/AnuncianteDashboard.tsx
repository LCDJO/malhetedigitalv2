import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdvertiser } from "@/components/anunciante/AnuncianteLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Megaphone, Eye, MousePointerClick, TrendingUp, Plus, ImagePlus,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

interface DailyPoint {
  date: string;
  impressions: number;
  clicks: number;
}

export default function AnuncianteDashboard() {
  const advertiser = useAdvertiser();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ campaigns: 0, activeCampaigns: 0, creatives: 0, impressions: 0, clicks: 0 });
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
  const [chartData, setChartData] = useState<DailyPoint[]>([]);
  const [topCreatives, setTopCreatives] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const [campaigns, activeCampaigns, creatives, impressions, clicks] = await Promise.all([
        supabase.from("ad_campaigns").select("id", { count: "exact", head: true }).eq("advertiser_id", advertiser.id),
        supabase.from("ad_campaigns").select("id", { count: "exact", head: true }).eq("advertiser_id", advertiser.id).eq("status", "ativa"),
        supabase.from("ad_creatives").select("id", { count: "exact", head: true }).eq("advertiser_id", advertiser.id),
        supabase.from("ad_impressions").select("id", { count: "exact", head: true }).eq("advertiser_id", advertiser.id),
        supabase.from("ad_clicks").select("id", { count: "exact", head: true }).eq("advertiser_id", advertiser.id),
      ]);

      setStats({
        campaigns: campaigns.count ?? 0,
        activeCampaigns: activeCampaigns.count ?? 0,
        creatives: creatives.count ?? 0,
        impressions: impressions.count ?? 0,
        clicks: clicks.count ?? 0,
      });

      // Recent campaigns
      const { data: recent } = await supabase
        .from("ad_campaigns")
        .select("id, name, status, created_at")
        .eq("advertiser_id", advertiser.id)
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentCampaigns(recent ?? []);

      // Top creatives by clicks
      const { data: topCr } = await supabase
        .from("ad_creatives")
        .select("id, title, impressions_count, clicks_count, media_url, media_type")
        .eq("advertiser_id", advertiser.id)
        .order("clicks_count", { ascending: false })
        .limit(3);
      setTopCreatives(topCr ?? []);

      // Chart: impressions last 14 days
      const { data: impData } = await supabase
        .from("ad_impressions")
        .select("created_at")
        .eq("advertiser_id", advertiser.id)
        .gte("created_at", new Date(Date.now() - 14 * 86400000).toISOString());
      const { data: clkData } = await supabase
        .from("ad_clicks")
        .select("created_at")
        .eq("advertiser_id", advertiser.id)
        .gte("created_at", new Date(Date.now() - 14 * 86400000).toISOString());

      const dayMap = new Map<string, DailyPoint>();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        dayMap.set(d, { date: d, impressions: 0, clicks: 0 });
      }
      impData?.forEach((r) => {
        const d = r.created_at.slice(0, 10);
        const p = dayMap.get(d);
        if (p) p.impressions++;
      });
      clkData?.forEach((r) => {
        const d = r.created_at.slice(0, 10);
        const p = dayMap.get(d);
        if (p) p.clicks++;
      });
      setChartData(Array.from(dayMap.values()));
    };

    fetch();
  }, [advertiser.id]);

  const ctr = stats.impressions > 0 ? ((stats.clicks / stats.impressions) * 100).toFixed(2) : "0.00";

  const statusColors: Record<string, string> = {
    rascunho: "secondary",
    ativa: "default",
    pausada: "outline",
    encerrada: "destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral das suas campanhas</p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/anunciante/campanhas")}>
          <Plus className="h-4 w-4" /> Nova Campanha
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Campanhas", value: stats.campaigns, icon: Megaphone, color: "accent" },
          { label: "Ativas", value: stats.activeCampaigns, icon: ArrowUpRight, color: "success" },
          { label: "Impressões", value: stats.impressions.toLocaleString("pt-BR"), icon: Eye, color: "primary" },
          { label: "Cliques", value: stats.clicks.toLocaleString("pt-BR"), icon: MousePointerClick, color: "success" },
          { label: "CTR", value: `${ctr}%`, icon: TrendingUp, color: "warning" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-xl font-bold text-foreground mt-0.5">{kpi.value}</p>
                </div>
                <div className={`h-9 w-9 rounded-lg bg-${kpi.color}/10 flex items-center justify-center`}>
                  <kpi.icon className={`h-4 w-4 text-${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trend chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-serif">Tendência — Últimos 14 dias</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.every((d) => d.impressions === 0 && d.clicks === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-10">Sem dados para exibir ainda.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradImp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradClk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(8)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  labelFormatter={(v) => new Date(v).toLocaleDateString("pt-BR")}
                  formatter={(val: number, name: string) => [val, name === "impressions" ? "Impressões" : "Cliques"]}
                />
                <Area type="monotone" dataKey="impressions" stroke="hsl(var(--primary))" fill="url(#gradImp)" strokeWidth={2} />
                <Area type="monotone" dataKey="clicks" stroke="hsl(var(--accent))" fill="url(#gradClk)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Campaigns */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-serif">Campanhas Recentes</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/anunciante/campanhas")}>
                Ver todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentCampaigns.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Megaphone className="h-7 w-7 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Nenhuma campanha ainda.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentCampaigns.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Badge variant={statusColors[c.status] as any ?? "secondary"} className="capitalize shrink-0">
                      {c.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Creatives */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-serif">Top Criativos</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/anunciante/criativos")}>
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {topCreatives.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <ImagePlus className="h-7 w-7 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Nenhum criativo ainda.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {topCreatives.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <div className="h-10 w-14 rounded bg-muted overflow-hidden shrink-0">
                      <img src={c.media_url} alt={c.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                      <div className="flex gap-3 text-[11px] text-muted-foreground">
                        <span>{c.impressions_count} imp.</span>
                        <span>{c.clicks_count} cliques</span>
                        <span className="font-medium text-foreground">
                          {c.impressions_count > 0 ? ((c.clicks_count / c.impressions_count) * 100).toFixed(1) : "0"}% CTR
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
