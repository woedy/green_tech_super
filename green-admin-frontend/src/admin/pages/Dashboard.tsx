import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, MapPin, Users, Building, DollarSign } from 'lucide-react';

const Kpi = ({ title, value, trend, icon: Icon }: { 
  title: string; 
  value: string; 
  trend?: { direction: 'up' | 'down'; percentage: string };
  icon?: React.ComponentType<{ className?: string }>;
}) => (
  <Card>
    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
      <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
    </CardHeader>
    <CardContent>
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
          <span className="ml-1">from last week</span>
        </div>
      )}
    </CardContent>
  </Card>
);

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform-wide analytics and Ghana market insights</p>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi 
          title="New Leads (7d)" 
          value="32" 
          trend={{ direction: 'up', percentage: '+12%' }}
          icon={Users}
        />
        <Kpi 
          title="Quotes Sent (7d)" 
          value="14" 
          trend={{ direction: 'up', percentage: '+8%' }}
          icon={DollarSign}
        />
        <Kpi 
          title="Projects Active" 
          value="9" 
          trend={{ direction: 'down', percentage: '-2%' }}
          icon={Building}
        />
        <Kpi 
          title="Listings Live" 
          value="128" 
          trend={{ direction: 'up', percentage: '+15%' }}
          icon={MapPin}
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
            <div className="flex items-center justify-between">
              <span className="text-sm">Greater Accra</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">45 properties</Badge>
                <span className="text-sm text-green-600">+18%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Ashanti (Kumasi)</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">32 properties</Badge>
                <span className="text-sm text-green-600">+12%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Northern (Tamale)</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">18 properties</Badge>
                <span className="text-sm text-green-600">+25%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Central (Cape Coast)</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">12 properties</Badge>
                <span className="text-sm text-green-600">+8%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sustainability Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Avg. Green Score</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">7.8/10</Badge>
                <span className="text-sm text-green-600">+0.3</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Solar Properties</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">68%</Badge>
                <span className="text-sm text-green-600">+5%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Water Harvesting</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">42%</Badge>
                <span className="text-sm text-green-600">+8%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Eco Materials</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">55%</Badge>
                <span className="text-sm text-green-600">+12%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p><strong>Plan "Eco Bungalow"</strong> updated by Jane Smith</p>
                <p className="text-muted-foreground">Added solar panel specifications for Accra region • 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p><strong>New property inquiry</strong> assigned to Agent #24</p>
                <p className="text-muted-foreground">3-bedroom eco villa in Kumasi • 4 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <p><strong>Regional pricing update:</strong> Greater Accra multiplier changed</p>
                <p className="text-muted-foreground">1.12 → 1.14 due to material cost increases • 6 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p><strong>New agent registration:</strong> Kwame Asante verified</p>
                <p className="text-muted-foreground">Specializing in sustainable construction in Tamale • 1 day ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

