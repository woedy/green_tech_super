import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { db } from '../data/db';
import { useNavigate } from 'react-router-dom';

export default function Notifications() {
  const navigate = useNavigate();
  const templates = db.listTemplates();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Notification Templates</h2>
        <Button onClick={() => navigate('/admin/notifications/new')}>New Template</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Templates</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map(t => (
                <TableRow key={t.id} className="cursor-pointer" onClick={() => navigate(`/admin/notifications/${t.id}`)}>
                  <TableCell className="font-medium">{t.id}</TableCell>
                  <TableCell>{t.channel.toUpperCase()}</TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.updatedAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
