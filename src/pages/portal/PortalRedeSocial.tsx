import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePortalMemberContext } from "@/components/portal/PortalLayout";
import { PostCard } from "@/components/portal/PostCard";
import { CreatePost } from "@/components/portal/CreatePost";
import { Loader2, Users, Search, Compass, MessageCircle, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SocialExplore } from "@/components/portal/SocialExplore";
import { SocialMessages } from "@/components/portal/SocialMessages";

function PostSkeleton() {
  return (
    <Card className="mb-6 border-none shadow-sm overflow-hidden bg-white dark:bg-slate-900">
      <CardHeader className="flex flex-row items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2 w-16" />
          </div>
        </div>
      </CardHeader>
      <Skeleton className="aspect-square w-full" />
      <CardContent className="p-3">
        <div className="flex gap-4 mb-3">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-3 w-full" />
      </CardContent>
    </Card>
  );
}

export default function PortalRedeSocial() {
  const { user } = useAuth();
  const member = usePortalMemberContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "feed";

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
          post_comments(id)
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
    enabled: !!user?.id && activeTab === "feed",
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
        <header className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-foreground">Malhete Digital</h1>
          <p className="text-muted-foreground text-sm">Rede Social Maçônica</p>
        </header>

        <Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val })} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800/50 p-1 mb-6">
            <TabsTrigger value="feed" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Feed
            </TabsTrigger>
            <TabsTrigger value="explorar" className="gap-2">
              <Compass className="h-4 w-4" />
              Explorar
            </TabsTrigger>
            <TabsTrigger value="mensagens" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Mensagens
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-6 mt-0">
            <CreatePost profile={member} currentUser={user} />

            {isLoading ? (
              <div className="max-w-xl mx-auto space-y-6">
                <PostSkeleton />
                <PostSkeleton />
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
          </TabsContent>

          <TabsContent value="explorar" className="mt-0">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
            <div className="text-center py-10">
              <p className="text-muted-foreground text-sm">Em breve: Explore publicações de toda a Ordem.</p>
            </div>
          </TabsContent>

          <TabsContent value="mensagens" className="mt-0">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center py-10">
              <p className="text-muted-foreground text-sm">Em breve: Mensagens diretas entre Irmãos.</p>
            </div>
          </TabsContent>
        </Tabs>
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
