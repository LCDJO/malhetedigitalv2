import { usePortalMemberContext } from "@/components/portal/PortalLayout";
import { Award, Lock, CheckCircle2, Circle } from "lucide-react";
import { format } from "date-fns";

const fmtDate = (d: string | null) => (d ? format(new Date(d), "dd/MM/yyyy") : null);

interface JourneyStep {
  label: string;
  description: string;
  date: string | null;
  done: boolean;
}

export default function PortalJornada() {
  const member = usePortalMemberContext();

  const steps: JourneyStep[] = [
    {
      label: "Iniciação",
      description: "Grau de Aprendiz — a entrada no caminho da Luz.",
      date: member.initiation_date,
      done: !!member.initiation_date,
    },
    {
      label: "Elevação",
      description: "Grau de Companheiro — o aprofundamento do conhecimento.",
      date: member.elevation_date,
      done: !!member.elevation_date,
    },
    {
      label: "Exaltação",
      description: "Grau de Mestre — a plenitude da jornada simbólica.",
      date: member.exaltation_date,
      done: !!member.exaltation_date,
    },
  ];

  if (member.master_installed) {
    steps.push({
      label: "Mestre Instalado",
      description: "Venerável Mestre — reconhecimento pela presidência da Loja.",
      date: null,
      done: true,
    });
  }

  const completedCount = steps.filter((s) => s.done).length;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Minha Jornada</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhe sua trajetória maçônica
        </p>
      </div>

      {/* Progress overview */}
      <div className="portal-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(42_65%_50%/0.15)]">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">
                Progresso: {completedCount} de {steps.length} Graus
              </p>
              <p className="text-xs text-muted-foreground">Graus Concluídos</p>
            </div>
          </div>
        </div>

        <div className="w-full bg-muted rounded-full h-2.5">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Journey steps */}
      <div className="space-y-0">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          return (
            <div key={step.label} className="flex gap-4">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                    step.done
                      ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(42_65%_50%/0.3)]"
                      : "bg-muted border border-border text-muted-foreground"
                  }`}
                >
                  {step.done ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </div>
                {!isLast && (
                  <div className={`w-0.5 flex-1 min-h-[40px] ${step.done ? "bg-primary/40" : "bg-border"}`} />
                )}
              </div>

              {/* Content */}
              <div className={`portal-card rounded-xl p-5 mb-3 flex-1 ${step.done ? "border-primary/20" : "opacity-60"}`}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`text-sm font-semibold ${step.done ? "text-primary" : "text-muted-foreground"}`}>
                    {step.label}
                  </h3>
                  {step.date && (
                    <span className="text-[11px] text-muted-foreground">
                      {fmtDate(step.date)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{step.description}</p>
                {step.done && (
                  <div className="flex items-center gap-1 mt-2">
                    <Circle className="h-2 w-2 fill-primary text-primary" />
                    <span className="text-[10px] text-primary font-medium uppercase tracking-wide">Concluído</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground pt-2">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
          <span>Concluído</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Bloqueado</span>
        </div>
      </div>
    </div>
  );
}
