import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Leaf, 
  FileText,
  Download,
  CheckCircle
} from 'lucide-react';
import { ConstructionFormData } from '@/types/construction';
import { ECO_FEATURES, GHANA_REGIONS } from '@/mocks/construction';

interface ReviewStepProps {
  data: ConstructionFormData;
  onUpdate: (updates: Partial<ConstructionFormData>) => void;
}

export const ReviewStep = ({ data }: ReviewStepProps) => {
  const selectedRegion = GHANA_REGIONS.find(r => r.id === data.region);
  
  const getSelectedFeatures = () => {
    return data.selectedFeatures.map(featureId => {
      const feature = ECO_FEATURES.find(f => f.id === featureId);
      if (!feature) return null;
      
      const regionalMultiplier = feature.regionalMultiplier[data.region] || 1.0;
      const cost = Math.round(feature.baseCost * regionalMultiplier);
      
      return {
        ...feature,
        adjustedCost: cost
      };
    }).filter(Boolean);
  };

  const selectedFeatures = getSelectedFeatures();
  
  const getFeaturesByCategory = () => {
    const categories = {
      energy: selectedFeatures.filter(f => f?.category === 'energy'),
      water: selectedFeatures.filter(f => f?.category === 'water'),
      materials: selectedFeatures.filter(f => f?.category === 'materials'),
      waste: selectedFeatures.filter(f => f?.category === 'waste'),
      smart: selectedFeatures.filter(f => f?.category === 'smart')
    };
    return categories;
  };

  const categorizedFeatures = getFeaturesByCategory();

  const categoryLabels = {
    energy: 'Energy Systems',
    water: 'Water Management',
    materials: 'Sustainable Materials',
    waste: 'Waste & Air Quality',
    smart: 'Smart Technology'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold">Review Your Construction Request</h2>
        </div>
        <p className="text-muted-foreground">
          Please review all details before submitting your request
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Project Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Customer Name</div>
                  <div className="font-medium">{data.customerName}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Email</div>
                  <div className="font-medium">{data.customerEmail}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Phone</div>
                  <div className="font-medium">{data.customerPhone || 'Not provided'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Project Title</div>
                  <div className="font-medium">{data.projectTitle}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location & Budget */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location & Budget
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Location</div>
                  <div className="font-medium">{data.location}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Region</div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{selectedRegion?.name}</span>
                    <Badge variant="outline">
                      {selectedRegion?.costMultiplier}x multiplier
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Budget Range</div>
                  <div className="font-medium">{data.budgetRange}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Timeline</div>
                  <div className="font-medium">{data.timeline}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Eco Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5" />
                Selected Eco Features ({selectedFeatures.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedFeatures.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No eco features selected
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(categorizedFeatures).map(([category, features]) => {
                    if (features.length === 0) return null;
                    
                    return (
                      <div key={category}>
                        <h4 className="font-medium text-sm mb-2">
                          {categoryLabels[category as keyof typeof categoryLabels]}
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          {features.map((feature) => (
                            <div
                              key={feature?.id}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                            >
                              <div>
                                <div className="font-medium text-sm">{feature?.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {feature?.sustainabilityPoints} sustainability points
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-sm">
                                  GHS {feature?.adjustedCost.toLocaleString()}
                                </div>
                                {feature?.estimatedSavings && (
                                  <div className="text-xs text-green-600">
                                    Saves GHS {feature.estimatedSavings.annual}/year
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {category !== 'smart' && <Separator className="mt-4" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customizations */}
          {(data.customizations || data.specialRequirements) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Customizations & Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.customizations && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Additional Customizations
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-sm">
                      {data.customizations}
                    </div>
                  </div>
                )}
                {data.specialRequirements && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Special Requirements
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-sm">
                      {data.specialRequirements}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Cost Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cost Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Base Construction</span>
                  <span className="font-medium">GHS 50,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Eco Features</span>
                  <span className="font-medium">
                    GHS {(data.totalCost - 50000 * (selectedRegion?.costMultiplier || 1)).toLocaleString()}
                  </span>
                </div>
                {selectedRegion && selectedRegion.costMultiplier !== 1 && (
                  <div className="flex justify-between">
                    <span className="text-sm">Regional Adjustment</span>
                    <span className="font-medium">
                      {selectedRegion.costMultiplier > 1 ? '+' : ''}
                      {Math.round((selectedRegion.costMultiplier - 1) * 100)}%
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Estimated Cost</span>
                  <span className="text-primary">GHS {data.totalCost.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sustainability Impact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {data.sustainabilityScore}
                </div>
                <div className="text-sm text-muted-foreground">Green Score</div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Monthly Savings</span>
                  <span className="font-medium text-green-600">
                    GHS {data.estimatedSavings.monthly.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Annual Savings</span>
                  <span className="font-medium text-green-600">
                    GHS {data.estimatedSavings.annual.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium">Specification Generation</div>
                    <div className="text-muted-foreground">
                      Detailed PDF document created
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium">Builder Matching</div>
                    <div className="text-muted-foreground">
                      Connect with qualified contractors
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium">Quote Generation</div>
                    <div className="text-muted-foreground">
                      Receive quotes within 48 hours
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Final Confirmation */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-medium text-green-900">Ready to Submit</h3>
              <p className="text-sm text-green-700">
                By submitting this request, you agree to be contacted by qualified builders 
                and contractors who can provide quotes for your eco-friendly construction project.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};