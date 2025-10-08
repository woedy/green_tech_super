import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Leaf, 
  Zap, 
  Droplets, 
  Hammer, 
  Recycle, 
  Smartphone,
  Wind,
  Search,
  MapPin,
  DollarSign
} from 'lucide-react';
import { db } from '../data/db';
import type { EcoFeature, Region } from '../types';

const categoryIcons = {
  energy: Zap,
  water: Droplets,
  materials: Hammer,
  waste: Recycle,
  smart_tech: Smartphone,
  air_quality: Wind,
};

const categoryColors = {
  energy: 'bg-yellow-100 text-yellow-800',
  water: 'bg-blue-100 text-blue-800',
  materials: 'bg-green-100 text-green-800',
  waste: 'bg-purple-100 text-purple-800',
  smart_tech: 'bg-indigo-100 text-indigo-800',
  air_quality: 'bg-cyan-100 text-cyan-800',
};

export default function EcoFeatureManagement() {
  const [features, setFeatures] = useState(db.listEcoFeatures());
  const [filteredFeatures, setFilteredFeatures] = useState(features);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [selectedFeature, setSelectedFeature] = useState<EcoFeature | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const regions = db.listRegions();

  // Apply filters
  const applyFilters = () => {
    let filtered = features;

    if (searchTerm) {
      filtered = filtered.filter(feature => 
        feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feature.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(feature => feature.category === categoryFilter);
    }

    if (availabilityFilter !== 'all') {
      const isAvailable = availabilityFilter === 'available';
      filtered = filtered.filter(feature => feature.available_in_ghana === isAvailable);
    }

    setFilteredFeatures(filtered);
  };

  // Apply filters when dependencies change
  React.useEffect(() => {
    applyFilters();
  }, [searchTerm, categoryFilter, availabilityFilter, features]);

  const handleAddFeature = () => {
    setSelectedFeature({
      id: 0,
      name: '',
      category: 'energy',
      description: '',
      base_cost: 0,
      sustainability_points: 0,
      available_in_ghana: true,
      regional_availability: {},
      regional_pricing: {},
    });
    setIsEditDialogOpen(true);
  };

  const handleEditFeature = (feature: EcoFeature) => {
    setSelectedFeature(feature);
    setIsEditDialogOpen(true);
  };

  const handleDeleteFeature = (feature: EcoFeature) => {
    setSelectedFeature(feature);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveFeature = (feature: EcoFeature) => {
    if (feature.id === 0) {
      // Create new feature
      const newFeature = db.createEcoFeature(feature);
      setFeatures(prev => [...prev, newFeature]);
    } else {
      // Update existing feature
      const updated = db.updateEcoFeature(feature.id, feature);
      if (updated) {
        setFeatures(prev => prev.map(f => f.id === feature.id ? updated : f));
      }
    }
    
    applyFilters();
    setIsEditDialogOpen(false);
    setSelectedFeature(null);
  };

  const confirmDelete = () => {
    if (selectedFeature) {
      db.deleteEcoFeature(selectedFeature.id);
      setFeatures(prev => prev.filter(f => f.id !== selectedFeature.id));
      applyFilters();
      setIsDeleteDialogOpen(false);
      setSelectedFeature(null);
    }
  };

  const getCategoryBadge = (category: EcoFeature['category']) => {
    const Icon = categoryIcons[category];
    const colorClass = categoryColors[category];
    
    return (
      <Badge className={`${colorClass} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {category.replace('_', ' ')}
      </Badge>
    );
  };

  const getAvailabilityInfo = (feature: EcoFeature) => {
    if (!feature.available_in_ghana) {
      return <Badge variant="destructive">Not Available</Badge>;
    }

    const availableRegions = Object.entries(feature.regional_availability || {})
      .filter(([_, available]) => available)
      .length;
    
    const totalRegions = regions.length;
    
    if (availableRegions === totalRegions) {
      return <Badge variant="default">All Regions</Badge>;
    } else if (availableRegions > 0) {
      return <Badge variant="secondary">{availableRegions}/{totalRegions} Regions</Badge>;
    } else {
      return <Badge variant="outline">Limited</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search eco features..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    applyFilters();
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={(value) => {
              setCategoryFilter(value);
              applyFilters();
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="energy">Energy</SelectItem>
                <SelectItem value="water">Water</SelectItem>
                <SelectItem value="materials">Materials</SelectItem>
                <SelectItem value="waste">Waste</SelectItem>
                <SelectItem value="smart_tech">Smart Tech</SelectItem>
                <SelectItem value="air_quality">Air Quality</SelectItem>
              </SelectContent>
            </Select>

            <Select value={availabilityFilter} onValueChange={(value) => {
              setAvailabilityFilter(value);
              applyFilters();
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Features</SelectItem>
                <SelectItem value="available">Available in Ghana</SelectItem>
                <SelectItem value="unavailable">Not Available</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Features Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5" />
              Eco Features ({filteredFeatures.length})
            </div>
            <Button onClick={handleAddFeature}>
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Base Cost</TableHead>
                <TableHead>Sustainability Points</TableHead>
                <TableHead>Ghana Availability</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFeatures.map((feature) => (
                <TableRow key={feature.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{feature.name}</div>
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {feature.description}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {getCategoryBadge(feature.category)}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {feature.base_cost.toLocaleString()} GHS
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline">
                      {feature.sustainability_points} pts
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    {getAvailabilityInfo(feature)}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditFeature(feature)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFeature(feature)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredFeatures.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No eco features found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Feature Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedFeature?.id === 0 ? 'Add New Eco Feature' : 'Edit Eco Feature'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedFeature && (
            <EcoFeatureForm
              feature={selectedFeature}
              regions={regions}
              onSave={handleSaveFeature}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Eco Feature</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p>Are you sure you want to delete "{selectedFeature?.name}"?</p>
            <Alert>
              <AlertDescription>
                This action cannot be undone. The feature will be removed from all properties and construction requests.
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete Feature
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface EcoFeatureFormProps {
  feature: EcoFeature;
  regions: Region[];
  onSave: (feature: EcoFeature) => void;
  onCancel: () => void;
}

function EcoFeatureForm({ feature, regions, onSave, onCancel }: EcoFeatureFormProps) {
  const [formData, setFormData] = useState<EcoFeature>({
    ...feature,
    regional_availability: feature.regional_availability || {},
    regional_pricing: feature.regional_pricing || {},
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateRegionalAvailability = (regionCode: string, available: boolean) => {
    setFormData(prev => ({
      ...prev,
      regional_availability: {
        ...prev.regional_availability,
        [regionCode]: available
      }
    }));
  };

  const updateRegionalPricing = (regionCode: string, multiplier: number) => {
    setFormData(prev => ({
      ...prev,
      regional_pricing: {
        ...prev.regional_pricing,
        [regionCode]: multiplier
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h4 className="font-medium">Basic Information</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Feature Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value: EcoFeature['category']) => 
                setFormData(prev => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="energy">Energy</SelectItem>
                <SelectItem value="water">Water</SelectItem>
                <SelectItem value="materials">Materials</SelectItem>
                <SelectItem value="waste">Waste</SelectItem>
                <SelectItem value="smart_tech">Smart Tech</SelectItem>
                <SelectItem value="air_quality">Air Quality</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="base_cost">Base Cost (GHS) *</Label>
            <Input
              id="base_cost"
              type="number"
              min="0"
              step="0.01"
              value={formData.base_cost}
              onChange={(e) => setFormData(prev => ({ ...prev, base_cost: parseFloat(e.target.value) || 0 }))}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="sustainability_points">Sustainability Points *</Label>
            <Input
              id="sustainability_points"
              type="number"
              min="0"
              value={formData.sustainability_points}
              onChange={(e) => setFormData(prev => ({ ...prev, sustainability_points: parseInt(e.target.value) || 0 }))}
              required
            />
          </div>
          
          <div className="flex items-center space-x-2 pt-6">
            <Switch
              checked={formData.available_in_ghana}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, available_in_ghana: checked }))}
            />
            <Label>Available in Ghana</Label>
          </div>
        </div>
      </div>

      {/* Regional Settings */}
      {formData.available_in_ghana && (
        <div className="space-y-4 border-t pt-4">
          <h4 className="font-medium">Regional Availability & Pricing</h4>
          
          <div className="grid gap-4">
            {regions.map((region) => (
              <div key={region.code} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">{region.name}</span>
                    <Badge variant="outline">{region.code}</Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.regional_availability?.[region.code] ?? true}
                      onCheckedChange={(checked) => updateRegionalAvailability(region.code, checked)}
                    />
                    <Label className="text-sm">Available</Label>
                  </div>
                  
                  {formData.regional_availability?.[region.code] !== false && (
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Price Multiplier:</Label>
                      <Input
                        type="number"
                        min="0.1"
                        max="5"
                        step="0.05"
                        value={formData.regional_pricing?.[region.code] ?? 1.0}
                        onChange={(e) => updateRegionalPricing(region.code, parseFloat(e.target.value) || 1.0)}
                        className="w-20"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <Alert>
            <AlertDescription>
              Price multipliers adjust the base cost for each region. For example, 1.2 means 20% higher cost, 0.8 means 20% lower cost.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {feature.id === 0 ? 'Create Feature' : 'Update Feature'}
        </Button>
      </div>
    </form>
  );
}