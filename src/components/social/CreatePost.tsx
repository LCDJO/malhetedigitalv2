import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Hash, MapPin } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export const CreatePost = ({ profile, currentUser }: { profile: any; currentUser: any }) => {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = async () => {
    if (!caption && !image) return;
    setIsUploading(true);
    // Mimic API call
    setTimeout(() => {
      setIsUploading(false);
      setCaption("");
      setImage(null);
    }, 1500);
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-start gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback className="bg-muted">
            {profile?.full_name?.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-4">
          <Textarea
            placeholder="O que está acontecendo no templo?"
            className="min-h-[80px] bg-transparent border-none focus-visible:ring-0 p-0 text-base resize-none"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />

          {image && (
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img src={image} alt="Preview" className="w-full h-auto max-h-[400px] object-cover" />
              <button 
                onClick={() => setImage(null)}
                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-highlight hover:bg-highlight/10 h-9 w-9"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="h-5 w-5" />
              </Button>
              <input 
                type="file" 
                hidden 
                ref={fileInputRef} 
                accept="image/*"
                onChange={handleImageSelect}
              />
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted h-9 w-9">
                <Hash className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted h-9 w-9">
                <MapPin className="h-5 w-5" />
              </Button>
            </div>
            <Button 
              size="sm" 
              className="bg-highlight hover:bg-highlight/90 text-white font-bold px-6 rounded-full"
              disabled={(!caption && !image) || isUploading}
              onClick={handlePublish}
            >
              {isUploading ? "Publicando..." : "Publicar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
