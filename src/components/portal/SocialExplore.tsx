import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Hash, Users, Store } from "lucide-react";
import { PostCard } from "./PostCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export function SocialExplore() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "users" | "hashtags" | "stores">("all");

  const { data: posts, isLoading: isLoadingPosts } = useQuery({
    queryKey: ["explore-posts", searchTerm],
    queryFn: async () => {
      let query = supabase
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
        .order("created_at", { ascending: false });

      if (searchTerm && activeFilter === "all") {
        query = query.ilike("caption", `%${searchTerm}%`);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["explore-profiles", searchTerm],
    queryFn: async () => {
      if (!searchTerm) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, slug")
        .ilike("full_name", `%${searchTerm}%`)
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!searchTerm,
  });

  return (
    <div className="space-y-6">
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar usuários, hashtags ou lojas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 h-12 bg-white dark:bg-slate-900 border-none shadow-sm rounded-2xl text-base focus-visible:ring-primary/20"
        />
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
        {[
          { id: "all", label: "Tudo", icon: Hash },
          { id: "users", label: "Usuários", icon: Users },
          { id: "hashtags", label: "Hashtags", icon: Hash },
          { id: "stores", label: "Lojas", icon: Store },
        ].map((filter) => (
          <Button
            key={filter.id}
            variant={activeFilter === filter.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(filter.id as any)}
            className="gap-2 rounded-full px-4"
          >
            <filter.icon className="h-4 w-4" />
            {filter.label}
          </Button>
        ))}
      </div>

      {searchTerm && profiles && profiles.length > 0 && (
        <div className="max-w-2xl mx-auto space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2 px-1">
            <Users className="h-4 w-4 text-primary" />
            Pessoas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profiles.map((profile) => (
              <Link
                key={profile.id}
                to={`/${profile.slug}`}
                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-transparent hover:border-primary/20 transition-all shadow-sm group"
              >
                <Avatar className="h-10 w-10 border group-hover:border-primary/30 transition-colors">
                  <AvatarImage src={profile.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                    {profile.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{profile.full_name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{profile.slug?.replace(/^@/, '')}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
        {isLoadingPosts ? (
          [1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="w-full aspect-square rounded-xl bg-slate-100 dark:bg-slate-800" />
          ))
        ) : posts && posts.length > 0 ? (
          posts.map((post) => (
            <div key={post.id} className="break-inside-avoid">
              <PostCard post={post} />
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold">Nenhum resultado encontrado</h3>
            <p className="text-muted-foreground">Tente buscar por termos diferentes ou explore o feed principal.</p>
          </div>
        )}
      </div>
    </div>
  );
}
