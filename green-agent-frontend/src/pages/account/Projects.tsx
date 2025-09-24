import AgentShell from "@/components/layout/AgentShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { PROJECTS } from "@/mocks/projects";
import { useMemo, useState } from "react";

const Projects = () => {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const rows = useMemo(() => PROJECTS.filter(p => (
    (!q || p.title.toLowerCase().includes(q.toLowerCase())) &&
    (status === 'all' || p.status === status as any)
  )), [q, status]);

  return (
    <AgentShell>
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Projects</h1>
          <div className="flex items-center gap-2">
            <Input placeholder="Search projects..." value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
            <Button variant="outline" onClick={() => { setQ(""); setStatus("all"); }}>Reset</Button>
          </div>
        </div>
      </section>
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Milestone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{p.id}</TableCell>
                      <TableCell>{p.title}</TableCell>
                      <TableCell><Badge variant="secondary">{p.status}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{p.nextMilestone ?? 'TBD'}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm"><Link to={`/projects/${p.id}`}>Open</Link></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </section>
    </AgentShell>
  );
};

export default Projects;
