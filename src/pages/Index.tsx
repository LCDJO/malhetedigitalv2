import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, AlertCircle, TrendingUp, BookOpen, Wallet, ArrowRight,
  AlertTriangle, CheckCircle2, Clock, DollarSign,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";

// ── Mock Data ──

const receitaMensal = [
  { mes: "Set", valor: 10200 },
  { mes: "Out", valor: 11400 },
  { mes: "Nov", valor: 10800 },
  { mes: "Dez", valor: 13200 },
  { mes: "Jan", valor: 11230 },
  { mes: "Fev", valor: 12580 },
];

const composicaoReceita = [
  { name: "Mensalidades", value: 9800, color: "hsl(220, 55%, 22%)" },
  { name: "Taxas", value: 1680, color: "hsl(43, 72%, 50%)" },
  { name: "Valores Avulsos", value: 1100, color: "hsl(220, 14%, 70%)" },
];

const inadimplentes = [
  { nome: "Ir∴ Pedro Alves", meses: 3, valor: 840 },
  { nome: "Ir∴ Ricardo Lima", meses: 2, valor: 560 },
  { nome: "Ir∴ Fernando Costa", meses: 2, valor: 560 },
  { nome: "Ir∴ Marcos Oliveira", meses: 1, valor: 280 },
  { nome: "Ir∴ Gustavo Reis", meses: 1, valor: 280 },
];

const fluxoCaixa = [
  { mes: "Set", entrada: 10200, saida: 7800 },
  { mes: "Out", entrada: 11400, saida: 8200 },
  { mes: "Nov", entrada: 10800, saida: 9100 },
  { mes: "Dez", entrada: 13200, saida: 10500 },
  { mes: "Jan", entrada: 11230, saida: 8900 },
  { mes: "Fev", entrada: 12580, saida: 9200 },
];

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

const Index = () => {
  const totalInadimplente = inadimplentes.reduce((s, i) => s + i.valor, 0);
  const saldoAtual = 12580 - 9200;
  const taxaAdimplencia = ((47 - inadimplentes.length) / 47 * 100).toFixed(1);

  return (
    <div className="space-y-7 max-w-6xl mx-auto">
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

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Arrecadação Mensal"
          value="R$ 12.580"
          description="Fev/2026"
          icon={TrendingUp}
          trend={{ value: "12% vs Jan", positive: true }}
          className="[animation-delay:0ms]"
        />
        <StatCard
          title="Inadimplência"
          value={formatCurrency(totalInadimplente)}
          description={`${inadimplentes.length} irmãos em atraso`}
          icon={AlertCircle}
          trend={{ value: `${(100 - parseFloat(taxaAdimplencia)).toFixed(1)}% do quadro`, positive: false }}
          className="[animation-delay:80ms]"
        />
        <StatCard
          title="Saldo do Mês"
          value={formatCurrency(saldoAtual)}
          description="Receitas − Despesas"
          icon={DollarSign}
          trend={{ value: "Positivo", positive: true }}
          className="[animation-delay:160ms]"
        />
        <StatCard
          title="Adimplência"
          value={`${taxaAdimplencia}%`}
          description={`${47 - inadimplentes.length} de 47 em dia`}
          icon={Users}
          className="[animation-delay:240ms]"
        />
      </div>

      {/* Alertas Estratégicos */}
      {inadimplentes.some((i) => i.meses >= 3) && (
        <Card className="border-destructive/30 bg-destructive/5 animate-fade-in [animation-delay:300ms]">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" strokeWidth={1.8} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">Atenção: Inadimplência Crítica</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {inadimplentes.filter((i) => i.meses >= 3).length} irmão(s) com 3+ meses em atraso, totalizando{" "}
                <strong>{formatCurrency(inadimplentes.filter((i) => i.meses >= 3).reduce((s, i) => s + i.valor, 0))}</strong>.
                Considere notificação formal conforme regimento.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Evolução da Receita */}
        <Card className="lg:col-span-2 animate-fade-in [animation-delay:350ms]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-sans font-semibold">Evolução da Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={receitaMensal} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="receitaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(220, 55%, 22%)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="hsl(220, 55%, 22%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 88%)" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(220, 10%, 48%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(220, 10%, 48%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="valor" name="Receita" stroke="hsl(220, 55%, 22%)" strokeWidth={2} fill="url(#receitaGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Composição */}
        <Card className="animate-fade-in [animation-delay:400ms]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-sans font-semibold">Composição da Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={composicaoReceita} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {composicaoReceita.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              {composicaoReceita.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fluxo de Caixa + Inadimplentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Fluxo de Caixa */}
        <Card className="lg:col-span-2 animate-fade-in [animation-delay:450ms]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-sans font-semibold">Fluxo de Caixa — Entradas vs Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fluxoCaixa} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 88%)" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(220, 10%, 48%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(220, 10%, 48%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="entrada" name="Entradas" fill="hsl(220, 55%, 22%)" radius={[3, 3, 0, 0]} barSize={20} />
                  <Bar dataKey="saida" name="Saídas" fill="hsl(220, 14%, 78%)" radius={[3, 3, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-5 mt-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-sm bg-primary" />
                Entradas
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "hsl(220, 14%, 78%)" }} />
                Saídas
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inadimplentes */}
        <Card className="animate-fade-in [animation-delay:500ms]">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-sans font-semibold">Irmãos Inadimplentes</CardTitle>
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">
              {inadimplentes.length} pendentes
            </Badge>
          </CardHeader>
          <CardContent className="space-y-1">
            {inadimplentes.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 py-2.5 border-b last:border-0">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${item.meses >= 3 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                  {item.meses}m
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.nome}</p>
                  <p className="text-[10px] text-muted-foreground">{item.meses} mês(es) em atraso</p>
                </div>
                <span className="text-xs font-semibold text-foreground">{formatCurrency(item.valor)}</span>
              </div>
            ))}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Total em aberto</span>
                <span className="font-bold text-destructive">{formatCurrency(totalInadimplente)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Atalhos */}
      <div>
        <h2 className="admin-section-title mb-3">Acesso Rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/secretaria" className="group">
            <Card className="transition-all hover:border-primary/25 group-focus-visible:ring-2 group-focus-visible:ring-ring">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-150">
                  <BookOpen className="h-5 w-5" strokeWidth={1.8} />
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
            <Card className="transition-all hover:border-primary/25 group-focus-visible:ring-2 group-focus-visible:ring-ring">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-150">
                  <Wallet className="h-5 w-5" strokeWidth={1.8} />
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
