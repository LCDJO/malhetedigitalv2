import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface Transaction {
  id: string;
  tipo: string;
  valor: number;
  status: string;
  member_id: string;
}

interface Member {
  id: string;
  full_name: string;
  cim: string;
  status: string;
}

interface Props {
  transactions: Transaction[];
  members: Member[];
  periodoLabel: string;
}

export default function RelatorioInadimplencia({ transactions, members, periodoLabel }: Props) {
  const memberIdsComAberto = new Set(
    transactions.filter((t) => t.status === "em_aberto").map((t) => t.member_id)
  );

  const inadimplentes = members
    .filter((m) => memberIdsComAberto.has(m.id))
    .map((m) => {
      const txs = transactions.filter((t) => t.member_id === m.id && t.status === "em_aberto");
      return { ...m, totalAberto: txs.reduce((s, t) => s + Number(t.valor), 0), qtdAberto: txs.length };
    })
    .sort((a, b) => b.totalAberto - a.totalAberto);

  return (
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
                    <TableCell className="text-right font-medium text-destructive">
                      {formatCurrency(m.totalAberto)}
                    </TableCell>
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
  );
}
