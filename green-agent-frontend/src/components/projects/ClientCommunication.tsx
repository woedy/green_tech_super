import { useState, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, Paperclip, Bell, BellOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ProjectChatMessage } from "@/types/chat";
import { UserSummary } from "@/types/project";
import { createProjectChatSocket, ProjectChatSocketEvent } from "@/lib/api";

const messageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  sendNotification: z.boolean().default(true),
});

type MessageFormData = z.infer<typeof messageSchema>;

interface ClientCommunicationProps {
  projectId: string;
  initialMessages: ProjectChatMessage[];
  currentUser: UserSummary;
  onSendMessage: (message: string, sendNotification: boolean) => Promise<void>;
  isLoading?: boolean;
}

export default function ClientCommunication({
  projectId,
  initialMessages,
  currentUser,
  onSendMessage,
  isLoading = false,
}: ClientCommunicationProps) {
  const [messages, setMessages] = useState<ProjectChatMessage[]>(initialMessages);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      message: "",
      sendNotification: true,
    },
  });

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    // Initialize WebSocket
    const socket = createProjectChatSocket(projectId);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data) as ProjectChatSocketEvent;
      if (data.type === "message") {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m.id === data.payload.id)) return prev;
          return [...prev, data.payload];
        });
      } else if (data.type === "typing") {
        setIsTyping((prev) => ({
          ...prev,
          [data.payload.user_id]: data.payload.is_typing,
        }));
      } else if (data.type === "read") {
        // Handle read receipts if needed
      }
    };

    socket.onclose = () => {
      console.log("Project chat socket closed. Reconnecting in 3s...");
      setTimeout(() => {
        // Simple reconnection logic
        if (socketRef.current === socket) {
          // rebuild if still current
        }
      }, 3000);
    };

    return () => {
      socket.close();
    };
  }, [projectId]);

  const scrollToBottom = () => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleTyping = useCallback(() => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    // Send typing event
    socketRef.current.send(JSON.stringify({ type: "typing", is_typing: true }));

    // Clear existing timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Set timeout to clear typing status after delay
    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "typing", is_typing: false }));
      }
    }, 2000);
  }, []);

  const handleSubmit = async (data: MessageFormData) => {
    setIsSubmitting(true);
    try {
      // You can either send via REST or WebSocket. Real-time implementation
      // in Django Channels usually supports both, but often REST is safer for persistence.
      // We'll use the existing onSendMessage (REST) and let the WebSocket broadcast it.
      await onSendMessage(data.message, data.sendNotification);
      form.reset();

      // Clear typing status immediately
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "typing", is_typing: false }));
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const isCurrentUserMessage = (message: ProjectChatMessage) => {
    // Handling both string/number IDs
    return String(message.sender.id) === String(currentUser.id);
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Client Communication</span>
          <Badge variant="outline" className="text-xs">
            {messages.length} messages
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading && messages.length === 0 ? (
            <div className="text-center text-muted-foreground p-4">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground p-4">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${isCurrentUserMessage(message) ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${isCurrentUserMessage(message)
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted'
                    }`}
                >
                  <div className="text-sm font-medium mb-1 flex items-center justify-between gap-4">
                    <span>{message.sender.name || message.sender.email}</span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {message.body}
                  </div>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center gap-2 text-xs">
                          <Paperclip className="h-3 w-3" />
                          <span>Attachment</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-[10px] opacity-70 mt-2 flex items-center justify-between">
                    <span>{formatMessageTime(message.created_at)}</span>
                    {message.edited_at && (
                      <span className="ml-2">(edited)</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Typing Indicators */}
          {Object.entries(isTyping).map(([userId, typing]) =>
            typing && userId !== String(currentUser.id) && (
              <div key={userId} className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 text-xs animate-pulse">
                  Client is typing...
                </div>
              </div>
            )
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t p-4 bg-background">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Type your message to the client..."
                        className="min-h-[80px] resize-none focus-visible:ring-primary"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleTyping();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            form.handleSubmit(handleSubmit)();
                          }
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="sendNotification"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-primary"
                        />
                      </FormControl>
                      <Label className="text-sm flex items-center gap-1 cursor-pointer">
                        {field.value ? (
                          <Bell className="h-3 w-3 text-primary" />
                        ) : (
                          <BellOff className="h-3 w-3 text-muted-foreground" />
                        )}
                        Send notification
                      </Label>
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    disabled
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8"
                    disabled={isSubmitting || !form.watch("message").trim()}
                  >
                    {isSubmitting ? "..." : <Send className="h-4 w-4 mr-1" />}
                    {isSubmitting ? "Sending" : "Send"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
}
