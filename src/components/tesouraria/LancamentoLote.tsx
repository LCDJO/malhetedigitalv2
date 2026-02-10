import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";

const irmaos = [
  { id: 1, nome: "João Silva", cim: "123456" },
  { id: 2, nome: "Carlos Mendes", cim: "234567" },
  { id: 3, nome: "Pedro Alves", cim: "345678" },
  { id: 4, nome: "Marcos Oliveira", cim: "456789" },
  { id: 5, nome: "Antônio Souza", cim: "567890" },
];

export function LancamentoLote() {
  const [selected, setSelected] = useState<number[]>([]);
  const [tipo, setTipo] = useState("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState<Date>(new Date());
  const [done, setDone] = useState(false);

  const allSelected = selected.length === irmaos.length;

  const toggleAll = () => {
    setSelected(allSelected ? [] : irmaos.map((i) => i.id));
  };

  const toggle = (id: number) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleLancar = () => {
    if (selected.length === 0) { toast.error("Selecione ao menos um irmão."); return; }
    if (!tipo) { toast.error("Selecione o tipo."); return; }
    const v = parseFloat(valor.replace(",", ".")) || 0;
    if (v <= 0) { toast.error("Informe um valor válido."); return; }

    toast.success(`Lançamento registrado para ${selected.length} irmão(s).`);
    setDone(true);
    setTimeout(() => {
      setSelected([]);
      setTipo("");
      setValor("");
      setDescricao("");
      setData(new Date());
      setDone(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Config do lote */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-sans font-semibold">Configuração do Lançamento em Lote</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input placeholder="Ex: Mensalidade Fev/2026" value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={100} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seleção de irmãos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-sans font-semibold">Selecionar Irmãos</CardTitle>
          <Badge variant="outline" className="font-normal">{selected.length} de {irmaos.length} selecionados</Badge>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Selecionar todos" />
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>CIM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {irmaos.map((irmao) => (
                  <TableRow key={irmao.id} className={cn(selected.includes(irmao.id) && "bg-primary/5")}>
                    <TableCell>
                      <Checkbox checked={selected.includes(irmao.id)} onCheckedChange={() => toggle(irmao.id)} />
                    </TableCell>
                    <TableCell className="font-medium">{irmao.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{irmao.cim}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4">
            <Button onClick={handleLancar} disabled={done} className="gap-1.5">
              {done ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              {done ? "Lançamento Registrado!" : `Lançar para ${selected.length} irmão(s)`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
