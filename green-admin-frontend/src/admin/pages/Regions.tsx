import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '../data/db';
import { useNavigate } from 'react-router-dom';

export default function Regions() {
  const navigate = useNavigate();
  const regions = db.listRegions();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Regions</h2>
        <Button onClick={() => navigate('/admin/regions/new')}>Add Region</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Pricing Multipliers</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Multiplier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regions.map(r => (
                <TableRow key={r.code} className="cursor-pointer" onClick={() => navigate(`/admin/regions/${r.code}`)}>
                  <TableCell className="font-medium">{r.code}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.currency}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input defaultValue={r.multiplier.toFixed(2)} className="w-24" readOnly />
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/admin/regions/${r.code}/edit`); }}>Edit</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
