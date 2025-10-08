import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Edit, 
  Plus, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Info,
  Calculator
} from 'lucide-react';
import { db } from '../data/db';
import type { Region, EcoFeature } from '../types';

export default function RegionalPricingManagement() {
  const [regions, setRegions] = useState(db.listRegions());
  const [ecoFeatures, setEcoFeatures] = useState(db.listEcoFeatures());
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewRegionDialogOpen, setIsNewRegionDialogOpen] = useState(false);

  const handleEditRegion = (region: Region) => {
    setSelectedRegion(region);
    setIsEditDialogOpen(true);
  };

  const handleAddRegion = () => {
    setSelectedRegion({
      code: '',
      name: '',
      currency: 'GHS',
      multiplier: 1.0,
      major_cities: [],
      is_active: true
    });
    setIsNewRegionDialogOpen(true);
  };

  const handleSaveRegion = (region: Region) => {
    if (selectedRegion?.code && selectedRegion.code !== region.code) {
      // Update existing region
      db.upsertRegion(region);
      setRegions(prev => prev.map(r => r.code === selectedRegion.code ? region : r));
    } else {
      // Create new region
      db.upsertRegion(region);
      setRegions(prev => [...prev, region]);
    }
    
    setIsEditDialogOpen(false);
    setIsNewRegionDialogOpen(false);
    setSelectedRegion(null);
  };

  const getMultiplierTrend = (multiplier: number) => {
    if (multiplier > 1.1) {
      return { icon: TrendingUp, color: 'text-red-600', label: 'Higher Cost' };
    } else if (multiplier < 0.9) {
      return { icon: TrendingDown, color: 'text-green-600', label: 'Lower Cost' };
    } else {
      return { icon: Minus, color: 'text-gray-600', label: 'Standard Cost' };
    }
  };

  const calculateFeatureCost = (baseCost: number, regionMultiplier: number, featureMultiplier?: number) => {
    const finalMultiplier = regionMultiplier * (featureMultiplier || 1.0);
    return baseCost * finalMultiplier;
  };

  return (
    <div className="space-y-6">
      {/* Regional Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Ghana Regions ({regions.length})
            </div>
            <Button onClick={handleAddRegion}>
              <Plus className="h-4 w-4 mr-2" />
              Add Region
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Region</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Major Cities</TableHead>
                <TableHead>Cost Multiplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regions.map((region) => {
                const trend = getMultiplierTrend(region.multiplier);
                const TrendIcon = trend.icon;
                
                return (
                  <TableRow key={region.code}>
                    <TableCell>
                      <div className="font-medium">{region.name}</div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline">{region.code}</Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {region.major_cities?.join(', ') || 'No cities listed'}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TrendIcon className={`h-4 w-4 ${trend.color}`} />
                        <span className="font-mono">{region.multiplier.toFixed(2)}x</span>
                        <Badge variant="secondary" className="text-xs">
                          {trend.label}
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={region.is_active ? 'default' : 'secondary'}>
                        {region.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRegion(region)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pricing Analysis */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Pricing Overview</TabsTrigger>
          <TabsTrigger value="features">Feature Pricing</TabsTrigger>
          <TabsTrigger value="calculator">Cost Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regional Cost Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {regions.map((region) => {
                  const baseCost = 100000; // Example base cost
                  const adjustedCost = baseCost * region.multiplier;
                  const difference = adjustedCost - baseCost;
                  const percentDiff = ((region.multiplier - 1) * 100);
                  
                  return (
                    <Card key={region.code}>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{region.code}</Badge>
                            <Badge variant={region.is_active ? 'default' : 'secondary'}>
                              {region.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          
                          <h4 className="font-medium">{region.name}</h4>
                          
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span>Multiplier:</span>
                              <span className="font-mono">{region.multiplier.toFixed(2)}x</span>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span>Example Cost:</span>
                              <span className="font-mono">{adjustedCost.toLocaleString()} GHS</span>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span>Difference:</span>
                              <span className={`font-mono ${difference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {difference >= 0 ? '+' : ''}{difference.toLocaleString()} GHS
                                ({percentDiff >= 0 ? '+' : ''}{percentDiff.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eco Feature Regional Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature</TableHead>
                      <TableHead>Base Cost</TableHead>
                      {regions.map(region => (
                        <TableHead key={region.code} className="text-center">
                          {region.name}
                          <br />
                          <Badge variant="outline" className="text-xs">
                            {region.code}
                          </Badge>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ecoFeatures.slice(0, 10).map((feature) => (
                      <TableRow key={feature.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{feature.name}</div>
                            <Badge variant="outline" className="text-xs">
                              {feature.category}
                            </Badge>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="font-mono">
                            {feature.base_cost.toLocaleString()} GHS
                          </div>
                        </TableCell>
                        
                        {regions.map(region => {
                          const isAvailable = feature.regional_availability?.[region.code] !== false;
                          const featureMultiplier = feature.regional_pricing?.[region.code] || 1.0;
                          const finalCost = calculateFeatureCost(
                            feature.base_cost, 
                            region.multiplier, 
                            featureMultiplier
                          );
                          
                          return (
                            <TableCell key={region.code} className="text-center">
                              {isAvailable ? (
                                <div className="space-y-1">
                                  <div className="font-mono text-sm">
                                    {finalCost.toLocaleString()} GHS
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {(region.multiplier * featureMultiplier).toFixed(2)}x
                                  </div>
                                </div>
                              ) : (
                                <Badge variant="destructive" className="text-xs">
                                  N/A
                                </Badge>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculator" className="space-y-4">
          <PricingCalculator regions={regions} ecoFeatures={ecoFeatures} />
        </TabsContent>
      </Tabs>

      {/* Edit Region Dialog */}
      <Dialog open={isEditDialogOpen || isNewRegionDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsEditDialogOpen(false);
          setIsNewRegionDialogOpen(false);
          setSelectedRegion(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isNewRegionDialogOpen ? 'Add New Region' : 'Edit Region'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRegion && (
            <RegionForm
              region={selectedRegion}
              onSave={handleSaveRegion}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setIsNewRegionDialogOpen(false);
                setSelectedRegion(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface RegionFormProps {
  region: Region;
  onSave: (region: Region) => void;
  onCancel: () => void;
}

function RegionForm({ region, onSave, onCancel }: RegionFormProps) {
  const [formData, setFormData] = useState<Region>({
    ...region,
    major_cities: region.major_cities || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateCities = (citiesString: string) => {
    const cities = citiesString.split(',').map(city => city.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, major_cities: cities }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="code">Region Code *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
            placeholder="e.g., GH-GA"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="name">Region Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Greater Accra"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            value={formData.currency}
            onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
            placeholder="GHS"
          />
        </div>
        
        <div>
          <Label htmlFor="multiplier">Cost Multiplier *</Label>
          <Input
            id="multiplier"
            type="number"
            min="0.1"
            max="5"
            step="0.01"
            value={formData.multiplier}
            onChange={(e) => setFormData(prev => ({ ...prev, multiplier: parseFloat(e.target.value) || 1.0 }))}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="cities">Major Cities (comma-separated)</Label>
        <Input
          id="cities"
          value={formData.major_cities?.join(', ') || ''}
          onChange={(e) => updateCities(e.target.value)}
          placeholder="e.g., Accra, Tema, Kasoa"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
        />
        <Label>Active Region</Label>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Cost multiplier affects all pricing in this region. Values above 1.0 increase costs, below 1.0 decrease costs.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {region.code ? 'Update Region' : 'Create Region'}
        </Button>
      </div>
    </form>
  );
}

interface PricingCalculatorProps {
  regions: Region[];
  ecoFeatures: EcoFeature[];
}

function PricingCalculator({ regions, ecoFeatures }: PricingCalculatorProps) {
  const [baseCost, setBaseCost] = useState(100000);
  const [selectedFeatures, setSelectedFeatures] = useState<Set<number>>(new Set());

  const calculateTotalCost = (region: Region) => {
    let total = baseCost * region.multiplier;
    
    selectedFeatures.forEach(featureId => {
      const feature = ecoFeatures.find(f => f.id === featureId);
      if (feature && feature.regional_availability?.[region.code] !== false) {
        const featureMultiplier = feature.regional_pricing?.[region.code] || 1.0;
        total += feature.base_cost * region.multiplier * featureMultiplier;
      }
    });
    
    return total;
  };

  const toggleFeature = (featureId: number) => {
    const newSelected = new Set(selectedFeatures);
    if (newSelected.has(featureId)) {
      newSelected.delete(featureId);
    } else {
      newSelected.add(featureId);
    }
    setSelectedFeatures(newSelected);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Regional Cost Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="base-cost">Base Construction Cost (GHS)</Label>
              <Input
                id="base-cost"
                type="number"
                min="0"
                step="1000"
                value={baseCost}
                onChange={(e) => setBaseCost(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label>Select Eco Features</Label>
              <div className="max-h-64 overflow-y-auto border rounded-md p-2 space-y-2">
                {ecoFeatures.map(feature => (
                  <div key={feature.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedFeatures.has(feature.id)}
                      onChange={() => toggleFeature(feature.id)}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{feature.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {feature.base_cost.toLocaleString()} GHS
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            <h4 className="font-medium">Regional Cost Breakdown</h4>
            
            <div className="space-y-3">
              {regions.map(region => {
                const totalCost = calculateTotalCost(region);
                const baseCostAdjusted = baseCost * region.multiplier;
                const featuresCost = totalCost - baseCostAdjusted;
                
                return (
                  <div key={region.code} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{region.code}</Badge>
                        <span className="font-medium">{region.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold">
                          {totalCost.toLocaleString()} GHS
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Base cost ({region.multiplier}x):</span>
                        <span className="font-mono">{baseCostAdjusted.toLocaleString()} GHS</span>
                      </div>
                      {featuresCost > 0 && (
                        <div className="flex justify-between">
                          <span>Eco features:</span>
                          <span className="font-mono">{featuresCost.toLocaleString()} GHS</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}