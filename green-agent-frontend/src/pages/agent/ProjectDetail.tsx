import AgentShell from "@/components/layout/AgentShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { AGENT_PROJECTS_SEED } from "@/mocks/agent";

export default function ProjectDetail() {
  const { id } = useParams();
  const p = AGENT_PROJECTS_SEED.find((x) => x.id === id) ?? AGENT_PROJECTS_SEED[0];
  const milestones: { title: string; due?: string; done?: boolean }[] = [
    { title: "Site survey & soil test", done: true },
    { title: "Foundation pour", due: "2025-03-22" },
    { title: "Framing & roofing", due: "2025-04-30" },
    { title: "Solar + plumbing rough-ins", due: "2025-05-10" },
  ];
  const updates: { at: string; text: string }[] = [
    { at: "2025-03-09", text: "Soil test results confirm bearing capacity. Excavation scheduled." },
    { at: "2025-03-12", text: "Footing trenches completed. Rebar placement in progress." },
  ];
  const files: { name: string; size: string }[] = [
    { name: "Permit-Application.pdf", size: "220 KB" },
    { name: "Structural-Drawings-v2.pdf", size: "1.4 MB" },
  ];
  const team: { name: string; role: string }[] = [
    { name: "Jane Builder", role: "Project Manager" },
    { name: "Kwame Mensah", role: "Site Engineer" },
    { name: "Aisha Bello", role: "QS" },
  ];
  return (
    <AgentShell>
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{p.title}</h1>
              <div className="text-sm text-muted-foreground">ID: {p.id}</div>
            </div>
            <div className="text-right">
              <Badge variant="secondary">{p.status}</Badge>
              <div className="text-xs text-muted-foreground mt-1">Next: {p.nextMilestone ?? "TBD"}</div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="p-3 rounded-md bg-muted/30">
                    <div className="text-muted-foreground">Project</div>
                    <div className="font-medium">{p.title}</div>
                  </div>
                  <div className="p-3 rounded-md bg-muted/30">
                    <div className="text-muted-foreground">Status</div>
                    <div className="font-medium capitalize">{p.status.replace("_"," ")}</div>
                  </div>
                  <div className="p-3 rounded-md bg-muted/30">
                    <div className="text-muted-foreground">Next Milestone</div>
                    <div className="font-medium">{p.nextMilestone ?? "TBD"}</div>
                  </div>
                  <div className="p-3 rounded-md bg-muted/30">
                    <div className="text-muted-foreground">Start</div>
                    <div className="font-medium">2025-03-01</div>
                  </div>
                  <div className="p-3 rounded-md bg-muted/30">
                    <div className="text-muted-foreground">Budget</div>
                    <div className="font-medium">USD 250,000</div>
                  </div>
                  <div className="p-3 rounded-md bg-muted/30">
                    <div className="text-muted-foreground">Client</div>
                    <div className="font-medium">client@domain.com</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="milestones">
              <Card>
                <CardHeader className="flex-row items-center justify-between"><CardTitle>Milestones</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild><Button size="sm" variant="outline">Add Milestone</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Add Milestone (demo)</DialogTitle></DialogHeader>
                      <div className="grid gap-2">
                        <Input placeholder="Title" />
                        <Input placeholder="Due (YYYY-MM-DD)" />
                        <Button>Add</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="p-4 text-sm space-y-2">
                  {milestones.map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-md bg-muted/30">
                      <div>
                        <div className="font-medium">{m.title}</div>
                        <div className="text-xs text-muted-foreground">{m.due ? `Due ${m.due}` : (m.done ? "Done" : "TBD")}</div>
                      </div>
                      <Badge variant={m.done ? "default" : "secondary"}>{m.done ? "done" : (m.due ? "upcoming" : "pending")}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="updates">
              <Card>
                <CardHeader className="flex-row items-center justify-between"><CardTitle>Updates</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild><Button size="sm" variant="outline">Post Update</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Post Update (demo)</DialogTitle></DialogHeader>
                      <div className="grid gap-2">
                        <Textarea placeholder="Update text" />
                        <Button>Post</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="p-4 text-sm space-y-2">
                  {updates.map((u, i) => (
                    <div key={i} className="p-3 rounded-md bg-muted/30">
                      <div className="text-xs text-muted-foreground">{u.at}</div>
                      <div>{u.text}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="files">
              <Card>
                <CardHeader><CardTitle>Files</CardTitle></CardHeader>
                <CardContent className="p-4 text-sm space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-md bg-muted/30">
                      <div>
                        <div className="font-medium">{f.name}</div>
                        <div className="text-xs text-muted-foreground">{f.size}</div>
                      </div>
                      <Button variant="outline" size="sm">Download</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="team">
              <Card>
                <CardHeader><CardTitle>Team</CardTitle></CardHeader>
                <CardContent className="p-4 text-sm space-y-2">
                  {team.map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-md bg-muted/30">
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </AgentShell>
  );
}
