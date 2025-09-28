import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { adminApi } from '../api';
import type { SiteDocumentResponse } from '../types/api';

export default function SiteContent() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<SiteDocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await adminApi.listSiteDocuments();
        if (!cancelled) {
          setDocuments(data);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load site documents', err);
        if (!cancelled) setError('Unable to load documents.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Site Content</h2>
        <Button onClick={() => navigate('/admin/content/new')}>New Document</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-6 text-sm text-muted-foreground">Loading documents…</div>
          ) : error ? (
            <div className="py-6 text-sm text-destructive">{error}</div>
          ) : documents.length === 0 ? (
            <div className="py-6 text-sm text-muted-foreground">No documents yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Version</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow
                    key={doc.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/admin/content/${doc.id}`)}
                  >
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell className="capitalize">{doc.category}</TableCell>
                    <TableCell>
                      {doc.current_version
                        ? `v${doc.current_version.version} • ${doc.current_version.status}`
                        : '—'}
                    </TableCell>
                    <TableCell>{new Date(doc.updated_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
