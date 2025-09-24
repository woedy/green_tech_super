import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  ClipboardList,
  FileSpreadsheet,
  Building2,
  Calendar,
  MessageCircle,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  // Placeholder data to guide backend contracts
  const recentRequests = [
    { id: "REQ-1024", plan: "Green Valley Villa", region: "KE-Nairobi", submittedAt: "2025-03-10", status: "in_review" },
    { id: "REQ-1023", plan: "Urban Duplex A2", region: "NG-Lagos", submittedAt: "2025-03-08", status: "new" },
  ];
  const recentQuotes = [
    { id: "QUO-551", requestId: "REQ-1017", total: 125000, currency: "USD", status: "sent", sentAt: "2025-03-09" },
  ];
  const activeProjects = [
    { id: "PRJ-88", title: "Urban Duplex A2 - Lagos", nextMilestone: "Foundation pour (Mar 22)", progress: 35 },
  ];
  const upcomingAppointments = [
    { id: "APT-301", title: "Site viewing - Riverside Estate", date: "2025-03-15 10:00", location: "Nairobi" },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-bold">Welcome back</h1>
            <p className="text-muted-foreground">Your projects, quotes, and requests at a glance.</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Quick stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="shadow-soft">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Requests</div>
                <div className="text-2xl font-bold">{recentRequests.length}</div>
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Quotes</div>
                <div className="text-2xl font-bold">{recentQuotes.length}</div>
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Active Projects</div>
                <div className="text-2xl font-bold">{activeProjects.length}</div>
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Appointments</div>
                <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Requests */}
                <Card className="shadow-medium">
                  <CardHeader className="flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-5 h-5" />
                      <CardTitle>Recent Requests</CardTitle>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/account/requests">View all</Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentRequests.map((r) => (
                        <div key={r.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30">
                          <div>
                            <div className="font-medium">{r.plan}</div>
                            <div className="text-xs text-muted-foreground">{r.id} • {r.region} • {r.submittedAt}</div>
                          </div>
                          <Badge variant="secondary">{r.status}</Badge>
                        </div>
                      ))}
                      {recentRequests.length === 0 && (
                        <div className="text-sm text-muted-foreground">No requests yet.</div>
                      )}
                    </div>
                    <div className="mt-4">
                      <Button variant="hero" asChild>
                        <Link to="/plans">Start a new request</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Quotes */}
                <Card className="shadow-medium">
                  <CardHeader className="flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5" />
                      <CardTitle>Recent Quotes</CardTitle>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/account/quotes">View all</Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentQuotes.map((q) => (
                        <div key={q.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30">
                          <div>
                            <div className="font-medium">{q.id} • {q.currency} {q.total.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">For {q.requestId} • sent {q.sentAt}</div>
                          </div>
                          <Badge variant="secondary">{q.status}</Badge>
                        </div>
                      ))}
                      {recentQuotes.length === 0 && (
                        <div className="text-sm text-muted-foreground">No quotes yet.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Active Projects */}
                <Card className="shadow-medium">
                  <CardHeader className="flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      <CardTitle>Active Projects</CardTitle>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/account/projects">View all</Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {activeProjects.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30">
                          <div>
                            <div className="font-medium">{p.title}</div>
                            <div className="text-xs text-muted-foreground">Next: {p.nextMilestone}</div>
                          </div>
                          <Badge variant="secondary">{p.progress}%</Badge>
                        </div>
                      ))}
                      {activeProjects.length === 0 && (
                        <div className="text-sm text-muted-foreground">No active projects.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Appointments */}
                <Card className="shadow-medium">
                  <CardHeader className="flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      <CardTitle>Upcoming Appointments</CardTitle>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/account/appointments">View all</Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {upcomingAppointments.map((a) => (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30">
                          <div>
                            <div className="font-medium">{a.title}</div>
                            <div className="text-xs text-muted-foreground">{a.date} • {a.location}</div>
                          </div>
                          <Button variant="ghost" size="sm" className="group">
                            Details <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 smooth-transition" />
                          </Button>
                        </div>
                      ))}
                      {upcomingAppointments.length === 0 && (
                        <div className="text-sm text-muted-foreground">No upcoming appointments.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="messages">
              <Card className="shadow-medium">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    <CardTitle>Messages</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">Messaging UI will appear here. For now, visit <Link to="/account/messages" className="text-primary underline">Conversations</Link>.</div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
};

export default Dashboard;

