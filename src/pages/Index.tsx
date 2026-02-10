import { StatCard } from "@/components/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Users, AlertCircle, TrendingUp, BookOpen, Wallet, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold">Painel Geral</h1>
        <p className="text-sm text-muted-foreground mt-1">Resumo da Loja Estrela do Oriente nº 123</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Irmãos Cadastrados"
          value="47"
          description="Membros ativos no quadro"
          icon={Users}
          className="[animation-delay:0ms]"
        />
        <StatCard
          title="Total em Aberto"
          value="R$ 3.250,00"
          description="Mensalidades pendentes"
          icon={AlertCircle}
          trend={{ value: "5 inadimplentes", positive: false }}
          className="[animation-delay:100ms]"
        />
        <StatCard
          title="Total Arrecadado"
          value="R$ 12.580,00"
          description="Arrecadação em Fev/2026"
          icon={TrendingUp}
          trend={{ value: "12% vs mês anterior", positive: true }}
          className="[animation-delay:200ms]"
        />
      </div>

      {/* Atalhos Rápidos */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Atalhos Rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/secretaria" className="group">
            <Card className="transition-all hover:shadow-md hover:border-primary/30 group-focus-visible:ring-2 group-focus-visible:ring-ring">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Acessar Secretaria</p>
                  <p className="text-xs text-muted-foreground">Gestão de membros e documentos</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>

          <Link to="/tesouraria" className="group">
            <Card className="transition-all hover:shadow-md hover:border-primary/30 group-focus-visible:ring-2 group-focus-visible:ring-ring">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Acessar Tesouraria</p>
                  <p className="text-xs text-muted-foreground">Financeiro e mensalidades</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
