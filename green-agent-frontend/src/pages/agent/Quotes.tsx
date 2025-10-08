import AgentShell from "@/components/layout/AgentShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useCallback } from "react";
import { QuoteStatus, QuoteSummary } from "@/types/quote";
import { toast } from "@/components/ui/use-toast";
import { fetchQuotes, sendQuote } from "@/lib/api";
import { asArray } from "@/types/api";
import { Loader2, FileText, Plus } from "lucide-react";

const STATUS_FILTERS: { value: QuoteStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "viewed", label: "Viewed" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
];

const STATUS_BADGES: Record<QuoteStatus, { label: string; variant: "default" | "outline" | "secondary" | "destructive" }> = {
  draft: { label: "Draft", variant: "outline" },
  sent: { label: "Sent", variant: "secondary" },
  viewed: { label: "Viewed", variant: "secondary" },
  accepted: { label: "Accepted", variant: "default" },
  declined: { label: "Declined", variant: "destructive" },
};

export default function AgentQuotes() {
  const [status, setStatus] = useState<QuoteStatus | "all">("all");
  const [sendingQuoteId, setSendingQuoteId] = useState<string | null>(null);

  const { data: quotesResponse, isLoading, error, refetch } = useQuery({
    queryKey: ["quotes", status],
    queryFn: () => fetchQuotes(status === "all" ? {} : { status }),
  });

  const quotes = useMemo(() => asArray(quotesResponse ?? []), [quotesResponse]);

  const formatTotal = useCallback((quote: QuoteSummary) => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: quote.currency_code || "USD",
        maximumFractionDigits: 0,
      }).format(quote.total_amount);
    } catch {
      return `${quote.currency_code} ${quote.total_amount.toLocaleString()}`;
    }
  }, []);

  const handleSend = async (quoteId: string) => {
    setSendingQuoteId(quoteId);
    try {
      await sendQuote(quoteId);
      toast({ title: "Quote sent successfully", description: "Customer has been notified via email." });
      refetch();
    } catch (err) {
      toast({
        title: "Failed to send quote",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSendingQuoteId(null);
    }
  };

  return (
    <AgentShell>
      <section className="py-6 bg-gradient-to-br from-background via-accent/10 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Quotes</h1>
                <p className="text-sm text-muted-foreground">
                  Manage and track all customer quotes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={status} onValueChange={(value) => setStatus(value as QuoteStatus | "all")}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((filter) => (
                    <SelectItem key={filter.value} value={filter.value}>
                      {filter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button asChild>
                <Link to="/quotes/new">
                  <Plus className="w-4 h-4 mr-2" />
                  New Quote
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mt-2">Loading quotes...</p>
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && error && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-6 text-center text-sm text-destructive">
                        {error instanceof Error ? error.message : "Failed to load quotes"}
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && !error && quotes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center">
                        <FileText className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-2" />
                        <p className="text-sm text-muted-foreground">No quotes found.</p>
                        <Button asChild variant="outline" size="sm" className="mt-4">
                          <Link to="/quotes/new">Create your first quote</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && !error && quotes.map((quote) => {
                    const badge = STATUS_BADGES[quote.status];
                    return (
                      <TableRow key={quote.id}>
                        <TableCell>{quote.reference}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{quote.plan_name}</span>
                            <span className="text-xs text-muted-foreground">Lead • {quote.build_request_summary.contact.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatTotal(quote)}</TableCell>
                        <TableCell>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{quote.customer_name}</span>
                            <span className="text-xs text-muted-foreground">{quote.customer_email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {quote.sent_at ? new Date(quote.sent_at).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button asChild variant="outline" size="sm">
                            <Link to={`/quotes/${quote.id}`}>View</Link>
                          </Button>
                          {quote.status === 'draft' && (
                            <Button 
                              variant="default" 
                              size="sm" 
                              onClick={() => handleSend(quote.id)}
                              disabled={sendingQuoteId === quote.id}
                            >
                              {sendingQuoteId === quote.id && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                              Send
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </section>
    </AgentShell>
  );
}

