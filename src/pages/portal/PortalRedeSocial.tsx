import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePortalMemberContext } from "@/components/portal/PortalLayout";
import { PostCard } from "@/components/portal/PostCard";
import { CreatePost } from "@/components/portal/CreatePost";
import { Loader2, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";

export default function PortalRedeSocial() {
  const { user } = useAuth();
  const member = usePortalMemberContext();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["social-feed", user?.id],
    queryFn: async () => {
      // Get IDs of people I follow
      const { data: following } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user?.id);

      const followingIds = following?.map(f => f.following_id) || [];
      const authorIds = [user?.id, ...followingIds].filter(Boolean);

      // Fetch posts from me and people I follow
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
        .in("user_id", authorIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data to include counts and user interaction status
      return data.map(post => ({
        ...post,
        likes_count: post.post_likes?.length || 0,
        comments_count: post.post_comments?.length || 0,
        user_has_liked: post.post_likes?.some((like: any) => like.user_id === user?.id)
      }));
    },
    enabled: !!user?.id,
  });

  const { data: suggestedProfiles } = useQuery({
    queryKey: ["suggested-profiles", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, slug")
        .neq("id", user?.id)
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
      {/* Left / Center: Feed */}
      <div className="flex-1 space-y-6">
        <header className="mb-8">
          <h1 className="text-2xl font-serif font-bold text-foreground">Malhete Digital</h1>
          <p className="text-muted-foreground text-sm">Rede Social Maçônica</p>
        </header>

        <CreatePost profile={member} currentUser={user} />

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="max-w-xl mx-auto">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={user?.id} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-dashed">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold">Seu feed está vazio</h3>
            <p className="text-muted-foreground">Siga outros irmãos para ver suas publicações aqui.</p>
          </div>
        )}
      </div>

      {/* Right Sidebar: Suggestions & Search */}
      <aside className="w-full lg:w-80 space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar irmãos..." className="pl-9 bg-white dark:bg-slate-900 border-none shadow-sm" />
        </div>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Sugestões para você
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {suggestedProfiles?.map((profile) => (
              <div key={profile.id} className="flex items-center justify-between gap-3">
                <Link to={`/${profile.slug}`} className="flex items-center gap-2 flex-1 min-w-0">
                  <Avatar className="h-8 w-8 border">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                      {profile.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{profile.full_name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">@{profile.slug}</p>
                  </div>
                </Link>
                <Button variant="ghost" size="sm" className="text-primary text-xs font-bold hover:bg-primary/5 px-2 h-7" asChild>
                  <Link to={`/${profile.slug}`}>Ver</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="px-4 text-[10px] text-muted-foreground flex flex-wrap gap-x-2 gap-y-1">
          <a href="#" className="hover:underline">Sobre</a>
          <a href="#" className="hover:underline">Ajuda</a>
          <a href="#" className="hover:underline">Privacidade</a>
          <a href="#" className="hover:underline">Termos</a>
          <span className="mt-2 block w-full text-slate-300">© 2024 Malhete Digital</span>
        </div>
      </aside>
    </div>
  );
}
