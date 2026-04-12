import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Send, Image as ImageIcon, Loader2, MoreVertical, Check, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url?: string;
  status: string;
  created_at: string;
}

interface ChatPartner {
  id: string;
  full_name: string;
  avatar_url: string;
  slug: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

export function SocialMessages() {
  const { user } = useAuth();
  const [partners, setPartners] = useState<ChatPartner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<ChatPartner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPartners();
  }, [user?.id]);

  useEffect(() => {
    if (selectedPartner) {
      fetchMessages(selectedPartner.id);
      const channel = subscribeToMessages(selectedPartner.id);
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedPartner]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchPartners = async () => {
    if (!user?.id) return;
    try {
      // Get people I follow or follow me as potential chat partners
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id, follower_id")
        .or(`follower_id.eq.${user.id},following_id.eq.${user.id}`);

      const partnerIds = new Set<string>();
      follows?.forEach(f => {
        if (f.follower_id === user.id) partnerIds.add(f.following_id);
        if (f.following_id === user.id) partnerIds.add(f.follower_id);
      });

      if (partnerIds.size === 0) {
        setPartners([]);
        setIsLoading(false);
        return;
      }

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, slug")
        .in("id", Array.from(partnerIds));

      if (error) throw error;

      // Cast profiles to ChatPartner
      setPartners(profiles.map(p => ({ 
        ...p, 
        last_message: "Clique para conversar", 
        last_message_time: "",
        slug: p.slug || ""
      })));
    } catch (error) {
      console.error("Error fetching partners:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (partnerId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user?.id})`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      // Mark as read
      await (supabase as any)
        .from("messages")
        .update({ status: "read" })
        .eq("sender_id", partnerId)
        .eq("receiver_id", user?.id)
        .eq("status", "sent");

    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const subscribeToMessages = (partnerId: string) => {
    return (supabase as any)
      .channel(`chat:${user?.id}:${partnerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user?.id}`,
        },
        (payload: any) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender_id === partnerId) {
            setMessages((prev) => [...prev, newMsg]);
            (supabase as any)
              .from("messages")
              .update({ status: "read" })
              .eq("id", newMsg.id)
              .then();
          }
        }
      )
      .subscribe();
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!newMessage.trim() && !fileInputRef.current?.files?.[0]) || !selectedPartner || isSending) return;

    setIsSending(true);
    try {
      let imageUrl = "";
      const file = fileInputRef.current?.files?.[0];
      
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `chat/${user?.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("social_media")
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("social_media").getPublicUrl(filePath);
        imageUrl = publicUrl;
      }

      const { data, error } = await (supabase as any)
        .from("messages")
        .insert({
          sender_id: user?.id,
          receiver_id: selectedPartner.id,
          content: newMessage.trim(),
          image_url: imageUrl,
          status: "sent"
        })
        .select()
        .single();

      if (error) throw error;
      
      setMessages((prev) => [...prev, data]);
      setNewMessage("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      toast.error("Erro ao enviar mensagem");
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[600px] bg-white dark:bg-slate-900 rounded-2xl shadow-sm border overflow-hidden">
      {/* Sidebar: Partners */}
      <div className={`${selectedPartner ? "hidden md:flex" : "flex"} w-full md:w-80 border-r flex flex-col bg-slate-50/50 dark:bg-slate-800/20`}>
        <div className="p-4 border-b bg-white dark:bg-slate-900">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar conversas..." className="pl-9 bg-slate-50 dark:bg-slate-800 border-none h-9 text-sm" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : partners.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {partners.map((partner) => (
                <button
                  key={partner.id}
                  onClick={() => setSelectedPartner(partner)}
                  className={`w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-white dark:hover:bg-slate-800 ${selectedPartner?.id === partner.id ? "bg-white dark:bg-slate-800 shadow-sm" : ""}`}
                >
                  <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-700">
                    <AvatarImage src={partner.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {partner.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="text-sm font-bold truncate">{partner.full_name}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{partner.last_message}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">Siga alguém para começar a conversar.</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main: Chat */}
      <div className={`${selectedPartner ? "flex" : "hidden md:flex"} flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-900/50`}>
        {selectedPartner ? (
          <>
            <div className="p-4 border-b bg-white dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedPartner(null)}>
                  <Check className="h-5 w-5 rotate-180" />
                </Button>
                <Avatar className="h-9 w-9 border shadow-sm">
                  <AvatarImage src={selectedPartner.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {selectedPartner.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-sm font-bold truncate max-w-[150px]">{selectedPartner.full_name}</h3>
                  <p className="text-[10px] text-green-500 font-medium">online</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isMine = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] space-y-1`}>
                        <div
                          className={`p-3 rounded-2xl text-sm shadow-sm relative group ${
                            isMine
                              ? "bg-primary text-primary-foreground rounded-tr-none"
                              : "bg-white dark:bg-slate-800 text-foreground rounded-tl-none border border-slate-100 dark:border-slate-700"
                          }`}
                        >
                          {msg.image_url && (
                            <img src={msg.image_url} alt="Shared" className="rounded-lg mb-2 max-h-60 w-full object-cover" />
                          )}
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <div className={`flex items-center gap-1 justify-end mt-1`}>
                            <span className={`text-[9px] opacity-70 ${isMine ? "text-primary-foreground" : "text-muted-foreground"}`}>
                              {format(new Date(msg.created_at), "HH:mm")}
                            </span>
                            {isMine && (
                              msg.status === "read" ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-900 border-t">
              <div className="flex items-center gap-2 max-w-4xl mx-auto">
                <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={() => handleSendMessage()} />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="shrink-0 text-primary hover:bg-primary/5 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-5 w-5" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="pr-12 bg-slate-50 dark:bg-slate-800 border-none rounded-full h-11 shadow-inner focus-visible:ring-primary/20"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={(!newMessage.trim() && !fileInputRef.current?.files?.[0]) || isSending}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-primary hover:bg-primary/90 shadow-md transition-all active:scale-95"
                  >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="h-20 w-20 bg-primary/5 rounded-full flex items-center justify-center mb-4">
              <ImageIcon className="h-10 w-10 text-primary/40" />
            </div>
            <h3 className="text-lg font-bold">Suas Mensagens</h3>
            <p className="text-sm text-muted-foreground max-w-xs">Selecione uma conversa para começar a interagir com outros Irmãos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
