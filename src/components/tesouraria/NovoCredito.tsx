import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Plus, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { PermissionGate } from "@/components/PermissionGate";

interface DebitoAberto {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: string;
}

interface NovoCreditoProps {
  memberId: string;
  memberName: string;
  onCreditoSaved?: () => void;
}

const formasPagamento = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "transferencia", label: "Transferência Bancária" },
  { value: "boleto", label: "Boleto" },
  { value: "cartao", label: "Cartão" },
  { value: "outro", label: "Outro" },
];

const tipoLabels: Record<string, string> = { mensalidade: "Mensalidade", avulso: "Valor Avulso", taxa: "Taxa" };

const emptyForm = { valor: "", data: new Date(), formaPagamento: "", referencia: "", debitoId: "" };

export function NovoCredito({ memberId, memberName, onCreditoSaved }: NovoCreditoProps) {
  const { session } = useAuth();
  const { logAction } = useAuditLog();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [debitosAbertos, setDebitosAbertos] = useState<DebitoAberto[]>([]);
  const [loadingDebitos, setLoadingDebitos] = useState(false);

  useEffect(() => {
    const fetchDebitos = async () => {
      setLoadingDebitos(true);
      const { data } = await supabase
        .from("member_transactions")
        .select("id, data, descricao, valor, tipo")
        .eq("member_id", memberId)
        .eq("status", "em aberto")
        .order("data", { ascending: true });
      setDebitosAbertos(data ?? []);
      setLoadingDebitos(false);
    };
    fetchDebitos();
  }, [memberId]);

  // Auto-fill valor when selecting a linked debit
  useEffect(() => {
    if (form.debitoId) {
      const debito = debitosAbertos.find((d) => d.id === form.debitoId);
      if (debito) {
        setForm((f) => ({
          ...f,
          valor: debito.valor.toFixed(2).replace(".", ","),
          referencia: f.referencia || `Pgto. ${tipoLabels[debito.tipo] ?? debito.tipo} — ${format(new Date(debito.data), "dd/MM/yyyy")}`,
        }));
      }
    }
  }, [form.debitoId, debitosAbertos]);

  const resetForm = () => setForm(emptyForm);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  const handleSalvar = async () => {
    if (!form.formaPagamento) { toast.error("Selecione a forma de pagamento."); return; }
    const v = parseFloat(form.valor.replace(",", ".")) || 0;
    if (v <= 0 || isNaN(v)) { toast.error("O valor deve ser maior que zero."); return; }

    setSaving(true);

    // Insert credit transaction
    const descParts = [formasPagamento.find((f) => f.value === form.formaPagamento)?.label ?? form.formaPagamento];
    if (form.referencia.trim()) descParts.push(form.referencia.trim());
    const descricao = descParts.join(" — ");

    const { error } = await supabase.from("member_transactions").insert({
      member_id: memberId,
      tipo: "avulso",
      descricao,
      valor: v,
      data: format(form.data, "yyyy-MM-dd"),
      status: "pago",
      created_by: session?.user?.id,
    });

    if (error) {
      setSaving(false);
      toast.error("Erro ao registrar crédito. Tente novamente.");
      return;
    }

    // If linked to a debit, mark it as paid
    if (form.debitoId) {
      await supabase
        .from("member_transactions")
        .update({ status: "pago" })
        .eq("id", form.debitoId);
    }

    logAction({
      action: "CREATE_CREDIT",
      targetTable: "member_transactions",
      targetId: memberId,
      details: { member: memberName, valor: v, forma: form.formaPagamento, debito_vinculado: form.debitoId || null },
    });

    setSaving(false);
    toast.success(`Crédito de R$ ${fmt(v)} registrado para ${memberName}.`);
    resetForm();
    onCreditoSaved?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-sans font-semibold">Novo Crédito</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vincular a débito */}
        {debitosAbertos.length > 0 && (
          <div className="space-y-1.5 max-w-md">
            <Label>Vincular a débito em aberto</Label>
            <Select value={form.debitoId} onValueChange={(v) => setForm((f) => ({ ...f, debitoId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder={loadingDebitos ? "Carregando..." : "Nenhum (crédito avulso)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum (crédito avulso)</SelectItem>
                {debitosAbertos.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {format(new Date(d.data), "dd/MM/yyyy")} — {tipoLabels[d.tipo] ?? d.tipo} — R$ {fmt(d.valor)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label>Valor recebido (R$) *</Label>
            <Input
              placeholder="0,00"
              value={form.valor}
              onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value.replace(/[^\d,]/g, "") }))}
              maxLength={12}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Data do pagamento *</Label>
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
            <Label>Forma de pagamento *</Label>
            <Select value={form.formaPagamento} onValueChange={(v) => setForm((f) => ({ ...f, formaPagamento: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {formasPagamento.map((fp) => (
                  <SelectItem key={fp.value} value={fp.value}>{fp.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Referência</Label>
            <Input
              placeholder="Ex: Recibo #123"
              value={form.referencia}
              onChange={(e) => setForm((f) => ({ ...f, referencia: e.target.value }))}
              maxLength={120}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <PermissionGate module="tesouraria" action="write">
            <Button onClick={handleSalvar} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Registrar Crédito
            </Button>
          </PermissionGate>
          <Button variant="outline" onClick={resetForm} className="gap-1.5">
            <RotateCcw className="h-4 w-4" />
            Limpar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
