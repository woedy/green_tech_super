import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const INVOICES = [
  { id: "INV-9001", quoteId: "QUO-551", amount: 25000, currency: "USD", status: "unpaid" },
  { id: "INV-9002", quoteId: "QUO-551", amount: 50000, currency: "USD", status: "paid" },
];

const Payments = () => {
  return (
    <Layout>
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl md:text-3xl font-bold">Payments</h1>
        </div>
      </section>
      <section className="py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          {INVOICES.map((inv) => (
            <Card key={inv.id} className="shadow-soft">
              <CardContent className="p-4 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{inv.id} • {inv.currency} {inv.amount.toLocaleString()}</div>
                  <div className="text-muted-foreground">For quote {inv.quoteId} • {inv.status}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={inv.status !== 'unpaid'}>Pay (demo)</Button>
                  <Button variant="outline" size="sm">View</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {INVOICES.length === 0 && (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">No payments yet.</CardContent></Card>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Payments;

