import { useEffect, useState } from "react";
import { getPortalStats } from "@/services/portal";
import { usePortalMemberContext } from "@/components/portal/PortalLayout";
import { PortalBannerCarousel } from "@/components/portal/PortalBannerCarousel";
import { AdSlot } from "@/components/ads/AdSlot";
import { useLodgeConfig } from "@/hooks/useLodgeConfig";
import { Link } from "react-router-dom";
import {
  Wallet,
  Building2,
  Users,
  Compass,
  ArrowRight,
  TrendingUp,
  Calendar,
  Award,
} from "lucide-react";
import { format } from "date-fns";

const degreeLabels: Record<string, string> = {
  aprendiz: "Aprendiz",
  companheiro: "Companheiro",
  mestre: "Mestre",
};

const fmtDate = (d: string | null) => (d ? format(new Date(d), "dd/MM/yyyy") : "—");

export default function PortalDashboard() {
  const member = usePortalMemberContext();
  const { config } = useLodgeConfig();
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getPortalStats();
        setActiveCount(data.active_count);
        setPendingCount(data.pending_count);
      } catch {
        // silently fail
      }
    };
    fetchStats();
  }, [member.id]);

  const journeySteps = [
    { label: "Iniciação", date: member.initiation_date, done: !!member.initiation_date },
    { label: "Elevação", date: member.elevation_date, done: !!member.elevation_date },
    { label: "Exaltação", date: member.exaltation_date, done: !!member.exaltation_date },
  ];

  const completedSteps = journeySteps.filter((s) => s.done).length;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Banner carousel */}
      <PortalBannerCarousel />

      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">
          Bem-vindo, Ir∴ {member.full_name.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {degreeLabels[member.degree] ?? member.degree}
          {config ? ` — ${config.lodge_name} nº ${config.lodge_number}` : ""}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Journey progress */}
        <div className="portal-card rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(42_65%_50%/0.15)]">
              <Compass className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Jornada</p>
              <p className="text-lg font-bold text-foreground">{completedSteps}/3</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {journeySteps.map((s) => (
              <div
                key={s.label}
                className={`h-1.5 flex-1 rounded-full ${s.done ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Graus Concluídos</p>
        </div>

        {/* Financial status */}
        <div className="portal-card rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(42_65%_50%/0.15)]">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Financeiro</p>
              <p className="text-lg font-bold text-foreground">
                {pendingCount === null ? "—" : pendingCount === 0 ? "Adimplente" : `${pendingCount} pendência${pendingCount > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <div className={`h-1.5 rounded-full ${pendingCount === 0 ? "bg-[hsl(158_50%_42%)]" : "bg-[hsl(40_80%_52%)]"}`} />
          <p className="text-[11px] text-muted-foreground mt-2">
            {pendingCount === 0 ? "Nenhum débito em aberto" : "Verifique em Meu Financeiro"}
          </p>
        </div>

        {/* Lodge members */}
        <div className="portal-card rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(42_65%_50%/0.15)]">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Loja</p>
              <p className="text-lg font-bold text-foreground">{activeCount ?? "—"}</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">Membros Ativos</p>
        </div>
      </div>

      {/* Journey timeline */}
      <div className="portal-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-serif font-semibold text-foreground flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Trajetória Maçônica
          </h2>
          <Link to="/portal/jornada" className="text-xs text-primary hover:underline flex items-center gap-1">
            Ver detalhes <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="flex items-center gap-0">
          {journeySteps.map((step, i) => (
            <div key={step.label} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.done
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {i + 1}
                </div>
                <p className={`text-[11px] mt-1.5 font-medium ${step.done ? "text-primary" : "text-muted-foreground"}`}>
                  {step.label}
                </p>
                <p className="text-[10px] text-muted-foreground">{fmtDate(step.date)}</p>
              </div>
              {i < journeySteps.length - 1 && (
                <div className={`h-0.5 flex-1 -mt-6 ${step.done ? "bg-primary/50" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Ad slot — portal */}
      <AdSlot slotSlug="portal_dashboard_bottom" page="portal_dashboard" aspectRatio="20%" />

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          to="/portal/financeiro"
          className="portal-card rounded-xl p-4 flex items-center gap-3 hover:border-primary/30 transition-colors group"
        >
          <TrendingUp className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Meu Financeiro</p>
            <p className="text-[11px] text-muted-foreground">Débitos, créditos e extrato</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
        <Link
          to="/portal/minha-loja"
          className="portal-card rounded-xl p-4 flex items-center gap-3 hover:border-primary/30 transition-colors group"
        >
          <Building2 className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Minha Loja</p>
            <p className="text-[11px] text-muted-foreground">Informações e documentos</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
      </div>
    </div>
  );
}
