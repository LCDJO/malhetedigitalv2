import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Wallet,
  CalendarIcon,
  List,
  FileText,
  BarChart3,
  Loader2,
} from "lucide-react";

interface Transaction {
  id: string;
  data: string;
  tipo: string;
  descricao: string;
  valor: number;
  status: string;
  member_id: string;
  member_name?: string;
}

const tipoLabels: Record<string, string> = { mensalidade: "Mensalidade", avulso: "Valor Avulso", taxa: "Taxa" };

const presetPeriods = [
  { value: "mes_atual", label: "Mês atual" },
  { value: "mes_anterior", label: "Mês anterior" },
  { value: "trimestre", label: "Último trimestre" },
  { value: "semestre", label: "Último semestre" },
  { value: "ano_atual", label: "Ano atual" },
  { value: "personalizado", label: "Personalizado" },
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function getDateRange(preset: string): { from: Date; to: Date } {
  const now = new Date();
  switch (preset) {
    case "mes_anterior": {
      const prev = subMonths(now, 1);
      return { from: startOfMonth(prev), to: endOfMonth(prev) };
    }
    case "trimestre":
      return { from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now) };
    case "semestre":
      return { from: startOfMonth(subMonths(now, 5)), to: endOfMonth(now) };
    case "ano_atual":
      return { from: startOfYear(now), to: endOfYear(now) };
    case "mes_atual":
    default:
      return { from: startOfMonth(now), to: endOfMonth(now) };
  }
}

