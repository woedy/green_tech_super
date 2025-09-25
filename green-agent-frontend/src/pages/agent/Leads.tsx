import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import AgentShell from "@/components/layout/AgentShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Lead, LeadPriority, LeadStatus } from "@/types/lead";

const STATUS_OPTIONS: { value: LeadStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "quoted", label: "Quoted" },
  { value: "closed", label: "Closed" },
];

const PRIORITY_LABEL: Record<LeadPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const PRIORITY_OPTIONS: { value: LeadPriority | "all"; label: string }[] = [
  { value: "all", label: "All priorities" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const priorityWeight: Record<LeadPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function parseDate(value: string | null | undefined): number {
  if (!value) return 0;
  return new Date(value).getTime();
}

function sortLeads(entries: Lead[]): Lead[] {
  return [...entries].sort((a, b) => {
    const priorityDelta = priorityWeight[a.priority] - priorityWeight[b.priority];
    if (priorityDelta !== 0) return priorityDelta;
    return parseDate(b.last_activity_at ?? b.updated_at) - parseDate(a.last_activity_at ?? a.updated_at);
  });
}

const statusBadgeVariant: Record<LeadStatus, string> = {
  new: "default",
  contacted: "outline",
  qualified: "secondary",
  quoted: "secondary",
  closed: "destructive",
};

const statusTitle: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  quoted: "Quoted",
  closed: "Closed",
};

const pipeline: LeadStatus[] = ["new", "contacted", "qualified", "quoted", "closed"];

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<LeadPriority | "all">("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"table" | "kanban">("table");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/leads/?page_size=200");
      if (!response.ok) {
        throw new Error("Unable to load leads");
      }
      const payload = await response.json();
      const records: Lead[] = payload.results ?? payload;
      setLeads(sortLeads(records));
    } catch (err: any) {
      setError(err.message ?? "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocol}://${window.location.host}/ws/agent/leads/`);
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (!message?.data) return;
        const payload: Lead = message.data;
        setLeads((current) => sortLeads([...current.filter((item) => item.id !== payload.id), payload]));
      } catch (err) {
        console.error("Failed to parse lead event", err);
      }
    };
    socket.onerror = (err) => {
      console.error("Lead websocket error", err);
    };
    return () => {
      socket.close();
    };
  }, []);

  const updateLead = useCallback(async (id: string, patch: Partial<Pick<Lead, "status" | "priority" | "is_unread">>) => {
    const response = await fetch(`/api/leads/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!response.ok) {
      throw new Error("Unable to update lead");
    }
    const payload: Lead = await response.json();
    setLeads((current) => sortLeads([...current.filter((item) => item.id !== payload.id), payload]));
    return payload;
  }, []);

  const filteredLeads = useMemo(() => {
    const lowered = query.toLowerCase().trim();
    return leads.filter((lead) => {
      const matchesQuery =
        lowered.length === 0 ||
        lead.title.toLowerCase().includes(lowered) ||
        lead.contact_name.toLowerCase().includes(lowered) ||
        lead.contact_email.toLowerCase().includes(lowered);
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || lead.priority === priorityFilter;
      return matchesQuery && matchesStatus && matchesPriority;
    });
  }, [leads, priorityFilter, query, statusFilter]);

  const board = useMemo(() => {
    return pipeline.reduce<Record<LeadStatus, Lead[]>>((acc, status) => {
      acc[status] = filteredLeads.filter((lead) => lead.status === status);
      return acc;
    }, { new: [], contacted: [], qualified: [], quoted: [], closed: [] });
  }, [filteredLeads]);

  const resetFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  return (
    <AgentShell>
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Leads</h1>
            <p className="text-sm text-muted-foreground">Monitor inbound requests, update status, and qualify next steps.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <Input
              placeholder="Search leads..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="sm:w-64"
            />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as LeadStatus | "all")}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as LeadPriority | "all")}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </div>
      </section>
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && <div className="mb-3 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="text-sm text-muted-foreground">
              {loading ? "Refreshing leads…" : `${filteredLeads.length} leads`}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant={view === "table" ? "default" : "outline"} onClick={() => setView("table")}>
                Table
              </Button>
              <Button size="sm" variant={view === "kanban" ? "default" : "outline"} onClick={() => setView("kanban")}>
                Kanban
              </Button>
            </div>
          </div>

          {view === "table" ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Last activity</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <TableRow key={lead.id} className={lead.is_unread ? "bg-primary/5" : undefined}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium flex items-center gap-2">
                              {lead.title}
                              {lead.is_unread && <span className="inline-flex h-2 w-2 rounded-full bg-primary" aria-hidden />}
                            </span>
                            <span className="text-xs text-muted-foreground">{lead.source_type.replace("_", " ")}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{lead.contact_name}</div>
                          <div className="text-xs text-muted-foreground">{lead.contact_email}</div>
                          <div className="text-xs text-muted-foreground">{lead.contact_phone}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant[lead.status] as any}>{statusTitle[lead.status]}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={lead.priority === "high" ? "destructive" : lead.priority === "medium" ? "secondary" : "outline"}>
                            {PRIORITY_LABEL[lead.priority]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {lead.last_activity_at ? new Date(lead.last_activity_at).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {pipeline
                              .filter((status) => status !== lead.status)
                              .slice(0, 2)
                              .map((status) => (
                                <Button
                                  key={status}
                                  size="xs"
                                  variant="outline"
                                  onClick={() => void updateLead(lead.id, { status }).catch((err) => console.error(err))}
                                >
                                  {statusTitle[status]}
                                </Button>
                              ))}
                            <Button asChild size="sm" variant="outline">
                              <Link to={`/leads/${lead.id}`}>Open</Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!filteredLeads.length && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">
                          {loading ? "Loading leads..." : "No leads match your filters."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {pipeline.map((column) => (
                <div key={column} className="rounded-md border bg-muted/20">
                  <div className="px-3 py-2 font-semibold text-sm capitalize border-b">{statusTitle[column]}</div>
                  <div className="p-2 space-y-2 min-h-[200px]">
                    {board[column].map((card) => (
                      <div key={card.id} className="p-3 rounded-md bg-background shadow-sm border text-sm">
                        <div className="font-medium flex items-center justify-between">
                          <span>{card.title}</span>
                          <Badge variant={card.priority === "high" ? "destructive" : card.priority === "medium" ? "secondary" : "outline"}>
                            {PRIORITY_LABEL[card.priority]}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {card.contact_name} • {card.contact_email}
                        </div>
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {pipeline
                            .filter((status) => status !== column)
                            .slice(0, 2)
                            .map((status) => (
                              <Button
                                key={status}
                                size="xs"
                                variant="outline"
                                onClick={() => void updateLead(card.id, { status }).catch((err) => console.error(err))}
                              >
                                Move to {statusTitle[status]}
                              </Button>
                            ))}
                          <Button asChild size="xs" variant="secondary">
                            <Link to={`/leads/${card.id}`}>Open</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                    {!board[column].length && (
                      <div className="text-xs text-muted-foreground p-2">No items</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </AgentShell>
  );
};

export default Leads;
