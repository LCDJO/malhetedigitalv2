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
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarIcon, DollarSign, Clock, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { isencoesMock, getIsencaoAtiva } from "@/components/dashboard/DashboardData";

interface Lancamento {
  id: number;
  data: Date;
  tipo: "mensalidade" | "avulso" | "taxa";
  valor: number;
  descricao: string;
}

interface IrmaoFinanceiro {
  id: number;
  nome: string;
  cim: string;
  lancamentos: Lancamento[];
}

const tipoLabels: Record<string, string> = {
  mensalidade: "Mensalidade",
  avulso: "Valor Avulso",
  taxa: "Taxa",
};

const tipoBadgeClass: Record<string, string> = {
  mensalidade: "bg-primary/10 text-primary border-primary/20",
  avulso: "bg-accent/20 text-accent-foreground border-accent/30",
  taxa: "bg-warning/10 text-warning border-warning/20",
};

const dados: IrmaoFinanceiro[] = [
  {
    id: 1, nome: "João Silva", cim: "123456",
    lancamentos: [
      { id: 1, data: new Date(2026, 0, 5), tipo: "mensalidade", valor: 280, descricao: "Mensalidade Jan/2026" },
      { id: 2, data: new Date(2026, 1, 3), tipo: "mensalidade", valor: 280, descricao: "Mensalidade Fev/2026" },
      { id: 3, data: new Date(2026, 1, 3), tipo: "taxa", valor: 50, descricao: "Taxa de expediente" },
    ],
  },
  {
    id: 2, nome: "Carlos Mendes", cim: "234567",
    lancamentos: [
      { id: 4, data: new Date(2026, 0, 10), tipo: "mensalidade", valor: 280, descricao: "Mensalidade Jan/2026" },
    ],
  },
  {
    id: 3, nome: "Pedro Alves", cim: "345678",
    lancamentos: [],
  },
];

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parseCurrencyInput(raw: string): string {
  return raw.replace(/[^\d,]/g, "");
}

function currencyToNumber(raw: string): number {
  return parseFloat(raw.replace(",", ".")) || 0;
}

export function FinanceiroIrmao() {
  const [allData, setAllData] = useState(dados);
  const [selectedId, setSelectedId] = useState<string>("");

  // form
  const [tipo, setTipo] = useState<string>("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState<Date>(new Date());

  const selected = allData.find((d) => d.id.toString() === selectedId);
  const isencaoAtiva = selected ? getIsencaoAtiva(selected.id, isencoesMock) : undefined;

  const totalPago = selected ? selected.lancamentos.reduce((s, l) => s + l.valor, 0) : 0;
  const ultimaMov = selected && selected.lancamentos.length > 0
    ? selected.lancamentos.reduce((latest, l) => (l.data > latest.data ? l : latest))
    : null;

  const handleLancamento = () => {
    if (!selected) { toast.error("Selecione um irmão antes de registrar."); return; }
    if (isencaoAtiva) { toast.error("Este irmão está isento. Não é possível gerar lançamentos automáticos."); return; }
    if (!tipo) { toast.error("Selecione o tipo de lançamento."); return; }
    const v = currencyToNumber(valor);
    if (v <= 0 || isNaN(v)) { toast.error("O valor deve ser maior que zero."); return; }

    const novo: Lancamento = {
      id: Date.now(),
      data,
      tipo: tipo as Lancamento["tipo"],
      valor: v,
      descricao: descricao.trim() || tipoLabels[tipo],
    };

    setAllData((prev) =>
      prev.map((d) =>
        d.id === selected.id ? { ...d, lancamentos: [novo, ...d.lancamentos] } : d
      )
    );
    setTipo("");
    setValor("");
    setDescricao("");
    setData(new Date());
    toast.success(`Lançamento de ${formatCurrency(v)} registrado para ${selected.nome}.`);
  };

  return (
    <div className="space-y-6">
      {/* Seletor */}
      <Card>
        <CardContent className="pt-6">
          <div className="max-w-sm space-y-1.5">
            <Label>Selecione o Irmão</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um irmão" />
              </SelectTrigger>
              <SelectContent>
                {allData.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.nome} — CIM {d.cim}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!selected && (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          Selecione um irmão para visualizar o financeiro.
        </div>
      )}

      {selected && (
        <>
          {/* Exemption Banner */}
          {isencaoAtiva && (
            <Card className="border-success/30 bg-success/5">
              <CardContent className="flex items-start gap-3 pt-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/15">
                  <ShieldCheck className="h-5 w-5 text-success" strokeWidth={1.6} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-success">Irmão com Isenção Ativa</p>
                    <Badge variant="outline" className="text-[10px] px-2 py-0 bg-success/10 text-success border-success/20">
                      {isencaoAtiva.tipo === "permanente" ? "Permanente" : "Temporária"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{isencaoAtiva.motivo}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Desde {isencaoAtiva.dataInicio}
                    {isencaoAtiva.dataFim ? ` até ${isencaoAtiva.dataFim}` : " — sem data de término"}
                  </p>
                  <p className="text-[10px] text-warning font-medium mt-1">
                    ⚠ Lançamentos automáticos suspensos durante o período de isenção.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resumo financeiro */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Pago</p>
                  <p className="text-xl font-bold font-serif">{formatCurrency(totalPago)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                  <DollarSign className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total em Aberto</p>
                  <p className="text-xl font-bold font-serif">{formatCurrency(0)}</p>
                  <p className="text-[10px] text-muted-foreground">Nenhuma pendência</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Última Movimentação</p>
                  {ultimaMov ? (
                    <>
                      <p className="text-sm font-semibold">{format(ultimaMov.data, "dd/MM/yyyy")}</p>
                      <p className="text-[10px] text-muted-foreground">{ultimaMov.descricao}</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sem registros</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lançamento */}
          <Card className={cn(isencaoAtiva && "opacity-60 pointer-events-none select-none")}>
            <CardHeader>
              <CardTitle className="text-base font-sans font-semibold flex items-center gap-2">
                Novo Lançamento
                {isencaoAtiva && (
                  <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/20">
                    Bloqueado — irmão isento
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
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
                  <Input
                    placeholder="0,00"
                    value={valor}
                    onChange={(e) => setValor(parseCurrencyInput(e.target.value))}
                    maxLength={12}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !data && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(data, "dd/MM/yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={data}
                        onSelect={(d) => d && setData(d)}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5">
                  <Label>Descrição</Label>
                  <Input
                    placeholder="Descrição do lançamento"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    maxLength={100}
                  />
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={handleLancamento} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Registrar Lançamento
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Histórico */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-sans font-semibold">Histórico Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Descrição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selected.lancamentos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Nenhum lançamento registrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      selected.lancamentos.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="font-medium">{format(l.data, "dd/MM/yyyy")}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={tipoBadgeClass[l.tipo]}>
                              {tipoLabels[l.tipo]}
                            </Badge>
                          </TableCell>
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
        </>
      )}
    </div>
  );
}
