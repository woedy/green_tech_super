import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { QuoteChatMessage, QuoteChatSocketEvent, quoteChatApi } from "@/lib/api";

const MessageThread = () => {
  const { id } = useParams();
  const quoteId = id ?? "";
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<QuoteChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  const meId = user?.id;
  const list = useMemo(
    () => messages,
    [messages]
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!quoteId) return;
      try {
        setIsLoading(true);
        setError(null);
        const data = await quoteChatApi.listMessages(quoteId);
        if (!cancelled) setMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          setMessages([]);
          setError(err instanceof Error ? err.message : "Failed to load messages");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [quoteId]);

  useEffect(() => {
    if (!quoteId) return;
    const socket = quoteChatApi.createQuoteChatSocket(quoteId);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const payload: QuoteChatSocketEvent = JSON.parse(event.data);
        if (payload.type === "typing") {
          setTyping(Boolean(payload.payload.is_typing));
          return;
        }
        if (payload.type === "message") {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.payload.id)) return prev;
            return [...prev, payload.payload];
          });
        }
      } catch {
        // ignore
      }
    };
    socket.onclose = () => {
      socketRef.current = null;
    };

    return () => {
      socket.close();
    };
  }, [quoteId]);

  const sendTyping = (value: string) => {
    setText(value);
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: "typing", is_typing: Boolean(value) }));
  };

  const send = async () => {
    const body = text.trim();
    if (!body || !quoteId) return;
    try {
      const socket = socketRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "message", body }));
      } else {
        const created = await quoteChatApi.sendMessage(quoteId, { body });
        setMessages((prev) => [...prev, created]);
      }
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    }
  };

  return (
    <Layout>
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/account/messages"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Link></Button>
            <h1 className="text-2xl md:text-3xl font-bold">Thread {id}</h1>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-medium">
            <CardHeader><CardTitle>Conversation</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[50vh] overflow-auto pr-2">
                {isLoading && <div className="text-sm text-muted-foreground">Loading messages…</div>}
                {error && <div className="text-sm text-destructive">{error}</div>}
                {!isLoading && !error && list.map((m) => (
                  <MessageBubble key={m.id} message={m} meId={meId} />
                ))}
                {typing && <div className="text-xs text-muted-foreground">Participant is typing…</div>}
                {!isLoading && !error && list.length === 0 && (
                  <div className="text-sm text-muted-foreground">No messages yet. Start the conversation.</div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Input placeholder="Type a message" value={text} onChange={(e) => sendTyping(e.target.value)} onKeyDown={(e) => e.key === 'Enter' ? send() : undefined} />
                <Button onClick={send}>Send</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default MessageThread;

function MessageBubble({ message, meId }: { message: QuoteChatMessage; meId?: number | string }) {
  const isMe = meId !== undefined && String(message.sender?.id ?? "") === String(meId);
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div className={`px-3 py-2 rounded-lg text-sm ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
        <div>{message.body}</div>
        <div className="text-[10px] opacity-70 mt-1 text-right">{formatTime(message.created_at)}</div>
      </div>
    </div>
  );
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

