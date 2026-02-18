import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, DollarSign, MapPin, User, Phone, Mail, MessageSquare } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

const PropertyTransactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transaction, isLoading } = useQuery({
    queryKey: ["property-transaction", id],
    queryFn: () => api.get(`/api/transactions/${id}/`),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.post(`/api/transactions/${id}/cancel/`),
    onSuccess: () => {
      toast({ title: "Transaction cancelled successfully" });
      queryClient.invalidateQueries({ queryKey: ["property-transaction", id] });
      queryClient.invalidateQueries({ queryKey: ["property-transactions"] });
    },
    onError: () => {
      toast({
        title: "Failed to cancel transaction",
        variant: "destructive",
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => api.post(`/api/transactions/${id}/submit/`),
    onSuccess: () => {
      toast({ title: "Transaction submitted successfully" });
      queryClient.invalidateQueries({ queryKey: ["property-transaction", id] });
      queryClient.invalidateQueries({ queryKey: ["property-transactions"] });
    },
    onError: () => {
      toast({
        title: "Failed to submit transaction",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background py-8">
          <div className="max-w-5xl mx-auto px-4">
            <Skeleton className="h-10 w-64 mb-6" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!transaction) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive mb-4">Transaction not found</p>
              <Button asChild>
                <Link to="/account/property-transactions">Back to Requests</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: "secondary",
      submitted: "default",
      under_review: "default",
      approved: "default",
      rejected: "destructive",
      completed: "default",
      cancelled: "secondary",
    };
    return <Badge variant={variants[status] || "secondary"}>{status.replace('_', ' ').toUpperCase()}</Badge>;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <section className="py-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <Link to="/account/property-transactions">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Requests
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl mb-2">
                          {transaction.transaction_type.toUpperCase()} Request
                        </CardTitle>
                        <p className="text-muted-foreground">Request ID: {transaction.id}</p>
                      </div>
                      {getStatusBadge(transaction.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Property Info */}
                    <div>
                      <h3 className="font-semibold mb-3">Property</h3>
                      <div className="flex gap-4">
                        {transaction.property?.image && (
                          <img
                            src={transaction.property.image}
                            alt={transaction.property.title}
                            className="w-24 h-24 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium">{transaction.property?.title}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {transaction.property_location?.city}, {transaction.property_location?.region}
                          </p>
                          <Button asChild variant="link" size="sm" className="px-0">
                            <Link to={`/account/properties/${transaction.property_ref?.slug || transaction.property_ref}`}>
                              View Property Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Transaction Details */}
                    <div>
                      <h3 className="font-semibold mb-3">Request Details</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {transaction.proposed_price && (
                          <div>
                            <p className="text-muted-foreground">Proposed Price</p>
                            <p className="font-medium flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              ${transaction.proposed_price.toLocaleString()}
                            </p>
                          </div>
                        )}
                        {transaction.proposed_rent && (
                          <div>
                            <p className="text-muted-foreground">Proposed Rent</p>
                            <p className="font-medium flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              ${transaction.proposed_rent.toLocaleString()}/month
                            </p>
                          </div>
                        )}
                        {transaction.lease_duration_months && (
                          <div>
                            <p className="text-muted-foreground">Lease Duration</p>
                            <p className="font-medium flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {transaction.lease_duration_months} months
                            </p>
                          </div>
                        )}
                        {transaction.move_in_date && (
                          <div>
                            <p className="text-muted-foreground">Move-in Date</p>
                            <p className="font-medium flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(transaction.move_in_date).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {transaction.budget && (
                          <div>
                            <p className="text-muted-foreground">Budget</p>
                            <p className="font-medium">{transaction.budget}</p>
                          </div>
                        )}
                        {transaction.financing_required && (
                          <div>
                            <p className="text-muted-foreground">Financing</p>
                            <Badge variant="secondary">Required</Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {transaction.message && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Your Message
                          </h3>
                          <p className="text-sm text-muted-foreground whitespace-pre-line">
                            {transaction.message}
                          </p>
                        </div>
                      </>
                    )}

                    {transaction.rejection_reason && (
                      <>
                        <Separator />
                        <div className="bg-destructive/10 p-4 rounded-lg">
                          <h3 className="font-semibold mb-2 text-destructive">Rejection Reason</h3>
                          <p className="text-sm">{transaction.rejection_reason}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{transaction.contact_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{transaction.contact_email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{transaction.contact_phone}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {transaction.status === 'draft' && (
                      <Button 
                        className="w-full" 
                        onClick={() => submitMutation.mutate()}
                        disabled={submitMutation.isPending}
                      >
                        Submit Request
                      </Button>
                    )}
                    {transaction.can_be_cancelled && (
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        onClick={() => {
                          if (confirm('Are you sure you want to cancel this request?')) {
                            cancelMutation.mutate();
                          }
                        }}
                        disabled={cancelMutation.isPending}
                      >
                        Cancel Request
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p>{new Date(transaction.created_at).toLocaleString()}</p>
                    </div>
                    {transaction.submitted_at && (
                      <div>
                        <p className="text-muted-foreground">Submitted</p>
                        <p>{new Date(transaction.submitted_at).toLocaleString()}</p>
                      </div>
                    )}
                    {transaction.reviewed_at && (
                      <div>
                        <p className="text-muted-foreground">Reviewed</p>
                        <p>{new Date(transaction.reviewed_at).toLocaleString()}</p>
                      </div>
                    )}
                    {transaction.completed_at && (
                      <div>
                        <p className="text-muted-foreground">Completed</p>
                        <p>{new Date(transaction.completed_at).toLocaleString()}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default PropertyTransactionDetail;
