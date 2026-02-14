import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Creative {
  id: string;
  media_type: string;
  media_url: string;
  destination_url: string | null;
  title: string;
  campaign_id: string;
  advertiser_id: string;
}

interface AdSlotProps {
  /** Slug do slot (ex: "portal_dashboard_top", "login_sidebar") */
  slotSlug: string;
  /** Página atual para registro de impressão/clique */
  page: string;
  /** Aspect ratio CSS (ex: "25%", "56.25%") — paddingBottom trick */
  aspectRatio?: string;
  /** Classes extras no container */
  className?: string;
  /** Se deve auto-rodar entre múltiplos criativos */
  autoRotate?: boolean;
  /** Duração padrão de cada criativo em segundos */
  defaultDuration?: number;
}

export function AdSlot({
  slotSlug,
  page,
  aspectRatio = "25%",
  className = "",
  autoRotate = true,
  defaultDuration = 8,
}: AdSlotProps) {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch active creatives for this slot
  useEffect(() => {
    const fetchCreatives = async () => {
      // Get active campaigns that target this slot or page
      const now = new Date().toISOString();
      const { data: campaigns } = await supabase
        .from("ad_campaigns")
        .select("id, advertiser_id, target_slots, target_pages")
        .eq("status", "ativa")
        .lte("start_date", now);

      if (!campaigns || campaigns.length === 0) return;

      // Filter campaigns that target this slot or page
      const matchingCampaignIds = campaigns
        .filter((c) => {
          const slotsMatch = c.target_slots?.includes(slotSlug);
          const pagesMatch = c.target_pages?.includes(page);
          return slotsMatch || pagesMatch;
        })
        .map((c) => c.id);

      if (matchingCampaignIds.length === 0) return;

      // Get active creatives from matching campaigns
      const { data: creativesData } = await supabase
        .from("ad_creatives")
        .select("id, media_type, media_url, destination_url, title, campaign_id, advertiser_id")
        .in("campaign_id", matchingCampaignIds)
        .eq("is_active", true);

      if (creativesData && creativesData.length > 0) {
        // Shuffle for fairness
        const shuffled = creativesData.sort(() => Math.random() - 0.5);
        setCreatives(shuffled);
      }
    };

    fetchCreatives();
  }, [slotSlug, page]);

  // Track impression
  useEffect(() => {
    if (creatives.length === 0) return;
    const creative = creatives[currentIndex];
    if (!creative) return;

    supabase
      .from("ad_impressions")
      .insert({
        creative_id: creative.id,
        campaign_id: creative.campaign_id,
        advertiser_id: creative.advertiser_id,
        page,
      })
      .then(() => {});

    // Also increment counter on creative
    supabase
      .from("ad_creatives")
      .update({ impressions_count: undefined }) // we use raw SQL RPC instead
      .eq("id", creative.id);

    // Use rpc or just let the impression table be the source of truth
  }, [currentIndex, creatives, page]);

  // Auto-rotate
  useEffect(() => {
    if (!autoRotate || creatives.length <= 1) return;
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % creatives.length);
    }, defaultDuration * 1000);
    return () => clearTimeout(timer);
  }, [currentIndex, creatives, autoRotate, defaultDuration]);

  // Track click
  const handleClick = useCallback(
    (creative: Creative) => {
      supabase
        .from("ad_clicks")
        .insert({
          creative_id: creative.id,
          campaign_id: creative.campaign_id,
          advertiser_id: creative.advertiser_id,
          page,
        })
        .then(() => {});

      if (creative.destination_url) {
        window.open(creative.destination_url, "_blank", "noopener,noreferrer");
      }
    },
    [page]
  );

  if (creatives.length === 0) return null;

  const creative = creatives[currentIndex];

  return (
    <div className={`rounded-xl overflow-hidden border border-border/50 bg-muted/20 relative group ${className}`}>
      <div className="relative w-full" style={{ paddingBottom: aspectRatio }}>
        {creative.media_type === "video" ? (
          <video
            key={creative.id}
            src={creative.media_url}
            className="absolute inset-0 w-full h-full object-cover cursor-pointer"
            muted
            autoPlay
            loop
            playsInline
            onClick={() => handleClick(creative)}
          />
        ) : (
          <img
            key={creative.id}
            src={creative.media_url}
            alt={creative.title}
            className="absolute inset-0 w-full h-full object-cover cursor-pointer transition-opacity duration-500"
            onClick={() => handleClick(creative)}
          />
        )}

        {/* Sponsored label */}
        <div className="absolute top-2 right-2 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          Patrocinado
        </div>
      </div>

      {/* Dots indicator */}
      {creatives.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {creatives.map((_, i) => (
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
