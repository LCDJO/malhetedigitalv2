import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type AppRole, roleLabels } from "@/contexts/AuthContext";

const availableRoles: AppRole[] = [
  "administrador",
];

interface UserFormData {
  full_name: string;
  email: string;
  password: string;
  role: AppRole;
  cpf: string;
  phone: string;
  address: string;
  birth_date: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData?: Partial<UserFormData>;
  saving: boolean;
  onSave: (data: UserFormData) => void;
}

export function UserFormDialog({ open, onOpenChange, mode, initialData, saving, onSave }: Props) {
  const [form, setForm] = useState<UserFormData>({
    full_name: "", email: "", password: "", role: "administrador",
    cpf: "", phone: "", address: "", birth_date: "",
  });

  useEffect(() => {
    if (open && initialData) {
      setForm({
        full_name: initialData.full_name ?? "",
        email: initialData.email ?? "",
        password: "",
        role: initialData.role ?? "administrador",
        cpf: initialData.cpf ?? "",
        phone: initialData.phone ?? "",
        address: initialData.address ?? "",
        birth_date: initialData.birth_date ?? "",
      });
    } else if (open) {
      setForm({ full_name: "", email: "", password: "", role: "administrador", cpf: "", phone: "", address: "", birth_date: "" });
    }
  }, [open, initialData]);

  const update = (field: keyof UserFormData, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = () => {
    if (!form.full_name.trim()) return;
    if (mode === "create" && (!form.email.trim() || !form.password.trim())) return;
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {mode === "create" ? "Novo Usuário" : "Editar Usuário"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Nome Completo *</Label>
              <Input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Ex: João da Silva" maxLength={100} />
            </div>
            {mode === "create" && (
              <>
                <div className="space-y-1.5">
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="usuario@email.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Senha *</Label>
                  <Input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Mínimo 6 caracteres" />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label>Perfil / Cargo *</Label>
              <Select value={form.role} onValueChange={(v) => update("role", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r) => (
                    <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>CPF</Label>
              <Input value={form.cpf} onChange={(e) => update("cpf", e.target.value)} placeholder="000.000.000-00" maxLength={14} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(00) 00000-0000" maxLength={15} />
            </div>
            <div className="space-y-1.5">
              <Label>Data de Nascimento</Label>
              <Input type="date" value={form.birth_date} onChange={(e) => update("birth_date", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Endereço</Label>
              <Input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Rua, nº, Bairro, Cidade - UF" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Salvando..." : mode === "create" ? "Criar Usuário" : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
