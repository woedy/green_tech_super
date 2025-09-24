import AgentShell from "@/components/layout/AgentShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

type Message = { id: string; author: "me" | "agent"; body: string; createdAt: string };
const MOCK: Message[] = [
  { id: "m1", author: "agent", body: "Hello! Thanks for your request.", createdAt: "09:00" },
  { id: "m2", author: "me", body: "Thanks. Can you include solar?", createdAt: "09:05" },
  { id: "m3", author: "agent", body: "Yes, I’ll add the package to the quote.", createdAt: "09:07" },
];

const MessageThread = () => {
  const { id } = useParams();
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>(MOCK);

  const send = () => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), author: "me", body: text.trim(), createdAt: new Date().toLocaleTimeString() }]);
    setText("");
  };

  return (
    <AgentShell>
      <section className="py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/messages"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Link></Button>
            <h1 className="text-2xl font-bold">Thread {id}</h1>
          </div>
        </div>
      </section>

      <section className="py-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-medium">
            <CardHeader><CardTitle>Conversation</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[50vh] overflow-auto pr-2">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.author === "me" ? "justify-end" : "justify-start"}`}>
                    <div className={`px-3 py-2 rounded-lg text-sm ${m.author === "me" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <div>{m.body}</div>
                      <div className="text-[10px] opacity-70 mt-1 text-right">{m.createdAt}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Input placeholder="Type a message" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' ? send() : undefined} />
                <Button onClick={send}>Send</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </AgentShell>
  );
};

export default MessageThread;
