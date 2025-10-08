import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Calendar, Clock, Users, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";

import AgentShell from "@/components/layout/AgentShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchProjects } from "@/lib/api";
import { asArray } from "@/types/api";
import { ProjectSummary } from "@/types/project";

export default function ProjectManagement() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("due_date");

  const { data: projectsResponse, isLoading } = useQuery({
    queryKey: ["projects", statusFilter],
    queryFn: () => fetchProjects({ status: statusFilter === "all" ? undefined : statusFilter }),
  });

  const projects = asArray(projectsResponse || []);

  // Calculate summary statistics
  const stats = {
    total: projects.length,
    inProgress: projects.filter(p => p.status === "in_progress").length,
    planning: projects.filter(p => p.status === "planning").length,
    completed: projects.filter(p => p.status === "completed").length,
    overdue: projects.filter(p => {
      if (!p.planned_end_date) return false;
      return new Date(p.planned_end_date) < new Date() && p.status !== "completed";
    }).length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "planning":
        return "bg-yellow-100 text-yellow-800";
      case "on_hold":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "text-green-600";
    if (progress >= 50) return "text-blue-600";
    if (progress >= 25) return "text-yellow-600";
    return "text-red-600";
  };

  const isProjectOverdue = (project: ProjectSummary) => {
    if (!project.planned_end_date || project.status === "completed") return false;
    return new Date(project.planned_end_date) < new Date();
  };

  return (
    <AgentShell>
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Project Management</h1>
              <p className="text-muted-foreground">
                Manage your construction projects, milestones, and client communication
              </p>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="due_date">Due Date</SelectItem>
                  <SelectItem value="progress">Progress</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Planning</CardTitle>
                <Calendar className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.planning}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Loading projects...</div>
            </div>
          ) : projects.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-muted-foreground">
                  No projects found for the selected filter.
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{project.title}</CardTitle>
                        <div className="text-sm text-muted-foreground mt-1">
                          ID: {project.id}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={getStatusColor(project.status)}>
                          {project.status_display || project.status}
                        </Badge>
                        {isProjectOverdue(project) && (
                          <Badge variant="destructive" className="text-xs">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Progress */}
                    {project.progress_percentage !== undefined && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span className={getProgressColor(project.progress_percentage)}>
                            {Math.round(project.progress_percentage)}%
                          </span>
                        </div>
                        <Progress value={project.progress_percentage} className="h-2" />
                      </div>
                    )}

                    {/* Phase */}
                    {project.current_phase && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Current Phase: </span>
                        <span className="font-medium">{project.phase_display || project.current_phase}</span>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="space-y-1 text-sm">
                      {project.planned_start_date && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Start:</span>
                          <span>{new Date(project.planned_start_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {project.planned_end_date && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Due:</span>
                          <span className={isProjectOverdue(project) ? "text-red-600 font-medium" : ""}>
                            {new Date(project.planned_end_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Team */}
                    {(project.project_manager || project.site_supervisor) && (
                      <div className="space-y-1 text-sm">
                        {project.project_manager && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">PM:</span>
                            <span className="truncate ml-2">{project.project_manager.name}</span>
                          </div>
                        )}
                        {project.site_supervisor && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Supervisor:</span>
                            <span className="truncate ml-2">{project.site_supervisor.name}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link to={`/projects/${project.id}`}>
                          View Details
                        </Link>
                      </Button>
                      <Button asChild size="sm" className="flex-1">
                        <Link to={`/projects/${project.id}?tab=communication`}>
                          Message Client
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </AgentShell>
  );
}