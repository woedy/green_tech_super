import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useParams, Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { QuoteDetail as QuoteDetailType, QuoteStatus } from "@/types/quote";

const STATUS_BADGES: Record<QuoteStatus, { label: string; variant: "default" | "outline" | "secondary" | "destructive" }> = {
  draft: { label: "Draft", variant: "outline" },
  sent: { label: "Sent", variant: "secondary" },
  viewed: { label: "Viewed", variant: "secondary" },
  accepted: { label: "Accepted", variant: "default" },
  declined: { label: "Declined", variant: "destructive" },
};

const formatCurrency = (currency: string, amount: number) => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
};

const QuoteDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();

  const [quote, setQuote] = useState<QuoteDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signatureName, setSignatureName] = useState("");
  const [signatureEmail, setSignatureEmail] = useState("");
  const hasMarkedView = useRef(false);

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
      setSignatureName((prev) => prev || data.recipient_name || user?.name || "");
      setSignatureEmail((prev) => prev || data.recipient_email || user?.email || "");
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load quote";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [id, user?.email, user?.name]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  useEffect(() => {
    if (!quote || hasMarkedView.current) return;
    hasMarkedView.current = true;
    const markViewed = async () => {
      try {
        const response = await fetch(`/api/quotes/${quote.id}/view/`, { method: "POST" });
        if (response.ok) {
          const payload = (await response.json()) as QuoteDetailType;
          setQuote(payload);
        }
      } catch (err) {
        console.error("Failed to mark quote as viewed", err);
      }
    };
    markViewed();
  }, [quote]);

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

  const canAccept = quote ? ["sent", "viewed"].includes(quote.status) : false;

  const handleAccept = async () => {
    if (!quote || !canAccept) return;
    if (!signatureName.trim()) {
      toast({ title: "Signature required", description: "Please provide your full name to sign.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/quotes/${quote.id}/accept/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature_name: signatureName.trim(), signature_email: signatureEmail.trim() || undefined }),
      });
      if (!response.ok) {
        throw new Error(`Unable to accept quote (${response.status})`);
      }
      const payload = (await response.json()) as QuoteDetailType;
      setQuote(payload);
      toast({ title: "Quote accepted", description: `Thanks for signing ${payload.reference}.` });
    } catch (err) {
      toast({
        title: "Failed to accept quote",
        description: err instanceof Error ? err.message : "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Quote {quote?.reference ?? id}</h1>
            <div className="text-sm text-muted-foreground">
              {quote?.build_request_summary ? (
                <>
                  For request {quote.build_request_summary.id} • {quote.plan_name}
                </>
              ) : (
                ""
              )}
            </div>
          </div>
          <div className="text-right space-y-1">
            {quote && (
              <Badge variant={STATUS_BADGES[quote.status].variant}>{STATUS_BADGES[quote.status].label}</Badge>
            )}
            {quote && (
              <div className="text-xl font-semibold">
                {formatCurrency(quote.currency_code, quote.total_amount)}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {isLoading && (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">Loading quote…</CardContent>
            </Card>
          )}
          {error && (
            <Card>
              <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
            </Card>
          )}

          {quote && !isLoading && !error && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {quote.items.map((item) => (
                      <div key={item.id} className="grid grid-cols-6 gap-2 p-3 rounded-md bg-muted/30">
                        <div className="col-span-3">
                          <div className="font-medium">{item.label}</div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">{item.kind}</div>
                        </div>
                        <div className="text-right">{item.quantity}</div>
                        <div className="text-right">{formatCurrency(quote.currency_code, item.unit_cost)}</div>
                        <div className="text-right font-medium">{formatCurrency(quote.currency_code, item.calculated_total)}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Customer Document</CardTitle></CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: quote.document_html }} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {quote.timeline.length === 0 && (
                      <div className="text-muted-foreground">No updates yet.</div>
                    )}
                    {quote.timeline.map((entry) => (
                      <div key={`${entry.status}-${entry.timestamp}`} className="flex justify-between">
                        <span>{entry.label}</span>
                        <span className="text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(quote.currency_code, totals.subtotal)}</span></div>
                    <div className="flex justify-between"><span>Allowances</span><span>{formatCurrency(quote.currency_code, totals.allowances)}</span></div>
                    <div className="flex justify-between"><span>Adjustments</span><span>{formatCurrency(quote.currency_code, totals.adjustments)}</span></div>
                    <div className="flex justify-between font-semibold text-foreground"><span>Total</span><span>{formatCurrency(quote.currency_code, totals.total)}</span></div>
                    <div className="text-xs text-muted-foreground pt-2">Valid until {new Date(quote.valid_until).toLocaleDateString()}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Sign & Accept</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="space-y-1">
                      <Label htmlFor="signature-name">Full name</Label>
                      <Input
                        id="signature-name"
                        value={signatureName}
                        onChange={(event) => setSignatureName(event.target.value)}
                        placeholder="Jane Customer"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="signature-email">Email</Label>
                      <Input
                        id="signature-email"
                        type="email"
                        value={signatureEmail}
                        onChange={(event) => setSignatureEmail(event.target.value)}
                        placeholder="you@example.com"
                      />
                    </div>
                    <Button className="w-full" onClick={handleAccept} disabled={!canAccept || isSubmitting}>
                      {quote.status === "accepted" ? "Quote accepted" : "Accept & sign"}
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/account/quotes">Back to quotes</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default QuoteDetail;

