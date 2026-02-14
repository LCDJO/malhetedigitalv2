import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { roleLabels, type AppRole } from "@/contexts/AuthContext";
import { User, Mail, Phone, MapPin, Calendar, Shield, Clock } from "lucide-react";
import { format } from "date-fns";

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: AppRole | null;
  tenant_role: string;
  is_active: boolean;
  created_at: string;
  cpf?: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  avatar_url?: string | null;
}

interface Props {
  user: UserRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailDialog({ user, open, onOpenChange }: Props) {
  if (!user) return null;

  const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || "—"}</p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Detalhes do Usuário</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 divide-y divide-border">
          <div className="flex items-center gap-3 pb-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{user.full_name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={user.is_active ? "default" : "destructive"} className="text-[10px]">
                  {user.is_active ? "Ativo" : "Inativo"}
                </Badge>
                {user.role && (
                  <Badge variant="outline" className="text-[10px]">
                    {roleLabels[user.role] ?? user.role}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <InfoRow icon={Mail} label="Email" value={user.email} />
          <InfoRow icon={Shield} label="Cargo" value={user.role ? roleLabels[user.role] : "Sem cargo"} />
          <InfoRow icon={User} label="CPF" value={user.cpf} />
          <InfoRow icon={Phone} label="Telefone" value={user.phone} />
          <InfoRow icon={MapPin} label="Endereço" value={user.address} />
          <InfoRow icon={Calendar} label="Data de Nascimento" value={user.birth_date ? format(new Date(user.birth_date + "T12:00:00"), "dd/MM/yyyy") : undefined} />
          <InfoRow icon={Clock} label="Cadastrado em" value={format(new Date(user.created_at), "dd/MM/yyyy 'às' HH:mm")} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
