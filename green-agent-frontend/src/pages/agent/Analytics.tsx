import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import AgentShell from "@/components/layout/AgentShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchAgentAnalytics, downloadAgentAnalyticsCsv } from "@/lib/api";
import { AgentAnalyticsPayload } from "@/types/analytics";

const metricLabels: Record<string, string> = {
  pending: "Pending",
  contacted: "Contacted",
  qualified: "Qualified",
  quoted: "Quoted",
  closed: "Closed",
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  accepted: "Accepted",
  declined: "Declined",
  planning: "Planning",
  in_progress: "In Progress",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

const conversionLabels: Record<string, string> = {
  lead_to_quote: "Lead → Quote",
  quote_to_project: "Quote → Project",
  lead_to_project: "Lead → Project",
  quote_acceptance: "Quote Acceptance",
};

const Analytics = () => {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["agent-analytics", startDate, endDate],
    queryFn: () => fetchAgentAnalytics({ startDate: startDate || undefined, endDate: endDate || undefined }),
  });

  const onExport = async () => {
    const blob = await downloadAgentAnalyticsCsv({ startDate: startDate || undefined, endDate: endDate || undefined });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "agent-dashboard-analytics.csv";
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const metrics = useMemo(() => buildMetrics(data), [data]);

  return (
    <AgentShell>
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Track funnel performance across leads, quotes, and projects.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="Start date" />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="End date" />
            <Button variant="outline" onClick={() => refetch()}>Apply</Button>
            <Button onClick={onExport}>Export CSV</Button>
          </div>
        </div>
      </section>

      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard title="Total Leads" value={metrics.leads.total} subtitle={`${metrics.leads.withQuote} with quotes`} loading={isLoading} />
          <SummaryCard title="Total Quotes" value={metrics.quotes.total} subtitle={`Accepted ${metrics.quotes.accepted} (${metrics.quotes.acceptedValue})`} loading={isLoading} />
          <SummaryCard title="Active Projects" value={metrics.projects.active} subtitle={`${metrics.projects.total} total`} loading={isLoading} />
        </div>
      </section>

      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 xl:grid-cols-2 gap-4">
          <BreakdownCard title="Lead Status" data={data?.leads.status_breakdown} loading={isLoading} />
          <BreakdownCard title="Quote Status" data={data?.quotes.status_breakdown} loading={isLoading} />
          <BreakdownCard title="Project Status" data={data?.projects.status_breakdown} loading={isLoading} />
          <ConversionCard conversions={data?.conversion_rates} loading={isLoading} />
        </div>
      </section>
    </AgentShell>
  );
};

export default Analytics;

function buildMetrics(payload?: AgentAnalyticsPayload) {
  if (!payload) {
    return {
      leads: { total: 0, withQuote: 0 },
      quotes: { total: 0, accepted: 0, acceptedValue: "0.00" },
      projects: { total: 0, active: 0 },
    };
  }
  return {
    leads: {
      total: payload.leads.total,
      withQuote: payload.leads.with_quote ?? 0,
    },
    quotes: {
      total: payload.quotes.total,
      accepted: payload.quotes.accepted ?? 0,
      acceptedValue: payload.quotes.accepted_value ?? "0.00",
    },
    projects: {
      total: payload.projects.total,
      active: payload.projects.active ?? 0,
    },
  };
}

function SummaryCard({ title, value, subtitle, loading }: { title: string; value: number; subtitle?: string; loading?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{loading ? "—" : value}</div>
        {subtitle && <div className="text-xs text-muted-foreground mt-1">{loading ? "" : subtitle}</div>}
      </CardContent>
    </Card>
  );
}

function BreakdownCard({ title, data, loading }: { title: string; data?: Record<string, number>; loading?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {!loading && data && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(data).map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell className="capitalize">{metricLabels[key] ?? key.replace(/_/g, " ")}</TableCell>
                  <TableCell className="text-right">{value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!loading && (!data || Object.keys(data).length === 0) && (
          <div className="text-sm text-muted-foreground">No data available for this range.</div>
        )}
      </CardContent>
    </Card>
  );
}

function ConversionCard({ conversions, loading }: { conversions?: Record<string, number>; loading?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Conversion Rates</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {!loading && conversions && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Path</TableHead>
                <TableHead className="text-right">Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(conversions).map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell>{conversionLabels[key] ?? key.replace(/_/g, " → ")}</TableCell>
                  <TableCell className="text-right">{`${(value * 100).toFixed(1)}%`}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!loading && (!conversions || Object.keys(conversions).length === 0) && (
          <div className="text-sm text-muted-foreground">No conversion data yet.</div>
        )}
      </CardContent>
    </Card>
  );
}
