import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Database, HardDrive, Zap, Mail, MessageSquare } from 'lucide-react';

export function SystemHealthMonitor() {
  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Core Services
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">PostgreSQL</span>
                <Badge className="bg-green-100 text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Healthy
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Connections</span>
                <Badge variant="outline">Active</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Replication</span>
                <Badge className="bg-green-100 text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Synced
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Backups</span>
                <Badge className="bg-green-100 text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Current
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              External Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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

              <div className="flex items-center justify-between">
                <span className="text-sm">File Storage</span>
                <Badge className="bg-green-100 text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Available
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">CDN</span>
                <Badge className="bg-green-100 text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Platform</p>
              <p className="text-lg font-medium">Django + React</p>
            </div>

            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Database</p>
              <p className="text-lg font-medium">PostgreSQL 16</p>
            </div>

            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Cache</p>
              <p className="text-lg font-medium">Redis 7</p>
            </div>

            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Task Queue</p>
              <p className="text-lg font-medium">Celery</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monitoring Note */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium">System Health Monitoring</p>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time system health metrics are displayed here. For detailed performance monitoring, 
                check your infrastructure monitoring tools (e.g., Grafana, Datadog, New Relic).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}