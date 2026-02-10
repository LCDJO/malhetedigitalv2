import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLodgeConfig } from "@/hooks/useLodgeConfig";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Loader2, CalendarRange, TrendingUp, TrendingDown, DollarSign,
  Users, AlertCircle, CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
} from "recharts";

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatCurrencyShort(v: number) {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`;
  return `R$ ${v.toFixed(0)}`;
}

const mesesLabel = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const mesesAbrev = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

interface Transaction {
  tipo: string;
  valor: number;
  data: string;
  status: string;
}

export default function RelatorioAnual() {
  const { config } = useLodgeConfig();
  const { profile } = useAuth();
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear().toString());
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeCount, setActiveCount] = useState(0);

  const anos = Array.from({ length: 5 }, (_, i) => (now.getFullYear() - 2 + i).toString());

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [txRes, memRes] = await Promise.all([
        supabase.from("member_transactions")
          .select("tipo, valor, data, status")
          .gte("data", `${ano}-01-01`)
          .lte("data", `${ano}-12-31`),
        supabase.from("members").select("id").eq("status", "ativo"),
      ]);
      setTransactions(txRes.data ?? []);
      setActiveCount(memRes.data?.length ?? 0);
      setLoading(false);
    })();
  }, [ano]);

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const m = (i + 1).toString().padStart(2, "0");
    const monthTx = transactions.filter((t) => t.data.startsWith(`${ano}-${m}`));
    const receitas = monthTx.filter((t) => t.tipo !== "despesa").reduce((s, t) => s + Number(t.valor), 0);
    const despesas = monthTx.filter((t) => t.tipo === "despesa").reduce((s, t) => s + Number(t.valor), 0);
    const pago = monthTx.filter((t) => t.status === "pago" && t.tipo !== "despesa").reduce((s, t) => s + Number(t.valor), 0);
    const aberto = monthTx.filter((t) => t.status === "em_aberto").reduce((s, t) => s + Number(t.valor), 0);
    return {
      mes: mesesLabel[i],
      mesAbrev: mesesAbrev[i],
      receitas,
      despesas,
      saldo: receitas - despesas,
      pago,
      aberto,
      qtd: monthTx.length,
    };
  });

  // Saldo acumulado
  let acumulado = 0;
  const chartData = monthlyData.map((m) => {
    acumulado += m.saldo;
    return { ...m, acumulado };
  });

  const totalReceitas = monthlyData.reduce((s, m) => s + m.receitas, 0);
  const totalDespesas = monthlyData.reduce((s, m) => s + m.despesas, 0);
  const totalSaldo = totalReceitas - totalDespesas;
  const totalPago = monthlyData.reduce((s, m) => s + m.pago, 0);
  const totalAberto = monthlyData.reduce((s, m) => s + m.aberto, 0);
  const receitaPrevistaAnual = activeCount * config.mensalidade_padrao * 12;
  const percentArrecadado = receitaPrevistaAnual > 0 ? ((totalPago / receitaPrevistaAnual) * 100).toFixed(1) : "0";

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Filtro */}
      <Card className="print:hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-sans font-semibold flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-primary" /> Exercício Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={ano} onValueChange={setAno}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anos.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Cabeçalho institucional */}
      <Card className="border-primary/20">
        <CardContent className="pt-6 pb-5">
          <div className="text-center space-y-1.5">
            <p className="text-lg font-bold font-serif tracking-wide">{config.lodge_name || "Loja Maçônica"}</p>
            <p className="text-sm text-muted-foreground">Nº {config.lodge_number} — Or∴ de {config.orient}</p>
            {config.potencia && <p className="text-xs text-muted-foreground">{config.potencia}</p>}
            <Separator className="my-3" />
            <p className="text-base font-semibold uppercase tracking-wider">
              Resumo Financeiro — Exercício {ano}
            </p>
            <p className="text-xs text-muted-foreground">
              Emitido em {format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} por {profile?.full_name}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          I — Resumo do Exercício
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-5 space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Arrecadado</p>
              </div>
              <p className="text-lg font-bold font-serif text-success">{formatCurrency(totalPago)}</p>
            </CardContent>
          </Card>
          <Card className={totalAberto > 0 ? "border-warning/30" : ""}>
            <CardContent className="pt-5 space-y-1">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Em Aberto</p>
              </div>
              <p className="text-lg font-bold font-serif text-warning">{formatCurrency(totalAberto)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 space-y-1">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Despesas</p>
              </div>
              <p className="text-lg font-bold font-serif">{formatCurrency(totalDespesas)}</p>
            </CardContent>
          </Card>
          <Card className={totalSaldo >= 0 ? "border-success/30" : "border-destructive/30"}>
            <CardContent className="pt-5 space-y-1">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Saldo</p>
              </div>
              <p className={`text-lg font-bold font-serif ${totalSaldo >= 0 ? "text-success" : "text-destructive"}`}>
                {formatCurrency(totalSaldo)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 space-y-1">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Membros</p>
              </div>
              <p className="text-lg font-bold font-serif">{activeCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 space-y-1">
              <div className="flex items-center gap-2">
                <CalendarRange className="h-4 w-4 text-primary" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Previsto</p>
              </div>
              <p className="text-lg font-bold font-serif">{formatCurrency(receitaPrevistaAnual)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Barra de progresso */}
      {receitaPrevistaAnual > 0 && (
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Arrecadação vs. Receita Prevista</p>
              <p className="text-sm font-bold">{percentArrecadado}%</p>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min(100, Number(percentArrecadado))}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {formatCurrency(totalPago)} arrecadado de {formatCurrency(receitaPrevistaAnual)} previsto
              ({activeCount} membros × {formatCurrency(config.mensalidade_padrao)} × 12 meses)
            </p>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de barras — Receitas vs Despesas */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          II — Comparativo Mensal
        </p>
        <Card className="print:hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-sans font-semibold">Receitas × Despesas — {ano}</CardTitle>
            <CardDescription>Comparativo mês a mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mesAbrev" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tickFormatter={formatCurrencyShort} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de linha — Saldo acumulado */}
      <Card className="print:hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-sans font-semibold">Saldo Acumulado — {ano}</CardTitle>
          <CardDescription>Evolução do saldo ao longo do exercício</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mesAbrev" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tickFormatter={formatCurrencyShort} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="acumulado"
                  name="Saldo Acumulado"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "hsl(var(--primary))" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabela mensal */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          III — Tabela Resumo Mensal
        </p>
        <Card>
          <CardContent className="pt-5">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead className="text-right">Arrecadado</TableHead>
                    <TableHead className="text-right">Em Aberto</TableHead>
                    <TableHead className="text-right">Despesas</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-right">Acumulado</TableHead>
                    <TableHead className="text-center">Lanç.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chartData.map((m) => (
                    <TableRow key={m.mes}>
                      <TableCell className="font-medium">{m.mes}</TableCell>
                      <TableCell className="text-right text-success">{formatCurrency(m.pago)}</TableCell>
                      <TableCell className="text-right text-warning">{formatCurrency(m.aberto)}</TableCell>
                      <TableCell className="text-right text-destructive">{formatCurrency(m.despesas)}</TableCell>
                      <TableCell className={`text-right font-medium ${m.saldo >= 0 ? "text-success" : "text-destructive"}`}>
                        {formatCurrency(m.saldo)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${m.acumulado >= 0 ? "text-success" : "text-destructive"}`}>
                        {formatCurrency(m.acumulado)}
                      </TableCell>
                      <TableCell className="text-center">{m.qtd}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/30 font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right text-success">{formatCurrency(totalPago)}</TableCell>
                    <TableCell className="text-right text-warning">{formatCurrency(totalAberto)}</TableCell>
                    <TableCell className="text-right text-destructive">{formatCurrency(totalDespesas)}</TableCell>
                    <TableCell className={`text-right ${totalSaldo >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatCurrency(totalSaldo)}
                    </TableCell>
                    <TableCell className={`text-right ${acumulado >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatCurrency(acumulado)}
                    </TableCell>
                    <TableCell className="text-center">{transactions.length}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rodapé */}
      <div className="text-center text-[10px] text-muted-foreground pt-4 border-t space-y-1">
        <Separator className="mb-4" />
        <p className="font-medium">Documento para fechamento de exercício financeiro</p>
        <p>Gerado automaticamente pelo sistema Malhete Digital</p>
        <p>{config.lodge_name} — Nº {config.lodge_number} — Or∴ de {config.orient}</p>
        <p>Emitido em {format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
      </div>
    </div>
  );
}
