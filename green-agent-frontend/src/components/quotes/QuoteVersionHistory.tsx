import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, CheckCircle2, Send, Eye, XCircle } from "lucide-react";
import { QuoteTimelineEntry, QuoteStatus } from "@/types/quote";

interface QuoteVersionHistoryProps {
  timeline: QuoteTimelineEntry[];
  currentStatus: QuoteStatus;
}

const STATUS_CONFIG: Record<QuoteStatus, { icon: typeof Clock; color: string; bgColor: string }> = {
  draft: { icon: Clock, color: "text-gray-600", bgColor: "bg-gray-100" },
  sent: { icon: Send, color: "text-blue-600", bgColor: "bg-blue-100" },
  viewed: { icon: Eye, color: "text-purple-600", bgColor: "bg-purple-100" },
  accepted: { icon: CheckCircle2, color: "text-green-600", bgColor: "bg-green-100" },
  declined: { icon: XCircle, color: "text-red-600", bgColor: "bg-red-100" },
};

export function QuoteVersionHistory({ timeline, currentStatus }: QuoteVersionHistoryProps) {
  const sortedTimeline = [...timeline].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Quote History</span>
          <Badge variant="outline">{timeline.length} events</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {sortedTimeline.map((entry, index) => {
              const config = STATUS_CONFIG[entry.status as QuoteStatus];
              const Icon = config.icon;
              const { date, time } = formatDate(entry.timestamp);
              const isLatest = index === 0;

              return (
                <div key={`${entry.status}-${entry.timestamp}`} className="relative">
                  {index < sortedTimeline.length - 1 && (
                    <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-border" />
                  )}
                  <div className="flex gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{entry.label}</span>
                        {isLatest && (
                          <Badge variant="secondary" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {date} at {time}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
