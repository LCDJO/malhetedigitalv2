import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BannerItem {
  id: string;
  tipo: "imagem" | "video";
  media_url: string;
  duracao_segundos: number;
}

export function PortalBannerCarousel() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    supabase
      .from("login_banners")
      .select("id, tipo, media_url, duracao_segundos, pagina, data_fim, grupo")
      .eq("ativo", true)
      .eq("grupo", "portal_dashboard")
      .lte("data_inicio", new Date().toISOString())
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          const now = new Date();
          const active = (data as any[]).filter(
            (b) =>
              (!b.data_fim || new Date(b.data_fim) > now) &&
              (b.pagina === "todos" || b.pagina?.includes("portal"))
          );
          setBanners(active);
        }
      });
  }, []);

  // Track impressions
  useEffect(() => {
    if (banners.length === 0) return;
    const banner = banners[currentIndex];
    if (!banner) return;

    supabase
      .from("banner_impressions")
      .insert({ banner_id: banner.id, pagina: "portal_dashboard" })
      .then(() => {});
  }, [currentIndex, banners]);

  // Auto-rotate
  useEffect(() => {
    if (banners.length <= 1) return;
    const current = banners[currentIndex];
    const duration = (current?.duracao_segundos ?? 8) * 1000;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [currentIndex, banners]);

  if (banners.length === 0) return null;

  const banner = banners[currentIndex];

  return (
    <div className="rounded-xl overflow-hidden border border-border/50 bg-muted/20 relative">
      <div className="relative w-full" style={{ paddingBottom: "25%" }}>
        {banner.tipo === "imagem" ? (
          <img
            key={banner.id}
            src={banner.media_url}
            alt="Banner"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          />
        ) : (
          <video
            key={banner.id}
            src={banner.media_url}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            autoPlay
            loop
            playsInline
          />
        )}
      </div>

      {/* Dots indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex ? "w-4 bg-white/90" : "w-1.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
