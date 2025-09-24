import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { db } from '../data/db';
import type { NotificationTemplate } from '../types';
import { useEffect, useState } from 'react';

export function TemplateForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState<NotificationTemplate>({ id: '', channel: 'email', name: '', updatedAt: new Date().toISOString().slice(0,10), body: '' });

  useEffect(() => {
    if (editing) {
      const t = db.getTemplate(String(id));
      if (t) setForm(t);
    }
  }, [id]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id) return;
    form.updatedAt = new Date().toISOString().slice(0,10);
    db.upsertTemplate(form);
    navigate(`/admin/notifications/${form.id}`);
  };

  return (
    <Card>
      <CardHeader><CardTitle>{editing ? 'Edit Template' : 'New Template'}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3 max-w-2xl">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>ID (slug)</Label>
              <Input value={form.id} disabled={editing} onChange={e => setForm({ ...form, id: e.target.value })} required />
            </div>
            <div>
              <Label>Channel</Label>
              <Input value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value as any })} />
            </div>
          </div>
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <Label>Body</Label>
            <Textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={8} />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Save</Button>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/notifications')}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function TemplateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const t = db.getTemplate(String(id));
  if (!t) return <div>Template not found.</div>;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t.name}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/admin/notifications/${t.id}/edit`)}>Edit</Button>
          <Button variant="destructive" onClick={() => { db.deleteTemplate(t.id); navigate('/admin/notifications'); }}>Delete</Button>
        </div>
      </div>
      <Card>
        <CardContent className="space-y-2">
          <div><strong>ID:</strong> {t.id}</div>
          <div><strong>Channel:</strong> {t.channel.toUpperCase()}</div>
          <div><strong>Last Updated:</strong> {t.updatedAt}</div>
          <div>
            <strong>Body:</strong>
            <pre className="mt-2 p-3 bg-muted rounded text-sm whitespace-pre-wrap">{t.body || '—'}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
