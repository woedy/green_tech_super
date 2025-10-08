import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import { Activity, Clock, AlertTriangle, CheckCircle, Database, HardDrive, Zap, Users } from 'lucide-react';
import type { SystemHealthMetrics } from '../../types';
import { AnalyticsService } from '../../data/analytics';

interface SystemHealthMonitorProps {
  metrics: SystemHealthMetrics;
}

export function SystemHealthMonitor({ metrics }: SystemHealthMonitorProps) {
  // Generate mock performance data for charts
  const performanceData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    response_time: Math.max(50, metrics.api_response_time + (Math.random() - 0.5) * 100),
    error_rate: Math.max(0, metrics.error_rate + (Math.random() - 0.5) * 1),
    active_sessions: Math.max(100, metrics.active_sessions + (Math.random() - 0.5) * 500)
  }));

  const getHealthStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return { status: 'good', color: 'text-green-600', bg: 'bg-green-100' };
    if (value <= thresholds.warning) return { status: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { status: 'critical', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const responseTimeStatus = getHealthStatus(metrics.api_response_time, { good: 200, warning: 500 });
  const errorRateStatus = getHealthStatus(metrics.error_rate, { good: 1, warning: 5 });
  const uptimeStatus = getHealthStatus(100 - metrics.uptime_percentage, { good: 0.5, warning: 2 });

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">API Response Time</p>
                <p className="text-2xl font-bold">{metrics.api_response_time}ms</p>
              </div>
              <Clock className={`h-8 w-8 ${responseTimeStatus.color}`} />
            </div>
            <div className="mt-2">
              <Badge variant="outline" className={`${responseTimeStatus.bg} ${responseTimeStatus.color}`}>
                {responseTimeStatus.status.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold">{AnalyticsService.formatPercentage(metrics.uptime_percentage)}</p>
              </div>
              <CheckCircle className={`h-8 w-8 ${uptimeStatus.color}`} />
            </div>
            <div className="mt-2">
              <Progress value={metrics.uptime_percentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Error Rate</p>
                <p className="text-2xl font-bold">{AnalyticsService.formatPercentage(metrics.error_rate)}</p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${errorRateStatus.color}`} />
            </div>
            <div className="mt-2">
              <Badge variant="outline" className={`${errorRateStatus.bg} ${errorRateStatus.color}`}>
                {errorRateStatus.status.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold">{AnalyticsService.formatNumber(metrics.active_sessions)}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex items-center text-xs text-blue-600 mt-2">
              <Activity className="h-3 w-3 mr-1" />
              Real-time connections
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              API Response Time (24h)
            </CardTitle>
          </CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <XAxis dataKey="hour" />
                <YAxis tickFormatter={(value) => `${value}ms`} />
                <Tooltip formatter={(value) => [`${Math.round(Number(value))}ms`, 'Response Time']} />
                <Line 
                  type="monotone" 
                  dataKey="response_time" 
                  stroke="#0ea5e9" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Active Sessions (24h)
            </CardTitle>
          </CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip formatter={(value) => [AnalyticsService.formatNumber(Number(value)), 'Active Sessions']} />
                <Area 
                  type="monotone" 
                  dataKey="active_sessions" 
                  stroke="#16a34a" 
                  fill="#16a34a" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* System Resources */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Query Time</span>
                  <span>{metrics.database_performance.query_time}ms</span>
                </div>
                <Progress 
                  value={(metrics.database_performance.query_time / 100) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.database_performance.query_time < 50 ? 'Excellent' : 
                   metrics.database_performance.query_time < 100 ? 'Good' : 'Needs Attention'}
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Connection Pool</span>
                  <span>{metrics.database_performance.connection_pool}%</span>
                </div>
                <Progress 
                  value={metrics.database_performance.connection_pool} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.database_performance.connection_pool < 70 ? 'Healthy' : 
                   metrics.database_performance.connection_pool < 90 ? 'Monitor' : 'Critical'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold">{AnalyticsService.formatPercentage(metrics.storage_usage.percentage)}</p>
                <p className="text-sm text-muted-foreground">
                  {metrics.storage_usage.used_gb}GB of {metrics.storage_usage.total_gb}GB used
                </p>
              </div>

              <Progress value={metrics.storage_usage.percentage} className="h-3" />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Used</p>
                  <p className="font-medium">{metrics.storage_usage.used_gb}GB</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Available</p>
                  <p className="font-medium">{metrics.storage_usage.total_gb - metrics.storage_usage.used_gb}GB</p>
                </div>
              </div>

              <Badge 
                variant="outline" 
                className={
                  metrics.storage_usage.percentage < 70 ? 'bg-green-100 text-green-600' :
                  metrics.storage_usage.percentage < 90 ? 'bg-yellow-100 text-yellow-600' :
                  'bg-red-100 text-red-600'
                }
              >
                {metrics.storage_usage.percentage < 70 ? 'Healthy' :
                 metrics.storage_usage.percentage < 90 ? 'Monitor' : 'Critical'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">API Server</span>
                <Badge className="bg-green-100 text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <Badge className="bg-green-100 text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Cache (Redis)</span>
                <Badge className="bg-green-100 text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Background Jobs</span>
                <Badge className="bg-green-100 text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Running
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Email Service</span>
                <Badge className="bg-green-100 text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Operational
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">SMS Gateway</span>
                <Badge className="bg-yellow-100 text-yellow-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Limited
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Rate Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Error Rate Trend (24h)
          </CardTitle>
        </CardHeader>
        <CardContent style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performanceData}>
              <XAxis dataKey="hour" />
              <YAxis tickFormatter={(value) => `${value}%`} />
              <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Error Rate']} />
              <Area 
                type="monotone" 
                dataKey="error_rate" 
                stroke="#ef4444" 
                fill="#ef4444" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}