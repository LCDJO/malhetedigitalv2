import * as XLSX from "xlsx";

export interface ExcelSheetData {
  name: string;
  headers: string[];
  rows: (string | number)[][];
}

/**
 * Creates an Excel workbook with one or more sheets and triggers download.
 */
export function exportToExcel(sheets: ExcelSheetData[], filename: string) {
  const wb = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const data = [sheet.headers, ...sheet.rows];
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Auto-width columns
    const colWidths = sheet.headers.map((h, i) => {
      const maxLen = Math.max(
        h.length,
        ...sheet.rows.map((r) => String(r[i] ?? "").length)
      );
      return { wch: Math.min(maxLen + 2, 40) };
    });
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }

  XLSX.writeFile(wb, filename);
}
