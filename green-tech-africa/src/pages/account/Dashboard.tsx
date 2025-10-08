import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProjectStatusCard } from "@/components/dashboard/ProjectStatusCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";
import { SavedSearchesWidget } from "@/components/dashboard/SavedSearchesWidget";
import { 
  ClipboardList,
  FileSpreadsheet,
  Calendar,
  TrendingUp
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { getSavedSearches, toggleAlerts, deleteSavedSearch, type SavedSearch } from "@/lib/savedSearches";
import { MOCK_NOTIFICATIONS, MOCK_ACTIVITIES, DEFAULT_NOTIFICATION_PREFERENCES } from "@/mocks/notifications";
import type { ProjectSummary } from "@/types/project";
import type { Notification, NotificationPreferences } from "@/components/dashboard/NotificationCenter";
import type { ActivityItem } from "@/components/dashboard/ActivityFeed";

const Dashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [activities] = useState<ActivityItem[]>(MOCK_ACTIVITIES);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSavedSearches(getSavedSearches());
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await api.get<ProjectSummary[]>("/api/construction/projects/");
        if (!cancelled) {
          setProjects(data);
        }
      } catch (err) {
        console.error("Failed to load projects:", err);
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

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleUpdatePreferences = (prefs: NotificationPreferences) => {
    setNotificationPrefs(prefs);
    // In a real app, this would save to backend
    console.log("Updated notification preferences:", prefs);
  };

  const activeProjects = projects.filter(p => 
    p.status.toLowerCase() === 'in_progress' || p.status.toLowerCase() === 'planning'
  );
  const unreadNotifications = notifications.filter(n => !n.read).length;

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
                    <div className="text-2xl font-bold">{activeProjects.length}</div>
                  </div>
                  <TrendingUp className="w-8 h-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-soft hover:shadow-medium smooth-transition">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">All Projects</div>
                    <div className="text-2xl font-bold">{projects.length}</div>
                  </div>
                  <ClipboardList className="w-8 h-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-soft hover:shadow-medium smooth-transition">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Notifications</div>
                    <div className="text-2xl font-bold">{unreadNotifications}</div>
                  </div>
                  <FileSpreadsheet className="w-8 h-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-soft hover:shadow-medium smooth-transition">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Saved Searches</div>
                    <div className="text-2xl font-bold">{savedSearches.length}</div>
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
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-destructive text-destructive-foreground rounded-full">
                    {unreadNotifications}
                  </span>
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
                    {loading ? (
                      <Card>
                        <CardContent className="p-6 text-sm text-muted-foreground">
                          Loading projects...
                        </CardContent>
                      </Card>
                    ) : activeProjects.length === 0 ? (
                      <Card>
                        <CardContent className="p-6 text-sm text-muted-foreground text-center">
                          <p>No active projects yet.</p>
                          <Button variant="hero" className="mt-4" asChild>
                            <Link to="/plans">Start a new request</Link>
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
                  <ActivityFeed activities={activities} maxItems={5} />
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
                <ActivityFeed activities={activities} maxItems={20} />
              </div>
            </TabsContent>

            <TabsContent value="notifications">
              <div className="max-w-4xl mx-auto">
                <NotificationCenter
                  notifications={notifications}
                  preferences={notificationPrefs}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  onUpdatePreferences={handleUpdatePreferences}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
};

export default Dashboard;

