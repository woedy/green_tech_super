import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import type { ProjectTimelineMilestone } from "@/types/project";

interface ProjectTimelineProps {
  milestones: ProjectTimelineMilestone[];
  projectTitle?: string;
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'TBD';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'TBD';
  return date.toLocaleDateString();
};

const getMilestoneIcon = (status: string, isOnTrack: boolean) => {
  const statusLower = status.toLowerCase();
  
  if (statusLower === 'completed') {
    return <CheckCircle2 className="w-5 h-5 text-green-500" />;
  }
  
  if (statusLower === 'in_progress') {
    return isOnTrack ? (
      <Clock className="w-5 h-5 text-blue-500" />
    ) : (
      <AlertCircle className="w-5 h-5 text-amber-500" />
    );
  }
  
  return <Circle className="w-5 h-5 text-muted-foreground" />;
};

const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const statusLower = status.toLowerCase();
  if (statusLower === 'completed') return 'default';
  if (statusLower === 'in_progress') return 'secondary';
  if (statusLower === 'delayed') return 'destructive';
  return 'outline';
};

export const ProjectTimeline = ({ milestones, projectTitle }: ProjectTimelineProps) => {
  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle>
          {projectTitle ? `${projectTitle} - Timeline` : 'Project Timeline'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {milestones.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            No milestones defined yet
          </div>
        ) : (
          <div className="space-y-6">
            {milestones.map((milestone, index) => {
              const isLast = index === milestones.length - 1;
              const icon = getMilestoneIcon(milestone.status, milestone.is_on_track);
              const badgeVariant = getStatusBadgeVariant(milestone.status);

              return (
                <div key={milestone.id} className="relative">
                  {/* Connecting line */}
                  {!isLast && (
                    <div className="absolute left-[10px] top-8 bottom-0 w-0.5 bg-border" />
                  )}
                  
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className="relative z-10 bg-background">
                      {icon}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 pb-6">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-base">{milestone.title}</h4>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <span>{formatDate(milestone.start_date)}</span>
                            <span>→</span>
                            <span>{formatDate(milestone.end_date)}</span>
                          </div>
                        </div>
                        <Badge variant={badgeVariant} className="capitalize shrink-0">
                          {milestone.status.replace(/_/g, ' ').toLowerCase()}
                        </Badge>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="space-y-1 mt-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{milestone.completion_percentage}%</span>
                        </div>
                        <Progress value={milestone.completion_percentage} className="h-1.5" />
                      </div>
                      
                      {/* Status indicators */}
                      {!milestone.is_on_track && milestone.status.toLowerCase() === 'in_progress' && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                          <AlertCircle className="w-3 h-3" />
                          <span>Behind schedule</span>
                        </div>
                      )}
                      
                      {/* Dependencies indicator */}
                      {milestone.dependencies && milestone.dependencies.length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Depends on {milestone.dependencies.length} milestone{milestone.dependencies.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
