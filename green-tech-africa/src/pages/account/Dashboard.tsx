import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ProjectStatusCard } from "@/components/dashboard/ProjectStatusCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { NotificationCenter, type Notification, type NotificationPreferences } from "@/components/dashboard/NotificationCenter";
import { SavedSearchesWidget } from "@/components/dashboard/SavedSearchesWidget";
import { 
  ClipboardList,
  FileSpreadsheet,
  Calendar,
  TrendingUp,
  Users,
  Building,
  CheckCircle2,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api, dashboardApi, type CustomerDashboardMetrics, type CustomerNotifications } from "@/lib/api";
import { getSavedSearches, toggleAlerts, deleteSavedSearch, type SavedSearch } from "@/lib/savedSearches";
import type { ProjectSummary } from "@/types/project";
import { useEffect, useState } from "react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // Dashboard data from API
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery({
    queryKey: ['customer-dashboard'],
    queryFn: dashboardApi.getCustomerDashboard,
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });

  const { data: notificationData, isLoading: notificationsLoading } = useQuery({
    queryKey: ['customer-notifications'],
    queryFn: dashboardApi.getCustomerNotifications,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });

  useEffect(() => {
    setSavedSearches(getSavedSearches());
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setProjectsLoading(true);
        const data = await api.get<ProjectSummary[]>("/api/construction/projects/");
        if (!cancelled) {
          setProjects(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load projects:", err);
        if (!cancelled) {
          setProjects([]);
        }
      } finally {
        if (!cancelled) {
          setProjectsLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleAlerts = (id: string) => {
    setSavedSearches(toggleAlerts(id));
  };

  const handleDeleteSearch = (id: string) => {
    setSavedSearches(deleteSavedSearch(id));
  };

  const handleApplySearch = (search: SavedSearch) => {
    const params = new URLSearchParams();
    const f = search.filters as any;
    if (f.q) params.set("q", f.q);
    if (f.type) params.set("type", f.type);
    if (f.location) params.set("location", f.location);
    navigate(`/properties?${params.toString()}`);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await dashboardApi.markNotificationAsRead(id);
      // Refetch notifications to update UI
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await dashboardApi.markAllNotificationsAsRead();
      // Refetch notifications to update UI
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
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
      // Refetch notifications to update UI
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  const activeProjects = Array.isArray(projects) ? projects.filter(p => 
    p.status.toLowerCase() === 'in_progress' || p.status.toLowerCase() === 'planning'
  ) : [];

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
        <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl md:text-4xl font-bold">Welcome back</h1>
              <p className="text-muted-foreground">Your projects, quotes, and requests at a glance.</p>
            </div>
          </div>
        </section>
        
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-red-600">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-semibold">Failed to load dashboard</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {dashboardError instanceof Error ? dashboardError.message : 'Please try again later'}
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </Layout>
    );
  }

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
            <Card className="shadow-soft hover:shadow-medium smooth-transition">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Active Projects</div>
                    {dashboardLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    ) : (
                      <div className="text-2xl font-bold">{dashboardData?.projects.active || 0}</div>
                    )}
                  </div>
                  <Building className="w-8 h-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-soft hover:shadow-medium smooth-transition">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Leads</div>
                    {dashboardLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    ) : (
                      <div className="text-2xl font-bold">{dashboardData?.leads.total || 0}</div>
                    )}
                  </div>
                  <Users className="w-8 h-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-soft hover:shadow-medium smooth-transition">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Pending Quotes</div>
                    {dashboardLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    ) : (
                      <div className="text-2xl font-bold">{dashboardData?.quotes.pending || 0}</div>
                    )}
                  </div>
                  <FileSpreadsheet className="w-8 h-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-soft hover:shadow-medium smooth-transition">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Notifications</div>
                    {notificationsLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    ) : (
                      <div className="text-2xl font-bold">{unreadNotifications}</div>
                    )}
                  </div>
                  <Calendar className="w-8 h-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity Feed</TabsTrigger>
              <TabsTrigger value="notifications">
                Notifications
                {unreadNotifications > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                    {unreadNotifications}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Main content - 2 columns */}
                <div className="xl:col-span-2 space-y-6">
                  {/* Active Projects */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold">Active Projects</h2>
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/account/projects">View all</Link>
                      </Button>
                    </div>
                    {projectsLoading ? (
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Loading projects...</span>
                          </div>
                        </CardContent>
                      </Card>
                    ) : activeProjects.length === 0 ? (
                      <Card>
                        <CardContent className="p-6 text-sm text-muted-foreground text-center">
                          <p>No active projects yet.</p>
                          <Button variant="hero" className="mt-4" asChild>
                            <Link to="/plans">Browse Plans to Request</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {activeProjects.slice(0, 3).map((project) => (
                          <ProjectStatusCard key={project.id} project={project} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Activity */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Recent Activity</h2>
                    {dashboardLoading ? (
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Loading activities...</span>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <ActivityFeed 
                        activities={dashboardData?.recent_activities || []} 
                        maxItems={5} 
                      />
                    )}
                  </div>
                </div>

                {/* Sidebar - 1 column */}
                <div className="space-y-6">
                  {/* Saved Searches */}
                  <SavedSearchesWidget
                    searches={savedSearches}
                    onToggleAlerts={handleToggleAlerts}
                    onDelete={handleDeleteSearch}
                    onApply={handleApplySearch}
                    maxItems={3}
                  />

                  {/* Quick Actions */}
                  <Card className="shadow-medium">
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-semibold text-sm mb-3">Quick Actions</h3>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link to="/plans">
                          <ClipboardList className="w-4 h-4 mr-2" />
                          Request New Build
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link to="/properties">
                          <FileSpreadsheet className="w-4 h-4 mr-2" />
                          Browse Properties
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link to="/account/messages">
                          <Calendar className="w-4 h-4 mr-2" />
                          View Messages
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <div className="max-w-4xl mx-auto">
                {dashboardLoading ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span className="text-muted-foreground">Loading activities...</span>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <ActivityFeed 
                    activities={dashboardData?.recent_activities || []} 
                    maxItems={20} 
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="notifications">
              <div className="max-w-4xl mx-auto">
                {notificationsLoading ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span className="text-muted-foreground">Loading notifications...</span>
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
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No notifications available</p>
                    </CardContent>
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

