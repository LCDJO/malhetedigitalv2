import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLodgeConfig } from "@/hooks/useLodgeConfig";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CalendarRange, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const mesesLabel = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface Transaction {
  tipo: string;
  valor: number;
  data: string;
  status: string;
}

export default function RelatorioAnual() {
  const { config } = useLodgeConfig();
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

  // Group by month
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const m = (i + 1).toString().padStart(2, "0");
    const monthTx = transactions.filter((t) => t.data.startsWith(`${ano}-${m}`));
    const receitas = monthTx.filter((t) => t.tipo !== "despesa").reduce((s, t) => s + Number(t.valor), 0);
    const despesas = monthTx.filter((t) => t.tipo === "despesa").reduce((s, t) => s + Number(t.valor), 0);
    const pago = monthTx.filter((t) => t.status === "pago" && t.tipo !== "despesa").reduce((s, t) => s + Number(t.valor), 0);
    return { mes: mesesLabel[i], receitas, despesas, saldo: receitas - despesas, pago, qtd: monthTx.length };
  });

  const totalReceitas = monthlyData.reduce((s, m) => s + m.receitas, 0);
  const totalDespesas = monthlyData.reduce((s, m) => s + m.despesas, 0);
  const totalSaldo = totalReceitas - totalDespesas;
  const receitaPrevistaAnual = activeCount * config.mensalidade_padrao * 12;

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Filtro */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-sans font-semibold flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-primary" /> Filtros — Resumo Anual
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

      {/* KPIs anuais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Receitas {ano}</p>
            </div>
            <p className="text-xl font-bold font-serif">{formatCurrency(totalReceitas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 space-y-1">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Despesas {ano}</p>
            </div>
            <p className="text-xl font-bold font-serif">{formatCurrency(totalDespesas)}</p>
          </CardContent>
        </Card>
        <Card className={totalSaldo >= 0 ? "border-success/30" : "border-destructive/30"}>
          <CardContent className="pt-5 space-y-1">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Saldo Anual</p>
            </div>
            <p className={`text-xl font-bold font-serif ${totalSaldo >= 0 ? "text-success" : "text-destructive"}`}>
              {formatCurrency(totalSaldo)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 space-y-1">
            <div className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-primary" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Receita Prevista</p>
            </div>
            <p className="text-xl font-bold font-serif">{formatCurrency(receitaPrevistaAnual)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela mensal */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-sans font-semibold">Evolução Mensal — {ano}</CardTitle>
          <CardDescription>Receitas, despesas e saldo de cada mês</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Receitas</TableHead>
                  <TableHead className="text-right">Despesas</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-center">Lançamentos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData.map((m) => (
                  <TableRow key={m.mes}>
                    <TableCell className="font-medium">{m.mes}</TableCell>
                    <TableCell className="text-right text-success">{formatCurrency(m.receitas)}</TableCell>
                    <TableCell className="text-right text-destructive">{formatCurrency(m.despesas)}</TableCell>
                    <TableCell className={`text-right font-medium ${m.saldo >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatCurrency(m.saldo)}
                    </TableCell>
                    <TableCell className="text-center">{m.qtd}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right text-success">{formatCurrency(totalReceitas)}</TableCell>
                  <TableCell className="text-right text-destructive">{formatCurrency(totalDespesas)}</TableCell>
                  <TableCell className={`text-right ${totalSaldo >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatCurrency(totalSaldo)}
                  </TableCell>
                  <TableCell className="text-center">{transactions.length}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
