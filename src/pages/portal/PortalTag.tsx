import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PostCard } from "@/components/portal/PostCard";
import { Hash, Loader2 } from "lucide-react";

export default function PortalTag() {
  const { hashtag } = useParams<{ hashtag: string }>();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["hashtag-posts", hashtag],
    queryFn: async () => {
      // First find the hashtag ID
      const { data: tagData } = await supabase
        .from("hashtags")
        .select("id")
        .eq("name", hashtag?.toLowerCase())
        .single();

      if (!tagData) return [];

      // Then get post IDs for this hashtag
      const { data: postLinks } = await supabase
        .from("post_hashtags")
        .select("post_id")
        .eq("hashtag_id", tagData.id);

      const postIds = postLinks?.map(pl => pl.post_id) || [];
      if (postIds.length === 0) return [];

      // Finally fetch the posts
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
          post_comments(id)
        `)
        .in("id", postIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!hashtag,
  });

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <header className="flex items-center gap-6 py-8 border-b">
        <div className="h-24 w-24 rounded-full border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center bg-white dark:bg-slate-900 shadow-sm">
          <Hash className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">#{hashtag}</h1>
          <p className="text-muted-foreground mt-1">
            {posts?.length || 0} {posts?.length === 1 ? "publicação" : "publicações"}
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <p>Nenhuma publicação encontrada com esta hashtag.</p>
        </div>
      )}
    </div>
  );
}
