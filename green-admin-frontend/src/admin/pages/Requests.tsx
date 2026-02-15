import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Search, Filter, Loader2, Building2, FileText } from "lucide-react";
import { adminApi } from "../api";

const buildRequestStatusLabel = (status: string) => {
  const labels: Record<string, { label: string; variant: any }> = {
    new: { label: "New", variant: "default" },
    in_review: { label: "In Review", variant: "secondary" },
    contacted: { label: "Contacted", variant: "secondary" },
    archived: { label: "Archived", variant: "outline" },
  };
  return labels[status] || { label: status, variant: "secondary" };
};

const constructionRequestStatusLabel = (status: string) => {
  const labels: Record<string, { label: string; variant: any }> = {
    DRAFT: { label: "Draft", variant: "secondary" },
    PENDING: { label: "Pending", variant: "default" },
    APPROVED: { label: "Approved", variant: "default" },
    IN_PROGRESS: { label: "In Progress", variant: "default" },
    ON_HOLD: { label: "On Hold", variant: "outline" },
    COMPLETED: { label: "Completed", variant: "outline" },
    CANCELLED: { label: "Cancelled", variant: "destructive" },
  };
  return labels[status] || { label: status, variant: "secondary" };
};

const Requests = () => {
  const [buildRequestStatus, setBuildRequestStatus] = useState<string>("all");
  const [constructionRequestStatus, setConstructionRequestStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: buildRequestsData, isLoading: buildLoading } = useQuery({
    queryKey: ["admin-build-requests", buildRequestStatus, searchTerm],
    queryFn: () =>
      adminApi.requests.buildRequests.list({
        status: buildRequestStatus !== "all" ? buildRequestStatus : undefined,
        search: searchTerm || undefined,
      }),
  });

  const { data: constructionRequestsData, isLoading: constructionLoading } = useQuery({
    queryKey: ["admin-construction-requests", constructionRequestStatus, searchTerm],
    queryFn: () =>
      adminApi.requests.constructionRequests.list({
        status: constructionRequestStatus !== "all" ? constructionRequestStatus : undefined,
        search: searchTerm || undefined,
      }),
  });

  const { data: buildStats } = useQuery({
    queryKey: ["admin-build-requests-stats"],
    queryFn: () => adminApi.requests.buildRequests.stats(),
  });

  const buildRequests = buildRequestsData?.results || [];
  const constructionRequests = constructionRequestsData?.results || [];

  const isLoading = buildLoading || constructionLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="w-8 h-8" />
            Client Requests
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all client build and construction requests
          </p>
        </div>
      </div>

      {buildStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{buildStats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">New</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{buildStats.by_status?.new || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                In Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{buildStats.by_status?.in_review || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Contacted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{buildStats.by_status?.contacted || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="build" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="build">
                <FileText className="w-4 h-4 mr-2" />
                Build Requests ({buildRequests.length})
              </TabsTrigger>
              <TabsTrigger value="construction">
                <Building2 className="w-4 h-4 mr-2" />
                Construction Requests ({constructionRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="build" className="space-y-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={buildRequestStatus} onValueChange={setBuildRequestStatus}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {buildLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : buildRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No build requests found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {buildRequests.map((request: any) => (
                    <Card key={request.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="font-medium">
                              {request.plan_details?.name || "Unknown Plan"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {request.contact_name} • {request.contact_email}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {request.region_details?.name} •{" "}
                              {new Date(request.submitted_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={buildRequestStatusLabel(request.status).variant}>
                              {buildRequestStatusLabel(request.status).label}
                            </Badge>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/admin/requests/build/${request.id}`}>View</Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="construction" className="space-y-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select
                  value={constructionRequestStatus}
                  onValueChange={setConstructionRequestStatus}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="ON_HOLD">On Hold</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {constructionLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : constructionRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No construction requests found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {constructionRequests.map((request: any) => (
                    <Card key={request.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="font-medium">{request.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {request.construction_type_display} •{" "}
                              {request.client?.email || "No client"}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {request.region || request.city} •{" "}
                              {new Date(request.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={constructionRequestStatusLabel(request.status).variant}
                            >
                              {constructionRequestStatusLabel(request.status).label}
                            </Badge>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/admin/requests/construction/${request.id}`}>
                                View
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Requests;
