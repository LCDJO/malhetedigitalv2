import { usePortalMemberContext } from "@/components/portal/PortalLayout";
import { Award, Lock, CheckCircle2, Circle, Star } from "lucide-react";
import { format } from "date-fns";
import degreeSheet from "@/assets/degree-icons-sheet.png";

const fmtDate = (d: string | null) => (d ? format(new Date(d), "dd/MM/yyyy") : null);

interface JourneyStep {
  label: string;
  description: string;
  date: string | null;
  done: boolean;
}

// Sprite sheet: 5 columns, 7 rows (last row only 3 icons)
// Icon order left-to-right, top-to-bottom = degrees 1–33
const COLS = 5;
const ROWS = 7;

function DegreeIcon({ index, size = 48, className = "" }: { index: number; size?: number; className?: string }) {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const xPct = COLS > 1 ? (col / (COLS - 1)) * 100 : 0;
  const yPct = ROWS > 1 ? (row / (ROWS - 1)) * 100 : 0;

  return (
    <div
      className={`shrink-0 rounded-lg overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${degreeSheet})`,
        backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
        backgroundPosition: `${xPct}% ${yPct}%`,
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}

const allDegrees: { number: number; label: string }[] = [
  { number: 1, label: "Aprendiz" },
  { number: 2, label: "Companheiro" },
  { number: 3, label: "Mestre" },
  { number: 4, label: "Mestre Secreto" },
  { number: 5, label: "Mestre Perfeito" },
  { number: 6, label: "Secretário Íntimo" },
  { number: 7, label: "Preboste e Juiz" },
  { number: 8, label: "Intendente dos Edifícios" },
  { number: 9, label: "Mestre Eleito dos Nove" },
  { number: 10, label: "Ilustre Eleito dos Quinze" },
  { number: 11, label: "Sublime Cavaleiro Eleito" },
  { number: 12, label: "Grão Mestre Arquiteto" },
  { number: 13, label: "Real Arco" },
  { number: 14, label: "Grande Eleito" },
  { number: 15, label: "Cavaleiro do Oriente" },
  { number: 16, label: "Príncipe de Jerusalém" },
  { number: 17, label: "Cavaleiro do Oriente e Ocidente" },
  { number: 18, label: "Cavaleiro Rosa-Cruz" },
  { number: 19, label: "Grande Pontífice" },
  { number: 20, label: "Mestre Ad Vitam" },
  { number: 21, label: "Cavaleiro Prussiano" },
  { number: 22, label: "Cavaleiro Real Machado" },
  { number: 23, label: "Chefe do Tabernáculo" },
  { number: 24, label: "Príncipe do Tabernáculo" },
  { number: 25, label: "Cavaleiro da Serpente de Bronze" },
  { number: 26, label: "Príncipe da Mercê" },
  { number: 27, label: "Comendador do Templo" },
  { number: 28, label: "Cavaleiro do Sol" },
  { number: 29, label: "Grande Escocês de Santo André" },
  { number: 30, label: "Cavaleiro Kadosh" },
  { number: 31, label: "Grande Inspetor Inquisidor" },
  { number: 32, label: "Sublime Príncipe do Real Segredo" },
  { number: 33, label: "Soberano Grande Inspetor Geral" },
];

const symbolicDegrees = allDegrees.slice(0, 3);
const philosophicalDegrees = allDegrees.slice(3);

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

  const symbolicCompleted = steps.filter((s) => s.done).length;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Minha Jornada</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhe sua trajetória maçônica — Graus Simbólicos e Filosóficos
        </p>
      </div>

      {/* ── LOJA SIMBÓLICA ── */}
      <div className="portal-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(42_65%_50%/0.15)]">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">Loja Simbólica</p>
              <p className="text-xs text-muted-foreground">
                Progresso: {symbolicCompleted} de {steps.length} Graus
              </p>
            </div>
          </div>
        </div>

        <div className="w-full bg-muted rounded-full h-2.5 mb-5">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${(symbolicCompleted / steps.length) * 100}%` }}
          />
        </div>

        <div className="space-y-0">
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1;
            // Map step index to degree icon index (0,1,2 for symbolic; master_installed doesn't have a specific icon)
            const iconIndex = i < 3 ? i : undefined;
            return (
              <div key={step.label} className="flex gap-4">
                <div className="flex flex-col items-center">
                  {iconIndex !== undefined ? (
                    <DegreeIcon
                      index={iconIndex}
                      size={44}
                      className={`${!step.done ? "opacity-40 grayscale" : "shadow-[0_0_12px_hsl(42_65%_50%/0.3)]"}`}
                    />
                  ) : (
                    <div
                      className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 ${
                        step.done
                          ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(42_65%_50%/0.3)]"
                          : "bg-muted border border-border text-muted-foreground"
                      }`}
                    >
                      {step.done ? <CheckCircle2 className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                    </div>
                  )}
                  {!isLast && (
                    <div className={`w-0.5 flex-1 min-h-[40px] ${step.done ? "bg-primary/40" : "bg-border"}`} />
                  )}
                </div>
                <div className={`portal-card rounded-xl p-5 mb-3 flex-1 ${step.done ? "border-primary/20" : "opacity-60"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-sm font-semibold ${step.done ? "text-primary" : "text-muted-foreground"}`}>
                      {step.label}
                    </h3>
                    {step.date && (
                      <span className="text-[11px] text-muted-foreground">{fmtDate(step.date)}</span>
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
      </div>

      {/* ── LOJA FILOSÓFICA ── */}
      <div className="portal-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(42_65%_50%/0.15)]">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">Loja Filosófica</p>
              <p className="text-xs text-muted-foreground">
                Graus 4º a 33º — Rito Escocês Antigo e Aceito
              </p>
            </div>
          </div>
        </div>

        <div className="w-full bg-muted rounded-full h-2.5 mb-5">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-500"
            style={{ width: "0%" }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {philosophicalDegrees.map((deg) => (
            <div
              key={deg.number}
              className="flex flex-col items-center gap-2 portal-card rounded-xl p-3 opacity-60"
            >
              <DegreeIcon
                index={deg.number - 1}
                size={52}
                className="grayscale"
              />
              <div className="text-center">
                <p className="text-[10px] font-bold text-muted-foreground">{deg.number}º Grau</p>
                <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">{deg.label}</p>
              </div>
              <Lock className="h-3 w-3 text-muted-foreground" />
            </div>
          ))}
        </div>
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
