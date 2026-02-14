import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Info } from "lucide-react";

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

interface Transaction {
  id: string;
  tipo: string;
  valor: number;
  descricao: string;
  data: string;
  status: string;
  member_id: string;
  created_by?: string | null;
  created_at?: string;
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
        <CardDescription>
          Todos os lançamentos válidos registrados em {periodoLabel} — {transactions.length} registro(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Ref.</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Irmão</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-[40px] text-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Rastreabilidade: ID do lançamento e data de registro</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhuma movimentação registrada no período.
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {[...transactions]
                    .sort((a, b) => a.data.localeCompare(b.data))
                    .map((t) => {
                      const member = members.find((m) => m.id === t.member_id);
                      const shortId = t.id.slice(0, 8).toUpperCase();
                      return (
                        <TableRow key={t.id}>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                                    {shortId}
                                  </code>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-[280px]">
                                  <div className="space-y-1 text-xs">
                                    <p><span className="font-medium">ID Completo:</span> {t.id}</p>
                                    {t.created_at && (
                                      <p><span className="font-medium">Registrado em:</span> {format(new Date(t.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
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
                          <TableCell className="text-muted-foreground max-w-[180px] truncate text-sm">{t.descricao}</TableCell>
                          <TableCell>
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
                          <TableCell className="text-right font-medium text-sm">{formatCurrency(Number(t.valor))}</TableCell>
                          <TableCell className="text-center">
                            {t.created_at && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-3 w-3 text-muted-foreground/50" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">
                                      Registrado em {format(new Date(t.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  <TableRow className="bg-muted/30 font-semibold">
                    <TableCell colSpan={6} className="text-right text-sm">
                      Total ({transactions.length} lançamentos)
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatCurrency(transactions.reduce((s, t) => s + Number(t.valor), 0))}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Legenda de auditoria */}
        <div className="mt-3 flex items-start gap-2 text-[10px] text-muted-foreground">
          <Info className="h-3 w-3 mt-0.5 shrink-0" />
          <p>
            Cada lançamento possui um identificador único (Ref.) que permite rastreá-lo até o registro original.
            Apenas lançamentos com status válido (Pago ou Em Aberto) são exibidos neste relatório.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
