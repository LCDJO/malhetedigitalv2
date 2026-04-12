import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePortalMemberContext } from "@/components/portal/PortalLayout";
import { PostCard } from "@/components/portal/PostCard";
import { CreatePost } from "@/components/portal/CreatePost";
import { Loader2, Users, Search, Compass, MessageCircle, LayoutGrid, Heart, TrendingUp, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SocialExplore } from "@/components/portal/SocialExplore";
import { SocialMessages } from "@/components/portal/SocialMessages";
import { SocialStories } from "@/components/portal/SocialStories";
import { motion, AnimatePresence } from "framer-motion";
import { useSocialStore } from "@/hooks/useSocialStore";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

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
  const { setFeed } = useSocialStore();
  const { ref, inView } = useInView();

  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading 
  } = useInfiniteQuery({
    queryKey: ["social-feed", user?.id],
    queryFn: async ({ pageParam = 0 }) => {
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
        .order("created_at", { ascending: false })
        .range(pageParam, pageParam + 4);

      if (error) throw error;

      return data.map(post => ({
        ...post,
        likes_count: post.post_likes?.length || 0,
        comments_count: post.post_comments?.length || 0,
        user_has_liked: post.post_likes?.some((like: any) => like.user_id === user?.id)
      }));
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 5 ? allPages.length * 5 : undefined;
    },
    enabled: !!user?.id && activeTab === "feed",
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const posts = data?.pages.flat() || [];

  useEffect(() => {
    if (posts.length > 0) {
      setFeed(posts);
    }
  }, [posts, setFeed]);

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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 pb-10"
    >
      {/* Left / Center: Feed */}
      <div className="flex-1 space-y-6">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <motion.h1 
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              className="text-3xl font-serif font-bold text-foreground tracking-tight flex items-center gap-2"
            >
              Malhete Digital
              <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500" />
            </motion.h1>
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Rede Social Maçônica Ativa
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-full gap-2 text-xs font-bold bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <TrendingUp className="h-3 w-3" />
              Em alta
            </Button>
            <Button variant="outline" size="sm" className="rounded-full gap-2 text-xs font-bold bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <Heart className="h-3 w-3" />
              Atividade
            </Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val })} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100/80 dark:bg-slate-800/50 p-1 mb-8 rounded-2xl backdrop-blur-md sticky top-0 z-10 shadow-sm border border-white/20">
            <TabsTrigger value="feed" className="gap-2 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm transition-all py-2.5">
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline font-bold">Feed</span>
            </TabsTrigger>
            <TabsTrigger value="explorar" className="gap-2 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm transition-all py-2.5">
              <Compass className="h-4 w-4" />
              <span className="hidden sm:inline font-bold">Explorar</span>
            </TabsTrigger>
            <TabsTrigger value="mensagens" className="gap-2 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm transition-all py-2.5">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline font-bold">Mensagens</span>
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="feed" className="space-y-6 mt-0">
                <SocialStories />
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
                    
                    {/* Infinite Scroll Trigger */}
                    <div ref={ref} className="py-8 flex justify-center">
                      {isFetchingNextPage ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      ) : hasNextPage ? (
                        <span className="text-xs text-muted-foreground italic">Carregando mais...</span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Você chegou ao fim do feed</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                    <div className="bg-slate-50 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Users className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Seu feed está vazio</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto">Siga outros irmãos da sua loja para ver suas publicações e novidades.</p>
                    <Button 
                      variant="link" 
                      className="mt-4 font-bold"
                      onClick={() => setSearchParams({ tab: "explorar" })}
                    >
                      Explorar a rede
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="explorar" className="mt-0 focus-visible:outline-none">
                <SocialExplore />
              </TabsContent>

              <TabsContent value="mensagens" className="mt-0 focus-visible:outline-none">
                <SocialMessages />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>

      {/* Right Sidebar: Suggestions & Search */}
      <aside className="w-full lg:w-80 space-y-8">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input 
            placeholder="Buscar irmãos..." 
            className="pl-9 bg-white dark:bg-slate-900 border-none shadow-sm h-12 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 transition-all" 
          />
        </div>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
          <CardHeader className="pb-4 pt-8 px-8">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Sugestões para você
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pb-8 px-8">
            {suggestedProfiles?.map((profile) => (
              <motion.div 
                whileHover={{ x: 4 }}
                key={profile.id} 
                className="flex items-center justify-between gap-3"
              >
                <Link to={`/${profile.slug}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="h-11 w-11 border-2 border-slate-50 dark:border-slate-800 shadow-sm">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                      {profile.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate leading-none mb-1.5 hover:underline">{profile.full_name}</p>
                    <p className="text-[10px] text-muted-foreground truncate font-medium">@{profile.slug}</p>
                  </div>
                </Link>
                <Button variant="secondary" size="sm" className="text-xs font-bold h-8 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary transition-all" asChild>
                  <Link to={`/${profile.slug}`}>Seguir</Link>
                </Button>
              </motion.div>
            ))}
            <Button variant="ghost" className="w-full text-xs font-bold text-primary hover:bg-primary/5 rounded-xl h-10" asChild>
              <Link to="?tab=explorar">Ver todos os irmãos</Link>
            </Button>
          </CardContent>
        </Card>

        <div className="px-6 text-[10px] text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 opacity-50 hover:opacity-100 transition-opacity font-medium">
          <a href="#" className="hover:underline">Sobre</a>
          <a href="#" className="hover:underline">Ajuda</a>
          <a href="#" className="hover:underline">Privacidade</a>
          <a href="#" className="hover:underline">Termos</a>
          <a href="#" className="hover:underline">Configurações</a>
          <span className="mt-4 block w-full text-slate-300 dark:text-slate-700 tracking-widest uppercase">© 2024 MALHETE DIGITAL</span>
        </div>
      </aside>
    </motion.div>
  );
}
