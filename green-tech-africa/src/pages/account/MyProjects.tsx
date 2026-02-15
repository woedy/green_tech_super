import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Building2, MapPin, Calendar, Loader2, TrendingUp, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Project {
  id: number;
  title: string;
  status: string;
  current_phase: string;
  progress_percentage: number;
  property: any;
  planned_start_date?: string;
  planned_end_date?: string;
  estimated_budget: string;
  currency: string;
  is_behind_schedule: boolean;
  created_at: string;
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
    queryKey: ['my-projects'],
    queryFn: () => api.get<{ results: Project[] }>('/api/construction/projects/').then(res => res.results || []),
  });

  const projects = data || [];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading projects...</span>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
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
        <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">My Projects</h1>
                <p className="text-muted-foreground">
                  Track your construction projects and their progress
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/account/projects">Browse Project Catalog</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
                <p className="text-muted-foreground mb-6">
                  You don't have any active projects. Browse our plans to get started.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button asChild>
                    <Link to="/plans">Browse Plans</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/account/requests">View My Requests</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => {
                  const statusInfo = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.DRAFT;
                  
                  return (
                    <Card key={project.id} className="hover:shadow-lg smooth-transition">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <CardTitle className="text-lg line-clamp-2">{project.title}</CardTitle>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="w-4 h-4" />
                          <span>{project.current_phase?.replace(/_/g, ' ')}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Progress */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Progress</span>
                            <span className="text-sm font-semibold">{project.progress_percentage}%</span>
                          </div>
                          <Progress value={project.progress_percentage} className="h-2" />
                          {project.is_behind_schedule && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                              <AlertCircle className="w-3 h-3" />
                              <span>Behind schedule</span>
                            </div>
                          )}
                        </div>

                        {/* Timeline */}
                        {project.planned_end_date && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Due: {new Date(project.planned_end_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                        {/* Budget */}
                        <div className="text-sm">
                          <span className="text-muted-foreground">Budget: </span>
                          <span className="font-semibold">
                            {project.currency} {Number(project.estimated_budget).toLocaleString()}
                          </span>
                        </div>

                        <Button className="w-full" asChild>
                          <Link to={`/account/my-projects/${project.id}`}>
                            View Details
                          </Link>
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
