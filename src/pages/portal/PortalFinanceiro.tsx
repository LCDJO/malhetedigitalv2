import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePortalMemberContext } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Wallet, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => format(new Date(d), "dd/MM/yyyy");

export default function PortalFinanceiro() {
  const member = usePortalMemberContext();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTxs = async () => {
      const { data: txs } = await supabase
        .from("member_transactions")
        .select("id, data, tipo, descricao, valor, status")
        .eq("member_id", member.id)
        .order("data", { ascending: false })
        .limit(200);

      setTransactions(txs ?? []);
      setLoading(false);
    };
    fetchTxs();
  }, [member.id]);

  const kpis = useMemo(() => {
    let debitos = 0, creditos = 0, emAberto = 0;
    for (const t of transactions) {
      if (t.status === "pago") creditos += Number(t.valor);
      else { debitos += Number(t.valor); emAberto++; }
    }
    return { debitos, creditos, saldo: creditos - debitos, emAberto };
  }, [transactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-serif font-bold">Meu Financeiro</h1>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe seus débitos, créditos e situação financeira</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-lg font-bold text-destructive">{fmt(kpis.debitos)}</p>
              <p className="text-[11px] text-muted-foreground">Débitos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-lg font-bold text-success">{fmt(kpis.creditos)}</p>
              <p className="text-[11px] text-muted-foreground">Créditos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className={`text-lg font-bold ${kpis.saldo >= 0 ? "text-success" : "text-destructive"}`}>{fmt(kpis.saldo)}</p>
              <p className="text-[11px] text-muted-foreground">Saldo</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
              <AlertTriangle className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-lg font-bold">{kpis.emAberto}</p>
              <p className="text-[11px] text-muted-foreground">Em Aberto</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-sans">Extrato de Transações</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma transação encontrada.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm">{fmtDate(t.data)}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{t.descricao || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{t.tipo}</Badge>
                      </TableCell>
                      <TableCell className={`text-right text-sm font-medium ${t.status === "pago" ? "text-success" : "text-destructive"}`}>
                        {t.status === "pago" ? "+" : "−"} {fmt(Number(t.valor))}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${t.status === "pago" ? "border-success/30 text-success" : "border-destructive/30 text-destructive"}`}
                        >
                          {t.status === "pago" ? "Pago" : "Em Aberto"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
