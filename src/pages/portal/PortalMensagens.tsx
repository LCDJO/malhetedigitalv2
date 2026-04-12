import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Send, ImagePlus, Loader2, Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PortalMensagens() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("u");
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch recent chats
  const { data: chats, isLoading: isLoadingChats, refetch: refetchChats } = useQuery({
    queryKey: ["chats", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:sender_id(id, full_name, avatar_url, slug),
          receiver:receiver_id(id, full_name, avatar_url, slug)
        `)
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by unique contact
      const contactMap = new Map();
      data.forEach((msg: any) => {
        const contact = msg.sender_id === user?.id ? msg.receiver : msg.sender;
        if (!contactMap.has(contact.id)) {
          contactMap.set(contact.id, {
            contact,
            lastMessage: msg,
            unreadCount: 0 // Mock for now
          });
        }
      });
      return Array.from(contactMap.values());
    },
    enabled: !!user?.id,
  });

  // Fetch messages for selected contact
  const { data: messages, isLoading: isLoadingMessages, refetch: refetchMessages } = useQuery({
    queryKey: ["messages", selectedContact?.id],
    queryFn: async () => {
      if (!selectedContact) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${user?.id})`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Mark as seen
      const unseenIds = data
        .filter(m => m.receiver_id === user?.id && m.status !== 'seen')
        .map(m => m.id);
      
      if (unseenIds.length > 0) {
        await supabase
          .from("messages")
          .update({ status: 'seen' })
          .in("id", unseenIds);
      }

      return data;
    },
    enabled: !!selectedContact,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.new.sender_id === selectedContact?.id || payload.new.receiver_id === selectedContact?.id) {
            refetchMessages();
          }
          refetchChats();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.new.sender_id === selectedContact?.id || payload.new.receiver_id === selectedContact?.id) {
            refetchMessages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, selectedContact?.id]);

  useEffect(() => {
    if (targetUserId && chats) {
      const chat = chats.find(c => c.contact.id === targetUserId);
      if (chat) {
        setSelectedContact(chat.contact);
      } else {
        // If no chat exists yet, we should fetch the profile of targetUserId
        (async () => {
          const { data } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url, slug")
            .eq("id", targetUserId)
            .maybeSingle();
          if (data) setSelectedContact(data);
        })();
      }
    }
  }, [targetUserId, chats]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user?.id,
        receiver_id: selectedContact.id,
        content: newMessage,
      });

      if (error) throw error;
      setNewMessage("");
      refetchMessages();
    } catch (error: any) {
      toast.error("Erro ao enviar mensagem: " + error.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      {/* Sidebar: Chats List */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar conversas..." className="pl-9 h-9" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {isLoadingChats ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : chats?.length ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {chats.map((chat: any) => (
                <button
                  key={chat.contact.id}
                  onClick={() => setSelectedContact(chat.contact)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left ${
                    selectedContact?.id === chat.contact.id ? "bg-slate-50 dark:bg-slate-800/50" : ""
                  }`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={chat.contact.avatar_url} />
                    <AvatarFallback>{chat.contact.full_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <p className="text-sm font-bold truncate">{chat.contact.full_name}</p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                        {format(new Date(chat.lastMessage.created_at), "HH:mm")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {chat.lastMessage.sender_id === user?.id ? "Você: " : ""}
                      {chat.lastMessage.content}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhuma conversa encontrada.
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main: Chat Window */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-slate-950/20">
        {selectedContact ? (
          <>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={selectedContact.avatar_url} />
                  <AvatarFallback>{selectedContact.full_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold leading-none">{selectedContact.full_name}</p>
                  <p className="text-[10px] text-green-500 mt-1">Online</p>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto" ref={scrollRef}>
              <div className="space-y-4">
                {isLoadingMessages ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : messages?.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                        msg.sender_id === user?.id
                          ? "bg-primary text-white rounded-br-none"
                          : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                        msg.sender_id === user?.id ? "text-white/70" : "text-muted-foreground"
                      }`}>
                        {format(new Date(msg.created_at), "HH:mm")}
                        {msg.sender_id === user?.id && (
                          msg.status === 'seen' ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9">
                  <ImagePlus className="h-5 w-5 text-muted-foreground" />
                </Button>
                <Input
                  placeholder="Sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1 h-9 bg-slate-50 dark:bg-slate-800 border-none shadow-none focus-visible:ring-1"
                />
                <Button 
                  size="icon" 
                  onClick={handleSendMessage} 
                  disabled={!newMessage.trim() || isSending}
                  className="shrink-0 h-9 w-9"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
              <Send className="h-8 w-8 text-primary opacity-20" />
            </div>
            <h3 className="text-lg font-bold">Suas Mensagens</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Selecione um contato para começar a conversar ou inicie uma nova conversa.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
