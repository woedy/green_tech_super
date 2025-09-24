import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ClipboardList, Plus, Filter } from "lucide-react";
import { Link } from "react-router-dom";

type RequestItem = {
  id: string;
  planName: string;
  region: string;
  submittedAt: string;
  status: "new" | "in_review" | "quoted" | "closed";
};

const ALL_REQUESTS: RequestItem[] = [
  { id: "REQ-1024", planName: "Green Valley Villa", region: "KE-Nairobi", submittedAt: "2025-03-10", status: "in_review" },
  { id: "REQ-1023", planName: "Urban Duplex A2", region: "NG-Lagos", submittedAt: "2025-03-08", status: "new" },
  { id: "REQ-1017", planName: "Eco Bungalow S1", region: "GH-Accra", submittedAt: "2025-03-01", status: "quoted" },
];

const statusLabel = (s: RequestItem["status"]) => {
  switch (s) {
    case "new":
      return { label: "New", variant: "outline" as const };
    case "in_review":
      return { label: "In Review", variant: "secondary" as const };
    case "quoted":
      return { label: "Quoted", variant: "default" as const };
    case "closed":
      return { label: "Closed", variant: "secondary" as const };
    default:
      return { label: s, variant: "secondary" as const };
  }
};

const Requests = () => {
  const counts = {
    all: ALL_REQUESTS.length,
    new: ALL_REQUESTS.filter((r) => r.status === "new").length,
    in_review: ALL_REQUESTS.filter((r) => r.status === "in_review").length,
    quoted: ALL_REQUESTS.filter((r) => r.status === "quoted").length,
  };

  const renderList = (items: RequestItem[]) => (
    <div className="space-y-3">
      {items.map((r) => (
        <Card key={r.id} className="shadow-soft hover:shadow-medium smooth-transition">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div>
              <div className="font-medium">{r.planName}</div>
              <div className="text-xs text-muted-foreground">{r.id} • {r.region} • {r.submittedAt}</div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={statusLabel(r.status).variant}>{statusLabel(r.status).label}</Badge>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/account/requests/${r.id}`}>Open</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {items.length === 0 && (
        <div className="text-sm text-muted-foreground">No requests found.</div>
      )}
    </div>
  );

  return (
    <Layout>
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-6 h-6" />
              <h1 className="text-2xl md:text-3xl font-bold">Requests to Build</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-1" /> Filters
              </Button>
              <Button variant="hero" size="sm" asChild>
                <Link to="/plans">
                  <Plus className="w-4 h-4 mr-1" /> New Request
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full md:w-auto">
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="new">New ({counts.new})</TabsTrigger>
              <TabsTrigger value="in_review">In Review ({counts.in_review})</TabsTrigger>
              <TabsTrigger value="quoted">Quoted ({counts.quoted})</TabsTrigger>
            </TabsList>
            <TabsContent value="all">{renderList(ALL_REQUESTS)}</TabsContent>
            <TabsContent value="new">{renderList(ALL_REQUESTS.filter((r) => r.status === "new"))}</TabsContent>
            <TabsContent value="in_review">{renderList(ALL_REQUESTS.filter((r) => r.status === "in_review"))}</TabsContent>
            <TabsContent value="quoted">{renderList(ALL_REQUESTS.filter((r) => r.status === "quoted"))}</TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
};

export default Requests;

