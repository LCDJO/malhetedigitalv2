import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { LodgeConfigData } from "@/hooks/useLodgeConfig";

export interface PdfHeaderOptions {
  config: LodgeConfigData;
  titulo: string;
  subtitulo?: string;
  emitidoPor?: string;
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Creates a jsPDF instance with official lodge header (timbre).
 * Returns the doc and the Y position after the header.
 */
export function createOfficialPdf(opts: PdfHeaderOptions): { doc: jsPDF; y: number } {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const now = new Date();

  // ── Timbre / Header ──
  let y = 15;

  // Lodge name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(opts.config.lodge_name || "Loja Maçônica", pageW / 2, y, { align: "center" });
  y += 6;

  // Number + Orient
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Nº ${opts.config.lodge_number} — Or∴ de ${opts.config.orient}`, pageW / 2, y, { align: "center" });
  y += 4;

  if (opts.config.potencia) {
    doc.setFontSize(8);
    doc.text(opts.config.potencia, pageW / 2, y, { align: "center" });
    y += 4;
  }

  // Separator line
  y += 2;
  doc.setDrawColor(100);
  doc.setLineWidth(0.3);
  doc.line(20, y, pageW - 20, y);
  y += 6;

  // Report title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(opts.titulo.toUpperCase(), pageW / 2, y, { align: "center" });
  y += 5;

  if (opts.subtitulo) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(opts.subtitulo, pageW / 2, y, { align: "center" });
    y += 5;
  }

  // Emission info
  doc.setFontSize(7);
  doc.setTextColor(100);
  const emissao = `Emitido em ${format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}${opts.emitidoPor ? ` por ${opts.emitidoPor}` : ""}`;
  doc.text(emissao, pageW / 2, y, { align: "center" });
  doc.setTextColor(0);
  y += 8;

  return { doc, y };
}

/**
 * Adds official footer to every page.
 */
export function addOfficialFooter(doc: jsPDF, config: LodgeConfigData) {
  const pageCount = doc.getNumberOfPages();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(120);

    const footerY = pageH - 10;
    doc.setDrawColor(180);
    doc.setLineWidth(0.2);
    doc.line(20, footerY - 3, pageW - 20, footerY - 3);

    doc.text("Documento oficial gerado pelo sistema Malhete Digital", pageW / 2, footerY, { align: "center" });
    doc.text(
      `${config.lodge_name} — Nº ${config.lodge_number} — Or∴ de ${config.orient}`,
      pageW / 2,
      footerY + 3.5,
      { align: "center" }
    );
    doc.text(`Página ${i} de ${pageCount}`, pageW - 20, footerY + 3.5, { align: "right" });
    doc.setTextColor(0);
  }
}

// ── Section helpers ──

export function addSectionTitle(doc: jsPDF, y: number, text: string): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(text, 20, y);
  return y + 6;
}

export function addKeyValueRow(doc: jsPDF, y: number, label: string, value: string): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(label, 22, y);
  doc.setFont("helvetica", "bold");
  doc.text(value, 100, y);
  doc.setFont("helvetica", "normal");
  return y + 5;
}

export function addTable(
  doc: jsPDF,
  startY: number,
  head: string[][],
  body: string[][],
  options?: Partial<Parameters<typeof autoTable>[1]>
): number {
  autoTable(doc, {
    startY,
    head,
    body,
    theme: "grid",
    headStyles: {
      fillColor: [40, 40, 40],
      textColor: 255,
      fontSize: 8,
      fontStyle: "bold",
    },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 20, right: 20 },
    ...options,
  });

  return (doc as any).lastAutoTable?.finalY ?? startY + 10;
}

export function savePdf(doc: jsPDF, config: LodgeConfigData, filename: string) {
  addOfficialFooter(doc, config);
  doc.save(filename);
}

export { formatCurrency as pdfFormatCurrency };
