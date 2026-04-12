import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Users, Building2, Shield, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PortalExplorar() {
  const [search, setSearch] = useState("");

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["explore-profiles", search],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, full_name, avatar_url, slug, bio, masonic_status");

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,slug.ilike.%${search}%`);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="space-y-4">
        <h1 className="text-2xl font-serif font-bold">Explorar</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar irmãos, lojas ou ritos..." 
            className="pl-9 bg-white dark:bg-slate-900 border-none shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <Tabs defaultValue="pessoas" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="pessoas" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Pessoas</span>
          </TabsTrigger>
          <TabsTrigger value="lojas" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Lojas</span>
          </TabsTrigger>
          <TabsTrigger value="ritos" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Ritos</span>
          </TabsTrigger>
          <TabsTrigger value="proximidade" className="gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Perto de você</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pessoas" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profiles?.map((profile) => (
              <Card key={profile.id} className="border-none shadow-sm bg-white dark:bg-slate-900 hover:ring-1 hover:ring-primary/20 transition-all">
                <CardContent className="p-4">
                  <Link to={`/${profile.slug}`} className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback className="bg-primary/5 text-primary font-bold">
                        {profile.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{profile.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">@{profile.slug}</p>
                      <p className="text-[10px] text-primary/70 mt-1 uppercase font-semibold">{profile.masonic_status}</p>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="lojas" className="mt-6">
          <div className="text-center py-20 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Busca por lojas em breve.</p>
          </div>
        </TabsContent>

        <TabsContent value="ritos" className="mt-6">
          <div className="text-center py-20 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Busca por ritos em breve.</p>
          </div>
        </TabsContent>

        <TabsContent value="proximidade" className="mt-6">
          <div className="text-center py-20 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Busca por proximidade em breve.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
