import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    MapPin,
    DollarSign,
    Calendar,
    FileText,
    Loader2,
    CheckCircle,
    XCircle,
    UserPlus,
    Clock
} from "lucide-react";
import { adminApi } from "../api";

const PropertyTransactionDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedAgentId, setSelectedAgentId] = useState<string>("");

    const { data: transaction, isLoading } = useQuery({
        queryKey: ["admin-transaction", id],
        queryFn: () => adminApi.transactions.get(id!),
        enabled: !!id,
    });

    const { data: agents } = useQuery({
        queryKey: ["admin-agents"],
        queryFn: () => adminApi.listUsers({ user_type: "AGENT" }),
    });

    const approveMutation = useMutation({
        mutationFn: () => adminApi.transactions.approve(id!),
        onSuccess: () => {
            toast({ title: "Transaction approved successfully" });
            queryClient.invalidateQueries({ queryKey: ["admin-transaction", id] });
        },
        onError: (error: any) => {
            toast({ title: "Failed to approve", description: error.message, variant: "destructive" });
        },
    });

    const rejectMutation = useMutation({
        mutationFn: (reason: string) => adminApi.transactions.reject(id!, reason),
        onSuccess: () => {
            toast({ title: "Transaction rejected" });
            setRejectDialogOpen(false);
            setRejectReason("");
            queryClient.invalidateQueries({ queryKey: ["admin-transaction", id] });
        },
        onError: (error: any) => {
            toast({ title: "Failed to reject", description: error.message, variant: "destructive" });
        },
    });

    const assignAgentMutation = useMutation({
        mutationFn: (agentId: number) => adminApi.transactions.assignAgent(id!, agentId),
        onSuccess: () => {
            toast({ title: "Agent assigned successfully" });
            setAssignDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ["admin-transaction", id] });
        },
        onError: (error: any) => {
            toast({ title: "Failed to assign agent", description: error.message, variant: "destructive" });
        },
    });

    const completeMutation = useMutation({
        mutationFn: () => adminApi.transactions.markCompleted(id!),
        onSuccess: () => {
            toast({ title: "Transaction marked as completed" });
            queryClient.invalidateQueries({ queryKey: ["admin-transaction", id] });
        },
        onError: (error: any) => {
            toast({ title: "Failed to complete", description: error.message, variant: "destructive" });
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="text-center py-12">
                <h2 className="text-lg font-semibold">Transaction not found</h2>
                <Button variant="outline" asChild className="mt-4">
                    <Link to="/admin/property-transactions">Back to Transactions</Link>
                </Button>
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Button variant="ghost" size="sm" asChild className="mb-2">
                        <Link to="/admin/property-transactions">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Transactions
                        </Link>
                    </Button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold">{transaction.property_title}</h1>
                        {getTypeBadge(transaction.transaction_type)}
                    </div>
                    <p className="text-muted-foreground mt-1">
                        Transaction ID: {transaction.id} • Submitted {new Date(transaction.submitted_at).toLocaleDateString()}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {getStatusBadge(transaction.status)}

                    {transaction.status === 'submitted' && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => approveMutation.mutate()}
                                disabled={approveMutation.isPending}
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:bg-destructive/5"
                                onClick={() => setRejectDialogOpen(true)}
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                            </Button>
                        </>
                    )}

                    {transaction.status === 'approved' && !transaction.assigned_agent && (
                        <Button size="sm" onClick={() => setAssignDialogOpen(true)}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Assign Agent
                        </Button>
                    )}

                    {(transaction.status === 'contract_signed' || transaction.status === 'payment_pending') && (
                        <Button size="sm" onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Completed
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaction Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Proposed Price/Rent</Label>
                                    <p className="text-2xl font-bold">
                                        ${(transaction.proposed_price || transaction.proposed_rent || 0).toLocaleString()}
                                        {transaction.transaction_type === 'rent' ? '/mo' : ''}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Current Status</Label>
                                    <div className="mt-1">{getStatusBadge(transaction.status)}</div>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        Client Details
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <Label className="text-muted-foreground">Name</Label>
                                            <p className="font-medium">{transaction.contact_name}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Email</Label>
                                            <p className="font-medium">{transaction.contact_email}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Phone</Label>
                                            <p className="font-medium">{transaction.contact_phone || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        Property Details
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <Label className="text-muted-foreground">Property</Label>
                                            <p className="font-medium">{transaction.property_title}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Location</Label>
                                            <p className="font-medium">
                                                {transaction.property_location?.city}, {transaction.property_location?.region}
                                            </p>
                                        </div>
                                        <Button variant="link" size="sm" asChild className="px-0 h-auto">
                                            <Link to={`/admin/properties/${transaction.property}`}>View Property Details</Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {transaction.notes && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Additional Notes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap text-sm">{transaction.notes}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Clock className="w-5 h-5" />
                                History & Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex gap-3 text-sm">
                                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                                    <div>
                                        <p className="font-medium">Submitted</p>
                                        <p className="text-muted-foreground">
                                            {new Date(transaction.submitted_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                {transaction.approved_at && (
                                    <div className="flex gap-3 text-sm">
                                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                                        <div>
                                            <p className="font-medium">Approved</p>
                                            <p className="text-muted-foreground">
                                                {new Date(transaction.approved_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {transaction.completed_at && (
                                    <div className="flex gap-3 text-sm">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                        <div>
                                            <p className="font-medium">Completed</p>
                                            <p className="text-muted-foreground">
                                                {new Date(transaction.completed_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <UserPlus className="w-5 h-5" />
                                Assignment
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {transaction.assigned_agent_name ? (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Assigned Agent</p>
                                    <p className="font-medium">{transaction.assigned_agent_name}</p>
                                    <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setAssignDialogOpen(true)}>
                                        Change Agent
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-4 space-y-3">
                                    <p className="text-sm text-muted-foreground">No agent assigned yet</p>
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => setAssignDialogOpen(true)}>
                                        Assign Now
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Transaction</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this transaction. This will be visible to the client.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="reason">Reason for Rejection</Label>
                        <Textarea
                            id="reason"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g. Incomplete documentation, price mismatch..."
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={() => rejectMutation.mutate(rejectReason)}
                            disabled={!rejectReason || rejectMutation.isPending}
                        >
                            {rejectMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Reject Transaction
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign Agent Dialog */}
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Agent</DialogTitle>
                        <DialogDescription>
                            Select an agent to manage this transaction.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Select Agent</Label>
                        <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                            <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Choose an agent..." />
                            </SelectTrigger>
                            <SelectContent>
                                {agents?.map((agent: any) => (
                                    <SelectItem key={agent.id} value={agent.id.toString()}>
                                        {agent.first_name} {agent.last_name} ({agent.email})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={() => assignAgentMutation.mutate(parseInt(selectedAgentId))}
                            disabled={!selectedAgentId || assignAgentMutation.isPending}
                        >
                            {assignAgentMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Assign Agent
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PropertyTransactionDetail;
