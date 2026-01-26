import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, MapPin, Users, Building, DollarSign, Leaf, Loader2 } from 'lucide-react';
import { adminApi } from '../api';

const Kpi = ({ title, value, trend, icon: Icon, loading = false }: { 
  title: string; 
  value: string; 
  trend?: { direction: 'up' | 'down'; percentage: string };
  icon?: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}) => (
  <Card>
    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
      <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
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
          {trend && (
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {trend.direction === 'up' ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={trend.direction === 'up' ? 'text-green-500' : 'text-red-500'}>
                {trend.percentage}
              </span>
              <span className="ml-1">from last period</span>
            </div>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard-metrics'],
    queryFn: () => adminApi.getDashboardMetrics(),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform-wide analytics and Ghana market insights</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Failed to load dashboard data</p>
              <p className="text-sm text-muted-foreground mt-1">
                {error instanceof Error ? error.message : 'Unknown error occurred'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatTrend = (trend: number) => ({
    direction: trend >= 0 ? 'up' as const : 'down' as const,
    percentage: `${trend >= 0 ? '+' : ''}${trend}%`
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform-wide analytics and Ghana market insights</p>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi 
          title="New Leads (Period)" 
          value={metrics?.leads.total.toString() || '0'} 
          trend={metrics ? formatTrend(metrics.leads.trend) : undefined}
          icon={Users}
          loading={isLoading}
        />
        <Kpi 
          title="Quotes Sent (Period)" 
          value={metrics?.quotes.total.toString() || '0'} 
          trend={metrics ? formatTrend(metrics.quotes.trend) : undefined}
          icon={DollarSign}
          loading={isLoading}
        />
        <Kpi 
          title="Projects Active" 
          value={metrics?.projects.active.toString() || '0'} 
          trend={metrics ? formatTrend(metrics.projects.trend) : undefined}
          icon={Building}
          loading={isLoading}
        />
        <Kpi 
          title="Properties Live" 
          value={metrics?.properties.active.toString() || '0'} 
          icon={MapPin}
          loading={isLoading}
        />
      </div>

      {/* Ghana Market Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Ghana Regional Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading regional data...</span>
              </div>
            ) : metrics?.regional_performance.length ? (
              metrics.regional_performance
                .sort((a, b) => b.total_activity - a.total_activity)
                .slice(0, 4)
                .map((region) => (
                  <div key={region.name} className="flex items-center justify-between">
                    <span className="text-sm">{region.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{region.properties} properties</Badge>
                      <Badge variant="outline" className="text-xs">
                        {region.leads} leads, {region.projects} projects
                      </Badge>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-sm text-muted-foreground">No regional data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5" />
              Sustainability Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading sustainability data...</span>
              </div>
            ) : metrics ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Green Score</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {metrics.sustainability.green_score}/10
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Solar Properties</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{metrics.sustainability.solar_properties}</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Water Harvesting</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{metrics.sustainability.water_harvesting_properties}</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Eco Plans</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{metrics.sustainability.eco_plans}</Badge>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No sustainability data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion Rates */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Rates</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading conversion data...</span>
            </div>
          ) : metrics ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-blue-600">
                  {metrics.conversion_rates.lead_to_quote}%
                </div>
                <p className="text-sm text-muted-foreground">Lead to Quote</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-green-600">
                  {metrics.conversion_rates.quote_acceptance}%
                </div>
                <p className="text-sm text-muted-foreground">Quote Acceptance</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-purple-600">
                  {metrics.conversion_rates.quote_to_project}%
                </div>
                <p className="text-sm text-muted-foreground">Quote to Project</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No conversion data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

