import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell, ComposedChart } from 'recharts';
import { DollarSign, TrendingUp, MapPin, Home, Target, Calendar } from 'lucide-react';
import type { FinancialMetrics } from '../../types';
import { AnalyticsService } from '../../data/analytics';

interface FinancialReportProps {
  metrics: FinancialMetrics;
}

export function FinancialReport({ metrics }: FinancialReportProps) {
  const formatCurrency = (amount: number) => AnalyticsService.formatCurrency(amount, metrics.currency);
  const formatPercentage = (value: number) => AnalyticsService.formatPercentage(value);

  // Generate revenue time series data
  const revenueTimeSeries = AnalyticsService.getRevenueTimeSeries(6);
  
  // Calculate growth metrics
  const monthlyGrowthRate = revenueTimeSeries.length > 1 
    ? ((revenueTimeSeries[revenueTimeSeries.length - 1].revenue - revenueTimeSeries[revenueTimeSeries.length - 2].revenue) / revenueTimeSeries[revenueTimeSeries.length - 2].revenue) * 100
    : 0;

  const COLORS = ['#16a34a', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.total_revenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex items-center text-xs text-green-600 mt-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{formatPercentage(monthlyGrowthRate)} from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.monthly_revenue)}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex items-center text-xs text-blue-600 mt-2">
              <Target className="h-3 w-3 mr-1" />
              {formatPercentage((metrics.monthly_revenue / (metrics.total_revenue * 0.12)) * 100)} of annual target
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Property Value</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.average_property_value)}</p>
              </div>
              <Home className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex items-center text-xs text-purple-600 mt-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              +5.2% from last quarter
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Currency</p>
                <p className="text-2xl font-bold">{metrics.currency}</p>
              </div>
              <MapPin className="h-8 w-8 text-orange-600" />
            </div>
            <div className="flex items-center text-xs text-orange-600 mt-2">
              <span>Ghana Cedis</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends and Regional Performance */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Trends (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueTimeSeries}>
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${(value / 1000)}K`} />
                <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name === 'revenue' ? 'Actual Revenue' : 'Target Revenue']} />
                <Bar dataKey="target" fill="#e5e7eb" name="target" />
                <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={3} name="revenue" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Revenue by Ghana Region
            </CardTitle>
          </CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.revenue_by_region}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                  label={({ region, percentage }) => `${region}: ${percentage}%`}
                >
                  {metrics.revenue_by_region.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Property Type Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Revenue by Property Type
          </CardTitle>
        </CardHeader>
        <CardContent style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.revenue_by_property_type}>
              <XAxis dataKey="type" />
              <YAxis tickFormatter={(value) => `${(value / 1000)}K`} />
              <Tooltip formatter={(value, name) => {
                if (name === 'revenue') return [formatCurrency(Number(value)), 'Revenue'];
                if (name === 'count') return [value, 'Properties'];
                return [value, name];
              }} />
              <Bar dataKey="revenue" fill="#0ea5e9" name="revenue" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Regional Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ghana Regional Financial Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.revenue_by_region.map((region, index) => (
              <div key={region.region} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <div>
                    <p className="font-medium">{region.region}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPercentage(region.percentage)} of total revenue
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(region.revenue)}</p>
                  <Badge variant="outline" className="text-xs">
                    {region.region === 'Greater Accra' ? 'Highest' : 
                     region.region === 'Northern' ? 'Growth Potential' : 'Stable'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Property Type Details */}
      <Card>
        <CardHeader>
          <CardTitle>Property Type Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics.revenue_by_property_type.map((type, index) => (
              <div key={type.type} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{type.type}</h4>
                  <Badge variant="outline">{type.count} properties</Badge>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(type.revenue)}</p>
                <p className="text-sm text-muted-foreground">
                  Avg: {formatCurrency(type.count > 0 ? type.revenue / type.count : 0)}
                </p>
                <div className="mt-2">
                  <div 
                    className="h-2 rounded-full"
                    style={{ 
                      backgroundColor: COLORS[index % COLORS.length],
                      width: `${(type.revenue / Math.max(...metrics.revenue_by_property_type.map(t => t.revenue))) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}