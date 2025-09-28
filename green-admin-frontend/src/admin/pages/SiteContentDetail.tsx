import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { adminApi } from '../api';
import type { SiteDocumentPayload, SiteDocumentResponse, SiteDocumentVersionPayload, SiteDocumentVersionResponse } from '../types/api';

interface DocumentFormState {
  title: string;
  slug: string;
  category: string;
  description: string;
}

const defaultDocForm: DocumentFormState = {
  title: '',
  slug: '',
  category: 'legal',
  description: '',
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function toDocumentPayload(form: DocumentFormState): SiteDocumentPayload {
  return {
    title: form.title,
    slug: form.slug || slugify(form.title),
    category: form.category,
    description: form.description,
  };
}

function fillDocumentForm(doc: SiteDocumentResponse | null): DocumentFormState {
  if (!doc) return { ...defaultDocForm };
  return {
    title: doc.title,
    slug: doc.slug,
    category: doc.category,
    description: doc.description,
  };
}

interface VersionFormState {
  title: string;
  summary: string;
  body: string;
  previewUrl: string;
  notes: string;
  status: string;
}

const defaultVersionForm: VersionFormState = {
  title: '',
  summary: '',
  body: '',
  previewUrl: '',
  notes: '',
  status: 'draft',
};

function toVersionPayload(documentId: number, form: VersionFormState): SiteDocumentVersionPayload {
  return {
    document: documentId,
    title: form.title || `Draft ${new Date().toISOString()}`,
    summary: form.summary,
    body: form.body,
    preview_url: form.previewUrl || undefined,
    notes: form.notes || undefined,
    status: form.status,
  };
}

export function SiteDocumentForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState<DocumentFormState>({ ...defaultDocForm });
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const doc = await adminApi.getSiteDocument(Number(id));
        if (!cancelled) {
          setForm(fillDocumentForm(doc));
        }
      } catch (err) {
        console.error('Failed to load document', err);
        if (!cancelled) setError('Unable to load document.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [editing, id]);

  const handleChange = (patch: Partial<DocumentFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title) {
      setError('Title is required.');
      return;
    }
    try {
      setSaving(true);
      const payload = toDocumentPayload(form);
      const response = editing
        ? await adminApi.updateSiteDocument(Number(id), payload)
        : await adminApi.createSiteDocument(payload);
      navigate(`/admin/content/${response.id}`);
    } catch (err) {
      console.error('Failed to save document', err);
      setError('Unable to save document. Please review the data and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-6 text-sm text-muted-foreground">Loading document…</div>;
  }

  return (
    <Card>
      <CardHeader><CardTitle>{editing ? 'Edit Document' : 'New Document'}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3 max-w-2xl">
          {error && <div className="text-sm text-destructive">{error}</div>}
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => handleChange({ title: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => handleChange({ slug: slugify(e.target.value) })} placeholder="auto-generated" />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => handleChange({ category: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => handleChange({ description: e.target.value })} rows={3} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/content')} disabled={saving}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function SiteDocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const documentId = useMemo(() => Number(id), [id]);
  const [document, setDocument] = useState<SiteDocumentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [versionForm, setVersionForm] = useState<VersionFormState>({ ...defaultVersionForm });
  const [creatingVersion, setCreatingVersion] = useState(false);

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getSiteDocument(documentId);
      setDocument(data);
      setError(null);
    } catch (err) {
      console.error('Failed to refresh document', err);
      setError('Unable to load document.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Number.isNaN(documentId)) return;
    refresh();
  }, [documentId]);

  const remove = async () => {
    if (!document) return;
    if (!confirm('Delete this document?')) return;
    try {
      await adminApi.deleteSiteDocument(document.id);
      navigate('/admin/content');
    } catch (err) {
      console.error('Failed to delete document', err);
      setError('Unable to delete document.');
    }
  };

  const createVersion = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!document) return;
    try {
      setCreatingVersion(true);
      const payload = toVersionPayload(document.id, versionForm);
      await adminApi.createSiteDocumentVersion(payload);
      setVersionForm({ ...defaultVersionForm });
      refresh();
    } catch (err) {
      console.error('Failed to create version', err);
      setError('Unable to create version.');
    } finally {
      setCreatingVersion(false);
    }
  };

  const publishVersion = async (version: SiteDocumentVersionResponse) => {
    try {
      await adminApi.publishSiteDocumentVersion(version.id);
      refresh();
    } catch (err) {
      console.error('Failed to publish version', err);
      setError('Unable to publish version.');
    }
  };

  const archiveVersion = async (version: SiteDocumentVersionResponse) => {
    try {
      await adminApi.archiveSiteDocumentVersion(version.id);
      refresh();
    } catch (err) {
      console.error('Failed to archive version', err);
      setError('Unable to archive version.');
    }
  };

  if (loading) {
    return <div className="py-6 text-sm text-muted-foreground">Loading document…</div>;
  }
  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }
  if (!document) return <div>Document not found.</div>;

  const currentVersion = document.current_version;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{document.title}</h2>
          <p className="text-sm text-muted-foreground">Slug: {document.slug}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/admin/content/${document.id}/edit`)}>Edit</Button>
          <Button variant="destructive" onClick={remove}>Delete</Button>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>Document Overview</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><strong>Category:</strong> {document.category}</div>
          <div><strong>Description:</strong> {document.description || '-'}</div>
          <div><strong>Current Version:</strong> {currentVersion ? `v${currentVersion.version} (${currentVersion.status})` : 'None'}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Create New Version</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={createVersion} className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Title</Label>
                <Input value={versionForm.title} onChange={(e) => setVersionForm((prev) => ({ ...prev, title: e.target.value }))} />
              </div>
              <div>
                <Label>Status</Label>
                <Input value={versionForm.status} onChange={(e) => setVersionForm((prev) => ({ ...prev, status: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Summary</Label>
              <Textarea value={versionForm.summary} onChange={(e) => setVersionForm((prev) => ({ ...prev, summary: e.target.value }))} rows={2} />
            </div>
            <div>
              <Label>Body</Label>
              <Textarea value={versionForm.body} onChange={(e) => setVersionForm((prev) => ({ ...prev, body: e.target.value }))} rows={6} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Preview URL</Label>
                <Input value={versionForm.previewUrl} onChange={(e) => setVersionForm((prev) => ({ ...prev, previewUrl: e.target.value }))} />
              </div>
              <div>
                <Label>Notes</Label>
                <Input value={versionForm.notes} onChange={(e) => setVersionForm((prev) => ({ ...prev, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={creatingVersion}>{creatingVersion ? 'Creating…' : 'Create Version'}</Button>
              <Button type="button" variant="outline" onClick={() => setVersionForm({ ...defaultVersionForm })} disabled={creatingVersion}>Reset</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Version History</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {document.versions.length === 0 ? (
            <div className="text-sm text-muted-foreground">No versions yet.</div>
          ) : (
            document.versions.map((version) => (
              <div key={version.id} className="border rounded-md p-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Version {version.version} • {version.status}</div>
                  <div className="flex gap-2">
                    {version.status !== 'published' && (
                      <Button size="sm" variant="outline" onClick={() => publishVersion(version)}>Publish</Button>
                    )}
                    {version.status === 'published' && (
                      <Button size="sm" variant="outline" onClick={() => archiveVersion(version)}>Archive</Button>
                    )}
                  </div>
                </div>
                <div><strong>Title:</strong> {version.title}</div>
                <div><strong>Summary:</strong> {version.summary || '-'}</div>
                <div><strong>Notes:</strong> {version.notes || '-'}</div>
                <div><strong>Created:</strong> {new Date(version.created_at).toLocaleString()}</div>
                <div>
                  <strong>Body Preview:</strong>
                  <pre className="mt-2 bg-muted rounded p-3 whitespace-pre-wrap max-h-40 overflow-auto">{version.body}</pre>
                </div>
                {version.preview_url && (
                  <div><strong>Preview URL:</strong> {version.preview_url}</div>
                )}
                <Separator />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
