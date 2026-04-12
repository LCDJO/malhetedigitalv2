import { NavLink } from "react-router-dom";
import { Home, Search, PlusSquare, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function PortalBottomNav() {
  const navItems = [
    { to: "/portal/rede-social", icon: Home, label: "Feed" },
    { to: "/portal/explorar", icon: Search, label: "Explorar" },
    { to: "/portal/criar-post", icon: PlusSquare, label: "Criar" },
    { to: "/portal/mensagens", icon: MessageSquare, label: "Mensagens" },
    { to: "/portal/perfil", icon: User, label: "Perfil" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[hsl(220_25%_7%)] border-t border-[hsl(42_40%_22%/0.3)] px-4 flex items-center justify-around z-50">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 text-[10px] transition-colors",
              isActive ? "text-[hsl(42_60%_68%)]" : "text-[hsl(220_10%_50%)]"
            )
          }
        >
          <item.icon className="h-5 w-5" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
