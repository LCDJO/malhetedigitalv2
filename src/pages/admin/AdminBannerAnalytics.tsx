import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Eye, MousePointerClick, TrendingUp, BarChart3, Calendar, Users, Megaphone, Monitor, ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(210, 70%, 55%)",
  "hsl(150, 60%, 45%)",
  "hsl(30, 80%, 55%)",
  "hsl(280, 60%, 55%)",
  "hsl(350, 65%, 55%)",
  "hsl(190, 60%, 45%)",
];

const PAGE_LABELS: Record<string, string> = {
  login: "Login Loja",
  portal_dashboard: "Portal do Irmão",
  lodge_dashboard: "Dashboard Loja",
  loja: "Login Loja",
  portal: "Portal do Irmão",
};

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  fontSize: 12,
};

function fmt(n: number) {
  return n.toLocaleString("pt-BR");
}

function ctr(impressions: number, clicks: number) {
  return impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : "0.00";
}

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <span className="text-xs text-muted-foreground">—</span>;
  if (previous === 0) return <span className="text-xs text-emerald-500 flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3" />Novo</span>;
  const pct = ((current - previous) / previous) * 100;
  if (pct > 0) return <span className="text-xs text-emerald-500 flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3" />+{pct.toFixed(1)}%</span>;
  if (pct < 0) return <span className="text-xs text-destructive flex items-center gap-0.5"><ArrowDownRight className="h-3 w-3" />{pct.toFixed(1)}%</span>;
  return <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Minus className="h-3 w-3" />0%</span>;
}

