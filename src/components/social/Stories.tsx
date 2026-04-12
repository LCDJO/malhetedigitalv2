import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { StoryViewer } from "./StoryViewer";
import { cn } from "@/lib/utils";

export const Stories = () => {
  const [selectedStory, setSelectedStory] = useState<any>(null);

  // Placeholder stories
  const stories = [
    { id: 1, name: "Meu Story", isMe: true, slug: "me", avatar: null },
    { id: 2, name: "ir_pedro", slug: "ir_pedro", avatar: null },
    { id: 3, name: "loja_123", slug: "loja_123", avatar: null },
    { id: 4, name: "ir_carlos", slug: "ir_carlos", avatar: null },
    { id: 5, name: "ir_jose", slug: "ir_jose", avatar: null },
    { id: 6, name: "ir_silva", slug: "ir_silva", avatar: null },
    { id: 7, name: "ir_marcos", slug: "ir_marcos", avatar: null },
    { id: 8, name: "ir_antonio", slug: "ir_antonio", avatar: null },
  ];

  return (
    <>
      <div className="flex items-center gap-4 overflow-x-auto pb-6 pt-2 px-4 no-scrollbar">
        {stories.map((story) => (
          <div 
            key={story.id} 
            className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer group"
            onClick={() => setSelectedStory(story)}
          >
            <div className={cn(
              "p-[3px] rounded-full",
              story.isMe ? "border-2 border-dashed border-muted" : "instagram-gradient"
            )}>
              <div className="p-[2px] bg-background rounded-full">
                <Avatar className="h-14 w-14 md:h-16 md:w-16">
                  <AvatarImage src={story.avatar || ""} />
                  <AvatarFallback className="bg-muted text-xs font-bold uppercase">
                    {story.name.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="text-[11px] text-muted-foreground truncate w-16 text-center">
              {story.name}
            </span>
          </div>
        ))}
      </div>

      {selectedStory && (
        <StoryViewer 
          isOpen={!!selectedStory} 
          onClose={() => setSelectedStory(null)} 
          profile={{
            slug: selectedStory.slug,
            full_name: selectedStory.name,
            avatar_url: selectedStory.avatar
          }}
        />
      )}
    </>
  );
};
