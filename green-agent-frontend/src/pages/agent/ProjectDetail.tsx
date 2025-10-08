import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import AgentShell from "@/components/layout/AgentShell";
import ProjectTasksPanel from "@/components/projects/ProjectTasksPanel";
import ProjectTimeline from "@/components/projects/ProjectTimeline";
import MilestoneUpdateForm from "@/components/projects/MilestoneUpdateForm";
import ClientCommunication from "@/components/projects/ClientCommunication";
import ChangeOrderForm from "@/components/projects/ChangeOrderForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fetchProjectDashboard,
  fetchProjectTasks,
  updateProjectTask,
  fetchProjectChatMessages,
  postProjectChatMessage,
} from "@/lib/api";
import { asArray } from "@/types/api";
import {
  ProjectDashboardPayload,
  ProjectTask,
  ProjectTaskStatus,
  ProjectMilestoneItem,
} from "@/types/project";

export default function ProjectDetail() {
  const { id } = useParams();
  const projectId = id ?? "";
  const queryClient = useQueryClient();

  // State for managing forms and modals
  const [selectedMilestone, setSelectedMilestone] =
    useState<ProjectMilestoneItem | null>(null);
  const [showChangeOrderForm, setShowChangeOrderForm] = useState(false);

  const { data: dashboard, isLoading } = useQuery<ProjectDashboardPayload>({
    queryKey: ["project-dashboard", projectId],
    queryFn: () => fetchProjectDashboard(projectId),
    enabled: Boolean(projectId),
  });

  const { data: tasksResponse, isFetching: isTasksLoading } = useQuery({
    queryKey: ["project-tasks", projectId],
    queryFn: () => fetchProjectTasks(projectId),
    enabled: Boolean(projectId),
  });

  const { data: messagesResponse, isLoading: isMessagesLoading } = useQuery({
    queryKey: ["project-messages", projectId],
    queryFn: () => fetchProjectChatMessages(projectId),
    enabled: Boolean(projectId),
  });

  const tasks = useMemo<ProjectTask[]>(
    () => (tasksResponse ? asArray(tasksResponse) : []),
    [tasksResponse]
  );
  const messages = useMemo(
    () => (messagesResponse ? asArray(messagesResponse) : []),
    [messagesResponse]
  );

  const updateTask = useMutation({
    mutationFn: ({
      taskId,
      status,
    }: {
      taskId: string;
      status: ProjectTaskStatus;
    }) => updateProjectTask(projectId, taskId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
    },
  });

  const sendMessage = useMutation({
    mutationFn: ({
      message,
      sendNotification,
    }: {
      message: string;
      sendNotification: boolean;
    }) => postProjectChatMessage(projectId, { body: message }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project-messages", projectId],
      });
    },
  });

  const budget = dashboard?.budget_status;

  // Mock current user - in real app this would come from auth context
  const currentUser = {
    id: "agent-1",
    name: "Agent Smith",
    email: "agent@greentech.com",
  };

  const handleMilestoneUpdate = async (data: any) => {
    // In real app, this would call an API to update the milestone
    console.log("Updating milestone:", selectedMilestone?.id, data);
    setSelectedMilestone(null);
    // Refresh dashboard data
    queryClient.invalidateQueries({
      queryKey: ["project-dashboard", projectId],
    });
  };

  const handleChangeOrderSubmit = async (data: any) => {
    // In real app, this would call an API to create the change order
    console.log("Creating change order:", data);
    setShowChangeOrderForm(false);
    // Refresh dashboard data
    queryClient.invalidateQueries({
      queryKey: ["project-dashboard", projectId],
    });
  };

  const handleSendMessage = async (
    message: string,
    sendNotification: boolean
  ) => {
    await sendMessage.mutateAsync({ message, sendNotification });
  };

  return (
    <AgentShell>
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {dashboard?.title ?? "Project"}
              </h1>
              {dashboard && (
                <div className="text-sm text-muted-foreground space-x-2">
                  <span>ID: {dashboard.id}</span>
                  <span>• Phase: {dashboard.current_phase}</span>
                  <span>
                    • Progress: {Math.round(dashboard.progress_percentage)}%
                  </span>
                </div>
              )}
              {isLoading && !dashboard && (
                <div className="text-sm text-muted-foreground">
                  Loading project details…
                </div>
              )}
            </div>
            <div className="text-right space-y-1">
              <Badge variant="secondary">
                {dashboard?.status ?? "Loading"}
              </Badge>
              {dashboard?.days_remaining !== undefined &&
                dashboard?.days_remaining !== null && (
                  <div className="text-xs text-muted-foreground">
                    {dashboard.days_remaining} days remaining
                  </div>
                )}
            </div>
          </div>
        </div>
      </section>
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Budget Utilization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {budget ? `${budget.utilization.toFixed(1)}%` : "—"}
                </div>
                {budget && (
                  <div className="text-xs text-muted-foreground mt-2">
                    {budget.status.replace(/_/g, " ")} • Remaining{" "}
                    {budget.currency} {budget.remaining.toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Upcoming Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboard?.upcoming_milestones.length ?? 0}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Including overdue within the next week.
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Action Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboard?.action_items.length ?? 0}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Tasks requiring attention.
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
              <TabsTrigger value="communication">Communication</TabsTrigger>
              <TabsTrigger value="change-orders">Change Orders</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <OverviewItem label="Status" value={dashboard?.status} />
                  <OverviewItem
                    label="Phase"
                    value={dashboard?.current_phase}
                  />
                  <OverviewItem
                    label="Progress"
                    value={
                      dashboard
                        ? `${Math.round(dashboard.progress_percentage)}%`
                        : "—"
                    }
                  />
                  <OverviewItem
                    label="Planned Start"
                    value={formatDate(dashboard?.planned_start_date)}
                  />
                  <OverviewItem
                    label="Planned End"
                    value={formatDate(dashboard?.planned_end_date)}
                  />
                  <OverviewItem
                    label="Actual Start"
                    value={formatDate(dashboard?.actual_start_date)}
                  />
                  <OverviewItem
                    label="Actual End"
                    value={formatDate(dashboard?.actual_end_date)}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline">
              {dashboard && (
                <ProjectTimeline
                  milestones={dashboard.upcoming_milestones}
                  currentPhase={dashboard.current_phase}
                  progressPercentage={dashboard.progress_percentage}
                />
              )}
            </TabsContent>

            <TabsContent value="milestones">
              {selectedMilestone ? (
                <MilestoneUpdateForm
                  milestone={selectedMilestone}
                  onSubmit={handleMilestoneUpdate}
                  onCancel={() => setSelectedMilestone(null)}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Milestones</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {dashboard?.upcoming_milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className="flex items-center justify-between p-3 rounded-md bg-muted/30"
                      >
                        <div>
                          <div className="font-medium">{milestone.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {milestone.due_date
                              ? `Due ${formatDate(milestone.due_date)}`
                              : "Schedule TBD"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              milestone.is_overdue
                                ? "destructive"
                                : milestone.is_due_soon
                                ? "default"
                                : "secondary"
                            }
                          >
                            {milestone.is_overdue
                              ? "Overdue"
                              : milestone.is_due_soon
                              ? "Due soon"
                              : milestone.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedMilestone(milestone)}
                          >
                            Update
                          </Button>
                        </div>
                      </div>
                    ))}
                    {dashboard &&
                      dashboard.upcoming_milestones.length === 0 && (
                        <div className="text-sm text-muted-foreground">
                          No upcoming milestones scheduled.
                        </div>
                      )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="communication">
              <ClientCommunication
                projectId={projectId}
                messages={messages}
                currentUser={currentUser}
                onSendMessage={handleSendMessage}
                isLoading={isMessagesLoading}
              />
            </TabsContent>

            <TabsContent value="change-orders">
              {showChangeOrderForm ? (
                <ChangeOrderForm
                  projectId={projectId}
                  originalBudget={budget?.estimated || 0}
                  currency={dashboard?.currency || "GHS"}
                  onSubmit={handleChangeOrderSubmit}
                  onCancel={() => setShowChangeOrderForm(false)}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Change Orders</span>
                      <Button onClick={() => setShowChangeOrderForm(true)}>
                        Create Change Order
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground text-center py-8">
                      No change orders yet. Click "Create Change Order" to add
                      project modifications.
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="updates">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Updates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {dashboard?.recent_activity.map((update) => (
                    <div key={update.id} className="p-3 rounded-md bg-muted/30">
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(update.created_at)}
                      </div>
                      <div className="font-medium">{update.title}</div>
                      <div>{update.body}</div>
                    </div>
                  ))}
                  {dashboard && dashboard.recent_activity.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      No updates yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {dashboard?.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex flex-col md:flex-row md:items-center md:justify-between p-3 rounded-md bg-muted/30 gap-2"
                    >
                      <div>
                        <div className="font-medium">{doc.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {doc.document_type_display ?? doc.document_type}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {doc.current_version
                          ? `Updated ${formatDateTime(
                              doc.current_version.uploaded_at
                            )}`
                          : "Awaiting upload"}
                      </div>
                    </div>
                  ))}
                  {dashboard && dashboard.documents.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      No documents yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team">
              <Card>
                <CardHeader>
                  <CardTitle>Team</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {dashboard?.team_members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-md bg-muted/30"
                    >
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {member.role}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        {member.email}
                        {member.phone && <div>{member.phone}</div>}
                      </div>
                    </div>
                  ))}
                  {dashboard && dashboard.team_members.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      No team members recorded.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks">
              <ProjectTasksPanel
                tasks={tasks}
                isLoading={isTasksLoading || updateTask.isPending}
                onUpdateStatus={(taskId, status) =>
                  updateTask.mutate({ taskId, status })
                }
              />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </AgentShell>
  );
}

function OverviewItem({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="p-3 rounded-md bg-muted/30">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium">{value ?? "—"}</div>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
