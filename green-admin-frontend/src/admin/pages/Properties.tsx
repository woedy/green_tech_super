import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '../data/db';
import { useNavigate } from 'react-router-dom';

export default function Properties() {
  const navigate = useNavigate();
  const data = db.listProperties();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Properties</h2>
        <Button onClick={() => navigate('/admin/properties/new')}>New Property</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Listings</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(l => (
                <TableRow key={l.id} className="cursor-pointer" onClick={() => navigate(`/admin/properties/${l.id}`)}>
                  <TableCell className="font-medium">{l.title}</TableCell>
                  <TableCell>${'{'}l.price.toLocaleString(){'}'}</TableCell>
                  <TableCell>{l.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
