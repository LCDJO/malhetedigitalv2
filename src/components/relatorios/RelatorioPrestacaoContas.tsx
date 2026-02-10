import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLodgeConfig } from "@/hooks/useLodgeConfig";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Loader2, Calendar, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
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
  tipo: string;
  valor: number;
  data: string;
  status: string;
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
  const [activeCount, setActiveCount] = useState(0);

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
          .select("tipo, valor, data, status")
          .gte("data", startDate).lte("data", endDate),
        supabase.from("members").select("id").eq("status", "ativo"),
      ]);
      setTransactions(txRes.data ?? []);
      setActiveCount(memRes.data?.length ?? 0);
      setLoading(false);
    })();
  }, [ano, mesInicio, mesFim]);

  const receitas = transactions.filter((t) => t.tipo !== "despesa");
  const despesas = transactions.filter((t) => t.tipo === "despesa");
  const totalReceitas = receitas.reduce((s, t) => s + Number(t.valor), 0);
  const totalDespesas = despesas.reduce((s, t) => s + Number(t.valor), 0);
  const saldo = totalReceitas - totalDespesas;

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

  const periodoLabel = mesInicio === mesFim
    ? `${meses[parseInt(mesInicio) - 1]} de ${ano}`
    : `${meses[parseInt(mesInicio) - 1]} a ${meses[parseInt(mesFim) - 1]} de ${ano}`;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-sans font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Filtros — Prestação de Contas
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

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* Cabeçalho oficial para impressão */}
          <div className="hidden print:block text-center space-y-1 mb-6">
            <p className="text-lg font-bold font-serif">{config.lodge_name || "Loja Maçônica"}</p>
            <p className="text-sm">Nº {config.lodge_number} — Or∴ de {config.orient}</p>
            {config.potencia && <p className="text-xs text-muted-foreground">{config.potencia}</p>}
            <Separator className="my-3" />
            <p className="text-base font-semibold">PRESTAÇÃO DE CONTAS — {periodoLabel.toUpperCase()}</p>
            <p className="text-xs text-muted-foreground">
              Emitido em {format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} por {profile?.full_name}
            </p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4">
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
          </div>

          {/* Tabela por tipo */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-sans font-semibold">Demonstrativo por Categoria</CardTitle>
              <CardDescription>{periodoLabel}</CardDescription>
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
                          Nenhuma movimentação no período selecionado.
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
                          <TableCell className="text-right text-success">
                            {formatCurrency(porTipo.reduce((s, r) => s + r.pago, 0))}
                          </TableCell>
                          <TableCell className="text-right text-destructive">
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

          {/* Rodapé oficial */}
          <div className="text-center text-[10px] text-muted-foreground pt-4 border-t space-y-1 print:mt-8">
            <p>Documento gerado automaticamente pelo sistema Malhete Digital</p>
            <p>{config.lodge_name} — Nº {config.lodge_number} — Or∴ de {config.orient}</p>
          </div>
        </>
      )}
    </div>
  );
}
