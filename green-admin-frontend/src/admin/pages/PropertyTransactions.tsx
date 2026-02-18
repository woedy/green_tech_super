import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Eye, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const PropertyTransactions = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-transactions', statusFilter, typeFilter, search],
    queryFn: () => adminApi.transactions.list({
      status: statusFilter,
      transaction_type: typeFilter,
      search,
    }),
  });

  const transactions = data?.results || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: 'secondary',
      submitted: 'default',
      under_review: 'default',
      approved: 'default',
      rejected: 'destructive',
      negotiating: 'default',
      contract_pending: 'default',
      contract_signed: 'default',
      payment_pending: 'default',
      completed: 'default',
      cancelled: 'secondary',
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      rent: 'bg-blue-100 text-blue-800',
      lease: 'bg-purple-100 text-purple-800',
      buy: 'bg-green-100 text-green-800',
    };
    return (
      <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Property Transactions</h1>
          <p className="text-muted-foreground mt-1">
            Manage rent, lease, and buy requests
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by property, client..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="negotiating">Negotiating</SelectItem>
                  <SelectItem value="contract_pending">Contract Pending</SelectItem>
                  <SelectItem value="contract_signed">Contract Signed</SelectItem>
                  <SelectItem value="payment_pending">Payment Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="lease">Lease</SelectItem>
                  <SelectItem value="buy">Buy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <div className="space-y-4">
        {transactions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No transactions found</p>
            </CardContent>
          </Card>
        ) : (
          transactions.map((transaction: any) => (
            <Card key={transaction.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {transaction.property_title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {transaction.property_location?.city}, {transaction.property_location?.region}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {getTypeBadge(transaction.transaction_type)}
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Client</p>
                        <p className="font-medium">{transaction.contact_name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium">{transaction.contact_email}</p>
                      </div>
                      {transaction.proposed_price && (
                        <div>
                          <p className="text-muted-foreground">Proposed Price</p>
                          <p className="font-medium">${transaction.proposed_price.toLocaleString()}</p>
                        </div>
                      )}
                      {transaction.proposed_rent && (
                        <div>
                          <p className="text-muted-foreground">Proposed Rent</p>
                          <p className="font-medium">${transaction.proposed_rent.toLocaleString()}/mo</p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground">Submitted</p>
                        <p className="font-medium">
                          {transaction.submitted_at 
                            ? new Date(transaction.submitted_at).toLocaleDateString()
                            : 'Not submitted'
                          }
                        </p>
                      </div>
                    </div>

                    {transaction.assigned_agent_name && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Assigned to: </span>
                        <span className="font-medium">{transaction.assigned_agent_name}</span>
                      </div>
                    )}
                  </div>

                  <Button asChild size="sm">
                    <Link to={`/admin/property-transactions/${transaction.id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination info */}
      {data && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {transactions.length} of {data.count} transactions
        </div>
      )}
    </div>
  );
};

export { PropertyTransactions };
export default PropertyTransactions;
