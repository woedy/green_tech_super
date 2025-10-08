import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Bell, BellOff, Trash2, ExternalLink } from "lucide-react";
import type { SavedSearch } from "@/lib/savedSearches";

interface SavedSearchesWidgetProps {
  searches: SavedSearch[];
  onToggleAlerts: (id: string) => void;
  onDelete: (id: string) => void;
  onApply: (search: SavedSearch) => void;
  maxItems?: number;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

const getFilterSummary = (filters: Record<string, unknown>) => {
  const parts: string[] = [];
  
  if (filters.q) parts.push(`"${filters.q}"`);
  if (filters.type && filters.type !== 'all') parts.push(`Type: ${filters.type}`);
  if (filters.location && filters.location !== 'all') parts.push(`Location: ${filters.location}`);
  if (filters.minPrice) parts.push(`Min: ${filters.minPrice}`);
  if (filters.maxPrice) parts.push(`Max: ${filters.maxPrice}`);
  
  return parts.length > 0 ? parts.join(' • ') : 'All properties';
};

export const SavedSearchesWidget = ({
  searches,
  onToggleAlerts,
  onDelete,
  onApply,
  maxItems = 5,
}: SavedSearchesWidgetProps) => {
  const displayedSearches = searches.slice(0, maxItems);
  const hasMore = searches.length > maxItems;

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Saved Searches
          {searches.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {searches.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayedSearches.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            <Search className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p>No saved searches yet</p>
            <p className="text-xs mt-1">Save searches from the properties page to get alerts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedSearches.map((search) => {
              const hasAlerts = search.alerts ?? false;
              
              return (
                <div
                  key={search.id}
                  className="p-3 rounded-lg border bg-muted/20 hover:bg-muted/30 smooth-transition"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{search.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {getFilterSummary(search.filters)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Saved {formatDate(search.createdAt)}
                      </p>
                    </div>
                    <Badge 
                      variant={hasAlerts ? 'default' : 'outline'}
                      className="shrink-0"
                    >
                      {hasAlerts ? (
                        <>
                          <Bell className="w-3 h-3 mr-1" />
                          Alerts On
                        </>
                      ) : (
                        <>
                          <BellOff className="w-3 h-3 mr-1" />
                          Alerts Off
                        </>
                      )}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onApply(search)}
                      className="flex-1"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Apply Search
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleAlerts(search.id)}
                      title={hasAlerts ? 'Disable alerts' : 'Enable alerts'}
                    >
                      {hasAlerts ? (
                        <BellOff className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(search.id)}
                      title="Delete search"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
            
            {hasMore && (
              <Button variant="link" className="w-full text-xs" asChild>
                <a href="/account/saved-searches">
                  View all {searches.length} saved searches
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
