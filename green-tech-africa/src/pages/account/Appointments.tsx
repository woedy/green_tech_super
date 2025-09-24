import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";

const UPCOMING = [
  { id: "APT-301", title: "Site viewing - Riverside Estate", when: "2025-03-15 10:00", location: "Nairobi" },
  { id: "APT-302", title: "PM call - Urban Duplex A2", when: "2025-03-17 14:00", location: "Online" },
];

const PAST = [
  { id: "APT-299", title: "Agent call - Quote QUO-551", when: "2025-03-02 09:00", location: "Online" },
];

const Appointments = () => {
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
              {UPCOMING.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30 text-sm">
                  <div>
                    <div className="font-medium">{a.title}</div>
                    <div className="text-muted-foreground">{a.when} • {a.location}</div>
                  </div>
                  <Button variant="outline" size="sm">Details</Button>
                </div>
              ))}
              {UPCOMING.length === 0 && (
                <div className="text-sm text-muted-foreground">No upcoming appointments.</div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader><CardTitle>Past</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {PAST.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30 text-sm">
                  <div>
                    <div className="font-medium">{a.title}</div>
                    <div className="text-muted-foreground">{a.when} • {a.location}</div>
                  </div>
                  <Button variant="outline" size="sm">Notes</Button>
                </div>
              ))}
              {PAST.length === 0 && (
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

