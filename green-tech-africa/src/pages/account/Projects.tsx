import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import type { ProjectSummary } from "@/types/project";

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

const Projects = () => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await api.get<ProjectSummary[] | PaginatedResponse<ProjectSummary>>("/api/construction/projects/");
        if (!cancelled) {
          if (Array.isArray(data)) {
            setProjects(data);
          } else if (data && Array.isArray((data as PaginatedResponse<ProjectSummary>).results)) {
            setProjects((data as PaginatedResponse<ProjectSummary>).results);
          } else {
            setProjects([]);
          }
          setError(null);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          // Set empty array on error to prevent map issues
          setProjects([]);
          setError((err as Error).message ?? "Unable to load projects.");
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
  }, []);

  return (
    <Layout>
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            <h1 className="text-2xl md:text-3xl font-bold">Projects</h1>
          </div>
          <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-1" /> Filters</Button>
        </div>
      </section>
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          {loading && (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading your projects…</CardContent></Card>
          )}
          {error && !loading && (
            <Card><CardContent className="p-6 text-sm text-destructive">{error}</CardContent></Card>
          )}
          {!loading && !error && Array.isArray(projects) && projects.map((project) => (
            <Card key={project.id} className="shadow-soft hover:shadow-medium smooth-transition">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-medium">{project.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Phase: {project.phase_display ?? project.current_phase}
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={Math.round(project.progress_percentage)} className="w-32" />
                    <span className="text-xs text-muted-foreground">{Math.round(project.progress_percentage)}% complete</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="capitalize">{project.status_display ?? project.status.toLowerCase()}</Badge>
                  <Button asChild variant="outline" size="sm"><Link to={`/account/projects/${project.id}`}>Open</Link></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {!loading && !error && Array.isArray(projects) && projects.length === 0 && (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">No projects yet. Once your quote is approved, your project will appear here.</CardContent></Card>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Projects;
