import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  MessageSquare, 
  CheckCircle2, 
  AlertTriangle,
  Calendar,
  DollarSign,
  Building2,
  Users
} from "lucide-react";

export interface ActivityItem {
  id: string;
  type: 'lead_created' | 'quote_received' | 'project_update' | 'milestone_completed' | 'document_uploaded' | 'message_received' | 'payment_due';
  title: string;
  description: string;
  timestamp: string;
  project_id?: number;
  project_title?: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
}

const activityIcons = {
  lead_created: Users,
  quote_received: DollarSign,
  project_update: Building2,
  milestone_completed: CheckCircle2,
  document_uploaded: FileText,
  message_received: MessageSquare,
  payment_due: AlertTriangle,
};

const activityColors = {
  lead_created: 'text-blue-500',
  quote_received: 'text-emerald-500',
  project_update: 'text-blue-500',
  milestone_completed: 'text-green-500',
  document_uploaded: 'text-purple-500',
  message_received: 'text-orange-500',
  payment_due: 'text-red-500',
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
};

export function ActivityFeed({ activities, maxItems = 10 }: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems);

  if (displayedActivities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No recent activity</p>
        <p className="text-sm">Your project updates will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayedActivities.map((activity) => {
        const Icon = activityIcons[activity.type];
        const colorClass = activityColors[activity.type];
        
        return (
          <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
            <div className={`p-2 rounded-full bg-background border ${colorClass}`}>
              <Icon className="h-4 w-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{activity.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                  
                  {activity.project_title && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {activity.project_title}
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTimestamp(activity.timestamp)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {activities.length > maxItems && (
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            Showing {maxItems} of {activities.length} activities
          </p>
        </div>
      )}
    </div>
  );
}
