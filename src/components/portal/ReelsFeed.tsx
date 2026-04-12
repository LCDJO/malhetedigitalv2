import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Heart, MessageCircle, Share2, MoreVertical, Music2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { motion, AnimatePresence } from "framer-motion";

function ReelCard({ reel, currentUserId }: { reel: any; currentUserId: string | undefined }) {
  const [isLiked, setIsLiked] = useState(reel.user_has_liked);
  const [likesCount, setLikesCount] = useState(reel.likes_count || 0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref, inView } = useInView({ threshold: 0.8 });

  useEffect(() => {
    if (inView) {
      videoRef.current?.play().catch(() => {});
    } else {
      videoRef.current?.pause();
    }
  }, [inView]);

  const toggleLike = async () => {
    if (!currentUserId) return;
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

    if (isLiked) {
      await supabase.from("post_likes").delete().eq("post_id", reel.id).eq("user_id", currentUserId);
    } else {
      await supabase.from("post_likes").insert({ post_id: reel.id, user_id: currentUserId });
    }
  };

  return (
    <div ref={ref} className="relative h-[calc(100vh-160px)] w-full max-w-[400px] mx-auto bg-black rounded-3xl overflow-hidden shadow-2xl group mb-8 snap-start">
      <video
        ref={videoRef}
        src={reel.post_images?.[0]?.image_url}
        className="h-full w-full object-cover"
        loop
        muted
        playsInline
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

      {/* Interactions Overlay */}
      <div className="absolute right-4 bottom-20 flex flex-col items-center gap-6 z-10">
        <div className="flex flex-col items-center gap-1">
          <button onClick={toggleLike} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <Heart className={`h-8 w-8 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </button>
          <span className="text-white text-xs font-bold">{likesCount}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <MessageCircle className="h-8 w-8 text-white" />
          </button>
          <span className="text-white text-xs font-bold">{reel.comments_count}</span>
        </div>

        <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <Share2 className="h-7 w-7 text-white" />
        </button>

        <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <MoreVertical className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* Info Overlay */}
      <div className="absolute left-4 bottom-6 right-16 z-10">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10 border-2 border-white/20">
            <AvatarImage src={reel.profiles?.avatar_url} />
            <AvatarFallback>{reel.profiles?.full_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-bold text-sm">@{reel.profiles?.slug}</p>
            <p className="text-white/80 text-[10px]">Irmão de Loja</p>
          </div>
          <Button variant="outline" size="sm" className="h-7 px-4 rounded-full bg-white/10 border-white/20 text-white text-xs hover:bg-white hover:text-black transition-all">
            Seguir
          </Button>
        </div>
        
        <p className="text-white text-sm line-clamp-2 mb-3">{reel.caption}</p>
        
        <div className="flex items-center gap-2 overflow-hidden">
          <Music2 className="h-3 w-3 text-white shrink-0 animate-pulse" />
          <div className="flex items-center whitespace-nowrap animate-marquee">
            <span className="text-white text-[10px] font-medium mr-4">Som original - {reel.profiles?.full_name}</span>
            <span className="text-white text-[10px] font-medium">Som original - {reel.profiles?.full_name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReelsFeed() {
  const { user } = useAuth();
  const { ref, inView } = useInView();

  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading 
  } = useInfiniteQuery({
    queryKey: ["reels-feed", user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          id, 
          caption, 
          created_at,
          user_id,
          post_type,
          profiles(full_name, avatar_url, slug),
          post_images(image_url, order_index),
          post_likes(user_id),
          post_comments(id)
        `)
        .eq("post_type", "reel")
        .order("created_at", { ascending: false })
        .range(pageParam, pageParam + 4);

      if (error) throw error;

      return data.map(reel => ({
        ...reel,
        likes_count: reel.post_likes?.length || 0,
        comments_count: reel.post_comments?.length || 0,
        user_has_liked: reel.post_likes?.some((like: any) => like.user_id === user?.id)
      }));
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 5 ? allPages.length * 5 : undefined;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const reels = data?.pages.flat() || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground animate-pulse">Carregando Curtas...</p>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="h-10 w-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold mb-2">Nenhum Reel ainda</h3>
        <p className="text-muted-foreground max-w-xs mx-auto">Seja o primeiro a publicar um Reel para seus irmãos.</p>
      </div>
    );
  }

  return (
    <div className="h-full snap-y snap-mandatory overflow-y-auto pr-0 custom-scrollbar pb-24">
      {reels.map((reel) => (
        <ReelCard key={reel.id} reel={reel} currentUserId={user?.id} />
      ))}
      
      <div ref={ref} className="h-20 flex items-center justify-center">
        {isFetchingNextPage && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
      </div>
    </div>
  );
}

function Sparkles(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
