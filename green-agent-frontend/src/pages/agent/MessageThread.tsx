import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Paperclip } from "lucide-react";

import AgentShell from "@/components/layout/AgentShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createProjectChatSocket, fetchProjectChatMessages, postProjectChatMessage, ProjectChatSocketEvent } from "@/lib/api";
import { ProjectChatMessage } from "@/types/chat";

export default function MessageThread() {
  const { id } = useParams();
  const projectId = id ?? "";
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<ProjectChatMessage[]>([]);

  const { data } = useQuery({
    queryKey: ["project-chat", projectId],
    queryFn: () => fetchProjectChatMessages(projectId),
    enabled: Boolean(projectId),
  });

  useEffect(() => {
    if (!data) return;
    const list = Array.isArray((data as any).results) ? (data as any).results : data;
    setMessages(list as ProjectChatMessage[]);
  }, [data]);

  useEffect(() => {
    if (!projectId) return;
    const socket = createProjectChatSocket(projectId);
    socketRef.current = socket;
    socket.onmessage = (event) => {
      try {
        const payload: ProjectChatSocketEvent = JSON.parse(event.data);
        if (payload.type === "typing") {
          setTypingIndicator(payload.payload.is_typing);
        } else if (payload.type === "message") {
          setMessages((prev) => [...prev, payload.payload]);
        }
      } catch (error) {
        console.error("Failed to parse chat event", error);
      }
    };
    socket.onclose = () => {
      socketRef.current = null;
    };
    return () => {
      socket.close();
    };
  }, [projectId]);

  const onTyping = (value: string) => {
    setText(value);
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({ type: "typing", is_typing: Boolean(value) }));
  };

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    try {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "message", body }));
      } else {
        const created = await postProjectChatMessage(projectId, { body });
        setMessages((prev) => [...prev, created]);
      }
      setText("");
      setFileName(null);
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  return (
    <AgentShell>
      <section className="py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/messages"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Link></Button>
            <h1 className="text-2xl font-bold">Thread {projectId}</h1>
          </div>
        </div>
      </section>

      <section className="py-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-medium">
            <CardHeader><CardTitle>Conversation</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[50vh] overflow-auto pr-2">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {typingIndicator && (
                  <div className="text-xs text-muted-foreground">Participant is typing…</div>
                )}
                {!messages.length && <div className="text-sm text-muted-foreground">No messages yet. Start the conversation.</div>}
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input id="attach" type="file" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)} />
                <Button variant="outline" size="icon" onClick={() => document.getElementById('attach')?.click()} title="Attach file"><Paperclip className="w-4 h-4" /></Button>
                {fileName && <span className="text-xs text-muted-foreground truncate max-w-[150px]">{fileName}</span>}
                <Input
                  placeholder="Type a message"
                  value={text}
                  onChange={(e) => onTyping(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' ? send() : undefined}
                />
                <Button onClick={send}>Send</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </AgentShell>
  );
}

function MessageBubble({ message }: { message: ProjectChatMessage }) {
  const isMe = message.sender?.name?.toLowerCase().includes("agent") ?? false;
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div className={`px-3 py-2 rounded-lg text-sm ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
        <div>{message.body}</div>
        <div className="text-[10px] opacity-70 mt-1 text-right">{formatDate(message.created_at)}</div>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

