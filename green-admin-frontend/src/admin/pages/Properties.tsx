import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminApi } from '../api';
import type { PropertyResponse } from '../types/api';

export default function Properties() {
  const navigate = useNavigate();
  const [items, setItems] = useState<PropertyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const response = await adminApi.listProperties();
        if (!cancelled) {
          setItems(response);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load properties', err);
        if (!cancelled) {
          setError('Unable to load properties. Please try again.');
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
        <h2 className="text-xl font-semibold">Properties</h2>
        <Button onClick={() => navigate('/admin/properties/new')}>New Property</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Listings</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-6 text-sm text-muted-foreground">Loading properties…</div>
          ) : error ? (
            <div className="py-6 text-sm text-destructive">{error}</div>
          ) : items.length === 0 ? (
            <div className="py-6 text-sm text-muted-foreground">No listings found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Region</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((property) => (
                  <TableRow
                    key={property.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/admin/properties/${property.id}`)}
                  >
                    <TableCell className="font-medium">{property.title}</TableCell>
                    <TableCell>{Number(property.price).toLocaleString()} {property.currency}</TableCell>
                    <TableCell className="capitalize">{property.status.replace('_', ' ')}</TableCell>
                    <TableCell>{property.region}</TableCell>
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
