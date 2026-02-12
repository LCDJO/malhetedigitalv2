import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, DollarSign, ShieldCheck } from "lucide-react";
import { CadastroIrmaos } from "@/components/secretaria/CadastroIrmaos";
import { FinanceiroIrmao } from "@/components/secretaria/FinanceiroIrmao";
import { IsencaoIrmao } from "@/components/secretaria/IsencaoIrmao";
import { PermissionGate } from "@/components/PermissionGate";

const Secretaria = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold">Secretaria</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestão de membros e informações financeiras individuais</p>
      </div>

      <Tabs defaultValue="cadastro" className="space-y-4">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="cadastro" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Users className="h-4 w-4" />
            Cadastro de Irmãos
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <DollarSign className="h-4 w-4" />
            Financeiro do Irmão
          </TabsTrigger>
          <TabsTrigger value="isencoes" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <ShieldCheck className="h-4 w-4" />
            Isenções
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cadastro">
          <CadastroIrmaos />
        </TabsContent>

        <TabsContent value="financeiro">
          <FinanceiroIrmao />
        </TabsContent>

        <TabsContent value="isencoes">
          <IsencaoIrmao />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Secretaria;
