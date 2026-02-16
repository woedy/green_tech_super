import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  UserPlus,
  MessageSquare,
  User,
  Phone,
  Mail,
} from 'lucide-react';

function PropertyTransactionDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteIsInternal, setNoteIsInternal] = useState(false);

  const { data: transaction, isLoading } = useQuery({
    queryKey: ['admin-transaction', id],
    queryFn: () => adminApi.transactions.get(id!),
    enabled: !!id,
  });

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.listUsers(),
  });

  const agents = users?.filter((u: any) => u.is_staff || u.user_type === 'AGENT') || [];

  const approveMutation = useMutation({
    mutationFn: () => adminApi.transactions.approve(id!),
    onSuccess: () => {
      toast({ title: 'Transaction approved successfully' });
      queryClient.invalidateQueries({ queryKey: ['admin-transaction', id] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => adminApi.transactions.reject(id!, reason),
    onSuccess: () => {
      toast({ title: 'Transaction rejected' });
      setShowRejectDialog(false);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-transaction', id] });
    },
  });

  const assignAgentMutation = useMutation({
    mutationFn: (agentId: number) => adminApi.transactions.assignAgent(id!, agentId),
    onSuccess: () => {
      toast({ title: 'Agent assigned successfully' });
      setShowAssignDialog(false);
      setSelectedAgent('');
      queryClient.invalidateQueries({ queryKey: ['admin-transaction', id] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => adminApi.transactions.markCompleted(id!),
    onSuccess: () => {
      toast({ title: 'Transaction marked as completed' });
      queryClient.invalidateQueries({ queryKey: ['admin-transaction', id] });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: () => adminApi.transactions.addNote(id!, noteContent, noteIsInternal),
    onSuccess: () => {
      toast({ title: 'Note added successfully' });
      setShowNoteDialog(false);
      setNoteContent('');
      setNoteIsInternal(false);
      queryClient.invalidateQueries({ queryKey: ['admin-transaction', id] });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">Transaction not found</p>
            <Button asChild>
              <Link to="/admin/property-transactions">Back to Transactions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: 'secondary',
      submitted: 'default',
      under_review: 'default',
      approved: 'default',
      rejected: 'destructive',
      completed: 'default',
      cancelled: 'secondary',
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const canApprove = ['submitted', 'under_review'].includes(transaction.status);
  const canReject = ['submitted', 'under_review'].includes(transaction.status);
  const canComplete = transaction.status !== 'completed' && transaction.status !== 'cancelled';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/property-transactions">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <div>
                <h3 className="font-semibold mb-3">Property</h3>
                <p className="font-medium">{transaction.property_ref?.title || 'N/A'}</p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Request Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
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
                </div>
              </div>

              {transaction.message && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Client Message</h3>
                    <p className="text-sm text-muted-foreground">{transaction.message}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{transaction.contact_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{transaction.contact_email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{transaction.contact_phone}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canApprove && (
                <Button
                  className="w-full"
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              )}
              {canReject && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowRejectDialog(true)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowAssignDialog(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Assign Agent
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowNoteDialog(true)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Add Note
              </Button>
              {canComplete && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => completeMutation.mutate()}
                >
                  Mark Completed
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Transaction</DialogTitle>
          </DialogHeader>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Reason..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate(rejectionReason)}
              disabled={!rejectionReason}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Agent</DialogTitle>
          </DialogHeader>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger>
              <SelectValue placeholder="Select agent" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent: any) => (
                <SelectItem key={agent.id} value={agent.id.toString()}>
                  {agent.first_name} {agent.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Cancel</Button>
            <Button
              onClick={() => assignAgentMutation.mutate(parseInt(selectedAgent))}
              disabled={!selectedAgent}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          <Textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Note..."
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="internal"
              checked={noteIsInternal}
              onChange={(e) => setNoteIsInternal(e.target.checked)}
            />
            <Label htmlFor="internal">Internal note</Label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>Cancel</Button>
            <Button onClick={() => addNoteMutation.mutate()} disabled={!noteContent}>
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { PropertyTransactionDetail };
export default PropertyTransactionDetail;
