import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, Clock, Activity, TrendingUp } from 'lucide-react';
import type { UserActivityMetrics } from '../../types';
import { AnalyticsService } from '../../data/analytics';

interface UserActivityReportProps {
  metrics: UserActivityMetrics[];
}

export function UserActivityReport({ metrics }: UserActivityReportProps) {
  const totalUsers = metrics.reduce((sum, m) => sum + m.total_users, 0);
  const totalActiveUsers = metrics.reduce((sum, m) => sum + m.active_users, 0);
  const overallActivityRate = totalUsers > 0 ? (totalActiveUsers / totalUsers) * 100 : 0;

  // Prepare data for charts
  const userDistributionData = metrics.map(m => ({
    role: m.role.charAt(0).toUpperCase() + m.role.slice(1),
    total: m.total_users,
    active: m.active_users,
    new: m.new_users_this_month
  }));

  const sessionDurationData = metrics.map(m => ({
    role: m.role.charAt(0).toUpperCase() + m.role.slice(1),
    duration: m.avg_session_duration
  }));

  const COLORS = ['#16a34a', '#0ea5e9', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{AnalyticsService.formatNumber(totalUsers)}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{AnalyticsService.formatNumber(totalActiveUsers)}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <Progress value={overallActivityRate} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {AnalyticsService.formatPercentage(overallActivityRate)} activity rate
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New This Month</p>
                <p className="text-2xl font-bold">
                  {AnalyticsService.formatNumber(metrics.reduce((sum, m) => sum + m.new_users_this_month, 0))}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Session</p>
                <p className="text-2xl font-bold">
                  {Math.round(metrics.reduce((sum, m) => sum + m.avg_session_duration, 0) / metrics.length)}m
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Distribution by Role
            </CardTitle>
          </CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userDistributionData}>
                <XAxis dataKey="role" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#0ea5e9" name="Total Users" />
                <Bar dataKey="active" fill="#16a34a" name="Active Users" />
                <Bar dataKey="new" fill="#f59e0b" name="New This Month" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Average Session Duration
            </CardTitle>
          </CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionDurationData} layout="horizontal">
                <XAxis type="number" />
                <YAxis dataKey="role" type="category" />
                <Tooltip formatter={(value) => [`${value} minutes`, 'Duration']} />
                <Bar dataKey="duration" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Role-specific Activity Details */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((roleMetrics, index) => (
          <Card key={roleMetrics.role}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="capitalize">{roleMetrics.role}s</span>
                <Badge variant="outline" style={{ color: COLORS[index] }}>
                  {roleMetrics.total_users} total
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Active Rate</span>
                    <span>{AnalyticsService.formatPercentage((roleMetrics.active_users / roleMetrics.total_users) * 100)}</span>
                  </div>
                  <Progress 
                    value={(roleMetrics.active_users / roleMetrics.total_users) * 100} 
                    className="h-2 mt-1"
                  />
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Top Actions</p>
                  <div className="space-y-2">
                    {roleMetrics.top_actions.slice(0, 3).map((action, actionIndex) => (
                      <div key={action.action} className="flex justify-between text-xs">
                        <span className="truncate">{action.action}</span>
                        <span className="font-medium">{AnalyticsService.formatNumber(action.count)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Avg Session</span>
                    <span>{roleMetrics.avg_session_duration}m</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>New This Month</span>
                    <span>{roleMetrics.new_users_this_month}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}