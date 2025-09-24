import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Filter } from "lucide-react";
import { PROJECTS } from "@/mocks/projects";
import { Link } from "react-router-dom";

const Projects = () => {
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
          {PROJECTS.map((p) => (
            <Card key={p.id} className="shadow-soft hover:shadow-medium smooth-transition">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-muted-foreground">Next: {p.nextMilestone ?? "TBD"}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{p.status}</Badge>
                  <Button asChild variant="outline" size="sm"><Link to={`/account/projects/${p.id}`}>Open</Link></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {PROJECTS.length === 0 && (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">No projects yet.</CardContent></Card>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Projects;

