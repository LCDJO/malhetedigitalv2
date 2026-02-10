import { Button } from "@/components/ui/button";
import { BookOpen, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs";
import { DashboardAlerts } from "@/components/dashboard/DashboardAlerts";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { DashboardInadimplencia } from "@/components/dashboard/DashboardInadimplencia";
import { DashboardCategorias } from "@/components/dashboard/DashboardCategorias";
import { DashboardLancamentos } from "@/components/dashboard/DashboardLancamentos";

const Index = () => {
  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-serif font-bold">Dashboard Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão consolidada — Fevereiro 2026</p>
        </div>
        <div className="flex gap-2">
          <Link to="/secretaria">
            <Button variant="outline" size="sm" className="gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              Secretaria
            </Button>
          </Link>
          <Link to="/tesouraria">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Wallet className="h-3.5 w-3.5" />
              Tesouraria
            </Button>
          </Link>
        </div>
      </div>

      {/* 1. KPIs */}
      <DashboardKPIs />

      {/* Alertas Estratégicos */}
      <DashboardAlerts />

      {/* 2. Gráficos de Evolução */}
      <DashboardCharts />

      {/* 3. Indicadores de Inadimplência */}
      <DashboardInadimplencia />

      {/* 4. Resumo por Categorias */}
      <DashboardCategorias />

      {/* 5. Últimos Lançamentos */}
      <DashboardLancamentos />
    </div>
  );
};

export default Index;
