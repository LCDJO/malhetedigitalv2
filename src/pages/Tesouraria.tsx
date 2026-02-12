import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Building2 } from "lucide-react";
import { FinanceiroIrmaoTab } from "@/components/tesouraria/FinanceiroIrmaoTab";
import FinanceiroGeral from "./FinanceiroGeral";

const Tesouraria = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold">Tesouraria</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestão financeira dos irmãos e da Loja</p>
      </div>

      <Tabs defaultValue="irmao" className="space-y-4">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="irmao" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <User className="h-4 w-4" />
            Financeiro do Irmão
          </TabsTrigger>
          <TabsTrigger value="loja" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Building2 className="h-4 w-4" />
            Financeiro da Loja
          </TabsTrigger>
        </TabsList>

        <TabsContent value="irmao">
          <FinanceiroIrmaoTab />
        </TabsContent>

        <TabsContent value="loja">
          <FinanceiroGeral embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tesouraria;
