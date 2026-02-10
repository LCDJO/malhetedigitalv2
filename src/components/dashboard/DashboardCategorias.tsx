import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, categoriasDespesa } from "./DashboardData";
import { SectionHeader } from "./SectionHeader";

export function DashboardCategorias() {
  const totalDespesas = categoriasDespesa.reduce((s, c) => s + c.valor, 0);

  return (
    <section className="space-y-4">
      <SectionHeader title="Resumo por Categorias" subtitle="Distribuição das despesas do período" />

      <Card className="animate-fade-in [animation-delay:600ms]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-sans font-semibold">
            Despesas por Categoria — Total: {formatCurrency(totalDespesas)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoriasDespesa.map((cat) => (
              <div key={cat.nome} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{cat.nome}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{cat.percentual}%</span>
                    <span className="font-semibold w-20 text-right">{formatCurrency(cat.valor)}</span>
                  </div>
                </div>
                <Progress value={cat.percentual} className="h-1.5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
