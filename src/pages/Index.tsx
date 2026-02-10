import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardFilterBar } from "@/components/dashboard/DashboardFilterBar";
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs";
import { DashboardAlerts } from "@/components/dashboard/DashboardAlerts";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { DashboardInadimplencia } from "@/components/dashboard/DashboardInadimplencia";
import { DashboardCategorias } from "@/components/dashboard/DashboardCategorias";
import { DashboardLancamentos } from "@/components/dashboard/DashboardLancamentos";
import { type DashboardFilters, defaultFilters } from "@/components/dashboard/DashboardFilterTypes";

const periodoLabel: Record<string, string> = {
  mes_atual: "Fevereiro 2026",
  ultimo_trimestre: "Dez 2025 – Fev 2026",
  personalizado: "Período personalizado",
};

const Index = () => {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);

  const isFiltered = filters.periodo !== "mes_atual" || filters.tipoLancamento !== "todos" || filters.situacao !== "todos";

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold">Dashboard Financeiro</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground">
              Visão consolidada — {periodoLabel[filters.periodo] ?? "Todos os períodos"}
            </p>
            {isFiltered && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Filtros ativos
              </Badge>
            )}
          </div>
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

      {/* Filtros Globais */}
      <DashboardFilterBar filters={filters} onChange={setFilters} />

      {/* 1. KPIs */}
      <DashboardKPIs filters={filters} />

      {/* Alertas Estratégicos */}
      <DashboardAlerts filters={filters} />

      {/* 2. Gráficos de Evolução */}
      <DashboardCharts filters={filters} />

      {/* 3. Indicadores de Inadimplência */}
      <DashboardInadimplencia filters={filters} />

      {/* 4. Resumo por Categorias */}
      <DashboardCategorias filters={filters} />

      {/* 5. Últimos Lançamentos */}
      <DashboardLancamentos filters={filters} />
    </div>
  );
};

export default Index;
