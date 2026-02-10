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
import { CalendarIcon, DollarSign, Clock, Plus, Loader2, User, FileText, TrendingUp, AlertCircle, CheckCircle2, XCircle, Hash, ArrowUpDown, ArrowUp, ArrowDown, X } from "lucide-react";
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
  status: string;
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

  // filters for history
  const [sortAsc, setSortAsc] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>(undefined);
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>(undefined);
  const [filterSituacao, setFilterSituacao] = useState<string>("all");

  // form
  const [tipo, setTipo] = useState<string>("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState<Date>(new Date());
  const [situacao, setSituacao] = useState<string>("pago");

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
      .select("id, tipo, valor, descricao, data, status, created_at")
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
  const totalQtd = transactions.length;
  const ultimaMov = transactions.length > 0 ? transactions[0] : null;

  // Situação: conta lançamentos "em_aberto"
  const txEmAberto = transactions.filter((t) => t.status === "em_aberto");
  const totalEmAberto = txEmAberto.reduce((s, t) => s + Number(t.valor), 0);
  const isAdimplente = txEmAberto.length === 0;

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
      status: situacao,
    });

    if (error) {
      toast.error("Erro ao registrar lançamento.");
    } else {
      toast.success(`Lançamento de ${formatCurrency(v)} registrado para ${selected.full_name}.`);
      setTipo("");
      setValor("");
      setDescricao("");
      setData(new Date());
      setSituacao("pago");
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

          {/* Resumo Financeiro */}
          <Card className={cn("border-l-4", isAdimplente ? "border-l-success" : "border-l-destructive")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-sans font-semibold">Resumo Financeiro</CardTitle>
                <Badge variant="outline" className={cn("text-xs px-3 py-1 gap-1.5 font-medium", isAdimplente ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20")}>
                  {isAdimplente ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                  {isAdimplente ? "Adimplente" : "Inadimplente"}
                </Badge>
              </div>
              {!isAdimplente && (
                <p className="text-xs text-destructive mt-1">{txEmAberto.length} lançamento(s) em aberto — {formatCurrency(totalEmAberto)}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-success" />
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Total Pago</p>
                  </div>
                  <p className="text-lg font-bold font-serif">{formatCurrency(totalPago)}</p>
                </div>
                <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Em Aberto</p>
                  </div>
                  <p className="text-lg font-bold font-serif">{formatCurrency(totalEmAberto)}</p>
                </div>
                <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-primary" />
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Lançamentos</p>
                  </div>
                  <p className="text-lg font-bold font-serif">{totalQtd}</p>
                  <p className="text-[10px] text-muted-foreground">{transactions.filter(t => t.tipo === "mensalidade").length} mens. · {transactions.filter(t => t.tipo === "taxa").length} taxas · {transactions.filter(t => t.tipo === "avulso").length} avulsos</p>
                </div>
                <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Última Mov.</p>
                  </div>
                  {ultimaMov ? (
                    <>
                      <p className="text-sm font-semibold">{format(new Date(ultimaMov.data + "T12:00:00"), "dd/MM/yyyy")}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{ultimaMov.descricao}</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Novo Lançamento */}
          <PermissionGate module="secretaria" action="write">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-sans font-semibold">Novo Lançamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
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
                    <Label>Situação</Label>
                    <Select value={situacao} onValueChange={setSituacao}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="em_aberto">Em Aberto</SelectItem>
                      </SelectContent>
                    </Select>
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
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-base font-sans font-semibold">Histórico Financeiro</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                {/* Filtro por período */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1.5", filterDateFrom && "border-primary/40")}>
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {filterDateFrom ? format(filterDateFrom, "dd/MM/yy") : "De"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={filterDateFrom} onSelect={setFilterDateFrom} locale={ptBR} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1.5", filterDateTo && "border-primary/40")}>
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {filterDateTo ? format(filterDateTo, "dd/MM/yy") : "Até"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={filterDateTo} onSelect={setFilterDateTo} locale={ptBR} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                {/* Filtro por situação */}
                <Select value={filterSituacao} onValueChange={setFilterSituacao}>
                  <SelectTrigger className="h-8 w-[130px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="em_aberto">Em Aberto</SelectItem>
                  </SelectContent>
                </Select>
                {/* Ordenação */}
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setSortAsc((p) => !p)}>
                  {sortAsc ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                  {sortAsc ? "Mais antigo" : "Mais recente"}
                </Button>
                {/* Limpar filtros */}
                {(filterDateFrom || filterDateTo || filterSituacao !== "all") && (
                  <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-muted-foreground" onClick={() => { setFilterDateFrom(undefined); setFilterDateTo(undefined); setFilterSituacao("all"); }}>
                    <X className="h-3.5 w-3.5" /> Limpar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingTx ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : (() => {
                const filteredTx = transactions
                  .filter((t) => {
                    const d = new Date(t.data + "T12:00:00");
                    if (filterDateFrom && d < filterDateFrom) return false;
                    if (filterDateTo) { const to = new Date(filterDateTo); to.setHours(23, 59, 59); if (d > to) return false; }
                    if (filterSituacao !== "all" && t.status !== filterSituacao) return false;
                    return true;
                  })
                  .sort((a, b) => {
                    const da = new Date(a.data).getTime();
                    const db = new Date(b.data).getTime();
                    return sortAsc ? da - db : db - da;
                  });

                return (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead className="text-center">Situação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTx.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              {transactions.length === 0 ? "Nenhum lançamento registrado para este irmão." : "Nenhum lançamento encontrado para os filtros aplicados."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTx.map((t) => (
                            <TableRow key={t.id}>
                              <TableCell className="font-medium">{format(new Date(t.data + "T12:00:00"), "dd/MM/yyyy")}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5", tipoBadgeClass[t.tipo])}>{tipoLabels[t.tipo] || t.tipo}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(Number(t.valor))}</TableCell>
                              <TableCell className="text-muted-foreground">{t.descricao}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5", t.status === "pago" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20")}>
                                  {t.status === "pago" ? "Pago" : "Em Aberto"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
