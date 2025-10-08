import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Zap, 
  Droplets, 
  Hammer, 
  Recycle, 
  Smartphone,
  Leaf,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { ConstructionFormData } from '@/types/construction';
import { ECO_FEATURES, GHANA_REGIONS } from '@/mocks/construction';
import { EcoFeatureSelector } from '../EcoFeatureSelector';
import { CostCalculator } from '../CostCalculator';

interface EcoFeaturesStepProps {
  data: ConstructionFormData;
  onUpdate: (updates: Partial<ConstructionFormData>) => void;
}

const CATEGORY_ICONS = {
  energy: Zap,
  water: Droplets,
  materials: Hammer,
  waste: Recycle,
  smart: Smartphone
};

const CATEGORY_LABELS = {
  energy: 'Energy Systems',
  water: 'Water Management',
  materials: 'Sustainable Materials',
  waste: 'Waste & Air Quality',
  smart: 'Smart Technology'
};

const CATEGORY_DESCRIPTIONS = {
  energy: 'Solar panels, battery storage, and energy-efficient systems',
  water: 'Rainwater harvesting, greywater recycling, and efficient fixtures',
  materials: 'Eco-friendly cement, recycled steel, and local timber',
  waste: 'Waste separation, green roofs, and air quality monitoring',
  smart: 'IoT sensors, smart thermostats, and automated systems'
};

export const EcoFeaturesStep = ({ data, onUpdate }: EcoFeaturesStepProps) => {
  const [activeCategory, setActiveCategory] = useState<string>('energy');
  const [showCostCalculator, setShowCostCalculator] = useState(false);
  
  const selectedRegion = GHANA_REGIONS.find(r => r.id === data.region);
  
  const getFeaturesByCategory = (category: string) => {
    return ECO_FEATURES.filter(f => f.category === category && f.availableInGhana);
  };
  
  const isFeatureSelected = (featureId: string) => {
    return data.selectedFeatures.includes(featureId);
  };
  
  const toggleFeature = (featureId: string) => {
    const newFeatures = isFeatureSelected(featureId)
      ? data.selectedFeatures.filter(id => id !== featureId)
      : [...data.selectedFeatures, featureId];
    
    onUpdate({ selectedFeatures: newFeatures });
  };
  
  const getFeatureCost = (featureId: string) => {
    const feature = ECO_FEATURES.find(f => f.id === featureId);
    if (!feature || !selectedRegion) return 0;
    
    const regionalMultiplier = feature.regionalMultiplier[selectedRegion.id] || 1.0;
    return Math.round(feature.baseCost * regionalMultiplier);
  };
  
  const getCategoryStats = (category: string) => {
    const categoryFeatures = getFeaturesByCategory(category);
    const selectedInCategory = categoryFeatures.filter(f => isFeatureSelected(f.id));
    
    const totalCost = selectedInCategory.reduce((sum, feature) => {
      return sum + getFeatureCost(feature.id);
    }, 0);
    
    const totalPoints = selectedInCategory.reduce((sum, feature) => {
      return sum + feature.sustainabilityPoints;
    }, 0);
    
    const totalSavings = selectedInCategory.reduce((sum, feature) => {
      return sum + (feature.estimatedSavings?.annual || 0);
    }, 0);
    
    return {
      selectedCount: selectedInCategory.length,
      totalCount: categoryFeatures.length,
      totalCost,
      totalPoints,
      totalSavings
    };
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {data.sustainabilityScore}
                </div>
                <div className="text-sm text-muted-foreground">Green Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  GHS {data.totalCost.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Cost</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  GHS {data.estimatedSavings.annual.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Annual Savings</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Selection */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Category Tabs */}
        <div className="lg:w-1/3">
          <Card>
            <CardHeader>
              <CardTitle>Feature Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {Object.entries(CATEGORY_LABELS).map(([category, label]) => {
                  const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
                  const stats = getCategoryStats(category);
                  
                  return (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`w-full p-4 text-left transition-colors ${
                        activeCategory === category
                          ? 'bg-primary/10 border-r-2 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <div className="flex-1">
                          <div className="font-medium">{label}</div>
                          <div className="text-sm text-muted-foreground">
                            {CATEGORY_DESCRIPTIONS[category as keyof typeof CATEGORY_DESCRIPTIONS]}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {stats.selectedCount}/{stats.totalCount} selected
                            </Badge>
                            {stats.totalCost > 0 && (
                              <Badge variant="outline" className="text-xs">
                                GHS {stats.totalCost.toLocaleString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Selection */}
        <div className="lg:w-2/3">
          <EcoFeatureSelector
            category={activeCategory}
            selectedFeatures={data.selectedFeatures}
            region={data.region}
            onToggleFeature={toggleFeature}
          />
        </div>
      </div>

      {/* Cost Calculator Toggle */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => setShowCostCalculator(!showCostCalculator)}
        >
          {showCostCalculator ? 'Hide' : 'Show'} Detailed Cost Breakdown
        </Button>
      </div>

      {/* Cost Calculator */}
      {showCostCalculator && (
        <CostCalculator
          selectedFeatures={data.selectedFeatures}
          region={data.region}
        />
      )}

      {/* Selection Summary */}
      {data.selectedFeatures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Features Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.selectedFeatures.map(featureId => {
                const feature = ECO_FEATURES.find(f => f.id === featureId);
                if (!feature) return null;
                
                return (
                  <div
                    key={featureId}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-sm">{feature.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {feature.sustainabilityPoints} points
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">
                        GHS {getFeatureCost(featureId).toLocaleString()}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFeature(featureId)}
                        className="h-6 px-2 text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};