import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { adminApi } from '../api';
import type { RegionPayload, RegionResponse } from '../types/api';

interface RegionFormState {
  name: string;
  slug: string;
  country: string;
  currencyCode: string;
  costMultiplier: number;
  timezone: string;
  isActive: boolean;
}

const defaultForm: RegionFormState = {
  name: '',
  slug: '',
  country: '',
  currencyCode: 'USD',
  costMultiplier: 1,
  timezone: '',
  isActive: true,
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function toPayload(form: RegionFormState): RegionPayload {
  return {
    name: form.name,
    slug: form.slug || slugify(form.name),
    country: form.country,
    currency_code: form.currencyCode,
    cost_multiplier: form.costMultiplier.toString(),
    timezone: form.timezone,
    is_active: form.isActive,
  };
}

function fillForm(region: RegionResponse | null): RegionFormState {
  if (!region) return { ...defaultForm };
  return {
    name: region.name,
    slug: region.slug,
    country: region.country,
    currencyCode: region.currency_code,
    costMultiplier: Number(region.cost_multiplier),
    timezone: region.timezone,
    isActive: region.is_active,
  };
}

export function RegionForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState<RegionFormState>({ ...defaultForm });
  const [template, setTemplate] = useState<RegionResponse | null>(null);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const region = await adminApi.getRegion(Number(id));
        if (!cancelled) {
          setTemplate(region);
          setForm(fillForm(region));
        }
      } catch (err) {
        console.error('Failed to load region', err);
        if (!cancelled) setError('Unable to load region.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [editing, id]);

  const handleChange = (patch: Partial<RegionFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name) {
      setError('Name is required.');
      return;
    }
    try {
      setSaving(true);
      const payload = toPayload(form);
      const response = editing
        ? await adminApi.updateRegion(Number(id), payload)
        : await adminApi.createRegion(payload);
      navigate(`/admin/regions/${response.id}`);
    } catch (err) {
      console.error('Failed to save region', err);
      setError('Unable to save region. Please review the data and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-6 text-sm text-muted-foreground">Loading region…</div>;
  }

  return (
    <Card>
      <CardHeader><CardTitle>{editing ? 'Edit Region' : 'New Region'}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3 max-w-xl">
          {error && <div className="text-sm text-destructive">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => handleChange({ name: e.target.value })} required />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => handleChange({ slug: slugify(e.target.value) })}
                placeholder="auto-generated from name"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Country</Label>
              <Input value={form.country} onChange={(e) => handleChange({ country: e.target.value })} />
            </div>
            <div>
              <Label>Timezone</Label>
              <Input value={form.timezone} onChange={(e) => handleChange({ timezone: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Currency Code</Label>
              <Input value={form.currencyCode} onChange={(e) => handleChange({ currencyCode: e.target.value.toUpperCase() })} />
            </div>
            <div>
              <Label>Cost Multiplier</Label>
              <Input type="number" step="0.01" value={form.costMultiplier} onChange={(e) => handleChange({ costMultiplier: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Switch checked={form.isActive} onCheckedChange={(checked) => handleChange({ isActive: checked })} />
            <span className="text-sm">Active</span>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/regions')} disabled={saving}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function RegionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const regionId = useMemo(() => Number(id), [id]);
  const [region, setRegion] = useState<RegionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await adminApi.getRegion(regionId);
        if (!cancelled) {
          setRegion(data);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load region', err);
        if (!cancelled) setError('Unable to load region.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (!Number.isNaN(regionId)) {
      load();
    }
    return () => {
      cancelled = true;
    };
  }, [regionId]);

  const remove = async () => {
    if (!region) return;
    if (!confirm('Delete this region?')) return;
    try {
      await adminApi.deleteRegion(region.id);
      navigate('/admin/regions');
    } catch (err) {
      console.error('Failed to delete region', err);
      setError('Unable to delete region.');
    }
  };

  if (loading) {
    return <div className="py-6 text-sm text-muted-foreground">Loading region…</div>;
  }
  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }
  if (!region) return <div>Region not found.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{region.name} ({region.slug})</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/admin/regions/${region.id}/edit`)}>Edit</Button>
          <Button variant="destructive" onClick={remove}>Delete</Button>
        </div>
      </div>
      <Card>
        <CardContent className="space-y-2 text-sm">
          <div><strong>Country:</strong> {region.country}</div>
          <div><strong>Currency:</strong> {region.currency_code}</div>
          <div><strong>Multiplier:</strong> {Number(region.cost_multiplier).toFixed(2)}</div>
          <div><strong>Timezone:</strong> {region.timezone || '-'}</div>
          <div><strong>Status:</strong> {region.is_active ? 'Active' : 'Inactive'}</div>
        </CardContent>
      </Card>
    </div>
  );
}
