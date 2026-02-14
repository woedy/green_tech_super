import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MilestoneForm } from "./MilestoneForm";

interface MilestoneListProps {
  projectId: number;
}

export function MilestoneList({ projectId }: MilestoneListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingMilestone, setEditingMilestone] = useState<any | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  console.log('MilestoneList projectId:', projectId, 'type:', typeof projectId);

  const { data: milestonesResponse, isLoading, error } = useQuery({
    queryKey: ["project-milestones", projectId],
    queryFn: async () => {
      const token = localStorage.getItem('admin_access_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const url = `${apiUrl}/api/construction/admin/projects/${projectId}/milestones/`;
      
      console.log('Fetching milestones from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('Milestones response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Milestones fetch error:', errorText);
        throw new Error('Failed to fetch milestones');
      }
      
      const data = await response.json();
      console.log('Milestones data:', data);
      return data;
    },
    enabled: !!projectId,
  });

  // Extract milestones array from paginated response
  const milestones = milestonesResponse?.results || milestonesResponse || [];

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem('admin_access_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(
        `${apiUrl}/api/construction/admin/projects/${projectId}/milestones/${id}/`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to delete milestone');
    },
    onSuccess: () => {
      toast({ title: "Milestone deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["project-milestones", projectId] });
      queryClient.invalidateQueries({ queryKey: ["admin-project", projectId] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete milestone",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const token = localStorage.getItem('admin_access_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(
        `${apiUrl}/api/construction/admin/projects/${projectId}/milestones/${id}/update_status/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      );
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Status updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["project-milestones", projectId] });
      queryClient.invalidateQueries({ queryKey: ["admin-project", projectId] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NOT_STARTED: "bg-gray-100 text-gray-800",
      IN_PROGRESS: "bg-blue-100 text-blue-800",
      ON_HOLD: "bg-yellow-100 text-yellow-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const handleEdit = (milestone: any) => {
    setEditingMilestone(milestone);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingMilestone(null);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingMilestone(null);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading milestones...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Error loading milestones: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Project Milestones</h3>
          <p className="text-sm text-muted-foreground">
            {milestones?.length || 0} milestone(s)
          </p>
        </div>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Milestone
        </Button>
      </div>

      {milestones && milestones.length > 0 ? (
        <div className="space-y-3">
          {milestones.map((milestone: any) => {
            const isOverdue = milestone.planned_end_date && 
              new Date(milestone.planned_end_date) < new Date() && 
              milestone.status !== 'COMPLETED';

            return (
              <div key={milestone.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{milestone.title}</h4>
                      {isOverdue && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground">{milestone.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(milestone.status)}>
                      {milestone.status_display}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEdit(milestone)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Milestone?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{milestone.title}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(milestone.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-muted-foreground">Phase:</span>
                    <div className="font-medium">{milestone.phase_display}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Due Date:</span>
                    <div className="font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {milestone.planned_end_date
                        ? new Date(milestone.planned_end_date).toLocaleDateString()
                        : "Not set"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Budget:</span>
                    <div className="font-medium">
                      ${Number(milestone.estimated_cost || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Spent:</span>
                    <div className="font-medium">
                      ${Number(milestone.actual_cost || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{milestone.completion_percentage}%</span>
                  </div>
                  <Progress value={milestone.completion_percentage} />
                </div>

                {milestone.status !== 'COMPLETED' && milestone.status !== 'CANCELLED' && (
                  <div className="mt-3 flex gap-2">
                    {milestone.status === 'NOT_STARTED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({
                          id: milestone.id,
                          status: 'IN_PROGRESS'
                        })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Start Milestone
                      </Button>
                    )}
                    {milestone.status === 'IN_PROGRESS' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({
                            id: milestone.id,
                            status: 'COMPLETED'
                          })}
                          disabled={updateStatusMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({
                            id: milestone.id,
                            status: 'ON_HOLD'
                          })}
                          disabled={updateStatusMutation.isPending}
                        >
                          Pause
                        </Button>
                      </>
                    )}
                    {milestone.status === 'ON_HOLD' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({
                          id: milestone.id,
                          status: 'IN_PROGRESS'
                        })}
                        disabled={updateStatusMutation.isPending}
                      >
                        Resume
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">
            No milestones yet. Add your first milestone to start tracking progress.
          </p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Milestone
          </Button>
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMilestone ? "Edit Milestone" : "Create Milestone"}
            </DialogTitle>
            <DialogDescription>
              {editingMilestone
                ? "Update milestone details and track progress"
                : "Add a new milestone to track project progress"}
            </DialogDescription>
          </DialogHeader>
          <MilestoneForm
            projectId={projectId}
            milestone={editingMilestone}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
