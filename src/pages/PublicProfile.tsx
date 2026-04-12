import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, MessageSquare, UserPlus, UserCheck, Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function PublicProfile() {
  const { slug } = useParams();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["public-profile", slug],
    queryFn: async () => {
      if (!slug) return null;
      
      const cleanSlug = slug.startsWith('@') ? slug.substring(1) : slug;
      
      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, bio, slug")
        .eq("slug", cleanSlug)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) return null;

      // Get tenant (Lodge) info
      const { data: tenantUsers } = await supabase
        .from("tenant_users")
        .select("tenant_id, tenants(name, potencia, rito)")
        .eq("user_id", profileData.id)
        .maybeSingle();

      // Get counts
      const { count: followersCount } = await supabase
        .from("follows")
        .select("*", { count: 'exact', head: true })
        .eq("following_id", profileData.id);

      const { count: followingCount } = await supabase
        .from("follows")
        .select("*", { count: 'exact', head: true })
        .eq("follower_id", profileData.id);

      const { count: postsCount } = await supabase
        .from("posts")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", profileData.id);

      // Check if following
      let isFollowing = false;
      if (currentUser) {
        const { data: followData } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", currentUser.id)
          .eq("following_id", profileData.id)
          .maybeSingle();
        isFollowing = !!followData;
      }

      return {
        ...profileData,
        lodge: tenantUsers?.tenants,
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
        postsCount: postsCount || 0,
        isFollowing
      };
    },
    enabled: !!slug,
  });

  const { data: commonFollowers } = useQuery({
    queryKey: ["common-followers", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data: followData, error: followError } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", profile.id)
        .limit(10);

      if (followError) throw followError;
      if (!followData || followData.length === 0) return [];

      const followerIds = followData.map((f: any) => f.follower_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, slug")
        .in("id", followerIds);

      if (profilesError) throw profilesError;
      
      // Randomize results to get different photos on refresh
      const shuffled = (profilesData || []).sort(() => Math.random() - 0.5);
      return shuffled;
    },
    enabled: !!profile?.id,
  });

  const { data: posts, isLoading: isLoadingPosts } = useQuery({
    queryKey: ["public-profile-posts", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("posts")
        .select(`
          id, 
          caption, 
          created_at,
          post_images(image_url, order_index),
          post_likes(count),
          post_comments(count)
        `)
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser || !profile) return;
      if (profile.isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("following_id", profile.id);
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: currentUser.id, following_id: profile.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-profile", slug] });
      toast.success(profile?.isFollowing ? "Deixou de seguir" : "Seguindo!");
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando perfil...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-4xl font-serif font-bold text-primary mb-2">404</h1>
        <p className="text-xl text-muted-foreground mb-6">Perfil não encontrado</p>
        <Button asChild variant="outline">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Início
          </Link>
        </Button>
      </div>
    );
  }

  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .filter(Boolean)
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "??";

  return (
    <div className="min-h-screen bg-white">
      {/* Header Mobile Nav */}
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/">
            <ArrowLeft className="h-6 w-6" />
          </Link>
        </Button>
        <h1 className="font-bold text-lg">{profile.slug}</h1>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Info Section */}
        <section className="flex flex-col md:flex-row gap-8 items-start mb-12">
          <div className="flex flex-col items-center gap-4 shrink-0">
            <Avatar className="h-24 w-24 md:h-40 md:w-40 border-2 border-slate-100 ring-2 ring-primary/10">
              {profile.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.full_name} className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-slate-100 text-slate-400 text-4xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            {currentUser?.id === profile.id && (
              <Button variant="outline" size="sm" className="w-full md:hidden font-semibold" asChild>
                <Link to="/portal/perfil">Editar perfil</Link>
              </Button>
            )}
          </div>

          <div className="flex-1 w-full">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
              <h2 className="text-xl md:text-2xl font-light">{profile.slug}</h2>
              <div className="flex gap-2">
                {currentUser?.id === profile.id ? (
                  <Button variant="outline" size="sm" className="hidden md:flex font-semibold" asChild>
                    <Link to="/portal/perfil">Editar perfil</Link>
                  </Button>
                ) : (
                  <>
                    <Button 
                      size="sm" 
                      variant={profile.isFollowing ? "secondary" : "default"}
                      onClick={() => followMutation.mutate()}
                      className="font-semibold flex-1 md:flex-none"
                      disabled={followMutation.isPending || !currentUser}
                    >
                      {profile.isFollowing ? (
                        <>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Seguindo
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Seguir
                        </>
                      )}
                    </Button>
                    <Button size="sm" variant="secondary" className="font-semibold flex-1 md:flex-none" disabled={!currentUser}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Mensagem
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-between md:justify-start md:gap-10 mb-6 py-4 md:py-0 border-y md:border-none">
              <div className="flex flex-col md:flex-row items-center md:gap-1 text-sm md:text-base">
                <span className="font-bold">{profile.postsCount}</span>
                <span className="text-slate-500">publicações</span>
              </div>
              <div className="flex flex-col md:flex-row items-center md:gap-1 text-sm md:text-base">
                <span className="font-bold">{profile.followersCount}</span>
                <span className="text-slate-500">seguidores</span>
              </div>
              <div className="flex flex-col md:flex-row items-center md:gap-1 text-sm md:text-base">
                <span className="font-bold">{profile.followingCount}</span>
                <span className="text-slate-500">seguindo</span>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold">{profile.full_name}</h3>
              {profile.lodge && (
                <p className="text-primary font-medium text-sm">
                  {profile.lodge.name} | {profile.lodge.potencia} | {profile.lodge.rito}
                </p>
              )}
              {profile.bio && <p className="text-sm whitespace-pre-line mb-3">{profile.bio}</p>}
              
              {commonFollowers && commonFollowers.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      Seguido por
                    </span>
                    <div className="flex -space-x-2">
                      {commonFollowers.slice(0, 3).map((follower: any) => (
                        <Avatar key={follower.id} className="h-6 w-6 border-2 border-white ring-1 ring-slate-50">
                          <AvatarImage src={follower.avatar_url} />
                          <AvatarFallback className="text-[8px] bg-slate-50">
                            {follower.full_name?.substring(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {commonFollowers.slice(0, 2).map((f: any, i: number) => (
                      <span key={f.id}>
                        <span className="font-bold text-foreground">{f.full_name.split(' ')[0]}</span>
                        {i === 0 && commonFollowers.length > 1 ? ', ' : ''}
                      </span>
                    ))}
                    {profile.followersCount > 2 && (
                      <> e outras <span className="font-bold text-foreground">{profile.followersCount - 2} {profile.followersCount - 2 === 1 ? 'pessoa' : 'pessoas'}</span></>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Profile Tabs (Instagram style) */}
        <div className="border-t">
          <div className="flex justify-center gap-12 -mt-px">
            <button className="flex items-center gap-2 border-t border-slate-900 py-4 text-xs font-bold uppercase tracking-widest">
              <div className="grid grid-cols-2 grid-rows-2 gap-0.5 w-3 h-3 border border-slate-900">
                <div className="bg-slate-900"></div>
                <div className="bg-slate-900"></div>
                <div className="bg-slate-900"></div>
                <div className="bg-slate-900"></div>
              </div>
              Publicações
            </button>
          </div>
        </div>

        {/* Posts Grid */}
        {isLoadingPosts ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-slate-200" />
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1 md:gap-8 py-4">
            {posts.map((post: any) => (
              <div key={post.id} className="relative aspect-square bg-slate-100 group cursor-pointer overflow-hidden">
                {post.post_images?.[0]?.image_url && (
                  <img 
                    src={post.post_images[0].image_url} 
                    alt={post.caption} 
                    className="object-cover w-full h-full transition-transform group-hover:scale-105"
                  />
                )}
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold">
                  <div className="flex items-center gap-1">
                    <Heart className="h-6 w-6 fill-white" />
                    <span>{post.post_likes?.[0]?.count || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-6 w-6 fill-white" />
                    <span>{post.post_comments?.[0]?.count || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full border-2 border-slate-900 p-4">
                <div className="grid grid-cols-2 grid-rows-2 gap-0.5 w-8 h-8 border-2 border-slate-900">
                  <div className="bg-white"></div>
                  <div className="bg-white"></div>
                  <div className="bg-white"></div>
                  <div className="bg-white"></div>
                </div>
              </div>
            </div>
            <h3 className="text-2xl font-bold">Nenhuma publicação ainda</h3>
          </div>
        )}
      </main>
    </div>
  );
}
