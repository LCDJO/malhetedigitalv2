import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Stories = () => {
  // Placeholder stories
  const stories = [
    { id: 1, name: "Meu Story", isMe: true },
    { id: 2, name: "ir_pedro", avatar: null },
    { id: 3, name: "loja_123", avatar: null },
    { id: 4, name: "ir_carlos", avatar: null },
    { id: 5, name: "ir_jose", avatar: null },
    { id: 6, name: "ir_silva", avatar: null },
    { id: 7, name: "ir_marcos", avatar: null },
    { id: 8, name: "ir_antonio", avatar: null },
  ];

  return (
    <div className="flex items-center gap-4 overflow-x-auto pb-6 pt-2 px-4 no-scrollbar">
      {stories.map((story) => (
        <div key={story.id} className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer group">
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
  );
};

// Simple utility for cn inside this file since I don't want to import it if not needed
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
