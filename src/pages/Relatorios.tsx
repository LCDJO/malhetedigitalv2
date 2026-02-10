import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLodgeConfig } from "@/hooks/useLodgeConfig";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText, Printer, Loader2, TrendingUp, TrendingDown, Users,
  DollarSign, AlertTriangle, CheckCircle2, Calendar, Building2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface Transaction {
  id: string;
  tipo: string;
  valor: number;
  descricao: string;
  data: string;
  status: string;
  member_id: string;
}

interface Member {
  id: string;
  full_name: string;
  cim: string;
  status: string;
}

export default function Relatorios() {
  const { config } = useLodgeConfig();
  const { profile } = useAuth();
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear().toString());
  const [mes, setMes] = useState((now.getMonth() + 1).toString());
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const startDate = `${ano}-${mes.padStart(2, "0")}-01`;
      const endMonth = parseInt(mes);
      const endYear = parseInt(ano);
      const lastDay = new Date(endYear, endMonth, 0).getDate();
      const endDate = `${ano}-${mes.padStart(2, "0")}-${lastDay}`;

      const [txRes, memRes] = await Promise.all([
        supabase.from("member_transactions").select("id, tipo, valor, descricao, data, status, member_id")
          .gte("data", startDate).lte("data", endDate),
        supabase.from("members").select("id, full_name, cim, status"),
      ]);

      setTransactions(txRes.data ?? []);
      setMembers(memRes.data ?? []);
      setLoading(false);
    })();
  }, [ano, mes]);

  const handlePrint = () => window.print();

  // ── Cálculos ──
  const membrosAtivos = members.filter((m) => m.status === "ativo");
  const entradas = transactions.filter((t) => t.tipo !== "despesa");
  const saidas = transactions.filter((t) => t.tipo === "despesa");

  const totalEntradas = entradas.reduce((s, t) => s + Number(t.valor), 0);
  const totalSaidas = saidas.reduce((s, t) => s + Number(t.valor), 0);
  const saldo = totalEntradas - totalSaidas;

  const totalPago = transactions.filter((t) => t.status === "pago").reduce((s, t) => s + Number(t.valor), 0);
  const totalEmAberto = transactions.filter((t) => t.status === "em_aberto").reduce((s, t) => s + Number(t.valor), 0);

  // Por tipo
  const porTipo = ["mensalidade", "taxa", "avulso", "despesa"].map((tipo) => {
    const txs = transactions.filter((t) => t.tipo === tipo);
    return {
      tipo,
      label: tipo === "mensalidade" ? "Mensalidades" : tipo === "taxa" ? "Taxas" : tipo === "avulso" ? "Avulsos" : "Despesas",
      pago: txs.filter((t) => t.status === "pago").reduce((s, t) => s + Number(t.valor), 0),
      aberto: txs.filter((t) => t.status === "em_aberto").reduce((s, t) => s + Number(t.valor), 0),
      qtd: txs.length,
    };
  }).filter((r) => r.qtd > 0);

  // Inadimplentes
  const memberIdsComAberto = new Set(transactions.filter((t) => t.status === "em_aberto").map((t) => t.member_id));
  const inadimplentes = members.filter((m) => memberIdsComAberto.has(m.id)).map((m) => {
    const txs = transactions.filter((t) => t.member_id === m.id && t.status === "em_aberto");
    return { ...m, totalAberto: txs.reduce((s, t) => s + Number(t.valor), 0), qtdAberto: txs.length };
  }).sort((a, b) => b.totalAberto - a.totalAberto);

  const receitaPrevista = membrosAtivos.length * config.mensalidade_padrao;
  const periodoLabel = `${meses[parseInt(mes) - 1]} de ${ano}`;

  const anos = Array.from({ length: 5 }, (_, i) => (now.getFullYear() - 2 + i).toString());

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold">Relatórios Oficiais</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Prestação de contas — dados consolidados do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={mes} onValueChange={setMes}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {meses.map((m, i) => (
                <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ano} onValueChange={setAno}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anos.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handlePrint} className="gap-1.5 print:hidden">
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
        </div>
      </div>

      <div ref={printRef} className="space-y-6">
        {/* Cabeçalho oficial (visível na impressão) */}
        <div className="hidden print:block text-center space-y-1 mb-8">
          <p className="text-lg font-bold font-serif">{config.lodge_name || "Loja Maçônica"}</p>
          <p className="text-sm">Nº {config.lodge_number} — Or∴ de {config.orient}</p>
          {config.potencia && <p className="text-xs text-muted-foreground">{config.potencia}</p>}
          <Separator className="my-3" />
          <p className="text-base font-semibold">DEMONSTRATIVO FINANCEIRO — {periodoLabel.toUpperCase()}</p>
          <p className="text-xs text-muted-foreground">Emitido em {format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} por {profile?.full_name}</p>
        </div>

        <Tabs defaultValue="balancete" className="w-full print:block">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1 print:hidden">
            <TabsTrigger value="balancete" className="gap-1.5 text-xs sm:text-sm">
              <FileText className="h-3.5 w-3.5" /> Balancete Mensal
            </TabsTrigger>
            <TabsTrigger value="inadimplencia" className="gap-1.5 text-xs sm:text-sm">
              <AlertTriangle className="h-3.5 w-3.5" /> Inadimplência
            </TabsTrigger>
            <TabsTrigger value="movimentacao" className="gap-1.5 text-xs sm:text-sm">
              <DollarSign className="h-3.5 w-3.5" /> Movimentação Detalhada
            </TabsTrigger>
          </TabsList>

          {/* ── Balancete Mensal ── */}
          <TabsContent value="balancete" className="mt-6 space-y-6 print:block print:mt-4">
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-5 space-y-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Receitas</p>
                  </div>
                  <p className="text-xl font-bold font-serif">{formatCurrency(totalEntradas)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 space-y-1">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Despesas</p>
                  </div>
                  <p className="text-xl font-bold font-serif">{formatCurrency(totalSaidas)}</p>
                </CardContent>
              </Card>
              <Card className={saldo >= 0 ? "border-success/30" : "border-destructive/30"}>
                <CardContent className="pt-5 space-y-1">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Saldo</p>
                  </div>
                  <p className={`text-xl font-bold font-serif ${saldo >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatCurrency(saldo)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Membros Ativos</p>
                  </div>
                  <p className="text-xl font-bold font-serif">{membrosAtivos.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Demonstrativo por categoria */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-sans font-semibold">Demonstrativo por Categoria</CardTitle>
                <CardDescription>Receitas e pendências do período {periodoLabel}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Arrecadado</TableHead>
                        <TableHead className="text-right">Em Aberto</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-center">Qtd</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {porTipo.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Nenhuma movimentação registrada no período.
                          </TableCell>
                        </TableRow>
                      ) : (
                        <>
                          {porTipo.map((r) => (
                            <TableRow key={r.tipo}>
                              <TableCell className="font-medium">{r.label}</TableCell>
                              <TableCell className="text-right text-success">{formatCurrency(r.pago)}</TableCell>
                              <TableCell className="text-right text-destructive">{formatCurrency(r.aberto)}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(r.pago + r.aberto)}</TableCell>
                              <TableCell className="text-center">{r.qtd}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/30 font-semibold">
                            <TableCell>Total</TableCell>
                            <TableCell className="text-right text-success">{formatCurrency(totalPago)}</TableCell>
                            <TableCell className="text-right text-destructive">{formatCurrency(totalEmAberto)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(totalPago + totalEmAberto)}</TableCell>
                            <TableCell className="text-center">{transactions.length}</TableCell>
                          </TableRow>
                        </>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Receita prevista */}
            {config.mensalidade_padrao > 0 && (
              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Receita Prevista (Mensalidades)</p>
                      <p className="text-xs text-muted-foreground">
                        {membrosAtivos.length} membros × {formatCurrency(config.mensalidade_padrao)}
                      </p>
                    </div>
                    <p className="text-xl font-bold font-serif">{formatCurrency(receitaPrevista)}</p>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min(100, receitaPrevista > 0 ? (totalPago / receitaPrevista) * 100 : 0)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {receitaPrevista > 0 ? ((totalPago / receitaPrevista) * 100).toFixed(1) : "0"}% da receita prevista arrecadada
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Inadimplência ── */}
          <TabsContent value="inadimplencia" className="mt-6 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-sans font-semibold">Relatório de Inadimplência</CardTitle>
                    <CardDescription>Irmãos com lançamentos em aberto em {periodoLabel}</CardDescription>
                  </div>
                  <Badge variant={inadimplentes.length === 0 ? "default" : "destructive"} className="text-xs">
                    {inadimplentes.length === 0 ? (
                      <><CheckCircle2 className="h-3 w-3 mr-1" /> Todos em dia</>
                    ) : (
                      <><AlertTriangle className="h-3 w-3 mr-1" /> {inadimplentes.length} inadimplente(s)</>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Irmão</TableHead>
                        <TableHead>CIM</TableHead>
                        <TableHead className="text-center">Pendências</TableHead>
                        <TableHead className="text-right">Valor em Aberto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inadimplentes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            <CheckCircle2 className="h-5 w-5 mx-auto mb-2 text-success" />
                            Nenhum irmão inadimplente neste período.
                          </TableCell>
                        </TableRow>
                      ) : (
                        inadimplentes.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell className="font-medium">{m.full_name}</TableCell>
                            <TableCell>{m.cim}</TableCell>
                            <TableCell className="text-center">{m.qtdAberto}</TableCell>
                            <TableCell className="text-right font-medium text-destructive">{formatCurrency(m.totalAberto)}</TableCell>
                          </TableRow>
                        ))
                      )}
                      {inadimplentes.length > 0 && (
                        <TableRow className="bg-muted/30 font-semibold">
                          <TableCell colSpan={2}>Total</TableCell>
                          <TableCell className="text-center">{inadimplentes.reduce((s, m) => s + m.qtdAberto, 0)}</TableCell>
                          <TableCell className="text-right text-destructive">
                            {formatCurrency(inadimplentes.reduce((s, m) => s + m.totalAberto, 0))}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Movimentação Detalhada ── */}
          <TabsContent value="movimentacao" className="mt-6 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-sans font-semibold">Movimentação Detalhada</CardTitle>
                <CardDescription>Todos os lançamentos registrados em {periodoLabel}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Irmão</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Situação</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            Nenhuma movimentação registrada no período.
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions
                          .sort((a, b) => a.data.localeCompare(b.data))
                          .map((t) => {
                            const member = members.find((m) => m.id === t.member_id);
                            return (
                              <TableRow key={t.id}>
                                <TableCell className="whitespace-nowrap">
                                  {format(new Date(t.data + "T12:00:00"), "dd/MM/yyyy")}
                                </TableCell>
                                <TableCell className="font-medium">{member?.full_name ?? "—"}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-[10px]">
                                    {t.tipo === "mensalidade" ? "Mensalidade" : t.tipo === "taxa" ? "Taxa" : t.tipo === "avulso" ? "Avulso" : t.tipo}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground max-w-[200px] truncate">{t.descricao}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={t.status === "pago" ? "bg-success/10 text-success border-success/20 text-[10px]" : "bg-destructive/10 text-destructive border-destructive/20 text-[10px]"}
                                  >
                                    {t.status === "pago" ? "Pago" : "Em Aberto"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(Number(t.valor))}</TableCell>
                              </TableRow>
                            );
                          })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Rodapé oficial */}
        <div className="text-center text-[10px] text-muted-foreground pt-4 border-t space-y-1 print:mt-8">
          <p>Documento gerado automaticamente pelo sistema Malhete Digital</p>
          <p>{config.lodge_name} — Nº {config.lodge_number} — Or∴ de {config.orient}</p>
          <p>Emitido em {format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
        </div>
      </div>
    </div>
  );
}
