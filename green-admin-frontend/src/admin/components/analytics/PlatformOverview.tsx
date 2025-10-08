import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Users, MapPin, Leaf, Target, Activity } from 'lucide-react';
import type { PlatformMetrics } from '../../types';
import { AnalyticsService } from '../../data/analytics';

interface PlatformOverviewProps {
  metrics: PlatformMetrics;
}

export function PlatformOverview({ metrics }: PlatformOverviewProps) {
  const formatCurrency = (amount: number) => AnalyticsService.formatCurrency(amount);
  const formatPercentage = (value: number) => AnalyticsService.formatPercentage(value);

  const metricCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics.total_revenue),
      icon: DollarSign,
      trend: metrics.monthly_growth,
      trendLabel: 'from last month',
      color: 'text-green-600'
    },
    {
      title: 'Active Properties',
      value: AnalyticsService.formatNumber(metrics.active_properties),
      icon: MapPin,
      trend: 8.2,
      trendLabel: 'from last month',
      color: 'text-blue-600'
    },
    {
      title: 'Total Users',
      value: AnalyticsService.formatNumber(metrics.total_users),
      icon: Users,
      trend: 12.5,
      trendLabel: 'from last month',
      color: 'text-purple-600'
    },
    {
      title: 'Avg Green Score',
      value: `${metrics.avg_sustainability_score}/10`,
      icon: Leaf,
      trend: 0.3,
      trendLabel: 'from last month',
      color: 'text-green-600'
    },
    {
      title: 'Conversion Rate',
      value: formatPercentage(metrics.conversion_rate),
      icon: Target,
      trend: 2.1,
      trendLabel: 'from last month',
      color: 'text-orange-600'
    },
    {
      title: 'Platform Health',
      value: '99.8%',
      icon: Activity,
      trend: 0.1,
      trendLabel: 'uptime',
      color: 'text-emerald-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metricCards.map((metric) => {
        const Icon = metric.icon;
        const isPositiveTrend = metric.trend > 0;
        
        return (
          <Card key={metric.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.title}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                </div>
                <Icon className={`h-8 w-8 ${metric.color}`} />
              </div>
              <div className="flex items-center text-xs mt-2">
                {isPositiveTrend ? (
                  <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                )}
                <span className={isPositiveTrend ? 'text-green-600' : 'text-red-600'}>
                  {isPositiveTrend ? '+' : ''}{metric.trend}% {metric.trendLabel}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}