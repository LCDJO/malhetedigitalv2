import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLodgeConfig } from "@/hooks/useLodgeConfig";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, TrendingUp, TrendingDown, DollarSign, Users, FileText, FileSpreadsheet } from "lucide-react";
import { exportPrestacaoContasPdf, exportLancamentosExcel } from "./ExportPanel";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const VALID_STATUSES = ["pago", "em_aberto"];

interface Transaction {
  id: string;
  tipo: string;
  valor: number;
  descricao: string;
  data: string;
  status: string;
  member_id: string;
  created_at: string;
}

interface Member {
  id: string;
  full_name: string;
  cim: string;
  status: string;
}

function getLabelTipo(tipo: string) {
  switch (tipo) {
    case "mensalidade": return "Mensalidade";
    case "taxa": return "Taxa";
    case "avulso": return "Avulso";
    case "despesa": return "Despesa";
    default: return tipo;
  }
}

export default function RelatorioPrestacaoContas() {
  const { config } = useLodgeConfig();
  const { profile } = useAuth();
  const now = new Date();
  const [mesInicio, setMesInicio] = useState("1");
  const [mesFim, setMesFim] = useState((now.getMonth() + 1).toString());
  const [ano, setAno] = useState(now.getFullYear().toString());
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const anos = Array.from({ length: 5 }, (_, i) => (now.getFullYear() - 2 + i).toString());

  useEffect(() => {
    (async () => {
      setLoading(true);
      const startDate = `${ano}-${mesInicio.padStart(2, "0")}-01`;
      const endMonth = parseInt(mesFim);
      const endYear = parseInt(ano);
      const lastDay = new Date(endYear, endMonth, 0).getDate();
      const endDate = `${ano}-${mesFim.padStart(2, "0")}-${lastDay}`;

      const [txRes, memRes] = await Promise.all([
        supabase.from("member_transactions")
          .select("id, tipo, valor, descricao, data, status, member_id, created_at")
          .in("status", VALID_STATUSES)
          .gte("data", startDate).lte("data", endDate)
          .order("data", { ascending: true }),
        supabase.from("members").select("id, full_name, cim, status"),
      ]);
      setTransactions(txRes.data ?? []);
      setMembers(memRes.data ?? []);
      setLoading(false);
    })();
  }, [ano, mesInicio, mesFim]);

  const membrosAtivos = members.filter((m) => m.status === "ativo");
  const receitas = transactions.filter((t) => t.tipo !== "despesa");
  const despesas = transactions.filter((t) => t.tipo === "despesa");
  const totalReceitas = receitas.reduce((s, t) => s + Number(t.valor), 0);
  const totalDespesas = despesas.reduce((s, t) => s + Number(t.valor), 0);
  const totalPago = transactions.filter((t) => t.status === "pago" && t.tipo !== "despesa").reduce((s, t) => s + Number(t.valor), 0);
  const totalEmAberto = transactions.filter((t) => t.status === "em_aberto").reduce((s, t) => s + Number(t.valor), 0);
  const saldo = totalReceitas - totalDespesas;

  const porTipo = ["mensalidade", "taxa", "avulso", "despesa"].map((tipo) => {
    const txs = transactions.filter((t) => t.tipo === tipo);
    if (txs.length === 0) return null;
    return {
      tipo,
      label: getLabelTipo(tipo) + "s",
      pago: txs.filter((t) => t.status === "pago").reduce((s, t) => s + Number(t.valor), 0),
      aberto: txs.filter((t) => t.status === "em_aberto").reduce((s, t) => s + Number(t.valor), 0),
      qtd: txs.length,
    };
  }).filter(Boolean) as { tipo: string; label: string; pago: number; aberto: number; qtd: number }[];

  const periodoLabel = mesInicio === mesFim
    ? `${meses[parseInt(mesInicio) - 1]} de ${ano}`
    : `${meses[parseInt(mesInicio) - 1]} a ${meses[parseInt(mesFim) - 1]} de ${ano}`;

  const getMember = (id: string) => members.find((m) => m.id === id);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="print:hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-sans font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Período da Prestação de Contas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs">Mês Início</Label>
              <Select value={mesInicio} onValueChange={setMesInicio}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {meses.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Mês Fim</Label>
              <Select value={mesFim} onValueChange={setMesFim}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {meses.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ano</Label>
              <Select value={ano} onValueChange={setAno}>
                <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {anos.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {!loading && transactions.length > 0 && (
        <div className="flex justify-end gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs"
            onClick={() => exportPrestacaoContasPdf(config, transactions, members, periodoLabel, profile?.full_name)}
          >
            <FileText className="h-3.5 w-3.5" /> Exportar PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs"
            onClick={() => exportLancamentosExcel(transactions, members, periodoLabel)}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Exportar Excel
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* ═══ Cabeçalho institucional (tela + impressão) ═══ */}
          <Card className="border-primary/20 bg-card">
            <CardContent className="pt-6 pb-5">
              <div className="text-center space-y-1.5">
                <p className="text-lg font-bold font-serif tracking-wide">{config.lodge_name || "Loja Maçônica"}</p>
                <p className="text-sm text-muted-foreground">Nº {config.lodge_number} — Or∴ de {config.orient}</p>
                {config.potencia && <p className="text-xs text-muted-foreground">{config.potencia}</p>}
                <Separator className="my-3" />
                <p className="text-base font-semibold uppercase tracking-wider">
                  Prestação de Contas — {periodoLabel}
                </p>
                <p className="text-xs text-muted-foreground">
                  Emitido em {format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} por {profile?.full_name}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ═══ Seção I — Resumo Geral ═══ */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              I — Resumo Geral
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-5 space-y-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Receitas</p>
                  </div>
                  <p className="text-xl font-bold font-serif">{formatCurrency(totalReceitas)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 space-y-1">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Despesas</p>
                  </div>
                  <p className="text-xl font-bold font-serif">{formatCurrency(totalDespesas)}</p>
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

            {/* Resumo consolidado inline */}
            <Card className="mt-4 border-primary/20">
              <CardContent className="pt-5">
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total arrecadado (receitas pagas)</span>
                    <span className="font-bold text-success">{formatCurrency(totalPago)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total em aberto</span>
                    <span className="font-bold text-warning">{formatCurrency(totalEmAberto)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total de despesas pagas</span>
                    <span className="font-bold text-destructive">
                      {formatCurrency(despesas.filter((t) => t.status === "pago").reduce((s, t) => s + Number(t.valor), 0))}
                    </span>
                  </div>
                  <Separator className="border-primary/20" />
                  <div className="flex justify-between items-center bg-muted/30 rounded-md px-3 py-2 -mx-3">
                    <span className="text-sm font-semibold">Saldo do período</span>
                    <span className={`text-lg font-bold font-serif ${saldo >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatCurrency(saldo)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ═══ Seção II — Demonstrativo por Categoria ═══ */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              II — Demonstrativo por Categoria
            </p>
            <Card>
              <CardContent className="pt-5">
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
                            Nenhuma movimentação no período.
                          </TableCell>
                        </TableRow>
                      ) : (
                        <>
                          {porTipo.map((r) => (
                            <TableRow key={r.tipo}>
                              <TableCell className="font-medium">{r.label}</TableCell>
                              <TableCell className="text-right text-success">{formatCurrency(r.pago)}</TableCell>
                              <TableCell className="text-right text-warning">{formatCurrency(r.aberto)}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(r.pago + r.aberto)}</TableCell>
                              <TableCell className="text-center">{r.qtd}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/30 font-semibold">
                            <TableCell>Total Geral</TableCell>
                            <TableCell className="text-right text-success">
                              {formatCurrency(porTipo.reduce((s, r) => s + r.pago, 0))}
                            </TableCell>
                            <TableCell className="text-right text-warning">
                              {formatCurrency(porTipo.reduce((s, r) => s + r.aberto, 0))}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(porTipo.reduce((s, r) => s + r.pago + r.aberto, 0))}
                            </TableCell>
                            <TableCell className="text-center">
                              {porTipo.reduce((s, r) => s + r.qtd, 0)}
                            </TableCell>
                          </TableRow>
                        </>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ═══ Seção III — Detalhamento de Lançamentos ═══ */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              III — Detalhamento de Lançamentos
            </p>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-sans font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Lançamentos do Período
                </CardTitle>
                <CardDescription>
                  {transactions.length} lançamento(s) registrado(s) entre {periodoLabel}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="w-[60px]">Ref.</TableHead>
                        <TableHead className="w-[100px]">Data</TableHead>
                        <TableHead>Irmão</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-center">Situação</TableHead>
                        <TableHead className="w-[120px]">Registrado em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            Nenhum lançamento registrado no período selecionado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        <>
                          {transactions.map((t) => {
                            const member = getMember(t.member_id);
                            return (
                              <TableRow key={t.id}>
                                <TableCell>
                                  <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                                    {t.id.slice(0, 8).toUpperCase()}
                                  </code>
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-sm">
                                  {format(new Date(t.data + "T12:00:00"), "dd/MM/yyyy")}
                                </TableCell>
                                <TableCell className="font-medium text-sm">{member?.full_name ?? "—"}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-[10px]">
                                    {getLabelTipo(t.tipo)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium text-sm">
                                  {formatCurrency(Number(t.valor))}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    variant="outline"
                                    className={t.status === "pago"
                                      ? "bg-success/10 text-success border-success/20 text-[10px]"
                                      : "bg-warning/10 text-warning border-warning/20 text-[10px]"
                                    }
                                  >
                                    {t.status === "pago" ? "Pago" : "Em Aberto"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                                  {format(new Date(t.created_at), "dd/MM/yy HH:mm")}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          <TableRow className="bg-muted/30 font-semibold">
                            <TableCell colSpan={4} className="text-right text-sm">
                              Total ({transactions.length} lançamentos)
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {formatCurrency(transactions.reduce((s, t) => s + Number(t.valor), 0))}
                            </TableCell>
                            <TableCell colSpan={2} />
                          </TableRow>
                        </>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-3 flex items-start gap-2 text-[10px] text-muted-foreground">
                  <FileText className="h-3 w-3 mt-0.5 shrink-0" />
                  <p>
                    Ref. = identificador único do lançamento para rastreabilidade.
                    Apenas lançamentos com status válido (Pago ou Em Aberto) são considerados.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ═══ Rodapé institucional ═══ */}
          <div className="text-center text-[10px] text-muted-foreground pt-6 border-t space-y-1">
            <Separator className="mb-4" />
            <p className="font-medium">Documento para leitura em Sessão de Loja</p>
            <p>Gerado automaticamente pelo sistema Malhete Digital</p>
            <p>{config.lodge_name} — Nº {config.lodge_number} — Or∴ de {config.orient}</p>
            <p>Emitido em {format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} por {profile?.full_name}</p>
          </div>
        </>
      )}
    </div>
  );
}
