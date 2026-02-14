import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export function PortalFooter() {
  const [docDialog, setDocDialog] = useState<{ title: string; content: string; version: string } | null>(null);

  const openDocument = async (table: "termos_uso" | "politicas_privacidade", title: string) => {
    const { data } = await supabase
      .from(table)
      .select("versao, conteudo")
      .eq("ativo", true)
      .order("data_publicacao", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      setDocDialog({ title, content: data.conteudo, version: data.versao });
    }
  };

  const year = new Date().getFullYear();

  return (
    <>
      <footer className="border-t border-[hsl(42_40%_22%/0.2)] bg-[hsl(220_25%_6%)] px-5 py-2.5 shrink-0 space-y-1">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => openDocument("termos_uso", "Termos de Uso")}
            className="text-[11px] text-[hsl(220_10%_50%)] hover:text-[hsl(42_60%_68%)] transition-colors flex items-center gap-1"
          >
            <FileText className="h-3 w-3" /> Termos de Uso
          </button>
          <span className="text-[hsl(220_10%_30%)] text-[10px]">|</span>
          <button
            onClick={() => openDocument("politicas_privacidade", "Política de Privacidade")}
            className="text-[11px] text-[hsl(220_10%_50%)] hover:text-[hsl(42_60%_68%)] transition-colors flex items-center gap-1"
          >
            <ShieldCheck className="h-3 w-3" /> Política de Privacidade
          </button>
        </div>
        <p className="text-center text-[10px] text-[hsl(220_10%_40%)]">
          © {year} — Todos os direitos reservados.
        </p>
      </footer>

      <Dialog open={!!docDialog} onOpenChange={(o) => { if (!o) setDocDialog(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="font-serif">{docDialog?.title}</DialogTitle>
            <p className="text-xs text-muted-foreground">Versão {docDialog?.version}</p>
          </DialogHeader>
          <ScrollArea className="h-[500px] rounded-md border p-4">
            <div className="prose prose-sm max-w-none text-sm text-foreground whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: docDialog?.content ?? "" }} />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
