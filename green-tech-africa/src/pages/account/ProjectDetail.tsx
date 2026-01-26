import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, FileText, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { ProjectDashboard, ProjectTimeline, ProjectDocument, ProjectTaskItem, ProjectUpdateItem } from "@/types/project";

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completed: 'default',
  in_progress: 'secondary',
  planning: 'outline',
  on_hold: 'destructive',
};

const formatCurrency = (value: string | number | null | undefined, currency: string) => {
  if (!value) return "—";
  const amount = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(amount)) return value?.toString() ?? "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount as number);
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<ProjectDashboard | null>(null);
  const [timeline, setTimeline] = useState<ProjectTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const projectId = Number(id);
    if (!id || Number.isNaN(projectId)) {
      setError("Invalid project ID");
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const [dashboardResult, timelineResult] = await Promise.allSettled([
          api.get<ProjectDashboard>(`/api/construction/projects/${projectId}/dashboard/`),
          api.get<ProjectTimeline>(`/api/construction/projects/${projectId}/timeline/`),
        ]);

        let dashboardData: ProjectDashboard | null = null;
        let timelineData: ProjectTimeline | null = null;
        let message: string | null = null;

        if (dashboardResult.status === 'fulfilled') {
          dashboardData = dashboardResult.value;
        } else {
          try {
            dashboardData = await api.get<ProjectDashboard>(`/api/construction/projects/${projectId}/`);
          } catch (fallbackErr) {
            const reason = (dashboardResult.reason as any)?.message || 'Unable to load dashboard.';
            const fallbackReason = (fallbackErr as any)?.message || '';
            message = [reason, fallbackReason].filter(Boolean).join(' ');
          }
        }

        if (timelineResult.status === 'fulfilled') {
          timelineData = timelineResult.value;
        } else {
          const reason = (timelineResult.reason as any)?.message || 'Unable to load timeline.';
          message = message ? `${message} ${reason}` : reason;
        }
        if (!cancelled) {
          setDashboard(dashboardData);
          setTimeline(timelineData);
          setError(message);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError((err as Error).message ?? "Unable to load project details.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const documentsNeedingAction = useMemo(() => {
    if (!dashboard) return [] as ProjectDocument[];
    return dashboard.documents.filter((doc) => doc.requires_upload);
  }, [dashboard]);

  const outstandingTasks = useMemo(() => {
    if (!dashboard) return [] as ProjectTaskItem[];
    return dashboard.action_items;
  }, [dashboard]);

  const recentUpdates = useMemo(() => (dashboard?.recent_activity ?? ([] as ProjectUpdateItem[])), [dashboard]);

  if (loading) {
    return (
      <Layout>
        <section className="py-20 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading project…
          </div>
        </section>
      </Layout>
    );
  }

  if (error || !dashboard) {
    return (
      <Layout>
        <section className="py-20 flex items-center justify-center">
          <Card className="max-w-lg">
            <CardContent className="p-6 space-y-4 text-center">
              <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
              <div className="font-medium">Unable to load project</div>
              <p className="text-sm text-muted-foreground">{error ?? "Project could not be found."}</p>
              <Button variant="outline" onClick={() => navigate('/account/projects')}>Back to projects</Button>
            </CardContent>
          </Card>
        </section>
      </Layout>
    );
  }

  const budget = dashboard.budget_status;
  const currency = budget.currency ?? dashboard.currency ?? "GHS";
  const badgeVariant = statusVariant[dashboard.status.toLowerCase()] ?? "secondary";

  return (
    <Layout>
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold">{dashboard.title}</h1>
            <div className="flex items-center gap-2">
              <Badge variant={badgeVariant} className="capitalize">{dashboard.status.replace(/_/g, ' ').toLowerCase()}</Badge>
              <span className="text-sm text-muted-foreground">Current phase: {dashboard.current_phase.replace(/_/g, ' ').toLowerCase()}</span>
            </div>
          </div>
          <Button variant="outline" asChild><Link to="/account/projects"><ArrowLeft className="w-4 h-4 mr-1" /> Back to projects</Link></Button>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="space-y-6 xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Overall completion</div>
                    <div className="text-2xl font-semibold">{Math.round(dashboard.progress_percentage)}%</div>
                  </div>
                  <div className="w-full md:w-1/2">
                    <Progress value={Math.round(dashboard.progress_percentage)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                  <div>
                    <div className="font-medium text-foreground">Timeline</div>
                    <div>Planned: {formatDate(dashboard.planned_start_date)} – {formatDate(dashboard.planned_end_date)}</div>
                    <div>Actual: {formatDate(dashboard.actual_start_date)} – {formatDate(dashboard.actual_end_date)}</div>
                    <div>Days remaining: {dashboard.days_remaining ?? '—'}</div>
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Budget</div>
                    <div>Status: {budget.status.replace(/_/g, ' ')}</div>
                    <div>Estimated: {formatCurrency(budget.estimated, currency)}</div>
                    <div>Actual: {formatCurrency(budget.actual, currency)}</div>
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Risk Summary</div>
                    {dashboard.risk_factors.length === 0 && <div>No active risks.</div>}
                    {dashboard.risk_factors.slice(0, 2).map((risk, index) => (
                      <div key={index}>{risk.description}</div>
                    ))}
                    {dashboard.risk_factors.length > 2 && (
                      <div>+ {dashboard.risk_factors.length - 2} more</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Upcoming milestones</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {dashboard.upcoming_milestones.length === 0 && (
                  <div className="text-muted-foreground">No upcoming milestones in the next two weeks.</div>
                )}
                {dashboard.upcoming_milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-start justify-between gap-4 rounded-md border bg-muted/20 p-3">
                    <div>
                      <div className="font-medium text-foreground">{milestone.title}</div>
                      <div className="text-xs text-muted-foreground">Phase: {milestone.phase.replace(/_/g, ' ').toLowerCase()}</div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>{milestone.due_date ? formatDate(milestone.due_date) : 'TBD'}</div>
                      {milestone.is_overdue && <span className="text-destructive">Overdue</span>}
                      {!milestone.is_overdue && milestone.is_due_soon && <span className="text-amber-500">Due soon</span>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Recent updates</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {recentUpdates.length === 0 && <div className="text-muted-foreground">No updates yet.</div>}
                {recentUpdates.map((update) => (
                  <div key={update.id} className="rounded-md border bg-muted/20 p-3 space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="capitalize">{update.category}</span>
                      <span>{formatDate(update.created_at)}</span>
                    </div>
                    <div className="font-medium text-foreground">{update.title}</div>
                    <div>{update.body}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Action items</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {outstandingTasks.length === 0 && <div className="text-muted-foreground">No outstanding tasks.</div>}
                {outstandingTasks.map((task) => (
                  <div key={task.id} className="rounded-md border bg-muted/20 p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-foreground">{task.title}</div>
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Clock className={`h-4 w-4 ${task.is_overdue ? 'text-destructive' : 'text-muted-foreground'}`} />
                      )}
                    </div>
                    {task.due_date && <div className="text-xs text-muted-foreground">Due {formatDate(task.due_date)}</div>}
                    <div>{task.description || 'No additional details.'}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Project documents</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {dashboard.documents.length === 0 && <div className="text-muted-foreground">No documents uploaded yet.</div>}
                {dashboard.documents.map((doc) => (
                  <div key={doc.id} className="rounded-md border bg-muted/20 p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-foreground">{doc.title}</div>
                      <Badge variant={doc.requires_upload ? 'destructive' : 'secondary'}>
                        {doc.requires_upload ? 'Required' : 'Available'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{doc.document_type_display || doc.document_type}</div>
                    {doc.current_version ? (
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div>
                          Latest version v{doc.current_version.version} • {formatDate(doc.current_version.uploaded_at)}
                        </div>
                        {doc.current_version.download_url && (
                          <Button variant="link" size="sm" asChild>
                            <a href={doc.current_version.download_url} target="_blank" rel="noreferrer">
                              <FileText className="h-3 w-3 mr-1" /> Download
                            </a>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-destructive">Awaiting upload</div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Project team</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {dashboard.team_members.map((member) => (
                  <div key={member.id} className="border rounded-md bg-muted/20 p-3">
                    <div className="font-medium text-foreground">{member.name}</div>
                    <div className="text-xs text-muted-foreground">{member.role}</div>
                    <div>{member.email}</div>
                    {member.phone && <div>{member.phone}</div>}
                  </div>
                ))}
              </CardContent>
            </Card>

            {documentsNeedingAction.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Documents needing your attention</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {documentsNeedingAction.map((doc) => (
                    <div key={doc.id} className="rounded-md border border-destructive/40 bg-destructive/10 p-3">
                      <div className="font-medium text-destructive">{doc.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Please upload the latest version of this document.
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {timeline && (
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card>
              <CardHeader><CardTitle>Timeline overview</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {timeline.milestones.length === 0 && <div className="text-muted-foreground">No milestones defined yet.</div>}
                {timeline.milestones.map((milestone) => (
                  <div key={milestone.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 border rounded-md p-3 bg-muted/20">
                    <div className="md:col-span-2 font-medium text-foreground">{milestone.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {milestone.start_date ? formatDate(milestone.start_date) : 'TBD'} – {milestone.end_date ? formatDate(milestone.end_date) : 'TBD'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Status: {milestone.status.replace(/_/g, ' ').toLowerCase()} ({milestone.completion_percentage}%)
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default ProjectDetail;