const FinanceiroGeral = () => {
  const [preset, setPreset] = useState("mes_atual");
  const [customFrom, setCustomFrom] = useState<Date>(startOfMonth(new Date()));
  const [customTo, setCustomTo] = useState<Date>(endOfMonth(new Date()));
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const dateRange = useMemo(() => {
    if (preset === "personalizado") return { from: customFrom, to: customTo };
    return getDateRange(preset);
  }, [preset, customFrom, customTo]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const fromStr = format(dateRange.from, "yyyy-MM-dd");
    const toStr = format(dateRange.to, "yyyy-MM-dd");

    const { data } = await supabase
      .from("member_transactions")
      .select("id, data, tipo, descricao, valor, status, member_id")
      .gte("data", fromStr)
      .lte("data", toStr)
      .order("data", { ascending: true });

    if (data) {
      // Fetch member names
      const memberIds = [...new Set(data.map((t) => t.member_id))];
      const { data: members } = await supabase
        .from("members")
        .select("id, full_name")
        .in("id", memberIds);
      const nameMap = new Map(members?.map((m) => [m.id, m.full_name]) ?? []);

      setTransactions(data.map((t) => ({ ...t, member_name: nameMap.get(t.member_id) ?? "—" })));
    }
    setLoading(false);
  }, [dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // KPI calculations
  const kpis = useMemo(() => {
    let receitas = 0;
    let despesas = 0;
    for (const t of transactions) {
      if (t.status === "pago") {
        receitas += Number(t.valor);
      } else {
        despesas += Number(t.valor);
      }
    }
    const resultado = receitas - despesas;
    return { receitas, despesas, resultado };
  }, [transactions]);

  // Cumulative balance for demonstrativo
  const transactionsWithSaldo = useMemo(() => {
    let saldo = 0;
    return transactions.map((t) => {
      const valor = Number(t.valor);
      if (t.status === "pago") saldo += valor; else saldo -= valor;
      return { ...t, saldoAcumulado: saldo };
    });
  }, [transactions]);

  // Monthly cash flow
  const fluxoMensal = useMemo(() => {
    const map = new Map<string, { receitas: number; despesas: number }>();
    for (const t of transactions) {
      const key = t.data.slice(0, 7); // yyyy-MM
      const entry = map.get(key) ?? { receitas: 0, despesas: 0 };
      if (t.status === "pago") entry.receitas += Number(t.valor);
      else entry.despesas += Number(t.valor);
      map.set(key, entry);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, v]) => ({ mes, ...v, resultado: v.receitas - v.despesas }));
  }, [transactions]);

  const periodLabel = preset === "personalizado"
    ? `${format(dateRange.from, "dd/MM/yyyy")} — ${format(dateRange.to, "dd/MM/yyyy")}`
    : presetPeriods.find((p) => p.value === preset)?.label ?? "";

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold">Financeiro Geral</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão consolidada das finanças da Loja</p>
      </div>

      {/* Period filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Período</label>
              <Select value={preset} onValueChange={setPreset}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {presetPeriods.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {preset === "personalizado" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">De</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-40 justify-start font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(customFrom, "dd/MM/yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={customFrom} onSelect={(d) => d && setCustomFrom(d)} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Até</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-40 justify-start font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(customTo, "dd/MM/yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={customTo} onSelect={(d) => d && setCustomTo(d)} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Carregando dados financeiros...</span>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xl font-bold text-success">{fmt(kpis.receitas)}</p>
                  <p className="text-xs text-muted-foreground">Total Receitas</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xl font-bold text-destructive">{fmt(kpis.despesas)}</p>
                  <p className="text-xs text-muted-foreground">Total Despesas</p>
                </div>
              </CardContent>
            </Card>
            <Card className={kpis.resultado < 0 ? "border-destructive/30 bg-destructive/5" : ""}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", kpis.resultado >= 0 ? "bg-success/10" : "bg-destructive/10")}>
                  <Scale className={cn("h-5 w-5", kpis.resultado >= 0 ? "text-success" : "text-destructive")} />
                </div>
                <div>
                  <p className={cn("text-xl font-bold", kpis.resultado >= 0 ? "text-success" : "text-destructive")}>{fmt(kpis.resultado)}</p>
                  <p className="text-xs text-muted-foreground">{kpis.resultado >= 0 ? "Superávit" : "Déficit"}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold">{fmt(transactionsWithSaldo.length > 0 ? transactionsWithSaldo[transactionsWithSaldo.length - 1].saldoAcumulado : 0)}</p>
                  <p className="text-xs text-muted-foreground">Saldo Acumulado</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="lancamentos" className="space-y-4">
            <TabsList className="bg-muted/60">
              <TabsTrigger value="lancamentos" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <List className="h-4 w-4" /> Lançamentos
              </TabsTrigger>
              <TabsTrigger value="demonstrativo" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <FileText className="h-4 w-4" /> Demonstrativo
              </TabsTrigger>
              <TabsTrigger value="fluxo" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <BarChart3 className="h-4 w-4" /> Fluxo de Caixa
              </TabsTrigger>
            </TabsList>

            {/* Lançamentos */}
            <TabsContent value="lancamentos">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-sans font-semibold">Lançamentos — {periodLabel}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Obreiro</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead>Situação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                              Nenhum lançamento encontrado no período.
                            </TableCell>
                          </TableRow>
                        ) : transactions.map((t) => {
                          const isDebito = t.status === "em aberto";
                          return (
                            <TableRow key={t.id}>
                              <TableCell className="text-sm">{format(new Date(t.data), "dd/MM/yyyy")}</TableCell>
                              <TableCell className="text-sm font-medium">{t.member_name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn("text-[10px]", isDebito ? "text-destructive border-destructive/30" : "text-success border-success/30")}>
                                  {isDebito ? "Débito" : "Crédito"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{tipoLabels[t.tipo] ?? t.tipo}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{t.descricao || "—"}</TableCell>
                              <TableCell className={cn("text-right text-sm font-medium", isDebito ? "text-destructive" : "text-success")}>
                                {isDebito ? "−" : "+"} {fmt(Number(t.valor))}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn("text-[10px]", t.status === "pago" ? "text-success border-success/30" : "text-warning border-warning/30")}>
                                  {t.status === "pago" ? "Pago" : "Em Aberto"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Demonstrativo */}
            <TabsContent value="demonstrativo">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-sans font-semibold">Demonstrativo Financeiro — {periodLabel}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Obreiro</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="text-right">Saldo Acumulado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactionsWithSaldo.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                              Nenhuma movimentação no período.
                            </TableCell>
                          </TableRow>
                        ) : transactionsWithSaldo.map((t) => {
                          const isDebito = t.status === "em aberto";
                          return (
                            <TableRow key={t.id}>
                              <TableCell className="text-sm">{format(new Date(t.data), "dd/MM/yyyy")}</TableCell>
                              <TableCell className="text-sm font-medium">{t.member_name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn("text-[10px]", isDebito ? "text-destructive border-destructive/30" : "text-success border-success/30")}>
                                  {isDebito ? "Débito" : "Crédito"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{t.descricao || "—"}</TableCell>
                              <TableCell className={cn("text-right text-sm font-medium", isDebito ? "text-destructive" : "text-success")}>
                                {isDebito ? "−" : "+"} {fmt(Number(t.valor))}
                              </TableCell>
                              <TableCell className={cn("text-right text-sm font-semibold", t.saldoAcumulado < 0 ? "text-destructive" : "text-foreground")}>
                                {fmt(t.saldoAcumulado)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Fluxo de Caixa */}
            <TabsContent value="fluxo">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-sans font-semibold">Fluxo de Caixa Mensal — {periodLabel}</CardTitle>
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
                        {fluxoMensal.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                              Nenhuma movimentação no período.
                            </TableCell>
                          </TableRow>
                        ) : (
                          <>
                            {fluxoMensal.map((m) => {
                              const [year, month] = m.mes.split("-");
                              const monthLabel = format(new Date(Number(year), Number(month) - 1, 1), "MMMM yyyy", { locale: ptBR });
                              return (
                                <TableRow key={m.mes}>
                                  <TableCell className="text-sm font-medium capitalize">{monthLabel}</TableCell>
                                  <TableCell className="text-right text-sm text-success font-medium">{fmt(m.receitas)}</TableCell>
                                  <TableCell className="text-right text-sm text-destructive font-medium">{fmt(m.despesas)}</TableCell>
                                  <TableCell className={cn("text-right text-sm font-bold", m.resultado >= 0 ? "text-success" : "text-destructive")}>
                                    {fmt(m.resultado)}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            <TableRow className="bg-muted/40 font-semibold">
                              <TableCell className="text-sm">Total</TableCell>
                              <TableCell className="text-right text-sm text-success">{fmt(kpis.receitas)}</TableCell>
                              <TableCell className="text-right text-sm text-destructive">{fmt(kpis.despesas)}</TableCell>
                              <TableCell className={cn("text-right text-sm", kpis.resultado >= 0 ? "text-success" : "text-destructive")}>{fmt(kpis.resultado)}</TableCell>
                            </TableRow>
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default FinanceiroGeral;
