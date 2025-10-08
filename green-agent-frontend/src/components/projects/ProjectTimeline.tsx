import { useMemo } from "react";
import { Calendar, CheckCircle, Clock, AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProjectMilestoneItem } from "@/types/project";

interface ProjectTimelineProps {
  milestones: ProjectMilestoneItem[];
  currentPhase: string;
  progressPercentage: number;
}

export default function ProjectTimeline({ milestones, currentPhase, progressPercentage }: ProjectTimelineProps) {
  const sortedMilestones = useMemo(() => {
    return [...milestones].sort((a, b) => {
      const dateA = a.due_date || a.planned_end_date || '';
      const dateB = b.due_date || b.planned_end_date || '';
      return dateA.localeCompare(dateB);
    });
  }, [milestones]);

  const getStatusIcon = (milestone: ProjectMilestoneItem) => {
    if (milestone.status === 'completed') {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (milestone.is_overdue) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
    if (milestone.is_due_soon) {
      return <Clock className="h-4 w-4 text-yellow-600" />;
    }
    return <Calendar className="h-4 w-4 text-gray-400" />;
  };

  const getStatusVariant = (milestone: ProjectMilestoneItem) => {
    if (milestone.status === 'completed') return 'default';
    if (milestone.is_overdue) return 'destructive';
    if (milestone.is_due_soon) return 'secondary';
    return 'outline';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Project Timeline</span>
          <div className="text-sm text-muted-foreground">
            {currentPhase} • {Math.round(progressPercentage)}% Complete
          </div>
        </CardTitle>
        <Progress value={progressPercentage} className="w-full" />
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedMilestones.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No milestones scheduled
          </div>
        ) : (
          <div className="space-y-3">
            {sortedMilestones.map((milestone, index) => (
              <div key={milestone.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  {getStatusIcon(milestone)}
                  {index < sortedMilestones.length - 1 && (
                    <div className="w-px h-8 bg-border mt-2" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium text-sm">{milestone.title}</h4>
                    <Badge variant={getStatusVariant(milestone)} className="text-xs">
                      {milestone.is_overdue ? 'Overdue' : 
                       milestone.is_due_soon ? 'Due Soon' : 
                       milestone.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {milestone.phase && (
                      <span className="mr-2">Phase: {milestone.phase}</span>
                    )}
                    {(milestone.due_date || milestone.planned_end_date) && (
                      <span>
                        Due: {new Date(milestone.due_date || milestone.planned_end_date!).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {(milestone.progress || milestone.completion_percentage) && (
                    <div className="mt-2">
                      <Progress 
                        value={milestone.progress || milestone.completion_percentage || 0} 
                        className="h-1" 
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}