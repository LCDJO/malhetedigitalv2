import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Eye, EyeOff } from "lucide-react";

export default function AdminAuth() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [banners, setBanners] = useState<{ tipo: string; media_url: string; duracao_segundos: number }[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [bannerFading, setBannerFading] = useState(false);

  // Fetch banners
  useEffect(() => {
    supabase
      .from("login_banners")
      .select("tipo, media_url, duracao_segundos, pagina")
      .eq("ativo", true)
      .lte("data_inicio", new Date().toISOString())
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          const now = new Date();
          const active = (data as any[]).filter((b) =>
            (!b.data_fim || new Date(b.data_fim) > now) &&
            (b.pagina === "admin" || b.pagina === "todos")
          );
          setBanners(active);
        }
      });
  }, []);

  // Rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const current = banners[currentBannerIndex];
    const duration = (current?.duracao_segundos || 8) * 1000;
    const timer = setTimeout(() => {
      setBannerFading(true);
      setTimeout(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
        setBannerFading(false);
      }, 500);
    }, duration);
    return () => clearTimeout(timer);
  }, [banners, currentBannerIndex]);

  useEffect(() => {
    if (authLoading || !user) return;
    if (role === "superadmin") {
      navigate("/admin", { replace: true });
    }
  }, [user, role, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(
        error.message === "Invalid login credentials"
          ? "Email ou senha incorretos."
          : error.message
      );
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-accent-foreground font-serif font-bold text-2xl shadow-lg">
              S
            </div>
            <h1 className="text-2xl font-serif font-bold tracking-tight">SuperAdmin</h1>
            <p className="text-sm text-muted-foreground">Painel de Administração da Plataforma</p>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-semibold text-sm">Acesso Restrito</p>
                  <p className="text-xs text-muted-foreground">Apenas SuperAdmins autorizados</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@plataforma.com"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="admin-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="admin-password"
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPw(!showPw)}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar como SuperAdmin"}
                </Button>
                <button
                  type="button"
                  onClick={() => navigate("/auth")}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Voltar ao login principal
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 p-4">
        <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-accent/5 overflow-hidden">
          {banners.length > 0 ? (
            <>
              {banners.map((b, i) => (
                <div
                  key={i}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    i === currentBannerIndex && !bannerFading ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {b.tipo === "video" ? (
                    <video src={b.media_url} autoPlay loop muted playsInline className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <img src={b.media_url} alt="Banner" className="w-full h-full object-cover rounded-2xl" />
                  )}
                </div>
              ))}
              {banners.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setBannerFading(true); setTimeout(() => { setCurrentBannerIndex(i); setBannerFading(false); }, 300); }}
                      className={`rounded-full transition-all duration-300 ${
                        i === currentBannerIndex ? "w-6 h-2 bg-primary-foreground" : "w-2 h-2 bg-primary-foreground/40"
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-accent/5 to-primary/10 rounded-2xl" />
              <div className="relative z-10 text-center space-y-6 p-12 max-w-lg">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/15 text-accent font-serif font-bold text-4xl">
                  S
                </div>
                <h2 className="text-3xl font-serif font-bold text-foreground/90">Painel SuperAdmin</h2>
                <p className="text-muted-foreground text-base leading-relaxed">
                  Gerencie todas as Lojas, planos, usuários e configurações globais da plataforma Malhete Digital.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
