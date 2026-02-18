import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useRef, useState } from "react";
import { quoteChatApi } from "@/lib/api";
import { ProjectChatMessage, ProjectChatSocketEvent } from "@/types/chat";
import { Loader2 } from "lucide-react";

interface QuoteChatProps {
    quoteId: string;
}

export function QuoteChat({ quoteId }: QuoteChatProps) {
    const [text, setText] = useState("");
    const [messages, setMessages] = useState<ProjectChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [typing, setTyping] = useState(false);
    const socketRef = useRef<WebSocket | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

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
                const payload: ProjectChatSocketEvent = JSON.parse(event.data);
                if (payload.type === "typing") {
                    setTyping(payload.payload.is_typing);
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
        <Card className="shadow-medium h-full flex flex-col">
            <CardHeader className="py-3"><CardTitle className="text-lg">Customer Conversation</CardTitle></CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
                <div ref={scrollRef} className="flex-1 space-y-3 overflow-auto pr-2 min-h-[300px]">
                    {isLoading && <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading messages…</div>}
                    {error && <div className="text-sm text-destructive">{error}</div>}
                    {!isLoading && !error && messages.map((m) => (
                        <MessageBubble key={m.id} message={m} />
                    ))}
                    {typing && <div className="text-xs text-muted-foreground">Customer is typing…</div>}
                    {!isLoading && !error && messages.length === 0 && (
                        <div className="text-sm text-muted-foreground h-full flex items-center justify-center">No messages yet. Send a message to the customer.</div>
                    )}
                </div>
                <div className="flex items-center gap-2 mt-auto">
                    <Input
                        placeholder="Type a message..."
                        value={text}
                        onChange={(e) => sendTyping(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' ? send() : undefined}
                    />
                    <Button onClick={send} size="sm">Send</Button>
                </div>
            </CardContent>
        </Card>
    );
}

function MessageBubble({ message }: { message: ProjectChatMessage }) {
    // Simple check: if sender name mentions "Agent", it's likely from the agent side
    const isMe = message.sender?.name?.toLowerCase().includes("agent") ?? false;
    return (
        <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
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
