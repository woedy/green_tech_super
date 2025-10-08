import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  MessageSquare, 
  CheckCircle2, 
  AlertTriangle,
  Calendar,
  DollarSign,
  Building2
} from "lucide-react";

export interface ActivityItem {
  id: string;
  type: 'project_update' | 'quote_received' | 'milestone_completed' | 'document_uploaded' | 'message_received' | 'payment_due';
  title: string;
  description: string;
  timestamp: string;
  projectId?: number;
  projectTitle?: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
}

const activityIcons = {
  project_update: Building2,
  quote_received: DollarSign,
  milestone_completed: CheckCircle2,
  document_uploaded: FileText,
  message_received: MessageSquare,
  payment_due: AlertTriangle,
};

const activityColors = {
  project_update: 'text-blue-500',
  quote_received: 'text-emerald-500',
  milestone_completed: 'text-green-500',
  document_uploaded: 'text-purple-500',
  message_received: 'text-amber-500',
  payment_due: 'text-red-500',
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export const ActivityFeed = ({ activities, maxItems = 10 }: ActivityFeedProps) => {
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayedActivities.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            No recent activity to display
          </div>
        ) : (
          <div className="space-y-4">
            {displayedActivities.map((activity) => {
              const Icon = activityIcons[activity.type];
              const colorClass = activityColors[activity.type];

              return (
                <div key={activity.id} className="flex gap-3 pb-4 border-b last:border-0 last:pb-0">
                  <div className={`p-2 rounded-lg bg-muted/50 h-fit ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{activity.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                        {activity.projectTitle && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {activity.projectTitle}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatTimestamp(activity.timestamp)}
                      </span>
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
