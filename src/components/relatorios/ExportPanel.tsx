import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import type { LodgeConfigData } from "@/hooks/useLodgeConfig";
import {
  createOfficialPdf, savePdf, addSectionTitle, addKeyValueRow, addTable,
  pdfFormatCurrency,
} from "@/lib/exportPdf";
import { exportToExcel } from "@/lib/exportExcel";

interface Transaction {
  id: string;
  tipo: string;
  valor: number;
  descricao: string;
  data: string;
  status: string;
  member_id: string;
  created_by?: string | null;
  created_at?: string;
}

interface Member {
  id: string;
  full_name: string;
  cim: string;
  status: string;
  degree?: string;
  email?: string | null;
  phone?: string | null;
}

function getLabelTipo(tipo: string) {
  switch (tipo) {
    case "mensalidade": return "Mensalidade";
    case "taxa": return "Taxa";
    case "avulso": return "Avulso";
    case "despesa": return "Despesa";
    default: return tipo;
  }
}

function getLabelStatus(s: string) {
  return s === "pago" ? "Pago" : "Em Aberto";
}

function fmtDate(d: string) {
  try { return format(new Date(d + "T12:00:00"), "dd/MM/yyyy"); } catch { return d; }
}

function fmtCur(v: number) { return pdfFormatCurrency(v); }

// ──────────────── PDF EXPORTS ────────────────

export function exportBalancetePdf(
  config: LodgeConfigData,
  transactions: Transaction[],
  activeMembers: number,
  periodoLabel: string,
  emitidoPor?: string,
) {
  const { doc, y } = createOfficialPdf({
    config,
    titulo: "Balancete Financeiro",
    subtitulo: periodoLabel,
    emitidoPor,
  });

  let curY = y;

  // KPIs
  const entradas = transactions.filter((t) => t.tipo !== "despesa");
  const saidas = transactions.filter((t) => t.tipo === "despesa");
  const totalArrecadado = entradas.filter((t) => t.status === "pago").reduce((s, t) => s + Number(t.valor), 0);
  const totalEmAberto = transactions.filter((t) => t.status === "em_aberto").reduce((s, t) => s + Number(t.valor), 0);
  const totalEntradas = entradas.reduce((s, t) => s + Number(t.valor), 0);
  const totalSaidas = saidas.reduce((s, t) => s + Number(t.valor), 0);
  const saldo = totalEntradas - totalSaidas;

  curY = addSectionTitle(doc, curY, "Resumo");
  curY = addKeyValueRow(doc, curY, "Arrecadado (pago):", fmtCur(totalArrecadado));
  curY = addKeyValueRow(doc, curY, "Em Aberto:", fmtCur(totalEmAberto));
  curY = addKeyValueRow(doc, curY, "Total Despesas:", fmtCur(totalSaidas));
  curY = addKeyValueRow(doc, curY, "Saldo do Período:", fmtCur(saldo));
  curY = addKeyValueRow(doc, curY, "Membros Ativos:", activeMembers.toString());
  curY += 4;

  // Table by category
  curY = addSectionTitle(doc, curY, "Demonstrativo por Categoria");
  const cats = ["mensalidade", "taxa", "avulso", "despesa"];
  const catRows = cats.map((tipo) => {
    const txs = transactions.filter((t) => t.tipo === tipo);
    const pago = txs.filter((t) => t.status === "pago").reduce((s, t) => s + Number(t.valor), 0);
    const aberto = txs.filter((t) => t.status === "em_aberto").reduce((s, t) => s + Number(t.valor), 0);
    return [getLabelTipo(tipo), fmtCur(pago), fmtCur(aberto), fmtCur(pago + aberto), txs.length.toString()];
  }).filter((r) => r[4] !== "0");

  curY = addTable(doc, curY, [["Categoria", "Arrecadado", "Em Aberto", "Total", "Qtd"]], catRows);

  savePdf(doc, config, `balancete_${periodoLabel.replace(/\s/g, "_")}.pdf`);
  toast.success("Balancete exportado em PDF com timbre oficial.");
}

export function exportPrestacaoContasPdf(
  config: LodgeConfigData,
  transactions: Transaction[],
  members: Member[],
  periodoLabel: string,
  emitidoPor?: string,
) {
  const { doc, y } = createOfficialPdf({
    config,
    titulo: "Prestação de Contas",
    subtitulo: periodoLabel,
    emitidoPor,
  });

  let curY = y;

  const receitas = transactions.filter((t) => t.tipo !== "despesa");
  const despesas = transactions.filter((t) => t.tipo === "despesa");
  const totalReceitas = receitas.reduce((s, t) => s + Number(t.valor), 0);
  const totalDespesas = despesas.reduce((s, t) => s + Number(t.valor), 0);
  const saldo = totalReceitas - totalDespesas;

  curY = addSectionTitle(doc, curY, "I — Resumo Geral");
  curY = addKeyValueRow(doc, curY, "Total Receitas:", fmtCur(totalReceitas));
  curY = addKeyValueRow(doc, curY, "Total Despesas:", fmtCur(totalDespesas));
  curY = addKeyValueRow(doc, curY, "Saldo:", fmtCur(saldo));
  curY += 4;

  curY = addSectionTitle(doc, curY, "II — Detalhamento de Lançamentos");

  const getMember = (id: string) => members.find((m) => m.id === id);
  const body = transactions.map((t) => [
    t.id.slice(0, 8).toUpperCase(),
    fmtDate(t.data),
    getMember(t.member_id)?.full_name ?? "—",
    getLabelTipo(t.tipo),
    fmtCur(Number(t.valor)),
    getLabelStatus(t.status),
  ]);

  curY = addTable(doc, curY, [["Ref.", "Data", "Irmão", "Tipo", "Valor", "Situação"]], body);

  savePdf(doc, config, `prestacao_contas_${periodoLabel.replace(/\s/g, "_")}.pdf`);
  toast.success("Prestação de Contas exportada em PDF.");
}

