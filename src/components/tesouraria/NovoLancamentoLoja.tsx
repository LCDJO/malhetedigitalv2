import { useState, useEffect, useCallback } from "react";
import { createTransaction, listPlanoContas } from "@/services/transactions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Plus, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { PermissionGate } from "@/components/PermissionGate";

const LOJA_MEMBER_ID = "763aabff-dbca-4cb0-a0fa-4730b3f4de8e";

interface ContaPlano {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
}

const formasPagamento = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "transferencia", label: "Transferência" },
  { value: "boleto", label: "Boleto" },
  { value: "cartao", label: "Cartão" },
  { value: "cheque", label: "Cheque" },
];

const emptyForm = {
  contaPlanoId: "",
  descricao: "",
  valor: "",
  data: new Date(),
  formaPagamento: "",
};

interface NovoLancamentoLojaProps {
  tipo: "receita" | "despesa";
  onSaved?: () => void;
}

export function NovoLancamentoLoja({ tipo, onSaved }: NovoLancamentoLojaProps) {
  const { session } = useAuth();
  const { logAction } = useAuditLog();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [contas, setContas] = useState<ContaPlano[]>([]);
  const [loadingContas, setLoadingContas] = useState(false);

  const isReceita = tipo === "receita";

  const fetchContas = useCallback(async () => {
    setLoadingContas(true);
    try {
      const data = await listPlanoContas(tipo);
      setContas(data ?? []);
    } catch { /* silent */ }
    setLoadingContas(false);
  }, [tipo]);

  useEffect(() => {
    if (open) fetchContas();
  }, [open, fetchContas]);

  const resetForm = () => setForm(emptyForm);

  const handleOpen = () => {
    resetForm();
    setOpen(true);
  };

  const handleSalvar = async () => {
    if (!form.contaPlanoId) { toast.error("Selecione a conta do Plano de Contas."); return; }
    if (!form.descricao.trim()) { toast.error("Informe a descrição do lançamento."); return; }
    const v = parseFloat(form.valor.replace(",", ".")) || 0;
    if (v <= 0 || isNaN(v)) { toast.error("O valor deve ser maior que zero."); return; }

    const contaSelecionada = contas.find((c) => c.id === form.contaPlanoId);

    setSaving(true);
    try {
      await createTransaction({
        member_id: LOJA_MEMBER_ID,
        tipo: isReceita ? "receita" : "despesa",
        descricao: form.descricao.trim(),
        valor: v,
        data: format(form.data, "yyyy-MM-dd"),
        status: isReceita ? "pago" : "em_aberto",
        created_by: session?.user?.id,
        conta_plano_id: form.contaPlanoId,
        forma_pagamento: form.formaPagamento || null,
      });
    } catch (e: any) {
      setSaving(false);
      toast.error(e?.message || "Erro ao registrar lançamento. Tente novamente.");
      return;
    }
    setSaving(false);

    logAction({
      action: isReceita ? "CREATE_RECEITA_LOJA" : "CREATE_DESPESA_LOJA",
      targetTable: "member_transactions",
      targetId: LOJA_MEMBER_ID,
      details: {
        tipo,
        conta: contaSelecionada ? `${contaSelecionada.codigo} — ${contaSelecionada.nome}` : "",
        valor: v,
        forma_pagamento: form.formaPagamento || undefined,
      },
    });

    toast.success(
      `${isReceita ? "Receita" : "Despesa"} de R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} registrada para a Loja.`
    );
    setOpen(false);
    resetForm();
    onSaved?.();
  };

  return (
    <>
      <PermissionGate module="tesouraria" action="write">
        <Button onClick={handleOpen} variant={isReceita ? "default" : "outline"} className="gap-1.5">
          {isReceita ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {isReceita ? "Nova Receita" : "Nova Despesa"}
        </Button>
      </PermissionGate>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isReceita ? "Nova Receita da Loja" : "Nova Despesa da Loja"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Conta do Plano de Contas *</Label>
              {loadingContas ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando contas...
                </div>
              ) : (
                <Select
                  value={form.contaPlanoId}
                  onValueChange={(v) => setForm((f) => ({ ...f, contaPlanoId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {contas.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        Nenhuma conta de {tipo} cadastrada.
                      </div>
                    ) : (
                      contas.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.codigo} — {c.nome}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Descrição *</Label>
              <Input
                placeholder={isReceita ? "Ex: Aluguel de salão" : "Ex: Conta de energia elétrica"}
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                maxLength={120}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Valor (R$) *</Label>
                <Input
                  placeholder="0,00"
                  value={form.valor}
                  onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value.replace(/[^\d,]/g, "") }))}
                  maxLength={12}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Data *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(form.data, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.data}
                      onSelect={(d) => d && setForm((f) => ({ ...f, data: d }))}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Forma de pagamento</Label>
              <Select
                value={form.formaPagamento}
                onValueChange={(v) => setForm((f) => ({ ...f, formaPagamento: v === "none" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {formasPagamento.map((fp) => (
                    <SelectItem key={fp.value} value={fp.value}>
                      {fp.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSalvar} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Registrar {isReceita ? "Receita" : "Despesa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
