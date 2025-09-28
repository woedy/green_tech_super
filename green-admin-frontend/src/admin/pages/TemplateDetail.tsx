import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { adminApi } from '../api';
import type { NotificationTemplatePayload, NotificationTemplateResponse } from '../types/api';

interface TemplateFormState {
  name: string;
  subject: string;
  notificationType: string;
  template: string;
  isActive: boolean;
}

const defaultForm: TemplateFormState = {
  name: '',
  subject: '',
  notificationType: 'email',
  template: '',
  isActive: true,
};

function toPayload(form: TemplateFormState): NotificationTemplatePayload {
  return {
    name: form.name,
    subject: form.subject,
    notification_type: form.notificationType,
    template: form.template,
    is_active: form.isActive,
  };
}

function fillForm(template: NotificationTemplateResponse | null): TemplateFormState {
  if (!template) return { ...defaultForm };
  return {
    name: template.name,
    subject: template.subject,
    notificationType: template.notification_type,
    template: template.template,
    isActive: template.is_active,
  };
}

export function TemplateForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState<TemplateFormState>({ ...defaultForm });
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const template = await adminApi.getNotificationTemplate(String(id));
        if (!cancelled) {
          setForm(fillForm(template));
        }
      } catch (err) {
        console.error('Failed to load template', err);
        if (!cancelled) setError('Unable to load template.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [editing, id]);

  const handleChange = (patch: Partial<TemplateFormState>) => {
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
        ? await adminApi.upsertNotificationTemplate(String(id), payload)
        : await adminApi.upsertNotificationTemplate(null, payload);
      navigate(`/admin/notifications/${response.id}`);
    } catch (err) {
      console.error('Failed to save template', err);
      setError('Unable to save template. Please review the data and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-6 text-sm text-muted-foreground">Loading template…</div>;
  }

  return (
    <Card>
      <CardHeader><CardTitle>{editing ? 'Edit Template' : 'New Template'}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3 max-w-2xl">
          {error && <div className="text-sm text-destructive">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => handleChange({ name: e.target.value })} required />
            </div>
            <div>
              <Label>Channel</Label>
              <Input value={form.notificationType} onChange={(e) => handleChange({ notificationType: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Subject</Label>
            <Input value={form.subject} onChange={(e) => handleChange({ subject: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.isActive} onCheckedChange={(checked) => handleChange({ isActive: checked })} />
            <span className="text-sm">Active</span>
          </div>
          <div>
            <Label>Template Body</Label>
            <Textarea value={form.template} onChange={(e) => handleChange({ template: e.target.value })} rows={10} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/notifications')} disabled={saving}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function TemplateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const templateId = useMemo(() => String(id ?? ''), [id]);
  const [template, setTemplate] = useState<NotificationTemplateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await adminApi.getNotificationTemplate(templateId);
        if (!cancelled) {
          setTemplate(data);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load template', err);
        if (!cancelled) setError('Unable to load template.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (templateId) {
      load();
    }
    return () => {
      cancelled = true;
    };
  }, [templateId]);

  const remove = async () => {
    if (!templateId) return;
    if (!confirm('Delete this template?')) return;
    try {
      await adminApi.deleteNotificationTemplate(templateId);
      navigate('/admin/notifications');
    } catch (err) {
      console.error('Failed to delete template', err);
      setError('Unable to delete template.');
    }
  };

  if (loading) {
    return <div className="py-6 text-sm text-muted-foreground">Loading template…</div>;
  }
  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }
  if (!template) return <div>Template not found.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{template.name}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/admin/notifications/${template.id}/edit`)}>Edit</Button>
          <Button variant="destructive" onClick={remove}>Delete</Button>
        </div>
      </div>
      <Card>
        <CardContent className="space-y-2 text-sm">
          <div><strong>Channel:</strong> {template.notification_type.toUpperCase()}</div>
          <div><strong>Subject:</strong> {template.subject}</div>
          <div><strong>Active:</strong> {template.is_active ? 'Yes' : 'No'}</div>
          <div><strong>Updated:</strong> {new Date(template.updated_at).toLocaleString()}</div>
          <div>
            <strong>Body:</strong>
            <pre className="mt-2 p-3 bg-muted rounded text-sm whitespace-pre-wrap">{template.template || '-'}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
