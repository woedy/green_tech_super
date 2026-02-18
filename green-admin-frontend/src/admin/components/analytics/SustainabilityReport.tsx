import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Leaf, Zap, Droplets, Home, Award, Target } from 'lucide-react';
import type { AdminDashboardMetrics } from '../../types/api';

interface SustainabilityReportProps {
  metrics: AdminDashboardMetrics;
}

export function SustainabilityReport({ metrics }: SustainabilityReportProps) {
  const formatNumber = (value: number) => new Intl.NumberFormat('en-GH').format(value);

  return (
    <div className="space-y-6">
      {/* Sustainability Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Green Score</p>
                <p className="text-2xl font-bold">{metrics.sustainability.green_score}/10</p>
              </div>
              <Leaf className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <Progress value={metrics.sustainability.green_score * 10} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.sustainability.green_score >= 8 ? 'Excellent' : 
                 metrics.sustainability.green_score >= 6 ? 'Good' : 
                 metrics.sustainability.green_score >= 4 ? 'Fair' : 'Needs Improvement'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Eco Plans</p>
                <p className="text-2xl font-bold">{formatNumber(metrics.sustainability.eco_plans)}</p>
              </div>
              <Award className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              High sustainability rating
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Solar Properties</p>
                <p className="text-2xl font-bold">{formatNumber(metrics.sustainability.solar_properties)}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              With solar installations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Water Harvesting</p>
                <p className="text-2xl font-bold">{formatNumber(metrics.sustainability.water_harvesting_properties)}</p>
              </div>
              <Droplets className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Properties with systems
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sustainability Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5" />
              Sustainability Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Solar Energy</span>
                  <span>{formatNumber(metrics.sustainability.solar_properties)} properties</span>
                </div>
                <Progress 
                  value={(metrics.sustainability.solar_properties / metrics.properties.total) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {((metrics.sustainability.solar_properties / metrics.properties.total) * 100).toFixed(1)}% of total properties
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Water Harvesting</span>
                  <span>{formatNumber(metrics.sustainability.water_harvesting_properties)} properties</span>
                </div>
                <Progress 
                  value={(metrics.sustainability.water_harvesting_properties / metrics.properties.total) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {((metrics.sustainability.water_harvesting_properties / metrics.properties.total) * 100).toFixed(1)}% of total properties
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Eco Plans</span>
                  <span>{formatNumber(metrics.sustainability.eco_plans)} plans</span>
                </div>
                <Progress 
                  value={(metrics.sustainability.eco_plans / metrics.plans.total) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {((metrics.sustainability.eco_plans / metrics.plans.total) * 100).toFixed(1)}% of total plans
                </p>
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
                  <span>Green Score Target</span>
                  <span>8.0/10</span>
                </div>
                <Progress value={(metrics.sustainability.green_score / 8) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Current: {metrics.sustainability.green_score}/10 ({((metrics.sustainability.green_score / 8) * 100).toFixed(1)}% of target)
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Solar Adoption Target</span>
                  <span>50%</span>
                </div>
                <Progress 
                  value={((metrics.sustainability.solar_properties / metrics.properties.total) / 0.5) * 100} 
                  className="h-2" 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Current: {((metrics.sustainability.solar_properties / metrics.properties.total) * 100).toFixed(1)}% ({(((metrics.sustainability.solar_properties / metrics.properties.total) / 0.5) * 100).toFixed(1)}% of target)
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Water Conservation Target</span>
                  <span>40%</span>
                </div>
                <Progress 
                  value={((metrics.sustainability.water_harvesting_properties / metrics.properties.total) / 0.4) * 100} 
                  className="h-2" 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Current: {((metrics.sustainability.water_harvesting_properties / metrics.properties.total) * 100).toFixed(1)}% ({(((metrics.sustainability.water_harvesting_properties / metrics.properties.total) / 0.4) * 100).toFixed(1)}% of target)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Environmental Impact Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Environmental Impact Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                <h4 className="font-medium">Solar Energy</h4>
              </div>
              <p className="text-2xl font-bold">{formatNumber(metrics.sustainability.solar_properties)}</p>
              <p className="text-sm text-muted-foreground">Properties with solar panels</p>
              <Badge className="mt-2 bg-yellow-100 text-yellow-600">
                Renewable Energy
              </Badge>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium">Water Conservation</h4>
              </div>
              <p className="text-2xl font-bold">{formatNumber(metrics.sustainability.water_harvesting_properties)}</p>
              <p className="text-sm text-muted-foreground">Properties with harvesting</p>
              <Badge className="mt-2 bg-blue-100 text-blue-600">
                Water Efficiency
              </Badge>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Home className="h-5 w-5 text-green-600" />
                <h4 className="font-medium">Eco Plans</h4>
              </div>
              <p className="text-2xl font-bold">{formatNumber(metrics.sustainability.eco_plans)}</p>
              <p className="text-sm text-muted-foreground">High sustainability plans</p>
              <Badge className="mt-2 bg-green-100 text-green-600">
                Green Building
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}