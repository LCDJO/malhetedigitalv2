import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { usePortalMemberContext } from "@/components/portal/PortalLayout";
import { LucideIcon } from "lucide-react";


interface PostCardProps {
  post: any;
  currentUserId?: string;
}

export function PostCard({ post, currentUserId }: PostCardProps) {
  const queryClient = useQueryClient();
  const member = usePortalMemberContext();
  const [isLiked, setIsLiked] = useState(post.user_has_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) return;
      if (isLiked) {
        await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", currentUserId);
      } else {
        await supabase.from("post_likes").insert({ post_id: post.id, user_id: currentUserId });
      }
    },
    onMutate: () => {
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    },
    onError: () => {
      setIsLiked(post.user_has_liked);
      setLikesCount(post.likes_count);
      toast.error("Erro ao curtir post");
    },
  });

  const renderCaption = (caption: string) => {
    if (!caption) return null;
    const parts = caption.split(/(\s+)/);
    return parts.map((part, index) => {
      if (part.startsWith("#")) {
        const tag = part.slice(1);
        return (
          <Link 
            key={index} 
            to={`/portal/tag/${tag}`} 
            className="text-primary hover:underline font-medium"
          >
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  const initials = post.profiles?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);


  return (
    <Card className="mb-6 border-none shadow-sm overflow-hidden bg-white dark:bg-slate-900">
      <CardHeader className="flex flex-row items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <Link to={`/${post.profiles?.slug}`}>
            <Avatar className="h-9 w-9 border">
              <AvatarImage src={post.profiles?.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex flex-col">
            <Link to={`/${post.profiles?.slug}`} className="text-sm font-bold hover:underline">
              {post.profiles?.full_name}
            </Link>
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>

      <div className="relative aspect-square bg-slate-100 dark:bg-slate-800">
        {post.post_images?.[0]?.image_url && (
          <img 
            src={post.post_images[0].image_url} 
            alt="Post content" 
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <CardContent className="p-3">
        <div className="flex items-center gap-4 mb-3">
          <button 
            onClick={() => likeMutation.mutate()}
            className="transition-transform active:scale-125"
          >
            <Heart className={isLiked ? "h-6 w-6 fill-red-500 text-red-500" : "h-6 w-6"} />
          </button>
          <button>
            <MessageCircle className="h-6 w-6" />
          </button>
          <button>
            <Share2 className="h-6 w-6" />
          </button>
        </div>
        <div className="font-bold text-sm mb-2">
          {likesCount} {likesCount === 1 ? "curtida" : "curtidas"}
        </div>
        <div className="text-sm">
          <Link to={`/${post.profiles?.slug}`} className="font-bold mr-2 hover:underline">
            {post.profiles?.full_name}
          </Link>
          <span className="text-slate-700 dark:text-slate-300">
            {renderCaption(post.caption)}
          </span>

        </div>
      </CardContent>

      {post.comments_count > 0 && (
        <div className="px-3 pb-3">
          <button className="text-sm text-muted-foreground hover:text-slate-600">
            Ver todos os {post.comments_count} comentários
          </button>
        </div>
      )}
    </Card>
  );
}
