import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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

const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

export function NovoCredito({ memberId, memberName, onCreditoSaved }: NovoCreditoProps) {
  const { session } = useAuth();
  const { logAction } = useAuditLog();
  const [valor, setValor] = useState("");
  const [data, setData] = useState(new Date());
  const [formaPagamento, setFormaPagamento] = useState("");
  const [referencia, setReferencia] = useState("");
  const [selectedDebitoIds, setSelectedDebitoIds] = useState<string[]>([]);
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
        .eq("status", "em_aberto")
        .order("data", { ascending: true });
      setDebitosAbertos(data ?? []);
      setLoadingDebitos(false);
    };
    fetchDebitos();
  }, [memberId]);

  const totalDebitosSelecionados = useMemo(
    () => debitosAbertos.filter((d) => selectedDebitoIds.includes(d.id)).reduce((sum, d) => sum + Number(d.valor), 0),
    [selectedDebitoIds, debitosAbertos]
  );

  // Auto-fill valor when debits are toggled
  useEffect(() => {
    if (selectedDebitoIds.length > 0) {
      setValor(totalDebitosSelecionados.toFixed(2).replace(".", ","));
    }
  }, [totalDebitosSelecionados, selectedDebitoIds.length]);

  const toggleDebito = (id: string) => {
    setSelectedDebitoIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllDebitos = () => {
    if (selectedDebitoIds.length === debitosAbertos.length) {
      setSelectedDebitoIds([]);
    } else {
      setSelectedDebitoIds(debitosAbertos.map((d) => d.id));
    }
  };

  const resetForm = () => {
    setValor("");
    setData(new Date());
    setFormaPagamento("");
    setReferencia("");
    setSelectedDebitoIds([]);
  };

  const valorNum = parseFloat(valor.replace(",", ".")) || 0;
  const excedente = selectedDebitoIds.length > 0 ? valorNum - totalDebitosSelecionados : 0;

  const handleSalvar = async () => {
    if (!formaPagamento) { toast.error("Selecione a forma de pagamento."); return; }
    if (valorNum <= 0 || isNaN(valorNum)) { toast.error("O valor deve ser maior que zero."); return; }

    setSaving(true);

    const descParts = [formasPagamento.find((f) => f.value === formaPagamento)?.label ?? formaPagamento];
    if (referencia.trim()) descParts.push(referencia.trim());
    if (selectedDebitoIds.length > 0) descParts.push(`Compensação de ${selectedDebitoIds.length} débito(s)`);
    const descricao = descParts.join(" — ");

    const { error } = await supabase.from("member_transactions").insert({
      member_id: memberId,
      tipo: "avulso",
      descricao,
      valor: valorNum,
      data: format(data, "yyyy-MM-dd"),
      status: "pago",
      created_by: session?.user?.id,
    });

    if (error) {
      setSaving(false);
      toast.error("Erro ao registrar crédito. Tente novamente.");
      return;
    }

    // Mark selected debits as paid
    if (selectedDebitoIds.length > 0) {
      await supabase
        .from("member_transactions")
        .update({ status: "pago" })
        .in("id", selectedDebitoIds);
    }

    logAction({
      action: "CREATE_CREDIT",
      targetTable: "member_transactions",
      targetId: memberId,
      details: {
        member: memberName,
        valor: valorNum,
        forma: formaPagamento,
        debitos_compensados: selectedDebitoIds.length > 0 ? selectedDebitoIds : null,
        excedente: excedente > 0 ? excedente : null,
      },
    });

    setSaving(false);
    const msg = excedente > 0
      ? `Crédito de R$ ${fmt(valorNum)} registrado. Saldo excedente de R$ ${fmt(excedente)} adicionado.`
      : `Crédito de R$ ${fmt(valorNum)} registrado para ${memberName}.`;
    toast.success(msg);
    resetForm();
    onCreditoSaved?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-sans font-semibold">Novo Crédito</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Multi-select débitos */}
        {debitosAbertos.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Compensar débitos em aberto</Label>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={selectAllDebitos}>
                {selectedDebitoIds.length === debitosAbertos.length ? "Desmarcar todos" : "Selecionar todos"}
              </Button>
            </div>
            <div className="rounded-md border divide-y max-h-48 overflow-y-auto">
              {loadingDebitos ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                </div>
              ) : (
                debitosAbertos.map((d) => (
                  <label
                    key={d.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={selectedDebitoIds.includes(d.id)}
                      onCheckedChange={() => toggleDebito(d.id)}
                    />
                    <div className="flex items-center gap-2 flex-1 min-w-0 text-sm">
                      <span className="text-muted-foreground shrink-0">{format(new Date(d.data), "dd/MM/yyyy")}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">{tipoLabels[d.tipo] ?? d.tipo}</Badge>
                      <span className="truncate text-muted-foreground">{d.descricao || "—"}</span>
                    </div>
                    <span className="text-sm font-medium text-destructive shrink-0">R$ {fmt(Number(d.valor))}</span>
                  </label>
                ))
              )}
            </div>
            {selectedDebitoIds.length > 0 && (
              <div className="flex items-center gap-4 text-sm pt-1">
                <span className="text-muted-foreground">
                  {selectedDebitoIds.length} débito(s) selecionado(s): <span className="font-semibold text-foreground">R$ {fmt(totalDebitosSelecionados)}</span>
                </span>
                {excedente > 0 && (
                  <Badge variant="outline" className="text-success border-success/30 text-[11px]">
                    Saldo excedente: R$ {fmt(excedente)}
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label>Valor recebido (R$) *</Label>
            <Input
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value.replace(/[^\d,]/g, ""))}
              maxLength={12}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Data do pagamento *</Label>
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
            <Label>Forma de pagamento *</Label>
            <Select value={formaPagamento} onValueChange={setFormaPagamento}>
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
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
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
