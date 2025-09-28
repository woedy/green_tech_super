import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { adminApi } from '../api';
import type { RegionResponse } from '../types/api';

export default function Regions() {
  const navigate = useNavigate();
  const [items, setItems] = useState<RegionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const response = await adminApi.listRegions();
        if (!cancelled) {
          setItems(response);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load regions', err);
        if (!cancelled) setError('Unable to load regions.');
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
        <h2 className="text-xl font-semibold">Regions</h2>
        <Button onClick={() => navigate('/admin/regions/new')}>Add Region</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Pricing Multipliers</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-6 text-sm text-muted-foreground">Loading regions…</div>
          ) : error ? (
            <div className="py-6 text-sm text-destructive">{error}</div>
          ) : items.length === 0 ? (
            <div className="py-6 text-sm text-muted-foreground">No regions configured.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slug</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Multiplier</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((region) => (
                  <TableRow
                    key={region.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/admin/regions/${region.id}`)}
                  >
                    <TableCell className="font-medium">{region.slug}</TableCell>
                    <TableCell>{region.name}</TableCell>
                    <TableCell>{region.country}</TableCell>
                    <TableCell>{region.currency_code}</TableCell>
                    <TableCell>{Number(region.cost_multiplier).toFixed(2)}</TableCell>
                    <TableCell>{region.is_active ? 'Active' : 'Inactive'}</TableCell>
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
