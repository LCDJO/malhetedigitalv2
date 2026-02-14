import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plug } from "lucide-react";

export default function AdminIntegracoes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Integrações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie as integrações externas da plataforma.
        </p>
      </div>

      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          <Plug className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhuma integração configurada</p>
          <p className="text-sm mt-1">As integrações disponíveis aparecerão aqui.</p>
        </CardContent>
      </Card>
    </div>
  );
}
