import Layout from "@/components/layout/Layout";
import AccountPageHeader from "@/components/account/AccountPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Building2, Calendar, Loader2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Project {
  id: number;
  title: string;
  status: string;
  current_phase: string;
  progress_percentage: number;
  planned_end_date?: string;
  estimated_budget: string;
  currency: string;
  is_behind_schedule: boolean;
}

const statusConfig = {
  DRAFT: { label: "Draft", variant: "secondary" as const },
  PLANNING: { label: "Planning", variant: "default" as const },
  IN_PROGRESS: { label: "In Progress", variant: "default" as const },
  ON_HOLD: { label: "On Hold", variant: "outline" as const },
  COMPLETED: { label: "Completed", variant: "outline" as const },
  CANCELLED: { label: "Cancelled", variant: "destructive" as const },
  DELAYED: { label: "Delayed", variant: "destructive" as const },
};

const MyProjects = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["my-projects"],
    queryFn: () => api.get<{ results: Project[] }>("/api/construction/projects/").then((res) => res.results || []),
  });

  const projects = data || [];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex min-h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading projects...</span>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex min-h-96 items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-red-600">Error loading projects</h2>
            <p className="text-muted-foreground">Please try again later.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <AccountPageHeader
          title="My Projects"
          description="Track your construction projects, progress milestones, and due dates."
          icon={<Building2 className="h-3.5 w-3.5" />}
          actions={
            <Button variant="outline" asChild>
              <Link to="/account/projects">Browse Project Catalog</Link>
            </Button>
          }
        />

        <section className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {projects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 py-12 text-center">
                <Building2 className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-xl font-semibold">No Projects Yet</h3>
                <p className="mb-6 text-muted-foreground">
                  You don't have active projects yet. Browse plans to get started.
                </p>
                <div className="flex justify-center gap-3">
                  <Button asChild>
                    <Link to="/plans">Browse Plans</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/account/requests">View My Requests</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => {
                  const statusInfo = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.DRAFT;

                  return (
                    <Card key={project.id} className="border-border/70 shadow-soft smooth-transition hover:-translate-y-0.5 hover:shadow-medium">
                      <CardHeader>
                        <div className="mb-2 flex items-start justify-between">
                          <CardTitle className="line-clamp-2 text-lg">{project.title}</CardTitle>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          <span>{project.current_phase?.replace(/_/g, " ")}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-medium">Progress</span>
                            <span className="text-sm font-semibold">{project.progress_percentage}%</span>
                          </div>
                          <Progress value={project.progress_percentage} className="h-2" />
                          {project.is_behind_schedule && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-orange-600">
                              <AlertCircle className="h-3 w-3" />
                              <span>Behind schedule</span>
                            </div>
                          )}
                        </div>

                        {project.planned_end_date && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Due: {new Date(project.planned_end_date).toLocaleDateString()}</span>
                          </div>
                        )}

                        <div className="text-sm">
                          <span className="text-muted-foreground">Budget: </span>
                          <span className="font-semibold">
                            {project.currency} {Number(project.estimated_budget).toLocaleString()}
                          </span>
                        </div>

                        <Button className="w-full" asChild>
                          <Link to={`/account/my-projects/${project.id}`}>View Details</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default MyProjects;
