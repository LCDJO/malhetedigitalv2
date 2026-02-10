import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

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

interface Member {
  id: string;
  full_name: string;
}

interface Props {
  transactions: Transaction[];
  members: Member[];
  periodoLabel: string;
}

export default function RelatorioMovimentacao({ transactions, members, periodoLabel }: Props) {
  return (
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
                [...transactions]
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
                            className={t.status === "pago"
                              ? "bg-success/10 text-success border-success/20 text-[10px]"
                              : "bg-destructive/10 text-destructive border-destructive/20 text-[10px]"
                            }
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
  );
}
