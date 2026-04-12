import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

export function SocialStories() {
  const stories = [
    { id: 1, name: "Seu Story", avatar: "", isUser: true },
    { id: 2, name: "G. Silva", avatar: "https://i.pravatar.cc/150?u=1" },
    { id: 3, name: "R. Santos", avatar: "https://i.pravatar.cc/150?u=2" },
    { id: 4, name: "M. Oliveira", avatar: "https://i.pravatar.cc/150?u=3" },
    { id: 5, name: "L. Souza", avatar: "https://i.pravatar.cc/150?u=4" },
    { id: 6, name: "F. Costa", avatar: "https://i.pravatar.cc/150?u=5" },
    { id: 7, name: "A. Pereira", avatar: "https://i.pravatar.cc/150?u=6" },
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      {stories.map((story) => (
        <motion.div 
          key={story.id} 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <div className={`p-[2px] rounded-full ${story.isUser ? 'bg-slate-200 dark:bg-slate-800' : 'bg-gradient-to-tr from-amber-500 to-primary'}`}>
            <div className="p-[2px] bg-white dark:bg-slate-900 rounded-full">
              <Avatar className="h-14 w-14 border-none">
                <AvatarImage src={story.avatar} />
                <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                  {story.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 max-w-[64px] truncate">
            {story.name}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
