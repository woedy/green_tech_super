import AgentShell from "@/components/layout/AgentShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { QuoteStatus, QuoteSummary } from "@/types/quote";
import { toast } from "@/components/ui/use-toast";

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
  const [quotes, setQuotes] = useState<QuoteSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = status === "all" ? "" : `&status=${status}`;
      const response = await fetch(`/api/quotes/?page_size=200${query}`);
      if (!response.ok) {
        throw new Error(`Failed to load quotes (${response.status})`);
      }
      const data = await response.json();
      setQuotes((data.results ?? []) as QuoteSummary[]);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load quotes";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

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
    try {
      const response = await fetch(`/api/quotes/${quoteId}/send/`, { method: "POST" });
      if (!response.ok) {
        throw new Error(`Unable to send quote (${response.status})`);
      }
      toast({ title: "Quote sent", description: "Customer has been notified." });
      fetchQuotes();
    } catch (err) {
      toast({
        title: "Failed to send quote",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const filtered = useMemo(() => quotes, [quotes]);

  return (
    <AgentShell>
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Quotes</h1>
          <div className="flex items-center gap-2">
            <Button asChild size="sm"><Link to="/quotes/new">New Quote</Link></Button>
            <Select value={status} onValueChange={(value) => setStatus(value as QuoteStatus | "all")}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>{filter.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                      <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                        Loading quotes…
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && error && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-6 text-center text-sm text-destructive">
                        {error}
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && !error && filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                        No quotes yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && !error && filtered.map((quote) => {
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
                          <Button asChild variant="outline" size="sm"><Link to={`/quotes/${quote.id}`}>Open</Link></Button>
                          {(quote.status === 'draft' || quote.status === 'viewed') && (
                            <Button variant="outline" size="sm" onClick={() => handleSend(quote.id)}>Send</Button>
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

