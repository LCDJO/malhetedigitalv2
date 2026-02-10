import { useLodgeConfig } from "@/hooks/useLodgeConfig";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, DollarSign, Users } from "lucide-react";

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface Transaction {
  id: string;
  tipo: string;
  valor: number;
  descricao: string;
  data: string;
  status: string;
  member_id: string;
}

interface Props {
  transactions: Transaction[];
  activeMembers: number;
  periodoLabel: string;
}

export default function RelatorioBalancete({ transactions, activeMembers, periodoLabel }: Props) {
  const { config } = useLodgeConfig();

  const entradas = transactions.filter((t) => t.tipo !== "despesa");
  const saidas = transactions.filter((t) => t.tipo === "despesa");
  const totalEntradas = entradas.reduce((s, t) => s + Number(t.valor), 0);
  const totalSaidas = saidas.reduce((s, t) => s + Number(t.valor), 0);
  const saldo = totalEntradas - totalSaidas;
  const totalPago = transactions.filter((t) => t.status === "pago").reduce((s, t) => s + Number(t.valor), 0);
  const totalEmAberto = transactions.filter((t) => t.status === "em_aberto").reduce((s, t) => s + Number(t.valor), 0);

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

  const receitaPrevista = activeMembers * config.mensalidade_padrao;

  return (
    <div className="space-y-6">
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
            <p className="text-xl font-bold font-serif">{activeMembers}</p>
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
                  {activeMembers} membros × {formatCurrency(config.mensalidade_padrao)}
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
    </div>
  );
}
