import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, ChevronRight, ChevronLeft, CheckCircle2, Send, Eye, Settings2 } from "lucide-react";
import { toast } from "sonner";

const irmaos = [
  { id: 1, nome: "João Silva", cim: "123456" },
  { id: 2, nome: "Carlos Mendes", cim: "234567" },
  { id: 3, nome: "Pedro Alves", cim: "345678" },
  { id: 4, nome: "Marcos Oliveira", cim: "456789" },
  { id: 5, nome: "Antônio Souza", cim: "567890" },
];

const tipoLabels: Record<string, string> = { mensalidade: "Mensalidade", taxa: "Taxa" };
const tipoBadge: Record<string, string> = {
  mensalidade: "bg-primary/10 text-primary border-primary/20",
  taxa: "bg-warning/10 text-warning border-warning/20",
};

type Step = "config" | "preview" | "done";

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function LancamentoLote() {
  const [step, setStep] = useState<Step>("config");

  // form
  const [tipo, setTipo] = useState("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState<Date>(new Date());
  const [selecaoMode, setSelecaoMode] = useState<"todos" | "manual">("todos");
  const [selected, setSelected] = useState<number[]>([]);

  const targetIds = selecaoMode === "todos" ? irmaos.map((i) => i.id) : selected;
  const targetIrmaos = irmaos.filter((i) => targetIds.includes(i.id));
  const valorNum = parseFloat(valor.replace(",", ".")) || 0;

  const allManualSelected = selected.length === irmaos.length;
  const toggleAll = () => setSelected(allManualSelected ? [] : irmaos.map((i) => i.id));
  const toggle = (id: number) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const canAdvance = () => {
    if (!tipo) { toast.error("Selecione o tipo de lançamento."); return false; }
    if (valorNum <= 0) { toast.error("Informe um valor válido."); return false; }
    if (targetIds.length === 0) { toast.error("Selecione ao menos um irmão."); return false; }
    return true;
  };

  const goPreview = () => { if (canAdvance()) setStep("preview"); };

  const confirmar = () => {
    setStep("done");
    toast.success(`${targetIrmaos.length} lançamento(s) registrado(s) com sucesso.`);
  };

  const resetAll = () => {
    setStep("config");
    setTipo("");
    setValor("");
    setDescricao("");
    setData(new Date());
    setSelecaoMode("todos");
    setSelected([]);
  };

  // ── Steps indicator ──
  const steps = [
    { key: "config", label: "Configurar", icon: Settings2 },
    { key: "preview", label: "Revisar", icon: Eye },
    { key: "done", label: "Confirmado", icon: CheckCircle2 },
  ] as const;

  const currentIdx = steps.findIndex((s) => s.key === step);

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const active = idx === currentIdx;
          const completed = idx < currentIdx;
          return (
            <div key={s.key} className="flex items-center gap-2">
              {idx > 0 && <div className={cn("h-px w-8 sm:w-12", completed ? "bg-primary" : "bg-border")} />}
              <div className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                active && "bg-primary text-primary-foreground",
                completed && "bg-primary/10 text-primary",
                !active && !completed && "bg-muted text-muted-foreground",
              )}>
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── STEP 1: Config ── */}
      {step === "config" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-sans font-semibold">Dados do Lançamento</CardTitle>
              <CardDescription>Defina o tipo, valor e data que serão aplicados a todos os irmãos selecionados.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label>Tipo *</Label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensalidade">Mensalidade</SelectItem>
                      <SelectItem value="taxa">Taxa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Valor padrão (R$) *</Label>
                  <Input placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value.replace(/[^\d,]/g, ""))} maxLength={12} />
                </div>
                <div className="space-y-1.5">
                  <Label>Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
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
                  <Label>Descrição padrão</Label>
                  <Input placeholder="Ex: Mensalidade Fev/2026" value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={100} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-sans font-semibold">Seleção de Irmãos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={selecaoMode} onValueChange={(v) => setSelecaoMode(v as "todos" | "manual")} className="flex gap-6">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="todos" id="todos" />
                  <Label htmlFor="todos" className="font-normal cursor-pointer">Todos os irmãos ({irmaos.length})</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual" className="font-normal cursor-pointer">Selecionar manualmente</Label>
                </div>
              </RadioGroup>

              {selecaoMode === "manual" && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox checked={allManualSelected} onCheckedChange={toggleAll} aria-label="Selecionar todos" />
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
              )}

              <div className="flex justify-end pt-2">
                <Button onClick={goPreview} className="gap-1.5">
                  Revisar Lançamentos
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── STEP 2: Preview ── */}
      {step === "preview" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-sans font-semibold">Prévia dos Lançamentos</CardTitle>
            <CardDescription>
              Confira os {targetIrmaos.length} lançamento(s) abaixo antes de confirmar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resumo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="font-medium text-sm">{tipoLabels[tipo]}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Valor unitário</p>
                <p className="font-medium text-sm">{formatCurrency(valorNum)}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Total geral</p>
                <p className="font-bold text-sm font-serif">{formatCurrency(valorNum * targetIrmaos.length)}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Data</p>
                <p className="font-medium text-sm">{format(data, "dd/MM/yyyy")}</p>
              </div>
            </div>

            <Separator />

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Irmão</TableHead>
                    <TableHead>CIM</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {targetIrmaos.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{i.cim}</TableCell>
                      <TableCell><Badge variant="outline" className={tipoBadge[tipo]}>{tipoLabels[tipo]}</Badge></TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(valorNum)}</TableCell>
                      <TableCell className="text-muted-foreground">{descricao || tipoLabels[tipo]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep("config")} className="gap-1.5">
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={confirmar} className="gap-1.5">
                <Send className="h-4 w-4" />
                Confirmar {targetIrmaos.length} Lançamento(s)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── STEP 3: Done ── */}
      {step === "done" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-serif font-bold">Lançamento Concluído</h2>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {targetIrmaos.length} lançamento(s) de <strong>{formatCurrency(valorNum)}</strong> ({tipoLabels[tipo]}) registrado(s) com sucesso em {format(data, "dd/MM/yyyy")}.
            </p>
            <Button variant="outline" onClick={resetAll} className="mt-2">Novo Lançamento em Lote</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
