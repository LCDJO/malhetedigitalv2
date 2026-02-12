import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileBarChart } from "lucide-react";
import { format, startOfYear, endOfYear } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function PortalPrestacaoContas() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const from = format(startOfYear(new Date(year, 0)), "yyyy-MM-dd");
      const to = format(endOfYear(new Date(year, 0)), "yyyy-MM-dd");

      const { data } = await supabase
        .from("member_transactions")
        .select("data, tipo, valor, status")
        .gte("data", from)
        .lte("data", to)
        .order("data", { ascending: true })
        .limit(1000);

      setTransactions(data ?? []);
      setLoading(false);
    };
    fetch();
  }, [year]);

  const monthlyData = useMemo(() => {
    const map = new Map<number, { receitas: number; despesas: number }>();
    for (let i = 0; i < 12; i++) map.set(i, { receitas: 0, despesas: 0 });

    for (const t of transactions) {
      const month = new Date(t.data).getMonth();
      const entry = map.get(month)!;
      if (t.status === "pago") entry.receitas += Number(t.valor);
      else entry.despesas += Number(t.valor);
    }

    return Array.from(map.entries()).map(([m, v]) => ({
      mes: meses[m],
      ...v,
      resultado: v.receitas - v.despesas,
    }));
  }, [transactions]);

  const totals = useMemo(() => {
    return monthlyData.reduce(
      (acc, m) => ({
        receitas: acc.receitas + m.receitas,
        despesas: acc.despesas + m.despesas,
        resultado: acc.resultado + m.resultado,
      }),
      { receitas: 0, despesas: 0, resultado: 0 }
    );
  }, [monthlyData]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold">Prestação de Contas</h1>
          <p className="text-sm text-muted-foreground mt-1">Resumo financeiro anual da Loja</p>
        </div>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-sans flex items-center gap-2">
              <FileBarChart className="h-4 w-4" />
              Demonstrativo Mensal — {year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead className="text-right">Receitas</TableHead>
                    <TableHead className="text-right">Despesas</TableHead>
                    <TableHead className="text-right">Resultado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map((m) => (
                    <TableRow key={m.mes}>
                      <TableCell className="text-sm font-medium">{m.mes}</TableCell>
                      <TableCell className="text-right text-sm text-success">{fmt(m.receitas)}</TableCell>
                      <TableCell className="text-right text-sm text-destructive">{fmt(m.despesas)}</TableCell>
                      <TableCell className={`text-right text-sm font-medium ${m.resultado >= 0 ? "text-success" : "text-destructive"}`}>
                        {fmt(m.resultado)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell className="text-sm">Total</TableCell>
                    <TableCell className="text-right text-sm text-success">{fmt(totals.receitas)}</TableCell>
                    <TableCell className="text-right text-sm text-destructive">{fmt(totals.despesas)}</TableCell>
                    <TableCell className={`text-right text-sm ${totals.resultado >= 0 ? "text-success" : "text-destructive"}`}>
                      {fmt(totals.resultado)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
