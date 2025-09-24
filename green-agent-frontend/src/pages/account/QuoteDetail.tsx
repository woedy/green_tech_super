import AgentShell from "@/components/layout/AgentShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const MOCK = {
  id: "QUO-551",
  requestId: "REQ-1017",
  currency: "USD",
  items: [
    { label: "Base construction", qty: 1, unitPrice: 98000 },
    { label: "Solar package", qty: 1, unitPrice: 6000 },
    { label: "Rainwater harvesting", qty: 1, unitPrice: 2500 },
  ],
  taxes: 0.16,
  status: "sent" as const,
};

const QuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const q = { ...MOCK, id: id ?? MOCK.id };
  const sub = q.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const taxAmt = sub * q.taxes;
  const total = sub + taxAmt;

  const accept = () => {
    toast({ title: "Quote accepted (demo)", description: `${q.id} • ${q.currency} ${total.toLocaleString()}` });
    navigate("/projects");
  };

  return (
    <AgentShell>
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Quote {q.id}</h1>
            <div className="text-sm text-muted-foreground">For request {q.requestId}</div>
          </div>
          <div className="text-right">
            <Badge variant="secondary">{q.status}</Badge>
            <div className="text-xl font-semibold mt-1">{q.currency} {total.toLocaleString()}</div>
          </div>
        </div>
      </section>

      <section className="py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {q.items.map((it, i) => (
                  <div key={i} className="grid grid-cols-6 gap-2 p-3 rounded-md bg-muted/30">
                    <div className="col-span-3">{it.label}</div>
                    <div className="text-right">{it.qty}</div>
                    <div className="text-right">{q.currency} {it.unitPrice.toLocaleString()}</div>
                    <div className="text-right font-medium">{q.currency} {(it.unitPrice * it.qty).toLocaleString()}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                This is a demo quote. Terms, payment schedule and validity period would appear here.
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{q.currency} {sub.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Tax ({(q.taxes*100).toFixed(0)}%)</span><span>{q.currency} {taxAmt.toLocaleString()}</span></div>
                <div className="flex justify-between font-semibold text-foreground"><span>Total</span><span>{q.currency} {total.toLocaleString()}</span></div>
                <Button className="w-full mt-2" onClick={accept}>Accept Quote</Button>
                <Button variant="outline" className="w-full" asChild>
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


