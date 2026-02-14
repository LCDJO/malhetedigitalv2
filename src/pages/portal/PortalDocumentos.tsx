import { FileText } from "lucide-react";

export default function PortalDocumentos() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Documentos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Documentos e circulares da Loja
        </p>
      </div>

      <div className="portal-card rounded-xl p-8 text-center">
        <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">
          Os documentos da Loja serão disponibilizados em breve.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Consulte o Secretário para mais informações.
        </p>
      </div>
    </div>
  );
}
