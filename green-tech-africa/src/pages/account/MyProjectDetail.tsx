import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  DollarSign, 
  MapPin, 
  User, 
  FileText, 
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Upload,
  Loader2,
  TrendingUp,
  Users
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Types
interface Project {
  id: number;
  title: string;
  description: string;
  status: string;
  current_phase: string;
  progress_percentage: number;
  property: any;
  construction_request?: any;
  project_manager: any;
  site_supervisor?: any;
  planned_start_date?: string;
  actual_start_date?: string;
  planned_end_date?: string;
  actual_end_date?: string;
  estimated_budget: string;
  actual_cost: string;
  currency: string;
  is_behind_schedule: boolean;
  budget_utilization: number;
  created_at: string;
  updated_at: string;
}

interface Milestone {
  id: number;
  title: string;
  description: string;
  phase: string;
  status: string;
  planned_start_date?: string;
  actual_start_date?: string;
  planned_end_date: string;
  actual_end_date?: string;
  completion_percentage: number;
  estimated_cost: string;
  actual_cost: string;
  is_on_track: boolean;
}

interface ProjectUpdate {
  id: string;
  category: string;
  title: string;
  body: string;
  is_customer_visible: boolean;
  created_by: any;
  created_at: string;
}

interface ProjectDocument {
  id: string;
  document_type: string;
  title: string;
  description: string;
  current_version?: any;
  created_at: string;
}

const statusConfig = {
  DRAFT: { label: "Draft", variant: "secondary" as const, color: "text-gray-600" },
  PLANNING: { label: "Planning", variant: "default" as const, color: "text-blue-600" },
  IN_PROGRESS: { label: "In Progress", variant: "default" as const, color: "text-green-600" },
  ON_HOLD: { label: "On Hold", variant: "outline" as const, color: "text-orange-600" },
  COMPLETED: { label: "Completed", variant: "outline" as const, color: "text-green-700" },
  CANCELLED: { label: "Cancelled", variant: "destructive" as const, color: "text-red-600" },
  DELAYED: { label: "Delayed", variant: "destructive" as const, color: "text-red-600" },
};

