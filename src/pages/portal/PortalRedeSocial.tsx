import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePortalMemberContext } from "@/components/portal/PortalLayout";
import { PostCard } from "@/components/social/PostCard";
import { CreatePost } from "@/components/social/CreatePost";
import { Stories } from "@/components/social/Stories";
import { Loader2, Users } from "lucide-react";
import { MalheteLayout } from "@/components/social/MalheteLayout";

export default function PortalRedeSocial() {
  const { user } = useAuth();
  const member = usePortalMemberContext();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["social-feed", user?.id],
    queryFn: async () => {
      const { data: following } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user?.id);

      const followingIds = following?.map(f => f.following_id) || [];
      const authorIds = [user?.id, ...followingIds].filter(Boolean);

      const { data, error } = await supabase
        .from("posts")
        .select(`
          id, 
          caption, 
          created_at,
          user_id,
          profiles(full_name, avatar_url, slug),
          post_images(image_url, order_index),
          post_likes(user_id),
          post_comments(id, content, created_at, profiles(full_name, slug))
        `)
        .in("user_id", authorIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map(post => ({
        ...post,
        likes_count: post.post_likes?.length || 0,
        comments_count: post.post_comments?.length || 0,
        user_has_liked: post.post_likes?.some((like: any) => like.user_id === user?.id)
      }));
    },
    enabled: !!user?.id,
  });

  return (
    <MalheteLayout>
      <div className="w-full max-w-[600px] mx-auto pt-4 md:pt-8 pb-10">
        <Stories />
        
        <div className="space-y-6 px-0 md:px-4">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-highlight" />
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} currentUserId={user?.id} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-surface rounded-xl border border-border mx-4">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-bold">Seu feed está vazio</h3>
              <p className="text-muted-foreground text-sm">Siga outros irmãos para ver suas publicações aqui.</p>
            </div>
          )}
        </div>
      </div>
    </MalheteLayout>
  );
}
