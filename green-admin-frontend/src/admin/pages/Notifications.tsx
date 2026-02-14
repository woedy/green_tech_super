import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { adminApi } from '../api';
import type { NotificationTemplateResponse } from '../types/api';

export default function Notifications() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<NotificationTemplateResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await adminApi.listNotificationTemplates();
        if (!cancelled) {
          // Ensure data is an array
          if (Array.isArray(data)) {
            setTemplates(data);
            setError(null);
          } else {
            console.error('API returned non-array response:', data);
            setTemplates([]);
            setError('Invalid response format from server.');
          }
        }
      } catch (err) {
        console.error('Failed to load templates', err);
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : 'Unable to load templates.';
          setError(errorMessage);
          setTemplates([]);
        }
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
        <h2 className="text-xl font-semibold">Notification Templates</h2>
        <Button onClick={() => navigate('/admin/notifications/new')}>New Template</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Templates</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-6 text-sm text-muted-foreground">Loading templates…</div>
          ) : error ? (
            <div className="py-6 text-sm text-destructive">{error}</div>
          ) : !Array.isArray(templates) || templates.length === 0 ? (
            <div className="py-6 text-sm text-muted-foreground">No templates found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow
                    key={template.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/admin/notifications/${template.id}`)}
                  >
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell className="uppercase">{template.notification_type}</TableCell>
                    <TableCell>{template.is_active ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{new Date(template.updated_at).toLocaleDateString()}</TableCell>
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
