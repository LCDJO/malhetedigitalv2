import { useState, useEffect, useCallback } from "react";
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
import { CalendarIcon, Check, ChevronsUpDown, Plus, RotateCcw, Trash2, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmSensitiveAction } from "@/components/ConfirmSensitiveAction";
import { PermissionGate } from "@/components/PermissionGate";
import { useAuditLog } from "@/hooks/useAuditLog";
import { formatCurrency } from "@/components/dashboard/DashboardData";

interface MemberOption {
  id: string;
  full_name: string;
  cim: string;
  degree: string;
}

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
  const { hasPermission } = useAuth();
  const { logAction } = useAuditLog();
  const { config: lodgeConfig } = useLodgeConfig();
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [historico, setHistorico] = useState<Lancamento[]>([]);
  const [form, setForm] = useState(emptyForm);

  // Auto-fill valor when tipo changes to mensalidade
  useEffect(() => {
    if (form.tipo === "mensalidade" && !form.valor && lodgeConfig.mensalidade_padrao > 0) {
      setForm((f) => ({ ...f, valor: lodgeConfig.mensalidade_padrao.toFixed(2).replace(".", ",") }));
    }
  }, [form.tipo, lodgeConfig.mensalidade_padrao]);
  const [comboOpen, setComboOpen] = useState(false);

  // Sensitive action state
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<Lancamento | null>(null);

  const canWrite = hasPermission("tesouraria", "write");
  const canApprove = hasPermission("tesouraria", "approve");

  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    const { data } = await supabase
      .from("members")
      .select("id, full_name, cim, degree")
      .eq("status", "ativo")
      .order("full_name");
    if (data) setMembers(data);
    setLoadingMembers(false);
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const selectedIrmao = members.find((m) => m.id === form.irmaoId);

  const resetForm = () => setForm(emptyForm);

  const handleSalvar = () => {
    if (!form.irmaoId) { toast.error("É obrigatório selecionar um irmão para o lançamento."); return; }
    if (!form.tipo) { toast.error("Selecione o tipo de lançamento (mensalidade, avulso ou taxa)."); return; }
    const v = parseFloat(form.valor.replace(",", ".")) || 0;
    if (v <= 0 || isNaN(v)) { toast.error("O valor deve ser maior que zero."); return; }

    const irmao = members.find((m) => m.id === form.irmaoId);
    if (!irmao) { toast.error("Irmão não encontrado."); return; }

    const novo: Lancamento = {
      id: Date.now(),
      irmao: irmao.full_name,
      data: form.data,
      tipo: form.tipo,
      valor: v,
      descricao: form.descricao.trim() || tipoLabels[form.tipo],
    };
    setHistorico((prev) => [novo, ...prev]);
    resetForm();
    toast.success(`Lançamento de ${formatCurrency(v)} registrado para ${irmao.full_name}.`);
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
            <PermissionGate module="tesouraria" action="write">
              <Button onClick={handleSalvar} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Salvar Lançamento
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
                  {canWrite && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canWrite ? 6 : 5} className="text-center text-muted-foreground py-8">
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
                      {canWrite && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Editar valor"
                              onClick={() => {
                                if (!canApprove) {
                                  toast.error("Alteração de valores requer perfil com permissão de aprovação.");
                                  return;
                                }
                                setEditTarget(l);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              title="Excluir lançamento"
                              onClick={() => setDeleteTarget(l.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Confirmação de exclusão */}
      <ConfirmSensitiveAction
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Excluir Lançamento"
        description="Esta ação é irreversível. O lançamento será permanentemente removido do sistema. Deseja continuar?"
        confirmLabel="Excluir Lançamento"
        requireTypedConfirmation="EXCLUIR"
        destructive
        onConfirm={() => {
          if (deleteTarget !== null) {
            const entry = historico.find((l) => l.id === deleteTarget);
            setHistorico((prev) => prev.filter((l) => l.id !== deleteTarget));
            toast.success("Lançamento excluído com sucesso.");
            logAction({ action: "DELETE_ENTRY", targetTable: "lancamentos", targetId: deleteTarget.toString(), details: { irmao: entry?.irmao, valor: entry?.valor } });
            setDeleteTarget(null);
          }
        }}
      />

      {/* Confirmação de edição de valor */}
      <ConfirmSensitiveAction
        open={editTarget !== null}
        onOpenChange={(open) => { if (!open) setEditTarget(null); }}
        title="Alterar Valor Financeiro"
        description={`Você está prestes a editar o lançamento de ${editTarget ? formatCurrency(editTarget.valor) : ""} para ${editTarget?.irmao}. Alterações em valores financeiros são auditadas. Deseja continuar?`}
        confirmLabel="Confirmar Alteração"
        requireTypedConfirmation="ALTERAR"
        onConfirm={() => {
          toast.success("Edição autorizada. Implemente o formulário de edição conforme necessário.");
          setEditTarget(null);
        }}
      />
    </div>
  );
}
