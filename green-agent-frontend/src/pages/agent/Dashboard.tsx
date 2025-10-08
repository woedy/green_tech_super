import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import AgentShell from "@/components/layout/AgentShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchAgentAnalytics, fetchRecentLeads, fetchRecentQuotes } from "@/lib/api";
import { asArray } from "@/types/api";
import { Lead } from "@/types/lead";
import { QuoteSummary } from "@/types/quote";
import { TrendingUp, TrendingDown, Users, FileText, Briefcase, DollarSign, MapPin, Leaf } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const { user } = useAuth();
  
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
  const conversionRate = analytics?.conversion_rates?.lead_to_quote ?? 0;
  
  // Ghana-specific metrics
  const totalRevenue = recentQuotes.reduce((sum, q) => sum + (q.total_amount || 0), 0);
  const avgQuoteValue = quotesSent > 0 ? totalRevenue / quotesSent : 0;

  const kpis = [
    {
      label: "Active Leads",
      value: leadTotal,
      icon: Users,
      trend: leadTotal > 5 ? "up" : "stable",
      description: "Leads requiring attention"
    },
    {
      label: "Quotes Sent",
      value: quotesSent,
      icon: FileText,
      trend: quotesSent > 3 ? "up" : "stable",
      description: "This month"
    },
    {
      label: "Active Projects",
      value: activeProjects,
      icon: Briefcase,
      trend: "stable",
      description: "In progress"
    },
    {
      label: "Conversion Rate",
      value: `${Math.round(conversionRate * 100)}%`,
      icon: TrendingUp,
      trend: conversionRate > 0.3 ? "up" : "down",
      description: "Lead to quote"
    },
  ];

  return (
    <AgentShell>
      <section className="py-6 bg-gradient-to-br from-background via-accent/10 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0] || 'Agent'}</h1>
                <Badge variant="outline" className="text-xs">
                  <MapPin className="w-3 h-3 mr-1" />
                  {user?.location || 'Ghana'}
                </Badge>
              </div>
              <p className="text-muted-foreground">Manage your leads, quotes, and sustainable building projects</p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild>
                <Link to="/quotes/new">
                  <FileText className="w-4 h-4 mr-2" />
                  Create Quote
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/calendar">View Calendar</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            const TrendIcon = kpi.trend === "up" ? TrendingUp : kpi.trend === "down" ? TrendingDown : null;
            
            return (
              <Card key={kpi.label} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Icon className="w-4 h-4" />
                        {kpi.label}
                      </div>
                      <div className="text-3xl font-bold mb-1">{kpi.value}</div>
                      <div className="text-xs text-muted-foreground">{kpi.description}</div>
                    </div>
                    {TrendIcon && (
                      <TrendIcon className={`w-5 h-5 ${kpi.trend === "up" ? "text-green-500" : "text-red-500"}`} />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Ghana Market Insights */}
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Leaf className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Ghana Sustainable Building Market</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Growing demand for eco-friendly construction in Accra, Kumasi, and Tamale regions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <DollarSign className="w-3 h-3 mr-1" />
                      Avg Quote: GHS {avgQuoteValue.toLocaleString('en-GH', { maximumFractionDigits: 0 })}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Solar installations +45% YoY
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Rainwater systems popular
                    </Badge>
                  </div>
                </div>
              </div>
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
