import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  FileText, 
  Building, 
  TrendingUp, 
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { dashboardApi, type CustomerDashboardMetrics, type CustomerNotifications } from "@/lib/api";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";
import { Link } from "react-router-dom";

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  description,
  loading = false 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ComponentType<{ className?: string }>; 
  description?: string;
  loading?: boolean;
}) => (
  <Card>
    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
      <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      ) : (
        <>
          <div className="text-2xl font-semibold">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

export default function Dashboard() {
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

  const handleMarkAsRead = async (id: string) => {
    try {
      await dashboardApi.markNotificationAsRead(id);
      // Refetch notifications to update UI
      // In a real app, you'd use optimistic updates
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

  const handleUpdatePreferences = async (preferences: CustomerNotifications['preferences']) => {
    try {
      await dashboardApi.updateNotificationPreferences(preferences);
      // Refetch notifications to update UI
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  if (dashboardError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">My Dashboard</h1>
            <p className="text-muted-foreground">Track your projects and stay updated</p>
          </div>
          
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
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground">Track your projects and stay updated</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Active Leads"
            value={dashboardData?.leads.pending || 0}
            icon={Users}
            description="Awaiting response"
            loading={dashboardLoading}
          />
          <StatCard
            title="Pending Quotes"
            value={dashboardData?.quotes.pending || 0}
            icon={FileText}
            description="Ready for review"
            loading={dashboardLoading}
          />
          <StatCard
            title="Active Projects"
            value={dashboardData?.projects.active || 0}
            icon={Building}
            description="In progress"
            loading={dashboardLoading}
          />
          <StatCard
            title="Completed Projects"
            value={dashboardData?.projects.completed || 0}
            icon={CheckCircle2}
            description="Successfully finished"
            loading={dashboardLoading}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="activity" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="notifications" className="relative">
              Notifications
              {notificationData && notificationData.unread_count > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs"
                >
                  {notificationData.unread_count}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2 text-muted-foreground">Loading activities...</span>
                  </div>
                ) : dashboardData?.recent_activities.length ? (
                  <ActivityFeed 
                    activities={dashboardData.recent_activities}
                    maxItems={10}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                    <p className="text-sm">Your project updates will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            {notificationsLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2 text-muted-foreground">Loading notifications...</span>
                  </div>
                </CardContent>
              </Card>
            ) : notificationData ? (
              <NotificationCenter
                notifications={notificationData.notifications}
                preferences={notificationData.preferences}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                onUpdatePreferences={handleUpdatePreferences}
              />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications available</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Leads Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Leads Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading...</span>
                    </div>
                  ) : dashboardData ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Leads</span>
                        <Badge variant="secondary">{dashboardData.leads.total}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Pending Response</span>
                        <Badge variant="outline">{dashboardData.leads.pending}</Badge>
                      </div>
                      <div className="pt-2">
                        <Link to="/leads">
                          <Button variant="outline" size="sm" className="w-full">
                            View All Leads
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Projects Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Projects Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading...</span>
                    </div>
                  ) : dashboardData ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Projects</span>
                        <Badge variant="secondary">{dashboardData.projects.total}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Active</span>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {dashboardData.projects.active}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Completed</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {dashboardData.projects.completed}
                        </Badge>
                      </div>
                      <div className="pt-2">
                        <Link to="/projects">
                          <Button variant="outline" size="sm" className="w-full">
                            View All Projects
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}