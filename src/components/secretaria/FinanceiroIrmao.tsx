import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarIcon, DollarSign, Clock, Plus, Loader2, User, FileText, TrendingUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/PermissionGate";

interface MemberDetail {
  id: string;
  full_name: string;
  cim: string;
  cpf: string;
  degree: string;
  status: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface Transaction {
  id: string;
  tipo: string;
  valor: number;
  descricao: string;
  data: string;
  created_at: string;
}

const degreeLabels: Record<string, string> = {
  aprendiz: "Aprendiz (1°)",
  companheiro: "Companheiro (2°)",
  mestre: "Mestre (3°)",
};

const statusLabels: Record<string, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  licenciado: "Licenciado",
  suspenso: "Suspenso",
  falecido: "Falecido",
};

const statusBadge: Record<string, string> = {
  ativo: "bg-success/10 text-success border-success/20",
  inativo: "bg-muted text-muted-foreground border-border",
  licenciado: "bg-warning/10 text-warning border-warning/20",
  suspenso: "bg-destructive/10 text-destructive border-destructive/20",
  falecido: "bg-muted text-muted-foreground border-border",
};

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

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parseCurrencyInput(raw: string): string {
  return raw.replace(/[^\d,]/g, "");
}

function currencyToNumber(raw: string): number {
  return parseFloat(raw.replace(",", ".")) || 0;
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export function FinanceiroIrmao() {
  const [members, setMembers] = useState<MemberDetail[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [saving, setSaving] = useState(false);

  // form
  const [tipo, setTipo] = useState<string>("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState<Date>(new Date());

  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    const { data, error } = await supabase
      .from("members")
      .select("id, full_name, cim, cpf, degree, status, email, phone, avatar_url")
      .order("full_name");
    if (!error && data) setMembers(data);
    setLoadingMembers(false);
  }, []);

  const fetchTransactions = useCallback(async (memberId: string) => {
    setLoadingTx(true);
    const { data, error } = await supabase
      .from("member_transactions")
      .select("id, tipo, valor, descricao, data, created_at")
      .eq("member_id", memberId)
      .order("data", { ascending: false });
    if (!error && data) setTransactions(data);
    else setTransactions([]);
    setLoadingTx(false);
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  useEffect(() => {
    if (selectedId) fetchTransactions(selectedId);
    else setTransactions([]);
  }, [selectedId, fetchTransactions]);

  const selected = members.find((m) => m.id === selectedId);
  const totalPago = transactions.reduce((s, t) => s + Number(t.valor), 0);
  const totalMensalidades = transactions.filter((t) => t.tipo === "mensalidade").reduce((s, t) => s + Number(t.valor), 0);
  const totalTaxas = transactions.filter((t) => t.tipo === "taxa").reduce((s, t) => s + Number(t.valor), 0);
  const ultimaMov = transactions.length > 0 ? transactions[0] : null;

  const handleLancamento = async () => {
    if (!selected) { toast.error("Selecione um irmão antes de registrar."); return; }
    if (!tipo) { toast.error("Selecione o tipo de lançamento."); return; }
    const v = currencyToNumber(valor);
    if (v <= 0 || isNaN(v)) { toast.error("O valor deve ser maior que zero."); return; }

    setSaving(true);
    const { error } = await supabase.from("member_transactions").insert({
      member_id: selectedId,
      tipo,
      valor: v,
      descricao: descricao.trim() || tipoLabels[tipo],
      data: format(data, "yyyy-MM-dd"),
    });

    if (error) {
      toast.error("Erro ao registrar lançamento.");
    } else {
      toast.success(`Lançamento de ${formatCurrency(v)} registrado para ${selected.full_name}.`);
      setTipo("");
      setValor("");
      setDescricao("");
      setData(new Date());
      fetchTransactions(selectedId);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Seletor */}
      <Card>
        <CardContent className="pt-6">
          <div className="max-w-sm space-y-1.5">
            <Label>Selecione o Irmão</Label>
            {loadingMembers ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Nenhum irmão cadastrado. Cadastre um irmão na aba "Cadastro de Irmãos".</p>
            ) : (
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um irmão" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name} — CIM {m.cim}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {!selected && members.length > 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <FileText className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.2} />
          <p className="text-sm text-muted-foreground">Selecione um irmão para visualizar o financeiro.</p>
        </div>
      )}

      {selected && (
        <>
          {/* Ficha do irmão */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Avatar className="h-14 w-14">
                  {selected.avatar_url ? <AvatarImage src={selected.avatar_url} alt={selected.full_name} /> : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">{getInitials(selected.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-lg leading-tight">{selected.full_name}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5">{degreeLabels[selected.degree] || selected.degree}</Badge>
                    <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5", statusBadge[selected.status])}>{statusLabels[selected.status] || selected.status}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-xs text-muted-foreground">
                    <span>CPF: <span className="text-foreground font-medium">{selected.cpf}</span></span>
                    <span>CIM: <span className="text-foreground font-medium">{selected.cim}</span></span>
                    {selected.email && <span>Email: <span className="text-foreground font-medium">{selected.email}</span></span>}
                    {selected.phone && <span>Tel: <span className="text-foreground font-medium">{selected.phone}</span></span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo financeiro */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Total Pago</p>
                  <p className="text-xl font-bold font-serif">{formatCurrency(totalPago)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Mensalidades</p>
                  <p className="text-xl font-bold font-serif">{formatCurrency(totalMensalidades)}</p>
                  <p className="text-[10px] text-muted-foreground">{transactions.filter((t) => t.tipo === "mensalidade").length} lançamento(s)</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                  <AlertCircle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Taxas</p>
                  <p className="text-xl font-bold font-serif">{formatCurrency(totalTaxas)}</p>
                  <p className="text-[10px] text-muted-foreground">{transactions.filter((t) => t.tipo === "taxa").length} lançamento(s)</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Última Movimentação</p>
                  {ultimaMov ? (
                    <>
                      <p className="text-sm font-semibold">{format(new Date(ultimaMov.data + "T12:00:00"), "dd/MM/yyyy")}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">{ultimaMov.descricao}</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sem registros</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Novo Lançamento */}
          <PermissionGate module="secretaria" action="write">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-sans font-semibold">Novo Lançamento</CardTitle>
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
                    <Input placeholder="0,00" value={valor} onChange={(e) => setValor(parseCurrencyInput(e.target.value))} maxLength={12} />
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
                        <Calendar mode="single" selected={data} onSelect={(d) => d && setData(d)} locale={ptBR} initialFocus className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Descrição</Label>
                    <Input placeholder="Descrição do lançamento" value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={100} />
                  </div>
                </div>
                <div className="mt-4">
                  <Button onClick={handleLancamento} disabled={saving} className="gap-1.5">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {saving ? "Registrando..." : "Registrar Lançamento"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </PermissionGate>

          {/* Histórico */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-sans font-semibold">Histórico Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTx ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : (
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
                      {transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            Nenhum lançamento registrado para este irmão.
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell className="font-medium">{format(new Date(t.data + "T12:00:00"), "dd/MM/yyyy")}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5", tipoBadgeClass[t.tipo])}>{tipoLabels[t.tipo] || t.tipo}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(Number(t.valor))}</TableCell>
                            <TableCell className="text-muted-foreground">{t.descricao}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
