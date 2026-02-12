import { CadastroIrmaos } from "@/components/secretaria/CadastroIrmaos";

const Secretaria = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold">Secretaria</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestão de membros e cadastro</p>
      </div>

      <CadastroIrmaos />
    </div>
  );
};

export default Secretaria;
