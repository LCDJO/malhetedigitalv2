import { Home, Search, PlusSquare, MessageCircle, User, Bell, Compass, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export const MalheteLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { signOut } = useAuth();

  const navItems = [
    { icon: Home, label: "Feed", path: "/portal/rede-social" },
    { icon: Compass, label: "Explorar", path: "/portal/explorar" },
    { icon: PlusSquare, label: "Criar", path: "/portal/criar" },
    { icon: MessageCircle, label: "Mensagens", path: "/portal/mensagens" },
    { icon: User, label: "Perfil", path: "/portal/perfil" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 border-r border-border p-6 bg-surface">
        <div className="mb-10 px-2">
          <h1 className="text-xl font-bold tracking-tight text-highlight">Malhete Digital</h1>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-lg transition-colors hover:bg-muted/50",
                location.pathname === item.path ? "bg-muted font-bold text-highlight" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-6 w-6", location.pathname === item.path && "text-highlight")} />
              <span className="text-base">{item.label}</span>
            </Link>
          ))}
        </nav>

        <button
          onClick={() => signOut()}
          className="flex items-center gap-4 px-4 py-3 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors mt-auto"
        >
          <LogOut className="h-6 w-6" />
          <span>Sair</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pb-20 lg:pb-0">
        <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row min-h-screen">
          <div className="flex-1 min-w-0">
            {children}
          </div>

          {/* Desktop Right Sidebar (Suggestions) */}
          <aside className="hidden xl:block w-80 p-8 space-y-8 border-l border-border h-screen sticky top-0 bg-surface">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-muted-foreground">Sugestões para você</h3>
              <button className="text-xs font-bold text-highlight hover:opacity-80">Ver tudo</button>
            </div>
            
            {/* Suggested Profiles placeholder */}
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted border border-border" />
                    <div>
                      <p className="text-sm font-bold">Irmão Exemplo {i}</p>
                      <p className="text-xs text-muted-foreground">@irmao_exemplo</p>
                    </div>
                  </div>
                  <button className="text-xs font-bold text-highlight">Seguir</button>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-border">
              <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-muted-foreground uppercase tracking-wider">
                <a href="#" className="hover:underline">Sobre</a>
                <a href="#" className="hover:underline">Ajuda</a>
                <a href="#" className="hover:underline">Imprensa</a>
                <a href="#" className="hover:underline">API</a>
                <a href="#" className="hover:underline">Privacidade</a>
                <a href="#" className="hover:underline">Termos</a>
              </div>
              <p className="mt-4 text-[11px] text-muted-foreground">© 2024 MALHETE DIGITAL</p>
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 mobile-nav-blur z-50 flex items-center justify-around px-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "p-2 rounded-full transition-colors",
              location.pathname === item.path ? "text-highlight" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-6 w-6" />
          </Link>
        ))}
      </nav>
    </div>
  );
};
