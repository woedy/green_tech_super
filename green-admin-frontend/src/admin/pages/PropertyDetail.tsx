import { useEffect, useMemo, useState } from 'react';
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

export function PropertyForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState<PropertyFormState>({ ...defaultForm });
  const [template, setTemplate] = useState<PropertyResponse | null>(null);
  const [regions, setRegions] = useState<RegionResponse[]>([]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Card>
      <CardHeader><CardTitle>{editing ? 'Edit Property' : 'New Property'}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3 max-w-3xl">
          {error && <div className="text-sm text-destructive">{error}</div>}
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => handleChange({ title: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Summary</Label>
              <Input value={form.summary} onChange={(e) => handleChange({ summary: e.target.value })} />
            </div>
            <div>
              <Label>Hero Image URL</Label>
              <Input value={form.heroImageUrl} onChange={(e) => handleChange({ heroImageUrl: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => handleChange({ description: e.target.value })} rows={4} />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label>Property Type</Label>
              <Input value={form.propertyType} onChange={(e) => handleChange({ propertyType: e.target.value })} />
            </div>
            <div>
              <Label>Listing Type</Label>
              <Input value={form.listingType} onChange={(e) => handleChange({ listingType: e.target.value })} />
            </div>
            <div>
              <Label>Status</Label>
              <Input value={form.status} onChange={(e) => handleChange({ status: e.target.value })} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch checked={form.featured} onCheckedChange={(checked) => handleChange({ featured: checked })} />
              <span className="text-sm">Featured</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label>Price</Label>
              <Input type="number" value={form.price} onChange={(e) => handleChange({ price: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Currency</Label>
              <Input value={form.currency} onChange={(e) => handleChange({ currency: e.target.value.toUpperCase() })} />
            </div>
            <div>
              <Label>Bedrooms</Label>
              <Input type="number" value={form.bedrooms} onChange={(e) => handleChange({ bedrooms: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Bathrooms</Label>
              <Input type="number" value={form.bathrooms} onChange={(e) => handleChange({ bathrooms: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label>Area (sqm)</Label>
              <Input type="number" value={form.areaSqM} onChange={(e) => handleChange({ areaSqM: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Plot (sqm)</Label>
              <Input type="number" value={form.plotSqM ?? ''} onChange={(e) => handleChange({ plotSqM: e.target.value ? Number(e.target.value) : null })} />
            </div>
            <div>
              <Label>Year Built</Label>
              <Input type="number" value={form.yearBuilt ?? ''} onChange={(e) => handleChange({ yearBuilt: e.target.value ? Number(e.target.value) : null })} />
            </div>
            <div>
              <Label>Region</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.region}
                onChange={(e) => handleChange({ region: e.target.value })}
                required
              >
                <option value="" disabled>Select region</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.slug}>{region.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => handleChange({ city: e.target.value })} />
            </div>
            <div>
              <Label>Country</Label>
              <Input value={form.country} onChange={(e) => handleChange({ country: e.target.value })} />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => handleChange({ address: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Latitude</Label>
              <Input value={form.latitude} onChange={(e) => handleChange({ latitude: e.target.value })} />
            </div>
            <div>
              <Label>Longitude</Label>
              <Input value={form.longitude} onChange={(e) => handleChange({ longitude: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Eco Features (comma separated)</Label>
              <Textarea value={form.ecoFeatures} onChange={(e) => handleChange({ ecoFeatures: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Amenities (comma separated)</Label>
              <Textarea value={form.amenities} onChange={(e) => handleChange({ amenities: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Highlights (comma separated)</Label>
              <Textarea value={form.highlights} onChange={(e) => handleChange({ highlights: e.target.value })} rows={2} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Sustainability Score</Label>
              <Input type="number" value={form.sustainabilityScore} onChange={(e) => handleChange({ sustainabilityScore: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Energy Rating</Label>
              <Input type="number" value={form.energyRating} onChange={(e) => handleChange({ energyRating: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Water Rating</Label>
              <Input type="number" value={form.waterRating} onChange={(e) => handleChange({ waterRating: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save' : 'Create'}</Button>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/properties')} disabled={saving}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{property.title}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/admin/properties/${property.id}/edit`)}>Edit</Button>
          <Button variant="destructive" onClick={remove}>Delete</Button>
        </div>
      </div>
      <Card>
        <CardContent className="space-y-2 text-sm">
          <div><strong>Status:</strong> {property.status}</div>
          <div><strong>Type:</strong> {property.property_type}</div>
          <div><strong>Listing Type:</strong> {property.listing_type}</div>
          <div><strong>Price:</strong> ${Number(property.price).toLocaleString()} {property.currency}</div>
          <div><strong>Bedrooms:</strong> {property.bedrooms}</div>
          <div><strong>Bathrooms:</strong> {property.bathrooms}</div>
          <div><strong>Area:</strong> {property.area_sq_m} sqm</div>
          {property.plot_sq_m && <div><strong>Plot:</strong> {property.plot_sq_m} sqm</div>}
          {property.year_built && <div><strong>Year Built:</strong> {property.year_built}</div>}
          <div><strong>Region:</strong> {regionName}</div>
          <div><strong>Location:</strong> {property.city}, {property.country}</div>
          <div><strong>Address:</strong> {property.address || '-'}</div>
          <div><strong>Featured:</strong> {property.featured ? 'Yes' : 'No'}</div>
          <div><strong>Sustainability Score:</strong> {property.sustainability_score}</div>
          <div><strong>Energy Rating:</strong> {property.energy_rating}</div>
          <div><strong>Water Rating:</strong> {property.water_rating}</div>
          <div><strong>Eco Features:</strong> {property.eco_features.join(', ') || '-'}</div>
          <div><strong>Amenities:</strong> {property.amenities.join(', ') || '-'}</div>
          <div><strong>Highlights:</strong> {property.highlights.join(', ') || '-'}</div>
          <div><strong>Description:</strong> {property.description || '-'}</div>
        </CardContent>
      </Card>
    </div>
  );
}
