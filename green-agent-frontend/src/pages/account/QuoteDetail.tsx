import AgentShell from "@/components/layout/AgentShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useParams, Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import type { QuoteDetail as QuoteDetailType, QuoteStatus } from "@/types/quote";

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  accepted: "Accepted",
  declined: "Declined",
};

const formatCurrency = (currency: string, amount: number) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
};

const QuoteDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [quote, setQuote] = useState<QuoteDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/quotes/${id}/`);
      if (!response.ok) {
        throw new Error(`Unable to load quote (${response.status})`);
      }
      const data = (await response.json()) as QuoteDetailType;
      setQuote(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load quote";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const actionsDisabled = isLoading || !quote;

  const handleSend = async () => {
    if (!quote) return;
    try {
      const response = await fetch(`/api/quotes/${quote.id}/send/`, { method: "POST" });
      if (!response.ok) {
        throw new Error(`Unable to send quote (${response.status})`);
      }
      toast({ title: "Quote sent", description: "Customer will be notified." });
      fetchQuote();
    } catch (err) {
      toast({
        title: "Failed to send quote",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleViewed = async () => {
    if (!quote) return;
    try {
      const response = await fetch(`/api/quotes/${quote.id}/view/`, { method: "POST" });
      if (!response.ok) {
        throw new Error(`Unable to record view (${response.status})`);
      }
      toast({ title: "Quote marked as viewed" });
      fetchQuote();
    } catch (err) {
      toast({
        title: "Failed to mark viewed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleAccept = async () => {
    if (!quote) return;
    const signatureName = window.prompt("Customer signature name", quote.recipient_name || "");
    if (!signatureName) return;
    try {
      const response = await fetch(`/api/quotes/${quote.id}/accept/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature_name: signatureName, signature_email: quote.recipient_email }),
      });
      if (!response.ok) {
        throw new Error(`Unable to record acceptance (${response.status})`);
      }
      toast({ title: "Quote accepted", description: `Signed by ${signatureName}` });
      fetchQuote();
    } catch (err) {
      toast({
        title: "Failed to record acceptance",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const totals = useMemo(() => {
    if (!quote) {
      return { subtotal: 0, allowances: 0, adjustments: 0, total: 0 };
    }
    return {
      subtotal: quote.subtotal_amount,
      allowances: quote.allowance_amount,
      adjustments: quote.adjustment_amount,
      total: quote.total_amount,
    };
  }, [quote]);

  return (
    <AgentShell>
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Quote {quote?.reference ?? id}</h1>
            <div className="text-sm text-muted-foreground">Build request {quote?.build_request_summary?.id ?? "—"}</div>
          </div>
          <div className="text-right space-y-1">
            {quote && <Badge variant="secondary">{STATUS_LABELS[quote.status]}</Badge>}
            {quote && (
              <div className="text-xl font-semibold">
                {formatCurrency(quote.currency_code, quote.total_amount)}
              </div>
            )}
          </div>
        </div>
      </section>

      {error && (
        <section className="py-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-destructive">{error}</div>
        </section>
      )}

      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Line items</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {quote?.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-6 gap-2 rounded-md border p-3">
                    <div className="col-span-3">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">{item.kind}</div>
                    </div>
                    <div className="text-right">{item.quantity}</div>
                    <div className="text-right">{formatCurrency(quote.currency_code, item.unit_cost)}</div>
                    <div className="text-right font-semibold">{formatCurrency(quote.currency_code, item.calculated_total)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Customer-facing preview</CardTitle></CardHeader>
              <CardContent>
                {quote ? (
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: quote.document_html }} />
                ) : (
                  <div className="text-sm text-muted-foreground">Loading quote document…</div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(quote?.currency_code ?? "USD", totals.subtotal)}</span></div>
                <div className="flex justify-between"><span>Allowances</span><span>{formatCurrency(quote?.currency_code ?? "USD", totals.allowances)}</span></div>
                <div className="flex justify-between"><span>Adjustments</span><span>{formatCurrency(quote?.currency_code ?? "USD", totals.adjustments)}</span></div>
                <div className="flex justify-between font-semibold text-foreground"><span>Total</span><span>{formatCurrency(quote?.currency_code ?? "USD", totals.total)}</span></div>
                <div className="text-xs text-muted-foreground pt-2">Valid until {quote ? new Date(quote.valid_until).toLocaleDateString() : "—"}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {quote?.timeline.map((entry) => (
                  <div key={`${entry.status}-${entry.timestamp}`} className="flex justify-between">
                    <span>{entry.label}</span>
                    <span className="text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={handleSend} disabled={actionsDisabled || (quote?.status === "accepted" || quote?.status === "declined")}>Send to customer</Button>
                <Button variant="outline" onClick={handleViewed} disabled={actionsDisabled}>Mark as viewed</Button>
                <Button variant="outline" onClick={handleAccept} disabled={actionsDisabled}>Record acceptance</Button>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/quotes">Back to quotes</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </AgentShell>
  );
};

export default QuoteDetail;
