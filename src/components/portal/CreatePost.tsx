import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImagePlus, X, Loader2, Send, Smile, MapPin, Video, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export function CreatePost({ profile, currentUser }: { profile: any; currentUser: any }) {
  const queryClient = useQueryClient();
  const [caption, setCaption] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [postType, setPostType] = useState<'post' | 'reel'>('post');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const createPostMutation = useMutation({
    mutationFn: async () => {
      if (!caption.trim() && images.length === 0) return;
      
      setIsUploading(true);
      try {
        const { data: post, error: postError } = await supabase
          .from("posts")
          .insert({
            user_id: currentUser.id,
            caption: caption,
            privacy_level: 'public',
            post_type: postType
          })
          .select()
          .single();

        if (postError) throw postError;

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
      setImages(prev => [...prev, ...selectedFiles].slice(0, 5));
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
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="mb-8 border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden rounded-2xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex gap-4">
            <Avatar className="h-11 w-11 border-2 border-slate-50 dark:border-slate-800 shadow-sm">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <Textarea 
                placeholder="No que você está pensando hoje, meu Irmão?" 
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="min-h-[100px] border-none focus-visible:ring-0 resize-none text-base bg-transparent p-0 placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
              
              <AnimatePresence>
                {images.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
                  >
                    {images.map((img, index) => (
                      <motion.div 
                        layout
                        key={index} 
                        className="relative w-28 h-28 shrink-0 rounded-xl overflow-hidden shadow-sm group"
                      >
                        <img 
                          src={URL.createObjectURL(img)} 
                          alt="Preview" 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                        />
                        <button 
                          onClick={() => removeImage(index)}
                          className="absolute top-1.5 right-1.5 bg-black/40 backdrop-blur-md rounded-full p-1 text-white hover:bg-black/60 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    ))}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-28 h-28 shrink-0 rounded-xl border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 transition-all bg-slate-50/50 dark:bg-slate-800/20"
                    >
                      <ImagePlus className="h-6 w-6 mb-1" />
                      <span className="text-[10px] font-bold">Adicionar</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t dark:border-slate-800">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageSelect} 
                multiple 
                accept="image/*" 
                className="hidden" 
              />
              <input 
                type="file" 
                ref={videoInputRef} 
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setImages([e.target.files[0]]);
                    setPostType('reel');
                  }
                }} 
                accept="video/*" 
                className="hidden" 
              />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setPostType('post');
                  fileInputRef.current?.click();
                }}
                className={`rounded-full px-4 h-9 font-medium ${postType === 'post' ? 'text-primary bg-primary/5' : 'text-slate-500 hover:text-primary hover:bg-primary/5'}`}
              >
                <ImagePlus className="mr-2 h-4 w-4" />
                Mídia
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setPostType('reel');
                  videoInputRef.current?.click();
                }}
                className={`rounded-full px-4 h-9 font-medium ${postType === 'reel' ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'text-slate-500 hover:text-amber-500 hover:bg-amber-50'}`}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Reel
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-full px-4 h-9 font-medium hidden sm:flex"
              >
                <Smile className="mr-2 h-4 w-4" />
                Humor
              </Button>
            </div>
            <Button 
              size="sm" 
              onClick={() => createPostMutation.mutate()}
              disabled={(!caption.trim() && images.length === 0) || isUploading}
              className="px-6 rounded-full font-bold shadow-sm h-9 bg-primary hover:opacity-90"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Publicar
                  <Send className="ml-2 h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
