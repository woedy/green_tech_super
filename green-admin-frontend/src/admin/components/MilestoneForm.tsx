import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useToast } from "@/components/ui/use-toast";

interface MilestoneFormProps {
  projectId: number;
  milestone?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface MilestoneFormData {
  title: string;
  description: string;
  phase: string;
  planned_start_date: string;
  planned_end_date: string;
  completion_percentage: number;
  estimated_cost: string;
  actual_cost: string;
}

export function MilestoneForm({ projectId, milestone, onSuccess, onCancel }: MilestoneFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!milestone;

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<MilestoneFormData>({
    defaultValues: {
      phase: "SITE_PREPARATION",
      completion_percentage: 0,
      estimated_cost: "0",
      actual_cost: "0",
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (milestone) {
      setValue("title", milestone.title);
      setValue("description", milestone.description || "");
      setValue("phase", milestone.phase);
      setValue("planned_start_date", milestone.planned_start_date || "");
      setValue("planned_end_date", milestone.planned_end_date || "");
      setValue("completion_percentage", milestone.completion_percentage || 0);
      setValue("estimated_cost", milestone.estimated_cost?.toString() || "0");
      setValue("actual_cost", milestone.actual_cost?.toString() || "0");
    }
  }, [milestone, setValue]);

  const saveMutation = useMutation({
    mutationFn: async (data: MilestoneFormData) => {
      const token = localStorage.getItem('admin_access_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const url = isEdit
        ? `${apiUrl}/api/construction/admin/projects/${projectId}/milestones/${milestone.id}/`
        : `${apiUrl}/api/construction/admin/projects/${projectId}/milestones/`;

      const payload = {
        ...data,
        estimated_cost: data.estimated_cost ? parseFloat(data.estimated_cost) : 0,
        actual_cost: data.actual_cost ? parseFloat(data.actual_cost) : 0,
        completion_percentage: parseInt(data.completion_percentage.toString()),
      };

      console.log('Creating milestone with payload:', payload);
      console.log('URL:', url);

      const response = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      
      // Get response text first to handle both JSON and non-JSON responses
      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (!response.ok) {
        let errorMessage = 'Failed to save milestone';
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.detail || error.message || JSON.stringify(error);
          
          // Handle specific error cases
          if (responseText.includes('duplicate key') || responseText.includes('unique constraint')) {
            errorMessage = 'A milestone with this title already exists for this project. Please use a different title.';
          }
        } catch (e) {
          // Check for duplicate key in plain text response
          if (responseText.includes('duplicate key') || responseText.includes('unique constraint')) {
            errorMessage = 'A milestone with this title already exists for this project. Please use a different title.';
          } else {
            errorMessage = responseText || `Server error: ${response.status}`;
          }
        }
        throw new Error(errorMessage);
      }

      // Parse JSON response if there is content
      if (responseText) {
        try {
          return JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse response as JSON:', responseText);
          throw new Error('Invalid JSON response from server');
        }
      }
      
      return null;
    },
    onSuccess: () => {
      toast({
        title: isEdit ? "Milestone updated" : "Milestone created",
        description: "The milestone has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["project-milestones", projectId] });
      queryClient.invalidateQueries({ queryKey: ["admin-project", projectId] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save milestone",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MilestoneFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          {...register("title", { required: "Title is required" })}
          placeholder="e.g., Foundation Work"
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
          placeholder="Detailed description of the milestone..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phase">Phase *</Label>
          <Controller
            name="phase"
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
          {errors.phase && (
            <p className="text-sm text-destructive">{errors.phase.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="completion_percentage">Completion % *</Label>
          <Input
            id="completion_percentage"
            type="number"
            min="0"
            max="100"
            {...register("completion_percentage", {
              required: "Completion percentage is required",
              min: { value: 0, message: "Must be at least 0" },
              max: { value: 100, message: "Must be at most 100" },
            })}
          />
          {errors.completion_percentage && (
            <p className="text-sm text-destructive">{errors.completion_percentage.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="planned_start_date">Planned Start Date</Label>
          <Input
            id="planned_start_date"
            type="date"
            {...register("planned_start_date")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="planned_end_date">Planned End Date *</Label>
          <Input
            id="planned_end_date"
            type="date"
            {...register("planned_end_date", { required: "End date is required" })}
          />
          {errors.planned_end_date && (
            <p className="text-sm text-destructive">{errors.planned_end_date.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estimated_cost">Estimated Cost</Label>
          <Input
            id="estimated_cost"
            type="number"
            step="0.01"
            min="0"
            {...register("estimated_cost")}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="actual_cost">Actual Cost</Label>
          <Input
            id="actual_cost"
            type="number"
            step="0.01"
            min="0"
            {...register("actual_cost")}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : isEdit ? "Update Milestone" : "Create Milestone"}
        </Button>
      </div>
    </form>
  );
}
