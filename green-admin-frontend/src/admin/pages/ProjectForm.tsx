import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { adminApi } from "@/admin/api";

interface ProjectFormData {
  title: string;
  description: string;
  status: string;
  current_phase: string;
  planned_start_date: string;
  planned_end_date: string;
  estimated_budget: string;
  currency: string;
  project_manager: string;
  site_supervisor: string;
  property: string;
}

export function ProjectForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm<ProjectFormData>({
    defaultValues: {
      status: "PLANNING",
      current_phase: "SITE_PREPARATION",
      currency: "GHS",
    },
  });

  // Fetch project data if editing
  const { data: project } = useQuery({
    queryKey: ["admin-project", id],
    queryFn: () => adminApi.projects.get(Number(id)),
    enabled: isEdit,
  });

  // Fetch users for dropdowns
  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => adminApi.listUsers(),
  });

  // Fetch properties for dropdown
  const { data: properties } = useQuery({
    queryKey: ["admin-properties"],
    queryFn: () => adminApi.listProperties(),
  });

  // Populate form when editing
  useEffect(() => {
    if (project) {
      setValue("title", project.title);
      setValue("description", project.description || "");
      setValue("status", project.status);
      setValue("current_phase", project.current_phase);
      setValue("planned_start_date", project.planned_start_date || "");
      setValue("planned_end_date", project.planned_end_date || "");
      setValue("estimated_budget", project.estimated_budget?.toString() || "");
      setValue("currency", project.currency || "GHS");
      setValue("project_manager", project.project_manager?.id?.toString() || "");
      setValue("site_supervisor", project.site_supervisor?.id?.toString() || "");
      setValue("property", project.property?.id?.toString() || project.property?.toString() || "");
    }
  }, [project, setValue]);

  const saveMutation = useMutation({
    mutationFn: (data: ProjectFormData) => {
      const payload: any = {
        title: data.title,
        description: data.description,
        status: data.status,
        current_phase: data.current_phase,
        planned_start_date: data.planned_start_date || null,
        planned_end_date: data.planned_end_date || null,
        estimated_budget: data.estimated_budget ? parseFloat(data.estimated_budget) : 0,
        currency: data.currency,
        project_manager_id: parseInt(data.project_manager),
        site_supervisor_id: data.site_supervisor ? parseInt(data.site_supervisor) : null,
        property: parseInt(data.property),
      };

      console.log("Mutation payload:", payload);
      console.log("Is edit mode:", isEdit);

      if (isEdit) {
        console.log("Calling update API for project ID:", id);
        return adminApi.projects.update(Number(id), payload);
      }
      console.log("Calling create API");
      return adminApi.projects.create(payload);
    },
    onSuccess: () => {
      toast({
        title: isEdit ? "Project updated" : "Project created",
        description: "The project has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      navigate("/admin/projects");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save project",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    // Log the data being submitted for debugging
    console.log("Form data being submitted:", data);
    
    // Validate required fields
    if (!data.project_manager) {
      toast({
        title: "Validation Error",
        description: "Please select a project manager",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.property) {
      toast({
        title: "Validation Error",
        description: "Please select a property",
        variant: "destructive",
      });
      return;
    }
    
    // Log the payload being sent
    const payload: any = {
      title: data.title,
      description: data.description,
      status: data.status,
      current_phase: data.current_phase,
      planned_start_date: data.planned_start_date || null,
      planned_end_date: data.planned_end_date || null,
      estimated_budget: data.estimated_budget ? parseFloat(data.estimated_budget) : 0,
      currency: data.currency,
      project_manager_id: parseInt(data.project_manager),
      site_supervisor_id: data.site_supervisor ? parseInt(data.site_supervisor) : null,
      property: parseInt(data.property),
    };
    
    console.log("Payload being sent to API:", payload);
    
    saveMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{isEdit ? "Edit Project" : "New Project"}</h1>
          <p className="text-muted-foreground">
            {isEdit ? "Update project details" : "Create a new construction project"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Project title and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                {...register("title", { required: "Title is required" })}
                placeholder="e.g., Luxury Villa Construction"
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Detailed project description..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Status and Phase */}
        <Card>
          <CardHeader>
            <CardTitle>Status & Phase</CardTitle>
            <CardDescription>Current project status and construction phase</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Controller
                name="status"
                control={control}
                rules={{ required: "Status is required" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PLANNING">Planning</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_phase">Current Phase *</Label>
              <Controller
                name="current_phase"
                control={control}
                rules={{ required: "Phase is required" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select phase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SITE_PREPARATION">Site Preparation</SelectItem>
                      <SelectItem value="FOUNDATION">Foundation</SelectItem>
                      <SelectItem value="FRAMING">Framing</SelectItem>
                      <SelectItem value="ROOFING">Roofing</SelectItem>
                      <SelectItem value="EXTERIOR">Exterior Work</SelectItem>
                      <SelectItem value="PLUMBING">Plumbing</SelectItem>
                      <SelectItem value="ELECTRICAL">Electrical</SelectItem>
                      <SelectItem value="INSULATION">Insulation</SelectItem>
                      <SelectItem value="DRYWALL">Drywall</SelectItem>
                      <SelectItem value="INTERIOR">Interior Finishes</SelectItem>
                      <SelectItem value="FLOORING">Flooring</SelectItem>
                      <SelectItem value="PAINTING">Painting</SelectItem>
                      <SelectItem value="LANDSCAPING">Landscaping</SelectItem>
                      <SelectItem value="FINAL_INSPECTION">Final Inspection</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
            <CardDescription>Project start and end dates</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="planned_start_date">Planned Start Date</Label>
              <Input
                id="planned_start_date"
                type="date"
                {...register("planned_start_date")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="planned_end_date">Planned End Date</Label>
              <Input
                id="planned_end_date"
                type="date"
                {...register("planned_end_date")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Budget */}
        <Card>
          <CardHeader>
            <CardTitle>Budget</CardTitle>
            <CardDescription>Estimated project budget</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="estimated_budget">Estimated Budget</Label>
              <Input
                id="estimated_budget"
                type="number"
                step="0.01"
                {...register("estimated_budget")}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GHS">GHS (Ghanaian Cedi)</SelectItem>
                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                      <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Team Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Team Assignment</CardTitle>
            <CardDescription>Assign project manager and supervisor</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project_manager">Project Manager *</Label>
              <Controller
                name="project_manager"
                control={control}
                rules={{ required: "Project manager is required" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.first_name} {user.last_name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.project_manager && (
                <p className="text-sm text-destructive">{errors.project_manager.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="site_supervisor">Site Supervisor</Label>
              <Controller
                name="site_supervisor"
                control={control}
                render={({ field }) => (
                  <Select 
                    value={field.value || "none"} 
                    onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supervisor (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {users?.map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.first_name} {user.last_name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Property */}
        <Card>
          <CardHeader>
            <CardTitle>Property</CardTitle>
            <CardDescription>Link project to a property</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="property">Property *</Label>
              <Controller
                name="property"
                control={control}
                rules={{ required: "Property is required" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties?.map((property: any) => (
                        <SelectItem key={property.id} value={property.id.toString()}>
                          {property.title} - {property.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.property && (
                <p className="text-sm text-destructive">{errors.property.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link to="/admin/projects">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending ? "Saving..." : isEdit ? "Update Project" : "Create Project"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ProjectForm;
