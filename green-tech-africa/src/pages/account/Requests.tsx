import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ClipboardList, Plus, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { buildRequestsApi, BuildRequest } from "@/lib/api";
import { Loader2 } from "lucide-react";

const statusLabel = (status: string) => {
  switch (status) {
    case "new":
      return { label: "New", variant: "secondary" as const };
    case "in_review":
      return { label: "In review", variant: "default" as const };
    case "contacted":
      return { label: "Contacted", variant: "default" as const };
    case "archived":
      return { label: "Archived", variant: "outline" as const };
    default:
      return { label: status, variant: "secondary" as const };
  }
};

const Requests = () => {
  const { data: allRequestsData, isLoading, error } = useQuery({
    queryKey: ['build-requests'],
    queryFn: () => buildRequestsApi.list(),
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading requests...</span>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-red-600">Error loading requests</h2>
            <p className="text-muted-foreground">Please try again later.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const allRequests = allRequestsData?.results || [];

  const counts = {
    all: allRequests.length,
  };

  const renderList = (items: BuildRequest[]) => (
    <div className="space-y-3">
      {items.map((request) => (
        <Card key={request.id} className="shadow-soft hover:shadow-medium smooth-transition">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div>
              <div className="font-medium">{request.plan_details?.name ?? request.plan}</div>
              <div className="text-xs text-muted-foreground">
                REQ-{String(request.id).slice(0, 8).toUpperCase()} • {request.region_details?.name ?? request.region} • {new Date(request.submitted_at).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={statusLabel((request as any).status).variant}>{statusLabel((request as any).status).label}</Badge>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/account/requests/${request.id}`}>Open</Link>
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
                  <Plus className="w-4 h-4 mr-1" /> Browse Plans
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid grid-cols-1 w-full md:w-auto">
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            </TabsList>
            <TabsContent value="all">{renderList(allRequests)}</TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
};

export default Requests;

