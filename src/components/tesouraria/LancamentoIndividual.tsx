import { useState, useEffect, useCallback } from "react";
import { createTransaction, listRecentTransactions, listActiveMembers } from "@/services/transactions";
import { supabase } from "@/integrations/supabase/client";
import { useLodgeConfig } from "@/hooks/useLodgeConfig";
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
import { CalendarIcon, Check, ChevronsUpDown, Plus, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGate } from "@/components/PermissionGate";
import { useAuditLog } from "@/hooks/useAuditLog";

interface MemberOption {
  id: string;
  full_name: string;
  cim: string;
  degree: string;
}

interface TransactionRow {
  id: string;
  data: string;
  tipo: string;
  descricao: string;
  valor: number;
  status: string;
  member_name?: string;
}

const tipoLabels: Record<string, string> = { mensalidade: "Mensalidade", avulso: "Valor Avulso", taxa: "Taxa" };
const tipoBadge: Record<string, string> = {
  mensalidade: "bg-primary/10 text-primary border-primary/20",
  avulso: "bg-accent/20 text-accent-foreground border-accent/30",
  taxa: "bg-warning/10 text-warning border-warning/20",
};

const emptyForm = { irmaoId: "", tipo: "", valor: "", descricao: "", data: new Date(), situacao: "em_aberto" };

interface LancamentoIndividualProps {
  onLancamentoSaved?: () => void;
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function LancamentoIndividual({ onLancamentoSaved }: LancamentoIndividualProps = {}) {
  const { session } = useAuth();
  const { logAction } = useAuditLog();
  const { config: lodgeConfig } = useLodgeConfig();
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [recentTx, setRecentTx] = useState<TransactionRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (form.tipo === "mensalidade" && !form.valor && lodgeConfig.mensalidade_padrao > 0) {
      setForm((f) => ({ ...f, valor: lodgeConfig.mensalidade_padrao.toFixed(2).replace(".", ",") }));
    }
  }, [form.tipo, lodgeConfig.mensalidade_padrao]);
  const [comboOpen, setComboOpen] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const data = await listActiveMembers("id, full_name, cim, degree");
      if (data) setMembers(data);
    } catch { /* silent */ }
    setLoadingMembers(false);
  }, []);

  // Fetch recent transactions created in this session (last 20)
  const fetchRecent = useCallback(async () => {
    try {
      const data = await listRecentTransactions(20);
      if (data) {
        // Enrich with member names
        const memberIds = [...new Set(data.map((t: any) => t.member_id))];
        const membersData = await listActiveMembers("id, full_name");
        const nameMap = new Map(membersData?.map((m: any) => [m.id, m.full_name]) ?? []);
        setRecentTx(data.map((t: any) => ({ ...t, member_name: nameMap.get(t.member_id) ?? "—" })));
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchMembers(); fetchRecent(); }, [fetchMembers, fetchRecent]);

  const selectedIrmao = members.find((m) => m.id === form.irmaoId);

  const resetForm = () => setForm(emptyForm);

  const handleSalvar = async () => {
    if (!form.irmaoId) { toast.error("É obrigatório selecionar um irmão para o lançamento."); return; }
    if (!form.tipo) { toast.error("Selecione o tipo de lançamento (mensalidade, avulso ou taxa)."); return; }
    const v = parseFloat(form.valor.replace(",", ".")) || 0;
    if (v <= 0 || isNaN(v)) { toast.error("O valor deve ser maior que zero."); return; }

    const irmao = members.find((m) => m.id === form.irmaoId);
    if (!irmao) { toast.error("Irmão não encontrado."); return; }

    setSaving(true);
    try {
      await createTransaction({
        member_id: form.irmaoId,
        tipo: form.tipo,
        descricao: form.descricao.trim() || tipoLabels[form.tipo],
        valor: v,
        data: format(form.data, "yyyy-MM-dd"),
        status: form.situacao,
        created_by: session?.user?.id,
      });
    } catch (e: any) {
      setSaving(false);
      toast.error("Erro ao registrar lançamento. Tente novamente.");
      return;
    }
    setSaving(false);

    logAction({
      action: form.situacao === "pago" ? "CREATE_CREDIT" : "CREATE_DEBIT",
      targetTable: "member_transactions",
      targetId: form.irmaoId,
      details: { member: irmao.full_name, tipo: form.tipo, valor: v, situacao: form.situacao },
    });

    toast.success(`Lançamento de ${formatCurrency(v)} registrado para ${irmao.full_name}.`);
    resetForm();
    fetchRecent();
    onLancamentoSaved?.();
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
            {loadingMembers ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
            ) : (
              <Popover open={comboOpen} onOpenChange={setComboOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={comboOpen} className="w-full justify-between font-normal">
                    {selectedIrmao
                      ? `${selectedIrmao.full_name} — CIM ${selectedIrmao.cim}`
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
                        {members.map((m) => (
                          <CommandItem
                            key={m.id}
                            value={`${m.full_name} ${m.cim}`}
                            onSelect={() => { setForm((f) => ({ ...f, irmaoId: m.id })); setComboOpen(false); }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", form.irmaoId === m.id ? "opacity-100" : "opacity-0")} />
                            <div className="flex items-center gap-2 flex-1">
                              <span>{m.full_name}</span>
                              <span className="text-xs text-muted-foreground ml-auto">CIM {m.cim}</span>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="space-y-1.5">
              <Label>Situação</Label>
              <Select value={form.situacao} onValueChange={(v) => setForm((f) => ({ ...f, situacao: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="em_aberto">Em Aberto (Débito)</SelectItem>
                  <SelectItem value="pago">Pago (Crédito)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input placeholder="Ex: Mensalidade referente a Fev/2026" value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} maxLength={120} />
          </div>

          <div className="flex gap-2 pt-2">
            <PermissionGate module="tesouraria" action="write">
              <Button onClick={handleSalvar} disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {saving ? "Salvando..." : "Salvar Lançamento"}
              </Button>
            </PermissionGate>
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
          <CardTitle className="text-base font-sans font-semibold">Lançamentos Recentes</CardTitle>
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
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTx.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum lançamento recente encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentTx.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.member_name}</TableCell>
                      <TableCell>{format(new Date(t.data), "dd/MM/yyyy")}</TableCell>
                      <TableCell><Badge variant="outline" className={cn("text-[10px]", tipoBadge[t.tipo])}>{tipoLabels[t.tipo] ?? t.tipo}</Badge></TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(Number(t.valor))}</TableCell>
                      <TableCell className="text-muted-foreground">{t.descricao || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px]", t.status === "pago" ? "text-success border-success/30" : "text-warning border-warning/30")}>
                          {t.status === "pago" ? "Pago" : "Em Aberto"}
                        </Badge>
                      </TableCell>
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
