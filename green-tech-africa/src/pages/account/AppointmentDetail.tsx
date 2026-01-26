import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, Calendar as CalendarIcon, MapPin } from "lucide-react";
import { appointmentsApi, type ViewingAppointmentDetail } from "@/lib/api";

const badgeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  confirmed: 'default',
  completed: 'outline',
  cancelled: 'destructive',
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const AppointmentDetail = () => {
  const { id } = useParams();

  const { data, isLoading, error } = useQuery<ViewingAppointmentDetail>({
    queryKey: ['appointments', 'detail', id],
    queryFn: () => appointmentsApi.get(id as string),
    enabled: !!id,
  });

  const status = (data?.status || '').toLowerCase();
  const variant = badgeVariant[status] ?? 'secondary';

  const locationText = useMemo(() => {
    if (!data) return '';
    return [data.city, data.region, data.country].filter(Boolean).join(', ');
  }, [data]);

  return (
    <Layout>
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold">Appointment</h1>
            {data && (
              <div className="flex items-center gap-2">
                <Badge variant={variant} className="capitalize">{status.replace(/_/g, ' ')}</Badge>
                <span className="text-sm text-muted-foreground">{data.property_title}</span>
              </div>
            )}
          </div>
          <Button variant="outline" asChild>
            <Link to="/account/appointments">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Link>
          </Button>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading && (
            <Card>
              <CardContent className="p-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading appointment...
              </CardContent>
            </Card>
          )}

          {!isLoading && (error || !data) && (
            <Card>
              <CardContent className="p-6 text-sm">
                <div className="font-medium text-destructive">Unable to load appointment</div>
                <div className="text-muted-foreground">{(error as any)?.message || 'Please try again.'}</div>
              </CardContent>
            </Card>
          )}

          {data && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarIcon className="h-4 w-4" /> Scheduled
                    </div>
                    <div className="font-medium">{formatDateTime(data.scheduled_for)}</div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" /> Location
                    </div>
                    <div className="font-medium">{locationText || '—'}</div>
                  </div>

                  <Separator />

                  <div className="space-y-1">
                    <div className="text-muted-foreground">Notes</div>
                    <div>{data.notes || 'No notes added yet.'}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Property</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {data.property_image && (
                    <img src={data.property_image} alt={data.property_title} className="w-full h-40 object-cover rounded-md" />
                  )}
                  <div className="font-medium">{data.property_title}</div>
                  <div className="text-muted-foreground">{locationText}</div>
                  <Button variant="outline" asChild className="w-full">
                    <Link to={`/properties/${data.property_slug}`}>View property</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default AppointmentDetail;
