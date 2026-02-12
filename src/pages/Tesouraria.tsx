import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { User, Building2, LayoutDashboard, Receipt, Users, ShieldCheck, FileText } from "lucide-react";
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
import { LancamentoIndividual } from "@/components/tesouraria/LancamentoIndividual";
import { LancamentoLote } from "@/components/tesouraria/LancamentoLote";
import { TaxasMaconicas } from "@/components/tesouraria/TaxasMaconicas";
import { IsencaoIrmao } from "@/components/secretaria/IsencaoIrmao";
import { PermissionGate } from "@/components/PermissionGate";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type ActionView = null | "individual" | "lote" | "taxas" | "isencoes";

const actionCards = [
  {
    key: "individual" as const,
    icon: FileText,
    title: "Lançamento Individual",
    description: "Registrar lançamento para um obreiro específico",
  },
  {
    key: "lote" as const,
    icon: Users,
    title: "Lançamento em Lote",
    description: "Gerar lançamentos para múltiplos obreiros de uma vez",
  },
  {
    key: "taxas" as const,
    icon: Receipt,
    title: "Taxas Maçônicas",
    description: "Gerenciar e aplicar taxas maçônicas obrigatórias",
  },
  {
    key: "isencoes" as const,
    icon: ShieldCheck,
    title: "Isenções",
    description: "Configurar isenções de cobrança para obreiros",
  },
];

const Tesouraria = () => {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [actionView, setActionView] = useState<ActionView>(null);

  // If an action card was clicked, show that view
  if (actionView) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => setActionView(null)}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-serif font-bold">
              {actionCards.find((c) => c.key === actionView)?.title}
            </h1>
          </div>
        </div>

        <PermissionGate module="tesouraria" action="write" hide>
          {actionView === "individual" && <LancamentoIndividual onLancamentoSaved={() => {}} />}
          {actionView === "lote" && <LancamentoLote />}
          {actionView === "taxas" && <TaxasMaconicas />}
          {actionView === "isencoes" && <IsencaoIrmao />}
        </PermissionGate>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold">Tesouraria</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestão financeira dos irmãos e da Loja</p>
      </div>

      {/* Action Cards */}
      <PermissionGate module="tesouraria" action="write" hide>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actionCards.map((card) => (
            <Card
              key={card.key}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group"
              onClick={() => setActionView(card.key)}
            >
              <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <card.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{card.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{card.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </PermissionGate>

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
