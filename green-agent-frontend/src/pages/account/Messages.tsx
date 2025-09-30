import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";

import AgentShell from "@/components/layout/AgentShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchProjects } from "@/lib/api";
import { asArray } from "@/types/api";
import { ProjectSummary } from "@/types/project";

const Messages = () => {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["projects", "messages"],
    queryFn: () => fetchProjects(),
  });

  const threads = useMemo<ProjectSummary[]>(() => (data ? asArray(data) : []), [data]);
  const filtered = threads.filter((project) => project.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <AgentShell>
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Messages</h1>
          </div>
          <div className="w-64">
            <Input placeholder="Search threads..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </section>

      <section className="py-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          {isLoading && (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading conversations…</CardContent></Card>
          )}
          {!isLoading && filtered.map((project) => (
            <Card key={project.id} className="shadow-soft hover:shadow-medium smooth-transition">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{project.title}</div>
                  <div className="text-xs text-muted-foreground">Status: {project.status_display ?? project.status}</div>
                </div>
                <Button asChild variant="outline" size="sm"><Link to={`/messages/${project.id}`}>Open</Link></Button>
              </CardContent>
            </Card>
          ))}
          {!isLoading && filtered.length === 0 && (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">No conversations found.</CardContent></Card>
          )}
        </div>
      </section>
    </AgentShell>
  );
};

export default Messages;
