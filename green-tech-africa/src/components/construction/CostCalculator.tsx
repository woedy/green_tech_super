import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  MapPin,
  Leaf,
  Clock
} from 'lucide-react';
import { ECO_FEATURES, GHANA_REGIONS } from '@/mocks/construction';
import { useConstructionCalculator } from '@/hooks/useConstructionCalculator';

interface CostCalculatorProps {
  selectedFeatures: string[];
  region: string;
}

export const CostCalculator = ({ selectedFeatures, region }: CostCalculatorProps) => {
  const { getCostBreakdown, getSustainabilityMetrics } = useConstructionCalculator();
  
  const costBreakdown = getCostBreakdown(selectedFeatures, region);
  const sustainabilityMetrics = getSustainabilityMetrics(selectedFeatures);
  const selectedRegion = GHANA_REGIONS.find(r => r.id === region);
  
  const getFeaturesByCategory = () => {
    const categories = {
      energy: selectedFeatures.filter(id => {
        const feature = ECO_FEATURES.find(f => f.id === id);
        return feature?.category === 'energy';
      }),
      water: selectedFeatures.filter(id => {
        const feature = ECO_FEATURES.find(f => f.id === id);
        return feature?.category === 'water';
      }),
      materials: selectedFeatures.filter(id => {
        const feature = ECO_FEATURES.find(f => f.id === id);
        return feature?.category === 'materials';
      }),
      waste: selectedFeatures.filter(id => {
        const feature = ECO_FEATURES.find(f => f.id === id);
        return feature?.category === 'waste';
      }),
      smart: selectedFeatures.filter(id => {
        const feature = ECO_FEATURES.find(f => f.id === id);
        return feature?.category === 'smart';
      })
    };
    return categories;
  };

  const categorizedFeatures = getFeaturesByCategory();
  
  const getCategoryCost = (categoryFeatures: string[]) => {
    return categoryFeatures.reduce((total, featureId) => {
      const feature = ECO_FEATURES.find(f => f.id === featureId);
      if (!feature) return total;
      
      const regionalMultiplier = feature.regionalMultiplier[region] || 1.0;
      return total + (feature.baseCost * regionalMultiplier);
    }, 0);
  };

  const categoryLabels = {
    energy: 'Energy Systems',
    water: 'Water Management', 
    materials: 'Sustainable Materials',
    waste: 'Waste & Air Quality',
    smart: 'Smart Technology'
  };

  const categoryColors = {
    energy: 'bg-yellow-100 text-yellow-800',
    water: 'bg-blue-100 text-blue-800',
    materials: 'bg-green-100 text-green-800',
    waste: 'bg-purple-100 text-purple-800',
    smart: 'bg-orange-100 text-orange-800'
  };

  // Calculate payback period
  const totalSavings = sustainabilityMetrics.estimatedSavings.annual;
  const paybackYears = totalSavings > 0 ? Math.round(costBreakdown.ecoFeatures / totalSavings * 10) / 10 : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Detailed Cost Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Cost Breakdown */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Base Construction Cost</span>
              <span className="font-medium">GHS {costBreakdown.baseConstruction.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Eco Features Total</span>
              <span className="font-medium">GHS {costBreakdown.ecoFeatures.toLocaleString()}</span>
            </div>
            
            {selectedRegion && selectedRegion.costMultiplier !== 1 && (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">Regional Adjustment ({selectedRegion.name})</span>
                </div>
                <span className={`font-medium ${costBreakdown.regionalAdjustment > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {costBreakdown.regionalAdjustment > 0 ? '+' : ''}GHS {costBreakdown.regionalAdjustment.toLocaleString()}
                </span>
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Estimated Cost</span>
              <span className="text-primary">GHS {costBreakdown.total.toLocaleString()}</span>
            </div>
          </div>

          {/* Category Breakdown */}
          {selectedFeatures.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Cost by Category</h4>
              <div className="space-y-3">
                {Object.entries(categorizedFeatures).map(([category, features]) => {
                  if (features.length === 0) return null;
                  
                  const categoryCost = getCategoryCost(features);
                  const categoryScore = sustainabilityMetrics.categoryScores[category as keyof typeof sustainabilityMetrics.categoryScores];
                  
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge className={categoryColors[category as keyof typeof categoryColors]}>
                            {categoryLabels[category as keyof typeof categoryLabels]}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            ({features.length} feature{features.length !== 1 ? 's' : ''})
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">GHS {Math.round(categoryCost).toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">{categoryScore} points</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sustainability & Savings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5" />
              Sustainability Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {sustainabilityMetrics.totalScore}
              </div>
              <div className="text-sm text-muted-foreground">Total Green Score</div>
              <Progress value={sustainabilityMetrics.totalScore} className="mt-2" />
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h5 className="font-medium text-sm">Category Scores</h5>
              {Object.entries(sustainabilityMetrics.categoryScores).map(([category, score]) => {
                if (score === 0) return null;
                
                return (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{category}</span>
                    <Badge variant="outline">{score} points</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Cost Savings Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Monthly Savings</span>
                <span className="font-medium text-green-600">
                  GHS {sustainabilityMetrics.estimatedSavings.monthly.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm">Annual Savings</span>
                <span className="font-medium text-green-600">
                  GHS {sustainabilityMetrics.estimatedSavings.annual.toLocaleString()}
                </span>
              </div>
              
              {paybackYears > 0 && (
                <div className="flex justify-between">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Payback Period</span>
                  </div>
                  <span className="font-medium">
                    {paybackYears} year{paybackYears !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
            
            {sustainabilityMetrics.estimatedSavings.breakdown.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Savings Breakdown</h5>
                  {sustainabilityMetrics.estimatedSavings.breakdown.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{item.feature}</span>
                      <span className="text-green-600">GHS {item.annual}/year</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Regional Information */}
      {selectedRegion && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Regional Cost Factors - {selectedRegion.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {selectedRegion.description}
              </p>
              
              <div className="flex items-center gap-2">
                <span className="text-sm">Cost Multiplier:</span>
                <Badge variant={selectedRegion.costMultiplier > 1 ? "destructive" : "default"}>
                  {selectedRegion.costMultiplier}x
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ({selectedRegion.costMultiplier > 1 
                    ? `${Math.round((selectedRegion.costMultiplier - 1) * 100)}% higher` 
                    : selectedRegion.costMultiplier < 1
                    ? `${Math.round((1 - selectedRegion.costMultiplier) * 100)}% lower`
                    : 'baseline'} than national average)
                </span>
              </div>
              
              <div>
                <span className="text-sm">Major Cities: </span>
                <span className="text-sm text-muted-foreground">
                  {selectedRegion.majorCities.join(', ')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};