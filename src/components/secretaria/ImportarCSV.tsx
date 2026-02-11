import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Loader2, Download, X } from "lucide-react";
import { toast } from "sonner";

interface ImportarCSVProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ParsedRow {
  full_name: string;
  cpf: string;
  cim: string;
  email: string;
  phone: string;
  birth_date: string;
  address: string;
  degree: string;
  status: string;
  initiation_date: string;
  elevation_date: string;
  exaltation_date: string;
  notes: string;
}

interface RowValidation {
  row: ParsedRow;
  index: number;
  errors: string[];
  valid: boolean;
}

const EXPECTED_HEADERS = [
  "nome_completo", "cpf", "cim", "email", "telefone",
  "data_nascimento", "endereco", "grau", "status",
  "data_iniciacao", "data_elevacao", "data_exaltacao", "observacoes",
];

const VALID_DEGREES = ["aprendiz", "companheiro", "mestre"];
const VALID_STATUSES = ["ativo", "inativo", "licenciado", "suspenso", "falecido"];

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ";" || ch === ",") { result.push(current.trim()); current = ""; }
      else { current += ch; }
    }
  }
  result.push(current.trim());
  return result;
}

function parseDate(value: string): string | null {
  if (!value) return null;
  // dd/MM/yyyy
  const brMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
  // yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return null;
}

function validateCpfDigits(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return rest === parseInt(digits[10]);
}

function validateRow(row: ParsedRow, index: number): RowValidation {
  const errors: string[] = [];
  if (!row.full_name) errors.push("Nome obrigatório");
  if (!row.cpf) errors.push("CPF obrigatório");
  else if (!validateCpfDigits(row.cpf)) errors.push("CPF inválido");
  if (!row.cim) errors.push("CIM obrigatório");
  if (row.degree && !VALID_DEGREES.includes(row.degree.toLowerCase())) errors.push(`Grau inválido: ${row.degree}`);
  if (row.status && !VALID_STATUSES.includes(row.status.toLowerCase())) errors.push(`Status inválido: ${row.status}`);
  if (row.birth_date && !parseDate(row.birth_date)) errors.push("Data nascimento inválida");
  if (row.initiation_date && !parseDate(row.initiation_date)) errors.push("Data iniciação inválida");
  if (row.elevation_date && !parseDate(row.elevation_date)) errors.push("Data elevação inválida");
  if (row.exaltation_date && !parseDate(row.exaltation_date)) errors.push("Data exaltação inválida");
  return { row, index, errors, valid: errors.length === 0 };
}

function formatCpfForStorage(cpf: string): string {
  const d = cpf.replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
  return cpf;
}

