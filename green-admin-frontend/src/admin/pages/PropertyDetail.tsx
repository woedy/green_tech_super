﻿import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Bed, 
  Bath, 
  Ruler, 
  Calendar,
  DollarSign,
  Leaf,
  Zap,
  Droplets,
  Home,
  Star,
  Edit,
  Trash2
} from 'lucide-react';
import { adminApi } from '../api';
import type { PropertyResponse, RegionResponse } from '../types/api';

export function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const propertyId = useMemo(() => Number(id), [id]);
  const [property, setProperty] = useState<PropertyResponse | null>(null);
  const [regions, setRegions] = useState<RegionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const [prop, regionList] = await Promise.all([
          adminApi.getProperty(propertyId),
          adminApi.listRegions(),
        ]);
        if (!cancelled) {
          setProperty(prop);
          setRegions(regionList);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load property', err);
        if (!cancelled) setError('Unable to load property.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (!Number.isNaN(propertyId)) {
      load();
    }
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const remove = async () => {
    if (!property) return;
    if (!confirm('Delete this property?')) return;
    try {
      await adminApi.deleteProperty(property.id);
      navigate('/admin/properties');
    } catch (err) {
      console.error('Failed to delete property', err);
      setError('Unable to delete property.');
    }
  };

  if (loading) {
    return <div className="py-6 text-sm text-muted-foreground">Loading property…</div>;
  }
  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }
  if (!property) return <div>Property not found.</div>;

  const regionName = regions.find((region) => region.slug === property.region)?.name ?? property.region;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'published': 'default',
      'draft': 'secondary',
      'sold': 'destructive',
      'rented': 'outline'
    };
    return (
      <Badge variant={variants[status.toLowerCase()] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{property.title}</h1>
            {property.featured && (
              <Badge variant="default" className="bg-yellow-500">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{property.city}, {property.country}</span>
            <span className="mx-2">•</span>
            {getStatusBadge(property.status)}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/admin/properties/${property.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={remove}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Hero Image */}
      {property.hero_image_url && (
        <Card className="overflow-hidden">
          <img
            src={property.hero_image_url}
            alt={property.title}
            className="w-full h-96 object-cover"
          />
        </Card>
      )}

      {/* Summary */}
      {property.summary && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-lg text-muted-foreground">{property.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Price & Key Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-500/10">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {property.listing_type === 'sale' ? 'Sale Price' : 'Rental Price'}
                </p>
                <p className="text-2xl font-bold">
                  {property.currency} {Number(property.price).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Property Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Home className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="text-2xl font-bold capitalize">{property.property_type}</p>
                <p className="text-sm text-muted-foreground capitalize">For {property.listing_type}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Specifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Specifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bed className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bedrooms</p>
                <p className="text-lg font-semibold">{property.bedrooms}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bath className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bathrooms</p>
                <p className="text-lg font-semibold">{property.bathrooms}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Ruler className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Area</p>
                <p className="text-lg font-semibold">{property.area_sq_m} sqm</p>
              </div>
            </div>
            {property.plot_sq_m && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Ruler className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plot Size</p>
                  <p className="text-lg font-semibold">{property.plot_sq_m} sqm</p>
                </div>
              </div>
            )}
            {property.year_built && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Year Built</p>
                  <p className="text-lg font-semibold">{property.year_built}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Region</p>
              <p className="font-medium">{regionName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">City</p>
              <p className="font-medium">{property.city}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Country</p>
              <p className="font-medium">{property.country}</p>
            </div>
            {property.address && (
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{property.address}</p>
              </div>
            )}
          </div>
          {(property.latitude && property.longitude) && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground mb-1">Coordinates</p>
              <p className="font-mono text-sm">
                {property.latitude}, {property.longitude}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sustainability */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5" />
            Sustainability Ratings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-green-600" />
                  Sustainability Score
                </span>
                <span className="text-lg font-bold">{property.sustainability_score}/100</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all" 
                  style={{ width: `${property.sustainability_score}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  Energy Rating
                </span>
                <span className="text-lg font-bold">{property.energy_rating}/5</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div 
                    key={star}
                    className={`h-2 flex-1 rounded-full ${
                      star <= property.energy_rating ? 'bg-yellow-600' : 'bg-secondary'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-600" />
                  Water Rating
                </span>
                <span className="text-lg font-bold">{property.water_rating}/5</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div 
                    key={star}
                    className={`h-2 flex-1 rounded-full ${
                      star <= property.water_rating ? 'bg-blue-600' : 'bg-secondary'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features & Amenities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Eco Features */}
        {property.eco_features.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-600" />
                Eco Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {property.eco_features.map((feature, index) => (
                  <Badge key={index} variant="outline" className="bg-green-50">
                    {feature}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Amenities */}
        {property.amenities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity, index) => (
                  <Badge key={index} variant="outline">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Highlights */}
      {property.highlights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Highlights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {property.highlights.map((highlight, index) => (
                <Badge key={index} variant="secondary">
                  {highlight}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      {property.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{property.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Property Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Property ID</p>
              <p className="font-medium">{property.id}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Slug</p>
              <p className="font-medium font-mono text-xs">{property.slug}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">{new Date(property.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Updated</p>
              <p className="font-medium">{new Date(property.updated_at).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
