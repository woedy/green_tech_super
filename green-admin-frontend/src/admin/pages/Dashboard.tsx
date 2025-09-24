import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Kpi = ({ title, value }: { title: string; value: string }) => (
  <Card>
    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{title}</CardTitle></CardHeader>
    <CardContent className="text-2xl font-semibold">{value}</CardContent>
  </Card>
);

export default function Dashboard() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi title="New Leads (7d)" value="32" />
        <Kpi title="Quotes Sent (7d)" value="14" />
        <Kpi title="Projects Active" value="9" />
        <Kpi title="Listings Live" value="128" />
      </div>
      <Card>
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardContent>
          <ul className="text-sm list-disc ml-5 space-y-1">
            <li>Plan "Eco Bungalow" updated by Jane (today)</li>
            <li>New property inquiry assigned to Agent #24</li>
            <li>Region GH multiplier changed 1.12 ? 1.14</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

