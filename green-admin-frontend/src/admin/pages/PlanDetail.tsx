import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { db } from '../data/db';
import type { Plan } from '../types';
import { useState, useEffect } from 'react';

export function PlanForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState<Partial<Plan>>({ name: '', style: '', beds: 3, basePrice: 0, status: 'Draft', description: '' });

  useEffect(() => {
    if (editing) {
      const p = db.getPlan(Number(id));
      if (p) setForm(p);
    }
  }, [id]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.style) return;
    if (editing) {
      db.updatePlan(Number(id), form as any);
      navigate(`/admin/plans/${id}`);
    } else {
      const created = db.createPlan({
        name: String(form.name),
        style: String(form.style),
        beds: Number(form.beds ?? 0),
        basePrice: Number(form.basePrice ?? 0),
        status: (form.status as any) || 'Draft',
        description: form.description || '',
      });
      navigate(`/admin/plans/${created.id}`);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>{editing ? 'Edit Plan' : 'New Plan'}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3 max-w-xl">
          <div>
            <Label>Name</Label>
            <Input value={form.name as any} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <Label>Style</Label>
            <Input value={form.style as any} onChange={e => setForm({ ...form, style: e.target.value })} required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Beds</Label>
              <Input type="number" value={form.beds as any} onChange={e => setForm({ ...form, beds: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Base Price</Label>
              <Input type="number" value={form.basePrice as any} onChange={e => setForm({ ...form, basePrice: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Status</Label>
              <Input value={form.status as any} onChange={e => setForm({ ...form, status: e.target.value as any })} />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description as any} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button type="submit">{editing ? 'Save' : 'Create'}</Button>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/plans')}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function PlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const plan = db.getPlan(Number(id));
  if (!plan) return <div>Plan not found.</div>;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{plan.name}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/admin/plans/${plan.id}/edit`)}>Edit</Button>
          <Button variant="destructive" onClick={() => { db.deletePlan(plan.id); navigate('/admin/plans'); }}>Delete</Button>
        </div>
      </div>
      <Card>
        <CardContent className="space-y-2">
          <div><strong>Style:</strong> {plan.style}</div>
          <div><strong>Beds:</strong> {plan.beds}</div>
          <div><strong>Base Price:</strong> ${'{'}plan.basePrice.toLocaleString(){'}'}</div>
          <div><strong>Status:</strong> {plan.status}</div>
          <div><strong>Description:</strong> {plan.description || '—'}</div>
        </CardContent>
      </Card>
    </div>
  );
}