export function exportInadimplenciaPdf(
  config: LodgeConfigData,
  inadimplentes: { full_name: string; cim: string; degree: string; totalAberto: number; qtdAberto: number }[],
  periodoLabel: string,
  emitidoPor?: string,
) {
  const { doc, y } = createOfficialPdf({
    config,
    titulo: "Relatório de Inadimplência",
    subtitulo: `Situação Financeira — ${periodoLabel}`,
    emitidoPor,
  });

  let curY = y;
  const totalGeral = inadimplentes.reduce((s, m) => s + m.totalAberto, 0);

  curY = addSectionTitle(doc, curY, "Resumo");
  curY = addKeyValueRow(doc, curY, "Irmãos com pendência:", inadimplentes.length.toString());
  curY = addKeyValueRow(doc, curY, "Valor total pendente:", fmtCur(totalGeral));
  curY += 4;

  curY = addSectionTitle(doc, curY, "Relação de Irmãos");
  const body = inadimplentes.map((m) => [m.full_name, m.cim, m.degree, m.qtdAberto.toString(), fmtCur(m.totalAberto)]);
  curY = addTable(doc, curY, [["Irmão", "CIM", "Grau", "Pendências", "Valor"]], body);

  savePdf(doc, config, `inadimplencia_${periodoLabel.replace(/\s/g, "_")}.pdf`);
  toast.success("Relatório de Inadimplência exportado em PDF.");
}

export function exportIndividualPdf(
  config: LodgeConfigData,
  member: Member & { degree: string; initiation_date?: string | null; elevation_date?: string | null; exaltation_date?: string | null },
  transactions: Transaction[],
  emitidoPor?: string,
) {
  const { doc, y } = createOfficialPdf({
    config,
    titulo: "Relatório Financeiro Individual",
    subtitulo: `${member.full_name} — CIM ${member.cim}`,
    emitidoPor,
  });

  let curY = y;

  curY = addSectionTitle(doc, curY, "Dados do Irmão");
  curY = addKeyValueRow(doc, curY, "Nome:", member.full_name);
  curY = addKeyValueRow(doc, curY, "CIM:", member.cim);
  curY = addKeyValueRow(doc, curY, "Grau:", member.degree);
  curY = addKeyValueRow(doc, curY, "Situação:", member.status);
  if (member.initiation_date) curY = addKeyValueRow(doc, curY, "Iniciação:", fmtDate(member.initiation_date));
  if (member.elevation_date) curY = addKeyValueRow(doc, curY, "Elevação:", fmtDate(member.elevation_date));
  if (member.exaltation_date) curY = addKeyValueRow(doc, curY, "Exaltação:", fmtDate(member.exaltation_date));
  curY += 4;

  const totalPago = transactions.filter((t) => t.status === "pago" && t.tipo !== "despesa").reduce((s, t) => s + Number(t.valor), 0);
  const totalAberto = transactions.filter((t) => t.status === "em_aberto").reduce((s, t) => s + Number(t.valor), 0);

  curY = addSectionTitle(doc, curY, "Resumo Financeiro");
  curY = addKeyValueRow(doc, curY, "Total Pago:", fmtCur(totalPago));
  curY = addKeyValueRow(doc, curY, "Em Aberto:", fmtCur(totalAberto));
  curY = addKeyValueRow(doc, curY, "Situação:", totalAberto === 0 ? "Regular" : "Pendente");
  curY += 4;

  curY = addSectionTitle(doc, curY, "Histórico de Lançamentos");
  const body = transactions.map((t) => [
    t.id.slice(0, 8).toUpperCase(),
    fmtDate(t.data),
    getLabelTipo(t.tipo),
    fmtCur(Number(t.valor)),
    getLabelStatus(t.status),
    t.descricao || "—",
  ]);
  curY = addTable(doc, curY, [["Ref.", "Data", "Tipo", "Valor", "Situação", "Obs."]], body);

  savePdf(doc, config, `financeiro_individual_${member.cim}.pdf`);
  toast.success("Relatório Individual exportado em PDF.");
}

// ──────────────── EXCEL EXPORTS ────────────────

