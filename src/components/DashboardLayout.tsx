import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, LogOut, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, roleLabels } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, role, signOut } = useAuth();
  const [docDialog, setDocDialog] = useState<{ title: string; content: string; version: string } | null>(null);

  const openDocument = async (table: "termos_uso" | "politicas_privacidade", title: string) => {
    const { data } = await supabase
      .from(table)
      .select("versao, conteudo")
      .eq("ativo", true)
      .order("data_publicacao", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      setDocDialog({ title, content: data.conteudo, version: data.versao });
    }
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "??";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-[52px] border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-5 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
              <div className="h-4 w-px bg-border" />
              <span className="text-[13px] font-semibold text-foreground tracking-tight">Loja Estrela do Oriente nº 123</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground relative">
                <Bell className="h-[18px] w-[18px]" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-card" />
              </Button>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-2.5">
                <div className="text-right hidden sm:block">
                  <p className="text-[13px] font-medium leading-none text-foreground">{profile?.full_name ?? "..."}</p>
                  {role && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{roleLabels[role]}</p>
                  )}
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-[11px] font-semibold">{initials}</AvatarFallback>
                </Avatar>
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={signOut} title="Sair">
                <LogOut className="h-[18px] w-[18px]" />
              </Button>
            </div>
          </header>

          {/* Área central dinâmica */}
          <div className="flex-1 overflow-auto p-7">
            {children}
          </div>

          {/* Footer */}
          <footer className="h-10 border-t bg-card/60 flex items-center justify-center gap-4 px-5 shrink-0">
            <button
              onClick={() => openDocument("termos_uso", "Termos de Uso")}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <FileText className="h-3 w-3" /> Termos de Uso
            </button>
            <span className="text-muted-foreground/40 text-[10px]">|</span>
            <button
              onClick={() => openDocument("politicas_privacidade", "Política de Privacidade")}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ShieldCheck className="h-3 w-3" /> Política de Privacidade
            </button>
          </footer>

          {/* Document viewer dialog */}
          <Dialog open={!!docDialog} onOpenChange={(o) => { if (!o) setDocDialog(null); }}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh]">
              <DialogHeader>
                <DialogTitle className="font-serif">{docDialog?.title}</DialogTitle>
                <p className="text-xs text-muted-foreground">Versão {docDialog?.version}</p>
              </DialogHeader>
              <ScrollArea className="h-[500px] rounded-md border p-4">
                <div className="prose prose-sm max-w-none text-sm text-foreground whitespace-pre-wrap">
                  {docDialog?.content}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </SidebarProvider>
  );
}
