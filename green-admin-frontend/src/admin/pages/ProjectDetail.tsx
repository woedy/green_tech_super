import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Edit, Trash2, Calendar, DollarSign, Users, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { adminApi } from "@/admin/api";
import { MilestoneList } from "@/admin/components/MilestoneList";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useQuery({
    queryKey: ["admin-project", id],
    queryFn: () => adminApi.projects.get(Number(id)),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.projects.delete(Number(id)),
    onSuccess: () => {
      toast({ title: "Project deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      navigate("/admin/projects");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  if (!project) {
    return <div className="flex items-center justify-center h-96">Project not found</div>;
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLANNING: "bg-blue-100 text-blue-800",
      IN_PROGRESS: "bg-green-100 text-green-800",
      ON_HOLD: "bg-yellow-100 text-yellow-800",
      COMPLETED: "bg-gray-100 text-gray-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{project.title}</h1>
            <p className="text-muted-foreground">Project ID: {project.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`/admin/projects/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the project and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteMutation.mutate()}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Status and Progress */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(project.status)}>
              {project.status_display}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(project.progress_percentage || 0)}%</div>
            <Progress value={project.progress_percentage || 0} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.currency} {Number(project.estimated_budget || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Spent: {project.currency} {Number(project.actual_cost || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {project.planned_start_date && (
                <div>Start: {new Date(project.planned_start_date).toLocaleDateString()}</div>
              )}
              {project.planned_end_date && (
                <div>End: {new Date(project.planned_end_date).toLocaleDateString()}</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{project.description || "No description provided"}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2">Current Phase</h3>
                  <Badge variant="outline">{project.phase_display}</Badge>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Location</h3>
                  <p className="text-muted-foreground">{project.location || "Not specified"}</p>
                </div>
              </div>
              {project.is_behind_schedule && (
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">This project is behind schedule</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sustainability Metrics */}
          {(project.energy_efficiency_rating || project.water_efficiency_rating || project.sustainability_score) && (
            <Card>
              <CardHeader>
                <CardTitle>Sustainability Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {project.energy_efficiency_rating && (
                    <div>
                      <h3 className="font-semibold mb-2">Energy Rating</h3>
                      <div className="text-2xl font-bold">{project.energy_efficiency_rating}/5</div>
                    </div>
                  )}
                  {project.water_efficiency_rating && (
                    <div>
                      <h3 className="font-semibold mb-2">Water Rating</h3>
                      <div className="text-2xl font-bold">{project.water_efficiency_rating}/5</div>
                    </div>
                  )}
                  {project.sustainability_score && (
                    <div>
                      <h3 className="font-semibold mb-2">Sustainability Score</h3>
                      <div className="text-2xl font-bold">{project.sustainability_score}/100</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Team</CardTitle>
              <CardDescription>Team members assigned to this project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.project_manager && (
                <div>
                  <h3 className="font-semibold mb-2">Project Manager</h3>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {project.project_manager.first_name} {project.project_manager.last_name}
                    </span>
                    <span className="text-sm text-muted-foreground">({project.project_manager.email})</span>
                  </div>
                </div>
              )}
              {project.site_supervisor && (
                <div>
                  <h3 className="font-semibold mb-2">Site Supervisor</h3>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {project.site_supervisor.first_name} {project.site_supervisor.last_name}
                    </span>
                    <span className="text-sm text-muted-foreground">({project.site_supervisor.email})</span>
                  </div>
                </div>
              )}
              {project.contractors && project.contractors.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Contractors</h3>
                  <div className="space-y-2">
                    {project.contractors.map((contractor: any) => (
                      <div key={contractor.id} className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {contractor.first_name} {contractor.last_name}
                        </span>
                        <span className="text-sm text-muted-foreground">({contractor.email})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Milestones</CardTitle>
              <CardDescription>Track project progress through milestones</CardDescription>
            </CardHeader>
            <CardContent>
              {project?.id ? (
                <MilestoneList projectId={project.id} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Loading project data...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Documents</CardTitle>
              <CardDescription>Plans, permits, and other documents</CardDescription>
            </CardHeader>
            <CardContent>
              {project.documents && project.documents.length > 0 ? (
                <div className="space-y-2">
                  {project.documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div>
                        <h3 className="font-semibold">{doc.title}</h3>
                        <p className="text-sm text-muted-foreground">{doc.document_type_display}</p>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.is_required && (
                          <Badge variant="outline">Required</Badge>
                        )}
                        {doc.current_version && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={doc.current_version.download_url} target="_blank" rel="noopener noreferrer">
                              View
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No documents uploaded yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ProjectDetail;
