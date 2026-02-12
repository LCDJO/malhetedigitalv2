import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { cn } from "@/lib/utils";

interface ContaPlano {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
}

interface NovoLancamentoProps {
  memberId: string;
  memberName: string;
  onLancamentoSaved?: () => void;
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
  tipo: "" as "" | "receita" | "despesa",
  contaPlanoId: "",
  descricao: "",
  valor: "",
  data: new Date(),
  formaPagamento: "",
};

export function NovoLancamento({ memberId, memberName, onLancamentoSaved }: NovoLancamentoProps) {
  const { session } = useAuth();
  const { logAction } = useAuditLog();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [contas, setContas] = useState<ContaPlano[]>([]);
  const [loadingContas, setLoadingContas] = useState(false);

  const fetchContas = useCallback(async () => {
    setLoadingContas(true);
    const { data } = await supabase
      .from("plano_contas")
      .select("id, codigo, nome, tipo")
      .eq("status", "ativo")
      .order("codigo", { ascending: true });
    setContas(data ?? []);
    setLoadingContas(false);
  }, []);

  useEffect(() => {
    if (open) fetchContas();
  }, [open, fetchContas]);

  // Filter contas by selected tipo
  const contasFiltradas = form.tipo
    ? contas.filter((c) => c.tipo === form.tipo)
    : contas;

  const resetForm = () => setForm(emptyForm);

  const handleOpen = () => {
    resetForm();
    setOpen(true);
  };

  const handleSalvar = async () => {
    if (!form.tipo) { toast.error("Selecione o tipo (Receita ou Despesa)."); return; }
    if (!form.contaPlanoId) { toast.error("Selecione a conta do Plano de Contas."); return; }
    if (!form.descricao.trim()) { toast.error("Informe a descrição do lançamento."); return; }
    const v = parseFloat(form.valor.replace(",", ".")) || 0;
    if (v <= 0 || isNaN(v)) { toast.error("O valor deve ser maior que zero."); return; }

    const contaSelecionada = contas.find((c) => c.id === form.contaPlanoId);

    setSaving(true);
    const { error } = await supabase.from("member_transactions").insert({
      member_id: memberId,
      tipo: contaSelecionada?.nome.toLowerCase() ?? form.tipo,
      descricao: form.descricao.trim(),
      valor: v,
      data: format(form.data, "yyyy-MM-dd"),
      status: form.tipo === "receita" ? "pago" : "em aberto",
      created_by: session?.user?.id,
      conta_plano_id: form.contaPlanoId,
      forma_pagamento: form.formaPagamento || null,
    });
    setSaving(false);

    if (error) {
      toast.error("Erro ao registrar lançamento. Tente novamente.");
      console.error(error);
      return;
    }

    logAction({
      action: form.tipo === "receita" ? "CREATE_RECEITA" : "CREATE_DESPESA",
      targetTable: "member_transactions",
      targetId: memberId,
      details: {
        member: memberName,
        tipo: form.tipo,
        conta: contaSelecionada ? `${contaSelecionada.codigo} — ${contaSelecionada.nome}` : "",
        valor: v,
        forma_pagamento: form.formaPagamento || undefined,
      },
    });

    toast.success(
      `${form.tipo === "receita" ? "Receita" : "Despesa"} de R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} registrada para ${memberName}.`
    );
    setOpen(false);
    resetForm();
    onLancamentoSaved?.();
  };

  return (
    <>
      <Button onClick={handleOpen} className="gap-1.5">
        <Plus className="h-4 w-4" />
        Novo Lançamento
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Lançamento — {memberName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Tipo */}
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, tipo: v as "receita" | "despesa", contaPlanoId: "" }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Receita ou Despesa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita (soma ao caixa)</SelectItem>
                  <SelectItem value="despesa">Despesa (subtrai do caixa)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conta do Plano de Contas */}
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
                  disabled={!form.tipo}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={form.tipo ? "Selecione a conta" : "Selecione o tipo primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {contasFiltradas.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        Nenhuma conta de {form.tipo} cadastrada.
                      </div>
                    ) : (
                      contasFiltradas.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.codigo} — {c.nome}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <Label>Descrição *</Label>
              <Input
                placeholder="Ex: Mensalidade Fev/2026"
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                maxLength={120}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Valor */}
              <div className="space-y-1.5">
                <Label>Valor (R$) *</Label>
                <Input
                  placeholder="0,00"
                  value={form.valor}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, valor: e.target.value.replace(/[^\d,]/g, "") }))
                  }
                  maxLength={12}
                />
              </div>

              {/* Data */}
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

            {/* Forma de pagamento (opcional) */}
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
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Registrar Lançamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
