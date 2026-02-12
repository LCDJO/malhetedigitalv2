import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Building2, LayoutDashboard } from "lucide-react";
import { FinanceiroIrmaoTab } from "@/components/tesouraria/FinanceiroIrmaoTab";
import FinanceiroGeral from "./FinanceiroGeral";
import { DashboardFilterBar } from "@/components/dashboard/DashboardFilterBar";
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs";
import { DashboardAlerts } from "@/components/dashboard/DashboardAlerts";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { DashboardInadimplencia } from "@/components/dashboard/DashboardInadimplencia";
import { DashboardCategorias } from "@/components/dashboard/DashboardCategorias";
import { DashboardLancamentos } from "@/components/dashboard/DashboardLancamentos";
import { type DashboardFilters, defaultFilters } from "@/components/dashboard/DashboardFilterTypes";

const Tesouraria = () => {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold">Tesouraria</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestão financeira dos irmãos e da Loja</p>
      </div>

      <Tabs defaultValue="resumo" className="space-y-4">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="resumo" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <LayoutDashboard className="h-4 w-4" />
            Resumo Financeiro
          </TabsTrigger>
          <TabsTrigger value="irmao" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <User className="h-4 w-4" />
            Financeiro do Irmão
          </TabsTrigger>
          <TabsTrigger value="loja" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Building2 className="h-4 w-4" />
            Financeiro da Loja
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-6">
          <DashboardFilterBar filters={filters} onChange={setFilters} />
          <DashboardKPIs filters={filters} />
          <DashboardAlerts filters={filters} />
          <DashboardCharts filters={filters} />
          <DashboardInadimplencia filters={filters} />
          <DashboardCategorias filters={filters} />
          <DashboardLancamentos filters={filters} />
        </TabsContent>

        <TabsContent value="irmao">
          <FinanceiroIrmaoTab />
        </TabsContent>

        <TabsContent value="loja">
          <FinanceiroGeral embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tesouraria;
