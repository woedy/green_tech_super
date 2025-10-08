import AgentShell from "@/components/layout/AgentShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useParams, Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { QuoteVersionHistory } from "@/components/quotes/QuoteVersionHistory";
import { fetchQuoteDetail, sendQuote, markQuoteViewed, acceptQuote, declineQuote } from "@/lib/api";
import { Loader2, Send, Eye, CheckCircle2, XCircle, FileText, AlertCircle } from "lucide-react";
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
      const data = await fetchQuoteDetail(id);
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

  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleSend = async () => {
    if (!quote) return;
    setIsActionLoading(true);
    try {
      await sendQuote(quote.id);
      toast({ 
        title: "Quote sent successfully", 
        description: "Customer has been notified via email." 
      });
      fetchQuote();
    } catch (err) {
      toast({
        title: "Failed to send quote",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleViewed = async () => {
    if (!quote) return;
    setIsActionLoading(true);
    try {
      await markQuoteViewed(quote.id);
      toast({ title: "Quote marked as viewed" });
      fetchQuote();
    } catch (err) {
      toast({
        title: "Failed to mark viewed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!quote) return;
    const signatureName = window.prompt("Customer signature name", quote.recipient_name || "");
    if (!signatureName) return;
    setIsActionLoading(true);
    try {
      await acceptQuote(quote.id, { 
        signature_name: signatureName, 
        signature_email: quote.recipient_email 
      });
      toast({ 
        title: "Quote accepted", 
        description: `Signed by ${signatureName}. Project can now begin.` 
      });
      fetchQuote();
    } catch (err) {
      toast({
        title: "Failed to record acceptance",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!quote) return;
    if (!window.confirm("Are you sure you want to decline this quote?")) return;
    setIsActionLoading(true);
    try {
      await declineQuote(quote.id);
      toast({ 
        title: "Quote declined", 
        description: "Quote has been marked as declined." 
      });
      fetchQuote();
    } catch (err) {
      toast({
        title: "Failed to decline quote",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
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

  if (isLoading) {
    return (
      <AgentShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AgentShell>
    );
  }

  return (
    <AgentShell>
      <section className="py-6 bg-gradient-to-br from-background via-accent/10 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold">Quote {quote?.reference ?? id}</h1>
                  <div className="text-sm text-muted-foreground">
                    Build request: {quote?.build_request_summary?.id ?? "—"}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {quote && (
                <>
                  <Badge variant="secondary" className="text-sm">
                    {STATUS_LABELS[quote.status]}
                  </Badge>
                  <div className="text-2xl font-bold">
                    {formatCurrency(quote.currency_code, quote.total_amount)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Valid until {new Date(quote.valid_until).toLocaleDateString()}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {error && (
        <section className="py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
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

            {quote && quote.timeline.length > 0 && (
              <QuoteVersionHistory timeline={quote.timeline} currentStatus={quote.status} />
            )}

            <Card>
              <CardHeader><CardTitle>Quote Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {quote?.status === "draft" && (
                  <Button 
                    onClick={handleSend} 
                    disabled={isActionLoading} 
                    className="w-full"
                  >
                    {isActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Send to Customer
                  </Button>
                )}
                {(quote?.status === "sent" || quote?.status === "viewed") && (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={handleViewed} 
                      disabled={isActionLoading}
                      className="w-full"
                    >
                      {isActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                      Mark as Viewed
                    </Button>
                    <Button 
                      onClick={handleAccept} 
                      disabled={isActionLoading}
                      className="w-full"
                    >
                      {isActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Record Acceptance
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDecline} 
                      disabled={isActionLoading}
                      className="w-full"
                    >
                      {isActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                      Decline Quote
                    </Button>
                  </>
                )}
                {quote?.status === "accepted" && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Quote accepted. Project can now begin.
                    </AlertDescription>
                  </Alert>
                )}
                {quote?.status === "declined" && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      Quote was declined by customer.
                    </AlertDescription>
                  </Alert>
                )}
                <Button variant="outline" asChild className="w-full">
                  <Link to="/quotes">Back to Quotes</Link>
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
