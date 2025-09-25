import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import AgentShell from "@/components/layout/AgentShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AGENT_PROJECTS_SEED, EVENTS } from "@/mocks/agent";
import { Lead } from "@/types/lead";
import { QuoteSummary } from "@/types/quote";

const Dashboard = () => {
  const [leadCount, setLeadCount] = useState(0);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [recentQuotes, setRecentQuotes] = useState<QuoteSummary[]>([]);

  useEffect(() => {
    const loadLeads = async () => {
      try {
        const response = await fetch("/api/leads/?page_size=5");
        if (!response.ok) return;
        const payload = await response.json();
        const results: Lead[] = payload.results ?? payload;
        setLeadCount(payload.count ?? results.length ?? 0);
        setRecentLeads(results);
      } catch (err) {
        console.error("Failed to load recent leads", err);
      }
    };
    loadLeads();
  }, []);

  useEffect(() => {
    const loadQuotes = async () => {
      try {
        const response = await fetch("/api/quotes/?page_size=5");
        if (!response.ok) return;
        const payload = await response.json();
        const results: QuoteSummary[] = payload.results ?? [];
        const sorted = results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setRecentQuotes(sorted);
      } catch (err) {
        console.error("Failed to load recent quotes", err);
      }
    };
    loadQuotes();
  }, []);

  const quotesSent = recentQuotes.filter((quote) => quote.status === "sent" || quote.status === "viewed").length;

  const kpis = {
    leads: leadCount,
    quotesSent,
    activeProjects: AGENT_PROJECTS_SEED.filter(p => p.status === "in_progress").length,
    events: EVENTS.length,
  };

  return (
    <AgentShell>
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Agent Dashboard</h1>
              <p className="text-muted-foreground">Quick access to leads, quotes, and projects.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild><Link to="/quotes/new">Create Quote</Link></Button>
              <Button asChild variant="outline"><Link to="/calendar">View Calendar</Link></Button>
            </div>
          </div>
        </div>
      </section>
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Leads</div><div className="text-2xl font-bold">{kpis.leads}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Quotes (sent)</div><div className="text-2xl font-bold">{kpis.quotesSent}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Active Projects</div><div className="text-2xl font-bold">{kpis.activeProjects}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Events</div><div className="text-2xl font-bold">{kpis.events}</div></CardContent></Card>
        </div>
      </section>
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Recent Leads</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30">
                  <div>
                    <div className="font-medium">{lead.title}</div>
                    <div className="text-muted-foreground text-xs">
                      {lead.contact_name} • {lead.contact_email}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Updated {lead.last_activity_at ? new Date(lead.last_activity_at).toLocaleString() : "—"}
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm"><Link to={`/leads/${lead.id}`}>Open</Link></Button>
                </div>
              ))}
              {!recentLeads.length && <div className="text-muted-foreground text-sm">No recent leads yet.</div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Recent Quotes</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {recentQuotes.map((quote) => (
                <div key={quote.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30">
                  <div>
                    <div className="font-medium">{quote.reference} • {quote.currency_code} {quote.total_amount.toLocaleString()}</div>
                    <div className="text-muted-foreground text-xs">{quote.status_display}{quote.sent_at ? ` • sent ${new Date(quote.sent_at).toLocaleDateString()}` : ""}</div>
                  </div>
                  <Button asChild variant="outline" size="sm"><Link to={`/quotes/${quote.id}`}>Open</Link></Button>
                </div>
              ))}
              {!recentQuotes.length && <div className="text-muted-foreground text-sm">No quotes yet.</div>}
            </CardContent>
          </Card>
        </div>
      </section>
    </AgentShell>
  );
};

export default Dashboard;
