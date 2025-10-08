import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adminApi } from '../api';
import { db } from '../data/db';
import BulkPropertyUpload from '../components/BulkPropertyUpload';
import type { PropertyResponse } from '../types/api';
import type { Property } from '../types';

export default function Properties() {
  const navigate = useNavigate();
  const [items, setItems] = useState<PropertyResponse[]>([]);
  const [localProperties, setLocalProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        
        // Try to load from API first, fallback to local data
        try {
          const response = await adminApi.listProperties();
          if (!cancelled) {
            setItems(response);
            setError(null);
          }
        } catch (apiError) {
          // Fallback to local data
          const localData = db.listProperties();
          if (!cancelled) {
            setLocalProperties(localData);
            setError(null);
          }
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

  const handleBulkUploadComplete = () => {
    // Refresh local properties after bulk upload
    setLocalProperties(db.listProperties());
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'Live': 'default',
      'Draft': 'secondary',
      'Sold': 'destructive',
      'Rented': 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Property Management</h2>
        <Button onClick={() => navigate('/admin/properties/new')}>New Property</Button>
      </div>

      <Tabs defaultValue="listings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="listings">Property Listings</TabsTrigger>
          <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                All Properties ({items.length || localProperties.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-6 text-sm text-muted-foreground">Loading properties…</div>
              ) : error ? (
                <div className="py-6 text-sm text-destructive">{error}</div>
              ) : (items.length === 0 && localProperties.length === 0) ? (
                <div className="py-6 text-sm text-muted-foreground">No listings found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Bedrooms</TableHead>
                      <TableHead>Sustainability Score</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* API Properties */}
                    {items.map((property) => (
                      <TableRow
                        key={`api-${property.id}`}
                        className="cursor-pointer"
                        onClick={() => navigate(`/admin/properties/${property.id}`)}
                      >
                        <TableCell className="font-medium">{property.title}</TableCell>
                        <TableCell>{Number(property.price).toLocaleString()} {property.currency}</TableCell>
                        <TableCell>{getStatusBadge(property.status)}</TableCell>
                        <TableCell>{property.region}</TableCell>
                        <TableCell>{property.bedrooms || 'N/A'}</TableCell>
                        <TableCell>
                          {property.sustainability_score ? (
                            <Badge variant="outline">
                              {property.sustainability_score}/100
                            </Badge>
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell>{formatDate(property.created_at)}</TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Local Properties */}
                    {localProperties.map((property) => (
                      <TableRow
                        key={`local-${property.id}`}
                        className="cursor-pointer"
                        onClick={() => navigate(`/admin/properties/${property.id}`)}
                      >
                        <TableCell className="font-medium">{property.title}</TableCell>
                        <TableCell>
                          {property.price.toLocaleString()} {property.currency || 'GHS'}
                        </TableCell>
                        <TableCell>{getStatusBadge(property.status)}</TableCell>
                        <TableCell>{property.region || property.location}</TableCell>
                        <TableCell>{property.bedrooms || 'N/A'}</TableCell>
                        <TableCell>
                          {property.sustainability_score ? (
                            <Badge variant="outline">
                              {property.sustainability_score}/100
                            </Badge>
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell>{formatDate(property.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk-upload">
          <BulkPropertyUpload onUploadComplete={handleBulkUploadComplete} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
