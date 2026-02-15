import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ClipboardList, Plus, Filter, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { buildRequestsApi, BuildRequest, constructionRequestsApi, ConstructionRequest } from "@/lib/api";
import { Loader2 } from "lucide-react";

const buildRequestStatusLabel = (status: string) => {
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

const constructionRequestStatusLabel = (status: string) => {
  switch (status) {
    case "DRAFT":
      return { label: "Draft", variant: "secondary" as const };
    case "PENDING":
      return { label: "Pending Approval", variant: "default" as const };
    case "APPROVED":
      return { label: "Approved", variant: "default" as const };
    case "IN_PROGRESS":
      return { label: "In Progress", variant: "default" as const };
    case "ON_HOLD":
      return { label: "On Hold", variant: "outline" as const };
    case "COMPLETED":
      return { label: "Completed", variant: "outline" as const };
    case "CANCELLED":
      return { label: "Cancelled", variant: "destructive" as const };
    default:
      return { label: status, variant: "secondary" as const };
  }
};

const Requests = () => {
  const { data: buildRequestsData, isLoading: buildLoading, error: buildError } = useQuery({
    queryKey: ['build-requests'],
    queryFn: () => buildRequestsApi.list(),
  });

  const { data: constructionRequestsData, isLoading: constructionLoading, error: constructionError } = useQuery({
    queryKey: ['construction-requests'],
    queryFn: () => constructionRequestsApi.getConstructionRequests(),
  });

  const isLoading = buildLoading || constructionLoading;
  const error = buildError || constructionError;

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

  const buildRequests = buildRequestsData?.results || [];
  const constructionRequests = constructionRequestsData?.results || [];

  const counts = {
    build: buildRequests.length,
    construction: constructionRequests.length,
    all: buildRequests.length + constructionRequests.length,
  };

  const renderBuildRequests = (items: BuildRequest[]) => (
    <div className="space-y-3">
      {items.map((request) => (
        <Card key={request.id} className="shadow-soft hover:shadow-medium smooth-transition">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="font-medium">{request.plan_details?.name ?? request.plan}</div>
              <div className="text-xs text-muted-foreground">
                REQ-{String(request.id).slice(0, 8).toUpperCase()} • {request.region_details?.name ?? request.region} • {new Date(request.submitted_at).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={buildRequestStatusLabel((request as any).status).variant}>
                {buildRequestStatusLabel((request as any).status).label}
              </Badge>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/account/requests/${request.id}`}>Open</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No build requests yet.</p>
          <Button variant="link" asChild className="mt-2">
            <Link to="/plans">Browse Plans to Request</Link>
          </Button>
        </div>
      )}
    </div>
  );

  const renderConstructionRequests = (items: ConstructionRequest[]) => (
    <div className="space-y-3">
      {items.map((request) => (
        <Card key={request.id} className="shadow-soft hover:shadow-medium smooth-transition">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="font-medium">{request.title}</div>
              <div className="text-xs text-muted-foreground">
                {request.construction_type_display} • {request.region || request.city} • {new Date(request.created_at).toLocaleDateString()}
              </div>
              {request.budget && (
                <div className="text-xs text-muted-foreground mt-1">
                  Budget: {request.currency} {Number(request.budget).toLocaleString()}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={constructionRequestStatusLabel(request.status).variant}>
                {constructionRequestStatusLabel(request.status).label}
              </Badge>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/account/construction-requests/${request.id}`}>Open</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No construction requests yet.</p>
        </div>
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
              <h1 className="text-2xl md:text-3xl font-bold">My Requests</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/account/construction-requests/new">
                  <Plus className="w-4 h-4 mr-1" /> New Construction Request
                </Link>
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
            <TabsList className="grid grid-cols-3 w-full md:w-auto">
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="build">Build Requests ({counts.build})</TabsTrigger>
              <TabsTrigger value="construction">Construction ({counts.construction})</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <div className="space-y-6">
                {counts.build > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">Build Requests</h3>
                    {renderBuildRequests(buildRequests)}
                  </div>
                )}
                {counts.construction > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">Construction Requests</h3>
                    {renderConstructionRequests(constructionRequests)}
                  </div>
                )}
                {counts.all === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">No requests yet</p>
                    <p className="text-sm mb-4">Start by browsing our building plans</p>
                    <Button variant="hero" asChild>
                      <Link to="/plans">Browse Plans</Link>
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="build">{renderBuildRequests(buildRequests)}</TabsContent>
            <TabsContent value="construction">{renderConstructionRequests(constructionRequests)}</TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
};

export default Requests;

