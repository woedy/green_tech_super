import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { db } from '../data/db';
import type { Property } from '../types';
import { useState, useEffect } from 'react';

export function PropertyForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState<Partial<Property>>({ title: '', price: 0, status: 'Draft', location: '', type: '' });

  useEffect(() => {
    if (editing) {
      const p = db.getProperty(Number(id));
      if (p) setForm(p);
    }
  }, [id]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    if (editing) {
      db.updateProperty(Number(id), form as any);
      navigate(`/admin/properties/${id}`);
    } else {
      const created = db.createProperty({
        title: String(form.title),
        price: Number(form.price ?? 0),
        status: (form.status as any) || 'Draft',
        location: form.location || '',
        type: form.type || '',
      });
      navigate(`/admin/properties/${created.id}`);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>{editing ? 'Edit Property' : 'New Property'}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3 max-w-xl">
          <div>
            <Label>Title</Label>
            <Input value={form.title as any} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Price</Label>
              <Input type="number" value={form.price as any} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Status</Label>
              <Input value={form.status as any} onChange={e => setForm({ ...form, status: e.target.value as any })} />
            </div>
            <div>
              <Label>Type</Label>
              <Input value={form.type as any} onChange={e => setForm({ ...form, type: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Location</Label>
            <Input value={form.location as any} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button type="submit">{editing ? 'Save' : 'Create'}</Button>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/properties')}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const item = db.getProperty(Number(id));
  if (!item) return <div>Property not found.</div>;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{item.title}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/admin/properties/${item.id}/edit`)}>Edit</Button>
          <Button variant="destructive" onClick={() => { db.deleteProperty(item.id); navigate('/admin/properties'); }}>Delete</Button>
        </div>
      </div>
      <Card>
        <CardContent className="space-y-2">
          <div><strong>Price:</strong> ${'{'}item.price.toLocaleString(){'}'}</div>
          <div><strong>Status:</strong> {item.status}</div>
          <div><strong>Type:</strong> {item.type || '—'}</div>
          <div><strong>Location:</strong> {item.location || '—'}</div>
        </CardContent>
      </Card>
    </div>
  );
}
