import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Home, 
  Bed, 
  Bath, 
  Layers, 
  Ruler, 
  DollarSign, 
  Leaf, 
  Zap, 
  Droplets,
  Upload,
  X,
  ArrowLeft,
  Edit,
  Trash2,
  Check
} from 'lucide-react';
import { adminApi } from '../api';
import type { PlanPayload, PlanResponse } from '../types/api';

interface PlanFormState {
  name: string;
  summary: string;
  description: string;
  style: string;
  bedrooms: number;
  bathrooms: number;
  floors: number;
  areaSqM: number;
  basePrice: number;
  baseCurrency: string;
  sustainabilityScore: number;
  energyRating: number;
  waterRating: number;
  heroImageUrl: string;
  isPublished: boolean;
}

interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
}

const defaultForm: PlanFormState = {
  name: '',
  summary: '',
  description: '',
  style: 'modern',
  bedrooms: 3,
  bathrooms: 2,
  floors: 1,
  areaSqM: 120,
  basePrice: 25000,
  baseCurrency: 'USD',
  sustainabilityScore: 60,
  energyRating: 3,
  waterRating: 3,
  heroImageUrl: '',
  isPublished: false,
};

const PLAN_STYLES = [
  { value: 'modern', label: 'Modern' },
  { value: 'contemporary', label: 'Contemporary' },
  { value: 'bungalow', label: 'Bungalow' },
  { value: 'villa', label: 'Villa' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'traditional', label: 'Traditional' },
] as const;

const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'ZAR', label: 'ZAR - South African Rand' },
  { value: 'KES', label: 'KES - Kenyan Shilling' },
  { value: 'NGN', label: 'NGN - Nigerian Naira' },
  { value: 'GHS', label: 'GHS - Ghanaian Cedi' },
  { value: 'TZS', label: 'TZS - Tanzanian Shilling' },
  { value: 'UGX', label: 'UGX - Ugandan Shilling' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
] as const;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function toPayload(form: PlanFormState, template: PlanResponse | null): PlanPayload {
  const slugCandidate = slugify(form.name);
  return {
    slug: template?.slug ?? (slugCandidate || `plan-${Date.now()}`),
    name: form.name,
    summary: form.summary,
    description: form.description,
    style: form.style,
    bedrooms: form.bedrooms,
    bathrooms: form.bathrooms,
    floors: form.floors,
    area_sq_m: form.areaSqM.toString(),
    base_price: form.basePrice.toString(),
    base_currency: form.baseCurrency,
    has_garage: template?.has_garage ?? false,
    energy_rating: form.energyRating,
    water_rating: form.waterRating,
    sustainability_score: form.sustainabilityScore,
    hero_image_url: form.heroImageUrl,
    specs: template?.specs ?? {},
    tags: template?.tags ?? [],
    is_published: form.isPublished,
    images: template?.images ?? [],
    features: template?.features ?? [],
    options: template?.options ?? [],
    pricing: template?.pricing ?? [],
  };
}

function fillForm(plan: PlanResponse | null): PlanFormState {
  if (!plan) return { ...defaultForm };
  return {
    name: plan.name,
    summary: plan.summary,
    description: plan.description,
    style: plan.style,
    bedrooms: plan.bedrooms,
    bathrooms: plan.bathrooms,
    floors: plan.floors,
    areaSqM: Number(plan.area_sq_m),
    basePrice: Number(plan.base_price),
    baseCurrency: plan.base_currency,
    sustainabilityScore: plan.sustainability_score,
    energyRating: plan.energy_rating,
    waterRating: plan.water_rating,
    heroImageUrl: plan.hero_image_url,
    isPublished: plan.is_published,
  };
}

