import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Filter, Eye, Edit, Trash2, Calendar, DollarSign, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminApi } from "@/admin/api";

export default function AdminProjects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [phaseFilter, setPhaseFilter] = useState("all");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["admin-projects", statusFilter, phaseFilter, searchTerm],
    queryFn: () => {
      const params: { status?: string; phase?: string; search?: string } = {};
      
      if (statusFilter && statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (phaseFilter && phaseFilter !== "all") {
        params.phase = phaseFilter;
      }
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      return adminApi.projects.list(params);
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-projects-stats"],
    queryFn: () => adminApi.projects.stats(),
  });

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

  const getPhaseColor = (phase: string) => {
    const colors: Record<string, string> = {
      PLANNING: "bg-purple-100 text-purple-800",
      DESIGN: "bg-indigo-100 text-indigo-800",
      PERMITTING: "bg-blue-100 text-blue-800",
      CONSTRUCTION: "bg-orange-100 text-orange-800",
      FINISHING: "bg-yellow-100 text-yellow-800",
      HANDOVER: "bg-green-100 text-green-800",
    };
    return colors[phase] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage construction projects</p>
        </div>
        <Button asChild>
          <Link to="/admin/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_projects}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.by_status.in_progress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.by_status.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(stats.budget_summary.total_estimated / 1000000).toFixed(1)}M
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PLANNING">Planning</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={phaseFilter} onValueChange={setPhaseFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Phases</SelectItem>
                <SelectItem value="PLANNING">Planning</SelectItem>
                <SelectItem value="DESIGN">Design</SelectItem>
                <SelectItem value="PERMITTING">Permitting</SelectItem>
                <SelectItem value="CONSTRUCTION">Construction</SelectItem>
                <SelectItem value="FINISHING">Finishing</SelectItem>
                <SelectItem value="HANDOVER">Handover</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>
            {projects?.count || 0} project(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading projects...</div>
          ) : projects && projects.results.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.results.map((project: any) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.title}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status_display}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getPhaseColor(project.current_phase)}>
                        {project.phase_display}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${project.progress_percentage || 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(project.progress_percentage || 0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {project.project_manager ? (
                        <span className="text-sm">
                          {project.project_manager.first_name} {project.project_manager.last_name}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.planned_start_date
                        ? new Date(project.planned_start_date).toLocaleDateString()
                        : "Not set"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/admin/projects/${project.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/admin/projects/${project.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No projects found. Create your first project to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
