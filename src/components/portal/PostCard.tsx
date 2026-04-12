import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Bookmark, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PostCardProps {
  post: any;
  currentUserId?: string;
}

export function PostCard({ post, currentUserId }: PostCardProps) {
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(post.user_has_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);

  const { data: comments, isLoading: loadingComments } = useQuery({
    queryKey: ["post-comments", post.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_comments")
        .select(`
          id, 
          content, 
          created_at, 
          profiles(full_name, avatar_url, slug)
        `)
        .eq("post_id", post.id)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: showComments,
  });

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
      if (!isLiked) {
        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 800);
      }
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    },
    onError: () => {
      setIsLiked(post.user_has_liked);
      setLikesCount(post.likes_count);
      toast.error("Erro ao curtir post");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["social-feed"] });
    }
  });

  const handleDoubleTap = () => {
    if (!isLiked) {
      likeMutation.mutate();
    } else {
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 800);
    }
  };

  const commentMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!currentUserId || !text.trim()) return;
      const { error } = await supabase
        .from("post_comments")
        .insert({ 
          post_id: post.id, 
          user_id: currentUserId, 
          content: text.trim() 
        });
      if (error) throw error;
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["post-comments", post.id] });
      queryClient.invalidateQueries({ queryKey: ["social-feed"] });
    },
    onError: () => {
      toast.error("Erro ao enviar comentário");
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId || post.user_id !== currentUserId) {
        throw new Error("Não autorizado");
      }

      if (!window.confirm("Tem certeza que deseja deletar esta postagem?")) {
        return;
      }

      // First delete comments and likes (due to foreign keys)
      const { error: commentsError } = await supabase.from("post_comments").delete().eq("post_id", post.id);
      if (commentsError) throw commentsError;

      const { error: likesError } = await supabase.from("post_likes").delete().eq("post_id", post.id);
      if (likesError) throw likesError;

      const { error: imagesError } = await supabase.from("post_images").delete().eq("post_id", post.id);
      if (imagesError) throw imagesError;

      const { error } = await supabase.from("posts").delete().eq("id", post.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Postagem deletada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["social-feed"] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao deletar post: ${error.message}`);
    }
  });

  const initials = post.profiles?.full_name
    ?.split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="mb-6 border-none shadow-sm overflow-hidden bg-white dark:bg-slate-900 transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <Link to={`/${post.profiles?.slug}`}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Avatar className="h-9 w-9 border ring-1 ring-slate-100 dark:ring-slate-800 ring-offset-2">
                  <AvatarImage src={post.profiles?.avatar_url} />
                  <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">{initials}</AvatarFallback>
                </Avatar>
              </motion.div>
            </Link>
            <div className="flex flex-col">
              <Link to={`/${post.profiles?.slug}`} className="text-sm font-bold hover:underline leading-none mb-1">
                {post.profiles?.full_name}
              </Link>
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
              </span>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-50 dark:hover:bg-slate-800">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {currentUserId === post.user_id && (
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive gap-2 cursor-pointer"
                  onClick={() => deletePostMutation.mutate()}
                >
                  <Trash2 className="h-4 w-4" />
                  Deletar postagem
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="gap-2 cursor-pointer">
                <Share2 className="h-4 w-4" />
                Compartilhar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <div 
          className="relative aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer"
          onDoubleClick={handleDoubleTap}
        >
          {post.post_images?.[0]?.image_url && (
            <motion.img 
              src={post.post_images[0].image_url} 
              alt="Post content" 
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.5 }}
            />
          )}
          <AnimatePresence>
            {showHeartAnimation && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Heart className="h-24 w-24 fill-white text-white drop-shadow-lg" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <motion.button 
                whileTap={{ scale: 1.4 }}
                onClick={() => likeMutation.mutate()}
                className="transition-colors"
              >
                <Heart className={isLiked ? "h-6 w-6 fill-red-500 text-red-500" : "h-6 w-6 hover:text-slate-500"} />
              </motion.button>
              <motion.button 
                whileTap={{ scale: 1.2 }}
                onClick={() => setShowComments(!showComments)}
              >
                <MessageCircle className="h-6 w-6 hover:text-slate-500" />
              </motion.button>
              <motion.button whileTap={{ scale: 1.2 }}>
                <Share2 className="h-6 w-6 hover:text-slate-500" />
              </motion.button>
            </div>
            <motion.button whileTap={{ scale: 1.2 }}>
              <Bookmark className="h-6 w-6 hover:text-slate-500" />
            </motion.button>
          </div>
          
          <div className="font-bold text-sm mb-2">
            {likesCount.toLocaleString()} {likesCount === 1 ? "curtida" : "curtidas"}
          </div>
          
          <div className="text-sm">
            <Link to={`/${post.profiles?.slug}`} className="font-bold mr-2 hover:underline">
              {post.profiles?.full_name}
            </Link>
            <span className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{post.caption}</span>
          </div>

          <AnimatePresence>
            {(showComments || post.comments_count > 0) && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 border-t dark:border-slate-800 pt-3 overflow-hidden"
              >
                {!showComments && post.comments_count > 0 && (
                  <button 
                    onClick={() => setShowComments(true)}
                    className="text-xs text-muted-foreground hover:underline mb-2"
                  >
                    Ver todos os {post.comments_count} comentários
                  </button>
                )}

                {showComments && (
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {loadingComments ? (
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    ) : comments?.map((comment: any) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={comment.id} 
                        className="text-sm flex gap-2"
                      >
                        <span className="font-bold">
                          {comment.profiles?.full_name?.split(" ")[0]}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">{comment.content}</span>
                      </motion.div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 items-center">
                  <Input 
                    placeholder="Adicione um comentário..." 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="h-9 text-xs bg-slate-50 dark:bg-slate-800/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
                    onKeyDown={(e) => e.key === "Enter" && commentMutation.mutate(commentText)}
                  />
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-primary text-xs font-bold h-9 hover:bg-transparent"
                    onClick={() => commentMutation.mutate(commentText)}
                    disabled={!commentText.trim() || commentMutation.isPending}
                  >
                    Publicar
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
