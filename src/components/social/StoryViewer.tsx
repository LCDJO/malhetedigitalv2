import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Story {
  id: string;
  image_url: string;
  duration: number; // in milliseconds
}

interface StoryViewerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
}

export const StoryViewer = ({ isOpen, onClose, profile }: StoryViewerProps) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const remainingTimeRef = useRef<number>(0);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance in pixels
  const minSwipeDistance = 50;

  // Mock stories for now
  const stories: Story[] = [
    { id: "1", image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60", duration: 5000 },
    { id: "2", image_url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=60", duration: 5000 },
    { id: "3", image_url: "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&auto=format&fit=crop&q=60", duration: 5000 },
  ];

  const currentStory = stories[currentStoryIndex];

  const nextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
    setIsPaused(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    setIsPaused(false);
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > minSwipeDistance;
    const isDownSwipe = distance < -minSwipeDistance;
    
    if (isDownSwipe) {
      onClose();
    }
  };

  useEffect(() => {
    if (!isOpen || isPaused) return;
...
    return () => clearInterval(timer);
  }, [isOpen, currentStoryIndex, isPaused, currentStory.duration]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") nextStory();
      if (e.key === "ArrowLeft") prevStory();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStoryIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center animate-in fade-in zoom-in duration-300">
      {/* Background blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center blur-3xl opacity-30 scale-110"
        style={{ backgroundImage: `url(${currentStory.image_url})` }}
      />

      <div className="relative w-full max-w-[450px] aspect-[9/16] bg-slate-900 overflow-hidden shadow-2xl md:rounded-xl">
        {/* Progress bars */}
        <div className="absolute top-4 left-4 right-4 z-20 flex gap-1">
          {stories.map((story, index) => (
            <div key={story.id} className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-75 linear"
                style={{ 
                  width: index < currentStoryIndex ? "100%" : index === currentStoryIndex ? `${progress}%` : "0%" 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-4 right-4 z-20 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border border-white/20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback>{profile?.full_name?.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-bold">@{profile?.slug}</span>
              <span className="text-[10px] opacity-70">há 2 horas</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={onClose}>
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Story Content */}
        <div 
          className="w-full h-full cursor-pointer flex items-center justify-center bg-black"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <img 
            src={currentStory.image_url} 
            alt="Story" 
            className="w-full h-full object-contain select-none"
            onDragStart={(e) => e.preventDefault()}
          />

          {/* Navigation Overlay */}
          <div className="absolute inset-0 grid grid-cols-2">
            <div className="h-full w-full" onClick={(e) => { e.stopPropagation(); prevStory(); }} />
            <div className="h-full w-full" onClick={(e) => { e.stopPropagation(); nextStory(); }} />
          </div>
        </div>

        {/* Footer (Reply) */}
        <div className="absolute bottom-6 left-4 right-4 z-20 flex gap-4">
          <input 
            type="text" 
            placeholder={`Enviar mensagem para @${profile?.slug}...`}
            className="flex-1 bg-transparent border border-white/30 rounded-full px-4 py-2 text-white text-sm focus:outline-none focus:border-white transition-colors"
            onClick={(e) => e.stopPropagation()}
            onFocus={() => setIsPaused(true)}
            onBlur={() => setIsPaused(false)}
          />
          <Button variant="ghost" size="icon" className="text-white">
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        {/* Desktop Navigation Arrows */}
        <div className="hidden md:block absolute -left-16 top-1/2 -translate-y-1/2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white/50 hover:text-white" 
            onClick={prevStory}
            disabled={currentStoryIndex === 0}
          >
            <ChevronLeft className="h-10 w-10" />
          </Button>
        </div>
        <div className="hidden md:block absolute -right-16 top-1/2 -translate-y-1/2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white/50 hover:text-white" 
            onClick={nextStory}
          >
            <ChevronRight className="h-10 w-10" />
          </Button>
        </div>
      </div>
    </div>
  );
};
