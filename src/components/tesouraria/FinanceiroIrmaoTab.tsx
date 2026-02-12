import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { User, Users, Receipt, ChevronsUpDown, Check, Loader2, Wallet, GraduationCap, CalendarDays, TrendingDown, TrendingUp, Scale, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { LancamentoIndividual } from "@/components/tesouraria/LancamentoIndividual";
import { LancamentoLote } from "@/components/tesouraria/LancamentoLote";
import { TaxasMaconicas } from "@/components/tesouraria/TaxasMaconicas";
import { NovoDebito } from "@/components/tesouraria/NovoDebito";
import { NovoCredito } from "@/components/tesouraria/NovoCredito";
import { NovoLancamento } from "@/components/tesouraria/NovoLancamento";
import { PermissionGate } from "@/components/PermissionGate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IsencaoIrmao } from "@/components/secretaria/IsencaoIrmao";

interface MemberOption {
  id: string;
  full_name: string;
  cim: string | null;
  cpf: string | null;
  degree: string;
  status: string;
  initiation_date: string | null;
}

interface TransactionRow {
  id: string;
  data: string;
  tipo: string;
  descricao: string;
  valor: number;
  status: string;
}

const tipoLabels: Record<string, string> = { mensalidade: "Mensalidade", avulso: "Valor Avulso", taxa: "Taxa" };

export function FinanceiroIrmaoTab() {
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [comboOpen, setComboOpen] = useState(false);
  const [loadingPanel, setLoadingPanel] = useState(false);
  const [financeiro, setFinanceiro] = useState<{ debitos: number; creditos: number; mesesAtraso: number } | null>(null);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);

  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    const { data } = await supabase
      .from("members")
      .select("id, full_name, cim, cpf, degree, status, initiation_date")
      .eq("status", "ativo")
      .order("full_name");
    if (data) setMembers(data);
    setLoadingMembers(false);
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  const fetchFinanceiro = useCallback(async (memberId: string) => {
    const [summaryRes, txRes] = await Promise.all([
      supabase.rpc("member_financial_summary", { _member_id: memberId }),
      supabase
        .from("member_transactions")
        .select("id, data, tipo, descricao, valor, status")
        .eq("member_id", memberId)
        .order("data", { ascending: true })
        .limit(500),
    ]);

    const rows = txRes.data ?? [];
    setTransactions(rows);

    if (summaryRes.data && summaryRes.data.length > 0) {
      const s = summaryRes.data[0];
      setFinanceiro({
        debitos: Number(s.total_debitos),
        creditos: Number(s.total_creditos),
        mesesAtraso: Number(s.meses_atraso),
      });
    } else {
      let debitos = 0;
      let creditos = 0;
      const now = new Date();
      const mesesSet = new Set<string>();
      for (const t of rows) {
        if (t.status === "em aberto") {
          debitos += Number(t.valor);
          const d = new Date(t.data);
          if (d <= now) mesesSet.add(`${d.getFullYear()}-${d.getMonth()}`);
        } else {
          creditos += Number(t.valor);
        }
      }
      setFinanceiro({ debitos, creditos, mesesAtraso: mesesSet.size });
    }
  }, []);

  const handleSelect = (id: string) => {
    setSelectedMemberId(id);
    setComboOpen(false);
    setLoadingPanel(true);
    setFinanceiro(null);
    fetchFinanceiro(id).finally(() => setLoadingPanel(false));
  };

  const refreshFinanceiro = useCallback(() => {
    if (selectedMemberId) fetchFinanceiro(selectedMemberId);
  }, [selectedMemberId, fetchFinanceiro]);

  const formatCpfPreview = (cpf: string | null) => {
    if (!cpf) return "";
    const digits = cpf.replace(/\D/g, "");
    if (digits.length === 11) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    return cpf;
  };

  return (
    <div className="space-y-6">
      {/* Busca obrigatória de obreiro */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-1.5 max-w-md">
            <label className="text-sm font-medium">Selecionar Obreiro *</label>
            {loadingMembers ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando obreiros...
              </div>
            ) : (
              <Popover open={comboOpen} onOpenChange={setComboOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={comboOpen} className="w-full justify-between font-normal">
                    {selectedMember
                      ? `${selectedMember.full_name}${selectedMember.cim ? ` — CIM ${selectedMember.cim}` : ""}`
                      : "Buscar por nome, CPF ou CIM..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50 bg-popover" align="start">
                  <Command>
                    <CommandInput placeholder="Nome, CPF ou CIM..." />
                    <CommandList>
                      <CommandEmpty>Nenhum obreiro encontrado.</CommandEmpty>
                      <CommandGroup>
                        {members.map((m) => (
                          <CommandItem
                            key={m.id}
                            value={`${m.full_name} ${m.cim ?? ""} ${m.cpf ?? ""}`}
                            onSelect={() => handleSelect(m.id)}
                          >
                            <Check className={cn("mr-2 h-4 w-4", selectedMemberId === m.id ? "opacity-100" : "opacity-0")} />
                            <div className="flex flex-col flex-1 gap-0.5">
                              <span className="text-sm">{m.full_name}</span>
                              <div className="flex gap-3 text-[11px] text-muted-foreground">
                                {m.cim && <span>CIM {m.cim}</span>}
                                {m.cpf && <span>CPF {formatCpfPreview(m.cpf)}</span>}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estado vazio */}
      {!selectedMemberId && !loadingPanel && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">Nenhum obreiro selecionado</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Selecione um obreiro para visualizar o demonstrativo financeiro.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading panel */}
      {loadingPanel && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando painel financeiro...</p>
          </CardContent>
        </Card>
      )}

      {/* Conteúdo financeiro */}
      {selectedMemberId && !loadingPanel && selectedMember && (() => {
        const degreeLabels: Record<string, string> = {
          aprendiz: "Aprendiz",
          companheiro: "Companheiro",
          mestre: "Mestre",
        };
        const statusLabels: Record<string, { label: string; cls: string }> = {
          ativo: { label: "Ativo", cls: "bg-success/10 text-success border-success/20" },
          afastado: { label: "Afastado", cls: "bg-warning/10 text-warning border-warning/20" },
          inativo: { label: "Inativo", cls: "bg-muted text-muted-foreground" },
        };
        const st = statusLabels[selectedMember.status] ?? { label: selectedMember.status, cls: "" };

        return (
          <>
            {/* Card institucional do obreiro */}
            <Card className="border-l-4 border-l-primary/40">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">{selectedMember.full_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{degreeLabels[selectedMember.degree] ?? selectedMember.degree}</span>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px]", st.cls)}>{st.label}</Badge>
                  {selectedMember.initiation_date && (
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Ingresso: {format(new Date(selectedMember.initiation_date), "dd/MM/yyyy")}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* KPIs financeiros */}
            {financeiro && (() => {
              const saldo = financeiro.creditos - financeiro.debitos;
              const adimplente = financeiro.debitos === 0;
              const mesesAtraso = financeiro.mesesAtraso;
              const situacao = adimplente
                ? { label: "Adimplente", color: "text-success", bg: "bg-success/10", border: "", dot: "bg-success" }
                : mesesAtraso <= 2
                  ? { label: "Atenção", color: "text-warning", bg: "bg-warning/10", border: "border-warning/30 bg-warning/5", dot: "bg-warning" }
                  : { label: "Inadimplente", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30 bg-destructive/5", dot: "bg-destructive" };
              const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                        <TrendingDown className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-destructive">{fmt(financeiro.debitos)}</p>
                        <p className="text-xs text-muted-foreground">Total de Débitos</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                        <TrendingUp className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-success">{fmt(financeiro.creditos)}</p>
                        <p className="text-xs text-muted-foreground">Total de Créditos</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className={saldo < 0 ? "border-destructive/30 bg-destructive/5" : ""}>
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", saldo < 0 ? "bg-destructive/10" : "bg-primary/10")}>
                        <Scale className={cn("h-5 w-5", saldo < 0 ? "text-destructive" : "text-primary")} />
                      </div>
                      <div>
                        <p className={cn("text-xl font-bold", saldo < 0 ? "text-destructive" : "text-foreground")}>{fmt(saldo)}</p>
                        <p className="text-xs text-muted-foreground">Saldo Atual</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className={situacao.border}>
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", situacao.bg)}>
                        <ShieldCheck className={cn("h-5 w-5", situacao.color)} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={cn("inline-block h-2.5 w-2.5 rounded-full", situacao.dot)} />
                          <p className={cn("text-base font-bold", situacao.color)}>{situacao.label}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {adimplente ? "Sem débitos em aberto" : `${mesesAtraso} ${mesesAtraso === 1 ? "mês" : "meses"} em atraso`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}

            {/* Demonstrativo Financeiro */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-sans font-semibold">Demonstrativo Financeiro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">Saldo Acumulado</TableHead>
                        <TableHead>Situação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                            Nenhuma movimentação registrada para este obreiro.
                          </TableCell>
                        </TableRow>
                      ) : (() => {
                        let saldoAcumulado = 0;
                        const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
                        return transactions.map((t) => {
                          const valor = Number(t.valor);
                          const isDebito = t.status === "em aberto";
                          if (isDebito) {
                            saldoAcumulado -= valor;
                          } else {
                            saldoAcumulado += valor;
                          }
                          return (
                            <TableRow key={t.id}>
                              <TableCell className="text-sm">{format(new Date(t.data), "dd/MM/yyyy")}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn("text-[10px]", isDebito ? "text-destructive border-destructive/30" : "text-success border-success/30")}>
                                  {isDebito ? "Débito" : "Crédito"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{tipoLabels[t.tipo] ?? t.tipo}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{t.descricao || "—"}</TableCell>
                              <TableCell className={cn("text-right text-sm font-medium", isDebito ? "text-destructive" : "text-success")}>
                                {isDebito ? "−" : "+"} {fmt(valor)}
                              </TableCell>
                              <TableCell className={cn("text-right text-sm font-semibold", saldoAcumulado < 0 ? "text-destructive" : "text-foreground")}>
                                {fmt(saldoAcumulado)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn("text-[10px]", t.status === "pago" ? "text-success border-success/30" : "text-warning border-warning/30")}>
                                  {t.status === "pago" ? "Pago" : "Em Aberto"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        });
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <PermissionGate module="tesouraria" action="write" hide>
              <NovoDebito memberId={selectedMemberId} memberName={selectedMember.full_name} onDebitoSaved={refreshFinanceiro} />
            </PermissionGate>
            <PermissionGate module="tesouraria" action="write" hide>
              <NovoCredito memberId={selectedMemberId} memberName={selectedMember.full_name} onCreditoSaved={refreshFinanceiro} />
            </PermissionGate>

            <PermissionGate module="tesouraria" action="write" hide>
              <div className="flex items-center gap-3">
                <NovoLancamento memberId={selectedMemberId} memberName={selectedMember.full_name} onLancamentoSaved={refreshFinanceiro} />
              </div>
            </PermissionGate>

          </>
        );
      })()}
    </div>
  );
}
