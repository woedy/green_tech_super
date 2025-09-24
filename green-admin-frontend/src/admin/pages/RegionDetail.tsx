import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { db } from '../data/db';
import type { Region } from '../types';
import { useEffect, useState } from 'react';

export function RegionForm() {
  const { code } = useParams();
  const editing = Boolean(code);
  const navigate = useNavigate();
  const [form, setForm] = useState<Region>({ code: '', name: '', currency: '', multiplier: 1 });

  useEffect(() => {
    if (editing) {
      const r = db.getRegion(String(code));
      if (r) setForm(r);
    }
  }, [code]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code) return;
    db.upsertRegion(form);
    navigate(`/admin/regions/${form.code}`);
  };

  return (
    <Card>
      <CardHeader><CardTitle>{editing ? 'Edit Region' : 'New Region'}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3 max-w-xl">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Code</Label>
              <Input value={form.code} disabled={editing} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
            </div>
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Currency</Label>
              <Input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} />
            </div>
            <div>
              <Label>Multiplier</Label>
              <Input type="number" step="0.01" value={form.multiplier} onChange={e => setForm({ ...form, multiplier: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Save</Button>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/regions')}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function RegionDetail() {
  const { code } = useParams();
  const navigate = useNavigate();
  const r = db.getRegion(String(code));
  if (!r) return <div>Region not found.</div>;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{r.name} ({r.code})</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/admin/regions/${r.code}/edit`)}>Edit</Button>
          <Button variant="destructive" onClick={() => { db.deleteRegion(r.code); navigate('/admin/regions'); }}>Delete</Button>
        </div>
      </div>
      <Card>
        <CardContent className="space-y-2">
          <div><strong>Currency:</strong> {r.currency}</div>
          <div><strong>Multiplier:</strong> {r.multiplier.toFixed(2)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
