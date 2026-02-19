import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ProjectStatusCard } from "@/components/dashboard/ProjectStatusCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import {
  NotificationCenter,
  type Notification,
  type NotificationPreferences,
} from "@/components/dashboard/NotificationCenter";
import { SavedSearchesWidget } from "@/components/dashboard/SavedSearchesWidget";
import {
  AlertTriangle,
  Bell,
  Building,
  ClipboardList,
  FileSpreadsheet,
  Loader2,
  MessageSquare,
  Sparkles,
  Users,
} from "lucide-react";
import { api, dashboardApi } from "@/lib/api";
import {
  deleteSavedSearch,
  getSavedSearches,
  toggleAlerts,
  type SavedSearch,
} from "@/lib/savedSearches";
import type { ProjectSummary } from "@/types/project";

const Dashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useQuery({
    queryKey: ["customer-dashboard"],
    queryFn: dashboardApi.getCustomerDashboard,
    refetchInterval: 2 * 60 * 1000,
  });

  const { data: notificationData, isLoading: notificationsLoading } = useQuery({
    queryKey: ["customer-notifications"],
    queryFn: dashboardApi.getCustomerNotifications,
    refetchInterval: 30 * 1000,
  });

  useEffect(() => {
    setSavedSearches(getSavedSearches());
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      try {
        setProjectsLoading(true);
        const data = await api.get<ProjectSummary[]>("/api/construction/projects/");
        if (!cancelled) setProjects(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load projects:", error);
        if (!cancelled) setProjects([]);
      } finally {
        if (!cancelled) setProjectsLoading(false);
      }
    };

    loadProjects();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleApplySearch = (search: SavedSearch) => {
    const params = new URLSearchParams();
    const filters = search.filters as Record<string, string | undefined>;
    if (filters.q) params.set("q", filters.q);
    if (filters.type) params.set("type", filters.type);
    if (filters.location) params.set("location", filters.location);
    navigate(`/properties?${params.toString()}`);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await dashboardApi.markNotificationAsRead(id);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await dashboardApi.markAllNotificationsAsRead();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleUpdatePreferences = async (preferences: NotificationPreferences) => {
    try {
      await dashboardApi.updateNotificationPreferences({
        email: preferences.email,
        sms: preferences.sms,
        in_app: preferences.inApp,
        project_updates: preferences.projectUpdates,
        quote_notifications: preferences.quoteNotifications,
        payment_reminders: preferences.paymentReminders,
        marketing_emails: preferences.marketingEmails,
      });
    } catch (error) {
      console.error("Failed to update preferences:", error);
    }
  };

  const activeProjects = projects.filter(
    (project) =>
      project.status.toLowerCase() === "in_progress" || project.status.toLowerCase() === "planning",
  );

  const unreadNotifications = notificationData?.unread_count || 0;

  const notificationsForUi: Notification[] = (notificationData?.notifications || []).map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    timestamp: n.timestamp,
    read: n.read,
    actionUrl: n.action_url,
    actionLabel: n.action_label,
  }));

  const preferencesForUi: NotificationPreferences = {
    email: notificationData?.preferences.email ?? true,
    sms: notificationData?.preferences.sms ?? false,
    inApp: notificationData?.preferences.in_app ?? true,
    projectUpdates: notificationData?.preferences.project_updates ?? true,
    quoteNotifications: notificationData?.preferences.quote_notifications ?? true,
    paymentReminders: notificationData?.preferences.payment_reminders ?? true,
    marketingEmails: notificationData?.preferences.marketing_emails ?? false,
  };

  if (dashboardError) {
    return (
      <Layout>
        <section className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Card className="border-destructive/30">
              <CardContent className="p-8 text-center">
                <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-destructive" />
                <p className="text-lg font-semibold">Failed to load dashboard</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {dashboardError instanceof Error ? dashboardError.message : "Please try again later."}
                </p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="border-b border-border/70 bg-gradient-to-b from-accent/30 to-background py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Customer Workspace
              </div>
              <h1 className="text-2xl font-bold md:text-4xl">Welcome back</h1>
              <p className="mt-1 text-muted-foreground">Track projects, quotes, requests and communication in one place.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link to="/account/requests/new">
                  <ClipboardList className="mr-2 h-4 w-4" /> New Request
                </Link>
              </Button>
              <Button variant="hero" asChild>
                <Link to="/account/messages">
                  <MessageSquare className="mr-2 h-4 w-4" /> Open Messages
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Active Projects",
                value: dashboardData?.projects.active ?? 0,
                icon: Building,
                loading: dashboardLoading,
              },
              {
                label: "Total Leads",
                value: dashboardData?.leads.total ?? 0,
                icon: Users,
                loading: dashboardLoading,
              },
              {
                label: "Pending Quotes",
                value: dashboardData?.quotes.pending ?? 0,
                icon: FileSpreadsheet,
                loading: dashboardLoading,
              },
              {
                label: "Unread Notifications",
                value: unreadNotifications,
                icon: Bell,
                loading: notificationsLoading,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label} className="border-border/70 bg-card/80 shadow-soft">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                        <div className="mt-1 text-2xl font-bold">
                          {item.loading ? <Loader2 className="h-5 w-5 animate-spin" /> : item.value}
                        </div>
                      </div>
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 md:w-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="notifications" className="relative">
                Notifications
                {unreadNotifications > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1 text-xs">
                    {unreadNotifications}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="space-y-6 xl:col-span-2">
                  <Card className="border-border/70 shadow-soft">
                    <CardContent className="p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Active Projects</h2>
                        <Button variant="outline" size="sm" asChild>
                          <Link to="/account/my-projects">View all</Link>
                        </Button>
                      </div>

                      {projectsLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading projects...
                        </div>
                      ) : activeProjects.length === 0 ? (
                        <div className="rounded-xl border border-dashed p-6 text-center">
                          <p className="text-sm text-muted-foreground">No active projects yet.</p>
                          <Button variant="hero" className="mt-4" asChild>
                            <Link to="/plans">Browse plans to request build</Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {activeProjects.slice(0, 3).map((project) => (
                            <ProjectStatusCard key={project.id} project={project} />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-border/70 shadow-soft">
                    <CardContent className="p-5">
                      <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
                      {dashboardLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading activity...
                        </div>
                      ) : (
                        <ActivityFeed activities={dashboardData?.recent_activities || []} maxItems={5} />
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <SavedSearchesWidget
                    searches={savedSearches}
                    onToggleAlerts={(id) => setSavedSearches(toggleAlerts(id))}
                    onDelete={(id) => setSavedSearches(deleteSavedSearch(id))}
                    onApply={handleApplySearch}
                    maxItems={3}
                  />

                  <Card className="border-border/70 shadow-soft">
                    <CardContent className="space-y-3 p-5">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Quick Actions</h3>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link to="/account/requests/new">
                          <ClipboardList className="mr-2 h-4 w-4" /> Request New Build
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link to="/account/properties">
                          <Building className="mr-2 h-4 w-4" /> Browse Properties
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link to="/account/messages">
                          <MessageSquare className="mr-2 h-4 w-4" /> View Messages
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <Card className="mx-auto max-w-5xl border-border/70 shadow-soft">
                <CardContent className="p-5">
                  {dashboardLoading ? (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" /> Loading activities...
                    </div>
                  ) : (
                    <ActivityFeed activities={dashboardData?.recent_activities || []} maxItems={20} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <div className="mx-auto max-w-5xl">
                {notificationsLoading ? (
                  <Card className="border-border/70 shadow-soft">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" /> Loading notifications...
                      </div>
                    </CardContent>
                  </Card>
                ) : notificationData ? (
                  <NotificationCenter
                    notifications={notificationsForUi}
                    preferences={preferencesForUi}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAllAsRead={handleMarkAllAsRead}
                    onUpdatePreferences={handleUpdatePreferences}
                  />
                ) : (
                  <Card className="border-border/70 shadow-soft">
                    <CardContent className="p-6 text-center text-muted-foreground">No notifications available.</CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
};

export default Dashboard;
