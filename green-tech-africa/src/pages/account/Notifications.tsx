import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, CheckCheck, Trash2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  subject: string;
  message: string;
  notification_type: string;
  notification_type_display: string;
  priority: string;
  priority_display: string;
  status: string;
  status_display: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

const priorityColors = {
  LOW: "secondary",
  NORMAL: "default",
  HIGH: "default",
  URGENT: "destructive",
} as const;

const Notifications = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", filter],
    queryFn: async () => {
      const params = filter === "unread" ? "?is_read=false" : "";
      const response = await api.get(`/api/notifications/${params}`);
      return response.data.results || [];
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      await api.post("/api/notifications/mark_as_read/", {
        notification_ids: notificationIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      toast({ title: "Marked as read" });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.post("/api/notifications/mark_all_as_read/");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      toast({ title: "All notifications marked as read" });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/notifications/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      toast({ title: "Notification deleted" });
    },
  });

  const notifications = data || [];
  const unreadCount = notifications.filter((n: Notification) => !n.is_read).length;

  return (
    <Layout>
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-6 h-6" />
              <h1 className="text-2xl md:text-3xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <Badge variant="default">{unreadCount} unread</Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                {markAllAsReadMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCheck className="w-4 h-4 mr-2" />
                )}
                Mark all as read
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
            <TabsList className="grid w-full md:w-auto grid-cols-2">
              <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
              <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Bell className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No notifications</p>
                    <p className="text-sm text-muted-foreground">
                      {filter === "unread"
                        ? "You're all caught up!"
                        : "You don't have any notifications yet"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification: Notification) => (
                    <Card
                      key={notification.id}
                      className={`transition-all ${
                        !notification.is_read
                          ? "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                          : ""
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{notification.subject}</h3>
                              <Badge
                                variant={
                                  priorityColors[
                                    notification.priority as keyof typeof priorityColors
                                  ]
                                }
                                className="text-xs"
                              >
                                {notification.priority_display}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {notification.notification_type_display}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                              })}
                              {notification.read_at && (
                                <span className="ml-2">
                                  • Read{" "}
                                  {formatDistanceToNow(new Date(notification.read_at), {
                                    addSuffix: true,
                                  })}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => markAsReadMutation.mutate([notification.id])}
                                disabled={markAsReadMutation.isPending}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteNotificationMutation.mutate(notification.id)}
                              disabled={deleteNotificationMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
};

export default Notifications;
