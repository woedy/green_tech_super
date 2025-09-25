import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import AgentShell from "@/components/layout/AgentShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Lead, LeadActivity, LeadNote, LeadPriority, LeadStatus } from "@/types/lead";

const STATUS_OPTIONS: LeadStatus[] = ["new", "contacted", "qualified", "quoted", "closed"];
const PRIORITY_OPTIONS: LeadPriority[] = ["high", "medium", "low"];

const statusTitle: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  quoted: "Quoted",
  closed: "Closed",
};

const priorityTitle: Record<LeadPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const statusBadgeVariant: Record<LeadStatus, string> = {
  new: "default",
  contacted: "outline",
  qualified: "secondary",
  quoted: "secondary",
  closed: "destructive",
};

const priorityBadgeVariant: Record<LeadPriority, string> = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

const LeadDetail = () => {
  const params = useParams();
  const leadId = params.id ?? "";
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [activity, setActivity] = useState<LeadActivity[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);

  const quoteHref = useMemo(() => {
    if (!lead) return "/quotes/new";
    const params = new URLSearchParams({ lead: lead.id });
    if (lead.source_type === "build_request") {
      params.set("request", lead.source_id);
    }
    return `/quotes/new?${params.toString()}`;
  }, [lead]);

  const fetchLead = useCallback(async () => {
    if (!leadId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/leads/${leadId}/`);
      if (!response.ok) throw new Error("Lead not found");
      const payload: Lead = await response.json();
      let resolvedLead = payload;
      if (payload.is_unread) {
        try {
          const markResponse = await fetch(`/api/leads/${leadId}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_unread: false }),
          });
          if (markResponse.ok) {
            resolvedLead = await markResponse.json();
          }
        } catch (err) {
          console.warn("Failed to mark lead as read", err);
        }
      }
      setLead(resolvedLead);
    } catch (err: any) {
      setError(err.message ?? "Unable to load lead");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  const fetchNotes = useCallback(async () => {
    if (!leadId) return;
    const response = await fetch(`/api/leads/${leadId}/notes/`);
    if (response.ok) {
      const data: LeadNote[] = await response.json();
      setNotes(data);
    }
  }, [leadId]);

  const fetchActivity = useCallback(async () => {
    if (!leadId) return;
    const response = await fetch(`/api/leads/${leadId}/activity/`);
    if (response.ok) {
      const data: LeadActivity[] = await response.json();
      setActivity(data);
    }
  }, [leadId]);

  useEffect(() => {
    fetchLead();
    fetchNotes();
    fetchActivity();
  }, [fetchActivity, fetchLead, fetchNotes]);

  const updateLead = useCallback(
    async (patch: Partial<Pick<Lead, "status" | "priority">>) => {
      if (!leadId) return;
      const response = await fetch(`/api/leads/${leadId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!response.ok) throw new Error("Failed to update lead");
      const payload: Lead = await response.json();
      setLead(payload);
      fetchActivity();
    },
    [fetchActivity, leadId],
  );

  const handleAddNote = useCallback(async () => {
    if (!noteDraft.trim() || !leadId) return;
    try {
      setSavingNote(true);
      const response = await fetch(`/api/leads/${leadId}/notes/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: noteDraft.trim() }),
      });
      if (!response.ok) throw new Error("Unable to save note");
      const created: LeadNote = await response.json();
      setNotes((current) => [created, ...current]);
      setNoteDraft("");
      fetchActivity();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNote(false);
    }
  }, [fetchActivity, leadId, noteDraft]);

  const metadataItems = useMemo(() => {
    if (!lead) return [] as { label: string; value: string }[];
    const items: { label: string; value: string }[] = [];
    if (lead.source_type === "build_request") {
      const plan = lead.metadata?.plan;
      if (plan?.name) items.push({ label: "Plan", value: plan.name });
      if (lead.metadata?.region) items.push({ label: "Region", value: lead.metadata.region });
      const budget = lead.metadata?.budget;
      if (budget?.currency) {
        const min = budget.min ? `${budget.currency} ${budget.min}` : null;
        const max = budget.max ? `${budget.currency} ${budget.max}` : null;
        if (min || max) {
          items.push({ label: "Budget", value: [min, max].filter(Boolean).join(" – ") });
        }
      }
      if (lead.metadata?.timeline) items.push({ label: "Timeline", value: lead.metadata.timeline });
      if (lead.metadata?.customizations) items.push({ label: "Customizations", value: lead.metadata.customizations });
    }
    if (lead.source_type === "property_inquiry") {
      const property = lead.metadata?.property;
      if (property?.title) items.push({ label: "Property", value: property.title });
      if (lead.metadata?.scheduled_viewing) items.push({ label: "Viewing", value: new Date(lead.metadata.scheduled_viewing).toLocaleString() });
      if (lead.metadata?.message) items.push({ label: "Message", value: lead.metadata.message });
    }
    return items;
  }, [lead]);

  if (!leadId) {
    return (
      <AgentShell>
        <section className="py-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-sm text-muted-foreground">No lead selected.</p>
          </div>
        </section>
      </AgentShell>
    );
  }

  return (
    <AgentShell>
      <section className="py-6 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Lead {lead?.id ?? leadId}</h1>
            {lead && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={statusBadgeVariant[lead.status] as any}>{statusTitle[lead.status]}</Badge>
                <Badge variant={priorityBadgeVariant[lead.priority] as any}>{priorityTitle[lead.priority]}</Badge>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/leads">Back</Link>
            </Button>
            <Button asChild>
              <Link to={quoteHref}>Create Quote</Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lead overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {error && <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-destructive">{error}</div>}
                {loading && <div className="text-muted-foreground">Loading lead details…</div>}
                {lead && (
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase">Contact</div>
                      <div className="font-medium text-base">{lead.contact_name}</div>
                      <div>{lead.contact_email}</div>
                      <div>{lead.contact_phone}</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase mb-1">Status</div>
                        <Select value={lead.status} onValueChange={(value) => void updateLead({ status: value as LeadStatus }).catch(console.error)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {statusTitle[option]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase mb-1">Priority</div>
                        <Select value={lead.priority} onValueChange={(value) => void updateLead({ priority: value as LeadPriority }).catch(console.error)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRIORITY_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {priorityTitle[option]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase mb-1">Source</div>
                        <div className="font-medium capitalize">{lead.source_type.replace("_", " ")}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase mb-1">Created</div>
                        <div>{new Date(lead.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    {metadataItems.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {metadataItems.map((item) => (
                          <div key={item.label}>
                            <div className="text-xs text-muted-foreground uppercase mb-1">{item.label}</div>
                            <div>{item.value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    placeholder="Add qualification notes or follow-up tasks"
                  />
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Share context with teammates—notes are internal only.
                    </div>
                    <Button size="sm" disabled={savingNote || !noteDraft.trim()} onClick={() => void handleAddNote().catch(console.error)}>
                      {savingNote ? "Saving…" : "Add note"}
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="rounded-md border bg-muted/30 p-3 text-sm">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{note.author}</span>
                        <span>{new Date(note.created_at).toLocaleString()}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap">{note.body}</p>
                    </div>
                  ))}
                  {!notes.length && <div className="text-sm text-muted-foreground">No notes yet.</div>}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {activity.map((item) => (
                  <div key={item.id} className="rounded-md border bg-muted/20 p-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.author}</span>
                      <span>{new Date(item.created_at).toLocaleString()}</span>
                    </div>
                    <div className="mt-2 font-medium">{item.message}</div>
                  </div>
                ))}
                {!activity.length && <div className="text-sm text-muted-foreground">No activity yet.</div>}
              </CardContent>
            </Card>
            {lead?.metadata?.message && (
              <Card>
                <CardHeader>
                  <CardTitle>Customer message</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{lead.metadata.message}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </AgentShell>
  );
};

export default LeadDetail;
