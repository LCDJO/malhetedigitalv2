import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { CreateStoryDialog } from "./CreateStoryDialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function StoriesBar() {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<any>(null);

  const { data: stories, isLoading, refetch } = useQuery({
    queryKey: ["stories", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stories")
        .select(`
          *,
          profiles(full_name, avatar_url, slug)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Group by user to show one bubble per user (like Instagram)
      const grouped = data.reduce((acc: any, story: any) => {
        if (!acc[story.user_id]) {
          acc[story.user_id] = {
            user: story.profiles,
            stories: []
          };
        }
        acc[story.user_id].stories.push(story);
        return acc;
      }, {});

      return Object.values(grouped);
    },
    enabled: !!user?.id,
  });

  return (
    <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar">
      {/* Create Story Button */}
      <div className="flex flex-col items-center gap-1 min-w-[70px]">
        <button 
          onClick={() => setIsCreateOpen(true)}
          className="relative w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary/50 transition-colors group"
        >
          <div className="w-14 h-14 rounded-full bg-muted/10 flex items-center justify-center group-hover:bg-primary/5">
            <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
          </div>
          <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1 border-2 border-white">
            <Plus className="h-3 w-3" />
          </div>
        </button>
        <span className="text-[10px] font-medium text-muted-foreground">Seu Story</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-16 w-16">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      ) : (
        stories?.map((item: any) => (
          <div 
            key={item.user.id} 
            className="flex flex-col items-center gap-1 min-w-[70px] cursor-pointer"
            onClick={() => setSelectedStory(item)}
          >
            <div className="p-[2px] rounded-full bg-gradient-to-tr from-amber-500 to-primary">
              <div className="p-[2px] rounded-full bg-white dark:bg-slate-950">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={item.user.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {item.user.full_name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="text-[10px] font-medium truncate w-full text-center">
              {item.user.full_name.split(" ")[0]}
            </span>
          </div>
        ))
      )}

      <CreateStoryDialog 
        isOpen={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
        onSuccess={refetch}
      />

      {/* Story Viewer Modal */}
      <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
        <DialogContent className="max-w-lg p-0 bg-black border-none overflow-hidden h-[80vh]">
          {selectedStory && (
            <div className="relative h-full w-full flex flex-col">
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <Avatar className="h-8 w-8 border border-white/20">
                  <AvatarImage src={selectedStory.user.avatar_url} />
                  <AvatarFallback>{selectedStory.user.full_name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-white text-sm font-bold drop-shadow-md">
                  {selectedStory.user.full_name}
                </span>
              </div>
              
              <div className="flex-1 flex items-center justify-center bg-zinc-900">
                {selectedStory.stories[0].content_type === 'image' ? (
                  <img 
                    src={selectedStory.stories[0].content_url} 
                    className="max-h-full max-w-full object-contain"
                    alt="Story content"
                  />
                ) : (
                  <div className="p-8 text-white text-2xl font-serif text-center italic">
                    {selectedStory.stories[0].content_text}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
