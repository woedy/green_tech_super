import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminApi } from '../api';
import type { PlanResponse } from '../types/api';

export default function Plans() {
  const navigate = useNavigate();
  const [items, setItems] = useState<PlanResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const response = await adminApi.listPlans();
        if (!cancelled) {
          setItems(response);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load plans', err);
        if (!cancelled) {
          setError('Unable to load plans. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
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
        <h2 className="text-xl font-semibold">Plans</h2>
        <Button onClick={() => navigate('/admin/plans/new')}>New Plan</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Plans Catalog</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-6 text-sm text-muted-foreground">Loading plans…</div>
          ) : error ? (
            <div className="py-6 text-sm text-destructive">{error}</div>
          ) : items.length === 0 ? (
            <div className="py-6 text-sm text-muted-foreground">No plans found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Style</TableHead>
                  <TableHead>Beds</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((plan) => (
                  <TableRow
                    key={plan.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/admin/plans/${plan.id}`)}
                  >
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>{plan.style}</TableCell>
                    <TableCell>{plan.bedrooms}</TableCell>
                    <TableCell>{Number(plan.base_price).toLocaleString()}</TableCell>
                    <TableCell>{plan.is_published ? 'Published' : 'Draft'}</TableCell>
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
