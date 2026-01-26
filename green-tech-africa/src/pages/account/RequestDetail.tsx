import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ClipboardList, Download, FileText, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { buildRequestsApi, BuildRequest } from "@/lib/api";

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

const RequestDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: request, isLoading, error } = useQuery({
    queryKey: ['build-request', id],
    queryFn: () => buildRequestsApi.get(String(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading request details...</span>
        </div>
      </Layout>
    );
  }

  if (error || !request) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-red-600">Error loading request</h2>
            <p className="text-muted-foreground">Please try again later.</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link to="/account/requests">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Requests
              </Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-6 h-6" />
              <h1 className="text-2xl md:text-3xl font-bold">Request REQ-{String(request.id).slice(0, 8).toUpperCase()}</h1>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/account/requests">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Requests
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Plan & Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{request.plan_details?.name ?? request.plan}</div>
                  <Badge variant={statusLabel((request as any).status).variant}>{statusLabel((request as any).status).label}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Type</Label>
                    <div>Plan build request</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div>{statusLabel((request as any).status).label}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Region</Label>
                    <div>{(request.region_details?.name ?? request.region) || 'Not specified'}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">City</Label>
                    <div>Not specified</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Budget</Label>
                    <div>
                      {request.budget_min || request.budget_max
                        ? `${request.budget_currency} ${request.budget_min ?? '-'} - ${request.budget_max ?? '-'}`
                        : 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <div>{new Date(request.submitted_at).toLocaleDateString()}</div>
                  </div>
                </div>
                {request.customizations && (
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <div className="text-sm mt-1">{request.customizations}</div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Timeline</Label>
                    <div>{request.timeline || 'Not specified'}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Selected options</Label>
                    <div>{request.options?.length ? request.options.join(', ') : 'None'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Selected Eco-Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-muted-foreground text-sm">Not available for plan build requests.</div>
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Customizations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {request.customizations ? (
                    <p className="text-sm">{request.customizations}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No customizations specified.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {request.attachments.length > 0 ? (
                  request.attachments.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-muted/50 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-primary" />
                        <div>
                          <div className="text-sm font-medium">{doc.original_name}</div>
                          <div className="text-xs text-muted-foreground">Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" disabled>
                        <Download className="w-3 h-3 mr-1" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground text-sm text-center py-4">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No documents uploaded.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>- Our team reviews your request (1-2 business days)</div>
                <div>- You will receive a quote via email and here in your dashboard</div>
                <div>- Chat and schedule site visits after quote stage</div>
                <Button className="w-full mt-3" asChild>
                  <Link to="/account/quotes">View Quotes</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default RequestDetail;

