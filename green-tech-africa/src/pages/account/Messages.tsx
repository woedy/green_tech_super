import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api, quoteChatApi, QuoteChatMessage } from "@/lib/api";
import type { QuoteSummary } from "@/types/quote";

type Thread = {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
  updatedAtRaw: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

const Messages = () => {
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user?.email) return;
      try {
        setIsLoading(true);
        setError(null);

        const payload = await api.get<{ results?: QuoteSummary[] }>(
          `/api/quotes/?customer_email=${encodeURIComponent(user.email)}`
        );
        const quotes: QuoteSummary[] = Array.isArray(payload?.results) ? payload.results : [];

        const enriched = await Promise.all(
          quotes.map(async (quote) => {
            let last: QuoteChatMessage | null = null;
            try {
              const msgs = await quoteChatApi.listMessages(quote.id);
              if (Array.isArray(msgs) && msgs.length) {
                last = msgs[msgs.length - 1];
              }
            } catch {
              last = null;
            }

            return {
              id: quote.id,
              title: `Quote ${quote.reference}`,
              lastMessage: last?.body ?? "No messages yet.",
              updatedAtRaw: last?.created_at ?? quote.updated_at ?? quote.created_at,
              updatedAt: formatDate(last?.created_at ?? quote.updated_at ?? quote.created_at),
            } satisfies Thread;
          })
        );

        if (!cancelled) {
          setThreads(
            enriched.sort((a, b) => new Date(b.updatedAtRaw).getTime() - new Date(a.updatedAtRaw).getTime())
          );
        }
      } catch (err) {
        if (!cancelled) {
          setThreads([]);
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
  }, [user?.email]);

  const filtered = useMemo(
    () => threads.filter((t) => t.title.toLowerCase().includes(search.toLowerCase())),
    [threads, search]
  );

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
          {isLoading && (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">Loading conversations…</CardContent>
            </Card>
          )}
          {error && (
            <Card>
              <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
            </Card>
          )}
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
          {!isLoading && !error && filtered.length === 0 && (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">No conversations found.</CardContent></Card>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Messages;

