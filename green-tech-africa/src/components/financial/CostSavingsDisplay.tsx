import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Droplets, 
  Leaf, 
  TrendingUp, 
  Calculator,
  DollarSign,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ROICalculation {
  initial_cost: number;
  annual_savings: number;
  lifespan_years: number;
  maintenance_cost_per_year: number;
  total_savings: number;
  roi_percentage: number;
  payback_period_years: number;
  is_viable: boolean;
}

interface EcoFeature {
  id: number;
  name: string;
  category: string;
  description: string;
  base_cost: number;
  sustainability_points: number;
  estimated_annual_savings: number;
}

const ECO_FEATURES_MOCK: EcoFeature[] = [
  {
    id: 1,
    name: 'Solar Panel System (5kW)',
    category: 'energy',
    description: 'Complete solar panel installation with inverter and battery backup',
    base_cost: 25000,
    sustainability_points: 85,
    estimated_annual_savings: 3600,
  },
  {
    id: 2,
    name: 'Rainwater Harvesting System',
    category: 'water',
    description: 'Complete rainwater collection and filtration system',
    base_cost: 8000,
    sustainability_points: 60,
    estimated_annual_savings: 1200,
  },
  {
    id: 3,
    name: 'LED Lighting Package',
    category: 'energy',
    description: 'Energy-efficient LED lighting throughout the property',
    base_cost: 3000,
    sustainability_points: 40,
    estimated_annual_savings: 800,
  },
  {
    id: 4,
    name: 'Smart Thermostat System',
    category: 'energy',
    description: 'Intelligent climate control system',
    base_cost: 1500,
    sustainability_points: 30,
    estimated_annual_savings: 600,
  },
  {
    id: 5,
    name: 'Greywater Recycling System',
    category: 'water',
    description: 'System to reuse water from sinks and showers',
    base_cost: 5000,
    sustainability_points: 50,
    estimated_annual_savings: 900,
  },
];

export const CostSavingsDisplay: React.FC = () => {
  const [selectedFeatures, setSelectedFeatures] = useState<number[]>([]);
  const [customInitialCost, setCustomInitialCost] = useState<string>('');
  const [customAnnualSavings, setCustomAnnualSavings] = useState<string>('');
  const [customLifespan, setCustomLifespan] = useState<string>('20');
  const [customMaintenance, setCustomMaintenance] = useState<string>('');
  const [roiResult, setRoiResult] = useState<ROICalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const toggleFeature = (featureId: number) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const calculateSelectedFeatures = () => {
    const selected = ECO_FEATURES_MOCK.filter(f => selectedFeatures.includes(f.id));
    const totalCost = selected.reduce((sum, f) => sum + f.base_cost, 0);
    const totalSavings = selected.reduce((sum, f) => sum + f.estimated_annual_savings, 0);
    
    setCustomInitialCost(totalCost.toString());
    setCustomAnnualSavings(totalSavings.toString());
  };

  const handleCalculateROI = async () => {
    if (!customInitialCost || !customAnnualSavings || !customLifespan) return;

    setIsCalculating(true);
    try {
      const result = await api.post<ROICalculation>('/api/v1/finances/roi-calculations/calculate/', {
        initial_cost: parseFloat(customInitialCost),
        annual_savings: parseFloat(customAnnualSavings),
        lifestime_years: parseInt(customLifespan),
        maintenance_cost_per_year: parseFloat(customMaintenance) || 0,
      });
      setRoiResult(result);
    } catch (error) {
      console.error('Error calculating ROI:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'energy': return <Zap className="h-4 w-4" />;
      case 'water': return <Droplets className="h-4 w-4" />;
      default: return <Leaf className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'energy': return 'bg-yellow-100 text-yellow-800';
      case 'water': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Eco Features Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5" />
            Select Eco-Friendly Features
          </CardTitle>
          <CardDescription>
            Choose the sustainable features you're considering for your property
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ECO_FEATURES_MOCK.map((feature) => (
              <div
                key={feature.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedFeatures.includes(feature.id)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleFeature(feature.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(feature.category)}
                    <h4 className="font-semibold">{feature.name}</h4>
                  </div>
                  {selectedFeatures.includes(feature.id) && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                <div className="flex items-center justify-between">
                  <Badge className={getCategoryColor(feature.category)}>
                    {feature.category}
                  </Badge>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(feature.base_cost)}</div>
                    <div className="text-sm text-green-600">
                      Saves {formatCurrency(feature.estimated_annual_savings)}/year
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {selectedFeatures.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Selected Features Total:</span>
                <Button onClick={calculateSelectedFeatures} variant="outline" size="sm">
                  Use Selected Features
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ROI Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              ROI Calculator
            </CardTitle>
            <CardDescription>
              Calculate the return on investment for your eco-friendly upgrades
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="initial-cost">Initial Cost (GHS)</Label>
                <Input
                  id="initial-cost"
                  type="number"
                  placeholder="25,000"
                  value={customInitialCost}
                  onChange={(e) => setCustomInitialCost(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="annual-savings">Annual Savings (GHS)</Label>
                <Input
                  id="annual-savings"
                  type="number"
                  placeholder="3,600"
                  value={customAnnualSavings}
                  onChange={(e) => setCustomAnnualSavings(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lifespan">Lifespan (years)</Label>
                <Input
                  id="lifespan"
                  type="number"
                  placeholder="20"
                  value={customLifespan}
                  onChange={(e) => setCustomLifespan(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenance">Annual Maintenance (GHS)</Label>
                <Input
                  id="maintenance"
                  type="number"
                  placeholder="500"
                  value={customMaintenance}
                  onChange={(e) => setCustomMaintenance(e.target.value)}
                />
              </div>
            </div>

            <Button 
              onClick={handleCalculateROI} 
              className="w-full" 
              disabled={isCalculating || !customInitialCost || !customAnnualSavings}
            >
              {isCalculating ? 'Calculating...' : 'Calculate ROI'}
            </Button>
          </CardContent>
        </Card>

        {/* ROI Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Investment Analysis
            </CardTitle>
            <CardDescription>
              Your return on investment breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            {roiResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold text-green-600">
                      {roiResult.roi_percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">ROI</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold text-blue-600">
                      {roiResult.payback_period_years?.toFixed(1) || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Years to Break Even</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Initial Investment:</span>
                    <span className="font-semibold">{formatCurrency(roiResult.initial_cost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Annual Savings:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(roiResult.annual_savings)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Annual Maintenance:</span>
                    <span className="font-semibold text-orange-600">{formatCurrency(roiResult.maintenance_cost_per_year)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-900 font-semibold">Total Savings ({roiResult.lifespan_years} years):</span>
                    <span className="font-bold text-lg text-green-600">{formatCurrency(roiResult.total_savings)}</span>
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${roiResult.is_viable ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {roiResult.is_viable ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`font-semibold ${roiResult.is_viable ? 'text-green-800' : 'text-red-800'}`}>
                      {roiResult.is_viable ? 'Financially Viable' : 'Consider Alternatives'}
                    </span>
                  </div>
                  <p className={`text-sm ${roiResult.is_viable ? 'text-green-700' : 'text-red-700'}`}>
                    {roiResult.is_viable 
                      ? 'This investment will generate positive returns over its lifespan.'
                      : 'This investment may not recover its initial cost. Consider other options or longer-term benefits.'
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Enter your investment details and click "Calculate ROI" to see your analysis.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};