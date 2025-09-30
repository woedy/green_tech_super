import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import AgentShell from "@/components/layout/AgentShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchProjects } from "@/lib/api";
import { asArray } from "@/types/api";
import { ProjectSummary } from "@/types/project";

export default function Projects() {
  const [status, setStatus] = useState<string>('all');
  const { data, isLoading } = useQuery({
    queryKey: ["projects", status],
    queryFn: () => fetchProjects({ status: status === 'all' ? undefined : status }),
  });

  const rows = useMemo<ProjectSummary[]>(() => {
    return data ? asArray(data) : [];
  }, [data]);
  return (
    <AgentShell>
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Projects</h1>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
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
                    <TableHead>Planned End</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">Loading projects…</TableCell>
                    </TableRow>
                  )}
                  {!isLoading && rows.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.id}</TableCell>
                      <TableCell>{p.title}</TableCell>
                      <TableCell><Badge variant="secondary">{p.status_display ?? p.status}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{p.planned_end_date ? new Date(p.planned_end_date).toLocaleDateString() : '—'}</TableCell>
                      <TableCell className="text-right"><Button asChild variant="outline" size="sm"><Link to={`/projects/${p.id}`}>Open</Link></Button></TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">No projects found for this filter.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </section>
    </AgentShell>
  );
}

