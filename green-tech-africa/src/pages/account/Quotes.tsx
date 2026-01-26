import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { QuoteSummary, QuoteStatus } from "@/types/quote";

const STATUS_BADGES: Record<string, { label: string; variant: "default" | "outline" | "secondary" | "destructive" }> = {
  draft: { label: "Draft", variant: "outline" },
  DRAFT: { label: "Draft", variant: "outline" },
  sent: { label: "Sent", variant: "secondary" },
  SENT: { label: "Sent", variant: "secondary" },
  viewed: { label: "Viewed", variant: "secondary" },
  VIEWED: { label: "Viewed", variant: "secondary" },
  accepted: { label: "Accepted", variant: "default" },
  ACCEPTED: { label: "Accepted", variant: "default" },
  declined: { label: "Declined", variant: "destructive" },
  DECLINED: { label: "Declined", variant: "destructive" },
};

const formatCurrency = (currency: string, amount: number) => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
};

const Quotes = () => {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<QuoteSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user?.email) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const payload = await api.get<{ results?: QuoteSummary[] }>(`/api/quotes/?customer_email=${encodeURIComponent(user.email)}`);
        
        if (!cancelled) {
          const results: QuoteSummary[] = Array.isArray(payload?.results) ? payload.results : [];
          const sorted = results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setQuotes(sorted);
        }
      } catch (err) {
        console.error("Failed to load quotes:", err);
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load quotes";
          setError(message);
          setQuotes([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  const visibleQuotes = useMemo(() => quotes, [quotes]);

  return (
    <Layout>
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6" />
            <h1 className="text-2xl md:text-3xl font-bold">Quotes</h1>
          </div>
          <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-1" /> Filters</Button>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          {isLoading && <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading quotes…</CardContent></Card>}
          {error && <Card><CardContent className="p-6 text-sm text-destructive">{error}</CardContent></Card>}
          {!isLoading && !error && visibleQuotes.map((quote) => {
            const badge = STATUS_BADGES[quote.status] || { label: quote.status, variant: "outline" as const };
            return (
              <Card key={quote.id} className="shadow-soft hover:shadow-medium smooth-transition">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{quote.reference} • {formatCurrency(quote.currency_code, quote.total_amount)}</div>
                    <div className="text-xs text-muted-foreground">
                      {quote.plan_name}{quote.sent_at ? ` • sent ${new Date(quote.sent_at).toLocaleDateString()}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/account/quotes/${quote.id}`}>Open</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {!isLoading && !error && visibleQuotes.length === 0 && (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">No quotes yet.</CardContent></Card>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Quotes;

