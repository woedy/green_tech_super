import AgentShell from "@/components/layout/AgentShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LEADS, AGENT_QUOTES_SEED, AGENT_PROJECTS_SEED, EVENTS } from "@/mocks/agent";

const Dashboard = () => {
  const kpis = {
    leads: LEADS.length,
    quotesDraft: 0, // drafts are created via builder and stored; shown on list
    quotesSent: AGENT_QUOTES_SEED.filter(q => q.status === 'sent').length,
    activeProjects: AGENT_PROJECTS_SEED.filter(p => p.status === 'in_progress').length,
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
              {LEADS.slice(0,5).map((l) => (
                <div key={l.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30">
                  <div>
                    <div className="font-medium">{l.title}</div>
                    <div className="text-muted-foreground text-xs">{l.id} • {l.from} • {l.receivedAt}</div>
                  </div>
                  <Button asChild variant="outline" size="sm"><Link to={`/leads/${l.id}`}>Open</Link></Button>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Recent Quotes</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[...AGENT_QUOTES_SEED].slice(0,5).map((q) => (
                <div key={q.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30">
                  <div>
                    <div className="font-medium">{q.id} • {q.currency} {q.total.toLocaleString()}</div>
                    <div className="text-muted-foreground text-xs">{q.status}{q.sentAt ? ` • sent ${q.sentAt}` : ''}</div>
                  </div>
                  <Button asChild variant="outline" size="sm"><Link to={`/quotes/${q.id}`}>Open</Link></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </AgentShell>
  );
};

export default Dashboard;