export default function AdminBannerAnalytics() {
  const [period, setPeriod] = useState("30");
  const [loading, setLoading] = useState(true);

  // Raw data
  const [impressions, setImpressions] = useState<any[]>([]);
  const [clicks, setClicks] = useState<any[]>([]);
  const [bannerImpressions, setBannerImpressions] = useState<any[]>([]);
  const [advertisers, setAdvertisers] = useState<{ id: string; company_name: string }[]>([]);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string; advertiser_id: string }[]>([]);
  const [creatives, setCreatives] = useState<{ id: string; title: string; campaign_id: string }[]>([]);
  const [banners, setBanners] = useState<{ id: string; titulo: string }[]>([]);

  // Previous period data for comparison
  const [prevImpressions, setPrevImpressions] = useState<any[]>([]);
  const [prevClicks, setPrevClicks] = useState<any[]>([]);
  const [prevBannerImps, setPrevBannerImps] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const days = parseInt(period);
      const now = new Date();
      const since = new Date(now.getTime() - days * 86400000).toISOString();
      const prevSince = new Date(now.getTime() - days * 2 * 86400000).toISOString();

      const [
        impRes, clkRes, bImpRes,
        prevImpRes, prevClkRes, prevBImpRes,
        advRes, campRes, creatRes, banRes,
      ] = await Promise.all([
        supabase.from("ad_impressions").select("creative_id, campaign_id, advertiser_id, page, created_at").gte("created_at", since),
        supabase.from("ad_clicks").select("creative_id, campaign_id, advertiser_id, page, created_at").gte("created_at", since),
        supabase.from("banner_impressions").select("banner_id, pagina, created_at").gte("created_at", since),
        supabase.from("ad_impressions").select("creative_id, campaign_id, advertiser_id, page, created_at").gte("created_at", prevSince).lt("created_at", since),
        supabase.from("ad_clicks").select("creative_id, campaign_id, advertiser_id, page, created_at").gte("created_at", prevSince).lt("created_at", since),
        supabase.from("banner_impressions").select("banner_id, pagina, created_at").gte("created_at", prevSince).lt("created_at", since),
        supabase.from("advertisers").select("id, company_name").eq("status", "aprovado"),
        supabase.from("ad_campaigns").select("id, name, advertiser_id"),
        supabase.from("ad_creatives").select("id, title, campaign_id"),
        supabase.from("login_banners").select("id, titulo"),
      ]);

      setImpressions(impRes.data ?? []);
      setClicks(clkRes.data ?? []);
      setBannerImpressions(bImpRes.data ?? []);
      setPrevImpressions(prevImpRes.data ?? []);
      setPrevClicks(prevClkRes.data ?? []);
      setPrevBannerImps(prevBImpRes.data ?? []);
      setAdvertisers(advRes.data ?? []);
      setCampaigns(campRes.data ?? []);
      setCreatives(creatRes.data ?? []);
      setBanners(banRes.data ?? []);
      setLoading(false);
    };
    fetchAll();
  }, [period]);

  // === Computed metrics ===
  const totalImp = impressions.length;
  const totalClk = clicks.length;
  const totalBannerImp = bannerImpressions.length;
  const totalAllImp = totalImp + totalBannerImp;
  const prevTotalImp = prevImpressions.length + prevBannerImps.length;
  const prevTotalClk = prevClicks.length;

  // Daily trend (ads + banners combined)
  const dailyData = useMemo(() => {
    const days = parseInt(period);
    const map = new Map<string, { date: string; ad_imp: number; ad_clk: number; banner_imp: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      map.set(d, { date: d, ad_imp: 0, ad_clk: 0, banner_imp: 0 });
    }
    impressions.forEach((r) => { const p = map.get(r.created_at.slice(0, 10)); if (p) p.ad_imp++; });
    clicks.forEach((r) => { const p = map.get(r.created_at.slice(0, 10)); if (p) p.ad_clk++; });
    bannerImpressions.forEach((r) => { const p = map.get(r.created_at.slice(0, 10)); if (p) p.banner_imp++; });
    return Array.from(map.values());
  }, [impressions, clicks, bannerImpressions, period]);

  // Per-page breakdown (ads)
  const pageData = useMemo(() => {
    const map = new Map<string, { page: string; impressions: number; clicks: number }>();
    impressions.forEach((r) => {
      const label = PAGE_LABELS[r.page] || r.page;
      const p = map.get(label) ?? { page: label, impressions: 0, clicks: 0 };
      p.impressions++;
      map.set(label, p);
    });
    clicks.forEach((r) => {
      const label = PAGE_LABELS[r.page] || r.page;
      const p = map.get(label) ?? { page: label, impressions: 0, clicks: 0 };
      p.clicks++;
      map.set(label, p);
    });
    // Also add banner impressions per page
    bannerImpressions.forEach((r) => {
      const label = PAGE_LABELS[r.pagina] || r.pagina;
      const p = map.get(label) ?? { page: label, impressions: 0, clicks: 0 };
      p.impressions++;
      map.set(label, p);
    });
    return Array.from(map.values()).sort((a, b) => b.impressions - a.impressions);
  }, [impressions, clicks, bannerImpressions]);

  // Per-advertiser breakdown
  const advertiserData = useMemo(() => {
    const advMap = new Map<string, string>();
    advertisers.forEach((a) => advMap.set(a.id, a.company_name));

    const map = new Map<string, { name: string; impressions: number; clicks: number }>();
    impressions.forEach((r) => {
      const name = advMap.get(r.advertiser_id) || r.advertiser_id.slice(0, 8);
      const p = map.get(name) ?? { name, impressions: 0, clicks: 0 };
      p.impressions++;
      map.set(name, p);
    });
    clicks.forEach((r) => {
      const name = advMap.get(r.advertiser_id) || r.advertiser_id.slice(0, 8);
      const p = map.get(name) ?? { name, impressions: 0, clicks: 0 };
      p.clicks++;
      map.set(name, p);
    });
    return Array.from(map.values())
      .map((a) => ({ ...a, ctr: ctr(a.impressions, a.clicks) }))
      .sort((a, b) => b.impressions - a.impressions);
  }, [impressions, clicks, advertisers]);

  // Per-campaign breakdown
  const campaignData = useMemo(() => {
    const campMap = new Map<string, string>();
    campaigns.forEach((c) => campMap.set(c.id, c.name));

    const map = new Map<string, { name: string; impressions: number; clicks: number }>();
    impressions.forEach((r) => {
      const name = campMap.get(r.campaign_id) || r.campaign_id.slice(0, 8);
      const p = map.get(name) ?? { name, impressions: 0, clicks: 0 };
      p.impressions++;
      map.set(name, p);
    });
    clicks.forEach((r) => {
      const name = campMap.get(r.campaign_id) || r.campaign_id.slice(0, 8);
      const p = map.get(name) ?? { name, impressions: 0, clicks: 0 };
      p.clicks++;
      map.set(name, p);
    });
    return Array.from(map.values())
      .map((c) => ({ ...c, ctr: ctr(c.impressions, c.clicks) }))
      .sort((a, b) => b.impressions - a.impressions);
  }, [impressions, clicks, campaigns]);

  // Top creatives
  const creativeData = useMemo(() => {
    const crMap = new Map<string, string>();
    creatives.forEach((c) => crMap.set(c.id, c.title));

    const map = new Map<string, { name: string; impressions: number; clicks: number }>();
    impressions.forEach((r) => {
      const name = crMap.get(r.creative_id) || r.creative_id.slice(0, 8);
      const p = map.get(name) ?? { name, impressions: 0, clicks: 0 };
      p.impressions++;
      map.set(name, p);
    });
    clicks.forEach((r) => {
      const name = crMap.get(r.creative_id) || r.creative_id.slice(0, 8);
      const p = map.get(name) ?? { name, impressions: 0, clicks: 0 };
      p.clicks++;
      map.set(name, p);
    });
    return Array.from(map.values())
      .map((c) => ({ ...c, ctr: ctr(c.impressions, c.clicks) }))
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 10);
  }, [impressions, clicks, creatives]);

  // Hourly distribution (ads)
  const hourlyData = useMemo(() => {
    const map: Record<string, { hora: string; impressions: number; clicks: number }> = {};
    for (let i = 0; i < 24; i++) {
      const h = `${String(i).padStart(2, "0")}h`;
      map[h] = { hora: h, impressions: 0, clicks: 0 };
    }
    impressions.forEach((r) => {
      const h = `${String(new Date(r.created_at).getHours()).padStart(2, "0")}h`;
      map[h].impressions++;
    });
    clicks.forEach((r) => {
      const h = `${String(new Date(r.created_at).getHours()).padStart(2, "0")}h`;
      map[h].clicks++;
    });
    return Object.values(map);
  }, [impressions, clicks]);

  // Banner-specific data (login_banners)
  const bannerData = useMemo(() => {
    const bMap = new Map<string, string>();
    banners.forEach((b) => bMap.set(b.id, b.titulo));
    const map = new Map<string, { name: string; impressions: number }>();
    bannerImpressions.forEach((r) => {
      const name = bMap.get(r.banner_id) || r.banner_id.slice(0, 8);
      const p = map.get(name) ?? { name, impressions: 0 };
      p.impressions++;
      map.set(name, p);
    });
    return Array.from(map.values()).sort((a, b) => b.impressions - a.impressions);
  }, [bannerImpressions, banners]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Ads Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão consolidada de impressões, cliques e CTR de anúncios e banners.
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[150px] h-9 text-xs">
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 dias</SelectItem>
            <SelectItem value="14">14 dias</SelectItem>
            <SelectItem value="30">30 dias</SelectItem>
            <SelectItem value="90">90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">Impressões Totais</p>
                  <Eye className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl font-bold">{fmt(totalAllImp)}</p>
                <TrendIndicator current={totalAllImp} previous={prevTotalImp} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">Impressões Ads</p>
                  <Megaphone className="h-4 w-4 text-accent" />
                </div>
                <p className="text-2xl font-bold">{fmt(totalImp)}</p>
                <TrendIndicator current={totalImp} previous={prevImpressions.length} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">Cliques</p>
                  <MousePointerClick className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold">{fmt(totalClk)}</p>
                <TrendIndicator current={totalClk} previous={prevTotalClk} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">CTR Ads</p>
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-2xl font-bold">{ctr(totalImp, totalClk)}%</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Anterior: {ctr(prevImpressions.length, prevClicks.length)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Evolution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Evolução Diária
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="gAdImp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gBannerImp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(210,70%,55%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(210,70%,55%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gClk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => new Date(v).toLocaleDateString("pt-BR")} />
                  <Area type="monotone" dataKey="ad_imp" stroke="hsl(var(--primary))" fill="url(#gAdImp)" strokeWidth={2} name="Imp. Ads" />
                  <Area type="monotone" dataKey="banner_imp" stroke="hsl(210,70%,55%)" fill="url(#gBannerImp)" strokeWidth={2} name="Imp. Banners" />
                  <Area type="monotone" dataKey="ad_clk" stroke="hsl(var(--accent))" fill="url(#gClk)" strokeWidth={2} name="Cliques" />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tabs: Anunciantes / Campanhas / Criativos / Banners */}
          <Tabs defaultValue="advertisers" className="space-y-4">
            <TabsList>
              <TabsTrigger value="advertisers" className="gap-1.5 text-xs"><Users className="h-3.5 w-3.5" />Anunciantes</TabsTrigger>
              <TabsTrigger value="campaigns" className="gap-1.5 text-xs"><Megaphone className="h-3.5 w-3.5" />Campanhas</TabsTrigger>
              <TabsTrigger value="creatives" className="gap-1.5 text-xs"><Monitor className="h-3.5 w-3.5" />Top Criativos</TabsTrigger>
              <TabsTrigger value="banners" className="gap-1.5 text-xs"><BarChart3 className="h-3.5 w-3.5" />Banners Internos</TabsTrigger>
            </TabsList>

            {/* Advertisers */}
            <TabsContent value="advertisers">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Impressões por Anunciante</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {advertiserData.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Sem dados de anunciantes.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={advertiserData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Bar dataKey="impressions" name="Impressões" radius={[0, 4, 4, 0]}>
                            {advertiserData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Ranking de Anunciantes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {advertiserData.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Sem dados.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b text-left">
                              <th className="pb-2 font-medium text-muted-foreground">#</th>
                              <th className="pb-2 font-medium text-muted-foreground">Anunciante</th>
                              <th className="pb-2 font-medium text-muted-foreground text-right">Imp.</th>
                              <th className="pb-2 font-medium text-muted-foreground text-right">Cliques</th>
                              <th className="pb-2 font-medium text-muted-foreground text-right">CTR</th>
                            </tr>
                          </thead>
                          <tbody>
                            {advertiserData.map((a, i) => (
                              <tr key={i} className="border-b last:border-0">
                                <td className="py-2 text-muted-foreground">{i + 1}</td>
                                <td className="py-2 font-medium truncate max-w-[140px]">{a.name}</td>
                                <td className="py-2 text-right text-muted-foreground">{fmt(a.impressions)}</td>
                                <td className="py-2 text-right text-muted-foreground">{fmt(a.clicks)}</td>
                                <td className="py-2 text-right font-medium">{a.ctr}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Campaigns */}
            <TabsContent value="campaigns">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Desempenho por Campanha</CardTitle>
                </CardHeader>
                <CardContent>
                  {campaignData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Sem dados de campanhas.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="pb-2 font-medium text-muted-foreground">Campanha</th>
                            <th className="pb-2 font-medium text-muted-foreground text-right">Impressões</th>
                            <th className="pb-2 font-medium text-muted-foreground text-right">Cliques</th>
                            <th className="pb-2 font-medium text-muted-foreground text-right">CTR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {campaignData.map((c, i) => (
                            <tr key={i} className="border-b last:border-0">
                              <td className="py-2.5 font-medium truncate max-w-[200px]">{c.name}</td>
                              <td className="py-2.5 text-right text-muted-foreground">{fmt(c.impressions)}</td>
                              <td className="py-2.5 text-right text-muted-foreground">{fmt(c.clicks)}</td>
                              <td className="py-2.5 text-right">
                                <Badge variant="secondary" className="text-[10px]">{c.ctr}%</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Creatives */}
            <TabsContent value="creatives">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Top 10 Criativos</CardTitle>
                </CardHeader>
                <CardContent>
                  {creativeData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Sem dados de criativos.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="pb-2 font-medium text-muted-foreground">#</th>
                            <th className="pb-2 font-medium text-muted-foreground">Criativo</th>
                            <th className="pb-2 font-medium text-muted-foreground text-right">Impressões</th>
                            <th className="pb-2 font-medium text-muted-foreground text-right">Cliques</th>
                            <th className="pb-2 font-medium text-muted-foreground text-right">CTR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {creativeData.map((c, i) => (
                            <tr key={i} className="border-b last:border-0">
                              <td className="py-2 text-muted-foreground">{i + 1}</td>
                              <td className="py-2 font-medium truncate max-w-[200px]">{c.name}</td>
                              <td className="py-2 text-right text-muted-foreground">{fmt(c.impressions)}</td>
                              <td className="py-2 text-right text-muted-foreground">{fmt(c.clicks)}</td>
                              <td className="py-2 text-right font-medium">{c.ctr}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Internal Banners */}
            <TabsContent value="banners">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Impressões de Banners Internos</CardTitle>
                </CardHeader>
                <CardContent>
                  {bannerData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Sem impressões de banners.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={bannerData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={140} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="impressions" name="Impressões" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Bottom row: Page breakdown + Hourly distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Alcance por Página/Portal */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  Alcance por Portal/Página
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pageData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Sem dados.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={pageData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="impressions"
                        nameKey="page"
                        label={({ page, percent }) => `${page} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {pageData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Distribuição por Hora */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Distribuição por Hora
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                    <XAxis dataKey="hora" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="impressions" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2 }} name="Impressões" />
                    <Line type="monotone" dataKey="clicks" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 2 }} name="Cliques" />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
