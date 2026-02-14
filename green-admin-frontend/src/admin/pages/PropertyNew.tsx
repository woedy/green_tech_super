import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { adminApi } from '../api';
import type { PropertyPayload, PropertyResponse, RegionResponse } from '../types/api';

interface PropertyFormState {
  title: string;
  summary: string;
  description: string;
  propertyType: string;
  listingType: string;
  status: string;
  price: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  areaSqM: number;
  plotSqM: number | null;
  yearBuilt: number | null;
  heroImageUrl: string;
  sustainabilityScore: number;
  energyRating: number;
  waterRating: number;
  ecoFeatures: string;
  amenities: string;
  highlights: string;
  city: string;
  country: string;
  region: string;
  address: string;
  latitude: string;
  longitude: string;
  featured: boolean;
}

interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
}

const defaultForm: PropertyFormState = {
  title: '',
  summary: '',
  description: '',
  propertyType: 'house',
  listingType: 'sale',
  status: 'draft',
  price: 0,
  currency: 'USD',
  bedrooms: 0,
  bathrooms: 0,
  areaSqM: 0,
  plotSqM: null,
  yearBuilt: null,
  heroImageUrl: '',
  sustainabilityScore: 60,
  energyRating: 3,
  waterRating: 3,
  ecoFeatures: '',
  amenities: '',
  highlights: '',
  city: '',
  country: '',
  region: '',
  address: '',
  latitude: '',
  longitude: '',
  featured: false,
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function splitList(input: string): string[] {
  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toPayload(form: PropertyFormState, template: PropertyResponse | null): PropertyPayload {
  const slugCandidate = slugify(form.title);
  return {
    slug: template?.slug ?? (slugCandidate || `property-${Date.now()}`),
    title: form.title,
    summary: form.summary,
    description: form.description,
    property_type: form.propertyType,
    listing_type: form.listingType,
    status: form.status,
    price: form.price.toString(),
    currency: form.currency,
    bedrooms: form.bedrooms,
    bathrooms: form.bathrooms,
    area_sq_m: form.areaSqM.toString(),
    plot_sq_m: form.plotSqM !== null ? form.plotSqM.toString() : null,
    year_built: form.yearBuilt ?? null,
    hero_image_url: form.heroImageUrl,
    sustainability_score: form.sustainabilityScore,
    energy_rating: form.energyRating,
    water_rating: form.waterRating,
    eco_features: splitList(form.ecoFeatures),
    amenities: splitList(form.amenities),
    highlights: splitList(form.highlights),
    city: form.city,
    country: form.country,
    region: form.region,
    address: form.address,
    latitude: form.latitude || null,
    longitude: form.longitude || null,
    featured: form.featured,
    listed_by: template?.listed_by ?? null,
    images: template?.images ?? [],
  };
}

function fillForm(property: PropertyResponse | null): PropertyFormState {
  if (!property) return { ...defaultForm };
  return {
    title: property.title,
    summary: property.summary,
    description: property.description,
    propertyType: property.property_type,
    listingType: property.listing_type,
    status: property.status,
    price: Number(property.price),
    currency: property.currency,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    areaSqM: Number(property.area_sq_m),
    plotSqM: property.plot_sq_m ? Number(property.plot_sq_m) : null,
    yearBuilt: property.year_built ?? null,
    heroImageUrl: property.hero_image_url,
    sustainabilityScore: property.sustainability_score,
    energyRating: property.energy_rating,
    waterRating: property.water_rating,
    ecoFeatures: property.eco_features.join(', '),
    amenities: property.amenities.join(', '),
    highlights: property.highlights.join(', '),
    city: property.city,
    country: property.country,
    region: property.region,
    address: property.address,
    latitude: property.latitude ?? '',
    longitude: property.longitude ?? '',
    featured: property.featured,
  };
}

export default function PropertyNew() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState<PropertyFormState>({ ...defaultForm });
  const [template, setTemplate] = useState<PropertyResponse | null>(null);
  const [regions, setRegions] = useState<RegionResponse[]>([]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    async function loadRegions() {
      try {
        const data = await adminApi.listRegions();
        if (!cancelled) setRegions(data);
      } catch (err) {
        console.error('Failed to load regions', err);
      }
    }
    loadRegions();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const property = await adminApi.getProperty(Number(id));
        if (!cancelled) {
          setTemplate(property);
          setForm(fillForm(property));
        }
      } catch (err) {
        console.error('Failed to load property', err);
        if (!cancelled) setError('Unable to load property.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [editing, id]);

  const handleChange = (patch: Partial<PropertyFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadState({
        uploading: false,
        progress: 0,
        error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
      });
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadState({
        uploading: false,
        progress: 0,
        error: 'File size exceeds 5MB. Please choose a smaller image.',
      });
      return;
    }

    try {
      setUploadState({ uploading: true, progress: 0, error: null });
      const result = await adminApi.uploadPropertyImage(file);
      
      // Construct absolute URL
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const fullUrl = result.url.startsWith('http') ? result.url : `${apiBase}${result.url}`;
      
      handleChange({ heroImageUrl: fullUrl });
      setUploadState({ uploading: false, progress: 100, error: null });
    } catch (err) {
      console.error('Upload failed', err);
      setUploadState({
        uploading: false,
        progress: 0,
        error: err instanceof Error ? err.message : 'Upload failed. Please try again.',
      });
    }
  };

  const handleRemoveImage = () => {
    handleChange({ heroImageUrl: '' });
    setUploadState({ uploading: false, progress: 0, error: null });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title || !form.region) {
      setError('Title and region are required.');
      return;
    }
    try {
      setSaving(true);
      const payload = toPayload(form, template);
      const response = editing
        ? await adminApi.updateProperty(Number(id), payload)
        : await adminApi.createProperty(payload);
      navigate(`/admin/properties/${response.id}`);
    } catch (err) {
      console.error('Failed to save property', err);
      setError('Unable to save property. Please review the data and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-6 text-sm text-muted-foreground">Loading property…</div>;
  }

  const propertyTypes = ['house', 'apartment', 'villa', 'townhouse', 'land', 'commercial'];
  const listingTypes = ['sale', 'rent', 'lease'];
  const statusOptions = ['draft', 'published', 'sold', 'rented'];
  const currencies = ['USD', 'GHS', 'EUR', 'GBP', 'ZAR'];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{editing ? 'Edit Property' : 'Add New Property'}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {editing ? 'Update property details and information' : 'Fill in the details to create a new property listing'}
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Property Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => handleChange({ title: e.target.value })}
                placeholder="e.g., Modern 3-Bedroom Villa in Accra"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="summary">Summary</Label>
                <Input
                  id="summary"
                  value={form.summary}
                  onChange={(e) => handleChange({ summary: e.target.value })}
                  placeholder="Brief one-line description"
                />
              </div>
              <div>
                <Label htmlFor="heroImage">Hero Image</Label>
                <div className="space-y-2">
                  <Input
                    id="heroImage"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileUpload}
                    disabled={uploadState.uploading || saving}
                    className="cursor-pointer"
                  />
                  {uploadState.uploading && (
                    <div className="text-sm text-muted-foreground">Uploading...</div>
                  )}
                  {uploadState.error && (
                    <div className="text-sm text-destructive">{uploadState.error}</div>
                  )}
                  {form.heroImageUrl && !uploadState.uploading && (
                    <div className="relative inline-block">
                      <img
                        src={form.heroImageUrl}
                        alt="Hero preview"
                        className="h-20 w-32 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={handleRemoveImage}
                      >
                        ×
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => handleChange({ description: e.target.value })}
                rows={5}
                placeholder="Detailed description of the property..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Property Details */}
        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="propertyType">Property Type *</Label>
                <select
                  id="propertyType"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.propertyType}
                  onChange={(e) => handleChange({ propertyType: e.target.value })}
                  required
                >
                  {propertyTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="listingType">Listing Type *</Label>
                <select
                  id="listingType"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.listingType}
                  onChange={(e) => handleChange({ listingType: e.target.value })}
                  required
                >
                  {listingTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.status}
                  onChange={(e) => handleChange({ status: e.target.value })}
                  required
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Switch
                id="featured"
                checked={form.featured}
                onCheckedChange={(checked) => handleChange({ featured: checked })}
              />
              <Label htmlFor="featured" className="cursor-pointer">
                Mark as Featured Property
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  value={form.price}
                  onChange={(e) => handleChange({ price: Number(e.target.value) })}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency *</Label>
                <select
                  id="currency"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.currency}
                  onChange={(e) => handleChange({ currency: e.target.value })}
                  required
                >
                  {currencies.map((curr) => (
                    <option key={curr} value={curr}>
                      {curr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={form.bedrooms}
                  onChange={(e) => handleChange({ bedrooms: Number(e.target.value) })}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  value={form.bathrooms}
                  onChange={(e) => handleChange({ bathrooms: Number(e.target.value) })}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="areaSqM">Area (sqm)</Label>
                <Input
                  id="areaSqM"
                  type="number"
                  value={form.areaSqM}
                  onChange={(e) => handleChange({ areaSqM: Number(e.target.value) })}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="plotSqM">Plot (sqm)</Label>
                <Input
                  id="plotSqM"
                  type="number"
                  value={form.plotSqM ?? ''}
                  onChange={(e) => handleChange({ plotSqM: e.target.value ? Number(e.target.value) : null })}
                  min="0"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="yearBuilt">Year Built</Label>
              <Input
                id="yearBuilt"
                type="number"
                value={form.yearBuilt ?? ''}
                onChange={(e) => handleChange({ yearBuilt: e.target.value ? Number(e.target.value) : null })}
                min="1800"
                max={new Date().getFullYear()}
                placeholder="e.g., 2020"
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="region">Region *</Label>
                <select
                  id="region"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.region}
                  onChange={(e) => handleChange({ region: e.target.value })}
                  required
                >
                  <option value="">Select region</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.slug}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => handleChange({ city: e.target.value })}
                  placeholder="e.g., Accra"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={form.country}
                  onChange={(e) => handleChange({ country: e.target.value })}
                  placeholder="e.g., Ghana"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => handleChange({ address: e.target.value })}
                  placeholder="Street address"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  value={form.latitude}
                  onChange={(e) => handleChange({ latitude: e.target.value })}
                  placeholder="e.g., 5.6037"
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  value={form.longitude}
                  onChange={(e) => handleChange({ longitude: e.target.value })}
                  placeholder="e.g., -0.1870"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features & Amenities */}
        <Card>
          <CardHeader>
            <CardTitle>Features & Amenities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="ecoFeatures">Eco Features (comma separated)</Label>
              <Textarea
                id="ecoFeatures"
                value={form.ecoFeatures}
                onChange={(e) => handleChange({ ecoFeatures: e.target.value })}
                rows={3}
                placeholder="e.g., Solar panels, Rainwater harvesting, Energy-efficient windows"
              />
            </div>

            <div>
              <Label htmlFor="amenities">Amenities (comma separated)</Label>
              <Textarea
                id="amenities"
                value={form.amenities}
                onChange={(e) => handleChange({ amenities: e.target.value })}
                rows={3}
                placeholder="e.g., Swimming pool, Gym, Parking, Security"
              />
            </div>

            <div>
              <Label htmlFor="highlights">Highlights (comma separated)</Label>
              <Textarea
                id="highlights"
                value={form.highlights}
                onChange={(e) => handleChange({ highlights: e.target.value })}
                rows={3}
                placeholder="e.g., Ocean view, Gated community, Near schools"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sustainability Ratings */}
        <Card>
          <CardHeader>
            <CardTitle>Sustainability Ratings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="sustainabilityScore">Sustainability Score (0-100)</Label>
                <Input
                  id="sustainabilityScore"
                  type="number"
                  value={form.sustainabilityScore}
                  onChange={(e) => handleChange({ sustainabilityScore: Number(e.target.value) })}
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <Label htmlFor="energyRating">Energy Rating (1-5)</Label>
                <Input
                  id="energyRating"
                  type="number"
                  value={form.energyRating}
                  onChange={(e) => handleChange({ energyRating: Number(e.target.value) })}
                  min="1"
                  max="5"
                />
              </div>
              <div>
                <Label htmlFor="waterRating">Water Rating (1-5)</Label>
                <Input
                  id="waterRating"
                  type="number"
                  value={form.waterRating}
                  onChange={(e) => handleChange({ waterRating: Number(e.target.value) })}
                  min="1"
                  max="5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center gap-3 pt-4">
          <Button type="submit" disabled={saving} size="lg">
            {saving ? 'Saving…' : editing ? 'Update Property' : 'Create Property'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/properties')}
            disabled={saving}
            size="lg"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
