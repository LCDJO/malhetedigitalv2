import { createOfficialPdf, addSectionTitle, savePdf } from "@/lib/exportPdf";
import type { LodgeConfigData } from "@/hooks/useLodgeConfig";

interface AtaPdfInput {
  config: LodgeConfigData;
  ata: {
    numero: string | null;
    titulo: string | null;
    estado: string;
    versao_atual: number;
    hash_integridade?: string | null;
    publicada_em?: string | null;
    travada_em?: string | null;
  };
  blocos: { titulo: string | null; tipo: string; conteudo: string | null; ordem: number }[];
  assinaturas: { papel: string; assinado_em: string; versao: number }[];
  emitidoPor?: string;
}

function wrapText(doc: import("jspdf").jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text || "", maxWidth);
}

export function exportAtaPdf(input: AtaPdfInput) {
  const { config, ata, blocos, assinaturas } = input;
  const titulo = ata.titulo || `Ata${ata.numero ? ` nº ${ata.numero}` : ""}`;
  const subtitulo = `Estado: ${ata.estado.toUpperCase()} • Versão ${ata.versao_atual}`;

  const { doc, y: y0 } = createOfficialPdf({
    config,
    titulo,
    subtitulo,
    emitidoPor: input.emitidoPor,
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 20;
  const maxWidth = pageW - marginX * 2;
  let y = y0;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - 25) {
      doc.addPage();
      y = 20;
    }
  };

  const ordered = [...blocos].sort((a, b) => a.ordem - b.ordem);
  for (const b of ordered) {
    ensureSpace(14);
    y = addSectionTitle(doc, y, (b.titulo || b.tipo).toUpperCase());
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lines = wrapText(doc, b.conteudo ?? "(em branco)", maxWidth);
    for (const ln of lines) {
      ensureSpace(6);
      doc.text(ln, marginX, y);
      y += 5;
    }
    y += 3;
  }

  // Assinaturas
  ensureSpace(20);
  y += 4;
  y = addSectionTitle(doc, y, "ASSINATURAS");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (assinaturas.length === 0) {
    doc.text("Nenhuma assinatura registrada.", marginX, y);
    y += 5;
  } else {
    for (const a of assinaturas) {
      ensureSpace(6);
      const when = new Date(a.assinado_em).toLocaleString("pt-BR");
      doc.text(`• ${a.papel} — assinado em ${when} (v${a.versao})`, marginX, y);
      y += 5;
    }
  }

  // Integridade
  if (ata.hash_integridade) {
    ensureSpace(12);
    y += 4;
    doc.setFontSize(7);
    doc.setTextColor(110);
    doc.text("Hash de integridade (SHA-256):", marginX, y);
    y += 3.5;
    const hashLines = wrapText(doc, ata.hash_integridade, maxWidth);
    for (const ln of hashLines) {
      ensureSpace(4);
      doc.text(ln, marginX, y);
      y += 3.5;
    }
    doc.setTextColor(0);
  }

  const filename = `ata-${ata.numero ?? "sn"}-v${ata.versao_atual}.pdf`;
  savePdf(doc, config, filename);
}
