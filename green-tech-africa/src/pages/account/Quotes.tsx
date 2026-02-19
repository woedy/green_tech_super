import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { QuoteSummary } from "@/types/quote";
import AccountPageHeader from "@/components/account/AccountPageHeader";

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
      <AccountPageHeader
        title="Quotes"
        description="Review estimates, monitor status changes, and open full quote details."
        icon={<FileSpreadsheet className="h-3.5 w-3.5" />}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/plans">
              <Plus className="mr-1 h-4 w-4" /> Request New Quote
            </Link>
          </Button>
        }
      />

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          {isLoading && <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading quotes…</CardContent></Card>}
          {error && <Card><CardContent className="p-6 text-sm text-destructive">{error}</CardContent></Card>}
          {!isLoading && !error && visibleQuotes.map((quote) => {
            const badge = STATUS_BADGES[quote.status] || { label: quote.status, variant: "outline" as const };
            return (
              <Card key={quote.id} className="border-border/70 shadow-soft smooth-transition hover:-translate-y-0.5 hover:shadow-medium">
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

