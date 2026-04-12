import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, User, ShieldCheck, ChevronRight, LayoutDashboard } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const getDashboardPath = () => {
    if (role === "superadmin") return "/admin";
    // Check if user is an advertiser is done by redirect logic, but simplified here:
    // This is just a UI convenience
    return "/dashboard";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header/Nav */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-serif font-bold text-xl shadow-sm">
              M
            </div>
            <span className="font-serif font-bold text-xl tracking-tight hidden sm:block">
              Gestão Maçônica
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Button 
                size="sm" 
                onClick={() => navigate(getDashboardPath())}
                className="flex items-center gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Acessar Dashboard
              </Button>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate("/auth")}
                  className="hidden md:flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4 text-primary" />
                  Login de Loja
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => navigate("/portal/auth")}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Portal do Irmão
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-20 lg:py-32">
          {/* Background decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px]" />
          </div>

          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm font-medium text-muted-foreground mb-8">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Plataforma Segura para Lojas Maçônicas</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-foreground mb-6">
              A Nova Era da <br />
              <span className="text-primary">Gestão Maçônica</span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-10 leading-relaxed">
              Simplifique a administração de sua Loja, automatize processos financeiros 
              e aproxime os Irmãos com uma plataforma completa e intuitiva.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Button 
                  size="lg" 
                  onClick={() => navigate(getDashboardPath())} 
                  className="w-full sm:w-auto px-10 h-14 text-lg font-semibold gap-3 shadow-lg shadow-primary/20"
                >
                  Continuar para o Dashboard
                  <ChevronRight className="h-5 w-5" />
                </Button>
              ) : (
                <>
                  <Button 
                    size="lg" 
                    onClick={() => navigate("/auth")} 
                    className="w-full sm:w-auto px-8 h-14 text-lg font-semibold gap-2 shadow-lg shadow-primary/20"
                  >
                    Login de Loja
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={() => navigate("/portal/auth")} 
                    className="w-full sm:w-auto px-8 h-14 text-lg font-semibold gap-2 border-2"
                  >
                    Portal do Irmão
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Deliverables Section */}
        <section className="py-20 bg-muted/30">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-serif font-bold text-center mb-10 flex items-center justify-center gap-3">
              <span>📦</span> ENTREGÁVEIS
            </h2>
            <div className="bg-card p-8 rounded-2xl border shadow-sm space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-lg font-medium">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  APIs REST completas
                </div>
                <div className="flex items-center gap-3 text-lg font-medium">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  Estrutura frontend (React / Next.js)
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-lg font-bold text-primary">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  Sistema funcional com:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-8">
                  <div className="flex items-center gap-3 bg-muted/50 p-4 rounded-xl border">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>criação de perfil com slug</span>
                  </div>
                  <div className="flex items-center gap-3 bg-muted/50 p-4 rounded-xl border">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>feed</span>
                  </div>
                  <div className="flex items-center gap-3 bg-muted/50 p-4 rounded-xl border">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>stories</span>
                  </div>
                  <div className="flex items-center gap-3 bg-muted/50 p-4 rounded-xl border">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>mensagens</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-card">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground font-serif font-bold text-sm">
              M
            </div>
            <span className="font-serif font-bold text-lg tracking-tight">
              Gestão Maçônica
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Gestão Maçônica. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <button className="text-sm text-muted-foreground hover:text-primary transition-colors">Termos</button>
            <button className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacidade</button>
            <button className="text-sm text-muted-foreground hover:text-primary transition-colors">Suporte</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
