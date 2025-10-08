import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar } from 'recharts';
import { Leaf, TrendingUp, Zap, Droplets, Recycle, Home, Award, Target } from 'lucide-react';
import type { SustainabilityMetrics } from '../../types';
import { AnalyticsService } from '../../data/analytics';

interface SustainabilityReportProps {
  metrics: SustainabilityMetrics;
}

export function SustainabilityReport({ metrics }: SustainabilityReportProps) {
  const COLORS = ['#16a34a', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444'];
  
  // Prepare data for eco feature adoption chart
  const adoptionData = metrics.eco_feature_adoption.map((feature, index) => ({
    ...feature,
    color: COLORS[index % COLORS.length]
  }));

  // Calculate category totals for the trends
  const latestTrend = metrics.sustainability_trends[metrics.sustainability_trends.length - 1];
  const categoryTotals = {
    energy: latestTrend?.solar || 0,
    water: latestTrend?.water || 0,
    materials: latestTrend?.materials || 0,
    smart_tech: latestTrend?.smart_tech || 0
  };

  const categoryData = [
    { category: 'Energy', value: categoryTotals.energy, icon: Zap, color: '#f59e0b' },
    { category: 'Water', value: categoryTotals.water, icon: Droplets, color: '#0ea5e9' },
    { category: 'Materials', value: categoryTotals.materials, icon: Recycle, color: '#16a34a' },
    { category: 'Smart Tech', value: categoryTotals.smart_tech, icon: Home, color: '#8b5cf6' }
  ];

  return (
    <div className="space-y-6">
      {/* Sustainability Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Green Score</p>
                <p className="text-2xl font-bold">{metrics.avg_green_score}/10</p>
              </div>
              <Leaf className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <Progress value={metrics.avg_green_score * 10} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.avg_green_score >= 8 ? 'Excellent' : 
                 metrics.avg_green_score >= 6 ? 'Good' : 
                 metrics.avg_green_score >= 4 ? 'Fair' : 'Needs Improvement'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Carbon Savings</p>
                <p className="text-2xl font-bold">{AnalyticsService.formatNumber(metrics.carbon_savings_estimate)}</p>
              </div>
              <Award className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="flex items-center text-xs text-emerald-600 mt-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              tonnes CO₂ saved annually
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Eco Feature</p>
                <p className="text-lg font-bold">
                  {adoptionData.reduce((max, feature) => 
                    feature.adoption_rate > max.adoption_rate ? feature : max
                  ).feature}
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex items-center text-xs text-blue-600 mt-2">
              <span>
                {AnalyticsService.formatPercentage(
                  adoptionData.reduce((max, feature) => 
                    feature.adoption_rate > max.adoption_rate ? feature : max
                  ).adoption_rate
                )} adoption rate
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Installations</p>
                <p className="text-2xl font-bold">
                  {AnalyticsService.formatNumber(
                    metrics.eco_feature_adoption.reduce((sum, feature) => sum + feature.total_installations, 0)
                  )}
                </p>
              </div>
              <Home className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex items-center text-xs text-purple-600 mt-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              across all properties
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sustainability Trends and Category Performance */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sustainability Adoption Trends
            </CardTitle>
          </CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.sustainability_trends}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="solar" stroke="#f59e0b" strokeWidth={2} name="Solar Panels" />
                <Line type="monotone" dataKey="water" stroke="#0ea5e9" strokeWidth={2} name="Water Systems" />
                <Line type="monotone" dataKey="materials" stroke="#16a34a" strokeWidth={2} name="Eco Materials" />
                <Line type="monotone" dataKey="smart_tech" stroke="#8b5cf6" strokeWidth={2} name="Smart Tech" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5" />
              Eco Feature Adoption Rates
            </CardTitle>
          </CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adoptionData} layout="horizontal">
                <XAxis type="number" tickFormatter={(value) => `${value}%`} />
                <YAxis dataKey="feature" type="category" width={100} />
                <Tooltip formatter={(value) => [`${value}%`, 'Adoption Rate']} />
                <Bar dataKey="adoption_rate" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Performance Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {categoryData.map((category) => {
          const Icon = category.icon;
          return (
            <Card key={category.category}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{category.category}</h4>
                  <Icon className="h-5 w-5" style={{ color: category.color }} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Installations</span>
                    <span className="font-medium">{category.value}</span>
                  </div>
                  <Progress 
                    value={(category.value / Math.max(...categoryData.map(c => c.value))) * 100} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Growth</span>
                    <span>+{Math.round(Math.random() * 20 + 5)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Eco Feature Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Eco Feature Performance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.eco_feature_adoption.map((feature, index) => (
              <div key={feature.feature} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <div>
                    <p className="font-medium">{feature.feature}</p>
                    <p className="text-sm text-muted-foreground">
                      {feature.total_installations} installations
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{AnalyticsService.formatPercentage(feature.adoption_rate)}</p>
                  <Badge 
                    variant="outline" 
                    className={
                      feature.adoption_rate >= 50 ? 'bg-green-100 text-green-600' :
                      feature.adoption_rate >= 25 ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }
                  >
                    {feature.adoption_rate >= 50 ? 'High Adoption' :
                     feature.adoption_rate >= 25 ? 'Moderate' : 'Low Adoption'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sustainability Impact Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Environmental Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Carbon Footprint Reduction</span>
                <span className="font-medium">{AnalyticsService.formatNumber(metrics.carbon_savings_estimate)} tonnes CO₂/year</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Energy Savings Estimate</span>
                <span className="font-medium">{Math.round(metrics.carbon_savings_estimate * 2.5)} MWh/year</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Water Conservation</span>
                <span className="font-medium">{Math.round(metrics.carbon_savings_estimate * 150)} liters/day</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Waste Reduction</span>
                <span className="font-medium">{Math.round(metrics.carbon_savings_estimate * 0.8)} tonnes/year</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Sustainability Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Average Green Score Target</span>
                  <span>8.0/10</span>
                </div>
                <Progress value={(metrics.avg_green_score / 8) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Current: {metrics.avg_green_score}/10 ({AnalyticsService.formatPercentage((metrics.avg_green_score / 8) * 100)} of target)
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Solar Panel Adoption Target</span>
                  <span>80%</span>
                </div>
                <Progress value={(categoryTotals.energy / 80) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Current: {categoryTotals.energy} installations ({AnalyticsService.formatPercentage((categoryTotals.energy / 80) * 100)} of target)
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Water Conservation Target</span>
                  <span>70%</span>
                </div>
                <Progress value={(categoryTotals.water / 70) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Current: {categoryTotals.water} installations ({AnalyticsService.formatPercentage((categoryTotals.water / 70) * 100)} of target)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}