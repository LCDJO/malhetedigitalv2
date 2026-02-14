import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { profile, signOut } = useAuth();

  const initials = profile?.full_name
    ? profile.full_name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "??";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-[52px] border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-5 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
              <div className="h-4 w-px bg-border" />
              <Badge variant="outline" className="text-[11px] border-accent text-accent font-semibold">
                SuperAdmin
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div className="text-right hidden sm:block">
                  <p className="text-[13px] font-medium leading-none text-foreground">{profile?.full_name ?? "..."}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">SuperAdmin</p>
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-accent text-accent-foreground text-[11px] font-semibold">{initials}</AvatarFallback>
                </Avatar>
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={signOut} title="Sair">
                <LogOut className="h-[18px] w-[18px]" />
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-7">
            {children}
          </div>

          <footer className="h-10 border-t bg-card/60 flex items-center justify-center px-5 shrink-0">
            <span className="text-[11px] text-muted-foreground">Malhete Digital — Painel SuperAdmin</span>
          </footer>
        </main>
      </div>
    </SidebarProvider>
  );
}
