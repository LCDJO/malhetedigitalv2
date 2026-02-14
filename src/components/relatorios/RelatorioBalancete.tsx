import { useState } from "react";
import { useLodgeConfig } from "@/hooks/useLodgeConfig";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Users, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface Transaction {
  id: string;
  tipo: string;
  valor: number;
  descricao: string;
  data: string;
  status: string;
  member_id: string;
}

interface Props {
  transactions: Transaction[];
  activeMembers: number;
  periodoLabel: string;
}

const CATEGORIAS = [
  { value: "todas", label: "Todas as Categorias" },
  { value: "mensalidade", label: "Mensalidades" },
  { value: "taxa", label: "Taxas" },
  { value: "avulso", label: "Avulsos" },
  { value: "despesa", label: "Despesas" },
];

function getLabelTipo(tipo: string) {
  const found = CATEGORIAS.find((c) => c.value === tipo);
  return found?.label ?? tipo;
}

export default function RelatorioBalancete({ transactions, activeMembers, periodoLabel }: Props) {
  const { config } = useLodgeConfig();
  const { profile } = useAuth();
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const now = new Date();

  // Apply category filter
  const filtered = categoriaFiltro === "todas"
    ? transactions
    : transactions.filter((t) => t.tipo === categoriaFiltro);

  // Cálculos gerais
  const entradas = filtered.filter((t) => t.tipo !== "despesa");
  const saidas = filtered.filter((t) => t.tipo === "despesa");

  const totalArrecadado = filtered.filter((t) => t.status === "pago").reduce((s, t) => s + Number(t.valor), 0);
  const totalEmAberto = filtered.filter((t) => t.status === "em_aberto").reduce((s, t) => s + Number(t.valor), 0);
  const totalEntradas = entradas.reduce((s, t) => s + Number(t.valor), 0);
  const totalSaidas = saidas.reduce((s, t) => s + Number(t.valor), 0);
  const saldo = totalEntradas - totalSaidas;

  // Entradas por categoria
  const entradasPorCategoria = ["mensalidade", "taxa", "avulso"]
    .map((tipo) => {
      const txs = filtered.filter((t) => t.tipo === tipo);
      if (txs.length === 0) return null;
      return {
        tipo,
        label: getLabelTipo(tipo),
        pago: txs.filter((t) => t.status === "pago").reduce((s, t) => s + Number(t.valor), 0),
        aberto: txs.filter((t) => t.status === "em_aberto").reduce((s, t) => s + Number(t.valor), 0),
        qtd: txs.length,
      };
    })
    .filter(Boolean) as { tipo: string; label: string; pago: number; aberto: number; qtd: number }[];

  // Saídas por categoria (despesas)
  const saidasPorCategoria = (() => {
    const txs = filtered.filter((t) => t.tipo === "despesa");
    if (txs.length === 0) return [];
    return [{
      tipo: "despesa",
      label: "Despesas",
      pago: txs.filter((t) => t.status === "pago").reduce((s, t) => s + Number(t.valor), 0),
      aberto: txs.filter((t) => t.status === "em_aberto").reduce((s, t) => s + Number(t.valor), 0),
      qtd: txs.length,
    }];
  })();

  const receitaPrevista = activeMembers * config.mensalidade_padrao;
  const totalPagoEntradas = entradas.filter((t) => t.status === "pago").reduce((s, t) => s + Number(t.valor), 0);

  return (
    <div className="space-y-6">
      {/* Cabeçalho institucional para impressão */}
      <div className="hidden print:block text-center space-y-1 mb-6">
        <p className="text-lg font-bold font-serif">{config.lodge_name || "Loja Maçônica"}</p>
        <p className="text-sm">Nº {config.lodge_number} — Or∴ de {config.orient}</p>
        {config.potencia && <p className="text-xs text-muted-foreground">{config.potencia}</p>}
        <Separator className="my-3" />
        <p className="text-base font-semibold">BALANCETE FINANCEIRO — {periodoLabel.toUpperCase()}</p>
        <p className="text-xs text-muted-foreground">
          Emitido em {format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} por {profile?.full_name}
        </p>
      </div>

      {/* Filtro de categoria */}
      <Card className="print:hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-sans font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" /> Filtros do Balancete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categoriaFiltro !== "todas" && (
              <Badge variant="secondary" className="text-xs">
                Filtrado: {getLabelTipo(categoriaFiltro)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPIs resumidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Arrecadado</p>
            </div>
            <p className="text-xl font-bold font-serif">{formatCurrency(totalArrecadado)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 space-y-1">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-warning" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Em Aberto</p>
            </div>
            <p className="text-xl font-bold font-serif">{formatCurrency(totalEmAberto)}</p>
          </CardContent>
        </Card>
        <Card className={saldo >= 0 ? "border-success/30" : "border-destructive/30"}>
          <CardContent className="pt-5 space-y-1">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Saldo</p>
            </div>
            <p className={`text-xl font-bold font-serif ${saldo >= 0 ? "text-success" : "text-destructive"}`}>
              {formatCurrency(saldo)}
            </p>
            <p className="text-[10px] text-muted-foreground">Receitas − Despesas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 space-y-1">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Membros Ativos</p>
            </div>
            <p className="text-xl font-bold font-serif">{activeMembers}</p>
          </CardContent>
        </Card>
      </div>

      {/* ENTRADAS por categoria */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-sans font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" /> Entradas por Categoria
          </CardTitle>
          <CardDescription>Receitas do período {periodoLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Arrecadado</TableHead>
                  <TableHead className="text-right">Em Aberto</TableHead>
                  <TableHead className="text-right">Total Previsto</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entradasPorCategoria.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                      Nenhuma entrada registrada no período.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {entradasPorCategoria.map((r) => (
                      <TableRow key={r.tipo}>
                        <TableCell className="font-medium">{r.label}</TableCell>
                        <TableCell className="text-right text-success">{formatCurrency(r.pago)}</TableCell>
                        <TableCell className="text-right text-warning">{formatCurrency(r.aberto)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(r.pago + r.aberto)}</TableCell>
                        <TableCell className="text-center">{r.qtd}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell>Subtotal Entradas</TableCell>
                      <TableCell className="text-right text-success">
                        {formatCurrency(entradasPorCategoria.reduce((s, r) => s + r.pago, 0))}
                      </TableCell>
                      <TableCell className="text-right text-warning">
                        {formatCurrency(entradasPorCategoria.reduce((s, r) => s + r.aberto, 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(entradasPorCategoria.reduce((s, r) => s + r.pago + r.aberto, 0))}
                      </TableCell>
                      <TableCell className="text-center">
                        {entradasPorCategoria.reduce((s, r) => s + r.qtd, 0)}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* SAÍDAS */}
      {saidasPorCategoria.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-sans font-semibold flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" /> Saídas
            </CardTitle>
            <CardDescription>Despesas do período {periodoLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Pago</TableHead>
                    <TableHead className="text-right">Em Aberto</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saidasPorCategoria.map((r) => (
                    <TableRow key={r.tipo}>
                      <TableCell className="font-medium">{r.label}</TableCell>
                      <TableCell className="text-right text-destructive">{formatCurrency(r.pago)}</TableCell>
                      <TableCell className="text-right text-warning">{formatCurrency(r.aberto)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(r.pago + r.aberto)}</TableCell>
                      <TableCell className="text-center">{r.qtd}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/30 font-semibold">
                    <TableCell>Subtotal Saídas</TableCell>
                    <TableCell className="text-right text-destructive">{formatCurrency(totalSaidas)}</TableCell>
                    <TableCell className="text-right text-warning">
                      {formatCurrency(saidasPorCategoria.reduce((s, r) => s + r.aberto, 0))}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(totalSaidas + saidasPorCategoria.reduce((s, r) => s + r.aberto, 0))}</TableCell>
                    <TableCell className="text-center">{saidasPorCategoria.reduce((s, r) => s + r.qtd, 0)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo consolidado */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-sans font-semibold">Resumo Consolidado</CardTitle>
          <CardDescription>Balancete {periodoLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium">Total de Receitas (pagas)</span>
              <span className="font-bold text-success">{formatCurrency(totalPagoEntradas)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium">Total de Despesas (pagas)</span>
              <span className="font-bold text-destructive">
                {formatCurrency(saidas.filter((t) => t.status === "pago").reduce((s, t) => s + Number(t.valor), 0))}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium">Valores em Aberto</span>
              <span className="font-bold text-warning">{formatCurrency(totalEmAberto)}</span>
            </div>
            <Separator className="border-primary/20" />
            <div className="flex justify-between items-center py-2 bg-muted/30 rounded-md px-3 -mx-3">
              <span className="text-sm font-semibold">Saldo do Período (Receitas − Despesas)</span>
              <span className={`text-lg font-bold font-serif ${saldo >= 0 ? "text-success" : "text-destructive"}`}>
                {formatCurrency(saldo)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receita prevista */}
      {config.mensalidade_padrao > 0 && categoriaFiltro === "todas" && (
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Receita Prevista (Mensalidades)</p>
                <p className="text-xs text-muted-foreground">
                  {activeMembers} membros × {formatCurrency(config.mensalidade_padrao)}
                </p>
              </div>
              <p className="text-xl font-bold font-serif">{formatCurrency(receitaPrevista)}</p>
            </div>
            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min(100, receitaPrevista > 0 ? (totalPagoEntradas / receitaPrevista) * 100 : 0)}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {receitaPrevista > 0 ? ((totalPagoEntradas / receitaPrevista) * 100).toFixed(1) : "0"}% da receita prevista arrecadada
            </p>
          </CardContent>
        </Card>
      )}

      {/* Rodapé institucional */}
      <div className="text-center text-[10px] text-muted-foreground pt-4 border-t space-y-1">
        <p>Documento gerado automaticamente pelo sistema Malhete Digital</p>
        <p>{config.lodge_name} — Nº {config.lodge_number} — Or∴ de {config.orient}</p>
        <p>Emitido em {format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
      </div>
    </div>
  );
}
