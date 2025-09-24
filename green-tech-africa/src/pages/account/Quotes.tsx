import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Filter } from "lucide-react";
import { Link } from "react-router-dom";

type Quote = {
  id: string;
  requestId: string;
  total: number;
  currency: string;
  status: "draft" | "sent" | "accepted" | "expired";
  sentAt?: string;
};

const QUOTES: Quote[] = [
  { id: "QUO-551", requestId: "REQ-1017", total: 125000, currency: "USD", status: "sent", sentAt: "2025-03-09" },
  { id: "QUO-552", requestId: "REQ-1024", total: 152400, currency: "USD", status: "draft" },
];

const label = (s: Quote["status"]) => {
  switch (s) {
    case "sent": return { label: "Sent", variant: "secondary" as const };
    case "accepted": return { label: "Accepted", variant: "default" as const };
    case "expired": return { label: "Expired", variant: "secondary" as const };
    default: return { label: "Draft", variant: "outline" as const };
  }
};

const Quotes = () => {
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
          {QUOTES.map((q) => (
            <Card key={q.id} className="shadow-soft hover:shadow-medium smooth-transition">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{q.id} • {q.currency} {q.total.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">For {q.requestId}{q.sentAt ? ` • sent ${q.sentAt}` : ""}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={label(q.status).variant}>{label(q.status).label}</Badge>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/account/quotes/${q.id}`}>Open</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {QUOTES.length === 0 && (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">No quotes yet.</CardContent></Card>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Quotes;