const milestoneStatusConfig = {
  NOT_STARTED: { label: "Not Started", variant: "secondary" as const, icon: Clock },
  IN_PROGRESS: { label: "In Progress", variant: "default" as const, icon: TrendingUp },
  ON_HOLD: { label: "On Hold", variant: "outline" as const, icon: AlertCircle },
  COMPLETED: { label: "Completed", variant: "outline" as const, icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", variant: "destructive" as const, icon: AlertCircle },
};

const MyProjectDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ['my-project', id],
    queryFn: () => api.get(`/api/construction/projects/${id}/`),
    enabled: !!id,
  });

  const { data: milestones, isLoading: milestonesLoading } = useQuery<Milestone[]>({
    queryKey: ['project-milestones', id],
    queryFn: () => api.get(`/api/construction/projects/${id}/milestones/`).then(res => res.results || res),
    enabled: !!id,
  });

  const { data: updates, isLoading: updatesLoading } = useQuery<ProjectUpdate[]>({
    queryKey: ['project-updates', id],
    queryFn: () => api.get(`/api/construction/projects/${id}/updates/`).then(res => res.results || res),
    enabled: !!id,
  });

  const { data: documents, isLoading: documentsLoading } = useQuery<ProjectDocument[]>({
    queryKey: ['project-documents', id],
    queryFn: () => api.get(`/api/construction/projects/${id}/documents/`).then(res => res.results || res),
    enabled: !!id,
  });

  if (projectLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading project...</span>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-red-600">Project not found</h2>
            <Button variant="outline" asChild className="mt-4">
              <Link to="/account/projects">Back to Projects</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const statusInfo = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.DRAFT;

  return (
    <Layout>
      {/* Header */}
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/account/projects">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Projects
            </Link>
          </Button>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{project.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  <span>{project.current_phase?.replace(/_/g, ' ')}</span>
                </div>
                {project.property && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>Property #{project.property}</span>
                  </div>
                )}
              </div>
            </div>
            <Badge variant={statusInfo.variant} className="text-sm">
              {statusInfo.label}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm font-semibold">{project.progress_percentage}%</span>
            </div>
            <Progress value={project.progress_percentage} className="h-3" />
            {project.is_behind_schedule && (
              <div className="flex items-center gap-2 mt-2 text-sm text-orange-600">
                <AlertCircle className="w-4 h-4" />
                <span>Project is behind schedule</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="milestones">Milestones</TabsTrigger>
                  <TabsTrigger value="updates">Updates</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  {/* Description */}
                  {project.description && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Project Description
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground whitespace-pre-wrap">{project.description}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Timeline */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {project.planned_start_date && (
                          <div>
                            <p className="text-sm text-muted-foreground">Planned Start</p>
                            <p className="font-medium">{new Date(project.planned_start_date).toLocaleDateString()}</p>
                          </div>
                        )}
                        {project.actual_start_date && (
                          <div>
                            <p className="text-sm text-muted-foreground">Actual Start</p>
                            <p className="font-medium">{new Date(project.actual_start_date).toLocaleDateString()}</p>
                          </div>
                        )}
                        {project.planned_end_date && (
                          <div>
                            <p className="text-sm text-muted-foreground">Planned End</p>
                            <p className="font-medium">{new Date(project.planned_end_date).toLocaleDateString()}</p>
                          </div>
                        )}
                        {project.actual_end_date && (
                          <div>
                            <p className="text-sm text-muted-foreground">Actual End</p>
                            <p className="font-medium">{new Date(project.actual_end_date).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Team */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Project Team
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {project.project_manager && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                            {project.project_manager.first_name?.[0] || 'PM'}
                          </div>
                          <div>
                            <p className="font-medium">
                              {project.project_manager.first_name} {project.project_manager.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">Project Manager</p>
                          </div>
                        </div>
                      )}
                      {project.site_supervisor && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-semibold">
                            {project.site_supervisor.first_name?.[0] || 'SS'}
                          </div>
                          <div>
                            <p className="font-medium">
                              {project.site_supervisor.first_name} {project.site_supervisor.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">Site Supervisor</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Milestones Tab */}
                <TabsContent value="milestones" className="space-y-4">
                  {milestonesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : milestones && milestones.length > 0 ? (
                    milestones.map((milestone) => {
                      const statusInfo = milestoneStatusConfig[milestone.status as keyof typeof milestoneStatusConfig];
                      const StatusIcon = statusInfo?.icon || Clock;
                      
                      return (
                        <Card key={milestone.id}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1">{milestone.title}</h3>
                                <p className="text-sm text-muted-foreground">{milestone.phase?.replace(/_/g, ' ')}</p>
                              </div>
                              <Badge variant={statusInfo?.variant || "secondary"} className="flex items-center gap-1">
                                <StatusIcon className="w-3 h-3" />
                                {statusInfo?.label || milestone.status}
                              </Badge>
                            </div>
                            
                            {milestone.description && (
                              <p className="text-sm text-muted-foreground mb-4">{milestone.description}</p>
                            )}
                            
                            <div className="space-y-3">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm">Progress</span>
                                  <span className="text-sm font-semibold">{milestone.completion_percentage}%</span>
                                </div>
                                <Progress value={milestone.completion_percentage} className="h-2" />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Planned End</p>
                                  <p className="font-medium">{new Date(milestone.planned_end_date).toLocaleDateString()}</p>
                                </div>
                                {milestone.actual_end_date && (
                                  <div>
                                    <p className="text-muted-foreground">Actual End</p>
                                    <p className="font-medium">{new Date(milestone.actual_end_date).toLocaleDateString()}</p>
                                  </div>
                                )}
                              </div>
                              
                              {!milestone.is_on_track && milestone.status === 'IN_PROGRESS' && (
                                <div className="flex items-center gap-2 text-sm text-orange-600">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>Behind schedule</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center text-muted-foreground">
                        No milestones yet
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Updates Tab */}
                <TabsContent value="updates" className="space-y-4">
                  {updatesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : updates && updates.length > 0 ? (
                    updates.filter(u => u.is_customer_visible).map((update) => (
                      <Card key={update.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{update.title}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {new Date(update.created_at).toLocaleDateString()} • {update.category}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground whitespace-pre-wrap">{update.body}</p>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center text-muted-foreground">
                        No updates yet
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-4">
                  {documentsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : documents && documents.length > 0 ? (
                    documents.map((doc) => (
                      <Card key={doc.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-8 h-8 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{doc.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {doc.document_type} • {new Date(doc.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {doc.current_version && (
                            <Button variant="outline" size="sm">
                              Download
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center text-muted-foreground">
                        No documents yet
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Budget */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Budget
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Budget</p>
                    <p className="text-2xl font-bold">
                      {project.currency} {Number(project.estimated_budget).toLocaleString()}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Actual Cost</p>
                    <p className="text-xl font-semibold">
                      {project.currency} {Number(project.actual_cost).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Budget Utilization</span>
                      <span className="text-sm font-semibold">{project.budget_utilization}%</span>
                    </div>
                    <Progress value={project.budget_utilization} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to={`/account/projects/${id}/chat`}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message Team
                    </Link>
                  </Button>
                  {project.construction_request && (
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link to={`/account/construction-requests/${project.construction_request}`}>
                        <FileText className="w-4 h-4 mr-2" />
                        View Request
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default MyProjectDetail;