export function exportLancamentosExcel(
  transactions: Transaction[],
  members: Member[],
  periodoLabel: string,
) {
  const getMember = (id: string) => members.find((m) => m.id === id);
  const rows = transactions.map((t) => [
    t.id.slice(0, 8).toUpperCase(),
    fmtDate(t.data),
    getMember(t.member_id)?.full_name ?? "—",
    getLabelTipo(t.tipo),
    Number(t.valor),
    getLabelStatus(t.status),
    t.descricao || "",
    t.created_at ? format(new Date(t.created_at), "dd/MM/yyyy HH:mm") : "",
  ]);

  exportToExcel([{
    name: "Lançamentos",
    headers: ["Ref.", "Data", "Irmão", "Tipo", "Valor", "Situação", "Descrição", "Registrado em"],
    rows,
  }], `lancamentos_${periodoLabel.replace(/\s/g, "_")}.xlsx`);
  toast.success("Lançamentos exportados em Excel.");
}

export function exportListagemIrmaosExcel(members: Member[]) {
  const rows = members.map((m) => [
    m.full_name,
    m.cim,
    m.degree ?? "",
    m.status,
    m.email ?? "",
    m.phone ?? "",
  ]);

  exportToExcel([{
    name: "Irmãos",
    headers: ["Nome", "CIM", "Grau", "Status", "E-mail", "Telefone"],
    rows,
  }], "listagem_irmaos.xlsx");
  toast.success("Listagem de irmãos exportada em Excel.");
}

export async function exportResumoFinanceiroPeriodoExcel(ano: string) {
  const { data: txs } = await supabase
    .from("member_transactions")
    .select("tipo, valor, data, status")
    .in("status", ["pago", "em_aberto"])
    .gte("data", `${ano}-01-01`)
    .lte("data", `${ano}-12-31`);

  const transactions = txs ?? [];
  const mesesLabel = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  const rows = Array.from({ length: 12 }, (_, i) => {
    const m = (i + 1).toString().padStart(2, "0");
    const monthTx = transactions.filter((t) => t.data.startsWith(`${ano}-${m}`));
    const pago = monthTx.filter((t) => t.status === "pago" && t.tipo !== "despesa").reduce((s, t) => s + Number(t.valor), 0);
    const aberto = monthTx.filter((t) => t.status === "em_aberto").reduce((s, t) => s + Number(t.valor), 0);
    const despesas = monthTx.filter((t) => t.tipo === "despesa").reduce((s, t) => s + Number(t.valor), 0);
    return [mesesLabel[i], pago, aberto, despesas, pago - despesas, monthTx.length];
  });

  exportToExcel([{
    name: `Resumo ${ano}`,
    headers: ["Mês", "Arrecadado", "Em Aberto", "Despesas", "Saldo", "Lançamentos"],
    rows,
  }], `resumo_financeiro_${ano}.xlsx`);
  toast.success("Resumo financeiro exportado em Excel.");
}

// ──────────────── EXPORT PANEL COMPONENT ────────────────

interface ExportPanelProps {
  config: LodgeConfigData;
  transactions: Transaction[];
  members: Member[];
  periodoLabel: string;
  emitidoPor?: string;
  ano: string;
}

export default function ExportPanel({ config, transactions, members, periodoLabel, emitidoPor, ano }: ExportPanelProps) {
  const membrosAtivos = members.filter((m) => m.status === "ativo");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-sans font-semibold flex items-center gap-2">
          <Download className="h-4 w-4 text-primary" /> Exportação Oficial
        </CardTitle>
        <CardDescription>
          Documentos oficiais com timbre da Loja — dados fiéis ao sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* PDF Section */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Relatórios em PDF
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2 text-xs"
              onClick={() => exportBalancetePdf(config, transactions, membrosAtivos.length, periodoLabel, emitidoPor)}
            >
              <FileText className="h-3.5 w-3.5 text-destructive" /> Balancete Financeiro
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2 text-xs"
              onClick={() => exportPrestacaoContasPdf(config, transactions, members, periodoLabel, emitidoPor)}
            >
              <FileText className="h-3.5 w-3.5 text-destructive" /> Prestação de Contas
            </Button>
          </div>
        </div>

        <Separator />

        {/* Excel Section */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <FileSpreadsheet className="h-3.5 w-3.5" /> Dados em Excel
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2 text-xs"
              onClick={() => exportLancamentosExcel(transactions, members, periodoLabel)}
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-success" /> Lançamentos Financeiros
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2 text-xs"
              onClick={async () => {
                const { data } = await supabase.from("members")
                  .select("id, full_name, cim, status, degree, email, phone")
                  .order("full_name");
                exportListagemIrmaosExcel(data ?? []);
              }}
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-success" /> Listagem de Irmãos
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2 text-xs"
              onClick={() => exportResumoFinanceiroPeriodoExcel(ano)}
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-success" /> Resumo Anual ({ano})
            </Button>
          </div>
        </div>

        <div className="text-[10px] text-muted-foreground mt-2">
          Todos os documentos exportados contêm exclusivamente dados válidos registrados no sistema,
          com timbre oficial e informações de emissão para fins de auditoria.
        </div>
      </CardContent>
    </Card>
  );
}
