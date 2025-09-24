import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '../data/db';
import { useNavigate } from 'react-router-dom';

export default function Plans() {
  const navigate = useNavigate();
  const data = db.listPlans();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Plans</h2>
        <Button onClick={() => navigate('/admin/plans/new')}>New Plan</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Plans Catalog</CardTitle></CardHeader>
        <CardContent>
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
              {data.map(p => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/admin/plans/${p.id}`)}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.style}</TableCell>
                  <TableCell>{p.beds}</TableCell>
                  <TableCell>${'{'}p.basePrice.toLocaleString(){'}'}</TableCell>
                  <TableCell>{p.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
