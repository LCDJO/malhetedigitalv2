import { useState } from "react";
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

interface NovoDebitoProps {
  memberId: string;
  memberName: string;
  onDebitoSaved?: () => void;
}

const emptyForm = { categoria: "", descricao: "", valor: "", data: new Date() };

export function NovoDebito({ memberId, memberName, onDebitoSaved }: NovoDebitoProps) {
  const { session } = useAuth();
  const { logAction } = useAuditLog();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const resetForm = () => setForm(emptyForm);

  const handleSalvar = async () => {
    if (!form.categoria) { toast.error("Selecione a categoria do débito."); return; }
    const v = parseFloat(form.valor.replace(",", ".")) || 0;
    if (v <= 0 || isNaN(v)) { toast.error("O valor deve ser maior que zero."); return; }

    setSaving(true);
    const { error } = await supabase.from("member_transactions").insert({
      member_id: memberId,
      tipo: form.categoria,
      descricao: form.descricao.trim() || undefined,
      valor: v,
      data: format(form.data, "yyyy-MM-dd"),
      status: "em_aberto",
      created_by: session?.user?.id,
    });
    setSaving(false);

    if (error) {
      toast.error("Erro ao registrar débito. Tente novamente.");
      return;
    }

    logAction({
      action: "CREATE_DEBIT",
      targetTable: "member_transactions",
      targetId: memberId,
      details: { member: memberName, tipo: form.categoria, valor: v },
    });

    toast.success(`Débito de R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} registrado para ${memberName}.`);
    resetForm();
    onDebitoSaved?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-sans font-semibold">Novo Débito</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label>Categoria *</Label>
            <Select value={form.categoria} onValueChange={(v) => setForm((f) => ({ ...f, categoria: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mensalidade">Mensalidade</SelectItem>
                <SelectItem value="taxa">Taxa</SelectItem>
                <SelectItem value="avulso">Valor Avulso</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
            <Label>Data de vencimento *</Label>
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
            <Label>Descrição</Label>
            <Input
              placeholder="Ex: Mensalidade Fev/2026"
              value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              maxLength={120}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <PermissionGate module="tesouraria" action="write">
            <Button onClick={handleSalvar} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Registrar Débito
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
