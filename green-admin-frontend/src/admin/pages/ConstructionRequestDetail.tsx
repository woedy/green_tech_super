import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, MapPin, DollarSign, Calendar, FileText, Loader2, CheckCircle } from "lucide-react";
import { adminApi } from "../api";

const statusLabels: Record<string, { label: string; variant: any }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  PENDING: { label: "Pending", variant: "default" },
  APPROVED: { label: "Approved", variant: "default" },
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  ON_HOLD: { label: "On Hold", variant: "outline" },
  COMPLETED: { label: "Completed", variant: "outline" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

const ConstructionRequestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [projectManagerId, setProjectManagerId] = useState("");
  const [siteSupervisorId, setSiteSupervisorId] = useState("");

  const { data: request, isLoading } = useQuery({
    queryKey: ["admin-construction-request", id],
    queryFn: () => adminApi.requests.constructionRequests.get(Number(id)),
    enabled: !!id,
  });

  const { data: usersData } = useQuery({
    queryKey: ["admin-users-staff"],
    queryFn: () => adminApi.listUsers({ user_type: "ADMIN" }),
  });

  const convertMutation = useMutation({
    mutationFn: (data: { project_manager_id: number; site_supervisor_id?: number }) =>
      adminApi.requests.constructionRequests.convertToProject(Number(id), data),
    onSuccess: (data) => {
      toast({ title: "Successfully converted to project" });
      navigate(`/admin/projects/${data.project.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to convert to project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) =>
      adminApi.requests.constructionRequests.update(Number(id), payload),
    onSuccess: () => {
      toast({ title: "Request updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin-construction-request", id] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update request",
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

  const statusInfo = statusLabels[request.status] || { label: request.status, variant: "secondary" };
  const staffUsers = usersData || [];

  const handleConvert = () => {
    if (!projectManagerId) {
      toast({
        title: "Project manager required",
        description: "Please select a project manager",
        variant: "destructive",
      });
      return;
    }

    convertMutation.mutate({
      project_manager_id: Number(projectManagerId),
      site_supervisor_id: siteSupervisorId ? Number(siteSupervisorId) : undefined,
    });
  };

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
          <h1 className="text-3xl font-bold">{request.title}</h1>
          <p className="text-muted-foreground">
            Created {new Date(request.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusInfo.variant} className="text-sm">
            {statusInfo.label}
          </Badge>
          {request.status === "APPROVED" && !request.project && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setConvertDialogOpen(true)}
              disabled={convertMutation.isPending}
            >
              {convertMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <CheckCircle className="w-4 h-4 mr-2" />
              Convert to Project
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{request.description || "No description provided"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {request.property_data ? (
                <div>
                  <Label className="text-muted-foreground">Property</Label>
                  <p className="font-medium">{request.property_data.title}</p>
                  <Button variant="link" size="sm" asChild className="px-0">
                    <Link to={`/admin/properties/${request.property}`}>View Property</Link>
                  </Button>
                </div>
              ) : (
                <>
                  {request.address && (
                    <div>
                      <Label className="text-muted-foreground">Address</Label>
                      <p>{request.address}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {request.city && (
                      <div>
                        <Label className="text-muted-foreground">City</Label>
                        <p>{request.city}</p>
                      </div>
                    )}
                    {request.region && (
                      <div>
                        <Label className="text-muted-foreground">Region</Label>
                        <p>{request.region}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {request.client && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-medium">
                      {request.client.first_name} {request.client.last_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p>{request.client.email}</p>
                  </div>
                  <Button variant="link" size="sm" asChild className="px-0">
                    <Link to={`/admin/users/${request.client.id}`}>View User Profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {request.customization_data && Object.keys(request.customization_data).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Customization Data</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-muted p-4 rounded overflow-auto">
                  {JSON.stringify(request.customization_data, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Construction Type</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{request.construction_type_display}</p>
            </CardContent>
          </Card>

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
                  <Label className="text-muted-foreground">Budget</Label>
                  <p className="text-2xl font-bold">
                    {request.currency} {Number(request.budget).toLocaleString()}
                  </p>
                </div>
              )}
              {request.estimated_cost && (
                <div>
                  <Label className="text-muted-foreground">Estimated Cost</Label>
                  <p className="text-xl font-semibold">
                    {request.currency} {Number(request.estimated_cost).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {(request.start_date || request.estimated_end_date) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {request.start_date && (
                  <div>
                    <Label className="text-muted-foreground">Start Date</Label>
                    <p>{new Date(request.start_date).toLocaleDateString()}</p>
                  </div>
                )}
                {request.estimated_end_date && (
                  <div>
                    <Label className="text-muted-foreground">Estimated End</Label>
                    <p>{new Date(request.estimated_end_date).toLocaleDateString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {(request.target_energy_rating || request.target_water_rating || request.target_sustainability_score) && (
            <Card>
              <CardHeader>
                <CardTitle>Sustainability Targets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {request.target_energy_rating && (
                  <div>
                    <Label className="text-muted-foreground">Energy Rating</Label>
                    <p className="font-medium">{request.target_energy_rating}/5</p>
                  </div>
                )}
                {request.target_water_rating && (
                  <div>
                    <Label className="text-muted-foreground">Water Rating</Label>
                    <p className="font-medium">{request.target_water_rating}/5</p>
                  </div>
                )}
                {request.target_sustainability_score && (
                  <div>
                    <Label className="text-muted-foreground">Sustainability Score</Label>
                    <p className="font-medium">{request.target_sustainability_score}/100</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label className="text-muted-foreground">Current Step</Label>
                <p className="font-medium capitalize">
                  {request.current_step_display || request.current_step?.replace(/_/g, " ")}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Completed</Label>
                <p className="font-medium">{request.is_completed ? "Yes" : "No"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Convert to Project Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Project</DialogTitle>
            <DialogDescription>
              Assign a project manager and optionally a site supervisor to convert this request
              into an active project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Project Manager *</Label>
              <Select value={projectManagerId} onValueChange={setProjectManagerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project manager" />
                </SelectTrigger>
                <SelectContent>
                  {staffUsers.map((user: any) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.first_name} {user.last_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Site Supervisor (Optional)</Label>
              <Select value={siteSupervisorId} onValueChange={setSiteSupervisorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select site supervisor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {staffUsers.map((user: any) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.first_name} {user.last_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConvert}
              disabled={convertMutation.isPending || !projectManagerId}
            >
              {convertMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Convert to Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConstructionRequestDetail;
