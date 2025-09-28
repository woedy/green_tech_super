import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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

const defaultForm: PlanFormState = {
  name: '',
  summary: '',
  description: '',
  style: '',
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

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.style) {
      setError('Name and style are required.');
      return;
    }
    try {
      setSaving(true);
      const payload = toPayload(form, template);
      const response = editing
        ? await adminApi.updatePlan(Number(id), payload)
        : await adminApi.createPlan(payload);
      navigate(`/admin/plans/${response.id}`);
    } catch (err) {
      console.error('Failed to save plan', err);
      setError('Unable to save plan. Please review the data and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-6 text-sm text-muted-foreground">Loading plan…</div>;
  }

  return (
    <Card>
      <CardHeader><CardTitle>{editing ? 'Edit Plan' : 'New Plan'}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3 max-w-2xl">
          {error && <div className="text-sm text-destructive">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => handleChange({ name: e.target.value })} required />
            </div>
            <div>
              <Label>Style</Label>
              <Input value={form.style} onChange={(e) => handleChange({ style: e.target.value })} required />
            </div>
          </div>
          <div>
            <Label>Summary</Label>
            <Input value={form.summary} onChange={(e) => handleChange({ summary: e.target.value })} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => handleChange({ description: e.target.value })} rows={4} />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label>Bedrooms</Label>
              <Input type="number" value={form.bedrooms} onChange={(e) => handleChange({ bedrooms: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Bathrooms</Label>
              <Input type="number" value={form.bathrooms} onChange={(e) => handleChange({ bathrooms: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Floors</Label>
              <Input type="number" value={form.floors} onChange={(e) => handleChange({ floors: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Area (sqm)</Label>
              <Input type="number" value={form.areaSqM} onChange={(e) => handleChange({ areaSqM: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Base Price</Label>
              <Input type="number" value={form.basePrice} onChange={(e) => handleChange({ basePrice: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Currency</Label>
              <Input value={form.baseCurrency} onChange={(e) => handleChange({ baseCurrency: e.target.value.toUpperCase() })} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch checked={form.isPublished} onCheckedChange={(checked) => handleChange({ isPublished: checked })} />
              <span className="text-sm">Published</span>
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
          <div>
            <Label>Hero Image URL</Label>
            <Input value={form.heroImageUrl} onChange={(e) => handleChange({ heroImageUrl: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save' : 'Create'}</Button>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/plans')} disabled={saving}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
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
    if (!confirm('Delete this plan?')) return;
    try {
      await adminApi.deletePlan(plan.id);
      navigate('/admin/plans');
    } catch (err) {
      console.error('Failed to delete plan', err);
      setError('Unable to delete plan.');
    }
  };

  if (loading) {
    return <div className="py-6 text-sm text-muted-foreground">Loading plan…</div>;
  }
  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }
  if (!plan) return <div>Plan not found.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{plan.name}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/admin/plans/${plan.id}/edit`)}>Edit</Button>
          <Button variant="destructive" onClick={remove}>Delete</Button>
        </div>
      </div>
      <Card>
        <CardContent className="space-y-2 text-sm">
          <div><strong>Status:</strong> {plan.is_published ? 'Published' : 'Draft'}</div>
          <div><strong>Style:</strong> {plan.style}</div>
          <div><strong>Bedrooms:</strong> {plan.bedrooms}</div>
          <div><strong>Bathrooms:</strong> {plan.bathrooms}</div>
          <div><strong>Floors:</strong> {plan.floors}</div>
          <div><strong>Area:</strong> {plan.area_sq_m} sqm</div>
          <div><strong>Base Price:</strong> ${Number(plan.base_price).toLocaleString()} {plan.base_currency}</div>
          <div><strong>Sustainability Score:</strong> {plan.sustainability_score}</div>
          <div><strong>Energy Rating:</strong> {plan.energy_rating}</div>
          <div><strong>Water Rating:</strong> {plan.water_rating}</div>
          <div><strong>Summary:</strong> {plan.summary || '-'}</div>
          <div><strong>Description:</strong> {plan.description || '-'}</div>
        </CardContent>
      </Card>
    </div>
  );
}
