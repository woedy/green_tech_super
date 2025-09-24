import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { db } from '../data/db';
import type { User } from '../types';
import { useEffect, useState } from 'react';

export function UserForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState<Partial<User>>({ name: '', email: '', role: 'agent', active: true });

  useEffect(() => {
    if (editing) {
      const u = db.getUser(Number(id));
      if (u) setForm(u);
    }
  }, [id]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    if (editing) {
      db.updateUser(Number(id), form as any);
      navigate(`/admin/users/${id}`);
    } else {
      const created = db.createUser({ name: String(form.name), email: String(form.email), role: (form.role as any) || 'agent', active: Boolean(form.active) });
      navigate(`/admin/users/${created.id}`);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>{editing ? 'Edit User' : 'New User'}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3 max-w-xl">
          <div>
            <Label>Name</Label>
            <Input value={form.name as any} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email as any} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <Label>Role</Label>
            <Input value={form.role as any} onChange={e => setForm({ ...form, role: e.target.value as any })} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={!!form.active} onCheckedChange={v => setForm({ ...form, active: v })} />
            <Label>Active</Label>
          </div>
          <div className="flex gap-2">
            <Button type="submit">{editing ? 'Save' : 'Create'}</Button>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/users')}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const u = db.getUser(Number(id));
  if (!u) return <div>User not found.</div>;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{u.name}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/admin/users/${u.id}/edit`)}>Edit</Button>
          <Button variant="destructive" onClick={() => { db.deleteUser(u.id); navigate('/admin/users'); }}>Delete</Button>
        </div>
      </div>
      <Card>
        <CardContent className="space-y-2">
          <div><strong>Email:</strong> {u.email}</div>
          <div><strong>Role:</strong> {u.role}</div>
          <div><strong>Active:</strong> {u.active ? 'Yes' : 'No'}</div>
        </CardContent>
      </Card>
    </div>
  );
}
