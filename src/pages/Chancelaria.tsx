import { Stamp } from "lucide-react";

export default function Chancelaria() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Stamp className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Chancelaria</h1>
      <p className="text-muted-foreground max-w-md">
        Módulo em desenvolvimento. Em breve você poderá gerenciar documentos, atas e correspondências oficiais da Loja.
      </p>
    </div>
  );
}
