import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParams, Link } from "react-router-dom";
import { LEADS } from "@/mocks/agent";

const LeadDetail = () => {
  const { id } = useParams();
  const lead = LEADS.find(l => l.id === id) ?? LEADS[0];
  const quoteNewHref = `/quotes/new?lead=${encodeURIComponent(lead.id)}${lead.requestId ? `&request=${encodeURIComponent(lead.requestId)}` : ''}`;

  return (
    <Layout>
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Lead {lead.id}</h1>
          <Button asChild variant="outline"><Link to="/leads">Back</Link></Button>
        </div>
      </section>
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
              <CardContent className="text-sm">
                <div className="mb-2"><span className="text-muted-foreground">Title:</span> {lead.title}</div>
                <div className="mb-2"><span className="text-muted-foreground">From:</span> {lead.from}</div>
                <div className="mb-2"><span className="text-muted-foreground">Type:</span> {lead.type}</div>
                <div className="mb-2"><span className="text-muted-foreground">Received:</span> {lead.receivedAt}</div>
                {lead.requestId && (<div className="mb-2"><span className="text-muted-foreground">Request:</span> {lead.requestId}</div>)}
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" asChild><Link to={quoteNewHref}>Create Quote</Link></Button>
                <Button variant="outline" className="w-full" asChild><Link to="/messages">Open Conversation</Link></Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default LeadDetail;
