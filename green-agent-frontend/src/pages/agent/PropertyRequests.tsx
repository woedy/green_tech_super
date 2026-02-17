import { useCallback, useEffect, useState } from "react";
import AgentShell from "@/components/layout/AgentShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPropertyTransactions, updatePropertyTransaction, addTransactionNote } from "@/lib/api";
import { PropertyTransaction, TransactionStatus } from "@/types/property";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquarePlus, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const STATUS_VARIANTS: Record<TransactionStatus, "default" | "secondary" | "outline" | "destructive"> = {
    draft: "secondary",
    submitted: "default",
    under_review: "outline",
    approved: "default",
    rejected: "destructive",
    negotiating: "outline",
    contract_pending: "outline",
    contract_signed: "default",
    payment_pending: "outline",
    completed: "default",
    cancelled: "destructive",
};

export default function PropertyRequests() {
    const [transactions, setTransactions] = useState<PropertyTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [noteTxId, setNoteTxId] = useState<string | null>(null);
    const [selectedTx, setSelectedTx] = useState<PropertyTransaction | null>(null);
    const [noteContent, setNoteContent] = useState("");
    const [submittingNote, setSubmittingNote] = useState(false);

    const loadTransactions = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetchPropertyTransactions();
            setTransactions(res.results);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load requests");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTransactions();
    }, [loadTransactions]);

    const handleUpdateStatus = async (id: string, status: TransactionStatus) => {
        try {
            await updatePropertyTransaction(id, { status });
            toast.success(`Status updated to ${status}`);
            setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, status } : tx));
        } catch (err: any) {
            toast.error(err.message || "Failed to update status");
        }
    };

    const handleAddNote = async () => {
        if (!noteTxId || !noteContent.trim()) return;
        try {
            setSubmittingNote(true);
            await addTransactionNote(noteTxId, noteContent.trim());
            toast.success("Note added");
            setNoteContent("");
            setNoteTxId(null);
            loadTransactions(); // Refresh to show notes if we were to display them
        } catch (err: any) {
            toast.error(err.message || "Failed to add note");
        } finally {
            setSubmittingNote(false);
        }
    };

    return (
        <AgentShell>
            <div className="p-8">
                <h1 className="text-3xl font-bold tracking-tight mb-6">Property Requests</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>Rent/Buy/Lease Inquiries</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Property</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Manage</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">Loading requests...</TableCell>
                                    </TableRow>
                                ) : transactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">No requests found.</TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell>
                                                <div className="font-medium">{tx.contact_name}</div>
                                                <div className="text-xs text-muted-foreground">{tx.contact_email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-[200px] truncate" title={tx.property_ref?.title}>
                                                    {tx.property_ref?.title}
                                                </div>
                                            </TableCell>
                                            <TableCell className="capitalize">{tx.transaction_type}</TableCell>
                                            <TableCell>
                                                <Badge variant={STATUS_VARIANTS[tx.status] || "outline"}>
                                                    {tx.status.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedTx(tx)}
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setNoteTxId(tx.id)}
                                                        title="Add Note"
                                                    >
                                                        <MessageSquarePlus className="w-4 h-4" />
                                                    </Button>
                                                    <Select
                                                        value={tx.status}
                                                        onValueChange={(val) => handleUpdateStatus(tx.id, val as TransactionStatus)}
                                                    >
                                                        <SelectTrigger className="w-[140px] h-8">
                                                            <SelectValue placeholder="Status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="under_review">Under Review</SelectItem>
                                                            <SelectItem value="negotiating">Negotiating</SelectItem>
                                                            <SelectItem value="approved">Approved</SelectItem>
                                                            <SelectItem value="rejected">Rejected</SelectItem>
                                                            <SelectItem value="completed">Completed</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Request Details</DialogTitle>
                    </DialogHeader>
                    {selectedTx && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Contact</h4>
                                    <div className="font-medium">{selectedTx.contact_name}</div>
                                    <div className="text-sm">{selectedTx.contact_email}</div>
                                    <div className="text-sm">{selectedTx.contact_phone}</div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Property</h4>
                                    <div className="font-medium">{selectedTx.property_ref?.title}</div>
                                    <div className="text-sm capitalize">{selectedTx.transaction_type} • {selectedTx.property_ref?.property_type}</div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Financials</h4>
                                    {selectedTx.transaction_type === "buy" ? (
                                        <div className="text-sm">Proposed Price: {selectedTx.proposed_price || "N/A"}</div>
                                    ) : (
                                        <div className="text-sm">Proposed Rent: {selectedTx.proposed_rent || "N/A"}</div>
                                    )}
                                    <div className="text-sm">Budget: {selectedTx.budget || "N/A"}</div>
                                    {selectedTx.transaction_type === "buy" && (
                                        <div className="text-sm">Financing Required: {selectedTx.financing_required ? "Yes" : "No"}</div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Timeline</h4>
                                    <div className="text-sm">Move-in Date: {selectedTx.move_in_date || "Not specified"}</div>
                                    <div className="text-sm">Lease Duration: {selectedTx.lease_duration_months ? `${selectedTx.lease_duration_months} months` : "N/A"}</div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Message</h4>
                                    <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-md border">
                                        {selectedTx.message || "No message provided."}
                                    </p>
                                </div>
                                {selectedTx.admin_notes && (
                                    <div>
                                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Internal Notes</h4>
                                        <p className="text-sm whitespace-pre-wrap italic text-muted-foreground bg-accent/10 p-3 rounded-md border border-accent/20">
                                            {selectedTx.admin_notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setSelectedTx(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!noteTxId} onOpenChange={(open) => !open && setNoteTxId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Transaction Note</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Enter internal notes about this transaction..."
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNoteTxId(null)}>Cancel</Button>
                        <Button
                            onClick={handleAddNote}
                            disabled={submittingNote || !noteContent.trim()}
                        >
                            Save Note
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AgentShell>
    );
}
