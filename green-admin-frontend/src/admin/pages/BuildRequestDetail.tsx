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
import { ArrowLeft, User, Mail, Phone, MapPin, DollarSign, Calendar, FileText, Loader2, RefreshCw } from "lucide-react";
import { adminApi } from "../api";

const statusOptions = [
  { value: "new", label: "New" },
  { value: "in_review", label: "In Review" },
  { value: "contacted", label: "Contacted" },
  { value: "archived", label: "Archived" },
];

const BuildRequestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");

  const { data: request, isLoading } = useQuery({
    queryKey: ["admin-build-request", id],
    queryFn: () => adminApi.requests.buildRequests.get(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, notes }: { status: string; notes: string }) =>
      adminApi.requests.buildRequests.updateStatus(id!, status, notes),
    onSuccess: () => {
      toast({ title: "Status updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin-build-request", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-build-requests"] });
      setStatusDialogOpen(false);
      setStatusNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const convertMutation = useMutation({
    mutationFn: () => adminApi.requests.buildRequests.convertToConstructionRequest(id!),
    onSuccess: (data) => {
      toast({ title: "Successfully converted to construction request" });
      navigate(`/admin/requests/construction/${data.construction_request.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to convert request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-semibold">Request not found</h2>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/admin/requests">Back to Requests</Link>
        </Button>
      </div>
    );
  }

  const statusLabel = statusOptions.find((s) => s.value === request.status)?.label || request.status;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link to="/admin/requests">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Requests
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Build Request Details</h1>
          <p className="text-muted-foreground">
            Submitted {new Date(request.submitted_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {statusLabel}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNewStatus(request.status);
              setStatusDialogOpen(true);
            }}
          >
            Update Status
          </Button>
          {request.status !== "archived" && request.user_details && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setConvertDialogOpen(true)}
              disabled={convertMutation.isPending}
            >
              {convertMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <RefreshCw className="w-4 h-4 mr-2" />
              Convert to Construction Request
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Plan Name</Label>
                <p className="font-medium">{request.plan_details?.name || "Unknown"}</p>
              </div>
              {request.plan_details?.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="text-sm">{request.plan_details.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{request.contact_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{request.contact_email}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <p className="font-medium">{request.contact_phone}</p>
              </div>
              {request.user_details && (
                <div>
                  <Label className="text-muted-foreground">Registered User</Label>
                  <p className="text-sm">
                    {request.user_details.first_name} {request.user_details.last_name} (
                    {request.user_details.email})
                  </p>
                  <Button variant="link" size="sm" asChild className="px-0">
                    <Link to={`/admin/users/${request.user_details.id}`}>View User Profile</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {request.customizations && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Customizations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{request.customizations}</p>
              </CardContent>
            </Card>
          )}

          {request.options && request.options.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {request.options.map((option: any, idx: number) => (
                    <div key={idx} className="text-sm">
                      • {typeof option === "string" ? option : JSON.stringify(option)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{request.region_details?.name || "Unknown Region"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Budget
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label className="text-muted-foreground">Currency</Label>
                <p className="font-medium">{request.budget_currency}</p>
              </div>
              {request.budget_min && (
                <div>
                  <Label className="text-muted-foreground">Minimum</Label>
                  <p className="font-medium">
                    {request.budget_currency} {Number(request.budget_min).toLocaleString()}
                  </p>
                </div>
              )}
              {request.budget_max && (
                <div>
                  <Label className="text-muted-foreground">Maximum</Label>
                  <p className="font-medium">
                    {request.budget_currency} {Number(request.budget_max).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {request.timeline && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{request.timeline}</p>
              </CardContent>
            </Card>
          )}

          {request.attachments && request.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {request.attachments.map((attachment: any) => (
                    <div key={attachment.id} className="text-sm">
                      <a
                        href={attachment.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {attachment.original_name}
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Request Status</DialogTitle>
            <DialogDescription>
              Change the status of this build request and optionally add notes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Add any notes about this status change..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                updateStatusMutation.mutate({ status: newStatus, notes: statusNotes })
              }
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Construction Request</DialogTitle>
            <DialogDescription>
              This will create a new construction request based on this build request and mark
              this request as archived.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => convertMutation.mutate()}
              disabled={convertMutation.isPending}
            >
              {convertMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Convert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuildRequestDetail;
