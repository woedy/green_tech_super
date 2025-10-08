import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, FileText, AlertCircle } from 'lucide-react';
import { ConstructionFormData } from '@/types/construction';
inte
rface CustomizationStepProps {
  data: ConstructionFormData;
  onUpdate: (updates: Partial<ConstructionFormData>) => void;
}

export const CustomizationStep = ({ data, onUpdate }: CustomizationStepProps) => {
  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">Customization & Special Requirements</h3>
            <p className="text-sm text-blue-700">
              This step is optional but helps us understand your specific needs and preferences. 
              Add any special requirements, architectural preferences, or unique features you'd like to include.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customizations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Additional Customizations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customizations">
                Describe any specific customizations or modifications you'd like
              </Label>
              <Textarea
                id="customizations"
                value={data.customizations}
                onChange={(e) => onUpdate({ customizations: e.target.value })}
                placeholder="e.g., Extra bedroom, covered parking, outdoor kitchen, specific room layouts..."
                rows={6}
                className="resize-none"
              />
            </div>
            
            <div className="bg-muted/50 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-2">💡 Customization Ideas</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Additional rooms or spaces</li>
                <li>• Specific architectural styles</li>
                <li>• Outdoor features (patios, gardens)</li>
                <li>• Storage solutions</li>
                <li>• Accessibility features</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Special Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Special Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="specialRequirements">
                Any special requirements or constraints we should know about?
              </Label>
              <Textarea
                id="specialRequirements"
                value={data.specialRequirements}
                onChange={(e) => onUpdate({ specialRequirements: e.target.value })}
                placeholder="e.g., Site constraints, local building codes, accessibility needs, budget priorities..."
                rows={6}
                className="resize-none"
              />
            </div>
            
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
              <h4 className="font-medium text-amber-900 text-sm mb-2">⚠️ Important Considerations</h4>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• Site access and terrain challenges</li>
                <li>• Local building regulations</li>
                <li>• Utility connections availability</li>
                <li>• Seasonal construction constraints</li>
                <li>• Budget flexibility and priorities</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Selection Summary */}
      {(data.selectedFeatures.length > 0 || data.totalCost > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Your Project Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {data.sustainabilityScore}
                </div>
                <div className="text-sm text-green-700">Green Score</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {data.selectedFeatures.length}
                </div>
                <div className="text-sm text-blue-700">Eco Features</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  GHS {data.estimatedSavings.annual.toLocaleString()}
                </div>
                <div className="text-sm text-purple-700">Annual Savings</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps Info */}
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h3 className="font-medium text-green-900 mb-2">🎯 What Happens Next?</h3>
        <p className="text-sm text-green-700 mb-3">
          After you submit this request, our system will:
        </p>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• Generate a detailed specification document with your selections</li>
          <li>• Calculate accurate costs based on your region ({data.region || 'selected region'})</li>
          <li>• Match you with qualified eco-friendly builders in your area</li>
          <li>• Send you quotes from multiple contractors within 48 hours</li>
        </ul>
      </div>
    </div>
  );
};