import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PostCardProps {
  post: any;
  currentUserId?: string;
}

export const PostCard = ({ post, currentUserId }: PostCardProps) => {
  const [isLiked, setIsLiked] = useState(post.user_has_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleDoubleTap = () => {
    if (!isLiked) {
      handleLike();
    }
    setShowHeartAnimation(true);
    setTimeout(() => setShowHeartAnimation(false), 800);
  };

  const profile = post.profiles;
  const image = post.post_images?.[0]?.image_url;

  return (
    <div className="bg-surface border-y md:border md:rounded-xl border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 md:p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 md:h-10 md:w-10 border-2 border-highlight p-[2px] bg-background">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-muted text-[10px] font-bold">
              {profile?.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-none">{profile?.full_name}</span>
            <span className="text-[12px] text-muted-foreground leading-tight">@{profile?.slug}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <div 
        className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden cursor-pointer select-none"
        onDoubleClick={handleDoubleTap}
      >
        {image ? (
          <img 
            src={image} 
            alt={post.caption} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="text-muted-foreground text-sm italic">Sem imagem</div>
        )}
        
        {showHeartAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="h-24 w-24 text-white fill-white animate-heart-beat drop-shadow-2xl" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 md:p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLike}
              className={cn("transition-transform active:scale-125", isLiked ? "text-red-500" : "text-foreground hover:text-muted-foreground")}
            >
              <Heart className={cn("h-7 w-7", isLiked && "fill-current")} />
            </button>
            <button className="text-foreground hover:text-muted-foreground">
              <MessageCircle className="h-7 w-7" />
            </button>
            <button className="text-foreground hover:text-muted-foreground">
              <Send className="h-7 w-7" />
            </button>
          </div>
          <button className="text-foreground hover:text-muted-foreground">
            <Bookmark className="h-7 w-7" />
          </button>
        </div>

        {/* Likes */}
        <div className="font-bold text-sm">
          {likesCount.toLocaleString()} curtidas
        </div>

        {/* Caption */}
        <div className="text-sm">
          <span className="font-bold mr-2">@{profile?.slug}</span>
          {post.caption}
        </div>

        {/* Comments Preview */}
        {post.comments_count > 0 && (
          <button className="text-sm text-muted-foreground block">
            Ver todos os {post.comments_count} comentários
          </button>
        )}

        {/* Time */}
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
        </div>
      </div>
    </div>
  );
};