export function ImportarCSV({ open, onOpenChange, onSuccess }: ImportarCSVProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<RowValidation[]>([]);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");

  const reset = () => {
    setRows([]);
    setFileName("");
    setParseError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseError("");

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        if (lines.length < 2) { setParseError("O arquivo deve conter ao menos um cabeçalho e uma linha de dados."); return; }

        const headers = parseCsvLine(lines[0]).map((h) =>
          h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_")
        );

        const parsed: RowValidation[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCsvLine(lines[i]);
          if (cols.every((c) => !c)) continue;
          const getCol = (name: string) => {
            const idx = headers.indexOf(name);
            return idx >= 0 ? cols[idx] || "" : "";
          };
          const row: ParsedRow = {
            full_name: getCol("nome_completo") || getCol("nome"),
            cpf: getCol("cpf"),
            cim: getCol("cim"),
            email: getCol("email") || getCol("e-mail"),
            phone: getCol("telefone") || getCol("phone"),
            birth_date: getCol("data_nascimento") || getCol("nascimento"),
            address: getCol("endereco") || getCol("endereço"),
            degree: getCol("grau") || getCol("degree"),
            status: getCol("status"),
            initiation_date: getCol("data_iniciacao") || getCol("iniciacao"),
            elevation_date: getCol("data_elevacao") || getCol("elevacao"),
            exaltation_date: getCol("data_exaltacao") || getCol("exaltacao"),
            notes: getCol("observacoes") || getCol("obs"),
          };
          parsed.push(validateRow(row, i));
        }
        if (parsed.length === 0) { setParseError("Nenhuma linha de dados encontrada no arquivo."); return; }
        setRows(parsed);
      } catch {
        setParseError("Erro ao processar o arquivo CSV.");
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const validRows = rows.filter((r) => r.valid);
  const invalidRows = rows.filter((r) => !r.valid);

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    const payload = validRows.map((r) => ({
      full_name: r.row.full_name.trim(),
      cpf: formatCpfForStorage(r.row.cpf),
      cim: r.row.cim.trim(),
      email: r.row.email || null,
      phone: r.row.phone || null,
      birth_date: parseDate(r.row.birth_date),
      address: r.row.address || null,
      degree: (r.row.degree || "aprendiz").toLowerCase(),
      status: (r.row.status || "ativo").toLowerCase(),
      initiation_date: parseDate(r.row.initiation_date),
      elevation_date: parseDate(r.row.elevation_date),
      exaltation_date: parseDate(r.row.exaltation_date),
      notes: r.row.notes || null,
    }));

    const { error, data } = await supabase.from("members").insert(payload).select("id");
    setImporting(false);
    if (error) {
      if (error.message.includes("unique")) {
        toast.error("Alguns CPFs ou CIMs já estão cadastrados. Verifique duplicatas.");
      } else {
        toast.error("Erro ao importar: " + error.message);
      }
    } else {
      toast.success(`${data.length} irmão(s) importado(s) com sucesso.`);
      reset();
      onOpenChange(false);
      onSuccess();
    }
  };

  const downloadTemplate = () => {
    const header = "nome_completo;cpf;cim;email;telefone;data_nascimento;endereco;grau;status;data_iniciacao;data_elevacao;data_exaltacao;observacoes";
    const example = "João da Silva;123.456.789-09;100001;joao@email.com;(11) 99999-0000;01/01/1980;São Paulo, SP;aprendiz;ativo;15/03/2020;;;";
    const blob = new Blob([header + "\n" + example], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo_importacao_irmaos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" /> Importar Irmãos via CSV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {rows.length === 0 ? (
            <>
              <Alert>
                <AlertDescription className="text-sm space-y-2">
                  <p>Faça upload de um arquivo CSV com os dados dos irmãos. Use <strong>ponto e vírgula (;)</strong> ou <strong>vírgula (,)</strong> como separador.</p>
                  <p className="text-xs text-muted-foreground">Colunas esperadas: nome_completo*, cpf*, cim*, email, telefone, data_nascimento, endereco, grau, status, data_iniciacao, data_elevacao, data_exaltacao, observacoes</p>
                  <p className="text-xs text-muted-foreground">Datas no formato dd/MM/aaaa ou aaaa-MM-dd. Campos com * são obrigatórios.</p>
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadTemplate}>
                  <Download className="h-4 w-4" /> Baixar Modelo CSV
                </Button>
              </div>

              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Clique para selecionar o arquivo CSV</p>
                <p className="text-xs text-muted-foreground mt-1">ou arraste e solte aqui</p>
              </div>
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />

              {parseError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{parseError}</AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="gap-1 text-xs">
                    <FileSpreadsheet className="h-3 w-3" /> {fileName}
                  </Badge>
                  <span className="text-sm">
                    <span className="text-green-600 font-medium">{validRows.length} válido(s)</span>
                    {invalidRows.length > 0 && (
                      <span className="text-destructive font-medium ml-2">{invalidRows.length} com erro(s)</span>
                    )}
                  </span>
                </div>
                <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={reset}>
                  <X className="h-3.5 w-3.5" /> Limpar
                </Button>
              </div>

              {invalidRows.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {invalidRows.length} linha(s) com erros serão ignoradas na importação.
                  </AlertDescription>
                </Alert>
              )}

              <div className="rounded-md border max-h-[350px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>CIM</TableHead>
                      <TableHead>Grau</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Validação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.index} className={r.valid ? "" : "bg-destructive/5"}>
                        <TableCell className="text-xs text-muted-foreground">{r.index}</TableCell>
                        <TableCell className="text-sm font-medium">{r.row.full_name || "—"}</TableCell>
                        <TableCell className="text-sm">{r.row.cpf || "—"}</TableCell>
                        <TableCell className="text-sm">{r.row.cim || "—"}</TableCell>
                        <TableCell className="text-sm">{r.row.degree || "aprendiz"}</TableCell>
                        <TableCell className="text-sm">{r.row.status || "ativo"}</TableCell>
                        <TableCell>
                          {r.valid ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <span className="text-xs text-destructive">{r.errors.join("; ")}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cancelar</Button>
          {rows.length > 0 && (
            <Button onClick={handleImport} disabled={importing || validRows.length === 0} className="gap-1.5">
              {importing ? <><Loader2 className="h-4 w-4 animate-spin" /> Importando...</> : <>
                <Upload className="h-4 w-4" /> Importar {validRows.length} irmão(s)
              </>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
