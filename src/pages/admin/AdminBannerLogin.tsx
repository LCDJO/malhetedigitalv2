import { TabBannerLogin } from "@/components/configuracoes/TabBannerLogin";

export default function AdminBannerLogin() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Banner de Login</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie imagens e vídeos exibidos na tela de login da plataforma.
        </p>
      </div>
      <TabBannerLogin />
    </div>
  );
}