export function PlanForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState<PlanFormState>({ ...defaultForm });
  const [template, setTemplate] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
  });

  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const plan = await adminApi.getPlan(Number(id));
        if (!cancelled) {
          setTemplate(plan);
          setForm(fillForm(plan));
        }
      } catch (err) {
        console.error('Failed to load plan', err);
        if (!cancelled) setError('Unable to load plan.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [editing, id]);

  const handleChange = (patch: Partial<PlanFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
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
        error: 'File size exceeds 5MB limit.',
      });
      return;
    }

    try {
      setUploadState({ uploading: true, progress: 0, error: null });
      const response = await adminApi.uploadPlanImage(file);
      
      // Construct full URL if it's a relative path
      const fullUrl = response.url.startsWith('http') 
        ? response.url 
        : `${import.meta.env.VITE_API_URL}${response.url}`;
      
      handleChange({ heroImageUrl: fullUrl });
      setUploadState({ uploading: false, progress: 100, error: null });
    } catch (err: any) {
      console.error('Failed to upload image', err);
      setUploadState({
        uploading: false,
        progress: 0,
        error: err?.message || 'Failed to upload image. Please try again.',
      });
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Client-side validation
    if (!form.name || !form.style) {
      setError('Name and style are required.');
      return;
    }
    
    if (form.areaSqM < 10) {
      setError('Area must be at least 10 square meters.');
      return;
    }
    
    if (form.basePrice < 1000) {
      setError('Base price must be at least 1000.');
      return;
    }
    
    if (form.energyRating < 1 || form.energyRating > 5) {
      setError('Energy rating must be between 1 and 5.');
      return;
    }
    
    if (form.waterRating < 1 || form.waterRating > 5) {
      setError('Water rating must be between 1 and 5.');
      return;
    }
    
    if (form.sustainabilityScore < 0 || form.sustainabilityScore > 100) {
      setError('Sustainability score must be between 0 and 100.');
      return;
    }
    
    if (form.isPublished && !form.heroImageUrl) {
      setError('Published plans require a hero image URL.');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      const payload = toPayload(form, template);
      const response = editing
        ? await adminApi.updatePlan(Number(id), payload)
        : await adminApi.createPlan(payload);
      navigate(`/admin/plans/${response.id}`);
    } catch (err: any) {
      console.error('Failed to save plan', err);
      const errorMessage = err?.message || 'Unable to save plan. Please review the data and try again.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/plans')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{editing ? 'Edit Plan' : 'New Plan'}</h1>
          <p className="text-sm text-muted-foreground">
            {editing ? 'Update plan details and specifications' : 'Create a new architectural plan'}
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <X className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={submit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>Essential details about the plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name *</Label>
                <Input 
                  id="name"
                  value={form.name} 
                  onChange={(e) => handleChange({ name: e.target.value })} 
                  placeholder="e.g., Modern Villa"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="style">Style *</Label>
                <Select value={form.style} onValueChange={(value) => handleChange({ style: value })}>
                  <SelectTrigger id="style">
                    <SelectValue placeholder="Select a style" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAN_STYLES.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Input 
                id="summary"
                value={form.summary} 
                onChange={(e) => handleChange({ summary: e.target.value })} 
                placeholder="Brief one-line description"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                value={form.description} 
                onChange={(e) => handleChange({ description: e.target.value })} 
                rows={4}
                placeholder="Detailed description of the plan..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Specifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Specifications
            </CardTitle>
            <CardDescription>Physical characteristics and dimensions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms" className="flex items-center gap-2">
                  <Bed className="h-4 w-4" />
                  Bedrooms
                </Label>
                <Input 
                  id="bedrooms"
                  type="number" 
                  min="0" 
                  value={form.bedrooms} 
                  onChange={(e) => handleChange({ bedrooms: Number(e.target.value) })} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms" className="flex items-center gap-2">
                  <Bath className="h-4 w-4" />
                  Bathrooms
                </Label>
                <Input 
                  id="bathrooms"
                  type="number" 
                  min="0" 
                  value={form.bathrooms} 
                  onChange={(e) => handleChange({ bathrooms: Number(e.target.value) })} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="floors" className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Floors
                </Label>
                <Input 
                  id="floors"
                  type="number" 
                  min="1" 
                  value={form.floors} 
                  onChange={(e) => handleChange({ floors: Number(e.target.value) })} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Area (sqm)</Label>
                <Input 
                  id="area"
                  type="number" 
                  min="10" 
                  step="0.01" 
                  value={form.areaSqM} 
                  onChange={(e) => handleChange({ areaSqM: Number(e.target.value) })} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing
            </CardTitle>
            <CardDescription>Base pricing information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basePrice">Base Price</Label>
                <Input 
                  id="basePrice"
                  type="number" 
                  min="1000" 
                  step="0.01" 
                  value={form.basePrice} 
                  onChange={(e) => handleChange({ basePrice: Number(e.target.value) })} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={form.baseCurrency} onValueChange={(value) => handleChange({ baseCurrency: value })}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sustainability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5" />
              Sustainability Ratings
            </CardTitle>
            <CardDescription>Environmental and efficiency metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sustainability" className="flex items-center gap-2">
                  <Leaf className="h-4 w-4" />
                  Sustainability Score (0-100)
                </Label>
                <Input 
                  id="sustainability"
                  type="number" 
                  min="0" 
                  max="100" 
                  value={form.sustainabilityScore} 
                  onChange={(e) => handleChange({ sustainabilityScore: Number(e.target.value) })} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="energy" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Energy Rating (1-5)
                </Label>
                <Input 
                  id="energy"
                  type="number" 
                  min="1" 
                  max="5" 
                  value={form.energyRating} 
                  onChange={(e) => handleChange({ energyRating: Number(e.target.value) })} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="water" className="flex items-center gap-2">
                  <Droplets className="h-4 w-4" />
                  Water Rating (1-5)
                </Label>
                <Input 
                  id="water"
                  type="number" 
                  min="1" 
                  max="5" 
                  value={form.waterRating} 
                  onChange={(e) => handleChange({ waterRating: Number(e.target.value) })} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hero Image */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Hero Image
            </CardTitle>
            <CardDescription>Main image for the plan (JPEG, PNG, or WebP, max 5MB)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input 
                type="file" 
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileUpload}
                disabled={uploadState.uploading || saving}
                className="cursor-pointer"
              />
              {uploadState.uploading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span>Uploading...</span>
                </div>
              )}
              {uploadState.error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <X className="h-4 w-4" />
                  <span>{uploadState.error}</span>
                </div>
              )}
              {form.heroImageUrl && (
                <div className="space-y-3">
                  <div className="relative rounded-lg border overflow-hidden">
                    <img 
                      src={form.heroImageUrl} 
                      alt="Hero preview" 
                      className="w-full h-64 object-cover"
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleChange({ heroImageUrl: '' })}
                    disabled={saving}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove Image
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Publishing */}
        <Card>
          <CardHeader>
            <CardTitle>Publishing</CardTitle>
            <CardDescription>Control plan visibility</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="published">Published Status</Label>
                <p className="text-sm text-muted-foreground">
                  Make this plan visible to the public
                </p>
              </div>
              <Switch 
                id="published"
                checked={form.isPublished} 
                onCheckedChange={(checked) => handleChange({ isPublished: checked })} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3 sticky bottom-0 bg-background py-4 border-t">
          <Button 
            type="submit" 
            disabled={saving}
            className="min-w-32"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                {editing ? 'Save Changes' : 'Create Plan'}
              </>
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/admin/plans')} 
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export function PlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const planId = useMemo(() => Number(id), [id]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await adminApi.getPlan(planId);
        if (!cancelled) {
          setPlan(data);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load plan', err);
        if (!cancelled) {
          setError('Unable to load plan.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    if (!Number.isNaN(planId)) {
      load();
    }
    return () => {
      cancelled = true;
    };
  }, [planId]);

  const remove = async () => {
    if (!plan) return;
    if (!confirm('Delete this plan? This action cannot be undone.')) return;
    try {
      await adminApi.deletePlan(plan.id);
      navigate('/admin/plans');
    } catch (err) {
      console.error('Failed to delete plan', err);
      setError('Unable to delete plan.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading plan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <X className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Plan not found.</p>
        <Button variant="outline" onClick={() => navigate('/admin/plans')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Plans
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/plans')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{plan.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={plan.is_published ? 'default' : 'secondary'}>
                  {plan.is_published ? 'Published' : 'Draft'}
                </Badge>
                <Badge variant="outline">{plan.style}</Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/admin/plans/${plan.id}/edit`)}>
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
      {plan.hero_image_url && (
        <Card className="overflow-hidden">
          <img 
            src={plan.hero_image_url} 
            alt={plan.name}
            className="w-full h-96 object-cover"
          />
        </Card>
      )}

      {/* Summary */}
      {plan.summary && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-lg text-muted-foreground">{plan.summary}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Specifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bed className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bedrooms</p>
                  <p className="text-lg font-semibold">{plan.bedrooms}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bath className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bathrooms</p>
                  <p className="text-lg font-semibold">{plan.bathrooms}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Floors</p>
                  <p className="text-lg font-semibold">{plan.floors}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Ruler className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Area</p>
                  <p className="text-lg font-semibold">{plan.area_sq_m} sqm</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                <p className="text-sm text-muted-foreground">Base Price</p>
                <p className="text-2xl font-bold">
                  {plan.base_currency} {Number(plan.base_price).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                <span className="text-lg font-bold">{plan.sustainability_score}/100</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all" 
                  style={{ width: `${plan.sustainability_score}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  Energy Rating
                </span>
                <span className="text-lg font-bold">{plan.energy_rating}/5</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div 
                    key={star}
                    className={`h-2 flex-1 rounded-full ${
                      star <= plan.energy_rating ? 'bg-yellow-600' : 'bg-secondary'
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
                <span className="text-lg font-bold">{plan.water_rating}/5</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div 
                    key={star}
                    className={`h-2 flex-1 rounded-full ${
                      star <= plan.water_rating ? 'bg-blue-600' : 'bg-secondary'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {plan.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{plan.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Plan ID</span>
            <span className="font-mono">{plan.id}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Slug</span>
            <span className="font-mono">{plan.slug}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created</span>
            <span>{new Date(plan.created_at).toLocaleDateString()}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Updated</span>
            <span>{new Date(plan.updated_at).toLocaleDateString()}</span>
          </div>
          {plan.published_at && (
            <>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Published</span>
                <span>{new Date(plan.published_at).toLocaleDateString()}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
