import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PROJECTS } from "@/mocks/projects";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ProjectDetail = () => {
  const { id } = useParams();
  const p = PROJECTS.find((x) => x.id === id) ?? PROJECTS[0];

  return (
    <Layout>
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{p.title}</h1>
            <Badge variant="secondary" className="mt-2">{p.status}</Badge>
          </div>
          <Button variant="outline" asChild><Link to="/account/projects"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Link></Button>
        </div>
      </section>
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader><CardTitle>Milestones</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {p.milestones.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-md bg-muted/30">
                    <div>{m.title}</div>
                    <div className="text-muted-foreground">{m.done ? "Done" : (m.due ?? "TBD")}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Updates</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {p.updates.map((u, i) => (
                  <div key={i} className="p-3 rounded-md bg-muted/30">
                    <div className="text-xs text-muted-foreground">{u.at}</div>
                    <div>{u.text}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" asChild><Link to="/account/messages">Message PM</Link></Button>
                <Button variant="outline" className="w-full" asChild><Link to="/account/appointments">Schedule Visit</Link></Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ProjectDetail;

