import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Building2, Calendar, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import type { ProjectSummary } from "@/types/project";

interface ProjectStatusCardProps {
  project: ProjectSummary;
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completed: 'default',
  in_progress: 'secondary',
  planning: 'outline',
  on_hold: 'destructive',
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
};

export const ProjectStatusCard = ({ project }: ProjectStatusCardProps) => {
  const badgeVariant = statusVariant[project.status.toLowerCase()] ?? 'secondary';
  const endDate = formatDate(project.planned_end_date);

  return (
    <Card className="shadow-soft hover:shadow-medium smooth-transition">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">{project.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
            </div>
          </div>
          <Badge variant={badgeVariant} className="capitalize shrink-0">
            {project.status_display ?? project.status.replace(/_/g, ' ').toLowerCase()}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(project.progress_percentage)}%</span>
          </div>
          <Progress value={Math.round(project.progress_percentage)} className="h-2" />
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Phase: {project.phase_display ?? project.current_phase.replace(/_/g, ' ')}</span>
            </div>
            {endDate && (
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>Due: {endDate}</span>
              </div>
            )}
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to={`/account/projects/${project.id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
