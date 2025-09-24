import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';

const leads = [
  { day: 'Mon', value: 5 },
  { day: 'Tue', value: 8 },
  { day: 'Wed', value: 6 },
  { day: 'Thu', value: 10 },
  { day: 'Fri', value: 7 },
  { day: 'Sat', value: 4 },
  { day: 'Sun', value: 3 },
];

const quotes = [
  { month: 'Jan', value: 12 },
  { month: 'Feb', value: 9 },
  { month: 'Mar', value: 14 },
  { month: 'Apr', value: 18 },
];

export default function Analytics() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Leads This Week</CardTitle></CardHeader>
        <CardContent style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={leads}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Quotes Per Month</CardTitle></CardHeader>
        <CardContent style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={quotes}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
