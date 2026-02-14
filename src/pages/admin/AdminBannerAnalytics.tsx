import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Eye, Calendar } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

interface BannerOption {
  id: string;
  titulo: string;
  pagina: string;
}

interface Impression {
  banner_id: string;
  pagina: string;
  created_at: string;
}

const PAGINA_LABELS: Record<string, string> = {
  todos: "Todos",
  admin: "SuperAdmin",
  loja: "Loja",
  portal: "Portal do Irmão",
};

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(210, 70%, 55%)",
  "hsl(150, 60%, 45%)",
  "hsl(30, 80%, 55%)",
  "hsl(280, 60%, 55%)",
];

export default function AdminBannerAnalytics() {
  const [banners, setBanners] = useState<BannerOption[]>([]);
  const [impressions, setImpressions] = useState<Impression[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(period));

      const [bannersRes, impressionsRes] = await Promise.all([
        supabase.from("login_banners").select("id, titulo, pagina").order("created_at", { ascending: false }),
        supabase
          .from("banner_impressions")
          .select("banner_id, pagina, created_at")
          .gte("created_at", daysAgo.toISOString())
          .order("created_at", { ascending: true }),
      ]);

      if (bannersRes.data) setBanners(bannersRes.data as BannerOption[]);
      if (impressionsRes.data) setImpressions(impressionsRes.data as Impression[]);
      setLoading(false);
    };

    fetchData();
  }, [period]);

  const bannerMap = useMemo(() => {
    const map: Record<string, string> = {};
    banners.forEach((b) => { map[b.id] = b.titulo; });
    return map;
  }, [banners]);

  // Chart 1: Impressions per day
  const dailyData = useMemo(() => {
    const map: Record<string, number> = {};
    impressions.forEach((imp) => {
      const day = new Date(imp.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      map[day] = (map[day] || 0) + 1;
    });
    return Object.entries(map).map(([date, count]) => ({ date, impressoes: count }));
  }, [impressions]);

  // Chart 2: Impressions per hour
  const hourlyData = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = 0; i < 24; i++) map[`${String(i).padStart(2, "0")}h`] = 0;
    impressions.forEach((imp) => {
      const hour = `${String(new Date(imp.created_at).getHours()).padStart(2, "0")}h`;
      map[hour] = (map[hour] || 0) + 1;
    });
    return Object.entries(map).map(([hora, impressoes]) => ({ hora, impressoes }));
  }, [impressions]);

  // Chart 3: Per banner
  const perBannerData = useMemo(() => {
    const map: Record<string, number> = {};
    impressions.forEach((imp) => {
      const name = bannerMap[imp.banner_id] || imp.banner_id.slice(0, 8);
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [impressions, bannerMap]);

  // Chart 4: Per page
  const perPageData = useMemo(() => {
    const map: Record<string, number> = {};
    impressions.forEach((imp) => {
      const label = PAGINA_LABELS[imp.pagina] || imp.pagina;
      map[label] = (map[label] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [impressions]);

  const totalImpressions = impressions.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Banner Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe as exibições dos banners nas telas de login.
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="15">Últimos 15 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalImpressions.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground">Total de Impressões</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <BarChart3 className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{perBannerData.length}</p>
              <p className="text-xs text-muted-foreground">Banners com Exibições</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {dailyData.length > 0
                  ? Math.round(totalImpressions / dailyData.length).toLocaleString("pt-BR")
                  : 0}
              </p>
              <p className="text-xs text-muted-foreground">Média diária</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : totalImpressions === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhuma impressão registrada</p>
            <p className="text-sm mt-1">As exibições dos banners aparecerão aqui.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Daily chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Impressões por Dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Bar dataKey="impressoes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Impressões" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Hourly chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Impressões por Hora do Dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="hora" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Line type="monotone" dataKey="impressoes" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Impressões" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Per banner chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Impressões por Banner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={perBannerData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Bar dataKey="value" name="Impressões" radius={[0, 4, 4, 0]}>
                    {perBannerData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Per page chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                Impressões por Página
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={perPageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {perPageData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
