import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getNotifications, markNotificationsRead } from "@/services/portal";
import { usePortalMemberContext } from "./PortalLayout";
import { Bell, CheckCheck, Wallet, Calendar, Info, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  metadata: any;
}

const typeIcons: Record<string, any> = {
  financeiro: Wallet,
  reuniao: Calendar,
  lgpd: ShieldAlert,
  geral: Info,
};

export function PortalNotifications() {
  const member = usePortalMemberContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications(member.id);
      if (data) setNotifications(data as Notification[]);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
    setLoading(false);
  }, [member.id]);

  useEffect(() => {
    fetchNotifications();

    // Realtime subscription
    const channel = supabase
      .channel("portal-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `member_id=eq.${member.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 30));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, member.id]);

  const markAsRead = async (id: string) => {
    await markNotificationsRead([id]);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await markNotificationsRead(unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-[hsl(220_10%_55%)] hover:text-[hsl(42_60%_68%)] hover:bg-[hsl(220_18%_14%)]"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(42_65%_50%)] text-[9px] font-bold text-[hsl(220_25%_7%)] px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[360px] p-0 border-[hsl(42_40%_22%/0.3)] bg-[hsl(220_25%_9%)]"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(42_40%_22%/0.2)]">
          <h3 className="text-sm font-semibold text-[hsl(40_20%_90%)]">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[10px] text-[hsl(42_50%_55%)] hover:text-[hsl(42_60%_68%)] gap-1"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3 w-3" /> Marcar todas
            </Button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-[hsl(220_10%_50%)]" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-10 text-center">
              <Bell className="h-8 w-8 mx-auto text-[hsl(220_10%_30%)] mb-2" />
              <p className="text-xs text-[hsl(220_10%_45%)]">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-[hsl(42_40%_22%/0.1)]">
              {notifications.map((n) => {
                const Icon = typeIcons[n.type] ?? Info;
                return (
                  <button
                    key={n.id}
                    onClick={() => !n.is_read && markAsRead(n.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 flex gap-3 transition-colors hover:bg-[hsl(220_18%_12%)]",
                      !n.is_read && "bg-[hsl(42_65%_50%/0.04)]"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        n.type === "financeiro"
                          ? "bg-[hsl(142_50%_25%/0.3)] text-[hsl(142_60%_55%)]"
                          : n.type === "reuniao"
                          ? "bg-[hsl(42_65%_50%/0.15)] text-[hsl(42_60%_68%)]"
                          : n.type === "lgpd"
                          ? "bg-[hsl(0_60%_30%/0.3)] text-[hsl(0_70%_65%)]"
                          : "bg-[hsl(220_18%_14%)] text-[hsl(220_10%_55%)]"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-[13px] leading-tight truncate",
                            n.is_read
                              ? "text-[hsl(220_10%_55%)]"
                              : "text-[hsl(40_20%_90%)] font-medium"
                          )}
                        >
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[hsl(42_65%_50%)]" />
                        )}
                      </div>
                      <p className="text-[11px] text-[hsl(220_10%_45%)] mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-[hsl(220_10%_35%)] mt-1">
                        {formatDistanceToNow(new Date(n.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
