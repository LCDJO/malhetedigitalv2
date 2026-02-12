import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { User, Users, Receipt, ChevronsUpDown, Check, Loader2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { LancamentoIndividual } from "@/components/tesouraria/LancamentoIndividual";
import { LancamentoLote } from "@/components/tesouraria/LancamentoLote";
import { TaxasMaconicas } from "@/components/tesouraria/TaxasMaconicas";

interface MemberOption {
  id: string;
  full_name: string;
  cim: string;
  degree: string;
}

const Tesouraria = () => {
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [comboOpen, setComboOpen] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    const { data } = await supabase
      .from("members")
      .select("id, full_name, cim, degree")
      .eq("status", "ativo")
      .order("full_name");
    if (data) setMembers(data);
    setLoadingMembers(false);
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold">Tesouraria</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestão financeira e lançamentos da Loja</p>
      </div>

      {/* Busca obrigatória de obreiro */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-1.5 max-w-md">
            <label className="text-sm font-medium">Selecionar Obreiro *</label>
            {loadingMembers ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando obreiros...
              </div>
            ) : (
              <Popover open={comboOpen} onOpenChange={setComboOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={comboOpen} className="w-full justify-between font-normal">
                    {selectedMember
                      ? `${selectedMember.full_name}${selectedMember.cim ? ` — CIM ${selectedMember.cim}` : ""}`
                      : "Buscar obreiro por nome ou CIM..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar por nome ou CIM..." />
                    <CommandList>
                      <CommandEmpty>Nenhum obreiro encontrado.</CommandEmpty>
                      <CommandGroup>
                        {members.map((m) => (
                          <CommandItem
                            key={m.id}
                            value={`${m.full_name} ${m.cim}`}
                            onSelect={() => { setSelectedMemberId(m.id); setComboOpen(false); }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", selectedMemberId === m.id ? "opacity-100" : "opacity-0")} />
                            <div className="flex items-center gap-2 flex-1">
                              <span>{m.full_name}</span>
                              {m.cim && <span className="text-xs text-muted-foreground ml-auto">CIM {m.cim}</span>}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estado vazio */}
      {!selectedMemberId && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">Nenhum obreiro selecionado</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Selecione um obreiro para visualizar o demonstrativo financeiro.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conteúdo financeiro — só aparece com obreiro selecionado */}
      {selectedMemberId && (
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
      )}
    </div>
  );
};

export default Tesouraria;
