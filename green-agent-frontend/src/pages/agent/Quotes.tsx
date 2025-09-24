import AgentShell from "@/components/layout/AgentShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { AGENT_QUOTES_SEED, type AgentQuote } from "@/mocks/agent";

const STORAGE_KEY = 'agent_quotes';

const label = (s: AgentQuote["status"]) => {
  switch (s) {
    case "sent": return { label: "Sent", variant: "secondary" as const };
    case "accepted": return { label: "Accepted", variant: "default" as const };
    case "expired": return { label: "Expired", variant: "secondary" as const };
    default: return { label: "Draft", variant: "outline" as const };
  }
};

export default function AgentQuotes() {
  const [status, setStatus] = useState<string>('all');
  const [quotes, setQuotes] = useState<AgentQuote[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const local = raw ? (JSON.parse(raw) as AgentQuote[]) : [];
      setQuotes([...local, ...AGENT_QUOTES_SEED]);
    } catch {
      setQuotes([...AGENT_QUOTES_SEED]);
    }
  }, []);

  const rows = useMemo(() => quotes.filter(q => status === 'all' ? true : q.status === (status as any)), [quotes, status]);

  const send = (id: string) => setQuotes(qs => qs.map(q => q.id === id ? ({ ...q, status: 'sent', sentAt: new Date().toISOString().slice(0,10) }) : q));
  const duplicate = (id: string) => setQuotes(qs => {
    const orig = qs.find(q => q.id === id);
    if (!orig) return qs;
    const dup: AgentQuote = { ...orig, id: `QUO-${Math.floor(Math.random()*900+100)}`, status: 'draft', sentAt: undefined };
    const next = [dup, ...qs];
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    return next;
  });
  const download = () => alert('Download started (demo)');

  return (
    <AgentShell>
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Quotes</h1>
          <div className="flex items-center gap-2">
            <Button asChild size="sm"><Link to="/quotes/new">New Quote</Link></Button>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
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
                    <TableHead>ID</TableHead>
                    <TableHead>Request</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell>{q.id}</TableCell>
                      <TableCell>{q.requestId ?? '—'}</TableCell>
                      <TableCell>{q.currency} {q.total.toLocaleString()}</TableCell>
                      <TableCell><Badge variant={label(q.status).variant}>{label(q.status).label}</Badge></TableCell>
                      <TableCell className="text-muted-foreground text-sm">{q.sentAt ?? '—'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button asChild variant="outline" size="sm"><Link to={`/quotes/${q.id}`}>Open</Link></Button>
                        <Button variant="outline" size="sm" onClick={() => send(q.id)}>Send</Button>
                        <Button variant="outline" size="sm" onClick={() => duplicate(q.id)}>Duplicate</Button>
                        <Button variant="outline" size="sm" onClick={download}>Download</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </section>
    </AgentShell>
  );
}

