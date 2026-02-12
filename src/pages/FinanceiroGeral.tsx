import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CancelarLancamento } from "@/components/tesouraria/CancelarLancamento";
import { PermissionGate } from "@/components/PermissionGate";
import { DemonstrativoTab } from "@/components/financeiro/DemonstrativoTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
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
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { NovoLancamentoLoja } from "@/components/tesouraria/NovoLancamentoLoja";

interface Transaction {
  id: string;
  data: string;
  tipo: string;
  descricao: string;
  valor: number;
  status: string;
  member_id: string;
  member_name?: string;
  conta_plano_id: string | null;
  conta_nome?: string;
  created_by: string | null;
  created_by_name?: string;
}

interface ContaPlano {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  conta_pai_id: string | null;
  status: string;
}

interface ConsolidadoNode {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  total: number;
  children: ConsolidadoNode[];
  depth: number;
}

const tipoLabels: Record<string, string> = { mensalidade: "Mensalidade", avulso: "Valor Avulso", taxa: "Taxa" };

const presetPeriods = [
  { value: "mes", label: "Mês" },
  { value: "ano", label: "Ano" },
  { value: "personalizado", label: "Personalizado" },
];

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface FinanceiroGeralProps {
  embedded?: boolean;
}

const FinanceiroGeral = ({ embedded = false }: FinanceiroGeralProps) => {
  const now = new Date();
  const [preset, setPreset] = useState("mes");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [customFrom, setCustomFrom] = useState<Date>(startOfMonth(now));
  const [customTo, setCustomTo] = useState<Date>(endOfMonth(now));
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [planoContas, setPlanoContas] = useState<ContaPlano[]>([]);
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [filterConta, setFilterConta] = useState<string>("todas");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [cancelTarget, setCancelTarget] = useState<Transaction | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [serverKpis, setServerKpis] = useState<{ receitas: number; despesas: number; total: number } | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const dateRange = useMemo(() => {
    if (preset === "mes") {
      const d = new Date(selectedYear, selectedMonth, 1);
      return { from: startOfMonth(d), to: endOfMonth(d) };
    }
    if (preset === "ano") {
      const d = new Date(selectedYear, 0, 1);
      return { from: startOfYear(d), to: endOfYear(d) };
    }
    return { from: customFrom, to: customTo };
  }, [preset, selectedMonth, selectedYear, customFrom, customTo]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const fromStr = format(dateRange.from, "yyyy-MM-dd");
    const toStr = format(dateRange.to, "yyyy-MM-dd");

    // Fetch KPIs via server-side aggregate + transactions + contas in parallel
    const [kpiResult, txResult, contasResult] = await Promise.all([
      supabase.rpc("financial_kpis", { _from: fromStr, _to: toStr }),
      supabase
        .from("member_transactions")
        .select("id, data, tipo, descricao, valor, status, member_id, conta_plano_id, created_by")
        .gte("data", fromStr)
        .lte("data", toStr)
        .order("data", { ascending: true })
        .limit(1000),
      supabase
        .from("plano_contas")
        .select("id, codigo, nome, tipo, conta_pai_id, status")
        .eq("status", "ativo")
        .order("codigo", { ascending: true }),
    ]);

    // Store server-side KPIs
    if (kpiResult.data && kpiResult.data.length > 0) {
      const k = kpiResult.data[0];
      setServerKpis({
        receitas: Number(k.total_receitas),
        despesas: Number(k.total_despesas),
        total: Number(k.total_transacoes),
      });
    }

    const contasData = contasResult.data ?? [];
    setPlanoContas(contasData);
    const contaMap = new Map(contasData.map((c) => [c.id, c.nome]));

    if (txResult.data) {
      const memberIds = [...new Set(txResult.data.map((t) => t.member_id))];
      const createdByIds = [...new Set(txResult.data.map((t) => t.created_by).filter(Boolean))] as string[];
      
      const [membersRes, profilesRes] = await Promise.all([
        memberIds.length > 0
          ? supabase.from("members").select("id, full_name").in("id", memberIds)
          : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
        createdByIds.length > 0
          ? supabase.from("profiles").select("id, full_name").in("id", createdByIds)
          : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
      ]);

      const nameMap = new Map(membersRes.data?.map((m) => [m.id, m.full_name]) ?? []);
      const profileMap = new Map(profilesRes.data?.map((p) => [p.id, p.full_name]) ?? []);

      setTransactions(txResult.data.map((t) => ({
        ...t,
        member_name: nameMap.get(t.member_id) ?? "—",
        conta_nome: t.conta_plano_id ? contaMap.get(t.conta_plano_id) ?? "—" : "—",
        created_by_name: t.created_by ? profileMap.get(t.created_by) ?? "—" : "—",
      })));
    }
    setLoading(false);
  }, [dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // KPI calculations — prefer server-side aggregates (accurate even with row limit)
  const kpis = useMemo(() => {
    if (serverKpis) {
      const resultado = serverKpis.receitas - serverKpis.despesas;
      return { receitas: serverKpis.receitas, despesas: serverKpis.despesas, resultado };
    }
    // Fallback: client-side from loaded transactions
    let receitas = 0;
    let despesas = 0;
    for (const t of transactions) {
      if (t.status === "pago") receitas += Number(t.valor);
      else despesas += Number(t.valor);
    }
    return { receitas, despesas, resultado: receitas - despesas };
  }, [serverKpis, transactions]);

  // Filtered and sorted transactions for Lançamentos tab
  const filteredTransactions = useMemo(() => {
    let list = [...transactions];
    if (filterTipo !== "todos") {
      list = list.filter((t) => (filterTipo === "receita" ? t.status === "pago" : t.status === "em aberto"));
    }
    if (filterConta !== "todas") {
      list = list.filter((t) => t.conta_plano_id === filterConta);
    }
    list.sort((a, b) => sortDir === "asc" ? a.data.localeCompare(b.data) : b.data.localeCompare(a.data));
    return list;
  }, [transactions, filterTipo, filterConta, sortDir]);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [filterTipo, filterConta, sortDir, dateRange]);

  const totalPages = Math.ceil(filteredTransactions.length / PAGE_SIZE);
  const paginatedTransactions = useMemo(
    () => filteredTransactions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [filteredTransactions, page, PAGE_SIZE]
  );

  // Contas used in transactions for filter dropdown
  const contasEmUso = useMemo(() => {
    const ids = new Set(transactions.map((t) => t.conta_plano_id).filter(Boolean));
    return planoContas.filter((c) => ids.has(c.id));
  }, [transactions, planoContas]);

  // Cumulative balance for demonstrativo
  const transactionsWithSaldo = useMemo(() => {
    let saldo = 0;
    return transactions.map((t) => {
      const valor = Number(t.valor);
      if (t.status === "pago") saldo += valor; else saldo -= valor;
      return { ...t, saldoAcumulado: saldo };
    });
  }, [transactions]);

  // Consolidated tree by plano de contas
  const consolidadoTree = useMemo(() => {
    if (planoContas.length === 0) return [];

    // Sum by tipo (category key in transactions maps to plano_contas tipo match)
    const tipoTotals = new Map<string, { receitas: number; despesas: number }>();
    for (const t of transactions) {
      const key = t.tipo;
      const entry = tipoTotals.get(key) ?? { receitas: 0, despesas: 0 };
      if (t.status === "pago") entry.receitas += Number(t.valor);
      else entry.despesas += Number(t.valor);
      tipoTotals.set(key, entry);
    }

    // Build tree from plano_contas
    const nodeMap = new Map<string, ConsolidadoNode>();
    for (const c of planoContas) {
      nodeMap.set(c.id, { id: c.id, codigo: c.codigo, nome: c.nome, tipo: c.tipo, total: 0, children: [], depth: 0 });
    }

    const roots: ConsolidadoNode[] = [];
    for (const c of planoContas) {
      const node = nodeMap.get(c.id)!;
      if (c.conta_pai_id && nodeMap.has(c.conta_pai_id)) {
        nodeMap.get(c.conta_pai_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    // Assign totals to leaf nodes by matching tipo name (lowercase)
    // Match: conta.nome.toLowerCase() matches transaction.tipo key
    const contasByName = new Map<string, ConsolidadoNode>();
    for (const [, node] of nodeMap) {
      contasByName.set(node.nome.toLowerCase(), node);
    }

    // Map transaction tipos to plano nodes
    const tipoToContaName: Record<string, string> = {
      mensalidade: "mensalidades",
      taxa: "taxas",
      avulso: "avulso",
    };

    for (const [tipo, totals] of tipoTotals) {
      const lookupName = tipoToContaName[tipo] ?? tipo;
      // Try exact match, then partial
      let target = contasByName.get(lookupName) ?? contasByName.get(tipo);
      if (!target) {
        // Try finding any conta whose name contains the tipo
        for (const [name, node] of contasByName) {
          if (name.includes(tipo) || tipo.includes(name)) { target = node; break; }
        }
      }
      if (target) {
        target.total = target.tipo === "receita" ? totals.receitas : totals.despesas;
      }
    }

    // Bubble up totals
    function sumUp(node: ConsolidadoNode): number {
      if (node.children.length === 0) return node.total;
      let childSum = 0;
      for (const child of node.children) childSum += sumUp(child);
      node.total = childSum + node.total;
      return node.total;
    }

    function setDepth(nodes: ConsolidadoNode[], d: number) {
      for (const n of nodes) { n.depth = d; setDepth(n.children, d + 1); }
    }

    for (const r of roots) sumUp(r);
    setDepth(roots, 0);
    roots.sort((a, b) => a.codigo.localeCompare(b.codigo));

    return roots;
  }, [planoContas, transactions]);

  // Flatten consolidated tree for rendering
  const flatConsolidado = useMemo(() => {
    const result: ConsolidadoNode[] = [];
    function walk(nodes: ConsolidadoNode[]) {
      for (const n of nodes) {
        result.push(n);
        walk(n.children);
      }
    }
    walk(consolidadoTree);
    return result;
  }, [consolidadoTree]);

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

  const periodLabel = useMemo(() => {
    if (preset === "mes") return `${meses[selectedMonth]} de ${selectedYear}`;
    if (preset === "ano") return `Ano ${selectedYear}`;
    return `${format(dateRange.from, "dd/MM/yyyy")} — ${format(dateRange.to, "dd/MM/yyyy")}`;
  }, [preset, selectedMonth, selectedYear, dateRange]);

  return (
    <div className={embedded ? "space-y-6" : "space-y-6 max-w-6xl mx-auto"}>
      {!embedded && (
        <div>
          <h1 className="text-2xl font-serif font-bold">Financeiro Geral</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão consolidada das finanças da Loja</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <NovoLancamentoLoja tipo="receita" onSaved={fetchData} />
        <NovoLancamentoLoja tipo="despesa" onSaved={fetchData} />
      </div>

      {/* Period filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Filtrar por</label>
              <Select value={preset} onValueChange={setPreset}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {presetPeriods.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(preset === "mes" || preset === "ano") && (
              <>
                {preset === "mes" && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Mês</label>
                    <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {meses.map((m, i) => (
                          <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Ano</label>
                  <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => now.getFullYear() - i).map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

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
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="text-base font-sans font-semibold">Lançamentos — {periodLabel}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Select value={filterTipo} onValueChange={setFilterTipo}>
                        <SelectTrigger className="w-36 h-8 text-xs">
                          <Filter className="h-3 w-3 mr-1" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os tipos</SelectItem>
                          <SelectItem value="receita">Receita</SelectItem>
                          <SelectItem value="despesa">Despesa</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={filterConta} onValueChange={setFilterConta}>
                        <SelectTrigger className="w-44 h-8 text-xs">
                          <Filter className="h-3 w-3 mr-1" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todas">Todas as contas</SelectItem>
                          {contasEmUso.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.codigo} — {c.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}>
                        <ArrowUpDown className="h-3 w-3" />
                        {sortDir === "asc" ? "Mais antigos" : "Mais recentes"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Conta</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead>Usuário</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                              Nenhum lançamento encontrado no período.
                            </TableCell>
                          </TableRow>
                        ) : paginatedTransactions.map((t) => {
                          const isDebito = t.status === "em aberto";
                          const isCancelado = t.descricao.startsWith("[CANCELADO]") || t.descricao.startsWith("[CANCELAMENTO]");
                          return (
                            <TableRow key={t.id} className={isCancelado ? "opacity-50" : ""}>
                              <TableCell className="text-sm">{format(new Date(t.data), "dd/MM/yyyy")}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn("text-[10px]", isCancelado ? "text-muted-foreground border-muted" : isDebito ? "text-destructive border-destructive/30" : "text-success border-success/30")}>
                                  {isCancelado ? "Cancelado" : isDebito ? "Despesa" : "Receita"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{t.conta_nome}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{t.descricao || "—"}</TableCell>
                              <TableCell className={cn("text-right text-sm font-medium", isCancelado ? "text-muted-foreground line-through" : isDebito ? "text-destructive" : "text-success")}>
                                {isDebito ? "−" : "+"} {fmt(Number(t.valor))}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{t.created_by_name}</TableCell>
                              <TableCell className="text-right">
                                {!isCancelado && (
                                  <PermissionGate module="tesouraria" action="write" hide>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-xs text-destructive hover:text-destructive"
                                      onClick={() => { setCancelTarget(t); setCancelOpen(true); }}
                                    >
                                      Cancelar
                                    </Button>
                                  </PermissionGate>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4">
                      <p className="text-xs text-muted-foreground">
                        {filteredTransactions.length} lançamento(s) — Página {page + 1} de {totalPages}
                      </p>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                          Anterior
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                          Próximo
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <CancelarLancamento
                transaction={cancelTarget}
                open={cancelOpen}
                onOpenChange={setCancelOpen}
                onCancelled={fetchData}
              />
            </TabsContent>

            {/* Demonstrativo */}
            <TabsContent value="demonstrativo">
              <DemonstrativoTab
                periodLabel={periodLabel}
                kpis={kpis}
                flatConsolidado={flatConsolidado}
              />
            </TabsContent>

            {/* Fluxo de Caixa */}
            <TabsContent value="fluxo">
              <div className="space-y-4">
                {/* KPI resumo do fluxo */}
                {(() => {
                  const saldoFinal = transactionsWithSaldo.length > 0 ? transactionsWithSaldo[transactionsWithSaldo.length - 1].saldoAcumulado : 0;
                  const saldoInicial = saldoFinal - kpis.receitas + kpis.despesas;
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="flex items-center gap-3 p-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Wallet className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xl font-bold">{fmt(saldoInicial)}</p>
                            <p className="text-xs text-muted-foreground">Saldo Inicial</p>
                          </div>
                        </CardContent>
                      </Card>
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
                      <Card className={saldoFinal < 0 ? "border-destructive/30 bg-destructive/5" : ""}>
                        <CardContent className="flex items-center gap-3 p-4">
                          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", saldoFinal >= 0 ? "bg-success/10" : "bg-destructive/10")}>
                            <Scale className={cn("h-5 w-5", saldoFinal >= 0 ? "text-success" : "text-destructive")} />
                          </div>
                          <div>
                            <p className={cn("text-xl font-bold", saldoFinal >= 0 ? "text-success" : "text-destructive")}>{fmt(saldoFinal)}</p>
                            <p className="text-xs text-muted-foreground">Saldo Final</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })()}

                {/* Tabela cronológica com saldo acumulado */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-sans font-semibold">Fluxo de Caixa — {periodLabel}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead className="text-right">Entrada</TableHead>
                            <TableHead className="text-right">Saída</TableHead>
                            <TableHead className="text-right">Saldo Acumulado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactionsWithSaldo.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                                Nenhuma movimentação no período.
                              </TableCell>
                            </TableRow>
                          ) : transactionsWithSaldo.map((t) => {
                            const isReceita = t.status === "pago";
                            const valor = Number(t.valor);
                            return (
                              <TableRow key={t.id}>
                                <TableCell className="text-sm">{format(new Date(t.data), "dd/MM/yyyy")}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{t.descricao || "—"}</TableCell>
                                <TableCell className="text-right text-sm text-success font-medium">
                                  {isReceita ? fmt(valor) : "—"}
                                </TableCell>
                                <TableCell className="text-right text-sm text-destructive font-medium">
                                  {!isReceita ? fmt(valor) : "—"}
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
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default FinanceiroGeral;
