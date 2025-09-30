import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProjectTask, ProjectTaskStatus } from "@/types/project";

const statusOptions: { value: ProjectTaskStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "completed", label: "Completed" },
];

const statusLabels: Record<ProjectTaskStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  blocked: "Blocked",
};

const statusVariants: Record<ProjectTaskStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  in_progress: "default",
  blocked: "destructive",
  completed: "outline",
};

type Props = {
  tasks: ProjectTask[];
  isLoading?: boolean;
  onUpdateStatus: (taskId: string, status: ProjectTaskStatus) => void;
};

export default function ProjectTasksPanel({ tasks, isLoading, onUpdateStatus }: Props) {
  const [status, setStatus] = useState<ProjectTaskStatus | "all">("all");
  const [showActionable, setShowActionable] = useState(false);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (status !== "all" && task.status !== status) {
        return false;
      }
      if (showActionable && !(task.requires_customer_action || task.is_overdue || task.status !== "completed")) {
        return false;
      }
      return true;
    });
  }, [tasks, status, showActionable]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle className="text-lg font-semibold">Tasks</CardTitle>
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={status} onValueChange={(value) => setStatus(value as ProjectTaskStatus | "all") }>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={showActionable ? "default" : "outline"}
            onClick={() => setShowActionable((prev) => !prev)}
            size="sm"
          >
            {showActionable ? "Showing Actionable" : "Actionable Only"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <div className="text-sm text-muted-foreground">Loading tasks…</div>}
        {!isLoading && filteredTasks.length === 0 && (
          <div className="text-sm text-muted-foreground">No tasks match the current filters.</div>
        )}
        {!isLoading && filteredTasks.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <div className="font-medium flex items-center gap-2">
                      {task.title}
                      {task.requires_customer_action && <Badge variant="destructive">Customer</Badge>}
                      {task.is_overdue && <Badge variant="destructive">Overdue</Badge>}
                    </div>
                    {task.description && <div className="text-xs text-muted-foreground mt-1">{task.description}</div>}
                  </TableCell>
                  <TableCell>{task.due_date ? new Date(task.due_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>{task.assigned_to?.name ?? "Unassigned"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[task.status]}>{statusLabels[task.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Select value={task.status} onValueChange={(value) => onUpdateStatus(task.id, value as ProjectTaskStatus)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.filter((option) => option.value !== "all").map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
