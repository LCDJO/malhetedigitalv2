import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function CreatePost({ profile, currentUser }: { profile: any; currentUser: any }) {
  const queryClient = useQueryClient();
  const [caption, setCaption] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createPostMutation = useMutation({
    mutationFn: async () => {
      if (!caption.trim() && images.length === 0) return;
      
      setIsUploading(true);
      try {
        // 1. Create Post
        const { data: post, error: postError } = await supabase
          .from("posts")
          .insert({
            user_id: currentUser.id,
            caption: caption,
            privacy_level: 'public'
          })
          .select()
          .single();

        if (postError) throw postError;

        // 2. Upload images and link to post
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const fileExt = file.name.split('.').pop();
          const filePath = `${currentUser.id}/${post.id}/${i}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('post-images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('post-images')
            .getPublicUrl(filePath);

          await supabase.from("post_images").insert({
            post_id: post.id,
            image_url: publicUrl,
            order_index: i
          });
        }

        setCaption("");
        setImages([]);
        toast.success("Postagem criada com sucesso!");
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-feed"] });
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...selectedFiles].slice(0, 5)); // limit to 5 images
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const initials = profile?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="mb-8 border shadow-sm">
      <CardContent className="p-4 space-y-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
          </Avatar>
          <Textarea 
            placeholder="O que está acontecendo na Ordem hoje?" 
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="flex-1 min-h-[100px] border-none focus-visible:ring-0 resize-none text-base"
          />
        </div>

        {images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((img, index) => (
              <div key={index} className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden border">
                <img 
                  src={URL.createObjectURL(img)} 
                  alt="Preview" 
                  className="w-full h-full object-cover" 
                />
                <button 
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-black/50 rounded-full p-1 text-white hover:bg-black/70"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageSelect} 
              multiple 
              accept="image/*" 
              className="hidden" 
            />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => fileInputRef.current?.click()}
              className="text-primary hover:text-primary hover:bg-primary/5"
            >
              <ImagePlus className="mr-2 h-4 w-4" />
              Fotos
            </Button>
          </div>
          <Button 
            size="sm" 
            onClick={() => createPostMutation.mutate()}
            disabled={(!caption.trim() && images.length === 0) || isUploading}
            className="px-6"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publicar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
