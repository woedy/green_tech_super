import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const THREADS = [
  { id: "T-1", title: "Quote QUO-551", lastMessage: "Please confirm the solar package.", updatedAt: "2025-03-10" },
  { id: "T-2", title: "Project PRJ-88", lastMessage: "Foundation pour scheduled for Friday.", updatedAt: "2025-03-09" },
];

const Messages = () => {
  const [search, setSearch] = useState("");
  const filtered = THREADS.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout>
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            <h1 className="text-2xl md:text-3xl font-bold">Messages</h1>
          </div>
          <div className="w-64">
            <Input placeholder="Search threads..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          {filtered.map((t) => (
            <Card key={t.id} className="shadow-soft hover:shadow-medium smooth-transition">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">{t.lastMessage} • {t.updatedAt}</div>
                </div>
                <Button asChild variant="outline" size="sm"><Link to={`/account/messages/${t.id}`}>Open</Link></Button>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">No conversations found.</CardContent></Card>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Messages;

