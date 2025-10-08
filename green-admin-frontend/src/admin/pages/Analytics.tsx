import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  Leaf, 
  Activity, 
  Download,
  RefreshCw,
  Calendar
} from 'lucide-react';

// Import analytics components
import { PlatformOverview } from '../components/analytics/PlatformOverview';
import { UserActivityReport } from '../components/analytics/UserActivityReport';
import { FinancialReport } from '../components/analytics/FinancialReport';
import { SustainabilityReport } from '../components/analytics/SustainabilityReport';
import { SystemHealthMonitor } from '../components/analytics/SystemHealthMonitor';

// Import analytics service
import { AnalyticsService } from '../data/analytics';

export default function Analytics() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Load analytics data
  const platformMetrics = AnalyticsService.getPlatformMetrics();
  const userActivityMetrics = AnalyticsService.getUserActivityMetrics();
  const financialMetrics = AnalyticsService.getFinancialMetrics();
  const sustainabilityMetrics = AnalyticsService.getSustainabilityMetrics();
  const systemHealthMetrics = AnalyticsService.getSystemHealthMetrics();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  const handleExportReport = () => {
    // In a real implementation, this would generate and download a comprehensive report
    const reportData = {
      platform: platformMetrics,
      users: userActivityMetrics,
      financial: financialMetrics,
      sustainability: sustainabilityMetrics,
      system: systemHealthMetrics,
      generated_at: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `green-tech-africa-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics & Reporting</h1>
          <p className="text-muted-foreground">
            Comprehensive platform analytics and Ghana market performance insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Updated {lastUpdated.toLocaleTimeString()}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportReport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Platform Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Platform Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PlatformOverview metrics={platformMetrics} />
        </CardContent>
      </Card>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Activity
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="sustainability" className="flex items-center gap-2">
            <Leaf className="h-4 w-4" />
            Sustainability
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            System Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Activity & Engagement Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UserActivityReport metrics={userActivityMetrics} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Performance & Ghana Market Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FinancialReport metrics={financialMetrics} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sustainability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5" />
                Sustainability Metrics & Environmental Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SustainabilityReport metrics={sustainabilityMetrics} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Health & Performance Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SystemHealthMonitor metrics={systemHealthMetrics} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
