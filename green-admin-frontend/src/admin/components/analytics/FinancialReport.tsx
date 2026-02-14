import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, MapPin, Home, Target, TrendingUp } from 'lucide-react';
import type { AdminDashboardMetrics } from '../../types/api';

interface FinancialReportProps {
  metrics: AdminDashboardMetrics;
}

export function FinancialReport({ metrics }: FinancialReportProps) {
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

  // Prepare regional data for chart
  const regionalData = Object.entries(metrics.properties.by_region).map(([region, count]) => ({
    region,
    properties: count
  }));

  // Prepare plan category data
  const planCategoryData = Object.entries(metrics.plans.by_category).map(([category, count]) => ({
    category,
    count
  }));

  const COLORS = ['#16a34a', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Quote Value</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.quotes.total_value)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex items-center text-xs text-green-600 mt-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              {metrics.quotes.trend >= 0 ? '+' : ''}{metrics.quotes.trend}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Accepted Quotes</p>
                <p className="text-2xl font-bold">{formatNumber(metrics.quotes.accepted)}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex items-center text-xs text-blue-600 mt-2">
              {metrics.conversion_rates.quote_acceptance}% acceptance rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Properties</p>
                <p className="text-2xl font-bold">{formatNumber(metrics.properties.total)}</p>
              </div>
              <Home className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex items-center text-xs text-purple-600 mt-2">
              {formatNumber(metrics.properties.active)} active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Plans</p>
                <p className="text-2xl font-bold">{formatNumber(metrics.plans.total)}</p>
              </div>
              <MapPin className="h-8 w-8 text-orange-600" />
            </div>
            <div className="flex items-center text-xs text-orange-600 mt-2">
              {formatNumber(metrics.plans.active)} published
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regional and Category Performance */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Properties by Ghana Region
            </CardTitle>
          </CardHeader>
          <CardContent style={{ height: 300 }}>
            {regionalData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={regionalData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="properties"
                    label={({ region, properties }) => `${region}: ${properties}`}
                  >
                    {regionalData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No regional data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Plans by Category
            </CardTitle>
          </CardHeader>
          <CardContent style={{ height: 300 }}>
            {planCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={planCategoryData}>
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0ea5e9" name="Plans" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No plan category data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {metrics.conversion_rates.lead_to_quote}%
              </div>
              <p className="text-sm text-muted-foreground mt-1">Lead to Quote</p>
              <p className="text-xs text-muted-foreground mt-2">
                {formatNumber(metrics.quotes.total)} quotes from {formatNumber(metrics.leads.total)} leads
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {metrics.conversion_rates.quote_acceptance}%
              </div>
              <p className="text-sm text-muted-foreground mt-1">Quote Acceptance</p>
              <p className="text-xs text-muted-foreground mt-2">
                {formatNumber(metrics.quotes.accepted)} accepted quotes
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {metrics.conversion_rates.quote_to_project}%
              </div>
              <p className="text-sm text-muted-foreground mt-1">Quote to Project</p>
              <p className="text-xs text-muted-foreground mt-2">
                {formatNumber(metrics.projects.total)} projects from quotes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional Performance Details */}
      {metrics.regional_performance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ghana Regional Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.regional_performance.map((region, index) => (
                <div key={region.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <div>
                      <p className="font-medium">{region.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatNumber(region.total_activity)} total activities
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex gap-2">
                      <Badge variant="outline">{region.properties} properties</Badge>
                      <Badge variant="outline">{region.leads} leads</Badge>
                      <Badge variant="outline">{region.projects} projects</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}