import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Mail, Phone, MapPin, Calendar, Award } from "lucide-react";
import { format } from "date-fns";

interface MemberData {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  cim: string | null;
  address: string | null;
  birth_date: string | null;
  degree: string;
  status: string;
  initiation_date: string | null;
  elevation_date: string | null;
  exaltation_date: string | null;
  master_installed: boolean;
}

const degreeLabels: Record<string, string> = {
  aprendiz: "Aprendiz",
  companheiro: "Companheiro",
  mestre: "Mestre",
};

const statusLabels: Record<string, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  licenciado: "Licenciado",
  suspenso: "Suspenso",
};

const fmtDate = (d: string | null) => (d ? format(new Date(d), "dd/MM/yyyy") : "—");

export default function PortalCadastro() {
  const { user } = useAuth();
  const [member, setMember] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!user?.email) return;
      const { data } = await supabase
        .from("members")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();
      setMember(data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-20 space-y-2">
        <User className="h-10 w-10 mx-auto text-muted-foreground" />
        <h2 className="text-lg font-serif font-bold">Cadastro não encontrado</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Não foi possível localizar seu cadastro de membro. Verifique com o Secretário se seu e-mail está registrado corretamente.
        </p>
      </div>
    );
  }

  const infoItems = [
    { icon: Mail, label: "E-mail", value: member.email ?? "—" },
    { icon: Phone, label: "Telefone", value: member.phone ?? "—" },
    { icon: MapPin, label: "Endereço", value: member.address ?? "—" },
    { icon: Calendar, label: "Data de Nascimento", value: fmtDate(member.birth_date) },
    { icon: Award, label: "CIM", value: member.cim ?? "—" },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-serif font-bold">Meu Cadastro</h1>
        <p className="text-sm text-muted-foreground mt-1">Visualize seus dados registrados na Loja</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-sans">{member.full_name}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{degreeLabels[member.degree] ?? member.degree}</Badge>
              <Badge className={member.status === "ativo" ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>
                {statusLabels[member.status] ?? member.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {infoItems.map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted shrink-0">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <dt className="text-[11px] text-muted-foreground uppercase tracking-wide">{item.label}</dt>
                  <dd className="text-sm font-medium">{item.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* Timeline maçônica */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-sans">Trajetória Maçônica</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: "Iniciação", date: member.initiation_date },
              { label: "Elevação", date: member.elevation_date },
              { label: "Exaltação", date: member.exaltation_date },
            ].map((step) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${step.date ? "bg-primary" : "bg-border"}`} />
                <span className="text-sm font-medium w-24">{step.label}</span>
                <span className="text-sm text-muted-foreground">{fmtDate(step.date)}</span>
              </div>
            ))}
            {member.master_installed && (
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full shrink-0 bg-accent" />
                <span className="text-sm font-medium w-24">Mestre Instalado</span>
                <Badge variant="outline" className="text-accent border-accent/30 text-[11px]">Sim</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
