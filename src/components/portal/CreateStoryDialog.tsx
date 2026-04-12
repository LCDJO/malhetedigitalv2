import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface CreateStoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateStoryDialog({ isOpen, onOpenChange, onSuccess }: CreateStoryDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentType, setContentType] = useState<"image" | "text">("image");
  const [contentUrl, setContentUrl] = useState("");
  const [contentText, setContentText] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSubmitting(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Math.random()}.${fileExt}`;
      const filePath = `stories/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('social_media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('social_media')
        .getPublicUrl(filePath);

      setContentUrl(publicUrl);
      toast.success("Imagem carregada com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao carregar imagem: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (contentType === 'image' && !contentUrl) {
      toast.error("Por favor, carregue uma imagem.");
      return;
    }
    if (contentType === 'text' && !contentText) {
      toast.error("Por favor, escreva um texto.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('stories').insert({
        user_id: user?.id,
        content_url: contentType === 'image' ? contentUrl : null,
        content_text: contentType === 'text' ? contentText : null,
        content_type: contentType,
        privacy,
      });

      if (error) throw error;

      toast.success("Story publicado com sucesso!");
      onSuccess();
      onOpenChange(false);
      // Reset form
      setContentUrl("");
      setContentText("");
      setContentType("image");
    } catch (error: any) {
      toast.error("Erro ao publicar story: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Story</DialogTitle>
          <DialogDescription>
            Compartilhe um momento que desaparecerá em 24 horas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex justify-center gap-4 mb-2">
            <Button 
              variant={contentType === 'image' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setContentType('image')}
            >
              Imagem
            </Button>
            <Button 
              variant={contentType === 'text' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setContentType('text')}
            >
              Texto
            </Button>
          </div>

          {contentType === 'image' ? (
            <div className="grid gap-2">
              <Label htmlFor="image-upload" className="sr-only">Carregar Imagem</Label>
              {contentUrl ? (
                <div className="relative group rounded-lg overflow-hidden border">
                  <img src={contentUrl} alt="Preview" className="w-full h-48 object-cover" />
                  <button 
                    onClick={() => setContentUrl("")}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors cursor-pointer relative">
                  <ImagePlus className="h-8 w-8 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">Clique para carregar</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={handleFileUpload}
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="content-text">Seu texto</Label>
              <Textarea 
                id="content-text" 
                placeholder="No que você está pensando?" 
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label>Privacidade</Label>
            <Select value={privacy} onValueChange={setPrivacy}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione quem pode ver" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Público</SelectItem>
                <SelectItem value="brothers">Apenas Irmãos</SelectItem>
                <SelectItem value="connections">Apenas Conexões (Seguidores)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Publicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
