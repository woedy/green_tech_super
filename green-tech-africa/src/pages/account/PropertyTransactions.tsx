import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Calendar, DollarSign, FileText } from "lucide-react";
import { api } from "@/lib/api";

type TransactionStatus = 
  | 'draft' 
  | 'submitted' 
  | 'under_review' 
  | 'approved' 
  | 'rejected' 
  | 'negotiating'
  | 'contract_pending'
  | 'contract_signed'
  | 'payment_pending'
  | 'completed' 
  | 'cancelled';

type Transaction = {
  id: string;
  property_ref: number;
  property_title: string;
  property_slug: string;
  property_image: string;
  property_location: {
    city: string;
    country: string;
    region: string;
  };
  transaction_type: 'rent' | 'lease' | 'buy';
  status: TransactionStatus;
  proposed_price?: number;
  proposed_rent?: number;
  lease_duration_months?: number;
  created_at: string;
  submitted_at?: string;
};

const PropertyTransactions = () => {
  const [activeTab, setActiveTab] = useState<string>("all");

  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ["property-transactions"],
    queryFn: () => api.get("/api/transactions/"),
  });

  // Extract transactions array from paginated response
  const transactions = Array.isArray(transactionsData?.results) 
    ? transactionsData.results 
    : Array.isArray(transactionsData) 
    ? transactionsData 
    : [];

  const getStatusBadge = (status: TransactionStatus) => {
    const statusConfig: Record<TransactionStatus, { variant: any; label: string }> = {
      draft: { variant: "secondary", label: "Draft" },
      submitted: { variant: "default", label: "Submitted" },
      under_review: { variant: "default", label: "Under Review" },
      approved: { variant: "default", label: "Approved" },
      rejected: { variant: "destructive", label: "Rejected" },
      negotiating: { variant: "default", label: "Negotiating" },
      contract_pending: { variant: "default", label: "Contract Pending" },
      contract_signed: { variant: "default", label: "Contract Signed" },
      payment_pending: { variant: "default", label: "Payment Pending" },
      completed: { variant: "default", label: "Completed" },
      cancelled: { variant: "secondary", label: "Cancelled" },
    };

    const config = statusConfig[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTransactionTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      rent: "bg-blue-100 text-blue-800",
      lease: "bg-purple-100 text-purple-800",
      buy: "bg-green-100 text-green-800",
    };
    return (
      <Badge className={colors[type] || "bg-gray-100 text-gray-800"}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  const filterTransactions = (transactions: Transaction[], filter: string) => {
    // Ensure transactions is always an array
    const transactionsArray = Array.isArray(transactions) ? transactions : [];
    
    if (filter === "all") return transactionsArray;
    if (filter === "active") {
      return transactionsArray.filter(t => 
        !['completed', 'cancelled', 'rejected'].includes(t.status)
      );
    }
    return transactionsArray.filter(t => t.transaction_type === filter);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background">
          <section className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Skeleton className="h-10 w-64 mb-6" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
              </div>
            </div>
          </section>
        </div>
      </Layout>
    );
  }

  const filteredTransactions = filterTransactions(transactions, activeTab);

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">My Property Requests</h1>
              <p className="text-muted-foreground">
                Track your rent, lease, and purchase requests
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="rent">Rent</TabsTrigger>
                <TabsTrigger value="lease">Lease</TabsTrigger>
                <TabsTrigger value="buy">Buy</TabsTrigger>
              </TabsList>
            </Tabs>

            {filteredTransactions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Home className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Requests Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    You haven't submitted any property requests yet. Browse our catalog to find your perfect property.
                  </p>
                  <Button asChild>
                    <Link to="/account/properties">Browse Properties</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction: Transaction) => (
                  <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Property Image */}
                        {transaction.property_image && (
                          <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={transaction.property_image}
                              alt={transaction.property_title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Transaction Details */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-semibold mb-1">
                                {transaction.property_title}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {transaction.property_location.city}, {transaction.property_location.region}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {getTransactionTypeBadge(transaction.transaction_type)}
                              {getStatusBadge(transaction.status)}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            {transaction.proposed_price && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-muted-foreground" />
                                <span>Offer: ${transaction.proposed_price.toLocaleString()}</span>
                              </div>
                            )}
                            {transaction.proposed_rent && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-muted-foreground" />
                                <span>Rent: ${transaction.proposed_rent.toLocaleString()}/mo</span>
                              </div>
                            )}
                            {transaction.lease_duration_months && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span>{transaction.lease_duration_months} months</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span>
                                {transaction.submitted_at 
                                  ? new Date(transaction.submitted_at).toLocaleDateString()
                                  : new Date(transaction.created_at).toLocaleDateString()
                                }
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button asChild size="sm">
                              <Link to={`/account/property-transactions/${transaction.id}`}>
                                View Details
                              </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                              <Link to={`/account/properties/${transaction.property_slug}`}>
                                View Property
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default PropertyTransactions;
