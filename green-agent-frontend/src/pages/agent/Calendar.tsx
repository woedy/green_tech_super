import AgentShell from "@/components/layout/AgentShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar as CalendarCmp } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EVENTS } from "@/mocks/agent";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

type Ev = { id: string; title: string; when: string; location: string };

const Calendar = () => {
  const [upcoming, setUpcoming] = useState<Ev[]>([...EVENTS]);
  const [newEvent, setNewEvent] = useState<Ev>({ id: '', title: '', when: new Date().toISOString().slice(0,16).replace('T',' '), location: '' });
  const [date, setDate] = useState<Date | undefined>(new Date());

  const monthEvents = useMemo(() => {
    const all = [...upcoming];
    const map = new Map<string, Ev[]>();
    all.forEach(e => { const d = e.when.split(' ')[0]; map.set(d, [...(map.get(d) ?? []), e]); });
    return map;
  }, [upcoming]);

  const addEvent = () => {
    const id = `EV-${Math.floor(Math.random()*900+100)}`;
    setUpcoming([{ ...newEvent, id }, ...upcoming]);
  };

  const colorDot = (title: string) => {
    if (/site/i.test(title)) return <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"/>;
    if (/call|meeting/i.test(title)) return <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"/>;
    if (/permit|inspection/i.test(title)) return <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-2"/>;
    return <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground mr-2"/>;
  };

  const linkFor = (title: string) => {
    if (/Urban Duplex/i.test(title)) return "/projects/PRJ-88";
    return "/leads";
  };

  return (
    <AgentShell>
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Calendar</h1>
          <Dialog>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Event</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Event (demo)</DialogTitle></DialogHeader>
              <div className="grid gap-2">
                <Input placeholder="Title" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} />
                <Input placeholder="When (YYYY-MM-DD HH:mm)" value={newEvent.when} onChange={(e) => setNewEvent({ ...newEvent, when: e.target.value })} />
                <Input placeholder="Location" value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} />
                <Button onClick={addEvent}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="list" className="space-y-6">
            <TabsList>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
            <TabsContent value="list">
              <Card><CardHeader><CardTitle>Events</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {upcoming.map(e => (
                    <div key={e.id} className="p-3 bg-muted/30 rounded-md flex items-center justify-between">
                      <div>
                        <div className="font-medium flex items-center">{colorDot(e.title)}{e.title}</div>
                        <div className="text-muted-foreground">{e.when} • {e.location}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm"><Link to={linkFor(e.title)}>Open</Link></Button>
                        <Button variant="outline" size="sm">Details</Button>
                      </div>
                    </div>
                  ))}
                </CardContent></Card>
            </TabsContent>
            <TabsContent value="month">
              <Card>
                <CardContent className="p-4">
                  <CalendarCmp mode="single" selected={date} onSelect={setDate} className="rounded-md border inline-block" />
                  <div className="mt-4 space-y-2 text-sm">
                    {date && (
                      <>
                        <div className="font-medium">Events on {date.toISOString().slice(0,10)}</div>
                        {(monthEvents.get(date.toISOString().slice(0,10)) ?? []).map((e) => (
                          <div key={e.id} className="p-2 rounded-md bg-muted/30 flex items-center justify-between">
                            <div className="flex items-center">{colorDot(e.title)}{e.title} • {e.when.split(' ')[1]} • {e.location}</div>
                            <Button asChild variant="outline" size="xs"><Link to={linkFor(e.title)}>Open</Link></Button>
                          </div>
                        ))}
                        {(monthEvents.get(date.toISOString().slice(0,10)) ?? []).length === 0 && (
                          <div className="text-muted-foreground">No events for this day.</div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </AgentShell>
  );
};

export default Calendar;
