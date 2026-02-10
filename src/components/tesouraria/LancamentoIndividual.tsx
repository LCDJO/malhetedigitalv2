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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, Check, ChevronsUpDown, Plus, RotateCcw, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import {
  formatCurrency,
  taxasMaconicasMock,
  irmaosComGrau,
  getSugestoesTaxas,
  grauLabels,
  type TaxaMaconica,
} from "@/components/dashboard/DashboardData";

interface Lancamento {
  id: number;
  irmao: string;
  data: Date;
  tipo: string;
  valor: number;
  descricao: string;
}

const tipoLabels: Record<string, string> = { mensalidade: "Mensalidade", avulso: "Valor Avulso", taxa: "Taxa" };
const tipoBadge: Record<string, string> = {
  mensalidade: "bg-primary/10 text-primary border-primary/20",
  avulso: "bg-accent/20 text-accent-foreground border-accent/30",
  taxa: "bg-warning/10 text-warning border-warning/20",
};

const emptyForm = { irmaoId: "", tipo: "", valor: "", descricao: "", data: new Date() };

export function LancamentoIndividual() {
  const [historico, setHistorico] = useState<Lancamento[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [comboOpen, setComboOpen] = useState(false);

  const selectedIrmao = irmaosComGrau.find((i) => i.id.toString() === form.irmaoId);
  const sugestoes = selectedIrmao ? getSugestoesTaxas(selectedIrmao, taxasMaconicasMock) : [];

  const resetForm = () => setForm(emptyForm);

  const applySugestao = (taxa: TaxaMaconica) => {
    setForm((f) => ({
      ...f,
      tipo: "taxa",
      valor: taxa.valorPadrao.toString().replace(".", ","),
      descricao: taxa.nome,
    }));
    toast.info(`Taxa "${taxa.nome}" aplicada — ${formatCurrency(taxa.valorPadrao)}`);
  };

  const handleSalvar = () => {
    if (!form.irmaoId) { toast.error("É obrigatório selecionar um irmão para o lançamento."); return; }
    if (!form.tipo) { toast.error("Selecione o tipo de lançamento (mensalidade, avulso ou taxa)."); return; }
    const v = parseFloat(form.valor.replace(",", ".")) || 0;
    if (v <= 0 || isNaN(v)) { toast.error("O valor deve ser maior que zero."); return; }

    const irmao = irmaosComGrau.find((i) => i.id.toString() === form.irmaoId);
    if (!irmao) { toast.error("Irmão não encontrado."); return; }

    const novo: Lancamento = {
      id: Date.now(),
      irmao: irmao.nome,
      data: form.data,
      tipo: form.tipo,
      valor: v,
      descricao: form.descricao.trim() || tipoLabels[form.tipo],
    };
    setHistorico((prev) => [novo, ...prev]);
    resetForm();
    toast.success(`Lançamento de ${formatCurrency(v)} registrado para ${irmao.nome}.`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-sans font-semibold">Novo Lançamento Individual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Irmão com busca */}
          <div className="space-y-1.5 max-w-sm">
            <Label>Irmão *</Label>
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={comboOpen} className="w-full justify-between font-normal">
                  {selectedIrmao
                    ? `${selectedIrmao.nome} — CIM ${selectedIrmao.cim}`
                    : "Buscar irmão..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar por nome ou CIM..." />
                  <CommandList>
                    <CommandEmpty>Nenhum irmão encontrado.</CommandEmpty>
                    <CommandGroup>
                      {irmaosComGrau.map((i) => (
                        <CommandItem
                          key={i.id}
                          value={`${i.nome} ${i.cim}`}
                          onSelect={() => { setForm((f) => ({ ...f, irmaoId: i.id.toString() })); setComboOpen(false); }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", form.irmaoId === i.id.toString() ? "opacity-100" : "opacity-0")} />
                          <div className="flex items-center gap-2 flex-1">
                            <span>{i.nome}</span>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 ml-auto mr-2">
                              {grauLabels[i.grau]}
                            </Badge>
                            <span className="text-xs text-muted-foreground">CIM {i.cim}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Sugestões de taxas */}
          {selectedIrmao && sugestoes.length > 0 && (
            <Card className="border-accent/25 bg-accent/5">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-accent" strokeWidth={1.6} />
                  <p className="text-xs font-semibold text-accent-foreground">Taxas sugeridas para {selectedIrmao.nome}</p>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-accent/10 text-accent-foreground border-accent/20">
                    {grauLabels[selectedIrmao.grau]}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sugestoes.map((taxa) => (
                    <Button
                      key={taxa.id}
                      variant="outline"
                      size="sm"
                      className="h-auto py-2 px-3 text-left gap-2 border-accent/20 hover:bg-accent/10 hover:border-accent/40"
                      onClick={() => applySugestao(taxa)}
                    >
                      <div>
                        <p className="text-xs font-medium">{taxa.nome}</p>
                        <p className="text-[10px] text-muted-foreground">{formatCurrency(taxa.valorPadrao)}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo de lançamento *</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
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
              <Input placeholder="0,00" value={form.valor} onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value.replace(/[^\d,]/g, "") }))} maxLength={12} />
            </div>
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(form.data, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={form.data} onSelect={(d) => d && setForm((f) => ({ ...f, data: d }))} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input placeholder="Ex: Mensalidade referente a Fev/2026" value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} maxLength={120} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSalvar} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Salvar Lançamento
            </Button>
            <Button variant="outline" onClick={resetForm} className="gap-1.5">
              <RotateCcw className="h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Registros recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-sans font-semibold">Registros Recentes</CardTitle>
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
                {historico.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum lançamento registrado nesta sessão
                    </TableCell>
                  </TableRow>
                ) : (
                  historico.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.irmao}</TableCell>
                      <TableCell>{format(l.data, "dd/MM/yyyy")}</TableCell>
                      <TableCell><Badge variant="outline" className={tipoBadge[l.tipo]}>{tipoLabels[l.tipo]}</Badge></TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(l.valor)}</TableCell>
                      <TableCell className="text-muted-foreground">{l.descricao}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
