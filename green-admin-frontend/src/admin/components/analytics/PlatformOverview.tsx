import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Users, MapPin, Leaf, Target, Building } from 'lucide-react';
import type { AdminDashboardMetrics } from '../../types/api';

interface PlatformOverviewProps {
  metrics: AdminDashboardMetrics;
}

export function PlatformOverview({ metrics }: PlatformOverviewProps) {
  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatNumber = (value: number) => new Intl.NumberFormat('en-GH').format(value);

  const metricCards = [
    {
      title: 'Total Quote Value',
      value: formatCurrency(metrics.quotes.total_value),
      icon: DollarSign,
      trend: metrics.quotes.trend,
      trendLabel: 'from last period',
      color: 'text-green-600'
    },
    {
      title: 'Active Properties',
      value: formatNumber(metrics.properties.active),
      icon: MapPin,
      trend: null,
      trendLabel: 'live properties',
      color: 'text-blue-600'
    },
    {
      title: 'Total Users',
      value: formatNumber(metrics.overview.total_users),
      icon: Users,
      trend: null,
      trendLabel: `${metrics.overview.new_users} new`,
      color: 'text-purple-600'
    },
    {
      title: 'Green Score',
      value: `${metrics.sustainability.green_score}/10`,
      icon: Leaf,
      trend: null,
      trendLabel: `${metrics.sustainability.eco_plans} eco plans`,
      color: 'text-green-600'
    },
    {
      title: 'Lead to Quote',
      value: `${metrics.conversion_rates.lead_to_quote}%`,
      icon: Target,
      trend: null,
      trendLabel: 'conversion rate',
      color: 'text-orange-600'
    },
    {
      title: 'Active Projects',
      value: formatNumber(metrics.projects.active),
      icon: Building,
      trend: metrics.projects.trend,
      trendLabel: 'from last period',
      color: 'text-emerald-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metricCards.map((metric) => {
        const Icon = metric.icon;
        const hasTrend = metric.trend !== null && metric.trend !== undefined;
        const isPositiveTrend = hasTrend && metric.trend > 0;
        
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
                {hasTrend ? (
                  <>
                    {isPositiveTrend ? (
                      <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                    )}
                    <span className={isPositiveTrend ? 'text-green-600' : 'text-red-600'}>
                      {isPositiveTrend ? '+' : ''}{metric.trend}% {metric.trendLabel}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">{metric.trendLabel}</span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}