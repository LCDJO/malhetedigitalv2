import { useEffect, useState } from "react";
import { getLodgeInfo } from "@/services/portal";
import { usePortalMemberContext } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  Calendar,
  Shield,
  Globe,
} from "lucide-react";

interface LodgeInfo {
  lodge_name: string;
  lodge_number: string;
  orient: string;
  potencia: string;
  logotipo_url: string | null;
  endereco: string | null;
  telefone: string | null;
  email_institucional: string | null;
}

const WEEKDAY_LABELS: Record<string, string> = {
  segunda: "Segunda-feira",
  terca: "Terça-feira",
  quarta: "Quarta-feira",
  quinta: "Quinta-feira",
  sexta: "Sexta-feira",
  sabado: "Sábado",
};

export default function PortalMinhaLoja() {
  const member = usePortalMemberContext();
  const [lodge, setLodge] = useState<LodgeInfo | null>(null);
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getLodgeInfo();
        if (data.lodge) setLodge(data.lodge as LodgeInfo);
        setActiveCount(data.active_count);
      } catch {
        // silently fail
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!lodge) {
    return (
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-2xl font-serif font-bold">Minha Loja</h1>
        <p className="text-muted-foreground">Informações da Loja não disponíveis.</p>
      </div>
    );
  }

  const infoItems = [
    { icon: Globe, label: "Oriente", value: lodge.orient || "—" },
    { icon: Shield, label: "Potência", value: lodge.potencia || "—" },
    { icon: MapPin, label: "Endereço", value: lodge.endereco || "—" },
    { icon: Phone, label: "Telefone", value: lodge.telefone || "—" },
    { icon: Mail, label: "E-mail", value: lodge.email_institucional || "—" },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-serif font-bold">Minha Loja</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Informações sobre a sua Loja Maçônica
        </p>
      </div>

      {/* Lodge identity card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 rounded-lg">
              {lodge.logotipo_url ? (
                <AvatarImage src={lodge.logotipo_url} alt={lodge.lodge_name} className="object-contain" />
              ) : null}
              <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-lg">
                <Building2 className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg font-serif">
                {lodge.lodge_name} nº {lodge.lodge_number}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{lodge.orient}</p>
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
                  <dt className="text-[11px] text-muted-foreground uppercase tracking-wide">
                    {item.label}
                  </dt>
                  <dd className="text-sm font-medium">{item.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount ?? "—"}</p>
                <p className="text-xs text-muted-foreground">Membros Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Calendar className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium">Sessões Ordinárias</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Consulte o calendário com o Secretário
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-sans flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendário de Sessões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <Calendar className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              O calendário de sessões será disponibilizado pelo Secretário da Loja.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Em breve você poderá consultar datas e horários das sessões diretamente aqui.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
