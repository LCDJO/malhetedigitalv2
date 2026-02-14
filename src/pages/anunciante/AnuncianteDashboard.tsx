import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdvertiser } from "@/components/anunciante/AnuncianteLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Megaphone, Eye, MousePointerClick, TrendingUp, Plus } from "lucide-react";

export default function AnuncianteDashboard() {
  const advertiser = useAdvertiser();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ campaigns: 0, creatives: 0, impressions: 0, clicks: 0 });
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const [campaigns, creatives, impressions, clicks] = await Promise.all([
        supabase.from("ad_campaigns").select("id", { count: "exact", head: true }).eq("advertiser_id", advertiser.id),
        supabase.from("ad_creatives").select("id", { count: "exact", head: true }).eq("advertiser_id", advertiser.id),
        supabase.from("ad_impressions").select("id", { count: "exact", head: true }).eq("advertiser_id", advertiser.id),
        supabase.from("ad_clicks").select("id", { count: "exact", head: true }).eq("advertiser_id", advertiser.id),
      ]);

      setStats({
        campaigns: campaigns.count ?? 0,
        creatives: creatives.count ?? 0,
        impressions: impressions.count ?? 0,
        clicks: clicks.count ?? 0,
      });

      const { data } = await supabase
        .from("ad_campaigns")
        .select("id, name, status, created_at")
        .eq("advertiser_id", advertiser.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentCampaigns(data ?? []);
    };

    fetchStats();
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
          <Plus className="h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Campanhas</p>
                <p className="text-2xl font-bold text-foreground">{stats.campaigns}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Megaphone className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Impressões</p>
                <p className="text-2xl font-bold text-foreground">{stats.impressions.toLocaleString("pt-BR")}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cliques</p>
                <p className="text-2xl font-bold text-foreground">{stats.clicks.toLocaleString("pt-BR")}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <MousePointerClick className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CTR</p>
                <p className="text-2xl font-bold text-foreground">{ctr}%</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-serif">Campanhas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentCampaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Megaphone className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nenhuma campanha criada ainda.</p>
              <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => navigate("/anunciante/campanhas")}>
                <Plus className="h-3.5 w-3.5" /> Criar primeira campanha
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCampaigns.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Badge variant={statusColors[c.status] as any ?? "secondary"}>
                    {c.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
