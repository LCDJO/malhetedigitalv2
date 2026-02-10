import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, Calendar, AlertCircle, CheckCircle2, Clock } from "lucide-react";

const recentActivity = [
  { id: 1, action: "Pagamento de mensalidade recebido", member: "Ir∴ João Silva", time: "Há 2 horas", type: "financial" as const },
  { id: 2, action: "Novo membro cadastrado", member: "Ir∴ Carlos Mendes", time: "Há 5 horas", type: "member" as const },
  { id: 3, action: "Sessão ordinária agendada", member: "1º Vigilante", time: "Há 1 dia", type: "session" as const },
  { id: 4, action: "Mensalidade em atraso", member: "Ir∴ Pedro Alves", time: "Há 2 dias", type: "alert" as const },
  { id: 5, action: "Ata da sessão aprovada", member: "Secretário", time: "Há 3 dias", type: "document" as const },
];

const upcomingSessions = [
  { id: 1, title: "Sessão Ordinária", date: "15 Fev 2026", time: "19:30", status: "confirmed" as const },
  { id: 2, title: "Sessão Magna", date: "22 Fev 2026", time: "19:00", status: "pending" as const },
  { id: 3, title: "Sessão de Instrução", date: "01 Mar 2026", time: "19:30", status: "confirmed" as const },
];

const activityTypeStyles = {
  financial: "bg-success/10 text-success",
  member: "bg-primary/10 text-primary",
  session: "bg-accent/20 text-accent-foreground",
  alert: "bg-destructive/10 text-destructive",
  document: "bg-muted text-muted-foreground",
};

const activityIcons = {
  financial: DollarSign,
  member: Users,
  session: Calendar,
  alert: AlertCircle,
  document: CheckCircle2,
};

const statusStyles = {
  confirmed: { label: "Confirmada", className: "bg-success/10 text-success border-success/20" },
  pending: { label: "Pendente", className: "bg-warning/10 text-warning border-warning/20" },
};

const Index = () => {
  return (
    <DashboardLayout title="Painel" subtitle="Visão geral da Loja">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Membros Ativos"
            value="47"
            description="3 novos este mês"
            icon={Users}
            trend={{ value: "6.8%", positive: true }}
            className="[animation-delay:0ms]"
          />
          <StatCard
            title="Receita Mensal"
            value="R$ 12.580"
            description="Fev 2026"
            icon={DollarSign}
            trend={{ value: "12%", positive: true }}
            className="[animation-delay:100ms]"
          />
          <StatCard
            title="Próxima Sessão"
            value="15 Fev"
            description="Sessão Ordinária — 19:30"
            icon={Calendar}
            className="[animation-delay:200ms]"
          />
          <StatCard
            title="Inadimplentes"
            value="5"
            description="Mensalidades em atraso"
            icon={AlertCircle}
            trend={{ value: "2 a mais", positive: false }}
            className="[animation-delay:300ms]"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Card className="lg:col-span-2 animate-fade-in [animation-delay:400ms]">
            <CardHeader>
              <CardTitle className="text-base font-sans font-semibold">Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {recentActivity.map((item) => {
                const Icon = activityIcons[item.type];
                return (
                  <div key={item.id} className="flex items-center gap-3 py-3 border-b last:border-0">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${activityTypeStyles[item.type]}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.action}</p>
                      <p className="text-xs text-muted-foreground">{item.member}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{item.time}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Upcoming Sessions */}
          <Card className="animate-fade-in [animation-delay:500ms]">
            <CardHeader>
              <CardTitle className="text-base font-sans font-semibold">Próximas Sessões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="flex flex-col gap-2 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{session.title}</span>
                    <Badge variant="outline" className={statusStyles[session.status].className}>
                      {statusStyles[session.status].label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{session.date}</span>
                    <Clock className="h-3 w-3 ml-2" />
                    <span>{session.time}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
