import { useState, useEffect } from "react";
import { getDashboardStats } from "@/services/dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, GraduationCap, Shield, Activity } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { AdSlot } from "@/components/ads/AdSlot";
import { useLodgeConfig } from "@/hooks/useLodgeConfig";
import { formatCurrency } from "@/components/dashboard/DashboardData";
import { SectionHeader } from "@/components/dashboard/SectionHeader";

const grauLabels: Record<string, string> = {
  aprendiz: "Aprendiz (1°)",
  companheiro: "Companheiro (2°)",
  mestre: "Mestre (3°)",
};

const Index = () => {
  const { config } = useLodgeConfig();
  const [stats, setStats] = useState({
    totalAtivos: 0,
    totalInativos: 0,
    totalMembros: 0,
    porGrau: {} as Record<string, number>,
    mestresInstalados: 0,
    inadimplentes: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await getDashboardStats();
        const porGrau: Record<string, number> = {};
        let mestresInstalados = 0;
        if (data.members) {
          for (const m of data.members) {
            porGrau[m.degree] = (porGrau[m.degree] || 0) + 1;
            if (m.master_installed) mestresInstalados++;
          }
        }

        setStats({
          totalAtivos: data.active_count,
          totalInativos: data.inactive_count,
          totalMembros: data.active_count + data.inactive_count,
          porGrau,
          mestresInstalados,
          inadimplentes: data.overdue_member_ids?.length ?? 0,
        });
      } catch {
        // silently fail
      }
    })();
  }, []);

  const adimplencia = stats.totalAtivos > 0
    ? ((stats.totalAtivos - stats.inadimplentes) / stats.totalAtivos * 100).toFixed(1)
    : "100.0";

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold">Painel da Loja</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão geral — {config.lodge_name || "Loja"} nº {config.lodge_number || "—"} · Or∴ de {config.orient || "—"}
        </p>
      </div>

      {/* Info da Loja */}
      <section className="space-y-4">
        <SectionHeader title="Dados da Loja" subtitle="Informações institucionais" />
        <Card>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 text-sm">
            <div><span className="text-muted-foreground">Nome:</span> <strong>{config.lodge_name || "—"}</strong></div>
            <div><span className="text-muted-foreground">Nº:</span> <strong>{config.lodge_number || "—"}</strong></div>
            <div><span className="text-muted-foreground">Oriente:</span> <strong>{config.orient || "—"}</strong></div>
            <div><span className="text-muted-foreground">Potência:</span> <strong>{config.potencia || "—"}</strong></div>
          </CardContent>
        </Card>
      </section>

      {/* Distribuição por grau */}
      <section className="space-y-4">
        <SectionHeader title="Quadro de Obreiros" subtitle="Distribuição por grau maçônico" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(["aprendiz", "companheiro", "mestre"] as const).map((grau) => (
            <Card key={grau}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{grauLabels[grau]}</p>
                  <p className="text-2xl font-serif font-bold">{stats.porGrau[grau] ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {stats.totalAtivos > 0
                      ? `${((stats.porGrau[grau] ?? 0) / stats.totalAtivos * 100).toFixed(0)}% do quadro`
                      : "—"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* KPIs principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Obreiros Ativos"
          value={String(stats.totalAtivos)}
          description={`${stats.totalMembros} total no quadro`}
          icon={Users}
          trend={{ value: `${stats.totalInativos} inativos`, positive: stats.totalInativos === 0 }}
          className="[animation-delay:0ms]"
        />
        <StatCard
          title="Taxa de Adimplência"
          value={`${adimplencia}%`}
          description={`${stats.inadimplentes} irmão(s) com pendência`}
          icon={UserCheck}
          trend={{ value: stats.inadimplentes === 0 ? "Quadro em dia" : `${stats.inadimplentes} inadimplente(s)`, positive: stats.inadimplentes === 0 }}
          className="[animation-delay:80ms]"
        />
        <StatCard
          title="Mestres Instalados"
          value={String(stats.mestresInstalados)}
          description="Mestres com instalação registrada"
          icon={Shield}
          trend={{ value: `de ${stats.totalAtivos} ativos`, positive: true }}
          className="[animation-delay:160ms]"
        />
        <StatCard
          title="Mensalidade Padrão"
          value={formatCurrency(config.mensalidade_padrao)}
          description={`Vencimento dia ${config.dia_vencimento}`}
          icon={Activity}
          trend={{ value: `Potência: ${config.potencia || "—"}`, positive: true }}
          className="[animation-delay:240ms]"
        />
      </div>

      {/* Ad slot — lodge dashboard */}
      <AdSlot slotSlug="lodge_dashboard_bottom" page="lodge_dashboard" aspectRatio="20%" />

    </div>
  );
};

export default Index;
