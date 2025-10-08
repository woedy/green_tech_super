import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, DollarSign } from 'lucide-react';
import { ConstructionFormData } from '@/types/construction';
import { GHANA_REGIONS, BUDGET_RANGES, TIMELINE_OPTIONS } from '@/mocks/construction';

interface LocationBudgetStepProps {
  data: ConstructionFormData;
  onUpdate: (updates: Partial<ConstructionFormData>) => void;
}

export const LocationBudgetStep = ({ data, onUpdate }: LocationBudgetStepProps) => {
  const selectedRegion = GHANA_REGIONS.find(r => r.id === data.region);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Location Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">Project Location *</Label>
              <Input
                id="location"
                value={data.location}
                onChange={(e) => onUpdate({ location: e.target.value })}
                placeholder="Enter city or specific address"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="region">Ghana Region *</Label>
              <Select
                value={data.region}
                onValueChange={(value) => onUpdate({ region: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your region" />
                </SelectTrigger>
                <SelectContent>
                  {GHANA_REGIONS.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{region.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {region.costMultiplier}x
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedRegion && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <h4 className="font-medium text-sm">{selectedRegion.name}</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  {selectedRegion.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedRegion.majorCities.map((city) => (
                    <Badge key={city} variant="secondary" className="text-xs">
                      {city}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Budget & Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="budgetRange">Budget Range *</Label>
              <Select
                value={data.budgetRange}
                onValueChange={(value) => onUpdate({ budgetRange: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your budget range" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timeline">Project Timeline *</Label>
              <Select
                value={data.timeline}
                onValueChange={(value) => onUpdate({ timeline: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  {TIMELINE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedRegion && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="font-medium text-sm text-blue-900">Regional Cost Impact</h4>
                <p className="text-xs text-blue-700">
                  Construction costs in {selectedRegion.name} are typically{' '}
                  {selectedRegion.costMultiplier > 1 
                    ? `${Math.round((selectedRegion.costMultiplier - 1) * 100)}% higher`
                    : selectedRegion.costMultiplier < 1
                    ? `${Math.round((1 - selectedRegion.costMultiplier) * 100)}% lower`
                    : 'at the baseline'
                  } than the national average.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
        <h3 className="font-medium text-amber-900 mb-2">💡 Planning Tips</h3>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• Consider transportation costs for materials to remote locations</li>
          <li>• Eco-features may have higher upfront costs but provide long-term savings</li>
          <li>• Regional pricing reflects local material availability and labor costs</li>
          <li>• Flexible timelines often result in better pricing from contractors</li>
        </ul>
      </div>
    </div>
  );
};