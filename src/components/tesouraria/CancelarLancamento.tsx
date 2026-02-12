import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ShieldAlert, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "@/hooks/useAuditLog";
import { toast } from "sonner";

interface CancelarLancamentoProps {
  transaction: {
    id: string;
    data: string;
    tipo: string;
    descricao: string;
    valor: number;
    status: string;
    member_id: string;
    conta_plano_id: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancelled: () => void;
}

const CONFIRM_KEYWORD = "CANCELAR";

export function CancelarLancamento({ transaction, open, onOpenChange, onCancelled }: CancelarLancamentoProps) {
  const [motivo, setMotivo] = useState("");
  const [typedConfirm, setTypedConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const { logAction } = useAuditLog();

  const canConfirm = motivo.trim().length >= 5 && typedConfirm.toUpperCase() === CONFIRM_KEYWORD;

  const handleCancel = async () => {
    if (!transaction || !canConfirm) return;
    setLoading(true);

    try {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // 2. Create reverse (inverse) transaction
      const isDebito = transaction.status === "em aberto";
      const { error: insertError } = await supabase
        .from("member_transactions")
        .insert({
          member_id: transaction.member_id,
          tipo: transaction.tipo,
          descricao: `[CANCELAMENTO] ${transaction.descricao} — Motivo: ${motivo.trim()}`,
          valor: transaction.valor,
          // Inverse: if original was debit (em aberto), reverse is credit (pago) and vice-versa
          status: isDebito ? "pago" : "em aberto",
          data: new Date().toISOString().slice(0, 10),
          conta_plano_id: transaction.conta_plano_id,
          created_by: user.id,
        });

      if (insertError) throw insertError;

      // 3. Mark original as cancelled (update description to flag it)
      const { error: updateError } = await supabase
        .from("member_transactions")
        .update({
          descricao: `[CANCELADO] ${transaction.descricao}`,
        })
        .eq("id", transaction.id);

      if (updateError) throw updateError;

      // 4. Audit log
      logAction({
        action: "cancelamento_lancamento",
        targetTable: "member_transactions",
        targetId: transaction.id,
        details: {
          motivo: motivo.trim(),
          valor_original: transaction.valor,
          tipo_original: transaction.tipo,
          status_original: transaction.status,
          descricao_original: transaction.descricao,
        },
      });

      toast.success("Lançamento cancelado com sucesso. Lançamento inverso gerado.");
      setMotivo("");
      setTypedConfirm("");
      onOpenChange(false);
      onCancelled();
    } catch (err: any) {
      toast.error(err.message || "Erro ao cancelar lançamento");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setMotivo("");
      setTypedConfirm("");
    }
    onOpenChange(v);
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            Cancelar Lançamento
          </DialogTitle>
          <DialogDescription>
            O lançamento não será excluído. Um lançamento inverso será gerado automaticamente para anular seu efeito financeiro.
          </DialogDescription>
        </DialogHeader>

        {transaction && (
          <div className="rounded-md border bg-muted/30 p-3 space-y-1 text-sm">
            <p><span className="text-muted-foreground">Descrição:</span> {transaction.descricao || "—"}</p>
            <p><span className="text-muted-foreground">Valor:</span> <span className="font-semibold">{fmt(transaction.valor)}</span></p>
            <p><span className="text-muted-foreground">Tipo:</span> {transaction.status === "em aberto" ? "Despesa" : "Receita"}</p>
          </div>
        )}

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Motivo do cancelamento *</Label>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo (mínimo 5 caracteres)..."
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Digite <span className="font-semibold text-foreground">{CONFIRM_KEYWORD}</span> para confirmar
            </Label>
            <Input
              value={typedConfirm}
              onChange={(e) => setTypedConfirm(e.target.value)}
              placeholder={CONFIRM_KEYWORD}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            Voltar
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={!canConfirm || loading}
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Processando...</> : "Confirmar Cancelamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
