import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Users, Receipt } from "lucide-react";
import { LancamentoIndividual } from "@/components/tesouraria/LancamentoIndividual";
import { LancamentoLote } from "@/components/tesouraria/LancamentoLote";
import { TaxasMaconicas } from "@/components/tesouraria/TaxasMaconicas";

const Tesouraria = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold">Tesouraria</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestão financeira e lançamentos da Loja</p>
      </div>

      <Tabs defaultValue="individual" className="space-y-4">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="individual" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <User className="h-4 w-4" />
            Lançamento Individual
          </TabsTrigger>
          <TabsTrigger value="lote" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Users className="h-4 w-4" />
            Lançamento em Lote
          </TabsTrigger>
          <TabsTrigger value="taxas" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Receipt className="h-4 w-4" />
            Taxas Maçônicas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual">
          <LancamentoIndividual />
        </TabsContent>

        <TabsContent value="lote">
          <LancamentoLote />
        </TabsContent>

        <TabsContent value="taxas">
          <TaxasMaconicas />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tesouraria;
