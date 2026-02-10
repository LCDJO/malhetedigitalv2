import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface Mensalidade {
  mes: string;
  valor: number;
  status: "pago" | "pendente" | "atrasado";
  dataPagamento?: string;
}

interface IrmaoFinanceiro {
  id: number;
  nome: string;
  cim: string;
  mensalidades: Mensalidade[];
}

const dados: IrmaoFinanceiro[] = [
  {
    id: 1, nome: "João Silva", cim: "123456",
    mensalidades: [
      { mes: "Jan/2026", valor: 280, status: "pago", dataPagamento: "05/01/2026" },
      { mes: "Fev/2026", valor: 280, status: "pago", dataPagamento: "03/02/2026" },
    ],
  },
  {
    id: 2, nome: "Carlos Mendes", cim: "234567",
    mensalidades: [
      { mes: "Jan/2026", valor: 280, status: "pago", dataPagamento: "10/01/2026" },
      { mes: "Fev/2026", valor: 280, status: "pendente" },
    ],
  },
  {
    id: 3, nome: "Pedro Alves", cim: "345678",
    mensalidades: [
      { mes: "Jan/2026", valor: 280, status: "atrasado" },
      { mes: "Fev/2026", valor: 280, status: "atrasado" },
    ],
  },
];

const statusConfig = {
  pago: { label: "Pago", icon: CheckCircle2, className: "bg-success/10 text-success border-success/20" },
  pendente: { label: "Pendente", icon: Clock, className: "bg-warning/10 text-warning border-warning/20" },
  atrasado: { label: "Atrasado", icon: AlertCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export function FinanceiroIrmao() {
  const [selectedId, setSelectedId] = useState<string>("");

  const selected = dados.find((d) => d.id.toString() === selectedId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-sans font-semibold">Financeiro Individual</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-xs space-y-1.5">
          <Label>Selecione o Irmão</Label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um irmão" />
            </SelectTrigger>
            <SelectContent>
              {dados.map((d) => (
                <SelectItem key={d.id} value={d.id.toString()}>
                  {d.nome} — CIM {d.cim}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selected ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selected.mensalidades.map((m) => {
                  const cfg = statusConfig[m.status];
                  const Icon = cfg.icon;
                  return (
                    <TableRow key={m.mes}>
                      <TableCell className="font-medium">{m.mes}</TableCell>
                      <TableCell className="text-right">R$ {m.valor.toFixed(2).replace(".", ",")}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cfg.className + " gap-1"}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{m.dataPagamento || "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            Selecione um irmão para visualizar o histórico financeiro.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
