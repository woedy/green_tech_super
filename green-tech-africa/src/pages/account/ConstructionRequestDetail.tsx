import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Building2, Calendar, DollarSign, MapPin, User, FileText, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { constructionRequestsApi } from "@/lib/api";

const statusLabel = (status: string) => {
  switch (status) {
    case "DRAFT":
      return { label: "Draft", variant: "secondary" as const, color: "text-gray-600" };
    case "PENDING":
      return { label: "Pending Approval", variant: "default" as const, color: "text-yellow-600" };
    case "APPROVED":
      return { label: "Approved", variant: "default" as const, color: "text-green-600" };
    case "IN_PROGRESS":
      return { label: "In Progress", variant: "default" as const, color: "text-blue-600" };
    case "ON_HOLD":
      return { label: "On Hold", variant: "outline" as const, color: "text-orange-600" };
    case "COMPLETED":
      return { label: "Completed", variant: "outline" as const, color: "text-green-700" };
    case "CANCELLED":
      return { label: "Cancelled", variant: "destructive" as const, color: "text-red-600" };
    default:
      return { label: status, variant: "secondary" as const, color: "text-gray-600" };
  }
};

const ConstructionRequestDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: request, isLoading, error } = useQuery({
    queryKey: ['construction-request', id],
    queryFn: () => constructionRequestsApi.getConstructionRequest(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading construction request...</span>
        </div>
      </Layout>
    );
  }

  if (error || !request) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-red-600">Error loading construction request</h2>
            <p className="text-muted-foreground">The request could not be found or you don't have access.</p>
            <Button variant="outline" asChild className="mt-4">
              <Link to="/account/requests">Back to Requests</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const statusInfo = statusLabel(request.status);

  return (
    <Layout>
      {/* Header */}
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/account/requests">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Requests
            </Link>
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{request.title}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span>{request.construction_type_display}</span>
                <span>•</span>
                <span>Created {new Date(request.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <Badge variant={statusInfo.variant} className="text-sm">
              {statusInfo.label}
            </Badge>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              {request.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{request.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Location Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {request.property ? (
                    <div>
                      <p className="text-sm font-medium">Property</p>
                      <p className="text-muted-foreground">Property ID: {request.property}</p>
                    </div>
                  ) : (
                    <>
                      {request.address && (
                        <div>
                          <p className="text-sm font-medium">Address</p>
                          <p className="text-muted-foreground">{request.address}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        {request.city && (
                          <div>
                            <p className="text-sm font-medium">City</p>
                            <p className="text-muted-foreground">{request.city}</p>
                          </div>
                        )}
                        {request.region && (
                          <div>
                            <p className="text-sm font-medium">Region</p>
                            <p className="text-muted-foreground">{request.region}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Timeline */}
              {(request.start_date || request.estimated_end_date) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {request.start_date && (
                        <div>
                          <p className="text-sm font-medium">Start Date</p>
                          <p className="text-muted-foreground">{new Date(request.start_date).toLocaleDateString()}</p>
                        </div>
                      )}
                      {request.estimated_end_date && (
                        <div>
                          <p className="text-sm font-medium">Estimated End Date</p>
                          <p className="text-muted-foreground">{new Date(request.estimated_end_date).toLocaleDateString()}</p>
                        </div>
                      )}
                      {request.actual_end_date && (
                        <div>
                          <p className="text-sm font-medium">Actual End Date</p>
                          <p className="text-muted-foreground">{new Date(request.actual_end_date).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Customization Data */}
              {request.customization_data && Object.keys(request.customization_data).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Customization Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(request.customization_data).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-sm font-medium capitalize">{key.replace(/_/g, ' ')}</p>
                          <p className="text-muted-foreground text-sm">{JSON.stringify(value, null, 2)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Budget */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Budget
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {request.budget && (
                    <div>
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="text-2xl font-bold">
                        {request.currency} {Number(request.budget).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {request.estimated_cost && (
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated Cost</p>
                      <p className="text-xl font-semibold">
                        {request.currency} {Number(request.estimated_cost).toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sustainability Targets */}
              {(request.target_energy_rating || request.target_water_rating || request.target_sustainability_score) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Sustainability Targets</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {request.target_energy_rating && (
                      <div>
                        <p className="text-sm text-muted-foreground">Energy Rating</p>
                        <p className="font-medium">{request.target_energy_rating}/5</p>
                      </div>
                    )}
                    {request.target_water_rating && (
                      <div>
                        <p className="text-sm text-muted-foreground">Water Rating</p>
                        <p className="font-medium">{request.target_water_rating}/5</p>
                      </div>
                    )}
                    {request.target_sustainability_score && (
                      <div>
                        <p className="text-sm text-muted-foreground">Sustainability Score</p>
                        <p className="font-medium">{request.target_sustainability_score}/100</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Step</span>
                      <span className="font-medium capitalize">{request.current_step?.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Completed</span>
                      <span className="font-medium">{request.is_completed ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ConstructionRequestDetail;
