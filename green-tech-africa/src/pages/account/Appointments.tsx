import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { appointmentsApi, type ViewingAppointment } from "@/lib/api";
import { Loader2 } from "lucide-react";

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const locationText = (a: ViewingAppointment) => {
  return [a.city, a.region, a.country].filter(Boolean).join(", ");
};

const Appointments = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.list(),
  });

  const items = data?.results ?? [];
  const now = new Date();
  const upcoming = items.filter((a) => new Date(a.scheduled_for) >= now);
  const past = items.filter((a) => new Date(a.scheduled_for) < now);

  return (
    <Layout>
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-6 h-6" />
            <h1 className="text-2xl md:text-3xl font-bold">Appointments</h1>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-medium">
            <CardHeader><CardTitle>Upcoming</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading appointments...
                </div>
              )}
              {!isLoading && error && (
                <div className="text-sm text-destructive">{(error as any)?.message || 'Unable to load appointments.'}</div>
              )}
              {!isLoading && !error && upcoming.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30 text-sm">
                  <div>
                    <div className="font-medium">{a.property_title}</div>
                    <div className="text-muted-foreground">{formatDateTime(a.scheduled_for)} • {locationText(a)}</div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/account/appointments/${a.id}`}>Details</Link>
                  </Button>
                </div>
              ))}
              {!isLoading && !error && upcoming.length === 0 && (
                <div className="text-sm text-muted-foreground">No upcoming appointments.</div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader><CardTitle>Past</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {!isLoading && !error && past.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30 text-sm">
                  <div>
                    <div className="font-medium">{a.property_title}</div>
                    <div className="text-muted-foreground">{formatDateTime(a.scheduled_for)} • {locationText(a)}</div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/account/appointments/${a.id}`}>Details</Link>
                  </Button>
                </div>
              ))}
              {!isLoading && !error && past.length === 0 && (
                <div className="text-sm text-muted-foreground">No past appointments.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default Appointments;

