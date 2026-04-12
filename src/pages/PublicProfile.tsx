import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User, MapPin, Phone, Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicProfile() {
  const { slug } = useParams();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["public-profile", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, address, phone, birth_date")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando perfil...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-4xl font-serif font-bold text-primary mb-2">404</h1>
        <p className="text-xl text-muted-foreground mb-6">Perfil não encontrado</p>
        <Button asChild variant="outline">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Início
          </Link>
        </Button>
      </div>
    );
  }

  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .filter(Boolean)
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "??";

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Card className="border-t-4 border-t-primary shadow-lg overflow-hidden">
          <CardHeader className="bg-slate-900 text-white pb-20 pt-12 relative">
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
              <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                {profile.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                ) : null}
                <AvatarFallback className="bg-primary text-white text-3xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-serif font-semibold tracking-tight text-slate-100">
                Malhete Digital
              </h2>
              <p className="text-slate-400 text-sm italic">Rede Social Maçônica</p>
            </div>
          </CardHeader>
          
          <CardContent className="pt-20 pb-12 text-center">
            <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">
              {profile.full_name}
            </h1>
            <p className="text-muted-foreground mb-8">@{slug}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-md mx-auto">
              {profile.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Localização
                    </p>
                    <p className="text-sm text-slate-700">{profile.address}</p>
                  </div>
                </div>
              )}

              {profile.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Contato
                    </p>
                    <p className="text-sm text-slate-700">{profile.phone}</p>
                  </div>
                </div>
              )}

              {profile.birth_date && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Aniversário
                    </p>
                    <p className="text-sm text-slate-700">
                      {new Date(profile.birth_date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </p>
                  <p className="text-sm text-slate-700">Irmão Ativo</p>
                </div>
              </div>
            </div>

            <div className="mt-12 flex justify-center gap-4">
              <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                <Link to="/auth">Entrar na Rede</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <p className="mt-8 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Malhete Digital. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
