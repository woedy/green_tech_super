import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import AgentShell from "@/components/layout/AgentShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAgentAnalytics, fetchRecentLeads, fetchRecentQuotes } from "@/lib/api";
import { asArray } from "@/types/api";
import { Lead } from "@/types/lead";
import { QuoteSummary } from "@/types/quote";

const Dashboard = () => {
  const { data: analytics } = useQuery({
    queryKey: ["agent-analytics"],
    queryFn: () => fetchAgentAnalytics(),
  });

  const { data: leadResponse } = useQuery({
    queryKey: ["recent-leads"],
    queryFn: () => fetchRecentLeads(5),
  });

  const { data: quoteResponse } = useQuery({
    queryKey: ["recent-quotes"],
    queryFn: () => fetchRecentQuotes(5),
  });

  const recentLeads: Lead[] = useMemo(() => asArray(leadResponse ?? []).slice(0, 5), [leadResponse]);
  const recentQuotes: QuoteSummary[] = useMemo(() => {
    const payload = asArray(quoteResponse ?? []);
    return [...payload].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
  }, [quoteResponse]);

  const leadTotal = leadResponse?.count ?? recentLeads.length ?? 0;
  const quotesSent = recentQuotes.filter((quote) => quote.status === "sent" || quote.status === "viewed" || quote.status === "accepted").length;
  const activeProjects = analytics?.projects.active ?? analytics?.projects.total ?? 0;

  const kpis = {
    leads: leadTotal,
    quotesSent,
    activeProjects,
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
          <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Quotes (sent/viewed)</div><div className="text-2xl font-bold">{kpis.quotesSent}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Active Projects</div><div className="text-2xl font-bold">{kpis.activeProjects}</div></CardContent></Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Lead → Quote Conversion</div>
              <div className="text-2xl font-bold">{analytics ? `${Math.round((analytics.conversion_rates.lead_to_quote || 0) * 100)}%` : "—"}</div>
            </CardContent>
          </Card>
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
