import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, Plus } from "lucide-react";
import { toast } from "sonner";

interface Lancamento {
  id: number;
  irmao: string;
  data: Date;
  tipo: string;
  valor: number;
  descricao: string;
}

const irmaos = [
  { id: 1, nome: "João Silva", cim: "123456" },
  { id: 2, nome: "Carlos Mendes", cim: "234567" },
  { id: 3, nome: "Pedro Alves", cim: "345678" },
  { id: 4, nome: "Marcos Oliveira", cim: "456789" },
];

const tipoLabels: Record<string, string> = { mensalidade: "Mensalidade", avulso: "Valor Avulso", taxa: "Taxa" };
const tipoBadge: Record<string, string> = {
  mensalidade: "bg-primary/10 text-primary border-primary/20",
  avulso: "bg-accent/20 text-accent-foreground border-accent/30",
  taxa: "bg-warning/10 text-warning border-warning/20",
};

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function LancamentoIndividual() {
  const [historico, setHistorico] = useState<Lancamento[]>([]);
  const [selectedIrmao, setSelectedIrmao] = useState("");
  const [tipo, setTipo] = useState("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState<Date>(new Date());

  const handleLancar = () => {
    if (!selectedIrmao) { toast.error("Selecione um irmão."); return; }
    if (!tipo) { toast.error("Selecione o tipo."); return; }
    const v = parseFloat(valor.replace(",", ".")) || 0;
    if (v <= 0) { toast.error("Informe um valor válido."); return; }

    const irmao = irmaos.find((i) => i.id.toString() === selectedIrmao);
    const novo: Lancamento = {
      id: Date.now(),
      irmao: irmao?.nome || "",
      data,
      tipo,
      valor: v,
      descricao: descricao.trim() || tipoLabels[tipo],
    };
    setHistorico((prev) => [novo, ...prev]);
    setTipo("");
    setValor("");
    setDescricao("");
    setData(new Date());
    toast.success(`Lançamento registrado para ${irmao?.nome}.`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-sans font-semibold">Novo Lançamento Individual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Irmão *</Label>
              <Select value={selectedIrmao} onValueChange={setSelectedIrmao}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {irmaos.map((i) => (
                    <SelectItem key={i.id} value={i.id.toString()}>{i.nome} — CIM {i.cim}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensalidade">Mensalidade</SelectItem>
                  <SelectItem value="avulso">Valor Avulso</SelectItem>
                  <SelectItem value="taxa">Taxa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Valor (R$) *</Label>
              <Input placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value.replace(/[^\d,]/g, ""))} maxLength={12} />
            </div>
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(data, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={data} onSelect={(d) => d && setData(d)} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Descrição</Label>
              <Input placeholder="Descrição do lançamento" value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={100} />
            </div>
          </div>
          <Button onClick={handleLancar} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Registrar Lançamento
          </Button>
        </CardContent>
      </Card>

      {historico.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-sans font-semibold">Lançamentos Realizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Irmão</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historico.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.irmao}</TableCell>
                      <TableCell>{format(l.data, "dd/MM/yyyy")}</TableCell>
                      <TableCell><Badge variant="outline" className={tipoBadge[l.tipo]}>{tipoLabels[l.tipo]}</Badge></TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(l.valor)}</TableCell>
                      <TableCell className="text-muted-foreground">{l.descricao}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
