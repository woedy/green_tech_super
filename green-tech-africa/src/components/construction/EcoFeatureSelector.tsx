import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Zap, 
  Droplets, 
  Hammer, 
  Recycle, 
  Smartphone,
  Plus,
  Check,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { ECO_FEATURES, GHANA_REGIONS } from '@/mocks/construction';

interface EcoFeatureSelectorProps {
  category: string;
  selectedFeatures: string[];
  region: string;
  onToggleFeature: (featureId: string) => void;
}

const CATEGORY_ICONS = {
  energy: Zap,
  water: Droplets,
  materials: Hammer,
  waste: Recycle,
  smart: Smartphone
};

export const EcoFeatureSelector = ({ 
  category, 
  selectedFeatures, 
  region, 
  onToggleFeature 
}: EcoFeatureSelectorProps) => {
  const categoryFeatures = ECO_FEATURES.filter(
    f => f.category === category && f.availableInGhana
  );
  
  const selectedRegion = GHANA_REGIONS.find(r => r.id === region);
  
  const getFeatureCost = (featureId: string) => {
    const feature = ECO_FEATURES.find(f => f.id === featureId);
    if (!feature || !selectedRegion) return 0;
    
    const regionalMultiplier = feature.regionalMultiplier[region] || 1.0;
    return Math.round(feature.baseCost * regionalMultiplier);
  };
  
  const isFeatureSelected = (featureId: string) => {
    return selectedFeatures.includes(featureId);
  };

  const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || Zap;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {category.charAt(0).toUpperCase() + category.slice(1)} Features
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categoryFeatures.map((feature) => {
            const isSelected = isFeatureSelected(feature.id);
            const cost = getFeatureCost(feature.id);
            
            return (
              <div
                key={feature.id}
                className={`p-4 border rounded-lg transition-all cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onToggleFeature(feature.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onChange={() => onToggleFeature(feature.id)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{feature.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                      
                      <div className="text-right ml-4">
                        <div className="font-bold text-lg">
                          GHS {cost.toLocaleString()}
                        </div>
                        {feature.estimatedSavings && (
                          <div className="text-xs text-green-600">
                            Saves GHS {feature.estimatedSavings.annual}/year
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {feature.sustainabilityPoints} points
                      </Badge>
                      
                      {feature.estimatedSavings && (
                        <Badge variant="outline" className="text-xs">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          GHS {feature.estimatedSavings.monthly}/month
                        </Badge>
                      )}
                      
                      {region && feature.regionalMultiplier[region] !== 1.0 && (
                        <Badge 
                          variant={feature.regionalMultiplier[region] > 1.0 ? "destructive" : "default"}
                          className="text-xs"
                        >
                          {feature.regionalMultiplier[region] > 1.0 ? '+' : ''}
                          {Math.round((feature.regionalMultiplier[region] - 1) * 100)}% regional
                        </Badge>
                      )}
                    </div>
                    
                    {feature.estimatedSavings && (
                      <div className="text-xs text-muted-foreground">
                        💡 {feature.estimatedSavings.description}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {categoryFeatures.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Icon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No features available in this category for Ghana</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};